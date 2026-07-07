import { describe, it, expect } from "vitest";
import { groupRowsByStop } from "../../../utils/markers/stopGrouping";
import { adjacentStopKey, buildPanelItems, panelMetrics, smallestStopKey } from "../../../utils/markers/panelModels";
import { COLUMN_NAMES, UI_LABELS } from "../../../constants";
import type { RowData } from "../../../types";

const row = (stop: unknown, seq: number): RowData => ({
  [COLUMN_NAMES.STOP]: stop,
  [COLUMN_NAMES.SEQUENCE]: seq,
  [COLUMN_NAMES.LATITUDE]: -22.9 - seq / 1000,
  [COLUMN_NAMES.LONGITUDE]: -43.2,
  [COLUMN_NAMES.DESTINATION_ADDRESS]: `Rua ${seq}, ${seq}`,
});

describe("smallestStopKey", () => {
  it("picks the NUMERICALLY smallest stop (not lexicographic)", () => {
    // "10" < "2" lexicographically — numeric order must win.
    const stops = groupRowsByStop([row(10, 1), row(2, 2)]);
    const index = Number(smallestStopKey(stops));
    expect(stops[index].stop).toBe("2");
  });

  it("falls back to the first stop when no stop is numeric", () => {
    const stops = groupRowsByStop([row("", 1), row("", 2)]);
    expect(smallestStopKey(stops)).toBe("0");
  });

  it("returns null for an empty list", () => {
    expect(smallestStopKey([])).toBeNull();
  });

  it("ignores non-numeric stops when a numeric one exists", () => {
    const stops = groupRowsByStop([row("", 1), row(7, 2)]);
    const index = Number(smallestStopKey(stops));
    expect(stops[index].stop).toBe("7");
  });
});

describe("adjacentStopKey", () => {
  /** Appearance order: index 0 = stop 10, 1 = stop 2, 2 = stop 5. Navigation order: 2 → 5 → 10. */
  const stops = groupRowsByStop([row(10, 1), row(2, 2), row(5, 3)]);
  const keyOf = (stopNumber: string): string => String(stops.findIndex((s) => s.stop === stopNumber));

  it("walks the NUMERIC stop order, not the appearance/lexicographic one", () => {
    expect(adjacentStopKey(stops, keyOf("2"), 1)).toBe(keyOf("5"));
    expect(adjacentStopKey(stops, keyOf("5"), 1)).toBe(keyOf("10"));
  });

  it("is circular in both directions", () => {
    expect(adjacentStopKey(stops, keyOf("10"), 1)).toBe(keyOf("2"));
    expect(adjacentStopKey(stops, keyOf("2"), -1)).toBe(keyOf("10"));
  });

  it("puts numberless stops at the end of the cycle", () => {
    const mixed = groupRowsByStop([row("", 1), row(3, 2)]);
    const noStopKey = String(mixed.findIndex((s) => !s.hasStop));
    const numericKey = String(mixed.findIndex((s) => s.stop === "3"));
    expect(adjacentStopKey(mixed, numericKey, 1)).toBe(noStopKey);
    expect(adjacentStopKey(mixed, noStopKey, 1)).toBe(numericKey);
  });

  it("falls back to the smallest stop when currentKey is null or unknown", () => {
    expect(adjacentStopKey(stops, null, 1)).toBe(keyOf("2"));
    expect(adjacentStopKey(stops, "999", -1)).toBe(keyOf("2"));
  });

  it("returns the stop itself when it is the only one", () => {
    const single = groupRowsByStop([row(4, 1)]);
    expect(adjacentStopKey(single, "0", 1)).toBe("0");
    expect(adjacentStopKey(single, "0", -1)).toBe("0");
  });

  it("returns null for an empty list", () => {
    expect(adjacentStopKey([], null, 1)).toBeNull();
  });
});

describe("buildPanelItems", () => {
  const rowsStop7: RowData[] = [
    // Two packages at the SAME building (merge into one address, minSequence 2)…
    {
      [COLUMN_NAMES.STOP]: 7,
      [COLUMN_NAMES.SEQUENCE]: 9,
      [COLUMN_NAMES.LATITUDE]: -22.9,
      [COLUMN_NAMES.LONGITUDE]: -43.2,
      [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Alfa, 10, casa 2",
      [COLUMN_NAMES.SPX_TN]: "BR111",
      [COLUMN_NAMES.NEIGHBORHOOD]: "Botafogo",
      [COLUMN_NAMES.ZIPCODE]: "22271-110",
    },
    {
      [COLUMN_NAMES.STOP]: 7,
      [COLUMN_NAMES.SEQUENCE]: 2,
      [COLUMN_NAMES.LATITUDE]: -22.9,
      [COLUMN_NAMES.LONGITUDE]: -43.2,
      [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Alfa, 10, casa 2",
      [COLUMN_NAMES.SPX_TN]: "BR222",
    },
    // …and another address with a SMALLER sequence than the first row (1 < 9),
    // appearing later — the ordering must follow minSequence, not appearance.
    {
      [COLUMN_NAMES.STOP]: 7,
      [COLUMN_NAMES.SEQUENCE]: 1,
      [COLUMN_NAMES.LATITUDE]: -22.91,
      [COLUMN_NAMES.LONGITUDE]: -43.21,
      [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Beta, 20",
      [COLUMN_NAMES.SPX_TN]: "BR333",
    },
  ];

  it("orders the stop's addresses by their smallest Sequence", () => {
    const items = buildPanelItems(groupRowsByStop(rowsStop7), "0");

    expect(items.map((item) => item.addressLine)).toEqual(["Rua Beta, 20", "Rua Alfa, 10, casa 2"]);
    expect(items.map((item) => item.markerNumber)).toEqual(["1", "2"]);
  });

  it("keeps the map identity (addressKey i:j of the ORIGINAL index) after sorting", () => {
    const stops = groupRowsByStop(rowsStop7);
    const items = buildPanelItems(stops, "0");

    // "Rua Beta" was grouped second (j = 1) but sorts first.
    expect(items[0].addressKey).toBe("0:1");
    expect(items[1].addressKey).toBe("0:0");
  });

  it("maps the full detail: complement, neighborhood/zipcode and one package row per spreadsheet row", () => {
    const items = buildPanelItems(groupRowsByStop(rowsStop7), "0");
    const alfa = items[1];

    expect(alfa.complement).toBe("casa 2");
    expect(alfa.neighborhood).toBe("Botafogo");
    expect(alfa.zipcode).toBe("22271-110");
    expect(alfa.packageCount).toBe(2);
    expect(alfa.packages.map((pkg) => pkg.spxTn)).toEqual(["BR111", "BR222"]);
    expect(alfa.packages[0].label).toBe(UI_LABELS.MAP_PANEL.ITEM.PACKAGE_LABEL("7", "9"));
    expect(alfa.mapsUrl).toContain("google.com/maps");
  });

  it("omits the stop from the package label when the Stop column is absent", () => {
    const noStop: RowData[] = [
      { [COLUMN_NAMES.SEQUENCE]: 4, [COLUMN_NAMES.LATITUDE]: -22.9, [COLUMN_NAMES.LONGITUDE]: -43.2, [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Gama, 30", [COLUMN_NAMES.SPX_TN]: "BR444" },
    ];
    const items = buildPanelItems(groupRowsByStop(noStop), "0");

    expect(items[0].packages[0].label).toBe(UI_LABELS.MAP_PANEL.ITEM.PACKAGE_LABEL(null, "4"));
  });

  it("returns [] for a null or out-of-range stop key", () => {
    const stops = groupRowsByStop(rowsStop7);
    expect(buildPanelItems(stops, null)).toEqual([]);
    expect(buildPanelItems(stops, "99")).toEqual([]);
  });
});

describe("panelMetrics", () => {
  it("counts addresses and total packages (rows) of the stop", () => {
    // Stop 1: two rows at the SAME building (merge into one address) + one other address.
    const sameBuilding: RowData = { ...row(1, 1), [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Una, 100" };
    const sameBuildingAgain: RowData = { ...row(1, 2), [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Una, 100" };
    const other: RowData = { ...row(1, 3), [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Outra, 200" };
    const stops = groupRowsByStop([sameBuilding, sameBuildingAgain, other]);

    expect(panelMetrics(stops[0])).toEqual({ addressCount: 2, packageCount: 3 });
  });

  it("returns zeros for null (defensive)", () => {
    expect(panelMetrics(null)).toEqual({ addressCount: 0, packageCount: 0 });
  });
});
