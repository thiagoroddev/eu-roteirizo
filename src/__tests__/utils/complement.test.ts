import { describe, it, expect } from "vitest";
import { rowComplement, normalizeComplement, sameComplement } from "../../utils/complement";
import { COLUMN_NAMES } from "../../constants";

const ADDR = COLUMN_NAMES.DESTINATION_ADDRESS;

describe("complement helpers (RF-007.2)", () => {
  it("rowComplement: texto após a 2ª vírgula (trim); vazio quando ausente", () => {
    expect(rowComplement({ [ADDR]: "Rua X, 100, Apt 402" })).toBe("Apt 402");
    expect(rowComplement({ [ADDR]: "Rua X, 100,  Apt 402  " })).toBe("Apt 402"); // trim
    expect(rowComplement({ [ADDR]: "Rua X, 100" })).toBe("");
    expect(rowComplement({})).toBe("");
  });

  it("normalizeComplement: trim + minúsculas (chave de agrupamento)", () => {
    expect(normalizeComplement("  Apto 206 ")).toBe("apto 206");
    expect(normalizeComplement("SALA 210")).toBe("sala 210");
  });

  it("sameComplement: igualdade case/space-insensitive", () => {
    expect(sameComplement("Apto 206", "apto 206 ")).toBe(true);
    expect(sameComplement("Sala 210", "Sala 305")).toBe(false);
    expect(sameComplement("", "  ")).toBe(true);
  });
});
