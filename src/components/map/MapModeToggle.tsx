import { cn } from "@/lib/utils";
import { UI_LABELS } from "../../constants/uiLabels";

export type MapMode = "original" | "roteiro";

/**
 * Query-param contract of the map mode (TASK-RF-006.2): `/mapa?...&modo=roteiro`
 * opens in Meu roteiro. Lives beside MapMode so SummaryPage (writes the link)
 * and MapPage (derives the mode) share one source instead of magic strings.
 */
export const MODE_QUERY_PARAM = "modo";
export const MODE_QUERY_ROTEIRO = "roteiro";

interface Props {
  mode: MapMode;
  onModeChange: (mode: MapMode) => void;
  /**
   * Whether the "Meu roteiro" side is available. Phase 1 ships false (disabled
   * with a "coming soon" hint) — TASK-RF-010 flips it when the builder flow
   * (RF-006) exists. The contract is ready so callers don't change shape.
   */
  roteiroEnabled?: boolean;
  /** Whether the "Original" side is available (disabled for standalone imported routes, RF-20). */
  originalEnabled?: boolean;
  /** Texts (TASK-REF-017): defaults are the MAP's; the Sumário reuses the same
   *  control with its own wording ("Info Original"/"Info Meu Roteiro"). */
  originalLabel?: string;
  roteiroLabel?: string;
  ariaLabel?: string;
  /** Hint shown when the roteiro side is disabled. */
  disabledHint?: string;
  /** Hint shown when the original side is disabled. */
  originalDisabledHint?: string;
}

/**
 * MapModeToggle - the segmented `Original | Meu roteiro` control that lives at
 * the top of the map screen (fluxo §11 "Modos do mapa" — NOT a bottom tab).
 * Original = read-only viewer (this phase); Meu roteiro = the editable builder.
 *
 * Generic by construction (no map dependency): the Sumário reuses it to switch
 * between "Info Original" and "Info Meu Roteiro" (TASK-REF-017) by overriding
 * the text props. Candidate to move to a neutral folder later.
 */
export const MapModeToggle = ({
  mode,
  onModeChange,
  roteiroEnabled = false,
  originalEnabled = true,
  originalLabel = UI_LABELS.MAP_MODE.ORIGINAL,
  roteiroLabel = UI_LABELS.MAP_MODE.MY_ROTEIRO,
  ariaLabel = UI_LABELS.MAP_MODE.ARIA,
  disabledHint = UI_LABELS.MAP_MODE.MY_ROTEIRO_SOON,
  originalDisabledHint = UI_LABELS.MAP_MODE.ORIGINAL_DISABLED_STANDALONE,
}: Props) => {
  const segment = (target: MapMode, label: string, disabled: boolean, title?: string) => (
    <button
      type="button"
      disabled={disabled}
      title={title}
      aria-label={title ?? label}
      // Spread: the IDE's static a11y checker rejects ARIA values it cannot resolve.
      {...{ "aria-pressed": mode === target }}
      onClick={() => onModeChange(target)}
      className={cn(
        "flex-1 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
        mode === target ? "bg-primary text-primary-foreground" : "text-muted-foreground",
        disabled && "opacity-50"
      )}
    >
      {label}
    </button>
  );

  return (
    <div role="group" aria-label={ariaLabel} className="flex w-fit min-w-64 rounded-full border border-input bg-background/95 p-1 shadow-md backdrop-blur-sm">
      {segment("original", originalLabel, !originalEnabled, originalEnabled ? undefined : originalDisabledHint)}
      {segment("roteiro", roteiroLabel, !roteiroEnabled, roteiroEnabled ? undefined : disabledHint)}
    </div>
  );
};
