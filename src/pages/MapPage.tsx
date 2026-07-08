import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { MapPin } from "lucide-react";

import { RouteMap } from "../components/RouteMap";
import { Button } from "../components/ui/button";
import { MapModeToggle, MODE_QUERY_PARAM, MODE_QUERY_ROTEIRO, type MapMode } from "../components/map/MapModeToggle";
import { MapPanel, PANEL_COLLAPSED_PX, type PanelSnap } from "../components/map/panel/MapPanel";
import { PanelModeBar } from "../components/map/panel/PanelModeBar";
import { PanelTitle } from "../components/map/panel/PanelTitle";
import { RoteiroPanelHeader } from "../components/map/panel/RoteiroPanelHeader";
import { RoteiroStartSection, type StartPhase } from "../components/map/panel/RoteiroStartSection";
import { StopItemList } from "../components/map/panel/StopItemList";
import { StopItemRow, StopItemDetail } from "../components/map/panel/StopItem";
import { useManifestFromUrl } from "../hooks/useManifestFromUrl";
import { useRouteBuilder } from "../hooks/useRouteBuilder";
import { useRoadGraph } from "../hooks/useRoadGraph";
import type { RowData } from "../types";
import type { LatLng } from "../types/routing";
import { groupRowsByStop } from "../utils/markers/stopGrouping";
import { collapseInteraction, firstAddressKey, type InteractionState, type MarkerModel } from "../utils/markers/markerModels";
import { adjacentStopKey, buildPanelItems, panelMetrics, smallestStopKey, stopPlaceSummary } from "../utils/markers/panelModels";
import { computeRoteiroMarkerModels } from "../utils/markers/roteiroModels";
import { buildDeliveryPoints } from "../utils/routing/points";
import { remainingCounts, suggestedNextPointId, suggestionOrigin } from "../utils/routing/builder";
import { indexPointsById } from "../utils/routing/selectors";
import { pedestrianGraph } from "../utils/routing/pedestrian";
import { suggestionPath } from "../utils/routing/suggestion";
import { isWithinRioBounds } from "../utils/coordinates";
import { formatMeters } from "../utils/formatters";
import { UI_LABELS } from "../constants/uiLabels";

/** The panel's two views (rev. 07/07 — TASK-RF-023.7). */
type PanelView = "selected" | "list";

/**
 * MapPage - the map focus screen (TASK-RF-022.5 + RF-023 + RF-006.2, fluxo §11).
 * Reached via `/mapa?romaneio={id}&rota={name}` ("Ver Original") or with
 * `&modo=roteiro` appended (the Sumário's "Criar Roteiro").
 *
 * This outer component only loads the manifest and gates on loading/error/URL;
 * the actual screen state lives in MapScreen, keyed by manifest+route so the
 * route builder initializes over the REAL rows (never the loading-state []).
 */
function MapPage() {
  const { manifestId, routeName, routes, loading, error, currentRows } = useManifestFromUrl();

  if (!manifestId || !routeName) return <Navigate to="/rotas" replace />;

  return (
    <div className="relative h-[calc(100vh-3.5rem)]">
      {loading && (
        <div className="flex h-full items-center justify-center gap-2 text-primary">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden />
          <span className="text-sm">{UI_LABELS.FILE_UPLOADER.LOADING}</span>
        </div>
      )}

      {error && <div className="m-4 rounded-md border border-destructive bg-destructive/10 p-3 text-center font-semibold text-destructive">{error}</div>}

      {!loading && !error && routes && <MapScreen key={`${manifestId}:${routeName}`} rows={currentRows} />}
    </div>
  );
}

/**
 * MapScreen - the loaded map screen; owns ALL the screen state (interaction,
 * panel, mode, builder). Two modes over the same structure (ADR-009):
 *
 * - **Original** (default): since TASK-RF-023.2 this screen OWNS the interaction
 *   state (lifted from RouteMap) so the map and the persistent MapPanel share one
 *   source of truth: `interaction` mirrors the markers; `panelStopKey` is the
 *   panel's memory — never cleared, so the panel is never empty. The panel has
 *   TWO VIEWS (rev. 07/07): selected (default) × full list.
 *
 * - **Meu roteiro** (TASK-RF-006.2): DERIVED from the `?modo=roteiro` query param
 *   (the URL is the source of truth — deep links and refresh keep the mode; the
 *   toggle writes it with `replace`). The builder state (useRouteBuilder) lives
 *   here — instantiated unconditionally so a draft survives toggling modes — and
 *   feeds RouteMap with external models (faded free points) and the panel with
 *   the remaining-work HUD. Falls back to Original when nothing is plottable.
 */
function MapScreen({ rows }: { rows: RowData[] }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ------- Meu roteiro domain (ADR-009: DeliveryPoint/RouteStop, never StopGroup) -------
  const points = useMemo(() => buildDeliveryPoints(rows), [rows]);
  const { state: builderState, dispatch } = useRouteBuilder(points);
  const roteiroAvailable = points.length > 0;
  const mode: MapMode = searchParams.get(MODE_QUERY_PARAM) === MODE_QUERY_ROTEIRO && roteiroAvailable ? "roteiro" : "original";
  const roteiroModels = useMemo(() => computeRoteiroMarkerModels(points, builderState.stops), [points, builderState.stops]);
  const remaining = remainingCounts(builderState);
  const pointsById = useMemo(() => indexPointsById(points), [points]);

  // Road graph — lazy on the roteiro enter (ADR-009 decision B); everything
  // below works with graph === null (straight-line fallbacks).
  const { graph, status: graphLoadStatus, error: graphError, retry: retryGraph } = useRoadGraph(points, mode === "roteiro");
  const pedGraph = useMemo(() => (graph ? pedestrianGraph(graph) : null), [graph]);

  // ------- Start-definition flow (RF-21) — ephemeral UI state, never in the reducer -------
  const [armedMapTap, setArmedMapTap] = useState(false);
  const [pendingPointId, setPendingPointId] = useState<string | null>(null);
  const [gpsBusy, setGpsBusy] = useState(false);
  const [startNotice, setStartNotice] = useState<string | null>(null);
  const [redefining, setRedefining] = useState(false);

  const resetStartUi = useCallback(() => {
    setArmedMapTap(false);
    setPendingPointId(null);
    setGpsBusy(false);
    setStartNotice(null);
    setRedefining(false);
  }, []);

  const hasStart = builderState.startPoint !== null;
  const pendingPoint = pendingPointId !== null ? (pointsById.get(pendingPointId) ?? null) : null;
  const startPhase: StartPhase = gpsBusy ? "locating" : pendingPointId !== null ? "confirm-point" : armedMapTap ? "arming" : !hasStart || redefining ? "no-start" : "has-start";

  const defineStart = useCallback(
    (position: LatLng) => {
      dispatch({ type: "SET_START", position });
      resetStartUi();
    },
    [dispatch, resetStartUi]
  );

  /** GPS is the primary path (fluxo §10.5/RN-20 — never paid geocoding). */
  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setStartNotice(UI_LABELS.ROUTING.GPS_UNAVAILABLE);
      return;
    }
    setGpsBusy(true);
    setStartNotice(null);
    setArmedMapTap(false);
    setPendingPointId(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsBusy(false);
        const { latitude, longitude } = position.coords;
        if (!isWithinRioBounds(latitude, longitude)) {
          setStartNotice(UI_LABELS.ROUTING.GPS_OUT_OF_BOUNDS);
          return;
        }
        defineStart({ lat: latitude, lng: longitude });
      },
      (gpsError) => {
        setGpsBusy(false);
        setStartNotice(gpsError.code === 1 ? UI_LABELS.ROUTING.GPS_DENIED : gpsError.code === 3 ? UI_LABELS.ROUTING.GPS_TIMEOUT : UI_LABELS.ROUTING.GPS_UNAVAILABLE);
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 30_000 }
    );
  };

  /** Armed map tap → the tapped coordinate becomes the start (decision 08/07). */
  const handleMapTap = (latlng: LatLng) => {
    if (!armedMapTap) return;
    defineStart(latlng);
  };

  /** Tap on a faded point: without a start (or redefining) it asks for
      confirmation ("partir deste endereço" — decision 08/07); with a start it
      re-points the dashed suggestion (fluxo §6). */
  const handleModelTap = (model: MarkerModel) => {
    if (!hasStart || redefining) {
      setPendingPointId(model.key);
      setArmedMapTap(false);
      setStartNotice(null);
      return;
    }
    dispatch({ type: "SET_NEXT_SUGGESTION", pointId: model.key });
  };

  const handleConfirmPoint = () => {
    if (!pendingPoint) return;
    defineStart({ lat: pendingPoint.lat, lng: pendingPoint.lng });
  };

  const handleCancelStartAction = () => {
    setArmedMapTap(false);
    setPendingPointId(null);
    setStartNotice(null);
    setRedefining(false);
  };

  // ------- Suggestion line (RF-22): rank is straight-line (selector); the path
  // and the real walking distance are computed for the chosen target only. -----
  const origin = suggestionOrigin(builderState);
  const suggestedId = suggestedNextPointId(builderState);
  const suggestedPoint = suggestedId !== null ? (pointsById.get(suggestedId) ?? null) : null;
  const suggestion = useMemo(() => (origin && suggestedPoint ? suggestionPath(pedGraph, origin, { lat: suggestedPoint.lat, lng: suggestedPoint.lng }) : null), [pedGraph, origin, suggestedPoint]);
  const suggestionLabel =
    suggestion && suggestedPoint
      ? `${UI_LABELS.MAP_PANEL.ROTEIRO_START.SUGGESTION(suggestedPoint.address || UI_LABELS.COMMON.NO_DATA, formatMeters(suggestion.distanceMeters))}${suggestion.viaStreets ? "" : ` ${UI_LABELS.MAP_PANEL.ROTEIRO_START.SUGGESTION_STRAIGHT}`}`
      : null;

  const roteiroOverlay = useMemo(() => ({ start: builderState.startPoint, suggestionPath: suggestion?.path ?? null }), [builderState.startPoint, suggestion]);

  /** Discreet graph status for the header (ready/idle = silence). */
  const graphStatus =
    graphLoadStatus === "loading" ? { text: UI_LABELS.ROUTING.LOADING_STREETS } : graphLoadStatus === "error" ? { text: graphError ?? UI_LABELS.ROUTING.NETWORK_ERROR, onRetry: retryGraph } : null;

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

  /** Toggle handler: the URL carries the mode (replace — back leaves the map,
      it doesn't "un-toggle"). Entering the roteiro collapses the Original's
      expansion and the panel; `panelStopKey` survives, so switching back
      restores the Original panel from memory. */
  const handleModeChange = (next: MapMode) => {
    if (next === mode) return;
    resetStartUi();
    if (next === "roteiro") {
      setInteraction(collapseInteraction());
      setPanelView("selected");
      setCardExpanded(false);
      setPanelSnap("collapsed");
    }
    setSearchParams(
      (params) => {
        const nextParams = new URLSearchParams(params);
        if (next === "roteiro") nextParams.set(MODE_QUERY_PARAM, MODE_QUERY_ROTEIRO);
        else nextParams.delete(MODE_QUERY_PARAM);
        return nextParams;
      },
      { replace: true }
    );
  };

  // Escape steps DOWN before leaving (design §5, rev. 07/07): list view →
  // selected view; taller snap → collapsed; collapsed → same destination as the
  // header back arrow. Selection is untouched — the panel never empties.
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

  const stops = useMemo(() => groupRowsByStop(rows), [rows]);

  // Initial selection = smallest numeric stop (decision 05/07). Derived — no
  // state until the user interacts; panel-only (the map doesn't focus it).
  const effectivePanelStopKey = panelStopKey ?? smallestStopKey(stops);

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

  /** Original-mode panel header (TWO views — rev. 07/07). */
  const originalHeader = (
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
  );

  return (
    <>
      {/* Controlled map; fitBounds pads the bottom so the route never frames
          behind the collapsed panel. Escape/back are this screen's handlers.
          In the roteiro mode the models come from outside (ADR-009). */}
      <RouteMap
        rows={rows}
        interaction={interaction}
        onInteractionChange={handleMapInteraction}
        bottomObstructionPx={PANEL_COLLAPSED_PX}
        models={mode === "roteiro" ? roteiroModels : undefined}
        onMapTap={mode === "roteiro" ? handleMapTap : undefined}
        onModelTap={mode === "roteiro" ? handleModelTap : undefined}
        roteiroOverlay={mode === "roteiro" ? roteiroOverlay : undefined}
      />

      {/* Toggle floats OVER the map (fluxo §15.4: dominant map, compact overlays —
          no dedicated bar). z-index above Leaflet's panes/controls (~1000). */}
      <div className="absolute left-1/2 top-3 z-[1100] -translate-x-1/2">
        <MapModeToggle mode={mode} onModeChange={handleModeChange} roteiroEnabled={roteiroAvailable} />
      </div>

      {/* Persistent bottom panel. Original: TWO views (rev. 07/07). Roteiro
          (.2): the remaining-work HUD only — context panels arrive in .3/.4. */}
      <MapPanel
        snap={panelSnap}
        onSnapChange={handleSnapChange}
        header={
          mode === "roteiro" ? (
            <div>
              <RoteiroPanelHeader remainingAddresses={remaining.addresses} remainingPackages={remaining.packages} graphStatus={graphStatus} />
              <RoteiroStartSection
                phase={startPhase}
                notice={startNotice}
                pendingAddress={pendingPoint?.address}
                suggestionLabel={suggestionLabel}
                onUseGps={handleUseGps}
                onArmMapTap={() => {
                  setArmedMapTap(true);
                  setPendingPointId(null);
                  setStartNotice(null);
                }}
                onConfirmPoint={handleConfirmPoint}
                onCancel={handleCancelStartAction}
                onRedefine={() => setRedefining(true)}
              />
            </div>
          ) : (
            originalHeader
          )
        }
      >
        {mode === "roteiro" ? null : panelView === "list" ? (
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
  );
}

export default MapPage;
