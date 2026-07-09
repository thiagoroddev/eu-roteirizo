import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { MapPin } from "lucide-react";

import { RouteMap } from "../components/RouteMap";
import { Button } from "../components/ui/button";
import { MapModeToggle, MODE_QUERY_PARAM, MODE_QUERY_ROTEIRO, type MapMode } from "../components/map/MapModeToggle";
import { MapPanel, PANEL_COLLAPSED_PX, type PanelSnap } from "../components/map/panel/MapPanel";
import { PanelModeBar } from "../components/map/panel/PanelModeBar";
import { PanelSection } from "../components/map/panel/PanelSection";
import { PanelTitle } from "../components/map/panel/PanelTitle";
import { RoteiroPanelHeader } from "../components/map/panel/RoteiroPanelHeader";
import { RoteiroStartSection, type StartPhase } from "../components/map/panel/RoteiroStartSection";
import { RoteiroPointSection, type StopOption } from "../components/map/panel/RoteiroPointSection";
import { RoteiroDraftHeader, RoteiroDraftBody } from "../components/map/panel/RoteiroDraftSection";
import { RoteiroStopSection } from "../components/map/panel/RoteiroStopSection";
import type { PanelMetric } from "../components/map/panel/PanelTitle";
import { StopItemList } from "../components/map/panel/StopItemList";
import { StopItemRow, StopItemDetail } from "../components/map/panel/StopItem";
import { useManifestFromUrl } from "../hooks/useManifestFromUrl";
import { useRouteBuilder } from "../hooks/useRouteBuilder";
import { useRoadGraph } from "../hooks/useRoadGraph";
import type { RowData } from "../types";
import type { LatLng } from "../types/routing";
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
import { remainingCounts, suggestedNextPointId, suggestionOrigin, draftCandidateIds, farChosenPointIds, isComplete, FAR_POINT_RADIUS_FACTOR, FAR_POINT_MIN_METERS } from "../utils/routing/builder";
import { stopWalkEstimate } from "../utils/routing/estimates";
import { assignedPointIds, pointsWithinRadius } from "../utils/routing/selectors";
import { indexPointsById, nearestStopTo } from "../utils/routing/selectors";
import { suggestVehicleStop } from "../utils/routing/vehicleStop";
import { sweepWalkingOrder } from "../utils/routing/walkOrder";
import { pedestrianGraph } from "../utils/routing/pedestrian";
import { suggestionPath } from "../utils/routing/suggestion";
import { haversine } from "../utils/routing/geo";
import { isWithinRioBounds } from "../utils/coordinates";
import { formatMeters } from "../utils/formatters";
import { UI_LABELS } from "../constants/uiLabels";

/** The panel's two views (rev. 07/07 — TASK-RF-023.7). */
type PanelView = "selected" | "list";

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

  // ------- Meu roteiro domain (ADR-009: DeliveryPoint/RouteStop, never StopGroup) -------
  const points = useMemo(() => buildDeliveryPoints(rows), [rows]);
  const { state: builderState, dispatch } = useRouteBuilder(points);
  const roteiroAvailable = points.length > 0;
  const mode: MapMode = searchParams.get(MODE_QUERY_PARAM) === MODE_QUERY_ROTEIRO && roteiroAvailable ? "roteiro" : "original";
  const remaining = remainingCounts(builderState);
  const pointsById = useMemo(() => indexPointsById(points), [points]);

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
  /** The grouping radius of the "Parada sugerida" preview — adjustable BEFORE
      creating (RF-006.4.6). Ephemeral; resets to the default per selected orphan. */
  const [previewRadiusMeters, setPreviewRadiusMeters] = useState(builderState.config.autoRadiusMeters);
  const draft = builderState.draft;
  const farIds = farChosenPointIds(builderState);
  const selectedPoint = selectedPointId !== null ? (pointsById.get(selectedPointId) ?? null) : null;
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
        selectedPointId,
        selectedStopId,
        expandedStopId: expandedRoteiroStopId,
        selectedMemberId: effectiveSelectedMemberId,
      }),
    // candidateIds is derived fresh each render; its CONTENT tracks draft/points.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [points, builderState.stops, draft, selectedPointId, selectedStopId, expandedRoteiroStopId, effectiveSelectedMemberId, candidateIds.join("|")]
  );

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

  /** Armed map tap → the tapped coordinate becomes the start (decision 08/07);
      otherwise an empty-map tap just clears the orphan selection (tela 8). */
  const handleMapTap = (latlng: LatLng) => {
    if (armedMapTap) {
      defineStart(latlng);
      return;
    }
    // Tapping the empty map REGROUPS an ungrouped stop, keeping it focused
    // (RF-006.4.11); only when nothing is ungrouped does it deselect.
    if (expandedRoteiroStopId !== null) {
      setExpandedRoteiroStopId(null);
      setSelectedMemberId(null); // regroup returns to the anchor as the selected address (RF-006.4.16)
      return;
    }
    setSelectedPointId(null);
    setSelectedStopId(null);
    setSelectedMemberId(null);
    setPanelView("selected");
  };

  /** Double-tap a firmed stop → ungroup it on the MAP ONLY, focused (RF-006.4.11):
      the panel STAYS on the summary (the full list would hide the map — they are
      distinct events). Regroup by tapping the empty map. */
  const handleExpandRoteiroStop = (stopId: string) => {
    setSelectedStopId(stopId);
    setSelectedPointId(null);
    setExpandedRoteiroStopId(stopId);
    setSelectedMemberId(null); // a fresh expand starts on the anchor (RF-006.4.16)
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
      setCardExpanded(false);
      return;
    }
    // During an EDIT the map no longer toggles membership (Q2 09/07 — RF-006.4.9):
    // members change only via the radius + the panel list ±. Map tap is inert.
    if (draft) return;
    if (!hasStart || redefining) {
      setPendingPointId(model.key);
      setArmedMapTap(false);
      setStartNotice(null);
      return;
    }
    setSelectedPointId(model.key);
    setSelectedStopId(null);
    setExpandedRoteiroStopId(null);
    setPreviewRadiusMeters(builderState.config.autoRadiusMeters); // each orphan starts at the default radius
    setCardExpanded(false);
    // No auto-raise: the collapsed snap now FITS the summary (RF-006.4.12).
    dispatch({ type: "SET_NEXT_SUGGESTION", pointId: model.key });
  };

  /** "Criar parada" now COMMITS on the spot (RF-006.4.6): the seed + the preview
      radius members become a firmed stop directly (no draft), and the panel
      focuses that grouped stop. Radius was tuned in the preview; further edits
      go through "Editar parada" (REOPEN). Reverses §8 (candidates by choice). */
  const handleCreateStop = () => {
    if (!selectedPoint) return;
    const stopId = `stop_${selectedPoint.id}`;
    dispatch({
      type: "CREATE_STOP",
      seedPointId: selectedPoint.id,
      memberIds: previewCandidateIds,
      vehicleStop: suggestVehicleStop(graph, selectedPoint),
      radiusMeters: previewRadiusMeters,
    });
    setSelectedPointId(null);
    setSelectedStopId(stopId); // focus the freshly firmed, grouped stop
    setExpandedRoteiroStopId(null);
    setCardExpanded(false);
    setPanelView("selected");
    // No auto-raise: the collapsed snap now FITS the summary (RF-006.4.12).
  };

  /** Committed-stop actions (RF-006.4.2 — fluxo §9; REOPEN/DISSOLVE were ready). */
  const handleEditStop = () => {
    if (!selectedStop) return;
    dispatch({ type: "REOPEN_STOP", stopId: selectedStop.id });
    setSelectedStopId(null);
    setExpandedRoteiroStopId(null);
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

  const handleSaveStop = () => dispatch({ type: "COMMIT_STOP" });
  const handleCancelDraft = () => dispatch({ type: "CANCEL_DRAFT" });

  // ADR-009 decision C: while the draft's anchor is still the DEFAULT
  // suggestion, re-project it onto the street as soon as the graph arrives.
  // User-moved anchors are never overwritten (vehicleStopIsDefault false).
  // NOTE (RF-006.4.6): since "Criar parada" now COMMITS (no create-draft) and
  // the only remaining draft path is REOPEN (which sets default=false), this
  // effect is currently inert — create-time snapping via suggestVehicleStop
  // covers the graph-ready case. It stays for when .5 (anchor gestures) brings
  // back default-anchor drafts. Offline-created anchors are provisional until then.
  const draftSeedId = draft?.seedPointId;
  const draftAnchorIsDefault = draft?.vehicleStopIsDefault ?? false;
  useEffect(() => {
    if (!graph || !draftAnchorIsDefault || !draftSeedId) return;
    const seed = pointsById.get(draftSeedId);
    if (seed) dispatch({ type: "RESET_VEHICLE_STOP", suggestedVehicleStop: suggestVehicleStop(graph, seed) });
  }, [graph, draftAnchorIsDefault, draftSeedId, pointsById, dispatch]);

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
      ? `${UI_LABELS.MAP_PANEL.ROTEIRO_START.SUGGESTION(addressLineOf(suggestedPoint.address), formatMeters(suggestion.distanceMeters))}${suggestion.viaStreets ? "" : ` ${UI_LABELS.MAP_PANEL.ROTEIRO_START.SUGGESTION_STRAIGHT}`}`
      : null;

  const draftSeed = draftSeedId !== undefined ? (pointsById.get(draftSeedId) ?? null) : null;
  const roteiroOverlay = useMemo(
    () => ({
      start: builderState.startPoint,
      suggestionPath: suggestion?.path ?? null,
      // The radius circle also PREVIEWS on the selected orphan, before creating (U6).
      radiusCircle:
        draft && draftSeed
          ? { center: { lat: draftSeed.lat, lng: draftSeed.lng }, meters: draft.radiusMeters }
          : selectedPoint
            ? { center: { lat: selectedPoint.lat, lng: selectedPoint.lng }, meters: previewRadiusMeters }
            : null,
      anchor: draft?.vehicleStop ?? null,
    }),
    [builderState.startPoint, previewRadiusMeters, suggestion, draft, draftSeed, selectedPoint]
  );

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
  const chosenItems = chosenPoints.map((point, index) => pointToStopItemData(point, { ordinal: index + 1 }));
  const candidateItems = candidatePoints.map((point) => pointToStopItemData(point));
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
  const stopEstimate = selectedStop && stopPoints.length > 0 ? stopWalkEstimate(selectedStop.vehicleStop, stopPoints, builderState.config) : null;
  const stopPlace = stopPlaceSummaryFromPoints(stopPoints);
  const stopMetrics: PanelMetric[] = [
    { label: UI_LABELS.MAP_PANEL.METRIC_ADDRESSES(stopPoints.length) },
    ...typedPackageChips(packagesByTypeFromPoints(stopPoints)),
    ...(stopEstimate ? [{ label: walkEstimateLabel(stopEstimate) }] : []),
  ];
  /** The stop's ANCHOR row (RF-006.4.7): vehicle glyph + address WITHOUT
      complement. The address is a PLACEHOLDER (the first stop address) until the
      vehicle-stop geocoding lands (TASK-RF-006.9, in pendentes). */
  const stopAnchorItem = stopPoints[0] ? { ...pointToStopItemData(stopPoints[0]), complement: UI_LABELS.ROUTE_MAP.ADDRESS_SHEET.NO_COMPLEMENT } : null;
  /** The stop's full address list ("Ver lista completa" — RF-006.4.7), ordinals in visit order. */
  const stopListItems = stopPoints.map((point, index) => pointToStopItemData(point, { ordinal: index + 1 }));
  /** "Endereço selecionado" of a firmed stop (RF-006.4.16): the tapped member
      (ordinal marker, real address) when one is selected in the expanded group,
      else the anchor (vehicle glyph, no complement). */
  const selectedMemberIndex = effectiveSelectedMemberId ? stopPoints.findIndex((p) => p.id === effectiveSelectedMemberId) : -1;
  const stopSelectedIsAnchor = selectedMemberIndex < 0;
  const stopSelectedItem = stopSelectedIsAnchor ? stopAnchorItem : pointToStopItemData(stopPoints[selectedMemberIndex], { ordinal: selectedMemberIndex + 1 });

  // ------- Suggested-stop preview (3ª seção do painel — RF-006.4.3/.4.4) -------
  /** How the stop WOULD look if created now: the summary aggregates the seed
      AND the radius candidates (what the circle shows — rev. 08/07 .4.4), in
      the default walking sweep around the suggested anchor (the reducer's own
      rule). Creating still seeds only the selected point — candidates enter by
      choice (§8, decision 26/06). */
  const suggestedOrder = builderState.stops.length + 1;
  const suggestedAnchor = useMemo(() => (selectedPoint ? suggestVehicleStop(graph, selectedPoint) : null), [graph, selectedPoint]);
  const suggestedPoints = useMemo(() => {
    if (!selectedPoint || !suggestedAnchor) return [];
    const members = [selectedPoint, ...previewCandidateIds.map((id) => pointsById.get(id)).filter((p): p is NonNullable<ReturnType<typeof pointsById.get>> => p !== undefined)];
    const byId = indexPointsById(members);
    return sweepWalkingOrder(suggestedAnchor, members)
      .map((id) => byId.get(id))
      .filter((p): p is NonNullable<ReturnType<typeof byId.get>> => p !== undefined);
  }, [selectedPoint, suggestedAnchor, previewCandidateIds, pointsById]);
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
    [applyInteraction]
  );

  /** Toggle handler: the URL carries the mode (replace — back leaves the map,
      it doesn't "un-toggle"). Entering the roteiro collapses the Original's
      expansion and the panel; `panelStopKey` survives, so switching back
      restores the Original panel from memory. */
  const handleModeChange = (next: MapMode) => {
    if (next === mode) return;
    resetStartUi();
    setSelectedPointId(null); // the draft survives on purpose (it lives in the reducer)
    setSelectedStopId(null);
    setExpandedRoteiroStopId(null);
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
  }, [panelView, panelSnap, navigate, interaction, applyInteraction]);

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

  /** Drag settle: leaving the full snap while in the list view returns to the
      selected view — the list is useless below full (rev. 07/07). */
  const handleSnapChange = (next: PanelSnap) => {
    setPanelSnap(next);
    if (next !== "full" && panelView === "list") {
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
        // When a firmed stop is focused/expanded, zoom CLOSE to it (RF-006.4.11).
        focusBounds={mode === "roteiro" && selectedStop ? stopPoints.map((p) => ({ lat: p.lat, lng: p.lng })) : undefined}
        onMapTap={mode === "roteiro" ? handleMapTap : undefined}
        onModelTap={mode === "roteiro" ? handleModelTap : undefined}
        onModelExpand={mode === "roteiro" ? handleModelExpand : undefined}
        roteiroOverlay={mode === "roteiro" ? roteiroOverlay : undefined}
      />

      {/* Toggle floats OVER the map (fluxo §15.4: dominant map, compact overlays —
          no dedicated bar). z-index above Leaflet's panes/controls (~1000). */}
      <div className="absolute left-1/2 top-3 z-[1100] -translate-x-1/2">
        <MapModeToggle mode={mode} onModeChange={handleModeChange} roteiroEnabled={roteiroAvailable} />
      </div>

      {/* Persistent bottom panel. Original: TWO views (rev. 07/07). Roteiro:
          three contexts (RF-006.4/.4.1) — start-flow (.3), point-selected
          (tela 8, the Original's own card) and drafting (tela 9, CTAs in the
          header — the footer slot is only visible at the full snap). */}
      <MapPanel
        snap={panelSnap}
        onSnapChange={handleSnapChange}
        header={
          mode === "roteiro" ? (
            roteiroContext === "drafting" && draft ? (
              <RoteiroDraftHeader
                stopNumber={builderState.stops.length + 1}
                metrics={draftMetrics}
                addresses={chosenPoints.length}
                remainingAddresses={remaining.addresses}
                remainingPackages={remaining.packages}
                canSave={draft.pointIds.length > 0}
                onSave={handleSaveStop}
                onCancel={handleCancelDraft}
              />
            ) : roteiroContext === "stop-selected" && selectedStop ? (
              <div>
                <RoteiroPanelHeader remainingAddresses={remaining.addresses} remainingPackages={remaining.packages} modeLabel={roteiroModeLabel} graphStatus={graphStatus} />
                <RoteiroStopSection
                  stopOrder={selectedStop.order}
                  neighborhoods={stopPlace.neighborhoods}
                  zipcodes={stopPlace.zipcodes}
                  metrics={stopMetrics}
                  selectedItem={stopSelectedItem}
                  isAnchor={stopSelectedIsAnchor}
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
                <RoteiroPanelHeader remainingAddresses={remaining.addresses} remainingPackages={remaining.packages} modeLabel={roteiroModeLabel} graphStatus={graphStatus} />
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
                />
              </div>
            ) : (
              <div>
                <RoteiroPanelHeader
                  remainingAddresses={remaining.addresses}
                  remainingPackages={remaining.packages}
                  modeLabel={roteiroModeLabel}
                  statusHint={roteiroStatusHint}
                  graphStatus={graphStatus}
                />
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
            )
          ) : (
            originalHeader
          )
        }
      >
        {mode === "roteiro" ? (
          roteiroContext === "drafting" && draft ? (
            <RoteiroDraftBody
              candidateCount={candidatePoints.length}
              radiusMeters={draft.radiusMeters}
              onRadiusChange={(meters) => dispatch({ type: "SET_DRAFT_RADIUS", radiusMeters: meters })}
              chosen={chosenItems}
              candidates={candidateItems}
              onTogglePoint={(pointId) => dispatch({ type: "TOGGLE_DRAFT_POINT", pointId })}
              farWarning={farIds.length > 0}
            />
          ) : roteiroContext === "stop-selected" && panelView === "list" ? (
            // "Ver lista completa" (RF-006.4.7): the stop's addresses by visit
            // order, neon palette, expandable — panel-side only for now (the map
            // ungroup arrives with the interaction fatia .4.8).
            <StopItemList items={stopListItems} selectedKey={null} scrollSignal={scrollSignal} neon />
          ) : roteiroContext === "stop-selected" && cardExpanded && stopSelectedItem ? (
            <StopItemDetail item={stopSelectedItem} />
          ) : roteiroContext === "point-selected" && cardExpanded && selectedPointItem ? (
            <StopItemDetail item={selectedPointItem} />
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
