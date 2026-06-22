/**
 * COMPLEMENT EXTRACTOR FOR AI CLASSIFICATION
 * ===========================================
 *
 * PURPOSE:
 * Extracts address complements from Excel/CSV files for AI-powered classification.
 * Creates a JSON file with complements as keys and empty values for AI to fill.
 *
 * WHEN TO USE:
 * - When you need to classify many addresses but want AI help
 * - To prepare data for batch classification by AI models
 * - To identify patterns in address complements for rule improvement
 *
 * HOW IT WORKS:
 * 1. Reads Excel/CSV file with "Destination Address" column
 * 2. Extracts complement (text after second comma)
 * 3. Creates JSON with unique complements as keys, empty values
 * 4. Saves to saidaComplemento.json
 *
 * INPUT FILE:
 * - entradaComplemento.xlsx or entradaComplemento.csv
 * - Must have "Destination Address" column
 *
 * OUTPUT FILE:
 * - saidaComplemento.json
 * - Format: {"complement1": "", "complement2": "", ...}
 *
 * USAGE:
 * tsx extrairComplementos.ts
 *
 * EXAMPLE OUTPUT:
 * {
 *   "Portaria": "",
 *   "Somente horário comercial": "",
 *   "Apto 101": "",
 *   "Sala 05": ""
 * }
 */

import { readFileSync, existsSync, writeFileSync } from "fs";
import * as XLSX from "xlsx";

// ---------------------------------
// CONFIG
// ---------------------------------

const INPUT_FILE_XLSX = "arquivos-testes/entradaComplemento.xlsx";
const INPUT_FILE_CSV = "arquivos-testes/entradaComplemento.csv";
const OUTPUT_FILE = "arquivos-testes/saidaComplemento.json";

// ---------------------------------
// EXCEL/CSV READER (Filesystem version)
// ---------------------------------

/**
 * Reads Excel or CSV file from filesystem and returns rows as objects
 * Simplified version for complement extraction (no route grouping needed)
 */
async function readExcelFile(filePath: string): Promise<Record<string, string>[]> {
  try {
    // Read file as buffer
    const fileBuffer = readFileSync(filePath);

    // Parse with XLSX
    const workbook = XLSX.read(fileBuffer, { type: "buffer" });

    // Get first worksheet
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON (array of objects)
    const rows: (string | number | boolean | null)[][] = XLSX.utils.sheet_to_json(worksheet, {
      header: 1, // Use first row as headers
      defval: "", // Default value for empty cells
    });

    if (rows.length < 2) {
      throw new Error("Arquivo deve ter pelo menos cabeçalho + 1 linha de dados");
    }

    // Extract headers and data
    const headers = rows[0] as string[];
    const dataRows = rows.slice(1);

    // Convert to objects
    return dataRows.map((row: (string | number | boolean | null)[]) => {
      const obj: Record<string, string> = {};
      headers.forEach((header, index) => {
        obj[header] = String(row[index] || "");
      });
      return obj;
    });
  } catch (error) {
    throw new Error(`Erro ao ler arquivo ${filePath}: ${error}`);
  }
}

interface ComplementData {
  [complement: string]: string; // Always empty string for AI to fill
}

// ---------------------------------
// HELPER FUNCTIONS
// ---------------------------------

/**
 * Extracts complement from address (text after second comma)
 * Based on inferLocationType logic
 */
function extractComplement(address: string): string {
  if (!address || typeof address !== "string") return "";

  const parts = address.split(",").map((p) => p.trim());

  // Logic: Complement is typically from index 2 onwards
  // Same as inferLocationType function
  const complement = parts.length >= 3 ? parts.slice(2).join(" ") : "";

  // Clean up the complement (remove extra spaces, normalize)
  return complement
    .replace(/\s+/g, " ") // Multiple spaces to single
    .trim(); // Remove leading/trailing spaces
}

/**
 * Validates if complement is meaningful (not empty, not just numbers)
 */
function isValidComplement(complement: string): boolean {
  if (!complement || complement.length < 2) return false;

  // Skip if it's just numbers or very short
  if (/^\d+$/.test(complement) || complement.length < 3) return false;

  return true;
}

// ---------------------------------
// MAIN FUNCTION
// ---------------------------------

async function extrairComplementos() {
  console.log("🔍 Iniciando extração de complementos...\n");

  let inputFile = "";

  // Check which input file exists
  if (existsSync(INPUT_FILE_XLSX)) {
    inputFile = INPUT_FILE_XLSX;
    console.log(`📁 Usando arquivo Excel: ${inputFile}`);
  } else if (existsSync(INPUT_FILE_CSV)) {
    inputFile = INPUT_FILE_CSV;
    console.log(`📁 Usando arquivo CSV: ${inputFile}`);
  } else {
    console.error("❌ ERRO: Nenhum arquivo de entrada encontrado!");
    console.error(`   Procurei por:`);
    console.error(`   - ${INPUT_FILE_XLSX}`);
    console.error(`   - ${INPUT_FILE_CSV}`);
    console.error(`\n💡 Crie um dos arquivos acima com coluna "Destination Address"`);
    process.exit(1);
  }

  try {
    // Process the file using our filesystem reader
    console.log("📊 Processando arquivo...");
    const rows = await readExcelFile(inputFile);

    if (!rows || rows.length === 0) {
      console.error("❌ ERRO: Arquivo vazio ou sem dados válidos");
      process.exit(1);
    }

    console.log(`📋 Encontradas ${rows.length} linhas\n`);

    // Extract unique complements
    const complements: ComplementData = {};
    let processedCount = 0;
    let validComplements = 0;

    for (const row of rows) {
      processedCount++;

      // Get address from "Destination Address" column
      const address = row["Destination Address"] || row["DESTINATION ADDRESS"] || "";

      if (!address) {
        console.log(`⚠️  Linha ${processedCount}: Sem endereço`);
        continue;
      }

      // Extract complement using same logic as inferLocationType
      const complement = extractComplement(address);

      if (!isValidComplement(complement)) {
        console.log(`⚠️  Linha ${processedCount}: Complemento inválido "${complement}"`);
        continue;
      }

      // Add to result (empty value for AI to fill)
      if (!complements[complement]) {
        complements[complement] = "";
        validComplements++;
        console.log(`✅ "${complement}"`);
      } else {
        console.log(`🔄 "${complement}" (duplicado)`);
      }
    }

    // Save results
    console.log(`\n💾 Salvando ${validComplements} complementos únicos...`);
    writeFileSync(OUTPUT_FILE, JSON.stringify(complements, null, 2));

    console.log(`\n🎉 Extração concluída!`);
    console.log(`📁 Arquivo salvo: ${OUTPUT_FILE}`);
    console.log(`📊 Total de complementos únicos: ${validComplements}`);
    console.log(`\n💡 Agora você pode:`);
    console.log(`   1. Abrir ${OUTPUT_FILE}`);
    console.log(`   2. Enviar para uma IA classificar (Sim/Não/Indistinto)`);
    console.log(`   3. Usar os resultados para melhorar keywords.ts`);
  } catch (error) {
    console.error("❌ ERRO durante processamento:");
    console.error(error);
    process.exit(1);
  }
}

// ---------------------------------
// RUN
// ---------------------------------

extrairComplementos();
