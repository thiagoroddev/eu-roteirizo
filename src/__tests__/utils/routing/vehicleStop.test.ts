import { describe, it, expect } from "vitest";
import { suggestVehicleStop, defaultAnchorSeed } from "../../../utils/routing/vehicleStop";
import type { RoadGraph } from "../../../utils/routing/graph";
import type { DeliveryPoint } from "../../../types/routing";
import { squareGraph } from "./__fixtures__/syntheticGraph";

const pt = (id: string, lat: number, lng: number): DeliveryPoint => ({ id, lat, lng, address: id, packageCount: 1, packages: [] });

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

describe("defaultAnchorSeed (TASK-RF-006.6)", () => {
  /** north ~110 m acima de south; a origem decide qual deles é a semente. */
  const north = pt("north", -22.979, -43.2);
  const south = pt("south", -22.98, -43.2);
  const points = [north, south];

  it("escolhe o endereço mais próximo de ONDE O VEÍCULO VEM", () => {
    // Origem ao norte → a semente é o endereço do norte…
    expect(defaultAnchorSeed(points, { lat: -22.975, lng: -43.2 })?.id).toBe("north");
    // …e vindo do sul, é o do sul (a ordem do array não manda).
    expect(defaultAnchorSeed(points, { lat: -22.99, lng: -43.2 })?.id).toBe("south");
  });

  it("sem origem (rota sem início e sem parada anterior) cai no primeiro ponto", () => {
    expect(defaultAnchorSeed(points, null)?.id).toBe("north");
  });

  it("sem pontos não há semente", () => {
    expect(defaultAnchorSeed([], { lat: -22.98, lng: -43.2 })).toBeNull();
  });
});
