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
 * Rows grouped by route (TASK-REF-018): besides the raw bytes, the processed
 * rows are stored PER ROUTE in a second store, keyed `[manifestId, routeName]`.
 * A focus screen then reads only the route it shows (one keyed lookup) instead
 * of reparsing the whole spreadsheet on every mount (DT-007). The bytes stay —
 * they still let a reopen pick up parser improvements, and they feed the
 * fallback that backfills row storage for manifests saved before REF-018.
 *
 * Error policy (unlike graphCache, this is user data, not a disposable cache):
 * reads stay resilient (failure degrades to "no saved manifests"), but a write
 * failure is REPORTED via the discriminated result — the user must know the
 * manifest was not saved. Nothing here throws.
 */

import { openDB, type IDBPDatabase } from "idb";
import type { ProcessedResult, RoutesMap, RowData } from "../types";
import type { ManifestMeta, ManifestRecord, ManifestRouteMeta } from "../types/manifest";
import { COLUMN_NAMES } from "../constants";
import { sha256Hex } from "../utils/hash";

const DB_NAME = "eu-roteirizo-manifests";
/** v3 (TASK-RF-046 / RF-60): added the `manifestUsage` store. Bump again with an upgrade path if a shape changes. */
const DB_VERSION = 3;
const STORE = "manifests";
/** Rows grouped by route, keyed `[manifestId, routeName]` (TASK-REF-018). */
const ROUTE_ROWS_STORE = "routeRows";
/** Last usage timestamp per manifest, keyed `manifestId` (TASK-RF-046 / RF-60). */
const MANIFEST_USAGE_STORE = "manifestUsage";

export interface ManifestUsageRecord {
  id: string;
  lastUsedAt: string;
}

/** Lazily-opened DB connection, cached for the module's lifetime. */
let activeDb: IDBPDatabase | null = null;
let dbPromise: Promise<IDBPDatabase> | null = null;

export const closeDb = (): void => {
  if (activeDb) {
    try {
      activeDb.close();
    } catch {
      // ignore
    }
    activeDb = null;
  }
  dbPromise = null;
};

// Vite HMR: ao recarregar o módulo em desenvolvimento, fecha a conexão antiga para não travar o upgrade.
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    closeDb();
  });
}

const getDb = (): Promise<IDBPDatabase> => {
  if (!dbPromise) {
    console.log(`[manifestStorage] getDb: solicitando abertura do banco '${DB_NAME}' v${DB_VERSION}...`);
    let timer: ReturnType<typeof setTimeout> | undefined;
    const timeoutPromise = new Promise<never>((_, reject) => {
      timer = setTimeout(() => {
        const msg = `[manifestStorage] TIMEOUT (4s): openDB('${DB_NAME}', v${DB_VERSION}) não concluiu. Provável conexão bloqueada por outra aba ou transação pendente.`;
        console.error(msg);
        reject(new Error(msg));
      }, 4000);
    });

    const openPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion) {
        console.log(`[manifestStorage] upgrade disparado: v${oldVersion} -> v${newVersion}`);
        if (!db.objectStoreNames.contains(STORE)) {
          console.log(`[manifestStorage] criando store '${STORE}'`);
          db.createObjectStore(STORE, { keyPath: "id" });
        }
        // Out-of-line keys: the value is a RowData[], so the key `[id, routeName]` is passed explicitly.
        if (!db.objectStoreNames.contains(ROUTE_ROWS_STORE)) {
          console.log(`[manifestStorage] criando store '${ROUTE_ROWS_STORE}'`);
          db.createObjectStore(ROUTE_ROWS_STORE);
        }
        if (!db.objectStoreNames.contains(MANIFEST_USAGE_STORE)) {
          console.log(`[manifestStorage] criando store '${MANIFEST_USAGE_STORE}'`);
          db.createObjectStore(MANIFEST_USAGE_STORE, { keyPath: "id" });
        }
        console.log(`[manifestStorage] upgrade de stores finalizado`);
      },
      blocked(currentVersion, blockedVersion) {
        console.error(
          `[manifestStorage] BLOQUEADO: Abertura do IndexedDB '${DB_NAME}' bloqueada (v${currentVersion} -> v${blockedVersion}). Se houver outra aba aberta do app, feche-a para que a atualização seja concluída.`
        );
      },
      blocking(_currentVersion, blockedVersion) {
        console.warn(`[manifestStorage] BLOCKING: Conexão '${DB_NAME}' recebeu solicitação de upgrade para v${blockedVersion}. Fechando conexão atual.`);
        closeDb();
      },
      terminated() {
        console.warn(`[manifestStorage] Conexão '${DB_NAME}' terminada.`);
        activeDb = null;
        dbPromise = null;
      },
    });

    dbPromise = Promise.race([openPromise, timeoutPromise])
      .then((db) => {
        if (timer) clearTimeout(timer);
        console.log(`[manifestStorage] Conectado a '${DB_NAME}' v${db.version}! Stores existentes:`, Array.from(db.objectStoreNames));
        activeDb = db;
        return db;
      })
      .catch((err) => {
        if (timer) clearTimeout(timer);
        console.error(`[manifestStorage] Erro ao conectar no IndexedDB:`, err);
        closeDb();
        throw err;
      });
  }
  return dbPromise;
};

/** Composite key for one route's rows — same idiom as routeStorage's roteiro key. */
const routeRowsKey = (manifestId: string, routeName: string): [string, string] => [manifestId, routeName];

/** Writes each route's rows under `[manifestId, routeName]`. Caller owns the try/catch. */
const writeRouteRows = async (db: IDBPDatabase, manifestId: string, routes: RoutesMap): Promise<void> => {
  for (const [name, rows] of Object.entries(routes)) {
    await db.put(ROUTE_ROWS_STORE, rows, routeRowsKey(manifestId, name));
  }
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
export const findRouteAt = (rows: RowData[]): string | undefined => {
  for (const row of rows) {
    const value = row[COLUMN_NAMES.PLANNED_AT];
    if (value !== undefined && value !== null && String(value).trim() !== "") return String(value).trim();
  }
  return undefined;
};

/**
 * Updates the last-used timestamp of a saved manifest (TASK-RF-046 / RF-60).
 * Never throws; failure degrades gracefully.
 */
export const touchManifestUsage = async (manifestId: string, timestamp?: string): Promise<void> => {
  console.log(`[manifestStorage] touchManifestUsage iniciado para manifestId='${manifestId}'`);
  try {
    const db = await getDb();
    const lastUsedAt = timestamp ?? new Date().toISOString();
    await db.put(MANIFEST_USAGE_STORE, { id: manifestId, lastUsedAt });
    console.log(`[manifestStorage] touchManifestUsage concluído com sucesso: lastUsedAt='${lastUsedAt}'`);
  } catch (err) {
    console.warn(`[manifestStorage] touchManifestUsage falhou (ignorado silenciosamente):`, err);
    // best-effort: usage tracking should not break calling workflows
  }
};

/** Loads the map of manifestId -> lastUsedAt for all manifests. Degrades to empty map. */
export const getManifestUsageMap = async (): Promise<Map<string, string>> => {
  const map = new Map<string, string>();
  try {
    console.log(`[manifestStorage] getManifestUsageMap iniciado...`);
    const db = await getDb();
    const records = (await db.getAll(MANIFEST_USAGE_STORE)) as ManifestUsageRecord[];
    console.log(`[manifestStorage] getManifestUsageMap: ${records.length} registros encontrados em '${MANIFEST_USAGE_STORE}'`);
    for (const record of records) {
      if (record.id && record.lastUsedAt) {
        map.set(record.id, record.lastUsedAt);
      }
    }
  } catch (err) {
    console.warn(`[manifestStorage] getManifestUsageMap falhou (fallback para mapa vazio):`, err);
    // best-effort
  }
  return map;
};

const stripBytes = (record: ManifestRecord, lastUsedAt?: string): ManifestMeta => {
  const { id, fileName, fileType, fileSize, kind, routes, importedAt, availableCols, missingCols } = record;
  const effectiveLastUsedAt = lastUsedAt ?? record.lastUsedAt;
  return {
    id,
    fileName,
    fileType,
    fileSize,
    kind,
    routes,
    importedAt,
    ...(effectiveLastUsedAt ? { lastUsedAt: effectiveLastUsedAt } : {}),
    availableCols,
    missingCols,
  };
};

/**
 * Persists an imported manifest (raw bytes + light metadata).
 *
 * @param file - The uploaded file, exactly as received.
 * @param processed - The result of processExcelFile for that file (must be a success).
 * @returns A discriminated result; never throws.
 */
export const saveManifest = async (file: File, processed: ProcessedResult): Promise<SaveManifestResult> => {
  console.log(`[manifestStorage] saveManifest iniciado para arquivo '${file.name}', rotas:`, Object.keys(processed.routes ?? {}).length);
  if (processed.error) {
    console.warn(`[manifestStorage] saveManifest rejeitado: processed.error = ${processed.error}`);
    return { status: "invalid", reason: `processed result carries an error: ${processed.error}` };
  }
  if (!processed.routes || Object.keys(processed.routes).length === 0) {
    console.warn(`[manifestStorage] saveManifest rejeitado: processed sem rotas`);
    return { status: "invalid", reason: "processed result has no routes to save" };
  }

  try {
    console.log(`[manifestStorage] saveManifest: gerando hash SHA-256 dos bytes...`);
    const bytes = await file.arrayBuffer();
    const id = await sha256Hex(bytes);
    console.log(`[manifestStorage] saveManifest: hash = ${id}. Obtendo banco...`);

    const db = await getDb();
    console.log(`[manifestStorage] saveManifest: banco obtido. Consultando se '${id}' já existe...`);
    const existing = (await db.get(STORE, id)) as ManifestRecord | undefined;
    const now = new Date().toISOString();
    if (existing) {
      console.log(`[manifestStorage] saveManifest: romaneio '${id}' já existe (duplicata). Atualizando lastUsedAt...`);
      // Reimporting duplicate counts as usage (RF-60 criterion 4).
      await touchManifestUsage(id, now);
      return { status: "duplicate", meta: stripBytes(existing, now) };
    }

    console.log(`[manifestStorage] saveManifest: novo romaneio. Preparando gravação de ${Object.keys(processed.routes).length} rotas...`);
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
      importedAt: now,
      lastUsedAt: now,
      // Persisted so a focus screen skips reprocessing (TASK-REF-018).
      availableCols: processed.availableCols ?? undefined,
      missingCols: processed.missingCols,
      bytes,
    };
    await db.put(STORE, record);
    console.log(`[manifestStorage] saveManifest: registro principal gravado em '${STORE}'. Gravando linhas das rotas...`);
    // Grouped rows, so reopening reads one route instead of reparsing (TASK-REF-018).
    await writeRouteRows(db, id, processed.routes);
    console.log(`[manifestStorage] saveManifest: linhas gravadas em '${ROUTE_ROWS_STORE}'. Gravando usage...`);
    await touchManifestUsage(id, now);
    console.info(`[manifestStorage] romaneio salvo com sucesso — rotas=${routes.length}, id=${id}`);
    return { status: "saved", meta: stripBytes(record, now) };
  } catch (err) {
    console.error(`[manifestStorage] saveManifest falhou com erro:`, err);
    return { status: "error", reason: err instanceof Error ? err.message : String(err) };
  }
};

/**
 * Reads ONE route's rows without touching SheetJS (TASK-REF-018). Returns `null`
 * on miss (route not stored / manifest saved before REF-018) or storage failure
 * — the caller then falls back to reprocessing the bytes.
 *
 * @param manifestId - The manifest's id.
 * @param routeName - The route to read.
 * @returns The route's rows, or `null`.
 */
export const getRouteRows = async (manifestId: string, routeName: string): Promise<RowData[] | null> => {
  try {
    const db = await getDb();
    return ((await db.get(ROUTE_ROWS_STORE, routeRowsKey(manifestId, routeName))) as RowData[] | undefined) ?? null;
  } catch {
    return null;
  }
};

/**
 * Backfills row storage + the `availableCols`/`missingCols` meta for a manifest
 * saved before TASK-REF-018 (the reopen fallback calls this after reprocessing,
 * so the NEXT open is fast). Best-effort: any failure is swallowed — the app
 * already has what it needs from the reprocess. Never throws.
 *
 * @param manifestId - The manifest whose rows/meta to persist.
 * @param processed - The successful ProcessedResult just computed from the bytes.
 */
export const backfillRouteRows = async (manifestId: string, processed: ProcessedResult): Promise<void> => {
  if (!processed.routes) return;
  try {
    const db = await getDb();
    const record = (await db.get(STORE, manifestId)) as ManifestRecord | undefined;
    if (record) {
      // Re-put the record with the cols merged in (bytes already in hand — no rewrite of file data).
      await db.put(STORE, { ...record, availableCols: processed.availableCols ?? undefined, missingCols: processed.missingCols });
    }
    await writeRouteRows(db, manifestId, processed.routes);
  } catch {
    // best-effort: the current open already succeeded via reprocessing
  }
};

/**
 * Lists saved manifests (metadata only, newest usage first, fallback importedAt).
 * Never throws — a storage failure degrades to an empty list.
 */
export const listManifests = async (): Promise<ManifestMeta[]> => {
  console.log(`[manifestStorage] listManifests iniciado...`);
  try {
    const db = await getDb();
    console.log(`[manifestStorage] listManifests: banco obtido, buscando registros em '${STORE}' e usageMap...`);
    const [records, usageMap] = await Promise.all([db.getAll(STORE) as Promise<ManifestRecord[]>, getManifestUsageMap()]);
    console.log(`[manifestStorage] listManifests: ${records.length} romaneios no store, ${usageMap.size} timestamps de uso`);
    const result = records
      .map((r) => stripBytes(r, usageMap.get(r.id)))
      .sort((a, b) => {
        const timeA = a.lastUsedAt ?? a.importedAt;
        const timeB = b.lastUsedAt ?? b.importedAt;
        return timeB.localeCompare(timeA) || a.id.localeCompare(b.id);
      });
    console.log(`[manifestStorage] listManifests: retornando ${result.length} manifestos ordenados por uso`);
    return result;
  } catch (err) {
    console.error(`[manifestStorage] listManifests falhou com erro:`, err);
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
    const record = (await db.get(STORE, id)) as ManifestRecord | undefined;
    if (!record) return null;
    const usage = (await db.get(MANIFEST_USAGE_STORE, id)) as ManifestUsageRecord | undefined;
    return {
      ...record,
      ...(usage?.lastUsedAt ? { lastUsedAt: usage.lastUsedAt } : {}),
    };
  } catch {
    return null;
  }
};

/** Derives available column names present in the provided rows. */
export const deriveAvailableColsFromRows = (rows: RowData[]): string[] => {
  const set = new Set<string>();
  for (const row of rows) {
    for (const key of Object.keys(row)) {
      if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") {
        set.add(key);
      }
    }
  }
  return Array.from(set);
};

/**
 * Persists a standalone manifest with rows for a route imported via JSON (RF-36/RF-20).
 * Preserves available columns and route AT code so original view and summary function properly.
 * Never throws.
 */
export const saveStandaloneManifest = async (manifestId: string, routeName: string, rows: RowData[], availableCols?: string[], at?: string, fileBytes?: ArrayBuffer): Promise<boolean> => {
  try {
    const db = await getDb();
    const effectiveAt = at ?? findRouteAt(rows);
    const effectiveCols = availableCols && availableCols.length > 0 ? availableCols : deriveAvailableColsFromRows(rows);
    const existing = (await db.get(STORE, manifestId)) as ManifestRecord | undefined;
    const now = new Date().toISOString();

    const record: ManifestRecord = {
      id: manifestId,
      fileName: existing?.fileName && !existing.fileName.endsWith(".json") ? existing.fileName : `${routeName}.json`,
      fileType: "application/json",
      fileSize: fileBytes ? fileBytes.byteLength : (existing?.fileSize ?? 0),
      kind: "single",
      routes: [{ name: routeName, rowCount: rows.length, ...(effectiveAt !== undefined ? { at: effectiveAt } : {}) }],
      importedAt: existing?.importedAt ?? now,
      lastUsedAt: now,
      availableCols: effectiveCols,
      missingCols: [],
      bytes: fileBytes ?? existing?.bytes ?? new ArrayBuffer(0),
    };

    await db.put(STORE, record);
    await writeRouteRows(db, manifestId, { [routeName]: rows });
    await touchManifestUsage(manifestId, now);
    return true;
  } catch {
    return false;
  }
};

/**
 * Deletes one manifest AND its grouped rows (TASK-REF-018 — no orphaned rows)
 * and its usage timestamp (TASK-RF-046). Best-effort; the list UI re-reads afterwards.
 * Never throws. The roteiro cascade lives in the page (RoutesPage → deleteManifestRoteiros), a separate DB.
 */
export const deleteManifest = async (id: string): Promise<void> => {
  try {
    const db = await getDb();
    await db.delete(STORE, id);
    // All `[id, *]` rows — same range idiom as routeStorage.deleteManifestRoteiros.
    await db.delete(ROUTE_ROWS_STORE, IDBKeyRange.bound([id, ""], [id, "\uffff"]));
    await db.delete(MANIFEST_USAGE_STORE, id);
  } catch {
    // best-effort; the list reflects whatever actually happened
  }
};

/** Clears all saved manifests AND their grouped rows and usage records (maintenance / tests). Never throws. */
export const clearManifests = async (): Promise<void> => {
  try {
    const db = await getDb();
    await db.clear(STORE);
    await db.clear(ROUTE_ROWS_STORE);
    await db.clear(MANIFEST_USAGE_STORE);
  } catch {
    // ignore
  }
};
