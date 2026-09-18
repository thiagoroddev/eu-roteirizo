import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { UI_LABELS, COLUMN_NAMES, MAP_CONFIG, FOCUS_MAX_ZOOM, ADDRESS_MAX_ZOOM } from "../../constants";
import type { RowData } from "../../types";
import { DEFAULT_ROUTING_CONFIG, type LatLng, type PlannedRoute } from "../../types/routing";
import type { InteractionState, MarkerModel } from "../../utils/markers/markerModels";
import { driveLegLabel } from "../../utils/markers/roteiroModels";
import { haversine } from "../../utils/routing/geo";
import { squareGraph } from "../utils/routing/__fixtures__/syntheticGraph";

// routeStorage (RF-008) is mocked so the tests CONTROL what is persisted:
// `saved` feeds the mount-time hydration; `saveCalls` records the auto-saves.
const { routeStorageState } = vi.hoisted(() => ({
  routeStorageState: {
    saved: null as PlannedRoute | null,
    saveCalls: [] as PlannedRoute[],
    saveSummaryCalls: [] as { manifestId: string; routeName: string; summary: import("../../types/routing").RoteiroSummary }[],
    deleteCalls: 0,
  },
}));
vi.mock("../../services/routeStorage", () => ({
  getRoteiro: vi.fn(() => Promise.resolve(routeStorageState.saved)),
  saveRoteiro: vi.fn((_manifestId: string, _routeName: string, route: PlannedRoute) => {
    routeStorageState.saveCalls.push(route);
    return Promise.resolve({ status: "saved" as const });
  }),
  saveRoteiroSummary: vi.fn((manifestId: string, routeName: string, summary: import("../../types/routing").RoteiroSummary) => {
    routeStorageState.saveSummaryCalls.push({ manifestId, routeName, summary });
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
    onStartTap,
    onAnchorDragEnd,
    onAnchorTap,
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
    onStartTap?: () => void;
    onAnchorDragEnd?: (latlng: LatLng) => void;
    onAnchorTap?: () => void;
    roteiroOverlay?: {
      start: LatLng | null;
      suggestionPath: LatLng[] | null;
      radiusCircle?: { center: LatLng; meters: number } | null;
      anchor?: LatLng | null;
      vehicleRoute?: LatLng[][] | null;
      vehicleRouteHighlight?: LatLng[] | null;
      footCircuit?: LatLng[] | null;
      suggestionFaded?: boolean;
    };
  }) => (
    <div
      data-testid="route-map-stub"
      data-vehicle-route={String(roteiroOverlay?.vehicleRoute?.length ?? "none")}
      data-vehicle-highlight={
        roteiroOverlay?.vehicleRouteHighlight?.length
          ? [roteiroOverlay.vehicleRouteHighlight[0], roteiroOverlay.vehicleRouteHighlight[roteiroOverlay.vehicleRouteHighlight.length - 1]].map((p) => `${p.lat},${p.lng}`).join(">")
          : "none"
      }
      data-foot-circuit={String(roteiroOverlay?.footCircuit?.length ?? "none")}
      data-suggestion-faded={String(roteiroOverlay?.suggestionFaded ?? false)}
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
      <button type="button" onClick={() => onStartTap?.()}>
        stub-start-tap
      </button>
      {/* Drops the anchor car just NORTH of p2 (rowsThreePoints geometry): both
          members end due south → the sweep re-orders to [p2, p1] (RF-006.5). */}
      <button type="button" onClick={() => onAnchorDragEnd?.({ lat: -22.9002, lng: -43.2 })}>
        stub-anchor-drag
      </button>
      {/* Drops the car nearer p1 (-22.9): p1 becomes the nearest → order flips
          from [p2, p1] to [p1, p2], so the reorder aviso fires (RF-006.17). */}
      <button type="button" onClick={() => onAnchorDragEnd?.({ lat: -22.90005, lng: -43.2 })}>
        stub-anchor-drag-near-p1
      </button>
      {/* Taps the anchor car (selectable when ungrouped — RF-006.17). */}
      <button type="button" onClick={() => onAnchorTap?.()}>
        stub-anchor-tap
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
const OVERVIEW_LABELS = UI_LABELS.MAP_PANEL.ROTEIRO_OVERVIEW;

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
    routeStorageState.saveSummaryCalls = [];
    routeStorageState.deleteCalls = 0;
  });

  it("loads the manifest from the URL and renders the CONTROLLED map", () => {
    renderPage();

    expect(uploaderState.loadManifest).toHaveBeenCalledWith("hash-1", "A-1");
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

  it("switching to 'Meu roteiro' shows the concise progress header and feeds the map external models", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_MODE.MY_ROTEIRO }));

    // Concise header (RF-006.8): percent + bar — the old two-line "Faltando"
    // HUD is gone; since RF-006.11 the stat cards live ONLY in "Ver detalhes"
    // (the idle body is just the suggested-next-stop card).
    expect(screen.queryByText(/^Faltando:/)).not.toBeInTheDocument();
    expect(screen.getByText(OVERVIEW_LABELS.PERCENT(0))).toBeInTheDocument();
    expect(screen.getAllByRole("progressbar").length).toBeGreaterThan(0);
    expect(screen.queryByText(OVERVIEW_LABELS.STAT_COUNT(0, 1))).not.toBeInTheDocument();
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
    expect(screen.getAllByText(OVERVIEW_LABELS.PERCENT(0)).length).toBeGreaterThan(0);
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
    // Settled: the definition section leaves; the idle body is the suggested-
    // next-stop CARD (RF-006.11) with the seed address + the qualified leg.
    expect(screen.queryByText(START_LABELS.SECTION)).not.toBeInTheDocument();
    const stub = screen.getByTestId("route-map-stub");
    expect(stub).toHaveAttribute("data-overlay-start", "-22.95,-43.19");
    // Straight-line fallback (graph null): 2-point dashed path + "(linha reta)".
    expect(stub).toHaveAttribute("data-suggestion-points", "2");
    expect(screen.getByText(OVERVIEW_LABELS.SECTION_NEXT)).toBeInTheDocument();
    expect(screen.getByText("Rua Mapa, 10")).toBeInTheDocument();
    expect(screen.getByText(/Distância até aqui: .+ \(linha reta\)/)).toBeInTheDocument();
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
    expect(screen.queryByText(START_LABELS.SECTION)).not.toBeInTheDocument();
    expect(stub).toHaveAttribute("data-overlay-start", "-22.9,-43.2");
  });

  it("with a start, tapping a point RE-POINTS the suggestion (dashed line follows; no text line in the point context)", () => {
    uploaderState.routes = { "A-1": rowsStop1TwoAddresses };
    renderPage("/mapa?romaneio=hash-1&rota=A-1&modo=roteiro");
    fireEvent.click(screen.getByRole("button", { name: START_LABELS.ARM_MAP_TAP }));
    fireEvent.click(screen.getByRole("button", { name: "stub-map-tap" }));

    // Automatic target = nearest to the start (-22.95,-43.19) → "Rua Beta, 20",
    // shown as the idle suggested-next-stop CARD (RF-006.11).
    expect(screen.getByText(OVERVIEW_LABELS.SECTION_NEXT)).toBeInTheDocument();
    expect(screen.getByText("Rua Beta, 20")).toBeInTheDocument();

    // Tapping p1 re-points the dashed line to it (§6); the card leaves with the
    // selection (suggestion never renders alongside a selected address) and the
    // "Prévia de parada" section carries the information now.
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-suggestion-target", "-22.9,-43.2");
    expect(screen.queryByText(OVERVIEW_LABELS.SECTION_NEXT)).not.toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_SUGGESTED)).toBeInTheDocument();
  });

  it("GPS success inside Rio defines the start", () => {
    mockGeolocation((ok) => ok({ coords: { latitude: -22.93, longitude: -43.2 } }));
    renderPage("/mapa?romaneio=hash-1&rota=A-1&modo=roteiro");

    fireEvent.click(screen.getByRole("button", { name: START_LABELS.USE_GPS }));

    expect(screen.queryByText(START_LABELS.SECTION)).not.toBeInTheDocument();
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

  it("start selecionado: 'Mudar posição' arma o toque mantendo o carro; um novo toque o reposiciona (RF-006.14)", () => {
    renderPage("/mapa?romaneio=hash-1&rota=A-1&modo=roteiro");
    fireEvent.click(screen.getByRole("button", { name: START_LABELS.ARM_MAP_TAP }));
    fireEvent.click(screen.getByRole("button", { name: "stub-map-tap" })); // início em -22.95,-43.19
    expect(screen.queryByText(START_LABELS.SECTION)).not.toBeInTheDocument();

    // Tocar o carro do início seleciona-o (parada 0); "Mudar posição" arma o
    // toque (mesmo evento de "Tocar no mapa") SEM apagar — o carro permanece.
    fireEvent.click(screen.getByRole("button", { name: "stub-start-tap" }));
    expect(screen.getByText(OVERVIEW_LABELS.SECTION_START)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: START_LABELS.REPOSITION_START }));
    expect(screen.getByText(START_LABELS.ARMED_HINT)).toBeInTheDocument();
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-overlay-start", "-22.95,-43.19");

    // Novo toque reposiciona o início (o stub-map-tap solta em -22.95,-43.19 de
    // novo; o importante é que continua definido e a seção de definição some).
    fireEvent.click(screen.getByRole("button", { name: "stub-map-tap" }));
    expect(screen.queryByText(START_LABELS.SECTION)).not.toBeInTheDocument();
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-overlay-start", "-22.95,-43.19");
  });

  it("start selecionado: 'Apagar início' remove o carro e volta à definição (RF-006.14)", () => {
    renderPage("/mapa?romaneio=hash-1&rota=A-1&modo=roteiro");
    fireEvent.click(screen.getByRole("button", { name: START_LABELS.ARM_MAP_TAP }));
    fireEvent.click(screen.getByRole("button", { name: "stub-map-tap" }));
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-overlay-start", "-22.95,-43.19");

    fireEvent.click(screen.getByRole("button", { name: "stub-start-tap" }));
    fireEvent.click(screen.getByRole("button", { name: START_LABELS.DELETE_START }));
    // O carro some e o painel volta a oferecer GPS / Tocar no mapa.
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-overlay-start", "none");
    expect(screen.getByText(START_LABELS.SECTION)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: START_LABELS.ARM_MAP_TAP })).toBeInTheDocument();
  });

  it("switching modes resets the ephemeral start UI but keeps the defined start", () => {
    renderPage("/mapa?romaneio=hash-1&rota=A-1&modo=roteiro");
    fireEvent.click(screen.getByRole("button", { name: START_LABELS.ARM_MAP_TAP }));
    fireEvent.click(screen.getByRole("button", { name: "stub-map-tap" }));

    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_MODE.ORIGINAL }));
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_MODE.MY_ROTEIRO }));

    // Not armed, not confirming: straight to has-start (the reducer kept the
    // start — its marker stays; the definition section is gone).
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-overlay-start", "-22.95,-43.19");
    expect(screen.queryByText(START_LABELS.SECTION)).not.toBeInTheDocument();
    expect(screen.queryByText(START_LABELS.ARMED_HINT)).not.toBeInTheDocument();
  });

  it("shows the discreet graph status while loading and the retry on error", () => {
    roadGraphState.status = "loading";
    renderPage("/mapa?romaneio=hash-1&rota=A-1&modo=roteiro");
    expect(screen.getByText(UI_LABELS.ROUTING.LOADING_STREETS)).toBeInTheDocument();
  });

  it("BG-011: informa aproximacao sem ruas e permite tentar novamente", () => {
    roadGraphState.status = "error";
    roadGraphState.error = UI_LABELS.ROUTING.TIMEOUT;
    renderPage("/mapa?romaneio=hash-1&rota=A-1&modo=roteiro");
    expect(screen.getByText(`${UI_LABELS.ROUTING.TIMEOUT} ${UI_LABELS.ROUTING.APPROXIMATE_PATH}`)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.ROUTING.RETRY }));
    expect(roadGraphState.retry).toHaveBeenCalled();
  });

  // ==========================================================================
  // Ponto órfão + rascunho da parada (TASK-RF-006.4 — telas 8–9)
  // ==========================================================================

  const POINT_LABELS = UI_LABELS.MAP_PANEL.ROTEIRO_POINT;
  const DRAFT_LABELS = UI_LABELS.MAP_PANEL.ROTEIRO_DRAFT;

  /** Enters the roteiro over the 3-point fixture and defines the start by tap.
      "Início definido" left the idle header (RF-006.11) — the settled start is
      observable by its map marker + the definition section being gone. */
  const startRoteiroFlow = () => {
    uploaderState.routes = { "A-1": rowsThreePoints };
    renderPage("/mapa?romaneio=hash-1&rota=A-1&modo=roteiro");
    fireEvent.click(screen.getByRole("button", { name: START_LABELS.ARM_MAP_TAP }));
    fireEvent.click(screen.getByRole("button", { name: "stub-map-tap" }));
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-overlay-start", "-22.95,-43.19");
    expect(screen.queryByText(START_LABELS.SECTION)).not.toBeInTheDocument();
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

    // A parada volta como quadrado no mapa e o início como marcador definido.
    await waitFor(() => expect(screen.getByTestId("route-map-stub").getAttribute("data-models-summary")).toContain("stop"));
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-overlay-start", "-22.9,-43.2");
    expect(screen.queryByText(START_LABELS.SECTION)).not.toBeInTheDocument();
  });

  // ------- Navegação ‹ › entre paradas firmadas (TASK-RF-044, RF-58) -------

  const savedRoute = (stops: PlannedRoute["stops"]): PlannedRoute => ({
    id: "route_saved",
    startPoint: { lat: -22.9, lng: -43.2 },
    stops,
    config: DEFAULT_ROUTING_CONFIG,
    createdAt: "2026-07-10T10:00:00.000Z",
  });
  const P1 = { id: "stop_1", order: 1, vehicleStop: { lat: -22.9, lng: -43.2 }, pointIds: ["pt_-22.90000,-43.20000", "pt_-22.90015,-43.20000"], radiusMeters: 30 };
  const P2 = { id: "stop_2", order: 2, vehicleStop: { lat: -22.905, lng: -43.2 }, pointIds: ["pt_-22.90500,-43.20000"], radiusMeters: 30 };

  it("Meu roteiro: parada anterior/proxima percorre as paradas firmadas em ciclo", async () => {
    uploaderState.routes = { "A-1": rowsThreePoints };
    routeStorageState.saved = savedRoute([P1, P2]);
    renderPage("/mapa?romaneio=hash-1&rota=A-1&modo=roteiro");
    await waitFor(() => expect(screen.getByTestId("route-map-stub").getAttribute("data-models-summary")).toContain("stop"));

    const stub = screen.getByTestId("route-map-stub");
    const next = () => fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.NEXT_STOP }));
    const prev = () => fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.PREV_STOP }));

    // Nothing selected yet: › goes to the FIRST stop, and the map frames its two addresses.
    next();
    expect(stub).toHaveAttribute("data-focus-bounds", "2");
    next(); // P2: one address
    expect(stub).toHaveAttribute("data-focus-bounds", "1");
    next(); // last → P1 (visualização cicla)
    expect(stub).toHaveAttribute("data-focus-bounds", "2");
    prev(); // P1 → last
    expect(stub).toHaveAttribute("data-focus-bounds", "1");
  });

  it("Meu roteiro: a parada selecionada destaca a perna que sai dela; a última fica sem destaque (RF-043)", async () => {
    uploaderState.routes = { "A-1": rowsThreePoints };
    routeStorageState.saved = savedRoute([P1, P2]);
    renderPage("/mapa?romaneio=hash-1&rota=A-1&modo=roteiro");
    await waitFor(() => expect(screen.getByTestId("route-map-stub").getAttribute("data-models-summary")).toContain("stop"));

    const stub = screen.getByTestId("route-map-stub");
    const next = () => fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.NEXT_STOP }));
    const prev = () => fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.PREV_STOP }));

    // Start → P1 and P1 → P2 are separate legs; with no stop selected nothing is highlighted.
    expect(stub).toHaveAttribute("data-vehicle-route", "2");
    expect(stub).toHaveAttribute("data-vehicle-highlight", "none");

    next(); // P1: the leg that LEAVES it, towards P2
    expect(stub).toHaveAttribute("data-vehicle-highlight", "-22.9,-43.2>-22.905,-43.2");
    next(); // P2 is the last stop: no leg leaves it
    expect(stub).toHaveAttribute("data-vehicle-highlight", "none");
    prev(); // back to P1
    expect(stub).toHaveAttribute("data-vehicle-highlight", "-22.9,-43.2>-22.905,-43.2");

    // Editing opens a draft: the foot circuit follows the draft and the highlight steps aside.
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.ROTEIRO_STOP.EDIT }));
    expect(stub).toHaveAttribute("data-vehicle-highlight", "none");
  });

  it("Ver detalhes mostra no trilho a distância do veículo entre as paradas (RF-045)", async () => {
    uploaderState.routes = { "A-1": rowsThreePoints };
    routeStorageState.saved = savedRoute([P1, P2]);
    renderPage("/mapa?romaneio=hash-1&rota=A-1&modo=roteiro");
    await waitFor(() => expect(screen.getByTestId("route-map-stub").getAttribute("data-models-summary")).toContain("stop"));

    fireEvent.click(screen.getByRole("button", { name: OVERVIEW_LABELS.VIEW_DETAILS }));

    // Start → P1 and P1 → P2: the SAME legs the map draws (no graph here → straight lines).
    const legs = screen.getAllByLabelText(UI_LABELS.MAP_PANEL.DRIVE_LEG_ARIA);
    expect(legs).toHaveLength(2);
    expect(legs[0]).toHaveTextContent(driveLegLabel({ meters: 0, viaStreets: false }));
    expect(legs[1]).toHaveTextContent(driveLegLabel({ meters: haversine(P1.vehicleStop, P2.vehicleStop), viaStreets: false }));
  });

  it("grava o resumo do roteiro ao abrir 'Ver detalhes' quando a malha viária está disponível (RF-61 / TASK-RF-047)", async () => {
    roadGraphState.graph = squareGraph;
    uploaderState.routes = { "A-1": rowsThreePoints };
    routeStorageState.saved = savedRoute([P1, P2]);
    renderPage("/mapa?romaneio=hash-1&rota=A-1&modo=roteiro");
    await waitFor(() => expect(screen.getByTestId("route-map-stub").getAttribute("data-models-summary")).toContain("stop"));

    fireEvent.click(screen.getByRole("button", { name: OVERVIEW_LABELS.VIEW_DETAILS }));

    await waitFor(() => {
      expect(routeStorageState.saveSummaryCalls.length).toBeGreaterThan(0);
    });

    const lastCall = routeStorageState.saveSummaryCalls[routeStorageState.saveSummaryCalls.length - 1];
    expect(lastCall.manifestId).toBe("hash-1");
    expect(lastCall.routeName).toBe("A-1");
    expect(lastCall.summary.stops).toBe(2);
    expect(typeof lastCall.summary.vehicleMeters).toBe("number");
    expect(typeof lastCall.summary.walkMeters).toBe("number");
    expect(typeof lastCall.summary.totalMinutes).toBe("number");
    expect(typeof lastCall.summary.progressRatio).toBe("number");
    expect(typeof lastCall.summary.computedAt).toBe("string");
  });

  it("Meu roteiro: com uma parada so as setas ficam desativadas", async () => {
    uploaderState.routes = { "A-1": rowsThreePoints };
    // No firmed stop: no arrows at all.
    const semParada = renderPage("/mapa?romaneio=hash-1&rota=A-1&modo=roteiro");
    expect(screen.queryByRole("button", { name: UI_LABELS.MAP_PANEL.NEXT_STOP })).not.toBeInTheDocument();
    semParada.unmount();

    routeStorageState.saved = savedRoute([P1]);
    renderPage("/mapa?romaneio=hash-1&rota=A-1&modo=roteiro");
    await waitFor(() => expect(screen.getByTestId("route-map-stub").getAttribute("data-models-summary")).toContain("stop"));
    expect(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.PREV_STOP })).toBeDisabled();
    expect(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.NEXT_STOP })).toBeDisabled();
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
    expect(screen.getByText("P1")).toBeInTheDocument();
    expect(screen.getByText("Rua Mapa, 10")).toBeInTheDocument();
    const stub = screen.getByTestId("route-map-stub");
    // The stop is a grouped, SELECTED square on the map (p1 + p2 from the radius).
    expect(stub.getAttribute("data-models-summary")).toContain("stop*");
    // Only p3 remains free (2 of 3 committed → 67%); the preview circle is gone.
    expect(screen.getByText(OVERVIEW_LABELS.PERCENT(2 / 3))).toBeInTheDocument();
    expect(stub).toHaveAttribute("data-radius-circle", "none");
  });

  it("os candidatos do raio entram AUTOMATICAMENTE na parada ao criar (reverte §8 — RF-006.4.6)", () => {
    startRoteiroFlow();
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" })); // p1

    // The preview already aggregates seed + radius candidate → "2 endereços".
    expect(screen.getByText("2 endereços")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));

    // The firmed stop holds BOTH p1 and p2 — no manual add needed anymore.
    expect(screen.getByText("P1")).toBeInTheDocument();
    expect(screen.getByText("Rua Mapa, 10")).toBeInTheDocument();
    expect(screen.getByText("2 endereços")).toBeInTheDocument();
    expect(screen.getByText(/~\d+ min/)).toBeInTheDocument();
    // Only p3 stays free (p1 + p2 committed → 67%).
    expect(screen.getByText(OVERVIEW_LABELS.PERCENT(2 / 3))).toBeInTheDocument();
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

    // Criar com o raio reduzido → parada só com p1; p2 e p3 seguem livres (33%).
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));
    expect(screen.getByText(OVERVIEW_LABELS.PERCENT(1 / 3))).toBeInTheDocument();
  });

  it("criar P1 e depois P2 firmam direto (épico acceptance: criar P1, P2… e ver firmar)", () => {
    startRoteiroFlow();
    // P1: tocar p1 → Criar comita p1 + p2 (o raio 30 engloba p2).
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));

    const stub = screen.getByTestId("route-map-stub");
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.MODE_DRAFT)).not.toBeInTheDocument();
    expect(screen.getByText(OVERVIEW_LABELS.PERCENT(2 / 3))).toBeInTheDocument();
    expect(stub.getAttribute("data-models-summary")).toContain("stop");

    // P2 sobre o ponto restante (models = [stop, p3] → segundo botão).
    fireEvent.click(screen.getByRole("button", { name: "stub-second-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));

    expect(screen.getByText(OVERVIEW_LABELS.PERCENT(1))).toBeInTheDocument();
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

    // Cancel descarta o draft; a parada firmada (p1 + p2) permanece intacta (67%).
    fireEvent.click(screen.getByRole("button", { name: DRAFT_LABELS.CANCEL }));
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.MODE_DRAFT)).not.toBeInTheDocument();
    expect(screen.getByText(OVERVIEW_LABELS.PERCENT(2 / 3))).toBeInTheDocument();
  });

  it("incorporates an orphan into the nearest stop (on-demand select, nearest pre-set)", () => {
    startRoteiroFlow();
    // Criar P1 comita p1 + p2 (raio 30) — o único órfão passa a ser p3.
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));

    // Selecionar p3 (models = [stop, p3] → segundo botão); o select só aparece
    // ON DEMAND e pré-seleciona a Parada 1 (a única/mais próxima, já com 2 endereços).
    fireEvent.click(screen.getByRole("button", { name: "stub-second-point-tap" }));
    expect(screen.queryByRole("combobox", { name: POINT_LABELS.TARGET_STOP_ARIA })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.INCORPORATE_OTHER }));
    const select = screen.getByRole("combobox", { name: POINT_LABELS.TARGET_STOP_ARIA });
    expect(select).toBeInTheDocument();
    expect(screen.getByText(POINT_LABELS.STOP_OPTION(1, 2))).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CONFIRM }));
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.ROTEIRO_NO_STOP_YET)).not.toBeInTheDocument();
    // p3 entrou na parada → nada livre: 100% no header e, COMPLETO, o card da
    // sugestão não existe (RF-006.11 — o estado "Iniciar execução" é RF-009).
    expect(screen.getByText(OVERVIEW_LABELS.PERCENT(1))).toBeInTheDocument();
    expect(screen.queryByText(OVERVIEW_LABELS.SECTION_NEXT)).not.toBeInTheDocument();
  });

  it("tapping a committed stop opens its Original-style panel; Editar reopens the draft; Desfazer frees (RF-006.4.2)", () => {
    startRoteiroFlow();
    // Criar P1 comita p1 + p2 direto (o raio 30 engloba p2 — RF-006.4.6).
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));

    // Tap the committed stop (models = [stop, p3] → first button).
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_STOP)).toBeInTheDocument();
    expect(screen.getByText("P1")).toBeInTheDocument();
    expect(screen.getByText("Rua Mapa, 10")).toBeInTheDocument();
    // Chips include the walking estimate.
    expect(screen.getByText(/~\d+ min/)).toBeInTheDocument();
    expect(screen.getByText("2 endereços")).toBeInTheDocument();
    // Parada agrupada: o card Endereço selecionado NÃO aparece (RF-53)
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED)).not.toBeInTheDocument();

    // Editar → back to the edit draft: the body is the Original's full-list
    // structure now (rev. 08/07 3ª rodada) — members carry the walking ordinal
    // in the mini-marker and a remove (−) trailing action per row.
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.ROTEIRO_STOP.EDIT }));
    expect(screen.getByText(UI_LABELS.MAP_PANEL.MODE_DRAFT)).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ORDINAL(1))).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ORDINAL(2))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: DRAFT_LABELS.REMOVE_POINT("Rua Mapa, 10") })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: DRAFT_LABELS.SAVE }));

    // Desfazer → the addresses go back to free, the progress drops to 0% and
    // the idle panel offers the next suggestion as a card (RF-006.11).
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.ROTEIRO_STOP.DISSOLVE }));
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.SECTION_STOP)).not.toBeInTheDocument();
    expect(screen.getByText(OVERVIEW_LABELS.PERCENT(0))).toBeInTheDocument();
    expect(screen.getByText(OVERVIEW_LABELS.SECTION_NEXT)).toBeInTheDocument();
  });

  // ==========================================================================
  // Visão geral do roteiro (TASK-RF-006.8, v2 na RF-006.11) — painel de estudo
  // ==========================================================================

  it("ocioso ENXUTO (RF-006.11): só o cabeçalho + o card 'Próxima parada sugerida'; o CTA comita a sugerida", () => {
    startRoteiroFlow(); // início definido, nada selecionado → contexto ocioso

    // Corpo = SÓ o card da sugestão (endereço da semente, sem número de parada);
    // a visão completa (progresso/paradas) vive no "Ver detalhes".
    expect(screen.queryByText(OVERVIEW_LABELS.SECTION_PROGRESS)).not.toBeInTheDocument();
    expect(screen.queryByText(OVERVIEW_LABELS.NO_STOPS)).not.toBeInTheDocument();
    expect(screen.getByText(OVERVIEW_LABELS.SECTION_NEXT)).toBeInTheDocument();
    expect(screen.getByText("Rua Gama, 30")).toBeInTheDocument(); // seed p3, o mais próximo do início
    // Distância de VEÍCULO até a âncora sugerida, qualificada (reta sem grafo).
    expect(screen.getByText(/Distância até aqui: .+ \(linha reta\)/)).toBeInTheDocument();
    // A linha "Início definido | Redefinir" saiu do ocioso (RF-006.11).
    expect(screen.queryByText(START_LABELS.DEFINED)).not.toBeInTheDocument();

    // O CTA comita a sugerida na hora — o mesmo commit da tela 8 — e foca a
    // parada firmada (o card some: há seleção agora).
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));
    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_STOP)).toBeInTheDocument();
    expect(screen.getByText(OVERVIEW_LABELS.PERCENT(1 / 3))).toBeInTheDocument();
    expect(screen.queryByText(OVERVIEW_LABELS.SECTION_NEXT)).not.toBeInTheDocument();
    expect(screen.getByTestId("route-map-stub").getAttribute("data-models-summary")).toContain("stop*");
  });

  it("'Ver detalhes' = estado dedicado LIMPO (RF-006.11): 3 seções com parada 0 e totais; 'Ver no mapa' volta à parada", () => {
    startRoteiroFlow();
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP })); // P1 = p1+p2, selecionada

    fireEvent.click(screen.getByRole("button", { name: OVERVIEW_LABELS.VIEW_DETAILS }));
    // Painel a full e SEM as seções do contexto (a parada estava selecionada):
    // só progresso (com a subseção Detalhes/totais), confirmadas (com a parada
    // 0 = o início) e o card da sugestão por último.
    expect(screen.getByTestId("vaul-root")).toHaveAttribute("data-active-snap", "0.85");
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.SECTION_STOP)).not.toBeInTheDocument();
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED)).not.toBeInTheDocument();
    expect(screen.getByText(OVERVIEW_LABELS.SECTION_PROGRESS)).toBeInTheDocument();
    expect(screen.getAllByText(OVERVIEW_LABELS.STAT_COUNT(2, 3))).toHaveLength(2);
    // RF-006.20: 3º stat card PARADAS + os cards Duração/Distância/Comercial.
    expect(screen.getByText(OVERVIEW_LABELS.STAT_STOPS)).toBeInTheDocument();
    expect(screen.getByText(OVERVIEW_LABELS.CARD_DURATION)).toBeInTheDocument();
    expect(screen.getByText(OVERVIEW_LABELS.CARD_DISTANCE)).toBeInTheDocument();
    expect(screen.getByText(OVERVIEW_LABELS.CARD_COMMERCIAL)).toBeInTheDocument();
    // Parada 0: o início por toque (sem endereço) + os dois gestos (RF-006.14).
    expect(screen.getByText(START_LABELS.DEFINED)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: START_LABELS.DELETE_START })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: START_LABELS.REPOSITION_START })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: OVERVIEW_LABELS.STOP_ARIA(1) })).toBeInTheDocument();
    // A sugestão é o CARD com o endereço da semente (p3) — sem "Parada N".
    expect(screen.getByText(OVERVIEW_LABELS.SECTION_NEXT)).toBeInTheDocument();
    expect(screen.getByText("Rua Gama, 30")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: OVERVIEW_LABELS.HIDE_DETAILS })).toBeInTheDocument();

    // Expandir a parada confirmada → os endereços por ordinal (o MESMO
    // StopItemList do Original — nada de card novo).
    fireEvent.click(screen.getByRole("button", { name: OVERVIEW_LABELS.STOP_ARIA(1) }));
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ORDINAL(1))).toBeInTheDocument();
    // RF-006.10: entre os endereços há o conector com a distância "X metros"
    // (só o conector usa "metros"; os chips usam "m a pé").
    expect(screen.getAllByText((content, el) => el?.tagName === "SPAN" && content.includes("metros")).length).toBeGreaterThan(0);

    // "Ver no mapa" (o da parada, 1º) seleciona-a e devolve o resumo colapsado.
    fireEvent.click(screen.getAllByRole("button", { name: UI_LABELS.MAP_PANEL.VIEW_ON_MAP })[0]);
    expect(screen.queryByText(OVERVIEW_LABELS.SECTION_PROGRESS)).not.toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_STOP)).toBeInTheDocument();
    expect(screen.getByTestId("vaul-root")).toHaveAttribute("data-active-snap", "224px");
  });

  it("RF-006.20: 'Detalhes' da Duração abre um popup com viagem/caminhadas/entregas (split da RF-007.1)", () => {
    startRoteiroFlow();
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));
    fireEvent.click(screen.getByRole("button", { name: OVERVIEW_LABELS.VIEW_DETAILS }));

    // O 1º "Detalhes" é o da Duração → popup com os três tempos decompostos.
    fireEvent.click(screen.getAllByText(OVERVIEW_LABELS.DETAILS_BUTTON)[0]);
    expect(screen.getByText(OVERVIEW_LABELS.DURATION_VEHICLE)).toBeInTheDocument();
    expect(screen.getByText(OVERVIEW_LABELS.DURATION_WALK)).toBeInTheDocument();
    expect(screen.getByText(OVERVIEW_LABELS.DURATION_DELIVERY)).toBeInTheDocument();
  });

  // ==========================================================================
  // Âncora no painel (TASK-RF-006.15 — reverteu os gestos da .5 para o modo edição)
  // ==========================================================================

  const STOP_LABELS_ANCHOR = UI_LABELS.MAP_PANEL.ROTEIRO_STOP;

  it("parada firmada é READ-ONLY: sem gestos de âncora; a âncora coincidente mostra ordinal + badge (RF-006.15)", () => {
    startRoteiroFlow();
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP })); // P1 = p1+p2; sem grafo → âncora = endereço (coincide)

    // Título no novo formato: P1 badge e endereço
    expect(screen.getByText("P1")).toBeInTheDocument();
    expect(screen.getByText("Rua Mapa, 10")).toBeInTheDocument();
    // Parada agrupada: o card Endereço selecionado NÃO aparece (RF-53)
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED)).not.toBeInTheDocument();
    // NENHUM gesto de âncora na parada firmada (migraram p/ o modo edição).
    expect(screen.queryByRole("button", { name: STOP_LABELS_ANCHOR.RESET_ANCHOR })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: STOP_LABELS_ANCHOR.REVERSE_ORDER })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: STOP_LABELS_ANCHOR.MAKE_ANCHOR })).not.toBeInTheDocument();
    // Agrupada: o carro da âncora NÃO aparece (só desagrupada ou no draft — RF-006.16).
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-anchor", "none");
  });

  it("editar a parada traz os gestos da âncora no RASCUNHO: Inverter + Tornar âncora por membro (RF-006.15/.17)", () => {
    startRoteiroFlow();
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.ROTEIRO_STOP.EDIT }));
    expect(screen.getByText(UI_LABELS.MAP_PANEL.MODE_DRAFT)).toBeInTheDocument();

    // A row da âncora abre a lista com Inverter + a dica de arrasto (sem selo 'Parada do veículo').
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.VEHICLE_STOP_BADGE)).not.toBeInTheDocument();
    expect(screen.getByText(STOP_LABELS_ANCHOR.MOVE_ANCHOR_HINT)).toBeInTheDocument();

    // Ordem inicial [p1, p2] (âncora coincide com p1 → 1º — RF-52). "Inverter" existe e
    // está fiado; com 2 endereços o mais próximo fica em 1º nos dois sentidos
    // (RF-006.17 — a reordenação por sentido é coberta no unit do reducer).
    const memberRows = () => screen.getAllByRole("button", { name: /Rua (Mapa|Beta)/ });
    expect(memberRows()[0]).toHaveAccessibleName(/Rua Mapa, 10/);
    fireEvent.click(screen.getByRole("button", { name: STOP_LABELS_ANCHOR.REVERSE_ORDER }));
    expect(memberRows()[0]).toHaveAccessibleName(/Rua Mapa, 10/);

    // "Tornar âncora" existe por membro (ao lado do −).
    expect(screen.getByRole("button", { name: `${STOP_LABELS_ANCHOR.MAKE_ANCHOR}: Rua Beta, 20` })).toBeInTheDocument();
  });

  it("desagrupar a parada firmada (2 cliques) MOSTRA o carro da âncora no mapa (RF-006.16)", () => {
    startRoteiroFlow();
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));
    const stub = screen.getByTestId("route-map-stub");
    // Agrupada: sem carro (o quadrado já está na âncora).
    expect(stub).toHaveAttribute("data-anchor", "none");

    // Focar + desagrupar (duplo-clique) → o carro da âncora aparece no overlay,
    // no local do veículo (sem grafo = coord do endereço-âncora p1 — RF-52).
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-dbltap" }));
    expect(stub).toHaveAttribute("data-anchor", "-22.9,-43.2");
  });

  it("endereço que É o início ganha a flag + os gestos apagar/mudar posição na própria UI (RF-006.11/.14)", () => {
    uploaderState.routes = { "A-1": rowsThreePoints };
    renderPage("/mapa?romaneio=hash-1&rota=A-1&modo=roteiro");
    // "Partir deste endereço": p1 vira o início (coordenada copiada verbatim).
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: START_LABELS.CONFIRM }));

    // Selecionar p1 (tela 8): a row do endereço carrega a flag de início e os
    // dois gestos ao lado. "Apagar início" limpa e volta à definição.
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    expect(screen.getByLabelText(OVERVIEW_LABELS.START_BADGE_ARIA)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: START_LABELS.REPOSITION_START })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: START_LABELS.DELETE_START }));
    expect(screen.getByText(START_LABELS.SECTION)).toBeInTheDocument();
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-overlay-start", "none");
  });

  it("'Ver lista completa' na parada firmada mostra os endereços por ordinal; 'Esconder lista' volta ao resumo (RF-006.4.7)", () => {
    startRoteiroFlow();
    // Criar P1 (comita p1 + p2), depois focar a parada.
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));

    // Resumo: a parada agrupada NÃO mostra Endereço selecionado (RF-53)
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED)).not.toBeInTheDocument();

    // Ver parada → os 2 endereços por ordinal (sem o badge de texto "Parada do veículo").
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.VIEW_FULL_LIST }));
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ORDINAL(1))).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ORDINAL(2))).toBeInTheDocument();
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.VEHICLE_STOP_BADGE)).not.toBeInTheDocument();
    expect(screen.getByTestId("route-map-stub").getAttribute("data-models-summary")).toContain("stop"); // mapa segue agrupado

    // Esconder lista → volta ao resumo (continua sem o card de endereço selecionado, pois segue agrupada)
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.HIDE_FULL_LIST }));
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED)).not.toBeInTheDocument();
  });

  // Rev. 15/07 (RF-006.11): o toque no mapa vazio DESELECIONA (antes reagrupava
  // mantendo o foco — .4.11/.4.16): "mapa vazio = quero ver o todo" — a rota
  // inteira enquadra e o painel volta ao ocioso (cabeçalho + card da sugestão).
  it("2 cliques no quadrado → desagrupa SÓ o mapa (painel fica no resumo); clicar fora DESELECIONA e volta ao ocioso (RF-006.11)", () => {
    startRoteiroFlow();
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));
    const stub = screen.getByTestId("route-map-stub");
    // Focada e AGRUPADA: um quadrado selecionado + o órfão p3.
    expect(stub.getAttribute("data-models-summary")).toBe("stop*,address");

    // Focar a parada passa suas coords como focusBounds → zoom PERTO (RF-006.4.11).
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    expect(stub.getAttribute("data-focus-bounds")).toBe("2"); // p1 + p2 da parada

    // Duplo-clique → desagrupa no MAPA; o painel exibe o card Endereço selecionado
    // com a 1ª entrega selecionada por padrão e sem selo de veículo (RF-53).
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-dbltap" }));
    expect(stub.getAttribute("data-models-summary")).toBe("address*,address*,address");
    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED)).toBeInTheDocument();
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.VEHICLE_STOP_BADGE)).not.toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ORDINAL(1))).toBeInTheDocument();

    // Clicar fora (mapa vazio) → reagrupa E deseleciona: rota inteira no quadro,
    // painel ocioso com o card da sugestão.
    fireEvent.click(screen.getByRole("button", { name: "stub-map-tap" }));
    expect(stub.getAttribute("data-models-summary")).toBe("stop,address"); // sem seleção
    expect(stub.getAttribute("data-focus-bounds")).toBe("none");
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.SECTION_STOP)).not.toBeInTheDocument();
    expect(screen.getByText(OVERVIEW_LABELS.SECTION_NEXT)).toBeInTheDocument();
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

  it("editar a parada a partir do DESAGRUPADO mantém o zoom (MAX), sem zoom-out ao entrar na edição (RF-006.18)", () => {
    startRoteiroFlow();
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" })); // focar
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-dbltap" })); // desagrupa → MAX
    const stub = screen.getByTestId("route-map-stub");
    expect(stub.getAttribute("data-focus-zoom")).toBe(String(MAP_CONFIG.ZOOM.MAX));

    // Editar → o rascunho abre no MESMO zoom do desagrupado (não cai pra FOCUS_MAX).
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.ROTEIRO_STOP.EDIT }));
    expect(screen.getByText(UI_LABELS.MAP_PANEL.MODE_DRAFT)).toBeInTheDocument();
    expect(stub.getAttribute("data-focus-zoom")).toBe(String(MAP_CONFIG.ZOOM.MAX));
  });

  it("desagrupado: tocar qualquer membro seleciona-o — destaque no mapa e no painel (RF-006.4.16)", () => {
    startRoteiroFlow();
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" })); // focar a parada
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-dbltap" })); // desagrupa no mapa
    const stub = screen.getByTestId("route-map-stub");

    // Desagrupada: o card Endereço selecionado exibe o 1º membro por padrão sem selo de veículo (RF-53); o mapa destaca o 1º.
    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED)).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ORDINAL(1))).toBeInTheDocument();
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.VEHICLE_STOP_BADGE)).not.toBeInTheDocument();
    const anchorHighlighted = stub.getAttribute("data-highlighted-model");
    expect(anchorHighlighted).not.toBe("none");

    // Tocar o outro membro → seleciona-o: o destaque do mapa migra e o painel
    // troca para o 2º membro.
    fireEvent.click(screen.getByRole("button", { name: "stub-second-point-tap" }));
    const memberHighlighted = stub.getAttribute("data-highlighted-model");
    expect(memberHighlighted).not.toBe("none");
    expect(memberHighlighted).not.toBe(anchorHighlighted);
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ORDINAL(2))).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED)).toBeInTheDocument();

    // Clicar fora regrupa (volta ao ocioso).
    fireEvent.click(screen.getByRole("button", { name: "stub-map-tap" }));
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED)).not.toBeInTheDocument();
  });

  it("desagrupado: tocar a âncora seleciona a co-âncora (primeira entrega) (RF-53 / TASK-RF-038)", () => {
    startRoteiroFlow();
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" })); // focar
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-dbltap" })); // desagrupa

    // Selecionar o 2º membro…
    fireEvent.click(screen.getByRole("button", { name: "stub-second-point-tap" }));
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ORDINAL(2))).toBeInTheDocument();

    // …tocar a âncora volta a seleção para o 1º membro (co-âncora, sem badge de veículo).
    fireEvent.click(screen.getByRole("button", { name: "stub-anchor-tap" }));
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ORDINAL(1))).toBeInTheDocument();
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.VEHICLE_STOP_BADGE)).not.toBeInTheDocument();
  });

  it("mover o veículo no mapa que muda a ordem mostra o aviso 'Endereços reordenados' (RF-006.17/.18)", () => {
    startRoteiroFlow();
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.ROTEIRO_STOP.EDIT })); // reabre como rascunho

    // Ordem inicial [p1, p2] (âncora coincide com p1 — RF-52). Arrastar o carro para
    // perto de p2 torna p2 o 1º → reordena → aviso.
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.REORDERED_NOTICE)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "stub-anchor-drag" }));
    expect(screen.getByText(UI_LABELS.MAP_PANEL.REORDERED_NOTICE)).toBeInTheDocument();
  });

  it("traçados por contexto: rota de veículo com paradas, circuito na parada, sugestão forte fora do rascunho (RF-006.7)", () => {
    startRoteiroFlow();
    const stub = screen.getByTestId("route-map-stub");
    // Ocioso (sem paradas): sem rota de veículo, sem circuito; sugestão forte (não é draft).
    expect(stub.getAttribute("data-vehicle-route")).toBe("none");
    expect(stub.getAttribute("data-foot-circuit")).toBe("none");
    expect(stub.getAttribute("data-suggestion-faded")).toBe("false");

    // Criar parada (fica focada) → rota de veículo E circuito a pé aparecem.
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));
    expect(stub.getAttribute("data-vehicle-route")).not.toBe("none");
    expect(stub.getAttribute("data-foot-circuit")).not.toBe("none");
    expect(stub.getAttribute("data-suggestion-faded")).toBe("false");
  });

  it("no RASCUNHO o circuito a pé acompanha a edição e a sugestão desbota (RF-006.7)", () => {
    startRoteiroFlow();
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" })); // focar
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.ROTEIRO_STOP.EDIT })); // rascunho
    expect(screen.getByText(UI_LABELS.MAP_PANEL.MODE_DRAFT)).toBeInTheDocument();

    const stub = screen.getByTestId("route-map-stub");
    expect(stub.getAttribute("data-foot-circuit")).not.toBe("none"); // circuito no rascunho
    expect(stub.getAttribute("data-suggestion-faded")).toBe("true"); // desbotada no rascunho
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

    // Salvar consolida: o progresso vai a 100% E a parada volta selecionada
    // (RF-006.4.24) — painel no resumo, foco no quadro dela (3 membros).
    fireEvent.click(screen.getByRole("button", { name: DRAFT_LABELS.SAVE }));
    expect(screen.getByText(OVERVIEW_LABELS.PERCENT(1))).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_STOP)).toBeInTheDocument();
    expect(stub.getAttribute("data-focus-bounds")).toBe("3");
  });

  it("edição: tocar um endereço DA PARADA agora o seleciona (destaque no mapa), não fica inerte (RF-006.19)", () => {
    startRoteiroFlow();
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP })); // P1 = p1+p2
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" })); // foca
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.ROTEIRO_STOP.EDIT })); // rascunho
    const stub = screen.getByTestId("route-map-stub");

    // models[0] é um MEMBRO da parada. Tocá-lo agora SELECIONA (destaca no mapa)
    // em vez de ficar inerte (RF-006.4.9 → RF-006.19). Não vira "Adicionar" (é membro).
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    expect(stub.getAttribute("data-highlighted-model")).not.toBe("none");
    expect(screen.queryByRole("button", { name: DRAFT_LABELS.ADD_TO_STOP })).not.toBeInTheDocument();
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

  it("ao deletar uma parada seleciona automaticamente a ultima parada remanescente", async () => {
    startRoteiroFlow();
    // Cria Parada 1 (p1 + p2)
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));
    expect(screen.getByText("P1")).toBeInTheDocument();
    expect(screen.getByText("Rua Mapa, 10")).toBeInTheDocument();

    // Cria Parada 2 (p3)
    fireEvent.click(screen.getByRole("button", { name: "stub-second-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));
    expect(screen.getByText("P2")).toBeInTheDocument();

    // Seleciona Parada 1 (models[0])
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    expect(screen.getByText("P1")).toBeInTheDocument();
    expect(screen.getByText("Rua Mapa, 10")).toBeInTheDocument();

    // Deleta a Parada 1: a parada remanescente (antiga Parada 2, agora Parada 1) é selecionada automaticamente
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.ROTEIRO_STOP.DISSOLVE }));
    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_STOP)).toBeInTheDocument();
    expect(screen.getByText("P1")).toBeInTheDocument();
  });

  it("no painel com paradas, Recomeçar abre diálogo e limpa todas as paradas preservando ponto de partida", () => {
    startRoteiroFlow();
    // Cria Parada 1
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));
    expect(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.ROTEIRO_OVERVIEW.RESET_ROUTE })).toBeInTheDocument();

    // Clica em Recomeçar e confirma
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.ROTEIRO_OVERVIEW.RESET_ROUTE }));
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.ROTEIRO_OVERVIEW.RESET_ROUTE_CONFIRM }));

    // Paradas limpas, ponto de partida continua definido
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-overlay-start", "-22.95,-43.19");
    expect(screen.queryByRole("button", { name: UI_LABELS.MAP_PANEL.ROTEIRO_OVERVIEW.RESET_ROUTE })).not.toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ROTEIRO_OVERVIEW.PERCENT(0))).toBeInTheDocument();
  });

  it("ponto selecionado pelo usuario e preservado como ancora e primeiro endereco ao criar parada com vizinhos englobados", () => {
    startRoteiroFlow();
    // Toca no primeiro ponto (p1: Rua Mapa, 10). p2 (Rua Beta, 20) está dentro do raio de 30m.
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));

    // A parada agrupada exibe o endereço completo de p1 (co-âncora) no título do resumo (RF-53)
    expect(screen.getByText("P1")).toBeInTheDocument();
    expect(screen.getByText("Rua Mapa, 10")).toBeInTheDocument();
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED)).not.toBeInTheDocument();

    // Ao editar a parada, o primeiro membro da caminhada (1º) é p1 (Rua Mapa, 10)
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.ROTEIRO_STOP.EDIT }));
    const memberRows = screen.getAllByRole("button", { name: /Rua (Mapa|Beta)/ });
    expect(memberRows[0]).toHaveAccessibleName(/Rua Mapa, 10/);
  });

  it("duplo-clique desagrupa e exibe automaticamente a primeira entrega selecionada no card de endereco (RF-53 / TASK-RF-038)", () => {
    startRoteiroFlow();
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));

    // Parada agrupada: título P1 com endereço completo herdado da 1ª entrega, sem card Endereço selecionado
    expect(screen.getByText("P1")).toBeInTheDocument();
    expect(screen.getByText("Rua Mapa, 10")).toBeInTheDocument();
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED)).not.toBeInTheDocument();

    // Duplo-clique desagrupa
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-dbltap" }));

    // Card Endereço selecionado visível, primeira entrega (1º) selecionada por padrão, sem selo de veículo
    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED)).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ORDINAL(1))).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Rua Mapa, 10/ })).toBeInTheDocument();
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.VEHICLE_STOP_BADGE)).not.toBeInTheDocument();
  });

  it("ao editar parada e aumentar raio salva novos enderecos englobados", () => {
    startRoteiroFlow();
    // Cria P1 reduzindo o raio para 10m para conter apenas p1 (Rua Mapa, 10); p2 (~17m) fica livre
    fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
    fireEvent.click(screen.getByRole("button", { name: DRAFT_LABELS.RADIUS_DECREASE }));
    fireEvent.click(screen.getByRole("button", { name: DRAFT_LABELS.RADIUS_DECREASE }));
    fireEvent.click(screen.getByRole("button", { name: POINT_LABELS.CREATE_STOP }));

    expect(screen.getByText("P1")).toBeInTheDocument();
    expect(screen.getByText("1 endereço")).toBeInTheDocument();
    expect(screen.getByText(OVERVIEW_LABELS.PERCENT(1 / 3))).toBeInTheDocument();

    // Clica em Editar para reabrir P1 como rascunho
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.ROTEIRO_STOP.EDIT }));
    expect(screen.getByText("1 endereço")).toBeInTheDocument();

    // Aumenta o raio de 10m para 20m: p2 (~17m) e englobado automaticamente
    fireEvent.click(screen.getByRole("button", { name: DRAFT_LABELS.RADIUS_INCREASE }));
    expect(screen.getByText("2 endereços")).toBeInTheDocument();

    // Salva a parada comitada
    fireEvent.click(screen.getByRole("button", { name: DRAFT_LABELS.SAVE }));

    // A parada P1 persistida contem os 2 enderecos englobados e o progresso sobe para 67%
    expect(screen.getByText("P1")).toBeInTheDocument();
    expect(screen.getByText("2 endereços")).toBeInTheDocument();
    expect(screen.getByText(OVERVIEW_LABELS.PERCENT(2 / 3))).toBeInTheDocument();
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
