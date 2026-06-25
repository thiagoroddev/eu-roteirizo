# Requisitos Funcionais (RF)

> O que o sistema faz. IDs `RF-NN`. Extraídos do **código atual** (código é a verdade primária); itens planejados (🔭) sempre ligados a tarefa/ADR. Formato em `.github/agents/geral-robusto/templates/38-requisitos.md`.
>
> Status: ✅ Implementado · 🟡 Parcial · 🔭 Planejado · 🚫 Descartado.

## Estado Atual (implementado)

| ID | Requisito | Prioridade | Status | Origem | Tarefas / ADR |
|---|---|:---:|:---:|---|---|
| RF-01 | O usuário pode importar uma planilha de rota em `.xlsx` ou `.csv` | MUST | ✅ | `components/FileUploader.tsx`, `hooks/useRouteUploader.ts` | - |
| RF-02 | O sistema valida extensão e tamanho (≤ 10 MB) do arquivo antes de processar | MUST | ✅ | `utils/validators.ts`, `constants/index.ts` (`FILE_CONFIG`) | - |
| RF-03 | O sistema valida a presença das colunas obrigatórias e informa as ausentes | MUST | ✅ | `utils/excelProcessor.ts`, `constants` (`MANDATORY_COLUMNS`) | - |
| RF-04 | O sistema detecta automaticamente se o arquivo é multi-rota ou rota única | MUST | ✅ | `utils/excelProcessor.ts` (`isSingleRoute`) | TASK-RF-002 |
| RF-05 | No modo multi-rota, o sistema agrupa as entregas por `Corridor Cage` | MUST | ✅ | `utils/excelProcessor.ts` | - |
| RF-06 | O sistema ordena as rotas alfanumericamente e as linhas por `Sequence` | SHOULD | ✅ | `utils/excelProcessor.ts` | - |
| RF-07 | O usuário pode selecionar qual rota visualizar (multi-rota) | MUST | ✅ | `components/RouteSelector.tsx` | TASK-RF-004 |
| RF-08 | O usuário pode localizar a rota pelo código AT (`Planned AT`) — **multi-rota apenas** | SHOULD | ✅ | `components/RouteSearchByAT.tsx`, `hooks/useRouteSearch.ts` | - |
| RF-09 | O usuário vê um resumo estatístico da rota selecionada (sem ESEDC após ADR-005) | SHOULD | 🟡 | `components/RouteSummary.tsx`, `hooks/useRouteSummary.ts` | TASK-RF-003, ADR-005 |
| RF-10 | O usuário visualiza as entregas como marcadores num mapa (Leaflet) | MUST | ✅ | `components/RouteMap.tsx` | - |
| RF-11 | Os marcadores diferenciam o **tipo de local** por ícone | SHOULD | 🟡 | `utils/mapIcons.ts`, `utils/iconPicker.ts` | TASK-RF-003, ADR-005 |
| RF-12 | Ao tocar um marcador, o usuário vê os dados da entrega (HTML escapado) | SHOULD | 🟡 | `components/RouteMap.tsx`, `utils/escapeHtml.ts` | TASK-BG-003, TASK-RF-003 |
| RF-13 | O usuário pode abrir o mapa em tela cheia | COULD | ✅ | `components/RouteMap.tsx` | - |
| RF-14 | O usuário pode ver a rota como tabela completa (todas as colunas) | SHOULD | ✅ | `components/RouteTable.tsx` | - |
| RF-15 | O usuário pode ver uma tabela simplificada com o **status comercial** do endereço | SHOULD | 🟡 | `components/RouteSimpleTable.tsx` | TASK-RF-003, ADR-005 |
| RF-16 | Antes do upload, o usuário vê uma tabela-exemplo da estrutura ideal | COULD | ✅ | `components/ExampleTable.tsx`, `constants/exampleData.ts` | - |
| RF-17 | Informar se os Correios entregam no CEP (ESEDC) — **descartado** | SHOULD | 🚫 | ADR-005 (remove `correiosDelivery.ts` + JSON) | TASK-REF-007 |
| RF-18 | O sistema infere o tipo de local (comercial/residencial/indistinto) do endereço | SHOULD | 🟡 | `utils/inferLocationType.ts`, `constants/keywords.ts` | TASK-RF-003 |
| RF-19 | O app é instalável (PWA) e o shell funciona offline | SHOULD | ✅ | `vite.config.ts` (vite-plugin-pwa), `public/manifest.json` | - |
| RF-45 | Resolver o bairro pelo CEP quando houver (fallback: coluna Neighborhood) — cobertura **RJ/Ilha do Governador** | SHOULD | 🟡 | `summarizeNeighborhoods` (`utils/formatters.ts`); `data/CEPs-Hub_RJ_Ilha-do-Governador.json` | DT-003 |

## Critérios de Aceite (apenas os não triviais)

- **RF-04:** arquivo **com** `Corridor Cage` → multi-rota; **sem** a coluna → rota única sob o rótulo `UI_LABELS.ROUTE.SINGLE_ROUTE_NAME` ("Minha rota"); o resultado expõe `ProcessedResult.isSingleRoute`.
- **RF-12:** nenhum valor de célula é injetado como HTML cru no tooltip — tudo passa por `escapeHtml` (sem XSS via endereço/observação).
- **RF-18:** `Office` vindo da planilha é respeitado; `Home`/vazio dispara inferência pelo complemento do endereço, que pode corrigir para comercial/residencial; sem evidência → "Indistinto".

## Limitação Conhecida: Modo Rota Única (recém-implementado)

> **Validado com o humano (24/06).** O modo **rota única** hoje funciona só parcialmente. Funcionam: o **mapa** (RF-10, mas com **ícones padrão cinza** — sem diferenciação) e a **tabela completa** (RF-14). **Degradam** — dados aparecem como faltando *mesmo existindo na planilha*: **RF-09, RF-11, RF-12, RF-15, RF-18** (marcados 🟡). (RF-17 saiu desta lista — foi **descartado** por ADR-005.) Causa: a planilha de rota única usa **cabeçalhos com nomes diferentes** dos canônicos (ex.: `Bairro`, `Zipcode/Postal code`) e outros pontos ainda não tratados. Correção planejada: **TASK-RF-003** (alias de cabeçalhos) + fluxo dedicado da **TASK-RF-010**. A busca por AT (RF-08) é **multi-rota apenas** (na rota única há uma só rota — não se aplica).

## Pendente de Validação

- (nada pendente — todos os pontos da Fase 2 validados pelo humano em 24/06)

## Planejados (🔭) — Roteirizador a pé

> Derivados de `docs/rascunhos/fluxo-roteirizacao.md` (spec) + `draft-roteirizador-a-pe.md` (visão) + `analise-comercial-2.0.md` (monetização) + protótipos (`prototipos/telas-roteirizador/`, `prototipos/roteamento-osm/`). Ligados ao épico `TASK-RF-005…013` e a ADR-002/003. **Fundação já pronta** (sem UI ainda): modelo `RouteStop→DeliveryPoint→DeliveryPackage` e `buildDeliveryPoints` (TASK-RF-004).

| ID | Requisito | Prioridade | Status | Origem | Tarefas / ADR |
|---|---|:---:|:---:|---|---|
| RF-20 | Toggle no mapa **`Original \| Meu roteiro`** (PNG read-only × SVG editável; padrão Original) — na rota única e numa rota selecionada de Romaneio (Multi). Em **Roteiro importado avulso**, 'Original' fica desativado | MUST | 🔭 | fluxo §11; tela 1 | TASK-RF-010 |
| RF-21 | Definir o ponto inicial da rota (GPS, toque no mapa ou endereço da planilha) | MUST | 🔭 | fluxo §4/decisão 5; tela 1 | TASK-RF-006.3 |
| RF-22 | Sugerir o próximo endereço/parada mais próximo (linha tracejada), re-selecionável ao tocar | MUST | 🔭 | fluxo §6; telas 1/3 | TASK-RF-006.3 |
| RF-23 | Criar parada a partir de um endereço, incluindo automaticamente os que estão dentro do raio | MUST | 🔭 | fluxo §4/§7; tela 3 | TASK-RF-006.4 |
| RF-24 | Ajustar a parada manualmente (adicionar/remover endereços) | MUST | 🔭 | fluxo §5/§9; telas 5/6 | TASK-RF-006.4 |
| RF-25 | Trocar a âncora da parada (botão "Trocar âncora") — a âncora é **sempre o 1º ponto** e a troca recalcula a ordem a pé | SHOULD | 🔭 | fluxo §6; tela 6 | TASK-RF-006 |
| RF-26 | Ordenar os endereços a pé automaticamente (varredura horária) com reordenação manual | SHOULD | 🔭 | fluxo §6; tela 5 | TASK-RF-006 |
| RF-27 | Expandir/colapsar parada (drill-down parada → endereços → pacotes) | MUST | 🔭 | fluxo §5; tela 5 | TASK-RF-006.5 |
| RF-28 | Exibir card "Etiqueta do Pacote" (endereço + Parada/Seq + SPX TN); multi-pacote lista cada um | SHOULD | 🔭 | fluxo §9/§14; telas 3/4 | TASK-RF-006 |
| RF-29 | Traçar o caminho de veículo pela rua real entre âncoras, respeitando mão única, com km | MUST | 🔭 | ADR-002; fluxo §6 | TASK-RF-005, TASK-RF-006.6 |
| RF-30 | Mostrar a distância a pé pelas ruas até o alvo selecionado (A* por alvo; reta como fallback) | SHOULD | 🔭 | fluxo §6; ADR-002 | TASK-RF-005 |
| RF-31 | Estimar tempo (a pé na parada + veículo entre paradas); exibir total e próximo trecho | MUST | 🔭 | fluxo §6; tela 5 | TASK-RF-007 |
| RF-32 | HUD com contadores sempre visíveis (faltando endereços/pacotes, paradas, distância, tempo) | SHOULD | 🔭 | fluxo §7; telas 1/7 | TASK-RF-006.2 |
| RF-33 | Salvar é **livre** (rascunho auto-salvo, mesmo incompleto); o botão **'Iniciar roteiro'** (executar) só aparece com **0 faltando** — completude exigida só para executar | MUST | 🔭 | fluxo §12; tela 7 | TASK-RF-006.7 |
| RF-34 | Auto-roteirizar: montar um rascunho editável (vizinho-mais-próximo + raio) | SHOULD | 🔭 | fluxo §12; telas 1/7 | TASK-RF-012 |
| RF-35 | Salvar (auto-save de **rascunho**, mesmo incompleto), listar e reabrir **Roteiros** localmente (IndexedDB) | MUST | 🔭 | fluxo §13 | TASK-RF-008 |
| RF-36 | Exportar/importar um **Roteiro** como JSON autocontido (ajudante/troca de aparelho); o importado vira um **card avulso** na home (abre direto em 'Meu roteiro', sem 'Original') | MUST | 🔭 | fluxo §13; tela 8 | TASK-RF-013 |
| RF-37 | Executar o Roteiro (uma entrega por vez): Abrir GPS (deep link), **Concluir entrega**, progresso e previsão; durante a execução o Roteiro **não é editável** | MUST | 🔭 | fluxo §14; tela 9 | TASK-RF-009 |
| RF-38 | App shell mobile-first: header + bottom tabs (Mapa/Rotas) + acesso a Configurações | MUST | 🔭 | ADR-003; fluxo §11; telas 1/8 | TASK-RF-011 |
| RF-39 | Configurações de Rota (raio, velocidade a pé, tempo/entrega, velocidade veículo) persistidas | SHOULD | 🔭 | fluxo §8; tela 10 | TASK-RF-007 |
| RF-40 | Legenda do mapa colapsável, espelhando o sistema de ícones | COULD | 🔭 | fluxo §3; tela 11 | TASK-RF-006 |
| RF-41 | Freemium: anúncio rewarded opt-in a cada importação; premium remove o anúncio | COULD | 🔭 | analise-comercial §10.6 | DT-002 |
| RF-42 | Assinatura premium via Play Billing (entitlement client-side no MVP) | COULD | 🔭 | analise-comercial §10.4/10.5 | DT-002 |
| RF-43 | Sumário ganha uma **seção de resumo do Roteiro** (paradas; distância veículo/a pé/total; tempo veículo/a pé/total) abaixo dos dados brutos, **quando há** roteiro; os 3 botões (Ver no mapa / Tabelas) **não mudam** | SHOULD | 🔭 | fluxo §15.1 | TASK-RF-014 |
| RF-44 | Tela inicial: instruções em **spoiler** + **uma lista** de salvos com cards **tipados** (Romaneio Único / Romaneio Multi / Roteiro Exportado, por cor/rótulo), mostrando os Roteiros atrelados + **atalho** que abre o mapa já em 'Meu roteiro' | SHOULD | 🔭 | fluxo §15.2; tela 1 | TASK-RF-014 |
| RF-46 | Salvar os **Romaneios** importados (Único e Multi) para reabrir sem reenviar | SHOULD | 🔭 | fluxo §13/§15.2; tela 1 | TASK-RF-008, TASK-RF-014 |
| RF-47 | **Pausar/retomar** a execução — 'Pausar rota' salva onde parou e é resumível | MUST | 🔭 | fluxo §14 | TASK-RF-009 |
| RF-48 | Na execução: **avançar/retroceder** entre as entregas (muda o foco) e **desfazer** a última | SHOULD | 🔭 | fluxo §14 | TASK-RF-009 |
| RF-49 | Execução em **modo lista** (sem mapa), alternável com o modo mapa | SHOULD | 🔭 | fluxo §14 | TASK-RF-009 |

> **Não-objetivos (registrados para não reaparecerem):** TSP / otimização automática da ordem inteira (só vizinho-mais-próximo — fluxo §6); GPS em tempo real na execução (decisão consciente — draft §8); **re-ancoragem automática por GPS na execução** (a âncora muda só pelo botão "Trocar âncora", e é sempre o 1º ponto — decisão 24/06); botão de contato/telefone do destinatário (não existe — fluxo §14).
