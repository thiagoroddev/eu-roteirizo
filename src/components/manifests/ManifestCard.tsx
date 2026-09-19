import { useState } from "react";
import { Trash2, FileSpreadsheet, FileText, FileCode, Search, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { UI_LABELS } from "../../constants/uiLabels";
import type { ManifestMeta, ManifestRouteMeta } from "../../types/manifest";
import type { RoteiroSummary } from "../../types/routing";
import { RouteRow } from "./RouteRow";

interface Props {
  manifest: ManifestMeta;
  /** Highlighted when it is the duplicate-redirect target (`/rotas?sel=` — RN-23). */
  selected?: boolean;
  /** The page's search term — filters routes inside the card (TASK-REF-013). */
  filter?: string;
  /** Route names of this manifest with a saved roteiro (RF-008) — lights the status. */
  roteiroRoutes?: Set<string>;
  /** Mesh summaries for routes in this manifest (RF-61 / TASK-RF-048). */
  routeSummaries?: Map<string, RoteiroSummary>;
  onOpenRoute: (manifest: ManifestMeta, route: ManifestRouteMeta) => void;
  onDelete: (manifest: ManifestMeta) => void;
}

/** Card kind label/color */
const KIND_LABEL = {
  single: UI_LABELS.ROUTES_PAGE.KIND_SINGLE,
  multi: UI_LABELS.ROUTES_PAGE.KIND_MULTI,
} as const;

const KIND_VARIANT = { single: "secondary", multi: "default" } as const;

/** Cards with more routes than this collapse by default (TASK-REF-013). */
const COLLAPSE_THRESHOLD = 6;

const getFileKind = (fileName: string, fileType: string) => {
  const lower = fileName.toLowerCase();
  if (lower.endsWith(".csv") || fileType.includes("csv")) {
    return {
      label: UI_LABELS.ROUTES_PAGE.FILE_KIND_CSV,
      icon: FileText,
      iconColor: "text-blue-600 dark:text-blue-400",
      iconBg: "bg-blue-500/10",
    };
  }
  if (lower.endsWith(".json") || fileType.includes("json")) {
    return {
      label: UI_LABELS.ROUTES_PAGE.FILE_KIND_JSON,
      icon: FileCode,
      iconColor: "text-purple-600 dark:text-purple-400",
      iconBg: "bg-purple-500/10",
    };
  }
  return {
    label: UI_LABELS.ROUTES_PAGE.FILE_KIND_XLSX,
    icon: FileSpreadsheet,
    iconColor: "text-emerald-600 dark:text-emerald-400",
    iconBg: "bg-emerald-500/10",
  };
};

/**
 * ManifestCard - One saved manifest card in the Rotas tab (TASK-RF-048 / Stitch UI):
 * - Typed header with file icon, format badge, kind badge, route count, and imported date.
 * - Delete action guarded by a confirmation dialog.
 * - Internal route search input (RF-63) + page search integration.
 * - Auto-expands when searching.
 * - Route rows with status badge, package count, primary neighborhood, and mesh summary metrics.
 */
export const ManifestCard = ({ manifest, selected = false, filter = "", roteiroRoutes, routeSummaries, onOpenRoute, onDelete }: Props) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [cardSearch, setCardSearch] = useState("");
  const importedAt = new Date(manifest.importedAt).toLocaleDateString("pt-BR");

  const activeSearch = (cardSearch || filter || "").trim().toLowerCase();
  const matchingRoutes = activeSearch ? manifest.routes.filter((route) => route.name.toLowerCase().includes(activeSearch) || (route.at ?? "").toLowerCase().includes(activeSearch)) : manifest.routes;

  const collapsible = manifest.routes.length > COLLAPSE_THRESHOLD;
  const isSearching = activeSearch.length > 0;
  // Filtering overrides the collapse: the user is looking for a route.
  const showRoutes = !collapsible || expanded || isSearching;
  const countLabel = isSearching ? UI_LABELS.ROUTES_PAGE.ROUTE_COUNT_FILTERED(matchingRoutes.length, manifest.routes.length) : UI_LABELS.ROUTES_PAGE.ROUTE_COUNT(manifest.routes.length);

  const fileKind = getFileKind(manifest.fileName, manifest.fileType);
  const FileIcon = fileKind.icon;

  return (
    <div className={cn("rounded-2xl border bg-card p-4 sm:p-5 text-left shadow-sm transition-all", selected && "border-primary ring-2 ring-primary/40")}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl", fileKind.iconBg)}>
            <FileIcon className={cn("h-5 w-5", fileKind.iconColor)} aria-hidden="true" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <Badge variant="outline" className="text-[11px] font-medium py-0 px-2">
                {fileKind.label}
              </Badge>
              <Badge variant={KIND_VARIANT[manifest.kind]} className="text-[11px] py-0 px-2">
                {KIND_LABEL[manifest.kind]}
              </Badge>
              <span className="text-xs text-muted-foreground font-medium">{countLabel}</span>
            </div>
            <h3 className="mt-1 text-sm sm:text-base font-semibold text-foreground truncate" title={manifest.fileName}>
              {manifest.fileName}
            </h3>
            <div className="text-xs text-muted-foreground">{UI_LABELS.ROUTES_PAGE.IMPORTED_AT(importedAt)}</div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          aria-label={UI_LABELS.ROUTES_PAGE.DELETE_ARIA(manifest.fileName)}
          onClick={() => setConfirmOpen(true)}
          className="shrink-0 text-muted-foreground hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {manifest.routes.length > 3 && (
        <div className="relative mt-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
          <Input
            type="search"
            value={cardSearch}
            onChange={(e) => setCardSearch(e.target.value)}
            placeholder={UI_LABELS.ROUTES_PAGE.SEARCH_ROUTES_PLACEHOLDER}
            className="h-8 pl-8 text-xs bg-muted/30"
          />
        </div>
      )}

      {collapsible && !isSearching && (
        <Button type="button" variant="outline" size="sm" className="mt-3 w-full sm:w-auto text-xs" aria-expanded={expanded} onClick={() => setExpanded((value) => !value)}>
          {expanded ? (
            <>
              <ChevronUp className="mr-1.5 h-3.5 w-3.5" />
              {UI_LABELS.ROUTES_PAGE.HIDE_ROUTES}
            </>
          ) : (
            <>
              <ChevronDown className="mr-1.5 h-3.5 w-3.5" />
              {UI_LABELS.ROUTES_PAGE.SHOW_ROUTES(manifest.routes.length)}
            </>
          )}
        </Button>
      )}

      {showRoutes && (
        <div className="mt-3 flex flex-col gap-2">
          {matchingRoutes.length === 0 ? (
            <div className="py-4 text-center text-xs text-muted-foreground">{UI_LABELS.ROUTES_PAGE.NO_SEARCH_RESULTS}</div>
          ) : (
            matchingRoutes.map((route) => (
              <RouteRow
                key={route.name}
                route={route}
                hasRoteiro={roteiroRoutes?.has(route.name) ?? false}
                summary={routeSummaries?.get(route.name) ?? null}
                onOpen={(r) => onOpenRoute(manifest, r)}
              />
            ))
          )}
        </div>
      )}

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{UI_LABELS.ROUTES_PAGE.DELETE_TITLE}</DialogTitle>
            <DialogDescription>{UI_LABELS.ROUTES_PAGE.DELETE_DESCRIPTION(manifest.fileName)}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>
              {UI_LABELS.ROUTES_PAGE.DELETE_CANCEL}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                setConfirmOpen(false);
                onDelete(manifest);
              }}
            >
              {UI_LABELS.ROUTES_PAGE.DELETE_CONFIRM}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
