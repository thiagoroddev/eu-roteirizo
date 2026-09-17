# 00 — Base verificável e proteção da migração

Depende de: nenhuma. Resultado: baseline pequena e regressões que protegem as próximas etapas. Não reimplementar a CHORE-027.

## Ler e alterar

- `docs-mentor/melhorias-do-pacote.test.ts`: preservar e ampliar os testes de regressão existentes, usando seus helpers de projeto temporário.
- `.mentor/scripts/cli.ts`, `cmd-merge.ts`, `cmd-hooks.ts`, `cmd-tarefa.ts`: somente localizar os comportamentos relevantes para os testes; não refatorar tudo nesta etapa.
- `package.json`, `eslint.config.js`, configurações TypeScript e de testes: criar alvos explícitos de tipos/lint dos scripts do Mentor. Os gates atuais do app não cobrem integralmente `.mentor/`.
- `.github/workflows/quality.yml`: inventariar, sem renomear jobs nem alterar a política nesta etapa.

## Implementar

1. Registrar baseline enxuta: commit/estado sujo, versão Node, comandos declarados, suites existentes e checks remotos conhecidos. Se não houver acesso ao remoto, registrar “não verificado”, não deduzir obrigatoriedade pelo YAML. A implementação local pode prosseguir; publicação que altere a política fica pendente da conferência.
2. Testar o executável real `node mentor.mjs` em fixture isolada, usando `MENTOR_RAIZ` quando aplicável. Não usar tarefas reais nem mexer no índice real do usuário para os testes.
3. Cobrir: PR de planejamento que menciona tarefa aberta; PR de implementação de tarefa aberta; arquivos executáveis em `docs-mentor`; evidência com hash nulo; tarefa legada; preservar conteúdo do índice Git. Os testes de comportamentos ainda incorretos entram com a correção na etapa responsável, não como suíte vermelha publicada nem testes que eternizam o bug.
4. Adicionar tipos/lint específicos do pacote, com configurações próprias quando necessário para não varrer todo o app de novo. Não esconder erros usando exclusão de `.mentor` no novo alvo. Se houver dívida preexistente grande, separar baseline explícita de novas regressões e delimitar a correção; não fazer reforma geral incidental.
5. Preparar uma fixture pequena para testes de CLI, eventos de PR e referências de push. Reutilizar infraestrutura existente antes de criar helpers novos. Sem serviço externo ou framework novo.

## Aceite

- B00-1: um comando documentado executa regressões do Mentor sem depender de rede nem do repositório real.
- B00-2: tipos/lint identificam um erro semântico/de estilo introduzido deliberadamente num script de fixture e passam após removê-lo; não apenas exit 0 sem arquivos analisados.
- B00-3: testes existentes da CHORE-027 permanecem verdes e o estado de arquivos/índice do usuário fica intacto.
- B00-4: baseline distingue checks locais de requisitos remotos confirmados; não cria dados de consumo de tokens inexistentes.

Não refazer a baseline em cada tarefa. Atualizar somente comandos/contratos afetados. Rollback: retirar novos alvos isolados sem mexer nos gates que já protegiam o app; preservar regressões úteis. Handoff: comandos focais, limitações de cobertura e identificação dos checks remotos, se acessíveis.
