import { describe, it, expect } from "vitest";
import { bearingDeg, sweepWalkingOrder, nearestFirstOrder } from "../../../utils/routing/walkOrder";
import type { DeliveryPoint, LatLng } from "../../../types/routing";

const pt = (id: string, lat: number, lng: number): DeliveryPoint => ({ id, lat, lng, address: id, packageCount: 1, packages: [] });

describe("bearingDeg", () => {
  const origin: LatLng = { lat: 0, lng: 0 };

  it("returns the cardinal bearings (N/E/S/W)", () => {
    expect(bearingDeg(origin, { lat: 1, lng: 0 })).toBeCloseTo(0);
    expect(bearingDeg(origin, { lat: 0, lng: 1 })).toBeCloseTo(90);
    expect(bearingDeg(origin, { lat: -1, lng: 0 })).toBeCloseTo(180);
    expect(bearingDeg(origin, { lat: 0, lng: -1 })).toBeCloseTo(270);
  });

  it("normalizes to [0, 360) and handles coincident points", () => {
    expect(bearingDeg(origin, { lat: 1, lng: -1 })).toBeGreaterThan(270);
    expect(bearingDeg(origin, { lat: 1, lng: -1 })).toBeLessThan(360);
    expect(bearingDeg(origin, origin)).toBe(0);
  });
});

describe("sweepWalkingOrder", () => {
  const anchor: LatLng = { lat: -22.98, lng: -43.2 };
  const north = pt("north", -22.979, -43.2);
  const east = pt("east", -22.98, -43.199);
  const south = pt("south", -22.981, -43.2);
  const west = pt("west", -22.98, -43.201);

  it("sweeps clockwise from north regardless of input order", () => {
    expect(sweepWalkingOrder(anchor, [west, south, east, north])).toEqual(["north", "east", "south", "west"]);
  });

  it("breaks bearing ties by ascending distance", () => {
    const nearNorth = pt("nearNorth", -22.9795, -43.2);
    expect(sweepWalkingOrder(anchor, [north, nearNorth])).toEqual(["nearNorth", "north"]);
  });

  it("is stable for identical positions and handles empty input", () => {
    const twinA = pt("twinA", -22.979, -43.2);
    const twinB = pt("twinB", -22.979, -43.2);
    expect(sweepWalkingOrder(anchor, [twinA, twinB])).toEqual(["twinA", "twinB"]);
    expect(sweepWalkingOrder(anchor, [])).toEqual([]);
  });
});

describe("nearestFirstOrder (RF-006.17)", () => {
  const anchor: LatLng = { lat: -22.98, lng: -43.2 };
  const near = pt("near", -22.98, -43.1999); // east, ~10 m (the nearest)
  const closeN = pt("closeN", -22.9799, -43.1999); // just north of `near` (~11 m from it)
  const far = pt("far", -22.985, -43.1999); // far south (~555 m from `near`)

  it("puts the nearest 1st and sweeps toward its closer neighbour (2nd)", () => {
    // `near` is closest to the anchor → 1st; of its two sweep-neighbours, `closeN`
    // (~11 m) beats `far` (~555 m) → the sense makes it 2nd.
    expect(nearestFirstOrder(anchor, [far, closeN, near], false)).toEqual(["near", "closeN", "far"]);
  });

  it("keeps the nearest 1st but flips the sense when reversed", () => {
    expect(nearestFirstOrder(anchor, [far, closeN, near], true)).toEqual(["near", "far", "closeN"]);
  });

  it("a coincident anchor makes that address the 1st (distance 0)", () => {
    expect(nearestFirstOrder({ lat: near.lat, lng: near.lng }, [far, closeN, near], false)[0]).toBe("near");
  });

  it("is a pass-through for 0 or 1 point", () => {
    expect(nearestFirstOrder(anchor, [], false)).toEqual([]);
    expect(nearestFirstOrder(anchor, [near], false)).toEqual(["near"]);
    expect(nearestFirstOrder(anchor, [near], true)).toEqual(["near"]);
  });
});
