import { describe, it, expect } from "vitest";
import { groupRowsByStop } from "../../../utils/markers/stopGrouping";
import { smallestStopKey } from "../../../utils/markers/panelModels";
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
