# Contexto do Projeto: Roteirizador (Pré-Rota)

> PWA client-side que lê um romaneio de entregas (XLSX/CSV) — **multi-rota** (agrupado por `Corridor Cage`) ou **rota única** (planilha sem essa coluna) — e o transforma em duas coisas: o **modo Original** (visualização: mapa Leaflet com marcadores SVG por parada + painel inferior persistente + tabelas/sumário) e o **modo Meu roteiro** (construção de rota a pé sobre grafo OSM local: início, paradas por raio, âncora do veículo — **em andamento**, épico RF-006). Navegação multi-tela (HOME → Rotas → Sumário → Mapa), romaneios persistidos no aparelho (IndexedDB). Mobile-first.

## ⚙️ Nota de Origem

Este `contexto-projeto-ai.md` foi criado em 22/06/26 (via TASK-DOC-001, achado REV-001-A02), retroativamente, sobre um projeto que já existia. O conteúdo reflete o **código atual** (verdade primária). Decisões consolidadas vivem em ADRs (`docs/arquitetura/ADR/`, hoje 001–009) e na primeira revisão geral (`docs/arquitetura/revisoes-gerais/REV-001.md`). Última sincronização completa: **TASK-DOC-003, 10/07/26**.

## Stack Exata

| Tecnologia | Versão | Nota |
|---|---|---|
| React | ^18.2 | |
| react-router-dom | ^7.18.1 | **BrowserRouter** desde a RF-011 (ADR-003): AppShell (abas) + FocusShell (telas de foco) |
| TypeScript | ~5.9.3 | strict; `types: ["vite/client"]` |
| Vite | ^7.2.4 | build tool + dev server |
| vite-plugin-pwa | ^1.2.0 | **é PWA** (manifest + service worker `autoUpdate` — atualização pega na 2ª recarga) |
| Tailwind CSS | ^3.4.13 | base do design system; tokens em `src/styles/theme.css` |
| shadcn/ui | — | **biblioteca de UI padrão** (Radix + `cva` + `cn`); componentes em `src/components/ui/`. Ver **[ADR-004](./arquitetura/ADR/ADR-004.md)** |
| vaul | ^1.1.2 | bottom sheet do `MapPanel` (painel persistente do mapa, RF-023) — único módulo que o importa é `MapPanel.tsx` |
| Leaflet | ^1.9.4 | mapa (`preferCanvas`, REF-015); tiles via Cloudflare Worker proxy (ADR-007) |
| react-leaflet | ^4.2.1 | uso pontual; o mapa principal usa Leaflet direto em `RouteMap` |
| idb | ^8.0.3 | IndexedDB: romaneios (`manifestStorage`) e cache do grafo OSM (`graphCache`); `routeStorage` chega com a RF-008 |
| lucide-react | ^1.21.0 | ícones (padrão do shadcn) |
| react-select | ^5.10.2 | dependência presente (uso pontual) |
| xlsx (SheetJS) | **0.20.3 via CDN** | tarball `cdn.sheetjs.com` (npm só tem 0.18.5 vulnerável) — ver REV-001-A07 |
| danfojs | ^1.2.0 | **só** nos experimentos `__utilidades-back-office__`; não entra no bundle. `overrides` força seu xlsx interno p/ 0.20.3 |
| Vitest | ^4.1.9 | testes (+ `fake-indexeddb` p/ os serviços de IndexedDB) |
| @testing-library/react | ^16.3.0 | testes de componente |
| ESLint 9 + Prettier | — | `npm run lint` |
| wrangler | via `npx` | **deliberadamente fora das deps** — só p/ o deploy de testes (`npm run deploy:test`, TASK-CHORE-005) |

## Estrutura Real de Pastas

```
src/
├── pages/        # HomePage (upload) · RoutesPage (salvos) · SummaryPage (foco) · MapPage (foco; dona do estado do mapa/painel/builder)
├── components/   # componentes de domínio + subpastas:
│   ├── ui/           # shadcn (button, badge, card, dialog, input, progress futuro)
│   ├── shell/        # AppShell (abas Início/Rotas) + FocusShell (voltar no header)
│   ├── map/          # MapModeToggle + panel/ (MapPanel/vaul, PanelSection, PanelTitle, StopItem*, Roteiro*Section, panelSizing)
│   ├── manifests/    # ManifestCard, RouteChip (aba Rotas)
│   └── summary/      # blocos do Sumário
├── hooks/        # useRouteUploader, useManifestFromUrl, useRouteBuilder, useRoadGraph, useRouteSummary, useTheme
├── services/     # IO/persistência: manifestStorage (romaneios, dedup SHA-256), graphCache (grafo OSM offline), themeService
├── utils/        # lógica pura: excelProcessor, coordinates, formatters, inferLocationType, escapeHtml, hash, validators, …
│   ├── routing/      # motor RF-005/006: graph/aStar/minHeap/osm/match/geo/streets + builder (reducer) + selectors/walkOrder/vehicleStop/estimates/pedestrian/suggestion/points
│   └── markers/      # marcadores SVG (ADR-008): markerSvg/markerIcon(+cache)/markerScale/markerColors + view-models (markerModels, roteiroModels, panelModels, stopGrouping)
├── constants/    # uiLabels (UI_LABELS), index (COLUMN_NAMES, MAP_CONFIG, FOCUS/ADDRESS_MAX_ZOOM…), keywords, exampleData
├── types/        # tipos compartilhados (RowData, RoutesMap, routing: DeliveryPoint/RouteStop/PlannedRoute…)
├── data/         # JSON estático (CEP→bairro)
├── lib/          # cn() (shadcn)
├── styles/       # CSS global + theme.css (tokens — personalizar = editar SÓ este arquivo)
└── __tests__/    # espelha src/ (63 arquivos, 639 testes em 10/07/26)
```

`__utilidades-back-office__/` (fora de `src/`) são scripts/experimentos de apoio rodados via `ts-node`, **não** parte do app. `infra/cloudflare-tile-worker/` versiona o proxy de tiles.

## Rotas (React Router 7 — ADR-003, RF-011)

| Rota | Shell | Tela |
|---|---|---|
| `/` | AppShell (abas) | HOME — só upload + instruções em spoiler |
| `/rotas` | AppShell (abas) | Romaneios salvos (cards + chips por rota, busca por AT, apagar) |
| `/sumario?romaneio&rota` | FocusShell (voltar) | Sumário da rota (botões "Ver Original"/"Criar Roteiro") |
| `/mapa?romaneio&rota[&modo=roteiro]` | FocusShell (voltar) | Mapa + MapPanel; **a URL é a fonte do modo** (deep link/F5 preservam) |
| `*` | — | redirect para `/` |

`public/_redirects` cobre o SPA no Cloudflare Pages. Pós-upload navega sozinho (rota única → Sumário; multi → `/rotas?sel=`).

## Decisões Inegociáveis

Não revisar sem ADR explícita:

- **Idioma (ADR-001):** código, identificadores e comentários em **inglês**; textos de usuário em **português**, centralizados em `UI_LABELS` (i18n-ready).
- **Estado:** `useState` + hooks de feature; **`useReducer` puro por feature** para domínio complexo (ex.: `routeBuilderReducer` do Meu roteiro — testável sem UI). Sem biblioteca de estado global (Zustand só com aprovação explícita).
- **Sem backend / sem banco remoto / sem auth:** 100% client-side; persistência local em **IndexedDB via `idb`** (romaneios, grafo OSM; roteiros com a RF-008). Dados são do aparelho.
- **Roteamento local (ADR-002):** grafo dirigido sobre dados OSM/Overpass + A* próprio — **nenhuma API de roteirização paga** (RNF-03/13). Mão única = aresta ausente; cache offline do grafo.
- **Interop dos modos (ADR-009):** `StopGroup` é exclusivo do Original; o Meu roteiro roda sobre `DeliveryPoint`/`RouteStop` com view-models próprios (`roteiroModels`); o `RouteMap` é controlado e bifurca a fonte de `MarkerModel[]` por modo.
- **Leitura de planilha:** isolada em `utils/excelProcessor.ts`. Obrigatórias só `Latitude`/`Longitude`; `Corridor Cage` ausente ⇒ **rota única** (`ProcessedResult.isSingleRoute`, rótulo "Minha rota").
- **xlsx fixado na versão da CDN (0.20.3)** — segurança.
- **Imports por alias:** `@/`, `@assets/`, `@components/`, `@utils/`.
- **UI / Design System (ADR-004):** shadcn/ui; componentizar e DRY são lei; nada de cor/classe hardcoded fora dos tokens; primitivos complexos via Radix — não reinventar.
- **Marcadores do mapa (ADR-008):** paleta funcional **travada** (verde residencial / azul comercial / cinza indefinido / badge amarelo). O Meu roteiro usa o registro neon das mesmas semânticas; infraestrutura de rota = carro sem ponta (âncora slate, **início azul**), âncora central, z abaixo dos endereços.
- **Tema (ADR-006, rev. REF-012):** **Neon Flux dark é o padrão** (verde `#00FF9D` → ciano `#00D1FF`); claro no toggle; trocar a paleta = editar só `src/styles/theme.css`.

## Convenções Específicas

- **Texto de UI nunca hardcoded** — sempre `UI_LABELS`.
- **`utils/` = lógica pura** (testável sem mock); **`services/` = IO/persistência** (IndexedDB, tema). A antiga nota "utils no lugar de services" não vale mais — as duas pastas coexistem com papéis distintos.
- **Logging de diagnóstico** atrás de `import.meta.env.DEV` e **sem PII** (TASK-BG-002).
- **HTML dinâmico** escapado via `utils/escapeHtml.ts` (TASK-BG-003); **coordenadas** validadas contra `MAP_CONFIG.RIO_BOUNDS` (TASK-BG-004).
- **⚙️ MANUAL KNOB:** valores de calibração visual/gesto são constantes nomeadas e comentadas com esse marcador (ex.: `FOCUS_ZOOM_OFFSET`, `COLLAPSED_MAX_FRACTION`, `FLICK_VELOCITY_PX_MS`, `ROTEIRO_PANEL_SIZING`) — calibrar = editar a constante, nunca espalhar números.
- **Smoke no aparelho é gate de UI:** suíte verde não prova conforto visual/gesto (lição das RF-006.4.19/.4.20). Deploy de testes: `npm run deploy:test` → `https://pre-rota-teste.pages.dev` (recarregar 2×).
- Testes espelham `src/` em `__tests__/`; serviços de IndexedDB testam com `fake-indexeddb`.

## O Que Este Projeto NÃO Faz (hoje)

- ❌ **Backend, banco remoto, autenticação, nuvem** — tudo local; compartilhar roteiro será por arquivo JSON (RF-013, pendente).
- ❌ **O sistema "HubFlow Logistics"** ([`docs/rascunhos/`](./rascunhos/)) é **visão futura, NÃO implementado** (REV-001-A01). Já o `fluxo-roteirizacao.md`/`fluxo-modo-original.md` (também em rascunhos/) são **specs vigentes** do que está sendo construído.
- ❌ **Execução da rota** (RF-009), **auto-roteirizar** (RF-012), **export/import de roteiro** (RF-013) e **persistência do roteiro** (RF-008) — pendentes; o botão "Importar roteiro (.json)" da HOME é stub.
- ❌ **Estimativa configurável de tempo** (RF-007) — hoje só a estimativa grosseira a pé por parada (`stopWalkEstimate`).
- ❌ **Não usa biblioteca de formulários**; i18n **não está ativa** (só PT, camada pronta); experimentos `danfojs` desligados do app.
- ✅ **É PWA** (instalável, service worker) — tiles via Cloudflare Worker (proxy + cache + bloqueio de zoom < 14), em [`infra/cloudflare-tile-worker/`](../infra/cloudflare-tile-worker/).
- ✅ **Deploy de TESTES no Cloudflare Pages** (TASK-CHORE-005, 10/07/26): `npm run deploy:test` publica em **https://pre-rota-teste.pages.dev** — URL fixa p/ smokes no celular (HTTPS → GPS/PWA funcionam; recarregar **2×** p/ o SW `autoUpdate` assumir). ⚠️ **É ambiente de teste, NÃO o lançamento**: URL não divulgada, `X-Robots-Tag: noindex` via `public/_headers` (remover esse arquivo quando existir deploy de produção — outra decisão). Mesma conta Cloudflare do tile worker. Instruções em [`docs/README.md`](./README.md) §"Testar no celular".

## Documentação de Referência

- **Requisitos (RF/RN/RNF):** [`docs/requisitos/`](./requisitos/)
- **Specs do roteirizador:** [`docs/rascunhos/fluxo-roteirizacao.md`](./rascunhos/fluxo-roteirizacao.md) e [`fluxo-modo-original.md`](./rascunhos/fluxo-modo-original.md) (vigentes) · [`docs/design/arvore-componentes-mapa.md`](./design/arvore-componentes-mapa.md) (árvore do MapPanel, matriz modo×slot)
- **README (humanos):** [`docs/README.md`](./README.md) · **Boas práticas:** [`docs/BOAS_PRATICAS.md`](./BOAS_PRATICAS.md) · **Análise comercial:** [`docs/analise-comercial.md`](./analise-comercial.md)
- **Infraestrutura e custos:** [`docs/plano-infraestrutura-e-custos.md`](./plano-infraestrutura-e-custos.md) — base **quantitativa** (preços datados + câmbio declarado, 20/07/26): cenários serverless × VPS, break-even do R$5 e as correções pendentes nos docs comerciais
- **ADRs 001–009:** [`docs/arquitetura/ADR/`](./arquitetura/ADR/) — idioma/i18n · roteamento OSM local · app shell/router · shadcn · remoção Correios · identidade visual (rev. Neon Flux) · basemap/tiles · marcadores SVG · interop dos modos
- **Revisões gerais:** [`REV-001.md`](./arquitetura/revisoes-gerais/REV-001.md) · **Dívida técnica:** [`docs/dominios/divida-tecnica.md`](./dominios/divida-tecnica.md)
- **Tarefas:** [`docs/tarefas/`](./tarefas/) — a **fila recomendada** vive no topo de `pendentes.md`; histórico em `concluidas/0-indice-concluidas.md`

## Hierarquia de Regras

1. **Este arquivo** (`contexto-projeto-ai.md`) vence quase sempre.
2. **Núcleo do pacote** (`.github/agents/geral-robusto/01-nucleo.md`) vence nas **3 exceções inegociáveis**: confirmação antes de ações destrutivas; proibição de `any` sem justificativa; "código é a verdade primária".
3. **Demais módulos** do pacote (carregados por Skill/intenção — ver `CLAUDE.md`).

## Estado Atual do Projeto

- **Fase:** visualizador (modo Original) **estável e polido**; **Meu roteiro em construção** — épico RF-006 com `.1 → .4.27` concluídas (entrar no modo, início por GPS/toque/endereço, grafo OSM lazy, criar/editar parada por raio + adição por toque, zoom por contexto, painel por modo); restam `.5` (gestos da âncora), `.6` (edição plena), `.7` (traçado), `.8` (visão geral), `.9` (geocoding da âncora).
- **Fila:** `REF-016 (espaçamento) → RF-008 (persistência do roteiro) → TEST-003 → RF-006.8 → .5 → .6 → .7 → RF-007 → RF-009 → RF-012 → RF-013` — detalhe no topo de [`pendentes.md`](./tarefas/pendentes.md).
- **Testes:** **639/639** em 63 arquivos (10/07/26); gates por tarefa: `tsc --noEmit` + `eslint` + `vitest` + `build`, rotulados no registro.
- **Segurança:** última checagem (24/06) `npm audit` = 1 low (esbuild dev-server, fixado pela faixa do Vite).
- **Dívida técnica:** [`docs/dominios/divida-tecnica.md`](./dominios/divida-tecnica.md) (DT-001 TWA, DT-002 billing × sem-backend).

## Última Atualização

- **Data:** 10/07/26
- **Por:** **TASK-DOC-003** — sincronização completa com o código (router/shells, `services/`, `utils/routing|markers`, épico RF-006, ADRs 002–009, tema Neon Flux, vaul/idb/lucide, deploy de testes, contagem real de testes, `docs/design/` e `divida-tecnica.md` existentes, nota `.md.md` removida). Anterior: nota do deploy de testes (CHORE-005, 10/07) e TASK-DOC-004 (24/06).
- **Próxima revisão sugerida:** ao concluir a **RF-008** (persistência do roteiro — muda "o que o app guarda") ou a **RF-009** (execução — muda a proposta do produto), ou em ~2 meses.
