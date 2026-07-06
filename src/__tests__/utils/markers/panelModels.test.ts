import { describe, it, expect } from "vitest";
import { groupRowsByStop } from "../../../utils/markers/stopGrouping";
import { adjacentStopKey, panelMetrics, smallestStopKey } from "../../../utils/markers/panelModels";
import { COLUMN_NAMES } from "../../../constants";
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
