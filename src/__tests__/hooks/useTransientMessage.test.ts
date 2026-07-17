import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useTransientMessage } from "../../hooks/useTransientMessage";

describe("useTransientMessage (RF-006.17)", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("shows the message and clears it after the duration", () => {
    const { result } = renderHook(() => useTransientMessage(1000));
    expect(result.current[0]).toBeNull();

    act(() => result.current[1]("Endereços reordenados"));
    expect(result.current[0]).toBe("Endereços reordenados");

    act(() => vi.advanceTimersByTime(999));
    expect(result.current[0]).toBe("Endereços reordenados"); // ainda dentro do tempo

    act(() => vi.advanceTimersByTime(1));
    expect(result.current[0]).toBeNull(); // sumiu
  });

  it("a fresh call resets the timer (the earlier one no longer fires)", () => {
    const { result } = renderHook(() => useTransientMessage(1000));
    act(() => result.current[1]("a"));
    act(() => vi.advanceTimersByTime(600));

    act(() => result.current[1]("b"));
    expect(result.current[0]).toBe("b");

    act(() => vi.advanceTimersByTime(600)); // 1200 ms desde "a", 600 desde "b"
    expect(result.current[0]).toBe("b"); // o timer de "a" foi cancelado

    act(() => vi.advanceTimersByTime(400)); // 1000 ms desde "b"
    expect(result.current[0]).toBeNull();
  });
});
