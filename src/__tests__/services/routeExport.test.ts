import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach } from "vitest";

import { createRouteExportPayload, serializeRouteExport, parseAndValidateRouteJson, importRoutePayload, extractAllRowsFromPayload } from "../../services/routeExport";
import { clearRoteiros, getRoteiro } from "../../services/routeStorage";
import { clearManifests, getManifest, getRouteRows, saveStandaloneManifest } from "../../services/manifestStorage";
import { COLUMN_NAMES } from "../../constants";
import { DEFAULT_ROUTING_CONFIG, type DeliveryPoint, type PlannedRoute } from "../../types/routing";
import { ROUTE_EXPORT_SCHEMA_V1 } from "../../types/routeExport";

const samplePoints: DeliveryPoint[] = [
  {
    id: "pt_-22.98615,-43.20859",
    lat: -22.98615,
    lng: -43.20859,
    address: "Avenida Vieira Souto, 100",
    packageCount: 1,
    packages: [
      {
        id: "pkg_1",
        tracking: "SPX1",
        rawData: {},
      },
    ],
  },
  {
    id: "pt_-22.98603,-43.21035",
    lat: -22.98603,
    lng: -43.21035,
    address: "Rua Prudente de Morais, 200",
    packageCount: 1,
    packages: [
      {
        id: "pkg_2",
        tracking: "SPX2",
        rawData: {},
      },
    ],
  },
];

const sampleRoute: PlannedRoute = {
  id: "route_test_123",
  startPoint: { lat: -22.97893, lng: -43.20107 },
  stops: [
    {
      id: "stop_1",
      order: 1,
      vehicleStop: { lat: -22.98626, lng: -43.20859 },
      pointIds: ["pt_-22.98615,-43.20859"],
      radiusMeters: 30,
      reversed: false,
      vehicleStopIsDefault: true,
    },
    {
      id: "stop_2",
      order: 2,
      vehicleStop: { lat: -22.98591, lng: -43.21033 },
      pointIds: ["pt_-22.98603,-43.21035"],
      radiusMeters: 60,
      reversed: false,
      vehicleStopIsDefault: false,
    },
  ],
  config: DEFAULT_ROUTING_CONFIG,
  createdAt: "2026-09-07T12:00:00.000Z",
};

beforeEach(async () => {
  await clearRoteiros();
  await clearManifests();
});

describe("routeExport", () => {
  it("gera JSON versionado v1 reimportavel com rota e pontos", () => {
    const payload = createRouteExportPayload("man_123", "Minha Rota Ipanema", sampleRoute, samplePoints, { addressCount: 2, stopCount: 2 });

    expect(payload.schema).toBe(ROUTE_EXPORT_SCHEMA_V1);
    expect(payload.version).toBe(1);
    expect(payload.manifestId).toBe("man_123");
    expect(payload.routeName).toBe("Minha Rota Ipanema");
    expect(payload.points.length).toBe(2);
    expect(payload.route.stops.length).toBe(2);

    const jsonStr = serializeRouteExport(payload);
    expect(typeof jsonStr).toBe("string");

    const parseResult = parseAndValidateRouteJson(jsonStr);
    expect(parseResult.ok).toBe(true);
    if (parseResult.ok) {
      expect(parseResult.payload.manifestId).toBe("man_123");
      expect(parseResult.payload.route.stops[1].vehicleStopIsDefault).toBe(false);
      expect(parseResult.payload.points[0].address).toBe("Avenida Vieira Souto, 100");
    }
  });

  it("valida schema e rejeita arquivos corrompidos ou incompativeis", () => {
    // 1. JSON inválido sintaticamente
    const invalidJson = parseAndValidateRouteJson("{ bad json ");
    expect(invalidJson.ok).toBe(false);
    if (!invalidJson.ok) {
      expect(invalidJson.error).toMatch(/JSON inválido/i);
    }

    // 2. Schema incorreto
    const wrongSchema = parseAndValidateRouteJson(JSON.stringify({ schema: "outro/v2", version: 2 }));
    expect(wrongSchema.ok).toBe(false);
    if (!wrongSchema.ok) {
      expect(wrongSchema.error).toMatch(/Schema não reconhecido/i);
    }

    // 3. Estrutura sem paradas válidas
    const invalidStructure = parseAndValidateRouteJson(
      JSON.stringify({
        schema: ROUTE_EXPORT_SCHEMA_V1,
        version: 1,
        manifestId: "m1",
        routeName: "R1",
        route: { id: "r1", stops: "not an array" },
        points: [],
      })
    );
    expect(invalidStructure.ok).toBe(false);
    if (!invalidStructure.ok) {
      expect(invalidStructure.error).toMatch(/Estrutura de roteiro inválida/i);
    }
  });

  it("importa roteiro associando a romaneio existente", async () => {
    const payload = createRouteExportPayload("man_existente", "Rota Existente", sampleRoute, samplePoints);

    const result = await importRoutePayload(payload);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.manifestId).toBe("man_existente");
      expect(result.routeName).toBe("Rota Existente");
    }

    const saved = await getRoteiro("man_existente", "Rota Existente");
    expect(saved).not.toBeNull();
    expect(saved?.stops.length).toBe(2);
  });

  it("importa roteiro avulso standalone preservando visualizacao no mapa", async () => {
    const payload = createRouteExportPayload("man_avulso_123", "Rota Avulsa", sampleRoute, samplePoints);

    const result = await importRoutePayload(payload);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.isStandalone).toBe(true);
    }

    // Roteiro persistido
    const savedRoute = await getRoteiro("man_avulso_123", "Rota Avulsa");
    expect(savedRoute).not.toBeNull();
    expect(savedRoute?.id).toBe(sampleRoute.id);

    // Dados de manifest standalone criados para visualização dos pontos no mapa
    const manifest = await getManifest("man_avulso_123");
    expect(manifest).not.toBeNull();
    expect(manifest?.kind).toBe("single");

    const rows = await getRouteRows("man_avulso_123", "Rota Avulsa");
    expect(rows).not.toBeNull();
    expect(rows?.length).toBe(2);
    expect(manifest?.availableCols).toContain(COLUMN_NAMES.LATITUDE);
    expect(manifest?.availableCols).toContain(COLUMN_NAMES.LONGITUDE);
  });

  it("extractAllRowsFromPayload desdobra múltiplos pacotes no mesmo endereço e preserva ordenação por sequência (RF-013)", () => {
    const multiPkgPoint: DeliveryPoint = {
      id: "pt_multi",
      lat: -22.98,
      lng: -43.2,
      address: "Rua das Flores, 50",
      packageCount: 2,
      packages: [
        {
          id: "pkg_A",
          tracking: "SPXA",
          rawData: {
            [COLUMN_NAMES.LATITUDE]: -22.98,
            [COLUMN_NAMES.LONGITUDE]: -43.2,
            [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua das Flores, 50",
            [COLUMN_NAMES.SEQUENCE]: 2,
            [COLUMN_NAMES.STOP]: 1,
            [COLUMN_NAMES.PLANNED_AT]: "AT99",
            [COLUMN_NAMES.SPX_TN]: "SPXA",
          },
        },
        {
          id: "pkg_B",
          tracking: "SPXB",
          rawData: {
            [COLUMN_NAMES.LATITUDE]: -22.98,
            [COLUMN_NAMES.LONGITUDE]: -43.2,
            [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua das Flores, 50",
            [COLUMN_NAMES.SEQUENCE]: 1,
            [COLUMN_NAMES.STOP]: 1,
            [COLUMN_NAMES.PLANNED_AT]: "AT99",
            [COLUMN_NAMES.SPX_TN]: "SPXB",
          },
        },
      ],
    };

    const payload = createRouteExportPayload("man_multi", "Rota Multi", sampleRoute, [multiPkgPoint]);
    const extracted = extractAllRowsFromPayload(payload);

    expect(extracted.length).toBe(2);
    // Ordenado por Sequence (1 antes de 2)
    expect(extracted[0][COLUMN_NAMES.SEQUENCE]).toBe(1);
    expect(extracted[0][COLUMN_NAMES.SPX_TN]).toBe("SPXB");
    expect(extracted[1][COLUMN_NAMES.SEQUENCE]).toBe(2);
    expect(extracted[1][COLUMN_NAMES.SPX_TN]).toBe("SPXA");
  });

  it("reimporta manifest atualizando availableCols e linhas mesmo se já existir no banco (RF-013)", async () => {
    // Simula estado corrompido/antigo no IndexedDB com availableCols vazio
    await saveStandaloneManifest("man_reimport", "Rota Reimport", [], []);
    const oldManifest = await getManifest("man_reimport");
    expect(oldManifest?.availableCols).toEqual([]);

    const payload = createRouteExportPayload("man_reimport", "Rota Reimport", sampleRoute, samplePoints);
    const result = await importRoutePayload(payload);
    expect(result.ok).toBe(true);

    const updated = await getManifest("man_reimport");
    expect(updated?.availableCols).toContain(COLUMN_NAMES.LATITUDE);
    expect(updated?.availableCols).toContain(COLUMN_NAMES.LONGITUDE);
    const updatedRows = await getRouteRows("man_reimport", "Rota Reimport");
    expect(updatedRows?.length).toBe(2);
  });
});
