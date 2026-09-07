import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { buildOverpassQuery, bboxFromBounds, bboxFromPoints, bboxAreaKm2, fetchRoadGraph } from "../../../utils/routing/osm";
import type { BBox, FetchRoadGraphOptions } from "../../../utils/routing/osm";
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

/**
 * Minimal Response-likes (the code only reads .ok/.status/.text).
 * `.text()` and not `.json()` since TASK-CHORE-006: o tamanho da resposta é uma
 * das métricas medidas, e só o corpo cru dá esse número.
 */
const okJson = (body: unknown): Response => ({ ok: true, status: 200, text: () => Promise.resolve(JSON.stringify(body)) }) as unknown as Response;
/** Non-ok response; `retryAfter` (seconds) populates the header the retry loop reads (TASK-BG-008). */
const httpError = (status: number, retryAfter?: string): Response =>
  ({ ok: false, status, headers: { get: (name: string) => (name === "Retry-After" ? (retryAfter ?? null) : null) }, text: () => Promise.resolve("") }) as unknown as Response;
const unparsable = (): Response => ({ ok: true, status: 200, text: () => Promise.resolve("{ não é json") }) as unknown as Response;

/** No-op sleep so retry tests don't wait on the real backoff clock. */
const noSleep = () => Promise.resolve();

/**
 * SEMPRE chame o grafo por aqui, nunca `fetchRoadGraph` direto (TASK-BG-009).
 *
 * Qualquer caminho de falha atravessa o backoff REAL da TASK-BG-008: com
 * `MAX_ATTEMPTS = 3` a espera soma 4,5 s a 5,3 s contra o timeout padrão de 5 s do
 * Vitest, então o teste passa ou falha conforme a carga da máquina. Foi assim que o
 * "omits stats when the request fails" ficou instável: a BG-008 criou o `noSleep` e o
 * injetou em sete testes, mas esqueceu o do bloco de medição.
 *
 * Este wrapper injeta `noSleep` por padrão para que esquecer deixe de ser possível.
 * O spread no fim mantém o override: quem precisa espionar o relógio passa o próprio
 * `sleep` e ele vence.
 */
const buscarGrafo = (opts: FetchRoadGraphOptions = {}) => fetchRoadGraph(IPANEMA, { sleep: noSleep, ...opts });

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

describe("bboxAreaKm2", () => {
  it("measures the Ipanema bbox at roughly 2 km²", () => {
    // ~1,11 km (0,01° de lat) × ~1,90 km (0,0185° de lng em -22,98°)
    expect(bboxAreaKm2(IPANEMA)).toBeCloseTo(2.11, 1);
  });

  it("shrinks longitude with latitude (same degrees, smaller area near the pole)", () => {
    const equator: BBox = { south: 0, west: 0, north: 0.1, east: 0.1 };
    const north60: BBox = { south: 60, west: 0, north: 60.1, east: 0.1 };
    expect(bboxAreaKm2(north60)).toBeLessThan(bboxAreaKm2(equator));
  });

  it("is zero for a degenerate bbox", () => {
    expect(bboxAreaKm2({ south: -22.98, west: -43.2, north: -22.98, east: -43.2 })).toBe(0);
  });
});

describe("fetchRoadGraph — medição (TASK-CHORE-006)", () => {
  it("reports area, timing, payload size and graph size on success", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson(oneWayResponse));

    const { stats } = await buscarGrafo();

    expect(stats).toBeDefined();
    expect(stats?.bboxKm2).toBeCloseTo(2.11, 1);
    expect(stats?.nodes).toBe(2);
    expect(stats?.edges).toBe(2); // via de mão dupla ⇒ 2 arestas dirigidas
    expect(stats?.responseKb).toBeGreaterThanOrEqual(0);
    expect(stats?.totalMs).toBeGreaterThanOrEqual(stats!.networkMs);
  });

  it("omits stats when the request fails (nothing to measure)", async () => {
    vi.mocked(fetch).mockResolvedValue(httpError(429));

    expect((await buscarGrafo()).stats).toBeUndefined();
  });
});

describe("fetchRoadGraph", () => {
  it("builds a graph from the Overpass elements on success", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson(oneWayResponse));

    const result = await buscarGrafo();

    expect(result.error).toBeUndefined();
    expect(result.graph?.coords.size).toBe(2);
    expect(result.graph?.adj.get(1)?.some((e) => e.to === 2)).toBe(true);
    expect(result.graph?.adj.get(2)?.some((e) => e.to === 1)).toBe(true); // two-way
    expect(result.graph?.coords.get(1)).toEqual({ lat: -22.984, lng: -43.204 }); // lon -> lng
  });

  it("posts the encoded query to the default Overpass endpoint", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson(oneWayResponse));

    await buscarGrafo();

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, init] = vi.mocked(fetch).mock.calls[0];
    expect(url).toBe("https://overpass-api.de/api/interpreter");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toEqual({ "Content-Type": "application/x-www-form-urlencoded" });
    expect(String(init?.body)).toMatch(/^data=/);
  });

  it("honors a custom endpoint from options", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson(oneWayResponse));

    await buscarGrafo({ endpoint: "https://mirror.test/api" });

    expect(vi.mocked(fetch).mock.calls[0][0]).toBe("https://mirror.test/api");
  });

  it("returns an error message when Overpass keeps responding non-ok", async () => {
    vi.mocked(fetch).mockResolvedValue(httpError(504));

    const result = await buscarGrafo();

    expect(result.graph).toBeUndefined();
    expect(result.error).toBe(UI_LABELS.ROUTING.OVERPASS_HTTP_ERROR(504));
  });

  it("returns the network error when fetch keeps rejecting", async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("Failed to fetch"));

    const result = await buscarGrafo();

    expect(result.graph).toBeUndefined();
    expect(result.error).toBe(UI_LABELS.ROUTING.NETWORK_ERROR);
  });

  it("returns the timeout error when the request keeps being aborted", async () => {
    vi.mocked(fetch).mockRejectedValue(new DOMException("The operation was aborted.", "AbortError"));

    const result = await buscarGrafo();

    expect(result.error).toBe(UI_LABELS.ROUTING.TIMEOUT);
  });

  it("returns an empty graph (not an error) for an area with no roads", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson({ elements: [] }));

    const result = await buscarGrafo();

    expect(result.error).toBeUndefined();
    expect(result.graph?.coords.size).toBe(0);
    expect(result.graph?.adj.size).toBe(0);
  });

  it("returns an invalid-response error when the body cannot be parsed as JSON", async () => {
    vi.mocked(fetch).mockResolvedValue(unparsable());

    const result = await buscarGrafo();

    expect(result.error).toBe(UI_LABELS.ROUTING.INVALID_RESPONSE);
  });

  it("rejects a response without elements instead of claiming an empty graph", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson({}));

    const result = await buscarGrafo();

    expect(result.error).toBeDefined();
    expect(result.graph).toBeUndefined();
  });

  it("auto-retries a transient 503 and succeeds on a later attempt", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(httpError(503)).mockResolvedValueOnce(okJson(oneWayResponse));

    const result = await buscarGrafo();

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(result.error).toBeUndefined();
    expect(result.graph?.coords.size).toBe(2);
    expect(result.stats).toBeDefined();
  });

  it("does NOT retry a non-retryable status like 400 (bad query)", async () => {
    vi.mocked(fetch).mockResolvedValue(httpError(400));

    const result = await buscarGrafo();

    expect(fetch).toHaveBeenCalledTimes(1); // one shot, no retry
    expect(result.error).toBe(UI_LABELS.ROUTING.OVERPASS_HTTP_ERROR(400));
  });

  it("stops after maxAttempts and returns the last error", async () => {
    vi.mocked(fetch).mockResolvedValue(httpError(503));

    const result = await buscarGrafo({ maxAttempts: 3 });

    expect(fetch).toHaveBeenCalledTimes(3);
    expect(result.error).toBe(UI_LABELS.ROUTING.OVERPASS_HTTP_ERROR(503));
  });

  it("honors the Retry-After header for the backoff wait", async () => {
    // 503 with "Retry-After: 3", then success — the wait must be >= 3 s (+ jitter).
    vi.mocked(fetch).mockResolvedValueOnce(httpError(503, "3")).mockResolvedValueOnce(okJson(oneWayResponse));
    const sleepSpy = vi.fn<(ms: number) => Promise<void>>(() => Promise.resolve());

    await buscarGrafo({ sleep: sleepSpy });

    expect(sleepSpy).toHaveBeenCalledTimes(1);
    expect(sleepSpy.mock.calls[0][0]).toBeGreaterThanOrEqual(3000);
    expect(sleepSpy.mock.calls[0][0]).toBeLessThan(3500); // 3000 + jitter cap
  });

  it("logs only counts in DEV, never coordinates or addresses (no PII)", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson(oneWayResponse));

    await buscarGrafo();

    const logged = vi
      .mocked(console.info)
      .mock.calls.map((c) => c.join(" "))
      .join(" ");
    expect(logged).toContain("nós=");
    expect(logged).not.toContain("-43.204");
    expect(logged).not.toContain("Rua Teste");
  });
});

describe("BG-011 — falhas observaveis", () => {
  it("nao aceita dados parciais quando Overpass retorna remark com HTTP 200", async () => {
    vi.mocked(fetch).mockResolvedValue(okJson({ ...oneWayResponse, remark: "runtime error: Query timed out" }));
    const result = await buscarGrafo({ maxAttempts: 1 });
    expect(result.graph).toBeUndefined();
    expect(result.diagnostics?.attempts[0]).toMatchObject({ category: "overpass", httpStatus: 200 });
  });

  it("preserva HTTP de cada tentativa e sucesso posterior", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(httpError(503)).mockResolvedValueOnce(okJson(oneWayResponse));
    const result = await buscarGrafo();
    expect(result.graph?.coords.size).toBe(2);
    expect(result.diagnostics?.attempts.map((a) => [a.category, a.httpStatus])).toEqual([
      ["http", 503],
      ["ok", 200],
    ]);
  });

  it("falha de rede nao inventa status HTTP nem quantidade de bytes", async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("Failed to fetch"));
    const result = await buscarGrafo({ maxAttempts: 1 });
    expect(result.diagnostics?.attempts[0]).toMatchObject({ category: "network", httpStatus: null, responseBytes: null, headersMs: null });
  });

  it("cancelamento externo nao dispara retry", async () => {
    const controller = new AbortController();
    controller.abort();
    const result = await buscarGrafo({ signal: controller.signal });
    expect(fetch).not.toHaveBeenCalled();
    expect(result.diagnostics?.attempts[0].category).toBe("cancelled");
  });
});

describe("BG-011 — limites e recuperacao", () => {
  it("nao antecipa Retry-After longo nem faz polling", async () => {
    vi.mocked(fetch).mockResolvedValue(httpError(429, "120"));
    const sleep = vi.fn(noSleep);
    const result = await buscarGrafo({ sleep });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
    expect(result.diagnostics?.attempts[0].httpStatus).toBe(429);
  });
  it("cancelar durante backoff impede nova chamada", async () => {
    const controller = new AbortController();
    vi.mocked(fetch).mockResolvedValue(httpError(503));
    const result = await buscarGrafo({
      signal: controller.signal,
      sleep: async () => {
        controller.abort();
      },
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result.diagnostics?.attempts.at(-1)?.category).toBe("cancelled");
  });
  it("mede bytes UTF-8 efetivos da resposta completa", async () => {
    const body = { elements: [], generator: "ação" };
    vi.mocked(fetch).mockResolvedValue(okJson(body));
    const result = await buscarGrafo();
    expect(result.diagnostics?.attempts[0].responseBytes).toBe(new TextEncoder().encode(JSON.stringify(body)).byteLength);
  });
  it("timeout durante leitura conserva HTTP e distingue corpo nao recebido", async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: true, status: 200, text: () => Promise.reject(new DOMException("aborted", "AbortError")) } as unknown as Response);
    const result = await buscarGrafo({ maxAttempts: 1 });
    expect(result.diagnostics?.attempts[0]).toMatchObject({ category: "timeout", httpStatus: 200, bodyMs: null, responseBytes: null });
  });
});

describe("BG-011 — estrutura incompleta", () => {
  it.each([{ elements: null }, { elements: [null] }, { elements: [{ type: "way", nodes: [1, 2] }] }])("rejeita estrutura incompleta %j", async (body) => {
    vi.mocked(fetch).mockResolvedValue(okJson(body));
    const result = await buscarGrafo();
    expect(result.graph).toBeUndefined();
    expect(result.diagnostics?.attempts[0].category).toBe("invalid-response");
  });
});

describe("BG-011 — consumo do servico publico", () => {
  it("nao repete automaticamente HTTP 429 mesmo com Retry-After curto", async () => {
    vi.mocked(fetch).mockResolvedValue(httpError(429, "3"));
    const sleep = vi.fn(noSleep);
    const result = await buscarGrafo({ sleep });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
    expect(result.error).toContain("30 segundos");
  });
  it("falha sem resposta HTTP termina apos uma tentativa", async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("Failed to fetch"));
    const result = await buscarGrafo();
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(result.diagnostics?.attempts).toHaveLength(1);
  });
});
