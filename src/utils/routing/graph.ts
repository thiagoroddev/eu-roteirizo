/**
 * utils/routing/graph.ts - Directed road graph for local routing (ADR-002).
 *
 * The road network becomes a DIRECTED graph: each street segment is an edge
 * between nodes (intersections). One-way streets create the edge in a single
 * direction only — so "no wrong-way" is a property of the data structure, not a
 * runtime check (the forbidden edge simply does not exist).
 *
 * Ported from the validated prototype (TASK-RF-001). Pure: no fetch/Leaflet/DOM.
 * The OSM types here are the MINIMUM `buildGraph` needs; the full Overpass
 * response is typed later in osm.ts (TASK-RF-005.2), which reuses these.
 */

import type { LatLng } from "../../types/routing";
import { haversine } from "./geo";

/**
 * A graph node id: an OSM node id (`number`, well within Number.MAX_SAFE_INTEGER)
 * or a synthetic id (`string`) inserted by map matching (TASK-RF-005.5).
 */
export type NodeId = number | string;

/** Navigable direction of a way, derived from its OSM tags. */
export type OnewayDir = "forward" | "backward" | "both";

/** A directed edge from one node to another, weighted by street distance. */
export interface Edge {
  /** Destination node id. */
  to: NodeId;
  /** Edge length in meters (haversine between the two nodes). */
  weight: number;
  /** Human-readable street name (OSM `name`, else `highway`, else "via"). */
  wayName: string;
}

/** A node together with its id (returned by `nodeAt`; used by map matching, 005.5). */
export interface GraphNode extends LatLng {
  id: NodeId;
}

/** The directed road graph: node coordinates plus an adjacency list. */
export interface RoadGraph {
  /** Node id → coordinate. */
  coords: Map<NodeId, LatLng>;
  /** Node id → outgoing edges. */
  adj: Map<NodeId, Edge[]>;
}

/** OSM tags relevant to routing (others ignored). */
export interface OsmTags {
  oneway?: string;
  junction?: string;
  name?: string;
  highway?: string;
  [key: string]: string | undefined;
}

/** A single coordinate from an OSM way's geometry (note: OSM uses `lon`). */
export interface OsmGeometryPoint {
  lat: number;
  lon: number;
}

/** A minimal OSM element. `buildGraph` only consumes `way` elements with geometry. */
export interface OsmElement {
  type: string;
  nodes?: NodeId[];
  geometry?: (OsmGeometryPoint | null)[];
  tags?: OsmTags;
}

/**
 * Reads the OSM tags and returns the navigable direction of the way.
 * This is where one-way restrictions enter the system.
 *
 * Precedence: an explicit `oneway` value wins; otherwise a roundabout is
 * forward; otherwise the way is two-way.
 *
 * @param tags - The way's OSM tags.
 * @returns "forward" (a→b), "backward" (b→a) or "both".
 */
export const onewayDirection = (tags: OsmTags = {}): OnewayDir => {
  const v = String(tags.oneway ?? "").toLowerCase();
  if (v === "yes" || v === "true" || v === "1") return "forward";
  if (v === "-1" || v === "reverse") return "backward";
  if (String(tags.junction ?? "").toLowerCase() === "roundabout") return "forward";
  return "both";
};

/**
 * Builds a directed road graph from OSM `way` elements.
 *
 * Normalizes OSM's `lon` to the project's `lng` so the whole graph speaks
 * `LatLng {lat, lng}`. A one-way street adds the edge in its allowed direction
 * only; a two-way street adds both. Edge weight is the haversine length.
 *
 * @param elements - OSM elements (only `way` items with geometry are used).
 * @returns The directed road graph.
 */
export const buildGraph = (elements: OsmElement[]): RoadGraph => {
  const coords = new Map<NodeId, LatLng>();
  const adj = new Map<NodeId, Edge[]>();

  const addEdge = (from: NodeId, to: NodeId, weight: number, wayName: string): void => {
    const edges = adj.get(from);
    if (edges) edges.push({ to, weight, wayName });
    else adj.set(from, [{ to, weight, wayName }]);
  };

  for (const el of elements) {
    if (el.type !== "way" || !el.geometry || !el.nodes) continue;

    const dir = onewayDirection(el.tags);
    const wayName = el.tags?.name ?? el.tags?.highway ?? "via";

    for (let i = 0; i < el.nodes.length; i++) {
      const g = el.geometry[i];
      if (g) coords.set(el.nodes[i], { lat: g.lat, lng: g.lon });
    }

    for (let i = 0; i < el.nodes.length - 1; i++) {
      const a = el.nodes[i];
      const b = el.nodes[i + 1];
      const ga = el.geometry[i];
      const gb = el.geometry[i + 1];
      if (!ga || !gb) continue;

      const w = haversine({ lat: ga.lat, lng: ga.lon }, { lat: gb.lat, lng: gb.lon });
      if (dir === "both" || dir === "forward") addEdge(a, b, w, wayName);
      if (dir === "both" || dir === "backward") addEdge(b, a, w, wayName);
    }
  }

  return { coords, adj };
};

/**
 * Finds the graph node closest to a target coordinate (simple map matching).
 *
 * Linear scan over all nodes — fine for street-scale graphs; segment projection
 * is a later refinement (TASK-RF-005.5).
 *
 * @param graph - The road graph.
 * @param target - The coordinate to snap.
 * @returns The nearest node id and its distance (meters), or `{null, Infinity}` if empty.
 */
export const nearestNode = (graph: RoadGraph, target: LatLng): { node: NodeId | null; dist: number } => {
  let node: NodeId | null = null;
  let dist = Infinity;
  for (const [id, c] of graph.coords) {
    const d = haversine(target, c);
    if (d < dist) {
      dist = d;
      node = id;
    }
  }
  return { node, dist };
};

/**
 * Returns a node (id + coordinate) if it exists in the graph, else `null`.
 *
 * @param graph - The road graph.
 * @param id - The node id to look up.
 * @returns The node, or `null` when absent.
 */
export const nodeAt = (graph: RoadGraph, id: NodeId): GraphNode | null => {
  const c = graph.coords.get(id);
  return c ? { id, lat: c.lat, lng: c.lng } : null;
};
