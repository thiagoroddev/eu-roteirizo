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
import { bboxFromPoints } from "../utils/routing/osm";
import { UI_LABELS } from "../constants/uiLabels";
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
  /** Attempt whose load is in flight (set at start). */
  const startedAttemptRef = useRef(-1);
  /** Attempt whose load has completed (graph or error). */
  const completedAttemptRef = useRef(-1);

  useEffect(() => {
    // Load once per attempt: skip if it already completed or is currently in
    // flight. A run cancelled BEFORE completing releases `startedAttemptRef` in
    // the cleanup, so re-entering the mode restarts it — this fixes the
    // "Carregando ruas…" forever wedge (TASK-BG-006): a shared cancel flag used
    // to swallow the result while the start-only guard blocked the restart.
    if (!enabled || completedAttemptRef.current === attempt || startedAttemptRef.current === attempt) return;
    const bbox = bboxFromPoints(points, BBOX_MARGIN_METERS);
    if (!bbox) return;
    startedAttemptRef.current = attempt;

    // `cancelled` is LOCAL to this run (captured by the cleanup closure), never a
    // shared ref — a stale run resolving late is ignored without wedging the next.
    let cancelled = false;
    const controller = new AbortController();
    // Canonical fetch-in-effect: the synchronous "loading" transition is the
    // effect's own lifecycle state, not derivable from props/state — the rule's
    // alternatives (derived state/event handler) don't apply to a URL-driven load.
    /* eslint-disable react-hooks/set-state-in-effect */
    setStatus("loading");
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */
    void loadRoadGraph(bbox, { signal: controller.signal }).then((result) => {
      if (cancelled) return;
      completedAttemptRef.current = attempt;
      if (result.graph && result.graph.coords.size > 0) {
        setGraph(result.graph);
        setStatus("ready");
      } else {
        setError(result.error ?? UI_LABELS.ROUTING.NO_STREETS);
        setStatus("error");
      }
    });

    return () => {
      cancelled = true;
      controller.abort();
      // Only an incomplete run releases the in-flight guard; a completed attempt
      // keeps its marker so a ready graph is not refetched on the next toggle.
      if (startedAttemptRef.current === attempt && completedAttemptRef.current !== attempt) {
        startedAttemptRef.current = -1;
      }
    };
  }, [enabled, attempt, points]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { graph, status, error, retry };
};
