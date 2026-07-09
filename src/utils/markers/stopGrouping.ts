/**
 * stopGrouping - Groups delivery rows into stops for the Original-mode map (ADR-008, RF-020.2).
 *
 * The official app shows ONE marker per stop (Stop column), not one per row. This
 * pure helper turns the flat rows into that hierarchy: Stop → Address → packages.
 *
 * Decisions (locked with the human):
 * - **Address identity = the BUILDING (street + number)**, so packages at the same
 *   building but different complements/floors — and slightly different geocoded
 *   coordinates — collapse into ONE address (avoids two near-coincident markers that
 *   would overlap). Falls back to the rounded coordinate when there is no street+number.
 *   The differing per-package info (complement, sequence) lives in the popup.
 * - **Representative = lowest sequence among addresses WITH a valid coordinate** —
 *   so a stop is never lost just because its first address has a bad coordinate.
 * - **Empty/absent Stop → its own marker** (one StopGroup per such row, no number).
 * - **Stop type "commercial wins"**: a stop with ≥1 commercial address is commercial.
 *
 * Rows without a valid, in-bounds coordinate are not plottable and are dropped here
 * (the caller still counts them for its DEV "discarded points" warning).
 *
 * No Leaflet/DOM. Reuses parseCoordinate/isWithinRioBounds, resolveLocationType and
 * haversine (utils/routing/geo.ts).
 */

import type { RowData } from "../../types";
import type { LatLng } from "../../types/routing";
import { COLUMN_NAMES, ICON_KEYS } from "../../constants";
import { parseCoordinate, isWithinRioBounds } from "../coordinates";
import { resolveLocationType } from "../inferLocationType";
import { haversine } from "../routing/geo";

/** A distinct map point within a stop (one coordinate), with all packages delivered there. */
export interface AddressGroup {
  /** Coordinate key (`lat,lng` rounded) used to deduplicate packages at the same point. */
  key: string;
  lat: number;
  lng: number;
  rows: RowData[];
  /** Lowest delivery sequence among this address's packages. */
  minSequence: number;
  /** Location type (ICON_KEYS) for coloring; commercial wins among the address's rows. */
  type: string;
}

/** A stop (Stop column) = one map marker, holding one or more addresses. */
export interface StopGroup {
  stop: string;
  hasStop: boolean;
  /** Plottable addresses (valid coordinate) within the stop, at least one. */
  addresses: AddressGroup[];
  /** Collapsed-marker position = lowest-sequence valid address. */
  representative: AddressGroup;
  /** Stop-level type (ICON_KEYS) for the marker color; commercial wins. */
  type: string;
  /** Greatest distance (m) from the representative to any address — drives the DEV dispersion warning. */
  maxDispersionMeters: number;
}

const COORD_PRECISION = 6;

/** Leading comma-parts ("street, number") that identify a building. */
const BUILDING_PARTS = 2;

/** Normalizes address text for keying (strip accents, lowercase, collapse spaces). */
const normalizeAddress = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/\p{Mn}/gu, "") // drop combining marks (accents) after NFD
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();

/**
 * Address key within a stop = the BUILDING (street + number) so packages at the same
 * building (different complement/floor, possibly slightly different coordinates) merge
 * into one address. Falls back to the rounded coordinate when there is no street+number.
 */
const addressKeyFor = (row: RowData, lat: number, lng: number): string => {
  const parts = String(row[COLUMN_NAMES.DESTINATION_ADDRESS] ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  if (parts.length >= BUILDING_PARTS) return `addr:${normalizeAddress(parts.slice(0, BUILDING_PARTS).join(", "))}`;
  return `geo:${lat.toFixed(COORD_PRECISION)},${lng.toFixed(COORD_PRECISION)}`;
};

/** Canonical ICON_KEYS per bucket, so the result feeds `colorForLocationType` directly. */
const CANONICAL = {
  commercial: ICON_KEYS.OFFICE_CORRECTED,
  residential: ICON_KEYS.HOME_CORRECTED,
  indefinite: ICON_KEYS.INDEFINITE,
} as const;

const sequenceOf = (row: RowData): number => {
  const n = Number(row[COLUMN_NAMES.SEQUENCE]);
  return Number.isFinite(n) ? n : Number.POSITIVE_INFINITY;
};

/** "Commercial wins" reduction over a set of rows → a canonical ICON_KEYS type.
 *  Exported since RF-006.4: the roteiro mode colors committed stops with it too
 *  (decision 26/06 — color = type in BOTH modes). */
export const dominantType = (rows: RowData[]): string => {
  let hasResidential = false;
  for (const row of rows) {
    const type = resolveLocationType(row);
    if (type === ICON_KEYS.OFFICE || type === ICON_KEYS.OFFICE_CORRECTED) return CANONICAL.commercial;
    if (type === ICON_KEYS.HOME || type === ICON_KEYS.HOME_CORRECTED) hasResidential = true;
  }
  return hasResidential ? CANONICAL.residential : CANONICAL.indefinite;
};

/** Working accumulator before sequence/type are computed. */
interface AddressDraft {
  key: string;
  lat: number;
  lng: number;
  rows: RowData[];
}

const finalizeAddress = (draft: AddressDraft): AddressGroup => ({
  key: draft.key,
  lat: draft.lat,
  lng: draft.lng,
  rows: draft.rows,
  minSequence: draft.rows.reduce((min, row) => Math.min(min, sequenceOf(row)), Number.POSITIVE_INFINITY),
  type: dominantType(draft.rows),
});

const buildStop = (stop: string, hasStop: boolean, addresses: AddressGroup[]): StopGroup => {
  // Representative = lowest minSequence; ties keep the earlier address (stable).
  const representative = addresses.reduce((best, addr) => (addr.minSequence < best.minSequence ? addr : best), addresses[0]);
  const repPoint: LatLng = { lat: representative.lat, lng: representative.lng };
  const maxDispersionMeters = addresses.reduce((max, addr) => Math.max(max, haversine(repPoint, { lat: addr.lat, lng: addr.lng })), 0);
  return {
    stop,
    hasStop,
    addresses,
    representative,
    type: dominantType(addresses.flatMap((addr) => addr.rows)),
    maxDispersionMeters,
  };
};

/**
 * Groups rows into stops (one marker per stop). See module doc for the rules.
 * @param rows - All deliveries for the selected route.
 * @returns Stops in first-appearance order; empty-Stop rows become their own single-address stops.
 */
export function groupRowsByStop(rows: RowData[]): StopGroup[] {
  const byStop = new Map<string, Map<string, AddressDraft>>();
  const stopOrder: string[] = [];
  const noStop: AddressDraft[] = [];

  for (const row of rows) {
    const lat = parseCoordinate(row[COLUMN_NAMES.LATITUDE]);
    const lng = parseCoordinate(row[COLUMN_NAMES.LONGITUDE]);
    // Not plottable → dropped (caller warns on the count).
    if (lat === undefined || lng === undefined || !isWithinRioBounds(lat, lng)) continue;

    const stop = String(row[COLUMN_NAMES.STOP] ?? "").trim();

    if (!stop) {
      // Empty Stop → its own marker (do not merge with anything).
      noStop.push({ key: `geo:${lat.toFixed(COORD_PRECISION)},${lng.toFixed(COORD_PRECISION)}`, lat, lng, rows: [row] });
      continue;
    }

    // Same building (street + number) → one address, even with slightly different coords.
    const addrKey = addressKeyFor(row, lat, lng);
    let addresses = byStop.get(stop);
    if (!addresses) {
      addresses = new Map();
      byStop.set(stop, addresses);
      stopOrder.push(stop);
    }
    const existing = addresses.get(addrKey);
    if (existing) {
      existing.rows.push(row);
    } else {
      addresses.set(addrKey, { key: addrKey, lat, lng, rows: [row] });
    }
  }

  const result: StopGroup[] = [];
  for (const stop of stopOrder) {
    const drafts = byStop.get(stop);
    if (!drafts) continue;
    const addresses = [...drafts.values()].map(finalizeAddress);
    if (addresses.length > 0) result.push(buildStop(stop, true, addresses));
  }
  for (const draft of noStop) {
    result.push(buildStop("", false, [finalizeAddress(draft)]));
  }
  return result;
}
