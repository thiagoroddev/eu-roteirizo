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

/** Default client-side timeout for the Overpass request (ms). */
const OVERPASS_TIMEOUT_MS = 30_000;

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
  /** Abort the request after this many ms (default 30000). */
  timeoutMs?: number;
  /** Override the Overpass endpoint (default the public instance; for tests/mirror). */
  endpoint?: string;
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

/**
 * Fetches the navigable road network for a bbox from Overpass and builds the
 * directed RoadGraph.
 *
 * Never throws: network/HTTP/parse failures return `{ error }` with a UI_LABELS
 * message. An area with no mapped roads is NOT an error — it returns
 * `{ graph }` with an empty graph (the caller decides what that means).
 *
 * @param bbox - The bounding box to load.
 * @param options - Optional timeout / endpoint overrides.
 * @returns `{ graph }` on success, or `{ error }` on failure.
 */
export const fetchRoadGraph = async (bbox: BBox, options: FetchRoadGraphOptions = {}): Promise<FetchRoadGraphResult> => {
  const endpoint = options.endpoint ?? OVERPASS_ENDPOINT;
  const timeoutMs = options.timeoutMs ?? OVERPASS_TIMEOUT_MS;
  const query = buildOverpassQuery(bbox);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const startedAt = performance.now();

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      body: "data=" + encodeURIComponent(query),
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: controller.signal,
    });

    if (!res.ok) {
      return { error: UI_LABELS.ROUTING.OVERPASS_HTTP_ERROR(res.status) };
    }

    // Lê como texto para medir o TAMANHO da resposta (TASK-CHORE-006): é o que
    // separa "payload grande" de "fila do servidor" — as duas correções diferem.
    const body = await res.text();
    const networkMs = performance.now() - startedAt;

    const data = JSON.parse(body) as OverpassResponse;
    const graph = buildGraph(data.elements ?? []);
    const edges = countEdges(graph);

    const stats: GraphFetchStats = {
      bboxKm2: Math.round(bboxAreaKm2(bbox) * 100) / 100,
      networkMs: Math.round(networkMs),
      totalMs: Math.round(performance.now() - startedAt),
      responseKb: Math.round(body.length / 1024),
      nodes: graph.coords.size,
      edges,
    };

    if (import.meta.env.DEV) {
      console.info(
        `fetchRoadGraph: malha carregada — nós=${stats.nodes}, arestas=${stats.edges}, bbox=${stats.bboxKm2} km², rede=${stats.networkMs} ms, total=${stats.totalMs} ms, resposta=${stats.responseKb} KB`
      );
    }

    return { graph, stats };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return { error: UI_LABELS.ROUTING.TIMEOUT };
    }
    return { error: UI_LABELS.ROUTING.NETWORK_ERROR };
  } finally {
    clearTimeout(timer);
  }
};
