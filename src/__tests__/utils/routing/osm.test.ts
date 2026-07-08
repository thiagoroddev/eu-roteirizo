import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildOverpassQuery, bboxFromBounds, bboxFromPoints, fetchRoadGraph } from "../../../utils/routing/osm";
import type { BBox } from "../../../utils/routing/osm";
import { UI_LABELS } from "../../../constants/uiLabels";

/** Ipanema bbox from the prototype: south, west, north, east. */
const IPANEMA: BBox = { south: -22.9905, west: -43.215, north: -22.9805, east: -43.1965 };

/** A minimal Overpass response: one two-way street of 2 nodes. */
const oneWayResponse = {
  elements: [
    {
      type: "way",
      nodes: [1, 2],
      geometry: [
        { lat: -22.984, lon: -43.204 },
        { lat: -22.984, lon: -43.203 },
      ],
      tags: { highway: "residential", name: "Rua Teste" },
    },
  ],
};

/** Minimal Response-likes (the code only reads .ok/.status/.json). */
const okJson = (body: unknown): Response => ({ ok: true, status: 200, json: () => Promise.resolve(body) }) as unknown as Response;
const httpError = (status: number): Response => ({ ok: false, status, json: () => Promise.resolve({}) }) as unknown as Response;
const unparsable = (): Response => ({ ok: true, status: 200, json: () => Promise.reject(new SyntaxError("Unexpected token")) }) as unknown as Response;

beforeEach(() => {
  vi.stubGlobal("fetch", vi.fn());
  vi.spyOn(console, "info").mockImplementation(() => {});
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("buildOverpassQuery", () => {
  it("includes the navigable-highway filter", () => {
    expect(buildOverpassQuery(IPANEMA)).toContain('["highway"~"^(motorway|trunk|primary|secondary|tertiary|residential|unclassified|living_street|service)$"]');
  });

  it("places the bbox in Overpass order (south,west,north,east)", () => {
    expect(buildOverpassQuery(IPANEMA)).toContain("(-22.9905,-43.215,-22.9805,-43.1965)");
  });

  it("requests inline geometry as JSON", () => {
    const q = buildOverpassQuery(IPANEMA);
    expect(q).toContain("[out:json]");
    expect(q).toContain("out geom;");
  });
});

describe("bboxFromBounds", () => {
  it("maps SOUTH_WEST/NORTH_EAST to flat south,west,north,east", () => {
    expect(bboxFromBounds({ SOUTH_WEST: { lat: -23.02, lng: -43.42 }, NORTH_EAST: { lat: -22.74, lng: -43.08 } })).toEqual({ south: -23.02, west: -43.42, north: -22.74, east: -43.08 });
  });
});

describe("bboxFromPoints", () => {
  it("returns the envelope with zero margin", () => {
    const bbox = bboxFromPoints(
      [
        { lat: -22.98, lng: -43.2 },
        { lat: -22.97, lng: -43.19 },
      ],
      0
    );
    expect(bbox).toEqual({ south: -22.98, west: -43.2, north: -22.97, east: -43.19 });
  });

  it("expands the envelope by the margin (meters → degrees; lng scaled by latitude)", () => {
    const bbox = bboxFromPoints([{ lat: -22.98, lng: -43.2 }], 111_320);
    expect(bbox).not.toBeNull();
    // 111320 m ≈ 1° of latitude; longitude margin is wider at this latitude.
    expect(bbox!.south).toBeCloseTo(-23.98, 5);
    expect(bbox!.north).toBeCloseTo(-21.98, 5);
    expect(bbox!.east - -43.2).toBeGreaterThan(1);
  });

  it("returns null for an empty list (nothing to load)", () => {
    expect(bboxFromPoints([], 300)).toBeNull();
  });
});

describe("fetchRoadGraph", () => {
  it("builds a graph from the Overpass elements on success", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson(oneWayResponse));

    const result = await fetchRoadGraph(IPANEMA);

    expect(result.error).toBeUndefined();
    expect(result.graph?.coords.size).toBe(2);
    expect(result.graph?.adj.get(1)?.some((e) => e.to === 2)).toBe(true);
    expect(result.graph?.adj.get(2)?.some((e) => e.to === 1)).toBe(true); // two-way
    expect(result.graph?.coords.get(1)).toEqual({ lat: -22.984, lng: -43.204 }); // lon -> lng
  });

  it("posts the encoded query to the default Overpass endpoint", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson(oneWayResponse));

    await fetchRoadGraph(IPANEMA);

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("https://overpass-api.de/api/interpreter");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({ "Content-Type": "application/x-www-form-urlencoded" });
    expect(String(init?.body)).toMatch(/^data=/);
  });

  it("honors a custom endpoint from options", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson(oneWayResponse));

    await fetchRoadGraph(IPANEMA, { endpoint: "https://mirror.test/api" });

    expect(vi.mocked(fetch).mock.calls[0][0]).toBe("https://mirror.test/api");
  });

  it("returns an error message when Overpass responds non-ok", async () => {
    vi.mocked(fetch).mockResolvedValue(httpError(504));

    const result = await fetchRoadGraph(IPANEMA);

    expect(result.graph).toBeUndefined();
    expect(result.error).toBe(UI_LABELS.ROUTING.OVERPASS_HTTP_ERROR(504));
  });

  it("returns the network error when fetch rejects", async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await fetchRoadGraph(IPANEMA);

    expect(result.graph).toBeUndefined();
    expect(result.error).toBe(UI_LABELS.ROUTING.NETWORK_ERROR);
  });

  it("returns the timeout error when the request is aborted", async () => {
    vi.mocked(fetch).mockRejectedValue(new DOMException("The operation was aborted.", "AbortError"));

    const result = await fetchRoadGraph(IPANEMA);

    expect(result.error).toBe(UI_LABELS.ROUTING.TIMEOUT);
  });

  it("returns an empty graph (not an error) for an area with no roads", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson({ elements: [] }));

    const result = await fetchRoadGraph(IPANEMA);

    expect(result.error).toBeUndefined();
    expect(result.graph?.coords.size).toBe(0);
    expect(result.graph?.adj.size).toBe(0);
  });

  it("returns the network error when the body cannot be parsed as JSON", async () => {
    vi.mocked(fetch).mockResolvedValue(unparsable());

    const result = await fetchRoadGraph(IPANEMA);

    expect(result.error).toBe(UI_LABELS.ROUTING.NETWORK_ERROR);
  });

  it("treats a response without an elements field as an empty graph", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson({}));

    const result = await fetchRoadGraph(IPANEMA);

    expect(result.error).toBeUndefined();
    expect(result.graph?.coords.size).toBe(0);
  });

  it("logs only counts in DEV, never coordinates or addresses (no PII)", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson(oneWayResponse));

    await fetchRoadGraph(IPANEMA);

    const logged = vi
      .mocked(console.info)
      .mock.calls.map((c) => c.join(" "))
      .join(" ");
    expect(logged).toContain("nós=");
    expect(logged).not.toContain("-43.204");
    expect(logged).not.toContain("Rua Teste");
  });
});
