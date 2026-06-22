/**
 * Utilities for selecting marker icon keys based on classification,
 * original spreadsheet value and Correios delivery status.
 *
 * Exports:
 * - IconKey: union type of all keys used in the ICONS map in `RouteMap`.
 * - wasLocationTypeCorrected(original, final): boolean helper to detect corrections.
 * - pickIconKey(classification, original, delivery): returns an `IconKey` string.
 */

import type { IconKey } from "../types";
import { ICON_KEYS, DELIVERY_KEYS } from "../constants";

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
 * Pick the ICONS key given the classification (final), the original spreadsheet
 * location type, and the Correios delivery status string.
 *
 * - `classification` is expected to be values like `HOME`, `OFFICE`,
 *   `HOME_CORRECTED`, `OFFICE_CORRECTED`, `INDEFINITE`, etc.
 * - `original` is the original spreadsheet value (e.g. "HOME" or "OFFICE").
 * - `delivery` is the Correios helper output: typically "Sim", "Não" or
 *   other "Sem dados"/empty values.
 *
 * @param {string | undefined} classification - The final location classification
 * @param {string | undefined} original - The original location type from spreadsheet
 * @param {string | undefined} delivery - The Correios delivery status
 * @returns {IconKey} The appropriate icon key for the marker
 */
export function pickIconKey(classification: string | undefined, original: string | undefined, delivery: string | undefined): IconKey {
  const c = String(classification || "")
    .trim()
    .toUpperCase();
  const o = String(original || "")
    .trim()
    .toUpperCase();
  const d = String(delivery || "").trim(); // keep case for 'Sim'/'Não'

  // Residential -> HOME icons
  if (c === ICON_KEYS.HOME_CORRECTED || c === ICON_KEYS.HOME) {
    const corrected = c === ICON_KEYS.HOME_CORRECTED && o !== ICON_KEYS.HOME;
    if (d === DELIVERY_KEYS.YES) return corrected ? ICON_KEYS.HOME_WITH_DELIVERY_CORRECTED : ICON_KEYS.HOME_WITH_DELIVERY;
    if (d === DELIVERY_KEYS.NO) return corrected ? ICON_KEYS.HOME_WITHOUT_DELIVERY_CORRECTED : ICON_KEYS.HOME_WITHOUT_DELIVERY;
    return corrected ? ICON_KEYS.HOME_CORRECTED : ICON_KEYS.HOME;
  }

  // Commercial -> OFFICE icons
  if (c === ICON_KEYS.OFFICE_CORRECTED || c === ICON_KEYS.OFFICE) {
    const corrected = c === ICON_KEYS.OFFICE_CORRECTED && o !== ICON_KEYS.OFFICE;
    if (d === DELIVERY_KEYS.YES) return corrected ? ICON_KEYS.OFFICE_WITH_DELIVERY_CORRECTED : ICON_KEYS.OFFICE_WITH_DELIVERY;
    if (d === DELIVERY_KEYS.NO) return corrected ? ICON_KEYS.OFFICE_WITHOUT_DELIVERY_CORRECTED : ICON_KEYS.OFFICE_WITHOUT_DELIVERY;
    return corrected ? ICON_KEYS.OFFICE_CORRECTED : ICON_KEYS.OFFICE;
  }

  // Indistinct / unknown → use INDEFINITE variants
  if (d === DELIVERY_KEYS.YES) return ICON_KEYS.INDEFINITE_WITH_DELIVERY;
  if (d === DELIVERY_KEYS.NO) return ICON_KEYS.INDEFINITE_WITHOUT_DELIVERY;
  return ICON_KEYS.INDEFINITE;
}

export default pickIconKey;
