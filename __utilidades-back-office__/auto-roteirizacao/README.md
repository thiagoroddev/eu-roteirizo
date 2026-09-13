# Experimentos locais de âncoras livres

A RF-030 avalia **onde o veículo poderia parar e quais entregas essa posição cobre**.
Ainda não ordena o roteiro, calcula caminhada ou comprova estacionamento permitido.
As referências humanas são somente entrada do avaliador: suas âncoras não alimentam o gerador.

## Repetir a comparação

Execute na raiz do repositório, com as dependências já instaladas:

```powershell
# Inventário e extensão necessária: não usa rede nem altera os originais.
npm run test:auto-anchors -- --mode inventory

# Primeiro uso: prepara a malha OSM; usos seguintes verificam e reutilizam o snapshot.
npm run prepare:auto-anchors

# Matriz real, inteiramente offline, separada da suíte pública.
npm run test:auto-anchors
```

A preparação inicial consulta o Overpass com a envolvente geográfica, sem enviar planilhas,
nomes, endereços ou códigos de pacotes. É uma ação explícita, não um fallback dos testes.
Se houver mudança do corpus, do construtor de grafos ou corrupção de cache, a execução falha.
Para preparar outra versão intencionalmente, use
`npm run test:auto-anchors -- --mode refresh`. Isso consulta a rede e atualiza o índice;
os snapshots anteriores, identificados pelo conteúdo, permanecem disponíveis.

Os originais ficam em `__utilidades-back-office__/romaneios/`. Todas as planilhas XLSX e
referências JSON encontradas são inventariadas. O leitor usa SheetJS, normalização de colunas
e construção de pontos do próprio app. Não altera, desloca ou simplifica as coordenadas.
O pareamento é por pasta; ambiguidades ou divergências entre pacotes, coordenadas e referências
interrompem a validação. O índice registra os arquivos esperados: removê-los não torna a suíte verde.

Os testes comuns (`npm run test`) verificam também o leitor usando arquivos sintéticos.
Eles não substituem a bateria privada. Sem corpus ou snapshot, a bateria real falha, não pula casos.

## Como interpretar

A matriz cruza raios de **30, 60, 90 e 120 m** com passos de amostragem de **5, 10 e 20 m**.
Cada cenário usa aquecimento e cinco repetições medidas. Projeções, extremidades, limites
e meios dos intervalos de cobertura complementam as amostras regulares.

O limite é a distância haversine da âncora até cada entrega. Não é comprimento da caminhada.
O padrão de raio do app não muda. Uma referência manual fora desse limite continua preservada
e recebe apenas um diagnóstico de compatibilidade com o cenário; o fluxo manual permite
inclusões que essa restrição automática não permite.

O gerador preserva candidatas de ruas diferentes, inclusive com os mesmos membros, e suas
direções de acesso no grafo. O agrupamento guloso é uma referência espacial disjunta, não uma
decisão final de roteiro. A RF-031 poderá trocar a âncora conforme o custo de chegar e sair.
A semente e sua âncora padrão são preservadas separadamente da posição escolhida para o veículo.

Estados importantes:

- `complete`: todos os pontos ativos foram agrupados sem truncar a busca espacial.
- `partial`: há pendências ou foi atingido um limite de trabalho; não equivale a roteiro inviável.
- `invalid`: entradas ou configuração inválidas, sem aprovação por fallback.
- `no-candidate-in-radius`: nenhuma posição cobriu o ponto na malha e busca consideradas.
- `search-limit`: o orçamento de busca acabou; não demonstra ausência de solução.
- `missing-graph`: não há malha veicular utilizável.

As opções `maxCandidates`, `maxSegments`, `maxDistanceChecks`, `maxGridCells` e `maxGroupChecks`
limitam trabalho e memória intermediária. Atingir um limite torna o resultado explicitamente parcial.
O índice espacial foi projetado para grafos urbanos de bairro; não é um indexador geodésico mundial.

## Resultados para sua comparação

Cada execução gera uma pasta nova em `.mentor-saidas/auto-anchors/`, sem sobrescrever anteriores:

- `summary.md`: resumo por raio/passo, pendências e tempos.
- `manifest.json`: vínculo do identificador opaco `case-*` com o romaneio original e snapshots.
- `report.json`: métricas por cenário, ambiente, hashes de código/corpus/grafo e tempos por fase.
- `details.json`: grupos provisórios, sementes, membros, pendências e comparação das paradas humanas.
- `case-*-r*.geojson`: entregas, âncoras humanas e âncoras provisórias, para o passo de 10 m.
- `importaveis/LEIA-ME.md`: índice por romaneio/raio e instruções para abrir as saídas no app.
- `importaveis/case-*-r*m-p10m.json`: variantes de inspeção no schema **eu-roteirizo/roteiro/v1**.
- `importaveis/index.json`: inventário das variantes; é auxiliar, não um roteiro importável.
- `evidence.txt`: identificação compacta da execução; conferir também o código de saída do comando.

Os GeoJSONs não são roteiros importáveis pelo app e não contêm trajetos viários.
Para usar **Importar roteiro (.json)**, escolha um arquivo `case-*-r*m-p10m.json` da pasta
`importaveis`, nunca `index.json`, `report.json`, `details.json` ou um GeoJSON.

Os JSONs de inspeção reutilizam o exportador v1 do produto. Cada variante passa pelo parser,
importador, leitura do armazenamento e hidratação do reducer reais, com IndexedDB em memória
exclusivo do processo de teste. Não acessam nem limpam o armazenamento do seu navegador.
As linhas/pacotes e posições são preservadas, pendências continuam livres e a ordem interna
de cada parada usa o padrão atual do app. A sequência entre paradas **não foi otimizada**.

Os nomes incluem `INSPEÇÃO` e `NÃO OTIMIZADO`. IDs separados por cenário/execução preservam suas
referências manuais e outras variantes. Reimportar **o mesmo arquivo** atualiza a cópia experimental
e pode substituir edições feitas nela: exporte sua cópia editada antes de reimportar.
O início/configurações da referência são usados quando existem, apenas para a apresentação.
Sem referência, o início permanece não definido; os outros parâmetros usam os padrões do app.

Ao abrir a cópia, o app recalcula linhas de veículo e circuitos a pé com a malha que estiver
carregada nele, não necessariamente o snapshot da bateria. Quando não há malha/caminho, o app
pode mostrar trechos retos. Isso permite inspecionar e editar âncoras/grupos **agora**, mas não
comprova qualidade dos percursos. O roteiro completo otimizado continua nas fatias seguintes.
O schema atual não persiste a semente explicitamente: `details.json` guarda a semente e a âncora
padrão do motor; reabrir/resetar segue o comportamento atual do app, cuja evolução é RF-034.

Os tempos cobrem somente o gerador espacial, não leitura, avaliação humana ou trajetos.
O p95 é empírico sobre poucas repetições; não certifica desempenho Android nem o custo do épico.
As verificações de outra rua contam combinações compatíveis de parada, raio e passo — não
casos humanos independentes. Diferenças de grupos não demonstram ganho de veículo ou a pé.

## Privacidade e limitações

Corpus, cache e saídas são locais e ignorados pelo Git. Os logs usam identificadores opacos,
sem coordenadas, endereços ou rastreamentos; `pt_*` e `stop_*` também podem revelar coordenadas.
**Não publique os detalhes, snapshots, JSONs importáveis ou GeoJSONs nem os envie a visualizadores públicos.**
O ignore evita inclusão acidental, mas não criptografa os dados; mantenha o controle de acesso
da máquina. Esses arquivos não são incluídos no bundle do app; só entram no armazenamento local
quando você os escolhe no importador.

Dados viários: © colaboradores do OpenStreetMap, ODbL; a coleta e identidade da malha constam
no manifesto local. A malha atual não certifica estacionamento, todas as restrições de conversão,
acesso aos imóveis ou passagens de pedestres. A RF-031/RF-032 precisa validar os trajetos antes
de declarar uma solução completa. Para JSONs futuros, `seedPointId` persistido é o incremento
prioritário; a evolução compatível do formato fica em RF-034, sem reescrever suas referências.

## Experimento de pontos fundamentais

O spike usa o mesmo corpus e snapshots, mas cada comando executa **um único roteiro**. Nesta
fase só são aceitos os roteiros 1 e 2, sempre em rodadas separadas:

```powershell
$env:FUNDAMENTAL_CASE = "1"
npm run test:auto-fundamentals

$env:FUNDAMENTAL_CASE = "2"
npm run test:auto-fundamentals
```

Uma rodada com N endereços avalia exatamente N inícios em cada uma destas três estratégias:

- `seeded-revisable`: começa com o agrupamento espacial e pode revisá-lo;
- `unseeded-revisable`: começa com todos os endereços individuais e pode formar grupos;
- `individual`: começa e termina sem agrupamento.

Cada endereço normalizado vira uma candidata de início no seu ponto fundamental. A candidata deve
pertencer à primeira parada e é persistida como `route.startPoint`. Portanto, são N × 3 tentativas,
mas somente o menor percurso **completo** de cada estratégia vence. Uma tentativa parcial nunca
ganha de uma completa por exibir uma distância numericamente menor.

A configuração está fixa em procura de 60 m e circuito de 120 m (`r60/c120`).
`vehicleDistance` é o único objetivo usado na seleção. `modeledTime`, caminhada e acessos são
métricas secundárias do mesmo resultado, não objetivos duplicados. Os limites internos da
heurística continuam explícitos em `definitionLimitReached`, `workLimitReached` e diagnósticos;
enumerar todos os inícios não demonstra ótimo global de TSP.

O circuito limitado mede âncora → fundamentais → âncora e precisa de caminho validado na malha.
A caminhada completa usa o mesmo circuito de fundamentais e soma, em campo separado, os acessos
estimados fundamental ↔ pino. A distância completa pode ultrapassar 120 m; o teto não é gravado
em `radiusMeters` nem em `autoRadiusMeters`.

As saídas ficam em `.mentor-saidas/auto-fundamentals/<run-id>/`: `report.json`, `summary.md`,
`manifest.json`, um mapa HTML local e a pasta `importaveis/`. Todas as tentativas ficam compactadas
no único `report.json`; não se grava um JSON para cada início. A pasta `importaveis/` contém
exatamente três JSONs, um vencedor por estratégia, com nomes como:

- `1-r60-c120-com-agrupamento-inicial.json`;
- `1-r60-c120-sem-agrupamento-inicial.json`;
- `1-r60-c120-sem-agrupamento.json`.

O prefixo muda para `2` na rodada do roteiro 2. Os mapas embutem o Leaflet instalado e não usam
tiles, API, rede ou JavaScript remoto. Os JSONs são cópias de inspeção: o schema v1 preserva início
e paradas, mas não fundamental, teto de circuito ou geometria avaliada.

O cache usa entradas imutáveis, até 20.000 caminhos por grafo e 2.000 ordens por contexto,
e é limpo antes de cada rodada. Não se repetem todos os cálculos apenas para benchmark; os contratos
de determinismo ficam nos testes unitários, evitando multiplicar o custo da bateria privada.
O A\* existente escolhe trajetos com penalidades de conversão/serviço; os metros relatados são
físicos, mas não certificam o caminho de menor distância física em cada trecho. A caminhada
recalculada pelo app atual é outro diagnóstico, não a base para alegar economia experimental.

`status` descreve a execução; `technicalValidity` descreve a validade das soluções. Comparações
com a referência humana usam o miolo da rota com aproximação externa livre para ambos; a aproximação
externa armazenada no manual aparece separada no relatório. Resultados parciais são excluídos como
vencedores. O manifesto inclui hashes dos três JSONs e do mapa.

As rodadas anteriores permanecem apenas como histórico e não atendem a este contrato multi-início.
A inspeção humana dos três vencedores continua obrigatória. Nenhum resultado autoriza promoção ao
produto, expansão para os demais roteiros ou fechamento automático do spike.
