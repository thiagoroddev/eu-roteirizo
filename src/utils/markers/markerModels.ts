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
import { rowComplement } from "../complement";
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

/** Complement of ONE row (per-package display, rev. 07/07). Delegates to the
    neutral `rowComplement` (RF-007.2 — one implementation shared with routing). */
export const extractRowComplement = (row: RowData): string => rowComplement(row);

/** Address-level complement (first row's), with the "—" fallback. */
export const extractComplement = (address: AddressGroup): string => extractRowComplement(address.rows[0] ?? {}) || SHEET.NO_COMPLEMENT;

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
export const computeMarkerModels = (stops: StopGroup[], expandedStopKey: string | null, selectedAddressKey: string | null, highlightedStopKey?: string | null): MarkerModel[] => {
  const models: MarkerModel[] = [];
  /** The stop whose SQUARE gets the ring/glow (RF-006.4.10/.4.13): the panel's
      current stop if given, else the focused-but-collapsed one. */
  const focusedKey = expandedStopKey === null && selectedAddressKey !== null ? selectedAddressKey.split(":")[0] : null;
  const highlightedKey = highlightedStopKey ?? focusedKey;

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
            // one is emphasized (glow) AND highlighted (enlarged + raised by RouteMap —
            // RF-006.4.14) so it stands out among its siblings.
            selected: true,
            emphasis: isSelected,
            highlight: isSelected,
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
        // The panel's/focused stop gets the ring + glow + the enlarge/raise
        // (RF-006.4.10/.4.13/.4.14) so it never hides in a cluster.
        selected: stopKey === highlightedKey,
        emphasis: stopKey === highlightedKey,
        highlight: stopKey === highlightedKey,
      },
      tooltipHtml: buildStopTooltipHtml(stop),
    });
  });

  return models;
};

/**
 * Key ("i:j") of a stop's FIRST address — the lowest Sequence. Opening a stop
 * auto-selects it (rev. 07/07: "nunca há endereço sem seleção"; in the Meu
 * roteiro mode this becomes the vehicle/anchor position).
 */
export const firstAddressKey = (stops: StopGroup[], stopIndex: number): string | null => {
  const stop = stops[stopIndex];
  if (!stop || stop.addresses.length === 0) return null;
  let best = 0;
  stop.addresses.forEach((address, j) => {
    if (address.minSequence < stop.addresses[best].minSequence) best = j;
  });
  return `${stopIndex}:${best}`;
};

/**
 * FOCUS a stop (RF-006.4.10): keep it GROUPED (expandedStopKey null) but select
 * its first address so the panel shows the summary and the map centers on it.
 */
export const focusInteraction = (stopIndex: number, stops: StopGroup[]): InteractionState => ({ expandedStopKey: null, selectedAddressKey: firstAddressKey(stops, stopIndex) });

/**
 * EXPAND a stop (RF-006.4.10): ungroup it into its addresses (double-click or
 * "Ver lista completa"), selecting the first one.
 */
export const expandInteraction = (stopIndex: number, stops: StopGroup[]): InteractionState => ({ expandedStopKey: String(stopIndex), selectedAddressKey: firstAddressKey(stops, stopIndex) });

/**
 * Next interaction from a SINGLE click (RF-006.4.10): clicking a stop FOCUSES it
 * (stays grouped — double-click expands); clicking an address selects it,
 * keeping whatever expansion is active.
 */
export const nextInteraction = (current: InteractionState, clicked: MarkerModel, stops: StopGroup[]): InteractionState => {
  if (clicked.kind === "address") {
    return { expandedStopKey: current.expandedStopKey, selectedAddressKey: clicked.addressKey ?? null };
  }
  return focusInteraction(clicked.stopIndex, stops);
};

/**
 * Click on the empty map (RF-006.4.10): REGROUP — collapse any expansion but
 * KEEP the focus on the current stop (the panel/selection never empties).
 */
export const regroupInteraction = (current: InteractionState): InteractionState => ({ expandedStopKey: null, selectedAddressKey: current.selectedAddressKey });

/** Full reset (both null) — used when leaving the mode, not on an empty tap. */
export const collapseInteraction = (): InteractionState => ({ expandedStopKey: null, selectedAddressKey: null });

/** The stop currently FOCUSED but collapsed (RF-006.4.10): its square gets the
    emphasis. Derived from `selectedAddressKey` while nothing is expanded. */
export const focusedStopIndex = (interaction: InteractionState): number | null => {
  if (interaction.expandedStopKey !== null || interaction.selectedAddressKey === null) return null;
  const index = Number(interaction.selectedAddressKey.split(":")[0]);
  return Number.isFinite(index) ? index : null;
};
