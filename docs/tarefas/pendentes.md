# Tarefas Pendentes

> Backlog priorizado. Cada tarefa entra como **uma única linha** (urgência Normal) ou **bloco em lista** (urgência Imediata). Sem detalhes de implementação — o plano nasce só quando a tarefa vira "Em Andamento".
>
> Ordenação: por **prioridade combinada** (Valor + Urgência), maior no topo. Em empate, menor esforço primeiro. Não ordenar por data.

---

## Imediatas

> Tarefas urgentes que carregam contexto extra. Bloco em lista, no topo. (Vazio por enquanto.)

<!--
## TASK-PREFIXO-XXX - Título
- **Status:** Pendente
- **Modo:** Standard
- **Valor:** Crítico
- **Urgência:** IMEDIATA
- **Esforço-H/IA:** G/G
- **Data-hora origem:** DD/MM/AA HH:MM
- **Dependências:** -
- **REQ/ADR/DT:** -
- **Observações:** [motivo da urgência]
-->

---

## Backlog (Normal)

| TASK-ID | Título | Modo | Valor | Urgência | Esforço-H/IA | Dependências | REQ/ADR/DT | Status | Data origem |
|---|---|:---:|:---:|:---:|:---:|---|---|:---:|---|
| TASK-BG-002 | Gatear logging de dados (PII) atrás de flag de DEV no excelProcessor | Standard | Importante | Normal | P/P | - | REV-001-A03 | `[ ]` | 22/06/26 11:05 |
| TASK-BG-003 | Escapar HTML dos campos do Excel no tooltip do mapa | Standard | Importante | Normal | P/P | - | REV-001-A04 | `[ ]` | 22/06/26 11:05 |
| TASK-BG-004 | Validar faixa de lat/lng e avisar coordenadas descartadas | Standard | Importante | Normal | P/M | - | REV-001-A06 | `[ ]` | 22/06/26 11:05 |
| TASK-DOC-001 | Criar docs/contexto-projeto-ai.md (ponto de entrada do projeto) | Standard | Importante | Normal | M/M | - | REV-001-A02, ADR-001 | `[ ]` | 22/06/26 11:05 |
| TASK-TEST-001 | Testes de integração: fluxo RouteViewer + interações RouteSelector | Standard | Importante | Normal | M/G | - | REV-001-A11 | `[ ]` | 22/06/26 11:05 |
| TASK-REF-001 | Alinhar código à ADR-001 (comentários PT→EN; nenhuma string de UI hardcoded) | Standard | Desejável | Normal | M/M | - | REV-001-A05, ADR-001 | `[ ]` | 22/06/26 11:05 |
| TASK-REF-002 | Usar chave estável (Sequência/Parada) nas linhas de tabela em vez de key={idx} | Standard | Desejável | Normal | P/P | - | REV-001-A09 | `[ ]` | 22/06/26 11:05 |
| TASK-REF-003 | Usar ou remover hasValidFileExtension (código morto em produção) | Standard | Desejável | Normal | P/P | - | REV-001-A10 | `[ ]` | 22/06/26 11:05 |
| TASK-CHORE-001 | Mitigar ReDoS no xlsx interno empacotado pelo danfojs | Standard | Importante | Normal | P/M | - | REV-001-A07 | `[!]` | 22/06/26 10:41 |

> **TASK-CHORE-001 — bloqueada por upstream.** O `danfojs@1.2.0` empacota `xlsx@0.19.3` (advisory [GHSA-5pgg-2g8v-p4x9](https://github.com/advisories/GHSA-5pgg-2g8v-p4x9), ReDoS). Não é corrigível sem o danfojs publicar versão com `xlsx ≥ 0.20.2`. **Gatilho:** quando o danfojs publicar release com xlsx corrigido (ou ao migrar leitura de planilha para o `xlsx` 0.20.3 direto, contornando o danfojs). Candidata a virar dívida técnica formal (`docs/dominios/divida-tecnica.md`) se a estrutura de domínios for criada.

---

## Legenda

**Prefixos de ID:**

| Prefixo | Significado |
|---|---|
| TASK-RN | Regra de Negócio |
| TASK-RF | Requisito Funcional |
| TASK-RNF | Requisito Não-Funcional |
| TASK-BG | Bug |
| TASK-REF | Refatoração |
| TASK-DOC | Documentação |
| TASK-CHORE | Manutenção |
| TASK-TEST | Testes |

IDs independentes: `TASK-RF-005`. Derivadas: `TASK-RF-005.1`.

**Campos:**

- **Modo:** Light / Standard / Strict
- **Valor:** Crítico / Importante / Desejável
- **Urgência:** Imediata / Normal
- **Esforço-H/IA:** Humano / IA, valores `P / M / G / XG` (ex.: `M/G`). `XG-IA` = dividir antes de executar.
- **Status:** `[ ]` pendente · `[!]` bloqueada · `[x]` concluída (some daqui ao concluir)
- **Data origem:** `DD/MM/AA HH:MM`
