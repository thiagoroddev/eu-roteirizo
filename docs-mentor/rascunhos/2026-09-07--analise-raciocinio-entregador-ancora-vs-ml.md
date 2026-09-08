# Análise: Como Ensinar ao Motor o Raciocínio do Entregador (Cálculos Simples vs Machine Learning)

**Data**: 07/09/2026  
**Autor**: Reflexão conjunta com o entregador e mantenedor  
**Origem**: Caso de uso real em Ipanema/Lagoa (Posto Ipiranga na Av. Epitácio Pessoa vs Rua Alberto de Campos)

---

## 1. O Problema Real: O Caso de Uso no Mapa

Nas capturas de tela do aplicativo, observou-se uma situação emblemática da entrega urbana no Rio de Janeiro:

1. **Parada 1 Inicial (Avenida Epitácio Pessoa, 1354 - Posto Ipiranga)**:
   - O veículo parou na Av. Epitácio Pessoa diretamente em frente ao posto.
   - A Av. Epitácio Pessoa é uma via com canteiro central/sentido específico ao longo da Lagoa.
2. **Proposta Automática para Parada 2 (Rua Alberto de Campos, 266)**:
   - A próxima entrega sugerida pelo aplicativo está geograficamente a menos de 100 metros em linha reta (o quarteirão logo atrás do posto).
   - **Porém, para o veículo ir da Epitácio Pessoa até a Rua Alberto de Campos pelas regras de trânsito, a distância foi calculada em 3,4 km**, pois o carro precisaria seguir pela Epitácio, contornar quarteirões distantes e pegar o sentido correto da Alberto de Campos.
3. **A Solução Natural que o Entregador Humano Fez**:
   - Em vez de parar o carro na Epitácio Pessoa, o entregador editou a âncora da Parada 1 para a **Rua Alberto de Campos**.
   - O entregador estaciona o carro na Rua Alberto de Campos, anda **43 metros a pé** até o Posto Ipiranga para entregar o pacote 1.
   - **Resultado para a Parada 2**: A distância de carro para a próxima parada (Rua Alberto de Campos, 266) despenca de **3,4 km para apenas 64 metros**.
   - **Balanço**: O entregador andou 43 metros a pé para economizar **3.336 metros dirigindo** e pelo menos 8 a 12 minutos preso no trânsito e semáforos.

---

## 2. A Pergunta Central: Machine Learning (ML) ou Cálculos Simples?

> *"Isso parece coisa que pode ser transformado em dados onde eu mostro como calcular certo com menos conversões, a máquina analisa e aprende, depois tenta deduzir em novos exemplos (ML). Ou cálculos simples resolvem?"*

### Veredito Direto: **Cálculos Simples e Algoritmos de Grafos com Lookahead são infinitamente superiores ao ML para este problema.**

Abaixo detalhamos os porquês técnicos, operacionais e arquiteturais.

---

## 3. Por que Machine Learning é a Ferramenta Errada Aqui

1. **Regras Rígidas de Trânsito vs Modelos Probabilísticos**:
   - A malha viária é um grafo matemático exato: uma rua é mão única ou não é; uma conversão é proibida ou permitida.
   - Redes neurais e modelos de ML são aproximadores estatísticos ("fuzzy"). Eles não garantem cumprimento de restrições rígidas (hard constraints). Um modelo de ML treinado frequentemente "alucina" sugerir entrar na contramão ou parar em locais inacessíveis porque "parece perto".
2. **Problema da Escassez de Dados de Treinamento**:
   - Para um modelo de ML aprender a tomar essa decisão em qualquer bairro do Rio de Janeiro ou do Brasil, seriam necessárias dezenas de milhares de rotas gravadas, rua por rua, com anotações manuais de "onde o humano preferiu parar e por quê".
   - Hoje temos apenas exemplos pontuais. Treinar ML com poucos dados causa *overfitting* imediato (o modelo decora o Posto Ipiranga da Epitácio, mas falha na Tijuca ou em Campo Grande).
3. **Execução no Dispositivo do Entregador (PWA / Mobile-First / Offline)**:
   - O projeto tem como diretriz arquitetural rodar no celular do entregador (ex: Samsung Galaxy M35), com baixo consumo de bateria, sem esquentar o aparelho no sol e funcionando mesmo com sinal instável de internet.
   - Um modelo de ML (TensorFlow.js ou ONNX Runtime) aumentaria o bundle em megabytes, consumiria CPU/memória excessiva para inferência e drenaria a bateria do aparelho.
4. **Falta de Explicabilidade e Ajuste**:
   - Se um modelo de ML sugerir uma rota ruim, é impossível debugar ("é uma caixa-preta de pesos").
   - Com funções matemáticas e pesos declarados, podemos inspecionar exatamente: *"O algoritmo escolheu a Alberto de Campos porque economizou 3,3 km de carro ao custo de 40m a pé"*.

---

## 4. Como Ensinar o Algoritmo com Cálculos Simples

O que parece "intuição humana mágica" é, na verdade, uma **otimização matemática objetiva** que pode ser formalizada em 4 etapas lógicas:

### Etapa A: Geração de Âncoras Candidatas Multivias (Multi-Street Candidates)
Ao agrupar uma entrega (ou conjunto de entregas próximas), o algoritmo **não deve** considerar apenas a rua onde a coordenada caiu (projeção direta).
- Ele busca todas as vias trafegáveis dentro de um raio de caminhada viável $R_{a\_pe}$ (ex: 50 a 100 metros).
- No caso do Posto Ipiranga, o raio alcança tanto a **Av. Epitácio Pessoa** quanto a **Rua Alberto de Campos**.
- O sistema gera dois candidatos de âncora para o veículo:
  - Candidato 1: na Av. Epitácio Pessoa (a pé = 5m).
  - Candidato 2: na Rua Alberto de Campos (a pé = 43m).

### Etapa B: Visão de Futuro / Olhar Adiante (1-Step Lookahead)
Um algoritmo ingênuo escolhe o Candidato 1 porque a caminhada é de apenas 5m.
Um algoritmo inteligente (que pensa como o entregador) faz **Lookahead**: ele avalia o impacto da âncora na transição para os próximos clientes:
- Onde estão os outros pacotes do romaneio que ainda precisam ser entregues?
- Se o veículo parar na **Epitácio Pessoa**, qual é o custo de sair dali para o próximo aglomerado? $\rightarrow$ 3.400 metros de carro.
- Se o veículo parar na **Alberto de Campos**, qual é o custo de sair dali para o próximo aglomerado? $\rightarrow$ 64 metros de carro.

### Etapa C: Função de Custo Combinada (Veículo vs Caminhada)
Criamos uma fórmula simples que penaliza a volta de carro em relação à caminhada a pé:

$$\text{Custo Total} = (\text{Metros de Carro} \times W_{\text{carro}}) + (\text{Conversões / Retornos} \times W_{\text{retorno}}) + (\text{Metros a Pé} \times W_{\text{pe}})$$

Onde o peso da volta de carro e do retorno é configurado para ser ordens de magnitude mais incômodo do que alguns metros a pé dentro do raio tolerável.
- Opção Epitácio: $(3400 \times 1) + (\text{retornos}) + (5 \times 2) \approx 3.410+$
- Opção Alberto de Campos: $(64 \times 1) + (0) + (43 \times 2) = 150$

**O algoritmo escolhe a Rua Alberto de Campos com folga esmagadora.**

### Etapa D: Escolha do Ponto de Entrada (A Primeira Parada)
O entregador apontou: *"eu primeiro calculo onde seria o melhor ponto de primeira entrega vendo qual caminho eu daria menos voltas/conversões, considerando de onde eu vim inicialmente."*

Isso se traduz matematicamente como:
- O veículo parte de uma origem (ex: o hub Shopee, ou a posição atual de GPS do entregador).
- Ele possui um vetor de aproximação (rumo de chegada ao bairro).
- A primeira parada a ser atendida deve ser aquela cuja âncora de entrada na malha do bairro minimize o percurso inicial e as conversões de entrada, sem exigir retornos logo no início do circuito.

---

## 5. Caso de Uso 2: Varredura por Corredores e a Rota de 56 Endereços em Ipanema

O entregador montou com sucesso um roteiro completo de **56 endereços, 83 pacotes e 28 paradas em Ipanema**, com 10,0 km de percurso viário estimado em ~3h10min.

### 5.1 O Raciocínio de "Varredura por Corredores" (*Corridor Sweeping*)
O entregador explicou como pensa globalmente:
> *"Eu defino a primeira parada calculando a rota inteira primeiro, traçando linhas onde eu passaria próximo da entrega mesmo sem ser na rua dela, só na rua principal no caso. Ou seja, se o algoritmo puder fazer essa linha com menos conversões passando nas ruas próximas das entregas, chegaria no mesmo resultado que eu."*

Em logística, essa estratégia é conhecida como **Corridor Sweeping / Spine Routing**:
- Em vez de ziguezaguear entrando e saindo de cada rua transversal, o entregador define um "espinhaço" contínuo pelas vias arteriais (ex: Vieira Souto -> Prudente de Morais -> Visconde de Pirajá -> Barão da Torre -> Redentor).
- As entregas nas ruas transversais ou paralelas são atendidas a pé a partir do veículo estacionado nesse corredor contínuo.
- O resultado prático: o veículo quase não faz curvas de 90° para ruas estreitas e sem saída; ele segue o fluxo da malha.

### 5.2 O Trade-Off Configurável: "Mais a Pé vs Mais de Veículo"
> *"E tem vez que não tem jeito, ou eu dou a volta de moto, ou ando um pedaço grande a pé, os dois são ruins, eu prefiro a pé, mas outros poderiam preferir ir de veículo dando mais volta, isso deve ser configurável nas opções."*

Este é um requisito de produto vital para o `DeliverySettings`:
- Entregador de moto/a pé: prefere andar 80m a pé para não dar volta de 2 km no trânsito.
- Entregador de van/carro com carga pesada: prefere rodar mais para parar na porta e não carregar peso no braço.
- O motor deve expor essa preferência como um peso ponderado ($W_{\text{veiculo}}$ vs $W_{\text{pedestre}}$ e raio máximo de caminhada configurável).

### 5.3 A Armadilha do Raio Circular: Inclusão Seletiva para Não Engolir Vizinhos Indesejados
O entregador observou outro detalhe refinado do dia a dia:
> *"Tem vez que se inclui entrega na última parada porque se aumentasse o raio iria colocar outro endereço que não era para entrar."*

Este é um limite clássico da geometria euclidiana (o círculo):
- **O problema do círculo cego**: Um raio circular de 60 metros traçado em linha reta pode alcançar as costas de um edifício na rua de trás, atravessando muros ou quarteirões onde não há passagem a pé direta.
- Se o usuário aumenta o stepper de raio para alcançar um endereço distante na **mesma calçada**, o círculo acaba "engolindo" um endereço da **outra rua**, que o entregador pretendia atender mais tarde no sentido correto do trânsito.
- Por isso o app oferece o botão manual `+` / `-` por item na lista da parada ([src/components/map/panel/StopItemList.tsx](../../src/components/map/panel/StopItemList.tsx)): permite a inclusão manual seletiva sem inflar o raio circular.
- **Para o algoritmo de auto-roteirização**: O agrupamento inteligente a pé deve privilegiar a **distância real na calçada (grafo de pedestre)** ou o mesmo segmento viário, em vez de depender apenas de um raio circular euclidiano "cego".

---

## 6. Achados Técnicos Revelados pelo Roteiro de 56 Paradas

### 6.1 Do Ponto Inicial até a Parada 1 a Linha Ficou Reta (Sem Malha de Rua)
No mapa da rota completa, a linha do carro azul (início) até a Parada 1 (na orla) cortou quarteirões em linha reta diagonal.

**Causa raiz no código ([src/hooks/useRoadGraph.ts](../../src/hooks/useRoadGraph.ts)):**
```typescript
const bbox = bboxFromPoints(points, BBOX_MARGIN_METERS);
```
- O cálculo da BBox do grafo baixado do Overpass utiliza **apenas os `points` de entrega**, ignorando a coordenada do `startPoint` (onde o veículo começa)!
- Se o veículo começa afastado (ou a mais de 300m da borda das entregas), o nó inicial fica fora do grafo ou sem conexão viária navegável até a primeira parada.
- O `aStar` não encontra caminho no subgrafo e recorre ao fallback de segurança: traça a linha reta euclidiana direta.
- **Ajuste futuro**: `bboxFromPoints` deve incluir `startPoint ? [startPoint, ...points] : points`.

### 6.2 O App Continua Exibindo "Roteiro em construção" a 100% e Não Permite Exportar
- O rótulo *"Roteiro em construção"* no cabeçalho do painel ([src/components/map/panel/RoteiroOverviewSection.tsx](../../src/components/map/panel/RoteiroOverviewSection.tsx)) é estático (`SECTION_PROGRESS`).
- A transição para execução e navegação em tempo real faz parte do requisito **`RF-009`** (ainda no backlog).
- A exportação e importação de rotas em JSON faz parte do requisito **`RF-013`** (ainda no backlog).
- **Extração imediata**: Como a rota fica salva no `IndexedDB` local (`routeStorage`), os dados dessa rota de 56 paradas estão preservados no navegador e podem ser exportados via console ou script para servir de **gabarito de ouro** nos testes unitários do motor de auto-roteirização.

### 6.3 Dados Primários vs Dados Deriváveis no JSON
O entregador questionou: *"será que tem informações que aparecem na tela mas não tem no JSON? Distância entre paradas na malha, tempo de veículo, a pé entre entregas, etc., ou não precisa porque pode ser calculado?"*

**Resposta arquitetural:**
- O JSON armazena propositalmente apenas a **verdade primária**: as coordenadas do veículo (`vehicleStop`), a lista de entregas (`pointIds`), a ordem e as configurações de velocidade/tempo de entrega (`config`).
- Todas as métricas visíveis na tela (quilômetros totais, tempo estimado de ~3h10min, metragem do circuito a pé de cada parada) são calculadas **dinamicamente e sob demanda** pelas funções de estimativa ([src/utils/routing/estimates.ts](../../src/utils/routing/estimates.ts)).
- Isso garante que os dados nunca fiquem obsoletos nem entrem em contradição caso o grafo viário seja atualizado ou caso as velocidades configuradas mudem. O JSON é 100% suficiente.

---

## 7. Conclusão e Próximos Passos

1. Não usaremos Machine Learning: heurísticas de grafos, varredura por corredores (*corridor sweeping*) e Lookahead bi-critério (carro + pedestre) entregam exatamente o raciocínio do entregador.
2. O roteiro de 56 paradas em Ipanema é o caso de teste perfeito para comparar o resultado humano contra as saídas das fatias do épico `TASK-RF-029`.
3. Anotado o bug de bounding box do `startPoint` para correção em tarefa oportuna.
4. Anotado o insight de agrupamento por calçada/conectividade para evitar a armadilha do raio circular cego.

