import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { StopItemList } from "../../../../components/map/panel/StopItemList";
import { UI_LABELS, ICON_KEYS } from "../../../../constants";
import type { StopItemData } from "../../../../utils/markers/panelModels";

const SHEET = UI_LABELS.ROUTE_MAP.ADDRESS_SHEET;

const makeItem = (overrides: Partial<StopItemData> = {}): StopItemData => ({
  addressKey: "0:0",
  markerNumber: "5",
  markerType: ICON_KEYS.HOME_CORRECTED,
  addressLine: "Rua Alfa, 10",
  complement: "casa 2",
  neighborhood: "Botafogo",
  zipcode: "22271-110",
  typeLabel: SHEET.TYPE_LABELS.RESIDENTIAL,
  packageCount: 2,
  packages: [
    { label: "Parada 7 · Seq 2", spxTn: "BR222", typeLabel: SHEET.TYPE_LABELS.RESIDENTIAL },
    { label: "Parada 7 · Seq 9", spxTn: "BR111", typeLabel: SHEET.TYPE_LABELS.RESIDENTIAL },
  ],
  mapsUrl: "https://www.google.com/maps?q=-22.9,-43.2",
  ...overrides,
});

describe("StopItemList / StopItem", () => {
  it("renders one collapsed item per address: marker number, address, complement and package badge (>1)", () => {
    render(<StopItemList items={[makeItem()]} expandedKey={null} onItemTap={vi.fn()} />);

    expect(screen.getByRole("list", { name: UI_LABELS.MAP_PANEL.ITEM.LIST_ARIA })).toBeInTheDocument();
    expect(screen.getByText("5")).toBeInTheDocument();
    expect(screen.getByText("Rua Alfa, 10")).toBeInTheDocument();
    expect(screen.getByText("casa 2")).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.METRIC_PACKAGES(2))).toBeInTheDocument();
    // Collapsed: no detail.
    expect(screen.queryByText(SHEET.PACKAGES_HEADER(2))).not.toBeInTheDocument();
    expect(screen.getByRole("button", { expanded: false })).toBeInTheDocument();
  });

  it("hides the package badge and the complement line when there is nothing to show", () => {
    render(<StopItemList items={[makeItem({ packageCount: 1, complement: SHEET.NO_COMPLEMENT })]} expandedKey={null} onItemTap={vi.fn()} />);

    expect(screen.queryByText(UI_LABELS.MAP_PANEL.METRIC_PACKAGES(1))).not.toBeInTheDocument();
    expect(screen.queryByText(SHEET.NO_COMPLEMENT)).not.toBeInTheDocument();
  });

  it("expands the item matching expandedKey: detail, package rows and Maps link", () => {
    render(<StopItemList items={[makeItem()]} expandedKey="0:0" onItemTap={vi.fn()} />);

    expect(screen.getByRole("button", { expanded: true })).toBeInTheDocument();
    expect(screen.getByText("Botafogo")).toBeInTheDocument();
    expect(screen.getByText("22271-110")).toBeInTheDocument();
    expect(screen.getByText(SHEET.PACKAGES_HEADER(2))).toBeInTheDocument();
    expect(screen.getByText("Parada 7 · Seq 2")).toBeInTheDocument();
    expect(screen.getByText("BR222")).toBeInTheDocument();
    expect(screen.getAllByText(SHEET.TYPE_LABELS.RESIDENTIAL).length).toBeGreaterThan(0);
    expect(screen.getByRole("link", { name: SHEET.GOOGLE_MAPS })).toHaveAttribute("href", "https://www.google.com/maps?q=-22.9,-43.2");
  });

  it("taps emit onItemTap with the item's addressKey", () => {
    const onItemTap = vi.fn();
    const items = [makeItem(), makeItem({ addressKey: "0:1", addressLine: "Rua Beta, 20" })];
    render(<StopItemList items={items} expandedKey={null} onItemTap={onItemTap} />);

    fireEvent.click(screen.getByText("Rua Beta, 20"));

    expect(onItemTap).toHaveBeenCalledWith("0:1");
  });

  it("shows the empty state when the stop has no plottable address", () => {
    render(<StopItemList items={[]} expandedKey={null} onItemTap={vi.fn()} />);

    expect(screen.getByText(UI_LABELS.MAP_PANEL.ITEM.NO_ITEMS)).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
