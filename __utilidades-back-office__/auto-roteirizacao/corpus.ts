/** Local-only corpus IO. No module in src imports this file or the private fixtures. */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import * as XLSX from "xlsx";
import type { RowData } from "../../src/types";
import type { AnchorSearchResult } from "../../src/types/autoRouting";
import { normalizeRoutingConfig, type DeliveryPoint, type LatLng, type PlannedRoute } from "../../src/types/routing";
import type { ExportedRoutePayloadV1 } from "../../src/types/routeExport";
import type { Edge, NodeId, RoadGraph } from "../../src/utils/routing/graph";
import type { BBox } from "../../src/utils/routing/osm";
import { normalizeColumnKeys } from "../../src/utils/normalizeColumns";
import { buildDeliveryPoints } from "../../src/utils/routing/points";
import { createRouteExportPayload } from "../../src/services/routeExport";
import { haversine } from "../../src/utils/routing/geo";
import { nearestFirstOrder } from "../../src/utils/routing/walkOrder";

export const CORPUS_ROOT = resolve("__utilidades-back-office__/romaneios");
export const CACHE_ROOT = resolve("__utilidades-back-office__/auto-roteirizacao/.cache");
export const hash = (value: string | Buffer): string => createHash("sha256").update(value).digest("hex");

export interface CorpusCase {
  id: string;
  file: string;
  sourceHash: string;
  rows: RowData[];
  points: DeliveryPoint[];
  invalidRows: number;
  reference?: ExportedRoutePayloadV1;
}
export interface Corpus {
  hash: string;
  files: { path: string; hash: string }[];
  cases: CorpusCase[];
  referenceCount: number;
}

/** Converts a spatial result into the existing app format, not an optimized route. */
export const createInspectionPayload = (entry: CorpusCase, result: AnchorSearchResult, scenario: { runId: string; sampleStepMeters: number }): ExportedRoutePayloadV1 => {
  const byId = new Map(entry.points.map((p) => [p.id, p]));
  const assigned = result.groups.flatMap((g) => g.pointIds);
  const accounted = [...assigned, ...result.pending.map((p) => p.pointId), ...result.ignoredPointIds];
  // The existing importer is intentionally permissive and HYDRATE drops unknown ids.
  // Reject any loss here rather than exporting an apparently valid but incomplete comparison.
  if (
    !scenario.runId.trim() ||
    !Number.isFinite(scenario.sampleStepMeters) ||
    scenario.sampleStepMeters <= 0 ||
    result.status === "invalid" ||
    result.errors.length ||
    entry.invalidRows !== 0 ||
    !Number.isFinite(result.radiusMeters) ||
    result.radiusMeters < 0 ||
    byId.size !== entry.points.length ||
    accounted.length !== byId.size ||
    new Set(accounted).size !== byId.size ||
    accounted.some((id) => !byId.has(id)) ||
    result.groups.some(
      (g) =>
        !g.pointIds.length ||
        !g.pointIds.includes(g.seedPointId) ||
        !Number.isFinite(g.vehicleStop.lat) ||
        !Number.isFinite(g.vehicleStop.lng) ||
        Math.abs(g.vehicleStop.lat) > 90 ||
        Math.abs(g.vehicleStop.lng) > 180 ||
        g.pointIds.some((id) => !byId.has(id) || haversine(g.vehicleStop, byId.get(id)!) > result.radiusMeters) ||
        g.packageCount !== g.pointIds.reduce((sum, id) => sum + (byId.get(id)?.packageCount ?? 0), 0)
    )
  )
    throw new Error(`${entry.id}: invalid-inspection-result`);

  // A new execution/scenario gets its own standalone manifest; reimporting the
  // same file updates only that experimental copy, never a human manifest.
  const identity = hash(JSON.stringify([scenario.runId, entry.id, entry.sourceHash, result.radiusMeters, scenario.sampleStepMeters, result.groups, result.pending, result.ignoredPointIds]));
  const manifestId = `auto-inspection-${identity}`;
  const routeName = `INSPEÇÃO RF-030 | ${entry.id} | R${result.radiusMeters}m P${scenario.sampleStepMeters}m | NÃO OTIMIZADO${result.status === "partial" ? " | PARCIAL" : ""}`;
  const route: PlannedRoute = {
    id: `${manifestId}-route`,
    createdAt: new Date().toISOString(),
    // Human start/config are presentation context only, never input to the anchor generator.
    startPoint: entry.reference?.route.startPoint ? { ...entry.reference.route.startPoint } : null,
    config: { ...normalizeRoutingConfig(entry.reference?.route.config), autoRadiusMeters: result.radiusMeters },
    ignoredPointIds: [...result.ignoredPointIds],
    stops: result.groups.map((g, index) => ({
      id: `${manifestId}-stop-${index + 1}`,
      order: index + 1,
      vehicleStop: { ...g.vehicleStop },
      vehicleStopIsDefault: g.vehicleStopIsDefault,
      radiusMeters: result.radiusMeters,
      reversed: false,
      pointIds: nearestFirstOrder(
        g.vehicleStop,
        g.pointIds.map((id) => byId.get(id)!),
        false,
        g.vehicleStopIsDefault ? g.seedPointId : undefined
      ),
    })),
  };
  return createRouteExportPayload(manifestId, routeName, route, structuredClone(entry.points), structuredClone(entry.rows), undefined, {
    manifestFileName: basename(entry.file),
    addressCount: entry.points.length,
    packageCount: entry.points.reduce((sum, p) => sum + p.packageCount, 0),
    stopCount: route.stops.length,
  });
};
export interface SerializedGraph {
  coords: [NodeId, LatLng][];
  adj: [NodeId, Edge[]][];
}
export interface GraphSnapshot {
  schema: "auto-anchors/graph/v1";
  collectedAt: string;
  osmTimestamp: string | null;
  endpoint: string;
  bbox: BBox;
  builderHash: string;
  rawHash: string;
  graphHash: string;
  pedestrianSource: "derived-from-vehicle-not-certified";
  graph: SerializedGraph;
}
export interface SnapshotIndex {
  schema: "auto-anchors/corpus/v1";
  preparedAt: string;
  corpusHash: string;
  files: Corpus["files"];
  cases: { id: string; snapshotFile: string; snapshotHash: string }[];
}

const normalizedPath = (path: string): string => path.replaceAll("\\", "/");
const walk = (root: string): string[] => readdirSync(root, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory() ? walk(join(root, entry.name)) : [join(root, entry.name)]));
const fail = (id: string, reason: string): never => {
  throw new Error(`${id}: ${reason}`);
};
const packageKeys = (points: DeliveryPoint[]): string[] => points.flatMap((p) => p.packages.map((pkg) => JSON.stringify([pkg.id, p.lat, p.lng]))).sort();

/** Reject contradictions instead of fixing either source to make a comparison pass. */
export const validateReference = (reference: ExportedRoutePayloadV1, points: DeliveryPoint[], id: string): void => {
  if (reference.schema !== "eu-roteirizo/roteiro/v1" || reference.version !== 1 || !Array.isArray(reference.points) || !reference.route || !Array.isArray(reference.route.stops))
    fail(id, "invalid-reference-shape");
  if (
    reference.points.some(
      (p) =>
        !p || !Number.isFinite(p.lat) || !Number.isFinite(p.lng) || !Array.isArray(p.packages) || p.packageCount !== p.packages.length || p.packages.some((pkg) => !pkg || typeof pkg.id !== "string")
    )
  )
    fail(id, "invalid-reference-point");
  if (JSON.stringify(packageKeys(reference.points)) !== JSON.stringify(packageKeys(points))) fail(id, "reference-package-or-coordinate-mismatch");
  if (reference.rows && JSON.stringify(packageKeys(buildDeliveryPoints(normalizeColumnKeys(reference.rows)))) !== JSON.stringify(packageKeys(points))) fail(id, "reference-rows-mismatch");
  const byId = new Map(points.map((p) => [p.id, p]));
  if (
    reference.points.length !== points.length ||
    new Set(reference.points.map((p) => p.id)).size !== points.length ||
    reference.points.some((p) => !byId.has(p.id) || JSON.stringify(packageKeys([p])) !== JSON.stringify(packageKeys([byId.get(p.id)!])))
  )
    fail(id, "reference-point-mismatch");
  const route = reference.route;
  const members = route.stops.flatMap((s) => s.pointIds);
  const ignored = route.ignoredPointIds ?? [];
  if (new Set([...members, ...ignored]).size !== members.length + ignored.length || [...members, ...ignored].some((member) => !byId.has(member))) fail(id, "reference-membership-mismatch");
  if (
    route.stops.some(
      (s, i) =>
        s.order !== i + 1 ||
        !s.pointIds.length ||
        !s.vehicleStop ||
        !Number.isFinite(s.vehicleStop.lat) ||
        !Number.isFinite(s.vehicleStop.lng) ||
        Math.abs(s.vehicleStop.lat) > 90 ||
        Math.abs(s.vehicleStop.lng) > 180 ||
        !Number.isFinite(s.radiusMeters) ||
        s.radiusMeters < 0
    )
  )
    fail(id, "invalid-reference-stop");
};

/** Enumerates every original workbook and JSON. Reports only opaque case ids in errors. */
export const loadCorpus = (root = CORPUS_ROOT): Corpus => {
  if (!existsSync(root)) throw new Error("Private corpus missing; real validation was not executed.");
  const sourceFiles = walk(root)
    .filter((file) => /\.(xlsx|json)$/i.test(file))
    .sort((a, b) => normalizedPath(a).localeCompare(normalizedPath(b), "en"));
  const workbooks = sourceFiles.filter((file) => /\.xlsx$/i.test(file));
  const jsonFiles = sourceFiles.filter((file) => /\.json$/i.test(file));
  if (!workbooks.length || !jsonFiles.length) throw new Error("Private workbooks or human references missing.");
  const files = sourceFiles.map((file) => ({ path: normalizedPath(relative(root, file)), hash: hash(readFileSync(file)) }));
  const usedReferences = new Set<string>();
  const cases = workbooks.map((file, index): CorpusCase => {
    const id = `case-${String(index + 1).padStart(3, "0")}`;
    const bytes = readFileSync(file);
    let rows: RowData[];
    try {
      const book = XLSX.read(bytes, { type: "buffer" });
      rows = normalizeColumnKeys(XLSX.utils.sheet_to_json<RowData>(book.Sheets[book.SheetNames[0]], { defval: "" }));
    } catch {
      return fail(id, "unreadable-workbook");
    }
    if (!rows.length || !("Latitude" in rows[0]) || !("Longitude" in rows[0])) fail(id, "missing-rows-or-coordinates");
    const points = buildDeliveryPoints(rows);
    const invalidRows = rows.length - points.reduce((sum, point) => sum + point.packageCount, 0);
    const possible = jsonFiles.filter((candidate) => dirname(candidate) === dirname(file));
    let reference: ExportedRoutePayloadV1 | undefined;
    for (const candidate of possible) {
      let parsed: ExportedRoutePayloadV1;
      try {
        parsed = JSON.parse(readFileSync(candidate, "utf8")) as ExportedRoutePayloadV1;
      } catch {
        return fail(id, "unreadable-reference");
      }
      if (possible.length === 1 || basename(parsed.meta?.manifestFileName ?? "") === basename(file)) {
        if (reference || usedReferences.has(candidate)) fail(id, "ambiguous-reference-pair");
        reference = parsed;
        validateReference(reference, points, id);
        usedReferences.add(candidate);
      }
    }
    return { id, file: normalizedPath(relative(root, file)), sourceHash: hash(bytes), rows, points, invalidRows, ...(reference ? { reference } : {}) };
  });
  if (usedReferences.size !== jsonFiles.length) throw new Error("Unpaired human reference; corpus validation incomplete.");
  return { hash: hash(JSON.stringify(files)), files, cases, referenceCount: usedReferences.size };
};

export const withinBBox = (p: LatLng, bbox: BBox): boolean => p.lat >= bbox.south && p.lat <= bbox.north && p.lng >= bbox.west && p.lng <= bbox.east;
export const routeCoordinates = (points: DeliveryPoint[], route?: PlannedRoute): LatLng[] => [
  ...points,
  ...(route?.startPoint ? [route.startPoint] : []),
  ...(route?.stops.map((s) => s.vehicleStop) ?? []),
];

/** The test path has no network fallback. Corpus and graph mismatches require explicit preparation. */
export const loadSnapshots = (corpus: Corpus, cacheRoot = CACHE_ROOT): Map<string, { snapshot: GraphSnapshot; graph: RoadGraph }> => {
  const indexFile = join(cacheRoot, "index.json");
  if (!existsSync(indexFile)) throw new Error("Graph snapshots missing. Run npm run prepare:auto-anchors explicitly.");
  const index = JSON.parse(readFileSync(indexFile, "utf8")) as SnapshotIndex;
  if (
    index.schema !== "auto-anchors/corpus/v1" ||
    index.corpusHash !== corpus.hash ||
    JSON.stringify(index.files) !== JSON.stringify(corpus.files) ||
    index.cases.length !== corpus.cases.length ||
    new Set(index.cases.map((c) => c.id)).size !== index.cases.length
  )
    throw new Error("Corpus changed or snapshot inventory incomplete; prepare explicitly before validating.");
  const loaded = new Map<string, { snapshot: GraphSnapshot; graph: RoadGraph }>();
  const snapshots = new Map<string, { snapshot: GraphSnapshot; graph: RoadGraph }>();
  for (const entry of corpus.cases) {
    const record = index.cases.find((c) => c.id === entry.id);
    if (!record || !/^graph-[a-f0-9]{64}\.json$/.test(record.snapshotFile) || record.snapshotFile !== `graph-${record.snapshotHash}.json`)
      return fail(entry.id, "missing-or-invalid-snapshot-reference");
    let parsed = snapshots.get(record.snapshotFile);
    if (!parsed) {
      const bytes = readFileSync(join(cacheRoot, record.snapshotFile));
      if (hash(bytes) !== record.snapshotHash) fail(entry.id, "snapshot-hash-mismatch");
      const snapshot = JSON.parse(bytes.toString("utf8")) as GraphSnapshot;
      if (snapshot.schema !== "auto-anchors/graph/v1" || hash(JSON.stringify(snapshot.graph)) !== snapshot.graphHash) fail(entry.id, "invalid-snapshot");
      if (snapshot.builderHash !== hash(readFileSync(resolve("src/utils/routing/graph.ts")))) fail(entry.id, "graph-builder-changed");
      parsed = { snapshot, graph: { coords: new Map(snapshot.graph.coords), adj: new Map(snapshot.graph.adj) } };
      snapshots.set(record.snapshotFile, parsed);
    }
    if (routeCoordinates(entry.points, entry.reference?.route).some((p) => !withinBBox(p, parsed.snapshot.bbox))) fail(entry.id, "graph-extent-insufficient");
    loaded.set(entry.id, parsed);
  }
  return loaded;
};
