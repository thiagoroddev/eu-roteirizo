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

  it("renderiza layout em 2 linhas quando titleOverride é fornecido (RF-53 / TASK-RF-038)", () => {
    render(<PanelTitle stopNumber="26" titleOverride="Avenida Epitácio Pessoa, 4224" neighborhoods={["Lagoa"]} zipcodes={["22061-000"]} metrics={[{ label: "2 endereços" }]} />);

    expect(screen.getByText("Avenida Epitácio Pessoa, 4224")).toBeInTheDocument();
    expect(screen.getByText("Lagoa, 22061-000")).toBeInTheDocument();
    expect(screen.getByText("2 endereços")).toBeInTheDocument();
  });

  it("suporta subtitleOverride customizado", () => {
    render(<PanelTitle stopNumber="26" titleOverride="Rua Barão da Torre, 123" subtitleOverride="Ipanema" metrics={[]} />);

    expect(screen.getByText("Rua Barão da Torre, 123")).toBeInTheDocument();
    expect(screen.getByText("Ipanema")).toBeInTheDocument();
  });

  it("estiliza badges de contagem comercial (azul), residencial (verde) e indefinido (cinza)", () => {
    render(<PanelTitle stopNumber="1" metrics={[{ label: "1 endereço" }, { label: "Residencial: 2 pacotes" }, { label: "Comercial: 1 pacote" }, { label: "Indefinido: 1 pacote" }]} />);

    const resBadge = screen.getByText("Residencial: 2 pacotes");
    const comBadge = screen.getByText("Comercial: 1 pacote");
    const indBadge = screen.getByText("Indefinido: 1 pacote");
    const endBadge = screen.getByText("1 endereço");

    expect(resBadge.style.backgroundColor).toBe("rgb(14, 140, 73)");
    expect(comBadge.style.backgroundColor).toBe("rgb(21, 89, 201)");
    expect(indBadge.style.backgroundColor).toBe("rgb(226, 232, 240)");
    expect(endBadge.style.backgroundColor).toBe("");
  });
});
