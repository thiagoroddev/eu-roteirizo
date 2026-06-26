---
applyTo: "**/*.ts,**/*.tsx"
---

# Convenções de código (TS/TSX)

- Idioma único: **Português** em nomes, tipos, testes e comentários (APIs externas em inglês podem coexistir).
- Nomenclatura: `camelCase` (var/func), `PascalCase` (componente/tipo, sem prefixo `I`), `UPPER_SNAKE_CASE` (const global), boolean com `eh/tem/deve/esta` ou `is/has/should`.
- **Proibido `any`** sem justificativa explícita — use `unknown` + type guard.
- Não acesse `localStorage`/infra direto no componente — encapsule em `services/`.

Detalhes completos: [`agents/geral-robusto/padroes/10-codigo-e-convencoes.md`](../agents/geral-robusto/padroes/10-codigo-e-convencoes.md).
