# Tarefas Em Andamento

> Cada tarefa Standard/Strict em execução vive aqui como **um bloco** (cabeçalho + log contínuo com timestamps), enquanto está sendo feita. Ao iniciar, a tarefa **sai de `pendentes.md`**; ao concluir, vira arquivo próprio em `concluidas/` e **sai daqui**.
>
> **Máximo 3 em andamento ao mesmo tempo.** Rodar testes antes e depois de cada tarefa. Datas no formato `DD/MM/AA HH:MM`.

---


# TASK-RF-006.21 - "Abrir no Google Maps" ao lado de "Informações do pacote" no detalhe

- **Status:** EM DESENVOLVIMENTO
- **Modo:** Standard
- **Valor:** Desejável (acessibilidade do link no detalhe)
- **Urgência:** IMEDIATA
- **Esforço-H/IA:** P/P
- **Data-hora origem:** 18/07/26 (pedido de melhoria do painel, prints L-9)
- **Data-hora início:** 18/07/26
- **Dependências:** nenhuma (isolada)
- **REQ/ADR/DT:** RF-43; ADR-004

## Planejamento Aprovado

Parte do plano aprovado (ExitPlanMode + "sim"). Só `StopItem.tsx` (`StopItemDetail`).

**O que muda:**
- Cabeçalho "Informações do pacote (N)" vira `flex justify-between`: título à esquerda + link "Abrir no Google Maps" à direita (mantendo `data-vaul-no-drag`, `target="_blank"`, deep link `?q=lat,lng`).
- Rodapé passa a conter **só** o slot `actions` (quando existir) — sem o link.

**Aceite:** link ao lado do cabeçalho do detalhe; deep link inalterado; Original sem regressão. **Impacto:** `StopItemDetail` (compartilhado — muda em todos os drill-downs, consistente). **Riscos:** mínimo (só layout). **Dependências novas:** nenhuma.

## Execução

- 18/07 —:—: Plano aprovado ("sim"). Task movida para em-andamento.
- 18/07 —:—: `StopItem.tsx` `StopItemDetail` — link "Abrir no Google Maps" movido para o cabeçalho ("Informações do pacote (N)" à esquerda + link à direita, `flex justify-between`, `shrink-0`); rodapé agora só o slot `actions`. Deep link inalterado.

## Testes

- `npx tsc --noEmit`: **APROVADO** (exit 0).
- `npm run lint`: **APROVADO** (exit 0).
- `npm run build`: **APROVADO** (exit 0).
- `npm run test`: **718 verdes** (o link segue existindo → testes por texto de `GOOGLE_MAPS` intactos; sem teste novo — mudança só de layout).

## Pendente (não-código)

- **Smoke no aparelho** (gate de UI): posição/legibilidade do link no cabeçalho do detalhe.

---

O histórico das tarefas concluídas vive em [`concluidas/`](./concluidas/) (uma linha por tarefa em [`0-indice-concluidas.md`](./concluidas/0-indice-concluidas.md)). O backlog do que falta vive em [`pendentes.md`](./pendentes.md).

---

<!-- Modelo de bloco (template completo em .github/agents/geral-robusto/templates/30-task-em-andamento.md):

# TASK-PREFIXO-XXX - Título

- **Status:** EM DESENVOLVIMENTO
- **Modo:** Standard
- **Valor:** Crítico
- **Urgência:** Normal
- **Esforço-H/IA:** G/G
- **Data-hora origem:** DD/MM/AA HH:MM
- **Data-hora início:** DD/MM/AA HH:MM
- **Dependências:** -
- **REQ/ADR/DT:** -

## Planejamento Aprovado
[plano que o humano aprovou]

## Execução
- HH:MM: Plano aprovado
- HH:MM: ...

## Testes
- 1º npm run test: NN verdes
-->
