# Estratégias para construir as engines do roteirizador com IA

Data: 13/09/2026. Status: rascunho para discussão e formulação de um plano definitivo.

Este documento analisa o rascunho [Malha viária paga](E:/repositorios/projetos-pessoais/pilotos/teste-mentor-comagenteantigo/docs-mentor/rascunhos/2026-09-01-malha-viaria-paga.md), o domínio e trechos do motor atual. Não aprova arquitetura, não abre tarefas e não implementa correções. As alternativas abaixo são propostas; não foram executados novos benchmarks nesta análise.

“Com IA” é tratado em dois sentidos: usar IA para desenvolver e investigar os algoritmos; e, separadamente, avaliar se modelos aprendidos devem participar da roteirização em execução.

## 1. Síntese: o que eu construiria e o que reaproveitaria

Minha recomendação é uma abordagem híbrida, mantendo como ponto de partida o cálculo local e o funcionamento offline já decididos no projeto:

- Reaproveitar ferramentas existentes para processar OSM e bibliotecas pequenas para estruturas de dados. Não escrever um leitor de PBF, compactador ou índice espacial próprio sem necessidade.
- Reaproveitar e auditar o motor local de caminhos. Usar uma engine viária madura como referência de laboratório, não presumir que ela precisa virar um servidor de produção.
- Construir a camada específica de otimização conjunta: onde o veículo para, quais entregas atende a pé, em que ordem caminha e em que ordem visita as paradas.
- Usar um solver existente para conferir pequenas instâncias e obter referências de qualidade. Não confundir esse uso com entregar todo o domínio a um solver de TSP.
- Usar IA principalmente para implementar partes delimitadas, produzir contraexemplos e investigar diferenças. Não colocar um LLM escolhendo coordenadas ou certificando a validade das rotas.

O diferencial do produto não é simplesmente “agrupar antes de ordenar”. É poder escolher uma parada de veículo que não coincide com uma entrega, inclusive em outra rua, quando isso melhora a operação completa.

Não começaria comparando dez bibliotecas. O conjunto inicial de referências proposto é: motor local existente; Valhalla para confrontar caminhos no laboratório, se necessário; OR-Tools para referências pequenas. Os demais nomes neste documento são alternativas de arquitetura, não uma bateria autorizada de experimentos.

## 2. O que a análise da malha paga acerta — e o que precisa ser revisto

### 2.1. Separações que devem permanecer

Há pelo menos quatro problemas distintos:

| Problema | O que entrega | O que não resolve sozinho |
| --- | --- | --- |
| Distribuição da malha | Ruas, caminhos, atributos e relações atualizados, disponíveis localmente | Melhor agrupamento ou melhor roteiro |
| Cálculo de caminhos | Trajeto e custo entre estados de origem e destino | Escolher todas as paradas e seus grupos |
| Otimização do roteiro | Decidir paradas, grupos e sequências | Recuperar informações ausentes da malha |
| Endereço da parada | Descrição humana da coordenada onde o veículo fica | Provar que é possível/legal estacionar ali |

Trocar o Overpass pode resolver ou reduzir problemas de obtenção de dados. Não explica, por si só, a diferença relatada entre um roteiro humano de aproximadamente 8 km e um automático de aproximadamente 20 km. Essa diferença precisa ser decomposta entre dados, caminhos, modelagem, busca e apresentação.

### 2.2. Pontos frágeis do rascunho original

**A conta da GraphHopper descreve uma forma de uso, não todas.** A matriz 120 × 120 realmente corresponde a 1.200 créditos pela fórmula publicada. Porém, a Route Optimization API usa outra fórmula: uma solicitação com um veículo e 120 localizações corresponde a 120 créditos, antes de outras chamadas aplicáveis. Isso não significa que essa API resolva nossas paradas variáveis. Significa apenas que “matriz externa para nosso solver” e “otimização do fornecedor” não são o mesmo produto nem a mesma conta. Também é necessário verificar os limites de localizações do plano. [Créditos por endpoint](https://support.graphhopper.com/support/solutions/articles/44000718211-what-is-one-credit-), [planos](https://www.graphhopper.com/pricing/).

A conversão de roteiros/dia em usuários/mês pressupõe frequência de uso, recálculos e compartilhamento de cache. Não é um custo universal por usuário. A preferência do projeto por evitar API paga continua coerente, mas não precisa se apoiar numa generalização incorreta.

**Overpass contratado continua sendo um serviço com limites.** O Overspan anuncia US$ 19/mês, 50 mil requisições/mês e 60/min no Indie, mas também apenas duas consultas simultâneas. Seus termos atuais o descrevem como beta, sem SLA ou tempo de resposta garantido. Portanto, “trocar uma constante remove imediatamente o problema” não está demonstrado. A chave deve permanecer protegida; a integração precisa considerar concorrência, cache e falhas. Os termos permitem uso dos dados no próprio produto e remetem à licença OSM: não se deve afirmar que cache é proibido só porque não há uma cláusula específica com esse nome. [Oferta](https://overspan.dev/), [termos, especialmente §§3–6 e 9](https://overspan.dev/terms).

**R2 barato não significa operação inteira gratuita.** O Standard oferece franquias de 10 GB, 1 milhão de operações Class A e 10 milhões Class B por mês; armazenamento excedente custa US$ 0,015/GB-mês. Assim, 9 GB isoladamente ainda caberiam na franquia, se ela estiver disponível. A conta completa precisa incluir versões simultâneas, leituras, publicações, Worker e processamento. A saída gratuita do R2 não torna gratuitos todos os serviços associados. [Preços oficiais](https://developers.cloudflare.com/r2/pricing/).

As hipóteses de 50 mil km², compressão de 5×, cinco cargas mensais e 15% de duplicação não são medições nacionais. Uma densidade observada em Ipanema não determina o Brasil. Filtrar um PBF também não mede, por si só, a área urbanizada. Antes de dimensionar o país, medir os arquivos e a memória decodificada dos dois casos escolhidos.

**Ways inteiros ajudam nas bordas, mas não eliminam o problema topológico.** É preciso preservar referências, conexões, restrições de conversão e versões compatíveis. A estratégia `complete_ways` do Osmium completa ways, mas não garante relações completas; o filtro pode incluir explicitamente relações `type=restriction`. Isso é relevante para restrições que atravessam células. Cruzamento desenhado não é necessariamente conexão: pode haver ponte, túnel ou níveis distintos. [Extração Osmium](https://github.com/osmcode/osmium-tool/blob/master/man/osmium-extract.md), [filtragem Osmium](https://github.com/osmcode/osmium-tool/blob/master/man/osmium-tags-filter.md).

Arquivos por célula e PMTiles são opções de distribuição. Nenhuma delas define automaticamente um grafo correto. “Dias em vez de semanas” e “metade do custo” devem permanecer hipóteses, não premissas do plano.

### 2.3. Consequência para a arquitetura

A [ADR-002](E:/repositorios/projetos-pessoais/pilotos/teste-mentor-comagenteantigo/docs/arquitetura/ADR/ADR-002.md) determina cálculo local; a [ADR-010](E:/repositorios/projetos-pessoais/pilotos/teste-mentor-comagenteantigo/docs/arquitetura/ADR/ADR-010.md) determina dataset próprio de roteirização em PMTiles/R2 para a versão final. Este rascunho não substitui essas decisões.

Servidor de rotas em produção, API paga ou troca de PMTiles por objetos soltos exigiriam uma revisão explícita das decisões correspondentes. Usar uma engine externa localmente no computador de desenvolvimento, como instrumento de comparação, não exige fazer do produto um cliente desse servidor.

Também não é necessário montar infraestrutura nacional para descobrir se o agrupamento está errado. Pode-se investigar os dois roteiros com uma malha congelada e depois dimensionar a distribuição.

## 3. Qual é, de fato, o nosso problema de otimização?

A família científica mais próxima encontrada é **Park-and-Loop Routing Problem with Parking Selection**: selecionar locais de estacionamento, atender clientes em circuitos a pé que voltam ao veículo e organizar as visitas motorizadas. Há trabalho específico com busca em vizinhanças pequenas e grandes, incluindo operadores que escolhem o estacionamento durante a inserção de clientes. [Le Colleter, Dumez, Lehuédé e Péton — PLRP-PS](https://roadef2023.sciencesconf.org/434670/document).

Isso é uma referência de modelagem, não uma biblioteca pronta. Nosso recorte difere: um veículo, possibilidade de roteiro aberto e início livre, âncoras ao longo das ruas, referências fundamentais e limite particular do circuito. Não precisamos importar agora frota, janelas de horário ou restrições de carga de todos os artigos.

O trabalho sobre **Flexible Park-and-Loop** combina formulação matemática, busca de grande vizinhança, programação dinâmica e seleção de soluções parciais. Ele reforça a viabilidade de uma abordagem híbrida, mas seu modelo mais amplo não deve ser copiado integralmente. Resultados percentuais desses estudos não são previsão de economia para nosso romaneio. [Jodiawan, Côté e Coelho — relatório de pesquisa](https://www.cirrelt.ca/documentstravail/cirrelt-2024-24.pdf).

### 3.1. Entidades que não podem ser confundidas

| Entidade | Significado | Regra proposta para a engine |
| --- | --- | --- |
| Entrega/pin | Localização original e dados dos pacotes | Não deslocar para facilitar a solução |
| Referência fundamental | Referência de acesso viário de cada entrega | Congelada durante uma otimização; regra de geração versionada |
| Candidato de parada | Posição possível na malha, com acesso e orientação pertinentes | Avaliar alternativas, inclusive em outra rua |
| Parada escolhida | Coordenada independente onde o veículo efetivamente fica | Tem identidade e descrição próprias; não herda automaticamente o endereço da primeira entrega |
| Grupo da parada | Entregas feitas a pé nessa parada | Pode mudar sem mudar os pins ou fundamentos |
| Circuito a pé | Saída do veículo, atendimento e retorno ao mesmo veículo | Ordem e distância explicitamente avaliadas |
| Roteiro do veículo | Sequência das paradas e deslocamentos entre elas | Respeitar direção, acesso e transições |

O código já representa `vehicleStop` separadamente dos pontos. Porém, o tipo `RouteStop` consultado ainda não contém um objeto completo de endereço/proveniência dessa parada. Além disso, documenta a ordem a pé como derivada da âncora e de `reversed`. Uma proposta de ordem a pé livre precisa reconhecer essa diferença de contrato. [Modelo atual](E:/repositorios/projetos-pessoais/pilotos/teste-mentor-comagenteantigo/src/types/routing.ts).

O endereço independente deve descrever a coordenada escolhida. Se só conhecemos o nome da via, exibir esse nível de precisão; “próximo ao número X” é uma aproximação, não a comprovação de uma vaga ou entrada. Resolver/enriquecer o endereço dos vencedores, com cache, evita geocodificação paga no laço interno de milhares de candidatos.

### 3.2. Semântica dos limites já discutidos

Tomando como referência o [rascunho de fundamentos e raciocínio do entregador](E:/repositorios/projetos-pessoais/pilotos/teste-mentor-comagenteantigo/docs-mentor/rascunhos/2026-09-07--analise-raciocinio-entregador-ancora-vs-ml.md):

- `r60`: raio de busca de candidatos, associado aos fundamentos. Não é distância total permitida de caminhada.
- `c120`: limite do circuito fechado entre a parada e as referências fundamentais, conforme a regra discutida.
- Caminhada completa: inclui os acessos até os pins/entradas reais e precisa ser mostrada e usada na avaliação do esforço. Pode ultrapassar 120 m sob essa regra.
- Raio manual de 30 m: outra função; não deve ser sobrescrito com o valor do limite do circuito.
- Acesso longo ao pin não autoriza apagar uma entrega. Uma entrega isolada junto ao próprio fundamento pode ter circuito limitado zero e acesso real longo.

Se quisermos que 120 m passe a limitar toda a caminhada física, isso é uma alteração de requisito, não uma “correção” silenciosa da fórmula.

Sem caminho conhecido, não inventar uma conexão atravessando prédio ou barreira. Manter a entrega identificada e sinalizar a pendência; “nenhum órfão” não significa afirmar viabilidade que a malha não permite comprovar.

## 4. Construir do zero, usar pronto ou combinar?

| Estratégia | Vantagem para o projeto | Custo/risco principal | Posição neste rascunho |
| --- | --- | --- | --- |
| Tudo próprio, inclusive infraestrutura de grafos | Controle completo e integração direta com TypeScript/PWA | Manter semântica OSM, desempenho e otimizador ao mesmo tempo | Evitar reinvenção total; aproveitar o existente seletivamente |
| Engine viária pronta + otimizador genérico | Caminhos e ordenação de pontos fixos disponíveis | Não representa automaticamente estacionamento variável e grupos a pé | Útil como referência ou componente, insuficiente sozinha |
| Engine viária própria + otimizador do domínio próprio + ferramentas auxiliares prontas | Preserva offline e o diferencial | Exige auditoria séria do grafo e da busca | Caminho inicial recomendado sob as ADRs atuais |
| Engine viária madura + camada própria de estacionamento/agrupamento | Reduz manutenção viária interna | Integração nativa/WASM ou servidor; tamanho e operação a medir | Alternativa se o motor local não atingir correção/desempenho |
| Serviço externo resolvendo tudo | Menos código inicial aparente | Modelo inadequado, cobrança por uso, dependência de rede e menor observabilidade | Não recomendado para o requisito atual |

“Pronto” não significa necessariamente “pago”: a GraphHopper tem engine open source separada da API comercial. “Local” também não significa necessariamente “código nosso”: uma biblioteca compilada pode executar localmente. A questão prática é compatibilidade com o PWA e o aparelho, não apenas o nome da tecnologia. [Engine GraphHopper](https://github.com/graphhopper/graphhopper).

### 4.1. Engines de caminho: candidatas e limites

| Opção | Papel possível | Cuidado decisivo |
| --- | --- | --- |
| A*/Dijkstra atuais | Runtime local, baseline auditável | Confirmar dados, restrições, projeções e significado do custo |
| Valhalla | Referência de caminhos veiculares/pedestres; possível substituição futura | Não presumir integração pronta no navegador ou perfil correto por padrão |
| OSRM | Referência de trajetos/matrizes, especialmente com perfil fixo | Distância da matriz não significa necessariamente menor distância |
| GraphHopper open source | Biblioteca/serviço de caminhos com perfis configuráveis | Configuração de custos e conversões, integração e manutenção |

A documentação do Valhalla distingue custos, penalidades e fatores. `shortest` seleciona custo por distância, mas a poda hierárquica ainda pode impedir o caminho mais curto; há configuração para desabilitá-la sob limites. Perfis de motocicleta e motoneta não devem ser tratados como equivalentes. Isso faz dele uma referência interessante, desde que perfil e opções sejam registrados. [API de rotas Valhalla](https://valhalla.github.io/valhalla/api/route/api-reference/).

No OSRM, a distância retornada por `Table` é a extensão do caminho mais rápido, não necessariamente o menor caminho em metros. `Trip` organiza localizações dadas; não escolhe nossos grupos e estacionamentos independentes. Portanto, uma integração ingênua poderia conservar justamente a divergência entre “otimizar distância” e a distância disponível ao otimizador. [Documentação OSRM consultada, v5.24](https://project-osrm.org/docs/v5.24.0/api/).

Na GraphHopper, perfis e custos de conversão precisam ser configurados; custom models combinam distância, velocidade, prioridade e influência da distância. Não inferir que qualquer configuração representa “metros puros”. [Perfis](https://github.com/graphhopper/graphhopper/blob/master/docs/core/profiles.md), [custom models](https://github.com/graphhopper/graphhopper/blob/master/docs/core/custom-models.md).

Não há nesta análise comprovação de que Valhalla, OSRM ou GraphHopper caibam de forma satisfatória no PWA do Samsung M35. API JavaScript para chamar um serviço não equivale a uma engine executando offline em JavaScript. Portar para WASM seria um trabalho próprio, condicionado a tamanho, inicialização, memória e capacidade de distribuição dos dados.

### 4.2. Solvers de otimização: onde ajudam

| Ferramenta | Uso adequado aqui | Limitação para nosso domínio |
| --- | --- | --- |
| OR-Tools Routing | Ordenar um conjunto fixo de paradas; referência e exploração de busca local | Não entrega automaticamente a seleção conjunta de grupos e posições |
| OR-Tools CP-SAT | Modelo pequeno explícito, cobertura e prova de referência quando conclui | Modelagem combinatória e crescimento do número de candidatos |
| VROOM | Baseline de roteamento de jobs fixos com matrizes próprias | Transformar previamente cada grupo em job congela parte do problema |
| PyVRP | Alternativa para problemas de roteamento e busca com estrutura compatível | Suas funcionalidades precisam corresponder à semântica real, não só ao nome |

OR-Tools possui interfaces documentadas para C++, Python, Java e C#. Isso favorece uso no laboratório; não é uma dependência TypeScript de navegador pronta. Seu solver de roteamento pode entregar boas soluções sem provar a ótima. Também não usar penalidade finita para “permitir descartar” entregas: essa funcionalidade existe, mas conflita com cobertura obrigatória. [Introdução](https://developers.google.com/optimization/introduction), [TSP](https://developers.google.com/optimization/routing/tsp), [penalidades e visitas descartadas](https://developers.google.com/optimization/routing/penalties).

VROOM aceita matrizes customizadas, o que o torna útil para comparar a ordenação sobre nossos custos. Isso não transforma jobs de localização fixa em uma parada que cobre várias entregas escolhidas dinamicamente. [Projeto](https://github.com/VROOM-Project/vroom), [API e matrizes](https://github.com/VROOM-Project/vroom/blob/master/docs/API.md).

No PyVRP, “mutually exclusive groups” representa alternativas de atendimento, não várias entregas necessariamente atendidas juntas a pé. É um exemplo de funcionalidade cujo nome pode induzir uma integração errada. Fixar versão e verificar a documentação daquela versão antes de decidir; parte da documentação consultada está em desenvolvimento. [Grupos mutuamente exclusivos](https://pyvrp.org/notebooks/mutually_exclusive_groups.html), [documentação do projeto](https://pyvrp.org/).

## 5. As engines como módulos, não como vários serviços

Proposta de divisão lógica, sem criar microserviços:

| Módulo | Responsabilidade | Saída verificável |
| --- | --- | --- |
| Dados e topologia | Preparar/carregar malha com versão e cobertura conhecidas | Grafo, atributos, restrições, lacunas |
| Caminhos | Consultas direcionais de veículo e de pedestre | Geometria, metros, segundos estimados, custo de seleção e status |
| Fundamentos e candidatos | Fixar referências e gerar alternativas de parada | Candidatos com origem, segmento, orientação e acesso |
| Circuitos a pé | Avaliar atendimento de um conjunto desde uma parada | Ordem, circuito limitado, caminhada completa e viabilidade |
| Otimizador conjunto | Alterar grupos, paradas e sequências | Melhor solução conhecida e histórico de decisões |
| Validação e exportação | Conferir cobertura, métricas e fidelidade no app | Relatório reproduzível e JSON importável |

O contrato de caminhos deve separar, no mínimo: `distanceMeters`, `durationSeconds`, `selectionCost`, `status`, versão do grafo e perfil. Falta de conexão não pode retornar zero nem um segmento reto indistinguível de rota válida.

As consultas precisam distinguir estado de chegada/saída quando isso afeta conversões ou acesso à parada. Uma matriz só entre coordenadas pode ocultar o fato de que a chegada mais barata deixa o veículo num sentido incompatível com a saída escolhida. Primeiro definir a regra de manobra após estacionar; depois escolher a representação. Não presumir retorno livre porque o trajeto foi dividido em duas chamadas.

Na aplicação, a busca deve poder executar fora da thread da interface, aceitar cancelamento e guardar a melhor solução válida encontrada. Cálculo compartilhado de caminhos e circuitos deve ser reutilizado entre partidas, sem misturar estado de busca entre as três estratégias.

## 6. Algoritmos: sequência de construção proposta

### 6.1. Primeiro, caminhos cujo significado seja confiável

Continuar com A*/Dijkstra é uma alternativa legítima. O problema não se resolve trocando apenas o nome do algoritmo:

- Preservar mão única, acessos e restrições de conversão na topologia/modelo.
- Projetar no segmento correto, inserindo o ponto ao longo da aresta sem criar atalhos ou conexões com a rua paralela.
- Construir uma rede pedestre apropriada, incluindo caminhos e barreiras disponíveis. Tornar o grafo veicular bidirecional não cria passagens a pé que não foram carregadas.
- Usar Dijkstra por origem quando muitas consultas compartilham a mesma origem e o mesmo estado de custo; A* para consultas direcionadas, conforme medição.
- Reutilizar resultados por versão da malha, perfil, objetivo, posições projetadas e estados relevantes. Não recalcular tudo para cada início.
- Só considerar pré-processamentos mais sofisticados, como hierarquias de contração ou landmarks, se o perfilamento mostrar necessidade. Eles não consertam um custo errado.

Observação concreta do checkout: o A* já usa estado `(node, fromNode)`. Acrescenta 1.500 de penalidade para certos ângulos e 300 por aresta `service`, mas retorna a distância física do caminho escolhido. Logo, o caminho é selecionado com uma função e apresentado em outra unidade de avaliação. Isso não prova a causa de todos os desvios, mas impede chamar o resultado automaticamente de menor distância viária. [A* atual](E:/repositorios/projetos-pessoais/pilotos/teste-mentor-comagenteantigo/src/utils/routing/aStar.ts).

Uma penalidade fixa por aresta também merece um contraexemplo: inserir um ponto intermediário na mesma rua, sem mudar sua geometria ou função, não deveria alterar arbitrariamente sua atratividade. Esse teste identifica decisões dependentes da representação do OSM, não da operação do entregador.

### 6.2. Gerar candidatos de parada sem aprisionar a busca

Não basta usar o primeiro endereço, centroide ou ponto mais próximo. Proposta:

1. Gerar os fundamentos uma vez, com uma regra única e explícita.
2. Consultar segmentos próximos por índice espacial, tendo os fundamentos como referência do raio discutido.
3. Incluir alternativas nos segmentos: projeções dos fundamentos, posições compartilhadas úteis e acessos a outras ruas.
4. Preservar diversidade: trechos, lados e direções diferentes podem produzir economias grandes mesmo com poucos metros de separação.
5. Avaliar os candidatos pelos custos reais de chegada, saída e caminhada; proximidade geométrica serve para reduzir busca, não para decidir sozinha.
6. Refinar posições ao longo dos segmentos promissores, se houver ganho e orçamento.

Uma discretização finita aproxima a escolha contínua de coordenadas. Encontrar o melhor entre candidatos não prova que não existe posição melhor entre eles. O relatório deve informar quais candidatos foram excluídos e por qual regra, quando isso for necessário para explicar um caso.

A rua do estacionamento pode diferir da rua das entregas. Mas uma coordenada perto delas não demonstra acesso a pé, segurança ou permissão de parada; tais informações precisam ter origem e incerteza registradas.

### 6.3. Resolver os pequenos circuitos a pé

Para grupos pequenos, usar enumeração ou programação dinâmica do tipo Held–Karp para buscar a melhor ordem de visita e retorno. Um limite inicial de tamanho deve ser escolhido por medição; isso não significa resolver exatamente um circuito com todas as 80 entregas.

Para grupos maiores, inserção de menor custo seguida de melhorias locais é uma opção. Registrar quando a ordem é heurística: encontrar um circuito de 125 m não prova que inexiste um de 119 m. Só rejeitar definitivamente pela regra dos 120 m se houver prova de inviabilidade sob o modelo, ou assumir explicitamente a poda heurística e seu risco.

Manter separados o circuito limitado entre fundamentos e a caminhada completa. Quando o acesso ao pin for estimado, identificá-lo como tal, sem chamá-lo de percurso comprovado.

Há uma decisão prévia de integração: a UI atual deriva a ordem da âncora e do sentido de varredura. Ou o otimizador avalia exatamente essa ordem, ou o plano autoriza armazenar/respeitar a ordem otimizada na importação e execução. Não produzir um vencedor calculado com uma ordem e mostrá-lo com outra.

### 6.4. Construir e melhorar o roteiro em conjunto

Para construir uma solução inicial, comparar inserção pelo incremento de custo e inserção por arrependimento: priorizar a entrega cuja segunda melhor opção seria muito pior. Evitar depender exclusivamente do vizinho mais próximo em linha reta.

Operadores propostos para a busca local:

- Reordenar paradas: realocação, troca e deslocamento de pequenos blocos, como Or-opt.
- Reagrupar: juntar, dividir e transferir entregas entre grupos.
- Reancorar: trocar a posição do veículo para um grupo existente.
- Movimento conjunto: transferir entregas e mudar a âncora na mesma tentativa, porque isoladamente nenhuma mudança pode melhorar o custo.
- Reotimizar a ordem a pé depois de mudanças relevantes, conforme o contrato adotado.

Em matriz dirigida, não aplicar a fórmula de ganho do 2-opt simétrico como se os arcos internos permanecessem iguais. Inverter um trecho muda sentidos e custos; avaliar a alteração correspondente ao problema dirigido.

Um subproblema especialmente útil aqui: **com grupos e ordem fixados, escolher conjuntamente as âncoras por programação dinâmica em camadas**. Cada camada representa uma parada; seus estados são os candidatos de estacionamento viáveis. A transição soma o deslocamento desde a camada anterior e o custo local pertinente. Se houver dependência de orientação, ela também precisa fazer parte do estado.

Sob custos aditivos e estados suficientes, esse procedimento encontra a melhor combinação dentro dos candidatos fornecidos para aquela ordem e aqueles grupos, sem enumerar todas as combinações completas. Não resolve a escolha global de grupos e ordem, mas pode ser chamado depois de uma proposta de reagrupamento/reordenação. É mais forte que mover cada âncora olhando apenas o próximo trecho e oferece uma explicação clara das trocas de estacionamento.

Um “esqueleto de percurso pelas ruas” pode ajudar a imitar o raciocínio de varrer corredores e atender os arredores a pé. Eu o trataria como proposta de construção/reparo, não como corredor fixo que proíbe a busca de visitar ruas melhores.

### 6.5. Depois, LNS/ALNS para escapar de ótimos locais

Quando os operadores básicos estiverem corretos, a evolução mais alinhada ao domínio é Large Neighborhood Search: retirar parte da solução e reconstruí-la. Exemplos próprios do projeto: retirar uma região com muito retorno, desfazer dois grupos vizinhos ou liberar simultaneamente as âncoras de um corredor.

ALNS acrescenta adaptação na escolha dos operadores conforme seus resultados. Isso não exige um LLM nem uma rede neural; é uma política algorítmica sobre movimentos verificáveis. A literatura original combina heurísticas concorrentes de remoção e inserção. [Ropke e Pisinger — ALNS](https://orbit.dtu.dk/en/publications/an-adaptive-large-neighborhood-search-heuristic-for-the-pickup-an/).

Mesmo aceitando soluções intermediárias piores para explorar, preservar separadamente a melhor válida. Assim, uma execução mais longa não entrega um resultado pior apenas porque terminou numa fase exploratória. Registrar seed aleatória, orçamento e melhora acumulada.

Não começaria por algoritmo genético ou aprendizado por reforço: aumentam variáveis e dificuldade de explicar falhas antes de termos uma função objetivo e vizinhanças confiáveis. Permanecem alternativas futuras, não tecnologias proibidas.

### 6.6. Uma referência exata pequena, não promessa de ótimo global

Construir, se aprovado no plano, um modelo independente para poucos pontos e candidatos finitos. Cada alternativa de atendimento pode representar `(subconjunto de entregas, parada, circuito)`. O modelo precisa selecionar alternativas que cubram cada entrega exatamente uma vez e conectar as paradas numa rota válida.

Só selecionar conjuntos não basta: é necessário representar ordem, início/fim, custos dirigidos e impedir subciclos desconectados. Restrições de acesso e limites do circuito também pertencem ao modelo.

CP-SAT é uma possibilidade. Trabalha com inteiros, exigindo escala/unidades e arredondamento explícitos; o status `FEASIBLE` não equivale a `OPTIMAL`. Registrar status e limites disponíveis. Mesmo `OPTIMAL` certifica apenas o modelo e o conjunto finito fornecido, não todas as posições contínuas possíveis na rua. [CP-SAT e status](https://developers.google.com/optimization/cp/cp_solver).

Essa referência serve para descobrir onde nossa heurística perde soluções óbvias. Não precisa entrar no aplicativo, nem resolver exatamente os romaneios completos para ser útil.

## 7. O que significa “melhor” e como escolher o início

### 7.1. Objetivo explícito, sem unidades escondidas

Uma formulação de tempo operacional pode ser:

```text
tempo total = tempo dirigindo
            + tempo caminhando, incluindo acessos
            + tempo de parar/descer/retomar por parada
            + tempo de atendimento das entregas
```

Os coeficientes e tempos precisam representar uma hipótese operacional identificada. Não devem ser escolhidos só para fazer o resultado esperado vencer.

O modelo atual do experimento soma tempo de veículo estimado por velocidade, caminhada e um componente de atendimento das entregas. Um componente constante, igual em todas as soluções, não muda a escolha. Para favorecer a eliminação de deslocamentos curtos entre paradas, o custo real de voltar ao veículo e retomar a marcha pode ser mais informativo do que apenas contar metros. Isso é uma proposta de modelagem a validar, não uma medição já feita. [Avaliação atual](E:/repositorios/projetos-pessoais/pilotos/teste-mentor-comagenteantigo/__utilidades-back-office__/auto-roteirizacao/fundamentalExperiment.ts).

Como a reclamação central atual é distância de veículo, proponho começar com um objetivo principal comum às três estratégias: minimizar metros veiculares, respeitando viabilidade e os limites acordados; em empate dentro de tolerância numérica, preferir menor caminhada completa. Manter tempo modelado como métrica de diagnóstico nesse primeiro comparativo.

Essa escolha tem consequência: se 1 m a menos de veículo compensar qualquer caminhada adicional permitida, isso poderá contrariar o entregador. O plano definitivo deve escolher entre prioridade estrita à distância, tempo operacional ou uma regra explícita de troca. “Não mover sem benefício relevante” exige definir benefício e tolerância; não basta acrescentar uma penalidade arbitrária ao perceber um print ruim.

Pouca diferença entre `modeledTime` e `vehicleDistance` não prova equivalência dos objetivos. Pode resultar de soluções correlacionadas, busca limitada, coeficientes ou parcela constante dominante na apresentação. Examinar componentes e decisões antes de multiplicar os experimentos.

### 7.2. Uma mudança de estacionamento precisa pagar seu custo

Ao comparar duas âncoras para uma parada, avaliar pelo menos:

- Trecho anterior → parada.
- Circuito a pé e acesso às entregas.
- Parada → trecho seguinte, incluindo orientação/manobras pertinentes.
- Efeito sobre a solução completa, se também houve mudança de ordem ou grupo.

“Fica mais perto da próxima parada” não é justificativa suficiente. A economia na saída pode apenas deslocar a mesma distância para a chegada e ainda aumentar a caminhada.

No caso histórico da P12, os 49 m mostrados são evidência de um deslocamento questionado pelo usuário, não a prova isolada da causa algorítmica. O log deve permitir comparar a âncora diante da primeira entrega com a escolhida, mostrando as diferenças de veículo, caminhada e custo. Se a decisão veio de desempate por ID, isso deve aparecer como desempate, nunca como economia calculada.

### 7.3. Multi-start: todos os endereços, sem confundir com todas as soluções

Manter somente dois casos reais, identificados pelas pastas dos romaneios. Em cada um, permitir começar por cada localização de entrega distinta: com 80 localizações, são até 80 escolhas desse tipo de início. Vários pacotes no mesmo endereço não criam automaticamente novos pontos de partida.

Nos modos agrupáveis, o início associado a uma entrega deve permitir um primeiro grupo que a contenha, sem congelar a posição final do veículo no pin. Documentar a regra, para que “começar no endereço X” tenha sentido verificável.

Visitar todos os inícios não esgota as combinações de grupos, âncoras e ordens. O resultado é o melhor encontrado nas tentativas, não um ótimo global demonstrado.

Separar também dois cenários:

- Início livre: escolher a melhor primeira parada sem deslocamento anterior, se isso corresponde à comparação desejada.
- Origem real fixa: incluir o deslocamento desde a posição do motorista/depósito. Escolher a primeira entrega continua útil, mas não elimina esse trecho da conta.

Não comparar os 8 km humanos com um automático que usa outro início, outro fim, retorno ao depósito diferente ou exclui trechos. A política de término também precisa ser idêntica.

## 8. As três estratégias e somente três resultados finais por caso

| Estratégia | Estado inicial | Movimentos permitidos depois |
| --- | --- | --- |
| Com agrupamento inicial | Grupos propostos por uma construção inicial | Juntar, dividir, transferir, reancorar e reordenar |
| Sem agrupamento inicial | Uma entrega por parada | Os mesmos movimentos de agrupamento e melhoria |
| Sem agrupamento nenhum / individual | Uma entrega por parada | Melhorar o roteiro e as posições conforme a regra comum, sem juntar entregas numa parada |

Os dois primeiros diferem na inicialização, não na capacidade de agrupar. Devem compartilhar custo, restrições, candidatos admissíveis e operadores de melhoria. O tempo de gerar o agrupamento inicial precisa aparecer no custo total do método.

No modo sem agrupamento inicial, gerar candidatos geométricos é permitido; fornecer escondido uma partição pronta como única fonte de fusões não testa descoberta autônoma de grupos. Um orçamento pequeno também não pode ser gasto apenas nos primeiros endereços e depois virar a conclusão “não havia grupos”. Registrar quantos grupos, fusões e regiões foram efetivamente considerados.

Os modos com e sem agrupamento inicial podem corretamente convergir para o mesmo vencedor. O teste não deve obrigá-los a produzir resultados diferentes. Deve provar que o segundo consegue formar grupos viáveis quando encontra vantagem.

No individual, cada entrega continua sendo uma parada operacional: sair, atender e voltar antes da próxima. Se duas paradas tiverem coordenadas coincidentes, não fundi-las silenciosamente nem apagar o custo operacional correspondente. Se quisermos fixar todas as âncoras individuais nos fundamentos, isso deve ser regra declarada, não uma restrição escondida que favorece os outros modos.

### 8.1. Artefatos propostos

Por caso, um JSON vencedor de cada estratégia. Para dois casos: seis JSON finais, não um JSON por tentativa. Exemplos:

```text
1-r60-c120-com-agrupamento-inicial.json
1-r60-c120-sem-agrupamento-inicial.json
1-r60-c120-sem-agrupamento-nenhum.json
2-r60-c120-com-agrupamento-inicial.json
2-r60-c120-sem-agrupamento-inicial.json
2-r60-c120-sem-agrupamento-nenhum.json
```

O prefixo é o número real da pasta de origem, de 1 a 6; usar `1` e `2` acima é exemplo dos dois casos, não autorização para executar todos os seis.

Um único `tentativas.jsonl` por execução pode guardar as tentativas de ambos os casos e três modos, com identificadores explícitos. Um resumo Markdown permite comparação humana. Geometrias completas de toda tentativa não precisam ser duplicadas; guardar configuração e dados suficientes para reproduzir as decisões relevantes.

Campos importantes do registro:

- Caso, modo, ID da tentativa, entrega inicial, seed, versões do código e da malha e objetivo.
- Política de origem/fim, raio e limite, tolerâncias e unidades.
- Estado da solução, entregas cobertas/pendentes, paradas e composição dos grupos.
- Metros de veículo, circuito limitado, caminhada completa e componentes do tempo.
- Tempo de construção e busca, candidatos/operadores avaliados, cache e motivo de encerramento.
- Para mudanças aceitas: grupos/âncoras antes e depois, deltas reais e critério de aceitação.
- Quando uma alternativa contestada não foi considerada: motivo da exclusão ou orçamento que a impediu.

Não registrar dados pessoais de destinatários desnecessariamente no log, nem enviar romaneios a serviços de IA para obter uma explicação textual. Identificadores locais e medidas normalmente bastam para o diagnóstico.

### 8.2. Orçamento justo sem explodir a matriz de testes

Congelar `r60/c120` como configuração inicial deste comparativo, pela evidência qualitativa do usuário. Não cruzar novamente todos os raios, objetivos, algoritmos e seis roteiros de uma vez.

Usar o mesmo conjunto de inícios e orçamento de melhoria comparável por início. Registrar o custo da construção inicial e o benefício do cache compartilhado. Se houver aleatoriedade, usar seeds registradas; não escolher retrospectivamente a seed favorável para um único modo.

Dois relatórios complementares bastam: qualidade sob orçamento de busca comparável e tempo total percebido, incluindo preparação. Uma pequena curva de melhora ao longo da mesma execução pode mostrar se ainda compensa esperar, sem gerar novos JSON finais a cada marco.

Microcasos sintéticos servem para testar regras isoladas; não são novos romaneios na comparação de qualidade. Ainda assim, devem ser pequenos e motivados por uma falha concreta, não outra bateria combinatória sem limite.

## 9. O que a IA vinha deixando de enxergar

Separar três níveis de evidência: relato/print do usuário, comportamento confirmado no código e causa demonstrada por reprodução. Este documento não transforma o primeiro automaticamente no terceiro.

| Ponto cego | Consequência | Como preveni-lo na construção |
| --- | --- | --- |
| Confundir endereço, fundamento e parada | Mover referência estável ou copiar endereço errado para o veículo | Tipos e contratos diferentes, com origem e versão |
| Tratar agrupamento como pré-processamento fixo | “Sem agrupamento inicial” vira individual | Operadores de descoberta, fusão, divisão e transferência testados |
| Otimizar só a saída da parada | Mover o veículo à frente sem ganho operacional | Comparar chegada + caminhada + saída e a rota total |
| Tratar empate técnico como melhora | Coordenada muda porque o ID foi ordenado antes | Critério semântico e log de desempate |
| Contar apenas metros entre fundamentos | Apresentar esforço incompleto até as entregas | Exibir circuito limitado e caminhada completa separadamente |
| Confundir distância retornada com custo minimizado | Comparar objetivos sobre caminhos enviesados | Contrato separando custo, metros e tempo |
| Presumir que teste verde prova qualidade | Solução válida, mas muito pior que a humana | Referência humana comparável e pequenas referências independentes |
| “Nenhum órfão” virar descarte ou caminho fictício | Aparência de sucesso sem atendimento demonstrado | Cobertura obrigatória e estados explícitos de falta de acesso |
| Medir uma solução e importar outra | JSON vencedor não reproduz a operação avaliada | Verificação de ida e volta do formato e da ordem a pé |
| Confundir mais tentativas com mais inteligência | Alto gasto sem explorar os movimentos necessários | Instrumentar cobertura da busca antes de ampliar casos |
| Tratar rua projetada como vaga comprovada | Recomendar parada sem informação operacional suficiente | Restrições, incerteza e possibilidade de ajuste humano |

### 9.1. Evidência local consultada

- [Grafo atual](E:/repositorios/projetos-pessoais/pilotos/teste-mentor-comagenteantigo/src/utils/routing/graph.ts) e [consulta OSM](E:/repositorios/projetos-pessoais/pilotos/teste-mentor-comagenteantigo/src/utils/routing/osm.ts): a representação consultada é centrada em ways viários; não carrega no modelo as relações de restrição necessárias para afirmar cobertura completa das conversões.
- [Grafo pedestre](E:/repositorios/projetos-pessoais/pilotos/teste-mentor-comagenteantigo/src/utils/routing/pedestrian.ts): deriva a versão bidirecional do grafo recebido. Isso não equivale a uma malha pedestre completa.
- [Regra de parada](E:/repositorios/projetos-pessoais/pilotos/teste-mentor-comagenteantigo/src/utils/routing/vehicleStop.ts) e [fundamentos do experimento](E:/repositorios/projetos-pessoais/pilotos/teste-mentor-comagenteantigo/__utilidades-back-office__/auto-roteirizacao/fundamentals.ts): há rotinas de projeção com funções diferentes; o experimento usa `suggestVehicleStop`. É preciso especificar qual regra gera o fundamento, em vez de presumir equivalência com todo comportamento padrão da UI.
- [Experimento](E:/repositorios/projetos-pessoais/pilotos/teste-mentor-comagenteantigo/__utilidades-back-office__/auto-roteirizacao/fundamentalExperiment.ts): há desempates por assinatura em pontos da seleção. Sua existência não demonstra, sem rastreamento, que esse foi o motivo específico da P12.
- [Exportação](E:/repositorios/projetos-pessoais/pilotos/teste-mentor-comagenteantigo/__utilidades-back-office__/auto-roteirizacao/experimentArtifacts.ts): grava `vehicleStopIsDefault: false`, e o validador consultado exige esse valor. O problema já está descrito no [rascunho específico](E:/repositorios/projetos-pessoais/pilotos/teste-mentor-comagenteantigo/docs-mentor/rascunhos/2026-09-11--experimento-forca-vehiclestopisdefault-false.md). “Foi otimizado” e “foi editado manualmente” não devem ser confundidos.

Os relatos da P12 deslocada cerca de 49 m, das 51 paradas no modo sem agrupamento inicial, da qualidade de `r60/c120` e da distância humana muito menor são referências da conversa. Não houve reexecução desses artefatos nesta análise. O checkout consultado não deve ser presumido idêntico ao estado de todas as experiências e correções mencionadas anteriormente.

### 9.2. Contraexemplos pequenos que devem orientar o futuro plano

1. Um grupo isolado impossível de fundir no início da lista e outro grupo facilmente fundível no fim: não deixar o orçamento inicial esconder o segundo.
2. Duas âncoras na mesma rua com custo veicular total equivalente, mas caminhada diferente: justificar a escolha pela regra declarada.
3. Estacionamento em rua alternativa que evita um grande retorno: mostrar que o gerador consegue propor essa alternativa.
4. Uma entrega com acesso longo desde o fundamento: continuar presente, com esforço completo informado.
5. Rua de mão única e restrição de conversão: não permitir solução baseada em simetria ou retorno não modelado.
6. Inserir um nó intermediário numa rua sem mudar a operação: o custo não deve mudar por acidente de representação.
7. Permutar a entrada e renomear IDs: para um problema geométrico equivalente, diferenças de solução precisam ser explicáveis, não efeitos ocultos do orçamento/ordenação.
8. Exportar e reimportar um vencedor: manter coordenada, grupo, ordem aplicável e métricas sob a mesma malha e configurações.

Esses exemplos são propostas de investigação/validação. Não foram implementados nem executados neste trabalho.

## 10. Como desenvolver com IA sem repetir o ciclo de erros

### 10.1. IA como colaboradora de engenharia

O ciclo proposto é pequeno e rastreável:

1. O humano descreve a operação esperada num caso concreto, incluindo por que estacionaria ali.
2. A IA traduz isso em regra, exemplo e contraexemplo, declarando o que ainda não sabe.
3. A regra é confrontada com o domínio existente antes de escrever uma solução maior.
4. Uma mudança algorítmica por vez é implementada quando autorizada, com métricas de antes/depois.
5. Um verificador separado confere cobertura, custos e restrições. Não basta reutilizar a mesma função possivelmente errada como “prova”.
6. A comparação volta ao mapa e ao relato operacional; divergências viram investigação documentada.

O registro de uma falha deve conter: sintoma, artefato, hipótese, evidência, causa confirmada ou pendente, solução proposta e estado da correção. Não chamar hipótese de causa para encerrar uma tarefa.

Uma revisão por outra IA pode ajudar a buscar contraexemplos, mas consenso entre modelos não certifica correção. Casos reproduzíveis e validação independente têm mais valor do que explicações convincentes.

Para controlar tokens: contratos curtos por módulo, contexto relevante, diffs pequenos e logs estruturados. Não pedir à IA para reler o projeto inteiro nem gerar dezenas de variantes antes de corrigir o significado do experimento. Mudanças de pesos, limites, estados ou semântica precisam aparecer na revisão, não ficar escondidas em helpers.

### 10.2. IA no motor em execução: opcional e posterior

Não começaria com LLM, reinforcement learning ou treinamento de uma rede para escolher a rota completa. Hoje faltam principalmente modelagem confiável, movimentos adequados e critérios observáveis de qualidade.

Uso futuro plausível de aprendizado: estimar tempo de atendimento, probabilidade de encontrar parada, preferências de caminhada e priorização de operadores. Isso depende de dados reais, consentimento quando aplicável e avaliação fora dos exemplos usados para ajustar o modelo.

Mesmo nesse cenário, manter o verificador determinístico das restrições e uma solução de fallback. Uma previsão de que “dá para parar” não deve revogar uma restrição conhecida. A explicação ao usuário deve vir dos custos e dados registrados; a IA pode redigi-la, não inventar o motivo após o fato.

## 11. Sequência sugerida para o plano definitivo

Estas são etapas candidatas para discussão, não tarefas abertas ou critérios de aceite já aprovados.

| Etapa | Trabalho proposto | Evidência para decidir o próximo passo |
| --- | --- | --- |
| A — Contrato operacional | Fixar entidades, limites, início/fim, objetivo e semântica dos três modos | Um caso descrito sem ambiguidades entre humano, cálculo e UI |
| B — Referência confiável | Congelar dois roteiros/malha e separar falha de dados, caminho e busca | Métricas reproduzíveis e divergências localizadas |
| C — Busca conjunta mínima | Inserção, reordenação, fusão/divisão/transferência e reancoragem | Resolver os contraexemplos centrais e explicar decisões |
| D — Busca mais forte | Multi-start completo e, se necessário, LNS/ALNS | Ganho adicional versus custo, mantendo só três vencedores por caso |
| E — Runtime do produto | Worker, cancelamento, cache, formato e importação fiel | Mesma solução avaliada/executada; tempo e memória no aparelho |
| F — Distribuição final | Pipeline da malha e política de atualização | Conectividade preservada, cobertura e custo medidos |

Para reduzir risco, separar três ambições:

- Piso: solução válida, reproduzível, com cobertura explícita e capacidade real de formar grupos; não pode chamar um fallback de rota comprovada.
- Padrão desejado: aproximar ou superar o roteiro humano nos dois casos sob a mesma contabilidade, com decisões de parada compreensíveis e runtime aceitável no aparelho.
- Teto de investigação: referências exatas pequenas, busca mais ampla, refinamento contínuo de âncoras ou troca da engine viária, apenas se houver lacuna demonstrada.

Não fixo aqui “ótimo em X segundos” ou “pipeline em uma semana”: não há medição suficiente para prometer isso. O plano deve escolher um orçamento de latência/memória e uma diferença tolerável para a referência humana depois de termos a linha de base comparável.

Se o grafo local estiver errado, priorizar sua correção ou substituição antes de sofisticar a busca. Se os caminhos estiverem corretos e a solução continuar ruim, trabalhar na geração de candidatos e nos operadores. Se a qualidade estiver boa e o celular lento, só então priorizar aceleração. São causas e intervenções diferentes.

## 12. Decisões que faltam antes de fechar o plano

1. Confirmar os dois roteiros de referência e a contabilidade exata do roteiro humano: início, fim, retorno, veículo e caminhada.
2. Escolher o objetivo principal e como trocar metros de veículo por caminhada/tempo de parada.
3. Fixar a regra canônica do fundamento e a política para acesso desconhecido.
4. Confirmar se a ordem a pé continuará sendo varredura derivada ou passará a ser uma decisão armazenada do otimizador.
5. Definir identidade, endereço, origem e posição padrão da parada de veículo, independentes da primeira entrega e da ordenação atual.
6. Definir o perfil veicular e as manobras permitidas ao chegar/sair da parada, sem inferir permissões só pela geometria.
7. Escolher orçamento de espera/memória para o aparelho e como tratar cancelamento e melhorias posteriores.
8. Decidir se o laboratório poderá usar Valhalla e OR-Tools locais como referências; isso não implica adoção no aplicativo.
9. Rever a distribuição da malha apenas com medições e, se necessário, atualizar a ADR correspondente; separar licença do código das obrigações sobre os dados OSM. [Licença e atribuição OSM](https://www.openstreetmap.org/copyright).

Conclusão: não parece necessário inventar uma nova teoria de roteirização nem delegar o diferencial inteiro a um produto pronto. O trabalho principal é formular corretamente esta variante de estacionamento e atendimento a pé, construir uma busca conjunta explicável e reaproveitar componentes onde eles realmente encaixam. Primeiro melhorar os dois casos com evidência; só depois ampliar o universo de rotas, parâmetros e tecnologias.

Fontes externas consultadas em 13/09/2026. Preços, planos, APIs e funcionalidades devem ser reconferidos quando uma decisão de adoção for tomada. Nenhuma contratação, instalação, alteração de algoritmo ou execução de experimento foi realizada para produzir este rascunho.
