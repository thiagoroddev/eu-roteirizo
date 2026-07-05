import { Outlet } from "react-router-dom";
import { AppHeader } from "./AppHeader";
import { BottomNav } from "./BottomNav";

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
 * this layout so the nav disappears while a route is selected.
 */
export const FocusShell = () => (
  <div className="min-h-screen">
    <AppHeader showBack />
    <main>
      <Outlet />
    </main>
  </div>
);
