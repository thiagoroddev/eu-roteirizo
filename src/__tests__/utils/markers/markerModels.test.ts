/**
 * Tests for markerModels — interaction view-models + transitions + popup (RF-020.3).
 *
 * Pure logic. Stops are built with the real groupRowsByStop for realistic fixtures.
 */

import { describe, it, expect } from "vitest";
import { groupRowsByStop } from "../../../utils/markers/stopGrouping";
import { computeMarkerModels, nextInteraction, collapseInteraction, buildAddressPopupHtml, extractComplement, locationTypeLabel } from "../../../utils/markers/markerModels";
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
    expect(addresses.every((m) => typeof m.popupHtml === "string")).toBe(true);
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

describe("nextInteraction", () => {
  const collapsed = { expandedStopKey: null, selectedAddressKey: null };

  it("expands a multi-address stop without selecting", () => {
    const stopModel = computeMarkerModels(stops, null, null)[0];
    expect(nextInteraction(collapsed, stopModel, stops)).toEqual({ expandedStopKey: "0", selectedAddressKey: null });
  });

  it("auto-selects the single address when expanding a single-address stop", () => {
    const stopModel = computeMarkerModels(stops, null, null)[1]; // stop 7
    expect(nextInteraction(collapsed, stopModel, stops)).toEqual({ expandedStopKey: "1", selectedAddressKey: "1:0" });
  });

  it("selects an address while keeping the stop expanded", () => {
    const addressModel = computeMarkerModels(stops, "0", null).filter((m) => m.kind === "address")[2];
    expect(nextInteraction({ expandedStopKey: "0", selectedAddressKey: null }, addressModel, stops)).toEqual({ expandedStopKey: "0", selectedAddressKey: "0:2" });
  });

  it("collapse clears both expansion and selection", () => {
    expect(collapseInteraction()).toEqual({ expandedStopKey: null, selectedAddressKey: null });
  });
});

describe("buildAddressPopupHtml / helpers", () => {
  it("lists the packages (SPX TN + seq), address, complement and type text", () => {
    const stop18 = stops[0];
    const addressB = stop18.addresses[1]; // 2 packages, residential, "Apt 8"
    const html = buildAddressPopupHtml(addressB);
    expect(html).toContain("BR-B1");
    expect(html).toContain("BR-B2");
    expect(html).toContain("Rua Y, 200, Apt 8");
    expect(html).toContain("Apt 8"); // complement
    expect(html).toContain("Residencial"); // type in text
    expect(html).toContain("Pacotes (2)");
    expect(html).toContain("Abrir no Google Maps");
  });

  it("escapes untrusted spreadsheet content in the popup", () => {
    const malicious = groupRowsByStop([
      row({ [COLUMN_NAMES.STOP]: 1, [COLUMN_NAMES.SEQUENCE]: 1, [COLUMN_NAMES.SPX_TN]: "<img src=x onerror=alert(1)>", [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua A, 1, Apt 1" }),
    ]);
    const html = buildAddressPopupHtml(malicious[0].addresses[0]);
    expect(html).not.toContain("<img src=x");
    expect(html).toContain("&lt;img");
  });

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
