import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { MapPin } from "lucide-react";

import { RouteMap } from "../components/RouteMap";
import { Button } from "../components/ui/button";
import { MapModeToggle, type MapMode } from "../components/map/MapModeToggle";
import { MapPanel, PANEL_COLLAPSED_PX, type PanelSnap } from "../components/map/panel/MapPanel";
import { PanelModeBar } from "../components/map/panel/PanelModeBar";
import { PanelTitle } from "../components/map/panel/PanelTitle";
import { StopItemList } from "../components/map/panel/StopItemList";
import { StopItemRow, StopItemDetail } from "../components/map/panel/StopItem";
import { useRouteUploader } from "../hooks/useRouteUploader";
import { groupRowsByStop } from "../utils/markers/stopGrouping";
import { collapseInteraction, firstAddressKey, type InteractionState } from "../utils/markers/markerModels";
import { adjacentStopKey, buildPanelItems, panelMetrics, smallestStopKey, stopPlaceSummary } from "../utils/markers/panelModels";
import { UI_LABELS } from "../constants/uiLabels";

/** The panel's two views (rev. 07/07 — TASK-RF-023.7). */
type PanelView = "selected" | "list";

/**
 * MapPage - the map focus screen (TASK-RF-022.5 + RF-023, fluxo §11,
 * `5-Visualizacao-de-Parada.png`). Reached from the Sumário's "Ver Original"
 * via `/mapa?romaneio={id}&rota={name}`.
 *
 * Since TASK-RF-023.2 this page OWNS the interaction state (lifted from
 * RouteMap) so the map and the persistent MapPanel share one source of truth:
 * `interaction` mirrors the markers; `panelStopKey` is the panel's memory —
 * never cleared, so the panel is never empty (opens on the smallest stop).
 *
 * The panel has TWO VIEWS (rev. 07/07 — no duplicated address anywhere):
 * - **selected** (default): header = ModeBar + "Resumo da parada" (title +
 *   metrics + "Ver lista completa") + divider + "Endereço selecionado" card
 *   (the selected address; falls back to the first by Sequence). Tapping the
 *   card raises the panel to half and shows its StopItemDetail as the body.
 * - **list**: full snap, body = the whole StopItemList (scrollable, opens
 *   scrolled to the selection); each card carries "Ver no mapa", which selects
 *   the address and returns to the selected view. Leaving the full snap
 *   (drag/Escape) also returns to the selected view.
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
  const [panelView, setPanelView] = useState<PanelView>("selected");
  /** Whether the selected-address card shows its detail (selected view's body). */
  const [cardExpanded, setCardExpanded] = useState(false);
  /** Bumped so the list view re-scrolls to the selected item when it opens. */
  const [scrollSignal, setScrollSignal] = useState(0);

  /** Shared transition: updates the markers and the panel's stop memory. */
  const applyInteraction = useCallback((next: InteractionState) => {
    setInteraction(next);
    // Collapsing (null) keeps the panel on the last stop — memory only moves forward.
    if (next.expandedStopKey !== null) setPanelStopKey(next.expandedStopKey);
  }, []);

  /** MAP-originated transitions only (marker/empty-map clicks). Selecting on
      the map just updates the card's content — the panel NEVER changes snap or
      expands by itself (rev. 07/07: only taps INSIDE the panel do that). It
      only leaves the list view, since the user is now looking at the map. */
  const handleMapInteraction = useCallback(
    (next: InteractionState) => {
      applyInteraction(next);
      if (next.selectedAddressKey !== null) setPanelView("selected");
    },
    [applyInteraction]
  );

  useEffect(() => {
    if (!manifestId || loadedRef.current === manifestId) return;
    loadedRef.current = manifestId;
    void loadManifest(manifestId);
  }, [manifestId, loadManifest]);

  // Escape steps DOWN before leaving (design §5, rev. 07/07): list view →
  // selected view; taller snap → collapsed; collapsed → same destination as the
  // header back arrow. Selection is untouched — the panel never empties.
  // (RouteMap's own Escape handler is legacy-modal only.)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (panelView === "list") {
        setPanelView("selected");
        setPanelSnap("half");
      } else if (panelSnap !== "collapsed") {
        setPanelSnap("collapsed");
      } else {
        navigate(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panelView, panelSnap, navigate]);

  const currentRows = useMemo(() => (routeName && routes ? (routes[routeName] ?? []) : []), [routeName, routes]);
  const stops = useMemo(() => groupRowsByStop(currentRows), [currentRows]);

  // Initial selection = smallest numeric stop (decision 05/07). Derived — no
  // state until the user interacts; panel-only (the map doesn't focus it).
  const effectivePanelStopKey = panelStopKey ?? smallestStopKey(stops);

  if (!manifestId || !routeName) return <Navigate to="/rotas" replace />;

  const panelStop = effectivePanelStopKey !== null ? (stops[Number(effectivePanelStopKey)] ?? null) : null;
  const metrics = panelMetrics(panelStop);
  const place = stopPlaceSummary(panelStop);
  const panelItems = buildPanelItems(stops, effectivePanelStopKey);
  // Chips: address total + package counts PER TYPE, omitting absent types
  // (rev. 07/07 — a mall stop mixes residential and commercial packages).
  const TYPE_LABELS = UI_LABELS.ROUTE_MAP.ADDRESS_SHEET.TYPE_LABELS;
  const metricChips = panelStop
    ? [
        { label: UI_LABELS.MAP_PANEL.METRIC_ADDRESSES(metrics.addressCount) },
        ...(metrics.packagesByType.residential > 0 ? [{ label: UI_LABELS.MAP_PANEL.METRIC_TYPED_PACKAGES(TYPE_LABELS.RESIDENTIAL, metrics.packagesByType.residential) }] : []),
        ...(metrics.packagesByType.commercial > 0 ? [{ label: UI_LABELS.MAP_PANEL.METRIC_TYPED_PACKAGES(TYPE_LABELS.COMMERCIAL, metrics.packagesByType.commercial) }] : []),
        ...(metrics.packagesByType.indefinite > 0 ? [{ label: UI_LABELS.MAP_PANEL.METRIC_TYPED_PACKAGES(TYPE_LABELS.INDEFINITE, metrics.packagesByType.indefinite) }] : []),
      ]
    : [];
  // Selected-address card: the SELECTED address, or the first by Sequence while
  // nothing is selected — the card is never empty.
  const selectedItem = panelItems.find((item) => item.addressKey === interaction.selectedAddressKey) ?? panelItems[0] ?? null;

  /** StopStepper: expands + focuses the target on the map, selecting its FIRST
      address (lowest Sequence — rev. 07/07, same rule as clicking the stop). */
  const handleStepStop = (direction: 1 | -1) => {
    const nextKey = adjacentStopKey(stops, effectivePanelStopKey, direction);
    if (nextKey === null) return;
    applyInteraction({ expandedStopKey: nextKey, selectedAddressKey: firstAddressKey(stops, Number(nextKey)) });
  };

  /** Selected-address card tap: toggles its detail in the panel itself; opening
      raises the panel ENOUGH for the package list (rev. 07/07: ≤2 packages fit
      the half snap; more → full) and mirrors the selection on the map. */
  const handleCardTap = () => {
    if (!selectedItem) return;
    if (cardExpanded) {
      setCardExpanded(false);
      return;
    }
    applyInteraction({ expandedStopKey: effectivePanelStopKey, selectedAddressKey: selectedItem.addressKey });
    setCardExpanded(true);
    const target: PanelSnap = selectedItem.packageCount > 2 ? "full" : "half";
    setPanelSnap((current) => (current === "full" ? "full" : target));
  };

  /** "Ver lista completa": the list view lives at the FULL snap (the only one
      whose body scrolls) and opens scrolled to the selected item. */
  const handleShowList = () => {
    setPanelView("list");
    setPanelSnap("full");
    setScrollSignal((count) => count + 1);
  };

  /** "Esconder lista": back to the selected view at half (map visible again). */
  const handleHideList = () => {
    setPanelView("selected");
    setPanelSnap("half");
  };

  /** "Ver no mapa" (list view): selects the address and returns to the selected
      view at half — map focused, card open (rev. 07/07). */
  const handleShowOnMap = (addressKey: string) => {
    applyInteraction({ expandedStopKey: effectivePanelStopKey, selectedAddressKey: addressKey });
    setCardExpanded(true);
    setPanelView("selected");
    setPanelSnap("half");
  };

  /** Drag settle: leaving the full snap while in the list view returns to the
      selected view — the list is useless below full (rev. 07/07). */
  const handleSnapChange = (next: PanelSnap) => {
    setPanelSnap(next);
    if (next !== "full") setPanelView((view) => (view === "list" ? "selected" : view));
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
          {/* Embedded: no internal close/Escape (this page owns both); fitBounds pads
              the bottom so the route never frames behind the collapsed panel. */}
          <RouteMap
            rows={currentRows}
            availableCols={availableCols}
            embedded
            onClose={() => navigate(-1)}
            interaction={interaction}
            onInteractionChange={handleMapInteraction}
            bottomObstructionPx={PANEL_COLLAPSED_PX}
          />

          {/* Toggle floats OVER the map (fluxo §15.4: dominant map, compact overlays —
              no dedicated bar). z-index above Leaflet's panes/controls (~1000). */}
          <div className="absolute left-1/2 top-3 z-[1100] -translate-x-1/2">
            <MapModeToggle mode={mode} onModeChange={setMode} />
          </div>

          {/* Persistent bottom panel, TWO views (rev. 07/07): selected (default)
              × full list. The header is the collapsed-snap content. */}
          <MapPanel
            snap={panelSnap}
            onSnapChange={handleSnapChange}
            header={
              <div className="pt-1">
                <PanelModeBar modeLabel={UI_LABELS.MAP_PANEL.MODE_VIEW} onPrevStop={() => handleStepStop(-1)} onNextStop={() => handleStepStop(1)} />

                {/* Section 1 — Resumo da parada. The list toggle lives BESIDE the
                    section label (rev. 07/07) and never disappears: it flips to
                    "Esconder lista" while the list view is open. */}
                <div className="flex items-center justify-between gap-2 px-4">
                  <p className="text-xs font-medium text-muted-foreground">{UI_LABELS.MAP_PANEL.SECTION_STOP}</p>
                  <Button type="button" variant="outline" size="sm" data-vaul-no-drag className="shrink-0" onClick={panelView === "list" ? handleHideList : handleShowList}>
                    {panelView === "list" ? UI_LABELS.MAP_PANEL.HIDE_FULL_LIST : UI_LABELS.MAP_PANEL.VIEW_FULL_LIST}
                  </Button>
                </div>
                <PanelTitle stopNumber={panelStop && panelStop.hasStop ? panelStop.stop : null} neighborhoods={place.neighborhoods} zipcodes={place.zipcodes} metrics={metricChips} />

                {/* Section 2 — Endereço selecionado (selected view only: the list
                    view IS the addresses; no duplication anywhere). */}
                {panelView === "selected" && selectedItem && (
                  <div className="border-t border-input">
                    <p className="px-4 pt-2 text-xs font-medium text-muted-foreground">{UI_LABELS.MAP_PANEL.SECTION_SELECTED}</p>
                    <StopItemRow item={selectedItem} onTap={handleCardTap} highlighted={cardExpanded} expanded={cardExpanded} />
                  </div>
                )}
              </div>
            }
          >
            {panelView === "list" ? (
              <StopItemList
                items={panelItems}
                selectedKey={interaction.selectedAddressKey}
                scrollSignal={scrollSignal}
                itemTrailing={(item) => (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    data-vaul-no-drag
                    aria-label={UI_LABELS.MAP_PANEL.VIEW_ON_MAP}
                    title={UI_LABELS.MAP_PANEL.VIEW_ON_MAP}
                    onClick={() => handleShowOnMap(item.addressKey)}
                  >
                    <MapPin aria-hidden />
                  </Button>
                )}
              />
            ) : (
              cardExpanded && selectedItem && <StopItemDetail item={selectedItem} />
            )}
          </MapPanel>
        </>
      )}
    </div>
  );
}

export default MapPage;
