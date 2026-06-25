import { describe, it, expect } from "vitest";
import { haversine } from "../../../utils/routing/geo";
import type { LatLng } from "../../../types/routing";

const at = (lat: number, lng: number): LatLng => ({ lat, lng });

describe("haversine", () => {
  it("returns ~0 for identical points", () => {
    expect(haversine(at(-22.98, -43.2), at(-22.98, -43.2))).toBeCloseTo(0, 5);
  });

  it("matches one degree of latitude (~111.19 km)", () => {
    expect(haversine(at(0, 0), at(1, 0)) / 1000).toBeCloseTo(111.19, 1);
  });

  it("computes a 0.001° vertical step (~111.19 m)", () => {
    expect(haversine(at(-22.98, -43.2), at(-22.981, -43.2))).toBeCloseTo(111.19, 1);
  });

  it("computes a 0.001° horizontal step near Rio (~102.37 m)", () => {
    expect(haversine(at(-22.98, -43.2), at(-22.98, -43.199))).toBeCloseTo(102.37, 1);
  });

  it("is symmetric (a→b equals b→a)", () => {
    const a = at(-22.98, -43.2);
    const b = at(-22.985, -43.21);
    expect(haversine(a, b)).toBeCloseTo(haversine(b, a), 9);
  });

  it("computes a 0.01° latitude span (~1111.95 m)", () => {
    expect(haversine(at(-22.98, -43.2), at(-22.99, -43.2))).toBeCloseTo(1111.95, 1);
  });
});
