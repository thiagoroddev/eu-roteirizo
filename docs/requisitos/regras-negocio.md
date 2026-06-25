# Regras de Negócio (RN)

> O que deve valer sempre — invariantes e políticas do domínio. IDs `RN-NN`. Cada regra aponta **onde o código a garante**. Extraídas do código atual (código é a verdade primária). Formato em `.github/agents/geral-robusto/templates/38-requisitos.md`.
>
> Status: ✅ Implementado · 🟡 Parcial · 🔭 Planejado · 🚫 Descartado.

## Estado Atual (implementado)

| ID | Regra (invariante) | Onde é imposta | Status | Origem | Tarefas / ADR |
|---|---|---|:---:|---|---|
| RN-01 | Uma coordenada só é válida dentro dos limites do Rio; fora deles é descartada (nunca vira marcador) | `MAP_CONFIG.RIO_BOUNDS` + `isWithinRioBounds` | ✅ | `utils/coordinates.ts`, `constants/index.ts` | TASK-BG-004 |
| RN-02 | `parseCoordinate` remove pontos e divide por 10.000.000 — resolve inteiro escalado **e** decimal de **exatamente 7 casas** (round-trip por coincidência). Coordenada com ≠ 7 casas **quebra em silêncio** (cai fora dos limites e some) — a robustez é a TASK-BG-005 | `parseCoordinate` | 🟡 | `utils/coordinates.ts` | TASK-BG-005 |
| RN-03 | As únicas colunas obrigatórias são `Latitude` e `Longitude`; sem elas o arquivo é rejeitado com erro | `MANDATORY_COLUMNS` + `processExcelFile` | ✅ | `utils/excelProcessor.ts`, `constants/index.ts` | TASK-RF-002 |
| RN-04 | `Corridor Cage` define o modo de leitura: presente → multi-rota (agrupa); ausente → rota única (rótulo "Minha rota") | `isSingleRoute = !colNames.includes(CORRIDOR_CAGE)` | ✅ | `utils/excelProcessor.ts` | TASK-RF-002 |
| RN-05 | No multi-rota, o identificador de rota deve casar `^[A-Z]+-\d+(?:NS)?$`; linha com valor inválido/vazio é ignorada (e contada) | `validPattern` no agrupamento | ✅ | `utils/excelProcessor.ts` | - |
| RN-06 | Linha sem coordenada plotável é descartada (e contada) — nos dois modos | `buildSingleRoute` + reduce do multi-rota | ✅ | `utils/excelProcessor.ts` | - |
| RN-07 | Tipo de local: `Office` da planilha é confiável (trust); `Home`/vazio aciona inferência pelo complemento do endereço, que pode corrigir | `resolveLocationType` | ✅ | `utils/inferLocationType.ts` | - |
| RN-08 | Status dos Correios por CEP de 8 dígitos (ESEDC) — **descartado** | — | 🚫 | ADR-005 (remove `correiosDelivery.ts`) | TASK-REF-007 |
| RN-09 | Célula vazia, ausente ou inválida converge para o sentinela único "Sem dados" na apresentação | `presentStatus` + `DATA_STATUS` | ✅ | `constants/index.ts` | - |

## Pendente de Validação

- **RN-05** (validado em 24/06): `NS` é a única variação; nunca aparece na prática, mas é informal e pode ser inserido manualmente — o código já o aceita.
- **RN-08** descartado em 24/06/26 (ADR-005): a inferência ESEDC/Correios sai do projeto inteiro (código na TASK-REF-007).

## Planejados (🔭) — Roteirizador a pé

> Derivadas de `fluxo-roteirizacao.md` + `draft-roteirizador-a-pe.md`. `🟡` = a regra já existe como código/modelo (fundação), mas sem UI que a exerça.

| ID | Regra (invariante) | Onde é/será imposta | Status | Origem | Tarefas / ADR |
|---|---|---|:---:|---|---|
| RN-10 | A unidade de planejamento é a **Parada** → contém **Endereços** → contêm **Pacotes** (hierarquia de 3 níveis) | modelo `RouteStop→DeliveryPoint→DeliveryPackage` | 🟡 | fluxo §2; `types/routing.ts` | TASK-RF-004 (feito) |
| RN-11 | Endereços na mesma coordenada (~1 m) são **um ponto** com vários pacotes (= **uma** atribuição) | `utils/routing/points.ts` | 🟡 | fluxo §2/§3 | TASK-RF-004 (feito) |
| RN-12 | Toda parada tem uma **âncora** (onde o veículo para); ela é **sempre o 1º ponto** da ordem a pé, e trocá-la recalcula a ordem. Base da ida-e-volta a pé e do salto de veículo | a construir | 🔭 | fluxo §6 | TASK-RF-006 |
| RN-13 | Endereço **nunca some** (é entrega real): desfazer parada → vira livre; remover a âncora → promove o próximo | a construir | 🔭 | fluxo §9 | TASK-RF-006 |
| RN-14 | **Salvar é livre** (rascunho auto-salvo, mesmo incompleto); a **completude** (0 faltando) é exigida só para **executar** | a construir | 🔭 | fluxo §12 | TASK-RF-006.7 |
| RN-15 | `Pn/En` é a ordem **nova** da rota; a numeração Shopee (`Stop`/`Sequence`) é preservada como identidade da **etiqueta** | a construir | 🔭 | fluxo §10.1/§14 | TASK-RF-006, TASK-RF-009 |
| RN-16 | Marcadores no mapa **nunca** carregam texto traduzível — só número (i18n) | a construir | 🔭 | fluxo §3/decisão 6 | TASK-RF-006 |
| RN-17 | Inclusão manual de endereço na parada **sem trava de distância** (só aviso suave); o raio só agrupa na criação | a construir | 🔭 | fluxo §9 | TASK-RF-006.4 |
| RN-18 | A pé **ignora** mão única (circuito da parada); o veículo (entre âncoras) **respeita** | a construir | 🔭 | fluxo §6; ADR-002 | TASK-RF-005, TASK-RF-006 |
| RN-19 | Rotas salvas são **por dispositivo** (IndexedDB, sem nuvem) — consequência do sem-backend | a construir | 🔭 | fluxo §13 | TASK-RF-008 |
| RN-20 | O ponto inicial vem de GPS/toque/endereço — **nunca** geocoding pago (digitar endereço) | a construir | 🔭 | fluxo decisão 5 | TASK-RF-006.3 |
| RN-21 | No máximo **1 Roteiro por rota** (single = 1; multi = até 1 por rota). O Roteiro fica **atrelado** ao seu Romaneio — ou **avulso** quando importado sem o romaneio | a construir | 🔭 | fluxo §15; decisão 24/06 | TASK-RF-008 |
| RN-22 | Durante a **execução** o Roteiro **não é editável**; 'Pausar rota' salva o progresso e libera a edição | a construir | 🔭 | fluxo §14 | TASK-RF-009 |
