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

import type { DeliveryPoint, PlannedRoute, RoteiroSummary } from "../../types/routing";
import { assignedPointIds } from "./selectors";
import { UI_LABELS } from "../../constants/uiLabels";

export type RoteiroStatusKind = "none" | "building" | "executing" | "finished";

export interface RoteiroPresentation {
  kind: RoteiroStatusKind;
  /** Full text label for headers / banners (e.g. "Roteiro em execução — 0% concluído") */
  label: string;
  /** Short label for badges and compact cards (e.g. "Em construção (45%)", "Em execução") */
  badgeLabel: string;
  /** Badge variant for shadcn/ui Badge */
  badgeVariant: "default" | "secondary" | "outline";
  /** Semantic color class for icons / highlights */
  colorClass: string;
  /** Percentage of construction (0..100) */
  buildPercent: number;
  /** Percentage of execution/delivery (0..100) */
  deliveredPercent: number;
  /** Coverage description (e.g. "36 de 51 endereços" or empty) */
  coverageText: string;
  /** Whether the route has mesh-computed summary data */
  hasSummary: boolean;
}

export interface RoteiroStatus {
  kind: "building" | "executing" | "finished";
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

/**
 * Returns unified visual presentation for a planned route's status across Summary, Map, and Routes list.
 */
export const getRoteiroPresentation = (status: RoteiroStatus | null | undefined): RoteiroPresentation => {
  if (!status) {
    return {
      kind: "none",
      label: UI_LABELS.ROTEIRO_INFO.STATUS_NONE,
      badgeLabel: UI_LABELS.ROTEIRO_INFO.STATUS_NONE,
      badgeVariant: "outline",
      colorClass: "text-muted-foreground",
      buildPercent: 0,
      deliveredPercent: 0,
      coverageText: "",
      hasSummary: false,
    };
  }

  const buildPercent = Math.round(status.ratio * 100);
  const coverageText = UI_LABELS.ROTEIRO_INFO.STATUS_COVERAGE(status.assignedAddresses, status.totalAddresses);

  if (status.kind === "building") {
    return {
      kind: "building",
      label: UI_LABELS.ROTEIRO_INFO.STATUS_BUILDING,
      badgeLabel: `Em construção (${buildPercent}%)`,
      badgeVariant: "secondary",
      colorClass: "text-amber-500",
      buildPercent,
      deliveredPercent: status.deliveredPercent,
      coverageText,
      hasSummary: false,
    };
  }

  if (status.kind === "finished") {
    return {
      kind: "finished",
      label: UI_LABELS.ROTEIRO_INFO.STATUS_FINISHED,
      badgeLabel: "Finalizado",
      badgeVariant: "default",
      colorClass: "text-emerald-500",
      buildPercent: 100,
      deliveredPercent: status.deliveredPercent,
      coverageText,
      hasSummary: true,
    };
  }

  return {
    kind: "executing",
    label: UI_LABELS.ROTEIRO_INFO.STATUS_EXECUTING(status.deliveredPercent),
    badgeLabel: "Em execução",
    badgeVariant: "default",
    colorClass: "text-primary",
    buildPercent: 100,
    deliveredPercent: status.deliveredPercent,
    coverageText,
    hasSummary: true,
  };
};

/**
 * Derives presentation from saved roteiro existence and its persisted mesh summary (used in Routes list).
 */
export const getRoteiroPresentationFromSummary = (hasRoteiro: boolean, summary?: RoteiroSummary | null): RoteiroPresentation => {
  if (!hasRoteiro) {
    return getRoteiroPresentation(null);
  }

  if (!summary) {
    return {
      kind: "building",
      label: UI_LABELS.ROTEIRO_INFO.STATUS_BUILDING,
      badgeLabel: "Roteiro salvo",
      badgeVariant: "secondary",
      colorClass: "text-amber-500",
      buildPercent: 0,
      deliveredPercent: 0,
      coverageText: "",
      hasSummary: false,
    };
  }

  const ratio = summary.progressRatio ?? 0;
  const buildPercent = Math.round(ratio * 100);

  if (ratio < 1) {
    return {
      kind: "building",
      label: UI_LABELS.ROTEIRO_INFO.STATUS_BUILDING,
      badgeLabel: `Em construção (${buildPercent}%)`,
      badgeVariant: "secondary",
      colorClass: "text-amber-500",
      buildPercent,
      deliveredPercent: 0,
      coverageText: "",
      hasSummary: true,
    };
  }

  return {
    kind: "executing",
    label: UI_LABELS.ROTEIRO_INFO.STATUS_EXECUTING(0),
    badgeLabel: "Em execução",
    badgeVariant: "default",
    colorClass: "text-primary",
    buildPercent: 100,
    deliveredPercent: 0,
    coverageText: "",
    hasSummary: true,
  };
};
