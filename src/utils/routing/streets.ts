/**
 * utils/routing/streets.ts - Street names along a routed path.
 *
 * Ported from the prototype (TASK-RF-001). Pure: no fetch/Leaflet/DOM.
 */

import type { NodeId, RoadGraph } from "./graph";

/**
 * Lists, in order, the street names traversed by a path, collapsing consecutive
 * repeats (walking three blocks down "Rua A" lists "Rua A" once).
 *
 * @param graph - The road graph (used to look up each edge's `wayName`).
 * @param path - A sequence of node ids (e.g. the result of `aStar`).
 * @returns Ordered, de-duplicated street names; `[]` for a path with < 2 nodes.
 */
export const streetsAlong = (graph: RoadGraph, path: NodeId[]): string[] => {
  const names: string[] = [];
  for (let i = 0; i < path.length - 1; i++) {
    const edge = (graph.adj.get(path[i]) ?? []).find((e) => e.to === path[i + 1]);
    const name = edge ? edge.wayName : "via";
    if (name !== names[names.length - 1]) names.push(name);
  }
  return names;
};

/**
 * Normaliza o nome de uma via/logradouro para comparação de equivalência.
 * Remove acentos, caracteres não-alfanuméricos e prefixos comuns brasileiros.
 *
 * Morava em `utils/markers/roteiroModels.ts` até a TASK-BG-016; é lógica de
 * domínio de rua, e `routing/` precisa dela para escolher a parada padrão —
 * `routing` não pode depender de `markers` (markers é view-model).
 */
export const normalizeStreetName = (name: string): string => {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\./g, " ")
    .replace(/\b(rua|r|avenida|av|travessa|tv|alameda|al|praca|praça|pc|estrada|est|rodovia|rod|via|beco|largo)\b/g, "")
    .replace(/[^a-z0-9]/g, "")
    .trim();
};

/**
 * Se dois nomes de via são o mesmo logradouro. Nome vazio dos dois lados
 * responde `true` de propósito: sem dado para discordar, o rótulo não deve
 * inventar divergência. ⚠️ Quem usa isso para DECIDIR (e não só rotular) precisa
 * checar o nome vazio antes — ver `defaultVehicleStop` (TASK-BG-016).
 */
export const isSameStreetName = (streetA: string, streetB: string): boolean => {
  const normA = normalizeStreetName(streetA);
  const normB = normalizeStreetName(streetB);
  if (!normA || !normB) return true;
  return normA === normB || normA.includes(normB) || normB.includes(normA);
};

/**
 * O logradouro de um endereço do romaneio: o primeiro termo antes da vírgula
 * ("Avenida Vieira Souto, 620, Apt 703" → "Avenida Vieira Souto"). Vazio quando
 * o endereço não tem texto aproveitável.
 */
export const streetNameOf = (address: string): string => (address || "").split(",")[0]?.trim() ?? "";
