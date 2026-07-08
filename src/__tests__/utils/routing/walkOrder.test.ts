import { describe, it, expect } from "vitest";
import { bearingDeg, sweepWalkingOrder } from "../../../utils/routing/walkOrder";
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
