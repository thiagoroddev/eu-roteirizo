/**
 * DeliverySettingsContext - shares the GLOBAL delivery-time preference (RF-007.2)
 * between the settings gear (AppHeader) and the estimate consumers (MapPage,
 * SummaryPage), which live far apart in the tree. Backed by localStorage
 * (deliverySettings service). The context has a DEFAULT value so components used
 * without the provider (e.g. in isolation tests) still get the code defaults.
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { DEFAULT_DELIVERY_SETTINGS, loadDeliverySettings, saveDeliverySettings, type DeliverySettings } from "../services/deliverySettings";

interface DeliverySettingsContextValue {
  settings: DeliverySettings;
  updateSettings: (settings: DeliverySettings) => void;
}

const DeliverySettingsContext = createContext<DeliverySettingsContextValue>({
  settings: DEFAULT_DELIVERY_SETTINGS,
  updateSettings: () => {},
});

export const DeliverySettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<DeliverySettings>(loadDeliverySettings);
  const updateSettings = useCallback((next: DeliverySettings) => {
    setSettings(next);
    saveDeliverySettings(next);
  }, []);
  const value = useMemo(() => ({ settings, updateSettings }), [settings, updateSettings]);
  return <DeliverySettingsContext.Provider value={value}>{children}</DeliverySettingsContext.Provider>;
};

// Provider + hook share the same file (common context pattern); the hook export
// trips react-refresh's components-only rule, harmless here.
// eslint-disable-next-line react-refresh/only-export-components
export const useDeliverySettings = (): DeliverySettingsContextValue => useContext(DeliverySettingsContext);
