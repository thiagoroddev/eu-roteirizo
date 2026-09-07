# TASK-BG-011 · Registro de execução e retomada

## Decisões tomadas

Fornecedor mantido enquanto se investiga a falha real. O carregador distingue HTTP, timeout, rede, resposta inválida, erro do Overpass e cancelamento; registra tentativas sem inferir fila. Resposta incompleta não vira grafo/cache. Cancelamento interrompe requisição e espera. A interface sinaliza percursos aproximados.

Após reteste, removido retry automático de HTTP 429 e falha de rede sem resposta; 429 orienta esperar ao menos 30 segundos, conforme aviso da operadora de 11/08/2026. Esse ajuste passou nos gates, mas ainda não está na prévia.

## Situação para retomar

Checkpoint autorizado para commit/push, sem fechar a tarefa. BG-011 em execução; CHORE-012 aberta, com histórico preservado. Não houve troca de fornecedor. Recuperação real continua pendente.

Prévia autorizada: https://bg-011-carregamento-malha.eu-roteirizo-prototipo.pages.dev (deployment 95bf73f7; index-CmHUcFf-.js). HTML, JS e service worker conferidos por SHA-256. O site principal permanece separado.

PC/M35 em Wi-Fi: falhas sem HTTP, cerca de 21,3 s por tentativa; M35 também falhou em 0,7 a 1,5 s. No teste solicitado em dados móveis, /api/status respondeu com dois slots, mas novas cargas do app falharam em 0,3 a 1 s. Console do PC confirmou POST /api/interpreter net::ERR_CONNECTION_TIMED_OUT. Não comprova bloqueio por IP ou CORS. Resultados detalhados, URLs e fontes estão nos achados do JSON desta tarefa, versionados; arquivos de .mentor-saidas são apenas evidência local complementar.

## Testes e limites

Gates de testes, tipos e lint aprovados; build aprovado com ressalva de chunks. Regressões cobrem payload inválido, erros, cancelamento, Retry-After, cache e aproximação. Houve vermelho antes das correções.

Chromium 152 com rede simulada: 503 seguido de sucesso; três nós salvos no IndexedDB; offline, percurso de cinco pontos e 213,56 m sem nova consulta. Isso valida o fluxo local, não a disponibilidade externa.

## Próximo passo

Comparar a requisição real com as exigências atuais do operador e avaliar a fonte alternativa prevista na ADR-010/plano de infraestrutura. Não tratar o incidente como resolvido por reduzir retentativas. Pesquisa humana de alternativas segue como insumo.
