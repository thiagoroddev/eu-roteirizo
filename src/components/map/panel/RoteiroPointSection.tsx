import { useState } from "react";
import { Car, Move, Trash2 } from "lucide-react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { PanelSection } from "./PanelSection";
import { PanelTitle, type PanelMetric } from "./PanelTitle";
import { RadiusStepper } from "./RoteiroDraftSection";
import { StopItemRow, StopItemDetail } from "./StopItem";
import type { StopItemData } from "../../../utils/markers/panelModels";
import { UI_LABELS } from "../../../constants/uiLabels";

const POINT = UI_LABELS.MAP_PANEL.ROTEIRO_POINT;
const START = UI_LABELS.MAP_PANEL.ROTEIRO_START;

/** A committed stop the orphan can join, plus its RN-17 distance hint. */
export interface StopOption {
  id: string;
  label: string;
  /** True when the orphan sits suspiciously far from this stop's anchor (soft warning only). */
  far: boolean;
}

/**
 * RoteiroPointSection - the selected free point (tela 8 — TASK-RF-006.4.1/.4.3).
 * The panel's 2ª and 3ª seções, in the Original's section chrome (PanelSection):
 *
 * - **Endereço selecionado**: the "no stop yet" notice + the Original's own
 *   StopItemRow (tap → StopItemDetail in the panel body, wired by the MapScreen).
 * - **Prévia de parada** (3ª/4ª rodadas 08/07; renomeada 10/07): the summary of the stop AS IT
 *   WOULD BE if created — the normal stop summary (PanelTitle + typed chips +
 *   walking estimate) over the seed + radius candidates. The VEHICLE distance
 *   ("Distância até aqui" + car icon; sr-only keeps it spoken) sits on its OWN
 *   line under the label (rev. 15/07 — beside the label it truncated). The
 *   label row carries the actions: "Incorporar em outra parada" (opens the
 *   target POPUP, pre-set to the nearest stop — rev. 15/07, was inline) and
 *   the "Criar parada" CTA.
 *
 * Callers MUST key this component by the selected point (key={point.id}) so the
 * popup/target state re-anchors per point via remount (React's key-reset
 * pattern — no state-syncing effect).
 */
interface Props {
  /** The point, adapted to the Original panel vocabulary (pointToStopItemData). */
  item: StopItemData;
  /** Whether the card's detail is open in the panel body. */
  expanded: boolean;
  onTapCard: () => void;
  /** The would-be stop's number (stops.length + 1). */
  suggestedOrder: number;
  /** Place summary of the seed address (stopPlaceSummaryFromPoints). */
  suggestedPlace: { neighborhoods: string[]; zipcodes: string[] };
  /** N endereços · pacotes por tipo · "~min · m a pé" (typed chips). */
  suggestedMetrics: PanelMetric[];
  /** "Distância até aqui: X" (+ "(linha reta)" fallback); null = hidden. */
  vehicleDistanceLabel: string | null;
  /** Grouping radius of the preview — adjustable BEFORE creating (RF-006.4.6). */
  radiusMeters: number;
  onRadiusChange: (meters: number) => void;
  stopOptions: StopOption[];
  /** Pre-selected target (the nearest stop); null without stops. */
  defaultStopId: string | null;
  /** Total existing stops, used to offer insertion options (defaults to stops length). */
  totalStops?: number;
  onCreateStop: (targetOrder?: number) => void;
  onIncorporate: (stopId: string) => void;
  /** This address IS the route's start (RF-006.11): flag + start gestures beside it. */
  isStart?: boolean;
  /** Start gestures (RF-006.14): reposition arms a map tap; delete drops it. */
  onDeleteStart?: () => void;
  onRepositionStart?: () => void;
  /** Se o endereço selecionado está ignorado. */
  isIgnored?: boolean;
  /** Callback para alternar entre ignorar e restaurar o endereço. */
  onToggleIgnore?: () => void;
}

export const RoteiroPointSection = ({
  item,
  expanded,
  onTapCard,
  suggestedOrder,
  totalStops,
  suggestedPlace,
  suggestedMetrics,
  vehicleDistanceLabel,
  radiusMeters,
  onRadiusChange,
  stopOptions,
  defaultStopId,
  onCreateStop,
  onIncorporate,
  isStart = false,
  onDeleteStart,
  onRepositionStart,
  isIgnored = false,
  onToggleIgnore,
}: Props) => {
  const stopsCount = totalStops ?? (stopOptions.length > 0 ? stopOptions.length : suggestedOrder > 1 ? suggestedOrder - 1 : 0);
  const [chosenOrder, setChosenOrder] = useState<number>(suggestedOrder);
  /** The target is chosen in a POPUP (rev. 15/07 — was an inline select). */
  const [incorporating, setIncorporating] = useState(false);
  const [targetStopId, setTargetStopId] = useState<string | null>(defaultStopId);

  const target = stopOptions.find((option) => option.id === targetStopId) ?? null;

  return (
    <div>
      {/* 2ª seção — Endereço selecionado. The "no stop yet" notice lives HERE —
          it is about the ADDRESS (rev. 08/07). */}
      <PanelSection
        label={UI_LABELS.MAP_PANEL.SECTION_SELECTED}
        meta={
          isIgnored ? (
            <Badge variant="outline" className="border-orange-500/60 bg-orange-500/10 text-orange-600 dark:text-orange-400 px-1.5 py-0 text-[10px] font-semibold">
              {UI_LABELS.MAP_PANEL.IGNORED_BADGE}
            </Badge>
          ) : undefined
        }
        actions={
          onToggleIgnore && (
            <Button type="button" variant="outline" size="sm" className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground" data-vaul-no-drag onClick={onToggleIgnore}>
              {isIgnored ? UI_LABELS.MAP_PANEL.UNIGNORE_ADDRESS : UI_LABELS.MAP_PANEL.IGNORE_ADDRESS}
            </Button>
          )
        }
      >
        {/* No local pt: the label's breathing room is PanelSection's pb-1 now
            (REF-016) — per-component compensations are exactly what drifted. */}
        <p className="px-4 text-xs text-muted-foreground">{UI_LABELS.MAP_PANEL.ROTEIRO_NO_STOP_YET}</p>
        {/* Highlighted by default — it IS the selected address (RF-006.4.13).
            pb-2 like every other section's last block: without it the highlighted
            row sat flush on the next section's divider. */}
        <div className="pb-2">
          {isStart ? (
            /* Address that IS the start: mini blue-car icon + start gestures (RF-006.11/.14). */
            <div className="flex items-center">
              <div className="min-w-0 flex-1">
                <StopItemRow item={item} onTap={onTapCard} highlighted expanded={expanded} neon isStart={isStart} />
              </div>
              <div className="mr-2 flex shrink-0 items-center gap-1">
                {onRepositionStart && (
                  <Button type="button" variant="ghost" size="icon" data-vaul-no-drag aria-label={START.REPOSITION_START} title={START.REPOSITION_START} onClick={onRepositionStart}>
                    <Move aria-hidden />
                  </Button>
                )}
                {onDeleteStart && (
                  <Button type="button" variant="ghost" size="icon" data-vaul-no-drag aria-label={START.DELETE_START} title={START.DELETE_START} onClick={onDeleteStart}>
                    <Trash2 aria-hidden />
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <StopItemRow item={item} onTap={onTapCard} highlighted expanded={expanded} neon />
          )}
        </div>
        {/* Its packages drill down RIGHT HERE (RF-006.15 bug fix): the detail
            used to render in the panel body, AFTER "Prévia de parada" — visually
            divorced from the address it belongs to. */}
        {expanded && <StopItemDetail item={item} />}
      </PanelSection>

      {/* 3ª seção — "Prévia de parada" (renomeada 10/07; era "Parada sugerida",
          que prometia escolha do app): how the stop would look if created now.
          "Criar parada" on the label row; the vehicle distance moved to its OWN
          line (smoke 15/07 — beside the label it truncated with the
          "(linha reta)" suffix). */}
      <PanelSection
        label={UI_LABELS.MAP_PANEL.SECTION_SUGGESTED}
        actions={
          <>
            {/* Beside the section label (smoke 15/07) — opens the target POPUP. */}
            {stopOptions.length > 0 && (
              <Button type="button" variant="outline" size="sm" data-vaul-no-drag onClick={() => setIncorporating(true)}>
                {POINT.INCORPORATE_OTHER}
              </Button>
            )}
            <Button type="button" size="sm" data-vaul-no-drag onClick={() => onCreateStop(chosenOrder)}>
              {POINT.CREATE_STOP}
            </Button>
          </>
        }
      >
        {vehicleDistanceLabel && (
          <p className="flex items-center gap-1 px-4 pb-1.5 text-xs text-muted-foreground">
            <span>{vehicleDistanceLabel}</span>
            <Car className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="sr-only">{POINT.VEHICLE_QUALIFIER}</span>
          </p>
        )}
        <PanelTitle stopNumber={String(chosenOrder)} neighborhoods={suggestedPlace.neighborhoods} zipcodes={suggestedPlace.zipcodes} metrics={suggestedMetrics} />

        {/* Position picker when there are previous stops (TASK-RF-035) */}
        {stopsCount > 0 && (
          <div className="flex items-center justify-between gap-2 px-4 pb-2">
            <label htmlFor="insert-position-select" className="text-xs text-muted-foreground whitespace-nowrap">
              {POINT.INSERT_POSITION_LABEL}
            </label>
            <select
              id="insert-position-select"
              aria-label={POINT.INSERT_POSITION_LABEL}
              value={chosenOrder}
              onChange={(e) => setChosenOrder(Number(e.target.value))}
              className="h-8 rounded-md border border-input bg-background px-2 text-xs"
              data-vaul-no-drag
            >
              {Array.from({ length: stopsCount + 1 }, (_, i) => i + 1).map((order) => (
                <option key={order} value={order}>
                  {POINT.INSERT_POSITION_OPTION(order, order === stopsCount + 1)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Radius adjustable BEFORE creating (RF-006.4.6): the members that
            enter on "Criar parada" are exactly what this radius includes. */}
        <div className="px-4 pb-2">
          <RadiusStepper radiusMeters={radiusMeters} onRadiusChange={onRadiusChange} />
        </div>
      </PanelSection>

      {/* Target POPUP (rev. 15/07 — was an inline select): pick the stop that
          receives this address + Confirmar; RN-17 warns inside the popup. */}
      <Dialog open={incorporating} onOpenChange={setIncorporating}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{POINT.INCORPORATE_OTHER}</DialogTitle>
            <DialogDescription>{POINT.INCORPORATE_HINT}</DialogDescription>
          </DialogHeader>
          {targetStopId !== null && (
            <select
              aria-label={POINT.TARGET_STOP_ARIA}
              className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={targetStopId}
              onChange={(event) => setTargetStopId(event.target.value)}
            >
              {stopOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          )}
          {target?.far && <p className="text-xs font-medium text-destructive">{POINT.FAR_FROM_STOP}</p>}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIncorporating(false)}>
              {POINT.CANCEL}
            </Button>
            <Button
              type="button"
              onClick={() => {
                if (targetStopId !== null) onIncorporate(targetStopId);
                setIncorporating(false);
              }}
            >
              {POINT.CONFIRM}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
