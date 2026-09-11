# Melhorias do pacote, vistas daqui

> Anotado por `mentor anotar --sobre pacote`. **Nao vira tarefa deste projeto.**
> Entra no relatorio de campo, e o trabalho acontece no repositorio do `mentor-agent`.
>
> As secoes datadas abaixo nasceram em `.mentor/melhorias-do-pacote.md`, escritas a mao antes
> de o comando existir. Movidas para ca em 02/09/26: arquivo acrescentado dentro de `.mentor/`
> conta como divergencia do pacote no `verificar`.

## 01/09/26 20:24 - Adoção em projeto legado

- O destino das melhorias do pacote ficou ambiguo: `.mentor/processos/rascunho.md` manda usar `docs-mentor/melhorias-do-pacote.md`, mas o uso real pediu um documento padrao dentro de `.mentor/`. O pacote precisa escolher um caminho canonico ou suportar os dois sem perda no `relatorio-de-campo`.
- `mentor instalar` e `mentor init` sao secos demais quando tudo ja existe. Em projeto legado, a mensagem deveria dizer o proximo passo operacional: ler docs/codigo, preencher `docs-mentor/contexto.json`, migrar pendencias vivas, rodar `gerar` e `doctor`.
- A fase `1 · Ler` precisa de um roteiro mais explicito para repositorios com documentacao antiga completa: nao perguntar do zero, ler `docs/`, ler codigo, consolidar contexto e perguntar apenas lacunas que as fontes nao respondem.
- Falta um comando ou guia de migracao de legado para o modelo novo: copiar somente requisitos e tarefas pendentes, ignorar concluidos, preservar filas, fatiar epicos XG e atualizar `offsets_de_id`.
- O pacote precisa tratar IDs legados decimais como `TASK-RF-009.1`: converter para tarefas novas com `fatia_de`, sem reutilizar IDs e sem migrar fatias concluidas.
- `doctor` deveria explicar o aviso "nenhum requisito registrado" como acao recuperavel: "migrou projeto legado? preencha `requisitos/requisitos.json` com pendencias vivas". Hoje o aviso parece dizer que nao existe documentacao, mesmo quando ela existe em `docs/`.
- Requisitos pendentes com tarefas abertas vinculadas pelo lado da tarefa aparecem em `requisitos/pendentes.md` com "Tarefa prevista" vazia. O pacote deveria ou preencher essa coluna a partir de `tarefa.requisitos`, ou renomear a coluna para nao sugerir perda de rastreabilidade.

## 01/09/26 20:24 - Gates, terminal e evidencias

- Quando o agente nao consegue rodar Node no ambiente atual, o pacote precisa ter um caminho oficial de evidencia por arquivo: comandos para PowerShell, captura de stdout/stderr, `$LASTEXITCODE` separado e leitura de arquivos UTF-16.
- `npm run test` pode abrir watch mode em projetos Vitest. O pacote deve preferir o comando declarado do projeto, mas tambem detectar evidencias incompletas como "Waiting for file changes" ou ausencia de resumo `Test Files`/`Tests`.
- Evidencia de gate nao deveria aceitar arquivo vazio, arquivo ausente ou log sem resumo final quando o comando produz resumo. Exit code `0` ajuda, mas a validacao precisa dizer o que foi realmente observado.
- `task registrar-gate` deveria suportar registrar saida ja capturada em arquivo quando o agente nao consegue executar o comando no mesmo host do usuario.
- Saidas do PowerShell redirecionadas com `*>` vieram em UTF-16. O pacote precisa documentar isso ou normalizar a leitura para nao parecer arquivo corrompido.
- O pacote precisa orientar onde guardar saidas temporarias como `.mentor-saidas/`: se e evidencia local fora do Git, sugerir `.gitignore`; se deve virar registro, apontar o comando de absorcao correto.

## 01/09/26 20:24 - CI, auditoria de dependencias e plataforma

- O fluxo pos-push deve prever latencia do GitHub Actions: `gh run list --commit` pode retornar "no runs found" logo apos o push. O agente deve tentar por branch/evento ou esperar e consultar de novo.
- Falha de CI precisa ser diagnosticada por etapa. Nesta conversa, typecheck/lint/test/build passaram e apenas `npm audit --audit-level=high` falhou; o pacote deve ensinar a separar isso antes de sugerir mudanca.
- `npm audit` pode reprovar depois de um commit verde por advisory novo no banco do npm. O pacote deve tratar isso como evento operacional possivel, nao como indicio automatico de que a mudanca recem-feita causou a falha.
- O processo de entrega fala em barrar vulnerabilidade critica, mas o projeto declarou `audit-high`. O pacote precisa deixar claro que a severidade cobrada vem de `contexto.versionamento.esteira_barra` e do workflow real.
- Quando a API do GitHub nega logs com 403 por falta de permissao, o pacote deveria sugerir automaticamente `gh run view <run> --log-failed > arquivo`.
- Alertas de plataforma, como branch protection ausente, precisam ficar separados de falha real de CI. A tela do GitHub mistura sinais, e o agente deve dizer qual deles bloqueia agora.
- O guia de branch protection/rulesets deveria existir no pacote: repo solo, `main`, PR obrigatorio, status check obrigatorio, `0` aprovacoes, bloquear delete/force push, sem code scanning/code quality se nao configurados.
- Depois de proteger `main`, o pacote deve lembrar que o fluxo muda para branch + PR, e que push direto na `main` deixa de ser caminho normal.
- Dependabot depois da protecao precisa de rotina propria: PRs antigos podem ficar atras da `main`, com checks antigos quebrados; orientar atualizar/rebase/recriar e mergear um por vez.
- Quando configuracoes de plataforma forem ajustadas manualmente no GitHub, o agente deve lembrar de registrar o resultado em `contexto.configuracoes_de_plataforma` e `contexto.versionamento`.

## 01/09/26 20:24 - Contexto e usabilidade do pacote

- `docs-mentor/contexto.md` gerado estourou o teto de texto. O pacote deve sugerir caminho de correcao: reduzir a view gerada, separar secoes ou permitir teto de projeto fora de `.mentor/`.
- `doctor` aponta configuracoes que nenhum script alcanca, mas poderia listar um mini-roteiro de onde clicar no GitHub para cada uma: branch protection, apagar branch apos merge, alertas de vulnerabilidade, updates de seguranca e segredos da esteira.
- O pacote deve expor melhor o que e fonte editavel e o que e view gerada. Durante a migracao, foi facil confundir `contexto.json` e `requisitos.json` com `contexto.md`, `backlog.md` e `reserva.md`.
- A primeira experiencia deveria terminar com um "proximo passo" acionavel: qual tarefa puxar, qual comando rodar e quais avisos ainda sao apenas plataforma.

## Anotado pelo comando

- **01/09/26 21:33** · processos/tarefa.md lista os tipos de tarefa como lista fechada (RF RN RNF BG REF DOC CHORE TEST) e omite SPIKE, mas o esquema esquemas/tarefa.json e o TIPOS_TAREFA de scripts/tipos.ts aceitam SPIKE, e cmd-tarefa.ts tem ramos proprios para ele. Quem le so o processo conclui que SPIKE nao existe. Acontecido ao planejar TASK-SPIKE-001.

- **01/09/26 21:33** · nucleo.md secao 7 e processos/tarefa.md mandam usar 'task registrar-gate', mas o subcomando real do CLI e 'task gate <ID> <gate>'. Comando citado na lei nao existe no binario.

- **02/09/26 05:48** · task absorver grava estado 'cancelada' e nomeia o arquivo '<data>--<ID>--CANCELADA.json', porque cmd-fila.ts reusa encerrar() para cancelar e absorver. So o campo absorvida_por distingue os dois desfechos. O indice 0-indice.md mostra 'absorvida por X' corretamente, mas estado e nome de arquivo dizem 'cancelada' - quem le o disco sem abrir o JSON conclui que a tarefa foi abandonada.

- **02/09/26 15:17** · MEDIDO, corrige suspeita anterior: 'npm run test' NAO trava o gate. O 'task gate' usa spawnSync com stdio em pipe, e o Vitest detecta stdin sem TTY e faz uma passada so, sem depender da variavel CI. Medicao neste projeto: status 0, 145s, 777 testes, resumo 'Test Files' presente, sem 'Waiting for file changes'. O watch aparece so quando um humano digita o comando no terminal, que nao e o caminho do gate. A anotacao de 01/09 sobre watch mode em Vitest continua valendo para o terminal interativo, mas nao para a evidencia de gate.

- **02/09/26 15:18** · Gate sem timeout: os tres lugares que executam comando declarado usam spawnSync sem a opcao timeout - cmd-tarefa.ts linha 205 (task gate), cmd-gates.ts linha 21 (mentor gates) e cmd-lancamento.ts linha 31 (mentor lancamento). Comando que nao termina pendura o processo para sempre. O grave e o contraste com a propria lei: tarefa.md define SETE rotulos para cobrir todo desfecho, e um travamento nao produz nenhum deles - nem FALHOU, nem NAO EXECUTADO, nem BLOQUEADO. A ferramenta que existe para garantir que gate sem evidencia vira NAO EXECUTADO pode ser ela mesma a coisa que nunca produz evidencia. Sugestao: timeout configuravel por gate no contexto, e ao estourar gravar NAO EXECUTADO com o motivo.

- **02/09/26 15:18** · O rotulo do gate sai so do codigo de saida: cmd-tarefa.ts faz 'const rotulo = r.status === 0 ? APROVADO : FALHOU' e nada inspeciona a saida capturada, que ja esta ali na variavel. Saida vazia com codigo 0 vira APROVADO. E o rotulo 'INVALIDO como gate' - o que existe justamente para 'verde que nao significa o que parece' - nao e calculado por nenhuma linha de codigo: so entra a mao via --rotulo. O nucleo secao 7 adverte contra o verde que leu zero arquivo, mas a defesa nao foi implementada. Confirma pelo lado do codigo a anotacao de 01/09 sobre evidencia incompleta.

- **07/09/26 21:02** · Processo: narrativa de tarefa em processos/tarefa.md deve exigir detalhamento de armadilhas tecnicas e aprendizados reais de testes manuais (conflitos de porta/cache, persistencia e falhas conceituais de UX), evitando que a IA produza apenas resumos protocolares breves que deixam passar o historico util.

- **09/09/26 17:40** · Rastreabilidade e disciplina de escopo: agentes autocompletadores tendem a criar ou alterar regras no codigo em tarefas de UI ou correcoes sem antes consultar o catalogo de requisitos (requisitos.json) e sem cadastrar novos RFs, gerando funcionalidades sem requisito associado (ex: permitir ignorar enderecos). O pacote deve impor no fluxo de inicializacao e planejamento uma etapa obrigatoria de reconciliacao com o catalogo de requisitos existentes antes de permitir a escrita de codigo.
