/**
 * Integration tests: MapPage + REAL RouteMap (TASK-RF-023.5).
 *
 * MapPage.test.tsx stubs the RouteMap to drive the controlled-interaction
 * contract; here the real component runs so the page↔map WIRING is exercised:
 * marker click → panel expansion, fitBounds padding for the collapsed panel,
 * and the Escape ownership (the page's staged handler, not RouteMap's legacy
 * one). Leaflet itself is mocked (jsdom has no canvas) exactly like in
 * RouteMap.test.tsx — clicks are simulated through the captured marker
 * handlers; vaul is mocked as in MapPage.test.tsx (no gesture in jsdom).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { UI_LABELS, COLUMN_NAMES } from "../../constants";
import type { RowData } from "../../types";

// --- Leaflet mock (same shape as RouteMap.test.tsx) -------------------------

const mapMethods = {
  remove: vi.fn(),
  fitBounds: vi.fn(),
  invalidateSize: vi.fn(),
  addLayer: vi.fn(),
  getZoom: vi.fn(() => 16),
  on: vi.fn(),
  off: vi.fn(),
};
const layerGroupMethods = { addTo: vi.fn().mockReturnThis(), clearLayers: vi.fn() };
const markerMethods = {
  addTo: vi.fn().mockReturnThis(),
  bindTooltip: vi.fn().mockReturnThis(),
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
vi.mock("leaflet/dist/leaflet.css", () => ({}));
vi.mock("../../utils/markers/markerIcon.css", () => ({}));

// --- vaul mock (same shape as MapPage.test.tsx) ------------------------------

vi.mock("vaul", () => ({
  Drawer: {
    Root: ({ children, activeSnapPoint }: { children?: ReactNode; activeSnapPoint?: number | string | null }) => (
      <div data-testid="vaul-root" data-active-snap={String(activeSnapPoint)}>
        {children}
      </div>
    ),
    Portal: ({ children }: { children?: ReactNode }) => <>{children}</>,
    Overlay: () => null,
    Content: ({ children }: { children?: ReactNode }) => <div data-testid="vaul-content">{children}</div>,
    Title: ({ children }: { children?: ReactNode }) => <h2>{children}</h2>,
    Handle: () => null,
  },
}));

// --- Uploader mock ------------------------------------------------------------

const rows: RowData[] = [
  {
    [COLUMN_NAMES.SEQUENCE]: 1,
    [COLUMN_NAMES.STOP]: 1,
    [COLUMN_NAMES.LATITUDE]: -22.9,
    [COLUMN_NAMES.LONGITUDE]: -43.2,
    [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Integração, 1",
    [COLUMN_NAMES.SPX_TN]: "BR-INT-1",
  },
];

const uploaderState = {
  routes: { "A-1": rows } as Record<string, RowData[]> | null,
  loading: false,
  error: null as string | null,
  manifestSave: null,
  availableCols: [COLUMN_NAMES.LATITUDE, COLUMN_NAMES.LONGITUDE] as string[] | null,
  missingCols: [] as string[],
  isSingleRoute: false,
  handleFileUpload: vi.fn(),
  loadManifest: vi.fn().mockResolvedValue(true),
};
vi.mock("../../hooks/useRouteUploader", () => ({ useRouteUploader: () => uploaderState }));

import MapPage from "../../pages/MapPage";
import { PANEL_COLLAPSED_PX } from "../../components/map/panel/MapPanel";

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={["/rotas", "/mapa?romaneio=hash-1&rota=A-1"]} initialIndex={1}>
      <Routes>
        <Route path="/mapa" element={<MapPage />} />
        <Route path="/rotas" element={<div data-testid="rotas-page-stub" />} />
      </Routes>
    </MemoryRouter>
  );

/** Fires the LAST captured Leaflet marker 'click' handler (= the marker drawn last). */
const clickLastMarker = () => {
  const clicks = markerMethods.on.mock.calls.filter(([event]) => event === "click");
  expect(clicks.length).toBeGreaterThan(0);
  act(() => {
    (clicks[clicks.length - 1][1] as () => void)();
  });
};

/** The selected-address card of the default view (unique — TWO-VIEWS design, .7). */
const addressCard = (name: RegExp) => screen.getByRole("button", { name });

describe("MapPage + real RouteMap (integration)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uploaderState.loadManifest.mockResolvedValue(true);
  });

  it("renders the real embedded map with the panel on the smallest stop", () => {
    renderPage();

    expect(screen.getByTestId("map-container")).toBeInTheDocument();
    expect(screen.getByText(`${UI_LABELS.MAP_PANEL.STOP_PREFIX} 1`)).toBeInTheDocument();
    // Embedded: no internal close button (the shell's back arrow is the way out).
    expect(screen.queryByRole("button", { name: new RegExp(UI_LABELS.ROUTE_MAP.CLOSE) })).not.toBeInTheDocument();
  });

  it("pads fitBounds at the bottom so the route frames above the collapsed panel", () => {
    renderPage();

    expect(mapMethods.fitBounds).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ paddingBottomRight: [50, 50 + PANEL_COLLAPSED_PX] }));
  });

  it("clicking a real map marker selects the address WITHOUT moving the panel; the card tap opens the detail", () => {
    renderPage();
    expect(screen.getByTestId("vaul-root")).toHaveAttribute("data-active-snap", `${PANEL_COLLAPSED_PX}px`);

    // Stop click auto-selects its first address (rev. 07/07) — panel untouched.
    clickLastMarker();
    expect(screen.getByTestId("vaul-root")).toHaveAttribute("data-active-snap", `${PANEL_COLLAPSED_PX}px`);
    expect(addressCard(/Rua Integração, 1/)).toHaveAttribute("aria-expanded", "false");
    // Expanded stop refit uses the tighter padding, still clearing the panel.
    expect(mapMethods.fitBounds).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ paddingBottomRight: [40, 40 + PANEL_COLLAPSED_PX] }));

    // Only the PANEL tap raises it and shows the drill-down.
    fireEvent.click(addressCard(/Rua Integração, 1/));
    expect(screen.getByTestId("vaul-root")).toHaveAttribute("data-active-snap", "0.45");
    expect(screen.getByText("BR-INT-1")).toBeInTheDocument();
  });

  it("Escape is owned by the page (staged snaps), not by RouteMap's legacy handler", () => {
    renderPage();
    clickLastMarker();
    fireEvent.click(addressCard(/Rua Integração, 1/)); // half snap, detail open

    // If RouteMap's legacy Escape were active it would clear the selection or
    // leave the screen; instead the page collapses the panel and stays.
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByTestId("vaul-root")).toHaveAttribute("data-active-snap", `${PANEL_COLLAPSED_PX}px`);
    expect(screen.getByTestId("map-container")).toBeInTheDocument();
    expect(addressCard(/Rua Integração, 1/)).toHaveAttribute("aria-expanded", "true");

    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByTestId("rotas-page-stub")).toBeInTheDocument();
  });
});
