import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { RoteiroOverviewSection, type OverviewStopView } from "../../../../components/map/panel/RoteiroOverviewSection";
import { UI_LABELS } from "../../../../constants/uiLabels";
import { ROTEIRO_TYPE_COLORS } from "../../../../utils/markers/markerColors";

const OVERVIEW = UI_LABELS.MAP_PANEL.ROTEIRO_OVERVIEW;
const START = UI_LABELS.MAP_PANEL.ROTEIRO_START;

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

  // ------- Linha do tempo e distância do veículo entre paradas (TASK-RF-045, RF-59) -------

  const stopView = (order: number, outgoingLeg: OverviewStopView["outgoingLeg"]): OverviewStopView => ({
    id: `stop_${order}`,
    order,
    color: ROTEIRO_TYPE_COLORS.residential,
    neighborhoods: ["Ipanema"],
    zipcodes: ["22410-000"],
    metrics: [{ label: "1 endereço" }],
    items: [],
    vehicleStopKey: null,
    outgoingLeg,
  });
  const timelineItems = () => within(screen.getByRole("list", { name: OVERVIEW.TIMELINE_ARIA })).getAllByRole("listitem");
  const driveLegsIn = (element: HTMLElement) => within(element).queryAllByLabelText(UI_LABELS.MAP_PANEL.DRIVE_LEG_ARIA);

  it("linha do tempo: início e paradas em ordem, cada um com seu nó e as ações de hoje (RF-045)", () => {
    const onShowStopOnMap = vi.fn();
    render(<RoteiroOverviewSection {...defaultProps} stops={[stopView(1, null), stopView(2, null)]} onShowStopOnMap={onShowStopOnMap} />);

    const [start, p1, p2] = timelineItems();
    expect(timelineItems()).toHaveLength(3);
    // The start keeps its two gestures (RF-006.14) — no reorder handle from the mockup.
    expect(within(start).getByText("Ponto de Partida, 100")).toBeInTheDocument();
    expect(within(start).getByRole("button", { name: START.REPOSITION_START })).toBeInTheDocument();
    expect(within(start).getByRole("button", { name: START.DELETE_START })).toBeInTheDocument();
    // Each stop's number sits on its node; the card keeps expand + "ver no mapa".
    expect(within(p1).getByText("P1")).toBeInTheDocument();
    expect(within(p2).getByText("P2")).toBeInTheDocument();
    fireEvent.click(within(p2).getByRole("button", { name: UI_LABELS.MAP_PANEL.VIEW_ON_MAP }));
    expect(onShowStopOnMap).toHaveBeenCalledWith("stop_2");
    expect(within(p1).getByRole("button", { name: OVERVIEW.STOP_ARIA(1) })).toHaveAttribute("aria-expanded", "false");
  });

  it("mostra a distância do veículo no trilho entre paradas consecutivas; nenhuma depois da última (RF-045)", () => {
    render(
      <RoteiroOverviewSection
        {...defaultProps}
        start={{ addressLine: "Ponto de Partida, 100", outgoingLeg: { meters: 1300, viaStreets: true } }}
        stops={[stopView(1, { meters: 850, viaStreets: true }), stopView(2, null)]}
      />
    );

    const [start, p1, p2] = timelineItems();
    expect(driveLegsIn(start)).toHaveLength(1);
    expect(driveLegsIn(start)[0]).toHaveTextContent("1,3 km");
    expect(driveLegsIn(p1)).toHaveLength(1);
    expect(driveLegsIn(p1)[0]).toHaveTextContent("850 m");
    expect(driveLegsIn(p2)).toHaveLength(0);
  });

  it("sem início a primeira distância é P1→P2; com uma parada só, nenhuma (RF-045)", () => {
    const { unmount } = render(<RoteiroOverviewSection {...defaultProps} start={null} stops={[stopView(1, { meters: 850, viaStreets: false }), stopView(2, null)]} />);
    const [p1, p2] = timelineItems();
    expect(timelineItems()).toHaveLength(2);
    expect(driveLegsIn(p1)[0]).toHaveTextContent(`850 m ${START.SUGGESTION_STRAIGHT}`);
    expect(driveLegsIn(p2)).toHaveLength(0);
    unmount();

    render(<RoteiroOverviewSection {...defaultProps} start={null} stops={[stopView(1, null)]} />);
    expect(screen.queryAllByLabelText(UI_LABELS.MAP_PANEL.DRIVE_LEG_ARIA)).toHaveLength(0);
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
