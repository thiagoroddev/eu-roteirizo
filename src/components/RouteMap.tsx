import React, { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Tipos e Constantes
import type { RowData } from "../types";
import type { LatLng } from "../types/routing";
import { MAP_CONFIG, FOCUS_MAX_ZOOM, UI_LABELS } from "../constants";

// SVG markers (ADR-008): one marker per stop; click expands a stop into its address
// circles, click an address selects it — the MapPage's persistent panel shows the
// detail (RF-023). The view-model logic is pure (markerModels).
import { createMarkerDivIcon } from "../utils/markers/markerIcon";
import { MARKER_GEOMETRY } from "../utils/markers/markerSvg";
import { groupRowsByStop } from "../utils/markers/stopGrouping";
import { colorForLocationType, ROTEIRO_MARKER_COLORS, ROTEIRO_ACCENT } from "../utils/markers/markerColors";
import { scaleForZoom, MARKER_MAX_SCALE } from "../utils/markers/markerScale";
import { computeMarkerModels, nextInteraction, expandInteraction, regroupInteraction, type MarkerModel, type InteractionState } from "../utils/markers/markerModels";

/* ============================================================================
   GLOBAL CONFIGURATION (OUTSIDE COMPONENT)
============================================================================ */

// Tooltip sits above the body. Computed at full size (the closest-zoom scale); at
// far zoom the marker is smaller, so the tooltip just floats slightly higher.
const TOOLTIP_OFFSET_Y = -(MARKER_GEOMETRY.TIP_Y - MARKER_GEOMETRY.BODY_TOP) * MARKER_MAX_SCALE;

// A stop whose addresses spread beyond this (meters) from the representative gets a
// DEV-only warning — to learn in the field whether a "spread Stop" is rare or bad data.
const STOP_DISPERSION_WARN_M = 100;

// Expanded address circles scale with zoom like the stop squares (same proportion);
// the selected one (inside a multi-address stop) is enlarged by this factor.
const SELECTED_SCALE_FACTOR = 1.4;

// Stacking priority (zIndexOffset): the expanded stop's addresses rise above the other
// stops' squares; the selected address rises above its neighbors — so nothing covers it.
// Gaps are large enough to dominate Leaflet's latitude-based ordering.
const Z_GROUP = 100000;
const Z_SELECTED = 200000;
/** Vehicle/anchor sits BELOW the address markers (RF-006.4.2): the tipless car
    parks on the street and must never cover an address. */
const Z_VEHICLE = 50000;
/** ...EXCEPT while DRAGGABLE in the edit draft (RF-006.19): it rises ABOVE every
    address so the drag isn't blocked by a member marker sitting on top of it
    (the "can't grab the car" smoke). Only the draft raises it. */
const Z_ANCHOR_DRAG = 250000;
/** The route START outranks everything except the SELECTED marker (feedback
    10/07, supersedes the .4.27 "below the addresses": buried under a cluster,
    the start was impossible to find — it's the route's one fixed landmark). */
const Z_START = 180000;
/** Committed stops rise above the free circles and grow — they are the tap
    target and the most important element of the roteiro map (RF-006.4.2).
    Applied ONLY to external (roteiro) models; the Original is untouched. */
const Z_EXTERNAL_STOP = 150000;
const EXTERNAL_STOP_SCALE_FACTOR = 1.25;

/** Single vs double tap window (RF-006.4.8): the single-tap action waits this
    long; a double-tap cancels it and expands instead. Tunable at smoke. */
const DOUBLE_TAP_MS = 220;

// The suggestion line, in the mode's neon accent (RF-006.4.2 — the old gray
// vanished on light tiles); still faded/dashed per fluxo §3/§6.
const SUGGESTION_LINE_STYLE = { dashArray: "6 8", weight: 3, color: ROTEIRO_ACCENT, opacity: 0.55 } as const;
/** The suggestion is FADED in a draft, STRONGER once the stop is firmed (fluxo §6). */
const SUGGESTION_LINE_STRONG = { ...SUGGESTION_LINE_STYLE, weight: 4, opacity: 0.9 } as const;
/** Vehicle route between anchors (RF-006.7): CONTINUOUS (no dashArray), in the
    anchor's slate — reads as "the car's street path". ⚙️ MANUAL KNOB (color/weight). */
const VEHICLE_ROUTE_STYLE = { weight: 4, color: ROTEIRO_MARKER_COLORS.vehicle.bottom, opacity: 0.9 } as const;
/** Foot circuit of a stop (RF-006.7): DASHED amber — distinct from the marker
    palette (green/blue/gray) and the cyan suggestion. ⚙️ MANUAL KNOB. */
const FOOT_CIRCUIT_STYLE = { dashArray: "6 8", weight: 3, color: "#F59E0B", opacity: 0.85 } as const;

/** Route START: the same tipless CAR circle as the anchor, parked on the street,
    in strong BLUE — the COLOR tells start and anchor apart (RF-006.4.27;
    supersedes the .4.2 diamond, which sat over the address pin when the start
    was set by address). Center anchor + low z, like the anchor: never covers
    an address marker. */
const START_ICON_PROPS = { shape: "circle", color: ROTEIRO_MARKER_COLORS.start, glyph: "car", number: null, badge: null, selected: true, emphasis: true, tip: false, anchor: "center" } as const;

/** VEHICLE/anchor: slate circle with the Tabler CAR glyph, NO tip, centered
    anchor — parks on the street without covering addresses (RF-006.4.2). */
const VEHICLE_ICON_PROPS = { shape: "circle", color: ROTEIRO_MARKER_COLORS.vehicle, glyph: "car", number: null, badge: null, selected: true, emphasis: true, tip: false, anchor: "center" } as const;

/** The draft's DASHED radius circle (tela 9, spec §3) — neon accent (RF-006.4.2). */
const RADIUS_CIRCLE_STYLE = (meters: number) => ({ radius: meters, dashArray: "6 8", weight: 2, color: ROTEIRO_ACCENT, fillColor: ROTEIRO_ACCENT, fillOpacity: 0.06 });

/* ============================================================================
   ROUTEMAP COMPONENT
============================================================================ */

/**
 * RouteMap - the embedded Leaflet map of the `/mapa` focus screen.
 *
 * Original mode (default): draws one SVG marker per stop (square). Clicking a
 * stop expands its addresses as circles and selects the first one; clicking an
 * address selects it; clicking the empty map collapses. FULLY CONTROLLED
 * (TASK-REF-011): the parent (MapPage) owns the interaction state — this
 * component only draws it and EMITS transitions via onInteractionChange, so the
 * persistent MapPanel and the map share one source of truth. Escape/close are
 * the page's business, not this component's.
 *
 * Meu roteiro mode (ADR-009): the parent passes ready-made view-models via
 * `models` and this component just draws them — the internal computation
 * (groupRowsByStop) stays exclusive to the Original mode.
 */
interface Props {
  rows: RowData[];
  interaction: InteractionState;
  onInteractionChange: (next: InteractionState) => void;
  /**
   * Height (px) of whatever covers the map's bottom (the collapsed MapPanel).
   * Added to the fitBounds bottom padding so markers never frame behind it
   * (TASK-RF-023.5).
   */
  bottomObstructionPx?: number;
  /**
   * External view-model override — the Meu roteiro mode (ADR-009, TASK-RF-006.2).
   * When present, RouteMap draws THESE models and frames them in fitBounds;
   * their clicks fire `onModelTap` (when given) instead of the Original-mode
   * interaction; when absent, the Original-mode computation above applies.
   */
  models?: MarkerModel[];
  /** Meu roteiro: coords to zoom CLOSE to when something is focused/selected
      (RF-006.4.11). Absent/empty → frame all models (whole route). */
  focusBounds?: LatLng[];
  /** How close `focusBounds` may zoom (RF-006.4.20). The caller knows WHAT it is
      focusing — an address or an ungrouped stop wants `ZOOM.MAX`, a grouped stop
      wants context around it — so it also decides HOW close. Default: the
      grouped-stop focus. */
  focusMaxZoom?: number;
  /** Original: the panel's current stop (index string) — its SQUARE gets the
      ring/glow even without a click, so the map mirrors the panel (RF-006.4.13). */
  highlightedStopKey?: string | null;
  /** Tap on the empty map, with its coordinate (Meu roteiro: set-start-by-tap — TASK-RF-006.3). */
  onMapTap?: (latlng: LatLng) => void;
  /** Tap on an EXTERNAL model's marker (Meu roteiro: select orphan / toggle candidate / re-point). */
  onModelTap?: (model: MarkerModel) => void;
  /** DOUBLE-tap on an EXTERNAL model's marker (Meu roteiro: expand a firmed stop
      into its addresses — RF-006.4.8). Single vs double is disambiguated by a
      short timer, since markers are recreated on every interaction change. */
  onModelExpand?: (model: MarkerModel) => void;
  /** Tap on the START marker (Meu roteiro — RF-006.11): the start is selectable,
      showing "parada 0" + the redefine action in the panel. */
  onStartTap?: () => void;
  /** Drag end of the ANCHOR car (Meu roteiro — TASK-RF-006.5): emits the RAW
      dropped coordinate; the caller street-projects it (map matching stays
      outside, as in the reducer) and re-anchors draft or committed stop. */
  onAnchorDragEnd?: (latlng: LatLng) => void;
  /** Tap on the ANCHOR car when it is NOT draggable (RF-006.17): the distinct
      vehicle stop of an expanded firmed stop is selectable, so the car cycles
      back into the panel after a member was tapped. */
  onAnchorTap?: () => void;
  /** Roteiro decorations, drawn on their OWN layer (TASK-RF-006.3/.4): start
      marker, dashed suggestion line, the draft's dashed radius circle (real
      meters, centered on the seed) and its provisional anchor. */
  roteiroOverlay?: {
    start: LatLng | null;
    suggestionPath: LatLng[] | null;
    radiusCircle?: { center: LatLng; meters: number } | null;
    anchor?: LatLng | null;
    /** The anchor car is DRAGGABLE only in the edit draft (RF-006.16): an
        expanded firmed stop SHOWS the car but doesn't let it move (editing the
        anchor means "Editar parada"). */
    anchorDraggable?: boolean;
    /** Vehicle route (RF-006.7): the continuous line start → anchors (street path). */
    vehicleRoute?: LatLng[] | null;
    /** Foot circuit (RF-006.7): the dashed loop of the selected/draft stop. */
    footCircuit?: LatLng[] | null;
    /** Fade the suggestion (RF-006.7): true in a draft, false when firmed. */
    suggestionFaded?: boolean;
  };
}

export const RouteMap: React.FC<Props> = ({
  rows,
  interaction,
  onInteractionChange,
  bottomObstructionPx = 0,
  models,
  focusBounds,
  focusMaxZoom = FOCUS_MAX_ZOOM,
  highlightedStopKey,
  onMapTap,
  onModelTap,
  onModelExpand,
  onStartTap,
  onAnchorDragEnd,
  onAnchorTap,
  roteiroOverlay,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  /** Own layer for the roteiro overlay (start + suggestion line): the markers
      layer is clearLayers()'d on every model redraw and would erase them. */
  const overlayLayerRef = useRef<L.LayerGroup | null>(null);

  const { expandedStopKey, selectedAddressKey } = interaction;

  // Latest-callback refs: effects registered once (deps []) emit transitions
  // through them without re-subscribing Leaflet handlers on every state change.
  // Kept fresh in an effect (refs must not be written during render).
  const applyInteractionRef = useRef<(next: InteractionState) => void>(() => {});
  const onMapTapRef = useRef<((latlng: LatLng) => void) | undefined>(undefined);
  const onModelTapRef = useRef<((model: MarkerModel) => void) | undefined>(undefined);
  const onModelExpandRef = useRef<((model: MarkerModel) => void) | undefined>(undefined);
  const onStartTapRef = useRef<(() => void) | undefined>(undefined);
  const onAnchorDragEndRef = useRef<((latlng: LatLng) => void) | undefined>(undefined);
  const onAnchorTapRef = useRef<(() => void) | undefined>(undefined);
  /** Pending single-tap timer (RF-006.4.8/.4.10): a double-tap clears it before
      it fires, so the single-tap action doesn't run (nor recreate the markers). */
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  /** Latest interaction, for handlers registered once (empty-tap regroup keeps
      the current focus — RF-006.4.10). */
  const interactionRef = useRef<InteractionState>(interaction);
  /** Latest models + focus bounds for the fit effect, which reacts to boundsSignature only. */
  const renderModelsRef = useRef<MarkerModel[]>([]);
  const focusBoundsRef = useRef<LatLng[] | undefined>(focusBounds);
  useEffect(() => {
    applyInteractionRef.current = onInteractionChange;
    onMapTapRef.current = onMapTap;
    onModelTapRef.current = onModelTap;
    onModelExpandRef.current = onModelExpand;
    onStartTapRef.current = onStartTap;
    onAnchorDragEndRef.current = onAnchorDragEnd;
    onAnchorTapRef.current = onAnchorTap;
    interactionRef.current = interaction;
  });
  const stops = useMemo(() => groupRowsByStop(rows), [rows]);
  const internalModels = useMemo(() => computeMarkerModels(stops, expandedStopKey, selectedAddressKey, highlightedStopKey), [stops, expandedStopKey, selectedAddressKey, highlightedStopKey]);
  /** External models (Meu roteiro) win; otherwise the Original-mode computation. */
  const isExternal = models !== undefined;
  const renderModels = models ?? internalModels;
  const hasModelTap = onModelTap !== undefined;
  /** Primitive deps: effects must react to the start MOVING, not to object identity. */
  const startLat = roteiroOverlay?.start?.lat;
  const startLng = roteiroOverlay?.start?.lng;
  const suggestionPath = roteiroOverlay?.suggestionPath ?? null;
  const radiusCircle = roteiroOverlay?.radiusCircle ?? null;
  const anchorLat = roteiroOverlay?.anchor?.lat;
  const anchorLng = roteiroOverlay?.anchor?.lng;
  const anchorDraggable = roteiroOverlay?.anchorDraggable ?? false;
  const vehicleRoute = roteiroOverlay?.vehicleRoute ?? null;
  const footCircuit = roteiroOverlay?.footCircuit ?? null;
  const suggestionFaded = roteiroOverlay?.suggestionFaded ?? false;
  /** Bounds signature: refit ONLY when the framed set changes (markers appear/
      disappear or the start moves) — never on visual-state churn like toggling
      a draft candidate, which would destroy the user's zoom mid-draft (RF-006.4). */
  /** Focus signature: refit when the focused stop's frame changes (RF-006.4.11). */
  const focusSignature = focusBounds && focusBounds.length > 0 ? focusBounds.map((p) => `${p.lat},${p.lng}`).join("|") : "";
  const boundsSignature = useMemo(() => {
    if (!isExternal) return "";
    const keys = renderModels.map((model) => model.key).sort();
    return `${keys.join("|")}#${startLat ?? ""},${startLng ?? ""}#${focusSignature}`;
  }, [isExternal, renderModels, startLat, startLng, focusSignature]);

  /** Kept fresh after every render, BEFORE the fit effect below runs. */
  useEffect(() => {
    renderModelsRef.current = renderModels;
    focusBoundsRef.current = focusBounds;
  });

  // 1) MAP INITIALIZATION (Leaflet Setup)
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const { SOUTH_WEST, NORTH_EAST } = MAP_CONFIG.RIO_BOUNDS;
    const rioBounds = L.latLngBounds(L.latLng(SOUTH_WEST.lat, SOUTH_WEST.lng), L.latLng(NORTH_EAST.lat, NORTH_EAST.lng));

    const map = L.map(mapContainerRef.current, {
      maxBounds: rioBounds,
      maxBoundsViscosity: 1.0,
      maxZoom: MAP_CONFIG.ZOOM.MAX,
      minZoom: MAP_CONFIG.ZOOM.MIN,
      bounceAtZoomLimits: false,
      // Off so a double-tap on a stop expands it instead of zooming (RF-006.4.8).
      doubleClickZoom: false,
      // Vectors (grouping dots, radius circle, suggestion line) render on ONE
      // canvas instead of N SVG nodes — cheaper per frame on mobile pinch/pan
      // (TASK-REF-015a). divIcons are unaffected (they are DOM, not paths).
      preferCanvas: true,
    });

    // Tile Layer (Map skin)
    L.tileLayer("https://1-teste-prototipo.thiagorod-dev.workers.dev/tiles/{z}/{x}/{y}.png", {
      maxZoom: MAP_CONFIG.ZOOM.MAX,
      minZoom: MAP_CONFIG.ZOOM.MIN,
      tileSize: MAP_CONFIG.TILE_SIZE,
      updateWhenIdle: true,
      keepBuffer: MAP_CONFIG.KEEP_BUFFER,
    }).addTo(map);

    const layerGroup = L.layerGroup().addTo(map);
    const overlayGroup = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    markersLayerRef.current = layerGroup;
    overlayLayerRef.current = overlayGroup;

    return () => {
      clearTimeout(tapTimerRef.current); // drop any pending single-tap (RF-006.4.8)
      map.remove();
      mapInstanceRef.current = null;
      overlayLayerRef.current = null;
    };
  }, []);

  // 2) DEV WARNINGS + initial sizing — on data change only.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (import.meta.env.DEV) {
      // No PII: counts and distances only.
      stops.forEach((stop) => {
        if (stop.maxDispersionMeters > STOP_DISPERSION_WARN_M) {
          console.info(`RouteMap: Stop disperso (${stop.addresses.length} endereços, máx ${Math.round(stop.maxDispersionMeters)}m do representante).`);
        }
      });
      const plottedRows = stops.reduce((sum, stop) => sum + stop.addresses.reduce((acc, addr) => acc + addr.rows.length, 0), 0);
      const discarded = rows.length - plottedRows;
      if (discarded > 0) {
        console.warn(`RouteMap: ${discarded} de ${rows.length} pontos sem coordenada válida (omitidos do mapa).`);
      }
    }

    const resizeTimeout = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(resizeTimeout);
  }, [stops, rows]);

  // 2b) FOCUS — how CLOSE depends on WHAT is focused (RF-006.4.20): an address or
  //     an ungrouped stop goes to ZOOM.MAX; a grouped stop stops at FOCUS_MAX_ZOOM
  //     so its neighbours stay in frame; nothing focused → whole route at DEFAULT.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (isExternal) {
      // Meu roteiro: the caller passes both the frame and its zoom (`focusBounds`
      // + `focusMaxZoom`); otherwise frame all models. The start joins the
      // whole-route frame (GPS may land outside); the suggestion line does NOT
      // (re-pointing must not refit). Models come from the ref: this reacts to
      // boundsSignature only, so a draft candidate toggle never refits.
      const focus = focusBoundsRef.current;
      if (focus && focus.length > 0) {
        const bounds = L.latLngBounds(focus.map((p) => L.latLng(p.lat, p.lng)));
        map.fitBounds(bounds, { paddingTopLeft: [40, 40], paddingBottomRight: [40, 40 + bottomObstructionPx], maxZoom: focusMaxZoom });
        return;
      }
      const coords = renderModelsRef.current.map((model) => L.latLng(model.lat, model.lng));
      if (startLat !== undefined && startLng !== undefined) coords.push(L.latLng(startLat, startLng));
      if (coords.length === 0) return;
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { paddingTopLeft: [50, 50], paddingBottomRight: [50, 50 + bottomObstructionPx], maxZoom: MAP_CONFIG.ZOOM.DEFAULT });
      return;
    }

    if (stops.length === 0) return;

    const expanded = expandedStopKey !== null ? stops[Number(expandedStopKey)] : undefined;
    /** Focused-but-collapsed stop (RF-006.4.10): center CLOSE on it, keep it
        grouped — but NOT as close as expanding (RF-006.4.20: the ungrouped
        addresses want ZOOM.MAX; a grouped stop wants its neighbours in frame). */
    const focusedKey = expandedStopKey === null && selectedAddressKey !== null ? selectedAddressKey.split(":")[0] : null;
    const focused = focusedKey !== null ? stops[Number(focusedKey)] : undefined;
    if (expanded) {
      const bounds = L.latLngBounds(expanded.addresses.map((addr) => L.latLng(addr.lat, addr.lng)));
      map.fitBounds(bounds, { paddingTopLeft: [40, 40], paddingBottomRight: [40, 40 + bottomObstructionPx], maxZoom: MAP_CONFIG.ZOOM.MAX });
    } else if (focused) {
      const bounds = L.latLngBounds(focused.addresses.map((addr) => L.latLng(addr.lat, addr.lng)));
      map.fitBounds(bounds, { paddingTopLeft: [40, 40], paddingBottomRight: [40, 40 + bottomObstructionPx], maxZoom: FOCUS_MAX_ZOOM });
    } else {
      const bounds = L.latLngBounds(stops.map((stop) => L.latLng(stop.representative.lat, stop.representative.lng)));
      map.fitBounds(bounds, { paddingTopLeft: [50, 50], paddingBottomRight: [50, 50 + bottomObstructionPx], maxZoom: MAP_CONFIG.ZOOM.DEFAULT });
    }
    // `focusMaxZoom` IS a dependency: ungrouping a stop keeps the SAME
    // focusBounds (its addresses) and only changes how close to zoom — without
    // it the second click would never refit (RF-006.4.20).
  }, [stops, expandedStopKey, selectedAddressKey, bottomObstructionPx, isExternal, boundsSignature, startLat, startLng, focusMaxZoom]);

  // 3) MARKERS RENDERING — redraws when the data OR the interaction state changes.
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    // Grouping cue (RF-020.3 iteration): small dots exactly where each address's cone
    // tip touches the map. Drawn first so they sit under the markers.
    if (expandedStopKey !== null) {
      const expanded = stops[Number(expandedStopKey)];
      if (expanded && expanded.addresses.length > 1) {
        const dotColor = colorForLocationType(expanded.type).bottom;
        expanded.addresses.forEach((addr) => {
          L.circleMarker([addr.lat, addr.lng], { radius: 3, color: "#ffffff", weight: 1, fillColor: dotColor, fillOpacity: 1 }).addTo(markersLayer);
        });
      }
    }

    // The map already has a view here (fit in the effect above, which runs first), but
    // guard getZoom anyway for the no-data case.
    const safeZoom = (): number => {
      try {
        return map.getZoom();
      } catch {
        return MAP_CONFIG.ZOOM.DEFAULT;
      }
    };

    const entries: { marker: L.Marker; model: MarkerModel; lastScale: number }[] = [];

    // Scale: committed roteiro stops grow (they aggregate addresses — RF-006.4.2);
    // the STRONGLY-selected marker (`highlight`) is enlarged so it stands out over
    // clusters (RF-006.4.14 — the ring alone vanished among neighbors).
    const scaleFor = (model: MarkerModel): number => {
      const base = scaleForZoom(safeZoom());
      const stopFactor = isExternal && model.kind !== "address" ? EXTERNAL_STOP_SCALE_FACTOR : 1;
      return model.iconProps.highlight ? base * stopFactor * SELECTED_SCALE_FACTOR : base * stopFactor;
    };

    // Stacking: the highlighted marker rises above everything (Z_SELECTED — the
    // panel's stop / selected address must never hide behind neighbors, RF-006.4.14);
    // committed roteiro stops sit above the free circles (external mode).
    const zIndexFor = (model: MarkerModel): number => {
      if (model.iconProps.highlight) return Z_SELECTED;
      if (model.kind !== "address") return isExternal ? Z_EXTERNAL_STOP : 0;
      return Z_GROUP;
    };

    renderModels.forEach((model) => {
      const creationScale = scaleFor(model);
      const marker = L.marker([model.lat, model.lng], {
        icon: createMarkerDivIcon({ ...model.iconProps, scale: creationScale }),
        zIndexOffset: zIndexFor(model),
      });

      if (model.tooltipHtml) marker.bindTooltip(model.tooltipHtml, { direction: "top", offset: [0, TOOLTIP_OFFSET_Y] });

      if (!isExternal) {
        // Original (RF-006.4.10): single click FOCUSES the stop (stays grouped),
        // double click EXPANDS it into addresses. Deferred like the roteiro so
        // the double-click's first tap doesn't recreate the markers mid-gesture.
        marker.on("click", () => {
          clearTimeout(tapTimerRef.current);
          tapTimerRef.current = setTimeout(() => applyInteractionRef.current(nextInteraction(interactionRef.current, model, stops)), DOUBLE_TAP_MS);
        });
        marker.on("dblclick", () => {
          clearTimeout(tapTimerRef.current);
          applyInteractionRef.current(model.kind === "stop" ? expandInteraction(model.stopIndex, stops) : nextInteraction(interactionRef.current, model, stops));
        });
      } else if (hasModelTap) {
        // External models (Meu roteiro): single tap selects (deferred so a
        // double-tap can pre-empt it — RF-006.4.8); double tap expands a firmed
        // stop into its addresses. The timer is needed because a tap recreates
        // the markers, which would otherwise swallow the second tap.
        marker.on("click", () => {
          clearTimeout(tapTimerRef.current);
          tapTimerRef.current = setTimeout(() => onModelTapRef.current?.(model), DOUBLE_TAP_MS);
        });
        marker.on("dblclick", () => {
          clearTimeout(tapTimerRef.current);
          onModelExpandRef.current?.(model);
        });
      }

      marker.addTo(markersLayer);
      entries.push({ marker, model, lastScale: creationScale });
    });

    // Address detail is no longer a Leaflet popup: the selected address feeds
    // the AddressSheet rendered below (TASK-RF-022.6, fluxo-modo-original §6).

    // Markers rescale with zoom; rebuilding the icon re-derives the anchor so
    // the tip stays on the point. SKIP when the scale didn't move (REF-015c):
    // a pinch that settles on the SAME zoom level used to rebuild N SVG strings
    // for nothing — the "hiccup" at the end of the gesture.
    const applyScaleForZoom = () => {
      entries.forEach((entry) => {
        const nextScale = scaleFor(entry.model);
        if (nextScale === entry.lastScale) return;
        entry.lastScale = nextScale;
        entry.marker.setIcon(createMarkerDivIcon({ ...entry.model.iconProps, scale: nextScale }));
      });
    };
    map.on("zoomend", applyScaleForZoom);

    return () => {
      map.off("zoomend", applyScaleForZoom);
    };
  }, [renderModels, stops, expandedStopKey, selectedAddressKey, isExternal, hasModelTap]);

  // 4) CLICK OUTSIDE (empty map) → collapse and clear selection; the roteiro
  //    mode also receives the tapped coordinate (set-start-by-tap — RF-006.3).
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const onMapClick = (e?: L.LeafletMouseEvent) => {
      // REGROUP but keep the focus (RF-006.4.10): the panel/selection never empties.
      applyInteractionRef.current(regroupInteraction(interactionRef.current));
      // Defensive: unit tests invoke the handler without an event.
      if (e?.latlng) onMapTapRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    };
    map.on("click", onMapClick);
    return () => {
      map.off("click", onMapClick);
    };
  }, []);

  // 5) ROTEIRO OVERLAY — start marker, dashed suggestion line, the draft's
  //    radius circle and its provisional anchor, on their own layer (the
  //    markers layer is cleared on every model redraw).
  useEffect(() => {
    const map = mapInstanceRef.current;
    const overlayLayer = overlayLayerRef.current;
    if (!map || !overlayLayer) return;

    overlayLayer.clearLayers();

    const safeZoom = (): number => {
      try {
        return map.getZoom();
      } catch {
        return MAP_CONFIG.ZOOM.DEFAULT;
      }
    };

    /** Start (blue car) and vehicle/anchor (slate car) each keep their OWN icon
        props so the zoom rescale rebuilds the right icon — including the anchor
        mode (otherwise the car would "walk" on zoom). */
    const overlayMarkers: { marker: L.Marker; iconProps: Parameters<typeof createMarkerDivIcon>[0]; lastScale: number }[] = [];
    const addOverlayMarker = (lat: number, lng: number, iconProps: Parameters<typeof createMarkerDivIcon>[0], zIndexOffset: number, options?: { draggable?: boolean }): L.Marker => {
      const creationScale = scaleForZoom(safeZoom());
      const marker = L.marker([lat, lng], {
        icon: createMarkerDivIcon({ ...iconProps, scale: creationScale }),
        zIndexOffset,
        ...options,
      });
      marker.addTo(overlayLayer);
      overlayMarkers.push({ marker, iconProps, lastScale: creationScale });
      return marker;
    };
    // The start is the route's one fixed landmark: it rises above stops and
    // addresses and loses ONLY to the selected marker (Z_START — feedback 10/07).
    // The anchor keeps parking below (it belongs to its stop's addresses).
    if (startLat !== undefined && startLng !== undefined) {
      const startMarker = addOverlayMarker(startLat, startLng, START_ICON_PROPS, Z_START);
      // Selectable start (RF-006.11): the tap shows "parada 0" + redefine in the
      // panel. Through the latest-callback ref — this effect must not re-run
      // (and redraw the overlay) whenever the handler identity changes.
      startMarker.on("click", () => onStartTapRef.current?.());
    }
    if (anchorLat !== undefined && anchorLng !== undefined) {
      // The car shows for the draft OR an expanded firmed stop (RF-006.16), but
      // it only DRAGS in the draft: Leaflet pauses the map pan during a marker
      // drag by itself — the drag×pan risk the épico flagged. The dropped
      // coordinate goes out RAW; the caller street-projects it.
      const anchorMarker = addOverlayMarker(anchorLat, anchorLng, VEHICLE_ICON_PROPS, anchorDraggable ? Z_ANCHOR_DRAG : Z_VEHICLE, { draggable: anchorDraggable });
      if (anchorDraggable) {
        anchorMarker.on("dragend", () => {
          const position = anchorMarker.getLatLng();
          onAnchorDragEndRef.current?.({ lat: position.lat, lng: position.lng });
        });
      } else {
        // Firmed & ungrouped: the car is SELECTABLE (RF-006.17), so it cycles
        // back into the panel after a member was tapped. Draggable drafts don't
        // wire this (a click is the start of a drag there).
        anchorMarker.on("click", () => onAnchorTapRef.current?.());
      }
    }

    // Dashed radius circle (tela 9, spec §3): real meters, centered on the SEED.
    if (radiusCircle) {
      L.circle([radiusCircle.center.lat, radiusCircle.center.lng], RADIUS_CIRCLE_STYLE(radiusCircle.meters)).addTo(overlayLayer);
    }

    // Route traces (RF-006.7). Canvas (`preferCanvas`) has no zIndexOffset, so
    // ADD ORDER = stacking: vehicle route (bottom) → foot circuit → suggestion (top).
    if (vehicleRoute && vehicleRoute.length >= 2) {
      L.polyline(
        vehicleRoute.map((p) => [p.lat, p.lng] as [number, number]),
        VEHICLE_ROUTE_STYLE
      ).addTo(overlayLayer);
    }
    if (footCircuit && footCircuit.length >= 2) {
      L.polyline(
        footCircuit.map((p) => [p.lat, p.lng] as [number, number]),
        FOOT_CIRCUIT_STYLE
      ).addTo(overlayLayer);
    }
    if (suggestionPath && suggestionPath.length >= 2) {
      L.polyline(
        suggestionPath.map((p) => [p.lat, p.lng] as [number, number]),
        suggestionFaded ? SUGGESTION_LINE_STYLE : SUGGESTION_LINE_STRONG
      ).addTo(overlayLayer);
    }

    if (overlayMarkers.length === 0) return;
    /** Overlay markers scale with zoom like every other marker — with the same
        skip-when-unchanged as the main layer (REF-015c). */
    const rescaleOverlay = () => {
      const nextScale = scaleForZoom(safeZoom());
      overlayMarkers.forEach((entry) => {
        if (nextScale === entry.lastScale) return;
        entry.lastScale = nextScale;
        entry.marker.setIcon(createMarkerDivIcon({ ...entry.iconProps, scale: nextScale }));
      });
    };
    map.on("zoomend", rescaleOverlay);
    return () => {
      map.off("zoomend", rescaleOverlay);
    };
  }, [startLat, startLng, suggestionPath, radiusCircle, anchorLat, anchorLng, anchorDraggable, vehicleRoute, footCircuit, suggestionFaded]);

  // Fills the parent (focus screen layout); leaving the screen is the shell's
  // header back arrow / the page's Escape handler (TASK-RF-023.5).
  return (
    <div className="relative h-full w-full bg-background" role="region" aria-label={UI_LABELS.ROUTE_MAP.FULLSCREEN_ARIA}>
      <div ref={mapContainerRef} data-testid="map-container" className="absolute inset-0 w-full h-full" />
    </div>
  );
};
