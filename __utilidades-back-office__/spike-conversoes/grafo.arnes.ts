import { it } from "vitest";
import { countEdges } from "../../src/utils/routing/graph";
import { MALHA, GRAFO_COPACABANA } from "./area";
import { carregarGrafo } from "./grafo";

it("carrega a malha de Copacabana e descreve o terreno", async () => {
  const grafo = await carregarGrafo(MALHA, GRAFO_COPACABANA);
  const graus = [...grafo.adj.values()].map((e) => e.length);
  const grauMedio = graus.reduce((s, g) => s + g, 0) / graus.length;
  const nomes = new Set([...grafo.adj.values()].flat().map((e) => e.wayName));
  console.log(`  nos=${grafo.coords.size} arestas=${countEdges(grafo)} grau medio=${grauMedio.toFixed(2)}`);
  console.log(`  nomes de via distintos=${nomes.size}, sem nome ("via")=${nomes.has("via") ? "sim" : "nao"}`);
});
