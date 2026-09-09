import { describe, it, expect } from "vitest";
import {
  createInitialBuilderState,
  routeBuilderReducer,
  draftCandidateIds,
  farChosenPointIds,
  suggestedNextPointId,
  suggestionOrigin,
  previousAnchorOrigin,
  remainingCounts,
  isComplete,
  toPlannedRoute,
  type RouteBuilderAction,
  type RouteBuilderState,
} from "../../../utils/routing/builder";
import { unassignedPoints } from "../../../utils/routing/selectors";
import { nearestFirstOrder } from "../../../utils/routing/walkOrder";
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

  it("CLEAR_START drops the start entirely (TASK-RF-006.14)", () => {
    const started = run(initial(), { type: "SET_START", position: START });
    const cleared = run(started, { type: "CLEAR_START" });
    expect(cleared.startPoint).toBeNull();
    // With committed stops, clearing the start leaves them untouched.
    const withStop = withStopAB(run(initial(), { type: "SET_START", position: START }));
    expect(run(withStop, { type: "CLEAR_START" }).stops).toEqual(withStop.stops);
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

  it("with an open draft the suggestion departs from the draft anchor and skips its points AND the radius (rev. .4)", () => {
    const state = run(openDraftOnA(initial()), { type: "TOGGLE_DRAFT_POINT", pointId: "e" });
    // b sits INSIDE the 30 m radius (a candidate, not the next stop — fluxo §6),
    // so the nearest OUTSIDE wins: c (~56 m).
    expect(suggestedNextPointId(state)).toBe("c");
  });

  it("with a draft open the suggestion skips points INSIDE the radius (fluxo §6: fora do raio)", () => {
    const drafting = run(initial(), { type: "SET_START", position: START }, { type: "OPEN_STOP_DRAFT", seedPointId: "a", suggestedVehicleStop: { lat: a.lat, lng: a.lng } });
    // b/e sit inside the 30 m radius (candidates); the nearest OUTSIDE is c.
    expect(suggestedNextPointId(drafting)).toBe("c");
    // An override pointing inside the radius is ignored (falls back to c).
    expect(suggestedNextPointId(run(drafting, { type: "SET_NEXT_SUGGESTION", pointId: "b" }))).toBe("c");
    // Radius wide enough to cover everything → nothing left to suggest.
    expect(suggestedNextPointId(run(drafting, { type: "SET_DRAFT_RADIUS", radiusMeters: 5000 }))).toBeNull();
  });

  it("farChosenPointIds flags chosen points beyond max(2×radius, 150 m) of the anchor (RN-17)", () => {
    expect(farChosenPointIds(initial())).toEqual([]);
    const drafting = openDraftOnA(initial());
    expect(farChosenPointIds(drafting)).toEqual([]); // seed sits at the anchor
    const withNear = run(drafting, { type: "TOGGLE_DRAFT_POINT", pointId: "b" });
    expect(farChosenPointIds(withNear)).toEqual([]); // ~17 m
    const withFar = run(withNear, { type: "TOGGLE_DRAFT_POINT", pointId: "d" });
    expect(farChosenPointIds(withFar)).toEqual(["d"]); // ~1.5 km > 150 m
    expect(farChosenPointIds(run(withFar, { type: "TOGGLE_DRAFT_POINT", pointId: "d" }))).toEqual([]);
  });

  it("suggestionOrigin follows draft anchor > last stop anchor > start (null before)", () => {
    expect(suggestionOrigin(initial())).toBeNull();
    const started = run(initial(), { type: "SET_START", position: START });
    expect(suggestionOrigin(started)).toEqual(START);
    const committed = withStopAB(started);
    expect(suggestionOrigin(committed)).toEqual({ lat: a.lat, lng: a.lng });
    const drafting = run(committed, { type: "OPEN_STOP_DRAFT", seedPointId: "e", suggestedVehicleStop: { lat: e.lat, lng: e.lng } });
    expect(suggestionOrigin(drafting)).toEqual({ lat: e.lat, lng: e.lng });
  });
});

describe("CREATE_STOP (commit-on-create — RF-006.4.6)", () => {
  it("firma uma parada direto com semente + membros do raio, sem draft, ordem varrida", () => {
    const state = run(initial(), { type: "CREATE_STOP", seedPointId: "a", memberIds: ["b", "e"], vehicleStop: { lat: a.lat, lng: a.lng }, radiusMeters: 30 });
    expect(state.draft).toBeNull();
    expect(state.stops).toHaveLength(1);
    const [stop] = state.stops;
    expect(stop.id).toBe("stop_a");
    expect(stop.order).toBe(1);
    expect(stop.radiusMeters).toBe(30);
    expect([...stop.pointIds].sort()).toEqual(["a", "b", "e"]);
    // A ordem sai da âncora (não da entrada): mais próximo em 1º e o sentido
    // pelo 2º vizinho mais próximo (RF-006.17). `a` está sobre a âncora (1º);
    // `e` (~15 m) é mais perto de `a` que `b` (~17 m) → [a, e, b].
    expect(stop.pointIds).toEqual(nearestFirstOrder({ lat: a.lat, lng: a.lng }, [a, b, e], false));
    expect(stop.pointIds).toEqual(["a", "e", "b"]);
  });

  it("de-dupa a semente, ignora pontos já assinalados e é no-op para semente desconhecida/tomada", () => {
    // Semente incluída em memberIds não duplica.
    const deduped = run(initial(), { type: "CREATE_STOP", seedPointId: "a", memberIds: ["a", "b"], vehicleStop: { lat: a.lat, lng: a.lng }, radiusMeters: 30 });
    expect([...deduped.stops[0].pointIds].sort()).toEqual(["a", "b"]);

    // Ponto já em outra parada é filtrado (b pertence à parada a+b).
    const withAB = withStopAB(initial());
    const created = run(withAB, { type: "CREATE_STOP", seedPointId: "c", memberIds: ["b", "e"], vehicleStop: { lat: c.lat, lng: c.lng }, radiusMeters: 30 });
    expect(created.stops).toHaveLength(2);
    expect([...created.stops[1].pointIds].sort()).toEqual(["c", "e"]); // b ficou fora

    // Semente desconhecida ou já tomada → sem mudança.
    expect(run(initial(), { type: "CREATE_STOP", seedPointId: "nope", memberIds: [], vehicleStop: START, radiusMeters: 30 }).stops).toEqual([]);
    expect(run(withAB, { type: "CREATE_STOP", seedPointId: "b", memberIds: [], vehicleStop: START, radiusMeters: 30 })).toBe(withAB);
  });

  it("CREATE_STOP fixa o ponto semente como primeiro endereco da parada", () => {
    // Mesmo se a coordenada do veículo estiver mais perto de 'a', se a semente é 'b', 'b' deve ser 1º
    const state = run(initial(), {
      type: "CREATE_STOP",
      seedPointId: "b",
      memberIds: ["a", "e"],
      vehicleStop: { lat: a.lat, lng: a.lng },
      radiusMeters: 30,
    });
    expect(state.stops[0].pointIds[0]).toBe("b");
  });

  it("CREATE_STOP insere em posicao arbitraria e renumera paradas subsequentes", () => {
    const s1 = run(initial(), { type: "CREATE_STOP", seedPointId: "a", memberIds: [], vehicleStop: { lat: a.lat, lng: a.lng }, radiusMeters: 30 });
    const s2 = run(s1, { type: "CREATE_STOP", seedPointId: "c", memberIds: [], vehicleStop: { lat: c.lat, lng: c.lng }, radiusMeters: 30 });
    const s3 = run(s2, { type: "CREATE_STOP", seedPointId: "d", memberIds: [], vehicleStop: { lat: d.lat, lng: d.lng }, radiusMeters: 30 });
    expect(s3.stops.map((s) => s.id)).toEqual(["stop_a", "stop_c", "stop_d"]);
    expect(s3.stops.map((s) => s.order)).toEqual([1, 2, 3]);

    // Inserir nova parada 'e' com targetOrder: 2 (entre stop_a e stop_c)
    const insertedMid = run(s3, {
      type: "CREATE_STOP",
      seedPointId: "e",
      memberIds: [],
      vehicleStop: { lat: e.lat, lng: e.lng },
      radiusMeters: 30,
      targetOrder: 2,
    });
    expect(insertedMid.stops.map((s) => s.id)).toEqual(["stop_a", "stop_e", "stop_c", "stop_d"]);
    expect(insertedMid.stops.map((s) => s.order)).toEqual([1, 2, 3, 4]);

    // Inserir nova parada 'b' com targetOrder: 1 (no início)
    const insertedStart = run(s3, {
      type: "CREATE_STOP",
      seedPointId: "b",
      memberIds: [],
      vehicleStop: { lat: b.lat, lng: b.lng },
      radiusMeters: 30,
      targetOrder: 1,
    });
    expect(insertedStart.stops.map((s) => s.id)).toEqual(["stop_b", "stop_a", "stop_c", "stop_d"]);
    expect(insertedStart.stops.map((s) => s.order)).toEqual([1, 2, 3, 4]);
  });
});

describe("REORDER_STOP (reordenacao de paradas)", () => {
  it("REORDER_STOP reposiciona parada e normaliza sequencia 1..n", () => {
    const s1 = run(initial(), { type: "CREATE_STOP", seedPointId: "a", memberIds: [], vehicleStop: { lat: a.lat, lng: a.lng }, radiusMeters: 30 });
    const s2 = run(s1, { type: "CREATE_STOP", seedPointId: "b", memberIds: [], vehicleStop: { lat: b.lat, lng: b.lng }, radiusMeters: 30 });
    const s3 = run(s2, { type: "CREATE_STOP", seedPointId: "c", memberIds: [], vehicleStop: { lat: c.lat, lng: c.lng }, radiusMeters: 30 });
    const s4 = run(s3, { type: "CREATE_STOP", seedPointId: "d", memberIds: [], vehicleStop: { lat: d.lat, lng: d.lng }, radiusMeters: 30 });
    expect(s4.stops.map((s) => s.id)).toEqual(["stop_a", "stop_b", "stop_c", "stop_d"]);

    // Mover stop_d (ordem 4) para ordem 2
    const movedTo2 = run(s4, { type: "REORDER_STOP", stopId: "stop_d", targetOrder: 2 });
    expect(movedTo2.stops.map((s) => s.id)).toEqual(["stop_a", "stop_d", "stop_b", "stop_c"]);
    expect(movedTo2.stops.map((s) => s.order)).toEqual([1, 2, 3, 4]);

    // Mover stop_a (ordem 1) para ordem 4 (ao final)
    const movedToEnd = run(s4, { type: "REORDER_STOP", stopId: "stop_a", targetOrder: 4 });
    expect(movedToEnd.stops.map((s) => s.id)).toEqual(["stop_b", "stop_c", "stop_d", "stop_a"]);
    expect(movedToEnd.stops.map((s) => s.order)).toEqual([1, 2, 3, 4]);

    // No-op para ordem idêntica, stopId inexistente ou targetOrder fora de faixa
    expect(run(s4, { type: "REORDER_STOP", stopId: "stop_b", targetOrder: 2 })).toBe(s4);
    expect(run(s4, { type: "REORDER_STOP", stopId: "stop_unknown", targetOrder: 1 })).toBe(s4);
    expect(run(s4, { type: "REORDER_STOP", stopId: "stop_b", targetOrder: 0 })).toBe(s4);
    expect(run(s4, { type: "REORDER_STOP", stopId: "stop_b", targetOrder: 5 })).toBe(s4);
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
      reversed: false,
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
    /** Order from a's anchor (RF-006.17): a is at the anchor (1º); e (~15 m) is a
        nearer neighbour than b (~17 m), so the sense makes it 2º → [a, e, b]. */
    expect(added.draft?.pointIds).toEqual(["a", "e", "b"]);
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
     * Move the anchor east of e (RF-006.17): now `e` is the NEAREST (~36 m) → 1º;
     * its nearer neighbour is `a` (~15 m vs b ~23 m), so the sense makes `a` 2º →
     * [e, a, b].
     */
    const moved = run(built, { type: "MOVE_VEHICLE_STOP", position: { lat: -22.98, lng: -43.1995 } });
    expect(moved.draft?.vehicleStopIsDefault).toBe(false);
    expect(moved.draft?.pointIds).toEqual(["e", "a", "b"]);
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

  // RF-006.6 (supersede "a manual reorder survives toggles but not the next
  // anchor move"): não existe mais ordem manual. O SENTIDO (horário/anti-
  // horário) é propriedade da parada e sobrevive a TUDO que re-varre.
  it("o SENTIDO invertido sobrevive a toggles E à mudança de âncora (RF-006.6/.17)", () => {
    // 3 membros: com 2 o inverter é invisível (o mais próximo fica em 1º nos dois
    // sentidos — RF-006.17). Âncora sobre `a` (1º); `e` (~15 m) é vizinho mais
    // próximo que `b` (~17 m) → o sentido-padrão dá [a, e, b].
    const built = run(openDraftOnA(initial()), { type: "TOGGLE_DRAFT_POINT", pointId: "b" }, { type: "TOGGLE_DRAFT_POINT", pointId: "e" });
    expect(built.draft?.pointIds).toEqual(["a", "e", "b"]);
    expect(built.draft?.reversed).toBe(false);

    // Inverter mantém o 1º (mais próximo) e vira o sentido → [a, b, e].
    const reversed = run(built, { type: "REVERSE_DRAFT_ORDER" });
    expect(reversed.draft?.pointIds).toEqual(["a", "b", "e"]);
    expect(reversed.draft?.reversed).toBe(true);

    // Mover a âncora RE-VARRE mantendo o anti-horário: `e` vira o 1º (mais
    // próximo da nova posição) e o sentido invertido dá [e, b, a].
    const moved = run(reversed, { type: "MOVE_VEHICLE_STOP", position: { lat: -22.98, lng: -43.1995 } });
    expect(moved.draft?.reversed).toBe(true);
    expect(moved.draft?.pointIds).toEqual(["e", "b", "a"]);
  });

  it("inverter DE NOVO volta ao sentido-padrão (RF-006.6/.17)", () => {
    const twice = run(
      openDraftOnA(initial()),
      { type: "TOGGLE_DRAFT_POINT", pointId: "b" },
      { type: "TOGGLE_DRAFT_POINT", pointId: "e" },
      { type: "REVERSE_DRAFT_ORDER" },
      { type: "REVERSE_DRAFT_ORDER" }
    );
    expect(twice.draft?.reversed).toBe(false);
    expect(twice.draft?.pointIds).toEqual(["a", "e", "b"]);
  });

  // Rev. RF-006.15: as actions de âncora de parada FIRMADA (MOVE_STOP_ANCHOR,
  // MAKE_STOP_POINT_ANCHOR, RESET_STOP_ANCHOR, REVERSE_STOP_ORDER) foram
  // REMOVIDAS — editar a âncora = reabrir como rascunho. O que elas garantiam
  // (re-varredura + flags) agora flui pelo par REOPEN → action de draft →
  // COMMIT, coberto abaixo e pelos testes de draft acima.

  // `REORDER_DRAFT_POINT` foi REMOVIDA na RF-006.6 (decisão 17/07: "não deve
  // ser possível ordenar manualmente") — a ordem tem só duas entradas, a âncora
  // e o sentido.

  it("previousAnchorOrigin: de onde o veículo VEM para cada parada (RF-006.6)", () => {
    const started = run(initial(), { type: "SET_START", position: START });
    // Primeira parada: o veículo vem do INÍCIO.
    expect(previousAnchorOrigin(withStopAB(started), "stop_a")).toEqual(START);

    // Segunda parada: vem da âncora da anterior.
    const twoStops = run(withStopAB(started), { type: "OPEN_STOP_DRAFT", seedPointId: "c", suggestedVehicleStop: { lat: c.lat, lng: c.lng } }, { type: "COMMIT_STOP" });
    expect(previousAnchorOrigin(twoStops, "stop_c")).toEqual(twoStops.stops[0].vehicleStop);

    // Parada ainda não criada (id desconhecido): vem da ÚLTIMA parada…
    expect(previousAnchorOrigin(twoStops, null)).toEqual(twoStops.stops[1].vehicleStop);
    // …e sem paradas, do início.
    expect(previousAnchorOrigin(started, null)).toEqual(START);
  });

  it("a flag de PADRÃO da âncora flui commit→reopen→draft (RF-006.15): editar move a âncora, commit grava, reopen carrega", () => {
    const committed = withStopAB(initial());
    expect(committed.stops[0].vehicleStopIsDefault).toBe(true); // nasce no padrão → sem "Resetar" na edição

    // Editar (reopen) → mover a âncora no rascunho → firmar de volta.
    const moved = run(committed, { type: "REOPEN_STOP", stopId: "stop_a" }, { type: "MOVE_VEHICLE_STOP", position: { lat: -22.99, lng: -43.21 } });
    expect(moved.draft?.vehicleStopIsDefault).toBe(false); // fora do padrão → "Resetar" aparece
    const recommitted = run(moved, { type: "COMMIT_STOP" });
    expect(recommitted.stops[0].vehicleStopIsDefault).toBe(false); // a flag foi gravada na parada

    // Reabrir de novo carrega a flag; resetar no rascunho volta ao padrão.
    const resetInDraft = run(recommitted, { type: "REOPEN_STOP", stopId: "stop_a" }, { type: "RESET_VEHICLE_STOP", suggestedVehicleStop: { lat: a.lat, lng: a.lng } });
    expect(resetInDraft.draft?.vehicleStopIsDefault).toBe(true);
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

  // Rev. RF-006.6: o REOPEN COPIA as flags do stop (antes forçava
  // `vehicleStopIsDefault: false`). O sentido e o "está no padrão?" são do
  // STOP — o draft não os inventa, senão o botão "Resetar" apareceria em toda
  // edição e o anti-horário morreria na primeira re-varredura.
  it("REOPEN_STOP carrega as flags do stop para o draft (âncora + sentido — RF-006.6)", () => {
    const state = run(withStopAB(initial()), { type: "REOPEN_STOP", stopId: "stop_a" });
    expect(state.draft?.vehicleStopIsDefault).toBe(true); // a âncora nasceu no padrão e ninguém a moveu
    expect(state.draft?.vehicleStop).toEqual({ lat: a.lat, lng: a.lng });
    expect(state.draft?.reversed).toBe(false);

    // Uma parada editada (âncora movida + sentido invertido no rascunho, firmada
    // de volta) reabre EXATAMENTE assim — as flags são do STOP (RF-006.15).
    const edited = run(
      withStopAB(initial()),
      { type: "REOPEN_STOP", stopId: "stop_a" },
      { type: "MOVE_VEHICLE_STOP", position: { lat: -22.99, lng: -43.21 } },
      { type: "REVERSE_DRAFT_ORDER" },
      { type: "COMMIT_STOP" }
    );
    const reopened = run(edited, { type: "REOPEN_STOP", stopId: "stop_a" });
    expect(reopened.draft?.vehicleStopIsDefault).toBe(false);
    expect(reopened.draft?.reversed).toBe(true);
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
    expect(state.stops[0].pointIds).toEqual(["a", "e", "b"]); // re-varrido: e (~15 m) antes de b (~17 m)
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

  it("CLEAR_STOPS clears all stops and draft but preserves startPoint, route identity and config", () => {
    const built = run(withStopAB(initial()), { type: "SET_START", position: START }, { type: "OPEN_STOP_DRAFT", seedPointId: "c", suggestedVehicleStop: { lat: c.lat, lng: c.lng } });
    const cleared = run(built, { type: "CLEAR_STOPS" });
    expect(cleared.stops).toEqual([]);
    expect(cleared.draft).toBeNull();
    expect(cleared.nextSuggestionOverride).toBeNull();
    expect(cleared.startPoint).toEqual(START);
    expect(cleared.routeId).toBe("route_test");
    expect(cleared.config).toEqual(built.config);
  });

  it("never mutates the previous state (reducer is pure)", () => {
    const before = withStopAB(initial());
    const snapshot = JSON.parse(JSON.stringify(before)) as unknown;
    run(before, { type: "REOPEN_STOP", stopId: "stop_a" }, { type: "TOGGLE_DRAFT_POINT", pointId: "e" }, { type: "COMMIT_STOP" }, { type: "DISSOLVE_STOP", stopId: "stop_a" });
    expect(JSON.parse(JSON.stringify(before))).toEqual(snapshot);
  });
});

describe("ignored points", () => {
  it("IGNORE_POINT adds point to ignoredPointIds and UNIGNORE_POINT removes it", () => {
    const state = initial();
    const ignored = run(state, { type: "IGNORE_POINT", pointId: "d" });
    expect(ignored.ignoredPointIds).toEqual(["d"]);

    // Idempotent
    const ignoredAgain = run(ignored, { type: "IGNORE_POINT", pointId: "d" });
    expect(ignoredAgain.ignoredPointIds).toEqual(["d"]);

    const unignored = run(ignored, { type: "UNIGNORE_POINT", pointId: "d" });
    expect(unignored.ignoredPointIds).toEqual([]);
  });

  it("IGNORE_POINT removes the point from committed stops and cleans empty stops", () => {
    const state = withStopAB(initial()); // stop_a with ["a", "b"]
    const ignoredB = run(state, { type: "IGNORE_POINT", pointId: "b" });
    expect(ignoredB.stops[0]?.pointIds).toEqual(["a"]);

    const ignoredA = run(ignoredB, { type: "IGNORE_POINT", pointId: "a" });
    expect(ignoredA.stops).toEqual([]);
  });

  it("IGNORE_POINT cancels draft if the seed is ignored", () => {
    const state = openDraftOnA(initial());
    const ignored = run(state, { type: "IGNORE_POINT", pointId: "a" });
    expect(ignored.draft).toBeNull();
  });

  it("remainingCounts and isComplete disregard ignored points", () => {
    // POINTS: [a, b, c, d, e] (5 points)
    // Create stop with a, b, c, e (4 points)
    let state = run(
      openDraftOnA(initial()),
      { type: "TOGGLE_DRAFT_POINT", pointId: "b" },
      { type: "TOGGLE_DRAFT_POINT", pointId: "c" },
      { type: "TOGGLE_DRAFT_POINT", pointId: "e" },
      { type: "COMMIT_STOP" }
    );
    // Only d remains unassigned
    expect(remainingCounts(state).addresses).toBe(1);
    expect(isComplete(state)).toBe(false);

    // Ignore d
    state = run(state, { type: "IGNORE_POINT", pointId: "d" });
    expect(remainingCounts(state).addresses).toBe(0);
    expect(isComplete(state)).toBe(true);
  });

  it("toPlannedRoute persists ignoredPointIds and HYDRATE restores them", () => {
    const state = run(initial(), { type: "IGNORE_POINT", pointId: "d" });
    const planned = toPlannedRoute(state);
    expect(planned.ignoredPointIds).toEqual(["d"]);

    const hydrated = run(initial(), { type: "HYDRATE", route: planned });
    expect(hydrated.ignoredPointIds).toEqual(["d"]);
  });
});
