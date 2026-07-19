import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { MapPin } from "lucide-react";

import { RouteMap } from "../components/RouteMap";
import { MapToast } from "../components/map/MapToast";
import { Button } from "../components/ui/button";
import { MapModeToggle, MODE_QUERY_PARAM, MODE_QUERY_ROTEIRO, type MapMode } from "../components/map/MapModeToggle";
import { MapPanel, PANEL_COLLAPSED_PX, type PanelSnap } from "../components/map/panel/MapPanel";
import { ORIGINAL_PANEL_SIZING, ROTEIRO_PANEL_SIZING } from "../components/map/panel/panelSizing";
import { PanelModeBar } from "../components/map/panel/PanelModeBar";
import { PanelSection } from "../components/map/panel/PanelSection";
import { PanelTitle } from "../components/map/panel/PanelTitle";
import { RoteiroPanelHeader } from "../components/map/panel/RoteiroPanelHeader";
import { RoteiroStartSection, type StartPhase } from "../components/map/panel/RoteiroStartSection";
import { RoteiroPointSection, type StopOption } from "../components/map/panel/RoteiroPointSection";
import { RoteiroDraftHeader, RoteiroDraftBody, RoteiroDraftPick } from "../components/map/panel/RoteiroDraftSection";
import { RoteiroStopSection } from "../components/map/panel/RoteiroStopSection";
import { RoteiroOverviewSection, StartRow, type OverviewStopView, type OverviewStartView } from "../components/map/panel/RoteiroOverviewSection";
import { SuggestedStopSection, type SuggestedStopView } from "../components/map/panel/SuggestedStopCard";
import type { PanelMetric } from "../components/map/panel/PanelTitle";
import { StopItemList } from "../components/map/panel/StopItemList";
import { StopItemRow, StopItemDetail } from "../components/map/panel/StopItem";
import { useTransientMessage } from "../hooks/useTransientMessage";
import { useManifestFromUrl } from "../hooks/useManifestFromUrl";
import { useRouteBuilder } from "../hooks/useRouteBuilder";
import { useRoadGraph } from "../hooks/useRoadGraph";
import type { RowData } from "../types";
import type { DeliveryPoint, LatLng } from "../types/routing";
import { groupRowsByStop } from "../utils/markers/stopGrouping";
import { collapseInteraction, focusInteraction, regroupInteraction, type InteractionState, type MarkerModel } from "../utils/markers/markerModels";
import { adjacentStopKey, buildPanelItems, panelMetrics, smallestStopKey, stopPlaceSummary, type PanelMetrics } from "../utils/markers/panelModels";
import {
  computeRoteiroMarkerModels,
  pointToStopItemData,
  addressLineOf,
  packagesByTypeFromPoints,
  stopPlaceSummaryFromPoints,
  walkEstimateLabel,
  orderedStopPoints,
} from "../utils/markers/roteiroModels";
import { buildDeliveryPoints } from "../utils/routing/points";
import { suggestionOrigin, previousAnchorOrigin, draftCandidateIds, farChosenPointIds, isComplete, toPlannedRoute, FAR_POINT_RADIUS_FACTOR, FAR_POINT_MIN_METERS } from "../utils/routing/builder";
import { getRoteiro, saveRoteiro, deleteRoteiro } from "../services/routeStorage";
import { routeProgress, nextStopSuggestion, suggestedNextSeed } from "../utils/routing/overview";
import { stopWalkEstimate, plannedRouteTotals, stopLegs } from "../utils/routing/estimates";
import { assignedPointIds, pointsWithinRadius } from "../utils/routing/selectors";
import { indexPointsById, nearestStopTo } from "../utils/routing/selectors";
import { suggestVehicleStop, defaultAnchorSeed } from "../utils/routing/vehicleStop";
import { nearestFirstOrder } from "../utils/routing/walkOrder";
import { pedestrianGraph } from "../utils/routing/pedestrian";
import { suggestionPath } from "../utils/routing/suggestion";
import { vehicleRoutePath, footCircuitPath } from "../utils/routing/routePath";
import { haversine } from "../utils/routing/geo";
import { isWithinRioBounds } from "../utils/coordinates";
import { formatMeters } from "../utils/formatters";
import { UI_LABELS } from "../constants/uiLabels";
import { MAP_CONFIG, FOCUS_MAX_ZOOM, ADDRESS_MAX_ZOOM } from "../constants";

/** The panel's views (rev. 07/07 — TASK-RF-023.7; "overview" = RF-006.8's
    study panel: the idle roteiro's default body and "Ver detalhes" anywhere). */
type PanelView = "selected" | "list" | "overview";

/** Where the panel is, per mode (RF-006.4.18): height, view and card state. */
interface ModePanelUi {
  snap: PanelSnap;
  view: PanelView;
  cardExpanded: boolean;
}

const INITIAL_PANEL_UI: ModePanelUi = { snap: "collapsed", view: "selected", cardExpanded: false };

/** Auto-save debounce (RF-008): long enough to coalesce a burst of edits,
    short enough that closing the tab right after a change rarely loses it. */
const AUTOSAVE_DEBOUNCE_MS = 800;

const TYPE_LABELS = UI_LABELS.ROUTE_MAP.ADDRESS_SHEET.TYPE_LABELS;

/** Chips of package counts PER inferred type, omitting absent types (rev.
    07/07) — shared by the Original summary and the roteiro's stop summaries
    (RF-006.4.3: "exatamente a mesma coisa que no modo Original"). */
const typedPackageChips = (packagesByType: PanelMetrics["packagesByType"]): PanelMetric[] => [
  ...(packagesByType.residential > 0 ? [{ label: UI_LABELS.MAP_PANEL.METRIC_TYPED_PACKAGES(TYPE_LABELS.RESIDENTIAL, packagesByType.residential) }] : []),
  ...(packagesByType.commercial > 0 ? [{ label: UI_LABELS.MAP_PANEL.METRIC_TYPED_PACKAGES(TYPE_LABELS.COMMERCIAL, packagesByType.commercial) }] : []),
  ...(packagesByType.indefinite > 0 ? [{ label: UI_LABELS.MAP_PANEL.METRIC_TYPED_PACKAGES(TYPE_LABELS.INDEFINITE, packagesByType.indefinite) }] : []),
];

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

      {!loading && !error && routes && <MapScreen key={`${manifestId}:${routeName}`} rows={currentRows} manifestId={manifestId} routeName={routeName} />}
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
function MapScreen({ rows, manifestId, routeName }: { rows: RowData[]; manifestId: string; routeName: string }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Lifted interaction state (TASK-RF-023.2): map + panel, one source of truth.
  const [interaction, setInteraction] = useState<InteractionState>(collapseInteraction());
  /** The panel's "last stop" memory — never cleared (nunca "nenhuma selecionada"). */
  const [panelStopKey, setPanelStopKey] = useState<string | null>(null);
  /** Bumped so the list view re-scrolls to the selected item when it opens. */
  const [scrollSignal, setScrollSignal] = useState(0);

  // ------- Meu roteiro domain (ADR-009: DeliveryPoint/RouteStop, never StopGroup) -------
  const points = useMemo(() => buildDeliveryPoints(rows), [rows]);
  const { state: builderState, dispatch } = useRouteBuilder(points);
  const roteiroAvailable = points.length > 0;
  const mode: MapMode = searchParams.get(MODE_QUERY_PARAM) === MODE_QUERY_ROTEIRO && roteiroAvailable ? "roteiro" : "original";
  /** Construction progress (RF-006.8): the concise header's %/bar and the
      overview's stat cards — the old "Faltando" HUD flipped to done/total. */
  const progress = routeProgress(builderState);
  const pointsById = useMemo(() => indexPointsById(points), [points]);

  // ------- Roteiro persistence (TASK-RF-008): hydrate on mount + auto-save -------
  /**
   * Auto-save only starts AFTER the load resolves (found or not): the very
   * first render holds an empty builder, and letting the save effect see it
   * before hydration would DELETE the stored roteiro it was about to load.
   */
  const [persistReady, setPersistReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    void getRoteiro(manifestId, routeName).then((route) => {
      if (cancelled) return;
      // Regardless of the current mode — entering by the Original and toggling
      // later must find the roteiro too (item 4 do feedback 08/07).
      if (route) dispatch({ type: "HYDRATE", route });
      setPersistReady(true);
    });
    return () => {
      cancelled = true;
    };
    // Screen-scoped: MapScreen is keyed by manifest:rota, so this runs once.
  }, [manifestId, routeName, dispatch]);

  /** RF-33: saving is free — every meaningful change persists, debounced.
      PAUSED while an edit draft is open: REOPEN_STOP moves the stop out of
      `stops`, so a mid-edit snapshot would save the roteiro WITHOUT the stop
      being edited; the pre-edit snapshot stays until Save/Cancel closes it.
      An emptied builder deletes the record, so the chip/button turn off too. */
  useEffect(() => {
    if (!persistReady || builderState.draft !== null) return;
    const meaningful = builderState.startPoint !== null || builderState.stops.length > 0;
    const timer = setTimeout(() => {
      if (meaningful) {
        void saveRoteiro(manifestId, routeName, toPlannedRoute(builderState)).then((result) => {
          if (result.status === "error" && import.meta.env.DEV) console.warn(`routeStorage: auto-save falhou — ${result.reason}`);
        });
      } else {
        void deleteRoteiro(manifestId, routeName);
      }
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [persistReady, builderState, manifestId, routeName]);

  /**
   * Panel UI kept PER MODE (RF-006.4.18). Each mode looks at a different thing —
   * the Original at a stop of the manifest, Meu roteiro at a stop being built —
   * so sharing one snap/view/card made a toggle destroy the other side's place.
   * Toggling now only swaps which bucket is read; nothing is reset.
   */
  const [panelUi, setPanelUi] = useState<Record<MapMode, ModePanelUi>>(() => ({ original: { ...INITIAL_PANEL_UI }, roteiro: { ...INITIAL_PANEL_UI } }));
  const { snap: panelSnap, view: panelView, cardExpanded } = panelUi[mode];
  /** Writes land in the ACTIVE mode's bucket; the other one keeps its place. */
  const updatePanelUi = useCallback(
    (patch: Partial<ModePanelUi> | ((current: ModePanelUi) => Partial<ModePanelUi>)) =>
      setPanelUi((previous) => {
        const current = previous[mode];
        return { ...previous, [mode]: { ...current, ...(typeof patch === "function" ? patch(current) : patch) } };
      }),
    [mode]
  );
  const setPanelSnap = useCallback(
    (next: PanelSnap | ((current: PanelSnap) => PanelSnap)) => updatePanelUi((current) => ({ snap: typeof next === "function" ? next(current.snap) : next })),
    [updatePanelUi]
  );
  const setPanelView = useCallback((view: PanelView) => updatePanelUi({ view }), [updatePanelUi]);
  const setCardExpanded = useCallback((expanded: boolean) => updatePanelUi({ cardExpanded: expanded }), [updatePanelUi]);

  // ------- Orphan/stop selection + stop draft (TASK-RF-006.4/.4.2, telas 8–9) -------
  /** The tapped free point (tela 8) — ephemeral UI, never in the reducer. */
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  /** The tapped committed stop (RF-006.4.2) — ephemeral UI too. */
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  /** The firmed stop shown UNGROUPED on the map (RF-006.4.8): double-tap the
      square or "Ver lista completa" sets it; regrouping clears it. */
  const [expandedRoteiroStopId, setExpandedRoteiroStopId] = useState<string | null>(null);
  /** The selected member of the expanded stop (RF-006.4.16) — tapping a member
      picks it; null = the anchor (1st). Cleared with the expansion. */
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  /** "Paradas reordenadas" toast when a vehicle move re-sweeps the order (RF-006.17). */
  const [reorderNotice, showReorderNotice] = useTransientMessage();
  /** Zoom the edit (draft) opens at (RF-006.18 smoke): captured from the stop's
      view on "Editar parada", so entering the edit doesn't jump the zoom. */
  const [draftEntryMaxZoom, setDraftEntryMaxZoom] = useState<number>(FOCUS_MAX_ZOOM);
  /** The START selected by tapping its map marker (RF-006.11): the panel shows
      "parada 0" + the redefine action. Cleared by any other selection. */
  const [startSelected, setStartSelected] = useState(false);
  /** The grouping radius of the "Parada sugerida" preview — adjustable BEFORE
      creating (RF-006.4.6). Ephemeral; resets to the default per selected orphan. */
  const [previewRadiusMeters, setPreviewRadiusMeters] = useState(builderState.config.autoRadiusMeters);
  /** The address awaiting "Partir deste endereço" (RF-21). Lives up here with the
      other selections because it IS one — it feeds the markers and the focus. */
  const [pendingPointId, setPendingPointId] = useState<string | null>(null);
  /** The free point tapped DURING the edit draft (RF-006.4.23) — tapping only
      selects; the panel's "Adicionar a esta parada" is what edits (Q2 of .4.9
      preserved). Kept after adding on purpose: clearing would drop the focus
      to null and refit the whole route mid-draft (the old RF-006.4 zoom bug). */
  const [draftSelectedPointId, setDraftSelectedPointId] = useState<string | null>(null);

  /**
   * The address the user is looking at: awaiting start confirmation, or a freely
   * selected orphan. Both wear the SAME chrome (solid ring + glow + raise) and
   * get the same max-zoom focus — one selected address, one visual language
   * (RF-006.4.21). Without this the point awaiting confirmation was drawn as any
   * other free point, indistinguishable among its neighbours.
   */
  const selectedAddressId = pendingPointId ?? selectedPointId;
  const draft = builderState.draft;
  const farIds = farChosenPointIds(builderState);
  const selectedPoint = selectedPointId !== null ? (pointsById.get(selectedPointId) ?? null) : null;
  const draftSelectedPoint = draft && draftSelectedPointId !== null ? (pointsById.get(draftSelectedPointId) ?? null) : null;
  /** Already a member? The "add" section hides itself (it happens right after
      "Adicionar", which keeps the selection for focus stability). */
  const draftSelectedIsMember = draftSelectedPoint !== null && (draft?.pointIds.includes(draftSelectedPoint.id) ?? false);
  /** Defensive: a dissolved/reopened stop drops the selection to the next context. */
  const selectedStop = selectedStopId !== null ? (builderState.stops.find((s) => s.id === selectedStopId) ?? null) : null;
  /** The selected member, guarded to the selected stop (RF-006.4.16 — a stale id
      from another stop is ignored; null falls back to the anchor). */
  const effectiveSelectedMemberId = selectedStop && selectedMemberId !== null && selectedStop.pointIds.includes(selectedMemberId) ? selectedMemberId : null;

  /** Radius PREVIEW (U6): selecting an orphan already shows the circle and its
      candidates BEFORE creating — pure derivation, the reducer stays untouched. */
  const previewCandidateIds = useMemo(() => {
    if (draft || !selectedPoint) return [];
    const assigned = assignedPointIds(builderState.stops);
    return pointsWithinRadius(selectedPoint, points, previewRadiusMeters)
      .filter((p) => p.id !== selectedPoint.id && !assigned.has(p.id))
      .map((p) => p.id);
  }, [draft, selectedPoint, points, builderState.stops, previewRadiusMeters]);

  const candidateIds = draft ? draftCandidateIds(builderState) : previewCandidateIds;

  const roteiroModels = useMemo(
    () =>
      computeRoteiroMarkerModels(points, builderState.stops, {
        draft,
        candidateIds,
        selectedPointId: selectedAddressId,
        selectedStopId,
        expandedStopId: expandedRoteiroStopId,
        selectedMemberId: effectiveSelectedMemberId,
        draftSelectedPointId,
      }),
    // candidateIds is derived fresh each render; its CONTENT tracks draft/points.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [points, builderState.stops, draft, selectedAddressId, selectedStopId, expandedRoteiroStopId, effectiveSelectedMemberId, draftSelectedPointId, candidateIds.join("|")]
  );

  // Road graph — lazy on the roteiro enter (ADR-009 decision B); everything
  // below works with graph === null (straight-line fallbacks).
  const { graph, status: graphLoadStatus, error: graphError, retry: retryGraph } = useRoadGraph(points, mode === "roteiro");
  const pedGraph = useMemo(() => (graph ? pedestrianGraph(graph) : null), [graph]);

  // ------- Start-definition flow (RF-21) — ephemeral UI state, never in the reducer -------
  // (`pendingPointId` lives with the other selections above — it drives markers/focus.)
  const [armedMapTap, setArmedMapTap] = useState(false);
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

  /** Armed map tap → the tapped coordinate becomes the start (decision 08/07);
      otherwise an empty-map tap deselects EVERYTHING: the whole route frames
      and the panel shows the idle state (header + suggested-stop card).
      ⚠️ Supersedes the .4.10/.4.16 "regroup keeping the focus" (decision 12/07,
      RF-006.11: "mapa vazio → cabeçalho + card da sugestão"). */
  const handleMapTap = (latlng: LatLng) => {
    if (armedMapTap) {
      defineStart(latlng);
      return;
    }
    setExpandedRoteiroStopId(null);
    setSelectedMemberId(null);
    setSelectedPointId(null);
    setSelectedStopId(null);
    setStartSelected(false);
    setPanelView("selected");
  };

  /** Tap on the START marker (RF-006.11): selects it — the panel shows "parada
      0" with the redefine action; the focus closes on the start point. */
  const handleStartTap = () => {
    setStartSelected(true);
    setSelectedPointId(null);
    setSelectedStopId(null);
    setExpandedRoteiroStopId(null);
    setSelectedMemberId(null);
    setCardExpanded(false);
    setPanelView("selected");
  };

  /** "Apagar início" (RF-006.14): drops the start entirely — its car marker
      disappears and the panel returns to the definition flow (GPS / map tap).
      This is what the old single "Redefinir" implied but never did (it kept the
      car and only re-armed, reading as a bug — smoke 15/07). */
  const handleDeleteStart = () => {
    dispatch({ type: "CLEAR_START" });
    setStartSelected(false);
    resetStartUi();
    setPanelView("selected");
    setPanelSnap("collapsed");
  };
  /** "Mudar posição do início" (RF-006.14): the SAME event as "Tocar no mapa" —
      arms the tap directly; the current start (and its marker) stays until a
      new tap lands. `redefining` also lets a tapped delivery point become the
      new start ("partir deste endereço"), exactly like the fresh flow. */
  const handleRepositionStart = () => {
    setStartSelected(false);
    setRedefining(true);
    setArmedMapTap(true);
    setPendingPointId(null);
    setStartNotice(null);
    setPanelView("selected");
    setPanelSnap("collapsed");
  };

  /** Double-tap a firmed stop → ungroup it on the MAP ONLY, focused (RF-006.4.11):
      the panel STAYS on the summary (the full list would hide the map — they are
      distinct events). Regroup by tapping the empty map. */
  const handleExpandRoteiroStop = (stopId: string) => {
    setSelectedStopId(stopId);
    setSelectedPointId(null);
    setExpandedRoteiroStopId(stopId);
    setSelectedMemberId(null); // a fresh expand starts on the anchor (RF-006.4.16)
    setStartSelected(false);
  };
  const handleModelExpand = (model: MarkerModel) => {
    if (model.kind !== "stop" || draft) return; // only firmed squares expand
    handleExpandRoteiroStop(model.key);
  };

  /** "Ver lista completa" (roteiro): open the panel's full list — a DISTINCT
      event from the map ungroup; the list hides the map (RF-006.4.11). */
  const handleShowRoteiroList = () => {
    setPanelView("list");
    setPanelSnap("full");
    setScrollSignal((count) => count + 1);
  };
  /** "Esconder lista" (roteiro): back to the summary and REGROUP the map. Lands
      on the collapsed-fit snap (RF-006.4.15) — it shows the whole summary, no
      cut and no empty gap. */
  const handleHideRoteiroList = () => {
    setExpandedRoteiroStopId(null);
    setPanelView("selected");
    setPanelSnap("collapsed");
  };

  /** "Ver detalhes" (RF-006.8): opens the overview body from ANY roteiro
      context — the mirror of "Ver lista completa" (full snap, scroll to top). */
  const handleShowOverview = () => {
    setPanelView("overview");
    setPanelSnap("full");
    setScrollSignal((count) => count + 1);
  };
  /** "Esconder detalhes": back to the context's own body at the collapsed fit. */
  const handleHideOverview = () => {
    setPanelView("selected");
    setPanelSnap("collapsed");
  };

  /** Overview "Ver no mapa" (RF-006.8): select the stop and drop the panel back
      to the summary at the collapsed fit — the user asked to SEE the map. */
  const handleShowRoteiroStopOnMap = (stopId: string) => {
    setSelectedStopId(stopId);
    setSelectedPointId(null);
    setExpandedRoteiroStopId(null);
    setSelectedMemberId(null);
    setStartSelected(false);
    setCardExpanded(false);
    setPanelView("selected");
    setPanelSnap("collapsed");
  };

  /** Suggestion card's map icon (RF-006.11): selects the SEED on the map — the
      tela 8 preview (radius, incorporation) opens exactly as a manual tap would. */
  const handleShowSuggestedOnMap = () => {
    if (!overviewSuggestion) return;
    setSelectedPointId(overviewSuggestion.seed.id);
    setSelectedStopId(null);
    setExpandedRoteiroStopId(null);
    setSelectedMemberId(null);
    setStartSelected(false);
    setPreviewRadiusMeters(builderState.config.autoRadiusMeters);
    setCardExpanded(false);
    setPanelView("selected");
    setPanelSnap("collapsed");
  };

  /** Tap on a marker, by context (RF-006.4): during a draft it toggles the
      point in/out (spec §4 p.4 — map taps choose candidates); without a start
      (or redefining) it asks for confirmation ("partir deste endereço"); with a
      start it SELECTS the orphan (tela 8) and re-points the suggestion (§6 —
      "comparar destinos é só tocar"). Committed-stop squares are inert until
      the edit slice (.6). */
  const handleModelTap = (model: MarkerModel) => {
    if (model.kind === "stop") {
      // Committed stop tapped (RF-006.4.2): single tap FOCUSES it, grouped —
      // regrouping any other expanded stop (double-tap expands, RF-006.4.8).
      // During an edit the map is inert to taps (membership = radius + list, RF-006.4.9).
      if (draft) return;
      setSelectedStopId(model.key);
      setSelectedPointId(null);
      setExpandedRoteiroStopId(null);
      setSelectedMemberId(null); // a focused (grouped) stop shows the anchor (RF-006.4.16)
      setStartSelected(false);
      setCardExpanded(false);
      setPanelView("selected"); // a fresh stop opens on its summary, not the list
      // No auto-raise: the collapsed snap now FITS the summary (RF-006.4.12).
      return;
    }
    // An address of the EXPANDED stop is a MEMBER: tapping it SELECTS it (RF-006.4.16)
    // — highlighted on the map, shown in the panel — never re-points/toggles.
    const expandedStop = expandedRoteiroStopId !== null ? builderState.stops.find((s) => s.id === expandedRoteiroStopId) : null;
    if (expandedStop && expandedStop.pointIds.includes(model.key)) {
      setSelectedMemberId(model.key);
      setStartSelected(false);
      setCardExpanded(false);
      return;
    }
    // During an EDIT the map never toggles membership (Q2 09/07 — RF-006.4.9).
    // But tapping a FREE point now SELECTS it (RF-006.4.23): the panel offers
    // "Adicionar a esta parada" — the tap looks, the button edits. Members of
    // the draft stay inert (removal is the list's −). ⚠️ This early return also
    // shields the creation branch below (SET_NEXT_SUGGESTION must never fire
    // while drafting).
    if (draft) {
      // Tap SELECTS the point (RF-006.19): a FREE one to "Adicionar a esta
      // parada", a MEMBER to see it + "Tornar âncora"/"Remover". Membership is
      // still never TOGGLED by the tap (RF-006.4.9) — the tap looks, the buttons
      // edit; members used to be inert here, which read as "the map is dead".
      setDraftSelectedPointId(model.key);
      return;
    }
    if (!hasStart || redefining) {
      setPendingPointId(model.key);
      setArmedMapTap(false);
      setStartNotice(null);
      return;
    }
    setSelectedPointId(model.key);
    setSelectedStopId(null);
    setExpandedRoteiroStopId(null);
    setStartSelected(false);
    setPreviewRadiusMeters(builderState.config.autoRadiusMeters); // each orphan starts at the default radius
    setCardExpanded(false);
    setPanelView("selected"); // a map tap means "looking at the map" — leave the overview (RF-006.8)
    // No auto-raise: the collapsed snap now FITS the summary (RF-006.4.12).
    dispatch({ type: "SET_NEXT_SUGGESTION", pointId: model.key });
  };

  /** "Criar parada" now COMMITS on the spot (RF-006.4.6): the seed + the preview
      radius members become a firmed stop directly (no draft), and the panel
      focuses that grouped stop. Radius was tuned in the preview; further edits
      go through "Editar parada" (REOPEN). Reverses §8 (candidates by choice). */
  const handleCreateStop = () => {
    if (!selectedPoint || !suggestedAnchor) return;
    const stopId = `stop_${selectedPoint.id}`;
    dispatch({
      type: "CREATE_STOP",
      seedPointId: selectedPoint.id,
      memberIds: previewCandidateIds,
      // The DEFAULT anchor (RF-006.6) — exactly what the preview showed.
      vehicleStop: suggestedAnchor,
      radiusMeters: previewRadiusMeters,
    });
    setSelectedPointId(null);
    setSelectedStopId(stopId); // focus the freshly firmed, grouped stop
    setExpandedRoteiroStopId(null);
    setStartSelected(false);
    setCardExpanded(false);
    setPanelView("selected");
    // No auto-raise: the collapsed snap now FITS the summary (RF-006.4.12).
  };

  /** Committed-stop actions (RF-006.4.2 — fluxo §9; REOPEN/DISSOLVE were ready). */
  const handleEditStop = () => {
    if (!selectedStop) return;
    // Open the edit at the SAME zoom the stop was showing (RF-006.18 smoke): a
    // tapped address / ungrouped stop is close, a grouped one wider — otherwise
    // the draft always refit to FOCUS_MAX and jumped the zoom on entry.
    setDraftEntryMaxZoom(effectiveSelectedMemberId ? ADDRESS_MAX_ZOOM : expandedRoteiroStopId === selectedStop.id ? MAP_CONFIG.ZOOM.MAX : FOCUS_MAX_ZOOM);
    dispatch({ type: "REOPEN_STOP", stopId: selectedStop.id });
    setSelectedStopId(null);
    setExpandedRoteiroStopId(null);
    setDraftSelectedPointId(null); // a fresh edit starts with nothing picked (RF-006.4.23)
    setCardExpanded(false);
    setPanelView("selected");
  };
  const handleDissolveStop = () => {
    if (!selectedStop) return;
    dispatch({ type: "DISSOLVE_STOP", stopId: selectedStop.id });
    setSelectedStopId(null);
    setExpandedRoteiroStopId(null);
    setCardExpanded(false);
    setPanelView("selected");
  };

  /** Tela 8: join an existing stop (fluxo §9; ADD re-sweeps that stop's order). */
  const handleIncorporate = (stopId: string) => {
    if (!selectedPoint) return;
    dispatch({ type: "ADD_POINT_TO_STOP", stopId, pointId: selectedPoint.id });
    setSelectedPointId(null);
  };

  /** Leaving the edit SELECTS the stop back (RF-006.4.24): the panel returns to
      its summary and the focus stays on its frame — dropping to "nothing
      selected" would refit the whole route, a zoom jump on the way out. Same
      continuity handleCreateStop already gives a freshly firmed stop. */
  const handleSaveStop = () => {
    const stopId = draft?.stopId ?? null;
    dispatch({ type: "COMMIT_STOP" });
    setDraftSelectedPointId(null); // the draft is gone; so is its pick (RF-006.4.23)
    if (stopId !== null) setSelectedStopId(stopId);
  };
  const handleCancelDraft = () => {
    const stopId = draft?.stopId ?? null;
    dispatch({ type: "CANCEL_DRAFT" });
    setDraftSelectedPointId(null);
    if (stopId !== null) setSelectedStopId(stopId);
  };
  /** "Adicionar a esta parada" (RF-006.4.23): the ONLY map-originated way into a
      draft — same TOGGLE the list's ± uses (re-sweeps the walk order, anchor
      intact; RN-17 warns by itself if far). The selection is kept: the point is
      now a member, the section hides, and the focus stays put (no mid-draft
      refit to the whole route). */
  const handleAddSelectedToDraft = () => {
    if (!draftSelectedPoint || draftSelectedIsMember) return;
    dispatch({ type: "TOGGLE_DRAFT_POINT", pointId: draftSelectedPoint.id });
  };

  /**
   * ADR-009 decision C: while the draft's anchor is still the DEFAULT one, keep
   * it ON the default — re-projected as soon as the graph arrives (a stop
   * created offline holds a raw coordinate until then), and re-seeded when the
   * membership changes (the default IS "the member nearest to where the vehicle
   * comes from", so it moves with the members — RF-006.6). A user-moved anchor
   * is never touched (`vehicleStopIsDefault` false), and the equality guard
   * keeps this from dispatching when the anchor already sits where it belongs.
   *
   * ⚠️ No longer inert (RF-006.6): REOPEN_STOP now CARRIES the stop's flag
   * instead of forcing `false`, so reopening a default-anchored stop lands here.
   */
  const draftAnchorIsDefault = draft?.vehicleStopIsDefault ?? false;
  const draftPointsSignature = draft?.pointIds.join("|") ?? "";
  useEffect(() => {
    if (!graph || !draftAnchorIsDefault || !draft) return;
    const members = draft.pointIds.map((id) => pointsById.get(id)).filter((p): p is DeliveryPoint => p !== undefined);
    const seed = defaultAnchorSeed(members, previousAnchorOrigin(builderState, draft.stopId));
    if (!seed) return;
    const projected = suggestVehicleStop(graph, seed);
    if (projected.lat === draft.vehicleStop.lat && projected.lng === draft.vehicleStop.lng) return;
    dispatch({ type: "RESET_VEHICLE_STOP", suggestedVehicleStop: projected });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fires on graph arrival / membership change; the default flag + the equality guard above stop it from looping
  }, [graph, draftAnchorIsDefault, draftPointsSignature, pointsById, dispatch]);

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
  /** The suggested next stop's seed — ranked over the DIRECTED graph so it
      respects one-way (RF-006.12); straight-line without a graph. Memoized: the
      rank runs an A* over the top-N candidates. Shared with the overview seed. */
  const suggestedId = useMemo(() => suggestedNextSeed(builderState, graph), [builderState, graph]);
  const suggestedPoint = suggestedId !== null ? (pointsById.get(suggestedId) ?? null) : null;
  // The suggestion PATH (dashed map line) follows the VEHICLE graph (directed,
  // respects one-way — RF-006.7/.12), matching the ranked target; its text label
  // left the panel with RF-006.11 (the SuggestedStopCard carries that now).
  const suggestion = useMemo(() => (origin && suggestedPoint ? suggestionPath(graph, origin, { lat: suggestedPoint.lat, lng: suggestedPoint.lng }) : null), [graph, origin, suggestedPoint]);

  /** The draft's SEED — the tapped address the radius circle is centered on. */
  const draftSeed = draft ? (pointsById.get(draft.seedPointId) ?? null) : null;
  /** The firmed stop shown UNGROUPED on the map (double-tapped): its car shows
      too (RF-006.16 — where the vehicle parks), but it doesn't drag. */
  const expandedStop = expandedRoteiroStopId !== null ? (builderState.stops.find((s) => s.id === expandedRoteiroStopId) ?? null) : null;

  // ------- Route traces (RF-006.7) -------
  /** Vehicle route: start → each anchor over the DIRECTED graph (respects one-
      way; straight fallback without a graph). Drawn whenever a stop is firmed;
      its distance is reused for the overview's real vehicle km. */
  const vehicleRoute = useMemo(() => {
    const anchors = builderState.stops.map((s) => s.vehicleStop);
    return anchors.length > 0 ? vehicleRoutePath(graph, builderState.startPoint, anchors) : null;
  }, [graph, builderState.startPoint, builderState.stops]);
  /** Foot circuit (dashed loop) of the stop in FOCUS: the DRAFT while building/
      editing (follows the chosen points live), else the selected/expanded firmed
      stop — over the PEDESTRIAN graph (ignores one-way). */
  const footCircuit = useMemo(() => {
    if (draft) {
      const ordered = draft.pointIds.map((id) => pointsById.get(id)).filter((p): p is DeliveryPoint => p !== undefined);
      return ordered.length > 0 ? footCircuitPath(pedGraph, draft.vehicleStop, ordered) : null;
    }
    const stop = selectedStop ?? expandedStop;
    if (!stop) return null;
    const ordered = orderedStopPoints(stop, pointsById);
    return ordered.length > 0 ? footCircuitPath(pedGraph, stop.vehicleStop, ordered) : null;
  }, [draft, selectedStop, expandedStop, pedGraph, pointsById]);

  const roteiroOverlay = useMemo(
    () => ({
      start: builderState.startPoint,
      suggestionPath: suggestion?.path ?? null,
      // Route traces (RF-006.7): vehicle backbone + the focused stop's foot loop;
      // the suggestion is faded while a draft is open, stronger once firmed (§6).
      vehicleRoute: vehicleRoute?.path ?? null,
      footCircuit: footCircuit?.path ?? null,
      suggestionFaded: draft !== null,
      // The radius circle also PREVIEWS on the selected orphan, before creating (U6).
      radiusCircle:
        draft && draftSeed
          ? { center: { lat: draftSeed.lat, lng: draftSeed.lng }, meters: draft.radiusMeters }
          : selectedPoint
            ? { center: { lat: selectedPoint.lat, lng: selectedPoint.lng }, meters: previewRadiusMeters }
            : null,
      // The car shows for the draft OR an expanded firmed stop (RF-006.16); it
      // only DRAGS in the draft (editing is the only place the anchor moves).
      anchor: draft?.vehicleStop ?? expandedStop?.vehicleStop ?? null,
      anchorDraggable: draft !== null,
    }),
    [builderState.startPoint, previewRadiusMeters, suggestion, draft, draftSeed, selectedPoint, expandedStop, vehicleRoute, footCircuit]
  );

  /** Anchor drag (RF-006.5): street-project the dropped point (map matching
      lives OUTSIDE the reducer — nearestEdge via suggestVehicleStop; raw point
      without a graph) and move the DRAFT's anchor. Anchor editing lives only in
      the draft now (RF-006.15) — a firmed stop's car isn't draggable. */
  const handleAnchorDragEnd = (latlng: LatLng) => {
    if (!draft) return;
    const position = suggestVehicleStop(graph, latlng);
    // Moving the vehicle RE-SWEEPS (nearest-first — RF-006.17); if the order
    // actually changed, flag it so the user isn't surprised. Projected here with
    // the SAME function the reducer uses, so the notice matches the outcome.
    const members = draft.pointIds.map((id) => pointsById.get(id)).filter((p): p is DeliveryPoint => p !== undefined);
    const reordered = nearestFirstOrder(position, members, draft.reversed);
    dispatch({ type: "MOVE_VEHICLE_STOP", position });
    if (draft.pointIds.length === reordered.length && draft.pointIds.some((id, i) => id !== reordered[i])) {
      showReorderNotice(UI_LABELS.MAP_PANEL.REORDERED_NOTICE);
    }
  };
  /** The distinct vehicle car is selectable when ungrouped (RF-006.17): tapping
      it drops the member selection, so the panel returns to the vehicle stop. */
  const handleAnchorTap = () => setSelectedMemberId(null);

  // ------- Anchor/sense gestures INSIDE the edit (draft — RF-006.6) -------
  /** Same DEFAULT rule as the firmed stop's reset, over the draft's members. */
  const handleResetDraftAnchor = () => {
    if (!draft) return;
    const members = draft.pointIds.map((id) => pointsById.get(id)).filter((p): p is DeliveryPoint => p !== undefined);
    const seed = defaultAnchorSeed(members, previousAnchorOrigin(builderState, draft.stopId));
    if (!seed) return;
    dispatch({ type: "RESET_VEHICLE_STOP", suggestedVehicleStop: suggestVehicleStop(graph, seed) });
  };
  const handleReverseDraftOrder = () => dispatch({ type: "REVERSE_DRAFT_ORDER" });
  const handleMakeDraftAnchor = (pointId: string) => dispatch({ type: "MAKE_POINT_ANCHOR", pointId });

  // ------- Roteiro panel context (RF-006.4/.4.2) -------
  const roteiroContext: "drafting" | "stop-selected" | "point-selected" | "start-flow" = draft
    ? "drafting"
    : selectedStop
      ? "stop-selected"
      : selectedPoint && hasStart && !redefining
        ? "point-selected"
        : "start-flow";

  /** Tela 8 targets: every committed stop, nearest first pre-selected; `far` = RN-17 hint. */
  const stopOptions: StopOption[] = selectedPoint
    ? builderState.stops.map((stop) => ({
        id: stop.id,
        label: UI_LABELS.MAP_PANEL.ROTEIRO_POINT.STOP_OPTION(stop.order, stop.pointIds.length),
        far: haversine(selectedPoint, stop.vehicleStop) > Math.max(FAR_POINT_RADIUS_FACTOR * stop.radiusMeters, FAR_POINT_MIN_METERS),
      }))
    : [];
  const defaultStopId = selectedPoint ? (nearestStopTo(selectedPoint, builderState.stops)?.id ?? null) : null;

  /** Draft body/header data (tela 9). The lists render through the Original's
      full-list structure (RF-006.4.3), so points are adapted to StopItemData —
      members with their walking ordinal, candidates plain. */
  const chosenPoints = draft ? draft.pointIds.map((id) => pointsById.get(id)).filter((p): p is NonNullable<typeof p> => p !== undefined) : [];
  const candidatePoints = candidateIds.map((id) => pointsById.get(id)).filter((p): p is NonNullable<typeof p> => p !== undefined);
  /** Walking legs between the draft's ordered members (RF-006.10). */
  const chosenLegs = stopLegs(chosenPoints, pedGraph);
  const chosenItems = chosenPoints.map((point, index) => pointToStopItemData(point, { ordinal: index + 1, leg: chosenLegs[index] }));
  const candidateItems = candidatePoints.map((point) => pointToStopItemData(point));
  /** The draft's ANCHOR row (RF-006.6) — the circuit's start AND end. Address is
      a PLACEHOLDER (the first stop address) until the vehicle-stop geocoding
      lands (RF-006.9), the same convention the firmed stop's row uses. */
  const draftAnchorItem = chosenPoints[0] ? { ...pointToStopItemData(chosenPoints[0]), complement: UI_LABELS.ROUTE_MAP.ADDRESS_SHEET.NO_COMPLEMENT } : null;
  const draftPackages = chosenPoints.reduce((sum, p) => sum + p.packageCount, 0);
  /** "~min · m a pé" of the draft's walking circuit (coarse — RF-007 refines). */
  const draftEstimate = draft && chosenPoints.length > 0 ? stopWalkEstimate(draft.vehicleStop, chosenPoints, builderState.config) : null;
  const draftMetrics: PanelMetric[] = [
    { label: UI_LABELS.MAP_PANEL.METRIC_ADDRESSES(chosenPoints.length) },
    { label: UI_LABELS.MAP_PANEL.METRIC_PACKAGES(draftPackages) },
    ...(draftEstimate ? [{ label: walkEstimateLabel(draftEstimate) }] : []),
  ];

  /** Tela 8: the point through the Original panel's vocabulary (one visual language). */
  const selectedPointItem = selectedPoint ? pointToStopItemData(selectedPoint) : null;

  /** Selected committed stop (RF-006.4.2): Original-structure summary data —
      typed package chips, exactly like the Original (RF-006.4.3), plus the
      walking-estimate chip. */
  const stopPoints = selectedStop ? orderedStopPoints(selectedStop, pointsById) : [];

  /** The member of an expanded stop the user tapped (RF-006.4.16) — an ADDRESS,
      even though a stop is selected around it. */
  const selectedMemberPoint = effectiveSelectedMemberId !== null ? (pointsById.get(effectiveSelectedMemberId) ?? null) : null;

  /**
   * What the roteiro map frames, and how close (RF-006.4.20/.4.21).
   *
   * Precedence by what is SELECTED, not by which state holds it: a single
   * ADDRESS always wins — the one awaiting start confirmation, a free one, or a
   * member of an expanded stop. A stop only frames when no address is chosen.
   *
   * ⚠️ `maxZoom` is a CEILING, not a target: `fitBounds` picks the zoom that
   * makes the bounds fit and then clamps it. A single point has zero-sized
   * bounds, so it always lands on the ceiling (`ADDRESS_MAX_ZOOM` — one level
   * below the max: the full max was too tight on a phone, smoke 10/07). Several
   * addresses fit at whatever their spread allows — raising the ceiling for an
   * expanded stop lets it go as close as its members permit, no closer.
   */
  /**
   * The frame of the stop being EDITED, frozen at entry (RF-006.4.24). Entering
   * the edit used to drop the focus to null → whole-route refit ("zoom fica
   * distante"). This keeps the stop framed at the SAME zoom as selecting it —
   * and since REOPEN copies the stop's pointIds, the coords (and therefore the
   * focus signature) are identical, so entering the edit doesn't even refit.
   * FROZEN on purpose: re-deriving from the live membership would refit on
   * every ± toggle (the old mid-draft zoom-jump bug, RF-006.4).
   */
  const draftFrame = useMemo(
    () => (draft ? draft.pointIds.map((id) => pointsById.get(id)).filter((p): p is DeliveryPoint => p !== undefined) : null),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- frozen per draft (keyed by stopId), never by membership
    [draft?.stopId, pointsById]
  );

  // The draft-time pick joins the chain (RF-006.4.23): kept after "Adicionar",
  // so the focus never drops to null (→ whole-route refit) mid-draft. The
  // selected START (RF-006.11) is one more single-point selection up front.
  const focusAddress = (startSelected ? builderState.startPoint : null) ?? pendingPoint ?? selectedPoint ?? selectedMemberPoint ?? draftSelectedPoint;
  const roteiroFocus: { bounds: LatLng[]; maxZoom: number } | null = focusAddress
    ? { bounds: [{ lat: focusAddress.lat, lng: focusAddress.lng }], maxZoom: ADDRESS_MAX_ZOOM }
    : draft && draftFrame && draftFrame.length > 0
      ? { bounds: draftFrame.map((p) => ({ lat: p.lat, lng: p.lng })), maxZoom: draftEntryMaxZoom }
      : selectedStop && stopPoints.length > 0
        ? { bounds: stopPoints.map((p) => ({ lat: p.lat, lng: p.lng })), maxZoom: expandedRoteiroStopId === selectedStop.id ? MAP_CONFIG.ZOOM.MAX : FOCUS_MAX_ZOOM }
        : null;

  const stopEstimate = selectedStop && stopPoints.length > 0 ? stopWalkEstimate(selectedStop.vehicleStop, stopPoints, builderState.config) : null;
  const stopPlace = stopPlaceSummaryFromPoints(stopPoints);
  const stopMetrics: PanelMetric[] = [
    { label: UI_LABELS.MAP_PANEL.METRIC_ADDRESSES(stopPoints.length) },
    ...typedPackageChips(packagesByTypeFromPoints(stopPoints)),
    ...(stopEstimate ? [{ label: walkEstimateLabel(stopEstimate) }] : []),
  ];
  /** The VEHICLE STOP is an INDEPENDENT entity per stop (RF-006.18): its own
      clickable map marker + its own panel row, whether or not it coincides with
      a delivery. The delivery it PARKS BY is the 1st (nearest to it — nearest-
      first order), which carries the "Parada do veículo" badge. Address
      placeholder = the 1st until geocoding (RF-006.9). */
  const vehicleDeliveryPoint = stopPoints[0] ?? null;
  const stopAnchorItem = vehicleDeliveryPoint ? { ...pointToStopItemData(vehicleDeliveryPoint), complement: UI_LABELS.ROUTE_MAP.ADDRESS_SHEET.NO_COMPLEMENT } : null;
  /** The stop's full address list ("Ver parada" — RF-006.4.7), ordinals in visit
      order, each with its walking leg from the previous (RF-006.10). */
  const stopListLegs = stopLegs(stopPoints, pedGraph);
  const stopListItems = stopPoints.map((point, index) => pointToStopItemData(point, { ordinal: index + 1, leg: stopListLegs[index] }));
  /** "Endereço selecionado" of a firmed stop (RF-006.18): with nothing tapped,
      the VEHICLE STOP row (independent, with the quick "Editar local"); tapping
      the 1st delivery shows it as the one the vehicle parks by (badge + packages);
      any other tapped member is a plain address. */
  const selectedMemberIndex = effectiveSelectedMemberId ? stopPoints.findIndex((p) => p.id === effectiveSelectedMemberId) : -1;
  const stopSelectedKind: "member" | "coincident" | "vehicle" = selectedMemberIndex < 0 ? "vehicle" : selectedMemberIndex === 0 ? "coincident" : "member";
  const stopSelectedItem = selectedMemberIndex >= 0 ? pointToStopItemData(stopPoints[selectedMemberIndex], { ordinal: selectedMemberIndex + 1 }) : stopAnchorItem;

  // ------- Suggested-stop preview (3ª seção do painel — RF-006.4.3/.4.4) -------
  /** How the stop WOULD look if created now: the summary aggregates the seed
      AND the radius candidates (what the circle shows — rev. 08/07 .4.4), in
      the default walking sweep around the suggested anchor (the reducer's own
      rule). Creating still seeds only the selected point — candidates enter by
      choice (§8, decision 26/06). */
  const suggestedOrder = builderState.stops.length + 1;
  /** The would-be members: the tapped seed + whatever the radius circle shows. */
  const previewMembers = useMemo(
    () => (selectedPoint ? [selectedPoint, ...previewCandidateIds.map((id) => pointsById.get(id)).filter((p): p is DeliveryPoint => p !== undefined)] : []),
    [selectedPoint, previewCandidateIds, pointsById]
  );
  /** The anchor this stop would be BORN with (RF-006.6): the member nearest to
      where the vehicle comes from — NOT the tapped address. The preview must
      show the same anchor `handleCreateStop` commits, or it would lie. */
  const suggestedAnchor = useMemo(() => {
    const seed = defaultAnchorSeed(previewMembers, previousAnchorOrigin(builderState, null));
    return seed ? suggestVehicleStop(graph, seed) : null;
  }, [graph, previewMembers, builderState]);
  const suggestedPoints = useMemo(() => {
    if (!suggestedAnchor || previewMembers.length === 0) return [];
    const byId = indexPointsById(previewMembers);
    return nearestFirstOrder(suggestedAnchor, previewMembers, false)
      .map((id) => byId.get(id))
      .filter((p): p is DeliveryPoint => p !== undefined);
  }, [suggestedAnchor, previewMembers]);
  const suggestedEstimate = suggestedAnchor && suggestedPoints.length > 0 ? stopWalkEstimate(suggestedAnchor, suggestedPoints, builderState.config) : null;
  const suggestedPlace = stopPlaceSummaryFromPoints(suggestedPoints);
  const suggestedMetrics: PanelMetric[] = selectedPoint
    ? [
        { label: UI_LABELS.MAP_PANEL.METRIC_ADDRESSES(suggestedPoints.length) },
        ...typedPackageChips(packagesByTypeFromPoints(suggestedPoints)),
        ...(suggestedEstimate ? [{ label: walkEstimateLabel(suggestedEstimate) }] : []),
      ]
    : [];
  /** VEHICLE leg: last committed stop (or the start) → the suggested anchor.
      The raw graph is directed, so one-way streets are respected; without it
      the straight-line fallback is labeled "(linha reta)". Shown beside the
      section label with the car icon as the qualifier (rev. 08/07 4ª rodada). */
  const lastStop = builderState.stops.length > 0 ? builderState.stops[builderState.stops.length - 1] : null;
  const vehicleOrigin = lastStop?.vehicleStop ?? builderState.startPoint;
  const vehicleLeg = useMemo(() => (vehicleOrigin && suggestedAnchor ? suggestionPath(graph, vehicleOrigin, suggestedAnchor) : null), [graph, vehicleOrigin, suggestedAnchor]);
  const vehicleDistanceLabel = vehicleLeg
    ? `${UI_LABELS.MAP_PANEL.ROTEIRO_POINT.DISTANCE_TO_HERE(formatMeters(vehicleLeg.distanceMeters))}${vehicleLeg.viaStreets ? "" : ` ${UI_LABELS.MAP_PANEL.ROTEIRO_START.SUGGESTION_STRAIGHT}`}`
    : null;

  // ------- Overview data (TASK-RF-006.8): the roteiro's study panel -------
  /** Committed stops through the panel's own vocabulary — PanelTitle + typed
      chips + walking estimate, with the address drill-down in visit order. */
  const overviewStops: OverviewStopView[] = useMemo(
    () =>
      builderState.stops.map((stop) => {
        const stopPts = orderedStopPoints(stop, pointsById);
        const estimate = stopPts.length > 0 ? stopWalkEstimate(stop.vehicleStop, stopPts, builderState.config) : null;
        const legs = stopLegs(stopPts, pedGraph);
        const place = stopPlaceSummaryFromPoints(stopPts);
        return {
          id: stop.id,
          order: stop.order,
          neighborhoods: place.neighborhoods,
          zipcodes: place.zipcodes,
          metrics: [
            { label: UI_LABELS.MAP_PANEL.METRIC_ADDRESSES(stopPts.length) },
            ...typedPackageChips(packagesByTypeFromPoints(stopPts)),
            ...(estimate ? [{ label: walkEstimateLabel(estimate) }] : []),
          ],
          items: stopPts.map((point, index) => pointToStopItemData(point, { ordinal: index + 1, leg: legs[index] })),
          /** The vehicle parks by the 1st (nearest-first) — its "Parada do
              veículo" badge in the drill-down, like the firmed-stop view (RF-006.18). */
          vehicleStopKey: stopPts[0]?.id ?? null,
        };
      }),
    [builderState.stops, builderState.config, pointsById, pedGraph]
  );

  /** The would-be NEXT stop (RF-006.8 — numbered in sequence, stops.length + 1):
      the reducer's suggested seed + default-radius candidates, the same preview
      shape tela 8 shows for a tapped orphan. Null before a start / when done. */
  const overviewSuggestion = useMemo(() => (mode === "roteiro" ? nextStopSuggestion(builderState, graph, suggestedId) : null), [mode, builderState, graph, suggestedId]);
  const overviewVehicleLeg = useMemo(() => (vehicleOrigin && overviewSuggestion ? suggestionPath(graph, vehicleOrigin, overviewSuggestion.anchor) : null), [graph, vehicleOrigin, overviewSuggestion]);
  /** The suggestion as its CARD view (RF-006.11): the SEED's street + number
      (no complement — decision 12/07), the summary chips and the vehicle leg. */
  const overviewSuggestionView: SuggestedStopView | null = overviewSuggestion
    ? {
        addressLine: addressLineOf(overviewSuggestion.seed.address),
        metrics: [
          { label: UI_LABELS.MAP_PANEL.METRIC_ADDRESSES(overviewSuggestion.points.length) },
          ...typedPackageChips(packagesByTypeFromPoints(overviewSuggestion.points)),
          { label: walkEstimateLabel(stopWalkEstimate(overviewSuggestion.anchor, overviewSuggestion.points, builderState.config)) },
        ],
        vehicleDistanceLabel: overviewVehicleLeg
          ? `${UI_LABELS.MAP_PANEL.ROTEIRO_POINT.DISTANCE_TO_HERE(formatMeters(overviewVehicleLeg.distanceMeters))}${overviewVehicleLeg.viaStreets ? "" : ` ${UI_LABELS.MAP_PANEL.ROTEIRO_START.SUGGESTION_STRAIGHT}`}`
          : null,
      }
    : null;

  /** Current sums for the "Detalhes" subsection (RF-006.11) — the SAME function
      the Sumário uses (RF-008), so the two screens can never disagree. Null
      before the first stop: there is nothing to sum yet. */
  const overviewTotals = useMemo(
    () =>
      mode === "roteiro" && builderState.stops.length > 0
        ? // Real street km (RF-006.7) only while "Ver detalhes" is open (the only
          // consumer) — the vehicle A* chain is reused from the drawn route, so
          // opening the panel costs one pass of the foot circuits, not two.
          plannedRouteTotals(toPlannedRoute(builderState), points, panelView === "overview" ? { graph, pedGraph, vehicleMetersOverride: vehicleRoute?.distanceMeters } : undefined)
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- toPlannedRoute reads only stops/startPoint/config (routeId/createdAt are stable); narrowing off the whole builderState keeps draft edits from recomputing the graph totals.
    [mode, builderState.stops, builderState.startPoint, builderState.config, points, panelView, graph, pedGraph, vehicleRoute]
  );
  /** Whether the shown totals came from the street graph (RF-006.7) — drives the
      honest "Detalhes" caption (streets vs the straight-line fallback). */
  const overviewViaStreets = graph !== null;

  /** Commercial-hours packages among the COMMITTED points — the overview's
      "Comercial" stat card (RF-006.20). Mirrors the typed chips' counting. */
  const overviewCommercialPackages = useMemo(() => {
    const assigned = assignedPointIds(builderState.stops);
    return packagesByTypeFromPoints(points.filter((p) => assigned.has(p.id))).commercial;
  }, [builderState.stops, points]);

  /** The start as an ADDRESS, when it is one ("Partir deste endereço" copies
      the point's coords verbatim — exact match is the honest detection). */
  const startAddressPoint = useMemo(() => {
    const start = builderState.startPoint;
    if (!start) return null;
    return points.find((p) => p.lat === start.lat && p.lng === start.lng) ?? null;
  }, [points, builderState.startPoint]);
  /** "Parada 0" (RF-006.11): the start row of the overview / start selection. */
  const overviewStart: OverviewStartView | null = builderState.startPoint
    ? { addressLine: startAddressPoint ? addressLineOf(startAddressPoint.address) : UI_LABELS.MAP_PANEL.ROTEIRO_START.DEFINED }
    : null;

  /** Overview CTA (RF-006.8): commits the SUGGESTED stop — the exact commit
      tela 8's "Criar parada" performs (seed + default-radius candidates,
      create-time snapped anchor), no tap required. The overview already shows
      what this creates, so the button does what it says. */
  const handleCreateSuggested = () => {
    if (!overviewSuggestion) return;
    const stopId = `stop_${overviewSuggestion.seed.id}`;
    dispatch({
      type: "CREATE_STOP",
      seedPointId: overviewSuggestion.seed.id,
      memberIds: overviewSuggestion.points.filter((p) => p.id !== overviewSuggestion.seed.id).map((p) => p.id),
      vehicleStop: overviewSuggestion.anchor,
      radiusMeters: builderState.config.autoRadiusMeters,
    });
    setSelectedPointId(null);
    setSelectedStopId(stopId); // focus the freshly firmed stop (same as handleCreateStop)
    setExpandedRoteiroStopId(null);
    setStartSelected(false);
    setCardExpanded(false);
    setPanelView("selected");
  };

  /** Roteiro state header (feedback 08/07: the panel always says the next step). */
  const roteiroComplete = isComplete(builderState);
  const roteiroModeLabel = roteiroComplete ? UI_LABELS.MAP_MODE.MY_ROTEIRO : UI_LABELS.MAP_PANEL.MODE_ROTEIRO_DRAFT;
  const roteiroStatusHint = roteiroComplete ? UI_LABELS.MAP_PANEL.ROTEIRO_STATE_COMPLETE : hasStart && !redefining ? UI_LABELS.MAP_PANEL.ROTEIRO_STATE_BUILDING : null;

  /** Tela 8 card tap: same sizing rule as the Original's selected-address card. */
  const handleRoteiroCardTap = () => {
    // The ACTIVE context decides which card the tap expands (RF-006.4.2).
    const activeItem = roteiroContext === "stop-selected" ? stopSelectedItem : selectedPointItem;
    if (!activeItem) return;
    if (cardExpanded) {
      setCardExpanded(false);
      return;
    }
    setCardExpanded(true);
    const target: PanelSnap = activeItem.packageCount > 2 ? "full" : "half";
    setPanelSnap((current) => (current === "full" ? "full" : target));
  };

  /** Discreet graph status for the header (ready/idle = silence). */
  const graphStatus =
    graphLoadStatus === "loading" ? { text: UI_LABELS.ROUTING.LOADING_STREETS } : graphLoadStatus === "error" ? { text: graphError ?? UI_LABELS.ROUTING.NETWORK_ERROR, onRetry: retryGraph } : null;

  /** Shared transition: updates the markers and the panel's stop memory. The
      panel follows the FOCUSED or expanded stop (RF-006.4.10 — a single click
      now focuses without expanding, so the memory tracks selectedAddressKey's
      stop). A full collapse (both null) keeps the last stop — memory only moves. */
  const applyInteraction = useCallback((next: InteractionState) => {
    setInteraction(next);
    const stopKey = next.expandedStopKey ?? (next.selectedAddressKey !== null ? next.selectedAddressKey.split(":")[0] : null);
    if (stopKey !== null) setPanelStopKey(stopKey);
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
    [applyInteraction, setPanelView]
  );

  /** Toggle handler: the URL carries the mode (replace — back leaves the map,
      it doesn't "un-toggle").

      Each mode KEEPS its place (RF-006.4.18): the Original's focused stop and
      the roteiro's selected stop/point/expansion all survive the round trip, and
      the panel reads a per-mode bucket. Only the transient start-flow UI (armed
      map tap, GPS spinner, pending confirmation) is dropped — leaving the mode
      is an implicit "cancel" of a gesture the user is halfway through. */
  const handleModeChange = (next: MapMode) => {
    if (next === mode) return;
    resetStartUi();
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
      if (panelView === "list" || panelView === "overview") {
        applyInteraction(regroupInteraction(interaction)); // Original: regroup, keep focus (RF-006.4.10)
        setPanelView("selected");
        setExpandedRoteiroStopId(null); // roteiro: regroup too (RF-006.4.8)
        setPanelSnap("half");
      } else if (panelSnap !== "collapsed") {
        setPanelSnap("collapsed");
      } else {
        navigate(-1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [panelView, panelSnap, navigate, interaction, applyInteraction, setPanelSnap, setPanelView]);

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
  const metricChips = panelStop ? [{ label: UI_LABELS.MAP_PANEL.METRIC_ADDRESSES(metrics.addressCount) }, ...typedPackageChips(metrics.packagesByType)] : [];
  // Selected-address card: the SELECTED address, or the first by Sequence while
  // nothing is selected — the card is never empty.
  const selectedItem = panelItems.find((item) => item.addressKey === interaction.selectedAddressKey) ?? panelItems[0] ?? null;

  /** StopStepper: FOCUSES the target on the map, GROUPED (RF-006.4.10 — single
      click doesn't expand anymore), selecting its first address for the panel. */
  const handleStepStop = (direction: 1 | -1) => {
    const nextKey = adjacentStopKey(stops, effectivePanelStopKey, direction);
    if (nextKey === null) return;
    applyInteraction(focusInteraction(Number(nextKey), stops));
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
    // Tapping the card shows its detail; it does NOT expand the map (RF-006.4.10)
    // — the map only ungroups via double-click / "Ver lista completa".
    applyInteraction({ expandedStopKey: interaction.expandedStopKey, selectedAddressKey: selectedItem.addressKey });
    setCardExpanded(true);
    const target: PanelSnap = selectedItem.packageCount > 2 ? "full" : "half";
    setPanelSnap((current) => (current === "full" ? "full" : target));
  };

  /** "Ver lista completa" (Original): opens the panel's full list — a DISTINCT
      event from the map ungroup (double-click); the list hides the map, so it
      does NOT expand the markers (RF-006.4.11). */
  const handleShowList = () => {
    setPanelView("list");
    setPanelSnap("full");
    setScrollSignal((count) => count + 1);
  };

  /** "Esconder lista": back to the selected view at half, REGROUPING the map
      while keeping the focus (RF-006.4.10/.4.11). */
  const handleHideList = () => {
    applyInteraction(regroupInteraction(interaction));
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

  /** Drag settle: leaving the full snap while in the list/overview view returns
      to the selected view — both are useless below full (rev. 07/07; RF-006.8:
      "Escape/arrasto saem, como no list"). */
  const handleSnapChange = (next: PanelSnap) => {
    setPanelSnap(next);
    if (next !== "full" && (panelView === "list" || panelView === "overview")) {
      applyInteraction(regroupInteraction(interaction)); // Original: regroup on leaving the list (RF-006.4.10)
      setPanelView("selected");
      setExpandedRoteiroStopId(null); // roteiro: regroup too (RF-006.4.8)
    }
  };

  /** Original-mode panel header (TWO views — rev. 07/07). Sections render
      through PanelSection (RF-006.4.3), the shared chrome of BOTH modes. */
  const originalHeader = (
    <div className="pt-1">
      <PanelModeBar modeLabel={UI_LABELS.MAP_PANEL.MODE_VIEW} onPrevStop={() => handleStepStop(-1)} onNextStop={() => handleStepStop(1)} />

      {/* Section 1 — Resumo da parada. The list toggle lives BESIDE the
          section label (rev. 07/07) and never disappears: it flips to
          "Esconder lista" while the list view is open. */}
      <PanelSection
        label={UI_LABELS.MAP_PANEL.SECTION_STOP}
        divider={false}
        actions={
          <Button type="button" variant="outline" size="sm" data-vaul-no-drag onClick={panelView === "list" ? handleHideList : handleShowList}>
            {panelView === "list" ? UI_LABELS.MAP_PANEL.HIDE_FULL_LIST : UI_LABELS.MAP_PANEL.VIEW_FULL_LIST}
          </Button>
        }
      >
        <PanelTitle stopNumber={panelStop && panelStop.hasStop ? panelStop.stop : null} neighborhoods={place.neighborhoods} zipcodes={place.zipcodes} metrics={metricChips} />
      </PanelSection>

      {/* Section 2 — Endereço selecionado (selected view only: the list
          view IS the addresses; no duplication anywhere). */}
      {panelView === "selected" && selectedItem && (
        <PanelSection label={UI_LABELS.MAP_PANEL.SECTION_SELECTED}>
          <StopItemRow item={selectedItem} onTap={handleCardTap} highlighted={cardExpanded} expanded={cardExpanded} />
        </PanelSection>
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
        // Original: the panel's current stop square gets the ring/glow (RF-006.4.13).
        highlightedStopKey={mode === "original" ? effectivePanelStopKey : undefined}
        // WHAT to frame and HOW CLOSE, by selection context (RF-006.4.20).
        focusBounds={mode === "roteiro" && roteiroFocus ? roteiroFocus.bounds : undefined}
        focusMaxZoom={mode === "roteiro" && roteiroFocus ? roteiroFocus.maxZoom : undefined}
        onMapTap={mode === "roteiro" ? handleMapTap : undefined}
        onModelTap={mode === "roteiro" ? handleModelTap : undefined}
        onModelExpand={mode === "roteiro" ? handleModelExpand : undefined}
        onStartTap={mode === "roteiro" ? handleStartTap : undefined}
        onAnchorDragEnd={mode === "roteiro" ? handleAnchorDragEnd : undefined}
        onAnchorTap={mode === "roteiro" ? handleAnchorTap : undefined}
        roteiroOverlay={mode === "roteiro" ? roteiroOverlay : undefined}
      />

      {/* Toggle floats OVER the map (fluxo §15.4: dominant map, compact overlays —
          no dedicated bar). z-index above Leaflet's panes/controls (~1000). */}
      <div className="absolute left-1/2 top-3 z-[1100] -translate-x-1/2">
        <MapModeToggle mode={mode} onModeChange={handleModeChange} roteiroEnabled={roteiroAvailable} />
      </div>

      {/* Reorder aviso (RF-006.17): floats under the toggle, auto-dismisses. */}
      {reorderNotice && <MapToast message={reorderNotice} />}

      {/* Persistent bottom panel. Original: TWO views (rev. 07/07). Roteiro:
          three contexts (RF-006.4/.4.1) — start-flow (.3), point-selected
          (tela 8, the Original's own card) and drafting (tela 9, CTAs in the
          header — the footer slot is only visible at the full snap). */}
      <MapPanel
        snap={panelSnap}
        onSnapChange={handleSnapChange}
        // Each mode fills the header differently, so each gets its own snap
        // heights (⚙️ tune them in panelSizing.ts).
        sizing={mode === "roteiro" ? ROTEIRO_PANEL_SIZING : ORIGINAL_PANEL_SIZING}
        header={
          mode === "roteiro" ? (
            roteiroContext === "drafting" && draft ? (
              <div>
                <RoteiroDraftHeader
                  stopNumber={builderState.stops.length + 1}
                  metrics={draftMetrics}
                  addresses={chosenPoints.length}
                  radiusMeters={draft.radiusMeters}
                  onRadiusChange={(meters) => dispatch({ type: "SET_DRAFT_RADIUS", radiusMeters: meters })}
                  candidateCount={candidatePoints.length}
                  farWarning={farIds.length > 0}
                  canSave={draft.pointIds.length > 0}
                  onSave={handleSaveStop}
                  onCancel={handleCancelDraft}
                />
                {/* A FREE point tapped on the map gets the header pick with
                    "Adicionar" (RF-006.4.24). A MEMBER tapped instead SELECTS it
                    (RF-006.19) — highlighted in the "Endereços da parada" list
                    below, where its "Tornar âncora"/"Remover" already live (no
                    duplicate pick). */}
                {draftSelectedPoint && !draftSelectedIsMember && (
                  <RoteiroDraftPick
                    item={pointToStopItemData(draftSelectedPoint)}
                    actions={
                      <Button type="button" size="sm" className="h-7 px-2 text-xs" data-vaul-no-drag onClick={handleAddSelectedToDraft}>
                        {UI_LABELS.MAP_PANEL.ROTEIRO_DRAFT.ADD_TO_STOP}
                      </Button>
                    }
                  />
                )}
              </div>
            ) : panelView === "overview" ? (
              // "Ver detalhes" = a DEDICATED clean state (RF-006.11): only the
              // concise header, whatever was selected — the body carries the
              // whole study panel. Hiding it returns to the untouched context.
              <div>
                <RoteiroPanelHeader progress={progress.ratio} modeLabel={roteiroModeLabel} graphStatus={graphStatus} detailsOpen onToggleDetails={handleHideOverview} />
              </div>
            ) : startSelected && overviewStart ? (
              // The START selected on the map (RF-006.11): "parada 0" + redefine.
              <div>
                <RoteiroPanelHeader progress={progress.ratio} modeLabel={roteiroModeLabel} graphStatus={graphStatus} detailsOpen={false} onToggleDetails={handleShowOverview} />
                <PanelSection label={UI_LABELS.MAP_PANEL.ROTEIRO_OVERVIEW.SECTION_START}>
                  <StartRow start={overviewStart} onDelete={handleDeleteStart} onReposition={handleRepositionStart} />
                </PanelSection>
              </div>
            ) : roteiroContext === "stop-selected" && selectedStop ? (
              <div>
                {/* detailsOpen is impossible here: the overview branch above
                    owns panelView === "overview" (RF-006.11). */}
                <RoteiroPanelHeader progress={progress.ratio} modeLabel={roteiroModeLabel} graphStatus={graphStatus} detailsOpen={false} onToggleDetails={handleShowOverview} />
                <RoteiroStopSection
                  stopOrder={selectedStop.order}
                  neighborhoods={stopPlace.neighborhoods}
                  zipcodes={stopPlace.zipcodes}
                  metrics={stopMetrics}
                  selectedItem={stopSelectedItem}
                  selectedKind={stopSelectedKind}
                  expanded={cardExpanded}
                  onTapCard={handleRoteiroCardTap}
                  onEdit={handleEditStop}
                  onDissolve={handleDissolveStop}
                  listOpen={panelView === "list"}
                  onToggleList={panelView === "list" ? handleHideRoteiroList : handleShowRoteiroList}
                />
              </div>
            ) : roteiroContext === "point-selected" && selectedPointItem ? (
              <div>
                <RoteiroPanelHeader progress={progress.ratio} modeLabel={roteiroModeLabel} graphStatus={graphStatus} detailsOpen={false} onToggleDetails={handleShowOverview} />
                <RoteiroPointSection
                  key={selectedPointItem.addressKey} // key-reset: the select re-anchors per point
                  item={selectedPointItem}
                  expanded={cardExpanded}
                  onTapCard={handleRoteiroCardTap}
                  suggestedOrder={suggestedOrder}
                  suggestedPlace={suggestedPlace}
                  suggestedMetrics={suggestedMetrics}
                  vehicleDistanceLabel={vehicleDistanceLabel}
                  radiusMeters={previewRadiusMeters}
                  onRadiusChange={setPreviewRadiusMeters}
                  stopOptions={stopOptions}
                  defaultStopId={defaultStopId}
                  onCreateStop={handleCreateStop}
                  onIncorporate={handleIncorporate}
                  isStart={startAddressPoint !== null && selectedPoint?.id === startAddressPoint.id}
                  onDeleteStart={handleDeleteStart}
                  onRepositionStart={handleRepositionStart}
                />
              </div>
            ) : (
              <div>
                <RoteiroPanelHeader
                  progress={progress.ratio}
                  modeLabel={roteiroModeLabel}
                  statusHint={roteiroStatusHint}
                  graphStatus={graphStatus}
                  detailsOpen={false}
                  onToggleDetails={handleShowOverview}
                />
                {/* The definition FLOW only (RF-006.11): the settled "Início
                    definido | Redefinir" row left the idle header — the start
                    now lives as "parada 0" (details) and on its map marker. */}
                {startPhase !== "has-start" && (
                  <RoteiroStartSection
                    phase={startPhase}
                    notice={startNotice}
                    pendingAddress={pendingPoint?.address}
                    onUseGps={handleUseGps}
                    onArmMapTap={() => {
                      setArmedMapTap(true);
                      setPendingPointId(null);
                      setStartNotice(null);
                    }}
                    onConfirmPoint={handleConfirmPoint}
                    onCancel={handleCancelStartAction}
                  />
                )}
              </div>
            )
          ) : (
            originalHeader
          )
        }
      >
        {mode === "roteiro" ? (
          roteiroContext === "drafting" && draft ? (
            <RoteiroDraftBody
              chosen={chosenItems}
              candidates={candidateItems}
              onTogglePoint={(pointId) => dispatch({ type: "TOGGLE_DRAFT_POINT", pointId })}
              anchorItem={draftAnchorItem}
              onResetAnchor={handleResetDraftAnchor}
              onReverseOrder={handleReverseDraftOrder}
              onMakeAnchor={handleMakeDraftAnchor}
              anchorMoved={!draft.vehicleStopIsDefault}
              selectedMemberKey={draftSelectedIsMember ? draftSelectedPointId : null}
            />
          ) : panelView === "overview" ? (
            // "Ver detalhes" — the DEDICATED study panel (RF-006.8/.11): the
            // same three sections from any context, nothing else.
            <RoteiroOverviewSection
              progress={progress}
              totals={overviewTotals}
              totalsViaStreets={overviewViaStreets}
              commercialPackages={overviewCommercialPackages}
              start={overviewStart}
              onDeleteStart={handleDeleteStart}
              onRepositionStart={handleRepositionStart}
              stops={overviewStops}
              startKey={startAddressPoint?.id ?? null}
              suggestion={overviewSuggestionView}
              onShowStopOnMap={handleShowRoteiroStopOnMap}
              onShowSuggestedOnMap={handleShowSuggestedOnMap}
              onCreateSuggested={handleCreateSuggested}
            />
          ) : roteiroContext === "start-flow" && !startSelected ? (
            // Idle (RF-006.11): ONLY the suggested-next-stop card — the lean
            // panel the empty-map tap lands on. Null before a start exists.
            overviewSuggestionView ? (
              <SuggestedStopSection suggestion={overviewSuggestionView} onShowOnMap={handleShowSuggestedOnMap} onCreate={handleCreateSuggested} />
            ) : null
          ) : roteiroContext === "stop-selected" && panelView === "list" ? (
            // "Ver parada" (RF-006.4.7): the stop's addresses by visit order; the
            // 1st (where the vehicle parks — RF-006.18) carries the "Parada do
            // veículo" badge.
            <StopItemList items={stopListItems} selectedKey={null} scrollSignal={scrollSignal} neon startKey={startAddressPoint?.id ?? null} vehicleStopKey={vehicleDeliveryPoint?.id ?? null} />
          ) : null
        ) : panelView === "list" ? (
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
