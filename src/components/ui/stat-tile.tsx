/**
 * Stat tiles - the shared "número grande + rótulo" chrome (TASK-REF-017).
 *
 * Extracted verbatim from the roteiro panel's RouteProgressCard (RF-006.8/.20)
 * so the Sumário reuses the SAME visual language instead of a second dialect.
 * Presentational only: values arrive já formatados pelo caller.
 */

/** Big stat: uppercase label + prominent value ("7/78", "112", "4").
 *  `title` alimenta o tooltip nativo (ex.: a ressalva do "Horário comercial"). */
export const StatTile = ({ label, value, title }: { label: string; value: string; title?: string }) => (
  <div className="rounded-lg border border-input p-2 text-center" title={title}>
    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="text-lg font-semibold tabular-nums">{value}</p>
  </div>
);

/** Secondary stat: same shell, smaller value (totals/derived numbers). */
export const DetailTile = ({ label, value }: { label: string; value: string }) => (
  <div className="flex flex-col items-center justify-center rounded-lg border border-input p-2 text-center">
    <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className="text-sm font-semibold tabular-nums">{value}</p>
  </div>
);

/** One line of a breakdown (popup/detail): muted label left, value right. */
export const BreakdownRow = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between py-1.5 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-semibold tabular-nums">{value}</span>
  </div>
);
