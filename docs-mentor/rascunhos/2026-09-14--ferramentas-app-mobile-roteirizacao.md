# Ferramentas para um app mobile que aplique o plano enxuto do motor de rotas

Status: levantamento pedido pelo humano em 14/09/26, **sem amarras de stack e sem a limitação de funcionar
offline**. Complementa o [plano enxuto](./2026-09-13--plano-enxuto-motor-de-rotas.md) e a
[regra da parada sem busca de vagas](./regra-parada-do-veiculo-sem-busca-de-vagas.md). Não autoriza
implementação.

**Direção decidida pelo humano (seção 8):** o cálculo roda primeiro **no celular**. O servidor das seções 6 e 7 é o
plano B, se o motor pronto não couber no aparelho.

> ⚠️ **Preços consultados em 14/09/26**, nas páginas oficiais quando possível (fontes no fim). Mudam com
> frequência: conferir na hora de decidir. Onde a fonte é um comparativo, e não a página do fornecedor, a
> linha diz.

> ⚠️ **Decisões registradas que este caminho contraria:** a ADR-010 (malha em PMTiles/R2 no aparelho), o
> RNF-03/13 (zero geocodificação externa) e a restrição "sem backend e sem API de roteirização paga", que o
> próprio plano enxuto repete. Adotar exige revisar essas decisões por escrito, não trocar em silêncio.

## 1. O que o vídeo de 13/09/26 mostra

Gravação de tela sem áudio, 75 s, sobre o roteiro de Ipanema no app atual:

- o humano **desenha à mão o percurso do carro** (traço verde) pelas ruas principais, a partir do início
  (Av. Epitácio Pessoa com Maria Quitéria), fechando circuitos pelos quarteirões;
- **pontilhados vermelhos** saem do percurso e entram em ruas onde o carro não passa (Nascimento Silva,
  Barão de Jaguaribe, Redfern, Prudente de Morais): são as **caminhadas** até as entregas fora do traço.

É o modo **"desenho assistido com agrupamento automático"** do plano enxuto: o humano decide o caminho do
veículo, e o motor encaixa o traço nas ruas, gera as paradas ao longo dele e cobre a pé o que ficou fora.

## 2. Premissas do humano (14/09/26)

- **O app não tem navegação nem GPS próprios.** A condução acontece no app externo (Google Maps, Waze).
- **Janela flutuante sobre o app externo** para marcar o pacote entregue sem sair da navegação.
- **VPS é a preferência de hospedagem**, e o levantamento cita as outras opções.

## 3. O nome de cada problema

| Parte | Problema conhecido | Pronto no mercado? |
|---|---|---|
| Traço do dedo → percurso nas ruas | **Map matching** (o traço é tratado como GPS ruidoso; modelo HMM de Newson & Krumm, 2009) | Sim: API e código aberto |
| Automático individual | **TSP** em malha dirigida, com mão única e custo de conversão | Sim |
| Paradas + caminhadas (automático com agrupamento, e o desenho) | **Park-and-Loop** (distribuição postal: o carro para e o entregador faz circuitos a pé), parente do *Covering Tour Problem* | **Não**: é o diferencial, e o risco |

Modelagem prática do agrupamento: **TSP generalizado**, que os solvers chamam de "entregas com locais
alternativos". Cada entrega pode ser atendida de N paradas candidatas dentro do limite de caminhada, cada
uma com o custo da sua caminhada. Entregas que escolhem a mesma parada viram grupo. OR-Tools (disjunções),
PyVRP e Google Route Optimization aceitam esse modelo.

## 4. A janela flutuante: a sugestão comparada com as alternativas

A sugestão é hipótese a comparar. O objetivo real: **marcar entregue e ir para a próxima parada sem sair
do app de navegação.**

| Forma | Como funciona | A favor | Contra |
|---|---|---|---|
| **Janela sobreposta** (a sugestão; bolha como a de apps de motorista) | Permissão especial `SYSTEM_ALERT_WINDOW` ("sobrepor a outros apps") e janela `TYPE_APPLICATION_OVERLAY` | Um toque, sempre à vista, por cima do Waze | Só Android; o usuário concede a permissão nas configurações; no Android 15, serviço em primeiro plano iniciado do fundo exige a janela visível; não existe no iPhone |
| **Notificação fixa com botões** (serviço em primeiro plano) | Botões "Entregue" e "Próxima" na notificação | Qualquer Android, sem permissão especial, aceito pela loja sem atrito | Um gesto a mais: puxar a barra |
| **Live Updates do Android 16** (`ProgressStyle`) | Notificação promovida: chip na barra de status e na tela de bloqueio; entrega é caso de uso previsto | Visual padronizado, progresso por paradas | Só Android 16+: conferir a versão do aparelho |
| Bubbles API (Android 11+) | Bolha ligada a notificação | Nativa | Pensada para conversas: uso fora disso é incerto |
| **Live Activities do iOS** (iOS 17+, botões por App Intents) | Cartão na tela de bloqueio e na Dynamic Island, com botão | É a única forma no iPhone | iOS não permite janela sobre outro app |

**Recomendação:** janela sobreposta como principal no Android, **com as mesmas ações na notificação fixa**
(sem a permissão, o app continua usável), e Live Updates quando o aparelho tiver Android 16. Live
Activities só se o iPhone entrar no escopo.

O botão "Próxima" abre o app externo já com o destino da parada seguinte (a âncora do veículo):

- Google Maps: `https://www.google.com/maps/dir/?api=1&destination=<lat>,<lng>&travelmode=driving`
- Waze: `https://waze.com/ul?ll=<lat>,<lng>&navigate=yes`

Sem SDK de navegação, não há custo por viagem (Mapbox Navigation SDK: US$ 0,30 por MAU e US$ 0,08 por
viagem acima da franquia; Google Navigation SDK: 1.000 grátis/mês, depois US$ 25 a US$ 2 por 1.000).

## 5. Ferramentas por camada, com preços

### 5.1 App

| Opção | Preço | Observação |
|---|---|---|
| **React Native + Expo** | Framework grátis. EAS: Free (15 builds Android e 15 iOS/mês, publica na loja), Starter US$ 19/mês, Production US$ 199/mês, mais uso | Reaproveita TypeScript/React e a lógica do protótipo. A janela sobreposta exige módulo nativo (Kotlin) no *dev client* |
| Flutter | Grátis | Pacote `system_alert_window` no pub.dev |
| Kotlin nativo (Jetpack Compose) | Grátis | Acesso direto a sobreposição, serviço e notificações; iOS seria outro app ou Kotlin Multiplatform |
| Contas de loja | Google Play: US$ 25 uma vez; Apple: US$ 99/ano | Valores conhecidos, não consultados hoje |

### 5.2 Mapa (tela de planejamento e desenho)

| Opção | Preço |
|---|---|
| **MapLibre Native** (BSD) + **vector tiles** próprios em PMTiles (basemap do Protomaps) na VPS ou no R2 | Grátis; paga só armazenamento e banda (conta na seção 5.2.1) |
| MapLibre + MapTiler | Free sem uso comercial (5 mil sessões); Flex US$ 30/mês (25 mil sessões, 500 mil requisições) |
| MapLibre + Stadia Maps | Free sem uso comercial; Starter US$ 20, Standard US$ 80, Professional US$ 250/mês |
| Mapbox Maps SDK | Grátis até 25 mil usuários ativos/mês (MAU); US$ 4 por 1.000 entre 25.001 e 125.000. Com 26 mil ativos: 1.000 cobrados = **US$ 4 no mês inteiro**. Conta por instalação: desinstalar e instalar de novo vira outro ativo. Pela definição, conta qualquer tela de mapa do SDK, venham os tiles de onde vierem |
| Google Maps SDK (Android/iOS) | SKU "Maps SDK": **ilimitado e grátis**, com as condições abaixo |

**PMTiles é vetor?** PMTiles é um contêiner de arquivo único, que guarda tiles vetoriais (MVT) ou raster. O
basemap do Protomaps é **vetorial**, o que casa com a decisão de vector tiles do plano de infraestrutura
(ADR-007 e ADR-010): menos requisições por tela, arquivos menores e estilo próprio.

**Condições para o mapa do Google sair de graça:**

- é preciso projeto no Google Cloud com faturamento ativo e chave de API;
- o mapa sai de graça só **sem Map ID**. Estilo pela nuvem, marcadores avançados e outros recursos que
  pedem Map ID passam a cobrar como **Dynamic Maps**: 10 mil carregamentos/mês grátis, depois US$ 7 por
  1.000. Com 10 mil ativos abrindo o mapa uma vez por dia útil, seriam cerca de 220 mil carregamentos, perto
  de US$ 1.300/mês. O estilo precisa ser o JSON antigo, aplicado no app;
- Street View cobra à parte;
- conteúdo do Google (resultado de rota, lugar, endereço) não pode ser usado em mapa que não seja do Google.
  Desenhar as suas rotas do Valhalla sobre o mapa do Google é o sentido permitido;
- sem baixar tiles para uso offline além do cache automático do SDK;
- não encontrei exigência de app gratuito na documentação consultada: confirmar nos Termos do Google Maps
  Platform antes de decidir.

#### 5.2.1 Armazenamento e banda com 1.000 e 10.000 ativos

Premissas, a medir antes de contratar:

- **22 roteiros por ativo/mês** e **~3.000 requisições de tile por ativo/mês**, as mesmas do
  `docs/rascunhos/plano-infraestrutura-e-custos.md`;
- **tile vetorial médio de ~40 KB**: cerca de 120 MB de banda por ativo/mês;
- **basemap do Brasil em PMTiles: ~20 GB**, o número conservador do plano de infraestrutura. O planeta
  inteiro tem ~120 GB (z0 a z15); o tamanho real do recorte sai do `pmtiles extract --dry-run`, que mede sem
  baixar;
- **roteiro salvo: ~220 KB** para 150 entregas (medido: 76 KB num JSON do laboratório com 65 linhas de
  pacote), cerca de 1/3 disso comprimido no Postgres;
- **dados guardados por 90 dias**. O prazo é premissa, não regra: a LGPD pede guardar só o necessário
  (princípio da necessidade), e endereço de terceiro é dado pessoal.

| Item | 1.000 ativos | 10.000 ativos |
|---|---|---|
| Basemap vetorial (um arquivo para todos, não cresce com usuários) | ~20 GB: €0 no disco da VPS, ou US$ 0,15/mês no R2 | igual |
| Banda de tiles | ~120 GB/mês: €0 na Hetzner (20 TB incluídos); R2: €0 (3 milhões de leituras, dentro da franquia) | ~1,2 TB/mês: €0 na Hetzner; R2: 30 milhões de leituras, US$ 7,20/mês |
| Malha do Valhalla (só no servidor, não vai para o aparelho) | alguns GB: €0 no disco | igual |
| Roteiros de 90 dias, comprimidos | ~5 GB: €0 no disco | ~48 GB: Volume de 100 GB, €5,72/mês |
| Backup dos dados | no backup da VPS (20% do preço) | Object Storage da Hetzner, €6,49/mês com 1 TB |
| **Armazenamento + banda** | **≈ €0 além da VPS** | **≈ €12/mês** (+ US$ 7 se os tiles forem pelo R2) |

Excedente de banda na Hetzner, fora dos 20 TB: €1 por TB na UE e nos EUA.

**O que pesa em escala não é armazenamento, é processamento.** Premissa: 2 cálculos por roteiro, 30 s de
CPU cada, concentrados em 3 horas da manhã. Uma VPS de 4 vCPU processa ~1.440 cálculos nessa janela, cerca de
700 roteiros. Com 1.000 ativos, são 1 a 2 servidores de 4 vCPU no pico. Com 10.000, ~56 vCPU no pico, algo
como 7 servidores de 8 vCPU (CAX31, €20,99 cada), ou fila mais longa. A medição do tempo real de um cálculo
com os dois romaneios reais é o que fecha essa conta.

### 5.3 Caminhos, matriz de distâncias e map matching

**Código aberto na VPS** (custo = o servidor):

| Motor | Licença | Serve para |
|---|---|---|
| **Valhalla** | MIT | Carro e pedestre, custo de conversão, matriz, isócrona e map matching (`trace_route`) num motor só. Na operação, os tiles ficam mapeados em memória. Gerar os tiles pede memória: 4 GB é pouco |
| GraphHopper | Apache-2.0 | Perfis e custos configuráveis, módulo de map matching |
| OSRM | BSD-2 | Matrizes muito rápidas e `match`; menos flexível para pedestre e conversões, e usa mais memória |

Tamanho do mapa OpenStreetMap (Geofabrik, 13/09/26): **Sudeste 818 MB**, Brasil inteiro 1,9 GB.

**APIs pagas:**

| Fornecedor | Rotas | Matriz | Map matching |
|---|---|---|---|
| Mapbox | 100 mil/mês grátis; US$ 2 por 1.000 | 100 mil elementos/mês grátis; US$ 2 por 1.000 elementos | 100 mil/mês grátis; US$ 2 por 1.000 |
| Google | Routes Essentials: 10 mil/mês grátis; US$ 5 por 1.000 | Route Matrix Essentials: mesma tabela | Roads (Snap to Roads): 5 mil/mês grátis; US$ 10 por 1.000 |
| Stadia Maps (Valhalla gerenciado) | 20 créditos por requisição (Starter: 1 milhão de créditos, US$ 20/mês) | incluída nos planos pagos | 20 créditos por requisição |
| GraphHopper | Free (não comercial, 500 créditos/dia); Basic €69, Standard €199, Premium €479/mês | por créditos | só nos pagos: 150, 500 ou 700 pontos por requisição |
| HERE | preços não obtidos na página oficial em 14/09/26 | | |

**Conta que decide:** a matriz de um roteiro com N pontos tem N × N elementos. Com 150 entregas (carro), são
22.500 elementos por cálculo; a franquia grátis da Mapbox cobre cerca de 4 cálculos por mês. O agrupamento
precisa ainda da matriz a pé entre paradas candidatas e entregas, que é maior. **Por isso o motor de
caminhos fica na VPS.**

### 5.4 Otimização

**Código aberto** (grátis): **OR-Tools** (Apache-2.0; disjunções = locais alternativos; CP-SAT para a
cobertura do desenho) · **PyVRP** (MIT; busca genética híbrida, estado da arte em VRP) · **Timefold
Solver** (Apache-2.0; restrições próprias em Java/Python) · **VROOM** (BSD-2; rápido para paradas fixas).

**APIs:**

| Fornecedor | Preço | Serve para |
|---|---|---|
| Google Route Optimization | Cobra **por entrega** no pedido. 1 veículo: 5 mil/mês grátis, depois US$ 10 por 1.000 (US$ 0,80 por roteiro de 80 entregas, US$ 1,50 por roteiro de 150; a franquia cobre cerca de 33 roteiros de 150 por mês); frota: a partir de US$ 30 por 1.000 | Referência de "padrão de mercado" para o automático individual, e entregas com locais alternativos |
| Mapbox Optimization | 100 mil requisições/mês grátis; US$ 2 por 1.000 | Conferir o limite de pontos por requisição |
| GraphHopper Route Optimization | Nos planos acima; Basic até 30 locais, Standard até 80, Premium até 200 | Basic não comporta um romaneio de 60 entregas |

Solvers comerciais (Hexaly, Gurobi): licença sob consulta; só para referência exata em casos pequenos.

### 5.5 Hospedagem

**VPS** (a preferência):

| Fornecedor | Plano e preço mensal | No Brasil? |
|---|---|---|
| **Hetzner** | CX23 (2 vCPU, 4 GB) €5,49 · **CX33 (4 vCPU, 8 GB) €8,49** · CAX21 (ARM, 4 vCPU, 8 GB) €10,49. Preços desde o reajuste de 15/06/26, Alemanha e Finlândia | Não (UE, EUA, Singapura) |
| Contabo | VPS S a partir de US$ 6,99, com muita RAM e CPU/disco mais lentos (segundo comparativos) | Conferir |
| OVHcloud | VPS-1 (2 vCores, 4 GB) a partir de US$ 4,54 (segundo comparativos) | Conferir |
| Hostinger | Sem plano de 4 vCPU e 8 GB. KVM 2 (2 vCPU, 8 GB, 100 GB NVMe): R$ 43,99/mês pagando 24 meses adiantados (R$ 1.055,76), renova por R$ 77,99/mês · **KVM 4 (4 vCPU, 16 GB, 200 GB)**: R$ 59,99/mês em 24 meses (R$ 1.439,76), renova por R$ 149,99/mês. Backup semanal incluído; cobrança em reais | A página oficial diz só "América do Sul"; comparativos citam São Paulo: conferir |
| Vultr | A partir de US$ 6/mês (1 GB); 2 vCPU e 4 GB entre US$ 24 e US$ 30 | **Sim**, São Paulo |
| DigitalOcean | 2 vCPU, 4 GB: US$ 24; 8 GB (General Purpose): US$ 63 | Não |
| AWS Lightsail | A partir de US$ 3,50; preço de São Paulo não obtido | **Sim** |
| Oracle Cloud Always Free | Ampere cortado de 4 OCPU e 24 GB para **2 OCPU e 12 GB** em 15/06/26, sem anúncio; instâncias acima do limite encerradas a partir de 18/08/26 | **Sim** (São Paulo, Vinhedo). Grátis que muda sem aviso não serve de base |

**Plataformas gerenciadas** (PaaS): Fly.io (por segundo; cerca de US$ 2/mês com 256 MB, cerca de US$ 5 por
GB de RAM/mês) · Railway (Hobby US$ 5, Pro US$ 20/mês, mais uso) · Render (Starter US$ 7, Standard US$ 25
por serviço). Servem para a API leve. **Para o Valhalla, que precisa de memória e disco persistentes, a VPS
sai mais barata.**

**Banco, login e sincronização:** Postgres + PostGIS na própria VPS (grátis) · Supabase (Free; Pro US$
25/mês com US$ 10 de computação incluídos) · Firebase (Spark grátis; Blaze: Firestore US$ 0,18 por 100 mil
leituras, com 50 mil leituras/dia grátis).

**Latência:** servidor na Europa responde do Rio em cerca de 200 ms por chamada. Para planejar o roteiro
basta. Proposta: a marcação de entregue grava primeiro no aparelho e sincroniza depois, para não depender do
servidor nem do sinal na rua.

### 5.5.1 Conta, assinatura e preferências

A decisão registrada no `docs/rascunhos/plano-infraestrutura-e-custos.md` (RNF-02, ADR-002, DT-002) é **sem
login**: dados no aparelho, assinatura pela Google Play Billing, liberação do premium conferida no app no MVP
e validação no servidor depois.

| Dado | Onde fica | Custo |
|---|---|---|
| Cartão e pagamento | Na Google Play; nunca passa pelo app | A taxa de 15% sobre a assinatura, não armazenamento |
| Situação da assinatura | A Play Billing informa; a validação no servidor consulta a API de desenvolvedor da Google Play e guarda ~1 KB por usuário | Cloudflare D1: 5 GB e 5 milhões de leituras/dia grátis · RevenueCat: grátis até US$ 2.500/mês de receita, depois 1% · ou uma tabela no Postgres da VPS |
| Login | Sem senha própria: "Entrar com Google" pelo Firebase Authentication | Grátis até 50 mil ativos/mês; acima, US$ 0,0055 a 0,0025 por ativo |
| Senha | Não guardar. Quem usa login delega a um provedor | 0 |
| Perfil, preferências e roteiros | No aparelho, com o Auto Backup do Android: até 25 MB por app no Google Drive do usuário, sem contar na cota dele (conferir: o Google mudou regras de backup de outros apps) | 0 |

**Tamanho:** conta, preferências e assinatura somam poucos KB por usuário. Com 26 mil usuários, ~130 MB, que cabe
na franquia grátis de qualquer opção. O que pesa é a taxa da loja e, acima de 50 mil ativos, o login cobrado por
ativo.

**Obrigações ao criar conta:** a Google Play exige, desde 2024, excluir a conta pelo app **e** por um link na
web. A LGPD trata esses dados como pessoais. Sem login, a assinatura fica presa à conta Google do aparelho
("restaurar compras") e a exigência de exclusão de conta não se aplica. O formulário de segurança de dados da Play continua obrigatório.

### 5.6 Produtos prontos, como referência de preço

Routific (100 pedidos/mês grátis; US$ 150/mês até 1.000) · OptimoRoute (a partir de US$ 35,10 por
motorista/mês) · Upper (US$ 50 a US$ 89 por usuário/mês) · Circuit/Spoke Dispatch (US$ 125 a US$ 1.000/mês,
mais US$ 0,04 a US$ 0,07 por parada). Todos otimizam paradas fixas. **Não conheço** produto que faça desenho do
percurso → agrupamento a pé, mas isso não foi pesquisado a fundo.

## 6. Composição com cálculo no servidor (plano B) e custo

### 6.1 Volume e quantos usuários um servidor aguenta

Roteiro real: **80 entregas (moto) a 150 (carro)**. Por roteiro, a conta de trabalho é:

- matriz do carro: até 150 × 150 = 22.500 pares, calculada pelo Valhalla em segundos;
- matriz a pé entre paradas candidatas e entregas: maior, mas cada busca é curta (limite de caminhada);
- otimização: OR-Tools ou PyVRP com limite de tempo, na faixa de dezenas de segundos por cálculo;
- moto e carro usam perfis diferentes do Valhalla (`motorcycle` ou `motor_scooter`, e `auto`).

**Estimativa, a medir antes de escolher o tamanho:** com 2 cálculos por roteiro e 30 s cada, uma VPS de 4
vCPU e 8 GB processa cerca de 700 roteiros numa janela de 3 horas (conta na seção 5.2.1): um piloto cabe com
folga, e 1.000 ativos pedem 1 a 2 servidores no pico. O que satura primeiro é CPU, não memória. O custo do servidor não cresce por
roteiro: cresce por degrau, quando for preciso uma segunda VPS ou uma de vCPU dedicada. A medição sai dos
dois romaneios reais do laboratório.

Com API paga no lugar do motor próprio, o custo cresce por roteiro: a Google Route Optimization cobre cerca
de 33 roteiros de 150 entregas por mês na franquia, ou seja, um ou dois entregadores.

### 6.2 Tudo o que entra na conta

| Item | Escolha | Custo | Obrigatório? |
|---|---|---|---|
| **Servidor** | Hetzner CX33 (4 vCPU, 8 GB): Valhalla, API em Python (FastAPI), OR-Tools e PyVRP, Postgres + PostGIS | **€8,49/mês**, mais **IOF de 3,5%** no cartão internacional e a variação do euro. Exemplo, com o euro a R$ 6,00: cerca de R$ 52,70/mês. Alternativa em reais: Hostinger KVM 4 (4 vCPU, 16 GB), R$ 59,99/mês por 24 meses, renovando a R$ 149,99 | Sim |
| **Backup do servidor** | Backup automático da Hetzner (7 cópias) | 20% do preço do servidor: cerca de €1,70/mês. Na Hostinger, o semanal já vem incluído | Sim, na prática |
| **Malha viária** (ruas, mão única, conversões) | OpenStreetMap do Sudeste pela Geofabrik (818 MB, atualizado todo dia) | **Grátis**. Licença ODbL: o app mostra "© colaboradores do OpenStreetMap" | Sim |
| Gerar os tiles do Valhalla | No PC, com mais memória, ou numa VPS maior alugada por hora só para isso | Grátis no PC; na Hetzner, a cobrança é por hora | Sim, a cada atualização da malha |
| **Mapa de fundo** (o desenho da tela) | Build diário do Protomaps em PMTiles, recortado para a região com `pmtiles extract`, servido pela própria VPS | **Grátis**; a banda está incluída no plano (20 TB na Hetzner). Mesma atribuição ODbL | Sim |
| Domínio + certificado HTTPS | `.com.br` no Registro.br + Let's Encrypt | R$ 40/ano; certificado grátis | Sim: o app fala com o servidor por HTTPS |
| App | React Native + Expo (EAS Free) + MapLibre | Grátis até 15 builds Android por mês | Sim |
| Execução na rua | Deeplink Waze/Google Maps + janela sobreposta + notificação com botões | Grátis | Sim |
| Loja | Google Play | US$ 25 uma vez (mais IOF) | Sim |
| iPhone | Apple Developer | US$ 99/ano | Só se o iOS entrar |
| Correção de endereço | O romaneio já traz coordenada: **não é preciso geocodificar para roteirizar**. Para corrigir endereço: Google Geocoding (10 mil/mês grátis, depois US$ 5 por 1.000) ou Nominatim/Photon próprios, que pedem 16 GB ou mais só para eles | Grátis no volume de um entregador | Não |
| Régua de mercado | Google Route Optimization para comparar a qualidade das rotas | Grátis na franquia (5 mil entregas/mês) | Não |

**Total mensal do piloto: cerca de €10,19** (servidor e backup) **+ IOF + R$ 40/ano de domínio**, e US$ 25
uma vez pela loja. Nenhuma API paga.

**O custo que não aparece na tabela é o de manter o servidor:** atualizações de segurança, conferir os
backups, atualizar a malha e regerar os tiles. Esse trabalho é o que as APIs pagas vendem.

Como o modo do vídeo usa as peças:

1. O gesto é simplificado e encaixado nas ruas pelo `trace_route` do Valhalla, respeitando mão única.
   Contramão ou ambiguidade aparece para correção, sem desvio silencioso.
2. Para cada entrega fora do traço, o Valhalla calcula a caminhada até os pontos do percurso.
3. O OR-Tools CP-SAT escolhe o mínimo de paradas que cobre todas as entregas dentro do limite de caminhada.
4. O app mostra a prévia (percurso verde, caminhadas vermelhas) e as entregas não cobertas.

## 7. Escala e operação da VPS

### 7.1 Com 26.000 ativos, não é "só a VPS"

Armazenamento e banda continuam baratos (seção 5.2.1). O que cresce é **CPU para calcular rota**. Premissa da
seção 5.2.1: uma VPS de 4 vCPU faz ~700 roteiros numa janela de 3 horas.

| Premissa do cálculo | vCPU no pico | Hetzner, sempre ligado | Hetzner, ligando só no pico | Hostinger KVM 4 |
|---|---|---|---|---|
| Pessimista: 2 cálculos × 30 s | ~150 | ~19 × CAX31 (8 vCPU, €20,99) ≈ **€400/mês** | ~66 h/mês × 19 servidores, cobrados por hora ≈ **€40/mês** (estimativa) | ~37 × R$ 149,99 (renovação) ≈ **R$ 5.550/mês**, cada um com 24 meses pagos adiantados |
| Otimista: 1 cálculo × 5 s | ~13 | 2 × CAX31 ≈ **€42/mês** | ~€5/mês | ~4 × R$ 149,99 ≈ R$ 600/mês |

A diferença entre as linhas é o tempo real de um cálculo, que ainda não foi medido. A diferença entre as
colunas é **automação**: a Hetzner cobra por hora com teto mensal e tem API para criar e apagar servidores. A
Hostinger vende contrato de 24 meses, que serve para servidor fixo, não para capacidade que sobe e desce.

A arquitetura original, com a rota calculada no aparelho, tem custo de CPU zero em qualquer escala: é o
contrapeso a considerar ao trocar o offline por servidor.

### 7.2 VPS escala sozinha?

**Não.** VPS é servidor fixo. Os caminhos:

- **Vertical:** trocar por um plano maior. Na Hetzner é um clique ou uma chamada de API e um reboot, em
  minutos. Tem teto: o maior plano.
- **Horizontal:** mais servidores e uma fila de cálculos (ex.: Redis + workers). Criar e apagar servidor pela
  API da Hetzner é automatizável com script ou Terraform/OpenTofu. Não encontrei autoscaling nativo de
  servidor na Hetzner: automático de verdade exige Kubernetes com cluster-autoscaler, que para uma pessoa só é
  complexidade demais.
- **Híbrido, o que eu faria em escala:** Valhalla, banco e API fixos na VPS, e só o cálculo pesado em
  contêiner com autoscaling gerenciado (Cloud Run, Fly Machines, AWS Fargate), que liga no pico da manhã e
  zera depois. Preços desses serviços não foram consultados.

### 7.3 Manter a VPS: dá para uma pessoa?

**Para o piloto e para as primeiras centenas de ativos, sim.** É o que muita gente faz sozinha, desde que
quase tudo seja automático:

| Tarefa | Como fica automática | O que sobra manual |
|---|---|---|
| Atualizações de segurança | `unattended-upgrades` no Ubuntu; login só por chave SSH; firewall da Hetzner (grátis) | Reboot de kernel e atualização de versão do sistema, algumas vezes por ano |
| Deploy, HTTPS, banco | Coolify ou Dokploy (painel de código aberto, instalado na VPS): deploy por `git push`, certificado automático, backup do banco para storage S3 com um botão | Atualizar o painel |
| Backup | Backup automático da Hetzner + dump diário do Postgres para o Object Storage | **Testar a restauração**, a cada trimestre: backup nunca restaurado não é backup |
| Atualizar a malha e regerar os tiles | Imagem `valhalla-scripted` (Docker oficial) reconstrói os tiles quando o arquivo `.pbf` muda; um cron semanal baixa o Sudeste da Geofabrik | Conferir se a reconstrução terminou, pelo alerta |
| Saber que caiu | Monitor de disponibilidade (Uptime Kuma na própria VPS, ou serviço externo) | Responder ao alerta |

**Custo em tempo, estimativa:** 2 a 5 dias para montar tudo uma vez; depois, 1 a 2 horas por mês, mais os
incidentes.

**Onde vira loucura:** vários servidores com autoscaling, fila e plantão, cuidados por uma pessoa só. Nesse
ponto vale pagar serviço gerenciado para a parte que escala (7.2).

**O que ajuda a arquitetura:** a marcação de entregue grava no aparelho. Se o servidor cair, o entregador
continua entregando; só não consegue planejar um roteiro novo até voltar.

## 8. Decisões do humano (14/09/26)

1. **Primeiro descobrir se o cálculo cabe no celular.** Com o cálculo no aparelho, a CPU custa zero em qualquer
   escala, e o servidor fica só com o que não depende de usuário: mapa de fundo e malha no R2, e, quando
   houver, a validação da assinatura.
2. **Meta de tempo: 5 a 10 segundos por cálculo**, a mesma dos apps que o humano testou (Spoke/Circuit e
   similares) e com a qual os entregadores já estão acostumados. Nesses produtos o cálculo roda no servidor
   deles; aqui, a mesma espera precisa sair do aparelho.
3. **A medição só acontece com o motor pronto**, no Samsung M35, com roteiros de 80 (moto) a 150 (carro)
   entregas. Medir agora, com o algoritmo experimental do laboratório, não diz nada sobre o motor final. O
   critério entra no plano da tarefa que entregar o motor.
4. **Se o motor pronto não atingir a meta no aparelho**, voltam as seções 6 e 7: o cálculo pesado vai para o
   servidor, com a conta de CPU da seção 7.1.
5. **Conta e assinatura seguem sem login** (seção 5.5.1), até aparecer motivo concreto: sincronizar entre
   aparelhos, ou um plano para empresa.

## Fontes (consultadas em 14/09/26)

- [Mapbox: preços](https://www.mapbox.com/pricing)
- [Google Maps Platform: preços](https://developers.google.com/maps/billing-and-pricing/pricing) · [Route Optimization: cobrança](https://developers.google.com/maps/documentation/route-optimization/usage-and-billing) · [Maps SDK for Android: cobrança](https://developers.google.com/maps/documentation/android-sdk/usage-and-billing) · [Route Optimization, frota (afi.io)](https://blog.afi.io/blog/gmpro-google-maps-platform-route-optimization-api/)
- [GraphHopper: preços](https://www.graphhopper.com/pricing/)
- [MapTiler Cloud: preços](https://www.maptiler.com/cloud/pricing/) · [Stadia Maps: preços](https://stadiamaps.com/pricing/)
- [Expo EAS: preços](https://expo.dev/pricing)
- [Hostinger: planos VPS](https://www.hostinger.com/br/servidor-vps) · [Hetzner: backup e snapshots 2026 (Better Stack)](https://betterstack.com/community/guides/web-servers/hetzner-cloud-review/) · [IOF de 3,5% em compra internacional (Wise)](https://wise.com/br/blog/iof-cartao-internacional) · [Registro.br, R$ 40/ano (techub)](https://techub.digital/blog/article/dominio-combr-barato-em-2026-onde-registrar-sem-tomar-susto-na-renovacao)
- [Hetzner: cobrança por hora com teto mensal (Better Stack)](https://betterstack.com/community/guides/web-servers/hetzner-cloud-review/) · [Coolify e Dokploy 2026 (SoloDevStack)](https://solodevstack.com/blog/coolify-vs-dokploy-solo-developers) · [Valhalla: imagem Docker com build de tiles](https://github.com/valhalla/valhalla/blob/master/docker/README.md)
- [Firebase Authentication 2026 (Logto)](https://blog.logto.io/firebase-authentication-pricing) · [RevenueCat 2026 (costbench)](https://costbench.com/software/subscription-billing/revenuecat/) · [Cloudflare D1: preços](https://developers.cloudflare.com/d1/platform/pricing/) · [Android Auto Backup](https://developer.android.com/identity/data/autobackup) · [Google Play: exclusão de conta](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en)
- [Mapbox: MAU do Maps SDK](https://docs.mapbox.com/android/maps/guides/pricing/) · [Google: Map ID cobra como Dynamic Maps](https://developers.google.com/maps/documentation/android-sdk/cloud-customization/overview) · [Hetzner: Volume e Object Storage após abril/26 (Better Stack)](https://betterstack.com/community/guides/web-servers/hetzner-cloud-review/)
- [Protomaps: downloads do basemap](https://docs.protomaps.com/basemaps/downloads) · [Nominatim: instalação](https://nominatim.org/release-docs/latest/admin/Installation/) · [Photon](https://github.com/komoot/photon)
- [Hetzner: reajuste de 15/06/26](https://docs.hetzner.com/general/infrastructure-and-availability/price-adjustment/) · [Hetzner: planos](https://www.hetzner.com/cloud/cost-optimized/)
- [Contabo 2026 (bestusavps)](https://bestusavps.com/reviews/contabo/) · [comparativo Hetzner, Vultr, DigitalOcean](https://apicalculators.com/blog/cloud-vps-cost-comparison-2026) · [VPS Brasil 2026 (runzos)](https://runzos.com/vps-brasil-barato-2026/) · [DigitalOcean 2026 (fluence)](https://fluence.ai/blog/digitalocean-droplets-vs-fluence/) · [Amazon Lightsail](https://aws.amazon.com/lightsail/pricing)
- [Oracle Always Free reduzido (InfoQ)](https://www.infoq.com/news/2026/07/oracle-cloud-free-tier-limits/)
- [Render, Railway e Fly.io 2026 (dev.to)](https://dev.to/pavel-hostim/render-vs-railway-vs-flyio-pricing-compared-2026-2e5p) · [Supabase 2026 (makerkit)](https://makerkit.dev/blog/saas/supabase-pricing) · [Firebase: preços](https://firebase.google.com/pricing)
- [Geofabrik: Brasil](https://download.geofabrik.de/south-america/brazil.html) · [Valhalla: memória no build (discussão)](https://github.com/valhalla/valhalla/discussions/3138)
- [Android 15: serviço em primeiro plano e sobreposição](https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start) · [Android 16: Live Updates](https://developer.android.com/about/versions/16/features/progress-centric-notifications) · [iOS: Live Activities interativas](https://bfrearson.github.io/blog/ios-live-activties/)
- [OptimoRoute (upperinc)](https://www.upperinc.com/blog/optimoroute-pricing/) · [Upper (smartroutes)](https://smartroutes.io/blogs/upper-route-planner/) · [Routific (checkthat)](https://checkthat.ai/brands/routific/pricing) · [custos de software de rota 2026 (smartroutes)](https://smartroutes.io/blogs/route-optimization-software-cost/)
