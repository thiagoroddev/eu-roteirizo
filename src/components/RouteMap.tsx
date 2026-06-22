import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Tipos e Constantes
import type { RowData } from "../types";
import { MAP_CONFIG, COLUMN_NAMES, UI_LABELS } from "../constants"; // <--- Importante: Constantes

// Utils de Lógica de Negócio
import { getCommercialDisplayStatus, resolveLocationType } from "../utils/inferLocationType";
import { getCorreiosDeliveryStatus } from "../utils/correiosDelivery";
import { pickIconKey } from "../utils/iconPicker";
import { formatDeliveryLabel } from "../utils/formatters";

// Utils de Mapa e Ícones
import { getScaleFactorFromWidth } from "../utils/map";
import { getIcons } from "../utils/mapIcons";

/* ============================================================================
   GLOBAL CONFIGURATION (OUTSIDE COMPONENT)
   Creates icons only once to improve performance.
============================================================================ */

// 1. Calculate Scale Factor based on config
const ICON_SCALE_FACTOR = getScaleFactorFromWidth(MAP_CONFIG.MARKER.TARGET_WIDTH_PX);

// 2. Generate Icon Registry (memoized by scale)
const ICONS = getIcons(ICON_SCALE_FACTOR);

// 3. Helper for coordinate parsing
const parseCoordinate = (value: unknown): number | undefined => {
  if (!value) return undefined;
  const cleanStr = String(value).replace(/\./g, "");
  const num = parseFloat(cleanStr);
  // Dividindo por 10M para ajustar formato lat/long sem ponto (ex: -229000000 -> -22.9)
  return isNaN(num) ? undefined : num / 10000000;
};

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

    const latlngs: L.LatLng[] = [];

    rows.forEach((row) => {
      // Usando COLUMN_NAMES para segurança contra erros de digitação
      const latVal = row[COLUMN_NAMES.LATITUDE];
      const lngVal = row[COLUMN_NAMES.LONGITUDE];

      const lat = parseCoordinate(latVal);
      const lng = parseCoordinate(lngVal);

      if (lat !== undefined && lng !== undefined) {
        const position = L.latLng(lat, lng);
        latlngs.push(position);

        // --- BUSINESS LOGIC ---

        // 1. Resolve Location Type (Residencial/Comercial)
        const finalType = resolveLocationType(row);

        // 2. Get Original Type (for correction detection)
        const originalType = String(row[COLUMN_NAMES.LOCATION_TYPE] || "")
          .trim()
          .toUpperCase();

        // 3. Get Correios Status (internal key)
        const zip = row[COLUMN_NAMES.ZIPCODE];
        const correiosStatus = getCorreiosDeliveryStatus(zip);

        // 4. Pick the correct Icon Key
        const iconKey = pickIconKey(finalType, originalType, correiosStatus);

        // 5. Select the Icon Asset
        // Fallback to INDEFINITE if key is missing (safety)
        const iconToUse = ICONS[iconKey] || ICONS.INDEFINITE;

        const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;

        // --- TOOLTIP CONSTRUCTION ---
        // Usando UI_LABELS.COMMON.NO_DATA para padronizar "Sem dados"
        const noData = UI_LABELS.COMMON.NO_DATA;
        // Map internal Correios key to UI label (Portuguese)
        const correiosLabel = formatDeliveryLabel(correiosStatus);

        const tooltipContent = `
          <div style="font-family: sans-serif; font-size: 13px;">
            <strong>Sequência:</strong> ${row[COLUMN_NAMES.SEQUENCE] || noData} | <strong>Parada:</strong> ${row[COLUMN_NAMES.STOP] || noData}<br/>
            <strong>Endereço:</strong> ${row[COLUMN_NAMES.DESTINATION_ADDRESS] || noData}<br/>
            <strong>Bairro:</strong> ${row[COLUMN_NAMES.NEIGHBORHOOD] || noData}<br/>
            <strong>CEP:</strong> ${zip || noData}<br/>
            <strong>Horário comercial?</strong> ${getCommercialDisplayStatus(row)}<br/>
            <strong>Correios entrega aqui?</strong> ${correiosLabel}
          </div>
        `;

        const marker = L.marker(position, { icon: iconToUse }).bindTooltip(tooltipContent, {
          direction: "top",
          offset: [0, -40 * ICON_SCALE_FACTOR], // Dynamic offset based on scale
        });

        marker.on("click", () => {
          window.open(googleMapsUrl, "_blank");
        });

        marker.addTo(markersLayer);
      }
    });

    // Auto-zoom logic
    if (latlngs.length > 0) {
      map.fitBounds(L.latLngBounds(latlngs), {
        padding: [50, 50],
        maxZoom: MAP_CONFIG.ZOOM.DEFAULT,
      });
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 100);
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
    <div className="fixed inset-0 bg-white z-[2000]" aria-label="Mapa em tela cheia" role="dialog">
      <div ref={mapContainerRef} data-testid="map-container" className="absolute inset-0 w-full h-full" />

      <button onClick={onClose} className="fixed top-4 right-4 z-[3000] px-3 py-2 rounded bg-primary/70 text-white shadow-lg flex items-center gap-2 border-0 hover:bg-primary" type="button">
        <span aria-hidden>×</span>
        Fechar Mapa
      </button>
    </div>,
    document.body
  );
};
