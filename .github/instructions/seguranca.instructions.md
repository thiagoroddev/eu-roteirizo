---
applyTo: "**/*"
---

# Segurança e privacidade

- **Preserve dados do usuário.** Não exponha dados pessoais (endereços, CEPs, nomes) em logs, URLs ou commits.
- Previna XSS; nada de `dangerouslySetInnerHTML` sem sanitização; respeite CSP.
- Segredos só em `.env` (nunca versionados). Valide no cliente **e** no servidor.
- Dependência nova passa por aprovação; rode `npm audit` quando relevante.

Detalhes: [`agents/geral-robusto/padroes/18-seguranca-privacidade.md`](../agents/geral-robusto/padroes/18-seguranca-privacidade.md) · checklist [`41-seguranca.md`](../agents/geral-robusto/checklists/41-seguranca.md).
