---
applyTo: "**/*.tsx"
---

# React, estado e UI

- Não use `useEffect` para **derivar** estado: `useMemo` ou cálculo direto.
- `key` estável da entidade em listas; nunca `key={i}` em lista reordenável.
- Lógica de feature em hook (`use...`), componente/página fino; evite prop drilling profundo (composição/contexto).
- UI: reuse o design system/wrappers; acessibilidade visual (foco, contraste, alvo de toque).

Detalhes: [`agents/geral-robusto/padroes/12-react-e-estado.md`](../agents/geral-robusto/padroes/12-react-e-estado.md) e [`agents/geral-robusto/padroes/13-ui-e-design-system.md`](../agents/geral-robusto/padroes/13-ui-e-design-system.md).
