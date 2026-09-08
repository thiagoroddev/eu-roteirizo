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

  it("permite mover parada para cima e para baixo", () => {
    const onReorderStop = vi.fn();
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
    render(<RoteiroOverviewSection {...defaultProps} stops={twoStops} onReorderStop={onReorderStop} />);

    const upStop1 = screen.getByRole("button", { name: OVERVIEW.MOVE_UP_ARIA(1) });
    expect(upStop1).toBeDisabled();

    const downStop1 = screen.getByRole("button", { name: OVERVIEW.MOVE_DOWN_ARIA(1) });
    expect(downStop1).not.toBeDisabled();
    fireEvent.click(downStop1);
    expect(onReorderStop).toHaveBeenCalledWith("stop_1", 2);

    const downStop2 = screen.getByRole("button", { name: OVERVIEW.MOVE_DOWN_ARIA(2) });
    expect(downStop2).toBeDisabled();

    const upStop2 = screen.getByRole("button", { name: OVERVIEW.MOVE_UP_ARIA(2) });
    expect(upStop2).not.toBeDisabled();
    fireEvent.click(upStop2);
    expect(onReorderStop).toHaveBeenCalledWith("stop_2", 1);
  });
});
