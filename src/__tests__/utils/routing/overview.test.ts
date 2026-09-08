import { describe, it, expect } from "vitest";
import { routeProgress, nextStopSuggestion, suggestedNextSeed } from "../../../utils/routing/overview";
import { createInitialBuilderState, routeBuilderReducer, type RouteBuilderAction, type RouteBuilderState } from "../../../utils/routing/builder";
import { squareGraph, COORDS, B } from "./__fixtures__/syntheticGraph";
import type { DeliveryPoint, LatLng } from "../../../types/routing";

const pt = (id: string, lat: number, lng: number, packageCount = 1): DeliveryPoint => ({ id, lat, lng, address: id, packageCount, packages: [] });

/** Same geography as builder.test: b (~17 m) and e (~15 m) sit inside the
    default 30 m radius of a; c (~56 m) and d (~1.5 km) sit outside. */
const a = pt("a", -22.98, -43.2, 2);
const b = pt("b", -22.97985, -43.2);
const e = pt("e", -22.98, -43.19985);
const c = pt("c", -22.9795, -43.2, 3);
const d = pt("d", -22.99, -43.21);
const POINTS = [a, b, c, d, e];

const START: LatLng = { lat: -22.9801, lng: -43.2001 };

const initial = (): RouteBuilderState => createInitialBuilderState(POINTS, undefined, { routeId: "route_test", createdAt: "2026-07-07T00:00:00.000Z" });

const run = (state: RouteBuilderState, ...actions: RouteBuilderAction[]): RouteBuilderState => actions.reduce(routeBuilderReducer, state);

const started = (): RouteBuilderState => run(initial(), { type: "SET_START", position: START });

/** Commits a+b into stop 1 (anchored on a), leaving c/d/e free. */
const withStopAB = (state: RouteBuilderState): RouteBuilderState =>
  run(state, { type: "OPEN_STOP_DRAFT", seedPointId: "a", suggestedVehicleStop: { lat: a.lat, lng: a.lng } }, { type: "TOGGLE_DRAFT_POINT", pointId: "b" }, { type: "COMMIT_STOP" });

/** Commits the remaining c/d/e into stop 2 — everything assigned. */
const withAllCommitted = (state: RouteBuilderState): RouteBuilderState =>
  run(
    withStopAB(state),
    { type: "OPEN_STOP_DRAFT", seedPointId: "c", suggestedVehicleStop: { lat: c.lat, lng: c.lng } },
    { type: "TOGGLE_DRAFT_POINT", pointId: "d" },
    { type: "TOGGLE_DRAFT_POINT", pointId: "e" },
    { type: "COMMIT_STOP" }
  );

describe("routeProgress", () => {
  it("starts at zero: nothing committed → 0/total and ratio 0", () => {
    const progress = routeProgress(initial());
    expect(progress).toEqual({ addressesDone: 0, addressesTotal: 5, packagesDone: 0, packagesTotal: 8, stopsCount: 0, ratio: 0 });
  });

  it("counts committed addresses AND packages; the ratio's base is addresses (decision 09/07)", () => {
    const progress = routeProgress(withStopAB(started()));
    expect(progress.addressesDone).toBe(2); // a + b
    expect(progress.packagesDone).toBe(3); // a carries 2 packages
    expect(progress.stopsCount).toBe(1); // RF-006.20: uma parada confirmada
    expect(progress.ratio).toBeCloseTo(2 / 5);
  });

  it("reaches 100% when every point is committed", () => {
    const progress = routeProgress(withAllCommitted(started()));
    expect(progress.addressesDone).toBe(5);
    expect(progress.packagesDone).toBe(8);
    expect(progress.ratio).toBe(1);
  });

  it("reaches 100% when active points are committed and remaining points are ignored", () => {
    const state = run(
      withStopAB(started()),
      { type: "OPEN_STOP_DRAFT", seedPointId: "c", suggestedVehicleStop: { lat: c.lat, lng: c.lng } },
      { type: "TOGGLE_DRAFT_POINT", pointId: "e" },
      { type: "COMMIT_STOP" }
    );
    expect(routeProgress(state).ratio).toBeCloseTo(4 / 5);

    const ignoredD = run(state, { type: "IGNORE_POINT", pointId: "d" });
    const progress = routeProgress(ignoredD);
    expect(progress.addressesTotal).toBe(4);
    expect(progress.addressesDone).toBe(4);
    expect(progress.ratio).toBe(1);
  });

  it("no points → ratio 0, never a division by zero", () => {
    const empty = createInitialBuilderState([], undefined, { routeId: "route_empty", createdAt: "2026-07-07T00:00:00.000Z" });
    expect(routeProgress(empty).ratio).toBe(0);
    expect(Number.isNaN(routeProgress(empty).ratio)).toBe(false);
  });
});

describe("nextStopSuggestion", () => {
  it("null before a start exists (the reducer suggests nothing)", () => {
    expect(nextStopSuggestion(initial(), null)).toBeNull();
  });

  it("seeds on the nearest free point and aggregates the default-radius candidates", () => {
    const suggestion = nextStopSuggestion(started(), null);
    expect(suggestion).not.toBeNull();
    expect(suggestion?.seed.id).toBe("a"); // nearest to the start
    // No graph → the anchor falls back to the seed's own coordinate.
    expect(suggestion?.anchor).toEqual({ lat: a.lat, lng: a.lng });
    // a + its 30 m neighbours (b, e), in the walking sweep — never c/d.
    expect(suggestion?.points.map((p) => p.id).sort()).toEqual(["a", "b", "e"]);
    expect(suggestion?.order).toBe(1);
  });

  it("the numbering CONTINUES the route: after stop 1 the suggestion is stop 2", () => {
    const suggestion = nextStopSuggestion(withStopAB(started()), null);
    expect(suggestion?.order).toBe(2);
    expect(suggestion?.seed.id).toBe("e"); // nearest free from stop 1's anchor
    // b/a are assigned; c is ~58 m from e — the suggestion holds only the seed.
    expect(suggestion?.points.map((p) => p.id)).toEqual(["e"]);
  });

  it("null when every point is committed", () => {
    expect(nextStopSuggestion(withAllCommitted(started()), null)).toBeNull();
  });
});

describe("suggestedNextSeed (RF-006.12 — respeita a mão única)", () => {
  // Sobre o grafo sintético (Rua AB é mão única A→B): dois candidatos livres a
  // partir do início em B — p1 mais perto EM RETA (mid-AB, ao norte de B), mas
  // atrás da contramão; p2 um pouco mais longe em reta (Rua BD, leste), direto.
  const p1 = pt("p1", -22.9807, -43.2);
  const p2 = pt("p2", -22.981, -43.1996);
  const startedAtB = run(createInitialBuilderState([p1, p2], undefined, { routeId: "r", createdAt: "2026-07-07T00:00:00.000Z" }), { type: "SET_START", position: COORDS[B] });

  it("sem grafo cai na sugestão por LINHA RETA (o mais perto)", () => {
    expect(suggestedNextSeed(startedAtB, null)).toBe("p1");
  });

  it("com o grafo dirigido escolhe o ALCANÇÁVEL pela mão única, não o mais perto em reta", () => {
    expect(suggestedNextSeed(startedAtB, squareGraph)).toBe("p2");
  });
});
