/** Explicit preparation only; excluded from both the app suite and the offline corpus suite. */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { test } from "vitest";
import { buildGraph, type OsmElement } from "../../src/utils/routing/graph";
import { bboxAreaKm2, bboxFromPoints, buildOverpassQuery, type BBox } from "../../src/utils/routing/osm";
import { CACHE_ROOT, hash, loadCorpus, loadSnapshots, routeCoordinates, type GraphSnapshot, type SnapshotIndex } from "./corpus";

const ENDPOINT = "https://overpass-api.de/api/interpreter";
const MARGIN_METERS = 600;
const MAX_REQUEST_KM2 = 60;

test("prepare frozen road graphs explicitly", async () => {
  const corpus = loadCorpus();
  if (existsSync(join(CACHE_ROOT, "index.json")) && import.meta.env.MODE === "prepare") {
    // Reuse a verified snapshot. Corruption or an input change must remain visible, not trigger a silent download.
    const cached = loadSnapshots(corpus);
    console.info(`Using frozen graphs for ${cached.size} cases; no network request.`);
    return;
  }
  const groups: { caseIds: string[]; bbox: BBox }[] = [];
  for (const entry of corpus.cases) {
    const bbox = bboxFromPoints(routeCoordinates(entry.points, entry.reference?.route), MARGIN_METERS);
    if (!bbox || bboxAreaKm2(bbox) > MAX_REQUEST_KM2) throw new Error(`${entry.id}: graph extent needs a smaller explicit region.`);
    const compatible = groups.find(
      (group) =>
        bboxAreaKm2({
          south: Math.min(group.bbox.south, bbox.south),
          west: Math.min(group.bbox.west, bbox.west),
          north: Math.max(group.bbox.north, bbox.north),
          east: Math.max(group.bbox.east, bbox.east),
        }) <= MAX_REQUEST_KM2
    );
    if (compatible) {
      compatible.caseIds.push(entry.id);
      compatible.bbox = {
        south: Math.min(compatible.bbox.south, bbox.south),
        west: Math.min(compatible.bbox.west, bbox.west),
        north: Math.max(compatible.bbox.north, bbox.north),
        east: Math.max(compatible.bbox.east, bbox.east),
      };
    } else groups.push({ caseIds: [entry.id], bbox });
  }
  console.info(`Corpus: ${corpus.cases.length} workbooks, ${corpus.referenceCount} references; ${groups.length} graph request(s), ${groups.map((g) => bboxAreaKm2(g.bbox).toFixed(1)).join("/")} km2.`);
  if (import.meta.env.MODE === "inventory") return;
  mkdirSync(CACHE_ROOT, { recursive: true });
  const index: SnapshotIndex = { schema: "auto-anchors/corpus/v1", preparedAt: new Date().toISOString(), corpusHash: corpus.hash, files: corpus.files, cases: [] };
  for (const [groupIndex, group] of groups.entries()) {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": "eu-roteirizo-prototype/0.1 (TASK-RF-030; https://github.com/thiagoroddev/eu-roteirizo)" },
      body: "data=" + encodeURIComponent(buildOverpassQuery(group.bbox)),
      signal: AbortSignal.timeout(55_000),
    });
    if (!response.ok) throw new Error(`Graph request ${groupIndex + 1}: HTTP ${response.status}; no automatic retry.`);
    const raw = await response.text();
    const osm = JSON.parse(raw) as { elements?: OsmElement[]; remark?: string; osm3s?: { timestamp_osm_base?: string } };
    if (
      osm.remark ||
      !Array.isArray(osm.elements) ||
      !osm.elements.length ||
      osm.elements.some((e) => e.type !== "way" || !e.nodes || !e.geometry || e.nodes.length !== e.geometry.length || e.geometry.some((p) => !p || !Number.isFinite(p.lat) || !Number.isFinite(p.lon)))
    )
      throw new Error(`Graph request ${groupIndex + 1}: incomplete OSM response.`);
    const graph = buildGraph(osm.elements);
    const serialized = { coords: [...graph.coords], adj: [...graph.adj] };
    const snapshot: GraphSnapshot = {
      schema: "auto-anchors/graph/v1",
      collectedAt: new Date().toISOString(),
      osmTimestamp: osm.osm3s?.timestamp_osm_base ?? null,
      endpoint: ENDPOINT,
      bbox: group.bbox,
      builderHash: hash(readFileSync(resolve("src/utils/routing/graph.ts"))),
      rawHash: hash(raw),
      graphHash: hash(JSON.stringify(serialized)),
      pedestrianSource: "derived-from-vehicle-not-certified",
      graph: serialized,
    };
    const data = JSON.stringify(snapshot);
    const snapshotHash = hash(data);
    const snapshotFile = `graph-${snapshotHash}.json`;
    // Content-addressed files remain reproducible when a later preparation changes the index.
    for (const [file, content] of [
      [`osm-${snapshot.rawHash}.json`, raw],
      [snapshotFile, data],
    ]) {
      const target = join(CACHE_ROOT, file);
      if (existsSync(target)) {
        if (hash(readFileSync(target)) !== hash(content)) throw new Error("Content-addressed snapshot is corrupt.");
      } else writeFileSync(target, content, { flag: "wx" });
    }
    index.cases.push(...group.caseIds.map((id) => ({ id, snapshotFile, snapshotHash })));
    console.info(`Graph ${groupIndex + 1}: ${graph.coords.size} nodes, ${[...graph.adj.values()].reduce((sum, edges) => sum + edges.length, 0)} directed edges.`);
  }
  writeFileSync(join(CACHE_ROOT, "index.json"), JSON.stringify(index, null, 2));
}, 180_000);
