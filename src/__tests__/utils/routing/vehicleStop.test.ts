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

describe("defaultVehicleStop (TASK-BG-016, TASK-BG-022 — a parada PADRÃO fica na via nomeada em frente ao pino)", () => {
  it("ignora a via de serviço mais próxima e fica na avenida nomeada", () => {
    const anchor = defaultVehicleStop(condoGraph, BUILDING, "Avenida Epitácio Pessoa");
    expect(anchor.lat).toBeCloseTo(AVENUE_LAT, 6); // a avenida, não a interna do condomínio
    expect(anchor.lng).toBeCloseTo(BUILDING.lng, 5);
  });

  it("sem casar o nome, evita a via de serviço e usa a via nomeada mais próxima", () => {
    expect(defaultVehicleStop(condoGraph, BUILDING, "Rua Que Não Existe Na Malha").lat).toBeCloseTo(AVENUE_LAT, 6);
  });

  it("sem logradouro nenhum, ainda evita a via de serviço", () => {
    expect(defaultVehicleStop(condoGraph, BUILDING, "").lat).toBeCloseTo(AVENUE_LAT, 6);
  });

  it("só existe via de serviço por perto: mantém o comportamento antigo em vez de não ancorar", () => {
    const onlyService = buildGraph([CONDO_SERVICE]);
    expect(defaultVehicleStop(onlyService, BUILDING, "Avenida Epitácio Pessoa").lat).toBeCloseTo(SERVICE_LAT, 6);
  });

  /** Rua horizontal na latitude dada, cobrindo a longitude do pino. */
  const street = (id: number, lat: number, name: string): OsmElement =>
    way(
      [id, id + 1],
      [
        { lat, lon: -43.201 },
        { lat, lon: -43.199 },
      ],
      { highway: "residential", name }
    );

  // TASK-BG-022, parada P3 do roteiro L-30: o pino fica a ~33 m de uma rua e a
  // ~200 m da rua do endereço. O carro parava lá longe, a meio caminho da próxima.
  it("rua do endereço longe do pino perde para a via nomeada em frente ao pino", () => {
    const FRONT_LAT = -22.9801; // ~33 m ao norte do pino
    const graph = buildGraph([street(10, FRONT_LAT, "Rua Prudente de Morais"), street(20, -22.9822, "Rua Barão da Torre"), CONDO_SERVICE]);
    expect(defaultVehicleStop(graph, BUILDING, "Rua Barão da Torre").lat).toBeCloseTo(FRONT_LAT, 6);
  });

  // TASK-BG-022, parada P4 do roteiro L-30: ~47 m contra ~15 m passa da folga.
  it("rua do endereço além da folga de desempate perde para a nomeada mais próxima", () => {
    const FRONT_LAT = -22.98026; // ~15 m ao norte do pino
    const graph = buildGraph([street(10, FRONT_LAT, "Rua Barão da Torre"), street(20, -22.98082, "Rua Garcia d'Ávila")]);
    expect(defaultVehicleStop(graph, BUILDING, "Rua Garcia d'Ávila").lat).toBeCloseTo(FRONT_LAT, 6);
  });

  it("na esquina, a rua do endereço dentro da folga vence a transversal", () => {
    const ADDRESS_LAT = -22.98055; // ~17 m ao sul do pino
    /** Transversal a ~10 m a oeste: mais perto, mas por menos que a folga. */
    const crossStreet = way(
      [30, 31],
      [
        { lat: -22.981, lon: -43.2001 },
        { lat: -22.98, lon: -43.2001 },
      ],
      { highway: "residential", name: "Rua Farme de Amoedo" }
    );
    const graph = buildGraph([street(10, ADDRESS_LAT, "Rua Visconde de Pirajá"), crossStreet]);
    expect(defaultVehicleStop(graph, BUILDING, "Rua Visconde de Pirajá").lat).toBeCloseTo(ADDRESS_LAT, 6);
    // o nome casa normalizado (abreviação do romaneio)
    expect(defaultVehicleStop(graph, BUILDING, "R. Visconde de Piraja").lat).toBeCloseTo(ADDRESS_LAT, 6);
    // sem a rua do endereço na malha, fica a transversal mais próxima
    expect(defaultVehicleStop(graph, BUILDING, "Rua Qualquer").lng).toBeCloseTo(-43.2001, 6);
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
