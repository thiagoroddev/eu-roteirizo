import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import type { ReactNode } from "react";
import { UI_LABELS, COLUMN_NAMES } from "../../constants";
import type { RowData } from "../../types";
import type { InteractionState } from "../../utils/markers/markerModels";

// vaul cannot run in jsdom — passthrough mock (gesture is validated on device).
vi.mock("vaul", () => ({
  Drawer: {
    Root: ({ children, dismissible, activeSnapPoint }: { children?: ReactNode; dismissible?: boolean; activeSnapPoint?: number | string | null }) => (
      <div data-testid="vaul-root" data-dismissible={String(!!dismissible)} data-active-snap={String(activeSnapPoint)}>
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
  },
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
// tests can drive selections the way the real map would (RF-023.2).
vi.mock("../../components/RouteMap", () => ({
  RouteMap: ({ embedded, onInteractionChange }: { embedded?: boolean; onInteractionChange?: (next: InteractionState) => void }) => (
    <div data-testid="route-map-stub" data-embedded={String(!!embedded)} data-controlled={String(!!onInteractionChange)}>
      <button type="button" onClick={() => onInteractionChange?.({ expandedStopKey: "0", selectedAddressKey: "0:0" })}>
        stub-select-first-address
      </button>
      <button type="button" onClick={() => onInteractionChange?.({ expandedStopKey: null, selectedAddressKey: null })}>
        stub-collapse
      </button>
    </div>
  ),
}));

import MapPage from "../../pages/MapPage";

const renderPage = (initialPath = "/mapa?romaneio=hash-1&rota=A-1") =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/mapa" element={<MapPage />} />
        <Route path="/rotas" element={<div data-testid="rotas-page-stub" />} />
      </Routes>
    </MemoryRouter>
  );

describe("MapPage (focus screen)", () => {
  beforeEach(() => {
    uploaderState.loadManifest.mockClear();
    uploaderState.routes = { "A-1": rowsA1 };
    uploaderState.error = null;
    uploaderState.loading = false;
  });

  it("loads the manifest from the URL and renders the map in embedded/controlled mode", () => {
    renderPage();

    expect(uploaderState.loadManifest).toHaveBeenCalledWith("hash-1");
    const stub = screen.getByTestId("route-map-stub");
    expect(stub).toHaveAttribute("data-embedded", "true");
    expect(stub).toHaveAttribute("data-controlled", "true");
  });

  it("shows the segmented toggle with 'Meu roteiro' disabled until TASK-RF-010", () => {
    renderPage();

    expect(screen.getByRole("group", { name: UI_LABELS.MAP_MODE.ARIA })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: UI_LABELS.MAP_MODE.ORIGINAL })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: UI_LABELS.MAP_MODE.MY_ROTEIRO_SOON })).toBeDisabled();
  });

  // ==========================================================================
  // MapPanel (TASK-RF-023.2)
  // ==========================================================================

  it("opens with the panel header on the smallest stop (never empty)", () => {
    renderPage();

    expect(screen.getByText(`${UI_LABELS.MAP_PANEL.STOP_PREFIX} 1`)).toBeInTheDocument();
    expect(screen.getByText("Rua Mapa, 10")).toBeInTheDocument();
    expect(screen.getByTestId("vaul-root")).toHaveAttribute("data-dismissible", "false");
  });

  it("picks the NUMERICALLY smallest stop for the initial header (2, not 10)", () => {
    uploaderState.routes = { "A-1": rowsStops10e2 };
    renderPage();

    expect(screen.getByText(`${UI_LABELS.MAP_PANEL.STOP_PREFIX} 2`)).toBeInTheDocument();
    expect(screen.getByText("Rua Dois, 2")).toBeInTheDocument();
  });

  it("shows the tap hint while no address is selected", () => {
    renderPage();

    expect(screen.getByText(UI_LABELS.MAP_PANEL.NO_ADDRESS_HINT)).toBeInTheDocument();
  });

  it("selecting an address on the map fills the panel body (inline AddressSheet)", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "stub-select-first-address" }));

    expect(screen.getByRole("region", { name: UI_LABELS.ROUTE_MAP.ADDRESS_SHEET.ARIA })).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.ROUTE_MAP.ADDRESS_SHEET.PACKAGES_HEADER(1))).toBeInTheDocument();
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.NO_ADDRESS_HINT)).not.toBeInTheDocument();
  });

  it("selecting an address raises a collapsed panel to half (design §5 — detail visible without dragging)", () => {
    renderPage();
    expect(screen.getByTestId("vaul-root")).toHaveAttribute("data-active-snap", "96px");

    fireEvent.click(screen.getByRole("button", { name: "stub-select-first-address" }));

    expect(screen.getByTestId("vaul-root")).toHaveAttribute("data-active-snap", "0.45");
  });

  it("collapsing on the map keeps the panel on the last stop (memory never clears)", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: "stub-select-first-address" }));
    fireEvent.click(screen.getByRole("button", { name: "stub-collapse" }));

    // Address detail closes, but the header still shows the stop.
    expect(screen.getByText(UI_LABELS.MAP_PANEL.NO_ADDRESS_HINT)).toBeInTheDocument();
    expect(screen.getByText(`${UI_LABELS.MAP_PANEL.STOP_PREFIX} 1`)).toBeInTheDocument();
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
