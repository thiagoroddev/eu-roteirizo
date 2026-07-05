import { Card } from "../ui/card";
import { UI_LABELS } from "../../constants/uiLabels";

/**
 * Totals of the user's planned Roteiro (fluxo §15.1). Vehicle legs run between
 * vehicle stops; walking legs are the circuits inside each stop.
 */
export interface PlannedRouteInfoData {
  vehicleStops: number;
  walkPoints: number;
  distanceVehicleKm: number;
  distanceWalkKm: number;
  distanceTotalKm: number;
  timeVehicleMin: number;
  timeWalkMin: number;
  timeTotalMin: number;
}

interface Props {
  /** Null while no Roteiro exists — the section simply doesn't render. */
  info: PlannedRouteInfoData | null;
}

const km = (value: number): string => `${value.toLocaleString("pt-BR", { maximumFractionDigits: 1 })} km`;
const min = (value: number): string => `${Math.round(value)} min`;

/**
 * PlannedRouteInfo - the "Info Meu Roteiro" section of the Sumário (RF-43):
 * totals of the planned Roteiro, deliberately SEPARATE from the raw manifest
 * numbers above it so Shopee's figures are never confused with ours.
 * Phase 1 renders nothing (no Roteiro exists yet); TASK-RF-007/008 feed it.
 */
export const PlannedRouteInfo = ({ info }: Props) => {
  if (!info) return null;
  return (
    <Card className="mb-6 p-5">
      <h3 className="mb-3 text-lg font-semibold text-primary">{UI_LABELS.ROTEIRO_INFO.TITLE}</h3>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <ul className="space-y-2">
          <li>
            <strong>{UI_LABELS.ROTEIRO_INFO.VEHICLE_STOPS}</strong> {info.vehicleStops}
          </li>
          <li>
            <strong>{UI_LABELS.ROTEIRO_INFO.WALK_POINTS}</strong> {info.walkPoints}
          </li>
          <li>
            <strong>{UI_LABELS.ROTEIRO_INFO.DISTANCE_VEHICLE}</strong> {km(info.distanceVehicleKm)}
          </li>
          <li>
            <strong>{UI_LABELS.ROTEIRO_INFO.DISTANCE_WALK}</strong> {km(info.distanceWalkKm)}
          </li>
        </ul>
        <ul className="space-y-2">
          <li>
            <strong>{UI_LABELS.ROTEIRO_INFO.DISTANCE_TOTAL}</strong> {km(info.distanceTotalKm)}
          </li>
          <li>
            <strong>{UI_LABELS.ROTEIRO_INFO.TIME_VEHICLE}</strong> {min(info.timeVehicleMin)}
          </li>
          <li>
            <strong>{UI_LABELS.ROTEIRO_INFO.TIME_WALK}</strong> {min(info.timeWalkMin)}
          </li>
          <li>
            <strong>{UI_LABELS.ROTEIRO_INFO.TIME_TOTAL}</strong> {min(info.timeTotalMin)}
          </li>
        </ul>
      </div>
    </Card>
  );
};
