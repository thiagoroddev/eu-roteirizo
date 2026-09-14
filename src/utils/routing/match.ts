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
export const nearestEdge = (graph: RoadGraph, target: LatLng): EdgeMatch | null => nearestEdgeByTiers(graph, target, [() => true])[0];

/**
 * Predicado que qualifica uma aresta como candidata de um nível (TASK-BG-016).
 *
 * @param edge - A aresta candidata (traz `highway` e `wayName`).
 * @param distance - Distância em metros de `target` à projeção nessa aresta.
 */
export type EdgeTier = (edge: Edge, distance: number) => boolean;

/**
 * Melhor projeção por NÍVEL de preferência, em UMA varredura do grafo
 * (TASK-BG-016). Existe porque escolher a parada padrão do veículo é uma
 * pergunta em camadas — "a rua nomeada mais próxima, a do endereço se empatar,
 * senão qualquer asfalto" — e responder cada camada com sua própria varredura
 * multiplicaria um laço que já é O(arestas) e roda por parada.
 *
 * @param graph - O grafo de ruas.
 * @param target - O ponto a projetar.
 * @param tiers - Os níveis, do mais desejável ao menos.
 * @returns Um resultado por nível, alinhado 1:1 com `tiers` (`null` onde nenhuma
 *          aresta qualificou). O chamador pega o primeiro não-nulo.
 */
export const nearestEdgeByTiers = (graph: RoadGraph, target: LatLng, tiers: readonly EdgeTier[]): (EdgeMatch | null)[] => {
  const best: (EdgeMatch | null)[] = tiers.map(() => null);
  for (const [from, edges] of graph.adj) {
    const a = graph.coords.get(from);
    if (!a) continue;
    for (const edge of edges) {
      const b = graph.coords.get(edge.to);
      if (!b) continue;
      const proj = projectPointOnSegment(target, a, b);
      for (let i = 0; i < tiers.length; i++) {
        const current = best[i];
        if (current && proj.distance >= current.distance) continue;
        if (!tiers[i](edge, proj.distance)) continue;
        best[i] = { from, to: edge.to, point: proj.point, distance: proj.distance };
      }
    }
  }
  return best;
};

/**
 * OSM name of the directed edge `from→to`. Falls back to "via" when the edge
 * isn't found — the same default `buildGraph` writes for a way with no name.
 *
 * @param graph - The road graph.
 * @param from - Source node.
 * @param to - Target node.
 * @returns The edge's `wayName`, or "via".
 */
export const wayNameOfEdge = (graph: RoadGraph, from: NodeId, to: NodeId): string => (graph.adj.get(from) ?? []).find((e) => e.to === to)?.wayName ?? "via";

/**
 * Tokens `buildGraph` stores when a way has NO OSM `name` (it falls back to the
 * highway class, else "via"). Showing one as an address ("residential") reads as
 * a bug, so `nearestWayName` treats these as "no real name". Mirrors the highway
 * classes of osm.ts NAVIGABLE_HIGHWAYS.
 */
const GENERIC_WAY_LABELS = new Set(["motorway", "trunk", "primary", "secondary", "tertiary", "residential", "unclassified", "living_street", "service", "via"]);

/**
 * Se a aresta tem nome REAL de logradouro (e não o token que `buildGraph` grava
 * quando a via não tem `name` no OSM). Usado para escolher a parada padrão do
 * veículo (TASK-BG-016): via sem nome é, na prática, acesso interno/garagem, e
 * não é endereço de ninguém.
 *
 * @param edge - A aresta a classificar.
 * @returns `true` quando `wayName` é um nome de rua de verdade.
 */
export const hasRealStreetName = (edge: Edge): boolean => !GENERIC_WAY_LABELS.has(edge.wayName);

/**
 * Real street name of the road nearest to `target`, from the ALREADY-loaded graph
 * (TASK-RF-006.9) — zero external geocoding (RNF-03/13). `null` when there is no
 * graph, no edge, or the nearest way has no OSM name (a generic token): the caller
 * then shows a neutral label, and navigation still works off the coordinate.
 *
 * @param graph - The road graph, or `null` when not loaded yet.
 * @param target - The point to name (e.g. the vehicle anchor).
 * @returns The street name, or `null`.
 */
export const nearestWayName = (graph: RoadGraph | null, target: LatLng): string | null => {
  if (!graph) return null;
  const match = nearestEdge(graph, target);
  if (!match) return null;
  const name = wayNameOfEdge(graph, match.from, match.to);
  return GENERIC_WAY_LABELS.has(name) ? null : name;
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
  const wayName = wayNameOfEdge(graph, from, to);

  /** Clone coords + adjacency (copy the edge arrays so the original stays intact). */
  const coords = new Map<NodeId, LatLng>(graph.coords);
  const adj = new Map<NodeId, Edge[]>();
  for (const [k, edges] of graph.adj) adj.set(k, edges.slice());
  coords.set(synthetic, point);

  /** Replaces edge x→y with x→synthetic (wXS) and synthetic→y (wSY). */
  const split = (x: NodeId, y: NodeId, wXS: number, wSY: number): void => {
    const existing = (graph.adj.get(x) ?? []).find((e) => e.to === y);
    const highway = existing?.highway;
    const isRoundabout = existing?.isRoundabout;
    adj.set(x, [...(adj.get(x) ?? []).filter((e) => e.to !== y), { to: synthetic, weight: wXS, wayName, ...(highway ? { highway } : {}), ...(isRoundabout ? { isRoundabout } : {}) }]);
    adj.set(synthetic, [...(adj.get(synthetic) ?? []), { to: y, weight: wSY, wayName, ...(highway ? { highway } : {}), ...(isRoundabout ? { isRoundabout } : {}) }]);
  };

  if ((graph.adj.get(from) ?? []).some((e) => e.to === to)) split(from, to, wFromS, wSTo);
  if ((graph.adj.get(to) ?? []).some((e) => e.to === from)) split(to, from, wSTo, wFromS);

  return { graph: { coords, adj, ...(graph.isPedestrian ? { isPedestrian: true } : {}) }, node: synthetic };
};
