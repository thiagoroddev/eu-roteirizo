import { useState, useCallback } from "react";
import { processExcelFile } from "../utils/excelProcessor";
import { hasValidFileExtension } from "../utils/validators";
import { saveManifest, getManifest, getRouteRows, backfillRouteRows, type SaveManifestResult } from "../services/manifestStorage";
import type { RoutesMap } from "../types";
import type { RouteUploaderReturn } from "../types/hooks";
import { FILE_CONFIG, UI_LABELS } from "../constants";

/**
 * ===============================================================================================================
 * Custom Hook for File Upload & Processing
 * ==============================================================================================================
 *
 * 🎯 PURPOSE:
 * This hook encapsulates ALL the logic for:
 * 1. Accepting Excel/CSV files from user
 * 2. Validating file (type, size)
 * 3. Processing the file (parsing, organizing routes)
 * 4. Managing loading/error states
 *
 * 📚 WHY A CUSTOM HOOK?
 * - Separates business logic from UI components
 * - Makes the logic reusable (can use in multiple components)
 * - Easier to test independently
 * - Keeps components focused on rendering
 *
 * 🔄 WHAT IT RETURNS:
 * An object containing:
 * - routes: The organized route data (or null if not loaded)
 * - loading: Boolean indicating if processing is happening
 * - error: Error message string (or null if no error)
 * - availableCols: Array of column names found in the file
 * - missingCols: Array of required columns that are missing
 * - handleFileUpload: Function to call when user selects a file
 *
 * 📖 HOW TO USE:
 * const { routes, loading, error, handleFileUpload } = useRouteUploader();
 *
 * @returns {RouteUploaderReturn} The upload and processing state and handlers
 * ===================================================================================================================
 */
export function useRouteUploader(): RouteUploaderReturn {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  // Each useState manages a specific piece of data related to file upload

  /** The processed route data: { "A-1": [row1, row2], "B-3": [row3] } */
  const [routes, setRoutes] = useState<RoutesMap | null>(null);

  /** Is the file currently being processed? */
  const [loading, setLoading] = useState(false);

  /** Any error message to show to the user */
  const [error, setError] = useState<string | null>(null);

  /** Column names that were found in the uploaded file */
  const [availableCols, setAvailableCols] = useState<string[] | null>(null);

  /** Required columns that are missing from the file */
  const [missingCols, setMissingCols] = useState<string[]>([]);

  /** True when the loaded file is a single delivery route (no "Corridor Cage") */
  const [isSingleRoute, setIsSingleRoute] = useState(false);

  /** Result of persisting the manifest locally (RF-46/RN-23); null before any upload */
  const [manifestSave, setManifestSave] = useState<SaveManifestResult | null>(null);

  /**
   * ============================================================================
   * FILE UPLOAD HANDLER
   * ============================================================================
   * useCallback memoizes this function so it doesn't get recreated on every render
   * This is important for performance, especially when passed as a prop
   */
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    /** Get the selected file from the input event */
    const file = e.target.files?.[0];
    /** User cancelled file selection */
    if (!file) return;

    /**
     * ===== VALIDATION 1: File Extension =====
     * Check if file ends with .xlsx or .csv
     */
    const hasValidExtension = hasValidFileExtension(file.name, FILE_CONFIG.ACCEPTED_EXTENSIONS);

    if (!hasValidExtension) {
      setError(UI_LABELS.ERRORS.INVALID_FILE);
      /** Stop here if invalid type */
      return;
    }

    /**
     * ===== VALIDATION 2: File Size =====
     * Prevent huge files that could crash the browser
     */
    if (file.size > FILE_CONFIG.MAX_FILE_SIZE) {
      setError(UI_LABELS.ERRORS.FILE_TOO_LARGE);
      return;
    }

    /**
     * ===== RESET STATE BEFORE PROCESSING =====
     * Clear previous data to show fresh results
     */
    setLoading(true);
    setError(null);
    setRoutes(null);
    setManifestSave(null);

    /**
     * ===== PROCESS THE FILE =====
     * Call the utility function that does the heavy lifting
     * This is async because reading files takes time
     */
    const result = await processExcelFile(file);

    /** ===== HANDLE RESULT ===== */
    if (result.error) {
      /** Processing failed */
      setError(result.error);
    } else {
      /** Success! Save all the extracted data */
      setRoutes(result.routes);
      setAvailableCols(result.availableCols);
      setMissingCols(result.missingCols);
      setIsSingleRoute(!!result.isSingleRoute);

      /**
       * Persist the manifest locally (RF-46) so it can be reopened without
       * re-uploading. Never blocks viewing: a duplicate (RN-23) or a storage
       * failure is only surfaced as a notice via `manifestSave`.
       */
      setManifestSave(await saveManifest(file, result));
    }

    /** Turn off loading spinner */
    setLoading(false);
    /** Empty dependency array = function never changes */
  }, []);

  /**
   * ============================================================================
   * REOPEN A SAVED MANIFEST (TASK-RF-022.3 / RF-46 · fast path TASK-REF-018)
   * ============================================================================
   * FAST PATH (REF-018): when `routeName` is given and the manifest has stored
   * rows, read that ONE route's rows straight from IndexedDB — no SheetJS. The
   * cols come from the manifest's meta and `isSingleRoute` from its `kind`. The
   * `routes` state then holds just `{ [routeName]: rows }` — a partial map, but
   * nothing consumes other routes (the focus screens only read `currentRows`).
   *
   * FALLBACK: a manifest saved before REF-018 (no stored rows) rebuilds the File
   * from the raw bytes and reprocesses — same pipeline as a fresh upload, so it
   * still picks up parser improvements — then backfills row storage so the NEXT
   * open is fast. Does NOT re-save the manifest; manifestSave stays null.
   */
  const loadManifest = useCallback(async (id: string, routeName?: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    setRoutes(null);
    setManifestSave(null);

    const record = await getManifest(id);
    if (!record) {
      setError(UI_LABELS.FILE_UPLOADER.MANIFEST_NOT_FOUND);
      setLoading(false);
      return false;
    }

    // Fast path: rows already grouped (REF-018). `availableCols` present on the
    // meta is the marker that this manifest was saved/backfilled post-REF-018.
    if (routeName && record.availableCols) {
      const rows = await getRouteRows(id, routeName);
      if (rows) {
        setRoutes({ [routeName]: rows });
        setAvailableCols(record.availableCols);
        setMissingCols(record.missingCols ?? []);
        setIsSingleRoute(record.kind === "single");
        setLoading(false);
        return true;
      }
    }

    // Fallback: reprocess the bytes, then persist grouped rows for next time.
    const file = new File([record.bytes], record.fileName, { type: record.fileType });
    const result = await processExcelFile(file);

    if (result.error) {
      setError(result.error);
      setLoading(false);
      return false;
    }

    setRoutes(result.routes);
    setAvailableCols(result.availableCols);
    setMissingCols(result.missingCols);
    setIsSingleRoute(!!result.isSingleRoute);
    setLoading(false);
    await backfillRouteRows(id, result);
    return true;
  }, []);

  /**
   * ============================================================================
   * RETURN THE HOOK API
   * ============================================================================
   * This object is what components get when they call useRouteUploader()
   */
  return {
    routes,
    loading,
    error,
    availableCols,
    missingCols,
    isSingleRoute,
    manifestSave,
    handleFileUpload,
    loadManifest,
  };
}
