/**
 * TASK-SPIKE-001 - Dois roteirizadores automaticos, para comparar.
 *
 * BASELINE: o guloso por distancia. E a versao que a TASK-RF-012 descrevia
 * antes de ser absorvida - do inicio, pega o livre mais proximo, agrupa quem
 * cabe no raio, ancora, repete. Reusa as pecas ja testadas do app.
 *
 * POR CONVERSAO: escolhe ancoras LIVRES sobre as ruas (nao sobre enderecos) por
 * cobertura gulosa, depois ordena as paradas pelo custo de virar, nao pelo de
 * andar.
 *
 * O que os dois tem em comum, de proposito: mesma estrutura de saida, mesmo
 * limite de caminhada, mesma cobertura obrigatoria. So a decisao muda, para a
 * comparacao medir a decisao e nao o arcabouco.
 *
 * Codigo de spike: descartavel por definicao (processos/teste.md).
 */

import type { DeliveryPoint, LatLng } from "../../src/types/routing";
import type { RoadGraph } from "../../src/utils/routing/graph";
import { haversine } from "../../src/utils/routing/geo";
import { matchToGraph, nearestEdge } from "../../src/utils/routing/match";
import { pointsWithinRadius } from "../../src/utils/routing/selectors";
import { nearestFirstOrder } from "../../src/utils/routing/walkOrder";
import { suggestVehicleStop, defaultAnchorSeed } from "../../src/utils/routing/vehicleStop";
import { buscarComConversao, type DefinicaoConversao } from "./conversoes";

/** Uma parada montada: onde o veiculo para e quais enderecos sao entregues a pe dali. */
export interface Parada {
  ancora: LatLng;
  pontos: DeliveryPoint[];
  /** Maior distancia a pe da ancora ate um dos enderecos. */
  maiorCaminhadaM: number;
}

export interface Roteiro {
  paradas: Parada[];
  metrosVeiculo: number;
  /**
   * Conversoes somadas TRECHO A TRECHO, como a busca as contou no grafo em que
   * a rota foi achada. Nao se conta conversao NA ancora: ali o veiculo para,
   * o entregador desce e anda - nao ha manobra a penalizar.
   */
  conversoes: number;
  /** Quantos estados a busca retirou da fila somando tudo: o preco de CPU. */
  expandidos: number;
  ms: number;
  /** Trechos que a busca nao conseguiu ligar. Diferente de zero invalida a medicao. */
  trechosSemCaminho: number;
}

/** MANUAL KNOB - ate onde o entregador anda a pe a partir do veiculo. */
export const LIMITE_CAMINHADA_M = 120;

/** MANUAL KNOB - quantos candidatos passam do filtro barato para a busca cara. */
const TOP_N = 6;

// ---------------------------------------------------------------- comum

/** Mede a caminhada de uma parada: circuito a pe saindo e voltando a ancora. */
const montarParada = (ancora: LatLng, pontos: DeliveryPoint[]): Parada => ({
  ancora,
  pontos: nearestFirstOrder(ancora, pontos, false)
    .map((id) => pontos.find((p) => p.id === id))
    .filter((p): p is DeliveryPoint => p !== undefined),
  maiorCaminhadaM: pontos.reduce((max, p) => Math.max(max, haversine(ancora, p)), 0),
});

interface Trecho {
  metros: number;
  conversoes: number;
  expandidos: number;
  achou: boolean;
}

/**
 * Um trecho de veiculo entre duas ancoras.
 *
 * ⚠️ O grafo passado a busca e o do SEGUNDO match. `matchToGraph` CLONA a
 * adjacencia e insere um no sintetico; o primeiro clone nao conhece o no do
 * segundo. E o mesmo cuidado que `suggestionPath` toma no app - errar isso faz
 * toda busca voltar sem caminho, silenciosamente (medido: a primeira versao
 * deste arnes zerou a tabela inteira por causa disso).
 */
const trechoEntre = (grafo: RoadGraph, de: LatLng, para: LatLng, def: DefinicaoConversao, peso: number): Trecho => {
  const origem = matchToGraph(grafo, de);
  if (!origem) return { metros: 0, conversoes: 0, expandidos: 0, achou: false };
  const destino = matchToGraph(origem.graph, para);
  if (!destino) return { metros: 0, conversoes: 0, expandidos: 0, achou: false };

  const r = buscarComConversao(destino.graph, origem.node, destino.node, def, peso);
  if (!r.caminho) return { metros: 0, conversoes: 0, expandidos: r.expandidos, achou: false };
  return { metros: r.metros, conversoes: r.conversoes, expandidos: r.expandidos, achou: true };
};

/** Percorre as ancoras na ordem dada e soma os trechos. */
const tracarVeiculo = (grafo: RoadGraph, ancoras: LatLng[], def: DefinicaoConversao, peso: number): Omit<Roteiro, "paradas" | "ms"> => {
  let metros = 0;
  let conversoes = 0;
  let expandidos = 0;
  let trechosSemCaminho = 0;

  for (let i = 0; i < ancoras.length - 1; i += 1) {
    const t = trechoEntre(grafo, ancoras[i], ancoras[i + 1], def, peso);
    metros += t.metros;
    conversoes += t.conversoes;
    expandidos += t.expandidos;
    if (!t.achou) trechosSemCaminho += 1;
  }

  return { metrosVeiculo: metros, conversoes, expandidos, trechosSemCaminho };
};

// ---------------------------------------------------------------- baseline

/**
 * Guloso por distancia: a versao barata, e o numero que a outra precisa bater.
 *
 * @param raio - Raio de agrupamento; enderecos dentro dele entram na mesma parada.
 */
export const roteirizarPorDistancia = (grafo: RoadGraph, pontos: DeliveryPoint[], raio: number, def: DefinicaoConversao): Roteiro => {
  const inicio = Date.now();
  const livres = [...pontos];
  const paradas: Parada[] = [];
  let origem: LatLng | null = null;

  while (livres.length > 0) {
    const semente = defaultAnchorSeed(livres, origem);
    if (!semente) break;
    const ancora = suggestVehicleStop(grafo, semente);
    const membros = pointsWithinRadius(ancora, livres, raio);
    const escolhidos = membros.length > 0 ? membros : [semente];

    paradas.push(montarParada(ancora, escolhidos));
    for (const p of escolhidos) {
      const i = livres.findIndex((l) => l.id === p.id);
      if (i >= 0) livres.splice(i, 1);
    }
    origem = ancora;
  }

  /** Peso 0: o baseline nao evita conversao, so a paga. Contamos as que ele faz. */
  const traco = tracarVeiculo(
    grafo,
    paradas.map((p) => p.ancora),
    def,
    0
  );
  return { paradas, ...traco, ms: Date.now() - inicio };
};

// ---------------------------------------------------------------- por conversao

/**
 * Candidatos de ancora LIVRES sobre a rua: para cada endereco descoberto, o
 * ponto projetado na aresta mais proxima. E o que o humano faz a mao ao arrastar
 * o carro para a esquina - so que gerado, e nao um endereco de entrega.
 */
const candidatosDeAncora = (grafo: RoadGraph, descobertos: DeliveryPoint[]): LatLng[] => {
  const vistos = new Set<string>();
  const candidatos: LatLng[] = [];
  for (const p of descobertos) {
    const m = nearestEdge(grafo, p);
    if (!m) continue;
    const chave = `${m.point.lat.toFixed(5)},${m.point.lng.toFixed(5)}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    candidatos.push(m.point);
  }
  return candidatos;
};

/**
 * Roteiriza minimizando conversoes.
 *
 * Duas decisoes, nesta ordem:
 * 1. COBERTURA - ancoras livres escolhidas por cobertura gulosa, cada uma
 *    pegando o maximo de enderecos descobertos dentro do limite de caminhada.
 *    Garante que ninguem fica de fora e ninguem entra duas vezes.
 * 2. ORDEM - a proxima parada e a mais barata pela busca com custo de conversao,
 *    entre os TOP_N mais proximos em linha reta (o mesmo filtro barato que o
 *    `nearestByVehicleGraph` do app usa, pelo mesmo motivo: A* em todos custa caro).
 *
 * @param peso - Quantos metros vale evitar uma conversao.
 */
export const roteirizarPorConversao = (grafo: RoadGraph, pontos: DeliveryPoint[], limiteCaminhada: number, def: DefinicaoConversao, peso: number): Roteiro => {
  const inicio = Date.now();

  // 1. Cobertura.
  const descobertos = [...pontos];
  const paradas: Parada[] = [];
  while (descobertos.length > 0) {
    const candidatos = candidatosDeAncora(grafo, descobertos);
    let melhor: { ancora: LatLng; cobre: DeliveryPoint[] } | null = null;
    for (const ancora of candidatos) {
      const cobre = descobertos.filter((p) => haversine(ancora, p) <= limiteCaminhada);
      if (!melhor || cobre.length > melhor.cobre.length) melhor = { ancora, cobre };
    }
    if (!melhor || melhor.cobre.length === 0) break;

    paradas.push(montarParada(melhor.ancora, melhor.cobre));
    for (const p of melhor.cobre) {
      const i = descobertos.findIndex((d) => d.id === p.id);
      if (i >= 0) descobertos.splice(i, 1);
    }
  }

  // 2. Ordem, pelo custo de virar.
  const restantes = [...paradas];
  const ordenadas: Parada[] = [];
  let atual = restantes.shift();
  let expandidosNaOrdem = 0;

  while (atual) {
    ordenadas.push(atual);
    if (restantes.length === 0) break;

    const daqui = atual.ancora;
    const proximos = [...restantes].sort((a, b) => haversine(daqui, a.ancora) - haversine(daqui, b.ancora)).slice(0, TOP_N);

    let melhorParada = proximos[0];
    let melhorCusto = Infinity;
    for (const cand of proximos) {
      const t = trechoEntre(grafo, daqui, cand.ancora, def, peso);
      expandidosNaOrdem += t.expandidos;
      const custo = t.achou ? t.metros + t.conversoes * peso : Infinity;
      if (custo < melhorCusto) {
        melhorCusto = custo;
        melhorParada = cand;
      }
    }

    restantes.splice(restantes.indexOf(melhorParada), 1);
    atual = melhorParada;
  }

  const traco = tracarVeiculo(
    grafo,
    ordenadas.map((p) => p.ancora),
    def,
    peso
  );
  return { paradas: ordenadas, ...traco, expandidos: traco.expandidos + expandidosNaOrdem, ms: Date.now() - inicio };
};

// ---------------------------------------------------------------- placar

export interface Placar {
  paradas: number;
  conversoes: number;
  kmVeiculo: number;
  maiorCaminhadaM: number;
  /** Enderecos cobertos; tem que bater com o total, senao o roteiro esqueceu alguem. */
  cobertos: number;
  duplicados: number;
  trechosSemCaminho: number;
  expandidos: number;
  ms: number;
}

export const medir = (roteiro: Roteiro): Placar => {
  const ids = roteiro.paradas.flatMap((p) => p.pontos.map((x) => x.id));
  return {
    paradas: roteiro.paradas.length,
    conversoes: roteiro.conversoes,
    kmVeiculo: Math.round((roteiro.metrosVeiculo / 1000) * 100) / 100,
    maiorCaminhadaM: Math.round(roteiro.paradas.reduce((m, p) => Math.max(m, p.maiorCaminhadaM), 0)),
    cobertos: new Set(ids).size,
    duplicados: ids.length - new Set(ids).size,
    trechosSemCaminho: roteiro.trechosSemCaminho,
    expandidos: roteiro.expandidos,
    ms: roteiro.ms,
  };
};
