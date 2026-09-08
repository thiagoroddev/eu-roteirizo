import React, { useState } from "react";
import { ExampleTable } from "./ExampleTable";
import type { SaveManifestResult } from "../services/manifestStorage";

interface Props {
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void; // Handler from useRouteUploader hook
  onTryExample?: () => void; // Loads the bundled example manifest (TASK-RF-014)
  onImportRouteFile?: (file: File) => void | Promise<void>; // Imports ready-made JSON route (TASK-RF-013)
  loading: boolean; // Shows spinner when true
  hasRoutes: boolean; // Hides instructions after successful upload
  error: string | null; // Error message to display
  missingCols?: string[]; // Columns missing from the uploaded file
  manifestSave?: SaveManifestResult | null; // Outcome of persisting the manifest (RF-46/RN-23 notices)
}
import { UPLOAD_INSTRUCTIONS, UPLOAD_INSTRUCTIONS_SINGLE_ROUTE } from "../constants";
import { UI_LABELS } from "../constants/uiLabels";
import { Button } from "./ui/button";

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
export const FileUploader: React.FC<Props> = ({ onFileUpload, onTryExample, onImportRouteFile, loading, hasRoutes, error, missingCols = [], manifestSave = null }) => {
  // State to track selected file name
  const [fileName, setFileName] = useState<string | null>(null);
  const jsonInputRef = React.useRef<HTMLInputElement>(null);

  // Handle file selection - update fileName and call parent's onFileUpload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFileName(file.name);
      if (file.name.toLowerCase().endsWith(".json") && onImportRouteFile) {
        void onImportRouteFile(file);
        return;
      }
    } else {
      setFileName(null);
    }
    onFileUpload(e);
  };

  const handleJsonFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (onImportRouteFile) {
      void onImportRouteFile(file);
    }
  };

  // `w-full min-w-0` no container raiz (TASK-BG-010): ele é FLEX ITEM da HomePage e nasce
  // com `min-width: auto`, então se recusava a encolher abaixo do conteúdo mínimo da
  // ExampleTable — esticava para 1152px e arrastava a página inteira na horizontal.
  // Zerar o min-width aqui é o que faz o `overflow-auto` da tabela finalmente agir.
  return (
    <div className="flex w-full min-w-0 flex-col items-center text-center py-2">
      {/* Hidden file input - triggered by clicking the label below */}
      <input
        id="file-input"
        type="file"
        accept=".xlsx, .csv, .json, application/json"
        className="hidden"
        onChange={handleFileChange}
        // Reset value to allow re-uploading the same file
        onClick={(e) => (e.currentTarget.value = "")}
      />

      {/* Button that triggers the hidden file input (label keeps the htmlFor behavior) */}
      <Button asChild size="lg" className="cursor-pointer">
        <label htmlFor="file-input">{loading ? UI_LABELS.FILE_UPLOADER.PROCESSING : UI_LABELS.FILE_UPLOADER.UPLOAD}</label>
      </Button>

      {/* Show selected file name or format instructions */}
      <div className="text-sm text-muted-foreground pt-1 pb-2">{fileName ? UI_LABELS.FILE_UPLOADER.FILE_SELECTED(fileName) : UI_LABELS.FILE_UPLOADER.SELECT_FILE}</div>

      {/* Bundled example manifest (TASK-RF-014): whoever arrives from a link has no
          spreadsheet. Hidden once a manifest is loaded — there is nothing to try anymore. */}
      {onTryExample && !hasRoutes && (
        <div className="flex flex-col items-center pb-3">
          <Button variant="secondary" size="sm" onClick={onTryExample} disabled={loading}>
            {UI_LABELS.FILE_UPLOADER.TRY_EXAMPLE}
          </Button>
          <span className="text-xs text-muted-foreground pt-1">{UI_LABELS.FILE_UPLOADER.TRY_EXAMPLE_HINT}</span>
        </div>
      )}

      {/* Hidden JSON file input (TASK-RF-013) */}
      <input id="json-file-input" ref={jsonInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleJsonFileChange} onClick={(e) => (e.currentTarget.value = "")} />

      {/* Import a ready-made roteiro (JSON) — TASK-RF-013 */}
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={() => jsonInputRef.current?.click()}
        title={UI_LABELS.FILE_UPLOADER.IMPORT_JSON}
        aria-label={UI_LABELS.FILE_UPLOADER.IMPORT_JSON}
        className="mb-4"
      >
        {UI_LABELS.FILE_UPLOADER.IMPORT_JSON}
      </Button>

      {/* Persistence notices (RF-46/RN-23): saved locally, duplicate of an existing import, or storage failure */}
      {manifestSave?.status === "saved" && <div className="text-xs text-muted-foreground pb-2">{UI_LABELS.FILE_UPLOADER.MANIFEST_SAVED}</div>}
      {manifestSave?.status === "duplicate" && (
        <div className="m-2 p-2 rounded-md border border-warning/80 bg-warning/10 text-warning-foreground text-sm">{UI_LABELS.FILE_UPLOADER.MANIFEST_DUPLICATE(manifestSave.meta.fileName)}</div>
      )}
      {manifestSave?.status === "error" && <div className="m-2 p-2 rounded-md border border-destructive bg-destructive/10 text-destructive text-sm">{UI_LABELS.FILE_UPLOADER.MANIFEST_SAVE_ERROR}</div>}

      {/* Error alert if upload fails - always show if error exists (Arquivo inválido. Use XLSX ou CSV.)(src/utils/excelProcessor.ts) */}
      {error && (
        <div className="m-2 p-2 rounded-md border border-destructive bg-destructive/10 text-destructive font-semibold flex items-center justify-center">
          <span>{error}</span>
        </div>
      )}

      {/* Warning if columns are missing from Excel file */}
      {missingCols.length > 0 && (
        <div className="p-3 rounded-md border border-warning/80 bg-warning/10 mb-4 text-warning-foreground flex justify-center gap-1">
          <span className="font-semibold">{UI_LABELS.FILE_UPLOADER.INCOMPLETE_SHEET}</span> {missingCols.join(", ")}
        </div>
      )}

      {/* Instructions spoiler (closed by default) — only before a file is uploaded.
          Native <details>/<summary>: the exact primitive for a spoiler, accessible,
          zero new dependency (fluxo §15.2, TASK-RF-022.2).
          w-full, NÃO w-screen (TASK-BG-010): 100vw aqui estourava a largura útil da
          HOME e arrastava a página inteira na horizontal.
          `min-w-0` é obrigatório junto: este div é FLEX ITEM do container acima, e flex
          item tem `min-width: auto` — sem zerar isso ele se recusa a encolher abaixo do
          conteúdo mínimo da ExampleTable e o `overflow-auto` de dentro nunca chega a agir. */}
      {!loading && !hasRoutes && (
        <div className="items-center w-full min-w-0 max-w-6xl">
          <details className="mt-3 m-4 border rounded-lg bg-muted text-left">
            <summary className="cursor-pointer select-none p-4 font-semibold text-lg text-primary">{UI_LABELS.FILE_UPLOADER.INSTRUCTIONS_SUMMARY}</summary>

            <div className="px-4 pb-4 space-y-5">
              {/* Block 1: full multi-route manifest (legacy flow) */}
              <section>
                <h5 className="mb-2 font-semibold text-primary">{UI_LABELS.FILE_UPLOADER.INSTRUCTIONS_MULTI_TITLE}</h5>
                <ul className="text-sm text-foreground space-y-1 list-disc list-inside">
                  {UPLOAD_INSTRUCTIONS.map((text, index) => (
                    <li key={index}>{text}</li>
                  ))}
                </ul>
              </section>

              {/* Block 2: single route exported from the official app (fluxo §15.2) */}
              <section>
                <h5 className="mb-2 font-semibold text-primary">{UI_LABELS.FILE_UPLOADER.INSTRUCTIONS_SINGLE_TITLE}</h5>
                <ul className="text-sm text-foreground space-y-1 list-disc list-inside">
                  {UPLOAD_INSTRUCTIONS_SINGLE_ROUTE.map((text, index) => (
                    <li key={index}>{text}</li>
                  ))}
                </ul>
              </section>

              <ExampleTable />
            </div>
          </details>
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
