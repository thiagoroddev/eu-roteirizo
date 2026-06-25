/**
 * utils/routing/match.ts - Map matching: snap a point to the road graph (TASK-RF-005.5).
 *
 * A delivery point usually sits mid-block, not on an intersection. Snapping only
 * to the nearest NODE (intersection) can pick the wrong street/side; projecting
 * onto the nearest EDGE (street segment) places it on the correct street, which
 * makes the start/end of a traced route faithful (ADR-002).
 *
 * `matchToGraph` inserts a SYNTHETIC node at the projection (splitting the matched
 * edge) so A* can route to/from the actual address, not just the corner.
 * Pure: no fetch/Leaflet/DOM.
 */

import type { LatLng } from "../../types/routing";
import type { Edge, NodeId, RoadGraph } from "./graph";
import { haversine } from "./geo";

const DEG_TO_RAD = Math.PI / 180;

/** The projection of a point onto a segment. */
export interface Projection {
  /** The projected point on the segment (clamped to the endpoints). */
  point: LatLng;
  /** Position along the segment, 0 (at `a`) to 1 (at `b`). */
  t: number;
  /** Distance (meters) from the original point to the projection. */
  distance: number;
}

/** The nearest street segment to a target, with the projection on it. */
export interface EdgeMatch {
  from: NodeId;
  to: NodeId;
  point: LatLng;
  distance: number;
}

/** A graph with a synthetic node inserted on a street at the matched point. */
export interface GraphMatch {
  graph: RoadGraph;
  node: NodeId;
}

/**
 * Projects point `p` onto segment `a→b`, clamped to the segment.
 *
 * Uses a local equirectangular approximation (longitude scaled by cos(lat)) so
 * the projection respects the metric aspect ratio at street scale, then linearly
 * interpolates the lat/lng of the foot.
 *
 * @param p - The point to project.
 * @param a - Segment start.
 * @param b - Segment end.
 * @returns The projected point, its position `t` in [0,1], and the distance to it.
 */
export const projectPointOnSegment = (p: LatLng, a: LatLng, b: LatLng): Projection => {
  const cosLat = Math.cos(a.lat * DEG_TO_RAD);
  const bx = (b.lng - a.lng) * cosLat;
  const by = b.lat - a.lat;
  const px = (p.lng - a.lng) * cosLat;
  const py = p.lat - a.lat;

  const lenSq = bx * bx + by * by;
  let t = lenSq === 0 ? 0 : (px * bx + py * by) / lenSq;
  t = Math.max(0, Math.min(1, t));

  const point: LatLng = { lat: a.lat + t * (b.lat - a.lat), lng: a.lng + t * (b.lng - a.lng) };
  return { point, t, distance: haversine(p, point) };
};

/**
 * Finds the street segment nearest to `target` and the projection onto it.
 *
 * @param graph - The road graph.
 * @param target - The point to match.
 * @returns The nearest edge + projection, or `null` for an empty graph.
 */
export const nearestEdge = (graph: RoadGraph, target: LatLng): EdgeMatch | null => {
  let best: EdgeMatch | null = null;
  for (const [from, edges] of graph.adj) {
    const a = graph.coords.get(from);
    if (!a) continue;
    for (const edge of edges) {
      const b = graph.coords.get(edge.to);
      if (!b) continue;
      const proj = projectPointOnSegment(target, a, b);
      if (!best || proj.distance < best.distance) {
        best = { from, to: edge.to, point: proj.point, distance: proj.distance };
      }
    }
  }
  return best;
};

/**
 * Inserts a synthetic node at the projection of `target` onto its nearest street
 * segment, splitting that edge (and its reverse, for two-way streets), so A* can
 * route to/from the matched point. The original graph is NOT mutated.
 *
 * @param graph - The road graph.
 * @param target - The point to match onto the streets.
 * @returns A new graph plus the synthetic node id, or `null` for an empty graph.
 */
export const matchToGraph = (graph: RoadGraph, target: LatLng): GraphMatch | null => {
  const match = nearestEdge(graph, target);
  if (!match) return null;

  const { from, to, point } = match;
  const a = graph.coords.get(from);
  const b = graph.coords.get(to);
  if (!a || !b) return null;

  const synthetic: NodeId = `match:${from}-${to}`;
  const wFromS = haversine(a, point);
  const wSTo = haversine(point, b);
  const wayName = (graph.adj.get(from) ?? []).find((e) => e.to === to)?.wayName ?? "via";

  /** Clone coords + adjacency (copy the edge arrays so the original stays intact). */
  const coords = new Map<NodeId, LatLng>(graph.coords);
  const adj = new Map<NodeId, Edge[]>();
  for (const [k, edges] of graph.adj) adj.set(k, edges.slice());
  coords.set(synthetic, point);

  /** Replaces edge x→y with x→synthetic (wXS) and synthetic→y (wSY). */
  const split = (x: NodeId, y: NodeId, wXS: number, wSY: number): void => {
    adj.set(x, [...(adj.get(x) ?? []).filter((e) => e.to !== y), { to: synthetic, weight: wXS, wayName }]);
    adj.set(synthetic, [...(adj.get(synthetic) ?? []), { to: y, weight: wSY, wayName }]);
  };

  if ((graph.adj.get(from) ?? []).some((e) => e.to === to)) split(from, to, wFromS, wSTo);
  if ((graph.adj.get(to) ?? []).some((e) => e.to === from)) split(to, from, wSTo, wFromS);

  return { graph: { coords, adj }, node: synthetic };
};
