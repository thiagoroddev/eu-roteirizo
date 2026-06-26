---
applyTo: "**/server/**,**/api/**,__utilidades-back-office__/**"
---

# Backend / scripts Node

- Valide e tipe as entradas (sem `any` solto); trate erros retornando objeto/resultado em vez de lançar pela borda.
- Segredos só em `.env`; nunca em código, logs ou commits.
- Estes scripts lidam com endereços/CEPs — **não exponha PII** em logs, URLs ou commits.

Detalhes: [`agents/geral-robusto/padroes/17-backend-node.md`](../agents/geral-robusto/padroes/17-backend-node.md) (stub) e [`agents/geral-robusto/padroes/18-seguranca-privacidade.md`](../agents/geral-robusto/padroes/18-seguranca-privacidade.md).
