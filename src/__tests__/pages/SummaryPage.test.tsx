import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
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

// routeStorage (RF-008): controlado pelo teste — adapta o botão e alimenta o Info.
const { routeStorageState } = vi.hoisted(() => ({
  routeStorageState: { saved: null as unknown },
}));
vi.mock("../../services/routeStorage", () => ({
  getRoteiro: vi.fn(() => Promise.resolve(routeStorageState.saved)),
}));

import SummaryPage from "../../pages/SummaryPage";

/** The /mapa stub also exposes the search string, so navigation params are assertable. */
const MapPageStub = () => <div data-testid="map-page-stub">{useLocation().search}</div>;

const renderPage = (initialPath = "/sumario?romaneio=hash-1&rota=A-1") =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/sumario" element={<SummaryPage />} />
        <Route path="/rotas" element={<div data-testid="rotas-page-stub" />} />
        <Route path="/mapa" element={<MapPageStub />} />
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

    expect(uploaderState.loadManifest).toHaveBeenCalledWith("hash-1", "A-1");
    // REF-017: o título duplicado saiu (o header já mostra a rota); a tela é
    // identificada pelo toggle das duas seções, abrindo em "Info Original".
    expect(screen.getByRole("button", { name: UI_LABELS.ROUTE_SUMMARY.SECTION_ORIGINAL })).toHaveAttribute("aria-pressed", "true");
  });

  it("'Ver no Mapa' navigates to the map focus screen (TASK-RF-022.5)", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.ROUTE_SUMMARY.VIEW_ON_MAP }));
    expect(screen.getByTestId("map-page-stub")).toBeInTheDocument();
  });

  it("opens the original table modal", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.ROUTE_SUMMARY.ORIGINAL_TABLE }));
    expect(screen.getByText(UI_LABELS.ROUTE_TABLE.TITLE("A-1"))).toBeInTheDocument();
  });

  it("'Criar Roteiro' opens the map in the Meu roteiro mode (TASK-RF-006.2)", () => {
    renderPage();

    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.ROUTE_SUMMARY.CREATE_ROTEIRO }));

    const stub = screen.getByTestId("map-page-stub");
    expect(stub.textContent).toContain("romaneio=hash-1");
    expect(stub.textContent).toContain("rota=A-1");
    expect(stub.textContent).toContain("modo=roteiro");
  });

  it("'Criar Roteiro' is disabled without coordinate columns (same gate as the map)", () => {
    uploaderState.availableCols = [COLUMN_NAMES.SEQUENCE, COLUMN_NAMES.STOP];
    renderPage();

    expect(screen.getByRole("button", { name: UI_LABELS.ROUTE_SUMMARY.CREATE_ROTEIRO })).toBeDisabled();
    uploaderState.availableCols = [COLUMN_NAMES.LATITUDE, COLUMN_NAMES.LONGITUDE, COLUMN_NAMES.SEQUENCE, COLUMN_NAMES.STOP, COLUMN_NAMES.PLANNED_VEHICLE_TYPE];
  });

  // REF-017: sem roteiro a seção não é alcançável — o segmento fica DESABILITADO
  // (antes a seção simplesmente não era renderizada abaixo do card).
  it("sem Roteiro salvo: o segmento 'Info Meu Roteiro' fica desabilitado e a tela abre no Original", () => {
    renderPage();

    expect(screen.getByRole("button", { name: UI_LABELS.ROUTE_SUMMARY.NO_ROTEIRO_YET })).toBeDisabled();
    expect(screen.queryByText(UI_LABELS.ROTEIRO_INFO.CARD_ADDRESSES)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: UI_LABELS.ROUTE_SUMMARY.SECTION_ORIGINAL })).toHaveAttribute("aria-pressed", "true");
  });

  // RF-008 + REF-017: com roteiro salvo a tela ABRE na seção Meu Roteiro.
  it("com roteiro salvo: abre em 'Info Meu Roteiro' com os cards de totais e sem o CTA de criação", async () => {
    routeStorageState.saved = {
      id: "route_saved",
      startPoint: { lat: -22.9, lng: -43.1 },
      stops: [{ id: "s1", order: 1, vehicleStop: { lat: -22.9, lng: -43.1 }, pointIds: ["pt_-22.90000,-43.10000"], radiusMeters: 30 }],
      config: { walkingSpeedKmh: 5, deliveryBaseSeconds: 40, deliveryPerPackageSeconds: 15, vehicleSpeedKmh: 25, autoRadiusMeters: 30 },
      createdAt: "2026-07-10T10:00:00.000Z",
    };
    renderPage();

    expect(await screen.findByText(UI_LABELS.ROTEIRO_INFO.CARD_ADDRESSES)).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.ROTEIRO_INFO.CARD_STOPS)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: UI_LABELS.ROUTE_SUMMARY.CREATE_ROTEIRO })).not.toBeInTheDocument();
    // o toggle TROCA a seção (não empilha): o segmento do roteiro está ativo
    expect(screen.getByRole("button", { name: UI_LABELS.ROUTE_SUMMARY.SECTION_ROTEIRO })).toHaveAttribute("aria-pressed", "true");
    routeStorageState.saved = null;
  });

  it("REF-017: o toggle alterna de volta para o Original", async () => {
    routeStorageState.saved = {
      id: "route_saved",
      startPoint: { lat: -22.9, lng: -43.1 },
      stops: [{ id: "s1", order: 1, vehicleStop: { lat: -22.9, lng: -43.1 }, pointIds: ["pt_-22.90000,-43.10000"], radiusMeters: 30 }],
      config: { walkingSpeedKmh: 5, deliveryBaseSeconds: 40, deliveryPerPackageSeconds: 15, vehicleSpeedKmh: 25, autoRadiusMeters: 30 },
      createdAt: "2026-07-10T10:00:00.000Z",
    };
    renderPage();

    await screen.findByText(UI_LABELS.ROTEIRO_INFO.CARD_ADDRESSES);
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.ROUTE_SUMMARY.SECTION_ORIGINAL }));
    expect(screen.getByRole("button", { name: UI_LABELS.ROUTE_SUMMARY.SECTION_ORIGINAL })).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText(UI_LABELS.ROTEIRO_INFO.CARD_ADDRESSES)).not.toBeInTheDocument();
    routeStorageState.saved = null;
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

  it("oculta o botão 'Tabela Original' quando em 'Info Meu Roteiro' e exibe quando em 'Info Original' (RF-013)", async () => {
    routeStorageState.saved = {
      id: "route_saved",
      startPoint: { lat: -22.9, lng: -43.1 },
      stops: [{ id: "s1", order: 1, vehicleStop: { lat: -22.9, lng: -43.1 }, pointIds: ["pt_-22.90000,-43.10000"], radiusMeters: 30 }],
      config: { walkingSpeedKmh: 5, deliveryBaseSeconds: 40, deliveryPerPackageSeconds: 15, vehicleSpeedKmh: 25, autoRadiusMeters: 30 },
      createdAt: "2026-07-10T10:00:00.000Z",
    };
    renderPage();

    await screen.findByText(UI_LABELS.ROTEIRO_INFO.CARD_ADDRESSES);
    // Em Info Meu Roteiro: Tabela Original NÃO aparece, aparece Tabela Meu Roteiro
    expect(screen.queryByRole("button", { name: UI_LABELS.ROUTE_SUMMARY.ORIGINAL_TABLE })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: UI_LABELS.ROUTE_SUMMARY.ROTEIRO_TABLE })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: UI_LABELS.ROUTE_SUMMARY.SIMPLE_TABLE })).not.toBeInTheDocument();

    // Alterna para Info Original: Tabela Original aparece, sem tabela simplificada/roteiro
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.ROUTE_SUMMARY.SECTION_ORIGINAL }));
    expect(screen.getByRole("button", { name: UI_LABELS.ROUTE_SUMMARY.ORIGINAL_TABLE })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: UI_LABELS.ROUTE_SUMMARY.ROTEIRO_TABLE })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: UI_LABELS.ROUTE_SUMMARY.SIMPLE_TABLE })).not.toBeInTheDocument();

    routeStorageState.saved = null;
  });
});
