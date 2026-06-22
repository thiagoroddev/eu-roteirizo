/**
 * safeGetData - Finds first or last valid value in a column
 *
 * Useful for extracting repeated data like City or AT code where
 * only the first non-empty value is needed.
 *
 * Returns "Sem dados" if column doesn't exist or all values are empty.
 */

import type { RowData } from "../types";
import { DATA_STATUS, type DataStatus } from "../constants";
import { isValidValue } from "./validators";

/** =============================================================================
 * Safely retrieves the first valid value from a specified column in the rows
 * @param rows - Array of row data objects
 * @param col - The column name to search
 * @param availableCols - List of available columns
 * @returns The first valid value as a string, or "Sem dados" if not found
 */
export function safeGetFirst(rows: RowData[] | undefined, col: string, availableCols: string[] | null): string | DataStatus {
  if (!rows || rows.length === 0) return DATA_STATUS.MISSING;
  if (!availableCols?.includes(col)) return DATA_STATUS.MISSING;

  const foundRow = rows.find((r) => isValidValue(r[col]));
  const value = foundRow?.[col];

  if (value === "" || value === "-") return DATA_STATUS.EMPTY;
  return value != null ? String(value) : DATA_STATUS.MISSING;
}

/**
 *Safely retrieves the last valid value from a specified column in the rows
 *
 * @param rows - Array of row data objects
 * @param col - The column name to search
 * @param availableCols - List of available columns
 * @returns The last valid value as a string, or "Sem dados" if not found
 */
export function safeGetLast(rows: RowData[] | undefined, col: string, availableCols: string[] | null): string | DataStatus {
  if (!rows || rows.length === 0) return DATA_STATUS.MISSING;
  if (!availableCols?.includes(col)) return DATA_STATUS.MISSING;

  const foundRow = [...rows].reverse().find((r) => isValidValue(r[col]));
  const value = foundRow?.[col];

  if (value === "" || value === "-") return DATA_STATUS.EMPTY;
  return value != null ? String(value) : DATA_STATUS.MISSING;
}
