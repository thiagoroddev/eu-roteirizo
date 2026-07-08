/**
 * hooks/useRoadGraph.ts - Lazy road-graph loading for the Meu roteiro mode
 * (TASK-RF-006.3, ADR-009 decision B).
 *
 * Loads the OSM road network for the route's neighborhood (envelope of the
 * delivery points + margin) when the user ENTERS the roteiro mode — never on
 * page boot. Cache-first via loadRoadGraph (IndexedDB, TTL 7d); loads ONCE per
 * mount and keeps the graph in memory across mode toggles. Everything the
 * caller builds over it must work with `graph === null` (straight-line
 * fallbacks) — this hook never blocks anything.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import type { DeliveryPoint } from "../types/routing";
import type { RoadGraph } from "../utils/routing/graph";
import { bboxFromPoints, type BBox } from "../utils/routing/osm";
import { loadRoadGraph } from "../services/graphCache";

/** Margin (meters) around the points' envelope: street context for map
 *  matching/A* at border points without inflating the bbox (DT-005). */
const BBOX_MARGIN_METERS = 300;

export type RoadGraphStatus = "idle" | "loading" | "ready" | "error";

export interface RoadGraphReturn {
  graph: RoadGraph | null;
  status: RoadGraphStatus;
  /** UI_LABELS.ROUTING message when status === "error". */
  error: string | null;
  /** Re-attempts the load after an error. */
  retry: () => void;
}

export const useRoadGraph = (points: DeliveryPoint[], enabled: boolean): RoadGraphReturn => {
  const [graph, setGraph] = useState<RoadGraph | null>(null);
  const [status, setStatus] = useState<RoadGraphStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  /** Load-once guard (per attempt): entering the mode again must not re-fetch. */
  const startedAttemptRef = useRef(-1);
  /** Unmount/re-run guard for the async resolution. */
  const cancelledRef = useRef(false);

  const startLoad = useCallback((bbox: BBox) => {
    cancelledRef.current = false;
    setStatus("loading");
    setError(null);
    void loadRoadGraph(bbox).then((result) => {
      if (cancelledRef.current) return;
      if (result.graph) {
        setGraph(result.graph);
        setStatus("ready");
      } else {
        setError(result.error ?? null);
        setStatus("error");
      }
    });
  }, []);

  useEffect(() => {
    if (!enabled || startedAttemptRef.current === attempt) return;
    const bbox = bboxFromPoints(points, BBOX_MARGIN_METERS);
    if (!bbox) return;
    startedAttemptRef.current = attempt;
    // Canonical fetch-in-effect: the synchronous "loading" transition is the
    // effect's own lifecycle state, not derivable from props/state — the rule's
    // alternatives (derived state/event handler) don't apply to a URL-driven load.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    startLoad(bbox);

    return () => {
      cancelledRef.current = true;
    };
  }, [enabled, attempt, points, startLoad]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { graph, status, error, retry };
};
