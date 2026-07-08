# Tarefas Em Andamento

> Cada tarefa Standard/Strict em execução vive aqui como **um bloco** (cabeçalho + log contínuo com timestamps), enquanto está sendo feita. Ao iniciar, a tarefa **sai de `pendentes.md`**; ao concluir, vira arquivo próprio em `concluidas/` e **sai daqui**.
>
> **Máximo 3 em andamento ao mesmo tempo.** Rodar testes antes e depois de cada tarefa. Datas no formato `DD/MM/AA HH:MM`.

*(Nenhuma tarefa em andamento.)*

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
