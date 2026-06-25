import { describe, it, expect } from "vitest";
import { inferLocationType, resolveLocationType } from "../../utils/inferLocationType";
import { ICON_KEYS, EXCEL_EMPTY_VALUE, COLUMN_NAMES } from "../../constants";
import type { RowData } from "../../types";

describe("inferLocationType", () => {
  // ==========================================================================
  // 1. CENÁRIOS DE DADOS VAZIOS OU ESTRUTURAIS
  // ==========================================================================

  describe("Structural & Empty Checks", () => {
    it("returns EXCEL_EMPTY_VALUE ('-') when address string is empty", () => {
      expect(inferLocationType("")).toBe(EXCEL_EMPTY_VALUE);
    });

    it("returns INDEFINITE when address has valid street/number but NO complement (length < 3)", () => {
      // Este é o caso crítico do "Rua Ibiraci, 158" que discutimos
      const address = "Rua Cardoso de Mesquita, 20";
      expect(inferLocationType(address)).toBe(ICON_KEYS.INDEFINITE);
    });

    it("returns INDEFINITE when complement exists but is empty string", () => {
      const address = "Rua Teste, 10, "; // 3 parts, but the last one is empty after trim
      expect(inferLocationType(address)).toBe(ICON_KEYS.INDEFINITE);
    });

    it("returns INDEFINITE for ambiguous complements", () => {
      expect(inferLocationType("Rua D, 40, Ao cuidado de Maria")).toBe(ICON_KEYS.INDEFINITE);
      expect(inferLocationType("Rua D, 40, Km 50")).toBe(ICON_KEYS.INDEFINITE);
      expect(inferLocationType("Rua D, 40, Muro alto")).toBe(ICON_KEYS.INDEFINITE);
      expect(inferLocationType("Rua D, 40, Muro alto")).toBe(ICON_KEYS.INDEFINITE);
      expect(inferLocationType("Rua D, 40")).toBe(ICON_KEYS.INDEFINITE);
    });

    // ========================================================================================
    // 2. RESIDENTIAL SCENARIOS (HOME_CORRECTED)
    // ========================================================================================

    describe("Residential Inference", () => {
      it("detects standard regex patterns (apt, bl, casa)", () => {
        expect(inferLocationType("Rua A, 10, Apt 101")).toBe(ICON_KEYS.HOME_CORRECTED);
        expect(inferLocationType("Rua A, 10, Bloco 3")).toBe(ICON_KEYS.HOME_CORRECTED);
        expect(inferLocationType("Rua A, 10, Casa 5")).toBe(ICON_KEYS.HOME_CORRECTED);
      });

      it("detects patterns WITHOUT spaces (Typos handled by robust regex)", () => {
        // Regex has been updated to accept \s*(optional space)
        expect(inferLocationType("Rua A, 10, apt102")).toBe(ICON_KEYS.HOME_CORRECTED);
        expect(inferLocationType("Rua A, 10, bl4")).toBe(ICON_KEYS.HOME_CORRECTED);
        expect(inferLocationType("Rua A, 10, casa2")).toBe(ICON_KEYS.HOME_CORRECTED);
      });

      it("detects keywords isolated in the text", () => {
        expect(inferLocationType("Rua A, 10, Fundos")).toBe(ICON_KEYS.HOME_CORRECTED);
        expect(inferLocationType("Rua A, 10, Sobrado")).toBe(ICON_KEYS.HOME_CORRECTED);
        expect(inferLocationType("Rua A, 10, Portão Cinza")).toBe(ICON_KEYS.HOME_CORRECTED);
      });

      it("handles accents and case insensitivity (Normalization)", () => {
        expect(inferLocationType("Rua A, 10, PRÉDIO")).toBe(ICON_KEYS.HOME_CORRECTED); // Prédio -> predio
        expect(inferLocationType("Rua A, 10, térreo")).toBe(ICON_KEYS.HOME_CORRECTED); // Térreo -> terreo
      });

      it("when the complement is only numeric", () => {
        expect(inferLocationType("Rua C, 30, 101")).toBe(ICON_KEYS.HOME_CORRECTED);
        expect(inferLocationType("Rua C, 30, 1202")).toBe(ICON_KEYS.HOME_CORRECTED);
      });
    });

    // ==========================================================================
    // 3. CENÁRIOS COMERCIAIS (OFFICE_CORRECTED)
    // ==========================================================================

    describe("Commercial Inference", () => {
      it("detects standard commercial regex patterns (sala, loja, lj)", () => {
        expect(inferLocationType("Av Centro, 500, Sala 305")).toBe(ICON_KEYS.OFFICE_CORRECTED);
        expect(inferLocationType("Av Centro, 500, Loja B")).toBe(ICON_KEYS.OFFICE_CORRECTED);
        expect(inferLocationType("Av Centro, 500, CJ 12")).toBe(ICON_KEYS.OFFICE_CORRECTED); // Conjunto
        expect(inferLocationType("Av Centro, 500, LJ8")).toBe(ICON_KEYS.OFFICE_CORRECTED);
        expect(inferLocationType("Av Centro, 500, LJ 8")).toBe(ICON_KEYS.OFFICE_CORRECTED);
        expect(inferLocationType("Av Centro, 500, SL 101")).toBe(ICON_KEYS.OFFICE_CORRECTED);
        expect(inferLocationType("Av Centro, 500, SL101")).toBe(ICON_KEYS.OFFICE_CORRECTED);
      });

      it("detects specific commercial keywords", () => {
        expect(inferLocationType("Rua B, 20, Barbearia do Zé")).toBe(ICON_KEYS.OFFICE_CORRECTED);
        expect(inferLocationType("Rua B, 20, Padaria")).toBe(ICON_KEYS.OFFICE_CORRECTED);
        expect(inferLocationType("Rua B, 20, Escola Municipal")).toBe(ICON_KEYS.OFFICE_CORRECTED);
        expect(inferLocationType("Rua B, 20, Oficina Mecânica")).toBe(ICON_KEYS.OFFICE_CORRECTED);
        expect(inferLocationType("Rua B, 20, galeria")).toBe(ICON_KEYS.OFFICE_CORRECTED);
      });

      it("detects time schedules as commercial indicators", () => {
        expect(inferLocationType("Rua B, 20, Entregar até 18h")).toBe(ICON_KEYS.OFFICE_CORRECTED);
        expect(inferLocationType("Rua B, 20, Horário comercial")).toBe(ICON_KEYS.OFFICE_CORRECTED);
      });
    });

    // ========================================================================================
    // 4. PROTECTION SCENARIOS (FALSE POSITIVES)
    // ========================================================================================

    describe("Reference Protection (Avoid False Positives)", () => {
      it("ignores commercial keywords if preceded by 'proximo', 'referencia', etc.", () => {
        // 'market' is a commercial keyword, but 'close to' must protect
        // If it falls into "next", it can become HOME or INDEFINITE, but not OFFICE
        const result = inferLocationType("Rua C, 30, proximo ao mercado");

        // The expected result depends on whether "near" is in the residential list.
        // If "near" is in residentialKeywords, returns HOME.
        // If not, returns INDEFINITE.
        // In your current code, "nearby" IS in residentialKeywords.
        expect(result).not.toBe(ICON_KEYS.OFFICE_CORRECTED);
      });

      it("ignores 'vizinho' reference to commercial establishment", () => {
        // 'neighbor' is in residentialKeywords, so it should return HOME_CORRECTED
        // even if there is a 'workshop' afterwards.
        expect(inferLocationType("Rua C, 30, vizinho a oficina")).toBe(ICON_KEYS.HOME_CORRECTED);
      });
    });
  });
});

describe("resolveLocationType (inferência manda — TASK-RF-016)", () => {
  const row = (over: Record<string, unknown>): RowData => ({ ...over });

  it("infere mesmo sem a coluna Location Type (conserta a rota única)", () => {
    expect(resolveLocationType(row({ [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua A, 10, Apt 101" }))).toBe(ICON_KEYS.HOME_CORRECTED);
    expect(resolveLocationType(row({ [COLUMN_NAMES.DESTINATION_ADDRESS]: "Av Centro, 500, Sala 305" }))).toBe(ICON_KEYS.OFFICE_CORRECTED);
  });

  it("a inferência sobrepõe a coluna (fonte Shopee não-confiável)", () => {
    expect(resolveLocationType(row({ [COLUMN_NAMES.LOCATION_TYPE]: "OFFICE", [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua A, 10, Apt 101" }))).toBe(ICON_KEYS.HOME_CORRECTED);
  });

  it("cai na coluna quando a inferência é indefinida", () => {
    expect(resolveLocationType(row({ [COLUMN_NAMES.LOCATION_TYPE]: "OFFICE", [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Sem Complemento, 20" }))).toBe(ICON_KEYS.OFFICE);
    expect(resolveLocationType(row({ [COLUMN_NAMES.LOCATION_TYPE]: "HOME", [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Sem Complemento, 20" }))).toBe(ICON_KEYS.HOME);
  });

  it("indefinida e sem coluna → INDEFINITE", () => {
    expect(resolveLocationType(row({ [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Sem Complemento, 20" }))).toBe(ICON_KEYS.INDEFINITE);
  });

  it("sem endereço → usa a coluna (ou vazio)", () => {
    expect(resolveLocationType(row({ [COLUMN_NAMES.LOCATION_TYPE]: "OFFICE" }))).toBe(ICON_KEYS.OFFICE);
    expect(resolveLocationType(row({}))).toBe(EXCEL_EMPTY_VALUE);
  });
});
