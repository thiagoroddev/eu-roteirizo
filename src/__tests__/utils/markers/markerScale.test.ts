/**
 * Tests for scaleForZoom — zoom-dependent marker size (RF-020.4).
 */

import { describe, it, expect } from "vitest";
import { scaleForZoom, MARKER_MIN_SCALE, MARKER_MAX_SCALE } from "../../../utils/markers/markerScale";
import { MAP_CONFIG } from "../../../constants";

describe("scaleForZoom", () => {
  it("is the minimum scale at the farthest (min) zoom", () => {
    expect(scaleForZoom(MAP_CONFIG.ZOOM.MIN)).toBe(MARKER_MIN_SCALE);
  });

  it("is the maximum (full) scale at the closest (max) zoom", () => {
    expect(scaleForZoom(MAP_CONFIG.ZOOM.MAX)).toBe(MARKER_MAX_SCALE);
  });

  it("grows monotonically between min and max zoom", () => {
    const mid = scaleForZoom((MAP_CONFIG.ZOOM.MIN + MAP_CONFIG.ZOOM.MAX) / 2);
    expect(mid).toBeGreaterThan(MARKER_MIN_SCALE);
    expect(mid).toBeLessThan(MARKER_MAX_SCALE);
  });

  it("clamps below min zoom and above max zoom", () => {
    expect(scaleForZoom(MAP_CONFIG.ZOOM.MIN - 5)).toBe(MARKER_MIN_SCALE);
    expect(scaleForZoom(MAP_CONFIG.ZOOM.MAX + 5)).toBe(MARKER_MAX_SCALE);
  });
});
