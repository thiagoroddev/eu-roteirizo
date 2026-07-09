import { PanelModeBar } from "./PanelModeBar";
import { Button } from "../../ui/button";
import { UI_LABELS } from "../../../constants/uiLabels";

/**
 * RoteiroPanelHeader - the MapPanel header of the Meu roteiro mode
 * (TASK-RF-006.2/.3/.4.1, RF-32 partial): the roteiro's STATE — mode label
 * ("Roteiro incompleto — rascunho" until complete), the "what's left" HUD, a
 * contextual what-to-do hint (feedback 08/07: the panel always says the next
 * step) and a discreet road-graph status line (loading/error+retry; ready =
 * silence). No StopStepper (stepping over built stops arrives with .6).
 */
interface Props {
  remainingAddresses: number;
  remainingPackages: number;
  /** "Roteiro incompleto — rascunho" while building; "Meu roteiro" when complete. */
  modeLabel: string;
  /** Contextual next step ("Toque num endereço…"); null = a section below guides. */
  statusHint?: string | null;
  /** Discreet graph status; null = nothing to show (idle/ready). */
  graphStatus?: { text: string; onRetry?: () => void } | null;
}

export const RoteiroPanelHeader = ({ remainingAddresses, remainingPackages, modeLabel, statusHint = null, graphStatus = null }: Props) => (
  // pb-2: breathing room before the next section's divider (rev. 08/07 3ª rodada).
  <div className="pb-2 pt-1">
    <PanelModeBar modeLabel={modeLabel} />
    <p className="px-4 text-sm font-semibold">{UI_LABELS.MAP_PANEL.ROTEIRO_REMAINING(remainingAddresses, remainingPackages)}</p>
    {statusHint && <p className="px-4 pt-0.5 text-xs text-muted-foreground">{statusHint}</p>}
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
