/**
 * services/manifestStorage.ts - Local persistence of imported manifests (TASK-RF-022.1).
 *
 * Saves each imported spreadsheet ("romaneio") in IndexedDB so the user can
 * reopen it without re-uploading (RF-46). The RAW file bytes are stored, not
 * the processed result: reopening rebuilds a File from the bytes and runs
 * processExcelFile again, so saved manifests pick up parser improvements.
 *
 * Duplicate detection (RN-23): the record id is the SHA-256 of the bytes, so
 * "exactly the same file" is a key lookup. This is byte equality by design —
 * the same logical content re-exported by Excel produces different bytes and
 * is therefore NOT a duplicate.
 *
 * Error policy (unlike graphCache, this is user data, not a disposable cache):
 * reads stay resilient (failure degrades to "no saved manifests"), but a write
 * failure is REPORTED via the discriminated result — the user must know the
 * manifest was not saved. Nothing here throws.
 */

import { openDB, type IDBPDatabase } from "idb";
import type { ProcessedResult, RowData } from "../types";
import type { ManifestMeta, ManifestRecord, ManifestRouteMeta } from "../types/manifest";
import { COLUMN_NAMES } from "../constants";
import { sha256Hex } from "../utils/hash";

const DB_NAME = "danfo-manifests";
/** Bump (with an upgrade path) if the ManifestRecord shape ever changes. */
const DB_VERSION = 1;
const STORE = "manifests";

/** Lazily-opened DB connection, cached for the module's lifetime. */
let dbPromise: Promise<IDBPDatabase> | null = null;

const getDb = (): Promise<IDBPDatabase> => {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: "id" });
      },
    });
  }
  return dbPromise;
};

/** Outcome of a save: exactly one of saved / duplicate / invalid / error. */
export type SaveManifestResult =
  /** Stored as a new record. */
  | { status: "saved"; meta: ManifestMeta }
  /** Same bytes already stored — `meta` is the EXISTING record's, so the UI can select it (RN-23). */
  | { status: "duplicate"; meta: ManifestMeta }
  /** Caller-contract violation (errored/empty ProcessedResult) — indicates a caller bug, nothing persisted. */
  | { status: "invalid"; reason: string }
  /** IndexedDB write failure (private mode, quota…) — the manifest was NOT saved. */
  | { status: "error"; reason: string };

/** First non-empty "Planned AT" in the route's rows, trimmed (mirrors useRouteSearch). */
const findRouteAt = (rows: RowData[]): string | undefined => {
  for (const row of rows) {
    const value = row[COLUMN_NAMES.PLANNED_AT];
    if (value !== undefined && value !== null && String(value).trim() !== "") return String(value).trim();
  }
  return undefined;
};

const stripBytes = (record: ManifestRecord): ManifestMeta => {
  const { id, fileName, fileType, fileSize, kind, routes, importedAt } = record;
  return { id, fileName, fileType, fileSize, kind, routes, importedAt };
};

/**
 * Persists an imported manifest (raw bytes + light metadata).
 *
 * @param file - The uploaded file, exactly as received.
 * @param processed - The result of processExcelFile for that file (must be a success).
 * @returns A discriminated result; never throws.
 */
export const saveManifest = async (file: File, processed: ProcessedResult): Promise<SaveManifestResult> => {
  if (processed.error) return { status: "invalid", reason: `processed result carries an error: ${processed.error}` };
  if (!processed.routes || Object.keys(processed.routes).length === 0) return { status: "invalid", reason: "processed result has no routes to save" };

  try {
    const bytes = await file.arrayBuffer();
    const id = await sha256Hex(bytes);

    const db = await getDb();
    const existing = (await db.get(STORE, id)) as ManifestRecord | undefined;
    if (existing) return { status: "duplicate", meta: stripBytes(existing) };

    const routes: ManifestRouteMeta[] = Object.entries(processed.routes).map(([name, rows]) => {
      const at = findRouteAt(rows);
      return { name, rowCount: rows.length, ...(at !== undefined ? { at } : {}) };
    });

    const record: ManifestRecord = {
      id,
      fileName: file.name,
      fileType: file.type,
      fileSize: bytes.byteLength,
      kind: processed.isSingleRoute ? "single" : "multi",
      routes,
      importedAt: new Date().toISOString(),
      bytes,
    };
    await db.put(STORE, record);
    if (import.meta.env.DEV) console.info(`manifestStorage: romaneio salvo — rotas=${routes.length}`);
    return { status: "saved", meta: stripBytes(record) };
  } catch (err) {
    return { status: "error", reason: err instanceof Error ? err.message : String(err) };
  }
};

/**
 * Lists saved manifests (metadata only, newest first). Never throws — a
 * storage failure degrades to an empty list.
 */
export const listManifests = async (): Promise<ManifestMeta[]> => {
  try {
    const db = await getDb();
    const records = (await db.getAll(STORE)) as ManifestRecord[];
    return records.map(stripBytes).sort((a, b) => b.importedAt.localeCompare(a.importedAt) || a.id.localeCompare(b.id));
  } catch {
    return [];
  }
};

/**
 * Loads one manifest with its bytes (to rebuild the File and reprocess).
 * Returns `null` on miss or storage failure.
 */
export const getManifest = async (id: string): Promise<ManifestRecord | null> => {
  try {
    const db = await getDb();
    return ((await db.get(STORE, id)) as ManifestRecord | undefined) ?? null;
  } catch {
    return null;
  }
};

/** Deletes one manifest (best-effort; the list UI re-reads afterwards). Never throws. */
export const deleteManifest = async (id: string): Promise<void> => {
  try {
    const db = await getDb();
    await db.delete(STORE, id);
  } catch {
    // best-effort; the list reflects whatever actually happened
  }
};

/** Clears all saved manifests (maintenance / tests). Never throws. */
export const clearManifests = async (): Promise<void> => {
  try {
    const db = await getDb();
    await db.clear(STORE);
  } catch {
    // ignore
  }
};
