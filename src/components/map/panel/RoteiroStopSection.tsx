import { Pencil, Undo2 } from "lucide-react";
import { Button } from "../../ui/button";
import { PanelSection } from "./PanelSection";
import { PanelTitle, type PanelMetric } from "./PanelTitle";
import { StopItemRow, StopItemDetail, VehicleNavLink } from "./StopItem";
import type { StopItemData } from "../../../utils/markers/panelModels";
import { UI_LABELS } from "../../../constants/uiLabels";

const STOP = UI_LABELS.MAP_PANEL.ROTEIRO_STOP;

/**
 * RoteiroStopSection - a committed stop, selected on the map (TASK-RF-006.4.2/
 * .4.3/.4.7; simplified in TASK-RF-006.15). Mirrors the Original header (via
 * PanelSection — the shared divider/label chrome):
 * - "Resumo da parada": title ("Parada N — bairro (CEPs)") + typed chips, with
 *   the three actions on the label's line (RF-006.4.17 — "Ver parada", "Editar
 *   parada" and an icon-only "Desfazer parada").
 * - "Endereço selecionado": the row shape follows `selectedKind` (RF-006.17):
 *   - "vehicle": the VEHICLE STOP representation (grouped summary, or the
 *     ungrouped DISTINCT anchor) — car glyph + "Parada do veículo" badge, no
 *     package count, not tappable.
 *   - "coincident": the vehicle parks ON this delivery address (ungrouped) —
 *     the normal delivery row (ordinal + packages, tappable) plus a car badge.
 *   - "member": a plain tapped member (ordinal + packages, tappable).
 *
 * Anchor EDITING (move/reverse/reset/make-anchor) is NOT here (RF-006.15
 * reverted RF-006.5): a firmed stop is read-only; editing the anchor means
 * "Editar parada" (reopen as draft).
 */
interface Props {
  stopOrder: number;
  neighborhoods: string[];
  zipcodes: string[];
  /** endereços · pacotes POR TIPO · "~min · m a pé" (typed chips — RF-006.4.3). */
  metrics: PanelMetric[];
  /** The selected address of the stop — a tapped member or the anchor — null while empty. */
  selectedItem: StopItemData | null;
  /** How to render the selected row (RF-006.17): the vehicle stop, a coincident
      delivery (vehicle + packages), or a plain member. */
  selectedKind: "member" | "coincident" | "vehicle";
  /** Whether the selected-address detail is open in the panel body. */
  expanded: boolean;
  onTapCard: () => void;
  onEdit: () => void;
  onDissolve: () => void;
  /** Whether the full-list view is open (flips the toggle + hides the address row). */
  listOpen: boolean;
  onToggleList: () => void;
}

export const RoteiroStopSection = ({ stopOrder, neighborhoods, zipcodes, metrics, selectedItem, selectedKind, expanded, onTapCard, onEdit, onDissolve, listOpen, onToggleList }: Props) => {
  const isVehicle = selectedKind === "vehicle";
  return (
    <div>
      <PanelSection
        label={UI_LABELS.MAP_PANEL.SECTION_STOP}
        /* All three actions ride the label's line (RF-006.4.17): every row removed
           from the header shortens the collapsed panel. Compact sizing; "Desfazer"
           drops to icon-only (its label is the accessible name) — "Editar" keeps
           its text, being the one the user reaches for. */
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
        {/* Title always the stop's PLACE (RF-006.15 reverted the "Veículo (âncora)"
            swap): the vehicle-stop info lives on the address row, not the title. */}
        <PanelTitle stopNumber={String(stopOrder)} neighborhoods={neighborhoods} zipcodes={zipcodes} metrics={metrics} />
      </PanelSection>

      {/* The selected address lives in the SUMMARY view only; the full list IS the
          addresses. Section label always "Endereço selecionado" (RF-006.15). The
          row shape follows `selectedKind` (RF-006.17/.18): the vehicle stop (car
          glyph + "Parada do veículo", no packages, not tappable, with a quick
          "Editar local" that reopens the draft), the delivery it parks by (same
          badge, but a normal tappable delivery) or a plain member. */}
      {!listOpen && selectedItem && (
        <PanelSection label={UI_LABELS.MAP_PANEL.SECTION_SELECTED}>
          {isVehicle ? (
            /* The vehicle stop is its OWN independent row (RF-006.18): a quick
               "Editar local" reopens the draft (same as "Editar parada"), ready
               to move the car — no need to open the full edit first. The
               highlight (bg-accent) rides the WHOLE row so the button stays
               inside it, not floating past the edge. */
            <div className="flex items-center bg-accent">
              <div className="min-w-0 flex-1">
                <StopItemRow item={selectedItem} onTap={() => {}} highlighted neon markerGlyph="vehicle" vehicleStop />
              </div>
              {/* "Como chegar" à âncora (RF-006.9): direções para a coordenada dela. */}
              <VehicleNavLink mapsUrl={selectedItem.mapsUrl} />
              <Button type="button" variant="ghost" size="icon" className="mr-2 h-8 w-8 shrink-0" data-vaul-no-drag onClick={onEdit} title={STOP.EDIT_VEHICLE} aria-label={STOP.EDIT_VEHICLE}>
                <Pencil aria-hidden className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <StopItemRow item={selectedItem} onTap={onTapCard} highlighted expanded={expanded} neon {...(selectedKind === "coincident" ? { vehicleStop: true } : {})} />
              {/* A member drills its packages down right here (RF-006.15). */}
              {expanded && <StopItemDetail item={selectedItem} />}
            </>
          )}
        </PanelSection>
      )}
    </div>
  );
};
