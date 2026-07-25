import { describe, it, expect } from "vitest";
import { projectPointOnSegment, nearestEdge, matchToGraph, nearestWayName } from "../../../utils/routing/match";
import { aStar } from "../../../utils/routing/aStar";
import { buildGraph } from "../../../utils/routing/graph";
import type { LatLng } from "../../../types/routing";

/** A single east-west two-way street: node 1 → node 2. */
const street = () =>
  buildGraph([
    {
      type: "way",
      nodes: [1, 2],
      geometry: [
        { lat: -22.98, lon: -43.2 },
        { lat: -22.98, lon: -43.198 },
      ],
      tags: { name: "Rua Reta" },
    },
  ]);

describe("projectPointOnSegment", () => {
  const a: LatLng = { lat: -22.98, lng: -43.2 };
  const b: LatLng = { lat: -22.98, lng: -43.198 }; // due east of a

  it("projects an interior point to the foot of the perpendicular", () => {
    const r = projectPointOnSegment({ lat: -22.981, lng: -43.199 }, a, b); // south of the midpoint
    expect(r.t).toBeCloseTo(0.5, 2);
    expect(r.point.lat).toBeCloseTo(-22.98, 5); // back on the line
    expect(r.point.lng).toBeCloseTo(-43.199, 5);
    expect(r.distance).toBeGreaterThan(0);
  });

  it("clamps to the start when the point is before a", () => {
    const r = projectPointOnSegment({ lat: -22.98, lng: -43.201 }, a, b); // west of a
    expect(r.t).toBe(0);
    expect(r.point).toEqual(a);
  });

  it("clamps to the end when the point is past b", () => {
    const r = projectPointOnSegment({ lat: -22.98, lng: -43.197 }, a, b); // east of b
    expect(r.t).toBe(1);
    expect(r.point).toEqual(b);
  });

  it("returns ~0 distance for a point already on the segment", () => {
    const r = projectPointOnSegment({ lat: -22.98, lng: -43.199 }, a, b);
    expect(r.distance).toBeCloseTo(0, 1);
  });
});

describe("nearestEdge", () => {
  it("matches a mid-block point to the nearest segment (not just a node)", () => {
    const m = nearestEdge(street(), { lat: -22.9805, lng: -43.199 });
    expect(m).not.toBeNull();
    expect([m?.from, m?.to].sort()).toEqual([1, 2]);
    expect(m?.point.lng).toBeCloseTo(-43.199, 4); // projected mid-block onto the street
    expect(m?.point.lat).toBeCloseTo(-22.98, 5);
  });

  it("returns null for an empty graph", () => {
    expect(nearestEdge(buildGraph([]), { lat: -22.98, lng: -43.2 })).toBeNull();
  });
});

describe("matchToGraph", () => {
  it("inserts a synthetic node on the street and lets A* route to it from both ends", () => {
    const result = matchToGraph(street(), { lat: -22.9805, lng: -43.199 });
    expect(result).not.toBeNull();

    const { graph, node } = result!;
    expect(typeof node).toBe("string");
    expect(graph.coords.get(node)?.lng).toBeCloseTo(-43.199, 4); // mid-block on the street
    expect(graph.coords.get(node)?.lat).toBeCloseTo(-22.98, 5);

    const fromStart = aStar(graph, 1, node);
    expect(fromStart.path?.[0]).toBe(1);
    expect(fromStart.path?.[fromStart.path.length - 1]).toBe(node);
    expect(fromStart.distance).toBeGreaterThan(0);

    const fromEnd = aStar(graph, 2, node); // two-way street → reachable from the other end too
    expect(fromEnd.path?.[fromEnd.path.length - 1]).toBe(node);
  });

  it("does not mutate the original graph", () => {
    const g = street();
    const before = g.coords.size;
    matchToGraph(g, { lat: -22.9805, lng: -43.199 });
    expect(g.coords.size).toBe(before); // the synthetic node only exists in the returned graph
  });

  it("returns null for an empty graph", () => {
    expect(matchToGraph(buildGraph([]), { lat: -22.98, lng: -43.2 })).toBeNull();
  });
});

describe("nearestWayName", () => {
  it("returns the OSM name of the nearest street", () => {
    // A point just south of the named street snaps to it → its name.
    expect(nearestWayName(street(), { lat: -22.9805, lng: -43.199 })).toBe("Rua Reta");
  });

  it("returns null when the graph is not loaded yet", () => {
    expect(nearestWayName(null, { lat: -22.98, lng: -43.2 })).toBeNull();
  });

  it("returns null for an empty graph (no edge to name)", () => {
    expect(nearestWayName(buildGraph([]), { lat: -22.98, lng: -43.2 })).toBeNull();
  });

  it("returns null when the nearest way has no OSM name (generic highway class, not an address)", () => {
    // No `name` tag → buildGraph stores the highway class as wayName → treated as "no real name".
    const unnamed = buildGraph([
      {
        type: "way",
        nodes: [1, 2],
        geometry: [
          { lat: -22.98, lon: -43.2 },
          { lat: -22.98, lon: -43.198 },
        ],
        tags: { highway: "residential" },
      },
    ]);
    expect(nearestWayName(unnamed, { lat: -22.9805, lng: -43.199 })).toBeNull();
  });

  it("picks the nearer of two named streets", () => {
    const two = buildGraph([
      {
        type: "way",
        nodes: [1, 2],
        geometry: [
          { lat: -22.98, lon: -43.2 },
          { lat: -22.98, lon: -43.198 },
        ],
        tags: { name: "Rua Norte" },
      },
      {
        type: "way",
        nodes: [3, 4],
        geometry: [
          { lat: -22.99, lon: -43.2 },
          { lat: -22.99, lon: -43.198 },
        ],
        tags: { name: "Rua Sul" },
      },
    ]);
    expect(nearestWayName(two, { lat: -22.9895, lng: -43.199 })).toBe("Rua Sul"); // closer to the southern street
  });
});
