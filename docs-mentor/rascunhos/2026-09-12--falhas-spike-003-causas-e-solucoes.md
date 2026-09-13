# Falhas observadas no SPIKE-003: causas, pontos cegos e soluções candidatas

Rascunho aberto em 12/09/26 durante a validação humana da `TASK-SPIKE-003`.

> Rascunho não é tarefa: sem gate, sem critério de aceite, fora da fila.
> Este documento é diagnóstico. As soluções descritas aqui não estão autorizadas para implementação.

## Regra de trabalho vigente

A partir da interrupção feita pelo mantenedor nesta sessão:

- parar novas correções no algoritmo;
- não executar o roteiro 2 nem gerar nova rodada sem autorização explícita;
- para cada novo erro, primeiro reproduzir e descobrir a causa;
- registrar expectativa, comportamento observado, evidência, causa comprovada ou hipótese, o que a IA deixou de enxergar e uma solução candidata;
- não transformar automaticamente a solução candidata em código;
- manter os casos limitados aos roteiros 1 e 2 até que esses dois estejam bem otimizados;
- manter todas as tentativas em um único relatório e somente o melhor de cada estratégia em três JSONs importáveis.

As alterações que já haviam sido feitas antes da ordem de parada foram mantidas. Elas estão registradas abaixo como alterações experimentais, não como problemas resolvidos.

## Semântica confirmada pelo mantenedor

Há três estratégias diferentes:

1. `com agrupamento inicial`: começa com um agrupamento e pode revisá-lo;
2. `sem agrupamento inicial`: começa com todos os endereços separados, mas deve descobrir agrupamentos durante a otimização;
3. `sem agrupamento`: nunca agrupa; o veículo se desloca para o próximo endereço individual.

Consequências importantes:

- `sem agrupamento inicial` não é sinônimo de `sem agrupamento`;
- quando endereços permanecem separados, isso significa novo deslocamento/parada do veículo;
- se há um agrupamento viável evidente, como o conjunto mostrado entre P14 e P18 no print, a estratégia agrupável precisa ao menos avaliá-lo;
- cada endereço normalizado pode ser tentado como início: 51 endereços permitem 51 inícios, 80 permitem 80;
- cada rodada deve produzir exatamente três JSONs, um vencedor por estratégia, e não um JSON por tentativa;
- os nomes devem começar pelo número do roteiro, de 1 a 6;
- nesta fase só se usam os roteiros 1 e 2 e a configuração `r60/c120`;
- `vehicleDistance` é o objetivo principal declarado e `modeledTime` é métrica informativa, mas essa definição ainda não representa todo o custo operacional de parar o veículo.

## Contexto herdado do SPIKE-002

O SPIKE-002 deveria responder principalmente se havia órfãos e permitir comparar comportamentos com agrupamento inicial e sem agrupamento inicial. Ele não tinha maturidade para alegar otimização final.

Achados humanos daquele spike:

- `r60/c120` agrupou melhor;
- quase não houve diferença prática entre selecionar por `modeledTime` e por `vehicleDistance`;
- todos os roteiros continuaram muito mal otimizados;
- a referência humana citada tem aproximadamente 8 km, enquanto um JSON chegou a aproximadamente 20 km, mais que o dobro;
- foram explorados casos demais cedo demais, consumindo tempo e tokens antes de estabilizar dois casos.

Ponto cego de processo: a IA tratou uma matriz ampla como sinal de rigor, mas quantidade de execuções não compensou a falta de contratos semânticos básicos. O resultado acumulou muitos números e pouca explicação sobre decisões erradas.

Solução candidata de processo, ainda não executada: manter somente dois casos, usar a validação humana como fonte de novas perguntas, e só ampliar a matriz quando os erros encontrados nesses casos estiverem explicados e os critérios de decisão forem explícitos.

## Erro 1 — `sem agrupamento inicial` terminou igual ao individual

### Expectativa

A estratégia começa com 51 unidades individuais, mas pode unir endereços quando encontra um circuito viável. Apenas o que não for agrupado exige deslocamento do veículo para a próxima parada.

### Comportamento observado

No roteiro 1, todas as 51 tentativas de `unseeded-revisable` terminaram com 51 paradas, exatamente como `individual`. O print mostrava endereços próximos, entre P14 e P18, que deveriam ao menos ter sido considerados para agrupamento.

Apesar de a saída ter distância diferente da individual, a diferença não vinha de agrupamento. A análise encontrou:

- 46 das 51 âncoras foram movidas mais de 1 m;
- 42 foram movidas mais de 10 m;
- deslocamento médio aproximado de 33,3 m;
- deslocamento máximo de 60 m.

Portanto, a saída era essencialmente uma rota individual com paradas de veículo móveis.

### Causa comprovada

O gerador anterior partia da partição individual e enumerava fusões com laços aninhados. Com limite de 24 alternativas, eram avaliadas a base e as primeiras 23 fusões, todas envolvendo o primeiro endereço da ordem técnica.

O endereço inicial dessa enumeração tinha o fundamental mais próximo a aproximadamente 70,2 m. Qualquer circuito fechado unindo os dois exigiria pelo menos 140,5 m, acima de `c120`. Assim:

- todas as alternativas consumidas pelo orçamento eram inviáveis;
- pares viáveis entre os outros 50 endereços nunca eram alcançados;
- não havia fusões iterativas capazes de formar mais de um grupo;
- a base individual necessariamente vencia.

### O que a IA não enxergou

- O orçamento não estava distribuído pela rota; ele estava concentrado no primeiro índice do laço.
- Verificar apenas `initialGroupCount === 51` não prova que a estratégia conseguiu agrupar depois.
- Uma estratégia pode ter nome e estado inicial corretos e ainda ser semanticamente igual a outra na saída.
- Alterar âncoras individuais mascarou a ausência de agrupamento ao produzir números diferentes.
- A busca precisava ter um contrato sobre transições permitidas e resultado final, não apenas sobre a entrada.

### Solução candidata

Construir a busca a partir de unidades individuais, mas gerar oportunidades de fusão espacialmente viáveis por toda a rota. O orçamento deve ser diversificado entre regiões/grupos, não consumido pela ordem dos IDs. O relatório deve dizer quais fusões foram avaliadas, aceitas e rejeitadas.

O teste mínimo precisa provar simultaneamente que:

- a contagem inicial continua individual;
- um grupo viável longe do primeiro endereço é descoberto;
- a estratégia termina com menos paradas que `individual` naquele cenário;
- `individual` continua proibida de agrupar.

### Alteração já aplicada antes da ordem de parada

Foi adicionada `unseededDefinitionsFrom` em `fundamentalExperiment.ts`. Ela usa grupos encontrados pela busca comum, avalia cada grupo isoladamente e também partições cumulativas. Também foi adicionado um desempate que prefere menos paradas quando a distância veicular é equivalente em até 0,1 m.

Foi criado um teste sintético em `fundamentalExperiment.test.ts` com um primeiro endereço distante e um par viável em outra parte da rota. O teste falhou antes da alteração e passou depois.

### Limites e risco da alteração já aplicada

Essa alteração não está aprovada como solução final:

- ela reutiliza como alvos os grupos produzidos por `fixedDefinitions`, isto é, a estratégia sem agrupamento inicial não descobre grupos por uma busca independente; ela recebe oportunidades derivadas da mesma busca usada pela base agrupada;
- por isso, seeded e unseeded podem convergir para exatamente os mesmos 39 grupos sem demonstrar que os processos são realmente diferentes;
- o limiar de equivalência de 0,1 m foi escolhido tecnicamente, sem decisão de produto;
- o desempate por menos paradas corrige empate, mas não modela o custo real de estacionar, arrancar, manobrar ou atravessar a rua;
- o harness privado ainda não exige que o vencedor real de `unseeded-revisable` tenha agrupado quando há oportunidade viável.

## Erro 2 — parada 12 moveu o veículo cerca de 49 m sem benefício veicular

### Evidência

Arquivo inspecionado:

`.mentor-saidas/auto-fundamentals/roteiro-1-2026-09-12T11-29-09-098Z/importaveis/1-r60-c120-com-agrupamento-inicial.json`

Na parada 12:

- âncora escolhida: `-22.981399237176767, -43.19914591008527`;
- fundamental esperado em frente ao primeiro endereço: aproximadamente `-22.98131241573038, -43.19952310116955`;
- distância visual/informada: cerca de 49 m;
- trecho veicular local P11 → P12 → P13: aproximadamente 196,55 m nas duas opções;
- caminhada limitada com a âncora escolhida: aproximadamente 86,98 m;
- caminhada aproximada mantendo o fundamental: aproximadamente 62,73 m;
- piora de caminhada: aproximadamente 24,25 m, sem redução veicular correspondente.

### Causa comprovada

Havia dois mecanismos combinados:

1. `anchorsForGroup` colocava a `seedAnchor` candidata antes dos fundamentais dos endereços;
2. quando duas âncoras tinham o mesmo delta de `vehicleDistance`, o desempate usava o ID técnico.

Como `candidate:...` ordena antes de `fundamental:...`, um detalhe de serialização decidia onde o veículo parava. O algoritmo não tinha a regra “sem ganho, preserve o padrão”.

### O que a IA não enxergou

- Empate também é decisão de produto; não pode ser deixado para ordem alfabética de IDs internos.
- Um objetivo que olha apenas metros do veículo não percebe caminhada pior nem mudança desnecessária para o entregador.
- A âncora padrão possui significado operacional e visual; não é só mais uma candidata geométrica.
- O algoritmo não explicava sua escolha. A causa só apareceu após reconstruir os dois trechos manualmente.

### Solução candidata

Definir primeiro, de forma imutável, qual é o endereço-semente e sua parada padrão segundo a mesma regra do app. Só mover a âncora quando houver ganho veicular explícito e suficiente, respeitando um limite aprovado de piora a pé. Em empate, preservar a padrão. Registrar no relatório:

- âncora anterior e candidata;
- predecessor e sucessor usados no cálculo;
- delta veicular;
- delta de caminhada;
- regra de desempate;
- motivo de aceitar ou rejeitar o movimento.

### Alteração já aplicada antes da ordem de parada

- os fundamentais passaram a ser enumerados antes da `seedAnchor`;
- o desempate por ID foi removido da movimentação local;
- uma mudança exige melhora superior ao limiar técnico de 0,1 m;
- foi criado um teste de corredor reto no qual mover a âncora não reduz a distância veicular.

### Evidência de que a alteração ainda não resolve a regra humana

Na rodada executada depois da alteração, o mesmo conjunto de cinco endereços apareceu na parada 11 com:

- âncora `-22.98132051772954, -43.19934707349574`;
- `vehicleStopIsDefault: true`;
- outro endereço colocado como primeiro do grupo.

Isso não restaura o fundamental originalmente apontado pelo mantenedor. A implementação escolheu outro fundamental do grupo e depois reordenou os membros para que esse endereço passasse a ser o primeiro. Em outras palavras, pode ter mudado a definição de “primeiro” para justificar a âncora escolhida.

O teste novo também usa o primeiro ID técnico do grupo como expectativa. Ele pode estar congelando uma conveniência da implementação, e não a regra operacional do entregador. Este erro continua aberto.

## Erro 3 — o JSON marcava todas as âncoras como editadas

### Comportamento observado

O exportador gravava `vehicleStopIsDefault: false` em todas as paradas. A interface confia nessa flag para mostrar “próximo ao número ... (Nm)”. Assim, até uma âncora na posição padrão aparecia como se tivesse sido editada.

Esse problema já estava documentado antes em:

`docs-mentor/rascunhos/2026-09-11--experimento-forca-vehiclestopisdefault-false.md`

### Causa comprovada

`createExperimentalRoutePayload` fixava a flag em `false`, e `validateExperimentalPayload` exigia `false` como invariante. O artefato confundia “resultado de um experimento” com “parada manualmente movida”.

### O que a IA não enxergou

- A flag representa proveniência/estado, não distância geométrica até o pino.
- O validador pode reforçar um erro em vez de proteger o contrato.
- Já existia um rascunho alertando exatamente sobre isso, mas ele não foi consultado antes da correção rápida.
- Não havia informação suficiente no `FundamentalSolution` para afirmar corretamente qual seria a parada padrão do app.

### Solução candidata

Carregar no resultado da otimização, para cada grupo, a semente padrão, a coordenada produzida pela mesma função usada no produto e a proveniência da âncora final. O exportador deve apenas persistir esse fato; não deve inferi-lo a partir da ordem final.

Também é necessário reconciliar duas regras hoje distintas:

- `buildFundamentalReferences` usa `suggestVehicleStop`, que projeta na aresta mais próxima;
- o fluxo atual do app usa `defaultVehicleStop`, que prioriza a rua do endereço e evita acessos internos sem nome.

### Alteração já aplicada antes da ordem de parada

O exportador passou a marcar `true` quando a âncora tem origem `fundamental` e o ID desse fundamental coincide com o primeiro membro da ordem final. O validador agora exige apenas que a flag seja booleana. Um teste garante `true` para paradas individuais fundamentais.

### Limites e risco da alteração já aplicada

Essa inferência é circular: o algoritmo escolhe uma âncora, reordena o grupo para deixar perto dela o primeiro endereço e, então, o exportador usa essa mesma ordem para declarar a âncora “padrão”. Isso não prova que o app criaria a parada ali.

A rodada posterior registrou 26 âncoras padrão e 13 editadas em `seeded-revisable`, e 27 padrão e 12 editadas em `unseeded-revisable`, mas esses números não foram validados contra a regra real do produto.

## Erro 4 — o objetivo não representa o custo de usar o veículo entre endereços

### Causa conceitual confirmada

Em uma mesma rua, visitar dois pontos individualmente ou agrupá-los pode produzir a mesma soma de metros veiculares. Como `modeledTime` inclui caminhada, usá-lo como desempate pode inclusive favorecer a solução individual, embora ela exija duas operações de parada do veículo.

O modelo atual não inclui explicitamente:

- custo de cada nova parada do veículo;
- tempo para estacionar, sair e voltar a arrancar;
- conversões e retornos;
- dificuldade de estacionar;
- preferência do entregador por caminhar em vez de dar uma volta de veículo.

### O que a IA não enxergou

“Menor distância veicular” não contém automaticamente a semântica “agrupe quando puder”. Número de paradas e movimentos é uma dimensão própria. A estratégia foi definida por nome, mas não completamente pela função de custo.

### Solução candidata

Definir com o mantenedor uma ordem lexicográfica ou função de custo explícita. Exemplo apenas para discussão:

1. cobertura e caminhos válidos;
2. restrições duras de circuito;
3. distância veicular;
4. quantidade/custo de paradas do veículo;
5. caminhada e tempo;
6. desempate estável que preserve padrões.

Outra opção é transformar parada, conversão e retorno em custos mensuráveis. Os pesos e limites não devem ser inventados pela IA.

### Alteração já aplicada e insuficiente

Foi incluído desempate por menor quantidade de grupos/paradas quando as distâncias diferem no máximo 0,1 m. Isso trata somente empates próximos e não resolve o modelo de custo geral.

## Erro 5 — falta uma trilha de decisão explicável

### Comportamento observado

O usuário perguntou por que uma parada foi movida 49 m. O `report.json` guardava métricas finais e assinaturas, mas não guardava a comparação que levou à escolha daquela âncora. Foi necessário reconstruir o predecessor, o sucessor, as duas âncoras e os caminhos para descobrir o empate.

### Causa comprovada

O motor calcula deltas durante a busca e os descarta. A assinatura final identifica o resultado, mas não explica a decisão.

### O que a IA não enxergou

Explicabilidade não é um relatório agregado. Para melhorar o algoritmo com conhecimento do entregador, é necessário saber por que cada operação foi aceita, especialmente quando a decisão visual parece errada.

### Solução candidata

Manter um único log estruturado por rodada, sem criar JSON por tentativa, contendo para operações relevantes:

- estratégia e início;
- grupo e membros antes/depois;
- âncora padrão, candidata e final;
- delta veicular, delta a pé, delta de tempo e delta de paradas;
- caminho/predecessor/sucessor usados;
- regra que decidiu o empate;
- limites atingidos;
- alternativas rejeitadas e motivo.

O JSON importável deve continuar contendo apenas o vencedor. A explicação pertence ao relatório da experiência.

## Erro 6 — a métrica automática não corresponde à avaliação de 8 km contra 20 km

### Evidência

O mantenedor relatou aproximadamente 8 km na rota humana e aproximadamente 20 km no JSON importado. Já o harness comparou apenas o “miolo equivalente”, excluindo a aproximação externa, e apresentou números próximos de 10 km.

Na rodada posterior à alteração, o roteiro 1 registrou:

- referência humana interna: `9852,11 m`, 36 paradas;
- `seeded-revisable`: `10128,10 m`, 39 paradas;
- `unseeded-revisable`: `10180,79 m`, 39 paradas;
- `individual`: `11514,75 m`, 51 paradas.

Esses números não explicam nem reproduzem a observação de aproximadamente 20 km no app.

### Causa ainda não comprovada

A causa do percurso de aproximadamente 20 km não foi isolada. O que está comprovado é uma incompatibilidade de escopo/método entre a métrica usada para alegar proximidade no harness e a métrica vista pelo mantenedor no artefato importado.

Hipóteses que precisam ser testadas separadamente, sem tratá-las como conclusão:

- inclusão ou exclusão do trecho entre início e primeira parada;
- eventual retorno/final de rota;
- diferenças entre o grafo congelado do harness e o grafo carregado pelo app;
- recomputação do caminho após importar;
- direção de vias ou trechos ausentes;
- diferença entre distância exibida e distância registrada no relatório.

### O que a IA não enxergou

Comparar um “miolo equivalente” pode ser útil para análise, mas não autoriza declarar o resultado próximo da rota humana quando o usuário importa o JSON e vê mais que o dobro. A métrica de sucesso precisa ser a mesma experiência observável.

### Solução candidata

Antes de nova otimização, fazer uma auditoria métrica do mesmo JSON:

- valor do relatório;
- valor após importação no app;
- soma de cada perna veicular;
- inclusão do início e do final;
- hash/versão da malha;
- qualquer fallback ou caminho ausente.

Somente depois de os totais coincidirem deve-se comparar qualidade com a referência humana.

## Erro 7 — os limites da heurística foram tratados como maturidade maior do que existe

O vencedor `seeded-revisable` do roteiro 1 ainda atingiu o limite de 24 definições de partição. Isso significa que o resultado é apenas o melhor entre alternativas limitadas e ordenadas heuristicamente.

Ponto cego: enumerar todos os pontos iniciais não compensa uma busca fraca de agrupamentos. Há 51 inícios, mas cada início recebe praticamente o mesmo conjunto limitado de partições. “Testar todos os inícios” não é “otimizar a rota inteira”.

Solução candidata: continuar restrito aos dois roteiros, tornar os orçamentos e a cobertura da vizinhança observáveis e só então decidir entre busca em feixe, vizinhanças iterativas ou outra estratégia. Não ampliar casos antes disso.

## Erro 8 — os testes verificavam integridade, mas não a intenção

### Lacunas encontradas

- O teste de separação das três estratégias verificava a contagem inicial, mas não exigia agrupamento final em `unseeded-revisable`.
- Não havia teste para empate de âncora preservando a posição padrão.
- Não havia teste garantindo que uma âncora fundamental fosse exportada como padrão.
- O validador do artefato exigia o valor incorreto `false`.
- O harness verificava cobertura, duplicação, órfãos, início na primeira parada, caminhos e `c120`, mas não verificava que a estratégia agrupável realmente agrupou.
- Não havia regressão real para o conjunto de cinco endereços da parada 12.
- O novo teste de âncora usa ordem técnica de IDs e pode estar formalizando a regra errada.

### O que a IA não enxergou

Gate verde prova conformidade com os testes existentes; não prova que os testes representam o raciocínio do entregador. Os 945 testes passaram depois das alterações, mas a inspeção do grupo real ainda revelou ambiguidade sobre qual endereço deveria definir a âncora padrão.

### Solução candidata

Transformar cada erro humano confirmado em um contrato de domínio, mas somente depois de a causa e a regra correta serem aprovadas. Preferir regressões com o caso real anonimizado/congelado quando a geometria for essencial. O teste deve afirmar o comportamento operacional, não IDs internos ou detalhes convenientes da implementação.

## Alterações que já estavam feitas quando foi dada a ordem de parada

Arquivos tocados na correção mais recente:

- `__utilidades-back-office__/auto-roteirizacao/fundamentalExperiment.ts`;
- `__utilidades-back-office__/auto-roteirizacao/fundamentalExperiment.test.ts`;
- `__utilidades-back-office__/auto-roteirizacao/experimentArtifacts.ts`;
- `__utilidades-back-office__/auto-roteirizacao/experimentArtifacts.test.ts`.

Comportamentos alterados:

- geração de alternativas agrupáveis ao longo da rota para `unseeded-revisable`;
- preferência por menos paradas em empate aproximado de distância veicular;
- preferência inicial por âncoras fundamentais;
- proibição de mover âncora por empate técnico;
- inferência experimental de `vehicleStopIsDefault`;
- três testes de regressão novos.

O vermelho formal registrou duas falhas do motor antes da primeira correção. Depois das alterações, os gates formais de testes, tipos, lint e build ficaram verdes. Isso significa apenas que o código está consistente com os contratos atuais.

## Rodada executada antes da ordem de parada

Somente o roteiro 1 foi executado novamente:

`.mentor-saidas/auto-fundamentals/roteiro-1-2026-09-12T20-53-48-880Z`

Resultado técnico da rodada:

| Estratégia | Paradas | Veículo | Caminhada | Definições | Limite atingido |
|---|---:|---:|---:|---:|---|
| com agrupamento inicial | 39 | 10128,10 m | 2451,56 m | 24 | sim |
| sem agrupamento inicial | 39 | 10180,79 m | 2346,17 m | 16 | não |
| sem agrupamento | 51 | 11514,75 m | 1007,29 m | 1 | não |

Foram gerados exatamente três JSONs e 153 tentativas. O fato de `sem agrupamento inicial` agora ter 39 paradas comprova apenas que a alteração passou a formar grupos; não comprova que os grupos, as âncoras ou a rota são corretos.

O roteiro 2 não foi reexecutado depois dessas alterações, conforme a ordem de parada.

## Estado final deste rascunho

- Nenhuma das alterações recentes recebeu validação humana.
- O problema original da parada 12 continua aberto porque a rodada nova trocou qual endereço é tratado como primeiro.
- A semântica de `vehicleStopIsDefault` continua aberta porque a inferência não usa a mesma regra completa do produto.
- A causa do total de aproximadamente 20 km visto no app continua desconhecida.
- `TASK-SPIKE-003` permanece em execução e com validação pendente.
- Não houve commit, finalização nem expansão para outros casos.

## Destino

Manter como diário diagnóstico da `TASK-SPIKE-003`. Cada novo erro deve ser acrescentado aqui antes de qualquer proposta de alteração no código.
