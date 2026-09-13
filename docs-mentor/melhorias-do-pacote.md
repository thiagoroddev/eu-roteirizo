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

- **13/09/26 02:47** · Quando o teste automatizado nao basta para validar um criterio (depende de tela, de dado real, de servico ao vivo, ou cobre a palavra isolada e nao a combinacao), o agente deve propor e construir, dentro da propria tarefa, um meio de o humano testar todos os casos rapido: roteiro ou fixture ficticio gerado por script a partir da mesma tabela de casos dos testes, prototipo ou algoritmo de apoio, com o esperado visivel ao lado do resultado. O teste em codigo e o que da garantia; se o que existe nao e suficiente, crie o que seja. Dispensar a validacao manual, ou pedir 'valide no app' sem esse meio, transfere ao humano uma caca ao tesouro por endereco real. Caso de origem: TASK-BG-017 testou 9 palavras isoladas, dispensou a validacao e deixou passar 'Edificio Central, sala 302' saindo residencial (AUD-002-B01/R05); rodar o classificador sobre uma tabela de casos ficticios expos a regressao na hora, e a TASK-BG-021 transformou a tabela em testes e num roteiro importavel.

- **13/09/26 03:30** · Tarefa retroativa fica sem estado 'antes' e sem evidencia do criterio (AUD-002-B02). Na TASK-CHORE-016 a atualizacao do pacote foi feita antes de a tarefa existir: o commit_base ja continha a mudanca, o unico criterio ('doctor roda sem bloqueio') ficou como 'nao se aplica' sem saida gravada, e a trava de escopo do finalizar rodou sobre diff vazio. Sugestoes: (1) task iniciar avisar quando a arvore ja tem mudanca nao commitada, ou quando o commit_base ja toca arquivos que o plano declara; (2) criterio verificado por comando, mas nao automatizado, ter um jeito de gravar a saida como evidencia, igual a um gate; (3) atualizar o proprio pacote nascer como tarefa antes do npm i, com o doctor gravado depois.

- **13/09/26 03:30** · Validacao manual aprova sem evidencia (AUD-002-B03; o mesmo codigo segue na v0.6.0). 'task validar --aprovado' aceita ficar sem --evidencia e grava a frase padrao 'Validado e aprovado pelo humano.' com codigo_saida 0 sintetico (comando null); 'finalizar --validado-por-humano' aprova e fecha no mesmo comando; e o fato mecanico do auditar declara 'Regra 4 atendida' so porque validacao === 'aprovado'. Sugestoes: exigir --evidencia com o minimo que torna a afirmacao conferivel (o que abriu, passos, esperado x visto, quando; artefato opcional em --url); gravar codigo_saida null em validacao humana; o auditar escrever 'revisao humana declarada: <texto>' em vez de 'atendida'. E pedir a evidencia no momento da validacao: cobrada depois, o humano so consegue dar palavra afirmativa (observacao do humano).

- **13/09/26 03:30** · Parser de plano.muda cortava o caminho no primeiro hifen, em cmd-tarefa.ts (trava de escopo do finalizar) e em cmd-auditar.ts (fato de arquivos fora do plano). Com isso __utilidades-back-office__/..., package-lock.json e cmd-tarefa.ts eram acusados de fantasma mesmo declarados, e a TASK-BG-021 nao fechava (AUD-002-R09). Corrigido localmente na TASK-BG-021: o caminho vai ate o primeiro espaco, sem pontuacao final. O verificar acusa divergencia ate o pacote trazer a mesma correcao. Continua faltando: glob (.mentor/*) e linha com mais de um arquivo ('a / b', 'a.ts, b.ts') so declaram o primeiro.

- **13/09/26 03:49** · Evidencia de gate sem amarra com a versao entregue (AUD-002-R06). Os gates da TASK-BG-018 rodaram no ramo spike-003, com mentor v0.6.0 e testes de back-office diferentes (946 testes), mas a entrega foi para a main (938 esperados). O registro nao guarda em que arvore os gates rodaram nem o link do CI. Sugestao: task gate gravar o hash da arvore em que rodou; o finalizar avisar quando a arvore atual difere da dos gates; e aceitar o link do run do CI em evidencia_url como alternativa.

- **13/09/26 03:49** · Atualizacao do pacote muda lei sem o humano ver (AUD-002-R08). O v0.5.0 alterou nucleo.md, processos/tarefa.md e as travas do finalizar, e a TASK-CHORE-016 registrou 'riscos: nenhum, operacao mecanica'. A lei nova tambem fala em categorias (UI, persistencia, calculo, spike) que o codigo nao distingue: so olha gates.validacao_manual.existe. Sugestao: instalar --forcar mostrar o que muda em nucleo.md e processos/ e pedir confirmacao antes de aplicar; e lei sem mecanismo por categoria nao entrar no nucleo, como o cabecalho do proprio nucleo exige.

- **13/09/26 04:22** · resolver-gerados perde decisao registrada por script que so um lado mudou. No merge do main (com a auditoria AUD-002 registrada) no ramo do upgrade v0.6.0, a fusao semantica do contexto.json devolveu o bloco auditoria do lado do ramo (ultima_em 12/09/26 01:41, ultima_na_tarefa 22) e descartou o do main (13/09/26 01:02, tarefa 25): commitado assim, a auditoria pareceria atrasada de novo. Tambem trouxe lembretes velhos do doctor. Contorno: partir do contexto.json do main e rodar gerar. Sugestao: na fusao, campos gravados por comando (auditoria, riscos, dividas) seguem a regra de 3 vias por campo, e lembretes sao sempre regenerados, nunca fundidos. Inconsistencia vizinha: o hook de pre-push trata .mentor/ como nao-codigo, mas o finalizar exige declarar no plano.muda cada arquivo do pacote numa atualizacao do proprio mentor.
