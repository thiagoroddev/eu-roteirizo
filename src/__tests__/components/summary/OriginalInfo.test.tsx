/**
 * OriginalInfo (TASK-REF-017) — sucede o antigo RouteSummary.
 * O teste velho travava a estrutura `<ul>/<li>` (listitem > 10, closest("li")),
 * incompatível com os stat-cards; aqui o contrato é o CONTEÚDO: o que tem dado
 * aparece, o que não tem SOME, e a rota única omite os campos multi-only.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { OriginalInfo } from "../../../components/summary/OriginalInfo";
import { UI_LABELS } from "../../../constants/uiLabels";

const SUMMARY = UI_LABELS.ROUTE_SUMMARY;
const NO_DATA = UI_LABELS.COMMON.NO_DATA;

/** Dados do hook (string pronta, como na produção). Mutável por teste. */
const summary = {
  totalPacks: "112",
  lastStop: "38",
  time: "5 horas e 7 minutos",
  distance: "54 km",
  city: "Rio de Janeiro",
  at: "AT202511158FQU2",
  commerceCount: "3",
  neighborhoods: "Copacabana: 112",
  shiftTime: "Manhã",
  dateRaw: "15/11/2025",
  hub: "LM Hub_RJ_Ilha do Governador",
};

vi.mock("../../../hooks/useRouteSummary", () => ({
  useRouteSummary: () => summary,
}));

const renderInfo = (isSingleRoute = false) => render(<OriginalInfo rows={[]} availableCols={[]} isSingleRoute={isSingleRoute} />);

describe("OriginalInfo (REF-017)", () => {
  it("multi-rota: mostra os cards de métrica e as informações gerais", () => {
    renderInfo();

    // Cards (rótulos sem dois-pontos)
    expect(screen.getByText(SUMMARY.CARD_PACKAGES)).toBeInTheDocument();
    expect(screen.getByText("112")).toBeInTheDocument();
    expect(screen.getByText(SUMMARY.CARD_STOPS)).toBeInTheDocument();
    expect(screen.getByText(SUMMARY.CARD_COMMERCIAL)).toBeInTheDocument();
    expect(screen.getByText(SUMMARY.CARD_ESTIMATED_TIME)).toBeInTheDocument();
    expect(screen.getByText(SUMMARY.CARD_ESTIMATED_DISTANCE)).toBeInTheDocument();

    // Informações gerais (rótulos com dois-pontos, valor ao lado)
    expect(screen.getByText(SUMMARY.GENERAL_INFO)).toBeInTheDocument();
    expect(screen.getByText(SUMMARY.AT)).toBeInTheDocument();
    expect(screen.getByText(summary.at)).toBeInTheDocument();
    expect(screen.getByText(SUMMARY.HUB)).toBeInTheDocument();
    expect(screen.getByText(SUMMARY.SHIFT)).toBeInTheDocument();
    expect(screen.getByText(SUMMARY.NEIGHBORHOODS)).toBeInTheDocument();
    expect(screen.getByText(SUMMARY.CITY)).toBeInTheDocument();
  });

  it("rota única: omite os campos que só existem no multi (Hub, Turno, Tempo, Distância)", () => {
    renderInfo(true);

    expect(screen.queryByText(SUMMARY.HUB)).not.toBeInTheDocument();
    expect(screen.queryByText(SUMMARY.SHIFT)).not.toBeInTheDocument();
    expect(screen.queryByText(SUMMARY.CARD_ESTIMATED_TIME)).not.toBeInTheDocument();
    expect(screen.queryByText(SUMMARY.CARD_ESTIMATED_DISTANCE)).not.toBeInTheDocument();

    // O que existe na rota única continua aparecendo
    expect(screen.getByText(SUMMARY.CARD_PACKAGES)).toBeInTheDocument();
    expect(screen.getByText(SUMMARY.AT)).toBeInTheDocument();
  });

  it("campo SEM dado não é renderizado (nem card, nem linha)", () => {
    summary.city = NO_DATA;
    summary.lastStop = NO_DATA;
    try {
      renderInfo();
      expect(screen.queryByText(SUMMARY.CITY)).not.toBeInTheDocument();
      expect(screen.queryByText(SUMMARY.CARD_STOPS)).not.toBeInTheDocument();
      // e nenhum "Sem dados" sobra na tela
      expect(screen.queryByText(NO_DATA)).not.toBeInTheDocument();
    } finally {
      summary.city = "Rio de Janeiro";
      summary.lastStop = "38";
    }
  });
});
