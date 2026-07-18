import { Card, CardContent } from "../../ui/card";
import { Progress } from "../../ui/progress";
import type { RouteProgress } from "../../../utils/routing/overview";
import type { PlannedRouteTotals } from "../../../utils/routing/estimates";
import { formatDurationMin, formatMeters } from "../../../utils/formatters";
import { UI_LABELS } from "../../../constants/uiLabels";

const OVERVIEW = UI_LABELS.MAP_PANEL.ROTEIRO_OVERVIEW;

/**
 * RouteProgressCard - the overview's construction summary (TASK-RF-006.8): two
 * stat tiles — addresses and packages, committed/total (the old header HUD
 * "Faltando: X · Y" lives here now, flipped to done-of-total) — plus the
 * address-based progress bar (the bar's base is a decision, 09/07; the tiles
 * show both units). Structure + tokens only; Neon Flux dressing is REF-014's.
 *
 * Since TASK-RF-006.11 the "Detalhes" subsection shows the CURRENT total sums
 * (decision 12/07, superseding .8's deferral): estimated route duration
 * (vehicle + walking + per-delivery handover), total distance and walking
 * distance — `plannedRouteTotals`, the same function the Sumário uses, so the
 * two screens can never disagree. Honest numbers: vehicle legs are straight
 * lines until RF-006.7 traces streets; RF-007 makes the speeds configurable.
 */
const StatTile = ({ label, done, total }: { label: string; done: number; total: number }) => (
  <div className="rounded-lg border border-input p-2 text-center">
    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="text-lg font-semibold tabular-nums">{OVERVIEW.STAT_COUNT(done, total)}</p>
  </div>
);

const DetailTile = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-input p-2 text-center">
    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="text-sm font-semibold tabular-nums">{value}</p>
  </div>
);

interface Props {
  progress: RouteProgress;
  /** Current sums (RF-006.11); null (no stops yet) hides the subsection. */
  totals?: PlannedRouteTotals | null;
  /** Whether the distances came from the street graph (RF-006.7) — picks the caption. */
  viaStreets?: boolean;
}

export const RouteProgressCard = ({ progress, totals = null, viaStreets = false }: Props) => (
  <div className="px-4 pb-2">
    <Card className="shadow-none">
      <CardContent className="p-3">
        <div className="grid grid-cols-2 gap-2">
          <StatTile label={OVERVIEW.STAT_ADDRESSES} done={progress.addressesDone} total={progress.addressesTotal} />
          <StatTile label={OVERVIEW.STAT_PACKAGES} done={progress.packagesDone} total={progress.packagesTotal} />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <Progress value={progress.ratio} label={OVERVIEW.PROGRESS_ARIA} className="flex-1" />
          <span className="text-xs font-semibold tabular-nums">{OVERVIEW.PERCENT(progress.ratio)}</span>
        </div>
        {totals && (
          <div className="mt-3">
            <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{OVERVIEW.SECTION_DETAILS}</p>
            <div className="mt-1 grid grid-cols-3 gap-2">
              <DetailTile label={OVERVIEW.TOTAL_TIME} value={formatDurationMin(totals.timeTotalMin)} />
              <DetailTile label={OVERVIEW.TOTAL_DISTANCE} value={formatMeters(totals.distanceTotalKm * 1000)} />
              <DetailTile label={OVERVIEW.WALK_DISTANCE} value={formatMeters(totals.distanceWalkKm * 1000)} />
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">{viaStreets ? OVERVIEW.TOTALS_NOTE_STREETS : OVERVIEW.TOTALS_NOTE}</p>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
);
