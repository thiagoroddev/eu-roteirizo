/**
 * Address classification cases (TASK-BG-021, AUD-002-B01).
 *
 * Single source for two consumers that must never disagree:
 * - inferLocationType.test.ts asserts every case in code;
 * - __utilidades-back-office__/roteiros-ficticios/gerar-roteiro-classificacao.ts turns the same
 *   cases into a fake route the human imports to check the screen, without hunting real addresses.
 *
 * Dependency-free on purpose: the back-office script imports it with plain Node.
 */

export type ExpectedClassification = "commercial" | "residential" | "indistinct";

export interface AddressClassificationCase {
  /** Stable number, shown in the fake route's street name. */
  id: number;
  /** Everything after "street, number," — the only part the classifier reads. */
  complement: string;
  expected: ExpectedClassification;
  /** Why the case exists. */
  reason: string;
}

/** Key of UI_LABELS.COMMON that the "Horário Comercial?" column shows for each expectation. */
export const EXPECTED_LABEL_KEY = {
  commercial: "YES",
  residential: "NO",
  indistinct: "INDISTINCT",
} as const satisfies Record<ExpectedClassification, string>;

export const ADDRESS_CLASSIFICATION_CASES: readonly AddressClassificationCase[] = [
  { id: 1, complement: "Tech Solutions", expected: "commercial", reason: "keyword tech (TASK-BG-017)" },
  { id: 2, complement: "Empório Central", expected: "commercial", reason: "keyword emporio, accent stripped (TASK-BG-017)" },
  { id: 3, complement: "Sobreloja", expected: "commercial", reason: "keyword sobreloja without number (TASK-BG-017)" },
  { id: 4, complement: "Sobreloja 2", expected: "commercial", reason: "numbered sobreloja, commercial regex" },
  { id: 5, complement: "Grill do Zé", expected: "commercial", reason: "keyword grill (TASK-BG-017)" },
  { id: 6, complement: "Vitrine Modas", expected: "commercial", reason: "keyword vitrine (TASK-BG-017)" },
  { id: 7, complement: "Teatro Municipal", expected: "commercial", reason: "keyword teatro (TASK-BG-017)" },
  { id: 8, complement: "Drogarias Rio", expected: "commercial", reason: "plural listed on its own: whole-word match (TASK-BG-017)" },
  { id: 9, complement: "Drogaria Rio", expected: "commercial", reason: "singular control for case 8" },
  { id: 10, complement: "Edifício Cristal", expected: "indistinct", reason: "edificio is not a keyword: ambiguous (AUD-002-B01)" },
  { id: 11, complement: "Falar com o zelador", expected: "indistinct", reason: "zelador is not a keyword: ambiguous (AUD-002-B01)" },
  { id: 12, complement: "Edifício Central, sala 302", expected: "commercial", reason: "numbered room decides; was residential while edificio was a keyword" },
  { id: 13, complement: "Sala 302, Edifício Central", expected: "commercial", reason: "case 12 in reverse order" },
  { id: 14, complement: "Ed. Central, sala 302", expected: "commercial", reason: "abbreviation must agree with case 12" },
  { id: 15, complement: "Edifício Empresarial, loja 5", expected: "commercial", reason: "numbered store inside a building" },
  { id: 16, complement: "Zelador, sala 10", expected: "commercial", reason: "numbered room with a doorman mention" },
  { id: 17, complement: "Edifício Tech Tower", expected: "commercial", reason: "commercial keyword inside a building name" },
  // Cases 18 and 19 pin today's result, not the desired one: the human disagreed at validation and
  // the fix belongs to a sturdier inference method (DT-009). Flip them when that debt is paid.
  { id: 18, complement: "Empório da Vila", expected: "residential", reason: "known error DT-009: company name, vila is checked first" },
  { id: 19, complement: "Ao lado do Teatro", expected: "residential", reason: "known limit DT-009: lado is residential, expected questioned" },
  { id: 20, complement: "Andar 5, sala 302", expected: "commercial", reason: "andar left out on purpose (TASK-BG-017); the room decides" },
  { id: 21, complement: "apto 101", expected: "residential", reason: "control: numbered apartment" },
  { id: 22, complement: "sala 302", expected: "commercial", reason: "control: numbered room" },
  { id: 23, complement: "Farmácias Popular", expected: "indistinct", reason: "known gap: plural not listed (AUD-002-O11)" },
  { id: 24, complement: "", expected: "indistinct", reason: "control: no complement" },
  { id: 25, complement: "Edifício 200", expected: "indistinct", reason: "edificio + number no longer matches the residential number rule" },
  { id: 26, complement: "Edifício Cristal, apto 101", expected: "residential", reason: "numbered apartment stays residential inside a building" },
];

/**
 * The address exactly as the fake route carries it. The street holds the case number and the
 * expected label, which the classifier ignores: it reads only from the second comma on.
 */
export const caseAddress = (c: AddressClassificationCase, expectedLabel: string): string => {
  const street = `Caso ${c.id} esperado ${expectedLabel}`;
  return c.complement ? `${street}, 10, ${c.complement}` : `${street}, 10`;
};
