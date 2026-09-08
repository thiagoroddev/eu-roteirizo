import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RoteiroPointSection, type StopOption } from "../../../../components/map/panel/RoteiroPointSection";
import type { StopItemData } from "../../../../utils/markers/panelModels";
import { ICON_KEYS, UI_LABELS } from "../../../../constants";

const POINT = UI_LABELS.MAP_PANEL.ROTEIRO_POINT;
const DRAFT = UI_LABELS.MAP_PANEL.ROTEIRO_DRAFT;

/** The point already adapted to the Original panel's vocabulary (RF-006.4.1). */
const item: StopItemData = {
  addressKey: "pt_a",
  markerNumber: "",
  markerType: ICON_KEYS.HOME,
  addressLine: "Rua Mapa, 10",
  complement: UI_LABELS.ROUTE_MAP.ADDRESS_SHEET.NO_COMPLEMENT,
  packageCount: 2,
  packages: [
    { label: UI_LABELS.MAP_PANEL.ITEM.PACKAGE_LABEL("5", "12"), complement: "Apto 101", spxTn: "SPX1", type: ICON_KEYS.HOME, typeLabel: "Residencial" },
    { label: UI_LABELS.MAP_PANEL.ITEM.PACKAGE_LABEL("5", "13"), complement: "", spxTn: "SPX2", type: ICON_KEYS.HOME, typeLabel: "Residencial" },
  ],
  mapsUrl: "https://www.google.com/maps?q=-22.98,-43.2",
};

const options: StopOption[] = [
  { id: "stop_1", label: POINT.STOP_OPTION(1, 2), far: false },
  { id: "stop_2", label: POINT.STOP_OPTION(2, 1), far: true },
];

const renderSection = (extra: Partial<React.ComponentProps<typeof RoteiroPointSection>> = {}) => {
  const handlers = { onCreateStop: vi.fn(), onIncorporate: vi.fn(), onTapCard: vi.fn(), onRadiusChange: vi.fn() };
  render(
    <RoteiroPointSection
      item={item}
      expanded={false}
      suggestedOrder={3}
      suggestedPlace={{ neighborhoods: ["Botafogo"], zipcodes: ["22270-000"] }}
      suggestedMetrics={[{ label: UI_LABELS.MAP_PANEL.METRIC_ADDRESSES(4) }, { label: DRAFT.ESTIMATE_TIME_ONLY(2) }]}
      vehicleDistanceLabel={POINT.DISTANCE_TO_HERE("1,2 km")}
      radiusMeters={30}
      stopOptions={options}
      defaultStopId="stop_1"
      {...handlers}
      {...extra}
    />
  );
  return handlers;
};

describe("RoteiroPointSection (tela 8 — TASK-RF-006.4.1/.4.2/.4.3, Original visual language)", () => {
  it("shows the selected-address section WITH the no-stop notice (rev. 08/07: no stop summary for an orphan)", () => {
    const handlers = renderSection();

    // The notice is about the ADDRESS → it lives under "Endereço selecionado".
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.SECTION_STOP)).not.toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED)).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ROTEIRO_NO_STOP_YET)).toBeInTheDocument();
    // The Original's own StopItemRow renders the card (street+number, no complement on multi).
    const card = screen.getByRole("button", { name: /Rua Mapa, 10/ });
    expect(card).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(card);
    expect(handlers.onTapCard).toHaveBeenCalledTimes(1);
  });

  it("3ª seção 'Parada sugerida': label row = vehicle distance (car icon, sr qualifier) + 'Criar parada' à direita (rev. 08/07 4ª rodada)", () => {
    renderSection();

    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_SUGGESTED)).toBeInTheDocument();
    // The summary reads exactly like a committed stop's (PanelTitle + chips).
    expect(screen.getByText("Parada 3 — Botafogo (22270-000)")).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.METRIC_ADDRESSES(4))).toBeInTheDocument();
    expect(screen.getByText(DRAFT.ESTIMATE_TIME_ONLY(2))).toBeInTheDocument();
    // The vehicle leg lives on the LABEL ROW, qualified by the car icon
    // (sr-only text keeps it spoken); the candidates banner is gone here.
    const distance = screen.getByText(POINT.DISTANCE_TO_HERE("1,2 km"));
    expect(distance).toBeInTheDocument();
    expect(screen.getByText(POINT.VEHICLE_QUALIFIER)).toBeInTheDocument();
    expect(distance.closest("div")).toContainElement(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_SUGGESTED));
    expect(screen.queryByText(DRAFT.BANNER_CANDIDATES(2))).not.toBeInTheDocument();
    // "Criar parada" shares the label row (the PanelSection actions slot).
    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_SUGGESTED).closest("div")?.parentElement).toContainElement(screen.getByRole("button", { name: POINT.CREATE_STOP }));
  });

  it("tem o stepper de raio na 'Parada sugerida' — ajustável antes de criar (RF-006.4.6)", () => {
    const handlers = renderSection({ radiusMeters: 30 });

    expect(screen.getByText(DRAFT.RADIUS_LABEL)).toBeInTheDocument();
    expect(screen.getByText(DRAFT.RADIUS_VALUE(30))).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: DRAFT.RADIUS_INCREASE }));
    expect(handlers.onRadiusChange).toHaveBeenCalledWith(40);
    fireEvent.click(screen.getByRole("button", { name: DRAFT.RADIUS_DECREASE }));
    expect(handlers.onRadiusChange).toHaveBeenCalledWith(20);
  });

  it("'Criar parada' fires; the target select only appears ON DEMAND and confirms the nearest pre-set", () => {
    const handlers = renderSection();

    fireEvent.click(screen.getByRole("button", { name: POINT.CREATE_STOP }));
    expect(handlers.onCreateStop).toHaveBeenCalledTimes(1);

    // No fixed select (rev. 08/07 3ª rodada) — it appears on the button tap.
    expect(screen.queryByRole("combobox", { name: POINT.TARGET_STOP_ARIA })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: POINT.INCORPORATE_OTHER }));
    const select = screen.getByRole("combobox", { name: POINT.TARGET_STOP_ARIA });
    expect(select).toHaveValue("stop_1");
    fireEvent.click(screen.getByRole("button", { name: POINT.CONFIRM }));
    expect(handlers.onIncorporate).toHaveBeenCalledWith("stop_1");
  });

  it("popup (rev. 15/07): FAR stop shows the soft warning (RN-17 — never blocks); Confirmar e Cancelar fecham", () => {
    const handlers = renderSection();

    fireEvent.click(screen.getByRole("button", { name: POINT.INCORPORATE_OTHER }));
    fireEvent.change(screen.getByRole("combobox", { name: POINT.TARGET_STOP_ARIA }), { target: { value: "stop_2" } });

    expect(screen.getByText(POINT.FAR_FROM_STOP)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: POINT.CONFIRM }));
    expect(handlers.onIncorporate).toHaveBeenCalledWith("stop_2");
    // Confirming CLOSES the popup (rev. 15/07 — it used to be an inline select).
    expect(screen.queryByRole("combobox", { name: POINT.TARGET_STOP_ARIA })).not.toBeInTheDocument();

    // Reopening and cancelling closes without incorporating again.
    fireEvent.click(screen.getByRole("button", { name: POINT.INCORPORATE_OTHER }));
    fireEvent.click(screen.getByRole("button", { name: POINT.CANCEL }));
    expect(screen.queryByRole("combobox", { name: POINT.TARGET_STOP_ARIA })).not.toBeInTheDocument();
    expect(handlers.onIncorporate).toHaveBeenCalledTimes(1);
  });

  it("without stops there is no incorporate button — only 'Criar parada'", () => {
    renderSection({ stopOptions: [], defaultStopId: null, vehicleDistanceLabel: `${POINT.DISTANCE_TO_HERE("160 m")} (linha reta)` });

    expect(screen.getByRole("button", { name: POINT.CREATE_STOP })).toBeInTheDocument();
    expect(screen.queryByRole("combobox", { name: POINT.TARGET_STOP_ARIA })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: POINT.INCORPORATE_OTHER })).not.toBeInTheDocument();
    // Straight-line fallback keeps the honest suffix.
    expect(screen.getByText(`${POINT.DISTANCE_TO_HERE("160 m")} (linha reta)`)).toBeInTheDocument();
  });

  it("permite selecionar posicao de insercao e passa targetOrder", () => {
    const handlers = renderSection({
      stopOptions: options,
      totalStops: 3,
    });
    const positionSelect = screen.getByRole("combobox", { name: POINT.INSERT_POSITION_LABEL });
    expect(positionSelect).toBeInTheDocument();

    fireEvent.change(positionSelect, { target: { value: "2" } });
    expect(screen.getByText("Parada 2 — Botafogo (22270-000)")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: POINT.CREATE_STOP }));
    expect(handlers.onCreateStop).toHaveBeenCalledWith(2);
  });
});
