import { describe, it, expect, vi, beforeEach } from "vitest";
import { getIcons } from "../../utils/mapIcons";
import { ICON_KEYS } from "../../constants";
// Importamos o tipo de Opções para ajudar na tipagem do Mock
import type { IconOptions } from "leaflet";

// =============================================================================
// 1. MOCKS (Simulações)
// =============================================================================

vi.mock("leaflet", () => {
  // Simulamos a classe L.Icon retornando as próprias opções passadas.
  // Precisa ser uma `function` (não arrow) para ser construível via `new L.Icon(...)`
  // no vitest 4, que invoca a implementação diretamente como construtor.
  const IconMock = vi.fn().mockImplementation(function (options) {
    return { ...options, _isMockIcon: true };
  });

  // Mock das propriedades estáticas
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (IconMock as any).Default = {
    prototype: { _getIconUrl: vi.fn() },
    mergeOptions: vi.fn(),
  };

  return {
    default: {
      Icon: IconMock,
    },
  };
});

vi.mock("../utils/map", () => ({
  scaleIconConfig: vi.fn((factor) => ({
    iconSize: [25 * factor, 41 * factor],
    iconAnchor: [12, 41],
  })),
}));

// =============================================================================
// 2. HELPER DE TIPAGEM PARA O TESTE
// =============================================================================

// Definimos o formato que nosso Mock tem de verdade.
// Ele tem tudo que IconOptions tem (iconUrl, iconSize...) + nossa flag de teste.
type MockIcon = IconOptions & { _isMockIcon: boolean; shadowUrl?: string };

// =============================================================================
// 3. SUÍTE DE TESTES
// =============================================================================

describe("mapIcons Utilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Teste de Integridade e Estrutura
  // ---------------------------------------------------------------------------
  it("creates an object containing all expected ICON_KEYS", () => {
    const scaleFactor = 1;
    const icons = getIcons(scaleFactor);

    expect(icons).toBeDefined();

    const expectedKeys = Object.values(ICON_KEYS);
    expectedKeys.forEach((key) => {
      expect(icons).toHaveProperty(key);
    });
  });

  // ---------------------------------------------------------------------------
  // Teste de Configuração do Ícone
  // ---------------------------------------------------------------------------
  it("configures the icons with correct properties", () => {
    const scaleFactor = 2;
    const icons = getIcons(scaleFactor);

    // CORREÇÃO AQUI: Type Casting (as unknown as MockIcon)
    // Dizemos ao TS: "Trate isso como nosso MockIcon, não como o L.Icon restrito"
    const homeIcon = icons[ICON_KEYS.HOME] as unknown as MockIcon;

    expect(homeIcon).toHaveProperty("_isMockIcon", true);

    // Agora o TypeScript aceita iconUrl e shadowUrl
    expect(homeIcon).toHaveProperty("iconUrl");
    expect(homeIcon.iconUrl).toContain("marker-home.png");

    expect(homeIcon).toHaveProperty("shadowUrl");
    expect(homeIcon.shadowUrl).toContain("marker-shadow-40.png");

    // Verifica se a escala foi aplicada
    expect(homeIcon.iconSize).toEqual([50, 82]);
  });

  // ---------------------------------------------------------------------------
  // Teste de Memoização (Cache)
  // ---------------------------------------------------------------------------
  it("returns the exact same object reference for the same scaleFactor (Memoization)", () => {
    const result1 = getIcons(1.5);
    const result2 = getIcons(1.5);

    expect(result1).toBe(result2);
  });

  it("creates new objects for different scaleFactors", () => {
    const result1 = getIcons(1.0);
    const result2 = getIcons(2.0);

    expect(result1).not.toBe(result2);

    // Casting também necessário aqui para acessar iconSize
    const icon1 = result1[ICON_KEYS.HOME] as unknown as MockIcon;
    const icon2 = result2[ICON_KEYS.HOME] as unknown as MockIcon;

    expect(icon1.iconSize).toEqual([25, 41]);
    expect(icon2.iconSize).toEqual([50, 82]);
  });
});
