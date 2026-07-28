# Guia do Agente: Claude Code

> Entry point do Claude Code para este repositório. O conteúdo canônico do agente vive
> em [`.github/agents/geral-robusto/`](.github/agents/geral-robusto/) (fonte única da verdade).
> Este arquivo apenas **carrega o núcleo** e **mapeia o carregamento sob demanda**.

## Núcleo (sempre carregado)

@.github/agents/geral-robusto/01-nucleo.md

## Contexto do projeto (vence o núcleo em quase tudo)

@docs/contexto-projeto-ai.md

## Carregamento automático por intenção (Skills)

Você **não precisa** que o humano referencie módulos à mão. Quando a tarefa casar com
uma das intenções abaixo, a Skill correspondente é acionada e abre o módulo canônico:

| Intenção | Skill | Módulo canônico |
|---|---|---|
| Iniciar/mover tarefa Standard ou Strict | `ciclo-tarefa` | `processos/20-ciclo-tarefa.md` + `templates/30`,`31` |
| Revisar código / diff / PR | `revisao-codigo` | `processos/21-revisao-codigo.md` + `checklists/40` |
| Refatorar sem mudar comportamento | `refatoracao` | `processos/22-refatoracao.md` |
| Modelar domínio / entidades | `modelagem-dominio` | `processos/23-modelagem-dominio.md` |
| Traduzir design do Figma | `figma-para-codigo` | `processos/24-figma-para-codigo.md` |
| Decisão arquitetural / registrar ADR | `analise-impacto-adr` | `processos/25-analise-impacto.md` + `templates/32-ADR.md` |
| Entrar em projeto novo/legado | `inicializacao-projeto` | `processos/26-inicializacao-projeto.md` + `templates/33` |
| Levantar/documentar requisitos (RF/RN/RNF) | `requisitos` | `templates/38-requisitos.md` + `processos/26` |
| Revisão geral do projeto (sob pedido) | `revisao-geral` | `processos/27-revisao-geral.md` + `templates/37` |

## Padrões de código sob demanda

Ao **escrever/revisar código**, consulte o padrão pertinente (a tabela completa de
carregamento está no §9 do núcleo):

- Convenções gerais → [`padroes/10-codigo-e-convencoes.md`](.github/agents/geral-robusto/padroes/10-codigo-e-convencoes.md)
- Arquitetura/pastas → [`padroes/11-arquitetura-e-pastas.md`](.github/agents/geral-robusto/padroes/11-arquitetura-e-pastas.md)
- React/estado → [`padroes/12-react-e-estado.md`](.github/agents/geral-robusto/padroes/12-react-e-estado.md)
- UI/design system → [`padroes/13-ui-e-design-system.md`](.github/agents/geral-robusto/padroes/13-ui-e-design-system.md)
- Formulários/validação → [`padroes/14-formularios-e-validacao.md`](.github/agents/geral-robusto/padroes/14-formularios-e-validacao.md)
- Testes → [`padroes/15-testes.md`](.github/agents/geral-robusto/padroes/15-testes.md)
- Performance/a11y → [`padroes/16-performance-acessibilidade.md`](.github/agents/geral-robusto/padroes/16-performance-acessibilidade.md)
- Backend Node → [`padroes/17-backend-node.md`](.github/agents/geral-robusto/padroes/17-backend-node.md)
- Segurança/privacidade → [`padroes/18-seguranca-privacidade.md`](.github/agents/geral-robusto/padroes/18-seguranca-privacidade.md)

Catálogo completo: [`00-INDICE.md`](.github/agents/geral-robusto/00-INDICE.md).

## Registro de tarefas do projeto

O ciclo de tarefas vive em [`docs/tarefas/`](docs/tarefas/): `pendentes.md` →
`em-andamento.md` → `concluidas/<data>--TASK-XXX.md` (+ `0-indice-concluidas.md`).
Regras completas na Skill `ciclo-tarefa` / módulo `processos/20-ciclo-tarefa.md`.
