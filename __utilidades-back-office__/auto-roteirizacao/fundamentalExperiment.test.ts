import { describe, expect, it } from "vitest";
import { haversine } from "../../src/utils/routing/geo";
import type { Edge, RoadGraph } from "../../src/utils/routing/graph";
import type { DeliveryPoint } from "../../src/types/routing";
import { DEFAULT_FUNDAMENTAL_EXPERIMENT_CONFIG, runFundamentalExperiment, type FundamentalExperimentConfig } from "./fundamentalExperiment";
import { buildFundamentalReferences } from "./fundamentals";
import { evaluateLimitedFundamentalCircuit, evaluateStreetPath } from "./experimentPaths";
import { pedestrianGraph } from "../../src/utils/routing/pedestrian";

const lat = -22.9;
const point = (id: string, lng: number, packages = [id]): DeliveryPoint => ({
  id,
  lat,
  lng,
  address: `Rua ${id}, 10`,
  packageCount: packages.length,
  packages: packages.map((pkg) => ({ id: pkg, tracking: pkg, rawData: { Latitude: lat, Longitude: lng, "SPX TN": pkg } })),
});

const graphFrom = (coords: Record<string, { lat: number; lng: number }>, edges: [string, string][]): RoadGraph => {
  const adj = new Map<string, Edge[]>();
  for (const [from, to] of edges) {
    const list = adj.get(from) ?? [];
    const weight = haversine(coords[from], coords[to]);
    list.push({ to, weight, wayName: "Rua de teste", highway: "residential" });
    adj.set(from, list);
  }
  return { coords: new Map(Object.entries(coords)), adj };
};

const lineGraph = (): RoadGraph => {
  const coords = {
    a: { lat, lng: -43.2 },
    b: { lat, lng: -43.199 },
    c: { lat, lng: -43.198 },
    d: { lat, lng: -43.197 },
  };
  return graphFrom(coords, [
    ["a", "b"],
    ["b", "a"],
    ["b", "c"],
    ["c", "b"],
    ["c", "d"],
    ["d", "c"],
  ]);
};

const withConfig = (config: Partial<FundamentalExperimentConfig>): FundamentalExperimentConfig => ({
  ...DEFAULT_FUNDAMENTAL_EXPERIMENT_CONFIG,
  ...config,
});

describe("fundamental experiment contracts", () => {
  it("routes two projections on the same segment in each permitted direction", () => {
    const coords = { a: { lat, lng: -43.2 }, b: { lat, lng: -43.199 } };
    const graph = graphFrom(coords, [["a", "b"]]);
    const [first, last] = buildFundamentalReferences([point("p1", -43.1998), point("p2", -43.1992)], graph).references;
    const from = { position: first.position, segment: first.segment };
    const to = { position: last.position, segment: last.segment };
    const forward = evaluateStreetPath(graph, from, to);
    expect(forward.kind).toBe("street");
    expect(forward.distanceMeters).toBeCloseTo(haversine(first.position, last.position), 3);
    expect(forward.path[0]).toEqual(first.position);
    expect(forward.path.at(-1)).toEqual(last.position);
    expect(evaluateStreetPath(graph, to, from).kind).toBe("missing");
    expect(evaluateStreetPath(pedestrianGraph(graph), to, from).kind).toBe("street");
  });

  it("does not merge coincident projections on disconnected segment identities", () => {
    const coords = { a: { lat, lng: -43.2 }, b: { lat, lng: -43.199 }, c: { lat, lng: -43.2 }, d: { lat, lng: -43.199 } };
    const graph = graphFrom(coords, [
      ["a", "b"],
      ["c", "d"],
    ]);
    const position = { lat, lng: -43.1995 };
    const segment = (from: string, to: string) => ({
      id: JSON.stringify([`string:${from}`, `string:${to}`, "Rua de teste", "residential", false]),
      from,
      to,
      wayName: "Rua de teste",
      directions: [{ from, to }],
    });
    expect(evaluateStreetPath(graph, { position, segment: segment("a", "b") }, { position, segment: segment("c", "d") }).kind).toBe("missing");
  });

  it("retains every delivery when the revisable alternative budget is smaller than the route", () => {
    const graph = lineGraph();
    const points = Array.from({ length: 28 }, (_, index) => point(`p${index}`, -43.2 + (index + 1) * 0.00009));
    const experiment = runFundamentalExperiment({
      points,
      graph,
      pedestrianGraph: pedestrianGraph(graph),
      config: { maxRevisableAlternatives: 2, maxGroupOperations: 1, maxCandidatesPerGroup: 2, maxOrderEvaluations: 2 },
    });
    for (const variant of experiment.variants)
      for (const solution of Object.values(variant.bestByObjective)) {
        expect(solution.pendingPointIds).toEqual([]);
        expect(solution.groups.flatMap((group) => group.pointIds).sort()).toEqual(points.map((p) => p.id).sort());
      }
  });

  it("marks a graphless individual incomplete without losing its logical stop", () => {
    const result = runFundamentalExperiment({ points: [point("p1", -43.199)], graph: null });
    expect(result.variants[0].bestByObjective.vehicleDistance.status).toBe("partial");
    expect(result.variants[0].bestByObjective.vehicleDistance.groups[0].pointIds).toEqual(["p1"]);
  });

  it("rejects invalid experiment limits without entering the search", () => {
    const result = runFundamentalExperiment({ points: [point("p1", -43.199)], graph: lineGraph(), config: { maxOrderEvaluations: -1 } });
    expect(result.status).toBe("invalid");
  });

  it("matches an independent open-route oracle on a small directed cycle", () => {
    const coords = { a: { lat, lng: -43.2 }, b: { lat, lng: -43.199 }, c: { lat: lat + 0.001, lng: -43.199 } };
    const graph = graphFrom(coords, [
      ["a", "b"],
      ["b", "c"],
      ["c", "a"],
    ]);
    const points = [point("a", coords.a.lng), point("b", coords.b.lng), { ...point("c", coords.c.lng), lat: coords.c.lat }];
    const result = runFundamentalExperiment({ points, graph, config: { maxOrderEvaluations: 6, maxGroupOperations: 1, maxRevisableAlternatives: 2 } });
    const edges = [haversine(coords.a, coords.b), haversine(coords.b, coords.c), haversine(coords.c, coords.a)];
    const oracle = edges.reduce((a, b) => a + b, 0) - Math.max(...edges);
    const individual = result.variants[0].bestByObjective.vehicleDistance;
    expect(individual.status).toBe("complete");
    expect(individual.vehicleDistanceMeters).toBeCloseTo(oracle, 3);
    expect(individual.groups.every((group) => group.limitedCircuitMeters === 0)).toBe(true);
  });
  it("keeps a distant pin in a complete individual stop and separates circuit from access", () => {
    const graph = lineGraph();
    const pin = point("p1", -43.1985);
    pin.lat = lat + 0.0008;
    const result = runFundamentalExperiment({ points: [pin], graph, pedestrianGraph: graph });
    const individual = result.variants.find((variant) => variant.kind === "individual")?.bestByObjective.modeledTime;

    expect(individual?.status).toBe("complete");
    expect(individual?.pendingPointIds).toEqual([]);
    expect(individual?.groups[0]?.pointIds).toEqual(["p1"]);
    expect(individual?.groups[0]?.limitedCircuitMeters).toBeCloseTo(0, 6);
    expect(individual?.groups[0]?.accessMeters).toBeGreaterThan(0);
    expect(individual?.fullWalkingMeters).toBeGreaterThan(individual?.limitedCircuitMeters ?? 0);
  });

  it("does not move the fundamental reference when a final anchor is evaluated elsewhere", () => {
    const graph = lineGraph();
    const original = point("p1", -43.1994);
    const [reference] = buildFundamentalReferences([original], graph).references;
    const movedAnchor = { lat, lng: -43.1972 };
    const circuit = evaluateLimitedFundamentalCircuit(graph, movedAnchor, [reference], 120);

    expect(reference.position.lng).toBeCloseTo(-43.1994, 6);
    expect(reference.originalPosition).toEqual({ lat, lng: -43.1994 });
    expect(circuit.anchor).toEqual(movedAnchor);
    expect(reference.position).not.toEqual(movedAnchor);
  });

  it("closes the limited circuit and rejects an over-limit chained group", () => {
    const graph = lineGraph();
    const points = [point("p1", -43.1998), point("p2", -43.1982)];
    const references = buildFundamentalReferences(points, graph).references;
    const atLimit = evaluateLimitedFundamentalCircuit(graph, references[0].position, [references[0]], 0);
    const overLimit = evaluateLimitedFundamentalCircuit(graph, references[0].position, references, 120);

    expect(atLimit.valid).toBe(true);
    expect(atLimit.path[0]).toEqual(atLimit.path.at(-1));
    expect(overLimit.closed).toBe(true);
    expect(overLimit.exceedsLimit).toBe(true);
    expect(overLimit.distanceMeters).toBeGreaterThan(120);
    const exactMeters = 2 * haversine(references[0].position, references[1].position);
    const exact = evaluateLimitedFundamentalCircuit(graph, references[0].position, references, exactMeters);
    expect(exact.distanceMeters).toBeCloseTo(exactMeters, 3);
    expect(exact.exceedsLimit).toBe(false);
    expect(evaluateLimitedFundamentalCircuit(graph, references[0].position, references, exactMeters - 0.01).exceedsLimit).toBe(true);
  });

  it("treats the circuit limit and the approximation radius as independent settings", () => {
    const graph = lineGraph();
    const points = [point("p1", -43.1998), point("p2", -43.1982)];
    const result = runFundamentalExperiment({
      points,
      graph,
      pedestrianGraph: graph,
      config: withConfig({ searchRadiusMeters: 60, circuitLimitMeters: 60 }),
    });
    const fixed = result.variants.find((variant) => variant.kind === "fixed-groups")?.bestByObjective.vehicleDistance;

    expect(result.config.searchRadiusMeters).toBe(60);
    expect(result.config.circuitLimitMeters).toBe(60);
    expect(fixed?.groups.every((group) => group.limitedCircuitMeters <= 60 + 1e-6)).toBe(true);
    expect(fixed?.groups.flatMap((group) => group.pointIds).sort()).toEqual(["p1", "p2"]);
  });

  it("keeps individual anchors on their own fundamentals while optimizing only vehicle order", () => {
    const graph = lineGraph();
    const points = [point("p1", -43.1998), point("p2", -43.1989)];
    const references = new Map(buildFundamentalReferences(points, graph).references.map((reference) => [reference.pointId, reference]));
    const individual = runFundamentalExperiment({ points, graph, pedestrianGraph: graph }).variants.find((variant) => variant.kind === "individual")?.bestByObjective.vehicleDistance;

    expect(individual?.groups).toHaveLength(points.length);
    expect(individual?.groups.every((group) => group.anchor.source === "fundamental")).toBe(true);
    expect(
      individual?.groups.every((group) => {
        const reference = references.get(group.pointIds[0]);
        return group.anchor.position.lat === reference?.position.lat && group.anchor.position.lng === reference?.position.lng;
      })
    ).toBe(true);
  });

  it("does not turn a disconnected vehicle path into a straight-line success", () => {
    const graph = graphFrom(
      {
        a: { lat, lng: -43.2 },
        b: { lat, lng: -43.199 },
        c: { lat, lng: -43.198 },
        d: { lat, lng: -43.197 },
      },
      [
        ["a", "b"],
        ["c", "d"],
      ]
    );
    const path = evaluateStreetPath(graph, { lat, lng: -43.1998 }, { lat, lng: -43.1972 });

    expect(path.kind).toBe("missing");
    expect(path.viaStreets).toBe(false);
    expect(path.distanceMeters).toBe(Infinity);
    expect(path.path).toEqual([]);
  });

  it("rejects duplicated or missing package identity without changing the input", () => {
    const invalid = point("p1", -43.199, ["same", "same"]);
    const before = structuredClone(invalid);
    invalid.packageCount = 3;
    const result = runFundamentalExperiment({ points: [invalid], graph: lineGraph(), pedestrianGraph: lineGraph() });

    expect(result.status).toBe("invalid");
    expect(result.diagnostics).toContain("package-count-mismatch");
    expect(result.diagnostics).toContain("duplicate-package-id");
    expect(invalid).toEqual({ ...before, packageCount: 3 });
  });

  it("is deterministic and leaves points, packages and graph untouched", () => {
    const graph = lineGraph();
    const points = [point("p1", -43.1997, ["a", "b"]), point("p2", -43.1983)];
    const beforePoints = structuredClone(points);
    const beforeGraph = structuredClone({ coords: [...graph.coords], adj: [...graph.adj] });
    const config = withConfig({ maxCandidatesPerGroup: 4, maxOrderEvaluations: 24, maxRefinementPasses: 2 });

    const first = runFundamentalExperiment({ points, graph, pedestrianGraph: graph, config });
    const second = runFundamentalExperiment({ points, graph, pedestrianGraph: graph, config });

    expect(second).toEqual(first);
    expect(points).toEqual(beforePoints);
    expect({ coords: [...graph.coords], adj: [...graph.adj] }).toEqual(beforeGraph);
  });

  it("bounds and reports revisable alternatives and local group operations", () => {
    const graph = lineGraph();
    const points = [point("p1", -43.1998), point("p2", -43.1992), point("p3", -43.1986), point("p4", -43.198)];
    const config = withConfig({
      maxRevisableAlternatives: 2,
      maxGroupOperations: 1,
      maxCandidatesPerGroup: 4,
      maxOrderEvaluations: 24,
    });

    const revisable = runFundamentalExperiment({ points, graph, pedestrianGraph: graph, config }).variants.find((variant) => variant.kind === "revisable");

    expect(revisable?.definitionsEvaluated).toBeLessThanOrEqual(config.maxRevisableAlternatives);
    expect(revisable?.bestByObjective.vehicleDistance.operationsEvaluated).toBeLessThanOrEqual(config.maxGroupOperations);
    expect(revisable?.bestByObjective.modeledTime.operationsEvaluated).toBeLessThanOrEqual(config.maxGroupOperations);
    expect(revisable?.bestByObjective.vehicleDistance.workLimitReached).toBe(true);
    expect(revisable?.bestByObjective.modeledTime.workLimitReached).toBe(true);
  });
});
