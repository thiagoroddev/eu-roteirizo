import { describe, it, expect } from "vitest";
import { stopWalkEstimate } from "../../../utils/routing/estimates";
import { haversine } from "../../../utils/routing/geo";
import { DEFAULT_ROUTING_CONFIG } from "../../../types/routing";
import type { DeliveryPoint, LatLng } from "../../../types/routing";

const pt = (id: string, lat: number, lng: number, packageCount = 1): DeliveryPoint => ({ id, lat, lng, address: id, packageCount, packages: [] });

const anchor: LatLng = { lat: -22.98, lng: -43.2 };

describe("stopWalkEstimate (coarse — TASK-RF-006.4.1; RF-007 refines)", () => {
  it("measures the walking CIRCUIT (anchor → points in order → back)", () => {
    const a = pt("a", -22.9795, -43.2); // ~56 m north
    const b = pt("b", -22.9795, -43.199); // ~102 m east of a
    const { meters } = stopWalkEstimate(anchor, [a, b], DEFAULT_ROUTING_CONFIG);
    const expected = haversine(anchor, a) + haversine(a, b) + haversine(b, anchor);
    expect(meters).toBeCloseTo(expected, 3);
  });

  it("adds the fixed handover time per PACKAGE to the walking time", () => {
    const a = pt("a", -22.9795, -43.2, 3);
    const { meters, minutes } = stopWalkEstimate(anchor, [a], DEFAULT_ROUTING_CONFIG);
    const walkMinutes = (meters / 1000 / DEFAULT_ROUTING_CONFIG.walkingSpeedKmh) * 60;
    expect(minutes).toBe(Math.ceil(walkMinutes + 3 * DEFAULT_ROUTING_CONFIG.walkingMinutesPerDelivery));
  });

  it("returns zeros with no points", () => {
    expect(stopWalkEstimate(anchor, [], DEFAULT_ROUTING_CONFIG)).toEqual({ meters: 0, minutes: 0 });
  });
});
