import type { PlannedRouteTotals } from "../../utils/routing/estimates";
import { UI_LABELS } from "../../constants/uiLabels";
import { formatDurationMin, formatMeters } from "../../utils/formatters";
import { StatTile } from "../ui/stat-tile";
import { FlowBar } from "./FlowBar";

const INFO = UI_LABELS.ROTEIRO_INFO;
/** Mesmo par de legendas do painel do mapa (RouteProgressCard) — TASK-BG-014:
 *  reusado em vez de duplicado, para as duas telas nunca poderem discordar no
 *  texto do jeito que discordavam no número. */
const OVERVIEW = UI_LABELS.MAP_PANEL.ROTEIRO_OVERVIEW;

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
  /** Se `info` veio do grafo de ruas (RF-006.7) ou da reta — TASK-BG-014: a
   *  chamada em SummaryPage decide, então essa tela precisa declarar qual das
   *  duas ela está mostrando, igual ao painel do mapa. */
  viaStreets?: boolean;
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
 * A fonte é `plannedRouteTotals` — a MESMA função do painel do mapa —, mas até
 * a TASK-BG-014 o Sumário chamava sem os grafos de ruas (RF-006.7) enquanto o
 * mapa chamava COM eles: a função era a mesma, os argumentos não, e as duas
 * telas mostravam números diferentes para o mesmo roteiro. Agora `viaStreets`
 * vem de SummaryPage (que carrega o mesmo grafo cacheado que o mapa usa) e a
 * legenda abaixo das barras diz qual fonte gerou o número mostrado.
 */
export const PlannedRouteInfo = ({ info, packages = 0, commercialPackages = 0, viaStreets = false }: Props) => {
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

      <p className="text-[10px] text-muted-foreground">{viaStreets ? OVERVIEW.TOTALS_NOTE_STREETS : OVERVIEW.TOTALS_NOTE}</p>
    </div>
  );
};
