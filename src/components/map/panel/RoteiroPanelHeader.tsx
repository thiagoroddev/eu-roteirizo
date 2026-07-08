import { PanelModeBar } from "./PanelModeBar";
import { Button } from "../../ui/button";
import { UI_LABELS } from "../../../constants/uiLabels";

/**
 * RoteiroPanelHeader - the MapPanel header of the Meu roteiro mode
 * (TASK-RF-006.2/.3, RF-32 partial): mode label + the "what's left to route"
 * HUD + a discreet road-graph status line (loading/error+retry; ready =
 * silence — the straight-line fallback covers everything meanwhile). No
 * StopStepper (there are no stops to step through yet). The start-definition
 * flow renders below as its own section (RoteiroStartSection).
 */
interface Props {
  remainingAddresses: number;
  remainingPackages: number;
  /** Discreet graph status; null = nothing to show (idle/ready). */
  graphStatus?: { text: string; onRetry?: () => void } | null;
}

export const RoteiroPanelHeader = ({ remainingAddresses, remainingPackages, graphStatus = null }: Props) => (
  <div className="pt-1">
    <PanelModeBar modeLabel={UI_LABELS.MAP_MODE.MY_ROTEIRO} />
    <p className="px-4 text-sm font-semibold">{UI_LABELS.MAP_PANEL.ROTEIRO_REMAINING(remainingAddresses, remainingPackages)}</p>
    {graphStatus && (
      <div className="flex items-center gap-2 px-4 pt-0.5">
        <p className="truncate text-xs text-muted-foreground">{graphStatus.text}</p>
        {graphStatus.onRetry && (
          <Button type="button" variant="ghost" size="sm" data-vaul-no-drag className="h-6 shrink-0 px-2 text-xs" onClick={graphStatus.onRetry}>
            {UI_LABELS.ROUTING.RETRY}
          </Button>
        )}
      </div>
    )}
  </div>
);
