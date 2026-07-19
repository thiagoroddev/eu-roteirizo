/**
 * utils/complement.ts - Address complement helpers (RF-007.2).
 *
 * Neutral home for complement extraction/comparison so both the routing math
 * (estimates: grouping packages into "deliveries") and the markers/panel
 * vocabulary use ONE implementation — routing must not depend on the markers
 * layer. Pure: a row/string in, a string/boolean out.
 */

import type { RowData } from "../types";
import { COLUMN_NAMES } from "../constants";

/** Complement of ONE row: the address text after the 2nd comma (same split as
 *  inferLocationType); "" when absent. */
export const rowComplement = (row: RowData): string =>
  String(row[COLUMN_NAMES.DESTINATION_ADDRESS] ?? "")
    .split(",")
    .slice(2)
    .join(", ")
    .trim();

/** Comparison key for a complement: trimmed + lower-cased, so "Apto 206" and
 *  "apto 206 " group together. Empty stays empty (one "no-complement" group). */
export const normalizeComplement = (complement: string): string => complement.trim().toLowerCase();

/** Whether two complements are the SAME delivery unit (case/space-insensitive). */
export const sameComplement = (a: string, b: string): boolean => normalizeComplement(a) === normalizeComplement(b);
