import { useState } from "react";
import { Car, MapPin } from "lucide-react";
import { Button } from "../../ui/button";
import { PanelSection } from "./PanelSection";
import { PanelTitle, type PanelMetric } from "./PanelTitle";
import { StopItemList } from "./StopItemList";
import { RouteProgressCard } from "./RouteProgressCard";
import type { StopItemData } from "../../../utils/markers/panelModels";
import type { RouteProgress } from "../../../utils/routing/overview";
import { UI_LABELS } from "../../../constants/uiLabels";

const OVERVIEW = UI_LABELS.MAP_PANEL.ROTEIRO_OVERVIEW;
const POINT = UI_LABELS.MAP_PANEL.ROTEIRO_POINT;

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

/** The would-be NEXT stop (nextStopSuggestion), numbered in sequence. */
export interface OverviewSuggestionView {
  order: number;
  neighborhoods: string[];
  zipcodes: string[];
  metrics: PanelMetric[];
  /** "Distância até aqui: X" (+ "(linha reta)" fallback); null = hidden. */
  vehicleDistanceLabel: string | null;
}

/**
 * RoteiroOverviewSection - the roteiro's study panel (TASK-RF-006.8): progress,
 * what got built, and what comes next. Renders as the panel BODY — the idle
 * context's default content and any context's "Ver detalhes". Three sections in
 * the shared chrome (PanelSection); NO new address card — the drill-down is the
 * same StopItemList the Original validated, and the suggestion is the same
 * summary shape as tela 8's "Prévia de parada".
 */
interface Props {
  progress: RouteProgress;
  stops: OverviewStopView[];
  suggestion: OverviewSuggestionView | null;
  /** Selects the stop and returns the panel to the summary (see the map). */
  onShowStopOnMap: (stopId: string) => void;
  /** Commits the suggested stop — the same commit tela 8's "Criar parada" does. */
  onCreateSuggested: () => void;
}

export const RoteiroOverviewSection = ({ progress, stops, suggestion, onShowStopOnMap, onCreateSuggested }: Props) => {
  /** One drill-down open at a time — the overview is a scan, not an editor. */
  const [openStopId, setOpenStopId] = useState<string | null>(null);

  return (
    <div>
      <PanelSection label={OVERVIEW.SECTION_PROGRESS}>
        <RouteProgressCard progress={progress} />
      </PanelSection>

      <PanelSection label={OVERVIEW.SECTION_CONFIRMED}>
        {stops.length === 0 ? (
          // Canonical empty-state chrome (REF-016): px-4 py-2 text-xs.
          <p className="px-4 py-2 text-xs text-muted-foreground">{OVERVIEW.NO_STOPS}</p>
        ) : (
          <ul>
            {stops.map((stop) => (
              <li key={stop.id}>
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
                {openStopId === stop.id && <StopItemList items={stop.items} selectedKey={null} neon />}
              </li>
            ))}
          </ul>
        )}
      </PanelSection>

      {suggestion && (
        <PanelSection
          label={OVERVIEW.SECTION_NEXT}
          // Vehicle leg to the suggested anchor — the car icon qualifies the
          // distance (same meta as tela 8's "Prévia de parada").
          meta={
            suggestion.vehicleDistanceLabel ? (
              <span className="flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                <span className="truncate">{suggestion.vehicleDistanceLabel}</span>
                <Car className="h-3.5 w-3.5 shrink-0" aria-hidden />
                <span className="sr-only">{POINT.VEHICLE_QUALIFIER}</span>
              </span>
            ) : null
          }
          actions={
            <Button type="button" size="sm" data-vaul-no-drag onClick={onCreateSuggested}>
              {POINT.CREATE_STOP}
            </Button>
          }
        >
          <PanelTitle stopNumber={String(suggestion.order)} neighborhoods={suggestion.neighborhoods} zipcodes={suggestion.zipcodes} metrics={suggestion.metrics} />
        </PanelSection>
      )}
    </div>
  );
};
