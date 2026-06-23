# Tarefas Pendentes

> Backlog priorizado. Cada tarefa entra como **uma única linha** (urgência Normal) ou **bloco em lista** (urgência Imediata). Sem detalhes de implementação — o plano nasce só quando a tarefa vira "Em Andamento".
>
> Ordenação: por **prioridade combinada** (Valor + Urgência), maior no topo. Em empate, menor esforço primeiro. Não ordenar por data.

---

## Imediatas

> Tarefas urgentes que carregam contexto extra. Bloco em lista, no topo.
>
> **Épico: Roteirizador a pé (Nível B).** Implementação completa da visão em [`docs/rascunhos/draft-roteirizador-a-pe.md`](../rascunhos/draft-roteirizador-a-pe.md), decisão de roteamento em [`ADR-002`](../arquitetura/ADR/ADR-002.md). Ordem sugerida no VS Code: **RF-004 → RF-005 (.1→.5) → RF-006 (.1→.7) → RF-007 → RF-008 → RF-009 (.1→.4) → RF-010**. Cada tarefa só vira "Em Andamento" uma por vez (núcleo §3); o plano fino nasce ali.
>
> ⚠️ **Decisões transversais (valem para o épico todo):**
> - **Estado:** `useReducer` por feature (conforme draft §6). Zustand só se a complexidade exigir — e **não instalar sem aprovação** (anti-padrão do núcleo §5).
> - **Dependências novas precisam de aprovação explícita** antes de instalar. Candidatas previstas: `idb` (IndexedDB), `@turf/turf` (geometria), `fake-indexeddb` (dev/teste). Propor com justificativa em cada tarefa.
> - **Sem `any`** (núcleo §5); texto de UI sempre em `UI_LABELS` (ADR-001); arquivos novos em `src/utils/routing/` (lógica pura) e `src/services/` (IO/persistência), seguindo a convenção `utils/` do projeto.
> - **Gate de cada tarefa:** `npx tsc --noEmit` + `npm run test` verdes antes de concluir (rotular APROVADO/FALHOU/NÃO EXECUTADO).

---

## TASK-RF-004 - Modelo de dados do roteirizador (Ponto / Parada / Rota planejada)

- **Status:** Pendente
- **Modo:** Standard
- **Valor:** Crítico
- **Urgência:** IMEDIATA
- **Esforço-H/IA:** M/M
- **Data-hora origem:** 22/06/26 22:45
- **Dependências:** TASK-RF-002 (concluída)
- **REQ/ADR/DT:** draft §5; ADR-002
- **Observações:** Fundação do épico. É a decisão "mais barata de mudar agora, cara depois" — fechar antes de qualquer tela.

**Objetivo:** definir as três entidades centrais e os seletores derivados, sem UI.

**Subtarefas:**
- Criar `src/types/routing.ts` com:
  - `DeliveryPoint` { id: string; lat: number; lng: number; address: string; packageCount: number; rawData: RowData }
  - `RouteStop` { order: number; centroidLat: number; centroidLng: number; pointIds: string[]; radiusMeters: number }
  - `PlannedRoute` { id: string; startPoint: { lat; lng } | null; stops: RouteStop[]; config: RoutingConfig }
  - `RoutingConfig` { walkingMinutesPerDelivery: number; vehicleSpeedKmh: number }
- `src/utils/routing/points.ts`: `rowToDeliveryPoint(row, index)` — usa `parseCoordinate`; `packageCount` de `Num of Order` (fallback 1); `id` estável (preferir `SPX TN`, senão `seq/index`).
- `src/utils/routing/selectors.ts` (puros): `totalPoints`, `totalPackages`, `assignedPointIds`, `unassignedPoints`, `stopCentroid(points)`, `packagesInStop`.
- Testes: conversão a partir da estrutura real do arquivo Shopee + cada seletor.

**Critérios de aceite:**
- Tipos compilam (`tsc --noEmit`); zero `any`.
- Conversor mapeia corretamente o arquivo real (`15-05-2026...xlsx`).
- Seletores cobertos por teste (atribuídos/não-atribuídos, centroide, contagens).

**Dependências novas:** nenhuma.
**Riscos:** `id` estável quando não há `SPX TN` — definir regra determinística e testá-la.

---

## TASK-RF-005 - Motor de roteamento local (port do protótipo → módulo TS) [XG, dividir]

- **Status:** Pendente
- **Modo:** Strict
- **Valor:** Crítico
- **Urgência:** IMEDIATA
- **Esforço-H/IA:** XG/XG
- **Data-hora origem:** 22/06/26 22:45
- **Dependências:** ADR-002 (protótipo validado em TASK-RF-001)
- **REQ/ADR/DT:** ADR-002; `prototipos/roteamento-osm/`
- **Observações:** XG — **executar pelas subtarefas**, nunca de uma vez. Cada subtarefa fecha com testes verdes.

**Objetivo:** transformar o núcleo validado no protótipo num módulo de produção em `src/utils/routing/`, com tipos, testes e performance/offline.

### TASK-RF-005.1 - Núcleo do grafo + A* (tipado + testado)
- **Esforço-H/IA:** G/M · **Dep:** -
- Portar `core.mjs` do protótipo para: `src/utils/routing/geo.ts` (`haversine`), `graph.ts` (`buildGraph`, tipos `RoadGraph`/`GraphNode`/`Edge`, `onewayDirection`, `nearestNode`), `aStar.ts` (`aStar`), `streets.ts` (`streetsAlong`).
- Migrar os testes do protótipo (grid sintético com mão única) para Vitest.
- **Aceite:** sentido permitido vai direto; contramão desvia; sem fetch/Leaflet acoplado; testes verdes.

### TASK-RF-005.2 - Camada de dados OSM (Overpass → grafo)
- **Esforço-H/IA:** M/M · **Dep:** 005.1
- `src/utils/routing/osm.ts`: montar query Overpass por bbox (filtrando vias navegáveis), `fetch`, parsear `elements` → `RoadGraph` (reusa `buildGraph`). Tipar a resposta do Overpass. Tratar erro/timeout com mensagem de UI (`UI_LABELS`).
- **Aceite:** dado um bbox, retorna um `RoadGraph` válido; erro de rede tratado sem quebrar a UI.

### TASK-RF-005.3 - Cache do grafo + offline (IndexedDB)
- **Esforço-H/IA:** G/M · **Dep:** 005.2
- `src/services/graphCache.ts`: persistir grafo por bbox em IndexedDB; carregar do cache antes de bater no Overpass; invalidação simples (TTL/versão). Habilita uso offline do PWA.
- **Dependência nova a propor:** `idb`.
- **Aceite:** 2ª abertura da mesma área não rebaixa do Overpass; funciona offline após 1º carregamento.

### TASK-RF-005.4 - A* com fila de prioridade (heap)
- **Esforço-H/IA:** M/M · **Dep:** 005.1
- Trocar a varredura linear da fronteira por min-heap (implementação própria, sem lib). Benchmark simples (tempo médio numa rota de Ipanema).
- **Aceite:** resultado idêntico ao 005.1; tempo aceitável (<~150ms) em bairro inteiro.

### TASK-RF-005.5 - Map matching em aresta (projeção no segmento)
- **Esforço-H/IA:** M/G · **Dep:** 005.1
- Encaixar o ponto de entrega no **segmento** de rua mais próximo (projeção no segmento), não apenas no nó. Melhora a fidelidade do início/fim do traçado.
- **Aceite:** ponto no meio do quarteirão gruda na via correta; teste de projeção.

**Critérios de aceite (RF-005):** dado bbox + 2 pontos, retorna polilinha + distância respeitando `oneway`, com cache e performance aceitáveis. Testes por subtarefa.
**Dependências novas:** `idb` (005.3). Heap próprio, sem lib.
**Riscos:** tamanho do grafo no navegador (mitigar com recorte/bbox e cache); qualidade da tag `oneway` no OSM.

---

## TASK-RF-006 - UI de construção da rota (planejamento) [XG, dividir]

- **Status:** Pendente
- **Modo:** Strict
- **Valor:** Crítico
- **Urgência:** IMEDIATA
- **Esforço-H/IA:** XG/XG
- **Data-hora origem:** 22/06/26 22:45
- **Dependências:** TASK-RF-004, TASK-RF-005, TASK-RF-002 (isSingleRoute)
- **REQ/ADR/DT:** draft §6
- **Observações:** XG — executar pelas subtarefas. Coração da experiência. Reaproveitar `RouteMap` (Leaflet) onde possível, sem inflar componente (preferir componentes pequenos e reutilizáveis).

**Objetivo:** implementar o fluxo do draft §6 — montar paradas por raio, sugerir a próxima, traçar a rua, contar pontos/pacotes, salvar.

### TASK-RF-006.1 - Estado da construção (useReducer)
- **Esforço-H/IA:** G/M · **Dep:** RF-004
- `src/hooks/useRouteBuilder.ts`: `useReducer` com ações `SELECT_START`, `SUGGEST_NEXT`, `OPEN_STOP_DRAFT`, `SET_RADIUS`, `ADD_POINT`, `REMOVE_POINT`, `COMMIT_STOP`, `RESET`. Estado: pontos, paradas, rascunho da parada atual, `startPoint`. Abre caminho p/ desfazer/refazer.
- **Aceite:** transições testadas (reducer puro); sem lógica de UI no reducer.

### TASK-RF-006.2 - Render dos pontos + contadores
- **Esforço-H/IA:** M/M · **Dep:** 006.1
- Pontos não-atribuídos em **cinza desbotado** com pacotes faltando; contadores globais (paradas / pontos / pacotes definidos vs total) via seletores (RF-004).
- **Aceite:** o que falta fica visualmente distinto; contadores batem com os seletores.

### TASK-RF-006.3 - Ponto inicial + sugestão da próxima parada
- **Esforço-H/IA:** M/M · **Dep:** 006.1, RF-005
- Escolher início; app sugere o ponto não-visitado **mais próximo** (vizinho mais próximo; distância de grafo via RF-005, fallback haversine); linha de sugestão. Sem TSP.
- **Aceite:** sugestão aponta o mais próximo; usuário pode ignorar e escolher outro.

### TASK-RF-006.4 - Painel de raio + agrupamento da parada
- **Esforço-H/IA:** G/G · **Dep:** 006.1
- Tocar num ponto abre painel de raio (m); inclui na parada todos os pontos no raio; **add/remove manual**; preview antes de confirmar.
- **Dependência nova a propor:** `@turf/turf` (ponto-em-raio) — ou helper haversine manual.
- **Aceite:** raio agrupa corretamente; ajuste manual funciona; confirmar cria `RouteStop`.

### TASK-RF-006.5 - Marcador de parada (ordinal + expandir)
- **Esforço-H/IA:** M/G · **Dep:** 006.4, RF-007
- Parada não-selecionada mostra só **um marcador com o número ordinal**; ao selecionar, expande os pontos individuais + infos (qtd pontos, pacotes, tempo estimado).
- **Aceite:** colapsado mostra 1 marcador; expandido mostra pontos + infos.

### TASK-RF-006.6 - Traçado entre paradas (rua real + km)
- **Esforço-H/IA:** M/M · **Dep:** 006.3, RF-005
- Ao confirmar a próxima parada, traçar a **rua real** (RF-005) da parada anterior à nova; mostrar km acumulado.
- **Aceite:** linha segue as ruas respeitando mão única; km coerente.

### TASK-RF-006.7 - Validação de completude + salvar
- **Esforço-H/IA:** M/M · **Dep:** 006.1, RF-008
- Só permite salvar quando **todos** os pontos/pacotes estão atribuídos; chama a persistência (RF-008).
- **Aceite:** salvar bloqueado até completar; rota salva recuperável.

**Critérios de aceite (RF-006):** fluxo do draft §6 ponta a ponta. Testes de reducer + componentes-chave.
**Dependências novas:** `@turf/turf` (006.4, opcional).
**Riscos:** complexidade de estado (mitigar com reducer testado); performance de re-render com muitos marcadores (memoização).

---

## TASK-RF-007 - Estimativas de tempo (config a pé / veículo)

- **Status:** Pendente
- **Modo:** Standard
- **Valor:** Importante
- **Urgência:** IMEDIATA
- **Esforço-H/IA:** M/M
- **Data-hora origem:** 22/06/26 22:45
- **Dependências:** TASK-RF-004, TASK-RF-006
- **REQ/ADR/DT:** draft §2/§6
- **Observações:** Diferencial do produto (tempo realista a pé).

**Objetivo:** estimar tempo por parada (entrega a pé) e deslocamento entre paradas (km/h configurável).

**Subtarefas:**
- `src/utils/routing/estimates.ts`: `stopTime(stop, config)` = (pontos ou pacotes) × `walkingMinutesPerDelivery`; `travelTime(distanceKm, config)` = distância / `vehicleSpeedKmh`.
- Painel de config (texto em `UI_LABELS`): minutos por entrega e km/h; persistir em `PlannedRoute.config`.
- Exibir estimativa na parada (RF-006.5) e no resumo.

**Critérios de aceite:** números aparecem na parada e no total; funções cobertas por teste; config persiste.
**Dependências novas:** nenhuma.

---

## TASK-RF-008 - Persistência da rota planejada (IndexedDB)

- **Status:** Pendente
- **Modo:** Standard
- **Valor:** Crítico
- **Urgência:** IMEDIATA
- **Esforço-H/IA:** M/M
- **Data-hora origem:** 22/06/26 22:45
- **Dependências:** TASK-RF-004
- **REQ/ADR/DT:** draft §5/§9
- **Observações:** O app hoje **não persiste nada**; esta tarefa introduz armazenamento local. Pode reusar `idb` da RF-005.3.

**Objetivo:** salvar/carregar/listar `PlannedRoute` localmente.

**Subtarefas:**
- `src/services/routeStorage.ts`: CRUD de `PlannedRoute` em IndexedDB (criar, ler, listar, apagar).
- Lista de rotas salvas (para reabrir/executar).
- Testes com `fake-indexeddb`.

**Critérios de aceite:** salvar e reabrir uma rota intacta; listar rotas; testes verdes.
**Dependências novas a propor:** `idb`, `fake-indexeddb` (dev).
**Riscos:** versionamento do schema do IndexedDB (definir `version` + `upgrade`).

---

## TASK-RF-009 - Modo execução da rota [XG, dividir]

- **Status:** Pendente
- **Modo:** Strict
- **Valor:** Crítico
- **Urgência:** IMEDIATA
- **Esforço-H/IA:** G/G
- **Data-hora origem:** 22/06/26 22:45
- **Dependências:** TASK-RF-004, TASK-RF-006, TASK-RF-008
- **REQ/ADR/DT:** draft §8
- **Observações:** Sem GPS em tempo real (decisão consciente do draft). Execução manual e guiada.

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

## TASK-RF-010 - Ponto de entrada: ramificar isSingleRoute → fluxo roteirizador

- **Status:** Pendente
- **Modo:** Standard
- **Valor:** Importante
- **Urgência:** IMEDIATA
- **Esforço-H/IA:** M/M
- **Data-hora origem:** 22/06/26 22:45
- **Dependências:** TASK-RF-002, TASK-RF-006
- **REQ/ADR/DT:** draft §3
- **Observações:** Liga o sinal já existente (`isSingleRoute`) ao novo fluxo, sem quebrar o multi-rota.

**Objetivo:** quando `isSingleRoute`, oferecer "Planejar rota" (fluxo de construção) em vez do seletor multi-rota.

**Subtarefas:**
- Ajustar `RouteViewer` para ler `isSingleRoute` e rotear para a tela de construção (RF-006).
- Manter o caminho multi-rota intacto (visualizador atual).
- (Soft dep) TASK-RF-003 (alias de colunas) para endereço/bairro/CEP aparecerem nas paradas.

**Critérios de aceite:** arquivo de rota única abre o roteirizador; romaneio multi-rota continua no visualizador.
**Dependências novas:** nenhuma.

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
| TASK-RF-003 | Alias de cabeçalhos do arquivo real (Bairro→Neighborhood, Zipcode/Postal code→Zipcode; expor AT ID/SPX TN) para tabela/tooltip da rota única | Standard | Importante | Normal | M/M | - | TASK-RF-002 | [ ] | 22/06/26 22:28 |
| TASK-CHORE-002 | Rodar a suíte completa (`npm run test`) em ambiente estável (Windows/CI) e registrar o verde | Light | Importante | Normal | P/P | - | TASK-RF-002 | [ ] | 22/06/26 22:28 |



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
