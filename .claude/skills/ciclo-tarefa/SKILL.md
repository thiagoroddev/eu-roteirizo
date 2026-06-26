---
name: ciclo-tarefa
description: >-
  Use ao iniciar, conduzir, registrar ou mover uma tarefa de desenvolvimento
  (feature, bug não-trivial, refatoração com impacto) pelo ciclo pendentes →
  em-andamento → concluídas. Gatilhos: "vamos implementar/fazer X", "iniciar
  tarefa", "registrar a tarefa", "mover para concluída", "criar TASK-...",
  abrir/atualizar docs/tarefas/em-andamento.md ou concluidas/. Garante o modo de
  cerimônia certo (Light/Standard/Strict) e o registro correto.
---

# Skill: ciclo de tarefa

Roteador para o processo canônico. **Leia e siga à risca:**

- `.github/agents/geral-robusto/processos/20-ciclo-tarefa.md` (ciclo completo, modos, transições)
- Templates: `.github/agents/geral-robusto/templates/30-task-em-andamento.md` e `.github/agents/geral-robusto/templates/31-task-concluida.md`

Lembretes-chave:
- Tarefa nasce 1 linha em `docs/tarefas/pendentes.md`; ao iniciar vira bloco em `docs/tarefas/em-andamento.md`; ao concluir vira arquivo próprio em `docs/tarefas/concluidas/<AAAA-MM-DD>--<HHhMM>--TASK-XXX.md` e entra no `0-indice-concluidas.md`.
- **`## Planejamento Aprovado` = o plano integral aprovado, nunca um resumo.**
- Só conclua com testes/typecheck/lint **executados** e verdes (rotule cada gate). Strict exige ADR + análise de impacto.
- Próximo ID: maior número do prefixo no `0-indice-concluidas.md` + 1 (ignore gaps).
