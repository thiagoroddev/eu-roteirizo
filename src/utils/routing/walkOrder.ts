/**
 * utils/routing/walkOrder.ts - Default walking order inside a stop (fluxo §6).
 *
 * The courier parks at the vehicle stop and delivers the stop's addresses on a
 * foot circuit that leaves from and returns to it. The default order is a
 * CLOCKWISE SWEEP around the vehicle stop (north first), so the circuit never
 * criss-crosses; ties (same bearing) go nearest-first. The user can still
 * reorder manually (builder.ts), which survives until the anchor moves again.
 *
 * Pure trigonometry — no fetch, Leaflet or DOM.
 */

import type { DeliveryPoint, LatLng } from "../../types/routing";
import { haversine } from "./geo";

const DEG_TO_RAD = Math.PI / 180;
const RAD_TO_DEG = 180 / Math.PI;

/**
 * Initial great-circle bearing from `from` to `to`, in degrees [0, 360):
 * 0 = north, 90 = east (clockwise). Coincident points yield 0.
 *
 * @param from - Origin coordinate (decimal degrees).
 * @param to - Target coordinate (decimal degrees).
 * @returns Bearing in degrees, normalized to [0, 360).
 */
export const bearingDeg = (from: LatLng, to: LatLng): number => {
  const phi1 = from.lat * DEG_TO_RAD;
  const phi2 = to.lat * DEG_TO_RAD;
  const dLng = (to.lng - from.lng) * DEG_TO_RAD;

  const y = Math.sin(dLng) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) - Math.sin(phi1) * Math.cos(phi2) * Math.cos(dLng);
  const deg = Math.atan2(y, x) * RAD_TO_DEG;
  return (deg + 360) % 360;
};

/**
 * Orders the points of a stop by a clockwise sweep around the vehicle stop
 * (fluxo §6): ascending bearing from north, ties broken by ascending distance.
 * The sort is stable, so equal-bearing-equal-distance points keep input order.
 *
 * @param vehicleStop - The stop's anchor (where the vehicle parks).
 * @param points - The stop's delivery points (any order).
 * @returns The point ids in default walking-visit order.
 */
export const sweepWalkingOrder = (vehicleStop: LatLng, points: DeliveryPoint[]): string[] =>
  points
    .map((point) => ({
      id: point.id,
      bearing: bearingDeg(vehicleStop, point),
      distance: haversine(vehicleStop, point),
    }))
    .sort((a, b) => a.bearing - b.bearing || a.distance - b.distance)
    .map((entry) => entry.id);
