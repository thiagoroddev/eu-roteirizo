import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRouteBuilder } from "../../hooks/useRouteBuilder";
import type { DeliveryPoint } from "../../types/routing";

const pt = (id: string, lat: number, lng: number): DeliveryPoint => ({ id, lat, lng, address: id, packageCount: 1, packages: [] });

const POINTS = [pt("a", -22.98, -43.2), pt("b", -22.979, -43.2)];

describe("useRouteBuilder", () => {
  it("initializes lazily over the given points", () => {
    const { result } = renderHook(() => useRouteBuilder(POINTS));
    expect(result.current.state.points).toBe(POINTS);
    expect(result.current.state.stops).toEqual([]);
    expect(result.current.state.config.autoRadiusMeters).toBe(30);
  });

  it("dispatches through the pure reducer", () => {
    const { result } = renderHook(() => useRouteBuilder(POINTS));
    act(() => result.current.dispatch({ type: "SET_START", position: { lat: -22.98, lng: -43.2 } }));
    expect(result.current.state.startPoint).toEqual({ lat: -22.98, lng: -43.2 });
  });

  it("accepts a custom config", () => {
    const { result } = renderHook(() => useRouteBuilder(POINTS, { walkingSpeedKmh: 4, deliveryBaseSeconds: 40, deliveryPerPackageSeconds: 15, vehicleSpeedKmh: 30, autoRadiusMeters: 50 }));
    expect(result.current.state.config.autoRadiusMeters).toBe(50);
  });
});
