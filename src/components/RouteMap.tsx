import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Tipos e Constantes
import type { RowData } from "../types";
import { MAP_CONFIG, UI_LABELS } from "../constants";
import { Button } from "./ui/button";

// SVG markers (ADR-008): one marker per stop; click expands a stop into its address
// circles, click an address opens the AddressSheet bottom panel (fluxo-modo-original §6).
// The view-model logic is pure (markerModels).
import { createMarkerDivIcon } from "../utils/markers/markerIcon";
import { MARKER_GEOMETRY } from "../utils/markers/markerSvg";
import { groupRowsByStop } from "../utils/markers/stopGrouping";
import { colorForLocationType } from "../utils/markers/markerColors";
import { scaleForZoom, MARKER_MAX_SCALE } from "../utils/markers/markerScale";
import { computeMarkerModels, nextInteraction, collapseInteraction, findAddressByKey, type MarkerModel } from "../utils/markers/markerModels";
import { AddressSheet } from "./map/AddressSheet";

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

/* ============================================================================
   ROUTEMAP COMPONENT
============================================================================ */

/**
 * RouteMap - Fullscreen map component displaying route deliveries (Original mode).
 *
 * Draws one SVG marker per stop (square). Clicking a stop expands its addresses as
 * circles labeled `stop-sequence`; clicking an address opens the AddressSheet with its packages
 * and details. Clicking the empty map collapses and clears the selection.
 *
 * @param {RowData[]} rows - All deliveries for the selected route
 * @param {() => void} onClose - Callback to close the fullscreen map modal
 * @param {string[] | null} availableCols - Available columns from Excel file
 * @returns {JSX.Element} The rendered RouteMap component
 */
interface Props {
  rows: RowData[];
  onClose: () => void;
  availableCols?: string[] | null;
  /**
   * Embedded mode (TASK-RF-022.5): fills the parent layout instead of a fixed
   * fullscreen overlay, and hides the internal close button — the shell's
   * header back arrow is the way out. Default false keeps the legacy modal
   * behavior (its own close button, since no header back exists there).
   */
  embedded?: boolean;
}

export const RouteMap: React.FC<Props> = ({ rows, onClose, embedded = false }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  // Interaction state (ADR-008 §10): which stop is expanded, which address is selected.
  const [expandedStopKey, setExpandedStopKey] = useState<string | null>(null);
  const [selectedAddressKey, setSelectedAddressKey] = useState<string | null>(null);

  const stops = useMemo(() => groupRowsByStop(rows), [rows]);
  const models = useMemo(() => computeMarkerModels(stops, expandedStopKey, selectedAddressKey), [stops, expandedStopKey, selectedAddressKey]);
  /** Selected address for the bottom sheet (null-safe against stale keys). */
  const selected = useMemo(() => findAddressByKey(stops, selectedAddressKey), [stops, selectedAddressKey]);

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

    mapInstanceRef.current = map;
    markersLayerRef.current = layerGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
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

  // 2b) FOCUS — fit the expanded stop's addresses at MAX zoom (closest focus);
  //     otherwise frame the whole route. Re-runs only on data/expansion change.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || stops.length === 0) return;

    const expanded = expandedStopKey !== null ? stops[Number(expandedStopKey)] : undefined;
    if (expanded) {
      const bounds = L.latLngBounds(expanded.addresses.map((addr) => L.latLng(addr.lat, addr.lng)));
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: MAP_CONFIG.ZOOM.MAX });
    } else {
      const bounds = L.latLngBounds(stops.map((stop) => L.latLng(stop.representative.lat, stop.representative.lng)));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: MAP_CONFIG.ZOOM.DEFAULT });
    }
  }, [stops, expandedStopKey]);

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

    models.forEach((model) => {
      const marker = L.marker([model.lat, model.lng], {
        icon: createMarkerDivIcon({ ...model.iconProps, scale: scaleFor(model) }),
        zIndexOffset: zIndexFor(model),
      });

      if (model.tooltipHtml) marker.bindTooltip(model.tooltipHtml, { direction: "top", offset: [0, TOOLTIP_OFFSET_Y] });

      marker.on("click", () => {
        const next = nextInteraction({ expandedStopKey, selectedAddressKey }, model, stops);
        setExpandedStopKey(next.expandedStopKey);
        setSelectedAddressKey(next.selectedAddressKey);
      });

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
  }, [models, stops, expandedStopKey, selectedAddressKey]);

  // 4) CLICK OUTSIDE (empty map) → collapse and clear selection.
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const onMapClick = () => {
      const collapsed = collapseInteraction();
      setExpandedStopKey(collapsed.expandedStopKey);
      setSelectedAddressKey(collapsed.selectedAddressKey);
    };
    map.on("click", onMapClick);
    return () => {
      map.off("click", onMapClick);
    };
  }, []);

  // 5) KEYBOARD HANDLER — Escape closes the AddressSheet first; with nothing
  // selected it leaves the map (same destination as the close/back button).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (selectedAddressKey !== null) setSelectedAddressKey(null);
      else onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, selectedAddressKey]);

  // Embedded: fill the parent (focus screen, header back = way out). Legacy
  // modal: portal to body as a fixed overlay with its own close button.
  const containerProps = embedded ? ({ className: "relative h-full w-full bg-white", role: "region" } as const) : ({ className: "fixed inset-0 bg-white z-[2000]", role: "dialog" } as const);
  const content = (
    <div {...containerProps} aria-label={UI_LABELS.ROUTE_MAP.FULLSCREEN_ARIA}>
      <div ref={mapContainerRef} data-testid="map-container" className="absolute inset-0 w-full h-full" />

      {/* Shared bottom panel (§6) — sibling of the Leaflet container, so taps
          inside it never reach the map. Closing it keeps the stop expanded. */}
      <AddressSheet address={selected?.address ?? null} stopNumber={selected && selected.stop.hasStop ? selected.stop.stop : null} onClose={() => setSelectedAddressKey(null)} />

      {!embedded && (
        <Button onClick={onClose} type="button" className="fixed right-4 top-4 z-[3000] shadow-lg">
          <span aria-hidden>×</span>
          {UI_LABELS.ROUTE_MAP.CLOSE}
        </Button>
      )}
    </div>
  );

  return embedded ? content : createPortal(content, document.body);
};
