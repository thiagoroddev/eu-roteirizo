import { CircleDashed, CircleCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { UI_LABELS } from "../../constants/uiLabels";
import type { ManifestRouteMeta } from "../../types/manifest";

interface Props {
  route: ManifestRouteMeta;
  /**
   * Whether a Roteiro already exists for this route (RN-21: at most one per
   * route). Phase 1 never passes true — the prop is part of the contract so
   * TASK-RF-008 can light it up without touching callers' structure.
   */
  hasRoteiro?: boolean;
  onOpen: (route: ManifestRouteMeta) => void;
}

/**
 * RouteChip - one tappable route inside a saved-manifest card (fluxo §15.2):
 * route name + AT code (when the spreadsheet carries one) + roteiro state icon.
 * Tapping opens that route in the viewer (Sumário screen after TASK-RF-022.4).
 */
export const RouteChip = ({ route, hasRoteiro = false, onOpen }: Props) => {
  const StateIcon = hasRoteiro ? CircleCheck : CircleDashed;
  return (
    <button
      type="button"
      onClick={() => onOpen(route)}
      aria-label={UI_LABELS.ROUTES_PAGE.CHIP_ARIA(route.name)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-input bg-background px-3 py-1.5 text-xs font-semibold",
        "hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      <StateIcon className={cn("h-3.5 w-3.5", hasRoteiro ? "text-primary" : "text-muted-foreground")} aria-hidden />
      <span>{route.name}</span>
      {route.at && <span className="font-normal text-muted-foreground">{route.at}</span>}
    </button>
  );
};
