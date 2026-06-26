---
name: analise-impacto-adr
description: >-
  Use antes de uma decisão arquitetural ou mudança que afeta múltiplos módulos /
  troca tecnologia / mexe em arquivo crítico (tarefa Strict), e ao registrar uma
  ADR. Gatilhos: "trocar/escolher biblioteca ou framework", "mudar arquitetura",
  "isso impacta o quê?", "registrar uma decisão", "criar ADR", "vale a pena
  adotar X?". Faz blast radius antes e documenta a decisão.
---

# Skill: análise de impacto + ADR

Roteador para o processo canônico. **Leia e siga:**

- `.github/agents/geral-robusto/processos/25-analise-impacto.md` (blast radius, áreas afetadas, riscos, decisões pendentes)
- Template: `.github/agents/geral-robusto/templates/32-ADR.md` (contexto, alternativas, trade-offs, decisão)

Lembretes-chave:
- Mudança arquitetural relevante = **Strict**: análise de impacto **antes** + ADR + aprovação humana.
- ADR vai em `docs/arquitetura/ADR/ADR-<NUMERO>.md` e é citada na tarefa que a gerou.
