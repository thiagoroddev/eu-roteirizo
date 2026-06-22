import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RouteTable } from "../../components/RouteTable";
import { UI_LABELS } from "../../constants/uiLabels";
import type { RowData } from "../../types";

describe("RouteTable Internationalization", () => {
  const mockRows = [
    {
      Parada: "1",
      Endereço: "Rua A, 123",
      Bairro: "Centro",
      CEP: "20000-000",
      Latitude: "-22.9035",
      Longitude: "-43.2096",
    },
    {
      Parada: "2",
      Endereço: "Rua B, 456",
      Bairro: "Copacabana",
      CEP: "22000-000",
      Latitude: "-22.9711",
      Longitude: "-43.1822",
    },
  ];

  const defaultProps = {
    rows: mockRows,
    selectedRoute: "Rota-001",
    onClose: vi.fn(),
  };

  it("deve renderizar o título usando UI_LABELS.ROUTE_TABLE.TITLE", () => {
    render(<RouteTable {...defaultProps} />);
    expect(screen.getByText(UI_LABELS.ROUTE_TABLE.TITLE("Rota-001"))).toBeInTheDocument();
  });

  it("deve renderizar o botão 'Fechar' usando UI_LABELS.COMMON.CLOSE", () => {
    render(<RouteTable {...defaultProps} />);
    expect(screen.getByText(UI_LABELS.COMMON.CLOSE)).toBeInTheDocument();
  });

  it("deve chamar onClose quando o botão fechar for clicado", () => {
    render(<RouteTable {...defaultProps} />);
    const closeButton = screen.getByText(UI_LABELS.COMMON.CLOSE);
    fireEvent.click(closeButton);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it("deve renderizar todas as colunas do primeiro registro", () => {
    render(<RouteTable {...defaultProps} />);
    expect(screen.getByText("Parada")).toBeInTheDocument();
    expect(screen.getByText("Endereço")).toBeInTheDocument();
    expect(screen.getByText("Bairro")).toBeInTheDocument();
    expect(screen.getByText("CEP")).toBeInTheDocument();
    expect(screen.getByText("Latitude")).toBeInTheDocument();
    expect(screen.getByText("Longitude")).toBeInTheDocument();
  });

  it("deve renderizar todos os valores das células", () => {
    render(<RouteTable {...defaultProps} />);
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("Rua A, 123")).toBeInTheDocument();
    expect(screen.getByText("Centro")).toBeInTheDocument();
    expect(screen.getByText("20000-000")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("Rua B, 456")).toBeInTheDocument();
    expect(screen.getByText("Copacabana")).toBeInTheDocument();
    expect(screen.getByText("22000-000")).toBeInTheDocument();
  });

  it("deve exibir 'Sem dados' para células vazias usando UI_LABELS.COMMON.NO_DATA", () => {
    const rowsWithEmpty = [
      {
        Parada: "1",
        Endereço: "",
        Bairro: "Centro",
        CEP: null,
      },
    ];
    render(<RouteTable {...defaultProps} rows={rowsWithEmpty} />);
    const cells = screen.getAllByText(UI_LABELS.COMMON.NO_DATA);
    expect(cells.length).toBeGreaterThan(0);
  });

  it("não deve renderizar nada quando rows estiver vazio", () => {
    const { container } = render(<RouteTable {...defaultProps} rows={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("não deve renderizar nada quando rows for null", () => {
    const { container } = render(<RouteTable {...defaultProps} rows={null as unknown as RowData[]} />);
    expect(container.firstChild).toBeNull();
  });

  it("deve renderizar o número correto de linhas (header + data rows)", () => {
    render(<RouteTable {...defaultProps} />);
    const rows = screen.getAllByRole("row");
    expect(rows.length).toBe(3); // 1 header + 2 data rows
  });

  it("deve aplicar classes de estilo zebrado (odd:bg-slate-50) às linhas", () => {
    const { container } = render(<RouteTable {...defaultProps} />);
    const dataRows = container.querySelectorAll("tbody tr");
    expect(dataRows[0]).toHaveClass("odd:bg-slate-50");
    expect(dataRows[1]).toHaveClass("odd:bg-slate-50");
  });
});
