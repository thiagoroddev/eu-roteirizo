import { describe, it, expect } from "vitest";
import { isMissingValue } from "../../utils/missingValue";
import { UI_LABELS } from "../../constants/uiLabels";

describe("isMissingValue (REF-017)", () => {
  it("reconhece as sentinelas de ausência da camada de dados", () => {
    expect(isMissingValue(UI_LABELS.COMMON.NO_DATA)).toBe(true); // "Sem dados"
    expect(isMissingValue(UI_LABELS.INFO.INVALID_DATA)).toBe(true); // "Dado inválido"
    expect(isMissingValue("-")).toBe(true);
    expect(isMissingValue("")).toBe(true);
    expect(isMissingValue("   ")).toBe(true); // só espaços
    expect(isMissingValue(null)).toBe(true);
    expect(isMissingValue(undefined)).toBe(true);
  });

  it("valores reais passam", () => {
    expect(isMissingValue("112")).toBe(false);
    expect(isMissingValue("0")).toBe(false); // zero é um dado, não ausência
    expect(isMissingValue("Rio de Janeiro")).toBe(false);
    expect(isMissingValue("54 km")).toBe(false);
  });
});
