/**
 * services/routeExport.ts - Serialization, validation and import/export of routes (TASK-RF-013).
 *
 * Implements RF-36, RF-20, RF-44 and RN-21.
 */

import type { DeliveryPoint, PlannedRoute } from "../types/routing";
import { ROUTE_EXPORT_SCHEMA_V1, type ExportedRouteMeta, type ExportedRoutePayloadV1, type ImportRouteResult, type ParseRouteResult } from "../types/routeExport";
import { saveRoteiro } from "./routeStorage";
import { saveStandaloneManifest, deriveAvailableColsFromRows, findRouteAt } from "./manifestStorage";
import { COLUMN_NAMES } from "../constants";
import type { RowData } from "../types";

export const deliveryPointToRow = (p: DeliveryPoint, index = 0): RowData => {
  const firstPkg = p.packages?.[0];
  if (firstPkg?.rawData && Object.keys(firstPkg.rawData).length > 0) {
    return { ...firstPkg.rawData };
  }
  return {
    [COLUMN_NAMES.LATITUDE]: p.lat,
    [COLUMN_NAMES.LONGITUDE]: p.lng,
    [COLUMN_NAMES.DESTINATION_ADDRESS]: p.address,
    [COLUMN_NAMES.SEQUENCE]: index + 1,
    [COLUMN_NAMES.STOP]: index + 1,
    [COLUMN_NAMES.SPX_TN]: firstPkg?.tracking ?? p.id,
  };
};

export const createRouteExportPayload = (
  manifestId: string,
  routeName: string,
  route: PlannedRoute,
  points: DeliveryPoint[],
  rowsOrMeta?: RowData[] | ExportedRouteMeta,
  availableCols?: string[],
  meta?: ExportedRouteMeta
): ExportedRoutePayloadV1 => {
  let rows: RowData[] | undefined;
  let effectiveMeta = meta;
  if (Array.isArray(rowsOrMeta)) {
    rows = rowsOrMeta;
  } else if (rowsOrMeta && typeof rowsOrMeta === "object") {
    effectiveMeta = rowsOrMeta as ExportedRouteMeta;
  }

  const effectiveRows = rows && rows.length > 0 ? rows : extractAllRowsFromPayload({ points: points ?? [], manifestId, routeName, route, schema: ROUTE_EXPORT_SCHEMA_V1, version: 1, exportedAt: "" });
  const effectiveCols = availableCols && availableCols.length > 0 ? availableCols : deriveAvailableColsFromRows(effectiveRows);
  return {
    schema: ROUTE_EXPORT_SCHEMA_V1,
    version: 1,
    exportedAt: new Date().toISOString(),
    manifestId,
    routeName,
    route,
    rows: effectiveRows,
    routes: { [routeName]: effectiveRows },
    availableCols: effectiveCols,
    missingCols: [],
    isSingleRoute: true,
    points,
    meta: {
      ...(effectiveMeta ?? {}),
      at: effectiveMeta?.at ?? findRouteAt(effectiveRows),
    },
  };
};

export const serializeRouteExport = (payload: ExportedRoutePayloadV1): string => JSON.stringify(payload, null, 2);

export const downloadRouteJson = (payload: ExportedRoutePayloadV1): void => {
  if (typeof document === "undefined") return;
  const json = serializeRouteExport(payload);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const dateStr = payload.exportedAt ? payload.exportedAt.slice(0, 10) : new Date().toISOString().slice(0, 10);
  const sanitizedRoute = payload.routeName.replace(/[^a-zA-Z0-9_\u00C0-\u00FF-]/g, "_").toLowerCase();
  a.href = url;
  a.download = `roteiro-${sanitizedRoute}-${dateStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const parseAndValidateRouteJson = (raw: string): ParseRouteResult => {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    return { ok: false, error: `JSON inválido: ${err instanceof Error ? err.message : String(err)}` };
  }

  if (!parsed || typeof parsed !== "object") {
    return { ok: false, error: "Arquivo vazio ou inválido" };
  }

  const data = parsed as Record<string, unknown>;

  if (data.schema !== ROUTE_EXPORT_SCHEMA_V1) {
    return { ok: false, error: `Schema não reconhecido: ${String(data.schema)}` };
  }

  if (data.version !== 1) {
    return { ok: false, error: `Versão não suportada: ${String(data.version)}` };
  }

  if (typeof data.manifestId !== "string" || !data.manifestId.trim()) {
    return { ok: false, error: "Campo manifestId ausente ou inválido" };
  }

  if (typeof data.routeName !== "string" || !data.routeName.trim()) {
    return { ok: false, error: "Campo routeName ausente ou inválido" };
  }

  if (!data.route || typeof data.route !== "object" || !Array.isArray((data.route as PlannedRoute).stops)) {
    return { ok: false, error: "Estrutura de roteiro inválida: stops ausente ou inválido" };
  }

  const route = data.route as PlannedRoute;
  for (const [index, stop] of route.stops.entries()) {
    if (!stop || typeof stop !== "object" || !stop.id || typeof stop.order !== "number") {
      return { ok: false, error: `Parada no índice ${index} inválida` };
    }
    if (!stop.vehicleStop || typeof stop.vehicleStop.lat !== "number" || typeof stop.vehicleStop.lng !== "number" || Number.isNaN(stop.vehicleStop.lat) || Number.isNaN(stop.vehicleStop.lng)) {
      return { ok: false, error: `Parada ${stop.order} com coordenadas de veículo inválidas` };
    }
    if (!Array.isArray(stop.pointIds)) {
      return { ok: false, error: `Parada ${stop.order} sem lista de endereços (pointIds)` };
    }
  }

  if (!Array.isArray(data.points) && !Array.isArray(data.rows)) {
    return { ok: false, error: "Lista de pontos de entrega ou linhas (points/rows) ausente" };
  }

  return {
    ok: true,
    payload: data as unknown as ExportedRoutePayloadV1,
  };
};

/**
 * Extracts all rows from the exported payload points.
 * Unrolls every DeliveryPackage in each DeliveryPoint to ensure multi-package
 * addresses preserve all packages and original columns/metadata (RF-013).
 */
export const extractAllRowsFromPayload = (payload: ExportedRoutePayloadV1): RowData[] => {
  const rows: RowData[] = [];
  let fallbackSeq = 1;

  if (Array.isArray(payload.points)) {
    for (const point of payload.points) {
      if (Array.isArray(point.packages) && point.packages.length > 0) {
        for (const pkg of point.packages) {
          if (pkg.rawData && Object.keys(pkg.rawData).length > 0) {
            rows.push({ ...pkg.rawData });
          } else {
            rows.push({
              [COLUMN_NAMES.LATITUDE]: point.lat,
              [COLUMN_NAMES.LONGITUDE]: point.lng,
              [COLUMN_NAMES.DESTINATION_ADDRESS]: point.address,
              [COLUMN_NAMES.SEQUENCE]: fallbackSeq,
              [COLUMN_NAMES.STOP]: fallbackSeq,
              [COLUMN_NAMES.SPX_TN]: pkg.tracking ?? pkg.id,
            });
            fallbackSeq++;
          }
        }
      } else {
        rows.push(deliveryPointToRow(point, fallbackSeq++));
      }
    }
  }

  // Restore original spreadsheet order by Sequence if numeric sequence values exist
  rows.sort((a, b) => {
    const seqA = Number(a[COLUMN_NAMES.SEQUENCE]);
    const seqB = Number(b[COLUMN_NAMES.SEQUENCE]);
    if (!Number.isNaN(seqA) && !Number.isNaN(seqB)) {
      return seqA - seqB;
    }
    return 0;
  });

  return rows;
};

export const importRoutePayload = async (payload: ExportedRoutePayloadV1, fileBytes?: ArrayBuffer): Promise<ImportRouteResult> => {
  try {
    const rows =
      Array.isArray(payload.rows) && payload.rows.length > 0
        ? payload.rows
        : payload.routes && payload.routes[payload.routeName] && payload.routes[payload.routeName].length > 0
          ? payload.routes[payload.routeName]
          : extractAllRowsFromPayload(payload);

    const availableCols = Array.isArray(payload.availableCols) && payload.availableCols.length > 0 ? payload.availableCols : deriveAvailableColsFromRows(rows);

    const at = payload.meta?.at ?? findRouteAt(rows);

    // ALWAYS overwrite/update standalone manifest and grouped rows (RF-013)
    await saveStandaloneManifest(payload.manifestId, payload.routeName, rows, availableCols, at, fileBytes);

    const saveResult = await saveRoteiro(payload.manifestId, payload.routeName, payload.route);
    if (saveResult.status === "error") {
      return { ok: false, error: `Falha ao salvar roteiro: ${saveResult.reason}` };
    }

    return {
      ok: true,
      manifestId: payload.manifestId,
      routeName: payload.routeName,
      isStandalone: true,
    };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
};

export const readFileAsText = async (file: File): Promise<string> => {
  if (typeof file.text === "function") {
    return file.text();
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file);
  });
};
