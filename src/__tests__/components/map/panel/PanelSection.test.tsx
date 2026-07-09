import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { PanelSection } from "../../../../components/map/panel/PanelSection";
import { Button } from "../../../../components/ui/button";

/**
 * PanelSection (TASK-RF-006.4.3) - the single section chrome of the MapPanel.
 * Both modes consume it, so the divider/padding can no longer diverge.
 */
describe("PanelSection", () => {
  it("renders the divider + label padding by default (every section but the first)", () => {
    const { container } = render(
      <PanelSection label="Endereço selecionado">
        <p>corpo</p>
      </PanelSection>
    );

    expect(screen.getByText("Endereço selecionado")).toBeInTheDocument();
    expect(screen.getByText("corpo")).toBeInTheDocument();
    expect(container.firstElementChild?.className).toContain("border-t");
    expect(screen.getByText("Endereço selecionado").parentElement?.className).toContain("pt-2");
  });

  it("divider=false drops the border and the top padding (first section under the mode bar)", () => {
    const { container } = render(<PanelSection label="Resumo da parada" divider={false} />);

    expect(container.firstElementChild?.className).not.toContain("border-t");
    expect(screen.getByText("Resumo da parada").parentElement?.className).not.toContain("pt-2");
  });

  it("actions render beside the label (the Original's 'Ver lista completa' pattern)", () => {
    const onAction = vi.fn();
    render(
      <PanelSection
        label="Resumo da parada"
        actions={
          <Button type="button" onClick={onAction}>
            Ver lista completa
          </Button>
        }
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Ver lista completa" }));
    expect(onAction).toHaveBeenCalledTimes(1);
  });
});
