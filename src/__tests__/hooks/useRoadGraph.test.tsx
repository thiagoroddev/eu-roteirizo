import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { DeliveryPoint } from "../../types/routing";
import type { RoadGraph } from "../../utils/routing/graph";
import type { FetchRoadGraphResult } from "../../utils/routing/osm";

vi.mock("../../services/graphCache", async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  loadRoadGraph: vi.fn(),
}));

import { loadRoadGraph } from "../../services/graphCache";
import { useRoadGraph } from "../../hooks/useRoadGraph";

const pt = (id: string, lat: number, lng: number): DeliveryPoint => ({ id, lat, lng, address: id, packageCount: 1, packages: [] });
const POINTS = [pt("a", -22.98, -43.2), pt("b", -22.979, -43.199)];
const GRAPH: RoadGraph = { coords: new Map([[1, { lat: -22.98, lng: -43.2 }]]), adj: new Map() };

describe("useRoadGraph (lazy, ADR-009 decision B)", () => {
  beforeEach(() => {
    vi.mocked(loadRoadGraph).mockReset();
  });

  it("stays idle (no fetch) while disabled or without points", () => {
    renderHook(() => useRoadGraph(POINTS, false));
    renderHook(() => useRoadGraph([], true));
    expect(loadRoadGraph).not.toHaveBeenCalled();
  });

  it("loads once on the first enable and reaches ready", async () => {
    vi.mocked(loadRoadGraph).mockResolvedValue({ graph: GRAPH });
    const { result, rerender } = renderHook(({ enabled }) => useRoadGraph(POINTS, enabled), { initialProps: { enabled: true } });

    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.graph).toBe(GRAPH);

    // Leaving and re-entering the mode must NOT refetch (graph stays in memory).
    rerender({ enabled: false });
    rerender({ enabled: true });
    expect(loadRoadGraph).toHaveBeenCalledTimes(1);
  });

  it("passes a neighborhood bbox (points envelope + margin)", async () => {
    vi.mocked(loadRoadGraph).mockResolvedValue({ graph: GRAPH });
    renderHook(() => useRoadGraph(POINTS, true));

    await waitFor(() => expect(loadRoadGraph).toHaveBeenCalled());
    const bbox = vi.mocked(loadRoadGraph).mock.calls[0][0];
    expect(bbox.south).toBeLessThan(-22.98);
    expect(bbox.north).toBeGreaterThan(-22.979);
    expect(bbox.west).toBeLessThan(-43.2);
    expect(bbox.east).toBeGreaterThan(-43.199);
  });

  it("cobre ao menos 600 m em volta dos pontos, para alcancar retornos legais fora do envelope", async () => {
    vi.mocked(loadRoadGraph).mockResolvedValue({ graph: GRAPH });
    renderHook(() => useRoadGraph(POINTS, true));

    await waitFor(() => expect(loadRoadGraph).toHaveBeenCalled());
    const bbox = vi.mocked(loadRoadGraph).mock.calls[0][0];
    const envelope = { south: -22.98, north: -22.979, west: -43.2, east: -43.199 };
    const latDeg = 600 / 111_320;
    const lngDeg = 600 / (111_320 * Math.cos((-22.9795 * Math.PI) / 180));
    expect(envelope.south - bbox.south).toBeGreaterThanOrEqual(latDeg * 0.99);
    expect(bbox.north - envelope.north).toBeGreaterThanOrEqual(latDeg * 0.99);
    expect(envelope.west - bbox.west).toBeGreaterThanOrEqual(lngDeg * 0.99);
    expect(bbox.east - envelope.east).toBeGreaterThanOrEqual(lngDeg * 0.99);
  });

  it("expande o bbox da malha viaria para cobrir o startPoint quando fornecido", async () => {
    vi.mocked(loadRoadGraph).mockResolvedValue({ graph: GRAPH });
    const startPoint = { lat: -22.95, lng: -43.15 };
    renderHook(() => useRoadGraph(POINTS, true, startPoint));

    await waitFor(() => expect(loadRoadGraph).toHaveBeenCalled());
    const bbox = vi.mocked(loadRoadGraph).mock.calls[0][0];
    expect(bbox.north).toBeGreaterThan(-22.95);
    expect(bbox.east).toBeGreaterThan(-43.15);
  });

  it("recarrega a malha quando o startPoint e definido ou movido para fora do envelope atual", async () => {
    vi.mocked(loadRoadGraph).mockResolvedValue({ graph: GRAPH });
    const { rerender } = renderHook(({ startPoint }: { startPoint: { lat: number; lng: number } | null }) => useRoadGraph(POINTS, true, startPoint), {
      initialProps: { startPoint: null as { lat: number; lng: number } | null },
    });

    await waitFor(() => expect(loadRoadGraph).toHaveBeenCalledTimes(1));

    rerender({ startPoint: { lat: -22.95, lng: -43.15 } });

    await waitFor(() => expect(loadRoadGraph).toHaveBeenCalledTimes(2));
    const bbox = vi.mocked(loadRoadGraph).mock.calls[1][0];
    expect(bbox.north).toBeGreaterThan(-22.95);
    expect(bbox.east).toBeGreaterThan(-43.15);
  });

  it("does not wedge: disabling mid-load then re-enabling reaches ready (TASK-BG-006)", async () => {
    // First run stays in flight; we abandon it and let it resolve late.
    let resolveFirst!: (r: FetchRoadGraphResult) => void;
    const firstRun = new Promise<FetchRoadGraphResult>((resolve) => {
      resolveFirst = resolve;
    });
    vi.mocked(loadRoadGraph).mockReturnValueOnce(firstRun).mockResolvedValueOnce({ graph: GRAPH });

    const { result, rerender } = renderHook(({ enabled }) => useRoadGraph(POINTS, enabled), { initialProps: { enabled: true } });
    await waitFor(() => expect(result.current.status).toBe("loading"));

    // Leave the mode while the load is in flight (cleanup cancels this run).
    rerender({ enabled: false });
    // The abandoned run resolves late with a DIFFERENT outcome — must be ignored,
    // not applied (the old shared cancel flag swallowed it AND blocked the restart).
    await act(async () => {
      resolveFirst({ error: "abandonado" });
      await firstRun;
    });

    // Re-enter the mode: the load must restart and reach ready, not stay stuck.
    rerender({ enabled: true });
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.graph).toBe(GRAPH);
    expect(result.current.error).toBeNull();
    expect(loadRoadGraph).toHaveBeenCalledTimes(2);
  });

  it("reports the error and retries on demand", async () => {
    vi.mocked(loadRoadGraph).mockResolvedValueOnce({ error: "sem rede" }).mockResolvedValueOnce({ graph: GRAPH });
    const { result } = renderHook(() => useRoadGraph(POINTS, true));

    await waitFor(() => expect(result.current.status).toBe("error"));
    expect(result.current.error).toBe("sem rede");

    act(() => result.current.retry());
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(loadRoadGraph).toHaveBeenCalledTimes(2);
  });
});
