# Requisitos Não-Funcionais (RNF)

> Com que qualidade o sistema opera. IDs `RNF-NN`. Categoria + métrica/alvo quando aplicável. Extraídos do código atual. Formato em `.github/agents/geral-robusto/templates/38-requisitos.md`.
>
> Status: ✅ Implementado · 🟡 Parcial · 🔭 Planejado · 🚫 Descartado.

## Estado Atual (implementado)

| ID | Requisito | Categoria | Métrica / Alvo | Status | Origem | Tarefas / ADR |
|---|---|:---:|---|:---:|---|---|
| RNF-01 | O app é instalável e o **shell** carrega offline | PWA/Offline | service worker `autoUpdate`; precache de `**/*.{js,css,html,png,svg,ico,json}` | ✅ | `vite.config.ts`, `public/manifest.json` | - |
| RNF-02 | O app é 100% client-side: sem backend, banco ou autenticação | Arquitetura | zero servidor próprio | ✅ | `App.tsx`; decisão inegociável (`contexto-projeto-ai.md`) | - |
| RNF-03 | Nenhuma API paga em produção (roteamento local sobre OSM) | Custo | sem serviço de roteirização pago | ✅ | ADR-002 | - |
| RNF-04 | Texto de usuário é localizável: código em inglês, UI em português via `UI_LABELS` | i18n | nenhuma string de UI hardcoded em componente | ✅ | `constants/uiLabels.ts`, ADR-001 | TASK-REF-001, TASK-REF-004 |
| RNF-05 | Privacidade: diagnóstico só em DEV e sem PII; orientação de não compartilhar dados | Privacidade | console nunca registra valores de célula | ✅ | `utils/excelProcessor.ts`, `constants` (`UPLOAD_INSTRUCTIONS`) | TASK-BG-002 |
| RNF-06 | HTML dinâmico é escapado (anti-XSS) | Segurança | tooltip do mapa sanitizado | ✅ | `utils/escapeHtml.ts` | TASK-BG-003 |
| RNF-07 | Dependência `xlsx` fixada na 0.20.3 (CDN); `overrides` propaga ao danfojs | Segurança | `npm audit` sem vuln de xlsx | ✅ | `package.json` | TASK-CHORE-001 |
| RNF-08 | UI acessível via primitivos Radix (foco, teclado, Escape) | Acessibilidade | modais com focus-trap | ✅ | `components/ui/`, ADR-004 | TASK-REF-006 |
| RNF-09 | Design system shadcn/ui + tokens Tailwind; componentizar e DRY | Manutenibilidade | sem classe hardcoded fora dos tokens | ✅ | `components/ui/`, `tailwind.config.js`, ADR-004 | TASK-REF-006 |
| RNF-10 | Upload limitado a 10 MB; cache do SW até 5 MB por arquivo | Robustez | `FILE_CONFIG.MAX_FILE_SIZE`; `maximumFileSizeToCacheInBytes` | ✅ | `constants/index.ts`, `vite.config.ts` | - |
| RNF-11 | Build com code splitting (chunk `vendor`) para conter o tamanho | Desempenho | `chunkSizeWarningLimit` 500 kB | ✅ | `vite.config.ts` | - |
| RNF-12 | Os tiles do mapa vêm de um proxy **Cloudflare Worker** com cache e economia de zoom | Desempenho/Custo | cache 7 dias (Cache API `tile-cache-v1` + edge CF `cacheTtl`); **zoom < 14 bloqueado** (403); CORS | ✅ | `infra/cloudflare-tile-worker/worker.js`; consumido por `components/RouteMap.tsx` | - |

## Pendente de Validação

- (nada pendente — RNF-01/RNF-12 esclarecidos pelo humano em 24/06: shell via PWA SW; tiles via Cloudflare Worker, agora versionado em `infra/`)

## Planejados (🔭) — Roteirizador a pé

> Derivados de ADR-002/003, `fluxo-roteirizacao.md`, `analise-comercial-2.0.md` e `docs/dominios/divida-tecnica.md` (DT-001/002).

| ID | Requisito | Categoria | Métrica / Alvo | Status | Origem | Tarefas / ADR |
|---|---|:---:|---|:---:|---|---|
| RNF-13 | Roteamento local sobre grafo OSM, **sem API de roteirização paga** | Custo/Arquitetura | custo recorrente ~zero | 🔭 | ADR-002 | TASK-RF-005 |
| RNF-14 | Grafo OSM **cacheável offline** (IndexedDB) para o PWA | PWA/Offline | 2ª abertura da área não rebaixa do Overpass | 🔭 | ADR-002 | TASK-RF-005.3 |
| RNF-15 | A* com performance aceitável no navegador | Desempenho | <~150 ms por rota em bairro | 🔭 | fluxo §6 | TASK-RF-005.4 |
| RNF-16 | Empacotamento **TWA** (Android-first) para a Play Store | Distribuição | AAB/APK instalável (já somos PWA ✅) | 🔭 | analise-comercial §10.2 | DT-001 |
| RNF-17 | Cobrança via **Play Billing**; *entitlement* client-side no MVP | Monetização | sem backend no MVP; validação segura = ADR futura | 🔭 | analise-comercial §10.4/10.5 | DT-002 |
| RNF-18 | Vocabulário único em `UI_LABELS` (i18n): Parada · Endereço · Pacote · **Parada do veículo** · **Romaneio (Único/Multi)** · **Roteiro** | i18n | nenhum termo de domínio hardcoded | 🔭 | fluxo §2/§15 | TASK-RF-006 |
| RNF-19 | Estado da construção via `useReducer` dedicado (não componentão) | Manutenibilidade | reducer puro testável | 🔭 | draft §6 | TASK-RF-006.1 |
| RNF-20 | LGPD/consentimento: endereços de terceiros no romaneio; consentimento de anúncios (Google UMP) | Privacidade | tela de consentimento antes do anúncio | 🔭 | analise-comercial §9/§10.6 | DT-002 |
| RNF-21 | UI mínima sobre o mapa (overlay enxuto, mapa dominante) | UX | painéis compactos/colapsáveis | 🔭 | fluxo §15.4 | TASK-RF-006, TASK-RF-014 |
