import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RoteiroPanelHeader } from "../../../../components/map/panel/RoteiroPanelHeader";
import { UI_LABELS } from "../../../../constants/uiLabels";

const renderHeader = (extra: Partial<React.ComponentProps<typeof RoteiroPanelHeader>> = {}) =>
  render(<RoteiroPanelHeader remainingAddresses={12} remainingPackages={34} modeLabel={UI_LABELS.MAP_PANEL.MODE_ROTEIRO_DRAFT} {...extra} />);

describe("RoteiroPanelHeader (TASK-RF-006.2/.3/.4.1)", () => {
  it("shows the roteiro STATE: draft mode label + the remaining-work HUD", () => {
    renderHeader();

    expect(screen.getByText(UI_LABELS.MAP_PANEL.MODE_ROTEIRO_DRAFT)).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ROTEIRO_REMAINING(12, 34))).toBeInTheDocument();
    // The start hint lives in the RoteiroStartSection, not here.
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.ROTEIRO_HINT_START)).not.toBeInTheDocument();
  });

  it("says the NEXT STEP via statusHint (feedback 08/07)", () => {
    renderHeader({ statusHint: UI_LABELS.MAP_PANEL.ROTEIRO_STATE_BUILDING });
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ROTEIRO_STATE_BUILDING)).toBeInTheDocument();
  });

  it("singularizes the counts", () => {
    render(<RoteiroPanelHeader remainingAddresses={1} remainingPackages={1} modeLabel={UI_LABELS.MAP_MODE.MY_ROTEIRO} />);
    expect(screen.getByText("Faltando: 1 endereço · 1 pacote")).toBeInTheDocument();
  });

  it("shows the discreet graph status, with retry only when given", () => {
    const onRetry = vi.fn();
    const { rerender } = render(
      <RoteiroPanelHeader remainingAddresses={1} remainingPackages={1} modeLabel={UI_LABELS.MAP_MODE.MY_ROTEIRO} graphStatus={{ text: UI_LABELS.ROUTING.LOADING_STREETS }} />
    );
    expect(screen.getByText(UI_LABELS.ROUTING.LOADING_STREETS)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: UI_LABELS.ROUTING.RETRY })).not.toBeInTheDocument();

    rerender(<RoteiroPanelHeader remainingAddresses={1} remainingPackages={1} modeLabel={UI_LABELS.MAP_MODE.MY_ROTEIRO} graphStatus={{ text: UI_LABELS.ROUTING.NETWORK_ERROR, onRetry }} />);
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.ROUTING.RETRY }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("has no stop steppers (stepping over built stops arrives with .6)", () => {
    renderHeader();

    expect(screen.queryByRole("button", { name: UI_LABELS.MAP_PANEL.PREV_STOP })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: UI_LABELS.MAP_PANEL.NEXT_STOP })).not.toBeInTheDocument();
  });
});
