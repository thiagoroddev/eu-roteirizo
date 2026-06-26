# Tarefas Em Andamento

> Cada tarefa Standard/Strict em execução vive aqui como **um bloco** (cabeçalho + log contínuo com timestamps), enquanto está sendo feita. Ao iniciar, a tarefa **sai de `pendentes.md`**; ao concluir, vira arquivo próprio em `concluidas/` e **sai daqui**.
>
> **Máximo 3 em andamento ao mesmo tempo.** Rodar testes antes e depois de cada tarefa. Datas no formato `DD/MM/AA HH:MM`.

# TASK-RF-020 - Marcadores SVG no visualizador Original (divIcon + agrupar por Stop)

- **Status:** EM DESENVOLVIMENTO (subtarefa .1 de 3)
- **Modo:** Strict
- **Valor:** Crítico
- **Urgência:** IMEDIATA
- **Esforço-H/IA:** G/M
- **Data-hora origem:** 25/06/26 22:55
- **Data-hora início:** 26/06/26 12:02
- **Dependências:** -
- **REQ/ADR/DT:** ADR-008; `fluxo-modo-original.md`
- **Observações:** Isolado do roteirizar. Mantém Leaflet (`L.Icon`→`L.divIcon`). Protótipo aprovado: `prototipos/marcadores-svg/`. Cadência: **uma subtarefa por vez**, gates verdes + parar para revisão.

**Objetivo:** substituir os PNGs (`mapIcons.ts`) por marcadores SVG no modo Original, espelhando o app oficial (um marcador por parada/Stop, número da parada, resto na lista).

## Subtarefas
- **.1** Componente de marcador SVG parametrizável (builder puro + wrapper `divIcon`) — ✅ **CONCLUÍDA** (26/06 12:09, `concluidas/2026-06-26--12h09--TASK-RF-020.1.md`)
- **.2** Integrar no `RouteMap` (agrupar por Stop, 1 marcador por parada) — ✅ **CONCLUÍDA** (26/06 12:46, `concluidas/2026-06-26--12h46--TASK-RF-020.2.md`)
- **.4** Ajuste visual (escala por zoom + badge reposicionado) — ✅ **CONCLUÍDA** (26/06 14:40, `concluidas/2026-06-26--14h40--TASK-RF-020.4.md`)
- **.5** Redesenho do marcador (sempre quadrado colapsado + badge dentro + suporte a rótulo `parada-sequência`) + docs — ✅ **CONCLUÍDA** (26/06 15:43, `concluidas/2026-06-26--15h43--TASK-RF-020.5.md`)
- **.3** Interações: expandir/colapsar parada, seleção, popup do endereço — ⏳ **PRÓXIMA** (Dep .2/.5 ✅; spec nova já em `pendentes`/ADR-008)

## Planejamento Aprovado (RF-020.5)
Feedback do humano (26/06): badge deve caber **dentro** do ícone; endereço único → número **centralizado**; **mudança de design**: forma colapsada = **sempre quadrado** (mesmo 1 endereço); ao clicar, **todos** os endereços viram **círculos** rotulados **`parada-sequência`** (sequência **da planilha** no Original; roteirização reinicia 1..N). "Já alterar o que for preciso" em docs/tarefas futuras.

1. **`markerSvg.ts`:** `BADGE_TOP` 52→42 (badge dentro da cabeça, centralizado); número **centralizado** (y≈49) sem badge / **subido** (y≈30) com badge; **fonte por comprimento** do rótulo (`≤2→24`, `3→20`, `≥4→16`) p/ caber `18-49`.
2. **`RouteMap.tsx`:** forma colapsada = **sempre quadrado** (remove círculo-se-único); número=Stop; badge=endereços(multi)/pacotes(único>1). Círculo passa a ser só expandido/selecionado (.3).
3. **Docs:** ADR-008 (forma=estado; número colapsado=parada / expandido=`parada-seq`; badge dentro; histórico), `fluxo-modo-original.md` §3/§4/§5/§9 (sempre quadrado colapsado; expandir→círculos `parada-seq`, incl. representante — revoga "demais sem número"), `pendentes` .3 re-spec.
4. **Aceite:** colapsado sempre quadrado; badge dentro; número centralizado quando único; componente suporta rótulo composto; docs coerentes; gates verdes.

## Execução (.5)
- Plano aprovado ("ok sim"). Início.

## Planejamento Aprovado (RF-020.4)
Feedback do humano sobre os prints da .2: (a) no **zoom distante** os marcadores amontoam → a escala deve **crescer com o zoom** (cheio só no zoom mais perto, limite menor no zoom mín.); (b) o **badge** (canto sup-dir) fica confuso (não dá pra saber de quem é) → mover para a **base da cabeça / início do cone**, centralizado, praticamente dentro do ícone; número central sobe um pouco.

1. **Escala por zoom:** novo `utils/markers/markerScale.ts` `scaleForZoom(zoom)` linear entre `MARKER_MIN_SCALE` (no `ZOOM.MIN`=14) e `MARKER_MAX_SCALE` (no `ZOOM.MAX`=17), clamp — **0.45 → 0.9** (tunável). `RouteMap`: cria ícone com a escala do zoom atual, guarda refs marcador+props, **`setIcon` no `zoomend`** + uma vez após `fitBounds`. Anchor re-deriva (ponta segue no ponto).
2. **Badge:** em `markerSvg.ts`, mover para `translate(cx - largura/2, ~52)` (base da cabeça/início do cone, centralizado); número central sobe (`y ~36`). Geometria de ancoragem inalterada (HEIGHT 102, ponta 98).
3. **Testes:** `markerScale.test.ts` (novo); `markerSvg.test.ts` (+badge centralizado/baixo, número mais alto); `RouteMap.test.tsx` (mock `getZoom`/`on`/`off`/`setIcon`).
4. **Aceite:** marcadores menores no zoom distante e cheios só no mais perto; badge colado ao próprio marcador; gates verdes; sem dep nova.

## Execução (.4)
- 13:00: Plano aprovado ("sim"). Início.

## Planejamento Aprovado (RF-020.2)

### Definições do humano (travadas)
1. Representante = endereço de **menor sequência**; centroide descartado; **aviso só DEV** quando Stop disperso (endereço > 100 m do representante, haversine). Decisão em aberto no `fluxo §9`.
2. `pointer-events` no `markerIcon.css`: wrapper `none`, `.mk-body`/`.mk-badge` `auto` (clique passa pro de baixo).
3. `MARKER_GEOMETRY.HEIGHT` 122 → 102 (mantém `TIP_Y=98`/anchor); reconferir testes `markerSvg`.

### Ambiguidades resolvidas (AskUserQuestion 26/06)
- **Endereço distinto = por coordenada (lat/lng).**
- **Stop vazio/ausente → marcador próprio** (círculo, sem número).
- **Representante = menor seq entre coords válidas.**

### Modelo `groupRowsByStop` (`utils/markers/stopGrouping.ts`, puro)
`StopGroup { stop; hasStop; addresses[]; representative; type; maxDispersionMeters }`. Endereço chaveado por coord (`toFixed(6)`); tipo nível-parada "comercial vence". Reusa `parseCoordinate`/`isWithinRioBounds`, `resolveLocationType`, `haversine` (`utils/routing/geo.ts`).

### Cor `colorForLocationType` (`utils/markers/markerColors.ts`, puro)
ICON_KEYS → azul comercial / verde residencial / cinza indefinido (`numberInk:#2A2F38`). Tokens do Original aqui (componente segue agnóstico).

### RouteMap
1 marcador/parada (quadrado >1 endereço / círculo único; número=Stop; badge pino/caixa; pos=representante); fitBounds nos representantes; aviso DEV disperso >100 m (sem PII); aposentar `getIcons`/`pickIconKey`; clique segue Google Maps (.3 muda).

### Retirar (só RouteMap usava): `mapIcons.ts`+`iconPicker.ts` (+ testes). Manter `ICON_KEYS`/`map.ts`/assets.

### Testes: `stopGrouping.test.ts` + `markerColors.test.ts` (novos); `markerSvg.test.ts` (height 102) + `RouteMap.test.tsx` (mock `divIcon`, 1 marcador/parada) adaptados.

### Doc: `fluxo-modo-original.md` §9 (aviso disperso + representante a confirmar).

### Aceite (RF-020.2)
Multi-rota 1 marcador/parada com número do Stop; forma/cor/badge corretos; representante menor seq válida; nada some das tabelas; PNGs aposentados; sem `any`/dep nova; gates verdes.

## Planejamento Aprovado (RF-020.1)

### Escopo
- **Faz:** `buildMarkerSvg(props) → string` (puro, sem Leaflet/React/DOM) + `createMarkerDivIcon(props) → L.DivIcon` (único ponto com Leaflet) + CSS mínimo p/ neutralizar a caixa branca padrão do `divIcon`.
- **NÃO faz:** agrupar por Stop, representante, cor-por-tipo, integrar no `RouteMap`, expandir/colapsar, popup, aposentar `getIcons`. → .2/.3.

### Arquivos
- Criar `src/utils/markers/markerSvg.ts` (builder puro + tipos).
- Criar `src/utils/markers/markerIcon.ts` (`createMarkerDivIcon`, importa `leaflet`).
- Criar `src/utils/markers/markerIcon.css` (reset `.leaflet-div-icon`, importado por `markerIcon.ts`).
- Criar `src/__tests__/utils/markers/markerSvg.test.ts` (puro) e `markerIcon.test.ts` (Leaflet real, sem mock).
- Local `utils/markers/`: artefato é função geradora (sem JSX), paralelo ao `mapIcons.ts` que substitui.

### API (identificadores em inglês — ADR-001)
- `MarkerShape = "square" | "circle"`; `MarkerBadgeKind = "packages" | "addresses"` (caixa=packages, pino=addresses).
- `MarkerColor { top; bottom; glow; numberInk? }` (numberInk default `#fff`); `MarkerBadge { kind; count }`.
- `MarkerSvgProps { shape; color; number?; badge?; selected?; scale? }`; `buildMarkerSvg(props): string`.

### Decisões
1. String builder (não componente React): injetado no `divIcon` via `html`; mais leve e testável; espelha `createMarker` do protótipo.
2. Cor = valores (não `type`): reusável no roteiro (paleta categórica). Mapa tipo→cor do Original mora na .2.
3. Glow neon inline no corpo; `selected` = `stroke #fff width 4` + glow forte (vs `rgba(255,255,255,.4)`/`1.5`). Builder autocontido (CSS só p/ reset do divIcon).
4. `numberInk` default branco; indefinido recebe `#2A2F38` (contraste AA) na .2 — componente só usa o valor.
5. Geometria portada com `viewBox` que não corta o badge: `W=96,H=122,cx=48,cyTop=12,bodyH=56,cyMid=40,tipY=98`. `iconAnchor=[renderedW/2, renderedH*98/122]`; `iconSize=[W*scale,H*scale]`.
6. `id` de gradiente determinístico por cor (`grad-<hex sanitizado>`): evita colisão de `url(#id)`, mantém função pura.
7. Hooks de teste: `class="mk-body"`, `<text class="mk-number">`, `<g class="mk-badge">`.
8. `createMarkerDivIcon` → `L.divIcon({ html, className:"route-marker-icon", iconSize, iconAnchor })`; CSS zera fundo/borda da `.leaflet-div-icon`.

### Sem UI_LABELS nesta subtarefa (texto de UI é da .3).

### Aceite (RF-020.1)
Componente isolado e testável; geração do SVG sem dependência de Leaflet; sem `any`; sem dependência nova. Gates `tsc -b` / `vitest run` / `lint` verdes (NODE_ENV limpo).

## Execução
- 12:02: Plano da .1 aprovado. Início.

## Testes
- (a rodar ao fim da .1)

---

<!-- Modelo de bloco (template completo em .github/agents/geral-robusto/templates/30-task-em-andamento.md.md):

# TASK-PREFIXO-XXX - Título

- **Status:** EM DESENVOLVIMENTO
- **Modo:** Standard
- **Valor:** Crítico
- **Urgência:** Normal
- **Esforço-H/IA:** G/G
- **Data-hora origem:** DD/MM/AA HH:MM
- **Data-hora início:** DD/MM/AA HH:MM
- **Dependências:** -
- **REQ/ADR/DT:** -

## Planejamento Aprovado
[plano que o humano aprovou]

## Execução
- HH:MM: Plano aprovado
- HH:MM: ...

## Testes
- 1º npm run test: NN verdes
-->
