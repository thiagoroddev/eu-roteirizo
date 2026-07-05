/**
 * App - route table of the app shell (ADR-003).
 *
 * Two layouts (fluxo §11, rev. 26/06):
 * - AppShell: top-level tabs — HOME (`/`, upload) and Rotas (`/rotas`, saved).
 * - FocusShell: focus screens WITHOUT the bottom nav — the Sumário and map
 *   screens plug their routes under it with TASK-RF-022.
 *
 * The router itself (BrowserRouter) is provided by main.tsx; hosting is
 * Cloudflare Pages with an SPA fallback (public/_redirects) — see ADR-003.
 */

import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell, FocusShell } from "./components/shell/AppShell";
import RouteViewer from "./pages/RouteViewer";
import RoutesPage from "./pages/RoutesPage";
import SummaryPage from "./pages/SummaryPage";

function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<RouteViewer />} />
        <Route path="/rotas" element={<RoutesPage />} />
      </Route>
      {/* Focus screens (no bottom nav — fluxo §11): Sumário; the map screen joins with TASK-RF-022.5. */}
      <Route element={<FocusShell />}>
        <Route path="/sumario" element={<SummaryPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
