/**
 * Utilities for selecting marker icon keys based on classification and the
 * original spreadsheet value.
 *
 * Exports:
 * - IconKey: union type of all keys used in the ICONS map in `RouteMap`.
 * - wasLocationTypeCorrected(original, final): boolean helper to detect corrections.
 * - pickIconKey(classification, original): returns an `IconKey` string.
 */

import type { IconKey } from "../types";
import { ICON_KEYS } from "../constants";

/**
 * Checks if the location type was corrected from its original value
 *
 * @param {string | undefined} original - The original location type from spreadsheet
 * @param {string | undefined} final - The final classified location type
 * @returns {boolean} True if the type was corrected
 */
export function wasLocationTypeCorrected(original: string | undefined, final: string | undefined): boolean {
  const o = String(original || "")
    .trim()
    .toUpperCase();
  const f = String(final || "")
    .trim()
    .toUpperCase();

  if (!f) return false;
  if (!f.includes("CORRECTED")) return false;

  const base = f.replace("_CORRECTED", "");
  return o !== base;
}

/**
 * Pick the ICONS key given the classification (final) and the original
 * spreadsheet location type.
 *
 * - `classification` is expected to be values like `HOME`, `OFFICE`,
 *   `HOME_CORRECTED`, `OFFICE_CORRECTED`, `INDEFINITE`.
 * - `original` is the original spreadsheet value (e.g. "HOME" or "OFFICE"),
 *   used only to distinguish a "corrected" icon from a plain one.
 *
 * @param {string | undefined} classification - The final location classification
 * @param {string | undefined} original - The original location type from spreadsheet
 * @returns {IconKey} The appropriate icon key for the marker
 */
export function pickIconKey(classification: string | undefined, original: string | undefined): IconKey {
  const c = String(classification || "")
    .trim()
    .toUpperCase();
  const o = String(original || "")
    .trim()
    .toUpperCase();

  // Residential -> HOME icons
  if (c === ICON_KEYS.HOME_CORRECTED || c === ICON_KEYS.HOME) {
    const corrected = c === ICON_KEYS.HOME_CORRECTED && o !== ICON_KEYS.HOME;
    return corrected ? ICON_KEYS.HOME_CORRECTED : ICON_KEYS.HOME;
  }

  // Commercial -> OFFICE icons
  if (c === ICON_KEYS.OFFICE_CORRECTED || c === ICON_KEYS.OFFICE) {
    const corrected = c === ICON_KEYS.OFFICE_CORRECTED && o !== ICON_KEYS.OFFICE;
    return corrected ? ICON_KEYS.OFFICE_CORRECTED : ICON_KEYS.OFFICE;
  }

  // Indistinct / unknown → INDEFINITE
  return ICON_KEYS.INDEFINITE;
}

export default pickIconKey;
