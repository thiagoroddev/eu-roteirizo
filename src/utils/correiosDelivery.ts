/**
 * Correios (Brazil postal service) delivery lookup helper
 *
 * This module provides a small utility to determine whether Correios
 * performs home delivery for a given CEP (Brazilian postal code).
 *
 * The data source is a pre-generated JSON file `src/data/risco_correios.json`.
 * Each CEP key maps to an object with delivery information collected from
 * Correios.
 *
 * The functions below are intentionally simple and safe for beginners:
 * - Input is sanitized before lookup
 * - Return values are human-friendly short strings
 */

// Import the pre-collected Correios data (a map of CEP -> entry)
import correiosRiskData from "../data/zipcodes-delivery-status-correios.json";
import { DELIVERY_KEYS } from "../constants"; // <--- Importando constantes
import type { CorreiosEntry } from "../types"; // <--- Importando tipo CorreiosEntry

// Tell TypeScript that the imported JSON follows the CorreiosEntry shape.
// This allows safe lookup by CEP (string key).
const correiosDataMap = correiosRiskData as Record<string, CorreiosEntry>;

/**
 * Friendly return type used by the exported helper.
 * - "Sim" : Correios delivers at home for this CEP
 * - "Não" : Correios does not deliver at home for this CEP
 * - MESSAGES.INFO.NO_DATA : No valid CEP provided or CEP not present in the dataset
 */
export type CorreiosDeliveryStatus = typeof DELIVERY_KEYS.YES | typeof DELIVERY_KEYS.NO | undefined;

/**
 * sanitizeCep
 *
 * Accepts many input types (string, number, etc.) and extracts
 * a valid 8-digit CEP string. Returns `null` when input is invalid.
 *
 * For beginners: CEPs are 8 digits in Brazil. This function removes
 * punctuation (like '-') and whitespace, then checks length.
 *
 * @param {unknown} rawValue - The raw input value that may contain a CEP
 * @returns {string | undefined} The sanitized 8-digit CEP string, or undefined if invalid
 */
function sanitizeCep(rawValue: unknown): string | undefined {
  /** Only accept strings or numbers — everything else is rejected */
  if (typeof rawValue !== "string" && typeof rawValue !== "number") return undefined;

  /** Convert to string (numbers become their decimal representation) */
  const rawString = String(rawValue);

  /** Remove all non-digit characters (e.g., dots, dashes, spaces) */
  const onlyDigits = rawString.replace(/\D/g, "");

  /** CEP must have exactly 8 digits */
  if (onlyDigits.length !== 8) return undefined;

  return onlyDigits;
}

/**
 * getCorreiosDeliveryStatus
 *
 * Main exported function. Given a value that may contain a CEP (string/number),
 * it returns a human-friendly status:
 * - "Sim" when Correios performs home delivery for that CEP
 * - "Não" when Correios does not deliver at home for that CEP
 * - undefined when input is invalid or CEP is missing in the dataset
 *
 * @param {unknown} value - The value that may contain a CEP (string, number, etc.)
 * @returns {CorreiosDeliveryStatus} The delivery status or undefined if invalid/missing
 *
 * @example
 * ```ts
 * getCorreiosDeliveryStatus("12345-678") // -> "YES" | "NO" | undefined
 * getCorreiosDeliveryStatus(12345678)    // -> "YES" | "NO" | undefined
 * ```
 */
export function getCorreiosDeliveryStatus(value: unknown): CorreiosDeliveryStatus {
  /** Sanitize input to extract valid CEP */
  const cep = sanitizeCep(value);
  if (!cep) return undefined;

  /** Look up the CEP in our dataset */
  const entry = correiosDataMap[cep];
  if (!entry) return undefined;

  /** Return friendly status based on delivery flag */
  return entry.homeDelivery === "Yes" ? DELIVERY_KEYS.YES : DELIVERY_KEYS.NO;
}
