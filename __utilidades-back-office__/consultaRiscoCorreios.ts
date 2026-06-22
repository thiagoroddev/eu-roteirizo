/**
 * CORREIOS DELIVERY RISK CHECKER
 * ===============================
 *
 * PURPOSE:
 * Automated script to check if Correios (Brazilian postal service) delivers to specific
 * zip codes (CEPs). This is crucial for logistics planning and route optimization.
 *
 * WHEN TO USE:
 * - When you need to validate delivery coverage for a large list of addresses
 * - To identify areas with delivery restrictions or that require pickup at post office
 * - Before planning delivery routes to avoid sending drivers to non-serviceable areas
 * - To update your delivery database with current Correios coverage information
 *
 * HOW IT WORKS:
 * 1. Reads CEP list from JSON file (src/data/CEPs-Hub_RJ_Ilha-do-Governador.json)
 * 2. For each CEP, uses Puppeteer to scrape Correios website (HTML method)
 * 3. Extracts delivery information ("S" = home delivery, "N" = pickup at post office)
 * 4. Saves results to risco_correios.json with timestamp
 * 5. Implements checkpoint system to resume from interruptions
 * 6. Includes anti-blocking measures (random delays, pause after 10 requests, etc.)
 *
 * FEATURES:
 * - ✅ Checkpoint system: resumes from last processed CEP if interrupted
 * - ✅ Smart retry: automatically retries failed requests (up to 3 times)
 * - ✅ Anti-blocking: random delays between requests (5-12 seconds)
 * - ✅ Progress tracking: shows real-time progress and time estimates
 * - ✅ Skip list: remembers failed CEPs and retries them on next run
 * - ✅ Automatic pauses: 1-minute pause every 10 successful requests
 * - ✅ Block detection: stops automatically if Correios blocks the bot
 *
 * RUNNING:
 * npm run check-correios  # or tsx consultaRiscoCorreios.ts
 *
 * OUTPUT:
 * - src/data/risco_correios.json (delivery status for each CEP)
 * - __utilidades-back-office__/checkpoint.json (progress tracker)
 *
 * IMPORTANT NOTES:
 * - Takes ~9 seconds per CEP (delay + processing time)
 * - For 1000 CEPs, expect ~2.5 hours total runtime
 * - Can be interrupted and resumed safely at any time
 * - If blocked, wait 10-15 minutes before retrying
 * - Failed CEPs are automatically retried on next execution
 */

import fs from "fs/promises";
import { consultarCorreiosHTML } from "./consultaRiscoCorreios_HTML.ts";

// ---------------------------------
// TYPES
// ---------------------------------

export interface CepInfo {
  cep: string;
  bairro: string;
  logradouro: string;
  cidade: string;
  uf: string;
  fonte: string;
}

export interface CorreiosServico {
  Codigo: string;
  Valor: string;
  PrazoEntrega: string;
  EntregaDomiciliar: string;
  obsFim?: string;
  mensagemEntrega?: string;
  MsgErro?: string;
}

export interface RiscoInfo {
  cep: string;
  entregaDomiciliar: "S" | "N";
  mensagem: string;
  data: string;
}

export interface Checkpoint {
  ultimo: string | null;
  pulados: string[];
}

// ---------------------------------
// FILES / ARQUIVOS
// ---------------------------------

// Input: List of CEPs to check
const FILE_CEPS = "src/data/CEPs-Hub_RJ_Ilha-do-Governador.json";
// Output: Delivery status results
const FILE_RISCO = "src/data/risco_correios.json";
// Progress tracker: last processed CEP + failed CEPs list
const FILE_CHECKPOINT = "__utilidades-back-office__/checkpoint.json";

// ---------------------------------
// HELPER FUNCTIONS / Funções auxiliares
// ---------------------------------

// Async sleep helper (prevents blocking detection)
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// Random delay between 5-12 seconds (mimics human behavior)
function getRandomDelay(): number {
  return 5000 + Math.random() * 7000;
}

function formatarTempo(ms: number): string {
  const horas = Math.floor(ms / 3600000);
  const minutos = Math.floor((ms % 3600000) / 60000);
  if (horas > 0) {
    return `${horas}h ${minutos}min`;
  }
  return `${minutos}min`;
}

// ---------------------------------
// SAFE JSON LOADING / JSON seguro
// ---------------------------------

// Loads JSON file, returns fallback if file doesn't exist or is corrupted
// Useful for first run when files don't exist yet
async function loadJsonSafe<T>(file: string, fallback: T): Promise<T> {
  try {
    const content = await fs.readFile(file, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

// ---------------------------------
// Consulta Correios
// ---------------------------------

async function consultarCorreios(cep: string): Promise<CorreiosServico> {
  return await consultarCorreiosHTML(cep);
}

// ---------------------------------
// MAIN
// ---------------------------------

(async () => {
  console.log("🔍 Iniciando consulta dos CEPs…");

  const cepsBase = await loadJsonSafe<Record<string, CepInfo>>(FILE_CEPS, {});
  const riscoData = await loadJsonSafe<Record<string, RiscoInfo>>(FILE_RISCO, {});
  const checkpoint = await loadJsonSafe<Checkpoint>(FILE_CHECKPOINT, { ultimo: null, pulados: [] });

  if (!checkpoint.pulados) {
    checkpoint.pulados = [];
  }

  const ceps = Object.keys(cepsBase);
  const total = ceps.length;

  let cepsParaProcessar: string[] = [];

  if (checkpoint.pulados.length > 0) {
    console.log(`\n🔄 Priorizando ${checkpoint.pulados.length} CEPs pulados anteriormente...`);
    const cepsPuladosPendentes = checkpoint.pulados.filter((cep) => !riscoData[cep]);
    cepsParaProcessar = [...cepsPuladosPendentes];
    console.log(`   📋 CEPs pulados pendentes: ${cepsPuladosPendentes.length}\n`);
  }

  let startIndex = 0;
  if (checkpoint.ultimo) {
    const idx = ceps.indexOf(checkpoint.ultimo);
    if (idx >= 0) startIndex = idx + 1;
  }

  for (let i = startIndex; i < ceps.length; i++) {
    if (!riscoData[ceps[i]] && !cepsParaProcessar.includes(ceps[i])) {
      cepsParaProcessar.push(ceps[i]);
    }
  }

  console.log(`🔁 Total de CEPs para processar: ${cepsParaProcessar.length}`);

  // Estimativa inicial
  const tempoMedioPorCep = 9000; // 9s médio (delay + processamento)
  const pausasPreventivas = Math.floor(cepsParaProcessar.length / 10) * 60000; // 1min a cada 10
  const tempoEstimadoTotal = cepsParaProcessar.length * tempoMedioPorCep + pausasPreventivas;
  console.log(`⏱️  Tempo estimado: ${formatarTempo(tempoEstimadoTotal)}\n`);

  let cepsPuladosSeguidos = 0;
  const maxPuladosSeguidos = 6;
  let consultasSucessivasCount = 0;

  const temposEspera = [0, 120000, 240000, 360000, 480000, 600000];

  const inicioProcessamento = Date.now();

  for (let i = 0; i < cepsParaProcessar.length; i++) {
    const cep = cepsParaProcessar[i];
    const progresso = i + 1;

    if (riscoData[cep]) {
      const updated = new Date(riscoData[cep].data);
      const diff = Date.now() - updated.getTime();
      if (diff / 86400000 < 30) {
        continue;
      }
    }

    const totalProcessados = Object.keys(riscoData).length;

    // Cálculo de tempo restante atualizado
    const cepsRestantes = cepsParaProcessar.length - i;
    const tempoDecorrido = Date.now() - inicioProcessamento;
    const tempoMedioPorCepReal = i > 0 ? tempoDecorrido / i : tempoMedioPorCep;
    const pausasRestantes = Math.floor(cepsRestantes / 10) * 60000;
    const tempoRestante = cepsRestantes * tempoMedioPorCepReal + pausasRestantes;

    console.log(`📡 Consultando CEP ${cep} (${progresso}/${cepsParaProcessar.length} | Total: ${totalProcessados}/${total})`);
    console.log(`   ⏱️  Estimativa restante: ${formatarTempo(tempoRestante)}`);

    let tentativas = 0;
    const maxTentativas = 3;
    let sucesso = false;

    while (tentativas < maxTentativas && !sucesso) {
      try {
        if (tentativas > 0) {
          console.log(`   🔄 Tentativa ${tentativas + 1}/${maxTentativas}...`);
          await sleep(3000);
        }

        const servico = await consultarCorreios(cep);

        riscoData[cep] = {
          cep,
          entregaDomiciliar: servico.EntregaDomiciliar as "S" | "N",
          mensagem: servico.mensagemEntrega || servico.obsFim || servico.MsgErro || "Sem informação disponível",
          data: new Date().toISOString(),
        };

        if (checkpoint.pulados.includes(cep)) {
          checkpoint.pulados = checkpoint.pulados.filter((c) => c !== cep);
        }

        await fs.writeFile(FILE_RISCO, JSON.stringify(riscoData, null, 2));
        await fs.writeFile(FILE_CHECKPOINT, JSON.stringify({ ultimo: cep, pulados: checkpoint.pulados }, null, 2));

        cepsPuladosSeguidos = 0;
        consultasSucessivasCount++;

        const statusIcon = servico.EntregaDomiciliar === "S" ? "✅" : "❌";
        const statusTexto = servico.EntregaDomiciliar === "S" ? "SIM" : "NÃO";
        console.log(`${statusIcon} ${statusTexto} | CEP ${cep}`);
        if (servico.mensagemEntrega) {
          console.log(`   └─ ${servico.mensagemEntrega.substring(0, 80)}${servico.mensagemEntrega.length > 80 ? "..." : ""}`);
        }

        sucesso = true;

        if (consultasSucessivasCount % 10 === 0) {
          console.log(`\n⏸️  Pausa preventiva (${consultasSucessivasCount} consultas sucessivas)`);
          console.log(`⏳ Aguardando 1 minuto para evitar bloqueio...\n`);
          await sleep(60000);
        } else {
          const delay = getRandomDelay();
          console.log(`⏱️  Próximo em ${(delay / 1000).toFixed(1)}s...\n`);
          await sleep(delay);
        }
      } catch (err) {
        tentativas++;
        const errorMsg = (err as Error).message;
        const errorStack = (err as Error).stack || "";

        if (errorMsg.includes("BLOQUEIO") || errorMsg.includes("403") || errorMsg.includes("429") || errorMsg.includes("captcha") || errorMsg.toLowerCase().includes("blocked")) {
          const totalProcessados = Object.keys(riscoData).length;
          console.log(`\n${"=".repeat(60)}`);
          console.log(`🚨 BLOQUEIO DETECTADO NO CEP ${cep}!`);
          console.log(`${"=".repeat(60)}\n`);
          console.log("🛑 Encerrando processo para evitar ban permanente.");
          console.log(`📋 Último CEP processado: ${checkpoint.ultimo || "nenhum"}`);
          console.log(`📊 Progresso: ${totalProcessados}/${total} (${((totalProcessados / total) * 100).toFixed(1)}%)`);
          console.log(`✅ CEPs salvos: ${totalProcessados}`);
          console.log("\n💡 Para retomar, execute novamente - continuará de onde parou.");
          process.exit(1);
        }

        if (errorMsg.includes("timeout") || errorMsg.includes("Timeout") || errorMsg.includes("Waiting for selector") || errorMsg.includes("Navigation") || errorMsg.includes("net::")) {
          if (tentativas < maxTentativas) {
            console.log(`   ⚠️  Timeout - tentando novamente (${tentativas}/${maxTentativas})...`);
            continue;
          } else {
            if (!checkpoint.pulados.includes(cep)) {
              checkpoint.pulados.push(cep);
            }
            cepsPuladosSeguidos++;
            consultasSucessivasCount = 0;

            const totalProcessados = Object.keys(riscoData).length;
            console.log(`\n${"=".repeat(60)}`);
            console.log(`❌ FALHA APÓS ${maxTentativas} TENTATIVAS - CEP ${cep}`);
            console.log(`   Erro: ${errorMsg}`);
            console.log(`${"=".repeat(60)}\n`);
            console.log(`⚠️  CEP pulado (${cepsPuladosSeguidos}/${maxPuladosSeguidos} seguidos)`);
            console.log(`📋 Último CEP processado: ${checkpoint.ultimo || "nenhum"}`);
            console.log(`📊 Progresso: ${totalProcessados}/${total} (${((totalProcessados / total) * 100).toFixed(1)}%)`);

            await fs.writeFile(FILE_CHECKPOINT, JSON.stringify({ ultimo: checkpoint.ultimo, pulados: checkpoint.pulados }, null, 2));

            if (cepsPuladosSeguidos > 0 && cepsPuladosSeguidos < maxPuladosSeguidos) {
              const tempoEspera = temposEspera[Math.min(cepsPuladosSeguidos, temposEspera.length - 1)];
              const minutos = (tempoEspera / 60000).toFixed(0);
              console.log(`\n⏳ Aguardando ${minutos} minuto(s) antes de continuar...`);
              console.log(`   (Evitando piorar possível bloqueio temporário)\n`);
              await sleep(tempoEspera);
            }

            if (cepsPuladosSeguidos >= maxPuladosSeguidos) {
              console.log(`${"=".repeat(60)}`);
              console.log(`🛑 LIMITE DE ${maxPuladosSeguidos} CEPs PULADOS SEGUIDOS ATINGIDO!`);
              console.log(`${"=".repeat(60)}\n`);
              console.log("⚠️  Possível bloqueio prolongado do site.");
              console.log(`📋 Último CEP processado: ${checkpoint.ultimo || "nenhum"}`);
              console.log(`⏭️  CEPs pulados nesta sessão: ${checkpoint.pulados.slice(-maxPuladosSeguidos).join(", ")}`);
              console.log(`📊 Total de CEPs pulados: ${checkpoint.pulados.length}`);
              console.log(`📊 Total processado: ${totalProcessados}/${total} (${((totalProcessados / total) * 100).toFixed(1)}%)`);
              console.log("\n💡 Aguarde 10-15 minutos e execute novamente para retomar.");
              console.log("   Os CEPs pulados serão priorizados na próxima execução.");
              process.exit(1);
            }

            break;
          }
        }

        const totalProcessados = Object.keys(riscoData).length;
        console.log(`\n${"=".repeat(60)}`);
        console.log(`❌ ERRO NÃO ESPERADO - CEP ${cep}`);
        console.log(`   ${errorMsg}`);
        console.log(`${"=".repeat(60)}\n`);
        console.log("🛑 Encerrando por segurança");
        console.log(`📋 Último CEP processado: ${checkpoint.ultimo || "nenhum"}`);
        console.log(`📊 Progresso: ${totalProcessados}/${total} (${((totalProcessados / total) * 100).toFixed(1)}%)`);
        console.log(`\n🔍 Stack:\n${errorStack}`);
        console.log("\n💡 Verifique o erro e execute novamente para retomar.");
        process.exit(1);
      }
    }
  }

  const tempoTotal = Date.now() - inicioProcessamento;
  console.log(`\n🎉 Finalizado!`);
  console.log(`⏱️  Tempo total: ${formatarTempo(tempoTotal)}`);
  console.log(`📊 CEPs processados: ${Object.keys(riscoData).length}/${total}`);
})();
