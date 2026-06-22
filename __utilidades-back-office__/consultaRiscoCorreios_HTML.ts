/**
 * CORREIOS HTML SCRAPER (PUPPETEER-BASED)
 * ========================================
 *
 * PURPOSE:
 * Headless browser automation to check Correios delivery coverage by scraping their
 * official price/delivery time calculator.
 *
 * WHY PUPPETEER INSTEAD OF API:
 * - Correios API endpoint doesn't respond to HTTP requests
 * - HTML scraping with browser automation is the only reliable method
 * - Handles JavaScript-rendered content that simple HTTP requests can't access
 *
 * HOW IT WORKS:
 * 1. Launches headless Chrome browser
 * 2. Navigates to Correios price calculator form
 * 3. Fills form with origin/destination CEPs
 * 4. Submits form (opens result in new tab)
 * 5. Extracts delivery information from result table
 * 6. Returns structured data with delivery status
 *
 * ANTI-BLOCKING MEASURES:
 * - Real browser User-Agent (looks like Chrome on Windows)
 * - Waits for network idle (mimics human browsing)
 * - Delays between actions (typing, clicking)
 *
 * RETURNS:
 * {
 *   Codigo: "PAC",
 *   Valor: "12,50",
 *   PrazoEntrega: "5",
 *   EntregaDomiciliar: "S" or "N",  // S = home delivery, N = pickup at post office
 *   mensagemEntrega: "Entrega domiciliar" or "Retirada na unidade dos Correios"
 * }
 *
 * ERROR HANDLING:
 * - Throws TIMEOUT if page takes too long to load
 * - Throws BLOQUEIO_ANTI_BOT if extraction fails (possible blocking)
 * - Always closes browser, even on errors
 *
 * USAGE:
 * import { consultarCorreiosHTML } from './consultaRiscoCorreios_HTML';
 * const result = await consultarCorreiosHTML('21920000');
 * console.log(result.EntregaDomiciliar); // "S" or "N"
 */

import puppeteer, { type Page } from "puppeteer";

// MAIN FUNCTION - Query Correios using Puppeteer (renders JavaScript)
// FUNÇÃO PRINCIPAL - Consulta Correios usando Puppeteer (renderiza JavaScript)
// --------------------------------------
export async function consultarCorreiosHTML(cep: string) {
  // Launch headless browser with resource-saving flags
  const browser = await puppeteer.launch({
    headless: true, // No visible window (runs in background)
    args: [
      "--no-sandbox", // Required for Docker/Linux environments
      "--disable-setuid-sandbox", // Security bypass for containers
      "--disable-dev-shm-usage", // Prevents /dev/shm space issues
      "--disable-accelerated-2d-canvas", // Reduces memory usage
      "--disable-gpu", // No GPU rendering needed
    ],
  });

  try {
    const page = await browser.newPage();

    // Set realistic User-Agent (appears as Chrome browser on Windows)
    // Helps avoid anti-bot detection
    await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");

    // STEP 1: Navigate to Correios form page
    // PASSO 1: Acessa a página do formulário
    await page.goto("https://www2.correios.com.br/sistemas/precosPrazos/", {
      waitUntil: "networkidle2", // Wait until network is idle (page fully loaded)
      timeout: 30000, // 30 second timeout
    });

    // STEP 2: Wait for service dropdown to appear (ensures page is ready)
    // PASSO 2: Aguarda o select de serviço aparecer
    await page.waitForSelector('select[name="servico"]', { timeout: 10000 });

    // STEP 3: Select PAC service (code 04510 - standard shipping)
    // PASSO 3: Seleciona PAC - isso é suficiente para calcular
    await page.select('select[name="servico"]', "04510");
    await new Promise((r) => setTimeout(r, 1000)); // Wait 1s for selection to register

    // STEP 4: Fill origin CEP (Ilha do Governador, RJ)
    // PASSO 4: Preenche CEP de origem
    await page.type('input[name="cepOrigem"]', "21920000");
    await new Promise((r) => setTimeout(r, 500)); // Delay mimics human typing

    // STEP 5: Fill destination CEP (the one we're checking)
    // PASSO 5: Preenche CEP de destino
    await page.type('input[name="cepDestino"]', cep);
    await new Promise((r) => setTimeout(r, 500));

    // STEP 6: Click "Calculate" button - opens result in NEW TAB
    // PASSO 6: Clica no botão "Calcular" - abre em NOVA ABA
    const [novaAba] = await Promise.all([
      new Promise<Page>((resolve) =>
        browser.once("targetcreated", async (target) => {
          const newPage = await target.page();
          if (newPage) resolve(newPage);
        })
      ),
      page.click('input[value="Calcular"]'),
    ]);

    // STEP 7: Wait for result table in new tab
    // PASSO 7: Aguarda tabela na nova aba
    await novaAba.waitForSelector("table", { timeout: 15000 });

    // STEP 8: Extract data from result page - looks for "Entrega" in table
    // PASSO 8: Extrai os dados da página de resultado - procura pela palavra "Entrega" na tabela
    // This runs in browser context (has access to DOM)
    const resultado = await novaAba.evaluate(() => {
      let entregaDomiciliar = "N";
      let mensagemEntrega = "";
      const codigo = "PAC";
      let valor = "0,00";
      let prazoEntrega = "0";

      const cells = Array.from(document.querySelectorAll("td, th"));

      // Procura pela célula que contém "Entrega:" e pega a próxima célula
      for (let i = 0; i < cells.length; i++) {
        const texto = cells[i].textContent?.trim() || "";
        const textoLower = texto.toLowerCase();

        // Encontrou "Entrega:" mas NÃO "Dias de Entrega:"
        if ((textoLower.includes("entrega:") || textoLower.includes("entrega-:")) && !textoLower.includes("dias")) {
          // Pega a próxima célula que tem o valor
          if (i + 1 < cells.length) {
            mensagemEntrega = cells[i + 1].textContent?.trim() || "";
            const msgLower = mensagemEntrega.toLowerCase();

            // SIM = "Entrega domiciliar"
            if (msgLower.includes("entrega domiciliar") || msgLower.includes("domiciliar")) {
              entregaDomiciliar = "S";
            }
            // NÃO = "Unidade dos Correios" ou similar
            else if (msgLower.includes("unidade dos correios") || msgLower.includes("agência") || msgLower.includes("mais próxima")) {
              entregaDomiciliar = "N";
            }
          }
          break;
        }

        // Extrai prazo de entrega (procura por número + "dia")
        if (textoLower.includes("dia") && !textoLower.includes("entrega")) {
          const match = texto.match(/(\d+)\s*dia/i);
          if (match) {
            prazoEntrega = match[1];
          }
        }

        // Extrai valor (procura por R$)
        if (texto.includes("R$")) {
          const match = texto.match(/R\$\s*([\d,.]+)/);
          if (match) {
            valor = match[1];
          }
        }
      }

      return {
        Codigo: codigo,
        Valor: valor,
        PrazoEntrega: prazoEntrega,
        EntregaDomiciliar: entregaDomiciliar,
        obsFim: mensagemEntrega,
        mensagemEntrega,
      };
    });

    await browser.close();

    // Validate if data extraction was successful
    // Valida se conseguiu extrair dados
    if (!resultado.mensagemEntrega || resultado.mensagemEntrega === "") {
      throw new Error("FALHA_EXTRACAO: Campo 'Entrega:' não encontrado na página de resultado");
    }

    return resultado;
  } catch (e) {
    await browser.close(); // Always close browser to free resources
    const erro = e as Error;

    // Propagate error with clear context for debugging
    // Propaga erro com contexto claro
    if (erro.message.includes("timeout") || erro.message.includes("Timeout")) {
      throw new Error("TIMEOUT: Página demorou muito para carregar");
    }

    // Extraction failure usually means anti-bot blocking or page structure changed
    if (erro.message.includes("FALHA_EXTRACAO")) {
      throw new Error("BLOQUEIO_ANTI_BOT: Possível bloqueio ou mudança na estrutura da página");
    }

    throw erro; // Re-throw unknown errors
  }
}
