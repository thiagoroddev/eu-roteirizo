import type { PlannedRouteTotals } from "../../utils/routing/estimates";
import { UI_LABELS } from "../../constants/uiLabels";
import { formatDurationMin, formatMeters } from "../../utils/formatters";
import { StatTile } from "../ui/stat-tile";
import { FlowBar } from "./FlowBar";

const INFO = UI_LABELS.ROTEIRO_INFO;

/**
 * Totais do Roteiro planejado exibidos no Sumário. É exatamente o retorno de
 * `plannedRouteTotals` (antes havia uma duplicação estrutural do tipo).
 */
export type PlannedRouteInfoData = PlannedRouteTotals;

interface Props {
  info: PlannedRouteInfoData | null;
  /** Pacotes dentro do roteiro (soma dos pontos atribuídos). */
  packages?: number;
  /** Quantos desses pacotes são de horário comercial. */
  commercialPackages?: number;
}

/**
 * PlannedRouteInfo - a seção "Info Meu Roteiro" do Sumário (RF-43), redesenhada
 * na TASK-REF-017.
 *
 * Quatro stat-cards (Endereços/Pacotes/Paradas/Comercial — o mesmo vocabulário
 * do painel do mapa) e DUAS barras de fluxo: tempo (veículo/a pé/entregas) e
 * distância (veículo/a pé). As barras substituíram os cards de total: elas já
 * dão o total E a composição, então um card repetindo o número era ruído
 * (smoke 19/07).
 *
 * A fonte é `plannedRouteTotals` — a MESMA função do painel do mapa —, então as
 * duas telas nunca divergem.
 */
export const PlannedRouteInfo = ({ info, packages = 0, commercialPackages = 0 }: Props) => {
  if (!info) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <StatTile label={INFO.CARD_ADDRESSES} value={String(info.walkPoints)} />
        <StatTile label={INFO.CARD_PACKAGES} value={String(packages)} />
        <StatTile label={INFO.CARD_STOPS} value={String(info.vehicleStops)} />
        <StatTile label={INFO.CARD_COMMERCIAL} value={String(commercialPackages)} />
      </div>

      <FlowBar
        title={INFO.FLOW_TITLE}
        total={info.timeTotalMin}
        format={formatDurationMin}
        segments={[
          { key: "vehicle", label: INFO.FLOW_VEHICLE, value: info.timeVehicleMin, className: "bg-sky-500" },
          { key: "walk", label: INFO.FLOW_WALK, value: info.timeWalkMin, className: "bg-violet-500" },
          { key: "delivery", label: INFO.FLOW_DELIVERY, value: info.timeDeliveryMin, className: "bg-primary" },
        ]}
      />

      <FlowBar
        title={INFO.FLOW_DISTANCE_TITLE}
        total={info.distanceTotalKm}
        format={(km) => formatMeters(km * 1000)}
        segments={[
          { key: "vehicle", label: INFO.FLOW_VEHICLE, value: info.distanceVehicleKm, className: "bg-sky-500" },
          { key: "walk", label: INFO.FLOW_WALK, value: info.distanceWalkKm, className: "bg-violet-500" },
        ]}
      />
    </div>
  );
};
