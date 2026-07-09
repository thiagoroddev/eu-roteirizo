# Tarefas Em Andamento

> Cada tarefa Standard/Strict em execução vive aqui como **um bloco** (cabeçalho + log contínuo com timestamps), enquanto está sendo feita. Ao iniciar, a tarefa **sai de `pendentes.md`**; ao concluir, vira arquivo próprio em `concluidas/` e **sai daqui**.
>
> **Máximo 3 em andamento ao mesmo tempo.** Rodar testes antes e depois de cada tarefa. Datas no formato `DD/MM/AA HH:MM`.

<!-- 09/07/26 16h05: TASK-RF-006.4.16 ✅ (selecionar QUALQUER membro do grupo expandido): estado `selectedMemberId` + guarda `effectiveSelectedMemberId`; `handleModelTap` no membro do grupo expandido SELECIONA (antes inerte) → highlight migra no mapa (opt `selectedMemberId` no `computeRoteiroMarkerModels`, var `isAnchor→isHighlighted`) + painel "Endereço selecionado" mostra ESSE membro (`RoteiroStopSection` `anchorItem`→`selectedItem`+`isAnchor`: ordinal+complemento; sem membro = âncora/veículo). Reset ao regrupar/refocar. Stub do RouteMap ganhou `data-highlighted-model`. Suíte 627/627 (flake >10MB não reincidiu). -->
<!-- ⚠️ SMOKE PENDENTE (humano, .4.16): criar parada → 2 cliques (desagrupa) → tocar QUALQUER endereço → destaque migra no mapa + painel mostra esse endereço (nº+complemento, sem "âncora"); tocar mapa vazio regrupa e volta ao âncora. -->
<!-- ⚠️ COMMIT PENDENTE do humano: RF-006.4 → .4.16. -->

<!-- 09/07/26 04h00: TASK-RF-006.4.15 ✅ (highlight com grupo existindo + robustez altura): ao expandir a parada firmada o membro-âncora (1º) destaca; clamp colapsado-fit 0.7→0.88 vh + buffer 8px + "Esconder lista" volta ao fit; KNOBS manuais no MapPanel (COLLAPSED_MAX_FRACTION/MIN_PX/BUFFER_PX). Suíte 624/624. -->
<!-- ⚠️ SMOKE PENDENTE (humano, .4.15): expandir parada → 1º endereço destacado; botões não cortam (se cortar, subir COLLAPSED_MAX_FRACTION no MapPanel.tsx). Follow-up: selecionar QUALQUER membro por toque (hoje só o 1º/âncora destaca; toque no membro inerte). -->
<!-- ⚠️ COMMIT PENDENTE do humano: RF-006.4 → .4.15. -->

<!-- 09/07/26 03h35: TASK-RF-006.4.14 ✅ (destaque forte do selecionado): prop `highlight` → RouteMap amplia+eleva o selecionado nos dois modos (quadrado da parada + órfão/endereço); início (losango) plano sem anel/brilho + z abaixo. Candidatos só brilho, sem boost. Suíte 624/624. -->
<!-- ⚠️ SMOKE PENDENTE (humano, .4.14): parada selecionada maior+anel+brilho+na frente (não some no cluster) nos dois modos; início plano/mesmo tamanho/atrás; calibrar SELECTED_SCALE_FACTOR em cluster denso. -->
<!-- ⚠️ COMMIT PENDENTE do humano: RF-006.4 → .4.14. -->

<!-- 09/07/26 03h10: TASK-RF-006.4.13 ✅ (destaque de seleção): linha "Endereço selecionado" (âncora/órfão) do roteiro destacada por padrão; quadrado da parada do painel destacado no mapa nos DOIS modos (Original via highlightedStopKey = effectivePanelStopKey, sem clique + acompanha stepper; roteiro já via selectedStopId). Suíte 622/622. -->
<!-- ⚠️ SMOKE PENDENTE (humano, .4.13): linha "Endereço selecionado" destacada (roteiro); quadrado da parada do painel com anel+brilho nos dois modos (inclusive inicial/stepper); conferir contraste no dark. -->
<!-- 09/07/26 02h55: TASK-RF-006.4.12 ✅ (altura fit-content: colapsado = altura medida do cabeçalho; sem corte/sobra; sem auto-raise na seleção). Suíte 620/620. -->
<!-- ⚠️ COMMIT PENDENTE do humano: RF-006.4 → .4.13. -->

<!-- 09/07/26 02h25: TASK-RF-006.4.11 ✅ (ajuste da .4.10): duplo-clique = SÓ desagrupa o mapa (painel fica no resumo; NÃO abre a lista); "Ver lista completa" (botão) = evento distinto (abre a lista, esconde o mapa, sem expandir marcadores); clicar-fora regrupa mantendo foco; FOCO PERTO (focus fitBounds = MAX igual ao expand; roteiro ganhou focusBounds → zoom na parada). Suíte 620/620. -->
<!-- ⚠️ SMOKE PENDENTE (humano, .4.11): 2 cliques desagrupa só o mapa (painel resumo); clicar fora regrupa; Ver lista completa = evento separado (abre lista/esconde mapa); foco perto = mesmo zoom do desagrupar; calibrar MAX em parada de 1 endereço. -->
<!-- ✅ EPIC .4.6 completo + ajuste .4.11. Pendências: calibrar zoom/220ms no smoke; decisão C âncora (inerte) + geocoding TASK-RF-006.9. Próxima da fila RF-006: RF-008 antecipada / .5 / .6 / .7. -->
<!-- ⚠️ COMMIT PENDENTE do humano: RF-006.4 → .4.11. -->

<!-- 09/07/26 01h55: TASK-RF-006.4.10 ✅ — **EPIC .4.6 COMPLETO**. Modo Original unificado: 1 clique mantém AGRUPADO/foca, 2 cliques (ou Ver lista completa) EXPANDE, clicar-fora REAGRUPA mantendo foco. focus/expand/regroup no markerModels + ênfase no quadrado focado; RouteMap clique interno adiado (timer)=foca / dblclick=expande / empty=regroup + fitBounds focado; MapPage stepper=foca, Ver-lista=expande, card-tap não expande, applyInteraction move o painel pela parada FOCADA. Muda o contrato do RF-023. Suíte 619/619. -->
<!-- ⚠️ SMOKE PENDENTE (humano, .4.10 — CUIDADO, muda o Original): 1 clique foca+agrupa (NÃO expande mais); 2 cliques/Ver lista completa expande; clicar-fora reagrupa mantendo foco; stepper foca agrupado; conferir 2º clique não dá zoom + duplo-clique 220ms; vigiar snap/auto-eleva/panelStopKey/1º endereço; mobile → Ver lista completa. -->
<!-- ✅ EPIC .4.6 (criar-comita → painel parada → desagrupar mapa → editar sem toggle → Original unificado) COMPLETO. Pendências: calibrar 220ms + zoom do foco no smoke; decisão C da âncora (inerte) + geocoding TASK-RF-006.9 depois. Próxima da fila do épico RF-006: RF-008 antecipada / .5 (gestos âncora) / .6 / .7. -->
<!-- ⚠️ COMMIT PENDENTE do humano: RF-006.4 → .4.10 (epic .4.6 inteiro). -->

<!-- 09/07/26 01h35: TASK-RF-006.4.9 ✅ (edição de parada DESAGRUPADA + toque no mapa sem toggle): Editar → membros como círculos + candidatos pontilhados + raio (draft.stopId pula o quadrado); handleModelTap inerte no draft (membros por raio + lista ±); TAP_HINT reescrito. Suíte 613/613 (run final limpo; aliviei o teste pesado de 20 cliques do preview-raio p/ evitar timeout sob carga). -->
<!-- ⚠️ SMOKE PENDENTE (humano, .4.9): Editar → mapa desagrupa (círculos+raio+pontilhados, sem quadrado); toque no mapa na edição NÃO adiciona/remove (só raio + lista ±); Salvar reagrupa. -->
<!-- ▶️ EPIC .4.6 — FALTA SÓ a fatia final: **mudança do ORIGINAL** (1 clique mantém agrupado / 2 cliques expande / clicar-fora mantém foco; RF-023 travado — a mais delicada). Plano: como-resolver-o-shell-graceful-gadget.md. -->
<!-- ⚠️ COMMIT PENDENTE do humano: RF-006.4 → .4.9. -->

<!-- 09/07/26 01h15: TASK-RF-006.4.8 ✅ (desagrupar a parada firmada no mapa): 2 cliques no quadrado / Ver lista completa → círculos individuais numerados (expandedStopId); regrupa ao sair; infra dblclick no RouteMap (doubleClickZoom off + timer + onModelExpand); Original intocado no clique. Suíte 611/611. -->
<!-- ⚠️ SMOKE PENDENTE (humano, .4.8): 1 clique agrupa; 2 cliques desagrupa (conferir que NÃO dá zoom, janela 220ms); Ver lista completa idem; clicar fora/outra/Editar/Desfazer regrupa; mobile duplo-toque sensível → Ver lista completa é o caminho garantido. -->
<!-- ▶️ EPIC .4.6: PRÓXIMAS fatias — (a) editar sem toggle + edição DESAGRUPADA (REOPEN mostra círculos + raio + pontilhados; toque no mapa no draft para de fazer TOGGLE_DRAFT_POINT); (b) mudança do ORIGINAL (1 clique mantém agrupado / 2 cliques expande / clicar-fora mantém foco — a mais delicada, por último). Plano: como-resolver-o-shell-graceful-gadget.md. -->
<!-- ⚠️ COMMIT PENDENTE do humano: RF-006.4 → .4.8. -->

<!-- 09/07/26 00h40: TASK-RF-006.4.7 ✅ (painel da parada firmada): "Ver lista completa" no topo-dir + Editar/Desfazer centralizados no rodapé; "Ver lista completa" = lista dos endereços no painel (só painel; mapa desagrupa na .4.8); "Endereço selecionado — parada do veículo (âncora)" com ícone de carro + endereço sem complemento (placeholder). Gera TASK-RF-006.9 (geocoding). Suíte 608/608. -->
<!-- ⚠️ SMOKE PENDENTE (humano, .4.7): Ver-lista topo-dir + Editar/Desfazer rodapé; âncora c/ ícone de carro (sem "1º") sem complemento; Ver lista completa → endereços por ordinal (rolável); mapa segue agrupado (desagrupar = .4.8). -->
<!-- ▶️ EPIC .4.6 EM ANDAMENTO: PRÓXIMA fatia .4.8 (desagrupar no MAPA: duplo-clique / Ver lista completa expande os marcadores + editar sem toggle + modelo 1-vs-2-cliques nos DOIS modos incl. Original manter agrupado no 1º clique). Plano: como-resolver-o-shell-graceful-gadget.md. -->
<!-- ⚠️ COMMIT PENDENTE do humano: RF-006.4 → .4.7. -->

<!-- 08/07/26 23h45: TASK-RF-006.4.6 ✅ (fatia 1 do epic .4.6): "Criar parada" COMITA na hora (ação CREATE_STOP) + membros do raio entram sozinhos (reverte §8) + stepper de raio no preview (RadiusStepper extraído/DRY); parada firma agrupada + painel foca o resumo. Suíte 606/606. Decisão C anotada como inerte (create-time snapping). -->
<!-- ⚠️ SMOKE PENDENTE (humano, .4.6): stepper no preview muda círculo/contagem ao vivo; Criar → firma agrupada + resumo (sem cair na Edição); só o que ficou fora do raio segue livre; Editar ainda reabre rascunho; criar P1+P2. -->
<!-- ▶️ EPIC .4.6 em andamento: PRÓXIMA fatia .4.7 (modelo compartilhado foco/expandir 1 vs 2 cliques — MUDA O ORIGINAL/RF-023), depois .4.8 (Meu roteiro: expandir a parada + editar sem toggle no mapa). Plano: como-resolver-o-shell-graceful-gadget.md. -->
<!-- ⚠️ COMMIT PENDENTE do humano: RF-006.4 → .4.6. -->

<!-- 08/07/26 22h00: TASK-RF-006.4.5 ✅ (linha do rótulo da "Parada sugerida" = "Distância até aqui: X" + ícone de carro (sr-only "de veículo") + CTA "Criar parada" à direita; removidos "O raio engloba…" e "Do início até aqui…"; PanelSection ganhou slot `meta`). Suíte 603/603. -->
<!-- ⚠️ SMOKE PENDENTE (humano, RF-006.4.5): linha do rótulo densa em tela estreita (truncamento distância × botão); "(linha reta)" sem grafo; Incorporar abaixo com select sob demanda. -->
<!-- Próxima: TASK-RF-008 ANTECIPADA. ⚠️ COMMIT PENDENTE do humano: RF-006.4 → .4.5. -->
<!-- 📌 Pendência aberta p/ o humano: formalizar "Carregando ruas…" (status do grafo OSM, origem .3) em requisito, trocar a apresentação, ou deixar como está. -->

<!-- 08/07/26 21h45: TASK-RF-006.4.4 ✅ (resumo da "Parada sugerida" agrega semente+candidatos do raio — "4 no mapa = 4 no resumo" — c/ estimativa do circuito agregado; criar segue semeando só o selecionado §8; linha "Sugestão:…" removida do contexto do endereço). Suíte 603/603. -->
<!-- ⚠️ SMOKE PENDENTE (humano, RF-006.4.4): contagem do resumo = contagem do círculo; sem "Sugestão:…" no painel do endereço (tracejada continua); criar → 1 escolhido + candidatos. -->
<!-- 📌 Pendência aberta p/ o humano decidir: formalizar "Carregando ruas…" (status do grafo OSM, origem .3) em requisito, trocar a apresentação, ou deixar como está. -->

<!-- 08/07/26 21h05: TASK-RF-006.4.3 ✅ (anatomia de 3 seções: PanelSection único nos DOIS modos — divisor/padding não divergem mais; resumo de parada = Original c/ chips POR TIPO + estimativa; edição = estrutura do "Ver lista completa" c/ ± e card de raio; seção "Parada sugerida" c/ preview + distância de veículo + select sob demanda). Suíte 603/603. Spec com nota "3ª rodada". -->
<!-- ⚠️ SMOKE PENDENTE (humano, RF-006.4.3): Original pixel-idêntico; divisores em todas as seções do roteiro; "Parada sugerida" (título/chips/candidatos/"de veículo"); "Incorporar em outra parada" → select só ao clicar; Editar parada → lista completa c/ ± e card do raio; calibrar espaçamentos/densidade. -->
<!-- Próxima: TASK-RF-008 ANTECIPADA (routeStorage + auto-save RF-33 + hasRoteiro + botão adaptativo + carregar roteiro atrelado ao entrar). Depois: RF-006.5 (gestos da âncora sobre o marcador de carro). -->
<!-- ⚠️ COMMIT PENDENTE do humano: RF-006.4 + .4.1 + .4.2 + .4.3. -->
<!-- ⚠️ Flake conhecido (alheio): useRouteUploader ">10MB" 1× sob carga em 08/07 — verde isolado/re-run; se reincidir, abrir TASK-TEST. -->

<!-- 08/07/26 19h20: TASK-RF-006.4.2 ✅ (losango do início; carro sem cone na rua; parada firmada SELECIONÁVEL c/ painel do Original + Editar/Desfazer; preview do raio; sem Sequence — ordinais 1º/2º; anel tracejado no candidato; ciano; chips/pill/± /addressLine/estimativa honesta). Suíte 598/598. Spec §3/§4 revisadas (changelog 08/07 2ª rodada). -->
<!-- ⚠️ SMOKE PENDENTE (humano, RF-006.4.2): losango; carro (não cobre endereços; não "anda" no zoom); preview do raio + candidatos tracejados; parada 1.25× tocável → painel + Editar/Desfazer; ordinais; CALIBRAR centro ótico do carro + tracejado em zoom baixo + ciano. -->
<!-- ⚠️ Flake observado (alheio à tarefa): useRouteUploader ">10MB" falhou 1× sob suíte cheia, verde isolado/re-run — se reincidir, abrir TASK-TEST. -->
<!-- Próxima: TASK-RF-008 ANTECIPADA (routeStorage + auto-save RF-33 + hasRoteiro + botão adaptativo + carregar roteiro atrelado ao entrar). Depois: RF-006.5 (gestos da âncora sobre o marcador de carro). -->
<!-- ⚠️ COMMIT PENDENTE do humano: RF-006.4 + .4.1 + .4.2. -->

<!-- 08/07/26 17h40: TASK-RF-006.4.1 ✅ (consistência do Meu roteiro: cores por tipo NEON, veículo único p/ início/âncora, tela 8 na língua do Original via pointToStopItemData, header de estado + próximo passo, "a pé" nas distâncias, "Edição de parada" c/ CTAs visíveis + estimativa). Suíte 583/583. Spec §4 p.0 revisada. -->
<!-- ⚠️ SMOKE PENDENTE (humano, RF-006.4.1): alternância mantém cores (só mais claras); painel da tela 8 = Original; header de estado; CTAs visíveis no rascunho; estimativa atualiza; CALIBRAR os tons neon no device. -->
<!-- Próxima: TASK-RF-008 ANTECIPADA (routeStorage + auto-save RF-33 + hasRoteiro + botão adaptativo + CARREGAR o roteiro atrelado ao entrar no modo — item 4 do feedback fecha lá). Depois: RF-006.5 (âncora: gestos arrastar/tornar/resetar sobre o marcador de veículo já unificado). -->
<!-- ⚠️ COMMIT PENDENTE do humano: RF-006.4 + RF-006.4.1. -->

<!-- 08/07/26 15h25: TASK-RF-006.4 ✅ (telas 8–9: etiqueta + Criar/Incorporar; rascunho com raio tracejado ajustável, candidatos por ESCOLHA, aviso RN-17, Salvar/Cancelar; firmadas = quadrados cor-por-tipo; fitBounds por assinatura; re-projeção da âncora). RF-23/RN-17 ✅; RF-24 🟡. Suíte 577/577. -->
<!-- ⚠️ SMOKE PENDENTE (humano, RF-006.4): fluxo tela 8→9→firmar P1/P2; ZOOM ESTÁVEL ao togglar candidato; raio ao vivo; aviso suave; incorporar; modo avião + re-projeção; calibrar âmbar/anel/alturas. -->
<!-- Próxima: TASK-RF-008 ANTECIPADA (routeStorage idb + auto-save RF-33 + hasRoteiro no chip + botão adaptativo "Ver Meu Roteiro"). Depois: RF-006.5 (âncora definitiva: marcador + arrastar/tornar/resetar). -->
<!-- ⚠️ COMMIT PENDENTE do humano: RF-006.4 (as anteriores foram commitadas em 08/07). -->

<!-- 08/07/26 13h45: TASK-RF-006.3 ✅ (ponto inicial 3 caminhos + useRoadGraph lazy + sugestão tracejada com distância a pé; RF-21/22/RN-20 ✅). Suíte 548/548. -->
<!-- ⚠️ SMOKE PENDENTE (humano, RF-006.3): 3 caminhos do início; re-apontar sugestão; modo avião (reta + retry); alternância de modos; CALIBRAR altura do header colapsado + verde do início. -->
<!-- Próxima: TASK-RF-006.4 (ponto órfão + rascunho da parada: raio, candidatos escolhíveis, banner, footer Salvar parada — telas 8–9). Depois: RF-008 ANTECIPADA (routeStorage + auto-save). -->
<!-- ⚠️ COMMIT PENDENTE do humano: REF-013 + REF-011 + RF-006.1 + RF-006.2 + RF-006.3 (e smokes da REF-011 e RF-006.3 pendentes). -->

<!-- 08/07/26 12h40: TASK-RF-006.2 ✅ (modo Meu roteiro na tela: toggle destravado/RF-010 absorvida, ?modo=roteiro, pontos desbotados, HUD, Criar Roteiro navega; ADR-009). Suíte 506/506. -->
<!-- ⚠️ SMOKE PENDENTE (humano, RF-006.2): Sumário → "Criar Roteiro" (pontos desbotados + HUD); alternar modos (memória volta); F5 com ?modo=roteiro; rota sem coords → desabilitado; avaliar badge amarelo sobre o desbotado. -->
<!-- Próxima: TASK-RF-006.3 (ponto inicial GPS/toque/endereço + useRoadGraph lazy + sugestão tracejada). -->
<!-- ⚠️ COMMIT PENDENTE do humano: REF-013 + REF-011 + RF-006.1 + RF-006.2 (e smoke da REF-011 ainda pendente). -->

<!-- 07/07/26 20h40: TASK-RF-006.1 ✅ (reducer puro do Meu roteiro + walkOrder/vehicleStop/pointsWithinRadius + useRouteBuilder; suíte 485/485). Épico RF-006 re-fatiado em pendentes.md: RF-010 absorvida na .2; RF-008 antecipada pós-.4; @turf descartada. -->
<!-- Próxima: TASK-RF-006.2 (entrar no modo Meu roteiro — toggle destravado, pontos desbotados, HUD, "Criar Roteiro" navega; ADR da interop StopGroup×DeliveryPoint). -->
<!-- ⚠️ COMMIT PENDENTE do humano: REF-013 + REF-011 + RF-006.1 (e smoke da REF-011 ainda pendente). -->



<!-- 07/07/26: RF-023 (épico + Refinos 2–6) ✅ · REF-013 (card colapsável) ✅ · REF-011 (fluxo legado removido: HomePage só-upload, RouteMap só-embedded/controlado, AddressSheet aposentado, useManifestFromUrl) ✅ 18h35. Suíte: 443 (remoção líquida de legados). -->
<!-- ⚠️ SMOKE PENDENTE (humano, REF-011): fluxo ponta a ponta — HOME sobe e navega (single/multi/duplicado); Sumário e mapa intactos. -->
<!-- Próximos candidatos: TASK-RF-006 (Meu roteiro — edição) / RF-010 (destravar toggle), TASK-DOC-003 (sync contexto-projeto-ai), TASK-TEST-002 (zoom), radius 0.5rem neonflux. -->

<!-- 07/07/26: épico RF-023 encerrado (com Refinos 2–6 aprovados) e TASK-REF-013 ✅ 18h16 (card multi-rota colapsável na aba Rotas; filtro estreita chips). Suíte: 502. -->
<!-- ⚠️ SMOKE PENDENTE (humano, REF-013): card das 153 rotas colapsado; "Mostrar rotas (153)" com rolagem; filtro "L-23" → 1 chip + "1 de 153 rotas". -->
<!-- Próximos candidatos: TASK-REF-011 (fluxo legado + aposentar AddressSheet/modal), TASK-RF-006 (Meu roteiro) / RF-010 (toggle), radius 0.5rem neonflux (estética). -->

<!-- ÉPICO TASK-RF-023 100% ENCERRADO (07/07 ~17h50): .1–.5 + iterações .6/.7/.8 com Refinos 2–6, TODOS os smokes do humano aprovados ("excelente, finalizado"). Painel Original completo: duas visões, 1º endereço sempre selecionado, snap dimensionado, resumo bairro (CEP) + chips por tipo, complemento por pacote c/ rótulo, etiqueta "Ordem | Parada"+SPX, badges caixa+nº, header com a rota. Suíte: 500. ⚠️ Trabalho pós-commit do humano (RF-023.5→Refino 6) ainda NÃO commitado. -->
<!-- Próximos candidatos: TASK-REF-011 (fluxo legado + aposentar AddressSheet/modal), TASK-RF-006 (Meu roteiro) / RF-010 (toggle), radius 0.5rem neonflux (estética). -->

<!-- Concluídas até 06/07/26 (ver concluidas/): RF-021 · RF-011 · CHORE-003 · RF-022.1–.6 (épico fase 1) · REF-012 (tema Neon Flux) · RF-023.1 (design doc) · RF-023.2 (fundação MapPanel/vaul) · RF-023.3 (header real: ModeBar+steppers+métricas; smoke APROVADO 06/07, incl. fix do max-h do vaul). -->
<!-- Próxima: TASK-RF-023.4 (StopItemList Original: endereços por Sequence → PackageRow; absorve AddressSheet). -->

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
