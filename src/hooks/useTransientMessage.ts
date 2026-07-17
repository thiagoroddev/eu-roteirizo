import { useCallback, useEffect, useRef, useState } from "react";

/**
 * useTransientMessage - a message that shows and auto-clears after `durationMs`
 * (TASK-RF-006.17). Backs the map's reorder toast: `show(text)` displays it and
 * schedules its removal; a fresh call resets the timer. The timeout is cleared
 * on unmount. No external toast dependency — the project has none (ADR-004
 * keeps the UI surface small).
 *
 * @param durationMs - How long the message stays visible.
 * @returns `[message, show]` — the current message (or null) and the setter.
 */
export const useTransientMessage = (durationMs = 2600) => {
  const [message, setMessage] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const show = useCallback(
    (text: string) => {
      setMessage(text);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => setMessage(null), durationMs);
    },
    [durationMs]
  );

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    []
  );

  return [message, show] as const;
};
