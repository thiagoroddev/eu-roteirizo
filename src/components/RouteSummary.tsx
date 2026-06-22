import React from "react";
import type { RowData } from "../types";
import { useRouteSummary } from "../hooks/useRouteSummary";
import { UI_LABELS } from "../constants/uiLabels";

interface Props {
  rows: RowData[]; // All deliveries for selected route
  availableCols: string[] | null; // Available columns from Excel
  selectedRoute: string | null;
  vehicleType?: string | null;
  onViewMap: () => void; // Opens fullscreen map
  onShowTable: () => void; // Opens original table modal
  onShowSimpleTable: () => void; // Opens simplified table modal
  mapAvailable: boolean; // True if route has lat/lng coordinates
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
export const RouteSummary: React.FC<Props> = ({ rows, availableCols, selectedRoute, vehicleType, onViewMap, onShowTable, onShowSimpleTable, mapAvailable }) => {
  // Obtains all statistics using custom hook
  const { totalPacks, lastStop, time, distance, city, at, commerceCount, neighborhoods, correiosDeliveryCount, shiftTime, dateRaw, hub } = useRouteSummary(rows, availableCols);

  return (
    <div className="bg-white rounded-lg shadow-md shadow-primary/40 mb-6 overflow-hidden">
      {/* Route heading with vehicle type */}
      {selectedRoute && (
        <h2 className="text-xl text-white font-semibold mb-5 text-center bg-primary/90 p-2 ">
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
            <li>
              <strong>{UI_LABELS.ROUTE_SUMMARY.HUB}</strong> {hub}
            </li>
            <li>
              <strong>{UI_LABELS.ROUTE_SUMMARY.DATE_AT}</strong> {dateRaw}
            </li>
            <li>
              <strong>{UI_LABELS.ROUTE_SUMMARY.SHIFT}</strong> {shiftTime}
            </li>

            <li title={UI_LABELS.ROUTE_SUMMARY.COMMERCIAL_TIME_TOOLTIP} className="flex items-center gap-1">
              <strong className="flex items-center gap-1">{UI_LABELS.ROUTE_SUMMARY.COMMERCIAL_TIME}:</strong>
              {commerceCount}
            </li>
            <li title={UI_LABELS.ROUTE_SUMMARY.CORREIOS_NO_ENTRY_TOOLTIP} className="flex items-center gap-1">
              <strong>{UI_LABELS.ROUTE_SUMMARY.CORREIOS_NO_ENTRY}</strong> {correiosDeliveryCount}
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
            <li>
              <strong>{UI_LABELS.ROUTE_SUMMARY.ESTIMATED_TIME}</strong> {time}
            </li>

            <li>
              <strong>{UI_LABELS.ROUTE_SUMMARY.ESTIMATED_DISTANCE}</strong> {distance}
            </li>

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
          <button onClick={onViewMap} className="p-2 bg-primary/90 rounded border border-primary text-white hover:bg-primary shadow-md hover:border-white hover:shadow-primary transition ">
            {UI_LABELS.ROUTE_SUMMARY.VIEW_MAP}
          </button>
        ) : (
          <button className="p-2 rounded border border-gray-300 text-gray-500 bg-gray-100 cursor-not-allowed" disabled>
            {UI_LABELS.ROUTE_SUMMARY.NO_COORDINATES}
          </button>
        )}

        <button onClick={onShowSimpleTable} type="button" className="p-2 rounded border border-primary text-primary shadow-md hover:border-white hover:shadow-primary transition  ">
          {UI_LABELS.ROUTE_SUMMARY.SIMPLE_TABLE}
        </button>

        <button onClick={onShowTable} className="p-2 rounded border border-primary text-primary shadow-md hover:border-white hover:shadow-primary transition ">
          {UI_LABELS.ROUTE_SUMMARY.ORIGINAL_TABLE}
        </button>
      </div>
    </div>
  );
};
