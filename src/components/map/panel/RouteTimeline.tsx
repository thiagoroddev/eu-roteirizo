import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * RouteTimeline - a vertical itinerary layout (TASK-RF-045): a left column with
 * each item's NODE on a continuous rail, the item's content beside it, and —
 * between one node and the next — an optional CONNECTOR sitting on the rail
 * (the leg's distance). Layout only: it knows nothing about stops, starts or
 * vehicles, so any ordered "place → place" list can reuse it.
 *
 * Built on theme tokens (`bg-border` rail, `bg-background` mask behind the
 * connector — the panel's own ground) so it follows the dark theme.
 */
export const RouteTimeline = ({ ariaLabel, children, className }: { ariaLabel: string; children: ReactNode; className?: string }) => (
  <ol aria-label={ariaLabel} className={cn("flex flex-col px-4 pt-1", className)}>
    {children}
  </ol>
);

interface ItemProps {
  /** The item's marker on the rail (≤ 36px; its center sits at the rail joints). */
  node: ReactNode;
  /** The leg to the NEXT item, drawn on the rail below the node, centered between the two nodes. */
  connector?: ReactNode;
  /** A rail arrives from the previous item. */
  hasPrevious: boolean;
  /** A rail leaves towards the next item. */
  hasNext: boolean;
  children: ReactNode;
}

/** Rail joint = the node's center: pt-2.5 (10px) + half of a 36px node (18px) = 28px = `7` in Tailwind units. */
export const RouteTimelineItem = ({ node, connector, hasPrevious, hasNext, children }: ItemProps) => (
  <li className="relative flex gap-3">
    <div className="relative flex w-9 shrink-0 flex-col items-center">
      {hasPrevious && <span aria-hidden className="absolute left-1/2 top-0 h-7 w-0.5 -translate-x-1/2 bg-border" />}
      {hasNext && <span aria-hidden className="absolute bottom-0 left-1/2 top-7 w-0.5 -translate-x-1/2 bg-border" />}
      <div className="relative pt-2.5">{node}</div>
      {connector && (
        <div className="relative flex flex-1 items-center justify-center">
          {/* The mask interrupts the rail so the distance reads ON the line between the nodes. */}
          <div className="bg-background py-1">{connector}</div>
        </div>
      )}
    </div>
    <div className="min-w-0 flex-1 pb-3">{children}</div>
  </li>
);
