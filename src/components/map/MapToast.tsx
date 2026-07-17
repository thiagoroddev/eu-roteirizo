import { Info } from "lucide-react";

/**
 * MapToast - a brief floating notice over the map (TASK-RF-006.17): today it
 * carries the "Paradas reordenadas" aviso when a vehicle move re-sweeps the
 * order. Pure presentation — the auto-dismiss is the caller's
 * (`useTransientMessage`). Centered under the mode toggle; tokens only, so it
 * follows the theme. `aria-live` announces the change to screen readers.
 */
export const MapToast = ({ message }: { message: string }) => (
  <div
    role="status"
    aria-live="polite"
    className="pointer-events-none absolute left-1/2 top-16 z-[1100] flex max-w-[90%] -translate-x-1/2 items-center gap-2 rounded-full border border-border bg-card/95 px-4 py-2 text-sm font-medium text-card-foreground shadow-lg backdrop-blur"
  >
    <Info aria-hidden className="h-4 w-4 shrink-0 text-primary" />
    <span className="truncate">{message}</span>
  </div>
);
