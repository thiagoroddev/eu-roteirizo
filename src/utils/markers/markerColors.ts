/**
 * markerColors - Location-type → marker color, for the Original mode only (ADR-008 §5).
 *
 * The SVG marker (`markerSvg.ts`) is color-agnostic: it takes raw color values so
 * the same component serves "Meu roteiro" later with a categorical per-stop palette.
 * This module owns the Original-mode mapping (type → color), because cor-por-tipo is
 * exclusive to the Original mode. Commercial = blue, Residential = green, Indefinite =
 * gray (with a dark number ink for AA contrast, since the gray fill is light).
 *
 * Input keys are the ICON_KEYS returned by `resolveLocationType`.
 */

import { ICON_KEYS } from "../../constants";
import type { MarkerColor } from "./markerSvg";

/** The three functional palettes used by Original-mode markers (from the approved prototype). */
export const ORIGINAL_MARKER_COLORS: Record<"commercial" | "residential" | "indefinite", MarkerColor> = {
  commercial: { top: "#3DA0FF", bottom: "#1559C9", glow: "rgba(45,127,240,.55)" },
  residential: { top: "#34D27A", bottom: "#0E8C49", glow: "rgba(34,184,102,.50)" },
  indefinite: { top: "#B6BCC6", bottom: "#8A909C", glow: "rgba(0,0,0,.18)", numberInk: "#2A2F38" },
};

/**
 * Maps a resolved location type (ICON_KEYS) to the Original-mode marker color.
 * Commercial (office) → blue, Residential (home) → green, everything else → gray.
 * @param type - A value returned by `resolveLocationType` (ICON_KEYS).
 * @returns The marker color tokens for that type.
 */
export function colorForLocationType(type: string): MarkerColor {
  if (type === ICON_KEYS.OFFICE || type === ICON_KEYS.OFFICE_CORRECTED) return ORIGINAL_MARKER_COLORS.commercial;
  if (type === ICON_KEYS.HOME || type === ICON_KEYS.HOME_CORRECTED) return ORIGINAL_MARKER_COLORS.residential;
  return ORIGINAL_MARKER_COLORS.indefinite;
}
