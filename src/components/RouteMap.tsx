import React, { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Tipos e Constantes
import type { RowData } from "../types";
import type { LatLng } from "../types/routing";
import { MAP_CONFIG, UI_LABELS } from "../constants";

// SVG markers (ADR-008): one marker per stop; click expands a stop into its address
// circles, click an address selects it — the MapPage's persistent panel shows the
// detail (RF-023). The view-model logic is pure (markerModels).
import { createMarkerDivIcon } from "../utils/markers/markerIcon";
import { MARKER_GEOMETRY } from "../utils/markers/markerSvg";
import { groupRowsByStop } from "../utils/markers/stopGrouping";
import { colorForLocationType, ROTEIRO_MARKER_COLORS } from "../utils/markers/markerColors";
import { scaleForZoom, MARKER_MAX_SCALE } from "../utils/markers/markerScale";
import { computeMarkerModels, nextInteraction, collapseInteraction, type MarkerModel, type InteractionState } from "../utils/markers/markerModels";

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

// The suggestion line's FADED state (fluxo §3/§6: "desbotada no rascunho"; the
// "stronger after committing" state arrives with the stop slices, RF-006.4+).
const SUGGESTION_LINE_STYLE = { dashArray: "6 8", weight: 3, color: "#6B7280", opacity: 0.55 } as const;

/** The route start's icon (spec §3: "início = marcador verde próprio", destacado). */
const START_ICON_PROPS = { shape: "circle", color: ROTEIRO_MARKER_COLORS.start, number: null, badge: null, selected: true } as const;

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
  /** Tap on the empty map, with its coordinate (Meu roteiro: set-start-by-tap — TASK-RF-006.3). */
  onMapTap?: (latlng: LatLng) => void;
  /** Tap on an EXTERNAL model's marker (Meu roteiro: confirm-start / re-point suggestion). */
  onModelTap?: (model: MarkerModel) => void;
  /** Start marker + dashed suggestion line, drawn on their OWN layer (TASK-RF-006.3). */
  roteiroOverlay?: { start: LatLng | null; suggestionPath: LatLng[] | null };
}

export const RouteMap: React.FC<Props> = ({ rows, interaction, onInteractionChange, bottomObstructionPx = 0, models, onMapTap, onModelTap, roteiroOverlay }) => {
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
  useEffect(() => {
    applyInteractionRef.current = onInteractionChange;
    onMapTapRef.current = onMapTap;
    onModelTapRef.current = onModelTap;
  });

  const stops = useMemo(() => groupRowsByStop(rows), [rows]);
  const internalModels = useMemo(() => computeMarkerModels(stops, expandedStopKey, selectedAddressKey), [stops, expandedStopKey, selectedAddressKey]);
  /** External models (Meu roteiro) win; otherwise the Original-mode computation. */
  const isExternal = models !== undefined;
  const renderModels = models ?? internalModels;
  const hasModelTap = onModelTap !== undefined;
  /** Primitive deps: effects must react to the start MOVING, not to object identity. */
  const startLat = roteiroOverlay?.start?.lat;
  const startLng = roteiroOverlay?.start?.lng;
  const suggestionPath = roteiroOverlay?.suggestionPath ?? null;

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
    });

    // Tile Layer (Map skin)
    L.tileLayer("https://tile-proxy.thiagorod-dev.workers.dev/tiles/{z}/{x}/{y}.png", {
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

  // 2b) FOCUS — external models (Meu roteiro): frame them all; Original: fit the
  //     expanded stop's addresses at MAX zoom (closest focus) or the whole route.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (isExternal) {
      // The start joins the frame (GPS may land outside the points' envelope);
      // the suggestion line deliberately does NOT — re-pointing must not refit.
      const coords = renderModels.map((model) => L.latLng(model.lat, model.lng));
      if (startLat !== undefined && startLng !== undefined) coords.push(L.latLng(startLat, startLng));
      if (coords.length === 0) return;
      const bounds = L.latLngBounds(coords);
      map.fitBounds(bounds, { paddingTopLeft: [50, 50], paddingBottomRight: [50, 50 + bottomObstructionPx], maxZoom: MAP_CONFIG.ZOOM.DEFAULT });
      return;
    }

    if (stops.length === 0) return;

    const expanded = expandedStopKey !== null ? stops[Number(expandedStopKey)] : undefined;
    if (expanded) {
      const bounds = L.latLngBounds(expanded.addresses.map((addr) => L.latLng(addr.lat, addr.lng)));
      map.fitBounds(bounds, { paddingTopLeft: [40, 40], paddingBottomRight: [40, 40 + bottomObstructionPx], maxZoom: MAP_CONFIG.ZOOM.MAX });
    } else {
      const bounds = L.latLngBounds(stops.map((stop) => L.latLng(stop.representative.lat, stop.representative.lng)));
      map.fitBounds(bounds, { paddingTopLeft: [50, 50], paddingBottomRight: [50, 50 + bottomObstructionPx], maxZoom: MAP_CONFIG.ZOOM.DEFAULT });
    }
  }, [stops, expandedStopKey, bottomObstructionPx, isExternal, renderModels, startLat, startLng]);

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

    const entries: { marker: L.Marker; model: MarkerModel }[] = [];

    // Squares and address circles share the zoom-based scale (same proportion); the
    // selected address is always enlarged for emphasis (alone or within a group).
    const scaleFor = (model: MarkerModel): number => {
      const base = scaleForZoom(safeZoom());
      if (model.kind !== "address") return base;
      return model.addressKey === selectedAddressKey ? base * SELECTED_SCALE_FACTOR : base;
    };

    // Stacking: addresses of the focused stop rise above other stops; the selected
    // address rises above its neighbors.
    const zIndexFor = (model: MarkerModel): number => {
      if (model.kind !== "address") return 0;
      return model.addressKey === selectedAddressKey ? Z_SELECTED : Z_GROUP;
    };

    renderModels.forEach((model) => {
      const marker = L.marker([model.lat, model.lng], {
        icon: createMarkerDivIcon({ ...model.iconProps, scale: scaleFor(model) }),
        zIndexOffset: zIndexFor(model),
      });

      if (model.tooltipHtml) marker.bindTooltip(model.tooltipHtml, { direction: "top", offset: [0, TOOLTIP_OFFSET_Y] });

      if (!isExternal) {
        marker.on("click", () => {
          applyInteractionRef.current(nextInteraction({ expandedStopKey, selectedAddressKey }, model, stops));
        });
      } else if (hasModelTap) {
        // External models (Meu roteiro): the tap goes to the builder screen —
        // confirm-start / re-point suggestion (TASK-RF-006.3).
        marker.on("click", () => {
          onModelTapRef.current?.(model);
        });
      }

      marker.addTo(markersLayer);
      entries.push({ marker, model });
    });

    // Address detail is no longer a Leaflet popup: the selected address feeds
    // the AddressSheet rendered below (TASK-RF-022.6, fluxo-modo-original §6).

    // Squares grow with zoom; address circles keep their fixed scale. Rebuilding the
    // icon re-derives the anchor so the tip stays on the point.
    const applyScaleForZoom = () => {
      entries.forEach(({ marker, model }) => marker.setIcon(createMarkerDivIcon({ ...model.iconProps, scale: scaleFor(model) })));
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
      applyInteractionRef.current(collapseInteraction());
      // Defensive: unit tests invoke the handler without an event.
      if (e?.latlng) onMapTapRef.current?.({ lat: e.latlng.lat, lng: e.latlng.lng });
    };
    map.on("click", onMapClick);
    return () => {
      map.off("click", onMapClick);
    };
  }, []);

  // 5) ROTEIRO OVERLAY — start marker + dashed suggestion line, on their own
  //    layer (the markers layer is cleared on every model redraw).
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

    let startMarker: L.Marker | null = null;
    if (startLat !== undefined && startLng !== undefined) {
      startMarker = L.marker([startLat, startLng], {
        icon: createMarkerDivIcon({ ...START_ICON_PROPS, scale: scaleForZoom(safeZoom()) }),
        zIndexOffset: Z_SELECTED,
      });
      startMarker.addTo(overlayLayer);
    }

    if (suggestionPath && suggestionPath.length >= 2) {
      L.polyline(
        suggestionPath.map((p) => [p.lat, p.lng] as [number, number]),
        SUGGESTION_LINE_STYLE
      ).addTo(overlayLayer);
    }

    if (!startMarker) return;
    /** The start scales with zoom like every other marker. */
    const rescaleStart = () => {
      startMarker?.setIcon(createMarkerDivIcon({ ...START_ICON_PROPS, scale: scaleForZoom(safeZoom()) }));
    };
    map.on("zoomend", rescaleStart);
    return () => {
      map.off("zoomend", rescaleStart);
    };
  }, [startLat, startLng, suggestionPath]);

  // Fills the parent (focus screen layout); leaving the screen is the shell's
  // header back arrow / the page's Escape handler (TASK-RF-023.5).
  return (
    <div className="relative h-full w-full bg-background" role="region" aria-label={UI_LABELS.ROUTE_MAP.FULLSCREEN_ARIA}>
      <div ref={mapContainerRef} data-testid="map-container" className="absolute inset-0 w-full h-full" />
    </div>
  );
};
