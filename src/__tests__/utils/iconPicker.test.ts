import { describe, it, expect } from "vitest";
import { pickIconKey, wasLocationTypeCorrected } from "../../utils/iconPicker";
import { ICON_KEYS, DELIVERY_KEYS, EXCEL_EMPTY_VALUE } from "../../constants";

describe("iconPicker Utilities", () => {
  // ==========================================================================
  // 1. TESTES DO HELPER: wasLocationTypeCorrected
  // ==========================================================================

  describe("wasLocationTypeCorrected", () => {
    it("returns false if final classification is empty", () => {
      expect(wasLocationTypeCorrected("HOME", "")).toBe(false);
    });

    it("returns false if final classification does not contain 'CORRECTED'", () => {
      expect(wasLocationTypeCorrected("-", "HOME")).toBe(false);
      expect(wasLocationTypeCorrected("HOME", "HOME")).toBe(false);
    });

    it("returns true if corrected and original is different from base", () => {
      // Era "-" (vazio), virou "HOME_CORRECTED" -> Correção Real
      expect(wasLocationTypeCorrected("-", "HOME_CORRECTED")).toBe(true);

      // Era "OFFICE", virou "HOME_CORRECTED" -> Correção Real
      expect(wasLocationTypeCorrected("OFFICE", "HOME_CORRECTED")).toBe(true);
    });

    it("returns false if final implies correction but matches original base", () => {
      // Tecnicamente estranho, mas se era HOME e virou HOME_CORRECTED,
      // a base é igual, então a lógica atual retorna false (não houve mudança de tipo)
      expect(wasLocationTypeCorrected("HOME", "HOME_CORRECTED")).toBe(false);
    });
  });

  // ==========================================================================
  // 2. TESTES PRINCIPAIS: pickIconKey
  // ==========================================================================

  describe("pickIconKey", () => {
    // --- CENÁRIOS RESIDENCIAIS (HOME) ---

    describe("Residential (HOME)", () => {
      it("returns basic HOME icons when NOT corrected", () => {
        // Original era HOME, Final é HOME (Normal)
        expect(pickIconKey(ICON_KEYS.HOME, "HOME", undefined)).toBe(ICON_KEYS.HOME);

        // Com entrega dos Correios
        expect(pickIconKey(ICON_KEYS.HOME, "HOME", DELIVERY_KEYS.YES)).toBe(ICON_KEYS.HOME_WITH_DELIVERY);

        // Sem entrega dos Correios
        expect(pickIconKey(ICON_KEYS.HOME, "HOME", DELIVERY_KEYS.NO)).toBe(ICON_KEYS.HOME_WITHOUT_DELIVERY);
      });

      it("returns CORRECTED icons when type was inferred (from '-' to 'HOME')", () => {
        // Original era "-" (Vazio), Final é HOME_CORRECTED

        // Sem dados de correios
        expect(pickIconKey(ICON_KEYS.HOME_CORRECTED, EXCEL_EMPTY_VALUE, undefined)).toBe(ICON_KEYS.HOME_CORRECTED);

        // Com entrega (Corrigido + Entrega)
        expect(pickIconKey(ICON_KEYS.HOME_CORRECTED, EXCEL_EMPTY_VALUE, DELIVERY_KEYS.YES)).toBe(ICON_KEYS.HOME_WITH_DELIVERY_CORRECTED);

        // Sem entrega (Corrigido + Sem Entrega)
        expect(pickIconKey(ICON_KEYS.HOME_CORRECTED, EXCEL_EMPTY_VALUE, DELIVERY_KEYS.NO)).toBe(ICON_KEYS.HOME_WITHOUT_DELIVERY_CORRECTED);
      });
    });

    // --- CENÁRIOS COMERCIAIS (OFFICE) ---

    describe("Commercial (OFFICE)", () => {
      it("returns basic OFFICE icons when NOT corrected", () => {
        // Original era OFFICE (Confiança total no Excel)
        expect(pickIconKey(ICON_KEYS.OFFICE, "OFFICE", undefined)).toBe(ICON_KEYS.OFFICE);

        // Com entrega
        expect(pickIconKey(ICON_KEYS.OFFICE, "OFFICE", DELIVERY_KEYS.YES)).toBe(ICON_KEYS.OFFICE_WITH_DELIVERY);

        // Sem entrega
        expect(pickIconKey(ICON_KEYS.OFFICE, "OFFICE", DELIVERY_KEYS.NO)).toBe(ICON_KEYS.OFFICE_WITHOUT_DELIVERY);
      });

      it("returns CORRECTED icons when type was inferred (from '-' to 'OFFICE')", () => {
        // Original era "-", Final é OFFICE_CORRECTED

        // Sem correios
        expect(pickIconKey(ICON_KEYS.OFFICE_CORRECTED, EXCEL_EMPTY_VALUE, undefined)).toBe(ICON_KEYS.OFFICE_CORRECTED);

        // Com entrega
        expect(pickIconKey(ICON_KEYS.OFFICE_CORRECTED, EXCEL_EMPTY_VALUE, DELIVERY_KEYS.YES)).toBe(ICON_KEYS.OFFICE_WITH_DELIVERY_CORRECTED);

        // Sem entrega
        expect(pickIconKey(ICON_KEYS.OFFICE_CORRECTED, EXCEL_EMPTY_VALUE, DELIVERY_KEYS.NO)).toBe(ICON_KEYS.OFFICE_WITHOUT_DELIVERY_CORRECTED);
      });
    });

    // --- CENÁRIOS INDEFINIDOS / FALLBACK ---

    describe("Indefinite / Unknown", () => {
      it("returns INDEFINITE variants based on delivery status", () => {
        // Classificação falhou ou é indefinida

        // Com entrega
        expect(pickIconKey(ICON_KEYS.INDEFINITE, EXCEL_EMPTY_VALUE, DELIVERY_KEYS.YES)).toBe(ICON_KEYS.INDEFINITE_WITH_DELIVERY);

        // Sem entrega
        expect(pickIconKey(ICON_KEYS.INDEFINITE, EXCEL_EMPTY_VALUE, DELIVERY_KEYS.NO)).toBe(ICON_KEYS.INDEFINITE_WITHOUT_DELIVERY);

        // Sem dados de entrega
        expect(pickIconKey(ICON_KEYS.INDEFINITE, EXCEL_EMPTY_VALUE, undefined)).toBe(ICON_KEYS.INDEFINITE);
      });

      it("handles null/undefined inputs gracefully", () => {
        // Proteção contra crash se tudo for undefined
        expect(pickIconKey(undefined, undefined, undefined)).toBe(ICON_KEYS.INDEFINITE);
      });
    });
  });
});
