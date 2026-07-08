/**
 * roteiroModels - View-models for the Meu roteiro map mode (TASK-RF-006.2, ADR-009).
 *
 * The pure mirror of `markerModels.ts` for the builder mode: it turns the route
 * domain (`DeliveryPoint`/`RouteStop`, never `StopGroup` — ADR-009 decision A)
 * into the shared render vocabulary (`MarkerModel`), which RouteMap draws via the
 * external `models` prop. No Leaflet/DOM/React.
 *
 * This slice covers spec passo 0 only: every point NOT yet assigned to a stop is
 * a FADED gray circle (color-based fading — ROTEIRO_MARKER_COLORS). Committed
 * stops, the draft and the anchor render in later slices (.4/.5).
 */

import type { DeliveryPoint, RouteStop } from "../../types/routing";
import type { MarkerModel } from "./markerModels";
import { ROTEIRO_MARKER_COLORS } from "./markerColors";
import { unassignedPoints } from "../routing/selectors";
import { escapeHtml } from "../escapeHtml";
import { UI_LABELS } from "../../constants";

const TOOLTIP = UI_LABELS.ROUTE_MAP.TOOLTIP;
const NO_DATA = UI_LABELS.COMMON.NO_DATA;

/**
 * Free points have no owning StopGroup; the click transition never runs for
 * external models (RouteMap doesn't bind click handlers to them — ADR-009),
 * so `stopIndex` carries this sentinel.
 */
export const NO_STOP_INDEX = -1;

/** Hover tooltip of a free point: address + package count. All escaped (spreadsheet data). */
export const buildPointTooltipHtml = (point: DeliveryPoint): string => `
    <div style="font-family: sans-serif; font-size: 13px;">
      <strong>${TOOLTIP.ADDRESS}</strong> ${escapeHtml(point.address || NO_DATA)}<br/>
      <strong>${TOOLTIP.PACKAGES}</strong> ${point.packageCount}
    </div>
  `;

/**
 * Builds the markers of the Meu roteiro mode (spec passo 0): the points not yet
 * assigned to any stop, as faded gray circles. No number (the spreadsheet's
 * numbering doesn't exist in this vocabulary — points earn an ordinal when they
 * join a stop); package badge only when the location has more than one.
 *
 * @param points - All delivery points (buildDeliveryPoints over the rows).
 * @param stops - The committed stops (points inside them are omitted here).
 * @returns One faded circle per free point, keyed by the point's stable id.
 */
export const computeRoteiroMarkerModels = (points: DeliveryPoint[], stops: RouteStop[]): MarkerModel[] =>
  unassignedPoints(points, stops).map((point) => ({
    key: point.id,
    kind: "address",
    lat: point.lat,
    lng: point.lng,
    stopIndex: NO_STOP_INDEX,
    iconProps: {
      shape: "circle",
      color: ROTEIRO_MARKER_COLORS.unassigned,
      number: null,
      badge: point.packageCount > 1 ? { kind: "packages", count: point.packageCount } : null,
    },
    tooltipHtml: buildPointTooltipHtml(point),
  }));
