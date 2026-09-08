import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PanelModeBar } from "../../../../components/map/panel/PanelModeBar";
import { UI_LABELS } from "../../../../constants/uiLabels";

describe("PanelModeBar", () => {
  const renderBar = () => {
    const onPrevStop = vi.fn();
    const onNextStop = vi.fn();
    render(<PanelModeBar modeLabel={UI_LABELS.MAP_PANEL.MODE_VIEW} onPrevStop={onPrevStop} onNextStop={onNextStop} />);
    return { onPrevStop, onNextStop };
  };

  it("shows the mode label", () => {
    renderBar();
    expect(screen.getByText(UI_LABELS.MAP_PANEL.MODE_VIEW)).toBeInTheDocument();
  });

  it("fires the stepper callbacks", () => {
    const { onPrevStop, onNextStop } = renderBar();

    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.PREV_STOP }));
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.NEXT_STOP }));

    expect(onPrevStop).toHaveBeenCalledTimes(1);
    expect(onNextStop).toHaveBeenCalledTimes(1);
  });

  it("marks the stepper buttons as no-drag zones for vaul (header is the drag area)", () => {
    renderBar();
    expect(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.PREV_STOP })).toHaveAttribute("data-vaul-no-drag");
    expect(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.NEXT_STOP })).toHaveAttribute("data-vaul-no-drag");
  });

  it("hides the stepper without handlers (Meu roteiro .2 has no stops to step — RF-006.2)", () => {
    render(<PanelModeBar modeLabel={UI_LABELS.MAP_MODE.MY_ROTEIRO} />);

    expect(screen.getByText(UI_LABELS.MAP_MODE.MY_ROTEIRO)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: UI_LABELS.MAP_PANEL.PREV_STOP })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: UI_LABELS.MAP_PANEL.NEXT_STOP })).not.toBeInTheDocument();
  });

  it("renderiza a porcentagem diretamente ao lado do nome do modo", () => {
    render(<PanelModeBar modeLabel="Meu Roteiro" progress={1.0} />);

    expect(screen.getByText("Meu Roteiro")).toBeInTheDocument();
    expect(screen.getByText("-")).toBeInTheDocument();
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});
