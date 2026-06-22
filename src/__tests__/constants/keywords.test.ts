import { describe, it, expect } from "vitest";
import { COMMERCIAL_KEYWORDS, RESIDENTIAL_KEYWORDS, normalizeKeyword } from "../../constants/keywords";

describe("keyword lists", () => {
  const hasDuplicates = (arr: string[]) => new Set(arr).size !== arr.length;
  const allNormalized = (arr: string[]) => arr.every((k) => k === normalizeKeyword(k));
  const allNonEmpty = (arr: string[]) => arr.every((k) => k.trim().length > 0);

  it("are normalized (lowercased, accent-free)", () => {
    expect(allNormalized(RESIDENTIAL_KEYWORDS)).toBe(true);
    expect(allNormalized(COMMERCIAL_KEYWORDS)).toBe(true);
  });

  it("contain no duplicates", () => {
    expect(hasDuplicates(RESIDENTIAL_KEYWORDS)).toBe(false);
    expect(hasDuplicates(COMMERCIAL_KEYWORDS)).toBe(false);
  });

  it("contain only non-empty entries", () => {
    expect(allNonEmpty(RESIDENTIAL_KEYWORDS)).toBe(true);
    expect(allNonEmpty(COMMERCIAL_KEYWORDS)).toBe(true);
  });
});
