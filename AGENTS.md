# Guia do Agente — Codex (e agentes compatíveis com AGENTS.md)

> Entry point sempre carregado. O conteúdo canônico do agente vive em
> [`.github/agents/geral-robusto/`](.github/agents/geral-robusto/) (fonte única da verdade).
> Como o Codex não resolve imports, o **núcleo inegociável** está espelhado abaixo (bloco
> sincronizado). O conteúdo extenso (padrões, processos, templates) fica **só por ponteiro** —
> abra o módulo indicado quando a tarefa pedir.

> ⚠️ **Antes de tudo:** leia [`docs/contexto-projeto-ai.md`](docs/contexto-projeto-ai.md).
> Ele **vence** o núcleo em quase tudo (ver hierarquia abaixo).

<!-- BEGIN:nucleo-sync (fonte: .github/agents/geral-robusto/01-nucleo.md §1.3, §2, §3, §4, §5) -->

## Hierarquia de regras (resolução de conflito)

1. `docs/contexto-projeto-ai.md` (vence quase sempre)
2. `.github/agents/geral-robusto/01-nucleo.md` (este núcleo)
3. Demais módulos do pacote

**Exceções inegociáveis** — o contexto do projeto **não** pode anular: (1) confirmar antes de
ação destrutiva; (2) proibido `any` sem justificativa explícita; (3) código é a verdade primária.

## Os 5 princípios inegociáveis

1. **Artesão, não autocompletador** — entenda o propósito antes de tocar no código.
2. **Confirme antes de agir (Regra de Ouro)** — antes de criar/deletar/reestruturar, reformule o pedido e espere "pode fazer".
3. **Código é a verdade primária** — não duplique em docs o que o código já expressa; docs guardam decisões/contexto/trade-offs.
4. **Idioma único** — neste projeto: **Português** (variáveis, funções, tipos, testes, comentários). APIs externas em inglês podem coexistir.
5. **Cerimônia proporcional ao risco** — use o modo apropriado (abaixo).

## Processo de trabalho

`ENTENDER → PLANEJAR → APROVAR → EXECUTAR → REGISTRAR`

Nunca execute mudança média/grande sem **aprovação explícita** do humano. Se o plano mudar
durante a execução, volte a PLANEJAR.

## Modos de cerimônia

- **Light** — typo, formatação, doc isolada, renomear arquivo, ajuste de linter. Registro mínimo no chat.
- **Standard** — feature, bug não-trivial, refatoração local. Ciclo completo `pendentes → em-andamento → concluidas` + revisão.
- **Strict** — decisão arquitetural, mudança multi-módulo, troca de tecnologia, arquivo crítico. Standard + ADR + análise de impacto.

## Anti-padrões críticos (bloqueiam entrega)

`any` sem justificativa · `useEffect` para derivar estado · `key={i}` em listas dinâmicas ·
`localStorage` direto no componente · instalar dependência sem aprovação · alterar teste só para
"passar" · implementar sem confirmar · refatorar fora do escopo · **declarar gate
(typecheck/lint/test/build) verde sem executá-lo**.

<!-- END:nucleo-sync -->

## Carregamento sob demanda (abra o módulo conforme a tarefa)

| Quando a tarefa envolver | Leia |
|---|---|
| Iniciar/conduzir tarefa Standard/Strict | `.github/agents/geral-robusto/processos/20-ciclo-tarefa.md` + `templates/30-task-em-andamento.md`, `templates/31-task-concluida.md` |
| Revisar código | `.github/agents/geral-robusto/processos/21-revisao-codigo.md` + `checklists/40-revisao-rapida.md` |
| Refatorar | `.github/agents/geral-robusto/processos/22-refatoracao.md` |
| Modelar domínio | `.github/agents/geral-robusto/processos/23-modelagem-dominio.md` |
| Figma → código | `.github/agents/geral-robusto/processos/24-figma-para-codigo.md` |
| Decisão arquitetural / ADR | `.github/agents/geral-robusto/processos/25-analise-impacto.md` + `templates/32-ADR.md` |
| Inicializar projeto novo/legado | `.github/agents/geral-robusto/processos/26-inicializacao-projeto.md` + `templates/33-contexto-projeto-ai.md` |
| Requisitos (RF/RN/RNF) | `.github/agents/geral-robusto/templates/38-requisitos.md` |
| Revisão geral (sob pedido) | `.github/agents/geral-robusto/processos/27-revisao-geral.md` + `templates/37-revisao-geral.md` |
| Escrever código React/TS | `.github/agents/geral-robusto/padroes/10-codigo-e-convencoes.md`, `12-react-e-estado.md`, `13-ui-e-design-system.md` |
| Escrever teste | `.github/agents/geral-robusto/padroes/15-testes.md` |
| Backend/scripts Node | `.github/agents/geral-robusto/padroes/17-backend-node.md` |
| Validar dados sensíveis | `.github/agents/geral-robusto/padroes/18-seguranca-privacidade.md` + `checklists/41-seguranca.md` |

Catálogo completo: [`.github/agents/geral-robusto/00-INDICE.md`](.github/agents/geral-robusto/00-INDICE.md).
Registro de tarefas: [`docs/tarefas/`](docs/tarefas/) (`pendentes` → `em-andamento` → `concluidas/`).
