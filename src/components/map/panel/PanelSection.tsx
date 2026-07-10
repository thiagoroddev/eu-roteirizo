import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * PanelSection - THE section wrapper of the MapPanel (TASK-RF-006.4.3).
 *
 * Root cause of the roteiro's visual drift (feedback 08/07, 3ª rodada): the
 * section chrome — top divider + label padding — was hand-rolled inside the
 * Original header and re-laid out by each roteiro section, which dropped the
 * divider. This component is the single source of that chrome; BOTH modes
 * consume it, so sections can no longer diverge.
 *
 * Layout contract (matches the Original pixel for pixel):
 * - `divider` (default): `border-t border-input` + `pt-2` on the label row —
 *   every section except the first one under the mode bar.
 * - `actions` render on the label row, right-aligned (the Original's
 *   "Ver lista completa" pattern; the roteiro's "Editar/Desfazer parada").
 */
interface Props {
  label: string;
  /** Inline info right BESIDE the label (e.g. the suggested-stop's vehicle distance). */
  meta?: ReactNode;
  /** Buttons on the label row (right side). */
  actions?: ReactNode;
  /** Top divider + label padding; false only for the FIRST section of a header. */
  divider?: boolean;
  children?: ReactNode;
}

export const PanelSection = ({ label, meta, actions, divider = true, children }: Props) => {
  // shrink-0: the label never wraps to two lines — on a narrow screen the META
  // (which already truncates) is what gives way, not "Parada sugerida" (REF-016).
  const labelEl = <p className="shrink-0 text-xs font-medium text-muted-foreground">{label}</p>;
  return (
    <div className={cn(divider && "border-t border-input")}>
      {/* pb-1: THE canonical breathing room between a section's label and its
          content, for every section of both modes (REF-016 — the label used to
          sit flush against whatever came below). Lives here, in the shared
          chrome, so no component needs its own compensating pt-*. */}
      <div className={cn("flex items-center justify-between gap-2 px-4 pb-1", divider && "pt-2")}>
        {meta ? (
          <div className="flex min-w-0 items-center gap-2">
            {labelEl}
            {/* Separator between the label and its inline meta (feedback 10/07:
                "Prévia de parada Distância até aqui" read as one run-on line).
                The middot is the panel's own separator language (chips/estimates). */}
            <span aria-hidden className="shrink-0 text-xs text-muted-foreground/50">
              ·
            </span>
            {meta}
          </div>
        ) : (
          labelEl
        )}
        {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  );
};
