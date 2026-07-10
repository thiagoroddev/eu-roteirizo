import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RoteiroDraftHeader, RoteiroDraftBody, RADIUS_MIN, RADIUS_MAX } from "../../../../components/map/panel/RoteiroDraftSection";
import type { StopItemData } from "../../../../utils/markers/panelModels";
import { ICON_KEYS, UI_LABELS } from "../../../../constants";

const DRAFT = UI_LABELS.MAP_PANEL.ROTEIRO_DRAFT;

/** Points adapted to the Original list vocabulary (RF-006.4.3 — the edit body
    renders the full-list structure; `addressKey` is the point id). */
const listItem = (addressKey: string, addressLine: string, markerNumber = "", packageCount = 1): StopItemData => ({
  addressKey,
  markerNumber,
  markerType: ICON_KEYS.HOME,
  addressLine,
  complement: UI_LABELS.ROUTE_MAP.ADDRESS_SHEET.NO_COMPLEMENT,
  packageCount,
  packages: [{ label: UI_LABELS.MAP_PANEL.ITEM.PACKAGE_LABEL(null, "12"), complement: "", spxTn: "SPX1", type: ICON_KEYS.HOME, typeLabel: "Residencial" }],
  mapsUrl: "https://www.google.com/maps?q=-22.98,-43.2",
});

const bodyProps = {
  chosen: [listItem("pt_a", "Rua Mapa, 10", UI_LABELS.MAP_PANEL.ORDINAL(1))],
  candidates: [listItem("pt_b", "Rua Beta, 20", "", 3)],
  onTogglePoint: vi.fn(),
};

const headerHandlers = () => ({ onSave: vi.fn(), onCancel: vi.fn() });

/** Radius-card props moved into the HEADER (RF-006.4.25 — fixed first section). */
const headerRadius = { radiusMeters: 30, onRadiusChange: vi.fn(), candidateCount: 2, farWarning: false };

const headerMetrics = [{ label: UI_LABELS.MAP_PANEL.METRIC_ADDRESSES(3) }, { label: UI_LABELS.MAP_PANEL.METRIC_PACKAGES(5) }, { label: DRAFT.ESTIMATE(12, "850 m") }];

describe("RoteiroDraftSection (tela 9 — TASK-RF-006.4/.4.1/.4.2/.4.3)", () => {
  it("header: edit-mode label, stop number, metric CHIPS, the FIXED radius card and ALWAYS-VISIBLE CTAs — no global remaining (RF-006.4.25)", () => {
    const handlers = headerHandlers();
    render(<RoteiroDraftHeader stopNumber={2} metrics={headerMetrics} addresses={3} {...headerRadius} canSave {...handlers} />);

    expect(screen.getByText(UI_LABELS.MAP_PANEL.MODE_DRAFT)).toBeInTheDocument();
    expect(screen.getByText(DRAFT.TITLE(2))).toBeInTheDocument();
    // Metrics are Badge CHIPS now (same language as the Original's PanelTitle).
    expect(screen.getByText(UI_LABELS.MAP_PANEL.METRIC_ADDRESSES(3))).toBeInTheDocument();
    expect(screen.getByText(DRAFT.ESTIMATE(12, "850 m"))).toBeInTheDocument();
    // The radius card is part of the first section now — fixed, the map-tapped
    // pick can no longer push it around (RF-006.4.25).
    expect(screen.getByText(DRAFT.RADIUS_LABEL)).toBeInTheDocument();
    expect(screen.getByText(DRAFT.BANNER_CANDIDATES(2))).toBeInTheDocument();
    // The edit is about ONE stop: no roteiro-wide "Faltando" here (RF-006.4.25).
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.ROTEIRO_REMAINING(7, 9))).not.toBeInTheDocument();
    // ≥2 addresses → the tap hint retired (first steps only).
    expect(screen.queryByText(DRAFT.TAP_HINT)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: DRAFT.SAVE }));
    fireEvent.click(screen.getByRole("button", { name: DRAFT.CANCEL }));
    expect(handlers.onSave).toHaveBeenCalledTimes(1);
    expect(handlers.onCancel).toHaveBeenCalledTimes(1);
  });

  it("header: save disabled when the draft is empty; tap hint shows on the FIRST steps (≤1 address)", () => {
    const handlers = headerHandlers();
    render(<RoteiroDraftHeader stopNumber={1} metrics={[]} addresses={1} {...headerRadius} canSave={false} {...handlers} />);

    expect(screen.getByRole("button", { name: DRAFT.SAVE })).toBeDisabled();
    expect(screen.getByText(DRAFT.TAP_HINT)).toBeInTheDocument();
  });

  it("body: full-list structure with ± icon toggles (rev. 08/07 3ª rodada)", () => {
    const onTogglePoint = vi.fn();
    render(<RoteiroDraftBody {...bodyProps} onTogglePoint={onTogglePoint} />);

    // Rows are the Original's own expandable cards ("Ver lista completa"
    // structure) — package detail visible, ordinal in the member's mini-marker.
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ORDINAL(1))).toBeInTheDocument();
    expect(screen.getByText("Rua Mapa, 10").closest("button")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Rua Beta, 20").closest("button")).toHaveAttribute("aria-expanded", "true");
    expect(screen.getAllByText(UI_LABELS.ROUTE_MAP.ADDRESS_SHEET.PACKAGES_HEADER(1)).length).toBeGreaterThan(0);

    // The ± icon buttons keep the address line in the aria-label.
    fireEvent.click(screen.getByRole("button", { name: DRAFT.REMOVE_POINT("Rua Mapa, 10") }));
    fireEvent.click(screen.getByRole("button", { name: DRAFT.ADD_POINT("Rua Beta, 20") }));
    expect(onTogglePoint).toHaveBeenNthCalledWith(1, "pt_a");
    expect(onTogglePoint).toHaveBeenNthCalledWith(2, "pt_b");
  });

  it("radius stepper (in the header) steps by 10 m and disables at the bounds", () => {
    const onRadiusChange = vi.fn();
    const handlers = headerHandlers();
    const headerProps = { stopNumber: 1, metrics: [], addresses: 2, candidateCount: 0, farWarning: false, canSave: true, ...handlers };
    const { rerender } = render(<RoteiroDraftHeader {...headerProps} radiusMeters={30} onRadiusChange={onRadiusChange} />);

    fireEvent.click(screen.getByRole("button", { name: DRAFT.RADIUS_INCREASE }));
    expect(onRadiusChange).toHaveBeenCalledWith(40);
    fireEvent.click(screen.getByRole("button", { name: DRAFT.RADIUS_DECREASE }));
    expect(onRadiusChange).toHaveBeenCalledWith(20);

    rerender(<RoteiroDraftHeader {...headerProps} radiusMeters={RADIUS_MIN} onRadiusChange={onRadiusChange} />);
    expect(screen.getByRole("button", { name: DRAFT.RADIUS_DECREASE })).toBeDisabled();
    rerender(<RoteiroDraftHeader {...headerProps} radiusMeters={RADIUS_MAX} onRadiusChange={onRadiusChange} />);
    expect(screen.getByRole("button", { name: DRAFT.RADIUS_INCREASE })).toBeDisabled();
  });

  it("shows the soft far warning (header) and the empty hint (body)", () => {
    const handlers = headerHandlers();
    render(<RoteiroDraftHeader stopNumber={1} metrics={[]} addresses={2} {...headerRadius} farWarning canSave {...handlers} />);
    expect(screen.getByText(DRAFT.FAR_WARNING)).toBeInTheDocument();

    render(<RoteiroDraftBody {...bodyProps} chosen={[]} />);
    expect(screen.getByText(DRAFT.EMPTY_HINT)).toBeInTheDocument();
  });
});
