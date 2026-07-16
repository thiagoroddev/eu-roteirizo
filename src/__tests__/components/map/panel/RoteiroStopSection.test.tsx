import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { RoteiroStopSection } from "../../../../components/map/panel/RoteiroStopSection";
import type { StopItemData } from "../../../../utils/markers/panelModels";
import { ICON_KEYS, UI_LABELS } from "../../../../constants";

const STOP = UI_LABELS.MAP_PANEL.ROTEIRO_STOP;

/** The stop's ANCHOR item (RF-006.4.7): rendered with the vehicle glyph, no complement. */
const anchorItem: StopItemData = {
  addressKey: "pt_a",
  markerNumber: "",
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
  markerNumber: "2",
  markerType: ICON_KEYS.OFFICE,
  addressLine: "Av. Membro, 200",
  complement: "Loja 4",
  packageCount: 2,
  packages: [{ label: "Ordem 13 | Parada 5", complement: "Loja 4", spxTn: "SPX2", type: ICON_KEYS.OFFICE, typeLabel: "Comercial" }],
  mapsUrl: "https://www.google.com/maps?q=-22.99,-43.21",
};

const renderSection = (extra: Partial<React.ComponentProps<typeof RoteiroStopSection>> = {}) => {
  const handlers = { onTapCard: vi.fn(), onEdit: vi.fn(), onDissolve: vi.fn(), onToggleList: vi.fn(), onMoveAnchor: vi.fn(), onResetAnchor: vi.fn(), onMakeMemberAnchor: vi.fn() };
  render(
    <RoteiroStopSection
      stopOrder={2}
      neighborhoods={["Botafogo"]}
      zipcodes={["22290-000"]}
      metrics={[{ label: UI_LABELS.MAP_PANEL.METRIC_ADDRESSES(3) }, { label: "~12 min · 850 m a pé" }]}
      selectedItem={anchorItem}
      isAnchor
      expanded={false}
      listOpen={false}
      moveHintActive={false}
      {...handlers}
      {...extra}
    />
  );
  return handlers;
};

describe("RoteiroStopSection (parada firmada selecionada — TASK-RF-006.4.2/.4.7/.4.16)", () => {
  it("com nenhum membro selecionado: mostra o resumo + a âncora (parada do veículo) na seção 'Endereço selecionado'", () => {
    renderSection();

    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_STOP)).toBeInTheDocument();
    // Âncora selecionada → o título troca o lugar por "Veículo (âncora)" (RF-006.5).
    expect(screen.getByText(`${UI_LABELS.MAP_PANEL.STOP_PREFIX} 2 — ${STOP.ANCHOR_PLACE}`)).toBeInTheDocument();
    expect(screen.getByText("~12 min · 850 m a pé")).toBeInTheDocument();
    // Label da âncora + endereço sem "1º" (o glifo do veículo substitui o número).
    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED_ANCHOR)).toBeInTheDocument();
    expect(screen.queryByText("1º")).not.toBeInTheDocument();
    // A âncora é a selecionada → destacada por padrão (RF-006.4.13).
    expect(screen.getByRole("button", { name: /Rua Mapa, 10/ })).toHaveAttribute("aria-current", "true");
  });

  it("com um membro selecionado (RF-006.4.16): usa a label 'Endereço selecionado', mostra o número da ordem e o complemento", () => {
    renderSection({ selectedItem: memberItem, isAnchor: false });

    // Label do membro (sem "— parada do veículo (âncora)"); o título mantém o LUGAR.
    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED)).toBeInTheDocument();
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED_ANCHOR)).not.toBeInTheDocument();
    expect(screen.getByText(`${UI_LABELS.MAP_PANEL.STOP_PREFIX} 2 — Botafogo (22290-000)`)).toBeInTheDocument();
    // O endereço do membro selecionado + seu complemento aparecem, destacados.
    const row = screen.getByRole("button", { name: /Av\. Membro, 200/ });
    expect(row).toHaveAttribute("aria-current", "true");
    expect(screen.getByText(`${UI_LABELS.ROUTE_MAP.ADDRESS_SHEET.COMPLEMENT} Loja 4`)).toBeInTheDocument();
  });

  it("layout RF-006.4.7: 'Ver lista completa' no topo + Editar/Desfazer no rodapé; dispara os handlers", () => {
    const handlers = renderSection();

    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.VIEW_FULL_LIST }));
    expect(handlers.onToggleList).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole("button", { name: STOP.EDIT }));
    fireEvent.click(screen.getByRole("button", { name: STOP.DISSOLVE }));
    fireEvent.click(screen.getByRole("button", { name: /Rua Mapa, 10/ }));
    expect(handlers.onEdit).toHaveBeenCalledTimes(1);
    expect(handlers.onDissolve).toHaveBeenCalledTimes(1);
    expect(handlers.onTapCard).toHaveBeenCalledTimes(1);
  });

  it("gestos da âncora (RF-006.5): Mover/Resetar na âncora; 'Tornar âncora' no membro; dica só durante o mover", () => {
    const handlers = renderSection();

    fireEvent.click(screen.getByRole("button", { name: STOP.MOVE_ANCHOR }));
    fireEvent.click(screen.getByRole("button", { name: STOP.RESET_ANCHOR }));
    expect(handlers.onMoveAnchor).toHaveBeenCalledTimes(1);
    expect(handlers.onResetAnchor).toHaveBeenCalledTimes(1);
    // Sem membro selecionado não há "Tornar âncora"; sem mover ativo, sem dica.
    expect(screen.queryByRole("button", { name: STOP.MAKE_ANCHOR })).not.toBeInTheDocument();
    expect(screen.queryByText(STOP.MOVE_ANCHOR_HINT)).not.toBeInTheDocument();
  });

  it("gestos da âncora: a dica de arrasto aparece com o mover ativo; o membro selecionado oferece 'Tornar âncora'", () => {
    renderSection({ moveHintActive: true });
    expect(screen.getByText(STOP.MOVE_ANCHOR_HINT)).toBeInTheDocument();

    cleanup();
    const handlers = renderSection({ selectedItem: memberItem, isAnchor: false });
    fireEvent.click(screen.getByRole("button", { name: STOP.MAKE_ANCHOR }));
    expect(handlers.onMakeMemberAnchor).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: STOP.MOVE_ANCHOR })).not.toBeInTheDocument();
  });

  it("com a lista aberta: o toggle vira 'Esconder lista' e a seção do endereço selecionado some (a lista É os endereços)", () => {
    renderSection({ listOpen: true });

    expect(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.HIDE_FULL_LIST })).toBeInTheDocument();
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED_ANCHOR)).not.toBeInTheDocument();
    // Editar/Desfazer seguem visíveis (rodapé do resumo).
    expect(screen.getByRole("button", { name: STOP.EDIT })).toBeInTheDocument();
  });
});
