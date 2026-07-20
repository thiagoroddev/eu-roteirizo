/**
 * utils/routing/status.ts - Estado de um roteiro salvo (TASK-REF-017).
 *
 * Três estados (vocabulário do humano 19/07):
 * - `building`  — "Roteiro em construção (rascunho incompleto)": nem todos os
 *                 endereços do romaneio estão atribuídos a paradas;
 * - `executing` — "Roteiro em execução — X% concluído": construção fechada,
 *                 entregas em andamento;
 * - `finished`  — "Roteiro finalizado — 100%": todas as entregas concluídas.
 *
 * ⚠️ O progresso de EXECUÇÃO entra por parâmetro (`deliveredRatio`) porque nada
 * o registra ainda — isso é a **RF-009**. Sem ele, um roteiro com a construção
 * fechada lê `executing` a 0%. Quando a RF-009 existir, basta passar o valor:
 * os chamadores não mudam.
 */

import type { DeliveryPoint, PlannedRoute } from "../../types/routing";
import { assignedPointIds } from "./selectors";

export type RoteiroStatusKind = "building" | "executing" | "finished";

export interface RoteiroStatus {
  kind: RoteiroStatusKind;
  /** Endereços já atribuídos a alguma parada. */
  assignedAddresses: number;
  /** Endereços do romaneio (denominador). */
  totalAddresses: number;
  /** 0..1 — cobertura da CONSTRUÇÃO (base endereços, igual à barra do painel). */
  ratio: number;
  /** 0..100 — percentual de ENTREGAS concluídas (0 até a RF-009 existir). */
  deliveredPercent: number;
}

/**
 * Estado do roteiro em relação ao romaneio atual. Pontos que a planilha não tem
 * mais são ignorados (espelha o HYDRATE defensivo).
 *
 * @param route - O roteiro salvo.
 * @param points - Os endereços do romaneio atual.
 * @param deliveredRatio - 0..1 de entregas concluídas (RF-009); ausente = 0.
 */
export const plannedRouteStatus = (route: PlannedRoute, points: DeliveryPoint[], deliveredRatio?: number): RoteiroStatus => {
  const assigned = assignedPointIds(route.stops);
  const totalAddresses = points.length;
  const assignedAddresses = points.filter((point) => assigned.has(point.id)).length;
  const built = totalAddresses > 0 && assignedAddresses === totalAddresses;
  const delivered = Math.min(1, Math.max(0, deliveredRatio ?? 0));
  const deliveredPercent = Math.round(delivered * 100);

  return {
    kind: !built ? "building" : delivered >= 1 ? "finished" : "executing",
    assignedAddresses,
    totalAddresses,
    ratio: totalAddresses === 0 ? 0 : assignedAddresses / totalAddresses,
    deliveredPercent,
  };
};
