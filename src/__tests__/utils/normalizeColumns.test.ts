import { describe, it, expect } from "vitest";
import { normalizeColumnKeys } from "../../utils/normalizeColumns";
import { COLUMN_NAMES } from "../../constants";
import type { RowData } from "../../types";

describe("normalizeColumnKeys", () => {
  it("renames the real single-route headers to canonical names", () => {
    const rows: RowData[] = [
      {
        "AT ID": "AT20260515X",
        Bairro: "Botafogo",
        "Zipcode/Postal code": "22270-070",
        [COLUMN_NAMES.DESTINATION_ADDRESS]: "Rua X, 1",
      },
    ];
    const [r] = normalizeColumnKeys(rows);

    expect(r[COLUMN_NAMES.PLANNED_AT]).toBe("AT20260515X");
    expect(r[COLUMN_NAMES.NEIGHBORHOOD]).toBe("Botafogo");
    expect(r[COLUMN_NAMES.ZIPCODE]).toBe("22270-070");
    expect(r[COLUMN_NAMES.DESTINATION_ADDRESS]).toBe("Rua X, 1");
    // a chave variante é removida após renomear
    expect("Bairro" in r).toBe(false);
    expect("AT ID" in r).toBe(false);
  });

  it("passes unknown headers through untouched", () => {
    const rows: RowData[] = [{ Foo: "bar", [COLUMN_NAMES.LATITUDE]: -22.9 }];
    const [r] = normalizeColumnKeys(rows);

    expect(r.Foo).toBe("bar");
    expect(r[COLUMN_NAMES.LATITUDE]).toBe(-22.9);
  });

  it("does not clobber a canonical column already present (canonical wins)", () => {
    const rows: RowData[] = [{ Bairro: "Variante", [COLUMN_NAMES.NEIGHBORHOOD]: "Canônico" }];
    const [r] = normalizeColumnKeys(rows);

    expect(r[COLUMN_NAMES.NEIGHBORHOOD]).toBe("Canônico");
  });

  it("leaves canonical (multi-route) rows unchanged", () => {
    const rows: RowData[] = [{ [COLUMN_NAMES.CORRIDOR_CAGE]: "A-1", [COLUMN_NAMES.NEIGHBORHOOD]: "Centro", [COLUMN_NAMES.ZIPCODE]: "20000-000" }];
    const [r] = normalizeColumnKeys(rows);

    expect(r).toEqual(rows[0]);
  });

  it("does not mutate the input rows", () => {
    const rows: RowData[] = [{ Bairro: "Botafogo" }];
    const snapshot = JSON.parse(JSON.stringify(rows));
    normalizeColumnKeys(rows);

    expect(rows).toEqual(snapshot);
  });
});
