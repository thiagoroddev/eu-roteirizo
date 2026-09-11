import type { FundamentalReference } from "./fundamentals";
import type { AnchorSegment } from "../../src/types/autoRouting";
import type { LatLng } from "../../src/types/routing";
import type { Edge, NodeId, RoadGraph } from "../../src/utils/routing/graph";
import { aStar } from "../../src/utils/routing/aStar";
import { haversine } from "../../src/utils/routing/geo";
import { nearestEdge, projectPointOnSegment } from "../../src/utils/routing/match";
import { pathToLatLngs } from "../../src/utils/routing/graph";

export type PathKind = "street" | "estimated-access" | "missing";

export interface PathEndpoint {
  position: LatLng;
  segment?: AnchorSegment | null;
}

export interface EvaluatedPath {
  kind: PathKind;
  from: LatLng;
  to: LatLng;
  path: LatLng[];
  distanceMeters: number;
  viaStreets: boolean;
  reason?: "missing-graph" | "missing-endpoint" | "disconnected";
}

export interface PathCollection {
  path: LatLng[];
  legs: EvaluatedPath[];
  distanceMeters: number;
  streetMeters: number;
  estimatedAccessMeters: number;
  valid: boolean;
  closed: boolean;
  missingLegs: number;
}

const samePosition = (a: LatLng, b: LatLng): boolean => Math.abs(a.lat - b.lat) < 1e-10 && Math.abs(a.lng - b.lng) < 1e-10;
const endpoint = (value: LatLng | PathEndpoint): PathEndpoint => ("position" in value ? value : { position: value });
let streetPathCache = new WeakMap<RoadGraph, Map<string, EvaluatedPath>>();
export const clearExperimentPathCache = (): void => {
  streetPathCache = new WeakMap();
};
export const MAX_CACHED_STREET_PATHS = 20_000;
const pathKey = (value: PathEndpoint): string => JSON.stringify([value.position.lat, value.position.lng, value.segment?.id ?? ""]);

/** Local read overlay: A* and pathToLatLngs use only get/has. Base maps remain untouched. */
class PathOverlay<K, V> extends Map<K, V> {
  private readonly base: Map<K, V>;
  constructor(base: Map<K, V>) {
    super();
    this.base = base;
  }
  override get(key: K): V | undefined {
    return super.has(key) ? super.get(key) : this.base.get(key);
  }
  override has(key: K): boolean {
    return super.has(key) || this.base.has(key);
  }
}

const segmentIdentity = (from: NodeId, to: NodeId, edge: Edge): string => {
  const ids = [`${typeof from}:${from}`, `${typeof to}:${to}`].sort();
  return JSON.stringify([...ids, edge.wayName, edge.highway ?? "", edge.isRoundabout ?? false]);
};

/** Split both endpoints together, including two positions on the same directed edge. */
const matchEndpoints = (graph: RoadGraph, values: PathEndpoint[]): { graph: RoadGraph; nodes: NodeId[] } | null => {
  const coords = new PathOverlay(graph.coords);
  const adj = new PathOverlay(graph.adj);
  const splits = new Map<string, { from: NodeId; edge: Edge; positions: { node: NodeId; t: number }[] }>();
  const nodes: NodeId[] = [];
  for (const [index, value] of values.entries()) {
    const nearest = value.segment ? null : nearestEdge(graph, value.position);
    const from = value.segment?.from ?? nearest?.from;
    const to = value.segment?.to ?? nearest?.to;
    if (from === undefined || to === undefined) return null;
    const a = graph.coords.get(from),
      b = graph.coords.get(to);
    if (!a || !b) return null;
    const projection = projectPointOnSegment(value.position, a, b);
    // An off-street endpoint is not a validated street connection.
    if (projection.distance > 0.05) return null;
    const node: NodeId = projection.t < 1e-10 ? from : projection.t > 1 - 1e-10 ? to : `fundamental-path-endpoint:${index}`;
    nodes.push(node);
    coords.set(node, projection.point);
    let matched = false;
    for (const [source, destination] of [
      [from, to],
      [to, from],
    ]) {
      for (const edge of graph.adj.get(source) ?? []) {
        if (edge.to !== destination || (value.segment && segmentIdentity(source, destination, edge) !== value.segment.id)) continue;
        matched = true;
        if (node === from || node === to) continue;
        const key = JSON.stringify([typeof source, source, typeof destination, destination, segmentIdentity(source, destination, edge)]);
        const split = splits.get(key) ?? { from: source, edge, positions: [] };
        split.positions.push({ node, t: source === from ? projection.t : 1 - projection.t });
        splits.set(key, split);
      }
    }
    if (!matched) return null;
  }
  for (const split of splits.values()) {
    const chain = [{ node: split.from, t: 0 }, ...split.positions.sort((a, b) => a.t - b.t), { node: split.edge.to, t: 1 }];
    adj.set(
      split.from,
      (adj.get(split.from) ?? []).filter((edge) => edge !== split.edge)
    );
    for (let i = 0; i < chain.length - 1; i++) {
      const current = chain[i],
        next = chain[i + 1];
      adj.set(current.node, [...(adj.get(current.node) ?? []), { ...split.edge, to: next.node, weight: split.edge.weight * (next.t - current.t) }]);
    }
  }
  return { graph: { coords, adj, ...(graph.isPedestrian ? { isPedestrian: true } : {}) }, nodes };
};

const missingPath = (from: LatLng, to: LatLng, reason: EvaluatedPath["reason"]): EvaluatedPath => ({ kind: "missing", from, to, path: [], distanceMeters: Infinity, viaStreets: false, reason });

/** Evaluates only a graph path. It never falls back to a straight line. */
export const evaluateStreetPath = (graph: RoadGraph | null, fromValue: LatLng | PathEndpoint, toValue: LatLng | PathEndpoint): EvaluatedPath => {
  const from = endpoint(fromValue);
  const to = endpoint(toValue);
  if (samePosition(from.position, to.position) && (!from.segment || !to.segment || from.segment.id === to.segment.id))
    return { kind: "street", from: from.position, to: to.position, path: [{ ...from.position }], distanceMeters: 0, viaStreets: true };
  if (!graph || graph.coords.size === 0) return missingPath(from.position, to.position, "missing-graph");
  const cache = streetPathCache.get(graph) ?? new Map<string, EvaluatedPath>();
  streetPathCache.set(graph, cache);
  const key = `${pathKey(from)}>${pathKey(to)}`;
  const cached = cache.get(key);
  if (cached) return cached;
  if (cache.size >= MAX_CACHED_STREET_PATHS) cache.delete(cache.keys().next().value!);
  const matched = matchEndpoints(graph, [from, to]);
  if (!matched) {
    const result = missingPath(from.position, to.position, "missing-endpoint");
    cache.set(key, result);
    return result;
  }
  const result = aStar(matched.graph, matched.nodes[0], matched.nodes[1]);
  if (!result.path) {
    const missing = missingPath(from.position, to.position, "disconnected");
    cache.set(key, missing);
    return missing;
  }
  const streetPath = pathToLatLngs(matched.graph, result.path);
  const evaluated: EvaluatedPath = { kind: "street", from: from.position, to: to.position, path: streetPath, distanceMeters: result.distance, viaStreets: true };
  cache.set(key, evaluated);
  return evaluated;
};

/** A separately named estimate for a fundamental-to-pin access. */
export const estimatedAccessPath = (from: LatLng, to: LatLng): EvaluatedPath => ({
  kind: "estimated-access",
  from,
  to,
  path: samePosition(from, to) ? [{ ...from }] : [from, to],
  distanceMeters: haversine(from, to),
  viaStreets: false,
});

const append = (path: LatLng[], leg: EvaluatedPath): LatLng[] => {
  if (leg.path.length === 0) return path;
  return path.length === 0 ? leg.path.slice() : path.concat(leg.path.slice(1));
};

const trace = (legs: EvaluatedPath[], first: LatLng, last: LatLng): PathCollection => ({
  path: legs.some((leg) => leg.kind === "missing") ? [] : legs.reduce(append, []),
  legs,
  distanceMeters: legs.reduce((sum, leg) => sum + leg.distanceMeters, 0),
  streetMeters: legs.filter((leg) => leg.kind === "street").reduce((sum, leg) => sum + leg.distanceMeters, 0),
  estimatedAccessMeters: legs.filter((leg) => leg.kind === "estimated-access").reduce((sum, leg) => sum + leg.distanceMeters, 0),
  valid: legs.every((leg) => leg.kind !== "missing"),
  closed: legs.length === 0 ? true : samePosition(first, last) && legs.every((leg) => leg.kind !== "missing"),
  missingLegs: legs.filter((leg) => leg.kind === "missing").length,
});

const evaluateChain = (graph: RoadGraph | null, endpoints: PathEndpoint[]): PathCollection => {
  if (endpoints.length < 2) return trace([], endpoints[0]?.position ?? { lat: 0, lng: 0 }, endpoints[0]?.position ?? { lat: 0, lng: 0 });
  const legs: EvaluatedPath[] = [];
  for (let index = 0; index < endpoints.length - 1; index++) legs.push(evaluateStreetPath(graph, endpoints[index], endpoints[index + 1]));
  return trace(legs, endpoints[0].position, endpoints[endpoints.length - 1].position);
};

/** Anchor → fundamentals in their chosen order → same anchor. */
export const evaluateLimitedFundamentalCircuit = (
  graph: RoadGraph | null,
  anchorValue: LatLng | PathEndpoint,
  orderedReferences: readonly FundamentalReference[],
  limitMeters: number
): PathCollection & { anchor: LatLng; exceedsLimit: boolean } => {
  const anchor = endpoint(anchorValue);
  const collection = evaluateChain(graph, [anchor, ...orderedReferences.map((reference) => ({ position: reference.position, segment: reference.segment })), anchor]);
  return { ...collection, anchor: { ...anchor.position }, exceedsLimit: collection.distanceMeters > limitMeters + 1e-6 };
};

/**
 * Full walking model: the courier reaches each fundamental, accesses its real
 * pin and returns to that fundamental before continuing. This keeps limited
 * circuit meters and estimated fundamental↔pin access meters disjoint.
 */
export const evaluateCompleteWalking = (graph: RoadGraph | null, anchorValue: LatLng | PathEndpoint, orderedReferences: readonly FundamentalReference[]): PathCollection => {
  if (orderedReferences.length === 0) return trace([], endpoint(anchorValue).position, endpoint(anchorValue).position);
  const anchor = endpoint(anchorValue);
  const legs: EvaluatedPath[] = [];
  let cursor: PathEndpoint = anchor;
  for (const reference of orderedReferences) {
    const fundamental: PathEndpoint = { position: reference.position, segment: reference.segment };
    legs.push(evaluateStreetPath(graph, cursor, fundamental));
    legs.push(estimatedAccessPath(reference.position, reference.originalPosition));
    legs.push(estimatedAccessPath(reference.originalPosition, reference.position));
    cursor = fundamental;
  }
  legs.push(evaluateStreetPath(graph, cursor, anchor));
  return trace(legs, anchor.position, anchor.position);
};

/** Directed vehicle legs from a free start to ordered final anchors. */
export const evaluateVehicleOrder = (graph: RoadGraph | null, startValue: LatLng | PathEndpoint | null, anchors: readonly (LatLng | PathEndpoint)[]): PathCollection => {
  const endpoints = anchors.map(endpoint);
  if (startValue) endpoints.unshift(endpoint(startValue));
  if (endpoints.length < 2) return trace([], endpoints[0]?.position ?? { lat: 0, lng: 0 }, endpoints[0]?.position ?? { lat: 0, lng: 0 });
  return evaluateChain(graph, endpoints);
};
