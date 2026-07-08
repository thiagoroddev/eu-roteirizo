import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RoteiroPanelHeader } from "../../../../components/map/panel/RoteiroPanelHeader";
import { UI_LABELS } from "../../../../constants/uiLabels";

describe("RoteiroPanelHeader (TASK-RF-006.2/.3)", () => {
  it("shows the mode label and the remaining-work HUD", () => {
    render(<RoteiroPanelHeader remainingAddresses={12} remainingPackages={34} />);

    expect(screen.getByText(UI_LABELS.MAP_MODE.MY_ROTEIRO)).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ROTEIRO_REMAINING(12, 34))).toBeInTheDocument();
    // The start hint moved to the RoteiroStartSection (RF-006.3).
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.ROTEIRO_HINT_START)).not.toBeInTheDocument();
  });

  it("shows the discreet graph status, with retry only when given", () => {
    const onRetry = vi.fn();
    const { rerender } = render(<RoteiroPanelHeader remainingAddresses={1} remainingPackages={1} graphStatus={{ text: UI_LABELS.ROUTING.LOADING_STREETS }} />);
    expect(screen.getByText(UI_LABELS.ROUTING.LOADING_STREETS)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: UI_LABELS.ROUTING.RETRY })).not.toBeInTheDocument();

    rerender(<RoteiroPanelHeader remainingAddresses={1} remainingPackages={1} graphStatus={{ text: UI_LABELS.ROUTING.NETWORK_ERROR, onRetry }} />);
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.ROUTING.RETRY }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("shows nothing about the graph when idle/ready (status null)", () => {
    render(<RoteiroPanelHeader remainingAddresses={1} remainingPackages={1} graphStatus={null} />);
    expect(screen.queryByText(UI_LABELS.ROUTING.LOADING_STREETS)).not.toBeInTheDocument();
  });

  it("singularizes the counts", () => {
    render(<RoteiroPanelHeader remainingAddresses={1} remainingPackages={1} />);
    expect(screen.getByText("Faltando: 1 endereço · 1 pacote")).toBeInTheDocument();
  });

  it("has no stop steppers (there are no stops to step through yet)", () => {
    render(<RoteiroPanelHeader remainingAddresses={2} remainingPackages={3} />);

    expect(screen.queryByRole("button", { name: UI_LABELS.MAP_PANEL.PREV_STOP })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: UI_LABELS.MAP_PANEL.NEXT_STOP })).not.toBeInTheDocument();
  });
});
