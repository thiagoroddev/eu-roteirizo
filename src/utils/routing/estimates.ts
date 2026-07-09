/**
 * utils/routing/estimates.ts - Simple walking estimate of a stop (TASK-RF-006.4.1).
 *
 * The draft panel shows "~12 min · 850 m a pé" for the stop being built: the
 * walking CIRCUIT (vehicle stop → points in visit order → back to the vehicle,
 * fluxo §6) measured by haversine legs, plus the fixed handover time per
 * package. This is the coarse estimate — the street-graph version (per-leg,
 * vehicle legs, totals) is RF-007. Pure: no Leaflet/DOM/React.
 */

import type { DeliveryPoint, LatLng, RoutingConfig } from "../../types/routing";
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
