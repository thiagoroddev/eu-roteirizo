# Prompt para prototipação UI/UX — App "Roteirizador a pé"

> **Como usar:** cole este documento inteiro num gerador de UI (v0, Figma Make, Uizard, Galileo, etc.). É autocontido. Peça telas **mobile, verticais**. Se a ferramenta aceitar design system, use **shadcn/ui (Radix + Tailwind)**, estética flat e limpa. Gere **todas as telas listadas na seção 5**.
>
> **Atualizado:** 24/06/26 (alinhado aos requisitos em `docs/requisitos/` e ao fluxo em `docs/rascunhos/fluxo-roteirizacao.md`).

---

## 1. Visão geral do produto

App **mobile** para **entregadores** (caso de uso: motorista parceiro da Shopee no Brasil). O entregador importa uma planilha com **70–150 endereços** e **monta a rota manualmente, parada por parada**, porque a roteirização automática que ele recebe é ruim. O diferencial: **paradas a pé** — agrupar vários endereços próximos que se entrega caminhando, a partir de onde o veículo para.

Dentro do mapa há um **toggle de dois modos** (`Original | Meu roteiro`), e a execução é um fluxo de tela cheia:
1. **Original** (visualizar) — os pontos no mapa com **ícones PNG**, **read-only**. Modo legado; serve tanto romaneio multi-rota quanto rota única. **É o padrão.**
2. **Meu roteiro** (roteirizar) — montar a rota (criar paradas, ordenar, definir âncora, estimar tempo/distância) com **ícones SVG**, editável.
3. **Executar** — seguir a rota entrega por entrega, em campo (tela cheia).

> **Roteirizar vale para os dois tipos de arquivo:** rota única **e** uma rota **selecionada** de um romaneio multi-rota.

**Contexto físico de uso:** rua, sol forte, **uma mão**, pressa. Logo: alto contraste, **botões grandes**, e **mapa dominante** (pouca UI sobre o mapa).

---

## 2. Princípios de design (restrições)

- **Mobile-first**, telas verticais (≈ 360–412 px de largura). Pensar em TWA/Android.
- **Tema claro**, superfícies brancas, bordas finas (0.5px), cantos arredondados suaves. Sem gradientes/sombras pesadas.
- **Quando o mapa está visível, UI mínima:** o mapa ocupa quase tudo; informações ficam em **overlays compactos e colapsáveis** (HUD fino no topo, painel deslizante embaixo — "bottom sheet").
- **Botões grandes** na execução (alvo ≥ 48px).
- **Acessibilidade:** contraste alto; alvos de toque ≥ 44px.
- **Internacionalização:** **os marcadores do mapa NUNCA têm letra/texto** (só números) — o app vai pra outros países. Palavras ("Parada", "Endereço") só em rótulos de UI, fora do mapa.

### Paleta (identidade definida — ver `docs/arquitetura/tema-tailwind.md` / ADR-006)

**Chrome do app (marca "Cyanide Precision" — ciano):**
- **Ação primária / marca:** **ciano (`#0DC2D6`)**, com **texto escuro** no botão (`#00363D`).
- **Tema:** **claro + escuro** (troca automática por sistema; claro pro sol, escuro pra noite). Escuro = slate/navy (`#0B1326`).
- **Erro:** vermelho (`#BA1A1A`). **Formato:** arredondado/**pill** (botões `rounded-full`, cards 1rem).
- **Fonte:** **Hanken Grotesk**.

**Paleta funcional do mapa (independente da marca):**
- **Paradas e seus endereços:** cada parada **uma** cor de uma paleta **categórica** (teal `#0F6E56`, roxo, coral, âmbar, magenta, índigo…) — seleção = mesma cor com realce (anel), não outra cor.
- **Início da rota:** verde (`#2E9E4F`).
- **Endereço livre (não atribuído):** cinza desbotado (`#9AA0AA`).
- **Badge de contagem:** amarelo (`#F5B400`).
- Mapa: tiles claros estilo OpenStreetMap.

---

## 3. Sistema visual dos marcadores no mapa (CRÍTICO — seguir à risca)

Vale no modo **Meu roteiro** (SVG). Cada variável visual tem **um** significado. Não misturar.

| Variável | Significado |
|---|---|
| **Geometria** | **quadrado = Parada** · **círculo = Endereço** |
| **Número dentro** | ordem (1, 2, 3…). **Só número, sem letra.** |
| **Cor** | uma Parada e **todos os seus Endereços têm a MESMA cor**. Cinza desbotado = livre. Verde = início. |
| **Borda grossa** | **Âncora** (o endereço "1" onde o veículo para). |
| **Badge amarelo** (atrás/canto do marcador, com número) | **contagem**: numa Parada fechada = nº de endereços dela; num Endereço = nº de pacotes (só se > 1). |

**Linhas no mapa:**
- **Contínua** = trajeto de **veículo** (de âncora a âncora).
- **Tracejada em laço** = caminhada **a pé** dentro de uma parada (sai da âncora, passa nos endereços, volta).
- **Tracejada simples** = **sugestão** do próximo (some ao escolher).
- **Círculo tracejado** = **raio de agrupamento** ao criar uma parada (mostra quais endereços estão no alcance).

**Estados:**
- Parada **fechada** = quadrado colorido + número + badge amarelo (nº de endereços).
- Parada **selecionada** = expande: some o quadrado; aparecem os endereços como **círculos da cor da parada**; o "1" (âncora) é um **círculo de borda grossa**.
- **Só uma parada fica expandida por vez** (evita confusão de cores).

> **Regra de leitura, em uma frase:** *geometria = o quê; número = ordem; cor = de qual parada; borda grossa = âncora; badge amarelo = quantos.*

> No modo **Original**, os marcadores são os **ícones PNG legados** (casa/comercial), sem numeração de rota — é só visualização.

---

## 4. Navegação (estrutura do app)

- **Header** fixo: título + engrenagem (Configurações de Rota) + voltar quando aplicável.
- **Barra inferior (bottom nav):** **Mapa** | **Rotas**. (Relatórios/Perfil podem aparecer desabilitados/"em breve".)
- Dentro de **Mapa**, há um **toggle pequeno no topo: `Original | Meu roteiro`** (padrão **Original**). Aparece na rota única e numa rota **selecionada** de multi-rota. Em **Roteiro importado avulso**, o lado "Original" fica **desativado** (só "Meu roteiro").
- **Fluxo principal:** Tela inicial → escolher rota → **Sumário da rota** → **"Ver no mapa"** abre o mapa em **Original**; o usuário alterna para **"Meu roteiro"** para roteirizar. O **atalho** de um Roteiro na tela inicial abre o mapa **já em "Meu roteiro"**.
- **Execução** é tela cheia, aberta pelo botão **"Iniciar roteiro"** (que só aparece quando o roteiro está **completo**). Não é aba nem segmento do toggle.

---

## 5. As telas (gerar todas)

### Tela 1 — Inicial (upload + salvos)
- Título do app. Botão grande **"Enviar romaneio"** (upload de planilha XLSX/CSV).
- **Instruções em "spoiler"** (acordeão, fechado por padrão): ao expandir, explica o formato. Dois blocos: (a) multi-rota (planilha completa da empresa); (b) **rota única** — texto: *"Exporte sua rota no app oficial da empresa e importe aqui."*
- **Uma única lista de salvos** (não duas), com cards **tipados** distinguidos por **cor/rótulo**:
  - **Romaneio Único** · data · "Sem roteiro" **ou** o Roteiro atrelado (com atalho).
  - **Romaneio Multi** · data · os Roteiros atrelados (**1 por rota**), cada um com atalho.
  - **Roteiro Exportado** (importado avulso, sem romaneio) · data — atalho abre **direto em "Meu roteiro"**.
  - Tocar no **atalho de um Roteiro** abre o mapa **já em "Meu roteiro"**.
- Estado vazio amigável quando não há nada salvo.

> Exemplo de lista:
> | Tipo | Data | Roteiros |
> |---|---|---|
> | Romaneio Único | 12/02/24 | Sem roteiro |
> | Romaneio Multi | 10/01/24 | Roteiro B-1 · Roteiro A-2 |
> | Roteiro Exportado | 16/01/24 | — |

### Tela 2 — Sumário da rota (informação; ganha seção de Roteiro)
- Card de resumo com cabeçalho colorido "Sumário da rota: {nome}".
- Campos da planilha (mostrar "Sem dados" quando ausente): **AT, Hub, Data, Turno, Horário comercial, Pacotes, Paradas, Tempo estimado, Distância estimada, Bairros, Cidade**.
- **Os 3 botões NÃO mudam** (iguais em multi-rota e rota única): **Ver no Mapa** · **Tabela Simplificada** · **Tabela Original**. *(Não há botões "Roteirizar"/"Executar" aqui — isso vive no mapa.)*
- **Quando já existe um Roteiro**, aparece uma **seção nova de resumo do Roteiro** logo **abaixo** dos dados brutos: **Paradas · Distância (veículo / a pé / total) · Tempo (veículo / a pé / total)**.
- Acima do card: seletor de rota (dropdown) + busca por código (para multi-rota).

### Tela 3 — Mapa: modo "Original" (read-only)
- Mapa em tela quase cheia, com os pontos em **ícones PNG legados**. Toggle **`Original | Meu roteiro`** no topo (padrão **Original**).
- UI mínima: só o toggle e um botão de fechar/voltar (volta ao Sumário). Tocar num ponto abre um **tooltip/bottom-sheet** com dados do endereço (rua, bairro, CEP) + badge de inferência **comercial/residencial**.

### Tela 4 — Mapa: modo "Meu roteiro" (início da roteirização)
- Toggle em **"Meu roteiro"** → os ícones viram **SVG**. **Roteiro novo:** todos os pontos ficam **cinza (livres)** e há um botão inferior grande **"Iniciar roteirização"**.
- Tocar em **"Iniciar roteirização"** pede o **ponto inicial**: **GPS (meu local)** · **tocar no mapa** · **escolher um endereço de entrega**.
- Depois de iniciar: **HUD fino no topo** com 4 números — **Endereços X/Y** (faltando, principal) · **Paradas** · **Distância** · **Tempo**. (Pacotes A/B de forma secundária.) Início **verde** + **linha tracejada de sugestão** até o mais próximo.
- **Bottom-sheet "Montar rota":** "Próximo sugerido (mais próximo): {endereço} · a {dist} da referência" + botões **"Selecionar este endereço"** e **"Auto-roteirizar (rascunho editável)"**.

### Tela 5 — Criar parada (raio + Etiqueta do Pacote)
- Ao escolher um endereço para criar parada: **círculo tracejado do raio** (ex.: 50 m) em volta dele; os endereços **dentro do raio ficam destacados** (vão entrar na parada).
- **Bottom-sheet com card "Etiqueta do Pacote":** endereço (rua, bairro, CEP) + os números da **etiqueta física** (Parada {Stop} · Seq {Sequence}, que vêm da planilha) + **código** (SPX TN, fonte mono).
- Botão **"Criar parada · inclui N no raio (50 m)"**.

### Tela 6 — Endereço livre (órfão) selecionado
- Bottom-sheet com: rótulo "Endereço livre" + ações **"Criar nova parada (será a N)"** e **"Adicionar a uma parada"** (dropdown pré-selecionando a **parada mais próxima**).
- Abaixo, o card **"Etiqueta do Pacote"**. Se for **multi-pacote**, listar cada pacote (Vol 1, Vol 2…) com seu código e etiqueta.

### Tela 7 — Parada selecionada (expandida)
- No mapa: a parada vira seus **endereços-círculos** (cor da parada); **âncora = círculo "1" de borda grossa**; **laço tracejado a pé** ligando âncora → endereços → âncora; **linha contínua de veículo** chegando na âncora.
- Bottom-sheet: "Parada N · X endereços · Y pacotes · ~Z min a pé". **Lista ordenada (arrastável para reordenar)** dos endereços, com a âncora marcada. Botões: **Adicionar endereço** · **Trocar âncora** · **Desfazer parada** (destrutivo, mas avisa que os endereços voltam a livres — entregas nunca somem).
- **Âncora:** é **sempre o 1º endereço** da parada (onde o veículo para). **"Trocar âncora"** escolhe outro **endereço da parada** e **reordena a pé a partir dele** automaticamente. (Não há âncora "ao vivo por GPS".)

### Tela 8 — Endereço dentro de uma parada (selecionado)
- Bottom-sheet com card **"Etiqueta do Pacote"** do endereço (+ "pertence à Parada N") e botões **"Tornar âncora"** e **"Remover da parada"**.

### Tela 9 — Rascunho salvo + Executar
- O Roteiro é **salvo automaticamente como rascunho** (mesmo **incompleto**) — **não** há botão "Salvar" travado; pode-se sair e voltar que continua salvo.
- O botão **"Iniciar roteiro"** (executar) **só aparece quando `0 faltando`** (HUD). Enquanto falta endereço, em vez dele há um aviso suave: "Faltam N endereços para poder executar".

### Tela 10 — Rotas salvas (aba "Rotas")
- A **mesma lista tipada da Tela 1** (Romaneios + Roteiros), agora pela aba **Rotas**. O atalho de um Roteiro abre o mapa em **"Meu roteiro"** (e, se completo, permite **Iniciar roteiro**).
- Ações: **Importar JSON** (Roteiro pronto — receber de um ajudante / outro aparelho) · **Importar planilha** (novo romaneio) · **Exportar** (por Roteiro).

### Tela 11 — Execução (tela cheia)
- Topo: **progresso** ("31/90 pacotes", barra, "34% concluído") + **previsão de término** ("~16:45") + "4,2 km restantes".
- **Alternar mapa ↔ lista:** mapa compacto destacando a próxima entrega, **ou** um **modo lista** (sem mapa) das entregas na ordem.
- **Bottom-sheet (card da próxima entrega):**
  - Contexto da rota: "parada 5 de 12 · endereço 2 de 4 · 2,1 km (8 min)".
  - Endereço grande (rua, complemento, bairro).
  - **Identificação do pacote:** etiqueta (Parada {Stop} · Seq {Sequence}, números grandes para achar na sacola) + código (SPX TN, mono). Se multi-pacote, listar cada um.
  - Botões: **"Abrir GPS"** (deep link Maps/Waze); **"Concluir entrega"** (grande, primário — confirma e avança automaticamente); **"Desfazer"** (reverte a última); **avançar / retroceder** (muda o foco manualmente); **"Pausar rota"** (sai da execução **salvando onde parou** — resumível).
  - **Durante a execução o roteiro NÃO é editável.**
  - **NÃO incluir botão de contato.**

### Tela 12 — Configurações de Rota (engrenagem)
- Campos: **Raio de agrupamento (m)**, **Velocidade a pé (km/h)**, **Tempo por entrega (min)**, **Velocidade do veículo (km/h)**. Botão Salvar.

### (Componente) Legenda do mapa
- Um botão "?" no canto do mapa abre uma **legenda colapsável** que espelha a seção 3 (geometria, cor, badge amarelo, borda grossa, tipos de linha).

---

## 6. O que NÃO fazer (anti-requisitos)

- ❌ **Letras nos marcadores** (nada de "P1", "S1", "E1") — só números.
- ❌ **Botão de contato** na execução — não existe contato do destinatário.
- ❌ **Editar o roteiro durante a execução** — a execução é travada; só "Pausar rota" libera a edição de novo.
- ❌ **Exigir completude para salvar** — salvar é **rascunho livre** (auto-save); a completude (`0 faltando`) só libera o **executar**.
- ❌ **Âncora "ao vivo por GPS"** — a âncora é um **endereço da parada** (sempre o 1º), mudada só pelo usuário.
- ❌ **"Área de risco" / "Correios entrega aqui?"** — recurso removido; não incluir.
- ❌ **Botões "Roteirizar"/"Executar" no Sumário** — a ação vive no mapa (toggle `Original | Meu roteiro` + botão inferior); o Sumário só ganha uma **seção de resumo do Roteiro**.
- ❌ **Encher o mapa de UI** — quando o mapa aparece, manter overlays mínimos.
- ❌ Inventar telas de login/cadastro — o app é **sem login** (offline, local).

---

## 7. Dados de exemplo (usar conteúdo realista brasileiro)

- Endereços: "Rua das Palmeiras, 55 — Botafogo — 22270-070"; "Av. Nossa Senhora de Copacabana, 31, Apto 906 — Copacabana — 22010-121".
- Código de pacote (SPX TN): "BR2649270672308".
- Etiqueta: "Parada 32 · Seq 47".
- Multi-pacote: mesmo endereço com "Vol 1" e "Vol 2".
- HUD exemplo (Meu roteiro): Endereços 40/52 · Paradas 8 · 6,2 km · 1h48.
- Seção de resumo do Roteiro (Sumário): Paradas 8 · Veículo 5,4 km / 14 min · A pé 0,8 km / 1h34 · Total 6,2 km / 1h48.
- Nomes: "Minha rota", "Rota Centro — 22/06", "Roteiro B-1".
- Cards da tela inicial: "Romaneio Único · 12/02 · Sem roteiro"; "Romaneio Multi · 10/01 · Roteiro B-1 · Roteiro A-2"; "Roteiro Exportado · 16/01".

---

## 8. Tom visual de referência

App de trabalho, sério e direto (não lúdico). Inspiração de organização: apps de entrega/logística (Circuit, RoadWarrior) — mas **mais limpo, em português, e com o diferencial das paradas a pé**. Clareza e velocidade de leitura acima de enfeite.
