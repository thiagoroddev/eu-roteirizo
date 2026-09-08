import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RoteiroStopSection } from "../../../../components/map/panel/RoteiroStopSection";
import type { StopItemData } from "../../../../utils/markers/panelModels";
import { ICON_KEYS, UI_LABELS } from "../../../../constants";

const STOP = UI_LABELS.MAP_PANEL.ROTEIRO_STOP;

/** An address of the stop (RF-006.15): shown with its ordinal marker. */
const addressItem: StopItemData = {
  addressKey: "pt_a",
  markerNumber: "1º",
  markerType: ICON_KEYS.HOME,
  addressLine: "Rua Mapa, 10",
  complement: UI_LABELS.ROUTE_MAP.ADDRESS_SHEET.NO_COMPLEMENT,
  packageCount: 1,
  packages: [{ label: "Ordem 12 | Parada 5", complement: "", spxTn: "SPX1", type: ICON_KEYS.HOME, typeLabel: "Residencial" }],
  mapsUrl: "https://www.google.com/maps?q=-22.98,-43.2",
};

/** A tapped MEMBER of the expanded stop (RF-006.4.16): ordinal marker + real complement. */
const memberItem: StopItemData = {
  addressKey: "pt_b",
  markerNumber: "2º",
  markerType: ICON_KEYS.OFFICE,
  addressLine: "Av. Membro, 200",
  complement: "Loja 4",
  packageCount: 2,
  packages: [{ label: "Ordem 13 | Parada 5", complement: "Loja 4", spxTn: "SPX2", type: ICON_KEYS.OFFICE, typeLabel: "Comercial" }],
  mapsUrl: "https://www.google.com/maps?q=-22.99,-43.21",
};

const renderSection = (extra: Partial<React.ComponentProps<typeof RoteiroStopSection>> = {}) => {
  const handlers = { onTapCard: vi.fn(), onEdit: vi.fn(), onDissolve: vi.fn(), onToggleList: vi.fn() };
  render(
    <RoteiroStopSection
      stopOrder={2}
      neighborhoods={["Botafogo"]}
      zipcodes={["22290-000"]}
      metrics={[{ label: UI_LABELS.MAP_PANEL.METRIC_ADDRESSES(3) }, { label: "~12 min · 850 m a pé" }]}
      selectedItem={addressItem}
      selectedKind="vehicle"
      expanded={false}
      listOpen={false}
      {...handlers}
      {...extra}
    />
  );
  return handlers;
};

describe("RoteiroStopSection (parada firmada — RF-53 / TASK-RF-038)", () => {
  it("oculta a seção 'Endereço selecionado' quando isExpanded é falso (parada agrupada) e exibe badge P2", () => {
    renderSection({ isExpanded: false, stopColor: { top: "#00E5FF", bottom: "#0088FF", glow: "#00D1FF", numberInk: "#0B1528" } });

    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_STOP)).toBeInTheDocument();
    expect(screen.getByText("P2")).toBeInTheDocument();
    expect(screen.getByText(`${UI_LABELS.MAP_PANEL.STOP_PREFIX} 2 — Botafogo (22290-000)`)).toBeInTheDocument();
    expect(screen.getByText("~12 min · 850 m a pé")).toBeInTheDocument();
    // Parada agrupada: o card Endereço selecionado NÃO aparece (RF-53)
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED)).not.toBeInTheDocument();
  });

  it("renderiza layout em 2 linhas com titleOverride e subtitleOverride", () => {
    renderSection({
      titleOverride: "Avenida Epitácio Pessoa, 4224",
      subtitleOverride: "Lagoa, 22061-000",
    });
    expect(screen.getByText("P2")).toBeInTheDocument();
    expect(screen.getByText("Avenida Epitácio Pessoa, 4224")).toBeInTheDocument();
    expect(screen.getByText("Lagoa, 22061-000")).toBeInTheDocument();
  });

  it("exibe a seção 'Endereço selecionado' sem badge de veículo quando isExpanded é verdadeiro", () => {
    const handlers = renderSection({ isExpanded: true, selectedItem: memberItem, selectedKind: "member" });

    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED)).toBeInTheDocument();
    // Sem o selo 'Parada do veículo' (RF-53)
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.VEHICLE_STOP_BADGE)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(UI_LABELS.MAP_PANEL.VEHICLE_STOP_BADGE)).not.toBeInTheDocument();
    expect(screen.getByText("2º")).toBeInTheDocument();
    expect(screen.getByText(`${UI_LABELS.ROUTE_MAP.ADDRESS_SHEET.COMPLEMENT} Loja 4`)).toBeInTheDocument();
    expect(screen.getByLabelText(UI_LABELS.MAP_PANEL.METRIC_PACKAGES(2))).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Av\. Membro, 200/ }));
    expect(handlers.onTapCard).toHaveBeenCalledTimes(1);
  });

  it("NÃO tem gestos de âncora — editar âncora = 'Editar parada' (RF-006.15 reverteu a .5)", () => {
    const handlers = renderSection();

    expect(screen.queryByRole("button", { name: STOP.RESET_ANCHOR })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: STOP.REVERSE_ORDER })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: STOP.MAKE_ANCHOR })).not.toBeInTheDocument();

    // Os controles read-only seguem: Editar / Desfazer / Ver parada.
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.VIEW_FULL_LIST }));
    fireEvent.click(screen.getByRole("button", { name: STOP.EDIT }));
    fireEvent.click(screen.getByRole("button", { name: STOP.DISSOLVE }));
    expect(handlers.onToggleList).toHaveBeenCalledTimes(1);
    expect(handlers.onEdit).toHaveBeenCalledTimes(1);
    expect(handlers.onDissolve).toHaveBeenCalledTimes(1);
  });

  it("com a lista aberta: o toggle vira 'Esconder lista' e a row do endereço some", () => {
    renderSection({ isExpanded: true, listOpen: true });

    expect(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.HIDE_FULL_LIST })).toBeInTheDocument();
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: STOP.EDIT })).toBeInTheDocument();
  });

  it("botão de exclusão usa rótulo Deletar parada", () => {
    const handlers = renderSection();
    const deleteBtn = screen.getByRole("button", { name: "Deletar parada" });
    expect(deleteBtn).toBeInTheDocument();
    fireEvent.click(deleteBtn);
    expect(handlers.onDissolve).toHaveBeenCalledTimes(1);
  });
});
