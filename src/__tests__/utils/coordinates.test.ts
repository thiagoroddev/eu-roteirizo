import { describe, it, expect } from "vitest";
import { parseCoordinate, isWithinRioBounds } from "../../utils/coordinates";

describe("parseCoordinate", () => {
  it("converts a scaled integer to a decimal coordinate", () => {
    expect(parseCoordinate(-229000000)).toBeCloseTo(-22.9, 5);
    expect(parseCoordinate(-431000000)).toBeCloseTo(-43.1, 5);
  });

  it("accepts the scaled integer as a string", () => {
    expect(parseCoordinate("-229000000")).toBeCloseTo(-22.9, 5);
  });

  it("strips thousand-separator dots before parsing", () => {
    // "-229.000.000" -> "-229000000" -> -22.9
    expect(parseCoordinate("-229.000.000")).toBeCloseTo(-22.9, 5);
  });

  it("returns undefined for non-numeric, null and undefined", () => {
    expect(parseCoordinate("invalid")).toBeUndefined();
    expect(parseCoordinate(null)).toBeUndefined();
    expect(parseCoordinate(undefined)).toBeUndefined();
    expect(parseCoordinate("")).toBeUndefined();
  });

  it("mis-parses a real decimal value (documented limitation)", () => {
    // "-22.8" has its dot stripped -> "-228" -> -0.0000228 (NOT -22.8).
    // This is why isWithinRioBounds is needed as a downstream guard.
    expect(parseCoordinate("-22.8")).toBeCloseTo(-0.0000228, 9);
  });
});

describe("isWithinRioBounds", () => {
  it("returns true for a coordinate inside Rio bounds", () => {
    expect(isWithinRioBounds(-22.9, -43.1)).toBe(true);
  });

  it("returns false for coordinates outside the box (each direction)", () => {
    expect(isWithinRioBounds(-22.5, -43.1)).toBe(false); // too far north
    expect(isWithinRioBounds(-23.5, -43.1)).toBe(false); // too far south
    expect(isWithinRioBounds(-22.9, -42.9)).toBe(false); // too far east
    expect(isWithinRioBounds(-22.9, -43.9)).toBe(false); // too far west
  });

  it("returns false for a mis-parsed decimal coordinate", () => {
    // The -0.0000228 produced by parseCoordinate("-22.8") must be rejected.
    expect(isWithinRioBounds(-0.0000228, -0.0000431)).toBe(false);
  });
});
