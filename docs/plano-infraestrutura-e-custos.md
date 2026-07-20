# Plano de Infraestrutura e Custos

> **Data:** 20/07/26 · **Câmbio usado:** US$ 1 = R$ 5,1017 · € 1 = R$ 5,8221 (xe.com, 20/07/26 22:36 UTC)
>
> Documento **quantitativo e consolidador**: reúne num lugar só os números **e os porquês** que estavam espalhados por ADRs, dívidas técnicas e rascunhos comerciais, e refaz as contas com as variáveis novas de julho/26.
>
> **O que este documento NÃO é:** não é ADR e **não decide** nada novo. Ele **registra** o que já foi decidido, com a justificativa, e aponta onde a conta indica revisão — decisão nova vira ADR própria.

---

## 1. A pergunta que este documento responde

**O R$5/mês ainda fecha, e a partir de que escala?**

Ela precisou ser refeita porque quatro coisas mudaram:

| # | Variável nova | De onde veio |
|---|---|---|
| 1 | **A malha viária foi medida** — deixou de ser estimativa | TASK-CHORE-006, 20/07/26 |
| 2 | **Geocoding da âncora** (RF-006.9) e **anti-pirataria** (DT-002) empurram para servidor | Decisão do humano, 20/07/26: *"offline não é mais objetivo prioritário por causa disso"* |
| 3 | **"Sem backend" já era parcialmente falso** — o app depende de um Worker próprio desde os tiles | RNF-12 vs. RNF-02 |
| 4 | **Preços externos mudaram em junho/26** — Hetzner subiu, Oracle cortou o free tier pela metade | Pesquisa 20/07/26 (§7) |

### Resposta curta

**Sim, fecha — e sem VPS.** As duas necessidades novas de servidor cabem no trilho serverless que já existe:

- **Geocoding da âncora** → API hospedada com cache permanente permitido. O volume é pequeno porque o núcleo Shopee já traz lat/lng e o toque no mapa não geocodifica nada (§5.1).
- **Validação de assinatura** → cabe num **Worker + KV/D1**, não num VPS. É I/O (chamar a API do Google Play), e Workers cobra CPU, não espera.

---

## 2. Decisões escolhidas — o padrão inicial

> Registrado aqui a pedido do humano (20/07/26), para não precisar reconstruir de memória.

### 2.1 Produto: **Opção B — app do entregador (B2C)** ✅

Roteirizador vendido **direto ao entregador parceiro MEI**, assinatura baixa (~R$5/mês), sem login, dados no aparelho.

**Por que a B, e não a A** (plataforma B2B vendida à Shopee):

- **Não depende de permissão de ninguém.** A Shopee já deixa o motorista exportar a própria rota; o dado entra por import e é dado dele. A Opção A **depende** da Shopee dizer "sim" — integração, parceria, procurement.
- **Casa com a arquitetura que já existe.** 100% client-side, roteamento local ⇒ sem API paga. A Opção A exige backend, auth e realtime, com custo marginal real por motorista ativo.
- **Valida a hipótese mais barata primeiro.** Se ninguém paga R$5, a A — muito mais cara — provavelmente também não se sustenta.
- **Preço como cunha:** concorrentes cobram uma ordem de grandeza a mais (Circuit/Spoke US$10–20, RoadWarrior US$49/mês), e os free tiers param em 8–10 paradas.
- **Distribuição de graça:** os grupos de WhatsApp de motoristas já existem e o autor está dentro deles.

**Escopo desacoplado em 22/06/26:** este repositório é **só** a Opção B. O hub (Opção A) virou projeto futuro separado.

**Riscos assumidos:** margem fina (só fecha em volume), churn de gig worker, pirataria sem login, dependência do export da Shopee.

### 2.2 Infraestrutura: **Cenário A — serverless** ✅

Cloudflare (Pages + Workers + R2) + APIs hospedadas. **Sem VPS.** O Cenário B (VPS com Nominatim/Photon) fica registrado em §10 apenas como contraste, e só volta à mesa se o fork "romaneio sem coordenadas" (DT-006) virar produto.

**Por quê:** nas escalas que importam agora, o serverless ganha (§9 e §10). O VPS troca custo variável baixo por **custo fixo + tempo de operação** — e o tempo de operação nunca aparece na fatura, mas existe.

---

## 3. Recursos que serão utilizados

Lista fechada do que o produto consome, para consulta rápida.

| Recurso | Para quê | Custo | Situação |
|---|---|---|---|
| **Cloudflare Pages** | Host do PWA (+ `_redirects` do SPA, `assetlinks.json` do TWA) | **R$ 0** — bandwidth ilimitado | ✅ em uso (deploy de testes) |
| **Cloudflare Worker** | Proxy de tiles (cache, anti-leech) → depois também **validação de assinatura** | R$ 0 até 100 k req/dia; US$ 5/mês acima | ✅ em uso |
| **Cloudflare R2** | Guardar os `.pmtiles`: **basemap** + **malha viária** | Centavos/mês (§7.1) | 🔭 ADR-007/010 |
| **PMTiles** | Formato do tileset (arquivo único, range requests) | — | 🔭 |
| **Protomaps** | Basemap vetorial (extrai região do planeta) | — | 🔭 ADR-007 (provedor ainda aberto — §4.6) |
| **MapLibre GL** | Renderizar vetor + aplicar a identidade visual. **Substitui o Leaflet** | Open source | 🔭 fase de visual |
| **Leaflet** | Mapa atual (raster) | Open source | ✅ em uso |
| **OpenStreetMap / Geofabrik** | Dado bruto de vias (`brazil-latest.osm.pbf`, 1,9 GB) | Grátis | ✅ |
| **Overpass API** | Malha viária **hoje** | Grátis, mas **DT-005** (sem SLA, fila) | ⚠️ a substituir (ADR-010) |
| **osmium** | Pipeline de build do tileset (roda **na sua máquina**, trimestral) | Grátis | 🔭 |
| **IndexedDB (`idb`)** | Romaneios, grafo (TTL 7 d), roteiros | R$ 0 | ✅ em uso |
| **OpenCage** | Geocoding da âncora (RF-006.9) | R$ 120/mês quando ligar — **em BRL** | 🔭 (§7.3) |
| **Google Play Billing** | Assinatura | **15%** da receita | 🔭 RNF-17 |
| **Play Console** | Publicar | US$ 25, **uma vez** | 🔭 DT-001 |
| **Bubblewrap / PWABuilder** | Empacotar o PWA como **TWA** | Grátis | 🔭 DT-001 |
| **AdMob (rewarded)** | Receita de anúncio no plano grátis | Receita, não custo | 🔭 |

> **Não usamos, por decisão:** API de roteirização paga (Google/Mapbox Directions), OSRM/Valhalla, Supabase/Firebase, servidor de aplicação, banco remoto, autenticação. Os porquês estão em §4.

---

## 4. Por que cada decisão — os porquês reunidos

> Consolidação das ADRs 001–010 e das DTs. **A ADR continua sendo a fonte da verdade**; aqui fica só a justificativa central, para leitura corrida.

### 4.1 Roteirização local, sem API paga (ADR-002)

Grafo dirigido sobre OSM + A* **no cliente**. Mão única = aresta ausente.

**Por quê:** o diferencial é traçar a rua real com quilometragem **durante o planejamento** — deep link para Maps/Waze não faz isso. E a restrição de produto é **baratear**.

**Descartados:** API paga (custo por requisição, cota, lock-in na função-núcleo) · só deep link (não entrega o diferencial) · **OSRM/Valhalla self-hosted** (reintroduz backend, mata o offline, exige VPS com RAM alta — e o que falta é o **dado**, não o motor).

### 4.2 Malha viária: tileset próprio em PMTiles no R2 (ADR-010)

**Por quê:** hoje a malha vem do **Overpass público** (DT-005) — sem SLA, rate-limited, com fila. A medição de 20/07 (1,68 km² · 149 KB · 1,2 s) descartou payload e parse como causa da lentidão; sobrou a fila do servidor.

**O achado decisivo:** `buildGraph` monta a topologia por **ID de nó OSM**. MVT/PMTiles **não carrega node ID** e ainda recorta feições na borda do tile. Por isso **não dá para roteirizar sobre o basemap** — daí *dois tilesets, um formato, um bucket, um Worker*.

**Descartados:** mirror comunitário (adia o problema) · self-host do Overpass (servidor pesado para algo que pode ser estático) · extrato embutido no PWA (só serve app regional; o usuário baixaria o país para entregar em 3 quarteirões).

### 4.3 **Por que vector tiles** (ADR-007) — o ponto que faltava aqui

Três problemas forçaram a decisão:

1. **Licença.** O Worker hoje faz proxy dos tiles **públicos** do OSM, cuja *Tile Usage Policy* **não permite** uso comercial/pesado. A ADR é explícita: *"pôr cache na frente reduz a carga, mas **não torna o uso compatível**"*.
2. **Leeching.** O Worker responde `ACAO: *` e não valida quem chama — qualquer app pode consumir a cota.
3. **Zoom.** O bloqueio de `z < 14` impede a visão geral da rota; a decisão é liberar até ~z10–11 e deixar o cache absorver.

**E por que vetor, e não raster melhor:**

- **É mais barato, não mais caro:** ~**4 requisições por visualização** contra **10–16 do raster**, com payloads menores.
- **Identidade visual.** A marca já está definida (ADR-006, Neon Flux). Vetor dá **controle total de estilo** via style JSON do MapLibre; raster público entrega visual genérico — o oposto de "parecer profissional".
- **O custo do vetor é esforço, não dinheiro:** trocar Leaflet→MapLibre e repensar o cache do Worker para `.pbf`/sprites. Como o mapa do roteirizar ainda está sendo construído, **esse custo é baixo agora e cresce depois**.
- **PMTiles em R2 remove a fatura por request:** paga-se storage (egress zero no R2), não chamada. Combina com o padrão de uso "as mesmas áreas sempre".

**Provedores comparados:** MapTiler (~100 k tiles/mês grátis, editor de estilo — bom para começar) · Stadia (free tier, MapLibre-friendly) · **Mapbox evitado** (GL JS v2+ proprietário e cobra **por *map load***) · OpenMapTiles+TileServer GL em VPS (~R$250–500/mês, "mais ops, provavelmente dispensável") · **Protomaps/PMTiles em R2** como destino.

> ⚠️ **Precisão importante:** a ADR-007, **como está escrita**, decide o *princípio* (Worker como camada trocável + upstream com TOS comercial + anti-leech) e deixa **raster × vetor e o provedor explicitamente em aberto** para a "fase de visual" — apontando Protomaps/PMTiles como *destino preferido*, não como decisão fechada. Quem trata PMTiles como decidido é a **ADR-010**. Essa divergência entra na lista de correções (§13, item 8).

### 4.4 Sem backend, sem banco, sem login (RNF-02, ADR-002)

**Por quê:** custo marginal por usuário ≈ zero, nada de auth/realtime para manter, e os dados são do aparelho.

**Onde isso trinca:** **DT-002** — validar assinatura com segurança pede verificação server-side (recibo/RTDN); sem ela, um app modificado burla o premium. Posição atual: no MVP o *entitlement* client-side é **bom o suficiente** (furar R$5/mês não compensa o esforço), com o gate atrás de uma abstração (`isPremium()`) para que o backend entre depois como **drop-in**, não como refatoração.

### 4.5 As demais decisões, em uma linha cada

| ADR | Decisão | Por quê |
|---|---|---|
| **001** | Código em inglês, UI em português via `UI_LABELS` | A convenção declarada divergia do código real; oficializar custa zero e abre i18n. Traduzir tudo seria retrabalho puro |
| **003** | React Router + shells (abas / foco), BrowserRouter | TWA exige que o **botão voltar do Android** funcione e que telas tenham URL (deep link). Troca de view por estado torna histórico frágil |
| **004** | shadcn/ui (Radix + Tailwind + cva) | Componente é React+Tailwind **legível no próprio repo**, sem mágica de npm; a11y via Radix. MUI/Chakra brigam com Tailwind; Ionic traz roteamento próprio |
| **005** | Remover "área de risco" (Correios) | Dado é RJ-específico e **não escala** nacionalmente; e "Correios não entregam" ≠ "área de risco" — proxy semanticamente frágil |
| **006** | Tema Neon Flux, dark padrão + claro | Uso é de rua: o claro é **obrigatório** porque o escuro "lava" sob sol forte |
| **008** | Marcadores SVG, um por parada | Espelha o app oficial da Shopee (familiaridade) e limpa o mapa — antes era um pino PNG por linha da planilha |
| **009** | Modelos separados por modo, render compartilhado | Modelo único forçaria o `StopGroup` a representar paradas que não vêm da planilha, desestabilizando o Original |

### 4.6 Dívidas técnicas em aberto

| DT | O que é | Gatilho |
|---|---|---|
| **DT-001** | Empacotar como TWA para a Play Store | 1º release na loja |
| **DT-002** | Billing seguro × "sem backend" | Ao implementar premium |
| **DT-003** | CEP→bairro só cobre RJ/Ilha | Lançamento nacional |
| **DT-004** | Tiles públicos do OSM violam a TOS | **Antes do 1º release** |
| **DT-005** | Overpass público sem SLA | **Antes do 1º release** (ADR-010 resolve) |
| **DT-006** | Geocoding do fork "sem coordenadas" | Só se esse fork virar produto |
| **DT-007** | Romaneio multi reprocessado a cada tela | TASK-REF-018, já planejada |

---

## 5. O que muda a conta, e o que não muda

### 5.1 Erro de leitura que este documento corrige

A DT-006 estima **~US$1,80/motorista/mês** de geocoding (≈ R$10, "estoura o R$5"). Esse número pressupõe **120 endereços/dia geocodificados** — ou seja, o **fork no-coords**, onde o romaneio chega só com endereço.

**Não é o caso da âncora:**

| Situação | Geocoding |
|---|---|
| Romaneio Shopee (núcleo) | **Zero** — lat/lng vêm na planilha |
| Âncora por toque no mapa | **Zero** — lê a coordenada do clique |
| Âncora por **endereço digitado** | 1 chamada |
| Início por GPS | **Zero** |

O custo real da âncora é **duas ordens de grandeza menor**. Misturar os dois é o que fazia a conta "estourar".

### 5.2 O que continua verdadeiro

- **Roteirização = zero de compute.** O A* roda no cliente. Não muda com nada disto.
- **O custo cresce com o nº de áreas, não de usuários.** Mil entregadores no mesmo bairro consomem quase o mesmo que um.
- **O cache é o que segura tudo:** grafo 7 dias (IndexedDB), tiles 7 dias (Cache API + edge).

---

## 6. Arquitetura de custo

| Camada | Onde roda | Modelo de custo | Situação |
|---|---|---|---|
| App (PWA) | Cloudflare Pages | **Zero** — bandwidth ilimitado | ✅ hoje |
| Tiles do mapa | Worker → R2 (PMTiles) | Por **área** publicada + leituras | 🔭 ADR-007 |
| Malha viária | Worker → R2 (PMTiles) | Por **área** publicada + leituras | 🔭 ADR-010 |
| Roteirização (A*) | **Cliente** | **Zero** | ✅ hoje |
| Geocoding da âncora | API hospedada + cache próprio | Por **chamada não-cacheada** | 🔭 RF-006.9 |
| Validação de assinatura | Worker + KV/D1 | Praticamente zero (I/O) | 🔭 DT-002 |
| Loja | Google Play | **15%** da receita | 🔭 |

> ⚠️ **Cloudflare Pages não serve os PMTiles:** o limite é **25 MiB por arquivo**, e um tileset regional passa disso com folga. Isso **confirma o R2 por restrição de plataforma**, não por preferência.

---

## 7. Preços vigentes (pesquisados em 20/07/26)

### 7.1 Cloudflare — fonte: developers.cloudflare.com (`dateModified` 28/05 e 07/07/26)

| Item | Valor | Free tier |
|---|---|---|
| R2 storage | US$ 0,015/GB-mês | 10 GB |
| R2 **Class A** (writes) | **US$ 4,50/milhão** | 1 M/mês |
| R2 **Class B** (reads) | US$ 0,36/milhão | 10 M/mês |
| R2 egress | **Zero** | — |
| Workers | US$ 5/mês inclui **10 M req** + 30 M CPU-ms; excedente **US$ 0,30/milhão** | 100 k req/dia |
| Pages | US$ 0 · bandwidth **ilimitado** · 500 builds/mês · **25 MiB/arquivo** | — |

O Class A era o número que faltava em toda a documentação. É **irrelevante** para nós: writes só acontecem ao republicar o tileset (trimestral). O que conta é Class B.

### 7.2 Lojas

| Item | Valor |
|---|---|
| Play — assinaturas | **15%** (independente da receita) |
| Play — não-recorrente | 15% até US$ 1 M/ano, 30% acima |
| Play — registro | US$ 25, **uma vez** |
| Apple — programa | US$ 99/**ano** + 15% (Small Business) |

> **Mudança em curso:** a nova estrutura do Play (10% + 5% de *billing fee*) entrou em 30/06/26 em EEA/UK/US. **No Brasil só em set/2027**, e para assinaturas o efetivo continua ~15% — **não muda a conta**. Mas é área em movimento pelo *Epic v. Google*: reconferir antes de decidir monetização.

### 7.3 Geocoding hospedado — o eixo é **permissão de cache**, não preço

Cachear é obrigatório (endereços se repetem). Isso **elimina Google e Mapbox "Temporary"**, que proíbem armazenar.

| Provedor | 1º tier pago | ~por 1.000 | Armazenar permanentemente? |
|---|---|---|---|
| **OpenCage** ⭐ | **R$ 120/mês** · 10 k/dia | ~R$ 0,40 | ✅ **Explícito** — "mesmo se você deixar de ser cliente" |
| Geocode.earth | US$ 100/mês · 150 k/mês | ~US$ 0,67 | ✅ Sim |
| LocationIQ | US$ 45/mês · 10 k/dia | US$ 4,50 (US$ 0,067 no Growth Plus) | ✅ No pago; **free só 48 h** |
| Geoapify | US$ 59/mês | ~US$ 0,18 | ⚠️ **Sem cláusula nos Termos** — só em marketing |
| Google / Mapbox Temporary | — | — | ❌ Proíbem |

**OpenCage é o melhor encaixe:** permissão contratual explícita, **preço em BRL** (sem exposição cambial — vantagem real num produto de R$5) e sem cobrança por excedente.

### 7.4 VPS — só para o contraste do §10

| Provedor | Config | Preço | ~R$/mês |
|---|---|---|---|
| Contabo Cloud VPS 8 | 8 vCPU / **24 GB** / 300 GB | € 14,00 | ~R$ 81 |
| Hetzner CX43 | 8 vCPU / 16 GB / 160 GB | € 15,99 | ~R$ 93 |
| Hetzner CAX31 (ARM) | 8 vCPU / 16 GB / 160 GB | € 20,99 | ~R$ 122 |
| Magalu Cloud BV4-8-40 | 4 vCPU / 8 GB / 40 GB | — | R$ 170 |

> ⚠️ **Avisos de junho/26 que invalidam estimativas antigas:**
> - **Hetzner reajustou em 15/06/26** — linhas AMD (CPX/CCX) **mais que dobraram**. ARM (CAX) virou a melhor relação RAM/€.
> - **Oracle cortou o Always Free pela metade em 15/06/26** (4 OCPU/24 GB → 2 OCPU/12 GB), sem anúncio. E retoma instância ociosa (CPU/rede/memória < 20% por 7 dias) — a descrição exata de um geocoder de baixo tráfego. **Não planejar em cima disso.**
> - Contabo: o preço exibido é o de contrato de **24 meses**.

---

## 8. Premissas declaradas

Sem estas, nenhum número abaixo é auditável. As marcadas ⚠️ **não existem em nenhum outro documento** — são premissas deste, não dados.

| Premissa | Valor | Origem |
|---|---|---|
| Entregas/dia por motorista | 120 | ✅ documentado (DT-006) |
| **Dias trabalhados/mês** | **22** | ⚠️ premissa |
| Requests de tile por ativo/mês | ~3.000 | ✅ documentado |
| **Geocodes por rota** (âncora) | **1 realista / 5 pessimista** | ⚠️ premissa — a maioria das âncoras é por toque (custo zero) |
| **Hit rate do cache de geocoding** | **0% nas tabelas** | ⚠️ deliberadamente pessimista |
| Grafo por área | 1 carga / 7 dias | ✅ documentado (ADR-010) |
| Malha | ~89 KB/km² | ✅ **medido** (CHORE-006) |

---

## 9. Cenário A — serverless (**escolhido**)

Custo mensal em R$. Geocoding no **pessimista** (5/rota, cache 0%) — o teto.

| Ativos | Workers | R2 | Geocoding | **Total/mês** | **Por ativo** |
|---|---|---|---|---|---|
| 300 | R$ 0 (free) | R$ 0 (free) | R$ 120 | **~R$ 120** | R$ 0,40 |
| 1.000 | R$ 26 | R$ 0 (free) | R$ 120 | **~R$ 146** | R$ 0,15 |
| 3.000 | R$ 26 | R$ 1 | ~R$ 240 | **~R$ 267** | R$ 0,09 |
| 10.000 | R$ 56 | R$ 37 | ~R$ 600 | **~R$ 693** | R$ 0,07 |
| 50.000 | R$ 240 | R$ 258 | ~R$ 2.550 | **~R$ 3.048** | R$ 0,06 |

**Como as colunas saem:**
- **Workers** — 3.000 req/ativo/mês. Até ~1.000 ativos cabe no free; depois US$ 5 cobre 10 M req; acima, US$ 0,30/milhão.
- **R2** — leituras = mesmas requisições de tile; 10 M/mês grátis, excedente US$ 0,36/milhão. Storage ~20 GB ⇒ 10 GB pagos.
- **Geocoding** — 5/rota × 22 rotas = 110/mês/ativo. O tier de R$ 120 cobre 300 k/mês ≈ **2.700 ativos**. Acima disso os valores são **estimativa de tier**, não preço publicado.

**Com as premissas realistas** (1 geocode/rota, 70% de cache), a coluna de geocoding fica no piso de R$ 120 até bem depois de 10.000 ativos, e o total a 50.000 cai para **~R$ 620/mês (R$ 0,012/ativo)**.

---

## 10. Cenário B — com VPS (**não escolhido**, mantido como contraste)

Substituiria o geocoding hospedado por **Nominatim ou Photon self-hosted**.

| Item | Valor |
|---|---|
| VPS (Contabo VPS 8, 24 GB) | ~R$ 81/mês fixo |
| Tempo de operação (importação, updates, monitoramento) | ⚠️ **não precificado** |
| Nominatim — RAM | 2 GB mínimo (doc oficial); planeta pede 128 GB |
| Nominatim — Brasil | ⚠️ **Sem fonte oficial.** Relato real (out/24): 32 GB de RAM, importação de dias, resolvida ao migrar para PostgreSQL 17 |
| Photon | Mais leve (OpenSearch), tem reverse + busca estruturada; índice Brasil ~2 GB comprimido |

> ⚠️ **Risco descoberto:** o dump pronto do Photon para o Brasil (`photon-db-br-latest`) está datado de **20/07/2025** — aparentemente parado há um ano. Se os extratos por país deixaram de ser atualizados, seria preciso gerar o índice a partir de um Nominatim próprio, o que **anula a economia** do Photon.

**Quando o VPS ganharia:** só no volume alto do fork no-coords (a 50.000 ativos, R$ 81 contra R$ 2.550). Com as premissas realistas da âncora, o hospedado fica em R$ 120 indefinidamente e **o VPS nunca compensa**, porque cobra-se também o tempo de operar.

---

## 11. Receita e break-even

**Por assinante:** R$ 5,00 − 15% do Play = **R$ 4,25 líquidos**.

Pergunta certa: *quantos **pagantes** cobrem o custo de **todos** os ativos?*

| Ativos | Custo (pessimista) | Pagantes p/ empatar | **Conversão necessária** |
|---|---|---|---|
| 300 | R$ 120 | 29 | **9,4%** ❌ |
| 1.000 | R$ 146 | 35 | **3,5%** ⚠️ |
| 3.000 | R$ 267 | 63 | **2,1%** |
| 10.000 | R$ 693 | 164 | **1,6%** |
| 50.000 | R$ 3.048 | 718 | **1,4%** |

Com as **premissas realistas**, cai para **~0,3% acima de 3.000 ativos**.

### O achado que inverte a intuição

**O ponto frágil não é a escala grande — é a pequena.** A partir de ~3.000 ativos o custo por usuário some (R$ 0,06–0,09). Quem aperta é o **piso fixo** do geocoding: a R$ 120/mês com 300 ativos seria preciso converter **9,4%**, muito acima do 0,5% que a documentação assume.

**Implicação prática:** enquanto a base for pequena, **não contratar tier pago de geocoding** — free tier, ou adiar a RF-006.9 para depois da tração. **O custo fixo é o inimigo do começo, não o variável.**

---

## 12. Sensibilidade — o que quebra a conta

| Variável | Efeito |
|---|---|
| **Nº de áreas** (não de usuários) | Maior alavanca. Expandir para 10 cidades custa mais que 10× mais usuários na mesma cidade |
| **Hit rate do cache de geocoding** | Entre 0% e 70% a conta de geocoding varia ~3×. Nunca foi medido |
| **Câmbio** | Tudo exceto OpenCage é em US$/€. Alta de 20% no dólar move o total ~20% |
| **Conversão free→pago** | Único número do lado da receita; a doc usa 0,5% como exemplo, sem base |
| **Fork no-coords (DT-006)** | Multiplica geocoding por ~100×. É a única coisa capaz de estourar o R$5 |

---

## 13. Correções pendentes na documentação

Este documento **não** aplica as correções (escopo). Elas são a **TASK-DOC-006**.

| # | Onde | O que está errado |
|---|---|---|
| 1 | `analise-comercial-2.0.md:233` | *"o único custo novo são os tiles"* — a **ADR-010:125 já prescreve** a correção. Nunca aplicada |
| 2 | `analise-comercial-2.0.md:222` | *"Custo de roteamento = zero"* — verdadeiro só no **compute**; omite a entrega do dado |
| 3 | `analise-comercial-2.0.md:61` | *"custo marginal por usuário ≈ zero"* — ignora tiles e malha |
| 4 | `nao-funcionais.md:12` (RNF-02) | *"zero servidor próprio ✅"* — **já é falso**: o app depende do Worker de tiles (RNF-12). "Sem backend" significa "sem backend **com estado/auth**" |
| 5 | `divida-tecnica.md:12` (DT-006) | O ~US$1,80/motorista/mês vale **só para o fork no-coords**, não para a âncora (§5.1) |
| 6 | Todos os docs comerciais | **Nenhum declara o câmbio usado** — toda conversão US$→R$ é não auditável |
| 7 | `analise-comercial-2.0.md:276-278` | eCPM rewarded de US$ 1,92 é de **Statista 2024**; não reconfirmado em 2026 (§14) |
| 8 | **ADR-010:17 e :22 vs. ADR-007** | A ADR-010 afirma que *"a ADR-007 já decidiu"* Protomaps/PMTiles. **A ADR-007 não decide isso** — ela deixa raster×vetor e provedor **em aberto** para a fase de visual, apontando Protomaps como *destino preferido*. Ou a ADR-007 é atualizada para fechar a escolha, ou a ADR-010 para de citá-la como decidida |

---

## 14. O que continua desconhecido

| Lacuna | Situação |
|---|---|
| **eCPM rewarded Brasil/Android 2026** | ❌ Não confirmado (Tenjin em imagem, Statista em paywall). **Toda a projeção de receita de anúncio depende disto** |
| Tamanho do banco Nominatim para o Brasil | ❌ Nenhuma fonte. Estimativa por regra de três: ~25 GB (não oficial) |
| RAM/disco do Photon para o Brasil | ❌ Nenhuma fonte — os 64 GB/95 GB citados são de **planeta** |
| Hit rate real do cache de geocoding | ❌ Só medível depois da RF-006.9 no ar |
| Churn, CAC, break-even do produto | ❌ Nunca documentados |
| Impostos sobre a receita | ❌ Excluídos explicitamente (`analise-comercial-2.0.md:229`) |
| Cláusula de cache do Geoapify | ⚠️ Ausente dos Termos; exigir por escrito |
| Tamanho final do tileset após filtro + corte | ⚠️ ADR-010 já registra como não medido |

---

## 15. Referências

- **ADR-001** idioma · **ADR-002** roteirização local · **ADR-003** router/shells · **ADR-004** shadcn · **ADR-005** remoção Correios · **ADR-006** identidade visual · **ADR-007** basemap/tiles · **ADR-008** marcadores · **ADR-009** interop dos modos · **ADR-010** malha viária
- **DT-001** TWA · **DT-002** billing × sem backend · **DT-003** CEP nacional · **DT-004** tiles OSM · **DT-005** Overpass · **DT-006** geocoding · **DT-007** reprocessamento do romaneio
- **RNF-02** sem backend · **RNF-03/13** sem API paga · **RNF-12** proxy de tiles · **RNF-14** grafo offline · **RNF-17** Play Billing
- `docs/rascunhos/analise-comercial-2.0.md` — estratégia (autodeclarado especulativo)
- ⚠️ `docs/rascunhos/analise-comercial.md` (1.0) é de **outro produto** (HubFlow B2B, ~R$350 k/mês), marcado como não implementado em `contexto-projeto-ai.md:100`. **Não é insumo deste documento**

---

## Histórico

| Data | Mudança |
|---|---|
| 20/07/26 | Criado. Consolida ADRs 001–010, DTs e a análise comercial 2.0 com **preços pesquisados na data** e câmbio declarado. Achados próprios: (a) o geocoding da **âncora** é ~100× menor que o da DT-006 — **o VPS não se justifica**; (b) a validação de assinatura cabe num **Worker**; (c) o limite de **25 MiB/arquivo** do Pages confirma o R2 por restrição de plataforma; (d) **o gargalo é a escala pequena** (piso fixo), não a grande; (e) Hetzner subiu e Oracle cortou o free tier em jun/26 |
| 20/07/26 | Ampliado a pedido do humano: registradas as escolhas **Opção B (B2C)** e **Cenário A (serverless)**; lista de **recursos utilizados** (§3); e os **porquês** das ADRs reunidos (§4), com o argumento de **vector tiles** que faltava. Achado novo: **a ADR-010 afirma que a ADR-007 decidiu PMTiles, mas a ADR-007 deixa a escolha em aberto** → correção 8 |
