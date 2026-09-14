import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import type { DeliveryPoint } from "../../src/types/routing";
import { buildDeliveryPoints } from "../../src/utils/routing/points";
import { clearManifests, getRouteRows } from "../../src/services/manifestStorage";
import { clearRoteiros, getRoteiro } from "../../src/services/routeStorage";
import { importRoutePayload, parseAndValidateRouteJson } from "../../src/services/routeExport";
import { runFundamentalExperiment } from "./fundamentalExperiment";
import { createExperimentalRoutePayload, renderExperimentMapHtml, validateExperimentalPayload } from "./experimentArtifacts";

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

  // ------- Politica de ancoras (TASK-BG-022, INV-001) -------
  // The optimizer's anchor must never reach the app as the user's choice unless the lab asks for it.

  /** A solution whose anchors sit visibly away from the pins, like the midway parking seen in the app. */
  const solutionWithMovedAnchors = () => {
    const sourcePoints = points();
    const solution = structuredClone(runFundamentalExperiment({ points: sourcePoints, graph }).variants[0].bestByObjective.vehicleDistance);
    for (const group of solution.groups) group.anchor.position = { lat: group.anchor.position.lat + 0.0005, lng: group.anchor.position.lng };
    return { sourcePoints, solution };
  };
  const baseInput = { runId: "run-policy", caseId: "case-policy", variant: "individual" as const, objective: "vehicleDistance" as const, sourceRows: rows };

  it("exporta com as ancoras padrao do app sem a chave", () => {
    const { sourcePoints, solution } = solutionWithMovedAnchors();
    const payload = createExperimentalRoutePayload({ ...baseInput, sourcePoints, solution });

    const byId = new Map(sourcePoints.map((p) => [p.id, p]));
    for (const stop of payload.route.stops) {
      const firstPin = byId.get(stop.pointIds[0])!;
      expect(stop.vehicleStopIsDefault).toBe(true);
      expect(stop.vehicleStop).toEqual({ lat: firstPin.lat, lng: firstPin.lng });
    }
    expect(payload.routeName).not.toContain("ANCORAS DO EXPERIMENTO");
    expect(validateExperimentalPayload(payload, sourcePoints)).toBe(true);
  });

  it("so a chave explicita exporta as ancoras do experimento", () => {
    const { sourcePoints, solution } = solutionWithMovedAnchors();
    const payload = createExperimentalRoutePayload({ ...baseInput, sourcePoints, solution, anchorPolicy: "experiment" });

    payload.route.stops.forEach((stop, index) => {
      expect(stop.vehicleStopIsDefault).toBe(false);
      expect(stop.vehicleStop).toEqual(solution.groups[index].anchor.position);
    });
    expect(payload.routeName).toContain("ANCORAS DO EXPERIMENTO");
    expect(payload.manifestId).not.toBe(createExperimentalRoutePayload({ ...baseInput, sourcePoints, solution }).manifestId);
    expect(validateExperimentalPayload(payload, sourcePoints)).toBe(true);
  });

  it("recusa politica de ancoras misturada", () => {
    const { sourcePoints, solution } = solutionWithMovedAnchors();
    const padrao = createExperimentalRoutePayload({ ...baseInput, sourcePoints, solution });
    const experimento = createExperimentalRoutePayload({ ...baseInput, sourcePoints, solution, anchorPolicy: "experiment" });
    expect(padrao.route.stops.length).toBeGreaterThanOrEqual(2); // individual: one stop per address

    // One stop carrying the optimizer's anchor inside a default route.
    const misturado = structuredClone(padrao);
    misturado.route.stops[0].vehicleStopIsDefault = false;
    expect(validateExperimentalPayload(misturado, sourcePoints)).toBe(false);

    // Experiment anchors without the name telling the human so.
    const semAviso = structuredClone(experimento);
    semAviso.routeName = padrao.routeName;
    expect(validateExperimentalPayload(semAviso, sourcePoints)).toBe(false);
  });
});
