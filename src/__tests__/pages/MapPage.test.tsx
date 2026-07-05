import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { UI_LABELS, COLUMN_NAMES } from "../../constants";
import type { RowData } from "../../types";

const rowsA1: RowData[] = [{ [COLUMN_NAMES.SEQUENCE]: 1, [COLUMN_NAMES.STOP]: 1, [COLUMN_NAMES.LATITUDE]: -229000000, [COLUMN_NAMES.LONGITUDE]: -431000000 }];

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

// Stub RouteMap (Leaflet) — captures the embedded flag for assertion.
vi.mock("../../components/RouteMap", () => ({
  RouteMap: ({ embedded }: { embedded?: boolean }) => <div data-testid="route-map-stub" data-embedded={String(!!embedded)} />,
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

  it("loads the manifest from the URL and renders the map in embedded mode", () => {
    renderPage();

    expect(uploaderState.loadManifest).toHaveBeenCalledWith("hash-1");
    expect(screen.getByTestId("route-map-stub")).toHaveAttribute("data-embedded", "true");
  });

  it("shows the segmented toggle with 'Meu roteiro' disabled until TASK-RF-010", () => {
    renderPage();

    expect(screen.getByRole("group", { name: UI_LABELS.MAP_MODE.ARIA })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: UI_LABELS.MAP_MODE.ORIGINAL })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: UI_LABELS.MAP_MODE.MY_ROTEIRO_SOON })).toBeDisabled();
  });

  it("shows the error state when the manifest cannot be reopened", () => {
    uploaderState.routes = null;
    uploaderState.error = UI_LABELS.FILE_UPLOADER.MANIFEST_NOT_FOUND;

    renderPage("/mapa?romaneio=nao-existe&rota=A-1");

    expect(screen.getByText(UI_LABELS.FILE_UPLOADER.MANIFEST_NOT_FOUND)).toBeInTheDocument();
    expect(screen.queryByTestId("route-map-stub")).not.toBeInTheDocument();
  });

  it("redirects to the Rotas tab when the URL is malformed", () => {
    renderPage("/mapa");

    expect(screen.getByTestId("rotas-page-stub")).toBeInTheDocument();
    expect(uploaderState.loadManifest).not.toHaveBeenCalled();
  });
});
