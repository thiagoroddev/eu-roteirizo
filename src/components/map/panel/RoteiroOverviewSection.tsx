import { useState, type ReactNode } from "react";
import { Car, Download, MapPin, Move, Trash2 } from "lucide-react";
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
const START = UI_LABELS.MAP_PANEL.ROTEIRO_START;

/** A committed stop through the panel's own vocabulary (PanelTitle + chips). */
export interface OverviewStopView {
  id: string;
  order: number;
  neighborhoods: string[];
  zipcodes: string[];
  metrics: PanelMetric[];
  /** Custom title overriding "Parada N — Bairro" (RF-53 / TASK-RF-038). */
  titleOverride?: ReactNode;
  /** Addresses in visit order (ordinals) — the tap-to-expand drill-down. */
  items: StopItemData[];
  /** The address the vehicle parks by (1st) — its "Parada do veículo" badge in
      the drill-down (RF-006.10 smoke), matching the firmed-stop view. */
  vehicleStopKey: string | null;
}

/** The route's start as a row ("parada 0" — RF-006.11). */
export interface OverviewStartView {
  /** The start address (when it IS one) or the "Início definido" fallback. */
  addressLine: string;
}

/**
 * StartRow - the start as "parada 0" (RF-006.11): an address-styled row with
 * the blue start car as its mini-marker and, beside it, the TWO start gestures
 * (RF-006.14): "Mudar posição" (arms a map tap — the current start stays until
 * a new one lands) and "Apagar início" (drops it — the car disappears). The old
 * single "Redefinir" only re-armed and kept the car, which read as a bug.
 * Exported for the start-selected panel section (tapping the start marker).
 */
export const StartRow = ({ start, onDelete, onReposition }: { start: OverviewStartView; onDelete: () => void; onReposition: () => void }) => (
  <div className="flex items-center">
    {/* py-2.5: the overview list's ONE vertical rhythm (smoke 15/07 — the start
        row had py-3 while the stop rows had no top padding at all). */}
    <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-2.5">
      <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: ROTEIRO_MARKER_COLORS.start.bottom, color: "#FFFFFF" }}>
        <Car className="h-3.5 w-3.5" aria-hidden />
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-medium">{start.addressLine}</span>
    </div>
    <div className="mr-2 flex shrink-0 items-center gap-1">
      <Button type="button" variant="ghost" size="icon" data-vaul-no-drag aria-label={START.REPOSITION_START} title={START.REPOSITION_START} onClick={onReposition}>
        <Move aria-hidden />
      </Button>
      <Button type="button" variant="ghost" size="icon" data-vaul-no-drag aria-label={START.DELETE_START} title={START.DELETE_START} onClick={onDelete}>
        <Trash2 aria-hidden />
      </Button>
    </div>
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
  /** Current sums (RF-006.11); null hides the summary cards. */
  totals: PlannedRouteTotals | null;
  /** Whether the totals came from the street graph (RF-006.7) — drives the caption. */
  totalsViaStreets?: boolean;
  /** Commercial-hours package count among committed points (RF-006.20). */
  commercialPackages: number;
  /** The start as "parada 0"; null before a start exists. */
  start: OverviewStartView | null;
  /** Start gestures (RF-006.14): reposition arms a map tap; delete drops it. */
  onDeleteStart: () => void;
  onRepositionStart: () => void;
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
  /** Export the current route to a JSON file (TASK-RF-013). */
  onExportRoute?: () => void;
}

export const RoteiroOverviewSection = ({
  progress,
  totals,
  totalsViaStreets = false,
  commercialPackages,
  start,
  onDeleteStart,
  onRepositionStart,
  stops,
  startKey,
  suggestion,
  onShowStopOnMap,
  onShowSuggestedOnMap,
  onCreateSuggested,
  onExportRoute,
}: Props) => {
  /** One drill-down open at a time — the overview is a scan, not an editor. */
  const [openStopId, setOpenStopId] = useState<string | null>(null);

  return (
    <div>
      <PanelSection label={OVERVIEW.SECTION_PROGRESS}>
        <RouteProgressCard progress={progress} totals={totals} viaStreets={totalsViaStreets} commercialPackages={commercialPackages} />
        {onExportRoute && stops.length > 0 && (
          <div className="mt-2.5 flex justify-end px-4">
            <Button type="button" variant="outline" size="sm" onClick={onExportRoute} className="gap-1.5 text-xs font-semibold" aria-label={OVERVIEW.EXPORT_ROUTE_ARIA} data-vaul-no-drag>
              <Download className="h-3.5 w-3.5" aria-hidden />
              {OVERVIEW.EXPORT_ROUTE}
            </Button>
          </div>
        )}
      </PanelSection>

      <PanelSection label={OVERVIEW.SECTION_CONFIRMED(stops.length)}>
        {/* "Parada 0" — the start opens the list (RF-006.11). Divider below it:
            the confirmed list reads like the single-stop address list (smoke
            15/07 — "cada parada separada por linha horizontal"). */}
        {start && (
          <div className="border-b border-input">
            <StartRow start={start} onDelete={onDeleteStart} onReposition={onRepositionStart} />
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
                    {/* pt-2.5 = same rhythm as the start row (smoke 15/07: the
                        title used to sit flush on the divider above). */}
                    <PanelTitle
                      className="pt-2.5"
                      stopNumber={String(stop.order)}
                      neighborhoods={stop.neighborhoods}
                      zipcodes={stop.zipcodes}
                      metrics={stop.metrics}
                      titleOverride={stop.titleOverride}
                    />
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
                {openStopId === stop.id && <StopItemList items={stop.items} selectedKey={null} neon startKey={startKey} vehicleStopKey={stop.vehicleStopKey} />}
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
