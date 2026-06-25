import { MAP_CONFIG } from "../constants";

/** A coordinate expressed in degrees is always within this magnitude (lat ±90, lng ±180). */
const MAX_DEGREES = 180;

/** Spreadsheets export coordinates as integers scaled by 10^7 (e.g. -229500637 ≡ -22.9500637). */
const COORD_SCALE = 1e7;

/**
 * parseCoordinate - Parses a latitude/longitude value coming from the spreadsheet.
 *
 * Real exports come in two very different shapes (confirmed against actual files):
 * - **Real decimal degrees** (single-route files), Brazilian locale → decimal
 *   comma, variable precision: `"-22,952715"`, `"-43,1973"`, `"-22,9559345"`.
 * - **Scaled integer** (multi-route files) with optional thousand separators:
 *   `"-229.026.394"` or `"-433048401"` → divide by 10^7.
 * Values may also arrive already as a JS `number` (xlsx parses numeric cells).
 *
 * Strategy (locale-aware, no guessing by fixed decimal count):
 * 1. Numbers are used as-is; strings are normalized — the decimal separator is
 *    detected (a separator that appears **once** is decimal; one that **repeats**
 *    groups thousands; if both `.` and `,` appear, the **last** one is decimal).
 * 2. **Magnitude decides scale:** |value| ≤ 180 is already in degrees; a larger
 *    magnitude can only be a scaled integer, so it is divided by 10^7.
 *
 * This fixes the previous silent failures: a decimal with ≠ 7 places (or a comma)
 * no longer collapses to a wrong in-bounds point. Genuinely non-numeric input
 * returns `undefined`; out-of-range values are still rejected by {@link isWithinRioBounds}.
 *
 * @param value - Raw cell value (string, number, null, ...).
 * @returns The decimal coordinate, or `undefined` if it is not a finite number.
 */
export const parseCoordinate = (value: unknown): number | undefined => {
  if (!value) return undefined;

  let num: number;
  if (typeof value === "number") {
    num = value;
  } else {
    let raw = String(value).trim();
    if (raw === "") return undefined;

    const hasDot = raw.includes(".");
    const hasComma = raw.includes(",");

    if (hasDot && hasComma) {
      // Both present → the rightmost separator is the decimal one; the other groups thousands.
      const decimalSep = raw.lastIndexOf(".") > raw.lastIndexOf(",") ? "." : ",";
      const thousandSep = decimalSep === "." ? "," : ".";
      raw = raw.split(thousandSep).join("").replace(decimalSep, ".");
    } else if (hasComma) {
      // Only commas → a single comma is the decimal point; multiple are thousand separators.
      raw = (raw.match(/,/g) ?? []).length === 1 ? raw.replace(",", ".") : raw.replace(/,/g, "");
    } else if (hasDot && (raw.match(/\./g) ?? []).length > 1) {
      // Multiple dots → thousand separators (scaled integer); a single dot stays as the decimal point.
      raw = raw.replace(/\./g, "");
    }

    num = parseFloat(raw);
  }

  if (!Number.isFinite(num)) return undefined;
  return Math.abs(num) > MAX_DEGREES ? num / COORD_SCALE : num;
};

/**
 * isWithinRioBounds - Whether a coordinate falls inside the map's Rio bounds.
 *
 * Uses {@link MAP_CONFIG.RIO_BOUNDS} (also the Leaflet `maxBounds`): a marker
 * outside this box can never be shown on the map, so an out-of-range value is
 * treated as invalid (e.g. a mis-parsed coordinate).
 *
 * @param lat - Decimal latitude.
 * @param lng - Decimal longitude.
 * @returns `true` if both lat and lng are within the Rio bounding box.
 */
export const isWithinRioBounds = (lat: number, lng: number): boolean => {
  const { SOUTH_WEST, NORTH_EAST } = MAP_CONFIG.RIO_BOUNDS;
  return lat >= SOUTH_WEST.lat && lat <= NORTH_EAST.lat && lng >= SOUTH_WEST.lng && lng <= NORTH_EAST.lng;
};
