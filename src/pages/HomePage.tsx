import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

import { FileUploader } from "../components/FileUploader";
import { useRouteUploader } from "../hooks/useRouteUploader";

/**
 * HomePage - the "enviar" screen (fluxo §15.2, TASK-RF-022.2; formerly
 * RouteViewer until TASK-REF-011 removed the legacy inline viewer). HOME is
 * upload-only: the FileUploader (with the instructions spoiler) validates and
 * persists the manifest, and the app navigates on — a duplicate goes to the
 * Rotas tab with the existing card selected (RN-23); a fresh save goes
 * straight to the Sumário (single route) or to the Rotas tab (multi).
 *
 * If persisting FAILS (IndexedDB error) the user stays here with the
 * FileUploader warning and simply retries — there is no inline fallback
 * viewer anymore (decision registered in TASK-REF-011).
 */
function HomePage() {
  const navigate = useNavigate();
  const { routes, loading, error, missingCols, manifestSave, handleFileUpload, loadExampleManifest } = useRouteUploader();

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
      <FileUploader onFileUpload={handleFileUpload} onTryExample={loadExampleManifest} loading={loading} hasRoutes={!!routes} error={error} missingCols={missingCols} manifestSave={manifestSave} />
    </div>
  );
}

export default HomePage;
