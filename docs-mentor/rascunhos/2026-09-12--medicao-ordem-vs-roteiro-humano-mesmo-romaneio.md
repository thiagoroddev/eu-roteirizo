# Medicao da ordem do algoritmo contra o roteiro humano no mesmo romaneio (AT202511198JQJE), e quanto 2-opt recupera

Rascunho aberto em 12/09/26.

> Rascunho nao e tarefa: sem gate, sem criterio de aceite, fora da fila.
> Sai daqui de quatro jeitos: requisito · ADR · tarefa · descartado com uma linha.

## Metodo

Medida: **soma das distancias em linha reta (haversine) entre paradas consecutivas**, partindo do
`startPoint` de cada roteiro. E um limite inferior do percurso: ignora rua, mao unica e conversao.

Foi escolhida de proposito. Em linha reta **nao existe matriz para estar errada**, entao qualquer
diferenca medida aqui e atribuivel a **ordem das paradas**, e nao ao grafo, ao A\*, a projecao de
ancora ou a qualquer fallback. Isola a camada 3.

Arquivos comparados:

- Humano: `2025-11-19-JQJE-LAGOA.json` (`routeName: "Minha rota"`, `at: AT202511198JQJE`)
- Algoritmo: `.mentor-saidas/auto-fundamentals/roteiro-1-2026-09-12T11-29-09-098Z/importaveis/1-r60-c120-com-agrupamento-inicial.json`

**Conferido:** os dois tem os mesmos **51 enderecos** (`points[].id` identicos, 51 em comum,
0 exclusivos de cada lado) e o mesmo `at`. A comparacao e do mesmo romaneio.

## Resultado

| | Paradas | Reta | vs humano |
|---|--:|--:|--:|
| **Roteiro humano** | 36 | **6.220 m** | — |
| **Algoritmo, ordem atual** | 40 | **6.982 m** | **+12,2%** |
| Algoritmo, apos 2-opt + Or-opt | 40 | **5.618 m** | **−9,7%** |
| Humano, apos 2-opt + Or-opt | 36 | 5.207 m | −16,3% |

### Controle: mesmo ponto de partida

Os dois roteiros partem de pontos diferentes. Refazendo o calculo com a ordem do algoritmo
partindo do inicio escolhido pelo humano:

| | Reta |
|---|--:|
| Algoritmo, ordem atual, a partir do inicio humano | 7.784 m |
| ... apos 2-opt + Or-opt | **5.175 m** (−33,5%) |

### Estimativa de percurso de rua

O roteiro humano tem 6.220 m em reta e **8.000 m reais informados**: fator de desvio implicito
de **1,29×**, valor normal para grade urbana com mao unica.

| | Estimativa de rua |
|---|--:|
| Humano (informado) | 8.000 m |
| Algoritmo hoje | ~8.980 m |
| Algoritmo com 2-opt | ~7.225 m |

## Leitura

**1 · A ordem atual e pior que a humana em 12,2%, nao em 100%.** A estimativa de rua fica em
~9,0 km contra 8,0 km. **Os ~20 km observados no app nao sao explicados por esta ordem de paradas**
e devem ser investigados como defeito de medicao/recomputacao na importacao, nao como falha do
otimizador. Ver Erro 6 do diario diagnostico.

**2 · A percepcao visual de "rabisco" esta correta mesmo com o total a 12%.** A concentracao do
desperdicio explica a discrepancia entre o que se ve e o que o total diz:

| Perna | Reta |
|---|--:|
| **P1 → P2** | **922 m** |
| P37 → P38 | 439 m |
| P16 → P17 | 368 m |
| P13 → P14 | 359 m |
| P6 → P7 | 302 m |
| P9 → P10 | 278 m |
| **soma das 6** | **2.669 m — 38% do percurso total** |

Uma unica perna, `P1 → P2`, vale **13% do roteiro inteiro**. Defeito concentrado num salto visivel
parece catastrofico no mapa e custa 12% no total. **O olho esta detectando a forma errada, e a
forma esta de fato errada** — nao e impressao.

**3 · 2-opt recupera 19,5% e passa o roteiro humano.** Sem tocar em matriz, em agrupamento, em
ancora ou em multistart. Apenas invertendo subsequencias sobre os mesmos pontos.

A reordenacao move **20 das 40 paradas**, e **reescreve completamente as 16 primeiras** — que sao
exatamente as visiveis no print onde o zigue-zague aparece. Nova ordem, em rotulos da ordem atual:

```
1 16 12 13 11 10 3 9 8 2 7 6 5 4 14 15 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 35 34 36 33 37 40 39 38
```

Da posicao 17 em diante a ordem atual ja estava praticamente correta. **O defeito esta concentrado
no inicio da rota**, onde a construcao gulosa tomou as decisoes iniciais e nunca as revisitou.

**4 · O agrupamento nao e a variavel.** Este arquivo ja e `com agrupamento inicial`: 51 enderecos
em 40 paradas. Mesmo com menos pontos para ordenar, a ordenacao continua 19,5% aquem. Ordenar bem
e ortogonal a agrupar, como o mantenedor apontou.

**5 · O multistart otimizou a variavel errada, e ha numero para isso.** O SPIKE-003 gastou 132,1 s
enumerando 153 inicios. O inicio que ele escolheu e de fato melhor **para a ordenacao fraca**:
6.982 m contra 7.784 m a partir do inicio humano. Mas depois do 2-opt a relacao se inverte:

| Inicio | Apos 2-opt |
|---|--:|
| Escolhido pelo multistart | 5.618 m |
| **Escolhido pelo humano** | **5.175 m** (−7,9%) |

O multistart escolheu o inicio otimo para um motor sem busca local, e esse inicio deixa de ser o
melhor assim que a busca local existe. **Os 132 s foram gastos calibrando uma variavel que a fase
de melhoria ausente tornava importante.** Com 2-opt, a escolha do inicio perde quase toda a
relevancia — que e o efeito esperado e documentado de busca local sobre multistart.

**6 · Nenhum dos dois e otimo.** O roteiro humano tambem melhora 16,3% com 2-opt. A referencia
humana e um bom piso de comparacao, nao um teto.

## Limites desta medicao

- ⚠️ Haversine **nao e a rede real**. Na malha dirigida, com mao unica, o ganho do 2-opt pode ser
  maior ou menor que 19,5%. O que esta demonstrado e que **a ordem e subotima como ordem**; a
  magnitude na rua precisa ser medida sobre a matriz real do motor.
- ⚠️ O fator de desvio de 1,29× vem de um unico roteiro e de um total informado, nao medido perna
  a perna.
- ⚠️ O arquivo do algoritmo e da rodada `11-29-09`, anterior as alteracoes de 12/09. A rodada
  `20-53-48` nao foi medida por este metodo.
- ⚠️ Confirmado de passagem: `vehicleStopIsDefault: false` em **40 de 40** paradas deste arquivo
  (Erro 3 do diario). E o agrupamento produziu 33 paradas de endereco unico, 5 pares, 1 trio e
  1 grupo de cinco.

## Reproducao

A medicao usa apenas os dois JSONs e haversine; nao depende do motor, do grafo nem da malha.
Implementacao: soma de pernas + 2-opt com inicio fixo + Or-opt de segmentos de 1 a 3, iterados
ate nao haver melhoria.

## O experimento que isto sugere

Rodar 2-opt + Or-opt **sobre a matriz real do motor**, sem alterar agrupamento, ancora, objetivo
ou multistart, e comparar o mapa resultante com o atual. Resultado esperado, se a medicao em reta
se confirmar na rede: o salto `P1 → P2` desaparece e as 16 primeiras paradas viram uma varredura
coerente.

Se o ganho na rede for muito menor que 19,5%, a diferenca aponta para a matriz e ai sim a hipotese
de custo dirigido inconsistente volta a mesa.

## Destino

PREENCHER: requisito · ADR · tarefa · descartado com uma linha.
