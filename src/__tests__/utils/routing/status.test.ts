import { describe, it, expect } from "vitest";
import { plannedRouteStatus, getRoteiroPresentation, getRoteiroPresentationFromSummary } from "../../../utils/routing/status";
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

describe("getRoteiroPresentation & getRoteiroPresentationFromSummary", () => {
  it("sem status (null/undefined) → kind 'none'", () => {
    const pNull = getRoteiroPresentation(null);
    expect(pNull.kind).toBe("none");
    expect(pNull.badgeLabel).toBe("Sem roteiro");
    expect(pNull.badgeVariant).toBe("outline");
    expect(pNull.hasSummary).toBe(false);

    const pUndefined = getRoteiroPresentation(undefined);
    expect(pUndefined.kind).toBe("none");
  });

  it("status building → kind 'building', badge com porcentagem", () => {
    const p = getRoteiroPresentation({
      kind: "building",
      assignedAddresses: 9,
      totalAddresses: 20,
      ratio: 0.45,
      deliveredPercent: 0,
    });
    expect(p.kind).toBe("building");
    expect(p.badgeLabel).toBe("Em construção (45%)");
    expect(p.badgeVariant).toBe("secondary");
    expect(p.colorClass).toBe("text-amber-500");
    expect(p.buildPercent).toBe(45);
    expect(p.coverageText).toBe("9 de 20 endereços");
  });

  it("status executing → kind 'executing', badge 'Em execução'", () => {
    const p = getRoteiroPresentation({
      kind: "executing",
      assignedAddresses: 20,
      totalAddresses: 20,
      ratio: 1,
      deliveredPercent: 0,
    });
    expect(p.kind).toBe("executing");
    expect(p.badgeLabel).toBe("Em execução");
    expect(p.badgeVariant).toBe("default");
    expect(p.colorClass).toBe("text-primary");
    expect(p.hasSummary).toBe(true);
  });

  it("status finished → kind 'finished', badge 'Finalizado'", () => {
    const p = getRoteiroPresentation({
      kind: "finished",
      assignedAddresses: 20,
      totalAddresses: 20,
      ratio: 1,
      deliveredPercent: 100,
    });
    expect(p.kind).toBe("finished");
    expect(p.badgeLabel).toBe("Finalizado");
    expect(p.badgeVariant).toBe("default");
    expect(p.colorClass).toBe("text-emerald-500");
    expect(p.hasSummary).toBe(true);
  });

  it("getRoteiroPresentationFromSummary sem roteiro → kind 'none'", () => {
    const p = getRoteiroPresentationFromSummary(false);
    expect(p.kind).toBe("none");
    expect(p.badgeLabel).toBe("Sem roteiro");
  });

  it("getRoteiroPresentationFromSummary com roteiro mas sem summary → kind 'building' (Roteiro salvo)", () => {
    const p = getRoteiroPresentationFromSummary(true, null);
    expect(p.kind).toBe("building");
    expect(p.badgeLabel).toBe("Roteiro salvo");
    expect(p.hasSummary).toBe(false);
  });

  it("getRoteiroPresentationFromSummary com summary parcial → kind 'building' com percentual", () => {
    const p = getRoteiroPresentationFromSummary(true, {
      stops: 4,
      vehicleMeters: 12500,
      walkMeters: 1200,
      totalMinutes: 45,
      progressRatio: 0.6,
      computedAt: "2026-09-19T10:00:00Z",
    });
    expect(p.kind).toBe("building");
    expect(p.badgeLabel).toBe("Em construção (60%)");
    expect(p.hasSummary).toBe(true);
  });

  it("getRoteiroPresentationFromSummary com summary 100% → kind 'executing'", () => {
    const p = getRoteiroPresentationFromSummary(true, {
      stops: 8,
      vehicleMeters: 25000,
      walkMeters: 3500,
      totalMinutes: 120,
      progressRatio: 1,
      computedAt: "2026-09-19T10:00:00Z",
    });
    expect(p.kind).toBe("executing");
    expect(p.badgeLabel).toBe("Em execução");
    expect(p.hasSummary).toBe(true);
  });
});
