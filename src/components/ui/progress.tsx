import { cn } from "@/lib/utils";

/**
 * Progress - CSS-only progress bar (TASK-RF-006.8). Deliberately NOT
 * @radix-ui/react-progress (decision 09/07: no new dependency for a div pair)
 * but with the same a11y contract (`role="progressbar"` + aria values). The
 * fill is the brand gradient token (REF-012; neonflux.md §163 covers only the
 * fill — the rest of the dressing is REF-014's).
 */
interface ProgressProps {
  /** 0..1 (clamped). */
  value: number;
  /** Accessible name — WHAT this bar measures (never leave it implicit). */
  label: string;
  className?: string;
}

export const Progress = ({ value, label, className }: ProgressProps) => {
  const clamped = Math.min(1, Math.max(0, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(clamped * 100)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("h-1.5 overflow-hidden rounded-full bg-secondary", className)}
    >
      <div className="h-full rounded-full bg-brand-gradient" style={{ width: `${clamped * 100}%` }} />
    </div>
  );
};
