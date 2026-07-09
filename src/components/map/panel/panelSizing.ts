/**
 * Per-mode heights of the MapPanel's collapsed and half snaps (RF-006.4.17).
 *
 * Each mode packs different content into the always-visible header — the
 * Original shows a stop summary plus the selected address card, Meu roteiro
 * shows a state header whose height changes by context — so one size does not
 * fit both. Lives outside MapPanel.tsx because a component file may only export
 * components and literal constants (react-refresh/only-export-components).
 *
 * ⚙️ MANUAL KNOBS — the two numbers to tune by eye:
 *
 * - `collapsedAdjustPx`: px added to the MEASURED header height. Keep it a
 *   DELTA, never an absolute: the collapsed snap fits its content
 *   (RF-006.4.12) and the roteiro header changes height by context (start /
 *   suggestion / stop selected / drafting), so a fixed px would cut the taller
 *   contexts. Negative shortens the panel.
 * - `halfFraction`: the middle snap as a fraction of the viewport.
 *
 * ⚠️ DevTools shows OFFSETS, not heights. vaul renders
 * `transform: translate3d(0, Npx, 0)` where `N = viewportHeight - panelHeight`,
 * so a BIGGER N means a SHORTER panel. To go from an offset you read on screen
 * to the height to aim for: `panelHeight = viewportHeight - N`.
 */
export interface PanelSizing {
  collapsedAdjustPx: number;
  halfFraction: number;
}

/** Original mode: the fit-content default, unchanged since RF-006.4.15. */
export const ORIGINAL_PANEL_SIZING: PanelSizing = { collapsedAdjustPx: 0, halfFraction: 0.45 };

/** Meu roteiro: shorter than the Original at both snaps (calibrated 09/07/26). */
export const ROTEIRO_PANEL_SIZING: PanelSizing = { collapsedAdjustPx: -10, halfFraction: 0.39 };
