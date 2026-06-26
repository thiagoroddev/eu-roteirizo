---
name: revisao-geral
description: >-
  Use SOMENTE quando o humano pedir uma revisão completa/auditoria do projeto
  inteiro (não é revisão de tarefa). Gatilhos: "faça uma revisão geral do
  projeto", "auditoria completa", "revisão de saúde do código todo", criar um
  registro REV-NNN. Produz achados rastreáveis e tarefas/ADRs geradas.
---

# Skill: revisão geral do projeto

Roteador para o processo canônico. **Leia e siga:**

- `.github/agents/geral-robusto/processos/27-revisao-geral.md` (auditoria completa, achados rastreáveis)
- Template: `.github/agents/geral-robusto/templates/37-revisao-geral.md`
- Apoio: `.github/agents/geral-robusto/checklists/40-revisao-rapida.md`

Lembretes-chave:
- **Não inicie por conta própria** — só sob pedido explícito do humano. Pode *sugerir*.
- Registro em `docs/arquitetura/revisoes-gerais/REV-<NNN>.md`; achados geram `REV-NNN-Axx` citados nas tarefas.
