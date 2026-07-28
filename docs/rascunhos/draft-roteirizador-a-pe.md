> ⚠️ **DRAFT: planejamento de funcionalidade futura, NÃO implementada.** Este documento descreve a evolução do PWA atual (visualizador de rotas) para um **roteirizador interativo de paradas a pé/veículo, com cálculo local de caminhos**. Reflete uma *intenção de produto* discutida em 22/06/26, não o código atual. Para o estado real, ver `docs/contexto-projeto-ai.md` e `docs/CODIGO_COMENTADO.md`. Nada aqui vira tarefa até ser quebrado em `docs/tarefas/pendentes.md`.

# 🧭 Roteirizador a Pé: Planejamento Conceitual

> Transformar o visualizador atual num **planejador de rota com paradas personalizadas**, pensado para a realidade de quem entrega a com veículo mas precisa andar partes a pé (caso de uso: entregador Shopee). O diferencial é não depender de API paga de roteirização: os cálculos são funções locais sobre dados de via abertos (OpenStreetMap).

---

## 1. Contexto

O projeto hoje é um PWA client-side (React 18 + Vite + Leaflet + SheetJS) que **lê um romaneio** (XLSX/CSV) com várias rotas, agrupa entregas por `Corridor Cage` e visualiza no mapa + tabelas. É um *visualizador*: mostra o que já foi roteirizado por outro sistema.

A ideia aqui muda o papel do app: de **visualizador passivo** para **planejador ativo**. Em vez de só exibir uma rota pronta, o usuário monta a própria rota, decidindo a ordem das paradas e agrupando endereços próximos em "paradas a pé".

A motivação é concreta e vem da dor de quem usa: o roteirizador da Shopee é ruim para entregas a pé, e os apps pagos não oferecem **paradas tão personalizáveis** (agrupar vários endereços num raio, estimar tempo caminhando, alternar entre modo a pé e veículo). É um nicho real e mal atendido.

---

## 2. O Problema que Resolve

Um entregador a pé não pensa em "endereços", pensa em **paradas**: "vou estacionar a moto aqui, e a pé entrego esses 6 pacotes desse quarteirão". Os apps de navegação tratam cada endereço como um ponto isolado de carro, ignorando que vários deles formam um agrupamento que se faz andando.

Este app modela exatamente isso:

- Uma **Parada** é um agrupamento de **Pontos** (endereços) próximos, atendidos a pé a partir de um lugar onde se "para" o veículo.
- O usuário controla quais pontos entram em cada parada (por raio + ajuste manual).
- O app estima tempo de forma realista: tempo de caminhada *dentro* da parada + tempo de deslocamento *entre* paradas, com velocidades configuráveis.

> 💡 **Insight central:** o "endereço" deixa de ser a unidade de planejamento. A unidade vira a **parada**. Isso é o que nenhum app genérico faz bem, e é barato de implementar porque é só estrutura de dados + geometria.

---

## 3. Pré-requisito: Ler Rota Única (colunas opcionais)

Hoje a leitura exige colunas obrigatórias (`MANDATORY_COLUMNS = Corridor Cage, Latitude, Longitude`) e usa `Corridor Cage` para *agrupar várias rotas*. Para o novo fluxo, o usuário envia **uma rota só**, numa planilha mais simples, sem essas colunas de agrupamento.

### Como funciona a detecção

A ausência das colunas de agrupamento, somada a validações, identifica que se trata de rota única:

| Cenário | Tem `Corridor Cage`? | Interpretação |
|---|---|---|
| Romaneio multi-rota (atual) | Sim | Agrupa por cage, modo visualizador |
| Planilha de rota única (novo) | Não | Todas as linhas = uma rota só |

O que **continua obrigatório** em qualquer cenário é o par de coordenadas (`Latitude`/`Longitude`): sem isso não há o que plotar. O `Corridor Cage` migra de *obrigatório* para *condicional*: sua ausência não é erro, é um sinal.

> 🔍 **Análise Profunda: onde mexer:**
> A lógica vive em `src/utils/excelProcessor.ts` e nas constantes `MANDATORY_COLUMNS`/`OPTIONAL_COLUMNS` (`src/constants/index.ts`). A refatoração é separar "colunas que validam coordenada" (sempre obrigatórias) de "colunas que definem agrupamento" (opcionais, mudam o modo). É a mudança de **menor risco** do projeto inteiro e a porta de entrada para tudo o que vem depois. Deve ser a primeira tarefa.

⚠️ **Atenção:** essa mudança mexe num ponto coberto por testes (`excelProcessor.test.ts`). Atualizar os testes faz parte da tarefa: o projeto preza "código é a verdade primária" e tem 235 testes passando.

---

## 4. A Decisão de Arquitetura: Nível A → Nível B

O "traçar caminhos respeitando o sentido das vias" tem dois níveis de ambição. **Decisão tomada: começar pelo A e evoluir para o B.** Documentado aqui porque essa escolha governa todo o roadmap.

### Nível A: Sugestão por proximidade + navegação delegada

O app ordena/sugere paradas pela **distância** (inicialmente em linha reta: *haversine*) e desenha linhas simples no mapa. A navegação *real*, com mão de direção, é **delegada ao Google Maps / Waze** via deep links. Esses apps já fazem roteamento perfeito e de graça.

- **Custo:** ~zero. **Esforço:** médio. **Risco:** baixo.
- Entrega valor de cara: o usuário já monta paradas, vê estimativas e navega.
- É o que a maioria dos apps baratos faz: e já seria melhor que o roteirizador da Shopee para o caso a pé.

### Nível B: Roteamento local real (o diferencial)

O próprio app calcula e desenha o traçado que **respeita as mãos de direção**, sobre um grafo de ruas do OpenStreetMap, com algoritmo de menor caminho local (sem API de roteirização). Detalhado na seção 7.

- **Custo:** ~zero (dados OSM são abertos). **Esforço:** alto. **Risco:** médio.
- É o diferencial técnico, mas só vale atacar depois que o fluxo de paradas estiver de pé.

> ✅ **Viabilidade CONFIRMADA (22/06/26).** Decisão: ir direto para o Nível B, o usuário precisa, já no planejamento, ver a rua traçada com a quilometragem real e comparar destinos pelas ruas percorridas, o que o Nível A não entrega. Um protótipo descartável foi construído em [`prototipos/roteamento-osm/`](../../prototipos/roteamento-osm/) e validado em campo (Ipanema): o A* sobre grafo direcionado **respeita a mão de direção** (contramão vira desvio), exibe a quilometragem pelas ruas e os nomes das vias percorridas, recalculando ao trocar o destino. O núcleo (grafo + A*) também passou em testes automatizados em Node antes da tela. Próximo passo deixa de ser "provar" e passa a ser "migrar para o projeto".

> 💡 **Por que A antes de B (raciocínio de mentor):** a parte difícil (roteamento) é independente da parte que define o produto (paradas, estimativas, modo execução). Construir o caro primeiro é arriscar semanas no motor e descobrir tarde que a UX de paradas precisava ser diferente. Validar o A garante que, quando o B chegar, ele se encaixa num app que você já sabe que funciona. Os dois **coexistem**: o B só troca o "como a linha é desenhada", sem reescrever o resto.

---

## 5. Modelo de Dados (o coração do recurso)

Antes de qualquer tela, o modelo. Tudo gira em torno de três entidades:

```typescript
/**
 * Ponto = um endereço individual do romaneio (uma linha da planilha).
 * É o dado bruto que já temos hoje (RowData), enriquecido com identidade
 * e contagem de pacotes.
 */
interface DeliveryPoint {
  id: string;
  lat: number;
  lng: number;
  address: string;
  packageCount: number;     // quantos pacotes nesse endereço
  rawData: RowData;         // mantém a linha original da planilha
}

/**
 * Parada (Stop) = agrupamento de Pontos próximos, atendidos a pé.
 * É a UNIDADE de planejamento: a abstração nova que o app introduz.
 */
interface RouteStop {
  order: number;            // número ordinal exibido no mapa (1, 2, 3...)
  centroidLat: number;      // ponto "representante" da parada no mapa
  centroidLng: number;
  pointIds: string[];       // quais DeliveryPoints fazem parte
  radiusMeters: number;     // raio usado para auto-agrupar
}

/**
 * Rota planejada = a sequência ordenada de paradas + config de execução.
 * É o que se salva (IndexedDB) e o que se "executa".
 */
interface PlannedRoute {
  id: string;
  startPoint: { lat: number; lng: number } | null;
  stops: RouteStop[];
  config: {
    walkingMinutesPerDelivery: number;  // tempo por entrega a pé
    vehicleSpeedKmh: number;            // velocidade de deslocamento moto/carro
  };
}
```

> 🔍 **Análise Profunda: por que separar `DeliveryPoint` de `RouteStop`?**
> Porque eles têm ciclos de vida diferentes. O `DeliveryPoint` é *imutável* (veio da planilha). A `RouteStop` é *construída e editada* pelo usuário: pontos entram e saem dela. Misturar os dois (ex.: marcar `isInStop` direto no ponto) embaralharia "o que é dado" com "o que é decisão", e tornaria difícil desfazer/refazer. Essa separação é a diferença entre um código que um humano mantém e um emaranhado.

Repare numa correspondência com o que você já conhece: é a mesma lógica de **estado derivado** do React. `DeliveryPoint[]` é a fonte da verdade (como `props`); `RouteStop[]` é a decisão do usuário sobre essa fonte (como `state`); os contadores ("X pontos definidos, Y pacotes faltando") são *derivados* dos dois (como um `useMemo`), nunca armazenados em duplicidade.

---

## 6. Fluxo de Construção da Rota (UX)

A sequência que você descreveu, traduzida em estados:

1. **Pontos no mapa** → exibe todos os `DeliveryPoint`. Os ainda não atribuídos a nenhuma parada ficam **cinza desbotado**, com a contagem de pacotes que faltam visível.
2. **Escolher ponto inicial** → define `startPoint`.
3. **Sugerir próxima parada** → app traça uma linha até o ponto *mais próximo* (vizinho mais próximo). Sugere, não impõe.
4. **Tocar no ponto → painel de raio** → o usuário define o raio (ex.: 2 m); o app inclui na parada todos os pontos dentro dele. Pode **adicionar/remover manualmente**.
5. **Salvar a parada** → vira uma `RouteStop` com número ordinal. No mapa aparece **um marcador só** (o centroide); ao tocar, expande mostrando pontos individuais, qtd de pontos, qtd de pacotes e **estimativa de tempo**.
6. **Repetir** até todos os pontos estarem em alguma parada.
7. **Salvar a rota** → só é permitido quando **todos os pacotes/pontos foram atribuídos** (validação de completude).

> 💡 **Dica de implementação:** o estado dessa construção é bem mais complexo que o `useState` espalhado de hoje. Recomendação: um `useReducer` dedicado (`routeBuilderReducer`) com ações explícitas (`SELECT_START`, `CREATE_STOP`, `ADD_POINT_TO_STOP`, `REMOVE_POINT`, `COMMIT_STOP`). Isso dá histórico de ações legível e abre caminho natural para *desfazer/refazer*. É também a forma como um humano experiente organizaria: não um componentão de 800 linhas com vinte `useState`.

### Vizinho mais próximo ≠ TSP

Vale registrar: você **não** precisa de um solver de Caixeiro Viajante (TSP), que é um problema computacionalmente caro. Como **você** escolhe a próxima parada e o app só *sugere a mais próxima*, basta a heurística do vizinho mais próximo (achar o ponto não-visitado de menor distância). É barata e suficiente. Otimização automática da ordem inteira fica como *ideia futura*, não requisito.

---

## 7. Fundamentos do Nível B: Roteamento Local

Esta seção existe para quando o Nível B for atacado. É o tema que mais merece estudo, então vai com profundidade.

### 7.1 Por que "respeitar o sentido da via" é um problema de grafo

Uma rua, para o computador, não é um traço no mapa: precisa virar um **grafo direcionado**:

- **Nós (vértices):** os cruzamentos.
- **Arestas (edges):** os trechos de rua entre cruzamentos. Cada aresta tem um *peso* (distância ou tempo) e uma *direção permitida*.

Numa rua de mão dupla, há aresta nos dois sentidos entre dois nós. Numa rua de mão única (`oneway`), só existe a aresta no sentido permitido. Essa é a sacada:

> 🔍 **Análise Profunda:** a restrição de mão de direção não é uma regra que você programa "à parte", ela **emerge da estrutura de dados**. Se a aresta da contramão simplesmente não existe no grafo, nenhum algoritmo de busca vai te mandar por ela. A mão única vira "ausência de caminho", e não "caminho proibido a checar". Modelar bem o dado elimina a necessidade de lógica defensiva. Esse é um princípio que se repete em programação: *estruturas de dados corretas tornam algoritmos triviais*.

**Analogia:** pense num tabuleiro onde cada casa tem setas de saída pintadas no chão. Você só pode mover seguindo setas. Mão única = a casa só tem seta num sentido. O algoritmo nunca "decide" ir na contramão; ele simplesmente não tem por onde.

### 7.2 De onde vêm os dados das vias

Do **OpenStreetMap (OSM)**: base cartográfica aberta e gratuita. As vias vêm como *ways* com tags, incluindo `highway` (tipo da via) e `oneway=yes/no/-1` (mão de direção). Formas de obter:

- **Overpass API**: consulta sob demanda um recorte geográfico ("me dê todas as ruas neste retângulo"). Boa para começar.
- **Extract `.osm.pbf`**: arquivo pré-baixado de uma região (ex.: Rio de Janeiro), processado uma vez. Melhor para offline/PWA.

> ⚠️ **Atenção: isto NÃO viola a regra de "sem API de roteirização".** A regra é não usar API que *calcula a rota* (Google Directions, Mapbox Directions: pagas/limitadas). Pegar o *dado bruto* das vias do OSM é o equivalente a baixar um mapa: o cálculo continua 100% local. São coisas diferentes, e a distinção é o que torna a sua ideia viável e barata.

### 7.3 O algoritmo: Dijkstra / A*

Com o grafo montado, achar o menor caminho entre dois nós é um problema clássico e resolvido:

- **Dijkstra:** explora o grafo em ondas a partir da origem, sempre expandindo o nó de menor custo acumulado, até alcançar o destino. Garante o caminho ótimo.
- **A\* (A-estrela):** um Dijkstra "esperto", usa uma *heurística* (a distância em linha reta até o destino) para priorizar a exploração na direção certa, achando o ótimo muito mais rápido. É o padrão para roteamento em mapas.

Em JavaScript, bibliotecas como `ngraph.graph` (estrutura) + `ngraph.path` (A\*) fazem a busca. **Seu trabalho** é o pipeline: OSM → grafo `ngraph` com pesos e direção corretos. Implementar Dijkstra na mão também é um excelente exercício didático, se o objetivo for aprender: vale como estudo paralelo.

### 7.4 Onde mora a dificuldade real

Não é o algoritmo (as libs resolvem). É o **pipeline de dados**:

1. Baixar e filtrar OSM (só vias navegáveis, descartar o irrelevante).
2. Construir o grafo com pesos e `oneway` corretos.
3. Lidar com **tamanho** dos dados num app de navegador (recorte por região, simplificação).
4. Fazer funcionar **offline** num PWA (cache do grafo via IndexedDB / service worker).
5. *Map matching:* "encaixar" um ponto de entrega (que cai no meio de um quarteirão) no nó/aresta de rua mais próximo.

> 💡 **Caminho incremental sugerido para o B:** (1) grafo de uma região pequena via Overpass; (2) A\* entre dois pontos quaisquer, desenhando a polilinha no Leaflet; (3) integrar com a sequência de paradas já existente do Nível A; (4) só então otimizar tamanho/offline. Cada etapa é demonstrável sozinha.

---

## 8. Modo Execução

Sem GPS em tempo real (decisão consciente: mantém simples e barato). A execução é **manual e guiada**:

- Iniciar rota → no ponto inicial, o app destaca a **primeira parada** com endereço e botões "Abrir no Google Maps" / "Abrir no Waze".
- O usuário chega, toca **"Cheguei"** → app revela o próximo ponto/parada.
- Dentro de uma parada (pontos do mesmo agrupamento), os links abrem em **modo caminhada** no Google Maps quando possível.

> 🔍 **Como funcionam os deep links (fundamento):** são apenas URLs com parâmetros que o sistema operacional reconhece e abre no app correspondente. Ex.: `https://www.google.com/maps/dir/?api=1&destination=LAT,LNG&travelmode=walking` abre o Maps já em modo a pé; o Waze usa `https://waze.com/ul?ll=LAT,LNG&navigate=yes`. É a forma mais barata de ter navegação turn-by-turn real sem reimplementar nada: você delega para quem já faz bem. No Nível A, é *a* estratégia de navegação; no Nível B, convive com o traçado próprio.

---

## 9. Stack e Recursos Necessários

Além do que o projeto já tem (React, Leaflet, SheetJS, Vite/PWA):

| Necessidade | Tecnologia sugerida | Quando entra |
|---|---|---|
| Geometria (haversine, ponto-em-raio) | `@turf/turf` ou funções manuais | Nível A |
| Persistência offline da rota | IndexedDB via `idb` ou `localForage` | Nível A |
| Estado da construção de rota | `useReducer` dedicado (ou Zustand se crescer) | Nível A |
| Dados de via | OpenStreetMap (Overpass API / extract `.pbf`) | Nível B |
| Grafo + menor caminho | `ngraph.graph` + `ngraph.path` (A\*) | Nível B |

> 💡 Nada disso exige sair do seu nível atual, **exceto** o pipeline OSM do Nível B, que é onde vale investir estudo dedicado. O resto é React + geometria + estado bem organizado.

---

## 10. Veredito de Viabilidade

| Bloco | Dificuldade | Observação |
|---|---|---|
| Ler rota única (colunas opcionais) | **Baixa** | Refatorar validação. Primeira tarefa, menor risco. |
| Agrupar pontos por raio | **Média** | Geometria pura. |
| Sugerir próxima parada (vizinho mais próximo) | **Baixa-Média** | Heurística simples, sem TSP. |
| Estimativas de tempo | **Baixa** | Aritmética com config. |
| UI de paradas, cores, contadores | **Média** | Estado mais rico; pede `useReducer`. |
| Persistência offline | **Média** | IndexedDB; app hoje não persiste nada. |
| Modo execução + deep links | **Média** | Máquina de estados + URLs. |
| **Roteamento local (Nível B)** | **Alta** | 80% do esforço total; pipeline OSM→grafo→A\*. |

**Conclusão:** o projeto é viável e a maior parte é acessível ao seu nível. O Nível A entrega um app útil e diferenciado com baixo risco. O Nível B é a fronteira técnica: concentre o estudo ali, mas só depois que o A estiver de pé.

---

## 11. Próximos Passos Sugeridos (não são tarefas ainda)

1. Quebrar o **Nível A** em tarefas em `docs/tarefas/pendentes.md`, começando por `TASK-RF` da leitura de rota única.
2. Validar o modelo de dados (seção 5): é a decisão mais barata de mudar agora e mais cara de mudar depois.
3. Prototipar o agrupamento por raio com dados reais de um romaneio seu, para sentir se 2 m / N metros faz sentido na prática.
4. Só então abrir uma frente de estudo dedicada ao roteamento (Nível B).

---

## Última Atualização

- **Data:** 22/06/26
- **Origem:** discussão de viabilidade da ideia "roteirizador a pé".
- **Status:** Nível B com **viabilidade confirmada** via protótipo (`prototipos/roteamento-osm/`). Pendente: quebra em tarefas, validação do modelo de dados e definição da estratégia de dados OSM em produção.
