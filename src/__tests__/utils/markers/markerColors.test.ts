/**
 * Tests for colorForLocationType — the Original-mode type→color map (RF-020.2, ADR-008).
 */

import { describe, it, expect } from "vitest";
import { colorForLocationType, ORIGINAL_MARKER_COLORS } from "../../../utils/markers/markerColors";
import { ICON_KEYS } from "../../../constants";

describe("colorForLocationType", () => {
  it("maps commercial keys (office) to the blue palette", () => {
    expect(colorForLocationType(ICON_KEYS.OFFICE)).toBe(ORIGINAL_MARKER_COLORS.commercial);
    expect(colorForLocationType(ICON_KEYS.OFFICE_CORRECTED)).toBe(ORIGINAL_MARKER_COLORS.commercial);
  });

  it("maps residential keys (home) to the green palette", () => {
    expect(colorForLocationType(ICON_KEYS.HOME)).toBe(ORIGINAL_MARKER_COLORS.residential);
    expect(colorForLocationType(ICON_KEYS.HOME_CORRECTED)).toBe(ORIGINAL_MARKER_COLORS.residential);
  });

  it("maps indefinite (and anything unknown/empty) to the gray palette", () => {
    expect(colorForLocationType(ICON_KEYS.INDEFINITE)).toBe(ORIGINAL_MARKER_COLORS.indefinite);
    expect(colorForLocationType("")).toBe(ORIGINAL_MARKER_COLORS.indefinite);
    expect(colorForLocationType("-")).toBe(ORIGINAL_MARKER_COLORS.indefinite);
  });

  it("uses a dark number ink on the light gray for AA contrast", () => {
    expect(ORIGINAL_MARKER_COLORS.indefinite.numberInk).toBe("#2A2F38");
    // Commercial/residential keep the default white ink (undefined here).
    expect(ORIGINAL_MARKER_COLORS.commercial.numberInk).toBeUndefined();
  });
});
