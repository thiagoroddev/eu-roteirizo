import { describe, it, expect } from "vitest";
import { formatDistance, formatDeliveryTime, formatMeters, normalizeString, toTitleCase, getDate, getTotalPacks, getNumberOfStops, getPrimaryNeighborhood } from "../../utils/formatters";

describe("formatMeters", () => {
  it("rounds meters below 1 km", () => {
    expect(formatMeters(229.6)).toBe("230 m");
    expect(formatMeters(0)).toBe("0 m");
  });

  it("switches to km with one pt-BR decimal above 1 km", () => {
    expect(formatMeters(1234)).toBe("1,2 km");
    expect(formatMeters(999.6)).toBe("1000 m");
  });
});
// =============================================================================
// 7. LAST STOP TESTS (getNumberOfStops)
// =============================================================================
describe("getNumberOfStops", () => {
  const stopCol = COLUMN_NAMES.STOP;
  const availStop = [stopCol];
  const availNone: string[] = [];
  const row = (stop: unknown) => [{ [stopCol]: stop }];

  it("returns the last stop number as string if present", () => {
    expect(getNumberOfStops([{ [stopCol]: 10 }, { [stopCol]: 15 }], availStop)).toBe("15");
    expect(getNumberOfStops([{ [stopCol]: "7" }, { [stopCol]: "12" }], availStop)).toBe("12");
  });

  it("returns '-' if no valid stop is found but column exists", () => {
    expect(getNumberOfStops([{ [stopCol]: null }, { [stopCol]: undefined }], availStop)).toBe("-");
  });

  it("returns 'Sem dados' if STOP column is missing", () => {
    expect(getNumberOfStops(row(10), availNone)).toBe("Sem dados");
    expect(getNumberOfStops([], availNone)).toBe("Sem dados");
  });
});
// =============================================================================
// 6. TOTAL PACKS TESTS (getTotalPacks)
// =============================================================================
describe("getTotalPacks", () => {
  const numOrderCol = COLUMN_NAMES.NUM_OF_ORDER;
  const seqCol = COLUMN_NAMES.SEQUENCE;
  const availNumOrder = [numOrderCol, seqCol];
  const availOnlySeq = [seqCol];
  const availNone: string[] = [];
  const row = (numOrder: unknown, seq: unknown) => [{ [numOrderCol]: numOrder, [seqCol]: seq }];

  it("returns the value from Num of Order column if present", () => {
    expect(getTotalPacks(row(10, 5), availNumOrder)).toBe("10");
    expect(getTotalPacks(row("25", 5), availNumOrder)).toBe("25");
  });

  it("falls back to last row's Sequence if Num of Order is missing", () => {
    expect(getTotalPacks(row(undefined, 7), availOnlySeq)).toBe("7");
    expect(getTotalPacks(row(null, 12), availOnlySeq)).toBe("12");
  });

  it("returns 'Sem dados' if neither column is present or value is missing", () => {
    expect(getTotalPacks(row(undefined, undefined), availNone)).toBe("Sem dados");
    expect(getTotalPacks([], availNone)).toBe("Sem dados");
  });
});
// =============================================================================
// 5. DATE EXTRACTION TESTS (getDate)
// =============================================================================
describe("getDate", () => {
  const dateCol = COLUMN_NAMES.DATE;
  const atCol = COLUMN_NAMES.PLANNED_AT;
  const availDate = [dateCol, atCol];
  const availOnlyAT = [atCol];
  const row = (dateVal: unknown, atVal: unknown) => [{ [dateCol]: dateVal, [atCol]: atVal }];

  it("returns the date if present in the Date column", () => {
    expect(getDate(row("15/11/2025", "AT202511158FQHJ"), availDate)).toBe("15/11/2025");
  });

  it("extracts the date from Planned AT if Date is missing", () => {
    expect(getDate(row(undefined, "AT202511158FQHJ"), availOnlyAT)).toBe("15/11/2025");
    expect(getDate(row("", "AT202312019XYZ"), availOnlyAT)).toBe("01/12/2023");
  });

  it("returns NO_DATA if both Date and Planned AT are missing or invalid", () => {
    expect(getDate(row(undefined, undefined), availOnlyAT)).toBe("Sem dados");
    expect(getDate(row("", "INVALIDCODE"), availOnlyAT)).toBe("Sem dados");
  });
});
import { COLUMN_NAMES, UI_LABELS } from "../../constants";

// =============================================================================
// 2. DISTANCE FORMATTING TESTS
// =============================================================================
describe("formatDistance", () => {
  const col = COLUMN_NAMES.TOTAL_DISTANCE;
  const avail = [col];
  const row = (value: unknown) => [{ [col]: value }];

  it("formats meters correctly (< 1km)", () => {
    expect(formatDistance(row(500), avail)).toBe("500 m");
    expect(formatDistance(row("450"), avail)).toBe("450 m");
  });

  it("formats kilometers correctly (>= 1km)", () => {
    expect(formatDistance(row(1500), avail)).toBe("1.5 km");
    expect(formatDistance(row(3800), avail)).toBe("3.8 km");
  });

  it("rounds long kilometers correctly", () => {
    expect(formatDistance(row(1234), avail)).toBe("1.2 km");
  });

  it("handles very large distances (>= 10km) by rounding to integer", () => {
    expect(formatDistance(row(38200), avail)).toBe("38 km");
  });

  it("handles inputs with 'k' or 'km' already in string", () => {
    expect(formatDistance(row("2.5km"), avail)).toBe("2.5 km");
    expect(formatDistance(row("2.5k"), avail)).toBe("2.5 km");
  });

  it("handles Excel-style numbers with commas", () => {
    expect(formatDistance(row("1,5"), avail)).toBe("2 m");
    expect(formatDistance(row("1,5km"), avail)).toBe("1.5 km");
  });
  it("handles with original Excel-style data", () => {
    expect(formatDistance(row("44.146km"), avail)).toBe("44 km");
    expect(formatDistance(row("54.651km"), avail)).toBe("55 km");
  });

  it("returns NO_DATA or INVALID_DATA for missing/invalid", () => {
    expect(formatDistance([], avail)).toBe(UI_LABELS.COMMON.NO_DATA);
    expect(formatDistance(row(null), avail)).toBe(UI_LABELS.COMMON.NO_DATA);
    expect(formatDistance(row(""), avail)).toBe(UI_LABELS.COMMON.NO_DATA);
    expect(formatDistance(row("abc"), avail)).toBe(UI_LABELS.INFO.INVALID_DATA);
  });

  it("returns NO_DATA when the distance column is absent", () => {
    const missingCols: string[] = [];
    expect(formatDistance(row(1500), missingCols)).toBe(UI_LABELS.COMMON.NO_DATA);
  });
});

// =============================================================================
// 3. TIME FORMATTING TESTS (Delivery Time)
// =============================================================================
describe("formatDeliveryTime", () => {
  const col = COLUMN_NAMES.DELIVERY_TIME;
  const avail = [col];
  const row = (value: unknown) => [{ [col]: value }];

  it("formats 'XhYmin' correctly", () => {
    expect(formatDeliveryTime(row("1h30min"), avail)).toBe("1 hora e 30 minutos");
    expect(formatDeliveryTime(row("2h10min"), avail)).toBe("2 horas e 10 minutos");
  });

  it("formats only hours correctly", () => {
    expect(formatDeliveryTime(row("1h"), avail)).toBe("1 hora");
    expect(formatDeliveryTime(row("3h"), avail)).toBe("3 horas");
  });

  it("formats only minutes correctly", () => {
    expect(formatDeliveryTime(row("45min"), avail)).toBe("45 minutos");
    expect(formatDeliveryTime(row("1min"), avail)).toBe("1 minuto");
  });

  it("handles spaces and flexible formats", () => {
    expect(formatDeliveryTime(row("1 h 30 min"), avail)).toBe("1 hora e 30 minutos");
  });

  it("returns NO_DATA or INVALID_DATA for missing/invalid", () => {
    expect(formatDeliveryTime([], avail)).toBe(UI_LABELS.COMMON.NO_DATA);
    expect(formatDeliveryTime(row(null), avail)).toBe(UI_LABELS.COMMON.NO_DATA);
    expect(formatDeliveryTime(row("invalid"), avail)).toBe(UI_LABELS.INFO.INVALID_DATA);
  });

  it("returns NO_DATA when the time column is absent", () => {
    const missingCols: string[] = [];
    expect(formatDeliveryTime(row("1h"), missingCols)).toBe(UI_LABELS.COMMON.NO_DATA);
  });
});

// =============================================================================
// 4. TESTS OF TEXT (TitleCase & Normalize)
// =============================================================================
describe("Text Utilities", () => {
  describe("toTitleCase", () => {
    it("capitalizes simple words", () => {
      expect(toTitleCase("rio de janeiro")).toBe("Rio De Janeiro");
    });

    it("handles mixed casing", () => {
      expect(toTitleCase("rIo dE jaNeIrO")).toBe("Rio De Janeiro");
    });

    it("handles single word", () => {
      expect(toTitleCase("BRASIL")).toBe("Brasil");
    });
  });

  describe("normalizeString", () => {
    it("removes accents and lowercases", () => {
      expect(normalizeString("São Paulo")).toBe("sao paulo");
      expect(normalizeString("Água")).toBe("agua");
      expect(normalizeString("Coração")).toBe("coracao");
    });

    it("trims whitespace", () => {
      expect(normalizeString("  Teste  ")).toBe("teste");
    });
  });
});

// =============================================================================
// 8. PRIMARY NEIGHBORHOOD TESTS (getPrimaryNeighborhood - RF-62)
// =============================================================================
describe("getPrimaryNeighborhood (RF-62)", () => {
  it("extracts the neighborhood with highest delivery count without numbers", () => {
    const rows = [{ [COLUMN_NAMES.NEIGHBORHOOD]: "Copacabana" }, { [COLUMN_NAMES.NEIGHBORHOOD]: "Copacabana" }, { [COLUMN_NAMES.NEIGHBORHOOD]: "Ipanema" }];
    expect(getPrimaryNeighborhood(rows, [COLUMN_NAMES.NEIGHBORHOOD])).toBe("Copacabana");
  });

  it("handles mixed case and normalizes to Title Case", () => {
    const rows = [{ [COLUMN_NAMES.NEIGHBORHOOD]: "barra da tijuca" }, { [COLUMN_NAMES.NEIGHBORHOOD]: "BARRA DA TIJUCA" }];
    expect(getPrimaryNeighborhood(rows, [COLUMN_NAMES.NEIGHBORHOOD])).toBe("Barra Da Tijuca");
  });

  it("returns undefined when no neighborhood column or data is present", () => {
    expect(getPrimaryNeighborhood([], [])).toBeUndefined();
    expect(getPrimaryNeighborhood([{ foo: "bar" }], ["foo"])).toBeUndefined();
    expect(getPrimaryNeighborhood([{ [COLUMN_NAMES.NEIGHBORHOOD]: "" }], [COLUMN_NAMES.NEIGHBORHOOD])).toBeUndefined();
  });

  it("extracts neighborhood from DESTINATION_ADDRESS using CEP lookup", () => {
    const rows = [
      { [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Barata Ribeiro 200, Copacabana, Rio de Janeiro - RJ, 22040-030" },
      { [COLUMN_NAMES.DESTINATION_ADDRESS]: "Avenida Atlântica 1500, Rio de Janeiro - RJ, 22040030" },
    ];
    expect(getPrimaryNeighborhood(rows, [COLUMN_NAMES.DESTINATION_ADDRESS])).toBe("Copacabana");
  });

  it("extracts neighborhood from DESTINATION_ADDRESS using known neighborhood text", () => {
    const rows = [{ [COLUMN_NAMES.DESTINATION_ADDRESS]: "Estrada do Galeão 100, Portuguesa, Rio de Janeiro - RJ" }, { [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua Valdir Azevedo 50, Portuguesa, RJ" }];
    expect(getPrimaryNeighborhood(rows, [COLUMN_NAMES.DESTINATION_ADDRESS])).toBe("Portuguesa");
  });
});
