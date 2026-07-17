import { Car, Minus, Plus } from "lucide-react";
import { Button } from "../../ui/button";
import { PanelModeBar } from "./PanelModeBar";
import { PanelSection } from "./PanelSection";
import { PanelMetricsRow, type PanelMetric } from "./PanelTitle";
import { StopItemList } from "./StopItemList";
import { StopItemRow } from "./StopItem";
import type { StopItemData } from "../../../utils/markers/panelModels";
import { UI_LABELS } from "../../../constants/uiLabels";

const DRAFT = UI_LABELS.MAP_PANEL.ROTEIRO_DRAFT;
const STOP = UI_LABELS.MAP_PANEL.ROTEIRO_STOP;

/** Radius stepper bounds (tela 9): 10 m steps keep the control simple in the field. */
export const RADIUS_STEP = 10;
export const RADIUS_MIN = 10;
export const RADIUS_MAX = 200;

/**
 * RadiusStepper - the grouping-radius ± control, shared by the draft body and
 * the "Parada sugerida" preview (RF-006.4.6, so the radius is set BEFORE
 * creating too). Label + value + clamped 10 m steps.
 */
export const RadiusStepper = ({ radiusMeters, onRadiusChange }: { radiusMeters: number; onRadiusChange: (meters: number) => void }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-xs text-muted-foreground">{DRAFT.RADIUS_LABEL}</span>
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="icon"
        data-vaul-no-drag
        className="h-8 w-8"
        aria-label={DRAFT.RADIUS_DECREASE}
        disabled={radiusMeters <= RADIUS_MIN}
        onClick={() => onRadiusChange(Math.max(RADIUS_MIN, radiusMeters - RADIUS_STEP))}
      >
        <Minus aria-hidden />
      </Button>
      <span className="min-w-12 text-center text-sm font-medium">{DRAFT.RADIUS_VALUE(radiusMeters)}</span>
      <Button
        type="button"
        variant="outline"
        size="icon"
        data-vaul-no-drag
        className="h-8 w-8"
        aria-label={DRAFT.RADIUS_INCREASE}
        disabled={radiusMeters >= RADIUS_MAX}
        onClick={() => onRadiusChange(Math.min(RADIUS_MAX, radiusMeters + RADIUS_STEP))}
      >
        <Plus aria-hidden />
      </Button>
    </div>
  </div>
);

/**
 * RoteiroDraftSection - the stop-edit panel (tela 9, fluxo §4/§8 —
 * TASK-RF-006.4/.4.1/.4.2/.4.3), split by MapPanel slot: the header carries the
 * CTAs (Salvar/Cancelar MUST live here — the MapPanel `footer` slot is only
 * visible at the full snap), the metric CHIPS (same Badge language as the
 * Original's PanelTitle, walking estimate included), the global "Faltando" line
 * and the map-tap hint (first steps only). The body is the Original's FULL LIST
 * structure (3ª rodada 08/07 — "exatamente a mesma estrutura do 'Ver lista
 * completa'"): the grouping-radius CARD, then "Endereços da parada" and
 * "Candidatos no raio" as StopItemLists (expandable cards with the package
 * detail), each row with an add/remove trailing action.
 */

interface HeaderProps {
  stopNumber: number;
  /** Chips: endereços · pacotes · "~min · m a pé" (walkEstimateLabel). */
  metrics: PanelMetric[];
  /** Chosen-address count — the tap hint shows only while ≤ 1 (first steps). */
  addresses: number;
  /** Radius card, FIXED in this first section (RF-006.4.25): it used to live in
      the body, so the map-tapped pick slotting into the header pushed it around. */
  radiusMeters: number;
  onRadiusChange: (meters: number) => void;
  candidateCount: number;
  /** RN-17: some chosen point sits far from the anchor — orient, never block. */
  farWarning: boolean;
  canSave: boolean;
  onSave: () => void;
  onCancel: () => void;
}

export const RoteiroDraftHeader = ({ stopNumber, metrics, addresses, radiusMeters, onRadiusChange, candidateCount, farWarning, canSave, onSave, onCancel }: HeaderProps) => (
  <div className="pt-1">
    <PanelModeBar modeLabel={UI_LABELS.MAP_PANEL.MODE_DRAFT} />
    <div className="flex items-center justify-between gap-2 px-4">
      <p className="text-sm font-semibold">{DRAFT.TITLE(stopNumber)}</p>
      <div className="flex shrink-0 gap-2">
        <Button type="button" size="sm" data-vaul-no-drag disabled={!canSave} onClick={onSave}>
          {DRAFT.SAVE}
        </Button>
        <Button type="button" variant="outline" size="sm" data-vaul-no-drag onClick={onCancel}>
          {DRAFT.CANCEL}
        </Button>
      </div>
    </div>
    {/* pt-0.5 + the row's own mt-1.5 ≈ the panel's 8px rhythm below the CTAs
        (REF-016 — the Save/Cancel borders sat almost on the chips). */}
    <div className="px-4 pt-0.5">
      <PanelMetricsRow metrics={metrics} />
    </div>
    {/* No global "Faltando" here (RF-006.4.25): the edit is about ONE stop; the
        roteiro-wide HUD returns with the summary when the edit closes. */}
    {/* Map taps SELECT during the edit — hint only on the FIRST steps (rev. 08/07). */}
    {addresses <= 1 && <p className="px-4 pt-0.5 text-xs italic text-muted-foreground">{DRAFT.TAP_HINT}</p>}
    {/* Grouping-radius CARD (rev. 08/07 3ª rodada): stepper + candidates line.
        px-3 py-2 (not p-3): the card follows the panel's 8px rhythm — its old
        12px padding was the "muito espaço interno" of the smoke (REF-016). */}
    <div className="mx-4 mt-2 rounded-lg border border-input px-3 py-2">
      <RadiusStepper radiusMeters={radiusMeters} onRadiusChange={onRadiusChange} />
      <p className="pt-1.5 text-xs font-medium text-muted-foreground">{DRAFT.BANNER_CANDIDATES(candidateCount)}</p>
      {farWarning && <p className="pt-1 text-xs font-medium text-destructive">{DRAFT.FAR_WARNING}</p>}
    </div>
    <div className="pb-2" />
  </div>
);

/**
 * RoteiroDraftPick - the free point tapped on the MAP during the edit
 * (RF-006.4.23/.4.24). Rendered in the panel HEADER (beside the other draft
 * chrome), NOT in the body: the collapsed snap fits the header, so picking an
 * address grows the panel until it shows — like every other selected-address
 * section. The tap looks; this CTA is what edits.
 */
export const RoteiroDraftPick = ({ item, onAdd }: { item: StopItemData; onAdd?: () => void }) => (
  <PanelSection
    label={UI_LABELS.MAP_PANEL.SECTION_SELECTED}
    actions={
      <Button type="button" size="sm" className="h-7 px-2 text-xs" data-vaul-no-drag onClick={onAdd}>
        {DRAFT.ADD_TO_STOP}
      </Button>
    }
  >
    <StopItemRow item={item} onTap={() => {}} highlighted neon />
  </PanelSection>
);

interface BodyProps {
  /** Members/candidates in the Original list vocabulary (pointToStopItemData);
      `addressKey` is the point id — the toggle target. */
  chosen: StopItemData[];
  candidates: StopItemData[];
  onTogglePoint: (pointId: string) => void;
  /** The stop's ANCHOR as a row (RF-006.6) — the circuit's start AND end; null
      while the draft has no members. Address is a placeholder until RF-006.9. */
  anchorItem: StopItemData | null;
  /** Anchor/sense gestures inside the edit — mirrors the firmed stop (RF-006.5/.6). */
  onResetAnchor: () => void;
  onReverseOrder: () => void;
  onMakeAnchor: (pointId: string) => void;
  /** Anchor left its default → "Resetar âncora" shows (RF-006.6). */
  anchorMoved: boolean;
}

/** Trailing add/remove action of a list row (map taps toggle the same way). */
const toggleAction = (item: StopItemData, icon: "add" | "remove", onTogglePoint: (pointId: string) => void) => {
  const aria = icon === "add" ? DRAFT.ADD_POINT(item.addressLine) : DRAFT.REMOVE_POINT(item.addressLine);
  return (
    <Button type="button" variant="outline" size="icon" data-vaul-no-drag className="h-8 w-8" aria-label={aria} title={aria} onClick={() => onTogglePoint(item.addressKey)}>
      {icon === "add" ? <Plus aria-hidden /> : <Minus aria-hidden />}
    </Button>
  );
};

/** "Tornar âncora" + "Remover" of a chosen row (spec §9 — the two things you can
    do to an address INSIDE a stop; ordering is not one of them, RF-006.6). */
const memberActions = (item: StopItemData, onMakeAnchor: (pointId: string) => void, onTogglePoint: (pointId: string) => void) => {
  const anchorAria = `${STOP.MAKE_ANCHOR}: ${item.addressLine}`;
  return (
    <div className="flex items-center gap-1">
      <Button type="button" variant="outline" size="icon" data-vaul-no-drag className="h-8 w-8" aria-label={anchorAria} title={STOP.MAKE_ANCHOR} onClick={() => onMakeAnchor(item.addressKey)}>
        <Car aria-hidden className="h-4 w-4" />
      </Button>
      {toggleAction(item, "remove", onTogglePoint)}
    </div>
  );
};

export const RoteiroDraftBody = ({ chosen, candidates, onTogglePoint, anchorItem, onResetAnchor, onReverseOrder, onMakeAnchor, anchorMoved }: BodyProps) => (
  <div className="pb-2">
    <PanelSection
      label={DRAFT.SECTION_CHOSEN}
      /* Edit actions ride the label's line (RF-006.16): "Resetar local do
         veículo" (only when the anchor left its default) and "Inverter ordem". */
      actions={
        chosen.length === 0 ? undefined : (
          <>
            {anchorMoved && (
              <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" data-vaul-no-drag onClick={onResetAnchor}>
                {STOP.RESET_ANCHOR}
              </Button>
            )}
            <Button type="button" variant="outline" size="sm" className="h-7 px-2 text-xs" data-vaul-no-drag onClick={onReverseOrder}>
              {STOP.REVERSE_ORDER}
            </Button>
          </>
        )
      }
    >
      {chosen.length === 0 ? (
        <p className="px-4 py-2 text-xs text-muted-foreground">{DRAFT.EMPTY_HINT}</p>
      ) : (
        <>
          {/* The ANCHOR opens the list: it is where the walk starts and ends
              (RF-006.6) — the vehicle stop (car glyph + badge, no packages). The
              hint says moving = drag the car (edit is the only place it moves). */}
          {anchorItem && (
            <div className="border-b border-input">
              <StopItemRow item={anchorItem} onTap={() => {}} markerGlyph="vehicle" neon vehicleStop />
              <p className="px-4 pb-2 text-xs text-muted-foreground">{STOP.MOVE_ANCHOR_HINT}</p>
            </div>
          )}
          <StopItemList items={chosen} selectedKey={null} neon itemTrailing={(item) => memberActions(item, onMakeAnchor, onTogglePoint)} />
        </>
      )}
    </PanelSection>

    {candidates.length > 0 && (
      <PanelSection label={DRAFT.SECTION_CANDIDATES}>
        <StopItemList items={candidates} selectedKey={null} neon itemTrailing={(item) => toggleAction(item, "add", onTogglePoint)} />
      </PanelSection>
    )}
  </div>
);
