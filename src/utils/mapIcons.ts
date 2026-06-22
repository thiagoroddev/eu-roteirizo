import L from "leaflet";
import type { IconKey } from "../types";
import { scaleIconConfig } from "./map";
import { ICON_KEYS } from "../constants";

// Image imports
import homeIconImg from "@assets/icons/markers-map/without-correios/marker-home.png";
import officeIconImg from "@assets/icons/markers-map/without-correios/marker-office.png";
import indefiniteIconImg from "@assets/icons/markers-map/without-correios/marker-indefinite.png";
import residencialIconImg from "@assets/icons/markers-map/without-correios/marker-home-processed.png";
import comercialIconImg from "@assets/icons/markers-map/without-correios/marker-office-processed.png";
import shadowIconImg from "@assets/icons/markers-map/without-correios/marker-shadow-40.png";

// With-correios icons
import officeMarkerWithDeliveryCorreios from "@assets/icons/markers-map/with-correios/office/office-correios-delivery.png";
import officeMarkerWithDeliveryCorreiosProcessed from "@assets/icons/markers-map/with-correios/office/office-correios-delivery-processed.png";
import officeMarkerWithoutDeliveryCorreios from "@assets/icons/markers-map/with-correios/office/office-correios-no-delivery.png";
import officeMarkerWithoutDeliveryCorreiosProcessed from "@assets/icons/markers-map/with-correios/office/office-correios-no-delivery-processed.png";
import homeMarkerWithDeliveryCorreios from "@assets/icons/markers-map/with-correios/home/home-correios-delivery.png";
import homeMarkerWithDeliveryCorreiosProcessed from "@assets/icons/markers-map/with-correios/home/home-correios-delivery-processed.png";
import homeMarkerWithoutDeliveryCorreios from "@assets/icons/markers-map/with-correios/home/home-correios-no-delivery.png";
import homeMarkerWithoutDeliveryCorreiosProcessed from "@assets/icons/markers-map/with-correios/home/home-correios-no-delivery-processed.png";
import indefiniteMarkerWithDeliveryCorreios from "@assets/icons/markers-map/with-correios/indefinite/indefinite-correios-delivery.png";
import indefiniteMarkerWithoutDeliveryCorreios from "@assets/icons/markers-map/with-correios/indefinite/indefinite-correios-no-delivery.png";

// Set Leaflet default icons to avoid broken image references
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: indefiniteIconImg,
  iconUrl: indefiniteIconImg,
  shadowUrl: shadowIconImg,
});

function createCustomIcon(iconUrl: string, scaleFactor: number) {
  const config = scaleIconConfig(scaleFactor);
  return new L.Icon({
    iconUrl,
    shadowUrl: shadowIconImg,
    ...config,
  });
}

// Memoized getter: build icons once per scaleFactor and cache the result.
const iconsCache = new Map<number, Record<IconKey, L.Icon>>();

/**
 * Gets scaled Leaflet icons for map markers with memoization.
 * @param scaleFactor - The scale factor for icon sizing
 * @returns A record of icon keys to Leaflet icon objects
 */
export const getIcons = (scaleFactor: number): Record<IconKey, L.Icon> => {
  const key = Number(scaleFactor);
  const cached = iconsCache.get(key);
  if (cached) return cached;

  const icons = {
    [ICON_KEYS.HOME]: createCustomIcon(homeIconImg, scaleFactor),
    [ICON_KEYS.OFFICE]: createCustomIcon(officeIconImg, scaleFactor),
    [ICON_KEYS.HOME_CORRECTED]: createCustomIcon(residencialIconImg, scaleFactor),
    [ICON_KEYS.OFFICE_CORRECTED]: createCustomIcon(comercialIconImg, scaleFactor),
    [ICON_KEYS.INDEFINITE]: createCustomIcon(indefiniteIconImg, scaleFactor),

    [ICON_KEYS.HOME_WITH_DELIVERY]: createCustomIcon(homeMarkerWithDeliveryCorreios, scaleFactor),
    [ICON_KEYS.HOME_WITH_DELIVERY_CORRECTED]: createCustomIcon(homeMarkerWithDeliveryCorreiosProcessed, scaleFactor),
    [ICON_KEYS.HOME_WITHOUT_DELIVERY]: createCustomIcon(homeMarkerWithoutDeliveryCorreios, scaleFactor),
    [ICON_KEYS.HOME_WITHOUT_DELIVERY_CORRECTED]: createCustomIcon(homeMarkerWithoutDeliveryCorreiosProcessed, scaleFactor),

    [ICON_KEYS.OFFICE_WITH_DELIVERY]: createCustomIcon(officeMarkerWithDeliveryCorreios, scaleFactor),
    [ICON_KEYS.OFFICE_WITH_DELIVERY_CORRECTED]: createCustomIcon(officeMarkerWithDeliveryCorreiosProcessed, scaleFactor),
    [ICON_KEYS.OFFICE_WITHOUT_DELIVERY]: createCustomIcon(officeMarkerWithoutDeliveryCorreios, scaleFactor),
    [ICON_KEYS.OFFICE_WITHOUT_DELIVERY_CORRECTED]: createCustomIcon(officeMarkerWithoutDeliveryCorreiosProcessed, scaleFactor),

    [ICON_KEYS.INDEFINITE_WITH_DELIVERY]: createCustomIcon(indefiniteMarkerWithDeliveryCorreios, scaleFactor),
    [ICON_KEYS.INDEFINITE_WITHOUT_DELIVERY]: createCustomIcon(indefiniteMarkerWithoutDeliveryCorreios, scaleFactor),
  } as Record<IconKey, L.Icon>;

  iconsCache.set(key, icons);
  return icons;
};

export default getIcons;
