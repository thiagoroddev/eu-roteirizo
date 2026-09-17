# Implementação do Mentor V5

Status: planejamento pronto para entrega; nenhuma etapa implementada por este pacote de documentos.

Este é o ponto de entrada canônico. Leia este arquivo e **somente a etapa que vai executar**. A [V5 revisada](../mentor-v5-revisado.md) guarda a análise e as justificativas; o [V4 original](../2026-09-15--plano-de-reestruturacao-do-mentor.md) é histórico, não especificação de execução. Não é preciso reler ambos para implementar.

## Objetivo e limites

Reduzir contexto, replanejamento, registros duplicados, interrupções humanas e execução redundante, sem criar aprovações falsas nem enfraquecer checks remotos. Preservar requisitos, WIP, reserva, dependências, regressões e evidência de aceitação.

O usuário pediu apenas este planejamento e autorizou dispensar a cerimônia que o atrapalhasse. Isso não implementa a V5 nem autoriza commit, push, PR, merge ou deploy. Não alterar regras remotas para acomodar a migração. A próxima IA deve receber autorização de implementação e o escopo da etapa; o plano não substitui essa autorização.

Alvo padrão de implementação: `.mentor/` **deste projeto**, conforme `AGENTS.md`. Registrar correções efetivamente aplicadas em `docs-mentor/melhorias-do-pacote.md` e suas regressões em `docs-mentor/melhorias-do-pacote.test.ts`. Não abrir automaticamente tarefas no repositório do pacote; portar posteriormente exige alvo e autorização próprios. Ajustes de integração podem atingir configuração do projeto, hooks e workflow, conforme a etapa.

Não criar uma tarefa para cada parágrafo. A etapa é unidade de planejamento e entrega; tarefas de execução são criadas apenas quando a etapa for iniciada. Este pacote não ocupa WIP. Não converter seus textos em novos planos de tarefas.

## Ordem de implementação

| Etapa | Entrega | Depende de |
| --- | --- | --- |
| [00 — Base verificável](00-base.md) | Regressões, cobertura do Mentor e levantamento dos checks | — |
| [01 — Plano portátil](01-planejamento-portatil.md) | Planejar separado de executar; referência estável sem reescrita | 00 |
| [02 — Executor de gates](02-executor.md) | Execução única, status/exit code corretos e retomada segura | 00 |
| [03 — Evidência reutilizável](03-evidencias.md) | Fingerprints e invalidação conservadora | 02 |
| [04 — Hooks e CI](04-hooks-ci.md) | Verificar o conteúdo certo, PRs de planejamento e títulos | 00, 02, 03; integrar 01 se disponível |
| [05 — Estado e patches locais](05-estado-patches.md) | Consultas sem escrita e atualização que preserve correções | 00 |
| [06 — Processo compacto e piloto](06-processo-piloto.md) | Normas coerentes, revisão proporcional e medição | 01 a 05 |

Ordem recomendada: 00 → 01 → 02 → 03 → 04 → 05 → 06. As dependências permitem outra sequência; não são pedido para criar vários agentes. Cada etapa entrega código, testes e **a documentação daquela capacidade** juntos. A etapa 06 consolida o processo; não adiar até ela a documentação de comandos que já funcionam.

## Decisões fechadas para evitar novo planejamento

- Planejamento é artefato independente, com endereço canônico, revisão e vínculo opcional a tarefas. O modelo executor não redige outro plano.
- Light, Standard e Strict continuam. Fast-Track é perfil compacto de Standard, não novo ciclo/estado.
- Um executor de gates atende CLI, tarefas e hooks. Começar sequencial; paralelismo e cache remoto ficam fora desta versão.
- Cache local é otimização, não fonte de confiança remota. CI executa suas verificações por conta própria.
- Classificação se baseia em conteúdo, função e risco, não só tamanho, pasta ou extensão.
- Falta de evidência, base de diff ou fingerprint não pode produzir aprovação por omissão.
- Não usar LLM para interpretar logs em operações determinísticas do CLI. Não instalar biblioteca/serviço de orquestração para este trabalho.
- Economizar sem inventar percentuais: medir separadamente interações/contexto, verificações de máquina e atenção humana.

## Contrato de execução de cada etapa

1. Confirmar estado do checkout e ler os símbolos indicados na etapa. Os nomes foram inspecionados nesta árvore; localizar novamente se o código mudou, sem reler o repositório inteiro.
2. Usar o plano existente. Fazer teste focal reproduzível, implementar, revisar o diff e formatar antes da bateria final. Não rodar todos os gates a cada edição de texto.
3. Rodar os comandos declarados e os testes novos pertinentes. Na transição, não desabilitar silenciosamente hooks/gates ativos: se não há reutilização confiável, a repetição de segurança continua até a etapa correspondente.
4. Registrar resultado real e referências de evidência. Nunca marcar etapas futuras como concluídas, fabricar validação humana ou declarar gate que não executou.
5. Encerrar com handoff curto no registro da execução: etapa/revisão do plano, tarefa/ramo, arquivos, critérios atendidos, testes e suas identidades, pendências e autorização ainda necessária. Não recontar a conversa.

Estados sugeridos de acompanhamento: não iniciada, em execução, bloqueada, concluída. Registrar num único lugar — tarefa quando existir; não manter três checklists de progresso sincronizados. Revisar o plano apenas por descoberta material, preservando a decisão anterior e o motivo. Ajuste de implementação dentro do contrato não exige novo documento.

## Segurança da publicação

O workflow local tem os nomes de jobs `Typecheck, lint, test, build, and audit` e `Tarefa concluida no ramo`. **Não foi confirmada aqui a configuração atual de checks obrigatórios no remoto.** Inspecioná-la antes de publicar alterações de CI; manter nomes e resultados exigidos até uma migração explicitamente autorizada.

Para publicar somente estes documentos, o formato atual é `docs(plano): ...`, com a marca na posição de escopo. Não usar o título como bypass de conteúdo. A correção de prioridade de `(plano)`/`(light)` sobre IDs citados já existe; preservar. Incluir código, hooks ou mudanças de regras no mesmo PR deixa de ser documentação isolada. Não fechar uma tarefa de implementação só porque ela foi mencionada num plano.

## Prompt de entrega à próxima IA

> Implemente a etapa NN de `docs-mentor/rascunhos/mentor-v5-implementacao/README.md`. Leia esse índice e o arquivo da etapa, sem reescrever o planejamento nem carregar etapas futuras. O alvo é este projeto. Preserve alterações existentes. Siga os critérios e dependências da etapa, registre evidências reais e entregue um handoff curto. Se faltar uma dependência, informe exatamente qual antes de implementar algo incompatível. Commit, push, PR e merge só se estiverem explicitamente autorizados no meu pedido.

Substituir NN é suficiente. O arquivo continua aqui, independentemente de qual modelo ou ferramenta execute. Para executar várias etapas, nomeá-las no pedido; não é necessário novo planejamento.
