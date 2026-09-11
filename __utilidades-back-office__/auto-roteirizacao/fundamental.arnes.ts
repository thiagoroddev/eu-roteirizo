import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { cpus, platform, release } from "node:os";
import { join, resolve } from "node:path";
import "fake-indexeddb/auto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { FundamentalObjective, FundamentalSolution, FundamentalVariant } from "./fundamentalExperiment";
import { DEFAULT_FUNDAMENTAL_EXPERIMENT_CONFIG, clearFundamentalExperimentCaches, runFundamentalExperiment } from "./fundamentalExperiment";
import { createExperimentalRoutePayload, renderExperimentMapHtml, validateExperimentalPayload } from "./experimentArtifacts";
import { evaluateCompleteWalking, evaluateLimitedFundamentalCircuit, evaluateVehicleOrder, MAX_CACHED_STREET_PATHS, type PathCollection } from "./experimentPaths";
import { buildFundamentalReferences } from "./fundamentals";
import { hash, loadCorpus, loadSnapshots, type CorpusCase } from "./corpus";
import { importRoutePayload, parseAndValidateRouteJson } from "../../src/services/routeExport";
import { clearManifests, getRouteRows } from "../../src/services/manifestStorage";
import { clearRoteiros, getRoteiro } from "../../src/services/routeStorage";
import { buildDeliveryPoints } from "../../src/utils/routing/points";
import { createInitialBuilderState, routeBuilderReducer } from "../../src/utils/routing/builder";
import { pedestrianGraph } from "../../src/utils/routing/pedestrian";
import type { RoadGraph } from "../../src/utils/routing/graph";
import type { RouteStop } from "../../src/types/routing";
import { DEFAULT_ROUTING_CONFIG } from "../../src/types/routing";
import { pointDeliverySeconds } from "../../src/utils/routing/estimates";
import { footCircuitPath } from "../../src/utils/routing/routePath";
import { haversine } from "../../src/utils/routing/geo";
import { turnAngle } from "../../src/utils/routing/aStar";

const SEARCH_RADII = [30, 60];
const CIRCUIT_LIMITS = [120, 60];
const REPETITIONS = 3;
const corpus = loadCorpus();
const snapshots = loadSnapshots(corpus);
const runId = new Date().toISOString().replaceAll(/[:.]/g, "-");
const outputDir = resolve(".mentor-saidas/auto-fundamentals", runId);
const importableDir = join(outputDir, "importaveis");
const mapDir = join(outputDir, "mapas");
const metrics: Record<string, unknown>[] = [];
const details: Record<string, unknown>[] = [];
const importableFiles: Record<string, unknown>[] = [];
const mapFiles: { file: string; sha256: string }[] = [];
let allChecksPassed = true;
let completedCases = 0;
let networkAttempts = 0;
const startedAt = performance.now();
let gitVersion = "unavailable";
try {
  gitVersion = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
} catch {
  /* Source hashes are still useful when Git is unavailable. */
}

const check = (condition: boolean, message: string): void => {
  if (!condition) allChecksPassed = false;
  expect(condition, message).toBe(true);
};

const median = (values: number[]): number => {
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)] ?? 0;
};

const p95 = (values: number[]): number => {
  const sorted = values.slice().sort((a, b) => a - b);
  return sorted[Math.max(0, Math.ceil(sorted.length * 0.95) - 1)] ?? 0;
};

const manualEvaluation = (entry: CorpusCase, graph: RoadGraph, pedGraph: RoadGraph) => {
  const reference = entry.reference;
  if (!reference) return null;
  const byId = new Map(entry.points.map((point) => [point.id, point]));
  const refs = new Map(buildFundamentalReferences(entry.points, graph).references.map((fundamental) => [fundamental.pointId, fundamental]));
  const stops = reference.route.stops.map((stop: RouteStop) => {
    const members = stop.pointIds.map((id) => refs.get(id)).filter((fundamental): fundamental is NonNullable<typeof fundamental> => !!fundamental);
    const limited = evaluateLimitedFundamentalCircuit(pedGraph, stop.vehicleStop, members, 120);
    const complete = evaluateCompleteWalking(pedGraph, stop.vehicleStop, members);
    return {
      order: stop.order,
      pointCount: stop.pointIds.length,
      packageCount: stop.pointIds.reduce((sum, id) => sum + (byId.get(id)?.packageCount ?? 0), 0),
      limitedCircuitMeters: limited.distanceMeters,
      limitedCircuitWithin120m: limited.valid && !limited.exceedsLimit,
      fullWalkingMeters: complete.distanceMeters,
      accessMeters: complete.estimatedAccessMeters,
      validPaths: limited.valid && complete.valid,
      storedRadiusMeters: stop.radiusMeters,
      memberFundamentals: members.length,
      currentAppWalkingMeters: footCircuitPath(pedGraph, stop.vehicleStop, stop.pointIds.map((id) => byId.get(id)!).filter(Boolean)).distanceMeters,
    };
  });
  const vehicle = evaluateVehicleOrder(
    graph,
    null,
    reference.route.stops.map((stop) => stop.vehicleStop)
  );
  const assigned = reference.route.stops.flatMap((stop) => stop.pointIds);
  const fullWalkingMeters = stops.reduce((total, stop) => total + stop.fullWalkingMeters, 0);
  const completeCoverage = assigned.length === entry.points.length && new Set(assigned).size === entry.points.length && (reference.route.ignoredPointIds?.length ?? 0) === 0;
  const modeledTimeSeconds =
    (vehicle.distanceMeters / 1000 / DEFAULT_ROUTING_CONFIG.vehicleSpeedKmh) * 3600 +
    (fullWalkingMeters / 1000 / DEFAULT_ROUTING_CONFIG.walkingSpeedKmh) * 3600 +
    entry.points.reduce((total, point) => total + pointDeliverySeconds(point, DEFAULT_ROUTING_CONFIG), 0);
  return {
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

const currentAppWalking = (entry: CorpusCase, solution: FundamentalSolution, graph: RoadGraph, cache: Map<string, number>): number => {
  const points = new Map(entry.points.map((point) => [point.id, point]));
  return solution.groups.reduce((total, group) => {
    const key = JSON.stringify([group.anchor.position, group.orderedPointIds]);
    let meters = cache.get(key);
    if (meters === undefined) {
      meters = footCircuitPath(
        graph,
        group.anchor.position,
        group.orderedPointIds.map((id) => points.get(id)!)
      ).distanceMeters;
      cache.set(key, meters);
    }
    return total + meters;
  }, 0);
};

const writeReport = (status: string): void => {
  const expectedSolutions = corpus.cases.length * SEARCH_RADII.length * CIRCUIT_LIMITS.length * 3 * 2;
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
    "src/utils/routing/vehicleStop.ts",
    "src/utils/routing/pedestrian.ts",
    "src/utils/routing/routePath.ts",
    "src/utils/routing/suggestion.ts",
    "src/utils/routing/estimates.ts",
    "src/services/routeExport.ts",
    "src/services/routeStorage.ts",
    "src/services/manifestStorage.ts",
    "package.json",
    "package-lock.json",
  ];
  const completeSolutions = metrics.filter((metric) => metric.status === "complete");
  const comparisons = metrics
    .filter((metric) => metric.variant !== "individual")
    .map((metric) => {
      const base = metrics.find(
        (candidate) =>
          candidate.caseId === metric.caseId &&
          candidate.searchRadiusMeters === metric.searchRadiusMeters &&
          candidate.circuitLimitMeters === metric.circuitLimitMeters &&
          candidate.objective === metric.objective &&
          candidate.variant === "individual"
      );
      const comparable = metric.status === "complete" && base?.status === "complete";
      return {
        caseId: metric.caseId,
        searchRadiusMeters: metric.searchRadiusMeters,
        circuitLimitMeters: metric.circuitLimitMeters,
        variant: metric.variant,
        objective: metric.objective,
        comparable,
        vehicleDeltaMeters: comparable ? Number(metric.vehicleDistanceMeters) - Number(base.vehicleDistanceMeters) : null,
        walkingDeltaMeters: comparable ? Number(metric.fullWalkingMeters) - Number(base.fullWalkingMeters) : null,
        modeledTimeDeltaSeconds: comparable ? Number(metric.modeledTimeSeconds) - Number(base.modeledTimeSeconds) : null,
      };
    });
  const aggregate = ["fixed-groups", "revisable"].flatMap((variant) =>
    ["vehicleDistance", "modeledTime"].flatMap((objective) =>
      SEARCH_RADII.flatMap((searchRadiusMeters) =>
        CIRCUIT_LIMITS.map((circuitLimitMeters) => {
          const rows = comparisons.filter(
            (row) => row.comparable && row.variant === variant && row.objective === objective && row.searchRadiusMeters === searchRadiusMeters && row.circuitLimitMeters === circuitLimitMeters
          );
          return {
            variant,
            objective,
            searchRadiusMeters,
            circuitLimitMeters,
            comparableCases: rows.length,
            vehicleDeltaMeters: rows.reduce((sum, row) => sum + Number(row.vehicleDeltaMeters), 0),
            walkingDeltaMeters: rows.reduce((sum, row) => sum + Number(row.walkingDeltaMeters), 0),
            modeledTimeDeltaSeconds: rows.reduce((sum, row) => sum + Number(row.modeledTimeDeltaSeconds), 0),
          };
        })
      )
    )
  );
  const manuals = details.flatMap((detail) => {
    const reference = detail.reference as ReturnType<typeof manualEvaluation>;
    return reference ? [{ caseId: detail.caseId, ...reference }] : [];
  });
  const manualComparisons = metrics.flatMap((metric) => {
    const manual = manuals.find((reference) => reference.caseId === metric.caseId);
    if (!manual) return [];
    const withinCircuitLimit = manual.stops.every((stop) => stop.validPaths && stop.limitedCircuitMeters <= Number(metric.circuitLimitMeters) + 1e-6);
    const comparable = manual.comparable && metric.status === "complete";
    return [
      {
        caseId: metric.caseId,
        variant: metric.variant,
        objective: metric.objective,
        searchRadiusMeters: metric.searchRadiusMeters,
        circuitLimitMeters: metric.circuitLimitMeters,
        comparable,
        manualWithinCircuitLimit: withinCircuitLimit,
        vehicleDeltaMeters: comparable ? Number(metric.vehicleDistanceMeters) - manual.vehicleDistanceMeters : null,
        walkingDeltaMeters: comparable ? Number(metric.fullWalkingMeters) - manual.fullWalkingMeters : null,
        modeledTimeDeltaSeconds: comparable ? Number(metric.modeledTimeSeconds) - manual.modeledTimeSeconds : null,
      },
    ];
  });
  const report = {
    schema: "auto-fundamentals/report/v1",
    runId,
    status,
    humanDecision: "pending-human-review",
    corpusHash: corpus.hash,
    gitVersion,
    sourceHashes: sourceFiles.map((file) => ({ file, hash: hash(readFileSync(file)) })),
    machine: { platform: platform(), release: release(), cpu: cpus()[0]?.model, node: process.version },
    repetitions: REPETITIONS,
    warmupRuns: 1,
    timingMode: "one cold measured run plus three warm-cache measured repetitions; IO/rendering excluded",
    elapsedSeconds: (performance.now() - startedAt) / 1000,
    cachePolicy: { streetPathsPerGraph: MAX_CACHED_STREET_PATHS, vehicleOrdersPerContext: 2_000, clearedBeforeEachConfiguration: true, frozenInputIdentity: true },
    networkAttempts,
    endpointPolicy: "free start/end for every generated and manual route; external manual approach reported separately",
    searchRadiiMeters: SEARCH_RADII,
    circuitLimitsMeters: CIRCUIT_LIMITS,
    defaults: DEFAULT_FUNDAMENTAL_EXPERIMENT_CONFIG,
    cases: corpus.cases.length,
    completedCases,
    expectedSolutions,
    solutions: metrics.length,
    importableArtifacts: importableFiles.length,
    metrics,
    completeSolutions: completeSolutions.length,
    partialSolutions: metrics.length - completeSolutions.length,
    comparisons,
    aggregate,
    manuals,
    manualComparisons,
    technicalValidity: allChecksPassed && completedCases === corpus.cases.length && completeSolutions.length === expectedSolutions ? "complete-within-model" : "incomplete-or-inconclusive",
    limitations: [
      "A fundamental is a projected reference, not certified parking or a building entrance.",
      "Missing graph paths remain incomplete; no straight fallback is accepted as a complete route.",
      "Fundamental↔pin accesses are estimated and explicitly separated from street distance.",
      "Signals, turn restrictions not represented by the snapshot and parking availability remain unknown.",
      "Measurements are from this computer and do not certify Android performance.",
      "The v1 payload does not persist the fundamental or the new circuit limit.",
      "Existing A* chooses paths with its turn/service penalties; reported meters are physical, but minimum physical distance for each leg is not certified.",
      "Warm timings reuse bounded caches; cold engine timings are separate. Three repetitions give only an empirical p95.",
      "Current-app walking is a separate diagnostic and may contain the product's straight fallback; it is not used to claim experimental savings.",
    ],
  };
  writeFileSync(join(outputDir, "report.json"), JSON.stringify(report, null, 2));
  writeFileSync(
    join(outputDir, "manifest.json"),
    JSON.stringify(
      {
        schema: "auto-fundamentals/manifest/v1",
        runId,
        corpusHash: corpus.hash,
        cases: corpus.cases.map((entry) => ({
          caseId: entry.id,
          workbook: entry.file,
          sourceHash: entry.sourceHash,
          graphHash: snapshots.get(entry.id)?.snapshot.graphHash,
          hasHumanReference: !!entry.reference,
        })),
        files: importableFiles,
        maps: mapFiles,
      },
      null,
      2
    )
  );
  writeFileSync(join(outputDir, "details.json"), JSON.stringify(details, null, 2));
  const rows = metrics.map(
    (metric) =>
      `| ${metric.caseId} | ${metric.searchRadiusMeters} | ${metric.circuitLimitMeters} | ${metric.variant} | ${metric.objective} | ${metric.status} | ${metric.stops} | ${Number(metric.vehicleDistanceMeters).toFixed(1)} | ${Number(metric.fullWalkingMeters).toFixed(1)} | ${Number(metric.modeledTimeSeconds).toFixed(1)} |`
  );
  writeFileSync(
    join(outputDir, "summary.md"),
    [
      "# Experimento de pontos fundamentais",
      "",
      `Execução ${runId}; status ${status}; decisão humana: pendente.`,
      `Validade técnica: ${report.technicalValidity}; soluções completas ${completeSolutions.length}/${expectedSolutions}; parciais ${report.partialSolutions}.`,
      "",
      "## Comparação com a base individual (somente pares completos)",
      "",
      "| Variante | Objetivo | Procura | Circuito | Casos comparáveis | Δ veículo (m) | Δ caminhada (m) | Δ tempo (s) |",
      "|---|---|---:|---:|---:|---:|---:|---:|",
      ...aggregate.map(
        (row) =>
          `| ${row.variant} | ${row.objective} | ${row.searchRadiusMeters} | ${row.circuitLimitMeters} | ${row.comparableCases} | ${row.vehicleDeltaMeters.toFixed(1)} | ${row.walkingDeltaMeters.toFixed(1)} | ${row.modeledTimeDeltaSeconds.toFixed(1)} |`
      ),
      "",
      "Valores negativos indicam redução; os denominadores excluem roteiros incompletos. Resultados parciais não demonstram economia.",
      "",
      "## Referências humanas inalteradas",
      "",
      "Mesmos extremos livres e modelo de caminhada. Aproximação externa registrada à parte. Compatibilidade com circuito não modifica a referência; deltas detalhados em report.json/manualComparisons.",
      "",
      "| Caso | Comparável | Circuitos até 120 m | Circuitos até 60 m | Veículo (m) | Caminhada (m) | Tempo (s) |",
      "|---|---|---|---|---:|---:|---:|",
      ...manuals.map(
        (manual) =>
          `| ${manual.caseId} | ${manual.comparable} | ${manual.stops.every((stop) => stop.limitedCircuitWithin120m)} | ${manual.stops.every((stop) => stop.validPaths && stop.limitedCircuitMeters <= 60)} | ${manual.vehicleDistanceMeters.toFixed(1)} | ${manual.fullWalkingMeters.toFixed(1)} | ${manual.modeledTimeSeconds.toFixed(1)} |`
      ),
      "",
      "",
      "O motor separa circuito limitado (âncora → fundamentais → âncora), caminhada completa e acessos estimados aos pinos. Não há peso oculto entre distância veicular e tempo modelado.",
      "",
      "| Caso | Procura (m) | Circuito (m) | Variante | Objetivo | Estado | Paradas | Veículo (m) | Caminhada completa (m) | Tempo modelado (s) |",
      "|---|---:|---:|---|---|---|---:|---:|---:|---:|",
      ...rows,
      "",
      `Soluções: ${metrics.length}/${expectedSolutions}; artefatos v1 verificados: ${importableFiles.length}; casos concluídos: ${completedCases}/${corpus.cases.length}.`,
      "",
      "Os JSONs e mapas são privados e servem à inspeção. Resultado verde do motor não comprova estacionamento, conectividade pedestre completa, ótimo global ou desempenho em Android.",
      "",
    ].join("\n")
  );
  writeFileSync(
    join(importableDir, "LEIA-ME.md"),
    [
      "# Inspeção do experimento",
      "",
      "Importe apenas os arquivos case-*.json no app. Cada configuração tem identidade própria. Reimportar o mesmo arquivo atualiza sua própria cópia.",
      "",
      "O raio manual continua 30 m. Procura fundamental e teto de circuito constam no relatório lateral. O app v1 recalcula caminhos e não persiste fundamentais nem a geometria do experimento.",
      "",
      "Os mapas HTML em ../mapas permitem selecionar variante/objetivo e visualizar pinos, fundamentais, âncoras e trechos avaliados offline. Ausência de trecho mantém o resultado parcial. A inspeção visual humana permanece pendente.",
      "",
      ...importableFiles.map((file) => `- [${file.file}](${file.file}) — ${file.status}`),
    ].join("\n")
  );
  writeFileSync(
    join(outputDir, "evidence.txt"),
    [
      `Command: npm run test:auto-fundamentals`,
      `Report: .mentor-saidas/auto-fundamentals/${runId}/report.json`,
      `Report SHA256: ${hash(readFileSync(join(outputDir, "report.json")))}`,
      `Corpus SHA256: ${corpus.hash}`,
      `Status: ${status}`,
      `Cases: ${completedCases}/${corpus.cases.length}; solutions: ${metrics.length}/${expectedSolutions}; artifacts: ${importableFiles.length}`,
      "Network was forbidden by the harness; only frozen local snapshots were used.",
    ].join("\n") + "\n"
  );
};

const verifyArtifact = async (
  entry: CorpusCase,
  solution: FundamentalSolution,
  searchRadiusMeters: number,
  circuitLimitMeters: number,
  variant: FundamentalVariant,
  objective: FundamentalObjective
): Promise<void> => {
  const config = { ...DEFAULT_FUNDAMENTAL_EXPERIMENT_CONFIG, searchRadiusMeters, circuitLimitMeters };
  const payload = createExperimentalRoutePayload({ runId, caseId: entry.id, variant, objective, sourcePoints: entry.points, sourceRows: entry.rows, solution, config });
  check(validateExperimentalPayload(payload, entry.points), `${entry.id}: artifact conservation`);
  const serialized = JSON.stringify(payload);
  const parsed = parseAndValidateRouteJson(serialized);
  check(parsed.ok, `${entry.id}: artifact parser`);
  if (!parsed.ok) return;
  const imported = await importRoutePayload(parsed.payload, new TextEncoder().encode(serialized).buffer);
  check(imported.ok, `${entry.id}: artifact importer`);
  const saved = await getRoteiro(payload.manifestId, payload.routeName);
  const savedRows = await getRouteRows(payload.manifestId, payload.routeName);
  check(saved !== null && savedRows !== null, `${entry.id}: artifact storage`);
  if (!saved || !savedRows) return;
  check(hash(JSON.stringify(savedRows)) === hash(JSON.stringify(entry.rows)), `${entry.id}: artifact rows changed`);
  const state = routeBuilderReducer(createInitialBuilderState(buildDeliveryPoints(savedRows)), { type: "HYDRATE", route: saved });
  check(hash(JSON.stringify(state.stops)) === hash(JSON.stringify(payload.route.stops)), `${entry.id}: artifact hydration changed stops`);
  check(!importableFiles.some((file) => file.manifestId === payload.manifestId), `${entry.id}: unique artifact identity`);
  const file = `${entry.id}-r${searchRadiusMeters}m-c${circuitLimitMeters}m-${variant}-${objective}.json`;
  writeFileSync(join(importableDir, file), serialized, { flag: "wx" });
  importableFiles.push({ caseId: entry.id, file, sha256: hash(serialized), searchRadiusMeters, circuitLimitMeters, variant, objective, manifestId: payload.manifestId, status: solution.status });
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

describe("real fundamental corpus", () => {
  it("evaluates every local case, variant and objective with frozen snapshots", async () => {
    try {
      check(corpus.cases.length === snapshots.size, "corpus/snapshot case count");
      check(
        corpus.cases.every((entry) => entry.invalidRows === 0),
        "invalid source rows"
      );
      const priority = ["case-008", "case-013", "case-003"];
      const orderedCases = [...corpus.cases].sort(
        (a, b) => (priority.includes(a.id) ? priority.indexOf(a.id) : priority.length) - (priority.includes(b.id) ? priority.indexOf(b.id) : priority.length)
      );
      for (const entry of orderedCases) {
        clearFundamentalExperimentCaches();
        const appWalkingCache = new Map<string, number>();
        const snapshot = snapshots.get(entry.id);
        check(!!snapshot, `${entry.id}: snapshot exists`);
        if (!snapshot) continue;
        const before = hash(JSON.stringify({ rows: entry.rows, points: entry.points, reference: entry.reference }));
        const referenceBefore = entry.reference ? (await importRoutePayload(entry.reference), await getRoteiro(entry.reference.manifestId, entry.reference.routeName)) : null;
        const pedGraph = pedestrianGraph(snapshot.graph);
        const caseDetails: Record<string, unknown> = { caseId: entry.id, sourceHash: entry.sourceHash, graphHash: snapshot.snapshot.graphHash, reference: null, configurations: [] };
        for (const searchRadiusMeters of SEARCH_RADII)
          for (const circuitLimitMeters of CIRCUIT_LIMITS) {
            clearFundamentalExperimentCaches();
            const config = { ...DEFAULT_FUNDAMENTAL_EXPERIMENT_CONFIG, searchRadiusMeters, circuitLimitMeters };
            const progressPrefix = `[fundamentals] ${entry.id} r${searchRadiusMeters} c${circuitLimitMeters}`;
            console.info(`${progressPrefix} iniciado`);
            const input = {
              points: entry.points,
              graph: snapshot.graph,
              pedestrianGraph: pedGraph,
              startPoint: null,
              config,
              ...(process.env.FUNDAMENTAL_PHASES === "1" ? { onPhase: (phase: string) => console.info(`${progressPrefix} ${phase}`) } : {}),
            };
            const coldStarted = performance.now();
            let experiment = runFundamentalExperiment(input);
            const coldEngineMs = performance.now() - coldStarted;
            const timings: number[] = [];
            const expected = hash(JSON.stringify(experiment));
            for (let repeat = 0; repeat < REPETITIONS; repeat++) {
              const started = performance.now();
              const repeated = runFundamentalExperiment(input);
              timings.push(performance.now() - started);
              check(hash(JSON.stringify(repeated)) === expected, `${entry.id}: nondeterministic repetition`);
              experiment = repeated;
            }
            check(experiment.fundamentals.length === entry.points.length, `${entry.id}: fundamental conservation`);
            check(experiment.search?.radiusMeters === searchRadiusMeters, `${entry.id}: configured search radius`);
            (caseDetails.configurations as unknown[]).push({
              searchRadiusMeters,
              circuitLimitMeters,
              fundamentals: experiment.fundamentals,
              searchDiagnostics: experiment.search?.diagnostics,
              nonDominated: experiment.nonDominated.map((solution) => ({ variant: solution.variant, objective: solution.objective, signature: solution.signature })),
            });
            for (const variant of experiment.variants)
              for (const objective of ["vehicleDistance", "modeledTime"] as const) {
                const solution = variant.bestByObjective[objective];
                check(solution.pendingPointIds.length === 0, `${entry.id}: no orphan delivery`);
                check(solution.groups.flatMap((group) => group.pointIds).length === entry.points.length, `${entry.id}: no duplicate membership`);
                check(new Set(solution.groups.flatMap((group) => group.pointIds)).size + solution.pendingPointIds.length === entry.points.length, `${entry.id}: point conservation`);
                check(
                  solution.groups.every((group) => !group.limitedCircuit.valid || group.limitedCircuit.closed),
                  `${entry.id}: valid limited circuit is closed`
                );
                check(
                  solution.groups.every((group) => group.limitedCircuit.valid || (solution.status === "partial" && group.diagnostics.includes("limited-circuit-missing-path"))),
                  `${entry.id}: missing limited circuit remains explicit partial`
                );
                check(
                  solution.groups.every((group) => group.limitedCircuitMeters <= circuitLimitMeters + 1e-6 || solution.status === "partial"),
                  `${entry.id}: circuit limit`
                );
                verifyTrace(solution.vehicle, `${entry.id}: vehicle`);
                for (const group of solution.groups) {
                  verifyTrace(group.limitedCircuit, `${entry.id}: limited`);
                  verifyTrace(group.completeWalking, `${entry.id}: complete`);
                  check(Math.abs(group.fullWalkingMeters - group.limitedCircuitMeters - group.accessMeters) < 0.1 || !group.completeWalking.valid, `${entry.id}: access counted exactly once`);
                }
                await verifyArtifact(entry, solution, searchRadiusMeters, circuitLimitMeters, variant.kind, objective);
                metrics.push({
                  caseId: entry.id,
                  sourceHash: entry.sourceHash,
                  graphHash: snapshot.snapshot.graphHash,
                  searchRadiusMeters,
                  circuitLimitMeters,
                  variant: variant.kind,
                  objective,
                  status: solution.status,
                  stops: solution.groups.length,
                  points: entry.points.length,
                  packages: entry.points.reduce((sum, point) => sum + point.packageCount, 0),
                  pending: solution.pendingPointIds.length,
                  distantPinsAssigned: experiment.fundamentals.filter((fundamental) => haversine(fundamental.position, fundamental.originalPosition) > searchRadiusMeters).length,
                  vehicleDistanceMeters: solution.vehicleDistanceMeters,
                  limitedCircuitMeters: solution.limitedCircuitMeters,
                  fullWalkingMeters: solution.fullWalkingMeters,
                  accessMeters: solution.accessMeters,
                  modeledTimeSeconds: solution.modeledTimeSeconds,
                  worstCircuitMeters: Math.max(0, ...solution.groups.map((group) => group.limitedCircuitMeters)),
                  turnsOver45Degrees: solution.vehicle.legs.reduce(
                    (sum, leg) => sum + leg.path.slice(2).filter((point, index) => turnAngle(leg.path[index], leg.path[index + 1], point) > 45).length,
                    0
                  ),
                  currentAppWalkingMeters: currentAppWalking(entry, solution, pedGraph, appWalkingCache),
                  candidates: experiment.search?.candidates.length ?? 0,
                  definitionsEvaluated: variant.definitionsEvaluated,
                  definitionLimitReached: variant.definitionLimitReached,
                  operationsEvaluated: solution.operationsEvaluated,
                  workLimitReached: solution.workLimitReached,
                  anchorSearchStatus: experiment.search?.status,
                  coldEngineMs,
                  medianEngineMs: median(timings),
                  p95EngineMs: p95(timings),
                  diagnostics: solution.diagnostics,
                });
                (caseDetails.configurations as unknown[]).push({ searchRadiusMeters, circuitLimitMeters, variant: variant.kind, objective, solution });
              }
            const mapFile = `${entry.id}-r${searchRadiusMeters}m-c${circuitLimitMeters}m.html`;
            const mapHtml = renderExperimentMapHtml({
              caseId: entry.id,
              graph: snapshot.graph,
              fundamentals: experiment.fundamentals,
              solutions: experiment.variants.flatMap((variant) => Object.values(variant.bestByObjective)),
            });
            writeFileSync(join(mapDir, mapFile), mapHtml, { flag: "wx" });
            mapFiles.push({ file: mapFile, sha256: hash(mapHtml) });
            (caseDetails.configurations as unknown[]).push({ mapFile, searchRadiusMeters, circuitLimitMeters });
            console.info(`[fundamentals] ${entry.id} r${searchRadiusMeters} c${circuitLimitMeters} concluído`);
          }
        caseDetails.reference = manualEvaluation(entry, snapshot.graph, pedGraph);
        check(hash(JSON.stringify({ rows: entry.rows, points: entry.points, reference: entry.reference })) === before, `${entry.id}: input mutated`);
        if (entry.reference)
          check(hash(JSON.stringify(await getRoteiro(entry.reference.manifestId, entry.reference.routeName))) === hash(JSON.stringify(referenceBefore)), `${entry.id}: manual reference overwritten`);
        details.push(caseDetails);
        completedCases++;
      }
      check(networkAttempts === 0, "no network attempts");
    } finally {
      writeReport(allChecksPassed && completedCases === corpus.cases.length ? "completed" : "incomplete-or-inconclusive");
    }
  }, 3_600_000);
});

afterAll(async () => {
  vi.unstubAllGlobals();
  await clearRoteiros();
  await clearManifests();
});
