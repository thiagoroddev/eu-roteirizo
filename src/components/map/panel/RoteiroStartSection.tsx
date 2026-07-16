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
 * time: pick GPS or arm a map tap → (optional) confirm a tapped address. The
 * DEFINED state left this section in RF-006.11 (the start became "parada 0" +
 * its map marker), so this only renders the DEFINITION phases — the caller
 * gates it out once the start is set. All ephemeral state lives in the
 * MapScreen; this component only renders the phase.
 */
interface Props {
  phase: StartPhase;
  /** Short warning (GPS denied/timeout/out of bounds); null = none. */
  notice: string | null;
  /** Address of the tapped point (confirm-point phase). */
  pendingAddress?: string;
  onUseGps: () => void;
  onArmMapTap: () => void;
  onConfirmPoint: () => void;
  onCancel: () => void;
}

export const RoteiroStartSection = ({ phase, notice, pendingAddress, onUseGps, onArmMapTap, onConfirmPoint, onCancel }: Props) => (
  // Divider below the state header — same section chrome as the rest (rev. 08/07).
  <div className="border-t border-input px-4 pb-2 pt-2">
    {phase === "no-start" && (
      <>
        <p className="text-xs font-medium text-muted-foreground">{START.SECTION}</p>
        <p className="pt-0.5 text-xs text-muted-foreground">{UI_LABELS.MAP_PANEL.ROTEIRO_HINT_START}</p>
        {/* pb-1: with the notice's pt-1 below this makes the panel's 8px rhythm —
            the buttons' borders no longer sit on the text (REF-016). */}
        <div className="flex gap-2 pb-1 pt-2">
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
        <div className="flex gap-2 pb-1 pt-2">
          <Button type="button" size="sm" data-vaul-no-drag onClick={onConfirmPoint}>
            {START.CONFIRM}
          </Button>
          <Button type="button" variant="outline" size="sm" data-vaul-no-drag onClick={onCancel}>
            {START.CANCEL}
          </Button>
        </div>
      </>
    )}

    {notice && <p className="pt-1 text-xs font-medium text-destructive">{notice}</p>}
  </div>
);
