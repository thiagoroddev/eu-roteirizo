/**
 * roteiroModels - View-models for the Meu roteiro map mode (TASK-RF-006.2/.4/.4.1, ADR-009).
 *
 * The pure mirror of `markerModels.ts` for the builder mode: it turns the route
 * domain (`DeliveryPoint`/`RouteStop`, never `StopGroup` — ADR-009 decision A)
 * into the shared render vocabulary (`MarkerModel`), which RouteMap draws via the
 * external `models` prop. No Leaflet/DOM/React.
 *
 * Rendered layers (spec §3/§4, colors revised 08/07 — decision: the mode keeps
 * TYPE colors, in the lighter neon register of ROTEIRO_TYPE_COLORS; the old
 * "pontos cinza desbotados" is superseded):
 * - committed stops: SQUARE in the neon type color ("commercial wins"),
 *   numbered by `order`;
 * - free points: CIRCLES in the neon type color (badge when multi-package) —
 *   visually continuous with the Original, lighter tone tells the mode;
 * - draft members: + white selection ring; draft candidates: + glow (emphasis);
 * - the selected orphan gets the white ring.
 * The vehicle (route start + draft anchor) and the radius circle are OVERLAY
 * business (RouteMap `roteiroOverlay`), not marker models.
 *
 * `pointToStopItemData` adapts a DeliveryPoint to the Original panel's item
 * vocabulary (StopItemData) so the roteiro reuses StopItemRow/StopItemDetail
 * verbatim — one visual language across modes (TASK-RF-006.4.1).
 */

import type { RowData } from "../../types";
import type { DeliveryPoint, RouteStop } from "../../types/routing";
import type { StopDraft } from "../routing/builder";
import type { StopWalkEstimate } from "../routing/estimates";
import type { MarkerModel } from "./markerModels";
import type { StopItemData, PackageRowData } from "./panelModels";
import { roteiroColorForLocationType } from "./markerColors";
import { dominantType } from "./stopGrouping";
import { extractRowComplement, locationTypeLabel } from "./markerModels";
import { resolveLocationType } from "../inferLocationType";
import { indexPointsById, unassignedPoints } from "../routing/selectors";
import { escapeHtml } from "../escapeHtml";
import { formatMeters } from "../formatters";
import { COLUMN_NAMES, ICON_KEYS, UI_LABELS } from "../../constants";

const TOOLTIP = UI_LABELS.ROUTE_MAP.TOOLTIP;
const NO_DATA = UI_LABELS.COMMON.NO_DATA;
const NO_COMPLEMENT = UI_LABELS.ROUTE_MAP.ADDRESS_SHEET.NO_COMPLEMENT;

/**
 * Free points have no owning StopGroup; the click transition never runs for
 * external models (their taps go through `onModelTap` — ADR-009), so
 * `stopIndex` carries this sentinel.
 */
export const NO_STOP_INDEX = -1;

/** Hover tooltip of a free point: address + package count. All escaped (spreadsheet data). */
export const buildPointTooltipHtml = (point: DeliveryPoint): string => `
    <div style="font-family: sans-serif; font-size: 13px;">
      <strong>${TOOLTIP.ADDRESS}</strong> ${escapeHtml(point.address || NO_DATA)}<br/>
      <strong>${TOOLTIP.PACKAGES}</strong> ${point.packageCount}
    </div>
  `;

/** The point's rows (one per package) — the type/label source of truth. */
const pointRows = (point: DeliveryPoint): RowData[] => point.packages.map((pkg) => pkg.rawData);

/** A point's canonical type: "commercial wins" across its packages (decision 26/06). */
export const pointDominantType = (point: DeliveryPoint): string => dominantType(pointRows(point));

/** Optional draft/selection context (TASK-RF-006.4/.4.2 — telas 8/9). */
export interface RoteiroModelOptions {
  /** The open stop draft; members get the ring + walking ORDINAL ("1º", "2º"…). */
  draft?: StopDraft | null;
  /** Ids inside the (draft OR preview) radius, not chosen — dashed ring + glow. */
  candidateIds?: readonly string[];
  /** The selected orphan (tela 8); gets the white ring. */
  selectedPointId?: string | null;
  /** The selected committed stop; its square gets the white ring (RF-006.4.2). */
  selectedStopId?: string | null;
}

/** Committed-stop color: dominant type over ALL its points' rows, neon register. */
const stopColor = (stop: RouteStop, pointsById: Map<string, DeliveryPoint>) =>
  roteiroColorForLocationType(dominantType(stop.pointIds.flatMap((id) => (pointsById.get(id) ? pointRows(pointsById.get(id)!) : []))));

/**
 * Builds the markers of the Meu roteiro mode.
 *
 * @param points - All delivery points (buildDeliveryPoints over the rows).
 * @param stops - The committed stops (drawn as ordered squares at their anchors).
 * @param opts - Draft/candidate/selection context (absent = plain free points).
 * @returns The marker models, keyed by stable ids (`stop.id` / `point.id`).
 */
export const computeRoteiroMarkerModels = (points: DeliveryPoint[], stops: RouteStop[], opts: RoteiroModelOptions = {}): MarkerModel[] => {
  const pointsById = indexPointsById(points);
  const draft = opts.draft ?? null;
  const candidateIds = new Set(opts.candidateIds ?? []);
  const models: MarkerModel[] = [];

  // Committed stops: one SQUARE at the vehicle stop, numbered by order — the
  // stop's own numbering, OUTSIDE the ordinal rule (decision 08/07). Selected
  // stop gets the white ring (RF-006.4.2). Expanding into addresses is .6.
  for (const stop of stops) {
    const packageTotal = stop.pointIds.reduce((sum, id) => sum + (pointsById.get(id)?.packageCount ?? 0), 0);
    const representative = pointsById.get(stop.pointIds[0]);
    models.push({
      key: stop.id,
      kind: "stop",
      lat: stop.vehicleStop.lat,
      lng: stop.vehicleStop.lng,
      stopIndex: NO_STOP_INDEX,
      iconProps: {
        shape: "square",
        color: stopColor(stop, pointsById),
        number: stop.order,
        badge: stop.pointIds.length > 1 ? { kind: "addresses", count: stop.pointIds.length } : packageTotal > 1 ? { kind: "packages", count: packageTotal } : null,
        selected: opts.selectedStopId === stop.id,
      },
      tooltipHtml: representative ? buildPointTooltipHtml(representative) : undefined,
    });
  }

  // Free points: neon TYPE colors, EMPTY (no number — decision 08/07: free
  // addresses carry nothing; they earn the walking ORDINAL when they join a
  // stop). Draft members: ring + "1º/2º…"; candidates: DASHED ring + glow.
  for (const point of unassignedPoints(points, stops)) {
    const memberIndex = draft?.pointIds.indexOf(point.id) ?? -1;
    const isMember = memberIndex >= 0;
    const isCandidate = !isMember && candidateIds.has(point.id);
    const isSelected = !draft && opts.selectedPointId === point.id;
    models.push({
      key: point.id,
      kind: "address",
      lat: point.lat,
      lng: point.lng,
      stopIndex: NO_STOP_INDEX,
      iconProps: {
        shape: "circle",
        color: roteiroColorForLocationType(pointDominantType(point)),
        number: isMember ? UI_LABELS.MAP_PANEL.ORDINAL(memberIndex + 1) : null,
        badge: point.packageCount > 1 ? { kind: "packages", count: point.packageCount } : null,
        selected: isMember || isCandidate || isSelected,
        ringStyle: isCandidate ? "dashed" : "solid",
        emphasis: isCandidate,
      },
      tooltipHtml: buildPointTooltipHtml(point),
    });
  }

  return models;
};

/* --------------------- pure helpers (TASK-RF-006.4.2) --------------------- */

/** Street + number: the first two comma terms of the raw address (display rule). */
export const addressLineOf = (address: string): string => {
  const parts = address
    .split(",")
    .map((part) => part.trim())
    .filter((part) => part !== "");
  return parts.length > 0 ? parts.slice(0, 2).join(", ") : NO_DATA;
};

/**
 * Place info for a committed stop's summary (mirror of the Original's
 * stopPlaceSummary, over the route domain): unique neighborhoods/zipcodes
 * across the points' rows, in visit order.
 */
export const stopPlaceSummaryFromPoints = (points: DeliveryPoint[]): { neighborhoods: string[]; zipcodes: string[] } => {
  const neighborhoods: string[] = [];
  const zipcodes: string[] = [];
  for (const point of points) {
    for (const row of pointRows(point)) {
      const neighborhood = String(row[COLUMN_NAMES.NEIGHBORHOOD] ?? "").trim();
      const zipcode = String(row[COLUMN_NAMES.ZIPCODE] ?? "").trim();
      if (neighborhood && !neighborhoods.includes(neighborhood)) neighborhoods.push(neighborhood);
      if (zipcode && !zipcodes.includes(zipcode)) zipcodes.push(zipcode);
    }
  }
  return { neighborhoods, zipcodes };
};

/**
 * Package counts per inferred type, over the route domain (RF-006.4.3) — the
 * mirror of the Original's `panelMetrics.packagesByType`, so the roteiro's stop
 * summaries build the SAME typed chips ("Residencial: 1 pacote" …).
 */
export const packagesByTypeFromPoints = (points: DeliveryPoint[]): { commercial: number; residential: number; indefinite: number } => {
  const packagesByType = { commercial: 0, residential: 0, indefinite: 0 };
  for (const point of points) {
    for (const row of pointRows(point)) {
      const type = resolveLocationType(row);
      if (type === ICON_KEYS.OFFICE || type === ICON_KEYS.OFFICE_CORRECTED) packagesByType.commercial += 1;
      else if (type === ICON_KEYS.HOME || type === ICON_KEYS.HOME_CORRECTED) packagesByType.residential += 1;
      else packagesByType.indefinite += 1;
    }
  }
  return packagesByType;
};

/** Below this, showing meters undermines trust ("3 m a pé") — time only. */
export const WALK_ESTIMATE_MIN_METERS = 20;

/** "~12 min · 850 m a pé", or time-only for negligible circuits (RF-006.4.2). */
export const walkEstimateLabel = (estimate: StopWalkEstimate): string =>
  estimate.meters < WALK_ESTIMATE_MIN_METERS
    ? UI_LABELS.MAP_PANEL.ROTEIRO_DRAFT.ESTIMATE_TIME_ONLY(estimate.minutes)
    : UI_LABELS.MAP_PANEL.ROTEIRO_DRAFT.ESTIMATE(estimate.minutes, formatMeters(estimate.meters));

/** The stop's points in WALKING order (pointIds preserve the committed sweep). */
export const orderedStopPoints = (stop: RouteStop, pointsById: Map<string, DeliveryPoint>): DeliveryPoint[] =>
  stop.pointIds.map((id) => pointsById.get(id)).filter((p): p is DeliveryPoint => p !== undefined);

/* ----------------- Original-panel adapter (TASK-RF-006.4.1) ----------------- */

/** One package line, in the Original panel's vocabulary (PackageRowData). */
const packageRow = (row: RowData): PackageRowData => {
  const type = resolveLocationType(row);
  const stop = row[COLUMN_NAMES.STOP];
  return {
    label: UI_LABELS.MAP_PANEL.ITEM.PACKAGE_LABEL(stop !== undefined && stop !== null && stop !== "" ? String(stop) : null, String(row[COLUMN_NAMES.SEQUENCE] || NO_DATA)),
    complement: extractRowComplement(row),
    spxTn: String(row[COLUMN_NAMES.SPX_TN] || NO_DATA),
    type,
    typeLabel: locationTypeLabel(type),
  };
};

/**
 * Adapts a DeliveryPoint to the Original panel's StopItemData, so the roteiro's
 * "Endereço selecionado" section renders through the SAME StopItemRow/
 * StopItemDetail as the Original — one visual language across modes. Same
 * display rules: address = first two comma terms; the address-level complement
 * only when the point has a single package (otherwise per-package). The mini
 * marker carries NO Sequence (decision 08/07): empty for a free point, or the
 * walking ORDINAL ("1º") when the point belongs to a stop.
 */
export const pointToStopItemData = (point: DeliveryPoint, opts: { ordinal?: number | null } = {}): StopItemData => {
  const rows = pointRows(point);
  return {
    addressKey: point.id,
    markerNumber: opts.ordinal != null ? UI_LABELS.MAP_PANEL.ORDINAL(opts.ordinal) : "",
    markerType: pointDominantType(point),
    addressLine: addressLineOf(point.address),
    complement: point.packageCount === 1 ? extractRowComplement(rows[0] ?? {}) || NO_COMPLEMENT : NO_COMPLEMENT,
    packageCount: point.packageCount,
    packages: rows.map((row) => packageRow(row)),
    mapsUrl: `https://www.google.com/maps?q=${point.lat},${point.lng}`,
  };
};
