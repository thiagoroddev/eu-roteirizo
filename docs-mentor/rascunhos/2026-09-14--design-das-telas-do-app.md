# Rascunho · Design das telas do app (PRD adaptado à realidade do projeto)

> **Estado:** rascunho. **Origem:** PRD/Project Brief colado pelo humano em 14/09/26, com os mockups exportados do Stitch (`stitch_modern_ux_redesign`, `stitch_modern_ux_redesign (2)`).
> **Destino:** documento oficial de design, depois de revisado. Até lá, nada aqui é regra: requisito é o que está em `docs-mentor/requisitos/`.

## Regras de adaptação (valem para todas as telas)

1. **Cores e ícones são os do projeto em execução**:
   - tokens do tema claro/escuro em `src/styles/theme.css`, com `primary` verde da marca (`157 100% 36%` no claro, `#00FF9D` no escuro);
   - paleta funcional dos marcadores (`markerColors.ts`);
   - ícones `lucide-react`;
   - componentes `src/components/ui` (shadcn).

   **O que o projeto ainda não tem pode vir do mockup**, como um roxo para JSON ou o âmbar de "em construção".
2. **O HTML do Stitch é referência visual, não código.** As fontes (Inter, Plus Jakarta), o Tailwind por CDN e as cores fixas quebram o tema escuro e o offline do PWA.
3. **Botão sem função não entra.** Elemento do mockup cujo recurso não existe fica fora ou espera o requisito dele.
4. **O que o mockup omite e o app já tem continua** (totais, exportar, sugestão, ignorados, etc.).

## 1 · Visão geral

| PRD | App hoje | Adaptação |
|---|---|---|
| "Mobile first (PWA / App Nativo)" | PWA; TWA para Play Store planejado (RNF-16) | "PWA, com empacotamento Android (TWA) planejado" |
| Importação `.xlsx`, `.csv`, `.json` | Sim: XLSX e CSV (UTF-8) no envio; JSON em "Importar roteiro" | Mantém |
| "Otimização algorítmica de itinerários" | Montagem manual assistida por sugestão; o motor automático está em spike (RF-34, TASK-SPIKE-003) | "Montagem assistida hoje; auto-roteirização em desenvolvimento" |
| Integração com Google Maps e Waze | Link "Abrir no Google Maps" por endereço e "Como chegar" do veículo; Waze e execução com GPS pendentes (RF-37) | Citar só o Google Maps até a RF-37 |

## 2 · Problema e 3 · Personas

Os problemas e as personas (Carlos, entregador last-mile; Marcos, alta densidade na Zona Sul do RJ) valem como estão. Sobre o "offline-first", o app hoje é **parcial**:
- a casca do PWA fica em cache;
- os romaneios e roteiros ficam no IndexedDB;
- a malha viária fica em cache por 7 dias;
- os tiles do mapa só funcionam offline nas áreas já visitadas.

## 4 · Arquitetura de informação (real)

```
Abas (BottomNav — ADR-003)
├── Início  (/)
│    ├── Enviar romaneio (.xlsx / .csv)
│    ├── Importar roteiro (.json)
│    ├── Testar com romaneio de exemplo
│    └── Instruções e exemplo de planilha (multi-rota / rota única)
└── Rotas   (/rotas) — Romaneios salvos
     └── card por romaneio → toque numa rota
            ▼
      Sumário (/sumario)  — Info Original | Info Meu Roteiro, métricas, informações gerais
      ├── Ver no Mapa ─┐
      ├── Criar Roteiro ┤→ Mapa (/mapa) — Original | Meu roteiro + painel inferior
      └── Tabela Original      ├── Resumo da parada (‹ › entre paradas)
                               ├── Ver parada (endereços da parada)
                               ├── Ver detalhes (linha do tempo + totais + exportar)
                               └── Editar parada (rascunho no próprio painel)
```

Diferenças do PRD: o itinerário e a edição da parada **não são telas separadas**, e sim estados do painel inferior sobre o mapa. O mapa é o contexto espacial, então não existe mini-mapa.

## 5 · Telas

### 5.1 Criar rota e 5.2 Instruções (Início)

- **Existe:** envio de XLSX/CSV, importar JSON, romaneio de exemplo e instruções recolhíveis para multi-rota e rota única. As colunas obrigatórias do multi-rota são `Corridor Cage`, `Latitude` e `Longitude`; sem `Corridor Cage`, o arquivo vira rota única. Conferir se o texto das instruções diz isso antes de virar documento oficial.
- **Não existe:** download de planilha modelo. É candidato a requisito (ver o fim do documento).

### 5.3 Romaneios salvos (aba Rotas) — em andamento

- **Existe:**
  - cards tipados (único e multi), com nome do arquivo e data de importação;
  - chips de rota com AT e indicação de roteiro;
  - card multi recolhível;
  - busca por nome da rota ou código AT, com "X de N rotas" (RF-63, implementado);
  - apagar com confirmação.
- **Planejado em 14/09/26**, com tarefas independentes que dividem um contrato de dados:

| Tarefa | Requisito | Contrato que entrega |
|---|---|---|
| TASK-RF-046 · ordem por uso mais recente | RF-60 | `lastUsedAt` por romaneio (store própria no IndexedDB de romaneios); fallback `importedAt` |
| TASK-RF-047 · resumo do roteiro salvo | RF-61 | `RoteiroRecord.summary?` = `{ stops, vehicleMeters, walkMeters, totalMinutes, progressRatio, computedAt }`, gravado quando o Sumário ou o "Ver detalhes" já calculam os totais com malha |
| TASK-RF-048 · nova tela no layout do Stitch | RF-62 (+ RF-60, RF-61, RF-63) | Consome os dois campos acima **quando existem** (sem eles, a linha mostra só o que já há). Bairro principal = maior contagem do `summarizeNeighborhoods`, só o nome |

- **Layout (mockup 2), traduzido:**
  - card com ícone do tipo de arquivo (XLSX verde, JSON roxo, CSV a definir), selo único ou multi, contagem de rotas, nome, data e menu ⋮;
  - no multi: "Ocultar rotas", busca interna ("Buscar L ou código AT") e lista com rolagem;
  - a linha da rota traz estado do roteiro (sem roteiro, em construção x%, completo), nome, AT, bairro principal, pacotes e, quando houver resumo, tempo, km e paradas;
  - seletor de ordem (usados recentemente ou importados recentemente) e o aviso "Salvos neste dispositivo".
- **Fica fora até ter requisito:**
  - "Em execução · x%" e "x/y paradas" (RF-37, RF-47 a RF-49);
  - botão de filtros avançados (a busca existente cobre o caso);
  - renomear e duplicar romaneio;
  - botão flutuante "Importar" (importar vive no Início).
- **Decisão aberta (TASK-RF-048):** o menu ⋮ e o seletor de ordem com `DropdownMenu` do shadcn (nova dependência `@radix-ui/react-dropdown-menu`), ou botão de lixeira e `<select>` nativo.

### 5.4 Resumo da rota (Sumário)

- **Existe:**
  - alternância Info Original e Info Meu Roteiro;
  - métricas: pacotes, paradas, comercial, tempo estimado e distância estimada;
  - informações gerais: AT, data, hub, bairros com contagem e cidade;
  - ações: Ver no Mapa, Criar Roteiro e Tabela Original.
- **Onde fica o resto do PRD:**
  - a decomposição de tempo (veículo, a pé, entrega) e de distância (veículo, a pé) está no "Ver detalhes" do mapa (RF-006.20);
  - a barra de progresso fica no painel do mapa;
  - "Exportar .json" fica no "Ver detalhes".
- **A decidir:** trazer a barra de progresso e a decomposição também para o Sumário.

### 5.5 Mapa e resumo da parada

| PRD | App hoje | Adaptação |
|---|---|---|
| "Mapa vetorial" | Leaflet com tiles raster atrás do Worker (ADR-007) | "Mapa com tiles"; o vetorial só volta com a estratégia de tiles (DT-004) |
| Traçado do trajeto | Uma polilinha por perna, com passagens repetidas mais escuras e a perna da parada selecionada em verde (RF-57) | Mantém |
| Raio em verde esmeralda | Raio tracejado ciano (o acento do modo Meu roteiro) | Manter o ciano: o verde é o destaque da perna |
| Bottom sheet da parada | Painel inferior (vaul) com resumo, chips de pacotes e caminhada, Ver parada, Editar parada, apagar, ‹ › (RF-58) | Mantém |

### 5.6 Itinerário completo

- **Existe:** "Ver detalhes" em linha do tempo, com início e paradas no trilho e distância do veículo entre as paradas (RF-59). Dentro de cada parada, os endereços têm ordinal, complemento, código SPX, tipo, Abrir no Google Maps e o conector a pé.
- **Planejado:** endereços em cards aninhados (TASK-REF-020).
- **Fica fora:** as abas Todas e Pendentes pertencem à execução (RF-49, TASK-RF-028).

### 5.7 Edição da parada

- **Existe no rascunho do painel:**
  - raio com botões − e + e aviso de candidatos no raio;
  - arrastar o carro (âncora) e resetar o local;
  - inverter a ordem;
  - adicionar e remover endereços;
  - inserir parada em posição arbitrária (RF-50).
- **PRD sem correspondente:** slider de 10 a 200 m (hoje o raio só tem mínimo de 0 m) e drag-and-drop de pacotes. Candidatos a requisito.

## 6 · Não funcionais e diretrizes

| PRD | Situação |
|---|---|
| Ergonomia na zona do polegar | Ações da parada já ficam no painel inferior; conferir tela a tela no documento oficial |
| WCAG AA (contraste 4,5:1) | Sem auditoria registrada. Candidato a RNF, com auditoria nas cores do tema (o verde elétrico do escuro e os chips) |
| Performance offline | Parcial (ver §2) |
| Paleta: esmeralda `#059669/#10b981`, roxo `#8b5cf6`, azul `#0284c7`, menta, âmbar, superfícies slate | **Substituir pelos tokens do tema.** Entram só as cores sem equivalente: roxo para JSON e âmbar para "em construção" |

## 7 · Roadmap: correções ao PRD

- **"Fase 2: Mapbox/OSRM"** contradiz o ADR-002 (roteamento local sobre a malha OSM, sem API de roteirização) e o ADR-010 (fonte da malha na versão final). Reescrever como "motor local de auto-roteirização (RF-34), sobre a malha OSM", ou abrir um ADR se a ideia for mudar.
- **"Fase 4: modo escuro"** já existe: o app tem tema claro e escuro com alternância no cabeçalho.
- **Faltam no roadmap:** o motor de auto-roteirização (RF-34, spike 003), o modo execução (RF-37, TASK-RF-009), o freemium e o Play Billing (RF-41, RF-42, RNF-17) e o TWA (RNF-16).
- **"Fase 3: scanner de código de barras":** sem requisito. Candidato.

## Candidatos a requisito levantados aqui (não registrados)

1. Baixar planilha modelo no Início.
2. Renomear e duplicar romaneio salvo.
3. Slider de raio de agrupamento (faixa a definir).
4. Reordenar pacotes por arrastar dentro da parada.
5. Scanner de código de barras ou QR para conferir pacotes.
6. RNF de acessibilidade WCAG AA, com auditoria de contraste.

Cada um vira requisito, ADR, tarefa ou descarte, com uma linha de motivo.
