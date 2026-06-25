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

<!-- Exemplo:
| TASK-REF-03 | Instalar shadcn/ui e criar wrappers em components/ui | [abrir](./2026-05-16--20h21--TASK-REF-03.md) |
-->
