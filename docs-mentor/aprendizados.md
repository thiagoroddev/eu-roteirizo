# Aprendizados do Projeto

> Registro consolidado de aprendizados técnicos, armadilhas operacionais, heurísticas de domínio e descobertas acumuladas nas tarefas do eu-roteirizo.

> **Revisão de 08/09/26:** varredura das tarefas encerradas (SPIKE-001, CHORE-013, CHORE-014, BG-011, CHORE-012, RF-013) e dos rascunhos de `docs-mentor/rascunhos/`, recuperando achados que existiam nos registros mas não tinham chegado aqui. Seções 1 a 6 mantidas e ampliadas; seções 7 a 9 são novas.

---

## 1. Algoritmo de Roteamento e Malha Viária (SPIKE-001 e Análises)

- **A Cobertura por Âncoras Supera o Custo de Conversão**:
  - *Descoberta*: A maior parte do ganho na redução de quilometragem e curvas (-47% de km no teste com 120 paradas em Copacabana) **não** decorre da penalização de curvas no A*, mas da **escolha de âncoras livres por cobertura**. Escolher o ponto de parada do veículo pela quantidade de endereços alcançáveis a pé (raio de caminhada), em vez de criar paradas centradas no primeiro endereço, elimina voltas desnecessárias de moto.
- **Heurística D3 (Ângulo + Via) com Custo Virtual**:
  - *Diretriz*: Penalizar mudanças de via e ângulos de conversão com peso entre 150 m e 400 m reduz drasticamente retornos e conversões em 'U' na rota de entrega.
- **Orçamento de CPU em Aparelhos Móveis**:
  - *Medição*: O cálculo de malha viária para 120 endereços consome ~2,3 s no desktop e ~9 s em celulares (fator 4x). Conclusão: a auto-roteirização não pode recalcular a rota a cada toque ou arrasto de parada. Deve ser uma ação sob demanda (botão com barra de progresso), gerando um roteiro 100% editável.
- **Ilhas de Mão Única e Ruas sem Saída**:
  - *Problema*: Em áreas urbanas densas, cerca de 1 em 46 trechos é uma "ilha de mão única" (é viável entrar de moto, mas para sair até o próximo ponto adjacente exige dar uma volta de quilômetros).
  - *Diretriz*: O algoritmo não deve silenciar nem forçar a moto; a solução real do entregador é estacionar na via principal e realizar a entrega a pé.
- **D1 (nome da via) foi medida e descartada**:
  - *Descoberta*: Das três definições de conversão testadas, contar por **nome da via** mede pior que ângulo e que ângulo+via, e não sai mais barato em CPU. Contar conversão por mudança de nome parece intuitivo e não é: uma mesma via muda de nome sem que o veículo faça curva alguma, e uma bifurcação em ângulo agudo mantém o nome.
- **Não recontar conversões sobre o caminho concatenado**:
  - *Armadilha*: A tentação natural é rodar a busca, concatenar os trechos e depois contar as conversões do percurso final. Isso quebra: os **nós sintéticos do map matching só existem no clone do grafo**, e removê-los para juntar os trechos destrói a adjacência que dá o ângulo.
  - *Diretriz*: A conversão é contada **por trecho, dentro da própria busca**, onde a adjacência ainda é válida.
- **Corpus pequeno não mede nada**:
  - *Descoberta*: A rota L-29, com 12 endereços, produziu variações de -7% a -28% entre as estratégias — inteiramente dentro do ruído. Só com a L-31 (120 endereços sobre o grafo real de Copacabana) o sinal apareceu de forma estável.
  - *Diretriz*: Antes de comparar heurísticas, dimensionar o corpus para que a diferença entre elas seja maior que a variação entre execuções. Um spike com amostra pequena produz números, não resposta.
- **Manter o baseline barato como régua**:
  - *Medição*: O guloso por distância custa 0,2 s contra 2,3 s da busca por conversão. Ele não é só o "algoritmo antigo": é a referência que diz **quanto** o algoritmo caro comprou com o tempo que gastou.
  - *Diretriz*: "Nenhuma busca bater o guloso" era resposta legítima e prevista no plano do spike. Um experimento que só admite um resultado não é experimento.

---

## 2. Rede, OpenStreetMap e Overpass API (TASK-BG-011)

- **Limitações do fetch no Navegador**:
  - *Fato*: Erros de rede (CORS, DNS, offline, firewall) são mascarados pelo navegador como um genérico `TypeError: Failed to fetch`. Não tentar inferir causas de rede inexistentes na interface.
- **Respostas Falsamente Bem-Sucedidas (HTTP 200 com Erro)**:
  - *Problema*: A Overpass API frequentemente responde HTTP 200 com código HTML ou XML de erro (tag `<remark>`), ou com o campo `elements` ausente.
  - *Diretriz*: Nunca assumir sucesso por HTTP 200. Validar se `elements` é um array com dados válidos antes de processar ou gravar no cache.
- **Tratamento de Rate Limit (HTTP 429)**:
  - *Diretriz*: Erros 429 nunca devem disparar retentativa automática imediata. Deve-se respeitar o cabeçalho `Retry-After` ou orientar uma pausa mínima de 30 segundos, prevenindo bloqueio temporário do IP.
- **Degradação Graciosa sem Malha Viária**:
  - *Diretriz*: Se a malha viária estiver indisponível (offline sem cache prévio ou erro no servidor da Overpass), a aplicação não pode travar nem bloquear o entregador. O roteiro permanece intacto e os percursos são exibidos como linhas retas (percursos aproximados), sinalizados com clareza na interface.
- **O JavaScript não distingue; o DevTools distingue**:
  - *Complemento ao item acima*: o `TypeError` genérico é o limite do **JavaScript**, não do navegador. O motivo real existe e está em dois lugares:

    | Onde olhar | Bloqueio de CORS | Falha de rede |
    |---|---|---|
    | Aba **Network** | requisição **com** resposta e cabeçalhos, em vermelho | `(failed)`, **sem** cabeçalhos de resposta |
    | **Console** | `blocked by CORS policy: ...` | `net::ERR_...` |

  - *Diretriz*: diante de falha `network` sem status, a próxima evidência a pedir é sempre o Console do aparelho, não mais uma rodada de instrumentação no app.
- **A causa raiz do BG-011 nunca foi provada — e isso está registrado de propósito**:
  - *Fato*: o Console do PC mostrou `POST /api/interpreter net::ERR_CONNECTION_TIMED_OUT`, ou seja, **a conexão TCP não completou**. As tentativas de ~21,3 s batem com o orçamento de retransmissão de SYN do sistema operacional, o que confirma a leitura por um segundo caminho.
  - *O que isso descarta*: CORS (exige resposta recebida), 429 e fila (são respostas), payload e parse (já medidos na CHORE-006).
  - *O que isso **não** prova*: bloqueio por IP, rota da operadora, IPv6 quebrado ou causa no servidor continuam todos compatíveis com o sintoma.
  - *Armadilha correlata*: em dados móveis o `/api/status` respondeu enquanto o POST do app falhava em 276 ms a 1 s — falha rápida demais para ser timeout de conexão. **É possível que houvesse dois modos de falha distintos sendo tratados como um.** Registrado como aberto.
- **Diagnóstico honesto: categorias, e `null` para o que não foi medido**:
  - *Diretriz*: cada tentativa vira uma entrada com `category` (`ok` · `http` · `timeout` · `network` · `invalid-response` · `overpass` · `cancelled`), status HTTP, tempo até cabeçalhos, tempo de corpo, total e bytes. **Campo não medido é `null`, nunca zero** — um zero inventado vira mentira na leitura do histórico meses depois.
  - *Origem do problema*: as amostras antigas gravavam `networkMs`/`responseKb` **zerados por convenção**, sem status nem categoria, e por isso não permitiram diagnosticar as falhas do M35.
- **Versionar o formato do diagnóstico**:
  - *Diretriz*: `GraphDiagnostics.version: 1` permite mudar a estrutura sem perder a leitura das amostras já gravadas. Formato de telemetria é contrato, e contrato se versiona na v1, não na v2.
- **`elements: []` válido não é a mesma coisa que `elements` ausente**:
  - *Diretriz*: área sem vias navegáveis é resposta legítima e **pode** virar cache; payload sem `elements` ou com elementos malformados é resposta inválida e **nunca** vira cache. O código antigo fazia `data.elements ?? []` e apagava essa diferença, gravando um grafo vazio válido por 7 dias.
  - *Validação adotada*: cada elemento precisa ser `way`, com `nodes` e `geometry` como arrays de **mesmo comprimento** e coordenadas finitas.
- **`Retry-After` honrado, mas com teto**:
  - *Diretriz*: se o servidor pedir uma espera maior que o teto (`RETRY_MAX_MS`), o app **para e informa**, em vez de congelar o usuário pelo tempo que o servidor pediu. Respeitar o servidor não pode significar sequestrar a interface.
- **Cancelamento é parte do contrato de rede**:
  - *Diretriz*: `AbortController` interrompe requisição **e a espera entre tentativas**; o listener é removido no `finally`; e resposta obsoleta não pode substituir estado atual quando o usuário já trocou de rota.

---

## 3. Infraestrutura Cloudflare e Map Tiles (TASK-CHORE-013, TASK-CHORE-014, TASK-BG-011)

- **Deploy Inicial no Cloudflare Pages**:
  - *Armadilha*: Ao criar um projeto no Cloudflare Pages, o primeiro deploy deve apontar explicitamente para o branch de produção (`--branch=main`). Deploys a partir de branches secundárias geram apenas URLs de prévia (`<branch>.<projeto>.pages.dev`) e deixam a raiz do projeto retornando HTTP 404.
- **Testes Unitários de Integração de Infraestrutura**:
  - *Diretriz*: Endpoints críticos (como o worker de proxy de tiles) devem ter suas URLs asseguradas por testes unitários (`RouteMap.test.tsx`), garantindo que migrações ou trocas de workers não causem divergências silenciosas no mapa.
- **Verificar a infraestrutura nova ANTES de apontar o código para ela**:
  - *Prática que funcionou*: na CHORE-014, o endpoint novo foi conferido por requisição direta (`/tiles/14/4934/9698.png` → HTTP 200, PNG de 6,9 KB) e o antigo conferido como 404 **antes** de qualquer edição em `RouteMap.tsx`. Assim, um teste vermelho depois disso é do código, não da infra.
- **Excluir um projeto do Pages apaga o histórico junto**:
  - *Armadilha*: a exclusão de `eu-roteirizo-prototipo` levou consigo todos os deployments históricos, **incluindo a prévia usada para validar a BG-011**. Evidência hospedada em ambiente descartável tem prazo de validade.
  - *Diretriz*: evidência que sustenta um achado vai para o registro da tarefa (JSON versionado), não fica apenas como URL de prévia.
- **O Worker está versionado, mas o Git não é a fonte da verdade dele**:
  - *Armadilha*: `infra/cloudflare-tile-worker/worker.js` está no repositório, mas **não existe `wrangler.toml` nem `wrangler.jsonc`** e o deploy é feito pelo painel. O próprio README avisa que "editar aqui não muda o que está no ar". Não há nada que garanta que o arquivo versionado é o que está executando.
  - *Diretriz proposta*: um `wrangler.jsonc` com `name`, `main` e `compatibility_date`, mais um script `deploy:worker`, devolve o Git à condição de fonte da verdade — e o `compatibility_date` congela o runtime na data escolhida, evitando que uma atualização da plataforma mude o comportamento sem aviso.
- **O proxy resolveu por mudar o caminho de rede; o CORS entrou como consequência**:
  - *Fato*: o `withCors` do Worker é necessário porque `*.workers.dev` e `*.pages.dev` são **origens diferentes** — o proxy criou um problema de origem que antes não existia. O que curou o incidente foi a rota (borda da Cloudflare → espelhos oficiais com fallback), não a liberação de CORS.
  - *Armadilha de documentação*: o comentário em `osm.ts` diz "para contornar CORS e instabilidade de endpoint público". A segunda metade tem evidência; a primeira não. Comentário deve registrar **causa comprovada**, senão ele desvia a próxima investigação.
- **A tolerância a falha mora no proxy, não no cliente**:
  - *Diretriz*: o laço sobre `upstreams` guarda a resposta com erro HTTP em `lastResponse` e continua; só a exceção vai para `lastError`. Assim, se **algum** espelho respondeu, o status real chega ao app; o `504` próprio do Worker só aparece quando **nenhum** respondeu. Um proxy que achata os erros de todos os destinos em um só destrói o diagnóstico do cliente.

---

## 4. Persistência e Armazenamento Local (TASK-RF-013)

- **Idempotência Obrigatória em Importações (Upsert Incondicional)**:
  - *Problema*: Guardas ingênuas de existência (`if (!existingManifest) save()`) impedem que reimportações do mesmo arquivo atualizem o banco local, congelando dados antigos.
  - *Diretriz*: Importações de arquivos devem sempre sobrescrever de forma limpa colunas, linhas e metadados no IndexedDB.
- **Auto-Recuperação no Carregamento (`loadManifest`)**:
  - *Diretriz*: O hook de carregamento de romaneios deve ser resiliente: se encontrar registros legados com colunas vazias, deve derivá-las dinamicamente das linhas salvas ou dos bytes brutos do arquivo JSON.
- **Arquivo importado é superfície de ataque**:
  - *Diretriz*: a importação valida contra `ROUTE_EXPORT_SCHEMA_V1` de forma estrita antes de tocar no IndexedDB. Um JSON que o usuário recebeu por WhatsApp entra no app com o mesmo grau de confiança de um upload anônimo — nenhum.
- **Versionar o contrato já na v1**:
  - *Diretriz*: o payload declara `schema: "eu-roteirizo/roteiro/v1"`. O custo de carregar um identificador de versão desde o primeiro dia é uma linha; o custo de descobrir a versão por heurística depois que existem arquivos na mão dos usuários é permanente.
- **Guardar a verdade primária, calcular o resto**:
  - *Diretriz*: o JSON guarda coordenadas do veículo (`vehicleStop`), lista de entregas (`pointIds`), ordem e configurações. Quilometragem, tempo estimado e metragem do circuito a pé **não** são gravados: são recalculados sob demanda por `estimates.ts`.
  - *Porquê*: métrica gravada envelhece quando o grafo viário é atualizado ou a velocidade configurada muda, e passa a contradizer a tela. Dado derivável guardado é dado condenado a mentir.

---

## 5. Ambiente de Desenvolvimento e Testes (TASK-RF-013, TASK-CHORE-012, SPIKE-001)

- **Conflito de Portas e Processos Órfãos do Vite**:
  - *Armadilha*: Ao reiniciar servidores em background, processos zumbis do Node segurando a porta padrão (`5173`) fazem o Vite subir silenciosamente na porta seguinte (`5174`). Se o navegador permanecer na `5173`, o usuário testa uma versão antiga congelada em cache ("nada mudou").
  - *Diretriz*: Antes de homologar testes no navegador, verificar ativamente a porta em escuta e encerrar processos órfãos.
- **Polyfills e Mocks de Arquivo em Testes Unitários**:
  - *Armadilha*: No jsdom/Vitest, `Blob.prototype.text` e `URL.createObjectURL` exigem polyfills no `setupTests.ts` para testar upload/download de arquivos.
  - *Diretriz*: Em mocks de teste de arquivos, nunca alocar arrays reais de 10 MB em memória; definir propriedades virtuais para evitar estouro de memória e lentidão na suíte.
- **Chunk Size no Build**:
  - *Atenção*: Chunks de produção (`vendor` e `index`) ultrapassam 500 kB, indicando a necessidade de code-splitting dinâmico com `import()` em funcionalidades pesadas.
- **O Vitest decide watch × passada única pelo TTY, não pela variável `CI`**:
  - *Hipótese levantada e derrubada*: como `package.json` define `"test": "vitest"` sem o subcomando `run`, concluiu-se **por leitura** que o gate abriria watch mode e ficaria pendurado.
  - *Medição*: reproduzindo o que o gate faz de verdade — `spawnSync` com stdio em pipe, sem TTY e sem `CI` — o comando saiu com `status 0` em 145 s, 777 testes, resumo presente e nenhum "Waiting for file changes".
  - *Aprendizado duplo*: (a) o watch existe só quando um humano digita o comando num terminal com TTY; (b) **hipótese levantada por leitura de configuração não vale como achado até ser medida** — e o registro de tê-la testado e descartado vale mais que o conserto que não era necessário.
- **`globPatterns` do service worker engole arquivos que o app não usa**:
  - *Armadilha*: o padrão `**/*.xlsx` do `vite-plugin-pwa` puxou o `exemplo-rota-grande.xlsx` (104 KB, corpus de medição do SPIKE-001 que **nenhuma tela carrega**) para dentro do precache. Todo usuário baixaria 104 KB a mais na primeira carga por um arquivo inútil para ele. Confirmado no `dist/sw.js`.
  - *Diretriz*: `globIgnores` explícito para artefatos de medição e corpus; e conferir o `sw.js` gerado depois de acrescentar qualquer arquivo em `public/`. O precache é opt-out, não opt-in.
- **O registrador de gates recorta saída longa**:
  - *Armadilha*: a saída dos testes foi truncada e **perdeu o resumo numérico**; sobraram casos executados e warnings de `act`. Por isso a CHORE-012 não atribuiu contagem de testes àquela execução.
  - *Diretriz*: quando a evidência é a saída de um comando, conferir se o trecho preservado contém a linha que sustenta a afirmação. Saída truncada não prova o que estava no pedaço cortado.
- **Vulnerabilidades transitivas conhecidas e não corrigidas**:
  - *Estado*: `npm audit` sai com código 1 — uma moderada (`@humanfs/node`, GHSA-p498-v437-472g) e uma baixa (`esbuild`, GHSA-g7r4-m6w7-qqqr), ambas transitivas e com `fixAvailable=true`. Nenhuma dependência foi alterada.
  - *Diretriz*: registrado como pendência aberta, não como conformidade. Exit 1 no audit é estado conhecido do projeto, não ruído a ignorar.

---

## 6. Modelagem de Domínio e Interface (TASK-RF-013)

- **Paridade de Modelo: Roteiro Exportado é um Romaneio Completo**:
  - *Lição Central*: Exportar um roteiro não deve gerar uma "rota cega/avulsa" com componentes paralelos segregados. O JSON deve carregar as linhas da planilha (`rows`), mapeamento (`routes`), colunas (`availableCols`), código AT (`meta.at`) e plano de paradas (`route`). Isso garante paridade total com planilhas `.xlsx`/`.csv` e reaproveita 100% da interface existente sem duplicação de código.
- **Semântica Contextual das Tabelas no Sumário**:
  - *Diretriz*: "Tabela Original" só deve ser exibida em modo Original (ordem da planilha enviada). Em modo Meu Roteiro, a tabela padrão deve ser a "Tabela Simplificada", ordenada pela **nova sequência das paradas planejadas** (1..N).
- **A armadilha do raio circular cego**:
  - *Problema*: o raio é euclidiano — ele atravessa muros, quarteirões e prédios. Um raio de 60 m alcança as costas de um edifício na rua de trás, onde não há passagem a pé. Aumentar o stepper para incluir um endereço distante **na mesma calçada** acaba engolindo um endereço da outra rua, que o entregador pretendia atender depois, no sentido correto do trânsito.
  - *Mitigação atual*: os botões `+` / `-` por item em `StopItemList.tsx` permitem inclusão manual seletiva sem inflar o raio.
  - *Diretriz para a auto-roteirização*: agrupar por **distância real na calçada (grafo de pedestre)** ou por mesmo segmento viário, e não por raio circular. O círculo é um controle de interface aceitável; é um critério de agrupamento ruim.

---

## 7. Heurísticas do Entregador e Auto-Roteirização (rascunho de 07/09/26, TASK-RF-029)

> Origem: análise conjunta com o entregador sobre o caso Ipanema/Lagoa e o roteiro real de 56 endereços.

- **Machine Learning é a ferramenta errada para este problema**:
  - *Restrições rígidas × aproximador estatístico*: a malha viária é um grafo exato — uma via é mão única ou não é. Modelos estatísticos não garantem restrição rígida e "alucinam" contramão porque o destino "parece perto".
  - *Escassez de dados*: generalizar da Lagoa para a Tijuca ou Campo Grande exigiria dezenas de milhares de rotas anotadas. Com exemplos pontuais, o resultado é overfitting imediato.
  - *Orçamento do aparelho*: TensorFlow.js ou ONNX somam megabytes ao bundle e consomem CPU e bateria num celular que já trabalha ao sol, contra a diretriz de PWA offline-first.
  - *Explicabilidade*: com pesos declarados dá para dizer "escolheu a Alberto de Campos porque economizou 3,3 km de carro ao custo de 40 m a pé". Uma caixa-preta de pesos não permite nem depurar nem ajustar.
  - *Conclusão*: heurística de grafo + lookahead bi-critério reproduzem o raciocínio do entregador com custo e auditabilidade que o ML não oferece aqui.
- **Âncoras candidatas multivias**:
  - *Diretriz*: ao ancorar uma entrega, **não** considerar apenas a via onde a coordenada caiu por projeção. Buscar todas as vias trafegáveis dentro do raio de caminhada viável (50 a 100 m) e gerar um candidato por via.
  - *Caso real*: o Posto Ipiranga na Av. Epitácio Pessoa, 1354 gera dois candidatos — a própria Epitácio (5 m a pé) e a Rua Alberto de Campos (43 m a pé).
- **Lookahead de um passo: o custo de SAIR, não o de chegar**:
  - *Problema*: o algoritmo ingênuo escolhe a Epitácio porque a caminhada é de 5 m contra 43 m.
  - *Medição do caso real*: sair da Epitácio para a parada seguinte custa **3,4 km** (canteiro central, sentido, contorno de quarteirões); sair da Alberto de Campos custa **64 m**.
  - *Diretriz*: avaliar a âncora pelo impacto na **transição para o próximo aglomerado**, não só pela distância a pé até a entrega atual. O entregador andou 43 m para economizar 3.336 m dirigindo e 8 a 12 minutos de trânsito.
- **Função de custo bi-critério, com peso configurável por tipo de veículo**:
  - *Forma*: `custo = (metros de carro × W_carro) + (conversões/retornos × W_retorno) + (metros a pé × W_pé)`.
  - *No caso real*: Epitácio ≈ 3.410 contra Alberto de Campos = 150. A escolha certa sai com folga esmagadora, sem nenhuma inteligência além de aritmética.
  - *Requisito de produto*: o trade-off **não tem resposta única**. Moto ou a pé prefere andar 80 m para não dar 2 km de volta; van ou carro com carga pesada prefere rodar mais e parar na porta. `DeliverySettings` precisa expor `W_veículo` × `W_pedestre` e o raio máximo de caminhada.
- **Varredura por corredores (*corridor sweeping* / *spine routing*)**:
  - *Descoberta*: o entregador não ziguezagueia entrando e saindo de transversais. Ele define um "espinhaço" contínuo por vias arteriais (Vieira Souto → Prudente de Morais → Visconde de Pirajá → Barão da Torre → Redentor) e atende as transversais a pé a partir do veículo estacionado nesse corredor.
  - *Diretriz*: o veículo quase não faz curvas de 90° para ruas estreitas. Uma busca que minimize conversões passando **próximo** das entregas pelas vias principais chega ao mesmo resultado que o humano — que é exatamente o que o SPIKE-001 mediu por outro caminho.
- **Escolha da primeira parada**:
  - *Formalização*: o veículo parte de uma origem (hub ou GPS) com um vetor de aproximação ao bairro. A primeira parada deve ser aquela cuja âncora de entrada minimize o percurso inicial e as conversões de entrada, **sem exigir retorno logo no começo do circuito**.
- **Gabarito de ouro disponível**:
  - *Ativo*: o roteiro real de Ipanema — 56 endereços, 83 pacotes, 28 paradas, 10,0 km, ~3h10 — montado à mão pelo entregador e preservado em `docs-mentor/rascunhos/roteiro-real-ipanema-56.json`.
  - *Uso*: é o caso de teste para comparar a saída das fatias da RF-029 contra a decisão humana. Um motor que produza um roteiro pior que esse não está pronto, e um que produza melhor precisa explicar por quê.

---

## 8. Bugs e Pendências Conhecidos (ainda abertos)

> Registrados aqui porque foram descobertos durante outras tarefas e não têm tarefa própria fechada. Nenhum destes é conjectura: todos foram observados no código ou no aparelho.

- **A bbox do grafo ignora o ponto de partida** — `src/hooks/useRoadGraph.ts:52`:
  - *Código atual*: `const bbox = bboxFromPoints(points, BBOX_MARGIN_METERS);` com margem de 300 m.
  - *Efeito*: o `startPoint` (onde o veículo começa) **não entra no cálculo**. Se o veículo parte a mais de 300 m da borda das entregas, o nó inicial fica fora do grafo baixado, o A* não acha caminho e o fallback traça a linha reta euclidiana — que é exatamente o "corte de quarteirões em diagonal" visto entre o início e a Parada 1 no roteiro de Ipanema.
  - *Correção proposta*: `bboxFromPoints(startPoint ? [startPoint, ...points] : points, BBOX_MARGIN_METERS)`.
- **Tiles só aparecem ao terminar o arraste** — `src/components/RouteMap.tsx:290`:
  - *Causa*: `updateWhenIdle: true`, consistente com o relato do Samsung M35. Mudar para atualização durante o movimento exige medir fluidez no aparelho antes; não implementado.
- **Cobertura offline dos tiles é reuso de cache, não pacote offline**:
  - *Fato*: no M35, só os tiles e zooms já visitados ficam disponíveis, reutilizados entre romaneios. Isso evidencia cache funcionando, **não** armazenamento garantido nem cobertura por área.
  - *Bloqueio na proposta de "baixar a área de entrega"*: o Worker atual serve `tile.openstreetmap.org`, cuja política **proíbe prefetch e download por área**. Implementar download antecipado exige antes uma fonte que o permita — é escopo separado, não um ajuste de cache.
- **Chunks acima de 500 kB** (512,36 e 803,48 kB): o build conclui, mas o aviso não comprova desempenho aceitável de carregamento. A meta de latência no aparelho continua **sem medição**.
- **Rastreabilidade legada incompleta**: o RF-35 ainda aparece como planejado em `docs/requisitos/funcionais.md` apesar da persistência implementada em `routeStorage` e da TASK-RF-008 concluída. A reconciliação completa do legado segue pendente.
- **Sem `wrangler.jsonc`** para o Worker (ver §3).
- **Duas vulnerabilidades transitivas** com correção disponível e não aplicada (ver §5).

---

## 9. Método: Evidência, Diagnóstico e Disciplina de Registro

> Aprendizados sobre **como** o projeto conclui coisas. Vieram principalmente da CHORE-012 e da BG-011, e são os que mais se repetem.

- **Ausência de aviso não é conformidade**:
  - *Caso*: o `doctor` não acusava nada sobre segurança do repositório. A consulta autenticada ao GitHub mostrou `vulnerability-alerts` retornando 404 com mensagem explícita de desativação e `automated-security-fixes` com `enabled=false`. Estavam **desligados**, e o silêncio da ferramenta foi lido como "está tudo bem".
  - *Diretriz*: item não verificado é pendente, não aprovado. Ferramenta que não olha para algo não atesta esse algo.
- **Teste automatizado não é validação em aparelho**:
  - *Diretriz*: suíte verde prova que o código faz o que o teste descreve. Não prova que o mapa carrega no Samsung M35 sob sol, com Wi-Fi ruim, em 4G ou offline. As duas evidências não se substituem, e sete ressalvas não somam uma conformidade.
- **Não inventar métrica de rastreabilidade**:
  - *Caso*: a contagem "44/49 requisitos" não era sustentada pelo legado e foi **removida sem substituir por outro percentual**. Número plausível e não auditável é pior que a ausência dele, porque encerra a pergunta.
- **Sintoma coincidente não prova causa comum**:
  - *Caso*: a malha falhava no M35 e no PC. Isso foi registrado explicitamente como **não** sendo evidência de mesma causa técnica. A comparação se faz pelos dados — tempos, status, mensagem, rede — não pela impressão de que "é o mesmo problema".
- **Separar o que apareceu junto do que está ligado**:
  - *Caso*: avisos de preload, service worker e `runtime.lastError` estavam no mesmo Console do timeout. Foram registrados **separados**, sem presumir nexo causal. Console é uma linha do tempo, não uma cadeia causal.
- **O comentário no código deve registrar a causa comprovada**:
  - *Caso*: ver §3. Um comentário que atribui a causa errada custa horas de quem investigar a próxima falha, e sobrevive muito mais tempo que a memória de quem o escreveu.
- **Uma solução que muda várias variáveis de uma vez cura sem ensinar**:
  - *Caso*: o proxy alterou IP de saída, rota, servidor de destino e política de retentativa simultaneamente. Funcionou — e deixou a causa desconhecida. Isso é aceitável sob pressão de incidente, desde que fique **registrado como aberto**, porque a causa não tratada volta em outra escala: se for bloqueio por insistência, ela reaparece quando o Worker concentrar o tráfego de todos os usuários sob um único IP.
- **Evidência mora no registro versionado, não no ambiente**:
  - *Caso*: a prévia que validou a BG-011 desapareceu junto com o projeto Pages antigo. Arquivos em `.mentor-saidas/` e URLs de prévia são complemento local; o que sustenta um achado vai para o JSON da tarefa, que é versionado.

---

## Fontes desta revisão

- Tarefas encerradas: `TASK-SPIKE-001`, `TASK-CHORE-013`, `TASK-CHORE-014`, `TASK-BG-011`, `TASK-CHORE-012`, `TASK-RF-013` (JSONs e narrativas em `docs-mentor/tarefas/concluidas/`).
- Rascunhos: `2026-09-01--gate-de-testes-declarado-como-npm-run-te.md`, `2026-09-07--analise-raciocinio-entregador-ancora-vs-ml.md`, `2026-09-01-malha-viaria-paga.md`, `roteiro-real-ipanema-56.json`.
- Código conferido: `src/utils/routing/osm.ts`, `src/hooks/useRoadGraph.ts`, `src/components/RouteMap.tsx`, `src/constants/uiLabels.ts`, `infra/cloudflare-tile-worker/worker.js`, `vite.config.ts`, `package.json`.
- Documentos: `docs/arquitetura/ADR/ADR-007.md`, `ADR-010.md`, `docs/rascunhos/plano-infraestrutura-e-custos.md`, `docs/requisitos/nao-funcionais.md`.
