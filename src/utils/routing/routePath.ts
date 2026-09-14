/**
 * utils/routing/routePath.ts - Drawable route traces (TASK-RF-006.7).
 *
 * Chains `suggestionPath` over consecutive waypoints to build the two lines the
 * map draws in "Meu roteiro":
 * - the VEHICLE route (start → each vehicle stop, over the DIRECTED graph — one-
 *   way respected), and
 * - a stop's foot CIRCUIT (vehicle stop → addresses in visit order → back, over
 *   the PEDESTRIAN graph — one-way ignored, RN-18).
 *
 * `suggestionPath` already does match + A* + the straight-line fallback and
 * returns each leg with both endpoints, so this module only stitches legs and
 * sums distance. Pure: no Leaflet/DOM/React.
 */

import type { LatLng } from "../../types/routing";
import type { RoadGraph } from "./graph";
import { suggestionPath } from "./suggestion";

export interface RoutePathResult {
  /** Drawable polyline across all legs (junctions de-duplicated). */
  path: LatLng[];
  /** Summed distance in meters (street distance + approach legs per `suggestionPath`). */
  distanceMeters: number;
}

/** One vehicle leg, kept apart so the map can draw it as its own stroke (TASK-RF-043). */
export interface VehicleRouteLeg extends RoutePathResult {
  /** Index (in `anchors`) of the stop this leg LEAVES; `null` for the start → first stop leg. */
  fromStopIndex: number | null;
}

/** One `suggestionPath` per consecutive pair of waypoints (each leg carries both endpoints). */
const legsBetween = (graph: RoadGraph | null, waypoints: LatLng[]): RoutePathResult[] =>
  waypoints.slice(1).map((to, i) => {
    const leg = suggestionPath(graph, waypoints[i], to);
    return { path: leg.path, distanceMeters: leg.distanceMeters };
  });

/**
 * Stitches consecutive legs into one polyline. Each leg includes both endpoints,
 * so the shared junction (leg k's `to` === leg k+1's `from`) is dropped with
 * `slice(1)` on every leg after the first.
 */
const stitch = (waypoints: LatLng[], legs: RoutePathResult[]): RoutePathResult =>
  legs.length === 0
    ? { path: waypoints.slice(), distanceMeters: 0 }
    : {
        path: legs.flatMap((leg, i) => (i === 0 ? leg.path : leg.path.slice(1))),
        distanceMeters: legs.reduce((sum, leg) => sum + leg.distanceMeters, 0),
      };

const chain = (graph: RoadGraph | null, waypoints: LatLng[]): RoutePathResult => stitch(waypoints, legsBetween(graph, waypoints));

/**
 * The vehicle route as SEPARATE legs (start → P1, P1 → P2, …), over the DIRECTED
 * graph. The map draws one stroke per leg: canvas only adds opacity up between
 * separate strokes, so a street driven in two legs reads darker (TASK-RF-043).
 * A leg that doubles back on itself does not darken: known limitation.
 *
 * @param graph - The directed vehicle graph, or null while unavailable.
 * @param startPoint - The route's start (the first leg leaves it), or null.
 * @param anchors - The vehicle stops (`RouteStop.vehicleStop`), in route order.
 * @returns One leg per consecutive pair, tagged with the stop it leaves.
 */
export const vehicleRouteLegs = (graph: RoadGraph | null, startPoint: LatLng | null, anchors: LatLng[]): VehicleRouteLeg[] => {
  const offset = startPoint ? 1 : 0;
  return legsBetween(graph, startPoint ? [startPoint, ...anchors] : anchors).map((leg, i) => ({ ...leg, fromStopIndex: i - offset < 0 ? null : i - offset }));
};

/**
 * The vehicle route over the DIRECTED graph (respects one-way): the courier
 * drives start → each vehicle stop in order. `null` graph ⇒ straight legs.
 *
 * @param graph - The directed vehicle graph, or null while unavailable.
 * @param startPoint - The route's start (joins the front of the chain), or null.
 * @param anchors - The vehicle stops (`RouteStop.vehicleStop`), in route order.
 * @returns The stitched path + total street distance.
 */
export const vehicleRoutePath = (graph: RoadGraph | null, startPoint: LatLng | null, anchors: LatLng[]): RoutePathResult => chain(graph, startPoint ? [startPoint, ...anchors] : anchors);

/**
 * The foot circuit of a stop over the PEDESTRIAN graph (ignores one-way): the
 * courier parks, walks the addresses in visit order, returns to the vehicle.
 * `null` graph ⇒ straight legs; no points ⇒ empty.
 *
 * @param pedGraph - The pedestrian graph, or null while unavailable.
 * @param vehicleStop - The anchor the circuit leaves from and returns to.
 * @param orderedPoints - The stop's addresses, in walking-visit order.
 * @returns The stitched closed loop + total walking distance.
 */
export const footCircuitPath = (pedGraph: RoadGraph | null, vehicleStop: LatLng, orderedPoints: LatLng[]): RoutePathResult =>
  orderedPoints.length === 0 ? { path: [], distanceMeters: 0 } : chain(pedGraph, [vehicleStop, ...orderedPoints, vehicleStop]);
