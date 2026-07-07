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
import { COLUMN_NAMES, UI_LABELS } from "../../constants";
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

  it("marker click EMITS the transition (stop click → first address selected) without mutating on its own", () => {
    const onChange = vi.fn();
    renderRouteMap(mockRowsWithCoordinates, { onInteractionChange: onChange });

    clickFirstMarker();

    // Single-address stop auto-selects its first address — the PARENT decides what to do.
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

    // Expanded-stop framing uses the tighter padding and MAX zoom.
    expect(mapMethods.fitBounds).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ paddingTopLeft: [40, 40], maxZoom: 19 }));
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
