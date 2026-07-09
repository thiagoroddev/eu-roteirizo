import { Undo2 } from "lucide-react";
import { Button } from "../../ui/button";
import { PanelSection } from "./PanelSection";
import { PanelTitle, type PanelMetric } from "./PanelTitle";
import { StopItemRow } from "./StopItem";
import type { StopItemData } from "../../../utils/markers/panelModels";
import { UI_LABELS } from "../../../constants/uiLabels";

const STOP = UI_LABELS.MAP_PANEL.ROTEIRO_STOP;

/**
 * RoteiroStopSection - a committed stop, selected on the map (TASK-RF-006.4.2/
 * .4.3/.4.7 — partial .6, fluxo §9). Mirrors the Original header (via
 * PanelSection — the shared divider/label chrome):
 * - "Resumo da parada": title + typed chips, with ALL THREE actions on the
 *   label's line (RF-006.4.17 — "Ver lista completa", "Editar parada" and an
 *   icon-only "Desfazer parada"), so the collapsed panel stays short.
 * - "Endereço selecionado": the address selected in the expanded group — either
 *   a tapped MEMBER (its ordinal marker + real complement, RF-006.4.16) or, with
 *   none chosen, the stop's ANCHOR ("— parada do veículo (âncora)": vehicle glyph,
 *   address WITHOUT complement, RF-006.4.7; a placeholder = the first stop
 *   address until geocoding). Only in the summary view — the full-list view
 *   (below) replaces it with the addresses.
 */
interface Props {
  stopOrder: number;
  neighborhoods: string[];
  zipcodes: string[];
  /** endereços · pacotes POR TIPO · "~min · m a pé" (typed chips — RF-006.4.3). */
  metrics: PanelMetric[];
  /** The selected address of the stop — a tapped member or the anchor — null while empty. */
  selectedItem: StopItemData | null;
  /** Whether `selectedItem` is the vehicle anchor (glyph + "âncora" label) vs a member. */
  isAnchor: boolean;
  expanded: boolean;
  onTapCard: () => void;
  onEdit: () => void;
  onDissolve: () => void;
  /** Whether the full-list view is open (flips the toggle + hides the anchor row). */
  listOpen: boolean;
  onToggleList: () => void;
}

export const RoteiroStopSection = ({ stopOrder, neighborhoods, zipcodes, metrics, selectedItem, isAnchor, expanded, onTapCard, onEdit, onDissolve, listOpen, onToggleList }: Props) => (
  <div>
    <PanelSection
      label={UI_LABELS.MAP_PANEL.SECTION_STOP}
      /* All three actions ride the label's line (RF-006.4.17): every row removed
         from the header shortens the collapsed panel. Compact sizing; "Desfazer"
         drops to icon-only (its label is the accessible name) — "Editar" keeps
         its text, being the one the user reaches for. */
      /* No wrapper div: PanelSection already lays the slot out as `flex shrink-0
         gap-2` — nesting one (and its margin) is what pushed these buttons off
         the Original's flush-right px-4 edge. */
      actions={
        <>
          <Button type="button" size="sm" className="h-7 px-2 text-xs" data-vaul-no-drag onClick={onEdit}>
            {STOP.EDIT}
          </Button>
          <Button type="button" variant="outline" size="icon" className="h-7 w-7 shrink-0" data-vaul-no-drag onClick={onDissolve} title={STOP.DISSOLVE} aria-label={STOP.DISSOLVE}>
            <Undo2 aria-hidden className="h-4 w-4" />
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" data-vaul-no-drag onClick={onToggleList}>
            {listOpen ? UI_LABELS.MAP_PANEL.HIDE_FULL_LIST : UI_LABELS.MAP_PANEL.VIEW_FULL_LIST}
          </Button>
        </>
      }
    >
      <PanelTitle stopNumber={String(stopOrder)} neighborhoods={neighborhoods} zipcodes={zipcodes} metrics={metrics} />
    </PanelSection>

    {/* The selected address lives in the SUMMARY view only; the full list IS the
        addresses. Highlighted by default — it IS the selected address. The anchor
        shows the vehicle glyph (RF-006.4.13); a tapped member shows its ordinal
        marker + complement (RF-006.4.16). */}
    {!listOpen && selectedItem && (
      <PanelSection label={isAnchor ? UI_LABELS.MAP_PANEL.SECTION_SELECTED_ANCHOR : UI_LABELS.MAP_PANEL.SECTION_SELECTED}>
        <StopItemRow item={selectedItem} onTap={onTapCard} highlighted expanded={expanded} neon {...(isAnchor ? { markerGlyph: "vehicle" as const } : {})} />
      </PanelSection>
    )}
  </div>
);
