/**
 * Excel File Processor - Core logic for reading and validating delivery route files
 *
 * Uses XLSX library for robust Excel parsing.
 * Handles:
 * - Column validation (mandatory vs optional)
 * - Route grouping by "Corridor Cage" field
 * - Alphanumeric route sorting (A-1, A-2, B-1, etc.)
 * - Missing data detection and reporting
 * - Row ordering by Sequence within each route
 */

import * as XLSX from "xlsx";
import type { ProcessedResult, RowData, RoutesMap } from "../types";
import { COLUMN_NAMES, MANDATORY_COLUMNS, OPTIONAL_COLUMNS } from "../constants"; // <--- Importando constantes

/** ==============================================================================
 * Processes an Excel file and extracts route data
 *
 * Reads Excel/CSV files, validates columns, groups deliveries by route,
 * and returns organized data for the application.
 *
 * @async
 * @param {File} file - The Excel or CSV file to process
 * @returns {Promise<ProcessedResult>} The processed result containing routes, columns, and any errors
 */
export const processExcelFile = async (file: File): Promise<ProcessedResult> => {
  try {
    /** Read Excel file using XLSX library */
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: "array" });
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];

    /** Convert to JSON - empty cells become "" to prevent column shifting */
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" }) as RowData[];

    if (!jsonData || jsonData.length === 0) {
      return {
        routes: null,
        availableCols: [],
        missingCols: [],
        error: "O arquivo parece estar vazio ou não pôde ser lido.",
      };
    }

    /** Get column names from first row (sheet_to_json uses first row as headers) */
    const colNames: string[] = Object.keys(jsonData[0]);

    /** * Define expected columns using imported constants
     * Spreading the readonly arrays to create a mutable list for checking
     */
    const expectedCols: string[] = [...MANDATORY_COLUMNS, ...OPTIONAL_COLUMNS];

    /** Identify present and missing columns */
    const presentExpectedCols = colNames.filter((c) => expectedCols.includes(c));

    // We cast strictly to string[] to satisfy type checks, though logic ensures they are strings
    const missingCols = expectedCols.filter((c) => !colNames.includes(c));

    /** Stop processing if mandatory columns are missing */
    const missingMandatory = MANDATORY_COLUMNS.filter((c) => !colNames.includes(c));

    if (missingMandatory.length > 0) {
      return {
        routes: null,
        availableCols: colNames,
        missingCols,
        error: `Colunas obrigatórias ausentes: ${missingMandatory.join(", ")}`,
      };
    }

    /** Column containing route identifier */
    const corridorKey = COLUMN_NAMES.CORRIDOR_CAGE;

    /** Valid format: "A-1", "B-12NS", etc. */
    const validPattern = /^[A-Z]+-\d+(?:NS)?$/i;

    /** Track skipped rows for debugging */
    const skippedRows: Array<{ idx: number; estimatedExcelRow: number; row: RowData; reason: string }> = [];

    /** Track empty cells in valid rows for reporting */
    const missingCells: Array<{ column: string; idx: number; estimatedExcelRow: number }> = [];

    /** Group rows by route and collect validation data */
    const groupedBuild = jsonData.reduce<RoutesMap>((acc, row, idx) => {
      /** Force string conversion to handle numeric values */
      const raw = String(row[corridorKey] || "");
      const routeName = raw.trim();

      /** Validate route name (not empty and matches pattern) */
      const isRouteValid = routeName && validPattern.test(routeName);

      if (isRouteValid) {
        if (!acc[routeName]) acc[routeName] = [];
        acc[routeName].push(row);

        /** Check for empty cells in valid rows (doesn't skip row, just logs) */
        for (const col of presentExpectedCols) {
          if (col === corridorKey) continue;

          // Access dynamic property securely
          const val = row[col as keyof RowData];
          if (val === null || val === undefined || String(val).trim() === "") {
            missingCells.push({ column: col, idx, estimatedExcelRow: idx + 2 });
          }
        }
      } else {
        // Invalid corridor value - row is skipped

        /** Detect potential column shift (lat/lng don't look like numbers) */
        const lat = row[COLUMN_NAMES.LATITUDE];
        const lon = row[COLUMN_NAMES.LONGITUDE];

        const looksLikeNumber = (v: unknown) => {
          if (typeof v === "number") return true;
          if (typeof v === "string" && !isNaN(parseFloat(v))) return true;
          return false;
        };

        let shiftWarning = "";
        if (!looksLikeNumber(lat) || !looksLikeNumber(lon)) {
          shiftWarning = " [Possível deslocamento de colunas: Latitude/Longitude inválidos]";
        }

        skippedRows.push({
          idx,
          estimatedExcelRow: idx + 2,
          row,
          reason: `Valor inválido/vazio em '${corridorKey}': "${routeName}"${shiftWarning}`,
        });
      }

      return acc;
    }, {});

    /** Sort routes alphanumerically (A-1, A-1NS, A-2, B-1, etc.) */
    const routeNames = Object.keys(groupedBuild);
    const parseRoute = (name: string) => {
      const m = name.match(/^([A-Za-z]+)-(\d+)([A-Za-z]*)$/i);
      if (!m) return { prefix: name.toUpperCase(), num: Number.MAX_SAFE_INTEGER, suffix: "" };
      return { prefix: m[1].toUpperCase(), num: parseInt(m[2], 10), suffix: (m[3] || "").toUpperCase() };
    };
    routeNames.sort((a, b) => {
      const A = parseRoute(a);
      const B = parseRoute(b);
      if (A.prefix < B.prefix) return -1;
      if (A.prefix > B.prefix) return 1;
      if (A.num < B.num) return -1;
      if (A.num > B.num) return 1;
      if (A.suffix < B.suffix) return -1;
      if (A.suffix > B.suffix) return 1;
      return 0;
    });

    /** Build final grouped object in sorted order */
    const grouped: RoutesMap = {};
    routeNames.forEach((k) => {
      grouped[k] = groupedBuild[k];
    });

    /** Sort rows within each route by Sequence column (if available) */
    if (colNames.includes(COLUMN_NAMES.SEQUENCE)) {
      Object.values(grouped).forEach((rows) => {
        rows.sort((a, b) => {
          const valA = a[COLUMN_NAMES.SEQUENCE];
          const valB = b[COLUMN_NAMES.SEQUENCE];

          const numA = typeof valA === "number" ? valA : parseFloat(String(valA));
          const numB = typeof valB === "number" ? valB : parseFloat(String(valB));

          /** Treat NaN as 0 to maintain numeric ordering */
          const safeA = isNaN(numA) ? 0 : numA;
          const safeB = isNaN(numB) ? 0 : numB;

          return safeA - safeB;
        });
      });
    }

    /** Detailed console logging for debugging — DEV only, and never logs cell values (PII). */
    if (import.meta.env.DEV) {
      try {
        const totalRead = jsonData.length;
        const routesCount = Object.keys(grouped).length;
        console.info(
          `processExcelFile: linhas lidas=${totalRead}, rotas extraídas=${routesCount}, linhas ignoradas (Corridor inválido)=${skippedRows.length}, células vazias (outras colunas)=${missingCells.length}`
        );

        /** Log first N skipped rows for inspection — only the names of the filled columns, never their values (which may contain PII: addresses, ZIP codes). */
        const SHOW_MAX = 50;
        if (skippedRows.length > 0) {
          console.warn(`processExcelFile: exibindo até ${SHOW_MAX} linhas ignoradas (de ${skippedRows.length}).`);
          skippedRows.slice(0, SHOW_MAX).forEach((s) => {
            const filledColumns = Object.entries(s.row)
              .filter(([, value]) => value !== null && value !== undefined && String(value).trim() !== "")
              .map(([key]) => key);
            console.warn(`  ignored idx=${s.idx} excelRow~=${s.estimatedExcelRow} reason="${s.reason}"`);
            if (filledColumns.length > 0) {
              console.warn(`    filledColumns = ${filledColumns.join(", ")}`);
            }
          });
          if (skippedRows.length > SHOW_MAX) console.warn(`  ... e mais ${skippedRows.length - SHOW_MAX} linhas ignoradas não exibidas.`);
        }

        /** Log rows that were NOT skipped but have empty cells */
        const rowsWithMissing = missingCells.reduce<Record<number, string[]>>((acc, m) => {
          if (!acc[m.idx]) acc[m.idx] = [];
          acc[m.idx].push(m.column);
          return acc;
        }, {});

        /** Convert to numbers */
        const missingIdxs = Object.keys(rowsWithMissing).map((k) => parseInt(k, 10));
        if (missingIdxs.length > 0) {
          console.warn(`processExcelFile: ${missingIdxs.length} linhas possuem células vazias em colunas presentes; listando as primeiras ${Math.min(50, missingIdxs.length)}:`);
          missingIdxs.slice(0, 50).forEach((i) => {
            const excelRow = i + 2;
            console.warn(`  excelRow~=${excelRow} missingColumns=${rowsWithMissing[i].join(",")}`);
          });
        }
      } catch (e) {
        /** Don't fail because of logging errors */
        console.debug("processExcelFile: falha ao gerar logs detalhados", e);
      }
    }

    return {
      routes: grouped,
      availableCols: colNames,
      missingCols,
    };
  } catch (err) {
    /** Catch any processing errors */
    console.error(err);

    /** Return failure state */
    return {
      routes: null,
      availableCols: null,
      missingCols: [],
      error: "Falha ao processar o arquivo.",
    };
  }
};
