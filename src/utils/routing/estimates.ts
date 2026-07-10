/**
 * utils/routing/estimates.ts - Simple walking estimate of a stop (TASK-RF-006.4.1).
 *
 * The draft panel shows "~12 min · 850 m a pé" for the stop being built: the
 * walking CIRCUIT (vehicle stop → points in visit order → back to the vehicle,
 * fluxo §6) measured by haversine legs, plus the fixed handover time per
 * package. This is the coarse estimate — the street-graph version (per-leg,
 * vehicle legs, totals) is RF-007. Pure: no Leaflet/DOM/React.
 */

import type { DeliveryPoint, LatLng, PlannedRoute, RoutingConfig } from "../../types/routing";
import { haversine } from "./geo";

export interface StopWalkEstimate {
  /** Circuit length in meters (0 with no points). */
  meters: number;
  /** Walking time + handover per package, in minutes (rounded up). */
  minutes: number;
}

/**
 * Estimates the walking circuit of a stop draft.
 *
 * @param vehicleStop - The anchor the circuit leaves from and returns to.
 * @param orderedPoints - The chosen points, in walking-visit order.
 * @param config - Speeds/times (walkingSpeedKmh, walkingMinutesPerDelivery).
 * @returns Circuit meters + total minutes.
 */
export const stopWalkEstimate = (vehicleStop: LatLng, orderedPoints: DeliveryPoint[], config: RoutingConfig): StopWalkEstimate => {
  if (orderedPoints.length === 0) return { meters: 0, minutes: 0 };

  let meters = 0;
  let cursor: LatLng = vehicleStop;
  for (const point of orderedPoints) {
    meters += haversine(cursor, point);
    cursor = point;
  }
  meters += haversine(cursor, vehicleStop);

  const packages = orderedPoints.reduce((sum, point) => sum + point.packageCount, 0);
  const walkMinutes = (meters / 1000 / config.walkingSpeedKmh) * 60;
  const minutes = Math.ceil(walkMinutes + packages * config.walkingMinutesPerDelivery);
  return { meters, minutes };
};

/** Totals of a saved roteiro, for the Sumário's "Info Meu Roteiro" (RF-008). */
export interface PlannedRouteTotals {
  vehicleStops: number;
  walkPoints: number;
  distanceVehicleKm: number;
  distanceWalkKm: number;
  distanceTotalKm: number;
  timeVehicleMin: number;
  timeWalkMin: number;
  timeTotalMin: number;
}

/**
 * Coarse totals of a persisted PlannedRoute (RF-008): vehicle legs are
 * straight-line (start → anchor → anchor…, haversine) at `vehicleSpeedKmh`;
 * walking is the per-stop circuit of `stopWalkEstimate`. The street-graph
 * vehicle path (RF-006.7) and the configurable estimates (RF-007) refine this
 * later without changing the shape. Pure — points the spreadsheet no longer
 * has are simply skipped (mirrors the reducer's defensive HYDRATE).
 */
export const plannedRouteTotals = (route: PlannedRoute, points: DeliveryPoint[]): PlannedRouteTotals => {
  const byId = new Map(points.map((p) => [p.id, p]));

  let walkMeters = 0;
  let walkMinutes = 0;
  let walkPoints = 0;
  for (const stop of route.stops) {
    const stopPoints = stop.pointIds.map((id) => byId.get(id)).filter((p): p is DeliveryPoint => p !== undefined);
    walkPoints += stopPoints.length;
    const estimate = stopWalkEstimate(stop.vehicleStop, stopPoints, route.config);
    walkMeters += estimate.meters;
    walkMinutes += estimate.minutes;
  }

  let vehicleMeters = 0;
  let cursor: LatLng | null = route.startPoint;
  for (const stop of route.stops) {
    if (cursor) vehicleMeters += haversine(cursor, stop.vehicleStop);
    cursor = stop.vehicleStop;
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
    timeTotalMin: timeVehicleMin + walkMinutes,
  };
};
