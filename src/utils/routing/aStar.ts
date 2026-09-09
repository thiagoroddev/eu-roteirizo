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
import type { LatLng } from "../../types/routing";
import { haversine } from "./geo";
import { MinHeap } from "./minHeap";

const DEG_TO_RAD = Math.PI / 180;

/**
 * Calculates the deflection turn angle (in degrees) between incoming vector p1→p2
 * and outgoing vector p2→p3.
 * 0° = straight ahead, 90° = perpendicular turn, 180° = complete U-turn / reversal.
 */
export const turnAngle = (p1: LatLng, p2: LatLng, p3: LatLng): number => {
  const v1x = (p2.lng - p1.lng) * Math.cos(p1.lat * DEG_TO_RAD);
  const v1y = p2.lat - p1.lat;
  const v2x = (p3.lng - p2.lng) * Math.cos(p2.lat * DEG_TO_RAD);
  const v2y = p3.lat - p2.lat;
  const dot = v1x * v2x + v1y * v2y;
  const mag1 = Math.hypot(v1x, v1y);
  const mag2 = Math.hypot(v2x, v2y);
  if (mag1 === 0 || mag2 === 0) return 0;
  const cos = Math.max(-1, Math.min(1, dot / (mag1 * mag2)));
  return (Math.acos(cos) * 180) / Math.PI;
};

/** Result of an A* search: the node path (null if unreachable) and total meters. */
export interface AStarResult {
  path: NodeId[] | null;
  distance: number;
}

/** A frontier entry: a node, its incoming node, and its f-score (g + heuristic). */
interface Frontier {
  node: NodeId;
  fromNode: NodeId | null;
  priority: number;
}

/**
 * Finds the shortest directed path from `startId` to `goalId`.
 *
 * Employs turn-aware state `(node, fromNode)` to penalize acute-angle U-turns
 * (> 110°) and through-traffic on service ways (e.g. gas stations/alleys)
 * for vehicle routing, while respecting roundabouts and allowing pedestrians
 * unrestricted movement. Returns the real physical distance along the route.
 *
 * Returns `{ path: null, distance: Infinity }` when there is no path — including
 * when either endpoint is absent from the graph.
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

  const stateKey = (node: NodeId, from: NodeId | null): string => `${node}|${from ?? ""}`;

  const gScore = new Map<string, number>([[stateKey(startId, null), 0]]);
  const cameFrom = new Map<string, { node: NodeId; fromNode: NodeId | null }>();
  const settled = new Set<string>();
  const open = new MinHeap<Frontier>((a, b) => a.priority - b.priority);
  open.push({ node: startId, fromNode: null, priority: heuristic(startId) });

  let bestEndState: Frontier | null = null;

  while (open.size > 0) {
    const current = open.pop();
    if (!current) break;
    const { node, fromNode } = current;
    const curKey = stateKey(node, fromNode);
    /** Lazy deletion: an outdated duplicate of an already-settled state. */
    if (settled.has(curKey)) continue;

    if (node === goalId) {
      bestEndState = current;
      break;
    }

    settled.add(curKey);
    const curG = gScore.get(curKey) ?? Infinity;
    const curCoord = coords.get(node);
    const fromCoord = fromNode !== null ? coords.get(fromNode) : null;

    for (const edge of adj.get(node) ?? []) {
      const nextNode = edge.to;
      const nextKey = stateKey(nextNode, node);
      if (settled.has(nextKey)) continue;

      const nextCoord = coords.get(nextNode);
      if (!nextCoord) continue;

      let penalty = 0;
      if (!graph.isPedestrian) {
        if (fromCoord && curCoord && !edge.isRoundabout) {
          const angle = turnAngle(fromCoord, curCoord, nextCoord);
          if (angle > 110) {
            penalty += 1500;
          }
        }
        if (edge.highway === "service" || edge.wayName === "service") {
          penalty += 300;
        }
      }

      const tentative = curG + edge.weight + penalty;
      if (tentative < (gScore.get(nextKey) ?? Infinity)) {
        cameFrom.set(nextKey, { node, fromNode });
        gScore.set(nextKey, tentative);
        open.push({
          node: nextNode,
          fromNode: node,
          priority: tentative + heuristic(nextNode),
        });
      }
    }
  }

  if (!bestEndState) return { path: null, distance: Infinity };

  const path: NodeId[] = [bestEndState.node];
  let curr: { node: NodeId; fromNode: NodeId | null } = bestEndState;
  while (curr.fromNode !== null) {
    const prev = cameFrom.get(stateKey(curr.node, curr.fromNode));
    if (!prev) break;
    path.unshift(prev.node);
    curr = prev;
  }

  // Recalculate true physical distance (meters) along the path
  let distance = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const u = path[i];
    const v = path[i + 1];
    const edges = (adj.get(u) ?? []).filter((e) => e.to === v);
    if (edges.length > 0) {
      distance += Math.min(...edges.map((e) => e.weight));
    }
  }

  return { path, distance };
};
