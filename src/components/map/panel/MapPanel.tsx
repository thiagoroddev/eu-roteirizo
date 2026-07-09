import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
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

/**
 * Granularity of the drag ladder (fraction of the viewport). vaul only ever
 * rests ON a snap point — there is no free-form drag — so "any height the user
 * wants" is approximated by a dense ladder: the panel settles within half a step
 * (~1% of the screen) of wherever the finger let go. Clicks still jump straight
 * to the named heights (collapsed/half/full), which is what makes them a
 * shortcut instead of a cage. ⚙️ MANUAL KNOB: smaller = finer, more snap points.
 */
const LADDER_STEP = 0.02;

/**
 * The "half" command must clear the collapsed header by at least this much, or
 * tapping a card would "open" a detail that stays below the fold — the panel
 * would appear not to grow (RF-006.4.17). Only bites when the header is TALL
 * (the roteiro's stacked sections); the Original's short header keeps its 0.45.
 */
const DETAIL_REVEAL_PX = 120;

/** Ladder from just above the collapsed height up to full, always containing the
    two named fractions so a command lands on an exact, testable value. */
const buildLadder = (collapsedPx: number, viewportPx: number, halfValue: number): (string | number)[] => {
  const collapsed = `${collapsedPx}px`;
  if (viewportPx <= 0) return [collapsed, halfValue, FULL_FRACTION]; // no window (jsdom): the classic three
  const floor = collapsedPx / viewportPx;
  const steps = new Set<number>([halfValue, FULL_FRACTION]);
  for (let f = LADDER_STEP; f < FULL_FRACTION; f += LADDER_STEP) steps.add(Math.round(f * 100) / 100);
  return [collapsed, ...[...steps].filter((f) => f > floor && f <= FULL_FRACTION).sort((a, b) => a - b)];
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

  /** The collapsed snap FITS the header content (RF-006.4.12): the panel shows
      exactly the active section — no cut buttons, no empty space. Measured live;
      without ResizeObserver (jsdom/tests) it falls back to the calibrated px. */
  const headerRef = useRef<HTMLDivElement>(null);
  const [collapsedPx, setCollapsedPx] = useState(PANEL_COLLAPSED_PX);
  const [viewportPx, setViewportPx] = useState(() => (typeof window === "undefined" ? 0 : window.innerHeight));
  useEffect(() => {
    const el = headerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      setViewportPx(window.innerHeight);
      const height = el.getBoundingClientRect().height;
      if (height <= 0) return; // pre-layout: keep the fallback
      const max = window.innerHeight * COLLAPSED_MAX_FRACTION;
      const fitted = height + COLLAPSED_BUFFER_PX + collapsedAdjustPx;
      setCollapsedPx(Math.round(Math.min(Math.max(fitted, COLLAPSED_MIN_PX), max)));
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [collapsedAdjustPx]);

  const collapsedValue = `${collapsedPx}px`;
  /** "half" never lands below the collapsed header + a detail's worth of room. */
  const halfValue = useMemo(() => {
    if (viewportPx <= 0) return halfFraction;
    const raw = Math.max(halfFraction, (collapsedPx + DETAIL_REVEAL_PX) / viewportPx);
    return Math.min(Math.round(raw * 100) / 100, FULL_FRACTION);
  }, [halfFraction, collapsedPx, viewportPx]);
  const snapPoints = useMemo(() => buildLadder(collapsedPx, viewportPx, halfValue), [collapsedPx, viewportPx, halfValue]);

  const valueOf = useCallback((label: PanelSnap) => (label === "full" ? FULL_FRACTION : label === "half" ? halfValue : collapsedValue), [halfValue, collapsedValue]);
  const labelOf = useCallback((value: string | number): PanelSnap => {
    if (value === FULL_FRACTION) return "full";
    if (typeof value === "string") return "collapsed";
    return "half"; // every intermediate rung of the ladder reads as "half"
  }, []);

  const [internalSnap, setInternalSnap] = useState<PanelSnap>("collapsed");
  const currentLabel = snap ?? internalSnap;

  /**
   * The height the user DRAGGED to, remembered against the label it belongs to.
   * A drag may settle on any rung of the ladder; deriving the height purely from
   * the coarse label would yank the panel back to collapsed/half/full on the next
   * render — the "engessado" feel. So while the label is unchanged the drag wins,
   * and a click (which changes the label) jumps to the named height.
   *
   * While collapsed the value is re-read from `collapsedValue`, so an opening
   * detail grows the header and the panel grows with it (fit-content).
   */
  const [drag, setDrag] = useState<{ label: PanelSnap; value: string | number } | null>(null);
  const dragged = drag?.label === currentLabel ? drag.value : null;
  const activeValue: string | number = dragged === null || typeof dragged === "string" ? (currentLabel === "collapsed" ? collapsedValue : valueOf(currentLabel)) : dragged;

  const handleSnapValue = (value: string | number | null) => {
    if (value === null) return;
    const next = labelOf(value);
    setDrag({ label: next, value }); // keep the exact rung the finger chose
    if (snap === undefined) setInternalSnap(next);
    onSnapChange?.(next);
  };

  return (
    <Drawer.Root open modal={false} dismissible={false} snapPoints={snapPoints} activeSnapPoint={activeValue} setActiveSnapPoint={handleSnapValue}>
      <Drawer.Portal>
        {/* No Drawer.Overlay on purpose: non-modal persistent panel — the map stays interactive. */}
        {/* h-full WITHOUT a max-h cap: vaul computes snap offsets assuming the content
            spans the viewport — capping it (e.g. max-h-[85%]) shifts EVERY snap down by
            the capped amount (collapsed ends up cut). FULL_FRACTION already limits how
            far up the panel goes. */}
        <Drawer.Content aria-describedby={undefined} className="fixed inset-x-0 bottom-0 z-[1200] flex h-full flex-col rounded-t-2xl border-t border-input bg-background outline-none">
          <Drawer.Title className="sr-only">{UI_LABELS.MAP_PANEL.ARIA}</Drawer.Title>
          {/* Grabber + header = the collapsed-snap content, measured to fit it exactly. */}
          <div ref={headerRef}>
            <div aria-hidden className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-muted" />
            {header}
          </div>
          {/* Scrolls at ANY height above collapsed: the user may drag to an
              in-between rung, and content taller than it must stay reachable.
              pb-[15dvh]: at the full snap the content's bottom sits below the
              viewport — the padding keeps the last scrolled item visible. */}
          <div className={currentLabel === "collapsed" ? "flex-1 overflow-hidden" : "flex-1 overflow-y-auto pb-[15dvh]"}>{children}</div>
          {footer}
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
