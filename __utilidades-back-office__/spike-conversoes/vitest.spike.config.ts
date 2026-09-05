/**
 * Config do arnes do TASK-SPIKE-001. Existe SEPARADA da config do app por um
 * motivo: o arnes nao e teste. Ele mede, demora, e na primeira execucao vai a
 * rede. Se casasse com o `include` padrao, entraria em `npm run test` e o gate
 * de testes do projeto passaria a depender do Overpass.
 *
 * Rodar:  npx vitest run --config __utilidades-back-office__/spike-conversoes/vitest.spike.config.ts
 */
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["__utilidades-back-office__/spike-conversoes/*.arnes.ts"],
    environment: "node",
    // A primeira execucao busca a malha no Overpass, que enfileira pedidos.
    testTimeout: 600_000,
    hookTimeout: 600_000,
    env: { NODE_ENV: "test" },
    // Sem isto o Vitest engole o console: o arnes existe para IMPRIMIR numeros.
    disableConsoleIntercept: true,
  },
});
