/**
 * Tests for excelProcessor.ts
 *
 * 🎯 Purpose:
 * This file verifies that the Excel processing logic works correctly without
 * needing to upload a real file in the browser.
 *
 * 📚 Key Concepts for Beginners:
 * - Mocking: We simulate the 'xlsx' library so we don't need real .xlsx files.
 * - Spying: We "spy" on console.warn to check if warnings are logged.
 * - Fixtures: Helper functions like `createExcelRow` create fake data easily.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { processExcelFile } from "../../utils/excelProcessor";
import { COLUMN_NAMES, MANDATORY_COLUMNS } from "../../constants";
import * as XLSX from "xlsx";

// =============================================================================
// 1. MOCKS & SETUP
// =============================================================================

// Simulate the 'xlsx' library. We don't want to parse real binary files in tests.
vi.mock("xlsx", () => ({
  read: vi.fn(),
  utils: {
    sheet_to_json: vi.fn(),
  },
}));

// TYPE CASTING:
// TypeScript thinks these are the original library functions.
// We cast them 'as Mock' to tell TypeScript: "Trust us, these are now Vitest mocks".
// This fixes the error: "Property 'mockReturnValue' does not exist..."
const mockRead = XLSX.read as Mock;
const mockSheetToJson = XLSX.utils.sheet_to_json as Mock;

// Helper: Creates a fake File object (Node.js doesn't have real Files)
const createMockFile = () => {
  return {
    arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(8)),
  } as unknown as File;
};

// Helper: Creates a single row of data with default valid values.
// This avoids repeating the same big object in every test.
const createExcelRow = (overrides = {}) => ({
  [COLUMN_NAMES.CORRIDOR_CAGE]: "A-1",
  [COLUMN_NAMES.LATITUDE]: -22.9,
  [COLUMN_NAMES.LONGITUDE]: -43.1,
  [COLUMN_NAMES.SEQUENCE]: 1,
  [COLUMN_NAMES.STOP]: 1,
  [COLUMN_NAMES.DESTINATION_ADDRESS]: "Test Street",
  ...overrides, // Applies any specific changes for the test
});

describe("processExcelFile", () => {
  // Reset mocks before each test to ensure a clean state
  beforeEach(() => {
    vi.clearAllMocks();

    // Silence the logs during testing.
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "debug").mockImplementation(() => {});
  });

  // ==========================================================================
  // 2. VALIDATION TESTS (Bad Data)
  // ==========================================================================

  it("returns error if the file is empty (no rows)", async () => {
    // Setup: sheet_to_json returns an empty array []
    mockRead.mockReturnValue({ SheetNames: ["Sheet1"], Sheets: { Sheet1: {} } });
    mockSheetToJson.mockReturnValue([]);

    const result = await processExcelFile(createMockFile());

    // Assert: We expect an error message
    expect(result.routes).toBeNull();
    expect(result.error).toContain("O arquivo parece estar vazio");
  });

  it("returns error if mandatory columns are missing", async () => {
    // Setup: Create a row that ONLY has the Corridor Cage, missing Lat/Long
    const badRow = {
      [COLUMN_NAMES.CORRIDOR_CAGE]: "A-1",
      // Latitude and Longitude are missing!
    };

    mockRead.mockReturnValue({ SheetNames: ["Sheet1"], Sheets: { Sheet1: {} } });
    mockSheetToJson.mockReturnValue([badRow]);

    const result = await processExcelFile(createMockFile());

    expect(result.routes).toBeNull();
    expect(result.error).toContain("Colunas obrigatórias ausentes");

    // LINTER FIX: We use MANDATORY_COLUMNS here to check correctness.
    // Logic: We know 'badRow' has CORRIDOR_CAGE, so we expect the *others* to be missing.
    const expectedMissing = MANDATORY_COLUMNS.filter((c) => c !== COLUMN_NAMES.CORRIDOR_CAGE);

    // Verify if the missing columns reported match our expectations
    expect(result.missingCols).toEqual(expect.arrayContaining(expectedMissing));
  });

  // ==========================================================================
  // 3. PROCESSING TESTS (Happy Path)
  // ==========================================================================

  it("groups rows correctly by route name (Corridor Cage)", async () => {
    // Setup: 2 rows for route A-1, 1 row for route B-2
    const mockData = [
      createExcelRow({ [COLUMN_NAMES.CORRIDOR_CAGE]: "A-1", [COLUMN_NAMES.SEQUENCE]: 1 }),
      createExcelRow({ [COLUMN_NAMES.CORRIDOR_CAGE]: "B-2", [COLUMN_NAMES.SEQUENCE]: 1 }),
      createExcelRow({ [COLUMN_NAMES.CORRIDOR_CAGE]: "A-1", [COLUMN_NAMES.SEQUENCE]: 2 }),
    ];

    mockRead.mockReturnValue({ SheetNames: ["Sheet1"], Sheets: { Sheet1: {} } });
    mockSheetToJson.mockReturnValue(mockData);

    const result = await processExcelFile(createMockFile());

    // Assert: Check grouping logic
    expect(result.routes).not.toBeNull();
    expect(Object.keys(result.routes!)).toHaveLength(2); // Should have keys "A-1" and "B-2"
    expect(result.routes!["A-1"]).toHaveLength(2); // A-1 has 2 items
    expect(result.routes!["B-2"]).toHaveLength(1); // B-2 has 1 item
  });

  it("sorts routes alphanumerically (e.g., A-1, A-2, A-10)", async () => {
    // Setup: Routes in random order
    const mockData = [
      createExcelRow({ [COLUMN_NAMES.CORRIDOR_CAGE]: "A-10" }),
      createExcelRow({ [COLUMN_NAMES.CORRIDOR_CAGE]: "A-2" }),
      createExcelRow({ [COLUMN_NAMES.CORRIDOR_CAGE]: "A-1" }),
      createExcelRow({ [COLUMN_NAMES.CORRIDOR_CAGE]: "B-1" }),
    ];

    mockRead.mockReturnValue({ SheetNames: ["Sheet1"], Sheets: { Sheet1: {} } });
    mockSheetToJson.mockReturnValue(mockData);

    const result = await processExcelFile(createMockFile());

    // Assert: Keys should be sorted logically, not just alphabetically
    const sortedKeys = Object.keys(result.routes!);
    expect(sortedKeys).toEqual(["A-1", "A-2", "A-10", "B-1"]);
  });

  it("sorts rows inside a route by Sequence number", async () => {
    // Setup: Rows out of order (3, 1, 2)
    const mockData = [
      createExcelRow({ [COLUMN_NAMES.CORRIDOR_CAGE]: "A-1", [COLUMN_NAMES.SEQUENCE]: 3 }),
      createExcelRow({ [COLUMN_NAMES.CORRIDOR_CAGE]: "A-1", [COLUMN_NAMES.SEQUENCE]: 1 }),
      createExcelRow({ [COLUMN_NAMES.CORRIDOR_CAGE]: "A-1", [COLUMN_NAMES.SEQUENCE]: 2 }),
    ];

    mockRead.mockReturnValue({ SheetNames: ["Sheet1"], Sheets: { Sheet1: {} } });
    mockSheetToJson.mockReturnValue(mockData);

    const result = await processExcelFile(createMockFile());
    const rows = result.routes!["A-1"];

    // Assert: Order should be 1, 2, 3
    expect(rows[0][COLUMN_NAMES.SEQUENCE]).toBe(1);
    expect(rows[1][COLUMN_NAMES.SEQUENCE]).toBe(2);
    expect(rows[2][COLUMN_NAMES.SEQUENCE]).toBe(3);
  });

  // ==========================================================================
  // 4. ROBUSTNESS TESTS (Dirty Data)
  // ==========================================================================

  it("skips rows with invalid or empty 'Corridor Cage'", async () => {
    const mockData = [
      createExcelRow({ [COLUMN_NAMES.CORRIDOR_CAGE]: "A-1" }), // Valid
      createExcelRow({ [COLUMN_NAMES.CORRIDOR_CAGE]: "" }), // Invalid (Empty)
      createExcelRow({ [COLUMN_NAMES.CORRIDOR_CAGE]: "INVALID_NAME" }), // Invalid (Regex fail)
    ];

    mockRead.mockReturnValue({ SheetNames: ["Sheet1"], Sheets: { Sheet1: {} } });
    mockSheetToJson.mockReturnValue(mockData);

    const result = await processExcelFile(createMockFile());

    // Assert: Only valid routes are kept
    expect(Object.keys(result.routes!)).toHaveLength(1);
    expect(result.routes!["A-1"]).toBeDefined();
  });

  it("handles Sequence correctly even if it is a string", async () => {
    // Excel sometimes reads numbers as strings ("10" instead of 10)
    const mockData = [createExcelRow({ [COLUMN_NAMES.SEQUENCE]: "10" }), createExcelRow({ [COLUMN_NAMES.SEQUENCE]: 2 })];

    mockRead.mockReturnValue({ SheetNames: ["Sheet1"], Sheets: { Sheet1: {} } });
    mockSheetToJson.mockReturnValue(mockData);

    const result = await processExcelFile(createMockFile());
    const rows = result.routes!["A-1"];

    // Assert: Numeric sort handles strings (2 comes before "10")
    expect(rows[0][COLUMN_NAMES.SEQUENCE]).toBe(2);
    expect(rows[1][COLUMN_NAMES.SEQUENCE]).toBe("10");
  });

  it("catches execution errors gracefully (e.g. read failure)", async () => {
    // Setup: Force 'read' to throw an exception
    mockRead.mockImplementation(() => {
      throw new Error("Simulated Read Error");
    });

    const result = await processExcelFile(createMockFile());

    // Assert: Should return an error object, NOT crash the app
    expect(result.routes).toBeNull();
    expect(result.error).toBe("Falha ao processar o arquivo.");
  });

  it("detects and logs missing cells in valid rows (Warning only)", async () => {
    const mockData = [
      createExcelRow({
        [COLUMN_NAMES.CORRIDOR_CAGE]: "A-1",
        [COLUMN_NAMES.SEQUENCE]: "", // Empty cell!
      }),
    ];

    mockRead.mockReturnValue({ SheetNames: ["Sheet1"], Sheets: { Sheet1: {} } });
    mockSheetToJson.mockReturnValue(mockData);

    // Spy on console.warn to verify the warning logic
    const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await processExcelFile(createMockFile());

    // Assert: The processor should verify empty cells and warn about them
    expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("linhas possuem células vazias"));

    consoleWarnSpy.mockRestore();
  });
});
