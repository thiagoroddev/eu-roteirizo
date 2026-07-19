/**
 * services/deliverySettings.ts - Global (per-user) delivery-time preference
 * (RF-007.2). Only the delivery BASE time and the PER-PACKAGE extra are the
 * user's to set; walking/vehicle speeds stay code defaults. Stored once
 * (localStorage) and applied to EVERY route's config as its delivery fields —
 * the driver's pace is the same across routes.
 *
 * Mirrors themeService: all localStorage access is defensive (private mode,
 * jsdom) — a failure degrades to the code defaults, never throws.
 */

import { DEFAULT_ROUTING_CONFIG, type RoutingConfig } from "../types/routing";

/** The two user-configurable delivery fields (subset of RoutingConfig). */
export type DeliverySettings = Pick<RoutingConfig, "deliveryBaseSeconds" | "deliveryPerPackageSeconds">;

const STORAGE_KEY = "deliverySettings";

/** Code defaults (⚙️ MANUAL KNOB lives in DEFAULT_ROUTING_CONFIG). */
export const DEFAULT_DELIVERY_SETTINGS: DeliverySettings = {
  deliveryBaseSeconds: DEFAULT_ROUTING_CONFIG.deliveryBaseSeconds,
  deliveryPerPackageSeconds: DEFAULT_ROUTING_CONFIG.deliveryPerPackageSeconds,
};

/** Reads the saved preference; missing/invalid fields fall back to the defaults. */
export const loadDeliverySettings = (): DeliverySettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_DELIVERY_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<DeliverySettings>;
    return {
      deliveryBaseSeconds: typeof parsed.deliveryBaseSeconds === "number" ? parsed.deliveryBaseSeconds : DEFAULT_DELIVERY_SETTINGS.deliveryBaseSeconds,
      deliveryPerPackageSeconds: typeof parsed.deliveryPerPackageSeconds === "number" ? parsed.deliveryPerPackageSeconds : DEFAULT_DELIVERY_SETTINGS.deliveryPerPackageSeconds,
    };
  } catch {
    return DEFAULT_DELIVERY_SETTINGS;
  }
};

/** Persists the preference (best-effort). */
export const saveDeliverySettings = (settings: DeliverySettings): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    /* indisponível (modo privado, etc.) — ignora */
  }
};
