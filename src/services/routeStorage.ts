/**
 * services/routeStorage.ts - Local persistence of planned routes (TASK-RF-008).
 *
 * Saves the Meu roteiro construction per route so leaving the map never loses
 * work (RF-33: saving is free — an incomplete draft persists too). Identity is
 * RN-21 made structural: the record key IS the pair `[manifestId, routeName]`,
 * so "one roteiro per rota" is enforced by the store itself (saving again
 * overwrites).
 *
 * What is stored is the serializable `PlannedRoute` (start + stops + config),
 * NOT the builder state: the open edit draft is deliberately outside — the
 * caller pauses auto-save while a draft is open, because `REOPEN_STOP` moves
 * the stop out of `stops` and a mid-edit snapshot would lose it.
 *
 * Error policy (same as manifestStorage — this is user data, not a cache):
 * reads degrade (miss/failure → null/empty), writes REPORT via a discriminated
 * result. Nothing here throws.
 */

import { openDB, type IDBPDatabase } from "idb";
import type { PlannedRoute } from "../types/routing";
import { normalizeRoutingConfig } from "../types/routing";

const DB_NAME = "eu-roteirizo-roteiros";
/** Bump (with an upgrade path) if the RoteiroRecord shape ever changes. */
const DB_VERSION = 1;
const STORE = "roteiros";

/** One saved roteiro; the compound key [manifestId, routeName] is RN-21. */
export interface RoteiroRecord {
  manifestId: string;
  routeName: string;
  route: PlannedRoute;
  /** ISO timestamp of the last (auto-)save. */
  updatedAt: string;
}

/** Outcome of a save — a write failure must reach the user, not vanish. */
export type SaveRoteiroResult = { status: "saved" } | { status: "error"; reason: string };

/** Lazily-opened DB connection, cached for the module's lifetime. */
let dbPromise: Promise<IDBPDatabase> | null = null;

const getDb = (): Promise<IDBPDatabase> => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: ["manifestId", "routeName"] });
      },
    });
  }
  return dbPromise;
};

/** Saves (or overwrites — RN-21) the roteiro of one route. Never throws. */
export const saveRoteiro = async (manifestId: string, routeName: string, route: PlannedRoute): Promise<SaveRoteiroResult> => {
  try {
    const db = await getDb();
    const record: RoteiroRecord = { manifestId, routeName, route, updatedAt: new Date().toISOString() };
    await db.put(STORE, record);
    return { status: "saved" };
  } catch (err) {
    return { status: "error", reason: err instanceof Error ? err.message : String(err) };
  }
};

/** Loads one route's roteiro. `null` on miss or storage failure (read degrades).
 *  The config is normalized (RF-007.1) so routes saved with the old config shape
 *  come back with the delivery-time fields filled from defaults. */
export const getRoteiro = async (manifestId: string, routeName: string): Promise<PlannedRoute | null> => {
  try {
    const db = await getDb();
    const record = (await db.get(STORE, [manifestId, routeName])) as RoteiroRecord | undefined;
    if (!record) return null;
    return { ...record.route, config: normalizeRoutingConfig(record.route.config) };
  } catch {
    return null;
  }
};

/** Deletes one route's roteiro (auto-save calls this when the builder empties). Never throws. */
export const deleteRoteiro = async (manifestId: string, routeName: string): Promise<void> => {
  try {
    const db = await getDb();
    await db.delete(STORE, [manifestId, routeName]);
  } catch {
    // best-effort
  }
};

/**
 * Which routes have a saved roteiro, for the whole list screen in ONE call:
 * `manifestId → Set<routeName>` (lights the RouteChip `hasRoteiro`). Degrades
 * to an empty map on storage failure.
 */
export const listRoteiroKeys = async (): Promise<Map<string, Set<string>>> => {
  const map = new Map<string, Set<string>>();
  try {
    const db = await getDb();
    const keys = (await db.getAllKeys(STORE)) as [string, string][];
    for (const [manifestId, routeName] of keys) {
      const set = map.get(manifestId) ?? new Set<string>();
      set.add(routeName);
      map.set(manifestId, set);
    }
    return map;
  } catch {
    return map;
  }
};

/** Cascade: deleting a manifest deletes its roteiros — no invisible orphans. Never throws. */
export const deleteManifestRoteiros = async (manifestId: string): Promise<void> => {
  try {
    const db = await getDb();
    // Compound keys sort lexicographically: [id, ""] .. [id, "￿"] spans the manifest's routes.
    await db.delete(STORE, IDBKeyRange.bound([manifestId, ""], [manifestId, "￿"]));
  } catch {
    // best-effort
  }
};

/** Clears all saved roteiros (maintenance / tests). Never throws. */
export const clearRoteiros = async (): Promise<void> => {
  try {
    const db = await getDb();
    await db.clear(STORE);
  } catch {
    // ignore
  }
};
