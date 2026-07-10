/**
 * markerIcon - Leaflet wrapper for the pure SVG marker (ADR-008).
 *
 * This is the ONLY file in the marker module that knows about Leaflet. It wraps
 * `buildMarkerSvg` output in an `L.divIcon`, sizing it to the SVG and anchoring it
 * at the fine tip so the marker points to the exact coordinate. The `markerIcon.css`
 * import neutralizes Leaflet's default `.leaflet-div-icon` white box.
 */

import L from "leaflet";
import { buildMarkerSvg, MARKER_GEOMETRY, type MarkerSvgProps } from "./markerSvg";
import "./markerIcon.css";

const G = MARKER_GEOMETRY;

/** CSS class applied to the divIcon; `markerIcon.css` strips Leaflet's default box. */
export const MARKER_ICON_CLASS = "route-marker-icon";

export interface MarkerIconProps extends MarkerSvgProps {
  /** "tip" (default) anchors at the fine point; "center" at the body center —
      tipless markers like the street-anchored vehicle (RF-006.4.2). */
  anchor?: "tip" | "center";
}

/**
 * Icon cache (TASK-REF-015d). The map tears down and recreates EVERY marker on
 * each interaction change, and each creation rebuilt the SVG string + re-parsed
 * it into DOM. Identical props → the same `L.DivIcon` instance: a DivIcon is a
 * stateless options holder (each `L.marker` builds its own element from the
 * html), so sharing is safe. The key enumerates every field that reaches the
 * SVG/anchor — a new visual prop MUST join it, or two different markers would
 * collide on one icon (the test pins the known fields).
 */
const iconCache = new Map<string, L.DivIcon>();
/** Well above the realistic combo count (shapes × colors × states × zoom levels). */
const ICON_CACHE_MAX = 512;

const cacheKey = (props: MarkerIconProps): string => {
  const { anchor = "tip", shape, color, number, glyph, badge, selected, ringStyle, emphasis, highlight, tip, scale } = props;
  return [
    anchor,
    shape,
    color.top,
    color.bottom,
    color.glow,
    color.numberInk ?? "",
    number ?? "",
    glyph ?? "",
    badge ? `${badge.kind}:${badge.count}` : "",
    selected ? 1 : 0,
    ringStyle ?? "solid",
    emphasis ? 1 : 0,
    highlight ? 1 : 0,
    tip === false ? 0 : 1,
    scale ?? G.DEFAULT_SCALE,
  ].join("|");
};

/**
 * Builds a Leaflet divIcon for a marker. The icon is sized to the scaled SVG and
 * anchored at the tip (the exact point) — or at the body center for tipless
 * markers — so clustered markers still read correctly. Cached by props (REF-015d).
 * @param props - Same props as `buildMarkerSvg`, plus the anchor mode.
 * @returns An `L.DivIcon` ready to pass to `L.marker(latlng, { icon })`.
 */
export function createMarkerDivIcon(props: MarkerIconProps): L.DivIcon {
  const key = cacheKey(props);
  const cached = iconCache.get(key);
  if (cached) return cached;

  const { anchor = "tip", ...svgProps } = props;
  const scale = svgProps.scale ?? G.DEFAULT_SCALE;
  const width = G.WIDTH * scale;
  const height = G.HEIGHT * scale;

  const icon = L.divIcon({
    html: buildMarkerSvg(svgProps),
    className: MARKER_ICON_CLASS,
    iconSize: [width, height],
    iconAnchor: anchor === "center" ? [G.CX * scale, G.CY_MID * scale] : [G.TIP_X * scale, G.TIP_Y * scale],
  });
  if (iconCache.size >= ICON_CACHE_MAX) iconCache.clear(); // simple reset — refilling is cheap
  iconCache.set(key, icon);
  return icon;
}
