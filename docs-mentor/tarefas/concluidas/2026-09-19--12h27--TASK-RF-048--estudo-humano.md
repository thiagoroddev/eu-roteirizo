# TASK-RF-048 · Nova tela de romaneios salvos no layout do Stitch: card por tipo de arquivo, rotas em linhas com busca interna, estado e resumo do roteiro, bairro principal e ordem por uso
### Planejamento:
TASK-RF-048 · Replanejamento da UI (Skill: Referência para React)
Replanejamento da interface da aba Rotas (/rotas) e da apresentação do ciclo de vida do roteiro, aplicando a metodologia da skill 
referencia-para-react
 sobre as referências visuais do Stitch (stitch_modern_ux_redesign), as telas em produção do Sumário e do Mapa e os requisitos formais (RF-60, RF-61, RF-62, RF-63).

1. Interpretação das Fontes e do Projeto
Fonte	Natureza	O que informa com certeza	Limitação ou risco identificado
Mockup Stitch 2 (code.html)	Referência visual estática	Hierarquia visual de cartões, ícones tipados por arquivo, rotas em linhas com dados ricos, barra de busca interna e seletor de ordenação	Tailwind v3 por CDN, cores fixas slate/emerald, fontes externas, menu flutuante ⋮ e dados ilustrativos fictícios desconectados do domínio
Sumário atual (Screenshot 1)	Tela funcional em produção	Cabeçalho com rota + badge de status ("Roteiro em execução — 0% concluído"), toggle Original/Meu Roteiro, cards de contagem e fluxos de tempo/distância	Estado atual deriva de plannedRouteStatus localmente; precisa ser unificado com a nova tela
Mapa 'Detalhes' (Screenshot 2)	Painel em produção	"MEU ROTEIRO - 100%", cards de totais com link "Detalhes", lista de paradas confirmadas na timeline	Seção de progresso atualmente exibe "Roteiro em construção" mesmo a 100% porque o "modo em execução" com botão "Iniciar execução" ainda não foi implementado (RF-009)
Requisitos RF-60 a RF-63	Regras de negócio	RF-60: ordenação por uso; RF-61: resumo gravado com malha; RF-62: bairro principal sem contagem; RF-63: busca interna e filtro "X de N rotas"	Contratos de persistência já entregues (TASK-RF-046 e 047); esta tarefa entrega a camada visual e de consumo
2. Inconsistências da Referência Resolvidas
Percentuais e Métricas Conflitantes: O mockup ilustrativo exibia "13/30 paradas junto de 45%" e "4/34 junto de 3%". No domínio real do app, o progresso da construção (progressRatio) mede endereços alocados / endereços totais, enquanto o progresso de execução mede entregas concluídas / pacotes totais. Adotamos fórmula explícita sem números arbitrários: a linha de rota exibe o percentual arredondado baseado em summary.progressRatio durante a construção.
Separação entre Formato e Cardinalidade: Um arquivo .xlsx ou .csv pode ser de rota única ou multi-rota (presença de Corridor Cage). O ícone representa o formato (XLSX verde, CSV azul, JSON roxo) e a badge representa a cardinalidade (Único ou Multi).
Menu Contextual ⋮ vs Ergonomia Mobile: O mockup exibia menu flutuante ⋮. Descartamos @radix-ui/react-dropdown-menu: botão de lixeira direto com Dialog acessível de confirmação elimina toques redundantes e evita dependências extras.
Cards de Progresso no Mapa ('Detalhes'): Os cards de progresso e totais no mapa (RoteiroOverviewSection) permanecem visíveis, pois a transição operacional de estado só ocorrerá quando o usuário acionar "Iniciar execução" (funcionalidade que será entregue na RF-009).
3. Mapa de Comportamento da Tela
ID	Região / Controle	Evidência	Dados de Entrada	Ação e Resultado Observável	Estados Tratados	Critério de Aceite
F01	Cabeçalho e Aviso Local	Requisito explícito e mockup	Contagem de romaneios salvos	Exibe título e aviso "Salvos neste dispositivo" indicando persistência local-first	Inicial, vazio, com dados	Aviso visível e claro em tema claro e escuro
F02	Seletor de Ordenação	Requisito RF-60 e mockup	lastUsedAt, importedAt	Alterna a ordem dos cards: "Mais recentes (uso)" (padrão) vs "Data de importação"	Padrão (uso desc), importação desc	Reordena instantaneamente sem recarregar o banco
F03	Busca Global	Requisito RF-63	Termo digitado, nomes de rota e códigos AT	Filtra os cards e destaca rotas correspondentes	Vazio, com correspondências, sem resultados	Mostra mensagem de busca vazia se nada coincidir
F04	Cabeçalho do Card	Mockup e RF-46	fileName, fileType, kind, routes.length	Exibe ícone do tipo de arquivo, badges, data formatada e ação de exclusão	Single, Multi, selecionado (?sel=)	Ícone reflete formato; badge reflete cardinalidade
F05	Ação de Exclusão	Requisito RF-008	manifest.id	Clicar na lixeira abre diálogo de confirmação; confirmar apaga romaneio e roteiros em cascata	Diálogo aberto, fechado, cancelado	Remove do IndexedDB e atualiza a lista sem órfãos
F06	Expansão Multi-rota	Requisito RF-63	Lista de rotas (> 6 rotas)	Botão "Mostrar rotas (N)" / "Esconder rotas" expande/recolhe a lista com rolagem interna	Recolhido, expandido, auto-expandido sob busca	Busca global ou interna abre automaticamente
F07	Busca Interna do Card	Mockup Stitch	Termo interno, rotas do card	Filtra apenas as rotas dentro daquele card, atualizando o contador "X de N rotas"	Sem filtro, filtrado, sem correspondência local	Filtro local não afeta outros cards
F08	Linha da Rota (RouteRow)	Mockup e RF-61/62	ManifestRouteMeta, RoteiroSummary, hasRoteiro	Exibe estado do roteiro, nome, AT, bairro principal, pacotes e resumo (tempo, km, paradas). Toque abre Sumário	Sem roteiro, Em construção, Em execução, Finalizado	Bairro omitido se não resolvível; métricas omitidas se sem resumo
4. Tipos e Invariantes de Domínio
Extensão do Metadado da Rota (src/types/manifest.ts)
ts

export interface ManifestRouteMeta {
  name: string;
  at?: string;
  rowCount: number;
  /** Bairro de maior volume de entregas (sem número), derivado de summarizeNeighborhoods (RF-62). */
  neighborhood?: string;
}
Utilitário Centralizador de Status (src/utils/routing/status.ts)
Única fonte de verdade para apresentação nos 3 lugares:

ts

export type RoteiroStatusKind = "none" | "building" | "executing" | "finished";
export interface RoteiroPresentation {
  kind: RoteiroStatusKind;
  /** Rótulo expandido para cabeçalhos (ex: "Roteiro em execução — 0% concluído"). */
  label: string;
  /** Rótulo conciso para badges e cards (ex: "Em construção (45%)", "Em execução"). */
  badgeLabel: string;
  /** Variante semântica para Badge do shadcn. */
  badgeVariant: "default" | "secondary" | "outline";
  /** Classe de cor auxiliar para ícones e textos. */
  colorClass: string;
  /** Percentual de construção (0..100). */
  buildPercent: number;
  /** Percentual de entregas realizadas (0..100). */
  deliveredPercent: number;
  /** Texto de cobertura formatado (ex: "36 de 51 endereços"). */
  coverageText: string;
  /** Indica se há métricas de malha viária disponíveis para exibição. */
  hasSummary: boolean;
}
5. Planejamento de Componentes e Responsabilidades
Componente	Responsabilidade	Props / Eventos	Estado Local	Base Visual	Reutilizar ou Criar
RoutesPage	Coordena carregamento (manifestos, chaves e resumos), ordenação global e deleção em cascata	Nenhuma (rota /rotas)	manifests, roteiroKeys, roteiroSummaries, sortBy, filter	Container max-w-3xl	Reutilizar e refatorar
ManifestToolbar	Barra de ferramentas com input de busca e seletor de ordenação	filter, onFilterChange, sortBy, onSortChange	Nenhum (controlado)	Input + <select> estilizado	Criar ou compor em RoutesPage
ManifestCard	Cabeçalho do arquivo, diálogo de confirmação, busca interna e lista de rotas	manifest, selected, filter, roteiroRoutes, routeSummaries, onOpenRoute, onDelete	confirmOpen, expanded, internalFilter	Card, Badge, Button, Dialog	Reutilizar e refatorar
RouteRow	Linha clicável com status padronizado, nome, AT, bairro principal (RF-62), pacotes e resumo (RF-61)	route, hasRoteiro, summary, onOpen	Nenhum (puro)	Botão acessível com hover, badges e ícones	Criar novo (components/manifests/RouteRow.tsx)
RouteMetrics	Exibição horizontal e compacta de duração, distância e paradas	summary: RoteiroSummary	Nenhum (puro)	Chips flexíveis com Clock, Truck, MapPin	Integrar dentro de RouteRow
6. Tradução do Sistema Visual (Tokens e Cores)
Ícones por Tipo de Arquivo:
.xlsx: Ícone FileSpreadsheet com destaque verde da marca (text-primary / bg-primary/10).
.csv: Ícone FileText com destaque azul neutro (text-sky-500 / bg-sky-500/10).
.json: Ícone FileCode com destaque roxo (text-purple-500 / bg-purple-500/10).
Estados do Roteiro (Unificados nos 3 Lugares):
none ("Sem roteiro"): badge outline, ícone CircleDashed, cor neutra text-muted-foreground.
building ("Em construção X%"): badge secondary, cor de progresso âmbar/tema.
executing ("Em execução"): badge default (verde da marca), ícone CircleCheck.
finished ("Finalizado"): badge default com confirmação.
Bairro Principal (RF-62):
Ícone MapPin discreto seguido exclusivamente do nome do bairro em Title Case (ex: Copacabana), sem contagem numérica.
Métricas do Resumo (RF-61):
Duração (~1 h 58 min), distância (13,2 km) e paradas (36 paradas), formatadas exatamente com as mesmas funções do Sumário (formatMinutes, formatDistance).
7. Arquivos Modificados e Criados

src/
├── types/
│   └── manifest.ts                           [MODIFY: campo neighborhood em ManifestRouteMeta]
├── utils/
│   ├── formatters.ts                         [MODIFY: getPrimaryNeighborhood via summarizeNeighborhoods]
│   └── routing/
│       └── status.ts                         [MODIFY: centralização de RoteiroPresentation para os 3 lugares]
├── services/
│   └── manifestStorage.ts                    [MODIFY: persistência de neighborhood e backfill]
├── constants/
│   └── uiLabels.ts                           [MODIFY: centralização de rótulos ROUTES_PAGE e status]
├── components/
│   ├── manifests/
│   │   ├── RouteRow.tsx                      [NEW: linha rica de rota no layout do Stitch]
│   │   └── ManifestCard.tsx                  [MODIFY: cabeçalho com ícones tipados e lista de RouteRow]
│   └── map/
│       └── panel/
│           └── RoteiroOverviewSection.tsx    [MODIFY: integração com status centralizado]
├── pages/
│   ├── SummaryPage.tsx                       [MODIFY: consumo de status.ts unificado]
│   └── RoutesPage.tsx                        [MODIFY: carregamento de summaries, ordenação e novo layout]
└── __tests__/
    ├── utils/
    │   ├── formatters.test.ts                [MODIFY: testes de getPrimaryNeighborhood]
    │   └── routing/status.test.ts            [MODIFY: testes da apresentação centralizada]
    ├── services/
    │   └── manifestStorage.test.ts           [MODIFY: teste de neighborhood na rota]
    ├── components/
    │   ├── manifests/RouteRow.test.tsx       [NEW: testes unitários de RouteRow]
    │   └── map/panel/RoteiroOverviewSection.test.tsx [MODIFY: testes do painel de detalhes]
    └── pages/
        ├── RoutesPage.test.tsx               [MODIFY: testes integrados de Rotas]
        ├── SummaryPage.test.tsx              [MODIFY: testes integrados de Sumário]
        └── MapPage.test.tsx                  [MODIFY: testes integrados do Mapa]
8. Plano de Verificação e Critérios de Aceite
Testes Automatizados
powershell

npx vitest run src/__tests__/utils/routing/status.test.ts
npx vitest run src/__tests__/utils/formatters.test.ts
npx vitest run src/__tests__/components/manifests/RouteRow.test.tsx
npx vitest run src/__tests__/pages/RoutesPage.test.tsx
npx vitest run src/__tests__/components/map/panel/RoteiroOverviewSection.test.tsx
npm run typecheck && npm run lint && npm run test && npm run build
node mentor.mjs verificar
Roteiro de Validação Manual
Consistência nos 3 Lugares:
Conferir que o badge e texto de estado ("Sem roteiro", "Em construção", "Em execução") exibidos no Sumário, nos Detalhes do Mapa e na lista de Rotas vêm da mesma regra e possuem os mesmos rótulos.
Permanência de 'Detalhes' no Mapa:
Abrir o mapa em "Ver detalhes" e verificar que os cards de progresso e totais continuam visíveis normalmente durante o planejamento.
Nova Tela de Rotas (Stitch):
Verificar cartões tipados por extensão com ícones correspondentes.
Conferir a linha de cada rota: nome, código AT, contagem de pacotes, bairro principal (sem contagem) e resumo viário (tempo, km e paradas).
Testar o seletor de ordenação ("Mais recentes" vs "Data de importação").
Testar a busca global e a busca interna do cartão multi-rota.
Testar navegação por toque e exclusão com diálogo de confirmação.


------------------
## Decisoes tomadas
- Planejamento refinado com alinhamento do humano: centralizacao absoluta do estado e apresentacao do roteiro em utilitario unico (`status.ts`) que governa de forma identica os 3 lugares que exibem informacoes (Sumario, Detalhes no Mapa e Rotas).
- Comportamento de 'detalhes' no mapa (`RoteiroOverviewSection`): os cards de progresso e totais permanecem sendo exibidos, pois o estado de execucao so mudara quando o usuario clicar em "Iniciar execucao" (funcionalidade que sera introduzida na RF-009).
- Layout do Stitch traduzido para os tokens do projeto (Tailwind + shadcn + Lucide icons), sem novas dependencias externas.
- Bairro principal (RF-62) extraido diretamente atraves do calculo consolidado de `summarizeNeighborhoods`, exibindo apenas o nome do bairro com maior volume de entregas sem contagens numericas.
- Reuso direto do contrato de resumos de roteiro (`RoteiroSummary`) entregue na TASK-RF-047 (RF-61) para exibir tempo, km e paradas apenas quando calculados com malha.
- Ordenacao por uso mais recente com fallback para importacao (RF-60, entregue na TASK-RF-046) disponibilizada com seletor acessivel na pagina de rotas.
- Manutencao do dialogo de confirmacao seguro para exclusao em cascata de romaneios e roteiros.
- Código AT abreviado para os últimos 4 caracteres em tela (`shortAt = route.at.slice(-4)`), mantendo a string completa no `title` para acessibilidade e a busca ativa compatível tanto com o código completo quanto com o sufixo.
- Bairro principal em romaneios únicos: fallback robusto em `summarizeNeighborhoods` para extrair CEP ou bairros conhecidos a partir de `DESTINATION_ADDRESS`, suporte a `dominantNeighborhood` em `routeExport`/`saveStandaloneManifest` e backfill automático de rotas em `listManifests` para manifests já gravados no IndexedDB.
- Ícones de estado com semântica estrita: `CircleDashed` para sem roteiro (`none`), `CircleDot` âmbar para em construção (`building`), `CirclePlay` primário para em execução (`executing`) e `CircleCheck` verde ("ok nike") exclusivo para concluído (`finished`).

## O que nao foi feito, e por que
- Dependencia `@radix-ui/react-dropdown-menu` descartada: botoes diretos e controles acessiveis nativos/shadcn evitam peso adicional no bundle e garantem melhor ergonomia em dispositivos moveis sob a luz do sol.
- Recursos sem suporte de negocio (renomear/duplicar romaneio, botao flutuante de importacao e fluxo de execucao com GPS da RF-009) mantidos fora do escopo conforme o documento de design das telas.

## Testes de descoberta
- A definir durante a execucao e validacao da suite de testes.

## Aprendizados
- A suite completa de 82 arquivos e 1064 testes executou em ~48s com todos os gates passando.
- A centralizacao da apresentacao de status em `status.ts` (`getRoteiroPresentation` e `getRoteiroPresentationFromSummary`) eliminou divergencias entre Sumario, Detalhes no Mapa e a listagem de Rotas, assegurando coerencia visual entre badges, percentuais e rotulos.
- O mapeamento de bairro primario via `getPrimaryNeighborhood(rows, availableCols)` com fallback para `DESTINATION_ADDRESS` resolveu a ausência de bairros em rotas importadas por JSON ou geradas sem colunas explícitas de CEP/Bairro.
- O backfill automático no `listManifests` atualizou os registros do IndexedDB de forma transparente e resiliente, sem exigir reimportação de dados pelo usuário.

## Desfecho e Validacao Real
- **Comportamento observado nos testes e automacao:**
  - 82 arquivos de testes e 1064 testes unitarios e de integracao executados e aprovados com 100% de sucesso.
  - Implementacao de testes dedicados em `RouteRow.test.tsx`, `status.test.ts`, `formatters.test.ts`, `manifestStorage.test.ts` e expansao de `RoutesPage.test.tsx` cobrindo RF-60 (ordenacao), RF-61 (resumo de malha), RF-62 (bairro principal) e RF-63 (busca interna com auto-expansao).
- **Desfecho dos Gates:**
  - `tipos`: APROVADO (`tsc -b` limpo sem nenhum erro).
  - `lint`: APROVADO (`eslint .` com formatacao prettier 100% alinhada).
  - `testes`: APROVADO (1064 testes aprovados).
  - `build`: APROVADO (geracao PWA e bundles de producao concluidos com sucesso).
- **Roteiro para validacao manual pelo usuario:**
  1. Abrir a aba **Rotas** (`/rotas`): verificar o rotulo "Salvos neste dispositivo", contador de romaneios e o seletor de ordenacao.
  2. Alternar o seletor entre "Mais recentes (uso)" e "Data de importacao" e verificar a reordenacao dinamica dos cards.
  3. No cabecalho de cada card de romaneio: verificar o icone tipado (`FileSpreadsheet` para Excel, `FileText` para CSV, `FileCode` para JSON), os badges de formato e tipo de romaneio ("Romaneio Multi" / "Romaneio Unico"), e o botao de lixeira com dialogo de confirmacao.
  4. Nas linhas de rota (`RouteRow`):
     - **Código AT**: verificar que são exibidos apenas os últimos 4 caracteres (ex: `V6CY`, `0001`).
     - **Bairro Principal**: verificar que romaneios únicos e rotas JSON agora exibem o bairro principal ao lado do ícone `MapPin`.
     - **Ícones de Estado**:
       - Sem roteiro: tracejado neutro (`CircleDashed`).
       - Em construção: ponto central âmbar (`CircleDot`).
       - Em execução: play primário (`CirclePlay`).
       - Finalizado: check verde (`CircleCheck` "ok nike", exclusivo para concluído).
  5. No campo de busca do card (romaneios com mais de 3 rotas): digitar trecho de nome ou AT e verificar o auto-expandir do card com o contador "X de N rotas".
  6. Tocar em uma linha de rota: verificar a navegacao para o Sumario da rota (`/sumario`), confirmando que o badge de status e os detalhes refletem exatamente a mesma apresentacao unificada.
- **Resultado da Validacao Manual:**
  - Validacao manual realizada no celular pelo usuario em 19/09/2026: confirmado funcionamento pleno da ordenacao por uso/data, busca no card com auto-expansao, exibicao truncada do codigo AT em 4 caracteres, presenca do bairro principal nos romaneios unicos e diferenciacao visual dos 4 icones de estado com semantica estrita. Conclusao aprovada.
