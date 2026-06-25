import { describe, it, expect } from "vitest";
import { MinHeap } from "../../../utils/routing/minHeap";

const numHeap = () => new MinHeap<number>((a, b) => a - b);

describe("MinHeap", () => {
  it("pops items in ascending priority order", () => {
    const h = numHeap();
    [5, 1, 4, 2, 8, 3].forEach((n) => h.push(n));
    const out: number[] = [];
    while (h.size > 0) out.push(h.pop() as number);
    expect(out).toEqual([1, 2, 3, 4, 5, 8]);
  });

  it("peek returns the minimum without removing it", () => {
    const h = numHeap();
    h.push(3);
    h.push(1);
    h.push(2);
    expect(h.peek()).toBe(1);
    expect(h.size).toBe(3);
  });

  it("pop/peek on an empty heap return undefined", () => {
    expect(numHeap().pop()).toBeUndefined();
    expect(numHeap().peek()).toBeUndefined();
  });

  it("tracks size across push and pop", () => {
    const h = numHeap();
    expect(h.size).toBe(0);
    h.push(1);
    h.push(2);
    expect(h.size).toBe(2);
    h.pop();
    expect(h.size).toBe(1);
  });

  it("keeps order under interleaved push/pop", () => {
    const h = numHeap();
    h.push(5);
    h.push(3);
    expect(h.pop()).toBe(3);
    h.push(1);
    h.push(4);
    expect(h.pop()).toBe(1);
    expect(h.pop()).toBe(4);
    expect(h.pop()).toBe(5);
    expect(h.pop()).toBeUndefined();
  });

  it("honors a custom comparator (by object priority)", () => {
    const h = new MinHeap<{ id: string; priority: number }>((a, b) => a.priority - b.priority);
    h.push({ id: "c", priority: 3 });
    h.push({ id: "a", priority: 1 });
    h.push({ id: "b", priority: 2 });
    expect([h.pop()?.id, h.pop()?.id, h.pop()?.id]).toEqual(["a", "b", "c"]);
  });

  it("sorts a larger shuffled sequence (heap property holds)", () => {
    const h = numHeap();
    const input = Array.from({ length: 100 }, (_, i) => (i * 37) % 100); // coprime step → permutation of 0..99
    input.forEach((n) => h.push(n));
    const out: number[] = [];
    while (h.size > 0) out.push(h.pop() as number);
    expect(out).toEqual([...input].sort((a, b) => a - b));
  });
});
