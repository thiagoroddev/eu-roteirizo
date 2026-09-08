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
import { nearestFirstOrder } from "./walkOrder";
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
   *  caller may silently re-project the anchor when the road graph arrives.
   *  Also gates the "Resetar âncora" button (RF-006.6). */
  vehicleStopIsDefault: boolean;
  /** Walking SENSE (RF-006.6): false = clockwise sweep, true = counter-clockwise.
   *  A property, not an act — every re-sweep (anchor moved/made/reset, member
   *  added or removed) preserves it. There is no manual ordering. */
  reversed: boolean;
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
  | { type: "CLEAR_START" }
  | { type: "SET_NEXT_SUGGESTION"; pointId: string | null }
  | { type: "OPEN_STOP_DRAFT"; seedPointId: string; suggestedVehicleStop: LatLng }
  | { type: "CREATE_STOP"; seedPointId: string; memberIds: string[]; vehicleStop: LatLng; radiusMeters: number; targetOrder?: number }
  | { type: "REORDER_STOP"; stopId: string; targetOrder: number }
  | { type: "REOPEN_STOP"; stopId: string }
  | { type: "SET_DRAFT_RADIUS"; radiusMeters: number }
  | { type: "TOGGLE_DRAFT_POINT"; pointId: string }
  | { type: "MOVE_VEHICLE_STOP"; position: LatLng }
  | { type: "MAKE_POINT_ANCHOR"; pointId: string }
  | { type: "RESET_VEHICLE_STOP"; suggestedVehicleStop: LatLng }
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

/**
 * The walking order of a set of points around an anchor, honoring the SENSE
 * (RF-006.6/.17): the NEAREST address to the anchor is 1st and `reversed` picks
 * the sweep sense (see `nearestFirstOrder`). Every order in this reducer goes
 * through here — the order is DERIVED, always (anchor + sense are its only two
 * inputs; there is no manual reordering).
 */
const sweepWithSense = (anchor: LatLng, points: DeliveryPoint[], reversed: boolean): string[] => nearestFirstOrder(anchor, points, reversed);

/** Re-sweeps the draft's walking order from its (possibly new) anchor, keeping the sense. */
const resweepDraft = (state: RouteBuilderState, draft: StopDraft): StopDraft => ({
  ...draft,
  pointIds: sweepWithSense(draft.vehicleStop, draftPoints(state, draft.pointIds), draft.reversed),
});

export const routeBuilderReducer = (state: RouteBuilderState, action: RouteBuilderAction): RouteBuilderState => {
  switch (action.type) {
    case "SET_START":
      return { ...state, startPoint: action.position };

    /** "Apagar início" (TASK-RF-006.14): drops the start entirely — its marker
     *  disappears and the panel returns to the definition flow. Every origin
     *  selector already degrades without a start (suggestion falls back to the
     *  last stop, then null), so no cleanup is needed here. */
    case "CLEAR_START":
      return { ...state, startPoint: null };

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
        reversed: false,
      };
      return { ...state, draft };
    }

    case "CREATE_STOP": {
      /** Commit-on-create (RF-006.4.6): the seed + its radius members become a
       *  firmed stop directly — no draft. Reverses §8 "candidates by choice":
       *  what the radius showed enters as members; the user refines later via
       *  REOPEN (radius + list ±). The walking order sweeps from the anchor. */
      const seed = state.points.find((p) => p.id === action.seedPointId);
      const assigned = idsAssignedElsewhere(state.stops, null);
      if (!seed || assigned.has(seed.id)) return state;
      const stopId = `stop_${seed.id}`;
      if (state.stops.some((s) => s.id === stopId)) return state;
      const byId = indexPointsById(state.points);
      /** Seed first, then the radius members; de-duped and filtered to free, known points. */
      const memberIds = [seed.id, ...action.memberIds].filter((id, i, arr) => arr.indexOf(id) === i && byId.has(id) && !assigned.has(id));
      const pointIds = sweepWithSense(action.vehicleStop, draftPoints(state, memberIds), false);
      /** Born clockwise and at the DEFAULT anchor: the caller passes the
       *  `defaultAnchorSeed` projection, so "Resetar âncora" stays hidden until
       *  the user actually moves it (RF-006.6). */
      const committed: RouteStop = { id: stopId, order: 0, vehicleStop: action.vehicleStop, pointIds, radiusMeters: Math.max(0, action.radiusMeters), reversed: false, vehicleStopIsDefault: true };
      let stops: RouteStop[];
      if (typeof action.targetOrder === "number" && action.targetOrder >= 1 && action.targetOrder <= state.stops.length) {
        const targetIndex = action.targetOrder - 1;
        stops = [...state.stops.slice(0, targetIndex), committed, ...state.stops.slice(targetIndex)];
      } else {
        stops = [...state.stops, committed];
      }
      return { ...state, stops: normalizeOrders(stops), nextSuggestionOverride: null };
    }

    case "REORDER_STOP": {
      const currentIndex = state.stops.findIndex((s) => s.id === action.stopId);
      if (currentIndex === -1) return state;
      const targetIndex = action.targetOrder - 1;
      if (targetIndex < 0 || targetIndex >= state.stops.length || targetIndex === currentIndex) {
        return state;
      }
      const stopToMove = state.stops[currentIndex];
      const withoutStop = state.stops.filter((_, i) => i !== currentIndex);
      const reordered = [...withoutStop.slice(0, targetIndex), stopToMove, ...withoutStop.slice(targetIndex)];
      return { ...state, stops: normalizeOrders(reordered) };
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
        /** The stop's own flags carry into the edit (RF-006.6): the sense and
         *  whether the anchor is still the default belong to the STOP, so the
         *  draft must not invent them (it used to force `false`, which hid the
         *  reset button's condition and dropped the sense on the next sweep). */
        vehicleStopIsDefault: stop.vehicleStopIsDefault ?? true,
        reversed: stop.reversed ?? false,
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
      /** The order is always derived: a new member takes its place in the sweep
       *  (RF-006.6 — the old "append when manual" branch died with manual order). */
      return { ...state, draft: resweepDraft(state, { ...draft, pointIds: [...draft.pointIds, point.id] }) };
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

    /** "Inverter ordem" (RF-006.6/.17): flips the walking SENSE. It RE-SWEEPS
     *  with the toggled flag — a plain array reverse would drop the nearest
     *  address from 1st, which the nearest-first order must keep (RF-006.17).
     *  The flag is what makes the sense survive the next anchor move.
     *
     *  Anchor editing (move/make-anchor/reset/reverse) lives ONLY in the draft
     *  (TASK-RF-006.15 — "editar = reabrir como rascunho"): the committed-stop
     *  variants of these actions were removed. A firmed stop is read-only until
     *  reopened. */
    case "REVERSE_DRAFT_ORDER": {
      if (!state.draft) return state;
      return { ...state, draft: resweepDraft(state, { ...state.draft, reversed: !state.draft.reversed }) };
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
        /** The sense and the anchor's default-ness belong to the STOP (RF-006.6). */
        reversed: draft.reversed,
        vehicleStopIsDefault: draft.vehicleStopIsDefault,
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
      /** Incorporating an orphan re-sweeps that stop's walking order, keeping
       *  its sense (fluxo §6; RF-006.6). The anchor does NOT move (§9). */
      const pointIds = sweepWithSense(stop.vehicleStop, draftPoints(state, [...stop.pointIds, point.id]), stop.reversed ?? false);
      const stops = state.stops.map((s) => (s.id === stop.id ? { ...s, pointIds } : s));
      return { ...state, stops };
    }

    case "HYDRATE": {
      const byId = indexPointsById(state.points);
      /** Defensive: drop ids the current spreadsheet doesn't have, then empty
       *  stops. Fields added later default here (RF-006.6): routes saved before
       *  the sense/default-anchor flags read as clockwise, anchor-as-the-app-put-it. */
      const stops = action.route.stops
        .map((s) => ({ ...s, pointIds: s.pointIds.filter((id) => byId.has(id)), reversed: s.reversed ?? false, vehicleStopIsDefault: s.vehicleStopIsDefault ?? true }))
        .filter((s) => s.pointIds.length > 0);
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

/** Ids of the points inside the open draft's radius circle (around the SEED). */
const idsWithinDraftRadius = (state: RouteBuilderState): Set<string> => {
  const { draft } = state;
  if (!draft) return new Set();
  const seed = state.points.find((p) => p.id === draft.seedPointId);
  if (!seed) return new Set();
  return new Set(pointsWithinRadius(seed, state.points, draft.radiusMeters).map((p) => p.id));
};

/**
 * Candidate ids the radius suggests for the open draft (fluxo §8): unassigned
 * points within `radiusMeters` of the SEED address, not yet chosen. Empty
 * without a draft. The user opts each one in via TOGGLE_DRAFT_POINT.
 */
export const draftCandidateIds = (state: RouteBuilderState): string[] => {
  const { draft } = state;
  if (!draft) return [];
  const inRadius = idsWithinDraftRadius(state);
  const taken = idsAssignedElsewhere(state.stops, draft.stopId);
  return state.points.filter((p) => inRadius.has(p.id) && !taken.has(p.id) && !draft.pointIds.includes(p.id)).map((p) => p.id);
};

/** How far a chosen point can sit from the anchor before the soft warning (RN-17). */
export const FAR_POINT_RADIUS_FACTOR = 2;
export const FAR_POINT_MIN_METERS = 150;

/**
 * Chosen draft points that sit suspiciously far from the anchor (RN-17): beyond
 * max(2 × radius, 150 m). Feeds the SOFT warning — inclusion is never blocked.
 */
export const farChosenPointIds = (state: RouteBuilderState): string[] => {
  const { draft } = state;
  if (!draft) return [];
  const threshold = Math.max(FAR_POINT_RADIUS_FACTOR * draft.radiusMeters, FAR_POINT_MIN_METERS);
  return draftPoints(state, draft.pointIds)
    .filter((p) => haversine(draft.vehicleStop, p) > threshold)
    .map((p) => p.id);
};

/**
 * Where the vehicle currently "is" — the origin both the suggestion RANK and
 * the drawn suggestion line depart from (fluxo §6: draft's anchor, else the
 * last stop's anchor, else the start point). Null before a start is chosen.
 */
export const suggestionOrigin = (state: RouteBuilderState): LatLng | null => state.draft?.vehicleStop ?? (state.stops.length > 0 ? state.stops[state.stops.length - 1].vehicleStop : state.startPoint);

/**
 * Where the vehicle COMES FROM for a given stop (TASK-RF-006.6): the anchor of
 * the stop before it in the route, or the start point for the first one. Feeds
 * `defaultAnchorSeed` — the default anchor is the stop's address nearest to
 * this origin. Null when there is no previous stop and no start yet.
 *
 * @param stopId - A committed stop's id; an id being drafted (or unknown, i.e.
 *                 a stop not yet created) falls back to the LAST stop's anchor,
 *                 which is where the vehicle would arrive from.
 */
export const previousAnchorOrigin = (state: RouteBuilderState, stopId: string | null): LatLng | null => {
  const index = stopId !== null ? state.stops.findIndex((s) => s.id === stopId) : -1;
  if (index === -1) return state.stops.length > 0 ? state.stops[state.stops.length - 1].vehicleStop : state.startPoint;
  return index === 0 ? state.startPoint : state.stops[index - 1].vehicleStop;
};

/**
 * The free points eligible to SEED the next stop (fluxo §4 passo 2 / §6):
 * unassigned, not in the open draft, and — while drafting — OUTSIDE its radius
 * (those inside are the draft's candidates, not the next stop). Pure, no graph —
 * the graph-aware rank (RF-006.12) lives in `overview.suggestedNextSeed`.
 */
export const suggestionCandidates = (state: RouteBuilderState): DeliveryPoint[] => {
  const inRadius = idsWithinDraftRadius(state);
  return unassignedPoints(state.points, state.stops).filter((p) => !state.draft?.pointIds.includes(p.id) && !inRadius.has(p.id));
};

/**
 * The point the next-stop suggestion should target (fluxo §4 passo 2): a valid
 * manual override wins; otherwise the nearest free point by STRAIGHT LINE from
 * the suggestion origin. This is the graph-free base — respecting the street
 * sense (one-way) is `overview.suggestedNextSeed` (RF-006.12), which re-ranks
 * these candidates over the directed graph. Null before a start or when empty.
 */
export const suggestedNextPointId = (state: RouteBuilderState): string | null => {
  const free = suggestionCandidates(state);
  if (free.length === 0) return null;

  if (state.nextSuggestionOverride !== null && free.some((p) => p.id === state.nextSuggestionOverride)) {
    return state.nextSuggestionOverride;
  }

  const origin = suggestionOrigin(state);
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
