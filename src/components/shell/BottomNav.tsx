import { NavLink } from "react-router-dom";
import { House, Route as RouteIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { UI_LABELS } from "../../constants/uiLabels";

/**
 * BottomNav - the two top-level tabs (fluxo §11, rev. 26/06): HOME (upload)
 * and Rotas (saved manifests/routes). Tabs navigate with `replace` so the
 * Android back button exits the app from a top-level screen instead of
 * walking the tab history (predictable TWA behavior). Focus screens
 * (Sumário/map) render without this bar — see FocusShell.
 */
const TABS = [
  { to: "/", label: UI_LABELS.SHELL.NAV_HOME, icon: House, end: true },
  { to: "/rotas", label: UI_LABELS.SHELL.NAV_ROUTES, icon: RouteIcon, end: false },
];

export const BottomNav = () => (
  <nav aria-label={UI_LABELS.SHELL.NAV_ARIA} className="fixed inset-x-0 bottom-0 z-40 flex h-16 border-t border-input bg-background">
    {TABS.map(({ to, label, icon: Icon, end }) => (
      <NavLink
        key={to}
        to={to}
        end={end}
        replace
        className={({ isActive }) => cn("flex flex-1 flex-col items-center justify-center gap-1 text-xs", isActive ? "font-semibold text-primary" : "text-muted-foreground")}
      >
        <Icon className="h-5 w-5" aria-hidden />
        {label}
      </NavLink>
    ))}
  </nav>
);
