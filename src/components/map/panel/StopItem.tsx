import { useEffect, useRef, type ReactNode } from "react";
import { Car } from "lucide-react";
import { Badge } from "../../ui/badge";
import { cn } from "@/lib/utils";
import { UI_LABELS } from "../../../constants/uiLabels";
import { colorForLocationType, roteiroColorForLocationType, ROTEIRO_MARKER_COLORS } from "../../../utils/markers/markerColors";
import type { StopItemData } from "../../../utils/markers/panelModels";

const SHEET = UI_LABELS.ROUTE_MAP.ADDRESS_SHEET;

/**
 * PackageGlyph - the SAME 3D-box glyph the map markers use for their package
 * badge (markerSvg badgeGlyph "packages"), as an inline currentColor SVG so
 * the panel badges read identically (rev. 07/07).
 */
export const PackageGlyph = () => (
  <svg viewBox="-1 -1 14 15" aria-hidden className="h-3 w-3 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.4} strokeLinejoin="round">
    <path d="M0,3 L6,0 L12,3 L6,6 Z" />
    <path d="M0,3 L0,10 L6,13 L6,6" />
    <path d="M12,3 L12,10 L6,13" />
  </svg>
);

/**
 * StopItemRow - the collapsed line of an address: mini-marker (type color +
 * smallest Sequence) + address/complement + package badge (box glyph + count).
 * Shared VERBATIM by the list's StopItem and by the panel header's
 * selected-address shortcut (design rev. 07/07).
 *
 * `data-vaul-no-drag`: taps on the row must act, never start a panel drag
 * (the grabber/header spacing remains the drag area).
 */
interface RowProps {
  item: StopItemData;
  onTap: () => void;
  /** 🔮 per-item slot (drag handle — RF-006). */
  leading?: ReactNode;
  /** Persistent "hovered" look for the selected item (design rev. 07/07). */
  highlighted?: boolean;
  /** aria-expanded for the list usage; omit in the header shortcut row. */
  expanded?: boolean;
  /** Meu roteiro mode: the mini-marker uses the neon type palette, matching the
      map markers of that mode (RF-006.4.2). Default = Original palette. */
  neon?: boolean;
  /** "vehicle": the mini-marker shows the car glyph (the stop anchor / parada do
      veículo) instead of a number, in the route-infrastructure slate (RF-006.4.7). */
  markerGlyph?: "vehicle";
}

export const StopItemRow = ({ item, onTap, leading, highlighted = false, expanded, neon = false, markerGlyph }: RowProps) => {
  const typeColor = neon ? roteiroColorForLocationType(item.markerType) : colorForLocationType(item.markerType);
  const color = markerGlyph === "vehicle" ? ROTEIRO_MARKER_COLORS.vehicle : typeColor;

  return (
    <button
      type="button"
      data-vaul-no-drag
      // Spread keeps the IDE's ARIA linter happy with the dynamic values (same
      // workaround as MapModeToggle) and omits the attributes when undefined.
      {...(expanded === undefined ? {} : { "aria-expanded": expanded })}
      {...(highlighted ? { "aria-current": "true" as const } : {})}
      onClick={onTap}
      className={cn("flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent/50", highlighted && "bg-accent")}
    >
      {leading}
      {/* Mini-marker: functional map palette (NOT theme tokens — locked with the
          marker colors, REF-012), same type→color mapping as the map. The
          vehicle glyph marks the stop's anchor (parada do veículo — RF-006.4.7). */}
      <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: color.bottom, color: color.numberInk ?? "#FFFFFF" }}>
        {markerGlyph === "vehicle" ? <Car className="h-3.5 w-3.5" aria-hidden /> : item.markerNumber}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{item.addressLine}</span>
        {item.complement !== SHEET.NO_COMPLEMENT && <span className="block truncate text-xs text-muted-foreground">{`${SHEET.COMPLEMENT} ${item.complement}`}</span>}
      </span>
      {/* Package badge ALWAYS shows — indicating 1 or more (rev. 07/07). */}
      <Badge variant="secondary" className="gap-1" aria-label={UI_LABELS.MAP_PANEL.METRIC_PACKAGES(item.packageCount)}>
        <PackageGlyph />
        {item.packageCount}
      </Badge>
    </button>
  );
};

const PackageRow = ({ label, complement, spxTn, type, typeLabel }: StopItemData["packages"][number]) => {
  // Type badge colored by the FUNCTIONAL map palette (green residential / blue
  // commercial — rev. 07/07), same mapping as the markers; not theme tokens.
  const color = colorForLocationType(type);
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2 first:pt-0 last:pb-0">
      <div className="flex min-w-0 flex-col gap-0.5">
        {/* Label and SPX code on ONE line (rev. 07/07). */}
        <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <span className="text-xs text-muted-foreground">{label}</span>
          <code className="w-fit rounded bg-muted px-1.5 py-0.5 text-xs">{spxTn}</code>
        </span>
        {/* THIS package's complement, with an explicit label (rev. 07/07). */}
        {complement && (
          <span className="truncate text-xs">
            <span className="text-muted-foreground">{SHEET.COMPLEMENT}</span> <span className="font-medium">{complement}</span>
          </span>
        )}
      </div>
      <Badge variant="outline" className="border-transparent" style={{ backgroundColor: color.bottom, color: color.numberInk ?? "#FFFFFF" }}>
        {typeLabel}
      </Badge>
    </li>
  );
};

/**
 * StopItemDetail - the drill-down of an address: one PackageRow per package
 * (RF-28) and the Google Maps link. Neighborhood/zipcode/type lines were moved
 * OUT (rev. 07/07): place info lives in the stop summary; the type only on the
 * per-package colored badge. Shared by the list's StopItem and by the default
 * view's selected-address card, so both drill-downs show the same content.
 */
export const StopItemDetail = ({ item, actions }: { item: StopItemData; actions?: ReactNode }) => (
  <div className="space-y-2 px-4 pb-4 pl-[3.25rem]">
    <div>
      <div className="text-sm font-semibold">{SHEET.PACKAGES_HEADER(item.packageCount)}</div>
      {/* Divider between packages so each one reads as a unit (rev. 07/07). */}
      <ul className="mt-1 divide-y divide-input">
        {item.packages.map((pkg, index) => (
          <PackageRow key={index} {...pkg} />
        ))}
      </ul>
    </div>

    <div className="flex items-center justify-between gap-2">
      <a href={item.mapsUrl} target="_blank" rel="noopener noreferrer" data-vaul-no-drag className="text-sm font-medium text-primary underline-offset-4 hover:underline">
        {SHEET.GOOGLE_MAPS}
      </a>
      {actions && <div className="flex gap-2">{actions}</div>}
    </div>
  </div>
);

/**
 * StopItem - one address of the panel's LIST view (design doc §2, rev. 07/07):
 * the StopItemRow plus the StopItemDetail when expanded. Expansion is
 * independent per item (the list opens with ALL expanded); the highlight
 * follows the SELECTION, not the expansion.
 *
 * `leading`/`actions` are the 🔮 slots of the contract (drag handle, "Tornar
 * âncora"… — RF-006/009). `trailing` sits BESIDE the row (a sibling, not
 * nested — the row is a button): the list view's "Ver no mapa" lives here.
 */
interface Props {
  item: StopItemData;
  expanded: boolean;
  onTap: () => void;
  /** Selection highlight (bg-accent + aria-current) — decoupled from `expanded`. */
  highlighted?: boolean;
  leading?: ReactNode;
  actions?: ReactNode;
  trailing?: ReactNode;
  /** Bumped by the parent to re-scroll the SELECTED item into view (list view opens). */
  scrollSignal?: number;
  /** Meu roteiro palette for the mini-marker (RF-006.4.3 — the edit list). */
  neon?: boolean;
}

export const StopItem = ({ item, expanded, onTap, highlighted = false, leading, actions, trailing, scrollSignal = 0, neon = false }: Props) => {
  const ref = useRef<HTMLLIElement>(null);

  // Design §5: the SELECTED item scrolls into view when the list opens/changes
  // (all items start expanded — scrolling by expansion would race to the last
  // one). Defensive call — jsdom has no scrollIntoView.
  useEffect(() => {
    if (highlighted) ref.current?.scrollIntoView?.({ block: "nearest" });
  }, [highlighted, scrollSignal]);

  return (
    <li ref={ref} className="border-b border-input last:border-b-0">
      <div className="flex items-center">
        <div className="min-w-0 flex-1">
          <StopItemRow item={item} onTap={onTap} leading={leading} highlighted={highlighted} expanded={expanded} neon={neon} />
        </div>
        {trailing && <div className="shrink-0 pr-3">{trailing}</div>}
      </div>

      {expanded && <StopItemDetail item={item} actions={actions} />}
    </li>
  );
};
