import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Drawer } from "vaul";
import { UI_LABELS } from "../../../constants/uiLabels";
import { ORIGINAL_PANEL_SIZING, type PanelSizing } from "./panelSizing";

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

/** Floor for the fit-content collapsed snap — never smaller than the grabber +
    mode bar + one line (RF-006.4.12). ⚙️ MANUAL KNOB: raise if short sections
    still look too tight. */
const COLLAPSED_MIN_PX = 132;
/** Ceiling for the fit-content collapsed snap, as a fraction of the viewport
    (RF-006.4.15). ⚙️ MANUAL KNOB: raise toward 1 if a tall section still cuts its
    buttons on your device (beyond this the section scrolls at the full snap). */
const COLLAPSED_MAX_FRACTION = 0.88;
/** A few px of slack so sub-pixel rounding never clips the last row (RF-006.4.15). */
const COLLAPSED_BUFFER_PX = 8;
const FULL_FRACTION = 0.85;

const snapFromValue = (value: string | number | null, halfFraction: number): PanelSnap => {
  if (value === FULL_FRACTION) return "full";
  if (value === halfFraction) return "half";
  return "collapsed"; // px string (collapsed) or null (defensive)
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
  /** Heights of the collapsed/half snaps — one set per map mode (panelSizing.ts). */
  sizing?: PanelSizing;
}

export const MapPanel = ({ header, children, footer, snap, onSnapChange, sizing = ORIGINAL_PANEL_SIZING }: Props) => {
  const { collapsedAdjustPx, halfFraction } = sizing;
  const [internalSnap, setInternalSnap] = useState<PanelSnap>("collapsed");
  const effectiveSnap = snap ?? internalSnap;

  /** The collapsed snap FITS the header content (RF-006.4.12): the panel shows
      exactly the active section — no cut buttons, no empty space. Measured live;
      without ResizeObserver (jsdom/tests) it falls back to the calibrated px. */
  const headerRef = useRef<HTMLDivElement>(null);
  const [collapsedPx, setCollapsedPx] = useState(PANEL_COLLAPSED_PX);
  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const height = el.getBoundingClientRect().height;
      if (height <= 0) return; // pre-layout: keep the fallback
      const max = window.innerHeight * COLLAPSED_MAX_FRACTION;
      const fitted = height + COLLAPSED_BUFFER_PX + collapsedAdjustPx;
      setCollapsedPx(Math.round(Math.min(Math.max(fitted, COLLAPSED_MIN_PX), max)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [collapsedAdjustPx]);

  const collapsedValue = `${collapsedPx}px`;
  const snapPoints = useMemo(() => [collapsedValue, halfFraction, FULL_FRACTION], [collapsedValue, halfFraction]);
  const snapValue: string | number = effectiveSnap === "full" ? FULL_FRACTION : effectiveSnap === "half" ? halfFraction : collapsedValue;

  const handleSnapValue = (value: string | number | null) => {
    const next = snapFromValue(value, halfFraction);
    if (snap === undefined) setInternalSnap(next);
    onSnapChange?.(next);
  };

  return (
    <Drawer.Root open modal={false} dismissible={false} snapPoints={snapPoints} activeSnapPoint={snapValue} setActiveSnapPoint={handleSnapValue} snapToSequentialPoint>
      <Drawer.Portal>
        {/* No Drawer.Overlay on purpose: non-modal persistent panel — the map stays interactive. */}
        {/* h-full WITHOUT a max-h cap: vaul computes snap offsets assuming the content
            spans the viewport — capping it (e.g. max-h-[90%]) shifts EVERY snap down by
            the capped amount (collapsed ends up cut). The "full" snap (0.9) already
            limits how far up the panel goes. */}
        <Drawer.Content aria-describedby={undefined} className="fixed inset-x-0 bottom-0 z-[1200] flex h-full flex-col rounded-t-2xl border-t border-input bg-background outline-none">
          <Drawer.Title className="sr-only">{UI_LABELS.MAP_PANEL.ARIA}</Drawer.Title>
          {/* Grabber + header = the collapsed-snap content, measured to fit it exactly. */}
          <div ref={headerRef}>
            <div aria-hidden className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-muted" />
            {header}
          </div>
          {/* pb-[10dvh]: at the full snap (0.9) the content's bottom 10% sits below the
              viewport — the padding keeps the last scrolled item reachable/visible. */}
          <div className={effectiveSnap === "full" ? "flex-1 overflow-y-auto pb-[10dvh]" : "flex-1 overflow-hidden"}>{children}</div>
          {footer}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
