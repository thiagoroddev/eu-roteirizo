/**
 * Gera o romaneio de exemplo usado para testar o app e para as capturas do README.
 *
 * Rode a partir da raiz do projeto:
 *   node romaneios/gerar-romaneio-exemplo.mjs
 *
 * Existe para que a planilha versionada não seja um binário sem procedência: se as
 * colunas esperadas mudarem (`COLUMN_NAMES` em src/constants/index.ts), regenere aqui.
 *
 * ⚠️ Dados 100% fictícios. Nomes de logradouro e coordenadas são de vias públicas reais
 * de Copacabana/Ipanema — necessário para que a malha do OpenStreetMap responda e o
 * mapa faça sentido —, mas números, pacotes, destinatários e códigos são inventados.
 * Nenhum dado de entrega real, de cliente ou de operação foi usado.
 */
import { createRequire } from "node:module";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const XLSX = require("xlsx");

// As planilhas vivem em `public/romaneios/` — de lá são servidas pelo app (o botão
// "Testar com romaneio de exemplo", TASK-RF-014) e ficam baixáveis pela URL publicada.
// Este script fica fora de `public/` de propósito: é ferramenta, não vai para o build.
const DESTINO = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "romaneios");

const linha = (o) => ({
  "Corridor Cage": o.cage,
  Sequence: o.seq,
  Stop: o.stop,
  "Num of Order": o.pedidos,
  "Total Distance": "8.412km",
  Zipcode: o.cep,
  Date: "2026-07-27",
  "Shift Time": "08:00-13:00",
  "Destination Address": o.endereco,
  City: "Rio de Janeiro",
  Neighborhood: o.bairro,
  Latitude: o.lat,
  Longitude: o.lng,
  "Delivery Time": "4h00min",
  "Location Type": o.tipo,
  "Planned AT": "AT202607270DEMO",
  "Destination Station": "LM Hub_RJ_Demo",
  "Planned Vehicle Type": "MOTO",
  "SPX TN": o.tn,
});

/** Rota L-29 — miolo de Copacabana. Quadras curtas: bom caso para roteiro a pé. */
const L29 = [
  { endereco: "Rua Barata Ribeiro, 200, Apto 501", bairro: "Copacabana", lat: -22.9668, lng: -43.1789, tipo: "HOME", cep: "22040-000", pedidos: 2 },
  { endereco: "Rua Barata Ribeiro, 370", bairro: "Copacabana", lat: -22.9679, lng: -43.1801, tipo: "HOME", cep: "22040-001", pedidos: 1 },
  { endereco: "Rua Siqueira Campos, 143, Loja 12", bairro: "Copacabana", lat: -22.9662, lng: -43.1824, tipo: "OFFICE", cep: "22031-070", pedidos: 4 },
  { endereco: "Rua Tonelero, 288, Apto 802", bairro: "Copacabana", lat: -22.9691, lng: -43.1836, tipo: "HOME", cep: "22030-002", pedidos: 1 },
  { endereco: "Rua Tonelero, 310", bairro: "Copacabana", lat: -22.9697, lng: -43.1841, tipo: "HOME", cep: "22030-003", pedidos: 3 },
  { endereco: "Avenida Nossa Senhora de Copacabana, 861, Sala 4", bairro: "Copacabana", lat: -22.9705, lng: -43.1852, tipo: "OFFICE", cep: "22060-001", pedidos: 2 },
  { endereco: "Avenida Nossa Senhora de Copacabana, 1010, Apto 1201", bairro: "Copacabana", lat: -22.9722, lng: -43.1868, tipo: "HOME", cep: "22060-002", pedidos: 1 },
  { endereco: "Rua Bolívar, 45", bairro: "Copacabana", lat: -22.9738, lng: -43.1861, tipo: "HOME", cep: "22061-020", pedidos: 2 },
  { endereco: "Rua Santa Clara, 120, Apto 304", bairro: "Copacabana", lat: -22.9711, lng: -43.1889, tipo: "HOME", cep: "22041-010", pedidos: 1 },
  { endereco: "Rua Domingos Ferreira, 220, Loja A", bairro: "Copacabana", lat: -22.9744, lng: -43.1879, tipo: "OFFICE", cep: "22050-010", pedidos: 5 },
  { endereco: "Rua Figueiredo Magalhães, 286", bairro: "Copacabana", lat: -22.9686, lng: -43.1858, tipo: "HOME", cep: "22031-011", pedidos: 1 },
  { endereco: "Rua Xavier da Silveira, 34, Apto 202", bairro: "Copacabana", lat: -22.9757, lng: -43.1873, tipo: "HOME", cep: "22061-010", pedidos: 2 },
];

/** Rota L-30 — Ipanema. Menor, para exercitar a troca de rota dentro do mesmo romaneio. */
const L30 = [
  { endereco: "Rua Visconde de Pirajá, 550, Loja 8", bairro: "Ipanema", lat: -22.9843, lng: -43.2058, tipo: "OFFICE", cep: "22410-002", pedidos: 3 },
  { endereco: "Rua Visconde de Pirajá, 414, Apto 703", bairro: "Ipanema", lat: -22.9838, lng: -43.2041, tipo: "HOME", cep: "22410-003", pedidos: 1 },
  { endereco: "Rua Farme de Amoedo, 76", bairro: "Ipanema", lat: -22.9862, lng: -43.2049, tipo: "HOME", cep: "22420-020", pedidos: 2 },
  { endereco: "Rua Barão da Torre, 219, Apto 401", bairro: "Ipanema", lat: -22.9851, lng: -43.2033, tipo: "HOME", cep: "22411-001", pedidos: 1 },
  { endereco: "Rua Teixeira de Melo, 53", bairro: "Ipanema", lat: -22.9856, lng: -43.2065, tipo: "HOME", cep: "22410-010", pedidos: 4 },
  { endereco: "Rua Prudente de Morais, 729, Sala 2", bairro: "Ipanema", lat: -22.9847, lng: -43.2079, tipo: "OFFICE", cep: "22420-042", pedidos: 2 },
  { endereco: "Rua Garcia d'Ávila, 149, Apto 1001", bairro: "Ipanema", lat: -22.9831, lng: -43.2087, tipo: "HOME", cep: "22421-010", pedidos: 1 },
  { endereco: "Rua Aníbal de Mendonça, 55", bairro: "Ipanema", lat: -22.9825, lng: -43.2104, tipo: "HOME", cep: "22410-050", pedidos: 3 },
];

const linhas = [];
let tn = 1000;
L29.forEach((e, i) => linhas.push(linha({ ...e, cage: "L-29", seq: i + 1, stop: i + 1, tn: `BR${++tn}DEMO` })));
L30.forEach((e, i) => linhas.push(linha({ ...e, cage: "L-30", seq: i + 1, stop: i + 1, tn: `BR${++tn}DEMO` })));

// Multi-rota: com a coluna "Corridor Cage" presente, o app agrupa em L-29 e L-30.
const multi = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(multi, XLSX.utils.json_to_sheet(linhas), "Romaneio");
writeFileSync(join(DESTINO, "exemplo-multi-rota.xlsx"), XLSX.write(multi, { type: "buffer", bookType: "xlsx" }));

// Rota única: sem "Corridor Cage", o app trata o arquivo inteiro como uma rota só.
const soUma = linhas
  .filter((l) => l["Corridor Cage"] === "L-29")
  .map((l) => {
    const copia = { ...l };
    delete copia["Corridor Cage"];
    return copia;
  });
const unica = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(unica, XLSX.utils.json_to_sheet(soUma), "Romaneio");
writeFileSync(join(DESTINO, "exemplo-rota-unica.xlsx"), XLSX.write(unica, { type: "buffer", bookType: "xlsx" }));

// Rota GRANDE (L-31), do tamanho do caso real: 70 a 150 endereços (fluxo-roteirizacao §1).
// As doze linhas da L-29 servem para ver o fluxo; não servem para MEDIR algoritmo, que é
// para o que esta existe (TASK-SPIKE-001).
//
// Os endereços vêm de `enderecos-l31.json`, amostrado UMA vez sobre a malha real do
// OpenStreetMap de Copacabana — assim todo ponto cai numa rua que existe, sem inventar
// coordenada. O amostrador vive em `__utilidades-back-office__/spike-conversoes/` e é código
// de spike; este gerador continua offline, lendo só o JSON. Regerar o JSON só faz sentido se
// a área mudar. Dados fictícios pela mesma regra das outras duas: rua real, resto inventado.
const L31 = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "enderecos-l31.json"), "utf8"));
const linhasGrande = L31.map((e, i) => linha({ ...e, cage: "L-31", seq: i + 1, stop: i + 1, tn: `BR${9000 + i}DEMO` }));
const grande = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(grande, XLSX.utils.json_to_sheet(linhasGrande), "Romaneio");
writeFileSync(join(DESTINO, "exemplo-rota-grande.xlsx"), XLSX.write(grande, { type: "buffer", bookType: "xlsx" }));

console.log(`OK
  exemplo-multi-rota.xlsx  → ${linhas.length} linhas, 2 rotas (L-29 Copacabana, L-30 Ipanema)
  exemplo-rota-unica.xlsx  → ${soUma.length} linhas, sem coluna "Corridor Cage"
  exemplo-rota-grande.xlsx → ${linhasGrande.length} linhas, rota L-31 (Copacabana), tamanho do caso real`);
