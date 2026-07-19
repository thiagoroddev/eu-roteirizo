/**
 * Tests for routeStorage (TASK-RF-008) — persistence of planned routes.
 * Runs over fake-indexeddb; RN-21 ("one roteiro per rota") is the store's own
 * compound key, so the overwrite test IS the rule's test.
 */
import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";

import { saveRoteiro, getRoteiro, deleteRoteiro, listRoteiroKeys, deleteManifestRoteiros, clearRoteiros } from "../../services/routeStorage";
import { DEFAULT_ROUTING_CONFIG, type PlannedRoute } from "../../types/routing";

const route = (overrides: Partial<PlannedRoute> = {}): PlannedRoute => ({
  id: "route_a",
  startPoint: { lat: -22.95, lng: -43.19 },
  stops: [{ id: "stop_1", order: 1, vehicleStop: { lat: -22.951, lng: -43.191 }, pointIds: ["p1", "p2"], radiusMeters: 30 }],
  config: DEFAULT_ROUTING_CONFIG,
  createdAt: "2026-07-10T10:00:00.000Z",
  ...overrides,
});

beforeEach(async () => {
  await clearRoteiros();
});

describe("routeStorage (RF-008)", () => {
  it("round-trips a PlannedRoute by manifest+rota", async () => {
    const result = await saveRoteiro("m1", "A-1", route());
    expect(result.status).toBe("saved");

    const loaded = await getRoteiro("m1", "A-1");
    expect(loaded).toEqual(route());
  });

  it("RF-007.1: config antigo (sem os campos de entrega) é hidratado com defaults ao ler", async () => {
    // Um registro salvo antes da RF-007.1: tinha walkingMinutesPerDelivery e NÃO os campos de entrega.
    const oldConfig = { walkingSpeedKmh: 4, walkingMinutesPerDelivery: 2, vehicleSpeedKmh: 30, autoRadiusMeters: 50 } as unknown as PlannedRoute["config"];
    await saveRoteiro("m1", "A-1", route({ config: oldConfig }));

    const loaded = await getRoteiro("m1", "A-1");
    // campos novos preenchidos com defaults
    expect(loaded?.config.deliveryBaseSeconds).toBe(DEFAULT_ROUTING_CONFIG.deliveryBaseSeconds);
    expect(loaded?.config.deliveryPerPackageSeconds).toBe(DEFAULT_ROUTING_CONFIG.deliveryPerPackageSeconds);
    // campos existentes preservados
    expect(loaded?.config.walkingSpeedKmh).toBe(4);
    expect(loaded?.config.vehicleSpeedKmh).toBe(30);
    expect(loaded?.config.autoRadiusMeters).toBe(50);
  });

  it("misses degrade to null (unknown route / other manifest)", async () => {
    await saveRoteiro("m1", "A-1", route());
    expect(await getRoteiro("m1", "B-2")).toBeNull();
    expect(await getRoteiro("m2", "A-1")).toBeNull();
  });

  it("RN-21: saving the same rota again OVERWRITES — never a second record", async () => {
    await saveRoteiro("m1", "A-1", route());
    await saveRoteiro("m1", "A-1", route({ startPoint: null, stops: [] }));

    const loaded = await getRoteiro("m1", "A-1");
    expect(loaded?.startPoint).toBeNull();
    expect(loaded?.stops).toHaveLength(0);

    const keys = await listRoteiroKeys();
    expect(keys.get("m1")?.size).toBe(1);
  });

  it("listRoteiroKeys groups route names per manifest (the chips' one call)", async () => {
    await saveRoteiro("m1", "A-1", route());
    await saveRoteiro("m1", "B-2", route({ id: "route_b" }));
    await saveRoteiro("m2", "Minha rota", route({ id: "route_c" }));

    const keys = await listRoteiroKeys();
    expect(keys.get("m1")).toEqual(new Set(["A-1", "B-2"]));
    expect(keys.get("m2")).toEqual(new Set(["Minha rota"]));
  });

  it("deleteRoteiro removes ONE route; the manifest's siblings survive", async () => {
    await saveRoteiro("m1", "A-1", route());
    await saveRoteiro("m1", "B-2", route({ id: "route_b" }));

    await deleteRoteiro("m1", "A-1");
    expect(await getRoteiro("m1", "A-1")).toBeNull();
    expect(await getRoteiro("m1", "B-2")).not.toBeNull();
  });

  it("deleteManifestRoteiros cascades over the manifest WITHOUT touching neighbours", async () => {
    await saveRoteiro("m1", "A-1", route());
    await saveRoteiro("m1", "B-2", route({ id: "route_b" }));
    await saveRoteiro("m2", "A-1", route({ id: "route_c" }));

    await deleteManifestRoteiros("m1");
    expect(await getRoteiro("m1", "A-1")).toBeNull();
    expect(await getRoteiro("m1", "B-2")).toBeNull();
    expect(await getRoteiro("m2", "A-1")).not.toBeNull();
  });
});
