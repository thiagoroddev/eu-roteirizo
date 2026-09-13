import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import type { DeliveryPoint } from "../../src/types/routing";
import { buildDeliveryPoints } from "../../src/utils/routing/points";
import { clearManifests, getRouteRows } from "../../src/services/manifestStorage";
import { clearRoteiros, getRoteiro } from "../../src/services/routeStorage";
import { importRoutePayload, parseAndValidateRouteJson } from "../../src/services/routeExport";
import { runFundamentalExperiment, runMultiStartFundamentalExperiment } from "./fundamentalExperiment";
import { createExperimentalRoutePayload, experimentalWinnerFileName, renderExperimentMapHtml, validateExperimentalPayload } from "./experimentArtifacts";

const rows = [
  { Latitude: -22.9, Longitude: -43.2, "Destination Address": "Rua A, 10", "SPX TN": "pkg-a", Sequence: 1 },
  { Latitude: -22.9, Longitude: -43.199, "Destination Address": "Rua B, 20", "SPX TN": "pkg-b", Sequence: 2 },
];

const points = (): DeliveryPoint[] => buildDeliveryPoints(rows);

const graph = {
  coords: new Map([
    ["a", { lat: -22.9, lng: -43.201 }],
    ["b", { lat: -22.9, lng: -43.199 }],
  ]),
  adj: new Map([
    ["a", [{ to: "b", weight: 200, wayName: "Rua A", highway: "residential" }]],
    ["b", [{ to: "a", weight: 200, wayName: "Rua A", highway: "residential" }]],
  ]),
};

describe("fundamental experiment artifacts", () => {
  beforeEach(async () => {
    await clearRoteiros();
    await clearManifests();
  });

  it("exports v1 with all original points and keeps the circuit limit out of manual radius fields", () => {
    const experiment = runFundamentalExperiment({ points: points(), graph, pedestrianGraph: graph });
    const solution = experiment.variants[0].bestByObjective.vehicleDistance;
    const payload = createExperimentalRoutePayload({
      runId: "run-test",
      caseId: "case-test",
      variant: "individual",
      objective: "vehicleDistance",
      sourcePoints: points(),
      sourceRows: rows,
      solution,
    });

    expect(payload.schema).toBe("eu-roteirizo/roteiro/v1");
    expect(payload.points).toEqual(points());
    expect(payload.rows).toEqual(rows);
    expect(payload.route.config.autoRadiusMeters).not.toBe(120);
    expect(payload.route.stops.every((stop) => stop.radiusMeters !== 120)).toBe(true);
    expect(payload.route.stops.every((stop) => stop.vehicleStopIsDefault === true)).toBe(true);
    expect(validateExperimentalPayload(payload, points())).toBe(true);
  });

  it("round-trips through the real parser, importer, storage and reducer input", async () => {
    const sourcePoints = points();
    const experiment = runFundamentalExperiment({ points: sourcePoints, graph, pedestrianGraph: graph });
    const solution = experiment.variants[0].bestByObjective.modeledTime;
    const payload = createExperimentalRoutePayload({
      runId: "run-storage",
      caseId: "case-storage",
      variant: "individual",
      objective: "modeledTime",
      sourcePoints,
      sourceRows: rows,
      solution,
    });
    const serialized = JSON.stringify(payload);
    const parsed = parseAndValidateRouteJson(serialized);

    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    expect((await importRoutePayload(parsed.payload)).ok).toBe(true);
    expect(await getRoteiro(payload.manifestId, payload.routeName)).toEqual(payload.route);
    expect(await getRouteRows(payload.manifestId, payload.routeName)).toEqual(rows);
  });

  it("persists the winning start and gives one recognizable filename to each strategy", () => {
    const sourcePoints = points();
    const experiment = runMultiStartFundamentalExperiment({ points: sourcePoints, graph, pedestrianGraph: graph });
    expect(experiment.winners).toHaveLength(3);

    for (const winner of experiment.winners) {
      const payload = createExperimentalRoutePayload({
        runId: "run-multistart",
        caseId: "opaque-case",
        routeNumber: "1",
        strategy: winner.strategy,
        startPointId: winner.startPointId,
        startPoint: winner.startPoint,
        variant: winner.solution.variant,
        objective: "vehicleDistance",
        sourcePoints,
        sourceRows: rows,
        solution: winner.solution,
        config: { searchRadiusMeters: 60, circuitLimitMeters: 120 },
      });

      expect(payload.route.startPoint).toEqual(winner.startPoint);
      expect(payload.route.stops[0].pointIds).toContain(winner.startPointId);
      expect(payload.routeName).toContain("ROTEIRO 1");
      expect(experimentalWinnerFileName({ routeNumber: "1", strategy: winner.strategy, searchRadiusMeters: 60, circuitLimitMeters: 120 })).toMatch(
        /^1-r60-c120-(com-agrupamento-inicial|sem-agrupamento-inicial|sem-agrupamento)\.json$/
      );
    }
  });

  it("renders the evaluated graph and paths with locally installed Leaflet only", () => {
    const experiment = runFundamentalExperiment({ points: points(), graph, pedestrianGraph: graph });
    const html = renderExperimentMapHtml({ caseId: "case-map", graph, solutions: experiment.variants.flatMap((v) => Object.values(v.bestByObjective)) });

    expect(html).toContain("leaflet");
    expect(html).toContain("Rua A");
    expect(html).toContain(String(points()[0].lat));
    expect(html).toContain("connect-src 'none'");
    expect(html).not.toMatch(/<(?:script|link)[^>]+(?:src|href)=["']https?:/);
    const data = JSON.parse(html.match(/<script id="experiment-data" type="application\/json">(.*?)<\/script>/s)![1]);
    expect(data.solutions[0].vehicle).toEqual(experiment.variants[0].bestByObjective.vehicleDistance.vehicle.legs);
  });

  it("isolates identities across radius configurations even when the chosen route is identical", () => {
    const sourcePoints = points();
    const solution = runFundamentalExperiment({ points: sourcePoints, graph }).variants[0].bestByObjective.vehicleDistance;
    const input = { runId: "same-run", caseId: "same-case", variant: "individual" as const, objective: "vehicleDistance" as const, sourcePoints, sourceRows: rows, solution };
    const first = createExperimentalRoutePayload({ ...input, config: { searchRadiusMeters: 30, circuitLimitMeters: 120 } });
    const second = createExperimentalRoutePayload({ ...input, config: { searchRadiusMeters: 60, circuitLimitMeters: 120 } });
    expect(first.manifestId).not.toBe(second.manifestId);
    expect(first.routeName).not.toBe(second.routeName);
    const missingStop = structuredClone(first);
    missingStop.route.stops = [];
    expect(validateExperimentalPayload(missingStop, sourcePoints)).toBe(false);
  });
});
