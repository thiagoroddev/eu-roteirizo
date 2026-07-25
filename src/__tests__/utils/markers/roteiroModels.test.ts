import { describe, it, expect } from "vitest";
import {
  computeRoteiroMarkerModels,
  buildPointTooltipHtml,
  pointToStopItemData,
  addressLineOf,
  mapsDirectionsUrl,
  packagesByTypeFromPoints,
  stopPlaceSummaryFromPoints,
  walkEstimateLabel,
  legLabel,
  orderedStopPoints,
  NO_STOP_INDEX,
} from "../../../utils/markers/roteiroModels";
import { ROTEIRO_TYPE_COLORS } from "../../../utils/markers/markerColors";
import type { StopDraft } from "../../../utils/routing/builder";
import { COLUMN_NAMES, UI_LABELS } from "../../../constants";
import type { DeliveryPoint, RouteStop } from "../../../types/routing";

const pt = (id: string, lat: number, lng: number, packageCount = 1, address = `Rua ${id}, 10`): DeliveryPoint => ({ id, lat, lng, address, packageCount, packages: [] });

/** A point whose packages carry an explicit Location Type column (for stop color). */
const typedPt = (id: string, locationType: string): DeliveryPoint => ({
  id,
  lat: -22.98,
  lng: -43.2,
  address: `Rua ${id}, 10`,
  packageCount: 1,
  packages: [{ id: `${id}_0`, rawData: { [COLUMN_NAMES.LOCATION_TYPE]: locationType, [COLUMN_NAMES.DESTINATION_ADDRESS]: `Rua ${id}, 10` } }],
});

const stop = (id: string, pointIds: string[], order = 1): RouteStop => ({ id, order, vehicleStop: { lat: -22.98, lng: -43.2 }, pointIds, radiusMeters: 30 });

const draftOn = (seed: string, pointIds: string[]): StopDraft => ({
  stopId: `stop_${seed}`,
  seedPointId: seed,
  pointIds,
  radiusMeters: 30,
  vehicleStop: { lat: -22.98, lng: -43.2 },
  vehicleStopIsDefault: true,
  reversed: false, // RF-006.6: o sentido substituiu `orderIsManual`
});

describe("computeRoteiroMarkerModels", () => {
  const a = pt("pt_a", -22.98, -43.2);
  const b = pt("pt_b", -22.979, -43.2, 3);

  it("renders each free point as a NEON TYPE-colored circle without a number (rev. 08/07)", () => {
    const models = computeRoteiroMarkerModels([a, b], []);
    expect(models).toHaveLength(2);
    expect(models[0]).toMatchObject({
      key: "pt_a",
      kind: "address",
      lat: a.lat,
      lng: a.lng,
      stopIndex: NO_STOP_INDEX,
      // No packages in the fixture → indefinite; type colors survive the mode switch.
      iconProps: { shape: "circle", color: ROTEIRO_TYPE_COLORS.indefinite, number: null },
    });
    // A typed point keeps its type reading, in the lighter neon register.
    const typed = computeRoteiroMarkerModels([typedPt("pt_h", "Home")], []);
    expect(typed[0].iconProps.color).toBe(ROTEIRO_TYPE_COLORS.residential);
  });

  it("adds a package badge only for multi-package locations", () => {
    const models = computeRoteiroMarkerModels([a, b], []);
    expect(models[0].iconProps.badge).toBeNull();
    expect(models[1].iconProps.badge).toEqual({ kind: "packages", count: 3 });
  });

  it("assigned points stop rendering as free circles — the committed STOP marker takes over (rev. .4)", () => {
    const models = computeRoteiroMarkerModels([a, b], [stop("stop_a", ["pt_a"])]);
    expect(models.map((m) => m.key)).toEqual(["stop_a", "pt_b"]);
    expect(models[0].kind).toBe("stop");
  });

  it("returns [] with no points; all assigned → only the stop markers remain", () => {
    expect(computeRoteiroMarkerModels([], [])).toEqual([]);
    const models = computeRoteiroMarkerModels([a], [stop("stop_a", ["pt_a"])]);
    expect(models.map((m) => m.kind)).toEqual(["stop"]);
  });

  it("tooltip shows address and package count", () => {
    const html = buildPointTooltipHtml(b);
    expect(html).toContain("Rua pt_b, 10");
    expect(html).toContain("3");
  });

  it("tooltip escapes spreadsheet HTML (XSS)", () => {
    const evil = pt("pt_x", -22.98, -43.2, 1, `<img src=x onerror=alert(1)>`);
    const html = buildPointTooltipHtml(evil);
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });
});

describe("computeRoteiroMarkerModels — draft/stop context (TASK-RF-006.4)", () => {
  const a = pt("pt_a", -22.98, -43.2);
  const b = pt("pt_b", -22.979, -43.2, 3);
  const c = pt("pt_c", -22.978, -43.2);

  it("renders a committed stop as an ordered SQUARE at its anchor, colored by dominant type", () => {
    const home = typedPt("pt_h", "Home");
    const office = typedPt("pt_o", "Office");
    const models = computeRoteiroMarkerModels([home, office], [stop("stop_1", ["pt_h", "pt_o"], 3)]);

    expect(models).toHaveLength(1);
    expect(models[0]).toMatchObject({
      key: "stop_1",
      kind: "stop",
      lat: -22.98,
      lng: -43.2,
      iconProps: { shape: "square", number: 3, badge: { kind: "addresses", count: 2 } },
    });
    // "Commercial wins" (decision 26/06), in the mode's neon register (rev. 08/07).
    expect(models[0].iconProps.color).toBe(ROTEIRO_TYPE_COLORS.commercial);
  });

  it("single-address stop badges its packages instead", () => {
    const models = computeRoteiroMarkerModels([b], [stop("stop_1", ["pt_b"])]);
    expect(models[0].iconProps.badge).toEqual({ kind: "packages", count: 3 });
  });

  it("draft members gain the ring AND the walking ORDINAL ('1º/2º' — rev. 08/07)", () => {
    const models = computeRoteiroMarkerModels([a, b], [], { draft: draftOn("pt_a", ["pt_a", "pt_b"]) });
    const first = models.find((m) => m.key === "pt_a")!;
    const second = models.find((m) => m.key === "pt_b")!;
    expect(first.iconProps.selected).toBe(true);
    expect(first.iconProps.number).toBe("1º");
    expect(second.iconProps.number).toBe("2º");
    expect(first.iconProps.color).toBe(ROTEIRO_TYPE_COLORS.indefinite);
  });

  it("free points carry NOTHING (no number — rev. 08/07); candidates get the DASHED ring + glow", () => {
    const models = computeRoteiroMarkerModels([a, b], [], { draft: draftOn("pt_a", ["pt_a"]), candidateIds: ["pt_b"] });
    const candidate = models.find((m) => m.key === "pt_b")!;
    expect(candidate.iconProps.number).toBeNull();
    expect(candidate.iconProps.selected).toBe(true);
    expect(candidate.iconProps.ringStyle).toBe("dashed");
    expect(candidate.iconProps.emphasis).toBe(true);
    expect(candidate.iconProps.color).toBe(ROTEIRO_TYPE_COLORS.indefinite);
  });

  it("the radius PREVIEW works without a draft (selecting an orphan — U6)", () => {
    const models = computeRoteiroMarkerModels([a, b], [], { candidateIds: ["pt_b"], selectedPointId: "pt_a" });
    expect(models.find((m) => m.key === "pt_b")!.iconProps.ringStyle).toBe("dashed");
    expect(models.find((m) => m.key === "pt_a")!.iconProps.selected).toBe(true);
  });

  it("the selected committed stop gets the ring AND the highlight (enlarge/raise — RF-006.4.2/.4.14)", () => {
    const models = computeRoteiroMarkerModels([a], [stop("stop_1", ["pt_a"])], { selectedStopId: "stop_1" });
    expect(models[0].iconProps.selected).toBe(true);
    expect(models[0].iconProps.highlight).toBe(true);
    expect(models[0].iconProps.emphasis).toBe(true);
  });

  it("the selected orphan is HIGHLIGHTED; a candidate glows but is NOT highlighted (RF-006.4.14)", () => {
    const models = computeRoteiroMarkerModels([a, b, c], [], { candidateIds: ["pt_c"], selectedPointId: "pt_a" });
    const orphan = models.find((m) => m.key === "pt_a")!;
    expect(orphan.iconProps.highlight).toBe(true);
    expect(orphan.iconProps.emphasis).toBe(true);
    const candidate = models.find((m) => m.key === "pt_c")!;
    expect(candidate.iconProps.emphasis).toBe(true); // glow (radius cue)
    expect(candidate.iconProps.highlight).toBeFalsy(); // but no size boost
  });

  it("the selected orphan gets the ring (only while no draft is open)", () => {
    const selected = computeRoteiroMarkerModels([a, b], [], { selectedPointId: "pt_b" });
    expect(selected.find((m) => m.key === "pt_b")!.iconProps.selected).toBe(true);

    const drafting = computeRoteiroMarkerModels([a, b, c], [], { draft: draftOn("pt_a", ["pt_a"]), selectedPointId: "pt_b" });
    expect(drafting.find((m) => m.key === "pt_b")!.iconProps.selected).toBeFalsy();
  });

  // RF-006.4.23: during the edit the tap SELECTS (its own channel), the CTA edits.
  it("draftSelectedPointId highlights the tapped point — free OR member — DURING the draft (RF-006.4.23/.19)", () => {
    const models = computeRoteiroMarkerModels([a, b, c], [], { draft: draftOn("pt_a", ["pt_a"]), draftSelectedPointId: "pt_c" });
    const picked = models.find((m) => m.key === "pt_c")!;
    expect(picked.iconProps).toMatchObject({ selected: true, emphasis: true, highlight: true, ringStyle: "solid" });
    // A tapped MEMBER now highlights too (RF-006.19): it used to be inert.
    const memberAsPick = computeRoteiroMarkerModels([a, b], [], { draft: draftOn("pt_a", ["pt_a"]), draftSelectedPointId: "pt_a" });
    expect(memberAsPick.find((m) => m.key === "pt_a")!.iconProps.highlight).toBe(true);
  });

  it("circles carry NO tooltip while drafting — the tap selects, the panel informs (RF-006.4.23)", () => {
    const idle = computeRoteiroMarkerModels([a, b], []);
    expect(idle.every((m) => m.tooltipHtml)).toBe(true);

    const drafting = computeRoteiroMarkerModels([a, b, c], [], { draft: draftOn("pt_a", ["pt_a"]), candidateIds: ["pt_b"] });
    expect(drafting.filter((m) => m.kind === "address").every((m) => m.tooltipHtml === undefined)).toBe(true);
  });

  it("without opts renders plain type-colored circles + stop squares", () => {
    const models = computeRoteiroMarkerModels([a, b], [stop("stop_1", ["pt_a"])]);
    expect(models.map((m) => m.key)).toEqual(["stop_1", "pt_b"]);
    expect(models[1].iconProps).toMatchObject({ shape: "circle", color: ROTEIRO_TYPE_COLORS.indefinite, number: null });
  });

  it("editing a firmed stop (REOPEN draft) ungroups it — members as circles, no square (RF-006.4.9)", () => {
    const committed = stop("stop_pt_a", ["pt_a", "pt_b"]);
    const models = computeRoteiroMarkerModels([a, b, c], [committed], { draft: draftOn("pt_a", ["pt_a", "pt_b"]), candidateIds: ["pt_c"] });

    // The edited stop's square is gone; its members render as ordinal circles.
    expect(models.find((m) => m.key === "stop_pt_a")).toBeUndefined();
    const memberA = models.find((m) => m.key === "pt_a")!;
    const memberB = models.find((m) => m.key === "pt_b")!;
    expect(memberA.kind).toBe("address");
    expect(memberA.iconProps.number).toBe(UI_LABELS.MAP_PANEL.ORDINAL(1));
    expect(memberB.iconProps.number).toBe(UI_LABELS.MAP_PANEL.ORDINAL(2));
    // A radius candidate (not a member) shows dashed.
    expect(models.find((m) => m.key === "pt_c")!.iconProps.ringStyle).toBe("dashed");
  });

  it("expandedStopId renders that stop's members as numbered circles instead of the square (RF-006.4.8)", () => {
    const grouped = computeRoteiroMarkerModels([a, b, c], [stop("stop_1", ["pt_a", "pt_b"]), stop("stop_2", ["pt_c"], 2)]);
    // Agrupado: dois quadrados (stop_1, stop_2), sem os membros.
    expect(grouped.map((m) => m.kind)).toEqual(["stop", "stop"]);

    const expanded = computeRoteiroMarkerModels([a, b, c], [stop("stop_1", ["pt_a", "pt_b"]), stop("stop_2", ["pt_c"], 2)], { expandedStopId: "stop_1" });
    // stop_1 vira círculos numerados dos membros; stop_2 segue quadrado.
    const stop1Members = expanded.filter((m) => m.key === "pt_a" || m.key === "pt_b");
    expect(stop1Members).toHaveLength(2);
    expect(stop1Members.every((m) => m.kind === "address")).toBe(true);
    expect(stop1Members.map((m) => m.iconProps.number).sort()).toEqual([UI_LABELS.MAP_PANEL.ORDINAL(1), UI_LABELS.MAP_PANEL.ORDINAL(2)]);
    expect(expanded.find((m) => m.key === "stop_1")).toBeUndefined(); // sem o quadrado da parada expandida
    expect(expanded.find((m) => m.key === "stop_2")?.kind).toBe("stop"); // a outra segue agrupada
    // The anchor (1st member) stays HIGHLIGHTED with the group expanded (RF-006.4.15).
    const anchor = expanded.find((m) => m.iconProps.number === UI_LABELS.MAP_PANEL.ORDINAL(1))!;
    expect(anchor.iconProps.highlight).toBe(true);
    const secondMember = expanded.find((m) => m.iconProps.number === UI_LABELS.MAP_PANEL.ORDINAL(2))!;
    expect(secondMember.iconProps.highlight).toBeFalsy();
  });

  it("selectedMemberId highlights that member instead of the anchor (RF-006.4.16)", () => {
    const expanded = computeRoteiroMarkerModels([a, b, c], [stop("stop_1", ["pt_a", "pt_b"]), stop("stop_2", ["pt_c"], 2)], {
      expandedStopId: "stop_1",
      selectedMemberId: "pt_b",
    });
    // O membro tocado (pt_b) é o destacado; a âncora (pt_a) deixa de ser.
    const first = expanded.find((m) => m.key === "pt_a")!;
    const second = expanded.find((m) => m.key === "pt_b")!;
    expect(second.iconProps.highlight).toBe(true);
    expect(second.iconProps.emphasis).toBe(true);
    expect(first.iconProps.highlight).toBeFalsy();
    expect(first.iconProps.emphasis).toBeFalsy();
  });
});

describe("pointToStopItemData (Original-panel adapter — TASK-RF-006.4.1)", () => {
  const row = (seq: number, stop: number, address: string, spx = `SPX${seq}`) => ({
    [COLUMN_NAMES.SEQUENCE]: seq,
    [COLUMN_NAMES.STOP]: stop,
    [COLUMN_NAMES.DESTINATION_ADDRESS]: address,
    [COLUMN_NAMES.SPX_TN]: spx,
  });

  const multi: DeliveryPoint = {
    id: "pt_m",
    lat: -22.98,
    lng: -43.2,
    address: "Rua São Clemente, 283, Apt 602",
    packageCount: 2,
    packages: [
      { id: "SPX12", tracking: "SPX12", rawData: row(12, 27, "Rua São Clemente, 283, Apt 602") },
      { id: "SPX13", tracking: "SPX13", rawData: row(13, 27, "Rua São Clemente, 283, 702") },
    ],
  };

  it("speaks the Original panel's language: street+number line, per-package labels, no address complement on multi", () => {
    const item = pointToStopItemData(multi);
    expect(item.addressKey).toBe("pt_m");
    expect(item.addressLine).toBe("Rua São Clemente, 283");
    expect(item.complement).toBe(UI_LABELS.ROUTE_MAP.ADDRESS_SHEET.NO_COMPLEMENT); // multi → per-package only
    expect(item.markerNumber).toBe(""); // NEVER the Sequence (rev. 08/07) — empty for a free point
    expect(item.packageCount).toBe(2);
    expect(item.packages[0].label).toBe(UI_LABELS.MAP_PANEL.ITEM.PACKAGE_LABEL("27", "12"));
    expect(item.packages[0].spxTn).toBe("SPX12");
    expect(item.packages[0].complement).toBe("Apt 602");
    expect(item.packages[1].complement).toBe("702");
    expect(item.mapsUrl).toContain("-22.98");
  });

  it("carries the walking ORDINAL when the point belongs to a stop", () => {
    expect(pointToStopItemData(multi, { ordinal: 1 }).markerNumber).toBe("1º");
  });

  it("single-package point carries the address-level complement (same rule as the Original)", () => {
    const single: DeliveryPoint = { ...multi, id: "pt_s", packageCount: 1, packages: [multi.packages[0]] };
    expect(pointToStopItemData(single).complement).toBe("Apt 602");
  });
});

describe("pure helpers (TASK-RF-006.4.2)", () => {
  it("addressLineOf cuts to street + number", () => {
    expect(addressLineOf("Rua São Clemente, 283, Apt 602")).toBe("Rua São Clemente, 283");
    expect(addressLineOf("")).toBe(UI_LABELS.COMMON.NO_DATA);
  });

  it("stopPlaceSummaryFromPoints collects unique neighborhoods/zipcodes in visit order", () => {
    const p1: DeliveryPoint = { ...typedPt("p1", "Home"), packages: [{ id: "1", rawData: { [COLUMN_NAMES.NEIGHBORHOOD]: "Botafogo", [COLUMN_NAMES.ZIPCODE]: "22290-000" } }] };
    const p2: DeliveryPoint = { ...typedPt("p2", "Home"), packages: [{ id: "2", rawData: { [COLUMN_NAMES.NEIGHBORHOOD]: "Botafogo", [COLUMN_NAMES.ZIPCODE]: "22290-001" } }] };
    expect(stopPlaceSummaryFromPoints([p1, p2])).toEqual({ neighborhoods: ["Botafogo"], zipcodes: ["22290-000", "22290-001"] });
  });

  it("legLabel: perna → 'X metros'; sem grafo ganha '(linha reta)' (RF-006.10)", () => {
    const street = legLabel({ meters: 110, viaStreets: true });
    expect(street).toBe("110 metros");
    expect(street).not.toContain("linha reta");
    expect(legLabel({ meters: 110, viaStreets: false })).toContain(UI_LABELS.MAP_PANEL.ROTEIRO_START.SUGGESTION_STRAIGHT);
  });

  it("legLabel: arredonda os metros (RF-006.10)", () => {
    expect(legLabel({ meters: 24.6, viaStreets: true })).toBe("25 metros");
  });

  it("walkEstimateLabel drops negligible meters (< 20 m)", () => {
    expect(walkEstimateLabel({ meters: 3, minutes: 2 })).toBe(UI_LABELS.MAP_PANEL.ROTEIRO_DRAFT.ESTIMATE_TIME_ONLY(2));
    expect(walkEstimateLabel({ meters: 850, minutes: 12 })).toContain("850 m");
    expect(walkEstimateLabel({ meters: 850, minutes: 12 })).toContain("a pé");
  });

  it("orderedStopPoints resolves the stop's ids in walking order, defensively", () => {
    const p1 = typedPt("p1", "Home");
    const byId = new Map([["p1", p1]]);
    expect(orderedStopPoints(stop("s", ["p1", "ghost"]), byId)).toEqual([p1]);
  });

  it("packagesByTypeFromPoints mirrors the Original's typed counts (RF-006.4.3)", () => {
    const home = typedPt("p1", "Home");
    const office = typedPt("p2", "Office");
    const mixed: DeliveryPoint = {
      ...typedPt("p3", "Home"),
      packageCount: 2,
      packages: [
        { id: "a", rawData: { [COLUMN_NAMES.LOCATION_TYPE]: "Home" } },
        { id: "b", rawData: {} },
      ],
    };
    expect(packagesByTypeFromPoints([home, office, mixed])).toEqual({ commercial: 1, residential: 2, indefinite: 1 });
    expect(packagesByTypeFromPoints([])).toEqual({ commercial: 0, residential: 0, indefinite: 0 });
  });
});

describe("mapsDirectionsUrl", () => {
  it("builds a Google Maps DIRECTIONS url to the coordinate (RF-006.9)", () => {
    expect(mapsDirectionsUrl({ lat: -22.95, lng: -43.19 })).toBe("https://www.google.com/maps/dir/?api=1&destination=-22.95,-43.19");
  });
});
