import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RouteRow } from "../../../components/manifests/RouteRow";
import type { ManifestRouteMeta } from "../../../types/manifest";
import type { RoteiroSummary } from "../../../types/routing";

describe("RouteRow component", () => {
  const mockRoute: ManifestRouteMeta = {
    name: "Rota Centro",
    rowCount: 42,
    at: "AT-9901",
    neighborhood: "Centro",
  };

  it("renders route name, AT code, neighborhood, and package count", () => {
    render(<RouteRow route={mockRoute} onOpen={vi.fn()} />);

    expect(screen.getByText("Rota Centro")).toBeInTheDocument();
    expect(screen.getByText("9901")).toBeInTheDocument();
    expect(screen.getByText("Centro")).toBeInTheDocument();
    expect(screen.getByText("42 pacotes")).toBeInTheDocument();
    expect(screen.getByText("Sem roteiro")).toBeInTheDocument();
  });

  it("truncates long AT codes to the last 4 characters", () => {
    const longAtRoute: ManifestRouteMeta = {
      name: "Rota Sul",
      rowCount: 10,
      at: "AT202607066V6CY",
      neighborhood: "Ipanema",
    };
    render(<RouteRow route={longAtRoute} onOpen={vi.fn()} />);

    expect(screen.getByText("V6CY")).toBeInTheDocument();
    expect(screen.queryByText("AT202607066V6CY")).not.toBeInTheDocument();
  });

  it("renders state badge correctly for building roteiro", () => {
    const summary: RoteiroSummary = {
      stops: 15,
      vehicleMeters: 8500,
      walkMeters: 1200,
      totalMinutes: 75,
      progressRatio: 0.65,
      computedAt: "2026-09-19T10:00:00Z",
    };

    render(<RouteRow route={mockRoute} hasRoteiro={true} summary={summary} onOpen={vi.fn()} />);

    expect(screen.getByText("Em construção (65%)")).toBeInTheDocument();
    expect(screen.getByText("15 paradas")).toBeInTheDocument();
    expect(screen.getByText("~1 h 15 min")).toBeInTheDocument();
    expect(screen.getByText("8,5 km")).toBeInTheDocument();
    expect(screen.getByText("1,2 km a pé")).toBeInTheDocument();
  });

  it("renders state badge 'Em execução' when progressRatio is 1", () => {
    const summary: RoteiroSummary = {
      stops: 20,
      vehicleMeters: 12000,
      walkMeters: 500,
      totalMinutes: 90,
      progressRatio: 1,
      computedAt: "2026-09-19T10:00:00Z",
    };

    render(<RouteRow route={mockRoute} hasRoteiro={true} summary={summary} onOpen={vi.fn()} />);

    expect(screen.getByText("Em execução")).toBeInTheDocument();
    expect(screen.getByText("20 paradas")).toBeInTheDocument();
  });

  it("invokes onOpen callback when clicked", () => {
    const onOpen = vi.fn();
    render(<RouteRow route={mockRoute} onOpen={onOpen} />);

    fireEvent.click(screen.getByRole("button", { name: /abrir a rota rota centro/i }));
    expect(onOpen).toHaveBeenCalledWith(mockRoute);
  });
});
