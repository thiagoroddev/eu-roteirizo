import { describe, expect, it } from "vitest";
import type { DeliveryPoint, LatLng } from "../../../types/routing";
import { generateAnchorAlternatives } from "../../../utils/routing/autoRouteAnchors";
import { buildGraph, type RoadGraph } from "../../../utils/routing/graph";
import { haversine } from "../../../utils/routing/geo";
import { suggestVehicleStop } from "../../../utils/routing/vehicleStop";

const point = (id: string, lat: number, lng: number, count = 1): DeliveryPoint => ({
  id,
  lat,
  lng,
  address: `Address ${id}`,
  packageCount: count,
  packages: Array.from({ length: count }, (_, index) => ({ id: `${id}-${index}`, rawData: {} })),
});
const road = (ids: number[], positions: LatLng[], name: string, oneway = "no") => ({
  type: "way",
  nodes: ids,
  geometry: positions.map((p) => ({ lat: p.lat, lon: p.lng })),
  tags: { name, highway: "residential", oneway },
});
const roads = [
  road(
    [1, 2],
    [
      { lat: -22.98, lng: -43.2 },
      { lat: -22.981, lng: -43.2 },
    ],
    "West",
    "yes"
  ),
  road(
    [3, 4],
    [
      { lat: -22.98, lng: -43.1995 },
      { lat: -22.981, lng: -43.1995 },
    ],
    "East"
  ),
];
const graph = buildGraph(roads);
const points = [point("a", -22.98025, -43.1999, 2), point("b", -22.9807, -43.1999)];

describe("anchor alternatives", () => {
  it("keeps alternatives on a parallel road instead of only the nearest street", () => {
    const result = generateAnchorAlternatives({ graph, points, radiusMeters: 80 });
    expect(result.status).toBe("complete");
    const coveringBoth = result.candidates.filter((c) => c.pointIds.length === 2);
    expect(new Set(coveringBoth.map((c) => c.segment.wayName))).toEqual(new Set(["West", "East"]));
    expect(coveringBoth.every((c) => !points.some((p) => p.lat === c.position.lat && p.lng === c.position.lng))).toBe(true);
  });

  it("reproduces the selected seed default and preserves source addresses and packages", () => {
    const before = structuredClone(points);
    const result = generateAnchorAlternatives({ graph, points, radiusMeters: 80 });
    for (const seed of points) {
      const actual = result.defaultAnchors.find((a) => a.seedPointId === seed.id)!;
      const expected = suggestVehicleStop(graph, seed);
      expect(actual.position!.lat).toBeCloseTo(expected.lat, 10);
      expect(actual.position!.lng).toBeCloseTo(expected.lng, 10);
    }
    expect(points).toEqual(before);
    expect(result.groups.flatMap((g) => g.pointIds).sort()).toEqual(["a", "b"]);
    expect(result.groups.reduce((n, g) => n + g.packageCount, 0)).toBe(3);
  });

  it("keeps ignored deliveries separate from covered or pending points", () => {
    const result = generateAnchorAlternatives({ graph, points, radiusMeters: 80, ignoredPointIds: ["b"] });
    expect(result.ignoredPointIds).toEqual(["b"]);
    expect(result.groups.flatMap((g) => g.pointIds)).toEqual(["a"]);
    expect(result.candidates.every((c) => !c.pointIds.includes("b"))).toBe(true);
  });

  it.each([30, 60, 90, 120])("enforces the configured %im radius for every candidate member", (radiusMeters) => {
    const result = generateAnchorAlternatives({ graph, points, radiusMeters });
    expect(result.candidates.length).toBeGreaterThan(0);
    for (const candidate of result.candidates)
      for (const id of candidate.pointIds) {
        expect(haversine(candidate.position, points.find((p) => p.id === id)!)).toBeLessThanOrEqual(radiusMeters);
      }
  });

  it("distinguishes the exact boundary from just outside it", () => {
    const endpoint = { lat: -22.98, lng: -43.2 };
    const north = point("n", -22.9799, -43.2);
    const radiusMeters = haversine(endpoint, north);
    const only = buildGraph([roads[0]]);
    expect(generateAnchorAlternatives({ graph: only, points: [north], radiusMeters }).groups).toHaveLength(1);
    expect(generateAnchorAlternatives({ graph: only, points: [north], radiusMeters: radiusMeters - 0.00001 }).pending).toEqual([{ pointId: "n", reason: "no-candidate-in-radius" }]);
  });

  it("keeps a narrow joint coverage interval between regular samples", () => {
    const close = [point("n", -22.980431, -43.2), point("s", -22.980509, -43.2)];
    const result = generateAnchorAlternatives({ graph: buildGraph([roads[0]]), points: close, radiusMeters: 4.4, options: { sampleStepMeters: 20 } });
    expect(result.candidates.some((c) => c.pointIds.length === 2)).toBe(true);
  });

  it("preserves disconnected overlapping segments and one-way accesses", () => {
    const coincident = buildGraph([
      roads[0],
      road(
        [8, 9],
        [
          { lat: -22.98, lng: -43.2 },
          { lat: -22.981, lng: -43.2 },
        ],
        "Bridge"
      ),
    ]);
    const result = generateAnchorAlternatives({ graph: coincident, points, radiusMeters: 80 });
    expect(new Set(result.candidates.map((c) => c.segment.id)).size).toBe(2);
    expect(result.candidates.filter((c) => c.segment.wayName === "West").every((c) => JSON.stringify(c.segment.directions) === JSON.stringify([{ from: 1, to: 2 }]))).toBe(true);
    expect(result.candidates.filter((c) => c.segment.wayName === "Bridge").every((c) => c.segment.directions.length === 2)).toBe(true);
  });

  it("is deterministic across input and graph enumeration without mutation", () => {
    const before = structuredClone(graph);
    const reversed: RoadGraph = { coords: new Map([...graph.coords].reverse()), adj: new Map([...graph.adj].reverse().map(([id, edges]) => [id, [...edges].reverse()])) };
    const first = generateAnchorAlternatives({ graph, points, radiusMeters: 80 });
    expect(first.candidates.length).toBeGreaterThan(0);
    expect(generateAnchorAlternatives({ graph: reversed, points: [...points].reverse(), radiusMeters: 80 })).toEqual(first);
    expect(graph).toEqual(before);
  });

  it("does not approve a default anchor outside the radius or fall back without a graph", () => {
    const far = point("far", -23, -43.2);
    const result = generateAnchorAlternatives({ graph, points: [far], radiusMeters: 30 });
    expect(result.defaultAnchors[0].position).not.toBeNull();
    expect(result.defaultAnchors[0].withinRadius).toBe(false);
    expect(result.pending).toEqual([{ pointId: "far", reason: "no-candidate-in-radius" }]);
    expect(generateAnchorAlternatives({ graph: null, points, radiusMeters: 30 }).pending).toHaveLength(2);
  });

  it("reports candidate budget exhaustion explicitly", () => {
    const result = generateAnchorAlternatives({ graph, points, radiusMeters: 80, options: { maxCandidates: 1 } });
    expect(result.status).toBe("partial");
    expect(result.diagnostics.limitReached).toBe(true);
    expect(result.candidates.length).toBeLessThanOrEqual(1);
    expect(result.pending.every((p) => p.reason === "search-limit")).toBe(true);
  });

  it.each(["maxSegments", "maxGridCells", "maxDistanceChecks", "maxGroupChecks"] as const)("respects the %s work limit", (key) => {
    const result = generateAnchorAlternatives({ graph, points, radiusMeters: 80, options: { [key]: 1 } });
    expect(result.status).toBe("partial");
    expect(result.diagnostics.limitReached).toBe(true);
    expect(result.pending.every((p) => p.reason === "search-limit")).toBe(true);
  });

  it("terminates for a sampling step below floating-point index precision", () => {
    const result = generateAnchorAlternatives({ graph, points, radiusMeters: 80, options: { sampleStepMeters: Number.MIN_VALUE } });
    expect(result.status).toBe("partial");
    expect(result.diagnostics.limitReached).toBe(true);
  });

  it("handles empty input and a zero radius on an exact street point", () => {
    expect(generateAnchorAlternatives({ graph, points: [], radiusMeters: 30 }).status).toBe("complete");
    const exact = point("exact", -22.98, -43.2);
    expect(generateAnchorAlternatives({ graph, points: [exact], radiusMeters: 0 }).groups).toHaveLength(1);
  });

  it("rejects invalid coordinates, repeated ids, invalid options and pedestrian-only graphs", () => {
    for (const [input, expectedError] of [
      [{ graph, points: [point("bad", NaN, -43.2)], radiusMeters: 30 }, "invalid-point"],
      [{ graph, points: [points[0], points[0]], radiusMeters: 30 }, "duplicate-point-id"],
      [{ graph, points, radiusMeters: -1 }, "invalid-radius"],
      [{ graph, points, radiusMeters: 30, options: { sampleStepMeters: 0 } }, "invalid-options"],
      [{ graph: { ...graph, isPedestrian: true }, points, radiusMeters: 30 }, "pedestrian-only-graph"],
    ] as const) {
      const result = generateAnchorAlternatives(input);
      expect(result.status).toBe("invalid");
      expect(result.errors).toContain(expectedError);
    }
  });
});
