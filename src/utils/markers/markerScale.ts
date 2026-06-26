/**
 * markerScale - Zoom-dependent marker size (RF-020.4).
 *
 * At a far zoom the markers crowd, so their size must grow with the zoom: smallest
 * at the minimum zoom, full size only at the maximum (closest) zoom. This pure
 * helper maps a Leaflet zoom level to the `scale` passed to the marker builder.
 */

import { MAP_CONFIG } from "../../constants";

/** Marker scale at the minimum (farthest) zoom — kept small to reduce crowding. */
export const MARKER_MIN_SCALE = 0.45;

/** Marker scale at the maximum (closest) zoom — full size. */
export const MARKER_MAX_SCALE = 0.9;

const clamp01 = (value: number): number => (value < 0 ? 0 : value > 1 ? 1 : value);

/**
 * Linear marker scale for a zoom level, clamped to [MARKER_MIN_SCALE, MARKER_MAX_SCALE].
 * @param zoom - The current Leaflet zoom (typically MAP_CONFIG.ZOOM.MIN..MAX).
 * @returns The scale to pass to `createMarkerDivIcon`.
 */
export const scaleForZoom = (zoom: number): number => {
  const { MIN, MAX } = MAP_CONFIG.ZOOM;
  const t = clamp01((zoom - MIN) / (MAX - MIN));
  return MARKER_MIN_SCALE + t * (MARKER_MAX_SCALE - MARKER_MIN_SCALE);
};
