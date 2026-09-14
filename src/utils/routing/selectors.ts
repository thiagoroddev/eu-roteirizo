/**
 * utils/routing/selectors.ts - Pure derivations over the route model.
 *
 * These functions never mutate; they compute the numbers the UI shows (HUD counters,
 * stop summaries) from the source data (points + stops). Keeping them pure and here
 * makes them trivial to test and keeps components/hooks thin.
 */

import type { DeliveryPoint, RouteStop, LatLng } from "../../types/routing";
import { haversine } from "./geo";

/** Index points by id for O(1) lookup. */
export const indexPointsById = (points: DeliveryPoint[]): Map<string, DeliveryPoint> => {
  const map = new Map<string, DeliveryPoint>();
  for (const p of points) map.set(p.id, p);
  return map;
};

/** Total number of distinct delivery locations. */
export const totalPoints = (points: DeliveryPoint[]): number => points.length;

/** Total number of packages across all locations. */
export const totalPackages = (points: DeliveryPoint[]): number => points.reduce((sum, p) => sum + p.packageCount, 0);

/** Set of point ids already assigned to some stop. */
export const assignedPointIds = (stops: RouteStop[]): Set<string> => {
  const ids = new Set<string>();
  for (const stop of stops) for (const id of stop.pointIds) ids.add(id);
  return ids;
};

/** Points not yet placed in any stop (the gray/"livre" markers). */
export const unassignedPoints = (points: DeliveryPoint[], stops: RouteStop[]): DeliveryPoint[] => {
  const assigned = assignedPointIds(stops);
  return points.filter((p) => !assigned.has(p.id));
};

/**
 * Points within `radiusMeters` of `center` (haversine). Used to derive the
 * CANDIDATES of a stop draft (fluxo §8 — the radius only suggests; the user
 * picks which ones join the stop).
 */
export const pointsWithinRadius = (center: LatLng, points: DeliveryPoint[], radiusMeters: number): DeliveryPoint[] => points.filter((p) => haversine(center, p) <= radiusMeters);

/** Number of addresses (points) in a stop. */
export const addressCountInStop = (stop: RouteStop): number => stop.pointIds.length;

/** Total packages delivered in a stop (sum over its points). */
export const packagesInStop = (stop: RouteStop, pointsById: Map<string, DeliveryPoint>): number => stop.pointIds.reduce((sum, id) => sum + (pointsById.get(id)?.packageCount ?? 0), 0);

/**
 * The stop whose ANCHOR (vehicle stop) is nearest to a point — the default
 * target when incorporating an orphan (fluxo §9: select pré-selecionando a
 * mais próxima). Null without stops.
 */
export const nearestStopTo = (point: LatLng, stops: RouteStop[]): RouteStop | null => {
  let best: RouteStop | null = null;
  let bestDistance = Infinity;
  for (const stop of stops) {
    const distance = haversine(point, stop.vehicleStop);
    if (distance < bestDistance) {
      best = stop;
      bestDistance = distance;
    }
  }
  return best;
};

/**
 * Id of the previous/next FIRMED stop from `currentId`, CIRCULAR over `order`
 * (the Meu roteiro StopStepper ‹ › — TASK-RF-044, RF-58). Mirrors the Original's
 * `adjacentStopKey`. Sorts by `order`, never by array position: a reorder
 * (RF-006.17) renumbers `order` without sorting the array. Null/unknown
 * `currentId` → the first stop; empty list → null.
 */
export const adjacentStopId = (stops: RouteStop[], currentId: string | null, direction: 1 | -1): string | null => {
  const order = [...stops].sort((a, b) => a.order - b.order).map((s) => s.id);
  if (order.length === 0) return null;
  const position = currentId !== null ? order.indexOf(currentId) : -1;
  if (position < 0) return order[0];
  return order[(position + direction + order.length) % order.length];
};

/**
 * Geographic centroid (mean) of a stop's points. Useful as a fallback position
 * for the stop marker (the vehicle stop is a separate, own marker).
 */
export const stopCentroid = (stop: RouteStop, pointsById: Map<string, DeliveryPoint>): LatLng | null => {
  const pts = stop.pointIds.map((id) => pointsById.get(id)).filter((p): p is DeliveryPoint => p !== undefined);
  if (pts.length === 0) return null;
  const lat = pts.reduce((s, p) => s + p.lat, 0) / pts.length;
  const lng = pts.reduce((s, p) => s + p.lng, 0) / pts.length;
  return { lat, lng };
};
