import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RoteiroPanelHeader } from "../../../../components/map/panel/RoteiroPanelHeader";
import { UI_LABELS } from "../../../../constants/uiLabels";

const OVERVIEW = UI_LABELS.MAP_PANEL.ROTEIRO_OVERVIEW;

const renderHeader = (extra: Partial<React.ComponentProps<typeof RoteiroPanelHeader>> = {}) =>
  render(<RoteiroPanelHeader progress={0.38} modeLabel={UI_LABELS.MAP_PANEL.MODE_ROTEIRO_DRAFT} detailsOpen={false} onToggleDetails={vi.fn()} {...extra} />);

describe("RoteiroPanelHeader (TASK-RF-006.2/.3/.4.1; concise since RF-006.8)", () => {
  it("is CONCISE: mode label + percent + progress bar — the two-line 'Faltando' HUD is gone (RF-006.8)", () => {
    renderHeader();

    expect(screen.getByText(UI_LABELS.MAP_PANEL.MODE_ROTEIRO_DRAFT)).toBeInTheDocument();
    expect(screen.getByText(OVERVIEW.PERCENT(0.38))).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: OVERVIEW.PROGRESS_ARIA })).toHaveAttribute("aria-valuenow", "38");
    expect(screen.queryByText(/^Faltando:/)).not.toBeInTheDocument();
    // The start hint lives in the RoteiroStartSection, not here.
    expect(screen.queryByText(UI_LABELS.MAP_PANEL.ROTEIRO_HINT_START)).not.toBeInTheDocument();
  });

  it("toggles the overview: 'Ver detalhes' fires the handler; open flips to 'Esconder detalhes' (RF-006.8)", () => {
    const onToggleDetails = vi.fn();
    renderHeader({ onToggleDetails });

    fireEvent.click(screen.getByRole("button", { name: OVERVIEW.VIEW_DETAILS }));
    expect(onToggleDetails).toHaveBeenCalledTimes(1);

    renderHeader({ detailsOpen: true });
    expect(screen.getByRole("button", { name: OVERVIEW.HIDE_DETAILS })).toBeInTheDocument();
  });

  it("says the NEXT STEP via statusHint (feedback 08/07)", () => {
    renderHeader({ statusHint: UI_LABELS.MAP_PANEL.ROTEIRO_STATE_BUILDING });
    expect(screen.getByText(UI_LABELS.MAP_PANEL.ROTEIRO_STATE_BUILDING)).toBeInTheDocument();
  });

  it("shows the discreet graph status, with retry only when given", () => {
    const onRetry = vi.fn();
    const { rerender } = render(
      <RoteiroPanelHeader progress={0} modeLabel={UI_LABELS.MAP_MODE.MY_ROTEIRO} detailsOpen={false} onToggleDetails={vi.fn()} graphStatus={{ text: UI_LABELS.ROUTING.LOADING_STREETS }} />
    );
    expect(screen.getByText(UI_LABELS.ROUTING.LOADING_STREETS)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: UI_LABELS.ROUTING.RETRY })).not.toBeInTheDocument();

    rerender(
      <RoteiroPanelHeader progress={0} modeLabel={UI_LABELS.MAP_MODE.MY_ROTEIRO} detailsOpen={false} onToggleDetails={vi.fn()} graphStatus={{ text: UI_LABELS.ROUTING.NETWORK_ERROR, onRetry }} />
    );
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.ROUTING.RETRY }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("has no stop steppers without the handlers (nothing firmed to step over)", () => {
    renderHeader();

    expect(screen.queryByRole("button", { name: UI_LABELS.MAP_PANEL.PREV_STOP })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: UI_LABELS.MAP_PANEL.NEXT_STOP })).not.toBeInTheDocument();
  });

  it("mostra o stepper so com os dois handlers (TASK-RF-044, RF-58)", () => {
    const onPrevStop = vi.fn();
    const onNextStop = vi.fn();
    renderHeader({ onPrevStop, onNextStop });

    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.PREV_STOP }));
    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.NEXT_STOP }));
    expect(onPrevStop).toHaveBeenCalledTimes(1);
    expect(onNextStop).toHaveBeenCalledTimes(1);
  });

  it("repassa stepDisabled: as duas setas desativadas", () => {
    renderHeader({ onPrevStop: vi.fn(), onNextStop: vi.fn(), stepDisabled: true });

    expect(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.PREV_STOP })).toBeDisabled();
    expect(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.NEXT_STOP })).toBeDisabled();
  });

  it("exibe botao Recomecar quando ha paradas e confirma limpeza", () => {
    const onResetRoute = vi.fn();
    const { rerender } = render(
      <RoteiroPanelHeader progress={0.38} modeLabel={UI_LABELS.MAP_PANEL.MODE_ROTEIRO_DRAFT} detailsOpen={false} onToggleDetails={vi.fn()} stopsCount={0} onResetRoute={onResetRoute} />
    );

    // Quando stopsCount é 0, o botão Recomeçar não deve ser exibido
    expect(screen.queryByRole("button", { name: "Recomeçar" })).not.toBeInTheDocument();

    // Quando há paradas criadas, o botão Recomeçar deve ser exibido
    rerender(<RoteiroPanelHeader progress={0.38} modeLabel={UI_LABELS.MAP_PANEL.MODE_ROTEIRO_DRAFT} detailsOpen={false} onToggleDetails={vi.fn()} stopsCount={2} onResetRoute={onResetRoute} />);
    const resetBtn = screen.getByRole("button", { name: "Recomeçar" });
    expect(resetBtn).toBeInTheDocument();

    // Clicar em Recomeçar abre o diálogo de confirmação
    fireEvent.click(resetBtn);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByText("Recomeçar roteiro?")).toBeInTheDocument();
    expect(screen.getByText("Todas as paradas criadas serão apagadas do rascunho. O ponto de partida será mantido.")).toBeInTheDocument();

    // Clicar em Sim, recomeçar invoca onResetRoute
    fireEvent.click(screen.getByRole("button", { name: "Sim, recomeçar" }));
    expect(onResetRoute).toHaveBeenCalledTimes(1);
  });
});
