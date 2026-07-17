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
import { remainingCounts, suggestedNextPointId, previousAnchorOrigin } from "./builder";
import { totalPoints, totalPackages, assignedPointIds, pointsWithinRadius, indexPointsById } from "./selectors";
import { suggestVehicleStop, defaultAnchorSeed } from "./vehicleStop";
import { nearestFirstOrder } from "./walkOrder";

export interface RouteProgress {
  addressesDone: number;
  addressesTotal: number;
  packagesDone: number;
  packagesTotal: number;
  /** 0..1 — ADDRESSES are the base of the bar (decision 09/07): they are the
      unit the roteiro is built in. The cards still show both counts. */
  ratio: number;
}

/** Construction progress: committed vs total. There is no "done" selector in
    the builder — done is the complement of `remainingCounts` by design. */
export const routeProgress = (state: RouteBuilderState): RouteProgress => {
  const addressesTotal = totalPoints(state.points);
  const packagesTotal = totalPackages(state.points);
  const remaining = remainingCounts(state);
  const addressesDone = addressesTotal - remaining.addresses;
  const packagesDone = packagesTotal - remaining.packages;
  return {
    addressesDone,
    addressesTotal,
    packagesDone,
    packagesTotal,
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
 * How the NEXT stop would look if created now (overview's third section):
 * seeded by `suggestedNextPointId`, aggregating the free points inside the
 * default radius — the same preview the tapped-orphan flow shows (tela 8).
 * Null before a start exists or when every point is committed.
 */
export const nextStopSuggestion = (state: RouteBuilderState, graph: RoadGraph | null): NextStopSuggestion | null => {
  const seedId = suggestedNextPointId(state);
  if (seedId === null) return null;
  const seed = state.points.find((p) => p.id === seedId);
  if (!seed) return null;

  const assigned = assignedPointIds(state.stops);
  const candidates = pointsWithinRadius(seed, state.points, state.config.autoRadiusMeters).filter((p) => p.id !== seed.id && !assigned.has(p.id));
  const members = [seed, ...candidates];
  /** The anchor the stop would be BORN with (RF-006.6): the member nearest to
      where the vehicle comes from — the same rule `handleCreateStop` commits
      and `RESET_STOP_ANCHOR` restores. */
  const anchorSeed = defaultAnchorSeed(members, previousAnchorOrigin(state, null)) ?? seed;
  const anchor = suggestVehicleStop(graph, anchorSeed);
  const byId = indexPointsById(members);
  const ordered = nearestFirstOrder(anchor, members, false)
    .map((id) => byId.get(id))
    .filter((p): p is DeliveryPoint => p !== undefined);

  return { seed, anchor, points: ordered, order: state.stops.length + 1 };
};
