/**
 * utils/routing/osm.ts - OSM data layer for local routing (TASK-RF-005.2, ADR-002).
 *
 * Fetches the navigable road network for a bounding box from the OpenStreetMap
 * Overpass API, parses the response and builds a directed RoadGraph by reusing
 * `buildGraph` (TASK-RF-005.1). This is the ONLY module in the routing engine
 * that touches the network; the graph/A* core stays pure.
 *
 * Error convention (matches excelProcessor): failures RETURN an object with an
 * `error` (a UI_LABELS message), never throw. The caller does
 * `if (result.error) setError(result.error)`.
 *
 * NOTE (tech debt DT-005): the public Overpass endpoint is rate-limited and has
 * a usage policy, like the public OSM tiles (DT-004). Revisit before the first
 * public release — consider a mirror or self-hosted instance (use options.endpoint).
 * Callers should pass a NEIGHBORHOOD-sized bbox, not the whole city (graph size).
 */

import type { OsmElement, RoadGraph } from "./graph";
import { buildGraph, countEdges } from "./graph";
import { UI_LABELS } from "../../constants/uiLabels";

/** Proxy Overpass no Cloudflare Worker (TASK-BG-011) para contornar CORS e instabilidade de endpoint público. */
const OVERPASS_ENDPOINT = "https://1-teste-prototipo.thiagorod-dev.workers.dev/overpass";

/**
 * Highway classes we route over (drivable streets). Mirrors the validated
 * prototype's filter (TASK-RF-001) plus connector link roads (TASK-BG-012).
 * Footways/cycleways/paths are excluded on purpose — this engine routes a vehicle/courier on streets.
 */
const NAVIGABLE_HIGHWAYS = "motorway|motorway_link|trunk|trunk_link|primary|primary_link|secondary|secondary_link|tertiary|tertiary_link|residential|unclassified|living_street|service";

/** Default client-side timeout for ONE Overpass request (ms). */
const OVERPASS_TIMEOUT_MS = 30_000;

/** Retry only recoverable responses. Public Overpass throttling (429) must not
 * trigger rapid retries; an unavailable connection should not hold the user
 * through three identical waits. See TASK-BG-011 and operator notice 2026-08-11.
 */
const MAX_ATTEMPTS = 3;
/** First backoff wait; doubles each retry (1.5 s → 3 s → …), capped by RETRY_MAX_MS. ⚙️ MANUAL KNOB. */
const RETRY_BASE_MS = 1_500;
/** Ceiling for a single wait — also caps a hostile `Retry-After` so the user is never frozen. ⚙️ MANUAL KNOB. */
const RETRY_MAX_MS = 8_000;
/** Random spread added to each wait, so parallel clients don't retry in lockstep. ⚙️ MANUAL KNOB. */
const RETRY_JITTER_MS = 400;

/** Retry gateway failures; throttling/refusal requires a later user action. */
const isRetryableStatus = (status: number): boolean => status === 502 || status === 503 || status === 504;

/** Parses Retry-After without shortening the server cooldown. */
const parseRetryAfterMs = (header: string | null): number | undefined => {
  if (!header) return undefined;
  const value = header.trim();
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return seconds >= 0 ? seconds * 1000 : undefined;
  const at = Date.parse(value);
  return Number.isFinite(at) ? Math.max(0, at - Date.now()) : undefined;
};

/** Wait before the next attempt: honor `Retry-After`, else exponential backoff; always + jitter. */
const retryDelayMs = (attempt: number, retryAfterMs: number | undefined): number => {
  const backoff = Math.min(RETRY_MAX_MS, RETRY_BASE_MS * 2 ** (attempt - 1));
  return (retryAfterMs ?? backoff) + Math.random() * RETRY_JITTER_MS;
};

/**
 * A geographic bounding box, in the order Overpass expects: south, west, north,
 * east (degrees). Flat numbers (not nested SW/NE) to map 1:1 to the query and
 * remove SW/NE ambiguity at the call site.
 */
export interface BBox {
  /** Southern latitude (min lat). */
  south: number;
  /** Western longitude (min lng). */
  west: number;
  /** Northern latitude (max lat). */
  north: number;
  /** Eastern longitude (max lng). */
  east: number;
}

/** Options for `fetchRoadGraph` (all optional; sensible module defaults). */
export interface FetchRoadGraphOptions {
  /** Abort ONE request after this many ms (default 30000). */
  timeoutMs?: number;
  /** Override the Overpass endpoint (default the public instance; for tests/mirror). */
  endpoint?: string;
  /** Max attempts including the first (default MAX_ATTEMPTS; TASK-BG-008). */
  maxAttempts?: number;
  /** Sleep between retries — injected in tests to skip the real wait. */
  sleep?: (ms: number) => Promise<void>;
  signal?: AbortSignal;
}

/** Medição de UMA carga de malha (TASK-CHORE-006 / ADR-010). Só números. */
export interface GraphFetchStats {
  /** Área do bbox consultado, em km². */
  bboxKm2: number;
  /** Tempo até a resposta chegar (rede + fila do servidor), em ms. */
  networkMs: number;
  /** Tempo total, incluindo parse + `buildGraph`, em ms. */
  totalMs: number;
  /** Tamanho aproximado da resposta, em KB. */
  responseKb: number;
  nodes: number;
  edges: number;
}

export type GraphFailureCategory = "ok" | "http" | "timeout" | "network" | "invalid-response" | "overpass" | "cancelled";
export interface GraphAttempt {
  category: GraphFailureCategory;
  httpStatus: number | null;
  headersMs: number | null;
  bodyMs: number | null;
  totalMs: number;
  responseBytes: number | null;
}
export interface GraphDiagnostics {
  version: 1;
  attempts: GraphAttempt[];
}

/** Result of `fetchRoadGraph`: a graph on success, OR a UI error message. */
export interface FetchRoadGraphResult {
  /** The directed road graph (present on success; empty graph if the area has no roads). */
  graph?: RoadGraph;
  /** A user-facing error message (from UI_LABELS.ROUTING) when the fetch/parse failed. */
  error?: string;
  /** Medição da carga (só no sucesso) — quem persiste é o `graphCache` (camada de IO). */
  stats?: GraphFetchStats;
  diagnostics?: GraphDiagnostics;
}

/** Shape of the Overpass JSON we consume (only `elements` is used). */
interface OverpassResponse {
  elements: OsmElement[];
  version?: number;
  generator?: string;
  remark?: string;
}

/**
 * Builds the Overpass QL query for the navigable road network in a bbox.
 *
 * Pure and side-effect free — the unit of logic worth testing without a network
 * mock. Emits `out geom` so each way carries its node coordinates inline (what
 * `buildGraph` consumes). Coordinate order is Overpass's: (south,west,north,east).
 *
 * @param bbox - The bounding box to query.
 * @returns The Overpass QL query string.
 */
export const buildOverpassQuery = (bbox: BBox): string => {
  const { south, west, north, east } = bbox;
  return `[out:json][timeout:30];way["highway"~"^(${NAVIGABLE_HIGHWAYS})$"](${south},${west},${north},${east});out geom;`;
};

/**
 * Adapts a `{SOUTH_WEST, NORTH_EAST}` bounds object (the shape of
 * MAP_CONFIG.RIO_BOUNDS and Leaflet bounds) to the flat `BBox` this module uses.
 * Isolates the SW/NE → (s,w,n,e) conversion in one tested place.
 *
 * @param bounds - South-west and north-east corners as {lat, lng}.
 * @returns The equivalent BBox.
 */
export const bboxFromBounds = (bounds: { SOUTH_WEST: { lat: number; lng: number }; NORTH_EAST: { lat: number; lng: number } }): BBox => ({
  south: bounds.SOUTH_WEST.lat,
  west: bounds.SOUTH_WEST.lng,
  north: bounds.NORTH_EAST.lat,
  east: bounds.NORTH_EAST.lng,
});

/** Meters per degree of latitude (spherical approximation, same model as geo.ts). */
const METERS_PER_DEGREE_LAT = 111_320;

/**
 * Envelope of a set of coordinates expanded by a margin, as a BBox — the
 * neighborhood-sized area to load the road graph for (TASK-RF-006.3, DT-005).
 * The margin gives map matching/A* street context around border points.
 *
 * @param coords - The coordinates to cover (e.g. the route's delivery points).
 * @param marginMeters - How far beyond the envelope to extend, in meters.
 * @returns The expanded BBox, or `null` for an empty list (nothing to load).
 */
export const bboxFromPoints = (coords: { lat: number; lng: number }[], marginMeters: number): BBox | null => {
  if (coords.length === 0) return null;

  let south = Infinity;
  let west = Infinity;
  let north = -Infinity;
  let east = -Infinity;
  for (const c of coords) {
    if (c.lat < south) south = c.lat;
    if (c.lat > north) north = c.lat;
    if (c.lng < west) west = c.lng;
    if (c.lng > east) east = c.lng;
  }

  const latMargin = marginMeters / METERS_PER_DEGREE_LAT;
  /** Longitude degrees shrink with latitude; use the envelope's center latitude. */
  const lngMargin = marginMeters / (METERS_PER_DEGREE_LAT * Math.cos(((south + north) / 2) * (Math.PI / 180)));

  return { south: south - latMargin, west: west - lngMargin, north: north + latMargin, east: east + lngMargin };
};

/**
 * Área aproximada de um bbox, em km² (TASK-CHORE-006).
 *
 * É a métrica que diz se a lentidão da carga é proporcional ao **tamanho da
 * área** pedida ou independe dela (fila do Overpass) — a pergunta que a ADR-010
 * deixou em aberto. Mesmo modelo esférico do `bboxFromPoints`: os graus de
 * longitude encolhem com a latitude, então usa o cosseno da latitude central.
 *
 * @param bbox - The bounding box to measure.
 * @returns The approximate area in km².
 */
export const bboxAreaKm2 = (bbox: BBox): number => {
  const latKm = ((bbox.north - bbox.south) * METERS_PER_DEGREE_LAT) / 1000;
  const centerLat = ((bbox.south + bbox.north) / 2) * (Math.PI / 180);
  const lngKm = ((bbox.east - bbox.west) * METERS_PER_DEGREE_LAT * Math.cos(centerLat)) / 1000;
  return Math.abs(latKm * lngKm);
};

/** Fetch and validate each response before constructing or caching a graph. */
export const fetchRoadGraph = async (bbox: BBox, options: FetchRoadGraphOptions = {}): Promise<FetchRoadGraphResult> => {
  const endpoint = options.endpoint ?? OVERPASS_ENDPOINT;
  const timeoutMs = options.timeoutMs ?? OVERPASS_TIMEOUT_MS;
  const maxAttempts = Math.max(1, Math.min(MAX_ATTEMPTS, options.maxAttempts ?? MAX_ATTEMPTS));
  const diagnostics: GraphDiagnostics = { version: 1, attempts: [] };
  const startedAt = performance.now();
  let lastError = UI_LABELS.ROUTING.NETWORK_ERROR;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const started = performance.now();
    const entry: GraphAttempt = { category: "network", httpStatus: null, headersMs: null, bodyMs: null, totalMs: 0, responseBytes: null };
    diagnostics.attempts.push(entry);
    const controller = new AbortController();
    const abort = () => controller.abort();
    options.signal?.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(abort, timeoutMs);
    let retryable = false;
    let retryAfterMs: number | undefined;
    let graph: RoadGraph | undefined;
    try {
      if (options.signal?.aborted) throw new DOMException("Cancelled", "AbortError");
      const res = await fetch(endpoint, {
        method: "POST",
        body: "data=" + encodeURIComponent(buildOverpassQuery(bbox)),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal: controller.signal,
      });
      entry.httpStatus = res.status;
      entry.headersMs = Math.round(performance.now() - started);
      if (!res.ok) {
        entry.category = "http";
        lastError = UI_LABELS.ROUTING.OVERPASS_HTTP_ERROR(res.status);
        retryable = isRetryableStatus(res.status);
        retryAfterMs = parseRetryAfterMs(res.headers.get("Retry-After"));
      } else {
        const bodyStarted = performance.now();
        const body = await res.text();
        entry.bodyMs = Math.round(performance.now() - bodyStarted);
        entry.responseBytes = new TextEncoder().encode(body).byteLength;
        // JSON/structure errors are distinct from transport failures.
        entry.category = "invalid-response";
        lastError = UI_LABELS.ROUTING.INVALID_RESPONSE;
        let data: OverpassResponse | null = null;
        try {
          data = JSON.parse(body) as OverpassResponse;
        } catch {
          /* recorded as invalid-response */
        }
        if (data && typeof data.remark === "string" && data.remark.trim()) {
          entry.category = "overpass";
          lastError = UI_LABELS.ROUTING.OVERPASS_ERROR;
          retryable = /timed out|out of memory|runtime error/i.test(data.remark);
        } else if (
          data &&
          Array.isArray(data.elements) &&
          data.elements.every(
            (element) =>
              element &&
              element.type === "way" &&
              Array.isArray(element.nodes) &&
              Array.isArray(element.geometry) &&
              element.nodes.length === element.geometry.length &&
              element.nodes.every(Number.isFinite) &&
              element.geometry.every((point) => point !== null && Number.isFinite(point.lat) && Number.isFinite(point.lon))
          )
        ) {
          try {
            graph = buildGraph(data.elements);
            entry.category = "ok";
          } catch {
            /* malformed elements: do not return or cache a graph */
          }
        }
      }
    } catch (err) {
      if (options.signal?.aborted) {
        entry.category = "cancelled";
        lastError = UI_LABELS.ROUTING.CANCELLED;
      } else if (controller.signal.aborted || (err instanceof DOMException && err.name === "AbortError")) {
        entry.category = "timeout";
        lastError = UI_LABELS.ROUTING.TIMEOUT;
        retryable = true;
      } else {
        entry.category = "network";
        lastError = UI_LABELS.ROUTING.NETWORK_ERROR;
        retryable = false;
      }
    } finally {
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", abort);
      entry.totalMs = Math.round(performance.now() - started);
    }
    if (graph) {
      const stats: GraphFetchStats = {
        bboxKm2: Math.round(bboxAreaKm2(bbox) * 100) / 100,
        networkMs: (entry.headersMs ?? 0) + (entry.bodyMs ?? 0),
        totalMs: Math.round(performance.now() - startedAt),
        responseKb: Math.round((entry.responseBytes ?? 0) / 1024),
        nodes: graph.coords.size,
        edges: countEdges(graph),
      };
      if (import.meta.env.DEV) console.info(`fetchRoadGraph: nós=${stats.nodes}, arestas=${stats.edges}, tentativas=${attempt}`);
      return { graph, stats, diagnostics };
    }
    if (!retryable || attempt === maxAttempts || options.signal?.aborted) break;
    // Do not retry earlier than the server permits. A long cooldown is left to the user.
    if (retryAfterMs !== undefined && retryAfterMs > RETRY_MAX_MS) break;
    const delay = retryDelayMs(attempt, retryAfterMs);
    await new Promise<void>((resolve) => {
      let waitTimer: ReturnType<typeof setTimeout> | undefined;
      const done = () => {
        clearTimeout(waitTimer);
        options.signal?.removeEventListener("abort", done);
        resolve();
      };
      options.signal?.addEventListener("abort", done, { once: true });
      if (options.signal?.aborted) done();
      else if (options.sleep) void options.sleep(delay).then(done, done);
      else waitTimer = setTimeout(done, delay);
    });
  }
  return { error: lastError, diagnostics };
};
