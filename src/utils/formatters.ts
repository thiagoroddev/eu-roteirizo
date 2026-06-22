/** Fast CEP lookup map, used for neighborhood data in function formatNeighborhood */
const zipcodeMapNeighborhood = new Map(Object.entries(zipcodeDataNeighborhood));

/**
 * Formatters utilities
 *
 * This module contains small helper functions that transform raw route row data
 * into human-friendly values for the UI.
 */

import type { RowData } from "../types";
import zipcodeDataNeighborhood from "../data/CEPs-Hub_RJ_Ilha-do-Governador.json";
import { getCorreiosDeliveryStatus } from "./correiosDelivery"; // .ts extension not needed in import
import { COLUMN_NAMES, DELIVERY_KEYS, UI_LABELS, DATA_STATUS, presentStatus, type DataStatus } from "../constants";
import { safeGetFirst } from "./safeGetData"; // .ts extension not needed
import { safeGetLast } from "./safeGetData";

// ===========================================================================================
// Formatters
// ===========================================================================================

const isStatus = (val: unknown): val is DataStatus => typeof val === "string" && Object.values(DATA_STATUS).includes(val as DataStatus);

/**
 * Transforms time strings into human-readable format
 * (e.g., "1h30min" -> "1 hora e 30 minutos")
 *
 * @param {RowData[]} rows - Array of delivery rows
 * @param {string[] | null} availableCols - Available columns in the data
 * @returns {string} Formatted time string or status message
 */
export function formatDeliveryTime(rows: RowData[], availableCols: string[] | null): string {
  /** 1. Securely fetches raw data */
  const str = safeGetFirst(rows, COLUMN_NAMES.DELIVERY_TIME, availableCols);
  /** If there is no data, returns the default "No data" */
  if (isStatus(str)) return presentStatus(str);
  if (!str) return presentStatus(DATA_STATUS.EMPTY);

  /** Remove commas and trim */
  const cleaned = String(str).replace(",", "").trim();

  /** Extract hours and minutes: XhYmin | Xh | Ymin */
  const regex = /(?:(\d+)\s*h)?\s*(?:(\d+)\s*min)?/i;
  const match = cleaned.match(regex);

  /** If the regex fails completely (data exists but doesn't look like time), returns Invalid */
  if (!match) return presentStatus(DATA_STATUS.INVALID);

  /** Parse extracted values */
  const hours = match[1] ? parseInt(match[1], 10) : 0;
  const minutes = match[2] ? parseInt(match[2], 10) : 0;

  /** If both are zero, returns Invalid */
  if (hours === 0 && minutes === 0) return presentStatus(DATA_STATUS.INVALID);

  /** Format with Portuguese pluralization */
  const hoursStr = hours > 0 ? `${hours} hora${hours > 1 ? "s" : ""}` : "";
  const minutesStr = minutes > 0 ? `${minutes} minuto${minutes > 1 ? "s" : ""}` : "";

  /** Combine parts */
  if (hoursStr && minutesStr) return `${hoursStr} e ${minutesStr}`;
  if (hoursStr) return hoursStr;
  if (minutesStr) return minutesStr;

  /** Fallback final */
  return presentStatus(DATA_STATUS.INVALID);
}

/** * Formats a distance value into a human-readable string (km or m)
 *
 * @param {RowData[]} rows - Array of delivery rows
 * @param {string[] | null} availableCols - Available columns in the data
 * @returns {string} Formatted distance string or status message
 */
export function formatDistance(rows: RowData[], availableCols: string[] | null): string {
  /** 1. Get original distance string */
  const originalDistance = safeGetFirst(rows, COLUMN_NAMES.TOTAL_DISTANCE, availableCols);

  /** Standardization: If there is no data, returns the constant "No data" */
  if (isStatus(originalDistance)) return presentStatus(originalDistance);

  /** Convert to string and trim */
  const cleanStringOrigDist = normalizeString(String(originalDistance));

  /** Extract numeric value (remove non-numeric characters except comma/dot) */
  const sanitizedNumberString = cleanStringOrigDist.replace(/[^\d.,]/g, "").replace(",", ".");

  /** Parse as number */
  let numericValue = parseFloat(sanitizedNumberString);

  /** Check if original value contained "k" (kilometers) */
  const containsKmTag = /k/i.test(cleanStringOrigDist);

  /** * Standardization: If you were unable to extract a valid number from the string
   * Returns "Invalid data" instead of the dirty string
   */
  if (!Number.isFinite(numericValue)) return presentStatus(DATA_STATUS.INVALID);

  /** Convert km to meters if needed (logic: inputs with 'k' are already km, but we want base m for calculation?
   * logic adjustment: if tag says 'k', multiply by 1000 to get meters) */
  if (containsKmTag) numericValue = numericValue * 1000;

  /** Convert meters to km for display */
  const valueInKm = numericValue / 1000;

  /** Format based on magnitude */
  if (valueInKm >= 10) return `${Math.round(valueInKm)} km`;
  if (valueInKm >= 1) return `${valueInKm.toFixed(1)} km`;
  return `${Math.round(numericValue)} m`;
}

/**
 * Counts and displays neighborhoods in route
 *
 * @param {RowData[]} rows - Array of delivery rows
 * @param {string[] | null} availableCols - Available columns in the data
 * @returns {string} Formatted neighborhood summary or status message
 */
export function summarizeNeighborhoods(rows: RowData[], availableCols: string[] | null): string {
  const neighborhoodCounts: Record<string, number> = {};

  /** Check columns before starting */
  if (!availableCols?.includes(COLUMN_NAMES.ZIPCODE) && !availableCols?.includes(COLUMN_NAMES.NEIGHBORHOOD)) {
    return presentStatus(DATA_STATUS.MISSING);
  }

  /** Prefer Zipcode for official neighborhood lookup */
  if (availableCols?.includes(COLUMN_NAMES.ZIPCODE)) {
    rows.forEach((row) => {
      const rawZip = row[COLUMN_NAMES.ZIPCODE];
      if (rawZip) {
        const zipStr = String(rawZip).trim();
        const cleanZip = zipStr.replace(/\D/g, "");
        if (cleanZip) {
          const cepEntry = zipcodeMapNeighborhood.get(cleanZip);
          if (cepEntry && cepEntry.bairro) {
            const bairro = cepEntry.bairro.trim();
            if (bairro) {
              neighborhoodCounts[bairro] = (neighborhoodCounts[bairro] || 0) + 1;
            }
          }
        }
      }
    });
  } else if (availableCols?.includes(COLUMN_NAMES.NEIGHBORHOOD)) {
    rows.forEach((row) => {
      const raw = row[COLUMN_NAMES.NEIGHBORHOOD];
      if (raw) {
        const s = String(raw).trim();
        if (s) {
          const normalized = normalizeString(s);
          neighborhoodCounts[normalized] = (neighborhoodCounts[normalized] || 0) + 1;
        }
      }
    });
  }

  /** Standardization: No valid values found */
  if (Object.keys(neighborhoodCounts).length === 0) return presentStatus(DATA_STATUS.EMPTY);

  return Object.entries(neighborhoodCounts)
    .sort((a, b) => b[1] - a[1]) // Sort by count descending
    .map(([k, v]) => `${toTitleCase(k)}: ${v}`)
    .join(", ");
}

// ===========================================================================================
// Additional specific getters
// ===========================================================================================

/**
 * Gets the last stop number for the route.
 * Procura a última linha com valor na coluna STOP.
 *
 * @param {RowData[]} rows - Array of delivery rows
 * @param {string[] | null} availableCols - Available columns in the data
 * @returns {string} Last stop number or status message
 */
export function getNumberOfStops(rows: RowData[], availableCols: string[] | null): string {
  if ((rows?.length ?? 0) > 0 && availableCols?.includes(COLUMN_NAMES.STOP)) {
    // Busca reversa pela última linha com valor válido
    const lastStopCandidate = [...rows].reverse().find((r) => r[COLUMN_NAMES.STOP])?.[COLUMN_NAMES.STOP];
    if (isStatus(lastStopCandidate)) return presentStatus(lastStopCandidate);
    if (typeof lastStopCandidate === "string" || typeof lastStopCandidate === "number") {
      return String(lastStopCandidate);
    }
    return "-";
  }
  return presentStatus(DATA_STATUS.MISSING);
}
/**
 * Gets the total number of packages for the route.
 * Tries COLUMN_NAMES.NUM_OF_ORDER (Num of Order),
 * falls back to last row's COLUMN_NAMES.SEQUENCE if not available.
 *
 * @param {RowData[]} rows - Array of delivery rows
 * @param {string[] | null} availableCols - Available columns in the data
 * @returns {string} Total packages or status message
 */
export function getTotalPacks(rows: RowData[], availableCols: string[] | null): string {
  // Try NUM_OF_ORDER first
  if (availableCols?.includes(COLUMN_NAMES.NUM_OF_ORDER)) {
    const val = safeGetFirst(rows, COLUMN_NAMES.NUM_OF_ORDER, availableCols);
    if (isStatus(val)) return presentStatus(val);
    if (val !== undefined && val !== null && val !== "") return String(val);
  }
  // Fallback: try last row's SEQUENCE
  if (rows.length > 0 && availableCols?.includes(COLUMN_NAMES.SEQUENCE)) {
    const lastVal = safeGetLast(rows, COLUMN_NAMES.SEQUENCE, availableCols);
    if (isStatus(lastVal)) return presentStatus(lastVal);
    if (lastVal !== undefined && lastVal !== null && lastVal !== "") return String(lastVal);
  }
  // If nothing found, return empty status
  return presentStatus(DATA_STATUS.EMPTY);
}
/** Gets the shift time for the route
 *
 * @param {RowData[]} rows - Array of delivery rows
 * @param {string[] | null} availableCols - Available columns in the data
 * @returns {string} Shift time or status message
 */
export function getShiftTime(rows: RowData[], availableCols: string[] | null): string {
  /** 1. Securely fetches raw data */
  const str = safeGetFirst(rows, COLUMN_NAMES.SHIFT_TIME, availableCols);
  /** If there is no data, returns the default "No data" */
  if (isStatus(str)) return presentStatus(str);
  if (!str) return presentStatus(DATA_STATUS.EMPTY);
  return str;
}

/** Gets the date for the route
 *
 * @param {RowData[]} rows - Array of delivery rows
 * @param {string[] | null} availableCols - Available columns in the data
 * @returns {string} Date or status message
 */
export function getDate(rows: RowData[], availableCols: string[] | null): string {
  /** 1. Securely fetches raw data */
  const str = safeGetFirst(rows, COLUMN_NAMES.DATE, availableCols);

  /** If there is a valid date, return it */
  if (!isStatus(str) && str) return str;

  // If missing or empty, try to extract from Planned AT code
  if (availableCols?.includes(COLUMN_NAMES.PLANNED_AT)) {
    for (const row of rows) {
      const atCode = row[COLUMN_NAMES.PLANNED_AT];
      if (typeof atCode === "string" && /^AT\d{8}/.test(atCode)) {
        // Extract date part: ATYYYYMMDDxxxxx
        const year = atCode.slice(2, 6);
        const month = atCode.slice(6, 8);
        const day = atCode.slice(8, 10);
        if (year && month && day) {
          return `${day}/${month}/${year}`;
        }
      }
    }
  }

  // Fallback to presentStatus for missing/empty
  return presentStatus(isStatus(str) ? str : DATA_STATUS.EMPTY);
}

/**
 * Gets the hub for the route
 *
 * @param {RowData[]} rows - Array of delivery rows
 * @param {string[] | null} availableCols - Available columns in the data
 * @returns {string} Hub or status message
 */
export function getHub(rows: RowData[], availableCols: string[] | null): string {
  /** 1. Securely fetches raw data */
  const str = safeGetFirst(rows, COLUMN_NAMES.HUB, availableCols);
  /** If there is no data, returns the default "No data" */
  if (isStatus(str)) return presentStatus(str);
  if (!str) return presentStatus(DATA_STATUS.EMPTY);
  return str;
}

export function getCity(rows: RowData[], availableCols: string[] | null): string {
  /** 1. Securely fetches raw data */
  const str = safeGetFirst(rows, COLUMN_NAMES.CITY, availableCols);
  /** If there is no data, returns the default "No data" */
  if (isStatus(str)) return presentStatus(str);
  if (!str) return presentStatus(DATA_STATUS.EMPTY);
  return str;
}

/**
 * Extracts unique "Planned AT" codes from route
 *
 * @param {RowData[]} rows - Array of delivery rows
 * @param {string[] | null} availableCols - Available columns in the data
 * @returns {string} Comma-separated unique AT codes or status message
 */
export function getUniquePlannedATs(rows: RowData[], availableCols: string[] | null): string {
  if (!availableCols?.includes(COLUMN_NAMES.PLANNED_AT)) return presentStatus(DATA_STATUS.MISSING);

  const uniqueCodes = new Set<string>();

  rows.forEach((row) => {
    const val = row[COLUMN_NAMES.PLANNED_AT];
    if (val) {
      uniqueCodes.add(String(val));
    }
  });

  /** Standardization: No valid values found */
  if (uniqueCodes.size === 0) return presentStatus(DATA_STATUS.EMPTY);

  return Array.from(uniqueCodes).join(", ");
}

/**
 * Gets the vehicle type used in the route
 *
 * @param {RowData[]} rows - Array of delivery rows
 * @param {string[] | null | undefined} availableCols - Available columns in the data
 * @returns {string} Vehicle type or status message
 */
export function getVehicleType(rows: RowData[], availableCols: string[] | null | undefined): string {
  /** Safety check */
  const rawValue = safeGetFirst(rows, COLUMN_NAMES.PLANNED_VEHICLE_TYPE, availableCols ?? null);

  /** Standardization: returns constant 'No data' if there is no data */
  if (isStatus(rawValue)) return presentStatus(rawValue);

  /** Apply Title Case */
  return toTitleCase(String(rawValue));
}

/**
 * Counts restricted zipcodes (Correios status "NO")
 *
 * @param {RowData[]} rows - Array of delivery rows
 * @param {string[] | null} availableCols - Available columns in the data
 * @returns {string} Count of restricted zipcodes as string
 */
export function countRestrictedZipcodes(rows: RowData[], availableCols: string[] | null): string {
  if (!availableCols?.includes(COLUMN_NAMES.ZIPCODE)) {
    return presentStatus(DATA_STATUS.MISSING);
  }

  let restrictedCount = 0;

  for (const row of rows) {
    const rawStatus = row[COLUMN_NAMES.ZIPCODE];
    if (!rawStatus) continue;

    const statusStr = String(rawStatus).trim();
    const normalizedStatus = getCorreiosDeliveryStatus(statusStr);

    if (normalizedStatus === DELIVERY_KEYS.NO) {
      restrictedCount++;
    }
  }

  return String(restrictedCount);
}

/**
 * Map internal DELIVERY_KEYS status to UI label (Portuguese) or NO_DATA sentinel.
 * Centralizes formatting so components don't duplicate the mapping logic.
 *
 * @param {typeof DELIVERY_KEYS.YES | typeof DELIVERY_KEYS.NO | undefined} status - The delivery status
 * @returns {string} Formatted UI label
 */
export function formatDeliveryLabel(status: typeof DELIVERY_KEYS.YES | typeof DELIVERY_KEYS.NO | undefined): string {
  if (status === DELIVERY_KEYS.YES) return UI_LABELS.COMMON.YES;
  if (status === DELIVERY_KEYS.NO) return UI_LABELS.COMMON.NO;
  return presentStatus(DATA_STATUS.MISSING);
}

// ===========================================================================================
// Additional general formatters
// ===========================================================================================

/** Truncates text to a maximum length, adding "..." if truncated
 *
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} Truncated text
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

/** Formats a number with Brazilian Portuguese locale
 *
 * @param {number} num - The number to format
 * @returns {string} Formatted number string
 */
export function formatNumber(num: number): string {
  return new Intl.NumberFormat("pt-BR").format(num);
}

/** Normalizes a string by removing accents, converting to lowercase, and trimming whitespace
 *
 * @param {string} text - The text to normalize
 * @returns {string} Normalized text
 */
export function normalizeString(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** * Converts text to Title Case
 *
 * @param {string} text - The text to convert
 * @returns {string} Title case text
 */
export function toTitleCase(text: string): string {
  return text
    .split(/\s+/)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}
