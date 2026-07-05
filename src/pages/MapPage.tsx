import { useEffect, useRef, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";

import { RouteMap } from "../components/RouteMap";
import { MapModeToggle, type MapMode } from "../components/map/MapModeToggle";
import { useRouteUploader } from "../hooks/useRouteUploader";
import { UI_LABELS } from "../constants/uiLabels";

/**
 * MapPage - the map focus screen (TASK-RF-022.5, fluxo §11 "Modos do mapa",
 * `5-Visualizacao-de-Parada.png`). Reached from the Sumário's "Ver Original"
 * via `/mapa?romaneio={id}&rota={name}`.
 *
 * Minimal UI over a dominant map (fluxo §15.4): just the segmented
 * `Original | Meu roteiro` toggle below the header. Phase 1 renders only the
 * Original (read-only) side — the "Meu roteiro" side is disabled until
 * TASK-RF-010 wires it to the builder (RF-006). Leaving the screen is the
 * header back arrow (FocusShell): map → Sumário (fluxo §11).
 */
function MapPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const manifestId = searchParams.get("romaneio");
  const routeName = searchParams.get("rota");

  const { routes, loading, error, availableCols, loadManifest } = useRouteUploader();
  /** Guards the load against re-runs (same id → load once). */
  const loadedRef = useRef<string | null>(null);

  // Phase 1: always "original"; the setter exists for TASK-RF-010 to flip.
  const [mode, setMode] = useState<MapMode>("original");

  useEffect(() => {
    if (!manifestId || loadedRef.current === manifestId) return;
    loadedRef.current = manifestId;
    void loadManifest(manifestId);
  }, [manifestId, loadManifest]);

  if (!manifestId || !routeName) return <Navigate to="/rotas" replace />;

  const currentRows = (routes ? routes[routeName] : undefined) ?? [];

  return (
    <div className="relative h-[calc(100vh-3.5rem)]">
      {loading && (
        <div className="flex h-full items-center justify-center gap-2 text-primary">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden />
          <span className="text-sm">{UI_LABELS.FILE_UPLOADER.LOADING}</span>
        </div>
      )}

      {error && <div className="m-4 rounded-md border border-destructive bg-destructive/10 p-3 text-center font-semibold text-destructive">{error}</div>}

      {!loading && !error && routes && (
        <>
          {/* Embedded: no internal close button; Escape (onClose) mirrors the header back arrow. */}
          <RouteMap rows={currentRows} availableCols={availableCols} embedded onClose={() => navigate(-1)} />

          {/* Toggle floats OVER the map (fluxo §15.4: dominant map, compact overlays —
              no dedicated bar). z-index above Leaflet's panes/controls (~1000). */}
          <div className="absolute left-1/2 top-3 z-[1100] -translate-x-1/2">
            <MapModeToggle mode={mode} onModeChange={setMode} />
          </div>
        </>
      )}
    </div>
  );
}

export default MapPage;
