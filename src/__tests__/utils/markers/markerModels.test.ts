/**
 * Tests for markerModels — interaction view-models + transitions + address helpers
 * (RF-020.3; popup HTML replaced by the AddressSheet in TASK-RF-022.6).
 *
 * Pure logic. Stops are built with the real groupRowsByStop for realistic fixtures.
 */

import { describe, it, expect } from "vitest";
import { groupRowsByStop } from "../../../utils/markers/stopGrouping";
import {
  computeMarkerModels,
  nextInteraction,
  focusInteraction,
  expandInteraction,
  regroupInteraction,
  collapseInteraction,
  findAddressByKey,
  firstAddressKey,
  extractComplement,
  locationTypeLabel,
} from "../../../utils/markers/markerModels";
import { COLUMN_NAMES, ICON_KEYS } from "../../../constants";
import type { RowData } from "../../../types";

const row = (over: Partial<Record<string, unknown>>): RowData => ({
  [COLUMN_NAMES.LATITUDE]: -22.9,
  [COLUMN_NAMES.LONGITUDE]: -43.2,
  ...over,
});

// Stop 18 with three addresses (commercial seq 49, residential x2 seq 50, indefinite seq 51)
// and Stop 7 with a single residential address.
const rows: RowData[] = [
  row({
    [COLUMN_NAMES.STOP]: 18,
    [COLUMN_NAMES.SEQUENCE]: 49,
    [COLUMN_NAMES.LATITUDE]: -22.9,
    [COLUMN_NAMES.LONGITUDE]: -43.2,
    [COLUMN_NAMES.SPX_TN]: "BR-A",
    [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua X, 100, Loja 5",
    [COLUMN_NAMES.NEIGHBORHOOD]: "Centro",
    [COLUMN_NAMES.ZIPCODE]: "20000-000",
  }),
  row({
    [COLUMN_NAMES.STOP]: 18,
    [COLUMN_NAMES.SEQUENCE]: 50,
    [COLUMN_NAMES.LATITUDE]: -22.901,
    [COLUMN_NAMES.LONGITUDE]: -43.201,
    [COLUMN_NAMES.SPX_TN]: "BR-B1",
    [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Y, 200, Apt 8",
  }),
  row({
    [COLUMN_NAMES.STOP]: 18,
    [COLUMN_NAMES.SEQUENCE]: 53,
    [COLUMN_NAMES.LATITUDE]: -22.901,
    [COLUMN_NAMES.LONGITUDE]: -43.201,
    [COLUMN_NAMES.SPX_TN]: "BR-B2",
    [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Y, 200, Apt 8",
  }),
  row({
    [COLUMN_NAMES.STOP]: 18,
    [COLUMN_NAMES.SEQUENCE]: 51,
    [COLUMN_NAMES.LATITUDE]: -22.902,
    [COLUMN_NAMES.LONGITUDE]: -43.202,
    [COLUMN_NAMES.SPX_TN]: "BR-C",
    [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Z, 300",
  }),
  row({
    [COLUMN_NAMES.STOP]: 7,
    [COLUMN_NAMES.SEQUENCE]: 7,
    [COLUMN_NAMES.LATITUDE]: -22.91,
    [COLUMN_NAMES.LONGITUDE]: -43.18,
    [COLUMN_NAMES.SPX_TN]: "BR-7",
    [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua W, 10, Apt 1",
  }),
];

const stops = groupRowsByStop(rows);

describe("computeMarkerModels", () => {
  it("renders every stop as a square when nothing is expanded", () => {
    const models = computeMarkerModels(stops, null, null);
    expect(models).toHaveLength(2);
    expect(models.every((m) => m.kind === "stop")).toBe(true);
    expect(models.every((m) => m.iconProps.shape === "square")).toBe(true);
    expect(models[0].iconProps.number).toBe("18");
    expect(models[0].iconProps.badge).toEqual({ kind: "addresses", count: 3 });
    expect(models[0].tooltipHtml).toContain("Parada:");
  });

  it("expands one stop into address circles; every circle shows the stop number", () => {
    const models = computeMarkerModels(stops, "0", null);
    const addresses = models.filter((m) => m.kind === "address");
    const squares = models.filter((m) => m.kind === "stop");
    expect(addresses).toHaveLength(3);
    expect(squares).toHaveLength(1); // stop 7 stays a square
    expect(addresses.every((m) => m.iconProps.shape === "circle")).toBe(true);
    // Every circle of stop 18 shows "18" → clearly the same stop.
    expect(addresses.map((m) => m.iconProps.number)).toEqual(["18", "18", "18"]);
    // The 2-package address gets a packages badge; the single-package ones do not.
    expect(addresses[1].iconProps.badge).toEqual({ kind: "packages", count: 2 });
    expect(addresses[0].iconProps.badge).toBeNull();
    // Every address model carries its key — the AddressSheet resolves detail from it.
    expect(addresses.every((m) => typeof m.addressKey === "string")).toBe(true);
  });

  it("gives every focused address the white border; only the selected one is emphasized", () => {
    const models = computeMarkerModels(stops, "0", "0:1");
    const addresses = models.filter((m) => m.kind === "address");
    expect(addresses.every((m) => m.iconProps.selected === true)).toBe(true);
    expect(addresses[1].iconProps.emphasis).toBe(true);
    expect(addresses[0].iconProps.emphasis).toBeFalsy();
    expect(addresses[2].iconProps.emphasis).toBeFalsy();
  });

  it("expands a single-address stop into one numbered circle (white border + emphasis when selected)", () => {
    const models = computeMarkerModels(stops, "1", "1:0");
    const addresses = models.filter((m) => m.kind === "address");
    expect(addresses).toHaveLength(1);
    expect(addresses[0].iconProps.number).toBe("7");
    expect(addresses[0].iconProps.selected).toBe(true);
    expect(addresses[0].iconProps.emphasis).toBe(true); // selected → emphasized even alone (consistent look)
  });
});

describe("nextInteraction (single click — RF-006.4.10)", () => {
  const collapsed = { expandedStopKey: null, selectedAddressKey: null };

  it("single click FOCUSES a stop (stays GROUPED) selecting its first address", () => {
    const stopModel = computeMarkerModels(stops, null, null)[0];
    // Stop 18: seq 49 lives at address index 0. Grouped → expandedStopKey stays null.
    expect(nextInteraction(collapsed, stopModel, stops)).toEqual({ expandedStopKey: null, selectedAddressKey: "0:0" });
  });

  it("focus of a single-address stop still selects its only address, grouped", () => {
    const stopModel = computeMarkerModels(stops, null, null)[1]; // stop 7
    expect(nextInteraction(collapsed, stopModel, stops)).toEqual({ expandedStopKey: null, selectedAddressKey: "1:0" });
  });

  it("clicking an address selects it while keeping the stop expanded", () => {
    const addressModel = computeMarkerModels(stops, "0", null).filter((m) => m.kind === "address")[2];
    expect(nextInteraction({ expandedStopKey: "0", selectedAddressKey: null }, addressModel, stops)).toEqual({ expandedStopKey: "0", selectedAddressKey: "0:2" });
  });
});

describe("focus / expand / regroup transitions (RF-006.4.10)", () => {
  it("focusInteraction keeps the stop grouped (expandedStopKey null) with its first address", () => {
    expect(focusInteraction(0, stops)).toEqual({ expandedStopKey: null, selectedAddressKey: "0:0" });
  });

  it("expandInteraction ungroups the stop into its addresses", () => {
    expect(expandInteraction(0, stops)).toEqual({ expandedStopKey: "0", selectedAddressKey: "0:0" });
  });

  it("regroupInteraction collapses the expansion but KEEPS the focus", () => {
    expect(regroupInteraction({ expandedStopKey: "0", selectedAddressKey: "0:2" })).toEqual({ expandedStopKey: null, selectedAddressKey: "0:2" });
  });

  it("collapseInteraction is the full reset (both null) — used on mode change", () => {
    expect(collapseInteraction()).toEqual({ expandedStopKey: null, selectedAddressKey: null });
  });

  it("the FOCUSED-but-collapsed stop's square gets the emphasis", () => {
    const models = computeMarkerModels(stops, null, "0:0");
    const square = models.find((m) => m.key === "0")!;
    expect(square.kind).toBe("stop");
    expect(square.iconProps.selected).toBe(true);
    // A different stop's square stays unemphasized.
    expect(models.find((m) => m.key === "1")!.iconProps.selected).toBe(false);
  });

  it("highlightedStopKey emphasizes + HIGHLIGHTS the panel's stop square even without a click (RF-006.4.13/.4.14)", () => {
    // No selection at all, but the panel points at stop index 1 → its square rings + enlarges.
    const models = computeMarkerModels(stops, null, null, "1");
    const square = models.find((m) => m.key === "1")!;
    expect(square.iconProps.selected).toBe(true);
    expect(square.iconProps.highlight).toBe(true); // RouteMap enlarges + raises it
    const other = models.find((m) => m.key === "0")!;
    expect(other.iconProps.selected).toBe(false);
    expect(other.iconProps.highlight).toBeFalsy();
  });

  it("the SELECTED expanded address is highlighted; its siblings are not (RF-006.4.14)", () => {
    const models = computeMarkerModels(stops, "0", "0:1").filter((m) => m.kind === "address");
    expect(models.find((m) => m.addressKey === "0:1")!.iconProps.highlight).toBe(true);
    expect(models.find((m) => m.addressKey === "0:0")!.iconProps.highlight).toBeFalsy();
  });
});

describe("firstAddressKey", () => {
  it("returns the LOWEST-Sequence address of the stop, even when grouped later", () => {
    // Second row appears later but has the smaller sequence.
    const reordered = groupRowsByStop([
      row({ [COLUMN_NAMES.STOP]: 1, [COLUMN_NAMES.SEQUENCE]: 9, [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Nove, 9" }),
      row({ [COLUMN_NAMES.STOP]: 1, [COLUMN_NAMES.SEQUENCE]: 2, [COLUMN_NAMES.LATITUDE]: -22.91, [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Dois, 2" }),
    ]);
    expect(firstAddressKey(reordered, 0)).toBe("0:1");
  });

  it("returns null for an unknown stop index", () => {
    expect(firstAddressKey([], 0)).toBeNull();
  });
});

describe("findAddressByKey", () => {
  it("resolves a valid key to its stop and address", () => {
    const found = findAddressByKey(stops, "0:1");
    expect(found).not.toBeNull();
    expect(found!.stop).toBe(stops[0]);
    expect(found!.address).toBe(stops[0].addresses[1]);
  });

  it("returns null for a null key", () => {
    expect(findAddressByKey(stops, null)).toBeNull();
  });

  it("returns null for malformed or out-of-range keys (stale selection safety)", () => {
    for (const key of ["x", "0", "0:x", "0:9", "9:0", "0:-1", "0:1:2"]) {
      expect(findAddressByKey(stops, key)).toBeNull();
    }
  });
});

describe("address helpers", () => {
  it("extractComplement reads the text after the 2nd comma, '—' when absent", () => {
    expect(extractComplement(stops[0].addresses[1])).toBe("Apt 8");
    expect(extractComplement(stops[0].addresses[2])).toBe("—"); // "Rua Z, 300" has no complement
  });

  it("locationTypeLabel maps ICON_KEYS to text", () => {
    expect(locationTypeLabel(ICON_KEYS.OFFICE_CORRECTED)).toBe("Comercial");
    expect(locationTypeLabel(ICON_KEYS.HOME_CORRECTED)).toBe("Residencial");
    expect(locationTypeLabel(ICON_KEYS.INDEFINITE)).toBe("Indefinido");
  });
});
