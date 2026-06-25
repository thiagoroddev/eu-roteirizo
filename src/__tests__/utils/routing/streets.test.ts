import { describe, it, expect } from "vitest";
import { streetsAlong } from "../../../utils/routing/streets";
import { buildGraph } from "../../../utils/routing/graph";
import { squareGraph, A, B, C, D } from "./__fixtures__/syntheticGraph";

describe("streetsAlong", () => {
  it("lists the street names in path order", () => {
    expect(streetsAlong(squareGraph, [B, D, C, A])).toEqual(["Rua BD", "Rua CD", "Rua AC"]);
  });

  it("collapses consecutive repeats of the same street", () => {
    const longGraph = buildGraph([
      {
        type: "way",
        nodes: [10, 11, 12],
        geometry: [
          { lat: -22.98, lon: -43.2 },
          { lat: -22.98, lon: -43.199 },
          { lat: -22.98, lon: -43.198 },
        ],
        tags: { name: "Rua Longa" },
      },
    ]);
    expect(streetsAlong(longGraph, [10, 11, 12])).toEqual(["Rua Longa"]);
  });

  it("falls back to 'via' when a pair has no connecting edge", () => {
    expect(streetsAlong(squareGraph, [A, D])).toEqual(["via"]); // no direct A→D edge
  });

  it("returns [] for a path with fewer than two nodes", () => {
    expect(streetsAlong(squareGraph, [])).toEqual([]);
    expect(streetsAlong(squareGraph, [A])).toEqual([]);
  });
});
