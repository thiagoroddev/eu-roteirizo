import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RoteiroStartSection, type StartPhase } from "../../../../components/map/panel/RoteiroStartSection";
import { UI_LABELS } from "../../../../constants/uiLabels";

const START = UI_LABELS.MAP_PANEL.ROTEIRO_START;

const renderSection = (phase: StartPhase, extra: Partial<React.ComponentProps<typeof RoteiroStartSection>> = {}) => {
  const handlers = { onUseGps: vi.fn(), onArmMapTap: vi.fn(), onConfirmPoint: vi.fn(), onCancel: vi.fn() };
  render(<RoteiroStartSection phase={phase} notice={null} {...handlers} {...extra} />);
  return handlers;
};

describe("RoteiroStartSection (TASK-RF-006.3)", () => {
  it("no-start: section label, hint and the two start paths (GPS primary)", () => {
    const handlers = renderSection("no-start");

    expect(screen.getByText(START.SECTION)).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ROTEIRO_HINT_START)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: START.USE_GPS }));
    fireEvent.click(screen.getByRole("button", { name: START.ARM_MAP_TAP }));
    expect(handlers.onUseGps).toHaveBeenCalledTimes(1);
    expect(handlers.onArmMapTap).toHaveBeenCalledTimes(1);
  });

  it("arming: hint + cancel", () => {
    const handlers = renderSection("arming");

    expect(screen.getByText(START.ARMED_HINT)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: START.CANCEL }));
    expect(handlers.onCancel).toHaveBeenCalledTimes(1);
  });

  it("locating: busy text, no buttons", () => {
    renderSection("locating");

    expect(screen.getByText(START.LOCATING)).toBeInTheDocument();
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("confirm-point: shows the address and confirms/cancels", () => {
    const handlers = renderSection("confirm-point", { pendingAddress: "Rua Mapa, 10" });

    expect(screen.getByText(START.CONFIRM_POINT("Rua Mapa, 10"))).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: START.CONFIRM }));
    expect(handlers.onConfirmPoint).toHaveBeenCalledTimes(1);
  });

  // The has-start (DEFINED) row left this component with RF-006.11/.14: once a
  // start is set the caller gates this section out and the start lives as
  // "parada 0" + its map marker (with the Apagar/Mudar posição gestures).

  it("shows the notice (GPS errors) in any phase", () => {
    renderSection("no-start", { notice: UI_LABELS.ROUTING.GPS_DENIED });
    expect(screen.getByText(UI_LABELS.ROUTING.GPS_DENIED)).toBeInTheDocument();
  });
});
