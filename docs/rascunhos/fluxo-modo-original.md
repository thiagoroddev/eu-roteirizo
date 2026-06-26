# Fluxo do Modo Original (Visualizador) — Base para o Protótipo

> Passo a passo, estados visuais e **interações de clique** do modo **Original** (visualizar). É o visualizador legado evoluído: **espelha o app oficial da Shopee**. Documento de trabalho — refinável. **Isolado do roteirizar:** não se confunde com `fluxo-roteirizacao.md` (modo Meu roteiro). Segue a **[ADR-008](../arquitetura/ADR/ADR-008.md)** (marcadores SVG do Original).
>
> 🖼️ **Referência visual:** [`prototipos/marcadores-svg/index.html`](../../prototipos/marcadores-svg/index.html) — vocabulário dos marcadores. Este `.md` é a fonte **textual**; o HTML é a fonte **visual**. Manter os dois em sincronia.

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
> **Não existe "Âncora" aqui.** Âncora é conceito **exclusivo do roteirizar** (onde o veículo para). No Original não há rota nem âncora — a borda grossa significa outra coisa (§5).

---

## 3. Sistema visual dos marcadores

Detalhe completo na **ADR-008**. Resumo das variáveis (cada uma com **um** significado):

| Variável | Significado |
|---|---|
| **Geometria** *(RF-020.5)* | **quadrado** = **parada colapsada** (sempre, mesmo com 1 endereço) · **círculo** = **endereço** (parada expandida/selecionada; a parada de 1 endereço também vira círculo ao ser selecionada) |
| **Número** (dentro) *(RF-020.5)* | **quadrado colapsado** = **número da parada (Stop)**. **Círculos expandidos** = **`parada-sequência`** (ex.: `18-49`; sequência **da planilha** no Original) — **todos** os círculos, **incl. o representante**. |
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
| **Expandida** (após clique) | O quadrado **vira círculo**; aparecem os **endereços** da parada como **círculos** coloridos por tipo. **Todos** mostram **`parada-sequência`** (ex.: `18-49`, `18-50`), **inclusive o representante** — assim dá pra saber quais endereços são daquela parada. Cada círculo pode ter badge de **nº de pacotes** (se > 1 naquele endereço). |

> **Só uma parada fica expandida por vez** (assumido — evita poluição; alinhado ao roteirizar). Parada de **um único endereço** é um **quadrado** colapsado (nº da parada); ao ser **selecionada** vira um **círculo** `parada-sequência` e abre o popup (§6).

---

## 5. Interações (clique)

**Clique numa parada colapsada (quadrado) → expandir:**
- Os **endereços** da parada aparecem no mapa como **círculos**, cada um na cor do seu **tipo** (residencial/comercial/indefinido).
- O quadrado representante **vira círculo** também.
- **Todos** os círculos mostram **`parada-sequência`** (ex.: `18-49`) — é assim que se sabe quais endereços são daquela parada *(RF-020.5; antes os demais ficavam sem número)*.
- A expansão **permanece** até o usuário expandir **outra parada** (troca o foco) ou **clicar fora** (colapsa).

**Clique numa outra parada:**
- A parada anterior **colapsa** (endereços somem, volta a quadrado no representante) e a nova **expande**. *(Assumido: foco único.)*

**Clique fora (mapa vazio):**
- Os endereços da parada expandida **somem**; sobra **só o representante** (menor sequência), que **volta a ser quadrado**.
- A seleção é **limpa** (some a borda grossa). *(Assumido.)*

**Clique num endereço (círculo) → popup (§6):**
- Abre o popup do endereço.
- O endereço clicado fica **selecionado**: ganha **borda grossa branca + sombra na cor do seu tipo**.
- Clicar em **outro endereço da mesma parada** move a seleção e troca o popup, **sem colapsar**. *(Assumido.)*

> **Seleção (§5):** a borda grossa branca + sombra colorida marca **o último marcador clicado** (parada ou endereço). É um realce de **seleção/foco**, não de âncora (que não existe no Original).

---

## 6. Popup do endereço

Ao clicar num endereço (círculo), abre um popup com:

- **Lista de pacotes** daquele endereço — cada item com **código** (`SPX TN`) e **sequência**.
- **Endereço completo** (rua + número, bairro, CEP).
- **Complemento** (o texto que alimenta a inferência de tipo).
- **Tipo** — **"Comercial"**, **"Residencial"** ou **"Indefinido"**, escrito **em texto**.

> Um endereço pode ter **vários pacotes** (multi-pacote): o popup os lista todos, cada um com seu código e sequência. É aqui que os pacotes "escondidos do mapa" ficam acessíveis.

---

## 7. Diferenças vs. modo Roteirizar (não confundir)

| Aspecto | **Original** (este doc) | **Meu roteiro** (`fluxo-roteirizacao.md`) |
|---|---|---|
| Papel | Visualizar (read-only) | Construir a rota (editável) |
| Marcador por | **Parada (Stop)** | Parada (agrupada pelo usuário) |
| **Número** | número da **parada (Stop)** | **ordem** (ordinal) da rota |
| **Cor** | **tipo** (res/com/indef) | **de qual parada** (paleta categórica) |
| **Âncora** | **não existe** | existe (borda grossa = âncora) |
| **Borda grossa** | **selecionado** | **âncora** |
| Origem dos dados | espelha o app oficial | montado pelo usuário |

> O **componente de marcador é o mesmo** (parametrizável); só mudam os **valores** das props (cor, número, significado da borda). Sem duplicação.

---

## 8. Decisões assumidas (a confirmar)

Pontos que decidi por padrão razoável e que valem confirmação:

1. **Foco único:** só uma parada expandida por vez; expandir outra colapsa a anterior.
2. **Limpar seleção ao clicar fora:** clicar no mapa vazio colapsa a parada **e** remove a borda de seleção.
3. **Popup não colapsa:** clicar de endereço para endereço (mesma parada) troca popup/seleção sem fechar a expansão.
4. **Sombra da seleção = cor do tipo** do marcador selecionado (coerente com o neon).
5. **Representante = menor sequência** (a confirmar em campo: primeiro/centro/último).

---

## 9. Pendências / a confirmar

- [ ] **Posição do representante na parada — confirmar em campo (primeiro/centro/último).** Implementado (TASK-RF-020.2) como **menor sequência entre os endereços com coordenada válida**. Só dá pra saber qual o app oficial usa entregando.
- [x] **Coordenadas divergentes no mesmo Stop:** RESOLVIDO (26/06, TASK-RF-020.2) — endereço é identificado **por coordenada**; representante = menor sequência válida; **aviso só em DEV** (`import.meta.env.DEV`, sem PII) quando a parada está **dispersa** (endereço mais distante **> 100 m** do representante, via `haversine`). Serve para descobrir em campo se "Stop disperso" é raro ou indica dado estranho — **não muda comportamento**.
- [x] **Número nos endereços expandidos:** RESOLVIDO (26/06, RF-020.5 — **revisa** a decisão de 25/06) — **todos** os círculos expandidos mostram **`parada-sequência`** (ex.: `18-49`), **inclusive o representante**. A sequência é a **da planilha** no modo Original (no roteirização reinicia `1..N` por parada). Antes: "só o representante mantém número, demais sem número".
- [x] **Forma colapsada:** RESOLVIDO (26/06, RF-020.5) — parada colapsada é **sempre quadrado** (mesmo com 1 endereço); círculo passou a ser o estado **expandido/selecionado**.
- [ ] Os 5 pontos do §8.

---

## Última Atualização

- **Data:** 25/06/26
- **Por:** criação do fluxo do modo Original (interações de clique: expandir/colapsar parada, seleção por borda grossa, popup do endereço com pacotes). Esclarecido que **não há âncora** no Original. Acompanha ADR-008.
