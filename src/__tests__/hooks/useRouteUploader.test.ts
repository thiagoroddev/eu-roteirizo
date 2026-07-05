/**
 * Tests for useRouteUploader hook
 *
 * 🎯 Goal:
 * Verify that the file upload process works correctly, managing
 * validation (size/type), loading states, and handling responses
 * from the excelProcessor.
 *
 * 📚 Key Concepts:
 * - Integration Test Strategy: We mock 'excelProcessor' to simulate
 * success/failure without needing real Excel parsing.
 * - Async Testing: Since file processing is async, we use `await act(...)`
 * to ensure state updates are flushed before assertions.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRouteUploader } from "../../hooks/useRouteUploader";
import { processExcelFile } from "../../utils/excelProcessor";
import { saveManifest, getManifest } from "../../services/manifestStorage";
import { FILE_CONFIG, UI_LABELS } from "../../constants";
import type { RoutesMap } from "../../types";
import type { ManifestMeta } from "../../types/manifest";

// =============================================================================
// 1. MOCKS
// =============================================================================

// Mock the heavy lifting processor function to isolate the hook logic
vi.mock("../../utils/excelProcessor", () => ({
  processExcelFile: vi.fn(),
}));

// Mock the local persistence (RF-022.2/.3) — the hook only forwards its results
vi.mock("../../services/manifestStorage", () => ({
  saveManifest: vi.fn(),
  getManifest: vi.fn(),
}));

const mockProcessExcel = processExcelFile as Mock;
const mockSaveManifest = saveManifest as Mock;
const mockGetManifest = getManifest as Mock;

// =============================================================================
// 2. TEST FIXTURES (Helpers & Data)
// =============================================================================

const mockRoutes: RoutesMap = {
  "A-1": [{ "Corridor Cage": "A-1", Latitude: -22.9, Longitude: -43.1 }],
  "B-2": [{ "Corridor Cage": "B-2", Latitude: -22.8, Longitude: -43.2 }],
};

const mockSuccessResult = {
  routes: mockRoutes,
  availableCols: ["Corridor Cage", "Latitude"],
  missingCols: [],
  error: undefined,
};

const mockErrorResult = {
  routes: null,
  availableCols: null,
  missingCols: [],
  error: "Falha ao processar arquivo",
};

/** Helper to create a fake File object in Node.js environment */
const createMockFile = (name: string, size: number = 1024, type = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"): File => {
  const content = new Array(size).fill("x").join("");
  // Manually override size property because JSDOM File size is read-only based on content
  const file = new File([content], name, { type });
  Object.defineProperty(file, "size", { value: size });
  return file;
};

/** Helper to simulate the React Change Event on <input type="file"> */
const createMockEvent = (file: File | null) => {
  return {
    target: {
      files: file ? [file] : null,
    },
  } as unknown as React.ChangeEvent<HTMLInputElement>;
};

const mockMeta: ManifestMeta = {
  id: "hash-abc",
  fileName: "romaneio.xlsx",
  fileType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  fileSize: 1024,
  kind: "multi",
  routes: [{ name: "A-1", rowCount: 1 }],
  importedAt: "2026-07-05T10:00:00.000Z",
};

describe("useRouteUploader Hook", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: persistence succeeds quietly (individual tests override)
    mockSaveManifest.mockResolvedValue({ status: "saved", meta: mockMeta });
  });

  // ==========================================================================
  // 1. INITIAL STATE
  // ==========================================================================

  it("initializes with correct default state", () => {
    const { result } = renderHook(() => useRouteUploader());

    expect(result.current.routes).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.availableCols).toBeNull();
    expect(result.current.missingCols).toEqual([]);
    expect(typeof result.current.handleFileUpload).toBe("function");
  });

  // ==========================================================================
  // 2. VALIDATION LOGIC (Synchronous)
  // ==========================================================================

  it("sets error for invalid file extension (e.g. .txt)", async () => {
    const { result } = renderHook(() => useRouteUploader());
    const invalidFile = createMockFile("notes.txt", 1024, "text/plain");
    const event = createMockEvent(invalidFile);

    await act(async () => {
      await result.current.handleFileUpload(event);
    });

    expect(result.current.error).toBe(UI_LABELS.ERRORS.INVALID_FILE);
    expect(result.current.loading).toBe(false);
    expect(mockProcessExcel).not.toHaveBeenCalled();
  });

  it("sets error for files exceeding max size", async () => {
    const { result } = renderHook(() => useRouteUploader());
    // Create a file 1 byte larger than limit
    const largeFile = createMockFile("large.xlsx", FILE_CONFIG.MAX_FILE_SIZE + 1);
    const event = createMockEvent(largeFile);

    await act(async () => {
      await result.current.handleFileUpload(event);
    });

    expect(result.current.error).toBe(UI_LABELS.ERRORS.FILE_TOO_LARGE);
    expect(mockProcessExcel).not.toHaveBeenCalled();
  });

  // ==========================================================================
  // 3. PROCESSING SUCCESS (Async)
  // ==========================================================================

  it("processes valid .xlsx file successfully and updates state", async () => {
    const { result } = renderHook(() => useRouteUploader());
    const validFile = createMockFile("test.xlsx");
    const event = createMockEvent(validFile);

    mockProcessExcel.mockResolvedValue(mockSuccessResult);

    await act(async () => {
      await result.current.handleFileUpload(event);
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.routes).toEqual(mockSuccessResult.routes);
    expect(result.current.availableCols).toEqual(mockSuccessResult.availableCols);
  });

  it("processes valid .csv file successfully", async () => {
    const { result } = renderHook(() => useRouteUploader());
    const validFile = createMockFile("test.csv", 1024, "text/csv");
    const event = createMockEvent(validFile);

    mockProcessExcel.mockResolvedValue(mockSuccessResult);

    await act(async () => {
      await result.current.handleFileUpload(event);
    });

    expect(result.current.error).toBeNull();
    expect(mockProcessExcel).toHaveBeenCalledWith(validFile);
  });

  // ==========================================================================
  // 4. LOADING STATE MANAGEMENT
  // ==========================================================================

  it("sets loading state correctly during async processing", async () => {
    const { result } = renderHook(() => useRouteUploader());
    const validFile = createMockFile("test.xlsx");
    const event = createMockEvent(validFile);

    // Create a controlled promise to inspect intermediate state
    let resolvePromise: (value: typeof mockSuccessResult) => void;
    const processingPromise = new Promise<typeof mockSuccessResult>((resolve) => {
      resolvePromise = resolve;
    });

    mockProcessExcel.mockReturnValue(processingPromise);

    // 1. Trigger upload
    act(() => {
      result.current.handleFileUpload(event);
    });

    // 2. Check loading state immediately
    expect(result.current.loading).toBe(true);

    // 3. Resolve promise
    // @ts-expect-error: TypeScript doesn't know resolvePromise is assigned inside constructor
    resolvePromise(mockSuccessResult);

    // 4. Wait for resolution
    await act(async () => {
      await processingPromise;
    });

    expect(result.current.loading).toBe(false);
  });

  // ==========================================================================
  // 5. ERROR HANDLING
  // ==========================================================================

  it("handles processing errors returned by the processor", async () => {
    const { result } = renderHook(() => useRouteUploader());
    const validFile = createMockFile("corrupt.xlsx");
    const event = createMockEvent(validFile);

    mockProcessExcel.mockResolvedValue(mockErrorResult);

    await act(async () => {
      await result.current.handleFileUpload(event);
    });

    expect(result.current.error).toBe(mockErrorResult.error);
    expect(result.current.routes).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  // ==========================================================================
  // 6. EDGE CASES & OPTIMIZATIONS
  // ==========================================================================

  it("does nothing when user cancels file selection (null file)", async () => {
    const { result } = renderHook(() => useRouteUploader());
    const event = createMockEvent(null);

    await act(async () => {
      await result.current.handleFileUpload(event);
    });

    // State should remain untouched
    expect(result.current.routes).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(mockProcessExcel).not.toHaveBeenCalled();
  });

  it("resets previous error/data state before starting new upload", async () => {
    const { result } = renderHook(() => useRouteUploader());
    const validFile = createMockFile("test.xlsx");
    const event = createMockEvent(validFile);

    // Mock a process that resolves instantly
    mockProcessExcel.mockResolvedValue(mockSuccessResult);

    await act(async () => {
      await result.current.handleFileUpload(event);
    });

    // Ensure processor was called exactly once
    expect(mockProcessExcel).toHaveBeenCalledTimes(1);
    expect(result.current.error).toBeNull();
  });

  // ==========================================================================
  // 7. LOCAL PERSISTENCE (RF-46 / RN-23 — TASK-RF-022.2)
  // ==========================================================================

  it("persists the manifest after a successful upload and exposes the result", async () => {
    const { result } = renderHook(() => useRouteUploader());
    const validFile = createMockFile("test.xlsx");

    mockProcessExcel.mockResolvedValue(mockSuccessResult);

    await act(async () => {
      await result.current.handleFileUpload(createMockEvent(validFile));
    });

    expect(mockSaveManifest).toHaveBeenCalledWith(validFile, mockSuccessResult);
    expect(result.current.manifestSave).toEqual({ status: "saved", meta: mockMeta });
  });

  it("does NOT persist when processing fails, and manifestSave stays null", async () => {
    const { result } = renderHook(() => useRouteUploader());

    mockProcessExcel.mockResolvedValue(mockErrorResult);

    await act(async () => {
      await result.current.handleFileUpload(createMockEvent(createMockFile("corrupt.xlsx")));
    });

    expect(mockSaveManifest).not.toHaveBeenCalled();
    expect(result.current.manifestSave).toBeNull();
  });

  it("exposes a duplicate result (RN-23) without blocking the routes", async () => {
    const { result } = renderHook(() => useRouteUploader());

    mockProcessExcel.mockResolvedValue(mockSuccessResult);
    mockSaveManifest.mockResolvedValue({ status: "duplicate", meta: mockMeta });

    await act(async () => {
      await result.current.handleFileUpload(createMockEvent(createMockFile("de-novo.xlsx")));
    });

    expect(result.current.manifestSave).toEqual({ status: "duplicate", meta: mockMeta });
    expect(result.current.routes).toEqual(mockSuccessResult.routes); // viewing is not blocked
  });

  it("exposes a storage error without blocking the routes", async () => {
    const { result } = renderHook(() => useRouteUploader());

    mockProcessExcel.mockResolvedValue(mockSuccessResult);
    mockSaveManifest.mockResolvedValue({ status: "error", reason: "quota" });

    await act(async () => {
      await result.current.handleFileUpload(createMockEvent(createMockFile("sem-espaco.xlsx")));
    });

    expect(result.current.manifestSave).toEqual({ status: "error", reason: "quota" });
    expect(result.current.routes).toEqual(mockSuccessResult.routes);
  });

  it("resets manifestSave when a new upload starts", async () => {
    const { result } = renderHook(() => useRouteUploader());

    mockProcessExcel.mockResolvedValue(mockSuccessResult);
    await act(async () => {
      await result.current.handleFileUpload(createMockEvent(createMockFile("primeiro.xlsx")));
    });
    expect(result.current.manifestSave).not.toBeNull();

    // Second upload fails processing → manifestSave must be back to null (not stale)
    mockProcessExcel.mockResolvedValue(mockErrorResult);
    await act(async () => {
      await result.current.handleFileUpload(createMockEvent(createMockFile("segundo.xlsx")));
    });
    expect(result.current.manifestSave).toBeNull();
  });

  // ==========================================================================
  // 8. REOPEN SAVED MANIFEST (RF-46 — TASK-RF-022.3)
  // ==========================================================================

  const mockRecord = {
    ...mockMeta,
    bytes: new TextEncoder().encode("planilha-salva").buffer as ArrayBuffer,
  };

  it("loadManifest reopens a saved manifest through the same pipeline without re-saving", async () => {
    const { result } = renderHook(() => useRouteUploader());

    mockGetManifest.mockResolvedValue(mockRecord);
    mockProcessExcel.mockResolvedValue(mockSuccessResult);

    let ok = false;
    await act(async () => {
      ok = await result.current.loadManifest("hash-abc");
    });

    expect(ok).toBe(true);
    expect(mockGetManifest).toHaveBeenCalledWith("hash-abc");
    // The rebuilt File carries the persisted name/type
    const fileArg = mockProcessExcel.mock.calls[0][0] as File;
    expect(fileArg.name).toBe(mockMeta.fileName);
    expect(fileArg.type).toBe(mockMeta.fileType);
    expect(result.current.routes).toEqual(mockSuccessResult.routes);
    expect(mockSaveManifest).not.toHaveBeenCalled(); // reopening never re-saves
    expect(result.current.manifestSave).toBeNull();
  });

  it("loadManifest fails gracefully for an unknown id", async () => {
    const { result } = renderHook(() => useRouteUploader());

    mockGetManifest.mockResolvedValue(null);

    let ok = true;
    await act(async () => {
      ok = await result.current.loadManifest("nao-existe");
    });

    expect(ok).toBe(false);
    expect(result.current.error).toBe(UI_LABELS.FILE_UPLOADER.MANIFEST_NOT_FOUND);
    expect(result.current.routes).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it("loadManifest surfaces a processing error from the stored bytes", async () => {
    const { result } = renderHook(() => useRouteUploader());

    mockGetManifest.mockResolvedValue(mockRecord);
    mockProcessExcel.mockResolvedValue(mockErrorResult);

    let ok = true;
    await act(async () => {
      ok = await result.current.loadManifest("hash-abc");
    });

    expect(ok).toBe(false);
    expect(result.current.error).toBe(mockErrorResult.error);
    expect(result.current.loading).toBe(false);
  });

  it("memoizes handleFileUpload function (Performance)", () => {
    const { result, rerender } = renderHook(() => useRouteUploader());
    const firstHandler = result.current.handleFileUpload;

    // Rerender the hook
    rerender();

    // The function reference should be identical (stable identity)
    expect(result.current.handleFileUpload).toBe(firstHandler);
  });
});
