/**
 * utils/missingValue.ts - "este campo tem dado?" (TASK-REF-017).
 *
 * A camada de dados do Sumário (`useRouteSummary` + `formatters`) devolve STRING
 * PRONTA, já traduzindo ausência para `"Sem dados"` / `"Dado inválido"` / `"-"`.
 * O redesenho precisa OMITIR o card quando não há dado, então a detecção é feita
 * por sentinela aqui, num lugar só.
 *
 * ⚠️ Limitação conhecida: uma célula da planilha que contenha literalmente o
 * texto "Sem dados" é indistinguível de ausência. O conserto limpo é a camada de
 * dados devolver status + valor (anotado como fora de escopo na REF-017).
 */

import { UI_LABELS } from "../constants/uiLabels";

const MISSING_SENTINELS: ReadonlySet<string> = new Set([UI_LABELS.COMMON.NO_DATA, UI_LABELS.INFO.INVALID_DATA, "-", ""]);

/** True quando o valor representa ausência de dado (não deve virar card/linha). */
export const isMissingValue = (value: string | null | undefined): boolean => value == null || MISSING_SENTINELS.has(value.trim());
