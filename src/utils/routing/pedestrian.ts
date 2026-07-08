/**
 * utils/routing/pedestrian.ts - Walking variant of the road graph (TASK-RF-006.3).
 *
 * A pedestrian ignores one-way restrictions (RN-18): the courier walks against
 * traffic freely inside a stop or towards the next one. The engine's graph is
 * directed with "one-way = missing edge" (ADR-002), so the walking variant just
 * ADDS the missing reverse edges. Pure — the original graph is not mutated.
 *
 * Cost: one adjacency clone per graph load; callers memoize (the graph changes
 * only when the OSM load finishes).
 */

import type { Edge, NodeId, RoadGraph } from "./graph";

/**
 * Returns a walking graph: every edge becomes traversable in both directions.
 *
 * @param graph - The directed (vehicle) road graph.
 * @returns A new graph with the missing reverse edges added.
 */
export const pedestrianGraph = (graph: RoadGraph): RoadGraph => {
  const coords = new Map(graph.coords);
  const adj = new Map<NodeId, Edge[]>();
  for (const [from, edges] of graph.adj) adj.set(from, edges.slice());

  for (const [from, edges] of graph.adj) {
    for (const edge of edges) {
      const back = adj.get(edge.to);
      const hasReverse = back?.some((e) => e.to === from) ?? false;
      if (hasReverse) continue;
      const reversed: Edge = { to: from, weight: edge.weight, wayName: edge.wayName };
      if (back) back.push(reversed);
      else adj.set(edge.to, [reversed]);
    }
  }

  return { coords, adj };
};
