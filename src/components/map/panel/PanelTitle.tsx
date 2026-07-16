import { Badge } from "../../ui/badge";
import { cn } from "@/lib/utils";
import { UI_LABELS } from "../../../constants/uiLabels";

/**
 * PanelTitle - identity row of the MapPanel header (design doc §2/§3, rev.
 * 07/07): "Parada {Stop} — {bairros}" + zipcode line + the MetricsRow chips
 * ("N endereços · N pacotes"; walk time/distance arrives with RF-007). NO
 * address here — the selected address has its own card in the header.
 */
export interface PanelMetric {
  label: string;
}

interface Props {
  /** Stop number from the spreadsheet; null (no Stop column) hides the prefix. */
  stopNumber: string | null;
  /** Stop-level place info (rev. 07/07 — moved out of the address detail). */
  neighborhoods?: string[];
  zipcodes?: string[];
  metrics: PanelMetric[];
  /** Extra spacing hooks for list usages (overview rows — rev. 15/07). */
  className?: string;
}

/** Exported since RF-006.4.2: the roteiro draft header reuses the SAME chips. */
export const PanelMetricsRow = ({ metrics }: Pick<Props, "metrics">) => (
  <div className="mt-1.5 flex flex-wrap gap-1">
    {metrics.map((metric) => (
      // Compact type: up to 4 chips must fit ONE line on mobile (rev. 07/07).
      <Badge key={metric.label} variant="secondary" className="px-1.5 py-0 text-[10px] font-medium">
        {metric.label}
      </Badge>
    ))}
  </div>
);

export const PanelTitle = ({ stopNumber, neighborhoods = [], zipcodes = [], metrics, className }: Props) => {
  const title = stopNumber !== null ? `${UI_LABELS.MAP_PANEL.STOP_PREFIX} ${stopNumber}` : UI_LABELS.MAP_PANEL.NO_STOP;
  // Place on ONE line: "Parada 31 — Botafogo (22290-160)" (rev. 07/07).
  const place = [neighborhoods.join(", "), zipcodes.length > 0 ? `(${zipcodes.join(", ")})` : ""].filter(Boolean).join(" ");
  return (
    <div className={cn("px-4 pb-2", className)}>
      <p className="truncate text-sm font-semibold">{place ? `${title} — ${place}` : title}</p>
      {metrics.length > 0 && <PanelMetricsRow metrics={metrics} />}
    </div>
  );
};
