import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as XLSX from "xlsx";
import type { ExportedRoutePayloadV1 } from "../../src/types/routeExport";
import { DEFAULT_ROUTING_CONFIG } from "../../src/types/routing";
import { buildDeliveryPoints } from "../../src/utils/routing/points";
import type { AnchorSearchResult } from "../../src/types/autoRouting";
import { importRoutePayload, parseAndValidateRouteJson, serializeRouteExport } from "../../src/services/routeExport";
import { clearManifests, getRouteRows } from "../../src/services/manifestStorage";
import { clearRoteiros, getRoteiro } from "../../src/services/routeStorage";
import { createInitialBuilderState, routeBuilderReducer } from "../../src/utils/routing/builder";
import { nearestFirstOrder } from "../../src/utils/routing/walkOrder";
import { createInspectionPayload, hash, loadCorpus, loadSnapshots, validateReference, type Corpus, type CorpusCase, type GraphSnapshot, type SnapshotIndex } from "./corpus";

const rows = [
  { Latitude: -22.98, Longitude: -43.2, "SPX TN": "fixture-1", "Destination Address": "Synthetic" },
  { Latitude: -22.98, Longitude: -43.2, "SPX TN": "fixture-2", "Destination Address": "Synthetic" },
];
const points = buildDeliveryPoints(rows);
const reference = (): ExportedRoutePayloadV1 => ({
  schema: "eu-roteirizo/roteiro/v1",
  version: 1,
  exportedAt: "",
  manifestId: "fixture",
  routeName: "fixture",
  points: structuredClone(points),
  rows: structuredClone(rows),
  route: { id: "fixture", startPoint: null, createdAt: "", config: DEFAULT_ROUTING_CONFIG, stops: [{ id: "s", order: 1, vehicleStop: points[0], pointIds: [points[0].id], radiusMeters: 30 }] },
});

describe("inspection exports", () => {
  const sourceRows = [
    ...rows,
    { ...rows[0], Latitude: -22.9802, "SPX TN": "fixture-3" },
    { ...rows[0], Latitude: -22.981, "SPX TN": "fixture-pending" },
    { ...rows[0], Latitude: -22.982, "SPX TN": "fixture-ignored" },
  ];
  const sourcePoints = buildDeliveryPoints(sourceRows);
  const manual: ExportedRoutePayloadV1 = {
    ...reference(),
    points: sourcePoints,
    rows: sourceRows,
    route: { ...reference().route, startPoint: { lat: -22.983, lng: -43.2 }, ignoredPointIds: [sourcePoints[3].id] },
  };
  const entry: CorpusCase = { id: "case-synthetic", file: "1/private-fixture.xlsx", sourceHash: "synthetic-hash", rows: sourceRows, points: sourcePoints, invalidRows: 0, reference: manual };
  const scenario = { runId: "synthetic-run-one", sampleStepMeters: 10 };
  const result = (): AnchorSearchResult => ({
    status: "partial",
    radiusMeters: 60,
    candidates: [],
    defaultAnchors: [],
    groups: [
      {
        candidateId: "candidate",
        seedPointId: sourcePoints[1].id,
        defaultVehicleStop: { lat: sourcePoints[1].lat, lng: sourcePoints[1].lng },
        vehicleStop: { lat: -22.98004, lng: -43.1999 },
        vehicleStopIsDefault: false,
        pointIds: [sourcePoints[1].id, sourcePoints[0].id],
        packageCount: 3,
      },
    ],
    pending: [{ pointId: sourcePoints[2].id, reason: "no-candidate-in-radius" }],
    ignoredPointIds: [sourcePoints[3].id],
    errors: [],
    diagnostics: { segments: 1, nearbySegments: 1, gridEntries: 1, distanceChecks: 1, groupChecks: 1, limitReached: false },
  });

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-01-01T12:00:00Z"));
  });
  afterEach(async () => {
    vi.useRealTimers();
    await clearRoteiros();
    await clearManifests();
  });

  it("uses the actual v1 parser and preserves points, anchors and source data", () => {
    const calculation = result();
    const original = structuredClone({ entry, calculation });
    const payload = createInspectionPayload(entry, calculation, scenario);
    const parsed = parseAndValidateRouteJson(serializeRouteExport(payload));

    expect(parsed.ok).toBe(true);
    expect(payload.schema).toBe("eu-roteirizo/roteiro/v1");
    expect(payload.rows).toEqual(sourceRows);
    expect(payload.points).toEqual(sourcePoints);
    expect(payload.route.stops[0].vehicleStop).toEqual(calculation.groups[0].vehicleStop);
    expect(payload.route.stops[0].vehicleStopIsDefault).toBe(false);
    expect(payload.route.stops[0].pointIds).toEqual(nearestFirstOrder(calculation.groups[0].vehicleStop, [sourcePoints[1], sourcePoints[0]], false));
    expect(payload.route.startPoint).toEqual(manual.route.startPoint);
    expect(payload.route.config.autoRadiusMeters).toBe(60);
    expect(payload.routeName).toContain("INSPEÇÃO");
    expect(payload.routeName).toContain("NÃO OTIMIZADO");
    expect(payload.routeName).not.toContain("private-fixture");
    expect({ entry, calculation }).toEqual(original);
    payload.points[0].address = "Edited copy";
    payload.route.stops[0].vehicleStop.lat = 0;
    expect({ entry, calculation }).toEqual(original);
  });

  it("leaves pending points free and keeps only actual exclusions ignored", () => {
    const payload = createInspectionPayload(entry, result(), scenario);
    const hydrated = routeBuilderReducer(createInitialBuilderState(buildDeliveryPoints(payload.rows!)), { type: "HYDRATE", route: payload.route });
    expect(hydrated.stops.flatMap((s) => s.pointIds).sort()).toEqual([sourcePoints[0].id, sourcePoints[1].id].sort());
    expect(hydrated.points).toHaveLength(sourcePoints.length);
    expect(hydrated.ignoredPointIds).toEqual([sourcePoints[3].id]);
    expect(hydrated.stops.some((s) => s.pointIds.includes(sourcePoints[2].id))).toBe(false);
    expect(hydrated.ignoredPointIds).not.toContain(sourcePoints[2].id);
  });

  it("imports variants without overwriting the manual reference and remains editable", async () => {
    expect((await importRoutePayload(manual)).ok).toBe(true);
    const first = createInspectionPayload(entry, result(), scenario);
    const variants = [
      first,
      createInspectionPayload(entry, { ...result(), radiusMeters: 90 }, scenario),
      createInspectionPayload(entry, result(), { ...scenario, sampleStepMeters: 20 }),
      createInspectionPayload(entry, result(), { ...scenario, runId: "synthetic-run-two" }),
    ];
    expect(new Set(variants.map((p) => p.manifestId)).size).toBe(variants.length);
    expect(createInspectionPayload(entry, result(), scenario).manifestId).toBe(first.manifestId);
    for (const payload of variants) {
      expect(payload.manifestId).not.toBe(manual.manifestId);
      const parsed = parseAndValidateRouteJson(serializeRouteExport(payload));
      if (!parsed.ok) throw new Error(parsed.error);
      expect((await importRoutePayload(parsed.payload)).ok).toBe(true);
      expect(await getRoteiro(payload.manifestId, payload.routeName)).toEqual(payload.route);
      expect(await getRouteRows(payload.manifestId, payload.routeName)).toEqual(sourceRows);
    }
    const saved = (await getRoteiro(first.manifestId, first.routeName))!;
    let state = routeBuilderReducer(createInitialBuilderState(buildDeliveryPoints(first.rows!)), { type: "HYDRATE", route: saved });
    state = routeBuilderReducer(state, { type: "REOPEN_STOP", stopId: saved.stops[0].id });
    state = routeBuilderReducer(state, { type: "MOVE_VEHICLE_STOP", position: { lat: -22.9801, lng: -43.1998 } });
    expect(state.draft?.vehicleStop).toEqual({ lat: -22.9801, lng: -43.1998 });
    expect(state.draft?.pointIds.slice().sort()).toEqual(saved.stops[0].pointIds.slice().sort());
    expect(await getRoteiro(manual.manifestId, manual.routeName)).toEqual(manual.route);
    expect(await getRoteiro(variants[1].manifestId, variants[1].routeName)).toEqual(variants[1].route);
  });

  it("keeps the selected seed first for a default anchor and handles missing references", () => {
    const calculation = result();
    calculation.groups[0].vehicleStopIsDefault = true;
    calculation.groups[0].vehicleStop = { ...calculation.groups[0].defaultVehicleStop };
    const payload = createInspectionPayload({ ...entry, reference: undefined }, calculation, scenario);
    expect(payload.route.stops[0].pointIds[0]).toBe(calculation.groups[0].seedPointId);
    expect(payload.route.stops[0].vehicleStopIsDefault).toBe(true);
    expect(payload.route.startPoint).toBeNull();
    expect(payload.route.config.walkingSpeedKmh).toBe(DEFAULT_ROUTING_CONFIG.walkingSpeedKmh);
  });

  it("rejects broken conservation or invalid output instead of letting hydration hide it", () => {
    const lost = result();
    lost.pending = [];
    const unknown = result();
    unknown.groups[0].pointIds[0] = "unknown";
    const duplicated = result();
    duplicated.pending.push({ pointId: sourcePoints[0].id, reason: "search-limit" });
    const outside = result();
    outside.groups[0].vehicleStop.lat = -23;
    for (const broken of [lost, unknown, duplicated, outside, { ...result(), status: "invalid" as const }]) {
      expect(() => createInspectionPayload(entry, broken, scenario)).toThrow("invalid-inspection-result");
    }
  });
});
const dirs: string[] = [];
const temp = (): string => {
  const dir = mkdtempSync(join(tmpdir(), "auto-anchors-test-"));
  dirs.push(dir);
  return dir;
};
afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("private corpus integrity with synthetic source files", () => {
  it("reconciles coordinates and package multiplicity without exposing them in errors", () => {
    expect(() => validateReference(reference(), points, "fixture")).not.toThrow();
    const changed = reference();
    changed.points[0].lng += 0.001;
    expect(() => validateReference(changed, points, "fixture")).toThrow("fixture: reference-package-or-coordinate-mismatch");
    const contradictoryRows = reference();
    contradictoryRows.rows![0].Latitude = -22.9;
    expect(() => validateReference(contradictoryRows, points, "fixture")).toThrow("fixture: reference-rows-mismatch");
  });

  it("rejects duplicate memberships and malformed reference points", () => {
    const duplicate = reference();
    duplicate.route.stops[0].pointIds.push(points[0].id);
    expect(() => validateReference(duplicate, points, "fixture")).toThrow("reference-membership-mismatch");
    const malformed = reference();
    malformed.points[0].packageCount = 10;
    expect(() => validateReference(malformed, points, "fixture")).toThrow("invalid-reference-point");
  });

  it("rejects swapped point identities even when aggregate packages and coordinates match", () => {
    const source = buildDeliveryPoints([...rows, { ...rows[0], Latitude: -22.981, "SPX TN": "fixture-3" }]);
    const changed = reference();
    changed.points = structuredClone(source);
    changed.rows = undefined;
    [changed.points[0].id, changed.points[1].id] = [changed.points[1].id, changed.points[0].id];
    expect(() => validateReference(changed, source, "fixture")).toThrow("reference-point-mismatch");
  });

  it("inventories all original files and detects missing reference pairs", () => {
    const root = temp();
    mkdirSync(join(root, "1"));
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, XLSX.utils.json_to_sheet(rows), "Sheet1");
    writeFileSync(join(root, "1", "fixture.xlsx"), XLSX.write(book, { type: "buffer", bookType: "xlsx" }));
    writeFileSync(join(root, "1", "fixture.json"), JSON.stringify(reference()));
    const corpus = loadCorpus(root);
    expect(corpus.cases).toHaveLength(1);
    expect(corpus.cases[0].rows).toHaveLength(2);
    expect(corpus.cases[0].points).toHaveLength(1);
    writeFileSync(join(root, "orphan.json"), JSON.stringify(reference()));
    expect(() => loadCorpus(root)).toThrow("Unpaired human reference");
  });

  it("fails without a corpus or graph instead of skipping real verification", () => {
    const root = temp();
    expect(() => loadCorpus(root)).toThrow("missing");
    expect(() => loadSnapshots({ hash: "test", cases: [], files: [], referenceCount: 0 }, root)).toThrow("Graph snapshots missing");
  });

  it("checks snapshot hashes, input inventory and bounds without a network fallback", () => {
    const root = temp();
    const corpus: Corpus = { hash: "test", files: [], referenceCount: 0, cases: [{ id: "fixture", file: "fixture.xlsx", sourceHash: "test", rows, points, invalidRows: 0 }] };
    const serialized = { coords: [[1, { lat: -22.98, lng: -43.2 }]] as [number, { lat: number; lng: number }][], adj: [] };
    const snapshot: GraphSnapshot = {
      schema: "auto-anchors/graph/v1",
      collectedAt: "test",
      osmTimestamp: null,
      endpoint: "synthetic",
      bbox: { south: -23, north: -22.9, west: -43.3, east: -43.1 },
      builderHash: hash(readFileSync(resolve("src/utils/routing/graph.ts"))),
      rawHash: "test",
      graphHash: hash(JSON.stringify(serialized)),
      pedestrianSource: "derived-from-vehicle-not-certified",
      graph: serialized,
    };
    const data = JSON.stringify(snapshot);
    const digest = hash(data);
    const file = `graph-${digest}.json`;
    writeFileSync(join(root, file), data);
    const index: SnapshotIndex = { schema: "auto-anchors/corpus/v1", preparedAt: "test", corpusHash: corpus.hash, files: [], cases: [{ id: "fixture", snapshotFile: file, snapshotHash: digest }] };
    writeFileSync(join(root, "index.json"), JSON.stringify(index));
    expect(loadSnapshots(corpus, root).size).toBe(1);
    expect(() => loadSnapshots({ ...corpus, hash: "changed" }, root)).toThrow("Corpus changed");
    const outside = { ...corpus, cases: [{ ...corpus.cases[0], points: [{ ...points[0], lat: -22.8 }] }] };
    expect(() => loadSnapshots(outside, root)).toThrow("graph-extent-insufficient");
    const inconsistent = { ...index, cases: [index.cases[0], { ...index.cases[0], id: "second", snapshotHash: "changed" }] };
    writeFileSync(join(root, "index.json"), JSON.stringify(inconsistent));
    expect(() => loadSnapshots({ ...corpus, cases: [corpus.cases[0], { ...corpus.cases[0], id: "second" }] }, root)).toThrow("missing-or-invalid-snapshot-reference");
    writeFileSync(join(root, "index.json"), JSON.stringify(index));
    writeFileSync(join(root, file), data + " ");
    expect(() => loadSnapshots(corpus, root)).toThrow("snapshot-hash-mismatch");
  });
});
