/**
 * utils/routing/builder.ts - Pure state machine for building a route ("Meu roteiro").
 *
 * Implements the construction flow of fluxo-roteirizacao.md §4 (draft stop with
 * chosen candidates, movable vehicle stop, commit/reopen) as a plain reducer, so
 * every context panel of §10.10 is a projection of this state. Design rules:
 *
 * - MAP MATCHING STAYS OUTSIDE: actions that depend on the road graph receive the
 *   already-resolved LatLng (see vehicleStop.ts); the graph never enters the state,
 *   keeping the reducer synchronous and trivially testable.
 * - CANDIDATES ARE DERIVED, not state: the radius only suggests (§8/§10); chosen
 *   points live in `draft.pointIds`.
 * - NO COMPLETENESS GATE anywhere (RF-33): saving is free; `isComplete` only feeds
 *   the "Iniciar rota" button (RF-009).
 * - EDITING = REOPEN AS DRAFT: a committed stop is edited by reopening it into the
 *   draft (single editing path); commit puts it back in place, preserving `order`.
 */

import type { DeliveryPoint, LatLng, PlannedRoute, RouteStop, RoutingConfig } from "../../types/routing";
import { DEFAULT_ROUTING_CONFIG } from "../../types/routing";
import { haversine } from "./geo";
import { sweepWalkingOrder } from "./walkOrder";
import { indexPointsById, pointsWithinRadius, unassignedPoints } from "./selectors";

/** The stop being created or edited (rendered faded on the map — fluxo §4). */
export interface StopDraft {
  /** Reused when reopening an existing stop; fresh (`stop_<seed>`) otherwise. */
  stopId: string;
  /** The tapped address that opened the draft; center of the radius circle. */
  seedPointId: string;
  /** Chosen points, in walking-visit order. */
  pointIds: string[];
  radiusMeters: number;
  vehicleStop: LatLng;
  /** False after move/make-anchor; true again after reset. While true, the
   *  caller may silently re-project the anchor when the road graph arrives. */
  vehicleStopIsDefault: boolean;
  /** True after a manual reorder/reverse; cleared whenever the anchor moves
   *  (moving always re-sweeps the walking order — fluxo §6). */
  orderIsManual: boolean;
}

export interface RouteBuilderState {
  routeId: string;
  createdAt: string;
  /** Immutable source data (buildDeliveryPoints over the spreadsheet rows). */
  points: DeliveryPoint[];
  startPoint: LatLng | null;
  /** Committed stops; `order` is always contiguous 1..n. */
  stops: RouteStop[];
  draft: StopDraft | null;
  /** Point id the user pointed the next-stop suggestion at; null = automatic. */
  nextSuggestionOverride: string | null;
  config: RoutingConfig;
}

export type RouteBuilderAction =
  | { type: "SET_START"; position: LatLng }
  | { type: "SET_NEXT_SUGGESTION"; pointId: string | null }
  | { type: "OPEN_STOP_DRAFT"; seedPointId: string; suggestedVehicleStop: LatLng }
  | { type: "REOPEN_STOP"; stopId: string }
  | { type: "SET_DRAFT_RADIUS"; radiusMeters: number }
  | { type: "TOGGLE_DRAFT_POINT"; pointId: string }
  | { type: "MOVE_VEHICLE_STOP"; position: LatLng }
  | { type: "MAKE_POINT_ANCHOR"; pointId: string }
  | { type: "RESET_VEHICLE_STOP"; suggestedVehicleStop: LatLng }
  | { type: "REORDER_DRAFT_POINT"; pointId: string; toIndex: number }
  | { type: "REVERSE_DRAFT_ORDER" }
  | { type: "COMMIT_STOP" }
  | { type: "CANCEL_DRAFT" }
  | { type: "DISSOLVE_STOP"; stopId: string }
  | { type: "ADD_POINT_TO_STOP"; stopId: string; pointId: string }
  | { type: "HYDRATE"; route: PlannedRoute }
  | { type: "RESET" };

/**
 * Fresh builder state over the imported points. `init` pins id/timestamp for
 * deterministic tests and for RF-008 (which owns route identity on hydrate).
 */
export const createInitialBuilderState = (points: DeliveryPoint[], config: RoutingConfig = DEFAULT_ROUTING_CONFIG, init?: { routeId?: string; createdAt?: string }): RouteBuilderState => ({
  routeId: init?.routeId ?? `route_${Date.now().toString(36)}`,
  createdAt: init?.createdAt ?? new Date().toISOString(),
  points,
  startPoint: null,
  stops: [],
  draft: null,
  nextSuggestionOverride: null,
  config,
});

/** Keeps `order` contiguous 1..n after any insertion/removal. */
const normalizeOrders = (stops: RouteStop[]): RouteStop[] => stops.map((stop, index) => (stop.order === index + 1 ? stop : { ...stop, order: index + 1 }));

/** Ids assigned to any stop other than `excludeStopId` (a point lives in ONE stop). */
const idsAssignedElsewhere = (stops: RouteStop[], excludeStopId: string | null): Set<string> => {
  const ids = new Set<string>();
  for (const stop of stops) {
    if (stop.id === excludeStopId) continue;
    for (const id of stop.pointIds) ids.add(id);
  }
  return ids;
};

/** Resolves draft point ids to points (drops unknown ids defensively). */
const draftPoints = (state: RouteBuilderState, pointIds: string[]): DeliveryPoint[] => {
  const byId = indexPointsById(state.points);
  return pointIds.map((id) => byId.get(id)).filter((p): p is DeliveryPoint => p !== undefined);
};

/** Re-sweeps the draft's walking order from its (possibly new) anchor. */
const resweepDraft = (state: RouteBuilderState, draft: StopDraft): StopDraft => ({
  ...draft,
  pointIds: sweepWalkingOrder(draft.vehicleStop, draftPoints(state, draft.pointIds)),
  orderIsManual: false,
});

export const routeBuilderReducer = (state: RouteBuilderState, action: RouteBuilderAction): RouteBuilderState => {
  switch (action.type) {
    case "SET_START":
      return { ...state, startPoint: action.position };

    case "SET_NEXT_SUGGESTION":
      return { ...state, nextSuggestionOverride: action.pointId };

    case "OPEN_STOP_DRAFT": {
      if (state.draft) return state;
      const seed = state.points.find((p) => p.id === action.seedPointId);
      if (!seed || idsAssignedElsewhere(state.stops, null).has(seed.id)) return state;
      const draft: StopDraft = {
        stopId: `stop_${seed.id}`,
        seedPointId: seed.id,
        pointIds: [seed.id],
        radiusMeters: state.config.autoRadiusMeters,
        vehicleStop: action.suggestedVehicleStop,
        vehicleStopIsDefault: true,
        orderIsManual: false,
      };
      return { ...state, draft };
    }

    case "REOPEN_STOP": {
      if (state.draft) return state;
      const stop = state.stops.find((s) => s.id === action.stopId);
      if (!stop || stop.pointIds.length === 0) return state;
      const draft: StopDraft = {
        stopId: stop.id,
        seedPointId: stop.pointIds[0],
        pointIds: stop.pointIds,
        radiusMeters: stop.radiusMeters,
        vehicleStop: stop.vehicleStop,
        /** The stored anchor may have been moved by the user — never re-project it. */
        vehicleStopIsDefault: false,
        orderIsManual: false,
      };
      return { ...state, draft };
    }

    case "SET_DRAFT_RADIUS": {
      if (!state.draft) return state;
      return { ...state, draft: { ...state.draft, radiusMeters: Math.max(0, action.radiusMeters) } };
    }

    case "TOGGLE_DRAFT_POINT": {
      const { draft } = state;
      if (!draft) return state;
      if (draft.pointIds.includes(action.pointId)) {
        return { ...state, draft: { ...draft, pointIds: draft.pointIds.filter((id) => id !== action.pointId) } };
      }
      const point = state.points.find((p) => p.id === action.pointId);
      if (!point || idsAssignedElsewhere(state.stops, draft.stopId).has(point.id)) return state;
      const grown = { ...draft, pointIds: [...draft.pointIds, point.id] };
      /** A manual order is respected (append); otherwise keep the default sweep. */
      return { ...state, draft: grown.orderIsManual ? grown : resweepDraft(state, grown) };
    }

    case "MOVE_VEHICLE_STOP": {
      if (!state.draft) return state;
      const moved: StopDraft = { ...state.draft, vehicleStop: action.position, vehicleStopIsDefault: false };
      return { ...state, draft: resweepDraft(state, moved) };
    }

    case "MAKE_POINT_ANCHOR": {
      const { draft } = state;
      if (!draft || !draft.pointIds.includes(action.pointId)) return state;
      const point = state.points.find((p) => p.id === action.pointId);
      if (!point) return state;
      const anchored: StopDraft = { ...draft, vehicleStop: { lat: point.lat, lng: point.lng }, vehicleStopIsDefault: false };
      return { ...state, draft: resweepDraft(state, anchored) };
    }

    case "RESET_VEHICLE_STOP": {
      if (!state.draft) return state;
      const reset: StopDraft = { ...state.draft, vehicleStop: action.suggestedVehicleStop, vehicleStopIsDefault: true };
      return { ...state, draft: resweepDraft(state, reset) };
    }

    case "REORDER_DRAFT_POINT": {
      const { draft } = state;
      if (!draft) return state;
      const from = draft.pointIds.indexOf(action.pointId);
      if (from === -1) return state;
      const to = Math.max(0, Math.min(draft.pointIds.length - 1, action.toIndex));
      const pointIds = [...draft.pointIds];
      pointIds.splice(to, 0, ...pointIds.splice(from, 1));
      return { ...state, draft: { ...draft, pointIds, orderIsManual: true } };
    }

    case "REVERSE_DRAFT_ORDER": {
      if (!state.draft) return state;
      return { ...state, draft: { ...state.draft, pointIds: [...state.draft.pointIds].reverse(), orderIsManual: true } };
    }

    case "COMMIT_STOP": {
      const { draft } = state;
      if (!draft) return state;
      /** Defensive: a point grabbed by another stop meanwhile can't be committed twice. */
      const taken = idsAssignedElsewhere(state.stops, draft.stopId);
      const pointIds = draft.pointIds.filter((id) => !taken.has(id));
      if (pointIds.length === 0) return state;
      const committed: RouteStop = {
        id: draft.stopId,
        order: 0, // normalized below
        vehicleStop: draft.vehicleStop,
        pointIds,
        radiusMeters: draft.radiusMeters,
      };
      const existingIndex = state.stops.findIndex((s) => s.id === draft.stopId);
      const stops = existingIndex === -1 ? [...state.stops, committed] : state.stops.map((s, i) => (i === existingIndex ? committed : s));
      return { ...state, stops: normalizeOrders(stops), draft: null, nextSuggestionOverride: null };
    }

    case "CANCEL_DRAFT":
      return state.draft ? { ...state, draft: null } : state;

    case "DISSOLVE_STOP": {
      const stops = state.stops.filter((s) => s.id !== action.stopId);
      if (stops.length === state.stops.length) return state;
      /** Dissolving the stop being edited also drops its draft. */
      const draft = state.draft?.stopId === action.stopId ? null : state.draft;
      return { ...state, stops: normalizeOrders(stops), draft };
    }

    case "ADD_POINT_TO_STOP": {
      const stop = state.stops.find((s) => s.id === action.stopId);
      const point = state.points.find((p) => p.id === action.pointId);
      if (!stop || !point) return state;
      if (idsAssignedElsewhere(state.stops, null).has(point.id)) return state;
      if (state.draft?.pointIds.includes(point.id)) return state;
      /** Incorporating an orphan re-sweeps that stop's walking order (fluxo §6). */
      const pointIds = sweepWalkingOrder(stop.vehicleStop, draftPoints(state, [...stop.pointIds, point.id]));
      const stops = state.stops.map((s) => (s.id === stop.id ? { ...s, pointIds } : s));
      return { ...state, stops };
    }

    case "HYDRATE": {
      const byId = indexPointsById(state.points);
      /** Defensive: drop ids the current spreadsheet doesn't have, then empty stops. */
      const stops = action.route.stops.map((s) => ({ ...s, pointIds: s.pointIds.filter((id) => byId.has(id)) })).filter((s) => s.pointIds.length > 0);
      return {
        ...state,
        routeId: action.route.id,
        createdAt: action.route.createdAt,
        startPoint: action.route.startPoint,
        stops: normalizeOrders(stops),
        draft: null,
        nextSuggestionOverride: null,
        config: action.route.config,
      };
    }

    case "RESET":
      /** Start construction over; route identity and config survive (RN-21: the roteiro of this rota). */
      return { ...state, startPoint: null, stops: [], draft: null, nextSuggestionOverride: null };
  }
};

/* ------------------------------- selectors ------------------------------- */

/**
 * Candidate ids the radius suggests for the open draft (fluxo §8): unassigned
 * points within `radiusMeters` of the SEED address, not yet chosen. Empty
 * without a draft. The user opts each one in via TOGGLE_DRAFT_POINT.
 */
export const draftCandidateIds = (state: RouteBuilderState): string[] => {
  const { draft } = state;
  if (!draft) return [];
  const seed = state.points.find((p) => p.id === draft.seedPointId);
  if (!seed) return [];
  const taken = idsAssignedElsewhere(state.stops, draft.stopId);
  return pointsWithinRadius(seed, state.points, draft.radiusMeters)
    .filter((p) => !taken.has(p.id) && !draft.pointIds.includes(p.id))
    .map((p) => p.id);
};

/**
 * The point the next-stop suggestion should target (fluxo §4 passo 2): a valid
 * manual override wins; otherwise the nearest free point (haversine) from where
 * the vehicle currently "is" — the draft's anchor, else the last stop's anchor,
 * else the start. Null before a start is chosen or when nothing is left.
 */
export const suggestedNextPointId = (state: RouteBuilderState): string | null => {
  const free = unassignedPoints(state.points, state.stops).filter((p) => !state.draft?.pointIds.includes(p.id));
  if (free.length === 0) return null;

  if (state.nextSuggestionOverride !== null && free.some((p) => p.id === state.nextSuggestionOverride)) {
    return state.nextSuggestionOverride;
  }

  const origin = state.draft?.vehicleStop ?? (state.stops.length > 0 ? state.stops[state.stops.length - 1].vehicleStop : state.startPoint);
  if (!origin) return null;

  let best = free[0];
  let bestDistance = haversine(origin, best);
  for (const point of free.slice(1)) {
    const distance = haversine(origin, point);
    if (distance < bestDistance) {
      best = point;
      bestDistance = distance;
    }
  }
  return best.id;
};

/** HUD counters (RF-32): addresses/packages not yet in a COMMITTED stop. */
export const remainingCounts = (state: RouteBuilderState): { addresses: number; packages: number } => {
  const free = unassignedPoints(state.points, state.stops);
  return { addresses: free.length, packages: free.reduce((sum, p) => sum + p.packageCount, 0) };
};

/**
 * True when every point is committed to a stop and nothing is being edited.
 * Gates ONLY the "Iniciar rota" button (RF-009) — never saving (RF-33).
 */
export const isComplete = (state: RouteBuilderState): boolean => state.draft === null && state.stops.length > 0 && unassignedPoints(state.points, state.stops).length === 0;

/** The persistable shape (RF-008/RF-33 bridge; HYDRATE is the way back). */
export const toPlannedRoute = (state: RouteBuilderState): PlannedRoute => ({
  id: state.routeId,
  startPoint: state.startPoint,
  stops: state.stops,
  config: state.config,
  createdAt: state.createdAt,
});
