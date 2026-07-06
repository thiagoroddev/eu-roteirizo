import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";

import { RouteMap } from "../components/RouteMap";
import { MapModeToggle, type MapMode } from "../components/map/MapModeToggle";
import { MapPanel, type PanelSnap } from "../components/map/panel/MapPanel";
import { PanelModeBar } from "../components/map/panel/PanelModeBar";
import { PanelTitle } from "../components/map/panel/PanelTitle";
import { AddressSheet } from "../components/map/AddressSheet";
import { useRouteUploader } from "../hooks/useRouteUploader";
import { groupRowsByStop } from "../utils/markers/stopGrouping";
import { collapseInteraction, findAddressByKey, type InteractionState } from "../utils/markers/markerModels";
import { adjacentStopKey, panelMetrics, smallestStopKey } from "../utils/markers/panelModels";
import { COLUMN_NAMES } from "../constants";
import { UI_LABELS } from "../constants/uiLabels";

/**
 * MapPage - the map focus screen (TASK-RF-022.5 + RF-023.2, fluxo §11,
 * `5-Visualizacao-de-Parada.png`). Reached from the Sumário's "Ver Original"
 * via `/mapa?romaneio={id}&rota={name}`.
 *
 * Since TASK-RF-023.2 this page OWNS the interaction state (lifted from
 * RouteMap) so the map and the persistent MapPanel share one source of truth:
 * - `interaction` mirrors the markers (expanded stop / selected address);
 * - `panelStopKey` is the panel's memory — it only moves forward, so the
 *   panel is NEVER empty (fluxo-modo-original §5, rev. 05/07): the screen
 *   opens on the smallest numeric stop and clicking the empty map collapses
 *   the markers without clearing the panel.
 *
 * Header (TASK-RF-023.3): PanelModeBar ("Modo visualização" + StopStepper) +
 * PanelTitle (stop + address + metrics). The steppers only emit an interaction
 * transition — the controlled RouteMap reacts by expanding/focusing the stop,
 * so map↔panel stay in sync through the single lifted state. Body is still the
 * interim inline AddressSheet — TASK-RF-023.4 brings the StopItemList. Leaving
 * the screen is the header back arrow (FocusShell).
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

  // Lifted interaction state (TASK-RF-023.2): map + panel, one source of truth.
  const [interaction, setInteraction] = useState<InteractionState>(collapseInteraction());
  /** The panel's "last stop" memory — never cleared (nunca "nenhuma selecionada"). */
  const [panelStopKey, setPanelStopKey] = useState<string | null>(null);
  /** Panel snap, controlled here so selections can raise it (design doc §5). */
  const [panelSnap, setPanelSnap] = useState<PanelSnap>("collapsed");

  const handleInteractionChange = useCallback((next: InteractionState) => {
    setInteraction(next);
    // Collapsing (null) keeps the panel on the last stop — memory only moves forward.
    if (next.expandedStopKey !== null) setPanelStopKey(next.expandedStopKey);
    // Selecting an address raises a collapsed panel to half — the detail becomes
    // visible without a manual drag (design doc §5). Never shrinks a taller snap.
    if (next.selectedAddressKey !== null) setPanelSnap((current) => (current === "collapsed" ? "half" : current));
  }, []);

  useEffect(() => {
    if (!manifestId || loadedRef.current === manifestId) return;
    loadedRef.current = manifestId;
    void loadManifest(manifestId);
  }, [manifestId, loadManifest]);

  const currentRows = useMemo(() => (routeName && routes ? (routes[routeName] ?? []) : []), [routeName, routes]);
  const stops = useMemo(() => groupRowsByStop(currentRows), [currentRows]);

  // Initial selection = smallest numeric stop (decision 05/07; scope pulled from
  // .5 into .2 so the header is never empty). Derived — no state until the user
  // interacts; panel-only (the map doesn't focus any stop — design doc §5).
  const effectivePanelStopKey = panelStopKey ?? smallestStopKey(stops);

  if (!manifestId || !routeName) return <Navigate to="/rotas" replace />;

  const panelStop = effectivePanelStopKey !== null ? (stops[Number(effectivePanelStopKey)] ?? null) : null;
  const panelAddress = String(panelStop?.representative.rows[0]?.[COLUMN_NAMES.DESTINATION_ADDRESS] || UI_LABELS.COMMON.NO_DATA);
  const selected = findAddressByKey(stops, interaction.selectedAddressKey);
  const metrics = panelMetrics(panelStop);

  /** StopStepper: expands + focuses the target on the map (controlled RouteMap
      reacts to expandedStopKey) and moves the panel memory. Snap untouched —
      only an address selection raises the panel (design doc §5). */
  const handleStepStop = (direction: 1 | -1) => {
    const nextKey = adjacentStopKey(stops, effectivePanelStopKey, direction);
    if (nextKey !== null) handleInteractionChange({ expandedStopKey: nextKey, selectedAddressKey: null });
  };

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
          <RouteMap rows={currentRows} availableCols={availableCols} embedded onClose={() => navigate(-1)} interaction={interaction} onInteractionChange={handleInteractionChange} />

          {/* Toggle floats OVER the map (fluxo §15.4: dominant map, compact overlays —
              no dedicated bar). z-index above Leaflet's panes/controls (~1000). */}
          <div className="absolute left-1/2 top-3 z-[1100] -translate-x-1/2">
            <MapModeToggle mode={mode} onModeChange={setMode} />
          </div>

          {/* Persistent bottom panel: real header since RF-023.3 (ModeBar +
              steppers + title/metrics); body is the interim AddressSheet until .4. */}
          <MapPanel
            snap={panelSnap}
            onSnapChange={setPanelSnap}
            header={
              <div className="pt-1">
                <PanelModeBar modeLabel={UI_LABELS.MAP_PANEL.MODE_VIEW} onPrevStop={() => handleStepStop(-1)} onNextStop={() => handleStepStop(1)} />
                <PanelTitle
                  stopNumber={panelStop && panelStop.hasStop ? panelStop.stop : null}
                  address={panelAddress}
                  metrics={panelStop ? [{ label: UI_LABELS.MAP_PANEL.METRIC_ADDRESSES(metrics.addressCount) }, { label: UI_LABELS.MAP_PANEL.METRIC_PACKAGES(metrics.packageCount) }] : []}
                />
              </div>
            }
          >
            {selected ? (
              <AddressSheet
                variant="inline"
                address={selected.address}
                stopNumber={selected.stop.hasStop ? selected.stop.stop : null}
                onClose={() => handleInteractionChange({ expandedStopKey: interaction.expandedStopKey, selectedAddressKey: null })}
              />
            ) : (
              <p className="px-4 text-sm text-muted-foreground">{UI_LABELS.MAP_PANEL.NO_ADDRESS_HINT}</p>
            )}
          </MapPanel>
        </>
      )}
    </div>
  );
}

export default MapPage;
