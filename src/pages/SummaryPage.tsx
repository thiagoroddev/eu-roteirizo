import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";

import { RouteSummary } from "../components/RouteSummary";
import { RouteTable } from "../components/RouteTable";
import { RouteSimpleTable } from "../components/RouteSimpleTable";
import { PlannedRouteInfo } from "../components/summary/PlannedRouteInfo";
import { Button } from "../components/ui/button";
import { MODE_QUERY_PARAM, MODE_QUERY_ROTEIRO } from "../components/map/MapModeToggle";
import { useManifestFromUrl } from "../hooks/useManifestFromUrl";
import { getVehicleType } from "../utils/formatters";
import { COLUMN_NAMES } from "../constants";
import { UI_LABELS } from "../constants/uiLabels";

/**
 * SummaryPage - the Sumário focus screen (TASK-RF-022.4, fluxo §15.1,
 * `4-detalhes-sumario.png`). Reached from a route chip in the Rotas tab via
 * `/sumario?romaneio={id}&rota={name}`; the bottom nav is hidden (FocusShell)
 * and the header back arrow returns to Rotas.
 *
 * Reuses the same RouteSummary card as the legacy inline flow — no summary
 * info is lost — plus the RF-43 buttons: "Ver Original" navigates to the map
 * focus screen (`/mapa`, TASK-RF-022.5) and "Criar Roteiro" opens the same
 * screen in the Meu roteiro mode (`&modo=roteiro` — TASK-RF-006.2; it becomes
 * "Ver Meu Roteiro" once RF-008 persists roteiros). The "Info Meu Roteiro"
 * section renders only when a Roteiro exists (RF-007/008 feed it).
 */
function SummaryPage() {
  const navigate = useNavigate();
  const { manifestId, routeName, routes, loading, error, availableCols, isSingleRoute, currentRows } = useManifestFromUrl();

  const [showTable, setShowTable] = useState(false);
  const [showSimpleTable, setShowSimpleTable] = useState(false);

  // A malformed URL has nothing to show — go back to the saved list.
  if (!manifestId || !routeName) return <Navigate to="/rotas" replace />;

  const mapAvailable = !!(availableCols?.includes(COLUMN_NAMES.LATITUDE) && availableCols?.includes(COLUMN_NAMES.LONGITUDE));
  const vehicleType = getVehicleType(currentRows, availableCols);

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
          <RouteSummary
            rows={currentRows}
            availableCols={availableCols}
            selectedRoute={routeName}
            vehicleType={vehicleType}
            isSingleRoute={isSingleRoute}
            onViewMap={() => navigate(`/mapa?romaneio=${encodeURIComponent(manifestId)}&rota=${encodeURIComponent(routeName)}`)}
            onShowTable={() => setShowTable(true)}
            onShowSimpleTable={() => setShowSimpleTable(true)}
            mapAvailable={mapAvailable}
            extraActions={
              <Button
                variant="outline"
                disabled={!mapAvailable}
                title={mapAvailable ? undefined : UI_LABELS.ROUTE_SUMMARY.NO_COORDINATES}
                onClick={() => navigate(`/mapa?romaneio=${encodeURIComponent(manifestId)}&rota=${encodeURIComponent(routeName)}&${MODE_QUERY_PARAM}=${MODE_QUERY_ROTEIRO}`)}
              >
                {UI_LABELS.ROUTE_SUMMARY.CREATE_ROTEIRO}
              </Button>
            }
          />

          {/* "Info Meu Roteiro" (RF-43): appears once a Roteiro exists — TASK-RF-007/008 feed it. */}
          <PlannedRouteInfo info={null} />

          {showTable && <RouteTable selectedRoute={routeName} rows={currentRows} onClose={() => setShowTable(false)} />}
          {showSimpleTable && <RouteSimpleTable rows={currentRows} selectedRoute={routeName} onClose={() => setShowSimpleTable(false)} />}
        </>
      )}
    </div>
  );
}

export default SummaryPage;
