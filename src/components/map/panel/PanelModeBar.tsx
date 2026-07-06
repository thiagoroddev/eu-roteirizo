import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../../ui/button";
import { UI_LABELS } from "../../../constants/uiLabels";

/**
 * PanelModeBar - top row of the MapPanel header (design doc §2/§3): the current
 * mode label ("Modo visualização" in the Original phase) plus the StopStepper.
 * `progress` (edição/rascunho/execução) arrives with RF-006/009 without
 * changing this contract.
 */
interface Props {
  modeLabel: string;
  /** StopStepper ‹ › — circular over the Stop order (design doc §5). */
  onPrevStop: () => void;
  onNextStop: () => void;
}

/**
 * StopStepper - prev/next stop arrows. `data-vaul-no-drag`: the header is the
 * drawer's drag area, so taps on the buttons must not start a drag.
 */
const StopStepper = ({ onPrevStop, onNextStop }: Pick<Props, "onPrevStop" | "onNextStop">) => (
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
  <div className="flex items-center justify-between px-4">
    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{modeLabel}</span>
    <StopStepper onPrevStop={onPrevStop} onNextStop={onNextStop} />
  </div>
);
