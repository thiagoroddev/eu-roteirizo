import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ComponentProps } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { RouteSelector } from "../../components/RouteSelector";
import { UI_LABELS } from "../../constants";
import type { RoutesMap } from "../../types";

// getVehicleType is exercised in its own util tests; here we mock it so the
// dropdown's vehicle suffix is deterministic.
vi.mock("../../utils/formatters", () => ({
  getVehicleType: vi.fn(() => UI_LABELS.COMMON.NO_DATA),
}));
import { getVehicleType } from "../../utils/formatters";

const routes: RoutesMap = {
  "A-1": [{ Sequence: 1 }],
  "B-2": [{ Sequence: 2 }],
};

const renderSelector = (overrides: Partial<ComponentProps<typeof RouteSelector>> = {}) =>
  render(<RouteSelector routes={routes} selectedRoute={null} onSelect={vi.fn()} onSearch={vi.fn()} availableCols={[]} {...overrides} />);

describe("RouteSelector", () => {
  beforeEach(() => {
    vi.mocked(getVehicleType).mockReturnValue(UI_LABELS.COMMON.NO_DATA);
  });

  it("is disabled and shows the waiting-file text when there are no routes", () => {
    renderSelector({ routes: {} });

    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(UI_LABELS.ROUTE_SELECTOR.WAITING_FILE);
  });

  it("shows the choose-route prompt and keeps the menu closed initially", () => {
    renderSelector();

    expect(screen.getByText(UI_LABELS.ROUTE_SELECTOR.CHOOSE_ROUTE(2))).toBeInTheDocument();
    // Route options are not rendered until the menu opens
    expect(screen.queryByRole("button", { name: /A-1/ })).not.toBeInTheDocument();
  });

  it("opens the menu and lists the routes when the toggle is clicked", () => {
    renderSelector();

    fireEvent.click(screen.getByRole("button"));

    expect(screen.getByRole("button", { name: /A-1/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /B-2/ })).toBeInTheDocument();
  });

  it("calls onSelect and closes the menu when a route is picked", () => {
    const onSelect = vi.fn();
    renderSelector({ onSelect });

    fireEvent.click(screen.getByRole("button")); // open
    fireEvent.click(screen.getByRole("button", { name: /A-1/ })); // pick

    expect(onSelect).toHaveBeenCalledWith("A-1");
    // Menu closed → options gone
    expect(screen.queryByRole("button", { name: /B-2/ })).not.toBeInTheDocument();
  });

  it("shows the selected route with its vehicle type on the toggle", () => {
    vi.mocked(getVehicleType).mockReturnValue("Moto");
    renderSelector({ selectedRoute: "A-1" });

    expect(screen.getByRole("button")).toHaveTextContent("A-1 (Moto)");
  });

  it("omits the vehicle suffix when the vehicle type is 'no data'", () => {
    vi.mocked(getVehicleType).mockReturnValue(UI_LABELS.COMMON.NO_DATA);
    renderSelector({ selectedRoute: "A-1" });

    const button = screen.getByRole("button");
    expect(button).toHaveTextContent("A-1");
    expect(button).not.toHaveTextContent("(");
  });

  it("closes the menu when clicking outside", () => {
    renderSelector();

    fireEvent.click(screen.getByRole("button")); // open
    expect(screen.getByRole("button", { name: /A-1/ })).toBeInTheDocument();

    fireEvent.mouseDown(document.body); // click outside

    expect(screen.queryByRole("button", { name: /A-1/ })).not.toBeInTheDocument();
  });
});
