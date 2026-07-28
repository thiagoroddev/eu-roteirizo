---
applyTo: "**/*.test.ts,**/*.test.tsx,**/*.spec.ts,**/*.spec.tsx"
---

# Testes

- Vitest + Testing Library; estrutura **AAA** (Arrange, Act, Assert).
- Teste comportamento pelo ponto de vista do usuário (`user-event`), não detalhes de implementação.
- **Nunca** altere um teste só para "fazer passar": investigue a causa raiz; teste que quebrou aponta regressão.
- Rode a suíte antes e depois da tarefa; cubra os caminhos críticos e edge-cases.

Detalhes: [`agents/geral-robusto/padroes/15-testes.md`](../agents/geral-robusto/padroes/15-testes.md).
