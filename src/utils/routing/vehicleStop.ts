/**
 * utils/routing/vehicleStop.ts - Suggest where the vehicle parks for a stop.
 *
 * The vehicle stop ("parada do veículo" / anchor) is a free point ON THE STREET,
 * in front of the seed address — not the address itself (fluxo §2/§10, decision
 * 26/06). With a road graph available we project the address onto the nearest
 * street segment (map matching, RF-005.5); while the graph is still loading (or
 * failed — the builder must work offline) we fall back to the address coordinate,
 * and the caller re-suggests once the graph arrives (épico decision, 07/07).
 */

import type { LatLng } from "../../types/routing";
import type { RoadGraph } from "./graph";
import { nearestEdge } from "./match";

/**
 * Suggests the default vehicle-stop position for an address.
 *
 * @param graph - The road graph, or null while unavailable (loading/offline).
 * @param point - The seed address coordinate.
 * @returns The projection on the nearest street, or the address itself as fallback.
 */
export const suggestVehicleStop = (graph: RoadGraph | null, point: LatLng): LatLng => {
  if (graph) {
    const match = nearestEdge(graph, point);
    if (match) return match.point;
  }
  return { lat: point.lat, lng: point.lng };
};
