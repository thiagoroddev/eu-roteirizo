/**
 * Tests for groupRowsByStop — the Stop → Address → packages grouping (RF-020.2, ADR-008).
 *
 * Pure logic (no Leaflet/DOM). Coordinates must fall inside MAP_CONFIG.RIO_BOUNDS
 * (lat -23.02..-22.74, lng -43.42..-43.08) to be plottable.
 */

import { describe, it, expect } from "vitest";
import { groupRowsByStop } from "../../../utils/markers/stopGrouping";
import { COLUMN_NAMES, ICON_KEYS } from "../../../constants";
import type { RowData } from "../../../types";

/** Builds a row with sensible defaults; address text drives the inferred type. */
const row = (over: Partial<Record<string, unknown>>): RowData => ({
  [COLUMN_NAMES.LATITUDE]: -22.9,
  [COLUMN_NAMES.LONGITUDE]: -43.2,
  [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Sem Complemento, 50",
  ...over,
});

describe("groupRowsByStop", () => {
  it("groups packages at the same building into one address (circle, packages badge)", () => {
    const rows = [row({ [COLUMN_NAMES.STOP]: 7, [COLUMN_NAMES.SEQUENCE]: 7, [COLUMN_NAMES.SPX_TN]: "BR1" }), row({ [COLUMN_NAMES.STOP]: 7, [COLUMN_NAMES.SEQUENCE]: 9, [COLUMN_NAMES.SPX_TN]: "BR2" })];
    const stops = groupRowsByStop(rows);
    expect(stops).toHaveLength(1);
    expect(stops[0].addresses).toHaveLength(1);
    expect(stops[0].addresses[0].rows).toHaveLength(2); // two packages, one building
  });

  it("merges same-building packages (different complement / slightly different coords) into one address", () => {
    const rows = [
      row({
        [COLUMN_NAMES.STOP]: 7,
        [COLUMN_NAMES.SEQUENCE]: 1,
        [COLUMN_NAMES.LATITUDE]: -22.9,
        [COLUMN_NAMES.LONGITUDE]: -43.2,
        [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua X, 47, Apt 202",
        [COLUMN_NAMES.SPX_TN]: "P1",
      }),
      row({
        [COLUMN_NAMES.STOP]: 7,
        [COLUMN_NAMES.SEQUENCE]: 2,
        [COLUMN_NAMES.LATITUDE]: -22.90001,
        [COLUMN_NAMES.LONGITUDE]: -43.20001,
        [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua X, 47, Loja 1",
        [COLUMN_NAMES.SPX_TN]: "P2",
      }),
    ];
    const stops = groupRowsByStop(rows);
    expect(stops[0].addresses).toHaveLength(1); // one building → one icon
    expect(stops[0].addresses[0].rows).toHaveLength(2); // both packages on it (popup lists each)
  });

  it("treats distinct buildings (street + number) as distinct addresses", () => {
    const rows = [
      row({ [COLUMN_NAMES.STOP]: 7, [COLUMN_NAMES.SEQUENCE]: 7, [COLUMN_NAMES.LATITUDE]: -22.9, [COLUMN_NAMES.LONGITUDE]: -43.2, [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Um, 10" }),
      row({ [COLUMN_NAMES.STOP]: 7, [COLUMN_NAMES.SEQUENCE]: 9, [COLUMN_NAMES.LATITUDE]: -22.91, [COLUMN_NAMES.LONGITUDE]: -43.21, [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Dois, 20" }),
    ];
    const stops = groupRowsByStop(rows);
    expect(stops).toHaveLength(1);
    expect(stops[0].addresses).toHaveLength(2);
  });

  it("picks the representative as the lowest sequence among VALID-coordinate addresses", () => {
    const rows = [
      // Lowest sequence (1) but invalid coordinate → dropped, must NOT be the representative.
      row({ [COLUMN_NAMES.STOP]: 7, [COLUMN_NAMES.SEQUENCE]: 1, [COLUMN_NAMES.LATITUDE]: "invalid", [COLUMN_NAMES.LONGITUDE]: null, [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Inval, 1" }),
      row({ [COLUMN_NAMES.STOP]: 7, [COLUMN_NAMES.SEQUENCE]: 5, [COLUMN_NAMES.LATITUDE]: -22.9, [COLUMN_NAMES.LONGITUDE]: -43.2, [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Cinco, 5" }),
      row({ [COLUMN_NAMES.STOP]: 7, [COLUMN_NAMES.SEQUENCE]: 2, [COLUMN_NAMES.LATITUDE]: -22.91, [COLUMN_NAMES.LONGITUDE]: -43.21, [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Dois, 2" }),
    ];
    const stops = groupRowsByStop(rows);
    expect(stops).toHaveLength(1);
    expect(stops[0].addresses).toHaveLength(2); // invalid one dropped
    expect(stops[0].representative.minSequence).toBe(2);
  });

  it("applies 'commercial wins' to the stop type", () => {
    const rows = [
      row({ [COLUMN_NAMES.STOP]: 7, [COLUMN_NAMES.SEQUENCE]: 7, [COLUMN_NAMES.LATITUDE]: -22.9, [COLUMN_NAMES.LONGITUDE]: -43.2, [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua A, 10, Apt 30" }),
      row({ [COLUMN_NAMES.STOP]: 7, [COLUMN_NAMES.SEQUENCE]: 9, [COLUMN_NAMES.LATITUDE]: -22.91, [COLUMN_NAMES.LONGITUDE]: -43.21, [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua B, 20, Loja 5" }),
    ];
    const stops = groupRowsByStop(rows);
    expect(stops[0].type).toBe(ICON_KEYS.OFFICE_CORRECTED);
  });

  it("makes each empty/absent Stop row its own marker with no number", () => {
    const rows = [
      row({ [COLUMN_NAMES.SEQUENCE]: 1, [COLUMN_NAMES.LATITUDE]: -22.9, [COLUMN_NAMES.LONGITUDE]: -43.2 }), // no Stop
      row({ [COLUMN_NAMES.STOP]: "", [COLUMN_NAMES.SEQUENCE]: 2, [COLUMN_NAMES.LATITUDE]: -22.91, [COLUMN_NAMES.LONGITUDE]: -43.21 }), // blank Stop
    ];
    const stops = groupRowsByStop(rows);
    expect(stops).toHaveLength(2);
    expect(stops.every((s) => s.hasStop === false)).toBe(true);
    expect(stops.every((s) => s.addresses.length === 1)).toBe(true);
  });

  it("flags a dispersed stop (representative > 100 m from a far address)", () => {
    const rows = [
      row({ [COLUMN_NAMES.STOP]: 7, [COLUMN_NAMES.SEQUENCE]: 1, [COLUMN_NAMES.LATITUDE]: -22.9, [COLUMN_NAMES.LONGITUDE]: -43.2, [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Perto, 1" }),
      row({ [COLUMN_NAMES.STOP]: 7, [COLUMN_NAMES.SEQUENCE]: 2, [COLUMN_NAMES.LATITUDE]: -22.92, [COLUMN_NAMES.LONGITUDE]: -43.2, [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Longe, 2" }), // ~2.2 km away, distinct building
    ];
    const stops = groupRowsByStop(rows);
    expect(stops[0].maxDispersionMeters).toBeGreaterThan(100);
  });

  it("keeps two stops at nearby coordinates as two separate markers (cluster click safety)", () => {
    const rows = [
      row({ [COLUMN_NAMES.STOP]: 7, [COLUMN_NAMES.SEQUENCE]: 7, [COLUMN_NAMES.LATITUDE]: -22.9, [COLUMN_NAMES.LONGITUDE]: -43.2 }),
      row({ [COLUMN_NAMES.STOP]: 8, [COLUMN_NAMES.SEQUENCE]: 8, [COLUMN_NAMES.LATITUDE]: -22.9001, [COLUMN_NAMES.LONGITUDE]: -43.2001 }),
    ];
    const stops = groupRowsByStop(rows);
    expect(stops).toHaveLength(2);
    expect(stops.map((s) => s.stop)).toEqual(["7", "8"]);
  });

  it("drops a stop entirely when all its rows have invalid coordinates", () => {
    const rows = [row({ [COLUMN_NAMES.STOP]: 7, [COLUMN_NAMES.LATITUDE]: "x", [COLUMN_NAMES.LONGITUDE]: "y" })];
    expect(groupRowsByStop(rows)).toHaveLength(0);
  });
});
