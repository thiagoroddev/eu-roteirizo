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

/**
 * Builds a Leaflet divIcon for a marker. The icon is sized to the scaled SVG and
 * anchored at the tip (the exact point), so clustered markers still read correctly.
 * @param props - Same props as `buildMarkerSvg`.
 * @returns An `L.DivIcon` ready to pass to `L.marker(latlng, { icon })`.
 */
export function createMarkerDivIcon(props: MarkerSvgProps): L.DivIcon {
  const scale = props.scale ?? G.DEFAULT_SCALE;
  const width = G.WIDTH * scale;
  const height = G.HEIGHT * scale;

  return L.divIcon({
    html: buildMarkerSvg(props),
    className: MARKER_ICON_CLASS,
    iconSize: [width, height],
    iconAnchor: [G.TIP_X * scale, G.TIP_Y * scale],
  });
}
