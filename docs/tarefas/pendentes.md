# Tarefas Pendentes

> Backlog priorizado. Cada tarefa entra como **uma única linha** (urgência Normal) ou **bloco em lista** (urgência Imediata). Sem detalhes de implementação — o plano nasce só quando a tarefa vira "Em Andamento".
>
> Ordenação: por **prioridade combinada** (Valor + Urgência), maior no topo. Em empate, menor esforço primeiro. Não ordenar por data.

---

## Imediatas

> Tarefas urgentes que carregam contexto extra. Bloco em lista, no topo.
>
> **Épico: Roteirizador a pé (Nível B).** Implementação completa da visão em [`docs/rascunhos/draft-roteirizador-a-pe.md`](../rascunhos/draft-roteirizador-a-pe.md), decisão de roteamento em [`ADR-002`](../arquitetura/ADR/ADR-002.md). **Ordem sugerida (rev. 05/07/26 22h05):** fase 1 ✅ (RF-011 + RF-022) → **RF-023.1 (doc de design) ∥ REF-012 (tema Neon Flux dark) → RF-023.2→.5 (painel dinâmico — fase Original)** → depois **RF-006 (.1→.7, Meu roteiro/edição) → RF-007 → RF-008 → RF-010 → RF-009 (.1→.4, execução) → RF-012 → RF-013**. (RF-003/004/005/020/021/022 ✅; RF-014 absorvida pela RF-022.) Cada tarefa só vira "Em Andamento" uma por vez (núcleo §3); o plano fino nasce ali.
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

> ✅ **TASK-RF-011 concluída** (05/07) — app shell com BrowserRouter (HOME/Rotas, `FocusShell` sem nav, `_redirects` p/ Cloudflare Pages; ADR-003 atualizada) — ver `concluidas/2026-07-05--04h47--TASK-RF-011.md`. **RF-022 destravada.**

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

### ✅ TASK-RF-022.1 - Serviço de romaneios salvos (IndexedDB) + detecção de duplicado — CONCLUÍDA (05/07)
> `src/services/manifestStorage.ts` (DB `danfo-manifests`, bytes brutos + meta, dedup por SHA-256/RN-23) + `src/utils/hash.ts` + `src/types/manifest.ts`. Decisão do plano fino: **bytes brutos reprocessáveis** (não `ProcessedResult`). API p/ as próximas: `saveManifest(file, processed) → saved|duplicate|invalid|error` · `listManifests()` · `getManifest(id)` (bytes → `new File` → `processExcelFile`) · `deleteManifest(id)`. Ver `concluidas/2026-07-05--18h08--TASK-RF-022.1.md`.

### ✅ TASK-RF-022.2 - Tela HOME (enviar) com instruções em spoiler — CONCLUÍDA (05/07)
> Spoiler `<details>` nativo com blocos multi-rota + rota única (ExampleTable dentro); botão "Importar roteiro (.json)" stub desabilitado (liga na RF-013); upload salva via `saveManifest` e o hook expõe `manifestSave` (avisos salvo/duplicado/falha — o **redirect** do duplicado p/ aba Rotas fica na **.3**). Ver `concluidas/2026-07-05--19h20--TASK-RF-022.2.md`.

### ✅ TASK-RF-022.3 - Aba Rotas: lista de salvos (cards tipados + chips por rota/AT) — CONCLUÍDA (05/07)
> Cards tipados (`ManifestCard` + `RouteChip` com contrato `hasRoteiro?` p/ RN-21), reabrir via deep link **`/?romaneio={id}&rota={nome}`** (`loadManifest` no hook — a .4 troca o destino p/ o Sumário de foco), apagar com confirmação (Dialog), busca por rota/AT sobre as metas, **RN-23 completa** (duplicado → `/rotas?sel=` com card destacado). **RF-46 ✅**. Ver `concluidas/2026-07-05--19h42--TASK-RF-022.3.md`.

### ✅ TASK-RF-022.4 - Sumário como tela de foco — CONCLUÍDA (05/07)
> `/sumario?romaneio&rota` sob `FocusShell` (+ **voltar no header** — RF-38 completa); botões RF-43 ("Ver Original", "Criar Roteiro" stub via `extraActions`, tabelas); `PlannedRouteInfo` tipada pronta p/ RF-007/008; **pós-upload navega** (single → Sumário; multi → `/rotas?sel=`) — "HOME é só enviar" completo. Mapa segue modal (vira tela na .5). Ver `concluidas/2026-07-05--19h58--TASK-RF-022.4.md`.

### ✅ TASK-RF-022.5 - Tela do mapa (foco) + toggle `Original | Meu roteiro` — CONCLUÍDA (05/07)
> `/mapa?romaneio&rota` no `FocusShell`; `MapModeToggle` segmentado (contrato `roteiroEnabled?` p/ RF-010; "Meu roteiro" desabilitado); `RouteMap.embedded` (sem portal e **sem botão de fechar** — o voltar do header cumpre; regra: fechar só quando não há voltar); "Ver Original" do Sumário navega. RF-20 → 🟡. Ver `concluidas/2026-07-05--20h18--TASK-RF-022.5.md`.

### ✅ TASK-RF-022.6 - Painel inferior do endereço compartilhado — CONCLUÍDA (05/07)
> `AddressSheet` (§6) substitui o popup: read-only no Original (X é o único botão) + **slot `actions`** pronto p/ RF-006/009; `findAddressByKey` defensivo; Escape fecha o painel antes do mapa; trocar endereço na parada não colapsa. Mocks de popup removidos dos testes = trava de regressão. Ver `concluidas/2026-07-05--21h05--TASK-RF-022.6.md`.

> 🏁 **ÉPICO TASK-RF-022 CONCLUÍDO (05/07/26) — FASE 1 DA UI ENCERRADA.** Fluxo da spec ponta a ponta: **HOME** (enviar + spoiler + salvar/dedup) → **Rotas** (cards/chips + busca + apagar) → **Sumário** (foco, botões RF-43, Info Meu Roteiro pronta) → **Mapa** (foco, toggle `Original | Meu roteiro`, `AddressSheet` §6). Suíte 431/431. Contratos prontos para: RF-006 (slot `actions`, `roteiroEnabled`, botão adaptativo), RF-008 (`hasRoteiro` nos chips, `PlannedRouteInfo`), RF-009 (painel), RF-010 (toggle), RF-013 (Importar JSON, card Roteiro Exportado). **Próximo épico: TASK-RF-023 (painel dinâmico do mapa — fase Original), depois TASK-RF-006 (Meu roteiro).**

---

## ✅ TASK-REF-012 - Tema Neon Flux (dark) como padrão — CONCLUÍDA (05/07)
> App abre em **dark Neon Flux** (verde `#00FF9D` → azul `#00D1FF`; superfícies `#0A0C10`/`#161B22`); claro no toggle; **personalizar = editar só `src/styles/theme.css`** (accent2 tokenizado; `bg-brand-gradient` pronto p/ CTAs). ADR-006 revisada. Pendência estética anotada: radius 0.5rem do neonflux (hoje 1rem/pill). **Validação visual pendente pelo humano** (`npm run dev`). Ver `concluidas/2026-07-05--22h41--TASK-REF-012.md`.

<!-- Bloco original preservado abaixo para referência do escopo:

- **Status:** Pendente
- **Modo:** Standard
- **Valor:** Importante
- **Urgência:** IMEDIATA
- **Esforço-H/IA:** M/M
- **Data-hora origem:** 05/07/26 22:05
- **Dependências:** - (executar **antes da TASK-RF-023.2**, para o painel já nascer com o tema)
- **REQ/ADR/DT:** ADR-006 (revisar com nota — supersede parcial da identidade "Cyanide" claro-padrão); `prototipos/telas-media-fidelidade/neonflux.md` (fonte das cores); `tema-tailwind.md`
- **Observações:** **Decisão do humano (05/07/26):** usar **já** as cores do `neonflux.md` (**dark-native**, gradiente **verde `#00FF9D` → ciano/azul claro `#00D1FF`**, superfícies slate/navy) como **tema padrão** — *supersede* a nota "tema claro é o padrão" do README dos protótipos (o claro continua disponível no toggle). **Cores são provisórias por design**: o critério central é a **personalização fácil depois** — todo o chrome via **tokens CSS variables** (um lugar só para trocar a paleta), nada de cor hardcoded em componente (lei da ADR-004/módulo 13). **NÃO tocar** na paleta funcional do mapa (verde res / azul com / cinza indef / badge amarelo — ADR-008, locked) nem no marcador da âncora (slate + anel ciano, fluxo §3).

**Objetivo:** app abre em dark Neon Flux por padrão; claro/escuro alternáveis (`ThemeToggle` mantido); trocar a paleta futura = editar variáveis num único arquivo.

**Subtarefas:**
- Mapear as cores do `neonflux.md` para os tokens shadcn existentes (`--primary`, `--background`, `--card`, etc.) nos dois temas (dark = padrão Neon Flux; light = variante clara coerente).
- **Default dark**: `useTheme` passa a iniciar em dark (hoje: automático por sistema); toggle continua ciclando.
- Varredura de cores hardcoded fora de tokens nos componentes novos da fase 1 (shell, cards, chips, painel) — corrigir para tokens.
- Atualizar ADR-006 (nota de revisão: Neon Flux dark padrão, decisão 05/07) e `tema-tailwind.md`.

**Critérios de aceite:** app abre em Neon Flux dark; toggle claro/escuro funciona; **trocar a paleta = editar 1 arquivo de tokens** (provar trocando uma cor e vendo refletir); paleta funcional do mapa intocada; suíte verde.
**Dependências novas:** nenhuma.
-->

---

## TASK-RF-023 - Painel dinâmico do mapa (MapPanel) — fase Original [G, dividir]

- **Status:** Pendente
- **Modo:** Standard (épico com subtarefas; segue ADR-004/008 e os fluxos — sem decisão arquitetural nova)
- **Valor:** Crítico
- **Urgência:** IMEDIATA
- **Esforço-H/IA:** G/G
- **Data-hora origem:** 05/07/26 21:46
- **Dependências:** TASK-RF-022 ✅ (AddressSheet/MapPage/toggle); TASK-REF-012 (tema Neon Flux — antes da .2, p/ o painel nascer com o tema; componentes do painel **só via tokens**, zero cor hardcoded)
- **REQ/ADR/DT:** RF-12, RF-27 (drill-down), RF-28 (estrutura do card de pacotes); ADR-004 (shadcn), ADR-008; `fluxo-modo-original.md` §5/§6 (**a atualizar na .1**); `prototipos/telas-media-fidelidade/` telas 5–9 + README
- **Observações:** **Origem: feedback do humano 05/07** — o `AddressSheet` (022.6) cobre a informação da §6, mas o protótipo define um **painel inferior persistente e composto**, distante do card atual. **Diretriz do humano:** painel **sempre visível por padrão**, colapsado mostrando a parte superior (nº da parada + endereço); dinâmico e extensível por **slots**. **Fase Original primeiro** (só dados da planilha, SEM numeração nova — usar Stop/Sequence); o Meu roteiro (visualização/edição/rascunho/execução) preenche os slots depois (RF-006/009), sem reestruturar. Anatomia comum das telas 5–9: header (alça + modo/progresso + steppers ‹ › de parada + título/métricas) · corpo (ações contextuais [slot] + banner [slot] + lista de endereços com expansão até pacotes) · footer CTA [slot]. Árvore proposta: `MapPanel > PanelHeader (PanelModeBar + StopStepper + PanelTitle/MetricsRow) + PanelBody (slots + StopItemList > StopItem > PackageRow) + footer`, em `src/components/map/panel/`. ✅ **Decisões fechadas pelo humano (05/07/26):** (a) **`vaul` APROVADO** (Drawer do shadcn — gesto de arrastar + snap points + `modal=false`/fundo interativo + `dismissible=false`; dependência nova **já aprovada**, instalar na .2); (b) **nunca existe "nenhuma parada selecionada"**: o mapa abre com a **menor parada** já selecionada e o painel sempre mostra a **última selecionada** — clicar fora colapsa os marcadores expandidos, mas o painel **mantém** a parada (a .1 ajusta o `fluxo-modo-original.md` §5/§8, que hoje diz "limpa a seleção").

**Objetivo:** o mapa Original ganha o painel inferior do protótipo (tela 5, versão read-only): persistente, expansível, navegável por paradas, com drill-down endereço → pacotes — estrutura pronta para os modos do Meu roteiro.

### ✅ TASK-RF-023.1 - Doc de design + sincronizar a spec — CONCLUÍDA (05/07)
> **`docs/design/arvore-componentes-mapa.md`** criado (árvore MapPanel, contratos TS, **matriz modo × slot** cobrindo as telas 5–9, estados/interações, lib × novo, recorte Original) + `fluxo-modo-original.md` §5/§6/§8 atualizados (painel persistente centrado na parada; menor parada; nunca vazio). **Aguarda revisão do humano antes da .2.** Ver `concluidas/2026-07-05--22h58--TASK-RF-023.1.md`.

### ✅ TASK-RF-023.2 - Fundação MapPanel — CONCLUÍDA (05/07)
> `MapPanel` com **vaul@1.1.2** (snaps `96px/45%/90%`, não-modal, nunca fecha; sem Overlay; slots header/body/footer); **estado de interação lift-ado p/ a MapPage** (RouteMap controlado-com-fallback — **42/42 sem editar testes**); memória "nunca vazio" (abre na **menor parada**, derivação pura; clique fora não esvazia); corpo interino = AddressSheet `inline`. **Recorte:** seleção inicial veio da .5 p/ cá. ⚠️ **Smoke manual pendente** (gesto + pan/zoom c/ painel colapsado). Ver `concluidas/2026-07-05--23h42--TASK-RF-023.2.md`.

### TASK-RF-023.3 - Header Original (modo bar + steppers + título/métricas)
- **Esforço-H/IA:** M/G · **Dep:** 023.2
- `PanelModeBar` ("Modo visualização") + `StopStepper` ‹ › navegando as paradas (sincroniza com a seleção/zoom do mapa nos DOIS sentidos) + `PanelTitle` ("Parada {Stop}" + endereço do representante) + `MetricsRow` (N endereços · N pacotes — sem tempo no Original).
- **Aceite:** steppers percorrem as paradas; tocar marcador atualiza o header e vice-versa.

### TASK-RF-023.4 - StopItemList Original (endereços → pacotes)
- **Esforço-H/IA:** G/G · **Dep:** 023.2
- Lista dos endereços da parada por `Sequence` (mini-marcador cor do tipo + nº da planilha; endereço/complemento; badge de pacotes); expansão por item → `PackageRow` (etiqueta `Parada/Seq` + código SPX + badge de tipo — RF-28). Tocar item ↔ destacar marcador no mapa. Absorve o conteúdo do `AddressSheet` (testes migram).
- **Aceite:** drill-down parada → endereço → pacotes fiel à tela 5 (read-only); seleção espelhada mapa↔painel.

### TASK-RF-023.5 - Seleção inicial + integração + limpeza
- **Esforço-H/IA:** M/M · **Dep:** 023.3, 023.4
- Decisão (b): abrir o mapa com a **menor parada** selecionada; painel sempre com a última selecionada (clique fora não esvazia); `AddressSheet` legado absorvido/aposentado; testes de integração (MapPage + RouteMap + painel); docs (RF-12/27/28) e registro.
- **Aceite:** abrir o mapa já mostra "Parada {menor}" no painel; nunca há painel vazio; suíte verde; sem componente morto.

**Critérios de aceite (RF-023):** tela 5 em read-only razoavelmente fiel (estrutura e informação; estética final é outra decisão — README dos protótipos); slots documentados para RF-006/009.
**Dependências novas:** `vaul` (**aprovada pelo humano em 05/07/26** — instalar na .2).
**Riscos:** gestos/scroll do painel × pan do mapa (mitigar: painel irmão do container Leaflet, padrão da 022.6); regressão das interações RF-020 (suíte de RouteMap vigia).

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

<!-- ✅ TASK-CHORE-002 encerrada (05/07/26): suíte completa rodou verde em Windows nativo — 384/384 em 40 arquivos, ~13s (registrado em concluidas/2026-07-05--18h08--TASK-RF-022.1.md). O travamento era do sandbox antigo. -->
<!-- ✅ TASK-CHORE-003 concluída (05/07) — ambiente blindado (.npmrc include=dev, test.env no Vitest, env do Claude Code, TLS reativado) — ver concluidas/2026-07-05--04h57--TASK-CHORE-003.md -->
| TASK-DOC-003 | Sincronizar `contexto-projeto-ai.md`: deixa de ser "SPA de página única sem router" (ADR-003) | Standard | Importante | Normal | P/P | TASK-RF-011 | ADR-003 | [ ] | 22/06/26 23:50 |
| TASK-REF-011 | Remover o fluxo inline legado do `RouteViewer` (pós-upload navega desde a 022.4; seletor/sumário/modais inline = código morto no caminho normal) + extrair hook `useManifestFromUrl` (Regra de Três: SummaryPage/MapPage) | Standard | Importante | Normal | M/M | TASK-RF-022 ✅ | origem: revisão da TASK-RF-022.6 | [ ] | 05/07/26 21:05 |
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
