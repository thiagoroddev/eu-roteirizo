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

describe("RoteiroStopSection (parada firmada — TASK-RF-006.4.2/.4.7/.4.16, revisto na .15)", () => {
  it("título SEMPRE bairro (CEPs) e seção 'Endereço selecionado' — sem 'Veículo (âncora)' (RF-006.15)", () => {
    renderSection();

    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_STOP)).toBeInTheDocument();
    // O título voltou ao padrão bairro/CEP (a .5 tinha trocado por "Veículo (âncora)").
    expect(screen.getByText(`${UI_LABELS.MAP_PANEL.STOP_PREFIX} 2 — Botafogo (22290-000)`)).toBeInTheDocument();
    expect(screen.getByText("~12 min · 850 m a pé")).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED)).toBeInTheDocument();
  });

  it("kind='vehicle' = SEMPRE o veículo: glifo do carro + badge, SEM pacote, NÃO tocável, com 'Editar local' (RF-006.16/.18)", () => {
    const handlers = renderSection({ selectedKind: "vehicle" });

    // Glifo do veículo (não o ordinal) + o badge de texto "Parada do veículo".
    expect(screen.getByText(UI_LABELS.MAP_PANEL.VEHICLE_STOP_BADGE)).toBeInTheDocument();
    expect(screen.queryByText("1º")).not.toBeInTheDocument();
    // Sem badge de pacote na row do veículo (não é uma entrega).
    expect(screen.queryByLabelText(UI_LABELS.MAP_PANEL.METRIC_PACKAGES(1))).not.toBeInTheDocument();
    // Tocar a row não faz nada (informacional, sem pacotes)…
    fireEvent.click(screen.getByRole("button", { name: /Rua Mapa, 10/ }));
    expect(handlers.onTapCard).not.toHaveBeenCalled();
    // …mas o atalho "Editar local do veículo" reabre a edição (RF-006.18).
    fireEvent.click(screen.getByRole("button", { name: STOP.EDIT_VEHICLE }));
    expect(handlers.onEdit).toHaveBeenCalledTimes(1);
  });

  it("kind='coincident' (o endereço onde o veículo para): ordinal + pacote + badge 'Parada do veículo', TOCÁVEL (RF-006.18)", () => {
    const handlers = renderSection({ selectedItem: memberItem, selectedKind: "coincident" });

    // Continua sendo uma entrega: ordinal + pacotes, tocável…
    expect(screen.getByText("2º")).toBeInTheDocument();
    expect(screen.getByLabelText(UI_LABELS.MAP_PANEL.METRIC_PACKAGES(2))).toBeInTheDocument();
    // …com o badge de texto "Parada do veículo" (igual à row do carro).
    expect(screen.getByText(UI_LABELS.MAP_PANEL.VEHICLE_STOP_BADGE)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Av\. Membro, 200/ }));
    expect(handlers.onTapCard).toHaveBeenCalledTimes(1);
  });

  it("kind='member': ordinal + complemento + pacote, e é TOCÁVEL (RF-006.4.16)", () => {
    const handlers = renderSection({ selectedItem: memberItem, selectedKind: "member" });

    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED)).toBeInTheDocument();
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.VEHICLE_STOP_BADGE)).not.toBeInTheDocument();
    expect(screen.queryByLabelText(UI_LABELS.MAP_PANEL.VEHICLE_STOP_BADGE)).not.toBeInTheDocument();
    expect(screen.getByText(`${UI_LABELS.ROUTE_MAP.ADDRESS_SHEET.COMPLEMENT} Loja 4`)).toBeInTheDocument();
    expect(screen.getByLabelText(UI_LABELS.MAP_PANEL.METRIC_PACKAGES(2))).toBeInTheDocument(); // pacote visível
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

  it("com a lista aberta: o toggle vira 'Esconder lista' e a row do endereço some (a lista É os endereços)", () => {
    renderSection({ listOpen: true });

    expect(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.HIDE_FULL_LIST })).toBeInTheDocument();
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: STOP.EDIT })).toBeInTheDocument();
  });
});
