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
 * Meu roteiro type palettes (TASK-RF-006.4.1 — decision 08/07): the mode keeps
 * the SAME type semantics as the Original (green residential / blue commercial /
 * gray indefinite) but in a LIGHTER, neon register — the color itself tells the
 * user which mode is active. Supersedes the spec's "pontos cinza desbotados"
 * (§4 p.0, revised 08/07). `vehicle` is the shared slate of the route start AND
 * the stop anchor (one icon for both — decision 08/07; the .5 gestures inherit it).
 */
export const ROTEIRO_TYPE_COLORS: Record<"commercial" | "residential" | "indefinite", MarkerColor> = {
  commercial: { top: "#66E0FF", bottom: "#00A8E8", glow: "rgba(0,209,255,.55)" },
  residential: { top: "#5CFFB0", bottom: "#00C86E", glow: "rgba(0,255,157,.55)" },
  indefinite: { top: "#E8ECF2", bottom: "#B4BAC4", glow: "rgba(160,170,190,.35)", numberInk: "#2A2F38" },
};

/**
 * Route-infrastructure markers (both drawn as the tipless CAR circle parked on
 * the street): `vehicle` is the stop anchor in slate; `start` is the route
 * START in strong BLUE (RF-006.4.27 — same icon as the anchor, the COLOR tells
 * them apart; supersedes the .4.2 diamond, which overlapped the address pin
 * when the start was set by address). Blue ≠ the commercial circles' light cyan.
 */
export const ROTEIRO_MARKER_COLORS: Record<"vehicle" | "start", MarkerColor> = {
  vehicle: { top: "#64748B", bottom: "#334155", glow: "rgba(0,209,255,.45)" },
  start: { top: "#3B82F6", bottom: "#1D4ED8", glow: "rgba(59,130,246,.55)" },
};

/** The mode's neon accent — suggestion line + radius circle (RF-006.4.2). */
export const ROTEIRO_ACCENT = "#00D1FF";

/**
 * Maps a resolved location type (ICON_KEYS) to the Meu roteiro neon color —
 * same buckets as `colorForLocationType`, lighter register.
 */
export function roteiroColorForLocationType(type: string): MarkerColor {
  if (type === ICON_KEYS.OFFICE || type === ICON_KEYS.OFFICE_CORRECTED) return ROTEIRO_TYPE_COLORS.commercial;
  if (type === ICON_KEYS.HOME || type === ICON_KEYS.HOME_CORRECTED) return ROTEIRO_TYPE_COLORS.residential;
  return ROTEIRO_TYPE_COLORS.indefinite;
}

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
