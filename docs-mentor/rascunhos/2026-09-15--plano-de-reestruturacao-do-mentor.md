# Plano Consolidado de Reestruturação do Mentor-Agent (V4 · Shift-Left & Fast-Track)

> **Status:** Documento Oficial de Planejamento e Síntese de Reestruturação.
> **Origem:** Integração analítica entre as medições de campo (`AUD-003`, `AUD-004`, `TASK-CHORE-025/026/027`), os gargalos de custo/tokens avaliados em tarefas reais, o resgate das salvaguardas estruturais inegociáveis e os novos textos normativos completos.
> **Objetivo:** Eliminar burocracia inútil e reexecuções redundantes, preservando integralmente os mecanismos determinísticos contra alucinação, loops de contexto e quebras de concorrência.

---

## 1. Diagnóstico e Lições Aprendidas

### 1.1. O que tornou o modelo anterior excessivamente caro
A análise prática sobre hotfixes mecânicos (como a correção de 13 linhas no `cmd-merge.ts`) demonstrou que o custo desproporcional decorreu de:
- **Hipercerimônia para correções mecânicas:** Exigência de ritos Standard completos para ajustes triviais, fragmentando a autorização em múltiplos passos.
- **Execução fracionada de gates:** 4 a 5 invocações manuais de `task gate <ID> <gate>`, cada uma iniciando o Node e disparando testes completos.
- **Redundância massiva no pre-push:** Repetição integral dos 998 testes e do build no hook de push segundos após a aprovação dos gates locais.
- **Sinal degradado no `verificar`:** Falsos positivos de divergência local deixavam o comando perpetuamente vermelho (`REPROVADO`).
- **Megadossiês de lote retrospectivos:** O `auditar preparar` gerava relatórios de até 160.000 caracteres analisando tarefas de dias atrás já mescladas no `main`, consumindo cotas de tokens sem gerar valor acionável.

### 1.2. O perigo da simplificação ingênua (O que NÃO pode ser cortado)
A tentativa de enxugar o Mentor cortando texto puro acabou removendo engrenagens cruciais construídas em meses de depuração. **Estas salvaguardas foram resgatadas e são inegociáveis:**
1. **O Roteador de Contexto (§9 de `nucleo.md`):** Tabela estrita que dita à IA quando carregar cada processo sob demanda, impedindo estouro de contexto na inicialização.
2. **Travas contra Inundação de Contexto:** Limite estrito de fila ativa (`ciclo ≤ 12 tarefas ou 2.400 caracteres`), backlog com tarefas nascendo na reserva, e **WIP único (`em_execucao: 1`)**.
3. **Pausa e Retomada (`task pausar` / `task retomar`):** Permite subir trabalho em progresso para `wip/<ID>` sem quebrar CI nem contaminar a `main`.
4. **Vínculo Obrigatório com Requisitos:** Tarefas RF, RN e RNF são impedidas mecanicamente de nascer sem `--requisitos <ID>`.
5. **Travas Mecânicas no Fechamento (`task finalizar`):**
   - Validação de escopo estrito em `plano.muda` (com suporte a globs `*` e `**`).
   - Detecção de tarefa retroativa (`--retroativa`).
   - Dispensa de validação manual em tarefas sensíveis exigindo `--motivo` ≥ 30 caracteres.
   - Cálculo determinístico de `arvore_hash` (ignorando `docs-mentor/` e incluindo arquivos não rastreados).
6. **Mérito Técnico Estruturado no Portão 1:** `problema_canonico`, `discordancia` com 3 campos, estado da arte para esforço G/XG e ADR na 3ª reconfirmação de restrição fundadora.
7. **Concorrência e Git sem Falso Conflito:** PRs de planejamento (`plan/` com `(plano)`), exclusão de dados voláteis em `contexto.json` e exceções para marcadores `PREENCHER:` em documentação.

---

## 2. Mapa Estrutural do Mentor-Agent V4

```
.mentor/
├── guia/                   [PRESERVADO 100%]  13 manuais (00 a 13) como base de consulta sob demanda
├── skills/                 [PRESERVADO 100%]  7 skills nativas (github-ci, ui-design, etc.)
├── modelos/                [PRESERVADO 100%]  fichas.md, listas-por-fase.md, varredura.md
├── esquemas/               [AJUSTAR]          tarefa.json (suporte a Fast-Track e gates atômicos)
├── nucleo.md               [SUBSTITUIR]       Nova lei: Fast-Track, Shift-Left e Roteador Completo
├── processos/
│   ├── tarefa.md           [SUBSTITUIR]       Roteiro bifurcado (Fast-Track vs Standard) + Travas do finalizar
│   ├── entrega.md          [SUBSTITUIR]       Pre-push inteligente (cache por arvore_hash e bypass de docs)
│   ├── revisao.md          [SUBSTITUIR]       Micro-auditoria por tarefa (5 classes duras de reprovação)
│   ├── inicializacao.md    [PRESERVADO]
│   ├── rascunho.md         [PRESERVADO]
│   └── laboratorio.md      [PRESERVADO]
└── scripts/
    ├── cmd-gates.ts        [MODIFICAR]        Comando atômico `mentor task gates <ID>`
    ├── cmd-hooks.ts        [MODIFICAR]        Hook pre-push com cache de arvore_hash e bypass documental
    ├── cmd-verificar.ts    [MODIFICAR]        Respeitar patches de melhorias-do-pacote.md (status 0 / verde)
    ├── cmd-doctor.ts       [MODIFICAR]        Eliminar gravação de lembretes no contexto.json
    ├── vistas.ts           [MODIFICAR]        Eliminar _meta.atualizado_em e contagens voláteis do git
    ├── cmd-merge.ts        [CONSOLIDAR]       Precedência de escopos (plano/light) e allowlist ampla
    └── cmd-auditar.ts      [DESATIVAR]        Desativar cadência em lote retrospectivo
```

---

## 3. Especificação Técnica Cirúrgica dos Scripts

### 3.1. `cmd-gates.ts`: Comando Atômico `mentor task gates <ID>`
- **Comando:** `node mentor.mjs task gates <ID>`
- **Comportamento:**
  1. Executa ordenadamente e em subprocesso único os gates declarados no projeto: `tipos` (`tsc -b`), `lint` (`eslint .`), `testes` (`vitest run`) e `build` (`tsc -b && vite build`).
  2. Ao término bem-sucedido de toda a cadeia, calcula o `arvore_hash` do código de produção/testes (`git write-tree` excluindo `docs-mentor/` e respeitando arquivos não rastreados).
  3. Grava de uma só vez no JSON da tarefa os 4 registros com `rotulo: "APROVADO"`, comandos, saídas resumidas, timestamp e `arvore_hash`.
  4. Se qualquer etapa falhar, interrompe imediatamente a cadeia, grava a evidência do gate reprovado e encerra com código `1`.

### 3.2. `cmd-hooks.ts`: Pre-Push Inteligente com Cache Determinístico
- **Bypass puramente documental:** Se `git diff origin/main..HEAD --name-only` contiver apenas arquivos `.md` ou arquivos dentro de `docs-mentor/` (sem alteração de código ou scripts), libera o push imediatamente.
- **Cache por `arvore_hash`:**
  - Extrai o `arvore_hash` atual da árvore de código.
  - Verifica se a tarefa ativa ou o commit corrente possui gates aprovados com o mesmo `arvore_hash`.
  - Em caso positivo, exibe `✓ Gates já verificados e aprovados para a árvore de código atual. Pulando reexecução.` e libera o push sem rodar suíte pesada.
- **Bypass para WIP:** Mantém envio livre e sem validações para referências `refs/heads/wip/*`.
- **Modo Informativo no Verificar:** O pre-push roda o `verificar` e imprime o resultado na tela, mas **não bloqueia o push localmente** (a barreira de merge é a esteira de CI).

### 3.3. `cmd-verificar.ts`: Tolerância Oficial a Patches Locais
- Lê a seção `## Corrigidas aqui` em `docs-mentor/melhorias-do-pacote.md`.
- Extrai os caminhos em `**Arquivos:**`.
- Ao comparar o `.mentor/` local com o manifesto de instalação:
  - Arquivos modificados que constarem documentados na seção são emitidos como `[AVISO] Patch local documentado em melhorias-do-pacote.md` e **não somam como achado reprovador**.
  - Somente arquivos divergentes do manifesto **sem documentação** geram reprovação (`exit code 1`).
  - Se todas as divergências forem documentadas e não houver links quebrados nem marcadores inválidos, retorna `exit code 0` (APROVADO).

### 3.4. `vistas.ts` e `cmd-doctor.ts`: Estabilização do `contexto.json`
- `vistas.ts` (`atualizarContagens`): Grava `_meta.atualizado_em = null` e não atualiza timestamps voláteis.
- `cmd-doctor.ts`: Exibe os lembretes do projeto na saída do console, mas grava `lembretes: []` no `contexto.json`, impedindo conflitos constantes de merge entre branches concorrentes.

### 3.5. `cmd-auditar.ts`: Desativação da Cadência Retrospectiva
- Extinguir o bloqueio do `doctor` que exigia rodar `auditar preparar` de 10 em 10 tarefas.
- Assegurar que tarefas concluídas não sejam marcadas como "fora de lote" ou pendentes de auditoria retrospectiva.

---

## 4. Textos Normativos Completos (Prontos para Aplicação)

### 4.1. `.mentor/nucleo.md`
```markdown
# Núcleo · Leis do Mentor Agent

Tudo aqui é lei: verificável e caro de desfazer. O que não está aqui é orientação e vive em guia/. Lei sem mecanismo de verificação não entra.

## 1 · Hierarquia e Autoridade

docs-mentor/contexto.json → nucleo.md → processos/ → guia/

O contexto do projeto vence, exceto nestas quatro regras inegociáveis:
1. Confirmação antes de ato destrutivo: deletar, sobrescrever, reestruturar.
2. Gate declarado sem evidência equivale a NÃO EXECUTADO e não sustenta conclusão.
3. Código é a verdade primária: nunca documentar o que contradiz o código.
4. Nenhum fechamento, commit ou publicação sem autorização explícita por ato.

## 2 · Princípios Operacionais

1. **Artesão, não autocompletador:** Compreenda o propósito e a arquitetura antes do código.
2. **Cerimônia proporcional ao risco:** Modos Light, Fast-Track, Standard e Strict.
3. **Se dá para gerar, gere:** Datas, horas, IDs, links e contagens são gerados por script, nunca digitados pela IA.
4. **O dever de contrariar (Portão 1):** Aponte alternativas consolidadas, custo de oportunidade e mérito técnico antes de codificar. Discorde uma vez de forma clara; após decisão do humano, execute sem ressentimento.
5. **Evidência viva com custo controlado:** A verificação mecânica substitui burocracia textual. Teste executado vale mais que narrativa descritiva.
6. **Código entregue está encerrado:** Fim de auditorias em lote pós-merge. A validação de critérios é pré-merge (Shift-Left).

## 3 · Cerimônia Proporcional

| Modo | Quando Usar | Cerimônia Exigida |
| :--- | :--- | :--- |
| **Light** | Typo, formatação, docs isolados, ajuste de script do mentor | Sem tarefa formal. Commit: `<tipo>(light): <descrição>` |
| **Fast-Track** | Correções pontuais e hotfixes mecânicos (≤ 15 linhas) | Tarefa formal sintética, teste focal e comando atômico de gates |
| **Standard** | Funcionalidades, bugs complexos, refatorações amplas | Ciclo completo: planejamento, discordância, TDD, gates e narrativa |
| **Strict** | Decisões arquiteturais de infraestrutura ou troca de stack | Standard + ADR formal em `docs-mentor/arquitetura/ADR/` |

## 4 · Commits, Branches e WIP

- **Título do commit:** `<tipo>(<ID>): <descrição>`, `<tipo>(light): <descrição>` ou `<tipo>(plano): <descrição>`.
- Uma tarefa por branch de trabalho. O nome do ramo deriva exclusivamente do ID (ex: `task/rf-014`).
- WIP pode subir apenas para branches temporárias `wip/<ID>`. O hook pre-push ignora checagem de gates para `wip/*`.
- O pre-push valida integridade. Se a árvore (`arvore_hash`) já foi atestada pelos gates da tarefa, a suíte de testes NÃO é repetida no push. Commits exclusivamente documentais bypassam a suíte pesada.

## 5 · Lista Fechada de Reprovação (5 Classes)

Achado de micro-auditoria pré-merge só pode bloquear fechamento se pertencer a uma destas 5 classes verificáveis:
1. Vulnerabilidade ou falha clara de segurança.
2. Corrupção ou perda irreversível de integridade de dados.
3. Degradação perceptível de desempenho com impacto no usuário.
4. Violação explícita de requisito funcional ou invariante de domínio.
5. Gate placebo (teste sem asserção ou comando simulado).

Questões de estilo, preferência de escrita ou sugestões estéticas NUNCA bloqueiam tarefa.

## 6 · Overrides Locais no Hospedeiro

Problemas no próprio `.mentor/` podem ser corrigidos localmente no projeto hospedeiro, desde que registrados na tabela "Corrigidas aqui" em `docs-mentor/melhorias-do-pacote.md` com teste correspondente em `docs-mentor/melhorias-do-pacote.test.ts`. O comando `verificar` reconhece essas entradas e emite aviso sem reprovar o veredito.

## 7 · Carregamento por Demanda

| Situação | Carregue |
| :--- | :--- |
| Tarefa Fast-Track, Standard ou Strict | `processos/tarefa.md` |
| Projeto novo, legado ou atualizar pacote | `processos/inicializacao.md` |
| Tocar ferramenta específica da stack | `docs-mentor/padroes-de-stack/<ferramenta>.md` (ou crie via `processos/padroes-de-stack.md`) |
| Decisão arquitetural relevante / ADR | `processos/analise-de-impacto.md` |
| Ideia nova, rascunho ou anotar melhoria | `processos/rascunho.md` |
| SPIKE ou experimento de laboratório | `processos/laboratorio.md` |
| Escrever ou ajustar teste | `processos/teste.md` |
| Publicar, mexer em ramo, esteira ou PR | `processos/entrega.md` |
| Revisar código da tarefa (Shift-Left) | `processos/revisao.md` |
| Diagramas, UI, API, CI, testes ou dados | `.mentor/skills/<skill>/SKILL.md` ou `docs-mentor/skills/` |
| Campo null no contexto | Arquivo correspondente do portão em `guia/00-indice.md` |
```

---

### 4.2. `.mentor/processos/tarefa.md`
```markdown
# Processo · Ciclo de Vida da Tarefa

`task nova` → aberta (reserva) → `task puxar` → ciclo → `task iniciar` → em execução (↔ `task pausar` / `task retomar`) → `task finalizar` → concluída

| Quem | Escreve |
| :--- | :--- |
| **Script** | ID, datas, arquivos, índices, vínculo de requisitos, contagens, backlog.md, reserva.md |
| **IA** | Título, problema canônico, discordância, plano, critérios, testes, narrativa, achados |
| **Humano** | As três autorizações (início, execução destrutiva e fechamento/push) |

## 1. Campos e Limites
- **Tipo:** RF · RN · RNF · BG · REF · DOC · CHORE · TEST · SPIKE
- **Valor:** crítico · importante · desejável
- **Urgência:** imediata · normal
- **Esforço Duplo:** Humano/IA (P · M · G · XG)
- **Limites:** `em_execucao = 1` | `ciclo = 12 tarefas ou 2.400 car` no backlog.md.
- **Rastreabilidade Obrigatória:** Tarefas RF, RN e RNF exigem `--requisitos <ID>` no `task nova`.

## 2. Fluxo Fast-Track (Hotfixes e Correções Mecânicas ≤ 15 Linhas)
1. `node mentor.mjs task nova --tipo <BG|CHORE> --titulo "..." --esforco P/P`
2. `node mentor.mjs task puxar <ID>` e `node mentor.mjs task iniciar <ID>`
3. **Diagnóstico mínimo:** declare em `plano.muda` o arquivo afetado.
4. **Teste focal:** crie ou ajuste o teste unitário cobrindo o problema.
5. **Correção:** altere o código de forma cirúrgica.
6. **Gates atômicos:** execute `node mentor.mjs task gates <ID>`.
7. **Fechamento:** `node mentor.mjs task finalizar <ID>` (narrativa sintética de 1 parágrafo).

## 3. Fluxo Standard (Funcionalidades, Bugs Complexos e Refatorações)
1. **Planejamento e Mérito Técnico (Portão 1):**
   - Nomeie o `problema_canonico` na literatura.
   - Preencha a seção `discordancia`: `o_que_faria_diferente`, `o_que_preocupa`, `o_que_existe_pronto_80_porcento`.
   - Para esforço G/XG: preencha `estado_da_arte` e `custo_de_oportunidade`.
   - Para SPIKE e G/XG: preencha `restricoes_reavaliadas`. (A 3ª reconfirmação da mesma restrição exige ADR).
   - Declare os caminhos exatos alterados em `plano.muda`.
2. **Desenvolvimento Orientado a Testes (TDD):**
   - Escreva o teste focal demonstrando a falha (vermelho) antes do código de produção.
   - Implemente o código estritamente necessário.
3. **Validação Manual (quando aplicável):**
   - Obrigatória para UI (telas, componentes, layouts, CSS/HTML), persistência/banco, fórmulas e spikes.
   - Registre: `node mentor.mjs task validar <ID> --aprovado --evidencia "passos e resultado observado"` (mínimo 10 car).
   - Dispensa em tarefas sensíveis exige `--motivo` com no mínimo 30 caracteres.
4. **Gates e Evidência:**
   - Execute a esteira via comando atômico: `node mentor.mjs task gates <ID>`.
   - Para suítes pesadas/E2E: execute fixtures rápidas e anexe a esteira remota via `mentor task anexar <ID> --url "<run>"`.
5. **Fechamento e Micro-Auditoria (Portão 2):**
   - Valide o `git diff` contra as 5 classes de reprovação do núcleo.
   - Escreva a narrativa técnica (teto de 10.000 car): decisões, o que não foi feito, armadilhas técnicas e aprendizados de testes manuais.
   - Encerre: `node mentor.mjs task finalizar <ID>`.

## 4. Travas Mecânicas no Fechamento (`finalizar`)
A CLI recusa o encerramento se:
1. Houver validação pendente ou gate `validacao_manual` como NÃO EXECUTADO sem motivo.
2. Arquivos de código foram alterados no Git fora do declarado em `plano.muda`.
3. Tarefa retroativa for detectada (código já commitado antes da tarefa), exceto com `--retroativa`.
4. Dispensa de validação em tarefa sensível tiver motivo inferior a 30 caracteres.
5. Arquivos de código mudaram após a execução dos gates (`arvore_hash` divergente).
6. Marcador `PREENCHER:` estiver presente no plano ou narrativa.
```

---

### 4.3. `.mentor/processos/entrega.md`
```markdown
# Processo · Entrega, Ramo e Hooks

## 1. Proteção de Ramo e Linha Principal
- A branch principal é protegida: nunca recebe push direto. Toda alteração entra via PR após esteira verde.
- O nome da branch de trabalho deriva exclusivamente do ID da tarefa: `task/rf-014`, `fix/bg-002`.
- Uma tarefa por branch de trabalho. (Exceção única: tarefas inseparáveis entregues no mesmo PR).
- PR de planejamento independente usa branch `plan/<data>-<tema>` e leva a marca `(plano)` na posição de escopo do título (ex: `docs(plano): novo fluxo`).

## 2. Trabalho em Progresso (WIP)
- Códigos em andamento podem subir para o remoto apenas sob o prefixo `wip/<ID>`:
  `git push -u origin HEAD:wip/<ID>`
- O hook pre-push permite o envio para `wip/*` sem rodar gates e sem checar ID de tarefa.
- O comando `node mentor.mjs pronto-para-merge --titulo "$TITULO"` bloqueia merge no principal se houver tarefa aberta.

## 3. Hook Pre-Push Inteligente
O script `.githooks/pre-push` intercepta o envio:
1. **Bypass Documental:** Commits contendo exclusivamente arquivos `.md` ou atualizações em `.mentor/` passam sem executar a suíte pesada de testes.
2. **Reaproveitamento de Evidência:** Se o hash da árvore de código (`arvore_hash`) for idêntico ao registrado pelo último `task gates <ID>` aprovado, o hook reutiliza o comprovante e NÃO roda os testes novamente.
3. **Execução sob Demanda:** Se o código foi modificado após o último gate registrado, roda a suíte antes de autorizar o envio.
4. **Verificar:** O pre-push exibe o diagnóstico do `verificar` em modo informativo, sem barrar o push (quem barra é a esteira de CI).
```

---

### 4.4. `.mentor/processos/revisao.md`
```markdown
# Processo · Revisão Técnica (Micro-Auditoria Shift-Left)

## 1. Princípio: Shift-Left Cirúrgico
- Fim da auditoria retrospectiva em lote: não há dossiês de 10 tarefas mescladas no passado.
- A revisão por IA ocorre estritamente antes do merge, no fechamento da tarefa (`task finalizar`).
- O auditor inspeciona apenas o `git diff` da branch de trabalho contra os critérios de aceite do plano.

## 2. As 5 Classes de Reprovação Duras
Achados só impedem o merge se comprovadamente causarem:
1. **Segurança:** Injeção, vazamento de credenciais, dependência vulnerável.
2. **Integridade de Dados:** Migração sem rollback, corrupção de estado ou persistência falha.
3. **Desempenho:** Operações bloqueantes síncronas na UI ou consultas N+1 graves.
4. **Requisitos:** Código que contradiz diretamente os critérios do plano ou invariantes do domínio.
5. **Gate Placebo:** Teste vazio, mock sem asserção ou validação ignorada.

Sugestões de estilo, estética ou preferências de nomenclatura são notas de rodapé e NUNCA bloqueiam entrega.
```

---

## 5. Roteiro Executivo de Implementação

Quando você autorizar a execução, as etapas seguirão a ordem determinística:

1. **Atualização Normativa:** Substituição direta do conteúdo em `.mentor/nucleo.md`, `.mentor/processos/tarefa.md`, `.mentor/processos/entrega.md` e `.mentor/processos/revisao.md`.
2. **Esquema `tarefa.json`:** Atualizar para garantir validação de tarefas Fast-Track e o formato atômico de evidências de gates.
3. **Scripts de CLI:**
   - Implementar `task gates <ID>` em `.mentor/scripts/cmd-gates.ts` e registrar no `cli.ts`.
   - Atualizar `.mentor/scripts/cmd-hooks.ts` com o cache por `arvore_hash` e bypass de arquivos `.md`.
   - Ajustar `.mentor/scripts/cmd-verificar.ts` para ler "Corrigidas aqui" e retornar status 0 para patches locais.
   - Ajustar `.mentor/scripts/cmd-doctor.ts` e `.mentor/scripts/vistas.ts` para estabilizar `contexto.json`.
   - Desativar no `.mentor/scripts/cmd-auditar.ts` a cobrança de lotes retrospectivos.
4. **Verificação Integral:** Executar `npm run typecheck`, `npm run lint`, `npm test` e `node mentor.mjs verificar` para assegurar que todo o sistema está verde e funcional.
