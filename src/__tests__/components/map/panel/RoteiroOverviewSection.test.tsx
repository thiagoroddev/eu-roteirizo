import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RoteiroOverviewSection } from "../../../../components/map/panel/RoteiroOverviewSection";
import { UI_LABELS } from "../../../../constants/uiLabels";

const OVERVIEW = UI_LABELS.MAP_PANEL.ROTEIRO_OVERVIEW;

const defaultProps = {
  progress: {
    addressesDone: 5,
    addressesTotal: 10,
    packagesDone: 5,
    packagesTotal: 10,
    stopsCount: 1,
    ratio: 0.5,
  },
  totals: {
    vehicleStops: 1,
    walkPoints: 3,
    distanceVehicleKm: 1.2,
    distanceWalkKm: 0.3,
    distanceTotalKm: 1.5,
    timeVehicleMin: 5,
    timeWalkMin: 5,
    timeDeliveryMin: 10,
    timeTotalMin: 20,
  },
  commercialPackages: 0,
  start: { addressLine: "Ponto de Partida, 100" },
  onDeleteStart: vi.fn(),
  onRepositionStart: vi.fn(),
  stops: [
    {
      id: "stop_1",
      order: 1,
      neighborhoods: ["Ipanema"],
      zipcodes: ["22410-000"],
      metrics: [{ label: "3 entregas" }],
      items: [],
      vehicleStopKey: null,
    },
  ],
  startKey: null,
  suggestion: null,
  onShowStopOnMap: vi.fn(),
  onShowSuggestedOnMap: vi.fn(),
  onCreateSuggested: vi.fn(),
};

describe("RoteiroOverviewSection (TASK-RF-013 Exportar Roteiro)", () => {
  it("renderiza o botão 'Exportar roteiro' quando há paradas e onExportRoute é fornecido", () => {
    const onExportRoute = vi.fn();
    render(<RoteiroOverviewSection {...defaultProps} onExportRoute={onExportRoute} />);

    const exportBtn = screen.getByRole("button", { name: OVERVIEW.EXPORT_ROUTE_ARIA });
    expect(exportBtn).toBeInTheDocument();
    expect(screen.getByText(OVERVIEW.EXPORT_ROUTE)).toBeInTheDocument();

    fireEvent.click(exportBtn);
    expect(onExportRoute).toHaveBeenCalledTimes(1);
  });

  it("não renderiza o botão de exportação se não houver paradas confirmadas", () => {
    const onExportRoute = vi.fn();
    render(<RoteiroOverviewSection {...defaultProps} stops={[]} onExportRoute={onExportRoute} />);

    expect(screen.queryByRole("button", { name: OVERVIEW.EXPORT_ROUTE_ARIA })).not.toBeInTheDocument();
  });

  it("não renderiza o botão de exportação se onExportRoute não for fornecido", () => {
    render(<RoteiroOverviewSection {...defaultProps} onExportRoute={undefined} />);

    expect(screen.queryByRole("button", { name: OVERVIEW.EXPORT_ROUTE_ARIA })).not.toBeInTheDocument();
  });

  it("não renderiza botões de reordenar paradas na visão geral", () => {
    const twoStops = [
      {
        id: "stop_1",
        order: 1,
        neighborhoods: ["Ipanema"],
        zipcodes: ["22410-000"],
        metrics: [{ label: "3 entregas" }],
        items: [],
        vehicleStopKey: null,
      },
      {
        id: "stop_2",
        order: 2,
        neighborhoods: ["Copacabana"],
        zipcodes: ["22020-000"],
        metrics: [{ label: "2 entregas" }],
        items: [],
        vehicleStopKey: null,
      },
    ];
    render(<RoteiroOverviewSection {...defaultProps} stops={twoStops} />);

    expect(screen.queryByRole("button", { name: OVERVIEW.MOVE_UP_ARIA(1) })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: OVERVIEW.MOVE_DOWN_ARIA(1) })).not.toBeInTheDocument();
  });

  it("exibe o título da parada com P{N} e o endereço do veículo (RF-53 / TASK-RF-038)", () => {
    const stopsWithTitle = [
      {
        id: "stop_1",
        order: 1,
        titleOverride: "P1 - Rua Barão da Torre, 123",
        neighborhoods: ["Ipanema"],
        zipcodes: ["22410-000"],
        metrics: [{ label: "3 entregas" }],
        items: [],
        vehicleStopKey: null,
      },
    ];
    render(<RoteiroOverviewSection {...defaultProps} stops={stopsWithTitle} />);

    expect(screen.getByText("P1 - Rua Barão da Torre, 123")).toBeInTheDocument();
    expect(screen.getByText("Ipanema, 22410-000")).toBeInTheDocument();
  });

  it("renderiza a seção de endereços ignorados em último lugar com ações de restaurar e ver no mapa", () => {
    const onUnignorePoint = vi.fn();
    const onShowPointOnMap = vi.fn();
    const ignoredItem = {
      addressKey: "pt_ignored",
      markerNumber: "",
      markerType: "home",
      addressLine: "Rua Euclides da Rocha, 421",
      complement: "Sem complemento",
      packageCount: 1,
      packages: [],
      mapsUrl: "https://maps.google.com",
    };

    render(<RoteiroOverviewSection {...defaultProps} ignoredItems={[ignoredItem]} onUnignorePoint={onUnignorePoint} onShowPointOnMap={onShowPointOnMap} />);

    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_IGNORED(1))).toBeInTheDocument();
    expect(screen.getByText("Rua Euclides da Rocha, 421")).toBeInTheDocument();

    const unignoreBtn = screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.UNIGNORE_ADDRESS });
    fireEvent.click(unignoreBtn);
    expect(onUnignorePoint).toHaveBeenCalledWith("pt_ignored");

    const showOnMapBtns = screen.getAllByRole("button", { name: UI_LABELS.MAP_PANEL.VIEW_ON_MAP });
    const showOnMapBtn = showOnMapBtns[showOnMapBtns.length - 1];
    fireEvent.click(showOnMapBtn);
    expect(onShowPointOnMap).toHaveBeenCalledWith("pt_ignored");
  });
});
