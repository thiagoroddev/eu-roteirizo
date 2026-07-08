import { describe, it, expect } from "vitest";
import { suggestionPath } from "../../../utils/routing/suggestion";
import { pedestrianGraph } from "../../../utils/routing/pedestrian";
import { haversine } from "../../../utils/routing/geo";
import { buildGraph, type RoadGraph } from "../../../utils/routing/graph";
import { squareGraph, osmWay, A, B, COORDS } from "./__fixtures__/syntheticGraph";

/** Two mid-block points slightly south of the A–C street (lat -22.98). */
const FROM = { lat: -22.98005, lng: -43.19995 };
const TO = { lat: -22.98005, lng: -43.19915 };

describe("suggestionPath", () => {
  it("falls back to a straight line without a graph (or an empty one)", () => {
    const straight = suggestionPath(null, FROM, TO);
    expect(straight.viaStreets).toBe(false);
    expect(straight.path).toEqual([FROM, TO]);
    expect(straight.distanceMeters).toBeCloseTo(haversine(FROM, TO), 3);

    const empty: RoadGraph = { coords: new Map(), adj: new Map() };
    expect(suggestionPath(empty, FROM, TO).viaStreets).toBe(false);
  });

  it("routes along the streets with the real points as endpoints", () => {
    const walk = pedestrianGraph(squareGraph);
    const result = suggestionPath(walk, FROM, TO);

    expect(result.viaStreets).toBe(true);
    expect(result.path[0]).toEqual(FROM);
    expect(result.path[result.path.length - 1]).toEqual(TO);
    expect(result.path.length).toBeGreaterThan(2);
    // Street distance + the two approach legs — never less than the projections' gap.
    expect(result.distanceMeters).toBeGreaterThan(0);
    expect(result.distanceMeters).toBeGreaterThanOrEqual(haversine(FROM, TO) * 0.9);
  });

  it("falls back to straight when the target is unreachable (directed dead end)", () => {
    /** A single one-way street A→B: matching FROM near B and TO near A leaves no path. */
    const oneWay = buildGraph([osmWay([A, B], { oneway: "yes", name: "Rua AB" })]);
    const nearB = { lat: COORDS[B].lat + 0.00002, lng: COORDS[B].lng + 0.00002 };
    const nearA = { lat: COORDS[A].lat + 0.00002, lng: COORDS[A].lng + 0.00002 };

    const result = suggestionPath(oneWay, nearB, nearA);
    expect(result.viaStreets).toBe(false);
    expect(result.path).toEqual([nearB, nearA]);
  });
});
