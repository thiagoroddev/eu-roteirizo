import { Outlet, useSearchParams } from "react-router-dom";
import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";
import { UI_LABELS } from "../../constants/uiLabels";

/**
 * Both shells wrap their content in `.app-frame` (TASK-REF-019): on a wide
 * screen the app is a centred column instead of a phone UI stretched across
 * the monitor. The outer element paints the surround, the inner one is the
 * frame itself. Below the frame width it is a no-op, so the phone layout is
 * unchanged. The two elements that leave the flow carry the same class on
 * their own: BottomNav (fixed) and MapPanel (fixed, in a portal).
 */

/**
 * AppShell - layout of the top-level screens (HOME, Rotas): header + bottom
 * tabs. The bottom padding keeps content clear of the fixed nav.
 */
export const AppShell = () => (
  <div className="min-h-screen bg-muted">
    <div className="app-frame min-h-screen bg-background">
      <AppHeader />
      <main className="pb-20">
        <Outlet />
      </main>
    </div>
    <BottomNav />
  </div>
);

/**
 * FocusShell - layout of focus screens (fluxo §11): header only, NO bottom
 * tabs. The Sumário and map screens (TASK-RF-022) mount their routes under
 * this layout so the nav disappears while a route is selected. The header
 * title carries the CURRENT ROUTE from the `rota` query param (rev. 07/07).
 */
export const FocusShell = () => {
  const [searchParams] = useSearchParams();
  const routeName = searchParams.get("rota");
  return (
    <div className="min-h-screen bg-muted">
      <div className="app-frame min-h-screen bg-background">
        <AppHeader showBack title={routeName ? UI_LABELS.SHELL.APP_TITLE_WITH_ROUTE(routeName) : undefined} />
        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
};
