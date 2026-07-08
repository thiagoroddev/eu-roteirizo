import { describe, it, expect } from "vitest";
import { suggestVehicleStop } from "../../../utils/routing/vehicleStop";
import type { RoadGraph } from "../../../utils/routing/graph";
import { squareGraph } from "./__fixtures__/syntheticGraph";

describe("suggestVehicleStop", () => {
  it("projects the address onto the nearest street when a graph is available", () => {
    /** Mid-block point slightly south of Rua CD-like edge A→C (lat -22.98). */
    const address = { lat: -22.98018, lng: -43.19955 };
    const suggested = suggestVehicleStop(squareGraph, address);
    expect(suggested.lat).toBeCloseTo(-22.98, 5);
    expect(suggested.lng).toBeCloseTo(-43.19955, 5);
  });

  it("falls back to the address coordinate without a graph (loading/offline)", () => {
    const address = { lat: -22.98018, lng: -43.19955 };
    const suggested = suggestVehicleStop(null, address);
    expect(suggested).toEqual(address);
    expect(suggested).not.toBe(address); // fresh object, caller may mutate freely
  });

  it("falls back for an empty graph (no edges to project onto)", () => {
    const empty: RoadGraph = { coords: new Map(), adj: new Map() };
    const address = { lat: -22.98, lng: -43.2 };
    expect(suggestVehicleStop(empty, address)).toEqual(address);
  });
});
