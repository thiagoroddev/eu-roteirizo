import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { cpus, platform, release } from "node:os";
import { join, resolve } from "node:path";
import "fake-indexeddb/auto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_FUNDAMENTAL_EXPERIMENT_CONFIG,
  MULTI_START_STRATEGIES,
  clearFundamentalExperimentCaches,
  runMultiStartFundamentalExperiment,
  type MultiStartAttempt,
  type MultiStartFundamentalExperimentResult,
} from "./fundamentalExperiment";
import { createExperimentalRoutePayload, experimentalWinnerFileName, renderExperimentMapHtml, validateExperimentalPayload } from "./experimentArtifacts";
import { evaluateCompleteWalking, evaluateLimitedFundamentalCircuit, evaluateVehicleOrder, MAX_CACHED_STREET_PATHS, type PathCollection } from "./experimentPaths";
import { buildFundamentalReferences } from "./fundamentals";
import { hash, loadCorpus, loadSnapshots, selectCorpusCaseByRouteNumber, type CorpusCase } from "./corpus";
import { importRoutePayload, parseAndValidateRouteJson } from "../../src/services/routeExport";
import { clearManifests, getRouteRows } from "../../src/services/manifestStorage";
import { clearRoteiros, getRoteiro } from "../../src/services/routeStorage";
import { buildDeliveryPoints } from "../../src/utils/routing/points";
import { createInitialBuilderState, routeBuilderReducer } from "../../src/utils/routing/builder";
import { pedestrianGraph } from "../../src/utils/routing/pedestrian";
import type { RoadGraph } from "../../src/utils/routing/graph";
import type { LatLng, RouteStop } from "../../src/types/routing";
import { DEFAULT_ROUTING_CONFIG } from "../../src/types/routing";
import { pointDeliverySeconds } from "../../src/utils/routing/estimates";
import { footCircuitPath } from "../../src/utils/routing/routePath";
import { haversine } from "../../src/utils/routing/geo";

const SEARCH_RADIUS_METERS = 60;
const CIRCUIT_LIMIT_METERS = 120;
const ROUTE_NUMBER = process.env.FUNDAMENTAL_CASE?.trim() ?? "";
if (!/^[12]$/.test(ROUTE_NUMBER)) throw new Error('Set FUNDAMENTAL_CASE to "1" or "2"; each command evaluates one route only.');

const corpus = loadCorpus();
const entry = selectCorpusCaseByRouteNumber(corpus, ROUTE_NUMBER);
const snapshots = loadSnapshots(corpus);
const runId = `roteiro-${ROUTE_NUMBER}-${new Date().toISOString().replaceAll(/[:.]/g, "-")}`;
const outputDir = resolve(".mentor-saidas/auto-fundamentals", runId);
const importableDir = join(outputDir, "importaveis");
const mapDir = join(outputDir, "mapas");
const importableFiles: Record<string, unknown>[] = [];
let experiment: MultiStartFundamentalExperimentResult | null = null;
let manual: ReturnType<typeof manualEvaluation> = null;
let engineMs: number | null = null;
let networkAttempts = 0;
let allChecksPassed = true;
let completed = false;
const startedAt = performance.now();
let gitVersion = "unavailable";
try {
  gitVersion = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
} catch {
  /* Source hashes still identify this local execution when Git is unavailable. */
}

const config = {
  ...DEFAULT_FUNDAMENTAL_EXPERIMENT_CONFIG,
  searchRadiusMeters: SEARCH_RADIUS_METERS,
  circuitLimitMeters: CIRCUIT_LIMIT_METERS,
  maxGroupOperations: entry.points.length * DEFAULT_FUNDAMENTAL_EXPERIMENT_CONFIG.maxCandidatesPerGroup * DEFAULT_FUNDAMENTAL_EXPERIMENT_CONFIG.maxRefinementPasses,
};

const check = (condition: boolean, message: string): void => {
  if (!condition) allChecksPassed = false;
  expect(condition, message).toBe(true);
};

const samePosition = (left: LatLng, right: LatLng): boolean => Math.abs(left.lat - right.lat) < 1e-10 && Math.abs(left.lng - right.lng) < 1e-10;

const manualEvaluation = (caseEntry: CorpusCase, graph: RoadGraph, pedGraph: RoadGraph) => {
  const reference = caseEntry.reference;
  if (!reference) return null;
  const byId = new Map(caseEntry.points.map((point) => [point.id, point]));
  const refs = new Map(buildFundamentalReferences(caseEntry.points, graph).references.map((fundamental) => [fundamental.pointId, fundamental]));
  const stops = reference.route.stops.map((stop: RouteStop) => {
    const members = stop.pointIds.map((id) => refs.get(id)).filter((fundamental): fundamental is NonNullable<typeof fundamental> => !!fundamental);
    const limited = evaluateLimitedFundamentalCircuit(pedGraph, stop.vehicleStop, members, CIRCUIT_LIMIT_METERS);
    const completeWalking = evaluateCompleteWalking(pedGraph, stop.vehicleStop, members);
    return {
      order: stop.order,
      pointCount: stop.pointIds.length,
      packageCount: stop.pointIds.reduce((sum, id) => sum + (byId.get(id)?.packageCount ?? 0), 0),
      limitedCircuitMeters: limited.distanceMeters,
      limitedCircuitWithinLimit: limited.valid && !limited.exceedsLimit,
      fullWalkingMeters: completeWalking.distanceMeters,
      accessMeters: completeWalking.estimatedAccessMeters,
      validPaths: limited.valid && completeWalking.valid,
      storedRadiusMeters: stop.radiusMeters,
      memberFundamentals: members.length,
      currentAppWalkingMeters: footCircuitPath(pedGraph, stop.vehicleStop, stop.pointIds.map((id) => byId.get(id)!).filter(Boolean)).distanceMeters,
    };
  });
  // Keep the route interior comparable: both the human reference and generated
  // candidates start at their first represented delivery. The stored external
  // human approach is reported separately below.
  const vehicle = evaluateVehicleOrder(
    graph,
    null,
    reference.route.stops.map((stop) => stop.vehicleStop)
  );
  const assigned = reference.route.stops.flatMap((stop) => stop.pointIds);
  const fullWalkingMeters = stops.reduce((total, stop) => total + stop.fullWalkingMeters, 0);
  const completeCoverage = assigned.length === caseEntry.points.length && new Set(assigned).size === caseEntry.points.length && (reference.route.ignoredPointIds?.length ?? 0) === 0;
  const modeledTimeSeconds =
    (vehicle.distanceMeters / 1000 / DEFAULT_ROUTING_CONFIG.vehicleSpeedKmh) * 3600 +
    (fullWalkingMeters / 1000 / DEFAULT_ROUTING_CONFIG.walkingSpeedKmh) * 3600 +
    caseEntry.points.reduce((total, point) => total + pointDeliverySeconds(point, DEFAULT_ROUTING_CONFIG), 0);
  return {
    stopCount: reference.route.stops.length,
    stops,
    vehicleDistanceMeters: vehicle.distanceMeters,
    vehicleValid: vehicle.valid,
    fullWalkingMeters,
    modeledTimeSeconds,
    completeCoverage,
    comparable: completeCoverage && vehicle.valid && stops.every((stop) => stop.validPaths),
    externalApproach: reference.route.startPoint && reference.route.stops[0] ? evaluateVehicleOrder(graph, reference.route.startPoint, [reference.route.stops[0].vehicleStop]) : null,
  };
};

/** Independent geometric accounting, including access legs, against frozen coordinates. */
const verifyTrace = (collection: PathCollection, label: string): void => {
  const geometricMeters = collection.legs.reduce((total, leg) => total + leg.path.slice(1).reduce((meters, point, index) => meters + haversine(leg.path[index], point), 0), 0);
  if (collection.valid) check(Math.abs(collection.distanceMeters - geometricMeters) <= Math.max(0.1, geometricMeters * 0.001), `${label}: cost/geometry mismatch`);
  else check(collection.path.length === 0 && collection.legs.some((leg) => leg.kind === "missing"), `${label}: incomplete path must not draw a bridge`);
};

const attemptRecord = (attempt: MultiStartAttempt) => ({
  strategy: attempt.strategy,
  startPointId: attempt.startPointId,
  startPoint: attempt.startPoint,
  firstStopContainsStart: attempt.solution.groups[0]?.pointIds.includes(attempt.startPointId) ?? false,
  initialGroupCount: attempt.initialGroupCount,
  definitionsEvaluated: attempt.definitionsEvaluated,
  definitionLimitReached: attempt.definitionLimitReached,
  status: attempt.solution.status,
  stopCount: attempt.solution.groups.length,
  pendingPointIds: attempt.solution.pendingPointIds,
  vehicleDistanceMeters: attempt.solution.vehicleDistanceMeters,
  limitedCircuitMeters: attempt.solution.limitedCircuitMeters,
  fullWalkingMeters: attempt.solution.fullWalkingMeters,
  accessMeters: attempt.solution.accessMeters,
  modeledTimeSeconds: attempt.solution.modeledTimeSeconds,
  worstCircuitMeters: Math.max(0, ...attempt.solution.groups.map((group) => group.limitedCircuitMeters)),
  operationsEvaluated: attempt.solution.operationsEvaluated,
  workLimitReached: attempt.solution.workLimitReached,
  signature: attempt.solution.signature,
  diagnostics: attempt.solution.diagnostics,
});

const verifyAttempt = (caseEntry: CorpusCase, attempt: MultiStartAttempt): void => {
  const memberIds = attempt.solution.groups.flatMap((group) => group.pointIds);
  check(attempt.solution.pendingPointIds.length === 0, `${caseEntry.id}/${attempt.strategy}/${attempt.startPointId}: no orphan delivery`);
  check(memberIds.length === caseEntry.points.length, `${caseEntry.id}/${attempt.strategy}/${attempt.startPointId}: membership count`);
  check(new Set(memberIds).size === caseEntry.points.length, `${caseEntry.id}/${attempt.strategy}/${attempt.startPointId}: unique membership`);
  check(attempt.solution.groups[0]?.pointIds.includes(attempt.startPointId) ?? false, `${caseEntry.id}/${attempt.strategy}/${attempt.startPointId}: start belongs to first stop`);
  check(
    !!attempt.solution.vehicle.legs[0] && samePosition(attempt.solution.vehicle.legs[0].from, attempt.startPoint),
    `${caseEntry.id}/${attempt.strategy}/${attempt.startPointId}: vehicle begins at candidate`
  );
  check(
    attempt.solution.groups.every((group) => group.limitedCircuitMeters <= CIRCUIT_LIMIT_METERS + 1e-6 || attempt.solution.status === "partial"),
    `${caseEntry.id}/${attempt.strategy}/${attempt.startPointId}: circuit limit`
  );
  verifyTrace(attempt.solution.vehicle, `${caseEntry.id}/${attempt.strategy}/${attempt.startPointId}: vehicle`);
  for (const group of attempt.solution.groups) {
    verifyTrace(group.limitedCircuit, `${caseEntry.id}/${attempt.strategy}/${attempt.startPointId}: limited`);
    verifyTrace(group.completeWalking, `${caseEntry.id}/${attempt.strategy}/${attempt.startPointId}: complete`);
    check(
      Math.abs(group.fullWalkingMeters - group.limitedCircuitMeters - group.accessMeters) < 0.1 || !group.completeWalking.valid,
      `${caseEntry.id}/${attempt.strategy}/${attempt.startPointId}: access counted exactly once`
    );
  }
};

const verifyArtifact = async (caseEntry: CorpusCase, winner: MultiStartAttempt): Promise<void> => {
  const file = experimentalWinnerFileName({
    routeNumber: ROUTE_NUMBER,
    strategy: winner.strategy,
    searchRadiusMeters: SEARCH_RADIUS_METERS,
    circuitLimitMeters: CIRCUIT_LIMIT_METERS,
  });
  const payload = createExperimentalRoutePayload({
    runId,
    caseId: caseEntry.id,
    routeNumber: ROUTE_NUMBER,
    strategy: winner.strategy,
    startPointId: winner.startPointId,
    startPoint: winner.startPoint,
    variant: winner.solution.variant,
    objective: "vehicleDistance",
    sourcePoints: caseEntry.points,
    sourceRows: caseEntry.rows,
    solution: winner.solution,
    config,
  });
  check(validateExperimentalPayload(payload, caseEntry.points), `${caseEntry.id}/${winner.strategy}: artifact conservation`);
  check(payload.route.stops[0]?.pointIds.includes(winner.startPointId) ?? false, `${caseEntry.id}/${winner.strategy}: artifact keeps first stop`);
  check(!!payload.route.startPoint && samePosition(payload.route.startPoint, winner.startPoint), `${caseEntry.id}/${winner.strategy}: artifact keeps start point`);
  const serialized = JSON.stringify(payload);
  const parsed = parseAndValidateRouteJson(serialized);
  check(parsed.ok, `${caseEntry.id}/${winner.strategy}: artifact parser`);
  if (!parsed.ok) return;
  const imported = await importRoutePayload(parsed.payload, new TextEncoder().encode(serialized).buffer);
  check(imported.ok, `${caseEntry.id}/${winner.strategy}: artifact importer`);
  const saved = await getRoteiro(payload.manifestId, payload.routeName);
  const savedRows = await getRouteRows(payload.manifestId, payload.routeName);
  check(saved !== null && savedRows !== null, `${caseEntry.id}/${winner.strategy}: artifact storage`);
  if (!saved || !savedRows) return;
  check(hash(JSON.stringify(savedRows)) === hash(JSON.stringify(caseEntry.rows)), `${caseEntry.id}/${winner.strategy}: artifact rows changed`);
  const state = routeBuilderReducer(createInitialBuilderState(buildDeliveryPoints(savedRows)), { type: "HYDRATE", route: saved });
  check(hash(JSON.stringify(state.stops)) === hash(JSON.stringify(payload.route.stops)), `${caseEntry.id}/${winner.strategy}: artifact hydration changed stops`);
  check(!importableFiles.some((candidate) => candidate.manifestId === payload.manifestId), `${caseEntry.id}/${winner.strategy}: unique artifact identity`);
  writeFileSync(join(importableDir, file), serialized, { flag: "wx" });
  importableFiles.push({
    routeNumber: ROUTE_NUMBER,
    caseId: caseEntry.id,
    file,
    sha256: hash(serialized),
    strategy: winner.strategy,
    startPointId: winner.startPointId,
    manifestId: payload.manifestId,
    status: winner.solution.status,
    vehicleDistanceMeters: winner.solution.vehicleDistanceMeters,
    modeledTimeSeconds: winner.solution.modeledTimeSeconds,
  });
};

const writeReport = (status: string): void => {
  const sourceFiles = [
    "__utilidades-back-office__/auto-roteirizacao/fundamentals.ts",
    "__utilidades-back-office__/auto-roteirizacao/experimentPaths.ts",
    "__utilidades-back-office__/auto-roteirizacao/fundamentalExperiment.ts",
    "__utilidades-back-office__/auto-roteirizacao/experimentArtifacts.ts",
    "__utilidades-back-office__/auto-roteirizacao/fundamental.arnes.ts",
    "__utilidades-back-office__/auto-roteirizacao/corpus.ts",
    "__utilidades-back-office__/auto-roteirizacao/vitest.corpus.config.ts",
    "src/utils/routing/graph.ts",
    "src/utils/routing/aStar.ts",
    "src/utils/routing/match.ts",
    "src/utils/routing/pedestrian.ts",
    "src/utils/routing/routePath.ts",
    "src/utils/routing/estimates.ts",
    "src/services/routeExport.ts",
    "src/services/routeStorage.ts",
    "src/services/manifestStorage.ts",
    "package.json",
    "package-lock.json",
  ];
  const attempts = experiment?.attempts.map(attemptRecord) ?? [];
  const winners =
    experiment?.winners.map((winner) => {
      const artifact = importableFiles.find((candidate) => candidate.strategy === winner.strategy);
      return {
        ...attemptRecord(winner),
        artifactFile: artifact?.file ?? null,
        manualVehicleDeltaMeters: manual?.comparable ? winner.solution.vehicleDistanceMeters - manual.vehicleDistanceMeters : null,
        manualModeledTimeDeltaSeconds: manual?.comparable ? winner.solution.modeledTimeSeconds - manual.modeledTimeSeconds : null,
      };
    }) ?? [];
  const expectedAttempts = entry.points.length * MULTI_START_STRATEGIES.length;
  const technicalValidity =
    allChecksPassed &&
    completed &&
    experiment?.status === "complete" &&
    attempts.length === expectedAttempts &&
    winners.length === MULTI_START_STRATEGIES.length &&
    importableFiles.length === MULTI_START_STRATEGIES.length
      ? "complete-within-model"
      : "incomplete-or-inconclusive";
  const report = {
    schema: "auto-fundamentals/multistart-report/v2",
    runId,
    status,
    technicalValidity,
    humanDecision: "pending-human-review",
    routeNumber: ROUTE_NUMBER,
    caseId: entry.id,
    workbook: entry.file,
    sourceHash: entry.sourceHash,
    corpusHash: corpus.hash,
    graphHash: snapshots.get(entry.id)?.snapshot.graphHash,
    gitVersion,
    sourceHashes: sourceFiles.filter(existsSync).map((file) => ({ file, hash: hash(readFileSync(file)) })),
    machine: { platform: platform(), release: release(), cpu: cpus()[0]?.model, node: process.version },
    elapsedSeconds: (performance.now() - startedAt) / 1000,
    engineMs,
    networkAttempts,
    objective: { primary: "vehicleDistance", secondaryReportedOnly: "modeledTime" },
    endpointPolicy: "every normalized delivery fundamental is evaluated as start and must belong to the first stop; the human external approach is separate",
    strategies: MULTI_START_STRATEGIES,
    config,
    addressCount: entry.points.length,
    expectedAttempts,
    attemptCount: attempts.length,
    attempts,
    winners,
    importableArtifacts: importableFiles,
    manualReference: manual,
    search: experiment?.search ?? null,
    diagnostics: experiment?.diagnostics ?? [],
    cachePolicy: { streetPathsPerGraph: MAX_CACHED_STREET_PATHS, vehicleOrdersPerContext: 2_000, clearedBeforeRun: true, frozenInputIdentity: true },
    limitations: [
      "The best start is certified only among the normalized deliveries evaluated under this heuristic and declared work limits; it is not a global TSP proof.",
      "Calibration is intentionally restricted to routes 1 and 2, one route per run; no generalization to the rest of the corpus is claimed.",
      "A fundamental is a projected street reference, not certified parking or a building entrance.",
      "Missing graph paths remain incomplete; no straight fallback is accepted as a complete route or allowed to win over a complete one.",
      "Signals, parking availability, absent turn restrictions and pedestrian passages remain unknown until human inspection.",
      "The importable v1 payload stores the winning start and stops, but not fundamental metadata, circuit geometry or the optimization report.",
      "The human reference interior is compared with free external approach; its stored external approach is reported separately.",
      "Corpus, graph snapshots, reports, maps and importable JSONs are private local artifacts and must not be published.",
    ],
  };
  writeFileSync(join(outputDir, "report.json"), JSON.stringify(report, null, 2));
  writeFileSync(
    join(outputDir, "manifest.json"),
    JSON.stringify(
      {
        schema: "auto-fundamentals/multistart-manifest/v2",
        runId,
        routeNumber: ROUTE_NUMBER,
        corpusHash: corpus.hash,
        inventoryCases: corpus.cases.length,
        evaluatedCase: { caseId: entry.id, workbook: entry.file, sourceHash: entry.sourceHash, graphHash: snapshots.get(entry.id)?.snapshot.graphHash },
        files: importableFiles,
        map: existsSync(join(mapDir, `${ROUTE_NUMBER}-vencedores.html`))
          ? { file: `${ROUTE_NUMBER}-vencedores.html`, sha256: hash(readFileSync(join(mapDir, `${ROUTE_NUMBER}-vencedores.html`))) }
          : null,
      },
      null,
      2
    )
  );
  const winnerRows = winners.map(
    (winner) =>
      `| ${winner.strategy} | ${winner.status} | ${winner.startPointId} | ${winner.stopCount} | ${Number(winner.vehicleDistanceMeters).toFixed(1)} | ${Number(winner.fullWalkingMeters).toFixed(1)} | ${Number(winner.modeledTimeSeconds).toFixed(1)} | ${winner.manualVehicleDeltaMeters === null ? "n/a" : Number(winner.manualVehicleDeltaMeters).toFixed(1)} | ${winner.artifactFile ?? "não gerado"} |`
  );
  writeFileSync(
    join(outputDir, "summary.md"),
    [
      `# Otimização multi-início — roteiro ${ROUTE_NUMBER}`,
      "",
      `Execução ${runId}; estado ${status}; validade técnica ${technicalValidity}; decisão humana pendente.`,
      `Foram avaliadas ${attempts.length}/${expectedAttempts} tentativas: ${entry.points.length} endereços × 3 estratégias, em r60/c120.`,
      "",
      "`vehicleDistance` foi o único objetivo de seleção; `modeledTime` é apenas uma métrica secundária do mesmo vencedor.",
      "",
      "| Estratégia | Estado | Início vencedor | Paradas | Veículo (m) | Caminhada (m) | Tempo modelado (s) | Δ veículo vs. manual (m) | JSON |",
      "|---|---|---|---:|---:|---:|---:|---:|---|",
      ...winnerRows,
      "",
      manual
        ? `Referência humana equivalente: ${manual.vehicleDistanceMeters.toFixed(1)} m de veículo, ${manual.fullWalkingMeters.toFixed(1)} m a pé e ${manual.modeledTimeSeconds.toFixed(1)} s modelados; aproximação externa separada no report.json.`
        : "Referência humana indisponível para comparação.",
      "",
      "Todas as tentativas estão compactadas em `report.json`; não existe um JSON importável por tentativa. A pasta `importaveis/` deve conter somente os três vencedores.",
      "",
      "A inspeção humana do mapa e dos três JSONs continua obrigatória antes de qualquer promoção para o produto ou expansão a outros roteiros.",
      "",
    ].join("\n")
  );
  writeFileSync(
    join(importableDir, "LEIA-ME.md"),
    [
      `# Vencedores do roteiro ${ROUTE_NUMBER}`,
      "",
      "Há exatamente três JSONs importáveis: com agrupamento inicial revisável, sem agrupamento inicial mas agrupável e sem agrupamento em nenhuma etapa.",
      "",
      "Cada arquivo preserva o endereço inicial vencedor como `route.startPoint`, e esse endereço pertence à primeira parada. Importe-os separadamente no app e compare com sua referência humana.",
      "",
      ...importableFiles.map((file) => `- ${file.file} — ${file.status}; veículo ${Number(file.vehicleDistanceMeters).toFixed(1)} m`),
    ].join("\n")
  );
  writeFileSync(
    join(outputDir, "evidence.txt"),
    [
      `Command (PowerShell): $env:FUNDAMENTAL_CASE = "${ROUTE_NUMBER}"; npm run test:auto-fundamentals`,
      `Report: .mentor-saidas/auto-fundamentals/${runId}/report.json`,
      `Report SHA256: ${hash(readFileSync(join(outputDir, "report.json")))}`,
      `Corpus SHA256: ${corpus.hash}`,
      `Status: ${status}`,
      `Attempts: ${attempts.length}/${expectedAttempts}; winner JSONs: ${importableFiles.length}/3`,
      "Network was forbidden by the harness; only frozen local snapshots were used.",
    ].join("\n") + "\n"
  );
};

beforeAll(async () => {
  mkdirSync(importableDir, { recursive: true });
  mkdirSync(mapDir, { recursive: true });
  await clearRoteiros();
  await clearManifests();
  vi.stubGlobal("fetch", () => {
    networkAttempts++;
    throw new Error("Network forbidden in fundamental corpus tests.");
  });
});

describe(`real fundamental corpus route ${ROUTE_NUMBER}`, () => {
  it("evaluates every delivery start for exactly three strategies and exports only their winners", async () => {
    try {
      check(corpus.cases.length === snapshots.size, "complete corpus/snapshot inventory");
      check(entry.routeNumber === ROUTE_NUMBER, "selected numbered route");
      check(entry.invalidRows === 0, "no invalid source rows");
      const snapshot = snapshots.get(entry.id);
      check(!!snapshot, `${entry.id}: snapshot exists`);
      if (!snapshot) return;

      const inputBefore = hash(JSON.stringify({ rows: entry.rows, points: entry.points, reference: entry.reference }));
      const referenceBefore = entry.reference ? (await importRoutePayload(entry.reference), await getRoteiro(entry.reference.manifestId, entry.reference.routeName)) : null;
      const pedGraph = pedestrianGraph(snapshot.graph);
      manual = manualEvaluation(entry, snapshot.graph, pedGraph);
      clearFundamentalExperimentCaches();
      const progressPrefix = `[fundamentals] roteiro ${ROUTE_NUMBER}`;
      console.info(`${progressPrefix} iniciado: ${entry.points.length} endereços × 3 estratégias`);
      const engineStarted = performance.now();
      experiment = runMultiStartFundamentalExperiment({
        points: entry.points,
        graph: snapshot.graph,
        pedestrianGraph: pedGraph,
        config,
        ...(process.env.FUNDAMENTAL_PHASES === "1" ? { onPhase: (phase: string) => console.info(`${progressPrefix} ${phase}`) } : {}),
      });
      engineMs = performance.now() - engineStarted;

      check(experiment.fundamentals.length === entry.points.length, `${entry.id}: fundamental conservation`);
      check(experiment.search?.radiusMeters === SEARCH_RADIUS_METERS, `${entry.id}: configured search radius`);
      check(experiment.attempts.length === entry.points.length * MULTI_START_STRATEGIES.length, `${entry.id}: every strategy/start pair evaluated`);
      for (const strategy of MULTI_START_STRATEGIES) {
        const strategyAttempts = experiment.attempts.filter((attempt) => attempt.strategy === strategy);
        check(strategyAttempts.length === entry.points.length, `${entry.id}/${strategy}: one attempt per address`);
        check(new Set(strategyAttempts.map((attempt) => attempt.startPointId)).size === entry.points.length, `${entry.id}/${strategy}: unique complete start inventory`);
      }
      for (const attempt of experiment.attempts) verifyAttempt(entry, attempt);
      check(experiment.winners.length === MULTI_START_STRATEGIES.length, `${entry.id}: exactly three winners`);
      check(experiment.status === "complete", `${entry.id}: complete multistart result`);
      for (const winner of experiment.winners) {
        check(winner.solution.status === "complete", `${entry.id}/${winner.strategy}: partial attempt cannot win`);
        await verifyArtifact(entry, winner);
      }
      check(importableFiles.length === MULTI_START_STRATEGIES.length, `${entry.id}: exactly three importable JSONs`);
      check(new Set(importableFiles.map((file) => file.file)).size === MULTI_START_STRATEGIES.length, `${entry.id}: unique recognizable filenames`);

      const mapFile = `${ROUTE_NUMBER}-vencedores.html`;
      const mapHtml = renderExperimentMapHtml({
        caseId: `roteiro ${ROUTE_NUMBER}`,
        graph: snapshot.graph,
        fundamentals: experiment.fundamentals,
        solutions: experiment.winners.map((winner) => winner.solution),
        solutionLabels: experiment.winners.map((winner) => winner.strategy),
      });
      writeFileSync(join(mapDir, mapFile), mapHtml, { flag: "wx" });

      check(networkAttempts === 0, "no network attempts");
      check(hash(JSON.stringify({ rows: entry.rows, points: entry.points, reference: entry.reference })) === inputBefore, `${entry.id}: input not mutated`);
      if (entry.reference)
        check(hash(JSON.stringify(await getRoteiro(entry.reference.manifestId, entry.reference.routeName))) === hash(JSON.stringify(referenceBefore)), `${entry.id}: manual reference not overwritten`);
      completed = true;
      console.info(`${progressPrefix} concluído em ${(engineMs / 1000).toFixed(1)} s; 3 JSONs gerados`);
    } finally {
      writeReport(allChecksPassed && completed ? "completed" : "incomplete-or-inconclusive");
    }
  }, 3_600_000);
});

afterAll(async () => {
  vi.unstubAllGlobals();
  await clearRoteiros();
  await clearManifests();
});
