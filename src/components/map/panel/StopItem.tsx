import { useEffect, useRef, type ReactNode } from "react";
import { Badge } from "../../ui/badge";
import { UI_LABELS } from "../../../constants/uiLabels";
import { colorForLocationType } from "../../../utils/markers/markerColors";
import type { StopItemData } from "../../../utils/markers/panelModels";

const SHEET = UI_LABELS.ROUTE_MAP.ADDRESS_SHEET;

/**
 * StopItem - one address of the panel's StopItemList (design doc §2, tela 5):
 * mini-marker (type color + smallest Sequence) + address/complement + package
 * badge. Expanded (one at a time, toggled by the parent) it shows the full
 * detail the AddressSheet used to show — neighborhood/zipcode/type, one
 * PackageRow per package (RF-28) and the Google Maps link.
 *
 * `leading`/`actions` are the 🔮 slots of the contract (drag handle, "Tornar
 * âncora"… — RF-006/009); the Original mode leaves them empty.
 */
interface Props {
  item: StopItemData;
  expanded: boolean;
  onTap: () => void;
  leading?: ReactNode;
  actions?: ReactNode;
}

const PackageRow = ({ label, spxTn, typeLabel }: StopItemData["packages"][number]) => (
  <li className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
    <div className="flex flex-col">
      <span className="text-xs text-muted-foreground">{label}</span>
      <code className="w-fit rounded bg-muted px-1.5 py-0.5 text-xs">{spxTn}</code>
    </div>
    <Badge variant="outline">{typeLabel}</Badge>
  </li>
);

export const StopItem = ({ item, expanded, onTap, leading, actions }: Props) => {
  const ref = useRef<HTMLLIElement>(null);
  const color = colorForLocationType(item.markerType);

  // Design §5: the expanded item scrolls into view (map tap can expand an item
  // that sits below the fold). Defensive call — jsdom has no scrollIntoView.
  useEffect(() => {
    if (expanded) ref.current?.scrollIntoView?.({ block: "nearest" });
  }, [expanded]);

  return (
    <li ref={ref} className="border-b border-input last:border-b-0">
      {/* data-vaul-no-drag: taps on the row must select, never start a panel drag
          (the header/grabber remains the drag area). */}
      <button type="button" data-vaul-no-drag aria-expanded={expanded} onClick={onTap} className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-accent/50">
        {leading}
        {/* Mini-marker: functional map palette (NOT theme tokens — locked with the
            marker colors, REF-012), same type→color mapping as the map. */}
        <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: color.bottom, color: color.numberInk ?? "#FFFFFF" }}>
          {item.markerNumber}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{item.addressLine}</span>
          {item.complement !== SHEET.NO_COMPLEMENT && <span className="block truncate text-xs text-muted-foreground">{item.complement}</span>}
        </span>
        {item.packageCount > 1 && <Badge variant="secondary">{UI_LABELS.MAP_PANEL.METRIC_PACKAGES(item.packageCount)}</Badge>}
      </button>

      {expanded && (
        <div className="space-y-2 px-4 pb-4 pl-[3.25rem]">
          <div className="space-y-1 text-sm">
            <div>
              <strong>{SHEET.NEIGHBORHOOD}</strong> {item.neighborhood}
            </div>
            <div>
              <strong>{SHEET.ZIPCODE}</strong> {item.zipcode}
            </div>
            <div>
              <strong>{SHEET.TYPE}</strong> {item.typeLabel}
            </div>
          </div>

          <div>
            <div className="text-sm font-semibold">{SHEET.PACKAGES_HEADER(item.packageCount)}</div>
            <ul className="mt-1 space-y-2">
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
      )}
    </li>
  );
};
