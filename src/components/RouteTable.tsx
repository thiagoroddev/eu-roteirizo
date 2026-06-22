import React from "react";
import type { RowData } from "../types";
import { UI_LABELS } from "../constants/uiLabels";

interface Props {
  rows: RowData[]; // All deliveries for selected route
  selectedRoute: string | null; // Route name for modal title
  onClose: () => void; // Close modal handler
}

/**
 * Modal that displays the complete table of the selected route.
 *
 * @param rows List of filtered route records.
 * @param selectedRoute Currently selected route.
 * @param onClose Function that closes the modal.
 */

export const RouteTable: React.FC<Props> = ({ rows, selectedRoute, onClose }) => {
  /** Guard clause - don't render if no data */
  if (!rows || rows.length === 0) return null;

  /** Dynamically get column names from first row */
  const columns = Object.keys(rows[0]);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-6xl h-[98vh] rounded-xl overflow-hidden flex flex-col shadow-lg">
        <div className="flex items-center justify-between p-3 border-b">
          <h5 className="text-lg font-semibold">{UI_LABELS.ROUTE_TABLE.TITLE(selectedRoute || "")}</h5>
          <button className="px-3 py-1 text-sm rounded bg-primary hover:bg-primary/80 text-white shadow-sm" onClick={onClose}>
            {UI_LABELS.COMMON.CLOSE}
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-primary/90 text-white text-center">
              <tr>
                {columns.map((c) => (
                  <th key={c} className="px-3 py-2 border border-slate-200">
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-center align-middle">
              {/* Index key is safe here: this list is static — built once per route,
                  deterministically sorted in excelProcessor, and never reordered or
                  filtered in this component. No row field is guaranteed unique
                  (only Corridor Cage/Latitude/Longitude are mandatory, and they repeat). */}
              {rows.map((row, idx) => (
                <tr key={idx} className="odd:bg-slate-50">
                  {columns.map((col) => (
                    <td key={col} className="px-3 py-2 border border-slate-200">
                      {String(row[col] || UI_LABELS.COMMON.NO_DATA)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
