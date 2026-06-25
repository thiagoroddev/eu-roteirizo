import "fake-indexeddb/auto";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the network layer so loadRoadGraph's Overpass path is controlled.
vi.mock("../../utils/routing/osm", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../../utils/routing/osm")>();
  return { ...actual, fetchRoadGraph: vi.fn() };
});

import { bboxKey, getCachedGraph, putCachedGraph, clearGraphCache, loadRoadGraph } from "../../services/graphCache";
import { fetchRoadGraph } from "../../utils/routing/osm";
import type { BBox } from "../../utils/routing/osm";
import { buildGraph } from "../../utils/routing/graph";

const BB: BBox = { south: -22.99, west: -43.21, north: -22.98, east: -43.19 };

/** A small two-way street, built through the real buildGraph (Maps inside). */
const sampleGraph = () =>
  buildGraph([
    {
      type: "way",
      nodes: [1, 2],
      geometry: [
        { lat: -22.984, lon: -43.204 },
        { lat: -22.984, lon: -43.203 },
      ],
      tags: { name: "Rua Teste" },
    },
  ]);

beforeEach(async () => {
  await clearGraphCache();
  vi.mocked(fetchRoadGraph).mockReset();
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("bboxKey", () => {
  it("is deterministic and rounded to ~4 decimals", () => {
    expect(bboxKey({ south: -22.991234, west: -43.215678, north: -22.985, east: -43.19 })).toBe("-22.9912,-43.2157,-22.9850,-43.1900");
  });
});

describe("graph cache (IndexedDB)", () => {
  it("returns null on a miss", async () => {
    expect(await getCachedGraph(BB)).toBeNull();
  });

  it("stores and retrieves a graph with its Maps intact (structured clone)", async () => {
    await putCachedGraph(BB, sampleGraph());

    const g = await getCachedGraph(BB);
    expect(g).not.toBeNull();
    expect(g?.coords.size).toBe(2);
    expect(g?.coords.get(1)).toEqual({ lat: -22.984, lng: -43.204 });
    expect(g?.adj.get(1)?.some((e) => e.to === 2)).toBe(true);
  });

  it("treats an entry older than the TTL as stale", async () => {
    await putCachedGraph(BB, sampleGraph());
    expect(await getCachedGraph(BB, { ttlMs: 0 })).toBeNull();
  });

  it("clears all cached graphs", async () => {
    await putCachedGraph(BB, sampleGraph());
    expect(await getCachedGraph(BB)).not.toBeNull();

    await clearGraphCache();
    expect(await getCachedGraph(BB)).toBeNull();
  });
});

describe("loadRoadGraph", () => {
  it("fetches from Overpass on a miss and caches the result", async () => {
    vi.mocked(fetchRoadGraph).mockResolvedValue({ graph: sampleGraph() });

    const result = await loadRoadGraph(BB);

    expect(result.graph?.coords.size).toBe(2);
    expect(fetchRoadGraph).toHaveBeenCalledTimes(1);
    expect(await getCachedGraph(BB)).not.toBeNull(); // stored
  });

  it("serves a second load of the same area from cache (no second Overpass hit)", async () => {
    vi.mocked(fetchRoadGraph).mockResolvedValue({ graph: sampleGraph() });

    await loadRoadGraph(BB);
    await loadRoadGraph(BB);

    expect(fetchRoadGraph).toHaveBeenCalledTimes(1);
  });

  it("returns the error and caches nothing when the fetch fails", async () => {
    vi.mocked(fetchRoadGraph).mockResolvedValue({ error: "boom" });

    const result = await loadRoadGraph(BB);

    expect(result.error).toBe("boom");
    expect(result.graph).toBeUndefined();
    expect(await getCachedGraph(BB)).toBeNull();
  });
});
