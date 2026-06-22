import { describe, it, expect, vi, afterEach } from "vitest";
import { safeGetFirst, safeGetLast } from "../../utils/safeGetData";
import { DATA_STATUS, COLUMN_NAMES } from "../../constants";

// =============================================================================
// MOCKS
// =============================================================================

// We mocked the validator to have full control over what is considered "valid"
// This ensures that the test focuses on SEARCH logic (First/Last), not validation.
vi.mock("../utils/validators", () => ({
  isValidValue: vi.fn((val) => {
    // Simulation: Null, undefined and empty string are invalid for search
    // But we allow "-" to pass to test the specific logic of DATA_STATUS.EMPTY
    return val !== null && val !== undefined && val !== "";
  }),
}));

describe("safeGetData Utilities", () => {
  // Dados de teste reutilizáveis
  const mockRows = [
    { [COLUMN_NAMES.CITY]: null, [COLUMN_NAMES.SEQUENCE]: 1 }, // Line 0: Invalid
    { [COLUMN_NAMES.CITY]: "Rio", [COLUMN_NAMES.SEQUENCE]: 2 }, // Line 1: Valid (First)
    { [COLUMN_NAMES.CITY]: "Niteroi", [COLUMN_NAMES.SEQUENCE]: 3 }, // Line 2: Valid (Last)
    { [COLUMN_NAMES.CITY]: undefined, [COLUMN_NAMES.SEQUENCE]: 4 }, // Line 3: Invalid
  ];

  const cols = [COLUMN_NAMES.CITY, COLUMN_NAMES.SEQUENCE];

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ==========================================================================
  // 1. TESTS FOR safeGetFirst
  // ==========================================================================
  describe("safeGetFirst", () => {
    it("returns DATA_STATUS.MISSING if rows array is empty or undefined", () => {
      expect(safeGetFirst([], "City", cols)).toBe(DATA_STATUS.MISSING);
      expect(safeGetFirst(undefined, "City", cols)).toBe(DATA_STATUS.MISSING);
    });

    it("returns DATA_STATUS.MISSING if column is not in availableCols", () => {
      // Column "Zipcode" is not in the 'cols' list defined above
      expect(safeGetFirst(mockRows, "Zipcode", cols)).toBe(DATA_STATUS.MISSING);
    });

    it("returns DATA_STATUS.MISSING if availableCols is null", () => {
      expect(safeGetFirst(mockRows, "City", null)).toBe(DATA_STATUS.MISSING);
    });

    it("returns the FIRST valid value found (skipping nulls/undefined)", () => {
      // You must skip line 0 (null) and take line 1 ("Rio")
      const result = safeGetFirst(mockRows, COLUMN_NAMES.CITY, cols);
      expect(result).toBe("Rio");
    });

    it("returns DATA_STATUS.MISSING if all values in column are invalid", () => {
      const badRows = [{ City: null }, { City: undefined }];
      const result = safeGetFirst(badRows, "City", ["City"]);
      expect(result).toBe(DATA_STATUS.MISSING);
    });

    it("returns DATA_STATUS.EMPTY if the value found is '-' (Excel Empty)", () => {
      // Scenario where the validator lets "-" pass, but the function must treat it as EMPTY
      const hyphenRows = [{ City: "-" }];
      const result = safeGetFirst(hyphenRows, "City", ["City"]);
      expect(result).toBe(DATA_STATUS.EMPTY);
    });
  });

  // ==========================================================================
  // 2. TESTS FOR safeGetLast
  // ==========================================================================
  describe("safeGetLast", () => {
    it("returns DATA_STATUS.MISSING if rows array is empty or undefined", () => {
      expect(safeGetLast([], "City", cols)).toBe(DATA_STATUS.MISSING);
      expect(safeGetLast(undefined, "City", cols)).toBe(DATA_STATUS.MISSING);
    });

    it("returns the LAST valid value found", () => {
      // You should take line 2 ("Niteroi") and ignore line 3 (undefined)
      const result = safeGetLast(mockRows, COLUMN_NAMES.CITY, cols);
      expect(result).toBe("Niteroi");
    });

    it("returns the ONLY value if there is only one valid row", () => {
      const singleRow = [{ City: null }, { City: "Sao Paulo" }, { City: null }];
      const result = safeGetLast(singleRow, "City", ["City"]);
      expect(result).toBe("Sao Paulo");
    });

    it("returns DATA_STATUS.EMPTY if the last valid value found is '-'", () => {
      const hyphenRows = [{ City: "Rio" }, { City: "-" }];
      // The last "valid" (according to the validator mock) is "-", but the function converts it to EMPTY
      const result = safeGetLast(hyphenRows, "City", ["City"]);
      expect(result).toBe(DATA_STATUS.EMPTY);
    });
  });
});
