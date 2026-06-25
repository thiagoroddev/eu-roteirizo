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
