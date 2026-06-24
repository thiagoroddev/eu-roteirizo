/**
 * utils/routing/points.ts - Turn spreadsheet rows into DeliveryPoints.
 *
 * A DeliveryPoint is a unique LOCATION (one map marker). Rows that share the same
 * coordinate are merged into one point whose `packageCount` is the number of rows
 * (packages) there — this is how a multi-package address (fluxo §3) is represented.
 *
 * Coordinate parsing/validation reuses the same helpers the map relies on, so a
 * point exists here only if it could be plotted.
 */

import type { RowData } from "../../types";
import type { DeliveryPoint, DeliveryPackage } from "../../types/routing";
import { COLUMN_NAMES } from "../../constants";
import { parseCoordinate, isWithinRioBounds } from "../coordinates";

/** Reads a cell as a trimmed string ("" when absent/empty). */
const asString = (value: unknown): string => (value === null || value === undefined ? "" : String(value).trim());

/**
 * Grouping key for a location. Rounded to ~5 decimals (~1 m) so that rows Shopee
 * geocoded to the same building collapse into a single point.
 */
const locationKey = (lat: number, lng: number): string => `${lat.toFixed(5)},${lng.toFixed(5)}`;

/**
 * Builds the list of DeliveryPoints from raw spreadsheet rows.
 *
 * Rows without a plottable coordinate are skipped. Rows with the same coordinate
 * are merged into one point; each row becomes a DeliveryPackage (carrying its SPX
 * tracking number when present).
 *
 * @param rows - Raw rows from the single-route spreadsheet.
 * @returns One DeliveryPoint per unique location, in first-seen order.
 */
export const buildDeliveryPoints = (rows: RowData[]): DeliveryPoint[] => {
  /** Preserve insertion order while merging by location. */
  const byLocation = new Map<string, DeliveryPoint>();

  rows.forEach((row, index) => {
    const lat = parseCoordinate(row[COLUMN_NAMES.LATITUDE]);
    const lng = parseCoordinate(row[COLUMN_NAMES.LONGITUDE]);
    if (lat === undefined || lng === undefined || !isWithinRioBounds(lat, lng)) return;

    const key = locationKey(lat, lng);
    const tracking = asString(row[COLUMN_NAMES.SPX_TN]);

    let point = byLocation.get(key);
    if (!point) {
      point = {
        id: `pt_${key}`,
        lat,
        lng,
        address: asString(row[COLUMN_NAMES.DESTINATION_ADDRESS]),
        packageCount: 0,
        packages: [],
      };
      byLocation.set(key, point);
    }

    const pkg: DeliveryPackage = {
      id: tracking !== "" ? tracking : `${point.id}_${index}`,
      rawData: row,
    };
    if (tracking !== "") pkg.tracking = tracking;

    point.packages.push(pkg);
    point.packageCount = point.packages.length;
    /** Keep the first non-empty address seen for this location. */
    if (point.address === "") point.address = asString(row[COLUMN_NAMES.DESTINATION_ADDRESS]);
  });

  return [...byLocation.values()];
};
