/**
 * ===============================================================================================================
 * types/hooks.ts - Return Types for Custom Hooks
 * =================================================================================================================
 *
 * This file defines what each custom hook returns.
 *
 * 🎯 WHY SEPARATE FILES FOR HOOK TYPES?
 * - Keeps type definitions organized
 * - Easier to find and update
 * - Avoids circular dependencies
 * - Makes hooks more self-documenting
 *
 * 📚 NAMING CONVENTION:
 * [HookName]Return - What the hook returns
 * Example: useRouteUploader → RouteUploaderReturn
 *
 * 💡 HOW TO READ THESE:
 * Each interface describes the "contract" of what a hook provides.
 * Components that use the hook can rely on these properties existing.
 */

import type { RoutesMap } from "./index";
import type { SaveManifestResult } from "../services/manifestStorage";

/** ================================================================================================================
 * This hook manages file upload and processing.
 *
 * 📄 USAGE EXAMPLE:
 * const {
 *   routes,      // The organized data (or null)
 *   loading,     // Is it processing?
 *   error,       // Any error message?
 *   handleFileUpload  // Function to call on file select
 * } = useRouteUploader();
 *
 * 🔑 UNDERSTANDING THE TYPES:
 * - RoutesMap | null: Either the data OR null (not loaded yet/failed)
 * - string | null: Either an error message OR null (no error)
 * - string[]: Array of strings (never null, but might be empty [])
 * - boolean: true or false
 * - Function type: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
 *
 * @interface RouteUploaderReturn
 * @typedef {RouteUploaderReturn}
 * =================================================================================================================
 */
export interface RouteUploaderReturn {
  /** The processed route data, organized by route name. Null if not loaded or failed. */
  routes: RoutesMap | null;

  /** True while file is being processed, false otherwise. */
  loading: boolean;

  /** Error message if something went wrong. Null if everything is OK. */
  error: string | null;

  /** Names of columns that were found in the uploaded file. Null if no file processed yet. */
  availableCols: string[] | null;

  /** Names of required columns that are missing from the file. */
  missingCols: string[];

  /**
   * True when the loaded file is a single delivery route (no "Corridor Cage").
   * Lets the UI hide multi-route-only fields (Shift/ETA/Distance/Hub) that don't
   * exist in this mode. False before any file is processed. */
  isSingleRoute: boolean;

  /**
   * Outcome of persisting the manifest locally (TASK-RF-022.1/.2): saved,
   * duplicate (RN-23 — meta of the EXISTING record) or a storage error the UI
   * should surface. Null before any upload; reset on each new upload. A save
   * failure never blocks viewing the routes. */
  manifestSave: SaveManifestResult | null;

  /** ==================================================================================================================
   *Function to call when user selects a file.
   * Async because file processing takes time.
   * Returns Promise<void> (doesn't return a value, but is awaitable).
   *
   * @type {(e: React.ChangeEvent<HTMLInputElement>) => Promise<void>}
   * @example
   * handleFileUpload(event);
   * ==================================================================================================================
   */
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;

  /**
   * Reopens a SAVED manifest (TASK-RF-022.3/RF-46). With `routeName` (TASK-REF-018)
   * it reads that one route's stored rows directly — no reprocessing; without it,
   * or for a manifest saved before REF-018, it rebuilds the File from the raw
   * bytes and reprocesses (same pipeline as an upload, without re-saving), then
   * backfills row storage. Resolves `true` on success, `false` when the id is
   * unknown or processing fails (error state is set). */
  loadManifest: (id: string, routeName?: string) => Promise<boolean>;
}

/** ===================================================================================================================
 * This hook manages searching for routes by AT code.
 *
 * 📄 USAGE EXAMPLE:
 * const {
 *   searchAT,           // Current search input
 *   searchResult,       // Found route or "NONE"
 *   handleSearchChange, // Update search
 *   clearSearch         // Reset search
 * } = useRouteSearch(routes);
 * @interface RouteSearchReturn
 * @typedef {RouteSearchReturn}
 * ==================================================================================================================
 */
export interface RouteSearchReturn {
  /** The current value in the search input box. */
  searchAT: string;

  /**
   * The search result:
   * - null: No search performed yet
   * - "NONE": Searched but nothing found
   * - string: The route name that was found (e.g., "A-15")
   */
  searchResult: string | null;

  /** Function to call when search input changes. */
  handleSearchChange: (val: string) => void;

  /** Function to reset search state. */
  clearSearch: () => void;
}

/** ==================================================================================================================
 * This hook calculates summary statistics for a route.
 *
 * 📄 USAGE EXAMPLE:
 * const {
 *   pacotes,        // Number of packages
 *   lastStop,       // Last stop number
 *   time,           // Formatted delivery time
 *   distance,       // Formatted distance
 *   city,           // City name
 *   at,             // AT code(s)
 *   commerceCount,  // How many commercial addresses
 *   bairros         // List of neighborhoods
 * } = useRouteSummary(rows, availableCols);
 *
 * 🔑 NOTE: All properties are strings
 * Even numbers are converted to strings for display purposes.
 * This makes it easier to handle "Sem dados" (No data) cases.
 *
 * @interface RouteSummaryData
 * @typedef {RouteSummaryData}
 * =================================================================================================================
 */
export interface RouteSummaryData {
  /** Number of packages in this route (as string). */
  totalPacks: string;

  /** The last stop number in the route (as string). */
  lastStop: string;

  /** Formatted delivery time (e.g., "1 hora 30 minutos"). */
  time: string;

  /** Formatted total distance (e.g., "20.9 km"). */
  distance: string;

  /** The city name (usually same for all stops in a route). */
  city: string;

  /** The AT code(s) for this route. */
  at: string;

  /** Number of commercial/office addresses (vs residential). */
  commerceCount: string;

  /** List of neighborhoods with counts (e.g., "Copacabana: 5, Ipanema: 3"). */
  neighborhoods: string;

  /** The shift time for the route (e.g., "Morning", "Afternoon"). */
  shiftTime: string;

  /** The raw date string from the route data. */
  dateRaw: string;

  hub: string;
}
