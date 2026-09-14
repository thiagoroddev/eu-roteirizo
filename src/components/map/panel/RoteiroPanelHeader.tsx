import { useState } from "react";
import { PanelModeBar } from "./PanelModeBar";
import { Button } from "../../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "../../ui/dialog";
import { UI_LABELS } from "../../../constants/uiLabels";

const OVERVIEW = UI_LABELS.MAP_PANEL.ROTEIRO_OVERVIEW;

/**
 * RoteiroPanelHeader - the MapPanel header of the Meu roteiro mode
 * (TASK-RF-006.2/.3/.4.1, RF-32 partial; CONCISE since TASK-RF-006.8): mode
 * label + construction percent + thin progress bar + the "Ver detalhes"
 * overview toggle. The old two-line HUD ("Faltando: X endereços · Y pacotes")
 * moved into the overview's stat cards — the collapsed panel got SHORTER.
 * Below it: a contextual what-to-do hint (feedback 08/07) and a discreet
 * road-graph status line (loading/error+retry; ready = silence).
 */
interface Props {
  /** 0..1 — addresses committed / total (routeProgress().ratio). */
  progress: number;
  /** "Roteiro incompleto — rascunho" while building; "Meu roteiro" when complete. */
  modeLabel: string;
  /** Contextual next step ("Toque num endereço…"); null = a section below guides. */
  statusHint?: string | null;
  /** Discreet graph status; null = nothing to show (idle/ready). */
  graphStatus?: { text: string; onRetry?: () => void } | null;
  /** Whether the overview body is open — flips the toggle's label. */
  detailsOpen: boolean;
  onToggleDetails: () => void;
  stopsCount?: number;
  onResetRoute?: () => void;
  /** StopStepper ‹ › over the firmed stops (TASK-RF-044, RF-58); hidden unless both exist. */
  onPrevStop?: () => void;
  onNextStop?: () => void;
  /** Arrows shown but disabled: a single firmed stop has nowhere to go. */
  stepDisabled?: boolean;
}

export const RoteiroPanelHeader = ({
  progress,
  modeLabel,
  statusHint = null,
  graphStatus = null,
  detailsOpen,
  onToggleDetails,
  stopsCount = 0,
  onResetRoute,
  onPrevStop,
  onNextStop,
  stepDisabled,
}: Props) => {
  const [resetDialogOpen, setResetDialogOpen] = useState(false);
  const showReset = stopsCount > 0 && onResetRoute !== undefined;

  return (
    // pb-2: breathing room before the next section's divider (rev. 08/07 3ª rodada).
    <div className="pb-2 pt-1">
      <PanelModeBar
        modeLabel={modeLabel}
        progress={progress}
        onPrevStop={onPrevStop}
        onNextStop={onNextStop}
        stepDisabled={stepDisabled}
        actions={
          <>
            {showReset && (
              <Dialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm" data-vaul-no-drag className="text-destructive hover:text-destructive" title={OVERVIEW.RESET_ROUTE_ARIA}>
                    {OVERVIEW.RESET_ROUTE}
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-sm" data-vaul-no-drag>
                  <DialogHeader>
                    <DialogTitle>{OVERVIEW.RESET_ROUTE_DIALOG_TITLE}</DialogTitle>
                    <DialogDescription>{OVERVIEW.RESET_ROUTE_DIALOG_DESC}</DialogDescription>
                  </DialogHeader>
                  <DialogFooter className="gap-2 sm:gap-0">
                    <DialogClose asChild>
                      <Button type="button" variant="outline">
                        {OVERVIEW.RESET_ROUTE_CANCEL}
                      </Button>
                    </DialogClose>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={() => {
                        setResetDialogOpen(false);
                        onResetRoute();
                      }}
                    >
                      {OVERVIEW.RESET_ROUTE_CONFIRM}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
            <Button type="button" variant="outline" size="sm" data-vaul-no-drag onClick={onToggleDetails}>
              {detailsOpen ? OVERVIEW.HIDE_DETAILS : OVERVIEW.VIEW_DETAILS}
            </Button>
          </>
        }
      />
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
};
