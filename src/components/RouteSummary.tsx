import React from "react";
import type { RowData } from "../types";
import { useRouteSummary } from "../hooks/useRouteSummary";
import { UI_LABELS } from "../constants/uiLabels";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

interface Props {
  rows: RowData[]; // All deliveries for selected route
  availableCols: string[] | null; // Available columns from Excel
  selectedRoute: string | null;
  vehicleType?: string | null;
  onViewMap: () => void; // Opens fullscreen map
  onShowTable: () => void; // Opens original table modal
  onShowSimpleTable: () => void; // Opens simplified table modal
  mapAvailable: boolean; // True if route has lat/lng coordinates
  isSingleRoute?: boolean; // Single-route mode: hide multi-route-only fields (Shift/ETA/Distance/Hub)
  extraActions?: React.ReactNode; // Extra buttons rendered with the actions (e.g. "Criar Roteiro" on the Sumário screen — RF-43)
}

/**=====================================================================================================================
 * RouteSummary - Summary card displaying key route statistics
 *
 * Shows:
 * - AT code, packages, stops, commercial addresses count
 * - Estimated time and distance
 * - Neighborhoods and city
 * - Action buttons: View Map, Simplified Table, Original Table
 *
 * Data is calculated by useRouteSummary hook
 *
 * @param {RowData[]} rows - All deliveries for selected route
 * @param {string[] | null} availableCols - Available columns from Excel file
 * @param {() => void} onViewMap - Callback to open fullscreen map modal
 * @param {() => void} onShowTable - Callback to open original table modal
 * @param {() => void} onShowSimpleTable - Callback to open simplified table modal
 * @param {boolean} mapAvailable - True if route has latitude and longitude coordinates
 * @returns {JSX.Element} The rendered RouteSummary component
 */

/** */
export const RouteSummary: React.FC<Props> = ({
  rows,
  availableCols,
  selectedRoute,
  vehicleType,
  onViewMap,
  onShowTable,
  onShowSimpleTable,
  mapAvailable,
  isSingleRoute = false,
  extraActions = null,
}) => {
  // Obtains all statistics using custom hook
  const { totalPacks, lastStop, time, distance, city, at, commerceCount, neighborhoods, shiftTime, dateRaw, hub } = useRouteSummary(rows, availableCols);

  return (
    <Card className="mb-6 overflow-hidden">
      {/* Route heading with vehicle type */}
      {selectedRoute && (
        <h2 className="text-xl text-primary-foreground font-semibold mb-5 text-center bg-primary/90 p-2 ">
          {UI_LABELS.ROUTE_SUMMARY.TITLE(selectedRoute)}
          {UI_LABELS.ROUTE_SUMMARY.VEHICLE_TYPE(vehicleType || UI_LABELS.COMMON.NO_DATA)}
        </h2>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-5">
        {/* Left column - AT, packages, stops, commercial count */}
        <div>
          <ul className="space-y-2">
            <li>
              <strong>{UI_LABELS.ROUTE_SUMMARY.AT}</strong> {at}
            </li>
            {/* Hub: coluna inexistente na rota única (RF-015) */}
            {!isSingleRoute && (
              <li>
                <strong>{UI_LABELS.ROUTE_SUMMARY.HUB}</strong> {hub}
              </li>
            )}
            <li>
              <strong>{UI_LABELS.ROUTE_SUMMARY.DATE_AT}</strong> {dateRaw}
            </li>
            {/* Turno (Shift Time): coluna inexistente na rota única (RF-015) */}
            {!isSingleRoute && (
              <li>
                <strong>{UI_LABELS.ROUTE_SUMMARY.SHIFT}</strong> {shiftTime}
              </li>
            )}

            <li title={UI_LABELS.ROUTE_SUMMARY.COMMERCIAL_TIME_TOOLTIP} className="flex items-center gap-1">
              <strong className="flex items-center gap-1">{UI_LABELS.ROUTE_SUMMARY.COMMERCIAL_TIME}:</strong>
              {commerceCount}
            </li>
          </ul>
        </div>

        {/* Right column - time, distance, neighborhoods, city */}
        <div>
          <ul className="space-y-2">
            <li>
              <strong>{UI_LABELS.ROUTE_SUMMARY.PACKAGES}</strong> {totalPacks}
            </li>

            <li>
              <strong>{UI_LABELS.ROUTE_SUMMARY.STOPS}</strong> {lastStop}
            </li>
            {/* Tempo/Distância estimados: colunas inexistentes na rota única (RF-015) */}
            {!isSingleRoute && (
              <li>
                <strong>{UI_LABELS.ROUTE_SUMMARY.ESTIMATED_TIME}</strong> {time}
              </li>
            )}

            {!isSingleRoute && (
              <li>
                <strong>{UI_LABELS.ROUTE_SUMMARY.ESTIMATED_DISTANCE}</strong> {distance}
              </li>
            )}

            <li>
              <strong>{UI_LABELS.ROUTE_SUMMARY.NEIGHBORHOODS}</strong> {neighborhoods}
            </li>
            <li>
              <strong>{UI_LABELS.ROUTE_SUMMARY.CITY}</strong> {city}
            </li>
          </ul>
        </div>
      </div>

      <div className="mt-6 flex justify-center flex-wrap gap-2 pb-2 m-4">
        {mapAvailable ? (
          <Button onClick={onViewMap}>{UI_LABELS.ROUTE_SUMMARY.VIEW_MAP}</Button>
        ) : (
          <Button variant="secondary" disabled>
            {UI_LABELS.ROUTE_SUMMARY.NO_COORDINATES}
          </Button>
        )}

        {extraActions}

        <Button variant="outline" onClick={onShowSimpleTable}>
          {UI_LABELS.ROUTE_SUMMARY.SIMPLE_TABLE}
        </Button>

        <Button variant="outline" onClick={onShowTable}>
          {UI_LABELS.ROUTE_SUMMARY.ORIGINAL_TABLE}
        </Button>
      </div>
    </Card>
  );
};
