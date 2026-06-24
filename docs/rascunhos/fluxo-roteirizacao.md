# Fluxo do Roteirizador — Base para o Protótipo

> Passo a passo e estados visuais do modo **Roteirizar** (rota única). Serve de base para o protótipo de tela e para a TASK-RF-006. Documento de trabalho — especulativo e refinável. Complementa `draft-roteirizador-a-pe.md` (visão) e segue a ADR-002 (roteamento local).

---

## 1. Em uma frase

Roteirizador **manual** para entregador Shopee: importa a planilha (70 a 150 endereços) e o usuário monta a rota **parada por parada**, no mapa, com estimativa **a pé** dentro de cada parada e estimativa de **veículo** entre paradas — porque a roteirização automática da Shopee é ruim e ninguém entrega de forma tão personalizada.

---

## 2. Vocabulário (entidades)

| Termo | O que é |
|---|---|
| **Endereço** (ponto) | Uma linha da planilha. Tem número (do pacote), rua + número, complemento, bairro e CEP. |
| **Endereço multi-pacote** | Mesmo endereço/número com mais de um pacote. Conta como **um ponto** no mapa, com vários pacotes. |
| **Pacote** | Uma encomenda individual (uma linha/etiqueta da planilha, com `SPX TN`). Vários pacotes podem estar no mesmo endereço (Vol 1, Vol 2…). |
| **Parada** | Agrupamento de endereços próximos, atendidos **a pé** a partir de onde o veículo para. Rotulada `P1`, `P2`… |
| **Âncora (da parada)** | O ponto **onde o veículo fica parado** — partida e retorno da caminhada (ida e volta) e o ponto que o veículo visita ao saltar de uma parada à outra. Padrão = o endereço que originou a parada; **trocável a qualquer momento**, e **não precisa ser um endereço** (pode ser a posição do GPS ou um toque no mapa). Trocar a âncora **recalcula automaticamente a ordem de visita a pé**. |
| **Ponto inicial** | De onde a rota começa (referência da primeira sugestão). |
| **a pé × veículo** | Deslocamento **dentro** de uma parada = a pé (ida e volta a partir da âncora); deslocamento **entre** paradas = veículo (âncora → âncora). |

> **Hierarquia (3 níveis) — espinha dorsal do app:** uma **Parada** contém **Endereços**; um **Endereço** contém **Pacotes**. Reflete o modelo (`RouteStop` → `DeliveryPoint` → `DeliveryPackage`) e o **drill-down da UI**: o mapa mostra **paradas** → expandir uma parada mostra seus **endereços** → selecionar um endereço mostra seus **pacotes** (card "Etiqueta do Pacote", §9/§14).
>
> **Vocabulário único (i18n):** usar sempre **Parada · Endereço · Pacote · Âncora** (não "agrupamento", "circuit" etc.), centralizado em `UI_LABELS`.

---

## 3. Sistema visual dos ícones

Quatro variáveis visuais, cada uma com **um** significado (sem sobreposição):

| Variável | Significado |
|---|---|
| **Geometria** | tipo: **quadrado = parada**, **círculo = endereço** |
| **Número** (dentro) | ordem: parada `1, 2, 3…`; endereço dentro da parada `1, 2, 3…` (**só número, sem letra**) |
| **Cor** | uma parada e **todos os seus endereços compartilham a mesma cor**; cinza desbotado = livre (órfão); início = verde |
| **Borda grossa** | **âncora** (o endereço onde o veículo para; o `1` da parada) |
| **Badge amarelo** (atrás) | **contagem**: numa parada fechada = nº de endereços; num endereço = nº de pacotes (só se > 1) |

| Elemento | Como aparece |
|---|---|
| Endereço livre (órfão) | círculo cinza desbotado, nº do pacote da planilha |
| Parada fechada | quadrado colorido, nº de ordem, **badge amarelo com nº de endereços** |
| Parada selecionada | quadrado **realçado** (anel/brilho — mesma cor, não outra) → **expande** os endereços |
| Endereço dentro da parada | círculo da **cor da parada**, nº de ordem; **só aparece com a parada selecionada** |
| Âncora (parada expandida) | o `1` da parada vira **círculo com borda grossa** (deixa de ser quadrado) |
| Endereço multi-pacote | círculo + **badge amarelo** com o nº de pacotes |
| Início | marcador verde próprio |
| Sugestão do próximo | **linha tracejada** até o mais próximo (some ao escolher) |
| Trecho configurado | **linha contínua** veículo (âncora→âncora) + **laço tracejado** a pé dentro da parada |
| Círculo de raio (ao criar parada) | **círculo tracejado** do raio configurado, centrado na semente/âncora — mostra quem está no alcance |
| Candidato no raio | endereço **dentro** do círculo, destacado (entra na parada ao criar) |

> Regra de leitura: **geometria = o quê (parada/endereço); número = ordem; cor = a que parada pertence; borda grossa = âncora; badge amarelo = quantos.** Na visão geral (nada selecionado) eu já vejo as paradas numeradas e, pelo badge amarelo, quantos endereços cada uma tem — sem clicar.

> **i18n:** os marcadores no mapa **nunca** carregam letra/texto traduzível — só número. A palavra "Parada"/"Stop"/etc. vive apenas em `UI_LABELS` (legenda, painel, botões). Assim o mapa serve qualquer idioma sem mudança (Shopee em outros países). Decisão alinhada à ADR-001.

### Legenda do mapa

Com o sistema de ícones denso, o mapa traz uma **legenda colapsável** (um "?" no canto que abre/fecha — não rouba espaço no celular). Ela **espelha exatamente esta seção** (geometria · cor · badge amarelo · borda grossa · linhas de veículo/a pé/sugestão), para **nunca divergir** do que é desenhado. Textos via `UI_LABELS` (i18n).

---

## 4. Passo a passo do fluxo

**0. Importar a planilha.** Todos os endereços surgem como **pontos cinza desbotados**, numerados conforme a planilha (que já vem numerada por pacote e por parada da Shopee).

**1. Definir o ponto inicial.** O usuário marca o início; ele aparece destacado no mapa.

**2. Sugestão do primeiro endereço.** O app sugere, em **linha tracejada**, o endereço **mais próximo** do ponto inicial. O usuário pode aceitar ou **escolher outro**.

**3. Ver informações do endereço.** Ao tocar num endereço, abre um card com os dados da planilha: **rua + número, complemento, bairro, CEP**. Se for multi-pacote, mostra **quantos pacotes**.

**4. Criar a parada.** O usuário escolhe um endereço para **criar uma parada**. O ícone ganha **cor viva** e vira `P1`.
- Se houver um **raio** configurado (ver §7), todos os endereços **dentro do raio** entram automaticamente na parada.

**5. Ajustar a parada.** A qualquer momento o usuário pode **adicionar** ou **remover** endereços da parada, arbitrariamente.

**6. Concluir a parada.** Fechada a `P1`, o app **aguarda o próximo endereço** (que será a `P2`) e sugere, em linha tracejada, o **mais próximo**.

**7. Repetir.** Passos 3 a 6 para `P2`, `P3`… até **todos os endereços** estarem em alguma parada.

**8. Salvar a rota.** Só é permitido salvar quando **todos os endereços/pacotes** foram atribuídos (HUD mostra `0` faltando).

---

## 5. Expandir e colapsar uma parada

- **Não selecionada:** aparece **apenas o ícone da parada** (`Pn`) — os endereços ficam escondidos.
- **Ao tocar na parada:** ela **expande** e mostra os endereços (`E1`, `E2`…) na **mesma cor da parada**, junto das infos da parada (qtd de endereços, pacotes, tempo a pé estimado).

---

## 6. Modelo de cálculo e estimativas (tempo e distância)

A **âncora** organiza o cálculo em duas camadas:

| Deslocamento | De → até | Como estima |
|---|---|---|
| **Veículo** (entre paradas) | âncora(Pn) → âncora(Pn+1) | velocidade km/h (configurável), pela rua, respeitando mão única (ADR-002) |
| **A pé** (dentro da parada) | âncora → endereços → âncora (**ida e volta**) | velocidade a pé + tempo por entrega (configuráveis); pedestre **não** tem mão única |

> O veículo só "para" nas âncoras; a caminhada de cada parada é um **circuito fechado** que sai e volta à âncora. Por isso a âncora é necessária — sem ela não dá pra estimar a ida e volta a pé.

### Ordem dos endereços a pé dentro da parada

- **Padrão:** **varredura horária** a partir da âncora — ordena os endereços pelo **ângulo (bearing)** em torno da âncora (`atan2`, custo zero). Faz um **laço** que volta perto de onde começou — ideal para ida e volta. (Melhor que "vizinho mais próximo", que pode terminar longe da âncora e encarecer o retorno.)
- **Override manual (essencial):** a ordem automática é só sugestão. O usuário **reordena à mão** sempre que quiser — nenhum algoritmo sabe que "a entrada do prédio é pelos fundos". O controle manual é o diferencial; o auto-ordenamento só precisa ser "bom o bastante".
- **Trocar a âncora recalcula a ordem:** mudou a âncora (outro endereço, GPS ou toque no mapa), a varredura horária é refeita a partir dela. Custo zero.

### Sugestão do próximo (linha tracejada)

- **Referência = último configurado:** a sugestão parte do último elemento configurado (endereço/parada).
- **Auto-seleciona o mais próximo:** a linha tracejada já aponta o mais próximo (desempate pela varredura horária; ao montar parada, prioriza quem está dentro do raio).
- **Clicar em outro re-direciona:** tocar em qualquer endereço move a linha tracejada para ele e mostra a distância até ele — comparar destinos é só tocar.

### Distância a pé pelas ruas (não em linha reta)

- A distância a pé exibida é a de **caminhada pelas ruas** (grafo, pedestre — ignora mão única), **não linha reta**.
- **Performance:** rankeia o "mais próximo" por linha reta (barato) e calcula o **caminho de rua + distância real só para o alvo selecionado** (um A* por alvo). Linha reta só como **fallback** enquanto o grafo não carregou.

### Âncora no planejamento × na execução

- **Planejamento:** âncora = endereço escolhido (palpite de onde vai parar).
- **Execução (vida real):** a âncora pode ser a **posição real do GPS** (grátis) onde o veículo de fato parou. Se não achou vaga e ficou mais perto de outro endereço, esse vira o **primeiro** — a ordem a pé se reajusta sozinha. (Recurso do modo execução — ver TASK-RF-009.)

### Exibição — sempre em dois níveis

1. **Total acumulado** — de **todo o percurso já configurado** (veículo + a pé somados).
2. **Próximo trecho** — a partir do **elemento selecionado agora**, até o próximo endereço/parada.

---

## 7. HUD — contadores sempre visíveis

- **Faltando** — com a **unidade explícita** (evita confundir cliques com volume): progresso de atribuição em **endereços** (ex.: `40/52` endereços, recomendado como número principal — é o que falta *fazer*) e o **volume** em **pacotes** (ex.: `86/88` pacotes, secundário). Um endereço multi-pacote é **uma** atribuição.
- **Paradas criadas** — ex.: `3`.
- **Distância total** (veículo + a pé) — ex.: `4,1 km`.
- **Tempo total estimado** (veículo + a pé) — ex.: `1h12`.

---

## 8. Configurações

- **Raio de agrupamento (m):** ao criar uma parada a partir de um endereço, inclui automaticamente os endereços dentro desse raio.
- **Velocidade a pé** e **tempo por entrega** (min): base da estimativa dentro da parada.
- **Velocidade de veículo (km/h):** base da estimativa entre paradas.

---

## 9. Interações por contexto (botões e remoção)

Os botões dependem do que está selecionado:

| Selecionado | Botões |
|---|---|
| Endereço livre (órfão) | **Criar parada** (vira a próxima na ordem) · **Adicionar a uma parada** (select pré-selecionando a mais próxima) |
| Parada (fechada / selecionada) | **Adicionar endereço** · **Desfazer parada** · trocar âncora (no painel) |
| Endereço dentro de uma parada | **Remover da parada** · **Tornar âncora** |

**Card "Etiqueta do Pacote":** ao selecionar um endereço no Roteirizar, suas infos aparecem num card titulado **"Etiqueta do Pacote"** — endereço + `Parada {Stop} · Seq {Sequence}` + código (`SPX TN`) — **separado** dos botões de ação. Mesmos dados da execução (§14), mas sem misturar com as ações de montar parada.

**Remoção — regra de ouro: endereço nunca some (é entrega real).**

- **Desfazer parada:** desagrupa; os endereços voltam a **livres**. Avisa que a parada será desfeita — mas as entregas permanecem.
- **Remover endereço da parada:** vira livre. Se era a **âncora**, o próximo da ordem **vira âncora** automaticamente e a ordem a pé é recalculada.

**Adicionar órfão a parada existente:** select com a parada **mais próxima pré-selecionada** (liberdade de trocar) — não "sempre a última".

**Limite de distância:** **sem trava.** O raio só serve ao **agrupamento automático** na criação da parada. A inclusão manual é livre; se o endereço estiver muito longe da âncora, mostra **aviso suave** (orienta, não bloqueia).

---

## 10. Decisões fechadas

1. **Numeração — Shopee × nossa:** ✅ no mapa, `Pn`/`En` (com cor) são a **numeração nova da rota manual**. A numeração da Shopee (`Stop` + `Sequence`) é ignorada **apenas para a ordem da rota** — mas é **preservada como identidade da etiqueta** do pacote e **exibida na execução** (ver §14): é por ela que o entregador acha o pacote na sacola. O **código** (`SPX TN`) também é preservado para chamados/problemas.
2. **Ordem dos endereços a pé na parada:** ✅ o app **ordena automaticamente** (varredura horária a partir da âncora) **e** o usuário pode **reordenar à mão** a qualquer momento (ver §6).
3. **Âncora:** ✅ cada parada tem uma âncora (onde o veículo para); base da ida e volta a pé e do salto de veículo entre paradas. Padrão = endereço que originou a parada; **trocável**, **não precisa ser endereço** (pode ser GPS ou toque no mapa), e ao trocar **recalcula a ordem a pé**.
4. **Âncora ao vivo na execução:** ✅ na execução, a âncora pode ser a **posição real do GPS** (grátis) onde o veículo parou; se ficou mais perto de outro endereço, esse vira o primeiro. Pertence ao modo execução (TASK-RF-009).
5. **Ponto inicial:** ✅ **GPS** (`navigator.geolocation`, grátis) como principal; **toque no mapa** como alternativa; opcional **partir de um endereço da planilha**. **Não** usar "digitar endereço" (exigiria geocoding pago/limitado).
6. **Rótulo dos marcadores:** ✅ **só número, sem letra**; geometria distingue parada (quadrado) de endereço (círculo). Palavra "Parada/Stop" só em `UI_LABELS` (i18n — Shopee em outros países).
7. **Cor:** ✅ parada e seus endereços = **mesma cor**; seleção = **realce** (não outra cor); só a parada selecionada expande.
8. **Contagem e âncora:** ✅ **badge amarelo** atrás do marcador mostra nº de endereços (parada fechada) ou nº de pacotes (endereço > 1), visível **sem clicar**; **borda grossa = âncora**.
9. **Remoção e inclusão:** ✅ desfazer parada (endereços viram livres) · remover endereço (promove a próxima âncora) · incluir órfão via **select da parada mais próxima** · **sem trava de distância** (só aviso suave). Detalhe em §9.
10. **Painéis de ação por contexto:** ✅ aprovados em protótipo (nada selecionado · órfão · parada · endereço na parada) — contrato de UI da TASK-RF-006.
11. **Sugestão e raio:** ✅ ao criar parada, **círculo do raio** mostra os candidatos; **referência = último configurado**; a sugestão **auto-seleciona o mais próximo** (desempate horário) e **re-direciona ao clicar** em outro endereço; **distância a pé pelas ruas** (rank por linha reta, caminho/distância real só do alvo via A*; linha reta só como fallback enquanto o grafo carrega).
12. **Etiqueta no Roteirizar:** ✅ card **"Etiqueta do Pacote"** (endereço + `Parada/Seq` + código), separado dos botões de ação.

### Ainda a confirmar

- (nada pendente)

---

## 11. App shell e navegação (mobile-first)

Decisão em **ADR-003** (React Router). O app passa a ter:

- **Header:** título + engrenagem (Configurações de Rota, §8) + voltar quando aplicável.
- **Bottom tab bar.** Abas no **MVP**: **Mapa** (`/` — importar, planejar manual/auto, salvar, executar) e **Rotas** (`/rotas` — rotas salvas, executar, importar/exportar). **Relatórios** e **Perfil** ficam como stubs para depois.
- O `RouteViewer` atual vira a tela do **Mapa**.

### Modos da aba Mapa (onde fica o toggle)

O toggle **não é** uma aba do menu inferior — vive **dentro da aba Mapa**, como controle segmentado no topo do conteúdo (abaixo do header). O que aparece depende do arquivo importado:

| Arquivo carregado | O que a aba Mapa mostra |
|---|---|
| **Multi-rota** (tem `Corridor Cage`) | **Só Visualizar** (visualizador atual + seletor de rotas, ícones PNG). **Sem toggle** — não há o que roteirizar. |
| **Rota única** (`isSingleRoute`) | Toggle **`[Visualizar \| Roteirizar]`** no topo. Visualizar = read-only; Roteirizar = montar paradas (SVG). É o ramo da TASK-RF-010. |

- **Execução** não é um terceiro segmento do toggle: é um **fluxo de tela cheia** (§14) lançado por **ação** ("Executar agora", a partir de uma rota salva ou após salvar) — entra-se de propósito, não por alternância.

---

## 12. Ciclo da rota: criar → salvar → executar

- **Salvar rota:** botão no topo/HUD do Mapa, **desabilitado até `0 faltando`** (regra de completude, §4 passo 8). Salvar materializa um `PlannedRoute` (vai para a aba **Rotas**), com opção "Executar agora".
- **Auto-roteirizar:** botão que monta tudo sozinho — a partir do início, agrupa o vizinho mais próximo + inclui quem está no **raio configurado**, criando paradas até acabar os endereços. **Reusa as funções do modo manual**; gera um **rascunho editável** (não final). É o "automático + ajuste à mão".

---

## 13. Persistência, lista e import/export

- **Onde fica salvo:** IndexedDB **no aparelho** (local, offline, sem login). É **por dispositivo** — não sincroniza na nuvem (consequência do modelo sem backend).
- **Importar planilha nova não apaga rotas salvas:** começa um novo planejamento; salvar cria uma nova rota. Nada é sobrescrito sem apagar.
- **Onde encontrar:** aba **Rotas**.
- **Dois imports distintos:** (a) **planilha Shopee** → planejamento do zero; (b) **JSON nosso** → rota já configurada, pronta para executar.
- **Export/import = JSON autocontido** (pontos + paradas + âncoras + config). É como passar a rota pronta para um **ajudante** ou trocar de aparelho.

---

## 14. Execução da rota

Tela focada em **uma entrega por vez** (motorista em movimento; botões grandes):

- **Distância até a próxima entrega** + botão **"Abrir GPS"** (deep link Maps/Waze; a pé dentro da parada, veículo entre paradas).
- Botão **"Entrega feita"** → confirma e **pula o foco para a próxima** automaticamente.
- **% concluída** + contagem (ex.: `31/90`).
- **Previsão de término** (agora + tempo estimado restante).
- **Âncora ao vivo (GPS):** ao chegar na parada, a posição real reordena os endereços a pé (§6, decisão 4).

### Identificação do pacote no card (vem da planilha)

No mesmo card do endereço, aparecem os identificadores do pacote — cada um com um propósito:

| Mostra | Para quê | Origem |
|---|---|---|
| **Etiqueta:** `Parada {Stop} · Seq {Sequence}` | achar o pacote na sacola pela etiqueta física | numeração **da Shopee** (`Stop`, `Sequence`) — não as `Pn/En` da rota |
| **Código:** `SPX TN` | chamado/problema com o pacote | `SPX TN` (rastreio) |
| Contexto da rota (ex.: "endereço 2 de 4 da parada") | saber onde está no trajeto | numeração **nossa** (`Pn/En`) |

- **Multi-pacote:** se o endereço tem mais de um pacote, o card **lista cada um** com sua etiqueta + código (são entregas distintas no mesmo ponto).
- Dados vêm do `rawData` de cada `DeliveryPackage` (`Stop`, `Sequence`, `SPX TN`) — **sem mudança no modelo** (RF-004 intacta).

(Refина a TASK-RF-009.)

---

## Última Atualização

- **Data:** 22/06/26
- **Por:** spec do modo Roteirizar + app shell/navegação (ADR-003), ciclo da rota, persistência/export e execução. Base para TASK-RF-006/008/009/011/012/013.
- **Status:** rascunho de trabalho; §9 (decisões) fechado; resta confirmar o fallback de "mais próximo" (§10).
