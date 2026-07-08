import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { UI_LABELS, COLUMN_NAMES } from "../../constants";
import type { RowData } from "../../types";
import type { InteractionState } from "../../utils/markers/markerModels";

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

// Stub RouteMap (Leaflet) — exposes the controlled-interaction contract so the
// tests can drive selections the way the real map would (RF-023.2), plus the
// external-models contract of the Meu roteiro mode (RF-006.2/ADR-009).
vi.mock("../../components/RouteMap", () => ({
  RouteMap: ({ interaction, onInteractionChange, models }: { interaction?: InteractionState; onInteractionChange?: (next: InteractionState) => void; models?: unknown[] }) => (
    <div
      data-testid="route-map-stub"
      data-controlled={String(!!onInteractionChange)}
      data-expanded-stop={String(interaction?.expandedStopKey ?? null)}
      data-external-models={String(models !== undefined)}
      data-model-count={String(models?.length ?? "none")}
    >
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

describe("MapPage (focus screen)", () => {
  beforeEach(() => {
    uploaderState.loadManifest.mockClear();
    uploaderState.routes = { "A-1": rowsA1 };
    uploaderState.error = null;
    uploaderState.loading = false;
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
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-expanded-stop", "0");

    // Second tap collapses just the detail (panel stays where it is).
    fireEvent.click(addressRow(/Rua Mapa, 10/));
    expect(addressRow(/Rua Mapa, 10/)).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByText(UI_LABELS.ROUTE_MAP.ADDRESS_SHEET.PACKAGES_HEADER(1))).not.toBeInTheDocument();
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

    expect(screen.getByTestId("vaul-root")).toHaveAttribute("data-active-snap", "0.9");
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

    expect(screen.getByTestId("vaul-root")).toHaveAttribute("data-active-snap", "0.9");
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
    // The controlled RouteMap receives the expansion — the map focuses the stop.
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-expanded-stop", "0");
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

  it("entering the roteiro collapses the map expansion; returning restores the Original panel from memory", () => {
    uploaderState.routes = { "A-1": rowsStop1TwoAddresses };
    renderPage();
    fireEvent.click(screen.getByRole("button", { name: "stub-select-first-address" }));
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-expanded-stop", "0");

    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_MODE.MY_ROTEIRO }));
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-expanded-stop", "null");
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-external-models", "true");

    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_MODE.ORIGINAL }));
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-external-models", "false");
    // The panel re-derives from its memory (panelStopKey survives the round trip).
    expect(screen.getByText(`${UI_LABELS.MAP_PANEL.STOP_PREFIX} 1`)).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_STOP)).toBeInTheDocument();
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
