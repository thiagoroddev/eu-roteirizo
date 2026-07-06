import { Badge } from "../../ui/badge";
import { UI_LABELS } from "../../../constants/uiLabels";

/**
 * PanelTitle - identity row of the MapPanel header (design doc §2/§3):
 * "Parada {Stop}" + representative address, with the MetricsRow chips below
 * ("N endereços · N pacotes"; leg time/distance arrives with RF-007).
 */
export interface PanelMetric {
  label: string;
}

interface Props {
  /** Stop number from the spreadsheet; null (no Stop column) hides the prefix. */
  stopNumber: string | null;
  /** Representative address of the stop (or the focused address, later modes). */
  address: string;
  metrics: PanelMetric[];
}

const MetricsRow = ({ metrics }: Pick<Props, "metrics">) => (
  <div className="mt-1.5 flex flex-wrap gap-1.5">
    {metrics.map((metric) => (
      <Badge key={metric.label} variant="secondary">
        {metric.label}
      </Badge>
    ))}
  </div>
);

export const PanelTitle = ({ stopNumber, address, metrics }: Props) => (
  <div className="px-4 pb-3">
    <p className="text-sm font-semibold">{stopNumber !== null ? `${UI_LABELS.MAP_PANEL.STOP_PREFIX} ${stopNumber}` : UI_LABELS.MAP_PANEL.NO_STOP}</p>
    <p className="truncate text-xs text-muted-foreground">{address}</p>
    {metrics.length > 0 && <MetricsRow metrics={metrics} />}
  </div>
);
