import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { RouteSimpleTable } from "../../components/RouteSimpleTable";
import { COLUMN_NAMES } from "../../constants";
import { UI_LABELS } from "../../constants/uiLabels";

describe("RouteSimpleTable", () => {
  const mockRows = [
    {
      [COLUMN_NAMES.STOP]: 1,
      [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Teste, 123, sala 1",
      [COLUMN_NAMES.NEIGHBORHOOD]: "Centro",
      [COLUMN_NAMES.ZIPCODE]: "20000-000",
      [COLUMN_NAMES.LOCATION_TYPE]: "OFFICE",
    },
    {
      [COLUMN_NAMES.STOP]: 2,
      [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Teste, 456, apt 2",
      [COLUMN_NAMES.NEIGHBORHOOD]: "Bairro",
      [COLUMN_NAMES.ZIPCODE]: "20000-001",
      [COLUMN_NAMES.LOCATION_TYPE]: "HOME",
    },
    {
      [COLUMN_NAMES.STOP]: 3,
      [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Teste, 789",
      [COLUMN_NAMES.NEIGHBORHOOD]: "Outro",
      [COLUMN_NAMES.ZIPCODE]: "20000-002",
      [COLUMN_NAMES.LOCATION_TYPE]: "",
    },
  ];

  it("renders the correct title using UI_LABELS", () => {
    const testRoute = "R-1";
    render(<RouteSimpleTable rows={mockRows} selectedRoute={testRoute} onClose={() => {}} />);

    expect(screen.getByText(UI_LABELS.ROUTE_SIMPLE_TABLE.TITLE(testRoute))).toBeInTheDocument();
  });

  it("renders the close button using UI_LABELS", () => {
    render(<RouteSimpleTable rows={mockRows} selectedRoute="R-1" onClose={() => {}} />);

    expect(screen.getByRole("button", { name: UI_LABELS.COMMON.CLOSE })).toBeInTheDocument();
  });

  it("renders the column headers using UI_LABELS", () => {
    render(<RouteSimpleTable rows={mockRows} selectedRoute="R-1" onClose={() => {}} />);

    expect(screen.getByRole("columnheader", { name: UI_LABELS.ROUTE_SIMPLE_TABLE.STOP })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: UI_LABELS.ROUTE_SIMPLE_TABLE.ADDRESS })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: UI_LABELS.ROUTE_SIMPLE_TABLE.NEIGHBORHOOD })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: UI_LABELS.ROUTE_SIMPLE_TABLE.ZIPCODE })).toBeInTheDocument();
    expect(screen.getByRole("columnheader", { name: UI_LABELS.ROUTE_SIMPLE_TABLE.LOCATION_TYPE })).toBeInTheDocument();
  });

  it("renders the correct colors for 'Yes' badges (yellow)", () => {
    render(<RouteSimpleTable rows={mockRows} selectedRoute="R-1" onClose={() => {}} />);

    const simBadges = screen.getAllByText(UI_LABELS.COMMON.YES);
    expect(simBadges[0]).toHaveClass("bg-yellow-200");
    expect(simBadges[0]).toHaveClass("text-yellow-900");
  });

  it("renders the correct colors for 'No' badges (blue)", () => {
    render(<RouteSimpleTable rows={mockRows} selectedRoute="R-1" onClose={() => {}} />);

    const naoBadges = screen.getAllByText(UI_LABELS.COMMON.NO);
    expect(naoBadges[0]).toHaveClass("bg-blue-200");
    expect(naoBadges[0]).toHaveClass("text-blue-900");
  });

  it("renders the tooltip correctly using UI_LABELS", () => {
    render(<RouteSimpleTable rows={mockRows} selectedRoute="R-1" onClose={() => {}} />);

    const headers = screen.getAllByTitle(UI_LABELS.ROUTE_SIMPLE_TABLE.LOCATION_TYPE_TOOLTIP);
    expect(headers.length).toBeGreaterThan(0);
  });

  it("Renders 'No data' using UI_LABELS.COMMON when the field is empty.", () => {
    const emptyRow = [
      {
        [COLUMN_NAMES.STOP]: "",
        [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua X",
        [COLUMN_NAMES.NEIGHBORHOOD]: "",
        [COLUMN_NAMES.ZIPCODE]: "",
        [COLUMN_NAMES.LOCATION_TYPE]: "",
      },
    ];

    render(<RouteSimpleTable rows={emptyRow} selectedRoute="R-1" onClose={() => {}} />);

    const semDadosElements = screen.getAllByText(UI_LABELS.COMMON.NO_DATA);
    expect(semDadosElements.length).toBeGreaterThan(0);
  });

  it("doesn't render anything when rows is empty", () => {
    const { container } = render(<RouteSimpleTable rows={[]} selectedRoute="R-1" onClose={() => {}} />);

    expect(container.firstChild).toBeNull();
  });
});
