# Fluxo do Modo Original (Visualizador) — Base para o Protótipo

> Passo a passo, estados visuais e **interações de clique** do modo **Original** (visualizar). É o visualizador legado evoluído: **espelha o app oficial da Shopee**. Documento de trabalho — refinável. **Isolado do roteirizar:** não se confunde com `fluxo-roteirizacao.md` (modo Meu roteiro). Segue a **[ADR-008](../arquitetura/ADR/ADR-008.md)** (marcadores SVG do Original).
>
> 🖼️ **Referência visual:** vocabulário dos marcadores em [`prototipos/marcadores-svg/index.html`](../../prototipos/marcadores-svg/index.html) · **telas de média fidelidade** em [`prototipos/telas-media-fidelidade/`](../../prototipos/telas-media-fidelidade/) (ver o `README` do índice). Este `.md` é a fonte **textual** e **decide** em caso de conflito; as imagens **ilustram**. Manter em sincronia.

---

## 1. Em uma frase

Visualizador **read-only** que mostra, no mapa, **uma parada por marcador** (espelhando o app oficial): número da parada no ícone, cor por tipo (residencial/comercial), e o detalhe (endereços e pacotes) revelado **sob demanda** ao clicar. O usuário **não monta** rota aqui — só consulta.

---

## 2. Vocabulário (entidades)

| Termo | O que é |
|---|---|
| **Parada (Stop)** | Agrupamento da planilha pela coluna **Stop**. No mapa é **um** marcador. Pode conter **um ou vários** endereços. |
| **Endereço** (ponto) | Uma localização única dentro da parada (rua + número, complemento, bairro, CEP). Pode ter **vários pacotes**. |
| **Pacote** | Uma encomenda individual (uma linha/etiqueta, com `SPX TN` e **sequência**). Vários pacotes podem estar no mesmo endereço. |
| **Representante da parada** | O endereço que **representa** a parada no mapa quando ela está colapsada. **Por ora o de menor sequência** (a confirmar em campo se o oficial usa primeiro/centro/último). |

> **Hierarquia (3 níveis):** **Parada (Stop)** → **Endereços** → **Pacotes**. O drill-down da UI segue essa espinha: o mapa mostra **paradas** → clicar numa parada revela seus **endereços** → clicar num endereço revela seus **pacotes** (popup, §6).
>
> **Não existe "Âncora" aqui.** O conceito de **onde o veículo para** é **exclusivo do roteirizar** (lá é a *parada do veículo*, um ponto na rua). No Original não há rota nem veículo — a borda grossa significa **seleção** (§5).

---

## 3. Sistema visual dos marcadores

Detalhe completo na **ADR-008**. Resumo das variáveis (cada uma com **um** significado):

| Variável | Significado |
|---|---|
| **Geometria** *(RF-020.5)* | **quadrado** = **parada colapsada** (sempre, mesmo com 1 endereço) · **círculo** = **endereço** (parada expandida/selecionada; a parada de 1 endereço também vira círculo ao ser selecionada) |
| **Número** (dentro) *(iteração 26/06)* | **quadrado colapsado** = **número da parada (Stop)**. **Círculos expandidos** = **também o nº da parada**, repetido em **todos** os círculos da parada (deixa claro que são da mesma parada). *(A sequência da planilha é por **pacote** → não rotula um endereço; vai ao popup. Abandonado o `parada-sequência`.)* |
| **Cor** | **tipo**: **verde** = residencial · **azul** = comercial · **cinza** = indefinido. **Comercial vence:** parada com ≥1 comercial fica **azul**. |
| **Badge amarelo** (dentro da cabeça) *(RF-020.5)* | contagem, só se > 1 — ícone **caixa** = nº de pacotes (num endereço) · ícone **pino** = nº de endereços (numa parada). Fica **dentro** do ícone; o número sobe quando há badge, centraliza quando não há. |
| **Ponta fina** | aponta o **ponto exato** no mapa, mesmo com marcadores amontoados |
| **Borda grossa branca + sombra colorida** | **selecionado** (§5) — **não** é âncora |

> A cor por **tipo** vale **só no Original**. No Meu roteiro o mesmo componente recebe cor **por parada** (paleta categórica) — ver `fluxo-roteirizacao.md` §3.

---

## 4. Estados do marcador de parada

| Estado | Como aparece |
|---|---|
| **Colapsada** (padrão) | **Um** marcador **quadrado** (sempre, mesmo com 1 endereço) no representante da parada (menor sequência), com **número da parada**, cor por tipo e badge de **nº de endereços** (se > 1; ou **nº de pacotes** se a parada tem 1 só endereço com > 1 pacote). Os demais endereços **não** aparecem no mapa. |
| **Expandida** (após clique) | O quadrado **vira círculo**; aparecem os **endereços** da parada como **círculos** coloridos por tipo, **todos com o nº da parada** + **borda branca**. O mapa **dá foco** (zoom máximo) na parada. Cada círculo pode ter badge de **nº de pacotes** (se > 1). O **selecionado** fica **maior** + **glow neon** na cor clara do tipo, e por cima dos vizinhos. |

> **Só uma parada fica expandida por vez** (assumido — evita poluição; alinhado ao roteirizar). Parada de **um único endereço** é um **quadrado** colapsado (nº da parada); ao ser **selecionada** vira um **círculo** `parada-sequência` e abre o **painel inferior** (§6).

---

## 5. Interações (clique)

**Clique numa parada colapsada (quadrado) → expandir:**
- Os **endereços** da parada aparecem no mapa como **círculos**, cada um na cor do seu **tipo** (residencial/comercial/indefinido).
- O quadrado representante **vira círculo** também.
- **Todos** os círculos mostram **o número da parada** + **borda branca** — é assim que se sabe quais endereços são daquela parada *(iteração 26/06; o `parada-sequência` foi abandonado — `Sequence` é por pacote)*.
- O **selecionado** ganha destaque: **maior** + **glow neon** na cor clara do tipo + sobe na pilha (z-index) acima dos vizinhos.
- A expansão **permanece** até o usuário expandir **outra parada** (troca o foco) ou **clicar fora** (colapsa).

**Clique numa outra parada:**
- A parada anterior **colapsa** (endereços somem, volta a quadrado no representante) e a nova **expande**. *(Assumido: foco único.)*

**Clique fora (mapa vazio):**
- Os endereços da parada expandida **somem**; sobra **só o representante** (menor sequência), que **volta a ser quadrado**.
- **(rev. 05/07/26)** O **painel inferior mantém a última parada** — **nunca existe "nenhuma parada selecionada"**: o mapa **abre com a menor parada** (menor `Stop`) já selecionada e dali em diante o painel sempre reflete a última. Clicar fora só colapsa os círculos no mapa. *(Supersede o "limpa a seleção" anterior — §8.2.)*

**Clique num endereço (círculo) → painel inferior (§6):**
- Abre o **painel inferior** do endereço — **o mesmo componente do Meu roteiro**, em modo **read-only**.
- O endereço clicado fica **selecionado**: ganha **borda grossa branca + sombra na cor do seu tipo**.
- Clicar em **outro endereço da mesma parada** troca o conteúdo do painel/seleção, **sem colapsar**. *(Assumido.)*

> **Seleção (§5):** a borda grossa branca + sombra colorida marca **o último marcador clicado** (parada ou endereço). É um realce de **seleção/foco**, não de âncora (que não existe no Original).

---

## 6. Painel inferior da parada (read-only) — **rev. 05/07/26**

O painel inferior (**MapPanel**) é **persistente e sempre visível** — nunca fecha e nunca está vazio. Árvore de componentes e contratos em [`docs/design/arvore-componentes-mapa.md`](../design/arvore-componentes-mapa.md) (TASK-RF-023). Estrutura:

- **Colapsado (padrão):** só o **cabeçalho** — rótulo do modo ("Modo visualização"), **steppers ‹ ›** (parada anterior/próxima, na ordem do `Stop`), **`Parada {Stop}` + endereço do representante** e métricas (`N endereços · N pacotes`). Expande por **gesto de arrastar** (snap points — lib `vaul`, aprovada 05/07).
- **Expandido:** a **lista de endereços da parada** (ordem = `Sequence` da planilha; mini-marcador na cor do tipo com o **número da planilha** — sem numeração nova). Tocar num endereço (no mapa ou na lista) **expande o item** com:
  - **Lista de pacotes** — cada um com **etiqueta** (`Parada {Stop} · Seq {Sequence}`), **código** (`SPX TN`) e **tipo em texto** ("Comercial"/"Residencial"/"Indefinido");
  - **Endereço completo** (rua + número, bairro, CEP) e **complemento**;
  - Link **Abrir no Google Maps**.
- **Sem ações de edição no Original** — os slots (ações contextuais, banner, footer CTA, drag) existem na estrutura e são preenchidos pelo Meu roteiro (RF-006) e pela execução (RF-009).

> Um endereço pode ter **vários pacotes** (multi-pacote): o painel os lista todos. É aqui que os pacotes "escondidos do mapa" ficam acessíveis.
>
> **Painel compartilhado:** este painel é o **mesmo dos dois modos**. No Original é **read-only** (sem âncora, sem edição) e mostra os **números da planilha** (Stop/Sequence); no Meu roteiro é **editável** e mostra os números da rota (Pn/En) + âncora + ações. **Alternar Original ↔ Meu roteiro só troca os dados/slots — a estrutura da UI é a mesma.**

---

## 7. Diferenças vs. modo Roteirizar (não confundir)

| Aspecto | **Original** (este doc) | **Meu roteiro** (`fluxo-roteirizacao.md`) |
|---|---|---|
| Papel | Visualizar (read-only) | Construir a rota (editável) |
| Marcador por | **Parada (Stop)** | Parada (agrupada pelo usuário) |
| **Número** | número da **parada (Stop)** | **ordem** (ordinal) da rota |
| **Cor** | **tipo** (res/com/indef) | **tipo** (res/com/indef) — **igual** (decisão 26/06) |
| **Veículo / âncora** | **não existe** | é a **parada do veículo** (marcador próprio na rua, não um endereço) |
| **Borda grossa** | **selecionado** | **selecionado** (a parada do veículo é marcador próprio, não borda) |
| Origem dos dados | espelha o app oficial | montado pelo usuário |

> O **componente de marcador é o mesmo** (parametrizável); só mudam os **valores** das props (número, significado da borda). **E o painel inferior também é o mesmo** — Original **read-only** (sem âncora/edição), Meu roteiro **editável**. **Alternar Original ↔ Meu roteiro só troca os dados mostrados.** Sem duplicação.

---

## 8. Decisões assumidas (a confirmar)

Pontos que decidi por padrão razoável e que valem confirmação:

1. **Foco único:** só uma parada expandida por vez; expandir outra colapsa a anterior.
2. ~~**Limpar seleção ao clicar fora**~~ — **SUPERSEDED (decisão do humano 05/07/26):** clicar fora colapsa os círculos no mapa, mas o **painel mantém a última parada**; o mapa **abre com a menor parada selecionada** — nunca há "nenhuma selecionada".
3. **Painel não colapsa:** clicar de endereço para endereço (mesma parada) troca o conteúdo do painel/seleção sem fechar a expansão.
4. **Sombra da seleção = cor do tipo** do marcador selecionado (coerente com o neon).
5. **Representante = menor sequência** (a confirmar em campo: primeiro/centro/último).

---

## 9. Pendências / a confirmar

- [ ] **Posição do representante na parada — confirmar em campo (primeiro/centro/último).** Implementado (TASK-RF-020.2) como **menor sequência entre os endereços com coordenada válida**. Só dá pra saber qual o app oficial usa entregando.
- [x] **Coordenadas divergentes no mesmo Stop / mesmo prédio:** RESOLVIDO (26/06) — endereço é identificado **pelo prédio (rua + número)** do `Destination Address` (fallback coordenada); pacotes do mesmo prédio com complemento/coords diferentes colapsam em **1 ícone** (corrige o bug dos ícones duplicados). Representante = menor sequência válida; **aviso só em DEV** quando a parada está **dispersa** (> 100 m do representante, `haversine`).
- [x] **Número nos endereços expandidos:** RESOLVIDO (26/06, RF-020.5 — **revisa** a decisão de 25/06) — **todos** os círculos expandidos mostram **`parada-sequência`** (ex.: `18-49`), **inclusive o representante**. A sequência é a **da planilha** no modo Original (no roteirização reinicia `1..N` por parada). Antes: "só o representante mantém número, demais sem número".
- [x] **Forma colapsada:** RESOLVIDO (26/06, RF-020.5) — parada colapsada é **sempre quadrado** (mesmo com 1 endereço); círculo passou a ser o estado **expandido/selecionado**.
- [ ] Os 5 pontos do §8.

---

## Última Atualização

- **Data:** 25/06/26
- **Por:** criação do fluxo do modo Original (interações de clique: expandir/colapsar parada, seleção por borda grossa, detalhe do endereço com pacotes). Esclarecido que **não há âncora** no Original. Acompanha ADR-008.
- **Atualização 26/06/26:** o **popup** do endereço vira **painel inferior** — **o mesmo componente do Meu roteiro**, em **read-only** (sem âncora, sem edição), mostrando os **números da planilha** (Stop/Sequence). **Painel único nos dois modos:** alternar Original ↔ Meu roteiro **só troca os dados**, não a estrutura. Cor = **tipo** nos dois modos (a "paleta por parada" foi aposentada). Afeta §5/§6/§7/§8.
- **Atualização 05/07/26 (TASK-RF-023.1 — decisões do humano):** o painel vira **persistente/sempre visível** e **centrado na parada** (colapsado = modo + steppers ‹ › + `Parada {Stop}` + endereço + métricas; expande por **gesto** — `vaul` aprovada; lista de endereços → drill-down até pacotes); **nunca há "nenhuma parada selecionada"** (abre com a **menor parada**; clique fora não esvazia — supersede §8.2). Árvore de componentes/contratos em `docs/design/arvore-componentes-mapa.md`. Afeta §5/§6/§8.
