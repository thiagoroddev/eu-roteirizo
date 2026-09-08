import { describe, it, expect } from "vitest";
import { onewayDirection, buildGraph, nearestNode, nodeAt, pathToLatLngs } from "../../../utils/routing/graph";
import type { OsmElement } from "../../../utils/routing/graph";
import { squareGraph, A, B, C, D, COORDS, W_VERTICAL, W_HORIZONTAL } from "./__fixtures__/syntheticGraph";

const pt = (lat: number, lon: number) => ({ lat, lon });

describe("onewayDirection", () => {
  it("treats yes/true/1 as forward (case-insensitive)", () => {
    expect(onewayDirection({ oneway: "yes" })).toBe("forward");
    expect(onewayDirection({ oneway: "true" })).toBe("forward");
    expect(onewayDirection({ oneway: "1" })).toBe("forward");
    expect(onewayDirection({ oneway: "YES" })).toBe("forward");
  });

  it("treats -1/reverse as backward", () => {
    expect(onewayDirection({ oneway: "-1" })).toBe("backward");
    expect(onewayDirection({ oneway: "reverse" })).toBe("backward");
  });

  it("treats absent or no as both", () => {
    expect(onewayDirection({})).toBe("both");
    expect(onewayDirection()).toBe("both");
    expect(onewayDirection({ oneway: "no" })).toBe("both");
  });

  it("treats a roundabout as forward", () => {
    expect(onewayDirection({ junction: "roundabout" })).toBe("forward");
  });

  it("treats circular junction as forward", () => {
    expect(onewayDirection({ junction: "circular" })).toBe("forward");
    expect(onewayDirection({ junction: "CIRCULAR" })).toBe("forward");
  });

  it("treats motorway and motorway_link as forward by default, but respects oneway=no", () => {
    expect(onewayDirection({ highway: "motorway" })).toBe("forward");
    expect(onewayDirection({ highway: "motorway_link" })).toBe("forward");
    expect(onewayDirection({ highway: "motorway", oneway: "no" })).toBe("both");
    expect(onewayDirection({ highway: "motorway_link", oneway: "no" })).toBe("both");
    expect(onewayDirection({ highway: "motorway", oneway: "0" })).toBe("both");
    expect(onewayDirection({ highway: "motorway", oneway: "false" })).toBe("both");
    expect(onewayDirection({ junction: "roundabout", oneway: "no" })).toBe("both");
    expect(onewayDirection({ junction: "circular", oneway: "no" })).toBe("both");
  });

  it("lets an explicit oneway win over roundabout", () => {
    expect(onewayDirection({ oneway: "-1", junction: "roundabout" })).toBe("backward");
  });
});

describe("buildGraph", () => {
  it("creates both directions for a two-way street", () => {
    expect((squareGraph.adj.get(A) ?? []).some((e) => e.to === C)).toBe(true);
    expect((squareGraph.adj.get(C) ?? []).some((e) => e.to === A)).toBe(true);
  });

  it("creates a single direction for a one-way street (no wrong-way edge)", () => {
    expect((squareGraph.adj.get(A) ?? []).some((e) => e.to === B)).toBe(true); // A→B allowed
    expect((squareGraph.adj.get(B) ?? []).some((e) => e.to === A)).toBe(false); // B→A forbidden
  });

  it("weights edges by haversine length", () => {
    const aEdges = squareGraph.adj.get(A) ?? [];
    expect(aEdges.find((e) => e.to === B)?.weight).toBeCloseTo(W_VERTICAL, 1);
    expect(aEdges.find((e) => e.to === C)?.weight).toBeCloseTo(W_HORIZONTAL, 1);
  });

  it("normalizes OSM lon to the project's lng", () => {
    expect(squareGraph.coords.get(A)).toEqual(COORDS[A]);
    expect(squareGraph.coords.get(D)).toEqual(COORDS[D]);
  });

  it("derives wayName from name, then highway, then 'via'", () => {
    const g = buildGraph([
      { type: "way", nodes: [201, 202], geometry: [pt(-22.98, -43.2), pt(-22.98, -43.199)], tags: { name: "Av Principal", highway: "primary" } },
      { type: "way", nodes: [203, 204], geometry: [pt(-22.97, -43.2), pt(-22.97, -43.199)], tags: { highway: "residential" } },
      { type: "way", nodes: [205, 206], geometry: [pt(-22.96, -43.2), pt(-22.96, -43.199)], tags: {} },
    ]);
    expect(g.adj.get(201)?.[0].wayName).toBe("Av Principal");
    expect(g.adj.get(203)?.[0].wayName).toBe("residential");
    expect(g.adj.get(205)?.[0].wayName).toBe("via");
  });

  it("ignores non-way elements and ways missing geometry/nodes", () => {
    const g = buildGraph([
      { type: "node", nodes: [1], geometry: [pt(0, 0)] },
      { type: "way", tags: { name: "x" } },
      { type: "way", nodes: [1, 2] },
    ]);
    expect(g.coords.size).toBe(0);
    expect(g.adj.size).toBe(0);
  });

  it("skips segments whose geometry is null", () => {
    const g = buildGraph([{ type: "way", nodes: [301, 302, 303], geometry: [pt(-22.98, -43.2), null, pt(-22.98, -43.198)], tags: { name: "X" } }]);
    expect(g.coords.size).toBe(2); // 301 and 303; 302 has null geometry
    expect(g.adj.size).toBe(0); // both segments touch the null point
  });

  it("returns an empty graph for empty input", () => {
    const g = buildGraph([] as OsmElement[]);
    expect(g.coords.size).toBe(0);
    expect(g.adj.size).toBe(0);
  });
});

describe("nearestNode", () => {
  it("snaps a coordinate to the closest node", () => {
    const result = nearestNode(squareGraph, { lat: -22.9802, lng: -43.2002 });
    expect(result.node).toBe(A);
    expect(result.dist).toBeCloseTo(30.23, 1);
  });

  it("returns {null, Infinity} for an empty graph", () => {
    const result = nearestNode(buildGraph([]), { lat: -22.98, lng: -43.2 });
    expect(result.node).toBeNull();
    expect(result.dist).toBe(Infinity);
  });
});

describe("nodeAt", () => {
  it("returns the node when present", () => {
    expect(nodeAt(squareGraph, A)).toEqual({ id: A, ...COORDS[A] });
  });

  it("returns null when absent", () => {
    expect(nodeAt(squareGraph, 999)).toBeNull();
  });
});

describe("pathToLatLngs", () => {
  it("resolves an A* path to coordinates in order", () => {
    expect(pathToLatLngs(squareGraph, [A, B])).toEqual([COORDS[A], COORDS[B]]);
  });

  it("skips ids the graph doesn't know (defensive) and handles empty paths", () => {
    expect(pathToLatLngs(squareGraph, [A, 999, B])).toEqual([COORDS[A], COORDS[B]]);
    expect(pathToLatLngs(squareGraph, [])).toEqual([]);
  });
});
