import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RoteiroStopSection } from "../../../../components/map/panel/RoteiroStopSection";
import type { StopItemData } from "../../../../utils/markers/panelModels";
import { ICON_KEYS, UI_LABELS } from "../../../../constants";

const STOP = UI_LABELS.MAP_PANEL.ROTEIRO_STOP;

const item: StopItemData = {
  addressKey: "pt_a",
  markerNumber: "1º",
  markerType: ICON_KEYS.HOME,
  addressLine: "Rua Mapa, 10",
  complement: UI_LABELS.ROUTE_MAP.ADDRESS_SHEET.NO_COMPLEMENT,
  packageCount: 1,
  packages: [{ label: "Ordem 12 | Parada 5", complement: "", spxTn: "SPX1", type: ICON_KEYS.HOME, typeLabel: "Residencial" }],
  mapsUrl: "https://www.google.com/maps?q=-22.98,-43.2",
};

const renderSection = () => {
  const handlers = { onTapCard: vi.fn(), onEdit: vi.fn(), onDissolve: vi.fn() };
  render(
    <RoteiroStopSection
      stopOrder={2}
      neighborhoods={["Botafogo"]}
      zipcodes={["22290-000"]}
      metrics={[{ label: UI_LABELS.MAP_PANEL.METRIC_ADDRESSES(3) }, { label: "~12 min · 850 m a pé" }]}
      item={item}
      expanded={false}
      {...handlers}
    />
  );
  return handlers;
};

describe("RoteiroStopSection (parada firmada selecionada — TASK-RF-006.4.2)", () => {
  it("mirrors the Original header: stop summary title/place/chips + selected-address card with the ordinal", () => {
    renderSection();

    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_STOP)).toBeInTheDocument();
    expect(screen.getByText(`${UI_LABELS.MAP_PANEL.STOP_PREFIX} 2 — Botafogo (22290-000)`)).toBeInTheDocument();
    expect(screen.getByText("~12 min · 850 m a pé")).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.SECTION_SELECTED)).toBeInTheDocument();
    expect(screen.getByText("1º")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Rua Mapa, 10/ })).toBeInTheDocument();
  });

  it("fires Editar/Desfazer and the card tap", () => {
    const handlers = renderSection();

    fireEvent.click(screen.getByRole("button", { name: STOP.EDIT }));
    fireEvent.click(screen.getByRole("button", { name: STOP.DISSOLVE }));
    fireEvent.click(screen.getByRole("button", { name: /Rua Mapa, 10/ }));
    expect(handlers.onEdit).toHaveBeenCalledTimes(1);
    expect(handlers.onDissolve).toHaveBeenCalledTimes(1);
    expect(handlers.onTapCard).toHaveBeenCalledTimes(1);
  });
});
