/**
 * utils/routing/estimates.ts - Walking/route estimates (TASK-RF-006.4.1/.7).
 *
 * The draft panel shows "~12 min · 850 m a pé" for the stop being built: the
 * walking CIRCUIT (vehicle stop → points in visit order → back to the vehicle,
 * fluxo §6). By default the legs are haversine (coarse, cheap); pass the graphs
 * (RF-006.7) and the distances become the real street path (foot circuit over
 * the pedestrian graph, vehicle legs over the directed graph). Pure: no
 * Leaflet/DOM/React.
 */

import type { DeliveryPoint, LatLng, PlannedRoute, RoutingConfig } from "../../types/routing";
import type { RoadGraph } from "./graph";
import { haversine } from "./geo";
import { vehicleRoutePath, footCircuitPath } from "./routePath";

export interface StopWalkEstimate {
  /** Circuit length in meters (0 with no points). */
  meters: number;
  /** Walking time only (no handover), in minutes. RF-007.1. */
  walkMinutes: number;
  /** Delivery/handover time for the stop's addresses, in minutes. RF-007.1. */
  deliveryMinutes: number;
  /** walkMinutes + deliveryMinutes, rounded up — the stop's total on-foot time. */
  minutes: number;
}

/**
 * Estimates the walking circuit of a stop.
 *
 * @param vehicleStop - The anchor the circuit leaves from and returns to.
 * @param orderedPoints - The chosen points, in walking-visit order.
 * @param config - Speeds/times (walkingSpeedKmh, deliveryBaseSeconds, deliveryPerPackageSeconds).
 * @param pedGraph - The pedestrian graph (RF-006.7): when given, the circuit
 *   length is the real street path; else haversine legs (coarse). Default null.
 * @returns Circuit meters + total minutes.
 */
export const stopWalkEstimate = (vehicleStop: LatLng, orderedPoints: DeliveryPoint[], config: RoutingConfig, pedGraph: RoadGraph | null = null): StopWalkEstimate => {
  if (orderedPoints.length === 0) return { meters: 0, walkMinutes: 0, deliveryMinutes: 0, minutes: 0 };

  let meters: number;
  if (pedGraph) {
    meters = footCircuitPath(pedGraph, vehicleStop, orderedPoints).distanceMeters;
  } else {
    meters = 0;
    let cursor: LatLng = vehicleStop;
    for (const point of orderedPoints) {
      meters += haversine(cursor, point);
      cursor = point;
    }
    meters += haversine(cursor, vehicleStop);
  }

  // Delivery time is PER ADDRESS: base for the first package + extra for each
  // additional one (base + (N−1)×extra), summed over the stop's points. RF-007.1.
  const deliverySeconds = orderedPoints.reduce((sum, point) => sum + config.deliveryBaseSeconds + Math.max(0, point.packageCount - 1) * config.deliveryPerPackageSeconds, 0);
  const walkMinutes = (meters / 1000 / config.walkingSpeedKmh) * 60;
  const deliveryMinutes = deliverySeconds / 60;
  const minutes = Math.ceil(walkMinutes + deliveryMinutes);
  return { meters, walkMinutes, deliveryMinutes, minutes };
};

/** Totals of a saved roteiro, for the Sumário's "Info Meu Roteiro" (RF-008). */
export interface PlannedRouteTotals {
  vehicleStops: number;
  walkPoints: number;
  distanceVehicleKm: number;
  distanceWalkKm: number;
  distanceTotalKm: number;
  timeVehicleMin: number;
  /** Walking time only, no handover (RF-007.1 split it out of the old walk time). */
  timeWalkMin: number;
  /** Delivery/handover time across all stops (RF-007.1). */
  timeDeliveryMin: number;
  /** vehicle + walking + delivery. */
  timeTotalMin: number;
}

/** Graphs (RF-006.7) that turn the coarse haversine totals into real street km. */
export interface PlannedRouteTotalsGraphs {
  /** Directed vehicle graph (respects one-way) — refines the vehicle legs. */
  graph?: RoadGraph | null;
  /** Pedestrian graph (ignores one-way) — refines the walking circuits. */
  pedGraph?: RoadGraph | null;
  /** Pre-computed vehicle street distance (m): reuse it (the map already traced
   *  the route) instead of running the vehicle A* chain a second time. */
  vehicleMetersOverride?: number;
}

/**
 * Totals of a persisted PlannedRoute (RF-008). WITHOUT `graphs`: coarse — vehicle
 * legs straight-line (start → anchor → anchor…, haversine) at `vehicleSpeedKmh`,
 * walking the per-stop haversine circuit. WITH `graphs` (RF-006.7): real street
 * distances (vehicle over the directed graph, walking over the pedestrian graph),
 * same shape. The Sumário (RF-008) calls it without graphs → unchanged. Pure —
 * points the spreadsheet no longer has are skipped (mirrors HYDRATE).
 */
export const plannedRouteTotals = (route: PlannedRoute, points: DeliveryPoint[], graphs?: PlannedRouteTotalsGraphs): PlannedRouteTotals => {
  const byId = new Map(points.map((p) => [p.id, p]));
  const pedGraph = graphs?.pedGraph ?? null;

  let walkMeters = 0;
  let walkMinutes = 0;
  let deliveryMinutes = 0;
  let walkPoints = 0;
  for (const stop of route.stops) {
    const stopPoints = stop.pointIds.map((id) => byId.get(id)).filter((p): p is DeliveryPoint => p !== undefined);
    walkPoints += stopPoints.length;
    const estimate = stopWalkEstimate(stop.vehicleStop, stopPoints, route.config, pedGraph);
    walkMeters += estimate.meters;
    walkMinutes += estimate.walkMinutes;
    deliveryMinutes += estimate.deliveryMinutes;
  }

  let vehicleMeters: number;
  if (graphs?.vehicleMetersOverride !== undefined) {
    vehicleMeters = graphs.vehicleMetersOverride;
  } else if (graphs?.graph) {
    vehicleMeters = vehicleRoutePath(
      graphs.graph,
      route.startPoint,
      route.stops.map((stop) => stop.vehicleStop)
    ).distanceMeters;
  } else {
    vehicleMeters = 0;
    let cursor: LatLng | null = route.startPoint;
    for (const stop of route.stops) {
      if (cursor) vehicleMeters += haversine(cursor, stop.vehicleStop);
      cursor = stop.vehicleStop;
    }
  }
  const timeVehicleMin = (vehicleMeters / 1000 / route.config.vehicleSpeedKmh) * 60;

  return {
    vehicleStops: route.stops.length,
    walkPoints,
    distanceVehicleKm: vehicleMeters / 1000,
    distanceWalkKm: walkMeters / 1000,
    distanceTotalKm: (vehicleMeters + walkMeters) / 1000,
    timeVehicleMin,
    timeWalkMin: walkMinutes,
    timeDeliveryMin: deliveryMinutes,
    timeTotalMin: timeVehicleMin + walkMinutes + deliveryMinutes,
  };
};
