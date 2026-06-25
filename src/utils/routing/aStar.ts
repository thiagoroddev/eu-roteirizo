/**
 * utils/routing/aStar.ts - Shortest path over the directed road graph.
 *
 * A* guided by straight-line distance to the goal (admissible heuristic ⇒ the
 * returned path is optimal). One-way restrictions need no special handling: a
 * forbidden edge simply isn't in the graph, so it is never traversed.
 *
 * Ported from the prototype (TASK-RF-001). This is the didactic version with a
 * LINEAR frontier scan; a binary min-heap replaces it in TASK-RF-005.4.
 */

import type { NodeId, RoadGraph } from "./graph";
import { haversine } from "./geo";

/** Result of an A* search: the node path (null if unreachable) and total meters. */
export interface AStarResult {
  path: NodeId[] | null;
  distance: number;
}

/**
 * Finds the shortest directed path from `startId` to `goalId`.
 *
 * Returns `{ path: null, distance: Infinity }` when there is no path — including
 * when either endpoint is absent from the graph (guards the prototype's latent
 * crash where a missing goal made the heuristic dereference `undefined`).
 *
 * @param graph - The directed road graph.
 * @param startId - Start node id.
 * @param goalId - Goal node id.
 * @returns The path (node ids, start→goal) and its length in meters.
 */
export const aStar = (graph: RoadGraph, startId: NodeId, goalId: NodeId): AStarResult => {
  const { coords, adj } = graph;
  const goal = coords.get(goalId);
  /** Either endpoint missing → no path (and never dereference an absent goal). */
  if (!coords.has(startId) || !goal) return { path: null, distance: Infinity };

  const heuristic = (id: NodeId): number => {
    const c = coords.get(id);
    return c ? haversine(c, goal) : 0;
  };

  const gScore = new Map<NodeId, number>([[startId, 0]]);
  const fScore = new Map<NodeId, number>([[startId, heuristic(startId)]]);
  const cameFrom = new Map<NodeId, NodeId>();
  const open = new Set<NodeId>([startId]);

  while (open.size > 0) {
    /** Pick the open node with the lowest f-score (linear scan — heap in 005.4). */
    let current: NodeId | null = null;
    let bestF = Infinity;
    for (const id of open) {
      const f = fScore.get(id) ?? Infinity;
      if (f < bestF) {
        bestF = f;
        current = id;
      }
    }
    if (current === null) break;

    if (current === goalId) {
      const path: NodeId[] = [current];
      let step: NodeId = current;
      while (cameFrom.has(step)) {
        step = cameFrom.get(step) as NodeId;
        path.unshift(step);
      }
      return { path, distance: gScore.get(goalId) ?? Infinity };
    }

    open.delete(current);
    for (const edge of adj.get(current) ?? []) {
      const tentative = (gScore.get(current) ?? Infinity) + edge.weight;
      if (tentative < (gScore.get(edge.to) ?? Infinity)) {
        cameFrom.set(edge.to, current);
        gScore.set(edge.to, tentative);
        fScore.set(edge.to, tentative + heuristic(edge.to));
        open.add(edge.to);
      }
    }
  }

  return { path: null, distance: Infinity };
};
