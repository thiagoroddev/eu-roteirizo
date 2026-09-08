/**
 * Tests for HomePage — upload-only HOME (TASK-REF-011; formerly RouteViewer).
 * The inline viewer (selector/summary/map modal) is gone: HOME uploads,
 * persists and NAVIGATES (fluxo §15.2 — RN-23 for duplicates).
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { UI_LABELS } from "../../constants/uiLabels";
import type { ManifestMeta } from "../../types/manifest";

const uploaderState = {
  routes: null as Record<string, never> | null,
  loading: false,
  error: null as string | null,
  manifestSave: null as { status: string; meta: ManifestMeta } | null,
  availableCols: null,
  missingCols: [] as string[],
  isSingleRoute: false,
  handleFileUpload: vi.fn(),
  loadManifest: vi.fn(),
};
vi.mock("../../hooks/useRouteUploader", () => ({ useRouteUploader: () => uploaderState }));

vi.mock("../../services/routeExport", () => ({
  readFileAsText: vi.fn((file: File) => Promise.resolve(file.name === "bad.json" ? "invalido" : '{"schema":"eu-roteirizo/roteiro/v1"}')),
  parseAndValidateRouteJson: vi.fn((text: string) => {
    if (text.includes("invalido")) return { ok: false, error: "Arquivo JSON inválido" };
    return {
      ok: true,
      payload: {
        schema: "eu-roteirizo/roteiro/v1",
        manifestId: "man-123",
        routeName: "Rota A",
        route: { id: "r1", stops: [] },
        points: [],
      },
    };
  }),
  importRoutePayload: vi.fn(() => Promise.resolve({ ok: true, manifestId: "man-123", routeName: "Rota A", isStandalone: true })),
}));

import HomePage from "../../pages/HomePage";

const meta = (kind: "single" | "multi"): ManifestMeta => ({
  id: `id-${kind}`,
  fileName: "arquivo.xlsx",
  fileType: "application/vnd.ms-excel",
  fileSize: 100,
  kind,
  routes:
    kind === "single"
      ? [{ name: "Minha rota", rowCount: 10 }]
      : [
          { name: "A-1", rowCount: 10 },
          { name: "B-2", rowCount: 5 },
        ],
  importedAt: "2026-07-07T12:00:00.000Z",
});

const LocationProbe = () => {
  const location = useLocation();
  return <div data-testid="location-probe">{location.pathname + location.search}</div>;
};

const renderHome = () =>
  render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/rotas" element={<LocationProbe />} />
        <Route path="/sumario" element={<LocationProbe />} />
        <Route path="/mapa" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  );

describe("HomePage (upload-only)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uploaderState.manifestSave = null;
  });

  it("renders only the uploader — no inline viewer remains", () => {
    renderHome();

    expect(screen.getByText(UI_LABELS.FILE_UPLOADER.UPLOAD)).toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
  });

  it("navigates to the Sumário after saving a SINGLE-route manifest", () => {
    uploaderState.manifestSave = { status: "saved", meta: meta("single") };
    renderHome();

    expect(screen.getByTestId("location-probe")).toHaveTextContent("/sumario?romaneio=id-single&rota=Minha%20rota");
  });

  it("navigates to the Rotas tab (card selected) after saving a MULTI manifest", () => {
    uploaderState.manifestSave = { status: "saved", meta: meta("multi") };
    renderHome();

    expect(screen.getByTestId("location-probe")).toHaveTextContent("/rotas?sel=id-multi");
  });

  it("redirects a DUPLICATE to the Rotas tab with the existing card selected (RN-23)", () => {
    uploaderState.manifestSave = { status: "duplicate", meta: meta("multi") };
    renderHome();

    expect(screen.getByTestId("location-probe")).toHaveTextContent("/rotas?sel=id-multi");
  });

  it("stays on HOME when the save fails (no inline fallback — the user retries)", () => {
    uploaderState.manifestSave = { status: "error", meta: meta("single") };
    renderHome();

    expect(screen.queryByTestId("location-probe")).not.toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.FILE_UPLOADER.UPLOAD)).toBeInTheDocument();
  });

  it("navigates directly to Meu Roteiro on map when importing a valid JSON route (RF-013)", async () => {
    const { container } = renderHome();

    const jsonInput = container.querySelector("#json-file-input") as HTMLInputElement;
    expect(jsonInput).toBeInTheDocument();

    const file = new File(['{"schema":"eu-roteirizo/roteiro/v1"}'], "meu-roteiro.json", { type: "application/json" });
    fireEvent.change(jsonInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByTestId("location-probe")).toHaveTextContent("/mapa?romaneio=man-123&rota=Rota%20A&modo=roteiro");
    });
  });

  it("displays error message when importing an invalid JSON file (RF-013)", async () => {
    const { container } = renderHome();

    const jsonInput = container.querySelector("#json-file-input") as HTMLInputElement;
    const file = new File(["invalido"], "bad.json", { type: "application/json" });
    fireEvent.change(jsonInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText("Arquivo JSON inválido")).toBeInTheDocument();
    });
  });
});
