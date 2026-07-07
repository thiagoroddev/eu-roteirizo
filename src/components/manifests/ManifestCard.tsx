import { useState } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { UI_LABELS } from "../../constants/uiLabels";
import type { ManifestMeta, ManifestRouteMeta } from "../../types/manifest";
import { RouteChip } from "./RouteChip";

interface Props {
  manifest: ManifestMeta;
  /** Highlighted when it is the duplicate-redirect target (`/rotas?sel=` — RN-23). */
  selected?: boolean;
  /** The page's search term — filters the CHIPS inside the card (TASK-REF-013). */
  filter?: string;
  onOpenRoute: (manifest: ManifestMeta, route: ManifestRouteMeta) => void;
  onDelete: (manifest: ManifestMeta) => void;
}

/** Card kind label/color: "Roteiro Exportado" joins after TASK-RF-013. */
const KIND_LABEL = {
  single: UI_LABELS.ROUTES_PAGE.KIND_SINGLE,
  multi: UI_LABELS.ROUTES_PAGE.KIND_MULTI,
} as const;

const KIND_VARIANT = { single: "secondary", multi: "default" } as const;

/** Cards with more routes than this collapse by default (TASK-REF-013 — a
    153-route manifest was filling the whole screen). */
const COLLAPSE_THRESHOLD = 6;

/**
 * ManifestCard - one saved manifest in the Rotas tab (fluxo §15.2, `2-ROTAS.png`):
 * typed header (kind + import date), one chip per route (tap = open), and a
 * delete action guarded by a confirmation dialog (the delivery data itself is
 * never touched — only the local copy is removed).
 *
 * Big multi-route cards collapse to the header + a "Mostrar rotas (N)" toggle;
 * expanded, the chips scroll inside a capped area. While the page filter is
 * active the matching chips show automatically ("X de N rotas").
 */
export const ManifestCard = ({ manifest, selected = false, filter = "", onOpenRoute, onDelete }: Props) => {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const importedAt = new Date(manifest.importedAt).toLocaleDateString("pt-BR");

  const term = filter.trim().toLowerCase();
  const matchingRoutes = term ? manifest.routes.filter((route) => route.name.toLowerCase().includes(term) || (route.at ?? "").toLowerCase().includes(term)) : manifest.routes;
  const collapsible = manifest.routes.length > COLLAPSE_THRESHOLD;
  // Filtering overrides the collapse: the user is looking for a route.
  const showChips = !collapsible || expanded || term.length > 0;
  const countLabel = term ? UI_LABELS.ROUTES_PAGE.ROUTE_COUNT_FILTERED(matchingRoutes.length, manifest.routes.length) : UI_LABELS.ROUTES_PAGE.ROUTE_COUNT(manifest.routes.length);

  return (
    <div className={cn("rounded-2xl border bg-card p-4 text-left shadow-sm", selected && "border-primary ring-2 ring-primary/40")}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <Badge variant={KIND_VARIANT[manifest.kind]}>{KIND_LABEL[manifest.kind]}</Badge>
            <span className="text-xs text-muted-foreground">{countLabel}</span>
          </div>
          <div className="mt-1 text-sm font-medium">{manifest.fileName}</div>
          <div className="text-xs text-muted-foreground">{UI_LABELS.ROUTES_PAGE.IMPORTED_AT(importedAt)}</div>
        </div>

        <Button variant="ghost" size="icon" aria-label={UI_LABELS.ROUTES_PAGE.DELETE_ARIA(manifest.fileName)} onClick={() => setConfirmOpen(true)}>
          <Trash2 className="text-muted-foreground" />
        </Button>
      </div>

      {collapsible && term.length === 0 && (
        <Button type="button" variant="outline" size="sm" className="mt-3" {...{ "aria-expanded": expanded }} onClick={() => setExpanded((value) => !value)}>
          {expanded ? UI_LABELS.ROUTES_PAGE.HIDE_ROUTES : UI_LABELS.ROUTES_PAGE.SHOW_ROUTES(manifest.routes.length)}
        </Button>
      )}

      {showChips && (
        <div className="mt-3 flex max-h-64 flex-wrap gap-2 overflow-y-auto">
          {matchingRoutes.map((route) => (
            <RouteChip key={route.name} route={route} onOpen={(r) => onOpenRoute(manifest, r)} />
          ))}
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
