# Insights de Concorrentes: log de prints

> Registro **vivo** de ideias de UX/feature vistas em apps concorrentes (Rotz, Maposcope, Circuit-like, etc.), cada uma com veredito de **valor × custo × encaixe** no nosso modelo (sem backend, offline-first, client-side, OSM/Leaflet). Atualizado a cada lote de prints. **Não é backlog**: é matéria-prima pra decidir o que entra.

**Legenda do veredito:**
- ✅ **Incorporar**: barato e alto valor, encaixa no modelo.
- 🤔 **Avaliar**: valor real, mas tem trade-off (custo, escopo ou monetização).
- ⚠️ **Cuidado/adiar**: bom, mas é vetor de custo ou foge da arquitetura.

---

## Lote 1: apps de roteirização genéricos (Maposcope e similares) · 26/06/26

| Feature observada | Onde | Valor p/ nós | Custo / eficiência | Veredito |
|---|---|---|---|---|
| Config **início / fim / retorno** + "definir como padrão" | Maposcope (tela "Defina quando e onde começar/terminar") | Alto: encaixa no nosso ponto inicial; round-trip (ida e volta) é real pro entregador | Baixo: só config; o motor já parte de um início | ✅ |
| **Arrastar para reordenar** paradas (handles `=`) | Maposcope ("Paragens 19") | Alto: é o coração do "manual" que nos diferencia | Médio: drag UI (HTML5 DnD ou lib leve, sem dep pesada) | ✅ |
| **Gerar PDF** da rota | Maposcope (menu lateral) | Médio: imprimir / passar pro ajudante; funciona offline | Baixo: client-side (jsPDF), sem servidor | ✅ |
| **Entrada por voz** ao adicionar parada | Maposcope, Rotz (ícone mic) | Médio: mão ocupada, sol, pressa | Baixo: Web Speech API nativa, grátis | ✅ |
| Mostrar **campos crus** (AT ID, SPX/BR TN, coords, CEP) | app que parseia o romaneio (texto verde) | Médio: transparência e conferência rápida | Baixo: já guardamos `rawData` | ✅ (no popup/tabela) |
| **Importar colando texto** ("Nome, Endereço, Cidade") | Maposcope (aba Copiar/Colar) | Médio: flexível p/ endereço avulso fora do Shopee | **Geocoding é o custo** (Nominatim é limitado/TOS); mas o Shopee já traz coords prontas | 🤔 (só p/ avulso manual) |
| **Auto-otimizar** ("Otimizar a rota") | todos | Esperado como ponto de partida editável | Baixo se nearest-neighbor; TSP real é caro **e desnecessário** | 🤔 (já é a RF-012, como rascunho) |
| **Grupos** de paradas | Maposcope ("Grupos") | Alto: é literalmente a nossa "parada a pé" | Médio: já está no nosso modelo de domínio | ✅ (é o nosso core) |
| **Freemium por nº de paradas** (grátis ≤10, paga p/ mais) | Maposcope ("Compra da versão Professional"; upsell "+ de 10 paradas") | **Estratégico**: modelo provado da categoria; responde "como cobrar contra o Rotz grátis" | Gate é client-side → mesma tensão da **DT-002** (burlável sem backend) | 🤔 (decidir na monetização) |
| **OCR / importar de print/galeria** | Rotz, Maposcope (ícone scan) | Médio: alguns recebem a rota por print | **Vetor de custo:** OCR on-device (ML Kit, grátis-ish) vs nuvem (paga). Complexo | ⚠️ (adiar / avaliar on-device) |
| Base **Google Maps** | um dos apps (pins azuis) | n/a | Paga por *map load* (SDK Google) | ⚠️ Evitar: somos OSM/Leaflet |
| **GPS em segundo plano** / tracking ao vivo | Rotz | Conveniência na execução | Bateria + complexidade + privacidade; nossa decisão já evita | ⚠️ Evitar por ora |

### Leitura do lote 1

- **Ganhos baratos e óbvios** (entram quase sem custo, alto valor): início/fim/retorno, arrastar pra reordenar, gerar PDF, voz, mostrar campos crus no popup. Nada disso precisa de backend nem dependência cara.
- **O nosso diferencial sobrevive intacto:** nenhum desses apps faz a **parada a pé com âncora no veículo**. Todos fazem auto-otimização genérica de paradas. Os "Grupos" do Maposcope são o mais perto, mas não é o circuito a pé.
- **Insight de monetização (o mais importante):** Maposcope cobra por **freemium por nº de paradas** (grátis até ~10, paga pra mais). Isso é a resposta concreta pra "como cobrar se o Rotz é grátis": dá um tier grátis genuinamente útil e cobra o **uso profissional/volume**. Atenção: sem backend, o gate é burlável (DT-002).

### Vetores de custo a manter longe (regra de bolso)

1. **Geocoding em massa** (Nominatim público é limitado/TOS): mitiga-se usando as coords que o Shopee já entrega; geocoding só p/ endereço avulso.
2. **OCR** de print: só se for on-device e barato.
3. **Base de mapa paga** (Google): não; OSM/Leaflet.
4. **GPS em segundo plano**: bateria + complexidade; fora por ora.

---

## Lote 2: "Tour Entregas" + um app Google-Maps-based · 26/06/26

> ⚠️ **Contexto de custo:** a maioria desses é **Google-Maps-based** (watermark "Google", thumbnails de mapa dos EUA). Várias features deles só são "grátis" porque pagam o **SDK do Google**. No nosso modelo **OSM/Leaflet**, parte delas fica cara ou inviável: marcado abaixo.

| Feature observada | Onde | Valor p/ nós | Custo / eficiência | Veredito |
|---|---|---|---|---|
| **Onboarding** "Etapa 1 de 2" + **Pular** | Tour Entregas | Médio: primeira rota guiada | Baixo | 🤔 (manter mínimo) |
| **Start: endereço atual / GPS atual / outro** + "sempre usar GPS atual" | Tour Entregas ("Editar rota") | Alto: conveniência diária | Baixo: Geolocation API nativa | ✅ |
| **Hora de partida** (agora / escolher) | Tour Entregas | Baixo-médio: ETA, priorização comercial | Baixo | 🤔 |
| **Rota reversa** (inverter a ordem) | Tour Entregas | Médio: ganho barato | Baixo | ✅ |
| **Escolher endereço NO MAPA** (drop pin) | app Google-based (aba "Mapa") | **Alto**: corrige coordenada errada do romaneio na unha | Baixo: clique no Leaflet → coord | ✅ |
| Escolher endereço dos **Contatos** | aba "Contatos" | Baixo-médio: nicho | Baixo: API de contatos on-device | 🤔 |
| Escolher endereço por **Lugares/POI** | aba "Lugares" | Médio | Places/geocoding = **custo** | ⚠️ |
| **Tipos de veículo** (carro/van/caminhão/bike/pedestre) | app Google-based | Carro + **pedestre** = nosso core (âncora a pé); resto não | Restrição de caminhão/van = dados ricos = caro | 🤔 (só carro + pé) |
| **Evitar** pedágios / balsas / rodovias | app Google-based | Baixo p/ entrega urbana a pé | Motor teria de excluir arestas | ⚠️ (baixa prioridade) |
| **Modo de otimização** (tempo × distância) | app Google-based | Médio | Distância = **grátis** (já temos); tempo = precisa velocidade por via | 🤔 (distância já; tempo depois) |
| **Tipo de mapa** (claro / satélite / tráfego) | app Google-based | Médio | Claro/escuro **já temos**; satélite/tráfego = provider pago | ✅ claro/escuro · ⚠️ satélite/tráfego |
| **Estatísticas** do usuário (km, entregas, tempo) | Tour Entregas | Médio: engajamento | Baixo: calcula do histórico local | 🤔 |
| **"Receba bônus diário"** (recompensa/ad diário) | Tour Entregas | **Estratégico**: monetização | n/a | 🤔 (confirma o ad recompensado da nossa análise) |
| **"Laço"** (botão de config cortado "Lac…") | app Google-based | Investigar: pode ser laço/seleção de paradas | n/a | 🔎 investigar no próximo print |

### Leitura do lote 2

- **Ganhos baratos novos:** escolher/ajustar endereço **clicando no mapa** (corrige geocoding ruim, ótimo no nosso Leaflet), **rota reversa**, e start "usar GPS atual" como padrão. Tudo client-side.
- **A tensão de arquitetura ficou nítida:** muita coisa deles (satélite, tráfego, Places, turn-by-turn, perfis de caminhão) é **barata só porque pagam o Google**. Nosso OSM/Leaflet evita essa fatura, mas paga em **feature**: então essas a gente **não persegue** (não são o nosso jogo). O nosso jogo é a parada a pé, offline e barata.
- **Monetização (2ª confirmação):** o "Receba bônus diário" do Tour Entregas é o **ad recompensado / recompensa diária**, exatamente o que a nossa `analise-comercial-2.0.md` já previa. Dois concorrentes, dois modelos: Maposcope cobra por **volume de paradas**; Tour Entregas usa **recompensa/ad**. Bom cardápio pra escolher.
- **Investigar:** o botão **"Laço"** pode ser o desenho-de-círculo-em-volta-das-paradas (o que o Rotz tentou e quebrou). Se for, é o concorrente direto do nosso agrupamento manual: vale um print focado.

---

## Lote 3: planejadores Google-based (Circuit-like / Optimize / similares) · 26/06/26

> A maioria repete padrões dos lotes 1 a 2 (Google-based). Abaixo só o que é **novo e relevante**.

| Feature observada | Onde | Valor p/ nós | Custo / eficiência | Veredito |
|---|---|---|---|---|
| **Wizard de mapeamento de colunas** do Excel (auto-detecta e deixa **tocar p/ corrigir**: Endereço / Número / Bairro / City) | "Ajude-nos mapeando seu endereço" | **Alto**: robustez quando o auto-detect erra (formato muda, outros países) | Médio: UI sobre o parse que já temos | ✅ / 🤔 |
| Import Excel: **modelo pronto / extrair tudo / intervalo de colunas (C2-C22)** | "OPÇÃO 1/2/3" | Médio: fallback p/ planilha fora do padrão | Baixo | 🤔 (fallback) |
| **Multi-import**: Excel · IMG/PDF · Câmera · .GPX | "De que tipo de arquivo…" | Excel já temos | OCR = custo; GPX irrelevante p/ Shopee | ✅ Excel · ⚠️ OCR · ⛔ GPX |
| **ETA + distância acumulada por parada** + ID na lista (ex.: "1.5 km / 14:04 · ID 4") | rota otimizada | **Alto**: execução: o entregador vê **quando** chega | Distância já temos; ETA precisa velocidade + hora de partida | ✅ (alimenta RF-007/009) |
| **Agendar pausa** ("Sem pausa / toque para agendar") | config de rota | Baixo-médio: ETA mais realista no dia | Baixo | 🤔 |
| **ID de parada: "Clássico" × "Por ordem de rota"** (alternar) | Configurações | Médio: é o nosso debate **número-da-parada × sequência** | Baixo | 🤔 (confirma o valor de poder alternar) |
| **Lado da parada** (curbside / lado do veículo) | Configurações | Baixo p/ entrega a pé | Otimização avançada (estilo Circuit) = caro | ⚠️ |
| **Balão de info na navegação** ("veja a entrega enquanto navega") | Configurações | Médio | Exige integração profunda com o app de navegação | ⚠️ |
| **Preço: R$ 19,99/mês** (plano anual) | banner laranja | **Estratégico**: referência de mercado | n/a | 💰 intel |

### Leitura do lote 3

- **Ganho mais útil:** o **wizard de mapeamento de colunas**, auto-detecta e deixa o usuário corrigir tocando. É a robustez que protege contra variação de planilha (e seria ouro se um dia for pra outro país SPX). Barato-médio, sobre o parse que já existe.
- **Execução:** mostrar **ETA + distância por parada** na lista é um ✅ claro (casa com RF-007/009). A distância já temos; o ETA só precisa de velocidade + hora de partida.
- **Pricing (3ª referência):** este cobra **R$ 19,99/mês**. Seu **R$5 está muito abaixo** do mercado. Agora temos três modelos reais: Maposcope (**por volume de paradas**), Tour Entregas (**ad/recompensa**), este (**assinatura ~R$20/mês**). Teu R$5 pode ser **vantagem** (undercut agressivo) **ou sinal de que dá pra cobrar mais**: decidir na monetização.
- **Saturação:** o lote 3 repetiu muito padrão Google-based. Provável bom momento para **sintetizar**.

---

## Lote 4: final (wizard de import a fundo + execução) · 26/06/26

> "Últimos, alguns repetidos." Abaixo só o novo relevante.

| Feature observada | Onde | Valor p/ nós | Custo / eficiência | Veredito |
|---|---|---|---|---|
| Import por **colunas Latitude/Longitude diretas** (sem geocoding) | wizard de mapeamento | **Alto**: é o que o Shopee já entrega; **zero** custo de geocoding | Baixo | ✅ |
| Colunas extras viram **"notas de viagem"** (usuário escolhe quais: AT ID, Sequence, Stop, Zipcode) | "Informação adicional" | Médio-alto: leva os campos crus sem poluir o mapa | Baixo: já temos `rawData` | ✅ / 🤔 |
| Import por **URL** (link de planilha privada) | "Importar por URL" | Baixo: nicho | Baixo (fetch + parse; sheet acessível) | 🤔 |
| **"Não otimize, navegue como adicionado"** (respeitar ordem manual) | "Nova Rota" | **Estratégico**: valida o nosso diferencial (ordem manual) | n/a | ✅ (confirma) |
| **Poupança em R$** (além de km/min) | História | Médio: gancho de marketing | Baixo | 🤔 |
| **Dividir rota** (split) | menu da rota | Baixo: nicho (2 turnos / ajudante) | Baixo-médio | 🤔 |
| **Balão de marcação sobre o app de navegação** (Sucesso/Falha durante o Google Nav) | execução | Alto na execução | **Overlay do Android** (permissão) = complexo | ⚠️ |
| Roteamento via **GraphHopper API** | rodapé "distribuído por" | n/a | Eles pagam **API hospedada**; nós não (A\* local) | 🧱 nota |

### Leitura do lote 4

- O wizard de import a fundo confirma o **ganho nº1**: mapeamento de colunas (auto + corrigir tocando) **e** import **por lat/lng direto**, perfeito pro Shopee, sem geocoding.
- **"Não otimize, navegue como adicionado"** é a prova de que **respeitar a ordem manual é demanda real**: exatamente o nosso core.
- **GraphHopper API** no rodapé: mais um confirmando que esses apps pagam **roteamento hospedado**. O nosso A\* local é a vantagem estrutural.

---

## 🎯 Síntese final: o que incorporar (priorizado) · 26/06/26

> Consolidação dos 4 lotes. Pronto para virar tarefas em `pendentes.md`.

### ✅ Quick wins (barato + alto valor): candidatos diretos a tarefa
1. **Ajustar/escolher endereço clicando no mapa** (drop pin): corrige geocoding ruim. Encaixa no Leaflet.
2. **Arrastar para reordenar** paradas: reforça o "manual".
3. **Config início / fim / retorno** + "usar GPS atual" como padrão.
4. **Rota reversa** (inverter a ordem).
5. **Gerar PDF** da rota (client-side, offline).
6. **Entrada por voz** para adicionar endereço manual.
7. **ETA + distância por parada** na lista (execução): alimenta RF-007/009.
8. **Wizard de mapeamento de colunas** do Excel (auto-detecta + corrigir tocando; **import por lat/lng direto**; colunas extras como "notas").
9. **Campos crus** (AT, SPX TN, coords) no popup/notas.

### 🤔 Avaliar (médio / depende de decisão sua)
- Auto-otimizar como rascunho (já é a RF-012).
- Estatísticas do usuário (km / entregas / tempo / R$ poupado).
- Agendar pausa; hora de partida.
- Alternar "ID clássico × ordem de rota".
- Import por URL; dividir rota.
- Otimizar por **tempo** (precisa de velocidade por via).

### ⚠️ Fora (custo ou foge da arquitetura)
OCR de print/câmera · base satélite/tráfego · busca de Places/POI · perfis de caminhão/van · "lado da parada" (curbside) · balão sobre o app de navegação (overlay Android) · GPS em segundo plano · base Google Maps.

### 💰 Monetização: 3 modelos reais observados
- **Por volume de paradas** (Maposcope: grátis ≤10, paga p/ mais).
- **Ad / recompensa** (Tour Entregas: "bônus diário").
- **Assinatura ~R$ 19,99/mês** (Circuit-like).
- Teu **R$5 está muito abaixo do mercado** → ou undercut agressivo, ou margem pra cobrar mais. ⚠️ Sem backend, qualquer gate é burlável (DT-002).

### 🧱 Arquitetura: a tua vantagem estrutural (não perder de vista)
- Quase todos dependem de **API de roteamento hospedada** (GraphHopper, OSRM) e/ou **Google Maps SDK** → custo por uso. Teu **A\* local sobre OSM + Leaflet** evita essa fatura: é o que sustenta "barato a qualquer escala". Pagas em **feature** (sem turn-by-turn nativo, sem tráfego/satélite fácil): troca consciente.
- O diferencial **parada a pé com âncora no veículo** segue **sem concorrente direto**: nenhum dos apps faz. É onde investir.

