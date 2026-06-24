import { describe, it, expect } from "vitest";
import { buildDeliveryPoints } from "../../../utils/routing/points";
import { COLUMN_NAMES } from "../../../constants";

// Real Shopee-style coordinates need 7 decimals so parseCoordinate round-trips.
const row = (over: Record<string, unknown> = {}) => ({
  [COLUMN_NAMES.LATITUDE]: -22.9500637,
  [COLUMN_NAMES.LONGITUDE]: -43.1908188,
  [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua São Clemente, 261",
  [COLUMN_NAMES.SPX_TN]: "BR123",
  ...over,
});

describe("buildDeliveryPoints", () => {
  it("merges rows at the same coordinate into one multi-package point", () => {
    const pts = buildDeliveryPoints([row({ [COLUMN_NAMES.SPX_TN]: "BR1" }), row({ [COLUMN_NAMES.SPX_TN]: "BR2" })]);

    expect(pts).toHaveLength(1);
    expect(pts[0].packageCount).toBe(2);
    expect(pts[0].packages.map((p) => p.tracking)).toEqual(["BR1", "BR2"]);
  });

  it("keeps distinct coordinates as separate points", () => {
    const pts = buildDeliveryPoints([row(), row({ [COLUMN_NAMES.LATITUDE]: -22.9851234, [COLUMN_NAMES.LONGITUDE]: -43.1985678 })]);

    expect(pts).toHaveLength(2);
  });

  it("skips rows without a plottable coordinate", () => {
    const pts = buildDeliveryPoints([row(), row({ [COLUMN_NAMES.LATITUDE]: "" })]);

    expect(pts).toHaveLength(1);
  });

  it("uses SPX TN as the package id, falling back when absent", () => {
    const withTn = buildDeliveryPoints([row({ [COLUMN_NAMES.SPX_TN]: "BRXYZ" })]);
    expect(withTn[0].packages[0].id).toBe("BRXYZ");
    expect(withTn[0].packages[0].tracking).toBe("BRXYZ");

    const noTn = buildDeliveryPoints([row({ [COLUMN_NAMES.SPX_TN]: "" })]);
    expect(noTn[0].packages[0].id).toContain("pt_");
    expect(noTn[0].packages[0].tracking).toBeUndefined();
  });

  it("captures the address from Destination Address", () => {
    const pts = buildDeliveryPoints([row()]);
    expect(pts[0].address).toBe("Rua São Clemente, 261");
  });
});
