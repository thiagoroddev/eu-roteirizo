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
import type { DeliveryPoint, LatLng, RouteStop, StopLeg } from "../../types/routing";
import type { RoadGraph } from "../routing/graph";
import { nearestWayName } from "../routing/match";
import type { StopDraft } from "../routing/builder";
import type { StopWalkEstimate } from "../routing/estimates";
import type { MarkerModel } from "./markerModels";
import type { StopItemData, PackageRowData } from "./panelModels";
import type { MarkerColor } from "./markerSvg";
import { roteiroColorForLocationType } from "./markerColors";
import { dominantType } from "./stopGrouping";
import { extractRowComplement, locationTypeLabel } from "./markerModels";
import { resolveLocationType } from "../inferLocationType";
import { indexPointsById, unassignedPoints } from "../routing/selectors";
import { haversine } from "../routing/geo";
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
  /** A firmed stop to render UNGROUPED (RF-006.4.8): its addresses show as
      individual circles numbered by visit order, instead of the one square. */
  expandedStopId?: string | null;
  /** The selected member of the expanded stop (RF-006.4.16) — it gets the
      highlight; null falls back to the anchor (1st member). */
  selectedMemberId?: string | null;
  /** The free point selected DURING the edit draft (RF-006.4.23): tapping only
      selects — the panel's "Adicionar a esta parada" is what edits. Separate
      from `selectedPointId`, whose chrome is suppressed while drafting. */
  draftSelectedPointId?: string | null;
}

/**
 * Committed-stop color:
 * - Se contiver entrega comercial: mantém azul (commercial).
 * - Caso contrário: tipo dominante sobre todas as linhas dos seus pontos.
 */
export const stopColor = (stop: RouteStop, pointsById: Map<string, DeliveryPoint>): MarkerColor => {
  const rows = stop.pointIds.flatMap((id) => (pointsById.get(id) ? pointRows(pointsById.get(id)!) : []));
  let hasCommercial = false;
  for (const row of rows) {
    const type = resolveLocationType(row);
    if (type === ICON_KEYS.OFFICE || type === ICON_KEYS.OFFICE_CORRECTED) {
      hasCommercial = true;
      break;
    }
  }
  if (hasCommercial) {
    return roteiroColorForLocationType(ICON_KEYS.OFFICE);
  }
  return roteiroColorForLocationType(dominantType(rows));
};

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

  /** The stop being EDITED (RF-006.4.9): its square is skipped and its members
      render as draft circles (ungrouped), so editing never shows the group. */
  const draftStopId = draft?.stopId ?? null;
  /** Points committed to a stop OTHER than the one being edited — their squares
      handle them; they must stay out of the circle loop below. */
  const otherCommittedIds = new Set<string>();
  for (const stop of stops) {
    if (stop.id === draftStopId) continue;
    for (const id of stop.pointIds) otherCommittedIds.add(id);
  }

  // Committed stops: one SQUARE at the vehicle stop, numbered by order — the
  // stop's own numbering, OUTSIDE the ordinal rule (decision 08/07). Selected
  // stop gets the white ring (RF-006.4.2). The EXPANDED stop (RF-006.4.8) and
  // the stop being EDITED (RF-006.4.9) are drawn ungrouped instead.
  for (const stop of stops) {
    if (stop.id === draftStopId) continue; // its members render as draft circles below
    if (stop.id === opts.expandedStopId) {
      orderedStopPoints(stop, pointsById).forEach((point, index) => {
        // The SELECTED member is highlighted (RF-006.4.16); with none chosen the
        // anchor (1st member = panel's "Endereço selecionado") is (RF-006.4.15).
        const isHighlighted = opts.selectedMemberId ? point.id === opts.selectedMemberId : index === 0;
        models.push({
          key: point.id,
          kind: "address",
          lat: point.lat,
          lng: point.lng,
          stopIndex: NO_STOP_INDEX,
          iconProps: {
            shape: "circle",
            color: roteiroColorForLocationType(pointDominantType(point)),
            number: UI_LABELS.MAP_PANEL.ORDINAL(index + 1),
            badge: point.packageCount > 1 ? { kind: "packages", count: point.packageCount } : null,
            selected: true,
            emphasis: isHighlighted,
            highlight: isHighlighted,
          },
          tooltipHtml: buildPointTooltipHtml(point),
        });
      });
      continue;
    }
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
        number: `P${stop.order}`,
        badge: stop.pointIds.length > 1 ? { kind: "addresses", count: stop.pointIds.length } : packageTotal > 1 ? { kind: "packages", count: packageTotal } : null,
        // The selected stop stands out (ring + glow + enlarge/raise — RF-006.4.14).
        selected: opts.selectedStopId === stop.id,
        emphasis: opts.selectedStopId === stop.id,
        highlight: opts.selectedStopId === stop.id,
      },
      tooltipHtml: representative ? buildPointTooltipHtml(representative) : undefined,
    });
  }

  // Free points: neon TYPE colors, EMPTY (no number — decision 08/07: free
  // addresses carry nothing; they earn the walking ORDINAL when they join a
  // stop). Draft members: ring + "1º/2º…"; candidates: DASHED ring + glow.
  // During an EDIT (RF-006.4.9) the source also includes the edited stop's own
  // points (they're not in ANOTHER stop), so its members/candidates draw here.
  const circleSource = draft ? points.filter((point) => !otherCommittedIds.has(point.id)) : unassignedPoints(points, stops);
  for (const point of circleSource) {
    const memberIndex = draft?.pointIds.indexOf(point.id) ?? -1;
    const isMember = memberIndex >= 0;
    const isCandidate = !isMember && candidateIds.has(point.id);
    // The draft-time pick (RF-006.4.23) OR a tapped MEMBER (RF-006.19): both
    // highlight the point. Outside a draft it's the free orphan (tela 8).
    const isSelected = draft ? opts.draftSelectedPointId === point.id : opts.selectedPointId === point.id;
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
        // Candidates glow; the SELECTED orphan glows AND is enlarged/raised so it
        // stands out over the start and the rest (RF-006.4.14).
        emphasis: isCandidate || isSelected,
        highlight: isSelected,
      },
      // No tooltip while drafting (RF-006.4.23): on touch it was the only thing
      // a tap produced — a balloon over a map that "did nothing". The tap now
      // selects, and the panel is where the address's info lives.
      tooltipHtml: draft ? undefined : buildPointTooltipHtml(point),
    });
  }

  return models;
};

/* --------------------- pure helpers (TASK-RF-006.4.2) --------------------- */

/**
 * Google Maps DIRECTIONS URL to a coordinate (TASK-RF-006.9): the vehicle
 * anchor's "how do I get there", vs the delivery points' `?q=` pin. Built from
 * the coordinate itself — no geocoding, no external call (RNF-03/13).
 *
 * @param p - The destination coordinate (e.g. the vehicle anchor).
 * @returns A Google Maps directions URL.
 */
export const mapsDirectionsUrl = (p: LatLng): string => `https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`;

/**
 * Normaliza o nome de uma via/logradouro para comparação de equivalência.
 * Remove acentos, caracteres não-alfanuméricos e prefixos comuns brasileiros.
 */
export const normalizeStreetName = (name: string): string => {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\./g, " ")
    .replace(/\b(rua|r|avenida|av|travessa|tv|alameda|al|praca|praça|pc|estrada|est|rodovia|rod|via|beco|largo)\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
};

export const isSameStreetName = (streetA: string, streetB: string): boolean => {
  const normA = normalizeStreetName(streetA);
  const normB = normalizeStreetName(streetB);
  if (!normA || !normB) return true;
  return normA === normB || normA.includes(normB) || normB.includes(normA);
};

export interface FormattedVehicleStopAddress {
  /** Linha 1 do endereço do veículo com distância (ex: "Rua tal, 23" ou "Próximo à Rua tal, 23 (13m)") */
  streetLine: string;
  /** Linha 1 base sem o sufixo de distância (ex: "Próximo à Rua tal, 23") */
  baseStreetLine: string;
  /** Sufixo de distância textual (ex: "(13m)" ou "") */
  distLabel: string;
  /** Linha 2 do endereço do veículo (ex: "Lagoa, 22290-000") */
  placeLine: string;
  /** Distância em metros do veículo à primeira entrega (co-âncora) */
  distanceMeters: number;
  /** Se o veículo está na mesma rua da primeira entrega */
  isSameStreet: boolean;
  /** Se o veículo foi editado/afastado */
  isEdited: boolean;
  /** Logradouro da primeira entrega */
  deliveryStreet: string;
  /** Número da primeira entrega */
  deliveryNumber: string;
  /** Título completo para uso textual / listas / compatibilidade */
  fullTitle: string;
}

export const formatVehicleStopAddress = (stop: RouteStop, pointsById: Map<string, DeliveryPoint>, graph?: RoadGraph | null): FormattedVehicleStopAddress => {
  const coAnchor = pointsById.get(stop.pointIds[0]);
  if (!coAnchor) {
    return {
      streetLine: `P${stop.order}`,
      baseStreetLine: `P${stop.order}`,
      distLabel: "",
      placeLine: "",
      distanceMeters: 0,
      isSameStreet: true,
      isEdited: false,
      deliveryStreet: "",
      deliveryNumber: "",
      fullTitle: `P${stop.order}`,
    };
  }

  const parts = (coAnchor.address || "")
    .split(",")
    .map((p) => p.trim())
    .filter((p) => p !== "");
  const deliveryStreet = parts[0] ?? "";
  const deliveryNumber = parts[1]?.split("-")[0]?.trim() ?? "";

  const distanceMeters = Math.round(haversine(stop.vehicleStop, { lat: coAnchor.lat, lng: coAnchor.lng }));
  const isDefault = stop.vehicleStopIsDefault !== false;
  const isEdited = !isDefault && distanceMeters >= 5;

  let isSame = true;
  if (graph && stop.vehicleStop) {
    const way = nearestWayName(graph, stop.vehicleStop);
    if (way) {
      isSame = isSameStreetName(deliveryStreet, way);
    }
  }

  const distLabel = isEdited ? `(${distanceMeters}m)` : "";
  let baseStreetLine = deliveryStreet;

  if (!isEdited && isSame) {
    baseStreetLine = deliveryNumber ? `${deliveryStreet}, ${deliveryNumber}` : deliveryStreet;
  } else if (isSame) {
    baseStreetLine = deliveryNumber ? `${deliveryStreet}, próximo ao número ${deliveryNumber}` : `${deliveryStreet}, próximo`;
  } else {
    baseStreetLine = deliveryNumber ? `Próximo à ${deliveryStreet}, ${deliveryNumber}` : `Próximo à ${deliveryStreet}`;
  }

  const streetLine = distLabel ? `${baseStreetLine} ${distLabel}` : baseStreetLine;

  const neighborhood = String(coAnchor.packages[0]?.rawData?.[COLUMN_NAMES.NEIGHBORHOOD] ?? "").trim();
  const zipcode = String(coAnchor.packages[0]?.rawData?.[COLUMN_NAMES.ZIPCODE] ?? "").trim();
  const placeLine = [neighborhood, zipcode].filter(Boolean).join(", ");

  const fullAddress = [streetLine, neighborhood].filter(Boolean).join(", ");
  const fullTitle = fullAddress ? `P${stop.order} - ${fullAddress}` : `P${stop.order}`;

  return {
    streetLine,
    baseStreetLine,
    distLabel,
    placeLine,
    distanceMeters,
    isSameStreet: isSame,
    isEdited,
    deliveryStreet,
    deliveryNumber,
    fullTitle,
  };
};

/**
 * Formata o título da parada do Meu Roteiro (RF-53 / TASK-RF-038).
 *
 * Herda o endereço completo da primeira entrega (co-âncora).
 * - Padrão: "P{N} - {Rua}, {Número}, {Bairro}"
 * - Editado na mesma rua: "P{N} - {Rua}, próximo ao número {Número} ({dist}m), {Bairro}"
 * - Editado em outra rua: "P{N} - Próximo à {Rua}, {Número} ({dist}m), {Bairro}"
 */
export const formatRoteiroStopTitle = (stop: RouteStop, pointsById: Map<string, DeliveryPoint>, graph?: RoadGraph | null): string => {
  return formatVehicleStopAddress(stop, pointsById, graph).fullTitle;
};

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

/**
 * Label of one walking leg to the next address (RF-006.10): "110 metros" (the
 * walking icon is the component's job), with the honest "(linha reta)" suffix
 * while there is no graph.
 */
export const legLabel = (leg: StopLeg): string => {
  const distance = UI_LABELS.MAP_PANEL.LEG_METERS(Math.round(leg.meters));
  return leg.viaStreets ? distance : `${distance} ${UI_LABELS.MAP_PANEL.ROTEIRO_START.SUGGESTION_STRAIGHT}`;
};

/** "~12 min · 850 m a pé", or time-only for negligible circuits (RF-006.4.2).
 *  Needs only the totals (meters + combined minutes), not the RF-007.1 split. */
export const walkEstimateLabel = (estimate: Pick<StopWalkEstimate, "meters" | "minutes">): string =>
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
export const pointToStopItemData = (point: DeliveryPoint, opts: { ordinal?: number | null; leg?: StopLeg | null } = {}): StopItemData => {
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
    leg: opts.leg ?? null,
  };
};
