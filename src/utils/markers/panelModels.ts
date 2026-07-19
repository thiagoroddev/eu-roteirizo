/**
 * panelModels - Pure derivations for the map's bottom panel (TASK-RF-023).
 *
 * Home of the MapPanel's data logic, separate from markerModels (marker
 * view-models). Grows with .3/.4 (panel items, metrics, prev/next stop).
 */

import type { RowData } from "../../types";
import type { StopLeg } from "../../types/routing";
import type { StopGroup } from "./stopGrouping";
import { COLUMN_NAMES, ICON_KEYS, UI_LABELS } from "../../constants";
import { extractComplement, extractRowComplement, locationTypeLabel } from "./markerModels";
import { resolveLocationType } from "../inferLocationType";

const NO_DATA = UI_LABELS.COMMON.NO_DATA;
const NO_COMPLEMENT = UI_LABELS.ROUTE_MAP.ADDRESS_SHEET.NO_COMPLEMENT;

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

/** Header metrics (rev. 07/07): address total + package counts PER inferred type
    ("2 endereços · Residencial: 1 pacote · Comercial: 2 pacotes" — a mall stop
    mixes homes and shops). Types with zero packages are omitted by the caller. */
export interface PanelMetrics {
  addressCount: number;
  packagesByType: { commercial: number; residential: number; indefinite: number };
}

export const panelMetrics = (stop: StopGroup | null): PanelMetrics => {
  const packagesByType = { commercial: 0, residential: 0, indefinite: 0 };
  if (!stop) return { addressCount: 0, packagesByType };
  for (const address of stop.addresses) {
    for (const row of address.rows) {
      const type = resolveLocationType(row);
      if (type === ICON_KEYS.OFFICE || type === ICON_KEYS.OFFICE_CORRECTED) packagesByType.commercial += 1;
      else if (type === ICON_KEYS.HOME || type === ICON_KEYS.HOME_CORRECTED) packagesByType.residential += 1;
      else packagesByType.indefinite += 1;
    }
  }
  return { addressCount: stop.addresses.length, packagesByType };
};

/** One package line of an expanded StopItem (RF-28): spreadsheet label + SPX code + type. */
export interface PackageRowData {
  /** "Ordem {Sequence} | Parada {Stop}" (physical-label format) — Stop omitted when absent. */
  label: string;
  /** THIS package's complement ("" when absent) — always shown per package (rev. 07/07). */
  complement: string;
  spxTn: string;
  /** Per-package inferred type (ICON_KEYS) — colors the type badge (rev. 07/07). */
  type: string;
  /** Its human label ("Comercial" / "Residencial" / "Indefinido"). */
  typeLabel: string;
}

/**
 * View-model of one address in the panel's StopItemList (design doc §3).
 * Neighborhood/zipcode/type are NOT here (rev. 07/07): place info lives in the
 * stop summary (stopPlaceSummary) and the type only on the per-package badge.
 */
export interface StopItemData {
  /** "i:j" — same identity the map uses (findAddressByKey / selectedAddressKey). */
  addressKey: string;
  /** Number on the mini-marker: the address' smallest Sequence (Original mode). */
  markerNumber: string;
  /** ICON_KEYS type — colorForLocationType gives the mini-marker color. */
  markerType: string;
  addressLine: string;
  complement: string;
  packageCount: number;
  packages: PackageRowData[];
  mapsUrl: string;
  /** Walking leg INTO this address (RF-006.10) — only in Meu roteiro's ordered
   *  lists; absent/null elsewhere (Original, free points). */
  leg?: StopLeg | null;
}

const packageRow = (row: RowData, stop: StopGroup): PackageRowData => {
  const type = resolveLocationType(row);
  return {
    label: UI_LABELS.MAP_PANEL.ITEM.PACKAGE_LABEL(stop.hasStop ? stop.stop : null, String(row[COLUMN_NAMES.SEQUENCE] || NO_DATA)),
    complement: extractRowComplement(row),
    spxTn: String(row[COLUMN_NAMES.SPX_TN] || NO_DATA),
    type,
    typeLabel: locationTypeLabel(type),
  };
};

/**
 * Items for the panel's StopItemList: the addresses of `stopKey`'s stop, ordered
 * by their smallest Sequence (Original = spreadsheet order), each carrying its
 * packages. Null/invalid key → [] (the list renders its empty state).
 */
export const buildPanelItems = (stops: StopGroup[], stopKey: string | null): StopItemData[] => {
  const stop = stopKey !== null ? stops[Number(stopKey)] : undefined;
  if (!stop) return [];

  // The address line is the BUILDING only (street + number — same split as the
  // grouping key); complements belong to the packages. Exception (rev. 07/07):
  // a stop with a SINGLE address holding a SINGLE package keeps the complement
  // on the line, so the user doesn't need to expand for it.
  const singleAddressSinglePackage = stop.addresses.length === 1 && stop.addresses[0].rows.length === 1;

  return stop.addresses
    .map((address, j) => ({ address, j }))
    .sort((a, b) => a.address.minSequence - b.address.minSequence)
    .map(({ address, j }) => {
      const head: RowData = address.rows[0] ?? {};
      const parts = String(head[COLUMN_NAMES.DESTINATION_ADDRESS] ?? "")
        .split(",")
        .map((part) => part.trim())
        .filter(Boolean);
      return {
        addressKey: `${stopKey}:${j}`,
        markerNumber: Number.isFinite(address.minSequence) ? String(address.minSequence) : NO_DATA,
        markerType: address.type,
        addressLine: parts.length > 0 ? parts.slice(0, 2).join(", ") : NO_DATA,
        complement: singleAddressSinglePackage ? extractComplement(address) : NO_COMPLEMENT,
        packageCount: address.rows.length,
        packages: address.rows.map((row) => packageRow(row, stop)),
        mapsUrl: `https://www.google.com/maps?q=${address.lat},${address.lng}`,
      };
    });
};

/**
 * Place info for the STOP SUMMARY (rev. 07/07): unique neighborhoods and
 * zipcodes across the stop's rows, in address order — "Parada 5 — Copacabana,
 * Ipanema" + CEP line. Empty values are skipped.
 */
export const stopPlaceSummary = (stop: StopGroup | null): { neighborhoods: string[]; zipcodes: string[] } => {
  const neighborhoods: string[] = [];
  const zipcodes: string[] = [];
  if (!stop) return { neighborhoods, zipcodes };
  for (const address of stop.addresses) {
    for (const row of address.rows) {
      const neighborhood = String(row[COLUMN_NAMES.NEIGHBORHOOD] ?? "").trim();
      const zipcode = String(row[COLUMN_NAMES.ZIPCODE] ?? "").trim();
      if (neighborhood && !neighborhoods.includes(neighborhood)) neighborhoods.push(neighborhood);
      if (zipcode && !zipcodes.includes(zipcode)) zipcodes.push(zipcode);
    }
  }
  return { neighborhoods, zipcodes };
};
