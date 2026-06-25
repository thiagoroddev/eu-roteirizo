/**
 * themeService - isola persistência (localStorage) e aplicação do tema no DOM.
 * Componentes/hooks NÃO tocam localStorage direto (convenção: storage em services/).
 *
 * O tema é aplicado via atributo `data-theme="light" | "dark"` no <html>, que casa
 * com o seletor do Tailwind (`darkMode: ["class", '[data-theme="dark"]']`).
 * O 1º paint já vem correto por um script inline no index.html (anti-flash).
 *
 * Todo acesso a `localStorage`/`matchMedia` é defensivo (modo privado, jsdom,
 * indisponibilidade) — falha vira fallback seguro, nunca exceção.
 */
export type ThemeMode = "light" | "dark" | "system";

const STORAGE_KEY = "theme";
const DARK_QUERY = "(prefers-color-scheme: dark)";

/** O sistema operacional prefere tema escuro? */
export const systemPrefersDark = (): boolean => {
  try {
    return window.matchMedia(DARK_QUERY).matches;
  } catch {
    return false;
  }
};

/** Resolve o modo escolhido para um tema concreto (claro/escuro). */
export const resolveTheme = (mode: ThemeMode): "light" | "dark" => (mode === "system" ? (systemPrefersDark() ? "dark" : "light") : mode);

/** Lê o modo salvo; default "system" (automático). */
export const getStoredMode = (): ThemeMode => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" || value === "system" ? value : "system";
  } catch {
    return "system";
  }
};

export const storeMode = (mode: ThemeMode): void => {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* indisponível (modo privado, etc.) — ignora */
  }
};

/** Aplica o tema resolvido no <html>. */
export const applyTheme = (mode: ThemeMode): void => {
  document.documentElement.setAttribute("data-theme", resolveTheme(mode));
};

/** Observa mudanças da preferência do sistema; retorna o "unsubscribe". */
export const watchSystemTheme = (onChange: () => void): (() => void) => {
  try {
    const mq = window.matchMedia(DARK_QUERY);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  } catch {
    return () => {};
  }
};
