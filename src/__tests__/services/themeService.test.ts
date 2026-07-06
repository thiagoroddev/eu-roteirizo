/**
 * Tests for themeService — focused on the theme DEFAULT (TASK-REF-012):
 * the app opens in dark (Neon Flux) when no preference is stored.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { getStoredMode, resolveTheme, storeMode } from "../../services/themeService";

// The global localStorage in this test runtime is Node's experimental webstorage
// stub (no working methods) — replace it with a deterministic in-memory mock.
const store = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => {
    store.set(key, String(value));
  },
  removeItem: (key: string) => {
    store.delete(key);
  },
};

describe("themeService", () => {
  beforeEach(() => {
    store.clear();
    vi.stubGlobal("localStorage", localStorageMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults to dark when nothing is stored (Neon Flux default — TASK-REF-012)", () => {
    expect(getStoredMode()).toBe("dark");
  });

  it("defaults to dark when the stored value is garbage", () => {
    localStorage.setItem("theme", "neon");
    expect(getStoredMode()).toBe("dark");
  });

  it("respects an explicitly stored mode", () => {
    storeMode("light");
    expect(getStoredMode()).toBe("light");
    storeMode("system");
    expect(getStoredMode()).toBe("system");
  });

  it("resolveTheme maps explicit modes directly", () => {
    expect(resolveTheme("dark")).toBe("dark");
    expect(resolveTheme("light")).toBe("light");
  });
});
