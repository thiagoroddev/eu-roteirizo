import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { PanelTitle } from "../../../../components/map/panel/PanelTitle";
import { UI_LABELS } from "../../../../constants/uiLabels";

describe("PanelTitle", () => {
  it("shows the stop number and metric chips — NO address (rev. 07/07: the selected address has its own row)", () => {
    render(<PanelTitle stopNumber="7" metrics={[{ label: "4 endereços" }, { label: "6 pacotes" }]} />);

    expect(screen.getByText(`${UI_LABELS.MAP_PANEL.STOP_PREFIX} 7`)).toBeInTheDocument();
    expect(screen.getByText("4 endereços")).toBeInTheDocument();
    expect(screen.getByText("6 pacotes")).toBeInTheDocument();
  });

  it("falls back to the no-stop label when stopNumber is null", () => {
    render(<PanelTitle stopNumber={null} metrics={[]} />);
    expect(screen.getByText(UI_LABELS.MAP_PANEL.NO_STOP)).toBeInTheDocument();
  });

  it("appends neighborhoods + zipcodes IN PARENTHESES on the same line (rev. 07/07)", () => {
    render(<PanelTitle stopNumber="5" neighborhoods={["Copacabana", "Ipanema"]} zipcodes={["22050-002", "22410-001"]} metrics={[]} />);

    expect(screen.getByText(`${UI_LABELS.MAP_PANEL.STOP_PREFIX} 5 — Copacabana, Ipanema (22050-002, 22410-001)`)).toBeInTheDocument();
  });

  it("renders no chips when there are no metrics", () => {
    const { container } = render(<PanelTitle stopNumber="1" metrics={[]} />);
    expect(container.querySelectorAll(".rounded-full").length).toBe(0);
  });
});
