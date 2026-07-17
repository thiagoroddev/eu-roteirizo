import { useState, type ReactNode } from "react";
import { UI_LABELS } from "../../../constants/uiLabels";
import type { StopItemData } from "../../../utils/markers/panelModels";
import { StopItem } from "./StopItem";

/**
 * StopItemList - the panel's LIST view body (design doc §2/§3, rev. 07/07):
 * the current stop's addresses ordered by Sequence. The list opens with EVERY
 * item expanded (scan-everything mode); tapping a row toggles only THAT item.
 * The highlight follows the map selection (`selectedKey`); selecting happens
 * through the per-item "Ver no mapa" trailing action, not by tapping rows.
 *
 * `itemLeading`/`itemActions` are the 🔮 per-item slots (drag handle, edit
 * actions — RF-006/009); absent in the Original mode.
 */
interface Props {
  items: StopItemData[];
  /** The map's selected address — highlighted and auto-scrolled into view. */
  selectedKey: string | null;
  itemLeading?: (item: StopItemData) => ReactNode;
  itemActions?: (item: StopItemData) => ReactNode;
  /** Per-item element BESIDE the row (list view's "Ver no mapa" — rev. 07/07). */
  itemTrailing?: (item: StopItemData) => ReactNode;
  /** Bumped to re-scroll the selected item into view (list view opens at full). */
  scrollSignal?: number;
  /** Meu roteiro palette for the mini-markers (RF-006.4.3 — the edit list). */
  neon?: boolean;
  /** The address (point id) that IS the route's start — flagged (RF-006.11). */
  startKey?: string | null;
  /** The address (point id) that IS the stop's vehicle stop — a car badge beside
      the packages (RF-006.17); only when the anchor coincides with a member. */
  vehicleStopKey?: string | null;
}

export const StopItemList = ({ items, selectedKey, itemLeading, itemActions, itemTrailing, scrollSignal, neon = false, startKey = null, vehicleStopKey = null }: Props) => {
  // Everything starts EXPANDED; taps collapse/expand individually. The state
  // resets naturally: the component unmounts when the list view closes, and a
  // stop change renews the keys ("i:j").
  const [collapsedKeys, setCollapsedKeys] = useState<ReadonlySet<string>>(new Set());

  const toggle = (addressKey: string) =>
    setCollapsedKeys((previous) => {
      const next = new Set(previous);
      if (next.has(addressKey)) next.delete(addressKey);
      else next.add(addressKey);
      return next;
    });

  if (items.length === 0) {
    // Canonical empty-state chrome (REF-016): px-4 py-2 text-xs — the same as
    // the draft's EMPTY_HINT; this one had no vertical padding and a larger font.
    return <p className="px-4 py-2 text-xs text-muted-foreground">{UI_LABELS.MAP_PANEL.ITEM.NO_ITEMS}</p>;
  }

  return (
    <ul aria-label={UI_LABELS.MAP_PANEL.ITEM.LIST_ARIA}>
      {items.map((item) => (
        <StopItem
          key={item.addressKey}
          item={item}
          expanded={!collapsedKeys.has(item.addressKey)}
          highlighted={item.addressKey === selectedKey}
          onTap={() => toggle(item.addressKey)}
          leading={itemLeading?.(item)}
          actions={itemActions?.(item)}
          trailing={itemTrailing?.(item)}
          scrollSignal={scrollSignal}
          neon={neon}
          isStart={startKey !== null && item.addressKey === startKey}
          vehicleStop={vehicleStopKey !== null && item.addressKey === vehicleStopKey}
        />
      ))}
    </ul>
  );
};
