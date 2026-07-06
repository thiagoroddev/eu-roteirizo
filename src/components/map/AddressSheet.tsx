import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "../ui/button";
import { COLUMN_NAMES, UI_LABELS } from "../../constants";
import { extractComplement, locationTypeLabel } from "../../utils/markers/markerModels";
import type { AddressGroup } from "../../utils/markers/stopGrouping";
import type { RowData } from "../../types";

const SHEET = UI_LABELS.ROUTE_MAP.ADDRESS_SHEET;
const NO_DATA = UI_LABELS.COMMON.NO_DATA;

interface Props {
  /** The selected address; null → the sheet doesn't render. */
  address: AddressGroup | null;
  /** Spreadsheet stop number ("Parada" da planilha); null when the Stop column is absent. */
  stopNumber?: string | null;
  /** Closes ONLY the selection — the stop stays expanded (fluxo-modo-original §5). */
  onClose: () => void;
  /**
   * Action slot for the Meu roteiro mode (RF-006: anchor/edit buttons) and the
   * execution screen (RF-009). Absent = pure read-only (Original mode): no edit
   * buttons at all. This is the reuse contract of fluxo-modo-original §6/§7 —
   * switching modes only changes data/slots, never the structure.
   */
  actions?: ReactNode;
  /**
   * "overlay" (default): self-positioned bottom overlay (legacy fullscreen map
   * modal). "inline": plain block — the MapPanel provides position and frame
   * (TASK-RF-023.2 interim body until the StopItemList of .4 absorbs this).
   */
  variant?: "overlay" | "inline";
}

/**
 * AddressSheet - the shared bottom panel with the selected address' details
 * (fluxo-modo-original §6, TASK-RF-022.6 — replaces the RF-020.3 Leaflet popup).
 * Shows the spreadsheet numbers (Stop/Sequence), full address, complement, the
 * inferred type as TEXT, and every package of the address (multi-package lists
 * all). Rendered as a sibling of the Leaflet container, so taps/scroll inside
 * it never reach the map (no accidental pan/collapse).
 *
 * Content is plain text through React (auto-escaped) — the escapeHtml guidance
 * of TASK-BG-003 applies to HTML strings injected into Leaflet, not here.
 */
export const AddressSheet = ({ address, stopNumber = null, onClose, actions, variant = "overlay" }: Props) => {
  if (!address) return null;

  const head: RowData = address.rows[0] ?? {};
  const mapsUrl = `https://www.google.com/maps?q=${address.lat},${address.lng}`;

  return (
    <section
      aria-label={SHEET.ARIA}
      className={
        variant === "overlay"
          ? "absolute inset-x-0 bottom-0 z-[1000] max-h-[45%] overflow-y-auto rounded-t-2xl border-t border-input bg-background shadow-[0_-4px_16px_rgba(0,0,0,0.15)]"
          : "overflow-y-auto"
      }
    >
      <div className="flex items-start justify-between gap-2 p-4 pb-2">
        <div>
          <h3 className="text-sm font-semibold">{String(head[COLUMN_NAMES.DESTINATION_ADDRESS] || NO_DATA)}</h3>
          {stopNumber !== null && (
            <div className="text-xs text-muted-foreground">
              <strong>{SHEET.STOP}</strong> {stopNumber}
            </div>
          )}
        </div>
        <Button variant="ghost" size="icon" aria-label={SHEET.CLOSE} title={SHEET.CLOSE} onClick={onClose}>
          <X />
        </Button>
      </div>

      <div className="space-y-1 px-4 text-sm">
        <div>
          <strong>{SHEET.NEIGHBORHOOD}</strong> {String(head[COLUMN_NAMES.NEIGHBORHOOD] || NO_DATA)}
        </div>
        <div>
          <strong>{SHEET.ZIPCODE}</strong> {String(head[COLUMN_NAMES.ZIPCODE] || NO_DATA)}
        </div>
        <div>
          <strong>{SHEET.COMPLEMENT}</strong> {extractComplement(address)}
        </div>
        <div>
          <strong>{SHEET.TYPE}</strong> {locationTypeLabel(address.type)}
        </div>
      </div>

      <div className="px-4 pt-3">
        <div className="text-sm font-semibold">{SHEET.PACKAGES_HEADER(address.rows.length)}</div>
        <ul className="mt-1 space-y-1 text-sm">
          {address.rows.map((row, index) => (
            <li key={index} className="flex items-center justify-between gap-3">
              <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{String(row[COLUMN_NAMES.SPX_TN] || NO_DATA)}</code>
              <span className="text-muted-foreground">
                {SHEET.SEQUENCE} {String(row[COLUMN_NAMES.SEQUENCE] || NO_DATA)}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex items-center justify-between gap-2 p-4 pt-3">
        <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary underline-offset-4 hover:underline">
          {SHEET.GOOGLE_MAPS}
        </a>
        {actions && <div className="flex gap-2">{actions}</div>}
      </div>
    </section>
  );
};
