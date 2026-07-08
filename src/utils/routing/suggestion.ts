/**
 * utils/routing/suggestion.ts - The next-stop suggestion line (TASK-RF-006.3).
 *
 * Spec (fluxo §6/§10.11): the "nearest" RANK is straight-line (cheap, done by
 * `suggestedNextPointId`); the drawn path + real distance are computed for the
 * CHOSEN target only — one A* per target — over the WALKING graph (pedestrian
 * ignores one-way, RN-18). Straight line is the fallback while the graph hasn't
 * loaded (or the target is unreachable). Pure: no Leaflet/DOM/React.
 */

import type { LatLng } from "../../types/routing";
import type { RoadGraph } from "./graph";
import { pathToLatLngs } from "./graph";
import { haversine } from "./geo";
import { matchToGraph } from "./match";
import { aStar } from "./aStar";

export interface SuggestionPathResult {
  /** Drawable polyline, endpoints included (from → …streets… → to). */
  path: LatLng[];
  /** Walking distance in meters (street distance + the two approach legs). */
  distanceMeters: number;
  /** False when the straight-line fallback was used. */
  viaStreets: boolean;
}

/**
 * Computes the suggestion line between two points over the walking graph.
 *
 * @param graph - The PEDESTRIAN graph (see pedestrianGraph), or null while unavailable.
 * @param from - The origin (start point / last vehicle stop).
 * @param to - The suggested target point.
 * @returns The street path + real distance, or the straight fallback.
 */
export const suggestionPath = (graph: RoadGraph | null, from: LatLng, to: LatLng): SuggestionPathResult => {
  const straight: SuggestionPathResult = { path: [from, to], distanceMeters: haversine(from, to), viaStreets: false };
  if (!graph || graph.coords.size === 0) return straight;

  const fromMatch = matchToGraph(graph, from);
  if (!fromMatch) return straight;
  const toMatch = matchToGraph(fromMatch.graph, to);
  if (!toMatch) return straight;

  const { path, distance } = aStar(toMatch.graph, fromMatch.node, toMatch.node);
  if (!path) return straight;

  const streetPath = pathToLatLngs(toMatch.graph, path);
  /** Honest walking distance: streets + the approach legs from/to the real points. */
  const approachFrom = haversine(from, streetPath[0] ?? from);
  const approachTo = haversine(streetPath[streetPath.length - 1] ?? to, to);
  return { path: [from, ...streetPath, to], distanceMeters: distance + approachFrom + approachTo, viaStreets: true };
};
