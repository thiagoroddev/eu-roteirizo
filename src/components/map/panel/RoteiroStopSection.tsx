import type { ReactNode } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "../../ui/button";
import { Badge } from "../../ui/badge";
import { PanelSection } from "./PanelSection";
import { PanelTitle, type PanelMetric } from "./PanelTitle";
import { StopItemRow, StopItemDetail } from "./StopItem";
import type { StopItemData } from "../../../utils/markers/panelModels";
import type { MarkerColor } from "../../../utils/markers/markerSvg";
import { UI_LABELS } from "../../../constants/uiLabels";

const STOP = UI_LABELS.MAP_PANEL.ROTEIRO_STOP;

/**
 * RoteiroStopSection - a committed stop, selected on the map (TASK-RF-006.4.2/
 * .4.3/.4.7; simplified in TASK-RF-006.15; revised in RF-53 / TASK-RF-038).
 *
 * - "Resumo da parada": label com badge colorido P{N} na cor do ícone,
 *   endereço do veículo em 2 linhas (logradouro/distância e bairro/CEP) + typed chips + ações.
 * - "Endereço selecionado": NÃO é exibido para parada agrupada (isExpanded === false).
 *   Ao desagrupar (isExpanded === true), exibe a primeira entrega selecionada por padrão,
 *   sem selo de veículo e sem linha de veículo.
 */
interface Props {
  stopOrder: number;
  neighborhoods: string[];
  zipcodes: string[];
  /** endereços · pacotes POR TIPO · "~min · m a pé" (typed chips — RF-006.4.3). */
  metrics: PanelMetric[];
  /** The selected address of the stop — a tapped member or the anchor — null while empty. */
  selectedItem: StopItemData | null;
  /** How to render the selected row (kept for backwards compatibility). */
  selectedKind?: "member" | "coincident" | "vehicle";
  /** Whether the selected-address detail is open in the panel body. */
  expanded: boolean;
  onTapCard: () => void;
  onEdit: () => void;
  onDissolve: () => void;
  /** Whether the full-list view is open (flips the toggle + hides the address row). */
  listOpen: boolean;
  onToggleList: () => void;
  /** Custom title string/node overriding the standard "Parada N — Bairro" (RF-53 / TASK-RF-038). */
  titleOverride?: ReactNode;
  /** Custom subtitle string/node overriding default place formatting (RF-53 / TASK-RF-038). */
  subtitleOverride?: ReactNode;
  /** Whether the stop is ungrouped/expanded on the map (RF-53 / TASK-RF-038). */
  isExpanded?: boolean;
  /** Color tokens of the stop marker for the P{N} badge (RF-53 / TASK-RF-038). */
  stopColor?: MarkerColor;
}

export const RoteiroStopSection = ({
  stopOrder,
  neighborhoods,
  zipcodes,
  metrics,
  selectedItem,
  expanded,
  onTapCard,
  onEdit,
  onDissolve,
  listOpen,
  onToggleList,
  titleOverride,
  subtitleOverride,
  isExpanded = false,
  stopColor,
}: Props) => {
  const badgeStyle = stopColor
    ? {
        background: `linear-gradient(to bottom, ${stopColor.top}, ${stopColor.bottom})`,
        color: stopColor.numberInk ?? "#FFFFFF",
        border: "none",
      }
    : undefined;

  const sectionLabel = (
    <span className="flex items-center gap-2 text-base font-semibold text-foreground">
      <span>{UI_LABELS.MAP_PANEL.SECTION_STOP}</span>
      <Badge style={badgeStyle} className="px-2 py-0.5 text-xs font-bold shrink-0">
        P{stopOrder}
      </Badge>
    </span>
  );

  return (
    <div>
      <PanelSection
        label={sectionLabel}
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
              <Trash2 aria-hidden className="h-4 w-4" />
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" data-vaul-no-drag onClick={onToggleList}>
              {listOpen ? UI_LABELS.MAP_PANEL.HIDE_FULL_LIST : UI_LABELS.MAP_PANEL.VIEW_FULL_LIST}
            </Button>
          </>
        }
      >
        <PanelTitle stopNumber={String(stopOrder)} neighborhoods={neighborhoods} zipcodes={zipcodes} metrics={metrics} titleOverride={titleOverride} subtitleOverride={subtitleOverride} />
      </PanelSection>

      {/* O card "Endereço selecionado" só aparece quando a parada está desagrupada (isExpanded === true)
          e a lista não está aberta (RF-53 / TASK-RF-038). */}
      {isExpanded && !listOpen && selectedItem && (
        <PanelSection label={UI_LABELS.MAP_PANEL.SECTION_SELECTED}>
          <StopItemRow item={selectedItem} onTap={onTapCard} highlighted expanded={expanded} neon />
          {/* A member drills its packages down right here (RF-006.15). */}
          {expanded && <StopItemDetail item={selectedItem} />}
        </PanelSection>
      )}
    </div>
  );
};
