import { useState, type ReactNode } from "react";
import { Drawer } from "vaul";
import { UI_LABELS } from "../../../constants/uiLabels";

/**
 * MapPanel - the persistent bottom sheet of the map screen (TASK-RF-023.2,
 * design: docs/design/arvore-componentes-mapa.md, fluxo-modo-original §6).
 *
 * Always visible and NEVER dismissible: the minimum snap keeps the header
 * (stop number + address) on screen; the user drags between collapsed, half
 * and full. Non-modal — the map behind stays interactive.
 *
 * Built directly on `vaul` (the shadcn Drawer primitive) instead of a generic
 * ui/drawer.tsx wrapper: the shadcn wrapper models the modal-dismissible case
 * (overlay/trigger/close), the exact opposite of this panel. This is the only
 * module importing vaul. Note: vaul's repo is flagged unmaintained — stable,
 * shadcn-standard lib; risk accepted by the human (05/07/26).
 *
 * Structure is mode-agnostic: `header`/`children`/`footer` are slots; the
 * Original mode fills them read-only, Meu roteiro/execution fill them later
 * (RF-006/009) without touching this shell.
 */

export type PanelSnap = "collapsed" | "half" | "full";

/**
 * Height (px) of the collapsed snap = the always-visible header (grabber + mode
 * bar + "Resumo da parada" section + divider + "Endereço selecionado" card),
 * calibrated on device. Exported so the map can pad its fitBounds and keep
 * markers above the panel (RF-023.5).
 */
export const PANEL_COLLAPSED_PX = 224;

/** Snap values (identity matters: vaul compares activeSnapPoint by value/reference). */
const SNAP_VALUES: Record<PanelSnap, string | number> = {
  collapsed: `${PANEL_COLLAPSED_PX}px`,
  half: 0.45, // fraction of the viewport height
  full: 0.9,
};
const SNAP_POINTS = [SNAP_VALUES.collapsed, SNAP_VALUES.half, SNAP_VALUES.full];

const snapFromValue = (value: string | number | null): PanelSnap => {
  if (value === SNAP_VALUES.full) return "full";
  if (value === SNAP_VALUES.half) return "half";
  return "collapsed"; // includes null (defensive)
};

interface Props {
  /** Always-visible part (min snap): stop number + address; also the drag area. */
  header: ReactNode;
  /** Body content; scrolls internally only at the "full" snap (vaul pattern). */
  children: ReactNode;
  /** CTA slot — ⚠️ only VISIBLE at the "full" snap: the Content spans the whole
      viewport and the slot sits at its bottom, below the fold on lower snaps
      (RF-006.4.1). Always-visible CTAs belong in the header. */
  footer?: ReactNode;
  /** Optional controlled snap; uncontrolled by default (drag doesn't re-render the page). */
  snap?: PanelSnap;
  onSnapChange?: (snap: PanelSnap) => void;
}

export const MapPanel = ({ header, children, footer, snap, onSnapChange }: Props) => {
  const [internalSnap, setInternalSnap] = useState<PanelSnap>("collapsed");
  const effectiveSnap = snap ?? internalSnap;

  const handleSnapValue = (value: string | number | null) => {
    const next = snapFromValue(value);
    if (snap === undefined) setInternalSnap(next);
    onSnapChange?.(next);
  };

  return (
    <Drawer.Root open modal={false} dismissible={false} snapPoints={SNAP_POINTS} activeSnapPoint={SNAP_VALUES[effectiveSnap]} setActiveSnapPoint={handleSnapValue} snapToSequentialPoint>
      <Drawer.Portal>
        {/* No Drawer.Overlay on purpose: non-modal persistent panel — the map stays interactive. */}
        {/* h-full WITHOUT a max-h cap: vaul computes snap offsets assuming the content
            spans the viewport — capping it (e.g. max-h-[90%]) shifts EVERY snap down by
            the capped amount (collapsed ends up cut). The "full" snap (0.9) already
            limits how far up the panel goes. */}
        <Drawer.Content aria-describedby={undefined} className="fixed inset-x-0 bottom-0 z-[1200] flex h-full flex-col rounded-t-2xl border-t border-input bg-background outline-none">
          <Drawer.Title className="sr-only">{UI_LABELS.MAP_PANEL.ARIA}</Drawer.Title>
          {/* Grabber — visual hint that the panel drags. */}
          <div aria-hidden className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-muted" />
          {header}
          {/* pb-[10dvh]: at the full snap (0.9) the content's bottom 10% sits below the
              viewport — the padding keeps the last scrolled item reachable/visible. */}
          <div className={effectiveSnap === "full" ? "flex-1 overflow-y-auto pb-[10dvh]" : "flex-1 overflow-hidden"}>{children}</div>
          {footer}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
