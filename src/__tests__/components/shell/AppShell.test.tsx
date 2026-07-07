/**
 * AppShell integration tests (TASK-RF-011): route table + layouts.
 * Renders the real <App /> (route table without the BrowserRouter — that
 * lives in main.tsx) inside a MemoryRouter, so navigation is exercised
 * against the actual route configuration.
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { describe, expect, it } from "vitest";

import App from "../../../App";
import { FocusShell } from "../../../components/shell/AppShell";
import { UI_LABELS } from "../../../constants/uiLabels";

const renderApp = (initialPath = "/") =>
  render(
    <MemoryRouter initialEntries={[initialPath]}>
      <App />
    </MemoryRouter>
  );

describe("AppShell (integration)", () => {
  it("renders the header title, both tabs and the HOME content (uploader)", () => {
    renderApp();

    expect(screen.getByText(UI_LABELS.SHELL.APP_TITLE)).toBeInTheDocument();
    const nav = screen.getByRole("navigation", { name: UI_LABELS.SHELL.NAV_ARIA });
    expect(nav).toBeInTheDocument();
    expect(screen.getByRole("link", { name: new RegExp(UI_LABELS.SHELL.NAV_HOME) })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: new RegExp(UI_LABELS.SHELL.NAV_ROUTES) })).toBeInTheDocument();
    // HOME (`/`) still renders the current viewer flow (no regression).
    expect(screen.getByText(UI_LABELS.FILE_UPLOADER.UPLOAD)).toBeInTheDocument();
  });

  it("navigates to the Rotas tab and shows its stub", () => {
    renderApp();

    fireEvent.click(screen.getByRole("link", { name: new RegExp(UI_LABELS.SHELL.NAV_ROUTES) }));

    expect(screen.getByText(UI_LABELS.ROUTES_PAGE.TITLE)).toBeInTheDocument();
    // Header persists across tabs.
    expect(screen.getByText(UI_LABELS.SHELL.APP_TITLE)).toBeInTheDocument();
  });

  it("redirects unknown paths to HOME", () => {
    renderApp("/nao-existe");

    expect(screen.getByText(UI_LABELS.FILE_UPLOADER.UPLOAD)).toBeInTheDocument();
  });

  it("FocusShell keeps the header but hides the bottom nav (focus screens)", () => {
    render(
      <MemoryRouter initialEntries={["/foco"]}>
        <Routes>
          <Route element={<FocusShell />}>
            <Route path="/foco" element={<div>conteúdo de foco</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("conteúdo de foco")).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.SHELL.APP_TITLE)).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: UI_LABELS.SHELL.NAV_ARIA })).not.toBeInTheDocument();
    // Focus screens carry the header back arrow (RF-38 — TASK-RF-022.4)
    expect(screen.getByRole("button", { name: UI_LABELS.SHELL.BACK_ARIA })).toBeInTheDocument();
  });

  it("FocusShell shows the CURRENT ROUTE in the header title (rev. 07/07)", () => {
    render(
      <MemoryRouter initialEntries={["/foco?romaneio=h1&rota=L-23"]}>
        <Routes>
          <Route element={<FocusShell />}>
            <Route path="/foco" element={<div>conteúdo de foco</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(UI_LABELS.SHELL.APP_TITLE_WITH_ROUTE("L-23"))).toBeInTheDocument();
  });

  it("keeps the settings gear disabled until TASK-RF-007", () => {
    renderApp();

    expect(screen.getByRole("button", { name: UI_LABELS.SHELL.SETTINGS_ARIA })).toBeDisabled();
  });
});
