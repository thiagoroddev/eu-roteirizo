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
| **Endereço multi-pacote** | Mesmo endereço/número com mais de um pacote. Conta como um ponto no mapa, com vários pacotes. |
| **Parada** | Agrupamento de endereços próximos, atendidos **a pé** a partir de onde o veículo para. Rotulada `P1`, `P2`… |
| **Âncora (da parada)** | O ponto **onde o veículo fica parado** — partida e retorno da caminhada (ida e volta) e o ponto que o veículo visita ao saltar de uma parada à outra. Padrão = o endereço que originou a parada; **trocável a qualquer momento**, e **não precisa ser um endereço** (pode ser a posição do GPS ou um toque no mapa). Trocar a âncora **recalcula automaticamente a ordem de visita a pé**. |
| **Ponto inicial** | De onde a rota começa (referência da primeira sugestão). |
| **a pé × veículo** | Deslocamento **dentro** de uma parada = a pé (ida e volta a partir da âncora); deslocamento **entre** paradas = veículo (âncora → âncora). |

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

> Regra de leitura: **geometria = o quê (parada/endereço); número = ordem; cor = a que parada pertence; borda grossa = âncora; badge amarelo = quantos.** Na visão geral (nada selecionado) eu já vejo as paradas numeradas e, pelo badge amarelo, quantos endereços cada uma tem — sem clicar.

> **i18n:** os marcadores no mapa **nunca** carregam letra/texto traduzível — só número. A palavra "Parada"/"Stop"/etc. vive apenas em `UI_LABELS` (legenda, painel, botões). Assim o mapa serve qualquer idioma sem mudança (Shopee em outros países). Decisão alinhada à ADR-001.

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

### Âncora no planejamento × na execução

- **Planejamento:** âncora = endereço escolhido (palpite de onde vai parar).
- **Execução (vida real):** a âncora pode ser a **posição real do GPS** (grátis) onde o veículo de fato parou. Se não achou vaga e ficou mais perto de outro endereço, esse vira o **primeiro** — a ordem a pé se reajusta sozinha. (Recurso do modo execução — ver TASK-RF-009.)

### Exibição — sempre em dois níveis

1. **Total acumulado** — de **todo o percurso já configurado** (veículo + a pé somados).
2. **Próximo trecho** — a partir do **elemento selecionado agora**, até o próximo endereço/parada.

---

## 7. HUD — contadores sempre visíveis

- **Endereços faltantes** — ex.: `23/90`.
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

**Remoção — regra de ouro: endereço nunca some (é entrega real).**

- **Desfazer parada:** desagrupa; os endereços voltam a **livres**. Avisa que a parada será desfeita — mas as entregas permanecem.
- **Remover endereço da parada:** vira livre. Se era a **âncora**, o próximo da ordem **vira âncora** automaticamente e a ordem a pé é recalculada.

**Adicionar órfão a parada existente:** select com a parada **mais próxima pré-selecionada** (liberdade de trocar) — não "sempre a última".

**Limite de distância:** **sem trava.** O raio só serve ao **agrupamento automático** na criação da parada. A inclusão manual é livre; se o endereço estiver muito longe da âncora, mostra **aviso suave** (orienta, não bloqueia).

---

## 10. Decisões fechadas

1. **Numeração — Shopee × nossa:** ✅ o **ponto cinza mostra o nº do pacote da planilha**; `Pn`/`En` (com cor) são a **numeração nova da rota manual** montada no app. A "Stop" da Shopee é ignorada no modo manual.
2. **Ordem dos endereços a pé na parada:** ✅ o app **ordena automaticamente** (varredura horária a partir da âncora) **e** o usuário pode **reordenar à mão** a qualquer momento (ver §6).
3. **Âncora:** ✅ cada parada tem uma âncora (onde o veículo para); base da ida e volta a pé e do salto de veículo entre paradas. Padrão = endereço que originou a parada; **trocável**, **não precisa ser endereço** (pode ser GPS ou toque no mapa), e ao trocar **recalcula a ordem a pé**.
4. **Âncora ao vivo na execução:** ✅ na execução, a âncora pode ser a **posição real do GPS** (grátis) onde o veículo parou; se ficou mais perto de outro endereço, esse vira o primeiro. Pertence ao modo execução (TASK-RF-009).
5. **Ponto inicial:** ✅ **GPS** (`navigator.geolocation`, grátis) como principal; **toque no mapa** como alternativa; opcional **partir de um endereço da planilha**. **Não** usar "digitar endereço" (exigiria geocoding pago/limitado).
6. **Rótulo dos marcadores:** ✅ **só número, sem letra**; geometria distingue parada (quadrado) de endereço (círculo). Palavra "Parada/Stop" só em `UI_LABELS` (i18n — Shopee em outros países).
7. **Cor:** ✅ parada e seus endereços = **mesma cor**; seleção = **realce** (não outra cor); só a parada selecionada expande.
8. **Contagem e âncora:** ✅ **badge amarelo** atrás do marcador mostra nº de endereços (parada fechada) ou nº de pacotes (endereço > 1), visível **sem clicar**; **borda grossa = âncora**.
9. **Remoção e inclusão:** ✅ desfazer parada (endereços viram livres) · remover endereço (promove a próxima âncora) · incluir órfão via **select da parada mais próxima** · **sem trava de distância** (só aviso suave). Detalhe em §9.

### Ainda a confirmar

- **"Mais próximo" (sugestão):** por **distância de rua** (grafo OSM, ADR-002), com **fallback em linha reta** quando o grafo ainda não carregou. Confirmar se o fallback é aceitável.

---

## Última Atualização

- **Data:** 22/06/26
- **Por:** especificação de fluxo do modo Roteirizar, base para protótipo e TASK-RF-006.
- **Status:** rascunho de trabalho; resolver §9 antes de prototipar a tela final.
