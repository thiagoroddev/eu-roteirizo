import React from "react";
import type { RowData } from "../types";
import { COLUMN_NAMES } from "../constants";
import { UI_LABELS } from "../constants/uiLabels";
import { getCommercialDisplayStatus, resolveLocationType } from "../utils/inferLocationType";
import { getCorreiosDeliveryStatus } from "../utils/correiosDelivery";
import { formatDeliveryLabel } from "../utils/formatters";

/**
 * Simplified modal that displays essential route information.
 *
 * Provides:
 * - Colors to differentiate Commercial and Residential Location
 * - Post Office delivery status
 * - ZIP code, address and neighborhood
 *
 * Completely secure against missing data: any empty field becomes "No data" (from constants).
 */

/**
 * Defines the shape of the properties (props) passed to this component.
 * It ensures we receive the correct data types.
 */
interface Props {
  /** Array of data to be displayed */
  rows: RowData[];
  /** The name of the route (for the title) */
  selectedRoute: string | null;
  /** Function to call when the "Close" button is clicked */
  onClose: () => void;
}

/** Defines the structure for our table columns configuration. */
interface ColumnDef {
  /** The property name in the data object (e.g., "Zipcode") */
  key: string;
  /** The text header displayed to the user (e.g., "CEP") */
  label: string;
}

// Internal constant for the virtual column key (not present in Excel)
const VIRTUAL_COLUMN_DELIVERY_CORREIOS = "DeliveryStatusCorreios";

// ========================================
// HELPER FUNCTIONS (extracted for cleaner component)
// ========================================

/** Returns CSS classes for commercial/residential status badges */
const getCommercialBadgeClasses = (status: string): string => {
  switch (status) {
    case UI_LABELS.COMMON.YES:
      return "bg-yellow-200 text-yellow-900";
    case UI_LABELS.COMMON.NO:
      return "bg-blue-200 text-blue-900";
    case UI_LABELS.COMMON.INDISTINCT:
    default:
      return "bg-slate-200 text-slate-700";
  }
};

/** Returns CSS classes for Correios delivery badges */
const getCorreiosBadgeClasses = (status: string): string => {
  switch (status) {
    case UI_LABELS.COMMON.YES:
      return "bg-green-200 text-green-900";
    case UI_LABELS.COMMON.NO:
      return "bg-red-200 text-red-900";
    default:
      return "bg-slate-200 text-slate-700";
  }
};

/** Renders a badge with label and color */
const Badge: React.FC<{ label: string; colorClasses: string }> = ({ label, colorClasses }) => (
  <div className="flex justify-center">
    <span className={`inline-flex items-center justify-center px-3 py-1 rounded-full whitespace-nowrap ${colorClasses}`}>{label}</span>
  </div>
);

/** Renders commercial status cell */
const renderCommercialStatus = (row: RowData): JSX.Element => {
  const resolvedType = resolveLocationType(row);
  const displayLabel = getCommercialDisplayStatus(resolvedType);
  return <Badge label={displayLabel} colorClasses={getCommercialBadgeClasses(displayLabel)} />;
};

/** Renders Correios delivery status cell */
const renderCorreiosStatus = (row: RowData): JSX.Element => {
  const status = getCorreiosDeliveryStatus(row[COLUMN_NAMES.ZIPCODE]);
  const displayLabel = formatDeliveryLabel(status);
  return <Badge label={displayLabel} colorClasses={getCorreiosBadgeClasses(displayLabel)} />;
};

/** Main cell content renderer - switches based on column type */
const renderCellContent = (colKey: string, row: RowData): React.ReactNode => {
  switch (colKey) {
    case COLUMN_NAMES.LOCATION_TYPE:
      return renderCommercialStatus(row);
    case VIRTUAL_COLUMN_DELIVERY_CORREIOS:
      return renderCorreiosStatus(row);
    default:
      return String(row[colKey] || UI_LABELS.COMMON.NO_DATA);
  }
};

// ========================================
// COMPONENT
// ========================================

/** Table columns configuration */
const COLUMNS: ColumnDef[] = [
  { key: COLUMN_NAMES.SEQUENCE, label: UI_LABELS.ROUTE_SIMPLE_TABLE.SEQUENCE },
  { key: COLUMN_NAMES.STOP, label: UI_LABELS.ROUTE_SIMPLE_TABLE.STOP },
  { key: COLUMN_NAMES.DESTINATION_ADDRESS, label: UI_LABELS.ROUTE_SIMPLE_TABLE.ADDRESS },
  { key: COLUMN_NAMES.NEIGHBORHOOD, label: UI_LABELS.ROUTE_SIMPLE_TABLE.NEIGHBORHOOD },
  { key: COLUMN_NAMES.LOCATION_TYPE, label: UI_LABELS.ROUTE_SIMPLE_TABLE.LOCATION_TYPE },
  { key: VIRTUAL_COLUMN_DELIVERY_CORREIOS, label: UI_LABELS.ROUTE_SIMPLE_TABLE.CORREIOS_DELIVERY },
  { key: COLUMN_NAMES.ZIPCODE, label: UI_LABELS.ROUTE_SIMPLE_TABLE.ZIPCODE },
];

/** Returns tooltip text for a column */
const getColumnTooltip = (colKey: string): string | undefined => {
  if (colKey === COLUMN_NAMES.LOCATION_TYPE) return UI_LABELS.ROUTE_SIMPLE_TABLE.LOCATION_TYPE_TOOLTIP;
  if (colKey === VIRTUAL_COLUMN_DELIVERY_CORREIOS) return UI_LABELS.ROUTE_SIMPLE_TABLE.CORREIOS_DELIVERY_TOOLTIP;
  return undefined;
};

/**
 * RouteSimpleTable Component
 * A modal that displays a simplified list of deliveries.
 */
export const RouteSimpleTable: React.FC<Props> = ({ rows, selectedRoute, onClose }) => {
  // Guard clause - don't render if no data
  if (!rows || rows.length === 0) return null;

  // Guard clause - don't render if no data
  if (!rows || rows.length === 0) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center">
      <div className="bg-white w-full max-w-6xl h-[98vh] rounded-xl overflow-hidden flex flex-col shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b">
          <h5 className="text-lg font-semibold">{UI_LABELS.ROUTE_SIMPLE_TABLE.TITLE(selectedRoute ?? "")}</h5>
          <button className="px-3 py-1 text-sm rounded bg-primary hover:bg-primary/80 text-white shadow-sm" onClick={onClose}>
            {UI_LABELS.COMMON.CLOSE}
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="bg-primary/90 text-white sticky top-0">
              <tr className="text-center align-middle">
                {COLUMNS.map((col) => (
                  <th key={col.key} className="px-3 py-2 border border-slate-200" title={getColumnTooltip(col.key)}>
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Index key is safe here: this list is static — built once per route,
                  deterministically sorted in excelProcessor, and never reordered or
                  filtered in this component. No row field is guaranteed unique
                  (only Corridor Cage/Latitude/Longitude are mandatory, and they repeat). */}
              {rows.map((row, idx) => (
                <tr key={idx} className="text-center align-middle odd:bg-slate-50">
                  {COLUMNS.map((col) => (
                    <td key={col.key} className="px-3 py-2 border border-slate-200" title={getColumnTooltip(col.key)}>
                      {renderCellContent(col.key, row)}
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
