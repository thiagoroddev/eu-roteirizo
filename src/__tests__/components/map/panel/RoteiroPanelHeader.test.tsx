import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { RoteiroPanelHeader } from "../../../../components/map/panel/RoteiroPanelHeader";
import { UI_LABELS } from "../../../../constants/uiLabels";

describe("RoteiroPanelHeader (TASK-RF-006.2)", () => {
  it("shows the mode label and the remaining-work HUD", () => {
    render(<RoteiroPanelHeader remainingAddresses={12} remainingPackages={34} />);

    expect(screen.getByText(UI_LABELS.MAP_MODE.MY_ROTEIRO)).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ROTEIRO_REMAINING(12, 34))).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ROTEIRO_HINT_START)).toBeInTheDocument();
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
