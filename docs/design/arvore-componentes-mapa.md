# Árvore de Componentes — Tela do Mapa & Painel Dinâmico (MapPanel)

> **Doc de design da TASK-RF-023** (fase Original). Mapeia os componentes da tela do mapa e do painel inferior a partir das telas de média fidelidade (`prototipos/telas-media-fidelidade/`, telas 5–9) e das specs textuais (`fluxo-modo-original.md` — decide no Original; `fluxo-roteirizacao.md` — decide no Meu roteiro). As imagens **ilustram estrutura e informação**; cores/estética = tokens do tema (ADR-006 rev. Neon Flux; personalização via `theme.css`).
>
> **Decisões do humano (05/07/26) já incorporadas:** painel **sempre visível** (colapsado = nº da parada + endereço); **`vaul`** (Drawer shadcn) para gesto/snap points; **nunca existe "nenhuma parada selecionada"** (abre com a **menor parada**; sempre mostra a **última selecionada**; clique fora não esvazia); **fase Original primeiro** (só dados da planilha, **sem numeração nova** — Stop/Sequence), Meu roteiro depois preenchendo **slots**.

---

## 1. Princípios

1. **Um painel, quatro modos.** A mesma estrutura serve visualização (Original), visualização/edição/rascunho (Meu roteiro) e execução. Alternar modo = trocar **dados e slots**, nunca a estrutura (fluxo-modo-original §6/§7).
2. **Slots, não ifs.** O que varia por modo entra por props `ReactNode`/callbacks (`actions`, `banner`, `footer`, `itemTrailing`…). O Original entrega slots vazios; RF-006/009 preenchem.
3. **Puro por baixo, casca fina por cima.** Derivações (parada atual, métricas, itens ordenados) em funções puras testáveis (`utils/markers/`), como o padrão consolidado do `markerModels` (RF-020.3).
4. **Só tokens.** Zero cor hardcoded (REF-012); gradiente da marca via `bg-brand-gradient`.
5. **Original = planilha.** Números exibidos são `Stop`/`Sequence` da Shopee; nenhuma ordem nova.

---

## 2. Árvore de componentes

Legenda: ✅ existe · 🆕 novo (RF-023) · 🔮 slot/preenchido depois (RF-006/009+)

```
MapPage ✅                              /mapa?romaneio&rota (FocusShell: header + voltar)
├── MapModeToggle ✅                    Original | Meu roteiro (overlay topo; roteiroEnabled 🔮 RF-010)
├── RouteMap ✅                         Leaflet + marcadores SVG (ADR-008) + estado de interação
│   └── (markerModels ✅)               view-models puros; findAddressByKey ✅
└── MapPanel 🆕                         bottom sheet persistente (vaul: snaps colapsado/meio/cheio,
    │                                   dismissible=false, modal=false — mapa segue interativo)
    ├── PanelHeader ✅ (rev. 07/07 — DUAS VISÕES, .7)  SEMPRE visível; área de arrasto
    │   ├── (alça/grabber) ✅           indicador visual de arrastável
    │   ├── PanelModeBar ✅             rótulo do modo ("Modo visualização") + barra de progresso
    │   │   └── StopStepper ✅          ‹ › — parada anterior/próxima (ordem: nº da parada)
    │   ├── [seção "Resumo da parada"] ✅  rótulo + PanelTitle + botão "Ver lista completa"
    │   │   └── PanelTitle ✅           "Parada {Stop} — {bairros} ({CEPs})" numa linha (rev. 07/07:
    │   │       │                       bairro/CEP saíram do detalhe do endereço p/ cá)
    │   │       └── MetricsRow ✅       chips: "N endereços" + pacotes POR TIPO ("Residencial: 1 pacote ·
    │   │                               Comercial: 2 pacotes" — tipos ausentes omitidos; shopping mistura)
    │   └── [seção "Endereço selecionado"] ✅  (só na VISÃO PADRÃO) sob divisória: rótulo + card do
    │                                   endereço SELECIONADO (StopItemRow; fallback 1º por Sequence);
    │                                   tap → painel sobe p/ o MEIO e o StopItemDetail vira o corpo
    ├── PanelBody 🆕                    conteúdo do snap expandido; scroll interno
    │   ├── [slot] actions 🔮           grade de botões contextuais (telas 5–9: Editar/Iniciar/
    │   │                               Remover/Tornar âncora/Mover âncora/Criar parada/Salvar…)
    │   ├── [slot] banner 🔮            avisos (ex.: raio engloba N candidatos — tela 9)
    │   └── StopItemList 🆕             endereços da parada, ordem = Sequence (Original)
    │       └── StopItem ✅             1 por endereço; expansível (um por vez)
    │           ├── [slot] itemLeading 🔮   drag handle (reordenar — telas 6/7)
    │           ├── ItemMarker ✅           mini-marcador: cor do tipo + nº (Sequence no Original;
    │           │                           ordinal/âncora 🔮 no Meu roteiro)
    │           ├── ItemInfo ✅             endereço + complemento (complemento SÓ com 1 pacote —
    │           │                           rev. 07/07: multi-pacote mostra por pacote)
    │           ├── ItemMeta ✅             badge de pacotes (>1); tempo/dist da perna 🔮 RF-007
    │           └── PackageList ✅          expandido: PackageRow × N
    │               └── PackageRow ✅       etiqueta "Ordem {Seq} | Parada {Stop}" (formato da etiqueta
    │                                       física) + COMPLEMENTO do pacote + código SPX TN (mono) +
    │                                       TypeBadge colorido (verde/azul/cinza — paleta funcional)
    └── [slot] footer 🔮                CTA fixo (Salvar alterações / Desfazer / Iniciar rota)
```

**Destino do `AddressSheet` (022.6):** ✅ **APOSENTADO na TASK-REF-011 (07/07)** — o conteúdo foi absorvido pelo `StopItem`/`StopItemDetail` na 023.4 e o último consumidor (o modal fullscreen legado do RouteViewer) foi removido junto com o fluxo inline. O `RouteMap` é hoje **só-embedded e totalmente controlado** (`interaction`/`onInteractionChange` obrigatórias; sem portal, botão de fechar ou Escape próprio).

---

## 3. Contratos (esboço TypeScript)

```ts
// MapPanel — casca vaul; não conhece modos, só slots
interface MapPanelProps {
  header: ReactNode;            // PanelHeader (sempre visível no snap mínimo)
  children: ReactNode;          // PanelBody
  footer?: ReactNode;           // 🔮 CTA fixo
  snap?: PanelSnap;             // controlado/opcional: "collapsed" | "half" | "full"
  onSnapChange?: (s: PanelSnap) => void;
}

// PanelHeader (composição)
interface PanelModeBarProps {
  modeLabel: string;            // UI_LABELS — "Modo visualização" (Original)
  progress?: number;            // 0..1 ✅ RF-006.8 — % + barra fina (base: endereços)
  actions?: ReactNode;          // ✅ RF-006.8 — slot direito ("Ver detalhes")
  onPrevStop: () => void;       // StopStepper — circular pela ordem de Stop
  onNextStop: () => void;
}
interface PanelTitleProps {
  stopNumber: string | null;    // Stop da planilha (null se coluna ausente → oculta "Parada:")
  metrics: PanelMetric[];       // [{ label }] — "4 endereços", "6 pacotes", 🔮 "~15 min e 900 m"
}
// (rev. 07/07: PanelTitle NÃO carrega endereço; o endereço selecionado vira uma
// StopItemRow própria no header — mesma linha da lista, exportada de StopItem.)

// StopItemList / StopItem
interface StopItemData {        // derivado puro de AddressGroup (buildPanelItems, novo util)
  addressKey: string;           // "i:j" — mesma identidade do mapa (findAddressByKey)
  markerNumber: string;         // Sequence (Original) | ordinal 🔮
  markerType: string;           // ICON_KEYS → cor via colorForLocationType (paleta funcional)
  addressLine: string;
  complement: string;
  packageCount: number;
  packages: PackageRowData[];   // etiqueta (Stop/Seq) + spxTn + typeLabel
  legInfo?: { minutes: number; meters: number }; // 🔮 RF-007
}
interface StopItemListProps {
  items: StopItemData[];
  selectedKey: string | null;   // seleção do mapa → destaque + auto-scroll (rev. 07/07)
  itemLeading?: (item: StopItemData) => ReactNode;  // 🔮 drag handle
  itemActions?: (item: StopItemData) => ReactNode;  // 🔮 "Tornar âncora"/"Remover" (tela 6)
  itemTrailing?: (item: StopItemData) => ReactNode; // "Ver no mapa" (ícone) ao lado da linha
}
// (rev. 07/07: a lista abre com TODOS os itens expandidos; o toque numa linha
// alterna só a expansão daquele item (estado interno). Selecionar = "Ver no mapa".
// addressLine = SÓ rua + número; complemento vive nos pacotes — exceção: parada
// com 1 endereço e 1 pacote mantém o complemento na linha.)
```

**Estado (quem manda):** `RouteMap` continua dono de `expandedStopKey`/`selectedAddressKey` (RF-020.3). O painel **lê** a seleção e **emite** intenções (steppers, tap em item) — sobe via callbacks para o mesmo estado. Nenhum estado duplicado. Na 023.2, esse estado sobe do `RouteMap` para a `MapPage` (lift) para painel e mapa consumirem irmãmente — mudança mecânica, contratos puros intactos.

---

## 4. Matriz modo × preenchimento (tela a tela)

| Elemento | **Original — visualização** (agora, tela 5 read-only) | **Meu roteiro — OCIOSO (visão geral) ✅ RF-006.8** | Meu roteiro — visualização (tela 5) 🔮 | Meu roteiro — edição (telas 6/7) 🔮 | Rascunho (tela 9) 🔮 | Execução (§14) 🔮 |
|---|---|---|---|---|---|---|
| ModeBar | "Modo visualização", sem progresso | rótulo do estado + `%` + barra fina + "Ver detalhes" | idem + progresso | "Modo edição" + progresso | "Modo rascunho" | progresso da rota |
| Título | `Parada {Stop}` + endereço representante | — (o corpo assume: card "Roteiro em construção") | `Parada N — Veículo (âncora)` | `Parada N — 2º endereço` | `Parada N — Veículo` | próxima entrega |
| Métricas | `N endereços · N pacotes` | stat-cards `Endereços x/y` · `Pacotes x/y` + barra + `%` | + `~min e m a pé` | idem | `1 endereço · 1 pacote…` | `X/Y` + previsão |
| actions | — (vazio) | "Criar parada" (sugestão) · "Ver no mapa" por parada | `Editar Parada · Iniciar rota` | `Remover/Adicionar/Tornar âncora/Inverter` ou `Mover/Resetar âncora` | `Salvar parada · Editar âncora/raio` | `Abrir GPS · Concluir` |
| banner | — | — | — | — | "raio engloba N candidatos" | — |
| Itens: número | **Sequence planilha** | PanelTitle por parada confirmada; drill-down com ordinais | ordinal 1º/2º + item âncora | idem + drag | idem | ordem do roteiro |
| Itens: meta | badge pacotes | chips + estimativa a pé; sugestão com distância de veículo | + tempo/metros por perna | idem | idem | distância até |
| footer | — | — | — | `Salvar alterações` | `Salvar alterações` | `Concluir entrega` |
| Ponto livre (tela 8) | n/a (Original não tem órfão) | n/a (nada selecionado por definição) | título "Ponto livre" + `Criar parada · Incorporar` | ← | ← | n/a |

> **Contexto ocioso (RF-006.8):** não existe em nenhuma das telas 1–9 do fluxo — é o estado "nada selecionado" do Meu roteiro (pós-início ou toque no mapa vazio). O corpo do painel vira a **visão geral** (progresso + paradas confirmadas + sugestão de próxima parada numerada em sequência), também acessível de qualquer contexto pelo "Ver detalhes" do cabeçalho (Escape/arrasto saem, como na lista completa).

---

## 5. Estados e interações (Original)

- **Abertura:** painel **colapsado** (header) com a **menor parada** selecionada (menor `Stop` numérico; sem coluna Stop → primeira da ordem atual). Mapa dá `fitBounds` normal (não foca a parada até interação).
- **Snaps (vaul):** `collapsed` (altura do header) · `half` (~45%) · `full` (~90%). `dismissible=false` — nunca fecha. `modal=false` — mapa interativo no collapsed/half.
- **Steppers ‹ ›:** navegam pela ordem de `Stop` (circular); expandem a parada no mapa (foco/zoom) **selecionando o 1º endereço** (menor Sequence — rev. 07/07; no Meu roteiro será a âncora/veículo).
- **Tocar marcador de parada** (mapa): expande **e seleciona o 1º endereço** (menor Sequence) — ícone destacado; card do painel atualiza. **O painel não muda de snap.**
- **Tocar marcador de endereço** (mapa): seleciona → card do painel atualiza. **O painel NUNCA se eleva/expande por seleção no mapa** (rev. 07/07): o padrão é colapsado — sempre há um endereço selecionado; só toques DENTRO do painel (card, "Ver lista completa", "Ver no mapa") mudam snap/visão.
- **DUAS VISÕES do painel (rev. 07/07 — TASK-RF-023.7, sem endereço duplicado):**
  - **Visão padrão (default):** header = ModeBar + seção "Resumo da parada" (título + métricas + botão **"Ver lista completa"**) + divisória + seção "Endereço selecionado" (card do selecionado; fallback 1º por Sequence — nunca vazio). **Tocar o card** → painel sobe p/ o **meio** e o `StopItemDetail` (bairro/CEP/tipo + pacotes + Maps) vira o corpo, contíguo ao card; segundo toque recolhe. Corpo vazio com card recolhido.
  - **Visão lista ("Ver lista completa"):** painel no snap **cheio** (único cujo corpo rola), corpo = `StopItemList` completa (abre rolada até o selecionado); cada card tem **"Ver no mapa"** (trailing) → seleciona, volta à visão padrão no meio, mapa foca. Sair do snap cheio (arrasto/Escape) também volta à padrão.
- **Tocar `StopItem`** (visão lista): espelha no mapa (seleção/ênfase) e expande os pacotes inline (um por vez); o selecionado fica **destacado** (`bg-accent` + `aria-current`).
- **Seleção vinda do MAPA** abre o card na visão padrão (troca de visão se necessário); taps dentro da lista não tiram o usuário da lista.
- **Clique no mapa vazio:** colapsa os círculos expandidos no mapa; **o painel mantém a última parada** (nunca esvazia). *(Supersede o "limpa a seleção" antigo — fluxo-modo-original §5/§8 atualizados.)*
- **Escape (rev. 07/07):** visão lista → visão padrão (meio); painel `full/half` → `collapsed`; já colapsado → sai do mapa (mesmo destino do voltar). Seleção nunca é limpa pelo Escape.

---

## 6. O que é lib × novo

| Peça | Origem |
|---|---|
| Bottom sheet (gesto/snap/a11y) | **`vaul`** via padrão shadcn Drawer (**aprovado 05/07** — instalar na 023.2) |
| Botões, badges, chips | `ui/button`, `ui/badge` existentes + tokens |
| Ícones (‹ ›, alça, pacote, pino) | `lucide-react` existente |
| MapPanel/Header/Title/ModeBar/Stepper/ItemList/Item/PackageRow | **novos**, `src/components/map/panel/` |
| Derivações (itens, métricas, menor parada, próxima/anterior) | **novas funções puras** em `utils/markers/` (padrão markerModels) |
| Expansão de item | estado controlado próprio (sem lib) |

---

## 7. Recorte da fase Original (TASK-RF-023.2–.5)

Entra agora: MapPanel + Header (ModeBar sem progresso, Stepper, Title, Metrics) + StopItemList/StopItem/PackageRow read-only + estados do §5 + absorção do AddressSheet. **Não** entra: qualquer slot 🔮 (actions/banner/footer/drag/legInfo/progress), ponto livre, âncora — chegam com RF-006/007/009/010 **sem alterar esta estrutura**.

---

## Última Atualização

- **Data:** 05/07/26 — criação (TASK-RF-023.1), a partir das telas 5–9 + fluxos + decisões do humano de 05/07.
