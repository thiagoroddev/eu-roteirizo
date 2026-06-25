/**
 * types/index.ts - Core Type Definitions
 *
 * This file defines the fundamental data structures used throughout the app.
 */

/**
 * Represents ONE delivery/stop from the Excel file.
 * Dynamic keys: accept ANY property name, with unknown value type (safer than any).
 */
export interface RowData {
  [key: string]: unknown;
}

/**
 * Organizes deliveries by route name.
 * Record<string, RowData[]>: keys are route names (e.g. "A-1"), values are their rows.
 */
export type RoutesMap = Record<string, RowData[]>;

/**
 * What comes back from processing an Excel file.
 * Returned by processExcelFile().
 */
export interface ProcessedResult {
  /** The organized route data. Null if there was a critical error. */
  routes: RoutesMap | null;

  /** List of all column names found in the Excel file. Null if file couldn't be read. */
  availableCols: string[] | null;

  /** List of required columns that are missing from the file. */
  missingCols: string[];

  /**
   * True when the file was read in single-route mode (no "Corridor Cage" column).
   * Lets the UI branch into the route-planning flow instead of the multi-route
   * selector. Undefined on error results. */
  isSingleRoute?: boolean;

  /** Error message if something went wrong during processing. */
  error?: string;
}

// Configuration for map icons (Leaflet)

export type Size = [number, number];
export interface IconConfig {
  iconSize: Size;
  iconAnchor: Size;
  popupAnchor: [number, number];
  tooltipAnchor: [number, number];
}

/**
 * Keys used to look up prepared Leaflet icons.
 * Centralizing the IconKey type here makes it available across the app.
 */
import type { EXCEL_EMPTY_VALUE, ICON_KEYS } from "../constants";

// Extracts the union of all values from an object type T
type Values<T> = T[keyof T];

/** Keys used to identify map marker icons. Derived directly from the ICON_KEYS constant. */
export type IconKey = Values<typeof ICON_KEYS>;

/** Internal result of address inference (logic layer only). UI translation happens elsewhere. */
export type LocationInferenceResult = typeof ICON_KEYS.HOME_CORRECTED | typeof ICON_KEYS.OFFICE_CORRECTED | typeof ICON_KEYS.INDEFINITE | typeof EXCEL_EMPTY_VALUE;
