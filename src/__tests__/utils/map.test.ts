import { describe, it, expect, vi } from "vitest";
import { getScaleFactorFromWidth, scaleIconConfig } from "../../utils/map";

// =============================================================================
// MOCK DO MAP_CONFIG
// =============================================================================
// Mockamos as constantes para que o teste não quebre se você mudar os valores
// no arquivo original (ex: mudar o ícone padrão de 25px para 30px).
// Aqui testamos a LÓGICA, não os valores de configuração.
vi.mock("../../constants", () => ({
  MAP_CONFIG: {
    DEFAULT_ICON: {
      SIZE: [10, 20], // Valores simples para facilitar a conta mental
      ANCHOR: [5, 20],
      POPUP_ANCHOR: [1, -10],
      TOOLTIP_ANCHOR: [5, -5],
    },
  },
}));

describe("map Utilities", () => {
  // ---------------------------------------------------------------------------
  // Teste de Cálculo de Fator (Proporção)
  // ---------------------------------------------------------------------------
  describe("getScaleFactorFromWidth", () => {
    it("calculates the correct multiplication factor", () => {
      // Config Base Mockada = 10px

      // Se eu quero 20px, o fator deve ser 2.0
      expect(getScaleFactorFromWidth(20)).toBe(2);

      // Se eu quero 15px, o fator deve ser 1.5
      expect(getScaleFactorFromWidth(15)).toBe(1.5);

      // Se eu quero 5px, o fator deve ser 0.5
      expect(getScaleFactorFromWidth(5)).toBe(0.5);
    });
  });

  // ---------------------------------------------------------------------------
  // Teste de Escala de Configuração (Core Logic)
  // ---------------------------------------------------------------------------
  describe("scaleIconConfig", () => {
    it("scales all coordinate pairs correctly by the given factor", () => {
      // Fator 2 (Dobrar tudo)
      const result = scaleIconConfig(2);

      // Base [10, 20] * 2 -> [20, 40]
      expect(result.iconSize).toEqual([20, 40]);

      // Base [5, 20] * 2 -> [10, 40]
      expect(result.iconAnchor).toEqual([10, 40]);

      // Base [1, -10] * 2 -> [2, -20]
      expect(result.popupAnchor).toEqual([2, -20]);

      // Base [5, -5] * 2 -> [10, -10]
      expect(result.tooltipAnchor).toEqual([10, -10]);
    });

    it("rounds decimal results to nearest integer (Fix for sub-pixel blurring)", () => {
      // AQUI ESTÁ O TESTE DO SEU MATH.ROUND

      // Fator 1.5
      // Size Base [10, 20] * 1.5 = [15, 30] (Sem arredondamento necessário)
      // Anchor Base [5, 20] * 1.5 = [7.5, 30] -> Arredondar -> [8, 30]

      const result = scaleIconConfig(1.5);

      expect(result.iconSize).toEqual([15, 30]);

      // Verifica se 7.5 virou 8
      expect(result.iconAnchor).toEqual([8, 30]);
    });

    it("handles scaling down (factor < 1)", () => {
      // Fator 0.5 (Metade)
      const result = scaleIconConfig(0.5);

      // Base [10, 20] -> [5, 10]
      expect(result.iconSize).toEqual([5, 10]);
    });
  });
});
