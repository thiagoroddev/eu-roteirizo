import { useState, useCallback } from "react";
import { processExcelFile } from "../utils/excelProcessor";
import { hasValidFileExtension } from "../utils/validators";
import { saveManifest, getManifest, getRouteRows, backfillRouteRows, deriveAvailableColsFromRows, findRouteAt, saveStandaloneManifest, type SaveManifestResult } from "../services/manifestStorage";
import { parseAndValidateRouteJson, extractAllRowsFromPayload } from "../services/routeExport";
import type { RoutesMap } from "../types";
import type { RouteUploaderReturn } from "../types/hooks";
import { EXAMPLE_MANIFEST, FILE_CONFIG, UI_LABELS } from "../constants";

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
  const processAndSave = useCallback(async (file: File) => {
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
   * FILE UPLOAD HANDLER (adapter)
   * ============================================================================
   * Thin adapter over `processAndSave`: pulls the File out of the input event.
   * The processing itself lives in `processAndSave` so other entry points — the
   * example manifest below (TASK-RF-014) — reuse the SAME pipeline (validation,
   * parsing, hashing, dedup, persistence) instead of a parallel one.
   */
  const handleFileUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      /** User cancelled file selection */
      if (!file) return;
      await processAndSave(file);
    },
    [processAndSave]
  );

  /**
   * ============================================================================
   * LOAD THE BUNDLED EXAMPLE MANIFEST (TASK-RF-014)
   * ============================================================================
   * Lets a visitor try the app with no spreadsheet of their own — the case of
   * anyone opening the published URL from a link.
   *
   * Fetches the manifest shipped in `public/romaneios/` and feeds it through the
   * exact same path as a real upload, so what the visitor sees is the real
   * pipeline, not a demo mode. Re-clicking is harmless: the SHA-256 dedup
   * (RN-23) recognises it and reopens the saved manifest.
   */
  const loadExampleManifest = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(EXAMPLE_MANIFEST.PATH);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const blob = await response.blob();
      await processAndSave(new File([blob], EXAMPLE_MANIFEST.FILE_NAME, { type: blob.type }));
    } catch {
      // Offline on a first visit (service worker has not cached it yet) or the
      // asset is missing from the build. Say so instead of failing silently.
      setError(UI_LABELS.ERRORS.EXAMPLE_UNAVAILABLE);
      setLoading(false);
    }
  }, [processAndSave]);

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

    // Fast path: rows already grouped (REF-018).
    if (routeName) {
      const rows = await getRouteRows(id, routeName);
      if (rows && rows.length > 0) {
        const effectiveCols = record.availableCols && record.availableCols.length > 0 ? record.availableCols : deriveAvailableColsFromRows(rows);
        setRoutes({ [routeName]: rows });
        setAvailableCols(effectiveCols);
        setMissingCols(record.missingCols ?? []);
        setIsSingleRoute(record.kind === "single");
        setLoading(false);
        if (!record.availableCols || record.availableCols.length === 0) {
          void saveStandaloneManifest(id, routeName, rows, effectiveCols, findRouteAt(rows), record.bytes);
        }
        return true;
      }
    }

    // JSON fallback for exported routes (RF-013)
    if (record.fileName.endsWith(".json") || record.fileType === "application/json") {
      try {
        const text = new TextDecoder().decode(record.bytes);
        const parseResult = parseAndValidateRouteJson(text);
        if (parseResult.ok) {
          const payload = parseResult.payload;
          const rows =
            Array.isArray(payload.rows) && payload.rows.length > 0
              ? payload.rows
              : payload.routes && payload.routes[payload.routeName]
                ? payload.routes[payload.routeName]
                : extractAllRowsFromPayload(payload);
          const effectiveCols = Array.isArray(payload.availableCols) && payload.availableCols.length > 0 ? payload.availableCols : deriveAvailableColsFromRows(rows);
          const effectiveRouteName = routeName ?? payload.routeName;
          setRoutes({ [effectiveRouteName]: rows });
          setAvailableCols(effectiveCols);
          setMissingCols(payload.missingCols ?? []);
          setIsSingleRoute(payload.isSingleRoute ?? true);
          setLoading(false);
          await saveStandaloneManifest(id, effectiveRouteName, rows, effectiveCols, payload.meta?.at, record.bytes);
          return true;
        }
      } catch {
        // Fallback to SheetJS below
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
    loadExampleManifest,
    loadManifest,
  };
}
