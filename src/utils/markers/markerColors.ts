/**
 * markerColors - The map's functional marker palettes (ADR-008 §5, ADR-009).
 *
 * The SVG marker (`markerSvg.ts`) is color-agnostic: it takes raw color values, so
 * the same component serves both modes. This module owns the palettes:
 * - Original mode: type → color (commercial blue / residential green / indefinite
 *   gray with dark number ink for AA contrast). LOCKED — do not retheme.
 * - Meu roteiro mode: the neutral FADED palette for unassigned points (spec passo 0:
 *   "pontos cinza desbotados"). Fading is done by COLOR, not CSS opacity, because
 *   faded free points and full-color committed stops coexist in the same render.
 *
 * Input keys of `colorForLocationType` are the ICON_KEYS returned by `resolveLocationType`.
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
 * Meu roteiro palettes (TASK-RF-006.2/.3). `unassigned` is deliberately lighter
 * than the Original's `indefinite` gray — it must read as "not routed yet", not
 * as a type. `start` is the route start's OWN green (spec §3 "início = marcador
 * verde próprio") — brighter/deeper than the residential type green so the two
 * never read as the same thing.
 */
export const ROTEIRO_MARKER_COLORS: Record<"unassigned" | "start", MarkerColor> = {
  unassigned: { top: "#D9DDE3", bottom: "#B4BAC4", glow: "rgba(0,0,0,.10)", numberInk: "#4A505A" },
  start: { top: "#3EE08F", bottom: "#0A6B3C", glow: "rgba(20,180,100,.55)" },
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
