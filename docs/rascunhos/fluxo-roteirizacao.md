# Fluxo do Roteirizador: Base para o Protótipo

> Passo a passo e estados visuais do modo **Roteirizar** (rota única). Serve de base para o protótipo de tela e para a TASK-RF-006. Documento de trabalho: especulativo e refinável. Complementa `draft-roteirizador-a-pe.md` (visão) e segue a ADR-002 (roteamento local).
>
> 🖼️ **Referência visual:** galeria em [`prototipos/telas-roteirizador/index.html`](../../prototipos/telas-roteirizador/index.html) · **telas de média fidelidade** em [`prototipos/telas-media-fidelidade/`](../../prototipos/telas-media-fidelidade/) (ver o `README` do índice). Este `.md` é a fonte **textual** e **decide** em caso de conflito; as imagens **ilustram**. Manter em sincronia ao mudar UI.

---

## 1. Em uma frase

Roteirizador **manual** para entregador Shopee: importa a planilha (70 a 150 endereços) e o usuário monta a rota **parada por parada**, no mapa, com estimativa **a pé** dentro de cada parada e estimativa de **veículo** entre paradas, porque a roteirização automática da Shopee é ruim e ninguém entrega de forma tão personalizada.

---

## 2. Vocabulário (entidades)

| Termo | O que é |
|---|---|
| **Endereço** (ponto) | Uma linha da planilha. Tem número (do pacote), rua + número, complemento, bairro e CEP. |
| **Endereço multi-pacote** | Mesmo endereço/número com mais de um pacote. Conta como **um ponto** no mapa, com vários pacotes. |
| **Pacote** | Uma encomenda individual (uma linha/etiqueta da planilha, com `SPX TN`). Vários pacotes podem estar no mesmo endereço (Vol 1, Vol 2…). |
| **Parada** | Agrupamento de endereços próximos, atendidos **a pé** a partir de onde o veículo para. Rotulada `P1`, `P2`… |
| **Âncora** (parada do veículo) | O **ponto na rua** onde o veículo para para atender a parada. **Não é um endereço**: é um ponto livre **grudado na malha viária**, sempre **no meio da rua** (os endereços apontam pra calçada/prédio; a âncora, pra pista). Pode ficar numa rua principal sem entrar na do endereço, pra dar menos volta. De onde a caminhada **sai e volta** (circuito) e o ponto que o veículo visita entre paradas. **Posição sugerida (por ora): em frente ao endereço selecionado** (otimizador de "menor volta" = futuro). **Movível** (arrastar); **"tornar âncora"** num endereço faz a âncora **assumir a coordenada** dele; **"resetar"** volta ao padrão. **Rótulo:** curto = "âncora"; completo = "parada do veículo (âncora)", mesma coisa. |
| **Ponto inicial** | De onde a rota começa (referência da primeira sugestão). |
| **a pé × veículo** | Deslocamento **dentro** de uma parada = a pé (**circuito**: sai e volta à **parada do veículo**); deslocamento **entre** paradas = veículo (**parada do veículo → parada do veículo**). |

> **Hierarquia (3 níveis): espinha dorsal do app:** uma **Parada** contém **Endereços**; um **Endereço** contém **Pacotes**. Reflete o modelo (`RouteStop` → `DeliveryPoint` → `DeliveryPackage`) e o **drill-down da UI**: o mapa mostra **paradas** → expandir uma parada mostra seus **endereços** → selecionar um endereço mostra seus **pacotes** (card "Etiqueta do Pacote", §9/§14).
>
> **Vocabulário único (i18n):** **Parada · Endereço · Pacote · Âncora** (rótulo curto) / **Parada do veículo (âncora)** (completo, mesma coisa), centralizado em `UI_LABELS`. Evitar "agrupamento", "circuit".

---

## 3. Sistema visual dos ícones

Quatro variáveis visuais, cada uma com **um** significado (sem sobreposição):

| Variável | Significado |
|---|---|
| **Geometria** | tipo: **quadrado = parada**, **círculo = endereço** |
| **Número** (dentro) | ordem: parada `1, 2, 3…`; endereço dentro da parada `1, 2, 3…` (**só número, sem letra**) |
| **Cor** | **tipo do local** (igual ao Original: decisão 26/06): **verde** = residencial, **azul** = comercial, **cinza** = indefinido; a **parada** assume o tipo dominante (**comercial vence**). Livre/órfão = **desbotado**; início = marcador verde próprio. |
| **Âncora** (parada do veículo) | marcador **próprio** (ícone de veículo), no **meio da rua**: **só aparece com a parada selecionada** (oculto na visão geral, pra não poluir). |
| **Badge amarelo** (atrás) | **contagem**: numa parada fechada = nº de endereços; num endereço = nº de pacotes (só se > 1) |

| Elemento | Como aparece |
|---|---|
| Endereço livre (órfão) | círculo cinza desbotado, nº do pacote da planilha |
| Parada fechada | quadrado colorido, nº de ordem, **badge amarelo com nº de endereços** |
| Parada selecionada | quadrado **realçado** (anel/brilho: mesma cor, não outra) → **expande** os endereços **e** mostra a parada do veículo |
| Endereço dentro da parada | círculo da **cor do seu tipo**, nº de ordem; **só aparece com a parada selecionada** |
| Parada do veículo (parada expandida) | marcador **próprio** (ícone de veículo) na rua; **arrastável**; some ao colapsar a parada |
| Endereço multi-pacote | círculo + **badge amarelo** com o nº de pacotes |
| Início | marcador verde próprio |
| Sugestão da próxima parada | **linha tracejada** até o endereço mais próximo fora do raio. **Desbotada no rascunho**; ao **concluir** a parada fica **mais forte** (mas ainda trocável tocando em outro). |
| Trecho configurado | **linha contínua** de veículo (**parada do veículo → parada do veículo**) + **laço tracejado** a pé (circuito que **sai e volta** à parada do veículo). |
| Círculo de raio (ao criar parada) | **círculo tracejado** do raio configurado, centrado no **endereço selecionado**: mostra quem entra na parada. |
| Candidato no raio | endereço **dentro** do círculo, destacado (entra na parada ao criar) |

> Regra de leitura: **geometria = o quê (parada/endereço); número = ordem; cor = tipo (verde res / azul com / cinza indef); badge amarelo = quantos.** A **âncora** é um marcador próprio (no meio da rua) que **só aparece ao selecionar a parada**. Na visão geral já vejo as paradas numeradas e, pelo badge, quantos endereços cada uma tem: sem clicar, e sem a âncora poluindo.

> **Marcador da parada do veículo:** corpo **escuro** (slate/navy) com **anel ciano** (cor da marca), **fora** da paleta funcional verde/azul/cinza das entregas, pra nunca se confundir com um endereço. Dentro, o **ícone do veículo** conforme o **Modo de Transporte** (moto · carro · van · caminhão · bici · a pé). Mantém a **ponta fina**; é **arrastável** na rua e **oculto na visão geral** (aparece só com a parada selecionada). Os glyphs devem vir de um **set SVG aberto**: **Tabler Icons** (MIT, tem `motorbike`) é a fonte recomendada (evitar desenhar à mão). Referência visual: [`prototipos/marcadores-svg/index.html`](../../prototipos/marcadores-svg/index.html) (`createVehicleMarker`).

> **i18n:** os marcadores no mapa **nunca** carregam letra/texto traduzível, só número. A palavra "Parada"/"Stop"/etc. vive apenas em `UI_LABELS` (legenda, painel, botões). Assim o mapa serve qualquer idioma sem mudança (Shopee em outros países). Decisão alinhada à ADR-001.

### Legenda do mapa

Com o sistema de ícones denso, o mapa traz uma **legenda colapsável** (um "?" no canto que abre/fecha: não rouba espaço no celular). Ela **espelha exatamente esta seção** (geometria · cor · badge amarelo · borda grossa · linhas de veículo/a pé/sugestão), para **nunca divergir** do que é desenhado. Textos via `UI_LABELS` (i18n).

---

## 4. Passo a passo do fluxo

**0. Importar a planilha.** Todos os endereços surgem como **círculos coloridos pelo tipo** (verde residencial / azul comercial / cinza indefinido, na **paleta neon clara do modo**: revisão 08/07: supersede os "pontos cinza desbotados"; a cor mais clara é o que diferencia o modo do Original). Badge de pacotes quando o endereço tem mais de um.

**1. Definir o ponto inicial.** O usuário marca o início; ele aparece destacado no mapa.

**2. Sugestão do primeiro endereço.** O app sugere, em **linha tracejada**, o endereço **mais próximo** do ponto inicial. O usuário pode aceitar ou **escolher outro**.

**3. Ver informações do endereço.** Ao tocar num endereço, abre um card com os dados da planilha: **rua + número, complemento, bairro, CEP**. Se for multi-pacote, mostra **quantos pacotes**.

**4. Criar a parada (rascunho desbotado).** O usuário toca num endereço para **criar uma parada**. Surge um **rascunho esmaecido** com três coisas: os endereços **dentro do raio** (§8) como **candidatos sugeridos** (o usuário escolhe quais entram, **não** entram sozinhos), a **âncora** sugerida **em frente ao endereço selecionado** (no meio da rua), e a **linha tracejada da próxima parada** (até o endereço mais próximo fora do raio). Tudo **desbotado** sinaliza "isto é rascunho editável".

**5. Ajustar a parada (modo edição).** O usuário **adiciona/remove** endereços e **arrasta a parada do veículo** pela rua. Mover o veículo **recalcula** a ordem a pé e muda **qual é a próxima parada sugerida** (a sugestão parte de onde o veículo ficou).

**6. Concluir a parada.** Ao fechar a `P1`, o rascunho **firma** (cores vivas) e a **linha tracejada da próxima parada fica mais forte**: mas **continua sendo sugestão**: tocar em outro endereço re-aponta a próxima.

**7. Repetir.** Passos 3 a 6 para `P2`, `P3`… até **todos os endereços** estarem em alguma parada.

**8. Salvar a rota.** Só é permitido salvar quando **todos os endereços/pacotes** foram atribuídos (HUD mostra `0` faltando).

---

## 5. Expandir e colapsar uma parada

- **Não selecionada:** aparece **apenas o ícone da parada** (`Pn`), os endereços ficam escondidos.
- **Ao tocar na parada:** ela **expande** e mostra os endereços (`E1`, `E2`…) na **mesma cor da parada** **e a parada do veículo** (marcador próprio, oculto na visão geral), junto das infos da parada (qtd de endereços, pacotes, tempo a pé estimado).

---

## 6. Modelo de cálculo e estimativas (tempo e distância)

A **parada do veículo** organiza o cálculo em duas camadas:

| Deslocamento | De → até | Como estima |
|---|---|---|
| **Veículo** (entre paradas) | parada do veículo(Pn) → parada do veículo(Pn+1) | velocidade km/h (configurável), pela rua, respeitando mão única (ADR-002) |
| **A pé** (dentro da parada) | parada do veículo → endereços → parada do veículo (**circuito**) | velocidade a pé + tempo por entrega (configuráveis); pedestre **não** tem mão única |

> O veículo só "para" nas paradas do veículo; a caminhada de cada parada é um **circuito fechado** que sai e volta ao ponto do veículo. Por isso a parada do veículo é necessária: sem ela não dá pra estimar a ida e volta a pé.

### Ordem dos endereços a pé dentro da parada

- **Padrão (rev. RF-006.17):** o **1º é o endereço mais próximo** da parada do veículo (âncora coincidente ⇒ distância 0 ⇒ é ela mesma). A partir dele o circuito segue a **varredura por ângulo (bearing)**: mas no **sentido** (horário/anti-horário) que coloca em **2º o vizinho mais próximo do 1º** (com o 1º em distância 0, é o 2º que revela para que lado varrer). Continua sendo um **laço** que não se cruza. `atan2` + haversine, custo zero.
- **Sem reordenação manual (RF-006.6):** a ordem é **100% derivada** de dois controles, a **âncora** (parada do veículo) e o **sentido** ("Inverter ordem", que alterna horário/anti-horário mantendo o 1º mais próximo). Não há arrastar-para-reordenar: definir a âncora e o sentido é o suficiente.
- **Mover a parada do veículo recalcula a ordem:** arrastou o veículo para outro ponto da rua, a ordem é refeita a partir dele (novo 1º = mais próximo, novo sentido) e um **aviso** confirma a reordenação. Custo zero.

### Sugestão da próxima parada (linha tracejada)

- **Referência = parada do veículo da última parada:** a sugestão da próxima parte de **onde o veículo ficou**, por isso muda muito conforme a posição do veículo.
- **Auto-seleciona o mais próximo:** a linha tracejada já aponta o endereço mais próximo **fora do raio** (desempate pela varredura horária). **Desbotada** no rascunho; **mais forte** ao concluir.
- **Clicar em outro re-direciona:** tocar em qualquer endereço move a linha tracejada para ele e mostra a distância, comparar destinos é só tocar; a próxima continua **trocável**.

### Distância a pé pelas ruas (não em linha reta)

- A distância a pé exibida é a de **caminhada pelas ruas** (grafo, pedestre: ignora mão única), **não linha reta**.
- **Performance:** rankeia o "mais próximo" por linha reta (barato) e calcula o **caminho de rua + distância real só para o alvo selecionado** (um A* por alvo). Linha reta só como **fallback** enquanto o grafo não carregou.

### Parada do veículo: um ponto livre na rua (não um endereço)

- A parada do veículo é um **ponto na malha viária**, **separado dos endereços**: pode ficar numa rua principal sem entrar na rua do endereço, pra dar menos volta. Tecnicamente, é um ponto **projetado na aresta de rua mais próxima** (map matching, `match.ts`/RF-005.5).
- **Posição sugerida (por ora): em frente ao endereço selecionado** ao criar a parada. É o **simples**; um otimizador que ache o ponto de **menor volta** fica para o futuro.
- O usuário **arrasta** o veículo para outro ponto da rua quando quiser; a ordem a pé é **reordenada automaticamente a partir dele**. **Não há** veículo "ao vivo" por GPS: é sempre o ponto sugerido/movido pelo usuário.

### Exibição: dois níveis + por-perna

1. **Total acumulado**: de **todo o percurso já configurado** (veículo + a pé somados).
2. **Próximo trecho**: a partir do **elemento selecionado agora**, até o próximo endereço/parada.
3. **Por-perna (dentro da parada)**: cada endereço da lista mostra **tempo + metros do ponto anterior até ele** (com **ícone de pedestre** = a pé), pra o usuário decidir "**vale andar ou criar outra parada?**". O **total da parada** = soma das pernas do **circuito** (ida e volta a pé) **+** o **tempo de serviço** por entrega.

---

## 7. HUD: contadores sempre visíveis

- **Faltando**: com a **unidade explícita** (evita confundir cliques com volume): progresso de atribuição em **endereços** (ex.: `40/52` endereços, recomendado como número principal, é o que falta *fazer*) e o **volume** em **pacotes** (ex.: `86/88` pacotes, secundário). Um endereço multi-pacote é **uma** atribuição.
- **Paradas criadas**: ex.: `3`.
- **Distância total** (veículo + a pé): ex.: `4,1 km`.
- **Tempo total estimado** (veículo + a pé): ex.: `1h12`.

---

## 8. Configurações

- **Raio de agrupamento (m):** ao criar uma parada, mostra os endereços dentro do raio como **candidatos sugeridos**, o usuário escolhe quais entram (**não** entram sozinhos).
- **Velocidade a pé** e **tempo por entrega** (min): base da estimativa dentro da parada.
- **Velocidade de veículo (km/h):** base da estimativa entre paradas.

---

## 9. Interações por contexto (botões e remoção)

Os botões dependem do que está selecionado:

| Selecionado | Botões |
|---|---|
| Endereço livre (órfão) | **Criar parada** (vira a próxima na ordem) · **Incorporar na parada** (select pré-selecionando a mais próxima) |
| Âncora (parada do veículo) selecionada | **Mover âncora** (arrastar na rua) · **Resetar âncora** (volta ao padrão: em frente ao selecionado) |
| Parada (fechada / selecionada) | **Adicionar endereço** · **Desfazer parada** |
| Endereço dentro de uma parada | **Remover da parada** · **Tornar âncora** (a âncora **assume a coordenada** deste endereço) · **Inverter ordem** |

**Card "Etiqueta do Pacote":** ao selecionar um endereço no Roteirizar, suas infos aparecem num card titulado **"Etiqueta do Pacote"**, endereço + `Parada {Stop} · Seq {Sequence}` + código (`SPX TN`), **separado** dos botões de ação. Mesmos dados da execução (§14), mas sem misturar com as ações de montar parada.

**Remoção: regra de ouro: endereço nunca some (é entrega real).**

- **Desfazer parada:** desagrupa; os endereços voltam a **livres**. Avisa que a parada será desfeita: mas as entregas permanecem.
- **Remover endereço da parada:** vira livre. A **parada do veículo não muda** (é independente dos endereços); a ordem a pé é recalculada sem ele.

**Adicionar órfão a parada existente:** select com a parada **mais próxima pré-selecionada** (liberdade de trocar), não "sempre a última".

**Limite de distância:** **sem trava.** O raio só serve à **sugestão de candidatos** na criação da parada. A inclusão manual é livre; se o endereço estiver muito longe da **âncora**, mostra **aviso suave** (orienta, não bloqueia).

---

## 10. Decisões fechadas

1. **Numeração: Shopee × nossa:** ✅ no mapa, `Pn`/`En` (com cor) são a **numeração nova da rota manual**. A numeração da Shopee (`Stop` + `Sequence`) é ignorada **apenas para a ordem da rota**: mas é **preservada como identidade da etiqueta** do pacote e **exibida na execução** (ver §14): é por ela que o entregador acha o pacote na sacola. O **código** (`SPX TN`) também é preservado para chamados/problemas.
2. **Ordem dos endereços a pé na parada:** ✅ o app **ordena automaticamente**, o **mais próximo da parada do veículo em 1º**, seguindo a varredura no sentido do vizinho mais próximo (rev. RF-006.17, ver §6). A ordem é **derivada** (âncora + sentido); **não** há reordenação manual (RF-006.6): o usuário controla âncora e "Inverter ordem".
3. **Âncora (parada do veículo):** ✅ **(decisão 26/06/26)** cada parada tem uma **âncora** = **ponto livre na rua**, sempre **no meio da rua**, separado dos endereços (pode parar numa rua principal sem entrar na do endereço). Base do **circuito** a pé e do salto de veículo entre paradas. **Sugerida em frente ao endereço selecionado** (otimizador de "menor volta" = futuro); **movível** (arrastar); **"tornar âncora"** num endereço faz a âncora **assumir a coordenada** dele; **"resetar"** volta ao padrão. Projetada na rua via map matching (`match.ts`). Sem GPS ao vivo. **Rótulo:** curto "âncora" / completo "parada do veículo (âncora)".
4. **Veículo ao vivo por GPS:** ❌ não há posição de veículo por GPS ao vivo. A parada do veículo é sempre o ponto **sugerido/movido pelo usuário**. (Mantém a decisão de 24/06/26, agora sobre o ponto do veículo em vez do endereço-âncora.)
5. **Ponto inicial:** ✅ **GPS** (`navigator.geolocation`, grátis) como principal; **toque no mapa** como alternativa; opcional **partir de um endereço da planilha**. **Não** usar "digitar endereço" (exigiria geocoding pago/limitado).
6. **Rótulo dos marcadores:** ✅ **só número, sem letra**; geometria distingue parada (quadrado) de endereço (círculo). Palavra "Parada/Stop" só em `UI_LABELS` (i18n: Shopee em outros países).
7. **Cor:** ✅ **(decisão 26/06)** cor = **tipo do local** (verde res / azul com / cinza indef), **igual ao Original** nos dois modos, some a "paleta por parada". A parada assume o **tipo dominante** (comercial vence). Seleção = **realce**; só a parada selecionada expande.
8. **Contagem e parada do veículo:** ✅ **badge amarelo** atrás do marcador mostra nº de endereços (parada fechada) ou nº de pacotes (endereço > 1), visível **sem clicar**. A **parada do veículo** é um **marcador próprio**, **oculto na visão geral** e visível só com a parada selecionada. *(A "borda grossa" deixou de significar âncora.)*
9. **Remoção e inclusão:** ✅ desfazer parada (endereços viram livres) · remover endereço (vira livre; a **parada do veículo não muda**) · incluir órfão via **select da parada mais próxima** · **sem trava de distância** (só aviso suave). Detalhe em §9.
10. **Painéis de ação por contexto:** ✅ aprovados em protótipo (nada selecionado · órfão · parada · endereço na parada), contrato de UI da TASK-RF-006.
11. **Sugestão e raio:** ✅ ao criar parada, **círculo do raio** (centrado no **endereço selecionado**) mostra os candidatos **sugeridos** (o usuário **escolhe** quais entram, **não** auto-inclui); a sugestão da **próxima parada** parte da **âncora da última parada** e **auto-seleciona o mais próximo fora do raio** (desempate horário), **desbotada no rascunho → mais forte ao concluir**, e **re-direciona ao clicar** em outro endereço; **distância a pé pelas ruas** (rank por linha reta, caminho/distância real só do alvo via A*; linha reta só como fallback enquanto o grafo carrega).
12. **Etiqueta no Roteirizar:** ✅ card **"Etiqueta do Pacote"** (endereço + `Parada/Seq` + código), separado dos botões de ação.

### Ainda a confirmar

- (nada pendente)

---

## 11. App shell e navegação (mobile-first)

Decisão em **ADR-003** (React Router). O app passa a ter:

- **Header:** título + engrenagem (Configurações de Rota, §8) + voltar quando aplicável.
- **Bottom tab bar** (só nas **telas de topo**): **HOME** (`/`, **enviar/importar** mais romaneios) e **Rotas** (`/rotas`, romaneios/roteiros **salvos**: selecionar, importar/exportar). *(2 abas; no máximo uma 3ª **Configurações**: ver nota.)*
- **A bottom-nav some quando há rota selecionada:** o **Sumário** e o **mapa aberto** são telas de **foco**, **sem abas**.

### Fluxo de navegação (e o "voltar")

- **HOME → enviar romaneio.** Se o arquivo for **exatamente o mesmo** de um já salvo, o app **detecta**, avisa "já importado" e **muda para Rotas com ele selecionado** (não duplica).
- **Rotas → selecionar** um romaneio/roteiro → **Sumário** da rota (sem bottom-nav).
- **Sumário → mapa** por **"Ver Original"** ou **"Ver Meu Roteiro"**: cada um abre o mapa com o **toggle já na aba certa**. **Fechar o mapa volta ao Sumário.**
- **Voltar do Sumário → Rotas** (a bottom-nav **reaparece**).

> **Decidido 26/06: 2 abas.** **Sem** a 3ª aba "Roteiro" (mantém Sumário/mapa como telas de **foco**, sem nav). No **máximo** uma 3ª aba **Configurações** (há espaço sobrando): poderia migrar a engrenagem do header pra lá. A decidir só isso.

### Modos do mapa (onde fica o toggle)

O toggle **não é** aba do menu inferior: vive **no topo do mapa** (controle segmentado abaixo do header). Abre-se pelo Sumário (**Ver Original** / **Ver Meu Roteiro**), já na aba certa. O que aparece depende do arquivo importado:

| Arquivo carregado | O que a aba Mapa mostra |
|---|---|
| **Multi-rota** (tem `Corridor Cage`) | Seletor de rotas; **ao escolher uma rota**, toggle **`[Original \| Meu roteiro]`**: pode-se montar um **Roteiro** dessa rota (decisão final 24/06/26; antes era "só visualizar"). |
| **Rota única** (`isSingleRoute`) | Toggle **`[Original \| Meu roteiro]`** no topo (padrão Original). Original = PNG read-only; Meu roteiro = SVG editável. Ramo da TASK-RF-010. |

- **Execução** não é um terceiro segmento do toggle: é um **fluxo de tela cheia** (§14) lançado por **ação** ("Executar agora", a partir de uma rota salva ou após salvar), entra-se de propósito, não por alternância.

---

## 12. Ciclo da rota: criar → salvar → executar

- **Salvar = rascunho auto-salvo** (sem trava de completude): o Roteiro persiste mesmo **incompleto**, para continuar depois (começar do zero é chato). A **completude (`0 faltando`)** é exigida só para **executar**: o botão **'Iniciar roteiro'** só aparece quando completo.
- **Auto-roteirizar:** botão que monta tudo sozinho, a partir do início, agrupa o vizinho mais próximo + inclui quem está no **raio configurado**, criando paradas até acabar os endereços. **Reusa as funções do modo manual**; gera um **rascunho editável** (não final). É o "automático + ajuste à mão".

---

## 13. Persistência, lista e import/export

- **Onde fica salvo:** IndexedDB **no aparelho** (local, offline, sem login). É **por dispositivo**: não sincroniza na nuvem (consequência do modelo sem backend).
- **Importar planilha nova não apaga rotas salvas:** começa um novo planejamento; salvar cria uma nova rota. Nada é sobrescrito sem apagar.
- **Detecção de duplicado:** se o arquivo importado for **exatamente o mesmo** de um já salvo (ex.: hash do conteúdo), o app **não duplica**, avisa "já importado" e **vai para Rotas com ele selecionado**.
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
- **Sem botão de contato:** o app **não** tem contato/telefone do destinatário, essa ação não existe. (Só "Abrir GPS" + "Concluir entrega".)
- **% concluída** + contagem (ex.: `31/90`).
- **Previsão de término** (agora + tempo estimado restante).
- **Ordem da parada na execução:** segue a ordem definida no planejamento (circuito a partir da **parada do veículo**). **Sem** reordenação por GPS (decisão final 24/06/26).

### Identificação do pacote no card (vem da planilha)

No mesmo card do endereço, aparecem os identificadores do pacote: cada um com um propósito:

| Mostra | Para quê | Origem |
|---|---|---|
| **Etiqueta:** `Parada {Stop} · Seq {Sequence}` | achar o pacote na sacola pela etiqueta física | numeração **da Shopee** (`Stop`, `Sequence`): não as `Pn/En` da rota |
| **Código:** `SPX TN` | chamado/problema com o pacote | `SPX TN` (rastreio) |
| Contexto da rota (ex.: "endereço 2 de 4 da parada") | saber onde está no trajeto | numeração **nossa** (`Pn/En`) |

- **Multi-pacote:** se o endereço tem mais de um pacote, o card **lista cada um** com sua etiqueta + código (são entregas distintas no mesmo ponto).
- Dados vêm do `rawData` de cada `DeliveryPackage` (`Stop`, `Sequence`, `SPX TN`): **sem mudança no modelo** (RF-004 intacta).

(Refина a TASK-RF-009.)

---

## 15. Integração com o app legado (não recomeçar do zero)

O roteirizador **nasce dentro do app que já existe**, reaproveitando o máximo. Fluxo legado mantido:

**tela inicial → escolher rota → Sumário → "Ver no Mapa" → mapa.** O Roteirizar/Executar partem do Sumário/mapa, não de uma tela nova.

### 15.1 Sumário (card): ganha uma seção de Roteiro (não é "lançador")

- O **card de Sumário permanece** e **nenhuma info resumida do romaneio sai** (AT, Hub, pacotes, paradas, bairros, etc.). Na rota única, campos ausentes na planilha aparecem como "Sem dados"; pacotes/paradas/cidade seguem calculados.
- **Botões do Sumário (revisão 26/06):** **Ver Meu Roteiro** · **Ver Original** · **Tabela Simplificada** · **Tabela Original**. Os dois "Ver…" **levam ao mapa** com o **toggle já na aba certa** (Meu roteiro / Original): ficam **juntos**. *(Supera a regra antiga de "3 botões fixos, roteirizar só no toggle": RF-43 atualizada.)*
  - **Botão adaptativo:** quando **ainda não há roteiro**, o botão "Ver Meu Roteiro" vira **"Criar Roteiro"** (abre o mapa em Meu roteiro e **inicia a construção manual**); quando **já existe**, é **"Ver Meu Roteiro"**. **Não** há botão "Criar/Gerar Roteiro" na aba Rotas: a criação mora **aqui**, no Sumário.
- **Quando há Roteiro**, o Sumário ganha **uma seção nova "Info Meu Roteiro"** (paradas de **veículo**; **pontos a pé**; distância veículo/a pé/total; tempo veículo/a pé/total), **abaixo** dos dados brutos do romaneio: **separada de propósito** pra não confundir números do Roteiro com os do romaneio (Shopee).
- **Executar** entra **dentro do mapa** (botão inferior 'Iniciar roteiro', só se completo). O toggle **`Original | Meu roteiro`** vive no topo do mapa; o Sumário só **pré-seleciona** qual abrir.

### 15.2 Tela inicial

- Mantém **"Enviar romaneio"**.
- **Instruções viram spoiler** (expande no clique) e são **atualizadas**: as atuais valem só para **multi-rota**; adicionar bloco de **rota única** = "**exporte sua rota no app oficial da empresa e importe aqui**".
- **A HOME é só enviar** (upload + instruções). A **lista de salvos vive na aba Rotas**: cards **tipados** por cor/rótulo. **Sem botão "Criar/Gerar Roteiro" no card:** tocar num **chip** (rota/AT) abre o **Sumário** dela; criar o roteiro acontece **lá** (botão adaptativo, §15.1).
  - **Romaneio Único** · data · **chips por AT** (cada import); o ícone do chip mostra o estado (sem roteiro / com roteiro).
  - **Romaneio Multi** · data · **chips por rota** (nº de rotas + nº de roteiros); **1 roteiro por rota**.
  - **Roteiro Exportado** (avulso) · data: atalho abre direto em **'Meu roteiro'** (sem 'Original').

### 15.3 Inferências legadas: o que fica e o que sai

- **Comercial (residencial × comercial):** **permanece e roda para TODO romaneio** (decisão 25/06, TASK-RF-016), **mesmo com** a coluna `Location Type` (classificação da Shopee é não-confiável). A inferência pelo complemento do endereço **manda**; a coluna é só fallback quando indefinido. Conserta também a rota única (sem a coluna, antes nem inferia).
- **Área de risco / ESEDC (Correios):** **removida do projeto inteiro**, ver **ADR-005** (recurso informal, RJ-only, não escala). Some do Sumário, tabela e ícones.
- **Bairro:** o app **já usa o CEP quando há** (senão, o nome da planilha, que tem erros de digitação tipo "Copacabana"/"Copacabada"). Cobertura **nacional de CEP→bairro é futuro**; o dataset atual já dá conta do escopo atual.

### 15.4 UI mínima quando o mapa está visível

Princípio: **mapa dominante, overlay enxuto.** Os protótipos anteriores exageraram na UI sobre o mapa, manter contadores/painéis compactos e colapsáveis. Ajuste fino nos **testes práticos**.

---

## Última Atualização

- **Data:** 24/06/26
- **Por:** spec do modo Roteirizar + app shell/navegação (ADR-003), ciclo da rota, persistência/export, execução e integração com legado (§15). Base para TASK-RF-006/008/009/011/012/013/014.
- **Atualização 24/06/26 (decisões finais):** §11, **multi-rota também roteirizável** (reverte "só visualizar"); §2/§6/§10/§14, âncora é **um endereço da parada**, trocável pelo usuário, sem GPS ao vivo.
- **Atualização 26/06/26: "Parada do veículo" (supersede a âncora-endereço):** a âncora deixa de ser o 1º endereço e vira a **parada do veículo** = um **ponto livre na rua** (projetado via map matching), separado dos endereços, pra poder parar numa rua principal sem entrar na do endereço. Caminhada = **circuito** (sai e volta ao veículo). Veículo **sugerido em frente ao endereço selecionado** (otimizador de menor volta = futuro), **arrastável**, **oculto na visão geral** (aparece só com a parada selecionada). Sugestão da próxima parte de **onde o veículo ficou** (tracejado desbotado → forte, trocável). Afeta §2/§3/§4/§5/§6/§9/§10/§13/§14.
  - **Implicações a executar (não feitas aqui):** (1) **modelo**, `RouteStop.anchorPointId` (id de endereço) → algo como **`vehicleStop: LatLng`** (ponto na rua) em `src/types/routing.ts`, na fase da RF-006, ✅ **feita em 05/07/26 (TASK-RF-021)**; (2) **ADR-008 §11**, a nota "borda grossa = âncora no roteirizar" foi ajustada.
- **Atualização 26/06/26 (revisão dos protótipos de média fidelidade: 5 decisões):**
  1. **Termo:** volta **"âncora"** como rótulo **curto**; completo = **"parada do veículo (âncora)"** (mesma coisa). Ajusta §2/§3/§10 e requisitos.
  2. **Cor = tipo nos dois modos** (verde res / azul com / cinza indef; comercial vence): **some a "paleta por parada"**. Igual ao Original. Afeta §3/§10 e ADR-008.
  3. **Raio sugere candidatos** (o usuário escolhe quais entram): **não** auto-inclui. Afeta §4/§8/§9/§10.
  4. **Tornar/Mover/Resetar âncora:** "tornar âncora" num endereço faz a âncora **assumir a coordenada** dele; "mover" arrasta livre; "resetar" volta ao padrão. §9.
  5. **Âncora sempre no meio da rua** (endereços apontam pra calçada/prédio; a âncora, pra pista). §2/§3.
  - **Do review: resolvido 26/06:** (a) **por-perna**, cada endereço mostra tempo + metros do **ponto anterior até ele** (ícone de pedestre = a pé; as letras "O/C" eram só placeholder do ícone), pra decidir "andar ou criar outra parada"; **total da parada** = soma das pernas (circuito) + tempo de serviço por entrega (ver §6). (b) "Gerar Roteiro" → **"Criar Roteiro"** (é **manual**, não o auto-roteirizar da RF-012). (c) A seção **"Info Meu Roteiro"** = totais **do Roteiro** (paradas de veículo + pontos a pé), **separada de propósito** dos números do **romaneio** (Shopee), pra não confundir.
  - **Do review: resolvido 26/06 (navegação):** bottom-nav = **HOME (enviar)** + **Rotas (salvos)**; **some** quando há rota selecionada (Sumário e mapa **sem abas**); fechar mapa → Sumário; voltar do Sumário → Rotas. Sumário tem **Ver Meu Roteiro** + **Ver Original** (ambos abrem o mapa com o toggle certo) + as 2 Tabelas. **Detecção de arquivo duplicado** (mesmo arquivo → avisa e seleciona o existente, sem duplicar). **2 abas** (HOME/Rotas), **sem** 3ª aba "Roteiro" (no máximo uma **Configurações**). **Sem botão de criar na aba Rotas**: a criação é o botão **adaptativo** do Sumário ("Criar Roteiro" quando não há / "Ver Meu Roteiro" quando há). Afeta §11/§13/§15.1/§15.2 (RF-38/RF-43 + RN-23). **Review do protótipo: fechado.**
- **Atualização 09/07/26: TASK-RF-006.4.16 (selecionar qualquer membro do grupo):** com a parada firmada **desagrupada** (2 cliques), **tocar qualquer endereço** do grupo agora o **seleciona**, o **destaque migra** no mapa (do âncora para o membro tocado) e o painel **"Endereço selecionado"** passa a mostrar **esse** endereço, com seu **marcador ordinal + complemento** (antes o toque no membro era inerte e só o âncora destacava; fecha o follow-up da .4.15). **Sem** membro escolhido = âncora/veículo como antes; **regrupar** (clicar fora) ou **refocar** outra parada **volta ao âncora**. Estado efêmero `selectedMemberId` (guarda `effectiveSelectedMemberId` = só vale na parada focada). Só no **Meu roteiro** (no Original os endereços individuais já selecionavam desde a .4.14).
- **Atualização 09/07/26: TASK-RF-006.4.14 (destaque forte + início plano):** o marcador **selecionado** passa a ser **ampliado + elevado** (além do anel/brilho) nos dois modos, antes o anel sozinho sumia no meio do cluster; e o **ponto inicial (losango)** ficou **plano** (sem anel/brilho) e do **mesmo tamanho** dos outros, **abaixo** do selecionado (a forma já o identifica). Candidatos do raio mantêm o brilho, mas sem o boost de tamanho (só o selecionado é o mais forte).
- **Atualização 09/07/26: TASK-RF-006.4.13 (destaque de seleção):** a linha **"Endereço selecionado"** (âncora/órfão) do Meu roteiro fica **destacada por padrão** (é a selecionada); e o **quadrado da parada que o painel está mostrando** ganha **anel + brilho no mapa nos DOIS modos**, no Original via `highlightedStopKey` (= a parada do painel, inclusive no estado inicial sem clique e acompanhando o stepper), separado do foco (não dispara o zoom); no Meu roteiro o `selectedStopId` já fazia.
- **Atualização 09/07/26: TASK-RF-006.4.12 (altura do painel):** o snap **colapsado** do `MapPanel` passou a ser a **altura medida do cabeçalho** (fit-content, `ResizeObserver`), mostra exatamente a seção ativa sem cortar botões nem deixar espaço vazio; a seleção no Meu roteiro não força mais "half" (o colapsado-fit já mostra o resumo). Fallback 224px sem observer (jsdom/tests).
- **Atualização 09/07/26: ajuste da .4.10 (TASK-RF-006.4.11):** **duplo-clique e "Ver lista completa" são EVENTOS DISTINTOS**, o **duplo-clique** desagrupa a parada **SÓ no mapa** (o painel fica no resumo); a **"Ver lista completa"** (botão) abre a lista no painel (que **esconde o mapa**), por isso não podem ser o mesmo evento. **Regrupar** = clicar fora do grupo no mapa (mantendo o foco na parada). E o **zoom do foco** (1º clique) passou a ser **o mesmo de quando desagrupa** (perto: `maxZoom` MAX; antes estava "muito distante"), valendo Original (fitBounds MAX) e Meu roteiro (`focusBounds` → aproxima da parada firmada focada/expandida).
- **Atualização 09/07/26: epic .4.6 (fatia FINAL .4.10, TASK-RF-006.4.10): MODELO DE INTERAÇÃO UNIFICADO (muda o RF-023):** agora vale para o **modo Original também** (o roteiro já veio nas .4.8/.4.9): **1 clique** numa parada → **foca/centraliza mas mantém AGRUPADA** (um quadrado com ênfase) + painel resumo, **não expande mais no 1º clique**; **2 cliques** no quadrado (ou **"Ver lista completa"**) → **expande** em endereços individuais numerados + painel lista; **clicar fora** (mapa vazio) → **reagrupa** mantendo o **foco** na parada (o painel nunca esvazia). Stepper ‹ › foca agrupado. Detalhes: `doubleClickZoom` off; janela de ~220ms para separar 1 de 2 cliques (os marcadores são recriados a cada mudança). **Isto ENCERRA o epic .4.6** (criar-comita → painel da parada → desagrupar no mapa → editar sem toggle → Original unificado). *Supersede o comportamento do RF-023 onde 1 clique expandia.*
- **Atualização 09/07/26: epic .4.6 (fatia .4.9, TASK-RF-006.4.9):** a **edição de parada** (Editar/REOPEN) passa a **desagrupar no mapa**, os membros viram círculos (ordinal + ring) + os candidatos do raio ficam pontilhados + o círculo do raio, **sem** o quadrado agrupado. E o **toque no mapa não adiciona/remove mais** endereços da parada (decisão Q2 do humano): a composição é só pelo **raio** e pelos **botões +/− da lista** do painel. O texto de ajuda do rascunho foi reescrito de acordo.
- **Atualização 09/07/26: epic .4.6 (fatia .4.8, TASK-RF-006.4.8):** a parada firmada do Meu roteiro passa a **desagrupar no mapa**, **1 clique** mantém agrupada (quadrado) e foca; **2 cliques** no quadrado (ou **"Ver lista completa"**) mostram os **endereços individuais numerados** pela ordem de visita; selecionar outra parada / clicar fora / editar / desfazer **reagrupa**. Infra de duplo-clique no mapa (`doubleClickZoom` desligado + janela de ~220ms p/ separar 1 de 2 cliques, já que os marcadores são recriados a cada mudança). Ainda **só no Meu roteiro**: o clique do **Original** segue como estava (1 clique expande) até a fatia final do epic; e a **edição** de parada ainda mostra o quadrado (desagrupar na edição + tocar-sem-toggle vêm na fatia seguinte).
- **Atualização 09/07/26: epic .4.6 (fatia .4.7, TASK-RF-006.4.7):** painel da **parada firmada** no Meu roteiro alinhado ao Original, **"Ver lista completa" no topo-direito** (mesma posição do Original) e **"Editar parada"/"Desfazer parada" centralizados no rodapé** da seção "Resumo da parada". "Ver lista completa" abre a **lista dos endereços da parada** no painel (por ordinal, rolável): **só no painel** por ora; o desagrupar no MAPA (duplo-clique / esta lista) vem na fatia .4.8. A seção "Endereço selecionado" passa a ser **"Endereço selecionado: parada do veículo (âncora)"**: mostra o **ícone do veículo** (não o "1º") + o **endereço sem complemento**. Como a âncora é um ponto na rua (não um endereço da planilha), o endereço é um **placeholder** (= o 1º endereço da parada) até o **geocoding mínimo** (reverse-geocoding client-side sem API paga, ou nome da via pelo grafo OSM: **TASK-RF-006.9**, em pendentes).
- **Atualização 08/07/26: epic .4.6 (fatia 1, TASK-RF-006.4.6):** "Criar parada" passa a **comitar na hora** (parada firmada + agrupada no mapa + painel de resumo focado), **sem** abrir a "Edição de parada". Os endereços que o **raio** mostrava entram como **membros automaticamente**: isto **reverte** a decisão §8/26/06 ("candidatos entram por escolha"): agora o raio define a parada, e o refino (tirar/adicionar/ajustar raio) é feito depois via **"Editar parada"** (REOPEN). O **raio é calibrado ANTES de criar**, num stepper na própria seção "Parada sugerida" (`RadiusStepper`). *Ainda no epic (fatias .4.7/.4.8, não feitas aqui):* 1 clique = foca+agrupa e 2 cliques (ou "Ver lista completa") = desagrupa em individuais numerados, **nos dois modos** (muda o contrato do RF-023, onde hoje 1 clique já expande); e a edição da parada deixa de usar o toque no mapa para adicionar/remover (raio + lista ±; toque = focar).
- **Atualização 08/07/26, 3ª rodada (TASK-RF-006.4.3): anatomia de 3 seções do painel do roteiro:** o invólucro de seção (divisor + padding do rótulo) virou componente único (`PanelSection`) consumido pelos DOIS modos, a separação visual não pode mais divergir. Anatomia: **1ª seção** = cabeçalho de estado (mantido simples por ora); **2ª seção** = resumo do endereço/parada selecionada, parada firmada mostra **exatamente o Original** (chips de pacotes **POR TIPO**) + acréscimos (chip "~min · m a pé", botões Editar/Desfazer); **"Editar parada" (e a edição em geral) = estrutura do "Ver lista completa"** do Original (cards expansíveis com detalhe de pacotes; membros com ordinal no mini-marcador; botões **±** por linha) + **card do Raio de agrupamento** (stepper + "O raio engloba N candidatos"); **3ª seção, "Parada sugerida"** (endereço livre selecionado): resumo de como a parada ficaria se criada (título/chips como parada normal, sobre o endereço-semente, criação semeia só ele, §8) + linha de candidatos no raio + **distância DE VEÍCULO da última parada (ou do início) até a âncora sugerida** (grafo de veículo respeitando mão única; "(linha reta)" como fallback) + CTAs **"Criar parada"** e **"Incorporar em outra parada"** (o select de destino só aparece ao clicar; o select fixo saiu). **Ajuste .4.4 (mesmo dia, pós-smoke):** o resumo da "Parada sugerida" passa a **agregar semente + candidatos do raio** (o que o círculo mostra, "4 no mapa = 4 no resumo"; ordem = varredura ao redor da âncora sugerida), **criar continua semeando só o selecionado** (§8, decisão 26/06); e a linha de texto "Sugestão: …" **saiu do contexto de endereço selecionado** (redundante com a seção; permanece no fluxo do início e a tracejada no mapa). **Ajuste .4.5 (4ª rodada, mesmo dia):** a linha do rótulo "Parada sugerida" passou a carregar a **distância de veículo** ("Distância até aqui: 1,2 km" + **ícone de carro** como qualificador; sr-only "de veículo" preserva a regra da distância qualificada; "(linha reta)" segue como fallback honesto) e o **CTA "Criar parada" à direita** (slot actions do PanelSection, padrão do Editar/Desfazer); as linhas "O raio engloba N candidatos" e "Do início até aqui: …" **saíram da seção** (a contagem do raio segue visível no card do raio durante a edição); "Incorporar em outra parada" permanece abaixo do resumo.
- **Atualização 08/07/26, 2ª rodada (TASK-RF-006.4.2):** (1) **ponto inicial = LOSANGO** slate (nova forma; supersede o "marcador verde próprio" do §3 e o "mesmo ícone da âncora" da rodada anterior); (2) **veículo/âncora = ícone de CARRO** (Tabler `car` embutido, MIT, em vez do `motorbike` sugerido; Modo de Transporte configurável fica p/ RF-007) **SEM a ponta fina** (supersede o "mantém a ponta fina" do §3, o carro ancora no CENTRO, fica na rua e nunca cobre um endereço, z abaixo dos endereços); (3) **parada firmada é selecionável**: tap abre o painel na estrutura do Original (resumo com bairros/CEPs + chips incl. estimativa a pé) com **Editar parada** (reabre a edição) e **Desfazer parada** (§9): antecipação parcial da .6; (4) **o círculo do raio aparece como PREVIEW** já ao selecionar um endereço livre (antes do "Criar parada"); candidato = **anel tracejado**; (5) **sem número de Sequence no modo**: endereço livre = marcador vazio; membros de parada ganham **ordinal "1º/2º"** (ordem a pé) no mapa e no painel; o quadrado da parada mantém 1, 2, 3…; (6) linha de sugestão e círculo do raio no **ciano neon** do modo.
- **Atualização 08/07/26 (feedback do smoke da TASK-RF-006.4: TASK-RF-006.4.1):** (1) **pontos livres NÃO ficam cinza**, mantêm a **cor por tipo** em **paleta neon clara própria do modo** (a cor diz o modo; supersede "pontos cinza desbotados" do §4 p.0); (2) **início = mesmo ícone da âncora (veículo)**, um marcador slate único; (3) o painel do roteiro fala a **mesma língua visual do Original** ("Resumo da parada"/"Endereço selecionado", card `StopItemRow`/`StopItemDetail`; "Etiqueta do Pacote" saiu); (4) rótulo do modo = **"Roteiro incompleto, rascunho"** enquanto incompleto, com linha de estado dizendo **o que fazer**; (5) **distância sempre qualificada** ("a pé"/"de veículo"); (6) rascunho = **"Edição de parada"**, com aviso de que o toque no mapa adiciona/remove, CTAs sempre visíveis e estimativa "~min · m a pé" da parada.
- **Status:** rascunho de trabalho; §9 (decisões) fechado.
