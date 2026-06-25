/**
 * utils/routing/geo.ts - Geographic distance for the routing engine.
 *
 * Pure helpers ported from the validated prototype (TASK-RF-001). No fetch,
 * Leaflet or DOM coupling — these are leaf functions used by the graph and A*.
 */

import type { LatLng } from "../../types/routing";

/** Earth mean radius in meters (sphere model, same as the prototype). */
const EARTH_RADIUS_METERS = 6_371_000;

/** Degrees → radians. */
const toRadians = (degrees: number): number => (degrees * Math.PI) / 180;

/**
 * Great-circle distance between two coordinates, in meters (haversine).
 *
 * Treats the Earth as a sphere — accurate enough for street-scale routing and
 * cheap to compute (used as both edge weight and A* heuristic).
 *
 * @param a - First coordinate (decimal degrees).
 * @param b - Second coordinate (decimal degrees).
 * @returns Distance in meters.
 */
export const haversine = (a: LatLng, b: LatLng): number => {
  const dLat = toRadians(b.lat - a.lat);
  const dLng = toRadians(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(a.lat)) * Math.cos(toRadians(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(h));
};
