/**
 * TASK-SPIKE-001 - O que e uma conversao, e como buscar minimizando-as.
 *
 * Duas coisas moram aqui, e a primeira e a razao de o spike existir:
 *
 * 1. TRES DEFINICOES de conversao, medidas lado a lado. Escolher uma antes de
 *    medir seria o palpite que o spike existe para evitar.
 * 2. Uma busca A* POR ARESTA. O A* do app (src/utils/routing/aStar.ts) tem
 *    estado = no e custo = metros: nao ha onde pendurar o custo de virar, porque
 *    virar depende de POR ONDE SE CHEGOU. O estado aqui e o par (no anterior, no),
 *    que identifica a aresta de chegada.
 *
 * Codigo de spike: descartavel por definicao (processos/teste.md).
 */

import type { NodeId, RoadGraph } from "../../src/utils/routing/graph";
import { haversine } from "../../src/utils/routing/geo";
import { bearingDeg } from "../../src/utils/routing/walkOrder";
import { MinHeap } from "../../src/utils/routing/minHeap";

// ---------------------------------------------------------------- definicoes

/**
 * O custo de passar de uma aresta para a proxima, num vertice.
 * `0` = seguiu reto. `1` = uma conversao. Acima disso, algo pior que virar.
 */
export interface DefinicaoConversao {
  nome: string;
  descricao: string;
  custo: (grafo: RoadGraph, anterior: NodeId, atual: NodeId, proximo: NodeId) => number;
}

/** Diferenca angular absoluta entre dois rumos, em [0, 180]. */
export const difAngular = (a: number, b: number): number => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

/** Rumos de chegada e de saida num vertice. Null quando algum no falta no grafo. */
const rumos = (grafo: RoadGraph, anterior: NodeId, atual: NodeId, proximo: NodeId): { entra: number; sai: number } | null => {
  const a = grafo.coords.get(anterior);
  const b = grafo.coords.get(atual);
  const c = grafo.coords.get(proximo);
  if (!a || !b || !c) return null;
  return { entra: bearingDeg(a, b), sai: bearingDeg(b, c) };
};

const nomeDaVia = (grafo: RoadGraph, de: NodeId, para: NodeId): string => (grafo.adj.get(de) ?? []).find((e) => e.to === para)?.wayName ?? "";

/** MANUAL KNOB - acima disto o rumo mudou o bastante para o entregador chamar de curva. */
const ANGULO_DE_CURVA = 35;
/** MANUAL KNOB - acima disto e retorno, nao curva: custa mais que virar numa esquina. */
const ANGULO_DE_RETORNO = 150;
/** MANUAL KNOB - quanto um retorno pesa, medido em conversoes. */
const PESO_DO_RETORNO = 3;
/** MANUAL KNOB - variacao ate aqui, DENTRO da mesma via, e curva da rua, nao conversao. */
const CURVA_SUAVE_DA_VIA = 45;

/** D1 - mudou o nome da rua. Barato, ja esta no grafo, e ignora geometria. */
export const D1_NOME_DA_VIA: DefinicaoConversao = {
  nome: "D1 nome-da-via",
  descricao: "conta 1 quando o wayName muda entre arestas consecutivas",
  custo: (grafo, anterior, atual, proximo) => (nomeDaVia(grafo, anterior, atual) === nomeDaVia(grafo, atual, proximo) ? 0 : 1),
};

/** D2 - o rumo mudou mais que o limiar. Ignora nome, olha so geometria. */
export const D2_ANGULO: DefinicaoConversao = {
  nome: "D2 angulo",
  descricao: `conta 1 quando o rumo muda mais de ${ANGULO_DE_CURVA} graus`,
  custo: (grafo, anterior, atual, proximo) => {
    const r = rumos(grafo, anterior, atual, proximo);
    if (!r) return 0;
    return difAngular(r.entra, r.sai) > ANGULO_DE_CURVA ? 1 : 0;
  },
};

/**
 * D3 - angulo, com duas correcoes que vem do mundo real: seguir a propria rua
 * numa curva suave nao e conversao, e dar meia-volta e pior que virar.
 */
export const D3_ANGULO_COM_VIA: DefinicaoConversao = {
  nome: "D3 angulo+via",
  descricao: `como D2, mas curva ate ${CURVA_SUAVE_DA_VIA} graus na MESMA via nao conta, e retorno acima de ${ANGULO_DE_RETORNO} pesa ${PESO_DO_RETORNO}`,
  custo: (grafo, anterior, atual, proximo) => {
    const r = rumos(grafo, anterior, atual, proximo);
    if (!r) return 0;
    const delta = difAngular(r.entra, r.sai);
    if (delta > ANGULO_DE_RETORNO) return PESO_DO_RETORNO;
    const mesmaVia = nomeDaVia(grafo, anterior, atual) === nomeDaVia(grafo, atual, proximo);
    if (mesmaVia && delta <= CURVA_SUAVE_DA_VIA) return 0;
    return delta > ANGULO_DE_CURVA ? 1 : 0;
  },
};

export const DEFINICOES: DefinicaoConversao[] = [D1_NOME_DA_VIA, D2_ANGULO, D3_ANGULO_COM_VIA];

/** Conversoes de um caminho ja pronto, pela definicao dada. */
export const contarConversoes = (grafo: RoadGraph, caminho: NodeId[], def: DefinicaoConversao): number => {
  let total = 0;
  for (let i = 1; i < caminho.length - 1; i += 1) total += def.custo(grafo, caminho[i - 1], caminho[i], caminho[i + 1]);
  return total;
};

// ---------------------------------------------------------------- busca

export interface ResultadoBusca {
  caminho: NodeId[] | null;
  metros: number;
  conversoes: number;
  /** Estados retirados da fila: o preco real de trocar no por aresta. */
  expandidos: number;
}

/** Estado da fronteira: a aresta de chegada, nao so o no. */
interface Estado {
  chave: string;
  no: NodeId;
  anterior: NodeId | null;
  prioridade: number;
}

const chaveDe = (anterior: NodeId | null, no: NodeId): string => `${anterior ?? "-"}>${no}`;

/**
 * A* por aresta, minimizando `metros + pesoMetrosPorConversao x conversoes`.
 *
 * O estado carrega a aresta de chegada porque o custo de virar so existe em
 * relacao a ela. A heuristica continua sendo a haversine ate o destino, que
 * subestima o custo real (metros + penalidade >= metros): admissivel, entao o
 * caminho devolvido e otimo para a funcao de custo escolhida.
 *
 * @param pesoMetrosPorConversao - Quantos metros vale evitar uma conversao.
 *                                 Com `0` a busca vira o A* do app, so mais cara.
 */
export const buscarComConversao = (grafo: RoadGraph, origem: NodeId, destino: NodeId, def: DefinicaoConversao, pesoMetrosPorConversao: number): ResultadoBusca => {
  const alvo = grafo.coords.get(destino);
  if (!grafo.coords.has(origem) || !alvo) return { caminho: null, metros: Infinity, conversoes: Infinity, expandidos: 0 };

  const heuristica = (no: NodeId): number => {
    const c = grafo.coords.get(no);
    return c ? haversine(c, alvo) : 0;
  };

  const custoG = new Map<string, number>();
  const metrosG = new Map<string, number>();
  const conversoesG = new Map<string, number>();
  const veioDe = new Map<string, string>();
  const noDaChave = new Map<string, { no: NodeId; anterior: NodeId | null }>();
  const fechados = new Set<string>();

  const inicial = chaveDe(null, origem);
  custoG.set(inicial, 0);
  metrosG.set(inicial, 0);
  conversoesG.set(inicial, 0);
  noDaChave.set(inicial, { no: origem, anterior: null });

  const fila = new MinHeap<Estado>((a, b) => a.prioridade - b.prioridade);
  fila.push({ chave: inicial, no: origem, anterior: null, prioridade: heuristica(origem) });

  let expandidos = 0;

  while (fila.size > 0) {
    const atual = fila.pop();
    if (!atual) break;
    if (fechados.has(atual.chave)) continue;
    fechados.add(atual.chave);
    expandidos += 1;

    if (atual.no === destino) {
      const caminho: NodeId[] = [];
      let passo: string | undefined = atual.chave;
      while (passo !== undefined) {
        const info = noDaChave.get(passo);
        if (!info) break;
        caminho.unshift(info.no);
        passo = veioDe.get(passo);
      }
      return { caminho, metros: metrosG.get(atual.chave) ?? Infinity, conversoes: conversoesG.get(atual.chave) ?? 0, expandidos };
    }

    for (const aresta of grafo.adj.get(atual.no) ?? []) {
      const conversao = atual.anterior === null ? 0 : def.custo(grafo, atual.anterior, atual.no, aresta.to);
      const chaveFilho = chaveDe(atual.no, aresta.to);
      if (fechados.has(chaveFilho)) continue;

      const custo = (custoG.get(atual.chave) ?? Infinity) + aresta.weight + conversao * pesoMetrosPorConversao;
      if (custo >= (custoG.get(chaveFilho) ?? Infinity)) continue;

      custoG.set(chaveFilho, custo);
      metrosG.set(chaveFilho, (metrosG.get(atual.chave) ?? 0) + aresta.weight);
      conversoesG.set(chaveFilho, (conversoesG.get(atual.chave) ?? 0) + conversao);
      veioDe.set(chaveFilho, atual.chave);
      noDaChave.set(chaveFilho, { no: aresta.to, anterior: atual.no });
      fila.push({ chave: chaveFilho, no: aresta.to, anterior: atual.no, prioridade: custo + heuristica(aresta.to) });
    }
  }

  return { caminho: null, metros: Infinity, conversoes: Infinity, expandidos };
};
