import { describe, it, expect } from "vitest";
import { vehicleRoutePath, vehicleRouteLegs, footCircuitPath } from "../../../utils/routing/routePath";
import { pedestrianGraph } from "../../../utils/routing/pedestrian";
import { haversine } from "../../../utils/routing/geo";
import { squareGraph, COORDS, A, B, C, D } from "./__fixtures__/syntheticGraph";
import type { LatLng } from "../../../types/routing";

/** A point a hair off a node, so matching lands it on the street. */
const near = (p: LatLng): LatLng => ({ lat: p.lat + 0.00002, lng: p.lng + 0.00002 });

const START: LatLng = { lat: -22.979, lng: -43.201 };

describe("vehicleRoutePath", () => {
  it("chains straight legs without a graph, junction de-duplicated", () => {
    const result = vehicleRoutePath(null, START, [COORDS[A], COORDS[C]]);
    // Each anchor appears once; the shared junction (COORDS[A]) is not doubled.
    expect(result.path).toEqual([START, COORDS[A], COORDS[C]]);
    expect(result.distanceMeters).toBeCloseTo(haversine(START, COORDS[A]) + haversine(COORDS[A], COORDS[C]), 3);
  });

  it("joins the start point to the front; omits it when null; single anchor is a no-op line", () => {
    expect(vehicleRoutePath(null, START, [COORDS[A]]).path).toEqual([START, COORDS[A]]);
    expect(vehicleRoutePath(null, null, [COORDS[A], COORDS[C]]).path).toEqual([COORDS[A], COORDS[C]]);

    const single = vehicleRoutePath(null, null, [COORDS[A]]);
    expect(single.path).toEqual([COORDS[A]]);
    expect(single.distanceMeters).toBe(0);
  });

  it("routes along the DIRECTED streets (one-way) with the anchors as exact endpoints", () => {
    // A→B is one-way and allowed; the leg detours nothing, but goes via the street.
    const nearA = near(COORDS[A]);
    const nearB = near(COORDS[B]);
    const result = vehicleRoutePath(squareGraph, null, [nearA, nearB]);

    expect(result.path[0]).toEqual(nearA);
    expect(result.path[result.path.length - 1]).toEqual(nearB);
    expect(result.path.length).toBeGreaterThan(2); // street nodes inserted
    expect(result.distanceMeters).toBeGreaterThan(0);
  });
});

describe("vehicleRouteLegs", () => {
  it("returns one leg per consecutive pair, tagged with the stop it leaves (null = the start)", () => {
    const withStart = vehicleRouteLegs(null, START, [COORDS[A], COORDS[C]]);
    expect(withStart.map((leg) => leg.fromStopIndex)).toEqual([null, 0]);
    expect(withStart.map((leg) => leg.path)).toEqual([
      [START, COORDS[A]],
      [COORDS[A], COORDS[C]],
    ]);

    // Without a start the first leg already leaves stop 0; a lone stop has nowhere to go.
    expect(vehicleRouteLegs(null, null, [COORDS[A], COORDS[C]]).map((leg) => leg.fromStopIndex)).toEqual([0]);
    expect(vehicleRouteLegs(null, null, [COORDS[A]])).toEqual([]);
  });

  it("stitched back together, the legs are exactly vehicleRoutePath (path and distance)", () => {
    const anchors = [near(COORDS[A]), near(COORDS[B]), near(COORDS[D])];
    const legs = vehicleRouteLegs(squareGraph, START, anchors);
    const stitched = legs.flatMap((leg, i) => (i === 0 ? leg.path : leg.path.slice(1)));
    const whole = vehicleRoutePath(squareGraph, START, anchors);

    expect(legs).toHaveLength(3);
    expect(stitched).toEqual(whole.path);
    expect(legs.reduce((sum, leg) => sum + leg.distanceMeters, 0)).toBeCloseTo(whole.distanceMeters, 6);
  });
});

describe("footCircuitPath", () => {
  const ANCHOR: LatLng = { lat: -22.9805, lng: -43.1995 };

  it("is empty with no points", () => {
    expect(footCircuitPath(pedestrianGraph(squareGraph), ANCHOR, [])).toEqual({ path: [], distanceMeters: 0 });
  });

  it("closes the loop back to the vehicle stop, junctions de-duplicated (no graph)", () => {
    const result = footCircuitPath(null, ANCHOR, [COORDS[A], COORDS[C]]);
    expect(result.path).toEqual([ANCHOR, COORDS[A], COORDS[C], ANCHOR]);
    expect(result.path[0]).toEqual(ANCHOR);
    expect(result.path[result.path.length - 1]).toEqual(ANCHOR);
    expect(result.distanceMeters).toBeCloseTo(haversine(ANCHOR, COORDS[A]) + haversine(COORDS[A], COORDS[C]) + haversine(COORDS[C], ANCHOR), 3);
  });

  it("a single point is an out-and-back (no graph)", () => {
    const result = footCircuitPath(null, ANCHOR, [COORDS[A]]);
    expect(result.path).toEqual([ANCHOR, COORDS[A], ANCHOR]);
    expect(result.distanceMeters).toBeCloseTo(2 * haversine(ANCHOR, COORDS[A]), 3);
  });

  it("routes along the PEDESTRIAN streets (ignores one-way) and returns to the anchor", () => {
    const walk = pedestrianGraph(squareGraph);
    const anchor = near(COORDS[A]);
    const result = footCircuitPath(walk, anchor, [COORDS[B], COORDS[D]]);

    expect(result.path[0]).toEqual(anchor);
    expect(result.path[result.path.length - 1]).toEqual(anchor);
    expect(result.path.length).toBeGreaterThan(3); // street nodes inserted
    expect(result.distanceMeters).toBeGreaterThan(0);
  });
});
