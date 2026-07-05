# Tarefas Pendentes

> Backlog priorizado. Cada tarefa entra como **uma única linha** (urgência Normal) ou **bloco em lista** (urgência Imediata). Sem detalhes de implementação — o plano nasce só quando a tarefa vira "Em Andamento".
>
> Ordenação: por **prioridade combinada** (Valor + Urgência), maior no topo. Em empate, menor esforço primeiro. Não ordenar por data.

---

## Imediatas

> Tarefas urgentes que carregam contexto extra. Bloco em lista, no topo.
>
> **Épico: Roteirizador a pé (Nível B).** Implementação completa da visão em [`docs/rascunhos/draft-roteirizador-a-pe.md`](../rascunhos/draft-roteirizador-a-pe.md), decisão de roteamento em [`ADR-002`](../arquitetura/ADR/ADR-002.md). **Ordem sugerida (rev. 05/07/26):** **fase 1 de UI — RF-011 (shell) → RF-022 (.1→.6, telas de média fidelidade com modo Original/visualização)** → depois **RF-006 (.1→.7, Meu roteiro/edição) → RF-007 → RF-008 → RF-010 → RF-009 (.1→.4, execução) → RF-012 → RF-013**. (RF-003/004/005/020/021 ✅; RF-014 absorvida pela RF-022.) Cada tarefa só vira "Em Andamento" uma por vez (núcleo §3); o plano fino nasce ali.
>
> ⚠️ **Decisões transversais (valem para o épico todo):**
> - **Estado:** `useReducer` por feature (conforme draft §6). Zustand só se a complexidade exigir — e **não instalar sem aprovação** (anti-padrão do núcleo §5).
> - **Dependências novas precisam de aprovação explícita** antes de instalar. Candidatas previstas: `idb` (IndexedDB), `@turf/turf` (geometria), `fake-indexeddb` (dev/teste). Propor com justificativa em cada tarefa.
> - **Sem `any`** (núcleo §5); texto de UI sempre em `UI_LABELS` (ADR-001); arquivos novos em `src/utils/routing/` (lógica pura) e `src/services/` (IO/persistência), seguindo a convenção `utils/` do projeto.
> - **Gate de cada tarefa:** `npx tsc --noEmit` + `npm run test` verdes antes de concluir (rotular APROVADO/FALHOU/NÃO EXECUTADO).

---

> ✅ **TASK-RF-004 concluída** — ver `concluidas/2026-06-22--23h35--TASK-RF-004.md`.

<!-- TASK-RF-003 movida para em-andamento.md (em execução, 25/06/26) -->

> ✅ **TASK-BG-005 concluída** (25/06) — `parseCoordinate` locale-aware (vírgula/ponto/escalado, qualquer precisão) — ver `concluidas/2026-06-25--15h41--TASK-BG-005.md`.
>
> ✅ **TASK-RF-015, TASK-RF-017, TASK-RF-018 e TASK-REF-007 concluídas** (25/06, lote da rota única) — ver `concluidas/2026-06-25--14h09--*`.

> ✅ **TASK-RF-005 (motor de roteamento) CONCLUÍDA** (25/06) — todas as 5 subtarefas. Módulo em `src/utils/routing/` (`geo`/`graph`/`aStar`/`minHeap`/`streets`/`osm`/`match`) + `src/services/graphCache.ts`: grafo direcionado (mão única = aresta ausente), dados OSM/Overpass com cache offline (IndexedDB via `idb`), A* com heap próprio, nomes de rua e **map matching em aresta**. Critério geral atendido (bbox + 2 pontos → polilinha + distância respeitando `oneway`, com cache/perf). Ver `concluidas/2026-06-25--{17h09…18h15}--TASK-RF-005.{1..5}.md`. **Próximo épico: RF-006 (UI de construção), que consome o motor.**

---

## ✅ TASK-RF-020 - Marcadores SVG no visualizador Original — CONCLUÍDA (26/06)

> Épico encerrado. Modo Original completo conforme ADR-008 (marcadores SVG, 1 por parada, escala por zoom, redesenho, interações). Registros em `concluidas/2026-06-26--*--TASK-RF-020.*.md`:
>
> - **.1** Componente de marcador SVG parametrizável — ✅ `…12h09…`
> - **.2** Integrar no `RouteMap` (agrupar por Stop) — ✅ `…12h46…`
> - **.4** Ajuste visual (escala por zoom + badge reposicionado) — ✅ `…14h40…`
> - **.5** Redesenho (sempre quadrado colapsado + badge dentro + rótulo `parada-seq`) + docs — ✅ `…15h43…`
> - **.3** Interações: expandir/colapsar, seleção, popup do endereço — ✅ `…16h12…`
>
> **Próximo épico sugerido:** RF-006 (UI de construção da rota — roteirização), que consome o motor RF-005.

---

> ✅ **TASK-RF-021 concluída** (05/07) — modelo migrado para a parada do veículo (`anchorPointId` → `vehicleStop: LatLng`) — ver `concluidas/2026-07-05--03h47--TASK-RF-021.md`. **RF-006 destravado.**

---

## TASK-RF-011 - App shell mobile-first (header + bottom nav + React Router) — abre a fase 1

- **Status:** Pendente
- **Modo:** Strict
- **Valor:** Crítico
- **Urgência:** IMEDIATA
- **Esforço-H/IA:** G/M
- **Data-hora origem:** 22/06/26 23:50
- **Dependências:** ADR-003
- **REQ/ADR/DT:** ADR-003; RF-38; `fluxo-roteirizacao.md` §11 (rev. 26/06); `analise-comercial-2.0.md` §10
- **Observações:** Reescreve o shell do `App.tsx`. Dependência nova `react-router-dom` (**já aprovada** na ADR-003). **Pré-requisito da TASK-RF-022** (telas da fase 1). **Atualizada 05/07/26** para as decisões de navegação de 26/06 — antes falava em abas "Mapa/Rotas"; o correto é **HOME (enviar) + Rotas (salvos)** com telas de foco sem abas.

**Objetivo:** dar ao app um shell mobile-first com navegação por abas e telas de foco.

**Subtarefas:**
- Instalar e configurar `react-router-dom`.
- `AppShell`: header (título + engrenagem → Configurações de Rota + voltar quando aplicável) e **bottom tab bar** com **2 abas**: **HOME** (`/` — enviar/importar) e **Rotas** (`/rotas` — salvos). (3ª aba "Configurações" é opcional, a decidir; **não** criar aba "Roteiro".)
- **Bottom-nav some nas telas de foco** (Sumário e mapa abertos). Navegação do "voltar": fechar mapa → Sumário; voltar do Sumário → Rotas (nav reaparece) — RF-38.
- Esqueleto navegável apenas: o conteúdo real das telas vem da TASK-RF-022; nesta tarefa o `RouteViewer` atual precisa continuar acessível **sem regressão**.
- Garantir botão **voltar do Android** previsível.

**Critérios de aceite:** navega HOME↔Rotas; nav some nas telas de foco; voltar do Android funciona; fluxo atual (upload → visualizador) intocado.
**Dependências novas:** `react-router-dom` (aprovada na ADR-003; instalar com aprovação no plano fino).
**Riscos:** mexer no `App.tsx` sem quebrar o fluxo atual (cobrir com os testes de integração do `RouteViewer`).

---

## TASK-RF-022 - Telas de média fidelidade — fase 1: navegação + modo Original (visualização) [XG, dividir]

- **Status:** Pendente
- **Modo:** Strict
- **Valor:** Crítico
- **Urgência:** IMEDIATA
- **Esforço-H/IA:** XG/XG
- **Data-hora origem:** 05/07/26 04:06
- **Dependências:** TASK-RF-011 (shell), TASK-RF-002 (isSingleRoute); RF-020 ✅ (marcadores SVG do Original)
- **REQ/ADR/DT:** RF-20 (parte Original), RF-43, RF-44, RF-46, RN-21, RN-23; ADR-003, ADR-008; `fluxo-modo-original.md` §5/§6; `fluxo-roteirizacao.md` §11/§13/§15; `prototipos/telas-media-fidelidade/` (telas 1–5 + README)
- **Observações:** XG — executar pelas subtarefas, uma por vez. Implementa as telas dos protótipos de média fidelidade **apenas com o modo Original (visualização)**; o lado "Meu roteiro" (edição/rascunho — RF-006), a execução (RF-009) e a persistência de Roteiros (RF-008) vêm depois **reaproveitando a estrutura criada aqui**. **Contrato de reuso (lei do épico):** painel inferior **único** para os dois modos (prop `readOnly` + slots de ação); toggle com lado desabilitável; Sumário com seção "Info Meu Roteiro" condicional; cards de Rotas com estado sem/com roteiro. ⚠️ **Fontes:** os `.md` decidem, as imagens ilustram (README dos protótipos). **`docs/prompt-prototipacao-ui.md` está DESATUALIZADO** (24/06 — âncora-endereço, paleta por parada, "3 botões fixos" no Sumário): **não usar como spec**; valem `fluxo-modo-original.md` + `fluxo-roteirizacao.md` (decisões 26/06). Absorve a antiga TASK-RF-014.

**Objetivo:** o usuário navega **HOME → Rotas → Sumário → mapa Original** ponta a ponta, com romaneios salvos no aparelho — sem regressão do visualizador atual — e cada componente pronto (por contrato de props) para ganhar o modo editável depois.

### TASK-RF-022.1 - Serviço de romaneios salvos (IndexedDB) + detecção de duplicado
- **Esforço-H/IA:** M/M · **Dep:** nenhuma (`idb` e `fake-indexeddb` já instalados desde a RF-005.3)
- `src/services/manifestStorage.ts`: salvar/listar/reabrir/apagar **romaneios importados** (Único e Multi) com metadados (tipo, data de import, ATs/rotas contidas) + **hash do conteúdo do arquivo** para dedup (RN-23: arquivo idêntico → não duplica, avisa "já importado" e seleciona o existente). Decidir no plano fino se persiste o `ProcessedResult` ou o binário bruto (reprocessável). Versionamento do schema (`version` + `upgrade`), distinto do store do `graphCache`.
- **Aceite:** reabrir romaneio sem reenviar (RF-46); duplicado detectado; testes com `fake-indexeddb`.

### TASK-RF-022.2 - Tela HOME (enviar) com instruções em spoiler
- **Esforço-H/IA:** M/M · **Dep:** 022.1, RF-011
- HOME é **só enviar** (decisão 26/06): upload `.xlsx/.csv` (fluxo atual preservado) + botão "Importar roteiro (.json)" **presente porém desabilitado** ("em breve" — liga na RF-013). Instruções atuais viram **spoiler** com dois blocos: multi-rota (texto atual) + rota única ("exporte sua rota no app oficial da empresa e importe aqui"). Ao processar com sucesso, salva o romaneio via 022.1 (com o fluxo de dedup). Ref: `1-HOME.png`; fluxo §15.2; RF-44 (parte HOME).
- **Aceite:** upload funciona como hoje; instruções colapsáveis e atualizadas; romaneio salvo ao importar; **sem** lista de salvos na HOME (mora na aba Rotas).

### TASK-RF-022.3 - Aba Rotas: lista de salvos (cards tipados + chips por rota/AT)
- **Esforço-H/IA:** M/G · **Dep:** 022.1, RF-011
- Cards **tipados** por cor/rótulo — **Romaneio Único** (data + chips por AT) e **Romaneio Multi** (data + chips por rota); tipo **Roteiro Exportado** fica previsto no modelo do card mas só aparece após a RF-013. Ícone do chip indica estado **sem/com roteiro** (fase 1: sempre "sem"; estrutura pronta — RN-21: máx. 1 roteiro por rota). Tocar num chip → **Sumário** daquela rota (**sem** botão "Criar Roteiro" aqui — decisão 26/06). Busca por AT (reusa `useRouteSearch`) para multi-rota grande. Redirect do dedup (022.1) cai aqui com o item selecionado. Estado vazio amigável. Ref: `2-ROTAS.png`, `3-SELECIONAR-rotas-apos-envio.png`; fluxo §15.2; RF-44 (parte lista).
- **Aceite:** listar/reabrir/apagar romaneios salvos; chip abre o Sumário da rota certa; multi-rota mostra todas as rotas; dedup seleciona o existente.

### TASK-RF-022.4 - Sumário como tela de foco (botão adaptativo + seção Info Meu Roteiro)
- **Esforço-H/IA:** M/M · **Dep:** 022.3, RF-011
- `RouteSummary` reaproveitado numa **tela de foco** (sem bottom-nav; voltar → Rotas). **Nenhuma info resumida sai.** Botões (RF-43, rev. 26/06): **Ver Original** (abre o mapa, 022.5) · **Criar Roteiro** (adaptativo: fase 1 = desabilitado "em breve"; vira "Ver Meu Roteiro" quando houver roteiro — liga na RF-006) · **Tabela Simplificada** · **Tabela Original**. Seção **"Info Meu Roteiro"** condicional, **separada** dos dados do romaneio (fase 1: oculta; componente e props prontos para a RF-007/008 preencherem). Ref: `4-detalhes-sumario.png`; fluxo §15.1.
- **Aceite:** rota única e multi abrem o Sumário pela aba Rotas; Ver Original abre o mapa certo; tabelas acessíveis; nenhuma métrica atual perdida.

### TASK-RF-022.5 - Tela do mapa (foco) + toggle `Original | Meu roteiro` (stub)
- **Esforço-H/IA:** M/M · **Dep:** 022.4, RF-011
- Mapa como **tela de foco** (fechar → Sumário). **Toggle segmentado no topo** (abaixo do header), padrão **Original**; lado **"Meu roteiro" desabilitado** ("em breve") — a RF-010 liga esse lado ao fluxo da RF-006. Reaproveita `RouteMap` + marcadores SVG (RF-020) **intactos**. **UI mínima**: mapa dominante, overlays compactos/colapsáveis (fluxo §15.4). Ref: `5-Visualizacao-de-Parada.png`; RF-20 (parte Original); fluxo §11 ("Modos do mapa").
- **Aceite:** "Ver Original" abre este mapa com a rota certa (única e multi); toggle visível com lado direito desabilitado; interações da RF-020 (expandir/colapsar/selecionar) preservadas.

### TASK-RF-022.6 - Painel inferior do endereço compartilhado (read-only no Original)
- **Esforço-H/IA:** M/G · **Dep:** 022.5 (integração; o componente pode nascer antes, sobre o `RouteMap` atual)
- Substituir o **popup** do endereço (RF-020.3) pelo **painel inferior (bottom sheet) único dos dois modos** — `fluxo-modo-original.md` §6: **lista de pacotes** (código `SPX TN` + sequência), **endereço completo**, **complemento** e **tipo em texto** (Comercial/Residencial/Indefinido). **Contrato de reuso:** prop de modo (`readOnly`) + slots tipados para as ações do Meu roteiro (âncora/edição — RF-006) e dados de execução (RF-009); no Original **nada de botão de edição**. Trocar de endereço na mesma parada troca o conteúdo **sem colapsar** a expansão. Texto via `UI_LABELS` (ADR-001).
- **Aceite:** clicar num endereço expandido abre o painel (não mais popup); multi-pacote lista todos os pacotes com Stop/Seq/código; alternância entre endereços sem fechar; componente aceita o modo editável futuro sem refactor (props/slots tipados).

**Critérios de aceite (RF-022):** fluxo HOME → Rotas → Sumário → mapa Original ponta a ponta com romaneios persistidos; visualizador atual (multi e rota única) **sem regressão** (testes de integração verdes); contrato de reuso documentado nas props dos componentes compartilhados.
**Dependências novas:** nenhuma (`idb`/`fake-indexeddb` já instalados; `react-router-dom` entra pela RF-011).
**Riscos:** regressão do fluxo atual do `RouteViewer` (mitigar com os testes de integração existentes); escopo de UI crescer para edição — **segurar no read-only** (edição é RF-006); decisão de persistência (bruto × processado) na 022.1 — registrar no plano fino, ADR só se virar decisão estrutural.

---

## TASK-RF-006 - UI de construção da rota (planejamento) [XG, dividir]

- **Status:** Pendente
- **Modo:** Strict
- **Valor:** Crítico
- **Urgência:** IMEDIATA
- **Esforço-H/IA:** XG/XG
- **Data-hora origem:** 22/06/26 22:45
- **Dependências:** TASK-RF-004, TASK-RF-005, TASK-RF-002 (isSingleRoute), TASK-RF-021 (modelo da parada do veículo)
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

## TASK-RF-010 - Ponto de entrada: ramificar isSingleRoute → fluxo roteirizador

- **Status:** Pendente
- **Modo:** Standard
- **Valor:** Importante
- **Urgência:** IMEDIATA
- **Esforço-H/IA:** M/M
- **Data-hora origem:** 22/06/26 22:45
- **Dependências:** TASK-RF-002, TASK-RF-006, TASK-RF-022.5 (toggle)
- **REQ/ADR/DT:** draft §3; RF-20
- **Observações:** Liga o sinal já existente (`isSingleRoute`) ao novo fluxo, sem quebrar o multi-rota. **Nota 05/07/26:** o **toggle** `Original | Meu roteiro` nasce na **TASK-RF-022.5** (com o lado direito desabilitado); esta tarefa passa a ser **ligar o lado "Meu roteiro"** ao fluxo de construção (RF-006), na rota única e na rota selecionada do multi.

**Objetivo:** quando `isSingleRoute`, oferecer "Planejar rota" (fluxo de construção) em vez do seletor multi-rota.

**Subtarefas:**
- Ajustar `RouteViewer` para ler `isSingleRoute` e rotear para a tela de construção (RF-006).
- Manter o caminho multi-rota intacto (visualizador atual).
- (Soft dep) TASK-RF-003 (alias de colunas) para endereço/bairro/CEP aparecerem nas paradas.

**Critérios de aceite:** arquivo de rota única abre o roteirizador; romaneio multi-rota continua no visualizador.
**Dependências novas:** nenhuma.

---

<!-- TASK-RF-011 movida para o topo das Imediatas em 05/07/26 (abre a fase 1 de UI; texto atualizado para as decisões de navegação de 26/06). -->

## TASK-RF-012 - Auto-roteirizar (agrupamento por raio)

- **Status:** Pendente
- **Modo:** Standard
- **Valor:** Importante
- **Urgência:** IMEDIATA
- **Esforço-H/IA:** M/M
- **Data-hora origem:** 22/06/26 23:50
- **Dependências:** TASK-RF-004, TASK-RF-005 (distância), TASK-RF-006 (estado)
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
- **Dependências:** TASK-RF-004, TASK-RF-008
- **REQ/ADR/DT:** `fluxo-roteirizacao.md` §13
- **Observações:** Caso de uso central: passar a rota pronta para um **ajudante** ou trocar de aparelho (modelo é por dispositivo, sem nuvem).

**Objetivo:** exportar/importar um `PlannedRoute` completo (pontos + paradas + âncoras + config) como arquivo JSON.

**Subtarefas:**
- Serializar/parsear `PlannedRoute` (+ pontos) em JSON versionado; validar no import.
- Exportar (download de arquivo) e importar (seleção de arquivo) — distinto do import de planilha Shopee.

**Critérios de aceite:** exportar e reimportar (outro aparelho) reconstrói a rota idêntica, com config; testes de round-trip serialize/parse.
**Dependências novas:** nenhuma.

---

> 🔀 **TASK-RF-014 absorvida pela TASK-RF-022** (05/07/26): o escopo estava desatualizado (rev. 26/06 dos fluxos) e duplicava a fase 1 — Sumário lançador/adaptativo → **RF-022.4**; tela inicial/instruções em spoiler → **RF-022.2**; lista de salvos → **RF-022.3**; UI mínima no mapa → **RF-022.5**. O número **014 não será reaproveitado** (regra de numeração do núcleo §4.4).

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
<!-- TASK-RF-003 movida para "Imediatas" (priorizada em 24/06/26, a pedido do humano) -->

| TASK-CHORE-002 | Rodar a suíte completa (`npm run test`) em ambiente estável (Windows/CI) e registrar o verde | Light | Importante | Normal | P/P | - | TASK-RF-002 | [ ] | 22/06/26 22:28 |
| TASK-DOC-003 | Sincronizar `contexto-projeto-ai.md`: deixa de ser "SPA de página única sem router" (ADR-003) | Standard | Importante | Normal | P/P | TASK-RF-011 | ADR-003 | [ ] | 22/06/26 23:50 |
| TASK-TEST-002 | Testar o zoom do mapa e definir o limite mínimo ideal (detalhe de rua p/ roteirizar a pé); alinhar `MAP_CONFIG.ZOOM.MIN` com o bloqueio do tile worker (hoje z<14) | Standard | Importante | Normal | P/M | - | RNF-12, RNF-15 | [ ] | 24/06/26 14:50 |



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
