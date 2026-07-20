/**
 * services/graphDiagnostics.ts - Medição do carregamento da malha viária
 * (TASK-CHORE-006, primeiro passo da ADR-010).
 *
 * A pergunta que isto responde: a lentidão do "Carregando ruas…" é **payload**
 * (resposta grande ⇒ vale fatiar o bbox) ou **fila do Overpass** (resposta
 * pequena e mesmo assim demorada ⇒ só a migração da ADR-010 resolve)? As duas
 * têm correções opostas, então medir vem antes de otimizar.
 *
 * Por que gravar SEMPRE (e não atrás de `import.meta.env.DEV`):
 * - o smoke roda no build de PRODUÇÃO (site de testes), onde DEV é falso;
 * - a lentidão é intermitente — um flag que se liga antes perderia o caso ruim.
 * Grava só NÚMEROS (área, tempo, tamanho, nós/arestas) — nenhum endereço ou
 * coordenada, respeitando a regra de log sem PII (TASK-BG-002).
 *
 * Acesso a localStorage é defensivo (modo privado, jsdom): falha vira no-op.
 */

/**
 * De onde a malha veio nesta carga.
 *
 * Gravar as TRÊS é essencial: só "rede" deixaria o painel vazio quando o grafo
 * veio do cache — indistinguível de instrumento quebrado — e, pior, esconderia
 * justamente as cargas que **falham** ("às vezes nem carrega"), que são o
 * sintoma mais importante a medir.
 */
export type GraphFetchSource = "rede" | "cache" | "erro";

/** Uma carga de malha medida. Só números — nada identificável. */
export interface GraphFetchSample {
  /** ISO de quando terminou. */
  at: string;
  /** Rede, cache ou falha. */
  source: GraphFetchSource;
  /** Área do bbox consultado, em km². */
  bboxKm2: number;
  /** Tempo até a resposta chegar (rede + fila do servidor), em ms. Zero em cache/erro. */
  networkMs: number;
  /** Tempo total: rede+parse+grafo, leitura do cache, ou até a falha. Em ms. */
  totalMs: number;
  /** Tamanho aproximado da resposta, em KB. Zero em cache/erro. */
  responseKb: number;
  nodes: number;
  edges: number;
}

const STORAGE_KEY = "graphDiagnostics";
/** Quantas cargas guardar (as mais recentes). Suficiente p/ ver o padrão. */
const MAX_SAMPLES = 12;

/** Lê as amostras (mais recente primeiro). Nunca lança. */
export const readGraphSamples = (): GraphFetchSample[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as GraphFetchSample[]) : [];
  } catch {
    return [];
  }
};

/** Grava uma carga, mantendo só as `MAX_SAMPLES` mais recentes. Nunca lança. */
export const recordGraphSample = (sample: GraphFetchSample): void => {
  try {
    const next = [sample, ...readGraphSamples()].slice(0, MAX_SAMPLES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* indisponível — diagnóstico é best-effort, nunca atrapalha o app */
  }
};

/** Limpa o histórico (botão do painel de diagnóstico). Nunca lança. */
export const clearGraphSamples = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignora */
  }
};
