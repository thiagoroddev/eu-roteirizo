import { MAP_CONFIG } from "../constants";
import type { IconConfig, Size } from "../types";

/**
 * Multiplies a pair of coordinates/sizes by a factor.
 */
function scalePair(pair: readonly [number, number], factor: number): Size {
  return [Math.round(pair[0] * factor), Math.round(pair[1] * factor)];
}

/**
 * Calculates the scale factor required to achieve a target width in pixels.
 * Based on Leaflet's default icon width (25px).
 * @param targetWidth The desired width in pixels (ex: 40)
 * @returns The multiplication factor (ex: 1.6)
 */
export function getScaleFactorFromWidth(targetWidth: number): number {
  const defaultWidth = MAP_CONFIG.DEFAULT_ICON.SIZE[0]; // 25px
  return targetWidth / defaultWidth;
}

/**
 * Generates proportionally scaled Leaflet icon configuration.
 * @param factor - The multiplication factor for scaling
 * @returns The scaled icon configuration object
 */
export function scaleIconConfig(factor: number): IconConfig {
  const { SIZE, ANCHOR, POPUP_ANCHOR, TOOLTIP_ANCHOR } = MAP_CONFIG.DEFAULT_ICON;

  return {
    iconSize: scalePair(SIZE, factor),
    iconAnchor: scalePair(ANCHOR, factor),
    popupAnchor: scalePair(POPUP_ANCHOR, factor),
    tooltipAnchor: scalePair(TOOLTIP_ANCHOR, factor),
  };
}
