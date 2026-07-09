import { Button } from "../../ui/button";
import { PanelSection } from "./PanelSection";
import { PanelTitle, type PanelMetric } from "./PanelTitle";
import { StopItemRow } from "./StopItem";
import type { StopItemData } from "../../../utils/markers/panelModels";
import { UI_LABELS } from "../../../constants/uiLabels";

const STOP = UI_LABELS.MAP_PANEL.ROTEIRO_STOP;

/**
 * RoteiroStopSection - a committed stop, selected on the map (TASK-RF-006.4.2/
 * .4.3 — partial .6, fluxo §9). The panel's 2ª seção, SAME structure as the
 * Original (via PanelSection — divider + label chrome shared by both modes):
 * "Resumo da parada" (title "Parada N — bairros (CEPs)" + the Original's TYPED
 * package chips + the walking-estimate chip) + "Endereço selecionado" (first
 * address by walking order, ordinal "1º", tap → detail in the panel body) —
 * plus the actions beside the section label: "Editar parada" (reopens as the
 * edit draft) and "Desfazer parada" (addresses go back to free — §9).
 */
interface Props {
  stopOrder: number;
  neighborhoods: string[];
  zipcodes: string[];
  /** endereços · pacotes POR TIPO · "~min · m a pé" (typed chips — RF-006.4.3). */
  metrics: PanelMetric[];
  /** First address by walking order, adapted with ordinal 1 (pointToStopItemData). */
  item: StopItemData | null;
  expanded: boolean;
  onTapCard: () => void;
  onEdit: () => void;
  onDissolve: () => void;
}

export const RoteiroStopSection = ({ stopOrder, neighborhoods, zipcodes, metrics, item, expanded, onTapCard, onEdit, onDissolve }: Props) => (
  <div>
    <PanelSection
      label={UI_LABELS.MAP_PANEL.SECTION_STOP}
      actions={
        <>
          <Button type="button" size="sm" data-vaul-no-drag onClick={onEdit}>
            {STOP.EDIT}
          </Button>
          <Button type="button" variant="outline" size="sm" data-vaul-no-drag onClick={onDissolve}>
            {STOP.DISSOLVE}
          </Button>
        </>
      }
    >
      <PanelTitle stopNumber={String(stopOrder)} neighborhoods={neighborhoods} zipcodes={zipcodes} metrics={metrics} />
    </PanelSection>

    {item && (
      <PanelSection label={UI_LABELS.MAP_PANEL.SECTION_SELECTED}>
        <StopItemRow item={item} onTap={onTapCard} highlighted={expanded} expanded={expanded} neon />
      </PanelSection>
    )}
  </div>
);
