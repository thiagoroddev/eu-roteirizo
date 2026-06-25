/**
 * Location Type Classification - Core Logic
 *
 * Architecture Note:
 * This file handles the *business logic* of classifying addresses.
 * It strictly returns internal constants (ICON_KEYS, EXCEL_EMPTY_VALUE).
 * It does NOT return UI messages (like "Sem dados") directly in logic functions.
 * UI translation happens only in 'getCommercialDisplayStatus'.
 */

import type { LocationInferenceResult, RowData } from "../types";
import { COLUMN_NAMES, ICON_KEYS, UI_LABELS, EXCEL_EMPTY_VALUE, DATA_STATUS, presentStatus } from "../constants";
import { COMMERCIAL_KEYWORDS, RESIDENTIAL_KEYWORDS } from "../constants/keywords";

/* ============================================================================
   TYPE GUARDS & UTILS
============================================================================ */

/**
 * Validates if an input is a valid RowData object.
 */
function isRowData(arg: unknown): arg is RowData {
  return typeof arg === "object" && arg !== null && !Array.isArray(arg) && COLUMN_NAMES.LOCATION_TYPE in arg;
}

/* ============================================================================
   KEYWORD LISTS (Imported & Normalized)
============================================================================ */

/* ============================================================================
   REGEX PATTERNS (Robust)
============================================================================ */

const justNumberRegex = /^\s*\d+\s*$/; // Only digits with optional spaces
const aptRegex = /\bapt?\s*\d+\b/i; // apt, ap, apto, etc.
const blRegex = /\bbl\s*\.?\s*\d+\b/i; // bl, bl., bloco
const blocoRegex = /\bbloco\s*\d+\b/i; // bloco full word
const salaRegex = /\b(sala|sl|sla)\s*\d+\b/i; // sala
const lojaRegex = /\b(?:loja|lj)\s*\d+\b/i; // loja, lj
const conjuntoRegex = /\b(cj|conjunto)\s*\d+\b/i; // cj, conjunto
const aTantosMetros = /\ba\s*(\d+)\s*(?:m\.?|metro(?:s)?)\b(?:\s*(?:do|da|de))?/i; // a 50m, a 100 metros
const apartamentoRegex = /\bapartamento\s*\d+\b/i; // apartamento full word
const keywordNumberRegex = /\b(?:casa|cs|apt?|apto|aprt|bl|bloco|torre|predio)\s*\d+\b/i; // various keywords with numbers
const sobrelojaRegex = /\b(?:sobreloja|slj)\s*\d+\b/i; // sobreloja, slj
const residentialWordNumberRegex = new RegExp(`\\b(?:${RESIDENTIAL_KEYWORDS.join("|")})\\s*\\d+\\b`, "i"); // residential keywords with numbers
/* ============================================================================
   CORE LOGIC FUNCTIONS
============================================================================ */

/**
 * Analyzes address complement to determine location type.
 * Returns INTERNAL keys only.
 * @param address - The destination address to analyze
 * @returns The inferred location type as an internal key
 */
export function inferLocationType(address: string): LocationInferenceResult {
  if (!address) return EXCEL_EMPTY_VALUE; // No address provided

  const parts = address.split(",").map((p) => p.trim());

  /** Logic: Complement is typically from index 2 onwards */
  let complement = parts.length >= 3 ? parts.slice(2).join(" ") : "";

  if (!complement) return ICON_KEYS.INDEFINITE;

  complement = complement
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
  const cleanComplement = complement.replace(/[^\w\s]/gi, " ");

  /** 1) High priority: Residential Regex */
  if (
    aptRegex.test(complement) ||
    blRegex.test(complement) ||
    blocoRegex.test(complement) ||
    justNumberRegex.test(complement) ||
    aTantosMetros.test(complement) ||
    apartamentoRegex.test(complement) ||
    keywordNumberRegex.test(complement) ||
    residentialWordNumberRegex.test(complement)
  ) {
    return ICON_KEYS.HOME_CORRECTED;
  }

  /** 2) Residential Keywords */
  const cleanWords = cleanComplement.split(/\s+/);
  for (const word of cleanWords) {
    if (RESIDENTIAL_KEYWORDS.includes(word)) {
      return ICON_KEYS.HOME_CORRECTED;
    }
  }

  /** 3) Commercial Regex */
  if (salaRegex.test(complement) || conjuntoRegex.test(complement) || lojaRegex.test(complement) || sobrelojaRegex.test(complement)) {
    return ICON_KEYS.OFFICE_CORRECTED;
  }

  /** 4) Commercial Keywords (Protected) */
  let textForCommercialCheck = cleanComplement;
  const protectedTermsPattern = /\b(referencia|ref|proximo|perto|lado|frente|vizinho)\b.*$/i;
  textForCommercialCheck = textForCommercialCheck.replace(protectedTermsPattern, " ");
  const commercialCheckWords = textForCommercialCheck.split(/\s+/);

  for (const word of commercialCheckWords) {
    if (COMMERCIAL_KEYWORDS.includes(word)) {
      return ICON_KEYS.OFFICE_CORRECTED;
    }
  }

  return ICON_KEYS.INDEFINITE;
}

/**
 * Resolves the final type based on Excel Data + Inference.
 * Returns INTERNAL keys only.
 * @param row - The row data containing location information
 * @returns The resolved location type
 */
export function resolveLocationType(row: RowData) {
  const originalClassification = String(row[COLUMN_NAMES.LOCATION_TYPE] || "")
    .trim()
    .toUpperCase();
  const addr = String(row[COLUMN_NAMES.DESTINATION_ADDRESS] || "").trim();

  /** Sem endereço não há o que inferir — usa a coluna (ou vazio). */
  if (!addr) return originalClassification || EXCEL_EMPTY_VALUE;

  /**
   * DECISÃO (25/06/26 — TASK-RF-016): a inferência roda para **TODO romaneio**, mesmo com a
   * coluna `Location Type` presente, porque a classificação da fonte (Shopee) é não-confiável.
   * A inferência pelo complemento do endereço **manda**; a coluna é só **fallback** quando a
   * inferência fica indefinida. Também conserta a rota única (coluna ausente → `""` → antes a
   * inferência nem rodava, pois o gate só pegava `"-"`/`"HOME"`).
   */
  const inferred = inferLocationType(addr);
  if (inferred === ICON_KEYS.OFFICE_CORRECTED) return ICON_KEYS.OFFICE_CORRECTED;
  if (inferred === ICON_KEYS.HOME_CORRECTED) return ICON_KEYS.HOME_CORRECTED;

  /** Inferência indefinida → cai na coluna, se houver (Office/Home); senão, indefinido. */
  if (originalClassification === ICON_KEYS.OFFICE) return ICON_KEYS.OFFICE;
  if (originalClassification === ICON_KEYS.HOME) return ICON_KEYS.HOME;
  return ICON_KEYS.INDEFINITE;
}

/* ============================================================================
   PRESENTATION LAYER (UI TRANSLATION)
============================================================================ */

type CommercialDisplayLabel = typeof UI_LABELS.COMMON.YES | typeof UI_LABELS.COMMON.NO | typeof UI_LABELS.COMMON.INDISTINCT | string;

/**
 * The ONLY function that translates internal types to UI Strings.
 * "Sim" | "Não" | "Indistinto" | "Sem dados"
 * @param arg - The row data or classification string to display
 * @returns The display label for commercial status
 */
export function getCommercialDisplayStatus(arg: RowData | string | undefined): CommercialDisplayLabel {
  let finalClassification = "";

  /** 1. Extract the internal key/status */
  if (isRowData(arg)) {
    finalClassification = resolveLocationType(arg).toUpperCase();
  } else {
    finalClassification = String(arg ?? "")
      .trim()
      .toUpperCase();
  }

  // 2. Map Internal Key -> UI Label

  /** Case A: Missing or Empty Data */
  if (!finalClassification || finalClassification === EXCEL_EMPTY_VALUE) {
    return presentStatus(DATA_STATUS.MISSING);
  }

  /** Case B: Commercial Types */
  if (finalClassification === ICON_KEYS.OFFICE || finalClassification === ICON_KEYS.OFFICE_CORRECTED) {
    return UI_LABELS.COMMON.YES;
  }

  /** Case C: Residential Types */
  if (finalClassification === ICON_KEYS.HOME || finalClassification === ICON_KEYS.HOME_CORRECTED) {
    return UI_LABELS.COMMON.NO;
  }

  /** Case D: Indefinite (Logic ran but couldn't decide) */
  if (finalClassification === ICON_KEYS.INDEFINITE) {
    return UI_LABELS.COMMON.INDISTINCT;
  }

  /** Fallback for unexpected data */
  return presentStatus(DATA_STATUS.UNKNOWN);
}

/**
 * Helper for counting statistics
 * @param rows - Array of row data to count from
 * @param availableCols - Available columns in the data
 * @returns The count of commercial addresses as a string
 */
export const countCommercialAddresses = (rows: RowData[], availableCols: string[] | null): string => {
  if (!availableCols?.includes(COLUMN_NAMES.LOCATION_TYPE)) return presentStatus(DATA_STATUS.MISSING);

  const total = rows.filter((row) => {
    const classification = resolveLocationType(row).toUpperCase();
    return classification === ICON_KEYS.OFFICE || classification === ICON_KEYS.OFFICE_CORRECTED;
  }).length;

  return String(total);
};
