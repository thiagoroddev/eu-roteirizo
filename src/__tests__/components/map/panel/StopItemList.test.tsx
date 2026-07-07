import { describe, it, expect } from "vitest";
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
  packageCount: 2,
  packages: [
    { label: "Ordem 2 | Parada 7", complement: "Apto 101", spxTn: "BR222", type: ICON_KEYS.HOME_CORRECTED, typeLabel: SHEET.TYPE_LABELS.RESIDENTIAL },
    { label: "Ordem 9 | Parada 7", complement: "Loja 3", spxTn: "BR111", type: ICON_KEYS.OFFICE_CORRECTED, typeLabel: SHEET.TYPE_LABELS.COMMERCIAL },
  ],
  mapsUrl: "https://www.google.com/maps?q=-22.9,-43.2",
  ...overrides,
});

const twoItems = () => [makeItem(), makeItem({ addressKey: "0:1", addressLine: "Rua Beta, 20", packageCount: 1, packages: [makeItem().packages[0]] })];

describe("StopItemList / StopItem (list view — rev. 07/07)", () => {
  it("opens with EVERY item expanded (scan mode) and the badge as box glyph + count", () => {
    render(<StopItemList items={twoItems()} selectedKey={null} />);

    const rows = screen.getAllByRole("button", { expanded: true });
    expect(rows).toHaveLength(2); // nothing starts collapsed
    expect(screen.getByText(SHEET.PACKAGES_HEADER(2))).toBeInTheDocument();
    expect(screen.getByText(SHEET.PACKAGES_HEADER(1))).toBeInTheDocument();
    // Badge = icon + count only (accessible name keeps the full text).
    const badge = screen.getByLabelText(UI_LABELS.MAP_PANEL.METRIC_PACKAGES(2));
    expect(badge).toHaveTextContent("2");
    expect(badge.querySelector("svg")).not.toBeNull();
  });

  it("tapping a row toggles ONLY that item's expansion", () => {
    render(<StopItemList items={twoItems()} selectedKey={null} />);

    fireEvent.click(screen.getByRole("button", { name: /Rua Alfa, 10/ }));

    expect(screen.getByRole("button", { name: /Rua Alfa, 10/ })).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("button", { name: /Rua Beta, 20/ })).toHaveAttribute("aria-expanded", "true");
    expect(screen.queryByText(SHEET.PACKAGES_HEADER(2))).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /Rua Alfa, 10/ }));
    expect(screen.getByRole("button", { name: /Rua Alfa, 10/ })).toHaveAttribute("aria-expanded", "true");
  });

  it("highlights the SELECTED item (aria-current), independent of expansion", () => {
    render(<StopItemList items={twoItems()} selectedKey="0:1" />);

    expect(screen.getByRole("button", { name: /Rua Beta, 20/ })).toHaveAttribute("aria-current", "true");
    expect(screen.getByRole("button", { name: /Rua Alfa, 10/ })).not.toHaveAttribute("aria-current");
    expect(screen.getByRole("button", { name: /Rua Beta, 20/ }).className).toContain("bg-accent");
  });

  it("shows the full drill-down: per-package label/complement/code, typed badges and Maps link", () => {
    render(<StopItemList items={[makeItem()]} selectedKey={null} />);

    expect(screen.getByText("Ordem 2 | Parada 7")).toBeInTheDocument();
    expect(screen.getByText("Apto 101")).toBeInTheDocument();
    expect(screen.getByText("Loja 3")).toBeInTheDocument();
    expect(screen.getByText("BR222")).toBeInTheDocument();
    expect(screen.getByText(SHEET.TYPE_LABELS.RESIDENTIAL)).toBeInTheDocument();
    expect(screen.getByText(SHEET.TYPE_LABELS.COMMERCIAL)).toBeInTheDocument();
    expect(screen.queryByText(SHEET.TYPE)).not.toBeInTheDocument(); // no address-level "Tipo:" line
    expect(screen.getByRole("link", { name: SHEET.GOOGLE_MAPS })).toHaveAttribute("href", "https://www.google.com/maps?q=-22.9,-43.2");
  });

  it("keeps the badge for a SINGLE package (always indicates 1+) and hides the placeholder complement", () => {
    render(<StopItemList items={[makeItem({ packageCount: 1, complement: SHEET.NO_COMPLEMENT })]} selectedKey={null} />);

    expect(screen.getByLabelText(UI_LABELS.MAP_PANEL.METRIC_PACKAGES(1))).toHaveTextContent("1");
    expect(screen.queryByText(new RegExp(`${SHEET.COMPLEMENT} ${SHEET.NO_COMPLEMENT}`))).not.toBeInTheDocument();
  });

  it("renders the itemTrailing slot BESIDE each row (list view's 'Ver no mapa')", () => {
    render(<StopItemList items={[makeItem()]} selectedKey={null} itemTrailing={(item) => <button type="button">{`ver-${item.addressKey}`}</button>} />);

    expect(screen.getByRole("button", { name: "ver-0:0" })).toBeInTheDocument();
  });

  it("shows the empty state when the stop has no plottable address", () => {
    render(<StopItemList items={[]} selectedKey={null} />);

    expect(screen.getByText(UI_LABELS.MAP_PANEL.ITEM.NO_ITEMS)).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });
});
