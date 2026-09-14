import type { ReactNode } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../ui/button";
import { Progress } from "../../ui/progress";
import { UI_LABELS } from "../../../constants/uiLabels";

/**
 * PanelModeBar - top row of the MapPanel header (design doc §2/§3): the current
 * mode label plus, per mode, the StopStepper (Original) or the construction
 * progress + an action slot (Meu roteiro — TASK-RF-006.8 filled the doc's
 * `progress` contract: percent + a thin brand-gradient bar under the row).
 */
interface Props {
  modeLabel: string;
  /** 0..1 — the roteiro's construction progress (base: addresses). Renders the
      percent beside the label and the thin bar under the row (design §3). */
  progress?: number;
  /** Right-side slot (the roteiro's "Ver detalhes" toggle — RF-006.8). */
  actions?: ReactNode;
  /** StopStepper ‹ › — circular over the Stop order (design doc §5). Hidden unless both handlers exist. */
  onPrevStop?: () => void;
  onNextStop?: () => void;
  /** Arrows shown but disabled (faded): a single stop has nowhere to go (TASK-RF-044). */
  stepDisabled?: boolean;
}

/**
 * StopStepper - prev/next stop arrows. `data-vaul-no-drag`: the header is the
 * drawer's drag area, so taps on the buttons must not start a drag.
 */
const StopStepper = ({ onPrevStop, onNextStop, disabled = false }: { onPrevStop: () => void; onNextStop: () => void; disabled?: boolean }) => (
  <div className="flex items-center gap-1">
    <Button type="button" variant="ghost" size="icon" data-vaul-no-drag aria-label={UI_LABELS.MAP_PANEL.PREV_STOP} onClick={onPrevStop} disabled={disabled}>
      <ChevronLeft aria-hidden />
    </Button>
    <Button type="button" variant="ghost" size="icon" data-vaul-no-drag aria-label={UI_LABELS.MAP_PANEL.NEXT_STOP} onClick={onNextStop} disabled={disabled}>
      <ChevronRight aria-hidden />
    </Button>
  </div>
);

export const PanelModeBar = ({ modeLabel, progress, actions, onPrevStop, onNextStop, stepDisabled = false }: Props) => {
  const stepper = onPrevStop && onNextStop ? <StopStepper onPrevStop={onPrevStop} onNextStop={onNextStop} disabled={stepDisabled} /> : null;
  const label = (
    <div className="flex min-w-0 items-center gap-1.5 truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
      <span className="truncate">{modeLabel}</span>
      {progress !== undefined && (
        <>
          <span aria-hidden>-</span>
          <span className="shrink-0 font-semibold tabular-nums text-foreground">{UI_LABELS.MAP_PANEL.ROTEIRO_OVERVIEW.PERCENT(progress)}</span>
        </>
      )}
    </div>
  );

  // Original (no progress): one row, label + stepper, as before.
  if (progress === undefined) {
    return (
      <div className="flex min-h-10 items-center justify-between gap-2 px-4">
        {label}
        <div className="flex shrink-0 items-center gap-2">
          {actions}
          {stepper}
        </div>
      </div>
    );
  }

  // Meu roteiro: label + percent get the whole first row; the buttons go to a row UNDER
  // the progress bar (TASK-RF-044 — on a 412 px phone they truncated the mode label to "ROTEIRO I…").
  return (
    <div>
      <div className="flex min-h-8 items-center px-4">{label}</div>
      <Progress value={progress} label={UI_LABELS.MAP_PANEL.ROTEIRO_OVERVIEW.PROGRESS_ARIA} className="mx-4 mb-1 h-1" />
      {(actions || stepper) && (
        <div className="flex items-center justify-between gap-2 px-4 pt-1">
          <div className="flex min-w-0 items-center gap-2">{actions}</div>
          {stepper}
        </div>
      )}
    </div>
  );
};
