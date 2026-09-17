# Tutorial de Comandos do Mentor V5

Este guia prático e durável documenta todos os comandos da CLI do **Mentor V5** (`node mentor.mjs`), explicando **o que cada comando faz**, **quando utilizá-lo**, a **sintaxe exata** com parâmetros e opções, além de **exemplos práticos** para o dia a dia.

---

## Sumário

1. [Visão Geral e Filosofia do Mentor V5](#1-visão-geral-e-filosofia-do-mentor-v5)
2. [Comandos de Tarefas (Lifecycle e Execução)](#2-comandos-de-tarefas-lifecycle-e-execução)
   - [task nova](#task-nova)
   - [task puxar e task guardar](#task-puxar-e-task-guardar)
   - [task iniciar](#task-iniciar)
   - [task pausar e task retomar](#task-pausar-e-task-retomar)
   - [task gate e task gates](#task-gate-e-task-gates)
   - [task criterio](#task-criterio)
   - [task vincular-plano](#task-vincular-plano)
   - [task validar](#task-validar)
   - [task finalizar](#task-finalizar)
   - [task fatiar, cancelar e absorver](#task-fatiar-cancelar-e-absorver)
   - [task fila e task anexar](#task-fila-e-task-anexar)
3. [Comandos de Planejamento Portátil (Etapa 01)](#3-comandos-de-planejamento-portátil-etapa-01)
   - [plano registrar](#plano-registrar)
   - [plano importar](#plano-importar)
   - [planos](#planos)
4. [Executor de Gates e Cache Determinístico (Etapas 02 e 03)](#4-executor-de-gates-e-cache-determinístico-etapas-02-e-03)
   - [gates](#gates)
   - [task gates](#task-gates)
5. [Controle de Integridade e Patches (Etapa 05)](#5-controle-de-integridade-e-patches-etapa-05)
   - [verificar](#verificar)
   - [patch registrar](#patch-registrar)
   - [patch registrar-todos](#patch-registrar-todos)
   - [patch listar e patch verificar](#patch-listar-e-patch-verificar)
6. [Diagnóstico e Saúde do Repositório](#6-diagnóstico-e-saúde-do-repositório)
   - [doctor](#doctor)
7. [Hooks de Git e Integração Contínua (Etapa 04)](#7-hooks-de-git-e-integração-contínua-etapa-04)
   - [hooks instalar](#hooks-instalar)
   - [hooks pre-push](#hooks-pre-push)
   - [pronto-para-merge](#pronto-para-merge)
8. [Requisitos, Invariantes e Riscos](#8-requisitos-invariantes-e-riscos)
   - [req nova e req listar](#req-nova-e-req-listar)
   - [inv nova e inv listar](#inv-nova-e-inv-listar)
   - [ref nova e ref listar](#ref-nova-e-ref-listar)
   - [ra nova e ra encerrar](#ra-nova-e-ra-encerrar)
9. [Auditoria e Utilitários](#9-auditoria-e-utilitários)
   - [auditar](#auditar)
   - [stack](#stack)
   - [gerar e resolver-gerados](#gerar-e-resolver-gerados)
   - [anotar e relatorio-de-campo](#anotar-e-relatorio-de-campo)
10. [Fluxos de Trabalho Recomendados (Cheat Sheet)](#10-fluxos-de-trabalho-recomendados-cheat-sheet)

---

## 1. Visão Geral e Filosofia do Mentor V5

O Mentor V5 foi desenhado para eliminar **cerimônias excessivas**, **re-execuções redundantes de suítes de teste** e **inundações de contexto** para agentes de IA e desenvolvedores humanos.

### Princípios-Chave:
1. **WIP Limit = 1**: Apenas 1 tarefa em execução por vez. Se precisar alternar de contexto, use `task pausar` antes de iniciar outra.
2. **Standard Compacto**: Correções cirúrgicas, bugs locais e tarefas pontuais dispensam campos teatrais de mercado através do perfil `--perfil compacto` (ou `--compacto`).
3. **Plano Portátil**: O plano vive em seu próprio arquivo (`.md`). A tarefa mantém apenas a referência (`arquivo`, `sha256`, `secao`), evitando duplicação e explosão de contexto.
4. **Gates Unificados & Fail-Fast**: O executor de gates para no primeiro erro, grava evidências completas em `docs-mentor/.evidencias/logs/` e usa cache conservador baseado no hash da árvore Git (`git write-tree`).
5. **Pre-push Rápido**: O hook de pre-push checa primeiro condições baratas (exclusão remota, push para branch de rascunho `wip/`), roda gates apenas se o código mudou e nunca duplica testes se o cache estiver válido.
6. **Patches Locais Auditáveis**: Modificações feitas dentro de `.mentor/` são registradas em `docs-mentor/patches-do-pacote.json`, garantindo que `node mentor.mjs verificar` passe verde sem camuflar código.

---

## 2. Comandos de Tarefas (Lifecycle e Execução)

### `task nova`
Cria uma nova tarefa no backlog. Gera ID e data automaticamente via CLI (nunca digitados à mão).

- **Quando usar**: Sempre que for iniciar uma nova unidade de trabalho.
- **Sintaxe**:
  ```bash
  node mentor.mjs task nova --tipo <tipo> --titulo "<titulo>" --esforco <H|IA> --origem "<origem>" [opções]
  ```
- **Opções**:
  - `--tipo`: `feature`, `fix`, `chore`, `docs`, `refactor`, `spike`, `teste`, etc.
  - `--titulo`: Descrição curta e objetiva.
  - `--esforco`: `H` (humano) ou `IA` (agente autônomo).
  - `--origem`: De onde veio a demanda (ex: issue #12, solicitacao do usuario, etc.).
  - `--cerimonia`: `Standard` (padrão) ou `Refinada`.
  - `--perfil`: Use `--perfil compacto` (ou flag `--compacto`) para o modo **Standard Compacto** (dispensa hipótese de mercado, métrica, personas para correções cirúrgicas).
  - `--plano`: ID ou caminho de um plano portátil já registrado.
  - `--depende`: IDs de tarefas das quais esta depende (separados por vírgula).
  - `--requisitos`: IDs de RF/RN/RNF atendidos (separados por vírgula).
- **Exemplo**:
  ```bash
  node mentor.mjs task nova --tipo fix --titulo "Corrigir validacao de payload" --esforco IA --origem "Issue #42" --cerimonia Standard --perfil compacto
  ```

---

### `task puxar` e `task guardar`
Movimentam tarefas entre a **Reserva** (backlog frio que não consome tokens de contexto) e o **Ciclo** (backlog ativo do sprint).

- **Quando usar**:
  - `task puxar`: Quando a tarefa estiver pronta para ser trabalhada no ciclo atual.
  - `task guardar`: Quando uma tarefa do ciclo for despriorizada e devolvida para a reserva.
- **Sintaxe**:
  ```bash
  node mentor.mjs task puxar <ID_TAREFA>
  node mentor.mjs task guardar <ID_TAREFA>
  ```
- **Exemplo**:
  ```bash
  node mentor.mjs task puxar TASK-FIX-001
  ```

---

### `task iniciar`
Coloca a tarefa em execução ativa, escrevendo o esqueleto da narrativa e plano de execução.

- **Quando usar**: Imediatamente antes de começar a codificar a tarefa.
- **Regra**: Falha se já existir outra tarefa com status `em_andamento` (WIP = 1).
- **Sintaxe**:
  ```bash
  node mentor.mjs task iniciar <ID_TAREFA>
  ```
- **Exemplo**:
  ```bash
  node mentor.mjs task iniciar TASK-FIX-001
  ```

---

### `task pausar` e `task retomar`
Gerenciam alternância de contexto respeitando a trava de WIP limit = 1.

- **Quando usar**:
  - `task pausar`: Quando você precisa interromper o trabalho atual para resolver outra emergência ou aguardar aprovação.
  - `task retomar`: Quando for voltar a trabalhar na tarefa pausada.
- **Sintaxe**:
  ```bash
  node mentor.mjs task pausar <ID_TAREFA> --motivo "<motivo>" [--commit] [--bloqueada-por <IDs>]
  node mentor.mjs task retomar <ID_TAREFA> [--forcar] [--sem-merge]
  ```
- **Opções**:
  - `--commit`: Cria um commit de checkpoint WIP automaticamente se o workspace estiver sujo.
  - `--bloqueada-por`: Lista de tarefas bloqueantes.
  - `--sem-merge`: Retoma sem tentar sincronizar caso o ramo base não tenha mudado.
- **Exemplo**:
  ```bash
  node mentor.mjs task pausar TASK-FIX-001 --motivo "Aguardando definicao do backend"
  node mentor.mjs task retomar TASK-FIX-001
  ```

---

### `task gate` e `task gates`
Executa os gates de qualidade associados à tarefa.

- **Quando usar**:
  - `task gate`: Para rodar e registrar evidência de um gate específico (ex: `testes`, `tipos`, `lint`, `build`).
  - `task gates`: Para rodar **todos** os gates da tarefa em cadeia rápida (com fail-fast e cache).
- **Sintaxe**:
  ```bash
  node mentor.mjs task gate <ID_TAREFA> <nome_gate> [opções]
  node mentor.mjs task gates <ID_TAREFA> [--ignorar-cache]
  ```
- **Opções úteis de `task gate`**:
  - `--esperando-vermelho`: Registra a execução TDD antes da implementação (esperando falha vermelha controlada).
  - `--vermelho-dispensado --motivo "..."`: Dispensa o teste vermelho inicial com justificativa de mutação.
  - `--arquivo <path> [--codigo-saida <n>]`: Registra uma saída já capturada em arquivo externo.
- **Exemplo**:
  ```bash
  node mentor.mjs task gates TASK-FIX-001
  ```

---

### `task criterio`
Registra a evidência de conclusão de um critério de aceitação específico do plano da tarefa.

- **Quando usar**: Conforme cada critério do plano for sendo atendido.
- **Sintaxe**:
  ```bash
  node mentor.mjs task criterio <ID_TAREFA> <indice_criterio> --comando "<comando>"
  node mentor.mjs task criterio <ID_TAREFA> <indice_criterio> --saida "<texto_da_evidencia>"
  ```
- **Exemplo**:
  ```bash
  node mentor.mjs task criterio TASK-FIX-001 0 --comando "npm test -- tests/auth.test.ts"
  ```

---

### `task vincular-plano`
Vincula um documento de plano portátil existente à tarefa, sem duplicar texto ou inchar contexto.

- **Quando usar**: Ao planejar tarefas estruturadas através de arquivos Markdown de plano.
- **Sintaxe**:
  ```bash
  node mentor.mjs task vincular-plano <ID_TAREFA> --arquivo <caminho_do_arquivo> [--secao <id_secao>]
  ```
- **Exemplo**:
  ```bash
  node mentor.mjs task vincular-plano TASK-FEAT-002 --arquivo "docs-mentor/planos/auth-v2.md" --secao "etapa-01"
  ```

---

### `task validar`
Registra validação manual por humano ou agente responsável.

- **Quando usar**: Antes de finalizar, quando a cerimônia da tarefa exigir validação explícita.
- **Sintaxe**:
  ```bash
  node mentor.mjs task validar <ID_TAREFA> --aprovado
  node mentor.mjs task validar <ID_TAREFA> --dispensado --motivo "<justificativa>"
  ```

---

### `task finalizar`
Encerra formalmente a tarefa, conferindo que todos os gates foram executados, os critérios foram atendidos, e regenera as vistas em Markdown.

- **Quando usar**: Quando o código estiver pronto, testado e com gates verdes.
- **Sintaxe**:
  ```bash
  node mentor.mjs task finalizar <ID_TAREFA> [--produto-tocado "<justificativa>"]
  ```
- **Opções**:
  - `--produto-tocado`: Obrigatório se a tarefa for do tipo spike/chore/docs mas tiver alterado arquivos de código de produção fora do laboratório.
- **Exemplo**:
  ```bash
  node mentor.mjs task finalizar TASK-FIX-001
  ```

---

### `task fatiar`, `cancelar` e `absorver`
Operações de reestruturação de escopo:
- `task fatiar <ID> --titulos "Fatia 1|Fatia 2|Fatia 3"`: Divide uma tarefa grande em fatias menores encadeadas.
- `task cancelar <ID> --motivo "..."`: Cancela uma tarefa desnecessária (o ID não é reciclado).
- `task absorver <ID> --por <ID_DESTINO>`: Marca que o escopo da tarefa foi absorvido por outra.

---

### `task fila` e `task anexar`
- `task fila <ID> <posicao>`: Fixa a tarefa no topo ou na posição indicada da fila. Use `--soltar` para voltar à ordenação automática por prioridade/urgência.
- `task anexar <ID> --url "<URL>" [--gate]`: Anexa URL externa (PR, link de build do CI, issue) aos metadados da tarefa, mesmo após concluída.

---

## 3. Comandos de Planejamento Portátil (Etapa 01)

O Mentor V5 separa os planos dos registros de tarefa. Os planos podem ser versionados, auditados por hash SHA-256 e importados entre workspaces.

### `plano registrar`
Calcula o SHA-256 do arquivo de plano e adiciona aos metadados de planos disponíveis.

- **Quando usar**: Ao criar ou atualizar um arquivo de especificação/plano em Markdown.
- **Sintaxe**:
  ```bash
  node mentor.mjs plano registrar --arquivo <caminho> [--secao <id>] [--titulo "<titulo>"]
  ```
- **Exemplo**:
  ```bash
  node mentor.mjs plano registrar --arquivo docs-mentor/planos/migracao-db.md --titulo "Migracao DB V2"
  ```

---

### `plano importar`
Copia com segurança um arquivo de plano externo para dentro do projeto (em `docs-mentor/planos/`) e o registra de forma determinística.

- **Quando usar**: Ao trazer um plano desenhado em outra branch ou repositório.
- **Sintaxe**:
  ```bash
  node mentor.mjs plano importar --arquivo <origem> --destino <destino> [--forcar]
  ```
- **Exemplo**:
  ```bash
  node mentor.mjs plano importar --arquivo ../specs/auth.md --destino docs-mentor/planos/auth.md
  ```

---

### `planos`
Lista todos os planos portáteis registrados, com seus hashes SHA-256, caminhos e tarefas vinculadas.

- **Sintaxe**:
  ```bash
  node mentor.mjs planos
  ```

---

## 4. Executor de Gates e Cache Determinístico (Etapas 02 e 03)

### `gates`
Executa toda a matriz de gates declarada no projeto (`testes`, `tipos`, `lint`, `build`, etc.) utilizando o executor unificado do Mentor V5.

- **Comportamento V5**:
  - **Fail-fast**: Se o gate de tipos falhar, a execução para imediatamente, sem rodar a suíte pesada de testes.
  - **Zero-test guard**: Se uma suíte de testes rodar e reportar 0 testes coletados, o gate é invalidado como falha para evitar falsos positivos.
  - **Cache Inteligente**: Baseado em `git write-tree` isolado. Se os arquivos relevantes não mudaram desde a última execução verde, reutiliza o resultado imediatamente.
  - **Logs Detalhados**: Toda saída completa de cada comando é preservada em `docs-mentor/.evidencias/logs/<gate>.log`.
- **Sintaxe**:
  ```bash
  node mentor.mjs gates [--perfil <nome>] [--ignorar-cache]
  ```
- **Exemplo**:
  ```bash
  node mentor.mjs gates
  ```

---

## 5. Controle de Integridade e Patches (Etapa 05)

Quando você customiza ou estende o próprio Mentor dentro de `.mentor/`, os arquivos diferem do manifesto original do pacote. O Mentor V5 resolve isso com o sistema de **Patches Auditáveis**, garantindo governança sem quebrar a verificação.

### `verificar`
Checa a consistência geral do repositório: integridade referencial de IDs, tetos de texto, limites de ciclo, ausência de marcadores de conflito (`<<<<<<<`) e integridade dos arquivos de `.mentor/`.

- **Quando usar**: Antes de submeter código, nos hooks de git ou para inspecionar sanidade.
- **Sintaxe**:
  ```bash
  node mentor.mjs verificar
  ```

---

### `patch registrar` e `patch registrar-todos`
Registra modificações locais feitas em `.mentor/` associando-as à tarefa responsável e gerando o hash SHA-256 no arquivo `docs-mentor/patches-do-pacote.json`.

- **Quando usar**: Sempre que editar ou criar scripts/esquemas em `.mentor/`.
- **Sintaxe**:
  ```bash
  # Registrar um arquivo especifico:
  node mentor.mjs patch registrar <caminho_arquivo> --tarefa <ID_TAREFA> [--teste <evidencia>]

  # Registrar todos os arquivos modificados de uma vez:
  node mentor.mjs patch registrar-todos --tarefa <ID_TAREFA>
  ```
- **Exemplo**:
  ```bash
  node mentor.mjs patch registrar-todos --tarefa TASK-CHORE-027
  ```

---

### `patch listar` e `patch verificar`
- `node mentor.mjs patch listar`: Mostra todos os patches locais ativos e suas tarefas de origem.
- `node mentor.mjs patch verificar`: Valida se os arquivos em disco batem exatamente com os hashes declarados nos patches.

---

## 6. Diagnóstico e Saúde do Repositório

### `doctor`
Fornece uma folha de saúde rápida com veredito binário (**SAUDÁVEL** ou **ATENÇÃO**) sobre o estado do projeto, tarefas ativas, limites de ciclo, integridade de branches e gates.

- **Garantia V5**: 100% somente-leitura. **Nunca** cria tarefas, não altera arquivos e não polui o histórico.
- **Sintaxe**:
  ```bash
  node mentor.mjs doctor [--saida json|md]
  ```
- **Exemplo**:
  ```bash
  node mentor.mjs doctor
  ```

---

## 7. Hooks de Git e Integração Contínua (Etapa 04)

### `hooks instalar`
Instala ou atualiza os scripts de pre-push do repositório (`.git/hooks/pre-push`), apontando diretamente para `node mentor.mjs hooks --pre-push`.

- **Sintaxe**:
  ```bash
  node mentor.mjs hooks instalar
  # ou:
  node mentor.mjs hooks --instalar
  ```

---

### `hooks pre-push`
Executado automaticamente pelo Git antes de qualquer `git push`.

- **Otimizações do V5**:
  1. **Bypass Rápido para Ramos WIP**: Se o destino for `wip/*`, o push é liberado imediatamente sem travar o desenvolvedor.
  2. **Bloqueio de Exclusão ou Push Direto na Main**: Impede acidentes destrutivos no ramo protegido.
  3. **Guarda de Working Tree**: Impede envio de código com alterações de produto não commitadas.
  4. **Gates sem Redundância**: Só roda testes se o código tiver mudado em relação à última validação verde registrada em cache.
- **Sintaxe manual**:
  ```bash
  node mentor.mjs hooks pre-push
  ```

---

### `pronto-para-merge`
Validação rigorosa utilizada na esteira de CI ou antes de abrir PRs.

- **O que valida**:
  - Garante que a tarefa mencionada no título do PR (`TASK-...`) existe, está concluída no ciclo atual e teve todos os gates verdes.
  - Suporta PRs do tipo `(light)` ou `(plano)` com matriz de validação adaptativa.
- **Sintaxe**:
  ```bash
  node mentor.mjs pronto-para-merge --titulo "feat(auth): implementar oauth2 (TASK-FEAT-001)"
  ```

---

## 8. Requisitos, Invariantes e Riscos

O Mentor mantém o rastreamento da arquitetura vivo junto ao código:

### `req` (Requisitos)
- `node mentor.mjs req nova --tipo <RF|RN|RNF> --titulo "..." [--criterios "a|b" --prioridade <p>]`
- `node mentor.mjs req listar`

### `inv` (Invariantes de Domínio / Restrições Arquiteturais)
- `node mentor.mjs inv nova --id <INV-N> --enunciado "..." --porque "..." [--mecanismo "..."]`
- `node mentor.mjs inv listar`

### `ref` (Referências Externas / ADRs)
- `node mentor.mjs ref nova --id <ID> --onde <caminho> [--sistema <nome> --titulo <titulo>]`
- `node mentor.mjs ref listar`

### `ra` (Registro de Riscos Aceitos)
- `node mentor.mjs ra nova --titulo "..." --justificativa "..." --evidencia "..." --aceito-por "..." --revisar-em "AAAA-MM-DD" --tarefa-de-saida <ID>`
- `node mentor.mjs ra encerrar <ID>`

---

## 9. Auditoria e Utilitários

### `auditar`
Fluxo de auditoria cega de lotes por nova sessão de IA:
- `node mentor.mjs auditar preparar`: Prepara o dossiê de auditoria sem viés.
- `node mentor.mjs auditar registrar <AUD-ID>`: Grava o resultado da auditoria.
- `node mentor.mjs auditar resolver <AUD-ID-Bxx> --destino tarefa|divida_tecnica|risco_aceito|descartado`: Direciona o apontamento.

### `gerar` e `resolver-gerados`
- `node mentor.mjs gerar`: Regenera todas as vistas e resumos em Markdown (`docs-mentor/vistas/`).
- `node mentor.mjs resolver-gerados`: Em caso de conflito de merge em arquivos derivados, reconstrói o `contexto.json` de forma determinística.

### `anotar` e `relatorio-de-campo`
- `node mentor.mjs anotar --sobre pacote|projeto "Texto da observação"`: Grava ideias e feedbacks no local correto sem poluir a mente do agente.
- `node mentor.mjs relatorio-de-campo [--detalhado]`: Mede fricções reais e métricas do Mentor.

---

## 10. Fluxos de Trabalho Recomendados (Cheat Sheet)

### Cenário A: Correção Cirúrgica Rápida (Standard Compacto)
```bash
# 1. Criar tarefa compacta (sem perguntas excessivas)
node mentor.mjs task nova --tipo fix --titulo "Corrigir regex de email" --esforco IA --origem "Bug report" --cerimonia Standard --perfil compacto

# 2. Iniciar trabalho
node mentor.mjs task iniciar TASK-FIX-001

# 3. [Fazer a alteracao no codigo]

# 4. Rodar os gates com fail-fast e cache
node mentor.mjs task gates TASK-FIX-001

# 5. Finalizar tarefa
node mentor.mjs task finalizar TASK-FIX-001
```

### Cenário B: Alternância Rápida de Tarefas (WIP = 1)
```bash
# Você está trabalhando na TASK-FEAT-001 e surgiu um hotfix:
node mentor.mjs task pausar TASK-FEAT-001 --motivo "Interrupcao para hotfix urgente" --commit

# Agora o slot está livre:
node mentor.mjs task iniciar TASK-HOTFIX-002
# ... resolver hotfix e finalizar ...
node mentor.mjs task finalizar TASK-HOTFIX-002

# Retomar a tarefa anterior:
node mentor.mjs task retomar TASK-FEAT-001
```

### Cenário C: Alteração Interna no Mentor
```bash
# Se você modificou algum arquivo dentro de .mentor/:
node mentor.mjs patch registrar-todos --tarefa TASK-CHORE-027

# Conferir se o verificador está 100% verde:
node mentor.mjs verificar
```
