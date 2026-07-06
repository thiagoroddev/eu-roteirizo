/**
 * panelModels - Pure derivations for the map's bottom panel (TASK-RF-023).
 *
 * Home of the MapPanel's data logic, separate from markerModels (marker
 * view-models). Grows with .3/.4 (panel items, metrics, prev/next stop).
 */

import type { StopGroup } from "./stopGrouping";

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
