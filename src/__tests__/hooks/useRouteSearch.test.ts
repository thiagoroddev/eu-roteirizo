import { describe, it, expect } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useRouteSearch } from "../../hooks/useRouteSearch";
import { COLUMN_NAMES } from "../../constants";
import type { RoutesMap } from "../../types";

// =============================================================================
// DADOS MOCK (Simulação de Rotas)
// =============================================================================

const mockRoutes: RoutesMap = {
  "Rota A-1": [
    { [COLUMN_NAMES.PLANNED_AT]: "AT-100", [COLUMN_NAMES.SEQUENCE]: 1 },
    { [COLUMN_NAMES.PLANNED_AT]: "AT-101", [COLUMN_NAMES.SEQUENCE]: 2 },
  ],
  "Rota B-2": [{ [COLUMN_NAMES.PLANNED_AT]: "AT-200", [COLUMN_NAMES.SEQUENCE]: 1 }],
};

describe("useRouteSearch Hook", () => {
  // ==========================================================================
  // 1. ESTADO INICIAL
  // ==========================================================================

  it("initializes with empty search state", () => {
    // renderHook "monta" o hook num componente React invisível
    const { result } = renderHook(() => useRouteSearch(mockRoutes));

    expect(result.current.searchAT).toBe("");
    expect(result.current.searchResult).toBeNull();
  });

  it("handles null routes gracefully", () => {
    // Se não houver rotas carregadas, não deve quebrar
    const { result } = renderHook(() => useRouteSearch(null));

    // Tenta buscar algo
    act(() => {
      result.current.handleSearchChange("AT-100");
    });

    // Deve retornar NONE (pois o índice está vazio)
    expect(result.current.searchResult).toBe("NONE");
  });

  // ==========================================================================
  // 2. FUNCIONALIDADE DE BUSCA (Sucesso e Falha)
  // ==========================================================================

  it("finds the correct route for a valid AT code", () => {
    const { result } = renderHook(() => useRouteSearch(mockRoutes));

    // act(...) serve para envolver atualizações de estado do React
    act(() => {
      result.current.handleSearchChange("AT-100");
    });

    expect(result.current.searchAT).toBe("AT-100");
    expect(result.current.searchResult).toBe("Rota A-1"); // Achou!
  });

  it("returns 'NONE' when AT code is not found", () => {
    const { result } = renderHook(() => useRouteSearch(mockRoutes));

    act(() => {
      result.current.handleSearchChange("AT-9999"); // Não existe
    });

    expect(result.current.searchResult).toBe("NONE");
  });

  // ==========================================================================
  // 3. ROBUSTEZ (Espaços e Limpeza)
  // ==========================================================================

  it("trims whitespace from search input", () => {
    const { result } = renderHook(() => useRouteSearch(mockRoutes));

    act(() => {
      // Usuário copiou e colou com espaço: " AT-200 "
      result.current.handleSearchChange("  AT-200  ");
    });

    // O input visual mantém os espaços (para o usuário ver o que digitou)
    expect(result.current.searchAT).toBe("  AT-200  ");
    // Mas a busca interna deve ignorar espaços e achar a rota
    expect(result.current.searchResult).toBe("Rota B-2");
  });

  it("clears search result when input is empty", () => {
    const { result } = renderHook(() => useRouteSearch(mockRoutes));

    // 1. Busca algo
    act(() => result.current.handleSearchChange("AT-100"));
    expect(result.current.searchResult).toBe("Rota A-1");

    // 2. Apaga o texto
    act(() => result.current.handleSearchChange(""));

    // 3. Resultado deve voltar a ser null (estado inicial), não "NONE"
    expect(result.current.searchResult).toBeNull();
  });

  it("resets state when clearSearch is called", () => {
    const { result } = renderHook(() => useRouteSearch(mockRoutes));

    act(() => result.current.handleSearchChange("AT-100"));

    act(() => {
      result.current.clearSearch();
    });

    expect(result.current.searchAT).toBe("");
    expect(result.current.searchResult).toBeNull();
  });

  // ==========================================================================
  // 4. REATIVIDADE (useEffect)
  // ==========================================================================

  it("rebuilds the index when routes prop changes", () => {
    // 1. Inicia com as rotas originais (Tem AT-100, não tem AT-999)
    const { result, rerender } = renderHook(({ r }) => useRouteSearch(r), {
      initialProps: { r: mockRoutes },
    });

    act(() => result.current.handleSearchChange("AT-999"));
    expect(result.current.searchResult).toBe("NONE");

    // 2. Novas rotas chegam (upload de novo arquivo)
    const newRoutes = {
      "Rota Nova": [{ [COLUMN_NAMES.PLANNED_AT]: "AT-999" }], // Agora existe!
    };

    rerender({ r: newRoutes });

    // 3. Refazemos a busca (simulando digitação ou apenas re-verificação)
    act(() => result.current.handleSearchChange("AT-999"));

    // 4. Agora deve encontrar
    expect(result.current.searchResult).toBe("Rota Nova");
  });
});
