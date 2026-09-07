import { UI_LABELS } from "../../constants/uiLabels";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { readGraphSamples, recordGraphSample, clearGraphSamples, type GraphFetchSample } from "../../services/graphDiagnostics";

/**
 * O runtime dos testes traz um localStorage parcial (sem clear/removeItem),
 * então substituímos por um Map — mesmo padrão de themeService.test.ts.
 */
const installStorage = () => {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => void store.set(key, value),
    removeItem: (key: string) => void store.delete(key),
    clear: () => store.clear(),
  });
};

const sample = (overrides: Partial<GraphFetchSample> = {}): GraphFetchSample => ({
  at: "2026-07-20T10:00:00.000Z",
  source: "rede",
  bboxKm2: 4.2,
  networkMs: 3100,
  totalMs: 3400,
  responseKb: 820,
  nodes: 4512,
  edges: 9800,
  ...overrides,
});

describe("graphDiagnostics", () => {
  beforeEach(() => installStorage());

  it("começa vazio e devolve o que gravou", () => {
    expect(readGraphSamples()).toEqual([]);
    recordGraphSample(sample());
    expect(readGraphSamples()).toEqual([sample()]);
  });

  it("mantém a amostra mais recente primeiro", () => {
    recordGraphSample(sample({ at: "2026-07-20T10:00:00.000Z" }));
    recordGraphSample(sample({ at: "2026-07-20T11:00:00.000Z" }));
    expect(readGraphSamples().map((s) => s.at)).toEqual(["2026-07-20T11:00:00.000Z", "2026-07-20T10:00:00.000Z"]);
  });

  it("guarda no máximo 12 cargas, descartando as mais antigas", () => {
    for (let i = 0; i < 15; i += 1) recordGraphSample(sample({ at: `2026-07-20T${String(i).padStart(2, "0")}:00:00.000Z` }));
    const stored = readGraphSamples();
    expect(stored).toHaveLength(12);
    expect(stored[0].at).toBe("2026-07-20T14:00:00.000Z");
  });

  it("limpa o histórico", () => {
    recordGraphSample(sample());
    clearGraphSamples();
    expect(readGraphSamples()).toEqual([]);
  });

  it("degrada para vazio quando o conteúdo está corrompido", () => {
    localStorage.setItem("graphDiagnostics", "{não é json");
    expect(readGraphSamples()).toEqual([]);
  });

  it("não lança quando localStorage está indisponível", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("indisponível");
      },
      setItem: () => {
        throw new Error("indisponível");
      },
      removeItem: () => {
        throw new Error("indisponível");
      },
    });
    expect(() => recordGraphSample(sample())).not.toThrow();
    expect(readGraphSamples()).toEqual([]);
    expect(() => clearGraphSamples()).not.toThrow();
  });
});

describe("BG-011 — historico de falhas", () => {
  beforeEach(installStorage);
  it("mantem legibilidade das amostras antigas sem inventar causa", () => {
    const old = sample({ source: "erro", networkMs: 0, responseKb: 0 });
    recordGraphSample(old);
    const loaded = readGraphSamples()[0];
    expect(loaded.diagnostics).toBeUndefined();
    expect(UI_LABELS.GRAPH_DIAGNOSTICS.SAMPLE(loaded)).toContain("erro");
    expect(UI_LABELS.GRAPH_DIAGNOSTICS.HINT).not.toContain("= fila");
  });
  it("preserva medidas desconhecidas e categoria sem copiar payload", () => {
    const failed = sample({
      source: "erro",
      networkMs: null,
      responseKb: null,
      schemaVersion: 1,
      diagnostics: { version: 1, attempts: [{ category: "network", httpStatus: null, headersMs: null, bodyMs: null, totalMs: 5000, responseBytes: null }] },
    });
    recordGraphSample(failed);
    expect(readGraphSamples()[0]).toEqual(failed);
    expect(UI_LABELS.GRAPH_DIAGNOSTICS.SAMPLE(failed)).toContain("erro");
  });
});
