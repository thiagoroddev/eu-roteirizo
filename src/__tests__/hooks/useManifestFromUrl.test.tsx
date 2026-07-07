/**
 * Tests for useManifestFromUrl (TASK-REF-011) — the shared focus-screen hook:
 * URL params + load-once guard + current-route rows derivation.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
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

  it("reads the params, loads the manifest ONCE and derives the route's rows", () => {
    const { rerender } = renderProbe("/mapa?romaneio=hash-1&rota=A-1");

    expect(uploaderState.loadManifest).toHaveBeenCalledTimes(1);
    expect(uploaderState.loadManifest).toHaveBeenCalledWith("hash-1");
    expect(screen.getByTestId("probe")).toHaveTextContent("hash-1|A-1|2");

    rerender(
      <MemoryRouter initialEntries={["/mapa?romaneio=hash-1&rota=A-1"]}>
        <Probe />
      </MemoryRouter>
    );
    expect(uploaderState.loadManifest).toHaveBeenCalledTimes(1); // guard: same id → once
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
