/**
 * types/routing.ts - Domain model for the manual route planner ("roteirizador a pé").
 *
 * See docs/rascunhos/fluxo-roteirizacao.md (§2 vocabulary, §3 icons, §6 model)
 * and ADR-002 (local routing). This file defines the *shape* of the data only;
 * geometry/estimate logic lives in src/utils/routing/.
 *
 * Core idea: a DeliveryPoint is a unique LOCATION on the map (one marker), which
 * may carry several packages (multi-package address). Points are grouped into
 * Stops; each Stop has an anchor (where the vehicle parks).
 */

import type { RowData } from "./index";

/** A geographic coordinate (decimal degrees). */
export interface LatLng {
  lat: number;
  lng: number;
}

/**
 * One package = one row of the spreadsheet (one SPX tracking number).
 * Several packages can share the same DeliveryPoint (same location).
 */
export interface DeliveryPackage {
  /** Stable id: the SPX tracking number when present, else derived from the point + index. */
  id: string;
  /** Shopee tracking number ("SPX TN"), if available. */
  tracking?: string;
  /** Original spreadsheet row, kept verbatim (single source of truth for extra fields). */
  rawData: RowData;
}

/**
 * A unique delivery LOCATION (one marker on the map). Rows sharing the same
 * coordinate are merged here, so `packageCount` can be > 1 (multi-package address).
 */
export interface DeliveryPoint {
  /** Stable id derived from the location (see utils/routing/points.ts). */
  id: string;
  lat: number;
  lng: number;
  /** Human-readable address (from "Destination Address"); may be empty if absent. */
  address: string;
  /** How many packages are delivered at this location (= packages.length). */
  packageCount: number;
  /** The individual packages at this location. */
  packages: DeliveryPackage[];
}

/**
 * A Stop: a group of nearby DeliveryPoints delivered on foot from an anchor.
 * Rendered as a square marker numbered by `order` (1, 2, 3…).
 */
export interface RouteStop {
  /** Stable id of the stop (independent of order, which can change on reorder). */
  id: string;
  /** 1-based display order along the route (P1, P2…). */
  order: number;
  /** Id of the DeliveryPoint that is the anchor (where the vehicle parks). */
  anchorPointId: string;
  /**
   * Ids of the points in this stop, in walking-visit order (anchor first).
   * The anchor is also the first element. See fluxo §6 (clockwise sweep + manual override).
   */
  pointIds: string[];
  /** Radius (meters) used when this stop auto-grouped nearby points on creation. */
  radiusMeters: number;
}

/** User-configurable speeds/times used for the estimates (fluxo §6/§8). */
export interface RoutingConfig {
  /** Walking speed between addresses inside a stop. */
  walkingSpeedKmh: number;
  /** Fixed time spent per delivery (handover), in minutes. */
  walkingMinutesPerDelivery: number;
  /** Vehicle speed between stop anchors. */
  vehicleSpeedKmh: number;
  /** Default radius (meters) for auto-grouping when creating a stop. */
  autoRadiusMeters: number;
}

/** A planned route: ordered stops over the imported points, plus config. Persisted locally. */
export interface PlannedRoute {
  id: string;
  /** Where the route starts (GPS, map tap, or a point); null until chosen. */
  startPoint: LatLng | null;
  stops: RouteStop[];
  config: RoutingConfig;
  /** ISO timestamp of creation. */
  createdAt: string;
}

/** Sensible defaults for a new route's config. */
export const DEFAULT_ROUTING_CONFIG: RoutingConfig = {
  walkingSpeedKmh: 5,
  walkingMinutesPerDelivery: 1.5,
  vehicleSpeedKmh: 25,
  autoRadiusMeters: 30,
};
