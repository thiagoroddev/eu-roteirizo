/**
 * utils/routing/overview.ts - Pure derivations for the roteiro OVERVIEW panel
 * (TASK-RF-006.8): construction progress and the next-stop suggestion preview.
 *
 * Both are compositions of existing selectors — no new business rules here.
 * `nextStopSuggestion` is the page's "Prévia de parada" mold (seed + radius
 * candidates in the default walking sweep) parameterized by the reducer's own
 * suggested target instead of a tapped orphan.
 */

import type { DeliveryPoint, LatLng } from "../../types/routing";
import type { RoadGraph } from "./graph";
import type { RouteBuilderState } from "./builder";
import { remainingCounts, suggestedNextPointId, suggestionCandidates, suggestionOrigin } from "./builder";
import { totalPoints, totalPackages, assignedPointIds, pointsWithinRadius, indexPointsById } from "./selectors";
import { suggestVehicleStop } from "./vehicleStop";
import { nearestByVehicleGraph } from "./suggestion";
import { nearestFirstOrder } from "./walkOrder";

export interface RouteProgress {
  addressesDone: number;
  addressesTotal: number;
  packagesDone: number;
  packagesTotal: number;
  /** Number of confirmed stops (RF-006.20's "PARADAS" stat card). */
  stopsCount: number;
  /** 0..1 — ADDRESSES are the base of the bar (decision 09/07): they are the
      unit the roteiro is built in. The cards still show both counts. */
  ratio: number;
}

/** Construction progress: committed vs total. There is no "done" selector in
    the builder — done is the complement of `remainingCounts` by design. */
export const routeProgress = (state: RouteBuilderState): RouteProgress => {
  const ignored = new Set(state.ignoredPointIds ?? []);
  const activePoints = state.points.filter((p) => !ignored.has(p.id));
  const addressesTotal = totalPoints(activePoints);
  const packagesTotal = totalPackages(activePoints);
  const remaining = remainingCounts(state);
  const addressesDone = addressesTotal - remaining.addresses;
  const packagesDone = packagesTotal - remaining.packages;
  return {
    addressesDone,
    addressesTotal,
    packagesDone,
    packagesTotal,
    stopsCount: state.stops.length,
    ratio: addressesTotal === 0 ? 0 : addressesDone / addressesTotal,
  };
};

export interface NextStopSuggestion {
  /** The reducer's suggested target (nearest free point from the origin). */
  seed: DeliveryPoint;
  /** Where the vehicle would park (street-projected when the graph is loaded). */
  anchor: LatLng;
  /** Seed + default-radius candidates, in the default walking sweep. */
  points: DeliveryPoint[];
  /** Sequence number: the suggestion CONTINUES the route (stops.length + 1). */
  order: number;
}

/**
 * The seed for the next stop (TASK-RF-006.12): the free candidate nearest the
 * suggestion origin RESPECTING ONE-WAY, over the directed vehicle graph — so the
 * suggestion never points at a spot "close in a straight line but far by the
 * street sense". Falls back to `suggestedNextPointId`'s straight-line pick
 * without a graph, and a valid manual override always wins.
 */
export const suggestedNextSeed = (state: RouteBuilderState, graph: RoadGraph | null): string | null => {
  const straight = suggestedNextPointId(state);
  if (straight === null || !graph || state.nextSuggestionOverride === straight) return straight;

  const origin = suggestionOrigin(state);
  const candidates = suggestionCandidates(state);
  return origin && candidates.length > 0 ? nearestByVehicleGraph(graph, origin, candidates) : straight;
};

/**
 * How the NEXT stop would look if created now (overview's third section):
 * seeded by `suggestedNextSeed` (one-way aware — RF-006.12), aggregating the
 * free points inside the default radius — the same preview the tapped-orphan
 * flow shows (tela 8). Null before a start exists or when every point is
 * committed. `seedId` is injectable so the page computes the seed once and
 * shares it with the drawn suggestion line.
 */
export const nextStopSuggestion = (state: RouteBuilderState, graph: RoadGraph | null, seedId: string | null = suggestedNextSeed(state, graph)): NextStopSuggestion | null => {
  if (seedId === null) return null;
  const seed = state.points.find((p) => p.id === seedId);
  if (!seed) return null;

  const assigned = assignedPointIds(state.stops);
  const candidates = pointsWithinRadius(seed, state.points, state.config.autoRadiusMeters).filter((p) => p.id !== seed.id && !assigned.has(p.id));
  const members = [seed, ...candidates];
  /** The anchor the stop would be BORN with: projected directly in front of the seed (RF-52). */
  const anchor = suggestVehicleStop(graph, seed);
  const byId = indexPointsById(members);
  const ordered = nearestFirstOrder(anchor, members, false, seed.id)
    .map((id) => byId.get(id))
    .filter((p): p is DeliveryPoint => p !== undefined);

  return { seed, anchor, points: ordered, order: state.stops.length + 1 };
};
