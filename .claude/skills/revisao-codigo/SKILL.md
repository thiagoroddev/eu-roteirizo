---
name: revisao-codigo
description: >-
  Use ao revisar código, um diff, um PR ou alterações antes de concluir uma
  tarefa. Gatilhos: "revise meu código", "faz uma revisão", "olha esse diff/PR",
  "está pronto para concluir?", auto-revisão obrigatória ao fechar tarefa
  Standard/Strict. Aplica dimensões de revisão, níveis de achado e formato
  padronizado, e gera tarefas de follow-up.
---

# Skill: revisão de código

Roteador para o processo canônico. **Leia e siga:**

- `.github/agents/geral-robusto/processos/21-revisao-codigo.md` (dimensões, níveis, formato, tarefas geradas)
- `.github/agents/geral-robusto/checklists/40-revisao-rapida.md` (checklist essencial)
- Especializados quando pertinente: `checklists/41-seguranca.md`, `42-acessibilidade.md`, `43-performance.md`

Lembretes-chave:
- Achados com nível (bloqueante / importante / sugestão) e formato padronizado.
- Bug fora do escopo: **anote e proponha tarefa** (`docs/tarefas/pendentes.md`), não corrija aqui.
- Nunca declare gate verde sem executar typecheck/lint/test.
