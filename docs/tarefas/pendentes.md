# Tarefas Pendentes

> Backlog priorizado. Cada tarefa entra como **uma única linha** (urgência Normal) ou **bloco em lista** (urgência Imediata). Sem detalhes de implementação — o plano nasce só quando a tarefa vira "Em Andamento".
>
> Ordenação: por **prioridade combinada** (Valor + Urgência), maior no topo. Em empate, menor esforço primeiro. Não ordenar por data.
>
> Histórico das concluídas: [`concluidas/0-indice-concluidas.md`](./concluidas/0-indice-concluidas.md).

---

## 🎯 Ordem de execução recomendada (rev. 10/07/26, pós-smoke no aparelho)

| # | Tarefa | Por que agora |
|---|---|---|
| 1 | ~~**TASK-RF-006.4.23**~~ — adicionar endereço na edição | ✅ **CONCLUÍDA (10/07)** — ver índice. Smoke pendente no aparelho. |
| 2 | ~~**TASK-REF-015**~~ — lentidão do mapa | ✅ **CONCLUÍDA (10/07), smoke APROVADO** ("melhorou, mais suave"). Passo (e) engavetado a menos que a lentidão volte em romaneios maiores. |
| 3 | ~~**TASK-REF-016**~~ — espaçamento do painel | ✅ **CONCLUÍDA (10/07)** — respiro canônico no `PanelSection` (pb-1 + shrink-0), card do raio compacto, compensações locais removidas. Smoke pendente (já publicada na URL de testes). |
| 4 | ~~**TASK-RF-008**~~ — persistência/auto-save | ✅ **CONCLUÍDA (10/07)** — roteiro sobrevive a sair/fechar/alternar; chip acende; Sumário adapta + totais; cascata no apagar. RF-33/35/RN-21 ✅. Smoke pendente (publicada). |
| 5 | ~~**TASK-TEST-003**~~ — zoom real do Leaflet | ✅ **CONCLUÍDA (10/07)** — o `MapPage.integration.test` virou o contrato de zoom real (8 cenários, 660/660); defeitos .4.19/.4.20 reintroduzidos por mutação derrubam a rede. A RF-006.8 pode mexer no painel com rede armada. |
| 6 | ~~**TASK-RF-006.8**~~ — painel de visão geral | ✅ **CONCLUÍDA (12/07)** — painel ocioso = visão geral (progresso + confirmadas + sugestão em sequência com CTA); cabeçalho conciso em todos os contextos (painel colapsado mais baixo); `PanelView` "overview". 670/670; **smoke pendente** (publicada). Desbloqueia a **REF-017** (compartilha o `RouteProgressCard`). |
| 7 | ~~**TASK-RF-006.5**~~ → ~~**.6**~~ → ~~**.7**~~ | `.5`/`.6`/**`.7`** ✅ **CONCLUÍDAS (15–17/07)** — âncora, ordem derivada, e o **traçado** (rota do veículo pela rua + circuito a pé + km real; **RF-29 fechado**; o retoque dos totais reais nos cards da `.8` já entrou junto). Série de smoke da **parada do veículo** ✅ **.15/.16/.17/.18** + **.19** (modo edição interativo: carro pegável + endereços da parada selecionáveis) — **.19 clicável CONFIRMADO no aparelho (L-9)**. ✅ **Smoke do TRAÇADO DESBLOQUEADO**: a **TASK-BG-006** (wedge do `useRoadGraph` prendia o grafo em "loading") foi **concluída (18/07, smoke no aparelho OK)** — traçado/sugestão seguem as ruas. |
| 8 | ~~**RF-007 (.1+.2) · RF-006.20 · RF-006.21 · RF-006.10 · BG-007 · REF-017**~~ → **RF-006.9** → **RF-009** → **RF-012** → **RF-013** | **Melhoria do painel + tempo de entrega (pedido 18/07) — CONCLUÍDA (18–19/07, smokes L-9):** `RF-007.1` (motor de tempo realista) + `RF-007.2` (config GLOBAL no ⚙️: base em min/adicional em seg; regra por tipo+complemento) + `RF-006.20` (cards PARADAS/Duração/Distância com popup + Comercial + contagem) + `RF-006.21` (Google Maps no cabeçalho) + `RF-006.10` (distância a pé por perna no gutter) + `TASK-BG-007` (z-index dos dialogs). **RF-007 fechada.** Próximas: `RF-006.9` (geocoding da âncora), depois `RF-009/012/013`. |

| 9 | ~~**TASK-REF-018**~~ — linhas agrupadas por rota (DT-007) | ✅ **CONCLUÍDA (20/07)** — `manifestStorage` v1→v2 grava linhas por rota; fast path sem SheetJS + fallback com backfill. 760/760; **smoke pendente**. |

**Backlog sem urgência, encaixar em intervalos:** `TASK-RF-006.9` (geocoding da âncora; placeholder aceitável), `TASK-DOC-005`, `TASK-DOC-006` (7 correções listadas no plano de custos), `TASK-REF-014`, `TASK-TEST-002`.

### 🔁 Onde eu posso estar errado

Adiantar a `RF-006.8` para antes da `.5`/`.6` é a única aposta real. Se a `.6` mudar o `PanelSection` de forma inesperada, parte da `.8` seria refeita. Julgo o risco baixo (a `.8` reusa `PanelTitle` e `StopItemList`, estabilizados na `.4.3`), mas a ordem conservadora seria `.5 → .6 → .7 → .8` — ao custo de conviver com o painel colapsado alto por mais três tarefas.

---

## Imediatas

> Tarefas urgentes que carregam contexto extra. Bloco em lista, no topo.
>
> **Épico: Roteirizador a pé (Nível B).** Implementação completa da visão em [`docs/rascunhos/draft-roteirizador-a-pe.md`](../rascunhos/draft-roteirizador-a-pe.md), decisão de roteamento em [`ADR-002`](../arquitetura/ADR/ADR-002.md). **Fila:** ver a tabela **"Ordem de execução recomendada"** no topo deste arquivo (rev. 10/07, pós-smoke). Resumo: `RF-006.6 → .7 → RF-007 → RF-009 → RF-012 → RF-013`. Concluídos: RF-003/004/005/011/020/021/022/023 e RF-006.1 → .4.27 (ver índice). RF-014 absorvida pela RF-022; RF-010 absorvida pela RF-006.2. Cada tarefa só vira "Em Andamento" uma por vez (núcleo §3); o plano fino nasce ali.
>
> ⚠️ **Decisões transversais (valem para o épico todo):**
> - **Estado:** `useReducer` por feature (conforme draft §6). Zustand só se a complexidade exigir — e **não instalar sem aprovação** (anti-padrão do núcleo §5).
> - **Dependências novas precisam de aprovação explícita** antes de instalar. `idb`, `fake-indexeddb` e `vaul` já instaladas. ~~`@turf/turf`~~ **descartada** (decisão 07/07: ponto-em-raio = `haversine(center, p) <= r`, já existente).
> - **Sem `any`** (núcleo §5); texto de UI sempre em `UI_LABELS` (ADR-001); arquivos novos em `src/utils/routing/` (lógica pura) e `src/services/` (IO/persistência), seguindo a convenção `utils/` do projeto.
> - **Gate de cada tarefa:** `npx tsc --noEmit` + `npm run test` verdes antes de concluir (rotular APROVADO/FALHOU/NÃO EXECUTADO).

---

<!-- TASK-RF-006.4.23 movida para em-andamento.md em 10/07/26 (plano aprovado). -->

---
<!-- TASK-REF-015 movida para em-andamento.md em 10/07/26 (plano aprovado; glow so nos destacados). -->

---

<!-- TASK-RF-008 movida para em-andamento.md em 10/07/26 (plano aprovado). -->

---

<!-- TASK-BG-006 movida para em-andamento.md em 18/07/26 (plano aprovado — "sim"; H1 confirmado no código). -->

---

<!-- TASK-REF-018 movida para em-andamento.md em 20/07/26 (plano aprovado — "planeje e execute taks-018"). -->

---

## TASK-RF-006 - UI de construção da rota (Meu roteiro) [XG, dividir]

- **Status:** Pendente (**.1 → .4.27, .5, .6, .7, .8, .11, .12, .13, .14, .15, .16, .17, .18 e .19 ✅** — ver [`0-indice-concluidas.md`](./concluidas/0-indice-concluidas.md); resta só a **.9** (geocoding da âncora) — `.6` ✅ 17/07 e `.10`/`.20`/`.21` ✅ 18–19/07 (melhoria do painel). ✅ Smoke do traçado (.7/.12) desbloqueado — **TASK-BG-006** concluída (18/07))
- **Modo:** Strict
- **Valor:** Crítico
- **Urgência:** IMEDIATA
- **Esforço-H/IA:** XG/XG
- **Data-hora origem:** 22/06/26 22:45 (**re-fatiada em 07/07/26** — o fatiamento de 22/06 antecedia âncora/vehicleStop, rascunho, "raio sugere candidatos", RF-33/salvar livre e os slots do MapPanel)
- **Dependências:** TASK-RF-004 ✅, TASK-RF-005 ✅, TASK-RF-021 ✅ (vehicleStop), TASK-RF-022/023 ✅ (slots do painel, toggle, RouteMap controlado)
- **REQ/ADR/DT:** RF-21..28, RF-32, RF-33, RF-40; ADR-009; `fluxo-roteirizacao.md` (spec vigente — §4 passos, §6 ordem a pé, §10 decisões, §10.10 painéis por contexto); `docs/design/arvore-componentes-mapa.md` (matriz modo×slot, telas 5–9)
- **Observações:** XG — executar pelas subtarefas, uma por vez; plano fino nasce em cada uma. **Decisões de arquitetura do épico (aprovadas 07/07, registradas na ADR-009):** (A) interop — `StopGroup` fica exclusivo do Original; Meu roteiro roda sobre `DeliveryPoint`/`RouteStop` com `roteiroModels.ts` próprio e `RouteMap` bifurcando a fonte de `MarkerModel[]` por `mode`; (B) grafo OSM lazy no enter do modo (`useRoadGraph`, fallback haversine/reta em tudo); (C) âncora sem grafo = coordenada do endereço, re-projeta sozinha enquanto `vehicleStopIsDefault` — **hoje inerte** (a .4.6 passou a firmar a parada no ato da criação: create-time snapping); paradas firmadas nunca se movem sozinhas.

**Objetivo:** fluxo de construção da spec §4 ponta a ponta — início, sugestão, rascunho de parada com candidatos por raio, âncora móvel, firmar/editar, traçados — preenchendo os slots do MapPanel sem reestruturar.

<!-- TASK-RF-006.5 movida para em-andamento.md em 15/07/26 (plano aprovado). -->

### ~~TASK-RF-006.6~~ - Parada firmada: visualização + edição no painel (telas 5–7)
- ✅ **CONCLUÍDA (17/07)** — ver índice (`TASK-RF-006.6`: âncora início/fim + sentido, **SEM ordem manual** — a decisão do humano 17/07 matou o drag/reordenação; a ordem é 100% derivada). O texto antigo deste bloco (que ainda previa `drag (itemLeading)`) ficou **superado** por essa decisão.
- *(Corrigido em 19/07: o bloco seguia listado como pendente e o cabeçalho da RF-006 a contava como restante — erro de sincronização dos docs.)*

### ~~TASK-RF-006.7~~ - Traçado do percurso (veículo + a pé + km)
- ✅ **CONCLUÍDA (17/07, smoke L-15)** — ver índice. **RF-29 fechado.** ✅ **Smoke DESBLOQUEADO**: a **TASK-BG-006** (grafo preso em "loading" pelo wedge do `useRoadGraph`) foi concluída (18/07, smoke no aparelho OK) — linha/circuito/km validados seguindo as ruas.
- **Esforço-H/IA:** M/G · **Dep:** 006.4 ✅ (+ grafo da .3 ✅)
- Linha contínua âncora→âncora pela rua real (A*, mão única; fallback reta sem grafo); laço tracejado a pé do circuito da parada selecionada; tracejado da próxima "mais forte" pós-conclusão; km acumulado no painel (tempo fino é RF-007).
- **Aceite:** linha segue as ruas respeitando mão única; km coerente.

<!-- TASK-RF-006.8 movida para em-andamento.md em 12/07/26 (plano aprovado — "ok prossiga"). -->

### TASK-RF-006.9 - Geocoding mínimo do endereço da parada do veículo (âncora) (pedido 09/07)
- **Esforço-H/IA:** M/M · **Dep:** 006.4.7 ✅ · *(criada a pedido do humano 09/07 — planejar a implementação; por ora o endereço da âncora é placeholder = o 1º endereço da parada)*
- **Problema:** a **parada do veículo (âncora)** é um ponto na RUA (LatLng), não um endereço da planilha. O painel do Meu roteiro passou a exibir a âncora (ícone de veículo + endereço, seção "Endereço selecionado — parada do veículo (âncora)" — RF-006.4.7), mas hoje mostra o endereço do **1º endereço da parada** como aproximação.
- **Solução a planejar:** obter o endereço (rua + nº aproximado) da coordenada da âncora via **reverse-geocoding**, respeitando **RNF-03/RNF-13 (nenhuma API paga em produção)** — avaliar Nominatim/OSM com cache (idb) e rate-limit, ou derivar do grafo OSM já baixado (nome da via do segmento mais próximo — `nearestEdge`), que evita chamada externa. Sem PII em log (TASK-BG-002). Client-side.
- **Aceite:** a âncora mostra a via real (ou "via + aprox.") em vez do 1º endereço; offline/fallback degrada para o placeholder atual; sem custo recorrente.

<!-- TASK-RF-006.10 CONCLUÍDA em 19/07/26 (smoke L-9, "ok agora sim"). Ver 0-indice-concluidas.md → 2026-07-19--00h56--TASK-RF-006.10.md. -->

### TASK-RF-006.10 - Distância/tempo por perna na lista de endereços (conector vertical) (pedido 10/07)
- **Esforço-H/IA:** M/M · **Dep:** 006.4 ✅ (lista/`StopItemData`) · **REQ:** RF-30, RF-31; `fluxo-roteirizacao.md` §6 "por-perna" · *(criada a pedido do humano 10/07, prints do smoke M-32)*
- **Problema:** a lista de endereços do Meu roteiro mostra ordinal/endereço/pacotes, mas não o **custo de cada perna** — a informação que decide "vale andar ou criar outra parada?" (fluxo §6: "cada endereço mostra tempo + metros do ponto anterior até ele, com ícone de pedestre"; RF-30 está 🟡 justamente com "falta a distância nas pernas/paradas").
- **Solução (decisão do humano 10/07): conector vertical entre as linhas** — no gutter esquerdo, entre os mini-markers dos ordinais: linha/seta ↓ + rótulo (tempo · metros, ícone a pé). A perna desenhada como LIGAÇÃO entre os dois endereços, não como atributo solto.
  - **Perna 0 = veículo (âncora) → 1º endereço.** Se o 1º endereço coincide com a posição da âncora → indicar **"Parada do veículo"** em vez de "0 m".
  - **Cálculo pelas RUAS** (requisito, NÃO linha reta): `suggestionPath(pedGraph, from, to)` por perna — o A* pedestre por par **já existe** (`src/utils/routing/suggestion.ts`, RF-006.3); fallback reta **sempre rotulado** "(linha reta)" enquanto o grafo não carrega (padrão do "Distância até aqui"). Tempo derivado da config de caminhada (refina com **RF-007**).
  - **Dados:** `StopItemData` ganha campo opcional de perna (`panelModels.ts` — hoje não existe nada de distância ali); preenchido em `MapPage`/`pointToStopItemData` a partir de `selectedStop.vehicleStop` + ordem de `stop.pointIds`; render no `StopItemList`/`StopItem`.
- **Riscos p/ o plano fino:** gutter tem ~28px e texto vertical é difícil no mobile — a execução pode refinar a forma (ex.: linha vertical + rótulo horizontal pequeno ao lado) **mantendo o conceito de conector entre linhas**; a11y: a informação não pode depender só do desenho (texto acessível na linha). ✅ **Conflito resolvido (17/07):** a `.6` decidiu que **não há reordenação manual** — o gutter esquerdo NÃO terá drag handle, então o conector tem o espaço livre.
- **Encaixe sugerido:** junto ou logo após a **RF-006.6** (mexe na mesma lista — antes disso o conector seria retrabalhado). **Tempo da perna depende de RF-007.1** (config de caminhada + split); a **distância** já sai do `suggestionPath` sem ela.
- ✅ **Reconfirmada 18/07/26** (pedido do humano, prints L-9): "setas abaixo dos ícones de ordem das paradas + labels informando distância entre os endereços" — é exatamente o conector desta task. Sem mudança de escopo.
- **Aceite:** cada endereço da lista mostra a perna desde o anterior; o 1º desde o veículo (caso âncora = 1º → "Parada do veículo"); pelas ruas quando há grafo, reta rotulada sem grafo; sem custo perceptível de render (memo por parada); smoke no aparelho valida a legibilidade do conector.

<!-- TASK-RF-006.20 CONCLUÍDA em 18/07/26 (smoke L-9). Ver 0-indice-concluidas.md → 2026-07-18--22h42--TASK-RF-006.20.md. Bloco original abaixo, mantido como referência do escopo. -->

### ~~TASK-RF-006.20~~ - Cards do overview: PARADAS + Duração/Distância com "Detalhes" + Comercial + contagem no label (pedido 18/07) — ✅ CONCLUÍDA (18/07)
- **Esforço-H/IA:** M/M · **Dep:** RF-006.8/.11 ✅ (overview), **RF-007.1** (só o popup de Duração — a decomposição de tempo) · **REQ:** RF-31, RF-43; ADR-004 · *(pedido do humano 18/07, prints L-9)*
- **Problema:** o overview tem os cards grandes ENDEREÇOS/PACOTES e três cards menores "Tempo total / Distância total / Distância a pé" ([RouteProgressCard.tsx](../../src/components/map/panel/RouteProgressCard.tsx)); o humano quer mais informação de relance e decomposição sob demanda.
- **Escopo:**
  - **Card "PARADAS":** `StatTile` `grid-cols-2` → **`grid-cols-3`**; terceiro card no fim = nº de paradas confirmadas (`state.stops.length`, exposto via `routeProgress` em [overview.ts:32](../../src/utils/routing/overview.ts#L32)). Novo label `STAT_STOPS` em `UI_LABELS...ROTEIRO_OVERVIEW`.
  - **Renomear os 3 cards de baixo → "Duração total" · "Distância total" · "Comercial":**
    - **Duração total** = `timeTotalMin`; botão **"Detalhes"** → `Dialog` (shadcn, [ui/dialog.tsx](../../src/components/ui/dialog.tsx), `data-vaul-no-drag` no gatilho) com **Viagem no veículo** (`timeVehicleMin`) · **Caminhadas** (`timeWalkMin`) · **Entregas** (`timeDeliveryMin`). *(depende de RF-007.1 p/ o split de entrega)*
    - **Distância total** = `distanceTotalKm`; botão **"Detalhes"** → `Dialog` com **Distância veículo** (`distanceVehicleKm`) · **Caminhada** (`distanceWalkKm`). *(já existe em `plannedRouteTotals`)*
    - **Comercial** = nº de pacotes comerciais nos pontos já atribuídos (`packagesByTypeFromPoints(committedPoints).commercial` — [roteiroModels.ts:246](../../src/utils/markers/roteiroModels.ts#L246); pontos atribuídos via `assignedPointIds(state.stops)`); **sem** botão.
  - **Label "Paradas confirmadas" → "N paradas confirmadas":** `ROTEIRO_OVERVIEW.SECTION_CONFIRMED` vira função de contagem (checar a assinatura do `label` no `PanelSection`/`RoteiroOverviewSection`).
- **Riscos p/ o plano fino:** o popup de Duração só fica correto com RF-007.1 (hoje caminhada e entrega estão fundidas); se a RF-006.20 entrar antes, mostrar só o total de Duração sem o "Detalhes" (ou "Detalhes" só de Distância) até a .007.1 fechar. `data-vaul-no-drag` no gatilho do Dialog (o painel é vaul).
- **Aceite:** três stat-cards na linha (Endereços/Pacotes/Paradas); Duração e Distância abrem popup com a decomposição correta; Comercial bate com os chips de tipo; label mostra a contagem; sem regressão no Original; smoke no aparelho valida a legibilidade dos popups no mobile.
- **Dependências novas:** nenhuma (Dialog shadcn já instalado).

<!-- TASK-RF-006.21 CONCLUÍDA em 19/07/26 (smoke L-9). Ver 0-indice-concluidas.md → 2026-07-19--00h55--TASK-RF-006.21.md. -->

### TASK-RF-006.21 - "Abrir no Google Maps" ao lado de "Informações do pacote" no detalhe (pedido 18/07)
- **Esforço-H/IA:** P/P · **Dep:** nenhuma (isolada) · *(pedido do humano 18/07, prints L-9)*
- **Escopo:** em [StopItem.tsx](../../src/components/map/panel/StopItem.tsx) `StopItemDetail` (link hoje no rodapé, l.160-165), mover o link "Abrir no Google Maps" para a **linha do cabeçalho** "Informações do pacote (N)", à direita. Deep link `?q=lat,lng` inalterado.
- **Aceite:** link acessível ao lado do cabeçalho do detalhe expandido; sem regressão no Original (o `StopItemDetail` é compartilhado); smoke valida no mobile.
- **Dependências novas:** nenhuma.

<!-- TASK-RF-006.11 movida para em-andamento.md em 15/07/26 (plano aprovado — "sim", após 3 rodadas de espec). -->

### ~~TASK-RF-006.12~~ - Sugestão de próxima parada: algoritmo configurável respeitando o sentido das vias (pedido 12/07)
- ✅ **NÚCLEO CONCLUÍDO (17/07, smoke L-15)** — a sugestão (rank + linha) respeita a mão única via grafo dirigido (`nearestByVehicleGraph`/`suggestedNextSeed`; top-N por reta + refino A*). Ver índice. **Resta só o "configurável"** (escolher o critério), que depende da **RF-007** (config) — absorvido lá.
- **Esforço-H/IA:** M/G · **Dep:** 006.3 ✅ (grafo dirigido), RF-007 (config) · **Status:** núcleo ✅; config → RF-007
- **Problema (nas palavras do humano):** "a sugestão não é a que o usuário selecionou, é o algoritmo que define de acordo com as configurações — que se for 'a mais próxima', é a mais próxima **respeitando o sentido das vias**". Hoje o rank de `suggestedNextPointId` é **linha reta** a partir da origem — ignora mão única.
- **Escopo a planejar:** critério de sugestão configurável (RF-007) com "mais próxima" medida pelo **grafo dirigido** (A* de veículo por candidato — atenção a custo: rank por reta + refino top-N, como a §6 do fluxo já faz p/ pernas a pé); UI de config junto da RF-007.
- **Aceite:** com o grafo carregado, a sugestão nunca aponta um destino "perto em linha reta, longe pela mão única"; fallback reta sem grafo; critério persiste na config.

**Critérios de aceite (RF-006):** fluxo da spec §4 ponta a ponta; painéis por contexto do §10.10; slots preenchidos sem reestruturar o MapPanel; Original sem regressão. ~~Validação de completude p/ salvar~~ **não existe** (RF-33: salvar é livre; completude = `isComplete`, gate só do "Iniciar rota"/RF-009).
**Dependências novas:** nenhuma (~~`@turf/turf`~~ descartada 07/07 — haversine cobre ponto-em-raio).
**Riscos:** complexidade de estado (mitigada: reducer puro testado na .1); re-render com muitos marcadores (memoização; padrão RF-020 já lida); gestos do arrasto da âncora × pan do mapa (mitigar como no vaul: `data-vaul-no-drag`/draggable do Leaflet).

---

## TASK-RF-007 - Estimativas de tempo configuráveis (modelo de entrega realista a pé / veículo)

- **Status:** ✅ **CONCLUÍDA (18–19/07)** — **.1** motor + config + split (18/07) e **.2** config global no ⚙️ + regra por tipo/complemento (19/07). Ver índice de concluídas.
- **Modo:** Standard
- **Valor:** Importante (diferencial do produto — tempo realista a pé; alimenta os cards da RF-006.20 e o por-perna da RF-006.10)
- **Urgência:** IMEDIATA
- **Esforço-H/IA:** M/M
- **Data-hora origem:** 22/06/26 22:45 (**re-especificada 18/07/26**)
- **Dependências:** TASK-RF-004 ✅, TASK-RF-006 (subtarefas do épico ✅)
- **REQ/ADR/DT:** RF-31, RF-39; draft §2/§6/§8
- **Observações:** A estimativa atual (`stopWalkEstimate`/`plannedRouteTotals` em [estimates.ts](../../src/utils/routing/estimates.ts)) usa um único `walkingMinutesPerDelivery`×pacotes **misturado no tempo de caminhada**. Esta task troca isso por um modelo realista e **separa** os três tempos (veículo / caminhada / entregas) para a decomposição dos cards. **Decisão do humano 18/07:** tempo de entrega de um endereço com N pacotes = **`base + (N−1)×extra`** (1 pacote = tempo-base; cada pacote adicional soma `extra` seg — foto/preenchimento no app Shopee). Config agora = **só o motor + defaults**; a tela de ajustes editável é a **.2**.

**Objetivo:** modelar o tempo de entrega de forma realista e configurável, expondo os totais decompostos (viagem no veículo + caminhadas + entregas) que o painel vai apresentar.

<!-- TASK-RF-007.1 CONCLUÍDA em 18/07/26 (smoke L-9). Ver 0-indice-concluidas.md → 2026-07-18--22h41--TASK-RF-007.1.md. -->

<!-- TASK-RF-007.2 CONCLUÍDA em 19/07/26 (smoke OK). Ver 0-indice-concluidas.md → 2026-07-19--19h30--TASK-RF-007.2.md.
     Escopo final (decisão do humano 19/07): só tempo-base (minutos, 2 min) e adicional por pacote (segundos, 30 s)
     são configuráveis, e de forma GLOBAL (⚙️ do cabeçalho); velocidade a pé/veículo ficaram só em código.
     A regra de tempo virou por tipo+complemento (residencial por endereço, comercial por complemento).
     O "critério configurável da sugestão" (RF-006.12) NÃO foi absorvido — segue sem dono, reabrir se voltar a importar. -->

**Critérios de aceite (RF-007):** ✅ os três tempos aparecem decompostos e somados corretamente; funções puras cobertas por teste; config global persiste. **RF-007 CONCLUÍDA (.1 + .2, 18–19/07).**
**Dependências novas:** nenhuma.

---

## TASK-RF-009 - Modo execução da rota [XG, dividir]

- **Status:** Pendente
- **Modo:** Strict
- **Valor:** Crítico
- **Urgência:** IMEDIATA
- **Esforço-H/IA:** G/G
- **Data-hora origem:** 22/06/26 22:45
- **Dependências:** TASK-RF-004 ✅, TASK-RF-006, TASK-RF-008
- **REQ/ADR/DT:** draft §8
- **Observações:** ⚠️ **Gancho da REF-017:** o Sumário já mostra o ESTADO do roteiro ("Roteiro em construção" / "em execução — X% concluído" / "finalizado — 100%") via `plannedRouteStatus` (`utils/routing/status.ts`), que recebe um **`deliveredRatio` opcional**. Enquanto a execução não registrar entregas concluídas, um roteiro pronto lê **"em execução — 0%"** para sempre. Ao implementar a RF-009, **passar o `deliveredRatio`** — os 3 estados já funcionam, nenhum chamador muda. Sem GPS em tempo real nem âncora ao vivo (decisão final 24/06). Execução manual e guiada. **Escopo ampliado (RF-37/47/48/49, RN-22):** pausar/retomar (resumível), concluir/desfazer entrega, avançar/retroceder (muda o foco), modo lista, e Roteiro **não editável** durante a execução. Refinar as subtarefas ao iniciar.

**Objetivo:** percorrer uma rota salva com avanço manual e navegação delegada a Maps/Waze.

### TASK-RF-009.1 - Tela de execução + deep links
- **Esforço-H/IA:** M/M · **Dep:** RF-008
- Destaca a próxima parada (endereço) + botões "Abrir no Google Maps" / "Waze" (deep links: `google.com/maps/dir/?api=1&destination=LAT,LNG&travelmode=driving` e `waze.com/ul?ll=LAT,LNG&navigate=yes`).
- **Aceite:** links abrem o app certo no destino certo.

### TASK-RF-009.2 - Botão "Cheguei" (máquina de estados)
- **Esforço-H/IA:** M/M · **Dep:** 009.1
- "Cheguei" avança para o próximo ponto/parada; estado da execução isolado (reducer).
- **Aceite:** avanço sequencial correto até o fim da rota.

### TASK-RF-009.3 - Navegação dentro da parada (modo caminhada)
- **Esforço-H/IA:** P/M · **Dep:** 009.2
- Entre pontos da mesma parada, link em **modo caminhada** (`travelmode=walking`).
- **Aceite:** link a pé entre pontos da parada.

### TASK-RF-009.4 - Progresso da execução
- **Esforço-H/IA:** P/M · **Dep:** 009.2
- Mostrar paradas/pontos/pacotes feitos vs restantes.
- **Aceite:** progresso bate com o avanço.

**Critérios de aceite (RF-009):** percorrer uma rota salva ponta a ponta sem GPS; deep links corretos.
**Dependências novas:** nenhuma.

---

## TASK-RF-012 - Auto-roteirizar (agrupamento por raio)

- **Status:** Pendente
- **Modo:** Standard
- **Valor:** Importante
- **Urgência:** IMEDIATA
- **Esforço-H/IA:** M/M
- **Data-hora origem:** 22/06/26 23:50
- **Dependências:** TASK-RF-004 ✅, TASK-RF-005 ✅ (distância), TASK-RF-006 (estado)
- **REQ/ADR/DT:** `fluxo-roteirizacao.md` §12
- **Observações:** Reusa as funções do modo manual; gera rascunho editável (não final).

**Objetivo:** botão que monta a rota sozinho, a partir do início, agrupando por proximidade + raio configurado.

**Subtarefas:**
- `autoBuildStops(points, start, config)` em `src/utils/routing/`: vizinho-mais-próximo + inclusão por raio até atribuir todos; usa a ordem a pé (§6).
- Botão "Auto-roteirizar" na tela Mapa; resultado entra no estado da RF-006 como rascunho editável.

**Critérios de aceite:** 1 clique cobre todos os endereços em paradas; usuário pode editar depois; função coberta por teste.
**Dependências novas:** nenhuma.

---

## TASK-RF-013 - Export/import de rota configurada (JSON autocontido)

- **Status:** Pendente
- **Modo:** Standard
- **Valor:** Importante
- **Urgência:** IMEDIATA
- **Esforço-H/IA:** M/M
- **Data-hora origem:** 22/06/26 23:50
- **Dependências:** TASK-RF-004 ✅, TASK-RF-008
- **REQ/ADR/DT:** `fluxo-roteirizacao.md` §13
- **Observações:** Caso de uso central: passar a rota pronta para um **ajudante** ou trocar de aparelho (modelo é por dispositivo, sem nuvem). O botão "Importar roteiro (.json)" já existe como stub desabilitado na HOME (RF-022.2).

**Objetivo:** exportar/importar um `PlannedRoute` completo (pontos + paradas + âncoras + config) como arquivo JSON.

**Subtarefas:**
- Serializar/parsear `PlannedRoute` (+ pontos) em JSON versionado; validar no import.
- Exportar (download de arquivo) e importar (seleção de arquivo) — distinto do import de planilha Shopee.

**Critérios de aceite:** exportar e reimportar (outro aparelho) reconstrói a rota idêntica, com config; testes de round-trip serialize/parse.
**Dependências novas:** nenhuma.

---

## Números aposentados (núcleo §4.4)

> 🔀 **TASK-RF-010 absorvida pela TASK-RF-006.2** (07/07/26): o escopo remanescente ("ligar o lado Meu roteiro do toggle ao fluxo de construção") é exatamente a entrada no modo da RF-006.2. O número **010 não será reaproveitado**.
>
> 🔀 **TASK-RF-014 absorvida pela TASK-RF-022** (05/07/26): Sumário lançador → **RF-022.4**; tela inicial/instruções → **RF-022.2**; lista de salvos → **RF-022.3**; UI mínima no mapa → **RF-022.5**. O número **014 não será reaproveitado**.

---

<!--
## TASK-PREFIXO-XXX - Título
- **Status:** Pendente
- **Modo:** Standard
- **Valor:** Crítico
- **Urgência:** IMEDIATA
- **Esforço-H/IA:** G/G
- **Data-hora origem:** DD/MM/AA HH:MM
- **Dependências:** -
- **REQ/ADR/DT:** -
- **Observações:** [motivo da urgência]
-->

---

## Backlog (Normal)

| TASK-ID | Título | Modo | Valor | Urgência | Esforço-H/IA | Dependências | REQ/ADR/DT | Status | Data origem |
|---|---|:---:|:---:|:---:|:---:|---|---|:---:|---|
| TASK-TEST-002 | Testar o zoom do mapa e definir o limite mínimo ideal (detalhe de rua p/ roteirizar a pé); alinhar `MAP_CONFIG.ZOOM.MIN` com o bloqueio do tile worker (hoje z<14) | Standard | Importante | Normal | P/M | - | RNF-12, RNF-15 | `[ ]` | 24/06/26 14:50 |
| TASK-DOC-005 | Decidir o destino do status "Carregando ruas…" (grafo OSM, origem RF-006.3): formalizar em requisito, trocar a apresentação ou manter como está | Light | Desejável | Normal | P/P | - | RF-22 | `[ ]` | 09/07/26 17:00 |
| TASK-DOC-006 | Aplicar as 8 correções de custo/backend listadas em `plano-infraestrutura-e-custos.md` §13 — **inclui a divergência ADR-007 × ADR-010** (a 010 diz que a 007 "já decidiu" PMTiles; a 007 deixa raster×vetor e provedor em aberto: fechar numa ou parar de citar na outra) — inclui a pendência que a **ADR-010:125 já prescrevia** ("roteamento = zero" → "zero de compute; a malha divide o trilho R2/Worker"), o RNF-02 "zero servidor próprio" (falso desde o Worker de tiles) e a desambiguação do custo de geocoding da DT-006 (fork no-coords ≠ âncora) | Standard | Importante | Normal | P/M | - | ADR-010, DT-002, DT-006, RNF-02 | `[ ]` | 20/07/26 20:10 |
| TASK-REF-014 | Ajustar o radius do tema para `0.5rem` conforme `neonflux.md` (hoje 1rem/pill) — pendência estética anotada na REF-012 | Light | Desejável | Normal | P/P | - | ADR-006 | `[ ]` | 09/07/26 17:00 |

---

## Legenda

**Prefixos de ID:**

| Prefixo | Significado |
|---|---|
| TASK-RN | Regra de Negócio |
| TASK-RF | Requisito Funcional |
| TASK-RNF | Requisito Não-Funcional |
| TASK-BG | Bug |
| TASK-REF | Refatoração |
| TASK-DOC | Documentação |
| TASK-CHORE | Manutenção |
| TASK-TEST | Testes |

IDs independentes: `TASK-RF-005`. Derivadas: `TASK-RF-005.1`.

**Campos:**

- **Modo:** Light / Standard / Strict
- **Valor:** Crítico / Importante / Desejável
- **Urgência:** Imediata / Normal
- **Esforço-H/IA:** Humano / IA, valores `P / M / G / XG` (ex.: `M/G`). `XG-IA` = dividir antes de executar.
- **Status:** `[ ]` pendente · `[!]` bloqueada · `[x]` concluída (some daqui ao concluir)
- **Data origem:** `DD/MM/AA HH:MM`
