/**
 * TASK-SPIKE-001 - A medicao que responde a pergunta do spike.
 *
 *   Qual definicao de conversao e qual busca produzem, sobre uma rota de ~120
 *   enderecos em Copacabana, um roteiro com menos conversoes que o guloso por
 *   distancia - e a que custo de CPU?
 *
 * Roda os dois roteirizadores sobre o mesmo corpus, com a mesma restricao de
 * caminhada, variando a definicao de conversao e o peso. Imprime a tabela e
 * grava o relatorio.
 */

import { writeFileSync } from "node:fs";
import { it } from "vitest";
import { createRequire } from "node:module";
import type { RowData } from "../../src/types";
import { buildDeliveryPoints } from "../../src/utils/routing/points";
import { MALHA, GRAFO_COPACABANA } from "./area";
import { carregarGrafo } from "./grafo";
import { DEFINICOES } from "./conversoes";
import { LIMITE_CAMINHADA_M, medir, roteirizarPorConversao, roteirizarPorDistancia, type Placar } from "./roteirizar";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx") as typeof import("xlsx");

/** Quantos metros vale evitar uma conversao. 0 = so distancia, como o app hoje. */
const PESOS = [0, 50, 150, 400];

/**
 * Android de entrada roda de 3 a 5x mais devagar que este desktop em JS puro.
 * O spike mede aqui e declara o fator, porque o que decide e a ordem de
 * grandeza: 200 ms vira 1 s, mas 20 s vira um minuto e a busca esta fora.
 */
const FATOR_CELULAR = 4;

const carregarRota = (arquivo: string, rota?: string) => {
  const wb = XLSX.readFile(arquivo);
  const linhas = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" }) as RowData[];
  const daRota = rota === undefined ? linhas : linhas.filter((l) => l["Corridor Cage"] === rota);
  return buildDeliveryPoints(daRota);
};

const linhaTabela = (rotulo: string, p: Placar): string =>
  [
    rotulo.padEnd(30),
    String(p.conversoes).padStart(6),
    `${p.kmVeiculo.toFixed(2)}`.padStart(8),
    String(p.paradas).padStart(8),
    `${p.cobertos}/${p.duplicados}`.padStart(9),
    String(p.maiorCaminhadaM).padStart(9),
    (p.trechosSemCaminho > 0 ? `FALHOU:${p.trechosSemCaminho}` : "ok").padStart(9),
    p.expandidos.toLocaleString("pt-BR").padStart(11),
    `${p.ms}`.padStart(7),
  ].join(" ");

const CABECALHO = [
  "cenario".padEnd(30),
  "conv.".padStart(6),
  "km".padStart(8),
  "paradas".padStart(8),
  "cob/dup".padStart(9),
  "andar m".padStart(9),
  "trechos".padStart(9),
  "estados".padStart(11),
  "ms".padStart(7),
].join(" ");

it("mede: guloso por distancia contra busca por conversao", async () => {
  const grafo = await carregarGrafo(MALHA, GRAFO_COPACABANA);
  const relatorio: string[] = [];
  const registrar = (linha: string): void => {
    console.log(linha);
    relatorio.push(linha);
  };

  const corpora = [
    { nome: "L-31 (120 enderecos)", pontos: carregarRota("public/romaneios/exemplo-rota-grande.xlsx") },
    { nome: "L-29 (12 enderecos)", pontos: carregarRota("public/romaneios/exemplo-multi-rota.xlsx", "L-29") },
  ];

  for (const corpus of corpora) {
    registrar("");
    registrar(`### ${corpus.nome} - ${corpus.pontos.length} pontos, limite de caminhada ${LIMITE_CAMINHADA_M} m`);
    registrar("");
    registrar(CABECALHO);
    registrar("-".repeat(CABECALHO.length));

    for (const def of DEFINICOES) {
      const base = roteirizarPorDistancia(grafo, corpus.pontos, LIMITE_CAMINHADA_M, def);
      const placarBase = medir(base);
      registrar(linhaTabela(`baseline distancia / ${def.nome}`, placarBase));

      for (const peso of PESOS) {
        const r = roteirizarPorConversao(grafo, corpus.pontos, LIMITE_CAMINHADA_M, def, peso);
        const p = medir(r);
        const delta = placarBase.conversoes === 0 ? 0 : Math.round(((p.conversoes - placarBase.conversoes) / placarBase.conversoes) * 100);
        registrar(`${linhaTabela(`  conversao peso ${peso} / ${def.nome}`, p)}  ${delta > 0 ? "+" : ""}${delta}%`);
      }
      registrar("-".repeat(CABECALHO.length));
    }
  }

  registrar("");
  registrar(`Fator declarado para celular: ${FATOR_CELULAR}x o tempo medido aqui.`);
  registrar("cob/dup = enderecos cobertos / cobertos duas vezes. Cobertura tem que bater com o total.");

  writeFileSync("__utilidades-back-office__/spike-conversoes/medicao.txt", `${relatorio.join("\n")}\n`, "utf8");
  console.log("\n  relatorio em __utilidades-back-office__/spike-conversoes/medicao.txt");
});
