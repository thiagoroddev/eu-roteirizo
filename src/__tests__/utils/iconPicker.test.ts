import { describe, it, expect } from "vitest";
import { pickIconKey, wasLocationTypeCorrected } from "../../utils/iconPicker";
import { ICON_KEYS, EXCEL_EMPTY_VALUE } from "../../constants";

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
  // (TASK-REF-007: sem variantes de entrega dos Correios — apenas tipo de local)
  // ==========================================================================

  describe("pickIconKey", () => {
    describe("Residential (HOME)", () => {
      it("returns HOME when NOT corrected", () => {
        expect(pickIconKey(ICON_KEYS.HOME, "HOME")).toBe(ICON_KEYS.HOME);
      });

      it("returns HOME_CORRECTED when inferred (from '-' to HOME)", () => {
        expect(pickIconKey(ICON_KEYS.HOME_CORRECTED, EXCEL_EMPTY_VALUE)).toBe(ICON_KEYS.HOME_CORRECTED);
      });

      it("returns plain HOME when 'corrected' but base equals the original", () => {
        // c = HOME_CORRECTED, o = HOME → não houve mudança de tipo → HOME simples
        expect(pickIconKey(ICON_KEYS.HOME_CORRECTED, "HOME")).toBe(ICON_KEYS.HOME);
      });
    });

    describe("Commercial (OFFICE)", () => {
      it("returns OFFICE when NOT corrected", () => {
        expect(pickIconKey(ICON_KEYS.OFFICE, "OFFICE")).toBe(ICON_KEYS.OFFICE);
      });

      it("returns OFFICE_CORRECTED when inferred (from '-' to OFFICE)", () => {
        expect(pickIconKey(ICON_KEYS.OFFICE_CORRECTED, EXCEL_EMPTY_VALUE)).toBe(ICON_KEYS.OFFICE_CORRECTED);
      });

      it("returns plain OFFICE when 'corrected' but base equals the original", () => {
        expect(pickIconKey(ICON_KEYS.OFFICE_CORRECTED, "OFFICE")).toBe(ICON_KEYS.OFFICE);
      });
    });

    describe("Indefinite / Unknown", () => {
      it("returns INDEFINITE for indefinite classification", () => {
        expect(pickIconKey(ICON_KEYS.INDEFINITE, EXCEL_EMPTY_VALUE)).toBe(ICON_KEYS.INDEFINITE);
      });

      it("handles null/undefined inputs gracefully", () => {
        expect(pickIconKey(undefined, undefined)).toBe(ICON_KEYS.INDEFINITE);
      });
    });
  });
});
