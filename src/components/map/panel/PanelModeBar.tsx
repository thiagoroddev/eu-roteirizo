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
}

/**
 * StopStepper - prev/next stop arrows. `data-vaul-no-drag`: the header is the
 * drawer's drag area, so taps on the buttons must not start a drag.
 */
const StopStepper = ({ onPrevStop, onNextStop }: { onPrevStop: () => void; onNextStop: () => void }) => (
  <div className="flex items-center gap-1">
    <Button type="button" variant="ghost" size="icon" data-vaul-no-drag aria-label={UI_LABELS.MAP_PANEL.PREV_STOP} onClick={onPrevStop}>
      <ChevronLeft aria-hidden />
    </Button>
    <Button type="button" variant="ghost" size="icon" data-vaul-no-drag aria-label={UI_LABELS.MAP_PANEL.NEXT_STOP} onClick={onNextStop}>
      <ChevronRight aria-hidden />
    </Button>
  </div>
);

export const PanelModeBar = ({ modeLabel, progress, actions, onPrevStop, onNextStop }: Props) => (
  <div>
    <div className="flex min-h-10 items-center justify-between gap-2 px-4">
      <div className="flex min-w-0 items-center gap-1.5 truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
        <span className="truncate">{modeLabel}</span>
        {progress !== undefined && (
          <>
            <span aria-hidden>-</span>
            <span className="shrink-0 font-semibold tabular-nums text-foreground">{UI_LABELS.MAP_PANEL.ROTEIRO_OVERVIEW.PERCENT(progress)}</span>
          </>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {actions}
        {onPrevStop && onNextStop && <StopStepper onPrevStop={onPrevStop} onNextStop={onNextStop} />}
      </div>
    </div>
    {progress !== undefined && <Progress value={progress} label={UI_LABELS.MAP_PANEL.ROTEIRO_OVERVIEW.PROGRESS_ARIA} className="mx-4 mb-1 h-1" />}
  </div>
);
