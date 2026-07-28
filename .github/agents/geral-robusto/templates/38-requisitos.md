---
description: "Template dos requisitos do sistema: funcionais (RF), regras de negócio (RN) e não-funcionais (RNF). Formato único dos 3 arquivos de docs/requisitos/, com prioridade, status e rastreabilidade requisito↔tarefa↔ADR."
modulo: "38"
categoria: "templates"
versao: "1.0"
arquivo_destino: "docs/requisitos/{funcionais,regras-negocio,nao-funcionais}.md"
relacionado:
  - "26-inicializacao-projeto.md"
  - "11-arquitetura-e-pastas.md"
  - "20-ciclo-tarefa.md"
  - "32-ADR.md"
---

# 📋 Template: Requisitos (RF · RN · RNF)

> **Arquivos destino:** `docs/requisitos/funcionais.md` (RF), `docs/requisitos/regras-negocio.md` (RN), `docs/requisitos/nao-funcionais.md` (RNF). Um arquivo por tipo; o formato dos três está aqui.
>
> **Quando usar:** ao documentar requisitos, tanto os **já implementados** (extraídos do código; o *como extrair* está no [módulo 26](../processos/26-inicializacao-projeto.md) §6) quanto os **planejados** (vindos de uma visão/rascunho). Este template é o **formato**; o módulo 26 é o **método** para o estado atual.

---

## O Que Cada Arquivo Registra

| Arquivo | Tipo | Responde |
|---|---|---|
| `funcionais.md` | **RF**, Requisito Funcional | *O que o sistema faz* (capacidades observáveis pelo usuário) |
| `regras-negocio.md` | **RN**, Regra de Negócio | *O que deve valer sempre* (invariantes, políticas, restrições do domínio) |
| `nao-funcionais.md` | **RNF**, Requisito Não-Funcional | *Com que qualidade* (desempenho, segurança, privacidade, acessibilidade, PWA/offline, custo, i18n) |

---

## Princípios

1. **Requisito ≠ tarefa.** Um requisito (`RF-07`) é o *quê* e vive em `docs/requisitos/`. Uma tarefa (`TASK-RF-012`) é o *trabalho* de construí-lo e vive em `docs/tarefas/`. Um requisito é **implementado por** 0..N tarefas. Não confunda os IDs nem os namespaces.
2. **Declarativo, não imperativo.** O requisito diz *o que*, nunca *como*. "O usuário pode importar uma planilha" é requisito; "usar SheetJS para ler o arquivo" é decisão de implementação (vai em ADR/código).
3. **Atual = código é a verdade primária.** Para o que já existe, extraia do código (módulo 26 §2/§6). Não invente; o que não dá para inferir vira `a confirmar`, nunca chute disfarçado de fato.
4. **Futuro = sempre rastreado.** Um requisito `Planejado` só entra com a **tarefa e/ou ADR** que o origina linkada. Senão é desejo solto, não requisito.
5. **Estrutura vazia > ausência.** Sem requisitos de um tipo ainda? Deixe o arquivo com cabeçalho e a tabela vazia, não o omita.

---

## IDs, Prioridade e Status

**IDs:** `RF-NN` / `RN-NN` / `RNF-NN`, sequenciais por tipo. O próximo é o maior já usado **+ 1**; **gaps nunca são reaproveitados** (mesma regra das tarefas, núcleo §4.4).

**Prioridade (MoSCoW):**

| Valor | Significado |
|---|---|
| **MUST** | Sem isto o produto não cumpre o propósito |
| **SHOULD** | Importante, mas há contorno aceitável |
| **COULD** | Desejável; entra se sobrar espaço |
| **WON'T** | Fora de escopo *por ora* (registrado para não ser reproposto) |

**Status:**

| Marca | Significado |
|---|---|
| ✅ Implementado | Existe no código e funciona |
| 🟡 Parcial | Parte existe; o resto está pendente (linke a tarefa do que falta) |
| 🔭 Planejado | Decidido, ainda não construído (linke a tarefa/ADR) |
| 🚫 Descartado | Já existiu ou foi cogitado; não será feito (registre o porquê) |

**Origem:** de onde o requisito foi extraído/decidido: `arquivo.ts`, um teste, `ADR-XXX`, um rascunho, ou pedido do humano.

---

## Template Vazio de `funcionais.md` (RF) (Para Copiar)

```markdown
# Requisitos Funcionais (RF)

> O que o sistema faz. IDs `RF-NN`. Atuais extraídos do código (código é a verdade primária); planejados sempre com tarefa/ADR linkada. Formato em `.github/agents/geral-robusto/templates/38-requisitos.md`.

| ID | Requisito | Prioridade | Status | Origem | Tarefas / ADR |
|---|---|:---:|:---:|---|---|
| RF-01 | [O usuário pode ...] | MUST | ✅ Implementado | `src/.../Arquivo.tsx` | TASK-RF-001 |
| RF-02 | [O sistema ...] | SHOULD | 🔭 Planejado | `docs/rascunhos/...` | TASK-RF-006 |

## Critérios de Aceite (só quando o "pronto" não é óbvio)

- **RF-01:** [condição observável que prova que está pronto]
- **RF-02:** [...]

## Pendente de Validação

- [RF-XX: o que ficou `a confirmar` e por quê]
- (ou `- (nada pendente)`)
```

---

## Template Vazio de `regras-negocio.md` (RN) (Para Copiar)

```markdown
# Regras de Negócio (RN)

> O que deve valer sempre: invariantes e políticas do domínio. IDs `RN-NN`. Cada regra aponta onde o código a garante (ou a tarefa que vai garanti-la). Formato em `.github/agents/geral-robusto/templates/38-requisitos.md`.

| ID | Regra (invariante) | Onde é imposta | Status | Origem | Tarefas / ADR |
|---|---|---|:---:|---|---|
| RN-01 | [Uma coordenada só é válida dentro dos limites do Rio] | `src/utils/coordinates.ts` | ✅ Implementado | `coordinates.ts` | - |
| RN-02 | [Não se salva rota com pontos não atribuídos] | [a construir] | 🔭 Planejado | `fluxo-roteirizacao.md §4` | TASK-RF-006 |

## Pendente de Validação

- (ou `- (nada pendente)`)
```

---

## Template Vazio de `nao-funcionais.md` (RNF) (Para Copiar)

```markdown
# Requisitos Não-Funcionais (RNF)

> Com que qualidade o sistema opera. IDs `RNF-NN`. Cada um com categoria e, quando aplicável, métrica/alvo verificável. Formato em `.github/agents/geral-robusto/templates/38-requisitos.md`.

| ID | Requisito | Categoria | Métrica / Alvo | Status | Origem | Tarefas / ADR |
|---|---|:---:|---|:---:|---|---|
| RNF-01 | [App funciona instalado e offline] | PWA/Offline | [shell carrega sem rede] | ✅ Implementado | `vite.config.ts` | - |
| RNF-02 | [100% client-side, sem backend] | Arquitetura/Custo | [zero servidor próprio] | ✅ Implementado | ADR-002 | - |

## Pendente de Validação

- (ou `- (nada pendente)`)
```

---

## Rastreabilidade (requisito ↔ tarefa ↔ ADR)

A ligação é **bidirecional e explícita**:

- O **requisito** lista, na coluna `Tarefas / ADR`, o que o implementa (`TASK-RF-006`) e/ou a decisão que o governa (`ADR-002`).
- A **tarefa** cita, no campo `REQ/ADR/DT`, o requisito que cumpre (`RF-02`).
- A **ADR** que cria ou afeta um requisito o menciona nas consequências.

Ao **concluir uma tarefa** que muda um requisito, atualize o `Status` dele na **mesma tarefa** (núcleo §10.2 / módulo 20: código + teste + doc juntos). Ex.: `TASK-RF-006` concluída → `RF-02` passa de 🔭 Planejado a ✅ Implementado.

---

## Regras de Preenchimento

- Um requisito por linha; **uma capacidade**, não um épico inteiro (quebre épicos em vários RF).
- Nada de *como* na descrição. Só *o quê* / *o que deve valer*.
- `Planejado` sem tarefa/ADR linkada = inválido. Linke ou não registre.
- Não duplique palavra por palavra a lógica que o código já expressa. Registre a **intenção** e aponte o código na origem.
- `a confirmar` é honesto; chute disfarçado de fato é proibido (código é a verdade primária).
- Gaps de ID nunca são reaproveitados.

---

## Exemplo Curto (preenchido)

```markdown
| ID | Requisito | Prioridade | Status | Origem | Tarefas / ADR |
|---|---|:---:|:---:|---|---|
| RF-03 | O usuário pode importar uma planilha XLSX/CSV de rota | MUST | ✅ Implementado | `src/components/FileUploader.tsx` | TASK-RF-002 |
| RF-09 | O usuário monta paradas agrupando endereços por raio | MUST | 🔭 Planejado | `fluxo-roteirizacao.md §4` | TASK-RF-006 |
```

---

## Mini-FAQ

**1. RF, RN ou RNF, como decidir?** Pergunte: *o sistema "faz" algo?* → RF. *É algo que tem de "valer sempre"?* → RN. *É "quão bem" ele faz?* → RNF.

**2. Um item parece RF e RN ao mesmo tempo.** Separe: o RF é a capacidade ("o usuário salva a rota"); o RN é a restrição ("só salva com todos os pontos atribuídos"). Linke um ao outro pela origem.

**3. Preciso de critério de aceite em todo RF?** Não. Só quando o "pronto" não é óbvio. Trivialidades dispensam.

**4. Onde fica o requisito de um produto futuro ainda não priorizado?** Como `WON'T` (fora de escopo por ora) ou só no rascunho em `docs/rascunhos/`. Vira `🔭 Planejado` quando ganha uma tarefa.

**5. Posso ter requisitos sem nenhuma tarefa?** Atuais (✅) sim, já existem no código. Planejados (🔭) não, exigem tarefa/ADR linkada.

**6. O código mudou e o requisito ficou desatualizado.** A tarefa que mexeu no código devia ter atualizado o requisito (módulo 20). Achou drift? Corrija e/ou registre como achado de revisão.

---

## 🔗 Templates e Módulos Relacionados

- [`../processos/26-inicializacao-projeto.md`](../processos/26-inicializacao-projeto.md): método de extração de requisitos do código existente (§6)
- [`../padroes/11-arquitetura-e-pastas.md`](../padroes/11-arquitetura-e-pastas.md): estrutura padrão de `docs/` (§9)
- [`../processos/20-ciclo-tarefa.md`](../processos/20-ciclo-tarefa.md): atualizar o status do requisito ao concluir a tarefa
- [`32-ADR.md`](32-ADR.md): decisões que originam ou afetam requisitos
