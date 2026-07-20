import { describe, it, expect } from "vitest";
import { plannedRouteStatus } from "../../../utils/routing/status";
import { DEFAULT_ROUTING_CONFIG, type DeliveryPoint, type PlannedRoute } from "../../../types/routing";

const pt = (id: string): DeliveryPoint => ({ id, lat: -22.98, lng: -43.2, address: id, packageCount: 1, packages: [] });

const route = (pointIds: string[]): PlannedRoute => ({
  id: "r",
  startPoint: { lat: -22.98, lng: -43.2 },
  stops: pointIds.length > 0 ? [{ id: "s1", order: 1, vehicleStop: { lat: -22.98, lng: -43.2 }, pointIds, radiusMeters: 30 }] : [],
  config: DEFAULT_ROUTING_CONFIG,
  createdAt: "2026-07-19T10:00:00.000Z",
});

describe("plannedRouteStatus (REF-017)", () => {
  const points = [pt("a"), pt("b"), pt("c")];
  const all = ["a", "b", "c"];

  it("nem todos os endereços atribuídos → em construção, com a cobertura", () => {
    const status = plannedRouteStatus(route(["a"]), points);
    expect(status.kind).toBe("building");
    expect(status.assignedAddresses).toBe(1);
    expect(status.totalAddresses).toBe(3);
    expect(status.ratio).toBeCloseTo(1 / 3);
  });

  it("construção fechada, sem dados de execução → em execução a 0% (RF-009 alimenta)", () => {
    const status = plannedRouteStatus(route(all), points);
    expect(status.kind).toBe("executing");
    expect(status.ratio).toBe(1);
    expect(status.deliveredPercent).toBe(0);
  });

  it("com entregas parciais → em execução com o percentual", () => {
    const status = plannedRouteStatus(route(all), points, 0.42);
    expect(status.kind).toBe("executing");
    expect(status.deliveredPercent).toBe(42);
  });

  it("todas as entregas concluídas → finalizado", () => {
    const status = plannedRouteStatus(route(all), points, 1);
    expect(status.kind).toBe("finished");
    expect(status.deliveredPercent).toBe(100);
  });

  it("roteiro vazio → em construção com 0 de N", () => {
    const status = plannedRouteStatus(route([]), points);
    expect(status.kind).toBe("building");
    expect(status.assignedAddresses).toBe(0);
  });

  it("ids que a planilha não tem mais não contam (espelha o HYDRATE defensivo)", () => {
    const status = plannedRouteStatus(route(["a", "fantasma"]), points);
    expect(status.assignedAddresses).toBe(1);
    expect(status.kind).toBe("building");
  });
});
