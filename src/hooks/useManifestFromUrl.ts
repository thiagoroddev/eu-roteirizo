import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useRouteUploader } from "./useRouteUploader";

/**
 * useManifestFromUrl - loads the saved manifest a focus screen points at
 * (`?romaneio={id}&rota={name}`) and derives the selected route's rows.
 * Extracted from SummaryPage/MapPage (TASK-REF-011 — Regra de Três): both
 * duplicated the params + load-once guard + rows derivation.
 *
 * The caller still owns the malformed-URL redirect (a hook can't render
 * <Navigate>): check `manifestId`/`routeName` for null.
 */
export function useManifestFromUrl() {
  const [searchParams] = useSearchParams();
  const manifestId = searchParams.get("romaneio");
  const routeName = searchParams.get("rota");

  const { routes, loading, error, availableCols, isSingleRoute, loadManifest } = useRouteUploader();
  /** Guards the load against re-runs (same id → load once). */
  const loadedRef = useRef<string | null>(null);

  useEffect(() => {
    if (!manifestId || loadedRef.current === manifestId) return;
    loadedRef.current = manifestId;
    void loadManifest(manifestId);
  }, [manifestId, loadManifest]);

  /** Rows of the URL's route; [] also covers a route name that no longer exists. */
  const currentRows = useMemo(() => (routeName && routes ? (routes[routeName] ?? []) : []), [routeName, routes]);

  return { manifestId, routeName, routes, loading, error, availableCols, isSingleRoute, currentRows };
}
