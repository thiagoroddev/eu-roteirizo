import { Card, CardContent } from "../../ui/card";
import { Progress } from "../../ui/progress";
import type { RouteProgress } from "../../../utils/routing/overview";
import { UI_LABELS } from "../../../constants/uiLabels";

const OVERVIEW = UI_LABELS.MAP_PANEL.ROTEIRO_OVERVIEW;

/**
 * RouteProgressCard - the overview's construction summary (TASK-RF-006.8): two
 * stat tiles — addresses and packages, committed/total (the old header HUD
 * "Faltando: X · Y" lives here now, flipped to done-of-total) — plus the
 * address-based progress bar (the bar's base is a decision, 09/07; the tiles
 * show both units). Structure + tokens only; Neon Flux dressing is REF-014's.
 *
 * Route distance/time totals are DELIBERATELY absent: they depend on the
 * traced path (RF-006.7) and the configurable estimates (RF-007) — showing
 * them now would be invented numbers.
 */
const StatTile = ({ label, done, total }: { label: string; done: number; total: number }) => (
  <div className="rounded-lg border border-input p-2 text-center">
    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="text-lg font-semibold tabular-nums">{OVERVIEW.STAT_COUNT(done, total)}</p>
  </div>
);

export const RouteProgressCard = ({ progress }: { progress: RouteProgress }) => (
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
      </CardContent>
    </Card>
  </div>
);
