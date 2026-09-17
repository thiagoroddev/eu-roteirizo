Antes de qualquer outra coisa, leia `.mentor/nucleo.md`.

Regra de Contexto e Tokens: Arquivos com sufixo `--estudo-humano.md` (em `docs-mentor/tarefas/concluidas/`) contêm o planejamento rico voltado para estudo humano. IAs NUNCA devem carregar ou ler esses arquivos por padrão. Para histórico e contexto, consulte os arquivos `.json` ou execute comandos do Mentor. A única exceção é se o usuário pedir explicitamente para investigar o design original de uma regressão.

Fechamento de Tarefas e Desfecho: Antes de pedir o Portão 2 ou rodar `node mentor.mjs task finalizar`, preencha ativamente a seção `## Desfecho e Validação Real` na narrativa da tarefa (`docs-mentor/tarefas/abertas/<ID>.md`). O CLI possui uma trava que bloqueia o fechamento se a seção estiver ausente. Registre: (1) comportamento real observado nos testes manuais; (2) armadilhas técnicas, peculiaridades de ambiente ou aprendizados da sessão (concorrência, persistência, cache, UX); (3) desfecho dos gates e conclusão.

Problema no proprio mentor-agent: corrija no `.mentor/` deste projeto e registre em `docs-mentor/melhorias-do-pacote.md`, seguindo a regra do topo desse arquivo.
