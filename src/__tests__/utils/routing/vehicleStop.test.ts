import { describe, it, expect } from "vitest";
import { suggestVehicleStop, defaultVehicleStop, defaultAnchorSeed } from "../../../utils/routing/vehicleStop";
import { buildGraph, type RoadGraph, type OsmElement } from "../../../utils/routing/graph";
import type { DeliveryPoint } from "../../../types/routing";
import { squareGraph } from "./__fixtures__/syntheticGraph";

const pt = (id: string, lat: number, lng: number): DeliveryPoint => ({ id, lat, lng, address: id, packageCount: 1, packages: [] });

/**
 * Condomínio com recuo (TASK-BG-016): a avenida nomeada corre a ~44 m do prédio,
 * e a via INTERNA do condomínio (highway=service, sem nome — como o OSM marca
 * acesso de garagem/estacionamento) passa a ~11 m. O pino fica dentro do lote.
 *
 *   Avenida Epitácio Pessoa ────────────────  lat -22.98000   (nomeada, primary)
 *   via interna do condomínio ─────────────   lat -22.98030   (service, sem nome)
 *                 📍 prédio                   lat -22.98040
 */
const way = (nodes: number[], geometry: { lat: number; lon: number }[], tags: Record<string, string>): OsmElement => ({ type: "way", nodes, geometry, tags });
const AVENUE_LAT = -22.98;
const SERVICE_LAT = -22.9803;
const BUILDING = { lat: -22.9804, lng: -43.2 };
const AVENUE = way(
  [1, 2],
  [
    { lat: AVENUE_LAT, lon: -43.201 },
    { lat: AVENUE_LAT, lon: -43.199 },
  ],
  { highway: "primary", name: "Avenida Epitácio Pessoa" }
);
/** Sem `name`: buildGraph cai para o próprio `highway`, virando o rótulo genérico "service". */
const CONDO_SERVICE = way(
  [3, 4],
  [
    { lat: SERVICE_LAT, lon: -43.2005 },
    { lat: SERVICE_LAT, lon: -43.1995 },
  ],
  { highway: "service" }
);
const condoGraph = buildGraph([AVENUE, CONDO_SERVICE]);

describe("suggestVehicleStop", () => {
  it("projects the address onto the nearest street when a graph is available", () => {
    /** Mid-block point slightly south of Rua CD-like edge A→C (lat -22.98). */
    const address = { lat: -22.98018, lng: -43.19955 };
    const suggested = suggestVehicleStop(squareGraph, address);
    expect(suggested.lat).toBeCloseTo(-22.98, 5);
    expect(suggested.lng).toBeCloseTo(-43.19955, 5);
  });

  it("falls back to the address coordinate without a graph (loading/offline)", () => {
    const address = { lat: -22.98018, lng: -43.19955 };
    const suggested = suggestVehicleStop(null, address);
    expect(suggested).toEqual(address);
    expect(suggested).not.toBe(address); // fresh object, caller may mutate freely
  });

  it("falls back for an empty graph (no edges to project onto)", () => {
    const empty: RoadGraph = { coords: new Map(), adj: new Map() };
    const address = { lat: -22.98, lng: -43.2 };
    expect(suggestVehicleStop(empty, address)).toEqual(address);
  });

  // O arraste manual da âncora continua sendo projeção crua (a posição é escolha
  // do usuário — ele pode querer parar na via interna). Só a parada PADRÃO muda.
  it("continua projetando na aresta mais próxima, mesmo sendo via de serviço (TASK-BG-016)", () => {
    expect(suggestVehicleStop(condoGraph, BUILDING).lat).toBeCloseTo(SERVICE_LAT, 6);
  });
});

describe("defaultVehicleStop (TASK-BG-016 — a parada PADRÃO fica na rua do endereço)", () => {
  it("prefere a via cujo nome casa com o logradouro, ignorando a service mais próxima", () => {
    const anchor = defaultVehicleStop(condoGraph, BUILDING, "Avenida Epitácio Pessoa");
    expect(anchor.lat).toBeCloseTo(AVENUE_LAT, 6); // a avenida, não a interna do condomínio
    expect(anchor.lng).toBeCloseTo(BUILDING.lng, 5);
  });

  it("casa o logradouro por nome normalizado (abreviação do romaneio)", () => {
    expect(defaultVehicleStop(condoGraph, BUILDING, "Av. Epitacio Pessoa").lat).toBeCloseTo(AVENUE_LAT, 6);
  });

  it("sem casar o nome, evita a via de serviço e usa a via nomeada mais próxima", () => {
    // Logradouro que não existe na malha: cai no nível (b) — nomeada não-service.
    expect(defaultVehicleStop(condoGraph, BUILDING, "Rua Que Não Existe Na Malha").lat).toBeCloseTo(AVENUE_LAT, 6);
  });

  it("sem logradouro nenhum, ainda evita a via de serviço", () => {
    expect(defaultVehicleStop(condoGraph, BUILDING, "").lat).toBeCloseTo(AVENUE_LAT, 6);
  });

  it("só existe via de serviço por perto: mantém o comportamento antigo em vez de não ancorar", () => {
    const onlyService = buildGraph([CONDO_SERVICE]);
    expect(defaultVehicleStop(onlyService, BUILDING, "Avenida Epitácio Pessoa").lat).toBeCloseTo(SERVICE_LAT, 6);
  });

  it("rua de mesmo nome longe demais não puxa a âncora (geocódigo ruim) — usa a nomeada perto", () => {
    /** A "Epitácio Pessoa" a ~330 m; uma rua nomeada qualquer a ~44 m. */
    const farAvenue = way(
      [5, 6],
      [
        { lat: -22.983, lon: -43.201 },
        { lat: -22.983, lon: -43.199 },
      ],
      { highway: "primary", name: "Avenida Epitácio Pessoa" }
    );
    const nearStreet = way(
      [7, 8],
      [
        { lat: AVENUE_LAT, lon: -43.201 },
        { lat: AVENUE_LAT, lon: -43.199 },
      ],
      { highway: "residential", name: "Rua Perto" }
    );
    const graph = buildGraph([farAvenue, nearStreet, CONDO_SERVICE]);
    expect(defaultVehicleStop(graph, BUILDING, "Avenida Epitácio Pessoa").lat).toBeCloseTo(AVENUE_LAT, 6);
  });

  it("sem grafo devolve o próprio ponto, como hoje (app offline não trava)", () => {
    expect(defaultVehicleStop(null, BUILDING, "Avenida Epitácio Pessoa")).toEqual(BUILDING);
  });
});

describe("defaultAnchorSeed (TASK-RF-006.6)", () => {
  /** north ~110 m acima de south; a origem decide qual deles é a semente. */
  const north = pt("north", -22.979, -43.2);
  const south = pt("south", -22.98, -43.2);
  const points = [north, south];

  it("escolhe o endereço mais próximo de ONDE O VEÍCULO VEM", () => {
    // Origem ao norte → a semente é o endereço do norte…
    expect(defaultAnchorSeed(points, { lat: -22.975, lng: -43.2 })?.id).toBe("north");
    // …e vindo do sul, é o do sul (a ordem do array não manda).
    expect(defaultAnchorSeed(points, { lat: -22.99, lng: -43.2 })?.id).toBe("south");
  });

  it("sem origem (rota sem início e sem parada anterior) cai no primeiro ponto", () => {
    expect(defaultAnchorSeed(points, null)?.id).toBe("north");
  });

  it("sem pontos não há semente", () => {
    expect(defaultAnchorSeed([], { lat: -22.98, lng: -43.2 })).toBeNull();
  });
});
