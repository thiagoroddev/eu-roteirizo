import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../ui/button";
import { UI_LABELS } from "../../../constants/uiLabels";

/**
 * PanelModeBar - top row of the MapPanel header (design doc §2/§3): the current
 * mode label plus the StopStepper (only when stepping makes sense — the Meu
 * roteiro mode has no stops yet in .2, so the handlers are optional and the
 * stepper is hidden without both). The design doc's `progress` (0..1) is
 * DELIBERATELY deferred: the edit-mode slices (.4+) define the real HUD.
 */
interface Props {
  modeLabel: string;
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

export const PanelModeBar = ({ modeLabel, onPrevStop, onNextStop }: Props) => (
  <div className="flex min-h-10 items-center justify-between px-4">
    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{modeLabel}</span>
    {onPrevStop && onNextStop && <StopStepper onPrevStop={onPrevStop} onNextStop={onNextStop} />}
  </div>
);
