/**
 * markerModels - View-models + interaction logic for the Original-mode map (RF-020.3).
 *
 * This is the "brain" of the interactions (ADR-008 §10, fluxo §5–§6), kept pure (no
 * Leaflet/DOM) so it is fully testable: given the grouped stops and the current
 * interaction state (which stop is expanded, which address is selected), it returns
 * the list of markers to draw and the tooltip HTML; and given a clicked model, it
 * computes the next interaction state. The RouteMap component only wires these to
 * Leaflet (create marker, set state on click). Address detail is no longer a Leaflet
 * popup: the selected address feeds the AddressSheet bottom panel (TASK-RF-022.6).
 */

import type { RowData } from "../../types";
import type { MarkerSvgProps } from "./markerSvg";
import type { StopGroup, AddressGroup } from "./stopGrouping";
import { COLUMN_NAMES, ICON_KEYS, UI_LABELS } from "../../constants";
import { colorForLocationType } from "./markerColors";
import { escapeHtml } from "../escapeHtml";
import { getCommercialDisplayStatus } from "../inferLocationType";

const SHEET = UI_LABELS.ROUTE_MAP.ADDRESS_SHEET;
const TOOLTIP = UI_LABELS.ROUTE_MAP.TOOLTIP;
const NO_DATA = UI_LABELS.COMMON.NO_DATA;

/** A marker to draw: either a collapsed stop (square) or an expanded address (circle). */
export interface MarkerModel {
  /** Stable identity for the render pass. */
  key: string;
  kind: "stop" | "address";
  lat: number;
  lng: number;
  iconProps: Omit<MarkerSvgProps, "scale">;
  /** Index of the owning stop, used by the click transition. */
  stopIndex: number;
  /** Present on address models; identifies the selected address. */
  addressKey?: string;
  /** Hover summary on collapsed squares. */
  tooltipHtml?: string;
}

export interface InteractionState {
  expandedStopKey: string | null;
  selectedAddressKey: string | null;
}

/* ============================================================================
   PURE HELPERS
============================================================================ */

/** The complement is the address text after the 2nd comma (same split as inferLocationType). */
export const extractComplement = (address: AddressGroup): string => {
  const full = String(address.rows[0]?.[COLUMN_NAMES.DESTINATION_ADDRESS] ?? "");
  const complement = full.split(",").slice(2).join(", ").trim();
  return complement || SHEET.NO_COMPLEMENT;
};

/** ICON_KEYS → human label ("Comercial" / "Residencial" / "Indefinido"). */
export const locationTypeLabel = (type: string): string => {
  if (type === ICON_KEYS.OFFICE || type === ICON_KEYS.OFFICE_CORRECTED) return SHEET.TYPE_LABELS.COMMERCIAL;
  if (type === ICON_KEYS.HOME || type === ICON_KEYS.HOME_CORRECTED) return SHEET.TYPE_LABELS.RESIDENTIAL;
  return SHEET.TYPE_LABELS.INDEFINITE;
};

/** The stop+address a selectedAddressKey points at. */
export interface SelectedAddress {
  stop: StopGroup;
  address: AddressGroup;
}

/**
 * Resolves a selectedAddressKey ("i:j") against the stops structure. Defensive:
 * a malformed or out-of-range key (e.g. a live selection surviving a `rows`
 * change) returns null — the AddressSheet simply doesn't render.
 */
export const findAddressByKey = (stops: StopGroup[], selectedAddressKey: string | null): SelectedAddress | null => {
  if (!selectedAddressKey) return null;
  const parts = selectedAddressKey.split(":");
  if (parts.length !== 2) return null;
  const i = Number(parts[0]);
  const j = Number(parts[1]);
  if (!Number.isInteger(i) || !Number.isInteger(j) || i < 0 || j < 0) return null;
  const stop = stops[i];
  const address = stop?.addresses[j];
  return stop && address ? { stop, address } : null;
};

/** Hover tooltip on a collapsed square = summary of the representative row. All escaped. */
export const buildStopTooltipHtml = (stop: StopGroup): string => {
  const row: RowData = stop.representative.rows[0] ?? {};
  return `
    <div style="font-family: sans-serif; font-size: 13px;">
      <strong>${TOOLTIP.SEQUENCE}</strong> ${escapeHtml(row[COLUMN_NAMES.SEQUENCE] || NO_DATA)} | <strong>${TOOLTIP.STOP}</strong> ${escapeHtml(row[COLUMN_NAMES.STOP] || NO_DATA)}<br/>
      <strong>${TOOLTIP.ADDRESS}</strong> ${escapeHtml(row[COLUMN_NAMES.DESTINATION_ADDRESS] || NO_DATA)}<br/>
      <strong>${TOOLTIP.NEIGHBORHOOD}</strong> ${escapeHtml(row[COLUMN_NAMES.NEIGHBORHOOD] || NO_DATA)}<br/>
      <strong>${TOOLTIP.ZIPCODE}</strong> ${escapeHtml(row[COLUMN_NAMES.ZIPCODE] || NO_DATA)}<br/>
      <strong>${TOOLTIP.COMMERCIAL}</strong> ${escapeHtml(getCommercialDisplayStatus(row))}
    </div>
  `;
};

/* ============================================================================
   VIEW-MODELS & TRANSITIONS
============================================================================ */

/**
 * Builds the markers to draw for the current interaction state.
 * Collapsed stops → squares; the expanded stop → its addresses as circles
 * (selected flag; detail lives in the AddressSheet). Only one stop expands at a time.
 * @param stops - Grouped stops (from groupRowsByStop).
 * @param expandedStopKey - Key (stop index) of the expanded stop, or null.
 * @param selectedAddressKey - Key of the selected address, or null.
 */
export const computeMarkerModels = (stops: StopGroup[], expandedStopKey: string | null, selectedAddressKey: string | null): MarkerModel[] => {
  const models: MarkerModel[] = [];

  stops.forEach((stop, i) => {
    const stopKey = String(i);

    if (stopKey === expandedStopKey) {
      stop.addresses.forEach((address, j) => {
        const addressKey = `${i}:${j}`;
        const isSelected = addressKey === selectedAddressKey;
        models.push({
          key: addressKey,
          kind: "address",
          lat: address.lat,
          lng: address.lng,
          stopIndex: i,
          addressKey,
          iconProps: {
            shape: "circle",
            // Every circle of the stop shows the stop number → clearly the same stop.
            color: colorForLocationType(address.type),
            number: stop.hasStop ? stop.stop : null,
            badge: address.rows.length > 1 ? { kind: "packages", count: address.rows.length } : null,
            // All addresses of the focused stop get the thick white border; the selected
            // one is always emphasized (bright neon glow + enlarged by RouteMap) — even
            // when it's the only address — to keep one consistent "selected" look.
            selected: true,
            emphasis: isSelected,
          },
        });
      });
      return;
    }

    const rep = stop.representative;
    const multi = stop.addresses.length > 1;
    models.push({
      key: stopKey,
      kind: "stop",
      lat: rep.lat,
      lng: rep.lng,
      stopIndex: i,
      iconProps: {
        shape: "square",
        color: colorForLocationType(stop.type),
        number: stop.hasStop ? stop.stop : null,
        badge: multi ? { kind: "addresses", count: stop.addresses.length } : { kind: "packages", count: rep.rows.length },
      },
      tooltipHtml: buildStopTooltipHtml(stop),
    });
  });

  return models;
};

/**
 * Computes the next interaction state from a marker click.
 * Clicking a stop expands it (auto-selecting its single address, if only one);
 * clicking an address selects it (keeping the stop expanded).
 */
export const nextInteraction = (current: InteractionState, clicked: MarkerModel, stops: StopGroup[]): InteractionState => {
  if (clicked.kind === "address") {
    return { expandedStopKey: current.expandedStopKey, selectedAddressKey: clicked.addressKey ?? null };
  }
  const stopKey = String(clicked.stopIndex);
  const single = stops[clicked.stopIndex]?.addresses.length === 1;
  return { expandedStopKey: stopKey, selectedAddressKey: single ? `${clicked.stopIndex}:0` : null };
};

/** Click on the empty map → collapse and clear selection. */
export const collapseInteraction = (): InteractionState => ({ expandedStopKey: null, selectedAddressKey: null });
