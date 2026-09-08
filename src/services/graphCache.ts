/**
 * services/graphCache.ts - Local cache of the routing road graph (TASK-RF-005.3).
 *
 * Persists a RoadGraph per bounding box in IndexedDB so a second visit to the
 * same area is served from disk instead of hitting Overpass again (mitigates
 * DT-005) and so the PWA can plan offline after the first load.
 *
 * Resilient by design: any IndexedDB failure (private mode, quota, no IDB)
 * degrades to a cache MISS / no-op — it never breaks the app. The graph is
 * stored as-is; IndexedDB's structured clone preserves the `Map`s, so there is
 * no manual Map↔array serialization.
 */

import { openDB, type IDBPDatabase } from "idb";
import type { RoadGraph } from "../utils/routing/graph";
import { countEdges } from "../utils/routing/graph";
import type { BBox, FetchRoadGraphOptions, FetchRoadGraphResult } from "../utils/routing/osm";
import { bboxAreaKm2, fetchRoadGraph } from "../utils/routing/osm";
import { recordGraphSample } from "./graphDiagnostics";

const DB_NAME = "eu-roteirizo-routing";
/** Bump to invalidate all cached graphs when the graph format or highways filter changes (TASK-BG-012). */
const DB_VERSION = 2;
const STORE = "graphs";
/** Cached graphs older than this are treated as stale (OSM data changes slowly). */
const DEFAULT_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** Current schema version of the cached graph (TASK-BG-012: includes *_link highways). */
const CURRENT_SCHEMA_VERSION = 2;

/** One cache entry: the graph plus when it was stored (ms epoch). */
interface CacheRecord {
  graph: RoadGraph;
  storedAt: number;
  schemaVersion?: number;
}

/** Lazily-opened DB connection, cached for the module's lifetime. */
let dbPromise: Promise<IDBPDatabase> | null = null;

const getDb = (): Promise<IDBPDatabase> => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        } else if (oldVersion < DB_VERSION) {
          // Clear stale graphs on schema upgrade
          db.clear(STORE);
        }
      },
    });
  }
  return dbPromise;
};

/** Options shared by the cache helpers. */
export interface GraphCacheOptions {
  /** Entries older than this many ms are treated as stale (default 7 days). */
  ttlMs?: number;
}

/**
 * Stable cache key for a bbox. Rounded to ~4 decimals (~11 m) so that
 * near-identical bounding boxes collapse to the same entry.
 *
 * @param bbox - The bounding box.
 * @returns A deterministic string key.
 */
export const bboxKey = (bbox: BBox): string => [bbox.south, bbox.west, bbox.north, bbox.east].map((n) => n.toFixed(4)).join(",");

/**
 * Returns the cached graph for a bbox if a fresh entry exists, else `null`.
 * Never throws — a cache failure is reported as a miss (`null`).
 *
 * @param bbox - The bounding box to look up.
 * @param options - Optional TTL override.
 * @returns The cached RoadGraph, or `null` on miss/stale/failure.
 */
type CacheReadState = "hit" | "miss" | "expired" | "read-error";
const readCachedGraph = async (bbox: BBox, options: GraphCacheOptions = {}): Promise<{ graph: RoadGraph | null; state: CacheReadState }> => {
  try {
    const db = await getDb();
    const record = (await db.get(STORE, bboxKey(bbox))) as CacheRecord | undefined;
    if (!record) return { graph: null, state: "miss" };
    if (!record.schemaVersion || record.schemaVersion < CURRENT_SCHEMA_VERSION) return { graph: null, state: "expired" };
    if (Date.now() - record.storedAt >= (options.ttlMs ?? DEFAULT_TTL_MS)) return { graph: null, state: "expired" };
    return { graph: record.graph, state: "hit" };
  } catch {
    return { graph: null, state: "read-error" };
  }
};
export const getCachedGraph = async (bbox: BBox, options: GraphCacheOptions = {}): Promise<RoadGraph | null> => (await readCachedGraph(bbox, options)).graph;

/**
 * Stores a graph for a bbox (best-effort; failures are swallowed).
 *
 * @param bbox - The bounding box this graph covers.
 * @param graph - The RoadGraph to cache.
 */
export const putCachedGraph = async (bbox: BBox, graph: RoadGraph): Promise<boolean> => {
  try {
    const db = await getDb();
    const record: CacheRecord = { graph, storedAt: Date.now(), schemaVersion: CURRENT_SCHEMA_VERSION };
    await db.put(STORE, record, bboxKey(bbox));
    return true;
  } catch {
    return false;
  }
};

/** Clears all cached graphs (maintenance / tests). Never throws. */
export const clearGraphCache = async (): Promise<void> => {
  try {
    const db = await getDb();
    await db.clear(STORE);
  } catch {
    // ignore
  }
};

/**
 * Loads the road graph for a bbox: cache first, Overpass on a miss (storing the
 * fresh result). A previously cached area returns without touching the network,
 * so planning works offline after the first load.
 *
 * @param bbox - The bounding box to load.
 * @param options - TTL plus the underlying fetch options (timeout/endpoint).
 * @returns `{ graph }` on success (cache or network), or `{ error }` on a network failure.
 */
export const loadRoadGraph = async (bbox: BBox, options: GraphCacheOptions & FetchRoadGraphOptions = {}): Promise<FetchRoadGraphResult> => {
  const startedAt = performance.now();
  /** Campos numéricos comuns às três origens (TASK-CHORE-006). */
  const base = () => ({ at: new Date().toISOString(), bboxKm2: Math.round(bboxAreaKm2(bbox) * 100) / 100, totalMs: Math.round(performance.now() - startedAt) });

  const { graph: cached, state: cacheState } = await readCachedGraph(bbox, options);
  if (cached) {
    if (import.meta.env.DEV) console.info(`loadRoadGraph: cache hit — nós=${cached.coords.size}`);
    // Cache hit TAMBÉM vira amostra: sem isso o painel fica vazio numa área já
    // visitada e parece instrumento quebrado — foi o que aconteceu no 1º smoke.
    recordGraphSample({ ...base(), schemaVersion: 1, cacheState, cacheWrite: "not-needed", source: "cache", networkMs: 0, responseKb: 0, nodes: cached.coords.size, edges: countEdges(cached) });
    return { graph: cached };
  }

  const result = await fetchRoadGraph(bbox, options);
  const cacheWrite = result.graph ? ((await putCachedGraph(bbox, result.graph)) ? "stored" : "write-error") : "not-needed";

  if (result.stats) recordGraphSample({ at: base().at, source: "rede", ...result.stats, schemaVersion: 1, cacheState, cacheWrite, diagnostics: result.diagnostics });
  // Falha também é dado — e é a mais importante: "às vezes nem carrega" só
  // aparece se a carga que morreu (timeout/429) deixar rastro.
  else recordGraphSample({ ...base(), source: "erro", networkMs: null, responseKb: null, nodes: 0, edges: 0, schemaVersion: 1, cacheState, cacheWrite, diagnostics: result.diagnostics });

  return result;
};
