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

O spike usa o mesmo corpus e snapshots, mas roda separado da matriz histórica:

```powershell
npm run test:auto-fundamentals
```

**Âncoras nos JSONs importáveis (INV-001, TASK-BG-022).** Por padrão, cada parada exportada sai
com a âncora padrão do app: o veículo começa no primeiro pino, e o app o põe na via em frente ao
pino quando a malha carrega. As âncoras escolhidas pelo experimento só saem com a chave explícita,
e o arquivo e o nome do roteiro avisam (`-ancoras-do-experimento`, `ANCORAS DO EXPERIMENTO`):

```powershell
$env:FUNDAMENTAL_ANCORAS_DO_EXPERIMENTO = "1"; npm run test:auto-fundamentals
```

Importe esses arquivos no **preview** do app, nunca no app que guarda roteiros reais: o
armazenamento do preview é separado.

Cada execução cruza procura fundamental de 30/60 m com circuito limitado de 120 m e uma
sensibilidade de 60 m. As variantes são `individual`, `fixed-groups` e `revisable`; cada uma
é avaliada pelos objetivos independentes `vehicleDistance` e `modeledTime`, sem peso oculto.
O início e o fim veiculares são livres em todas as variantes e referências humanas da bateria.
A aproximação de uma origem externa do manual é informada separadamente, nunca somada só a ele.

Antes da bateria, o arnês fixa passo de 10 m, até 8.000 candidatas espaciais, 12 âncoras por
grupo, 24 ordens por seleção, 24 alternativas revisáveis, três passadas e 48 movimentos locais por variante/objetivo.
O teto de movimentos é global à variante/objetivo, não reiniciado por alternativa. Limites
atingidos são gravados em `definitionLimitReached`, `workLimitReached` e nos diagnósticos;
eles delimitam a heurística e não afirmam ótimo global.

O circuito limitado mede âncora → fundamentais → âncora e precisa de caminho validado na malha.
A caminhada completa usa o mesmo circuito de fundamentais e soma, em campo separado, os acessos
estimados fundamental ↔ pino. A distância completa pode ultrapassar 120 m; o teto não é gravado
em `radiusMeters` nem em `autoRadiusMeters`.

As saídas ficam em `.mentor-saidas/auto-fundamentals/<run-id>/`: `report.json`, `summary.md`,
`manifest.json`, `details.json`, mapas HTML locais e JSONs v1 em `importaveis/`. Os mapas embutem
o Leaflet instalado e não usam tiles, API, rede ou JavaScript remoto. Os JSONs são cópias de
inspeção: o schema v1 não persiste fundamental, circuito ou geometria avaliada. Pendências ficam
livres, não ignoradas. Resultado completo do motor ainda não é certificação de estacionamento,
passagem de pedestre, restrições ausentes ou desempenho Android.

O cache usa entradas imutáveis, até 20.000 caminhos por grafo e 2.000 ordens por contexto,
e é limpo antes de cada configuração. O relatório separa uma execução fria de três repetições
com cache aquecido (mediana/p95 empíricos), sem leitura, renderização e importação no tempo do motor.
O A* existente escolhe trajetos com penalidades de conversão/serviço; os metros relatados são
físicos, mas não certificam o caminho de menor distância física em cada trecho. A caminhada
recalculada pelo app atual é outro diagnóstico, não a base para alegar economia experimental.

`status` descreve a execução; `technicalValidity` descreve a validade das soluções. Comparações
excluem pares incompletos, sem converter ausência de caminho em economia. `manualComparisons`
identifica também a compatibilidade dos manuais inalterados com cada teto de circuito.
O manifesto inclui hashes dos JSONs e mapas. A inspeção visual humana permanece pendente.

A rodada `2026-09-10T20-45-35-415Z` é histórica e inválida como evidência de viabilidade: expôs
falhas no adaptador de projeções e na conservação de membros durante a poda revisável.
Os testes de regressão cobrem essas falhas; use somente a nova rodada identificada no registro
da tarefa. Nenhum resultado autoriza promoção ao produto ou fechamento automático do spike.
