import { describe, it, expect } from "vitest";
import { aStar, turnAngle } from "../../../utils/routing/aStar";
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

  it("connects avenues via link road instead of straight fallback", () => {
    const linkedGraph = buildGraph([
      {
        type: "way",
        nodes: [101, 102],
        geometry: [
          { lat: -22.98, lon: -43.2 },
          { lat: -22.981, lon: -43.2 },
        ],
        tags: { highway: "primary", oneway: "yes", name: "Avenida 1" },
      },
      {
        type: "way",
        nodes: [102, 103],
        geometry: [
          { lat: -22.981, lon: -43.2 },
          { lat: -22.981, lon: -43.199 },
        ],
        tags: { highway: "primary_link", oneway: "yes", name: "Alça de Acesso" },
      },
      {
        type: "way",
        nodes: [103, 104],
        geometry: [
          { lat: -22.981, lon: -43.199 },
          { lat: -22.982, lon: -43.199 },
        ],
        tags: { highway: "primary", oneway: "yes", name: "Avenida 2" },
      },
    ]);

    const result = aStar(linkedGraph, 101, 104);
    expect(result.path).toEqual([101, 102, 103, 104]);
    expect(result.distance).toBeGreaterThan(0);
    expect(Number.isFinite(result.distance)).toBe(true);
  });
});

describe("turn-aware routing (TASK-BG-013)", () => {
  it("calculates turn angle accurately for straight, right, and reverse directions", () => {
    const p1 = { lat: 0, lng: 0 };
    const p2 = { lat: 0, lng: 0.001 };
    const pStraight = { lat: 0, lng: 0.002 };
    const pRight = { lat: 0.001, lng: 0.001 };
    const pReverse = { lat: 0, lng: 0 };

    expect(turnAngle(p1, p2, pStraight)).toBeCloseTo(0, 1);
    expect(turnAngle(p1, p2, pRight)).toBeCloseTo(90, 1);
    expect(turnAngle(p1, p2, pReverse)).toBeCloseTo(180, 1);
  });

  it("avoids acute-angle U-turn when a legal block detour exists", () => {
    // Boulevard with Northbound (1 -> 2 -> 3) and Southbound (6 -> 5 -> 4)
    // 1 -> 2 goes North.
    // 2 -> 4 is an acute hairpin cut backwards to Southbound lane (angle ~150°).
    // 3 -> 7 -> 6 -> 5 is a proper block detour around the corner (90° turns).
    const graph = buildGraph([
      {
        type: "way",
        nodes: [1, 2, 3],
        geometry: [
          { lat: -22.95, lon: -43.19 },
          { lat: -22.948, lon: -43.19 },
          { lat: -22.946, lon: -43.19 },
        ],
        tags: { highway: "primary", oneway: "yes", name: "Av Norte" },
      },
      {
        type: "way",
        nodes: [2, 4],
        geometry: [
          { lat: -22.948, lon: -43.19 },
          { lat: -22.949, lon: -43.1902 },
        ],
        tags: { highway: "primary_link", oneway: "yes", name: "Corte Ilegal" },
      },
      {
        type: "way",
        nodes: [3, 7, 6],
        geometry: [
          { lat: -22.946, lon: -43.19 },
          { lat: -22.946, lon: -43.1905 },
          { lat: -22.947, lon: -43.1905 },
        ],
        tags: { highway: "secondary", oneway: "yes", name: "Retorno Legal" },
      },
      {
        type: "way",
        nodes: [6, 5, 4],
        geometry: [
          { lat: -22.947, lon: -43.1905 },
          { lat: -22.948, lon: -43.1905 },
          { lat: -22.949, lon: -43.1905 },
        ],
        tags: { highway: "primary", oneway: "yes", name: "Av Sul" },
      },
    ]);

    const result = aStar(graph, 1, 5);
    // Should take the legal block loop [1, 2, 3, 7, 6, 5], avoiding the hairpin cut [1, 2, 4, ...]
    expect(result.path).toEqual([1, 2, 3, 7, 6, 5]);
    expect(result.distance).toBeGreaterThan(0);
  });

  it("avoids cutting through a service road (gas station) when main road is available", () => {
    // Main road 1 -> 2 -> 3 detours around the block (~628m)
    // Shortcut 1 -> 4 -> 3 is a service road straight through (~444m)
    const graph = buildGraph([
      {
        type: "way",
        nodes: [1, 2, 3],
        geometry: [
          { lat: 0, lon: 0 },
          { lat: 0.002, lon: 0.002 },
          { lat: 0.004, lon: 0 },
        ],
        tags: { highway: "secondary", name: "Rua Principal" },
      },
      {
        type: "way",
        nodes: [1, 4, 3],
        geometry: [
          { lat: 0, lon: 0 },
          { lat: 0.002, lon: 0 },
          { lat: 0.004, lon: 0 },
        ],
        tags: { highway: "service", name: "Posto de Combustível" },
      },
    ]);

    const result = aStar(graph, 1, 3);
    // Prefers main road over service shortcut due to service penalty
    expect(result.path).toEqual([1, 2, 3]);
  });

  it("navigates into a service road when the destination is inside it", () => {
    const graph = buildGraph([
      {
        type: "way",
        nodes: [1, 2, 3],
        geometry: [
          { lat: -22.95, lon: -43.19 },
          { lat: -22.951, lon: -43.19 },
          { lat: -22.952, lon: -43.19 },
        ],
        tags: { highway: "secondary", name: "Rua Principal" },
      },
      {
        type: "way",
        nodes: [2, 4],
        geometry: [
          { lat: -22.951, lon: -43.19 },
          { lat: -22.951, lon: -43.1895 },
        ],
        tags: { highway: "service", name: "Acesso Condomínio" },
      },
    ]);

    const result = aStar(graph, 1, 4);
    expect(result.path).toEqual([1, 2, 4]);
    expect(Number.isFinite(result.distance)).toBe(true);
  });

  it("allows U-turn in a cul-de-sac (dead-end street) when no alternative exists", () => {
    // 1 -> 2 is a dead end. To go to 3, must return 2 -> 1 -> 3
    const graph = buildGraph([
      {
        type: "way",
        nodes: [1, 2],
        geometry: [
          { lat: -22.95, lon: -43.19 },
          { lat: -22.951, lon: -43.19 },
        ],
        tags: { highway: "residential", name: "Beco sem saída" },
      },
      {
        type: "way",
        nodes: [1, 3],
        geometry: [
          { lat: -22.95, lon: -43.19 },
          { lat: -22.95, lon: -43.191 },
        ],
        tags: { highway: "residential", name: "Rua Transversal" },
      },
    ]);

    const result = aStar(graph, 2, 3);
    expect(result.path).toEqual([2, 1, 3]);
  });

  it("does not penalize turns inside roundabouts", () => {
    const graph = buildGraph([
      {
        type: "way",
        nodes: [1, 2, 3, 1],
        geometry: [
          { lat: -22.95, lon: -43.19 },
          { lat: -22.949, lon: -43.191 },
          { lat: -22.949, lon: -43.189 },
          { lat: -22.95, lon: -43.19 },
        ],
        tags: { junction: "roundabout", name: "Rotatória" },
      },
      {
        type: "way",
        nodes: [10, 1],
        geometry: [
          { lat: -22.951, lon: -43.19 },
          { lat: -22.95, lon: -43.19 },
        ],
        tags: { highway: "tertiary", name: "Acesso" },
      },
    ]);

    const result = aStar(graph, 10, 3);
    expect(result.path).toEqual([10, 1, 2, 3]);
  });

  it("allows sharp turns and service ways freely on pedestrian graphs", () => {
    const vehicleGraph = buildGraph([
      {
        type: "way",
        nodes: [1, 2, 3],
        geometry: [
          { lat: 0, lon: 0 },
          { lat: 0.002, lon: 0.002 },
          { lat: 0.004, lon: 0 },
        ],
        tags: { highway: "secondary", name: "Rua Principal" },
      },
      {
        type: "way",
        nodes: [1, 4, 3],
        geometry: [
          { lat: 0, lon: 0 },
          { lat: 0.002, lon: 0 },
          { lat: 0.004, lon: 0 },
        ],
        tags: { highway: "service", name: "Posto" },
      },
    ]);
    const pedestrian = { ...vehicleGraph, isPedestrian: true };

    const result = aStar(pedestrian, 1, 3);
    // Pedestrian takes the shortest physical shortcut through the service area
    expect(result.path).toEqual([1, 4, 3]);
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
