import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "../components/ui/input";
import { ManifestCard } from "../components/manifests/ManifestCard";
import { deleteManifest, listManifests } from "../services/manifestStorage";
import { deleteManifestRoteiros, listRoteiroKeys } from "../services/routeStorage";
import { UI_LABELS } from "../constants/uiLabels";
import type { ManifestMeta, ManifestRouteMeta } from "../types/manifest";

/**
 * RoutesPage - the "Rotas" tab (TASK-RF-022.3, fluxo §15.2, `2-ROTAS.png`):
 * saved manifests as typed cards with one chip per route. Tapping a chip
 * opens that route's Sumário focus screen via a deep-linkable URL
 * (`/sumario?romaneio={id}&rota={name}` — TASK-RF-022.4). `?sel={id}`
 * highlights the card the duplicate-import redirect points at (RN-23).
 */
function RoutesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedId = searchParams.get("sel");

  const [manifests, setManifests] = useState<ManifestMeta[] | null>(null); // null = still loading
  const [filter, setFilter] = useState("");
  /** Which routes have a saved roteiro (RF-008) — lights the chips (RN-21). */
  const [roteiroKeys, setRoteiroKeys] = useState<Map<string, Set<string>>>(new Map());

  useEffect(() => {
    let cancelled = false;
    void Promise.all([listManifests(), listRoteiroKeys()]).then(([metas, keys]) => {
      if (cancelled) return;
      setManifests(metas);
      setRoteiroKeys(keys);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Case-insensitive filter over route names and AT codes (metadata only — no file loading). */
  const visible = useMemo(() => {
    if (!manifests) return [];
    const term = filter.trim().toLowerCase();
    if (!term) return manifests;
    return manifests.filter((m) => m.routes.some((r) => r.name.toLowerCase().includes(term) || (r.at ?? "").toLowerCase().includes(term)));
  }, [manifests, filter]);

  const openRoute = (manifest: ManifestMeta, route: ManifestRouteMeta) => {
    navigate(`/sumario?romaneio=${encodeURIComponent(manifest.id)}&rota=${encodeURIComponent(route.name)}`);
  };

  const removeManifest = async (manifest: ManifestMeta) => {
    await deleteManifest(manifest.id);
    // Cascade (RF-008): the manifest's roteiros go with it — no invisible orphans.
    await deleteManifestRoteiros(manifest.id);
    setManifests(await listManifests());
    setRoteiroKeys(await listRoteiroKeys());
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <h2 className="mb-3 text-xl font-bold">{UI_LABELS.ROUTES_PAGE.TITLE}</h2>

      <Input type="search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={UI_LABELS.ROUTES_PAGE.SEARCH_PLACEHOLDER} className="mb-4" />

      {manifests !== null && manifests.length === 0 && <p className="py-8 text-center text-muted-foreground">{UI_LABELS.ROUTES_PAGE.EMPTY}</p>}
      {manifests !== null && manifests.length > 0 && visible.length === 0 && <p className="py-8 text-center text-muted-foreground">{UI_LABELS.ROUTES_PAGE.NO_SEARCH_RESULTS}</p>}

      <div className="space-y-3">
        {visible.map((manifest) => (
          <ManifestCard
            key={manifest.id}
            manifest={manifest}
            selected={manifest.id === selectedId}
            filter={filter}
            roteiroRoutes={roteiroKeys.get(manifest.id)}
            onOpenRoute={openRoute}
            onDelete={(m) => void removeManifest(m)}
          />
        ))}
      </div>
    </div>
  );
}

export default RoutesPage;
