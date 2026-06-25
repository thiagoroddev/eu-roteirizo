/**
 * Synthetic road graph for the routing-core tests (TASK-RF-005.1).
 *
 * A 1-block square near Ipanema. The west side (A→B) is ONE-WAY, so going B→A
 * is forbidden and must detour B→D→C→A. Distances are real haversine values
 * (pre-computed in Node) so the tests assert exact meters.
 *
 *     A(1) ──Rua AB (oneway A→B)── B(2)        A,C: lat -22.980   B,D: lat -22.981
 *      │                           │           A,B: lng -43.200   C,D: lng -43.199
 *   Rua AC                       Rua BD
 *      │                           │
 *     C(3) ────── Rua CD ──────── D(4)
 */

import type { OsmElement, RoadGraph } from "../../../../utils/routing/graph";
import { buildGraph } from "../../../../utils/routing/graph";

/** Node ids. */
export const A = 1;
export const B = 2;
export const C = 3;
export const D = 4;

/** Node coordinates in the project's `LatLng {lat, lng}` shape (for assertions). */
export const COORDS = {
  [A]: { lat: -22.98, lng: -43.2 },
  [B]: { lat: -22.981, lng: -43.2 },
  [C]: { lat: -22.98, lng: -43.199 },
  [D]: { lat: -22.981, lng: -43.199 },
} as const;

/** OSM-shaped geometry (note: OSM uses `lon`). */
const G = {
  [A]: { lat: -22.98, lon: -43.2 },
  [B]: { lat: -22.981, lon: -43.2 },
  [C]: { lat: -22.98, lon: -43.199 },
  [D]: { lat: -22.981, lon: -43.199 },
};

/** Builds a minimal OSM `way` element. */
export const osmWay = (nodes: number[], tags: Record<string, string>): OsmElement => ({
  type: "way",
  nodes,
  geometry: nodes.map((id) => G[id as keyof typeof G]),
  tags,
});

/** The four ways of the square; only the west side (A→B) is one-way. */
export const SQUARE_WAYS: OsmElement[] = [
  osmWay([A, B], { oneway: "yes", name: "Rua AB" }),
  osmWay([A, C], { name: "Rua AC" }),
  osmWay([C, D], { name: "Rua CD" }),
  osmWay([B, D], { name: "Rua BD" }),
];

/** The built directed graph (exercises the real buildGraph -> aStar -> streets chain). */
export const squareGraph: RoadGraph = buildGraph(SQUARE_WAYS);

/** Pre-computed haversine distances (meters), verified in Node. */
export const W_VERTICAL = 111.1949; // A↔B and C↔D (0.001° latitude)
export const W_HORIZONTAL = 102.3706; // A↔C (0.001° longitude @ -22.98)
export const DETOUR_B_TO_A = 315.9354; // B→D→C→A (2 horizontal + 1 vertical)
