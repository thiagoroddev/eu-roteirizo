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
    ├── PanelHeader 🆕                  SEMPRE visível (snap mínimo); área de arrasto
    │   ├── (alça/grabber) 🆕           indicador visual de arrastável
    │   ├── PanelModeBar 🆕             rótulo do modo ("Modo visualização") + barra de progresso
    │   │   └── StopStepper 🆕          ‹ › — parada anterior/próxima (ordem: nº da parada)
    │   └── PanelTitle 🆕               "Parada {Stop}" + endereço (representante) 
    │       └── MetricsRow 🆕           chips: "N endereços · N pacotes" (+ "~min e m" 🔮 RF-007)
    ├── PanelBody 🆕                    conteúdo do snap expandido; scroll interno
    │   ├── [slot] actions 🔮           grade de botões contextuais (telas 5–9: Editar/Iniciar/
    │   │                               Remover/Tornar âncora/Mover âncora/Criar parada/Salvar…)
    │   ├── [slot] banner 🔮            avisos (ex.: raio engloba N candidatos — tela 9)
    │   └── StopItemList 🆕             endereços da parada, ordem = Sequence (Original)
    │       └── StopItem 🆕             1 por endereço; expansível (um por vez)
    │           ├── [slot] itemLeading 🔮   drag handle (reordenar — telas 6/7)
    │           ├── ItemMarker 🆕           mini-marcador: cor do tipo + nº (Sequence no Original;
    │           │                           ordinal/âncora 🔮 no Meu roteiro)
    │           ├── ItemInfo 🆕             endereço + complemento
    │           ├── ItemMeta 🆕             badge de pacotes (>1); tempo/dist da perna 🔮 RF-007
    │           └── PackageList 🆕          expandido: PackageRow × N
    │               └── PackageRow 🆕       etiqueta "Parada {Stop} · Seq {Sequence}" + código
    │                                       SPX TN (mono) + TypeBadge (Residencial/Comercial)
    └── [slot] footer 🔮                CTA fixo (Salvar alterações / Desfazer / Iniciar rota)
```

**Destino do `AddressSheet` (022.6):** absorvido — o conteúdo vira `ItemInfo`+`PackageList` do `StopItem` expandido; o link "Abrir no Google Maps" migra para o item expandido (ou `ItemMeta`). Os testes de conteúdo migram junto; o componente é aposentado na 023.5.

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
  progress?: number;            // 0..1 🔮 (edição/rascunho/execução)
  onPrevStop: () => void;       // StopStepper — circular pela ordem de Stop
  onNextStop: () => void;
}
interface PanelTitleProps {
  stopNumber: string | null;    // Stop da planilha (null se coluna ausente → oculta "Parada:")
  address: string;              // endereço do representante (ou do endereço em foco 🔮)
  metrics: PanelMetric[];       // [{ label }] — "4 endereços", "6 pacotes", 🔮 "~15 min e 900 m"
}

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
  expandedKey: string | null;   // sincronizado com selectedAddressKey do RouteMap
  onItemTap: (addressKey: string) => void; // seleciona no mapa + expande no painel
  itemLeading?: (item: StopItemData) => ReactNode; // 🔮 drag handle
  itemActions?: (item: StopItemData) => ReactNode; // 🔮 "Tornar âncora"/"Remover" (tela 6)
}
```

**Estado (quem manda):** `RouteMap` continua dono de `expandedStopKey`/`selectedAddressKey` (RF-020.3). O painel **lê** a seleção e **emite** intenções (steppers, tap em item) — sobe via callbacks para o mesmo estado. Nenhum estado duplicado. Na 023.2, esse estado sobe do `RouteMap` para a `MapPage` (lift) para painel e mapa consumirem irmãmente — mudança mecânica, contratos puros intactos.

---

## 4. Matriz modo × preenchimento (tela a tela)

| Elemento | **Original — visualização** (agora, tela 5 read-only) | Meu roteiro — visualização (tela 5) 🔮 | Meu roteiro — edição (telas 6/7) 🔮 | Rascunho (tela 9) 🔮 | Execução (§14) 🔮 |
|---|---|---|---|---|---|
| ModeBar | "Modo visualização", sem progresso | idem + progresso | "Modo edição" + progresso | "Modo rascunho" | progresso da rota |
| Título | `Parada {Stop}` + endereço representante | `Parada N — Veículo (âncora)` | `Parada N — 2º endereço` | `Parada N — Veículo` | próxima entrega |
| Métricas | `N endereços · N pacotes` | + `~min e m a pé` | idem | `1 endereço · 1 pacote…` | `X/Y` + previsão |
| actions | — (vazio) | `Editar Parada · Iniciar rota` | `Remover/Adicionar/Tornar âncora/Inverter` ou `Mover/Resetar âncora` | `Salvar parada · Editar âncora/raio` | `Abrir GPS · Concluir` |
| banner | — | — | — | "raio engloba N candidatos" | — |
| Itens: número | **Sequence planilha** | ordinal 1º/2º + item âncora | idem + drag | idem | ordem do roteiro |
| Itens: meta | badge pacotes | + tempo/metros por perna | idem | idem | distância até |
| footer | — | — | `Salvar alterações` | `Salvar alterações` | `Concluir entrega` |
| Ponto livre (tela 8) | n/a (Original não tem órfão) | título "Ponto livre" + `Criar parada · Incorporar` | ← | ← | n/a |

---

## 5. Estados e interações (Original)

- **Abertura:** painel **colapsado** (header) com a **menor parada** selecionada (menor `Stop` numérico; sem coluna Stop → primeira da ordem atual). Mapa dá `fitBounds` normal (não foca a parada até interação).
- **Snaps (vaul):** `collapsed` (altura do header) · `half` (~45%) · `full` (~90%). `dismissible=false` — nunca fecha. `modal=false` — mapa interativo no collapsed/half.
- **Steppers ‹ ›:** navegam pela ordem de `Stop` (circular); atualizam seleção no mapa (expande a parada + foco/zoom, comportamento atual de expandir).
- **Tocar marcador de parada** (mapa): seleciona/expande → header atualiza; painel mantém o snap atual.
- **Tocar marcador de endereço** (mapa): seleciona → painel expande para `half` (se colapsado) e o `StopItem` correspondente expande/rola à vista.
- **Tocar `StopItem`** (painel): espelha no mapa (seleção/ênfase) e expande os pacotes (um item expandido por vez).
- **Clique no mapa vazio:** colapsa os círculos expandidos no mapa; **o painel mantém a última parada** (nunca esvazia). *(Supersede o "limpa a seleção" antigo — fluxo-modo-original §5/§8 atualizados.)*
- **Escape:** painel `full/half` → `collapsed`; já colapsado → sai do mapa (mesmo destino do voltar).

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
