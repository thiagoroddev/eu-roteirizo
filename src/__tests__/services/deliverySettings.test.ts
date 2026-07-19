import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { loadDeliverySettings, saveDeliverySettings, DEFAULT_DELIVERY_SETTINGS } from "../../services/deliverySettings";

// O localStorage global deste runtime é o stub experimental do Node (sem métodos
// funcionais) — substitui por um mock em memória (mesmo padrão do themeService.test).
const store = new Map<string, string>();
const localStorageMock = {
  getItem: (key: string) => store.get(key) ?? null,
  setItem: (key: string, value: string) => {
    store.set(key, String(value));
  },
  removeItem: (key: string) => {
    store.delete(key);
  },
};

describe("deliverySettings (RF-007.2 — preferência global de tempo de entrega)", () => {
  beforeEach(() => {
    store.clear();
    vi.stubGlobal("localStorage", localStorageMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("sem nada salvo → defaults do código", () => {
    expect(loadDeliverySettings()).toEqual(DEFAULT_DELIVERY_SETTINGS);
  });

  it("save + load = roundtrip", () => {
    saveDeliverySettings({ deliveryBaseSeconds: 55, deliveryPerPackageSeconds: 20 });
    expect(loadDeliverySettings()).toEqual({ deliveryBaseSeconds: 55, deliveryPerPackageSeconds: 20 });
  });

  it("valor parcial/inválido → cada campo cai no default", () => {
    store.set("deliverySettings", JSON.stringify({ deliveryBaseSeconds: 30 }));
    expect(loadDeliverySettings()).toEqual({ deliveryBaseSeconds: 30, deliveryPerPackageSeconds: DEFAULT_DELIVERY_SETTINGS.deliveryPerPackageSeconds });

    store.set("deliverySettings", "não é json");
    expect(loadDeliverySettings()).toEqual(DEFAULT_DELIVERY_SETTINGS);
  });
});
