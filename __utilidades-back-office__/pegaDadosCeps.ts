/**
 * CEP DATA FETCHER (MULTI-API)
 * =============================
 *
 * PURPOSE:
 * Fetches detailed address information (neighborhood, street, city, state) for a list
 * of Brazilian zip codes (CEPs) using multiple API providers with automatic fallback.
 *
 * WHEN TO USE:
 * - When you have a list of CEPs but need complete address details
 * - To enrich routing data with neighborhood and street information
 * - Before planning routes to understand geographic distribution
 * - To populate your database with address information for logistics planning
 *
 * HOW IT WORKS:
 * 1. Reads a JSON file with a list of CEPs (ZipcodeList.json)
 * 2. Removes duplicates and normalizes format (8 digits, no dashes)
 * 3. Checks existing cache to avoid re-fetching known CEPs
 * 4. For each new CEP, tries 3 different APIs in order:
 *    - AwesomeAPI (fast, reliable)
 *    - ApiCEP (good fallback)
 *    - BrasilAPI (last resort)
 * 5. Saves results incrementally (every 5 requests) to prevent data loss
 *
 * FEATURES:
 * - ✅ Multi-API fallback: tries 3 different sources automatically
 * - ✅ Smart caching: skips already fetched CEPs
 * - ✅ Timeout protection: 3-second limit per API call
 * - ✅ Incremental saves: doesn't lose progress if interrupted
 * - ✅ Deduplication: removes duplicate CEPs automatically
 * - ✅ Rate limiting: 700ms delay between requests (respects API limits)
 * - ✅ TypeScript: fully typed, no 'any' usage
 *
 * INPUT:
 * ZipcodeList(Hub_RJ_Ilha-do-Governador).json - Array of CEPs
 * Example: ["21920000", "21930-000", "21940000"]
 *
 * OUTPUT:
 * ceps_info.json - Object with CEP as key, info as value
 * Example:
 * {
 *   "21920000": {
 *     "cep": "21920000",
 *     "bairro": "Ilha do Governador",
 *     "logradouro": "Rua Exemplo",
 *     "cidade": "Rio de Janeiro",
 *     "uf": "RJ",
 *     "fonte": "AwesomeAPI"
 *   }
 * }
 *
 * RUNNING:
 * tsx pegaDadosCeps.ts
 *
 * PERFORMANCE:
 * - ~0.7 seconds per CEP (with delay)
 * - 1000 CEPs = ~12 minutes
 * - Can be interrupted and resumed (uses cache)
 *
 * API SOURCES:
 * 1. AwesomeAPI: https://cep.awesomeapi.com.br/json/{cep}
 * 2. ApiCEP: https://cdn.apicep.com/file/apicep/{cep-with-dash}.json
 * 3. BrasilAPI: https://brasilapi.com.br/api/cep/v1/{cep}
 */

import fs from "fs";

// ----------------------------
// CONFIG / CONFIGURAÇÃO
// ----------------------------
const ARQ_ENTRADA = "ZipcodeList(Hub_RJ_Ilha-do-Governador).json";
const ARQ_SAIDA = "ceps_info.json";

// ----------------------------
// TYPES / TIPAGENS
// ----------------------------

// Standardized CEP information structure
// Estrutura padronizada de informações do CEP
interface CepInfo {
  cep: string;
  bairro: string;
  logradouro: string;
  cidade: string;
  uf: string;
  fonte: string;
}

type BancoCeps = Record<string, CepInfo>;

// API response types (minimum required fields)
// Tipos das APIs (mínimo necessário)
interface AwesomeAPIResponse {
  cep?: string;
  district?: string;
  address?: string;
  city?: string;
  state?: string;
}

interface ApiCEPResponse {
  code?: string;
  district?: string;
  address?: string;
  city?: string;
  state?: string;
  erro?: boolean;
}

interface BrasilAPIResponse {
  cep?: string;
  neighborhood?: string;
  street?: string;
  city?: string;
  state?: string;
}

// ----------------------------
// HELPER FUNCTIONS / HELPERS
// ----------------------------

// Removes all non-digit characters from CEP
// Example: "21920-000" → "21920000"
function limparCep(cep: string | number): string {
  return String(cep).replace(/\D/g, "");
}

// Formats CEP with dash (required by some APIs)
// Example: "21920000" → "21920-000"
function formatarCepHifen(cep: string): string {
  return cep.length === 8 ? `${cep.slice(0, 5)}-${cep.slice(5)}` : cep;
}

// ----------------------------
// FETCH WITH TIMEOUT (no 'any' used!)
// FETCH COM TIMEOUT (sem any!)
// ----------------------------

// Wraps fetch with automatic timeout cancellation
// Prevents hanging on slow/unresponsive APIs
async function fetchComTimeout(url: string, timeoutMs: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timeout); // Always cleanup timeout
  }
}

// ----------------------------
// API QUERIES / CONSULTAS
// ----------------------------

// API 1: AwesomeAPI (usually the fastest and most reliable)
// API 1: AwesomeAPI (geralmente a mais rápida e confiável)
async function buscarCep_Awesome(cep: string): Promise<CepInfo | null> {
  try {
    const url = `https://cep.awesomeapi.com.br/json/${cep}`;
    const r = await fetchComTimeout(url, 3000);

    if (!r.ok) return null;

    const d: AwesomeAPIResponse = await r.json();

    return {
      cep: d.cep ?? "",
      bairro: d.district ?? "",
      logradouro: d.address ?? "",
      cidade: d.city ?? "",
      uf: d.state ?? "",
      fonte: "AwesomeAPI",
    };
  } catch {
    return null;
  }
}

// API 2: ApiCEP (good fallback, requires CEP with dash)
// API 2: ApiCEP (bom fallback, requer CEP com hífen)
async function buscarCep_ApiCEP(cep: string): Promise<CepInfo | null> {
  try {
    const url = `https://cdn.apicep.com/file/apicep/${formatarCepHifen(cep)}.json`;
    const r = await fetchComTimeout(url, 3000);

    if (!r.ok) return null;

    const d: ApiCEPResponse = await r.json();
    if (d.erro) return null;

    return {
      cep: d.code ?? "",
      bairro: d.district ?? "",
      logradouro: d.address ?? "",
      cidade: d.city ?? "",
      uf: d.state ?? "",
      fonte: "ApiCEP",
    };
  } catch {
    return null;
  }
}

// API 3: BrasilAPI (official Brazilian government API, last resort)
// API 3: BrasilAPI (API oficial do governo, último recurso)
async function buscarCep_BrasilAPI(cep: string): Promise<CepInfo | null> {
  try {
    const url = `https://brasilapi.com.br/api/cep/v1/${cep}`;
    const r = await fetchComTimeout(url, 3000);

    if (!r.ok) return null;

    const d: BrasilAPIResponse = await r.json();

    return {
      cep: d.cep ?? "",
      bairro: d.neighborhood ?? "",
      logradouro: d.street ?? "",
      cidade: d.city ?? "",
      uf: d.state ?? "",
      fonte: "BrasilAPI",
    };
  } catch {
    return null;
  }
}

// ----------------------------
// MULTI-API FALLBACK / MULTI-API
// ----------------------------

// Tries all APIs in sequence until one succeeds
// Returns null only if all APIs fail
// Order: AwesomeAPI → ApiCEP → BrasilAPI
async function buscarCepMultiplasFontes(cep: string): Promise<CepInfo | null> {
  return (await buscarCep_Awesome(cep)) || (await buscarCep_ApiCEP(cep)) || (await buscarCep_BrasilAPI(cep)) || null;
}

// ----------------------------
// MAIN PROCESSING / PROCESSAMENTO PRINCIPAL
// ----------------------------
async function processar() {
  console.log("\n--- Starting ROBUST query (Multi-API + Standardization) ---");
  console.log("--- Iniciando consulta BLINDADA (Multi-API + Padronização) ---\n");

  let banco: BancoCeps = {};

  // Load existing cache (if available)
  // Cache pré-existente
  if (fs.existsSync(ARQ_SAIDA)) {
    try {
      banco = JSON.parse(fs.readFileSync(ARQ_SAIDA, "utf-8")) as BancoCeps;
    } catch {
      // erro ignorado de propósito
    }
  }

  // Read input file / Entrada
  if (!fs.existsSync(ARQ_ENTRADA)) {
    console.error(`ERROR: File ${ARQ_ENTRADA} not found.`);
    console.error(`ERRO: Arquivo ${ARQ_ENTRADA} não encontrado.`);
    return;
  }

  const listaRaw: string[] = JSON.parse(fs.readFileSync(ARQ_ENTRADA, "utf-8"));
  const cepsUnicos = Array.from(new Set(listaRaw.map(limparCep))); // Remove duplicates
  const cepsValidos = cepsUnicos.filter((c) => c.length === 8); // Only valid 8-digit CEPs

  const cepsNovos = cepsValidos.filter((c) => !banco[c]); // Filter out cached CEPs

  console.log(`Total:         ${cepsValidos.length}`);
  console.log(`Already cached: ${cepsValidos.length - cepsNovos.length}`);
  console.log(`Já no cache:   ${cepsValidos.length - cepsNovos.length}`);
  console.log(`To fetch:      ${cepsNovos.length}`);
  console.log(`Para buscar:   ${cepsNovos.length}\n`);

  // Main loop - fetches each new CEP
  // Loop principal
  for (let i = 0; i < cepsNovos.length; i++) {
    const cep = cepsNovos[i];

    // Progress indicator (overwrites same line)
    process.stdout.write(`[${i + 1}/${cepsNovos.length}] ${cep}       \r`);

    const dados = await buscarCepMultiplasFontes(cep);
    if (dados) banco[cep] = dados;

    // Incremental save: every 5 requests (prevents data loss)
    // Salva a cada 5 requisições
    if (i % 5 === 0) {
      fs.writeFileSync(ARQ_SAIDA, JSON.stringify(banco, null, 2));
    }

    // Rate limiting: 700ms delay (respects API limits)
    // Delay (0.7s)
    await new Promise((res) => setTimeout(res, 700));
  }

  // Final save with all data
  fs.writeFileSync(ARQ_SAIDA, JSON.stringify(banco, null, 2));

  console.log("\n\n--- FINISHED / FINALIZADO ---");
  console.log(`File '${ARQ_SAIDA}' updated successfully.`);
  console.log(`Arquivo '${ARQ_SAIDA}' atualizado com sucesso.\n`);
}

// ----------------------------
// Run main function / Executar função principal
processar();
