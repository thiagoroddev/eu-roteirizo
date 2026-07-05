# Requisitos Funcionais (RF)

> O que o sistema faz. IDs `RF-NN`. Extraídos do **código atual** (código é a verdade primária); itens planejados (🔭) sempre ligados a tarefa/ADR. Formato em `.github/agents/geral-robusto/templates/38-requisitos.md`.
>
> Status: ✅ Implementado · 🟡 Parcial · 🔭 Planejado · 🚫 Descartado.

## Estado Atual (implementado)

| ID | Requisito | Prioridade | Status | Origem | Tarefas / ADR |
|---|---|:---:|:---:|---|---|
| RF-01 | O usuário pode importar uma planilha de rota em `.xlsx` ou `.csv` | MUST | ✅ | `components/FileUploader.tsx`, `hooks/useRouteUploader.ts` | - |
| RF-02 | O sistema valida extensão e tamanho (≤ 10 MB) do arquivo antes de processar | MUST | ✅ | `utils/validators.ts`, `constants/index.ts` (`FILE_CONFIG`) | - |
| RF-03 | O sistema valida a presença das colunas obrigatórias e informa as ausentes (rota única **não** reporta opcionais do multi-rota) | MUST | ✅ | `utils/excelProcessor.ts`, `constants` (`MANDATORY_COLUMNS`) | TASK-RF-018 |
| RF-04 | O sistema detecta automaticamente se o arquivo é multi-rota ou rota única | MUST | ✅ | `utils/excelProcessor.ts` (`isSingleRoute`) | TASK-RF-002 |
| RF-05 | No modo multi-rota, o sistema agrupa as entregas por `Corridor Cage` | MUST | ✅ | `utils/excelProcessor.ts` | - |
| RF-06 | O sistema ordena as rotas alfanumericamente e as linhas por `Sequence` | SHOULD | ✅ | `utils/excelProcessor.ts` | - |
| RF-07 | O usuário pode selecionar qual rota visualizar (multi-rota) | MUST | ✅ | `components/RouteSelector.tsx` | TASK-RF-004 |
| RF-08 | O usuário pode localizar a rota pelo código AT (`Planned AT`) — **multi-rota apenas** | SHOULD | ✅ | `components/RouteSearchByAT.tsx`, `hooks/useRouteSearch.ts` | - |
| RF-09 | O usuário vê um resumo estatístico da rota selecionada (sem ESEDC; rota única oculta Turno/Tempo/Distância/Hub e conta comerciais por inferência) | SHOULD | ✅ | `components/RouteSummary.tsx`, `hooks/useRouteSummary.ts` | TASK-RF-003, TASK-RF-015, TASK-RF-017, TASK-REF-007 |
| RF-10 | O usuário visualiza as entregas como marcadores num mapa (Leaflet) | MUST | ✅ | `components/RouteMap.tsx` | - |
| RF-11 | Os marcadores diferenciam o **tipo de local** por ícone (home/office/indefinido ± corrigido; rota única: só inferência) | SHOULD | 🟡 | `utils/mapIcons.ts`, `utils/iconPicker.ts` | TASK-REF-007 |
| RF-12 | Ao tocar um marcador, o usuário vê os dados da entrega (HTML escapado; tipo de local inferido, sem ESEDC) | SHOULD | ✅ | `components/RouteMap.tsx`, `utils/escapeHtml.ts` | TASK-BG-003, TASK-RF-003, TASK-RF-017, TASK-REF-007 |
| RF-13 | O usuário pode abrir o mapa em tela cheia | COULD | ✅ | `components/RouteMap.tsx` | - |
| RF-14 | O usuário pode ver a rota como tabela completa (todas as colunas) | SHOULD | ✅ | `components/RouteTable.tsx` | - |
| RF-15 | O usuário pode ver uma tabela simplificada com o **status comercial** do endereço (coluna Correios removida) | SHOULD | ✅ | `components/RouteSimpleTable.tsx` | TASK-RF-003, TASK-REF-007 |
| RF-16 | Antes do upload, o usuário vê uma tabela-exemplo da estrutura ideal | COULD | ✅ | `components/ExampleTable.tsx`, `constants/exampleData.ts` | - |
| RF-17 | Informar se os Correios entregam no CEP (ESEDC) — **removido** | SHOULD | 🚫 | ADR-005 (removidos `correiosDelivery.ts`, JSON, ícones, labels e tipos) | TASK-REF-007 ✅ |
| RF-18 | O sistema infere o tipo de local (comercial/residencial/indistinto) do endereço — **para todo romaneio, mesmo com a coluna** `Location Type` (a inferência manda; coluna = fallback) | SHOULD | ✅ | `utils/inferLocationType.ts`, `constants/keywords.ts` | TASK-RF-003, TASK-RF-016, TASK-RF-017 |
| RF-19 | O app é instalável (PWA) e o shell funciona offline | SHOULD | ✅ | `vite.config.ts` (vite-plugin-pwa), `public/manifest.json` | - |
| RF-45 | Resolver o bairro pelo CEP quando houver (fallback: coluna Neighborhood) — cobertura **RJ/Ilha do Governador** | SHOULD | 🟡 | `summarizeNeighborhoods` (`utils/formatters.ts`); `data/CEPs-Hub_RJ_Ilha-do-Governador.json` | DT-003 |

## Critérios de Aceite (apenas os não triviais)

- **RF-04:** arquivo **com** `Corridor Cage` → multi-rota; **sem** a coluna → rota única sob o rótulo `UI_LABELS.ROUTE.SINGLE_ROUTE_NAME` ("Minha rota"); o resultado expõe `ProcessedResult.isSingleRoute`.
- **RF-12:** nenhum valor de célula é injetado como HTML cru no tooltip — tudo passa por `escapeHtml` (sem XSS via endereço/observação).
- **RF-18:** a inferência pelo complemento do endereço roda **para todo romaneio** (mesmo com a coluna `Location Type`); inferência confiante (comercial/residencial) **manda**; indefinida → cai na coluna, se houver, senão "Indistinto". (Decisão 25/06 — fonte Shopee não-confiável.)

## Modo Rota Única — destravado pela TASK-RF-003 (25/06)

> A **TASK-RF-003** (alias de cabeçalhos: `Bairro`→Neighborhood, `Zipcode/Postal code`→Zipcode, `AT ID`→Planned AT) liberou os recursos que dependiam de **nome de coluna**: **RF-09** (resumo: AT/bairros), **RF-12** (tooltip: bairro/CEP) e **RF-15** (tabela simplificada) passaram a **✅**; **RF-18** (inferência) sempre rodou pelo endereço. **Resta parcial só o RF-11** (ícones por tipo): a rota única **não traz a coluna `Location Type`**, então a classificação é **só por inferência** do endereço — ícones "indefinidos/cinza" quando o endereço não tem complemento reconhecível (não é problema de header; ver `iconPicker`/`resolveLocationType`). A busca por AT (RF-08) segue **multi-rota apenas**. Validação visual da rota única recomendada ao humano.
>
> **Ajustes da rota única (feitos em 25/06):** campos estruturalmente ausentes (Turno, Tempo/Distância estimados, Hub) **ocultados** (não "Sem dados") — **TASK-RF-015 ✅**; contagem de comerciais (Sumário) e tipo de local (popup) agora por **inferência**, sem gatear na coluna — **TASK-RF-017 ✅**; aviso de "colunas opcionais faltando" **suprimido** na rota única — **TASK-RF-018 ✅**; **ESEDC/Correios** removido por completo (código, dados, UI, ícones, tipos) — **TASK-REF-007 ✅** (ADR-005). "Horário comercial" segue como rótulo do **tipo de local** (inferência de horário real fica futura). **RF-11** (ícones por tipo) só melhora com mais inferência (sem `Location Type` na rota única).

## Pendente de Validação

- (nada pendente — todos os pontos da Fase 2 validados pelo humano em 24/06)

## Planejados (🔭) — Roteirizador a pé

> Derivados de `docs/rascunhos/fluxo-roteirizacao.md` (spec) + `draft-roteirizador-a-pe.md` (visão) + `analise-comercial-2.0.md` (monetização) + protótipos (`prototipos/telas-roteirizador/`, `prototipos/roteamento-osm/`). Ligados ao épico `TASK-RF-005…013` e a ADR-002/003. **Fundação já pronta** (sem UI ainda): modelo `RouteStop→DeliveryPoint→DeliveryPackage` e `buildDeliveryPoints` (TASK-RF-004).

| ID | Requisito | Prioridade | Status | Origem | Tarefas / ADR |
|---|---|:---:|:---:|---|---|
| RF-20 | Toggle no mapa **`Original \| Meu roteiro`** (PNG read-only × SVG editável; padrão Original) — na rota única e numa rota selecionada de Romaneio (Multi). Em **Roteiro importado avulso**, 'Original' fica desativado | MUST | 🟡 | Tela `/mapa` + `MapModeToggle` (TASK-RF-022.5 ✅ — toggle e lado Original); lado Meu roteiro = TASK-RF-010; avulso = TASK-RF-013 | TASK-RF-022.5 ✅, TASK-RF-010, TASK-RF-013 |
| RF-21 | Definir o ponto inicial da rota (GPS, toque no mapa ou endereço da planilha) | MUST | 🔭 | fluxo §4/decisão 5; tela 1 | TASK-RF-006.3 |
| RF-22 | Sugerir o próximo endereço/parada mais próximo (linha tracejada), re-selecionável ao tocar | MUST | 🔭 | fluxo §6; telas 1/3 | TASK-RF-006.3 |
| RF-23 | Criar parada a partir de um endereço, **sugerindo** os que estão dentro do raio (o usuário escolhe quais entram) | MUST | 🔭 | fluxo §4/§8; tela 3 | TASK-RF-006.4 |
| RF-24 | Ajustar a parada manualmente (adicionar/remover endereços) | MUST | 🔭 | fluxo §5/§9; telas 5/6 | TASK-RF-006.4 |
| RF-25 | **Âncora** (parada do veículo): **mover** (arrastar na rua), **tornar âncora** (assume a coordenada de um endereço) e **resetar** (padrão: em frente ao selecionado). Ponto livre **no meio da rua**; mover recalcula a ordem a pé | SHOULD | 🔭 | fluxo §6/§9; tela 6/7 | TASK-RF-006, TASK-RF-021 |
| RF-26 | Ordenar os endereços a pé automaticamente (varredura horária) com reordenação manual | SHOULD | 🔭 | fluxo §6; tela 5 | TASK-RF-006 |
| RF-27 | Expandir/colapsar parada (drill-down parada → endereços → pacotes) | MUST | 🔭 | fluxo §5; tela 5 | TASK-RF-006.5 |
| RF-28 | Exibir card "Etiqueta do Pacote" (endereço + Parada/Seq + SPX TN); multi-pacote lista cada um | SHOULD | 🔭 | fluxo §9/§14; telas 3/4 | TASK-RF-006 |
| RF-29 | Traçar o caminho de veículo pela rua real **entre paradas do veículo**, respeitando mão única, com km — **motor pronto (TASK-RF-005); falta UI** | MUST | 🟡 | ADR-002; fluxo §6; `utils/routing/` | TASK-RF-005, TASK-RF-006.6 |
| RF-30 | Mostrar a distância a pé pelas ruas até o alvo selecionado (A* por alvo; reta como fallback) — **A*/distância/map matching prontos (TASK-RF-005); falta variante a-pé (ignora mão única), fallback reta e UI** | SHOULD | 🟡 | fluxo §6; ADR-002; `utils/routing/` | TASK-RF-005 |
| RF-31 | Estimar tempo (a pé na parada + veículo entre paradas); exibir total e próximo trecho | MUST | 🔭 | fluxo §6; tela 5 | TASK-RF-007 |
| RF-32 | HUD com contadores sempre visíveis (faltando endereços/pacotes, paradas, distância, tempo) | SHOULD | 🔭 | fluxo §7; telas 1/7 | TASK-RF-006.2 |
| RF-33 | Salvar é **livre** (rascunho auto-salvo, mesmo incompleto); o botão **'Iniciar roteiro'** (executar) só aparece com **0 faltando** — completude exigida só para executar | MUST | 🔭 | fluxo §12; tela 7 | TASK-RF-006.7 |
| RF-34 | Auto-roteirizar: montar um rascunho editável (vizinho-mais-próximo + raio) | SHOULD | 🔭 | fluxo §12; telas 1/7 | TASK-RF-012 |
| RF-35 | Salvar (auto-save de **rascunho**, mesmo incompleto), listar e reabrir **Roteiros** localmente (IndexedDB) | MUST | 🔭 | fluxo §13 | TASK-RF-008 |
| RF-36 | Exportar/importar um **Roteiro** como JSON autocontido (ajudante/troca de aparelho); o importado vira um **card avulso** na home (abre direto em 'Meu roteiro', sem 'Original') | MUST | 🔭 | fluxo §13; tela 8 | TASK-RF-013 |
| RF-37 | Executar o Roteiro (uma entrega por vez): Abrir GPS (deep link), **Concluir entrega**, progresso e previsão; durante a execução o Roteiro **não é editável** | MUST | 🔭 | fluxo §14; tela 9 | TASK-RF-009 |
| RF-38 | App shell mobile-first: header + bottom tabs (**HOME** enviar / **Rotas** salvos) + Configurações. A bottom-nav **some quando há rota selecionada** (Sumário e mapa = telas de foco). Fechar mapa → Sumário; voltar do Sumário → Rotas | MUST | 🟡 | ADR-003; fluxo §11; telas 1/8 | TASK-RF-011 ✅ (shell: BrowserRouter, tabs, `FocusShell` sem nav, `_redirects`); telas de foco reais + navegação Sumário↔mapa fecham com TASK-RF-022.4/.5 |
| RF-39 | Configurações de Rota (raio, velocidade a pé, tempo/entrega, velocidade veículo) persistidas | SHOULD | 🔭 | fluxo §8; tela 10 | TASK-RF-007 |
| RF-40 | Legenda do mapa colapsável, espelhando o sistema de ícones | COULD | 🔭 | fluxo §3; tela 11 | TASK-RF-006 |
| RF-41 | Freemium: anúncio rewarded opt-in a cada importação; premium remove o anúncio | COULD | 🔭 | analise-comercial §10.6 | DT-002 |
| RF-42 | Assinatura premium via Play Billing (entitlement client-side no MVP) | COULD | 🔭 | analise-comercial §10.4/10.5 | DT-002 |
| RF-43 | Sumário ganha uma **seção "Info Meu Roteiro"** (paradas de veículo; pontos a pé; distância veículo/a pé/total; tempo veículo/a pé/total) abaixo dos dados brutos, **separada de propósito** dos números do romaneio; botões: **Criar Roteiro** (quando não há) / **Ver Meu Roteiro** (quando há — botão adaptativo) + **Ver Original** (abrem o mapa com o toggle certo) + Tabela Simplificada + Tabela Original. **Sem botão de criar na aba Rotas.** | SHOULD | 🔭 | fluxo §15.1/§15.2 | TASK-RF-022.4 (estrutura + Ver Original; seção preenchida pela RF-007/008) |
| RF-44 | Tela inicial: instruções em **spoiler** + **uma lista** de salvos com cards **tipados** (Romaneio Único / Romaneio Multi / Roteiro Exportado, por cor/rótulo), mostrando os Roteiros atrelados + **atalho** que abre o mapa já em 'Meu roteiro' | SHOULD | 🟡 | HOME/spoiler + aba Rotas prontos (TASK-RF-022.2/.3); **falta** mostrar Roteiros atrelados + atalho 'Meu roteiro' (RF-008/RF-013) | TASK-RF-022.2 ✅, TASK-RF-022.3 ✅; resto c/ TASK-RF-008/013 |
| RF-46 | Salvar os **Romaneios** importados (Único e Multi) para reabrir sem reenviar | SHOULD | ✅ | `services/manifestStorage.ts` (bytes brutos reprocessáveis) + `loadManifest` (`useRouteUploader`) + aba Rotas | TASK-RF-022.1 (serviço), TASK-RF-022.2 (salvar no upload), TASK-RF-022.3 (lista/reabrir/apagar) |
| RF-47 | **Pausar/retomar** a execução — 'Pausar rota' salva onde parou e é resumível | MUST | 🔭 | fluxo §14 | TASK-RF-009 |
| RF-48 | Na execução: **avançar/retroceder** entre as entregas (muda o foco) e **desfazer** a última | SHOULD | 🔭 | fluxo §14 | TASK-RF-009 |
| RF-49 | Execução em **modo lista** (sem mapa), alternável com o modo mapa | SHOULD | 🔭 | fluxo §14 | TASK-RF-009 |

> **Não-objetivos (registrados para não reaparecerem):** TSP / otimização automática da ordem inteira (só vizinho-mais-próximo — fluxo §6); GPS em tempo real na execução (decisão consciente — draft §8); **posição de veículo automática por GPS na execução** (a parada do veículo é sugerida/movida só pelo usuário — decisões 24/06 e 26/06); botão de contato/telefone do destinatário (não existe — fluxo §14).
