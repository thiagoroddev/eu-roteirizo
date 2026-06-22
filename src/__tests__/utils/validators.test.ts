import { describe, it, expect } from "vitest";
import { isValidValue, isValidNumber, hasValidFileExtension } from "../../utils/validators";

describe("Validation Helpers", () => {
  // ===========================================================================
  // 1. TESTS FOR isValidValue
  // ===========================================================================
  describe("isValidValue", () => {
    it("returns true for valid strings and numbers", () => {
      expect(isValidValue("Hello")).toBe(true);
      expect(isValidValue(123)).toBe(true);
      expect(isValidValue(-50)).toBe(true);
    });

    it("returns true for the number 0 (Critical Case)", () => {
      // In JS, 0 is "falsy", but it is a valid value for Excel.
      // This test ensures that your function does not ignore zero.
      expect(isValidValue(0)).toBe(true);
    });

    it("returns false for null, undefined, or empty string", () => {
      expect(isValidValue(null)).toBe(false);
      expect(isValidValue(undefined)).toBe(false);
      expect(isValidValue("")).toBe(false);
    });
  });

  // ===========================================================================
  // 2. TESTS FOR isValidNumber
  // ===========================================================================
  describe("isValidNumber", () => {
    it("returns true for actual numbers", () => {
      expect(isValidNumber(10)).toBe(true);
      expect(isValidNumber(0)).toBe(true);
      expect(isValidNumber(-10.5)).toBe(true);
    });

    it("returns true for numeric strings", () => {
      expect(isValidNumber("10")).toBe(true);
      expect(isValidNumber("0")).toBe(true);
      expect(isValidNumber("-5.5")).toBe(true);
    });

    it("returns false for NaN", () => {
      expect(isValidNumber(NaN)).toBe(false);
    });

    it("returns false for non-numeric strings and other types", () => {
      expect(isValidNumber("abc")).toBe(false);
      expect(isValidNumber("")).toBe(false); // parseFloat("") é NaN
      expect(isValidNumber(null)).toBe(false);
      expect(isValidNumber(undefined)).toBe(false);
      expect(isValidNumber({})).toBe(false);
    });
  });

  // ===========================================================================
  // 3. TESTS FOR hasValidFileExtension
  // ===========================================================================
  describe("hasValidFileExtension", () => {
    const validExts = [".xlsx", ".csv"];

    it("returns true for exact matches", () => {
      expect(hasValidFileExtension("data.xlsx", validExts)).toBe(true);
      expect(hasValidFileExtension("report.csv", validExts)).toBe(true);
    });

    it("returns true for case-insensitive matches", () => {
      expect(hasValidFileExtension("DATA.XLSX", validExts)).toBe(true);
      expect(hasValidFileExtension("Report.Csv", validExts)).toBe(true);
    });

    it("returns false for invalid extensions", () => {
      expect(hasValidFileExtension("image.png", validExts)).toBe(false);
      expect(hasValidFileExtension("data.pdf", validExts)).toBe(false);
    });

    it("returns false for files without extension", () => {
      expect(hasValidFileExtension("data", validExts)).toBe(false);
    });
  });
});
