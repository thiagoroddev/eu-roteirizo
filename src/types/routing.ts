/**
 * types/routing.ts - Domain model for the manual route planner ("roteirizador a pé").
 *
 * See docs/rascunhos/fluxo-roteirizacao.md (§2 vocabulary, §3 icons, §6 model)
 * and ADR-002 (local routing). This file defines the *shape* of the data only;
 * geometry/estimate logic lives in src/utils/routing/.
 *
 * Core idea: a DeliveryPoint is a unique LOCATION on the map (one marker), which
 * may carry several packages (multi-package address). Points are grouped into
 * Stops; each Stop has a vehicle stop ("parada do veículo" / anchor): a free
 * point on the street — NOT an address — where the vehicle parks.
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
 * A Stop: a group of nearby DeliveryPoints delivered on foot from the vehicle stop.
 * Rendered as a square marker numbered by `order` (1, 2, 3…).
 */
export interface RouteStop {
  /** Stable id of the stop (independent of order, which can change on reorder). */
  id: string;
  /** 1-based display order along the route (P1, P2…). */
  order: number;
  /**
   * Where the vehicle parks ("parada do veículo" / anchor): a free point on the
   * street, NOT one of the stop's points — projected onto the nearest road edge
   * via map matching by whoever creates/moves the stop (RF-006). The walking
   * circuit leaves from and returns to it, and vehicle legs run between the
   * vehicle stops of consecutive stops. See fluxo §2/§6.
   */
  vehicleStop: LatLng;
  /**
   * Ids of the points in this stop, in walking-visit order: a circuit that
   * leaves from and returns to `vehicleStop`. See fluxo §6 (sweep from the
   * vehicle stop). ALWAYS derived — the order has exactly two inputs, the
   * anchor and `reversed` (decision 17/07: there is no manual reordering).
   */
  pointIds: string[];
  /** Radius (meters) used to suggest candidate points when creating this stop. */
  radiusMeters: number;
  /**
   * Walking SENSE of the circuit (TASK-RF-006.6): absent/false = clockwise (the
   * default sweep), true = counter-clockwise. It is a property of the stop, not
   * an act: re-sweeping (moving/anchoring) preserves it. Optional for backward
   * compatibility — routes saved before it hydrate as clockwise.
   */
  reversed?: boolean;
  /**
   * Whether `vehicleStop` still sits where the app put it — the address nearest
   * to where the vehicle comes from (see utils/routing/vehicleStop.ts). False
   * after the user moves it or makes an address the anchor; true again after a
   * reset. Gates the "Resetar âncora" button, which only makes sense once the
   * anchor left its default (decision 17/07). Absent (older routes) = true: the
   * anchor is the one the app chose back then.
   */
  vehicleStopIsDefault?: boolean;
}

/** User-configurable speeds/times used for the estimates (fluxo §6/§8). */
export interface RoutingConfig {
  /** Walking speed between addresses inside a stop. */
  walkingSpeedKmh: number;
  /** Delivery (handover) time for an address's FIRST package, in seconds
   *  (walk-up + first photo/data entry). RF-007.1. */
  deliveryBaseSeconds: number;
  /** Extra time per ADDITIONAL package at the same address, in seconds
   *  (more photos + Shopee app data). Address time = base + (N−1)×this. RF-007.1. */
  deliveryPerPackageSeconds: number;
  /** Vehicle speed between the vehicle stops of consecutive stops. */
  vehicleSpeedKmh: number;
  /** Default radius (meters) for auto-grouping when creating a stop. */
  autoRadiusMeters: number;
}

/** One walking leg FROM an address to the NEXT one in visit order (RF-006.10) —
 *  the connector shown below the address' ordinal. The last address has none. */
export interface StopLeg {
  /** Street (or straight-line fallback) distance in meters. */
  meters: number;
  /** True when measured over the pedestrian graph; false = straight-line fallback. */
  viaStreets: boolean;
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

/** Sensible defaults for a new route's config. The delivery times are
 *  ⚙️ MANUAL KNOBs — calibrate on the device smoke (RF-007.1). */
export const DEFAULT_ROUTING_CONFIG: RoutingConfig = {
  walkingSpeedKmh: 5,
  deliveryBaseSeconds: 40, // ⚙️ MANUAL KNOB — time for a single-package delivery
  deliveryPerPackageSeconds: 15, // ⚙️ MANUAL KNOB — each extra package (photo + app data)
  vehicleSpeedKmh: 25,
  autoRadiusMeters: 30,
};

/**
 * Fills a possibly-old persisted config with current defaults for any missing
 * field (RF-007.1). Routes saved before RF-007.1 carry the retired
 * `walkingMinutesPerDelivery` and lack the delivery-seconds fields; reading them
 * back through this keeps the math well-defined (no NaN) without a store bump.
 */
export const normalizeRoutingConfig = (raw: Partial<RoutingConfig> | null | undefined): RoutingConfig => ({
  walkingSpeedKmh: raw?.walkingSpeedKmh ?? DEFAULT_ROUTING_CONFIG.walkingSpeedKmh,
  deliveryBaseSeconds: raw?.deliveryBaseSeconds ?? DEFAULT_ROUTING_CONFIG.deliveryBaseSeconds,
  deliveryPerPackageSeconds: raw?.deliveryPerPackageSeconds ?? DEFAULT_ROUTING_CONFIG.deliveryPerPackageSeconds,
  vehicleSpeedKmh: raw?.vehicleSpeedKmh ?? DEFAULT_ROUTING_CONFIG.vehicleSpeedKmh,
  autoRadiusMeters: raw?.autoRadiusMeters ?? DEFAULT_ROUTING_CONFIG.autoRadiusMeters,
});
