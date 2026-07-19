# Tarefas Em Andamento

> Cada tarefa Standard/Strict em execução vive aqui como **um bloco** (cabeçalho + log contínuo com timestamps), enquanto está sendo feita. Ao iniciar, a tarefa **sai de `pendentes.md`**; ao concluir, vira arquivo próprio em `concluidas/` e **sai daqui**.
>
> **Máximo 3 em andamento ao mesmo tempo.** Rodar testes antes e depois de cada tarefa. Datas no formato `DD/MM/AA HH:MM`.

---


# TASK-RF-007.2 - Config de entrega (global, no ⚙️) + regra de tempo por tipo/complemento

- **Status:** EM DESENVOLVIMENTO
- **Modo:** Standard
- **Valor:** Importante (diferencial — tempo realista configurável)
- **Urgência:** IMEDIATA
- **Esforço-H/IA:** G/G
- **Data-hora origem:** 22/06/26 (RF-007) · re-especificada 19/07/26
- **Data-hora início:** 19/07/26
- **Dependências:** RF-007.1 ✅ (motor/config)
- **REQ/ADR/DT:** RF-39; `fluxo-roteirizacao.md` §8 (tela 10)

## Planejamento Aprovado

Plano aprovado (AskUserQuestion "Global" + "ok pode seguir"). **Só tempo-base e adicional por pacote são configuráveis pelo usuário; velocidade a pé/veículo ficam como defaults de código.** Config é **global** (preferência do usuário, vale p/ todas as rotas).

**Regra de tempo de entrega (refinada pelo humano 19/07):** unidade = "entrega" (tempo-base); extras na mesma entrega = +adicional.
- **Residencial/indefinido:** todos os pacotes no **mesmo endereço** = 1 entrega (complemento ignorado) → base + (n−1)×adicional.
- **Comercial:** agrupa por **complemento** — cada complemento comercial distinto = 1 entrega; adicional só quando 2+ comerciais têm o **mesmo** complemento.
- Tipos diferentes no mesmo endereço = entregas separadas.
- Fórmula: `deliveryUnitKey(row) = isComercial ? "com:"+normalizeComplement(complemento) : "res"`; `pointDeliverySeconds = distinctKeys×base + (packageCount − distinctKeys)×extra`.

**O que muda:**
1. **Util neutro de complemento** (`utils/complement.ts`): `rowComplement` (movido de `markerModels`), `normalizeComplement`, `sameComplement`; markers delegam (DRY). *(pedido do humano: criar o "são iguais" reusável.)*
2. **Cálculo** (`estimates.ts`): `deliveryUnitKey`/`pointDeliverySeconds` (usa `resolveLocationType` neutro + complemento); `stopWalkEstimate` passa a usá-lo. Testes dos casos.
3. **Global settings** (`services/deliverySettings.ts`, localStorage, espelha `themeService`): `{ deliveryBaseSeconds, deliveryPerPackageSeconds }`, default do `DEFAULT_ROUTING_CONFIG`. Semear no config (MapPage `useRouteBuilder`, override no HYDRATE/getRoteiro, SummaryPage).
4. **`SET_CONFIG`** no reducer (só os 2 campos de entrega).
5. **UI no ⚙️**: habilitar o `Settings` do `AppHeader` (hoje `disabled`, reservado p/ RF-007) → `Dialog` "Configurações de entrega" com 2 campos; salvar = `saveDeliverySettings` + `SET_CONFIG` na rota ativa. Em HOME/Rotas (sem rota) só edita o global.

**Aceite:** usuário edita base/adicional no ⚙️; vale p/ todas as rotas; a regra por tipo/complemento bate com os 4 casos; velocidade a pé/veículo continuam só em código; gates verdes + smoke.
**Impacto:** `utils/complement`, `markerModels`, `estimates`, `services/deliverySettings`, `builder` (reducer), `MapPage`, `SummaryPage`, `AppHeader` + `uiLabels` + testes. **Riscos:** seed do global no config (vários pontos de entrada). **Dependências novas:** nenhuma.

## Execução

- 19/07 —:—: Plano aprovado (global + regra por tipo/complemento). Task movida para em-andamento. Baseline: 723 verdes (sessão).
- 19/07 —:—: `utils/complement.ts` novo — `rowComplement` (movido de `markerModels`, que passa a delegar), `normalizeComplement`, `sameComplement`. `estimates.ts` — `deliveryUnitKey`/`pointDeliverySeconds` (comercial por complemento, residencial/indefinido por endereço; usa `resolveLocationType` neutro + `ICON_KEYS`); `stopWalkEstimate` usa `pointDeliverySeconds`.
- 19/07 —:—: `services/deliverySettings.ts` (localStorage, espelha `themeService`). **Decisão de arquitetura:** em vez de semear o `route.config` em vários pontos, criei um **`DeliverySettingsContext`** (App root) e as estimativas do MapPage/Summary aplicam o merge no ato (`estimateConfig = {...builderState.config, ...deliverySettings}`), evitando `SET_CONFIG`/HYDRATE-override e mantendo o `route.config` inalterado. Context tem valor DEFAULT (pages funcionam sem provider nos testes).
- 19/07 —:—: `AppHeader` — gear habilitado (era `disabled`, reservado p/ RF-007) → `DeliverySettingsDialog` (2 campos, inputs **não-controlados** com `defaultValue`+refs — Radix remonta ao abrir, sem effect/setState). `MapPage` (5 chamadas de estimativa + 2 memos) e `SummaryPage` passam a usar o delivery global. `uiLabels` +`DELIVERY_SETTINGS` (SETTINGS_ARIA sem "em breve").
- 19/07 —:—: Achados de lint/teste: `localStorage` do runtime é stub do Node (mock com Map no teste, como `themeService.test`); `set-state-in-effect` evitado com inputs não-controlados; `react-refresh` do context com disable pontual justificado; `AppShell.test` atualizado (gear abre o dialog em vez de `disabled`).

## Testes

- 1º baseline (sessão): **723 verdes**.
- `npx tsc --noEmit`: **APROVADO** (exit 0).
- `npm run lint`: **APROVADO** (exit 0).
- `npm run build`: **APROVADO** (exit 0).
- Novos testes: `estimates.test` (+4 `pointDeliverySeconds`, os 4 casos), `complement.test` (novo, 3), `deliverySettings.test` (novo, 3), `AppShell.test` (gear abre o dialog).
- Último `npm run test`: **733 verdes**.

- 19/07 —:—: **Smoke: funcionando.** Ajuste de unidades/defaults (pedido): tempo-base **em minutos** (default **2 min** = `deliveryBaseSeconds: 120`), adicional **em segundos** (default **30 s**). Dialog: campo base em minutos (`/60` no display, `×60` ao salvar, `MINUTES`), adicional segue em segundos. Testes símbólicos (usam os valores do config) — sem quebra. Gates verdes (733).

## Bug encontrado e corrigido (bloqueava o smoke)

- 19/07 —:—: **Smoke: os dialogs não apareciam** (overlay escurecia só o header, conteúdo invisível). Também afetava "Incorporar em outra parada" e os popups Duração/Distância da RF-006.20 → é do `Dialog` compartilhado (`ui/dialog.tsx`), não da RF-007.2. **Causa:** overlay/content em `z-50`, mas o painel vaul é `z-[1200]`, toast/toggle `z-[1100]`, Leaflet ~1000 → o content renderizava ATRÁS do mapa/painel. **Fix:** `Dialog` overlay+content → **`z-[1300]`** (acima de tudo). Corrige todos os dialogs sobre o mapa. Registrar como **TASK-BG** na conclusão. Gates re-verdes (733).

## Pendente (não-código)

- **Smoke no aparelho:** ⚙️ abre, edita, recalcula ao vivo; valor persiste entre rotas/sessões.

---

O histórico das tarefas concluídas vive em [`concluidas/`](./concluidas/) (uma linha por tarefa em [`0-indice-concluidas.md`](./concluidas/0-indice-concluidas.md)). O backlog do que falta vive em [`pendentes.md`](./pendentes.md).

---

<!-- Modelo de bloco (template completo em .github/agents/geral-robusto/templates/30-task-em-andamento.md):

# TASK-PREFIXO-XXX - Título

- **Status:** EM DESENVOLVIMENTO
- **Modo:** Standard
- **Valor:** Crítico
- **Urgência:** Normal
- **Esforço-H/IA:** G/G
- **Data-hora origem:** DD/MM/AA HH:MM
- **Data-hora início:** DD/MM/AA HH:MM
- **Dependências:** -
- **REQ/ADR/DT:** -

## Planejamento Aprovado
[plano que o humano aprovou]

## Execução
- HH:MM: Plano aprovado
- HH:MM: ...

## Testes
- 1º npm run test: NN verdes
-->
