import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PanelTitle } from "../../../../components/map/panel/PanelTitle";
import { UI_LABELS } from "../../../../constants/uiLabels";

describe("PanelTitle", () => {
  it("shows the stop number, address and metric chips", () => {
    render(<PanelTitle stopNumber="7" address="Rua Teste, 10" metrics={[{ label: "4 endereços" }, { label: "6 pacotes" }]} />);

    expect(screen.getByText(`${UI_LABELS.MAP_PANEL.STOP_PREFIX} 7`)).toBeInTheDocument();
    expect(screen.getByText("Rua Teste, 10")).toBeInTheDocument();
    expect(screen.getByText("4 endereços")).toBeInTheDocument();
    expect(screen.getByText("6 pacotes")).toBeInTheDocument();
  });

  it("falls back to the no-stop label when stopNumber is null", () => {
    render(<PanelTitle stopNumber={null} address="Rua Teste, 10" metrics={[]} />);
    expect(screen.getByText(UI_LABELS.MAP_PANEL.NO_STOP)).toBeInTheDocument();
  });

  it("renders no chips when there are no metrics", () => {
    const { container } = render(<PanelTitle stopNumber="1" address="Rua Teste, 10" metrics={[]} />);
    expect(container.querySelectorAll(".rounded-full").length).toBe(0);
  });
});
