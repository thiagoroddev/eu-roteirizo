/**
 * panelModels - Pure derivations for the map's bottom panel (TASK-RF-023).
 *
 * Home of the MapPanel's data logic, separate from markerModels (marker
 * view-models). Grows with .3/.4 (panel items, metrics, prev/next stop).
 */

import type { RowData } from "../../types";
import type { StopGroup } from "./stopGrouping";
import { COLUMN_NAMES, UI_LABELS } from "../../constants";
import { extractComplement, locationTypeLabel } from "./markerModels";
import { resolveLocationType } from "../inferLocationType";

const NO_DATA = UI_LABELS.COMMON.NO_DATA;

/**
 * Key (stop index as string — same format as `expandedStopKey`) of the stop
 * with the SMALLEST numeric `Stop`. The map opens with it selected so the
 * panel is never empty (decision 05/07/26 — fluxo-modo-original §5).
 * No numeric stop at all → first stop ("0"); empty list → null.
 */
export const smallestStopKey = (stops: StopGroup[]): string | null => {
  if (stops.length === 0) return null;
  let bestIndex = -1;
  let bestValue = Number.POSITIVE_INFINITY;
  stops.forEach((stop, i) => {
    if (!stop.hasStop) return;
    const n = Number(stop.stop);
    if (Number.isFinite(n) && n < bestValue) {
      bestValue = n;
      bestIndex = i;
    }
  });
  return String(bestIndex >= 0 ? bestIndex : 0);
};

/**
 * Stepper navigation order (indices as keys): numeric stops by ascending `Stop`,
 * then the numberless ones in their current order (design doc §5 — steppers walk
 * the Stop order, circular).
 */
const navigationOrder = (stops: StopGroup[]): string[] => {
  const numeric: { index: number; value: number }[] = [];
  const rest: number[] = [];
  stops.forEach((stop, i) => {
    const n = Number(stop.stop);
    if (stop.hasStop && Number.isFinite(n)) numeric.push({ index: i, value: n });
    else rest.push(i);
  });
  numeric.sort((a, b) => a.value - b.value);
  return [...numeric.map((entry) => entry.index), ...rest].map(String);
};

/**
 * Key of the previous/next stop from `currentKey`, CIRCULAR over the navigation
 * order (StopStepper ‹ ›). Null/unknown `currentKey` falls back to the first of
 * the order (the smallest stop); empty list → null; single stop → itself.
 */
export const adjacentStopKey = (stops: StopGroup[], currentKey: string | null, direction: 1 | -1): string | null => {
  const order = navigationOrder(stops);
  if (order.length === 0) return null;
  const position = currentKey !== null ? order.indexOf(currentKey) : -1;
  if (position < 0) return order[0];
  return order[(position + direction + order.length) % order.length];
};

/** Header metrics ("N endereços · N pacotes"): packages = total rows across addresses. */
export const panelMetrics = (stop: StopGroup | null): { addressCount: number; packageCount: number } => {
  if (!stop) return { addressCount: 0, packageCount: 0 };
  return {
    addressCount: stop.addresses.length,
    packageCount: stop.addresses.reduce((sum, address) => sum + address.rows.length, 0),
  };
};

/** One package line of an expanded StopItem (RF-28): spreadsheet label + SPX code + type. */
export interface PackageRowData {
  /** "Parada {Stop} · Seq {Sequence}" — Stop omitted when the column is absent. */
  label: string;
  spxTn: string;
  /** Per-package inferred type ("Comercial" / "Residencial" / "Indefinido"). */
  typeLabel: string;
}

/** View-model of one address in the panel's StopItemList (design doc §3). */
export interface StopItemData {
  /** "i:j" — same identity the map uses (findAddressByKey / selectedAddressKey). */
  addressKey: string;
  /** Number on the mini-marker: the address' smallest Sequence (Original mode). */
  markerNumber: string;
  /** ICON_KEYS type — colorForLocationType gives the mini-marker color. */
  markerType: string;
  addressLine: string;
  complement: string;
  neighborhood: string;
  zipcode: string;
  typeLabel: string;
  packageCount: number;
  packages: PackageRowData[];
  mapsUrl: string;
}

const packageRow = (row: RowData, stop: StopGroup): PackageRowData => ({
  label: UI_LABELS.MAP_PANEL.ITEM.PACKAGE_LABEL(stop.hasStop ? stop.stop : null, String(row[COLUMN_NAMES.SEQUENCE] || NO_DATA)),
  spxTn: String(row[COLUMN_NAMES.SPX_TN] || NO_DATA),
  typeLabel: locationTypeLabel(resolveLocationType(row)),
});

/**
 * Items for the panel's StopItemList: the addresses of `stopKey`'s stop, ordered
 * by their smallest Sequence (Original = spreadsheet order), each carrying its
 * packages. Null/invalid key → [] (the list renders its empty state).
 */
export const buildPanelItems = (stops: StopGroup[], stopKey: string | null): StopItemData[] => {
  const stop = stopKey !== null ? stops[Number(stopKey)] : undefined;
  if (!stop) return [];

  return stop.addresses
    .map((address, j) => ({ address, j }))
    .sort((a, b) => a.address.minSequence - b.address.minSequence)
    .map(({ address, j }) => {
      const head: RowData = address.rows[0] ?? {};
      return {
        addressKey: `${stopKey}:${j}`,
        markerNumber: Number.isFinite(address.minSequence) ? String(address.minSequence) : NO_DATA,
        markerType: address.type,
        addressLine: String(head[COLUMN_NAMES.DESTINATION_ADDRESS] || NO_DATA),
        complement: extractComplement(address),
        neighborhood: String(head[COLUMN_NAMES.NEIGHBORHOOD] || NO_DATA),
        zipcode: String(head[COLUMN_NAMES.ZIPCODE] || NO_DATA),
        typeLabel: locationTypeLabel(address.type),
        packageCount: address.rows.length,
        packages: address.rows.map((row) => packageRow(row, stop)),
        mapsUrl: `https://www.google.com/maps?q=${address.lat},${address.lng}`,
      };
    });
};
