/**
 * Tests for AddressSheet — the shared bottom panel (fluxo-modo-original §6,
 * TASK-RF-022.6). Content assertions migrated from the old buildAddressPopupHtml
 * tests; fixtures use the real groupRowsByStop for realistic AddressGroups.
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AddressSheet } from "../../../components/map/AddressSheet";
import { groupRowsByStop } from "../../../utils/markers/stopGrouping";
import { COLUMN_NAMES, UI_LABELS } from "../../../constants";
import type { RowData } from "../../../types";

const SHEET = UI_LABELS.ROUTE_MAP.ADDRESS_SHEET;

const row = (over: Partial<Record<string, unknown>>): RowData => ({
  [COLUMN_NAMES.LATITUDE]: -22.9,
  [COLUMN_NAMES.LONGITUDE]: -43.2,
  ...over,
});

const stops = groupRowsByStop([
  row({
    [COLUMN_NAMES.STOP]: 18,
    [COLUMN_NAMES.SEQUENCE]: 50,
    [COLUMN_NAMES.SPX_TN]: "BR-B1",
    [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Y, 200, Apt 8",
    [COLUMN_NAMES.NEIGHBORHOOD]: "Centro",
    [COLUMN_NAMES.ZIPCODE]: "20000-000",
  }),
  row({ [COLUMN_NAMES.STOP]: 18, [COLUMN_NAMES.SEQUENCE]: 53, [COLUMN_NAMES.SPX_TN]: "BR-B2", [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Y, 200, Apt 8" }),
]);
const multiPackageAddress = stops[0].addresses[0]; // 2 packages, residential, "Apt 8"

describe("AddressSheet", () => {
  it("renders nothing when no address is selected", () => {
    render(<AddressSheet address={null} onClose={() => {}} />);

    expect(screen.queryByRole("region", { name: SHEET.ARIA })).not.toBeInTheDocument();
  });

  it("shows the full detail (§6): address, stop, neighborhood, zipcode, complement and type as text", () => {
    render(<AddressSheet address={multiPackageAddress} stopNumber="18" onClose={() => {}} />);

    expect(screen.getByRole("region", { name: SHEET.ARIA })).toBeInTheDocument();
    expect(screen.getByText("Rua Y, 200, Apt 8")).toBeInTheDocument();
    expect(screen.getByText(SHEET.STOP)).toBeInTheDocument();
    expect(screen.getByText("18")).toBeInTheDocument();
    expect(screen.getByText("Centro")).toBeInTheDocument();
    expect(screen.getByText("20000-000")).toBeInTheDocument();
    expect(screen.getByText("Apt 8")).toBeInTheDocument(); // complement
    expect(screen.getByText("Residencial")).toBeInTheDocument(); // type in TEXT
  });

  it("lists EVERY package of a multi-package address (SPX TN + seq)", () => {
    render(<AddressSheet address={multiPackageAddress} onClose={() => {}} />);

    expect(screen.getByText(SHEET.PACKAGES_HEADER(2))).toBeInTheDocument();
    expect(screen.getByText("BR-B1")).toBeInTheDocument();
    expect(screen.getByText("BR-B2")).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`${SHEET.SEQUENCE} 50`))).toBeInTheDocument();
    expect(screen.getByText(new RegExp(`${SHEET.SEQUENCE} 53`))).toBeInTheDocument();
  });

  it("falls back gracefully for missing fields ('—' complement, 'Sem dados')", () => {
    const bare = groupRowsByStop([row({ [COLUMN_NAMES.STOP]: 1, [COLUMN_NAMES.SEQUENCE]: 1, [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Z, 300" })]);
    render(<AddressSheet address={bare[0].addresses[0]} onClose={() => {}} />);

    expect(screen.getByText(SHEET.NO_COMPLEMENT)).toBeInTheDocument(); // no complement
    expect(screen.getAllByText(UI_LABELS.COMMON.NO_DATA).length).toBeGreaterThan(0); // neighborhood/zipcode/SPX absent
  });

  it("links to Google Maps at the address coordinates, in a new tab", () => {
    render(<AddressSheet address={multiPackageAddress} onClose={() => {}} />);

    const link = screen.getByRole("link", { name: SHEET.GOOGLE_MAPS });
    expect(link).toHaveAttribute("href", `https://www.google.com/maps?q=${multiPackageAddress.lat},${multiPackageAddress.lng}`);
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("the close button calls onClose (and is the ONLY button in read-only mode)", () => {
    const onClose = vi.fn();
    render(<AddressSheet address={multiPackageAddress} onClose={onClose} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(1); // read-only: no edit buttons at all (§6)

    fireEvent.click(screen.getByRole("button", { name: SHEET.CLOSE }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("renders the actions slot when provided (Meu roteiro contract — RF-006)", () => {
    render(<AddressSheet address={multiPackageAddress} onClose={() => {}} actions={<button type="button">Tornar âncora</button>} />);

    expect(screen.getByRole("button", { name: "Tornar âncora" })).toBeInTheDocument();
  });

  it("positions itself as a bottom overlay (legacy modal is its only consumer since RF-023.5)", () => {
    render(<AddressSheet address={multiPackageAddress} onClose={() => {}} />);

    expect(screen.getByRole("region", { name: SHEET.ARIA }).className).toContain("absolute");
  });

  it("renders spreadsheet content as text, never as HTML (React auto-escapes)", () => {
    const malicious = groupRowsByStop([
      row({ [COLUMN_NAMES.STOP]: 1, [COLUMN_NAMES.SEQUENCE]: 1, [COLUMN_NAMES.SPX_TN]: "<img src=x onerror=alert(1)>", [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua A, 1, Apt 1" }),
    ]);
    const { container } = render(<AddressSheet address={malicious[0].addresses[0]} onClose={() => {}} />);

    expect(container.querySelector("img")).toBeNull();
    expect(screen.getByText("<img src=x onerror=alert(1)>")).toBeInTheDocument();
  });
});
