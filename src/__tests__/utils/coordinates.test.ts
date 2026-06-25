import { describe, it, expect } from "vitest";
import { parseCoordinate, isWithinRioBounds } from "../../utils/coordinates";

describe("parseCoordinate", () => {
  // ==========================================================================
  // SCALED INTEGER (multi-route real format) — divide by 1e7
  // ==========================================================================

  it("converts a scaled integer (number) to a decimal coordinate", () => {
    expect(parseCoordinate(-229000000)).toBeCloseTo(-22.9, 5);
    expect(parseCoordinate(-431000000)).toBeCloseTo(-43.1, 5);
  });

  it("accepts the scaled integer as a string", () => {
    expect(parseCoordinate("-229000000")).toBeCloseTo(-22.9, 5);
  });

  it("strips thousand-separator dots (multi-route real format)", () => {
    // Valores reais do print multi-rota
    expect(parseCoordinate("-229.026.394")).toBeCloseTo(-22.9026394, 7);
    expect(parseCoordinate("-433048401")).toBeCloseTo(-43.3048401, 7);
    expect(parseCoordinate("-229.000.000")).toBeCloseTo(-22.9, 5);
  });

  // ==========================================================================
  // REAL DECIMAL — comma (single-route real format) and dot, any precision
  // ==========================================================================

  it("parses real decimals with a comma separator (single-route real format)", () => {
    // Valores reais do print rota única (vírgula, casas variáveis)
    expect(parseCoordinate("-22,952715")).toBeCloseTo(-22.952715, 7);
    expect(parseCoordinate("-43,1973")).toBeCloseTo(-43.1973, 7);
    expect(parseCoordinate("-22,9559345")).toBeCloseTo(-22.9559345, 7);
    expect(parseCoordinate("-43,1974144")).toBeCloseTo(-43.1974144, 7);
  });

  it("parses real decimals with a dot separator", () => {
    expect(parseCoordinate("-22.952715")).toBeCloseTo(-22.952715, 7);
    expect(parseCoordinate("-22.8")).toBeCloseTo(-22.8, 7); // antes virava -0.0000228 (bug)
  });

  it("parses a real decimal that is already a JS number", () => {
    expect(parseCoordinate(-22.9500637)).toBeCloseTo(-22.9500637, 7);
  });

  it("resolves correctly for ANY number of decimal places (not only 7)", () => {
    // O bug antigo só acertava exatamente 7 casas; aqui 2/5/8 também batem.
    expect(parseCoordinate("-22,95")).toBeCloseTo(-22.95, 7);
    expect(parseCoordinate("-22,95006")).toBeCloseTo(-22.95006, 7);
    expect(parseCoordinate("-22,9500637")).toBeCloseTo(-22.9500637, 7);
    expect(parseCoordinate("-22,95006370")).toBeCloseTo(-22.9500637, 7);
  });

  it("a 7-place decimal and its scaled integer resolve to the same coordinate", () => {
    expect(parseCoordinate("-22,9500637")).toBeCloseTo(parseCoordinate(-229500637)!, 7);
  });

  it("returns undefined for non-numeric, null and undefined", () => {
    expect(parseCoordinate("invalid")).toBeUndefined();
    expect(parseCoordinate(null)).toBeUndefined();
    expect(parseCoordinate(undefined)).toBeUndefined();
    expect(parseCoordinate("")).toBeUndefined();
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

  it("returns false for a near-zero (out-of-box) coordinate", () => {
    // Guard de sanidade: valores minúsculos (ex.: 0,0 / origem) caem fora do Rio.
    expect(isWithinRioBounds(-0.0000228, -0.0000431)).toBe(false);
  });
});
