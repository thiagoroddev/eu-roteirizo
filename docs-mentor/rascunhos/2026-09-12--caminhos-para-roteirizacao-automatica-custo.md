# Caminhos para entregar roteirizacao automatica no Eu-roteirizo, do mais caro ao custo zero, com infraestrutura, custo por rota e por ativo, avaliados tambem pelo diferencial de ancora de estacionamento

Rascunho aberto em 12/09/26 18:20.

> Rascunho nao e tarefa: sem gate, sem criterio de aceite, fora da fila.
> Sai daqui de quatro jeitos: requisito · ADR · tarefa · descartado com uma linha.

> **Cambio declarado:** US$ 1 = R$ 5,40 — ⚠️ **premissa deste rascunho, nao pesquisada.**
> Confirmar antes de usar em decisao. As conclusoes abaixo sao robustas a qualquer cambio
> plausivel: as diferencas entre opcoes sao de duas a tres ordens de grandeza, nao de percentual.

---

## O que se sabe

### O objetivo

Ter **roteirizacao automatica** no produto: o entregador importa o romaneio e recebe um roteiro
ordenado, sem montar parada por parada. Hoje isso nao existe — o `TASK-RF-029` e seu epico,
e tres spikes tentaram sem chegar a um motor promovivel.

### As sete peculiaridades que filtram as opcoes

Estas nao sao detalhes: cada uma elimina ou reabilita caminhos inteiros. Nenhuma comparacao
generica de "melhores APIs de roteirizacao" serve aqui, porque nenhuma considera estas sete.

| # | Peculiaridade | Consequencia |
|---|---|---|
| 1 | **O romaneio Shopee ja traz lat/lng** | Geocoding das entregas = zero. A maior fatia do custo tipico de roteirizacao **nao se aplica** |
| 2 | **Preco do produto: R$ 5/mes, R$ 4,25 liquido** | Teto absoluto de custo variavel: **R$ 0,193 por rota** (22 rotas/mes), e isso com margem zero |
| 3 | **Roteiro tipico de 51 a 60 enderecos** | Medido nos casos 1 e 2 do SPIKE-003. Instancia pequena para TSP: cabe em busca local no cliente |
| 4 | **O diferencial e ancora de estacionamento (park-and-loop)** | ⚠️ **Nenhuma API de otimizacao do mercado resolve isso.** Ver §"O que pagar nao compra" |
| 5 | **Precisa de duas matrizes: veicular e pedestre** | Toda opcao paga cobra as duas. Dobra o custo variavel de qualquer API |
| 6 | **Ja existe grafo OSM dirigido + A\* no cliente** | A matriz de custo **pode ser construida localmente, de graca**. O ativo mais valioso do projeto ja esta pronto |
| 7 | **Offline/PWA e a vantagem de custo do produto** | ADR-002, RNF-02, RNF-03/13. API por rota exige conexao no momento do planejamento — na rua, no celular |

### As quatro camadas do problema, e onde o projeto esta

Toda roteirizacao se decompoe nestas camadas. A comparacao das opcoes e, na pratica,
"quem fornece as camadas 2 e 3".

| Camada | O que faz | Situacao no projeto |
|---|---|---|
| 1 · Geocodificacao | Endereco → lat/lng | ✅ **Resolvida de graca** (peculiaridade 1) |
| 2 · **Matriz de custo** | n pontos → matriz n×n de tempo/distancia real | ⚠️ **Nao existe.** O A\* existe, a matriz nao |
| 3 · **Otimizador** | Matriz → ordem de visita | ❌ **Existe so a fase de construcao.** Sem 2-opt, sem Or-opt, sem metaheuristica |
| 4 · Navegacao | Sequencia → instrucoes curva a curva | Fora de escopo (deep link) |

### O que pagar nao compra — o achado que reordena tudo

As APIs gerenciadas (Google Route Optimization, Routific, NextBillion) resolvem **VRP com
janelas de tempo, capacidade e frota**. Elas recebem uma lista de paradas e devolvem a ordem.

Elas **nao** resolvem park-and-loop. Nao escolhem onde o veiculo para, nao agrupam enderecos
por caminhabilidade, nao otimizam o mini-percurso a pe dentro do grupo, e nao trabalham com
duas matrizes simultaneas com politica de troca entre elas.

> **Consequencia:** em **todas** as opcoes pagas, o agrupamento, a escolha da ancora e o
> circuito a pe continuam sendo codigo seu. A API resolve apenas o TSP externo sobre ancoras
> que voce ja escolheu — que e justamente **a parte mais facil e a que ja roda local**.
>
> Pagar nao compra o diferencial. Compra a camada que voce tem condicao de fazer de graca.

Isso inverte a intuicao normal de "comprar e mais rapido que construir". Aqui, comprar
resolve ~30% do problema e deixa os 70% dificeis exatamente onde estao.

---

## As opcoes, da mais cara a de custo zero

Premissas comuns: 60 paradas por roteiro · 22 rotas/mes por ativo · matriz veicular apenas
(a pedestre **dobraria** os numeros das opcoes 1 e 2).

---

### Opcao 1 — API gerenciada de otimizacao ponta a ponta (a mais rapida de integrar)

**Infraestrutura:** nenhuma sua. Chamada HTTP do cliente ou de um Worker.
**Fornecedores:** Google Route Optimization API · Routific Engine API · NextBillion.ai.

**O que voce entrega em dias:** ordenacao de 60 paradas com janelas de tempo e restricoes,
sem escrever otimizador.

**A conta, com o numero publicado:**

O Google Routes API cobra a matriz em **elementos**, a **US$ 5,00 por 1.000 elementos**
na primeira faixa. Um roteiro de 60 paradas gera 60 × 59 = **3.540 elementos**.

| | |
|---|---:|
| Elementos por roteiro | 3.540 |
| Custo por roteiro | **US$ 17,70** ≈ **R$ 95,58** |
| Custo mensal por ativo (22 rotas) | **US$ 389,40** ≈ **R$ 2.103** |
| Receita liquida mensal por assinante | **R$ 4,25** |
| **Razao custo/receita** | **~495×** |

Com a matriz pedestre incluida (peculiaridade 5): **~990×**.

**Free tier:** 10.000 eventos Essentials/mes por SKU, desde a mudanca de marco/2025 — o credito
unico de US$ 200 acabou. 10.000 ÷ 3.540 = **2,8 roteiros por mes no total da conta**, nao por
usuario. Cobre menos de um dia de um unico entregador.

**Diferencial:** ❌ nao atendido. Ancora, agrupamento e circuito a pe continuam por sua conta.

**Veredito:** ❌ **Inviavel por tres ordens de grandeza.** Isso nao se resolve negociando
desconto por volume nem trocando de fornecedor: o modelo de cobranca por elemento e
estruturalmente incompativel com um produto de R$ 5/mes que recalcula rotas diariamente.
Registrado aqui para a conta existir por escrito, nao como candidato.

---

### Opcao 2 — Matriz por API + otimizador proprio

**Infraestrutura:** Worker para proxy/cache da matriz. Otimizador no cliente ou no Worker.
**Fornecedores de matriz:** Mapbox Matrix API · Google Compute Route Matrix · Geoapify.

**A ideia:** comprar so a camada 2 (matriz), que e a que traz a malha viaria real com mao unica
e conversao proibida, e construir a camada 3 (otimizador) voce mesmo — assim o diferencial fica
sob seu controle.

**Restricoes operacionais medidas na documentacao:**

- Mapbox Matrix: **maximo 25 coordenadas por requisicao**, teto de 625 elementos, 60 req/min.
  Um roteiro de 60 paradas exige **particionar a matriz em ~9 requisicoes** e costurar os
  blocos. Com a matriz pedestre, ~18. O perfil `mapbox/walking` existe, o que e um ponto a favor.
- ⚠️ **Preco por elemento do Mapbox: nao confirmado.** A pagina oficial remete a
  `mapbox.com/pricing` sem publicar o numero, e a analise de terceiros que consultei marca
  explicitamente este SKU como "preco a verificar". **Nao usar em decisao sem confirmar.**
- Cache: obrigatorio checar permissao contratual de armazenamento, como ja foi feito para
  geocoding em `plano-infraestrutura-e-custos.md` §7.3. Matriz e dado derivado; a clausula
  pode ser diferente da de geocoding.

**Diferencial:** ⚠️ parcialmente atendido. Voce controla a funcao objetivo, o que e o que
importa. Mas a matriz pedestre dobra o custo e a de pedestre em area urbana brasileira tem
qualidade desigual.

**Veredito:** ⚠️ Melhor que a opcao 1 porque o diferencial volta para suas maos, e o custo cai
para o de uma camada so. Ainda assim mantem **custo variavel por rota** e **dependencia de
conexao no momento do planejamento**, que sao exatamente as duas coisas que a arquitetura do
produto foi desenhada para nao ter. Nao recomendada como destino, util como **oraculo de
validacao** (ver opcao 4+).

---

### Opcao 3 — Self-host: OSRM + VROOM em VPS

**Infraestrutura:** um VPS rodando dois processos OSRM (perfil `car` e perfil `foot`) + VROOM,
alimentados por extrato OSM da regiao. Worker como fachada.
**Software:** todo gratuito e de codigo aberto — OSRM (BSD), VROOM (BSD), OR-Tools (Apache 2.0).

**O que isso entrega:** `OSRM /table` devolve a matriz 60×60 em milissegundos. VROOM resolve
o VRP com restricoes. Custo marginal por rota ≈ **zero**: paga-se a maquina, nao a chamada.

**A conta, usando os precos ja pesquisados em `plano-infraestrutura-e-custos.md` §7.4:**

| Item | Valor |
|---|---:|
| Contabo Cloud VPS 8 (8 vCPU / 24 GB) | ~R$ 81/mes |
| Hetzner CAX31 ARM (8 vCPU / 16 GB) | ~R$ 122/mes |
| Custo variavel por rota | **R$ 0** |
| Tempo de operacao (build do extrato, updates, monitoramento) | ⚠️ **nao precificado** |

Custo por ativo: R$ 0,27 a 300 ativos · R$ 0,08 a 1.000 · R$ 0,0016 a 50.000.

**Lacunas a medir antes de decidir:**

- ⚠️ **RAM do OSRM para extrato metropolitano do Rio: nao medida.** Um extrato de cidade e
  leve; Brasil inteiro nao. O mesmo erro que a §10 do plano de infra registra para o Nominatim
  (numeros de planeta citados como se fossem de pais) se aplica aqui. Medir, nao estimar.
- Dois perfis OSRM = dois datasets pre-processados = mais RAM e mais disco.
- Pipeline de atualizacao do extrato: recorrente, manual, e nunca aparece na fatura.

**Colisao com decisoes registradas:** contraria a **ADR-002** (roteirizacao local, sem API
paga — que descartou OSRM/Valhalla explicitamente por "reintroduzir backend e matar o offline"),
a **RNF-02** e a **RNF-14** (grafo offline). Nao e impedimento — e uma decisao que precisa ser
reaberta conscientemente, com ADR nova, nao contornada em silencio.

**Diferencial:** ⚠️ parcialmente atendido, igual a opcao 2. VROOM resolve o TSP sobre as
ancoras; o agrupamento e o circuito a pe continuam seus.

**Veredito:** ⚠️ Tecnicamente solido e economicamente muito melhor que 1 e 2. Mas paga custo
fixo mensal **mais tempo de operacao** para resolver a camada que voce ja tem condicao de
resolver de graca no cliente — e ainda assim nao resolve o diferencial. **O melhor uso do
OSRM neste projeto nao e producao: e validacao** (opcao 4+).

---

### Opcao 4 — Custo zero: matriz do proprio grafo + busca local no cliente ⭐

**Infraestrutura:** nenhuma nova. Nada. Zero requisicoes, zero dependencias, zero backend.

**Camada 2 — a matriz.** Rodar o A\* que **ja existe** n×n sobre o grafo OSM que **ja e
carregado**, dentro de um Web Worker, com cache em IndexedDB. 60 paradas = 3.540 pares.
A matriz e calculada uma vez por roteiro e reaproveitada por todas as estrategias e por todas
as iteracoes da busca — e esse reaproveitamento e justamente o que falta hoje.

**Camada 3 — o otimizador.** 2-opt + Or-opt + Guided Local Search em TypeScript. Sao da ordem
de **300 linhas**, testaveis, deterministicas, sem dependencia externa. E a fase de melhoria
que os tres spikes nao tem: e ela que tira uma rota de ~+25% do otimo para ~+5%.

| Item | Valor |
|---|---:|
| Custo de infraestrutura | **R$ 0** |
| Custo variavel por rota | **R$ 0** |
| Custo por ativo, em qualquer escala | **R$ 0** |
| Custo real | **esforco de engenharia** |

**Decisoes preservadas:** ADR-002, RNF-02, RNF-03/13, RNF-14 — todas intactas. Offline
preservado. Nenhuma linha do plano de infraestrutura muda.

**Diferencial:** ✅ **Unica das quatro em que o diferencial e natural.** Voce controla a funcao
objetivo, entao pode: manter duas matrizes (veicular pelo grafo dirigido, pedestre pelo grafo
a pe derivado do mesmo snapshot — os dois ja existem no projeto), escrever o custo real da
operacao (tempo de carro + estacionar/sair + circuito a pe + tempo de servico), e desempatar
por menor caminhada em vez de por ID tecnico, que e o defeito registrado no achado da parada 12
do SPIKE-003.

**O risco honesto:** e exatamente o caminho que ja falhou tres vezes. A diferenca proposta nao
e "tentar de novo com mais forca" — e que os tres spikes construiram **so a fase de construcao**
(guloso, multistart, orcamento de movimentos) e nenhum construiu a **fase de melhoria**. E que
nenhum tinha regua para saber se o resultado era bom. As duas coisas se resolvem junto na 4+.

---

### Opcao 4+ — A 4, com OSRM e OR-Tools como oraculo de validacao (custo zero em producao)

Nao e uma quinta opcao: e a 4 com a regua que faltou aos tres spikes.

OSRM, VROOM e OR-Tools sao gratuitos e rodam **na sua maquina**, em Docker, sem custo nenhum.
Use-os **fora de producao**, no `__utilidades-back-office__`, para gerar as tres reguas que o
arquivo de melhorias do mentor propoe como obrigatorias (M4):

| Regua | Como obter, de graca |
|---|---|
| **Piso** | Nearest neighbor sobre a mesma matriz. O resultado tem obrigacao de bater isto |
| **Teto** | Forca bruta em instancias de 8-10 paradas (40.320 permutacoes, milissegundos). Otimo certificado |
| **Padrao** | OR-Tools ou VROOM local sobre a mesma matriz. Diz quanto o estado da arte entrega |

Com as tres, "inconclusivo" deixa de ser o desfecho estrutural: voce passa a saber, em numero,
a que distancia do estado da arte o seu motor esta — e se a distancia justifica ou nao reabrir
a opcao 3.

**Custo em producao: R$ 0.** Custo em desenvolvimento: Docker na sua maquina.

---

## O quadro comparativo

### Por rota

Teto de custo variavel sustentavel: **R$ 0,193 por rota** (R$ 4,25 liquidos ÷ 22 rotas), e isso
com margem zero.

| Opcao | Custo por rota | Contra o teto | Diferencial | Offline |
|---|---:|---:|:--:|:--:|
| 1 · API gerenciada | ~R$ 95,58 | **495×** | ❌ | ❌ |
| 2 · Matriz por API | ⚠️ a confirmar, mesma ordem | — | ⚠️ | ❌ |
| 3 · OSRM+VROOM self-host | R$ 0 (+ R$ 81-122 fixo) | fixo | ⚠️ | ❌ |
| 4 · Cliente, custo zero | **R$ 0** | **0×** | ✅ | ✅ |

### Por escala mensal, contra a tabela de break-even do plano de infra §11

| Ativos | Opcao 1 | Opcao 3 | Opcao 4 |
|---:|---:|---:|---:|
| 300 | R$ 630.900 | R$ 81 | **R$ 0** |
| 1.000 | R$ 2.103.000 | R$ 81 | **R$ 0** |
| 3.000 | R$ 6.309.000 | R$ 122 | **R$ 0** |
| 10.000 | R$ 21.030.000 | R$ 122 | **R$ 0** |
| 50.000 | R$ 105.150.000 | R$ 244 (2 VPS) | **R$ 0** |

> Os numeros da opcao 1 nao sao erro de digitacao. Sao o que sai de US$ 17,70 por rota ×
> 22 rotas × N ativos. E por isso que "qual API de roteirizacao usar" nunca foi a pergunta
> certa para este produto.

### O que cada opcao exige que voce construa de qualquer jeito

| | Matriz | TSP externo | **Agrupamento** | **Escolha da ancora** | **Mini-TSP a pe** |
|---|:--:|:--:|:--:|:--:|:--:|
| Opcao 1 | comprado | comprado | **seu** | **seu** | **seu** |
| Opcao 2 | comprado | seu | **seu** | **seu** | **seu** |
| Opcao 3 | self-host | self-host | **seu** | **seu** | **seu** |
| Opcao 4 | seu | seu | **seu** | **seu** | **seu** |

A coluna que define o produto e a mesma nas quatro. A diferenca entre gastar R$ 105 milhoes/mes
e R$ 0 esta apenas nas duas primeiras colunas — e a segunda sao 300 linhas de TypeScript.

---

## O que falta decidir

1. **A opcao 4 e o destino, ou apenas o MVP?** Se o produto um dia precisar de transito em
   tempo real ou janelas de entrega rigidas, a opcao 3 volta a mesa. Hoje nao precisa.
2. **Reabrir ou nao a ADR-002?** Se a resposta for "opcao 4", a ADR-002 esta **confirmada**, e
   isso deveria ser registrado explicitamente, com esta conta anexa — para a proxima IA que
   ler o repositorio encontrar a justificativa em vez de so a restricao.
3. **A 4+ vira tarefa antes da 4?** Construir a regua antes do motor inverte a ordem dos tres
   spikes anteriores. Custa pouco e muda o desfecho de "inconclusivo" para mensuravel.
4. **A matriz pedestre sai do mesmo snapshot?** O plano do SPIKE-002 ja previa malha pedestre
   derivada do mesmo snapshot. Confirmar que ela esta utilizavel dispensa qualquer fonte externa.

## Medicoes baratas que decidem tudo isto

Nenhuma custa dinheiro. Todas cabem numa tarefa pequena.

| Medicao | Por que decide |
|---|---|
| **Tempo do A\* atual para montar a matriz 60×60 no celular** | ⚠️ Nunca medido. **E a unica medicao que pode invalidar a opcao 4.** Se der minutos, a opcao 3 volta a mesa; se der segundos com cache, a 4 esta confirmada |
| Ganho de 2-opt + Or-opt sobre a saida atual do guloso | Diz quanto do problema era so a fase de melhoria ausente |
| Otimo por forca bruta em 9 paradas vs. saida do motor | Da o teto. Sem ele, nenhum spike pode concluir |
| RAM do OSRM para extrato do Rio | So necessario se a opcao 3 for reaberta |
| Preco/elemento do Mapbox Matrix | So necessario se a opcao 2 for reaberta |

---

## Riscos e lacunas declarados

- ⚠️ **Cambio nao pesquisado** (US$ 1 = R$ 5,40 assumido). Nao afeta as conclusoes.
- ⚠️ **Preco/elemento do Mapbox nao confirmado.** Fonte oficial nao publica; analise de
  terceiros marca como volatil.
- ⚠️ **Preco por shipment da Google Route Optimization API nao publicado** na pagina oficial
  de billing. A conta da opcao 1 usa o SKU de **Compute Route Matrix**, que e publicado, e ja
  e suficiente para a conclusao.
- ⚠️ **RAM do OSRM para extrato metropolitano nao medida.** Nao repetir o erro de citar
  numero de planeta como se fosse de regiao.
- ⚠️ **Tempo de operacao do VPS nao precificado**, mesma lacuna ja registrada na §10 do plano
  de infraestrutura.
- Precos de API mudam. Google reestruturou o free tier em marco/2025; Hetzner reajustou em
  junho/2026. Reconferir antes de qualquer decisao de contratacao.

## Referencias

- `docs/rascunhos/plano-infraestrutura-e-custos.md` §7.4 (VPS), §9 (serverless), §11 (break-even)
- `docs-mentor/tarefas/abertas/TASK-SPIKE-003.json` (51/59 enderecos; achado da parada 12)
- `docs-mentor/tarefas/concluidas/2026-09-11--03h11--TASK-SPIKE-002.md` (malha pedestre; deltas)
- `docs-mentor/melhorias-do-pacote.md` §M4 (as tres reguas)
- ADR-002 (roteirizacao local), RNF-02, RNF-03/13, RNF-14

## Destino

PREENCHER: requisito · ADR · tarefa · descartado com uma linha.
