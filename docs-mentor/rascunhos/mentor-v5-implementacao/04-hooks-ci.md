# 04 — Push e PR verificam o conteúdo certo

Depende de: 00, 02, 03. Integrar referências de plano da etapa 01 quando presentes. Resultado: proteções baratas primeiro, evidência compatível reaproveitada e metadados do PR verificados sem dispensas cegas.

## Onde mexer

- `.mentor/scripts/cmd-hooks.ts`: `lerRefsEnviadas`, classificação de arquivos, intervalos e `prePush`.
- `.mentor/scripts/cmd-merge.ts`: classificação por título e validação por diff.
- `.mentor/scripts/instalar.mjs`, `.mentor/scripts/cmd-pacote.ts`, template do hook e `.githooks/pre-push`: manter instalação nova e hook instalado coerentes.
- `.github/workflows/quality.yml` e `.mentor/processos/entrega.md`.

## Pre-push

1. Ler todas as refs/SHAs do stdin. Validar proteção de ramo, tipo de envio e elegibilidade dos commits **antes** da bateria cara. Preservar suporte a ref nova e exclusão de ref, com mensagens próprias.
2. Classificar cada ref: push misto WIP + ramo normal não herda dispensa global de WIP. Usar os SHAs enviados, não supor `HEAD` nem `origin/main..HEAD`. Falha de Git não vira intervalo vazio aprovado.
3. Evidência precisa corresponder ao conteúdo enviado. Checkout sujo, outra ref ou commit diferente não pode satisfazer o push por coincidência. Se a árvore enviada já tem evidência compatível de conteúdo/ambiente, reaproveitar mesmo que a tarefa esteja concluída. Caso contrário, executar sobre snapshot/worktree temporário isolado com dependências controladas ou bloquear com instrução exata de validação; nunca rodar na árvore errada e chamar isso de check do commit enviado.
4. Deduplicar gates equivalentes por identidade de snapshot e configuração entre refs. Não deduplicar apenas pelo nome do comando. Executar com o executor comum.
5. Permitir tratamento barato para mudança estritamente documental somente por política verificável. Arquivo `.test.ts` sob documentação, workflow, script ou regra de execução não é prosa. Configuração desconhecida usa caminho conservador.

## Pronto para merge

Preservar a prioridade já corrigida de `(plano)`/`(light)` sobre IDs no texto. Porém a marca **classifica**, não aprova: conferir conteúdo, não “contornar o título”. PR de implementação com tarefa aberta continua bloqueado.

Receber base/head explícitos do chamador. Resolver comparação verificável; falha de fetch/diff, ref inexistente ou base desconhecida retorna erro distinto. Não tentar vários ramos arbitrários até conseguir lista vazia. Testar diff vazio real separadamente de erro de diff.

Definir uma matriz de operações permitidas por marca:

- `(plano)`: criar/alterar plano, referência e cadastro de tarefa ainda aberta. Não registrar gate aprovado, conclusão, promoção de requisito, dispensa de proteção ou mudança executável. Validar campos antigos/novos de JSON, não apenas pasta e `estado`. Alterações/deleções em registros históricos precisam de fluxo próprio, não dispensa de planejamento.
- `(light)`: classe pequena de alterações de baixo risco descritas na política; sem bypass para código arbitrário, regra, workflow ou evidência fabricada. Se a alteração não puder ser classificada de modo confiável, exigir fluxo de tarefa. Não tornar toda mudança pequena elegível só por número de linhas.
- tarefa(s): conferir as tarefas efetivamente vinculadas à implementação. Menção textual incidental não deve criar obrigação de concluir a tarefa futura. Manter formato legado e introduzir vínculo estruturado apenas se necessário, com teste de transição.

Validar especialmente `contexto.json`, requisitos e arquivos de tarefa: a allowlist de caminhos atual permite alterações semanticamente mais poderosas do que planejamento. Novos catálogos/contratos da etapa 01 entram com validação correspondente, não exclusão ampla de diretório.

## CI sem quebrar checks obrigatórios

Na implementação, verificar a política remota real. Preservar os nomes `Typecheck, lint, test, build, and audit` e `Tarefa concluida no ramo` enquanto houver dependência deles. Não remover `npm audit`, trocar nomes ou instalar bypass como efeito colateral desta etapa.

O workflow atual não declara `edited` para PR. Acrescentar cobertura de edição do título, abertura, atualização e reabertura. Diferenciar edição de título de alteração da base: mudança de base invalida a decisão de compatibilidade e pode exigir verificações técnicas novas.

Implementar em duas entregas se necessário:

1. **Corretude primeiro:** eventos e base/head corretos, mantendo a bateria técnica atual. Reexecutá-la numa edição de título é custo temporário aceitável.
2. **Otimização condicionada:** separar a verificação de metadados para não repetir a suíte em título isolado, somente após provar que o check técnico válido do mesmo head/base continua satisfazendo a política remota. Não criar um job obrigatório “verde” por pular os testes. Se a plataforma/política não permitir comprovar isso com simplicidade, manter a repetição e registrar a limitação; não construir serviço de cache/atestação para esse detalhe.

Executar CI independentemente dos JSONs de evidência enviados no PR. Não usar `pull_request_target` para executar código não confiável com credenciais privilegiadas; manter permissões mínimas. Título entra como dado/variável, nunca interpolado diretamente em shell. Considerar testes em Linux e Windows onde o comportamento de paths/hooks diferir.

## Aceite

- C04-1: fixtures cobrem envio de ref normal, WIP, misto, nova, excluída, checkout sujo e SHA que não é HEAD; checks sempre correspondem ao conteúdo enviado.
- C04-2: PR de plano citando tarefa aberta passa; PR de implementação aberto falha; JSON com evidência/conclusão/política forjada sob `(plano)` falha; `(light)` não libera script arbitrário.
- C04-3: erro de diff/ref falha fechado; diff genuinamente vazio é identificado corretamente.
- C04-4: editar título reavalia o gate; mudar base não reutiliza resultado incompatível; nomes/status requeridos permanecem satisfatíveis. Cobrir eventos com fixtures e, se autorizado, validar num PR controlado.
- C04-5: gate local válido não é repetido sem motivo; evidência incompatível gera execução correta ou bloqueio útil, nunca aprovação.

Rollback: desligar otimizações e voltar à bateria integral mantendo correções de segurança. Não restaurar `(light)` cego nem erro-de-diff-como-sucesso. Atualização das normas de entrega deve acompanhar a implementação, inclusive mensagens de instalação sobre WIP.
