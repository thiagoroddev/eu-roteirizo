/**
 * TASK-SPIKE-001 - Conferencia por inspecao.
 *
 * Antes de medir sobre 120 enderecos e uma malha de 2653 arestas, a contagem
 * precisa estar certa num grafo onde da para conferir de cabeca. Usa o
 * `syntheticGraph` da suite: um quarteirao com quatro nos.
 *
 *     A(1) --Rua AB, mao unica A->B-- B(2)
 *      |                              |
 *   Rua AC                         Rua BD
 *      |                              |
 *     C(3) ------- Rua CD --------- D(4)
 */

import { expect, it } from "vitest";
import { A, B, C, D, squareGraph } from "../../src/__tests__/utils/routing/__fixtures__/syntheticGraph";
import { contarConversoes, buscarComConversao, difAngular, D1_NOME_DA_VIA, D2_ANGULO, D3_ANGULO_COM_VIA } from "./conversoes";

const grafo = squareGraph;

it("difAngular fecha pelo lado curto", () => {
  expect(difAngular(10, 350)).toBe(20);
  expect(difAngular(0, 180)).toBe(180);
  expect(difAngular(90, 90)).toBe(0);
});

it("virar a esquina conta 1 nas tres definicoes", () => {
  // A->B->D: desce a Rua AB, vira na Rua BD. Uma esquina, um angulo reto.
  for (const def of [D1_NOME_DA_VIA, D2_ANGULO, D3_ANGULO_COM_VIA]) {
    expect(contarConversoes(grafo, [A, B, D], def)).toBe(1);
  }
});

it("caminho sem vertice intermediario nao tem conversao", () => {
  for (const def of [D1_NOME_DA_VIA, D2_ANGULO, D3_ANGULO_COM_VIA]) {
    expect(contarConversoes(grafo, [A, B], def)).toBe(0);
  }
});

it("duas esquinas contam 2", () => {
  // A->C->D->B: Rua AC, vira na Rua CD, vira na Rua BD.
  for (const def of [D1_NOME_DA_VIA, D2_ANGULO, D3_ANGULO_COM_VIA]) {
    expect(contarConversoes(grafo, [A, C, D, B], def)).toBe(2);
  }
});

it("a busca respeita mao unica: B->A so pela volta", () => {
  // A Rua AB e mao unica A->B, entao voltar exige B->D->C->A.
  const r = buscarComConversao(grafo, B, A, D3_ANGULO_COM_VIA, 0);
  expect(r.caminho).toEqual([B, D, C, A]);
  expect(r.conversoes).toBe(2);
  console.log(`  B->A: ${r.metros.toFixed(1)} m, ${r.conversoes} conversoes, ${r.expandidos} estados`);
});

it("com peso zero a busca acha o mesmo caminho do A* do app", () => {
  const r = buscarComConversao(grafo, A, D, D3_ANGULO_COM_VIA, 0);
  expect(r.caminho?.[0]).toBe(A);
  expect(r.caminho?.[r.caminho.length - 1]).toBe(D);
  console.log(`  A->D peso 0: ${r.caminho?.join("->")}, ${r.metros.toFixed(1)} m, ${r.conversoes} conversoes`);
});
