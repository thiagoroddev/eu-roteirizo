import { ArrowDown, Car, Footprints } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * LegConnector - an independent "roadmap" datum: the distance from one place to
 * the NEXT, read VERTICALLY beside what links them, with the mode's icon and a
 * down arrow. Extracted from StopItem (RF-006.10) when it gained its second use
 * (TASK-RF-045):
 * - `walk`: between addresses, in the stop detail's left gutter;
 * - `drive`: between stops, on the "Ver detalhes" timeline rail.
 * The caller positions it and hands the label ready (walking "110 metros",
 * driving "1,3 km"), so the component stays about the look only.
 */
interface Props {
  label: string;
  icon: "walk" | "drive";
  /** Screen-reader name of the leg (what the distance is between). */
  ariaLabel: string;
  className?: string;
}

export const LegConnector = ({ label, icon, ariaLabel, className }: Props) => {
  const Icon = icon === "walk" ? Footprints : Car;
  return (
    <span className={cn("pointer-events-none flex flex-col items-center justify-center gap-0.5 text-muted-foreground", className)} aria-label={ariaLabel}>
      <Icon className="h-3 w-3 shrink-0" aria-hidden />
      <span className="text-[10px] leading-none [writing-mode:vertical-rl] rotate-180">{label}</span>
      <ArrowDown className="h-3 w-3 shrink-0" aria-hidden />
    </span>
  );
};
