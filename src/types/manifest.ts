/**
 * types/manifest.ts - Saved imported manifests ("romaneios") — TASK-RF-022.1.
 *
 * A manifest is one imported spreadsheet (single-route or multi-route),
 * persisted locally so the user can reopen it without re-uploading (RF-46).
 * The raw file bytes are stored (not the processed result): reopening rebuilds
 * a File and runs it through processExcelFile again, so saved manifests
 * automatically benefit from future parser improvements. The SHA-256 of the
 * bytes is the record id, which makes duplicate detection (RN-23) a key lookup.
 */

/** Summary of one route inside a saved manifest (RN-21-ready: 1 future roteiro per route). */
export interface ManifestRouteMeta {
  /** Route name as grouped by the processor (e.g. "A-1", or the single-route label). */
  name: string;
  /** First non-empty "Planned AT" found in the route's rows, trimmed; absent when the column is missing/empty. */
  at?: string;
  /** Number of delivery rows in the route. */
  rowCount: number;
  /** Primary neighborhood with highest delivery count (without count), from summarizeNeighborhoods (RF-62 / TASK-RF-048). */
  neighborhood?: string;
}

/** Whether the manifest is a single route (no "Corridor Cage") or a multi-route file. */
export type ManifestKind = "single" | "multi";

/** Lightweight, listable metadata — everything the list UI needs, WITHOUT the bytes. */
export interface ManifestMeta {
  /** SHA-256 hex of the raw file bytes. Doubles as the dedup key (RN-23). */
  id: string;
  fileName: string;
  /** MIME type of the original file, preserved to rebuild the File faithfully. */
  fileType: string;
  /** Size of the stored bytes (bytes.byteLength). */
  fileSize: number;
  kind: ManifestKind;
  /** Routes in the processor's order (already alphanumerically sorted for multi-route). */
  routes: ManifestRouteMeta[];
  /** ISO 8601 timestamp of the import. */
  importedAt: string;
  /** ISO 8601 timestamp of last usage (import, reopen, or roteiro edit) — TASK-RF-046 / RF-60. */
  lastUsedAt?: string;
  /**
   * Columns found in the file (per-manifest, same for every route). Persisted
   * since TASK-REF-018 so a focus screen can gate the map / pick the vehicle type
   * WITHOUT reprocessing the whole spreadsheet. Optional: records saved before
   * REF-018 don't have it, and the reopen fallback backfills it.
   */
  availableCols?: string[];
  /** Required columns missing from the file (companion to `availableCols`; same provenance). */
  missingCols?: string[];
}

/** Full persisted record: metadata plus the raw file bytes (RF-46). */
export interface ManifestRecord extends ManifestMeta {
  bytes: ArrayBuffer;
}
