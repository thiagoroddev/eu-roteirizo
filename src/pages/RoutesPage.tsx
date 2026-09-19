import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { HardDrive, ArrowUpDown } from "lucide-react";
import { Input } from "../components/ui/input";
import { ManifestCard } from "../components/manifests/ManifestCard";
import { deleteManifest, listManifests } from "../services/manifestStorage";
import { deleteManifestRoteiros, listRoteiroKeys, listRoteiroSummaries } from "../services/routeStorage";
import { UI_LABELS } from "../constants/uiLabels";
import type { ManifestMeta, ManifestRouteMeta } from "../types/manifest";
import type { RoteiroSummary } from "../types/routing";

type SortOption = "recent_use" | "import_date";

/**
 * RoutesPage - the "Rotas" tab (TASK-RF-048, fluxo §15.2, Stitch UI):
 * Saved manifests as typed cards with route rows, status badges, neighborhood,
 * search inside cards, and sorting by recent use or import date.
 */
function RoutesPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const selectedId = searchParams.get("sel");

  const [manifests, setManifests] = useState<ManifestMeta[] | null>(null); // null = still loading
  const [filter, setFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent_use");
  /** Which routes have a saved roteiro (RF-008) — lights the status (RN-21). */
  const [roteiroKeys, setRoteiroKeys] = useState<Map<string, Set<string>>>(new Map());
  /** Mesh summaries for routes across manifests (RF-61 / TASK-RF-048). */
  const [routeSummaries, setRouteSummaries] = useState<Map<string, Map<string, RoteiroSummary>>>(new Map());

  useEffect(() => {
    let cancelled = false;
    console.log("[RoutesPage] useEffect: disparando listManifests, listRoteiroKeys e listRoteiroSummaries...");
    void Promise.all([listManifests(), listRoteiroKeys(), listRoteiroSummaries()])
      .then(([metas, keys, summaries]) => {
        if (cancelled) return;
        console.log(`[RoutesPage] carregamento concluído: ${metas.length} manifestos, ${keys.size} chaves de roteiro, ${summaries.size} sumários de malha`);
        setManifests(metas);
        setRoteiroKeys(keys);
        setRouteSummaries(summaries);
      })
      .catch((err) => {
        console.error("[RoutesPage] Falha ao carregar manifestos ou chaves de roteiro:", err);
        if (!cancelled) setManifests([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /** Filter over route names and AT codes, and sort by chosen option (RF-60). */
  const visible = useMemo(() => {
    if (!manifests) return [];
    const term = filter.trim().toLowerCase();
    const filtered = term ? manifests.filter((m) => m.routes.some((r) => r.name.toLowerCase().includes(term) || (r.at ?? "").toLowerCase().includes(term))) : [...manifests];

    return filtered.sort((a, b) => {
      if (sortBy === "import_date") {
        return b.importedAt.localeCompare(a.importedAt) || a.id.localeCompare(b.id);
      }
      // "recent_use" default: lastUsedAt with fallback to importedAt (RF-60)
      const timeA = a.lastUsedAt ?? a.importedAt;
      const timeB = b.lastUsedAt ?? b.importedAt;
      return timeB.localeCompare(timeA) || a.id.localeCompare(b.id);
    });
  }, [manifests, filter, sortBy]);

  const openRoute = (manifest: ManifestMeta, route: ManifestRouteMeta) => {
    navigate(`/sumario?romaneio=${encodeURIComponent(manifest.id)}&rota=${encodeURIComponent(route.name)}`);
  };

  const removeManifest = async (manifest: ManifestMeta) => {
    await deleteManifest(manifest.id);
    // Cascade (RF-008): the manifest's roteiros go with it — no invisible orphans.
    await deleteManifestRoteiros(manifest.id);
    setManifests(await listManifests());
    setRoteiroKeys(await listRoteiroKeys());
    setRouteSummaries(await listRoteiroSummaries());
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-6">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">{UI_LABELS.ROUTES_PAGE.TITLE}</h2>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
            <HardDrive className="h-3.5 w-3.5 text-primary/70" aria-hidden="true" />
            <span>{UI_LABELS.ROUTES_PAGE.SAVED_ON_DEVICE}</span>
            {manifests !== null && manifests.length > 0 && (
              <span>
                · {manifests.length} {manifests.length === 1 ? "romaneio" : "romaneios"}
              </span>
            )}
          </div>
        </div>

        {manifests !== null && manifests.length > 1 && (
          <div className="flex items-center gap-1.5 self-start sm:self-auto text-xs text-muted-foreground">
            <ArrowUpDown className="h-3.5 w-3.5" aria-hidden="true" />
            <label htmlFor="route-sort-select" className="font-medium">
              {UI_LABELS.ROUTES_PAGE.SORT_LABEL}
            </label>
            <select
              id="route-sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="rounded-lg border border-input bg-card px-2.5 py-1 text-xs font-medium text-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
            >
              <option value="recent_use">{UI_LABELS.ROUTES_PAGE.SORT_RECENT_USE}</option>
              <option value="import_date">{UI_LABELS.ROUTES_PAGE.SORT_IMPORT_DATE}</option>
            </select>
          </div>
        )}
      </div>

      <Input type="search" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder={UI_LABELS.ROUTES_PAGE.SEARCH_PLACEHOLDER} className="mb-4" />

      {manifests !== null && manifests.length === 0 && <p className="py-8 text-center text-muted-foreground">{UI_LABELS.ROUTES_PAGE.EMPTY}</p>}
      {manifests !== null && manifests.length > 0 && visible.length === 0 && <p className="py-8 text-center text-muted-foreground">{UI_LABELS.ROUTES_PAGE.NO_SEARCH_RESULTS}</p>}

      <div className="space-y-4">
        {visible.map((manifest) => (
          <ManifestCard
            key={manifest.id}
            manifest={manifest}
            selected={manifest.id === selectedId}
            filter={filter}
            roteiroRoutes={roteiroKeys.get(manifest.id)}
            routeSummaries={routeSummaries.get(manifest.id)}
            onOpenRoute={openRoute}
            onDelete={(m) => void removeManifest(m)}
          />
        ))}
      </div>
    </div>
  );
}

export default RoutesPage;
