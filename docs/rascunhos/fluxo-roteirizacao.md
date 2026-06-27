# Fluxo do Roteirizador — Base para o Protótipo

> Passo a passo e estados visuais do modo **Roteirizar** (rota única). Serve de base para o protótipo de tela e para a TASK-RF-006. Documento de trabalho — especulativo e refinável. Complementa `draft-roteirizador-a-pe.md` (visão) e segue a ADR-002 (roteamento local).
>
> 🖼️ **Referência visual canônica:** [`prototipos/telas-roteirizador/index.html`](../../prototipos/telas-roteirizador/index.html) — galeria com todas as telas (uma por caso). Este `.md` é a fonte **textual**; o HTML é a fonte **visual**. Manter os dois em sincronia ao decidir mudanças de UI.

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
| **Parada do veículo** | O **ponto na rua** onde o veículo para para atender a parada. **Não é um endereço** — é um ponto livre **grudado na malha viária** (pode ficar numa rua principal, sem entrar na rua do endereço, pra dar menos volta). De onde a caminhada **sai e volta** (circuito) e o ponto que o veículo visita ao saltar de parada a parada. **Posição sugerida (por ora): em frente ao endereço selecionado** ao criar a parada (simples; um otimizador de "menor volta" fica para o futuro). **Movível** pelo usuário; mover **recalcula** a ordem a pé. |
| **Ponto inicial** | De onde a rota começa (referência da primeira sugestão). |
| **a pé × veículo** | Deslocamento **dentro** de uma parada = a pé (**circuito**: sai e volta à **parada do veículo**); deslocamento **entre** paradas = veículo (**parada do veículo → parada do veículo**). |

> **Hierarquia (3 níveis) — espinha dorsal do app:** uma **Parada** contém **Endereços**; um **Endereço** contém **Pacotes**. Reflete o modelo (`RouteStop` → `DeliveryPoint` → `DeliveryPackage`) e o **drill-down da UI**: o mapa mostra **paradas** → expandir uma parada mostra seus **endereços** → selecionar um endereço mostra seus **pacotes** (card "Etiqueta do Pacote", §9/§14).
>
> **Vocabulário único (i18n):** usar sempre **Parada · Endereço · Pacote · Parada do veículo** (não "âncora", "agrupamento", "circuit" etc.), centralizado em `UI_LABELS`.

---

## 3. Sistema visual dos ícones

Quatro variáveis visuais, cada uma com **um** significado (sem sobreposição):

| Variável | Significado |
|---|---|
| **Geometria** | tipo: **quadrado = parada**, **círculo = endereço** |
| **Número** (dentro) | ordem: parada `1, 2, 3…`; endereço dentro da parada `1, 2, 3…` (**só número, sem letra**) |
| **Cor** | uma parada e **todos os seus endereços compartilham a mesma cor**; cinza desbotado = livre (órfão); início = verde |
| **Parada do veículo** | marcador **próprio** (ícone de veículo), separado dos endereços — **só aparece com a parada selecionada** (oculto na visão geral, pra não poluir). *(A "borda grossa" deixou de significar âncora — não há mais âncora-endereço.)* |
| **Badge amarelo** (atrás) | **contagem**: numa parada fechada = nº de endereços; num endereço = nº de pacotes (só se > 1) |

| Elemento | Como aparece |
|---|---|
| Endereço livre (órfão) | círculo cinza desbotado, nº do pacote da planilha |
| Parada fechada | quadrado colorido, nº de ordem, **badge amarelo com nº de endereços** |
| Parada selecionada | quadrado **realçado** (anel/brilho — mesma cor, não outra) → **expande** os endereços **e** mostra a parada do veículo |
| Endereço dentro da parada | círculo da **cor da parada**, nº de ordem; **só aparece com a parada selecionada** |
| Parada do veículo (parada expandida) | marcador **próprio** (ícone de veículo) na rua; **arrastável**; some ao colapsar a parada |
| Endereço multi-pacote | círculo + **badge amarelo** com o nº de pacotes |
| Início | marcador verde próprio |
| Sugestão da próxima parada | **linha tracejada** até o endereço mais próximo fora do raio. **Desbotada no rascunho**; ao **concluir** a parada fica **mais forte** (mas ainda trocável tocando em outro). |
| Trecho configurado | **linha contínua** de veículo (**parada do veículo → parada do veículo**) + **laço tracejado** a pé (circuito que **sai e volta** à parada do veículo). |
| Círculo de raio (ao criar parada) | **círculo tracejado** do raio configurado, centrado no **endereço selecionado** — mostra quem entra na parada. |
| Candidato no raio | endereço **dentro** do círculo, destacado (entra na parada ao criar) |

> Regra de leitura: **geometria = o quê (parada/endereço); número = ordem; cor = a que parada pertence; badge amarelo = quantos.** A **parada do veículo** é um marcador próprio que **só aparece ao selecionar a parada**. Na visão geral (nada selecionado) eu já vejo as paradas numeradas e, pelo badge amarelo, quantos endereços cada uma tem — sem clicar, e sem o veículo poluindo.

> **Marcador da parada do veículo:** corpo **escuro** (slate/navy) com **anel ciano** (cor da marca) — **fora** da paleta funcional verde/azul/cinza das entregas, pra nunca se confundir com um endereço. Dentro, o **ícone do veículo** conforme o **Modo de Transporte** (moto · carro · van · caminhão · bici · a pé). Mantém a **ponta fina**; é **arrastável** na rua e **oculto na visão geral** (aparece só com a parada selecionada). Os glyphs devem vir de um **set SVG aberto** — **Tabler Icons** (MIT, tem `motorbike`) é a fonte recomendada (evitar desenhar à mão). Referência visual: [`prototipos/marcadores-svg/index.html`](../../prototipos/marcadores-svg/index.html) (`createVehicleMarker`).

> **i18n:** os marcadores no mapa **nunca** carregam letra/texto traduzível — só número. A palavra "Parada"/"Stop"/etc. vive apenas em `UI_LABELS` (legenda, painel, botões). Assim o mapa serve qualquer idioma sem mudança (Shopee em outros países). Decisão alinhada à ADR-001.

### Legenda do mapa

Com o sistema de ícones denso, o mapa traz uma **legenda colapsável** (um "?" no canto que abre/fecha — não rouba espaço no celular). Ela **espelha exatamente esta seção** (geometria · cor · badge amarelo · borda grossa · linhas de veículo/a pé/sugestão), para **nunca divergir** do que é desenhado. Textos via `UI_LABELS` (i18n).

---

## 4. Passo a passo do fluxo

**0. Importar a planilha.** Todos os endereços surgem como **pontos cinza desbotados**, numerados conforme a planilha (que já vem numerada por pacote e por parada da Shopee).

**1. Definir o ponto inicial.** O usuário marca o início; ele aparece destacado no mapa.

**2. Sugestão do primeiro endereço.** O app sugere, em **linha tracejada**, o endereço **mais próximo** do ponto inicial. O usuário pode aceitar ou **escolher outro**.

**3. Ver informações do endereço.** Ao tocar num endereço, abre um card com os dados da planilha: **rua + número, complemento, bairro, CEP**. Se for multi-pacote, mostra **quantos pacotes**.

**4. Criar a parada (rascunho desbotado).** O usuário toca num endereço para **criar uma parada**. Surge um **rascunho esmaecido** com três coisas: os endereços **dentro do raio** (§8) já agrupados, a **parada do veículo** sugerida **em frente ao endereço selecionado**, e a **linha tracejada da próxima parada** (até o endereço mais próximo fora do raio). Tudo **desbotado** sinaliza "isto é rascunho editável".

**5. Ajustar a parada (modo edição).** O usuário **adiciona/remove** endereços e **arrasta a parada do veículo** pela rua. Mover o veículo **recalcula** a ordem a pé e muda **qual é a próxima parada sugerida** (a sugestão parte de onde o veículo ficou).

**6. Concluir a parada.** Ao fechar a `P1`, o rascunho **firma** (cores vivas) e a **linha tracejada da próxima parada fica mais forte** — mas **continua sendo sugestão**: tocar em outro endereço re-aponta a próxima.

**7. Repetir.** Passos 3 a 6 para `P2`, `P3`… até **todos os endereços** estarem em alguma parada.

**8. Salvar a rota.** Só é permitido salvar quando **todos os endereços/pacotes** foram atribuídos (HUD mostra `0` faltando).

---

## 5. Expandir e colapsar uma parada

- **Não selecionada:** aparece **apenas o ícone da parada** (`Pn`) — os endereços ficam escondidos.
- **Ao tocar na parada:** ela **expande** e mostra os endereços (`E1`, `E2`…) na **mesma cor da parada** **e a parada do veículo** (marcador próprio, oculto na visão geral), junto das infos da parada (qtd de endereços, pacotes, tempo a pé estimado).

---

## 6. Modelo de cálculo e estimativas (tempo e distância)

A **parada do veículo** organiza o cálculo em duas camadas:

| Deslocamento | De → até | Como estima |
|---|---|---|
| **Veículo** (entre paradas) | parada do veículo(Pn) → parada do veículo(Pn+1) | velocidade km/h (configurável), pela rua, respeitando mão única (ADR-002) |
| **A pé** (dentro da parada) | parada do veículo → endereços → parada do veículo (**circuito**) | velocidade a pé + tempo por entrega (configuráveis); pedestre **não** tem mão única |

> O veículo só "para" nas paradas do veículo; a caminhada de cada parada é um **circuito fechado** que sai e volta ao ponto do veículo. Por isso a parada do veículo é necessária — sem ela não dá pra estimar a ida e volta a pé.

### Ordem dos endereços a pé dentro da parada

- **Padrão:** **varredura horária** a partir da **parada do veículo** — ordena os endereços pelo **ângulo (bearing)** em torno dela (`atan2`, custo zero). Faz um **laço** que volta perto de onde começou — ideal para o circuito. (Melhor que "vizinho mais próximo", que pode terminar longe do veículo e encarecer o retorno.)
- **Override manual (essencial):** a ordem automática é só sugestão. O usuário **reordena à mão** sempre que quiser — nenhum algoritmo sabe que "a entrada do prédio é pelos fundos". O controle manual é o diferencial; o auto-ordenamento só precisa ser "bom o bastante".
- **Mover a parada do veículo recalcula a ordem:** arrastou o veículo para outro ponto da rua, a varredura horária é refeita a partir dele. Custo zero.

### Sugestão da próxima parada (linha tracejada)

- **Referência = parada do veículo da última parada:** a sugestão da próxima parte de **onde o veículo ficou** — por isso muda muito conforme a posição do veículo.
- **Auto-seleciona o mais próximo:** a linha tracejada já aponta o endereço mais próximo **fora do raio** (desempate pela varredura horária). **Desbotada** no rascunho; **mais forte** ao concluir.
- **Clicar em outro re-direciona:** tocar em qualquer endereço move a linha tracejada para ele e mostra a distância — comparar destinos é só tocar; a próxima continua **trocável**.

### Distância a pé pelas ruas (não em linha reta)

- A distância a pé exibida é a de **caminhada pelas ruas** (grafo, pedestre — ignora mão única), **não linha reta**.
- **Performance:** rankeia o "mais próximo" por linha reta (barato) e calcula o **caminho de rua + distância real só para o alvo selecionado** (um A* por alvo). Linha reta só como **fallback** enquanto o grafo não carregou.

### Parada do veículo — um ponto livre na rua (não um endereço)

- A parada do veículo é um **ponto na malha viária**, **separado dos endereços** — pode ficar numa rua principal sem entrar na rua do endereço, pra dar menos volta. Tecnicamente, é um ponto **projetado na aresta de rua mais próxima** (map matching, `match.ts`/RF-005.5).
- **Posição sugerida (por ora): em frente ao endereço selecionado** ao criar a parada. É o **simples**; um otimizador que ache o ponto de **menor volta** fica para o futuro.
- O usuário **arrasta** o veículo para outro ponto da rua quando quiser; a ordem a pé é **reordenada automaticamente a partir dele**. **Não há** veículo "ao vivo" por GPS — é sempre o ponto sugerido/movido pelo usuário.

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
| Parada (fechada / selecionada) | **Adicionar endereço** · **Desfazer parada** · **mover a parada do veículo** (arrastar na rua) |
| Endereço dentro de uma parada | **Remover da parada** |

**Card "Etiqueta do Pacote":** ao selecionar um endereço no Roteirizar, suas infos aparecem num card titulado **"Etiqueta do Pacote"** — endereço + `Parada {Stop} · Seq {Sequence}` + código (`SPX TN`) — **separado** dos botões de ação. Mesmos dados da execução (§14), mas sem misturar com as ações de montar parada.

**Remoção — regra de ouro: endereço nunca some (é entrega real).**

- **Desfazer parada:** desagrupa; os endereços voltam a **livres**. Avisa que a parada será desfeita — mas as entregas permanecem.
- **Remover endereço da parada:** vira livre. A **parada do veículo não muda** (é independente dos endereços); a ordem a pé é recalculada sem ele.

**Adicionar órfão a parada existente:** select com a parada **mais próxima pré-selecionada** (liberdade de trocar) — não "sempre a última".

**Limite de distância:** **sem trava.** O raio só serve ao **agrupamento automático** na criação da parada. A inclusão manual é livre; se o endereço estiver muito longe da **parada do veículo**, mostra **aviso suave** (orienta, não bloqueia).

---

## 10. Decisões fechadas

1. **Numeração — Shopee × nossa:** ✅ no mapa, `Pn`/`En` (com cor) são a **numeração nova da rota manual**. A numeração da Shopee (`Stop` + `Sequence`) é ignorada **apenas para a ordem da rota** — mas é **preservada como identidade da etiqueta** do pacote e **exibida na execução** (ver §14): é por ela que o entregador acha o pacote na sacola. O **código** (`SPX TN`) também é preservado para chamados/problemas.
2. **Ordem dos endereços a pé na parada:** ✅ o app **ordena automaticamente** (varredura horária a partir da **parada do veículo**) **e** o usuário pode **reordenar à mão** a qualquer momento (ver §6).
3. **Parada do veículo:** ✅ **(decisão 26/06/26 — supersede a âncora-endereço)** cada parada tem uma **parada do veículo** = **um ponto livre na rua**, **separado** dos endereços (pode parar numa rua principal sem entrar na do endereço, pra dar menos volta). Base do **circuito** a pé e do salto de veículo entre paradas. **Posição sugerida: em frente ao endereço selecionado** (otimizador de "menor volta" = futuro); **movível** pelo usuário; mover **recalcula a ordem a pé**. Projetada na rua via map matching (`match.ts`/RF-005.5). Sem GPS ao vivo.
4. **Veículo ao vivo por GPS:** ❌ não há posição de veículo por GPS ao vivo. A parada do veículo é sempre o ponto **sugerido/movido pelo usuário**. (Mantém a decisão de 24/06/26, agora sobre o ponto do veículo em vez do endereço-âncora.)
5. **Ponto inicial:** ✅ **GPS** (`navigator.geolocation`, grátis) como principal; **toque no mapa** como alternativa; opcional **partir de um endereço da planilha**. **Não** usar "digitar endereço" (exigiria geocoding pago/limitado).
6. **Rótulo dos marcadores:** ✅ **só número, sem letra**; geometria distingue parada (quadrado) de endereço (círculo). Palavra "Parada/Stop" só em `UI_LABELS` (i18n — Shopee em outros países).
7. **Cor:** ✅ parada e seus endereços = **mesma cor**; seleção = **realce** (não outra cor); só a parada selecionada expande.
8. **Contagem e parada do veículo:** ✅ **badge amarelo** atrás do marcador mostra nº de endereços (parada fechada) ou nº de pacotes (endereço > 1), visível **sem clicar**. A **parada do veículo** é um **marcador próprio**, **oculto na visão geral** e visível só com a parada selecionada. *(A "borda grossa" deixou de significar âncora.)*
9. **Remoção e inclusão:** ✅ desfazer parada (endereços viram livres) · remover endereço (vira livre; a **parada do veículo não muda**) · incluir órfão via **select da parada mais próxima** · **sem trava de distância** (só aviso suave). Detalhe em §9.
10. **Painéis de ação por contexto:** ✅ aprovados em protótipo (nada selecionado · órfão · parada · endereço na parada) — contrato de UI da TASK-RF-006.
11. **Sugestão e raio:** ✅ ao criar parada, **círculo do raio** (centrado no **endereço selecionado**) mostra os candidatos; a sugestão da **próxima parada** parte da **parada do veículo da última parada** e **auto-seleciona o mais próximo fora do raio** (desempate horário), **desbotada no rascunho → mais forte ao concluir**, e **re-direciona ao clicar** em outro endereço; **distância a pé pelas ruas** (rank por linha reta, caminho/distância real só do alvo via A*; linha reta só como fallback enquanto o grafo carrega).
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
| **Multi-rota** (tem `Corridor Cage`) | Seletor de rotas; **ao escolher uma rota**, toggle **`[Original \| Meu roteiro]`** — pode-se montar um **Roteiro** dessa rota (decisão final 24/06/26; antes era "só visualizar"). |
| **Rota única** (`isSingleRoute`) | Toggle **`[Original \| Meu roteiro]`** no topo (padrão Original). Original = PNG read-only; Meu roteiro = SVG editável. Ramo da TASK-RF-010. |

- **Execução** não é um terceiro segmento do toggle: é um **fluxo de tela cheia** (§14) lançado por **ação** ("Executar agora", a partir de uma rota salva ou após salvar) — entra-se de propósito, não por alternância.

---

## 12. Ciclo da rota: criar → salvar → executar

- **Salvar = rascunho auto-salvo** (sem trava de completude): o Roteiro persiste mesmo **incompleto**, para continuar depois (começar do zero é chato). A **completude (`0 faltando`)** é exigida só para **executar** — o botão **'Iniciar roteiro'** só aparece quando completo.
- **Auto-roteirizar:** botão que monta tudo sozinho — a partir do início, agrupa o vizinho mais próximo + inclui quem está no **raio configurado**, criando paradas até acabar os endereços. **Reusa as funções do modo manual**; gera um **rascunho editável** (não final). É o "automático + ajuste à mão".

---

## 13. Persistência, lista e import/export

- **Onde fica salvo:** IndexedDB **no aparelho** (local, offline, sem login). É **por dispositivo** — não sincroniza na nuvem (consequência do modelo sem backend).
- **Importar planilha nova não apaga rotas salvas:** começa um novo planejamento; salvar cria uma nova rota. Nada é sobrescrito sem apagar.
- **Onde encontrar:** aba **Rotas**.
- **Dois imports distintos:** (a) **planilha Shopee** → planejamento do zero; (b) **JSON nosso** → rota já configurada, pronta para executar.
- **Export/import = JSON autocontido** (pontos + paradas + **parada do veículo** + config). É como passar a rota pronta para um **ajudante** ou trocar de aparelho.

---

## 14. Execução da rota

Tela focada em **uma entrega por vez** (motorista em movimento; botões grandes):

- **Distância até a próxima entrega** + botão **"Abrir GPS"** (deep link Maps/Waze; a pé dentro da parada; entre paradas, leva até a **parada do veículo**).
- Botão **"Concluir entrega"** → confirma e **pula o foco para a próxima** automaticamente; **"Desfazer"** reverte a última.
- **Avançar / retroceder** entre as entregas muda o foco manualmente.
- **"Pausar rota"** sai da execução **salvando onde parou** (resumível). Durante a execução o Roteiro **não é editável** (edita-se só fora dela).
- **Modo lista** (sem mapa), alternável com o modo mapa.
- **Sem botão de contato:** o app **não** tem contato/telefone do destinatário — essa ação não existe. (Só "Abrir GPS" + "Concluir entrega".)
- **% concluída** + contagem (ex.: `31/90`).
- **Previsão de término** (agora + tempo estimado restante).
- **Ordem da parada na execução:** segue a ordem definida no planejamento (circuito a partir da **parada do veículo**). **Sem** reordenação por GPS (decisão final 24/06/26).

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

## 15. Integração com o app legado (não recomeçar do zero)

O roteirizador **nasce dentro do app que já existe**, reaproveitando o máximo. Fluxo legado mantido:

**tela inicial → escolher rota → Sumário → "Ver no Mapa" → mapa.** O Roteirizar/Executar partem do Sumário/mapa, não de uma tela nova.

### 15.1 Sumário (card) — ganha uma seção de Roteiro (não é "lançador")

- O **card de Sumário permanece** e **nenhuma info resumida do romaneio sai** (AT, Hub, pacotes, paradas, bairros, etc.). Na rota única, campos ausentes na planilha aparecem como "Sem dados"; pacotes/paradas/cidade seguem calculados.
- **Os 3 botões não mudam:** Ver no Mapa · Tabela Simplificada · Tabela Original (multi e único iguais). **Roteirizar/Executar não são botões do Sumário.**
- **Quando há Roteiro**, o Sumário ganha **uma seção nova de resumo do Roteiro** (paradas; distância veículo/a pé/total; tempo veículo/a pé/total), **abaixo** da seção de dados brutos.
- Roteirizar/Executar entram **dentro do mapa**: toggle **`Original | Meu roteiro`** (padrão Original) + **botão inferior** — 'Iniciar roteirização' (sem roteiro) / 'Iniciar roteiro' (executar, só se completo). 'Ver no Mapa' abre sempre em **Original**; o atalho da home abre em **Meu roteiro**. (Decisão final 24/06/26.)

### 15.2 Tela inicial

- Mantém **"Enviar romaneio"**.
- **Instruções viram spoiler** (expande no clique) e são **atualizadas**: as atuais valem só para **multi-rota**; adicionar bloco de **rota única** = "**exporte sua rota no app oficial da empresa e importe aqui**".
- **Uma lista de salvos** (não duas), com cards **tipados** distinguidos por cor/rótulo:
  - **Romaneio Único** · data · "Sem roteiro" **ou** o Roteiro atrelado (atalho).
  - **Romaneio Multi** · data · os Roteiros atrelados (**1 por rota**), cada um com atalho.
  - **Roteiro Exportado** (importado avulso) · data — atalho abre direto em **'Meu roteiro'** (sem 'Original').
  - O atalho de um Roteiro abre o mapa já em **'Meu roteiro'**.

### 15.3 Inferências legadas — o que fica e o que sai

- **Comercial (residencial × comercial):** **permanece e roda para TODO romaneio** (decisão 25/06, TASK-RF-016) — **mesmo com** a coluna `Location Type` (classificação da Shopee é não-confiável). A inferência pelo complemento do endereço **manda**; a coluna é só fallback quando indefinido. Conserta também a rota única (sem a coluna, antes nem inferia).
- **Área de risco / ESEDC (Correios):** **removida do projeto inteiro** — ver **ADR-005** (recurso informal, RJ-only, não escala). Some do Sumário, tabela e ícones.
- **Bairro:** o app **já usa o CEP quando há** (senão, o nome da planilha, que tem erros de digitação tipo "Copacabana"/"Copacabada"). Cobertura **nacional de CEP→bairro é futuro**; o dataset atual já dá conta do escopo atual.

### 15.4 UI mínima quando o mapa está visível

Princípio: **mapa dominante, overlay enxuto.** Os protótipos anteriores exageraram na UI sobre o mapa — manter contadores/painéis compactos e colapsáveis. Ajuste fino nos **testes práticos**.

---

## Última Atualização

- **Data:** 24/06/26
- **Por:** spec do modo Roteirizar + app shell/navegação (ADR-003), ciclo da rota, persistência/export, execução e integração com legado (§15). Base para TASK-RF-006/008/009/011/012/013/014.
- **Atualização 24/06/26 (decisões finais):** §11 — **multi-rota também roteirizável** (reverte "só visualizar"); §2/§6/§10/§14 — âncora é **um endereço da parada**, trocável pelo usuário, sem GPS ao vivo.
- **Atualização 26/06/26 — "Parada do veículo" (supersede a âncora-endereço):** a âncora deixa de ser o 1º endereço e vira a **parada do veículo** = um **ponto livre na rua** (projetado via map matching), separado dos endereços, pra poder parar numa rua principal sem entrar na do endereço. Caminhada = **circuito** (sai e volta ao veículo). Veículo **sugerido em frente ao endereço selecionado** (otimizador de menor volta = futuro), **arrastável**, **oculto na visão geral** (aparece só com a parada selecionada). Sugestão da próxima parte de **onde o veículo ficou** (tracejado desbotado → forte, trocável). Afeta §2/§3/§4/§5/§6/§9/§10/§13/§14.
  - **Implicações a executar (não feitas aqui):** (1) **modelo** — `RouteStop.anchorPointId` (id de endereço) → algo como **`vehicleStop: LatLng`** (ponto na rua) em `src/types/routing.ts`, na fase da RF-006; (2) **ADR-008 §11** — a nota "borda grossa = âncora no roteirizar" foi ajustada (não há mais âncora-endereço).
- **Status:** rascunho de trabalho; §9 (decisões) fechado.
