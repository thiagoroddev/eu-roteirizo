/**
 * utils/routing/minHeap.ts - Binary min-heap (priority queue).
 *
 * Own implementation (no dependency) backing the A* frontier (TASK-RF-005.4),
 * replacing the linear frontier scan of TASK-RF-005.1 with O(log n) push/pop.
 * Generic and comparator-driven so it can be reused.
 */

export class MinHeap<T> {
  private readonly items: T[] = [];
  private readonly compare: (a: T, b: T) => number;

  /**
   * @param compare - Ordering: returns < 0 when `a` has higher priority (comes out before `b`).
   */
  constructor(compare: (a: T, b: T) => number) {
    this.compare = compare;
  }

  /** Number of items currently in the heap. */
  get size(): number {
    return this.items.length;
  }

  /** The minimum item without removing it, or `undefined` when empty. */
  peek(): T | undefined {
    return this.items[0];
  }

  /** Inserts an item, keeping the heap ordered. */
  push(item: T): void {
    this.items.push(item);
    this.siftUp(this.items.length - 1);
  }

  /** Removes and returns the minimum item, or `undefined` when empty. */
  pop(): T | undefined {
    const items = this.items;
    if (items.length === 0) return undefined;
    const top = items[0];
    const last = items.pop() as T;
    if (items.length > 0) {
      items[0] = last;
      this.siftDown(0);
    }
    return top;
  }

  private siftUp(index: number): void {
    const items = this.items;
    let i = index;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.compare(items[i], items[parent]) >= 0) break;
      [items[i], items[parent]] = [items[parent], items[i]];
      i = parent;
    }
  }

  private siftDown(index: number): void {
    const items = this.items;
    const n = items.length;
    let i = index;
    for (;;) {
      const left = 2 * i + 1;
      const right = left + 1;
      let smallest = i;
      if (left < n && this.compare(items[left], items[smallest]) < 0) smallest = left;
      if (right < n && this.compare(items[right], items[smallest]) < 0) smallest = right;
      if (smallest === i) break;
      [items[i], items[smallest]] = [items[smallest], items[i]];
      i = smallest;
    }
  }
}
