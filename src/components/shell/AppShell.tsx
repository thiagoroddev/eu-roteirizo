import { Outlet, useSearchParams } from "react-router-dom";
import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";
import { UI_LABELS } from "../../constants/uiLabels";

/**
 * AppShell - layout of the top-level screens (HOME, Rotas): header + bottom
 * tabs. The bottom padding keeps content clear of the fixed nav.
 */
export const AppShell = () => (
  <div className="min-h-screen">
    <AppHeader />
    <main className="pb-20">
      <Outlet />
    </main>
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
    <div className="min-h-screen">
      <AppHeader showBack title={routeName ? UI_LABELS.SHELL.APP_TITLE_WITH_ROUTE(routeName) : undefined} />
      <main>
        <Outlet />
      </main>
    </div>
  );
};
