# Rascunho · Investigação visual do traçado do roteiro

> Estado: **plano proposto, aguardando Portão 1** (aprovação do plano — núcleo §2).
> Origem: pedido do humano em 12/09/26 com três prints (rascunho, lista de endereços de uma parada, mapa com a polilinha cobrindo as setas de mão).
> Destino previsto deste rascunho: **3 requisitos + 3 tarefas fatiadas**.

---

## 1 · O problema, com as palavras do código

O pedido nasceu de um sintoma de campo: *"esse monstro de linha no mapa fica em cima das setas que apontam a direção da mão, e não dá pra ver o caminho até a próxima rota"*. E um segundo, mais sutil: *"o veículo pode passar pela mesma rua sem ser possível identificar visualmente no mapa, porque só aparece uma única linha preta independente de quantas vezes tenha passado por lá"*.

Os dois sintomas têm a mesma causa, e ela está em duas linhas.

Em `src/pages/MapPage.tsx` o traçado do veículo nasce inteiro, de uma vez:

```ts
const vehicleRoute = useMemo(() => {
  const anchors = builderState.stops.map((s) => s.vehicleStop);
  return anchors.length > 0 ? vehicleRoutePath(graph, builderState.startPoint, anchors) : null;
}, [graph, builderState.startPoint, builderState.stops]);
```

`vehicleRoutePath` costura todas as pernas numa **única** lista de coordenadas (`routePath.ts → chain`, que faz `path.concat(leg.path.slice(1))`). Em `src/components/RouteMap.tsx`, essa lista vira **uma** polilinha:

```ts
const VEHICLE_ROUTE_STYLE = { weight: 4, color: ROTEIRO_MARKER_COLORS.vehicle.bottom, opacity: 0.9 } as const;
// ...
L.polyline(vehicleRoute.map((p) => [p.lat, p.lng]), VEHICLE_ROUTE_STYLE).addTo(overlayLayer);
```

Daí saem os dois sintomas:

| Sintoma | Causa exata |
|---|---|
| Tapa nome de rua e setas de mão | `opacity: 0.9` com `weight: 4` na cor `#334155` (slate escuro) — praticamente opaco sobre o tile |
| Passar 3× pela mesma rua desenha o mesmo preto | **uma** polilinha = **um** `stroke()` no canvas; alpha não acumula dentro de um mesmo traço |

---

## 2 · Por que o acúmulo de opacidade funciona (e onde ele para)

Você pediu: *"opacidade — quando passa duas vezes no mesmo lugar, fica uma cor mais forte automaticamente, dando pra ver o nome da rua e as setas do próprio mapa. Se houver impedimento diga."*

**Funciona, e o mecanismo é o alpha blending do canvas.** O mapa já roda com `preferCanvas: true` (decisão de REF-015a, para não criar N nós SVG). O renderer de canvas do Leaflet desenha **cada `L.Path` como uma operação separada**: `beginPath()` → define o traço → `globalAlpha = options.opacity` → `stroke()`. Duas polilinhas distintas que pousam no mesmo pixel compõem por alpha, e o resultado é previsível:

```
α_total(N passagens) = 1 − (1 − α)^N
```

Com α = 0,35 por passagem:

| Passagens | Opacidade resultante | Leitura |
|:--:|:--:|---|
| 1 | 0,35 | rua, número e seta de mão legíveis por baixo |
| 2 | 0,58 | nitidamente mais forte |
| 3 | 0,73 | forte, ainda translúcido |
| 4 | 0,82 | satura — nunca vira preto chapado |

É exatamente o comportamento que você descreveu, e ele é **automático**: não precisa detectar sobreposição, contar passagens nem calcular nada. A geometria faz sozinha.

### O impedimento honesto (você pediu pra dizer)

**O acúmulo acontece ENTRE polilinhas, não DENTRO de uma.** Hoje o traçado é uma polilinha só, então ele se sobrepõe a si mesmo sem acumular nada. A condição para o efeito existir é **quebrar o traçado em uma polilinha por perna** (início→P1, P1→P2, P2→P3…). Feito isso, repetição entre pernas diferentes acumula naturalmente.

O que **continua** sem acumular depois disso: uma mesma perna que volta por cima de si mesma — entrar numa rua sem saída e sair pelo mesmo trecho **dentro da mesma perna** P4→P5, por exemplo. Resolver isso exigiria segmentar cada perna por aresta do grafo e desenhar aresta a aresta; é factível, mas multiplica o número de objetos de canvas e o custo não se paga agora. **Fica registrado como limitação conhecida, não como bug.**

Segundo ponto honesto: **a opacidade diz QUANTAS passagens, não em QUE SENTIDO.** Duas passagens em sentidos opostos escurecem igual a duas no mesmo sentido. Quem responde "por que lado o veículo foi" continuam sendo as setas do tile — e é precisamente por isso que a opacidade baixa é o ponto central desta fatia, não um detalhe estético.

---

## 3 · Decisões já tomadas por você (12/09)

| Assunto | Decisão |
|---|---|
| Onde fica o controle | **Mais uma opção em Configurações**, acessível pelo ⚙ do header do app |
| Sobreposição | **Acúmulo de opacidade** (sem offset paralelo, sem setas sintéticas) |
| Navegação ‹ › | **Paradas firmadas, ciclo infinito** (da última volta para a primeira) |
| Fatiamento | **3 tarefas fatiadas** |

### Decisões que assumi, e que você pode derrubar numa linha

1. **Qual distância aparece entre paradas:** a do **veículo pelas ruas**, de âncora a âncora, reaproveitando as mesmas pernas que o mapa desenha. É a leitura de "P1 → 1,3 km → P2" no sentido de deslocamento, e não mistura com a caminhada (que já aparece dentro da parada).
2. **O primitivo do controle:** um **`Segmented`** próprio em `components/ui/`, construído sobre `Button`, **sem dependência nova**. O `Switch` canônico do shadcn exigiria `@radix-ui/react-switch` — se preferir o canônico, é um `npm i` e uma troca de arquivo.
3. **Modo "trecho" sem parada selecionada:** mostra a primeira perna (início → P1), em vez de mapa vazio. Ponto a calibrar no smoke.

---

## 4 · Risco de vocabulário visual (reportado, não resolvido)

Você pediu o trecho selecionado como **linha tracejada verde**. O mapa já tem **duas** linhas tracejadas com significado próprio:

| Linha | Estilo atual | Significa |
|---|---|---|
| Sugestão de próxima parada | tracejada ciano `#00D1FF` | "o algoritmo iria pra cá" |
| Circuito a pé da parada | tracejada âmbar `#F59E0B` | "o percurso a pé dentro da parada" |
| **Trecho selecionado (novo)** | **tracejada verde** | "daqui até a próxima parada" |

Três tracejados diferentes numa tela pequena disputam leitura. A proposta é diferenciar por **espessura e cor** — o trecho selecionado sai mais grosso (`weight: 6`) que sugestão e circuito — e validar no smoke. Se ficar confuso no aparelho, a saída barata é o trecho selecionado ser **contínuo verde** e o resto do traçado ficar bem apagado: "contínuo = por onde o carro vai, tracejado = hipótese".

---

## 5 · Fatia 1 — Traçado do veículo: modo + acúmulo de opacidade

**Tipo:** RF · **Cerimônia:** Standard · **Esforço:** M/G

### O que muda, arquivo por arquivo

| Arquivo | Mudança |
|---|---|
| `src/utils/routing/routePath.ts` | Novo `vehicleRouteLegs(graph, startPoint, anchors): VehicleRouteLeg[]` — as pernas **sem costurar**. `vehicleRoutePath` passa a **derivar** dele (costura + soma), sem rodar o A* duas vezes |
| `src/types/routing.ts` | Novo `RouteTraceMode = "full" \| "segment"` |
| `src/services/mapDisplaySettings.ts` | **Novo.** Preferência global de exibição do mapa em localStorage, espelhando `deliverySettings.ts` (leitura defensiva, degrada para o default, nunca lança) |
| `src/contexts/MapDisplaySettingsContext.tsx` | **Novo.** Espelha `DeliverySettingsContext` — provider + hook, valor default para testes isolados |
| `src/App.tsx` | Envolve a árvore com o novo provider |
| `src/components/ui/segmented.tsx` | **Novo.** Primitivo reutilizável shadcn-style (cva + `Button`), `role="radiogroup"`, navegável por teclado |
| `src/components/shell/DeliverySettingsDialog.tsx` | Nova seção "Mapa" com o `Segmented`: *Rota inteira* / *Trecho selecionado* |
| `src/components/RouteMap.tsx` | `roteiroOverlay.vehicleRoute`: `LatLng[]` → `LatLng[][]` (uma por perna). Desenha **uma polilinha por perna**. Estilo com opacidade baixa (⚙️ MANUAL KNOB). Novo `vehicleRouteDashed?: boolean` para o modo trecho |
| `src/pages/MapPage.tsx` | Lê o modo do contexto; troca `vehicleRoutePath` por `vehicleRouteLegs`; monta o overlay conforme o modo |
| `src/constants/uiLabels.ts` | Rótulos da seção "Mapa" das configurações |

### Como o modo escolhe as pernas

```
full     → overlay.vehicleRoute = legs.map(l => l.path)          // todas, opacidade baixa, contínuas
segment  → overlay.vehicleRoute = [ perna que SAI da parada selecionada ]   // tracejada verde, grossa
```

A perna que sai de `Pn` é `legs[n]` (porque `legs[0]` é início→P1). Sem parada selecionada, `legs[0]`.

`RouteMap` **não** aprende o que é "modo": continua burro, recebendo pernas prontas e desenhando. Isso preserva o ADR-009 — o pai calcula o view-model, o filho pinta.

### Critérios de aceite

1. `vehicleRouteLegs` devolve N pernas para N âncoras com início (N−1 sem início), e a soma das distâncias é igual à de `vehicleRoutePath`.
2. Com o modo `full`, o mapa desenha uma polilinha **por perna**, não uma só.
3. Um trecho percorrido 2× fica visivelmente mais escuro que um percorrido 1× (validação manual, no aparelho).
4. Com opacidade de uma passagem, nome da rua e setas de mão do tile permanecem legíveis (validação manual).
5. A preferência sobrevive ao recarregamento da página e degrada para `full` se o localStorage estiver indisponível.
6. Com o modo `segment`, só a perna da parada selecionada até a próxima é desenhada.

### Riscos

- **`MapPage.test.tsx` tem 95 KB e `RouteMap.test.tsx` 24 KB.** Ambos quase certamente afirmam sobre *a* polilinha do veículo. Atualizá-los é o grosso do esforço desta fatia — não a implementação.
- Mudar a assinatura de `roteiroOverlay.vehicleRoute` é quebra de contrato interno: o typecheck pega tudo, mas o diff atravessa três arquivos grandes.
- Um provider a mais na árvore: barato, mas precisa entrar em todos os `render()` de teste que hoje montam `MapPage`.

---

## 6 · Fatia 2 — Navegação ‹ › cíclica no Meu roteiro

**Tipo:** RF · **Cerimônia:** Standard · **Esforço:** P/M · **A fatia barata.**

O componente **já existe e já está pronto**. `PanelModeBar` renderiza um `StopStepper` assim que recebe os dois handlers:

```tsx
{onPrevStop && onNextStop && <StopStepper onPrevStop={onPrevStop} onNextStop={onNextStop} />}
```

O modo Original já usa isso (`originalHeader`, linha 1371 de `MapPage`). O modo roteiro nunca passou os handlers. E a lógica cíclica também já existe, em `panelModels.ts`:

```ts
return order[(position + direction + order.length) % order.length];  // o módulo já dá o ciclo infinito
```

Ou seja: esta fatia é **espelhar uma decisão que o projeto já tomou**, no outro modo.

| Arquivo | Mudança |
|---|---|
| `src/utils/routing/selectors.ts` | Novo `adjacentStopId(stops, currentId, direction)` — espelho puro de `adjacentStopKey`, ordenando por `order` |
| `src/components/map/panel/RoteiroPanelHeader.tsx` | Novos props opcionais `onPrevStop`/`onNextStop`, repassados ao `PanelModeBar` |
| `src/pages/MapPage.tsx` | `handleStepRoteiroStop(direction)` → `adjacentStopId` → reusa `handleShowRoteiroStopOnMap` (que já seleciona, foca o mapa e recolhe o painel). Passa os handlers em todos os ramos do header do roteiro **exceto** `drafting` |
| `src/components/map/panel/PanelModeBar.tsx` | **Nenhuma.** Já atende |

Passar `undefined` durante o rascunho basta para esconder o stepper — o `&&` do `PanelModeBar` já cuida disso. Sem `if` novo dentro do componente.

### Critérios de aceite

1. `adjacentStopId` cicla nas duas pontas (de Pn avança para P1; de P1 retrocede para Pn).
2. Lista vazia devolve `null`; id desconhecido devolve a primeira parada.
3. O stepper aparece no header do roteiro quando há ao menos uma parada firmada, e some durante um rascunho.
4. Clicar ‹ / › seleciona a parada vizinha **e** foca o mapa nela.

---

## 7 · Fatia 3 — Distância entre paradas na lista "Ver detalhes"

**Tipo:** RF · **Cerimônia:** Standard · **Esforço:** P/M · **`depende_de` a Fatia 1.**

O molde que você citou (*"igual já mostra na visualização de endereços de uma única parada"*) é o `LegConnector`, hoje privado dentro de `StopItem.tsx`:

```tsx
const LegConnector = ({ leg }: { leg: StopLeg }) => (
  <span className="... flex w-[3.25rem] flex-col items-center justify-center gap-0.5 ...">
    <Footprints className="h-3 w-3" aria-hidden />
    <span className="text-[10px] [writing-mode:vertical-rl] rotate-180">{legLabel(leg)}</span>
    <ArrowDown className="h-3 w-3" aria-hidden />
  </span>
);
```

Você pediu tudo componentizado e reutilizável — aqui isso não é enfeite, é o caminho mais curto: **extrair** o componente e usá-lo nos dois níveis.

| Arquivo | Mudança |
|---|---|
| `src/components/map/panel/LegConnector.tsx` | **Novo.** Extraído de `StopItem`, com props `{ meters, viaStreets, icon: "walk" \| "drive", variant: "gutter" \| "inline" }` |
| `src/components/map/panel/StopItem.tsx` | Passa a importar o componente extraído — comportamento idêntico, sem regressão visual |
| `src/components/map/panel/RoteiroOverviewSection.tsx` | `OverviewStopView` ganha `outgoingLeg?: StopLeg \| null`. Renderiza o conector (ícone `Car`) entre os `<li>` e entre a `StartRow` e P1 |
| `src/pages/MapPage.tsx` | Monta `outgoingLeg` a partir de `vehicleRouteLegs` (Fatia 1) — a perna que sai de `stops[i]` é `legs[i+1]`. **Zero A* adicional**: são as mesmas pernas que o mapa desenha |

### Por que depende da Fatia 1

Sem `vehicleRouteLegs`, esta fatia teria que chamar `suggestionPath` por conta própria e rodar a cadeia de A* uma segunda vez, só para escrever números que o mapa já calculou. A dependência é o que impede a duplicação.

### Formato

`formatMeters` (em `utils/formatters.ts`) já é o que produz "1,3 km" no `vehicleDistanceLabel` do card de sugestão. Reusar garante que a mesma distância nunca saia escrita de dois jeitos na mesma tela.

### Critérios de aceite

1. A lista mostra um conector entre paradas consecutivas, com ícone de veículo e a distância pelas ruas.
2. A última parada **não** tem conector de saída.
3. Com uma única parada, nenhum conector aparece.
4. O conector entre o início (P0) e P1 aparece quando existe início definido.
5. O drill-down de endereços dentro de uma parada continua exatamente como está hoje (não regride).

---

## 8 · Proporcionalidade (núcleo §4)

> Pediram quatro mudanças de UI; proponho **3 requisitos novos, 3 tarefas fatiadas, 2 serviços/contextos novos e 2 componentes novos**.

O tamanho se justifica assim:

- **3 tarefas em vez de 1:** o núcleo marca XG como divisão obrigatória, e as quatro features somadas passam de 12 arquivos com dois testes gigantes no caminho. Fatiadas, cada uma fecha com gate próprio e é revertível sozinha.
- **3 requisitos:** nenhum dos 28 requisitos do catálogo cobre traçado do mapa, navegação entre paradas ou distância entre paradas. `processos/tarefa.md` exige `--requisitos <ID>` para tarefas RF. Sem cadastrar, o trabalho entra sem rastro.
- **Serviço + contexto novos:** é a mesma forma que o projeto já escolheu para preferência global (`deliverySettings` + `DeliverySettingsContext`). Repetir a forma conhecida custa menos que inventar uma segunda.
- **`Segmented` novo:** você pediu componentizado com shadcn, e `MapModeToggle` já duplica esse desenho à mão. O primitivo paga a segunda vez de uso agora e a terceira depois.
- **`LegConnector` extraído:** dois usos reais no mesmo commit. Extrair com um uso só seria antecipação; com dois, é o momento certo.

**O que NÃO está sendo feito, e por quê:** offset paralelo de linhas sobrepostas (você escolheu opacidade), setas de direção sintéticas (as do tile bastam quando a linha é translúcida), acúmulo dentro de uma mesma perna (custo alto, ocorrência rara), migrar `MapModeToggle` para o novo `Segmented` (achado encaminhado, não escopo).

---

## 9 · Achados a reportar (núcleo §6)

Varredura da lista fechada, feita durante o levantamento:

| # | Item | Achado |
|:-:|---|---|
| 1 | Segurança | nada encontrado |
| 2 | Dado pessoal exposto | nada encontrado no escopo tocado |
| 3 | Performance com impacto de usuário | **`MapPage.tsx` tem 89 KB e `MapPage.test.tsx` 95 KB.** Não é performance de execução, é performance de manutenção: qualquer fatia aqui paga pedágio de contexto. Candidato a tarefa REF própria, fora deste escopo |
| 4 | Requisito ausente ou contradito | **Três comportamentos pedidos não existem no catálogo de requisitos.** É o que as três RFs novas resolvem |
| 5 | Gate que não checa nada | nada encontrado — os cinco gates estão declarados com comando em `contexto.json` |

Achado extra, fora da lista fechada: `MapModeToggle.tsx` implementa à mão o mesmo desenho de controle segmentado que a Fatia 1 vai extrair para `ui/segmented.tsx`. Encaminhável para a tarefa da Fatia 1 como achado, ou tarefa REF própria depois.

---

## 10 · Bloqueio operacional desta sessão

⚠️ **Não consigo executar comandos na sua máquina.** O shell que monta as pastas conectadas está fora do ar (uma atualização do Windows de 08/09 quebrou o acesso). Consigo **ler** e **escrever** arquivos normalmente, mas não rodar nada.

Consequências concretas:

- **Não posso rodar `mentor req nova` nem `mentor task nova`.** E não devo escrever os `.json` de tarefa à mão: `processos/tarefa.md` é explícito — *"Nada que o script escreve é digitado ou conferido pela IA"*.
- **Não posso rodar os gates** (`npm run typecheck`, `lint`, `test`, `build`). Gate sem evidência de execução vale `NÃO EXECUTADO`.

Os comandos para você rodar, na ordem, estão na seção seguinte. A alternativa é passar este rascunho para o Claude Code rodando localmente — ele não é afetado pelo problema.

---

## 11 · Comandos (para rodar na máquina)

Confira as flags com `node mentor.mjs req nova --help` antes; o esqueleto é este:

```bash
# 1) Catálogo de requisitos — três comportamentos novos
node mentor.mjs req nova --tipo RF --enunciado "Alternar o tracado do roteiro no mapa entre rota inteira e trecho da parada selecionada, com passagens repetidas distinguiveis por acumulo de opacidade"
node mentor.mjs req nova --tipo RF --enunciado "Navegar entre paradas firmadas do Meu roteiro com avancar/retroceder ciclico no cabecalho do painel"
node mentor.mjs req nova --tipo RF --enunciado "Exibir a distancia de deslocamento entre paradas consecutivas na lista completa do roteiro"

# 2) Tarefas — trocar RF-57/58/59 pelos IDs que o passo 1 gerar
node mentor.mjs task nova --tipo RF --titulo "Alternar tracado do roteiro e tornar passagens repetidas visiveis por opacidade" \
  --esforco M/G --valor importante --urgencia normal --origem RF-57 --requisitos RF-57

node mentor.mjs task nova --tipo RF --titulo "Avancar e retroceder entre paradas do Meu roteiro em ciclo" \
  --esforco P/M --valor importante --urgencia normal --origem RF-58 --requisitos RF-58

node mentor.mjs task nova --tipo RF --titulo "Mostrar distancia entre paradas consecutivas na lista completa" \
  --esforco P/M --valor importante --urgencia normal --origem RF-59 --requisitos RF-59 --depende TASK-RF-0XX
```

A terceira tarefa depende da primeira (`--depende`) pelo motivo da §7.

---

## 12 · Ordem de execução sugerida

```
Fatia 1 (mapa)  ──────┬──────▶  Fatia 3 (distancias na lista)
                      │
Fatia 2 (navegacao) ──┘  independente, pode ir a qualquer momento
```

A Fatia 2 é a mais barata e a de menor risco — serve bem como primeira, para reaquecer o contexto do painel antes de mexer nos dois arquivos gigantes.

O método de teste do projeto é **TDD** (`contexto.qualidade.metodo_de_teste`): em cada fatia, o teste nasce vermelho antes do código. E as três alteram UI, então as três exigem **validação manual** antes do Portão 2 — o roteiro de smoke vai junto com o pedido de fechamento de cada uma.
