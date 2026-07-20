import type { RowData } from "../../types";
import { useRouteSummary } from "../../hooks/useRouteSummary";
import { UI_LABELS } from "../../constants/uiLabels";
import { isMissingValue } from "../../utils/missingValue";
import { Card, CardContent } from "../ui/card";
import { StatTile } from "../ui/stat-tile";

const SUMMARY = UI_LABELS.ROUTE_SUMMARY;

interface Props {
  rows: RowData[];
  availableCols: string[] | null;
  /** Rota única (sem `Corridor Cage`): Hub/Turno/Tempo/Distância não existem (RF-015). */
  isSingleRoute?: boolean;
  /** Tipo de veículo planejado — dado do romaneio; some quando ausente. */
  vehicleType?: string | null;
}

/** Uma linha `rótulo · valor` do bloco de informações gerais (textos longos). */
const InfoRow = ({ label, value, title }: { label: string; value: string; title?: string }) => (
  <div className="flex items-start justify-between gap-4 border-b border-input py-2 last:border-b-0" title={title}>
    <span className="shrink-0 text-sm text-muted-foreground">{label}</span>
    <span className="min-w-0 text-right text-sm font-medium">{value}</span>
  </div>
);

/**
 * OriginalInfo - a seção "Info Original" do Sumário (TASK-REF-017), sucessora da
 * lista `rótulo: valor` do antigo RouteSummary.
 *
 * Duas camadas: **cards** para as métricas curtas (números que o entregador lê de
 * relance) e um bloco de **informações gerais** para os textuais/longos (AT pode
 * ter vários códigos; Bairros é uma string longa).
 *
 * Regra do humano: "mostrar todos os dados que tiver". Campo sem dado **não é
 * renderizado** (`isMissingValue`) — na rota única, que tem menos colunas, a tela
 * simplesmente encolhe em vez de exibir uma parede de "Sem dados".
 */
export const OriginalInfo = ({ rows, availableCols, isSingleRoute = false, vehicleType = null }: Props) => {
  const { totalPacks, lastStop, time, distance, city, at, commerceCount, neighborhoods, shiftTime, dateRaw, hub } = useRouteSummary(rows, availableCols);

  /** Métricas curtas → cards. Multi-only (tempo/distância) some na rota única. */
  const stats: { label: string; value: string; key: string; title?: string }[] = [
    { key: "packages", label: SUMMARY.CARD_PACKAGES, value: totalPacks },
    { key: "stops", label: SUMMARY.CARD_STOPS, value: lastStop },
    { key: "commercial", label: SUMMARY.CARD_COMMERCIAL, value: commerceCount, title: SUMMARY.COMMERCIAL_TIME_TOOLTIP },
    ...(isSingleRoute ? [] : [{ key: "time", label: SUMMARY.CARD_ESTIMATED_TIME, value: time }]),
    ...(isSingleRoute ? [] : [{ key: "distance", label: SUMMARY.CARD_ESTIMATED_DISTANCE, value: distance }]),
  ].filter((stat) => !isMissingValue(stat.value));

  /** Textuais/longos → linhas. Hub/Turno também são multi-only. */
  const infos: { label: string; value: string; key: string; title?: string }[] = [
    { key: "at", label: SUMMARY.AT, value: at },
    { key: "date", label: SUMMARY.DATE_AT, value: dateRaw },
    ...(isSingleRoute ? [] : [{ key: "hub", label: SUMMARY.HUB, value: hub }]),
    ...(isSingleRoute ? [] : [{ key: "shift", label: SUMMARY.SHIFT, value: shiftTime }]),
    { key: "vehicle", label: SUMMARY.VEHICLE, value: vehicleType ?? "" },
    { key: "neighborhoods", label: SUMMARY.NEIGHBORHOODS, value: neighborhoods },
    { key: "city", label: SUMMARY.CITY, value: city },
  ].filter((info) => !isMissingValue(info.value));

  return (
    <div className="space-y-4">
      {stats.length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {stats.map((stat) => (
            <StatTile key={stat.key} label={stat.label} value={stat.value} title={stat.title} />
          ))}
        </div>
      )}

      {infos.length > 0 && (
        <Card className="shadow-none">
          <CardContent className="p-4">
            <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{SUMMARY.GENERAL_INFO}</p>
            {infos.map((info) => (
              <InfoRow key={info.key} label={info.label} value={info.value} title={info.title} />
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
