# Dívida Técnica

> Riscos/pendências conhecidos, **aceitos e adiados** com um **gatilho** (quando revisitar). Não é backlog de features — é onde registramos decisões de adiar algo que tem custo/risco. Formato: módulo 20 §8.3 do pacote.

| ID | Descrição | Impacto | Gatilho | ADR |
|---|---|---|---|---|
| DT-001 | App precisa ser empacotado como **TWA** (Trusted Web Activity) para publicar na Play Store. Empacotamento via **Bubblewrap** ou **PWABuilder** (gera AAB/APK do PWA). Ainda não feito; exige manifest + ícones + critérios de PWA installable (já somos PWA). | Médio — bloqueia o lançamento na loja, mas não afeta o app web. | Ao preparar o **primeiro release na Play Store**. | - (criar ADR de empacotamento/release) |
| DT-002 | **Assinatura premium na Play Store exige Google Play Billing** (Digital Goods API + Payment Request, no TWA). A validação **segura** da assinatura pede verificação **server-side** (recibo / RTDN) — caso contrário o premium é burlável no cliente. Isso **conflita com a decisão inegociável "sem backend"** do `contexto-projeto-ai.md`. | Alto — segurança da monetização; premium sem validação server-side é facilmente burlado. | Ao iniciar a implementação de **premium/monetização**. | - (exigirá ADR de billing; provavelmente um **backend mínimo** só para validar assinatura) |
| DT-003 | **Cobertura nacional de CEP→bairro.** Hoje o bairro é resolvido por CEP só para **RJ/Ilha do Governador** (`data/CEPs-Hub_RJ_Ilha-do-Governador.json`, via `summarizeNeighborhoods`); fora dessa área cai no nome da planilha (que tem erros de digitação). O lançamento nacional pede uma base CEP→bairro do Brasil (dataset ou serviço). | Médio — qualidade do bairro fora do RJ; afeta exibição e (futuro) agrupamento no país inteiro. | Ao preparar o **lançamento nacional** / sair do piloto RJ. | - (avaliar dataset nacional vs API de CEP) |
| DT-004 | **Fonte dos tiles do mapa = servidores públicos do OSM.** O `worker.js` faz proxy de `tile.openstreetmap.org`, cujo uso comercial/escalando **viola a Tile Usage Policy** do OSM (risco de bloqueio + visual genérico). Além disso o Worker **não restringe origem** (`ACAO: *`, sem checar `Origin`/`Referer`) → qualquer app pode consumir a cota (*leeching*). | **Alto** — bloqueio/indisponibilidade do mapa no lançamento + cota vazada. | **Antes do primeiro release na Play Store.** | ADR-007 |
| DT-005 | **Endpoint público do Overpass API** (`https://overpass-api.de/api/interpreter`, em `utils/routing/osm.ts`) para baixar a malha viária do roteirizador. Tem **política de uso / rate limits** (análogo ao DT-004 dos tiles); sob carga pode retornar 429/504 ou ficar indisponível. Hoje mitigado por erro tratado (UI não quebra) e `options.endpoint` (permite mirror/proxy); o cache em IndexedDB (TASK-RF-005.3) reduz os hits. | Médio/Alto — indisponibilidade do roteamento no lançamento; possível bloqueio por abuso de cota. | **Antes do primeiro release** / ao escalar uso do roteirizador. | - (avaliar mirror público, instância self-hosted, ou proxy próprio com cache) |

---

## Notas

- **DT-002** é a mais relevante para o produto: a promessa de "premium" entra em rota de colisão com "sem backend". Decidir cedo (ADR) evita prometer algo que a arquitetura atual não sustenta com segurança.
- Origem de ambas: discussão de biblioteca de UI / requisitos de Play Store + premium (23/06/26).
