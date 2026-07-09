# Tarefas Pendentes

> Backlog priorizado. Cada tarefa entra como **uma única linha** (urgência Normal) ou **bloco em lista** (urgência Imediata). Sem detalhes de implementação — o plano nasce só quando a tarefa vira "Em Andamento".
>
> Ordenação: por **prioridade combinada** (Valor + Urgência), maior no topo. Em empate, menor esforço primeiro. Não ordenar por data.
>
> Histórico das concluídas: [`concluidas/0-indice-concluidas.md`](./concluidas/0-indice-concluidas.md).

---

## Imediatas

> Tarefas urgentes que carregam contexto extra. Bloco em lista, no topo.
>
> **Épico: Roteirizador a pé (Nível B).** Implementação completa da visão em [`docs/rascunhos/draft-roteirizador-a-pe.md`](../rascunhos/draft-roteirizador-a-pe.md), decisão de roteamento em [`ADR-002`](../arquitetura/ADR/ADR-002.md). **Fila atual:** **RF-008 (antecipada) → RF-006.5 → .6 → .7 → RF-007 → RF-009 (.1→.4) → RF-012 → RF-013**. Concluídos: RF-003/004/005/011/020/021/022/023 e RF-006.1 → .4.16 (ver índice). RF-014 absorvida pela RF-022; RF-010 absorvida pela RF-006.2. Cada tarefa só vira "Em Andamento" uma por vez (núcleo §3); o plano fino nasce ali.
>
> ⚠️ **Decisões transversais (valem para o épico todo):**
> - **Estado:** `useReducer` por feature (conforme draft §6). Zustand só se a complexidade exigir — e **não instalar sem aprovação** (anti-padrão do núcleo §5).
> - **Dependências novas precisam de aprovação explícita** antes de instalar. `idb`, `fake-indexeddb` e `vaul` já instaladas. ~~`@turf/turf`~~ **descartada** (decisão 07/07: ponto-em-raio = `haversine(center, p) <= r`, já existente).
> - **Sem `any`** (núcleo §5); texto de UI sempre em `UI_LABELS` (ADR-001); arquivos novos em `src/utils/routing/` (lógica pura) e `src/services/` (IO/persistência), seguindo a convenção `utils/` do projeto.
> - **Gate de cada tarefa:** `npx tsc --noEmit` + `npm run test` verdes antes de concluir (rotular APROVADO/FALHOU/NÃO EXECUTADO).

---

## TASK-CHORE-004 - Smoke manual acumulado do Meu roteiro (RF-006.4.13 → .4.18) + calibrações

- **Status:** Pendente
- **Modo:** Standard
- **Valor:** Importante
- **Urgência:** IMEDIATA
- **Esforço-H/IA:** P/-
- **Data-hora origem:** 09/07/26 17:00
- **Dependências:** TASK-RF-006.4.18 ✅
- **REQ/ADR/DT:** ADR-008, ADR-009; `fluxo-roteirizacao.md` §3/§4
- **Observações:** As últimas fatias entregaram com suíte verde (631/631) mas **sem validação visual do humano** — só ele consegue julgar destaque, contraste, gesto e toque no device. Enquanto o smoke não roda, a confiança no visual dessas fatias é presumida, não verificada. Tarefa **do humano** (IA não tem esforço aqui). Se algum item reprovar, abrir TASK-BG própria. ⚠️ O "detalhe não crescia" da .4.17 foi corrigido por **diagnóstico de leitura, não observado rodando** — é o item mais importante desta lista.

**Objetivo:** validar no navegador/device o comportamento visual das fatias .4.13 → .4.18 e calibrar os knobs que ficaram anotados no código.

**Checklist de smoke:**
- **.4.13** — linha "Endereço selecionado" destacada por padrão (roteiro); quadrado da parada que o painel mostra com anel+brilho nos **dois** modos (inclusive na seleção inicial e acompanhando o stepper); conferir contraste no tema dark.
- **.4.14** — parada selecionada maior + anel + brilho + na frente (não some em cluster denso) nos dois modos; ponto inicial (losango) plano, mesmo tamanho, atrás; **calibrar `SELECTED_SCALE_FACTOR`** em cluster denso.
- **.4.15** — expandir a parada firmada destaca o 1º endereço (âncora); botões do painel não cortam (se cortarem, subir **`COLLAPSED_MAX_FRACTION`** no `MapPanel.tsx`).
- **.4.16** — criar parada → 2 cliques (desagrupa) → tocar **qualquer** endereço migra o destaque no mapa e o painel mostra esse endereço (nº + complemento, sem "âncora"); tocar no mapa vazio regrupa e volta à âncora.
- **.4.17** — ⚠️ **o mais importante:** tocar o endereço selecionado no roteiro abre o detalhe **e o painel cresce** (era o bug reportado; a correção não foi observada rodando). Arrastar o painel e soltar em alturas arbitrárias: deve **parar onde soltou**, não saltar; depois disso, um clique volta a saltar para a altura nomeada. Os três botões cabem na linha de "Resumo da parada" em tela estreita. Calibrar `ROTEIRO_PANEL_SIZING` (`collapsedAdjustPx`/`halfFraction`) no device; se o painel ficar denso demais, `LADDER_STEP`.
- **.4.18** — focar a parada 3 no Original → alternar para Meu roteiro (parada 1) → voltar ao Original (**continua na parada 3**) → voltar ao roteiro (**continua na parada 1**). Subir o painel no Original não deve mover o do roteiro. Botões do roteiro rentes à borda direita, alinhados com o "Ver lista completa" do Original.
- **.4.19 + .4.20 + .4.21 (zoom/destaque, ver juntos)** — 1 clique na parada: vizinhas visíveis, sem encher a tela (zoom 17); **2 cliques**: desagrupa **e** vai ao máximo (19); **tocar um endereço da parada desagrupada**: aproxima ESSE endereço (não a parada); **confirmar início**: o endereço aparece aproximado **e destacado** (anel+brilho+maior); **endereço livre** estando numa parada: aproxima o endereço, **não** afasta; **mapa vazio sem seleção**: enquadra tudo. O `+` ainda chega a 19. ⚠️ **Regressão a vigiar:** alternar candidato durante o rascunho não pode mexer no zoom. ⚠️ Se o salto entre "rota toda" (16) e "foco de parada" (17) ficar imperceptível, baixar `FOCUS_ZOOM_OFFSET` de 2 para 1 em `constants/index.ts`.
- **Pendências antigas de calibração:** janela de 220ms do duplo-clique; zoom do foco (`maxZoom: MAX`) em parada de 1 endereço; tons neon no device; centro ótico do ícone de carro; tracejado do candidato em zoom baixo.

**Critérios de aceite:** cada item do checklist aprovado pelo humano, ou reprovado com TASK-BG aberta.
**Dependências novas:** nenhuma.

---

## TASK-RF-008 - Persistência da rota planejada (IndexedDB) — **PRÓXIMA DA FILA**

- **Status:** Pendente
- **Modo:** Standard
- **Valor:** Crítico
- **Urgência:** IMEDIATA
- **Esforço-H/IA:** M/M
- **Data-hora origem:** 22/06/26 22:45 (**antecipada em 07/07/26**, decisão do humano: entra logo após a RF-006.4, quando já existe parada firmada — os smokes das fatias seguintes não perdem o roteiro ao sair do mapa)
- **Dependências:** TASK-RF-004 ✅, TASK-RF-006.4 ✅
- **REQ/ADR/DT:** RF-33 (salvar livre/auto-save), RF-35, RN-21; `fluxo-roteirizacao.md` §12
- **Observações:** `idb` e `fake-indexeddb` já instalados. Seguir o padrão `manifestStorage` (resultado discriminado, DB versionado, leitura degrada / escrita reporta). O reducer da RF-006.1 já expõe `toPlannedRoute`/`HYDRATE` como ponte.

**Objetivo:** salvar/carregar/listar `PlannedRoute` localmente, com **auto-save de rascunho** (RF-33 — salvar é livre, mesmo incompleto).

**Subtarefas:**
- `src/services/routeStorage.ts`: CRUD de `PlannedRoute` em IndexedDB (criar, ler, listar, apagar; 1 roteiro por rota — RN-21).
- Auto-save do estado do builder (debounce) + `HYDRATE` ao reabrir o mapa em modo roteiro (**carregar o roteiro atrelado ao entrar no modo** — item 4 do feedback de 08/07).
- Acender `hasRoteiro` no `RouteChip` e o botão adaptativo do Sumário ("Criar Roteiro" → "Ver Meu Roteiro").
- Testes com `fake-indexeddb`.

**Critérios de aceite:** fechar e reabrir o mapa recupera o roteiro intacto (incl. rascunho); chip/botão refletem a existência do roteiro; testes verdes.
**Dependências novas:** nenhuma.
**Riscos:** versionamento do schema do IndexedDB (definir `version` + `upgrade`).

---

## TASK-RF-006 - UI de construção da rota (Meu roteiro) [XG, dividir]

- **Status:** Pendente (**.1 → .4.18 ✅** — ver [`0-indice-concluidas.md`](./concluidas/0-indice-concluidas.md); restam **.5 · .6 · .7 · .8 · .9**, após a RF-008)
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
- **Esforço-H/IA:** G/G · **Dep:** 006.5 · *(dividir em .6a/.6b se estourar; parte já antecipada na .4.2/.4.9 — tap na parada → painel + Editar/Desfazer + edição desagrupada)*
- Parada selecionada lista endereços por **ordinal** + item âncora; edição = `REOPEN_STOP` (reabre como rascunho): Remover/Adicionar/Tornar âncora/Inverter, drag (`itemLeading`), footer "Salvar alterações"; Desfazer parada; Incorporar órfão.
- **Aceite:** editar uma parada pronta ponta a ponta pelos slots, sem reestruturar o painel.

### TASK-RF-006.7 - Traçado do percurso (veículo + a pé + km)
- **Esforço-H/IA:** M/G · **Dep:** 006.4 ✅ (+ grafo da .3 ✅)
- Linha contínua âncora→âncora pela rua real (A*, mão única; fallback reta sem grafo); laço tracejado a pé do circuito da parada selecionada; tracejado da próxima "mais forte" pós-conclusão; km acumulado no painel (tempo fino é RF-007).
- **Aceite:** linha segue as ruas respeitando mão única; km coerente.

### TASK-RF-006.8 - Visão "Roteiro completo" no painel ocioso (pedido 08/07)
- **Esforço-H/IA:** M/M · **Dep:** 006.4.3 ✅ (PanelSection/StopItemList) · *(criada a pedido do humano 08/07; execução adiada — "ainda tem muita coisa pra arrumar" nas rodadas do .4.x)*
- **Problema:** no Meu roteiro, quando **nenhum endereço/parada está selecionado** (ex.: logo após definir o início), o painel fica quase vazio ("Início definido" + redefinir) — estado que o Original nem tem (lá sempre há um endereço selecionado).
- **Solução pedida:** tornar esse painel útil mostrando a **lista completa do roteiro em ordem** — mesma lógica e estrutura do "Ver lista completa" de uma parada, mas o "completão" de TODAS as paradas: Parada 1 (resumo) → endereços por ordinal → Parada 2 → … (reuso de `StopItemList`/`PanelSection`/`pointToStopItemData`; snap full rolável, como no Original).
- **+ Botão "Ver roteiro completo"** no canto superior da **1ª seção** (header de estado) abrindo essa visão (padrão do "Ver lista completa"/slot actions).
- **Aceite:** painel ocioso nunca fica "morto"; a visão lista todas as paradas na ordem com seus endereços ordinais; alternância abre/fecha como no Original (Ver/Esconder; Escape/arrasto saem).

### TASK-RF-006.9 - Geocoding mínimo do endereço da parada do veículo (âncora) (pedido 09/07)
- **Esforço-H/IA:** M/M · **Dep:** 006.4.7 ✅ · *(criada a pedido do humano 09/07 — planejar a implementação; por ora o endereço da âncora é placeholder = o 1º endereço da parada)*
- **Problema:** a **parada do veículo (âncora)** é um ponto na RUA (LatLng), não um endereço da planilha. O painel do Meu roteiro passou a exibir a âncora (ícone de veículo + endereço, seção "Endereço selecionado — parada do veículo (âncora)" — RF-006.4.7), mas hoje mostra o endereço do **1º endereço da parada** como aproximação.
- **Solução a planejar:** obter o endereço (rua + nº aproximado) da coordenada da âncora via **reverse-geocoding**, respeitando **RNF-03/RNF-13 (nenhuma API paga em produção)** — avaliar Nominatim/OSM com cache (idb) e rate-limit, ou derivar do grafo OSM já baixado (nome da via do segmento mais próximo — `nearestEdge`), que evita chamada externa. Sem PII em log (TASK-BG-002). Client-side.
- **Aceite:** a âncora mostra a via real (ou "via + aprox.") em vez do 1º endereço; offline/fallback degrada para o placeholder atual; sem custo recorrente.

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
| TASK-DOC-003 | Sincronizar `contexto-projeto-ai.md`: deixa de ser "SPA de página única sem router" (ADR-003) | Standard | Importante | Normal | P/P | TASK-RF-011 ✅ | ADR-003 | `[ ]` | 22/06/26 23:50 |
| TASK-TEST-002 | Testar o zoom do mapa e definir o limite mínimo ideal (detalhe de rua p/ roteirizar a pé); alinhar `MAP_CONFIG.ZOOM.MIN` com o bloqueio do tile worker (hoje z<14) | Standard | Importante | Normal | P/M | - | RNF-12, RNF-15 | `[ ]` | 24/06/26 14:50 |
| TASK-DOC-005 | Decidir o destino do status "Carregando ruas…" (grafo OSM, origem RF-006.3): formalizar em requisito, trocar a apresentação ou manter como está | Light | Desejável | Normal | P/P | - | RF-22 | `[ ]` | 09/07/26 17:00 |
| TASK-REF-014 | Ajustar o radius do tema para `0.5rem` conforme `neonflux.md` (hoje 1rem/pill) — pendência estética anotada na REF-012 | Light | Desejável | Normal | P/P | - | ADR-006 | `[ ]` | 09/07/26 17:00 |
| TASK-TEST-003 | Testar o zoom/enquadramento REAL do mapa (Leaflet espionado, como em `MapPage.integration.test.tsx`), não só as props passadas ao stub do RouteMap — dois defeitos de zoom (.4.19, .4.20) atravessaram a suíte verde porque nenhum teste observava o `fitBounds` resultante | Standard | Importante | Normal | P/M | - | RF-006.4.19/.4.20/.4.21 | `[ ]` | 09/07/26 20:35 |

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
