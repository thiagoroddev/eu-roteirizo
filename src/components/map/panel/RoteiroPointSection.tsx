import { useState } from "react";
import { Car, RotateCcw } from "lucide-react";
import { Button } from "../../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import { PanelSection } from "./PanelSection";
import { PanelTitle, type PanelMetric } from "./PanelTitle";
import { RadiusStepper } from "./RoteiroDraftSection";
import { StopItemRow } from "./StopItem";
import type { StopItemData } from "../../../utils/markers/panelModels";
import { UI_LABELS } from "../../../constants/uiLabels";

const POINT = UI_LABELS.MAP_PANEL.ROTEIRO_POINT;

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
  onCreateStop: () => void;
  onIncorporate: (stopId: string) => void;
  /** This address IS the route's start (RF-006.11): flag + redefine beside it. */
  isStart?: boolean;
  onRedefineStart?: () => void;
}

export const RoteiroPointSection = ({
  item,
  expanded,
  onTapCard,
  suggestedOrder,
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
  onRedefineStart,
}: Props) => {
  /** The target is chosen in a POPUP (rev. 15/07 — was an inline select). */
  const [incorporating, setIncorporating] = useState(false);
  const [targetStopId, setTargetStopId] = useState<string | null>(defaultStopId);

  const target = stopOptions.find((option) => option.id === targetStopId) ?? null;

  return (
    <div>
      {/* 2ª seção — Endereço selecionado. The "no stop yet" notice lives HERE —
          it is about the ADDRESS (rev. 08/07). */}
      <PanelSection label={UI_LABELS.MAP_PANEL.SECTION_SELECTED}>
        {/* No local pt: the label's breathing room is PanelSection's pb-1 now
            (REF-016) — per-component compensations are exactly what drifted. */}
        <p className="px-4 text-xs text-muted-foreground">{UI_LABELS.MAP_PANEL.ROTEIRO_NO_STOP_YET}</p>
        {/* Highlighted by default — it IS the selected address (RF-006.4.13).
            pb-2 like every other section's last block: without it the highlighted
            row's `bg-accent` runs into the next section's `border-t`, and a
            light divider over a light accent reads as no divider at all. */}
        <div className="flex items-center pb-2">
          <div className="min-w-0 flex-1">
            <StopItemRow item={item} onTap={onTapCard} highlighted expanded={expanded} neon isStart={isStart} />
          </div>
          {/* The start-address redefine lives beside its row (RF-006.11) — a
              sibling, never nested: the row itself is a button. */}
          {isStart && onRedefineStart && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              data-vaul-no-drag
              aria-label={UI_LABELS.MAP_PANEL.ROTEIRO_START.REDEFINE}
              title={UI_LABELS.MAP_PANEL.ROTEIRO_START.REDEFINE}
              className="mr-2 shrink-0"
              onClick={onRedefineStart}
            >
              <RotateCcw aria-hidden />
            </Button>
          )}
        </div>
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
            <Button type="button" size="sm" data-vaul-no-drag onClick={onCreateStop}>
              {POINT.CREATE_STOP}
            </Button>
          </>
        }
      >
        {vehicleDistanceLabel && (
          <p className="flex items-center gap-1 px-4 pb-1 text-xs text-muted-foreground">
            <span>{vehicleDistanceLabel}</span>
            <Car className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span className="sr-only">{POINT.VEHICLE_QUALIFIER}</span>
          </p>
        )}
        <PanelTitle stopNumber={String(suggestedOrder)} neighborhoods={suggestedPlace.neighborhoods} zipcodes={suggestedPlace.zipcodes} metrics={suggestedMetrics} />

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
