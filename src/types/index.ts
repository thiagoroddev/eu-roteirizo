/**
 * ============================================================================
 * types/index.ts - Core Type Definitions
 * ============================================================================
 *
 * This file defines the fundamental data structures used throughout the app.
 *
 * 📚 WHY TYPES ARE IMPORTANT:
 * - Catch bugs at compile-time (before running the code)
 * - Better IDE autocomplete and IntelliSense
 * - Self-documenting code (types explain what data looks like)
 * - Easier refactoring (TypeScript tells you what breaks)
 *
 * 💡 LEARNING TYPESCRIPT:
 * - interface: Defines the shape of an object
 * - type: Can be anything (union, intersection, alias)
 * - unknown: Safer than 'any' - must check before using
 * - Record<K, V>: Object with keys of type K and values of type V
 */

/** ===================================================================================================================
 * Represents ONE delivery/stop from the Excel file
 *
 * 📄 EXAMPLE:
 * const delivery: RowData = {
 *   "Sequence": 1,
 *   "Stop": 1,
 *   "Destination Address": "Rua A, 123",
 *   "Zipcode": "12345-000",
 *   "Latitude": -123456789,
 *   // ... any other columns from Excel
 * }
 *
 * 🔑 KEY CONCEPT: Dynamic Keys
 * [key: string]: unknown
 * This means: "Accept ANY property name, with ANY value type"
 *
 * ⚠️ WHY unknown INSTEAD OF any?
 * - 'any' disables type checking (dangerous!)
 * - 'unknown' forces you to check the type before using it (safer)
 *
 * @interface RowData
 * @typedef {RowData}
 * @example
 * const delivery: RowData = {
 *   "Sequence": 1,
 *   "Stop": 1,
 *   "Destination Address": "Rua A, 123",
 *   "Zipcode": "12345-000",
 *   "Latitude": -123456789,
 *   // ... any other columns from Excel
 * } ===========================================================================================================================
 */
export interface RowData {
  [key: string]: unknown;
}

/** ==============================================================================================================
 * Organizes deliveries by route name
 *
 * 📄 EXAMPLE:
 * const routes: RoutesMap = {
 *   "A-1": [
 *     { "Stop": 1, "Address": "Rua A" },
 *     { "Stop": 2, "Address": "Rua B" }
 *   ],
 *   "B-3": [
 *     { "Stop": 1, "Address": "Rua C" }
 *   ]
 * }
 *
 * 🔑 RECORD TYPE EXPLAINED:
 * Record<string, RowData[]> means:
 * - Keys are strings (route names like "A-1")
 * - Values are arrays of RowData (the deliveries for that route)
 *
 * 💡 WHY USE 'type' INSTEAD OF 'interface'?
 * For simple aliases like this, 'type' is more concise.
 * For complex object shapes, 'interface' is preferred.
 *
 *
 * @typedef {RoutesMap}
 * @example
 * const routes: RoutesMap = {
 *   "A-1": [ { ... }, { ... } ],
 *   "B-2": [ { ... } ]
 * } =============================================================================================================
 */
export type RoutesMap = Record<string, RowData[]>;

/** ==================================================================================================================
 * What comes back from processing an Excel file
 *
 * This is returned by the processExcelFile() function.
 * It contains everything we need to know about the file:
 * - Did it work? (routes will be null if it failed)
 * - What columns exist?
 * - What columns are missing?
 * - Any error messages?
 *
 * 🔑 OPTIONAL PROPERTIES:
 * error?: string
 * The '?' means this property might not exist.
 * - If processing succeeded → error is undefined
 * - If processing failed → error contains the message
 * @interface ProcessedResult
 * @typedef {ProcessedResult}
 * @example
 * const result: ProcessedResult = {
 *   routes: { "A-1": [ {...}, {...} ], "B-2": [ {...} ] },
 *   availableCols: ["Corridor Cage", "Latitude", "Longitude", ...],
 *   missingCols: ["Sequence", "Stop"],
 *   error: undefined
 * } =========================================================================================================================
 */
export interface ProcessedResult {
  /** The organized route data. Null if there was a critical error. */
  routes: RoutesMap | null;

  /** List of all column names found in the Excel file. Null if file couldn't be read. */
  availableCols: string[] | null;

  /** List of required columns that are missing from the file. */
  missingCols: string[];

  /** Error message if something went wrong during processing. */
  error?: string;
}

/// ===================================================================================================================
//* Configuration for map icons (Leaflet)
//*

export type Size = [number, number];
export interface IconConfig {
  iconSize: Size;
  iconAnchor: Size;
  popupAnchor: [number, number];
  tooltipAnchor: [number, number];
}

/** ===================================================================================================================
 * Represents a single entry from the 'risco_correios.json' dataset.
 *
 * 📄 PURPOSE:
 * Defines the structure of the static data used to check home delivery availability.
 *
 * ⚠️ IMPORTANT:
 * The property names here MUST match exactly the keys in your JSON file.
 * If you renamed them in JSON to English, this interface matches perfectly.
 *
 * @interface CorreiosEntry
 * =================================================================================================================
 */
export interface CorreiosEntry {
  /** 8-digit postal code (CEP) */
  zipcode: string;

  /** Delivery status flag: "S" (Yes) or "N" (No) */
  homeDelivery: "Yes" | "No";

  /** Descriptive message provided by Correios regarding the restriction */
  message: string;

  /** Timestamp of when this data was collected/scraped */
  date: string;
}

/**
 * Keys used to look up prepared Leaflet icons.
 * Centralizing the IconKey type here makes it available across the app.
 */
import type { EXCEL_EMPTY_VALUE, ICON_KEYS } from "../constants";

// Extracts the union of all values from an object type T
type Values<T> = T[keyof T];

/** * Keys used to identify map marker icons.
 * Derived directly from the ICON_KEYS constant.
 */
export type IconKey = Values<typeof ICON_KEYS>;

/** Internal result of address inference (logic layer only). UI translation happens elsewhere. */
export type LocationInferenceResult = typeof ICON_KEYS.HOME_CORRECTED | typeof ICON_KEYS.OFFICE_CORRECTED | typeof ICON_KEYS.INDEFINITE | typeof EXCEL_EMPTY_VALUE;
