import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RouteSearchByAT } from "../../components/RouteSearchByAT";

describe("RouteSearchByAT component", () => {
  it("renders input with correct placeholder and value", () => {
    render(<RouteSearchByAT searchAT="AT-123" searchResult={null} onChange={() => {}} onSelectResult={() => {}} clearSearch={() => {}} />);
    const input = screen.getByPlaceholderText(/busca por código at/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveValue("AT-123");
  });

  it("calls onChange when typing", () => {
    const onChange = vi.fn();
    render(<RouteSearchByAT searchAT="" searchResult={null} onChange={onChange} onSelectResult={() => {}} clearSearch={() => {}} />);
    const input = screen.getByPlaceholderText(/busca por código at/i);
    fireEvent.change(input, { target: { value: "AT-999" } });
    expect(onChange).toHaveBeenCalledWith("AT-999");
  });

  it("shows not found message when searchResult is 'NONE'", () => {
    render(<RouteSearchByAT searchAT="AT-999" searchResult="NONE" onChange={() => {}} onSelectResult={() => {}} clearSearch={() => {}} />);
    expect(screen.getByText(/rota não encontrada/i)).toBeInTheDocument();
  });

  it("shows found result as button and calls onSelectResult, onChange, clearSearch", () => {
    const onSelectResult = vi.fn();
    const onChange = vi.fn();
    const clearSearch = vi.fn();
    render(<RouteSearchByAT searchAT="AT-100" searchResult="Rota A-1" onChange={onChange} onSelectResult={onSelectResult} clearSearch={clearSearch} />);
    const btn = screen.getByRole("button");
    expect(btn).toHaveTextContent("Rota A-1");
    fireEvent.click(btn);
    expect(onSelectResult).toHaveBeenCalledWith("Rota A-1");
    expect(onChange).toHaveBeenCalledWith("");
    expect(clearSearch).toHaveBeenCalled();
  });
});
