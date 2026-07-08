import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import type { DeliveryPoint } from "../../types/routing";
import type { RoadGraph } from "../../utils/routing/graph";

vi.mock("../../services/graphCache", () => ({
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
