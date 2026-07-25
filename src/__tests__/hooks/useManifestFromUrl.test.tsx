/**
 * Tests for useManifestFromUrl (TASK-REF-011) — the shared focus-screen hook:
 * URL params + load-once guard + current-route rows derivation.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, useNavigate } from "react-router-dom";
import type { RowData } from "../../types";

const uploaderState = {
  routes: null as Record<string, RowData[]> | null,
  loading: false,
  error: null as string | null,
  manifestSave: null,
  availableCols: null as string[] | null,
  missingCols: [] as string[],
  isSingleRoute: false,
  handleFileUpload: vi.fn(),
  loadManifest: vi.fn().mockResolvedValue(true),
};
vi.mock("../../hooks/useRouteUploader", () => ({ useRouteUploader: () => uploaderState }));

import { useManifestFromUrl } from "../../hooks/useManifestFromUrl";

/** Probe component exposing the hook's derived values. */
const Probe = () => {
  const { manifestId, routeName, currentRows } = useManifestFromUrl();
  return <div data-testid="probe">{`${manifestId}|${routeName}|${currentRows.length}`}</div>;
};

/** In-place navigation button — changes the URL WITHOUT remounting the router. */
const NavTo = ({ to }: { to: string }) => {
  const navigate = useNavigate();
  return (
    <button type="button" onClick={() => navigate(to)}>
      go
    </button>
  );
};

const renderProbe = (url: string) =>
  render(
    <MemoryRouter initialEntries={[url]}>
      <Probe />
    </MemoryRouter>
  );

describe("useManifestFromUrl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    uploaderState.routes = { "A-1": [{}, {}] as RowData[] };
  });

  it("reads the params, loads the manifest+route ONCE and derives the route's rows", () => {
    const { rerender } = renderProbe("/mapa?romaneio=hash-1&rota=A-1");

    expect(uploaderState.loadManifest).toHaveBeenCalledTimes(1);
    // REF-018: the route name is passed so the fast path can read just that route.
    expect(uploaderState.loadManifest).toHaveBeenCalledWith("hash-1", "A-1");
    expect(screen.getByTestId("probe")).toHaveTextContent("hash-1|A-1|2");

    rerender(
      <MemoryRouter initialEntries={["/mapa?romaneio=hash-1&rota=A-1"]}>
        <Probe />
      </MemoryRouter>
    );
    expect(uploaderState.loadManifest).toHaveBeenCalledTimes(1); // guard: same id+rota → once
  });

  it("reloads when the rota changes within the same manifest (REF-018 fast path is per-route)", () => {
    uploaderState.routes = { "A-1": [{}, {}] as RowData[], "B-2": [{}] as RowData[] };
    render(
      <MemoryRouter initialEntries={["/mapa?romaneio=hash-1&rota=A-1"]}>
        <Probe />
        <NavTo to="/mapa?romaneio=hash-1&rota=B-2" />
      </MemoryRouter>
    );
    expect(uploaderState.loadManifest).toHaveBeenCalledWith("hash-1", "A-1");

    // Navigate in place: same route pattern, only the `rota` param changes.
    fireEvent.click(screen.getByText("go"));

    expect(uploaderState.loadManifest).toHaveBeenCalledTimes(2); // rota changed → reload
    expect(uploaderState.loadManifest).toHaveBeenLastCalledWith("hash-1", "B-2");
  });

  it("returns nulls and [] for a malformed URL without loading anything", () => {
    renderProbe("/mapa");

    expect(uploaderState.loadManifest).not.toHaveBeenCalled();
    expect(screen.getByTestId("probe")).toHaveTextContent("null|null|0");
  });

  it("returns [] when the URL points at a route that no longer exists", () => {
    renderProbe("/mapa?romaneio=hash-1&rota=NAO-EXISTE");

    expect(screen.getByTestId("probe")).toHaveTextContent("hash-1|NAO-EXISTE|0");
  });
});
