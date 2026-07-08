import { describe, it, expect } from "vitest";
import { pedestrianGraph } from "../../../utils/routing/pedestrian";
import { aStar } from "../../../utils/routing/aStar";
import { squareGraph, A, B, W_VERTICAL, DETOUR_B_TO_A } from "./__fixtures__/syntheticGraph";

describe("pedestrianGraph (RN-18: walking ignores one-way)", () => {
  it("adds the missing reverse edge of a one-way street, keeping the weight", () => {
    const walk = pedestrianGraph(squareGraph);
    const back = walk.adj.get(B) ?? [];
    const reverse = back.find((e) => e.to === A);
    expect(reverse).toBeDefined();
    expect(reverse!.weight).toBeCloseTo(W_VERTICAL, 3);
    expect(reverse!.wayName).toBe("Rua AB");
  });

  it("does not duplicate edges of two-way streets", () => {
    const walk = pedestrianGraph(squareGraph);
    for (const [from, edges] of walk.adj) {
      const targets = edges.map((e) => e.to);
      expect(new Set(targets).size, `duplicated edge out of node ${String(from)}`).toBe(targets.length);
    }
  });

  it("makes the one-way detour unnecessary on foot (B→A direct, not via D/C)", () => {
    // Vehicle graph: B→A forbidden, forced detour of ~316 m.
    expect(aStar(squareGraph, B, A).distance).toBeCloseTo(DETOUR_B_TO_A, 3);
    // Walking graph: straight back along the one-way street.
    expect(aStar(pedestrianGraph(squareGraph), B, A).distance).toBeCloseTo(W_VERTICAL, 3);
  });

  it("never mutates the original graph", () => {
    const before = JSON.parse(JSON.stringify([...squareGraph.adj.entries()])) as unknown;
    pedestrianGraph(squareGraph);
    expect(JSON.parse(JSON.stringify([...squareGraph.adj.entries()]))).toEqual(before);
  });
});
