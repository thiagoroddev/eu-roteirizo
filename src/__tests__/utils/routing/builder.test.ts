import { describe, it, expect } from "vitest";
import {
  createInitialBuilderState,
  routeBuilderReducer,
  draftCandidateIds,
  suggestedNextPointId,
  remainingCounts,
  isComplete,
  toPlannedRoute,
  type RouteBuilderAction,
  type RouteBuilderState,
} from "../../../utils/routing/builder";
import { unassignedPoints } from "../../../utils/routing/selectors";
import type { DeliveryPoint, LatLng } from "../../../types/routing";

const pt = (id: string, lat: number, lng: number, packageCount = 1): DeliveryPoint => ({ id, lat, lng, address: id, packageCount, packages: [] });

/**
 * Geography of the fixture (meters from `a`, which sits at the anchor):
 * - b: ~17 m north of a (inside the default 30 m radius)
 * - e: ~15 m east of a (inside the default radius)
 * - c: ~56 m north of a (outside 30 m, inside 60 m)
 * - d: ~1.5 km away (never a candidate)
 */
const a = pt("a", -22.98, -43.2, 2);
const b = pt("b", -22.97985, -43.2);
const e = pt("e", -22.98, -43.19985);
const c = pt("c", -22.9795, -43.2, 3);
const d = pt("d", -22.99, -43.21);
const POINTS = [a, b, c, d, e];

const START: LatLng = { lat: -22.9801, lng: -43.2001 };

const initial = (): RouteBuilderState => createInitialBuilderState(POINTS, undefined, { routeId: "route_test", createdAt: "2026-07-07T00:00:00.000Z" });

const run = (state: RouteBuilderState, ...actions: RouteBuilderAction[]): RouteBuilderState => actions.reduce(routeBuilderReducer, state);

const openDraftOnA = (state: RouteBuilderState): RouteBuilderState => run(state, { type: "OPEN_STOP_DRAFT", seedPointId: "a", suggestedVehicleStop: { lat: a.lat, lng: a.lng } });

/** Builds a committed stop over a+b, leaving c/d/e free. */
const withStopAB = (state: RouteBuilderState): RouteBuilderState => run(openDraftOnA(state), { type: "TOGGLE_DRAFT_POINT", pointId: "b" }, { type: "COMMIT_STOP" });

describe("createInitialBuilderState", () => {
  it("pins identity from init and starts empty with the default config", () => {
    const state = initial();
    expect(state.routeId).toBe("route_test");
    expect(state.createdAt).toBe("2026-07-07T00:00:00.000Z");
    expect(state.startPoint).toBeNull();
    expect(state.stops).toEqual([]);
    expect(state.draft).toBeNull();
    expect(state.config.autoRadiusMeters).toBe(30);
  });
});

describe("start and next suggestion", () => {
  it("SET_START defines where the route begins", () => {
    const state = run(initial(), { type: "SET_START", position: START });
    expect(state.startPoint).toEqual(START);
  });

  it("suggests nothing before a start exists", () => {
    expect(suggestedNextPointId(initial())).toBeNull();
  });

  it("suggests the nearest free point from the start", () => {
    const state = run(initial(), { type: "SET_START", position: START });
    expect(suggestedNextPointId(state)).toBe("a");
  });

  it("a valid manual override wins; an assigned one falls back to automatic", () => {
    const started = run(initial(), { type: "SET_START", position: START });
    expect(suggestedNextPointId(run(started, { type: "SET_NEXT_SUGGESTION", pointId: "c" }))).toBe("c");
    const overrideOnAssigned = run(withStopAB(started), { type: "SET_NEXT_SUGGESTION", pointId: "b" });
    expect(suggestedNextPointId(overrideOnAssigned)).toBe("e");
  });

  it("after a commit the suggestion departs from the last stop's anchor", () => {
    const state = run(withStopAB(initial()), { type: "SET_START", position: { lat: -22.99, lng: -43.2101 } });
    /** Start is next to d, but the vehicle is parked at a's anchor → e is nearest. */
    expect(suggestedNextPointId(state)).toBe("e");
  });

  it("with an open draft the suggestion departs from the draft anchor and skips its points", () => {
    const state = run(openDraftOnA(initial()), { type: "TOGGLE_DRAFT_POINT", pointId: "e" });
    expect(suggestedNextPointId(state)).toBe("b");
  });
});

describe("stop draft lifecycle", () => {
  it("OPEN_STOP_DRAFT seeds the draft with defaults", () => {
    const state = openDraftOnA(initial());
    expect(state.draft).toMatchObject({
      stopId: "stop_a",
      seedPointId: "a",
      pointIds: ["a"],
      radiusMeters: 30,
      vehicleStopIsDefault: true,
      orderIsManual: false,
    });
  });

  it("is a no-op with a draft already open, an unknown seed or an assigned seed", () => {
    const withDraft = openDraftOnA(initial());
    expect(run(withDraft, { type: "OPEN_STOP_DRAFT", seedPointId: "b", suggestedVehicleStop: { lat: b.lat, lng: b.lng } })).toBe(withDraft);
    const fresh = initial();
    expect(run(fresh, { type: "OPEN_STOP_DRAFT", seedPointId: "nope", suggestedVehicleStop: START })).toBe(fresh);
    const committed = withStopAB(initial());
    expect(run(committed, { type: "OPEN_STOP_DRAFT", seedPointId: "b", suggestedVehicleStop: { lat: b.lat, lng: b.lng } })).toBe(committed);
  });

  it("the radius only derives candidates (they never join by themselves)", () => {
    const state = openDraftOnA(initial());
    expect(draftCandidateIds(state)).toEqual(["b", "e"]);
    expect(state.draft?.pointIds).toEqual(["a"]);
    const wider = run(state, { type: "SET_DRAFT_RADIUS", radiusMeters: 60 });
    expect(draftCandidateIds(wider)).toEqual(["b", "c", "e"]);
  });

  it("TOGGLE_DRAFT_POINT opts a candidate in (re-sweeping the order) and out", () => {
    const added = run(openDraftOnA(initial()), { type: "TOGGLE_DRAFT_POINT", pointId: "e" }, { type: "TOGGLE_DRAFT_POINT", pointId: "b" });
    /** Sweep from a's anchor: a (dist 0), b (north), e (east). */
    expect(added.draft?.pointIds).toEqual(["a", "b", "e"]);
    expect(draftCandidateIds(added)).toEqual([]);
    const removed = run(added, { type: "TOGGLE_DRAFT_POINT", pointId: "b" });
    expect(removed.draft?.pointIds).toEqual(["a", "e"]);
    expect(draftCandidateIds(removed)).toEqual(["b"]);
  });

  it("never lets a point join two stops (toggle on an assigned point is a no-op)", () => {
    const state = run(withStopAB(initial()), { type: "OPEN_STOP_DRAFT", seedPointId: "e", suggestedVehicleStop: { lat: e.lat, lng: e.lng } });
    const after = run(state, { type: "TOGGLE_DRAFT_POINT", pointId: "b" });
    expect(after.draft?.pointIds).toEqual(["e"]);
  });

  it("COMMIT_STOP fires the stop with contiguous order and clears draft + override", () => {
    const state = run(
      withStopAB(initial()),
      { type: "SET_NEXT_SUGGESTION", pointId: "c" },
      { type: "OPEN_STOP_DRAFT", seedPointId: "e", suggestedVehicleStop: { lat: e.lat, lng: e.lng } },
      { type: "COMMIT_STOP" }
    );
    expect(state.stops.map((s) => [s.id, s.order])).toEqual([
      ["stop_a", 1],
      ["stop_e", 2],
    ]);
    expect(state.draft).toBeNull();
    expect(state.nextSuggestionOverride).toBeNull();
  });

  it("committing an emptied draft is a no-op", () => {
    const state = run(openDraftOnA(initial()), { type: "TOGGLE_DRAFT_POINT", pointId: "a" });
    const after = run(state, { type: "COMMIT_STOP" });
    expect(after).toBe(state);
  });

  it("CANCEL_DRAFT drops the draft without touching committed stops", () => {
    const state = run(withStopAB(initial()), { type: "REOPEN_STOP", stopId: "stop_a" }, { type: "TOGGLE_DRAFT_POINT", pointId: "b" }, { type: "CANCEL_DRAFT" });
    expect(state.draft).toBeNull();
    expect(state.stops[0].pointIds).toEqual(["a", "b"]);
  });
});

describe("vehicle stop (anchor)", () => {
  it("MOVE_VEHICLE_STOP re-sweeps the walking order and clears the default flag", () => {
    const built = run(openDraftOnA(initial()), { type: "TOGGLE_DRAFT_POINT", pointId: "e" }, { type: "TOGGLE_DRAFT_POINT", pointId: "b" });
    /**
     * Move the anchor east of e: a/e sit due west (~270°) and b north-west (~288°).
     * Great-circle initial bearings of "due west" points differ by microdegrees at
     * this latitude (the farther point bears slightly less), so a precedes e.
     */
    const moved = run(built, { type: "MOVE_VEHICLE_STOP", position: { lat: -22.98, lng: -43.1995 } });
    expect(moved.draft?.vehicleStopIsDefault).toBe(false);
    expect(moved.draft?.pointIds).toEqual(["a", "e", "b"]);
  });

  it("MAKE_POINT_ANCHOR assumes the exact address coordinate (members only)", () => {
    const built = run(openDraftOnA(initial()), { type: "TOGGLE_DRAFT_POINT", pointId: "b" });
    const anchored = run(built, { type: "MAKE_POINT_ANCHOR", pointId: "b" });
    expect(anchored.draft?.vehicleStop).toEqual({ lat: b.lat, lng: b.lng });
    expect(anchored.draft?.vehicleStopIsDefault).toBe(false);
    expect(run(built, { type: "MAKE_POINT_ANCHOR", pointId: "c" })).toBe(built);
  });

  it("RESET_VEHICLE_STOP restores the suggested default", () => {
    const moved = run(openDraftOnA(initial()), { type: "MOVE_VEHICLE_STOP", position: { lat: -22.9, lng: -43.1 } });
    const reset = run(moved, { type: "RESET_VEHICLE_STOP", suggestedVehicleStop: { lat: a.lat, lng: a.lng } });
    expect(reset.draft?.vehicleStop).toEqual({ lat: a.lat, lng: a.lng });
    expect(reset.draft?.vehicleStopIsDefault).toBe(true);
  });

  it("a manual reorder survives toggles but not the next anchor move", () => {
    const built = run(openDraftOnA(initial()), { type: "TOGGLE_DRAFT_POINT", pointId: "b" }, { type: "REVERSE_DRAFT_ORDER" });
    expect(built.draft?.pointIds).toEqual(["b", "a"]);
    const appended = run(built, { type: "TOGGLE_DRAFT_POINT", pointId: "e" });
    expect(appended.draft?.pointIds).toEqual(["b", "a", "e"]);
    const moved = run(appended, { type: "MOVE_VEHICLE_STOP", position: { lat: a.lat, lng: a.lng } });
    expect(moved.draft?.pointIds).toEqual(["a", "b", "e"]);
    expect(moved.draft?.orderIsManual).toBe(false);
  });

  it("REORDER_DRAFT_POINT moves within bounds (index clamped)", () => {
    const built = run(openDraftOnA(initial()), { type: "TOGGLE_DRAFT_POINT", pointId: "b" }, { type: "TOGGLE_DRAFT_POINT", pointId: "e" });
    const reordered = run(built, { type: "REORDER_DRAFT_POINT", pointId: "e", toIndex: 0 });
    expect(reordered.draft?.pointIds).toEqual(["e", "a", "b"]);
    const clamped = run(reordered, { type: "REORDER_DRAFT_POINT", pointId: "e", toIndex: 99 });
    expect(clamped.draft?.pointIds).toEqual(["a", "b", "e"]);
  });
});

describe("editing committed stops", () => {
  it("REOPEN_STOP edits in place and COMMIT preserves the stop's order", () => {
    const twoStops = run(withStopAB(initial()), { type: "OPEN_STOP_DRAFT", seedPointId: "e", suggestedVehicleStop: { lat: e.lat, lng: e.lng } }, { type: "COMMIT_STOP" });
    const edited = run(twoStops, { type: "REOPEN_STOP", stopId: "stop_a" }, { type: "TOGGLE_DRAFT_POINT", pointId: "b" }, { type: "COMMIT_STOP" });
    expect(edited.stops.map((s) => [s.id, s.order])).toEqual([
      ["stop_a", 1],
      ["stop_e", 2],
    ]);
    expect(edited.stops[0].pointIds).toEqual(["a"]);
  });

  it("REOPEN_STOP never re-projects a stored anchor (not default)", () => {
    const state = run(withStopAB(initial()), { type: "REOPEN_STOP", stopId: "stop_a" });
    expect(state.draft?.vehicleStopIsDefault).toBe(false);
    expect(state.draft?.vehicleStop).toEqual({ lat: a.lat, lng: a.lng });
  });

  it("DISSOLVE_STOP frees the points and renumbers the remainder", () => {
    const threeStops = run(
      withStopAB(initial()),
      { type: "OPEN_STOP_DRAFT", seedPointId: "e", suggestedVehicleStop: { lat: e.lat, lng: e.lng } },
      { type: "COMMIT_STOP" },
      { type: "OPEN_STOP_DRAFT", seedPointId: "c", suggestedVehicleStop: { lat: c.lat, lng: c.lng } },
      { type: "COMMIT_STOP" }
    );
    const dissolved = run(threeStops, { type: "DISSOLVE_STOP", stopId: "stop_e" });
    expect(dissolved.stops.map((s) => [s.id, s.order])).toEqual([
      ["stop_a", 1],
      ["stop_c", 2],
    ]);
    expect(unassignedPoints(dissolved.points, dissolved.stops).map((p) => p.id)).toContain("e");
    expect(run(threeStops, { type: "DISSOLVE_STOP", stopId: "ghost" })).toBe(threeStops);
  });

  it("ADD_POINT_TO_STOP incorporates an orphan and re-sweeps that stop", () => {
    const state = run(withStopAB(initial()), { type: "ADD_POINT_TO_STOP", stopId: "stop_a", pointId: "e" });
    expect(state.stops[0].pointIds).toEqual(["a", "b", "e"]);
    /** Assigned or draft-held points are rejected. */
    expect(run(state, { type: "ADD_POINT_TO_STOP", stopId: "stop_a", pointId: "b" })).toBe(state);
    const drafting = run(state, { type: "OPEN_STOP_DRAFT", seedPointId: "c", suggestedVehicleStop: { lat: c.lat, lng: c.lng } });
    expect(run(drafting, { type: "ADD_POINT_TO_STOP", stopId: "stop_a", pointId: "c" })).toBe(drafting);
  });
});

describe("counters, completeness and persistence bridge", () => {
  it("remainingCounts tracks addresses/packages outside committed stops", () => {
    expect(remainingCounts(initial())).toEqual({ addresses: 5, packages: 8 });
    expect(remainingCounts(withStopAB(initial()))).toEqual({ addresses: 3, packages: 5 });
  });

  it("isComplete requires everything committed and no open draft (RF-33: never gates saving)", () => {
    const allCommitted = run(
      withStopAB(initial()),
      { type: "OPEN_STOP_DRAFT", seedPointId: "e", suggestedVehicleStop: { lat: e.lat, lng: e.lng } },
      { type: "TOGGLE_DRAFT_POINT", pointId: "c" },
      { type: "SET_DRAFT_RADIUS", radiusMeters: 60 },
      { type: "TOGGLE_DRAFT_POINT", pointId: "d" }
    );
    expect(isComplete(allCommitted)).toBe(false); // draft still open
    const done = run(allCommitted, { type: "COMMIT_STOP" });
    expect(isComplete(done)).toBe(true);
    expect(isComplete(initial())).toBe(false); // no stops at all
  });

  it("toPlannedRoute → HYDRATE round-trips the construction", () => {
    const built = run(withStopAB(initial()), { type: "SET_START", position: START });
    const hydrated = run(initial(), { type: "HYDRATE", route: toPlannedRoute(built) });
    expect(hydrated.routeId).toBe(built.routeId);
    expect(hydrated.startPoint).toEqual(START);
    expect(hydrated.stops).toEqual(built.stops);
    expect(hydrated.config).toEqual(built.config);
    expect(hydrated.draft).toBeNull();
  });

  it("HYDRATE drops point ids the current spreadsheet doesn't have (and empty stops)", () => {
    const built = withStopAB(initial());
    const route = toPlannedRoute(built);
    const tampered = {
      ...route,
      stops: [
        { ...route.stops[0], pointIds: ["a", "ghost"] },
        { ...route.stops[0], id: "stop_ghost", pointIds: ["ghost"] },
      ],
    };
    const hydrated = run(initial(), { type: "HYDRATE", route: tampered });
    expect(hydrated.stops.map((s) => [s.id, s.order, s.pointIds])).toEqual([["stop_a", 1, ["a"]]]);
  });

  it("RESET clears the construction but keeps route identity and config", () => {
    const built = run(withStopAB(initial()), { type: "SET_START", position: START });
    const reset = run(built, { type: "RESET" });
    expect(reset.stops).toEqual([]);
    expect(reset.startPoint).toBeNull();
    expect(reset.routeId).toBe("route_test");
    expect(reset.config).toEqual(built.config);
  });

  it("never mutates the previous state (reducer is pure)", () => {
    const before = withStopAB(initial());
    const snapshot = JSON.parse(JSON.stringify(before)) as unknown;
    run(before, { type: "REOPEN_STOP", stopId: "stop_a" }, { type: "TOGGLE_DRAFT_POINT", pointId: "e" }, { type: "COMMIT_STOP" }, { type: "DISSOLVE_STOP", stopId: "stop_a" });
    expect(JSON.parse(JSON.stringify(before))).toEqual(snapshot);
  });
});
