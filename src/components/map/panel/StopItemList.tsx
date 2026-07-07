import type { ReactNode } from "react";
import { UI_LABELS } from "../../../constants/uiLabels";
import type { StopItemData } from "../../../utils/markers/panelModels";
import { StopItem } from "./StopItem";

/**
 * StopItemList - the panel body of the Original mode (design doc §2/§3, tela 5):
 * the current stop's addresses ordered by Sequence, one expandable StopItem
 * each. Selection is OWNED by the parent (expandedKey mirrors the map's
 * selectedAddressKey; onItemTap emits the intent) — no duplicated state.
 *
 * `itemLeading`/`itemActions` are the 🔮 per-item slots (drag handle, edit
 * actions — RF-006/009); absent in the Original mode.
 */
interface Props {
  items: StopItemData[];
  expandedKey: string | null;
  onItemTap: (addressKey: string) => void;
  itemLeading?: (item: StopItemData) => ReactNode;
  itemActions?: (item: StopItemData) => ReactNode;
}

export const StopItemList = ({ items, expandedKey, onItemTap, itemLeading, itemActions }: Props) => {
  if (items.length === 0) {
    return <p className="px-4 text-sm text-muted-foreground">{UI_LABELS.MAP_PANEL.ITEM.NO_ITEMS}</p>;
  }

  return (
    <ul aria-label={UI_LABELS.MAP_PANEL.ITEM.LIST_ARIA}>
      {items.map((item) => (
        <StopItem key={item.addressKey} item={item} expanded={item.addressKey === expandedKey} onTap={() => onItemTap(item.addressKey)} leading={itemLeading?.(item)} actions={itemActions?.(item)} />
      ))}
    </ul>
  );
};
