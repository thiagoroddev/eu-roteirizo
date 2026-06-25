/**
 * utils/routing/aStar.ts - Shortest path over the directed road graph.
 *
 * A* guided by straight-line distance to the goal (admissible AND consistent
 * heuristic ⇒ the returned path is optimal). One-way restrictions need no
 * special handling: a forbidden edge isn't in the graph, so it's never used.
 *
 * The frontier is a binary min-heap (TASK-RF-005.4) — O(log n) push/pop instead
 * of the original linear scan (TASK-RF-005.1), with identical results. Stale
 * heap entries (a node re-pushed at a lower priority) are skipped lazily via the
 * `settled` set; the consistent heuristic guarantees each node is settled once
 * at its optimal cost.
 */

import type { NodeId, RoadGraph } from "./graph";
import { haversine } from "./geo";
import { MinHeap } from "./minHeap";

/** Result of an A* search: the node path (null if unreachable) and total meters. */
export interface AStarResult {
  path: NodeId[] | null;
  distance: number;
}

/** A frontier entry: a node and its f-score (g + heuristic). */
interface Frontier {
  node: NodeId;
  priority: number;
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
  const cameFrom = new Map<NodeId, NodeId>();
  const settled = new Set<NodeId>();
  const open = new MinHeap<Frontier>((a, b) => a.priority - b.priority);
  open.push({ node: startId, priority: heuristic(startId) });

  while (open.size > 0) {
    const current = open.pop();
    if (!current) break;
    const node = current.node;
    /** Lazy deletion: an outdated duplicate of an already-settled node. */
    if (settled.has(node)) continue;

    if (node === goalId) {
      const path: NodeId[] = [node];
      let step: NodeId = node;
      while (cameFrom.has(step)) {
        step = cameFrom.get(step) as NodeId;
        path.unshift(step);
      }
      return { path, distance: gScore.get(goalId) ?? Infinity };
    }

    settled.add(node);
    for (const edge of adj.get(node) ?? []) {
      if (settled.has(edge.to)) continue;
      const tentative = (gScore.get(node) ?? Infinity) + edge.weight;
      if (tentative < (gScore.get(edge.to) ?? Infinity)) {
        cameFrom.set(edge.to, node);
        gScore.set(edge.to, tentative);
        open.push({ node: edge.to, priority: tentative + heuristic(edge.to) });
      }
    }
  }

  return { path: null, distance: Infinity };
};
