import { describe, it, expect } from "vitest";
import { stopWalkEstimate, plannedRouteTotals } from "../../../utils/routing/estimates";
import { haversine } from "../../../utils/routing/geo";
import { pedestrianGraph } from "../../../utils/routing/pedestrian";
import { footCircuitPath } from "../../../utils/routing/routePath";
import { squareGraph, COORDS, A, B, C, D } from "./__fixtures__/syntheticGraph";
import { DEFAULT_ROUTING_CONFIG } from "../../../types/routing";
import type { DeliveryPoint, LatLng, PlannedRoute } from "../../../types/routing";

const pt = (id: string, lat: number, lng: number, packageCount = 1): DeliveryPoint => ({ id, lat, lng, address: id, packageCount, packages: [] });

const anchor: LatLng = { lat: -22.98, lng: -43.2 };
/** A point a hair off a fixture node, so matching lands it on the street. */
const nearNode = (n: number): LatLng => ({ lat: COORDS[n as keyof typeof COORDS].lat + 0.00002, lng: COORDS[n as keyof typeof COORDS].lng + 0.00002 });

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

  it("com o grafo pedestre, mede o circuito pelas RUAS — mais longo que o haversine (RF-006.7)", () => {
    const walk = pedestrianGraph(squareGraph);
    const anchorA = nearNode(A);
    const p = pt("p", COORDS[D].lat, COORDS[D].lng); // canto diagonalmente oposto → rua faz L, reta é a diagonal
    const graphEstimate = stopWalkEstimate(anchorA, [p], DEFAULT_ROUTING_CONFIG, walk);
    const coarseEstimate = stopWalkEstimate(anchorA, [p], DEFAULT_ROUTING_CONFIG);
    expect(graphEstimate.meters).toBeCloseTo(footCircuitPath(walk, anchorA, [p]).distanceMeters, 6); // usa o circuito de rua
    expect(graphEstimate.meters).toBeGreaterThan(coarseEstimate.meters); // L da rua > diagonal reta
  });
});

describe("plannedRouteTotals (RF-008 — o 'Info Meu Roteiro' do Sumário)", () => {
  const a = pt("a", -22.9795, -43.2);
  const b = pt("b", -22.9795, -43.199);
  const anchor2: LatLng = { lat: -22.978, lng: -43.198 };
  const saved: PlannedRoute = {
    id: "route_x",
    startPoint: { lat: -22.981, lng: -43.201 },
    stops: [
      { id: "s1", order: 1, vehicleStop: anchor, pointIds: ["a"], radiusMeters: 30 },
      { id: "s2", order: 2, vehicleStop: anchor2, pointIds: ["b"], radiusMeters: 30 },
    ],
    config: DEFAULT_ROUTING_CONFIG,
    createdAt: "2026-07-10T10:00:00.000Z",
  };

  it("soma as pernas de veículo (início → âncoras, reta) e os circuitos a pé", () => {
    const totals = plannedRouteTotals(saved, [a, b]);
    expect(totals.vehicleStops).toBe(2);
    expect(totals.walkPoints).toBe(2);

    const vehicleMeters = haversine(saved.startPoint!, anchor) + haversine(anchor, anchor2);
    expect(totals.distanceVehicleKm).toBeCloseTo(vehicleMeters / 1000, 6);
    const walkMeters = stopWalkEstimate(anchor, [a], DEFAULT_ROUTING_CONFIG).meters + stopWalkEstimate(anchor2, [b], DEFAULT_ROUTING_CONFIG).meters;
    expect(totals.distanceWalkKm).toBeCloseTo(walkMeters / 1000, 6);
    expect(totals.distanceTotalKm).toBeCloseTo((vehicleMeters + walkMeters) / 1000, 6);
    expect(totals.timeTotalMin).toBeCloseTo(totals.timeVehicleMin + totals.timeWalkMin, 6);
  });

  it("sem início, a 1ª perna de veículo não existe (só âncora → âncora)", () => {
    const totals = plannedRouteTotals({ ...saved, startPoint: null }, [a, b]);
    expect(totals.distanceVehicleKm).toBeCloseTo(haversine(anchor, anchor2) / 1000, 6);
  });

  it("pontos que a planilha atual não tem são pulados (espelha o HYDRATE defensivo)", () => {
    const totals = plannedRouteTotals(saved, [a]); // "b" sumiu da planilha
    expect(totals.walkPoints).toBe(1);
    expect(totals.vehicleStops).toBe(2); // a parada continua contada; só o ponto órfão sai
  });

  // RF-006.7: com os grafos, os totais viram distância REAL pelas ruas (o Sumário
  // segue chamando sem o 3º arg — os testes acima são a prova de que não muda).
  it("com os grafos, a perna de veículo respeita mão única (detour) — difere do haversine (RF-006.7)", () => {
    const walk = pedestrianGraph(squareGraph);
    const p = pt("pc", COORDS[C].lat, COORDS[C].lng);
    // Início em B, âncora em A: B→A é proibido (mão única A→B) → o veículo desvia B→D→C→A.
    const route: PlannedRoute = {
      id: "r",
      startPoint: nearNode(B),
      stops: [{ id: "s", order: 1, vehicleStop: nearNode(A), pointIds: ["pc"], radiusMeters: 30 }],
      config: DEFAULT_ROUTING_CONFIG,
      createdAt: "2026-07-17T00:00:00.000Z",
    };
    const graphTotals = plannedRouteTotals(route, [p], { graph: squareGraph, pedGraph: walk });
    const coarseTotals = plannedRouteTotals(route, [p]);
    expect(graphTotals.distanceVehicleKm).toBeGreaterThan(coarseTotals.distanceVehicleKm); // desvio da mão única
  });

  it("usa o vehicleMetersOverride em vez de recomputar a perna de veículo (RF-006.7)", () => {
    const totals = plannedRouteTotals(saved, [a, b], { vehicleMetersOverride: 1234 });
    expect(totals.distanceVehicleKm).toBeCloseTo(1234 / 1000, 6);
    // o tempo de veículo deriva do override; o total soma o a pé
    expect(totals.timeVehicleMin).toBeCloseTo((1234 / 1000 / DEFAULT_ROUTING_CONFIG.vehicleSpeedKmh) * 60, 6);
  });
});
