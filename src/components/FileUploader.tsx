import React, { useState } from "react";
import { ExampleTable } from "./ExampleTable";

interface Props {
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void; // Handler from useRouteUploader hook
  loading: boolean; // Shows spinner when true
  hasRoutes: boolean; // Hides instructions after successful upload
  error: string | null; // Error message to display
  missingCols?: string[]; // Columns missing from the uploaded file
}
import { UPLOAD_INSTRUCTIONS } from "../constants";
import { UI_LABELS } from "../constants/uiLabels";

/**
 * FileUploader - File input component with instructions and feedback
 *
 * Displays:
 * - Hidden file input triggered by a styled button
 * - Upload instructions and example table (before file upload)
 * - Loading spinner (during processing)
 * - Error messages (if upload fails)
 *
 * @param {(e: React.ChangeEvent<HTMLInputElement>) => void} onFileUpload - Handler for file selection event from useRouteUploader hook
 * @param {boolean} loading - Shows spinner when true
 * @param {boolean} hasRoutes - Hides instructions after successful upload
 * @param {string | null} error - Error message to display, null if no error
 * @returns {JSX.Element} The rendered FileUploader component
 */
export const FileUploader: React.FC<Props> = ({ onFileUpload, loading, hasRoutes, error, missingCols = [] }) => {
  // State to track selected file name
  const [fileName, setFileName] = useState<string | null>(null);

  // Handle file selection - update fileName and call parent's onFileUpload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
    } else {
      setFileName(null);
    }
    onFileUpload(e);
  };

  return (
    <div className="flex flex-col items-center text-center py-2">
      {/* Hidden file input - triggered by clicking the label below */}
      <input
        id="file-input"
        type="file"
        accept=".xlsx, .csv"
        className="hidden"
        onChange={handleFileChange}
        // Reset value to allow re-uploading the same file
        onClick={(e) => (e.currentTarget.value = "")}
      />

      {/* Button that triggers file input */}
      <label
        htmlFor="file-input"
        className="px-4 py-2 bg-primary rounded border border-primary text-white hover:bg-primary shadow-md hover:bg-primary/90 hover:border-white hover:shadow-primary transition  disabled:opacity-60"
      >
        {loading ? UI_LABELS.FILE_UPLOADER.PROCESSING : UI_LABELS.FILE_UPLOADER.UPLOAD}
      </label>

      {/* Show selected file name or format instructions */}
      <div className="text-sm text-gray-700 pt-1 pb-4">{fileName ? UI_LABELS.FILE_UPLOADER.FILE_SELECTED(fileName) : UI_LABELS.FILE_UPLOADER.SELECT_FILE}</div>

      {/* Error alert if upload fails - always show if error exists (Arquivo inválido. Use XLSX ou CSV.)(src/utils/excelProcessor.ts) */}
      {error && (
        <div className="m-2 p-2 rounded border border-danger bg-danger/10 text-danger font-semibold flex items-center justify-center">
          <span>{error}</span>
        </div>
      )}

      {/* Warning if columns are missing from Excel file */}
      {missingCols.length > 0 && (
        <div className="p-3 rounded border bg-warning/10 border-warning/80 mb-4 text-warning flex justify-center gap-1">
          <span className="font-semibold text-warning ">{UI_LABELS.FILE_UPLOADER.INCOMPLETE_SHEET}</span> {missingCols.join(", ")}
        </div>
      )}

      {/* Show instructions only before file is uploaded */}
      {!loading && !hasRoutes && (
        <div className="items-center w-screen max-w-6xl">
          <div className="mt-5 p-4 border rounded-lg bg-gray-50 text-left m-4">
            <h5 className="mb-3 font-semibold text-lg text-primary">{UI_LABELS.FILE_UPLOADER.INSTRUCTIONS}</h5>
            <ul className="text-sm text-gray-800 space-y-1 list-disc list-inside">
              {/* Render instruction list from constants */}
              {UPLOAD_INSTRUCTIONS.map((text, index) => (
                <li key={index}>{text}</li>
              ))}
            </ul>
          </div>

          <ExampleTable />
        </div>
      )}

      {/* Loading spinner during file processing */}
      {loading && (
        <div className="mt-3 flex items-center justify-center gap-2 text-primary">
          <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" aria-hidden />
          <span className="text-sm">{UI_LABELS.FILE_UPLOADER.LOADING}</span>
        </div>
      )}
    </div>
  );
};
