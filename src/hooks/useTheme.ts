import { useCallback, useEffect, useState } from "react";
import { applyTheme, getStoredMode, storeMode, watchSystemTheme, type ThemeMode } from "../services/themeService";

/** Próximo modo no ciclo do toggle. */
const NEXT: Record<ThemeMode, ThemeMode> = { system: "light", light: "dark", dark: "system" };

/**
 * useTheme - estado do tema (light/dark/system), persistido, aplicando ao <html>
 * e seguindo a preferência do sistema automaticamente enquanto em "system".
 */
export const useTheme = () => {
  const [mode, setModeState] = useState<ThemeMode>(getStoredMode);

  useEffect(() => {
    applyTheme(mode);
    storeMode(mode);
  }, [mode]);

  useEffect(() => {
    if (mode !== "system") return;
    return watchSystemTheme(() => applyTheme("system"));
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => setModeState(next), []);
  const cycle = useCallback(() => setModeState((m) => NEXT[m]), []);

  return { mode, setMode, cycle };
};
