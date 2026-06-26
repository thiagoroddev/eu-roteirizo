import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Tipos e Constantes
import type { RowData } from "../types";
import { MAP_CONFIG, COLUMN_NAMES, UI_LABELS } from "../constants"; // <--- Importante: Constantes

// Business logic utils
import { getCommercialDisplayStatus } from "../utils/inferLocationType";
import { escapeHtml } from "../utils/escapeHtml";
import { Button } from "./ui/button";

// SVG markers (ADR-008): one divIcon per stop, grouped by Stop, colored by type.
import { createMarkerDivIcon } from "../utils/markers/markerIcon";
import { MARKER_GEOMETRY, type MarkerSvgProps } from "../utils/markers/markerSvg";
import { groupRowsByStop } from "../utils/markers/stopGrouping";
import { colorForLocationType } from "../utils/markers/markerColors";
import { scaleForZoom, MARKER_MAX_SCALE } from "../utils/markers/markerScale";

/* ============================================================================
   GLOBAL CONFIGURATION (OUTSIDE COMPONENT)
============================================================================ */

// Tooltip sits above the body. Computed at full size (the closest-zoom scale); at
// far zoom the marker is smaller, so the tooltip just floats slightly higher.
const TOOLTIP_OFFSET_Y = -(MARKER_GEOMETRY.TIP_Y - MARKER_GEOMETRY.BODY_TOP) * MARKER_MAX_SCALE;

// A stop whose addresses spread beyond this (meters) from the representative gets a
// DEV-only warning — to learn in the field whether a "spread Stop" is rare or bad data.
const STOP_DISPERSION_WARN_M = 100;

/* ============================================================================
   ROUTEMAP COMPONENT
============================================================================ */

/**
 * RouteMap - Fullscreen map component displaying route deliveries
 *
 * Renders a Leaflet map with markers for each delivery point, colored by location type
 * (home, office, commercial). Includes popup with delivery details and close button.
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
}

export const RouteMap: React.FC<Props> = ({ rows, onClose }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

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

  // 2) MARKERS RENDERING (Data Binding)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;

    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    // One marker per Stop (ADR-008): group rows, then draw the representative.
    const stops = groupRowsByStop(rows);
    const latlngs: L.LatLng[] = [];
    const noData = UI_LABELS.COMMON.NO_DATA;
    const tip = UI_LABELS.ROUTE_MAP.TOOLTIP;

    // The map has no view until fitBounds runs below; guard getZoom for that window.
    const safeZoom = (): number => {
      try {
        return map.getZoom();
      } catch {
        return MAP_CONFIG.ZOOM.DEFAULT;
      }
    };

    // Markers keep their base props so the icon can be rebuilt at a new scale on zoom.
    const entries: { marker: L.Marker; iconProps: Omit<MarkerSvgProps, "scale"> }[] = [];

    stops.forEach((stop) => {
      const rep = stop.representative;
      const position = L.latLng(rep.lat, rep.lng);
      latlngs.push(position);

      // Collapsed stop = always a SQUARE (ADR-008, RF-020.5): the circle is reserved
      // for the expanded/selected address state (.3). Color = stop type (commercial
      // wins), number = Stop, badge = addresses (multi) or packages (single address >1).
      const multi = stop.addresses.length > 1;
      const iconProps: Omit<MarkerSvgProps, "scale"> = {
        shape: "square",
        color: colorForLocationType(stop.type),
        number: stop.hasStop ? stop.stop : null,
        badge: multi ? { kind: "addresses", count: stop.addresses.length } : { kind: "packages", count: rep.rows.length },
      };
      const icon = createMarkerDivIcon({ ...iconProps, scale: scaleForZoom(safeZoom()) });

      // Tooltip describes the representative row (the addresses hidden from the map
      // stay in the side list/table). Spreadsheet cells are untrusted → escape all.
      const row = rep.rows[0];
      const zip = row[COLUMN_NAMES.ZIPCODE];
      const googleMapsUrl = `https://www.google.com/maps?q=${rep.lat},${rep.lng}`;
      const tooltipContent = `
        <div style="font-family: sans-serif; font-size: 13px;">
          <strong>${tip.SEQUENCE}</strong> ${escapeHtml(row[COLUMN_NAMES.SEQUENCE] || noData)} | <strong>${tip.STOP}</strong> ${escapeHtml(row[COLUMN_NAMES.STOP] || noData)}<br/>
          <strong>${tip.ADDRESS}</strong> ${escapeHtml(row[COLUMN_NAMES.DESTINATION_ADDRESS] || noData)}<br/>
          <strong>${tip.NEIGHBORHOOD}</strong> ${escapeHtml(row[COLUMN_NAMES.NEIGHBORHOOD] || noData)}<br/>
          <strong>${tip.ZIPCODE}</strong> ${escapeHtml(zip || noData)}<br/>
          <strong>${tip.COMMERCIAL}</strong> ${escapeHtml(getCommercialDisplayStatus(row))}
        </div>
      `;

      const marker = L.marker(position, { icon }).bindTooltip(tooltipContent, {
        direction: "top",
        offset: [0, TOOLTIP_OFFSET_Y],
      });

      marker.on("click", () => {
        window.open(googleMapsUrl, "_blank");
      });

      marker.addTo(markersLayer);
      entries.push({ marker, iconProps });

      // DEV-only, no PII: flag stops whose addresses are dispersed from the representative.
      if (import.meta.env.DEV && stop.maxDispersionMeters > STOP_DISPERSION_WARN_M) {
        console.info(`RouteMap: Stop disperso (${stop.addresses.length} endereços, máx ${Math.round(stop.maxDispersionMeters)}m do representante).`);
      }
    });

    // Rebuild every marker icon at the current zoom's scale (markers grow with zoom,
    // full size only when closest). Anchor re-derives, so the tip stays on the point.
    const applyScaleForZoom = () => {
      const scale = scaleForZoom(safeZoom());
      entries.forEach(({ marker, iconProps }) => marker.setIcon(createMarkerDivIcon({ ...iconProps, scale })));
    };
    map.on("zoomend", applyScaleForZoom);

    // Warn (DEV only, no PII) when rows were dropped for lacking a valid in-range
    // coordinate, so a silent omission from the map is noticeable.
    const plottedRows = stops.reduce((sum, stop) => sum + stop.addresses.reduce((acc, addr) => acc + addr.rows.length, 0), 0);
    const discarded = rows.length - plottedRows;
    if (import.meta.env.DEV && discarded > 0) {
      console.warn(`RouteMap: ${discarded} de ${rows.length} pontos sem coordenada válida (omitidos do mapa).`);
    }

    // Auto-zoom logic, then size markers to the fitted zoom.
    if (latlngs.length > 0) {
      map.fitBounds(L.latLngBounds(latlngs), {
        padding: [50, 50],
        maxZoom: MAP_CONFIG.ZOOM.DEFAULT,
      });
      applyScaleForZoom();
    }

    const resizeTimeout = setTimeout(() => {
      map.invalidateSize();
    }, 100);

    return () => {
      map.off("zoomend", applyScaleForZoom);
      clearTimeout(resizeTimeout);
    };
  }, [rows]);

  // 3) KEYBOARD HANDLER
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 bg-white z-[2000]" aria-label={UI_LABELS.ROUTE_MAP.FULLSCREEN_ARIA} role="dialog">
      <div ref={mapContainerRef} data-testid="map-container" className="absolute inset-0 w-full h-full" />

      <Button onClick={onClose} type="button" className="fixed right-4 top-4 z-[3000] shadow-lg">
        <span aria-hidden>×</span>
        {UI_LABELS.ROUTE_MAP.CLOSE}
      </Button>
    </div>,
    document.body
  );
};
