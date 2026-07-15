/**
 * Integration tests: MapPage + REAL RouteMap (TASK-RF-023.5, TASK-TEST-003).
 *
 * MapPage.test.tsx stubs the RouteMap to drive the controlled-interaction
 * contract; here the real component runs so the page↔map WIRING is exercised:
 * marker click → panel expansion, fitBounds padding for the collapsed panel,
 * and the Escape ownership (the page's staged handler, not RouteMap's legacy
 * one).
 *
 * Since TASK-TEST-003 this file is also THE real-zoom contract of the
 * composition: two zoom defects (RF-006.4.19/.4.20) crossed a green suite
 * because MapPage.test only asserts the `focusMaxZoom` PROP against a stub and
 * RouteMap.test only asserts fitBounds options under hand-made props. The
 * suite below drives the real gestures and asserts the `maxZoom` the REAL
 * `fitBounds` receives. It deliberately pins the current knobs (DEFAULT 16 /
 * FOCUS 17 / ADDRESS 18 / MAX 19 — ⚙️ MANUAL KNOB): recalibrating a knob means
 * updating these tests with it.
 *
 * Leaflet itself is mocked (jsdom has no canvas) — `fitBounds` is a vi.fn()
 * spy, `latLngBounds` echoes the points it receives, and every L.marker() call
 * is registered with its latlng + handlers so a SPECIFIC marker can be tapped;
 * vaul is mocked as in MapPage.test.tsx (no gesture in jsdom).
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { UI_LABELS, COLUMN_NAMES, MAP_CONFIG, FOCUS_MAX_ZOOM, ADDRESS_MAX_ZOOM } from "../../constants";
import type { RowData } from "../../types";

// --- Leaflet mock (same shape as RouteMap.test.tsx, markers as a FACTORY) ----

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

/** Every L.marker() call, in creation order: markers are recreated on each
    interaction change, so the LAST entry at a coordinate owns the live handlers. */
type CapturedMarker = { lat: number; lng: number; handlers: Record<string, ((e?: unknown) => void)[]> };
const createdMarkers: CapturedMarker[] = [];

vi.mock("leaflet", () => ({
  default: {
    map: vi.fn(() => mapMethods),
    tileLayer: vi.fn(() => ({ addTo: vi.fn() })),
    layerGroup: vi.fn(() => layerGroupMethods),
    latLng: vi.fn((lat, lng) => ({ lat, lng })),
    // Echoes its points so the test can read WHAT frame reached fitBounds.
    latLngBounds: vi.fn((points: { lat: number; lng: number }[] = []) => ({ contains: vi.fn(() => true), points })),
    marker: vi.fn((latlng: [number, number]) => {
      const handlers: CapturedMarker["handlers"] = {};
      createdMarkers.push({ lat: latlng[0], lng: latlng[1], handlers });
      return {
        addTo: vi.fn().mockReturnThis(),
        bindTooltip: vi.fn().mockReturnThis(),
        setIcon: vi.fn().mockReturnThis(),
        on: vi.fn((event: string, handler: (e?: unknown) => void) => {
          (handlers[event] ??= []).push(handler);
        }),
      };
    }),
    Icon: vi.fn(),
    divIcon: vi.fn(() => ({})),
    DivIcon: vi.fn(),
    polyline: vi.fn(() => ({ addTo: vi.fn() })),
    circle: vi.fn(() => ({ addTo: vi.fn() })),
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

// --- Persistence + road graph mocks (deterministic; same shape as MapPage.test) ---

vi.mock("../../services/routeStorage", () => ({
  getRoteiro: vi.fn(() => Promise.resolve(null)),
  saveRoteiro: vi.fn(() => Promise.resolve({ status: "saved" as const })),
  deleteRoteiro: vi.fn(() => Promise.resolve()),
}));

// Graph absent → straight-line fallbacks (the no-graph contract, RF-006.3).
vi.mock("../../hooks/useRoadGraph", () => ({
  useRoadGraph: () => ({ graph: null, status: "ready" as const, error: null, retry: vi.fn() }),
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

/** Same geometry as MapPage.test's rowsThreePoints: p2 ~17 m from p1 (inside
    the default 30 m radius → absorbed on create), p3 ~556 m away (stays free). */
const rowsThreePoints: RowData[] = [
  { [COLUMN_NAMES.SEQUENCE]: 1, [COLUMN_NAMES.STOP]: 1, [COLUMN_NAMES.LATITUDE]: -22.9, [COLUMN_NAMES.LONGITUDE]: -43.2, [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Mapa, 10" },
  { [COLUMN_NAMES.SEQUENCE]: 2, [COLUMN_NAMES.STOP]: 1, [COLUMN_NAMES.LATITUDE]: -22.90015, [COLUMN_NAMES.LONGITUDE]: -43.2, [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Beta, 20" },
  { [COLUMN_NAMES.SEQUENCE]: 3, [COLUMN_NAMES.STOP]: 2, [COLUMN_NAMES.LATITUDE]: -22.905, [COLUMN_NAMES.LONGITUDE]: -43.2, [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Gama, 30" },
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

const renderPage = (path = "/mapa?romaneio=hash-1&rota=A-1") =>
  render(
    <MemoryRouter initialEntries={["/rotas", path]} initialIndex={1}>
      <Routes>
        <Route path="/mapa" element={<MapPage />} />
        <Route path="/rotas" element={<div data-testid="rotas-page-stub" />} />
      </Routes>
    </MemoryRouter>
  );

// --- Gesture helpers over the captured Leaflet handlers -----------------------

/** Finds the marker DRAWN LAST at a coordinate that listens to `event` —
    markers are recreated per interaction, so the newest one is the live one. */
const liveMarkerAt = (lat: number, lng: number, event: string) => {
  const marker = [...createdMarkers].reverse().find((m) => m.lat === lat && m.lng === lng && m.handlers[event]?.length);
  expect(marker, `no live marker with '${event}' at ${lat},${lng}`).toBeDefined();
  return marker as CapturedMarker;
};

/** Single tap on a specific marker. The tap is DEFERRED (RF-006.4.10) so a
    double-tap can pre-empt it — advance past the DOUBLE_TAP_MS window. */
const tapMarkerAt = (lat: number, lng: number) => {
  const marker = liveMarkerAt(lat, lng, "click");
  vi.useFakeTimers();
  act(() => {
    marker.handlers.click[0]();
    vi.advanceTimersByTime(300);
  });
  vi.useRealTimers();
};

/** Double tap on a specific marker (immediate — it cancels the deferred tap). */
const dblTapMarkerAt = (lat: number, lng: number) => {
  const marker = liveMarkerAt(lat, lng, "dblclick");
  act(() => {
    marker.handlers.dblclick[0]();
  });
};

/** Fires the LAST captured marker 'click' handler (= the marker drawn last). */
const clickLastMarker = () => {
  const marker = [...createdMarkers].reverse().find((m) => m.handlers.click?.length);
  expect(marker).toBeDefined();
  vi.useFakeTimers();
  act(() => {
    (marker as CapturedMarker).handlers.click[0]();
    vi.advanceTimersByTime(300);
  });
  vi.useRealTimers();
};

/** Tap on the EMPTY map, with a coordinate (the map's own 'click' handler). */
const tapMap = (lat: number, lng: number) => {
  const clicks = mapMethods.on.mock.calls.filter(([event]) => event === "click");
  expect(clicks.length).toBeGreaterThan(0);
  act(() => {
    (clicks[clicks.length - 1][1] as (e: { latlng: { lat: number; lng: number } }) => void)({ latlng: { lat, lng } });
  });
};

/** The LAST real fitBounds call: the frame that reached the map + its options. */
const lastFitBounds = () => {
  const calls = mapMethods.fitBounds.mock.calls;
  expect(calls.length).toBeGreaterThan(0);
  const [bounds, options] = calls[calls.length - 1] as [{ points: { lat: number; lng: number }[] }, { maxZoom?: number; paddingTopLeft?: [number, number]; paddingBottomRight?: [number, number] }];
  return { bounds, options };
};

/** The selected-address card of the default view (unique — TWO-VIEWS design, .7). */
const addressCard = (name: RegExp) => screen.getByRole("button", { name });

const START_LABELS = UI_LABELS.MAP_PANEL.ROTEIRO_START;
const POINT_LABELS = UI_LABELS.MAP_PANEL.ROTEIRO_POINT;
const STOP_LABELS = UI_LABELS.MAP_PANEL.ROTEIRO_STOP;

/** Enters Meu roteiro over the 3-point fixture and defines the start by map tap. */
const enterRoteiro = () => {
  uploaderState.routes = { "A-1": rowsThreePoints };
  renderPage("/mapa?romaneio=hash-1&rota=A-1&modo=roteiro");
  fireEvent.click(screen.getByRole("button", { name: START_LABELS.ARM_MAP_TAP }));
  tapMap(-22.95, -43.19);
  // Settled start (RF-006.11): the definition section leaves the idle header.
  expect(screen.queryByText(START_LABELS.SECTION)).not.toBeInTheDocument();
};

/** Taps p1 (preview) and firms P1 — absorbs p2 by radius; the stop stays selected. */
const createFirstStop = () => {
  tapMarkerAt(-22.9, -43.2);
  fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));
};

describe("MapPage + real RouteMap (integration)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createdMarkers.length = 0;
    uploaderState.routes = { "A-1": rows };
    uploaderState.loadManifest.mockResolvedValue(true);
  });

  it("renders the real embedded map with the panel on the smallest stop", () => {
    renderPage();

    expect(screen.getByTestId("map-container")).toBeInTheDocument();
    expect(screen.getByText(`${UI_LABELS.MAP_PANEL.STOP_PREFIX} 1`)).toBeInTheDocument();
    // No dialog/close button: the map is a region; leaving is the shell's back arrow.
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("pads fitBounds at the bottom so the route frames above the collapsed panel", () => {
    renderPage();

    expect(mapMethods.fitBounds).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ paddingBottomRight: [50, 50 + PANEL_COLLAPSED_PX] }));
  });

  it("clicking a real map marker selects the address WITHOUT moving the panel; the card tap opens the detail", () => {
    renderPage();
    expect(screen.getByTestId("vaul-root")).toHaveAttribute("data-active-snap", `${PANEL_COLLAPSED_PX}px`);

    // Stop click FOCUSES it (grouped — RF-006.4.10), selecting its first address; panel untouched.
    clickLastMarker();
    expect(screen.getByTestId("vaul-root")).toHaveAttribute("data-active-snap", `${PANEL_COLLAPSED_PX}px`);
    expect(addressCard(/Rua Integração, 1/)).toHaveAttribute("aria-expanded", "false");
    // Focus refit centers the stop at DEFAULT padding, still clearing the panel.
    expect(mapMethods.fitBounds).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ paddingBottomRight: [50, 50 + PANEL_COLLAPSED_PX] }));

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

  // ==========================================================================
  // Zoom REAL por contexto (TASK-TEST-003) — o maxZoom que o fitBounds recebe.
  // MapPage.test prova a PROP contra um stub; aqui a precedência de foco da
  // página flui até o efeito de fit do RouteMap real (o buraco das .4.19/.4.20).
  // ==========================================================================

  describe("real focus zoom per context (TASK-TEST-003)", () => {
    it("roteiro: nothing selected → whole route (with the start) at ZOOM.DEFAULT (.4.20)", () => {
      enterRoteiro();

      const { bounds, options } = lastFitBounds();
      expect(options.maxZoom).toBe(MAP_CONFIG.ZOOM.DEFAULT);
      expect(options.paddingBottomRight).toEqual([50, 50 + PANEL_COLLAPSED_PX]);
      expect(bounds.points).toHaveLength(4); // p1 + p2 + p3 + the start
    });

    it("roteiro: tapped free address → ADDRESS_MAX_ZOOM on that single point (.4.21/.4.22)", () => {
      enterRoteiro();
      tapMarkerAt(-22.9, -43.2); // p1 → preview (Prévia de parada)

      const { bounds, options } = lastFitBounds();
      expect(options.maxZoom).toBe(ADDRESS_MAX_ZOOM);
      expect(options.paddingBottomRight).toEqual([40, 40 + PANEL_COLLAPSED_PX]);
      expect(bounds.points).toHaveLength(1);
    });

    it("roteiro: firmed GROUPED stop → FOCUS_MAX_ZOOM over its members (.4.19/.4.20)", () => {
      enterRoteiro();
      createFirstStop(); // firms p1 + p2; the stop stays selected

      const { bounds, options } = lastFitBounds();
      expect(options.maxZoom).toBe(FOCUS_MAX_ZOOM);
      expect(bounds.points).toHaveLength(2); // p1 + p2
    });

    it("roteiro: UNGROUPING (double-tap) keeps the frame and goes to ZOOM.MAX (.4.20)", () => {
      enterRoteiro();
      createFirstStop();
      dblTapMarkerAt(-22.9, -43.2); // the stop square sits on the seed (no graph → anchor = seed)

      const { bounds, options } = lastFitBounds();
      expect(options.maxZoom).toBe(MAP_CONFIG.ZOOM.MAX);
      expect(bounds.points).toHaveLength(2); // same frame, only closer
    });

    it("roteiro: tapping a MEMBER of the ungrouped stop → ADDRESS_MAX_ZOOM on it (.4.21)", () => {
      enterRoteiro();
      createFirstStop();
      dblTapMarkerAt(-22.9, -43.2);
      tapMarkerAt(-22.90015, -43.2); // p2's member circle

      const { bounds, options } = lastFitBounds();
      expect(options.maxZoom).toBe(ADDRESS_MAX_ZOOM);
      expect(bounds.points).toHaveLength(1);
    });

    it("roteiro: entering 'Editar parada' keeps the stop frame + zoom (.4.24)", () => {
      enterRoteiro();
      createFirstStop();

      fireEvent.click(screen.getByRole("button", { name: STOP_LABELS.EDIT }));
      expect(screen.getByText(UI_LABELS.MAP_PANEL.MODE_DRAFT)).toBeInTheDocument();

      // A refit DOES fire (REOPEN swaps the stop square for member circles, so
      // the model-set signature changes) but with the frozen draftFrame it is a
      // visual no-op: SAME 2-point frame, SAME zoom. The .4.24 regression
      // (focus dropping to null) would land here as the whole route — 4 points
      // at ZOOM.DEFAULT.
      const { bounds, options } = lastFitBounds();
      expect(options.maxZoom).toBe(FOCUS_MAX_ZOOM);
      expect(bounds.points).toHaveLength(2);
    });

    it("original: clicked marker (focused, still grouped) → FOCUS_MAX_ZOOM (.4.19)", () => {
      renderPage();
      clickLastMarker();

      const { options } = lastFitBounds();
      expect(options.maxZoom).toBe(FOCUS_MAX_ZOOM);
      expect(options.paddingBottomRight).toEqual([40, 40 + PANEL_COLLAPSED_PX]);
    });

    it("original: UNGROUPED stop (double-click) → ZOOM.MAX (.4.19/.4.20)", () => {
      renderPage();
      dblTapMarkerAt(-22.9, -43.2);

      const { options } = lastFitBounds();
      expect(options.maxZoom).toBe(MAP_CONFIG.ZOOM.MAX);
    });
  });
});
