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
| 7 | **TASK-RF-006.5** → **.6** → **.7** | Sequência do épico. A `.6` depende da `.5`. Ao fim da `.7`, um retoque pluga distância/tempo totais nos cards da `.8` (por isso ficaram fora do escopo dela). |
| 8 | **TASK-RF-007** → **RF-009** → **RF-012** → **RF-013** | Sem mudança em relação ao registrado. |

**Backlog sem urgência, encaixar em intervalos:** `TASK-RF-006.9` (geocoding da âncora; placeholder aceitável), `TASK-DOC-005`, `TASK-REF-014`, `TASK-TEST-002`.

### 🔁 Onde eu posso estar errado

Adiantar a `RF-006.8` para antes da `.5`/`.6` é a única aposta real. Se a `.6` mudar o `PanelSection` de forma inesperada, parte da `.8` seria refeita. Julgo o risco baixo (a `.8` reusa `PanelTitle` e `StopItemList`, estabilizados na `.4.3`), mas a ordem conservadora seria `.5 → .6 → .7 → .8` — ao custo de conviver com o painel colapsado alto por mais três tarefas.

---

## Imediatas

> Tarefas urgentes que carregam contexto extra. Bloco em lista, no topo.
>
> **Épico: Roteirizador a pé (Nível B).** Implementação completa da visão em [`docs/rascunhos/draft-roteirizador-a-pe.md`](../rascunhos/draft-roteirizador-a-pe.md), decisão de roteamento em [`ADR-002`](../arquitetura/ADR/ADR-002.md). **Fila:** ver a tabela **"Ordem de execução recomendada"** no topo deste arquivo (rev. 10/07, pós-smoke). Resumo: `RF-006.5 → .6 → .7 → RF-007 → RF-009 → RF-012 → RF-013`. Concluídos: RF-003/004/005/011/020/021/022/023 e RF-006.1 → .4.27 (ver índice). RF-014 absorvida pela RF-022; RF-010 absorvida pela RF-006.2. Cada tarefa só vira "Em Andamento" uma por vez (núcleo §3); o plano fino nasce ali.
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

## TASK-RF-006 - UI de construção da rota (Meu roteiro) [XG, dividir]

- **Status:** Pendente (**.1 → .4.27 e .8 ✅** — ver [`0-indice-concluidas.md`](./concluidas/0-indice-concluidas.md); restam **.5 · .6 · .7 · .9 · .10**)
- **Modo:** Strict
- **Valor:** Crítico
- **Urgência:** IMEDIATA
- **Esforço-H/IA:** XG/XG
- **Data-hora origem:** 22/06/26 22:45 (**re-fatiada em 07/07/26** — o fatiamento de 22/06 antecedia âncora/vehicleStop, rascunho, "raio sugere candidatos", RF-33/salvar livre e os slots do MapPanel)
- **Dependências:** TASK-RF-004 ✅, TASK-RF-005 ✅, TASK-RF-021 ✅ (vehicleStop), TASK-RF-022/023 ✅ (slots do painel, toggle, RouteMap controlado)
- **REQ/ADR/DT:** RF-21..28, RF-32, RF-33, RF-40; ADR-009; `fluxo-roteirizacao.md` (spec vigente — §4 passos, §6 ordem a pé, §10 decisões, §10.10 painéis por contexto); `docs/design/arvore-componentes-mapa.md` (matriz modo×slot, telas 5–9)
- **Observações:** XG — executar pelas subtarefas, uma por vez; plano fino nasce em cada uma. **Decisões de arquitetura do épico (aprovadas 07/07, registradas na ADR-009):** (A) interop — `StopGroup` fica exclusivo do Original; Meu roteiro roda sobre `DeliveryPoint`/`RouteStop` com `roteiroModels.ts` próprio e `RouteMap` bifurcando a fonte de `MarkerModel[]` por `mode`; (B) grafo OSM lazy no enter do modo (`useRoadGraph`, fallback haversine/reta em tudo); (C) âncora sem grafo = coordenada do endereço, re-projeta sozinha enquanto `vehicleStopIsDefault` — **hoje inerte** (a .4.6 passou a firmar a parada no ato da criação: create-time snapping); paradas firmadas nunca se movem sozinhas.

**Objetivo:** fluxo de construção da spec §4 ponta a ponta — início, sugestão, rascunho de parada com candidatos por raio, âncora móvel, firmar/editar, traçados — preenchendo os slots do MapPanel sem reestruturar.

### TASK-RF-006.5 - Marcador da âncora + mover/tornar/resetar (passo 5)
- **Esforço-H/IA:** M/G · **Dep:** 006.4 ✅ (+ RF-008)
- Gestos sobre o marcador de veículo já existente (carro Tabler, .4.2): **arrastável** com re-projeção na rua (`nearestEdge`) e re-varredura da ordem a pé; painel da âncora (Mover/Resetar) + "Tornar âncora" no endereço; título "Parada N — Veículo (âncora)".
- **Aceite:** arrastar o veículo renumera a ordem a pé; tornar/resetar corretos.

### TASK-RF-006.6 - Parada firmada: visualização + edição no painel (telas 5–7)
- **Esforço-H/IA:** G/G · **Dep:** 006.5 · *(dividir em .6a/.6b se estourar; parte já antecipada na .4.2/.4.9 — tap na parada → painel + Editar/Desfazer + edição desagrupada; e o **"Adicionar" foi antecipado pela .4.23**, achado do smoke)*
- Parada selecionada lista endereços por **ordinal** + item âncora; edição = `REOPEN_STOP` (reabre como rascunho): Remover/Adicionar/Tornar âncora/Inverter, drag (`itemLeading`), footer "Salvar alterações"; Desfazer parada; Incorporar órfão.
- **Aceite:** editar uma parada pronta ponta a ponta pelos slots, sem reestruturar o painel.

### TASK-RF-006.7 - Traçado do percurso (veículo + a pé + km)
- **Esforço-H/IA:** M/G · **Dep:** 006.4 ✅ (+ grafo da .3 ✅)
- Linha contínua âncora→âncora pela rua real (A*, mão única; fallback reta sem grafo); laço tracejado a pé do circuito da parada selecionada; tracejado da próxima "mais forte" pós-conclusão; km acumulado no painel (tempo fino é RF-007).
- **Aceite:** linha segue as ruas respeitando mão única; km coerente.

<!-- TASK-RF-006.8 movida para em-andamento.md em 12/07/26 (plano aprovado — "ok prossiga"). -->

### TASK-RF-006.9 - Geocoding mínimo do endereço da parada do veículo (âncora) (pedido 09/07)
- **Esforço-H/IA:** M/M · **Dep:** 006.4.7 ✅ · *(criada a pedido do humano 09/07 — planejar a implementação; por ora o endereço da âncora é placeholder = o 1º endereço da parada)*
- **Problema:** a **parada do veículo (âncora)** é um ponto na RUA (LatLng), não um endereço da planilha. O painel do Meu roteiro passou a exibir a âncora (ícone de veículo + endereço, seção "Endereço selecionado — parada do veículo (âncora)" — RF-006.4.7), mas hoje mostra o endereço do **1º endereço da parada** como aproximação.
- **Solução a planejar:** obter o endereço (rua + nº aproximado) da coordenada da âncora via **reverse-geocoding**, respeitando **RNF-03/RNF-13 (nenhuma API paga em produção)** — avaliar Nominatim/OSM com cache (idb) e rate-limit, ou derivar do grafo OSM já baixado (nome da via do segmento mais próximo — `nearestEdge`), que evita chamada externa. Sem PII em log (TASK-BG-002). Client-side.
- **Aceite:** a âncora mostra a via real (ou "via + aprox.") em vez do 1º endereço; offline/fallback degrada para o placeholder atual; sem custo recorrente.

### TASK-RF-006.10 - Distância/tempo por perna na lista de endereços (conector vertical) (pedido 10/07)
- **Esforço-H/IA:** M/M · **Dep:** 006.4 ✅ (lista/`StopItemData`) · **REQ:** RF-30, RF-31; `fluxo-roteirizacao.md` §6 "por-perna" · *(criada a pedido do humano 10/07, prints do smoke M-32)*
- **Problema:** a lista de endereços do Meu roteiro mostra ordinal/endereço/pacotes, mas não o **custo de cada perna** — a informação que decide "vale andar ou criar outra parada?" (fluxo §6: "cada endereço mostra tempo + metros do ponto anterior até ele, com ícone de pedestre"; RF-30 está 🟡 justamente com "falta a distância nas pernas/paradas").
- **Solução (decisão do humano 10/07): conector vertical entre as linhas** — no gutter esquerdo, entre os mini-markers dos ordinais: linha/seta ↓ + rótulo (tempo · metros, ícone a pé). A perna desenhada como LIGAÇÃO entre os dois endereços, não como atributo solto.
  - **Perna 0 = veículo (âncora) → 1º endereço.** Se o 1º endereço coincide com a posição da âncora → indicar **"Parada do veículo"** em vez de "0 m".
  - **Cálculo pelas RUAS** (requisito, NÃO linha reta): `suggestionPath(pedGraph, from, to)` por perna — o A* pedestre por par **já existe** (`src/utils/routing/suggestion.ts`, RF-006.3); fallback reta **sempre rotulado** "(linha reta)" enquanto o grafo não carrega (padrão do "Distância até aqui"). Tempo derivado da config de caminhada (refina com **RF-007**).
  - **Dados:** `StopItemData` ganha campo opcional de perna (`panelModels.ts` — hoje não existe nada de distância ali); preenchido em `MapPage`/`pointToStopItemData` a partir de `selectedStop.vehicleStop` + ordem de `stop.pointIds`; render no `StopItemList`/`StopItem`.
- **Riscos p/ o plano fino:** gutter tem ~28px e texto vertical é difícil no mobile — a execução pode refinar a forma (ex.: linha vertical + rótulo horizontal pequeno ao lado) **mantendo o conceito de conector entre linhas**; a **RF-006.6** usará o leading das linhas p/ drag na edição (no modo edição o conector pode se esconder); a11y: a informação não pode depender só do desenho (texto acessível na linha).
- **Encaixe sugerido:** junto ou logo após a **RF-006.6** (mexe na mesma lista — antes disso o conector seria retrabalhado).
- **Aceite:** cada endereço da lista mostra a perna desde o anterior; o 1º desde o veículo (caso âncora = 1º → "Parada do veículo"); pelas ruas quando há grafo, reta rotulada sem grafo; sem custo perceptível de render (memo por parada); smoke no aparelho valida a legibilidade do conector.

**Critérios de aceite (RF-006):** fluxo da spec §4 ponta a ponta; painéis por contexto do §10.10; slots preenchidos sem reestruturar o MapPanel; Original sem regressão. ~~Validação de completude p/ salvar~~ **não existe** (RF-33: salvar é livre; completude = `isComplete`, gate só do "Iniciar rota"/RF-009).
**Dependências novas:** nenhuma (~~`@turf/turf`~~ descartada 07/07 — haversine cobre ponto-em-raio).
**Riscos:** complexidade de estado (mitigada: reducer puro testado na .1); re-render com muitos marcadores (memoização; padrão RF-020 já lida); gestos do arrasto da âncora × pan do mapa (mitigar como no vaul: `data-vaul-no-drag`/draggable do Leaflet).

---

## TASK-RF-007 - Estimativas de tempo (config a pé / veículo)

- **Status:** Pendente
- **Modo:** Standard
- **Valor:** Importante
- **Urgência:** IMEDIATA
- **Esforço-H/IA:** M/M
- **Data-hora origem:** 22/06/26 22:45
- **Dependências:** TASK-RF-004 ✅, TASK-RF-006
- **REQ/ADR/DT:** draft §2/§6
- **Observações:** Diferencial do produto (tempo realista a pé). A estimativa grosseira do painel (`stopWalkEstimate`, RF-006.4.1) é o ponto de partida.

**Objetivo:** estimar tempo por parada (entrega a pé) e deslocamento entre paradas (km/h configurável).

**Subtarefas:**
- `src/utils/routing/estimates.ts`: `stopTime(stop, config)` = (pontos ou pacotes) × `walkingMinutesPerDelivery`; `travelTime(distanceKm, config)` = distância / `vehicleSpeedKmh`.
- Painel de config (texto em `UI_LABELS`): minutos por entrega e km/h; persistir em `PlannedRoute.config`.
- Exibir estimativa na parada (RF-006.5) e no resumo.

**Critérios de aceite:** números aparecem na parada e no total; funções cobertas por teste; config persiste.
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
- **Observações:** Sem GPS em tempo real nem âncora ao vivo (decisão final 24/06). Execução manual e guiada. **Escopo ampliado (RF-37/47/48/49, RN-22):** pausar/retomar (resumível), concluir/desfazer entrega, avançar/retroceder (muda o foco), modo lista, e Roteiro **não editável** durante a execução. Refinar as subtarefas ao iniciar.

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
| TASK-REF-014 | Ajustar o radius do tema para `0.5rem` conforme `neonflux.md` (hoje 1rem/pill) — pendência estética anotada na REF-012 | Light | Desejável | Normal | P/P | - | ADR-006 | `[ ]` | 09/07/26 17:00 |
| TASK-REF-017 | **Redesenhar o card "Info Meu Roteiro" do Sumário** (feedback 10/07: "espero que seja rascunho e não final" — É rascunho: a lista `rótulo: valor` veio do placeholder da fase 1/RF-022.4, a RF-008 só a alimentou). Virar cards-estatística no padrão do design system (alinhar com o "Roteiro em Construção" da **RF-006.8** — compartilhar os componentes de stat), hierarquia visual (totais em destaque, parciais como chips) e zeros tratados (hoje "Distância (veículo): 0 km" com 1 parada parece bug). Fazer junto ou logo após a RF-006.8 | Standard | Importante | Normal | P/M | RF-008 ✅ | RF-43; ADR-004 | `[ ]` | 10/07/26 21:00 |

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
