import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { UI_LABELS } from "../../constants/uiLabels";
import type { ManifestMeta } from "../../types/manifest";

vi.mock("../../services/manifestStorage", () => ({
  listManifests: vi.fn(),
  deleteManifest: vi.fn().mockResolvedValue(undefined),
}));

import { listManifests, deleteManifest } from "../../services/manifestStorage";
import RoutesPage from "../../pages/RoutesPage";

const mockList = listManifests as Mock;
const mockDelete = deleteManifest as Mock;

const single: ManifestMeta = {
  id: "id-single",
  fileName: "minha-rota.xlsx",
  fileType: "application/vnd.ms-excel",
  fileSize: 100,
  kind: "single",
  routes: [{ name: "Minha rota", at: "AT20250009", rowCount: 42 }],
  importedAt: "2026-07-04T12:00:00.000Z",
};

const multi: ManifestMeta = {
  id: "id-multi",
  fileName: "romaneio-completo.xlsx",
  fileType: "application/vnd.ms-excel",
  fileSize: 200,
  kind: "multi",
  routes: [
    { name: "A-1", at: "AT20250001", rowCount: 10 },
    { name: "B-2", rowCount: 5 },
  ],
  importedAt: "2026-07-05T12:00:00.000Z",
};

/** 8 routes (> COLLAPSE_THRESHOLD = 6): collapses by default (TASK-REF-013). */
const big: ManifestMeta = {
  id: "id-big",
  fileName: "romaneio-grande.xlsx",
  fileType: "application/vnd.ms-excel",
  fileSize: 300,
  kind: "multi",
  routes: Array.from({ length: 8 }, (_, i) => ({ name: `L-${i + 1}`, at: `AT2025110${i}`, rowCount: 5 })),
  importedAt: "2026-07-06T12:00:00.000Z",
};

/** Probe route that prints the current URL so chip navigation can be asserted. */
const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location-probe">{location.pathname + location.search}</div>;
};

const renderPage = (initialPath = "/rotas") =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/rotas" element={<RoutesPage />} />
        <Route path="/sumario" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  );

describe("RoutesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockList.mockResolvedValue([multi, single]);
  });

  it("lists saved manifests as typed cards with their route chips", async () => {
    renderPage();

    expect(await screen.findByText("romaneio-completo.xlsx")).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.ROUTES_PAGE.KIND_MULTI)).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.ROUTES_PAGE.KIND_SINGLE)).toBeInTheDocument();
    // Chips: all routes of the multi manifest + the single one, AT shown when present
    expect(screen.getByRole("button", { name: UI_LABELS.ROUTES_PAGE.CHIP_ARIA("A-1") })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: UI_LABELS.ROUTES_PAGE.CHIP_ARIA("B-2") })).toBeInTheDocument();
    expect(screen.getByText("AT20250001")).toBeInTheDocument();
  });

  it("shows the friendly empty state when nothing is saved", async () => {
    mockList.mockResolvedValue([]);
    renderPage();

    expect(await screen.findByText(UI_LABELS.ROUTES_PAGE.EMPTY)).toBeInTheDocument();
  });

  it("filters cards by route name or AT code (metadata only)", async () => {
    renderPage();
    await screen.findByText("romaneio-completo.xlsx");

    fireEvent.change(screen.getByPlaceholderText(UI_LABELS.ROUTES_PAGE.SEARCH_PLACEHOLDER), { target: { value: "at20250009" } });

    expect(screen.getByText("minha-rota.xlsx")).toBeInTheDocument();
    expect(screen.queryByText("romaneio-completo.xlsx")).not.toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText(UI_LABELS.ROUTES_PAGE.SEARCH_PLACEHOLDER), { target: { value: "zzz" } });
    expect(screen.getByText(UI_LABELS.ROUTES_PAGE.NO_SEARCH_RESULTS)).toBeInTheDocument();
  });

  // ==========================================================================
  // Card multi colapsável (TASK-REF-013)
  // ==========================================================================

  it("collapses a BIG multi card by default; the toggle shows/hides the scrollable chips", async () => {
    mockList.mockResolvedValue([big, multi]);
    renderPage();
    await screen.findByText("romaneio-grande.xlsx");

    // Big card: no chips, only the toggle. Small card: chips as always, no toggle.
    expect(screen.queryByRole("button", { name: UI_LABELS.ROUTES_PAGE.CHIP_ARIA("L-1") })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: UI_LABELS.ROUTES_PAGE.CHIP_ARIA("A-1") })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: UI_LABELS.ROUTES_PAGE.HIDE_ROUTES })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.ROUTES_PAGE.SHOW_ROUTES(8) }));
    expect(screen.getByRole("button", { name: UI_LABELS.ROUTES_PAGE.CHIP_ARIA("L-1") })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: UI_LABELS.ROUTES_PAGE.CHIP_ARIA("L-8") })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.ROUTES_PAGE.HIDE_ROUTES }));
    expect(screen.queryByRole("button", { name: UI_LABELS.ROUTES_PAGE.CHIP_ARIA("L-1") })).not.toBeInTheDocument();
  });

  it("the page filter narrows the CHIPS inside the card and auto-expands it", async () => {
    mockList.mockResolvedValue([big]);
    renderPage();
    await screen.findByText("romaneio-grande.xlsx");

    fireEvent.change(screen.getByPlaceholderText(UI_LABELS.ROUTES_PAGE.SEARCH_PLACEHOLDER), { target: { value: "L-3" } });

    // Only the matching chip, without touching the toggle; count shows "1 de 8".
    expect(screen.getByRole("button", { name: UI_LABELS.ROUTES_PAGE.CHIP_ARIA("L-3") })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: UI_LABELS.ROUTES_PAGE.CHIP_ARIA("L-1") })).not.toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.ROUTES_PAGE.ROUTE_COUNT_FILTERED(1, 8))).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: UI_LABELS.ROUTES_PAGE.SHOW_ROUTES(8) })).not.toBeInTheDocument();

    // Clearing the filter collapses the big card again.
    fireEvent.change(screen.getByPlaceholderText(UI_LABELS.ROUTES_PAGE.SEARCH_PLACEHOLDER), { target: { value: "" } });
    expect(screen.queryByRole("button", { name: UI_LABELS.ROUTES_PAGE.CHIP_ARIA("L-3") })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: UI_LABELS.ROUTES_PAGE.SHOW_ROUTES(8) })).toBeInTheDocument();
  });

  it("navigates to the Sumário deep link when a chip is tapped (TASK-RF-022.4)", async () => {
    renderPage();
    await screen.findByText("romaneio-completo.xlsx");

    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.ROUTES_PAGE.CHIP_ARIA("B-2") }));

    expect(screen.getByTestId("location-probe")).toHaveTextContent("/sumario?romaneio=id-multi&rota=B-2");
  });

  it("highlights the card pointed at by ?sel= (RN-23 redirect target)", async () => {
    renderPage("/rotas?sel=id-single");
    await screen.findByText("minha-rota.xlsx");

    const selectedCard = screen.getByText("minha-rota.xlsx").closest("div.rounded-2xl");
    expect(selectedCard?.className).toContain("border-primary");
  });

  it("deletes a manifest after confirmation and refreshes the list", async () => {
    renderPage();
    await screen.findByText("minha-rota.xlsx");

    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.ROUTES_PAGE.DELETE_ARIA("minha-rota.xlsx") }));
    expect(await screen.findByText(UI_LABELS.ROUTES_PAGE.DELETE_TITLE)).toBeInTheDocument();

    mockList.mockResolvedValue([multi]); // list after deletion
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.ROUTES_PAGE.DELETE_CONFIRM }));

    await waitFor(() => expect(mockDelete).toHaveBeenCalledWith("id-single"));
    await waitFor(() => expect(screen.queryByText("minha-rota.xlsx")).not.toBeInTheDocument());
  });

  it("keeps the manifest when the deletion is cancelled", async () => {
    renderPage();
    await screen.findByText("minha-rota.xlsx");

    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.ROUTES_PAGE.DELETE_ARIA("minha-rota.xlsx") }));
    fireEvent.click(await screen.findByRole("button", { name: UI_LABELS.ROUTES_PAGE.DELETE_CANCEL }));

    expect(mockDelete).not.toHaveBeenCalled();
    expect(screen.getByText("minha-rota.xlsx")).toBeInTheDocument();
  });
});
