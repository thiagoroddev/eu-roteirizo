import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MapModeToggle } from "../../../components/map/MapModeToggle";
import { UI_LABELS } from "../../../constants/uiLabels";

describe("MapModeToggle (TASK-RF-013 / RF-20 modo standalone)", () => {
  it("renderiza os botões Original e Meu roteiro", () => {
    render(<MapModeToggle mode="roteiro" onModeChange={vi.fn()} roteiroEnabled={true} originalEnabled={true} />);

    expect(screen.getByRole("button", { name: UI_LABELS.MAP_MODE.ORIGINAL })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: UI_LABELS.MAP_MODE.MY_ROTEIRO })).toBeInTheDocument();
  });

  it("desabilita a aba Original quando originalEnabled é false e exibe tooltip de standalone (RF-20)", () => {
    const onModeChange = vi.fn();
    render(<MapModeToggle mode="roteiro" onModeChange={onModeChange} roteiroEnabled={true} originalEnabled={false} originalDisabledHint={UI_LABELS.MAP_MODE.ORIGINAL_DISABLED_STANDALONE} />);

    const originalBtn = screen.getByRole("button", { name: UI_LABELS.MAP_MODE.ORIGINAL_DISABLED_STANDALONE });
    expect(originalBtn).toBeDisabled();
    expect(originalBtn).toHaveAttribute("title", UI_LABELS.MAP_MODE.ORIGINAL_DISABLED_STANDALONE);

    fireEvent.click(originalBtn);
    expect(onModeChange).not.toHaveBeenCalled();
  });

  it("permite alternar modo quando ambos estão habilitados", () => {
    const onModeChange = vi.fn();
    render(<MapModeToggle mode="roteiro" onModeChange={onModeChange} roteiroEnabled={true} originalEnabled={true} />);

    const originalBtn = screen.getByRole("button", { name: UI_LABELS.MAP_MODE.ORIGINAL });
    fireEvent.click(originalBtn);
    expect(onModeChange).toHaveBeenCalledWith("original");
  });
});
