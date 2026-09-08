Primeiro: separar três "custos de servidor" que o plano trata juntos

Sua pergunta é sobre a malha viária. O plano mistura ela com outros dois, e isso confunde a decisão:

Necessidade	Modelo de custo	Status
Malha viária (substituir Overpass)	por área publicada	⚠️ DT-005, bloqueia o 1º release
Geocoding da âncora	por chamada	🔭 RF-006.9, já resolvido (OpenCage, §7.3)
Validação de assinatura	I/O puro	🔭 DT-002, cabe em Worker+D1

Os dois últimos já têm resposta boa no plano. Vou tratar só da malha.

O que está descartado antes de começar: API de roteirização paga

Vale matar essa opção com número, porque ela parece a saída óbvia de quem lê "vou ter que pagar".

Seu app precisa de uma matriz de distâncias entre ~120 paradas para ordenar o roteiro. Na GraphHopper, o custo de uma matriz é min(origens × destinos / 2, max(origens,destinos) × 10) → para 120 paradas, 1.200 créditos por roteiro.

Plano GraphHopper	Créditos/dia	Roteiros/dia	Custo
Free	500	nem 1	€ 0
Basic	5.000	4	€ 69/mês
Premium	50.000	41	€ 479/mês

€ 479/mês para atender 41 entregadores dá ~€ 11,70 por usuário/mês. Você cobra R$ 5.

O ponto não é "é caro". É que inverte o modelo de custo: seu custo hoje cresce com o número de áreas; com API paga passa a crescer com usuários × recálculos. E o entregador reordena o roteiro várias vezes por dia. A ADR-002 estava certa, e continua certa.

As opções reais para a malha
1️⃣ Overpass hospedado com chave e capacidade contratada

O plano não avaliou isso — só considerou "mirror comunitário" (descartado, com razão). Mas existe serviço comercial: o Overspan vende Overpass gerenciado, planeta completo, atualização por minuto, acesso por chave que funciona de IP de nuvem:

Tier	Preço	Req/mês	Req/min
Indie	US$ 19	50.000	60
Pro	US$ 69	250.000	300

Com seu padrão de uso (1 carga por área a cada 7 dias, ~5 cargas/mês por entregador), 50.000 requisições cobrem ~10.000 ativos.

✅	❌
Zero engenharia: troca uma constante no osm.ts	Fornecedor pequeno, sem histórico longo
Remove o DT-005 imediatamente	Permissão de cache não está nos termos — precisa exigir por escrito, igual você fez com o Geoapify
~US$ 19/mês até ~10 mil ativos	Continua sendo dependência de terceiro
Mantém offline (você cacheia 7 dias)	Sem SLA de uptime publicado
2️⃣ Dataset próprio no R2 servido pelo Worker (a decisão da ADR-010)

Refiz a conta com o seu número medido (89 KB/km², CHORE-006):

Área urbanizada do Brasil ≈ 50.000 km²   ← estimativa minha, não medida
50.000 km² × 89 KB          = 4,45 GB não comprimido
comprimido (gzip ~5×)       ≈ 0,9 GB

Cabe inteiro no free tier de 10 GB. E mesmo se eu estiver errado por 10× (9 GB comprimidos), o custo é US$ 0,015 × 9 ≈ US$ 0,14/mês.

Leituras: 10.000 ativos × 5 cargas/mês × ~5 objetos = 250 mil Class B. O free tier são 10 milhões. Você só começa a pagar leitura perto de 500 mil usuários ativos.

✅	❌
R$ 0/mês de forma realista, por anos	Pipeline de build para construir e manter
Sem fornecedor, sem rate limit, sem SLA de ninguém	Semanas do seu tempo — o recurso mais escasso
Offline garantido por construção	Risco de correção geométrica (costura de bordas)
Atualização trimestral controlada por você	Você vira distribuidor de derivado ODbL
3️⃣ Overpass self-hosted em VPS

~R$ 81–122/mês fixo + banco pesado + diffs por minuto + tempo de operação, para atender uma única forma de query. O plano já rejeitou e eu concordo: é operar um canhão para matar mosquito. Fica só como registro.

4️⃣ Extrato embutido no PWA

Descartado corretamente na ADR-010: o entregador baixaria o país para entregar em três quarteirões.

💡 A simplificação que corta o custo da opção 2 pela metade

Esse é o achado que eu levaria de volta para a ADR-010.

A ADR diz "PMTiles porque MVT não carrega node ID e recorta feições na borda" — e conclui que precisa empacotar payload próprio dentro do contêiner PMTiles. Está certo no diagnóstico, mas o PMTiles é opcional.

PMTiles existe para resolver "um basemap mundial z0–z15 são milhões de arquivos". Para a malha viária você publica só as células onde tem usuário, e o R2 não cobra por objeto armazenado — cobra por operação. Então:

roads/v3/z12/1234/5678.json.gz   ← ways INTEIROS, com node IDs OSM

Uma via que cruza duas células entra inteira nas duas. Você deduplica por way ID ao carregar. Custa uns 15% de duplicação de bytes — que é irrelevante quando o total são centavos — e elimina completamente o problema de costura de borda, que a própria ADR-010 aponta como "o componente mais crítico do produto (mão única e traçado)".

Isso troca "escrever um empacotador PMTiles + resolver reconstrução de junções" por "osmium tags-filter + um script que agrupa ways por célula + wrangler r2 object put". Dá para fazer em dias, não semanas.

⚠️ Isso é uma sugestão de desenho, não um teste. Precisa de uma spike medindo o tamanho real por célula e a taxa de duplicação antes de virar decisão.

O caminho que eu proporia

O plano identificou em §11 o achado mais importante do documento: "o custo fixo é o inimigo do começo, não o variável". Isso deve governar a escolha aqui.

Fase	Quando	O quê	Custo/mês	Seu tempo
0 — hoje	agora	Worker proxy + cache 7 dias (já no ar)	R$ 0	0
1 — antes do 1º release	quando publicar na Play	Overpass hospedado com chave	~US$ 19	~1 hora
2 — com tração	~1.000 ativos ou 1º sinal de limite	Dataset próprio no R2 (opção 2 simplificada)	~R$ 0	~1 semana

O raciocínio: a Fase 1 compra a remoção do DT-005 — que hoje bloqueia o release — por um custo fixo pequeno, sem gastar as semanas de engenharia. A Fase 2 elimina até esse custo, mas só faz sentido depois de existir alguém usando. Construir o pipeline agora é investir seu recurso mais escasso num problema que 300 usuários não têm.

E as duas fases são compatíveis: o osm.ts já isola o endpoint numa constante e o FetchRoadGraphOptions.endpoint já existe para teste. A transição da Fase 1 para a 2 muda o formato do payload, não a arquitetura.

O que precisa ser verificado antes de contratar qualquer coisa

Aplicando os seus próprios critérios do §4.2.1:

Permissão de cache do Overspan, por escrito. O site não menciona. Sem isso, não contrate — foi exatamente o motivo de você descartar o Geoapify.
ODbL na Fase 2. Publicando seu próprio tileset você distribui um derivado do OSM: atribuição obrigatória e share-alike sobre o banco derivado. Isso não impede nada, mas é uma cláusula que precisa estar no app e na loja.
Área urbanizada real do Brasil. Meus 50.000 km² são estimativa. Um osmium tags-filter no brazil-latest.osm.pbf te dá o número verdadeiro em uma tarde.
Câmbio. Todos os valores acima em US$/€; o plano declara câmbio, esta resposta não — refaça na data da decisão.
A causa do BG-011 continua desconhecida. Se for bloqueio por IP por insistência, ela reaparece na Fase 1 sob um único IP de saída servindo todos os usuários — e aí pega todo mundo de uma vez.