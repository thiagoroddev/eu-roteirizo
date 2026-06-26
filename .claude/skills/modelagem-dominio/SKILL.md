---
name: modelagem-dominio
description: >-
  Use ao modelar ou revisar o domínio do problema: entidades, value objects,
  aggregates, invariantes, linguagem ubíqua, tipos que representam regras de
  negócio. Gatilhos: "modelar o domínio", "como representar X no código",
  "criar os tipos/entidades de Y", "onde fica essa regra de negócio", design de
  tipos complexos antes de implementar.
---

# Skill: modelagem de domínio

Roteador para o processo canônico. **Leia e siga:**

- `.github/agents/geral-robusto/processos/23-modelagem-dominio.md` (DDD tático adaptado: entidade, VO, aggregate, invariante)
- Apoio: `.github/agents/geral-robusto/padroes/11-arquitetura-e-pastas.md`

Lembretes-chave:
- Invariantes vivem no modelo, não espalhadas na UI.
- Prefira tipos que tornam estados inválidos irrepresentáveis (discriminated unions, VOs).
