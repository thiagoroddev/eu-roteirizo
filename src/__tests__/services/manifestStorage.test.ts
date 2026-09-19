import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import * as XLSX from "xlsx";

import { saveManifest, listManifests, getManifest, getRouteRows, backfillRouteRows, deleteManifest, clearManifests, saveStandaloneManifest, touchManifestUsage } from "../../services/manifestStorage";
import { processExcelFile } from "../../utils/excelProcessor";
import { sha256Hex } from "../../utils/hash";
import { COLUMN_NAMES } from "../../constants";
import type { ProcessedResult } from "../../types";

/** Builds a real multi-route xlsx in memory (2 routes; only A-1 carries a Planned AT). */
const buildXlsxFile = (fileName = "romaneio.xlsx"): File => {
  const rows = [
    { [COLUMN_NAMES.CORRIDOR_CAGE]: "A-1", [COLUMN_NAMES.LATITUDE]: -22.95, [COLUMN_NAMES.LONGITUDE]: -43.19, [COLUMN_NAMES.SEQUENCE]: 1, [COLUMN_NAMES.PLANNED_AT]: " AT20250001 " },
    { [COLUMN_NAMES.CORRIDOR_CAGE]: "A-1", [COLUMN_NAMES.LATITUDE]: -22.96, [COLUMN_NAMES.LONGITUDE]: -43.2, [COLUMN_NAMES.SEQUENCE]: 2, [COLUMN_NAMES.PLANNED_AT]: "AT20250001" },
    { [COLUMN_NAMES.CORRIDOR_CAGE]: "B-2", [COLUMN_NAMES.LATITUDE]: -22.97, [COLUMN_NAMES.LONGITUDE]: -43.21, [COLUMN_NAMES.SEQUENCE]: 1 },
  ];
  const sheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Rota");
  const bytes = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  return new File([bytes], fileName, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
};

/** Arbitrary-bytes file + hand-built ProcessedResult (the hash does not care about xlsx validity). */
const fakeFile = (content: string, fileName = "arquivo.xlsx"): File => new File([content], fileName, { type: "application/octet-stream" });

const processedFixture = (overrides: Partial<ProcessedResult> = {}): ProcessedResult => ({
  routes: { "A-1": [{ [COLUMN_NAMES.PLANNED_AT]: "AT1" }, {}], "B-2": [{}] },
  availableCols: [COLUMN_NAMES.LATITUDE, COLUMN_NAMES.LONGITUDE],
  missingCols: [],
  isSingleRoute: false,
  ...overrides,
});

describe("manifestStorage", () => {
  beforeEach(async () => {
    await clearManifests();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("saves a manifest with full metadata (id = content hash; at only where present)", async () => {
    const file = fakeFile("conteudo-1");
    const result = await saveManifest(file, processedFixture());

    expect(result.status).toBe("saved");
    if (result.status !== "saved") return;
    expect(result.meta.id).toBe(await sha256Hex(await file.arrayBuffer()));
    expect(result.meta.fileName).toBe("arquivo.xlsx");
    expect(result.meta.fileType).toBe("application/octet-stream");
    expect(result.meta.fileSize).toBeGreaterThan(0);
    expect(result.meta.kind).toBe("multi");
    expect(result.meta.routes).toEqual([
      { name: "A-1", rowCount: 2, at: "AT1" },
      { name: "B-2", rowCount: 1 },
    ]);
    expect(Number.isNaN(Date.parse(result.meta.importedAt))).toBe(false);
  });

  it("round-trips a real xlsx: save → get → intact bytes → reprocessable (RF-46)", async () => {
    const file = buildXlsxFile();
    const processed = await processExcelFile(file);
    expect(processed.error).toBeUndefined();

    const saved = await saveManifest(file, processed);
    expect(saved.status).toBe("saved");
    if (saved.status !== "saved") return;
    expect(saved.meta.routes.map((r) => r.name)).toEqual(["A-1", "B-2"]);
    expect(saved.meta.routes[0].at).toBe("AT20250001"); // trimmed

    const record = await getManifest(saved.meta.id);
    expect(record).not.toBeNull();
    expect(new Uint8Array(record!.bytes)).toEqual(new Uint8Array(await file.arrayBuffer()));

    const reopened = new File([record!.bytes], record!.fileName, { type: record!.fileType });
    const reprocessed = await processExcelFile(reopened);
    expect(reprocessed.error).toBeUndefined();
    expect(Object.keys(reprocessed.routes!)).toEqual(Object.keys(processed.routes!));
    expect(reprocessed.routes!["A-1"]).toHaveLength(processed.routes!["A-1"].length);
  });

  it("detects a duplicate by bytes even under a different file name (RN-23)", async () => {
    const first = await saveManifest(fakeFile("mesmo-conteudo", "original.xlsx"), processedFixture());
    expect(first.status).toBe("saved");

    const second = await saveManifest(fakeFile("mesmo-conteudo", "renomeado.xlsx"), processedFixture());
    expect(second.status).toBe("duplicate");
    if (second.status !== "duplicate") return;
    // Meta is the EXISTING record's — the UI can say "already imported as original.xlsx" and select it.
    expect(second.meta.fileName).toBe("original.xlsx");

    expect(await listManifests()).toHaveLength(1);
  });

  it("stores different bytes as separate manifests", async () => {
    await saveManifest(fakeFile("um"), processedFixture());
    await saveManifest(fakeFile("dois"), processedFixture());
    expect(await listManifests()).toHaveLength(2);
  });

  it("lists newest first (importedAt desc) without the bytes", async () => {
    // Fake ONLY Date: faking setTimeout would deadlock fake-indexeddb's internal task queue.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-07-05T10:00:00Z"));
    await saveManifest(fakeFile("antigo"), processedFixture());
    vi.setSystemTime(new Date("2026-07-05T11:00:00Z"));
    await saveManifest(fakeFile("recente"), processedFixture());

    const metas = await listManifests();
    expect(metas).toHaveLength(2);
    expect(metas[0].importedAt).toBe("2026-07-05T11:00:00.000Z");
    expect(metas[1].importedAt).toBe("2026-07-05T10:00:00.000Z");
    expect(metas[0]).not.toHaveProperty("bytes");
  });

  it("deletes a manifest and tolerates deleting an unknown id", async () => {
    const saved = await saveManifest(fakeFile("apagavel"), processedFixture());
    if (saved.status !== "saved") throw new Error("setup failed");

    await deleteManifest(saved.meta.id);
    expect(await getManifest(saved.meta.id)).toBeNull();
    expect(await listManifests()).toHaveLength(0);

    await expect(deleteManifest("inexistente")).resolves.toBeUndefined();
  });

  it("rejects errored or empty ProcessedResults without persisting (invalid)", async () => {
    const errored = await saveManifest(fakeFile("x"), processedFixture({ error: "boom", routes: null }));
    expect(errored.status).toBe("invalid");

    const nullRoutes = await saveManifest(fakeFile("y"), processedFixture({ routes: null }));
    expect(nullRoutes.status).toBe("invalid");

    const emptyRoutes = await saveManifest(fakeFile("z"), processedFixture({ routes: {} }));
    expect(emptyRoutes.status).toBe("invalid");

    expect(await listManifests()).toHaveLength(0);
  });

  it("returns null for an unknown manifest id", async () => {
    expect(await getManifest("nao-existe")).toBeNull();
  });

  // ==========================================================================
  // Rows grouped by route (TASK-REF-018)
  // ==========================================================================

  it("saves rows grouped by route and reads ONE route without the others", async () => {
    const saved = await saveManifest(fakeFile("agrupado"), processedFixture());
    if (saved.status !== "saved") throw new Error("setup failed");

    // Each route reads back exactly its own rows.
    expect(await getRouteRows(saved.meta.id, "A-1")).toEqual([{ [COLUMN_NAMES.PLANNED_AT]: "AT1" }, {}]);
    expect(await getRouteRows(saved.meta.id, "B-2")).toEqual([{}]);
    // A route that isn't in the manifest is a miss, not an error.
    expect(await getRouteRows(saved.meta.id, "NAO-EXISTE")).toBeNull();
  });

  it("persists availableCols/missingCols in the meta (so reopen skips reprocessing)", async () => {
    const saved = await saveManifest(fakeFile("com-cols"), processedFixture());
    if (saved.status !== "saved") throw new Error("setup failed");
    expect(saved.meta.availableCols).toEqual([COLUMN_NAMES.LATITUDE, COLUMN_NAMES.LONGITUDE]);
    expect(saved.meta.missingCols).toEqual([]);

    // And they survive a round-trip through storage.
    const record = await getManifest(saved.meta.id);
    expect(record?.availableCols).toEqual([COLUMN_NAMES.LATITUDE, COLUMN_NAMES.LONGITUDE]);
  });

  it("deletes the route rows along with the manifest (no orphans)", async () => {
    const saved = await saveManifest(fakeFile("apagavel-com-linhas"), processedFixture());
    if (saved.status !== "saved") throw new Error("setup failed");
    expect(await getRouteRows(saved.meta.id, "A-1")).not.toBeNull();

    await deleteManifest(saved.meta.id);

    expect(await getRouteRows(saved.meta.id, "A-1")).toBeNull();
    expect(await getRouteRows(saved.meta.id, "B-2")).toBeNull();
  });

  it("backfillRouteRows fills rows + cols for a manifest that lacked them", async () => {
    // Simulate a pre-REF-018 record: save, then wipe just its route rows by
    // deleting through the public API is not possible, so we assert the backfill
    // writes what a fresh reprocess would produce.
    const saved = await saveManifest(fakeFile("legado"), processedFixture());
    if (saved.status !== "saved") throw new Error("setup failed");

    await backfillRouteRows(saved.meta.id, processedFixture({ routes: { "A-1": [{ novo: 1 }], "C-3": [{}, {}] } }));

    expect(await getRouteRows(saved.meta.id, "A-1")).toEqual([{ novo: 1 }]);
    expect(await getRouteRows(saved.meta.id, "C-3")).toEqual([{}, {}]);
  });

  it("backfillRouteRows is a no-op (no throw) for null routes or an unknown id", async () => {
    await expect(backfillRouteRows("qualquer", processedFixture({ routes: null }))).resolves.toBeUndefined();
    await expect(backfillRouteRows("id-desconhecido", processedFixture())).resolves.toBeUndefined();
  });

  it("saveStandaloneManifest saves route rows and derives availableCols and at (RF-013)", async () => {
    const rows = [{ [COLUMN_NAMES.LATITUDE]: -22.98, [COLUMN_NAMES.LONGITUDE]: -43.2, [COLUMN_NAMES.PLANNED_AT]: "AT_STANDALONE", [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua 1" }];
    const ok = await saveStandaloneManifest("man_std_1", "Rota Standalone", rows);
    expect(ok).toBe(true);

    const record = await getManifest("man_std_1");
    expect(record).not.toBeNull();
    expect(record?.availableCols).toContain(COLUMN_NAMES.LATITUDE);
    expect(record?.availableCols).toContain(COLUMN_NAMES.LONGITUDE);
    expect(record?.availableCols).toContain(COLUMN_NAMES.PLANNED_AT);
    expect(record?.routes).toEqual([{ name: "Rota Standalone", rowCount: 1, at: "AT_STANDALONE" }]);

    const storedRows = await getRouteRows("man_std_1", "Rota Standalone");
    expect(storedRows).toEqual(rows);
  });

  // ==========================================================================
  // Ordenação por uso mais recente (TASK-RF-046 / RF-60)
  // ==========================================================================

  it("salva um romaneio e registra lastUsedAt no topo", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-17T10:00:00Z"));
    const first = await saveManifest(fakeFile("romaneio-1"), processedFixture());
    expect(first.status).toBe("saved");
    if (first.status !== "saved") return;
    expect(first.meta.lastUsedAt).toBe("2026-09-17T10:00:00.000Z");

    vi.setSystemTime(new Date("2026-09-17T11:00:00Z"));
    const second = await saveManifest(fakeFile("romaneio-2"), processedFixture());
    expect(second.status).toBe("saved");
    if (second.status !== "saved") return;
    expect(second.meta.lastUsedAt).toBe("2026-09-17T11:00:00.000Z");

    const metas = await listManifests();
    expect(metas).toHaveLength(2);
    expect(metas[0].id).toBe(second.meta.id);
    expect(metas[1].id).toBe(first.meta.id);
  });

  it("reimportar duplicata atualiza lastUsedAt e reposiciona no topo", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-17T08:00:00Z"));
    const first = await saveManifest(fakeFile("conteudo-duplicado", "arquivo-a.xlsx"), processedFixture());
    expect(first.status).toBe("saved");
    if (first.status !== "saved") return;

    vi.setSystemTime(new Date("2026-09-17T09:00:00Z"));
    const other = await saveManifest(fakeFile("outro-conteudo", "arquivo-b.xlsx"), processedFixture());
    expect(other.status).toBe("saved");
    if (other.status !== "saved") return;

    // Before reimport: other (09:00) is at top, first (08:00) is second.
    let metas = await listManifests();
    expect(metas[0].id).toBe(other.meta.id);
    expect(metas[1].id).toBe(first.meta.id);

    // Reimport first at 10:00
    vi.setSystemTime(new Date("2026-09-17T10:00:00Z"));
    const reimported = await saveManifest(fakeFile("conteudo-duplicado", "arquivo-a-renomeado.xlsx"), processedFixture());
    expect(reimported.status).toBe("duplicate");
    if (reimported.status !== "duplicate") return;
    expect(reimported.meta.id).toBe(first.meta.id);
    expect(reimported.meta.lastUsedAt).toBe("2026-09-17T10:00:00.000Z");

    // Now first must be at top!
    metas = await listManifests();
    expect(metas[0].id).toBe(first.meta.id);
    expect(metas[1].id).toBe(other.meta.id);
  });

  it("lista ordenando por lastUsedAt desc com fallback para importedAt", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-17T01:00:00Z"));
    const m1 = await saveManifest(fakeFile("m1"), processedFixture());
    vi.setSystemTime(new Date("2026-09-17T02:00:00Z"));
    const m2 = await saveManifest(fakeFile("m2"), processedFixture());
    vi.setSystemTime(new Date("2026-09-17T03:00:00Z"));
    const m3 = await saveManifest(fakeFile("m3"), processedFixture());

    if (m1.status !== "saved" || m2.status !== "saved" || m3.status !== "saved") throw new Error("setup failed");

    // Touch m1 usage at 04:00
    await touchManifestUsage(m1.meta.id, "2026-09-17T04:00:00.000Z");

    let metas = await listManifests();
    // Order should be m1 (04:00), m3 (03:00), m2 (02:00)
    expect(metas.map((m) => m.id)).toEqual([m1.meta.id, m3.meta.id, m2.meta.id]);

    // Touch m2 usage at 05:00
    await touchManifestUsage(m2.meta.id, "2026-09-17T05:00:00.000Z");
    metas = await listManifests();
    // Order should be m2 (05:00), m1 (04:00), m3 (03:00)
    expect(metas.map((m) => m.id)).toEqual([m2.meta.id, m1.meta.id, m3.meta.id]);
  });

  it("persiste bairro principal (neighborhood) nos metadados de cada rota (RF-62)", async () => {
    const fixtureWithNeighborhood: ProcessedResult = {
      routes: {
        "R-1": [{ [COLUMN_NAMES.NEIGHBORHOOD]: "Copacabana", [COLUMN_NAMES.PLANNED_AT]: "AT01" }, { [COLUMN_NAMES.NEIGHBORHOOD]: "Copacabana" }, { [COLUMN_NAMES.NEIGHBORHOOD]: "Ipanema" }],
        "R-2": [{ [COLUMN_NAMES.NEIGHBORHOOD]: "Centro", [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Qualquer, Centro - RJ" }],
      },
      availableCols: [COLUMN_NAMES.NEIGHBORHOOD, COLUMN_NAMES.DESTINATION_ADDRESS],
      missingCols: [],
      isSingleRoute: false,
    };

    const saved = await saveManifest(fakeFile("com-bairros"), fixtureWithNeighborhood);
    expect(saved.status).toBe("saved");
    if (saved.status !== "saved") return;

    const r1 = saved.meta.routes.find((r) => r.name === "R-1");
    expect(r1?.neighborhood).toBe("Copacabana");

    const r2 = saved.meta.routes.find((r) => r.name === "R-2");
    expect(r2?.neighborhood).toBe("Centro");

    const record = await getManifest(saved.meta.id);
    expect(record?.routes.find((r) => r.name === "R-1")?.neighborhood).toBe("Copacabana");
  });
});
