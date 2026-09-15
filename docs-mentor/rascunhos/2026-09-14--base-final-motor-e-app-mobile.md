# Base final — protótipos do motor e futuro app mobile

Status: base consolidada para planejar, não autorização de implementação. Corrige o [levantamento anterior](./2026-09-14--ferramentas-app-mobile-roteirizacao.md) e o [plano enxuto](./2026-09-13--plano-enxuto-motor-de-rotas.md), preservados como histórico. Preferências definidas; estratégias técnicas propostas para os protótipos. Não altera código ou ADRs do PWA.

## Preferências e limites definidos

- **React Native + TypeScript** no produto mobile; **Node.js + TypeScript** no backend. Não reabrir comparação com Flutter, MAUI ou outras stacks.
- **MapLibre + vector tiles do Protomaps em PMTiles** para o mapa visual.
- **Uma base viária compartilhada** para veículo e caminhada curta, sem contratar ou manter uma segunda malha especializada de pedestres.
- **Motor primeiro:** obter qualidade representativa e então medir o custo real no celular. O restante do produto depende desse resultado.
- **Offline completo não é requisito.** Cálculo local pode coexistir com mapas online e backend.
- Priorizar código aberto e gratuidade compatível com uso comercial. Considerar manutenção no custo total; biblioteca gratuita não significa hospedagem ilimitada grátis.

## Parte A — motor de roteirização e protótipos

### A1. Contrato do produto

- **Origem/fim obrigatórios:** agora = localização pontual confirmável; depois = ponto marcado. Circular retorna à origem; caso contrário, destino marcado. Incluir esses deslocamentos.
- **Três modos:** automático individual; automático agrupado; desenho assistido com agrupamento automático. A rota individual é referência inicial do agrupado, não percurso imutável.
- **Referências distintas:** pin original e fundamental na via preservados; parada do veículo editável, com coordenada e endereço próprios, inclusive em outra rua.
- Parada padrão junto ao endereço na via. **Não procurar vagas, disponibilidade ou permissão de estacionamento.** Continuar respeitando restrições de circulação do veículo. Aplicar a [regra já registrada](./regra-parada-do-veiculo-sem-busca-de-vagas.md).
- Começar com **r60/c120**: raio de candidatos em torno dos fundamentais; limite do circuito fechado entre veículo e fundamentais. Informar separadamente a caminhada completa, incluindo acessos às entregas.
- Cada entrega deve ser atendida exatamente uma vez ou aparecer explicitamente como pendência. Preservar também todos os pacotes associados. Nunca descartar silenciosamente.

### A2. Uma base de ruas, regras diferentes de percurso

Usar **OpenStreetMap**, recortado da Geofabrik e versionado por experimento. Compartilhar geometrias, conexões e atributos; não duplicar contratação, download ou conjunto principal por modalidade.

- **Veículo:** direção das vias, conversões, conexões e acessos compatíveis com carro/moto.
- **Caminhada:** busca curta pelas mesmas ruas, aproximando a calçada. Mão única de veículos não impõe mão única ao pedestre.
- Respeitar barreiras/acessos conhecidos; não inventar travessias ou conexões entre níveis. Dados insuficientes geram aproximação/pendência editável.
- Sem levantamento especializado de calçadas: o eixo da rua é aproximação, não certificação de acessibilidade. Perfis ainda exigem índices/caches/cálculos, mas não outra base contratada.

**Mapa visual não é grafo roteável:** Protomaps/PMTiles desenha o mapa, mas não substitui conexões e restrições necessárias ao cálculo. Basemap + dados roteáveis têm funções distintas; não são duas malhas de veículo/pedestre. [Protomaps](https://docs.protomaps.com/basemaps/downloads), [PMTiles](https://docs.protomaps.com/pmtiles/).

Preparar recortes no PC com margem para desvios, sem baixar o Brasil inteiro. Caminho ausente exige ampliar/indicar insuficiência, nunca substituir por linha reta.

### A3. Ferramentas e estratégia de construção

**Direção proposta: híbrida — reutilizar caminhos e construir o diferencial de paradas/agrupamento.**

| Peça | Escolha para orientar os protótipos |
| --- | --- |
| Domínio e otimização | TypeScript independente da interface: paradas, grupos, sequência e validação, compartilhado entre Node e React Native por adaptadores. |
| Caminhos, matrizes e map matching | **Valhalla aberto como primeira opção.** No PC durante o laboratório; local no Android via C++ e adaptador Kotlin/C++. Dados compartilhados, custos por perfil; não é pacote React Native pronto. |
| Cálculo no celular | **React Native Worklets em runtime dedicado** como candidato para TS; validar integração e transferência de dados. Não usar o runtime de animações/UI. |
| Cálculo em Node | Pool limitado de `worker_threads` para TS; Valhalla por binding ou processo/serviço. `async` sozinho não isola CPU. |
| Solver de referência | **OR-Tools opcional para sequenciamento**, não solução pronta do agrupamento. Adicionar outra dependência somente com benefício demonstrado. |

O suporte documentado não prova desempenho no M35 nem elimina integração: [Valhalla](https://valhalla.github.io/valhalla/), [Worklets](https://docs.swmansion.com/react-native-worklets/docs/threading/createWorkletRuntime/), [Node workers](https://nodejs.org/api/worker_threads.html).

Alternativas: **grafo compacto + A*/Dijkstra próprios em TS** facilita controle, mas exige manter importação OSM, conversões e projeções; considerar se integrar Valhalla não compensar. **API gerenciada** reduz operação, mas cobra pelo uso e não resolve o domínio completo; fora do caminho inicial. Não implementar alternativas em paralelo.

OR-Tools não tem interface oficial Node; eventual componente especializado não exige trocar o backend. [Interfaces oficiais](https://developers.google.com/optimization/install).

### A4. Métodos do motor

**Caminhos.** Associar parada ao segmento/posição exata, não ao cruzamento mais próximo. Validar orientação e conversões entre trechos. Separar metros, tempo e custo de busca; cache por malha/perfil/objetivo/estado. Consultas em lote e buscas locais limitadas para caminhada.

**Individual — TSP dirigido com extremos fixos.** Inserção de menor incremento, realocação e troca de paradas, recalculando custos dirigidos; não pressupor distâncias simétricas. Otimizar primeira entrega/sequência, sem repetir todas as origens possíveis.

**Agrupado — relacionado a Park-and-Loop.** Partir do individual; propor fusão, divisão, transferência, mudança de âncora e reordenação. Cada candidato contém **parada + entregas + circuito fechado válido + custos**. Avaliar chegada/caminhada/saída, remover visitas veiculares dispensadas e reotimizar. Ordem a pé: enumeração/programação dinâmica em grupos pequenos; inserção/melhoria local nos maiores. Manter o individual como alternativa viável.

Locais alternativos **não bastam**: circuitos individuais de 90 m podem formar um conjunto de 180 m, violando c120. Cobertura mínima não garante circuito válido nem melhor roteiro; não descartar entregas por penalidade. [Disjunções do OR-Tools](https://developers.google.com/optimization/routing/penalties).

**Objetivo proposto:** cobertura/circulação/c120 válidos, menor distância veicular; desempate por menor caminhada completa e preservação da parada padrão. Respeitar edições fixadas; justificar mudanças, nunca deslocar por ID. Tempo modelado apenas como métrica. LNS/ALNS só se melhorias locais corretas forem insuficientes.

**Desenho.** Capturar/simplificar trechos e encaixar nas vias dirigidas. O app trata ambiguidades, contramão e desvios, com prévia/desfazer; map matching não faz isso sozinho. Reutilizar agrupamento: entrar no raio gera candidato, não cobertura automática. Preservar traçado e ordem das passagens. [Map matching](https://valhalla.github.io/valhalla/api/map-matching/).

### A5. Ordem das próximas tarefas e evidências

1. **Contrato/base:** congelar dois romaneios, extremos e malha; validar caminhos/paradas. Preparar interfaces e integração mobile durante a construção, sem concluir desempenho antecipadamente.
2. **Individual decente:** melhorar sequência e explicar diferenças frente ao roteiro humano, nas mesmas condições.
3. **Agrupamento decente:** validar circuitos e reproduzir caminhadas que evitam entrar numa rua, sem mover paradas injustificadamente.
4. **Desenho:** tela mínima de laboratório com gesto, encaixe, agrupamento, correção e persistência; sem construir o restante do produto.
5. **Motor representativo pronto → medir no Samsung M35:** build de produção, volume operacional de 80–150 entregas, distinguindo endereços únicos de pacotes. Meta **5–10 s**; registrar repetições/picos, memória, aquecimento e responsividade.

Separar download/preparo, carregamento, matrizes, otimização e espera total; distinguir execução fria/aquecida. Medir também resposta ao desenho: a meta completa não autoriza congelar cada gesto por 10 s. **Não decidir viabilidade do celular medindo o algoritmo ruim atual.**

**Régua:** cobertura completa, circulação/c120 válidos, parada independente preservada e qualidade aprovada visualmente contra a referência humana. Comparar distância veicular, caminhada completa e paradas com mesmos extremos/contabilidade. Rapidez não compensa roteiro ruim; não prometer ótimo global.

**Processo:** dois casos reais, microtestes específicos, uma mudança por vez e orçamento de busca limitado. IA transforma exemplos/vídeos em regras, contraexemplos e testes; sem LLM decidindo rotas em execução. Falhas: evidência, causa confirmada ou hipótese, solução e estado.

**Saídas:** um log por execução e melhor JSON por modo/caso, sem arquivo por tentativa. Prefixo da pasta original (1–6): `1-automatico-individual.json`, `1-r60-c120-automatico-agrupado.json`, `1-r60-c120-desenho-assistido.json`. O terceiro é guiado pelo usuário. Validar importação/exportação fiel.

**Se qualidade passar, mas celular falhar:** avaliar execução no servidor com backend Node e módulos reaproveitados; medir CPU, memória, concorrência e custo antes de contratar. Se qualidade falhar, continuar no motor, não na Parte B.

## Parte B — restante do produto, somente após o motor passar

### B1. Composição mínima e econômica

| Parte | Direção |
| --- | --- |
| App | React Native + TypeScript, Android primeiro; Expo com build próprio/dev client, não Expo Go. |
| Mapa visual | MapLibre Native, vector tiles Protomaps/PMTiles, estilo/fontes/sprites compatíveis. Recortes versionados em hospedagem própria, não servidores de demonstração. |
| Arquivos públicos | R2 Standard como primeira opção, dentro da franquia quando possível; considerar disco/banda de VPS já necessária se o total compensar. Basemap e dados roteáveis são públicos; romaneios não. |
| Dados do usuário | SQLite local e exportação/importação. Sem login inicialmente; sincronização/banco remoto só por necessidade concreta. |
| Backend | Node + TypeScript. Postgres se houver persistência remota; PostGIS só para consultas espaciais necessárias. Framework/hospedagem não bloqueiam os protótipos. |

A integração [MapLibre/Expo](https://maplibre.org/maplibre-react-native/docs/setup/expo/) exige build próprio. Suporte nativo a [PMTiles](https://maplibre.org/maplibre-native/android/examples/data/PMTiles/) não significa download offline automático.

R2 Standard tem franquia e saída direta sem egress, mas excedentes de armazenamento/operações cobram. Dimensionar pelo uso medido. [Custos oficiais](https://developers.cloudflare.com/r2/pricing/).

### B2. Execução na rua e limites corrigidos

- **Navegação externa:** abrir Google Maps/Waze na parada do veículo. Deep link não garante seguir o traçado; quilômetros planejados são previsão. Navegação fiel à geometria exigiria outra solução, fora do escopo inicial. [Google Maps URLs](https://developers.google.com/maps/documentation/urls/get-started), [Waze](https://developers.google.com/waze/deeplinks).
- **Janela flutuante Android:** integração nativa/permissão; mesmas ações no app e em notificação autorizada. Validar serviços/background, inclusive permissões negadas; não prometer aprovação automática na loja. Live Updates/iOS depois. [Notificações](https://developer.android.com/develop/ui/compose/notifications/notification-permission), [serviços Android](https://developer.android.com/develop/background-work/services/fgs/service-types).
- **Localização:** sem navegação/GPS contínuo próprios; localização pontual para “iniciar agora” continua necessária, com alternativa manual.
- **Endereços:** coordenadas do romaneio, nomes da base e edição manual; sem geocodificação como dependência. Não exibir Google Geocoding no MapLibre como dados livres. [Políticas](https://developers.google.com/maps/documentation/geocoding/policies).
- **Assinatura paga:** validação segura no servidor/restauração mesmo sem login. Preferir integração direta Play antes de intermediários cobrados. [Verificação](https://developer.android.com/google/play/billing/security).
- **Proteção/recuperação:** romaneios fora de buckets/logs públicos; minimizar retenção. Auto Backup é complementar, não sincronização garantida. Servidor requer backup privado, restauração testada e monitor externo. [Auto Backup](https://developer.android.com/identity/data/autobackup).

### B3. Regra de custo e planejamento

Laboratório no PC e dados regionais, sem contratar APIs, infraestrutura nacional ou planos longos. Loja, hospedagem e manutenção continuam podendo custar; verificar preços na contratação. Distribuição de dados derivados exige atribuição e demais obrigações ODbL. [Licença OSM](https://www.openstreetmap.org/copyright).

Servidor, se necessário: API, cálculo isolado e concorrência limitada, sem Kubernetes/autoscaling obrigatório. Escalar pelo gargalo medido; gratuidade não deve produzir manutenção mais cara.

Reconciliar registros antigos de “PWA”, “sem backend” e “offline obrigatório” ao planejar a implementação. Esta base substitui direções conflitantes dos rascunhos anteriores. **Próximo trabalho: planejar a Parte A; Parte B somente após aprovação do motor.**
