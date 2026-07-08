import { PanelModeBar } from "./PanelModeBar";
import { UI_LABELS } from "../../../constants/uiLabels";

/**
 * RoteiroPanelHeader - the MapPanel header of the Meu roteiro mode
 * (TASK-RF-006.2, RF-32 partial): mode label + the "what's left to route" HUD.
 * No StopStepper (there are no stops to step through yet) and no Original
 * sections — the builder's context panels (§10.10) arrive in RF-006.3/.4.
 */
interface Props {
  remainingAddresses: number;
  remainingPackages: number;
}

export const RoteiroPanelHeader = ({ remainingAddresses, remainingPackages }: Props) => (
  <div className="pt-1">
    <PanelModeBar modeLabel={UI_LABELS.MAP_MODE.MY_ROTEIRO} />
    <p className="px-4 text-sm font-semibold">{UI_LABELS.MAP_PANEL.ROTEIRO_REMAINING(remainingAddresses, remainingPackages)}</p>
    <p className="px-4 pb-2 pt-1 text-xs text-muted-foreground">{UI_LABELS.MAP_PANEL.ROTEIRO_HINT_START}</p>
  </div>
);
