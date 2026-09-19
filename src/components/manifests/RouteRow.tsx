import { MapPin, Package, Clock, Truck, Footprints, ChevronRight, Navigation, CircleCheck, CircleDashed, CircleDot, CirclePlay } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { UI_LABELS } from "../../constants/uiLabels";
import { formatDurationMin, formatMeters } from "../../utils/formatters";
import { getRoteiroPresentationFromSummary } from "../../utils/routing/status";
import type { ManifestRouteMeta } from "../../types/manifest";
import type { RoteiroSummary } from "../../types/routing";

export interface RouteRowProps {
  route: ManifestRouteMeta;
  hasRoteiro?: boolean;
  summary?: RoteiroSummary | null;
  onOpen: (route: ManifestRouteMeta) => void;
}

const STATE_ICONS = {
  none: CircleDashed,
  building: CircleDot,
  executing: CirclePlay,
  finished: CircleCheck,
} as const;

/**
 * RouteRow - Individual route row in saved manifests list (TASK-RF-048 / Stitch UI).
 * Displays route name, AT code (4-char suffix), primary neighborhood (RF-62),
 * distinct state icons (none: dashed, building: dot, executing: play, finished: check),
 * package count, and mesh route summary (stops, duration, vehicle km, walk km) when available.
 */
export const RouteRow = ({ route, hasRoteiro = false, summary, onOpen }: RouteRowProps) => {
  const presentation = getRoteiroPresentationFromSummary(hasRoteiro, summary);
  const StateIcon = STATE_ICONS[presentation.kind];
  const shortAt = route.at ? route.at.slice(-4) : undefined;

  return (
    <button
      type="button"
      onClick={() => onOpen(route)}
      aria-label={UI_LABELS.ROUTES_PAGE.CHIP_ARIA(route.name)}
      className={cn(
        "group flex w-full flex-col gap-2 rounded-xl border border-border/70 bg-card p-3 text-left transition-colors",
        "hover:border-primary/50 hover:bg-accent/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <StateIcon className={cn("h-4 w-4 shrink-0", presentation.colorClass)} aria-hidden="true" />
          <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{route.name}</span>
          {shortAt && (
            <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground" title={route.at ? `Código AT: ${route.at}` : undefined}>
              {shortAt}
            </span>
          )}
          {route.neighborhood && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 text-primary/70 shrink-0" aria-hidden="true" />
              <span>{route.neighborhood}</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <Badge
            variant={presentation.badgeVariant}
            className={cn(
              "text-[11px] font-medium leading-none px-2 py-0.5",
              presentation.kind === "building" && "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
              presentation.kind === "executing" && "bg-primary/15 text-primary border-primary/30",
              presentation.kind === "finished" && "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30"
            )}
          >
            {presentation.badgeLabel}
          </Badge>
          <ChevronRight className="h-4 w-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" aria-hidden="true" />
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Package className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          <span>{UI_LABELS.ROUTES_PAGE.PACKAGES_LABEL(route.rowCount)}</span>
        </span>

        {summary && (
          <>
            <span className="inline-flex items-center gap-1">
              <Navigation className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{UI_LABELS.ROUTES_PAGE.STOPS_LABEL(summary.stops)}</span>
            </span>

            {summary.totalMinutes > 0 && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{formatDurationMin(summary.totalMinutes)}</span>
              </span>
            )}

            {summary.vehicleMeters > 0 && (
              <span className="inline-flex items-center gap-1">
                <Truck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{formatMeters(summary.vehicleMeters)}</span>
              </span>
            )}

            {summary.walkMeters > 0 && (
              <span className="inline-flex items-center gap-1">
                <Footprints className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <span>{formatMeters(summary.walkMeters)} a pé</span>
              </span>
            )}
          </>
        )}
      </div>
    </button>
  );
};
