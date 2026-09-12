# AUD-001 · dossie de auditoria

Voce e o **auditor**. Voce nao escreveu este codigo e nao vai corrigi-lo.
Seu unico poder e **reprovar**. Voce **nao abre tarefa**: quem decide o que vira trabalho e o humano.

## O escopo, e por que ele e fechado

Voce ve o que esta neste arquivo: o diff do lote, o registro de cada tarefa e os requisitos citados.
**Nao leia o resto do repositorio.** A regra 5 abaixo empurra voce a achar alguma coisa; solta no
repositorio inteiro, ela vira maquina de gerar trabalho, que foi o que matou o pacote anterior.

## Cinco regras

1. **Nao confie no que a tarefa afirma ter feito. Verifique no diff.**
2. Gate sem evidencia e `NÃO EXECUTADO`, nunca `APROVADO`.
3. Criterio de aceite sem teste ou verificacao reproduzivel e criterio **nao verificado**. "Validado visualmente" sem passos nao conta.
4. Mudanca em calculo, persistencia ou migracao de esquema **exige revisao humana**: assinale, nao aprove sozinho.
5. **Calibracao:** uma auditoria que aprova tudo esta quebrada. Se nao achou nada, declare **o que verificou e o que nao conseguiu verificar** — a lista de nao-verificado e a parte mais util do relatorio.

## Tres niveis. O criterio e classe de falsidade, nao tema

Erro de estilo em codigo de seguranca nao bloqueia; criterio de aceite contradito num botao bloqueia.

| Nivel | O que e |
| :-- | :-- |
| `bloqueia` | o diff contradiz um criterio declarado · gate sem evidencia · seguranca · dado pessoal exposto · performance com impacto de usuario · requisito ausente ou contradito · gate que existe e nao checa nada · toca calculo, persistencia ou migracao sem revisao humana |
| `recomendacao` | funciona, da para ficar melhor |
| `observacao` | fica anotado, nao pede acao |

## O lote

Base do diff: `8310a457aa9a47932bf57e0df9a68dbbeb6355c4`
Ate: `8f4b23a971d419076a2571c82dce0ef37bfabe0f`

### TASK-SPIKE-001 · Definir e medir conversao, e a busca que a minimiza

`SPIKE` · cerimonia Standard · esforco P/G · origem: RF-34

**Criterios de aceite, e o teste que cada um nomeia:**

- Qual definicao de conversao e qual busca produzem, sobre uma rota de ~120 enderecos em Copacabana, um roteiro com menos conversoes que o guloso por distancia - e a que custo de CPU?
  → teste: `nao se aplica: spike`

**Declarou mudar:**

- romaneios/gerar-romaneio-exemplo.mjs - acrescenta a rota L-31 com ~120 enderecos amostrados sobre o grafo OSM real de Copacabana.
- romaneios/README.md - linha da rota nova na tabela de planilhas.
- public/romaneios/exemplo-rota-grande.xlsx - planilha gerada, versionada como as outras.
- __utilidades-back-office__/spike-conversoes/arnes.ts - carrega planilha, busca e cacheia o grafo em arquivo, mede e imprime a tabela comparativa.
- __utilidades-back-office__/spike-conversoes/conversoes.ts - tres definicoes de conversao, A* por aresta, geracao de ancoras livres e cobertura gulosa.

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| testes | APROVADO | — | 0 | — |
| build | APROVADO | — | 0 | — |

**Riscos declarados:** Nenhuma busca bater o guloso: e resposta legitima, e a narrativa registra. · A* por aresta explodir em tempo: o estado cresce com o grau medio dos nos, e por isso o custo em ms e parte da pergunta. · Overpass publico rate-limited (DT-005): mitigado cacheando o grafo em arquivo, buscado uma vez. · Corpus sintetico nao representar a distribuicao real de enderecos, ainda que caia em ruas reais.

**Achados que a propria tarefa registrou:**

- (classe 3) O exemplo-rota-grande.xlsx (104 KB), corpus de medicao que nenhuma tela carrega, entrou no precache do service worker: o globPatterns do vite-plugin-pwa casa **/*.xlsx. Confirmado no dist/sw.js do build. Todo usuario baixaria 104 KB a mais na primeira carga por um arquivo que o app nao usa. → descartado: Corrigido nesta propria tarefa: globIgnores em vite.config.ts exclui so esse arquivo. Reconferido no build - fora do precache, os dois romaneios que o app serve continuam dentro, e o arquivo segue baixavel pela URL.

### TASK-CHORE-013 · Migrar projeto Cloudflare Pages de eu-roteirizo-prototipo para teste-prototipo

`CHORE` · cerimonia Standard · esforco P/P · origem: titulo-autossuficiente

**Criterios de aceite, e o teste que cada um nomeia:**

- Projeto teste-prototipo criado com sucesso no Cloudflare Pages
  → teste: `nao se aplica: validacao via wrangler pages project list`
- Build e deploy executados com sucesso em teste-prototipo.pages.dev
  → teste: `nao se aplica: verificacao de status HTTP 200 na URL de deploy`
- Projeto antigo eu-roteirizo-prototipo excluido do Cloudflare Pages apos validacao do novo
  → teste: `nao se aplica: confirmacao de exclusao via wrangler pages project list`
- Gates declarados (tipos, lint, testes, build) aprovados
  → teste: `src/__tests__/config/deploymentConfig.test.ts > deploymentConfig`

**Declarou mudar:**

- package.json - atualizar homepage e script deploy:test para o projeto teste-prototipo
- index.html - atualizar metatags og:url e og:image para teste-prototipo.pages.dev
- docs-mentor/contexto.json - atualizar operacao.ambientes e operacao.deploy.destino para o novo projeto
- README.md - atualizar links do prototipo para https://teste-prototipo.pages.dev
- docs/contexto-projeto-ai.md e docs/README.md - atualizar referencias a URL antiga do prototipo
- src/__tests__/config/deploymentConfig.test.ts - teste de regressao para garantir que o projeto aponta para teste-prototipo

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| testes | APROVADO | 07/09/26 02:42 | 0 | — |
| build | APROVADO | — | 0 | — |

**Riscos declarados:** Exclusao do projeto antigo remove deployments historicos e a previa da TASK-BG-011, conforme aprovado pelo usuario · Disponibilidade temporaria do DNS/dominio novo no Cloudflare Pages logo apos a criacao

### TASK-CHORE-014 · Apontar proxy de tiles do mapa para 1-teste-prototipo

`CHORE` · cerimonia Standard · esforco P/P · origem: titulo-autossuficiente

**Criterios de aceite, e o teste que cada um nomeia:**

- RouteMap e seus testes apontam para 1-teste-prototipo.thiagorod-dev.workers.dev
  → teste: `src/__tests__/components/RouteMap.test.tsx > RouteMap > configures the tile proxy layer with the correct settings`
- Gates declarados (tipos, lint, testes, build) aprovados
  → teste: `nao se aplica: execucao formal dos gates declarados`
- Deploy realizado e validado no Cloudflare Pages teste-prototipo
  → teste: `nao se aplica: verificacao manual do mapa no navegador`

**Declarou mudar:**

- src/components/RouteMap.tsx - atualizar endpoint do tileLayer para 1-teste-prototipo
- src/__tests__/components/RouteMap.test.tsx - atualizar assercao do teste para o novo endpoint de tiles
- infra/cloudflare-tile-worker/README.md - registrar a nova URL de referencia do worker 1-teste-prototipo

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| testes | APROVADO | 07/09/26 03:26 | 0 | — |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| build | APROVADO | — | 0 | — |

**Riscos declarados:** Worker novo fora do ar: mitigado pela verificacao previa com HTTP 200

### TASK-BG-011 · Restabelecer o carregamento da malha viaria e diagnosticar falhas de rede, HTTP e timeout

`BG` · cerimonia Standard · esforco M/G · origem: titulo-autossuficiente

**Criterios de aceite, e o teste que cada um nomeia:**

- HTTP 200 com remark de erro ou elements ausente/nao-array nao gera sucesso nem entrada de cache. elements=[] valido permanece distinguivel de payload invalido. HTTP 429/5xx, timeout cliente, rede e parse possuem categorias; CORS/DNS nao sao inventados quando o navegador expoe apenas TypeError.
  → teste: `osm.test.ts: HTTP 200 invalido/remark/array vazio, timeout, HTTP e rede; graphCache.test.ts: nao gravar erro`
- Retentativas sao limitadas, respeitam Retry-After e nao multiplicam chamadas em paralelo; a recuperacao bem-sucedida entrega grafo utilizavel para a area correta.
  → teste: `osm.test.ts: retry limitado e recuperacao; MapPage.test.tsx: recuperacao e troca de rota`
- Historico registra categoria, status acessivel, numero de tentativas, tempos de headers/corpo/total e situacao do cache; campos nao medidos sao null. Leitura de amostras antigas continua funcionando. Logs usam apenas metadados necessarios ao diagnostico, sem copiar linhas do romaneio.
  → teste: `graphDiagnostics.test.ts: legado, null, limite do historico e campos permitidos; graphCache.test.ts: erro versus cache`
- Com grafo em cache valido o roteiro e calculado offline sem rede; sem grafo a indisponibilidade fica explicita, sem perda das paradas ou falsa rota pelas ruas.
  → teste: `graphCache.test.ts: cache offline; MapPage.test.tsx: ausencia de malha e preservacao do roteiro`
- Recuperacao do carregamento online e percurso offline com grafo salvo sao demonstrados no Samsung M35, registrando data, versao publicada, navegador, area, resultado e duracao. Apenas mensagens melhores ou aumento de timeout nao satisfazem a tarefa.
  → teste: `Validacao manual Samsung M35: falha, recuperacao online, reabertura offline e percurso seguindo ruas`
- Fonte adotada tem evidencia de permissao de uso, cache e volume agregado do app; custo de obter, atualizar e distribuir dados separado do calculo local. Nenhuma troca silenciosa por mirrors nem migracao arquitetural sem decisao documentada.
  → teste: `Revisao documental de plano-infraestrutura-e-custos.md e ADR-010 com fontes oficiais`
- Reproducao identifica a versao publicada e usa area publica pequena, com poucas tentativas controladas; associa cada falha a diagnostico real. A correcao de causa depende dessa evidencia. Se o problema exigir outra fonte, revisar plano e ADR antes da migracao; nao declarar resolvido com testes simulados apenas.
  → teste: `Registro de reproducao no aparelho e comparacao antes/depois na validacao manual`
- Carregamento online e recuperacao apos falha sao validados tambem no navegador do PC, registrando navegador, versao publicada, contexto de rede, mensagem e tempos; comparar com M35 sem atribuir causa comum apenas pela coincidencia do sintoma.
  → teste: `Validacao manual web/PC: carga inicial, falha identificada e recuperacao; comparar com smoke Samsung M35`
- HTTP 429 nao gera retry automatico e orienta espera minima de 30 segundos; falha de rede sem HTTP termina na primeira tentativa, preservando diagnostico.
  → teste: `osm.test.ts > BG-011 — consumo do servico publico`

**Declarou mudar:**

- src/utils/routing/osm.ts - preservar error para os consumidores e acrescentar diagnostico estruturado de cada tentativa: categoria, HTTP quando acessivel, tempo ate headers, leitura do corpo, total e bytes efetivamente recebidos. Distinguir timeout do cliente, erro Overpass no corpo, HTTP, rede e payload invalido. Validar elements como array; elements=[] valido nao equivale a elements ausente. Retry limitado com Retry-After, sem rotacao automatica de endpoints.
- src/services/graphDiagnostics.ts e src/services/graphCache.ts - historico versionado e limitado, compativel com amostras antigas; dados indisponiveis como null, nunca zero inventado. Registrar hit, miss, expirado e falha de armazenamento separadamente de falha de rede; conservar grafo valido e impedir cache de resposta invalida. Area, duracao e categorias bastam para este diagnostico; nao copiar romaneio para logs.
- src/hooks/useRoadGraph.ts - recuperar por retry explicito e impedir resposta obsoleta de substituir estado atual. MapScreen ja remonta por manifestId/routeName: preservar esse contrato, sem presumir bug de troca de rota. Rever timeout total e cancelamento com testes de integracao existentes.
- src/components/shell/DeliverySettingsDialog.tsx e src/constants/uiLabels.ts - mostrar resumo da ultima falha e detalhes tecnicos no painel existente (categoria, HTTP quando acessivel, tentativas, tempos e cache). Remover inferencia automatica de fila baseada em tamanho ausente; historico legado deve exibir causa nao registrada. Nao exigir dados do cliente para interpretar erro.
- src/pages/MapPage.tsx - explicitar que segmentos sem malha nao sao percursos calculados pelas ruas, preservando romaneio e paradas.
- src/__tests__/utils/routing/osm.test.ts, src/__tests__/services/graphCache.test.ts, src/__tests__/services/graphDiagnostics.test.ts e src/__tests__/pages/MapPage.test.tsx - cobrir falhas, recuperacao, historico antigo e comportamento offline com/sem grafo.
- docs/rascunhos/plano-infraestrutura-e-custos.md - registrar comparacao das fontes apos pesquisa humana, limites, custos de distribuicao, transicao e evidencias; mudanca arquitetural exige revisar ADR-010 antes de executar.

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| testes | APROVADO | 07/09/26 01:17 | 0 | — |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| build | APROVADO com ressalva | — | 0 | Aviso Vite de chunks > 500 kB preexistente |

**Riscos declarados:** Causa raiz da versao publicada ainda desconhecida; falhas entre 1,39 e 2,69 km² nao provam fila ou payload excessivo. · Dependencia de servico publico sem garantia; diagnostico nao substitui correcao. · Escolha de nova fonte pode exigir plano Strict e divisao antes da execucao; nao ampliar esta correcao silenciosamente para uma migracao inteira. · Teste no aparelho e necessario; mocks nao demonstram disponibilidade do fornecedor. · A resposta atual usa data.elements ?? [] e o teste aceita objeto vazio como grafo: sucesso aparente pode esconder payload invalido. Ainda nao associado ao timeout observado. · Mesmo com diagnostico completo, o navegador pode nao revelar a causa de uma falha de rede; apresentar desconhecido em vez de afirmar DNS/CORS/fila. · Usuario esclareceu que os romaneios nao contem nome/CPF e que codigo de pacote nao da acesso publico ao rastreio. Nao classificar indiscriminadamente nomes de ruas como dados pessoais; a escolha de metadados nos logs e suficiente para esta investigacao. · Reversao: preservar compatibilidade das amostras e nao limpar cache/romaneios; nenhum upgrade de banco ou fornecedor contratado nesta fase.

**Achados que a propria tarefa registrou:**

- (classe 4) Planejamento verificou que osm.ts aceita elements ausente como array vazio e osm.test.ts confirma esse comportamento; classificar payload invalido e necessario para nao apresentar falso sucesso. MapScreen possui key manifestId:routeName, portanto troca de rota nao foi diagnosticada como defeito. Sem alteracao de codigo ou execucao de gates nesta etapa. → tarefa: TASK-BG-011
- (classe 4) Humano informa que a falha de carregamento da malha tambem ocorre no navegador do PC. Incidente nao restrito ao Samsung M35. Navegador, versao publicada, rede, mensagem e tempos especificos do PC ainda nao informados; nao presumir mesma causa tecnica nem reproducao independente em outra rede. → tarefa: TASK-BG-011
- (classe 4) Bloqueante para fechamento: restabelecimento do servico real nao demonstrado. Implementados diagnostico por tentativa, validacao de payload, respeito ao Retry-After, cancelamento e aviso de aproximacao. Smoke Chromium 152 com resposta controlada passou (3 nos, 5 pontos no percurso, 213,56 m offline, 2 requisicoes apenas). Evidencias .mentor-saidas/bg011-browser-smoke.json e bg011-network-observation.json. Previa de teste publicada apos autorizacao humana; pesquisa de fonte alternativa permanece pendente. → tarefa: TASK-BG-011
- (classe 3) Auto-revisao do diff: dialogo de diagnostico ganhou limite de altura e rolagem para manter os controles acessiveis com historico detalhado. Testes MapPage ainda emitem avisos act preexistentes; suite passou. Sem declaracao de revisao independente ou validacao humana. Vulnerabilidades e aviso de chunks continuam registrados na CHORE-012, sem mudanca de dependencias nesta tarefa. → tarefa: TASK-CHORE-012
- (classe 4) Publicacao autorizada da previa BG-011: https://95bf73f7.eu-roteirizo-prototipo.pages.dev (alias https://bg-011-carregamento-malha.eu-roteirizo-prototipo.pages.dev), verificada em 2026-09-07T03:47:50.904Z. Artefato original aprovado preservado; site principal nao alterado. Revisao automatica pediu comprovacao das planilhas: tres exemplos sinteticos identicos a public/romaneios, com codigos DEMO; nova tentativa liberada. Evidencias .mentor-saidas/bg011-deployment.json e bg011-public-fixtures-verification.json. Validacao real pendente. → tarefa: TASK-BG-011
- (classe 4) Validacao humana da previa falhou em PC/M35 via Wi-Fi. Seis tentativas de ~21,3 s sem HTTP e outra carga M35 de 8,5 s (726/956/1539 ms). DNS do endpoint resolveu neste host; Chromium local excedeu prazo de navegacao de 15 s ao /api/status (interrompido pelo proprio teste). Nao comprova bloqueio por IP nem fila. Operadora em 11/08/2026 exige >=30 s apos HTTP 429 e relata bloqueios por insistencia: https://community.openstreetmap.org/t/overpass-api-performance-issues/140598/157 . Corrigido localmente: sem retry automatico para 429 nem rede sem resposta; mensagem 429 orienta espera minima. Vermelho/verde registrados; nova publicacao e restauracao real pendentes. → tarefa: TASK-BG-011
- (classe 4) Apos solicitar acesso a /api/status no M35 com Wi-Fi desligado, humano retornou resposta do servico com Current time 2026-09-07T04:22:00Z, endpoint anunciado gall.openstreetmap.de/, Rate limit 2 e 2 slots disponiveis, sem consultas em execucao listadas. Registrado como resultado do teste solicitado em dados moveis; identificador Connected as omitido por nao ser necessario. Evidencia confirma acesso ao status e capacidade disponivel naquele instante, nao sucesso do POST do app nem bloqueio por IP no Wi-Fi. Comparar /api/status no Wi-Fi e uma carga da previa em dados moveis antes de atribuir causa. → tarefa: TASK-BG-011
- (classe 4) Apos instruir uma carga da previa em dados moveis, humano enviou duas novas falhas de 2,31 km² e ~7 s totais: tentativas 823/276/822 ms e 1034/763/277 ms; todas network, sem HTTP/bytes expostos e cache ausente. Interpretacao condicional ao teste solicitado: status acessivel, mas POST do app falha; causa exclusivamente Wi-Fi enfraquecida. CORS/recusa por origem ou outra restricao do interpreter permanecem hipoteses; nao confirmar bloqueio sem evidencia do navegador. Historico ainda com 3 tentativas porque ajuste local posterior nao foi publicado. Proxima evidencia necessaria: erro exato de Console/Network referente ao Overpass no PC. → tarefa: TASK-BG-011
- (classe 4) Console do PC fornecido pelo humano confirma POST https://overpass-api.de/api/interpreter com net::ERR_CONNECTION_TIMED_OUT no build publicado index-CmHUcFf-.js. Classificacao confirmada nesse teste: timeout de conexao exposto pelo navegador, nao erro de parse ou HTTP 429 observado. Nao confirma bloqueio por IP, CORS ou causa no servidor. Avisos de preload/service worker e runtime.lastError aparecem no mesmo console, sem evidencia de nexo causal com o timeout; manter separados. Diagnostico anterior do app (network sem HTTP) e consistente com TypeError exposto ao JavaScript. Recuperacao real e escolha/transicao da fonte continuam pendentes. → tarefa: TASK-BG-011
- (classe 4) Restabelecimento da malha comprovado em producao (teste-prototipo.pages.dev). Implementado proxy /overpass com CORS no Cloudflare Worker 1-teste-prototipo, utilizando instancias globais oficiais (overpass-api.de, lz4, z, kumi). Validacao manual do usuario confirmou 2.250 nos baixados com sucesso (294 KB, 4,69 km²), resiliencia com recuperacao na tentativa 2 apos timeout inicial, e gravacao no cache local do navegador. → tarefa: TASK-BG-011

### TASK-CHORE-012 · Conferir configuracoes do GitHub e aferir as metas de qualidade apontadas pelo doctor

`CHORE` · cerimonia Standard · esforco P/M · origem: titulo-autossuficiente

**Criterios de aceite, e o teste que cada um nomeia:**

- As tres configuracoes de plataforma possuem estado observado e fonte; protecao desativada continua explicitamente pendente.
  → teste: `nao se aplica: consulta GET autenticada ao GitHub e verificacao documental`
- Metas avaliadas citam evidencia e limites; validacao em aparelho e medidas inexistentes nao recebem conformidade.
  → teste: `nao se aplica: revisao documental contra codigo, gates e registros existentes`
- A proxima fatia de desenvolvimento pertence a RF-029, conforme escolha humana, e RF-024 permanece na reserva com historico preservado.
  → teste: `nao se aplica: gerar, verificar e leitura da fila calculada`
- Os quatro gates declarados sao executados e sua saida e registrada, incluindo ressalvas.
  → teste: `nao se aplica: executa a suite existente e os gates declarados como afericao; nao acrescenta codigo ou testes`

**Declarou mudar:**

- docs-mentor/contexto.json - declarar configuracoes consultadas no GitHub, explicitar o padrao de uma tarefa por ramo e registrar afericoes com suas limitacoes.
- docs-mentor/tarefas/abertas/TASK-CHORE-012.json - guardar plano, gates executados e pendencias que dependem de autorizacao ou validacao humana.
- docs-mentor/tarefas/abertas/TASK-RF-024.json e TASK-RF-029.json - refletir a prioridade de RF-029 escolhida pelo humano; gerar suas quatro fatias pelo CLI a partir do SPIKE-001.
- Vistas de docs-mentor/ - regenerar pelo CLI apos alterar as fontes.

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| testes | APROVADO | 06/09/26 04:02 | 0 | — |
| build | APROVADO com ressalva | — | 0 | Aviso de chunks > 500 kB |

**Riscos declarados:** Confundir ausencia de aviso no doctor com protecao ativa. · Tratar testes automatizados como validacao em aparelho. · Alteracoes da atualizacao do Mentor ja estavam presentes no inicio desta tarefa.

**Achados que a propria tarefa registrou:**

- (classe 1) Alertas e atualizacoes de seguranca estavam desativados. Apos autorizacao humana, ambas as medidas foram ativadas por PUT e reconferidas por GET: HTTP 204 e enabled=true/paused=false, respectivamente. Evidencia: .mentor-saidas/github-security-20260906T075343Z.json → descartado: Corrigido nesta tarefa apos autorizacao humana; nao houve commit, merge ou push.
- (classe 1) npm audit --json retornou exit 1, com 1 vulnerabilidade moderada e 1 baixa; nenhuma alta/critica. @humanfs/node: GHSA-p498-v437-472g; esbuild: GHSA-g7r4-m6w7-qqqr. Ambas transitivas com fixAvailable=true. Saida crua: .mentor-saidas/npm-audit-20260906T070412Z.json. Nenhuma correcao de dependencia foi aplicada. → tarefa: TASK-CHORE-012
- (classe 3) Build gerou chunks JavaScript de 512.36, 803.48 kB, acima do aviso de 500 kB. O build conclui, mas o aviso nao comprova desempenho de carregamento aceitavel. Meta de latencia no aparelho continua sem medicao. → tarefa: TASK-CHORE-012
- (classe 4) Contagem 44/49 no contexto nao era sustentada pela rastreabilidade legada. Removida sem inventar percentual. RF-35 ainda aparece planejado em docs/requisitos/funcionais.md, apesar da persistencia implementada em routeStorage e TASK-RF-008 concluida; reconciliacao completa do legado segue pendente. → tarefa: TASK-CHORE-012
- (classe 3) Teste Samsung M35: tiles aparecem apenas ao terminar o arraste. RouteMap.tsx configura updateWhenIdle=true, consistente com o relato. Ajuste de atualizacao durante movimento requer medir fluidez no aparelho; nao implementado. → tarefa: TASK-CHORE-012
- (classe 4) Teste Samsung M35: cobertura visual offline limitada aos tiles/zooms visitados, reutilizados entre romaneios. Isso evidencia reuso de cache, nao pacote offline completo ou armazenamento garantido. Proposta humana: baixar area de entrega com limites. Worker atual usa tile.openstreetmap.org, cuja politica proibe prefetch/offline por area (https://operations.osmfoundation.org/policies/tiles/); avaliar fonte propria/permitida e limites de area, zoom e bytes, incluindo entregas dispersas. → tarefa: TASK-CHORE-012
- (classe 4) Teste Samsung M35: percursos fora das ruas ao criar paradas offline e falha de carregamento das ruas mesmo online. routePath.ts usa segmentos retos sem grafo; useRoadGraph.ts carrega via Overpass e graphCache.ts usa chave por bbox com TTL de 7 dias, independente dos tiles. Causa da falha online nao confirmada; falta mensagem exibida e reproducao da versao publicada. Offline com malha disponivel deve permitir calculo local; indisponibilidade precisa ficar explicita ao usuario. → tarefa: TASK-BG-011
- (classe 4) Capturas fornecidas pelo humano no teste Samsung M35: mensagem "O download das ruas demorou demais e foi cancelado. Tente novamente."; diagnostico mostra erros em 2,69 km² (36,6 s e 17,8 s), 2,31 km² (4,7 s a 37,8 s) e 1,39 km² (4,9 s). Mensagem corresponde a TIMEOUT no codigo local; nao prova que todas as entradas tiveram a mesma causa ou que houve fila no servidor. graphDiagnostics/graphCache registram apenas area e tempo total nas falhas, com networkMs/responseKb zerados por convencao e sem status HTTP, categoria de erro ou tentativas. A dica de resposta pequena versus fila nao permite diagnosticar essas falhas. Capturas sao evidencia humana, sem reproducao local da versao publicada. Proximo diagnostico deve distinguir timeout, HTTP e rede, mantendo logs sem enderecos/coordenadas. → tarefa: TASK-BG-011
- (classe 4) Por solicitacao humana, recuperacao critica da malha e melhoria do diagnostico encaminhadas a TASK-BG-011. CHORE-012 permanece em-execucao e validacao pendente; nao foi encerrada nem teve falhas dispensadas. TASK-BG-011 deve preceder o proximo desenvolvimento RF-030; iniciar exige tratar a tarefa ativa respeitando WIP=1. Relacao de descoberta nao e dependencia da BG em relacao ao fechamento da CHORE. → tarefa: TASK-BG-011
- (classe 4) Humano informa que a falha de carregamento da malha tambem ocorre no navegador do PC. Incidente nao restrito ao Samsung M35. Navegador, versao publicada, rede, mensagem e tempos especificos do PC ainda nao informados; nao presumir mesma causa tecnica nem reproducao independente em outra rede. → tarefa: TASK-BG-011
- (classe 4) Execucao interrompida para priorizar BG-011 conforme autorizacao humana. Estado volta a aberta porque Mentor nao possui pausa; datas, gates e pendencias preservados. Nao concluida, cancelada nem dispensada. Retomar apos a correcao critica. → tarefa: TASK-BG-011

### TASK-RF-013 · Exportar e importar roteiro JSON

`RF` · cerimonia Standard · esforco M/M · origem: RF-36, RF-20, RF-44

**Criterios de aceite, e o teste que cada um nomeia:**

- Exportar roteiro estruturado com ponto de partida, paradas, endereços e raios em formato JSON versionado
  → teste: `src/__tests__/services/routeExport.test.ts > createRouteExportPayload e serializeRouteExport geram payload v1 válido`
- Importar JSON e carregar em Meu roteiro com todas as paradas e endereços intactos
  → teste: `src/__tests__/services/routeExport.test.ts > importRoutePayload importa roteiro avulso criando romaneio sintético`
- Quando importado sem planilha original (avulso), desabilitar aba Original com tooltip explicativo
  → teste: `src/__tests__/components/map/MapModeToggle.test.tsx > desabilita a aba Original quando originalEnabled é false e exibe tooltip de standalone (RF-20)`
- Interface na Home com botão habilitado e navegação direta para o mapa
  → teste: `src/__tests__/pages/HomePage.test.tsx > navigates directly to Meu Roteiro on map when importing a valid JSON route (RF-013)`

**Declarou mudar:**

- src/types/routeExport.ts - Contrato de payload versionado eu-roteirizo/roteiro/v1
- src/services/routeExport.ts - Serialização, download, validação e importação de roteiro
- src/services/manifestStorage.ts - Suporte a persistência de romaneio avulso/sintético
- src/constants/uiLabels.ts - Rótulos em português para exportação, importação e modo avulso
- src/components/map/MapModeToggle.tsx - Desabilitação de aba Original com tooltip no modo avulso
- src/components/map/panel/RoteiroOverviewSection.tsx - Botão Exportar roteiro no painel Ver detalhes
- src/pages/MapPage.tsx - Conexão do disparo de download do JSON e detecção de romaneio avulso
- src/components/FileUploader.tsx - Habilitação do botão de importação com seletor de arquivo .json
- src/pages/HomePage.tsx - Fluxo de importação e navegação direta para Meu roteiro

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| testes | APROVADO | 07/09/26 17:35 | 0 | — |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| build | APROVADO | — | 0 | — |

**Riscos declarados:** Importação de JSON corrompido ou malicioso mitigada por validação estrita de schema (ROUTE_EXPORT_SCHEMA_V1) · Romaneio original ausente mitigado pela criação de linhas sintéticas no IndexedDB para manter navegação íntegra

### TASK-BG-012 · Corrigir conectividade de alcas viarias e regras de mao unica no grafo OSM

`BG` · cerimonia Standard · esforco M/M · origem: titulo-autossuficiente

**Criterios de aceite, e o teste que cada um nomeia:**

- buildOverpassQuery inclui classes de link viario (motorway_link, trunk_link, primary_link, secondary_link, tertiary_link), permitindo download de alcas de acesso e retornos.
  → teste: `osm.test.ts > includes the navigable-highway filter`
- onewayDirection reconhece junction=circular como mao unica forward, assim como roundabout.
  → teste: `graph.test.ts > treats circular junction as forward`
- onewayDirection reconhece motorway e motorway_link como forward por padrao no OSM, mas reverte para both quando oneway=no/0/false.
  → teste: `graph.test.ts > treats motorway as forward by default, but respects oneway=no`
- A* encontra percurso navegavel entre vias conectadas por alca link sem retornar nulo nem degradar para linha reta.
  → teste: `aStar.test.ts > connects avenues via link road instead of straight fallback`
- graphCache invalida registros legados que nao possuem schemaVersion 2, forcando carga da nova malha completa.
  → teste: `graphCache.test.ts > treats legacy cached records without schemaVersion as expired (TASK-BG-012)`

**Declarou mudar:**

- src/utils/routing/osm.ts - incluir classes de ligacao viaria (*_link: motorway_link, trunk_link, primary_link, secondary_link, tertiary_link) em NAVIGABLE_HIGHWAYS.
- src/utils/routing/graph.ts - enriquecer onewayDirection para reconhecer junction=circular, defaults de mao unica do OSM (motorway, motorway_link) e negacoes explicitas (no, 0, false).
- src/services/graphCache.ts - elevar DB_VERSION para 2 e adicionar schemaVersion no CacheRecord para invalidar automaticamente grafos cacheados anteriores sem as classes link.
- src/__tests__/utils/routing/osm.test.ts - atualizar assercao de buildOverpassQuery com as classes link.
- src/__tests__/utils/routing/graph.test.ts - adicionar testes de onewayDirection cobrindo junction=circular, motorway default e anulações por oneway=no.
- src/__tests__/utils/routing/aStar.test.ts - teste de conexao entre vias por alca de ligacao (primary_link) sem cair em linha reta.
- src/__tests__/services/graphCache.test.ts - teste de invalidacao de registro legado sem schemaVersion.

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| testes | APROVADO | 08/09/26 07:16 | 0 | — |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| build | APROVADO | — | 0 | — |

**Riscos declarados:** Leve aumento no payload do Overpass ao incluir vias link (<10% de bytes), amplamente compensado pela integridade das conexoes viarias.

### TASK-RF-035 · Permitir insercao de parada em posicao arbitraria e reordenacao no rascunho

`RF` · cerimonia Standard · esforco M/M · origem: RF-50

**Criterios de aceite, e o teste que cada um nomeia:**

- Dado um conjunto de paradas existentes 1..N, quando criar uma nova parada informando targetOrder no meio ou inicio, entao a nova parada assume essa ordem e as ordens das paradas subsequentes sao incrementadas automaticamente sem lacunas.
  → teste: `builder.test.ts > CREATE_STOP insere em posicao arbitraria e renumera paradas subsequentes`
- Dada uma parada existente em ordem A, quando reordenar para targetOrder B, entao a parada assume ordem B e as demais paradas sao deslocadas mantendo a sequencia contigua 1..N.
  → teste: `builder.test.ts > REORDER_STOP reposiciona parada e normaliza sequencia 1..n`
- Na secao Previa de parada, quando existirem paradas anteriores, o usuario pode selecionar em qual posicao a nova parada sera criada e o numero exibido reflete a posicao escolhida.
  → teste: `RoteiroPointSection.test.tsx > permite selecionar posicao de insercao e passa targetOrder`
- Na lista de paradas confirmadas da vista geral, cada parada oferece acoes para mover para cima ou para baixo respeitando os limites da rota.
  → teste: `RoteiroOverviewSection.test.tsx > permite mover parada para cima e para baixo`

**Declarou mudar:**

- src/utils/routing/builder.ts - Atualizar acao CREATE_STOP para aceitar targetOrder opcional (inserindo no indice correto antes de normalizar ordens); adicionar acao REORDER_STOP para reposicionar qualquer parada mantendo sequencia 1..N.
- src/constants/uiLabels.ts - Adicionar rotulos acessiveis e amigaveis para seletor de posicao de insercao e acoes de mover paradas.
- src/components/map/panel/RoteiroPointSection.tsx - Adicionar seletor de posicao na secao Previa de parada quando ja existirem paradas criadas, permitindo escolher em qual posicao inserir a nova parada.
- src/components/map/panel/RoteiroOverviewSection.tsx - Adicionar botoes/controles para subir e descer paradas na lista de paradas confirmadas, disparando a reordenacao.
- src/pages/MapPage.tsx - Conectar targetOrder no dispatch de CREATE_STOP e adicionar callback de reordenacao para RoteiroOverviewSection.
- src/__tests__/utils/routing/builder.test.ts - Testes unitarios para insercao de parada no inicio, meio e fim, alem de reordenacao de paradas existentes.
- src/__tests__/components/map/panel/RoteiroPointSection.test.tsx - Testes para selecao de posicao de insercao na previa.
- src/__tests__/components/map/panel/RoteiroOverviewSection.test.tsx - Testes para controles de mover paradas na lista da vista geral.

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| testes | APROVADO | 08/09/26 08:29 | 0 | — |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| build | APROVADO | — | 0 | — |

**Riscos declarados:** Usuario selecionar ordem invalida fora dos limites: mitigado com clamping automatico e fallback para fim da rota no reducer. · Impacto no calculo de distancias/estimativas: normalizeOrders garante paradas 1..N contiguas, permitindo recalcular percursos e pernas sem inconsistencias.

### TASK-RF-036 · Recomecar rascunho no cabecalho, foco na ultima parada ao deletar e rotulo Deletar parada

`RF` · cerimonia Standard · esforco M/M · origem: RF-51

**Criterios de aceite, e o teste que cada um nomeia:**

- Na tela do mapa, quando existirem paradas criadas, o cabecalho do painel exibe a opcao Recomecar e ao confirmar no dialogo todas as paradas sao limpas e o ponto de partida e mantido.
  → teste: `RoteiroPanelHeader.test.tsx > exibe botao Recomecar quando ha paradas e confirma limpeza`
- Ao deletar uma parada qualquer, se restarem outras paradas, o foco e selecao mudam automaticamente para a nova ultima parada restante.
  → teste: `MapPage.test.tsx > ao deletar uma parada seleciona automaticamente a ultima parada remanescente`
- Na secao de parada confirmada, o botao de exclusao exibe o rotulo 'Deletar parada' e icone de lixeira Trash2.
  → teste: `RoteiroStopSection.test.tsx > botao de exclusao usa rotulo Deletar parada`

**Declarou mudar:**

- src/utils/routing/builder.ts - Adicionar acao CLEAR_STOPS para limpar todas as paradas do rascunho preservando o ponto inicial.
- src/constants/uiLabels.ts - Atualizar DISSOLVE para 'Deletar parada' e adicionar rotulos do dialogo de confirmacao de recomecar roteiro.
- src/components/map/panel/RoteiroStopSection.tsx - Substituir o icone Undo2 por Trash2 no botao de exclusao de parada.
- src/components/map/panel/RoteiroPanelHeader.tsx - Adicionar botao Recomecar com dialogo de confirmacao no cabecalho quando houver paradas.
- src/pages/MapPage.tsx - Conectar handleResetRoute e atualizar handleDissolveStop para selecionar automaticamente a ultima parada restante.
- src/__tests__/utils/routing/builder.test.ts - Teste unitario para CLEAR_STOPS.
- src/__tests__/components/map/panel/RoteiroPanelHeader.test.tsx - Teste do botao Recomecar e do dialogo de confirmacao.
- src/__tests__/components/map/panel/RoteiroStopSection.test.tsx - Teste do rotulo e icone Deletar parada.
- src/__tests__/pages/MapPage.test.tsx - Teste de selecao automatica da ultima parada restante apos delecao e acao de recomecar.

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| testes | APROVADO | 08/09/26 09:58 | 0 | — |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| build | APROVADO | — | 0 | — |

**Riscos declarados:** Acionamento acidental de Recomecar: mitigado com dialogo de confirmacao explicito e botao de acao destrutiva. · Estado de selecao apos delecao de todas as paradas: tratado voltando o painel para o estado ocioso caso nenhuma parada reste.

### TASK-RF-037 · Preservar endereco escolhido pelo usuario como ancora e primeiro ponto ao criar parada com membros englobados

`RF` · cerimonia Standard · esforco M/M · origem: RF-52

**Criterios de aceite, e o teste que cada um nomeia:**

- Ao criar uma parada a partir de um ponto selecionado pelo usuario com vizinhos englobados no raio, a ancora e projetada a partir do ponto escolhido e ele e o primeiro endereco (1º) da parada.
  → teste: `MapPage.test.tsx > ponto selecionado pelo usuario e preservado como ancora e primeiro endereco ao criar parada com vizinhos englobados`
- A ordenacao de caminhada nearestFirstOrder fixa o endereco indicado por anchorPointId como 1º, varrendo os demais a partir dele.
  → teste: `walkOrder.test.ts > nearestFirstOrder respeita anchorPointId como primeiro endereco da caminhada`
- No reducer, CREATE_STOP mantem o ponto semente informado como primeiro na sequencia de entrega a pe.
  → teste: `builder.test.ts > CREATE_STOP fixa o ponto semente como primeiro endereco da parada`

**Declarou mudar:**

- src/pages/MapPage.tsx - Projetar suggestedAnchor a partir de selectedPoint e usar seedPointId no reset da ancora do rascunho.
- src/utils/routing/walkOrder.ts - Suportar anchorPointId opcional em nearestFirstOrder para fixar o ponto semente como 1º.
- src/utils/routing/builder.ts - Passar seed.id para sweepWithSense em CREATE_STOP garantindo semente como 1º.
- src/utils/routing/overview.ts - Ancorar sugestao automatica na propria semente sugerida.
- src/__tests__/utils/routing/walkOrder.test.ts - Teste de anchorPointId como primeiro endereco em nearestFirstOrder.
- src/__tests__/utils/routing/builder.test.ts - Teste de CREATE_STOP fixando semente como 1º.
- src/__tests__/pages/MapPage.test.tsx - Teste de integracao da criacao de parada mantendo ponto escolhido como ancora e 1º.

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| testes | APROVADO | 08/09/26 12:10 | 0 | — |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| build | APROVADO | — | 0 | — |

**Riscos declarados:** Testes legados que testavam a heuristica de inversao automatica da ancora pelo defaultAnchorSeed precisarao ser atualizados para a nova regra de soberania da escolha do usuario.

### TASK-RF-038 · Mutirao de UI do Meu Roteiro: resumo da parada em 2 linhas, badge P{N} estilizado, porcentagem no cabecalho, cores das paradas, tabelas no sumario e remocao de reordenacao

`RF` · cerimonia Standard · esforco M/M · origem: RF-53

**Criterios de aceite, e o teste que cada um nomeia:**

- Ao selecionar uma parada agrupada o resumo exibe badge colorido P{N}, linha 1 com endereco do veiculo (com indicacao de proximo e distancia a pe com icone se afastado ou em outra rua) e linha 2 com Bairro e CEP
  → teste: `roteiroModels.test.ts > formata o endereco do veiculo com mesma rua, rua adjacente e distancia a pe`
- Na parada agrupada o card Endereco selecionado permanece oculto
  → teste: `RoteiroStopSection.test.tsx > oculta a secao Endereco selecionado quando isExpanded e falso`
- Ao desagrupar a parada com duplo-clique a primeira entrega e selecionada automaticamente no card Endereco selecionado sem o selo de veiculo
  → teste: `MapPage.test.tsx > duplo-clique desagrupa e exibe automaticamente a primeira entrega selecionada no card de endereco`
- Os marcadores quadrados das paradas no mapa exibem o prefixo P (P1, P2...)
  → teste: `roteiroModels.test.ts > gera marcadores quadrados de paradas com prefixo P`
- Na visao geral dos detalhes cada parada exibe o endereco do veiculo precedido de P{N}
  → teste: `RoteiroOverviewSection.test.tsx > exibe o titulo da parada com P{N} e o endereco do veiculo`

**Declarou mudar:**

- src/utils/markers/roteiroModels.ts - Adicionar comparacao de vias (mesma rua vs rua diferente), formatacao do endereco do veiculo com distancia/icone a pe e prefixo P nos icones das paradas.
- src/components/map/panel/PanelSection.tsx - Suportar ReactNode em label para permitir badge colorido P{N} na secao.
- src/components/map/panel/PanelTitle.tsx - Suportar titleOverride e subtitleOverride para layout de duas linhas no resumo e detalhes.
- src/components/map/panel/RoteiroStopSection.tsx - Renderizar badge colorido P{order} no label da secao, ocultar card Endereco selecionado na agrupada e exibir na desagrupada com layout em duas linhas.
- src/components/map/panel/RoteiroOverviewSection.tsx - Exibir P{order} - Endereco do veiculo no titulo de cada parada da visao geral.
- src/pages/MapPage.tsx - Integrar novo formatador de endereco do veiculo, passar stopColor para RoteiroStopSection e configurar titleOverride na visao geral.
- src/__tests__/utils/markers/roteiroModels.test.ts - Testes unitarios de deteccao de via, formatacao com distancia e marcadores P{N}.
- src/__tests__/components/map/panel/RoteiroStopSection.test.tsx - Testes de layout em duas linhas, badge colorido e visibilidade condicional.
- src/__tests__/pages/MapPage.test.tsx - Testes de integracao do novo resumo e marcadores do mapa.

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| testes | APROVADO | 08/09/26 15:44 | 0 | — |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| build | APROVADO | — | 0 | — |

**Riscos declarados:** Testes legados que esperavam o numero puro nos marcadores do mapa ou o formato antigo de titulo da parada precisarao ser atualizados.

### TASK-RF-039 · Nome unico para arquivos JSON exportados com data do romaneio, 4 ultimos digitos do AT e bairro predominante

`RF` · cerimonia Standard · esforco M/M · origem: RF-54

**Criterios de aceite, e o teste que cada um nomeia:**

- Arquivos JSON exportados recebem nome unico no formato YYYY-MM-DD-XXXX-BAIRRO.json
  → teste: `routeExport.test.ts > gera nome unico no formato YYYY-MM-DD-XXXX-BAIRRO.json`
- A data e extraida do nome do arquivo em romaneio unico, dos dados da planilha/AT em romaneio multi, ou da data de importacao como fallback
  → teste: `routeExport.test.ts > resolve data corretamente para romaneio unico, multi e fallback de importacao`
- O codigo AT contribui com seus 4 ultimos caracteres em maiusculas
  → teste: `routeExport.test.ts > extrai os 4 ultimos caracteres do Planned AT`
- O bairro de maior numero em quantidade e normalizado em maiusculas sem acentos
  → teste: `routeExport.test.ts > identifica e sanitiza o bairro predominante da rota`

**Declarou mudar:**

- src/services/routeExport.ts - Implementar buildExportFileName com extracao de data (nome do arquivo para unico, planilha para multi, fallback data de importacao), 4 ultimos digitos do AT e bairro predominante normalizado em maiusculas.
- src/types/routeExport.ts - Expandir ExportedRouteMeta com campos opcionais para procedencia de romaneio (manifestFileName, importedAt).
- src/hooks/useRouteUploader.ts - Expor manifestMeta do romaneio carregado em useRouteUploader.
- src/hooks/useManifestFromUrl.ts - Repassar manifestMeta do romaneio ativo.
- src/pages/MapPage.tsx - Integrar manifestMeta ao payload e download do arquivo JSON exportado.
- src/__tests__/services/routeExport.test.ts - Testes unitarios para geracao de nomes unicos cobrindo romaneio unico, multi, fallbacks de data, sufixos AT e bairro predominante.

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| testes | APROVADO | 08/09/26 18:08 | 0 | — |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| build | APROVADO | — | 0 | — |

**Riscos declarados:** Rotas sem codigo AT ou sem bairro informado precisam de fallbacks deterministicos para nao gerar nomes invalidos ou 'undefined'.

### TASK-BG-013 · Impedir retornos em angulo agudo e conversoes proibidas em contramao

`BG` · cerimonia Standard · esforco M/M · origem: titulo-autossuficiente

**Criterios de aceite, e o teste que cada um nomeia:**

- O A* nao realiza retornos em 'V' (>110°) quando ha rota viaria regular em frente ou por contorno legal
  → teste: `src/__tests__/utils/routing/aStar.test.ts > evita retornos em angulo agudo quando ha rota viaria alternativa`
- Vias de servico (postos de combustivel/garagens) recebem penalidade de transito, impedindo que sirvam de atalho para U-turns espurios
  → teste: `src/__tests__/utils/routing/aStar.test.ts > penaliza transito de passagem por vias de servico`
- Rotatorias oficiais (roundabout/circular) continuam operando normalmente sem penalidade indevida de curva
  → teste: `src/__tests__/utils/routing/aStar.test.ts > permite curvas em rotatorias sem penalidade de U-turn`

**Declarou mudar:**

- src/utils/routing/graph.ts - registrar highway e isRoundabout nas arestas para guiar penalidades de roteamento veicular
- src/utils/routing/aStar.ts - implementar busca turn-aware no A* com penalidade de retorno em angulo agudo (>110°) e penalidade para travessia em vias de servico
- src/__tests__/utils/routing/aStar.test.ts - cobrir rejeicao de retornos agudos, priorizacao de vias principais sobre service e suporte a rotatorias
- src/__tests__/utils/routing/graph.test.ts - testar registro de highway e isRoundabout nas arestas

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| testes | APROVADO | 08/09/26 21:35 | 0 | — |
| build | APROVADO | — | 0 | — |

**Riscos declarados:** Rotas em becos sem saida estritos precisam manter saida mesmo com penalidade de retorno (resolvido usando penalidade finita em vez de bloqueio absoluto)

### TASK-RF-030 · Gerar ancoras livres e cobertura de entregas dentro do raio

`RF` · cerimonia Standard · esforco M/G · origem: RF-34, RF-52

**Criterios de aceite, e o teste que cada um nomeia:**

- Dada uma semente real, gerar sua ancora padrao pela mesma projecao usada em MapPage/overview, preservando seu ID como referencia. Alternativas movidas nao alteram endereco/coordenadas/pacotes da entrega; defaultAnchorSeed legado nao define a regra.
  → teste: `anchors.arnes.ts > case-*: compares configured radii and alternative streets (suggestVehicleStop); autoRouteAnchors.test.ts > reproduces the selected seed default and preserves source addresses and packages`
- Dados casos reais de outra rua selecionados apos validar a malha, gerar alternativas nesses segmentos sem ler ancoras humanas como entrada. Manter ruas distintas com cobertura equivalente para a RF-031 escolher pela chegada/saida.
  → teste: `anchors.arnes.ts > case-*: compares configured radii and alternative streets (manualComparison); autoRouteAnchors.test.ts > keeps alternatives on a parallel road instead of only the nearest street`
- Dado cada R em 30, 60, 90 e 120m, todo membro automatico satisfaz haversine(ancora,ponto) <= R. Nao modificar o default do app ou o roteiro humano. Projecao padrao fora de R e diagnosticada e nao aprovada por excecao.
  → teste: `anchors.arnes.ts > case-*: compares configured radii and alternative streets (assertCoverage); autoRouteAnchors.test.ts > enforces the configured %im radius for every candidate member; distinguishes the exact boundary from just outside it`
- Dados os romaneios reais, cada ponto ativo fica uma vez no agrupamento provisorio ou pendente com motivo; ignorados separados, pacotes preservados e entradas intactas. A lista de candidatas pode ter coberturas sobrepostas sem duplicar atribuicoes finais.
  → teste: `anchors.arnes.ts > case-*: compares configured radii and alternative streets (assertCoverage e hash das entradas); autoRouteAnchors.test.ts > keeps ignored deliveries separate from covered or pending points`
- Dados segmentos dirigidos, paralelos ou geometricamente coincidentes mas desconectados, manter referencia do segmento e acessos de chegada/saida. Nao unir topologias diferentes nem limitar busca a nearestEdge de cada entrega.
  → teste: `autoRouteAnchors.test.ts > preserves disconnected overlapping segments and one-way accesses; keeps alternatives on a parallel road instead of only the nearest street`
- Dadas entradas invalidas, grafo vazio/insuficiente ou limite de trabalho atingido, informar causa e estado incompleto. Busca truncada nao prova ausencia de cobertura; fallback reto nao e caminho confirmado.
  → teste: `autoRouteAnchors.test.ts > does not approve a default anchor outside the radius or fall back without a graph; reports candidate budget exhaustion explicitly; respects the %s work limit; rejects invalid coordinates, repeated ids, invalid options and pedestrian-only graphs`
- Com mesmos dados/configuracao/grafo, repetir e permutar enumeracao produz a mesma ordenacao canonica, candidatas e referencia gulosa; nao depender de ID aleatorio, horario ou ordem de Map.
  → teste: `autoRouteAnchors.test.ts > is deterministic across input and graph enumeration without mutation; anchors.arnes.ts > case-*: compares configured radii and alternative streets (repeticoes por hash)`
- A suite real inventaria todos os XLSX e referencias numeradas, reconcilia pacotes/coordenadas e falha se caso esperado nao executar. Referencias humanas fora do raio sao preservadas e reportadas por cenario, nao ajustadas para favorecer o motor.
  → teste: `anchors.arnes.ts > reconciles every workbook with its available human reference; case-*: compares configured radii and alternative streets (manualComparison); afterAll verifica inventario completo; corpus.test.ts > inventories all original files and detects missing reference pairs`
- O run real usa snapshot local identificado, nao faz rede e registra configuracao, hashes, medidas de cobertura, trabalho e tempo por caso. Dados detalhados ficam locais, sem coordenadas ou IDs derivados delas em logs compartilhados.
  → teste: `anchors.arnes.ts > case-*: compares configured radii and alternative streets (fetch proibido e logs opacos); corpus.test.ts > checks snapshot hashes, input inventory and bounds without a network fallback`
- Comparar raios configuraveis e passos 5/10/20m, exibindo cobertura e custo computacional. Nao chamar distancia reta de caminhada nem prometer economia de veiculo antes da RF-031/RF-032.
  → teste: `anchors.arnes.ts > case-*: compares configured radii and alternative streets (RADII x STEPS, metrics e relatorio espacial)`
- Os JSONs de inspecao abrem pelo schema v1 existente e preservam ancoras, membros, todos os pacotes e pendencias livres. A ordem e rotulada nao otimizada; criar a exportacao nao altera entradas.
  → teste: `corpus.test.ts > inspection exports; anchors.arnes.ts > case-*: compares configured radii and alternative streets (importacao de cada variante de inspecao)`
- Variantes e execucoes recebem identidade propria sem sobrescrever roteiros manuais; importar, hidratar e editar preserva as outras copias. Arquivos e indice permanecem privados.
  → teste: `corpus.test.ts > imports variants without overwriting the manual reference and remains editable; anchors.arnes.ts > inventario de JSONs importaveis`

**Declarou mudar:**

- src/types/autoRouting.ts (novo) - contrato de candidatas com semente, ancora padrao, segmento/acessos dirigidos, cobertura, grupos provisorios, ignorados, pendencias e metricas; reutilizar tipos existentes.
- src/utils/routing/autoRouteAnchors.ts (novo) - gerar candidatas multivia, indexar segmentos, deduplicar sem perder topologia e calcular cobertura; agrupamento guloso e referencia, nao escolha final.
- src/__tests__/utils/routing/autoRouteAnchors.test.ts (novo) - contratos e bordas sinteticas complementares; ampliar syntheticGraph.ts apenas se faltar cenario.
- __utilidades-back-office__/auto-roteirizacao/corpus.ts e prepareGraph.ts (novos) - ler romaneios locais com parser/normalizacao existentes, reconciliar JSONs e preparar snapshot OSM explicito; testes sem rede. corpus.test.ts complementa com testes de descoberta do leitor e integridade usando arquivos sinteticos, sem substituir o corpus real.
- __utilidades-back-office__/auto-roteirizacao/anchors.arnes.ts, vitest.corpus.config.ts e README.md (novos) - suite real obrigatoria, matriz de raios/passos, comparacao humana e evidencia local reproduzivel.
- package.json - comando test:auto-anchors para a suite real; .gitignore - proteger corpus JSON/XLSX e snapshots privados. Detalhamento e evidencias: docs-mentor/tarefas/TASK-RF-030-plano.md.
- Extensao aprovada para inspecao no app: corpus.ts converte com exportador v1 existente; corpus.test.ts testa parser/importador/IndexedDB isolado/hidratacao; anchors.arnes.ts exporta cenarios e indice local; README.md explica importacao e limites. Sem mudanca de schema, UI ou otimizacao.

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| testes | APROVADO | 10/09/26 03:55 | 0 | — |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| build | APROVADO | — | 0 | — |
| validacao_manual | NÃO EXECUTADO | — | — | Fatia de dominio puro e arnes local, sem alteracao de UI, gestos, PWA ou deploy. A equivalencia da ancora e verificada por testes contra a funcao do app. Nao certifica uso Android; validacao de roteiro completo e integracao permanecem em RF-032/TEST-004/RF-034/RF-033. |

**Riscos declarados:** Amostragem pode perder intervalos estreitos de cobertura; combinar projecoes/extremidades, limites de intervalos e refinamento, com haversine na verificacao final. · Podar candidata so por cobrir menos pontos pode eliminar rua melhor para o veiculo; preservar diversidade topologica e reportar limites de busca. · Os roteiros manuais admitem membros fora do raio salvo. Comparacao deve explicitar viabilidade por limite sem reescrever a referencia. · Caches de Copacabana nao cobrem integralmente Ipanema/Humaita e nao identificam coleta; preparar snapshot adequado antes de validar. · Raio geometrico nao comprova caminho a pe ou estacionamento permitido. Viabilidade dos circuitos e trajetos pertence a RF-031/RF-032. · JSONs de romaneios ainda aparecem como nao rastreados; proteger os arquivos antes de qualquer commit de implementacao. IDs pt_/stop_ tambem revelam coordenadas. · Importacao faz upsert por manifestId/routeName: cenarios precisam de IDs separados. Trajetos que o app desenha nao sao comprovacao de otimizacao ou da mesma malha congelada do teste.

**Achados que a propria tarefa registrou:**

- (classe 4) RouteStop nao preserva seedPointId explicitamente; REOPEN_STOP usa pointIds[0] e comentarios do helper defaultAnchorSeed descrevem regra antiga. O motor novo preserva a semente selecionada separadamente; a integracao precisa manter essa referencia. → tarefa: TASK-RF-034
- (classe 2) JSONs reais e IDs derivados de coordenadas poderiam entrar no repositorio ou logs. Mitigacao implementada: corpus/cache/saidas ignorados, registros opacos e detalhes apenas locais; ignore nao criptografa arquivos. → tarefa: TASK-RF-030
- (classe 5) Os caches anteriores sem identidade e com extensao insuficiente nao sustentam validacao do corpus real. O arnes exige snapshot proprio, hashes e inventario completo, falha por ausencia e nao usa fallback de rede. CI publica nao substitui esta evidencia privada. → tarefa: TASK-TEST-004
- (classe 4) Regras posteriores para TASK-SPIKE-002: fundamentais obrigatorios, pre-agrupamento opcional, circuito entre referencias de 120m configuraveis, caminhada completa exibida e nenhuma entrega orfa apenas por distancia fundamental-pino. Procura padrao em 30/60m. O mantenedor aprovou prosseguir com o plano isolado antes de adaptar as outras fatias. Spike ainda na reserva e sem implementacao. RF-030 e seus gates/resultados historicos nao comprovam essas regras novas. → tarefa: TASK-SPIKE-002

### TASK-SPIKE-002 · Validar roteiros por pontos fundamentais e circuito de agrupamento configuravel

`SPIKE` · cerimonia Standard · esforco M/G · origem: RF-34

**Criterios de aceite, e o teste que cada um nomeia:**

- Usar pontos fundamentais, circuito configuravel e agrupamentos/ancoras revisaveis elimina orfaos causados apenas por pinos afastados e produz roteiros completos com trocas vantajosas entre veiculo, caminhada e tempo modelado? Responder com validade tecnica, resultados por caso/agregado e inspecao humana; negativo/inconclusivo e resultado legitimo, nao autoriza adaptar o epico.
  → teste: `nao se aplica como assercao de ganho: pergunta de SPIKE. Contratos em fundamentalExperiment.test.ts e experimentArtifacts.test.ts; bateria completa em fundamental.arnes.ts, run 2026-09-11T01-13-25-882Z. Resultado inconclusivo e validacao humana pendente.`

**Declarou mudar:**

- Plano aprovado em docs-mentor/tarefas/TASK-SPIKE-002-plano.md; bateria executada com resultado global inconclusivo e validacao humana pendente. Finalizacao e commit autorizados; sem promocao ao produto ou adaptacao do epico.
- __utilidades-back-office__/auto-roteirizacao/fundamentals.ts (novo): referencias de estacionamento e identidade virtual conservadora, sem alterar DeliveryPoints/pacotes originais.
- __utilidades-back-office__/auto-roteirizacao/experimentPaths.ts (novo): caminhos, cache, circuito limitado, caminhada completa e incertezas explicitamente separados.
- __utilidades-back-office__/auto-roteirizacao/fundamentalExperiment.ts (novo): circuito configuravel de 120m, extremos livres e variantes individual, grupos fixos e revisavel; heuristicas com trabalho limitado.
- __utilidades-back-office__/auto-roteirizacao/fundamentalExperiment.test.ts (novo): contratos previos, excecao individual, limites, conservacao, determinismo, topologia e oraculos pequenos.
- __utilidades-back-office__/auto-roteirizacao/experimentArtifacts.ts e experimentArtifacts.test.ts (novos): JSONs v1 independentes, importacao real isolada e mapa HTML privado da geometria avaliada, sem mudar o app.
- __utilidades-back-office__/auto-roteirizacao/fundamental.arnes.ts (novo): corpus real completo, variantes, referencias humanas avaliadoras, metricas e artefatos reproduziveis sem rede.
- vitest.corpus.config.ts e README.md do arnes; package.json: modo/comando test:auto-fundamentals separado do ensaio historico e guia de parametros/inspecao. Nenhuma dependencia nova.

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| testes | APROVADO | 10/09/26 16:54 | 0 | — |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| build | APROVADO | — | 0 | — |

**Riscos declarados:** Fundamental e projecao estimada, nao portaria/estacionamento certificado; malha derivada nao representa todas as passagens, sinais ou restricoes. Ausencia de caminho nao pode virar economia nem perda de entrega. · Raio de busca/aproximacao, circuito limitado e caminhada completa sao medidas distintas. 120m nao pode ser gravado como radiusMeters manual nem prometido como maximo da caminhada completa. · Identidade textual ambigua e coordenadas divergentes podem fundir entregas diferentes. Camada virtual deve manter rastreabilidade, diagnosticar ambiguidade e preservar IDs/pacotes. · Heuristicas e poda podem perder boas ruas ou grupos; limites de trabalho, variantes comparaveis e oraculos pequenos nao certificam otimo global. · App v1 recalcula geometria com sua malha; exportacao de paradas nao prova igualdade com trajetos medidos. Preservar geometria em evidencia e mapa local independente. · Corpus/cache/artefatos privados ficam ignorados, nao criptografados. Logs com IDs opacos; sem dados reais em repositorio, URLs ou visualizador externo.

**Achados que a propria tarefa registrou:**

- (classe 4) A rodada inicial do spike perdeu membros durante a poda revisavel e produziu trajetos ausentes por dividir incorretamente duas projecoes do mesmo segmento. Rodada historica invalidada como prova de viabilidade; regressoes adicionadas e adaptador corrigido no escopo experimental. → tarefa: TASK-SPIKE-002
- (classe 5) O status da primeira bateria descrevia termino da execucao sem exigir solucoes completas. Relatorio corrigido para separar execucao de validade tecnica e excluir pares parciais de deltas de economia. → tarefa: TASK-SPIKE-002

### TASK-BG-014 · Sumario e painel do mapa mostram distancia e tempo diferentes para o mesmo roteiro

`BG` · cerimonia Standard · esforco P/M · origem: titulo-autossuficiente

**Criterios de aceite, e o teste que cada um nomeia:**

- Com grafo disponivel (cache ou rede, RF-006.7), o Sumario renderiza os totais pelas ruas - iguais aos do painel do mapa para o mesmo roteiro
  → teste: `SummaryPage.test.tsx > usa as distancias pelas ruas quando o grafo esta disponivel`
- Sem grafo (cache ausente e rede falha), o Sumario mostra os totais em linha reta COM a legenda que avisa disso
  → teste: `SummaryPage.test.tsx > cai para linha reta com legenda honesta quando nao ha grafo`
- plannedRouteTotals sem o 3o argumento continua puro e haversine (contrato existente nao muda)
  → teste: `estimates.test.ts > suite existente de plannedRouteTotals (RF-008), mantida verde`

**Declarou mudar:**

- src/pages/SummaryPage.tsx - carregar o grafo (useRoadGraph) e o grafo pedestre quando ha roteiro salvo; passar {graph, pedGraph} para plannedRouteTotals; memoizar buildDeliveryPoints
- src/components/summary/PlannedRouteInfo.tsx - receber viaStreets e renderizar a legenda honesta (ruas x linha reta); corrigir comentario que afirma que as telas nunca divergem
- src/constants/uiLabels.ts - rotulos da legenda em ROTEIRO_INFO (reuso do texto ja validado em MAP_PANEL.ROTEIRO_OVERVIEW)
- src/utils/routing/estimates.ts - so docstring: parar de afirmar que o Sumario chama sem grafos
- src/components/map/panel/RouteProgressCard.tsx - so docstring: mesma correcao
- src/__tests__/pages/SummaryPage.test.tsx - 2 testes novos: com grafo (totais por ruas, iguais ao painel) e sem grafo (linha reta com legenda)
- src/__tests__/utils/routing/estimates.test.ts - corrigir comentario que descreve a divergencia como esperada

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| testes | APROVADO | 11/09/26 05:35 | 0 | — |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| build | APROVADO | — | 0 | — |

**Riscos declarados:** 1a visita sem cache pode disparar Overpass a partir do Sumario (opcao 1 aprovada pelo humano); mitigado pela mesma chave de bbox do mapa (cache 7d) e por nunca bloquear a tela - linha reta com legenda enquanto carrega · Custo de CPU adicional no Sumario (cadeia A* + circuitos a pe), igual ao que o painel do mapa ja paga; confirmar no smoke que nao trava a tela

### TASK-BG-015 · Proximo aparece no endereco da parada do veiculo mesmo quando a ancora nao foi movida

`BG` · cerimonia Standard · esforco P/P · origem: titulo-autossuficiente

**Criterios de aceite, e o teste que cada um nomeia:**

- Ancora intocada (vehicleStopIsDefault !== false) nunca mostra 'próximo' nem distância, mesmo com o pino recuado dezenas de metros da rua (predio com recuo/jardim)
  → teste: `roteiroModels.test.ts > pino recuado da rua não vira 'próximo' quando a âncora não foi editada`
- Ancora intocada cuja rua mais próxima no grafo diverge do texto do endereço (nome OSM diferente/esquina) tambem nao mostra 'Próximo à' - o desvio de nome so' importa quando editada
  → teste: `roteiroModels.test.ts > não editada com nome de via divergente no grafo ainda assim não vira 'Próximo à'`
- Ancora editada (vehicleStopIsDefault===false) continua mostrando 'próximo'/distância exatamente como antes - mesma rua vs rua diferente
  → teste: `roteiroModels.test.ts > testes existentes de vehicleStopIsDefault===false (ajustados)`

**Declarou mudar:**

- src/utils/markers/roteiroModels.ts - formatVehicleStopAddress: isEdited passa a ser SO' stop.vehicleStopIsDefault===false (remove a condicao extra 'distanceMeters >= 5' que media contra o pino); os 3 ramos do rotulo reordenados para isEdited decidir 'aparece próximo ou não' e isSame decidir só QUAL forma; isSame so' varre o grafo quando isEdited (isSame nao importa fora disso)
- src/__tests__/utils/markers/roteiroModels.test.ts - teste novo: pino recuado (longe da rua) com vehicleStopIsDefault true não mostra 'próximo' nem distância; corrige o teste de 'outra rua' (linha ~477) cujo fixture hoje tem a ancora exatamente na projecao (nao deveria ser 'próximo' por medida, so' por estar vehicleStopIsDefault:false, que ja e' o caso do fixture) e adiciona o caso 'não editada mas nearestWayName diverge do texto do endereço' (D2) para confirmar que NAO vira 'Próximo à'

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| testes | APROVADO | 11/09/26 06:41 | 0 | — |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| build | APROVADO | — | 0 | — |

**Riscos declarados:** nenhum identificado - a mudanca remove uma heuristica de distancia por uma leitura direta de um estado que ja existe e ja e' mantido corretamente pelo reducer (MOVE_VEHICLE_STOP/MAKE_POINT_ANCHOR/RESET_VEHICLE_STOP) e pela auto-roteirizacao (RF-030), confirmado lendo os pontos onde vehicleStopIsDefault:true e' atribuido: todos usam suggestVehicleStop/projecao na rua, nunca o pino cru

### TASK-BG-016 · Parada padrao do veiculo cai em via de servico dentro do quarteirao em vez da rua do endereco

`BG` · cerimonia Standard · esforco P/M · origem: titulo-autossuficiente

**Criterios de aceite, e o teste que cada um nomeia:**

- Endereco recuado cuja via mais proxima e' uma service interna de condominio ancora na RUA DO ENDERECO, nao na via interna
  → teste: `vehicleStop.test.ts > prefere a via cujo nome casa com o logradouro do endereco, ignorando a service mais proxima`
- Sem nenhuma via com nome casando dentro do teto, ancora na via NOMEADA nao-service mais proxima (degradacao suave, nunca volta para a service)
  → teste: `vehicleStop.test.ts > sem casar o nome, evita service e usa a via nomeada mais proxima`
- Com a ancora na rua do endereco, o rotulo mostra o endereco puro, sem 'proximo' e sem distancia
  → teste: `roteiroModels.test.ts > ancora projetada na rua do endereco nao vira 'proximo'`
- Sem grafo, suggestVehicleStop devolve o proprio ponto como hoje (nao bloqueia o app offline)
  → teste: `vehicleStop.test.ts > suite existente sem grafo, mantida`
- Roteiro JA salvo (inclusive importado de export antigo) tem as paradas ainda marcadas como padrao reancoradas quando o grafo carrega; parada movida pelo usuario NAO e' tocada
  → teste: `builder.test.ts > REPROJECT_DEFAULT_ANCHORS reancora so' as paradas padrao`

**Declarou mudar:**

- src/utils/routing/streets.ts - recebe normalizeStreetName e isSameStreetName, movidas de utils/markers/roteiroModels.ts (sao logica de dominio de rua dentro de um modulo de view-model; routing nao pode depender de markers)
- src/utils/markers/roteiroModels.ts - importa as duas de routing/streets e reexporta, mantendo a superficie publica atual intacta
- src/utils/routing/match.ts - nearestEdge ganha um filtro opcional sobre a aresta (um unico laco reusado pelos tres niveis); assinatura atual preservada
- src/utils/routing/vehicleStop.ts - suggestVehicleStop passa a receber o logradouro do endereco e aplica 3 niveis: (a) via cujo nome casa com o logradouro dentro de um teto de distancia; (b) senao, via nomeada que NAO seja highway=service; (c) senao, aresta mais proxima (comportamento de hoje). Teto como constante MANUAL KNOB
- src/pages/MapPage.tsx e src/utils/routing/overview.ts - os 5 pontos que chamam suggestVehicleStop passam o logradouro do ponto semente
- src/utils/routing/builder.ts - acao nova REPROJECT_DEFAULT_ANCHORS, que recebe as posicoes JA calculadas (reducer continua puro, mesmo padrao de RESET_VEHICLE_STOP) e reancora TODA parada ainda marcada como padrao; paradas movidas pelo usuario nao sao tocadas
- src/pages/MapPage.tsx - efeito que, quando o grafo chega, reprojeta em lote as paradas padrao do roteiro ja carregado (corrige retroativamente roteiro salvo e importado; o auto-save persiste)
- src/__tests__/utils/routing/vehicleStop.test.ts - fixture de condominio (avenida nomeada + service interna mais perto do pino) cobrindo os 3 niveis e o caso sem grafo
- src/__tests__/utils/markers/roteiroModels.test.ts - com a ancora na rua do endereco, o rotulo sai sem 'proximo' (amarra com a TASK-BG-015)

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| testes | APROVADO | 11/09/26 08:00 | 0 | — |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| build | APROVADO | — | 0 | — |

**Riscos declarados:** A reprojecao em lote MOVE ancoras de roteiro ja salvo sem o usuario pedir - aceito explicitamente pelo humano (11/09), que e' o unico usuario e esta' em teste; limitado a paradas marcadas como padrao, nunca as movidas a mao · Custo: a reprojecao em lote roda uma varredura do grafo por parada quando o grafo chega (nearestEdge e' O(arestas)); mitigado fazendo os 3 niveis em UMA passada por parada, e roda uma vez por carga de grafo, nao por render · Endereco que realmente fica numa via de servico (galpao, condominio industrial) passa a ancorar na rua nomeada mais proxima; mitigado porque o usuario continua podendo arrastar o carro e o nivel (c) preserva o comportamento antigo quando nao ha via nomeada por perto · Nome do romaneio divergente do OSM (abreviacao que normalizeStreetName nao cobre) cai no nivel (b), que ainda evita a via interna - degradacao suave, nao reintroduz o bug · Teto de distancia para o casamento de nome: se a rua do endereco estiver mais longe que o teto e' sinal de geocodigo ruim, e forcar a projecao la seria pior que o nivel (b). Declarado como MANUAL KNOB

### TASK-RF-040 · Reconciliar RF-55 (ignorar enderecos) com o catalogo: atestar entrega e fechar a lacuna de teste do marcador

`RF` · cerimonia Standard · esforco P/P · origem: RF-55

**Criterios de aceite, e o teste que cada um nomeia:**

- Alternar status de um endereco entre ativo e ignorado no painel do Meu Roteiro
  → teste: `builder.test.ts > IGNORE_POINT adds point to ignoredPointIds and UNIGNORE_POINT removes it; RoteiroPointSection.test.tsx > renderiza o botao 'Ignorar endereco' e chama onToggleIgnore ao clicar`
- Enderecos ignorados nao contam para a conclusao nem distancia do roteiro
  → teste: `builder.test.ts > remainingCounts and isComplete disregard ignored points; overview.test.ts > reaches 100% when active points are committed and remaining points are ignored`
- Enderecos ignorados aparecem agrupados ao final do painel geral com restauracao e localizacao
  → teste: `RoteiroOverviewSection.test.tsx > renderiza a secao de enderecos ignorados em ultimo lugar com acoes de restaurar e ver no mapa`
- Marcador do endereco ignorado utiliza cor e estilo diferenciado no mapa
  → teste: `roteiroModels.test.ts > marcador de endereco ignorado usa a cor de ignorado (NOVO - era a unica lacuna)`

**Declarou mudar:**

- src/__tests__/utils/markers/roteiroModels.test.ts - teste novo para o UNICO criterio de aceite do RF-55 sem cobertura: o marcador do endereco ignorado usa IGNORED_MARKER_COLOR em vez da cor do tipo. Os outros 3 criterios ja tem teste e nao se toca neles
- NENHUM arquivo de producao muda: o RF-55 ja esta implementado e entregue no commit 1626097 (IGNORE_POINT/UNIGNORE_POINT, ignoredPointIds, IGNORED_MARKER_COLOR, secao de ignorados no painel). Esta tarefa ATESTA a entrega e liga o requisito ao registro, nao reimplementa

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| testes | APROVADO | dispensado (11/09/26 20:00) | 0 | Trabalho retroativo: o RF-55 foi entregue no commit 1626097, sem ID de tarefa, entao o codigo ja existia e a suite ja passava quando a tarefa nasceu. Vermelho impossivel: --esperando-vermelho se recusa com a suite verde. Evidencia equivalente: checagem de MUTACAO documentada na narrativa (quebrei o ramo isIgnored ? IGNORED_MARKER_COLOR : ... , confirmei que o teste novo falha, restaurei), que prova o que o vermelho prova - que o teste acusa quando a regra e violada. Os outros 3 criterios ja tinham teste anterior a esta tarefa. |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| build | APROVADO | — | 0 | — |

**Riscos declarados:** A tarefa e RETROATIVA e o projeto e tdd: o gate de testes exige vermelho antes do verde (cmd-tarefa.ts:299) e o comando se recusa a registrar vermelho com a suite verde. Nao ha caminho honesto pelo task finalizar, e forjar o vermelho esta fora de questao. Levantado ao humano antes de executar · Atestar entrega de codigo que outra sessao escreveu depende de leitura do codigo e dos testes existentes, nao de execucao original; o atestado vale pelo que os testes cobrem, e a lacuna do criterio 4 foi encontrada justamente assim

### TASK-RF-041 · Recuperar o conserto do envelope da malha viaria: incluir o ponto inicial no bbox do useRoadGraph

`RF` · cerimonia Standard · esforco P/P · origem: RF-56

**Criterios de aceite, e o teste que cada um nomeia:**

- useRoadGraph considera startPoint no calculo do bounding box da malha
  → teste: `useRoadGraph.test.tsx > testes do envelope recuperados do commit 7d5aa5c`
- trajeto do inicio ate a parada 1 segue malha viaria em vez de linha reta
  → teste: `useRoadGraph.test.tsx (cobre a causa: sem o inicio no bbox o grafo nao cobre a origem e a perna cai para linha reta)`
- redefinicao do ponto inicial atualiza malha se estiver fora do bbox
  → teste: `useRoadGraph.test.tsx > recarga por mudanca de chave de bbox`

**Declarou mudar:**

- src/hooks/useRoadGraph.ts - o bbox da malha passa a incluir o startPoint da rota, e o controle de recarga passa a ser por CHAVE de bbox (bboxKey) em vez de contador de tentativas: se o inicio muda e sai do envelope, a malha recarrega
- src/pages/MapPage.tsx - uma linha: passa builderState.startPoint para useRoadGraph
- src/__tests__/hooks/useRoadGraph.test.tsx - testes do envelope com ponto inicial
- TUDO recuperado da branch local task/TASK-RF-040 (commit 7d5aa5c, 08/09), que nunca foi mergeada. Nada e' reescrito: o codigo e o teste sao os originais daquela sessao

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| testes | APROVADO | 11/09/26 20:03 | 0 | — |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| build | APROVADO | — | 0 | — |

**Riscos declarados:** O commit recuperado tem 3 meses de deriva? Nao: os dois arquivos do hook estao IDENTICOS na main ao pai do commit (91651a9), entao a recuperacao e limpa; so' MapPage mudou muito, e ali a alteracao e' de uma linha que ainda existe · A troca do controle de recarga (contador de tentativas -> chave de bbox) mexe na logica que a TASK-BG-006 consertou (o wedge do 'Carregando ruas...' eterno). Os testes do hook precisam continuar cobrindo aquele caso

### TASK-RF-042 · Completar os criterios do RF-55 com badge Ignorado e persistencia no roteiro exportado

`RF` · cerimonia Standard · esforco P/P · origem: RF-55

**Criterios de aceite, e o teste que cada um nomeia:**

- Badge Ignorado ao lado de Endereco selecionado
  → teste: `RoteiroPointSection.test.tsx > renderiza badge 'Ignorado' e botao 'Restaurar endereco' quando isIgnored e true (teste anterior a esta tarefa)`
- Persistencia de ignoredPointIds no roteiro SALVO
  → teste: `builder.test.ts > toPlannedRoute persists ignoredPointIds and HYDRATE restores them (teste anterior a esta tarefa)`
- Persistencia de ignoredPointIds no roteiro EXPORTADO
  → teste: `routeExport.test.ts > gera JSON versionado v1 reimportavel com rota e pontos (asercao NOVA)`

**Declarou mudar:**

- docs-mentor/requisitos/requisitos.json - RF-55 recebe os 2 criterios que existiam no RF-56 da branch perdida e faltavam aqui: badge Ignorado, e persistencia de ignoredPointIds no roteiro salvo E exportado
- src/__tests__/services/routeExport.test.ts - o fixture passa a ter um endereco ignorado e o teste de ida-e-volta afirma que ele sobrevive ao arquivo. Era a unica das 6 regras sem rede
- NENHUM arquivo de producao muda: os dois criterios ja eram cumpridos pelo codigo; o que faltava era o criterio escrito e, num deles, o teste

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| testes | APROVADO | dispensado (11/09/26 20:15) | 0 | Trabalho retroativo: os dois criterios ja eram cumpridos pelo codigo entregue em 1626097; esta tarefa escreve o criterio que faltava no catalogo e a asercao que faltava no teste de export. Vermelho impossivel - a suite ja passava. Evidencia equivalente: checagem de MUTACAO. Quebrei o createRouteExportPayload (route: { ...route, ignoredPointIds: undefined }), confirmei que o teste de ida-e-volta FALHA, e restaurei. Prova que a asercao acusa quando a regra e violada. |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| build | APROVADO | — | 0 | — |

**Riscos declarados:** Trabalho retroativo de novo: o codigo ja cumpria os dois criterios, entao a asercao nova nasce verde e nao ha vermelho possivel. Usado o mecanismo criado hoje (--vermelho-dispensado --motivo) com checagem de MUTACAO como evidencia equivalente

### TASK-CHORE-015 · Atualizar mentor-agent para v0.4.0

`CHORE` · cerimonia Standard · esforco P/P · origem: titulo-autossuficiente

**Criterios de aceite, e o teste que cada um nomeia:**

- Integridade referencial, marcadores e tetos do mentor verificados com sucesso
  → teste: `nao se aplica: verificado via node mentor.mjs verificar`
- Todos os gates do projeto (tipos, lint, testes, build) passando verde
  → teste: `nao se aplica: verificado via node mentor.mjs task gate TASK-CHORE-015 <gate>`

**Declarou mudar:**

- .mentor/ - atualizacao do pacote mentor-agent para v0.4.0 com novos scripts e validacoes
- .gitattributes - definicao de merge drivers para arquivos gerados do mentor
- .githooks/pre-push - script de barreira pre-push do mentor
- package.json - atualizacao da versao do mentor-agent para #v0.4.0
- docs-mentor/contexto.json - atualizacao de versao do pacote para 0.4.0 e registros de validacao manual
- docs-mentor/tarefas/concluidas/ - confirmacao de validacao manual aprovada nas 8 tarefas pendentes

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| testes | APROVADO | dispensado (11/09/26 23:44) | 0 | atualizacao de ferramenta de processo mentor-agent, sem alteracao em codigo de producao |
| build | APROVADO | — | 0 | — |

**Riscos declarados:** nenhum identificado

## Requisitos citados pelo lote

### RF-20 (RF) · implementado

Permitir alternar entre a sequencia Original e Meu roteiro; quando o roteiro for importado sem romaneio, Original fica indisponivel.

- A alternancia Original/Meu roteiro funciona quando ha romaneio vinculado.
- Roteiro importado de forma avulsa abre diretamente em Meu roteiro e comunica que Original nao existe.
- A decisao nao altera a ordem Shopee Stop/Sequence armazenada como referencia.

### RF-34 (RF) · pendente

Oferecer o botao Auto-roteirizar sobre um motor local testavel sem UI. O padrao Menos conversoes combina distancia e penalidade D3 com peso de 400m. O motor escolhe paradas do veiculo em pontos livres das ruas, independentes dos enderecos, agrupa entregas dentro do raio geometrico da ancora e devolve roteiro editavel com caminhos de veiculo e circuitos a pe coerentes.

- Dadas entregas viaveis e raio configurado, quando gerar o roteiro, entao cada endereco resolvido aparece uma vez, todos os seus pacotes sao preservados e haversine(ancora, endereco) <= raio para todo agrupamento automatico.
- Dadas ruas adjacentes, quando escolher a parada do veiculo, entao ela pode ficar numa rua diferente das entregas e nao precisa coincidir com nenhum endereco; incluir caso sintetico de rua paralela.
- Dado o modo padrao aprovado, quando comparar caminhos, entao usa metros + 400 * penalidade D3; retorna metricas distinguindo manobras, unidades D3 e distancia. Nao promete minimo global.
- Dados inicio e paradas, quando montar o percurso, entao considera o trecho inicial, mao unica do carro, transicoes nas ancoras e circuito a pe com retorno ao veiculo; a geometria exibida corresponde ao custo calculado.
- Dado endereco ou trecho inviavel, quando calcular, entao informa pendencias e distingue resultado parcial de completo; nao descarta entregas, fabrica ligacoes retas nem usa custo zero para trechos sem caminho.
- Dado o corpus de referencia, quando validar o motor, entao compara ao guloso por distancia sob entradas e metrica iguais; mede cobertura, raio, conversoes, km, paradas, caminhada e CPU antes da UI.
- Dado o corpus de romaneios reais locais, quando medir, entao mantem os dados privados e registra apenas resultados agregados; CI usa casos sinteticos reproduziveis.
- Dado o botao Auto-roteirizar, quando calcular, entao informa progresso e permite cancelar sem perder trabalho; resultado confirmado e editavel e persistente, inclusive a ancora livre do veiculo.

### RF-36 (RF) · implementado

Exportar e importar Roteiro em JSON para compartilhar ou continuar em outro dispositivo.

- Exportar gera JSON versionado com dados suficientes para reconstruir o roteiro.
- Importar reconstrui o roteiro em Meu roteiro mantendo ordem, paradas e metadados relevantes.
- Importacao avulsa sem romaneio respeita RF-20 e RN-21.

### RF-44 (RF) · implementado

A tela inicial deve listar romaneios salvos com cards tipados, roteiros vinculados e atalho para abrir o mapa em Meu roteiro.

- Cards mostram diferenca entre Romaneio e Roteiro de forma escaneavel.
- Roteiros vinculados aparecem junto do romaneio correspondente.
- Atalho abre o mapa diretamente em Meu roteiro quando aplicavel.

### RN-15 (RN) · implementado

Pn/En representa a nova ordem do Meu roteiro; Shopee Stop/Sequence permanece como identidade historica da planilha original.

- Pn/En muda conforme a ordem do roteiro salvo ou executado.
- Stop/Sequence original permanece disponivel como referencia imutavel.
- Exportacao e importacao preservam as duas referencias quando existirem.

### RN-21 (RN) · implementado

Cada rota pode ter no maximo um Roteiro vinculado; roteiro importado sem romaneio vira standalone.

- O app impede criar multiplos roteiros ativos para a mesma rota.
- Importacao com vinculo reconhecido associa ao romaneio correto.
- Importacao sem vinculo cria roteiro standalone sem modo Original.

### RF-50 (RF) · implementado

Permitir inserir nova parada em posicao arbitraria e reordenar paradas existentes no rascunho do roteiro

- Inserir parada em ordem especifica renumera subsequentes
- Mover parada para nova ordem ajusta a sequencia 1..n
- UI permite escolher posicao de insercao e reordenar na lista

### RF-51 (RF) · implementado

Permitir recomecar rascunho no cabecalho e focar ultima parada ao deletar com rotulo Deletar parada

- Botao Recomecar no cabecalho com confirmacao limpa todas as paradas do rascunho
- Ao deletar uma parada a ultima parada restante e selecionada automaticamente
- Botao de exclusao de parada exibe icone de lixeira e rotulo Deletar parada

### RF-52 (RF) · implementado

Garantir que o ponto semente escolhido pelo usuario seja a ancora e primeiro ponto da parada

- Ao criar uma parada a partir de um endereco selecionado com outros enderecos no raio, a ancora do veiculo e baseada no endereco escolhido pelo usuario e ele e o primeiro ponto (1º)
- A ordem a pe parte da ancora do ponto escolhido para os demais membros
- Ao resetar a ancora da parada em edicao, a ancora padrao respeita o ponto semente que originou a parada

### RF-53 (RF) · implementado

Resumo da parada agrupada com endereco completo do veiculo no titulo e selecao automatica da primeira entrega ao desagrupar

- Ao selecionar uma parada agrupada o titulo do resumo exibe o endereco completo da parada do veiculo herdado da co-ancora
- Na parada agrupada o card Endereco selecionado nao e exibido
- Ao desagrupar a parada o card Endereco selecionado exibe automaticamente a primeira entrega selecionada sem o selo de veiculo

### RF-54 (RF) · implementado

Nome unico para exportacao de roteiros em JSON composto por data do romaneio, 4 ultimos caracteres do AT e bairro predominante

- Nome de arquivo JSON segue padrao YYYY-MM-DD-XXXX-BAIRRO.json
- Data obtida do nome do arquivo (unico), dados da planilha (multi) ou data de importacao como fallback
- 4 ultimos caracteres do codigo Planned AT da rota
- Bairro mais frequente entre os enderecos da rota

### RF-55 (RF) · implementado

Permitir ignorar enderecos perigosos ou fora de rota excluindo-os da conclusao do roteiro e agrupando-os no painel

- Alternar status de um endereco entre ativo e ignorado no painel do Meu Roteiro
- Enderecos ignorados nao contam para a conclusao nem distancia do roteiro
- Enderecos ignorados aparecem agrupados ao final do painel geral com restauracao e localizacao
- Marcador do endereco ignorado utiliza cor e estilo diferenciado no mapa
- Badge Ignorado ao lado de Endereco selecionado
- Persistencia de ignoredPointIds no roteiro salvo e exportado

### RF-56 (RF) · implementado

Inclusao do ponto inicial na malha viaria do mapa para roteirizacao completa ate a primeira parada

- useRoadGraph considera startPoint no calculo do bounding box da malha
- trajeto do inicio ate a parada 1 segue malha viaria em vez de linha reta
- redefinicao do ponto inicial atualiza malha se estiver fora do bbox

## O que o script ja mediu

Fatos, nao vereditos. Quem da o nivel e voce.

- 153 arquivo(s) mudaram sem constar em nenhum `plano.muda` do lote: .githooks/pre-push, .github/workflows/quality.yml, .gitignore, .mentor/esquemas/tarefa.json, .mentor/manifesto.json, .mentor/nucleo.md, .mentor/processos/entrega.md, .mentor/processos/inicializacao.md, .mentor/processos/rascunho.md, .mentor/processos/tarefa.md, .mentor/scripts/arquivos.ts, .mentor/scripts/cli.ts, .mentor/scripts/cmd-auditar.ts, .mentor/scripts/cmd-campo.ts, .mentor/scripts/cmd-doctor.ts, .mentor/scripts/cmd-fila.ts, .mentor/scripts/cmd-gates.ts, .mentor/scripts/cmd-hooks.ts, .mentor/scripts/cmd-init.ts, .mentor/scripts/cmd-lancamento.ts
- TASK-SPIKE-001: 1 criterio(s) de aceite sem teste nomeado ("nao se aplica"). Criterio sem verificacao reproduzivel e' criterio NAO VERIFICADO
- TASK-SPIKE-001: o gate "testes" nunca foi visto vermelho. Teste que nunca falhou pode estar passando sem exercitar o codigo
- TASK-SPIKE-001: fechou com 1 achado(s) proprio(s) ja com destino
- TASK-CHORE-013: 3 criterio(s) de aceite sem teste nomeado ("nao se aplica"). Criterio sem verificacao reproduzivel e' criterio NAO VERIFICADO
- TASK-CHORE-014: 2 criterio(s) de aceite sem teste nomeado ("nao se aplica"). Criterio sem verificacao reproduzivel e' criterio NAO VERIFICADO
- TASK-BG-011: fechou com 10 achado(s) proprio(s) ja com destino
- TASK-CHORE-012: 4 criterio(s) de aceite sem teste nomeado ("nao se aplica"). Criterio sem verificacao reproduzivel e' criterio NAO VERIFICADO
- TASK-CHORE-012: fechou com 11 achado(s) proprio(s) ja com destino
- TASK-RF-030: gate "validacao_manual" fechou como NÃO EXECUTADO — motivo declarado: Fatia de dominio puro e arnes local, sem alteracao de UI, gestos, PWA ou deploy. A equivalencia da ancora e verificada por testes contra a funcao do app. Nao certifica uso Android; validacao de roteiro completo e integracao permanecem em RF-032/TEST-004/RF-034/RF-033.
- TASK-RF-030: fechou com 4 achado(s) proprio(s) ja com destino
- TASK-SPIKE-002: 1 criterio(s) de aceite sem teste nomeado ("nao se aplica"). Criterio sem verificacao reproduzivel e' criterio NAO VERIFICADO
- TASK-SPIKE-002: fechou com 2 achado(s) proprio(s) ja com destino
- TASK-RF-040: o gate "testes" teve o vermelho dispensado: "Trabalho retroativo: o RF-55 foi entregue no commit 1626097, sem ID de tarefa, entao o codigo ja existia e a suite ja passava quando a tarefa nasceu. Vermelho impossivel: --esperando-vermelho se recusa com a suite verde. Evidencia equivalente: checagem de MUTACAO documentada na narrativa (quebrei o ramo isIgnored ? IGNORED_MARKER_COLOR : ... , confirmei que o teste novo falha, restaurei), que prova o que o vermelho prova - que o teste acusa quando a regra e violada. Os outros 3 criterios ja tinham teste anterior a esta tarefa.". Auditor: verificar se ha prova por mutacao
- TASK-RF-042: o gate "testes" teve o vermelho dispensado: "Trabalho retroativo: os dois criterios ja eram cumpridos pelo codigo entregue em 1626097; esta tarefa escreve o criterio que faltava no catalogo e a asercao que faltava no teste de export. Vermelho impossivel - a suite ja passava. Evidencia equivalente: checagem de MUTACAO. Quebrei o createRouteExportPayload (route: { ...route, ignoredPointIds: undefined }), confirmei que o teste de ida-e-volta FALHA, e restaurei. Prova que a asercao acusa quando a regra e violada.". Auditor: verificar se ha prova por mutacao
- TASK-CHORE-015: 2 criterio(s) de aceite sem teste nomeado ("nao se aplica"). Criterio sem verificacao reproduzivel e' criterio NAO VERIFICADO
- TASK-CHORE-015: o gate "testes" teve o vermelho dispensado: "atualizacao de ferramenta de processo mentor-agent, sem alteracao em codigo de producao". Auditor: verificar se ha prova por mutacao

## O diff

```
.gitattributes                                     |    7 +
 .githooks/pre-push                                 |    5 +
 .github/workflows/quality.yml                      |    4 +-
 .gitignore                                         |   17 +-
 .mentor/esquemas/tarefa.json                       |    3 +
 .mentor/manifesto.json                             |   61 +-
 .mentor/nucleo.md                                  |    6 +-
 .mentor/processos/entrega.md                       |   21 +-
 .mentor/processos/inicializacao.md                 |    8 +-
 .mentor/processos/rascunho.md                      |    5 +
 .mentor/processos/tarefa.md                        |   21 +-
 .mentor/scripts/arquivos.ts                        |   60 +-
 .mentor/scripts/cli.ts                             |   22 +-
 .mentor/scripts/cmd-auditar.ts                     |   22 +-
 .mentor/scripts/cmd-campo.ts                       |   13 +-
 .mentor/scripts/cmd-doctor.ts                      |   70 +-
 .mentor/scripts/cmd-fila.ts                        |    3 +-
 .mentor/scripts/cmd-gates.ts                       |    2 +-
 .mentor/scripts/cmd-hooks.ts                       |  117 ++-
 .mentor/scripts/cmd-init.ts                        |   88 +-
 .mentor/scripts/cmd-lancamento.ts                  |    2 +-
 .mentor/scripts/cmd-referencia.ts                  |    3 +-
 .mentor/scripts/cmd-requisito.ts                   |  100 ++
 .mentor/scripts/cmd-resolver.ts                    |  144 +++
 .mentor/scripts/cmd-tarefa.ts                      |  134 ++-
 .mentor/scripts/cmd-verificar.ts                   |    4 +-
 .mentor/scripts/ids.ts                             |  127 ++-
 .mentor/scripts/instalar.mjs                       |   53 +
 .mentor/scripts/tipos.ts                           |   11 +
 .mentor/scripts/vistas.ts                          |   80 +-
 .mentor/skills/contratos-de-api/SKILL.md           |  112 ++
 .mentor/skills/data-modeling/SKILL.md              |   38 +
 .mentor/skills/github-ci/SKILL.md                  |  227 ++++
 .mentor/skills/mermaid/SKILL.md                    |   95 ++
 .mentor/skills/spike-e-investigacao/SKILL.md       |   53 +
 .mentor/skills/test-design/SKILL.md                |   66 ++
 .mentor/skills/ui-design/SKILL.md                  |   81 ++
 .mentor/tetos.json                                 |   13 +-
 README.md                                          |    4 +-
 .../auto-roteirizacao/README.md                    |  171 ++++
 .../auto-roteirizacao/anchors.arnes.ts             |  409 ++++++++
 .../auto-roteirizacao/corpus.test.ts               |  263 +++++
 .../auto-roteirizacao/corpus.ts                    |  264 +++++
 .../auto-roteirizacao/experimentArtifacts.test.ts  |  104 ++
 .../auto-roteirizacao/experimentArtifacts.ts       |  179 ++++
 .../auto-roteirizacao/experimentPaths.ts           |  224 ++++
 .../auto-roteirizacao/fundamental.arnes.ts         |  564 ++++++++++
 .../fundamentalExperiment.test.ts                  |  275 +++++
 .../auto-roteirizacao/fundamentalExperiment.ts     |  798 +++++++++++++++
 .../auto-roteirizacao/fundamentals.ts              |  135 +++
 .../auto-roteirizacao/prepareGraph.ts              |   96 ++
 .../auto-roteirizacao/vitest.corpus.config.ts      |   17 +
 .../spike-conversoes/amostrar.arnes.ts             |  114 +++
 .../spike-conversoes/area.ts                       |   36 +
 .../spike-conversoes/conversoes.ts                 |  199 ++++
 .../spike-conversoes/diagnostico.arnes.ts          |   51 +
 .../spike-conversoes/grafo.arnes.ts                |   13 +
 .../spike-conversoes/grafo.ts                      |   77 ++
 .../spike-conversoes/medicao.arnes.ts              |  109 ++
 .../spike-conversoes/medicao.txt                   |   49 +
 .../spike-conversoes/roteirizar.ts                 |  274 +++++
 .../spike-conversoes/sanidade.arnes.ts             |   60 ++
 .../spike-conversoes/vitest.spike.config.ts        |   22 +
 docs-mentor/aprendizados.md                        |  233 +++++
 docs-mentor/melhorias-do-pacote.md                 |   53 +-
 ...6-09-01-causa-erro-carregamento-malha-viaria.md |   92 ++
 .../rascunhos/2026-09-01-malha-viaria-paga.md      |  105 ++
 ...--analise-raciocinio-entregador-ancora-vs-ml.md |  282 +++++
 ...08--melhorias-de-ui-e-ergonomia-do-painel-e-.md |   56 +
 ...09--disciplina-de-escopo-e-rastreabilidade-n.md |   14 +
 ...experimento-forca-vehiclestopisdefault-false.md |   44 +
 docs-mentor/rascunhos/roteiro-real-ipanema-56.json |  444 ++++++++
 docs-mentor/referencias.md                         |    9 +
 docs-mentor/requisitos/requisitos.json             |  217 +++-
 docs-mentor/tarefas/TASK-RF-030-plano.md           |  301 ++++++
 docs-mentor/tarefas/TASK-SPIKE-002-plano.md        |  260 +++++
 docs-mentor/tarefas/abertas/TASK-RF-013.json       |   57 --
 docs-mentor/tarefas/abertas/TASK-RF-024.json       |    6 +-
 docs-mentor/tarefas/abertas/TASK-RF-029.json       |  107 +-
 docs-mentor/tarefas/abertas/TASK-RF-031.json       |   87 ++
 docs-mentor/tarefas/abertas/TASK-RF-032.json       |   87 ++
 docs-mentor/tarefas/abertas/TASK-RF-033.json       |   76 ++
 docs-mentor/tarefas/abertas/TASK-RF-034.json       |   85 ++
 docs-mentor/tarefas/abertas/TASK-SPIKE-001.json    |   45 -
 docs-mentor/tarefas/abertas/TASK-TEST-004.json     |   92 ++
 .../2026-09-05--18h34--TASK-SPIKE-001.json         |  113 ++
 .../2026-09-05--18h34--TASK-SPIKE-001.md           |   42 +
 .../2026-09-07--02h44--TASK-CHORE-013.json         |  115 +++
 .../2026-09-07--02h44--TASK-CHORE-013.md           |   18 +
 .../2026-09-07--03h44--TASK-CHORE-014.json         |  107 ++
 .../2026-09-07--03h44--TASK-CHORE-014.md           |   20 +
 .../concluidas/2026-09-07--14h23--TASK-BG-011.json |  203 ++++
 .../concluidas/2026-09-07--14h23--TASK-BG-011.md   |   25 +
 .../2026-09-07--15h21--TASK-CHORE-012.json         |  189 ++++
 .../2026-09-07--15h21--TASK-CHORE-012.md           |   17 +
 .../concluidas/2026-09-07--21h08--TASK-RF-013.json |  124 +++
 .../concluidas/2026-09-07--21h08--TASK-RF-013.md   |   20 +
 .../concluidas/2026-09-08--08h04--TASK-BG-012.json |  119 +++
 .../concluidas/2026-09-08--08h04--TASK-BG-012.md   |   28 +
 .../concluidas/2026-09-08--08h54--TASK-RF-035.json |  119 +++
 .../concluidas/2026-09-08--08h54--TASK-RF-035.md   |   17 +
 .../concluidas/2026-09-08--10h08--TASK-RF-036.json |  116 +++
 .../concluidas/2026-09-08--10h08--TASK-RF-036.md   |   16 +
 .../concluidas/2026-09-08--13h06--TASK-RF-037.json |  113 ++
 .../concluidas/2026-09-08--13h06--TASK-RF-037.md   |   20 +
 .../concluidas/2026-09-08--17h44--TASK-RF-038.json |  123 +++
 .../concluidas/2026-09-08--17h44--TASK-RF-038.md   |   42 +
 .../concluidas/2026-09-08--18h34--TASK-RF-039.json |  116 +++
 .../concluidas/2026-09-08--18h34--TASK-RF-039.md   |   31 +
 .../concluidas/2026-09-08--21h37--TASK-BG-013.json |  108 ++
 .../concluidas/2026-09-08--21h37--TASK-BG-013.md   |   18 +
 .../concluidas/2026-09-10--16h33--TASK-RF-030.json |  194 ++++
 .../concluidas/2026-09-10--16h33--TASK-RF-030.md   |  150 +++
 .../2026-09-11--03h11--TASK-SPIKE-002.json         |  127 +++
 .../2026-09-11--03h11--TASK-SPIKE-002.md           |  120 +++
 .../concluidas/2026-09-11--06h04--TASK-BG-014.json |  112 ++
 .../concluidas/2026-09-11--06h04--TASK-BG-014.md   |   85 ++
 .../concluidas/2026-09-11--06h44--TASK-BG-015.json |  106 ++
 .../concluidas/2026-09-11--06h44--TASK-BG-015.md   |   90 ++
 .../concluidas/2026-09-11--16h56--TASK-BG-016.json |  125 +++
 .../concluidas/2026-09-11--16h56--TASK-BG-016.md   |  119 +++
 .../concluidas/2026-09-11--20h01--TASK-RF-040.json |  114 +++
 .../concluidas/2026-09-11--20h01--TASK-RF-040.md   |   85 ++
 .../concluidas/2026-09-11--20h07--TASK-RF-041.json |  115 +++
 .../concluidas/2026-09-11--20h07--TASK-RF-041.md   |   78 ++
 .../concluidas/2026-09-11--20h16--TASK-RF-042.json |  113 ++
 .../concluidas/2026-09-11--20h16--TASK-RF-042.md   |   54 +
 .../2026-09-11--23h44--TASK-CHORE-015.json         |  114 +++
 .../2026-09-11--23h44--TASK-CHORE-015.md           |   18 +
 docs/README.md                                     |    4 +-
 docs/contexto-projeto-ai.md                        |    4 +-
 .../plano-infraestrutura-e-custos.md               |   14 +
 docs/requisitos/funcionais.md                      |    2 +-
 index.html                                         |    4 +-
 infra/cloudflare-tile-worker/README.md             |    6 +-
 infra/cloudflare-tile-worker/worker.js             |  274 +++--
 package-lock.json                                  |  373 ++++---
 package.json                                       |   21 +-
 public/romaneios/exemplo-rota-grande.xlsx          |  Bin 0 -> 104072 bytes
 romaneios/README.md                                |   12 +
 romaneios/enderecos-l31.json                       | 1082 ++++++++++++++++++++
 romaneios/gerar-romaneio-exemplo.mjs               |   20 +-
 src/__tests__/components/FileUploader.test.tsx     |   26 +-
 src/__tests__/components/RouteMap.test.tsx         |    2 +-
 .../components/map/MapModeToggle.test.tsx          |   34 +
 .../components/map/panel/PanelModeBar.test.tsx     |    8 +
 .../components/map/panel/PanelTitle.test.tsx       |   29 +
 .../map/panel/RoteiroOverviewSection.test.tsx      |  150 +++
 .../map/panel/RoteiroPanelHeader.test.tsx          |   25 +
 .../map/panel/RoteiroPointSection.test.tsx         |   47 +-
 .../map/panel/RoteiroStopSection.test.tsx          |   65 +-
 src/__tests__/config/deploymentConfig.test.ts      |   18 +
 src/__tests__/hooks/useRoadGraph.test.tsx          |   30 +-
 src/__tests__/hooks/useRouteUploader.test.ts       |    5 +-
 src/__tests__/pages/HomePage.test.tsx              |   47 +-
 src/__tests__/pages/MapPage.integration.test.tsx   |   10 +-
 src/__tests__/pages/MapPage.test.tsx               |  189 +++-
 src/__tests__/pages/SummaryPage.test.tsx           |  102 ++
 src/__tests__/services/graphCache.test.ts          |   30 +
 src/__tests__/services/graphDiagnostics.test.ts    |   25 +
 src/__tests__/services/manifestStorage.test.ts     |   18 +-
 src/__tests__/services/routeExport.test.ts         |  351 +++++++
 src/__tests__/utils/markers/roteiroModels.test.ts  |  336 +++++-
 src/__tests__/utils/routing/aStar.test.ts          |  250 ++++-
 .../utils/routing/autoRouteAnchors.test.ts         |  174 ++++
 src/__tests__/utils/routing/builder.test.ts        |  192 ++++
 src/__tests__/utils/routing/estimates.test.ts      |    6 +-
 src/__tests__/utils/routing/graph.test.ts          |   22 +-
 src/__tests__/utils/routing/osm.test.ts            |  121 ++-
 src/__tests__/utils/routing/overview.test.ts       |   16 +
 src/__tests__/utils/routing/vehicleStop.test.ts    |   94 +-
 src/__tests__/utils/routing/walkOrder.test.ts      |    7 +
 src/components/FileUploader.tsx                    |   37 +-
 src/components/RouteMap.tsx                        |    2 +-
 src/components/map/MapModeToggle.tsx               |    8 +-
 src/components/map/panel/PanelModeBar.tsx          |   11 +-
 src/components/map/panel/PanelSection.tsx          |    5 +-
 src/components/map/panel/PanelTitle.tsx            |   76 +-
 .../map/panel/RoteiroOverviewSection.tsx           |   70 +-
 src/components/map/panel/RoteiroPanelHeader.tsx    |   93 +-
 src/components/map/panel/RoteiroPointSection.tsx   |  115 ++-
 src/components/map/panel/RoteiroStopSection.tsx    |  143 +--
 src/components/map/panel/RouteProgressCard.tsx     |    6 +-
 src/components/map/panel/StopItem.tsx              |   10 +-
 src/components/shell/DeliverySettingsDialog.tsx    |   23 +-
 src/components/summary/PlannedRouteInfo.tsx        |   20 +-
 src/constants/uiLabels.ts                          |   61 +-
 src/hooks/useManifestFromUrl.ts                    |  Bin 1793 -> 1821 bytes
 src/hooks/useRoadGraph.ts                          |   69 +-
 src/hooks/useRouteUploader.ts                      |   58 +-
 src/pages/HomePage.tsx                             |   48 +-
 src/pages/MapPage.tsx                              |  277 ++++-
 src/pages/SummaryPage.tsx                          |   79 +-
 src/services/graphCache.ts                         |   48 +-
 src/services/graphDiagnostics.ts                   |   19 +-
 src/services/manifestStorage.ts                    |   49 +-
 src/services/routeExport.ts                        |  392 +++++++
 src/setupTests.ts                                  |   19 +
 src/types/autoRouting.ts                           |   81 ++
 src/types/hooks.ts                                 |    7 +-
 src/types/routeExport.ts                           |   49 +
 src/types/routing.ts                               |    2 +
 src/utils/markers/markerColors.ts                  |    8 +
 src/utils/markers/roteiroModels.ts                 |  168 ++-
 src/utils/routing/aStar.ts                         |  125 ++-
 src/utils/routing/autoRouteAnchors.ts              |  317 ++++++
 src/utils/routing/builder.ts                       |  125 ++-
 src/utils/routing/estimates.ts                     |    6 +-
 src/utils/routing/graph.ts                         |   47 +-
 src/utils/routing/match.ts                         |   54 +-
 src/utils/routing/osm.ts                           |  228 +++--
 src/utils/routing/overview.ts                      |   20 +-
 src/utils/routing/pedestrian.ts                    |   10 +-
 src/utils/routing/streets.ts                       |   39 +
 src/utils/routing/vehicleStop.ts                   |   50 +-
 src/utils/routing/walkOrder.ts                     |    5 +-
 tsconfig.app.json                                  |    1 -
 tsconfig.json                                      |    5 +-
 vite.config.ts                                     |    6 +
 219 files changed, 19190 insertions(+), 1201 deletions(-)
```


⚠️ **O diff foi recortado em 120000 de 1344367 caracteres.** O que nao coube nao foi auditado, e isso entra em "nao verificado" do relatorio.

```diff
diff --git a/.gitattributes b/.gitattributes
new file mode 100644
index 0000000..d098de9
--- /dev/null
+++ b/.gitattributes
@@ -0,0 +1,7 @@
+# Gerados pelo mentor-agent (merge=ours e regeneracao via mentor resolver-gerados)
+docs-mentor/contexto.md merge=ours
+docs-mentor/tarefas/backlog.md merge=ours
+docs-mentor/tarefas/reserva.md merge=ours
+docs-mentor/tarefas/concluidas/0-indice.md merge=ours
+# recusas.jsonl usa union: duplicatas de append entre branches sao toleradas no log
+docs-mentor/tarefas/recusas.jsonl merge=union
diff --git a/.githooks/pre-push b/.githooks/pre-push
new file mode 100644
index 0000000..72185d4
--- /dev/null
+++ b/.githooks/pre-push
@@ -0,0 +1,5 @@
+#!/bin/sh
+# Gerado por `mentor hooks --instalar`. Roda os gates e verificacoes de pre-push do mentor.
+# Em pre-push, nao em pre-commit: commit barato evita que alguem aprenda `--no-verify`.
+node mentor.mjs gates || exit 1
+node mentor.mjs hooks --pre-push "$@" || exit 1
diff --git a/.github/workflows/quality.yml b/.github/workflows/quality.yml
index 18fad34..a4d8bbe 100644
--- a/.github/workflows/quality.yml
+++ b/.github/workflows/quality.yml
@@ -18,10 +18,10 @@ jobs:
 
     steps:
       - name: Checkout
-        uses: actions/checkout@v4
+        uses: actions/checkout@v7
 
       - name: Setup Node
-        uses: actions/setup-node@v4
+        uses: actions/setup-node@v7
         with:
           node-version: 25
           cache: npm
diff --git a/.gitignore b/.gitignore
index db0f52e..767013f 100644
--- a/.gitignore
+++ b/.gitignore
@@ -64,4 +64,19 @@ Thumbs.db
 *.ntvs*
 *.njsproj
 *.sln
-*.sw?
\ No newline at end of file
+*.sw?
+# ------------------------------------------------------
+# 🧪 Cache do arnês de medição (TASK-SPIKE-001)
+# ------------------------------------------------------
+# Malha do OpenStreetMap baixada uma vez e guardada em arquivo para a medição não
+# depender da rede a cada execução. É CACHE, não evidência: apagar só faz a próxima
+# execução buscar de novo no Overpass. A evidência da medição é o `medicao.txt`,
+# que fica versionado ao lado.
+__utilidades-back-office__/spike-conversoes/.cache/
+
+# Logs e saidas temporarias do mentor
+.mentor-saidas/
+
+# Private real manifests and reproducible routing snapshots (TASK-RF-030).
+__utilidades-back-office__/romaneios/
+__utilidades-back-office__/auto-roteirizacao/.cache/
diff --git a/.mentor/esquemas/tarefa.json b/.mentor/esquemas/tarefa.json
index 13c2292..8589907 100644
--- a/.mentor/esquemas/tarefa.json
+++ b/.mentor/esquemas/tarefa.json
@@ -79,6 +79,7 @@
   "origem": null,
   "origem_aceita": "IDs resolviveis (RF RN RNF ADR DT REV) ou o token literal 'titulo-autossuficiente'. Vazio e' proibido.",
   "requisitos": [],
+  "sem_requisito_motivo": null,
   "criada_em": null,
   "iniciada_em": null,
   "commit_base": null,
@@ -115,6 +116,8 @@
       "executado_em": null,
       "vermelho_em": null,
       "vermelho_nota": "Quando o gate foi visto falhando antes de passar. Com metodo tdd ou bdd, o fechamento exige. Grave com: task gate <id> testes --esperando-vermelho",
+      "vermelho_dispensado": null,
+      "vermelho_dispensado_nota": "Quando o vermelho foi dispensado com prova por mutacao ({ dispensado_em, motivo }). Gravado com: task gate <id> testes --vermelho-dispensado --motivo \"...\"",
       "evidencia_url": null,
       "motivo": null
     }
diff --git a/.mentor/manifesto.json b/.mentor/manifesto.json
index 135339d..eb77f7f 100644
--- a/.mentor/manifesto.json
+++ b/.mentor/manifesto.json
@@ -1,6 +1,6 @@
 {
-  "versao": "0.2.2",
-  "gerado_em": "2026-08-31T23:42:56.029Z",
+  "versao": "0.4.0",
+  "gerado_em": "2026-09-12T01:29:17.861Z",
   "arquivos": {
     "esquemas/contexto.json": "e31c3ad8ec59b016",
     "esquemas/divida-tecnica.json": "0906f6786a8e63a1",
@@ -8,7 +8,7 @@
     "esquemas/referencia.json": "0ba0b8b908141561",
     "esquemas/requisito.json": "9ee0acf904e031c2",
     "esquemas/risco-aceito.json": "ae6093c47b8a624b",
-    "esquemas/tarefa.json": "4b12a8348920bef2",
+    "esquemas/tarefa.json": "2885221d13aa2b91",
     "guia/00-indice.md": "f6a742fd0dd37544",
     "guia/01-negocio.md": "6a6ff24fb3de0df4",
     "guia/02-conformidade.md": "bf3df1f317f4599e",
@@ -27,41 +27,50 @@
     "modelos/fichas.md": "92cdc7020d33fcc1",
     "modelos/listas-por-fase.md": "57377dc4538acc80",
     "modelos/varredura.md": "f3016bd789b30a83",
-    "nucleo.md": "aa635d66e51869a5",
+    "nucleo.md": "0f46525fbffebec0",
     "package.json": "1c9a0949072c4ea1",
     "processos/analise-de-impacto.md": "60318cd6189f0f28",
-    "processos/entrega.md": "4aecc0aee0269a5a",
-    "processos/inicializacao.md": "998ca645e12f4ba9",
+    "processos/entrega.md": "467922347778a037",
+    "processos/inicializacao.md": "78af76a69a23cfbd",
     "processos/padroes-de-stack.md": "7d7df1b15ba7de44",
-    "processos/rascunho.md": "8720690059a14569",
+    "processos/rascunho.md": "13c19607b370fe9f",
     "processos/revisao.md": "4c1e2e6a1722b5ab",
-    "processos/tarefa.md": "bbf5e095b4a08dd3",
+    "processos/tarefa.md": "cf3b97bbd18e5ad9",
     "processos/teste.md": "e904b9a054de5187",
     "regras.json": "5f5ddff0c236ed68",
-    "scripts/arquivos.ts": "59468fe870034096",
-    "scripts/cli.ts": "ea8c608e627be38f",
+    "scripts/arquivos.ts": "ef2b9b6f17179ee6",
+    "scripts/cli.ts": "3e2f470cdaebcc5c",
     "scripts/cmd-anotar.ts": "140d6492fb55d524",
-    "scripts/cmd-auditar.ts": "b3f05b8c8293c963",
-    "scripts/cmd-campo.ts": "b001e4d5fdbed173",
-    "scripts/cmd-doctor.ts": "8beba77508033bc2",
-    "scripts/cmd-fila.ts": "c13a9cae9972cf64",
-    "scripts/cmd-gates.ts": "a0700636ba2f6cfa",
-    "scripts/cmd-hooks.ts": "a301ddc62de7a155",
-    "scripts/cmd-init.ts": "d4188aab5889108b",
+    "scripts/cmd-auditar.ts": "8bef11909dde8ca5",
+    "scripts/cmd-campo.ts": "ab1eed484b32ace9",
+    "scripts/cmd-doctor.ts": "a32c0e2fd6891996",
+    "scripts/cmd-fila.ts": "12b00455fc0284ec",
+    "scripts/cmd-gates.ts": "dc5b327389ce58c6",
+    "scripts/cmd-hooks.ts": "1b2f2361989e5124",
+    "scripts/cmd-init.ts": "e7a8a91c10c47984",
     "scripts/cmd-invariante.ts": "6e387ba8d0eb96ab",
-    "scripts/cmd-lancamento.ts": "6fa8f32a5c0cab7d",
+    "scripts/cmd-lancamento.ts": "ec12f32185df06e7",
     "scripts/cmd-pacote.ts": "6499cbea7f4e652e",
-    "scripts/cmd-referencia.ts": "eeece6c2c998bd51",
+    "scripts/cmd-referencia.ts": "2d828a2f38b63cfc",
     "scripts/cmd-regras.ts": "a753f82f340943ca",
+    "scripts/cmd-requisito.ts": "4bbd2c116b8bcd63",
+    "scripts/cmd-resolver.ts": "d40be7e36a3d7ae5",
     "scripts/cmd-riscos.ts": "54da3ca4e24f28eb",
     "scripts/cmd-stack.ts": "b2eebe54b9a2b7cd",
-    "scripts/cmd-tarefa.ts": "90fd7ba2142e6d36",
-    "scripts/cmd-verificar.ts": "ff9f198a535599d5",
+    "scripts/cmd-tarefa.ts": "759a2833845dba3e",
+    "scripts/cmd-verificar.ts": "3ce01483c95d2112",
     "scripts/entrada.ts": "1a56522a3580b616",
-    "scripts/ids.ts": "5c3c5f77b263938e",
-    "scripts/instalar.mjs": "1e1a2a716cb7c800",
-    "scripts/tipos.ts": "3fba3f49ec481de5",
-    "scripts/vistas.ts": "77f90207129a2354",
-    "tetos.json": "87d25dd810f228b7"
+    "scripts/ids.ts": "b64a05cfaa370e69",
+    "scripts/instalar.mjs": "061e01d6b571b067",
+    "scripts/tipos.ts": "ac4b7d0736565099",
+    "scripts/vistas.ts": "a708fee25949ba2a",
+    "skills/contratos-de-api/SKILL.md": "99943749d9a1771e",
+    "skills/data-modeling/SKILL.md": "346a6a6afd3be72d",
+    "skills/github-ci/SKILL.md": "7fbecc6df0749576",
+    "skills/mermaid/SKILL.md": "cf7a4a723b7129f1",
+    "skills/spike-e-investigacao/SKILL.md": "5ab362eee5800a83",
+    "skills/test-design/SKILL.md": "0a58f5132c66958c",
+    "skills/ui-design/SKILL.md": "58eed0c8f16f9911",
+    "tetos.json": "5994cfcc2bf2187b"
   }
 }
diff --git a/.mentor/nucleo.md b/.mentor/nucleo.md
index 0c13a65..7143d50 100644
--- a/.mentor/nucleo.md
+++ b/.mentor/nucleo.md
@@ -56,6 +56,9 @@ uma mudança lógica, revertível sozinha, que deixa o gate verde.
    conta como mistura.
 5. **Cerimônia proporcional ao risco.** Corrigir typo não exige ADR; mudar estrutura de pastas, sim.
 6. **Avisar é obrigatório, agir exige aprovação.**
+7. **Postura ativa do mentor.** Em toda saudação ou início de sessão sem tarefa em andamento,
+   inspecione `docs-mentor/contexto.json` e o `doctor`, e apresente o diagnóstico do projeto com os
+   próximos passos recomendados em opções numeradas.
 
 ## 4 · Processo
 
@@ -118,7 +121,7 @@ O comando de cada um vive em `contexto.json → gates`. Gate que o projeto não
 para ele, e declará-lo é a primeira coisa a resolver, não um detalhe a contornar.
 
 ⚠️ **Rode o comando declarado, nunca um montado de memória.** Comando digitado de cabeça sai com
-código 0 tendo lido zero arquivo: verde que não checou nada. Use `task registrar-gate`, que executa e
+código 0 tendo lido zero arquivo: verde que não checou nada. Use `task gate <ID> <gate>`, que executa e
 grava comando, saída e horário. Declaração escrita à mão não vale como evidência.
 
 ## 8 · Quando parar e perguntar
@@ -139,4 +142,5 @@ prós e contras, recomende uma, e espere.
 | Escrever ou ajustar teste | `processos/teste.md` |
 | Publicar, mexer em ramo, esteira ou reversão | `processos/entrega.md` |
 | Revisar código | `processos/revisao.md` |
+| Diagramas, UI, API, CI, testes ou dados | `.mentor/skills/<skill>/SKILL.md` ou `docs-mentor/skills/` |
 | Campo `null` no contexto | o arquivo que o portão nomeia, por `guia/00-indice.md` |
diff --git a/.mentor/processos/entrega.md b/.mentor/processos/entrega.md
index 80976a3..853b4dd 100644
--- a/.mentor/processos/entrega.md
+++ b/.mentor/processos/entrega.md
@@ -25,8 +25,25 @@ foram entregues juntas.
 
 **Sempre publicável** (guia OPS-20). Quebrada, consertá-la vem antes de qualquer funcionalidade.
 
-**Protegida:** não aceita envio direto. Toda mudança entra por revisão com a esteira verde. Isso é
-configuração de plataforma, não código — ver a seção final.
+**Protegida:** não aceita envio direto. Toda mudança entra por revisão com a esteira verde. Quando `contexto.json` declara `revisao_antes_do_merge`, o hook de pre-push barra envios diretos para a `main`. A `main` local é espelho estrito de `origin/main` e não recebe trabalho em andamento.
+
+**Prova por Árvore em Squash Merge:**
+Quando o projeto adota merge por *squash* (gerando um commit único com novo SHA na linha principal), o Git local perde o vínculo de ancestrais e comandos como `git branch --merged` não reconhecem o ramo como entregue, fazendo o `git branch -d` recusar a exclusão.
+A evidência determinística de que o trabalho está entregue é a **prova por árvore vazia**:
+```bash
+git diff origin/main <branch>
+```
+Se o diff não contiver mudanças da branch (ou estiver vazio após sincronizar com `origin/main`), a árvore de trabalho da branch está 100% incorporada. O ramo local pode então ser excluído com segurança:
+```bash
+git branch -D <branch>
+```
+
+**Resolução de Conflitos em Gerados:**
+Conflitos concorrentes em arquivos derivados (`contexto.md`, `backlog.md`, `reserva.md`, `0-indice.md`), no log `recusas.jsonl` ou no modelo `contexto.json` são resolvidos determinísticamente pelo comando:
+```bash
+mentor resolver-gerados
+```
+Ele faz a fusão semântica de `contexto.json` preservando decisões de ambos os lados, une as linhas de `recusas.jsonl` e regenera as visões markdown diretamente do estado consolidado, sem riscos de inversão de `--ours` entre merge e rebase.
 
 **Integrar cedo e com frequência** (OPS-15). Ramo aberto há semanas é a forma mais invisível de
 desperdício, porque parece progresso.
diff --git a/.mentor/processos/inicializacao.md b/.mentor/processos/inicializacao.md
index 5606fc7..aa6e4c5 100644
--- a/.mentor/processos/inicializacao.md
+++ b/.mentor/processos/inicializacao.md
@@ -21,8 +21,12 @@ errado, e ele deixa de responder o que só ele sabe.
 
 ## Quatro fases
 
-**1 · Ler.** Repositório vazio pula esta fase. Existindo código, leia antes de perguntar qualquer
-coisa, e traga o que leu para a entrevista já preenchido, para o humano confirmar em vez de ditar.
+**1 · Ler.** Repositório vazio pula esta fase. Existindo código ou documentação prévia (`docs/`),
+**é proibido entrevistar do zero**. A IA deve:
+1. Ler a documentação existente em `docs/` e o código (`package.json`, `src/`).
+2. Mapear o que já está respondido e preencher um rascunho de `docs-mentor/contexto.json`.
+3. Migrar pendências vivas para `docs-mentor/requisitos/requisitos.json` e tarefas abertas em `docs-mentor/tarefas/abertas/` (fatiadas com `fatia_de`, sem decimais; ignorando histórico concluído).
+4. Entrevistar apenas as lacunas humanas e regulatórias reais que não estão no código.
 
 **2 · Entrevistar pelos portões, nesta ordem.** `V` → `C` → `0` primeiro, sempre, porque os três
 juntos decidem o nível de rigor, e o rigor decide o que é obrigatório em todos os outros. Os demais
diff --git a/.mentor/processos/rascunho.md b/.mentor/processos/rascunho.md
index 9883210..2b3e606 100644
--- a/.mentor/processos/rascunho.md
+++ b/.mentor/processos/rascunho.md
@@ -9,6 +9,11 @@ carrega_quando: ideia nova, planejamento inicial, ou anotar melhoria
 `docs-mentor/rascunhos/`. **Rascunho não é tarefa**: não tem gate, não tem critério de aceite, não entra na
 fila e não conta no ciclo. É onde a ideia pode estar errada sem custar nada.
 
+IA e desenvolvedor têm **liberdade total** nesta pasta: nenhum documento aqui precisa de formato rígido.
+Pode-se organizar livremente em arquivos ou subpastas por tema (ex: `comercial/`, `pesquisas/`, `prototipos/`, `analises/`).
+Se uma discussão de ideias ou levantamento comercial acontecer no chat, o mentor deve lembrar ativamente:
+*"Vou registrar essa análise em `docs-mentor/rascunhos/...` para mantermos o histórico preservado."*
+
 Projeto novo tem muito rascunho, e isso é o estado saudável. Requisito que nasce direto como tarefa
 é requisito que ninguém pensou.
 
diff --git a/.mentor/processos/tarefa.md b/.mentor/processos/tarefa.md
index 2115aae..3658df8 100644
--- a/.mentor/processos/tarefa.md
+++ b/.mentor/processos/tarefa.md
@@ -16,7 +16,7 @@ Nada que o script escreve é digitado ou conferido pela IA.
 
 ## Campos
 
-`tipo` RF · RN · RNF · BG · REF · DOC · CHORE · TEST
+`tipo` RF · RN · RNF · BG · REF · DOC · CHORE · TEST · SPIKE
 `valor` crítico · importante · desejável
 `urgencia` imediata · normal
 `esforco` duplo, humano/IA, cada um P · M · G · XG
@@ -43,6 +43,10 @@ Se nem uma coisa nem outra, **criar o registro durável é parte de criar a tare
 quem for executá-la. O teste que falsifica: *alguém que não estava na conversa consegue planejar
 esta tarefa?*
 
+**Rastreabilidade de Funcionalidades:** para tarefas do tipo `RF`, `RN` ou `RNF`, o `mentor task nova` exige
+obrigatoriamente `--requisitos <ID>` (ou `--sem-requisito --motivo "<justificativa>"` se for meramente técnica).
+Funcionalidade e regra de negócio não entram no código sem estarem catalogadas no `requisitos.json`.
+
 > **Medido:** quando o ponteiro não resolve, o texto vaza para dentro do backlog. Foram 57 linhas de
 > detalhamento em três tarefas não iniciadas, cerca de 90% duplicando documento que já existia. A
 > tarefa não tinha para onde apontar, então apontou para dentro de si mesma.
@@ -62,9 +66,15 @@ nasce, o que fazer quando a asercao nao escreve, e por que o vermelho e' obrigat
 Duas checagens caem no fechamento: todo criterio de aceite nomeia um teste, e com `tdd` ou `bdd` o
 gate de testes precisa ter sido visto vermelho antes do verde.
 
+**Reconciliação e Tarefa Retroativa:** quando o código já existe em produção ou já passa verde antes da tarefa,
+o vermelho não pode ser visto por ordem cronológica. Nesses casos, registre com:
+`mentor task gate <ID> testes --vermelho-dispensado --motivo "<evidencia de mutacao>"`
+⚠️ **A dispensa exige prova por teste de mutação:** documente no motivo como uma alteração proposital na regra de negócio
+faz o teste falhar. Sem teste de mutação, a dispensa vira passe-livre e a auditoria acusará teste sem exercício do código.
+
 ## Gates
 
-Rodados por `task registrar-gate`, que executa o comando declarado no contexto e grava comando,
+Rodados por `task gate <ID> <gate>`, que executa o comando declarado no contexto e grava comando,
 saída e horário. **Declaração escrita à mão não vale como evidência.**
 
 Sete rótulos, e nenhum outro:
@@ -88,8 +98,11 @@ proibido:** é ambíguo entre *"não temos"* e *"esquecemos de escrever"*.
 
 ## Fechamento
 
-A narrativa é o único texto livre da tarefa, teto 2.400 caracteres: decisões tomadas · o que **não**
-foi feito e por quê · aprendizados. O resto o script grava.
+A narrativa é o texto livre da tarefa, voltada para aprendizado humano, com teto expandido de 10.000
+caracteres (a IA consome o `.json` da tarefa concluída quando precisa apenas do resumo operacional):
+decisões tomadas · o que **não** foi feito e por quê · **armadilhas técnicas e aprendizados reais de
+testes manuais** (conflitos de porta/cache, persistência, peculiaridades de ambiente, falhas conceituais
+de UX). Resumo protocolar breve que omite armadilhas e histórico útil não é aceito. O resto o script grava.
 
 Duas listas separadas, e a separação é o que impede tarefa de gerar tarefa:
 
diff --git a/.mentor/scripts/arquivos.ts b/.mentor/scripts/arquivos.ts
index 0c24f27..c8af22c 100644
--- a/.mentor/scripts/arquivos.ts
+++ b/.mentor/scripts/arquivos.ts
@@ -89,7 +89,8 @@ export function caminhos(r: string = raizProjeto()) {
     abertas: join(docs, 'tarefas', 'abertas'),
     concluidas: join(docs, 'tarefas', 'concluidas'),
     backlog: join(docs, 'tarefas', 'backlog.md'),
-    recusas: join(docs, 'tarefas', 'recusas.json'),
+    recusas: join(docs, 'tarefas', 'recusas.jsonl'),
+    recusasLegado: join(docs, 'tarefas', 'recusas.json'),
     reservaMd: join(docs, 'tarefas', 'reserva.md'),
     indiceConcluidas: join(docs, 'tarefas', 'concluidas', '0-indice.md'),
     dividas: join(docs, 'dividas', 'dividas.json'),
@@ -107,22 +108,71 @@ export function garantirPasta(caminho: string): void {
   mkdirSync(caminho, { recursive: true })
 }
 
+function tentarLerArquivo(caminho: string): Buffer {
+  for (let i = 0; i < 5; i++) {
+    try {
+      return readFileSync(caminho)
+    } catch (e: any) {
+      if (i < 4 && (e.code === 'EBUSY' || e.code === 'UNKNOWN' || e.code === 'EPERM')) {
+        const t = Date.now() + 50
+        while (Date.now() < t) {}
+        continue
+      }
+      throw e
+    }
+  }
+  return readFileSync(caminho)
+}
+
+function tentarEscreverArquivo(caminho: string, conteudo: string | Buffer): void {
+  for (let i = 0; i < 5; i++) {
+    try {
+      writeFileSync(caminho, conteudo)
+      return
+    } catch (e: any) {
+      if (i < 4 && (e.code === 'EBUSY' || e.code === 'UNKNOWN' || e.code === 'EPERM')) {
+        const t = Date.now() + 50
+        while (Date.now() < t) {}
+        continue
+      }
+      throw e
+    }
+  }
+  writeFileSync(caminho, conteudo)
+}
+
 export function lerJson<T>(caminho: string): T {
-  return JSON.parse(readFileSync(caminho, 'utf8')) as T
+  return JSON.parse(lerTexto(caminho)) as T
 }
 
 export function escreverJson(caminho: string, dado: unknown): void {
   garantirPasta(dirname(caminho))
-  writeFileSync(caminho, JSON.stringify(dado, null, 2) + '\n', 'utf8')
+  tentarEscreverArquivo(caminho, JSON.stringify(dado, null, 2) + '\n')
 }
 
 export function lerTexto(caminho: string): string {
-  return readFileSync(caminho, 'utf8')
+  const buf = tentarLerArquivo(caminho)
+  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) {
+    return buf.subarray(2).toString('utf16le')
+  }
+  if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) {
+    const trocado = Buffer.from(buf.subarray(2))
+    trocado.swap16()
+    return trocado.toString('utf16le')
+  }
+  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) {
+    return buf.subarray(3).toString('utf8')
+  }
+  // Heuristica para redirecionamento do PowerShell (*>) sem BOM: sequencia de bytes pares imprimiveis e impares nulos
+  if (buf.length >= 4 && buf[1] === 0x00 && buf[3] === 0x00) {
+    return buf.toString('utf16le')
+  }
+  return buf.toString('utf8')
 }
 
 export function escreverTexto(caminho: string, texto: string): void {
   garantirPasta(dirname(caminho))
-  writeFileSync(caminho, texto.endsWith('\n') ? texto : texto + '\n', 'utf8')
+  tentarEscreverArquivo(caminho, texto.endsWith('\n') ? texto : texto + '\n')
 }
 
 export function existe(caminho: string): boolean {
diff --git a/.mentor/scripts/cli.ts b/.mentor/scripts/cli.ts
index ba581b9..a176c84 100644
--- a/.mentor/scripts/cli.ts
+++ b/.mentor/scripts/cli.ts
@@ -7,7 +7,8 @@ import { verificar } from './cmd-verificar.ts'
 import { relatar as relatarRegras, sincronizar as sincronizarRegras } from './cmd-regras.ts'
 import { doctor } from './cmd-doctor.ts'
 import { gates } from './cmd-gates.ts'
-import { instalarHooks } from './cmd-hooks.ts'
+import { instalarHooks, prePush } from './cmd-hooks.ts'
+import { resolverGerados } from './cmd-resolver.ts'
 import { encerrar as encerrarRisco, nova as novoRisco, relatar as relatarRiscos } from './cmd-riscos.ts'
 import { lancamento } from './cmd-lancamento.ts'
 import { relatorioDeCampo } from './cmd-campo.ts'
@@ -16,6 +17,7 @@ import { anotar } from './cmd-anotar.ts'
 import { preparar as prepararAuditoria, registrar as registrarAuditoria, relatar as relatarAuditorias, resolver as resolverPendencia } from './cmd-auditar.ts'
 import { novaReferencia, relatarReferencias } from './cmd-referencia.ts'
 import { novaInvariante, relatarInvariantes } from './cmd-invariante.ts'
+import { novoRequisito, relatarRequisitos } from './cmd-requisito.ts'
 import { regenerarTudo } from './vistas.ts'
 
 const AJUDA = `
@@ -24,6 +26,8 @@ mentor <comando>
   instalar [--destino <pasta>]         copia o pacote para dentro de um projeto
   manifesto                            grava o hash de cada arquivo do pacote (antes de empacotar)
   init                                 cria docs-mentor/ a partir dos esquemas
+  req [nova|listar]                    requisito funcional (RF), de negocio (RN) ou nao-funcional (RNF)
+       nova --tipo <RF|RN|RNF> --titulo "..." [--criterios "a|b" --prioridade <p>]
   inv [nova|listar]                    invariante de dominio ou restricao arquitetural
        nova --id <INV-N> --enunciado "..." --porque "..." [--mecanismo "..."]
   ref [nova|listar]                    referencia a requisito/ADR externo ou historico
@@ -41,6 +45,8 @@ mentor <comando>
   task iniciar <ID>                    escreve o esqueleto do plano e da narrativa
   task gate <ID> <gate>                executa o comando declarado e grava a evidencia
        [--esperando-vermelho]          registra o gate falhando ANTES de implementar (tdd/bdd)
+       [--vermelho-dispensado --motivo "..."] dispensa de vermelho com prova por mutacao (tdd/bdd)
+       [--arquivo <caminho> [--codigo-saida <n>]] registra evidencia de saida capturada em arquivo
        [--rotulo "..." --motivo "..."] so para os rotulos que nao nascem de execucao
        [--ressalva "..." --url "..."]
   task fila <ID> <n> | --soltar         fixa no topo da fila, ou devolve a ordem calculada
@@ -48,10 +54,11 @@ mentor <comando>
   stack <ferramenta> [--versao --papel] cria a convencao e registra no contexto
   regras [--sincronizar]               inventario das regras do pacote: quais viraram comando
   verificar                            marcadores, tetos de texto, integridade referencial
+  resolver-gerados                     resolve conflitos em gerados e funde contexto.json
   anotar --sobre pacote|projeto "..."  onde a melhoria vai nao e decisao de memoria
   reserva                              lista a reserva (nao entra no contexto)
   gates                                roda todos os gates declarados pelo projeto
-  hooks --instalar                     barreira de pre-push, sem dependencia (core.hooksPath)
+  hooks [--instalar|--pre-push]        barreira de pre-push: gates, branch principal e commits sem ID
   ra [nova|encerrar <ID>]              registro de riscos aceitos
        nova --titulo --justificativa --evidencia --aceito-por
             --revisar-em --tarefa-de-saida [--severidade --pacote --advisory]
@@ -94,6 +101,13 @@ function principal(argv: string[]): number {
     case 'instalar': instalar(flags); return process.exitCode === 1 ? 1 : 0
     case 'manifesto': gerarManifesto(); return 0
     case 'init': inicializar(); return 0
+    case 'req':
+    case 'requisito': {
+      const sub = posicionais[0]
+      if (!sub || sub === 'listar') { relatarRequisitos(flags); return 0 }
+      if (sub === 'nova') { novoRequisito(flags); return 0 }
+      throw new Error(`Subcomando de req desconhecido: "${sub}". Use: mentor req [listar|nova]`)
+    }
     case 'inv':
     case 'invariante': {
       const sub = posicionais[0]
@@ -116,9 +130,11 @@ function principal(argv: string[]): number {
       else relatarRegras()
       return 0
     case 'verificar': return verificar()
+    case 'resolver-gerados': return resolverGerados()
     case 'gates': return gates()
     case 'hooks':
-      if (!flags.instalar) throw new Error('Use: mentor hooks --instalar')
+      if (flags['pre-push']) return prePush()
+      if (!flags.instalar) throw new Error('Use: mentor hooks --instalar ou mentor hooks --pre-push')
       instalarHooks(); return 0
     case 'lancamento': return lancamento()
     case 'relatorio-de-campo': return relatorioDeCampo(flags)
diff --git a/.mentor/scripts/cmd-auditar.ts b/.mentor/scripts/cmd-auditar.ts
index 27b48c1..298c378 100644
--- a/.mentor/scripts/cmd-auditar.ts
+++ b/.mentor/scripts/cmd-auditar.ts
@@ -31,7 +31,7 @@ const LIMITE_ARQUIVO_NOVO = 20_000
  */
 const VISTAS_GERADAS = [
   'contexto.json', 'contexto.md', 'tarefas/backlog.md', 'tarefas/reserva.md',
-  'tarefas/recusas.json', 'tarefas/concluidas/0-indice.md',
+  'tarefas/recusas.json', 'tarefas/recusas.jsonl', 'tarefas/concluidas/0-indice.md',
   'requisitos/implementados.md', 'requisitos/pendentes.md', 'auditorias',
 ].map((v) => `${NOME_DOS_DOCUMENTOS}/${v}`)
   .map((v) => `:(exclude)${v}`)
@@ -119,8 +119,16 @@ function fatosMecanicos(lote: Tarefa[], arquivosDoDiff: string[]): string[] {
       if (g.rotulo === 'NÃO EXECUTADO' || g.rotulo === 'INVÁLIDO como gate') {
         fatos.push(`${t.id}: gate "${nome}" fechou como ${g.rotulo} — motivo declarado: ${g.motivo ?? '(nenhum)'}`)
       }
-      if (nome === 'testes' && !g.vermelho_em) {
-        fatos.push(`${t.id}: o gate "testes" nunca foi visto vermelho. Teste que nunca falhou pode estar passando sem exercitar o codigo`)
+      if (nome === 'testes') {
+        const disp = g.vermelho_dispensado ?? ((g as any).vermelho_dispensado_em ? {
+          dispensado_em: (g as any).vermelho_dispensado_em,
+          motivo: (g as any).vermelho_motivo ?? g.motivo ?? 'dispensado sem motivo registrado',
+        } : null)
+        if (disp) {
+          fatos.push(`${t.id}: o gate "testes" teve o vermelho dispensado: "${disp.motivo}". Auditor: verificar se ha prova por mutacao`)
+        } else if (!g.vermelho_em) {
+          fatos.push(`${t.id}: o gate "testes" nunca foi visto vermelho. Teste que nunca falhou pode estar passando sem exercitar o codigo`)
+        }
       }
     }
     if (t.achados.length) fatos.push(`${t.id}: fechou com ${t.achados.length} achado(s) proprio(s) ja com destino`)
@@ -213,7 +221,13 @@ function dossie(id: string, lote: Tarefa[], base: string | null, final: string |
     l.push('| :-- | :-- | :-- | --: | :-- |')
     for (const [nome, g] of Object.entries(t.gates)) {
       if (!g) continue
-      l.push(`| ${nome} | ${g.rotulo} | ${g.vermelho_em ?? '—'} | ${g.codigo_saida ?? '—'} | ${g.motivo ?? g.ressalva ?? '—'} |`)
+      const disp = g.vermelho_dispensado ?? ((g as any).vermelho_dispensado_em ? {
+        dispensado_em: (g as any).vermelho_dispensado_em,
+        motivo: (g as any).vermelho_motivo ?? g.motivo ?? '—',
+      } : null)
+      const vermelhoTexto = g.vermelho_em ?? (disp ? `dispensado (${disp.dispensado_em})` : '—')
+      const motivoTexto = g.motivo ?? g.ressalva ?? disp?.motivo ?? '—'
+      l.push(`| ${nome} | ${g.rotulo} | ${vermelhoTexto} | ${g.codigo_saida ?? '—'} | ${motivoTexto} |`)
     }
     l.push('')
     if (t.plano.riscos.length) { l.push(`**Riscos declarados:** ${t.plano.riscos.join(' · ')}`); l.push('') }
diff --git a/.mentor/scripts/cmd-campo.ts b/.mentor/scripts/cmd-campo.ts
index f1e63fe..47083b6 100644
--- a/.mentor/scripts/cmd-campo.ts
+++ b/.mentor/scripts/cmd-campo.ts
@@ -141,13 +141,16 @@ export function relatorioDeCampo(flags: Record<string, string | undefined> = {})
   const estouros = tetos()
   l.push(estouros.length ? estouros.map((a) => `- ${a.onde}: ${a.problema}`).join('\n') : 'Nenhum estouro.', '')
 
-  const anotadas = join(c.docs, 'melhorias-do-pacote.md')
-  if (existe(anotadas)) {
-    const itens = lerTexto(anotadas).split('\n').filter((x: string) => x.startsWith('- **'))
+  const anotadasDocs = join(c.docs, 'melhorias-do-pacote.md')
+  const anotadasMentor = join(c.pacote, 'melhorias-do-pacote.md')
+  const caminhosAnotadas = [anotadasDocs, anotadasMentor].filter((p) => existe(p))
+  if (caminhosAnotadas.length) {
+    const todosItens = caminhosAnotadas.flatMap((p) => lerTexto(p).split('\n').filter((x: string) => x.startsWith('- **')))
+    const itensUnicos = [...new Set(todosItens)]
     l.push('### A.10 Melhorias anotadas durante o uso', '')
-    l.push(`${itens.length} anotacao(oes) por \`mentor anotar --sobre pacote\`.`, '')
+    l.push(`${itensUnicos.length} anotacao(oes) por \`mentor anotar --sobre pacote\`.`, '')
     if (flags.detalhado) {
-      l.push(...itens, '')
+      l.push(...itensUnicos, '')
     } else {
       l.push('> Conteudo omitido: rode com `--detalhado` se voce e dono do projeto **e** do pacote.', '')
     }
diff --git a/.mentor/scripts/cmd-doctor.ts b/.mentor/scripts/cmd-doctor.ts
index 8fa3fd5..9a94d8a 100644
--- a/.mentor/scripts/cmd-doctor.ts
+++ b/.mentor/scripts/cmd-doctor.ts
@@ -73,7 +73,10 @@ function seguranca(ctx: Contexto): Linha[] {
     ? Object.entries(plataforma).filter(([k, v]) => !k.startsWith('_') && k !== 'outras' && v === null).map(([k]) => k)
     : []
   if (pendentes.length) {
-    linhas.push({ estado: 'atencao', texto: `${pendentes.length} configuracao(oes) de plataforma nao declarada(s): ${pendentes.join(', ')}. Nenhum script alcanca isso` })
+    linhas.push({
+      estado: 'atencao',
+      texto: `${pendentes.length} configuracao(oes) de plataforma nao declarada(s): ${pendentes.join(', ')}. Nenhum script alcanca isso (roteiro: Settings no GitHub -> Branches / Code security; veja .mentor/skills/github-ci/)`,
+    })
   }
   return linhas
 }
@@ -117,7 +120,10 @@ function qualidade(ctx: Contexto, tarefas: Tarefa[]): Linha[] {
   if (reqs.length) {
     linhas.push({ estado: 'neutro', texto: `${implementados} de ${reqs.length} requisitos implementados` })
   } else {
-    linhas.push({ estado: 'atencao', texto: 'nenhum requisito registrado: o que guia o trabalho nao esta escrito' })
+    linhas.push({
+      estado: 'atencao',
+      texto: 'nenhum requisito registrado: se migrou projeto legado, preencha docs-mentor/requisitos/requisitos.json com as pendencias vivas (ou use mentor req nova)',
+    })
   }
 
   const metodo = (ctx['qualidade'] as { metodo_de_teste?: string })?.metodo_de_teste
@@ -199,6 +205,64 @@ function processo(ctx: Contexto, tarefas: Tarefa[]): Linha[] {
     } else {
       linhas.push({ estado: 'ok', texto: `versionado, ${commits.stdout?.trim()} commit(s), remoto configurado` })
     }
+
+    // GIT 2/5: Detectar tarefas concluidas em branches locais ou remotas que nao chegaram na main/HEAD
+    try {
+      const rRefs = spawnSync('git', ['for-each-ref', '--format=%(refname:short)', 'refs/heads', 'refs/remotes'], {
+        cwd: raiz,
+        encoding: 'utf8',
+        timeout: 5_000,
+      })
+      if (rRefs.status === 0 && rRefs.stdout) {
+        const todasRefs = rRefs.stdout.split('\n').map((s) => s.trim()).filter(Boolean)
+        const c = caminhos()
+        const tarefasHead = new Set(
+          listar(c.concluidas, '.json').map((f) => f.replace(/^.*[\\/]/, '')),
+        )
+        const refMain = todasRefs.find((r) => r === 'origin/main' || r === 'main' || r === 'origin/master' || r === 'master')
+        if (refMain) {
+          const rMain = spawnSync('git', ['ls-tree', '-r', '--name-only', refMain, '--', 'docs-mentor/tarefas/concluidas', 'docs/tarefas/concluidas'], {
+            cwd: raiz,
+            encoding: 'utf8',
+            timeout: 5_000,
+          })
+          if (rMain.status === 0 && rMain.stdout) {
+            for (const f of rMain.stdout.split('\n').map((s) => s.trim()).filter(Boolean)) {
+              tarefasHead.add(f.replace(/^.*[\\/]/, ''))
+            }
+          }
+        }
+
+        const orfasPorBranch: Record<string, string[]> = {}
+        for (const ref of todasRefs) {
+          if (ref === 'HEAD' || ref === 'origin/HEAD' || ref === refMain) continue
+          const rTree = spawnSync('git', ['ls-tree', '-r', '--name-only', ref, '--', 'docs-mentor/tarefas/concluidas', 'docs/tarefas/concluidas'], {
+            cwd: raiz,
+            encoding: 'utf8',
+            timeout: 5_000,
+          })
+          if (rTree.status === 0 && rTree.stdout) {
+            const arquivos = rTree.stdout.split('\n').map((s) => s.trim().replace(/^.*[\\/]/, '')).filter((f) => f.endsWith('.json'))
+            const orfas = arquivos.filter((f) => !tarefasHead.has(f))
+            if (orfas.length > 0) {
+              orfasPorBranch[ref] = orfas
+            }
+          }
+        }
+
+        const totalOrfas = Object.values(orfasPorBranch).reduce((acc, l) => acc + l.length, 0)
+        if (totalOrfas > 0) {
+          const nomesBranches = Object.keys(orfasPorBranch).slice(0, 3).join(', ')
+          const nomesTarefas = Object.values(orfasPorBranch).flat().map((f) => f.replace(/\.json$/, '').replace(/^.*--/, '')).slice(0, 5).join(', ')
+          linhas.push({
+            estado: 'atencao',
+            texto: `${totalOrfas} tarefa(s) concluida(s) existem apenas em branches nao mergeadas (${nomesBranches}: ${nomesTarefas}). Mergear ou descartar antes de recriar.`,
+          })
+        }
+      }
+    } catch {
+      // continua
+    }
   }
 
   // Versionamento se responde em CONSTRUCAO, nao em pre-lancamento: quando ha o que publicar,
@@ -227,7 +291,7 @@ function processo(ctx: Contexto, tarefas: Tarefa[]): Linha[] {
   // Fase inicial sem nenhum rascunho: comecou-se a construir antes de entender.
   const FASE_INICIAL: Fase[] = ['ideia', 'descoberta']
   if (fase && FASE_INICIAL.includes(fase)) {
-    const rascunhos = listar(`${caminhos().docs}/rascunhos`, '.md').length
+    const rascunhos = listar(`${caminhos().docs}/rascunhos`, '.md').filter((a) => !a.endsWith('LEIA-ME.md') && !a.endsWith('README.md')).length
     linhas.push(rascunhos === 0
       ? { estado: 'atencao', texto: `fase "${fase}" sem nenhum rascunho. Fluxo atual, atores, estados, entidades e telas moram em docs-mentor/rascunhos/ (processos/rascunho.md)` }
       : { estado: 'ok', texto: `${rascunhos} rascunho(s) na fase "${fase}"` })
diff --git a/.mentor/scripts/cmd-fila.ts b/.mentor/scripts/cmd-fila.ts
index e4ec0b2..683c6dc 100644
--- a/.mentor/scripts/cmd-fila.ts
+++ b/.mentor/scripts/cmd-fila.ts
@@ -145,7 +145,8 @@ function encerrar(id: string, motivo: string, absorvidaPor: string | null): void
   tarefa.cancelamento_motivo = motivo
   tarefa.absorvida_por = absorvidaPor
   tarefa.concluida_em = agora().log
-  const base = `${agora().nome}--${tarefa.id}--CANCELADA`
+  const sufixo = absorvidaPor ? 'ABSORVIDA' : 'CANCELADA'
+  const base = `${agora().nome}--${tarefa.id}--${sufixo}`
   const narrativa = caminho.replace(/\.json$/, '.md')
   if (existe(narrativa)) {
     escreverTexto(`${c.concluidas}/${base}.md`, lerTexto(narrativa))
diff --git a/.mentor/scripts/cmd-gates.ts b/.mentor/scripts/cmd-gates.ts
index 72fcd45..0dfc66d 100644
--- a/.mentor/scripts/cmd-gates.ts
+++ b/.mentor/scripts/cmd-gates.ts
@@ -18,7 +18,7 @@ export function gates(): number {
   for (const [nome, g] of declarados) {
     const comando = g?.comando
     if (!comando) continue
-    const r = spawnSync(comando, { shell: true, stdio: 'inherit', cwd: caminhos().raiz })
+    const r = spawnSync(comando, { shell: true, stdio: 'inherit', cwd: caminhos().raiz, timeout: 120_000 })
     const ok = r.status === 0
     if (!ok) reprovou++
     console.log(`${ok ? '✓' : '✗'} ${nome}: ${comando}`)
diff --git a/.mentor/scripts/cmd-hooks.ts b/.mentor/scripts/cmd-hooks.ts
index 950d1eb..8b4a21a 100644
--- a/.mentor/scripts/cmd-hooks.ts
+++ b/.mentor/scripts/cmd-hooks.ts
@@ -1,8 +1,116 @@
 import { spawnSync } from 'node:child_process'
 import { caminhos, escreverTexto, existe } from './arquivos.ts'
+import { carregarContexto } from './vistas.ts'
+import { gates } from './cmd-gates.ts'
 import { chmodSync } from 'node:fs'
 import { join } from 'node:path'
 
+function exigePr(texto: unknown): boolean {
+  if (typeof texto !== 'string' || !texto.trim()) return false
+  const t = texto.toLowerCase()
+  if (t.includes('sem pr') || t.includes('dispensado') || t.includes('nao exige') || t.includes('nenhum')) return false
+  return t.includes('pr') || t.includes('pull request') || t.includes('revisao')
+}
+
+function arquivoEhCodigo(arquivo: string): boolean {
+  const norm = arquivo.replace(/\\/g, '/')
+  if (
+    norm.startsWith('docs-mentor/') ||
+    norm.startsWith('docs/') ||
+    norm.startsWith('.mentor/') ||
+    norm.startsWith('.githooks/') ||
+    norm.startsWith('.github/') ||
+    norm.startsWith('.obsidian/')
+  ) {
+    return false
+  }
+  if (norm.endsWith('.md') || norm.endsWith('.txt') || norm === '.gitignore' || norm === '.gitattributes' || norm === 'LICENSE') {
+    return false
+  }
+  return true
+}
+
+export function prePush(): number {
+  const c = caminhos()
+  // 1. Rodar os gates do projeto
+  const resultadoGates = gates()
+  if (resultadoGates !== 0) {
+    console.error('\nEnvio barrado: gate reprovado. Conserte, ou envie com --no-verify e assuma.')
+    return 1
+  }
+
+  if (!existe(join(c.raiz, '.git'))) return 0
+
+  let ctx: any = null
+  try { ctx = carregarContexto() } catch { return 0 }
+
+  const ramoPrincipal = ctx?.versionamento?.ramo_principal ?? 'main'
+  const revisao = ctx?.versionamento?.revisao_antes_do_merge
+
+  // 2. Verificar push direto no ramo principal com PR obrigatorio (GIT 5/5)
+  const rRamo = spawnSync('git', ['branch', '--show-current'], { cwd: c.raiz, encoding: 'utf8' })
+  const ramoAtual = (rRamo.stdout ?? '').trim()
+  if (ramoAtual === ramoPrincipal && exigePr(revisao)) {
+    console.error(
+      `\nEnvio barrado: push direto no ramo principal "${ramoPrincipal}".\n` +
+      `O projeto declara em docs-mentor/contexto.json (versionamento.revisao_antes_do_merge):\n` +
+      `"${revisao}"\n` +
+      `Crie uma branch de trabalho e envie uma Pull Request.\n`,
+    )
+    return 1
+  }
+
+  // 3. Verificar commits tocando codigo sem ID de tarefa (GIT 3/5)
+  try {
+    let revRange = `origin/${ramoPrincipal}..HEAD`
+    const rChecaRef = spawnSync('git', ['rev-parse', '--verify', `origin/${ramoPrincipal}`], { cwd: c.raiz, encoding: 'utf8' })
+    if (rChecaRef.status !== 0) {
+      if (ramoAtual !== ramoPrincipal) revRange = `${ramoPrincipal}..HEAD`
+      else revRange = 'HEAD~5..HEAD'
+    }
+
+    const rCommits = spawnSync('git', ['log', revRange, '--format=%H%x09%P%x09%s'], { cwd: c.raiz, encoding: 'utf8' })
+    if (rCommits.status === 0 && rCommits.stdout) {
+      const linhas = rCommits.stdout.split('\n').map((s) => s.trim()).filter(Boolean)
+      for (const linha of linhas) {
+        const [hash, paisStr, ...resto] = linha.split('\t')
+        if (!hash) continue
+        const titulo = resto.join('\t')
+        const pais = (paisStr ?? '').split(' ').filter(Boolean)
+
+        // Isencao: merge commits
+        if (pais.length > 1 || titulo.startsWith('Merge ')) continue
+        // Isencao: revert commits
+        if (titulo.startsWith('Revert ')) continue
+
+        // Verificar se toca codigo
+        const rDiff = spawnSync('git', ['diff-tree', '--no-commit-id', '--name-only', '-r', hash], { cwd: c.raiz, encoding: 'utf8' })
+        if (rDiff.status === 0 && rDiff.stdout) {
+          const arquivos = rDiff.stdout.split('\n').map((s) => s.trim()).filter(Boolean)
+          const arquivosCodigo = arquivos.filter(arquivoEhCodigo)
+          if (arquivosCodigo.length > 0) {
+            const temId = /\bTASK-[A-Z]+-\d{3}\b/.test(titulo) || /^[a-z]+(\([A-Z0-9_-]+\)):\s*.+/i.test(titulo)
+            if (!temId) {
+              console.error(
+                `\nEnvio barrado: commit sem ID de tarefa tocando codigo de producao.\n` +
+                `Commit: ${hash.slice(0, 7)} - "${titulo}"\n` +
+                `Arquivos afetados: ${arquivosCodigo.slice(0, 3).join(', ')}${arquivosCodigo.length > 3 ? '...' : ''}\n` +
+                `O Nucleo §2 exige que todo commit em codigo esteja vinculado a uma tarefa rastreada:\n` +
+                `Padrao: <tipo>(<ID da tarefa>): <descricao> (ex: feat(TASK-RF-001): adicionar validacao)\n`,
+              )
+              return 1
+            }
+          }
+        }
+      }
+    }
+  } catch {
+    // continua
+  }
+
+  return 0
+}
+
 /**
  * Barreira local, sem dependencia nenhuma: um arquivo versionado mais `core.hooksPath`.
  *
@@ -16,13 +124,10 @@ export function instalarHooks(): void {
 
   escreverTexto(arquivo, [
     '#!/bin/sh',
-    '# Gerado por `mentor hooks --instalar`. Roda os gates declarados em docs-mentor/contexto.json.',
+    '# Gerado por `mentor hooks --instalar`. Roda os gates e verificacoes de pre-push do mentor.',
     '# Em pre-push, nao em pre-commit: commit barato evita que alguem aprenda `--no-verify`.',
-    'node mentor.mjs gates || {',
-    '  echo ""',
-    '  echo "Envio barrado: gate reprovado. Conserte, ou envie com --no-verify e assuma."',
-    '  exit 1',
-    '}',
+    'node mentor.mjs gates || exit 1',
+    'node mentor.mjs hooks --pre-push "$@" || exit 1',
   ].join('\n'))
   try { chmodSync(arquivo, 0o755) } catch { /* Windows nao precisa, e nao falha por isso */ }
 
diff --git a/.mentor/scripts/cmd-init.ts b/.mentor/scripts/cmd-init.ts
index e8252a0..2730cb3 100644
--- a/.mentor/scripts/cmd-init.ts
+++ b/.mentor/scripts/cmd-init.ts
@@ -1,5 +1,6 @@
 import { join } from 'node:path'
-import { agoraIso, caminhos, escreverJson, escreverTexto, existe, garantirPasta, lerJson } from './arquivos.ts'
+import { spawnSync } from 'node:child_process'
+import { agoraIso, caminhos, escreverJson, escreverTexto, existe, garantirPasta, lerJson, lerTexto, NOME_DOS_DOCUMENTOS } from './arquivos.ts'
 import { regenerarTudo } from './vistas.ts'
 import type { Contexto } from './tipos.ts'
 
@@ -14,7 +15,7 @@ export function inicializar(): void {
     console.log('docs-mentor/contexto.json ja existe. Nada a fazer.')
     return
   }
-  for (const pasta of [c.abertas, c.concluidas, c.stack, c.adr, c.docs + '/requisitos', c.docs + '/dividas', c.docs + '/seguranca']) {
+  for (const pasta of [c.abertas, c.concluidas, c.stack, c.adr, c.docs + '/requisitos', c.docs + '/dividas', c.docs + '/seguranca', c.docs + '/rascunhos', c.docs + '/skills']) {
     garantirPasta(pasta)
   }
 
@@ -45,6 +46,38 @@ export function inicializar(): void {
     ].join('\n'),
   )
 
+  escreverTexto(
+    c.docs + '/skills/LEIA-ME.md',
+    [
+      '# Skills do Projeto',
+      '',
+      '> **Habilidades e instrucoes customizadas especificas deste projeto.**',
+      '> Esta pasta e sagrada: sobrevive a `mentor instalar --forcar`.',
+      '',
+      'Para adicionar uma habilidade no projeto:',
+      '1. Crie uma subpasta com o nome da habilidade: `docs-mentor/skills/<nome-da-habilidade>/`',
+      '2. Crie o arquivo `SKILL.md` contendo frontmatter YAML (`name`, `description`) e o roteiro tatico.',
+    ].join('\n'),
+  )
+
+  escreverTexto(
+    c.docs + '/rascunhos/LEIA-ME.md',
+    [
+      '# Rascunhos',
+      '',
+      '> **Zona livre para exploracao, analises comerciais, pesquisas, ideias e prototipos.**',
+      '> Rascunho nao e tarefa: nao tem gate, nao tem criterio de aceite e nao conta no ciclo.',
+      '',
+      'Organize livremente em arquivos ou subpastas (ex: `comercial/`, `pesquisas/`, `prototipos/`).',
+      '',
+      '**Destinos possiveis para um rascunho:**',
+      '1. **Requisito (`RF`, `RN`, `RNF`)**: quando a ideia vira o que o produto faz.',
+      '2. **ADR**: quando e uma decisao arquitetural cara de reverter.',
+      '3. **Tarefa**: quando vira trabalho acionavel e bem resolvido.',
+      '4. **Descartado**: com uma linha justificando o descarte.',
+    ].join('\n'),
+  )
+
   escreverTexto(
     c.docs + '/LEIA.md',
     [
@@ -57,17 +90,60 @@ export function inicializar(): void {
       '| `contexto.json` | `contexto.md` |',
       '| `requisitos/requisitos.json` | `requisitos/implementados.md`, `requisitos/pendentes.md` |',
       '| `tarefas/abertas/*.json` | `tarefas/backlog.md` (ciclo) e `tarefas/reserva.md` |',
-      '| `referencias.json` | ponteiros para itens historicos/externos |',
+      '| `referencias.json` | `referencias.md` (mapa de links para documentos do projeto) |',
       '| `invariantes.json` | invariantes de dominio e restricoes arquiteturais |',
       '| `glossario.md` | termos canonicos do dominio |',
+      '| `skills/` | habilidades e instrucoes customizadas do projeto |',
+      '| `rascunhos/` | zona livre para ideias, pesquisas e analises de negocio |',
+      '| `melhorias-do-pacote.md` | anotacoes sobre o mentor-agent (criado por `mentor anotar --sobre pacote`) |',
       '| `dividas/dividas.json` | ainda sem vista |',
       '| `seguranca/riscos-aceitos.json` | ainda sem vista |',
       '',
-      'Escritos a mao: a narrativa de cada tarefa concluida, as ADRs e as convencoes de stack.',
+      'Escritos a mao: a narrativa de cada tarefa concluida, as ADRs, as convencoes de stack, as skills e os rascunhos.',
     ].join('\n'),
   )
 
+  const gitignore = join(c.raiz, '.gitignore')
+  const entradaSaidas = '.mentor-saidas/'
+  if (existe(gitignore)) {
+    const conteudo = lerTexto(gitignore)
+    if (!conteudo.includes('.mentor-saidas')) {
+      escreverTexto(gitignore, `${conteudo.trimEnd()}\n\n# Logs e saidas temporarias do mentor\n${entradaSaidas}\n`)
+    }
+  } else {
+    escreverTexto(gitignore, `# Logs e saidas temporarias do mentor\n${entradaSaidas}\n`)
+  }
+
+  const gitattributes = join(c.raiz, '.gitattributes')
+  const regrasGitattributes = [
+    '# Gerados pelo mentor-agent (merge=ours e regeneracao via mentor resolver-gerados)',
+    `${NOME_DOS_DOCUMENTOS}/contexto.md merge=ours`,
+    `${NOME_DOS_DOCUMENTOS}/tarefas/backlog.md merge=ours`,
+    `${NOME_DOS_DOCUMENTOS}/tarefas/reserva.md merge=ours`,
+    `${NOME_DOS_DOCUMENTOS}/tarefas/concluidas/0-indice.md merge=ours`,
+    '# recusas.jsonl usa union: duplicatas de append entre branches sao toleradas no log',
+    `${NOME_DOS_DOCUMENTOS}/tarefas/recusas.jsonl merge=union`,
+  ].join('\n')
+
+  if (existe(gitattributes)) {
+    const conteudoAttr = lerTexto(gitattributes)
+    if (!conteudoAttr.includes('recusas.jsonl')) {
+      escreverTexto(gitattributes, `${conteudoAttr.trimEnd()}\n\n${regrasGitattributes}\n`)
+    }
+  } else {
+    escreverTexto(gitattributes, `${regrasGitattributes}\n`)
+  }
+
+  if (existe(join(c.raiz, '.git'))) {
+    try {
+      spawnSync('git', ['config', 'merge.ours.driver', 'true'], { cwd: c.raiz })
+    } catch {
+      // continua
+    }
+  }
+
   regenerarTudo()
-  console.log('Projeto inicializado. Proximo passo: responder os portoes V, C e 0,')
-  console.log('que decidem o nivel de rigor. Processo em .mentor/processos/inicializacao.md')
+  console.log('Projeto inicializado com sucesso!')
+  console.log('Proximo passo: ler docs/ e codigo se for legado, e responder os portoes V, C e 0 (nivel de rigor).')
+  console.log('Roteiro detalhado em .mentor/processos/inicializacao.md')
 }
diff --git a/.mentor/scripts/cmd-lancamento.ts b/.mentor/scripts/cmd-lancamento.ts
index 33ff8de..5dbab6e 100644
--- a/.mentor/scripts/cmd-lancamento.ts
+++ b/.mentor/scripts/cmd-lancamento.ts
@@ -28,7 +28,7 @@ export function lancamento(): number {
     itens.push({ nome: 'gates do projeto', veredito: 'NÃO EXECUTADO', detalhe: 'nenhum gate declarado em docs-mentor/contexto.json' })
   } else {
     for (const [nome, g] of declarados) {
-      const r = spawnSync(g!.comando!, { shell: true, encoding: 'utf8', cwd: caminhos().raiz })
+      const r = spawnSync(g!.comando!, { shell: true, encoding: 'utf8', cwd: caminhos().raiz, timeout: 120_000 })
       itens.push({
         nome: `gate ${nome}`,
         veredito: r.status === 0 ? 'APROVADO' : 'REPROVADO',
diff --git a/.mentor/scripts/cmd-referencia.ts b/.mentor/scripts/cmd-referencia.ts
index 5568b2a..a9507ae 100644
--- a/.mentor/scripts/cmd-referencia.ts
+++ b/.mentor/scripts/cmd-referencia.ts
@@ -1,6 +1,6 @@
 import { join } from 'node:path'
 import { agora, caminhos, escreverJson, existe } from './arquivos.ts'
-import { carregarReferencias } from './vistas.ts'
+import { carregarReferencias, regenerarTudo } from './vistas.ts'
 import type { ReferenciaExterna } from './tipos.ts'
 
 export function relatarReferencias(): void {
@@ -45,5 +45,6 @@ export function novaReferencia(flags: Record<string, string | undefined>): void
 
   refs.push(nova)
   escreverJson(c.referencias, refs)
+  regenerarTudo()
   console.log(`Referencia ${id} registrada -> ${onde}`)
 }
diff --git a/.mentor/scripts/cmd-requisito.ts b/.mentor/scripts/cmd-requisito.ts
new file mode 100644
index 0000000..8f04ad7
--- /dev/null
+++ b/.mentor/scripts/cmd-requisito.ts
@@ -0,0 +1,100 @@
+import { agora, caminhos, escreverJson, existe, lerJson } from './arquivos.ts'
+import { proximoIdDeRequisito } from './ids.ts'
+import { carregarRequisitos, regenerarTudo } from './vistas.ts'
+import type { Requisito } from './tipos.ts'
+
+const TIPOS_VALIDOS = ['RF', 'RN', 'RNF'] as const
+type TipoRequisito = (typeof TIPOS_VALIDOS)[number]
+
+const PRIORIDADES_VALIDAS = ['essencial', 'importante', 'desejavel'] as const
+type PrioridadeRequisito = (typeof PRIORIDADES_VALIDAS)[number]
+
+/**
+ * Cria um novo requisito funcional (RF), regra de negocio (RN) ou requisito nao-funcional (RNF).
+ * Gera ID deterministico, calcula datas e regenera vistas de pendentes/implementados.
+ */
+export function novoRequisito(flags: Record<string, string | undefined>): void {
+  const tipoRaw = (flags['tipo'] ?? 'RF').toUpperCase()
+  if (!TIPOS_VALIDOS.includes(tipoRaw as TipoRequisito)) {
+    throw new Error(`Tipo invalido: "${tipoRaw}". Use: RF (Funcional), RN (Regra de Negocio) ou RNF (Nao-Funcional).`)
+  }
+  const tipo = tipoRaw as TipoRequisito
+
+  const enunciado = flags['titulo'] ?? flags['enunciado']
+  if (!enunciado || !enunciado.trim()) {
+    throw new Error('Falta o titulo/enunciado do requisito. Use: --titulo "..." ou --enunciado "..."')
+  }
+
+  const prioridadeRaw = (flags['prioridade'] ?? 'importante').toLowerCase()
+  if (!PRIORIDADES_VALIDAS.includes(prioridadeRaw as PrioridadeRequisito)) {
+    throw new Error(`Prioridade invalida: "${prioridadeRaw}". Use: essencial, importante ou desejavel.`)
+  }
+  const prioridade = prioridadeRaw as PrioridadeRequisito
+
+  const criterios = flags['criterios']
+    ? flags['criterios'].split('|').map((c) => c.trim()).filter(Boolean)
+    : []
+
+  const historia = flags['historia']?.trim() || null
+  const adr = flags['adr']?.trim() || null
+
+  const c = caminhos()
+  const reqs = existe(c.requisitos) ? lerJson<Requisito[]>(c.requisitos) : []
+
+  const id = flags['id']?.trim() || proximoIdDeRequisito(tipo)
+  if (reqs.some((r) => r.id === id)) {
+    throw new Error(`Ja existe um requisito com o ID ${id}.`)
+  }
+
+  const novo: Requisito = {
+    id,
+    tipo,
+    enunciado: enunciado.trim(),
+    historia,
+    prioridade,
+    status: 'pendente',
+    criterios_aceite: criterios,
+    tarefas: [],
+    adr,
+    criado_em: agora().log,
+    implementado_em: null,
+    pendente_de_validacao: false,
+  }
+
+  reqs.push(novo)
+  escreverJson(c.requisitos, reqs)
+  regenerarTudo()
+
+  console.log(`Requisito ${novo.id} criado: "${novo.enunciado}" (${novo.tipo}, prioridade ${novo.prioridade}).`)
+  console.log(`Vistas atualizadas em docs-mentor/requisitos/pendentes.md.`)
+}
+
+/**
+ * Lista todos os requisitos organizados por tipo e status.
+ */
+export function relatarRequisitos(flags: Record<string, string | undefined> = {}): void {
+  const reqs = carregarRequisitos()
+  if (reqs.length === 0) {
+    console.log('Nenhum requisito cadastrado em docs-mentor/requisitos/requisitos.json.')
+    console.log('Crie o primeiro com: node mentor.mjs req nova --tipo RF --titulo "..."')
+    return
+  }
+
+  const tipoFiltro = flags['tipo']?.toUpperCase()
+  const filtrados = tipoFiltro ? reqs.filter((r) => r.tipo === tipoFiltro) : reqs
+
+  console.log(`REQUISITOS DO PROJETO (${filtrados.length} no total)\n`)
+  for (const tipo of TIPOS_VALIDOS) {
+    const doTipo = filtrados.filter((r) => r.tipo === tipo)
+    if (doTipo.length === 0) continue
+
+    const nomeTipo = tipo === 'RF' ? 'Requisitos Funcionais (RF)' : tipo === 'RN' ? 'Regras de Negocio (RN)' : 'Requisitos Nao-Funcionais (RNF)'
+    console.log(`=== ${nomeTipo} ===`)
+    for (const r of doTipo) {
+      const statusIcon = r.status === 'implementado' ? '✓' : r.status === 'cancelado' ? '✗' : '·'
+      const tarefasInfo = r.tarefas.length ? ` [tarefas: ${r.tarefas.join(', ')}]` : ''
+      console.log(`${statusIcon} ${r.id.padEnd(8)} ${r.enunciado} (${r.prioridade})${tarefasInfo}`)
+    }
+    console.log('')
+  }
+}
diff --git a/.mentor/scripts/cmd-resolver.ts b/.mentor/scripts/cmd-resolver.ts
new file mode 100644
index 0000000..a73c3fb
--- /dev/null
+++ b/.mentor/scripts/cmd-resolver.ts
@@ -0,0 +1,144 @@
+import { spawnSync } from 'node:child_process'
+import { caminhos, escreverTexto, existe, lerTexto } from './arquivos.ts'
+import { atualizarContagens, regenerarTudo } from './vistas.ts'
+
+/**
+ * Mescla recursivamente valores humanos preservando preenchimentos de ambos os lados.
+ * Campos como portões ("respondido" ou "dispensado" vs "aberto") priorizam a resposta.
+ */
+export function mesclarValores(vOurs: any, vTheirs: any): any {
+  if (vOurs === undefined || vOurs === null) return vTheirs
+  if (vTheirs === undefined || vTheirs === null) return vOurs
+
+  if (Array.isArray(vOurs) && Array.isArray(vTheirs)) {
+    const resultado = [...vOurs]
+    for (const item of vTheirs) {
+      if (typeof item === 'object' && item !== null) {
+        const idOuNome = item.id ?? item.nome
+        if (idOuNome) {
+          const idx = resultado.findIndex((x) => (x.id ?? x.nome) === idOuNome)
+          if (idx >= 0) resultado[idx] = mesclarValores(resultado[idx], item)
+          else resultado.push(item)
+          continue
+        }
+      }
+      if (!resultado.some((x) => JSON.stringify(x) === JSON.stringify(item))) {
+        resultado.push(item)
+      }
+    }
+    return resultado
+  }
+
+  if (typeof vOurs === 'object' && typeof vTheirs === 'object') {
+    const chaves = new Set([...Object.keys(vOurs), ...Object.keys(vTheirs)])
+    const res: Record<string, any> = {}
+    for (const k of chaves) {
+      res[k] = mesclarValores(vOurs[k], vTheirs[k])
+    }
+    return res
+  }
+
+  if (vOurs === 'aberto' && (vTheirs === 'respondido' || vTheirs === 'dispensado')) {
+    return vTheirs
+  }
+
+  return vOurs
+}
+
+function extrairConflitoTexto(conteudo: string): { ours: string; theirs: string } | null {
+  const padrao = /<<<<<<<[^\n]*\r?\n([\s\S]*?)=======\r?\n([\s\S]*?)>>>>>>>[^\n]*\r?\n?/g
+  if (!padrao.test(conteudo)) return null
+
+  let ours = ''
+  let theirs = ''
+  let ultimo = 0
+  padrao.lastIndex = 0
+  let match
+  while ((match = padrao.exec(conteudo)) !== null) {
+    const prefixo = conteudo.slice(ultimo, match.index)
+    ours += prefixo + match[1]
+    theirs += prefixo + match[2]
+    ultimo = padrao.lastIndex
+  }
+  const sufixo = conteudo.slice(ultimo)
+  ours += sufixo
+  theirs += sufixo
+  return { ours, theirs }
+}
+
+function carregarVersoesDeArquivo(caminhoRelativo: string): { ours: string | null; theirs: string | null } {
+  const c = caminhos()
+  const rOurs = spawnSync('git', ['show', `:2:${caminhoRelativo}`], { cwd: c.raiz, encoding: 'utf8' })
+  const rTheirs = spawnSync('git', ['show', `:3:${caminhoRelativo}`], { cwd: c.raiz, encoding: 'utf8' })
+  if (rOurs.status === 0 && rTheirs.status === 0 && rOurs.stdout && rTheirs.stdout) {
+    return { ours: rOurs.stdout, theirs: rTheirs.stdout }
+  }
+
+  const caminhoAbs = `${c.raiz}/${caminhoRelativo}`
+  if (existe(caminhoAbs)) {
+    const texto = lerTexto(caminhoAbs)
+    const extraido = extrairConflitoTexto(texto)
+    if (extraido) return extraido
+  }
+
+  return { ours: null, theirs: null }
+}
+
+export function resolverGerados(): number {
+  const c = caminhos()
+  console.log('Resolvendo conflitos em arquivos gerados e modelos hibridos...\n')
+
+  // 1. Resolver contexto.json
+  const relContexto = c.contexto.replace(c.raiz + '/', '').replace(c.raiz + '\\', '').replace(/\\/g, '/')
+  const { ours: ctxOursStr, theirs: ctxTheirsStr } = carregarVersoesDeArquivo(relContexto)
+  if (ctxOursStr && ctxTheirsStr) {
+    try {
+      const objOurs = JSON.parse(ctxOursStr)
+      const objTheirs = JSON.parse(ctxTheirsStr)
+      const mesclado = mesclarValores(objOurs, objTheirs)
+      escreverTexto(c.contexto, JSON.stringify(mesclado, null, 2) + '\n')
+      console.log('✓ docs-mentor/contexto.json: fusao semantica concluida com sucesso.')
+    } catch (e: any) {
+      console.warn(`! Nao foi possivel realizar fusao automatica de contexto.json: ${e.message}`)
+    }
+  } else {
+    console.log('– docs-mentor/contexto.json: sem marcadores ou conflito pendente.')
+  }
+
+  if (existe(c.contexto)) {
+    try {
+      atualizarContagens()
+    } catch {
+      // continua
+    }
+  }
+
+  // 2. Resolver recusas.jsonl
+  const relRecusas = c.recusas.replace(c.raiz + '/', '').replace(c.raiz + '\\', '').replace(/\\/g, '/')
+  const { ours: recOursStr, theirs: recTheirsStr } = carregarVersoesDeArquivo(relRecusas)
+  if (recOursStr && recTheirsStr) {
+    const linhasOurs = recOursStr.split('\n').map((l) => l.trim()).filter(Boolean)
+    const linhasTheirs = recTheirsStr.split('\n').map((l) => l.trim()).filter(Boolean)
+    const conjunto = new Set([...linhasOurs, ...linhasTheirs])
+    escreverTexto(c.recusas, Array.from(conjunto).join('\n') + '\n')
+    console.log('✓ docs-mentor/tarefas/recusas.jsonl: uniao de registros efetuada.')
+  }
+
+  // 3. Regenerar todas as vistas Markdown diretamente dos modelos
+  try {
+    regenerarTudo()
+    console.log('✓ Vistas Markdown (contexto.md, backlog.md, reserva.md, 0-indice.md) regeneradas.')
+  } catch (e: any) {
+    console.warn(`! Erro ao regenerar vistas markdown: ${e.message}`)
+  }
+
+  // 4. Git add nos arquivos resolvidos
+  const arquivosParaAdd = [c.contexto, c.recusas, c.contextoMd, c.backlog, c.reservaMd, c.indiceConcluidas].filter(existe)
+  if (arquivosParaAdd.length && existe(`${c.raiz}/.git`)) {
+    spawnSync('git', ['add', ...arquivosParaAdd], { cwd: c.raiz })
+    console.log('✓ Arquivos gerados adicionados ao stage do Git (git add).')
+  }
+
+  console.log('\nResolucao de gerados finalizada com sucesso.')
+  return 0
+}
diff --git a/.mentor/scripts/cmd-tarefa.ts b/.mentor/scripts/cmd-tarefa.ts
index ba25b84..0d420cc 100644
--- a/.mentor/scripts/cmd-tarefa.ts
+++ b/.mentor/scripts/cmd-tarefa.ts
@@ -49,6 +49,37 @@ export function nova(flags: Flags): void {
   const c = caminhos()
   const tipo = umDe<TipoTarefa>(exigir(flags, 'tipo'), TIPOS_TAREFA, 'tipo')
   const [humano, ia] = exigir(flags, 'esforco').split('/')
+  const reqs = (flags.requisitos ?? '').split(',').map((s) => s.trim()).filter(Boolean)
+  let semRequisitoMotivo: string | null = null
+
+  if (['RF', 'RN', 'RNF'].includes(tipo)) {
+    if (reqs.length === 0) {
+      if (flags['sem-requisito'] && flags.motivo && flags.motivo.trim()) {
+        semRequisitoMotivo = flags.motivo.trim()
+      } else {
+        throw new Error(
+          `Tarefa do tipo "${tipo}" exige --requisitos <ID> ou --sem-requisito --motivo "<justificativa>". Funcionalidade e regra de negocio precisam estar rastreadas no catalogo de requisitos.`,
+        )
+      }
+    } else if (existe(c.requisitos)) {
+      try {
+        const catalogo = lerJson<Array<{ id?: string }>>(c.requisitos)
+        const ids = new Set(catalogo.map((r) => r.id).filter(Boolean))
+        if (ids.size > 0) {
+          for (const rid of reqs) {
+            if (!ids.has(rid)) {
+              throw new Error(
+                `Requisito "${rid}" nao encontrado no catalogo (${c.requisitos}). Cadastre primeiro com "mentor req nova" ou vincule a um ID existente.`,
+              )
+            }
+          }
+        }
+      } catch (e: any) {
+        if (e.message?.includes('Requisito "')) throw e
+      }
+    }
+  }
+
   const t: Tarefa = {
     id: proximoIdDeTarefa(tipo),
     tipo,
@@ -68,7 +99,8 @@ export function nova(flags: Flags): void {
     fila: 'reserva',
     ordem: null,
     origem: exigir(flags, 'origem'),
-    requisitos: (flags.requisitos ?? '').split(',').map((s) => s.trim()).filter(Boolean),
+    requisitos: reqs,
+    sem_requisito_motivo: semRequisitoMotivo,
     criada_em: agora().log,
     iniciada_em: null,
     commit_base: null,
@@ -198,42 +230,104 @@ export function registrarGate(id: string, gate: string, flags: Flags): void {
     return
   }
 
-  const comando = ctx.gates[gate]?.comando
-  if (!comando) {
-    throw new Error(`O projeto nao declarou comando para o gate "${gate}" em docs-mentor/contexto.json. Declarar e a primeira coisa a resolver, nunca inventar um comando.`)
+  if (flags['vermelho-dispensado']) {
+    if (gate !== 'testes') {
+      throw new Error('Dispensa de vermelho so e valida para o gate "testes".')
+    }
+    if (!flags.motivo || !flags.motivo.trim()) {
+      throw new Error(
+        '--vermelho-dispensado exige --motivo com a evidencia de teste por mutacao (ex: provar que alteracao intencional no codigo faz o teste falhar).',
+      )
+    }
+    const gateExistente = tarefa.gates[gate]
+    if (gateExistente && (gateExistente.rotulo === 'APROVADO' || gateExistente.rotulo === 'APROVADO com ressalva')) {
+      if (!flags.arquivo && Boolean(flags['executar']) !== true) {
+        gateExistente.vermelho_dispensado = {
+          dispensado_em: agora().log,
+          motivo: flags.motivo.trim(),
+        }
+        escreverJson(caminho, tarefa)
+        console.log(`${id} · ${gate}: vermelho dispensado com justificativa de mutacao.`)
+        return
+      }
+    }
+  }
+
+  const caminhoArquivo = flags.arquivo
+  let comandoExecutado: string | null = null
+  let codigoSaida: number | null = null
+  let saidaBruta = ''
+
+  if (caminhoArquivo) {
+    if (!existe(caminhoArquivo)) {
+      throw new Error(`Arquivo de evidencia nao encontrado: "${caminhoArquivo}".`)
+    }
+    saidaBruta = lerTexto(caminhoArquivo)
+    comandoExecutado = ctx.gates[gate]?.comando ?? `arquivo:${caminhoArquivo}`
+    codigoSaida = flags['codigo-saida'] !== undefined ? Number(flags['codigo-saida']) : 0
+    if (isNaN(codigoSaida)) throw new Error(`--codigo-saida invalido: "${flags['codigo-saida']}". Deve ser numero.`)
+  } else {
+    const comando = ctx.gates[gate]?.comando
+    if (!comando) {
+      throw new Error(`O projeto nao declarou comando para o gate "${gate}" em docs-mentor/contexto.json. Declarar e a primeira coisa a resolver, nunca inventar um comando.`)
+    }
+    const r = spawnSync(comando, { shell: true, encoding: 'utf8', cwd: caminhos().raiz, timeout: 120_000 })
+    if (r.error && (r.error as { code?: string }).code === 'ETIMEDOUT') {
+      throw new Error(`Comando do gate "${gate}" excedeu o timeout de 120s: ${comando}`)
+    }
+    comandoExecutado = comando
+    codigoSaida = r.status
+    saidaBruta = `${r.stdout ?? ''}${r.stderr ?? ''}`
   }
-  const r = spawnSync(comando, { shell: true, encoding: 'utf8', cwd: caminhos().raiz })
-  const saida = recortar(`${r.stdout ?? ''}${r.stderr ?? ''}`.trim())
+
+  const saida = recortar(saidaBruta.trim())
 
   // Registrar o vermelho antes de implementar. Se sair verde aqui, o teste passa sem o codigo:
   // ele nao testa o que promete, e isso e' pior que nao existir.
   if (flags['esperando-vermelho']) {
-    if (r.status === 0) {
+    if (codigoSaida === 0) {
       throw new Error(
-        `Esperava vermelho e saiu verde. O teste passa sem o codigo, entao nao testa o que promete. Comando: ${comando}`,
+        `Esperava vermelho e saiu verde. O teste passa sem o codigo, entao nao testa o que promete. Comando: ${comandoExecutado}`,
       )
     }
     const anterior = tarefa.gates[gate]
     tarefa.gates[gate] = {
-      rotulo: 'FALHOU', vermelho_em: agora().log, comando, codigo_saida: r.status, saida,
+      rotulo: 'FALHOU', vermelho_em: agora().log, comando: comandoExecutado, codigo_saida: codigoSaida, saida,
       executado_em: agora().log, evidencia_url: anterior?.evidencia_url ?? null,
       motivo: null, ressalva: null,
     }
     escreverJson(caminho, tarefa)
-    console.log(`${id} · ${gate}: vermelho registrado (saida ${r.status}). Agora implemente ate o verde.`)
+    console.log(`${id} · ${gate}: vermelho registrado (saida ${codigoSaida}). Agora implemente ate o verde.`)
     return
   }
 
-  const rotulo: Rotulo = r.status === 0 ? 'APROVADO' : 'FALHOU'
+  if (flags['vermelho-dispensado'] && codigoSaida !== 0) {
+    throw new Error(
+      `Comando do gate falhou (saida ${codigoSaida}). A dispensa de vermelho exige que o teste passe verde (APROVADO). Se o teste falhou, voce tem um vermelho real — use --esperando-vermelho.`,
+    )
+  }
+
+  let rotulo: Rotulo = codigoSaida === 0 ? 'APROVADO' : 'FALHOU'
+  let motivo: string | null = null
+  if (codigoSaida === 0 && (!saida || !saida.trim())) {
+    rotulo = 'INVÁLIDO como gate'
+    motivo = 'Saída vazia: o comando não produziu evidência verificável'
+  }
+  const anterior = tarefa.gates[gate]
+  const disp = flags['vermelho-dispensado']
+    ? { dispensado_em: agora().log, motivo: (flags.motivo ?? '').trim() }
+    : (anterior?.vermelho_dispensado ?? null)
+
   tarefa.gates[gate] = {
-    rotulo, vermelho_em: tarefa.gates[gate]?.vermelho_em ?? null,
-    comando, codigo_saida: r.status, saida,
+    rotulo, vermelho_em: anterior?.vermelho_em ?? null,
+    comando: comandoExecutado, codigo_saida: codigoSaida, saida: saida || null,
     executado_em: agora().log, evidencia_url: flags.url ?? null,
-    motivo: null, ressalva: flags.ressalva ?? null,
+    motivo, ressalva: flags.ressalva ?? null,
+    vermelho_dispensado: disp,
   }
-  if (flags.ressalva) tarefa.gates[gate]!.rotulo = 'APROVADO com ressalva'
+  if (flags.ressalva && rotulo === 'APROVADO') tarefa.gates[gate]!.rotulo = 'APROVADO com ressalva'
   escreverJson(caminho, tarefa)
-  console.log(`${id} · ${gate}: ${tarefa.gates[gate]!.rotulo} (saida ${r.status})`)
+  console.log(`${id} · ${gate}: ${tarefa.gates[gate]!.rotulo} (saida ${codigoSaida})`)
 }
 
 // ---------------------------------------------------------------- finalizar
@@ -271,9 +365,13 @@ export function finalizar(id: string): void {
   const metodo = (ctx['qualidade'] as { metodo_de_teste?: MetodoDeTeste } | undefined)?.metodo_de_teste
   if (metodo && METODOS_COM_VERMELHO.includes(metodo) && tarefa.tipo !== 'SPIKE') {
     const gateTestes = tarefa.gates['testes']
-    if (ctx.gates['testes']?.comando && gateTestes && !gateTestes.vermelho_em) {
+    const foiDispensado = Boolean(
+      gateTestes?.vermelho_dispensado?.dispensado_em ||
+      (gateTestes as any)?.vermelho_dispensado_em,
+    )
+    if (ctx.gates['testes']?.comando && gateTestes && !gateTestes.vermelho_em && !foiDispensado) {
       impedimentos.push(
-        `metodo "${metodo}" exige o gate "testes" visto vermelho antes do verde. Registre com: task gate ${id} testes --esperando-vermelho`,
+        `metodo "${metodo}" exige o gate "testes" visto vermelho antes do verde (ou dispensado com: task gate ${id} testes --vermelho-dispensado --motivo "<mutacao>"). Registre com: task gate ${id} testes --esperando-vermelho`,
       )
     }
   }
diff --git a/.mentor/scripts/cmd-verificar.ts b/.mentor/scripts/cmd-verificar.ts
index 2aade1b..39e72f6 100644
--- a/.mentor/scripts/cmd-verificar.ts
+++ b/.mentor/scripts/cmd-verificar.ts
@@ -23,13 +23,13 @@ function casa(padrao: string, caminho: string): boolean {
  * - `atrito-de-campo.md` e' a fonte escrita da mesma parte B. As tres categorias sao opcionais;
  *   seus marcadores orientam a medicao, mas nao significam trabalho incompleto do projeto.
  */
-const MARCADOR_E_CONTEUDO = ['recusas.json', 'relatorio-de-campo.md', 'atrito-de-campo.md']
+const MARCADOR_E_CONTEUDO = ['recusas.json', 'recusas.jsonl', 'relatorio-de-campo.md', 'atrito-de-campo.md']
 
 /** Familia 1: nenhum marcador sobrevivente. O script escreve o esqueleto; ninguem entrega o esqueleto. */
 function marcadores(): Achado[] {
   const c = caminhos()
   const achados: Achado[] = []
-  const alvos = [...listar(c.docs, '.md'), ...listar(c.docs, '.json')]
+  const alvos = [...listar(c.docs, '.md'), ...listar(c.docs, '.json'), ...listar(c.docs, '.jsonl')]
     .filter((a) => !MARCADOR_E_CONTEUDO.some((nome) => a.endsWith(nome)))
   for (const a of alvos) {
     if (lerTexto(a).includes(MARCADOR)) {
diff --git a/.mentor/scripts/ids.ts b/.mentor/scripts/ids.ts
index e5be153..4997fbc 100644
--- a/.mentor/scripts/ids.ts
+++ b/.mentor/scripts/ids.ts
@@ -1,9 +1,76 @@
+import { spawnSync } from 'node:child_process'
+import { join } from 'node:path'
 import { caminhos, existe, lerJson, listar } from './arquivos.ts'
 import { carregarContexto, carregarReferencias } from './vistas.ts'
 import type { Tarefa } from './tipos.ts'
 
 const PADRAO_ID = /^TASK-([A-Z]+)-(\d{3})$/
 
+function obterRefsGit(raiz: string): string[] {
+  if (!existe(join(raiz, '.git'))) return []
+  try {
+    const r = spawnSync('git', ['for-each-ref', '--format=%(refname)', 'refs/heads', 'refs/remotes'], {
+      cwd: raiz,
+      encoding: 'utf8',
+      timeout: 5_000,
+    })
+    if (r.status !== 0 || !r.stdout) return []
+    return r.stdout.split('\n').map((s) => s.trim()).filter(Boolean)
+  } catch {
+    return []
+  }
+}
+
+function maiorIdDeTarefaNoGit(raiz: string, prefixo: string): number {
+  if (!existe(join(raiz, '.git'))) return 0
+  try {
+    const r = spawnSync('git', ['log', '--all', '--name-only', '--format=', '--', 'docs-mentor/tarefas/*', 'docs/tarefas/*'], {
+      cwd: raiz,
+      encoding: 'utf8',
+      timeout: 5_000,
+    })
+    let maior = 0
+    if (r.status === 0 && r.stdout) {
+      const re = new RegExp(`TASK-${prefixo}-(\\d{3})\\.json`)
+      for (const linha of r.stdout.split('\n')) {
+        const casou = re.exec(linha.trim())
+        if (casou && casou[1]) {
+          maior = Math.max(maior, Number(casou[1]))
+        }
+      }
+    }
+    return maior
+  } catch {
+    return 0
+  }
+}
+
+function maiorIdDeRequisitoNoGit(raiz: string, tipo: string): number {
+  if (!existe(join(raiz, '.git'))) return 0
+  try {
+    const refs = obterRefsGit(raiz)
+    if (refs.length === 0) return 0
+    const r = spawnSync('git', ['grep', '-h', '-E', `"id":\\s*"${tipo}-[0-9]+"`, ...refs, '--', 'docs-mentor/requisitos/*', 'docs/requisitos/*'], {
+      cwd: raiz,
+      encoding: 'utf8',
+      timeout: 5_000,
+    })
+    let maior = 0
+    if (r.status === 0 && r.stdout) {
+      const re = new RegExp(`"${tipo}-(\\d+)"`)
+      for (const linha of r.stdout.split('\n')) {
+        const casou = re.exec(linha)
+        if (casou && casou[1]) {
+          maior = Math.max(maior, Number(casou[1]))
+        }
+      }
+    }
+    return maior
+  } catch {
+    return 0
+  }
+}
+
 /**
  * Proximo ID de um prefixo: maior ja' usado, mais um, tres digitos.
  * Gaps nunca sao reaproveitados. A IA nunca ve' nem conta IDs.
@@ -11,7 +78,8 @@ const PADRAO_ID = /^TASK-([A-Z]+)-(\d{3})$/
  * Considera:
  * 1. Offsets declarados em `contexto.json -> offsets_de_id[prefixo]`;
  * 2. Tarefas locais em `abertas/` e `concluidas/`;
- * 3. Referencias externas em `referencias.json`.
+ * 3. Referencias externas em `referencias.json`;
+ * 4. Historico e branches irmas no Git (todas as refs).
  */
 export function proximoIdDeTarefa(prefixo: string): string {
   const c = caminhos()
@@ -53,6 +121,9 @@ export function proximoIdDeTarefa(prefixo: string): string {
     }
   }
 
+  // 4. Git (todas as branches e historico)
+  maior = Math.max(maior, maiorIdDeTarefaNoGit(c.raiz, prefixo))
+
   return `TASK-${prefixo}-${String(maior + 1).padStart(3, '0')}`
 }
 
@@ -66,3 +137,57 @@ export function proximoIdSimples(prefixo: string, existentes: string[]): string
   }
   return `${prefixo}-${maior + 1}`
 }
+
+/**
+ * Proximo ID de requisito (RF, RN, RNF).
+ * Considera offsets em contexto.json, requisitos.json e referencias.json.
+ */
+export function proximoIdDeRequisito(tipo: 'RF' | 'RN' | 'RNF'): string {
+  const c = caminhos()
+  let maior = 0
+
+  if (existe(c.contexto)) {
+    try {
+      const ctx = carregarContexto()
+      const offset = (ctx.offsets_de_id as Record<string, number> | undefined)?.[tipo]
+      if (typeof offset === 'number' && Number.isInteger(offset) && offset > 0) {
+        maior = Math.max(maior, offset)
+      }
+    } catch {
+      // continua
+    }
+  }
+
+  if (existe(c.requisitos)) {
+    try {
+      const reqs = lerJson<Array<{ id?: string }>>(c.requisitos)
+      const re = new RegExp(`^${tipo}-(\\d+)$`)
+      for (const r of reqs) {
+        if (typeof r.id !== 'string') continue
+        const casou = re.exec(r.id)
+        if (casou?.[1]) maior = Math.max(maior, Number(casou[1]))
+      }
+    } catch {
+      // continua
+    }
+  }
+
+  if (existe(c.referencias)) {
+    try {
+      const refs = carregarReferencias()
+      const re = new RegExp(`^${tipo}-(\\d+)$`)
+      for (const ref of refs) {
+        if (typeof ref.id !== 'string') continue
+        const casou = re.exec(ref.id)
+        if (casou?.[1]) maior = Math.max(maior, Number(casou[1]))
+      }
+    } catch {
+      // continua
+    }
+  }
+
+  // 4. Git (todas as branches e historico)
+  maior = Math.max(maior, maiorIdDeRequisitoNoGit(c.raiz, tipo))
+
+  return `${tipo}-${maior + 1}`
+}
diff --git a/.mentor/scripts/instalar.mjs b/.mentor/scripts/instalar.mjs
index be9baec..4422a66 100644
--- a/.mentor/scripts/instalar.mjs
+++ b/.mentor/scripts/instalar.mjs
@@ -5,6 +5,7 @@
 // chama daqui quando roda do repositorio. Duas copias da mesma logica divergiriam.
 import { cpSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
 import { dirname, join } from 'node:path'
+import { spawnSync } from 'node:child_process'
 
 const trocarRaizAdministrativa = (valor) => typeof valor === 'string'
   ? valor.replace(/^docs\//, 'docs-mentor/')
@@ -110,6 +111,54 @@ export function copiarPacote(origem, destino, forcar, migrarDocs = false) {
   try {
     cpSync(join(origem, '.mentor'), pastaDestino, { recursive: true })
     cpSync(join(origem, 'mentor.mjs'), join(destino, 'mentor.mjs'))
+
+    const gitignore = join(destino, '.gitignore')
+    if (existsSync(gitignore)) {
+      try {
+        const conteudo = readFileSync(gitignore, 'utf8')
+        if (!conteudo.includes('.mentor-saidas')) {
+          writeFileSync(gitignore, `${conteudo.trimEnd()}\n\n# Logs e saidas temporarias do mentor\n.mentor-saidas/\n`, 'utf8')
+        }
+      } catch {
+        // continua
+      }
+    }
+
+    const gitattributes = join(destino, '.gitattributes')
+    const regrasGitattributes = [
+      '# Gerados pelo mentor-agent (merge=ours e regeneracao via mentor resolver-gerados)',
+      'docs-mentor/contexto.md merge=ours',
+      'docs-mentor/tarefas/backlog.md merge=ours',
+      'docs-mentor/tarefas/reserva.md merge=ours',
+      'docs-mentor/tarefas/concluidas/0-indice.md merge=ours',
+      '# recusas.jsonl usa union: duplicatas de append entre branches sao toleradas no log',
+      'docs-mentor/tarefas/recusas.jsonl merge=union',
+    ].join('\n')
+
+    if (existsSync(gitattributes)) {
+      try {
+        const conteudoAttr = readFileSync(gitattributes, 'utf8')
+        if (!conteudoAttr.includes('recusas.jsonl')) {
+          writeFileSync(gitattributes, `${conteudoAttr.trimEnd()}\n\n${regrasGitattributes}\n`, 'utf8')
+        }
+      } catch {
+        // continua
+      }
+    } else {
+      try {
+        writeFileSync(gitattributes, `${regrasGitattributes}\n`, 'utf8')
+      } catch {
+        // continua
+      }
+    }
+
+    if (existsSync(join(destino, '.git'))) {
+      try {
+        spawnSync('git', ['config', 'merge.ours.driver', 'true'], { cwd: destino })
+      } catch {
+        // continua
+      }
+    }
   } catch (erro) {
     if (deveMigrar && existsSync(documentosAtuais) && !existsSync(documentosLegados)) {
       desfazerReferencias()
@@ -149,6 +198,10 @@ function texto() {
     'este repositorio, e traz a tabela que diz o que mais carregar em cada situacao. Nada aqui repete',
     'o que esta la: uma copia envelheceria em silencio.',
     '',
+    '**Postura ativa do mentor:** ao iniciar qualquer sessao, receber saudacoes ou quando nao houver',
+    'tarefa ativa em execucao, inspecione `docs-mentor/contexto.json` e o `doctor`, identifique o estado',
+    'do projeto e apresente imediatamente o diagnostico com os proximos passos recomendados.',
+    '',
     'Tres coisas valem antes mesmo dessa leitura, porque as duas primeiras sao irreversiveis:',
     '',
     '1. Nao commite, nao faca push e nao crie ramo sem autorizacao explicita da pessoa.',
diff --git a/.mentor/scripts/tipos.ts b/.mentor/scripts/tipos.ts
index b246a6e..0fdf0a8 100644
--- a/.mentor/scripts/tipos.ts
+++ b/.mentor/scripts/tipos.ts
@@ -89,6 +89,11 @@ export type NomeGate = (typeof NOMES_DE_GATE)[number]
 /** Marcador que o script escreve e a IA substitui. Nenhum pode sobreviver ao fechamento. */
 export const MARCADOR = 'PREENCHER\\:'
 
+export interface VermelhoDispensado {
+  dispensado_em: string
+  motivo: string
+}
+
 export interface RegistroGate {
   rotulo: Rotulo
   /**
@@ -103,6 +108,11 @@ export interface RegistroGate {
   evidencia_url: string | null
   motivo: string | null
   ressalva: string | null
+  vermelho_dispensado?: VermelhoDispensado | null
+  /** @deprecated Legado plano para retrocompatibilidade com TASK-RF-040/042 */
+  vermelho_dispensado_em?: string | null
+  /** @deprecated Legado plano */
+  vermelho_motivo?: string | null
 }
 
 export interface Plano {
@@ -130,6 +140,7 @@ export interface Tarefa {
   ordem: number | null
   origem: string
   requisitos: string[]
+  sem_requisito_motivo?: string | null
   criada_em: string
   iniciada_em: string | null
   /** HEAD no momento do `iniciar`. E' a base do diff que a auditoria le'. `null` = projeto sem git. */
diff --git a/.mentor/scripts/vistas.ts b/.mentor/scripts/vistas.ts
index 6bd0e83..ba819ec 100644
--- a/.mentor/scripts/vistas.ts
+++ b/.mentor/scripts/vistas.ts
@@ -1,4 +1,4 @@
-import { agora, agoraIso, caminhos, escreverJson, escreverTexto, existe, lerData, lerJson, listar, relogioDoPacote } from './arquivos.ts'
+import { agora, agoraIso, caminhos, escreverJson, escreverTexto, existe, lerData, lerJson, lerTexto, listar, relogioDoPacote } from './arquivos.ts'
 import { join } from 'node:path'
 import type { Contexto, DividaTecnica, Invariante, Recusa, ReferenciaExterna, Requisito, RiscoAceito, Tarefa } from './tipos.ts'
 
@@ -57,18 +57,51 @@ export function riscoVencido(r: RiscoAceito): boolean {
 
 export function carregarRecusas(): Recusa[] {
   const c = caminhos()
-  return existe(c.recusas) ? lerJson<Recusa[]>(c.recusas) : []
+  if (existe(c.recusas)) {
+    const texto = lerTexto(c.recusas).trim()
+    if (!texto) return []
+    const linhas = texto.split('\n').map((l) => l.trim()).filter(Boolean)
+    const recusas: Recusa[] = []
+    for (const linha of linhas) {
+      try {
+        recusas.push(JSON.parse(linha))
+      } catch {
+        // ignora linha malformada em merge
+      }
+    }
+    return recusas
+  }
+  if (existe(c.recusasLegado)) {
+    try {
+      return lerJson<Recusa[]>(c.recusasLegado)
+    } catch {
+      return []
+    }
+  }
+  return []
 }
 
 /**
- * Grava a recusa no momento em que ela acontece. E' o unico registro do pacote que so' cresce:
- * apagar recusa seria apagar a evidencia de onde ele atrapalha.
+ * Grava a recusa no momento em que ela acontece em formato JSON Lines (recusas.jsonl).
+ * E' o unico registro do pacote que so' cresce. O uso de JSON Lines com merge=union
+ * permite concorrencia append-only segura entre branches irmas.
  */
 export function registrarRecusa(comando: string, alvo: string, impedimentos: string[]): void {
   const c = caminhos()
-  const anteriores = carregarRecusas()
-  anteriores.push({ quando: agora().log, comando, alvo, impedimentos })
-  escreverJson(c.recusas, anteriores)
+  const nova: Recusa = { quando: agora().log, comando, alvo, impedimentos }
+  const linhaNova = JSON.stringify(nova) + '\n'
+
+  if (existe(c.recusas)) {
+    const atual = lerTexto(c.recusas).trimEnd()
+    escreverTexto(c.recusas, (atual ? atual + '\n' : '') + linhaNova)
+  } else if (existe(c.recusasLegado)) {
+    const anteriores = carregarRecusas()
+    anteriores.push(nova)
+    const conteudo = anteriores.map((r) => JSON.stringify(r)).join('\n') + '\n'
+    escreverTexto(c.recusas, conteudo)
+  } else {
+    escreverTexto(c.recusas, linhaNova)
+  }
 }
 
 export function carregarContexto(): Contexto {
@@ -264,10 +297,17 @@ export function gerarIndiceDeConcluidas(): void {
 export function gerarVistasDeRequisitos(): void {
   const c = caminhos()
   const reqs = carregarRequisitos()
+  const todasTarefas = carregarTarefas()
   const monta = (titulo: string, lista: Requisito[], colunaTarefa: string) => {
     const l = [`# ${titulo}`, '', AVISO, '', `| ID | Tipo | Enunciado | Prioridade | ${colunaTarefa} |`, '|---|---|---|---|---|']
     for (const r of lista) {
-      const t = r.tarefas.length ? r.tarefas.join(', ') : '-'
+      const tarefasVinculadas = new Set(r.tarefas)
+      for (const t of todasTarefas) {
+        if (t.requisitos.includes(r.id) || t.origem.includes(r.id)) {
+          tarefasVinculadas.add(t.id)
+        }
+      }
+      const t = tarefasVinculadas.size ? [...tarefasVinculadas].join(', ') : '-'
       l.push(`| \`${r.id}\` | ${r.tipo} | ${r.enunciado} | ${r.prioridade} | ${t} |`)
     }
     if (lista.length === 0) l.push('| | | Nenhum ainda | | |')
@@ -278,6 +318,29 @@ export function gerarVistasDeRequisitos(): void {
   escreverTexto(base + '/pendentes.md', monta('Requisitos ainda nao implementados', reqs.filter((r) => r.status !== 'implementado' && r.status !== 'cancelado'), 'Tarefa prevista'))
 }
 
+export function gerarReferenciasMd(): void {
+  const c = caminhos()
+  const refs = carregarReferencias()
+  const l = [
+    '# Referencias e Documentos do Projeto',
+    '',
+    AVISO,
+    '',
+    '> Mapa de links para documentos historicos, externos e complementares do projeto.',
+    '',
+    '| ID | Descricao | Link / Localizacao | Sistema |',
+    '|---|---|---|---|',
+  ]
+  for (const ref of refs) {
+    const link = ref.onde.startsWith('http')
+      ? `[${ref.onde}](${ref.onde})`
+      : `[\`${ref.onde}\`](../${ref.onde})`
+    l.push(`| \`${ref.id}\` | ${ref.titulo ?? '-'} | ${link} | ${ref.sistema ?? '-'} |`)
+  }
+  if (refs.length === 0) l.push('| | | Nenhuma referencia externa registrada | |')
+  escreverTexto(c.docs + '/referencias.md', l.join('\n'))
+}
+
 const IGNORAR = (chave: string) =>
   chave.startsWith('_') || chave.endsWith('_possiveis') || chave.endsWith('_aceita') ||
   chave === 'nota' || chave === 'guia'
@@ -424,5 +487,6 @@ export function regenerarTudo(): void {
   gerarReserva()
   gerarIndiceDeConcluidas()
   gerarVistasDeRequisitos()
+  gerarReferenciasMd()
   atualizarContagens()
 }
diff --git a/.mentor/skills/contratos-de-api/SKILL.md b/.mentor/skills/contratos-de-api/SKILL.md
new file mode 100644
index 0000000..9b18fce
--- /dev/null
+++ b/.mentor/skills/contratos-de-api/SKILL.md
@@ -0,0 +1,112 @@
+---
+name: contratos-de-api
+description: Metodologia de API Design-First, contratos tipados e desenvolvimento paralelo entre Frontend e Backend com mocks determinísticos.
+---
+
+# Habilidade · Contratos de API e Desenvolvimento Paralelo
+
+Esta habilidade orienta como transformar requisitos em contratos de interface estritos (DTOs, Zod, TypeScript, OpenAPI), permitindo que equipes ou IAs desenvolvam o Frontend e o Backend **simultaneamente**, sem que uma camada bloqueie a outra.
+
+---
+
+## 1. O Princípio do Contrato Primeiro (API Design-First)
+
+Quando um requisito funcional envolve interface e servidor, a primeira fatia de entrega deve ser o **Contrato Compartilhado**, nunca a implementação completa de uma das pontas.
+
+```
+                  ┌───────────────────────────────┐
+                  │ Requisito Funcional (ex: RF-1)│
+                  └───────────────┬───────────────┘
+                                  ▼
+                  ┌───────────────────────────────┐
+                  │   Fatia 1: Contrato Tipado    │
+                  │ (Schemas Zod / Types / DTOs)  │
+                  └───────┬───────────────┬───────┘
+                          │               │
+            ┌─────────────┴─────┐   ┌─────┴─────────────┐
+            ▼                   ▼   ▼                   ▼
+    ┌───────────────┐   ┌────────────────┐      ┌───────────────┐
+    │ Frontend      │   │ Mock Service / │      │ Backend       │
+    │ (Telas/Hooks) │   │ Fake Adapter   │      │ (Rotas/Banco) │
+    └───────────────┘   └────────────────┘      └───────────────┘
+```
+
+---
+
+## 2. Estrutura do Contrato Compartilhado
+
+Defina as entradas (Request), saídas (Response), parâmetros e erros em um módulo isolado compartilhado:
+
+```typescript
+// src/contratos/relatorios.ts (ou packages/contratos)
+import { z } from 'zod'
+
+// 1. Schema de Entrada (Request)
+export const ExportarRelatorioQuerySchema = z.object({
+  data_inicio: z.string().datetime(),
+  data_fim: z.string().datetime(),
+  formato: z.enum(['csv', 'xlsx', 'pdf']).default('csv'),
+  incluir_cancelados: z.boolean().default(false),
+})
+export type ExportarRelatorioQuery = z.infer<typeof ExportarRelatorioQuerySchema>
+
+// 2. Schema de Saida (Response de Sucesso)
+export const RelatorioGeradoResponseSchema = z.object({
+  id: z.string().uuid(),
+  status: z.enum(['processando', 'concluido', 'falhou']),
+  url_download: z.string().url().nullable(),
+  total_registros: z.number().int().nonnegative(),
+  gerado_em: z.string().datetime(),
+})
+export type RelatorioGeradoResponse = z.infer<typeof RelatorioGeradoResponseSchema>
+```
+
+---
+
+## 3. Padronização de Erros (RFC 7807 · Problem Details)
+
+Toda API deve responder erros seguindo uma estrutura previsível, com tipos literais para que o Frontend possa tratar mensagens específicas sem inspecionar strings livres:
+
+```typescript
+export const ErroPadraoSchema = z.object({
+  type: z.string().url().default('about:blank'),
+  title: z.string(),
+  status: z.number().int(),
+  detail: z.string(),
+  instance: z.string().optional(),
+  code: z.string(), // ex: "USUARIO_NAO_ENCONTRADO", "SALDO_INSUFICIENTE"
+  invalid_params: z.array(z.object({
+    name: z.string(),
+    reason: z.string(),
+  })).optional(),
+})
+export type ErroPadrao = z.infer<typeof ErroPadraoSchema>
+```
+
+---
+
+## 4. Desenvolvimento de Frontend com Mocks Determinísticos
+
+O Frontend consome uma interface de cliente de API (`ApiClient`) que possui duas implementações:
+1. `HttpApiClient`: chama os endpoints reais via fetch/axios.
+2. `MockApiClient`: responde dados falsos determinísticos sem necessidade de backend rodando.
+
+```typescript
+// Exemplo de Mock Handler para testes e desenvolvimento do Frontend
+export const mockRelatorioResponse: RelatorioGeradoResponse = {
+  id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
+  status: 'concluido',
+  url_download: 'https://storage.exemplo.com/relatorios/2026-09-02.csv',
+  total_registros: 142,
+  gerado_em: '2026-09-02T14:00:00Z',
+}
+```
+
+---
+
+## 5. Roteiro de Execução de Tarefas em Paralelo
+
+1. **Fatia 1 (Contrato)**: Criar os schemas Zod/TypeScript e os mocks em `src/contratos/`.
+2. **Fatia 2 (Frontend)**: Construir a tela e o hook integrados ao `MockApiClient`, cobrindo os 4 estados de UI.
+3. **Fatia 3 (Backend)**: Construir o controller, validação com Zod e persistência real no banco de dados.
+4. **Fatia 4 (Integração)**: Apontar o Frontend para o `HttpApiClient` e rodar testes de ponta a ponta (E2E/Smoke).
diff --git a/.mentor/skills/data-modeling/SKILL.md b/.mentor/skills/data-modeling/SKILL.md
new file mode 100644
index 0000000..9d2df75
--- /dev/null
+++ b/.mentor/skills/data-modeling/SKILL.md
@@ -0,0 +1,38 @@
+---
+name: data-modeling
+description: Modelagem relacional e documental de dados, índices estratégicos, invariantes de banco e migrações seguras (Expand-Contract).
+---
+
+# Habilidade · Modelagem de Dados e Migrações Seguras
+
+Esta habilidade orienta a tomada de decisão para desenho de esquemas de dados, integridade referencial e evolução de banco sem downtime.
+
+---
+
+## 1. Princípios de Modelagem de Banco
+
+1. **Invariantes moram no banco**: Restrições fundamentais do domínio (`UNIQUE`, `NOT NULL`, `FOREIGN KEY`, `CHECK (valor > 0)`) devem ser garantidas pelo esquema do banco, não apenas por validações de aplicação.
+2. **Índices conscientes**: Crie índices para colunas presentes em `WHERE`, `ORDER BY` e `JOIN`. Evite índices em excesso em tabelas de escrita massiva.
+3. **Tipagem precisa**: Use tipos específicos (ex: `timestamptz` para datas com fuso, `numeric/decimal` para valores monetários, `uuid` para identificadores globais).
+
+---
+
+## 2. O Padrão Expand and Contract (Evolução sem Downtime)
+
+Nunca renomeie ou remova uma coluna de banco em uma única migração com o sistema em produção. Siga os 3 passos:
+
+```
+Passo 1 (Expand)   ➔ Criar a nova coluna/tabela mantendo a antiga viva.
+                      Código novo escreve em ambas e lê da nova.
+Passo 2 (Migrate)  ➔ Backfill de dados legados em background.
+Passo 3 (Contract) ➔ Remover a coluna/tabela antiga após toda a frota estar atualizada.
+```
+
+---
+
+## 3. Checklist para Escrever Migrações Seguras
+
+- [ ] A migração é idempotente ou possui script de reversão (`down`) testado?
+- [ ] A criação de índices pesados usa modo concorrente (ex: `CREATE INDEX CONCURRENTLY` no PostgreSQL)?
+- [ ] Novas colunas `NOT NULL` possuem valor `DEFAULT` definido para não travar tabelas grandes durante o lock?
+- [ ] A operação foi validada localmente com volume representativo de dados?
diff --git a/.mentor/skills/github-ci/SKILL.md b/.mentor/skills/github-ci/SKILL.md
new file mode 100644
index 0000000..441528f
--- /dev/null
+++ b/.mentor/skills/github-ci/SKILL.md
@@ -0,0 +1,227 @@
+---
+name: github-ci
+description: Esteira de CI (GitHub Actions) e matriz completa de seguranca e protecao de repositorio do GitHub.
+---
+
+# Habilidade · GitHub CI e Seguranca
+
+Esta habilidade orienta a configuracao da esteira de integracao continua (CI) via GitHub Actions e a ativacao de todas as camadas da matriz de seguranca e governanca do GitHub.
+
+---
+
+## 1. Matriz de Seguranca do GitHub (Publico vs Privado)
+
+| Ferramenta / Recurso | Protege contra | Repositorio Publico | Repositorio Privado |
+| :--- | :--- | :--- | :--- |
+| **Dependency graph** | (Base para analise de dependencias) | Gratis | Gratis |
+| **Dependabot alerts / security updates** | Dependencias com vulnerabilidades conhecidas | Gratis (ligado por padrao) | Gratis (ativar em Settings) |
+| **Dependabot version updates** | Divida tecnica de versoes desatualizadas | Gratis (`dependabot.yml`) | Gratis (`dependabot.yml`) |
+| **Dependency review (no PR)** | Introduzir dependencia vulneravel no pull request | Gratis (via Action) | Pago / GitHub Advanced Security |
+| **GitHub Advisory Database** | (Base canonica de consulta de CVEs) | Gratis | Gratis |
+| **`SECURITY.md`** | Reporte desorganizado de falhas | Gratis | Gratis |
+| **Private vulnerability reporting** | Vazar falha de seguranca antes da correcao | Gratis (Settings) | Gratis (Settings) |
+| **Repository security advisories** | Divulgacao publica descoordenada | Gratis | Gratis |
+| **Secret scanning + push protection** | Chaves e segredos vazados no git push | Gratis | Pago / GitHub Advanced Security |
+| **Code scanning (CodeQL)** | Falhas de seguranca no codigo-fonte | Gratis (via Action) | Pago / GitHub Advanced Security |
+
+---
+
+## 2. Esteira de Qualidade (`.github/workflows/quality.yml`)
+
+A esteira de CI deve rodar os mesmos gates declarados em `docs-mentor/contexto.json -> gates`.
+
+```yaml
+name: Quality
+
+on:
+  push:
+    branches: [main]
+  pull_request:
+    branches: [main]
+
+jobs:
+  check:
+    name: Gates de Qualidade
+    runs-on: ubuntu-latest
+    steps:
+      - name: Checkout do codigo
+        uses: actions/checkout@v4
+
+      - name: Configurar Node.js
+        uses: actions/setup-node@v4
+        with:
+          node-version: 20
+          cache: 'npm'
+
+      - name: Instalar dependencias
+        run: npm ci
+
+      - name: Tipos (Typecheck)
+        run: npm run typecheck
+        if: always()
+
+      - name: Lint
+        run: npm run lint
+        if: always()
+
+      - name: Testes automatizados
+        run: npm test
+        if: always()
+
+      - name: Build de producao
+        run: npm run build
+        if: always()
+
+      - name: Verificacao do Mentor
+        run: node mentor.mjs verificar
+        if: always()
+```
+
+---
+
+## 3. Atualizacao de Dependencias (`.github/dependabot.yml`)
+
+Configure o Dependabot para monitorar ecossistemas e manter dependencias atualizadas:
+
+```yaml
+version: 2
+updates:
+  - package-ecosystem: "npm"
+    directory: "/"
+    schedule:
+      interval: "weekly"
+      day: "monday"
+      time: "06:00"
+      timezone: "America/Sao_Paulo"
+    open-pull-requests-limit: 5
+    labels:
+      - "dependencias"
+      - "CHORE"
+```
+
+---
+
+## 4. Analise de Dependencias em PRs (`actions/dependency-review-action`)
+
+Bloqueia a introducao de novas vulnerabilidades ou licencas restritivas diretamente no Pull Request:
+
+```yaml
+name: Dependency Review
+on: [pull_request]
+
+jobs:
+  dependency-review:
+    runs-on: ubuntu-latest
+    steps:
+      - name: Checkout
+        uses: actions/checkout@v4
+      - name: Review de Dependencias
+        uses: actions/dependency-review-action@v4
+        with:
+          fail-on-severity: high
+```
+
+---
+
+## 5. Politica de Seguranca (`SECURITY.md`)
+
+Mantenha um `SECURITY.md` na raiz ou em `.github/SECURITY.md` definindo o canal seguro de reporte:
+
+```markdown
+# Politica de Seguranca
+
+## Versoes Suportadas
+
+| Versao | Suportada |
+| :--- | :--- |
+| 1.x | Sim |
+| < 1.0 | Nao |
+
+## Reportando uma Vulnerabilidade
+
+Por favor, **nao abra issues publicas** para vulnerabilidades de seguranca.
+Utilize a opcao **Private Vulnerability Reporting** na aba *Security -> Advisories -> Report a vulnerability* deste repositorio.
+
+Nos comprometemos a responder em ate 48 horas uteis com uma avaliacao inicial e plano de mitigacao.
+```
+
+---
+
+## 6. Analise Estatica de Codigo (CodeQL)
+
+Para repositorios publicos (ou privados com GHAS), crie `.github/workflows/codeql.yml`:
+
+```yaml
+name: "CodeQL"
+
+on:
+  push:
+    branches: [main]
+  pull_request:
+    branches: [main]
+  schedule:
+    - cron: '0 3 * * 1'
+
+jobs:
+  analyze:
+    name: Analise CodeQL
+    runs-on: ubuntu-latest
+    permissions:
+      actions: read
+      contents: read
+      security-events: write
+
+    strategy:
+      fail-fast: false
+      matrix:
+        language: ['javascript-typescript']
+
+    steps:
+      - name: Checkout
+        uses: actions/checkout@v4
+
+      - name: Inicializar CodeQL
+        uses: github/codeql-action/init@v3
+        with:
+          languages: ${{ matrix.language }}
+
+      - name: Executar Analise CodeQL
+        uses: github/codeql-action/analyze@v3
+```
+
+---
+
+## 7. Operacoes e Troubleshooting de CI com GitHub CLI
+
+### A. Latencia de Disparo do GitHub Actions
+Apos o `git push`, o GitHub Actions pode levar alguns segundos para registrar a execucao. Consultar imediatamente com `gh run list --commit <hash>` pode retornar `"no runs found"`.
+* **Como proceder:** Aguarde de 5 a 10 segundos antes da primeira consulta ou filtre pela branch ativa:
+  ```bash
+  gh run list --branch main --limit 3
+  ```
+
+### B. Diagnostico Isolado de Falhas
+Nem toda quebra de CI significa erro no codigo implementado:
+1. **Falha de Codigo (Lint, Typecheck, Testes, Build):** Quebra direta das invariantes do projeto; deve ser corrigida na tarefa.
+2. **Falha de Auditoria de Seguranca (`npm audit` / Dependency Review):** Novos advisories no banco de dados do npm podem reprovar commits verdes anteriores. Trate como evento operacional: consulte o advisory reportado e, se for falso positivo ou sem patch disponivel imediato, registre em `docs-mentor/seguranca/riscos-aceitos.json` com prazo e responsavel.
+
+### C. Acesso a Logs com Erro 403 / Permissao Restrita
+Se a API do GitHub negar a leitura detalhada do log via API REST por token com escopo restrito, use a extracao direta da falha para arquivo local isolado:
+```bash
+gh run view <run-id> --log-failed > .mentor-saidas/ci-falha.log
+```
+
+### D. Fila de Dependabot sob Branch Protection
+Apos proteger o ramo `main`, PRs automaticos do Dependabot que forem abertos em lote nao devem ser aprovados simultaneamente:
+1. Ao mesclar o primeiro PR, o ramo `main` avanca e os demais PRs tornam-se desatualizados.
+2. Atualize um PR por vez (comentando `@dependabot rebase` ou via botao de update branch).
+3. Espere a esteira verde e faca o merge antes de avancar para o proximo.
+
+### E. Roteiro Pratico de Branch Protection (Repo Solo no GitHub)
+Em repositorios mantidos por uma pessoa, configure para garantir integridade sem burocracia de multiplas aprovacoes:
+1. Acesse **Settings > Branches** (ou **Rulesets**) no GitHub.
+2. Crie uma regra para o ramo `main`.
+3. Ative **Require status checks to pass before merging** e selecione o job `check / Gates de Qualidade`.
+4. Se exigir Pull Request, configure **Required approvals: 0** para permitir auto-merge do autor solo com esteira verde.
+5. Marque **Block force pushes** e **Block deletions**.
+
diff --git a/.mentor/skills/mermaid/SKILL.md b/.mentor/skills/mermaid/SKILL.md
new file mode 100644
index 0000000..816e56b
--- /dev/null
+++ b/.mentor/skills/mermaid/SKILL.md
@@ -0,0 +1,95 @@
+---
+name: mermaid
+description: Padrões e sintaxe robusta para diagramas Mermaid (fluxos, sequência, estados, ERD, C4) em rascunhos e documentação.
+---
+
+# Habilidade · Diagramação com Mermaid
+
+Esta habilidade padroniza a criação de diagramas técnicos usando Mermaid em arquivos de rascunho (`docs-mentor/rascunhos/`) e arquitetura (`docs-mentor/arquitetura/ADR/`).
+
+---
+
+## 1. Regras de Ouro para Evitar Quebras de Sintaxe
+
+IAs frequentemente quebram renderizadores Mermaid ao usar caracteres especiais. Siga rigorosamente:
+
+1. **Sempre use aspas duplas em rótulos de nós**:
+   - ❌ Errado: `A[Criar Conta (PF ou PJ)] --> B`
+   - ✅ Correto: `A["Criar Conta (PF ou PJ)"] --> B`
+2. **Nunca use tags HTML dentro de rótulos**:
+   - ❌ Errado: `A["Nome <br/> Descrição"]`
+   - ✅ Correto: `A["Nome - Descrição"]`
+3. **Identificadores simples sem espaço**:
+   - Use IDs como `nodeA`, `dbPostgres`, `apiGateway` e coloque o texto descritivo entre colchetes/aspas.
+
+---
+
+## 2. Modelos de Referência
+
+### A. Fluxograma de Processo de Negócio (`flowchart TD` ou `LR`)
+
+```mermaid
+flowchart TD
+    startNode(["Início do Processo"]) --> checkValido{"Dados válidos?"}
+    checkValido -- "Sim" --> salvarBanco[("Gravar no Banco")]
+    checkValido -- "Não" --> showErro["Exibir Erro ao Usuário"]
+    salvarBanco --> dispararEvento["Publicar Evento de Domínio"]
+    dispararEvento --> endNode(["Fim"])
+```
+
+### B. Diagrama de Sequência (`sequenceDiagram`)
+
+```mermaid
+sequenceDiagram
+    autonumber
+    actor Usuario as "Usuário"
+    participant App as "Frontend (SPA)"
+    participant API as "API Gateway"
+    participant DB as "Banco de Dados"
+
+    Usuario->>App: "Clica em Exportar Relatório"
+    App->>API: "POST /api/v1/relatorios (payload)"
+    API->>DB: "Consulta registros no período"
+    DB-->>API: "Retorna linhas"
+    API->>API: "Gera arquivo CSV"
+    API-->>App: "201 Created (JSON com URL de download)"
+    App-->>Usuario: "Inicia download e exibe toast de sucesso"
+```
+
+### C. Diagrama de Estados (`stateDiagram-v2`)
+
+```mermaid
+stateDiagram-v2
+    [*] --> Rascunho: "Criado"
+    Rascunho --> EmRevisao: "Submetido"
+    EmRevisao --> Aprovado: "Aprovado pelo Gestor"
+    EmRevisao --> Rejeitado: "Reprovado com motivo"
+    Rejeitado --> Rascunho: "Ajustado"
+    Aprovado --> EmExecucao: "Puxado para o Ciclo"
+    EmExecucao --> Concluido: "Todos os gates verdes"
+    Concluido --> [*]
+```
+
+### D. Modelo de Entidade-Relacionamento (`erDiagram`)
+
+```mermaid
+erDiagram
+    CLIENTE ||--o{ PEDIDO : "realiza"
+    PEDIDO ||--|{ ITEM_PEDIDO : "contém"
+    PRODUTO ||--o{ ITEM_PEDIDO : "incluído em"
+
+    CLIENTE {
+        uuid id PK
+        string nome
+        string email UK
+        datetime criado_em
+    }
+
+    PEDIDO {
+        uuid id PK
+        uuid cliente_id FK
+        string status
+        decimal valor_total
+        datetime criado_em
+    }
+```
diff --git a/.mentor/skills/spike-e-investigacao/SKILL.md b/.mentor/skills/spike-e-investigacao/SKILL.md
new file mode 100644
index 0000000..47059ba
--- /dev/null
+++ b/.mentor/skills/spike-e-investigacao/SKILL.md
@@ -0,0 +1,53 @@
+---
+name: spike-e-investigacao
+description: Roteiro estruturado para tarefas SPIKE, provas de conceito técnicas e diagnóstico sistemático de bugs com teste de reprodução mínimo.
+---
+
+# Habilidade · Spikes e Diagnóstico Sistemático
+
+Esta habilidade orienta a condução de tarefas de pesquisa (`SPIKE`) e a depuração científica de bugs sem tentativa e erro cega.
+
+---
+
+## 1. O Ciclo de Vida de um SPIKE
+
+Um `SPIKE` é uma tarefa de exploração com **tempo limitado (timebox)** para responder uma dúvida técnica específica antes de comprometer o ciclo.
+
+```
+[Dúvida Técnica / Risco]
+       │
+       ▼
+[Hipótese Clara & Pergunta Fechada]
+       │
+       ▼
+[Timebox Definido (ex: 2 a 4 horas)]
+       │
+       ▼
+[Código Exploratório / Descartável]
+       │
+       ▼
+[Registro do Aprendizado em ADR ou Rascunho]
+       │
+       ▼
+[Criação das Tarefas de Produção (RF/CHORE)]
+```
+
+---
+
+## 2. Regras de Ouro do SPIKE
+
+1. **Pergunta binária ou fechada**: O spike deve responder algo concreto (ex: *"A biblioteca X suporta streaming de 10.000 linhas sem estourar memória no Node 20?"*).
+2. **Código de spike é descartável**: O código escrito em spike **não vai para produção**. Ele serve para provar a viabilidade e medir.
+3. **Resultado obrigatório**: O encerramento do spike gera ou uma decisão arquitetural (`ADR`), ou o descarte da abordagem, ou o fatiamento de tarefas formais.
+
+---
+
+## 3. Depuração Sistemática de Bugs (Scientific Debugging)
+
+Diante de um bug intermitente ou complexo:
+
+1. **Reprodução Determinística**: Antes de alterar o código de produção, escreva um teste unitário ou de integração mínimo que **reproduza a falha** (vermelho).
+2. **Formulação de Hipótese**: Formule uma hipótese testável sobre a causa raiz.
+3. **Isolamento de Variáveis**: Altere uma única variável por vez.
+4. **Resolução**: Ajuste o código até o teste de reprodução ficar verde.
+5. **Teste de Regressão**: Mantenha o teste de reprodução na suíte principal para impedir que o bug retorne.
diff --git a/.mentor/skills/test-design/SKILL.md b/.mentor/skills/test-design/SKILL.md
new file mode 100644
index 0000000..749b90a
--- /dev/null
+++ b/.mentor/skills/test-design/SKILL.md
@@ -0,0 +1,66 @@
+---
+name: test-design
+description: Engenharia de testes, metodologia TDD prática, estrutura AAA e estratégias de mock sem acoplamento a detalhes internos.
+---
+
+# Habilidade · Engenharia de Testes e TDD
+
+Esta habilidade orienta a criação de suítes de teste limpas, sustentáveis e determinísticas, aplicando TDD conforme exigido pelo `mentor-agent` (`processos/teste.md`).
+
+---
+
+## 1. O Ciclo TDD no Mentor
+
+```
+1. 🔴 Vermelho   ➔ Escrever o teste que falha e registrar com:
+                   `mentor task gate <ID> testes --esperando-vermelho`
+2. 🟢 Verde      ➔ Escrever o código mínimo para o teste passar e registrar:
+                   `mentor task gate <ID> testes`
+3. 🔵 Refatorar  ➔ Melhorar o design do código mantendo a suíte verde.
+```
+
+---
+
+## 2. Estrutura AAA (Arrange, Act, Assert)
+
+Todo teste deve ser legível como uma especificação em três blocos claros:
+
+```typescript
+import { describe, it, expect } from 'vitest'
+import { CalculadoraDeDesconto } from './calculadora'
+
+describe('CalculadoraDeDesconto', () => {
+  it('aplica 10% de desconto para compras à vista via PIX', () => {
+    // 1. Arrange (Preparação de dados e dependências)
+    const calculadora = new CalculadoraDeDesconto()
+    const valorOriginal = 100.00
+    const formaPagamento = 'PIX'
+
+    // 2. Act (Execução da ação sob teste)
+    const valorFinal = calculadora.calcular(valorOriginal, formaPagamento)
+
+    // 3. Assert (Verificação do resultado esperado)
+    expect(valorFinal).toBe(90.00)
+  })
+})
+```
+
+---
+
+## 3. Estratégias de Dublês de Teste (Mocks, Stubs e Fakes)
+
+| Tipo | Quando usar | Como implementar |
+| :--- | :--- | :--- |
+| **Fake (Em Memória)** | Repositórios e bancos em testes de integração rápidos | `InMemoryUserRepository` armazenando em `Map<string, User>`. |
+| **Stub (Retorno Fixo)** | Serviços externos de consulta (ex: API de CEP, cotação) | Função que devolve objeto pré-definido sem chamar rede. |
+| **Spy / Mock** | Verificação de efeitos colaterais indispensáveis (ex: disparo de email) | Inspecionar se `mailer.enviar()` foi chamado com parâmetros corretos. |
+
+⚠️ **Regra inegociável**: Teste o **comportamento e as saídas públicas**, nunca os métodos privados ou a implementação interna. Testes acoplados a detalhes internos quebram em qualquer refatoração legítima.
+
+---
+
+## 4. Testes Determinísticos e Tempo Congelado
+
+- **Zero dependência de rede externa**: Todas as chamadas HTTP devem usar adaptadores falsos ou mocks de rede (ex: MSW).
+- **Relógio controlado**: Em testes que dependem de datas, congele o tempo (ex: `vi.useFakeTimers()`) para evitar falhas sazonais ou mudanças de fuso horário.
+- **Isolamento hermético**: Cada teste deve limpar seu estado (`beforeEach` / `afterEach`), garantindo que a ordem de execução não altere o resultado.
diff --git a/.mentor/skills/ui-design/SKILL.md b/.mentor/skills/ui-design/SKILL.md
new file mode 100644
index 0000000..c4effc0
--- /dev/null
+++ b/.mentor/skills/ui-design/SKILL.md
@@ -0,0 +1,81 @@
+---
+name: ui-design
+description: Decomposição de prints e telas do Figma em árvore de componentes, tokens e especificação dos 4 estados de UI antes da codificação.
+---
+
+# Habilidade · UI Design: Do Print/Figma aos Componentes
+
+Esta habilidade orienta o processo de transformar um print, layout do Figma ou wireframe em uma especificação técnica de componentes em `docs-mentor/rascunhos/` antes de escrever qualquer linha de código no projeto.
+
+---
+
+## 1. O Roteiro de Desconstrução de Interface
+
+Nunca comece a codificar direto a partir de um print. Siga a ordem:
+
+```
+[Print / Figma] ➔ [Mapeamento em Rascunho] ➔ [4 Estados de UI] ➔ [Codificação TDD]
+```
+
+---
+
+## 2. Decomposição da Árvore de Componentes
+
+Ao inspecionar o design, separe a tela em camadas:
+
+```
+Página / Rota
+└── Layout Container
+    ├── Organismo: Filtro de Relatório
+    │   ├── Molécula: Campo de Data com Calendário
+    │   ├── Molécula: Seletor de Formato (Radio/Dropdown)
+    │   └── Átomo: Botão Primário "Exportar"
+    └── Organismo: Tabela de Resultados
+        ├── Molécula: Cabeçalho com Ordenação
+        ├── Molécula: Linha de Registro com Ações
+        └── Molécula: Paginação
+```
+
+---
+
+## 3. Especificação em Rascunho (`docs-mentor/rascunhos/`)
+
+Documente a estrutura dos componentes mapeados antes de codificar:
+
+```markdown
+# Mapeamento de UI · Tela de Exportação de Relatórios
+
+Fonte visual: `docs-mentor/rascunhos/prototipos/tela-exportar.png` (ou link Figma)
+
+## 1. Componentes Identificados
+
+### `FiltroRelatorio`
+- **Props**: `onFiltrar: (params: ExportarRelatorioQuery) => void`, `carregando: boolean`
+- **Estado interno**: `datas: DateRange`, `formato: 'csv' | 'xlsx'`
+- **Eventos**: `onSubmit` aciona validação e repassa query.
+
+### `TabelaRelatorio`
+- **Props**: `itens: RelatorioItem[]`, `total: number`, `pagina: number`, `onMudarPagina: (p: number) => void`
+- **Primitivas**: Tabela (`Table`, `TableHeader`, `TableRow`, `TableCell`), `Badge`, `Button`.
+```
+
+---
+
+## 4. Os 4 Estados Obrigatórios de Interface
+
+Toda tela ou componente com carga de dados **precisa** prever e especificar como se comporta em 4 estados:
+
+| Estado | O que renderizar | Boas práticas |
+| :--- | :--- | :--- |
+| **1. Vazio (Empty State)** | Ilustração ou ícone sutil, mensagem explicativa e botão de ação primária (ex: *"Nenhum dado encontrado no período. Tente ajustar os filtros."*). | Nunca deixar uma tabela ou tela em branco sem feedback. |
+| **2. Carregando (Loading)** | *Skeleton screens* que respeitam as dimensões reais dos componentes, ou spinner com indicador de progresso. | Desabilitar botões para evitar duplo clique (*double submit*). |
+| **3. Erro (Error State)** | Mensagem humana e clara sobre o que falhou + botão de ação para tentar novamente (*Retry*). | Exibir mensagem tratada do backend (RFC 7807), nunca stack traces ou erros técnicos crus. |
+| **4. Sucesso / Dados** | Conteúdo carregado e interativo, badges de status, paginação habilitada e foco acessível. | Transições suaves entre loading e renderização dos dados. |
+
+---
+
+## 5. Tokens Visuais e Acessibilidade
+
+- **Espaçamentos**: Utilize sempre a escala de espaçamento do projeto (ex: 4px, 8px, 12px, 16px, 24px, 32px), evitando valores arbitrários (`top: 37px`).
+- **Cores semânticas**: Mapeie os elementos para tokens funcionais (`primary`, `secondary`, `destructive`, `muted`, `accent`), garantindo suporte nativo a Dark Mode e contraste WCAG AA.
+- **Acessibilidade**: Elementos interativos devem ser navegáveis por teclado (`Tab`, `Enter`, `Space`) com rótulos semânticos (`aria-label`, `aria-describedby`).
diff --git a/.mentor/tetos.json b/.mentor/tetos.json
index aead1a9..f48a944 100644
--- a/.mentor/tetos.json
+++ b/.mentor/tetos.json
@@ -7,6 +7,16 @@
       "caminho": ".mentor/guia/06-persistencia.md",
       "teto": 20000,
       "motivo": "Unica secao que cobre dois paradigmas de persistencia (relacional BD e nao-relacional NS), em dez subsecoes. Dividir quebraria o mapeamento 1:1 entre secao do guia e portao, que o contexto.json usa para enderecar lacuna."
+    },
+    {
+      "caminho": ".mentor/processos/entrega.md",
+      "teto": 8000,
+      "motivo": "Documenta protecao da main com PR, prova-por-arvore em squash merge e mentor resolver-gerados."
+    },
+    {
+      "caminho": ".mentor/processos/tarefa.md",
+      "teto": 8000,
+      "motivo": "Documenta dispensa de vermelho com prova por mutacao e rastreabilidade obrigatoria de requisitos."
     }
   ],
   "regras": [
@@ -45,7 +55,8 @@
     },
     {
       "padrao": "docs-mentor/tarefas/concluidas/*.md",
-      "teto": 2400
+      "teto": 10000,
+      "_motivo": "Narrativa de fechamento voltada para aprendizado humano e documentacao tecnica aprofundada (armadilhas tecnicas, licoes aprendidas, testes manuais, persistencia, UX). A IA consome o .json estruturado para resumos operacionais."
     },
     {
       "padrao": "docs-mentor/arquitetura/ADR/*.md",
diff --git a/README.md b/README.md
index 0c28ff7..a5ee4be 100644
--- a/README.md
+++ b/README.md
@@ -3,7 +3,7 @@
 **PWA que transforma o romaneio de entregas em paradas de veículo com circuitos de entrega a pé,
 traçados sobre o grafo de ruas do OpenStreetMap. Sem backend, sem conta e sem API de roteirização paga.**
 
-**[▶️ Abrir o protótipo](https://eu-roteirizo-prototipo.pages.dev/)** ·
+**[▶️ Abrir o protótipo](https://teste-prototipo.pages.dev/)** ·
 [Avaliando em 5 minutos](#-avaliando-em-5-minutos) ·
 [Estado atual](#-estado-atual) ·
 [Documentação](#-documentação) ·
@@ -63,7 +63,7 @@ Nenhuma é mockup. São o que o código faz hoje.
 
 Se você chegou aqui para julgar o trabalho e tem pouco tempo, este é o caminho curto.
 
-**No app** ([protótipo ao vivo](https://eu-roteirizo-prototipo.pages.dev/), ou `npm run dev`):
+**No app** ([protótipo ao vivo](https://teste-prototipo.pages.dev/), ou `npm run dev`):
 
 1. Toque em **"Testar com romaneio de exemplo"**. Não precisa de arquivo nenhum: um romaneio
    fictício de Copacabana entra pelo mesmo caminho de um upload real.
diff --git a/__utilidades-back-office__/auto-roteirizacao/README.md b/__utilidades-back-office__/auto-roteirizacao/README.md
new file mode 100644
index 0000000..e7a68e7
--- /dev/null
+++ b/__utilidades-back-office__/auto-roteirizacao/README.md
@@ -0,0 +1,171 @@
+# Experimentos locais de âncoras livres
+
+A RF-030 avalia **onde o veículo poderia parar e quais entregas essa posição cobre**.
+Ainda não ordena o roteiro, calcula caminhada ou comprova estacionamento permitido.
+As referências humanas são somente entrada do avaliador: suas âncoras não alimentam o gerador.
+
+## Repetir a comparação
+
+Execute na raiz do repositório, com as dependências já instaladas:
+
+```powershell
+# Inventário e extensão necessária: não usa rede nem altera os originais.
+npm run test:auto-anchors -- --mode inventory
+
+# Primeiro uso: prepara a malha OSM; usos seguintes verificam e reutilizam o snapshot.
+npm run prepare:auto-anchors
+
+# Matriz real, inteiramente offline, separada da suíte pública.
+npm run test:auto-anchors
+```
+
+A preparação inicial consulta o Overpass com a envolvente geográfica, sem enviar planilhas,
+nomes, endereços ou códigos de pacotes. É uma ação explícita, não um fallback dos testes.
+Se houver mudança do corpus, do construtor de grafos ou corrupção de cache, a execução falha.
+Para preparar outra versão intencionalmente, use
+`npm run test:auto-anchors -- --mode refresh`. Isso consulta a rede e atualiza o índice;
+os snapshots anteriores, identificados pelo conteúdo, permanecem disponíveis.
+
+Os originais ficam em `__utilidades-back-office__/romaneios/`. Todas as planilhas XLSX e
+referências JSON encontradas são inventariadas. O leitor usa SheetJS, normalização de colunas
+e construção de pontos do próprio app. Não altera, desloca ou simplifica as coordenadas.
+O pareamento é por pasta; ambiguidades ou divergências entre pacotes, coordenadas e referências
+interrompem a validação. O índice registra os arquivos esperados: removê-los não torna a suíte verde.
+
+Os testes comuns (`npm run test`) verificam também o leitor usando arquivos sintéticos.
+Eles não substituem a bateria privada. Sem corpus ou snapshot, a bateria real falha, não pula casos.
+
+## Como interpretar
+
+A matriz cruza raios de **30, 60, 90 e 120 m** com passos de amostragem de **5, 10 e 20 m**.
+Cada cenário usa aquecimento e cinco repetições medidas. Projeções, extremidades, limites
+e meios dos intervalos de cobertura complementam as amostras regulares.
+
+O limite é a distância haversine da âncora até cada entrega. Não é comprimento da caminhada.
+O padrão de raio do app não muda. Uma referência manual fora desse limite continua preservada
+e recebe apenas um diagnóstico de compatibilidade com o cenário; o fluxo manual permite
+inclusões que essa restrição automática não permite.
+
+O gerador preserva candidatas de ruas diferentes, inclusive com os mesmos membros, e suas
+direções de acesso no grafo. O agrupamento guloso é uma referência espacial disjunta, não uma
+decisão final de roteiro. A RF-031 poderá trocar a âncora conforme o custo de chegar e sair.
+A semente e sua âncora padrão são preservadas separadamente da posição escolhida para o veículo.
+
+Estados importantes:
+
+- `complete`: todos os pontos ativos foram agrupados sem truncar a busca espacial.
+- `partial`: há pendências ou foi atingido um limite de trabalho; não equivale a roteiro inviável.
+- `invalid`: entradas ou configuração inválidas, sem aprovação por fallback.
+- `no-candidate-in-radius`: nenhuma posição cobriu o ponto na malha e busca consideradas.
+- `search-limit`: o orçamento de busca acabou; não demonstra ausência de solução.
+- `missing-graph`: não há malha veicular utilizável.
+
+As opções `maxCandidates`, `maxSegments`, `maxDistanceChecks`, `maxGridCells` e `maxGroupChecks`
+limitam trabalho e memória intermediária. Atingir um limite torna o resultado explicitamente parcial.
+O índice espacial foi projetado para grafos urbanos de bairro; não é um indexador geodésico mundial.
+
+## Resultados para sua comparação
+
+Cada execução gera uma pasta nova em `.mentor-saidas/auto-anchors/`, sem sobrescrever anteriores:
+
+- `summary.md`: resumo por raio/passo, pendências e tempos.
+- `manifest.json`: vínculo do identificador opaco `case-*` com o romaneio original e snapshots.
+- `report.json`: métricas por cenário, ambiente, hashes de código/corpus/grafo e tempos por fase.
+- `details.json`: grupos provisórios, sementes, membros, pendências e comparação das paradas humanas.
+- `case-*-r*.geojson`: entregas, âncoras humanas e âncoras provisórias, para o passo de 10 m.
+- `importaveis/LEIA-ME.md`: índice por romaneio/raio e instruções para abrir as saídas no app.
+- `importaveis/case-*-r*m-p10m.json`: variantes de inspeção no schema **eu-roteirizo/roteiro/v1**.
+- `importaveis/index.json`: inventário das variantes; é auxiliar, não um roteiro importável.
+- `evidence.txt`: identificação compacta da execução; conferir também o código de saída do comando.
+
+Os GeoJSONs não são roteiros importáveis pelo app e não contêm trajetos viários.
+Para usar **Importar roteiro (.json)**, escolha um arquivo `case-*-r*m-p10m.json` da pasta
+`importaveis`, nunca `index.json`, `report.json`, `details.json` ou um GeoJSON.
+
+Os JSONs de inspeção reutilizam o exportador v1 do produto. Cada variante passa pelo parser,
+importador, leitura do armazenamento e hidratação do reducer reais, com IndexedDB em memória
+exclusivo do processo de teste. Não acessam nem limpam o armazenamento do seu navegador.
+As linhas/pacotes e posições são preservadas, pendências continuam livres e a ordem interna
+de cada parada usa o padrão atual do app. A sequência entre paradas **não foi otimizada**.
+
+Os nomes incluem `INSPEÇÃO` e `NÃO OTIMIZADO`. IDs separados por cenário/execução preservam suas
+referências manuais e outras variantes. Reimportar **o mesmo arquivo** atualiza a cópia experimental
+e pode substituir edições feitas nela: exporte sua cópia editada antes de reimportar.
+O início/configurações da referência são usados quando existem, apenas para a apresentação.
+Sem referência, o início permanece 
[...recortado...]
```

### Arquivos criados e nunca commitados

Nenhum.

## Como entregar o veredito

Edite `docs-mentor/auditorias/AUD-001.json`:

- `veredito`: `APROVADO` | `APROVADO COM RESSALVAS` | `REPROVADO`
- `nao_verificado`: lista. **Nunca pode ficar vazia** — nenhuma auditoria verifica tudo, e dizer o contrario e o sinal mais claro de auditoria quebrada.
- `pendencias`: cada achado com `nivel` (`bloqueia` | `recomendacao` | `observacao`), `descricao` e `tarefas` (os IDs a que se refere).
  Deixe `destino`, `ref` e `resolvida_em` em `null`: **quem decide o destino e o humano, nao voce.**

Depois rode:

```
node mentor.mjs auditar registrar AUD-001
```

O comando recusa: marcador nao preenchido · `nao_verificado` vazio · achado `bloqueia` com veredito `APROVADO` · destino preenchido por voce.
