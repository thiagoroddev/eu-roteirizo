# Contexto do Projeto: Roteirizador (Pré-Rota)

> PWA que lê um romaneio de entregas (XLSX/CSV) e visualiza as rotas num mapa Leaflet + tabelas, com seleção de rota, busca por código AT, resumo estatístico, status de entrega dos Correios e inferência de tipo de local (comercial/residencial).
> Web app (PWA instalável), client-side, foco em desktop com adaptação mobile.

## ⚙️ Nota de Origem

Este `contexto-projeto-ai.md` foi criado em 22/06/26 (via TASK-DOC-001, achado REV-001-A02), retroativamente, sobre um projeto que já existia. O conteúdo reflete o **código atual** (verdade primária). Pontos de decisão consolidados nesta fase estão em ADRs (`docs/arquitetura/ADR/`) e na primeira revisão geral (`docs/arquitetura/revisoes-gerais/REV-001.md`).

## Stack Exata

| Tecnologia | Versão | Nota |
|---|---|---|
| React | 18.2 | sem router (SPA de página única) |
| TypeScript | ~5.9.3 | strict; `types: ["vite/client"]` |
| Vite | ^7.2.4 | build tool + dev server |
| vite-plugin-pwa | ^1.2.0 | **é PWA** (manifest + service worker `autoUpdate`) |
| Tailwind CSS | ^3.4.13 | utility puro (sem shadcn); token `primary` |
| Leaflet | ^1.9.4 | mapa; tiles via Cloudflare Worker proxy |
| react-leaflet | ^4.2.1 | (uso pontual; o mapa principal usa Leaflet direto em `RouteMap`) |
| react-select | ^5.10.2 | dependência presente |
| xlsx (SheetJS) | **0.20.3 via CDN** | tarball `cdn.sheetjs.com` (npm só tem 0.18.5 vulnerável) — ver ADR de segurança em REV-001-A07 |
| danfojs | ^1.2.0 | **só** nos experimentos `__utilidades-back-office__`; não entra no bundle. `overrides` força seu xlsx interno p/ 0.20.3 |
| Vitest | ^4.1.9 | testes |
| @testing-library/react | ^16.3.0 | testes de componente |
| ESLint 9 + Prettier | — | `npm run lint` |

## Estrutura Real de Pastas

⚠️ **Diverge do padrão do pacote `.agent/`** em alguns pontos (sem ADR formal de estrutura; divergências aceitas).

```
src/
├── components/   # componentes (sem subpasta ui/ genérica)
├── pages/        # RouteViewer (única página, orquestra o fluxo)
├── hooks/        # useRouteUploader, useRouteSearch, useRouteSummary
├── utils/        # ❗ lógica pura/serviços (no lugar de services/): excelProcessor, correiosDelivery, formatters, inferLocationType, coordinates, escapeHtml, validators, map, mapIcons, iconPicker, safeGetData
├── constants/    # uiLabels (UI_LABELS), index (COLUMN_NAMES, MAP_CONFIG, ...), keywords, exampleData
├── types/        # tipos compartilhados (RowData, RoutesMap, ...)
├── data/         # ❗ JSON estático (CEPs sem entrega domiciliar dos Correios)
├── assets/       # ícones de marcador (PNG)
├── styles/       # CSS global
└── __tests__/    # espelha src/ (components, hooks, utils, constants, pages)
```

`__utilidades-back-office__/` (fora de `src/`) são scripts/experimentos de apoio (consulta Correios, extração de complementos) rodados via `ts-node`, **não** parte do app.

## Rotas

**N/A — aplicação de página única, sem roteamento.** `App.tsx` renderiza `RouteViewer` diretamente (há um exemplo de React Router comentado em `App.tsx`, não usado). Todo o fluxo acontece dentro de `RouteViewer` com estado local + modais.

## Decisões Inegociáveis

Não revisar sem ADR explícita:

- **Idioma:** código, identificadores e comentários em **inglês**; textos de usuário em **português**, centralizados em `src/constants/uiLabels.ts` (`UI_LABELS`), estruturados para i18n. Decisão formal em **[ADR-001](./arquitetura/ADR/ADR-001.md)**.
- **Estado:** `useState` + hooks de feature (`use*`). Sem biblioteca de estado global.
- **Sem backend / sem banco / sem auth:** app é 100% client-side. Dados vêm do arquivo que o usuário sobe.
- **Leitura de planilha:** isolada em `utils/excelProcessor.ts` (usa `xlsx` direto).
- **Correios:** lookup de JSON estático (`src/data/`) em `utils/correiosDelivery.ts` — não há chamada HTTP em produção.
- **xlsx fixado na versão da CDN (0.20.3):** segurança (npm só tem a 0.18.5 vulnerável). `overrides` propaga p/ o xlsx interno do danfojs.
- **Imports por alias:** `@/`, `@assets/`, `@components/`, `@utils/` (em `tsconfig.app.json` + `vite.config.ts`).

## Convenções Específicas

- **Texto de UI nunca hardcoded** — sempre via `UI_LABELS` (i18n-ready).
- **Logging de diagnóstico** atrás de `import.meta.env.DEV` e **sem PII** (sem valores de células/endereços) — ver TASK-BG-002.
- **HTML dinâmico** (ex.: tooltip do mapa) sempre escapado via `utils/escapeHtml.ts` — ver TASK-BG-003.
- **Coordenadas** validadas contra `MAP_CONFIG.RIO_BOUNDS` (`utils/coordinates.ts`) antes de virar marcador — ver TASK-BG-004.
- `utils/` no lugar de `services/`; `data/` para constantes/JSON estático.

## O Que Este Projeto NÃO Faz

- ❌ **Não tem backend, banco de dados nem autenticação.** É um visualizador client-side.
- ❌ **O sistema "HubFlow Logistics"** (Next.js, Prisma, Supabase, fila virtual, marketplace, 25 RFs) descrito em **[`docs/rascunhos/`](./rascunhos/)** é **visão/roadmap futuro, NÃO implementado**. Não tratar como spec do estado atual (ver REV-001-A01).
- ❌ **Não usa biblioteca de formulários** (react-hook-form/Zod). A única entrada é upload de arquivo.
- ❌ **i18n não está ativa** — só português hoje, mas a camada `UI_LABELS` permite adicionar idiomas sem tocar componentes (ADR-001).
- ❌ **Os experimentos `danfojs`** (`__utilidades-back-office__/DanfoTest*.tsx`) **não estão ligados** ao app.
- ✅ **É PWA** (instalável, service worker) — ao contrário de muitos visualizadores simples.

## Documentação de Referência

Existentes neste repo:

- **README (humanos):** [`docs/README.md`](./README.md)
- **Código comentado / fluxo real:** [`docs/CODIGO_COMENTADO.md`](./CODIGO_COMENTADO.md)
- **Boas práticas do projeto:** [`docs/BOAS_PRATICAS.md`](./BOAS_PRATICAS.md)
- **Análise comercial:** [`docs/analise-comercial.md`](./analise-comercial.md)
- **ADRs:** [`docs/arquitetura/ADR/`](./arquitetura/ADR/) (ADR-001 — idioma/i18n)
- **Revisões gerais:** [`docs/arquitetura/revisoes-gerais/REV-001.md`](./arquitetura/revisoes-gerais/REV-001.md)
- **Tarefas:** [`docs/tarefas/`](./tarefas/) (pendentes / em-andamento / concluidas)
- **Rascunhos (visão futura):** [`docs/rascunhos/`](./rascunhos/)

> Ainda **não existem** `docs/requisitos/`, `docs/dominios/` nem `docs/design/` — criar quando houver necessidade real.

## Hierarquia de Regras

Quando duas fontes discordam:

1. **Este arquivo** (`contexto-projeto-ai.md`) vence quase sempre.
2. **Núcleo do pacote** (`.github/agents/geral-robusto/01-nucleo.md`) vence nas **3 exceções inegociáveis**: confirmação antes de ações destrutivas; proibição de `any` sem justificativa; "código é a verdade primária".
3. **Demais módulos** do pacote.

Nota: o pacote do agente vive em `.github/agents/geral-robusto/` (arquivos com extensão `.md.md`), não em `.agent/`.

## Estado Atual do Projeto

- **Fase:** MVP funcional de visualização de rotas.
- **Maturidade:** estável no fluxo principal (upload → seleção → mapa/tabelas).
- **Testes:** 235 passando (Vitest); cobertura boa em utils/hooks; integração do `RouteViewer` coberta.
- **Segurança:** `npm audit` = 1 low (esbuild dev-server, fixado pela faixa do Vite); demais resolvidas nesta sessão.
- **Dívidas técnicas:** sem `docs/dominios/divida-tecnica.md` ainda; itens conhecidos rastreados via REV-001.

## Última Atualização

- **Data:** 22/06/26
- **Por:** TASK-DOC-001 (origem REV-001-A02), consolidando a primeira revisão geral e a ADR-001.
- **Próxima revisão sugerida:** ao mudar a stack (versão major / lib nova), ao implementar qualquer parte da visão "HubFlow", ou em ~3 meses.
