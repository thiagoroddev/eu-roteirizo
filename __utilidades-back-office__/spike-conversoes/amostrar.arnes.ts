/**
 * TASK-SPIKE-001 - Amostra os enderecos da rota L-31 sobre a malha REAL.
 *
 * Roda uma vez e grava `romaneios/enderecos-l31.json`. O gerador de romaneio
 * le esse arquivo e continua offline, que e o que se espera de um script cuja
 * funcao e regenerar planilha versionada.
 *
 * Por que amostrar em vez de escrever 120 coordenadas a mao: o spike conta
 * CONVERSAO, e conversao so existe sobre rua de verdade. Endereco inventado
 * cairia fora da malha, o map matching o jogaria para a rua mais proxima, e a
 * medicao estaria medindo o erro da invencao.
 *
 * DADOS FICTICIOS. A rua e real (vem do OSM, e por isso o mapa responde);
 * numero, CEP, pacote, codigo e tipo sao inventados. Nenhum dado de entrega
 * real foi usado - mesma regra do romaneio de exemplo que ja existe.
 */

import { writeFileSync } from "node:fs";
import { it } from "vitest";
import { haversine } from "../../src/utils/routing/geo";
import type { LatLng } from "../../src/types/routing";
import { AMOSTRAGEM, MALHA, GRAFO_COPACABANA } from "./area";
import { carregarGrafo } from "./grafo";

/** Quantos enderecos. O produto mira 70 a 150 (fluxo-roteirizacao secao 1). */
const QUANTOS = 120;

/** Distancia minima entre dois enderecos: abaixo disso viram um ponto so. */
const SEPARACAO_MINIMA_M = 25;

/**
 * PRNG com semente (mulberry32). Deterministico de proposito: a medicao do
 * spike precisa ser refeita e dar o mesmo numero, senao nao e medicao.
 */
const aleatorio = (semente: number): (() => number) => {
  let s = semente;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const TIPOS = ["HOME", "HOME", "HOME", "OFFICE"] as const;

interface EnderecoAmostrado {
  endereco: string;
  bairro: string;
  lat: number;
  lng: number;
  tipo: string;
  cep: string;
  pedidos: number;
}

it("amostra a rota L-31 sobre a malha de Copacabana", async () => {
  const grafo = await carregarGrafo(MALHA, GRAFO_COPACABANA);
  const rand = aleatorio(20260902);

  /** So arestas com nome de rua de verdade: "via" e o fallback de `buildGraph`. */
  const candidatas: { de: LatLng; para: LatLng; via: string }[] = [];
  for (const [de, arestas] of grafo.adj) {
    const origem = grafo.coords.get(de);
    if (!origem) continue;
    for (const aresta of arestas) {
      const destino = grafo.coords.get(aresta.to);
      if (!destino) continue;
      if (aresta.wayName === "via" || !/^(Rua|Avenida|Travessa|Praca|Ladeira|Estrada) /i.test(aresta.wayName)) continue;
      /** A malha tem margem; os enderecos ficam so na area interna (ver area.ts). */
      const meioLat = (origem.lat + destino.lat) / 2;
      const meioLng = (origem.lng + destino.lng) / 2;
      if (meioLat < AMOSTRAGEM.south || meioLat > AMOSTRAGEM.north || meioLng < AMOSTRAGEM.west || meioLng > AMOSTRAGEM.east) continue;
      candidatas.push({ de: origem, para: destino, via: aresta.wayName });
    }
  }
  console.log(`  arestas com nome de rua utilizavel: ${candidatas.length}`);

  const escolhidos: EnderecoAmostrado[] = [];
  const numeroPorVia = new Map<string, number>();
  let tentativas = 0;

  while (escolhidos.length < QUANTOS && tentativas < QUANTOS * 400) {
    tentativas += 1;
    const c = candidatas[Math.floor(rand() * candidatas.length)];
    /** Um ponto ao longo do segmento, afastado das pontas para nao cair na esquina. */
    const t = 0.2 + rand() * 0.6;
    const ponto: LatLng = { lat: c.de.lat + (c.para.lat - c.de.lat) * t, lng: c.de.lng + (c.para.lng - c.de.lng) * t };

    if (escolhidos.some((e) => haversine(e, ponto) < SEPARACAO_MINIMA_M)) continue;

    const proximoNumero = (numeroPorVia.get(c.via) ?? 0) + 2 + Math.floor(rand() * 60);
    numeroPorVia.set(c.via, proximoNumero);
    const tipo = TIPOS[Math.floor(rand() * TIPOS.length)];
    const complemento = tipo === "OFFICE" ? `, Loja ${1 + Math.floor(rand() * 40)}` : `, Apto ${100 + Math.floor(rand() * 900)}`;

    escolhidos.push({
      endereco: `${c.via}, ${proximoNumero}${complemento}`,
      bairro: "Copacabana",
      lat: Number(ponto.lat.toFixed(6)),
      lng: Number(ponto.lng.toFixed(6)),
      tipo,
      cep: `22${(10 + Math.floor(rand() * 80)).toString().padStart(3, "0")}-${(100 + Math.floor(rand() * 900)).toString()}`,
      pedidos: 1 + Math.floor(rand() * rand() * 5),
    });
  }

  const vias = new Set(escolhidos.map((e) => e.endereco.split(",")[0]));
  console.log(`  amostrados ${escolhidos.length} enderecos em ${vias.size} ruas, ${tentativas} tentativas`);
  console.log(`  pacotes: ${escolhidos.reduce((s, e) => s + e.pedidos, 0)}`);

  writeFileSync("romaneios/enderecos-l31.json", `${JSON.stringify(escolhidos, null, 2)}\n`, "utf8");
  console.log("  gravado em romaneios/enderecos-l31.json");
});
