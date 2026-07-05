import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { UI_LABELS, COLUMN_NAMES } from "../../constants";
import type { RowData } from "../../types";

const rowsA1: RowData[] = [
  {
    [COLUMN_NAMES.SEQUENCE]: 1,
    [COLUMN_NAMES.STOP]: 1,
    [COLUMN_NAMES.LATITUDE]: -229000000,
    [COLUMN_NAMES.LONGITUDE]: -431000000,
    [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua A, 123",
    [COLUMN_NAMES.ZIPCODE]: "22041-001",
    [COLUMN_NAMES.PLANNED_VEHICLE_TYPE]: "Moto",
  },
];

const uploaderState = {
  routes: { "A-1": rowsA1 } as Record<string, RowData[]> | null,
  loading: false,
  error: null as string | null,
  manifestSave: null,
  availableCols: [COLUMN_NAMES.LATITUDE, COLUMN_NAMES.LONGITUDE, COLUMN_NAMES.SEQUENCE, COLUMN_NAMES.STOP, COLUMN_NAMES.PLANNED_VEHICLE_TYPE] as string[] | null,
  missingCols: [] as string[],
  isSingleRoute: false,
  handleFileUpload: vi.fn(),
  loadManifest: vi.fn().mockResolvedValue(true),
};

vi.mock("../../hooks/useRouteUploader", () => ({
  useRouteUploader: () => uploaderState,
}));

// Stub RouteMap to avoid loading Leaflet in jsdom.
vi.mock("../../components/RouteMap", () => ({
  RouteMap: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="route-map-stub">
      <button type="button" onClick={onClose}>
        close-map-stub
      </button>
    </div>
  ),
}));

import SummaryPage from "../../pages/SummaryPage";

const renderPage = (initialPath = "/sumario?romaneio=hash-1&rota=A-1") =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/sumario" element={<SummaryPage />} />
        <Route path="/rotas" element={<div data-testid="rotas-page-stub" />} />
      </Routes>
    </MemoryRouter>
  );

describe("SummaryPage (focus screen)", () => {
  beforeEach(() => {
    uploaderState.loadManifest.mockClear();
    uploaderState.routes = { "A-1": rowsA1 };
    uploaderState.error = null;
    uploaderState.loading = false;
  });

  it("loads the manifest from the URL and shows the summary of the requested route", () => {
    renderPage();

    expect(uploaderState.loadManifest).toHaveBeenCalledWith("hash-1");
    expect(screen.getByText(new RegExp(UI_LABELS.ROUTE_SUMMARY.TITLE("A-1")))).toBeInTheDocument();
  });

  it("'Ver Original' opens the map (modal until TASK-RF-022.5)", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.ROUTE_SUMMARY.VIEW_MAP }));
    expect(screen.getByTestId("route-map-stub")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "close-map-stub" }));
    expect(screen.queryByTestId("route-map-stub")).not.toBeInTheDocument();
  });

  it("opens the original table modal", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.ROUTE_SUMMARY.ORIGINAL_TABLE }));
    expect(screen.getByText(UI_LABELS.ROUTE_TABLE.TITLE("A-1"))).toBeInTheDocument();
  });

  it("ships the adaptive 'Criar Roteiro' button disabled (RF-43 — wired by RF-006/008)", () => {
    renderPage();

    expect(screen.getByRole("button", { name: UI_LABELS.ROUTE_SUMMARY.CREATE_ROTEIRO_SOON })).toBeDisabled();
  });

  it("does not render the 'Info Meu Roteiro' section while no Roteiro exists", () => {
    renderPage();

    expect(screen.queryByText(UI_LABELS.ROTEIRO_INFO.TITLE)).not.toBeInTheDocument();
  });

  it("shows the error state when the manifest cannot be reopened", () => {
    uploaderState.routes = null;
    uploaderState.error = UI_LABELS.FILE_UPLOADER.MANIFEST_NOT_FOUND;

    renderPage("/sumario?romaneio=nao-existe&rota=A-1");

    expect(screen.getByText(UI_LABELS.FILE_UPLOADER.MANIFEST_NOT_FOUND)).toBeInTheDocument();
  });

  it("redirects to the Rotas tab when the URL is malformed", () => {
    renderPage("/sumario");

    expect(screen.getByTestId("rotas-page-stub")).toBeInTheDocument();
    expect(uploaderState.loadManifest).not.toHaveBeenCalled();
  });
});
