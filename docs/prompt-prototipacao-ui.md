# Prompt para prototipação UI/UX — App "Roteirizador a pé"

> **Como usar:** cole este documento inteiro num gerador de UI (v0, Figma Make, Uizard, Galileo, etc.). É autocontido. Peça telas **mobile, verticais**. Se a ferramenta aceitar design system, use **shadcn/ui (Radix + Tailwind)**, estética flat e limpa. Gere **todas as telas listadas na seção 5**.

---

## 1. Visão geral do produto

App **mobile** para **entregadores** (caso de uso: motorista parceiro da Shopee no Brasil). O entregador importa uma planilha com **70–150 endereços** e **monta a rota manualmente, parada por parada**, porque a roteirização automática que ele recebe é ruim. O diferencial: **paradas a pé** — agrupar vários endereços próximos que se entrega caminhando, a partir de onde o veículo para.

Três modos de uso:
1. **Visualizar** — só olhar os pontos no mapa (modo legado, também serve romaneios multi-rota).
2. **Roteirizar** — montar a rota (criar paradas, ordenar, estimar tempo/distância).
3. **Executar** — seguir a rota entrega por entrega, em campo.

**Contexto físico de uso:** rua, sol forte, **uma mão**, pressa. Logo: alto contraste, **botões grandes**, e **mapa dominante** (pouca UI sobre o mapa).

---

## 2. Princípios de design (restrições)

- **Mobile-first**, telas verticais (≈ 360–412 px de largura). Pensar em TWA/Android.
- **Tema claro**, superfícies brancas, bordas finas (0.5px), cantos arredondados suaves. Sem gradientes/sombras pesadas.
- **Quando o mapa está visível, UI mínima:** o mapa ocupa quase tudo; informações ficam em **overlays compactos e colapsáveis** (HUD fino no topo, painel deslizante embaixo — "bottom sheet").
- **Botões grandes** na execução (alvo ≥ 48px).
- **Acessibilidade:** contraste alto; alvos de toque ≥ 44px.
- **Internacionalização:** **os marcadores do mapa NUNCA têm letra/texto** (só números) — o app vai pra outros países. Palavras ("Parada", "Endereço") só em rótulos de UI, fora do mapa.

### Paleta sugerida (ajustável)
- **Ação primária / marca:** vermelho-coral (`#C0392B`).
- **Paradas e seus endereços:** teal (`#0F6E56`) — seleção = mesma cor com realce (anel), não outra cor.
- **Início da rota:** verde (`#2E9E4F`).
- **Endereço livre (não atribuído):** cinza desbotado (`#9AA0AA`).
- **Badge de contagem:** amarelo (`#F5B400`).
- Mapa: tiles claros estilo OpenStreetMap.

---

## 3. Sistema visual dos marcadores no mapa (CRÍTICO — seguir à risca)

Cada variável visual tem **um** significado. Não misturar.

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

---

## 4. Navegação (estrutura do app)

- **Header** fixo: título + engrenagem (Configurações de Rota) + voltar quando aplicável.
- **Barra inferior (bottom nav):** **Mapa** | **Rotas**. (Relatórios/Perfil podem aparecer desabilitados/"em breve".)
- Dentro de **Mapa**, quando é rota única, há um **toggle pequeno no topo: [Visualizar | Roteirizar]**.
- **Fluxo principal:** Tela inicial → escolher rota → **Sumário da rota** → botões abrem o **Mapa** no modo certo.
- **Execução** é tela cheia, aberta por um botão (não é aba nem segmento do toggle).

---

## 5. As telas (gerar todas)

### Tela 1 — Inicial (upload)
- Título do app. Botão grande **"Enviar romaneio"** (upload de planilha XLSX/CSV).
- **Instruções em "spoiler"** (acordeão, fechado por padrão): ao expandir, explica o formato. Dois blocos: (a) multi-rota (planilha completa da empresa); (b) **rota única** — texto: *"Exporte sua rota no app oficial da empresa e importe aqui."*
- Seção **"Romaneios salvos"** e **"Minhas rotas"** (rotas únicas já planejadas) — cards clicáveis para reabrir sem reenviar.
- Estado vazio amigável quando não há nada salvo.

### Tela 2 — Sumário da rota (card reaproveitado, vira "lançador")
- Card de resumo com cabeçalho colorido "Sumário da rota: {nome}".
- Campos (mostrar "Sem dados" quando ausente): **AT, Hub, Data, Turno, Horário comercial, Pacotes, Paradas, Tempo estimado, Distância estimada, Bairros, Cidade**.
- **Botões adaptam ao modo:**
  - Multi-rota: **Ver no Mapa** · Tabela Simplificada · Tabela Original.
  - Rota única: **Ver no Mapa (Visualizar)** · **Roteirizar** · **Executar** (só se já houver roteirização salva) · Tabelas.
- Acima do card: seletor de rota (dropdown) + busca por código (para multi-rota).

### Tela 3 — Mapa: Visualizar
- Mapa em tela quase cheia, com os pontos. Toggle **[Visualizar | Roteirizar]** no topo (rota única).
- UI mínima: só o toggle e um botão de fechar/voltar. Tocar num ponto abre um **tooltip/bottom-sheet** com dados do endereço (rua, bairro, CEP) + badge de inferência **comercial/residencial**.

### Tela 4 — Mapa: Roteirizar (início)
- Toggle no **Roteirizar**. **HUD fino no topo** com 4 números: **Endereços X/Y** (faltando, principal) · **Paradas** · **Distância** (veículo+a pé) · **Tempo total**. (Mostrar também pacotes A/B de forma secundária.)
- Mapa com **pontos cinza (livres)**, **início verde**, e **linha tracejada de sugestão** até o mais próximo.
- **Bottom-sheet "Montar rota":** mostra "Próximo sugerido (mais próximo): {endereço} · a {dist} da referência" + botões **"Selecionar este endereço"** e **"Auto-roteirizar (rascunho editável)"**.

### Tela 5 — Criar parada (raio + Etiqueta do Pacote)
- Ao tocar num endereço para criar parada: **círculo tracejado do raio** (ex.: 50 m) em volta dele; os endereços **dentro do raio ficam destacados** (vão entrar na parada).
- **Bottom-sheet com card "Etiqueta do Pacote":** endereço (rua, bairro, CEP) + os números da **etiqueta física** (Parada {Stop} · Seq {Sequence}, que vêm da planilha) + **código** (SPX TN, fonte mono).
- Botão **"Criar parada · inclui N no raio (50 m)"**.

### Tela 6 — Endereço livre (órfão) selecionado
- Bottom-sheet com: rótulo "Endereço livre" + ações **"Criar nova parada (será a N)"** e **"Adicionar a uma parada"** (dropdown pré-selecionando a **parada mais próxima**).
- Abaixo, o card **"Etiqueta do Pacote"**. Se for **multi-pacote**, listar cada pacote (Vol 1, Vol 2…) com seu código e etiqueta.

### Tela 7 — Parada selecionada (expandida)
- No mapa: a parada vira seus **endereços-círculos** (cor da parada); **âncora = círculo "1" de borda grossa**; **laço tracejado a pé** ligando âncora → endereços → âncora; **linha contínua de veículo** chegando na âncora.
- Bottom-sheet: "Parada N · X endereços · Y pacotes · ~Z min a pé". **Lista ordenada (arrastável para reordenar)** dos endereços, com a âncora marcada. Botões: **Adicionar endereço** · **Trocar âncora** · **Desfazer parada** (destrutivo, mas avisa que os endereços voltam a livres — entregas nunca somem).

### Tela 8 — Endereço dentro de uma parada (selecionado)
- Bottom-sheet com card **"Etiqueta do Pacote"** do endereço (+ "pertence à Parada N") e botões **"Tornar âncora"** e **"Remover da parada"**.

### Tela 9 — Completude + Salvar
- HUD mostrando **0 faltando** (tudo atribuído). Botão **"Salvar rota planejada"** habilitado (desabilitado enquanto falta endereço). Texto de ajuda quando bloqueado: "Faltam N endereços para poder salvar".

### Tela 10 — Rotas salvas (aba Rotas)
- Lista de rotas salvas (cards): nome, data, nº de endereços, distância. Botão **"Executar"** em cada.
- Ações: **Importar JSON** (rota já configurada — para receber de um ajudante) e **Importar planilha** (começa planejamento novo). Botão de **Exportar** por rota.

### Tela 11 — Execução
- Topo: **progresso** ("31/90 pacotes", barra, "34% concluído") + **previsão de término** ("~16:45") + "4,2 km restantes".
- Mapa compacto destacando a próxima parada/endereço.
- **Bottom-sheet (card da próxima entrega):**
  - Contexto da rota: "parada 5 de 12 · endereço 2 de 4 · 2,1 km (8 min)".
  - Endereço grande (rua, complemento, bairro).
  - **Identificação do pacote:** etiqueta (Parada {Stop} · Seq {Sequence}, números grandes para achar na sacola) + código (SPX TN, mono). Se multi-pacote, listar cada um.
  - Botões: **"Abrir GPS"** (deep link Maps/Waze) e, embaixo, **"Entrega feita"** (grande, primário — confirma e avança automaticamente para a próxima).
  - **NÃO incluir botão de contato.**

### Tela 12 — Configurações de Rota (engrenagem)
- Campos: **Raio de agrupamento (m)**, **Velocidade a pé (km/h)**, **Tempo por entrega (min)**, **Velocidade do veículo (km/h)**. Botão Salvar.

### (Componente) Legenda do mapa
- Um botão "?" no canto do mapa abre uma **legenda colapsável** que espelha a seção 3 (geometria, cor, badge amarelo, borda grossa, tipos de linha).

---

## 6. O que NÃO fazer (anti-requisitos)

- ❌ **Letras nos marcadores** (nada de "P1", "S1", "E1") — só números.
- ❌ **Botão de contato** na execução — não existe contato do destinatário.
- ❌ **"Área de risco" / "Correios entrega aqui?"** — recurso removido; não incluir.
- ❌ **Encher o mapa de UI** — quando o mapa aparece, manter overlays mínimos.
- ❌ Inventar telas de login/cadastro — o app é **sem login** (offline, local).

---

## 7. Dados de exemplo (usar conteúdo realista brasileiro)

- Endereços: "Rua das Palmeiras, 55 — Botafogo — 22270-070"; "Av. Nossa Senhora de Copacabana, 31, Apto 906 — Copacabana — 22010-121".
- Código de pacote (SPX TN): "BR2649270672308".
- Etiqueta: "Parada 32 · Seq 47".
- Multi-pacote: mesmo endereço com "Vol 1" e "Vol 2".
- HUD exemplo: Endereços 40/52 · Paradas 8 · 6,2 km · 1h48.
- Nomes de rota: "Minha rota", "Rota Centro — 22/06".

---

## 8. Tom visual de referência

App de trabalho, sério e direto (não lúdico). Inspiração de organização: apps de entrega/logística (Circuit, RoadWarrior) — mas **mais limpo, em português, e com o diferencial das paradas a pé**. Clareza e velocidade de leitura acima de enfeite.
