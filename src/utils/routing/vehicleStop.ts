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

import type { DeliveryPoint, LatLng } from "../../types/routing";
import type { RoadGraph } from "./graph";
import { nearestEdge, nearestEdgeByTiers, hasRealStreetName, type EdgeTier } from "./match";
import { isSameStreetName, normalizeStreetName } from "./streets";
import { haversine } from "./geo";

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

/**
 * ⚙️ MANUAL KNOB — até onde a rua do próprio endereço ainda vale como âncora.
 * Além disso, um logradouro de mesmo nome é outro trecho da cidade (ou o
 * geocódigo do romaneio está errado), e projetar lá seria pior que usar a rua
 * nomeada mais próxima. Generoso de propósito: condomínio fechado com recuo
 * grande ainda cabe.
 */
const STREET_NAME_MATCH_MAX_METERS = 250;

/**
 * A parada PADRÃO do veículo para um endereço (TASK-BG-016).
 *
 * Diferente de `suggestVehicleStop`, que projeta no asfalto mais próximo e
 * serve ao ARRASTO manual (ali a posição é escolha do usuário), esta responde
 * "onde o carro para para entregar NESTE endereço" — e a resposta é a rua do
 * endereço. O asfalto mais próximo não serve: para um prédio recuado, ele é a
 * via interna do condomínio (`highway=service`, quase sempre sem `name` no
 * OSM), que não é endereço de ninguém e fazia o carro parar dentro do lote.
 *
 * Três níveis, resolvidos em UMA varredura (`nearestEdgeByTiers`):
 * 1. a via cujo nome casa com o logradouro, dentro de `STREET_NAME_MATCH_MAX_METERS`;
 * 2. senão, a via NOMEADA mais próxima (nome de verdade ⇒ não é acesso interno);
 * 3. senão, a aresta mais próxima — o comportamento antigo, para o caso em que
 *    só existe via de serviço por perto (galpão, condomínio industrial).
 *
 * @param graph - O grafo de ruas, ou `null` enquanto indisponível (carregando/offline).
 * @param point - A coordenada do endereço.
 * @param addressStreet - O logradouro do endereço (`streetNameOf(point.address)`).
 * @returns A posição da parada padrão, ou o próprio ponto sem grafo.
 */
export const defaultVehicleStop = (graph: RoadGraph | null, point: LatLng, addressStreet: string): LatLng => {
  if (!graph) return { lat: point.lat, lng: point.lng };

  // `isSameStreetName` responde `true` quando um dos lados é vazio (é o certo
  // para ROTULAR, não para DECIDIR): sem esta guarda, endereço sem logradouro
  // casaria com a primeira via de serviço e o nível 1 viraria o bug de novo.
  const street = normalizeStreetName(addressStreet) ? addressStreet : "";
  const tiers: EdgeTier[] = [
    (edge, distance) => street !== "" && distance <= STREET_NAME_MATCH_MAX_METERS && hasRealStreetName(edge) && isSameStreetName(street, edge.wayName),
    (edge) => hasRealStreetName(edge),
    () => true,
  ];
  const [byName, namedStreet, anyEdge] = nearestEdgeByTiers(graph, point, tiers);
  const match = byName ?? namedStreet ?? anyEdge;
  return match ? match.point : { lat: point.lat, lng: point.lng };
};

/**
 * The stop's DEFAULT anchor seed (TASK-RF-006.6, decision 17/07): the address
 * of the stop NEAREST to where the vehicle comes from — the previous stop's
 * anchor, or the route start for the first stop. The vehicle parks where it
 * arrives, not in front of whichever address the user happened to tap.
 *
 * Pure geometry (haversine): the caller projects the result onto the street
 * with `suggestVehicleStop`. Creating a stop and resetting its anchor use THIS
 * same rule — that is what makes "resetar volta ao padrão" true and lets the
 * reset button hide itself while the anchor is still the default.
 *
 * @param points - The stop's points (members).
 * @param origin - Where the vehicle comes from; null when unknown (no start yet).
 * @returns The nearest point to `origin`, the first point when `origin` is null,
 *          or null when there are no points.
 */
export const defaultAnchorSeed = (points: DeliveryPoint[], origin: LatLng | null): DeliveryPoint | null => {
  if (points.length === 0) return null;
  if (!origin) return points[0];
  let best = points[0];
  let bestDistance = haversine(origin, best);
  for (const point of points.slice(1)) {
    const distance = haversine(origin, point);
    if (distance < bestDistance) {
      best = point;
      bestDistance = distance;
    }
  }
  return best;
};
