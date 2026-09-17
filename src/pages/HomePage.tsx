import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import { FileUploader } from "../components/FileUploader";
import { useRouteUploader } from "../hooks/useRouteUploader";
import { parseAndValidateRouteJson, importRoutePayload, readFileAsText } from "../services/routeExport";
import { UI_LABELS } from "../constants/uiLabels";

/**
 * HomePage - the "enviar" screen (fluxo §15.2, TASK-RF-022.2; formerly
 * RouteViewer until TASK-REF-011 removed the legacy inline viewer). HOME is
 * upload-only: the FileUploader (with the instructions spoiler) validates and
 * persists the manifest, and the app navigates on — a duplicate goes to the
 * Rotas tab with the existing card selected (RN-23); a fresh save goes
 * straight to the Sumário (single route) or to the Rotas tab (multi).
 *
 * It also supports importing a ready-made JSON route (TASK-RF-013) that
 * navigates straight to "Meu roteiro" on the map.
 *
 * If persisting FAILS (IndexedDB error) the user stays here with the
 * FileUploader warning and simply retries — there is no inline fallback
 * viewer anymore (decision registered in TASK-REF-011).
 */
function HomePage() {
  const navigate = useNavigate();
  const { routes, loading, error, missingCols, manifestSave, handleFileUpload, loadExampleManifest } = useRouteUploader();
  const [importError, setImportError] = useState<string | null>(null);
  const [importLoading, setImportLoading] = useState(false);

  const handleImportRouteFile = useCallback(
    async (file: File) => {
      console.log(`[HomePage] handleImportRouteFile iniciado para: '${file.name}'`);
      setImportLoading(true);
      setImportError(null);
      try {
        const text = await readFileAsText(file);
        const parseResult = parseAndValidateRouteJson(text);
        if (!parseResult.ok) {
          console.warn(`[HomePage] parseAndValidateRouteJson falhou:`, parseResult.error);
          setImportError(parseResult.error);
          setImportLoading(false);
          return;
        }
        const bytes = await file.arrayBuffer();
        console.log(`[HomePage] handleImportRouteFile: chamando importRoutePayload...`);
        const importResult = await importRoutePayload(parseResult.payload, bytes);
        console.log(`[HomePage] handleImportRouteFile: importRoutePayload retornou`, importResult);
        if (!importResult.ok) {
          setImportError(importResult.error);
          setImportLoading(false);
          return;
        }
        navigate(`/mapa?romaneio=${encodeURIComponent(parseResult.payload.manifestId)}&rota=${encodeURIComponent(parseResult.payload.routeName)}&modo=roteiro`);
      } catch (err) {
        console.error(`[HomePage] erro em handleImportRouteFile:`, err);
        setImportError(UI_LABELS.FILE_UPLOADER.IMPORT_JSON_ERROR);
      } finally {
        setImportLoading(false);
      }
    },
    [navigate]
  );

  useEffect(() => {
    if (!manifestSave) return;
    if (manifestSave.status === "duplicate") {
      navigate(`/rotas?sel=${encodeURIComponent(manifestSave.meta.id)}`, { replace: true });
      return;
    }
    if (manifestSave.status === "saved") {
      const { meta } = manifestSave;
      const onlyRoute = meta.kind === "single" ? meta.routes[0] : undefined;
      if (onlyRoute) navigate(`/sumario?romaneio=${encodeURIComponent(meta.id)}&rota=${encodeURIComponent(onlyRoute.name)}`);
      else navigate(`/rotas?sel=${encodeURIComponent(meta.id)}`);
    }
  }, [manifestSave, navigate]);

  return (
    <div className="mx-auto flex max-w-7xl flex-col items-center justify-center px-4 py-3">
      <FileUploader
        onFileUpload={handleFileUpload}
        onTryExample={loadExampleManifest}
        onImportRouteFile={handleImportRouteFile}
        loading={loading || importLoading}
        hasRoutes={!!routes}
        error={error || importError}
        missingCols={missingCols}
        manifestSave={manifestSave}
      />
    </div>
  );
}

export default HomePage;
