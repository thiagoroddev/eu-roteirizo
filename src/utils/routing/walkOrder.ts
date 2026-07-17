/**
 * utils/routing/walkOrder.ts - Default walking order inside a stop (fluxo §6).
 *
 * The courier parks at the vehicle stop and delivers the stop's addresses on a
 * foot circuit that leaves from and returns to it. Two orders live here:
 * - `sweepWalkingOrder`: the base CLOCKWISE SWEEP around the vehicle stop
 *   (north first), ties nearest-first — never criss-crosses.
 * - `nearestFirstOrder` (RF-006.17): the order the app actually uses — the
 *   NEAREST address to the vehicle is 1st, then the sweep continues in the
 *   sense (clockwise/counter) that puts the closer neighbour 2nd; `reversed`
 *   ("Inverter ordem") flips that sense while keeping the nearest 1st.
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

/** The point nearest `vehicleStop`. Ties keep the earlier point (stable). */
const nearestPoint = (vehicleStop: LatLng, points: DeliveryPoint[]): DeliveryPoint => points.reduce((best, point) => (haversine(vehicleStop, point) < haversine(vehicleStop, best) ? point : best));

/**
 * The walking order the app uses (RF-006.17): the address NEAREST the vehicle
 * stop is 1st (a coincident anchor sits at distance 0, so it is always 1st),
 * then the circuit continues in the SENSE that puts the closer of the 1st's two
 * bearing-neighbours 2nd — because with the 1st at distance 0, only the 2nd
 * reveals which way to sweep. `reversed` ("Inverter ordem") flips that sense,
 * always keeping the nearest 1st. Built on `sweepWalkingOrder`, so the circuit
 * still never criss-crosses.
 *
 * @param vehicleStop - Where the vehicle parks (the circuit's start/end).
 * @param points - The stop's delivery points (any order).
 * @param reversed - Walk the auto-chosen sense backwards.
 * @returns The point ids in visit order.
 */
export const nearestFirstOrder = (vehicleStop: LatLng, points: DeliveryPoint[], reversed: boolean): string[] => {
  if (points.length <= 1) return points.map((point) => point.id);

  const byId = new Map(points.map((point) => [point.id, point]));
  const clockwise = sweepWalkingOrder(vehicleStop, points);
  const first = nearestPoint(vehicleStop, points);
  const start = clockwise.indexOf(first.id);

  // Rotate the clockwise ring to begin at the nearest; the counter-clockwise
  // ring keeps that same 1st and reverses the rest.
  const cwRing = [...clockwise.slice(start), ...clockwise.slice(0, start)];
  const ccwRing = [cwRing[0], ...cwRing.slice(1).reverse()];

  // Default sense: whichever ring puts the closer neighbour of the 1st in 2nd.
  const cwSecond = byId.get(cwRing[1])!;
  const ccwSecond = byId.get(ccwRing[1])!;
  const base = haversine(first, cwSecond) <= haversine(first, ccwSecond) ? cwRing : ccwRing;
  const flipped = base === cwRing ? ccwRing : cwRing;

  return reversed ? flipped : base;
};
