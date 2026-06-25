/**
 * Tests for useRouteSummary hook
 *
 * 🎯 Goal:
 * Verify that the hook correctly aggregates data from multiple rows,
 * handles edge cases (empty data, missing columns), and integrates
 * correctly with helper functions.
 *
 * 📚 Strategy: Integration Testing
 * Instead of mocking every internal helper (like formatDistance), we use
 * the REAL helpers. We only mock external data sources (JSON files)
 * to ensure deterministic results.
 */

import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useRouteSummary } from "../../hooks/useRouteSummary";
import { COLUMN_NAMES, DATA_STATUS, UI_LABELS } from "../../constants";
import type { RowData } from "../../types";

// =============================================================================
// 1. EXTERNAL DATA MOCKS
// =============================================================================

// Mock the CEP database to ensure 'summarizeNeighborhoods' works deterministically
// without reading the large real JSON file.
// Note: formatters.ts cleans zipcodes (removes dashes), so keys must be clean.
vi.mock("../../data/CEPs-Hub_RJ_Ilha-do-Governador.json", () => ({
  default: {
    "22041001": { bairro: "Copacabana" },
    "22041002": { bairro: "Copacabana" },
    "22410001": { bairro: "Ipanema" },
  },
}));

// =============================================================================
// 2. TEST FIXTURES (Fake Data)
// =============================================================================

const mockAvailableColsComplete = Object.values(COLUMN_NAMES);

const mockRowsComplete: RowData[] = [
  {
    [COLUMN_NAMES.NUM_OF_ORDER]: 5,
    [COLUMN_NAMES.STOP]: 1,
    [COLUMN_NAMES.DELIVERY_TIME]: "1h30min",
    [COLUMN_NAMES.TOTAL_DISTANCE]: "20.909km",
    [COLUMN_NAMES.CITY]: "Rio de Janeiro",
    [COLUMN_NAMES.PLANNED_AT]: "AT2025111549GJK",
    [COLUMN_NAMES.NEIGHBORHOOD]: "Copacabana",
    [COLUMN_NAMES.ZIPCODE]: "22041-001",
    [COLUMN_NAMES.LOCATION_TYPE]: "HOME",
    [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua A, 123",
  },
  {
    [COLUMN_NAMES.NUM_OF_ORDER]: 5,
    [COLUMN_NAMES.STOP]: 2,
    [COLUMN_NAMES.DELIVERY_TIME]: "2h20min",
    [COLUMN_NAMES.TOTAL_DISTANCE]: "20.909km",
    [COLUMN_NAMES.CITY]: "Rio de Janeiro",
    [COLUMN_NAMES.PLANNED_AT]: "AT2025111549GJK",
    [COLUMN_NAMES.NEIGHBORHOOD]: "Copacabana",
    [COLUMN_NAMES.ZIPCODE]: "22041-002",
    [COLUMN_NAMES.LOCATION_TYPE]: "OFFICE",
    // Added "Loja" keyword to ensure commercial detection works
    [COLUMN_NAMES.DESTINATION_ADDRESS]: "Av B, 456, Loja 10",
  },
  {
    [COLUMN_NAMES.NUM_OF_ORDER]: 5,
    [COLUMN_NAMES.STOP]: 3,
    [COLUMN_NAMES.DELIVERY_TIME]: "1h30min",
    [COLUMN_NAMES.TOTAL_DISTANCE]: "20.909km",
    [COLUMN_NAMES.CITY]: "Rio de Janeiro",
    [COLUMN_NAMES.PLANNED_AT]: "AT2025111549GJK",
    [COLUMN_NAMES.NEIGHBORHOOD]: "Ipanema",
    [COLUMN_NAMES.ZIPCODE]: "22410-001",
    [COLUMN_NAMES.LOCATION_TYPE]: "HOME",
    [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua C, 789",
  },
];

const mockRowsPartial: RowData[] = [
  {
    [COLUMN_NAMES.NUM_OF_ORDER]: 3,
    [COLUMN_NAMES.STOP]: 1,
    [COLUMN_NAMES.CITY]: "São Paulo",
    [COLUMN_NAMES.NEIGHBORHOOD]: "Centro",
  },
  {
    [COLUMN_NAMES.NUM_OF_ORDER]: 3,
    [COLUMN_NAMES.STOP]: 2,
    [COLUMN_NAMES.CITY]: "São Paulo",
    [COLUMN_NAMES.NEIGHBORHOOD]: "Centro",
  },
];

// Columns without ZIPCODE to force fallback to NEIGHBORHOOD text analysis
const mockAvailableColsPartial = [COLUMN_NAMES.NUM_OF_ORDER, COLUMN_NAMES.STOP, COLUMN_NAMES.CITY, COLUMN_NAMES.NEIGHBORHOOD];

describe("useRouteSummary Hook", () => {
  // ==========================================================================
  // 1. HAPPY PATH (Full Integration)
  // ==========================================================================

  it("calculates summary correctly with complete data", () => {
    const { result } = renderHook(() => useRouteSummary(mockRowsComplete, mockAvailableColsComplete));

    // Basic fields
    expect(result.current.totalPacks).toBe("5");
    expect(result.current.city).toBe("Rio de Janeiro");
    expect(result.current.at).toBe("AT2025111549GJK");

    // Internal Logic (Last Stop)
    expect(result.current.lastStop).toBe("3");

    // Formatter Integration
    expect(result.current.time).toBe("1 hora e 30 minutos");
    expect(result.current.distance).toBe("21 km");

    // Complex Logic Integration (Inference & Counting)
    expect(result.current.commerceCount).toBe("1"); // 1 address with "Loja"
    expect(result.current.neighborhoods).toBe("Copacabana: 2, Ipanema: 1"); // Via Mocked CEPs
  });

  // ==========================================================================
  // 2. EDGE CASES (Missing/Bad Data)
  // ==========================================================================

  it("handles missing columns gracefully (Partial Data)", () => {
    // Tests fallback logic when ZIPCODE is missing but NEIGHBORHOOD exists
    const { result } = renderHook(() => useRouteSummary(mockRowsPartial, mockAvailableColsPartial));

    expect(result.current.totalPacks).toBe("3");
    expect(result.current.lastStop).toBe("2");
    expect(result.current.neighborhoods).toBe("Centro: 2");

    // Missing columns should result in standardized UI Labels
    expect(result.current.time).toBe(UI_LABELS.COMMON.NO_DATA);
    expect(result.current.distance).toBe(UI_LABELS.COMMON.NO_DATA);
    expect(result.current.at).toBe(UI_LABELS.COMMON.NO_DATA);
  });

  it("handles empty rows array", () => {
    const { result } = renderHook(() => useRouteSummary([], mockAvailableColsComplete));

    expect(result.current.totalPacks).toBe(UI_LABELS.COMMON.NO_DATA);
    expect(result.current.lastStop).toBe(UI_LABELS.COMMON.NO_DATA);
    expect(result.current.commerceCount).toBe("0");
  });

  it("handles null availableCols (e.g., file load error)", () => {
    const { result } = renderHook(() => useRouteSummary(mockRowsComplete, null));

    expect(result.current.totalPacks).toBe(UI_LABELS.COMMON.NO_DATA);
    expect(result.current.lastStop).toBe(UI_LABELS.COMMON.NO_DATA);
  });

  it("handles internal status values (DATA_STATUS) in data cells", () => {
    const rowsWithStatus: RowData[] = [
      {
        [COLUMN_NAMES.NUM_OF_ORDER]: DATA_STATUS.MISSING,
        [COLUMN_NAMES.STOP]: 1,
        [COLUMN_NAMES.CITY]: DATA_STATUS.EMPTY,
      },
    ];

    const { result } = renderHook(() => useRouteSummary(rowsWithStatus, mockAvailableColsComplete));

    // Should translate DATA_STATUS to UI_LABELS
    expect(result.current.totalPacks).toBe(UI_LABELS.COMMON.NO_DATA);
    expect(result.current.city).toBe(UI_LABELS.COMMON.NO_DATA);
    expect(result.current.lastStop).toBe("1");
  });

  // ==========================================================================
  // 3. INTERNAL LOGIC SPECIFICS
  // ==========================================================================

  it("calculates last stop correctly even if stops are unordered", () => {
    const unorderedRows: RowData[] = [
      { [COLUMN_NAMES.STOP]: 5 },
      { [COLUMN_NAMES.STOP]: 2 },
      { [COLUMN_NAMES.STOP]: 99 }, // This is the last item in the array
    ];

    const { result } = renderHook(() => useRouteSummary(unorderedRows, mockAvailableColsComplete));

    // The hook uses .reverse().find(), so it expects the array to be
    // pre-sorted by sequence (which excelProcessor does).
    // It picks the last valid stop in the list.
    expect(result.current.lastStop).toBe("99");
  });

  it("handles rows with missing STOP values", () => {
    const rowsWithMissingStops: RowData[] = [
      { [COLUMN_NAMES.NUM_OF_ORDER]: 2 },
      { [COLUMN_NAMES.NUM_OF_ORDER]: 2, [COLUMN_NAMES.STOP]: 1 },
      { [COLUMN_NAMES.NUM_OF_ORDER]: 2 }, // Missing stop
    ];

    const { result } = renderHook(() => useRouteSummary(rowsWithMissingStops, mockAvailableColsComplete));

    // Should find the last *valid* stop
    expect(result.current.lastStop).toBe("1");
  });

  it("handles single row scenarios correctly", () => {
    const singleRow: RowData[] = [
      {
        [COLUMN_NAMES.NUM_OF_ORDER]: 1,
        [COLUMN_NAMES.STOP]: 1,
        [COLUMN_NAMES.CITY]: "Belo Horizonte",
        [COLUMN_NAMES.PLANNED_AT]: "AT-200",
        [COLUMN_NAMES.NEIGHBORHOOD]: "Savassi",
      },
    ];

    // Force fallback to NEIGHBORHOOD column by omitting ZIPCODE
    const colsWithoutZip = mockAvailableColsComplete.filter((c) => c !== COLUMN_NAMES.ZIPCODE);

    const { result } = renderHook(() => useRouteSummary(singleRow, colsWithoutZip));

    expect(result.current.totalPacks).toBe("1");
    expect(result.current.lastStop).toBe("1");
    expect(result.current.city).toBe("Belo Horizonte");
    expect(result.current.at).toBe("AT-200");
    expect(result.current.neighborhoods).toBe("Savassi: 1");
  });

  // ==========================================================================
  // 4. PERFORMANCE (Memoization)
  // ==========================================================================

  it("memoizes results and only recalculates when dependencies change", () => {
    const { result, rerender } = renderHook(({ rows, cols }) => useRouteSummary(rows, cols), {
      initialProps: { rows: mockRowsComplete, cols: mockAvailableColsComplete },
    });

    const firstResult = result.current;

    // Rerender with same props -> Should return same object reference
    rerender({ rows: mockRowsComplete, cols: mockAvailableColsComplete });
    expect(result.current).toBe(firstResult);

    // Change props -> Should return new object
    rerender({ rows: mockRowsPartial, cols: mockAvailableColsPartial });
    expect(result.current).not.toBe(firstResult);
  });
});
