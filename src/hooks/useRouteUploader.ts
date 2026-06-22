import { useState, useCallback } from "react";
import { processExcelFile } from "../utils/excelProcessor";
import { hasValidFileExtension } from "../utils/validators";
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
    }

    /** Turn off loading spinner */
    setLoading(false);
    /** Empty dependency array = function never changes */
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
    handleFileUpload,
  };
}
