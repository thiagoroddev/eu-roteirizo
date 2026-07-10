import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { UI_LABELS, COLUMN_NAMES, MAP_CONFIG, FOCUS_MAX_ZOOM, ADDRESS_MAX_ZOOM } from "../../constants";
import type { RowData } from "../../types";
import { DEFAULT_ROUTING_CONFIG, type LatLng, type PlannedRoute } from "../../types/routing";
import type { InteractionState, MarkerModel } from "../../utils/markers/markerModels";

// routeStorage (RF-008) is mocked so the tests CONTROL what is persisted:
// `saved` feeds the mount-time hydration; `saveCalls` records the auto-saves.
const { routeStorageState } = vi.hoisted(() => ({
  routeStorageState: {
    saved: null as PlannedRoute | null,
    saveCalls: [] as PlannedRoute[],
    deleteCalls: 0,
  },
}));
vi.mock("../../services/routeStorage", () => ({
  getRoteiro: vi.fn(() => Promise.resolve(routeStorageState.saved)),
  saveRoteiro: vi.fn((_manifestId: string, _routeName: string, route: PlannedRoute) => {
    routeStorageState.saveCalls.push(route);
    return Promise.resolve({ status: "saved" as const });
  }),
  deleteRoteiro: vi.fn(() => {
    routeStorageState.deleteCalls += 1;
    return Promise.resolve();
  }),
}));

// vaul cannot run in jsdom — passthrough mock (gesture is validated on device).
// The extra button simulates a DRAG SETTLE (vaul calling setActiveSnapPoint).
vi.mock("vaul", () => ({
  Drawer: {
    Root: ({
      children,
      dismissible,
      activeSnapPoint,
      setActiveSnapPoint,
    }: {
      children?: ReactNode;
      dismissible?: boolean;
      activeSnapPoint?: number | string | null;
      setActiveSnapPoint?: (snap: number | string | null) => void;
    }) => (
      <div data-testid="vaul-root" data-dismissible={String(!!dismissible)} data-active-snap={String(activeSnapPoint)}>
        <button type="button" onClick={() => setActiveSnapPoint?.(0.45)}>
          stub-drag-to-half
        </button>
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

const rowsA1: RowData[] = [
  {
    [COLUMN_NAMES.SEQUENCE]: 1,
    [COLUMN_NAMES.STOP]: 1,
    [COLUMN_NAMES.LATITUDE]: -229000000,
    [COLUMN_NAMES.LONGITUDE]: -431000000,
    [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Mapa, 10",
    // No inferable complement → the column decides (RF-016, value = ICON_KEYS
    // "Home"): deterministic residential chip.
    [COLUMN_NAMES.LOCATION_TYPE]: "Home",
  },
];

/** One stop with TWO addresses (keys "0:0"/"0:1") — header-row selection tests. */
const rowsStop1TwoAddresses: RowData[] = [
  { [COLUMN_NAMES.SEQUENCE]: 1, [COLUMN_NAMES.STOP]: 1, [COLUMN_NAMES.LATITUDE]: -22.9, [COLUMN_NAMES.LONGITUDE]: -43.2, [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Mapa, 10" },
  { [COLUMN_NAMES.SEQUENCE]: 2, [COLUMN_NAMES.STOP]: 1, [COLUMN_NAMES.LATITUDE]: -22.91, [COLUMN_NAMES.LONGITUDE]: -43.21, [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Beta, 20" },
];

/** Three plottable points for the draft flow (RF-006.4): p2 sits ~17 m from p1
 *  (inside the default 30 m radius → candidate); p3 sits ~556 m away (outside,
 *  and beyond the RN-17 threshold). */
const rowsThreePoints: RowData[] = [
  { [COLUMN_NAMES.SEQUENCE]: 1, [COLUMN_NAMES.STOP]: 1, [COLUMN_NAMES.LATITUDE]: -22.9, [COLUMN_NAMES.LONGITUDE]: -43.2, [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Mapa, 10" },
  { [COLUMN_NAMES.SEQUENCE]: 2, [COLUMN_NAMES.STOP]: 1, [COLUMN_NAMES.LATITUDE]: -22.90015, [COLUMN_NAMES.LONGITUDE]: -43.2, [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Beta, 20" },
  { [COLUMN_NAMES.SEQUENCE]: 3, [COLUMN_NAMES.STOP]: 2, [COLUMN_NAMES.LATITUDE]: -22.905, [COLUMN_NAMES.LONGITUDE]: -43.2, [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Gama, 30" },
];

/** Two stops whose numeric order differs from the lexicographic one ("10" < "2"). */
const rowsStops10e2: RowData[] = [
  { [COLUMN_NAMES.SEQUENCE]: 1, [COLUMN_NAMES.STOP]: 10, [COLUMN_NAMES.LATITUDE]: -22.9, [COLUMN_NAMES.LONGITUDE]: -43.2, [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Dez, 10" },
  { [COLUMN_NAMES.SEQUENCE]: 2, [COLUMN_NAMES.STOP]: 2, [COLUMN_NAMES.LATITUDE]: -22.91, [COLUMN_NAMES.LONGITUDE]: -43.21, [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Dois, 2" },
];

const uploaderState = {
  routes: { "A-1": rowsA1 } as Record<string, RowData[]> | null,
  loading: false,
  error: null as string | null,
  manifestSave: null,
  availableCols: [COLUMN_NAMES.LATITUDE, COLUMN_NAMES.LONGITUDE] as string[] | null,
  missingCols: [] as string[],
  isSingleRoute: false,
  handleFileUpload: vi.fn(),
  loadManifest: vi.fn().mockResolvedValue(true),
};

vi.mock("../../hooks/useRouteUploader", () => ({
  useRouteUploader: () => uploaderState,
}));

// Road graph mocked: the suggestion falls back to straight lines (viaStreets
// false) — exactly the no-graph contract the page must honor (RF-006.3). Tests
// can inject a real graph fixture to exercise the anchor re-projection (.4).
const roadGraphState = {
  graph: null as import("../../utils/routing/graph").RoadGraph | null,
  status: "ready" as "idle" | "loading" | "ready" | "error",
  error: null as string | null,
  retry: vi.fn(),
};
vi.mock("../../hooks/useRoadGraph", () => ({
  useRoadGraph: () => roadGraphState,
}));

/** Per-test geolocation stub (jsdom has none). */
const mockGeolocation = (getCurrentPosition: (ok: (pos: { coords: { latitude: number; longitude: number } }) => void, err: (e: { code: number }) => void) => void) => {
  Object.defineProperty(navigator, "geolocation", { value: { getCurrentPosition: vi.fn(getCurrentPosition) }, configurable: true });
};

// Stub RouteMap (Leaflet) — exposes the controlled-interaction contract so the
// tests can drive selections the way the real map would (RF-023.2), plus the
// external-models/tap/overlay contracts of the Meu roteiro mode (RF-006.2/.3).
vi.mock("../../components/RouteMap", () => ({
  RouteMap: ({
    interaction,
    onInteractionChange,
    models,
    focusBounds,
    focusMaxZoom,
    highlightedStopKey,
    onMapTap,
    onModelTap,
    onModelExpand,
    roteiroOverlay,
  }: {
    interaction?: InteractionState;
    onInteractionChange?: (next: InteractionState) => void;
    models?: MarkerModel[];
    focusBounds?: LatLng[];
    focusMaxZoom?: number;
    highlightedStopKey?: string | null;
    onMapTap?: (latlng: LatLng) => void;
    onModelTap?: (model: MarkerModel) => void;
    onModelExpand?: (model: MarkerModel) => void;
    roteiroOverlay?: { start: LatLng | null; suggestionPath: LatLng[] | null; radiusCircle?: { center: LatLng; meters: number } | null; anchor?: LatLng | null };
  }) => (
    <div
      data-testid="route-map-stub"
      data-controlled={String(!!onInteractionChange)}
      data-expanded-stop={String(interaction?.expandedStopKey ?? null)}
      data-external-models={String(models !== undefined)}
      data-model-count={String(models?.length ?? "none")}
      data-overlay-start={roteiroOverlay?.start ? `${roteiroOverlay.start.lat},${roteiroOverlay.start.lng}` : "none"}
      data-suggestion-points={String(roteiroOverlay?.suggestionPath?.length ?? "none")}
      data-suggestion-target={
        roteiroOverlay?.suggestionPath?.length
          ? `${roteiroOverlay.suggestionPath[roteiroOverlay.suggestionPath.length - 1].lat},${roteiroOverlay.suggestionPath[roteiroOverlay.suggestionPath.length - 1].lng}`
          : "none"
      }
      data-radius-circle={roteiroOverlay?.radiusCircle ? `${roteiroOverlay.radiusCircle.center.lat},${roteiroOverlay.radiusCircle.center.lng}@${roteiroOverlay.radiusCircle.meters}` : "none"}
      data-anchor={roteiroOverlay?.anchor ? `${roteiroOverlay.anchor.lat},${roteiroOverlay.anchor.lng}` : "none"}
      data-focus-bounds={String(focusBounds?.length ?? "none")}
      data-focus-zoom={String(focusMaxZoom ?? "none")}
      data-highlighted-stop={String(highlightedStopKey ?? "none")}
      data-models-summary={models?.map((m) => `${m.kind}${m.iconProps.selected ? "*" : ""}`).join(",") ?? "none"}
      data-highlighted-model={models?.find((m) => m.iconProps.highlight)?.key ?? "none"}
    >
      <button type="button" onClick={() => onMapTap?.({ lat: -22.95, lng: -43.19 })}>
        stub-map-tap
      </button>
      <button type="button" onClick={() => models?.[0] && onModelTap?.(models[0])}>
        stub-first-point-tap
      </button>
      <button type="button" onClick={() => models?.[0] && onModelExpand?.(models[0])}>
        stub-first-point-dbltap
      </button>
      <button type="button" onClick={() => models?.[1] && onModelTap?.(models[1])}>
        stub-second-point-tap
      </button>
      <button type="button" onClick={() => models?.[2] && onModelTap?.(models[2])}>
        stub-third-point-tap
      </button>
      <button type="button" onClick={() => onInteractionChange?.({ expandedStopKey: "0", selectedAddressKey: "0:0" })}>
        stub-select-first-address
      </button>
      <button type="button" onClick={() => onInteractionChange?.({ expandedStopKey: "0", selectedAddressKey: "0:1" })}>
        stub-select-second-address
      </button>
      <button type="button" onClick={() => onInteractionChange?.({ expandedStopKey: null, selectedAddressKey: null })}>
        stub-collapse
      </button>
    </div>
  ),
}));

import MapPage from "../../pages/MapPage";

/** Renders the current location's search string (URL-write assertions). */
const LocationProbe = () => <div data-testid="location-probe">{useLocation().search}</div>;

const renderPage = (initialPath = "/mapa?romaneio=hash-1&rota=A-1") =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/mapa" element={<MapPage />} />
        <Route path="/rotas" element={<div data-testid="rotas-page-stub" />} />
      </Routes>
    </MemoryRouter>
  );

// TWO VIEWS (TASK-RF-023.7): each address renders as ONE row — the selected
// card (default view) or the list item (list view) — so name queries are unique.
const addressRow = (name: RegExp) => screen.getByRole("button", { name });
const openListView = () => fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.VIEW_FULL_LIST }));

const START_LABELS = UI_LABELS.MAP_PANEL.ROTEIRO_START;

describe("MapPage (focus screen)", () => {
  beforeEach(() => {
    uploaderState.loadManifest.mockClear();
    uploaderState.routes = { "A-1": rowsA1 };
    uploaderState.error = null;
    uploaderState.loading = false;
    roadGraphState.status = "ready";
    roadGraphState.error = null;
    roadGraphState.graph = null;
    routeStorageState.saved = null;
    routeStorageState.saveCalls = [];
    routeStorageState.deleteCalls = 0;
  });

  it("loads the manifest from the URL and renders the CONTROLLED map", () => {
    renderPage();

    expect(uploaderState.loadManifest).toHaveBeenCalledWith("hash-1");
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-controlled", "true");
  });

  it("shows the segmented toggle with 'Meu roteiro' ENABLED (TASK-RF-006.2, ex-RF-010)", () => {
    renderPage();

    expect(screen.getByRole("group", { name: UI_LABELS.MAP_MODE.ARIA })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: UI_LABELS.MAP_MODE.ORIGINAL })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: UI_LABELS.MAP_MODE.MY_ROTEIRO })).toBeEnabled();
    // Original mode by default: the map computes its own models.
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-external-models", "false");
  });

  // ==========================================================================
  // MapPanel (TASK-RF-023.2)
  // ==========================================================================

  it("opens with the panel header on the smallest stop (never empty)", () => {
    renderPage();

    expect(screen.getByText(`${UI_LABELS.MAP_PANEL.STOP_PREFIX} 1`)).toBeInTheDocument();
    // Address appears in the header AND as the list item.
    expect(screen.getAllByText("Rua Mapa, 10").length).toBeGreaterThan(0);
    expect(screen.getByTestId("vaul-root")).toHaveAttribute("data-dismissible", "false");
  });

  it("picks the NUMERICALLY smallest stop for the initial header (2, not 10)", () => {
    uploaderState.routes = { "A-1": rowsStops10e2 };
    renderPage();

    expect(screen.getByText(`${UI_LABELS.MAP_PANEL.STOP_PREFIX} 2`)).toBeInTheDocument();
    expect(screen.getAllByText("Rua Dois, 2").length).toBeGreaterThan(0);
  });

  // ==========================================================================
  // Duas visões do painel (TASK-RF-023.7)
  // ==========================================================================

  it("default view: stop summary + selected-address card, NO list (no duplication)", () => {
    renderPage();

    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_STOP)).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.VIEW_FULL_LIST })).toBeInTheDocument();
    // The card falls back to the first-by-Sequence address, collapsed.
    expect(addressRow(/Rua Mapa, 10/)).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("list", { name: UI_LABELS.MAP_PANEL.ITEM.LIST_ARIA })).not.toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /Rua Mapa, 10/ })).toHaveLength(1);
  });

  it("tapping the card expands its detail IN the panel (half snap) and mirrors the map", () => {
    renderPage();
    expect(screen.getByTestId("vaul-root")).toHaveAttribute("data-active-snap", "224px");

    fireEvent.click(addressRow(/Rua Mapa, 10/));

    expect(screen.getByTestId("vaul-root")).toHaveAttribute("data-active-snap", "0.45");
    expect(addressRow(/Rua Mapa, 10/)).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText(UI_LABELS.ROUTE_MAP.ADDRESS_SHEET.PACKAGES_HEADER(1))).toBeInTheDocument();
    // The card tap shows the detail but does NOT expand the map (RF-006.4.10): stays grouped.
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-expanded-stop", "null");

    // Second tap collapses just the detail (panel stays where it is).
    fireEvent.click(addressRow(/Rua Mapa, 10/));
    expect(addressRow(/Rua Mapa, 10/)).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(UI_LABELS.ROUTE_MAP.ADDRESS_SHEET.PACKAGES_HEADER(1))).not.toBeInTheDocument();
  });

  it("Original: 'Ver lista completa' abre a lista SEM expandir o mapa — evento distinto do duplo-clique (RF-006.4.11)", () => {
    renderPage();
    const stub = screen.getByTestId("route-map-stub");
    expect(stub).toHaveAttribute("data-expanded-stop", "null");

    // A lista completa esconde o mapa (painel cheio); ela NÃO desagrupa os
    // marcadores — o desagrupar do mapa é o duplo-clique, evento distinto.
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.VIEW_FULL_LIST }));
    expect(stub).toHaveAttribute("data-expanded-stop", "null");

    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.HIDE_FULL_LIST }));
    expect(stub).toHaveAttribute("data-expanded-stop", "null");
    expect(screen.getByText(`${UI_LABELS.MAP_PANEL.STOP_PREFIX} 1`)).toBeInTheDocument();
  });

  it("the card follows the SELECTION on the map — panel untouched (rev. 07/07: no auto-raise, no auto-detail)", () => {
    uploaderState.routes = { "A-1": rowsStop1TwoAddresses };
    renderPage();
    expect(addressRow(/Rua Mapa, 10/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "stub-select-second-address" }));

    expect(addressRow(/Rua Beta, 20/)).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByTestId("vaul-root")).toHaveAttribute("data-active-snap", "224px");
    expect(screen.queryByText(UI_LABELS.ROUTE_MAP.ADDRESS_SHEET.PACKAGES_HEADER(1))).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Rua Mapa, 10/ })).not.toBeInTheDocument();
  });

  it("'Ver lista completa' opens the LIST view at the full snap, with 'Ver no mapa' per card", () => {
    uploaderState.routes = { "A-1": rowsStop1TwoAddresses };
    renderPage();

    openListView();

    expect(screen.getByTestId("vaul-root")).toHaveAttribute("data-active-snap", "0.85");
    expect(screen.getByRole("list", { name: UI_LABELS.MAP_PANEL.ITEM.LIST_ARIA })).toBeInTheDocument();
    expect(addressRow(/Rua Mapa, 10/)).toBeInTheDocument();
    expect(addressRow(/Rua Beta, 20/)).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: UI_LABELS.MAP_PANEL.VIEW_ON_MAP })).toHaveLength(2);
    // No selected-address section inside the list view; the toggle FLIPS to
    // "Esconder lista" (it never disappears — rev. 07/07).
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: UI_LABELS.MAP_PANEL.VIEW_FULL_LIST })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.HIDE_FULL_LIST })).toBeInTheDocument();
  });

  it("'Esconder lista' returns to the selected view at half", () => {
    renderPage();
    openListView();

    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.HIDE_FULL_LIST }));

    expect(screen.queryByRole("list", { name: UI_LABELS.MAP_PANEL.ITEM.LIST_ARIA })).not.toBeInTheDocument();
    expect(screen.getByTestId("vaul-root")).toHaveAttribute("data-active-snap", "0.45");
    expect(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.VIEW_FULL_LIST })).toBeInTheDocument();
  });

  it("the card opens at FULL when the address holds more than 2 packages (size-aware — rev. 07/07)", () => {
    uploaderState.routes = {
      "A-1": [
        { ...rowsA1[0], [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Mapa, 10, Apto 1" },
        { ...rowsA1[0], [COLUMN_NAMES.SEQUENCE]: 2, [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Mapa, 10, Apto 2" },
        { ...rowsA1[0], [COLUMN_NAMES.SEQUENCE]: 3, [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Mapa, 10, Apto 3" },
      ],
    };
    renderPage();

    fireEvent.click(addressRow(/Rua Mapa, 10/));

    expect(screen.getByTestId("vaul-root")).toHaveAttribute("data-active-snap", "0.85");
    expect(screen.getByText(UI_LABELS.ROUTE_MAP.ADDRESS_SHEET.PACKAGES_HEADER(3))).toBeInTheDocument();
  });

  it("'Ver no mapa' selects the address and returns to the default view at half", () => {
    uploaderState.routes = { "A-1": rowsStop1TwoAddresses };
    renderPage();
    openListView();

    fireEvent.click(screen.getAllByRole("button", { name: UI_LABELS.MAP_PANEL.VIEW_ON_MAP })[1]);

    expect(screen.queryByRole("list", { name: UI_LABELS.MAP_PANEL.ITEM.LIST_ARIA })).not.toBeInTheDocument();
    expect(screen.getByTestId("vaul-root")).toHaveAttribute("data-active-snap", "0.45");
    expect(addressRow(/Rua Beta, 20/)).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-expanded-stop", "0");
  });

  it("dragging the panel below full leaves the list view (back to the selected view)", () => {
    renderPage();
    openListView();
    expect(screen.getByRole("list", { name: UI_LABELS.MAP_PANEL.ITEM.LIST_ARIA })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "stub-drag-to-half" }));

    expect(screen.queryByRole("list", { name: UI_LABELS.MAP_PANEL.ITEM.LIST_ARIA })).not.toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED)).toBeInTheDocument();
  });

  it("stop summary shows the neighborhoods with the zipcodes in parentheses (rev. 07/07)", () => {
    uploaderState.routes = {
      "A-1": [{ ...rowsA1[0], [COLUMN_NAMES.NEIGHBORHOOD]: "Copacabana", [COLUMN_NAMES.ZIPCODE]: "22050-002" }],
    };
    renderPage();

    expect(screen.getByText(`${UI_LABELS.MAP_PANEL.STOP_PREFIX} 1 — Copacabana (22050-002)`)).toBeInTheDocument();
  });

  // ==========================================================================
  // Header real: ModeBar + StopStepper + métricas (TASK-RF-023.3)
  // ==========================================================================

  it("shows the mode label and the metric chips (packages PER TYPE — rev. 07/07)", () => {
    renderPage();

    expect(screen.getByText(UI_LABELS.MAP_PANEL.MODE_VIEW)).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.METRIC_ADDRESSES(1))).toBeInTheDocument();
    // rowsA1 is typed Residential via the column → one typed chip; no other types cited.
    expect(screen.getByText(UI_LABELS.MAP_PANEL.METRIC_TYPED_PACKAGES(UI_LABELS.ROUTE_MAP.ADDRESS_SHEET.TYPE_LABELS.RESIDENTIAL, 1))).toBeInTheDocument();
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.METRIC_TYPED_PACKAGES(UI_LABELS.ROUTE_MAP.ADDRESS_SHEET.TYPE_LABELS.COMMERCIAL, 0))).not.toBeInTheDocument();
    expect(screen.queryByText(new RegExp(UI_LABELS.ROUTE_MAP.ADDRESS_SHEET.TYPE_LABELS.INDEFINITE))).not.toBeInTheDocument();
  });

  it("stepper › advances to the next NUMERIC stop and syncs the map (panel → map)", () => {
    // Appearance order: index 0 = stop 10, index 1 = stop 2. Numeric order: 2 → 10.
    uploaderState.routes = { "A-1": rowsStops10e2 };
    renderPage();
    expect(screen.getByText(`${UI_LABELS.MAP_PANEL.STOP_PREFIX} 2`)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.NEXT_STOP }));

    expect(screen.getByText(`${UI_LABELS.MAP_PANEL.STOP_PREFIX} 10`)).toBeInTheDocument();
    // The stepper FOCUSES the stop, GROUPED (RF-006.4.10 — no auto-expand): the
    // map stays grouped (expandedStopKey null) but the panel follows the stop.
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-expanded-stop", "null");
  });

  it("Original: o quadrado da parada do painel é destacado no mapa e acompanha o stepper (RF-006.4.13)", () => {
    // index 0 = stop 10, index 1 = stop 2. O painel abre na MENOR (stop 2 = índice 1).
    uploaderState.routes = { "A-1": rowsStops10e2 };
    renderPage();
    const stub = screen.getByTestId("route-map-stub");
    expect(stub.getAttribute("data-highlighted-stop")).toBe("1");

    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.NEXT_STOP })); // → stop 10 (índice 0)
    expect(stub.getAttribute("data-highlighted-stop")).toBe("0");
  });

  it("stepper ‹ is circular (from the smallest stop it wraps to the largest)", () => {
    uploaderState.routes = { "A-1": rowsStops10e2 };
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.PREV_STOP }));

    expect(screen.getByText(`${UI_LABELS.MAP_PANEL.STOP_PREFIX} 10`)).toBeInTheDocument();
    expect(screen.getAllByText("Rua Dez, 10").length).toBeGreaterThan(0);
  });

  it("collapsing on the map keeps the panel on the last stop (memory never clears)", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "stub-select-first-address" }));
    fireEvent.click(screen.getByRole("button", { name: "stub-collapse" }));

    // Detail closes, but the summary and the fallback card still show the stop.
    expect(screen.getByText(`${UI_LABELS.MAP_PANEL.STOP_PREFIX} 1`)).toBeInTheDocument();
    expect(addressRow(/Rua Mapa, 10/)).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(UI_LABELS.ROUTE_MAP.ADDRESS_SHEET.PACKAGES_HEADER(1))).not.toBeInTheDocument();
  });

  // ==========================================================================
  // Escape por snaps (TASK-RF-023.5, design §5)
  // ==========================================================================

  it("Escape steps down: list view → selected view → collapsed → leaves the map", () => {
    render(
      <MemoryRouter initialEntries={["/rotas", "/mapa?romaneio=hash-1&rota=A-1"]} initialIndex={1}>
        <Routes>
          <Route path="/mapa" element={<MapPage />} />
          <Route path="/rotas" element={<div data-testid="rotas-page-stub" />} />
        </Routes>
      </MemoryRouter>
    );

    openListView();
    expect(screen.getByRole("list", { name: UI_LABELS.MAP_PANEL.ITEM.LIST_ARIA })).toBeInTheDocument();

    // 1st Escape: leaves the list view, back to the selected view at half.
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("list", { name: UI_LABELS.MAP_PANEL.ITEM.LIST_ARIA })).not.toBeInTheDocument();
    expect(screen.getByTestId("vaul-root")).toHaveAttribute("data-active-snap", "0.45");

    // 2nd Escape: collapses the panel, stays on the map (card intact).
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByTestId("vaul-root")).toHaveAttribute("data-active-snap", "224px");
    expect(addressRow(/Rua Mapa, 10/)).toBeInTheDocument();

    // 3rd Escape: leaves the map (same destination as the back arrow).
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.getByTestId("rotas-page-stub")).toBeInTheDocument();
  });

  // ==========================================================================
  // Modo Meu roteiro (TASK-RF-006.2 — absorve RF-010, ADR-009)
  // ==========================================================================

  it("switching to 'Meu roteiro' shows the remaining-work HUD and feeds the map external models", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_MODE.MY_ROTEIRO }));

    // HUD over rowsA1: 1 address, 1 package, nothing committed yet.
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ROTEIRO_REMAINING(1, 1))).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ROTEIRO_HINT_START)).toBeInTheDocument();
    // No Original sections, no stop steppers (there are no stops to step).
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.SECTION_STOP)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: UI_LABELS.MAP_PANEL.VIEW_FULL_LIST })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: UI_LABELS.MAP_PANEL.NEXT_STOP })).not.toBeInTheDocument();
    // The map draws the external (faded free points) models.
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-external-models", "true");
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-model-count", "1");
  });

  // RF-006.4.18 (supersedes "entering the roteiro collapses the map expansion"):
  // a toggle is a VIEW switch, not a reset. Each mode keeps exactly where it was.
  it("keeps each mode's place across a round trip: the Original's expansion survives the roteiro", () => {
    uploaderState.routes = { "A-1": rowsStop1TwoAddresses };
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "stub-select-first-address" }));
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-expanded-stop", "0");

    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_MODE.MY_ROTEIRO }));
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-external-models", "true");

    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_MODE.ORIGINAL }));
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-external-models", "false");
    // Back exactly where it was — the expansion was never thrown away.
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-expanded-stop", "0");
    expect(screen.getByText(`${UI_LABELS.MAP_PANEL.STOP_PREFIX} 1`)).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_STOP)).toBeInTheDocument();
  });

  // The panel's height/view/card live in PER-MODE buckets: raising one must not
  // move the other. The Original goes full; the roteiro stays where IT was.
  it("keeps the panel snap PER MODE across the toggle", () => {
    uploaderState.routes = { "A-1": rowsStop1TwoAddresses };
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.VIEW_FULL_LIST }));
    expect(screen.getByTestId("vaul-root")).toHaveAttribute("data-active-snap", "0.85");

    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_MODE.MY_ROTEIRO }));
    expect(screen.getByTestId("vaul-root")).toHaveAttribute("data-active-snap", "224px");

    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_MODE.ORIGINAL }));
    expect(screen.getByTestId("vaul-root")).toHaveAttribute("data-active-snap", "0.85");
  });

  it("?modo=roteiro deep-links straight into the roteiro mode (URL is the source of truth)", () => {
    renderPage("/mapa?romaneio=hash-1&rota=A-1&modo=roteiro");

    expect(screen.getByRole("button", { name: UI_LABELS.MAP_MODE.MY_ROTEIRO })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ROTEIRO_REMAINING(1, 1))).toBeInTheDocument();
  });

  it("the toggle writes the mode to the URL preserving romaneio/rota (replace)", () => {
    render(
      <MemoryRouter initialEntries={["/mapa?romaneio=hash-1&rota=A-1"]}>
        <Routes>
          <Route
            path="/mapa"
            element={
              <>
                <MapPage />
                <LocationProbe />
              </>
            }
          />
          <Route path="/rotas" element={<div data-testid="rotas-page-stub" />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_MODE.MY_ROTEIRO }));
    const probeAfterEnter = screen.getByTestId("location-probe").textContent ?? "";
    expect(probeAfterEnter).toContain("romaneio=hash-1");
    expect(probeAfterEnter).toContain("rota=A-1");
    expect(probeAfterEnter).toContain("modo=roteiro");

    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_MODE.ORIGINAL }));
    const probeAfterLeave = screen.getByTestId("location-probe").textContent ?? "";
    expect(probeAfterLeave).toContain("romaneio=hash-1");
    expect(probeAfterLeave).not.toContain("modo=");
  });

  it("with no plottable points the roteiro side is disabled and ?modo=roteiro falls back to Original", () => {
    uploaderState.routes = { "A-1": [{ [COLUMN_NAMES.SEQUENCE]: 1, [COLUMN_NAMES.STOP]: 1, [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Sem Coord, 1" }] };
    renderPage("/mapa?romaneio=hash-1&rota=A-1&modo=roteiro");

    expect(screen.getByRole("button", { name: UI_LABELS.MAP_MODE.MY_ROTEIRO_SOON })).toBeDisabled();
    expect(screen.getByRole("button", { name: UI_LABELS.MAP_MODE.ORIGINAL })).toHaveAttribute("aria-pressed", "true");
    // Original header, not the roteiro HUD.
    expect(screen.getByText(UI_LABELS.MAP_PANEL.MODE_VIEW)).toBeInTheDocument();
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.ROTEIRO_HINT_START)).not.toBeInTheDocument();
  });

  // ==========================================================================
  // Ponto inicial + sugestão tracejada (TASK-RF-006.3 — RF-21/22)
  // ==========================================================================

  it("roteiro without a start opens in the no-start phase (GPS + map tap paths)", () => {
    renderPage("/mapa?romaneio=hash-1&rota=A-1&modo=roteiro");

    expect(screen.getByText(START_LABELS.SECTION)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: START_LABELS.USE_GPS })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: START_LABELS.ARM_MAP_TAP })).toBeInTheDocument();
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-overlay-start", "none");
  });

  it("'Tocar no mapa' arms the tap; the tapped coordinate becomes the start with the dashed suggestion", () => {
    renderPage("/mapa?romaneio=hash-1&rota=A-1&modo=roteiro");

    // Tapping before arming does nothing (decision 08/07).
    fireEvent.click(screen.getByRole("button", { name: "stub-map-tap" }));
    expect(screen.getByText(START_LABELS.SECTION)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: START_LABELS.ARM_MAP_TAP }));
    expect(screen.getByText(START_LABELS.ARMED_HINT)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "stub-map-tap" }));
    expect(screen.getByText(START_LABELS.DEFINED)).toBeInTheDocument();
    const stub = screen.getByTestId("route-map-stub");
    expect(stub).toHaveAttribute("data-overlay-start", "-22.95,-43.19");
    // Straight-line fallback (graph null): 2-point dashed path + "(linha reta)".
    expect(stub).toHaveAttribute("data-suggestion-points", "2");
    expect(screen.getByText(new RegExp(`Sugestão: Rua Mapa, 10 — .+ ${START_LABELS.SUGGESTION_STRAIGHT.replace("(", "\\(").replace(")", "\\)")}`))).toBeInTheDocument();
  });

  it("tapping a faded point without a start asks for confirmation (partir deste endereço)", () => {
    uploaderState.routes = { "A-1": rowsStop1TwoAddresses };
    renderPage("/mapa?romaneio=hash-1&rota=A-1&modo=roteiro");

    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    expect(screen.getByText(START_LABELS.CONFIRM_POINT("Rua Mapa, 10"))).toBeInTheDocument();
    // The address awaiting confirmation is framed close — it used to sit lost
    // among every other marker of the route (RF-006.4.20) — AND wears the
    // selected-address chrome, like any other selected address (RF-006.4.21).
    const stub = screen.getByTestId("route-map-stub");
    expect(stub.getAttribute("data-focus-bounds")).toBe("1");
    expect(stub.getAttribute("data-focus-zoom")).toBe(String(ADDRESS_MAX_ZOOM));
    expect(stub.getAttribute("data-highlighted-model")).not.toBe("none");
    expect(stub.getAttribute("data-models-summary")).toContain("address*");

    fireEvent.click(screen.getByRole("button", { name: START_LABELS.CONFIRM }));
    expect(screen.getByText(START_LABELS.DEFINED)).toBeInTheDocument();
    expect(stub).toHaveAttribute("data-overlay-start", "-22.9,-43.2");
  });

  it("with a start, tapping a point RE-POINTS the suggestion (dashed line follows; no text line in the point context)", () => {
    uploaderState.routes = { "A-1": rowsStop1TwoAddresses };
    renderPage("/mapa?romaneio=hash-1&rota=A-1&modo=roteiro");
    fireEvent.click(screen.getByRole("button", { name: START_LABELS.ARM_MAP_TAP }));
    fireEvent.click(screen.getByRole("button", { name: "stub-map-tap" }));

    // Automatic target = nearest to the start (-22.95,-43.19) → "Rua Beta, 20".
    expect(screen.getByText(/Sugestão: Rua Beta, 20 —/)).toBeInTheDocument();

    // Tapping p1 re-points the dashed line to it (§6); the "Sugestão:" TEXT
    // line no longer renders in the point-selected context (rev. 08/07 .4.4 —
    // the "Parada sugerida" section carries the information now).
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-suggestion-target", "-22.9,-43.2");
    expect(screen.queryByText(/^Sugestão:/)).not.toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_SUGGESTED)).toBeInTheDocument();
  });

  it("GPS success inside Rio defines the start", () => {
    mockGeolocation((ok) => ok({ coords: { latitude: -22.93, longitude: -43.2 } }));
    renderPage("/mapa?romaneio=hash-1&rota=A-1&modo=roteiro");

    fireEvent.click(screen.getByRole("button", { name: START_LABELS.USE_GPS }));

    expect(screen.getByText(START_LABELS.DEFINED)).toBeInTheDocument();
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-overlay-start", "-22.93,-43.2");
  });

  it("GPS denied warns and defines nothing", () => {
    mockGeolocation((_ok, err) => err({ code: 1 }));
    renderPage("/mapa?romaneio=hash-1&rota=A-1&modo=roteiro");

    fireEvent.click(screen.getByRole("button", { name: START_LABELS.USE_GPS }));

    expect(screen.getByText(UI_LABELS.ROUTING.GPS_DENIED)).toBeInTheDocument();
    expect(screen.getByText(START_LABELS.SECTION)).toBeInTheDocument();
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-overlay-start", "none");
  });

  it("GPS outside the Rio bounds warns and defines nothing", () => {
    mockGeolocation((ok) => ok({ coords: { latitude: 0, longitude: 0 } }));
    renderPage("/mapa?romaneio=hash-1&rota=A-1&modo=roteiro");

    fireEvent.click(screen.getByRole("button", { name: START_LABELS.USE_GPS }));

    expect(screen.getByText(UI_LABELS.ROUTING.GPS_OUT_OF_BOUNDS)).toBeInTheDocument();
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-overlay-start", "none");
  });

  it("'Redefinir início' re-opens the paths keeping the current start until a new one lands", () => {
    renderPage("/mapa?romaneio=hash-1&rota=A-1&modo=roteiro");
    fireEvent.click(screen.getByRole("button", { name: START_LABELS.ARM_MAP_TAP }));
    fireEvent.click(screen.getByRole("button", { name: "stub-map-tap" }));
    expect(screen.getByText(START_LABELS.DEFINED)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: START_LABELS.REDEFINE }));
    expect(screen.getByText(START_LABELS.SECTION)).toBeInTheDocument();
    // The start (and its marker) survives until redefined.
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-overlay-start", "-22.95,-43.19");
  });

  it("switching modes resets the ephemeral start UI but keeps the defined start", () => {
    renderPage("/mapa?romaneio=hash-1&rota=A-1&modo=roteiro");
    fireEvent.click(screen.getByRole("button", { name: START_LABELS.ARM_MAP_TAP }));
    fireEvent.click(screen.getByRole("button", { name: "stub-map-tap" }));

    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_MODE.ORIGINAL }));
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_MODE.MY_ROTEIRO }));

    // Not armed, not confirming: straight to has-start (the reducer kept the start).
    expect(screen.getByText(START_LABELS.DEFINED)).toBeInTheDocument();
    expect(screen.queryByText(START_LABELS.ARMED_HINT)).not.toBeInTheDocument();
  });

  it("shows the discreet graph status while loading and the retry on error", () => {
    roadGraphState.status = "loading";
    renderPage("/mapa?romaneio=hash-1&rota=A-1&modo=roteiro");
    expect(screen.getByText(UI_LABELS.ROUTING.LOADING_STREETS)).toBeInTheDocument();
  });

  // ==========================================================================
  // Ponto órfão + rascunho da parada (TASK-RF-006.4 — telas 8–9)
  // ==========================================================================

  const POINT_LABELS = UI_LABELS.MAP_PANEL.ROTEIRO_POINT;
  const DRAFT_LABELS = UI_LABELS.MAP_PANEL.ROTEIRO_DRAFT;

  /** Enters the roteiro over the 3-point fixture and defines the start by tap. */
  const startRoteiroFlow = () => {
    uploaderState.routes = { "A-1": rowsThreePoints };
    renderPage("/mapa?romaneio=hash-1&rota=A-1&modo=roteiro");
    fireEvent.click(screen.getByRole("button", { name: START_LABELS.ARM_MAP_TAP }));
    fireEvent.click(screen.getByRole("button", { name: "stub-map-tap" }));
    expect(screen.getByText(START_LABELS.DEFINED)).toBeInTheDocument();
  };

  // ------- Persistência (TASK-RF-008) -------

  it("hidrata o roteiro salvo ao montar — a parada firmada volta sem nenhum gesto", async () => {
    uploaderState.routes = { "A-1": rowsThreePoints };
    routeStorageState.saved = {
      id: "route_saved",
      startPoint: { lat: -22.9, lng: -43.2 },
      stops: [{ id: "stop_1", order: 1, vehicleStop: { lat: -22.9, lng: -43.2 }, pointIds: ["pt_-22.90000,-43.20000", "pt_-22.90015,-43.20000"], radiusMeters: 30 }],
      config: DEFAULT_ROUTING_CONFIG,
      createdAt: "2026-07-10T10:00:00.000Z",
    };
    renderPage("/mapa?romaneio=hash-1&rota=A-1&modo=roteiro");

    // A parada volta como quadrado no mapa e o início como definido.
    await waitFor(() => expect(screen.getByTestId("route-map-stub").getAttribute("data-models-summary")).toContain("stop"));
    expect(screen.getByText(START_LABELS.DEFINED)).toBeInTheDocument();
  });

  it("auto-save: firma da parada persiste (debounce); a EDIÇÃO aberta pausa o save (o snapshot pré-edição fica)", async () => {
    startRoteiroFlow();
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));

    // O debounce (800ms) consolida a firma: o último save carrega a parada.
    await waitFor(() => expect(routeStorageState.saveCalls.some((r) => r.stops.length === 1)).toBe(true), { timeout: 2500 });
    const savesBeforeEdit = routeStorageState.saveCalls.length;

    // Editar abre o draft (REOPEN tira a parada de `stops`): auto-save PAUSADO —
    // um snapshot agora gravaria o roteiro SEM a parada aberta.
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.ROTEIRO_STOP.EDIT }));
    await new Promise((resolve) => setTimeout(resolve, 1100)); // > debounce
    expect(routeStorageState.saveCalls.length).toBe(savesBeforeEdit);
    expect(routeStorageState.saveCalls.every((r) => r.stops.length === 1 || r.stops.length === 0)).toBe(true);

    // Salvar fecha o draft → o save volta, de novo com a parada inteira.
    fireEvent.click(screen.getByRole("button", { name: DRAFT_LABELS.SAVE }));
    await waitFor(() => expect(routeStorageState.saveCalls.length).toBeGreaterThan(savesBeforeEdit), { timeout: 2500 });
    expect(routeStorageState.saveCalls[routeStorageState.saveCalls.length - 1].stops).toHaveLength(1);
  });

  it("tela 8: selected-address card with the no-stop notice + radius PREVIEW before creating; empty-map tap deselects", () => {
    startRoteiroFlow();
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-radius-circle", "none");

    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    // The notice lives under "Endereço selecionado" — no stop summary for an orphan (rev. 08/07).
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.SECTION_STOP)).not.toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED)).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ROTEIRO_NO_STOP_YET)).toBeInTheDocument();
    // The radius circle already PREVIEWS on the selected orphan (U6).
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-radius-circle", "-22.9,-43.2@30");
    const card = screen.getByRole("button", { name: /Rua Mapa, 10/ });
    expect(card).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP })).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument(); // no stops yet → no incorporation
    // The old "Sugestão: …" line is gone in this context (rev. 08/07 .4.4 —
    // the suggested-stop section replaced it; the map's dashed line remains).
    expect(screen.queryByText(/^Sugestão:/)).not.toBeInTheDocument();
    // 3ª seção (rev. 08/07 3ª/4ª rodadas): the would-be stop's summary
    // AGGREGATES the seed + the radius candidates (p1 + p2 → "2 endereços");
    // the label row carries the VEHICLE distance (car icon qualifies, honest
    // straight-line suffix while the graph is absent) — no candidates banner.
    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_SUGGESTED)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`^${UI_LABELS.MAP_PANEL.STOP_PREFIX} 1`))).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.METRIC_ADDRESSES(2))).toBeInTheDocument();
    expect(screen.queryByText(DRAFT_LABELS.BANNER_CANDIDATES(1))).not.toBeInTheDocument();
    expect(screen.getByText(/Distância até aqui: .+ \(linha reta\)/)).toBeInTheDocument();

    // Tapping the card opens the Original's own detail in the body.
    fireEvent.click(card);
    expect(screen.getByText(UI_LABELS.ROUTE_MAP.ADDRESS_SHEET.PACKAGES_HEADER(1))).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "stub-map-tap" }));
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.ROTEIRO_NO_STOP_YET)).not.toBeInTheDocument();
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-radius-circle", "none");
  });

  it("the roteiro header carries the STATE: draft label + next-step hint (feedback 08/07)", () => {
    startRoteiroFlow();

    expect(screen.getByText(UI_LABELS.MAP_PANEL.MODE_ROTEIRO_DRAFT)).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ROTEIRO_STATE_BUILDING)).toBeInTheDocument();
  });

  it("'Criar parada' COMITA na hora (RF-006.4.6): parada firmada + agrupada + painel de resumo, sem draft", () => {
    startRoteiroFlow();
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" })); // p1 → preview

    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));

    // No draft — the stop is firmed immediately (commit-on-create).
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.MODE_DRAFT)).not.toBeInTheDocument();
    // Panel focuses the firmed stop (Original-style summary).
    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_STOP)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`^${UI_LABELS.MAP_PANEL.STOP_PREFIX} 1`))).toBeInTheDocument();
    const stub = screen.getByTestId("route-map-stub");
    // The stop is a grouped, SELECTED square on the map (p1 + p2 from the radius).
    expect(stub.getAttribute("data-models-summary")).toContain("stop*");
    // Only p3 remains free; the preview circle is gone.
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ROTEIRO_REMAINING(1, 1))).toBeInTheDocument();
    expect(stub).toHaveAttribute("data-radius-circle", "none");
  });

  it("os candidatos do raio entram AUTOMATICAMENTE na parada ao criar (reverte §8 — RF-006.4.6)", () => {
    startRoteiroFlow();
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" })); // p1

    // The preview already aggregates seed + radius candidate → "2 endereços".
    expect(screen.getByText("2 endereços")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));

    // The firmed stop holds BOTH p1 and p2 — no manual add needed anymore.
    expect(screen.getByText(new RegExp(`^${UI_LABELS.MAP_PANEL.STOP_PREFIX} 1`))).toBeInTheDocument();
    expect(screen.getByText("2 endereços")).toBeInTheDocument();
    expect(screen.getByText(/~\d+ min/)).toBeInTheDocument();
    // Only p3 stays free (p1 + p2 committed).
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ROTEIRO_REMAINING(1, 1))).toBeInTheDocument();
  });

  it("o stepper de raio no preview redimensiona o círculo e a contagem; criar respeita o raio (RF-006.4.6)", () => {
    startRoteiroFlow();
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" })); // p1, raio 30
    const stub = screen.getByTestId("route-map-stub");
    expect(stub).toHaveAttribute("data-radius-circle", "-22.9,-43.2@30");
    expect(screen.getByText("2 endereços")).toBeInTheDocument(); // p1 + p2

    // Diminuir p/ 10 m no PREVIEW: p2 sai; círculo e contagem acompanham.
    fireEvent.click(screen.getByRole("button", { name: DRAFT_LABELS.RADIUS_DECREASE }));
    fireEvent.click(screen.getByRole("button", { name: DRAFT_LABELS.RADIUS_DECREASE }));
    expect(screen.getByText(DRAFT_LABELS.RADIUS_VALUE(10))).toBeInTheDocument();
    expect(stub).toHaveAttribute("data-radius-circle", "-22.9,-43.2@10");
    expect(screen.getByText("1 endereço")).toBeInTheDocument(); // só a semente

    // Criar com o raio reduzido → parada só com p1; p2 e p3 seguem livres.
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ROTEIRO_REMAINING(2, 2))).toBeInTheDocument();
  });

  it("criar P1 e depois P2 firmam direto (épico acceptance: criar P1, P2… e ver firmar)", () => {
    startRoteiroFlow();
    // P1: tocar p1 → Criar comita p1 + p2 (o raio 30 engloba p2).
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));

    const stub = screen.getByTestId("route-map-stub");
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.MODE_DRAFT)).not.toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ROTEIRO_REMAINING(1, 1))).toBeInTheDocument();
    expect(stub.getAttribute("data-models-summary")).toContain("stop");

    // P2 sobre o ponto restante (models = [stop, p3] → segundo botão).
    fireEvent.click(screen.getByRole("button", { name: "stub-second-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));

    expect(screen.getByText(UI_LABELS.MAP_PANEL.ROTEIRO_REMAINING(0, 0))).toBeInTheDocument();
    // Duas paradas firmadas e agrupadas (a última fica selecionada).
    expect(stub.getAttribute("data-models-summary")).toBe("stop,stop*");
  });

  it("editar (REOPEN): save desabilitado no draft esvaziado; cancel descarta sem efeito colateral", () => {
    startRoteiroFlow();
    // Criar P1 (comita p1 + p2), depois reabrir para editar.
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.ROTEIRO_STOP.EDIT }));
    expect(screen.getByText(UI_LABELS.MAP_PANEL.MODE_DRAFT)).toBeInTheDocument();

    // Esvaziar o draft → dica + salvar desabilitado.
    fireEvent.click(screen.getByRole("button", { name: DRAFT_LABELS.REMOVE_POINT("Rua Mapa, 10") }));
    fireEvent.click(screen.getByRole("button", { name: DRAFT_LABELS.REMOVE_POINT("Rua Beta, 20") }));
    expect(screen.getByText(DRAFT_LABELS.EMPTY_HINT)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: DRAFT_LABELS.SAVE })).toBeDisabled();

    // Cancel descarta o draft; a parada firmada (p1 + p2) permanece intacta.
    fireEvent.click(screen.getByRole("button", { name: DRAFT_LABELS.CANCEL }));
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.MODE_DRAFT)).not.toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ROTEIRO_REMAINING(1, 1))).toBeInTheDocument();
  });

  it("incorporates an orphan into the nearest stop (on-demand select, nearest pre-set)", () => {
    startRoteiroFlow();
    // Criar P1 comita p1 + p2 (raio 30) — o único órfão passa a ser p3.
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));

    // Selecionar p3 (models = [stop, p3] → segundo botão); o select só aparece
    // ON DEMAND e pré-seleciona a Parada 1 (a única/mais próxima, já com 2 endereços).
    fireEvent.click(screen.getByRole("button", { name: "stub-second-point-tap" }));
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.INCORPORATE_OTHER }));
    const select = screen.getByRole("combobox", { name: POINT_LABELS.TARGET_STOP_ARIA });
    expect(select).toBeInTheDocument();
    expect(screen.getByText(POINT_LABELS.STOP_OPTION(1, 2))).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CONFIRM }));
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.ROTEIRO_NO_STOP_YET)).not.toBeInTheDocument();
    // p3 entrou na parada → nada livre.
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ROTEIRO_REMAINING(0, 0))).toBeInTheDocument();
  });

  it("tapping a committed stop opens its Original-style panel; Editar reopens the draft; Desfazer frees (RF-006.4.2)", () => {
    startRoteiroFlow();
    // Criar P1 comita p1 + p2 direto (o raio 30 engloba p2 — RF-006.4.6).
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));

    // Tap the committed stop (models = [stop, p3] → first button).
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_STOP)).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`^${UI_LABELS.MAP_PANEL.STOP_PREFIX} 1`))).toBeInTheDocument();
    // Chips include the walking estimate.
    expect(screen.getByText(/~\d+ min/)).toBeInTheDocument();
    expect(screen.getByText("2 endereços")).toBeInTheDocument();
    // "Endereço selecionado" agora é a parada do veículo (âncora), com o glifo
    // do veículo no lugar do "1º" (RF-006.4.7).
    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED_ANCHOR)).toBeInTheDocument();
    expect(screen.queryByText("1º")).not.toBeInTheDocument();

    // Editar → back to the edit draft: the body is the Original's full-list
    // structure now (rev. 08/07 3ª rodada) — members carry the walking ordinal
    // in the mini-marker and a remove (−) trailing action per row.
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.ROTEIRO_STOP.EDIT }));
    expect(screen.getByText(UI_LABELS.MAP_PANEL.MODE_DRAFT)).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ORDINAL(1))).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ORDINAL(2))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: DRAFT_LABELS.REMOVE_POINT("Rua Mapa, 10") })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: DRAFT_LABELS.SAVE }));

    // Desfazer → the addresses go back to free and the HUD rises (§9).
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.ROTEIRO_STOP.DISSOLVE }));
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.SECTION_STOP)).not.toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ROTEIRO_REMAINING(3, 3))).toBeInTheDocument();
  });

  it("'Ver lista completa' na parada firmada mostra os endereços por ordinal; 'Esconder lista' volta ao resumo (RF-006.4.7)", () => {
    startRoteiroFlow();
    // Criar P1 (comita p1 + p2), depois focar a parada.
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));

    // Resumo: mostra a âncora (parada do veículo), sem lista.
    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED_ANCHOR)).toBeInTheDocument();

    // Ver lista completa → os 2 endereços da parada por ordinal (a âncora some);
    // é EVENTO DISTINTO do duplo-clique: abre a lista no painel (esconde o mapa),
    // não expande os marcadores (RF-006.4.11).
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.VIEW_FULL_LIST }));
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ORDINAL(1))).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ORDINAL(2))).toBeInTheDocument();
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED_ANCHOR)).not.toBeInTheDocument();
    expect(screen.getByTestId("route-map-stub").getAttribute("data-models-summary")).toContain("stop"); // mapa segue agrupado

    // Esconder lista → volta ao resumo (âncora de novo).
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.HIDE_FULL_LIST }));
    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED_ANCHOR)).toBeInTheDocument();
  });

  it("2 cliques no quadrado → desagrupa SÓ o mapa (painel fica no resumo); clicar fora regrupa mantendo foco (RF-006.4.11)", () => {
    startRoteiroFlow();
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));
    const stub = screen.getByTestId("route-map-stub");
    // Focada e AGRUPADA: um quadrado selecionado + o órfão p3.
    expect(stub.getAttribute("data-models-summary")).toBe("stop*,address");

    // Focar a parada passa suas coords como focusBounds → zoom PERTO (RF-006.4.11).
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    expect(stub.getAttribute("data-focus-bounds")).toBe("2"); // p1 + p2 da parada

    // Duplo-clique → desagrupa no MAPA; o painel FICA no resumo (não abre a lista).
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-dbltap" }));
    expect(stub.getAttribute("data-models-summary")).toBe("address*,address*,address");
    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED_ANCHOR)).toBeInTheDocument(); // resumo, não lista

    // Clicar fora (mapa vazio) → reagrupa MANTENDO o foco (parada segue selecionada).
    fireEvent.click(screen.getByRole("button", { name: "stub-map-tap" }));
    expect(stub.getAttribute("data-models-summary")).toContain("stop");
    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_STOP)).toBeInTheDocument();
  });

  // RF-006.4.20: o quão PERTO depende do QUE está focado. Endereço e parada
  // desagrupada vão ao zoom máximo; parada agrupada para antes (vizinhas no
  // enquadramento); sem seleção, o RouteMap enquadra tudo (focusBounds ausente).
  // Três tetos distintos (calibrados no smoke 10/07): endereço = MAX-1, parada
  // desagrupada = MAX, parada agrupada = MAX-2.
  it("zoom do foco por CONTEXTO: endereço 1 nível antes do máximo, desagrupado no máximo, parada agrupada 2 antes", () => {
    startRoteiroFlow();
    const stub = screen.getByTestId("route-map-stub");

    // Endereço livre selecionado (tela 8 / parada sugerida) → o ENDEREÇO.
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    expect(stub.getAttribute("data-focus-bounds")).toBe("1");
    expect(stub.getAttribute("data-focus-zoom")).toBe(String(ADDRESS_MAX_ZOOM));

    // Parada firmada e AGRUPADA (1 clique) → os 2 endereços, 2 níveis antes do máximo.
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    expect(stub.getAttribute("data-focus-bounds")).toBe("2");
    expect(stub.getAttribute("data-focus-zoom")).toBe(String(FOCUS_MAX_ZOOM));

    // DESAGRUPADA (2 cliques) → mesmo enquadramento, agora no zoom máximo.
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-dbltap" }));
    expect(stub.getAttribute("data-focus-bounds")).toBe("2");
    expect(stub.getAttribute("data-focus-zoom")).toBe(String(MAP_CONFIG.ZOOM.MAX));

    // Tocar um MEMBRO da parada desagrupada é escolher um ENDEREÇO: enquadra ELE
    // (1 ponto), não a parada inteira — senão o "endereço selecionado" ficava com
    // o zoom da parada agrupada (RF-006.4.21).
    fireEvent.click(screen.getByRole("button", { name: "stub-second-point-tap" }));
    expect(stub.getAttribute("data-focus-bounds")).toBe("1");
    expect(stub.getAttribute("data-focus-zoom")).toBe(String(ADDRESS_MAX_ZOOM));
  });

  it("desagrupado: tocar qualquer membro seleciona-o — destaque no mapa e no painel (RF-006.4.16)", () => {
    startRoteiroFlow();
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" })); // focar a parada
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-dbltap" })); // desagrupa no mapa
    const stub = screen.getByTestId("route-map-stub");

    // Sem membro escolhido: o painel mostra a ÂNCORA e o mapa destaca o 1º membro.
    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED_ANCHOR)).toBeInTheDocument();
    const anchorHighlighted = stub.getAttribute("data-highlighted-model");
    expect(anchorHighlighted).not.toBe("none");

    // Tocar o 2º membro → seleciona-o: o destaque do mapa migra e o painel troca
    // para 'Endereço selecionado' (sem o sufixo da âncora).
    fireEvent.click(screen.getByRole("button", { name: "stub-second-point-tap" }));
    const memberHighlighted = stub.getAttribute("data-highlighted-model");
    expect(memberHighlighted).not.toBe("none");
    expect(memberHighlighted).not.toBe(anchorHighlighted);
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED_ANCHOR)).not.toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED)).toBeInTheDocument();

    // Clicar fora regrupa e volta para a âncora (RF-006.4.16).
    fireEvent.click(screen.getByRole("button", { name: "stub-map-tap" }));
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-dbltap" }));
    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED_ANCHOR)).toBeInTheDocument();
  });

  it("Editar desagrupa a parada no mapa (membros como círculos) e o toque no mapa não faz toggle (RF-006.4.9)", () => {
    startRoteiroFlow();
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" })); // focar a parada
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.ROTEIRO_STOP.EDIT }));
    expect(screen.getByText(UI_LABELS.MAP_PANEL.MODE_DRAFT)).toBeInTheDocument();

    // Desagrupado: SEM quadrado da parada; membros como círculos + o órfão p3.
    const stub = screen.getByTestId("route-map-stub");
    expect(stub.getAttribute("data-models-summary")).toBe("address*,address*,address");

    // Toque no mapa durante a edição NÃO adiciona/remove (RF-006.4.9): a lista
    // de escolhidos não muda (o "Faltando" saiu da edição — RF-006.4.25).
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" })); // toca um membro → no-op
    fireEvent.click(screen.getByRole("button", { name: "stub-third-point-tap" })); // toca o órfão → SELECIONA (não edita — RF-006.4.23)
    expect(screen.queryByRole("button", { name: DRAFT_LABELS.REMOVE_POINT("Rua Gama, 30") })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: DRAFT_LABELS.REMOVE_POINT("Rua Mapa, 10") })).toBeInTheDocument();
  });

  // RF-006.4.23 (achado nº 1 do smoke): o toque OLHA, o botão EDITA. Era o único
  // beco sem saída da edição — sem candidato no raio, nada adicionava um endereço.
  it("edição: tocar endereço livre seleciona (foco+painel) e 'Adicionar a esta parada' o inclui (RF-006.4.23)", () => {
    startRoteiroFlow();
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP })); // P1 = p1+p2
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" })); // foca a parada
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.ROTEIRO_STOP.EDIT }));
    const stub = screen.getByTestId("route-map-stub");

    // Entrar na edição MANTÉM o quadro da parada no zoom de parada (RF-006.4.24)
    // — antes o foco caía para null e o mapa reenquadrava a rota inteira.
    expect(stub.getAttribute("data-focus-bounds")).toBe("2");
    expect(stub.getAttribute("data-focus-zoom")).toBe(String(FOCUS_MAX_ZOOM));

    // Toca o órfão p3 (a ~555m — fora do raio de 30m): SELECIONA, sem editar.
    fireEvent.click(screen.getByRole("button", { name: "stub-third-point-tap" }));
    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED)).toBeInTheDocument();
    expect(screen.getByText("Rua Gama, 30")).toBeInTheDocument();
    // Intocado: p3 selecionado mas NÃO membro (o − dele não existe na lista).
    expect(screen.queryByRole("button", { name: DRAFT_LABELS.REMOVE_POINT("Rua Gama, 30") })).not.toBeInTheDocument();
    // Cromagem + foco de endereço no ponto tocado (marcador destacado, zoom de endereço).
    expect(stub.getAttribute("data-highlighted-model")).not.toBe("none");
    expect(stub.getAttribute("data-focus-bounds")).toBe("1");
    expect(stub.getAttribute("data-focus-zoom")).toBe(String(ADDRESS_MAX_ZOOM));

    // O CTA edita: p3 vira membro (3º da ordem a pé), o RN-17 avisa (longe da
    // âncora) e a seção some. O "Faltando" do HUD só cai no COMMIT — durante o
    // REOPEN a parada antiga segue em `stops` e o draft é uma cópia.
    fireEvent.click(screen.getByRole("button", { name: DRAFT_LABELS.ADD_TO_STOP }));
    expect(screen.getByRole("button", { name: DRAFT_LABELS.REMOVE_POINT("Rua Gama, 30") })).toBeInTheDocument(); // na lista de escolhidos
    expect(screen.getByText(DRAFT_LABELS.FAR_WARNING)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: DRAFT_LABELS.ADD_TO_STOP })).not.toBeInTheDocument();
    // A seleção é MANTIDA para o foco não cair para a rota inteira no meio da edição.
    expect(stub.getAttribute("data-focus-bounds")).toBe("1");

    // Salvar consolida: o HUD zera E a parada volta selecionada (RF-006.4.24) —
    // painel no resumo, foco no quadro dela (agora 3 membros), sem zoom-out.
    fireEvent.click(screen.getByRole("button", { name: DRAFT_LABELS.SAVE }));
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ROTEIRO_REMAINING(0, 0))).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_STOP)).toBeInTheDocument();
    expect(stub.getAttribute("data-focus-bounds")).toBe("3");
  });

  it("o círculo do preview segue o stepper de raio (RF-006.4.6)", () => {
    startRoteiroFlow();
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" })); // p1, raio 30
    const stub = screen.getByTestId("route-map-stub");
    expect(stub).toHaveAttribute("data-radius-circle", "-22.9,-43.2@30");
    expect(screen.getByText("2 endereços")).toBeInTheDocument(); // p1 + p2 (p3 longe demais)

    // O círculo acompanha o stepper (o clamp no máximo é coberto por RoteiroDraftSection.test).
    fireEvent.click(screen.getByRole("button", { name: DRAFT_LABELS.RADIUS_INCREASE }));
    expect(stub).toHaveAttribute("data-radius-circle", "-22.9,-43.2@40");
    fireEvent.click(screen.getByRole("button", { name: DRAFT_LABELS.RADIUS_DECREASE }));
    fireEvent.click(screen.getByRole("button", { name: DRAFT_LABELS.RADIUS_DECREASE }));
    expect(stub).toHaveAttribute("data-radius-circle", "-22.9,-43.2@20");
  });

  it("shows the error state when the manifest cannot be reopened", () => {
    uploaderState.routes = null;
    uploaderState.error = UI_LABELS.FILE_UPLOADER.MANIFEST_NOT_FOUND;

    renderPage("/mapa?romaneio=nao-existe&rota=A-1");

    expect(screen.getByText(UI_LABELS.FILE_UPLOADER.MANIFEST_NOT_FOUND)).toBeInTheDocument();
    expect(screen.queryByTestId("route-map-stub")).not.toBeInTheDocument();
    expect(screen.queryByTestId("vaul-root")).not.toBeInTheDocument();
  });

  it("redirects to the Rotas tab when the URL is malformed", () => {
    renderPage("/mapa");

    expect(screen.getByTestId("rotas-page-stub")).toBeInTheDocument();
    expect(uploaderState.loadManifest).not.toHaveBeenCalled();
  });
});
