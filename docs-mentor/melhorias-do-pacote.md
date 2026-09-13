# Melhorias do pacote, vistas daqui

> Anotado por `mentor anotar --sobre pacote`. **Nao vira tarefa deste projeto.**
> Entra no relatorio de campo, e o trabalho acontece no repositorio do `mentor-agent`.
>
> As secoes datadas abaixo nasceram em `.mentor/melhorias-do-pacote.md`, escritas a mao antes
> de o comando existir. Movidas para ca em 02/09/26: arquivo acrescentado dentro de `.mentor/`
> conta como divergencia do pacote no `verificar`.

## Versão 0.4.0 do mentor aplicou melhorias sugeridas por este arquivo, anotar somente novas descobertas a partir de 11/09/26 23:00.

---

## 12/09/26 — O mentor audita a forma e nunca o conteúdo

### O caso

Três spikes consecutivos (SPIKE-001, 002, 003) sobre auto-roteirização foram planejados,
aprovados, executados e fechados sem que nenhum plano citasse uma única vez o nome canônico
do problema que estavam resolvendo — **TSP / VRP** — nem as implementações consolidadas que
existem para ele há décadas (OR-Tools, VROOM, jsprit, Timefold, todas gratuitas e de código aberto).

O motor construído do zero tem fase de construção (guloso) e nenhuma fase de melhoria.
Não há 2-opt, Or-opt, nem metaheurística. O SPIKE-003 substituiu a busca local por multistart
sobre o ponto inicial, gastando 132,1 s / 230,5 s por caso para resultados de +0,6% a +20,4%
contra a referência humana. Um solver padrão resolve a mesma instância em menos de um segundo.
O próprio risco nº 1 da tarefa registra que a estratégia "não prova ótimo global de TSP".

O mentor acompanhou os três spikes, aprovou os três planos, registrou gates, achados e recusas,
e nunca disse ao mantenedor que existia a alternativa. O mantenedor só descobriu por fora,
depois de gastar tempo, tokens e dinheiro.

### A prova empírica de que o problema é sistêmico

`tarefas/recusas.jsonl` tem 11 recusas registradas. **Todas as 11 são procedimentais:**

| Tipo de recusa | Ocorrências |
|---|--:|
| Gate TDD sem vermelho antes do verde | 6 |
| Gate declarado ausente do registro | 1 |
| Origem aponta para registro inexistente | 2 |
| Arquivo modificado fora do `plano.muda` | 1 |
| Marcador `PREENCHER:` não preenchido | 1 |
| **Recusa por mérito técnico do plano** | **0** |

O mentor é rigoroso, funciona e recusa bem — mas só sabe recusar **forma**. Ele garante que
o mantenedor faça corretamente a coisa que decidiu fazer. Ele não tem nenhum mecanismo para
perguntar se era a coisa certa a fazer. Um plano tecnicamente equivocado com gates verdes
passa; um plano tecnicamente correto sem vermelho registrado é recusado.

### O diagnóstico de processo

1. **Restrição fundadora tratada como lei eterna.** A frase "sem backend e sem API de roteirização
   paga", escrita no `package.json` no início do projeto, apagou as camadas de matriz de custo e
   de solver do cardápio de três spikes seguidos. Nenhum plano justificou a restrição, mediu seu
   custo ou a reapresentou como decisão. Documento antigo virou contexto autoritativo.

2. **A ausência de alternativa não é detectável pelos gates.** Tipos, lint, testes e build medem
   se o que foi construído está bem construído. Nenhum deles mede se havia algo pronto.

3. **O planejamento por fatias esconde o erro de composição.** Cada tarefa isolada foi respondida
   corretamente. O erro está na soma — o épico inteiro aponta para o lugar errado — e não existe
   cerimônia que avalie o épico como um todo depois de fatiado.

4. **Spike sem régua só pode devolver "inconclusivo".** Os três spikes tinham referência humana,
   mas nenhum tinha referência algorítmica: nem piso (busca local), nem teto (ótimo calculado por
   força bruta em instância pequena), nem padrão da indústria. "Inconclusivo" virou o resultado
   estrutural, não um achado.

5. **Achado que refuta a premissa não bloqueia nada.** O SPIKE-001 mediu que o custo de conversão
   — a hipótese que dá nome ao épico — explicava cerca de 9 dos 56 pontos de ganho; os outros 47
   vinham de âncoras por cobertura. O spike destravou `TASK-RF-029 — Auto-roteirização por menor
   número de conversões` mesmo assim.

6. **Falta o ato de discordar.** Não existe, em nenhum template, um campo onde o mentor seja
   obrigado a escrever o que faria diferente. Sem o campo, o ato não acontece.

---

### Melhorias propostas ao pacote

#### M1 · Gate de estado da arte (bloqueia aprovação do plano)

Disparo: o plano constrói motor, algoritmo, heurística, parser, protocolo ou formato próprio;
ou o esforço IA é `G`/`XG`.

Seção obrigatória **"Como o mundo resolve isso"**, com quatro itens:

- **Nome canônico do problema** na literatura.
- **Duas a quatro implementações consolidadas**, com licença e custo real.
- **Por que cada uma foi descartada** — uma linha por item, específica ao projeto.
- **O que ainda restaria construir** depois de adotar a melhor delas.

Recusa nova: `plano constroi motor sem secao estado-da-arte`.

Um plano que diz "descartei OR-Tools porque exige backend e o produto é offline" está aprovado.
Um plano que não menciona OR-Tools está recusado. A diferença é o mantenedor **saber** o que
está abrindo mão.

#### M2 · Campo `problema_canonico` no plano

Obrigatório, não aceita vazio. Se o problema tem nome na literatura — TSP, VRP, CRDT, consenso,
rate limiting, parsing LR, sincronização offline-first — o plano escreve o nome. Nome implica
literatura, implica biblioteca, implica benchmark público.

Valor `"sem nome canonico"` é permitido, mas é uma declaração explícita e fica registrada.

#### M3 · Restrição fundadora tem prazo de validade

Restrições herdadas de documento anterior (`README`, `package.json`, ADR antiga, contexto)
não são permanentes. Quando um plano colide com uma, o mentor:

1. Nomeia a restrição e onde ela foi escrita.
2. Declara o que ela está eliminando **nesta** tarefa.
3. Exige reconfirmação explícita do mantenedor antes de aprovar.

Uma restrição reconfirmada três vezes seguidas vira ADR, para parar de custar cerimônia.

#### M4 · Spike de medição exige três réguas

Nenhum spike cujo critério de aceite contenha "melhora", "ganho", "otimiza" ou "reduz"
pode ser aprovado sem declarar:

| Régua | O que é |
|---|---|
| **Piso** | O baseline trivial que o resultado tem obrigação de bater. |
| **Teto** | Ótimo calculado, ou a melhor referência externa disponível. |
| **Padrão** | O que a solução consolidada da indústria entrega na mesma instância. |

Sem as três, o spike não é aprovado. "Inconclusivo por falta de régua" passa a ser classificado
como **defeito de planejamento**, não como resposta válida de spike.

#### M5 · Achado que refuta a premissa bloqueia a tarefa dependente

Se um achado de classe 3 ou 4 contradiz a hipótese que originou a tarefa, as tarefas em
`tarefas_geradas` e as que dependem dela entram em estado `replanejar` em vez de `aberta`.
O mentor pergunta ao mantenedor se a origem continua de pé antes de deixar a fila andar.

#### M6 · Reincidência de inconclusivo abre revisão de estratégia

Dois spikes consecutivos fechados como inconclusivo no mesmo tema: o terceiro não pode ser
outro spike da mesma família. O mentor abre obrigatoriamente uma revisão de estratégia —
uma cerimônia curta que pergunta apenas "o problema está bem colocado?" e cujo resultado
pode ser abandonar o caminho.

#### M7 · Campo `discordancia` obrigatório em todo plano

O mecanismo mais barato desta lista e provavelmente o de maior retorno.

Todo plano ganha uma seção que não aceita vazio:

> **O que eu faria diferente:** …
> **O que me preocupa neste plano:** …
> **O que existe pronto que faz 80% disso:** …

`"Nada a objetar"` é resposta válida — mas tem que ser digitada. Forçar a existência do campo
força o ato de procurar a objeção. Um modelo que precisa preencher "o que existe pronto que
faz 80% disso" vai escrever "OR-Tools". O mesmo modelo, sem o campo, implementa o que foi pedido
e não diz nada. A informação estava lá nas duas vezes; só uma delas a solicitou.

#### M8 · Custo de oportunidade em plano `G`/`XG`

Campo `custo_de_oportunidade`: o que existe pronto, quanto custa em dinheiro, em backend,
em dependência nova, e quantas semanas de construção substitui. O mentor não decide — expõe
o número e deixa a decisão com o mantenedor.

---

### Personalidade: o dever de contrariar

O pacote precisa de uma persona explícita, porque hoje o comportamento padrão do modelo
— cooperar com o enquadramento recebido — é exatamente o que falhou aqui.

Texto sugerido para as instruções do agente:

> Você é um mentor, não um executor. Seu valor não está em fazer bem o que foi pedido:
> está em dizer o que o mantenedor não sabe que precisa saber.
>
> **Você tem obrigação de contrariar sem ser perguntado.** O mantenedor é estudante e sabe
> disso; ele te contratou justamente para não precisar descobrir as coisas errando. Se você
> conhece uma alternativa consolidada ao que ele pediu, dizer isso não é insubordinação — é
> o trabalho. Silêncio sobre uma alternativa melhor é uma falha equivalente a um gate vermelho
> ignorado.
>
> Antes de aprovar qualquer plano, responda para si mesmo: *este problema tem nome? existe
> biblioteca para ele? por que não estamos usando?* Se a resposta à última for "ninguém perguntou",
> você falhou.
>
> Discorde na hora do planejamento, não depois da execução. Uma objeção levantada antes do
> plano custa uma frase; a mesma objeção depois de três spikes custa semanas.
>
> Nunca trate uma decisão documentada como decisão encerrada. README, `package.json` e ADRs
> antigas registram o que alguém pensou um dia, não o que continua verdade.
>
> Quando discordar, discorde uma vez, com clareza, com o custo estimado, e então execute a
> decisão do mantenedor sem ressentimento. Ele decide. Mas ele decide **informado**.

---

### Resumo para o relatório de campo

O `mentor-agent` v0.4.0 é sólido em execução e cego em estratégia. As recusas provam:
11 de 11 são procedimentais. A correção não exige um modelo melhor — exige **campos obrigatórios
que forcem o ato de procurar a alternativa**. M7 sozinho (`discordancia`) provavelmente teria
evitado os três spikes descritos acima.

- **12/09/26 21:38** · Falta uma via intermediaria entre tarefa em execucao e tarefa fechada. O limite de 1 tarefa em-execucao nao tem valvula de escape: task guardar recusa explicitamente tarefas em-execucao (cmd-fila.ts linha 115), e nao existe task reabrir - EstadoTarefa (tipos.ts linha 29) e um enum fechado sem transicao de volta a partir de concluida. Caso real neste projeto: TASK-SPIKE-003 e uma investigacao multi-dia com erros documentados ainda sem causa comprovada; precisou continuar pausada exatamente como estava porque um bug regredido por conflito de merge e uma tarefa RF urgente nao podiam ser iniciados (o limite bloqueia acima de 1) e a spike nao podia ser guardada sem forcar finalizar, que e via de mao unica e perderia a chance de retomar a mesma investigacao depois. Falta um estado pausada, ou uma flag de seguranca em guardar, que preserve o progresso, libere o slot do limite de em-execucao, e seja retomavel sem precisar abrir uma tarefa nova so para continuar a mesma investigacao.
