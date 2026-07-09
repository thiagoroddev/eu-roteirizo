/**
 * Tests for RouteMap — the CONTROLLED embedded map of the `/mapa` screen
 * (rewritten in TASK-REF-011: the legacy fullscreen modal, its close button,
 * Escape handler and internal AddressSheet were removed; the MapPage owns the
 * interaction state and the panel shows the detail).
 *
 * 📚 Strategy: Leaflet is fully mocked (jsdom has no canvas) — we assert the
 * component calls the right map functions and EMITS the right transitions.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { RouteMap } from "../../components/RouteMap";
import { COLUMN_NAMES, UI_LABELS, MAP_CONFIG } from "../../constants";
import type { RowData } from "../../types";
import type { InteractionState } from "../../utils/markers/markerModels";

// =============================================================================
// 1. CRITICAL: MOCK LEAFLET
// =============================================================================

const mapMethods = {
  remove: vi.fn(),
  fitBounds: vi.fn(),
  invalidateSize: vi.fn(),
  addLayer: vi.fn(),
  getZoom: vi.fn(() => 16),
  on: vi.fn(),
  off: vi.fn(),
};

const layerGroupMethods = {
  addTo: vi.fn().mockReturnThis(),
  clearLayers: vi.fn(),
};

const markerMethods = {
  addTo: vi.fn().mockReturnThis(),
  bindTooltip: vi.fn().mockReturnThis(),
  // No bindPopup/openPopup on purpose: the detail lives in the MapPage panel
  // (TASK-RF-023.4). If RouteMap ever calls them again, TypeError = regression.
  on: vi.fn(),
  setIcon: vi.fn().mockReturnThis(),
};

vi.mock("leaflet", () => ({
  default: {
    map: vi.fn(() => mapMethods),
    tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    layerGroup: vi.fn(() => layerGroupMethods),
    latLng: vi.fn((lat, lng) => ({ lat, lng })),
    latLngBounds: vi.fn(() => ({ contains: vi.fn(() => true) })),
    marker: vi.fn(() => markerMethods),
    Icon: vi.fn(),
    divIcon: vi.fn(() => ({})),
    DivIcon: vi.fn(),
    polyline: vi.fn(() => ({ addTo: vi.fn() })),
    circle: vi.fn(() => ({ addTo: vi.fn() })),
    circleMarker: vi.fn(() => ({ addTo: vi.fn() })),
  },
}));

import L from "leaflet";

vi.mock("../../utils/inferLocationType", () => ({
  resolveLocationType: vi.fn(() => "RESIDENTIAL"),
  getCommercialDisplayStatus: vi.fn(() => "Não"),
}));

vi.mock("leaflet/dist/leaflet.css", () => ({}));
vi.mock("../../utils/markers/markerIcon.css", () => ({}));

// =============================================================================
// 2. FIXTURES & HELPERS
// =============================================================================

const mockRowsWithCoordinates: RowData[] = [
  {
    [COLUMN_NAMES.SEQUENCE]: 1,
    [COLUMN_NAMES.STOP]: 1,
    [COLUMN_NAMES.LATITUDE]: -229000000, // -22.9 (Excel format)
    [COLUMN_NAMES.LONGITUDE]: -431000000, // -43.1 (Excel format)
    [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua A, 123",
    [COLUMN_NAMES.NEIGHBORHOOD]: "Copacabana",
    [COLUMN_NAMES.ZIPCODE]: "22041-001",
    [COLUMN_NAMES.LOCATION_TYPE]: "Residential",
  },
  {
    [COLUMN_NAMES.SEQUENCE]: 2,
    [COLUMN_NAMES.STOP]: 2,
    [COLUMN_NAMES.LATITUDE]: -22.8, // Already float
    [COLUMN_NAMES.LONGITUDE]: -43.2,
    [COLUMN_NAMES.DESTINATION_ADDRESS]: "Av B, 456",
    [COLUMN_NAMES.NEIGHBORHOOD]: "Ipanema",
    [COLUMN_NAMES.ZIPCODE]: "22410-001",
    [COLUMN_NAMES.LOCATION_TYPE]: "Commercial",
  },
];

const mockRowsInvalid: RowData[] = [
  {
    [COLUMN_NAMES.SEQUENCE]: 3,
    [COLUMN_NAMES.DESTINATION_ADDRESS]: "Nowhere",
    [COLUMN_NAMES.LATITUDE]: "invalid",
    [COLUMN_NAMES.LONGITUDE]: null,
  },
];

const collapsed: InteractionState = { expandedStopKey: null, selectedAddressKey: null };

const renderRouteMap = (rows: RowData[] = mockRowsWithCoordinates, props: Partial<React.ComponentProps<typeof RouteMap>> = {}) =>
  render(<RouteMap rows={rows} interaction={collapsed} onInteractionChange={vi.fn()} {...props} />);

/** Invokes the click handler RouteMap registered on the first marker. */
const clickFirstMarker = () => {
  const call = markerMethods.on.mock.calls.find(([event]) => event === "click");
  expect(call).toBeDefined();
  act(() => {
    (call![1] as () => void)();
  });
};

describe("RouteMap (controlled embedded map)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // INITIALIZATION & CONFIGURATION
  // ==========================================================================

  it("renders as a region filling the parent — no dialog, no internal close button", () => {
    renderRouteMap();

    expect(screen.getByRole("region", { name: UI_LABELS.ROUTE_MAP.FULLSCREEN_ARIA })).toBeInTheDocument();
    expect(screen.getByTestId("map-container")).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(L.map).toHaveBeenCalled();
    expect(L.tileLayer).toHaveBeenCalled();
    expect(L.layerGroup).toHaveBeenCalled();
  });

  it("initializes the map with the Rio bounds and zoom limits", () => {
    renderRouteMap();

    expect(L.map).toHaveBeenCalledWith(
      expect.any(Object),
      expect.objectContaining({
        maxBounds: expect.any(Object),
        maxBoundsViscosity: 1.0,
        maxZoom: 19,
        minZoom: 14,
        bounceAtZoomLimits: false,
      })
    );
  });

  it("configures the tile proxy layer with the correct settings", () => {
    renderRouteMap();

    expect(L.tileLayer).toHaveBeenCalledWith(
      "https://tile-proxy.thiagorod-dev.workers.dev/tiles/{z}/{x}/{y}.png",
      expect.objectContaining({ maxZoom: 19, minZoom: 14, tileSize: 256, updateWhenIdle: true, keepBuffer: 2 })
    );
  });

  // ==========================================================================
  // MARKERS & BOUNDS
  // ==========================================================================

  it("creates markers for valid rows and none for invalid coordinates", () => {
    renderRouteMap();
    expect(L.marker).toHaveBeenCalled();

    vi.clearAllMocks();
    renderRouteMap(mockRowsInvalid);
    expect(L.marker).not.toHaveBeenCalled();
  });

  it("fits bounds with the bottom obstruction padding (collapsed panel — RF-023.5)", () => {
    renderRouteMap(mockRowsWithCoordinates, { bottomObstructionPx: 200 });

    expect(mapMethods.fitBounds).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ paddingTopLeft: [50, 50], paddingBottomRight: [50, 250] }));
  });

  it("does NOT fit bounds when no markers are valid", () => {
    renderRouteMap(mockRowsInvalid);
    expect(mapMethods.fitBounds).not.toHaveBeenCalled();
  });

  it("survives malformed and extreme row data without crashing", () => {
    const malformedRows: RowData[] = [
      {},
      { [COLUMN_NAMES.LATITUDE]: null, [COLUMN_NAMES.LONGITUDE]: undefined, [COLUMN_NAMES.DESTINATION_ADDRESS]: "" },
      { [COLUMN_NAMES.LATITUDE]: NaN, [COLUMN_NAMES.LONGITUDE]: Infinity },
      { [COLUMN_NAMES.LATITUDE]: 90000000, [COLUMN_NAMES.LONGITUDE]: 44000000 }, // out of Rio bounds
    ];
    renderRouteMap(malformedRows);

    expect(screen.getByRole("region", { name: UI_LABELS.ROUTE_MAP.FULLSCREEN_ARIA })).toBeInTheDocument();
  });

  it("handles large datasets (100 stops) without crashing", () => {
    const largeDataset: RowData[] = Array.from({ length: 100 }, (_, i) => ({
      [COLUMN_NAMES.SEQUENCE]: i + 1,
      [COLUMN_NAMES.STOP]: i + 1,
      [COLUMN_NAMES.LATITUDE]: -22.9 + i * 0.001,
      [COLUMN_NAMES.LONGITUDE]: -43.1 + i * 0.001,
      [COLUMN_NAMES.DESTINATION_ADDRESS]: `Address ${i}, ${i}`,
    }));
    renderRouteMap(largeDataset);

    expect(screen.getByRole("region", { name: UI_LABELS.ROUTE_MAP.FULLSCREEN_ARIA })).toBeInTheDocument();
  });

  // ==========================================================================
  // CONTROLLED INTERACTION (TASK-RF-023.2 / REF-011)
  // ==========================================================================

  it("single click FOCUSES a stop (grouped) selecting its first address — DEFERRED (RF-006.4.10)", () => {
    const onChange = vi.fn();
    renderRouteMap(mockRowsWithCoordinates, { onInteractionChange: onChange });

    // The single click is deferred so a double-click can pre-empt it.
    vi.useFakeTimers();
    clickFirstMarker();
    act(() => {
      vi.advanceTimersByTime(300);
    });
    vi.useRealTimers();

    // Focus keeps the stop GROUPED (expandedStopKey null); the parent decides the rest.
    expect(onChange).toHaveBeenCalledWith({ expandedStopKey: null, selectedAddressKey: "0:0" });
  });

  it("double click EXPANDS a stop into its addresses (RF-006.4.10)", () => {
    const onChange = vi.fn();
    renderRouteMap(mockRowsWithCoordinates, { onInteractionChange: onChange });

    const dblcall = markerMethods.on.mock.calls.find(([event]) => event === "dblclick");
    expect(dblcall).toBeDefined();
    act(() => {
      (dblcall![1] as () => void)();
    });
    expect(onChange).toHaveBeenCalledWith({ expandedStopKey: "0", selectedAddressKey: "0:0" });
  });

  it("empty-map click emits the collapse transition", () => {
    const onChange = vi.fn();
    renderRouteMap(mockRowsWithCoordinates, { onInteractionChange: onChange });

    const mapClick = mapMethods.on.mock.calls.find(([event]) => event === "click");
    expect(mapClick).toBeDefined();
    act(() => {
      (mapClick![1] as () => void)();
    });

    expect(onChange).toHaveBeenCalledWith({ expandedStopKey: null, selectedAddressKey: null });
  });

  it("refits to the expanded stop when the controlled interaction changes", () => {
    const { rerender } = renderRouteMap();
    vi.clearAllMocks();

    rerender(<RouteMap rows={mockRowsWithCoordinates} interaction={{ expandedStopKey: "0", selectedAddressKey: "0:0" }} onInteractionChange={vi.fn()} />);

    // An EXPANDED stop shows its individual addresses, so it frames them at the
    // map's max zoom (RF-006.4.20). Only a GROUPED focus stops short (see below).
    expect(mapMethods.fitBounds).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ paddingTopLeft: [40, 40], maxZoom: MAP_CONFIG.ZOOM.MAX }));
  });

  // ==========================================================================
  // EXTERNAL MODELS — Meu roteiro mode (TASK-RF-006.2, ADR-009)
  // ==========================================================================

  const externalModels = [
    {
      key: "pt_a",
      kind: "address" as const,
      lat: -22.95,
      lng: -43.15,
      stopIndex: -1,
      iconProps: { shape: "circle" as const, color: { top: "#D9DDE3", bottom: "#B4BAC4", glow: "rgba(0,0,0,.10)" }, number: null, badge: null },
      tooltipHtml: "<div>tooltip-a</div>",
    },
    {
      key: "pt_b",
      kind: "address" as const,
      lat: -22.96,
      lng: -43.16,
      stopIndex: -1,
      iconProps: { shape: "circle" as const, color: { top: "#D9DDE3", bottom: "#B4BAC4", glow: "rgba(0,0,0,.10)" }, number: null, badge: { kind: "packages" as const, count: 2 } },
    },
  ];

  it("draws the EXTERNAL models (not the internal stop grouping) when `models` is provided", () => {
    renderRouteMap(mockRowsWithCoordinates, { models: externalModels });

    // One marker per external model, at the models' positions (not the rows').
    expect(L.marker).toHaveBeenCalledTimes(2);
    expect(L.marker).toHaveBeenCalledWith([-22.95, -43.15], expect.anything());
    expect(L.marker).toHaveBeenCalledWith([-22.96, -43.16], expect.anything());
  });

  it("focusBounds zooms CLOSE to the focused stop at MAX zoom (RF-006.4.11)", () => {
    renderRouteMap(mockRowsWithCoordinates, {
      models: externalModels,
      focusBounds: [
        { lat: -22.95, lng: -43.15 },
        { lat: -22.951, lng: -43.151 },
      ],
    });
    // The last fit targets the focus at FOCUS zoom (close, but not maxed out),
    // not the whole-route DEFAULT (RF-006.4.19).
    expect(mapMethods.fitBounds).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ maxZoom: MAP_CONFIG.ZOOM.MAX - 2 }));
  });

  it("does NOT bind marker click handlers for external models (no-op until RF-006.3/.4)", () => {
    renderRouteMap(mockRowsWithCoordinates, { models: externalModels });

    const markerClicks = markerMethods.on.mock.calls.filter(([event]) => event === "click");
    expect(markerClicks).toHaveLength(0);
  });

  it("fits bounds over the external models with the obstruction padding", () => {
    renderRouteMap(mockRowsWithCoordinates, { models: externalModels, bottomObstructionPx: 224 });

    expect(L.latLng).toHaveBeenCalledWith(-22.95, -43.15);
    expect(mapMethods.fitBounds).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ paddingTopLeft: [50, 50], paddingBottomRight: [50, 274] }));
  });

  it("binds the tooltip of external models when present", () => {
    renderRouteMap(mockRowsWithCoordinates, { models: externalModels });

    expect(markerMethods.bindTooltip).toHaveBeenCalledTimes(1);
    expect(markerMethods.bindTooltip).toHaveBeenCalledWith("<div>tooltip-a</div>", expect.anything());
  });

  it("skips fitBounds for an empty external model list without crashing", () => {
    renderRouteMap(mockRowsWithCoordinates, { models: [] });

    expect(mapMethods.fitBounds).not.toHaveBeenCalled();
    expect(L.marker).not.toHaveBeenCalled();
  });

  // ==========================================================================
  // ROTEIRO INTERACTIONS + OVERLAY (TASK-RF-006.3)
  // ==========================================================================

  it("map click forwards the tapped coordinate to onMapTap (and still collapses)", () => {
    const onMapTap = vi.fn();
    const onChange = vi.fn();
    renderRouteMap(mockRowsWithCoordinates, { models: externalModels, onMapTap, onInteractionChange: onChange });

    const mapClick = mapMethods.on.mock.calls.find(([event]) => event === "click");
    expect(mapClick).toBeDefined();
    act(() => {
      (mapClick![1] as (e?: { latlng: { lat: number; lng: number } }) => void)({ latlng: { lat: -22.94, lng: -43.18 } });
    });

    expect(onMapTap).toHaveBeenCalledWith({ lat: -22.94, lng: -43.18 });
    expect(onChange).toHaveBeenCalledWith({ expandedStopKey: null, selectedAddressKey: null });
  });

  it("binds clicks on EXTERNAL markers only when onModelTap is given", () => {
    renderRouteMap(mockRowsWithCoordinates, { models: externalModels });
    expect(markerMethods.on.mock.calls.filter(([event]) => event === "click")).toHaveLength(0);

    vi.clearAllMocks();
    const onModelTap = vi.fn();
    renderRouteMap(mockRowsWithCoordinates, { models: externalModels, onModelTap });

    const clicks = markerMethods.on.mock.calls.filter(([event]) => event === "click");
    expect(clicks).toHaveLength(2);
    // The single tap is DEFERRED (RF-006.4.8) so a double-tap can pre-empt it.
    vi.useFakeTimers();
    act(() => {
      (clicks[0][1] as () => void)();
      vi.advanceTimersByTime(300);
    });
    vi.useRealTimers();
    expect(onModelTap).toHaveBeenCalledWith(externalModels[0]);
  });

  it("double-tapping an EXTERNAL marker fires onModelExpand immediately (RF-006.4.8)", () => {
    const onModelExpand = vi.fn();
    renderRouteMap(mockRowsWithCoordinates, { models: externalModels, onModelTap: vi.fn(), onModelExpand });

    const dblclicks = markerMethods.on.mock.calls.filter(([event]) => event === "dblclick");
    expect(dblclicks).toHaveLength(2);
    act(() => {
      (dblclicks[0][1] as () => void)();
    });
    expect(onModelExpand).toHaveBeenCalledWith(externalModels[0]);
  });

  it("draws the start marker and the dashed suggestion line on the overlay layer", () => {
    renderRouteMap(mockRowsWithCoordinates, {
      models: externalModels,
      roteiroOverlay: {
        start: { lat: -22.9, lng: -43.2 },
        suggestionPath: [
          { lat: -22.9, lng: -43.2 },
          { lat: -22.95, lng: -43.15 },
        ],
      },
    });

    // Two layer groups now exist: markers + overlay.
    expect(L.layerGroup).toHaveBeenCalledTimes(2);
    expect(L.marker).toHaveBeenCalledWith([-22.9, -43.2], expect.anything());
    expect(L.polyline).toHaveBeenCalledWith(
      [
        [-22.9, -43.2],
        [-22.95, -43.15],
      ],
      expect.objectContaining({ dashArray: "6 8" })
    );
  });

  it("frames the start together with the external models (GPS may sit outside the envelope)", () => {
    renderRouteMap(mockRowsWithCoordinates, { models: externalModels, roteiroOverlay: { start: { lat: -22.7, lng: -43.4 }, suggestionPath: null } });

    expect(L.latLng).toHaveBeenCalledWith(-22.7, -43.4);
    expect(mapMethods.fitBounds).toHaveBeenCalled();
  });

  it("draws nothing extra without an overlay (no polyline)", () => {
    renderRouteMap(mockRowsWithCoordinates, { models: externalModels });
    expect(L.polyline).not.toHaveBeenCalled();
  });

  it("draws the draft's DASHED radius circle in real meters and its anchor with the shared VEHICLE marker (RF-006.4.1)", () => {
    renderRouteMap(mockRowsWithCoordinates, {
      models: externalModels,
      roteiroOverlay: { start: null, suggestionPath: null, radiusCircle: { center: { lat: -22.94, lng: -43.18 }, meters: 40 }, anchor: { lat: -22.941, lng: -43.181 } },
    });

    expect(L.circle).toHaveBeenCalledWith([-22.94, -43.18], expect.objectContaining({ radius: 40, dashArray: "6 8" }));
    // The anchor uses the SAME vehicle icon as the route start (decision 08/07).
    expect(L.marker).toHaveBeenCalledWith([-22.941, -43.181], expect.anything());
  });

  it("does NOT refit when the models change identity with the same keys (candidate toggles)", () => {
    const { rerender } = render(<RouteMap rows={mockRowsWithCoordinates} interaction={collapsed} onInteractionChange={vi.fn()} models={externalModels} />);
    expect(mapMethods.fitBounds).toHaveBeenCalledTimes(1);

    // Same keys, new array/objects (a candidate toggle re-colors markers only).
    const recolored = externalModels.map((model) => ({ ...model, iconProps: { ...model.iconProps, selected: true } }));
    rerender(<RouteMap rows={mockRowsWithCoordinates} interaction={collapsed} onInteractionChange={vi.fn()} models={recolored} />);
    expect(mapMethods.fitBounds).toHaveBeenCalledTimes(1);

    // A stop commits (keys change) → refit is expected.
    rerender(<RouteMap rows={mockRowsWithCoordinates} interaction={collapsed} onInteractionChange={vi.fn()} models={externalModels.slice(0, 1)} />);
    expect(mapMethods.fitBounds).toHaveBeenCalledTimes(2);
  });

  // ==========================================================================
  // CLEANUP
  // ==========================================================================

  it("removes the map instance on unmount", () => {
    const { unmount } = renderRouteMap();
    unmount();

    expect(mapMethods.remove).toHaveBeenCalled();
  });
});
