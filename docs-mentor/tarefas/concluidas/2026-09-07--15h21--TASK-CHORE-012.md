# TASK-CHORE-012 · Conferencia das pendencias do doctor

Em execucao, sem fechamento. O humano pediu resolver as pendencias e escolheu priorizar RF-029 depois desta conferencia.

## Evidencias e limites

- GitHub GET: vulnerability-alerts retornou 404 com mensagem explicita de desativacao; automated-security-fixes retornou enabled=false, paused=false. Acesso admin confirmado. Actions/secrets e environments retornaram contagem zero; quality.yml nao usa segredos/ambientes. Apos autorizacao humana, PUTs aplicados e GETs confirmaram HTTP 204/ enabled=true. Evidencia: .mentor-saidas/github-security-20260906T075343Z.json.
- Os quatro gates declarados foram executados pelo registrador do Mentor; saidas e horarios no JSON. Build com aviso de chunks acima de 500 kB. O registrador recorta a saida longa dos testes; ela contem casos executados e warnings de act, mas nao preservou o resumo numerico. Nao se atribuiu contagem de testes a este run.
- Audit atual: JSON cru em .mentor-saidas/npm-audit-20260906T070412Z.json, exit 1. Duas vulnerabilidades transitivas com correcao disponivel, detalhadas nos achados. Nenhuma dependencia foi alterada.
- Metas: avaliacao parcial contra codigo, gates e legado. Upload: src/constants/index.ts; TTL/cache: src/services/graphCache.ts; A*: teste sintetico em src/__tests__/utils/routing/aStar.test.ts. PWA/fallback: vite.config.ts e public/_redirects. XLSX: manifestStorage.test.ts. Escape: escapeHtml e markerModels/roteiroModels. Strict: tsconfig. Mapa: RouteMap.tsx e routing/osm.ts ainda contêm endpoints.
- REF-019/RF-014 registravam smoke nao executado. Nesta sessao o humano relatou uso no Samsung M35, sem data, e confirmou que offline ainda nao foi testado. Resultado por cenario e navegador nao informados. Validacao integral permanece pendente; sete ressalvas nao equivalem a conformidade.

## Pendencias para continuidade

Protecoes do GitHub ativas e verificadas; tratar as dependencias vulneraveis; realizar validacao no aparelho e medir os limites ainda sem evidencia. Reconciliacao completa dos RFs legados e otimizacao de chunks continuam abertas nos achados.

RF-024 foi para a reserva sem mudar sua data. RF-029 tem 6 etapas planejadas a partir do spike e do pedido esclarecido; RF-030 e a proxima fatia de desenvolvimento. Plano revisto: raio geometrico centrado no veiculo, custo D3 com peso 400 aprovado, validacao do motor antes do botao.
