import { MAP_CONFIG } from "../constants";

/**
 * parseCoordinate - Parses a latitude/longitude value coming from the spreadsheet.
 *
 * Expected format: a SCALED INTEGER without a decimal point, e.g. `-229000000`,
 * which represents `-22.9` (the value is divided by 10,000,000). Any thousand
 * separators (dots) are stripped before parsing.
 *
 * NOTE: A value that already contains a real decimal point (e.g. `"-22.9"`) does
 * NOT match this format — its dot is stripped and the result is meaningless. Such
 * values are caught downstream by {@link isWithinRioBounds} (they fall out of range)
 * rather than producing a misplaced marker.
 *
 * @param value - Raw cell value (string, number, null, ...).
 * @returns The decimal coordinate, or `undefined` if it is not a finite number.
 */
export const parseCoordinate = (value: unknown): number | undefined => {
  if (!value) return undefined;
  const cleanStr = String(value).replace(/\./g, "");
  const num = parseFloat(cleanStr);
  return Number.isNaN(num) ? undefined : num / 10000000;
};

/**
 * isWithinRioBounds - Whether a coordinate falls inside the map's Rio bounds.
 *
 * Uses {@link MAP_CONFIG.RIO_BOUNDS} (also the Leaflet `maxBounds`): a marker
 * outside this box can never be shown on the map, so an out-of-range value is
 * treated as invalid (e.g. a mis-parsed coordinate).
 *
 * @param lat - Decimal latitude.
 * @param lng - Decimal longitude.
 * @returns `true` if both lat and lng are within the Rio bounding box.
 */
export const isWithinRioBounds = (lat: number, lng: number): boolean => {
  const { SOUTH_WEST, NORTH_EAST } = MAP_CONFIG.RIO_BOUNDS;
  return lat >= SOUTH_WEST.lat && lat <= NORTH_EAST.lat && lng >= SOUTH_WEST.lng && lng <= NORTH_EAST.lng;
};
