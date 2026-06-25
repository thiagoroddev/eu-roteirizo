import { describe, it, expect } from "vitest";
import { aStar } from "../../../utils/routing/aStar";
import { buildGraph } from "../../../utils/routing/graph";
import { squareGraph, SQUARE_WAYS, A, B, C, D, W_VERTICAL, DETOUR_B_TO_A, gridGraph } from "./__fixtures__/syntheticGraph";

describe("aStar", () => {
  it("goes straight in the permitted direction", () => {
    const result = aStar(squareGraph, A, B);
    expect(result.path).toEqual([A, B]);
    expect(result.distance).toBeCloseTo(W_VERTICAL, 1);
  });

  it("detours against a one-way street (never takes the wrong way)", () => {
    const result = aStar(squareGraph, B, A);
    expect(result.path).toEqual([B, D, C, A]);
    expect(result.distance).toBeCloseTo(DETOUR_B_TO_A, 1);
  });

  it("makes the detour longer than the forbidden straight line", () => {
    const result = aStar(squareGraph, B, A);
    expect(result.distance).toBeGreaterThan(W_VERTICAL);
  });

  it("returns {null, Infinity} when the goal is unreachable (disconnected)", () => {
    const disconnected = buildGraph([
      ...SQUARE_WAYS,
      {
        type: "way",
        nodes: [50, 51],
        geometry: [
          { lat: -22.99, lon: -43.21 },
          { lat: -22.99, lon: -43.209 },
        ],
        tags: { name: "Ilha" },
      },
    ]);
    const result = aStar(disconnected, A, 50);
    expect(result.path).toBeNull();
    expect(result.distance).toBe(Infinity);
  });

  it("returns {null, Infinity} when the start node is absent (guard)", () => {
    const result = aStar(squareGraph, 999, A);
    expect(result.path).toBeNull();
    expect(result.distance).toBe(Infinity);
  });

  it("returns {null, Infinity} when the goal node is absent (guard, no crash)", () => {
    const result = aStar(squareGraph, A, 999);
    expect(result.path).toBeNull();
    expect(result.distance).toBe(Infinity);
  });

  it("returns a zero-length path from a node to itself", () => {
    const result = aStar(squareGraph, A, A);
    expect(result.path).toEqual([A]);
    expect(result.distance).toBe(0);
  });
});

// TASK-RF-005.4: the heap frontier must keep results correct at neighborhood scale.
describe("aStar at scale (min-heap frontier)", () => {
  it("finds an optimal corner-to-corner path on a large grid", () => {
    const n = 50;
    const graph = gridGraph(n); // 2500 nodes
    const goal = n * n - 1;

    // Warm-up + timing over a few runs (informational; vitest's timeout guards against hangs).
    let result = aStar(graph, 0, goal);
    const runs = 5;
    const t0 = performance.now();
    for (let i = 0; i < runs; i++) result = aStar(graph, 0, goal);
    const avgMs = (performance.now() - t0) / runs;
    if (import.meta.env.DEV) console.info(`aStar grid ${n}x${n} (${graph.coords.size} nós): ${avgMs.toFixed(1)} ms/run`);

    expect(result.path?.[0]).toBe(0);
    expect(result.path?.[result.path.length - 1]).toBe(goal);
    expect(result.path?.length).toBe(2 * n - 1); // monotone staircase (optimal in a grid)
    expect(Number.isFinite(result.distance)).toBe(true);
    expect(result.distance).toBeGreaterThan(0);
  });
});
