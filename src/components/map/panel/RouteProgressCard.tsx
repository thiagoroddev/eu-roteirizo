import type { ReactNode } from "react";
import { Card, CardContent } from "../../ui/card";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { StatTile, DetailTile, BreakdownRow } from "../../ui/stat-tile";
import type { RouteProgress } from "../../../utils/routing/overview";
import type { PlannedRouteTotals } from "../../../utils/routing/estimates";
import { formatDurationMin, formatMeters } from "../../../utils/formatters";
import { UI_LABELS } from "../../../constants/uiLabels";

const OVERVIEW = UI_LABELS.MAP_PANEL.ROTEIRO_OVERVIEW;

/**
 * RouteProgressCard - the overview's construction summary (TASK-RF-006.8/.11,
 * re-shaped by RF-006.20): three stat tiles — addresses, packages and STOPS,
 * committed/total (the old header HUD "Faltando: X · Y" lives here now) — plus
 * three summary cards. The progress bar/percent lives only in the panel header
 * now (PanelModeBar); a second one in the card was redundant (smoke 18/07).
 *
 * The summary cards (RF-006.20): "Duração total" and "Distância total" each open
 * a "Detalhes" popup decomposing the total (duration → vehicle/walking/delivery,
 * the RF-007.1 split; distance → vehicle/on-foot), while "Comercial" is a plain
 * count of commercial-hours packages. The totals are `plannedRouteTotals`, the
 * SAME function the Sumário uses, so the two screens can never disagree.
 */
/** A summary card whose "Detalhes" button opens a breakdown popup. */
const DetailDialogCard = ({ label, value, title, children }: { label: string; value: string; title: string; children: ReactNode }) => (
  <Dialog>
    <div className="flex flex-col items-center rounded-lg border border-input p-2 text-center">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold tabular-nums">{value}</p>
      <DialogTrigger asChild>
        <button type="button" data-vaul-no-drag className="mt-1 text-[10px] font-medium text-primary hover:underline">
          {OVERVIEW.DETAILS_BUTTON}
        </button>
      </DialogTrigger>
    </div>
    <DialogContent className="max-w-xs">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <div className="mt-1">{children}</div>
    </DialogContent>
  </Dialog>
);

interface Props {
  progress: RouteProgress;
  /** Current sums (RF-006.11); null (no stops yet) hides the summary cards. */
  totals?: PlannedRouteTotals | null;
  /** Whether the distances came from the street graph (RF-006.7) — picks the caption. */
  viaStreets?: boolean;
  /** Commercial-hours package count among committed points (RF-006.20). */
  commercialPackages?: number;
}

export const RouteProgressCard = ({ progress, totals = null, viaStreets = false, commercialPackages = 0 }: Props) => (
  <div className="px-4 pb-2">
    <Card className="shadow-none">
      <CardContent className="p-3">
        <div className="grid grid-cols-3 gap-2">
          <StatTile label={OVERVIEW.STAT_ADDRESSES} value={OVERVIEW.STAT_COUNT(progress.addressesDone, progress.addressesTotal)} />
          <StatTile label={OVERVIEW.STAT_PACKAGES} value={OVERVIEW.STAT_COUNT(progress.packagesDone, progress.packagesTotal)} />
          <StatTile label={OVERVIEW.STAT_STOPS} value={String(progress.stopsCount)} />
        </div>
        {/* No in-card progress bar: the panel header (PanelModeBar) already shows
            the percent + thin bar; a second one here was redundant (smoke 18/07). */}
        {totals && (
          <div className="mt-3">
            <div className="grid grid-cols-3 gap-2">
              <DetailDialogCard label={OVERVIEW.CARD_DURATION} value={formatDurationMin(totals.timeTotalMin)} title={OVERVIEW.DURATION_DIALOG_TITLE}>
                <BreakdownRow label={OVERVIEW.DURATION_VEHICLE} value={formatDurationMin(totals.timeVehicleMin)} />
                <BreakdownRow label={OVERVIEW.DURATION_WALK} value={formatDurationMin(totals.timeWalkMin)} />
                <BreakdownRow label={OVERVIEW.DURATION_DELIVERY} value={formatDurationMin(totals.timeDeliveryMin)} />
              </DetailDialogCard>
              <DetailDialogCard label={OVERVIEW.CARD_DISTANCE} value={formatMeters(totals.distanceTotalKm * 1000)} title={OVERVIEW.DISTANCE_DIALOG_TITLE}>
                <BreakdownRow label={OVERVIEW.DISTANCE_VEHICLE} value={formatMeters(totals.distanceVehicleKm * 1000)} />
                <BreakdownRow label={OVERVIEW.DISTANCE_WALK} value={formatMeters(totals.distanceWalkKm * 1000)} />
              </DetailDialogCard>
              <DetailTile label={OVERVIEW.CARD_COMMERCIAL} value={String(commercialPackages)} />
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">{viaStreets ? OVERVIEW.TOTALS_NOTE_STREETS : OVERVIEW.TOTALS_NOTE}</p>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
);
