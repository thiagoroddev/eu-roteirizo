import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { UI_LABELS, COLUMN_NAMES } from "../../constants";
import type { RowData } from "../../types";

// ---------------------------------------------------------------------------
// Controlled data via mocked hooks. RouteViewer's own orchestration (which
// child renders when, prop wiring, local UI state) is what we exercise here.
// ---------------------------------------------------------------------------
const rowsA1: RowData[] = [
  {
    [COLUMN_NAMES.SEQUENCE]: 1,
    [COLUMN_NAMES.STOP]: 1,
    [COLUMN_NAMES.LATITUDE]: -229000000,
    [COLUMN_NAMES.LONGITUDE]: -431000000,
    [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua A, 123",
    [COLUMN_NAMES.ZIPCODE]: "22041-001",
    [COLUMN_NAMES.PLANNED_VEHICLE_TYPE]: "Moto",
  },
];

const uploaderState = {
  routes: { "A-1": rowsA1 } as Record<string, RowData[]>,
  loading: false,
  error: null as string | null,
  availableCols: [
    COLUMN_NAMES.LATITUDE,
    COLUMN_NAMES.LONGITUDE,
    COLUMN_NAMES.SEQUENCE,
    COLUMN_NAMES.STOP,
    COLUMN_NAMES.DESTINATION_ADDRESS,
    COLUMN_NAMES.ZIPCODE,
    COLUMN_NAMES.PLANNED_VEHICLE_TYPE,
  ] as string[],
  missingCols: [] as string[],
  handleFileUpload: vi.fn(),
};

vi.mock("../../hooks/useRouteUploader", () => ({
  useRouteUploader: () => uploaderState,
}));

vi.mock("../../hooks/useRouteSearch", () => ({
  useRouteSearch: () => ({
    searchAT: "",
    searchResult: null,
    handleSearchChange: vi.fn(),
    clearSearch: vi.fn(),
  }),
}));

// Stub RouteMap to avoid loading Leaflet in jsdom.
vi.mock("../../components/RouteMap", () => ({
  RouteMap: ({ onClose }: { onClose: () => void }) => (
    <div data-testid="route-map-stub">
      RouteMap
      <button type="button" onClick={onClose}>
        close-map-stub
      </button>
    </div>
  ),
}));

import RouteViewer from "../../pages/RouteViewer";

const openRouteSelectorAndPick = (routeMatcher: RegExp) => {
  // The toggle is the only button before a route is selected.
  fireEvent.click(screen.getByRole("button", { name: new RegExp(UI_LABELS.ROUTE_SELECTOR.CHOOSE_ROUTE(1).slice(0, 10)) }));
  fireEvent.click(screen.getByRole("button", { name: routeMatcher }));
};

describe("RouteViewer (integration)", () => {
  beforeEach(() => {
    uploaderState.handleFileUpload.mockClear();
  });

  it("renders the page title and the route selector when routes are loaded", () => {
    render(<RouteViewer />);

    expect(screen.getByText(UI_LABELS.ROUTE_VIEWER.TITLE)).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.ROUTE_SELECTOR.CHOOSE_ROUTE(1))).toBeInTheDocument();
    // No route picked yet → summary actions are absent
    expect(screen.queryByRole("button", { name: UI_LABELS.ROUTE_SUMMARY.ORIGINAL_TABLE })).not.toBeInTheDocument();
  });

  it("shows the route summary after a route is selected", () => {
    render(<RouteViewer />);

    openRouteSelectorAndPick(/A-1/);

    expect(screen.getByRole("button", { name: UI_LABELS.ROUTE_SUMMARY.VIEW_MAP })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: UI_LABELS.ROUTE_SUMMARY.ORIGINAL_TABLE })).toBeInTheDocument();
  });

  it("opens and closes the fullscreen map", () => {
    render(<RouteViewer />);
    openRouteSelectorAndPick(/A-1/);

    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.ROUTE_SUMMARY.VIEW_MAP }));
    expect(screen.getByTestId("route-map-stub")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "close-map-stub" }));
    expect(screen.queryByTestId("route-map-stub")).not.toBeInTheDocument();
  });

  it("opens the original table modal and closes it", () => {
    render(<RouteViewer />);
    openRouteSelectorAndPick(/A-1/);

    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.ROUTE_SUMMARY.ORIGINAL_TABLE }));
    expect(screen.getByText(UI_LABELS.ROUTE_TABLE.TITLE("A-1"))).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.COMMON.CLOSE }));
    expect(screen.queryByText(UI_LABELS.ROUTE_TABLE.TITLE("A-1"))).not.toBeInTheDocument();
  });
});
