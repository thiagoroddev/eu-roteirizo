import type { AnchorCandidate, AnchorSearchInput, AnchorSearchOptions, AnchorSearchResult, AnchorSegment, AnchorSource } from "../../types/autoRouting";
import type { DeliveryPoint, LatLng } from "../../types/routing";
import type { NodeId, RoadGraph } from "./graph";
import { haversine } from "./geo";
import { projectPointOnSegment } from "./match";

/** Limits bound work, not quality. Reaching one makes the result explicitly partial. */
const DEFAULT_OPTIONS: AnchorSearchOptions = {
  sampleStepMeters: 10,
  maxCandidates: 100_000,
  maxDistanceChecks: 5_000_000,
  maxSegments: 100_000,
  maxGridCells: 500_000,
  maxGroupChecks: 5_000_000,
};
const DRIVABLE = new Set([
  "motorway",
  "motorway_link",
  "trunk",
  "trunk_link",
  "primary",
  "primary_link",
  "secondary",
  "secondary_link",
  "tertiary",
  "tertiary_link",
  "residential",
  "unclassified",
  "living_street",
  "service",
]);
const LIMIT = Symbol("anchor-search-limit");
const compare = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
const nodeKey = (id: NodeId): string => `${typeof id}:${id}`;
const validPosition = (p: LatLng): boolean => !!p && Number.isFinite(p.lat) && Number.isFinite(p.lng) && Math.abs(p.lat) <= 90 && Math.abs(p.lng) <= 180;
const at = (a: LatLng, b: LatLng, t: number): LatLng => ({ lat: a.lat + t * (b.lat - a.lat), lng: a.lng + t * (b.lng - a.lng) });
const samePosition = (a: LatLng, b: LatLng): boolean => Math.abs(a.lat - b.lat) < 1e-10 && Math.abs(a.lng - b.lng) < 1e-10;

interface Segment {
  ref: AnchorSegment;
  a: LatLng;
  b: LatLng;
}

/** Node identity and edge metadata, not coordinate proximity, define equivalent segments. */
const segmentsOf = (graph: RoadGraph, maximum: number): { segments: Segment[]; truncated: boolean } => {
  const segments = new Map<string, Segment>();
  for (const [from, edges] of graph.adj)
    for (const edge of edges) {
      if (edge.highway && !DRIVABLE.has(edge.highway)) continue;
      const to = edge.to;
      if (from === to) continue;
      const [first, last] = compare(nodeKey(from), nodeKey(to)) <= 0 ? [from, to] : [to, from];
      const a = graph.coords.get(first)!;
      const b = graph.coords.get(last)!;
      if (a.lat === b.lat && a.lng === b.lng) continue;
      const id = JSON.stringify([nodeKey(first), nodeKey(last), edge.wayName, edge.highway ?? "", edge.isRoundabout ?? false]);
      let segment = segments.get(id);
      if (!segment) {
        if (segments.size >= maximum) return { segments: [...segments.values()], truncated: true };
        segment = { ref: { id, from: first, to: last, wayName: edge.wayName, directions: [] }, a, b };
        segments.set(id, segment);
      }
      if (!segment.ref.directions.some((d) => d.from === from && d.to === to)) segment.ref.directions.push({ from, to });
    }
  return {
    truncated: false,
    segments: [...segments.values()]
      .sort((a, b) => compare(a.ref.id, b.ref.id))
      .map((segment) => ({
        ...segment,
        ref: { ...segment.ref, directions: segment.ref.directions.sort((a, b) => compare(nodeKey(a.from), nodeKey(b.from))) },
      })),
  };
};

/**
 * Generates a many-to-many candidate cover, then a disjoint greedy baseline.
 * No human reference, React state, IO, nearest-address-only restriction or route cost enters here.
 * The caller must still validate driving and walking connectivity before calling a route complete.
 */
export const generateAnchorAlternatives = (input: AnchorSearchInput): AnchorSearchResult => {
  const options = { ...DEFAULT_OPTIONS, ...input.options };
  const radius = input.radiusMeters;
  const result: AnchorSearchResult = {
    status: "complete",
    radiusMeters: radius,
    candidates: [],
    defaultAnchors: [],
    groups: [],
    pending: [],
    ignoredPointIds: [],
    errors: [],
    diagnostics: { segments: 0, nearbySegments: 0, gridEntries: 0, distanceChecks: 0, groupChecks: 0, limitReached: false },
  };
  const stats = result.diagnostics;
  const ignored = new Set(input.ignoredPointIds ?? []);
  const ids = new Set(input.points.map((p) => p.id));
  const points = input.points
    .filter((p) => !ignored.has(p.id))
    .slice()
    .sort((a, b) => compare(a.id, b.id));
  result.ignoredPointIds = [...ignored].filter((id) => ids.has(id)).sort(compare);
  if (!Number.isFinite(radius) || radius < 0) result.errors.push("invalid-radius");
  if (Object.entries(options).some(([key, value]) => !Number.isFinite(value) || value <= 0 || (key !== "sampleStepMeters" && !Number.isSafeInteger(value)))) result.errors.push("invalid-options");
  if (input.points.some((p) => !p.id || !validPosition(p) || !Number.isInteger(p.packageCount) || p.packageCount < 1 || p.packages.length !== p.packageCount)) result.errors.push("invalid-point");
  if (ids.size !== input.points.length) result.errors.push("duplicate-point-id");
  if ([...ignored].some((id) => !ids.has(id))) result.errors.push("unknown-ignored-point");
  const graph = input.graph;
  if (graph?.isPedestrian) result.errors.push("pedestrian-only-graph");
  if (
    graph &&
    ([...graph.coords.values()].some((p) => !validPosition(p)) ||
      [...graph.adj].some(([from, edges]) => !graph.coords.has(from) || edges.some((e) => !graph.coords.has(e.to) || !Number.isFinite(e.weight) || e.weight < 0)))
  )
    result.errors.push("invalid-graph");
  if (result.errors.length) {
    result.status = "invalid";
    result.pending = points.map((p) => ({ pointId: p.id, reason: "invalid-input" }));
    return result;
  }
  if (!points.length) return result;
  result.defaultAnchors = points.map((p) => ({ seedPointId: p.id, position: null, withinRadius: false }));
  if (!graph || graph.adj.size === 0) {
    result.status = "partial";
    result.pending = points.map((p) => ({ pointId: p.id, reason: "missing-graph" }));
    return result;
  }

  const spend = (counter: "distanceChecks" | "gridEntries" | "groupChecks", maximum: number): void => {
    if (stats[counter] >= maximum) throw LIMIT;
    stats[counter]++;
  };
  const distance = (a: LatLng, b: LatLng): number => {
    spend("distanceChecks", options.maxDistanceChecks);
    return haversine(a, b);
  };
  const project = (p: LatLng, segment: Segment) => {
    spend("distanceChecks", options.maxDistanceChecks);
    return projectPointOnSegment(p, segment.a, segment.b);
  };

  input.onPhase?.("index");
  try {
    const collected = segmentsOf(graph, options.maxSegments);
    const allSegments = collected.segments;
    stats.segments = allSegments.length;
    if (collected.truncated) throw LIMIT;
    if (!allSegments.length) {
      result.status = "partial";
      result.pending = points.map((p) => ({ pointId: p.id, reason: "missing-graph" }));
      return result;
    }
    const cellSize = Math.max(50, radius);
    const latitude = points.reduce((n, p) => n + p.lat, 0) / points.length;
    const scaleX = 111_195 * Math.max(1e-6, Math.cos((latitude * Math.PI) / 180));
    const origin = points[0];
    const xy = (p: LatLng) => ({ x: (p.lng - origin.lng) * scaleX, y: (p.lat - origin.lat) * 111_195 });
    const grid = new Map<string, number[]>();
    for (const [index, segment] of allSegments.entries()) {
      const a = xy(segment.a),
        b = xy(segment.b);
      for (let x = Math.floor(Math.min(a.x, b.x) / cellSize); x <= Math.floor(Math.max(a.x, b.x) / cellSize); x++) {
        for (let y = Math.floor(Math.min(a.y, b.y) / cellSize); y <= Math.floor(Math.max(a.y, b.y) / cellSize); y++) {
          spend("gridEntries", options.maxGridCells);
          const key = `${x}:${y}`;
          const entries = grid.get(key) ?? [];
          entries.push(index);
          grid.set(key, entries);
        }
      }
    }
    const neighbors = new Map<number, { point: DeliveryPoint; t: number; meters: number }[]>();
    for (const [pointIndex, point] of points.entries()) {
      const pos = xy(point);
      // Conservative broad phase for neighborhood-scale graphs; haversine decides membership.
      const reach = radius * 1.02 + 1;
      const indices = new Set<number>();
      for (let x = Math.floor((pos.x - reach) / cellSize); x <= Math.floor((pos.x + reach) / cellSize); x++) {
        for (let y = Math.floor((pos.y - reach) / cellSize); y <= Math.floor((pos.y + reach) / cellSize); y++) {
          spend("gridEntries", options.maxGridCells);
          for (const index of grid.get(`${x}:${y}`) ?? []) indices.add(index);
        }
      }
      let best = Infinity;
      let bestPosition: LatLng | null = null;
      for (const index of [...indices].sort((a, b) => a - b)) {
        const projection = project(point, allSegments[index]);
        if (projection.distance < best) {
          best = projection.distance;
          bestPosition = projection.point;
        }
        if (projection.distance <= radius) {
          const entries = neighbors.get(index) ?? [];
          entries.push({ point, t: projection.t, meters: projection.distance });
          neighbors.set(index, entries);
        }
      }
      // A distant manual default remains diagnostic, never a silently accepted radius exception.
      if (best > radius) {
        best = Infinity;
        for (const segment of allSegments) {
          const projection = project(point, segment);
          if (projection.distance < best) {
            best = projection.distance;
            bestPosition = projection.point;
          }
        }
      }
      result.defaultAnchors[pointIndex] = { seedPointId: point.id, position: bestPosition, withinRadius: best <= radius };
    }
    stats.nearbySegments = neighbors.size;
    input.onPhase?.("coverage");
    for (const [index, members] of [...neighbors].sort(([a], [b]) => a - b)) {
      const segment = allSegments[index];
      const length = distance(segment.a, segment.b);
      const proposals = new Map<number, Set<AnchorSource>>();
      const add = (t: number, source: AnchorSource) => {
        const sources = proposals.get(t) ?? new Set<AnchorSource>();
        sources.add(source);
        proposals.set(t, sources);
        // Bound intermediate allocation even when every proposal would later be rejected.
        if (proposals.size > options.maxCandidates * 4) throw LIMIT;
      };
      const boundaries: number[] = [];
      for (const member of members) {
        add(member.t, "projection");
        const boundary = (end: number): number => {
          if (distance(at(segment.a, segment.b, end), member.point) <= radius) return end;
          let inside = member.t,
            outside = end;
          // Keep the inside bound to avoid turning a radius equality into an out-of-radius member.
          for (let step = 0; step < 36; step++) {
            const mid = (inside + outside) / 2;
            if (distance(at(segment.a, segment.b, mid), member.point) <= radius) inside = mid;
            else outside = mid;
          }
          return inside;
        };
        const lo = boundary(0),
          hi = boundary(1);
        boundaries.push(lo, hi);
        add(lo, "coverage-boundary");
        add(hi, "coverage-boundary");
        const firstSample = Math.ceil((lo * length) / options.sampleStepMeters);
        const lastSample = Math.floor((hi * length) / options.sampleStepMeters);
        if (!Number.isSafeInteger(firstSample) || !Number.isSafeInteger(lastSample)) throw LIMIT;
        for (let n = firstSample; n <= lastSample; n++) add((n * options.sampleStepMeters) / length, "sample");
      }
      boundaries.sort((a, b) => a - b);
      for (let n = 1; n < boundaries.length; n++) add((boundaries[n - 1] + boundaries[n]) / 2, "coverage-midpoint");
      add(0, "endpoint");
      add(1, "endpoint");
      for (const [t, sources] of [...proposals].sort(([a], [b]) => a - b)) {
        const position = at(segment.a, segment.b, t);
        const covered: string[] = [];
        let maxDistanceMeters = 0;
        for (const member of members) {
          const meters = distance(position, member.point);
          if (meters <= radius) {
            covered.push(member.point.id);
            maxDistanceMeters = Math.max(maxDistanceMeters, meters);
          }
        }
        if (!covered.length) continue;
        if (result.candidates.length >= options.maxCandidates) throw LIMIT;
        result.candidates.push({ id: `${segment.ref.id}@${t}`, position, segment: segment.ref, t, sources: [...sources].sort(compare), pointIds: covered, maxDistanceMeters });
      }
    }
  } catch (error) {
    if (error !== LIMIT) throw error;
    stats.limitReached = true;
  }

  input.onPhase?.("grouping");
  const free = new Set(points.map((p) => p.id));
  const byId = new Map(points.map((p) => [p.id, p]));
  const defaults = new Map(result.defaultAnchors.map((a) => [a.seedPointId, a]));
  try {
    while (free.size) {
      let best: AnchorCandidate | undefined;
      let selected: string[] = [];
      for (const candidate of result.candidates) {
        const uncovered = candidate.pointIds.filter((id) => {
          spend("groupChecks", options.maxGroupChecks);
          return free.has(id);
        });
        if (uncovered.length > selected.length || (uncovered.length && uncovered.length === selected.length && best && candidate.maxDistanceMeters < best.maxDistanceMeters)) {
          best = candidate;
          selected = uncovered;
        }
      }
      if (!best || !selected.length) break;
      const chosen = best;
      const seedPointId = selected.find((id) => defaults.get(id)?.position && samePosition(defaults.get(id)!.position!, chosen.position)) ?? selected[0];
      const defaultVehicleStop = defaults.get(seedPointId)?.position;
      if (!defaultVehicleStop) break;
      result.groups.push({
        candidateId: best.id,
        seedPointId,
        defaultVehicleStop,
        vehicleStop: best.position,
        vehicleStopIsDefault: samePosition(defaultVehicleStop, best.position),
        pointIds: selected,
        packageCount: selected.reduce((sum, id) => sum + byId.get(id)!.packageCount, 0),
      });
      selected.forEach((id) => free.delete(id));
    }
  } catch (error) {
    if (error !== LIMIT) throw error;
    stats.limitReached = true;
  }
  result.pending = [...free].map((pointId) => ({ pointId, reason: stats.limitReached ? "search-limit" : "no-candidate-in-radius" }));
  result.status = stats.limitReached || result.pending.length ? "partial" : "complete";
  input.onPhase?.("complete");
  return result;
};
