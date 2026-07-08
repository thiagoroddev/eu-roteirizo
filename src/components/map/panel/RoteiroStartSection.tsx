import { Button } from "../../ui/button";
import { UI_LABELS } from "../../../constants/uiLabels";

const START = UI_LABELS.MAP_PANEL.ROTEIRO_START;

/**
 * The start-definition flow's UI phase. Derived by the MapScreen from its
 * ephemeral state (armed/pending/gps-busy/redefining) + the builder's startPoint.
 */
export type StartPhase = "no-start" | "arming" | "locating" | "confirm-point" | "has-start";

/**
 * RoteiroStartSection - the "Definir ponto inicial" section of the roteiro
 * panel header (TASK-RF-006.3, RF-21/22, fluxo §10.5/§10.10). One phase at a
 * time: pick GPS or arm a map tap → (optional) confirm a tapped address →
 * defined (with the suggestion line's label + redefine). All ephemeral state
 * lives in the MapScreen; this component only renders the phase.
 */
interface Props {
  phase: StartPhase;
  /** Short warning (GPS denied/timeout/out of bounds); null = none. */
  notice: string | null;
  /** Address of the tapped point (confirm-point phase). */
  pendingAddress?: string;
  /** Ready suggestion label ("Sugestão: … — 230 m (linha reta)"); null = none. */
  suggestionLabel?: string | null;
  onUseGps: () => void;
  onArmMapTap: () => void;
  onConfirmPoint: () => void;
  onCancel: () => void;
  onRedefine: () => void;
}

export const RoteiroStartSection = ({ phase, notice, pendingAddress, suggestionLabel, onUseGps, onArmMapTap, onConfirmPoint, onCancel, onRedefine }: Props) => (
  <div className="px-4 pb-2">
    {phase === "no-start" && (
      <>
        <p className="text-xs font-medium text-muted-foreground">{START.SECTION}</p>
        <p className="pt-0.5 text-xs text-muted-foreground">{UI_LABELS.MAP_PANEL.ROTEIRO_HINT_START}</p>
        <div className="flex gap-2 pt-2">
          <Button type="button" size="sm" data-vaul-no-drag onClick={onUseGps}>
            {START.USE_GPS}
          </Button>
          <Button type="button" variant="outline" size="sm" data-vaul-no-drag onClick={onArmMapTap}>
            {START.ARM_MAP_TAP}
          </Button>
        </div>
      </>
    )}

    {phase === "arming" && (
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium">{START.ARMED_HINT}</p>
        <Button type="button" variant="outline" size="sm" data-vaul-no-drag onClick={onCancel}>
          {START.CANCEL}
        </Button>
      </div>
    )}

    {phase === "locating" && <p className="text-sm text-muted-foreground">{START.LOCATING}</p>}

    {phase === "confirm-point" && (
      <>
        <p className="text-sm font-medium">{START.CONFIRM_POINT(pendingAddress ?? UI_LABELS.COMMON.NO_DATA)}</p>
        <div className="flex gap-2 pt-2">
          <Button type="button" size="sm" data-vaul-no-drag onClick={onConfirmPoint}>
            {START.CONFIRM}
          </Button>
          <Button type="button" variant="outline" size="sm" data-vaul-no-drag onClick={onCancel}>
            {START.CANCEL}
          </Button>
        </div>
      </>
    )}

    {phase === "has-start" && (
      <>
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium">{START.DEFINED}</p>
          <Button type="button" variant="outline" size="sm" data-vaul-no-drag onClick={onRedefine}>
            {START.REDEFINE}
          </Button>
        </div>
        {suggestionLabel && <p className="truncate pt-1 text-xs text-muted-foreground">{suggestionLabel}</p>}
      </>
    )}

    {notice && <p className="pt-1 text-xs font-medium text-destructive">{notice}</p>}
  </div>
);
