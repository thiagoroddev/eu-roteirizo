/**
 * TASK-SPIKE-001 - Por que um trecho ainda volta sem caminho.
 *
 * A margem na malha derrubou as falhas de 6 para 1. Este arnes acha a que
 * sobrou e diz se e ilha de mao unica, buraco do OSM, ou erro do arnes. Spike
 * que nao explica o proprio residuo esta escondendo, nao medindo.
 */

import { createRequire } from "node:module";
import { it } from "vitest";
import type { RowData } from "../../src/types";
import { buildDeliveryPoints } from "../../src/utils/routing/points";
import { haversine } from "../../src/utils/routing/geo";
import { matchToGraph } from "../../src/utils/routing/match";
import { aStar } from "../../src/utils/routing/aStar";
import { MALHA, GRAFO_COPACABANA } from "./area";
import { carregarGrafo } from "./grafo";
import { D3_ANGULO_COM_VIA } from "./conversoes";
import { LIMITE_CAMINHADA_M, roteirizarPorConversao } from "./roteirizar";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx") as typeof import("xlsx");

it("localiza e explica os trechos sem caminho", async () => {
  const grafo = await carregarGrafo(MALHA, GRAFO_COPACABANA);
  const wb = XLSX.readFile("public/romaneios/exemplo-rota-grande.xlsx");
  const pontos = buildDeliveryPoints(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: "" }) as RowData[]);

  const roteiro = roteirizarPorConversao(grafo, pontos, LIMITE_CAMINHADA_M, D3_ANGULO_COM_VIA, 150);
  const ancoras = roteiro.paradas.map((p) => p.ancora);

  for (let i = 0; i < ancoras.length - 1; i += 1) {
    const origem = matchToGraph(grafo, ancoras[i]);
    const destino = origem ? matchToGraph(origem.graph, ancoras[i + 1]) : null;
    if (!origem || !destino) {
      console.log(`  trecho ${i}->${i + 1}: map matching falhou`);
      continue;
    }
    const comConversao = aStar(destino.graph, origem.node, destino.node);
    if (comConversao.path) continue;

    /** Sem caminho. E mao unica, ou o destino esta fora do componente conexo? */
    const volta = aStar(destino.graph, destino.node, origem.node);
    console.log(`  trecho ${i}->${i + 1} SEM CAMINHO`);
    console.log(`    de   ${ancoras[i].lat.toFixed(5)}, ${ancoras[i].lng.toFixed(5)}`);
    console.log(`    para ${ancoras[i + 1].lat.toFixed(5)}, ${ancoras[i + 1].lng.toFixed(5)}`);
    console.log(`    linha reta: ${haversine(ancoras[i], ancoras[i + 1]).toFixed(0)} m`);
    console.log(`    caminho na VOLTA existe? ${volta.path ? `sim, ${volta.distance.toFixed(0)} m` : "nao"}`);
    console.log(`    => ${volta.path ? "ilha de mao unica: da para chegar, nao para sair" : "componente desconexo na malha"}`);
  }
});
