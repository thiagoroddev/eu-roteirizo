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

/** Public Overpass API endpoint (see DT-005 — rate-limited, swap before release). */
const OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";

/**
 * Highway classes we route over (drivable streets). Mirrors the validated
 * prototype's filter (TASK-RF-001). Footways/cycleways/paths are excluded on
 * purpose — this engine routes a vehicle/courier on streets.
 */
const NAVIGABLE_HIGHWAYS = "motorway|trunk|primary|secondary|tertiary|residential|unclassified|living_street|service";

/** Default client-side timeout for ONE Overpass request (ms). */
const OVERPASS_TIMEOUT_MS = 30_000;

/**
 * Auto-retry against the Overpass queue (TASK-BG-008, mitigating DT-005 until
 * ADR-010's own tileset lands). Measured cause: Overpass queues a request for
 * ~8 s and then returns 429 (rate limit); an immediate manual retry hits the
 * same limit, so the loader waits and retries itself. ⚙️ MANUAL KNOB.
 */
const MAX_ATTEMPTS = 3;
/** First backoff wait; doubles each retry (1.5 s → 3 s → …), capped by RETRY_MAX_MS. ⚙️ MANUAL KNOB. */
const RETRY_BASE_MS = 1_500;
/** Ceiling for a single wait — also caps a hostile `Retry-After` so the user is never frozen. ⚙️ MANUAL KNOB. */
const RETRY_MAX_MS = 8_000;
/** Random spread added to each wait, so parallel clients don't retry in lockstep. ⚙️ MANUAL KNOB. */
const RETRY_JITTER_MS = 400;

/** HTTP statuses worth retrying: rate limit + gateway/queue transients. A 4xx like 400 (bad query) is NOT here. */
const isRetryableStatus = (status: number): boolean => status === 429 || status === 502 || status === 503 || status === 504;

/** Parses `Retry-After` (delta-seconds form) to ms, capped at RETRY_MAX_MS; `null`/HTTP-date/garbage → undefined. */
const parseRetryAfterMs = (header: string | null): number | undefined => {
  if (!header) return undefined;
  const seconds = Number(header.trim());
  if (!Number.isFinite(seconds) || seconds < 0) return undefined;
  return Math.min(RETRY_MAX_MS, seconds * 1000);
};

/** Wait before the next attempt: honor `Retry-After`, else exponential backoff; always + jitter. */
const retryDelayMs = (attempt: number, retryAfterMs: number | undefined): number => {
  const backoff = Math.min(RETRY_MAX_MS, RETRY_BASE_MS * 2 ** (attempt - 1));
  return (retryAfterMs ?? backoff) + Math.random() * RETRY_JITTER_MS;
};

/** Real sleep; injectable so tests advance without wall-clock waits. */
const realSleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

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

/** Result of `fetchRoadGraph`: a graph on success, OR a UI error message. */
export interface FetchRoadGraphResult {
  /** The directed road graph (present on success; empty graph if the area has no roads). */
  graph?: RoadGraph;
  /** A user-facing error message (from UI_LABELS.ROUTING) when the fetch/parse failed. */
  error?: string;
  /** Medição da carga (só no sucesso) — quem persiste é o `graphCache` (camada de IO). */
  stats?: GraphFetchStats;
}

/** Shape of the Overpass JSON we consume (only `elements` is used). */
interface OverpassResponse {
  elements: OsmElement[];
  version?: number;
  generator?: string;
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

/** Outcome of ONE Overpass request: the raw body, or a failure the loop reads to decide a retry. */
type AttemptOutcome = { kind: "ok"; body: string; networkMs: number } | { kind: "fail"; error: string; retryable: boolean; retryAfterMs?: number };

/**
 * Fetches the navigable road network for a bbox from Overpass and builds the
 * directed RoadGraph, auto-retrying the transient Overpass queue (TASK-BG-008).
 *
 * Never throws: HTTP/parse/network failures return `{ error }` with a UI_LABELS
 * message. Transient failures (429/502/503/504, timeout, network) are retried
 * with backoff (honoring `Retry-After`) up to `maxAttempts`; a non-retryable
 * error (e.g. 400 bad query, unparsable body) returns immediately. An area with
 * no mapped roads is NOT an error — it returns `{ graph }` with an empty graph.
 * `stats.totalMs` spans ALL attempts + waits, so the diagnostic's total-vs-rede
 * gap reveals the retry (TASK-CHORE-006).
 *
 * @param bbox - The bounding box to load.
 * @param options - Optional timeout / endpoint / attempts / sleep overrides.
 * @returns `{ graph, stats }` on success, or `{ error }` after the last attempt.
 */
export const fetchRoadGraph = async (bbox: BBox, options: FetchRoadGraphOptions = {}): Promise<FetchRoadGraphResult> => {
  const endpoint = options.endpoint ?? OVERPASS_ENDPOINT;
  const timeoutMs = options.timeoutMs ?? OVERPASS_TIMEOUT_MS;
  const maxAttempts = options.maxAttempts ?? MAX_ATTEMPTS;
  const sleep = options.sleep ?? realSleep;
  const query = buildOverpassQuery(bbox);

  /** One request, its own AbortController/timer; classifies the failure for the loop. */
  const attemptOnce = async (): Promise<AttemptOutcome> => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    const attemptStart = performance.now();
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        body: "data=" + encodeURIComponent(query),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        signal: controller.signal,
      });
      if (!res.ok) {
        return { kind: "fail", error: UI_LABELS.ROUTING.OVERPASS_HTTP_ERROR(res.status), retryable: isRetryableStatus(res.status), retryAfterMs: parseRetryAfterMs(res.headers.get("Retry-After")) };
      }
      // Read as text to MEASURE the response size (TASK-CHORE-006): it's what
      // separates "big payload" from "server queue" — opposite fixes.
      return { kind: "ok", body: await res.text(), networkMs: performance.now() - attemptStart };
    } catch (err) {
      // Timeout and network drops are transient → retryable.
      if (err instanceof DOMException && err.name === "AbortError") return { kind: "fail", error: UI_LABELS.ROUTING.TIMEOUT, retryable: true };
      return { kind: "fail", error: UI_LABELS.ROUTING.NETWORK_ERROR, retryable: true };
    } finally {
      clearTimeout(timer);
    }
  };

  const startedAt = performance.now();
  let lastError = UI_LABELS.ROUTING.NETWORK_ERROR;

  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const outcome = await attemptOnce();

    if (outcome.kind === "ok") {
      try {
        const data = JSON.parse(outcome.body) as OverpassResponse;
        const graph = buildGraph(data.elements ?? []);
        const stats: GraphFetchStats = {
          bboxKm2: Math.round(bboxAreaKm2(bbox) * 100) / 100,
          networkMs: Math.round(outcome.networkMs),
          totalMs: Math.round(performance.now() - startedAt),
          responseKb: Math.round(outcome.body.length / 1024),
          nodes: graph.coords.size,
          edges: countEdges(graph),
        };
        if (import.meta.env.DEV) {
          console.info(
            `fetchRoadGraph: malha carregada — tentativas=${attempt}, nós=${stats.nodes}, arestas=${stats.edges}, bbox=${stats.bboxKm2} km², rede=${stats.networkMs} ms, total=${stats.totalMs} ms, resposta=${stats.responseKb} KB`
          );
        }
        return { graph, stats };
      } catch {
        // A 200 body that isn't valid JSON is a hard error, not a queue transient.
        return { error: UI_LABELS.ROUTING.NETWORK_ERROR };
      }
    }

    lastError = outcome.error;
    // Stop early on a non-retryable error or after the last attempt.
    if (!outcome.retryable || attempt === maxAttempts) break;
    await sleep(retryDelayMs(attempt, outcome.retryAfterMs));
  }

  return { error: lastError };
};
