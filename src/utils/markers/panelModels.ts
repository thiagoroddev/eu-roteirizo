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
