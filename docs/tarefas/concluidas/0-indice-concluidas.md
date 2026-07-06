# Índice de Tarefas Concluídas

> Uma linha por tarefa concluída, com link clicável para o arquivo único. O arquivo de cada tarefa segue o nome `[YYYY-MM-DD]--[HHhMM]--[TASK-PREFIXO]-[NUMERO].md` (data no início garante ordem cronológica).
>
> **Numeração de IDs:** o próximo número de um prefixo é o **maior já usado daquele prefixo + 1**. Gaps são ignorados, nunca reaproveitados.

| TASK-ID | Título | Arquivo |
|---|---|---|
| TASK-BG-001 | Dois testes de componente falhando (RouteSimpleTable e RouteSummary) | [abrir](./2026-06-22--10h49--TASK-BG-001.md) |
| TASK-CHORE-001 | Mitigar ReDoS no xlsx interno empacotado pelo danfojs (npm overrides) | [abrir](./2026-06-22--12h36--TASK-CHORE-001.md) |
| TASK-BG-002 | Gatear logging de dados (PII) atrás de flag de DEV no excelProcessor | [abrir](./2026-06-22--12h58--TASK-BG-002.md) |
| TASK-BG-003 | Escapar HTML dos campos do Excel no tooltip do mapa | [abrir](./2026-06-22--13h04--TASK-BG-003.md) |
| TASK-BG-004 | Validar faixa de lat/lng e avisar coordenadas descartadas | [abrir](./2026-06-22--13h25--TASK-BG-004.md) |
| TASK-REF-001 | Alinhar código à ADR-001 (UI em UI_LABELS; comentários PT→EN) | [abrir](./2026-06-22--14h03--TASK-REF-001.md) |
| TASK-REF-002 | key={idx} nas tabelas: documentar e aceitar (sem campo único garantido) | [abrir](./2026-06-22--14h16--TASK-REF-002.md) |
| TASK-REF-003 | Usar hasValidFileExtension no hook (remover duplicação / código morto) | [abrir](./2026-06-22--14h37--TASK-REF-003.md) |
| TASK-TEST-001 | Testes de integração: fluxo RouteViewer + interações RouteSelector | [abrir](./2026-06-22--15h01--TASK-TEST-001.md) |
| TASK-REF-004 | Usar UI_LABELS.ROUTE_SELECTOR no RouteSelector (strings hardcoded) | [abrir](./2026-06-22--15h21--TASK-REF-004.md) |
| TASK-REF-005 | Limpezas da REV: guard clause duplicada, typo colums, setTimeout sem cleanup | [abrir](./2026-06-22--15h28--TASK-REF-005.md) |
| TASK-DOC-001 | Criar docs/contexto-projeto-ai.md (ponto de entrada do projeto) | [abrir](./2026-06-22--15h47--TASK-DOC-001.md) |
| TASK-REF-006 | Adotar shadcn/ui como biblioteca de UI padrão (fundação + migração) — ADR-004 | [abrir](./2026-06-24--10h25--TASK-REF-006.md) |
| TASK-RF-001 | Protótipo de viabilidade do roteamento local sobre OSM (Nível B) | [abrir](./2026-06-22--21h30--TASK-RF-001.md) |
| TASK-RF-002 | Leitura de rota única (Corridor Cage opcional / detecção de modo) | [abrir](./2026-06-22--22h28--TASK-RF-002.md) |
| TASK-DOC-002 | Atualizar contexto-projeto-ai.md: colunas obrigatórias e modo rota única | [abrir](./2026-06-22--22h40--TASK-DOC-002.md) |
| TASK-RF-004 | Modelo de dados do roteirizador (Ponto / Parada / Rota planejada) | [abrir](./2026-06-22--23h35--TASK-RF-004.md) |
| TASK-DOC-004 | Criar docs/requisitos/ (RF/RN/RNF): estado atual + roteirizador planejado + template 38 | [abrir](./2026-06-24--14h33--TASK-DOC-004.md) |
| TASK-REF-008 | Identidade visual azul (#0D82D6): tokens shadcn + Hanken Grotesk + tema-tailwind.md — ADR-006 | [abrir](./2026-06-24--20h07--TASK-REF-008.md) |
| TASK-REF-009 | Identidade final "Cyanide" (ciano #0DC2D6 + claro/escuro automático + pill + toggle) — ADR-006 | [abrir](./2026-06-24--20h44--TASK-REF-009.md) |
| TASK-RF-003 | Alias de cabeçalhos da rota única (Bairro/Zipcode/AT ID → canônicos) — destrava RF-09/12/15/18 | [abrir](./2026-06-25--11h41--TASK-RF-003.md) |
| TASK-RF-016 | Inferência de tipo de local para todo romaneio (roda sem a coluna e sobrepõe quando há) — RN-07 | [abrir](./2026-06-25--13h08--TASK-RF-016.md) |
| TASK-REF-007 | Remover ESEDC/Correios por completo (código, dados, UI, labels, ícones, tipos) — ADR-005 | [abrir](./2026-06-25--14h09--TASK-REF-007.md) |
| TASK-RF-015 | Rota única: ocultar campos inexistentes no Sumário (Turno/Tempo/Distância/Hub) | [abrir](./2026-06-25--14h09--TASK-RF-015.md) |
| TASK-RF-017 | Rota única: status comercial inferido no Sumário (contagem) e nos popups | [abrir](./2026-06-25--14h09--TASK-RF-017.md) |
| TASK-RF-018 | Rota única: não avisar "colunas opcionais faltando" (missingCols vazio no modo) | [abrir](./2026-06-25--14h09--TASK-RF-018.md) |
| TASK-BG-005 | Robustecer `parseCoordinate` (decimal real vírgula/ponto × inteiro escalado, locale-aware) — RN-02 | [abrir](./2026-06-25--15h41--TASK-BG-005.md) |
| TASK-RF-005.1 | Núcleo do grafo + A* tipado e testado (geo/graph/aStar/streets; mão única = aresta ausente) — ADR-002 | [abrir](./2026-06-25--17h09--TASK-RF-005.1.md) |
| TASK-RF-005.2 | Camada de dados OSM (Overpass → grafo): osm.ts (fetch/timeout/erro→UI), reusa buildGraph — ADR-002, DT-005 | [abrir](./2026-06-25--17h31--TASK-RF-005.2.md) |
| TASK-RF-005.3 | Cache do grafo + offline (IndexedDB via idb): graphCache.ts (TTL, loadRoadGraph cache→Overpass) — ADR-002 | [abrir](./2026-06-25--17h44--TASK-RF-005.3.md) |
| TASK-RF-005.4 | A* com min-heap próprio (minHeap.ts; fronteira O(log n), resultado idêntico, 2.7ms/2500 nós) — ADR-002 | [abrir](./2026-06-25--18h02--TASK-RF-005.4.md) |
| TASK-RF-005.5 | Map matching em aresta (match.ts: projeção/nearestEdge/matchToGraph; nó sintético) — **fecha o motor RF-005** | [abrir](./2026-06-25--18h15--TASK-RF-005.5.md) |
| TASK-RF-019 | Protótipo dos marcadores SVG do modo Original (forma=Stop, número=parada, cor=tipo, badge caixa/pino, ponta fina, neon) — ADR-008 | [abrir](./2026-06-25--22h55--TASK-RF-019.md) |
| TASK-RF-020.1 | Componente de marcador SVG parametrizável (markerSvg builder puro + markerIcon divIcon + reset CSS) — ADR-008 | [abrir](./2026-06-26--12h09--TASK-RF-020.1.md) |
| TASK-RF-020.2 | Integrar no RouteMap (agrupar por Stop, 1 marcador/parada; stopGrouping + markerColors; aposenta PNGs) — ADR-008 | [abrir](./2026-06-26--12h46--TASK-RF-020.2.md) |
| TASK-RF-020.4 | Ajuste visual dos marcadores: escala por zoom (markerScale) + badge reposicionado na base da cabeça — ADR-008 | [abrir](./2026-06-26--14h40--TASK-RF-020.4.md) |
| TASK-RF-020.5 | Redesenho do marcador: sempre quadrado colapsado + badge dentro + rótulo `parada-sequência` (ADR-008 refinada) | [abrir](./2026-06-26--15h43--TASK-RF-020.5.md) |
| TASK-RF-020.3 | Interações: expandir/colapsar parada, seleção e popup do endereço (markerModels puro) — **fecha o épico RF-020** | [abrir](./2026-06-26--16h12--TASK-RF-020.3.md) |
| TASK-REF-010 | Profissionalizar o pacote de agente e torná-lo auto-carregável (Claude/Codex/Copilot): entry points, 9 Skills, 7 instructions, renome .md.md→.md, 489 links corrigidos, geral-leve arquivado — pacote v4.0 | [abrir](./2026-06-26--10h19--TASK-REF-010.md) |
| TASK-RF-021 | Migrar modelo para a "parada do veículo" (`anchorPointId` → `vehicleStop: LatLng`) — destrava RF-006 | [abrir](./2026-07-05--03h47--TASK-RF-021.md) |
| TASK-RF-011 | App shell mobile-first: BrowserRouter + AppShell/FocusShell (HOME/Rotas, nav some no foco) + `_redirects` Cloudflare Pages — ADR-003 atualizada | [abrir](./2026-07-05--04h47--TASK-RF-011.md) |
| TASK-CHORE-003 | Blindar ambiente hostil: `.npmrc` include=dev + `test.env` no Vitest + env do Claude Code (NODE_ENV limpo, TLS reativado) + VS Code | [abrir](./2026-07-05--04h57--TASK-CHORE-003.md) |
| TASK-RF-022.1 | Serviço de romaneios salvos: `manifestStorage` (IndexedDB, bytes brutos + meta) + `sha256Hex` + dedup RN-23 — suíte completa 384/384 (fecha também a CHORE-002) | [abrir](./2026-07-05--18h08--TASK-RF-022.1.md) |
| TASK-RF-022.2 | HOME: spoiler de instruções (multi + rota única, `<details>` nativo), botão Importar JSON stub, salvar romaneio no upload + avisos RN-23 | [abrir](./2026-07-05--19h20--TASK-RF-022.2.md) |
| TASK-RF-022.3 | Aba Rotas: cards tipados + chips por rota/AT, reabrir via deep link `/?romaneio&rota`, apagar c/ confirmação, busca por AT, RN-23 completa — RF-46 ✅ | [abrir](./2026-07-05--19h42--TASK-RF-022.3.md) |
| TASK-RF-022.4 | Sumário como tela de foco (`/sumario` no FocusShell + voltar no header): botões RF-43 ("Ver Original", Criar Roteiro stub, extraActions), PlannedRouteInfo pronta, pós-upload navega (single→Sumário, multi→Rotas) | [abrir](./2026-07-05--19h58--TASK-RF-022.4.md) |
| TASK-RF-022.5 | Tela do mapa de foco (`/mapa`) + `MapModeToggle` (Meu roteiro stub) + `RouteMap.embedded` (sem portal/fechar; voltar no header) — RF-20 🟡 | [abrir](./2026-07-05--20h18--TASK-RF-022.5.md) |
| TASK-RF-022.6 | AddressSheet: painel inferior compartilhado (§6) substitui o popup — read-only + slot `actions` p/ RF-006/009; `findAddressByKey`; Escape em 2 estágios — **fecha o épico RF-022 / fase 1** | [abrir](./2026-07-05--21h05--TASK-RF-022.6.md) |
| TASK-REF-012 | Tema **Neon Flux dark como padrão** (verde #00FF9D → azul #00D1FF; tokens `--gradient-*`; accent2 tokenizado; default no service+anti-flash) — ADR-006 revisada; personalizar = editar só theme.css | [abrir](./2026-07-05--22h41--TASK-REF-012.md) |
| TASK-RF-023.1 | Doc de design do MapPanel (`docs/design/arvore-componentes-mapa.md`: árvore, contratos TS, matriz modo×slot telas 5–9) + fluxo-modo-original §5/§6/§8 sincronizados (painel persistente, menor parada, nunca vazio) | [abrir](./2026-07-05--22h58--TASK-RF-023.1.md) |
| TASK-RF-023.2 | Fundação MapPanel: vaul@1.1.2 (snaps 96px/45%/90%, não-modal, nunca fecha) + lift do estado p/ MapPage + memória "nunca vazio" (menor parada derivada) + AddressSheet inline interino — RouteMap 42/42 sem edição | [abrir](./2026-07-05--23h42--TASK-RF-023.2.md) |

<!-- Exemplo:
| TASK-REF-03 | Instalar shadcn/ui e criar wrappers em components/ui | [abrir](./2026-05-16--20h21--TASK-REF-03.md) |
-->
