import { useState } from "react";
import { Car } from "lucide-react";
import { Button } from "../../ui/button";
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
 * - **Parada sugerida** (3ª/4ª rodadas 08/07): the summary of the stop AS IT
 *   WOULD BE if created — the normal stop summary (PanelTitle + typed chips +
 *   walking estimate) over the seed + radius candidates. The label row carries
 *   the VEHICLE distance from the last stop (or the start) to the suggested
 *   anchor — "Distância até aqui: 1,2 km" + car icon (the icon qualifies;
 *   sr-only keeps it spoken) — and the "Criar parada" CTA on the right.
 *   "Incorporar em outra parada" sits below; its target select only appears on
 *   demand (tapping the button), pre-set to the nearest stop.
 *
 * Callers MUST key this component by the selected point (key={point.id}) so the
 * select/choosing state re-anchors per point via remount (React's key-reset
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
}: Props) => {
  /** The target select is ON DEMAND (rev. 08/07 3ª rodada — no fixed select). */
  const [choosing, setChoosing] = useState(false);
  const [targetStopId, setTargetStopId] = useState<string | null>(defaultStopId);

  const target = stopOptions.find((option) => option.id === targetStopId) ?? null;

  return (
    <div>
      {/* 2ª seção — Endereço selecionado. The "no stop yet" notice lives HERE —
          it is about the ADDRESS (rev. 08/07). */}
      <PanelSection label={UI_LABELS.MAP_PANEL.SECTION_SELECTED}>
        <p className="px-4 pt-0.5 text-xs text-muted-foreground">{UI_LABELS.MAP_PANEL.ROTEIRO_NO_STOP_YET}</p>
        {/* Highlighted by default — it IS the selected address (RF-006.4.13).
            pb-2 like every other section's last block: without it the highlighted
            row's `bg-accent` runs into the next section's `border-t`, and a
            light divider over a light accent reads as no divider at all. */}
        <div className="pb-2">
          <StopItemRow item={item} onTap={onTapCard} highlighted expanded={expanded} neon />
        </div>
      </PanelSection>

      {/* 3ª seção — Parada sugerida: how the stop would look if created now.
          Label row = vehicle distance (car icon qualifies) + "Criar parada"
          on the right (rev. 08/07 4ª rodada). */}
      <PanelSection
        label={UI_LABELS.MAP_PANEL.SECTION_SUGGESTED}
        meta={
          vehicleDistanceLabel ? (
            <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
              <span className="truncate">{vehicleDistanceLabel}</span>
              <Car className="h-3.5 w-3.5 shrink-0" aria-hidden />
              <span className="sr-only">{POINT.VEHICLE_QUALIFIER}</span>
            </span>
          ) : null
        }
        actions={
          <Button type="button" size="sm" data-vaul-no-drag onClick={onCreateStop}>
            {POINT.CREATE_STOP}
          </Button>
        }
      >
        <PanelTitle stopNumber={String(suggestedOrder)} neighborhoods={suggestedPlace.neighborhoods} zipcodes={suggestedPlace.zipcodes} metrics={suggestedMetrics} />

        {/* Radius adjustable BEFORE creating (RF-006.4.6): the members that
            enter on "Criar parada" are exactly what this radius includes. */}
        <div className="px-4 pb-2">
          <RadiusStepper radiusMeters={radiusMeters} onRadiusChange={onRadiusChange} />
        </div>

        {stopOptions.length > 0 && !choosing && (
          <div className="flex flex-wrap items-center gap-2 px-4 pb-2">
            <Button type="button" variant="outline" size="sm" data-vaul-no-drag onClick={() => setChoosing(true)}>
              {POINT.INCORPORATE_OTHER}
            </Button>
          </div>
        )}

        {choosing && targetStopId !== null && (
          <>
            <div className="flex flex-wrap items-center gap-2 px-4 pb-2">
              <select
                aria-label={POINT.TARGET_STOP_ARIA}
                data-vaul-no-drag
                // Pill like the buttons beside it (design-system consistency — RF-006.4.2).
                className="h-8 rounded-full border border-input bg-background px-3 text-xs"
                value={targetStopId}
                onChange={(event) => setTargetStopId(event.target.value)}
              >
                {stopOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button type="button" size="sm" data-vaul-no-drag onClick={() => onIncorporate(targetStopId)}>
                {POINT.CONFIRM}
              </Button>
              <Button type="button" variant="ghost" size="sm" data-vaul-no-drag onClick={() => setChoosing(false)}>
                {POINT.CANCEL}
              </Button>
            </div>
            {target?.far && <p className="px-4 pb-2 text-xs font-medium text-destructive">{POINT.FAR_FROM_STOP}</p>}
          </>
        )}
      </PanelSection>
    </div>
  );
};
