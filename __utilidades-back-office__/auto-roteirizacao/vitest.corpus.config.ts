import { defineConfig } from "vitest/config";

export default defineConfig(({ mode }) => ({
  test: {
    include: ["prepare", "refresh", "inventory"].includes(mode)
      ? ["__utilidades-back-office__/auto-roteirizacao/prepareGraph.ts"]
      : mode === "fundamentals"
        ? ["__utilidades-back-office__/auto-roteirizacao/fundamental.arnes.ts"]
        : ["__utilidades-back-office__/auto-roteirizacao/anchors.arnes.ts"],
    environment: "node",
    maxWorkers: 1,
    testTimeout: 60_000,
    hookTimeout: 60_000,
    disableConsoleIntercept: true,
    env: { NODE_ENV: "test" },
  },
}));
