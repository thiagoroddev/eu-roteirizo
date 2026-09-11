# TASK-RF-040 · Reconciliar RF-55 (ignorar enderecos) com o catalogo

## Decisoes tomadas

**Esta tarefa nao implementou nada: ela ATESTA.** O RF-55 foi codificado e entregue no
commit `1626097` ("feat: permitir ignorar enderecos perigosos ou fora de rota"), que saiu
SEM ID de tarefa — por isso o requisito ficou `pendente` com `tarefas: []` enquanto o
codigo rodava em producao. O elo requisito<->tarefa e' escrito pelo script no `finalizar`,
nunca a mao, entao sem tarefa nao havia o que vincular.

**Localizacao por evidencia, nao por memoria.** A hipotese do humano era que o recurso
tivesse entrado no "mutirao de UI" (TASK-RF-038). Nao entrou: aquela tarefa declara
`requisitos: ["RF-53"]`, seu registro nunca menciona "ignorar", e seu commit (`3fe3b83`)
nao toca em `builder` nem em `markerColors`. `git log -S "IGNORE_POINT"` e
`git log -S "IGNORED_MARKER_COLOR"` apontam os dois para o mesmo commit `1626097` (e para
`50db557`, o merge do PR #26 que levou o mesmo conteudo para a main).

**Atestado dos quatro criterios contra codigo e teste existentes:**

| Criterio | Implementacao | Teste |
|---|---|---|
| Alternar ativo/ignorado no painel | `IGNORE_POINT`/`UNIGNORE_POINT` (builder.ts:80-81), toggle em MapPage.tsx:529 | `builder.test.ts` (2 testes) + `RoteiroPointSection.test.tsx` (botao Ignorar/Restaurar) |
| Nao contam para conclusao nem distancia | `remainingCounts`/`isComplete`, `plannedRouteStatus` | `builder.test.ts` + `overview.test.ts` (100% com ignorados) |
| Agrupados ao final, restaurar e localizar | `overviewIgnoredItems` (MapPage.tsx:1160) | `RoteiroOverviewSection.test.tsx` |
| Marcador diferenciado no mapa | `IGNORED_MARKER_COLOR` (roteiroModels.ts:216) | **nao existia — criado aqui** |

**A lacuna encontrada foi real:** a cor do marcador ignorado era aplicada e nao era travada
por teste nenhum. Tres das quatro regras do requisito tinham rede; a quarta nao. Foi o
unico arquivo tocado.

**Como o vermelho foi substituido, ja que TDD nao se aplica a codigo ja entregue:** rodei
uma checagem de mutacao. Quebrei a implementacao de proposito (removi o ramo
`isIgnored ? IGNORED_MARKER_COLOR : ...`), confirmei que o teste novo FALHA, e restaurei.
Nao e' o vermelho do TDD — e' a prova de que o teste detecta o defeito que promete
detectar, que e' o que o vermelho existe para garantir (nucleo §7: "gate que existe e nao
checa nada").

## O que nao foi feito, e por que

**Nao mudei nenhum arquivo de producao.** O comportamento ja esta entregue e validado em
uso; reimplementar seria risco sem ganho.

**Nao marquei `RF-55` como implementado a mao.** Esse campo e' do script (`finalizar`
grava `status` e `implementado_em` quando a tarefa e' do tipo RF e declara o requisito).
Digitar ali seria exatamente o que o nucleo §3 proibe.

**Nao consegui finalizar pelo comando, e nao forcei.** Ver abaixo.

## Testes de descoberta

**O pacote nao tem caminho honesto para tarefa retroativa, e isso e' um achado.**
`qualidade.metodo_de_teste` e' `tdd`, e `finalizar` (cmd-tarefa.ts:299) exige
`gates.testes.vermelho_em` preenchido para qualquer tipo que nao seja SPIKE. Mas o codigo
do RF-55 ja existe e passa, entao:

- `task gate ... --esperando-vermelho` se RECUSA a registrar ("Esperava vermelho e saiu
  verde") — a ferramenta se defende de evidencia forjada, e faz bem;
- rotulo escrito a mao nao resolve: `APROVADO` esta em `ROTULOS_DE_EXECUCAO` e nao pode ser
  digitado, e `NAO EXECUTADO` deixa `vermelho_em` nulo, que e' justamente o que trava;
- omitir o gate tambem trava (todo gate declarado precisa estar no registro).

Ou seja: **reconciliar catalogo com codigo ja entregue e' incompativel com TDD por
construcao neste pacote.** Isso nao e' defeito do projeto, e' lacuna do metodo: TDD
descreve quando o teste NASCE, e aqui o codigo nasceu antes por decisao de outra sessao.
A tarefa fica em execucao ate o humano decidir o destino.

## Aprendizados

**Funcionalidade sem requisito nao aparece como buraco — aparece como nada.** O RF-55 so'
foi notado porque o `contexto.json` apontou `requisitos_pendentes` e alguem foi conferir. O
commit sem ID de tarefa e' o ponto exato onde a rastreabilidade se perde: sem ID, nem o
script nem a auditoria conseguem ligar codigo a requisito depois.

**Cobertura parcial de requisito e' pior que ausencia, porque parece completa.** Tres de
quatro criterios testados dao a sensacao de "esta coberto". A unica forma de achar a
quarta foi ler o requisito criterio a criterio e procurar o teste de CADA um — que e'
exatamente o que o processo manda fazer no fechamento e que ninguem tinha feito aqui.

**Checagem de mutacao e' o substituto honesto do vermelho quando o codigo ja existe.** Nao
prova a ordem (teste antes do codigo), mas prova o que importa: que o teste falha quando a
regra e' violada. Vale registrar como pratica para qualquer tarefa retroativa futura.

**Varredura da lista fechada do nucleo §6:** nada novo. O achado desta tarefa (TDD x
tarefa retroativa) e' sobre o PACOTE, nao sobre o produto, e vai para
`melhorias-do-pacote.md`.
