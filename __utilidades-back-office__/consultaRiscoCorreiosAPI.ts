/**
 * CORREIOS API-BASED CHECKER (DEPRECATED - DOESN'T WORK)
 * =======================================================
 *
 * ⚠️ WARNING: THIS APPROACH DOES NOT WORK
 * The Correios API endpoint doesn't respond via HTTP requests.
 * Use consultaRiscoCorreios.ts (HTML scraping method) instead.
 *
 * WHY IT DOESN'T WORK:
 * - The API endpoint requires special authentication
 * - Returns CORS errors or timeouts
 * - Correios may have disabled public API access
 *
 * THIS FILE IS KEPT FOR:
 * - Historical reference
 * - Understanding what was attempted
 * - Future reference if Correios enables API again
 *
 * RECOMMENDED ALTERNATIVE:
 * Use consultaRiscoCorreios.ts which uses Puppeteer to scrape the HTML form.
 * It's slower but reliable.
 */

// Não funciona, API não responde via HTTP
// Does not work, API doesn't respond via HTTP

import fs from "fs/promises";
import axios from "axios";
import { XMLParser } from "fast-xml-parser";

// ---------------------------------
// TIPOS
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
  MsgErro?: string;
}

export interface RiscoInfo {
  entrega: boolean;
  restricao: boolean;
  pontuacao: number;
  classificacao: string;
  mensagem: string;
  atualizado_em: string;
}

// ---------------------------------
// ARQUIVOS
// ---------------------------------

// Caminhos relativos à raiz do projeto (onde você roda o comando npx)
const FILE_CEPS = "src/data/CEPs-Hub_RJ_Ilha-do-Governador.json";
const FILE_RISCO = "src/data/risco_correios.json";
const FILE_CHECKPOINT = "src/data/checkpoint.json";

// CHANGE 1: Use HTTPS / MUDANÇA 1: Usar HTTPS
// ⚠️ This URL doesn't work - returns timeout or CORS errors
const URL = "https://ws.correios.com.br/calculador/CalcPrecoPrazo.asmx/CalcPrecoPrazo";

// ---------------------------------
// Funções auxiliares
// ---------------------------------

function calcularPontuacao(c: CorreiosServico): number {
  let pontos = 0;

  if (c.EntregaDomiciliar === "N") pontos += 10;
  if (c.obsFim && /interno|retirada|restrição|restrito/i.test(c.obsFim)) pontos += 7;
  if (c.MsgErro && /especial|prazo diferenciado/i.test(c.MsgErro)) pontos += 5;
  if (c.obsFim && /segurança|risco/i.test(c.obsFim)) pontos += 4;

  if (Number(c.PrazoEntrega) > 8) pontos += 2;

  return pontos;
}

function classificar(pontos: number): string {
  if (pontos >= 11) return "restricao_total";
  if (pontos >= 7) return "restricao_parcial";
  if (pontos >= 3) return "atencao";
  return "normal";
}

function entregaSimOuNao(c: CorreiosServico, pontos: number): boolean {
  if (c.EntregaDomiciliar === "N") return false;
  if (c.obsFim && /interno|retirada|restrição|segurança/i.test(c.obsFim)) return false;
  if (pontos >= 7) return false;
  return true;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------
// JSON seguro
// ---------------------------------

async function loadJsonSafe<T>(file: string, fallback: T): Promise<T> {
  try {
    const content = await fs.readFile(file, "utf-8");
    return JSON.parse(content) as T;
  } catch {
    return fallback;
  }
}

// ---------------------------------
// Consulta Correios (MELHORADA)
// ---------------------------------

async function consultarCorreios(cep: string): Promise<CorreiosServico> {
  const params = {
    nCdEmpresa: "",
    sDsSenha: "",
    nCdServico: "04510", // PAC
    sCepOrigem: "22441080",
    sCepDestino: cep,
    nVlPeso: "1",
    nCdFormato: "1",
    nVlComprimento: "5",
    nVlAltura: "2",
    nVlLargura: "10",
    nVlDiametro: "0",
  };

  try {
    // MUDANÇA 2: Timeout e User-Agent
    const { data } = await axios.get(URL, {
      params,
      timeout: 5000, // 5 segundos de limite
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      },
    });

    const parser = new XMLParser();
    const json = parser.parse(data);

    // Validação extra para garantir que o XML veio certo
    if (!json?.cResultado?.Servicos?.cServico) {
      throw new Error("Resposta XML inválida ou incompleta");
    }

    return json.cResultado.Servicos.cServico as CorreiosServico;
  } catch (error: unknown) {
    // CORREÇÃO 1: Tipagem explícita sem usar 'any'
    // Definimos a estrutura mínima que precisamos acessar no objeto de erro
    const err = error as {
      code?: string;
      response?: { status: number };
      message: string;
    };

    // MUDANÇA 3: Log detalhado do erro sem travar o script
    if (err.code === "ECONNABORTED") {
      console.log(`⏱️  Timeout: Correios demorou demais para responder o CEP ${cep}`);
    } else if (err.response) {
      console.log(`🔥 Erro Servidor (${err.response.status}): ${err.message}`);
    } else {
      console.log(`💀 Erro de Rede/DNS: ${err.message}`);
    }
    throw error; // Lança o erro para o loop principal saber que falhou
  }
}

// ---------------------------------
// MAIN
// ---------------------------------

(async () => {
  console.log("🔍 Iniciando consulta dos CEPs…");

  const cepsBase = await loadJsonSafe<Record<string, CepInfo>>(FILE_CEPS, {});
  const riscoData = await loadJsonSafe<Record<string, RiscoInfo>>(FILE_RISCO, {});
  const checkpoint = await loadJsonSafe<{ ultimo: string | null }>(FILE_CHECKPOINT, { ultimo: null });

  const ceps = Object.keys(cepsBase);
  const total = ceps.length;

  let startIndex = 0;
  if (checkpoint.ultimo) {
    const idx = ceps.indexOf(checkpoint.ultimo);
    if (idx >= 0) startIndex = idx + 1;
  }

  console.log(`🔁 Retomando de index ${startIndex} / ${total}`);

  for (let i = startIndex; i < total; i++) {
    const cep = ceps[i];

    if (riscoData[cep]) {
      const updated = new Date(riscoData[cep].atualizado_em);
      const diff = Date.now() - updated.getTime();

      // Cache de 30 dias
      if (diff / 86400000 < 30) {
        // console.log(`⏩ CEP ${cep} ignorado (cache < 30 dias)`); // Comentei para limpar o log
        continue;
      }
    }

    console.log(`📡 Consultando CEP ${cep} (${i + 1}/${total})`);

    try {
      const servico = await consultarCorreios(cep);

      const pontos = calcularPontuacao(servico);
      const classificacao = classificar(pontos);
      const entrega = entregaSimOuNao(servico, pontos);

      riscoData[cep] = {
        entrega,
        restricao: !entrega,
        pontuacao: pontos,
        classificacao,
        mensagem: servico.obsFim || servico.MsgErro || "",
        atualizado_em: new Date().toISOString(),
      };

      // Salva a cada iteração para não perder dados se cair
      await fs.writeFile(FILE_RISCO, JSON.stringify(riscoData, null, 2));
      await fs.writeFile(FILE_CHECKPOINT, JSON.stringify({ ultimo: cep }, null, 2));

      console.log(`✅ CEP ${cep} processado → ${classificacao}`);

      // Espera um pouco para não levar block (3 segundos)
      await sleep(4000 + Math.random() * 3000);
    } catch {
      // CORREÇÃO 2: Removido o argumento '(_e)'
      // Usar apenas 'catch' evita o erro de variável não utilizada
      console.log(`❌ Falha no CEP ${cep}. Pulando...`);
      await sleep(1000); // Espera curta antes de tentar o próximo
    }
  }

  console.log("🎉 Finalizado! Banco de risco gerado.");
})();
