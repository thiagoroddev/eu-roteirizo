# Plano da TASK-RF-030 — âncoras livres e comparação real

## Estado atual para retomada

O plano abaixo registra o que foi aprovado e implementado na RF-030, inclusive a antiga
matriz de raios; não é a especificação vigente do próximo experimento. O mantenedor pediu
**planejar e testar separadamente antes de adaptar o restante do épico**. Foi criada somente
na reserva a TASK-SPIKE-002, com [plano aprovado para execução](TASK-SPIKE-002-plano.md).
Não iniciar RF-031/RF-032 usando as premissas antigas para as novas regras.

As regras recentes estão consolidadas no plano do spike e no rascunho sobre raciocínio do
entregador: fundamentais obrigatórios, agrupamento inicial opcional/revisável, circuito
automático de 120 m configuráveis entre referências com retorno e caminhada completa
separada para exibição. Pino afastado do fundamental não deixa entrega órfã. Raios de
procura/aproximação padrão ficam até 60 m; não confundir com o novo teto de circuito.

Estado persistido: RF-030 concluída com autorização específica de fechamento e commit, sem
push, no ramo `codex/task-rf-030-ancoras-livres`. Registro:
[narrativa concluída](concluidas/2026-09-10--16h33--TASK-RF-030.md); gates no JSON homônimo.
O mantenedor aprovou prosseguir com o plano do spike, mas sua implementação não começou.
Reabrir a mesma pasta local para reutilizar corpus/cache/saídas privados; um worktree novo
não recebe esses arquivos nem as alterações alheias preservadas fora do commit.

O run de inspeção a retomar é `2026-09-10T07-02-24-403Z`, com arquivos em
`.mentor-saidas/auto-anchors/2026-09-10T07-02-24-403Z/`. O relatório/manifesto guardam as
contagens, configurações e hashes; `importaveis/LEIA-ME.md` é o índice de importação.
Na preparação deste marco, os hashes dos fontes declarados no relatório e das entradas
declaradas no manifesto foram reconferidos sem divergências. Corpus, cache e saídas
permanecem privados/ignorados. No fechamento, tipos/lint/testes/build foram repetidos e
aprovados; a bateria real histórica não foi repetida com raios acima de 60 m.

O mantenedor importou/inspecionou casos e mostrou por capturas que as pendências de
`case-008-r60m-p10m.json` e `case-013-r60m-p10m.json` têm pinos afastados da rua e podem
receber parada individual no manual. É inspeção pontual, não validação formal de todas
as variantes ou de uma rota otimizada. O motor e o exportador de inspeção ainda aplicam
a regra histórica de raio até o pino; não sobrescrever evidências antigas para refletir
o entendimento novo. A caminhada completa/rota otimizada continua por experimentar.

Armadilhas para continuar: o validador `createInspectionPayload` rejeita membros fora do
raio ao pino; o spike terá adaptador independente. O app recalcula as linhas com sua malha;
o v1 não preserva fundamentais/geometria/limite novo. `task iniciar` sobrescreve o plano
JSON com esqueleto; consultar o plano durável antes de repô-lo. O limite WIP é uma tarefa;
a conclusão da RF-030 libera essa dependência, sem iniciar o spike automaticamente.

Preservar alterações preexistentes em contexto, requisitos, melhorias-do-pacote e rascunhos.
Não apagar romaneios, caches, resultados antigos ou arquivos não rastreados para limpar a
árvore. Os gates históricos continuam no JSON da RF-030; não sustentam conclusões sobre
o novo modelo ainda não implementado.

## Plano histórico aprovado

Plano histórico aprovado e implementado. Não é a especificação do novo experimento.
Origem: RF-34, comportamento de criação RF-52 e esclarecimentos do mantenedor nesta conversa.

## Decisões e objetivo

Uma parada tem três elementos distintos: endereço semente, posição do veículo e entregas atendidas.
A semente fornece a referência inicial de endereço; sua projeção na rua fornece a âncora padrão.
O algoritmo pode escolher outra posição, inclusive outra rua, e depois o usuário pode editar tudo
pelo fluxo existente. Mover o veículo não altera coordenadas ou endereços das entregas.

Decisão expressa do mantenedor: comparar limites configuráveis primeiro. Executar cenários de
30, 60, 90 e 120 m, usando o valor escolhido como limite geométrico até o veículo em cada execução.
São cenários de experimento, não alteração do padrão atual de 30 m. Não flexibilizar o limite
por penalidade nesta primeira etapa. Caminhada pela malha será medida separadamente.

O resultado desta fatia é um conjunto de alternativas espaciais com cobertura verificável,
uma solução gulosa de referência e evidência sobre os dados reais. A solução gulosa não encerra
a escolha das âncoras. A RF-031 precisa poder trocar a rua da parada quando o custo de chegar
e sair dela compensar. A RF-032 poderá ajustar agrupamentos e âncoras ao avaliar o roteiro completo.

## Evidência inspecionada

Inventário local: 20 planilhas XLSX e 5 referências JSON nas pastas numeradas.
Os conjuntos de códigos de pacote de cada par XLSX/JSON coincidiram. Os JSONs não apresentam
membros desconhecidos, endereços repetidos entre paradas ou endereços livres nas referências inspecionadas.

| Referência na pasta romaneios | Endereços | Pacotes | Paradas | Âncoras marcadas como movidas | Membros além do raio salvo |
|---|---:|---:|---:|---:|---:|
| 1/2025-11-19-JQJE-LAGOA.json | 51 | 65 | 36 | 4 | 5 |
| 2/2025-12-15-HWGA-LAGOA.json | 59 | 77 | 33 | 2 | 6 |
| 3/2026-07-06-V6CY-IPANEMA.json | 56 | 83 | 28 | 5 | 10 |
| 4/2026-09-03-9C6P-IPANEMA.json | 65 | 83 | 26 | 4 | 9 |
| 6/2025-11-27-U38T-HUMAITA.json | 53 | 67 | 23 | 1 | 11 |

Contagens calculadas por leitura dos arquivos; não são resultados do algoritmo.
“Membros além do raio salvo” usa distância haversine da âncora ao membro, com tolerância numérica.
Não é erro do roteiro manual: o raio manual sugere membros ao redor da semente e permite inclusão livre.
Por isso a referência humana deve permanecer intacta e receber diagnóstico de compatibilidade com
cada limite automático, sem ser reprovada ou corrigida silenciosamente.

O fluxo real está em `MapPage.tsx:handleCreateStop/suggestedAnchor` e
`overview.ts:nextStopSuggestion`: projeta a semente selecionada. Comentários em
`vehicleStop.ts:defaultAnchorSeed` e no modelo ainda descrevem outra regra, baseada na origem.
Essa função antiga não orientará o motor.

`RouteStop` salva `vehicleStop`, membros, ordem, raio, sentido e `vehicleStopIsDefault`,
mas não salva explicitamente a semente original. `REOPEN_STOP` reconstrói a semente pelo
primeiro membro, que pode ter mudado após mover a âncora. A flag não explica por que houve mudança.

Os caches do spike só possuem `coords/adj`, sem metadados de coleta. O cache com margem de
Copacabana deixa pontos fora de sua envolvente nos casos de Ipanema e Humaitá. Estar dentro
da envolvente também não prova conectividade. Não reutilizá-lo como prova de cobertura integral.

## Algoritmo proposto

1. Receber pontos, IDs ignorados e grafo como entradas imutáveis. Reutilizar os tipos e a
   normalização do produto. Para comparação, reconciliar as linhas do XLSX com os pontos do JSON;
   preservar a precisão das coordenadas e distinguir linhas, locais únicos e pacotes.
2. Gerar a alternativa padrão para cada semente com `suggestVehicleStop`, mantendo sua origem.
   Se a projeção ficar além do limite, preservá-la no diagnóstico do padrão manual, mas não
   aprová-la como candidata automática válida. Grafo ausente nunca vira sucesso por fallback.
3. Enumerar todos os segmentos elegíveis no entorno das entregas, inclusive vias paralelas.
   Um índice espacial simples em grade limita as consultas por região. Não chamar
   `nearestEdge` repetidamente como única fonte de candidatos.
4. Em cada segmento, combinar projeções de entregas, extremidades e amostragem ao longo da via.
   Passo inicial de 10 m, comparado a 5 e 20 m nos experimentos. Incluir/refinar os limites dos
   intervalos de cobertura para não perder um pequeno trecho útil entre duas amostras.
   A aproximação geométrica gera candidatos; haversine decide o pertencimento final ao raio.
5. Cada candidata guarda posição, referência do segmento/posição nele, acessos dirigidos,
   origem da geração e IDs que cobre. Deduplicar apenas posições equivalentes na mesma
   topologia; não unir viaduto e rua abaixo, pistas diferentes ou nós desconectados por
   coincidirem no mapa. Conservar direções de chegada/saída para a RF-031.
6. Preservar alternativas em ruas distintas mesmo que cubram os mesmos endereços ou que uma
   cubra mais que outra. Cobertura maior sozinha não prova menor custo de veículo.
   Retornar a relação candidata/membros além do agrupamento guloso de referência.
7. Construir essa referência atribuindo cada ponto ativo uma única vez, com desempates estáveis.
   Se houver limite de trabalho, expor truncamento e pendências; falta de busca não equivale a
   inexistência de solução. O motor receberá limites configuráveis e contadores de operações.

O grafo atual não comprova estacionamento permitido, acesso a cada imóvel ou todas as passagens
a pé. Esta fatia informa cobertura geométrica e elegibilidade conforme os dados disponíveis.
A validação de trajetos e circuitos pertence à RF-031/RF-032. Na integração, o algoritmo deverá
produzir a mesma forma de parada editável, sem fabricar uma entrega na posição do veículo.

## Arquivos previstos na implementação

| Arquivo | Mudança |
|---|---|
| `src/types/autoRouting.ts` (novo) | Contrato enxuto de candidatas, semente/âncora padrão, cobertura, grupos provisórios, exclusões, pendências e diagnósticos. Reutilizar DeliveryPoint, LatLng e RoadGraph. |
| `src/utils/routing/autoRouteAnchors.ts` (novo) | Geração multivia, índice espacial interno, deduplicação topológica, cobertura e referência gulosa determinística. |
| `src/__tests__/utils/routing/autoRouteAnchors.test.ts` (novo) | Testes rápidos de contratos, bordas geométricas e topologia; sintéticos complementam os reais. |
| `__utilidades-back-office__/auto-roteirizacao/corpus.ts` (novo) | Leitura do corpus local com SheetJS e normalização do produto; pareamento, hashes, validação de referências e relatórios sem dados pessoais nos logs. |
| `__utilidades-back-office__/auto-roteirizacao/prepareGraph.ts` (novo) | Preparação explícita de snapshot OSM com margem, início e metadados; modo de teste nunca busca rede. Adaptar o aprendizado do spike, sem importar seu fallback de download automático. |
| `__utilidades-back-office__/auto-roteirizacao/anchors.arnes.ts` (novo) | Asserções reais obrigatórias e comparação de cobertura/candidatas com os roteiros humanos; resultados locais para inspeção posterior. |
| `__utilidades-back-office__/auto-roteirizacao/vitest.corpus.config.ts` (novo) | Execução Node explícita do corpus real, falhando se faltar arquivo/grafo esperado; logs de evidência gerados em .mentor-saidas. |
| `__utilidades-back-office__/auto-roteirizacao/README.md` (novo) | Comandos, fontes, significado das medidas e como repetir/comparar. |
| `package.json` | Comando `test:auto-anchors` para a suíte real; dependências existentes. |
| `.gitignore` | Incluir a pasta de romaneios reais e os snapshots/resultados privados do experimento; os JSONs atuais ainda aparecem como não rastreados. |

Mudanças condicionais: ampliar `syntheticGraph.ts` só se faltar cenário.
Não alterar o exportador ou o fluxo manual nesta fatia; a evolução da semente persistida foi
encaminhada à RF-034. A preparação de grafos deve reaproveitar funções puras de OSM/graph.
Se a falta de dados de acesso impedir um caso importante, apresentar a ampliação necessária,
sem fabricar ruas ou encaixar o veículo em uma via distante.

## Bateria de testes e comparação

### Dados reais obrigatórios desde a RF-030

- Rodar todas as planilhas inventariadas e todas as referências numeradas. Arquivo inválido,
  grafo insuficiente ou caso não medido tem estado próprio; não reduzir o corpus silenciosamente.
- Usar as coordenadas reais sem deslocamento, jitter ou arredondamento extra. A regra atual
  de união de locais do produto continua sendo a referência de normalização.
- As referências humanas entram no avaliador, não no gerador de candidatas: não injetar suas
  âncoras para o algoritmo “encontrá-las”. Se a geração perder uma rua útil, isso é um resultado.
- Medir alcance das alternativas: para cada parada humana, há candidata na mesma região da
  via capaz de atender aqueles membros sob o limite do cenário? Informar distância à âncora
  humana e diferença de membros. Selecionar e congelar os casos de outra rua após validar o
  snapshot; a flag “movida” sozinha não prova que mudou de rua.
- A comparação espacial da RF-030 mostra cobertura, paradas provisórias, distâncias em linha
  reta, candidatos, limites atingidos e tempo. Não chamar essas distâncias de caminhada real,
  nem atribuir economia de veículo antes da RF-031/RF-032.
- Na comparação completa, recalcular ambas as soluções com o mesmo grafo, início, definições
  de distância, penalidade D3 e velocidades. Mostrar separadamente referência humana como
  salva e sua compatibilidade com cada limite. Não reduzir o mérito de uma referência por
  violar uma restrição que não existia no fluxo manual.
- Usar Lagoa/Ipanema para desenvolvimento e reservar Humaitá para comparar variantes sem
  calibrar os pesos nele. Separação pequena e regional: não demonstra generalização ampla.
  Todo caso continua participando da regressão final.

### Asserções de validade

Toda entrega ativa é coberta uma vez ou aparece pendente com motivo; ignorados ficam separados.
Nenhum pacote se perde. Todo membro automático está dentro de R da âncora. Candidatas nascem em
segmentos do grafo e mantêm suas direções. Mesma entrada gera a mesma saída sem mutações.
Permutar a ordem de enumeração do grafo/pontos não pode mudar o desempate documentado.
Testar vazio, coordenada inválida, raio zero/inválido, limite exato, grafo ausente e busca truncada.
Sintéticos pequenos isolam essas bordas; a evidência de utilidade usa as coordenadas reais.

### Experimentos de qualidade e desempenho

Comparar padrão da semente, multivia com cobertura gulosa e alternativas preservadas.
Cruzar raios 30/60/90/120 m e passos 5/10/20 m. Guardar configuração, versão do código,
hash do corpus, identidade do grafo, quantidade de segmentos/candidatas/testes de distância,
tempo por fase e resultado por caso. Medir tempos com aquecimento e repetições, com mediana,
p95 e ambiente identificado. Não confundir a meta de 150 ms de uma busca A* com todo o motor.

Quando a qualidade justificar, experimentar na RF-031/RF-032 olhar adiante, troca de âncoras,
transferência de membros, união/divisão de paradas e estratégias por corredores.
Cada variante deve demonstrar ganho no corpus e reportar regressões. Começar com heurísticas
inspecionáveis; não há evidência aqui para descartar outras abordagens em termos absolutos.

Critério para a RF-030: invariantes passam em todos os casos executáveis e casos reais
selecionados de outra rua têm alternativas válidas. Casos sem malha adequada precisam de
preparação ou impedimento explícito antes do aceite. Não exigir copiar a sequência humana,
vencer todos os roteiros ou atingir percentual de melhora inventado.

Os testes reais são obrigatórios localmente. A CI pública mantém testes determinísticos sem
dados privados; CI verde não substitui o relatório real desta tarefa. O comando local deve
falhar se não executar os casos esperados. Registrar saída, código de saída e identificação
do run. Os gates declarados de tipos/lint/testes/build serão executados via `mentor task gate`;
neste planejamento eles não foram executados.

## Informações que vale acrescentar aos JSONs

Os arquivos existentes bastam para comparar a solução final com a entrada. Para reproduzir
exatamente os cálculos históricos, faltam a identidade da malha e a versão do código.

Recomendo informações opcionais em dois lugares:

- No roteiro, em RF-034: `seedPointId` explícito por parada, preservado ao mover/reabrir/salvar.
  É a referência do endereço inicial e do reset. Roteiros legados usam fallback declarado;
  não inventar a semente histórica a partir da primeira entrega atual.
- Em metadados locais de comparação: hash dos arquivos, versão do algoritmo, snapshot OSM
  (hash, coleta, limites, versão de construção e natureza do grafo pedestre), configuração e
  situação da referência (“planejada” ou “executada em campo”). Dados deriváveis são gerados.
- Anotações suas por parada, opcionais: motivo da âncora (“evitar retorno”, “seguir corredor”,
  “acesso mais fácil”), tipo de veículo, preferência a pé/veículo e passagem/estacionamento
  conhecido. Uma posição inicial ou sequência de edições só é necessária se quisermos
  analisar o processo da decisão, além de comparar o resultado.

Distâncias, tempos e conversões ficam no relatório calculado com essa identidade. Não precisam
ser preenchidos à mão nem virar verdade permanente do roteiro. Os relatórios detalhados e
GeoJSONs podem ficar locais. A extensão aprovada abaixo antecipa JSONs de inspeção espacial;
RF-032/TEST-004 continuam responsáveis pelo roteiro completo comparável.

## Extensão aprovada — inspeção no importador existente

O mantenedor precisa examinar as saídas no mapa do app. Aprovou antecipar somente a exportação
de inspeção na RF-030, sem mudar schema, importador, UI ou implementar a otimização das próximas
fatias. O erro `Schema não reconhecido: undefined` era esperado ao tentar importar um GeoJSON.

- `corpus.ts`: converter grupos provisórios em paradas e usar `createRouteExportPayload`, preservando
  todas as linhas/pacotes/coordenadas, âncoras e exclusões reais. Pendências permanecem livres.
  Reutilizar a ordem a pé padrão do app apenas para apresentação, sem otimizar a sequência veicular.
- `corpus.test.ts`: testes prévios com parser, importador/armazenamento em IndexedDB de teste e
  hidratação do reducer reais; verificar conservação, edição e isolamento entre referências/variantes.
- `anchors.arnes.ts`: gerar variantes importáveis por raio no passo de 10 m, verificar todos os JSONs
  com o importador do produto em armazenamento isolado e emitir índice de arquivos para o mantenedor.
- `README.md` e registros desta tarefa: instruções de importação e limites da comparação.

Aceite: os JSONs usam `eu-roteirizo/roteiro/v1`, abrem como roteiros independentes, preservam
âncoras/membros/pacotes e não sobrescrevem manuais ou outros cenários. Todas as pendências continuam
visíveis, não convertidas em ignoradas. O nome indica inspeção e sequência não otimizada. A preparação
deve gerar novos identificadores por cenário/execução; reimportar o mesmo arquivo só atualiza sua cópia.

Início e configurações vêm da referência humana quando existentes, apenas na montagem para exibição;
sem referência, início permanece não definido e as demais configurações usam os padrões do app.
O gerador de âncoras continua sem consultar escolhas humanas. A semente histórica não é acrescentada
ao schema: o relatório a preserva, e a evolução da persistência continua na RF-034.

Riscos: confundir caminhos desenhados pelo app com resultado otimizado; fallback reto quando faltar
malha/caminho; IDs reutilizados sobrescreverem dados; hidratação descartar membros desconhecidos.
Mitigação: rótulos explícitos, IDs opacos separados, invariantes antes de exportar e importação testada.
Os JSONs são privados e ficam na pasta local de resultados, sem publicação ou novos pacotes.

Proporcionalidade: pediram ver âncoras e agrupamentos no app; adaptar a saída aos contratos já
existentes resolve essa inspeção em arquivos do arnês, sem criar outro visualizador nem ampliar
o motor de roteirização. A tarefa continua aberta para revisão, sem autorização de commit/fechamento.

## Ajuste do épico e impacto

Ordem pelas dependências existentes:
RF-030 → RF-031 → RF-032 → TEST-004 → RF-034 → RF-033.
A numeração das fatias no backlog não representa essa ordem.

- RF-030: alternativas espaciais e primeiros testes reais.
- RF-031: escolha conjunta da âncora e sequência com chegada/saída e custo D3 aprovado.
- RF-032: circuitos a pé, reparo/reagrupamento limitado e resultado completo comparável.
- TEST-004: amplia o mesmo corpus/arnês, compara qualidade completa e prepara inspeção humana.
- RF-034: aplicação, worker, persistência da semente e edição sem perder a âncora escolhida.
- RF-033: botão, experiência de uso e validação no aparelho.

Alcance: domínio puro e ferramentas locais de avaliação; integração permanece em fatias próprias.
Reversibilidade: módulos aditivos e registros de planejamento, sem migração de dados nesta fatia.
Riscos: amostragem perder bons locais, poda descartar ruas úteis, raio geométrico encobrir
barreiras, malha incompleta, excesso de candidatos e ajuste excessivo às referências.
Novas dependências: nenhuma prevista. Estimativa revisada da RF-030: M/G, por incluir preparação
e testes reais; revisar a divisão se isso ultrapassar o escopo de uma fatia.

Proporcionalidade: pediram âncoras livres reproduzindo o fluxo manual e testes comparáveis aos
romaneios reais. Proponho o módulo espacial mais um pequeno arnês reaproveitável pelo épico.
Essa ampliação permite avaliar a ideia antes da interface; não exige plataforma de treinamento,
backend ou framework novo.

Achados a encaminhar: JSONs reais fora do ignore; comentários antigos sobre a semente; semente
original não persistida; malha atual insuficiente para parte do corpus. A inspeção de planilhas
também encontrou dimensões declaradas pequenas em arquivos com mais células: usar o parser
do produto e reconciliar linhas, sem confiar apenas nas dimensões do XLSX. Nenhuma conclusão
nova sobre vulnerabilidades, desempenho do motor ou sucesso dos gates foi produzida aqui.
