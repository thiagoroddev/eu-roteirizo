/**
 * normalizeColumns - normaliza os cabeçalhos da planilha para os nomes canônicos.
 *
 * A planilha de rota única usa cabeçalhos variantes (`Bairro`, `Zipcode/Postal code`,
 * `AT ID`); renomeá-los para `COLUMN_NAMES` (Neighborhood, Zipcode, Planned AT) faz com
 * que TODOS os consumidores (resumo, tabelas, tooltip, formatters) reconheçam a coluna
 * sem mudança neles. Ver TASK-RF-003.
 */
import type { RowData } from "../types";
import { COLUMN_ALIASES } from "../constants";

/**
 * Renomeia chaves variantes (COLUMN_ALIASES) para as canônicas.
 *
 * - Só renomeia variantes **conhecidas**; chaves desconhecidas passam intactas.
 * - **Não sobrescreve** uma coluna canônica que já veio no arquivo (canônica vence).
 * - **Pura**: retorna novas linhas, sem mutar a entrada.
 *
 * @param rows - Linhas cruas do `sheet_to_json`.
 * @returns Linhas com as chaves canônicas.
 */
export const normalizeColumnKeys = (rows: RowData[]): RowData[] =>
  rows.map((row) => {
    const out: RowData = { ...row };
    for (const [variant, canonical] of Object.entries(COLUMN_ALIASES)) {
      // Move a variante para a canônica só se a canônica NÃO veio no arquivo original.
      if (variant in out && !(canonical in row)) {
        out[canonical] = out[variant];
        delete out[variant];
      }
    }
    return out;
  });
