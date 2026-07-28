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

  /**
   * TASK-REF-019: on a wide screen the app is a centred column of fixed max
   * width. The contract is ONE class shared by every full-bleed piece of
   * chrome: the bottom nav is `fixed`, so it does not inherit the wrapper's
   * width and has to carry the class itself.
   */
  it("enquadra conteúdo e bottom-nav na mesma coluna centralizada (REF-019)", () => {
    const { container } = renderApp();

    const frame = container.querySelector(".app-frame");
    expect(frame).not.toBeNull();
    expect(frame).toContainElement(screen.getByText(UI_LABELS.SHELL.APP_TITLE));
    expect(screen.getByRole("navigation", { name: UI_LABELS.SHELL.NAV_ARIA })).toHaveClass("app-frame");
  });

  it("FocusShell usa o mesmo enquadramento das telas com abas (REF-019)", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/foco"]}>
        <Routes>
          <Route element={<FocusShell />}>
            <Route path="/foco" element={<div>conteúdo de foco</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(container.querySelector(".app-frame")).toContainElement(screen.getByText("conteúdo de foco"));
  });

  it("abre as Configurações de entrega pelo ⚙️ (RF-007.2)", () => {
    renderApp();

    const gear = screen.getByRole("button", { name: UI_LABELS.SHELL.SETTINGS_ARIA });
    expect(gear).not.toBeDisabled();
    fireEvent.click(gear);
    expect(screen.getByText(UI_LABELS.DELIVERY_SETTINGS.TITLE)).toBeInTheDocument();
    expect(screen.getByLabelText(UI_LABELS.DELIVERY_SETTINGS.BASE_LABEL)).toBeInTheDocument();
    expect(screen.getByLabelText(UI_LABELS.DELIVERY_SETTINGS.PER_PACKAGE_LABEL)).toBeInTheDocument();
  });
});
