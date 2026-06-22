import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RouteSummary } from "../../components/RouteSummary";
import { UI_LABELS } from "../../constants/uiLabels";

// =============================================================================
// MOCKS
// =============================================================================

vi.mock("../../hooks/useRouteSummary", () => ({
  useRouteSummary: () => ({
    totalPacks: "50",
    lastStop: "10",
    time: "4 horas e 35 minutos",
    distance: "36 km",
    city: "Rio de Janeiro",
    at: "AT202511158FS0J",
    commerceCount: "5",
    neighborhoods: "Copacabana: 5",
    correiosDeliveryCount: "2",
    shiftTime: "04:00—09:00",
    dateRaw: "2025-12-12",
    hub: "LM Hub_RJ_Ilha do Governador",
  }),
}));

vi.mock("@assets/images/yellow-ball.png", () => ({
  default: "yellow-ball.png",
}));

describe("RouteSummary Component", () => {
  const defaultProps = {
    rows: [],
    availableCols: [],
    selectedRoute: "B-22",
    vehicleType: "Moto",
    onViewMap: vi.fn(),
    onShowTable: vi.fn(),
    onShowSimpleTable: vi.fn(),
    mapAvailable: true,
  };

  // ========================================================================================
  // 1. RENDERING TEST (Robust Context Specific)
  // ========================================================================================

  it("renders all summary statistics correctly in their specific fields", () => {
    render(<RouteSummary {...defaultProps} />);

    // Test that all expected labels are present
    expect(screen.getByText(UI_LABELS.ROUTE_SUMMARY.AT)).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.ROUTE_SUMMARY.HUB)).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.ROUTE_SUMMARY.DATE_AT)).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.ROUTE_SUMMARY.SHIFT)).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.ROUTE_SUMMARY.PACKAGES)).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.ROUTE_SUMMARY.STOPS)).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.ROUTE_SUMMARY.ESTIMATED_TIME)).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.ROUTE_SUMMARY.ESTIMATED_DISTANCE)).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.ROUTE_SUMMARY.NEIGHBORHOODS)).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.ROUTE_SUMMARY.CITY)).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.ROUTE_SUMMARY.COMMERCIAL_TIME, { exact: false })).toBeInTheDocument();
    expect(screen.getByText(UI_LABELS.ROUTE_SUMMARY.CORREIOS_NO_ENTRY)).toBeInTheDocument();

    // Test that the component renders without crashing and has the expected structure
    const listItems = screen.getAllByRole("listitem");
    expect(listItems.length).toBeGreaterThan(10); // Should have at least 11 list items

    // Test that values are present by checking the parent li elements contain text after the strong tags
    const atLi = screen.getByText(UI_LABELS.ROUTE_SUMMARY.AT).closest("li");
    const hubLi = screen.getByText(UI_LABELS.ROUTE_SUMMARY.HUB).closest("li");
    const dateLi = screen.getByText(UI_LABELS.ROUTE_SUMMARY.DATE_AT).closest("li");
    const shiftLi = screen.getByText(UI_LABELS.ROUTE_SUMMARY.SHIFT).closest("li");
    const packsLi = screen.getByText(UI_LABELS.ROUTE_SUMMARY.PACKAGES).closest("li");
    const stopsLi = screen.getByText(UI_LABELS.ROUTE_SUMMARY.STOPS).closest("li");
    const timeLi = screen.getByText(UI_LABELS.ROUTE_SUMMARY.ESTIMATED_TIME).closest("li");
    const distanceLi = screen.getByText(UI_LABELS.ROUTE_SUMMARY.ESTIMATED_DISTANCE).closest("li");
    const neighborhoodsLi = screen.getByText(UI_LABELS.ROUTE_SUMMARY.NEIGHBORHOODS).closest("li");
    const cityLi = screen.getByText(UI_LABELS.ROUTE_SUMMARY.CITY).closest("li");
    const commerceLi = screen.getByText(UI_LABELS.ROUTE_SUMMARY.COMMERCIAL_TIME, { exact: false }).closest("li");
    const correiosLi = screen.getByText(UI_LABELS.ROUTE_SUMMARY.CORREIOS_NO_ENTRY).closest("li");

    // Ensure list items exist and have content
    expect(atLi).toBeInTheDocument();
    expect(hubLi).toBeInTheDocument();
    expect(dateLi).toBeInTheDocument();
    expect(shiftLi).toBeInTheDocument();
    expect(packsLi).toBeInTheDocument();
    expect(stopsLi).toBeInTheDocument();
    expect(timeLi).toBeInTheDocument();
    expect(distanceLi).toBeInTheDocument();
    expect(neighborhoodsLi).toBeInTheDocument();
    expect(cityLi).toBeInTheDocument();
    expect(commerceLi).toBeInTheDocument();
    expect(correiosLi).toBeInTheDocument();

    // Test that each li renders its actual value (from the mocked useRouteSummary),
    // not just the label. Asserting the real value is robust to label changes.
    expect(atLi).toHaveTextContent("AT202511158FS0J");
    expect(hubLi).toHaveTextContent("LM Hub_RJ_Ilha do Governador");
    expect(dateLi).toHaveTextContent("2025-12-12");
    expect(shiftLi).toHaveTextContent("04:00—09:00");
    expect(packsLi).toHaveTextContent("50");
    expect(stopsLi).toHaveTextContent("10");
    expect(timeLi).toHaveTextContent("4 horas e 35 minutos");
    expect(distanceLi).toHaveTextContent("36 km");
    expect(neighborhoodsLi).toHaveTextContent("Copacabana: 5");
    expect(cityLi).toHaveTextContent("Rio de Janeiro");
    expect(commerceLi).toHaveTextContent("5");
    expect(correiosLi).toHaveTextContent("2");
  });

  // ========================================================================================
  // 2. CONDITIONAL LOGIC TEST (Buttons)
  // ========================================================================================

  it("shows 'Ver no Mapa' button when mapAvailable is TRUE", () => {
    render(<RouteSummary {...defaultProps} mapAvailable={true} />);

    const mapBtn = screen.getByRole("button", { name: UI_LABELS.ROUTE_SUMMARY.VIEW_MAP });
    expect(mapBtn).toBeInTheDocument();
    expect(mapBtn).not.toBeDisabled();

    fireEvent.click(mapBtn);
    expect(defaultProps.onViewMap).toHaveBeenCalled();
  });

  it("shows disabled 'Sem Coordenadas' button when mapAvailable is FALSE", () => {
    render(<RouteSummary {...defaultProps} mapAvailable={false} />);

    expect(screen.queryByRole("button", { name: UI_LABELS.ROUTE_SUMMARY.VIEW_MAP })).not.toBeInTheDocument();

    const disabledBtn = screen.getByRole("button", { name: UI_LABELS.ROUTE_SUMMARY.NO_COORDINATES });
    expect(disabledBtn).toBeInTheDocument();
    expect(disabledBtn).toBeDisabled();
  });

  // ========================================================================================
  // 3. INTERACTION TEST (Clicks)
  // ========================================================================================

  it("calls onShowTable when 'Tabela Original' is clicked", () => {
    render(<RouteSummary {...defaultProps} />);

    const btn = screen.getByRole("button", { name: UI_LABELS.ROUTE_SUMMARY.ORIGINAL_TABLE });
    fireEvent.click(btn);

    expect(defaultProps.onShowTable).toHaveBeenCalled();
  });

  it("calls onShowSimpleTable when 'Tabela Simplificada' is clicked", () => {
    render(<RouteSummary {...defaultProps} />);

    const btn = screen.getByRole("button", { name: UI_LABELS.ROUTE_SUMMARY.SIMPLE_TABLE });
    fireEvent.click(btn);

    expect(defaultProps.onShowSimpleTable).toHaveBeenCalled();
  });
});
