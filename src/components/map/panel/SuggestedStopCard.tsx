import { Car, MapPin } from "lucide-react";
import { Button } from "../../ui/button";
import { Card, CardContent } from "../../ui/card";
import { PanelSection } from "./PanelSection";
import { PanelMetricsRow, type PanelMetric } from "./PanelTitle";
import { UI_LABELS } from "../../../constants/uiLabels";

const OVERVIEW = UI_LABELS.MAP_PANEL.ROTEIRO_OVERVIEW;
const POINT = UI_LABELS.MAP_PANEL.ROTEIRO_POINT;

/** The algorithm's next-stop pick, ready for display (RF-006.11). */
export interface SuggestedStopView {
  /** Seed street + number, WITHOUT complement (decision 12/07). */
  addressLine: string;
  /** endereços · pacotes · estimativa a pé (typed chips). */
  metrics: PanelMetric[];
  /** "Distância até aqui: X" (+ "(linha reta)" fallback); null = hidden. */
  vehicleDistanceLabel: string | null;
}

/**
 * SuggestedStopSection - "Próxima parada sugerida" as a CARD (TASK-RF-006.11).
 * The card frame is the point: a suggested stop must be tell-apart-able from a
 * confirmed one WITHOUT reading (decision 12/07). The pick is the ALGORITHM's
 * (today: nearest free point by straight line; direction-aware/configurable
 * criteria arrive with RF-006.12/RF-007), so it re-points on its own — it is
 * NOT what the user selected. Rendered in the idle context's body and at the
 * end of the overview; never during an edit or with something selected.
 */
interface Props {
  suggestion: SuggestedStopView;
  /** Focuses the suggestion on the map (selects the seed → tela 8 preview). */
  onShowOnMap: () => void;
  /** Commits the suggested stop — the same commit tela 8's "Criar parada" does. */
  onCreate: () => void;
  /** Top divider (PanelSection contract); false when it opens a header. */
  divider?: boolean;
}

export const SuggestedStopSection = ({ suggestion, onShowOnMap, onCreate, divider = true }: Props) => (
  <PanelSection
    label={OVERVIEW.SECTION_NEXT}
    divider={divider}
    actions={
      <Button type="button" size="sm" data-vaul-no-drag onClick={onCreate}>
        {POINT.CREATE_STOP}
      </Button>
    }
  >
    {/* Vehicle leg on its OWN line (smoke 15/07: beside the label it truncated
        — "63 m (li…"). The car icon still qualifies the distance. pb-1.5 keeps
        the label→distance→card rhythm even with the overview rows. */}
    {suggestion.vehicleDistanceLabel && (
      <p className="flex items-center gap-1 px-4 pb-1.5 text-xs text-muted-foreground">
        <span>{suggestion.vehicleDistanceLabel}</span>
        <Car className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="sr-only">{POINT.VEHICLE_QUALIFIER}</span>
      </p>
    )}
    <div className="px-4 pb-2.5">
      <Card className="shadow-none">
        <CardContent className="flex items-center gap-2 p-3">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-semibold">{suggestion.addressLine}</span>
            {suggestion.metrics.length > 0 && <PanelMetricsRow metrics={suggestion.metrics} />}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            data-vaul-no-drag
            aria-label={UI_LABELS.MAP_PANEL.VIEW_ON_MAP}
            title={UI_LABELS.MAP_PANEL.VIEW_ON_MAP}
            className="shrink-0"
            onClick={onShowOnMap}
          >
            <MapPin aria-hidden />
          </Button>
        </CardContent>
      </Card>
    </div>
  </PanelSection>
);
