/**
 * markerSvg - Pure SVG generator for the Original-mode map markers (ADR-008).
 *
 * Ports the approved prototype (`prototipos/marcadores-svg/`, `createMarker`) to a
 * pure, framework-free function: given the marker props it returns an SVG markup
 * string. It has NO dependency on Leaflet/React/DOM — only `createMarkerDivIcon`
 * (in `./markerIcon`) wraps this output in `L.divIcon`. This keeps the visual
 * vocabulary isolated and trivially testable, and lets the SAME builder serve the
 * future "Meu roteiro" mode by passing a different color (the palette is a prop,
 * not a fixed type — ADR-008 §9).
 *
 * Security: `number` may originate from the spreadsheet `Stop` cell and the result
 * is injected via `innerHTML` (Leaflet divIcon), so it is HTML-escaped here. Colors
 * are app-internal tokens (not user data) and are interpolated as-is.
 */

import { escapeHtml } from "../escapeHtml";

/** Body geometry — "square" = stop · "circle" = address · "diamond" = route start (RF-006.4.2). */
export type MarkerShape = "square" | "circle" | "diamond";

/** Central glyph replacing the number — the vehicle/anchor marker (RF-006.4.2). */
export type MarkerGlyph = "car";

/** Badge glyph: a box counts packages (in an address); a pin counts addresses (in a stop). */
export type MarkerBadgeKind = "packages" | "addresses";

/**
 * Color of a marker. The palette is a parameter so the component is reusable:
 * the Original mode passes colors derived from the location type, while "Meu
 * roteiro" will pass categorical per-stop colors. `numberInk` defaults to white;
 * light fills (e.g. the indefinite gray) should pass a dark ink for AA contrast.
 */
export interface MarkerColor {
  top: string;
  bottom: string;
  glow: string;
  numberInk?: string;
}

/** Yellow count badge; only rendered when `count > 1`. */
export interface MarkerBadge {
  kind: MarkerBadgeKind;
  count: number;
}

export interface MarkerSvgProps {
  shape: MarkerShape;
  color: MarkerColor;
  /** The stop number; omitted (null/undefined/"") for expanded non-representative addresses. */
  number?: number | string | null;
  /** Central glyph (vehicle marker) — WINS over `number` when present (RF-006.4.2). */
  glyph?: MarkerGlyph | null;
  /** Count badge; ignored when count <= 1. */
  badge?: MarkerBadge | null;
  /** Thick white border. In the Original mode this marks a focused stop's address. */
  selected?: boolean;
  /** Selected-ring style: "dashed" marks a draft CANDIDATE (RF-006.4.2); default solid. */
  ringStyle?: "solid" | "dashed";
  /** Bright type-colored neon glow — the clicked address within a multi-address stop. */
  emphasis?: boolean;
  /** Fine tip/cone at the bottom (default true). The street-anchored vehicle passes false. */
  tip?: boolean;
  /** Render scale applied to the intrinsic viewBox size. Defaults to 0.8. */
  scale?: number;
}

/* ============================================================================
   GEOMETRY (viewBox units)
   The viewBox is sized so the count badge (which extends up and to the right of
   the body) is never clipped. The "fine tip" at (TIP_X, TIP_Y) marks the exact
   point on the map — `createMarkerDivIcon` anchors the icon there.
============================================================================ */

export const MARKER_GEOMETRY = {
  WIDTH: 96,
  // Height ends just below the tip (TIP_Y=98): a taller box would leave a dead
  // transparent strip under the point that overlaps the marker below it.
  HEIGHT: 102,
  CX: 48,
  BODY_TOP: 12,
  BODY_HEIGHT: 56,
  /** Vertical center of the body (where the number sits). */
  CY_MID: 40,
  /** Tip coordinates — the precise point the marker indicates. */
  TIP_X: 48,
  TIP_Y: 98,
  DEFAULT_SCALE: 0.8,
} as const;

const G = MARKER_GEOMETRY;
const BODY_BOTTOM = G.BODY_TOP + G.BODY_HEIGHT; // 68

/** Deterministic, collision-safe gradient id derived from the color (keeps the function pure). */
const gradientId = (color: MarkerColor): string => `grad-${(color.top + color.bottom).replace(/[^a-zA-Z0-9]/g, "")}`;

const hasNumber = (n: MarkerSvgProps["number"]): n is number | string => n !== null && n !== undefined && n !== "";

/** Box glyph (packages) / pin glyph (addresses), drawn inside the badge. */
const badgeGlyph = (kind: MarkerBadgeKind): string =>
  kind === "addresses"
    ? `<g transform="translate(9,4)" fill="none" stroke="${BADGE_INK}" stroke-width="1.3" stroke-linejoin="round" stroke-linecap="round"><path d="M5,1 C2.8,1 1,2.8 1,5 C1,8.5 5,12.5 5,12.5 C5,12.5 9,8.5 9,5 C9,2.8 7.2,1 5,1 Z"/><circle cx="5" cy="5" r="1.6"/></g>`
    : `<g transform="translate(6,5)" fill="none" stroke="${BADGE_INK}" stroke-width="1.4" stroke-linejoin="round"><path d="M0,3 L6,0 L12,3 L6,6 Z"/><path d="M0,3 L0,10 L6,13 L6,6"/><path d="M12,3 L12,10 L6,13"/></g>`;

const BADGE_FILL = "#F5B400";
const BADGE_INK = "#5A4300";
// Number + badge form a vertically-centered group inside the head (y 12..68), with
// even ~5-6px padding all around. Badge (22 tall) at 40 → 40..62 (~6px above the head
// bottom); number baseline 34 sits ~6px above it (cap-top ~17, ~5px below the head top).
const BADGE_TOP = 40;
// Number baseline: centered in the head when alone; part of the centered group with a badge.
const NUMBER_Y_WITH_BADGE = 34;

/**
 * Tabler Icons "car" (outline v3, MIT — https://tabler.io/icons), embedded as
 * paths per the project's no-new-deps pattern (badgeGlyph/PackageGlyph). The
 * 24×24 icon is scaled 2× and optically centered in the head (wheels sit low
 * in the source viewBox, hence the -25 vertical offset).
 */
const carGlyph = (ink: string): string =>
  `<g transform="translate(${G.CX - 24},${G.CY_MID - 25}) scale(2)" fill="none" stroke="${ink}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">` +
  `<path d="M7 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/>` +
  `<path d="M17 17m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"/>` +
  `<path d="M5 17h-2v-6l2 -5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0h-6m-6 -6h15m-6 0v-5"/>` +
  `</g>`;

/**
 * Generates the marker SVG markup as a string. Pure: same props → identical output.
 * @param props - Shape, color, optional number/badge, and selected/scale flags.
 * @returns SVG markup ready to inject as HTML (number is HTML-escaped).
 */
export function buildMarkerSvg(props: MarkerSvgProps): string {
  const { shape, color, number, glyph = null, badge, selected = false, ringStyle = "solid", emphasis = false, tip = true, scale = G.DEFAULT_SCALE } = props;

  const id = gradientId(color);
  const numberInk = color.numberInk ?? "#ffffff";
  // Selected = thick white border (a focused stop's address); "dashed" marks a
  // draft CANDIDATE (RF-006.4.2). Unselected = a hairline border.
  const stroke = selected ? `stroke="#ffffff" stroke-width="4"${ringStyle === "dashed" ? ` stroke-dasharray="10 7"` : ""}` : `stroke="rgba(255,255,255,.4)" stroke-width="1.5"`;

  // Glow (inline, self-contained): the emphasized address gets a bright type-colored neon
  // around the white border (light blue for commercial, light green for residential —
  // color.top); everything else keeps the subtle base glow.
  const glowFilter = emphasis ? `drop-shadow(0 0 12px ${color.top}) drop-shadow(0 0 6px ${color.top})` : `drop-shadow(0 0 7px ${color.glow}) drop-shadow(0 1px 1px rgba(0,0,0,.18))`;

  const tipPath = `M${G.CX - 7},${BODY_BOTTOM - 6} L${G.CX},${BODY_BOTTOM + 30} L${G.CX + 7},${BODY_BOTTOM - 6} Z`;

  const body =
    shape === "square"
      ? `<rect x="${G.CX - 28}" y="${G.BODY_TOP}" width="56" height="${G.BODY_HEIGHT}" rx="15" fill="url(#${id})" ${stroke}/>`
      : shape === "diamond"
        ? // Route-start diamond, inscribed in the same head box (RF-006.4.2).
          `<path d="M${G.CX},${G.BODY_TOP} L${G.CX + 28},${G.CY_MID} L${G.CX},${BODY_BOTTOM} L${G.CX - 28},${G.CY_MID} Z" fill="url(#${id})" ${stroke} stroke-linejoin="round"/>`
        : // Circle radius is a touch larger than the square's half-width so the number/badge
          // get padding from the curved edge (a circle narrows at top/bottom). RF-020.3.
          `<circle cx="${G.CX}" cy="${G.CY_MID}" r="30" fill="url(#${id})" ${stroke}/>`;

  // The label may be the stop number ("18") or a composite "stop-sequence" ("18-49");
  // the font shrinks for longer labels so it fits the head.
  const hasBadge = !!(badge && badge.count > 1);
  const label = hasNumber(number) ? String(number) : "";
  const numberY = hasBadge ? NUMBER_Y_WITH_BADGE : G.CY_MID + 9; // centered when alone, raised above the badge
  const numberFontSize = label.length >= 4 ? 16 : label.length === 3 ? 20 : 24;
  const numberEl = glyph
    ? carGlyph(numberInk)
    : label
      ? `<text class="mk-number" x="${G.CX}" y="${numberY}" text-anchor="middle" font-size="${numberFontSize}" font-weight="800" fill="${numberInk}" font-family="Hanken Grotesk, sans-serif">${escapeHtml(label)}</text>`
      : "";

  let badgeEl = "";
  if (badge && badge.count > 1) {
    const badgeWidth = badge.count > 9 ? 40 : 34;
    const badgeX = G.CX - badgeWidth / 2; // centered inside the head, below the number
    badgeEl = `<g class="mk-badge" transform="translate(${badgeX}, ${BADGE_TOP})"><rect x="0" y="0" width="${badgeWidth}" height="22" rx="11" fill="${BADGE_FILL}"/>${badgeGlyph(badge.kind)}<text x="${badge.count > 9 ? 28 : 25}" y="16" text-anchor="middle" font-size="13" font-weight="700" fill="${BADGE_INK}" font-family="Hanken Grotesk, sans-serif">${badge.count}</text></g>`;
  }

  const w = G.WIDTH * scale;
  const h = G.HEIGHT * scale;

  // The fine tip is doctrine for point markers (ADR-008 §7); the street-anchored
  // vehicle (RF-006.4.2) omits it — its icon must not cover the address marker.
  const tipEl = tip ? `<path d="${tipPath}" fill="url(#${id})"/>` : "";

  return `<svg class="route-marker" width="${w}" height="${h}" viewBox="0 0 ${G.WIDTH} ${G.HEIGHT}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${color.top}"/><stop offset="1" stop-color="${color.bottom}"/></linearGradient></defs><g class="mk-body" style="filter:${glowFilter}">${tipEl}${body}${numberEl}</g>${badgeEl}</svg>`;
}
