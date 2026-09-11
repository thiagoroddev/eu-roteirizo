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

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DeliveryPoint, LatLng } from "../types/routing";
import type { RoadGraph } from "../utils/routing/graph";
import { bboxFromPoints } from "../utils/routing/osm";
import { UI_LABELS } from "../constants/uiLabels";
import { bboxKey, loadRoadGraph } from "../services/graphCache";

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

export const useRoadGraph = (points: DeliveryPoint[], enabled: boolean, startPoint?: LatLng | null): RoadGraphReturn => {
  const [graph, setGraph] = useState<RoadGraph | null>(null);
  const [status, setStatus] = useState<RoadGraphStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);

  const coords = useMemo(() => (startPoint ? [...points, startPoint] : points), [points, startPoint]);
  const bbox = useMemo(() => bboxFromPoints(coords, BBOX_MARGIN_METERS), [coords]);
  const currentBboxKey = bbox ? bboxKey(bbox) : null;

  const loadedBboxKeyRef = useRef<string | null>(null);
  const inFlightBboxKeyRef = useRef<string | null>(null);
  const lastAttemptRef = useRef(attempt);

  useEffect(() => {
    const isRetry = attempt !== lastAttemptRef.current;
    if (isRetry) {
      lastAttemptRef.current = attempt;
      loadedBboxKeyRef.current = null;
    }

    if (!enabled || !bbox || !currentBboxKey) return;
    if (currentBboxKey === loadedBboxKeyRef.current && !isRetry) return;
    if (currentBboxKey === inFlightBboxKeyRef.current && !isRetry) return;

    inFlightBboxKeyRef.current = currentBboxKey;

    let cancelled = false;
    const controller = new AbortController();

    /* eslint-disable react-hooks/set-state-in-effect */
    setStatus("loading");
    setError(null);
    /* eslint-enable react-hooks/set-state-in-effect */

    void loadRoadGraph(bbox, { signal: controller.signal }).then((result) => {
      if (cancelled) return;
      inFlightBboxKeyRef.current = null;
      if (result.graph && result.graph.coords.size > 0) {
        loadedBboxKeyRef.current = currentBboxKey;
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
      if (inFlightBboxKeyRef.current === currentBboxKey) {
        inFlightBboxKeyRef.current = null;
      }
    };
  }, [enabled, attempt, bbox, currentBboxKey]);

  const retry = useCallback(() => setAttempt((n) => n + 1), []);

  return { graph, status, error, retry };
};
