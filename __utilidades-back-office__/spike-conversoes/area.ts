/**
 * TASK-SPIKE-001 - A area de medicao, num lugar so.
 *
 * Copacabana e o caso alvo do produto: quadras curtas, entrega a pe, o bairro
 * das capturas do README e do romaneio de exemplo. Bbox de bairro, nunca de
 * cidade - a propria `osm.ts` avisa que bbox de cidade estoura o grafo.
 *
 * DUAS areas, e a diferenca entre elas e metodologica:
 *
 * - `AMOSTRAGEM` e onde os enderecos moram.
 * - `MALHA` e a mesma coisa com margem, e e o que se busca no Overpass.
 *
 * O Overpass RECORTA as vias no limite do bbox. Sem margem, toda rua que sai da
 * area vira beco sem saida, e o A* nao acha caminho entre ancoras perto da
 * borda. Medido: com bbox justo, 6 dos 56 trechos do baseline voltaram sem
 * caminho, o que tirava metros e conversoes da conta e enviesava a comparacao.
 */

import type { BBox } from "../../src/utils/routing/osm";

/** Onde os enderecos da L-31 foram amostrados. */
export const AMOSTRAGEM: BBox = { south: -22.98, west: -43.195, north: -22.962, east: -43.175 };

/** MANUAL KNOB - margem em graus (~0.004 = ~440 m) para a malha nao terminar em beco. */
const MARGEM = 0.004;

/** O que se busca no Overpass: a area de amostragem mais a margem. */
export const MALHA: BBox = {
  south: AMOSTRAGEM.south - MARGEM,
  west: AMOSTRAGEM.west - MARGEM,
  north: AMOSTRAGEM.north + MARGEM,
  east: AMOSTRAGEM.east + MARGEM,
};

/** Cache local da malha. Fora do Git: se apagar, a proxima execucao rebaixa. */
export const GRAFO_COPACABANA = "__utilidades-back-office__/spike-conversoes/.cache/copacabana-com-margem.json";
