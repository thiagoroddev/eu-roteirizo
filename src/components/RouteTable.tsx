import React from "react";
import type { RowData } from "../types";
import { UI_LABELS } from "../constants/uiLabels";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "./ui/dialog";

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
    <Dialog
      open
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
    >
      <DialogContent showClose={false} className="flex h-[98vh] w-full max-w-6xl flex-col gap-0 overflow-hidden p-0">
        <div className="flex items-center justify-between border-b p-3">
          <DialogTitle className="text-lg font-semibold">{UI_LABELS.ROUTE_TABLE.TITLE(selectedRoute || "")}</DialogTitle>
          <DialogClose asChild>
            <Button variant="secondary" size="sm">
              {UI_LABELS.COMMON.CLOSE}
            </Button>
          </DialogClose>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="min-w-full border-collapse text-sm">
            <thead className="sticky top-0 bg-primary/90 text-center text-primary-foreground">
              <tr>
                {columns.map((c) => (
                  <th key={c} className="border border-border px-3 py-2">
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
                <tr key={idx} className="odd:bg-muted">
                  {columns.map((col) => (
                    <td key={col} className="border border-border px-3 py-2">
                      {String(row[col] || UI_LABELS.COMMON.NO_DATA)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
};
