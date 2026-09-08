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
import zipcodeDataNeighborhood from "../data/CEPs-Hub_RJ_Ilha-do-Governador.json";

const zipcodeMapNeighborhood = new Map(Object.entries(zipcodeDataNeighborhood));

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

export const extractDateFromFileName = (fileName?: string): string | null => {
  if (!fileName) return null;

  // Match YYYY-MM-DD or YYYY_MM_DD or YYYY.MM.DD
  const ymdMatch = fileName.match(/(?:^|[^0-9])(20\d{2})[-_.](\d{2})[-_.](\d{2})(?:[^0-9]|$)/);
  if (ymdMatch) {
    const [, y, m, d] = ymdMatch;
    const month = parseInt(m, 10);
    const day = parseInt(d, 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${y}-${m}-${d}`;
    }
  }

  // Match DD-MM-YYYY or DD_MM_YYYY or DD.MM.YYYY
  const dmyMatch = fileName.match(/(?:^|[^0-9])(\d{2})[-_.](\d{2})[-_.](\d{4})(?:[^0-9]|$)/);
  if (dmyMatch) {
    const [, d, m, y] = dmyMatch;
    const month = parseInt(m, 10);
    const day = parseInt(d, 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${y}-${m}-${d}`;
    }
  }

  // Match compact YYYYMMDD (ex: 20260908)
  const compactMatch = fileName.match(/(?:^|[^0-9])(20\d{2})(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])(?:[^0-9]|$)/);
  if (compactMatch) {
    const [, y, m, d] = compactMatch;
    return `${y}-${m}-${d}`;
  }

  return null;
};

export const extractDateFromRows = (rows?: RowData[]): string | null => {
  if (!rows || rows.length === 0) return null;

  for (const row of rows) {
    const rawDate = row[COLUMN_NAMES.DATE];
    if (rawDate !== undefined && rawDate !== null && String(rawDate).trim() !== "") {
      const s = String(rawDate).trim();
      const isoMatch = s.match(/\b(\d{4})[-/.](\d{2})[-/.](\d{2})\b/);
      if (isoMatch) {
        return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
      }
      const brMatch = s.match(/\b(\d{2})[-/.](\d{2})[-/.](\d{4})\b/);
      if (brMatch) {
        return `${brMatch[3]}-${brMatch[2]}-${brMatch[1]}`;
      }
    }
  }

  for (const row of rows) {
    const at = row[COLUMN_NAMES.PLANNED_AT];
    if (typeof at === "string") {
      const atMatch = at.match(/AT(\d{4})(\d{2})(\d{2})/i);
      if (atMatch) {
        return `${atMatch[1]}-${atMatch[2]}-${atMatch[3]}`;
      }
    }
  }

  return null;
};

export const resolveRouteDate = (params: { fileName?: string; rows?: RowData[]; importedAt?: string; exportedAt?: string; isSingleRoute?: boolean }): string => {
  const dateFromFileName = extractDateFromFileName(params.fileName);
  if (dateFromFileName) return dateFromFileName;

  const dateFromRows = extractDateFromRows(params.rows);
  if (dateFromRows) return dateFromRows;

  if (params.importedAt && params.importedAt.length >= 10) {
    const parsed = params.importedAt.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(parsed)) return parsed;
  }

  if (params.exportedAt && params.exportedAt.length >= 10) {
    const parsed = params.exportedAt.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(parsed)) return parsed;
  }

  return new Date().toISOString().slice(0, 10);
};

export const extractAtSuffix = (payload: ExportedRoutePayloadV1): string => {
  const at = (payload.meta?.at ?? findRouteAt(payload.rows ?? []) ?? "").trim();
  if (!at) return "ROTA";
  if (at.length >= 4) return at.slice(-4).toUpperCase();
  return at.toUpperCase().padStart(4, "0");
};

export const getDominantNeighborhood = (rows?: RowData[], points?: DeliveryPoint[]): string => {
  const counts = new Map<string, number>();

  const add = (name?: string) => {
    if (!name) return;
    const clean = name.trim();
    if (clean) {
      counts.set(clean, (counts.get(clean) ?? 0) + 1);
    }
  };

  if (rows && rows.length > 0) {
    for (const r of rows) {
      let b = r[COLUMN_NAMES.NEIGHBORHOOD] ? String(r[COLUMN_NAMES.NEIGHBORHOOD]).trim() : "";
      if (!b && r[COLUMN_NAMES.ZIPCODE]) {
        const rawZip = String(r[COLUMN_NAMES.ZIPCODE]).replace(/\D/g, "");
        const cepEntry = zipcodeMapNeighborhood.get(rawZip);
        if (cepEntry?.bairro) b = cepEntry.bairro.trim();
      }
      add(b);
    }
  } else if (points && points.length > 0) {
    for (const p of points) {
      const b = p.packages?.[0]?.rawData?.[COLUMN_NAMES.NEIGHBORHOOD];
      if (b) add(String(b).trim());
    }
  }

  if (counts.size === 0) return "GERAL";

  let bestName = "GERAL";
  let maxCount = -1;
  for (const [name, count] of counts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      bestName = name;
    }
  }

  const sanitized = bestName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toUpperCase();

  return sanitized || "GERAL";
};

export const buildExportFileName = (payload: ExportedRoutePayloadV1, manifestMeta?: { fileName?: string; importedAt?: string }): string => {
  const effectiveFileName = manifestMeta?.fileName ?? payload.meta?.manifestFileName;
  const effectiveImportedAt = manifestMeta?.importedAt ?? payload.meta?.importedAt;

  const date = resolveRouteDate({
    fileName: effectiveFileName,
    rows: payload.rows,
    importedAt: effectiveImportedAt,
    exportedAt: payload.exportedAt,
    isSingleRoute: payload.isSingleRoute,
  });

  const atSuffix = extractAtSuffix(payload);
  const neighborhood = getDominantNeighborhood(payload.rows, payload.points);

  return `${date}-${atSuffix}-${neighborhood}.json`;
};

export const downloadRouteJson = (payload: ExportedRoutePayloadV1, manifestMeta?: { fileName?: string; importedAt?: string }): void => {
  if (typeof document === "undefined") return;
  const json = serializeRouteExport(payload);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = buildExportFileName(payload, manifestMeta);
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
