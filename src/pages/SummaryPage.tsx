import { useEffect, useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { RouteTable } from "../components/RouteTable";
import { RouteSimpleTable } from "../components/RouteSimpleTable";
import { OriginalInfo } from "../components/summary/OriginalInfo";
import { PlannedRouteInfo } from "../components/summary/PlannedRouteInfo";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { MapModeToggle, MODE_QUERY_PARAM, MODE_QUERY_ROTEIRO, type MapMode } from "../components/map/MapModeToggle";
import { useManifestFromUrl } from "../hooks/useManifestFromUrl";
import { useDeliverySettings } from "../contexts/DeliverySettingsContext";
import { getRoteiro } from "../services/routeStorage";
import { buildDeliveryPoints } from "../utils/routing/points";
import { plannedRouteTotals } from "../utils/routing/estimates";
import { plannedRouteStatus, type RoteiroStatus } from "../utils/routing/status";
import { assignedPointIds } from "../utils/routing/selectors";
import { packagesByTypeFromPoints } from "../utils/markers/roteiroModels";
import { getVehicleType } from "../utils/formatters";
import type { RowData } from "../types";
import type { PlannedRoute } from "../types/routing";
import { COLUMN_NAMES } from "../constants";
import { UI_LABELS } from "../constants/uiLabels";

/**
 * SummaryPage - the Sumário focus screen (TASK-RF-022.4, fluxo §15.1,
 * `4-detalhes-sumario.png`). Reached from a route chip in the Rotas tab via
 * `/sumario?romaneio={id}&rota={name}`; the bottom nav is hidden (FocusShell)
 * and the header back arrow returns to Rotas.
 *
 * Redesenhada na TASK-REF-017: duas seções — **Info Original** (dados do
 * romaneio, `OriginalInfo`) e **Info Meu Roteiro** (totais do roteiro salvo,
 * `PlannedRouteInfo`) — alternadas pelo MESMO toggle do mapa. Abre em "Meu
 * Roteiro" quando a rota já tem roteiro; sem roteiro o segmento fica desabilitado
 * e o CTA "Criar Roteiro" convida. "Ver no Mapa" SEGUE o toggle (leva
 * `&modo=roteiro` — TASK-RF-006.2 — quando se está vendo o roteiro).
 */
/** Texto do badge de estado (REF-017 — vocabulário do humano 19/07). */
const statusLabel = (status: RoteiroStatus): string => {
  if (status.kind === "building") return UI_LABELS.ROTEIRO_INFO.STATUS_BUILDING;
  if (status.kind === "finished") return UI_LABELS.ROTEIRO_INFO.STATUS_FINISHED;
  return UI_LABELS.ROTEIRO_INFO.STATUS_EXECUTING(status.deliveredPercent);
};

function SummaryPage() {
  const navigate = useNavigate();
  const { manifestId, routeName, routes, loading, error, availableCols, isSingleRoute, currentRows } = useManifestFromUrl();
  const { settings: deliverySettings } = useDeliverySettings();

  const [showTable, setShowTable] = useState(false);
  const [showSimpleTable, setShowSimpleTable] = useState(false);

  /** The saved roteiro of THIS route (RF-008) — adapts the button and feeds
      the "Info Meu Roteiro" section. Null while loading or none saved. */
  const [savedRoteiro, setSavedRoteiro] = useState<PlannedRoute | null>(null);
  useEffect(() => {
    if (!manifestId || !routeName) return;
    let cancelled = false;
    void getRoteiro(manifestId, routeName).then((route) => {
      if (!cancelled) setSavedRoteiro(route);
    });
    return () => {
      cancelled = true;
    };
  }, [manifestId, routeName]);

  /** Coarse totals (straight-line vehicle legs + walk circuits) — RF-006.7/007
      refine them; the section's shape stays. */
  const roteiroInfo = useMemo(() => {
    if (!savedRoteiro || savedRoteiro.stops.length === 0) return null;
    // Delivery times come from the GLOBAL preference (RF-007.2), not the stored route.
    return plannedRouteTotals({ ...savedRoteiro, config: { ...savedRoteiro.config, ...deliverySettings } }, buildDeliveryPoints(currentRows));
  }, [savedRoteiro, currentRows, deliverySettings]);

  /** Seção visível (REF-017). `null` = o usuário ainda não escolheu → segue o
      dado: abre em "Meu Roteiro" quando a rota já tem roteiro salvo. Como o
      `savedRoteiro` chega assíncrono, derivar (em vez de efeito) evita o flash. */
  const [pickedMode, setPickedMode] = useState<MapMode | null>(null);
  const infoMode: MapMode = pickedMode ?? (savedRoteiro ? "roteiro" : "original");

  /** Estado do roteiro (rascunho × completo) e quantos pacotes são comerciais
      DENTRO dele — ambos derivados dos pontos do romaneio atual (REF-017). */
  const roteiroFacts = useMemo(() => {
    if (!savedRoteiro) return null;
    const points = buildDeliveryPoints(currentRows);
    const assigned = assignedPointIds(savedRoteiro.stops);
    const committed = points.filter((point) => assigned.has(point.id));
    return {
      // `deliveredRatio` fica de fora até a RF-009 registrar entregas concluídas.
      status: plannedRouteStatus(savedRoteiro, points),
      packages: committed.reduce((sum, point) => sum + point.packageCount, 0),
      commercialPackages: packagesByTypeFromPoints(committed).commercial,
    };
  }, [savedRoteiro, currentRows]);

  /** Linhas ordenadas pela sequência do roteiro planejado (ordem das paradas e entregas). */
  const roteiroRows = useMemo(() => {
    if (!savedRoteiro || savedRoteiro.stops.length === 0) return currentRows;
    const points = buildDeliveryPoints(currentRows);
    const pointMap = new Map(points.map((p) => [p.id, p]));
    const sortedStops = [...savedRoteiro.stops].sort((a, b) => a.order - b.order);
    const result: RowData[] = [];
    let seq = 1;
    for (const stop of sortedStops) {
      for (const pid of stop.pointIds) {
        const pt = pointMap.get(pid);
        if (!pt) continue;
        for (const pkg of pt.packages) {
          result.push({
            ...pkg.rawData,
            [COLUMN_NAMES.STOP]: stop.order,
            [COLUMN_NAMES.SEQUENCE]: seq++,
          });
        }
      }
    }
    return result;
  }, [savedRoteiro, currentRows]);

  const displayedSimpleRows = infoMode === "roteiro" ? roteiroRows : currentRows;

  // A malformed URL has nothing to show — go back to the saved list.
  if (!manifestId || !routeName) return <Navigate to="/rotas" replace />;

  const mapAvailable = !!(availableCols?.includes(COLUMN_NAMES.LATITUDE) && availableCols?.includes(COLUMN_NAMES.LONGITUDE));
  const vehicleType = getVehicleType(currentRows, availableCols);
  /** Link do mapa; `roteiro` decide se abre em Meu roteiro (`&modo=roteiro`). */
  const mapHref = (roteiro: boolean): string => `/mapa?romaneio=${encodeURIComponent(manifestId)}&rota=${encodeURIComponent(routeName)}${roteiro ? `&${MODE_QUERY_PARAM}=${MODE_QUERY_ROTEIRO}` : ""}`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-4">
      {loading && (
        <div className="flex items-center justify-center gap-2 py-10 text-primary">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" aria-hidden />
          <span className="text-sm">{UI_LABELS.FILE_UPLOADER.LOADING}</span>
        </div>
      )}

      {error && <div className="m-2 rounded-md border border-destructive bg-destructive/10 p-3 text-center font-semibold text-destructive">{error}</div>}

      {!loading && !error && routes && (
        <>
          {/* Identidade: nome da rota + ESTADO do roteiro (smoke 19/07 — este era
              o lugar certo; antes vazava um "Sem dados" do tipo de veículo). */}
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <h2 className="text-lg font-semibold">{routeName}</h2>
            {roteiroFacts ? (
              <>
                <Badge variant={roteiroFacts.status.kind === "building" ? "secondary" : "default"}>{statusLabel(roteiroFacts.status)}</Badge>
                {roteiroFacts.status.kind === "building" && (
                  <span className="text-xs text-muted-foreground">{UI_LABELS.ROTEIRO_INFO.STATUS_COVERAGE(roteiroFacts.status.assignedAddresses, roteiroFacts.status.totalAddresses)}</span>
                )}
              </>
            ) : (
              <Badge variant="outline">{UI_LABELS.ROTEIRO_INFO.STATUS_NONE}</Badge>
            )}
          </div>

          {/* Toggle Info Original × Info Meu Roteiro (REF-017) — o MESMO controle
              do mapa, com textos próprios. Desabilita o roteiro quando não há. */}
          <div className="mb-4 flex justify-center">
            <MapModeToggle
              mode={infoMode}
              onModeChange={setPickedMode}
              roteiroEnabled={savedRoteiro !== null}
              originalLabel={UI_LABELS.ROUTE_SUMMARY.SECTION_ORIGINAL}
              roteiroLabel={UI_LABELS.ROUTE_SUMMARY.SECTION_ROTEIRO}
              ariaLabel={UI_LABELS.ROUTE_SUMMARY.TOGGLE_ARIA}
              disabledHint={UI_LABELS.ROUTE_SUMMARY.NO_ROTEIRO_YET}
            />
          </div>

          {infoMode === "roteiro" ? (
            <PlannedRouteInfo info={roteiroInfo} packages={roteiroFacts?.packages ?? 0} commercialPackages={roteiroFacts?.commercialPackages ?? 0} />
          ) : (
            <OriginalInfo rows={currentRows} availableCols={availableCols} isSingleRoute={isSingleRoute} vehicleType={vehicleType} />
          )}

          <div className="mt-6 flex flex-wrap justify-center gap-2">
            {/* "Ver no Mapa" SEGUE o toggle (REF-017): leva ao modo que está sendo visto. */}
            <Button disabled={!mapAvailable} title={mapAvailable ? undefined : UI_LABELS.ROUTE_SUMMARY.NO_COORDINATES} onClick={() => navigate(mapHref(infoMode === "roteiro"))}>
              {mapAvailable ? UI_LABELS.ROUTE_SUMMARY.VIEW_ON_MAP : UI_LABELS.ROUTE_SUMMARY.NO_COORDINATES}
            </Button>

            {/* Sem roteiro, o CTA de criação é o convite (o segmento fica desabilitado). */}
            {!savedRoteiro && (
              <Button variant="outline" disabled={!mapAvailable} title={mapAvailable ? undefined : UI_LABELS.ROUTE_SUMMARY.NO_COORDINATES} onClick={() => navigate(mapHref(true))}>
                {UI_LABELS.ROUTE_SUMMARY.CREATE_ROTEIRO}
              </Button>
            )}

            {infoMode === "roteiro" && (
              <Button variant="outline" onClick={() => setShowSimpleTable(true)}>
                {UI_LABELS.ROUTE_SUMMARY.ROTEIRO_TABLE}
              </Button>
            )}
            {infoMode === "original" && (
              <Button variant="outline" onClick={() => setShowTable(true)}>
                {UI_LABELS.ROUTE_SUMMARY.ORIGINAL_TABLE}
              </Button>
            )}
          </div>

          {showTable && <RouteTable selectedRoute={routeName} rows={currentRows} onClose={() => setShowTable(false)} />}
          {showSimpleTable && <RouteSimpleTable rows={displayedSimpleRows} selectedRoute={routeName} onClose={() => setShowSimpleTable(false)} />}
        </>
      )}
    </div>
  );
}

export default SummaryPage;
