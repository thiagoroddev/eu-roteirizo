/**
 * utils/routing/suggestion.ts - The next-stop suggestion line (TASK-RF-006.3).
 *
 * Spec (fluxo §6/§10.11): the "nearest" RANK is straight-line (cheap, done by
 * `suggestedNextPointId`); the drawn path + real distance are computed for the
 * CHOSEN target only — one A* per target — over the WALKING graph (pedestrian
 * ignores one-way, RN-18). Straight line is the fallback while the graph hasn't
 * loaded (or the target is unreachable). Pure: no Leaflet/DOM/React.
 */

import type { DeliveryPoint, LatLng } from "../../types/routing";
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

/** Straight-line prefilter before the (costlier) A* refine — ⚙️ MANUAL KNOB. */
const SUGGESTION_TOP_N = 6;

/**
 * The candidate NEAREST `origin` by the DIRECTED graph (RF-006.12): the vehicle
 * hop to the next stop respects one-way, so a point "close in a straight line
 * but far by the street sense" loses. Ranks only the top-N straight-line
 * candidates by real `suggestionPath` distance (the full A* on every candidate
 * would be too costly). Returns the candidate id, or null if empty.
 *
 * @param graph - The DIRECTED vehicle graph (must be non-null; callers fall back
 *                to the straight-line pick when the graph hasn't loaded).
 * @param origin - Where the vehicle comes from (last anchor / start).
 * @param candidates - The free points eligible to seed the next stop.
 * @param topN - How many straight-line-nearest candidates to A*-refine.
 * @returns The nearest candidate's id.
 */
export const nearestByVehicleGraph = (graph: RoadGraph, origin: LatLng, candidates: DeliveryPoint[], topN: number = SUGGESTION_TOP_N): string | null => {
  if (candidates.length === 0) return null;

  // Cheap straight-line prefilter, then rank the top-N by real DIRECTED distance.
  const top = [...candidates].sort((a, b) => haversine(origin, a) - haversine(origin, b)).slice(0, topN);
  // Match the ORIGIN once and reuse it: `matchToGraph` clones the adjacency, so
  // re-matching the origin per candidate (as `suggestionPath` does) would double
  // the cost — the heaviest part of the whole rank.
  const originMatch = matchToGraph(graph, origin);
  if (!originMatch) return top[0].id; // origin off the graph → the straight-line nearest

  let best = top[0];
  let bestDistance = Infinity;
  for (const candidate of top) {
    const candidateMatch = matchToGraph(originMatch.graph, candidate);
    if (!candidateMatch) continue;
    const { path, distance } = aStar(candidateMatch.graph, originMatch.node, candidateMatch.node);
    const cost = path ? distance : Infinity; // unreachable by the street sense → ranked last
    if (cost < bestDistance) {
      bestDistance = cost;
      best = candidate;
    }
  }
  return best.id;
};
