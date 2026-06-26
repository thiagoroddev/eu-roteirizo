/**
 * Tests for createMarkerDivIcon — the Leaflet wrapper (RF-020.1, ADR-008).
 *
 * Uses REAL Leaflet (unlike RouteMap.test which mocks it): `L.divIcon` is plain
 * object construction and runs fine in jsdom without a map. We verify the html,
 * sizing and anchor (the fine tip) are wired correctly.
 */

import { describe, it, expect } from "vitest";
import L from "leaflet";
import { createMarkerDivIcon, MARKER_ICON_CLASS } from "../../../utils/markers/markerIcon";
import { MARKER_GEOMETRY, type MarkerColor } from "../../../utils/markers/markerSvg";

const COM: MarkerColor = { top: "#3DA0FF", bottom: "#1559C9", glow: "rgba(45,127,240,.55)" };

describe("createMarkerDivIcon", () => {
  it("returns an L.DivIcon whose html is the marker SVG", () => {
    const icon = createMarkerDivIcon({ shape: "circle", color: COM, number: 7 });
    expect(icon).toBeInstanceOf(L.DivIcon);
    expect(String(icon.options.html)).toContain("<svg");
    expect(String(icon.options.html)).toContain('class="mk-number"');
  });

  it("sets the marker class so the default divIcon box is neutralized", () => {
    const icon = createMarkerDivIcon({ shape: "circle", color: COM, number: 7 });
    expect(icon.options.className).toBe(MARKER_ICON_CLASS);
    expect(MARKER_ICON_CLASS).toBe("route-marker-icon");
  });

  it("sizes the icon to the scaled SVG and anchors at the fine tip", () => {
    const scale = 1;
    const icon = createMarkerDivIcon({ shape: "square", color: COM, number: 5, scale });
    expect(icon.options.iconSize).toEqual([MARKER_GEOMETRY.WIDTH, MARKER_GEOMETRY.HEIGHT]);
    expect(icon.options.iconAnchor).toEqual([MARKER_GEOMETRY.TIP_X, MARKER_GEOMETRY.TIP_Y]);
  });

  it("applies the default scale (0.8) to size and anchor when scale is omitted", () => {
    const icon = createMarkerDivIcon({ shape: "circle", color: COM, number: 1 });
    const s = MARKER_GEOMETRY.DEFAULT_SCALE;
    expect(icon.options.iconSize).toEqual([MARKER_GEOMETRY.WIDTH * s, MARKER_GEOMETRY.HEIGHT * s]);
    expect(icon.options.iconAnchor).toEqual([MARKER_GEOMETRY.TIP_X * s, MARKER_GEOMETRY.TIP_Y * s]);
  });
});
