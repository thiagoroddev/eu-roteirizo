import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { cpus, platform, release } from "node:os";
import { join, resolve } from "node:path";
import "fake-indexeddb/auto";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import type { AnchorSearchResult } from "../../src/types/autoRouting";
import type { LatLng } from "../../src/types/routing";
import { generateAnchorAlternatives } from "../../src/utils/routing/autoRouteAnchors";
import { haversine } from "../../src/utils/routing/geo";
import { nearestEdge, nearestWayName } from "../../src/utils/routing/match";
import { suggestVehicleStop } from "../../src/utils/routing/vehicleStop";
import { importRoutePayload, parseAndValidateRouteJson, serializeRouteExport } from "../../src/services/routeExport";
import { clearManifests, getRouteRows } from "../../src/services/manifestStorage";
import { clearRoteiros, getRoteiro } from "../../src/services/routeStorage";
import { buildDeliveryPoints } from "../../src/utils/routing/points";
import { createInitialBuilderState, routeBuilderReducer } from "../../src/utils/routing/builder";
import { createInspectionPayload, EXPERIMENT_ANCHORS_MARKER, hash, loadCorpus, loadSnapshots, type AnchorPolicy, type CorpusCase } from "./corpus";

const RADII = [30, 60, 90, 120];
const STEPS = [5, 10, 20];
const REPETITIONS = 5;
/** INV-001: the importable JSONs park on the app's default anchor unless INSPECAO_ANCORAS_DO_EXPERIMENTO=1 (TASK-BG-023). */
const ANCHOR_POLICY: AnchorPolicy = process.env.INSPECAO_ANCORAS_DO_EXPERIMENTO === "1" ? "experiment" : "app-default";
const corpus = loadCorpus();
const snapshots = loadSnapshots(corpus);
const runId = new Date().toISOString().replaceAll(/[:.]/g, "-");
const outputDir = resolve(".mentor-saidas/auto-anchors", runId);
const inspectionDir = join(outputDir, "importaveis");
const inspectionFiles: { caseId: string; workbook: string; file: string; radius: number; step: number; groups: number; pending: number; manifestId: string; hasHumanReference: boolean }[] = [];
const metrics: Record<string, unknown>[] = [];
const details: Record<string, unknown>[] = [];
const completedCases = new Set<string>();
let acceptedRealStreetCases = 0;
let allChecksPassed = true;
let gitVersion = "unavailable";
try {
  gitVersion = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
} catch {
  /* source hashes remain available */
}

// Stable labels only in assertions: failures must never dump real points or package tracking ids.
const check = (condition: boolean, message: string): void => {
  if (!condition) allChecksPassed = false;
  expect(condition, message).toBe(true);
};
const assertCoverage = (entry: CorpusCase, result: AnchorSearchResult, radius: number) => {
  const ignored = new Set(entry.reference?.route.ignoredPointIds ?? []);
  const active = entry.points.filter((p) => !ignored.has(p.id));
  const byId = new Map(active.map((p) => [p.id, p]));
  const assigned = result.groups.flatMap((g) => g.pointIds);
  const pending = result.pending.map((p) => p.pointId);
  check(!result.diagnostics.limitReached && result.status !== "invalid", `${entry.id}: invalid or truncated calculation`);
  check(new Set([...assigned, ...pending]).size === active.length && assigned.length + pending.length === active.length, `${entry.id}: point conservation`);
  check(
    [...assigned, ...pending].every((id) => byId.has(id)),
    `${entry.id}: unknown assignment`
  );
  check(
    result.groups.every((g) => g.pointIds.includes(g.seedPointId)),
    `${entry.id}: seed must be a member`
  );
  const packages = result.groups.reduce((sum, g) => sum + g.packageCount, 0) + pending.reduce((sum, id) => sum + byId.get(id)!.packageCount, 0);
  check(packages === active.reduce((sum, p) => sum + p.packageCount, 0), `${entry.id}: package conservation`);
  for (const candidate of result.candidates) {
    check(candidate.pointIds.length > 0 && candidate.pointIds.every((id) => byId.has(id) && haversine(candidate.position, byId.get(id)!) <= radius), `${entry.id}: candidate outside radius`);
    check(candidate.segment.directions.length > 0, `${entry.id}: missing directed access`);
  }
};

const manualComparison = (entry: CorpusCase, result: AnchorSearchResult, radius: number, step: number) => {
  if (!entry.reference) return null;
  const { graph } = snapshots.get(entry.id)!;
  const byId = new Map(entry.points.map((p) => [p.id, p]));
  return entry.reference.route.stops.map((stop) => {
    const members = stop.pointIds.map((id) => byId.get(id)!);
    const maxMeters = Math.max(...members.map((p) => haversine(stop.vehicleStop, p)));
    const match = nearestEdge(graph, stop.vehicleStop);
    const movedToOtherStreet = stop.vehicleStopIsDefault === false && !!match && members.some((p) => nearestWayName(graph, p) !== nearestWayName(graph, stop.vehicleStop));
    const projectedCompatible = !!match && members.every((p) => haversine(match.point, p) <= radius);
    const candidates = match
      ? result.candidates.filter(
          (c) => ((c.segment.from === match.from && c.segment.to === match.to) || (c.segment.from === match.to && c.segment.to === match.from)) && stop.pointIds.every((id) => c.pointIds.includes(id))
        )
      : [];
    const nearestCandidateMeters = candidates.length && match ? Math.min(...candidates.map((c) => haversine(c.position, match.point))) : null;
    if (movedToOtherStreet && projectedCompatible && maxMeters <= radius) {
      acceptedRealStreetCases++;
      check(nearestCandidateMeters !== null && nearestCandidateMeters <= step + 0.05, `${entry.id}: missing alternative on a human-selected street (stop ${stop.order}, radius ${radius})`);
    }
    return {
      stopOrder: stop.order,
      members: members.length,
      compatibleWithScenario: maxMeters <= radius,
      maxStraightMeters: maxMeters,
      beyondStoredRadius: members.filter((p) => haversine(stop.vehicleStop, p) > stop.radiusMeters + 1e-3).length,
      movedToOtherStreet,
      projectedCompatible,
      nearestCandidateMeters,
    };
  });
};

const geoFeature = (position: LatLng, properties: Record<string, unknown>) => ({ type: "Feature", geometry: { type: "Point", coordinates: [position.lng, position.lat] }, properties });
const exportComparison = (entry: CorpusCase, result: AnchorSearchResult, radius: number): void => {
  const features = [
    ...entry.points.map((p) => geoFeature(p, { role: "delivery", id: p.id, packages: p.packageCount })),
    ...(entry.reference?.route.stops.map((s) => geoFeature(s.vehicleStop, { role: "human", order: s.order, pointIds: s.pointIds, radiusMeters: s.radiusMeters })) ?? []),
    ...result.groups.map((g, i) => geoFeature(g.vehicleStop, { role: "greedy-spatial-only", group: i + 1, seedPointId: g.seedPointId, pointIds: g.pointIds, radiusMeters: radius })),
  ];
  writeFileSync(join(outputDir, `${entry.id}-r${radius}.geojson`), JSON.stringify({ type: "FeatureCollection", features }));
};

const exportInspection = async (entry: CorpusCase, result: AnchorSearchResult, step: number): Promise<void> => {
  const payload = createInspectionPayload(entry, result, { runId, sampleStepMeters: step, anchorPolicy: ANCHOR_POLICY });
  const serialized = serializeRouteExport(payload);
  const parsed = parseAndValidateRouteJson(serialized);
  check(parsed.ok, `${entry.id}: inspection rejected by the app parser`);
  if (!parsed.ok) throw new Error(`${entry.id}: inspection import cannot proceed`);
  check(!inspectionFiles.some((f) => f.manifestId === payload.manifestId) && payload.manifestId !== entry.reference?.manifestId, `${entry.id}: inspection identity collision`);
  check((await importRoutePayload(parsed.payload, new TextEncoder().encode(serialized).buffer)).ok, `${entry.id}: inspection import failed`);
  const saved = await getRoteiro(payload.manifestId, payload.routeName);
  const savedRows = await getRouteRows(payload.manifestId, payload.routeName);
  check(saved !== null && savedRows !== null, `${entry.id}: imported inspection missing in storage`);
  if (!saved || !savedRows) throw new Error(`${entry.id}: inspection hydration cannot proceed`);
  check(hash(JSON.stringify(savedRows)) === hash(JSON.stringify(entry.rows)), `${entry.id}: imported rows changed`);
  check(hash(JSON.stringify(saved)) === hash(JSON.stringify(payload.route)), `${entry.id}: imported route changed`);
  const state = routeBuilderReducer(createInitialBuilderState(buildDeliveryPoints(savedRows)), { type: "HYDRATE", route: saved });
  check(hash(JSON.stringify(state.stops)) === hash(JSON.stringify(payload.route.stops)), `${entry.id}: hydration changed stops, members or anchors`);
  check(hash(JSON.stringify(state.ignoredPointIds)) === hash(JSON.stringify(result.ignoredPointIds)), `${entry.id}: hydration changed exclusions`);
  const assigned = new Set(state.stops.flatMap((s) => s.pointIds));
  const free = state.points
    .filter((p) => !assigned.has(p.id) && !state.ignoredPointIds.includes(p.id))
    .map((p) => p.id)
    .sort();
  check(hash(JSON.stringify(free)) === hash(JSON.stringify(result.pending.map((p) => p.pointId).sort())), `${entry.id}: pending points were lost or ignored`);
  const file = `${entry.id}-r${result.radiusMeters}m-p${step}m${ANCHOR_POLICY === "experiment" ? "-ancoras-do-experimento" : ""}.json`;
  writeFileSync(join(inspectionDir, file), serialized, { flag: "wx" });
  inspectionFiles.push({
    caseId: entry.id,
    workbook: entry.file,
    file,
    radius: result.radiusMeters,
    step,
    groups: result.groups.length,
    pending: result.pending.length,
    manifestId: payload.manifestId,
    hasHumanReference: !!entry.reference,
  });
};

beforeAll(async () => {
  mkdirSync(outputDir, { recursive: true });
  mkdirSync(inspectionDir);
  // This IndexedDB implementation lives only in this Node process, never in the user's browser.
  await clearRoteiros();
  await clearManifests();
  vi.stubGlobal("fetch", () => {
    throw new Error("Network forbidden in real corpus tests.");
  });
});

describe("real anchor corpus", () => {
  it("reconciles every workbook with its available human reference", () => {
    check(corpus.cases.length === snapshots.size, "Missing snapshot case");
    check(
      corpus.cases.every((c) => c.invalidRows === 0),
      "Invalid source rows must be resolved before acceptance"
    );
    check(corpus.cases.filter((c) => c.reference).length === corpus.referenceCount, "Missing human reference");
  });

  for (const entry of corpus.cases)
    it(`${entry.id}: compares configured radii and alternative streets`, async () => {
      const { graph, snapshot } = snapshots.get(entry.id)!;
      const original = hash(JSON.stringify({ rows: entry.rows, points: entry.points, reference: entry.reference }));
      if (entry.reference) check((await importRoutePayload(entry.reference)).ok, `${entry.id}: reference import failed`);
      const referenceBefore = entry.reference ? await getRoteiro(entry.reference.manifestId, entry.reference.routeName) : null;
      const ignoredPointIds = entry.reference?.route.ignoredPointIds ?? [];
      for (const radius of RADII)
        for (const step of STEPS) {
          const input = { graph, points: entry.points, radiusMeters: radius, ignoredPointIds, options: { sampleStepMeters: step } };
          // Untimed warm-up, then independent repetitions. Human anchors never enter the generator.
          const result = generateAnchorAlternatives(input);
          assertCoverage(entry, result, radius);
          const times: number[] = [];
          const phases: Record<string, number>[] = [];
          const expected = hash(JSON.stringify(result));
          for (let i = 0; i < REPETITIONS; i++) {
            const phaseTimes: Record<string, number> = {};
            const started = performance.now();
            const repeated = generateAnchorAlternatives({
              ...input,
              onPhase: (phase) => {
                phaseTimes[phase] = performance.now() - started;
              },
            });
            times.push(performance.now() - started);
            phases.push(phaseTimes);
            check(hash(JSON.stringify(repeated)) === expected, `${entry.id}: nondeterministic repetition`);
          }
          const comparison = manualComparison(entry, result, radius, step);
          const byId = new Map(entry.points.map((p) => [p.id, p]));
          for (const anchor of result.defaultAnchors) {
            const expectedDefault = suggestVehicleStop(graph, byId.get(anchor.seedPointId)!);
            check(anchor.position !== null && haversine(anchor.position, expectedDefault) < 0.05, `${entry.id}: manual seed default differs`);
          }
          const free = new Map(entry.points.filter((p) => !ignoredPointIds.includes(p.id)).map((p) => [p.id, p]));
          let seedBaselineGroups = 0;
          for (const seed of [...free.values()].sort((a, b) => a.id.localeCompare(b.id, "en"))) {
            if (!free.has(seed.id)) continue;
            const anchor = suggestVehicleStop(graph, seed);
            if (haversine(anchor, seed) > radius) continue;
            seedBaselineGroups++;
            for (const p of free.values()) if (haversine(anchor, p) <= radius) free.delete(p.id);
          }
          times.sort((a, b) => a - b);
          metrics.push({
            caseId: entry.id,
            sourceHash: entry.sourceHash,
            graphHash: snapshot.graphHash,
            radius,
            step,
            rows: entry.rows.length,
            points: entry.points.length,
            packages: entry.points.reduce((sum, p) => sum + p.packageCount, 0),
            status: result.status,
            groups: result.groups.length,
            pending: result.pending.length,
            pendingReasons: result.pending.reduce<Record<string, number>>((counts, p) => ({ ...counts, [p.reason]: (counts[p.reason] ?? 0) + 1 }), {}),
            candidates: result.candidates.length,
            seedBaselineGroups,
            seedBaselinePending: free.size,
            humanStops: entry.reference?.route.stops.length ?? null,
            humanCompatibleStops: comparison?.filter((s) => s.compatibleWithScenario).length ?? null,
            humanStopsWithCandidate: comparison?.filter((s) => s.nearestCandidateMeters !== null).length ?? null,
            medianMs: times[Math.floor(times.length / 2)],
            p95Ms: times[Math.ceil(times.length * 0.95) - 1],
            phaseOffsetsMs: phases,
            ...result.diagnostics,
          });
          details.push({ caseId: entry.id, radius, step, groups: result.groups, pending: result.pending, comparison });
          if (step === 10) {
            exportComparison(entry, result, radius);
            await exportInspection(entry, result, step);
          }
        }
      check(hash(JSON.stringify({ rows: entry.rows, points: entry.points, reference: entry.reference })) === original, `${entry.id}: input mutated`);
      if (entry.reference) {
        const savedReference = await getRoteiro(entry.reference.manifestId, entry.reference.routeName);
        check(hash(JSON.stringify(savedReference)) === hash(JSON.stringify(referenceBefore)), `${entry.id}: inspection overwrote the manual reference`);
      }
      completedCases.add(entry.id);
      console.info(`${entry.id}: ${RADII.length * STEPS.length} scenarios validated; ${entry.points.length} delivery locations.`);
    }, 120_000);
});

afterAll(async () => {
  vi.unstubAllGlobals();
  const expectedRuns = corpus.cases.length * RADII.length * STEPS.length;
  const expectedInspections = corpus.cases.length * RADII.length;
  const complete = allChecksPassed && completedCases.size === corpus.cases.length && metrics.length === expectedRuns && acceptedRealStreetCases > 0 && inspectionFiles.length === expectedInspections;
  const sources = [
    "src/utils/routing/autoRouteAnchors.ts",
    "src/types/autoRouting.ts",
    "src/utils/routing/graph.ts",
    "src/utils/routing/points.ts",
    "src/utils/routing/geo.ts",
    "src/utils/routing/match.ts",
    "src/utils/routing/vehicleStop.ts",
    "src/utils/routing/walkOrder.ts",
    "src/utils/routing/builder.ts",
    "src/services/routeExport.ts",
    "src/services/routeStorage.ts",
    "src/services/manifestStorage.ts",
    "src/types/routeExport.ts",
    "src/types/routing.ts",
    "src/utils/coordinates.ts",
    "src/utils/normalizeColumns.ts",
    "__utilidades-back-office__/auto-roteirizacao/corpus.ts",
    "__utilidades-back-office__/auto-roteirizacao/anchors.arnes.ts",
    "__utilidades-back-office__/auto-roteirizacao/vitest.corpus.config.ts",
    "package.json",
    "package-lock.json",
  ];
  const report = {
    schema: "auto-anchors/report/v1",
    runId,
    status: complete ? "complete-spatial-evaluation" : "incomplete",
    corpusHash: corpus.hash,
    gitVersion,
    sourceHashes: sources.map((file) => ({ file, hash: hash(readFileSync(file)) })),
    machine: { platform: platform(), release: release(), cpu: cpus()[0]?.model, node: process.version },
    anchorPolicy: ANCHOR_POLICY,
    repetitions: REPETITIONS,
    radii: RADII,
    steps: STEPS,
    expectedRuns,
    completedCases: completedCases.size,
    acceptedRealStreetCases,
    importedInspections: inspectionFiles.length,
    expectedInspections,
    metrics,
    limitations: [
      "Spatial coverage is not driving or walking feasibility.",
      "Greedy groups have no optimized driving order.",
      "Human references keep their original memberships and radius exceptions.",
      "All detailed coordinates remain local.",
    ],
  };
  writeFileSync(join(outputDir, "report.json"), JSON.stringify(report, null, 2));
  writeFileSync(join(outputDir, "details.json"), JSON.stringify(details));
  writeFileSync(join(inspectionDir, "index.json"), JSON.stringify({ runId, status: report.status, anchorPolicy: ANCHOR_POLICY, files: inspectionFiles }, null, 2));
  const anchorGuide =
    ANCHOR_POLICY === "experiment"
      ? `**ÂNCORAS DO GERADOR (chave INSPECAO_ANCORAS_DO_EXPERIMENTO=1).** Cada parada sai na âncora que o gerador escolheu, marcada como escolha manual para o app não reaplicar o padrão; o nome do roteiro traz "${EXPERIMENT_ANCHORS_MARKER}" e o do arquivo, "-ancoras-do-experimento". Os grupos e as âncoras são resultados do motor.`
      : "**ÂNCORAS PADRÃO DO APP (sem chave).** Os grupos são resultados do motor, mas cada parada sai no pino da semente, marcada como padrão: com a malha carregada, o app leva o veículo para a rua em frente a esse pino, como faria com uma parada criada à mão. Para ver onde o gerador põe a âncora, rode de novo com INSPECAO_ANCORAS_DO_EXPERIMENTO=1 (INV-001).";
  const inspectionGuide =
    [
      "# JSONs para importar no Eu Roteirizo",
      "",
      `Execução ${runId}: ${inspectionFiles.length}/${expectedInspections} arquivos verificados pelo parser, importador, armazenamento e hidratação do app em IndexedDB de teste. Estado da bateria: ${report.status}.`,
      "",
      "1. No app, clique em **Importar roteiro (.json)**.",
      "2. Selecione um arquivo **case-*-r*m-p10m.json desta pasta**; não selecione index.json, report.json, details.json ou GeoJSON.",
      "3. Abra/expanda as paradas para examinar veículo, membros e entregas que continuam livres. Você pode editar a cópia experimental.",
      "",
      `Pasta local: ${inspectionDir}`,
      "",
      "Cada arquivo usa o schema eu-roteirizo/roteiro/v1 e identidade própria. Variantes/execuções não substituem referências manuais. Reimportar o MESMO arquivo atualiza essa cópia e pode substituir edições feitas nela; exporte sua cópia editada antes de reimportar.",
      "",
      "**INSPEÇÃO ESPACIAL: A SEQUÊNCIA NÃO FOI OTIMIZADA.** Os caminhos de veículo e a pé são recalculados pelo app com sua malha atual, que pode diferir do snapshot do teste. Sem malha/caminho, o app pode desenhar trechos retos. Não interprete esses percursos como qualidade de roteirização já validada.",
      "",
      anchorGuide,
      "",
      "O início da referência é preservado quando existe; sem referência ele permanece não definido. A ordem interna dos membros usa o padrão atual do app, sem mudar a âncora ou o grupo. Pontos pendentes permanecem livres; não viram ignorados.",
      "",
      "A semente original e a âncora padrão continuam em ../details.json. O schema atual não persiste explicitamente a semente: mover/reabrir/resetar segue o comportamento existente do app, a ser evoluído na RF-034.",
      "",
      "## Escolher o arquivo",
      "",
      "| Romaneio original | Raio (m) | Paradas provisórias | Pendentes livres | JSON importável |",
      "|---|---:|---:|---:|---|",
      ...inspectionFiles.map((f) => `| ${f.workbook.replaceAll("|", "\\|").replaceAll(/[\r\n]/g, " ")} | ${f.radius} | ${f.groups} | ${f.pending} | [${f.file}](${f.file}) |`),
      "",
      "Arquivos privados com coordenadas e dados reais de entrega. Não publicar nem enviar a visualizadores externos.",
    ].join("\n") + "\n";
  writeFileSync(join(inspectionDir, "LEIA-ME.md"), inspectionGuide);
  writeFileSync(
    join(outputDir, "manifest.json"),
    JSON.stringify(
      {
        corpusHash: corpus.hash,
        files: corpus.files,
        cases: corpus.cases.map((entry) => ({ caseId: entry.id, workbook: entry.file, sourceHash: entry.sourceHash, hasHumanReference: !!entry.reference })),
        snapshots: [...snapshots].map(([caseId, { snapshot }]) => ({ caseId, ...snapshot, graph: undefined })),
      },
      null,
      2
    )
  );
  const summary =
    [
      "# Comparação espacial de âncoras",
      "",
      `Execução: ${runId}. Estado: ${report.status}.`,
      "",
      `${completedCases.size}/${corpus.cases.length} romaneios; ${corpus.referenceCount} referências humanas; ${metrics.length}/${expectedRuns} cenários; ${acceptedRealStreetCases} verificações de outra rua (repetidas por raio/passo compatível).`,
      "",
      "| Raio (m) | Passo (m) | Casos sem pendência | Locais pendentes¹ | Grupos provisórios¹ | Maior mediana (ms) | Maior p95 (ms) |",
      "|---:|---:|---:|---:|---:|---:|---:|",
      ...RADII.flatMap((radius) =>
        STEPS.map((step) => {
          const runs = metrics.filter((m) => m.radius === radius && m.step === step);
          const sum = (field: string) => runs.reduce((total, run) => total + Number(run[field]), 0);
          const max = (field: string) => (runs.length ? Math.max(...runs.map((run) => Number(run[field]))).toFixed(1) : "—");
          return `| ${radius} | ${step} | ${runs.filter((m) => m.status === "complete").length}/${corpus.cases.length} | ${sum("pending")} | ${sum("groups")} | ${max("medianMs")} | ${max("p95Ms")} |`;
        })
      ),
      "",
      "¹ Soma por romaneio, não contagem de locais únicos entre arquivos.",
      "",
      "Os tempos medem apenas o gerador espacial, com aquecimento e repetições; não incluem leitura, comparação humana nem cálculo de trajetos. p95 empírico de poucas repetições não certifica desempenho em celular.",
      "",
      "Menos grupos não significa menor percurso. Não há sequência veicular otimizada, caminhada pela malha ou estacionamento certificado nesta etapa.",
      "",
      "## Inspeção local",
      "",
      `- [JSONs para importar no app](importaveis/LEIA-ME.md): ${inspectionFiles.length} variantes no schema v1, com IDs separados; não são roteiros otimizados.`,
      "- manifest.json: correspondência entre case-id e romaneio, hashes e identidade da malha.",
      "- report.json: métricas por cenário, repetições, ambiente e hashes de código.",
      "- details.json: semente, âncora, membros, pendências e compatibilidade das paradas humanas.",
      "- case-*-r*.geojson: entregas e âncoras humanas/provisórias no passo de 10 m; não contém trajeto viário.",
      "",
      "Os dados detalhados são privados. Abra os mapas apenas em ferramenta local; não envie os arquivos a um visualizador público.",
    ].join("\n") + "\n";
  writeFileSync(join(outputDir, "summary.md"), summary);
  writeFileSync(
    join(outputDir, "evidence.txt"),
    [
      "Command: npm run test:auto-anchors",
      `Report: .mentor-saidas/auto-anchors/${runId}/report.json`,
      `Report SHA256: ${hash(readFileSync(join(outputDir, "report.json")))}`,
      `Corpus SHA256: ${corpus.hash}`,
      `Status: ${report.status}`,
      `Cases: ${completedCases.size}/${corpus.cases.length}; scenarios: ${metrics.length}/${expectedRuns}; other-street assertions: ${acceptedRealStreetCases}`,
      `Importable inspections verified with the app importer and isolated IndexedDB: ${inspectionFiles.length}/${expectedInspections}`,
      "Only spatial validity was evaluated; the process exit code must be checked separately.",
    ].join("\n") + "\n"
  );
  console.info(
    `Real corpus report: ${metrics.length}/${expectedRuns} scenarios; ${completedCases.size}/${corpus.cases.length} cases; ${acceptedRealStreetCases} other-street assertions; ${inspectionFiles.length}/${expectedInspections} importable inspections. Output: .mentor-saidas/auto-anchors/${runId}`
  );
  await clearRoteiros();
  await clearManifests();
  check(complete, "Real corpus evaluation did not execute all expected cases or any real other-street example");
});
