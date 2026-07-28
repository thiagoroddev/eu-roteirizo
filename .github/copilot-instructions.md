# Instruções do Agente: GitHub Copilot

> Entry point sempre carregado pelo Copilot. O conteúdo canônico do agente vive em
> [`agents/geral-robusto/`](agents/geral-robusto/) (fonte única da verdade). O **núcleo
> inegociável** está espelhado abaixo (bloco sincronizado); o conteúdo extenso fica por
> ponteiro. Regras por **tipo de arquivo** são aplicadas automaticamente via
> [`instructions/*.instructions.md`](instructions/) (campo `applyTo`).

> ⚠️ **Antes de tudo:** [`docs/contexto-projeto-ai.md`](../docs/contexto-projeto-ai.md) **vence**
> o núcleo em quase tudo (ver hierarquia abaixo).

<!-- BEGIN:nucleo-sync (fonte: agents/geral-robusto/01-nucleo.md §1.3, §2, §3, §4, §5) -->

## Hierarquia de regras

1. `docs/contexto-projeto-ai.md` (vence quase sempre)
2. `.github/agents/geral-robusto/01-nucleo.md` (núcleo)
3. Demais módulos do pacote

**Exceções inegociáveis** (o contexto do projeto não anula): (1) confirmar antes de ação
destrutiva; (2) proibido `any` sem justificativa; (3) código é a verdade primária.

## 5 princípios inegociáveis

1. **Artesão, não autocompletador.**
2. **Confirme antes de agir**: reformule o pedido e espere "pode fazer" antes de criar/deletar/reestruturar.
3. **Código é a verdade primária**: docs só para o que o código não expressa.
4. **Idioma único: Português** (variáveis, funções, tipos, testes, comentários).
5. **Cerimônia proporcional ao risco.**

## Processo

`ENTENDER → PLANEJAR → APROVAR → EXECUTAR → REGISTRAR`. Nada de média/grande sem aprovação explícita.

## Modos de cerimônia

- **Light**: trivial/cosmético: registro mínimo.
- **Standard**: feature/bug/refatoração local: ciclo `pendentes → em-andamento → concluidas` + revisão.
- **Strict**: arquitetura/multi-módulo/arquivo crítico: Standard + ADR + análise de impacto.

## Anti-padrões críticos

`any` sem justificativa · `useEffect` para derivar estado · `key={i}` em listas dinâmicas ·
`localStorage` direto no componente · dependência sem aprovação · alterar teste só para "passar" ·
implementar sem confirmar · refatorar fora do escopo · declarar gate verde sem executá-lo.

<!-- END:nucleo-sync -->

## Carregamento sob demanda

| Quando a tarefa envolver | Leia |
|---|---|
| Conduzir tarefa Standard/Strict | `agents/geral-robusto/processos/20-ciclo-tarefa.md` (+ `templates/30`,`31`) |
| Revisar código | `agents/geral-robusto/processos/21-revisao-codigo.md` (+ `checklists/40`) |
| Refatorar | `agents/geral-robusto/processos/22-refatoracao.md` |
| Modelar domínio | `agents/geral-robusto/processos/23-modelagem-dominio.md` |
| Figma → código | `agents/geral-robusto/processos/24-figma-para-codigo.md` |
| Decisão arquitetural / ADR | `agents/geral-robusto/processos/25-analise-impacto.md` (+ `templates/32-ADR.md`) |
| Inicializar projeto | `agents/geral-robusto/processos/26-inicializacao-projeto.md` (+ `templates/33`) |
| Requisitos (RF/RN/RNF) | `agents/geral-robusto/templates/38-requisitos.md` |
| Revisão geral (sob pedido) | `agents/geral-robusto/processos/27-revisao-geral.md` (+ `templates/37`) |

Catálogo completo: [`agents/geral-robusto/00-INDICE.md`](agents/geral-robusto/00-INDICE.md).
Registro de tarefas: [`docs/tarefas/`](../docs/tarefas/).
