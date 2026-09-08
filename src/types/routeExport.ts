/**
 * types/routeExport.ts - Contracts for versioned route export & import (TASK-RF-013).
 *
 * Implements RF-36, RF-20, RF-44 and RN-21:
 * - Versioned schema (`eu-roteirizo/roteiro/v1`)
 * - Encapsulates `PlannedRoute` + essential `DeliveryPoint[]`
 * - Allows standalone import/re-opening when original manifest spreadsheet is absent.
 */

import type { RowData } from "../types";
import type { DeliveryPoint, PlannedRoute } from "./routing";

export const ROUTE_EXPORT_SCHEMA_V1 = "eu-roteirizo/roteiro/v1" as const;

export interface ExportedRouteMeta {
  addressCount?: number;
  stopCount?: number;
  packageCount?: number;
  totalDistanceMeters?: number;
  at?: string;
  manifestFileName?: string;
  importedAt?: string;
  dominantNeighborhood?: string;
  atSuffix?: string;
}

export interface ExportedRoutePayloadV1 {
  schema: typeof ROUTE_EXPORT_SCHEMA_V1;
  version: 1;
  exportedAt: string;
  manifestId: string;
  routeName: string;
  route: PlannedRoute;
  /** Complete spreadsheet rows for the route (treated exactly as an uploaded romaneio). */
  rows?: RowData[];
  /** Grouped routes map (compatible with ProcessedResult). */
  routes?: Record<string, RowData[]>;
  /** Available spreadsheet columns. */
  availableCols?: string[];
  missingCols?: string[];
  isSingleRoute?: boolean;
  /** DeliveryPoints for backward compatibility with existing exported files. */
  points: DeliveryPoint[];
  meta?: ExportedRouteMeta;
}

export type ParseRouteResult = { ok: true; payload: ExportedRoutePayloadV1 } | { ok: false; error: string };

export type ImportRouteResult = { ok: true; manifestId: string; routeName: string; isStandalone: boolean } | { ok: false; error: string };
