import { describe, it, expect } from "vitest";
import {
  indexPointsById,
  totalPoints,
  totalPackages,
  assignedPointIds,
  unassignedPoints,
  addressCountInStop,
  packagesInStop,
  stopCentroid,
  pointsWithinRadius,
  nearestStopTo,
} from "../../../utils/routing/selectors";
import type { DeliveryPoint, RouteStop } from "../../../types/routing";

const pt = (id: string, lat: number, lng: number, packageCount: number): DeliveryPoint => ({
  id,
  lat,
  lng,
  address: id,
  packageCount,
  packages: [],
});

const points: DeliveryPoint[] = [pt("a", -22.95, -43.19, 2), pt("b", -22.96, -43.2, 1), pt("c", -22.97, -43.21, 3)];

const stop: RouteStop = { id: "s1", order: 1, vehicleStop: { lat: -22.9501, lng: -43.1901 }, pointIds: ["a", "b"], radiusMeters: 30 };

describe("routing selectors", () => {
  it("counts points and packages", () => {
    expect(totalPoints(points)).toBe(3);
    expect(totalPackages(points)).toBe(6);
  });

  it("computes assigned and unassigned points", () => {
    expect([...assignedPointIds([stop])]).toEqual(["a", "b"]);
    expect(unassignedPoints(points, [stop]).map((p) => p.id)).toEqual(["c"]);
  });

  it("counts addresses and packages within a stop", () => {
    const byId = indexPointsById(points);
    expect(addressCountInStop(stop)).toBe(2);
    expect(packagesInStop(stop, byId)).toBe(3); // a(2) + b(1)
  });

  it("filters points within a radius (haversine, meters)", () => {
    const center = { lat: -22.98, lng: -43.2 };
    const near = pt("near", -22.97985, -43.2, 1); // ~17 m north
    const far = pt("far", -22.9795, -43.2, 1); // ~56 m north
    expect(pointsWithinRadius(center, [near, far], 30).map((p) => p.id)).toEqual(["near"]);
    expect(pointsWithinRadius(center, [near, far], 60).map((p) => p.id)).toEqual(["near", "far"]);
    expect(pointsWithinRadius(center, [near, far], 0)).toEqual([]);
  });

  it("finds the stop whose ANCHOR is nearest to a point (incorporation default)", () => {
    const near: RouteStop = { id: "near", order: 1, vehicleStop: { lat: -22.95, lng: -43.19 }, pointIds: ["a"], radiusMeters: 30 };
    const far: RouteStop = { id: "far", order: 2, vehicleStop: { lat: -22.99, lng: -43.25 }, pointIds: ["b"], radiusMeters: 30 };
    expect(nearestStopTo({ lat: -22.951, lng: -43.191 }, [far, near])?.id).toBe("near");
    expect(nearestStopTo({ lat: -22.951, lng: -43.191 }, [])).toBeNull();
  });

  it("computes the centroid of a stop's points", () => {
    const byId = indexPointsById(points);
    const c = stopCentroid(stop, byId);
    expect(c).not.toBeNull();
    expect(c!.lat).toBeCloseTo(-22.955);
    expect(c!.lng).toBeCloseTo(-43.195);
  });
});
