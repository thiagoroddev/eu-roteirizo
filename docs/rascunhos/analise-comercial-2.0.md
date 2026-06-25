# Análise Comercial 2.0 — Roteirizador / Plataforma de Entregas

> ⚠️ **Documento especulativo.** Tudo aqui é hipótese de estratégia, não dado validado nem promessa de resultado. Números de mercado são estimativas grosseiras para raciocínio, não projeções. **Não é consultoria financeira nem jurídica** — decisões de preço, contrato e tratamento de dados (LGPD) exigem validação própria.
>
> Sucede a `docs/analise-comercial.md` (1.0). Conecta com a visão "HubFlow" em `docs/rascunhos/` e com a decisão de roteamento em [`ADR-002`](./arquitetura/ADR/ADR-002.md).

---

> 🔄 **Atualização de escopo (22/06/26) — substitui a tese de §7.** Os dois produtos foram **desacoplados em projetos separados**. **Este projeto = somente o app do entregador (Opção B, B2C).** O hub (Opção A) deixa de ser "fase seguinte do mesmo produto" e passa a ser **um projeto futuro à parte**, com escopo **enxuto** quando vier: gerenciador de rotas **sem fila/aderências** (o hub é volátil); o problema real dele é **cadastro + sincronizar com o app oficial da Shopee**, e a entrada de rotas recusadas provavelmente fica **manual** (funcionário sobe planilha). Tudo isso é futuro e fora deste repositório.
>
> Consequência prática: para **este** projeto, "sem backend" continua firme (só a costura de billing fica preparada — §10.5). As seções abaixo sobre a Opção A ficam como **referência da análise**, não como roadmap deste app.

## 1. As duas estratégias na mesa

Existem **dois produtos diferentes** escondidos na mesma dor, com modelos de negócio opostos:

| | **Opção A — Plataforma B2B** | **Opção B — App B2C (parceiros MEI)** |
|---|---|---|
| Cliente que paga | Shopee (a rede de galpões) | O próprio entregador (MEI) |
| Resolve a dor de | Gestão dos galpões + motoristas | Só do motorista |
| Backend | Obrigatório (tempo real, auth, banco) | **Opcional / nenhum** (tudo local) |
| Receita por unidade | Alta | Baixíssima (centavos a poucos reais) |
| Velocidade até a 1ª receita | Lenta (venda enterprise) | Rápida (loja de app + boca a boca) |
| Risco principal | Cópia + ciclo de venda longo | Margem fina + churn + pirataria |

A tese central deste documento (seção 7) é que **não são concorrentes — são uma sequência.** A Opção B é a porta de entrada barata que financia e dá prova para a Opção A.

---

## 2. Opção A — Plataforma B2B (vender para a Shopee)

Resumo da análise 1.0, para comparação.

**O produto:** plataforma de duas faces. Lado galpão (importar/criar rotas, pool de rotas recusadas que se redistribui **em tempo real sem funcionário validando**, métricas) + lado motorista (cadastro único, pegar/largar rota num clique, push quando abre rota, roteirizador a pé).

**Por que é grande:** ataca o custo operacional que a Shopee tem hoje com gente validando WhatsApp de madrugada, planilhas semi-manuais e rotas paradas por falta de redistribuição. 100+ galpões, ~400 motoristas/dia cada (ordem de dezenas de milhares de motoristas).

**Por que exige backend:** "alguém largou → aparece pra todos na hora" é estado compartilhado em tempo real. Não cabe num app client-side. Stack de baixo custo: Supabase (Postgres + Auth + Realtime + Storage num pacote), Vercel/Netlify, Web Push. O **custo marginal de roteamento é ~zero** porque o cálculo é local sobre OSM (ADR-002) — esse é o argumento decisivo para um cliente "pão-duro": uma API de rota paga, em dezenas de milhares de cálculos/dia, sozinha inviabilizaria o produto.

**Os riscos (inalterados da 1.0):**
- **Cópia:** empresa grande pode construir internamente ao ver funcionando. Fosso = velocidade, conhecimento de operação (você é entregador) e relação com um galpão real.
- **Venda enterprise é lenta:** procurement, jurídico, segurança. Atalho = entrar "por baixo" (um gerente de galpão vira seu defensor) em vez de "por cima".
- **LGPD:** PII de motoristas + dados de entrega da Shopee desde o desenho.

**Teto:** alto. **Tempo até receita:** longo. **Custo de construir:** médio-alto (backend + duas faces).

---

## 3. Opção B — App B2C para os parceiros MEI (a opção nova)

Cada entregador parceiro é uma empresa MEI — ou seja, um **micro-cliente que paga pelo próprio bolso** por algo que melhore o dia dele. Esta opção vende o **roteirizador a pé direto pra ele**, com mensalidade baixa (ideia: ~R$5/mês).

### 3.1 Por que esta opção é cirurgicamente alinhada ao que você já tem

Aqui está o ponto mais forte, e talvez você não tenha percebido o tamanho dele: **esta opção quase não tem custo de servidor, porque pode ser 100% client-side — exatamente a arquitetura que o app já é hoje.**

- Salvar rota **localmente** (localStorage/IndexedDB), **import/export** de arquivo, **sem login**.
- O roteamento é local (ADR-002) → **sem API paga**.
- A Shopee **já deixa o motorista exportar a rota dele** pelo app oficial, justamente para usar em roteirizadores. Ou seja: **você não precisa de permissão, integração nem parceria com a Shopee.** O dado entra por import; é a rota do próprio motorista, exportada por meio oficial — o que também é mais limpo do ponto de vista de dados (é dado dele, não acesso ao sistema da Shopee).

Tradução comercial: **custo marginal por usuário ≈ zero.** Sem Supabase, sem auth, sem realtime. O R$5/mês é quase margem pura (descontada só a taxa de pagamento / corte da loja de apps). Isso é raro e poderoso: a Opção B pode ser lucrativa com **poucos milhares de usuários**.

### 3.2 O posicionamento de preço: R$5 é uma cunha enorme

Os concorrentes diretos cobram **dezenas de dólares por mês** (faixa de R$50–250 dependendo do câmbio):

| App | Plano individual (mês) | Limite de paradas |
|---|---|---|
| Circuit / Spoke | US$ 10 (Lite) – US$ 20 (Standard) | ~500 |
| RoadWarrior | US$ 49 (Pro) | 200/rota |
| (free tiers) | US$ 0 | 8–10 paradas (inútil na prática) |

A R$5/mês você é **uma ordem de grandeza mais barato** que o mercado, em português, pensado para a realidade brasileira (Pix, moto, entrega a pé) — e com a **feature que nenhum deles tem**: paradas personalizadas para caminhada com agrupamento por raio. Preço de cunha + diferencial real = combinação forte para um nicho desatendido.

### 3.3 O alerta honesto: "sem login" vs "cobrar mensalidade"

Há uma tensão a resolver. **Usar sem login** é ótimo pra adoção, mas **cobrar uma assinatura recorrente precisa de alguma identidade/cobrança.** Três caminhos:

1. **Assinatura pela Play Store/App Store:** a loja cuida de cobrança e identidade; o app em si segue "sem login próprio". Custo: a loja fica com 15–30%. Mais simples e confiável; é o caminho natural para R$5/mês.
2. **Chave de licença + Pix:** o usuário paga via Pix e recebe um código que destrava o app. Sem conta, mas você gerencia chaves e renovação (mais trabalho, e pirataria de chave é fácil).
3. **Freemium honesto:** grátis com limite (ex.: 1 rota salva, X paradas) e desbloqueio pago. Reduz atrito de entrada; converte os que dependem da ferramenta.

> 💡 Recomendação especulativa: **freemium + assinatura via loja**. O grátis vira distribuição; a loja resolve a cobrança recorrente sem você construir backend de pagamento.

### 3.4 Distribuição: a sua vantagem injusta

Venda B2C pra gig worker normalmente é cara (marketing). **Você não tem esse problema:** os grupos de WhatsApp de motoristas **já existem, são ativos e você está dentro deles.** É canal de distribuição gratuito, segmentado e com prova social imediata (um motorista mostra pro outro). Esse é, provavelmente, o seu maior ativo não-técnico — e funciona pra Opção B muito antes de funcionar pra Opção A.

### 3.5 Mercado endereçável (especulação)

Não é só Shopee. Entregadores que exportam rota e fazem entrega a pé existem em iFood, Mercado Livre, Amazon Flex, Correios terceirizados etc. Se o público é da ordem de **dezenas de milhares** de motoristas só no ecossistema Shopee, e você converte uma fração pequena:

- 1.000 assinantes × R$5 = **R$5 mil/mês**
- 10.000 assinantes × R$5 = **R$50 mil/mês**

Com custo de infra perto de zero, a maior parte disso é margem. Não é "ficar rico", mas é **receita real, recorrente e barata de sustentar** — e, crucialmente, é **prova de que motoristas pagam pela ferramenta**.

### 3.6 Riscos da Opção B

- **Margem por usuário é fina:** R$5 só faz sentido em **volume**. Abaixo de ~alguns milhares de pagantes, é projeto de paixão, não negócio.
- **Churn:** gig worker entra e sai da profissão; assinatura individual oscila. Mitigação: valor diário óbvio + anuidade com desconto.
- **Pirataria (se for chave/local):** sem login, é fácil compartilhar. Mitigação: assinatura via loja, ou aceitar que "alguns vão furar" e focar no volume honesto.
- **Concorrente grátis (app do Google / oficiais):** seu diferencial precisa ser sentido (entrega a pé, offline, em português, R$5). Se for "mais um roteirizador", perde pro grátis.
- **Dependência do export da Shopee:** se a Shopee mudar/remover o export, o import quebra. Mitigação: suportar múltiplos formatos de entrada.

---

## 4. Comparação lado a lado

| Critério | Opção A (B2B Shopee) | Opção B (B2C MEI) |
|---|---|---|
| Custo de construção | Médio-alto (backend + 2 faces) | **Baixo** (estende o app atual) |
| Custo de operação | Cresce em degraus (infra realtime) | **~zero** (client-side) |
| Tempo até 1ª receita | Longo (venda enterprise) | **Curto** (loja + grupos de WhatsApp) |
| Receita por cliente | Alta | Baixíssima |
| Teto de receita | **Alto** (rede inteira) | Médio (depende de volume) |
| Distribuição | Difícil (procurement) | **Fácil** (grupos que você já tem) |
| Risco dominante | Cópia + ciclo longo | Margem fina + churn |
| Depende da Shopee dizer "sim"? | **Sim** | **Não** |
| Prova que gera | — | Tração que vira argumento p/ A |

---

## 5. Custo: por que a Opção B é quase margem pura

O que torna a Opção B atraente não é o preço — é a **estrutura de custo**. Separe:

- **Custo fixo:** com app client-side, é só seu tempo + conta de loja de desenvolvedor (anuidade baixa). Sem servidor, sem banco, sem realtime.
- **Custo marginal (por usuário):** taxa de pagamento (Pix é barato) + corte da loja. Roteamento custa zero (local). Hospedar um PWA estático custa quase nada.

Já a Opção A tem **custo marginal real** (cada motorista ativo consome realtime/banco), que só se paga com a receita enterprise. Por isso a Opção B é o lugar certo para **começar**: o risco financeiro de errar é mínimo.

---

## 6. Preço: como pensar (não é conselho financeiro)

Dois princípios que valem para as duas opções:

1. **Ancore no valor, não no seu custo.** Na Opção B, o valor é tempo economizado e menos estresse por dia de trabalho — R$5 é trivial perto de uma corrida a mais que o motorista consegue fazer por ser mais eficiente. Na Opção A, o valor é folha de pagamento economizada por galpão.
2. **Preço se descobre testando.** Comece, meça conversão e churn, ajuste. R$5 pode estar **barato demais** (deixando dinheiro na mesa) — o mercado cobra 10–50x isso. Vale testar R$5 vs R$10 vs R$15 e ver onde a conversão ainda segura. Ser o mais barato é vantagem; ser barato **demais** pode sinalizar "produto fraco" e ainda matar sua margem.

> 💡 Hipótese a testar: **freemium grátis** (gancho) + **R$9,90/mês** ou **R$79/ano** (âncora). Ainda é uma fração do Circuit/RoadWarrior, com folga de margem maior que R$5.

---

## 7. A tese central: não escolher — sequenciar

A pergunta "A ou B?" é uma falsa escolha. A leitura estratégica é:

**Opção B primeiro, como cunha. Opção A depois, alavancada pela B.**

Porque:

1. **B valida a hipótese mais barata possível:** "motorista paga por este roteirizador?" Se ninguém paga R$5, a Opção A (muito mais cara de construir) provavelmente também não se sustenta. B é o teste de R$ mais barato que existe.
2. **B constrói ativos que a A precisa:** base de usuários, reputação nos grupos, dados reais de uso, e — o mais importante — **prova**. Chegar na Shopee dizendo *"X mil dos seus motoristas já pagam pelo meu app e largam menos rota"* é um pitch infinitamente mais forte que um slide.
3. **B não depende da Shopee dizer sim.** Você ganha autonomia e receita enquanto a porta enterprise (lenta) amadurece.
4. **A mesma base de código serve as duas:** o roteirizador a pé (ADR-002, TASK-RF-004..010) é o coração de B **e** uma feature de A. Você não joga nada fora ao migrar de B para A — adiciona o backend (Opção A) por cima do que já validou.

O risco dessa sequência é pequeno e o aprendizado é grande: você descobre, com dinheiro real e baixo custo, se o produto tem valor — antes de investir no backend e na venda enterprise.

---

## 8. Recomendação especulativa

1. **Construir o roteirizador a pé** (já em andamento: TASK-RF-004 → RF-010) com **save/import/export local e sem login** — que é exatamente a Opção B.
2. **Lançar como app B2C** (PWA instalável / loja) com **freemium + assinatura barata**, distribuído pelos grupos de WhatsApp que você já frequenta.
3. **Medir** conversão, churn e — principalmente — **se rotas largadas/refeitas caem** com a ferramenta. Esse número é ouro.
4. **Só então**, com tração na mão, montar o backend de tempo real (Opção A) e usar a base de usuários como argumento para o pilô em **um** galpão.

A Opção B não é o "plano B". É o **caminho de menor risco para o mesmo destino** — e talvez um negócio sustentável por si só, mesmo que a Shopee nunca diga sim.

---

## 9. Perguntas em aberto (para validar)

- Qual o **formato exato** do arquivo que o app oficial da Shopee exporta? (define o import e a robustez do parser)
- Quantos motoristas, realisticamente, fazem **entrega a pé** a ponto de valorizar as paradas personalizadas? (tamanho real do nicho do diferencial)
- **Disposição a pagar:** R$5? R$10? Grátis com limite? (testar com poucos usuários reais antes de fixar)
- Cobrança: **loja de apps** (corte de 15–30%, simples) vs **Pix + chave** (mais margem, mais trabalho/pirataria)?
- LGPD no modelo B2C local: mesmo sem login, há tratamento de dados de terceiros (endereços dos destinatários no romaneio) — entender obrigações.

---

## 10. Plataforma, empacotamento e cobrança (direção atual)

> Direção de trabalho consolidada nesta conversa. **Ainda especulação** — deve virar uma ADR formal quando o desenvolvimento da monetização começar.

### 10.1 Foco escolhido

**O projeto foca na Opção B (B2C dos parceiros MEI), Android-first, empacotado como TWA com cobrança via Play Store (Play Billing).** A Opção A (plataforma B2B/Shopee) continua como destino futuro, alavancada pela tração da B (ver seção 7).

### 10.2 Por que Android-first com TWA

- **Público:** o motoboy tende a usar um **celular barato dedicado ao trabalho** (risco de cair do suporte) — quase sempre Android. O motorista de carro pode usar um **iPhone pessoal**, mas esse segmento não justifica, no início, o custo extra de publicar no iOS.
- **Custo de publicação:** Play Store = US$25 (uma vez). App Store = US$99/ano + Mac/build na nuvem. Android-first é mais barato **e** casa com o público majoritário.
- **Reaproveitamento:** o TWA embrulha o **PWA que já existe** (React + Vite + Leaflet) sem reescrita. Caminho de menor esforço para estar na loja.
- **Saída garantida:** se/quando o iPhone do segmento de carro passar a importar, migra-se o **mesmo app web** para **Capacitor** (Android + iOS, cobrança nativa) **sem reescrever** — só troca a casca. React Native fica reservado para um eventual limite nativo real (não previsto no escopo atual).

### 10.3 Comparação de empacotamento (resumo)

| | TWA (escolhido) | Capacitor (upgrade) | React Native |
|---|---|---|---|
| Reaproveita o PWA atual | 100% | 100% | UI/mapa: ~0% |
| Lojas | Play (Android) | Play + App Store | Play + App Store |
| iOS | Não | Sim | Sim |
| Mapa (Leaflet) | Funciona | Funciona | Reescrever |
| Cobrança na loja | Play Billing via Digital Goods API | Plugin nativo de IAP | `react-native-iap` |
| Esforço | Dias | Dias–semanas | Semanas–meses |

> O **motor de roteamento** (TS puro: grafo, A*, modelo de dados — TASK-RF-004/005) é agnóstico de framework e viaja sem retrabalho entre TWA, Capacitor e RN. Só a camada de UI/mapa é específica. Isso evita lock-in.

### 10.4 Cobrança: custo das opções (resumo)

"Sem login" significa **não construir auth próprio** — não "sem identidade". No TWA + Play Store, a **conta Google é a identidade**, então não há login a construir; o custo é a fatia da loja.

| Forma | Identidade/login | Taxa | Infra própria |
|---|---|---|---|
| **Play Billing (TWA — escolhido)** | Conta Google (você não constrói) | **15%** (até US$1M/ano; 30% acima) | ~nenhuma |
| Pix Automático direto (Mercado Pago) | Cadastro leve (e-mail/telefone) | **~0,99%** | Backend de cobrança + identidade mínima |

- A R$5/mês: Play fica com R$0,75 (você recebe ~R$4,25); Pix direto fica com ~R$0,05 (você recebe ~R$4,95), mas exige backend.
- **Custo de roteamento = zero** (cálculo local, ADR-002) — é o que faz R$5 cobrir os custos com folga em qualquer cenário.
- **Quando trocar Play → Pix direto:** só quando a diferença (~R$0,70/usuário/mês) virar dinheiro relevante em escala (na casa das dezenas de milhares de pagantes) e pagar o trabalho de manter cobrança própria. No começo, a simplicidade da Play vence.

> ⚠️ **Validação da assinatura premium (tensão real com "sem backend"):** o *entitlement* (saber se é premium) é checável **no cliente** via Digital Goods API. Mas a validação **segura, à prova de adulteração** (verificar recibo / RTDN) exige **servidor** — sem ela, um usuário determinado (app modificado, root) consegue burlar o premium.
> - **MVP:** entitlement client-side é **bom o suficiente** (modelo de ameaça baixo: furar R$5/mês não compensa o esforço). Continua **sem backend**, aceitando vazamento marginal (alinha com §3.6 "alguns vão furar").
> - **Futuro:** se a pirataria virar problema material, entra um **backend mínimo só para validar assinatura** — o que **conflita com o "sem backend" inegociável** do `contexto-projeto-ai.md` e por isso **vira uma ADR própria** (ver §10.5). **Não prometer "premium inquebrável".**

> ⚠️ Não inclui impostos sobre a receita (MEI/empresa — assunto de contador). Taxas de pagamento mudam; confirmar as vigentes. Não é conselho financeiro.

#### 10.4.1 Custo de tiles por escala (a "continha")

A premissa inicial de "R$5 **sem custos**" estava só **levemente** errada: roteamento (ADR-002) e backend continuam **zero**; o **único custo novo são os tiles do mapa**. E, feito do jeito certo (**Protomaps PMTiles em Cloudflare R2 + Worker**, ADR-007), é **centavos por usuário**.

**Premissas:** R2 **sem egress** (saída grátis) — paga-se só leituras (~US$0,36/milhão), requests do Worker (~US$0,30/milhão acima do plano de US$5) e storage (centavos). ~**3.000 requests/ativo/mês** (conservador). 300 ativos ≈ 1 hub/cidade; o custo cresce mais com **nº de áreas** do que com usuários (mais gente na mesma área = mais cache, não mais custo).

| Ativos | ≈ Hubs/cidades | Custo de tiles/mês (PMTiles/R2) | Por ativo |
|---|---|---|---|
| 300 | 1 | ~R$ 5–15 | ~R$ 0,03 |
| 1.000 | ~3 | ~R$ 30 | ~R$ 0,03 |
| 3.000 | ~10 | ~R$ 60 | ~R$ 0,02 |
| 5.000 | ~17 | ~R$ 90 | ~R$ 0,02 |
| 10.000 | ~33 | ~R$ 160 | ~R$ 0,016 |
| 50.000 | ~167 | ~R$ 600–1.000 | ~R$ 0,015 |

(Início **hospedado** no MapTiler: a 300 ativos cabe no **free tier ~R$0**; em escala, migra-se pro R2 atrás do mesmo Worker.)

**A conta do R$5 por pagante:** `R$5 − R$0,75 (Play 15%) − ~R$0,02 (tiles) ≈ R$4,23 líquido`. A margem por pagante é **quase constante** em qualquer escala — o que pesa é a **fatia da Play**, não os tiles.

**O ponto que fecha:** tile é por **ativo** (todos usam o mapa), mas a cobrança é por **pagante**. A 50.000 ativos (tile ~R$1.000/mês), bastam **~240 pagantes** (0,5% de conversão) para cobrir o tile de **todos** — antes mesmo da receita de anúncio rewarded dos não-pagantes. **Conclusão: o custo novo é minúsculo; R$5 segue cobrindo com enorme folga.**

> Preços de referência (Cloudflare R2/Workers, MapTiler, câmbio) **mudam** — confirmar vigentes. Estimativas de ordem de grandeza, não projeção.

### 10.5 O que vira ADR depois

- Empacotamento: TWA (Android) como alvo inicial; Capacitor como caminho de iOS.
- Cobrança: Play Billing como gateway inicial.
- Gatilhos de revisão: iOS passar a importar (→ Capacitor); escala justificar cobrança própria (→ Pix Automático); limite nativo real (→ avaliar RN).

**ADRs futuras já mapeadas (não bloqueiam o MVP):**

- **Empacotamento/release TWA** (Bubblewrap ou PWABuilder → AAB/APK): é etapa de *release*, não lib de UI. Exige manifest + ícones + critérios de PWA installable (já somos PWA ✅). Merece ADR própria quando for publicar.
- **Validação segura de assinatura premium** → provável **backend mínimo** (Play Developer API + RTDN, em função serverless — Cloudflare Workers ou Supabase Edge Function; **não Next**, que seria overkill). **Conflita com o "sem backend" inegociável** do `contexto-projeto-ai.md`; quando (e se) a pirataria justificar, abrir ADR que revisa essa regra. Até lá, entitlement client-side (ver §10.4).
  - **Costura pronta desde já (sem construir o backend):** o entitlement fica atrás de uma **abstração** no cliente (ex.: `isPremium()` / `EntitlementProvider`) com implementação client-side agora. A validação por servidor entra depois como uma **2ª implementação na mesma interface** → o backend vira **drop-in**, não refatoração. (YAGNI: preparar a junção agora, construir a obra só quando houver pagantes + sinal de pirataria.)

### 10.6 Anúncios (rewarded) como funil para o premium

**Modelo escolhido:** versão grátis exibe um **anúncio rewarded (premiado, opt-in) a cada importação de rota**; o **premium (assinatura) remove o anúncio**. A importação é a ação de entrada **natural e recorrente** do fluxo — colocar a fricção exatamente ali é o que empurra o usuário frequente para o premium. É o "gancho" de conversão, não só uma fonte de receita.

**Por que rewarded (e não banner/intersticial):** em ferramenta de trabalho, anúncio forçado (intersticial no meio da rota) machuca retenção e o posicionamento profissional. O rewarded é **opt-in** — pela política do Google, o usuário escolhe assistir em troca de algo (aqui, liberar a importação). É o formato menos intrusivo e de eCPM melhor que banner.

**Números (Brasil / Android — público-alvo):**

| Formato | eCPM Brasil/Android | Uso aqui |
|---|---|---|
| Banner | ~US$ 0,20–0,50 | Evitar (rende quase nada) |
| Intersticial | ~US$ 2,15 | Evitar (intrusivo em ferramenta de trabalho) |
| **Rewarded** | ~US$ 1,92 | **Escolhido** (opt-in, na importação) |

**Receita estimada (especulação grossa):** ARPU de anúncio ~**R$ 1,50–3,00/mês por ativo** (depende de quantas importações/mês e do fill rate). Só vira material em escala:

| Ativos | Anúncio (~R$2/ativo) | Faixa plausível |
|---|---|---|
| 5.000 | ~R$ 10 mil/mês | R$ 5–22 mil |
| 10.000 | ~R$ 20 mil/mês | R$ 10–45 mil |
| 80.000 | ~R$ 160 mil/mês | R$ 80–360 mil |

**Modelo híbrido resultante:** troco dos muitos que não pagam (rewarded na importação) **+** assinatura dos poucos que usam todo dia e querem sem anúncio. Maximiza a receita total sem transformar a ferramenta num outdoor.

**Cuidados:**
- **Equilíbrio da fricção:** o anúncio a cada importação é proposital para converter — mas se doer demais (motorista importa várias vezes ao dia), pode empurrar para o concorrente grátis (app oficial / Google). Calibrar: talvez 1 rewarded por importação, com premium claramente vendido como "importe sem espera".
- **Escala:** abaixo de alguns milhares de ativos, anúncio é troco; o foco inicial de receita é a assinatura.
- **LGPD / consentimento:** anúncio exige tela de consentimento (Google UMP) e revisão de privacidade — atrito com o ideal de "app limpo e local". Pesar antes de ligar.

> Quando isso for implementado, entra junto na ADR de monetização (§10.5): assinatura (Play Billing) **+** rewarded opt-in na importação como funil.

---

## Última Atualização

- **Data:** 22/06/26
- **Por:** análise comercial 2.0 — comparação B2B (Shopee) vs B2C (parceiros MEI) e, na §10, consolidação do foco: **B2C, Android-first, TWA + Play Billing**, com **rewarded opt-in na importação** como funil para o premium (§10.6). Especulativo; vira ADR ao iniciar a monetização.
- **Fontes:** preço de concorrentes (Circuit/Spoke, RoadWarrior); taxas de Play Store (15%) e Pix/Mercado Pago (~0,99%); eCPM Brasil/Android (rewarded ~US$1,92, intersticial ~US$2,15 — Statista 2024). Valores em USD com faixas aproximadas em BRL só para raciocínio. Conferidos em jun/2026.
