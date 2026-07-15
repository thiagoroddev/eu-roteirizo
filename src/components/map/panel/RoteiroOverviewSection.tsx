import { useState } from "react";
import { Car, MapPin, RotateCcw } from "lucide-react";
import { Button } from "../../ui/button";
import { PanelSection } from "./PanelSection";
import { PanelTitle, type PanelMetric } from "./PanelTitle";
import { StopItemList } from "./StopItemList";
import { RouteProgressCard } from "./RouteProgressCard";
import { SuggestedStopSection, type SuggestedStopView } from "./SuggestedStopCard";
import { ROTEIRO_MARKER_COLORS } from "../../../utils/markers/markerColors";
import type { StopItemData } from "../../../utils/markers/panelModels";
import type { RouteProgress } from "../../../utils/routing/overview";
import type { PlannedRouteTotals } from "../../../utils/routing/estimates";
import { UI_LABELS } from "../../../constants/uiLabels";

const OVERVIEW = UI_LABELS.MAP_PANEL.ROTEIRO_OVERVIEW;

/** A committed stop through the panel's own vocabulary (PanelTitle + chips). */
export interface OverviewStopView {
  id: string;
  order: number;
  neighborhoods: string[];
  zipcodes: string[];
  metrics: PanelMetric[];
  /** Addresses in visit order (ordinals) — the tap-to-expand drill-down. */
  items: StopItemData[];
}

/** The route's start as a row ("parada 0" — RF-006.11). */
export interface OverviewStartView {
  /** The start address (when it IS one) or the "Início definido" fallback. */
  addressLine: string;
}

/**
 * StartRow - the start as "parada 0" (RF-006.11): an address-styled row with
 * the blue start car as its mini-marker and the redefine action beside it.
 * Exported for the start-selected panel section (tapping the start marker).
 */
export const StartRow = ({ start, onRedefine }: { start: OverviewStartView; onRedefine: () => void }) => (
  <div className="flex items-center">
    <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3">
      <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: ROTEIRO_MARKER_COLORS.start.bottom, color: "#FFFFFF" }}>
        <Car className="h-3.5 w-3.5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{start.addressLine}</span>
    </div>
    <Button
      type="button"
      variant="ghost"
      size="icon"
      data-vaul-no-drag
      aria-label={UI_LABELS.MAP_PANEL.ROTEIRO_START.REDEFINE}
      title={UI_LABELS.MAP_PANEL.ROTEIRO_START.REDEFINE}
      className="mr-2 shrink-0"
      onClick={onRedefine}
    >
      <RotateCcw aria-hidden />
    </Button>
  </div>
);

/**
 * RoteiroOverviewSection - the "Ver detalhes" study panel (TASK-RF-006.8, v2 na
 * RF-006.11): a DEDICATED state, always the same regardless of what was
 * selected. In order: construction progress (with the totals' "Detalhes"),
 * confirmed stops STARTING at "parada 0" (the start), and — only while the
 * roteiro is incomplete — the suggested next stop as a card (the complete
 * state, with "Iniciar execução", is RF-009's). No context sections here.
 */
interface Props {
  progress: RouteProgress;
  /** Current sums (RF-006.11); null hides the Detalhes subsection. */
  totals: PlannedRouteTotals | null;
  /** The start as "parada 0"; null before a start exists. */
  start: OverviewStartView | null;
  onRedefineStart: () => void;
  stops: OverviewStopView[];
  /** The address (point id) that IS the start — flagged in drill-downs. */
  startKey: string | null;
  /** Null when complete (or before a start): the card simply doesn't render. */
  suggestion: SuggestedStopView | null;
  /** Selects the stop and returns the panel to the summary (see the map). */
  onShowStopOnMap: (stopId: string) => void;
  /** Focuses the suggestion on the map (selects the seed → tela 8 preview). */
  onShowSuggestedOnMap: () => void;
  /** Commits the suggested stop — the same commit tela 8's "Criar parada" does. */
  onCreateSuggested: () => void;
}

export const RoteiroOverviewSection = ({ progress, totals, start, onRedefineStart, stops, startKey, suggestion, onShowStopOnMap, onShowSuggestedOnMap, onCreateSuggested }: Props) => {
  /** One drill-down open at a time — the overview is a scan, not an editor. */
  const [openStopId, setOpenStopId] = useState<string | null>(null);

  return (
    <div>
      <PanelSection label={OVERVIEW.SECTION_PROGRESS}>
        <RouteProgressCard progress={progress} totals={totals} />
      </PanelSection>

      <PanelSection label={OVERVIEW.SECTION_CONFIRMED}>
        {/* "Parada 0" — the start opens the list (RF-006.11). Divider below it:
            the confirmed list reads like the single-stop address list (smoke
            15/07 — "cada parada separada por linha horizontal"). */}
        {start && (
          <div className="border-b border-input">
            <StartRow start={start} onRedefine={onRedefineStart} />
          </div>
        )}
        {stops.length === 0 ? (
          // Canonical empty-state chrome (REF-016): px-4 py-2 text-xs.
          <p className="px-4 py-2 text-xs text-muted-foreground">{OVERVIEW.NO_STOPS}</p>
        ) : (
          <ul>
            {stops.map((stop) => (
              // Same divider chrome as StopItem (smoke 15/07).
              <li key={stop.id} className="border-b border-input last:border-b-0">
                <div className="flex items-center">
                  <button
                    type="button"
                    data-vaul-no-drag
                    className="min-w-0 flex-1 text-left"
                    aria-label={OVERVIEW.STOP_ARIA(stop.order)}
                    aria-expanded={openStopId === stop.id}
                    onClick={() => setOpenStopId((current) => (current === stop.id ? null : stop.id))}
                  >
                    <PanelTitle stopNumber={String(stop.order)} neighborhoods={stop.neighborhoods} zipcodes={stop.zipcodes} metrics={stop.metrics} />
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    data-vaul-no-drag
                    aria-label={UI_LABELS.MAP_PANEL.VIEW_ON_MAP}
                    title={UI_LABELS.MAP_PANEL.VIEW_ON_MAP}
                    className="mr-2 shrink-0"
                    onClick={() => onShowStopOnMap(stop.id)}
                  >
                    <MapPin aria-hidden />
                  </Button>
                </div>
                {openStopId === stop.id && <StopItemList items={stop.items} selectedKey={null} neon startKey={startKey} />}
              </li>
            ))}
          </ul>
        )}
      </PanelSection>

      {/* LAST, and only while incomplete: the algorithm's next pick, as a CARD. */}
      {suggestion && <SuggestedStopSection suggestion={suggestion} onShowOnMap={onShowSuggestedOnMap} onCreate={onCreateSuggested} />}
    </div>
  );
};
