/**
 * TASK-SPIKE-001 · Malha viaria em cache de ARQUIVO.
 *
 * O `graphCache` do app nao serve aqui: e IndexedDB, so navegador. E buscar no
 * Overpass a cada medicao nao serve por dois motivos - a API publica e
 * rate-limited (DT-005), e a medicao precisa ser refeita muitas vezes, entao a
 * rede viraria a variavel dominante.
 *
 * ⚠️ Nao usa `fetchRoadGraph` de proposito. Aquela funcao nao envia
 * `User-Agent`, porque no navegador o proprio browser poe um; do Node o
 * Overpass responde 406 (medido). As partes que importam - `buildOverpassQuery`
 * e `buildGraph` - sao puras e sao reusadas aqui.
 *
 * Codigo de spike: descartavel por definicao (processos/teste.md).
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import type { Edge, NodeId, OsmElement, RoadGraph } from "../../src/utils/routing/graph";
import { buildGraph, countEdges } from "../../src/utils/routing/graph";
import type { BBox } from "../../src/utils/routing/osm";
import { bboxAreaKm2, buildOverpassQuery } from "../../src/utils/routing/osm";
import type { LatLng } from "../../src/types/routing";

const ENDPOINT = "https://overpass-api.de/api/interpreter";

/** A politica de uso do Overpass pede um agente que identifique quem chama. */
const USER_AGENT = "eu-roteirizo-spike/0.1 (TASK-SPIKE-001; https://github.com/thiagoroddev/eu-roteirizo)";

/** O `RoadGraph` e feito de `Map`, que `JSON.stringify` serializa como `{}`. */
interface GrafoSerializado {
  coords: [NodeId, LatLng][];
  adj: [NodeId, Edge[]][];
}

const desserializar = (bruto: GrafoSerializado): RoadGraph => ({
  coords: new Map(bruto.coords),
  adj: new Map(bruto.adj),
});

/**
 * Le a malha do arquivo, ou busca no Overpass e grava. Da segunda execucao em
 * diante nao toca a rede.
 *
 * @param bbox - Area a consultar; bbox de bairro, nunca de cidade.
 * @param arquivo - Caminho do cache JSON.
 * @returns O grafo dirigido, com mao unica ja aplicada por `buildGraph`.
 */
export const carregarGrafo = async (bbox: BBox, arquivo: string): Promise<RoadGraph> => {
  if (existsSync(arquivo)) {
    const grafo = desserializar(JSON.parse(readFileSync(arquivo, "utf8")) as GrafoSerializado);
    console.log(`  malha do cache: ${grafo.coords.size} nos, ${countEdges(grafo)} arestas dirigidas`);
    return grafo;
  }

  console.log(`  buscando malha no Overpass (${bboxAreaKm2(bbox).toFixed(2)} km2) - so na primeira vez...`);
  const inicio = Date.now();
  const resposta = await fetch(ENDPOINT, {
    method: "POST",
    body: "data=" + encodeURIComponent(buildOverpassQuery(bbox)),
    headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": USER_AGENT },
  });
  if (!resposta.ok) throw new Error(`Overpass respondeu ${resposta.status} ${resposta.statusText}`);

  const corpo = await resposta.text();
  const grafo = buildGraph((JSON.parse(corpo) as { elements?: OsmElement[] }).elements ?? []);

  mkdirSync(dirname(arquivo), { recursive: true });
  const serializado: GrafoSerializado = { coords: [...grafo.coords.entries()], adj: [...grafo.adj.entries()] };
  writeFileSync(arquivo, JSON.stringify(serializado), "utf8");

  console.log(
    `  malha baixada em ${Date.now() - inicio} ms: ${grafo.coords.size} nos, ${countEdges(grafo)} arestas, ` +
      `resposta ${Math.round(corpo.length / 1024)} KB, cache ${Math.round(Buffer.byteLength(JSON.stringify(serializado)) / 1024)} KB`
  );
  return grafo;
};
