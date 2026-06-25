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
  } as Record<IconKey, L.Icon>;

  iconsCache.set(key, icons);
  return icons;
};

export default getIcons;
