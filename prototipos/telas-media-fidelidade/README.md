# Telas: Média Fidelidade (referência visual)

> **Companheiro visual** das specs textuais. Assim como `fluxo-roteirizacao.md` aponta pro protótipo HTML, estas imagens ilustram as telas do app (não são pra codar pixel-a-pixel: servem pra fixar **estrutura e informação** de cada tela). Feitas em ferramenta de média fidelidade; **cores/layout não são finais**, o que importa é **quais informações e ações** cada tela tem.
>
> ⚠️ As imagens **não** entram por aqui automaticamente: arraste os PNGs para esta pasta com os nomes sugeridos abaixo.

## Índice das telas (arquivos reais)

| Arquivo | O que ilustra | Spec relacionada |
|---|---|---|
| `1-HOME.png` | HOME: **enviar romaneio** (.xlsx) + **importar roteiro** (.json) + instruções em spoiler | `fluxo-roteirizacao.md` §11/§13/§15.2 |
| `2-ROTAS.png` | Aba **Rotas**: Romaneios Salvos (Únicos / Multi / Importados), chips por rota/AT + "Ver Roteiro" | §11/§13/§15.2 · RN-23 (duplicado) |
| `3-SELECIONAR-rotas-apos-envio.png` | Multi-rota: buscar por AT / selecionar rota | §11 (toggle multi) |
| `4-detalhes-sumario.png` | **Sumário**: "Info Romaneio" + "Info Meu Roteiro" (separado) + botões (Ver Meu Roteiro · Ver Original · Tabelas) | §15.1 · RF-43 |
| `5-Visualizacao-de-Parada.png` | Mapa em **Meu roteiro**: marcadores (forma/cor=tipo/número/badge) + toggle Original\|Meu roteiro | §3 · ADR-008 |
| `6-Edica-parada-ponto-selecionado.png` | Painel: **endereço** selecionado: remover/incorporar/tornar âncora/inverter; pernas + detalhe do pacote | §5/§6/§9 |
| `7-Edicao-parada-ancora(veiculo)selecionado.png` | Painel: **âncora (parada do veículo)** selecionada: mover/resetar; resumo da parada | §2/§6/§9 |
| `8-Endereco-livre-sem-parada-atribuida.png` | **Ponto livre** (órfão): criar parada / incorporar na parada | §9 |
| `9-Edicao-nova-parada.png` | **Modo rascunho**: raio + candidatos sugeridos; âncora sugerida; editar raio | §4/§8 |

> **Convenção:** prefixo numérico = ordem do fluxo. O **modo Original** reusa o mesmo painel em **read-only** (não tem tela própria: ver `fluxo-modo-original.md` §5/§6).

## Identidade visual: `neonflux.md`

O arquivo [`neonflux.md`](./neonflux.md) é um **sistema de design de alta fidelidade** ("Neon Flux" / marca **"Eu Roteirizo"**): dark-native, gradiente **verde→ciano** (`#00FF9D`→`#00D1FF`), glows/glassmorphism, fontes **Sora/Geist/JetBrains Mono**.

> **Tema / fonte / estética = provisórios (decididos por ÚLTIMO).** Fonte **tanto faz** por ora. Cores de chrome **próximas** a essas, mas não fixas: o "Neon Flux" é exploração, não commit.
>
> **Locked (não muda):**
> - **Tema claro é o padrão** (com **dark** disponível): o claro garante a legibilidade **ao sol** (uso em campo).
> - **Paleta funcional de marcação:** **verde** = residencial · **azul** = comercial · **cinza** = indefinido · **amarelo** = badge. *(Já fixa em `fluxo` §3 / ADR-008 / `tema-tailwind` §3.)*

## Notas

- **Média fidelidade, conteúdo > estética:** estas telas travam **informação e interação**; a paleta final depende da decisão de identidade acima.
- **Fonte de verdade continua textual:** em caso de conflito imagem × doc, **o doc vale** (as imagens ilustram; os `.md` decidem). Ao mudar uma decisão, atualizar o `.md` primeiro.
