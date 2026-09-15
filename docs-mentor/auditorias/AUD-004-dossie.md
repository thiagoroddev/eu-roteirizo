# AUD-004 · dossie de auditoria

Voce e o **auditor**. Voce nao escreveu este codigo e nao vai corrigi-lo.
Seu unico poder e **reprovar**. Voce **nao abre tarefa**: quem decide o que vira trabalho e o humano.

## O escopo, e por que ele e fechado

Voce ve o que esta neste arquivo: o registro de cada tarefa, o diff de cada uma e os requisitos citados.
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

Cada tarefa traz o proprio diff: os commits com o ID dela no titulo. Trabalho de outra tarefa nao entra.
Ate: `f39dc02f4f54f5e81660c30c9ca444b9c17e6d04`

### TASK-BG-023 · Variantes de inspecao da RF-030 (corpus.ts) exportam a ancora movida pelo gerador como escolha do usuario, sem chave, contra a INV-001

`BG` · cerimonia Standard · esforco P/M · origem: titulo-autossuficiente

**Criterios de aceite, e o teste que cada um nomeia:**

- Sem a chave, a parada que o gerador moveu sai na ancora padrao do app (pino da semente, semente primeiro, vehicleStopIsDefault true) e o nome nao leva o marcador
  → teste: `__utilidades-back-office__/auto-roteirizacao/corpus.test.ts > exports app default anchors without the key`
- So a chave explicita exporta a ancora do gerador, marcada como escolha (false), com ANCORAS DO EXPERIMENTO no nome e manifestId proprio
  → teste: `__utilidades-back-office__/auto-roteirizacao/corpus.test.ts > only the explicit key exports the generator anchors`
- node mentor.mjs verificar aprova a chave e o artefato importavel registrados no contexto
  → teste: `nao se aplica: verificacao operacional via CLI; a saida fica registrada com task criterio`
- npm run test:auto-anchors fecha completo sem a chave e com INSPECAO_ANCORAS_DO_EXPERIMENTO=1, usando o corpus privado local
  → teste: `nao se aplica: bateria de laboratorio com corpus privado fora do git; a saida (so contagens) fica registrada com task criterio`

**Pedido e alternativas (a solucao sugerida pelo humano e' hipotese):**

- pedido original: TASK-BG-023: o exportador das variantes de inspecao da RF-030 tambem marca a ancora do gerador como escolha do usuario, o mesmo problema da BG-022. planeje a bg023
- solucao sugerida: Repetir a correcao da TASK-BG-022 (implicita em 'o mesmo problema da BG-022')
- alternativa: Padrao seguro por exportador: a politica da BG-022 (ancora padrao do app; a do gerador so com chave explicita e marcador no nome) → pegaria o caso: Sim, para este exportador: o JSON sem chave nunca chega ao app como escolha do usuario · custo: 4 arquivos de laboratorio, sem tocar src/; reusa politica ja validada no Samsung M35
- alternativa: Defesa no importador: o app trata JSON de laboratorio como nao confiavel (campo de origem no esquema v1) → pegaria o caso: Sim, e tambem todo exportador futuro · custo: G: mexe no produto e no esquema v1 e pode apagar ancora movida a mao em roteiro reimportado; descartada na BG-022 pelo mesmo motivo
- alternativa: Deixar de gerar os JSONs importaveis da inspecao RF-030 → pegaria o caso: Sim, elimina o caminho do erro · custo: Menor codigo, mas remove a inspecao visual do gerador no app; o humano decidiu manter (14/09/26, resposta 1-A)

**Declarou mudar:**

- __utilidades-back-office__/auto-roteirizacao/corpus.ts - AnchorPolicy e EXPERIMENT_ANCHORS_MARKER passam a morar aqui; createInspectionPayload ganha anchorPolicy (padrao app-default): parada no pino da semente, semente primeiro, vehicleStopIsDefault true; so experiment exporta a ancora do gerador, marcada false e com o marcador no nome
- __utilidades-back-office__/auto-roteirizacao/corpus.test.ts - dois testes da politica de ancoras; o teste que prendia o false passa a pedir anchorPolicy experiment
- __utilidades-back-office__/auto-roteirizacao/experimentArtifacts.ts - importa e reexporta AnchorPolicy e EXPERIMENT_ANCHORS_MARKER de ./corpus, sem mudar comportamento
- __utilidades-back-office__/auto-roteirizacao/anchors.arnes.ts - le a chave INSPECAO_ANCORAS_DO_EXPERIMENTO, sufixo -ancoras-do-experimento no arquivo, politica no index.json e LEIA-ME corrigido
- docs-mentor/contexto.json - laboratorio.chaves ganha INSPECAO_ANCORAS_DO_EXPERIMENTO; artefatos_importaveis ganha o JSON da inspecao RF-030 com teste de contrato
- docs-mentor/invariantes.json - mecanismo da INV-001 cita tambem os testes do corpus

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| testes | APROVADO | 14/09/26 07:04 | 0 | — |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| build | APROVADO | — | 0 | — |
| validacao_manual | APROVADO | — | — | Humano importou no app o case-014 R120m P10m nas duas versoes (14/09/26, capturas no chat). Sem chave: nome sem ANCORAS DO EXPERIMENTO, parada 9 com o veiculo na Rua Arnaldo Quintela em frente ao 1o endereco e sem botao Resetar. Com a chave: nome com ANCORAS DO EXPERIMENTO, veiculo na ancora do gerador (Rua Oliveira Fausto) e Resetar local do veiculo visivel. Os dois roteiros coexistem. |

**Riscos declarados:** Com a ancora padrao, membro agrupado pelo raio da ancora do gerador pode ficar alem do raio a partir da parada padrao: o importador aceita, mas o agrupamento parece largo. E o caso de ligar a chave · Merge do main no wip/spike-003 antes do retomar: conflito possivel em corpus.ts/corpus.test.ts; a politica desta tarefa precisa sobreviver

**O diff da tarefa:**

1 commit(s): `9261bbd` fix(TASK-BG-023): inspecao da RF-030 exporta a ancora padrao do app e a do gerador so com chave (#43)

| arquivo | linhas | fora da revisao |
| :-- | --: | :-- |
| `__utilidades-back-office__/auto-roteirizacao/anchors.arnes.ts` | 19 | — |
| `__utilidades-back-office__/auto-roteirizacao/corpus.test.ts` | 38 | — |
| `__utilidades-back-office__/auto-roteirizacao/corpus.ts` | 60 | — |
| `__utilidades-back-office__/auto-roteirizacao/experimentArtifacts.ts` | 21 | — |
| `docs-mentor/contexto.json` | 26 | vista gerada |
| `docs-mentor/contexto.md` | 7 | vista gerada |
| `docs-mentor/invariantes.json` | 4 | — |
| `docs-mentor/tarefas/abertas/TASK-BG-023.json` | 44 | registro do mentor |
| `docs-mentor/tarefas/concluidas/0-indice.md` | 1 | registro do mentor |
| `docs-mentor/tarefas/concluidas/2026-09-14--08h02--TASK-BG-023.json` | 195 | registro do mentor |
| `docs-mentor/tarefas/concluidas/2026-09-14--08h02--TASK-BG-023.md` | 29 | registro do mentor |
| `docs-mentor/tarefas/reserva.md` | 1 | registro do mentor |

```diff
# 9261bbd · fix(TASK-BG-023): inspecao da RF-030 exporta a ancora padrao do app e a do gerador so com chave (#43)
diff --git a/__utilidades-back-office__/auto-roteirizacao/corpus.test.ts b/__utilidades-back-office__/auto-roteirizacao/corpus.test.ts
index 6b9e9e6..c33b56f 100644
--- a/__utilidades-back-office__/auto-roteirizacao/corpus.test.ts
+++ b/__utilidades-back-office__/auto-roteirizacao/corpus.test.ts
@@ -82,7 +82,7 @@ describe("inspection exports", () => {
   it("uses the actual v1 parser and preserves points, anchors and source data", () => {
     const calculation = result();
     const original = structuredClone({ entry, calculation });
-    const payload = createInspectionPayload(entry, calculation, scenario);
+    const payload = createInspectionPayload(entry, calculation, { ...scenario, anchorPolicy: "experiment" });
     const parsed = parseAndValidateRouteJson(serializeRouteExport(payload));
 
     expect(parsed.ok).toBe(true);
@@ -153,6 +153,42 @@ describe("inspection exports", () => {
     expect(payload.route.config.walkingSpeedKmh).toBe(DEFAULT_ROUTING_CONFIG.walkingSpeedKmh);
   });
 
+  // ------- Anchor policy (TASK-BG-023, INV-001) -------
+  // The generator's anchor must never reach the app as the user's choice unless the lab asks for it.
+
+  it("exports app default anchors without the key", () => {
+    const calculation = result(); // the generator moved this group's anchor away from the seed's default
+    const payload = createInspectionPayload(entry, calculation, scenario);
+    const [stop] = payload.route.stops;
+    const seed = sourcePoints[1];
+
+    expect(stop.vehicleStopIsDefault).toBe(true);
+    expect(stop.vehicleStop).toEqual({ lat: seed.lat, lng: seed.lng });
+    // The app reprojects a default anchor from pointIds[0], so the seed must lead.
+    expect(stop.pointIds[0]).toBe(calculation.groups[0].seedPointId);
+    expect(stop.pointIds.slice().sort()).toEqual(calculation.groups[0].pointIds.slice().sort());
+    expect(payload.routeName).not.toContain("ANCORAS DO EXPERIMENTO");
+    expect(parseAndValidateRouteJson(serializeRouteExport(payload)).ok).toBe(true);
+  });
+
+  it("only the explicit key exports the generator anchors", () => {
+    const calculation = result();
+    const payload = createInspectionPayload(entry, calculation, { ...scenario, anchorPolicy: "experiment" });
+    const [stop] = payload.route.stops;
+
+    expect(stop.vehicleStopIsDefault).toBe(false);
+    expect(stop.vehicleStop).toEqual(calculation.groups[0].vehicleStop);
+    expect(payload.routeName).toContain("ANCORAS DO EXPERIMENTO");
+    expect(payload.manifestId).not.toBe(createInspectionPayload(entry, calculation, scenario).manifestId);
+
+    // One policy per route: an anchor the generator left at its default is frozen too, or the app
+    // would reproject it with today's rule and the inspection would stop showing the generator.
+    const atDefault = result();
+    atDefault.groups[0].vehicleStopIsDefault = true;
+    atDefault.groups[0].vehicleStop = { ...atDefault.groups[0].defaultVehicleStop };
+    expect(createInspectionPayload(entry, atDefault, { ...scenario, anchorPolicy: "experiment" }).route.stops[0].vehicleStopIsDefault).toBe(false);
+  });
+
   it("rejects broken conservation or invalid output instead of letting hydration hide it", () => {
     const lost = result();
     lost.pending = [];
# 9261bbd · fix(TASK-BG-023): inspecao da RF-030 exporta a ancora padrao do app e a do gerador so com chave (#43)
diff --git a/__utilidades-back-office__/auto-roteirizacao/anchors.arnes.ts b/__utilidades-back-office__/auto-roteirizacao/anchors.arnes.ts
index 368fc01..78ad78e 100644
--- a/__utilidades-back-office__/auto-roteirizacao/anchors.arnes.ts
+++ b/__utilidades-back-office__/auto-roteirizacao/anchors.arnes.ts
@@ -15,11 +15,13 @@ import { clearManifests, getRouteRows } from "../../src/services/manifestStorage
 import { clearRoteiros, getRoteiro } from "../../src/services/routeStorage";
 import { buildDeliveryPoints } from "../../src/utils/routing/points";
 import { createInitialBuilderState, routeBuilderReducer } from "../../src/utils/routing/builder";
-import { createInspectionPayload, hash, loadCorpus, loadSnapshots, type CorpusCase } from "./corpus";
+import { createInspectionPayload, EXPERIMENT_ANCHORS_MARKER, hash, loadCorpus, loadSnapshots, type AnchorPolicy, type CorpusCase } from "./corpus";
 
 const RADII = [30, 60, 90, 120];
 const STEPS = [5, 10, 20];
 const REPETITIONS = 5;
+/** INV-001: the importable JSONs park on the app's default anchor unless INSPECAO_ANCORAS_DO_EXPERIMENTO=1 (TASK-BG-023). */
+const ANCHOR_POLICY: AnchorPolicy = process.env.INSPECAO_ANCORAS_DO_EXPERIMENTO === "1" ? "experiment" : "app-default";
 const corpus = loadCorpus();
 const snapshots = loadSnapshots(corpus);
 const runId = new Date().toISOString().replaceAll(/[:.]/g, "-");
@@ -111,7 +113,7 @@ const exportComparison = (entry: CorpusCase, result: AnchorSearchResult, radius:
 };
 
 const exportInspection = async (entry: CorpusCase, result: AnchorSearchResult, step: number): Promise<void> => {
-  const payload = createInspectionPayload(entry, result, { runId, sampleStepMeters: step });
+  const payload = createInspectionPayload(entry, result, { runId, sampleStepMeters: step, anchorPolicy: ANCHOR_POLICY });
   const serialized = serializeRouteExport(payload);
   const parsed = parseAndValidateRouteJson(serialized);
   check(parsed.ok, `${entry.id}: inspection rejected by the app parser`);
@@ -133,7 +135,7 @@ const exportInspection = async (entry: CorpusCase, result: AnchorSearchResult, s
     .map((p) => p.id)
     .sort();
   check(hash(JSON.stringify(free)) === hash(JSON.stringify(result.pending.map((p) => p.pointId).sort())), `${entry.id}: pending points were lost or ignored`);
-  const file = `${entry.id}-r${result.radiusMeters}m-p${step}m.json`;
+  const file = `${entry.id}-r${result.radiusMeters}m-p${step}m${ANCHOR_POLICY === "experiment" ? "-ancoras-do-experimento" : ""}.json`;
   writeFileSync(join(inspectionDir, file), serialized, { flag: "wx" });
   inspectionFiles.push({
     caseId: entry.id,
@@ -290,6 +292,7 @@ afterAll(async () => {
     gitVersion,
     sourceHashes: sources.map((file) => ({ file, hash: hash(readFileSync(file)) })),
     machine: { platform: platform(), release: release(), cpu: cpus()[0]?.model, node: process.version },
+    anchorPolicy: ANCHOR_POLICY,
     repetitions: REPETITIONS,
     radii: RADII,
     steps: STEPS,
@@ -308,7 +311,11 @@ afterAll(async () => {
   };
   writeFileSync(join(outputDir, "report.json"), JSON.stringify(report, null, 2));
   writeFileSync(join(outputDir, "details.json"), JSON.stringify(details));
-  writeFileSync(join(inspectionDir, "index.json"), JSON.stringify({ runId, status: report.status, files: inspectionFiles }, null, 2));
+  writeFileSync(join(inspectionDir, "index.json"), JSON.stringify({ runId, status: report.status, anchorPolicy: ANCHOR_POLICY, files: inspectionFiles }, null, 2));
+  const anchorGuide =
+    ANCHOR_POLICY === "experiment"
+      ? `**ÂNCORAS DO GERADOR (chave INSPECAO_ANCORAS_DO_EXPERIMENTO=1).** Cada parada sai na âncora que o gerador escolheu, marcada como escolha manual para o app não reaplicar o padrão; o nome do roteiro traz "${EXPERIMENT_ANCHORS_MARKER}" e o do arquivo, "-ancoras-do-experimento". Os grupos e as âncoras são resultados do motor.`
+      : "**ÂNCORAS PADRÃO DO APP (sem chave).** Os grupos são resultados do motor, mas cada parada sai no pino da semente, marcada como padrão: com a malha carregada, o app leva o veículo para a rua em frente a esse pino, como faria com uma parada criada à mão. Para ver onde o gerador põe a âncora, rode de novo com INSPECAO_ANCORAS_DO_EXPERIMENTO=1 (INV-001).";
   const inspectionGuide =
     [
       "# JSONs para importar no Eu Roteirizo",
@@ -323,7 +330,9 @@ afterAll(async () => {
       "",
       "Cada arquivo usa o schema eu-roteirizo/roteiro/v1 e identidade própria. Variantes/execuções não substituem referências manuais. Reimportar o MESMO arquivo atualiza essa cópia e pode substituir edições feitas nela; exporte sua cópia editada antes de reimportar.",
       "",
-      "**INSPEÇÃO ESPACIAL: A SEQUÊNCIA NÃO FOI OTIMIZADA.** As âncoras e grupos são resultados do motor; os caminhos de veículo e a pé são recalculados pelo app com sua malha atual, que pode diferir do snapshot do teste. Sem malha/caminho, o app pode desenhar trechos retos. Não interprete esses percursos como qualidade de roteirização já validada.",
+      "**INSPEÇÃO ESPACIAL: A SEQUÊNCIA NÃO FOI OTIMIZADA.** Os caminhos de veículo e a pé são recalculados pelo app com sua malha atual, que pode diferir do snapshot do teste. Sem malha/caminho, o app pode desenhar trechos retos. Não interprete esses percursos como qualidade de roteirização já validada.",
+      "",
+      anchorGuide,
       "",
       "O início da referência é preservado quando existe; sem referência ele permanece não definido. A ordem interna dos membros usa o padrão atual do app, sem mudar a âncora ou o grupo. Pontos pendentes permanecem livres; não viram ignorados.",
       "",
# 9261bbd · fix(TASK-BG-023): inspecao da RF-030 exporta a ancora padrao do app e a do gerador so com chave (#43)
diff --git a/__utilidades-back-office__/auto-roteirizacao/corpus.ts b/__utilidades-back-office__/auto-roteirizacao/corpus.ts
index fca23ec..646b433 100644
--- a/__utilidades-back-office__/auto-roteirizacao/corpus.ts
+++ b/__utilidades-back-office__/auto-roteirizacao/corpus.ts
@@ -35,8 +35,25 @@ export interface Corpus {
   referenceCount: number;
 }
 
+/**
+ * Where the lab's exported stops park the vehicle (TASK-BG-022, TASK-BG-023, INV-001).
+ *
+ * - `app-default` (the default): each stop is flagged as the app's default anchor and starts on its
+ *   seed pin; the app moves it onto the street in front of that pin once the road graph loads.
+ * - `experiment`: the lab's own anchors, flagged as a manual choice so the app keeps them. Only on
+ *   explicit request (a harness key), and the route name says so.
+ *
+ * ⚠️ Until BG-022/BG-023 the exports used the lab's anchors flagged as the user's choice: imported
+ * into the app, they parked the vehicle away from the pin and survived even stop edits.
+ */
+export type AnchorPolicy = "app-default" | "experiment";
+
+/** Route-name marker of lab anchors: whoever imports the file sees it before trusting a stop. */
+export const EXPERIMENT_ANCHORS_MARKER = "ANCORAS DO EXPERIMENTO";
+
 /** Converts a spatial result into the existing app format, not an optimized route. */
-export const createInspectionPayload = (entry: CorpusCase, result: AnchorSearchResult, scenario: { runId: string; sampleStepMeters: number }): ExportedRoutePayloadV1 => {
+export const createInspectionPayload = (entry: CorpusCase, result: AnchorSearchResult, scenario: { runId: string; sampleStepMeters: number; anchorPolicy?: AnchorPolicy }): ExportedRoutePayloadV1 => {
+  const anchorPolicy: AnchorPolicy = scenario.anchorPolicy ?? "app-default";
   const byId = new Map(entry.points.map((p) => [p.id, p]));
   const assigned = result.groups.flatMap((g) => g.pointIds);
   const accounted = [...assigned, ...result.pending.map((p) => p.pointId), ...result.ignoredPointIds];
@@ -71,9 +88,13 @@ export const createInspectionPayload = (entry: CorpusCase, result: AnchorSearchR
 
   // A new execution/scenario gets its own standalone manifest; reimporting the
   // same file updates only that experimental copy, never a human manifest.
-  const identity = hash(JSON.stringify([scenario.runId, entry.id, entry.sourceHash, result.radiusMeters, scenario.sampleStepMeters, result.groups, result.pending, result.ignoredPointIds]));
+  const identity = hash(
+    JSON.stringify([scenario.runId, entry.id, entry.sourceHash, result.radiusMeters, scenario.sampleStepMeters, result.groups, result.pending, result.ignoredPointIds, anchorPolicy])
+  );
   const manifestId = `auto-inspection-${identity}`;
-  const routeName = `INSPEÇÃO RF-030 | ${entry.id} | R${result.radiusMeters}m P${scenario.sampleStepMeters}m | NÃO OTIMIZADO${result.status === "partial" ? " | PARCIAL" : ""}`;
+  const policyLabel = anchorPolicy === "experiment" ? ` | ${EXPERIMENT_ANCHORS_MARKER}` : "";
+  const routeName = `INSPEÇÃO RF-030${policyLabel} | ${entry.id} | R${result.radiusMeters}m P${scenario.sampleStepMeters}m | NÃO OTIMIZADO${result.status === "partial" ? " | PARCIAL" : ""}`;
+  const appDefault = anchorPolicy === "app-default";
   const route: PlannedRoute = {
     id: `${manifestId}-route`,
     createdAt: new Date().toISOString(),
@@ -81,20 +102,25 @@ export const createInspectionPayload = (entry: CorpusCase, result: AnchorSearchR
     startPoint: entry.reference?.route.startPoint ? { ...entry.reference.route.startPoint } : null,
     config: { ...normalizeRoutingConfig(entry.reference?.route.config), autoRadiusMeters: result.radiusMeters },
     ignoredPointIds: [...result.ignoredPointIds],
-    stops: result.groups.map((g, index) => ({
-      id: `${manifestId}-stop-${index + 1}`,
-      order: index + 1,
-      vehicleStop: { ...g.vehicleStop },
-      vehicleStopIsDefault: g.vehicleStopIsDefault,
-      radiusMeters: result.radiusMeters,
-      reversed: false,
-      pointIds: nearestFirstOrder(
-        g.vehicleStop,
-        g.pointIds.map((id) => byId.get(id)!),
-        false,
-        g.vehicleStopIsDefault ? g.seedPointId : undefined
-      ),
-    })),
+    stops: result.groups.map((g, index) => {
+      // app-default: the seed pin, which the app reprojects from pointIds[0]; experiment: the generator's spot.
+      const seed = byId.get(g.seedPointId)!;
+      const vehicleStop = appDefault ? { lat: seed.lat, lng: seed.lng } : { ...g.vehicleStop };
+      return {
+        id: `${manifestId}-stop-${index + 1}`,
+        order: index + 1,
+        vehicleStop,
+        vehicleStopIsDefault: appDefault,
+        radiusMeters: result.radiusMeters,
+        reversed: false,
+        pointIds: nearestFirstOrder(
+          vehicleStop,
+          g.pointIds.map((id) => byId.get(id)!),
+          false,
+          appDefault || g.vehicleStopIsDefault ? g.seedPointId : undefined
+        ),
+      };
+    }),
   };
   return createRouteExportPayload(manifestId, routeName, route, structuredClone(entry.points), structuredClone(entry.rows), undefined, {
     manifestFileName: basename(entry.file),
# 9261bbd · fix(TASK-BG-023): inspecao da RF-030 exporta a ancora padrao do app e a do gerador so com chave (#43)
diff --git a/__utilidades-back-office__/auto-roteirizacao/experimentArtifacts.ts b/__utilidades-back-office__/auto-roteirizacao/experimentArtifacts.ts
index bc883bb..311f7f4 100644
--- a/__utilidades-back-office__/auto-roteirizacao/experimentArtifacts.ts
+++ b/__utilidades-back-office__/auto-roteirizacao/experimentArtifacts.ts
@@ -5,10 +5,13 @@ import type { RowData } from "../../src/types";
 import type { DeliveryPoint, PlannedRoute } from "../../src/types/routing";
 import { DEFAULT_ROUTING_CONFIG } from "../../src/types/routing";
 import { createRouteExportPayload } from "../../src/services/routeExport";
-import { hash } from "./corpus";
+import { EXPERIMENT_ANCHORS_MARKER, hash, type AnchorPolicy } from "./corpus";
 import type { FundamentalExperimentConfig, FundamentalObjective, FundamentalSolution, FundamentalVariant } from "./fundamentalExperiment";
 import type { FundamentalReference } from "./fundamentals";
 
+// The anchor policy is shared with the RF-030 inspection export and lives in ./corpus (TASK-BG-023).
+export { EXPERIMENT_ANCHORS_MARKER, type AnchorPolicy };
+
 export interface ExperimentalArtifactInput {
   runId: string;
   caseId: string;
@@ -22,22 +25,6 @@ export interface ExperimentalArtifactInput {
   anchorPolicy?: AnchorPolicy;
 }
 
-/**
- * Where the exported stops park the vehicle (TASK-BG-022, INV-001).
- *
- * - `app-default` (the default): each stop is flagged as the app's default anchor and starts on its
- *   first pin; the app moves it onto the street in front of that pin once the road graph loads.
- * - `experiment`: the optimizer's anchors, flagged as a manual choice so the app keeps them. Only on
- *   explicit request (harness key `FUNDAMENTAL_ANCORAS_DO_EXPERIMENTO=1`), and the route name says so.
- *
- * ⚠️ Until BG-022 every export used the experiment's anchors flagged as the user's choice: imported
- * into the app, they parked the vehicle halfway to the next stop and survived even stop edits.
- */
-export type AnchorPolicy = "app-default" | "experiment";
-
-/** Route-name marker of experiment anchors: whoever imports the file sees it before trusting a stop. */
-export const EXPERIMENT_ANCHORS_MARKER = "ANCORAS DO EXPERIMENTO";
-
 const compare = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
 const safeJson = (value: unknown): string => (JSON.stringify(value) ?? "null").replaceAll("<", "\\u003c");
 const pointPackageKeys = (points: readonly DeliveryPoint[]): string[] => points.flatMap((point) => point.packages.map((pkg) => JSON.stringify([point.id, pkg.id, point.lat, point.lng]))).sort(compare);
# 9261bbd · fix(TASK-BG-023): inspecao da RF-030 exporta a ancora padrao do app e a do gerador so com chave (#43)
diff --git a/docs-mentor/invariantes.json b/docs-mentor/invariantes.json
index 2019f98..22d92d7 100644
--- a/docs-mentor/invariantes.json
+++ b/docs-mentor/invariantes.json
@@ -3,8 +3,8 @@
     "id": "INV-001",
     "enunciado": "Artefato de laboratorio que chega ao app sai com o comportamento padrao do app; o comportamento do teste so com chave explicita, desligada por padrao e marcada no nome do artefato",
     "porque": "Na validacao da TASK-RF-044, o JSON do experimento de auto-roteirizacao entrou no app com as ancoras otimizadas marcadas como escolha do usuario: o veiculo parava no meio do caminho ate a proxima parada e o padrao (em frente ao pino) nunca era reaplicado (TASK-BG-022)",
-    "mecanismo": "__utilidades-back-office__/auto-roteirizacao/experimentArtifacts.test.ts > exporta com as ancoras padrao do app sem a chave; > so a chave explicita exporta as ancoras do experimento; > recusa politica de ancoras misturada",
+    "mecanismo": "__utilidades-back-office__/auto-roteirizacao/experimentArtifacts.test.ts > exporta com as ancoras padrao do app sem a chave; > so a chave explicita exporta as ancoras do experimento; > recusa politica de ancoras misturada; __utilidades-back-office__/auto-roteirizacao/corpus.test.ts > exports app default anchors without the key; > only the explicit key exports the generator anchors",
     "declarada_em": "13/09/26",
-    "conferida_em": "13/09/26"
+    "conferida_em": "14/09/26"
   }
 ]
```

### TASK-RF-043 · Alternar tracado do roteiro e tornar passagens repetidas visiveis por opacidade

`RF` · cerimonia Standard · esforco M/M · origem: RF-57

**Criterios de aceite, e o teste que cada um nomeia:**

- vehicleRouteLegs devolve uma perna por par consecutivo (N com inicio, N-1 sem), marcada com a parada de origem, e costurar as pernas da exatamente o vehicleRoutePath (caminho e distancia)
  → teste: `src/__tests__/utils/routing/routePath.test.ts > vehicleRouteLegs`
- O mapa desenha uma polilinha por perna, continua e com opacidade abaixo de 0,5
  → teste: `src/__tests__/components/RouteMap.test.tsx > desenha uma polilinha por perna (contínua e translúcida) e o circuito a pé, empilhados pernas→circuito→sugestão (RF-043)`
- Com destaque, a perna sai verde continua acima das pernas (que esmaecem) e abaixo do circuito e da sugestao
  → teste: `src/__tests__/components/RouteMap.test.tsx > destaca a perna da parada em verde contínuo acima das pernas esmaecidas (RF-043)`
- Com parada selecionada, o destaque e a perna que sai dela ate a proxima; a ultima parada e o rascunho ficam sem destaque
  → teste: `src/__tests__/pages/MapPage.test.tsx > Meu roteiro: a parada selecionada destaca a perna que sai dela; a última fica sem destaque (RF-043)`
- A distancia do veiculo no Sumario e na visao geral nao muda
  → teste: `src/__tests__/pages/SummaryPage.test.tsx e src/__tests__/pages/MapPage.test.tsx (testes existentes de km do veiculo seguem verdes)`
- O tracado do veiculo (pernas e destaque) engrossa com o zoom perto, e o destaque continua mais grosso que as pernas (ajuste pedido no smoke de 14/09/26)
  → teste: `src/__tests__/components/RouteMap.test.tsx > engrossa o traçado do veículo com o zoom perto, mantendo o destaque mais grosso (RF-043)`
- No aparelho: trecho percorrido 2x visivelmente mais escuro que 1x; com uma passagem, nome da rua e setas de mao legiveis; o trecho destacado se distingue dos dois tracejados
  → teste: `nao se aplica: validacao manual de UI no aparelho, registrada com task validar`

**Pedido e alternativas (a solucao sugerida pelo humano e' hipotese):**

- pedido original: 12/09/26 (rascunho 2026-09-13--ui-investigacao-do-tracado-do-roteiro): 'esse monstro de linha no mapa fica em cima das setas que apontam a direcao da mao, e nao da pra ver o caminho ate a proxima rota'; 'o veiculo pode passar pela mesma rua sem ser possivel identificar visualmente no mapa'; 'opacidade - quando passa duas vezes no mesmo lugar, fica uma cor mais forte automaticamente'. 14/09/26: 'planeje a 043'
- solucao sugerida: Acumulo de opacidade; alternar rota inteira/trecho selecionado numa opcao em Configuracoes; trecho em linha tracejada verde
- alternativa: Uma polilinha por perna com opacidade baixa: o canvas do Leaflet (globalAlpha + stroke por camada) soma as passagens → pegaria o caso: Sim para repeticao entre pernas e para legibilidade de rua e setas; nao pega repeticao dentro da mesma perna nem o sentido · custo: Nenhuma dependencia; Leaflet 1.9.4 ja instalado (conferido em Canvas.js _fillStroke)
- alternativa: Contagem de passagens por aresta do grafo (espessura ou cor pelo numero de passagens) → pegaria o caso: Sim, inclusive dentro da perna, com numero exato · custo: Segmentar cada perna por aresta: muito mais objetos no canvas e calculo novo
- alternativa: Linhas paralelas deslocadas (leaflet-polylineoffset, MIT) → pegaria o caso: Sim, e pode indicar sentido · custo: Dependencia nova, quebra em curvas e ao mudar o zoom; descartada pelo humano em 12/09
- alternativa: Rotulos acima da rota (camada so de rotulos ou vetor com MapLibre GL JS, BSD-3) → pegaria o caso: Sim, legibilidade definitiva com qualquer opacidade · custo: XG: troca de tiles e de biblioteca de mapa (ADR-007, DT-004)
- alternativa: Destaque contextual do trecho ativo (apps de navegacao com varias paradas): a parada selecionada destaca a perna de saida e o resto esmaece → pegaria o caso: Sim, ver o caminho ate a proxima sem abrir configuracao; escolhido pelo humano em 14/09/26 no lugar da opcao global · custo: Menor que a configuracao global: sem servico, contexto, provider, secao no dialogo nem rotulos

**Declarou mudar:**

- src/utils/routing/routePath.ts - novo vehicleRouteLegs (pernas sem costurar, cada uma com o indice da parada de origem; null = inicio); vehicleRoutePath passa a derivar dele, mesmo resultado
- src/pages/MapPage.tsx - overlay leva vehicleRoute como uma lista por perna e vehicleRouteHighlight (perna que sai da parada em foco, fora do rascunho); km do veiculo na visao geral segue a mesma soma
- src/components/RouteMap.tsx - uma polilinha por perna, continua e translucida em zinco (MANUAL KNOB); com destaque, o resto esmaece e a perna sai verde continua e grossa, acima das pernas e abaixo do circuito e da sugestao; o tracado do veiculo engrossa com o zoom perto (ajuste do smoke de 14/09/26)
- src/__tests__/utils/routing/routePath.test.ts - testes de vehicleRouteLegs
- src/__tests__/components/RouteMap.test.tsx - teste da RF-006.7 passa a pernas; teste novo do destaque
- src/__tests__/pages/MapPage.test.tsx - stub conta pernas e expoe o destaque; teste novo do destaque pela parada selecionada

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| testes | APROVADO | 14/09/26 09:42 | 0 | — |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| build | APROVADO | — | 0 | — |
| validacao_manual | APROVADO | — | — | Humano validou no Samsung M35 (14/09/26) pelo dev server na rede local, roteiro L-30, com capturas no chat: tracado translucido com trechos repetidos mais escuros e nome de rua e setas de mao legiveis; parada selecionada destaca em verde a perna ate a proxima (P2 e P5), resto esmaecido. Calibrou a mao os knobs em RouteMap.tsx (tracado weight 6, opacidade 0,45, zinc-700; esmaecido 0,3; verde weight 7, opacidade 0,5; engrossa ate 2x no zoom 19) e declarou 'razoavel pra poder saber o trajeto' e 'validacao feita'. |

**Riscos declarados:** Juncao entre pernas com lineCap round soma alpha e marca uma bolinha em cada parada (quase sempre sob o marcador P) · Destaque verde disputando atencao com a sugestao ciano e o circuito ambar · MapPage.tsx com 90 KB e MapPage.test.tsx com 98 KB: diff precisa ficar contido

**O diff da tarefa:**

1 commit(s): `de865d0` feat(TASK-RF-043): tracado do roteiro por perna com passagens repetidas mais escuras e destaque da perna da parada selecionada (#44)

| arquivo | linhas | fora da revisao |
| :-- | --: | :-- |
| `docs-mentor/contexto.json` | 12 | vista gerada |
| `docs-mentor/requisitos/implementados.md` | 1 | vista gerada |
| `docs-mentor/requisitos/pendentes.md` | 1 | vista gerada |
| `docs-mentor/requisitos/requisitos.json` | 8 | — |
| `docs-mentor/tarefas/abertas/TASK-RF-043.json` | 46 | registro do mentor |
| `docs-mentor/tarefas/concluidas/0-indice.md` | 1 | registro do mentor |
| `docs-mentor/tarefas/concluidas/2026-09-14--11h12--TASK-RF-043.json` | 248 | registro do mentor |
| `docs-mentor/tarefas/concluidas/2026-09-14--11h12--TASK-RF-043.md` | 36 | registro do mentor |
| `docs-mentor/tarefas/reserva.md` | 1 | registro do mentor |
| `src/__tests__/components/RouteMap.test.tsx` | 108 | — |
| `src/__tests__/pages/MapPage.test.tsx` | 34 | — |
| `src/__tests__/utils/routing/routePath.test.ts` | 28 | — |
| `src/components/RouteMap.tsx` | 67 | — |
| `src/pages/MapPage.tsx` | 34 | — |
| `src/utils/routing/routePath.ts` | 52 | — |

```diff
# de865d0 · feat(TASK-RF-043): tracado do roteiro por perna com passagens repetidas mais escuras e destaque da perna da parada selecionada (#44)
diff --git a/src/__tests__/components/RouteMap.test.tsx b/src/__tests__/components/RouteMap.test.tsx
index f16d5bf..8ae326b 100644
--- a/src/__tests__/components/RouteMap.test.tsx
+++ b/src/__tests__/components/RouteMap.test.tsx
@@ -14,6 +14,7 @@ import { RouteMap } from "../../components/RouteMap";
 import { COLUMN_NAMES, UI_LABELS, MAP_CONFIG } from "../../constants";
 import type { RowData } from "../../types";
 import type { InteractionState } from "../../utils/markers/markerModels";
+import { ROTEIRO_TYPE_COLORS } from "../../utils/markers/markerColors";
 
 // =============================================================================
 // 1. CRITICAL: MOCK LEAFLET
@@ -56,7 +57,7 @@ vi.mock("leaflet", () => ({
     Icon: vi.fn(),
     divIcon: vi.fn(() => ({})),
     DivIcon: vi.fn(),
-    polyline: vi.fn(() => ({ addTo: vi.fn() })),
+    polyline: vi.fn(() => ({ addTo: vi.fn(), setStyle: vi.fn() })),
     circle: vi.fn(() => ({ addTo: vi.fn() })),
     circleMarker: vi.fn(() => ({ addTo: vi.fn() })),
   },
@@ -433,11 +434,15 @@ describe("RouteMap (controlled embedded map)", () => {
     expect(L.polyline).not.toHaveBeenCalled();
   });
 
-  it("desenha a rota de veículo (contínua) e o circuito a pé (tracejado âmbar), empilhados veículo→circuito→sugestão (RF-006.7)", () => {
-    const vehicleRoute = [
+  describe("traçado do veículo por perna (RF-006.7, RF-043)", () => {
+    const legA = [
       { lat: -22.9, lng: -43.2 },
       { lat: -22.91, lng: -43.21 },
     ];
+    const legB = [
+      { lat: -22.91, lng: -43.21 },
+      { lat: -22.92, lng: -43.2 },
+    ];
     const footCircuit = [
       { lat: -22.9, lng: -43.2 },
       { lat: -22.901, lng: -43.199 },
@@ -447,21 +452,92 @@ describe("RouteMap (controlled embedded map)", () => {
       { lat: -22.9, lng: -43.2 },
       { lat: -22.95, lng: -43.15 },
     ];
-    renderRouteMap(mockRowsWithCoordinates, {
-      models: externalModels,
-      roteiroOverlay: { start: null, suggestionPath, vehicleRoute, footCircuit, suggestionFaded: false },
+    const pairs = (p: { lat: number; lng: number }[]) => p.map((q) => [q.lat, q.lng]);
+    /** Every add-order index of a drawn path (a leg can be drawn twice: as a leg and as the highlight). */
+    const indicesOf = (p: { lat: number; lng: number }[]) =>
+      vi
+        .mocked(L.polyline)
+        .mock.calls.map((call, index) => (JSON.stringify(call[0]) === JSON.stringify(pairs(p)) ? index : -1))
+        .filter((index) => index >= 0);
+    const styleAt = (index: number) => vi.mocked(L.polyline).mock.calls[index][1]!;
+
+    it("desenha uma polilinha por perna (contínua e translúcida) e o circuito a pé, empilhados pernas→circuito→sugestão (RF-043)", () => {
+      renderRouteMap(mockRowsWithCoordinates, {
+        models: externalModels,
+        roteiroOverlay: { start: null, suggestionPath, vehicleRoute: [legA, legB], footCircuit, suggestionFaded: false },
+      });
+
+      // One polyline PER LEG: canvas only adds opacity up between separate strokes, so a
+      // street driven twice darkens; translucent so the tile's names and one-way arrows show.
+      for (const leg of [legA, legB]) {
+        expect(indicesOf(leg)).toHaveLength(1);
+        expect(styleAt(indicesOf(leg)[0])).not.toHaveProperty("dashArray");
+        expect(styleAt(indicesOf(leg)[0]).opacity).toBeLessThan(0.5);
+      }
+      expect(L.polyline).toHaveBeenCalledWith(pairs(footCircuit), expect.objectContaining({ dashArray: "6 8", color: "#F59E0B" }));
+      // Stacking (canvas add order): legs < foot circuit < suggestion.
+      expect(indicesOf(legB)[0]).toBeLessThan(indicesOf(footCircuit)[0]);
+      expect(indicesOf(footCircuit)[0]).toBeLessThan(indicesOf(suggestionPath)[0]);
     });
 
-    const calls = vi.mocked(L.polyline).mock.calls;
-    const pairs = (p: { lat: number; lng: number }[]) => p.map((q) => [q.lat, q.lng]);
-    const indexOf = (p: { lat: number; lng: number }[]) => calls.findIndex((c) => JSON.stringify(c[0]) === JSON.stringify(pairs(p)));
-
-    // Veículo = CONTÍNUA (sem dashArray); circuito = tracejado âmbar.
-    expect(calls[indexOf(vehicleRoute)][1]).not.toHaveProperty("dashArray");
-    expect(L.polyline).toHaveBeenCalledWith(pairs(footCircuit), expect.objectContaining({ dashArray: "6 8", color: "#F59E0B" }));
-    // Empilhamento (ordem de add no canvas): veículo < circuito < sugestão.
-    expect(indexOf(vehicleRoute)).toBeLessThan(indexOf(footCircuit));
-    expect(indexOf(footCircuit)).toBeLessThan(indexOf(suggestionPath));
+    it("destaca a perna da parada em verde contínuo acima das pernas esmaecidas (RF-043)", () => {
+      const { rerender } = renderRouteMap(mockRowsWithCoordinates, {
+        models: externalModels,
+        roteiroOverlay: { start: null, suggestionPath, vehicleRoute: [legA, legB], footCircuit, suggestionFaded: false },
+      });
+      const plainLegOpacity = styleAt(indicesOf(legA)[0]).opacity!;
+
+      vi.mocked(L.polyline).mockClear();
+      rerender(
+        <RouteMap
+          rows={mockRowsWithCoordinates}
+          interaction={collapsed}
+          onInteractionChange={vi.fn()}
+          models={externalModels}
+          roteiroOverlay={{ start: null, suggestionPath, vehicleRoute: [legA, legB], vehicleRouteHighlight: legB, footCircuit, suggestionFaded: false }}
+        />
+      );
+
+      const [legBIndex, highlightIndex] = indicesOf(legB);
+      const highlight = styleAt(highlightIndex);
+      // The rest of the route fades so the highlighted leg reads first.
+      expect(styleAt(indicesOf(legA)[0]).opacity).toBeLessThan(plainLegOpacity);
+      // Continuous green, thicker than a leg ("continuous = where the car goes; dashed = hypothesis or walking").
+      expect(highlight).not.toHaveProperty("dashArray");
+      expect(highlight.color).toBe(ROTEIRO_TYPE_COLORS.residential.bottom);
+      expect(highlight.weight).toBeGreaterThan(styleAt(legBIndex).weight!);
+      // Above every leg, below the foot circuit and the suggestion.
+      expect(highlightIndex).toBeGreaterThan(legBIndex);
+      expect(highlightIndex).toBeLessThan(indicesOf(footCircuit)[0]);
+      expect(indicesOf(footCircuit)[0]).toBeLessThan(indicesOf(suggestionPath)[0]);
+    });
+
+    it("engrossa o traçado do veículo com o zoom perto, mantendo o destaque mais grosso (RF-043)", () => {
+      renderRouteMap(mockRowsWithCoordinates, {
+        models: externalModels,
+        roteiroOverlay: { start: null, suggestionPath: null, vehicleRoute: [legA, legB], vehicleRouteHighlight: legB, suggestionFaded: false },
+      });
+      const [legBIndex, highlightIndex] = indicesOf(legB);
+      const legAtDefault = styleAt(indicesOf(legA)[0]).weight!;
+      const highlightAtDefault = styleAt(highlightIndex).weight!;
+      const lineAt = (index: number) => vi.mocked(L.polyline).mock.results[index].value as { setStyle: ReturnType<typeof vi.fn> };
+
+      // Zooming to street level re-widths the drawn lines on `zoomend`.
+      mapMethods.getZoom.mockReturnValue(MAP_CONFIG.ZOOM.MAX);
+      try {
+        act(() => {
+          mapMethods.on.mock.calls.filter(([event]) => event === "zoomend").forEach(([, handler]) => (handler as () => void)());
+        });
+      } finally {
+        mapMethods.getZoom.mockReturnValue(16);
+      }
+
+      const legAtMax = lineAt(indicesOf(legA)[0]).setStyle.mock.lastCall![0].weight;
+      const highlightAtMax = lineAt(highlightIndex).setStyle.mock.lastCall![0].weight;
+      expect(legAtMax).toBeGreaterThan(legAtDefault);
+      expect(highlightAtMax).toBeGreaterThan(highlightAtDefault);
+      expect(highlightAtMax).toBeGreaterThan(lineAt(legBIndex).setStyle.mock.lastCall![0].weight);
+    });
   });
 
   it("a sugestão é FORTE fora do rascunho (RF-006.7)", () => {
# de865d0 · feat(TASK-RF-043): tracado do roteiro por perna com passagens repetidas mais escuras e destaque da perna da parada selecionada (#44)
diff --git a/src/__tests__/pages/MapPage.test.tsx b/src/__tests__/pages/MapPage.test.tsx
index 3937850..ac82fb6 100644
--- a/src/__tests__/pages/MapPage.test.tsx
+++ b/src/__tests__/pages/MapPage.test.tsx
@@ -162,7 +162,8 @@ vi.mock("../../components/RouteMap", () => ({
       suggestionPath: LatLng[] | null;
       radiusCircle?: { center: LatLng; meters: number } | null;
       anchor?: LatLng | null;
-      vehicleRoute?: LatLng[] | null;
+      vehicleRoute?: LatLng[][] | null;
+      vehicleRouteHighlight?: LatLng[] | null;
       footCircuit?: LatLng[] | null;
       suggestionFaded?: boolean;
     };
@@ -170,6 +171,11 @@ vi.mock("../../components/RouteMap", () => ({
     <div
       data-testid="route-map-stub"
       data-vehicle-route={String(roteiroOverlay?.vehicleRoute?.length ?? "none")}
+      data-vehicle-highlight={
+        roteiroOverlay?.vehicleRouteHighlight?.length
+          ? [roteiroOverlay.vehicleRouteHighlight[0], roteiroOverlay.vehicleRouteHighlight[roteiroOverlay.vehicleRouteHighlight.length - 1]].map((p) => `${p.lat},${p.lng}`).join(">")
+          : "none"
+      }
       data-foot-circuit={String(roteiroOverlay?.footCircuit?.length ?? "none")}
       data-suggestion-faded={String(roteiroOverlay?.suggestionFaded ?? false)}
       data-controlled={String(!!onInteractionChange)}
@@ -896,6 +902,32 @@ describe("MapPage (focus screen)", () => {
     expect(stub).toHaveAttribute("data-focus-bounds", "1");
   });
 
+  it("Meu roteiro: a parada selecionada destaca a perna que sai dela; a última fica sem destaque (RF-043)", async () => {
+    uploaderState.routes = { "A-1": rowsThreePoints };
+    routeStorageState.saved = savedRoute([P1, P2]);
+    renderPage("/mapa?romaneio=hash-1&rota=A-1&modo=roteiro");
+    await waitFor(() => expect(screen.getByTestId("route-map-stub").getAttribute("data-models-summary")).toContain("stop"));
+
+    const stub = screen.getByTestId("route-map-stub");
+    const next = () => fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.NEXT_STOP }));
+    const prev = () => fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.PREV_STOP }));
+
+    // Start → P1 and P1 → P2 are separate legs; with no stop selected nothing is highlighted.
+    expect(stub).toHaveAttribute("data-vehicle-route", "2");
+    expect(stub).toHaveAttribute("data-vehicle-highlight", "none");
+
+    next(); // P1: the leg that LEAVES it, towards P2
+    expect(stub).toHaveAttribute("data-vehicle-highlight", "-22.9,-43.2>-22.905,-43.2");
+    next(); // P2 is the last stop: no leg leaves it
+    expect(stub).toHaveAttribute("data-vehicle-highlight", "none");
+    prev(); // back to P1
+    expect(stub).toHaveAttribute("data-vehicle-highlight", "-22.9,-43.2>-22.905,-43.2");
+
+    // Editing opens a draft: the foot circuit follows the draft and the highlight steps aside.
+    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.ROTEIRO_STOP.EDIT }));
+    expect(stub).toHaveAttribute("data-vehicle-highlight", "none");
+  });
+
   it("Meu roteiro: com uma parada so as setas ficam desativadas", async () => {
     uploaderState.routes = { "A-1": rowsThreePoints };
     // No firmed stop: no arrows at all.
# de865d0 · feat(TASK-RF-043): tracado do roteiro por perna com passagens repetidas mais escuras e destaque da perna da parada selecionada (#44)
diff --git a/src/__tests__/utils/routing/routePath.test.ts b/src/__tests__/utils/routing/routePath.test.ts
index bc7fda6..03da2ad 100644
--- a/src/__tests__/utils/routing/routePath.test.ts
+++ b/src/__tests__/utils/routing/routePath.test.ts
@@ -1,5 +1,5 @@
 import { describe, it, expect } from "vitest";
-import { vehicleRoutePath, footCircuitPath } from "../../../utils/routing/routePath";
+import { vehicleRoutePath, vehicleRouteLegs, footCircuitPath } from "../../../utils/routing/routePath";
 import { pedestrianGraph } from "../../../utils/routing/pedestrian";
 import { haversine } from "../../../utils/routing/geo";
 import { squareGraph, COORDS, A, B, C, D } from "./__fixtures__/syntheticGraph";
@@ -40,6 +40,32 @@ describe("vehicleRoutePath", () => {
   });
 });
 
+describe("vehicleRouteLegs", () => {
+  it("returns one leg per consecutive pair, tagged with the stop it leaves (null = the start)", () => {
+    const withStart = vehicleRouteLegs(null, START, [COORDS[A], COORDS[C]]);
+    expect(withStart.map((leg) => leg.fromStopIndex)).toEqual([null, 0]);
+    expect(withStart.map((leg) => leg.path)).toEqual([
+      [START, COORDS[A]],
+      [COORDS[A], COORDS[C]],
+    ]);
+
+    // Without a start the first leg already leaves stop 0; a lone stop has nowhere to go.
+    expect(vehicleRouteLegs(null, null, [COORDS[A], COORDS[C]]).map((leg) => leg.fromStopIndex)).toEqual([0]);
+    expect(vehicleRouteLegs(null, null, [COORDS[A]])).toEqual([]);
+  });
+
+  it("stitched back together, the legs are exactly vehicleRoutePath (path and distance)", () => {
+    const anchors = [near(COORDS[A]), near(COORDS[B]), near(COORDS[D])];
+    const legs = vehicleRouteLegs(squareGraph, START, anchors);
+    const stitched = legs.flatMap((leg, i) => (i === 0 ? leg.path : leg.path.slice(1)));
+    const whole = vehicleRoutePath(squareGraph, START, anchors);
+
+    expect(legs).toHaveLength(3);
+    expect(stitched).toEqual(whole.path);
+    expect(legs.reduce((sum, leg) => sum + leg.distanceMeters, 0)).toBeCloseTo(whole.distanceMeters, 6);
+  });
+});
+
 describe("footCircuitPath", () => {
   const ANCHOR: LatLng = { lat: -22.9805, lng: -43.1995 };
# de865d0 · feat(TASK-RF-043): tracado do roteiro por perna com passagens repetidas mais escuras e destaque da perna da parada selecionada (#44)
diff --git a/src/components/RouteMap.tsx b/src/components/RouteMap.tsx
index 2d491ba..7646570 100644
--- a/src/components/RouteMap.tsx
+++ b/src/components/RouteMap.tsx
@@ -13,7 +13,7 @@ import { MAP_CONFIG, FOCUS_MAX_ZOOM, UI_LABELS } from "../constants";
 import { createMarkerDivIcon } from "../utils/markers/markerIcon";
 import { MARKER_GEOMETRY } from "../utils/markers/markerSvg";
 import { groupRowsByStop } from "../utils/markers/stopGrouping";
-import { colorForLocationType, ROTEIRO_MARKER_COLORS, ROTEIRO_ACCENT } from "../utils/markers/markerColors";
+import { colorForLocationType, ROTEIRO_MARKER_COLORS, ROTEIRO_ACCENT, ROTEIRO_TYPE_COLORS } from "../utils/markers/markerColors";
 import { scaleForZoom, MARKER_MAX_SCALE } from "../utils/markers/markerScale";
 import { computeMarkerModels, nextInteraction, expandInteraction, regroupInteraction, type MarkerModel, type InteractionState } from "../utils/markers/markerModels";
 
@@ -64,9 +64,27 @@ const DOUBLE_TAP_MS = 220;
 const SUGGESTION_LINE_STYLE = { dashArray: "6 8", weight: 3, color: ROTEIRO_ACCENT, opacity: 0.55 } as const;
 /** The suggestion is FADED in a draft, STRONGER once the stop is firmed (fluxo §6). */
 const SUGGESTION_LINE_STRONG = { ...SUGGESTION_LINE_STYLE, weight: 4, opacity: 0.9 } as const;
-/** Vehicle route between anchors (RF-006.7): CONTINUOUS (no dashArray), in the
-    anchor's slate — reads as "the car's street path". ⚙️ MANUAL KNOB (color/weight). */
-const VEHICLE_ROUTE_STYLE = { weight: 4, color: ROTEIRO_MARKER_COLORS.vehicle.bottom, opacity: 0.9 } as const;
+/** Vehicle route between anchors (RF-006.7): CONTINUOUS (no dashArray), in ZINC
+    (Tailwind zinc-700, device smoke 14/09) — reads as "the car's street path". One
+    stroke PER LEG and TRANSLUCENT (RF-043): canvas adds opacity up where legs
+    overlap, so a street driven twice reads darker — 1 − (1 − α)^N — while the
+    tile's street names and one-way arrows stay readable under a single pass.
+    ⚙️ MANUAL KNOB (color/weight/opacity). */
+const VEHICLE_ROUTE_STYLE = { weight: 6, color: "#3F3F46", opacity: 0.45 } as const;
+/** The legs fade while one leg is highlighted (RF-043), still visible. ⚙️ MANUAL KNOB. */
+const VEHICLE_ROUTE_DIMMED_STYLE = { ...VEHICLE_ROUTE_STYLE, opacity: 0.3 } as const;
+/** The leg leaving the stop in focus (RF-043): CONTINUOUS roteiro green, thicker —
+    "continuous = where the car goes; dashed = hypothesis or walking". ⚙️ MANUAL KNOB. */
+const VEHICLE_LEG_HIGHLIGHT_STYLE = { weight: 7, color: ROTEIRO_TYPE_COLORS.residential.bottom, opacity: 0.5 } as const;
+/** The vehicle trace thickens when zoomed in (RF-043 smoke, 14/09): its base width up
+    to the default zoom, growing linearly to this factor at the closest zoom — a
+    4 px line looked thin against a street at street level. ⚙️ MANUAL KNOB. */
+const ROUTE_LINE_MAX_ZOOM_FACTOR = 2;
+const routeLineWeightForZoom = (weight: number, zoom: number): number => {
+  const { DEFAULT, MAX } = MAP_CONFIG.ZOOM;
+  const t = Math.min(1, Math.max(0, (zoom - DEFAULT) / (MAX - DEFAULT)));
+  return weight * (1 + t * (ROUTE_LINE_MAX_ZOOM_FACTOR - 1));
+};
 /** Foot circuit of a stop (RF-006.7): DASHED amber — distinct from the marker
     palette (green/blue/gray) and the cyan suggestion. ⚙️ MANUAL KNOB. */
 const FOOT_CIRCUIT_STYLE = { dashArray: "6 8", weight: 3, color: "#F59E0B", opacity: 0.85 } as const;
@@ -163,8 +181,10 @@ interface Props {
         expanded firmed stop SHOWS the car but doesn't let it move (editing the
         anchor means "Editar parada"). */
     anchorDraggable?: boolean;
-    /** Vehicle route (RF-006.7): the continuous line start → anchors (street path). */
-    vehicleRoute?: LatLng[] | null;
+    /** Vehicle route (RF-006.7): start → anchors (street path), one path PER LEG (RF-043). */
+    vehicleRoute?: LatLng[][] | null;
+    /** The leg leaving the stop in focus, highlighted over the faded legs (RF-043). */
+    vehicleRouteHighlight?: LatLng[] | null;
     /** Foot circuit (RF-006.7): the dashed loop of the selected/draft stop. */
     footCircuit?: LatLng[] | null;
     /** Fade the suggestion (RF-006.7): true in a draft, false when firmed. */
@@ -242,6 +262,7 @@ export const RouteMap: React.FC<Props> = ({
   const anchorLng = roteiroOverlay?.anchor?.lng;
   const anchorDraggable = roteiroOverlay?.anchorDraggable ?? false;
   const vehicleRoute = roteiroOverlay?.vehicleRoute ?? null;
+  const vehicleRouteHighlight = roteiroOverlay?.vehicleRouteHighlight ?? null;
   const footCircuit = roteiroOverlay?.footCircuit ?? null;
   const suggestionFaded = roteiroOverlay?.suggestionFaded ?? false;
   /** Bounds signature: refit ONLY when the framed set changes (markers appear/
@@ -576,13 +597,22 @@ export const RouteMap: React.FC<Props> = ({
     }
 
     // Route traces (RF-006.7). Canvas (`preferCanvas`) has no zIndexOffset, so
-    // ADD ORDER = stacking: vehicle route (bottom) → foot circuit → suggestion (top).
-    if (vehicleRoute && vehicleRoute.length >= 2) {
-      L.polyline(
-        vehicleRoute.map((p) => [p.lat, p.lng] as [number, number]),
-        VEHICLE_ROUTE_STYLE
-      ).addTo(overlayLayer);
-    }
+    // ADD ORDER = stacking: vehicle legs (bottom) → highlighted leg → foot circuit → suggestion (top).
+    /** Vehicle trace lines, kept to re-width them on zoom (RF-043). */
+    const traceLines: { line: L.Polyline; weight: number }[] = [];
+    const addTraceLine = (path: LatLng[], style: L.PolylineOptions & { weight: number }) => {
+      const line = L.polyline(
+        path.map((p) => [p.lat, p.lng] as [number, number]),
+        { ...style, weight: routeLineWeightForZoom(style.weight, safeZoom()) }
+      );
+      line.addTo(overlayLayer);
+      traceLines.push({ line, weight: style.weight });
+    };
+    const highlightedLeg = vehicleRouteHighlight && vehicleRouteHighlight.length >= 2 ? vehicleRouteHighlight : null;
+    vehicleRoute?.forEach((leg) => {
+      if (leg.length >= 2) addTraceLine(leg, highlightedLeg ? VEHICLE_ROUTE_DIMMED_STYLE : VEHICLE_ROUTE_STYLE);
+    });
+    if (highlightedLeg) addTraceLine(highlightedLeg, VEHICLE_LEG_HIGHLIGHT_STYLE);
     if (footCircuit && footCircuit.length >= 2) {
       L.polyline(
         footCircuit.map((p) => [p.lat, p.lng] as [number, number]),
@@ -596,22 +626,25 @@ export const RouteMap: React.FC<Props> = ({
       ).addTo(overlayLayer);
     }
 
-    if (overlayMarkers.length === 0) return;
+    if (overlayMarkers.length === 0 && traceLines.length === 0) return;
     /** Overlay markers scale with zoom like every other marker — with the same
-        skip-when-unchanged as the main layer (REF-015c). */
+        skip-when-unchanged as the main layer (REF-015c); the vehicle trace
+        re-widths with it (RF-043). */
     const rescaleOverlay = () => {
-      const nextScale = scaleForZoom(safeZoom());
+      const zoom = safeZoom();
+      const nextScale = scaleForZoom(zoom);
       overlayMarkers.forEach((entry) => {
         if (nextScale === entry.lastScale) return;
         entry.lastScale = nextScale;
         entry.marker.setIcon(createMarkerDivIcon({ ...entry.iconProps, scale: nextScale }));
       });
+      traceLines.forEach(({ line, weight }) => line.setStyle({ weight: routeLineWeightForZoom(weight, zoom) }));
     };
     map.on("zoomend", rescaleOverlay);
     return () => {
       map.off("zoomend", rescaleOverlay);
     };
-  }, [startLat, startLng, suggestionPath, radiusCircle, anchorLat, anchorLng, anchorDraggable, vehicleRoute, footCircuit, suggestionFaded]);
+  }, [startLat, startLng, suggestionPath, radiusCircle, anchorLat, anchorLng, anchorDraggable, vehicleRoute, vehicleRouteHighlight, footCircuit, suggestionFaded]);
 
   // Fills the parent (focus screen layout); leaving the screen is the shell's
   // header back arrow / the page's Escape handler (TASK-RF-023.5).
# de865d0 · feat(TASK-RF-043): tracado do roteiro por perna com passagens repetidas mais escuras e destaque da perna da parada selecionada (#44)
diff --git a/src/pages/MapPage.tsx b/src/pages/MapPage.tsx
index 3f097f4..91dbd4c 100644
--- a/src/pages/MapPage.tsx
+++ b/src/pages/MapPage.tsx
@@ -61,7 +61,7 @@ import { nearestWayName } from "../utils/routing/match";
 import { nearestFirstOrder } from "../utils/routing/walkOrder";
 import { pedestrianGraph } from "../utils/routing/pedestrian";
 import { suggestionPath } from "../utils/routing/suggestion";
-import { vehicleRoutePath, footCircuitPath } from "../utils/routing/routePath";
+import { vehicleRouteLegs, footCircuitPath } from "../utils/routing/routePath";
 import { haversine } from "../utils/routing/geo";
 import { isWithinRioBounds } from "../utils/coordinates";
 import { formatMeters } from "../utils/formatters";
@@ -803,12 +803,14 @@ function MapScreen({ rows, manifestId, routeName, manifestMeta }: { rows: RowDat
 
   // ------- Route traces (RF-006.7) -------
   /** Vehicle route: start → each anchor over the DIRECTED graph (respects one-
-      way; straight fallback without a graph). Drawn whenever a stop is firmed;
-      its distance is reused for the overview's real vehicle km. */
-  const vehicleRoute = useMemo(() => {
+      way; straight fallback without a graph), as SEPARATE legs so a street driven
+      twice reads darker on the map (RF-043). Drawn whenever a stop is firmed;
+      the legs' distance is reused for the overview's real vehicle km. */
+  const vehicleLegs = useMemo(() => {
     const anchors = builderState.stops.map((s) => s.vehicleStop);
-    return anchors.length > 0 ? vehicleRoutePath(graph, builderState.startPoint, anchors) : null;
+    return anchors.length > 0 ? vehicleRouteLegs(graph, builderState.startPoint, anchors) : null;
   }, [graph, builderState.startPoint, builderState.stops]);
+  const vehicleRouteMeters = vehicleLegs?.reduce((sum, leg) => sum + leg.distanceMeters, 0);
   /** Foot circuit (dashed loop) of the stop in FOCUS: the DRAFT while building/
       editing (follows the chosen points live), else the selected/expanded firmed
       stop — over the PEDESTRIAN graph (ignores one-way). */
@@ -822,6 +824,15 @@ function MapScreen({ rows, manifestId, routeName, manifestMeta }: { rows: RowDat
     const ordered = orderedStopPoints(stop, pointsById);
     return ordered.length > 0 ? footCircuitPath(pedGraph, stop.vehicleStop, ordered) : null;
   }, [draft, selectedStop, expandedStop, pedGraph, pointsById]);
+  /** The leg that LEAVES the firmed stop in focus, towards the next one (RF-043):
+      highlighted so "how do I get to the next stop" reads first. None in a draft
+      (the foot circuit follows the edit) nor on the last stop (no leg leaves it). */
+  const vehicleRouteHighlight = useMemo(() => {
+    const stop = draft ? null : (selectedStop ?? expandedStop);
+    if (!stop || !vehicleLegs) return null;
+    const stopIndex = builderState.stops.findIndex((s) => s.id === stop.id);
+    return vehicleLegs.find((leg) => leg.fromStopIndex === stopIndex)?.path ?? null;
+  }, [draft, selectedStop, expandedStop, vehicleLegs, builderState.stops]);
 
   const roteiroOverlay = useMemo(
     () => ({
@@ -829,7 +840,8 @@ function MapScreen({ rows, manifestId, routeName, manifestMeta }: { rows: RowDat
       suggestionPath: suggestion?.path ?? null,
       // Route traces (RF-006.7): vehicle backbone + the focused stop's foot loop;
       // the suggestion is faded while a draft is open, stronger once firmed (§6).
-      vehicleRoute: vehicleRoute?.path ?? null,
+      vehicleRoute: vehicleLegs?.map((leg) => leg.path) ?? null,
+      vehicleRouteHighlight,
       footCircuit: footCircuit?.path ?? null,
       suggestionFaded: draft !== null,
       // The radius circle also PREVIEWS on the selected orphan, before creating (U6).
@@ -844,7 +856,7 @@ function MapScreen({ rows, manifestId, routeName, manifestMeta }: { rows: RowDat
       anchor: draft?.vehicleStop ?? expandedStop?.vehicleStop ?? null,
       anchorDraggable: draft !== null,
     }),
-    [builderState.startPoint, previewRadiusMeters, suggestion, draft, draftSeed, selectedPoint, expandedStop, vehicleRoute, footCircuit]
+    [builderState.startPoint, previewRadiusMeters, suggestion, draft, draftSeed, selectedPoint, expandedStop, vehicleLegs, vehicleRouteHighlight, footCircuit]
   );
 
   /** Anchor drag (RF-006.5): street-project the dropped point (map matching
@@ -1133,14 +1145,10 @@ function MapScreen({ rows, manifestId, routeName, manifestMeta }: { rows: RowDat
           // consumer) — the vehicle A* chain is reused from the drawn route, so
           // opening the panel costs one pass of the foot circuits, not two.
           // Override the route's delivery times with the GLOBAL preference (RF-007.2).
-          plannedRouteTotals(
-            { ...toPlannedRoute(builderState), config: estimateConfig },
-            points,
-            panelView === "overview" ? { graph, pedGraph, vehicleMetersOverride: vehicleRoute?.distanceMeters } : undefined
-          )
+          plannedRouteTotals({ ...toPlannedRoute(builderState), config: estimateConfig }, points, panelView === "overview" ? { graph, pedGraph, vehicleMetersOverride: vehicleRouteMeters } : undefined)
         : null,
     // eslint-disable-next-line react-hooks/exhaustive-deps -- toPlannedRoute reads only stops/startPoint/config (routeId/createdAt are stable); narrowing off the whole builderState keeps draft edits from recomputing the graph totals.
-    [mode, builderState.stops, builderState.startPoint, estimateConfig, points, panelView, graph, pedGraph, vehicleRoute]
+    [mode, builderState.stops, builderState.startPoint, estimateConfig, points, panelView, graph, pedGraph, vehicleRouteMeters]
   );
   /** Whether the shown totals came from the street graph (RF-006.7) — drives the
       honest "Detalhes" caption (streets vs the straight-line fallback). */
# de865d0 · feat(TASK-RF-043): tracado do roteiro por perna com passagens repetidas mais escuras e destaque da perna da parada selecionada (#44)
diff --git a/src/utils/routing/routePath.ts b/src/utils/routing/routePath.ts
index 1cda4f4..f3d4767 100644
--- a/src/utils/routing/routePath.ts
+++ b/src/utils/routing/routePath.ts
@@ -24,22 +24,48 @@ export interface RoutePathResult {
   distanceMeters: number;
 }
 
+/** One vehicle leg, kept apart so the map can draw it as its own stroke (TASK-RF-043). */
+export interface VehicleRouteLeg extends RoutePathResult {
+  /** Index (in `anchors`) of the stop this leg LEAVES; `null` for the start → first stop leg. */
+  fromStopIndex: number | null;
+}
+
+/** One `suggestionPath` per consecutive pair of waypoints (each leg carries both endpoints). */
+const legsBetween = (graph: RoadGraph | null, waypoints: LatLng[]): RoutePathResult[] =>
+  waypoints.slice(1).map((to, i) => {
+    const leg = suggestionPath(graph, waypoints[i], to);
+    return { path: leg.path, distanceMeters: leg.distanceMeters };
+  });
+
 /**
- * Stitches consecutive legs into one polyline. Each leg from `suggestionPath`
- * includes both endpoints, so the shared junction (leg k's `to` === leg k+1's
- * `from`) is dropped with `slice(1)` on every leg after the first.
+ * Stitches consecutive legs into one polyline. Each leg includes both endpoints,
+ * so the shared junction (leg k's `to` === leg k+1's `from`) is dropped with
+ * `slice(1)` on every leg after the first.
  */
-const chain = (graph: RoadGraph | null, waypoints: LatLng[]): RoutePathResult => {
-  if (waypoints.length < 2) return { path: waypoints.slice(), distanceMeters: 0 };
+const stitch = (waypoints: LatLng[], legs: RoutePathResult[]): RoutePathResult =>
+  legs.length === 0
+    ? { path: waypoints.slice(), distanceMeters: 0 }
+    : {
+        path: legs.flatMap((leg, i) => (i === 0 ? leg.path : leg.path.slice(1))),
+        distanceMeters: legs.reduce((sum, leg) => sum + leg.distanceMeters, 0),
+      };
 
-  let path: LatLng[] = [];
-  let distanceMeters = 0;
-  for (let i = 0; i < waypoints.length - 1; i++) {
-    const leg = suggestionPath(graph, waypoints[i], waypoints[i + 1]);
-    distanceMeters += leg.distanceMeters;
-    path = i === 0 ? leg.path.slice() : path.concat(leg.path.slice(1));
-  }
-  return { path, distanceMeters };
+const chain = (graph: RoadGraph | null, waypoints: LatLng[]): RoutePathResult => stitch(waypoints, legsBetween(graph, waypoints));
+
+/**
+ * The vehicle route as SEPARATE legs (start → P1, P1 → P2, …), over the DIRECTED
+ * graph. The map draws one stroke per leg: canvas only adds opacity up between
+ * separate strokes, so a street driven in two legs reads darker (TASK-RF-043).
+ * A leg that doubles back on itself does not darken: known limitation.
+ *
+ * @param graph - The directed vehicle graph, or null while unavailable.
+ * @param startPoint - The route's start (the first leg leaves it), or null.
+ * @param anchors - The vehicle stops (`RouteStop.vehicleStop`), in route order.
+ * @returns One leg per consecutive pair, tagged with the stop it leaves.
+ */
+export const vehicleRouteLegs = (graph: RoadGraph | null, startPoint: LatLng | null, anchors: LatLng[]): VehicleRouteLeg[] => {
+  const offset = startPoint ? 1 : 0;
+  return legsBetween(graph, startPoint ? [startPoint, ...anchors] : anchors).map((leg, i) => ({ ...leg, fromStopIndex: i - offset < 0 ? null : i - offset }));
 };
 
 /**
# de865d0 · feat(TASK-RF-043): tracado do roteiro por perna com passagens repetidas mais escuras e destaque da perna da parada selecionada (#44)
diff --git a/docs-mentor/requisitos/requisitos.json b/docs-mentor/requisitos/requisitos.json
index 59f502f..16a7d84 100644
--- a/docs-mentor/requisitos/requisitos.json
+++ b/docs-mentor/requisitos/requisitos.json
@@ -702,12 +702,14 @@
     "enunciado": "Alternar o tracado do roteiro no mapa entre rota inteira e trecho da parada selecionada, com passagens repetidas distinguiveis por acumulo de opacidade",
     "historia": null,
     "prioridade": "importante",
-    "status": "pendente",
+    "status": "implementado",
     "criterios_aceite": [],
-    "tarefas": [],
+    "tarefas": [
+      "TASK-RF-043"
+    ],
     "adr": null,
     "criado_em": "12/09/26 21:20",
-    "implementado_em": null,
+    "implementado_em": "14/09/26 11:12",
     "pendente_de_validacao": false
   },
   {
```

### TASK-RF-045 · Mostrar distancia entre paradas consecutivas na lista completa

`RF` · cerimonia Standard · esforco P/G · origem: RF-59

**Criterios de aceite, e o teste que cada um nomeia:**

- Cada perna do veiculo diz se seguiu as ruas (viaStreets), para o rotulo avisar linha reta
  → teste: `src/__tests__/utils/routing/routePath.test.ts > each leg tells whether it followed the streets (TASK-RF-045)`
- driveLegLabel escreve a distancia do veiculo em m ou km (formatMeters) e acrescenta '(linha reta)' sem malha
  → teste: `src/__tests__/utils/markers/roteiroModels.test.ts > driveLegLabel: distância do veículo em m ou km; sem grafo ganha '(linha reta)' (RF-045)`
- A lista do Ver detalhes vira linha do tempo: inicio e paradas em ordem, cada um com seu no, mantendo expandir, ver no mapa, mudar e apagar o inicio
  → teste: `src/__tests__/components/map/panel/RoteiroOverviewSection.test.tsx > linha do tempo: início e paradas em ordem, cada um com seu nó e as ações de hoje (RF-045)`
- Entre paradas consecutivas aparece o conector com carro e distancia no trilho; do inicio para P1 quando ha inicio; nenhum depois da ultima
  → teste: `src/__tests__/components/map/panel/RoteiroOverviewSection.test.tsx > mostra a distância do veículo no trilho entre paradas consecutivas; nenhuma depois da última (RF-045)`
- Sem inicio, a primeira distancia e a de P1 para P2; com uma parada so e sem inicio, nenhuma
  → teste: `src/__tests__/components/map/panel/RoteiroOverviewSection.test.tsx > sem início a primeira distância é P1→P2; com uma parada só, nenhuma (RF-045)`
- O Ver detalhes do MapPage mostra as distancias das mesmas pernas que o mapa desenha, sem A* a mais
  → teste: `src/__tests__/pages/MapPage.test.tsx > Ver detalhes mostra no trilho a distância do veículo entre as paradas (RF-045)`
- O conector a pe dentro da parada continua igual (agora pelo componente extraido)
  → teste: `src/__tests__/pages/MapPage.test.tsx > 'Ver detalhes' = estado dedicado LIMPO (RF-006.11): 3 seções com parada 0 e totais; 'Ver no mapa' volta à parada`
- No aparelho, em tema claro e escuro: distancia vertical legivel, trilho alinhado com uma parada aberta, totais, sugestao e ignorados presentes
  → teste: `nao se aplica: validacao manual de UI no aparelho, registrada com task validar`

**Pedido e alternativas (a solucao sugerida pelo humano e' hipotese):**

- pedido original: 14/09/26: 'esse design facilita colocar a distancia, planeje aplica-lo com react e reutilizacao de components, shadcn. A distancia ficaria ao lado das linhas na esquerda que ligam as paradas, como ja e na lista de parada. Planeje, depois do merge' (mockup exportado do Stitch em F:/Baixados/stitch_modern_ux_redesign/code.html). Depois: 'manter o plano, sem mantine, prossiga'
- solucao sugerida: Aplicar o layout do Stitch (linha do tempo com trilho a esquerda) e mostrar a distancia do veiculo no trilho, como o LegConnector da lista de enderecos
- alternativa: Linha do tempo vertical (itinerario do Google Maps e de apps de entregador com varias paradas) com a distancia de cada perna no trilho → pegaria o caso: Sim; escolhida pelo humano · custo: Trilho, nos e cards novos na lista do Ver detalhes, sem dependencia
- alternativa: Distancia dentro do card, numa linha 'ate P2' → pegaria o caso: Sim, mas le como dado da parada e nao do trecho entre elas · custo: Menor, sem trilho
- alternativa: Divisoria horizontal entre os cards com a distancia → pegaria o caso: Sim, com texto horizontal · custo: Pequeno, mas ignora o trilho pedido
- alternativa: Mantine Timeline (MIT) → pegaria o caso: So em parte: nao rende texto ao lado da linha entre dois itens; o conector seguiria feito a mao · custo: Mantine 9 exige React 19.2 (app em 18.3.1, react-leaflet 4 so aceita 18); provider, tema, CSS global e PostCSS proprios; recusado pelo humano em 14/09/26

**Declarou mudar:**

- src/components/map/panel/LegConnector.tsx - novo, extraido do StopItem: icone (a pe ou carro), distancia em texto vertical e seta; recebe rotulo e aria prontos
- src/components/map/panel/StopItem.tsx - StopItemDetail usa o LegConnector extraido, sem mudar comportamento
- src/components/map/panel/RouteTimeline.tsx - novo: RouteTimeline (lista ordenada com trilho) e RouteTimelineItem (no, conteudo e conector sobre o trilho, centralizado entre o no e o proximo); layout generico, sem regra de roteiro
- src/components/map/panel/RoteiroOverviewSection.tsx - inicio e paradas confirmadas viram itens da linha do tempo em Card, com o no na cor da parada; OverviewStopView ganha color e outgoingLeg, OverviewStartView ganha outgoingLeg; StartRow ganha opcao de esconder o proprio marcador; totais, exportar, sugestao e ignorados seguem como estao
- src/pages/MapPage.tsx - overviewStops e overviewStart recebem outgoingLeg das vehicleLegs ja calculadas para o mapa; o titulo da parada sai sem o selo P, que vai para o no
- src/utils/routing/routePath.ts - VehicleRouteLeg passa a guardar viaStreets
- src/utils/markers/roteiroModels.ts - novo driveLegLabel: distancia do veiculo em m ou km, com '(linha reta)' sem malha
- src/constants/uiLabels.ts - aria do trecho do veiculo
- src/__tests__/utils/routing/routePath.test.ts - viaStreets nas pernas
- src/__tests__/utils/markers/roteiroModels.test.ts - driveLegLabel
- src/__tests__/components/map/panel/RoteiroOverviewSection.test.tsx - linha do tempo e distancias entre paradas
- src/__tests__/pages/MapPage.test.tsx - distancias do veiculo no Ver detalhes a partir das pernas do mapa

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| testes | APROVADO | 14/09/26 12:22 | 0 | — |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| build | APROVADO | — | 0 | — |
| validacao_manual | APROVADO | — | — | Humano validou no Samsung M35 (14/09/26) pelo dev server na rede local, roteiro L-30, com capturas no chat: Ver detalhes em linha do tempo com nos P2/P3/P4 na cor da parada, carro com distancia vertical no trilho entre as paradas (730 m, 805 m, 585 m), parada P3 aberta com os enderecos dentro do card e o trilho seguindo ate P4; no mapa, P2 selecionada destaca a perna P2->P3. Resposta: 'Perfeito'. Valores do layout sem ajuste. |

**Riscos declarados:** Texto vertical de distancia em km pouco legivel no aparelho · Conector centralizado fica longe do proximo no quando uma parada esta aberta · Tema escuro: trilho, nos e mascara do conector precisam de tokens, nao de cores fixas · MapPage.tsx com 90 KB e MapPage.test.tsx com 98 KB: diff contido

**O diff da tarefa:**

1 commit(s): `23fc94b` feat(TASK-RF-045): distancia do veiculo entre paradas no trilho da linha do tempo do Ver detalhes (#46)

| arquivo | linhas | fora da revisao |
| :-- | --: | :-- |
| `docs-mentor/contexto.json` | 8 | vista gerada |
| `docs-mentor/requisitos/implementados.md` | 1 | vista gerada |
| `docs-mentor/requisitos/pendentes.md` | 1 | vista gerada |
| `docs-mentor/requisitos/requisitos.json` | 8 | — |
| `docs-mentor/tarefas/abertas/TASK-REF-020.json` | 44 | registro do mentor |
| `docs-mentor/tarefas/abertas/TASK-RF-045.json` | 48 | registro do mentor |
| `docs-mentor/tarefas/concluidas/0-indice.md` | 1 | registro do mentor |
| `docs-mentor/tarefas/concluidas/2026-09-14--12h48--TASK-RF-045.json` | 263 | registro do mentor |
| `docs-mentor/tarefas/concluidas/2026-09-14--12h48--TASK-RF-045.md` | 31 | registro do mentor |
| `docs-mentor/tarefas/reserva.md` | 2 | registro do mentor |
| `src/__tests__/components/map/panel/RoteiroOverviewSection.test.tsx` | 69 | — |
| `src/__tests__/pages/MapPage.test.tsx` | 17 | — |
| `src/__tests__/utils/markers/roteiroModels.test.ts` | 8 | — |
| `src/__tests__/utils/routing/routePath.test.ts` | 6 | — |
| `src/components/map/panel/LegConnector.tsx` | 31 | — |
| `src/components/map/panel/RoteiroOverviewSection.tsx` | 173 | — |
| `src/components/map/panel/RouteTimeline.tsx` | 48 | — |
| `src/components/map/panel/StopItem.tsx` | 27 | — |
| `src/constants/uiLabels.ts` | 4 | — |
| `src/pages/MapPage.tsx` | 26 | — |
| `src/utils/markers/roteiroModels.ts` | 11 | — |
| `src/utils/routing/routePath.ts` | 6 | — |

```diff
# 23fc94b · feat(TASK-RF-045): distancia do veiculo entre paradas no trilho da linha do tempo do Ver detalhes (#46)
diff --git a/src/__tests__/components/map/panel/RoteiroOverviewSection.test.tsx b/src/__tests__/components/map/panel/RoteiroOverviewSection.test.tsx
index c052191..c739e36 100644
--- a/src/__tests__/components/map/panel/RoteiroOverviewSection.test.tsx
+++ b/src/__tests__/components/map/panel/RoteiroOverviewSection.test.tsx
@@ -1,9 +1,11 @@
 import { describe, it, expect, vi } from "vitest";
-import { render, screen, fireEvent } from "@testing-library/react";
-import { RoteiroOverviewSection } from "../../../../components/map/panel/RoteiroOverviewSection";
+import { render, screen, fireEvent, within } from "@testing-library/react";
+import { RoteiroOverviewSection, type OverviewStopView } from "../../../../components/map/panel/RoteiroOverviewSection";
 import { UI_LABELS } from "../../../../constants/uiLabels";
+import { ROTEIRO_TYPE_COLORS } from "../../../../utils/markers/markerColors";
 
 const OVERVIEW = UI_LABELS.MAP_PANEL.ROTEIRO_OVERVIEW;
+const START = UI_LABELS.MAP_PANEL.ROTEIRO_START;
 
 const defaultProps = {
   progress: {
@@ -119,6 +121,69 @@ describe("RoteiroOverviewSection (TASK-RF-013 Exportar Roteiro)", () => {
     expect(screen.getByText("Ipanema, 22410-000")).toBeInTheDocument();
   });
 
+  // ------- Linha do tempo e distância do veículo entre paradas (TASK-RF-045, RF-59) -------
+
+  const stopView = (order: number, outgoingLeg: OverviewStopView["outgoingLeg"]): OverviewStopView => ({
+    id: `stop_${order}`,
+    order,
+    color: ROTEIRO_TYPE_COLORS.residential,
+    neighborhoods: ["Ipanema"],
+    zipcodes: ["22410-000"],
+    metrics: [{ label: "1 endereço" }],
+    items: [],
+    vehicleStopKey: null,
+    outgoingLeg,
+  });
+  const timelineItems = () => within(screen.getByRole("list", { name: OVERVIEW.TIMELINE_ARIA })).getAllByRole("listitem");
+  const driveLegsIn = (element: HTMLElement) => within(element).queryAllByLabelText(UI_LABELS.MAP_PANEL.DRIVE_LEG_ARIA);
+
+  it("linha do tempo: início e paradas em ordem, cada um com seu nó e as ações de hoje (RF-045)", () => {
+    const onShowStopOnMap = vi.fn();
+    render(<RoteiroOverviewSection {...defaultProps} stops={[stopView(1, null), stopView(2, null)]} onShowStopOnMap={onShowStopOnMap} />);
+
+    const [start, p1, p2] = timelineItems();
+    expect(timelineItems()).toHaveLength(3);
+    // The start keeps its two gestures (RF-006.14) — no reorder handle from the mockup.
+    expect(within(start).getByText("Ponto de Partida, 100")).toBeInTheDocument();
+    expect(within(start).getByRole("button", { name: START.REPOSITION_START })).toBeInTheDocument();
+    expect(within(start).getByRole("button", { name: START.DELETE_START })).toBeInTheDocument();
+    // Each stop's number sits on its node; the card keeps expand + "ver no mapa".
+    expect(within(p1).getByText("P1")).toBeInTheDocument();
+    expect(within(p2).getByText("P2")).toBeInTheDocument();
+    fireEvent.click(within(p2).getByRole("button", { name: UI_LABELS.MAP_PANEL.VIEW_ON_MAP }));
+    expect(onShowStopOnMap).toHaveBeenCalledWith("stop_2");
+    expect(within(p1).getByRole("button", { name: OVERVIEW.STOP_ARIA(1) })).toHaveAttribute("aria-expanded", "false");
+  });
+
+  it("mostra a distância do veículo no trilho entre paradas consecutivas; nenhuma depois da última (RF-045)", () => {
+    render(
+      <RoteiroOverviewSection
+        {...defaultProps}
+        start={{ addressLine: "Ponto de Partida, 100", outgoingLeg: { meters: 1300, viaStreets: true } }}
+        stops={[stopView(1, { meters: 850, viaStreets: true }), stopView(2, null)]}
+      />
+    );
+
+    const [start, p1, p2] = timelineItems();
+    expect(driveLegsIn(start)).toHaveLength(1);
+    expect(driveLegsIn(start)[0]).toHaveTextContent("1,3 km");
+    expect(driveLegsIn(p1)).toHaveLength(1);
+    expect(driveLegsIn(p1)[0]).toHaveTextContent("850 m");
+    expect(driveLegsIn(p2)).toHaveLength(0);
+  });
+
+  it("sem início a primeira distância é P1→P2; com uma parada só, nenhuma (RF-045)", () => {
+    const { unmount } = render(<RoteiroOverviewSection {...defaultProps} start={null} stops={[stopView(1, { meters: 850, viaStreets: false }), stopView(2, null)]} />);
+    const [p1, p2] = timelineItems();
+    expect(timelineItems()).toHaveLength(2);
+    expect(driveLegsIn(p1)[0]).toHaveTextContent(`850 m ${START.SUGGESTION_STRAIGHT}`);
+    expect(driveLegsIn(p2)).toHaveLength(0);
+    unmount();
+
+    render(<RoteiroOverviewSection {...defaultProps} start={null} stops={[stopView(1, null)]} />);
+    expect(screen.queryAllByLabelText(UI_LABELS.MAP_PANEL.DRIVE_LEG_ARIA)).toHaveLength(0);
+  });
+
   it("renderiza a seção de endereços ignorados em último lugar com ações de restaurar e ver no mapa", () => {
     const onUnignorePoint = vi.fn();
     const onShowPointOnMap = vi.fn();
# 23fc94b · feat(TASK-RF-045): distancia do veiculo entre paradas no trilho da linha do tempo do Ver detalhes (#46)
diff --git a/src/__tests__/pages/MapPage.test.tsx b/src/__tests__/pages/MapPage.test.tsx
index ac82fb6..452c0c8 100644
--- a/src/__tests__/pages/MapPage.test.tsx
+++ b/src/__tests__/pages/MapPage.test.tsx
@@ -6,6 +6,8 @@ import { UI_LABELS, COLUMN_NAMES, MAP_CONFIG, FOCUS_MAX_ZOOM, ADDRESS_MAX_ZOOM }
 import type { RowData } from "../../types";
 import { DEFAULT_ROUTING_CONFIG, type LatLng, type PlannedRoute } from "../../types/routing";
 import type { InteractionState, MarkerModel } from "../../utils/markers/markerModels";
+import { driveLegLabel } from "../../utils/markers/roteiroModels";
+import { haversine } from "../../utils/routing/geo";
 
 // routeStorage (RF-008) is mocked so the tests CONTROL what is persisted:
 // `saved` feeds the mount-time hydration; `saveCalls` records the auto-saves.
@@ -928,6 +930,21 @@ describe("MapPage (focus screen)", () => {
     expect(stub).toHaveAttribute("data-vehicle-highlight", "none");
   });
 
+  it("Ver detalhes mostra no trilho a distância do veículo entre as paradas (RF-045)", async () => {
+    uploaderState.routes = { "A-1": rowsThreePoints };
+    routeStorageState.saved = savedRoute([P1, P2]);
+    renderPage("/mapa?romaneio=hash-1&rota=A-1&modo=roteiro");
+    await waitFor(() => expect(screen.getByTestId("route-map-stub").getAttribute("data-models-summary")).toContain("stop"));
+
+    fireEvent.click(screen.getByRole("button", { name: OVERVIEW_LABELS.VIEW_DETAILS }));
+
+    // Start → P1 and P1 → P2: the SAME legs the map draws (no graph here → straight lines).
+    const legs = screen.getAllByLabelText(UI_LABELS.MAP_PANEL.DRIVE_LEG_ARIA);
+    expect(legs).toHaveLength(2);
+    expect(legs[0]).toHaveTextContent(driveLegLabel({ meters: 0, viaStreets: false }));
+    expect(legs[1]).toHaveTextContent(driveLegLabel({ meters: haversine(P1.vehicleStop, P2.vehicleStop), viaStreets: false }));
+  });
+
   it("Meu roteiro: com uma parada so as setas ficam desativadas", async () => {
     uploaderState.routes = { "A-1": rowsThreePoints };
     // No firmed stop: no arrows at all.
# 23fc94b · feat(TASK-RF-045): distancia do veiculo entre paradas no trilho da linha do tempo do Ver detalhes (#46)
diff --git a/src/__tests__/utils/markers/roteiroModels.test.ts b/src/__tests__/utils/markers/roteiroModels.test.ts
index a25f010..c707c9f 100644
--- a/src/__tests__/utils/markers/roteiroModels.test.ts
+++ b/src/__tests__/utils/markers/roteiroModels.test.ts
@@ -9,6 +9,7 @@ import {
   stopPlaceSummaryFromPoints,
   walkEstimateLabel,
   legLabel,
+  driveLegLabel,
   orderedStopPoints,
   formatRoteiroStopTitle,
   formatVehicleStopAddress,
@@ -338,6 +339,13 @@ describe("pure helpers (TASK-RF-006.4.2)", () => {
     expect(legLabel({ meters: 24.6, viaStreets: true })).toBe("25 metros");
   });
 
+  it("driveLegLabel: distância do veículo em m ou km; sem grafo ganha '(linha reta)' (RF-045)", () => {
+    // The same "1,3 km" the vehicle distance uses elsewhere (formatMeters), not the walking "metros".
+    expect(driveLegLabel({ meters: 849.6, viaStreets: true })).toBe("850 m");
+    expect(driveLegLabel({ meters: 1300, viaStreets: true })).toBe("1,3 km");
+    expect(driveLegLabel({ meters: 1300, viaStreets: false })).toBe(`1,3 km ${UI_LABELS.MAP_PANEL.ROTEIRO_START.SUGGESTION_STRAIGHT}`);
+  });
+
   it("walkEstimateLabel drops negligible meters (< 20 m)", () => {
     expect(walkEstimateLabel({ meters: 3, minutes: 2 })).toBe(UI_LABELS.MAP_PANEL.ROTEIRO_DRAFT.ESTIMATE_TIME_ONLY(2));
     expect(walkEstimateLabel({ meters: 850, minutes: 12 })).toContain("850 m");
# 23fc94b · feat(TASK-RF-045): distancia do veiculo entre paradas no trilho da linha do tempo do Ver detalhes (#46)
diff --git a/src/__tests__/utils/routing/routePath.test.ts b/src/__tests__/utils/routing/routePath.test.ts
index 03da2ad..76c7a2f 100644
--- a/src/__tests__/utils/routing/routePath.test.ts
+++ b/src/__tests__/utils/routing/routePath.test.ts
@@ -54,6 +54,12 @@ describe("vehicleRouteLegs", () => {
     expect(vehicleRouteLegs(null, null, [COORDS[A]])).toEqual([]);
   });
 
+  it("each leg tells whether it followed the streets (TASK-RF-045)", () => {
+    // The overview's distance label warns "(linha reta)" exactly like the walking connector.
+    expect(vehicleRouteLegs(null, START, [COORDS[A]]).map((leg) => leg.viaStreets)).toEqual([false]);
+    expect(vehicleRouteLegs(squareGraph, null, [near(COORDS[A]), near(COORDS[B])]).map((leg) => leg.viaStreets)).toEqual([true]);
+  });
+
   it("stitched back together, the legs are exactly vehicleRoutePath (path and distance)", () => {
     const anchors = [near(COORDS[A]), near(COORDS[B]), near(COORDS[D])];
     const legs = vehicleRouteLegs(squareGraph, START, anchors);
# 23fc94b · feat(TASK-RF-045): distancia do veiculo entre paradas no trilho da linha do tempo do Ver detalhes (#46)
diff --git a/src/components/map/panel/LegConnector.tsx b/src/components/map/panel/LegConnector.tsx
new file mode 100644
index 0000000..c044b3a
--- /dev/null
+++ b/src/components/map/panel/LegConnector.tsx
@@ -0,0 +1,31 @@
+import { ArrowDown, Car, Footprints } from "lucide-react";
+import { cn } from "@/lib/utils";
+
+/**
+ * LegConnector - an independent "roadmap" datum: the distance from one place to
+ * the NEXT, read VERTICALLY beside what links them, with the mode's icon and a
+ * down arrow. Extracted from StopItem (RF-006.10) when it gained its second use
+ * (TASK-RF-045):
+ * - `walk`: between addresses, in the stop detail's left gutter;
+ * - `drive`: between stops, on the "Ver detalhes" timeline rail.
+ * The caller positions it and hands the label ready (walking "110 metros",
+ * driving "1,3 km"), so the component stays about the look only.
+ */
+interface Props {
+  label: string;
+  icon: "walk" | "drive";
+  /** Screen-reader name of the leg (what the distance is between). */
+  ariaLabel: string;
+  className?: string;
+}
+
+export const LegConnector = ({ label, icon, ariaLabel, className }: Props) => {
+  const Icon = icon === "walk" ? Footprints : Car;
+  return (
+    <span className={cn("pointer-events-none flex flex-col items-center justify-center gap-0.5 text-muted-foreground", className)} aria-label={ariaLabel}>
+      <Icon className="h-3 w-3 shrink-0" aria-hidden />
+      <span className="text-[10px] leading-none [writing-mode:vertical-rl] rotate-180">{label}</span>
+      <ArrowDown className="h-3 w-3 shrink-0" aria-hidden />
+    </span>
+  );
+};
# 23fc94b · feat(TASK-RF-045): distancia do veiculo entre paradas no trilho da linha do tempo do Ver detalhes (#46)
diff --git a/src/components/map/panel/RoteiroOverviewSection.tsx b/src/components/map/panel/RoteiroOverviewSection.tsx
index aa80cdf..428c3be 100644
--- a/src/components/map/panel/RoteiroOverviewSection.tsx
+++ b/src/components/map/panel/RoteiroOverviewSection.tsx
@@ -1,14 +1,21 @@
 import { useState, type ReactNode } from "react";
 import { Car, Download, MapPin, Move, Trash2 } from "lucide-react";
 import { Button } from "../../ui/button";
+import { Card } from "../../ui/card";
+import { cn } from "@/lib/utils";
 import { PanelSection } from "./PanelSection";
 import { PanelTitle, type PanelMetric } from "./PanelTitle";
 import { StopItemList } from "./StopItemList";
 import { StopItemRow } from "./StopItem";
+import { LegConnector } from "./LegConnector";
+import { RouteTimeline, RouteTimelineItem } from "./RouteTimeline";
 import { RouteProgressCard } from "./RouteProgressCard";
 import { SuggestedStopSection, type SuggestedStopView } from "./SuggestedStopCard";
-import { ROTEIRO_MARKER_COLORS } from "../../../utils/markers/markerColors";
+import { ROTEIRO_MARKER_COLORS, ROTEIRO_TYPE_COLORS } from "../../../utils/markers/markerColors";
+import { driveLegLabel } from "../../../utils/markers/roteiroModels";
+import type { MarkerColor } from "../../../utils/markers/markerSvg";
 import type { StopItemData } from "../../../utils/markers/panelModels";
+import type { StopLeg } from "../../../types/routing";
 import type { RouteProgress } from "../../../utils/routing/overview";
 import type { PlannedRouteTotals } from "../../../utils/routing/estimates";
 import { UI_LABELS } from "../../../constants/uiLabels";
@@ -20,6 +27,8 @@ const START = UI_LABELS.MAP_PANEL.ROTEIRO_START;
 export interface OverviewStopView {
   id: string;
   order: number;
+  /** The stop's map color (type palette) — paints its timeline node (RF-045). Default: indefinite gray. */
+  color?: MarkerColor;
   neighborhoods: string[];
   zipcodes: string[];
   metrics: PanelMetric[];
@@ -30,14 +39,32 @@ export interface OverviewStopView {
   /** The address the vehicle parks by (1st) — its "Parada do veículo" badge in
       the drill-down (RF-006.10 smoke), matching the firmed-stop view. */
   vehicleStopKey: string | null;
+  /** The vehicle leg to the NEXT stop, shown on the rail (RF-045); none on the last. */
+  outgoingLeg?: StopLeg | null;
 }
 
 /** The route's start as a row ("parada 0" — RF-006.11). */
 export interface OverviewStartView {
   /** The start address (when it IS one) or the "Início definido" fallback. */
   addressLine: string;
+  /** The vehicle leg start → P1, shown on the rail (RF-045). */
+  outgoingLeg?: StopLeg | null;
 }
 
+/** The vehicle leg on the rail (RF-045): the same connector the walking legs use, with the car. */
+const DriveLeg = ({ leg }: { leg: StopLeg }) => <LegConnector icon="drive" label={driveLegLabel(leg)} ariaLabel={UI_LABELS.MAP_PANEL.DRIVE_LEG_ARIA} />;
+
+/** Timeline node: a 36px circle ringed by the panel ground so the rail reads as passing behind it. */
+const TimelineNode = ({ color, emphasized = false, children }: { color: MarkerColor; emphasized?: boolean; children: ReactNode }) => (
+  <span
+    aria-hidden
+    className={cn("flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold shadow-sm ring-4", emphasized ? "ring-primary/30" : "ring-background")}
+    style={{ background: `linear-gradient(to bottom, ${color.top}, ${color.bottom})`, color: color.numberInk ?? "#FFFFFF" }}
+  >
+    {children}
+  </span>
+);
+
 /**
  * StartRow - the start as "parada 0" (RF-006.11): an address-styled row with
  * the blue start car as its mini-marker and, beside it, the TWO start gestures
@@ -46,14 +73,21 @@ export interface OverviewStartView {
  * single "Redefinir" only re-armed and kept the car, which read as a bug.
  * Exported for the start-selected panel section (tapping the start marker).
  */
-export const StartRow = ({ start, onDelete, onReposition }: { start: OverviewStartView; onDelete: () => void; onReposition: () => void }) => (
+export const StartRow = ({ start, onDelete, onReposition, showMarker = true }: { start: OverviewStartView; onDelete: () => void; onReposition: () => void; showMarker?: boolean }) => (
   <div className="flex items-center">
     {/* py-2.5: the overview list's ONE vertical rhythm (smoke 15/07 — the start
         row had py-3 while the stop rows had no top padding at all). */}
     <div className="flex min-w-0 flex-1 items-center gap-3 px-4 py-2.5">
-      <span aria-hidden className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: ROTEIRO_MARKER_COLORS.start.bottom, color: "#FFFFFF" }}>
-        <Car className="h-3.5 w-3.5" aria-hidden />
-      </span>
+      {/* On the overview timeline the blue car is the rail NODE instead (RF-045). */}
+      {showMarker && (
+        <span
+          aria-hidden
+          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold"
+          style={{ backgroundColor: ROTEIRO_MARKER_COLORS.start.bottom, color: "#FFFFFF" }}
+        >
+          <Car className="h-3.5 w-3.5" aria-hidden />
+        </span>
+      )}
       <span className="min-w-0 flex-1 truncate text-sm font-medium">{start.addressLine}</span>
     </div>
     <div className="mr-2 flex shrink-0 items-center gap-1">
@@ -144,59 +178,88 @@ export const RoteiroOverviewSection = ({
       </PanelSection>
 
       <PanelSection label={OVERVIEW.SECTION_CONFIRMED(stops.length)}>
-        {/* "Parada 0" — the start opens the list (RF-006.11). Divider below it:
-            the confirmed list reads like the single-stop address list (smoke
-            15/07 — "cada parada separada por linha horizontal"). */}
-        {start && (
-          <div className="border-b border-input">
-            <StartRow start={start} onDelete={onDeleteStart} onReposition={onRepositionStart} />
-          </div>
+        {/* Itinerary TIMELINE (RF-045): "parada 0" (the start, RF-006.11) then the
+            confirmed stops, each node on one rail, with the vehicle leg to the
+            next stop read ON the rail — like the walking legs between addresses. */}
+        {(start || stops.length > 0) && (
+          <RouteTimeline ariaLabel={OVERVIEW.TIMELINE_ARIA}>
+            {start && (
+              <RouteTimelineItem
+                hasPrevious={false}
+                hasNext={stops.length > 0}
+                node={
+                  <TimelineNode color={ROTEIRO_MARKER_COLORS.start}>
+                    <Car className="h-4 w-4" aria-hidden />
+                  </TimelineNode>
+                }
+                connector={start.outgoingLeg && stops.length > 0 ? <DriveLeg leg={start.outgoingLeg} /> : undefined}
+              >
+                <Card className="rounded-2xl shadow-sm">
+                  <StartRow start={start} onDelete={onDeleteStart} onReposition={onRepositionStart} showMarker={false} />
+                </Card>
+              </RouteTimelineItem>
+            )}
+            {stops.map((stop, index) => {
+              const open = openStopId === stop.id;
+              return (
+                <RouteTimelineItem
+                  key={stop.id}
+                  hasPrevious={start !== null || index > 0}
+                  hasNext={index < stops.length - 1}
+                  node={
+                    <TimelineNode color={stop.color ?? ROTEIRO_TYPE_COLORS.indefinite} emphasized={open}>
+                      P{stop.order}
+                    </TimelineNode>
+                  }
+                  connector={stop.outgoingLeg && index < stops.length - 1 ? <DriveLeg leg={stop.outgoingLeg} /> : undefined}
+                >
+                  <Card className={cn("overflow-hidden rounded-2xl shadow-sm", open && "border-primary/40")}>
+                    <div className="flex items-center">
+                      <button
+                        type="button"
+                        data-vaul-no-drag
+                        className="min-w-0 flex-1 text-left"
+                        aria-label={OVERVIEW.STOP_ARIA(stop.order)}
+                        aria-expanded={open}
+                        onClick={() => setOpenStopId((current) => (current === stop.id ? null : stop.id))}
+                      >
+                        {/* pt-2.5 = same rhythm as the start row (smoke 15/07). */}
+                        <PanelTitle
+                          className="pt-2.5"
+                          stopNumber={String(stop.order)}
+                          neighborhoods={stop.neighborhoods}
+                          zipcodes={stop.zipcodes}
+                          metrics={stop.metrics}
+                          titleOverride={stop.titleOverride}
+                        />
+                      </button>
+                      <Button
+                        type="button"
+                        variant="ghost"
+                        size="icon"
+                        data-vaul-no-drag
+                        aria-label={UI_LABELS.MAP_PANEL.VIEW_ON_MAP}
+                        title={UI_LABELS.MAP_PANEL.VIEW_ON_MAP}
+                        className="mr-2 shrink-0"
+                        onClick={() => onShowStopOnMap(stop.id)}
+                      >
+                        <MapPin aria-hidden />
+                      </Button>
+                    </div>
+                    {open && (
+                      <div className="border-t border-input">
+                        <StopItemList items={stop.items} selectedKey={null} neon startKey={startKey} vehicleStopKey={stop.vehicleStopKey} />
+                      </div>
+                    )}
+                  </Card>
+                </RouteTimelineItem>
+              );
+            })}
+          </RouteTimeline>
         )}
-        {stops.length === 0 ? (
+        {stops.length === 0 && (
           // Canonical empty-state chrome (REF-016): px-4 py-2 text-xs.
           <p className="px-4 py-2 text-xs text-muted-foreground">{OVERVIEW.NO_STOPS}</p>
-        ) : (
-          <ul>
-            {stops.map((stop) => (
-              // Same divider chrome as StopItem (smoke 15/07).
-              <li key={stop.id} className="border-b border-input last:border-b-0">
-                <div className="flex items-center">
-                  <button
-                    type="button"
-                    data-vaul-no-drag
-                    className="min-w-0 flex-1 text-left"
-                    aria-label={OVERVIEW.STOP_ARIA(stop.order)}
-                    aria-expanded={openStopId === stop.id}
-                    onClick={() => setOpenStopId((current) => (current === stop.id ? null : stop.id))}
-                  >
-                    {/* pt-2.5 = same rhythm as the start row (smoke 15/07: the
-                        title used to sit flush on the divider above). */}
-                    <PanelTitle
-                      className="pt-2.5"
-                      stopNumber={String(stop.order)}
-                      neighborhoods={stop.neighborhoods}
-                      zipcodes={stop.zipcodes}
-                      metrics={stop.metrics}
-                      titleOverride={stop.titleOverride}
-                    />
-                  </button>
-                  <Button
-                    type="button"
-                    variant="ghost"
-                    size="icon"
-                    data-vaul-no-drag
-                    aria-label={UI_LABELS.MAP_PANEL.VIEW_ON_MAP}
-                    title={UI_LABELS.MAP_PANEL.VIEW_ON_MAP}
-                    className="mr-2 shrink-0"
-                    onClick={() => onShowStopOnMap(stop.id)}
-                  >
-                    <MapPin aria-hidden />
-                  </Button>
-                </div>
-                {openStopId === stop.id && <StopItemList items={stop.items} selectedKey={null} neon startKey={startKey} vehicleStopKey={stop.vehicleStopKey} />}
-              </li>
-            ))}
-          </ul>
         )}
       </PanelSection>
# 23fc94b · feat(TASK-RF-045): distancia do veiculo entre paradas no trilho da linha do tempo do Ver detalhes (#46)
diff --git a/src/components/map/panel/RouteTimeline.tsx b/src/components/map/panel/RouteTimeline.tsx
new file mode 100644
index 0000000..95a37b1
--- /dev/null
+++ b/src/components/map/panel/RouteTimeline.tsx
@@ -0,0 +1,48 @@
+import type { ReactNode } from "react";
+import { cn } from "@/lib/utils";
+
+/**
+ * RouteTimeline - a vertical itinerary layout (TASK-RF-045): a left column with
+ * each item's NODE on a continuous rail, the item's content beside it, and —
+ * between one node and the next — an optional CONNECTOR sitting on the rail
+ * (the leg's distance). Layout only: it knows nothing about stops, starts or
+ * vehicles, so any ordered "place → place" list can reuse it.
+ *
+ * Built on theme tokens (`bg-border` rail, `bg-background` mask behind the
+ * connector — the panel's own ground) so it follows the dark theme.
+ */
+export const RouteTimeline = ({ ariaLabel, children, className }: { ariaLabel: string; children: ReactNode; className?: string }) => (
+  <ol aria-label={ariaLabel} className={cn("flex flex-col px-4 pt-1", className)}>
+    {children}
+  </ol>
+);
+
+interface ItemProps {
+  /** The item's marker on the rail (≤ 36px; its center sits at the rail joints). */
+  node: ReactNode;
+  /** The leg to the NEXT item, drawn on the rail below the node, centered between the two nodes. */
+  connector?: ReactNode;
+  /** A rail arrives from the previous item. */
+  hasPrevious: boolean;
+  /** A rail leaves towards the next item. */
+  hasNext: boolean;
+  children: ReactNode;
+}
+
+/** Rail joint = the node's center: pt-2.5 (10px) + half of a 36px node (18px) = 28px = `7` in Tailwind units. */
+export const RouteTimelineItem = ({ node, connector, hasPrevious, hasNext, children }: ItemProps) => (
+  <li className="relative flex gap-3">
+    <div className="relative flex w-9 shrink-0 flex-col items-center">
+      {hasPrevious && <span aria-hidden className="absolute left-1/2 top-0 h-7 w-0.5 -translate-x-1/2 bg-border" />}
+      {hasNext && <span aria-hidden className="absolute bottom-0 left-1/2 top-7 w-0.5 -translate-x-1/2 bg-border" />}
+      <div className="relative pt-2.5">{node}</div>
+      {connector && (
+        <div className="relative flex flex-1 items-center justify-center">
+          {/* The mask interrupts the rail so the distance reads ON the line between the nodes. */}
+          <div className="bg-background py-1">{connector}</div>
+        </div>
+      )}
+    </div>
+    <div className="min-w-0 flex-1 pb-3">{children}</div>
+  </li>
+);
# 23fc94b · feat(TASK-RF-045): distancia do veiculo entre paradas no trilho da linha do tempo do Ver detalhes (#46)
diff --git a/src/components/map/panel/StopItem.tsx b/src/components/map/panel/StopItem.tsx
index e652c00..16c8798 100644
--- a/src/components/map/panel/StopItem.tsx
+++ b/src/components/map/panel/StopItem.tsx
@@ -1,12 +1,12 @@
 import { useEffect, useRef, type ReactNode } from "react";
-import { ArrowDown, Car, Flag, Footprints, Navigation } from "lucide-react";
+import { Car, Flag, Navigation } from "lucide-react";
 import { Badge } from "../../ui/badge";
+import { LegConnector } from "./LegConnector";
 import { cn } from "@/lib/utils";
 import { UI_LABELS } from "../../../constants/uiLabels";
 import { colorForLocationType, roteiroColorForLocationType, ROTEIRO_MARKER_COLORS } from "../../../utils/markers/markerColors";
 import { legLabel } from "../../../utils/markers/roteiroModels";
 import type { StopItemData } from "../../../utils/markers/panelModels";
-import type { StopLeg } from "../../../types/routing";
 
 const SHEET = UI_LABELS.ROUTE_MAP.ADDRESS_SHEET;
 
@@ -153,23 +153,6 @@ const PackageRow = ({ label, complement, spxTn, type, typeLabel }: StopItemData[
   );
 };
 
-/**
- * LegConnector - an independent "roadmap" datum (RF-006.10): the walking
- * distance from THIS address to the NEXT, living in the detail's LEFT gutter
- * (the ~52px already reserved by pl-[3.25rem]), vertically centered so it adapts
- * to 1 or many packages (smoke 19/07) — it belongs to the relation with the next
- * address, NOT to the packages beside it. Compact: a walking icon + the distance
- * read VERTICALLY + a down arrow to the next. Renders only with the detail
- * (expanded) and only when there IS a next (the last/single address shows none).
- */
-const LegConnector = ({ leg }: { leg: StopLeg }) => (
-  <span className="pointer-events-none absolute inset-y-0 left-0 flex w-[3.25rem] flex-col items-center justify-center gap-0.5 text-muted-foreground" aria-label={UI_LABELS.MAP_PANEL.LEG_ARIA}>
-    <Footprints className="h-3 w-3 shrink-0" aria-hidden />
-    <span className="text-[10px] leading-none [writing-mode:vertical-rl] rotate-180">{legLabel(leg)}</span>
-    <ArrowDown className="h-3 w-3 shrink-0" aria-hidden />
-  </span>
-);
-
 /**
  * StopItemDetail - the drill-down of an address: one PackageRow per package
  * (RF-28) and the Google Maps link. The Maps link sits BESIDE the "Informações
@@ -182,7 +165,11 @@ const LegConnector = ({ leg }: { leg: StopLeg }) => (
  */
 export const StopItemDetail = ({ item, actions }: { item: StopItemData; actions?: ReactNode }) => (
   <div className="relative space-y-2 px-4 pb-4 pl-[3.25rem]">
-    {item.leg && <LegConnector leg={item.leg} />}
+    {/* The walking leg to the NEXT address (RF-006.10), in the LEFT gutter (the
+        ~52px reserved by pl-[3.25rem]), vertically centered so it adapts to 1 or
+        many packages (smoke 19/07) — it belongs to the relation with the next
+        address, not to the packages beside it. The last/single address has none. */}
+    {item.leg && <LegConnector icon="walk" label={legLabel(item.leg)} ariaLabel={UI_LABELS.MAP_PANEL.LEG_ARIA} className="absolute inset-y-0 left-0 w-[3.25rem]" />}
     <div>
       <div className="flex items-center justify-between gap-2">
         <div className="text-sm font-semibold">{SHEET.PACKAGES_HEADER(item.packageCount)}</div>
# 23fc94b · feat(TASK-RF-045): distancia do veiculo entre paradas no trilho da linha do tempo do Ver detalhes (#46)
diff --git a/src/constants/uiLabels.ts b/src/constants/uiLabels.ts
index dee7000..854d7a5 100644
--- a/src/constants/uiLabels.ts
+++ b/src/constants/uiLabels.ts
@@ -169,6 +169,8 @@ export const UI_LABELS = {
     LEG_METERS: (meters: number) => `${meters} metros`,
     /** aria-label do conector de perna (leitor de tela). */
     LEG_ARIA: "Distância a pé até o próximo endereço",
+    /** aria-label do conector de perna do VEÍCULO no trilho do "Ver detalhes" (RF-045). */
+    DRIVE_LEG_ARIA: "Distância de carro até a próxima parada",
     /** Aviso flutuante (RF-006.17): mover o veículo no mapa recalcula a ordem a
         pé (1º = mais próximo) — o toast avisa que os endereços foram reordenados. */
     REORDERED_NOTICE: "Endereços reordenados",
@@ -209,6 +211,8 @@ export const UI_LABELS = {
       PERCENT: (ratio: number) => `${Math.round(ratio * 100)}%`,
       PROGRESS_ARIA: "Progresso do roteiro (endereços atribuídos)",
       NO_STOPS: "Nenhuma parada confirmada ainda.",
+      /** aria-label da linha do tempo (início + paradas em ordem — RF-045). */
+      TIMELINE_ARIA: "Paradas do roteiro em ordem",
       STOP_ARIA: (order: number) => `Parada ${order} — ver endereços`,
       MOVE_UP: "Mover para cima",
       MOVE_DOWN: "Mover para baixo",
# 23fc94b · feat(TASK-RF-045): distancia do veiculo entre paradas no trilho da linha do tempo do Ver detalhes (#46)
diff --git a/src/pages/MapPage.tsx b/src/pages/MapPage.tsx
index 91dbd4c..61905d2 100644
--- a/src/pages/MapPage.tsx
+++ b/src/pages/MapPage.tsx
@@ -5,7 +5,6 @@ import { MapPin } from "lucide-react";
 import { RouteMap } from "../components/RouteMap";
 import { MapToast } from "../components/map/MapToast";
 import { Button } from "../components/ui/button";
-import { Badge } from "../components/ui/badge";
 import { MapModeToggle, MODE_QUERY_PARAM, MODE_QUERY_ROTEIRO, type MapMode } from "../components/map/MapModeToggle";
 import { MapPanel, PANEL_COLLAPSED_PX, type PanelSnap } from "../components/map/panel/MapPanel";
 import { ORIGINAL_PANEL_SIZING, ROTEIRO_PANEL_SIZING } from "../components/map/panel/panelSizing";
@@ -1073,30 +1072,26 @@ function MapScreen({ rows, manifestId, routeName, manifestMeta }: { rows: RowDat
       chips + walking estimate, with the address drill-down in visit order. */
   const overviewStops: OverviewStopView[] = useMemo(
     () =>
-      builderState.stops.map((stop) => {
+      builderState.stops.map((stop, stopIndex) => {
         const stopPts = orderedStopPoints(stop, pointsById);
         const estimate = stopPts.length > 0 ? stopWalkEstimate(stop.vehicleStop, stopPts, estimateConfig) : null;
         const legs = stopLegs(stopPts, pedGraph);
         const place = stopPlaceSummaryFromPoints(stopPts);
         const vehicleAddr = formatVehicleStopAddress(stop, pointsById, graph);
-        const color = stopColor(stop, pointsById);
-        const badgeStyle = {
-          background: `linear-gradient(to bottom, ${color.top}, ${color.bottom})`,
-          color: color.numberInk ?? "#FFFFFF",
-          border: "none",
-        };
         const streetNode = renderVehicleStreetNode(vehicleAddr);
+        // "P{N}" moved to the stop's node on the timeline rail (RF-045): the title keeps the street.
         const titleNode = (
           <span className="flex items-center gap-1.5 font-semibold truncate">
-            <Badge style={badgeStyle} className="px-1.5 py-0 text-[11px] font-bold shrink-0">
-              P{stop.order}
-            </Badge>
             <span className="truncate">{streetNode}</span>
           </span>
         );
+        const leg = vehicleLegs?.find((l) => l.fromStopIndex === stopIndex);
         return {
           id: stop.id,
           order: stop.order,
+          color: stopColor(stop, pointsById),
+          // The SAME legs the map draws (RF-043) — no extra A* (RF-045).
+          outgoingLeg: leg ? { meters: leg.distanceMeters, viaStreets: leg.viaStreets } : null,
           titleOverride: titleNode,
           neighborhoods: place.neighborhoods,
           zipcodes: place.zipcodes,
@@ -1111,7 +1106,7 @@ function MapScreen({ rows, manifestId, routeName, manifestMeta }: { rows: RowDat
           vehicleStopKey: stopPts[0]?.id ?? null,
         };
       }),
-    [builderState.stops, estimateConfig, pointsById, pedGraph, graph]
+    [builderState.stops, estimateConfig, pointsById, pedGraph, graph, vehicleLegs]
   );
 
   /** The would-be NEXT stop (RF-006.8 — numbered in sequence, stops.length + 1):
@@ -1169,8 +1164,13 @@ function MapScreen({ rows, manifestId, routeName, manifestMeta }: { rows: RowDat
     return points.find((p) => p.lat === start.lat && p.lng === start.lng) ?? null;
   }, [points, builderState.startPoint]);
   /** "Parada 0" (RF-006.11): the start row of the overview / start selection. */
+  /** The start → P1 vehicle leg (fromStopIndex null), shown on the overview rail (RF-045). */
+  const startLeg = vehicleLegs?.find((leg) => leg.fromStopIndex === null);
   const overviewStart: OverviewStartView | null = builderState.startPoint
-    ? { addressLine: startAddressPoint ? addressLineOf(startAddressPoint.address) : UI_LABELS.MAP_PANEL.ROTEIRO_START.DEFINED }
+    ? {
+        addressLine: startAddressPoint ? addressLineOf(startAddressPoint.address) : UI_LABELS.MAP_PANEL.ROTEIRO_START.DEFINED,
+        outgoingLeg: startLeg ? { meters: startLeg.distanceMeters, viaStreets: startLeg.viaStreets } : null,
+      }
     : null;
 
   /** Endereços ignorados pelo usuário (aparecem em último lugar no overview). */
# 23fc94b · feat(TASK-RF-045): distancia do veiculo entre paradas no trilho da linha do tempo do Ver detalhes (#46)
diff --git a/src/utils/markers/roteiroModels.ts b/src/utils/markers/roteiroModels.ts
index 3b801f4..0116ab0 100644
--- a/src/utils/markers/roteiroModels.ts
+++ b/src/utils/markers/roteiroModels.ts
@@ -435,6 +435,17 @@ export const legLabel = (leg: StopLeg): string => {
   return leg.viaStreets ? distance : `${distance} ${UI_LABELS.MAP_PANEL.ROTEIRO_START.SUGGESTION_STRAIGHT}`;
 };
 
+/**
+ * Label of one VEHICLE leg to the next stop (TASK-RF-045): "850 m" / "1,3 km" —
+ * the same `formatMeters` the vehicle distance uses elsewhere (a car leg reaches
+ * km, unlike the walking "metros") — with the same "(linha reta)" suffix while
+ * there is no graph.
+ */
+export const driveLegLabel = (leg: StopLeg): string => {
+  const distance = formatMeters(leg.meters);
+  return leg.viaStreets ? distance : `${distance} ${UI_LABELS.MAP_PANEL.ROTEIRO_START.SUGGESTION_STRAIGHT}`;
+};
+
 /** "~12 min · 850 m a pé", or time-only for negligible circuits (RF-006.4.2).
  *  Needs only the totals (meters + combined minutes), not the RF-007.1 split. */
 export const walkEstimateLabel = (estimate: Pick<StopWalkEstimate, "meters" | "minutes">): string =>
# 23fc94b · feat(TASK-RF-045): distancia do veiculo entre paradas no trilho da linha do tempo do Ver detalhes (#46)
diff --git a/src/utils/routing/routePath.ts b/src/utils/routing/routePath.ts
index f3d4767..c199d1c 100644
--- a/src/utils/routing/routePath.ts
+++ b/src/utils/routing/routePath.ts
@@ -28,13 +28,15 @@ export interface RoutePathResult {
 export interface VehicleRouteLeg extends RoutePathResult {
   /** Index (in `anchors`) of the stop this leg LEAVES; `null` for the start → first stop leg. */
   fromStopIndex: number | null;
+  /** False for the straight-line fallback — the overview labels it "(linha reta)" (TASK-RF-045). */
+  viaStreets: boolean;
 }
 
 /** One `suggestionPath` per consecutive pair of waypoints (each leg carries both endpoints). */
-const legsBetween = (graph: RoadGraph | null, waypoints: LatLng[]): RoutePathResult[] =>
+const legsBetween = (graph: RoadGraph | null, waypoints: LatLng[]): (RoutePathResult & { viaStreets: boolean })[] =>
   waypoints.slice(1).map((to, i) => {
     const leg = suggestionPath(graph, waypoints[i], to);
-    return { path: leg.path, distanceMeters: leg.distanceMeters };
+    return { path: leg.path, distanceMeters: leg.distanceMeters, viaStreets: leg.viaStreets };
   });
 
 /**
# 23fc94b · feat(TASK-RF-045): distancia do veiculo entre paradas no trilho da linha do tempo do Ver detalhes (#46)
diff --git a/docs-mentor/requisitos/requisitos.json b/docs-mentor/requisitos/requisitos.json
index 16a7d84..9b17bc2 100644
--- a/docs-mentor/requisitos/requisitos.json
+++ b/docs-mentor/requisitos/requisitos.json
@@ -734,12 +734,14 @@
     "enunciado": "Exibir a distancia de deslocamento entre paradas consecutivas na lista completa do roteiro",
     "historia": null,
     "prioridade": "importante",
-    "status": "pendente",
+    "status": "implementado",
     "criterios_aceite": [],
-    "tarefas": [],
+    "tarefas": [
+      "TASK-RF-045"
+    ],
     "adr": null,
     "criado_em": "12/09/26 21:20",
-    "implementado_em": null,
+    "implementado_em": "14/09/26 12:48",
     "pendente_de_validacao": false
   },
   {
```

### TASK-CHORE-024 · Atualizar mentor-agent para v0.12.0

`CHORE` · cerimonia Standard · esforco P/P · origem: titulo-autossuficiente

**Criterios de aceite, e o teste que cada um nomeia:**

- node mentor.mjs verificar aprova depois da atualizacao
  → teste: `nao se aplica: verificacao operacional via CLI; a saida fica registrada com task criterio`
- node mentor.mjs doctor roda sem bloqueio depois da atualizacao
  → teste: `nao se aplica: verificacao operacional via CLI; a saida fica registrada com task criterio`
- docs-mentor/contexto.json registra versao_do_pacote 0.12.0
  → teste: `nao se aplica: leitura do contexto registrada com task criterio`
- melhorias-do-pacote.md fica sem as notas aplicadas na 0.12.0 e com a nota nova da checagem de caixa de caminho
  → teste: `nao se aplica: conteudo de documento, conferido no diff e registrado com task criterio`

**Pedido e alternativas (a solucao sugerida pelo humano e' hipotese):**

- pedido original: 15/09/26: roteiro de implantacao da v0.12.0 colado pelo humano (npm install github:thiagoroddev/mentor-agent#v0.12.0; node .mentor/scripts/instalar.mjs --forcar; mentor resolver-gerados; mentor verificar; mentor doctor; finalizar). Depois: "o piloto hospedeiro e aqui, ve se ja da pra atualizar o mentor" e "faca"
- solucao sugerida: Seguir o roteiro colado: npm install da tag, node .mentor/scripts/instalar.mjs --forcar, resolver-gerados, verificar, doctor e finalizar
- alternativa: Roteiro oficial da propria 0.12.0 (processos/inicializacao.md): ramo a partir da main, task nova/puxar/iniciar, npm i -D da tag, node mentor.mjs instalar --forcar, diff das normas, resolver-gerados, verificar e gates → pegaria o caso: Sim; e o adotado · custo: Nenhum alem do roteiro
- alternativa: Roteiro colado ao pe da letra, com node .mentor/scripts/instalar.mjs --forcar → pegaria o caso: Nao: roda o instalador antigo ja copiado no projeto, que recopia o pacote velho sobre ele mesmo e passa sem erro sem atualizar nada · custo: Atualizacao falsa silenciosa
- alternativa: Bump automatico da dependencia por bot (Dependabot/Renovate) → pegaria o caso: Nao: a dependencia do GitHub nao copia .mentor/ nem roda resolver-gerados · custo: Metade da atualizacao

**Declarou mudar:**

- package.json - devDependency mentor-agent github:thiagoroddev/mentor-agent#v0.10.0 -> #v0.12.0
- package-lock.json - lock atualizado para mentor-agent 0.12.0
- .mentor/** - pacote reinstalado via npx mentor instalar --forcar (instalador do node_modules) (entram casos.ts e restricoes.ts; mudam os processos entrega, inicializacao, rascunho e tarefa)
- mentor.mjs - atalho reinstalado junto do pacote, se mudar
- .gitattributes - requisitos/pendentes.md e implementados.md com merge=ours (vem da 0.12.0)
- docs-mentor/contexto.json - versao_do_pacote 0.12.0 via resolver-gerados
- docs-mentor/melhorias-do-pacote.md - saem as sete notas aplicadas na 0.12.0 (Frentes A a G) e entra a nota da checagem de caixa de caminho que sobe ate a raiz do disco

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| testes | APROVADO | dispensado (15/09/26 00:42) | 0 | Atualizacao de ferramenta de processo (mentor-agent 0.10.0 -> 0.12.0) sem regra de negocio nem codigo de src/: nao ha comportamento novo do app para ver vermelho. Prova por mutacao nao se aplica; a suite roda inteira contra a arvore atualizada para mostrar que nada do app regrediu. |
| build | APROVADO | — | 0 | — |
| validacao_manual | não se aplica | — | — | Atualizacao da ferramenta de processo mentor-agent (0.10.0 -> 0.12.0), sem alteracao em src/ nem em UI, persistencia ou calculo do app; verificada por verificar, doctor e pelos quatro gates. Mesma operacao das TASK-CHORE-015 a 022. |

**Riscos declarados:** instalar --forcar troca leis (processos entrega, inicializacao, rascunho e tarefa): ler o aviso de normas e o git diff de .mentor/processos antes de fechar · resolver-gerados pode reescrever blocos do contexto.json: conferir o diff contra a main antes de commitar · Falso positivo de caixa de caminho no verificar se a sessao rodar com o caminho digitado em outra caixa

**O diff da tarefa:**

1 commit(s): `998a0a2` chore(TASK-CHORE-024): atualizar mentor-agent para v0.12.0 (#47)

| arquivo | linhas | fora da revisao |
| :-- | --: | :-- |
| `.gitattributes` | 2 | — |
| `.mentor/esquemas/tarefa.json` | 5 | pacote intacto |
| `.mentor/manifesto.json` | 44 | pacote intacto |
| `.mentor/processos/entrega.md` | 20 | — |
| `.mentor/processos/inicializacao.md` | 13 | pacote intacto |
| `.mentor/processos/rascunho.md` | 5 | pacote intacto |
| `.mentor/processos/tarefa.md` | 19 | pacote intacto |
| `.mentor/scripts/arquivos.ts` | 2 | pacote intacto |
| `.mentor/scripts/casos.ts` | 114 | pacote intacto |
| `.mentor/scripts/cli.ts` | 2 | pacote intacto |
| `.mentor/scripts/cmd-anotar.ts` | 18 | pacote intacto |
| `.mentor/scripts/cmd-doctor.ts` | 58 | — |
| `.mentor/scripts/cmd-fila.ts` | 107 | pacote intacto |
| `.mentor/scripts/cmd-init.ts` | 8 | pacote intacto |
| `.mentor/scripts/cmd-merge.ts` | 77 | pacote intacto |
| `.mentor/scripts/cmd-requisito.ts` | 20 | pacote intacto |
| `.mentor/scripts/cmd-resolver.ts` | 163 | pacote intacto |
| `.mentor/scripts/cmd-tarefa.ts` | 261 | pacote intacto |
| `.mentor/scripts/instalar.mjs` | 44 | pacote intacto |
| `.mentor/scripts/restricoes.ts` | 137 | pacote intacto |
| `.mentor/scripts/tipos.ts` | 54 | pacote intacto |
| `.mentor/scripts/vistas.ts` | 24 | — |
| `.mentor/tetos.json` | 8 | pacote intacto |
| `docs-mentor/contexto.json` | 6 | vista gerada |
| `docs-mentor/melhorias-do-pacote.md` | 16 | nota |
| `docs-mentor/tarefas/concluidas/0-indice.md` | 1 | registro do mentor |
| `docs-mentor/tarefas/concluidas/2026-09-15--00h45--TASK-CHORE-024.json` | 200 | registro do mentor |
| `docs-mentor/tarefas/concluidas/2026-09-15--00h45--TASK-CHORE-024.md` | 26 | registro do mentor |
| `package-lock.json` | 6 | — |
| `package.json` | 2 | — |

```diff
# 998a0a2 · chore(TASK-CHORE-024): atualizar mentor-agent para v0.12.0 (#47)
diff --git a/package.json b/package.json
index 4cb81d7..bfbbf01 100644
--- a/package.json
+++ b/package.json
@@ -78,7 +78,7 @@
     "fast-xml-parser": "^5.3.2",
     "globals": "^16.5.0",
     "jsdom": "^27.3.0",
-    "mentor-agent": "github:thiagoroddev/mentor-agent#v0.10.0",
+    "mentor-agent": "github:thiagoroddev/mentor-agent#v0.12.0",
     "postcss": "^8.4.47",
     "prettier": "^3.6.2",
     "puppeteer": "^25.9.0",
# 998a0a2 · chore(TASK-CHORE-024): atualizar mentor-agent para v0.12.0 (#47)
diff --git a/.gitattributes b/.gitattributes
index 97af70f..6c07ca9 100644
--- a/.gitattributes
+++ b/.gitattributes
@@ -9,3 +9,5 @@ docs-mentor/tarefas/recusas.jsonl merge=union
 # Fixtures geradas por script: saem do diff da auditoria do mentor e ficam recolhidas no PR do GitHub.
 # roteiro-classificacao.json sai de gerar-roteiro-classificacao.ts (TASK-BG-021); regenere, nao edite.
 __utilidades-back-office__/roteiros-ficticios/*.json linguist-generated=true
+docs-mentor/requisitos/pendentes.md merge=ours
+docs-mentor/requisitos/implementados.md merge=ours
# 998a0a2 · chore(TASK-CHORE-024): atualizar mentor-agent para v0.12.0 (#47)
diff --git a/.mentor/processos/entrega.md b/.mentor/processos/entrega.md
index 21c7170..67092af 100644
--- a/.mentor/processos/entrega.md
+++ b/.mentor/processos/entrega.md
@@ -53,6 +53,26 @@ Ele faz a fusão semântica de `contexto.json` preservando decisões de ambos os
 **Integrar cedo e com frequência** (OPS-15). Ramo aberto há semanas é a forma mais invisível de
 desperdício, porque parece progresso.
 
+## Planejamento independente e sessões isoladas (Worktrees)
+
+Para permitir que requisitos, ideias, tarefas na reserva e anotações sejam registrados imediatamente sem ficarem reféns do ciclo ou da entrega de uma tarefa de código em andamento:
+
+1. **Destino do planejamento:**
+   - O código, narrativa, achados e gates de uma tarefa pertencem exclusivamente ao ramo dela.
+   - Planejamento independente vai para um ramo curto `plan/<data>-<tema>` criado a partir da `main` atualizada.
+   - O PR de planejamento usa a marca explícita `(plano)` no título (ex.: `docs: novo fluxo de checkout (plano)`).
+
+2. **Worktrees do Git (uma pasta por sessão):**
+   - Para rodar sessões paralelas ou registrar planejamento com a `main` protegida, use `git worktree add ../<pasta-da-sessao> <branch>`.
+   - Cada pasta de worktree possui `HEAD` e índice próprios.
+   - **Cuidados na worktree:** execute `npm ci` para instalar dependências quando houver `package-lock.json`; arquivos não rastreados de laboratório ou `.env` locais não são compartilhados automaticamente pelo Git e devem ser configurados conforme o projeto.
+
+3. **Validação na Esteira de PRs `(plano)`:**
+   - O comando `node mentor.mjs pronto-para-merge --titulo "$TITULO"` reconhece PRs de planejamento.
+   - **Permitido:** novos requisitos, novas tarefas em reserva, atualizações de plano em tarefas abertas, rascunhos em `docs-mentor/` e regeneração de visões derivadas (`contexto.md`, `pendentes.md`, etc.).
+   - **Bloqueado:** arquivos de código de produção/testes, alterações de gates/evidências, transições de tarefa para `em-execucao` ou `concluida`, e promoção manual de requisitos para `implementado`.
+
+
 ## Trabalho pausado (WIP)
 
 Pausa só no disco se perde com o disco. `task pausar --commit` e `git push -u origin HEAD:wip/<id>`:
# 998a0a2 · chore(TASK-CHORE-024): atualizar mentor-agent para v0.12.0 (#47)
diff --git a/.mentor/scripts/cmd-doctor.ts b/.mentor/scripts/cmd-doctor.ts
index 48162b2..285e5e3 100644
--- a/.mentor/scripts/cmd-doctor.ts
+++ b/.mentor/scripts/cmd-doctor.ts
@@ -13,6 +13,7 @@ import { CARACTERISTICAS } from './tipos.ts'
 import { chavesVencidas, laboratorioDe, saidasVersionadas } from './laboratorio.ts'
 import type { Caracteristica, Contexto, EstadoDaCaracteristica, Fase, MetaDeQualidade, Tarefa } from './tipos.ts'
 import { estadoDaCadencia, maioresArquivos } from './cmd-auditar.ts'
+import { coletarRestricoesReconfirmadas, chaveDaRestricao } from './restricoes.ts'
 
 /**
  * Folha de saude do projeto. Tres propriedades a sustentam, e as tres foram medidas em campo:
@@ -321,6 +322,29 @@ function processo(ctx: Contexto, tarefas: Tarefa[]): Linha[] {
         texto: `${wips.length} ramo(s) WIP no remoto: ${wips.join(', ')}. Entram no ramo principal so por PR, com a tarefa concluida`,
       })
     }
+
+    // Worktrees locais: informativo para visibilidade entre sessões isoladas
+    try {
+      const rWt = spawnSync('git', ['worktree', 'list', '--porcelain'], { cwd: raiz, encoding: 'utf8', timeout: 5_000 })
+      if (rWt.status === 0 && rWt.stdout) {
+        const blocos = rWt.stdout.trim().split('\n\n').filter(Boolean)
+        if (blocos.length > 1) {
+          const infoWts = blocos.map((b) => {
+            const mWorktree = b.match(/^worktree\s+(.+)$/m)
+            const mBranch = b.match(/^branch\s+refs\/heads\/(.+)$/m)
+            const pasta = mWorktree ? mWorktree[1]!.trim() : ''
+            const ramo = mBranch ? mBranch[1]!.trim() : 'detached'
+            return `${ramo} (${pasta})`
+          })
+          linhas.push({
+            estado: 'neutro',
+            texto: `${blocos.length} worktrees ativas: ${infoWts.join('; ')}`,
+          })
+        }
+      }
+    } catch {
+      // continua
+    }
   }
 
   // Versionamento se responde em CONSTRUCAO, nao em pre-lancamento: quando ha o que publicar,
@@ -444,6 +468,40 @@ function processo(ctx: Contexto, tarefas: Tarefa[]): Linha[] {
   } else if (desde >= r.aviso_em_tarefas) {
     linhas.push({ estado: 'atencao', texto: `revisao geral pendente ha ${desde} tarefas` })
   }
+
+  // Restrições fundadoras reavaliadas (M3 / Frente G)
+  const c = caminhos()
+  const restricoesReconf = coletarRestricoesReconfirmadas(tarefas)
+  const pastaAdrs = join(c.docs, 'adrs')
+  const adrsExistentes = existe(pastaAdrs) ? listar(pastaAdrs, '.md') : []
+  for (const r of restricoesReconf) {
+    if (r.contagem === 2) {
+      linhas.push({
+        estado: 'atencao',
+        texto: `restricao "${r.restricao}" reconfirmada em 2 tarefas (${r.tarefas.join(', ')}): a proxima reconfirmacao exigira ADR documentada em docs-mentor/adrs/`,
+      })
+    } else if (r.contagem >= 3) {
+      const idAdrMatch = r.restricao.match(/\b(ADR-\d+)\b/i)
+      const chaveNorm = chaveDaRestricao(r.restricao)
+      const adrValida = adrsExistentes.some((arq) => {
+        const conteudo = lerTexto(arq)
+        if (idAdrMatch && arq.toUpperCase().includes(idAdrMatch[1]!.toUpperCase())) return true
+        return chaveDaRestricao(conteudo).includes(chaveNorm) || conteudo.toLowerCase().includes(r.restricao.toLowerCase())
+      })
+      if (!adrValida) {
+        linhas.push({
+          estado: 'atencao',
+          texto: `restricao "${r.restricao}" reconfirmada em ${r.contagem} tarefas (${r.tarefas.join(', ')}) sem ADR vinculada encontrada em docs-mentor/adrs/: crie a ADR correspondente para consolidar a decisao arquitetural`,
+        })
+      } else {
+        linhas.push({
+          estado: 'ok',
+          texto: `restricao "${r.restricao}" com ${r.contagem} reconfirmacoes possui ADR vinculada`,
+        })
+      }
+    }
+  }
+
   return linhas
 }
# 998a0a2 · chore(TASK-CHORE-024): atualizar mentor-agent para v0.12.0 (#47)
diff --git a/.mentor/scripts/vistas.ts b/.mentor/scripts/vistas.ts
index a5f302f..054ca3b 100644
--- a/.mentor/scripts/vistas.ts
+++ b/.mentor/scripts/vistas.ts
@@ -11,7 +11,9 @@ export function carregarTarefas(): Tarefa[] {
 
 export function carregarRequisitos(): Requisito[] {
   const c = caminhos()
-  return existe(c.requisitos) ? lerJson<Requisito[]>(c.requisitos) : []
+  if (!existe(c.requisitos)) return []
+  const dados = lerJson<any>(c.requisitos)
+  return Array.isArray(dados) ? dados : (dados?.requisitos ?? [])
 }
 
 export function carregarReferencias(): ReferenciaExterna[] {
@@ -401,16 +403,18 @@ export function gerarContextoMd(): { cheios: number; vazios: number } {
   const padroes = cheios.filter((f) => valorDoEsquema(f.rotulo) === f.valor)
   const respondidos = cheios.filter((f) => valorDoEsquema(f.rotulo) !== f.valor)
 
-  const portoesAbertos = Object.entries(ctx.estado.portoes)
-    .filter(([, p]) => p.status === 'aberto')
-    .map(([nome]) => nome)
+  const portoesAbertos = ctx.estado?.portoes
+    ? Object.entries(ctx.estado.portoes)
+        .filter(([, p]) => p.status === 'aberto')
+        .map(([nome]) => nome)
+    : []
 
   const linhas = [
     '# Contexto do projeto',
     '',
     AVISO,
     '',
-    `**Fase:** ${ctx.estado.fase ?? 'nao definida'} · **Rigor:** ${ctx.rigor.nivel ?? 'nao definido'}`,
+    `**Fase:** ${ctx.estado?.fase ?? 'nao definida'} · **Rigor:** ${ctx.rigor?.nivel ?? 'nao definido'}`,
     `**Respondido por voce:** ${respondidos.length} · **Padrao do pacote:** ${padroes.length} · **Em aberto:** ${vazios.length}`,
     '',
     portoesAbertos.length
@@ -461,16 +465,18 @@ export function atualizarContagens(): Contexto {
     divida_tecnica_aberta: dividas.filter((d) => !d.paga_em).length,
     riscos_aceitos_ativos: riscos.filter((r) => !r.encerrado_em && !riscoVencido(r)).length,
     riscos_aceitos_vencidos: riscos.filter((r) => riscoVencido(r)).length,
-    tarefas_desde_revisao_geral: concluidas - (ctx.revisao_geral.ultima_na_tarefa ?? 0),
+    tarefas_desde_revisao_geral: concluidas - (ctx.revisao_geral?.ultima_na_tarefa ?? 0),
     adrs: listar(c.adr, '.md').length,
-    ferramentas_sem_padrao: ctx.ferramentas.filter((f) => !f.padrao && !f.dispensa_motivo).length,
+    ferramentas_sem_padrao: (ctx.ferramentas ?? []).filter((f) => !f.padrao && !f.dispensa_motivo).length,
     campos_nulos_do_contexto: vazios,
     // Preenchidos pelo doctor (fase 4), que e' quem classifica achado por severidade.
-    divida_tecnica_com_gatilho_vencido: ctx.contagens['divida_tecnica_com_gatilho_vencido'] ?? null,
+    divida_tecnica_com_gatilho_vencido: ctx.contagens?.['divida_tecnica_com_gatilho_vencido'] ?? null,
   }
   // Conta a partir da ultima auditoria, nao do proximo multiplo: com a ultima na tarefa 25 e cadencia
   // 10, a proxima e' a 35. Era 30. E' estimativa: tarefa sem diff auditavel nao conta e empurra a proxima.
-  ctx.auditoria.proxima_em_tarefa = (ctx.auditoria.ultima_na_tarefa ?? 0) + ctx.auditoria.cadencia_em_tarefas
+  if (ctx.auditoria) {
+    ctx.auditoria.proxima_em_tarefa = (ctx.auditoria.ultima_na_tarefa ?? 0) + (ctx.auditoria.cadencia_em_tarefas ?? 0)
+  }
   // A versao vem do manifesto do pacote INSTALADO, a cada geracao. Era gravada so' pelo `init`, e o
   // `init` recusa rodar em projeto que ja' existe: atualizar o pacote nunca atualizava o numero.
   // Achado em campo com a 0.1.3 instalada e o contexto ainda dizendo 0.1.2, o que faz o relatorio
# 998a0a2 · chore(TASK-CHORE-024): atualizar mentor-agent para v0.12.0 (#47)
diff --git a/package-lock.json b/package-lock.json
index 67c7397..92b882e 100644
--- a/package-lock.json
+++ b/package-lock.json
@@ -48,7 +48,7 @@
         "fast-xml-parser": "^5.3.2",
         "globals": "^16.5.0",
         "jsdom": "^27.3.0",
-        "mentor-agent": "github:thiagoroddev/mentor-agent#v0.10.0",
+        "mentor-agent": "github:thiagoroddev/mentor-agent#v0.12.0",
         "postcss": "^8.4.47",
         "prettier": "^3.6.2",
         "puppeteer": "^25.9.0",
@@ -8786,8 +8786,8 @@
       "license": "MIT"
     },
     "node_modules/mentor-agent": {
-      "version": "0.10.0",
-      "resolved": "git+ssh://git@github.com/thiagoroddev/mentor-agent.git#dd27e8b8fb7b6e6079a23d66032bdff6f3f9bf2d",
+      "version": "0.12.0",
+      "resolved": "git+ssh://git@github.com/thiagoroddev/mentor-agent.git#e9d3fcbc49ad9ef76986d634379b102c42262dc0",
       "dev": true,
       "bin": {
         "mentor": "mentor.mjs"
```

### TASK-CHORE-025 · Corrigir no .mentor local a marca (plano) do entrega.md e a checagem de caixa do verificar, registrando as correcoes para levar ao pacote

`CHORE` · cerimonia Standard · esforco P/M · origem: titulo-autossuficiente

**Criterios de aceite, e o teste que cada um nomeia:**

- O exemplo de titulo de PR de planejamento do entrega.md e aceito pela marca (plano) que o pronto-para-merge usa
  → teste: `docs-mentor/melhorias-do-pacote.test.ts > o exemplo de PR de planejamento do entrega.md passa na marca (plano)`
- Projeto aberto por um caminho com outra caixa acima da raiz nao gera falso positivo de link no verificar
  → teste: `docs-mentor/melhorias-do-pacote.test.ts > caixa diferente acima da raiz do projeto nao reprova link certo`
- Link com caixa errada dentro do projeto continua acusado pelo verificar
  → teste: `docs-mentor/melhorias-do-pacote.test.ts > caixa errada dentro do projeto continua acusada`
- melhorias-do-pacote.md explica a regra das correcoes locais e registra as duas correcoes com problema, o que mudou, arquivos, teste e estado, com texto completo
  → teste: `nao se aplica: conteudo de documento, lido e conferido pelo humano na validacao manual`
- CLAUDE.md, AGENTS.md e GEMINI.md apontam a regra para qualquer IA que abrir o projeto
  → teste: `nao se aplica: conteudo de documento, lido e conferido pelo humano na validacao manual`

**Pedido e alternativas (a solucao sugerida pelo humano e' hipotese):**

- pedido original: 15/09/26: "estou pensando em permitir ir melhorando no proprio hospedeiro, depois de um tempo, tudo que permaneceu vira oficial la no mentor, precisa ter textos completos sem ambiguidade, sem resumo". Depois: "eu so quero identificar problemas e resolver ja aqui, depois de um tempo vira melhoria oficial no agente, assim evita que eu tenha que recomecar tudo do zero mais uma vez la". Aprovou o caminho simples com "sim".
- solucao sugerida: Corrigir os problemas do pacote direto no .mentor/ deste projeto e, depois de um tempo, levar ao mentor-agent oficial o que permaneceu, com texto completo e sem resumo
- alternativa: Fila de patches catalogada fora da pasta do pacote (quilt com cabecalhos DEP-3 no Debian, patch-package no npm, pasta patches/ do Electron) → pegaria o caso: Sim, e ainda avisaria da perda na atualizacao, mas exige comando novo, hashes e catalogo. Proposto em 15/09/26 e recusado pelo humano por complicar mais do que resolve · custo: Quatro tarefas, um comando novo e testes extras
- alternativa: Corrigir so no repositorio do pacote e publicar versao candidata para ensaiar no piloto antes da versao final → pegaria o caso: Sim para os dois defeitos, mas cada correcao espera um ciclo de publicacao, e o humano quer resolver na hora sem recomecar la · custo: Um ciclo de versao por defeito
- alternativa: Correcao local no .mentor/ com o historico do git como texto integral e um registro em melhorias-do-pacote.md (adotada) → pegaria o caso: Sim: o git guarda o texto exato de cada mudanca, o verificar ja acusa o que diverge do manifesto e o registro diz o motivo · custo: Uma linha permanente de divergencia no verificar e a disciplina de levar ao pacote antes de atualizar

**Declarou mudar:**

- .mentor/processos/entrega.md - o exemplo de titulo do PR de planejamento passa a docs(plano): novo fluxo de checkout, com a marca na posicao de escopo, como (light)
- .mentor/scripts/cmd-verificar.ts - existeComGrafiaExata confere a caixa so das pastas abaixo da raiz do projeto; a raiz e as pastas acima dela ficam como vieram do terminal
- docs-mentor/melhorias-do-pacote.md - cabecalho com a regra das correcoes locais (corrigir aqui, registrar, levar ao pacote antes de atualizar); as duas notas viram registros de correcao feita aqui, e a da caixa sai corrigida (o comportamento existe desde a 0.2.0)
- docs-mentor/melhorias-do-pacote.test.ts - testes das duas correcoes locais, que tambem reprovam se uma atualizacao do pacote as desfizer
- CLAUDE.md - uma linha apontando a regra das correcoes locais do mentor
- AGENTS.md - uma linha apontando a regra das correcoes locais do mentor
- GEMINI.md - uma linha apontando a regra das correcoes locais do mentor

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| testes | APROVADO | 15/09/26 02:03 | 0 | — |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| build | APROVADO | — | 0 | — |
| validacao_manual | APROVADO | — | — | Humano leu docs-mentor/melhorias-do-pacote.md da pasta da tarefa (secao Regra e correcoes 1 e 2) e confirmou que o texto esta claro e aplicavel no pacote sem voltar para perguntar: 'ok, claro, prossiga' (15/09/26) |

**Riscos declarados:** O verificar passa a sair REPROVADO com a linha de divergencia do pacote listando entrega.md e cmd-verificar.ts: esperado, explicado no registro · Atualizar o mentor antes de levar as correcoes ao pacote as apaga; mitigacao: regra no cabecalho do registro, ponteiro nos arquivos de instrucao e testes que reprovam; o git preserva o historico · Parar a subida na raiz deixa de acusar caixa errada na propria raiz, que vem do terminal e nao do repositorio: nao e defeito de link · O teste da caixa usa a pasta temporaria do sistema com as letras trocadas; em sistema que diferencia maiusculas ele e pulado

**O diff da tarefa:**

1 commit(s): `52e25fb` chore(TASK-CHORE-025): corrigir no .mentor local a marca (plano) e a checagem de caixa do verificar, com regra para levar ao pacote (#49)

| arquivo | linhas | fora da revisao |
| :-- | --: | :-- |
| `.mentor/processos/entrega.md` | 2 | — |
| `.mentor/scripts/cmd-verificar.ts` | 16 | — |
| `AGENTS.md` | 2 | — |
| `CLAUDE.md` | 4 | — |
| `docs-mentor/contexto.json` | 4 | vista gerada |
| `docs-mentor/melhorias-do-pacote.md` | 38 | nota |
| `docs-mentor/melhorias-do-pacote.test.ts` | 62 | — |
| `docs-mentor/tarefas/concluidas/0-indice.md` | 1 | registro do mentor |
| `docs-mentor/tarefas/concluidas/2026-09-15--02h52--TASK-CHORE-025.json` | 188 | registro do mentor |
| `docs-mentor/tarefas/concluidas/2026-09-15--02h52--TASK-CHORE-025.md` | 23 | registro do mentor |
| `docs-mentor/tarefas/recusas.jsonl` | 1 | registro do mentor |
| `GEMINI.md` | 2 | — |

```diff
# 52e25fb · chore(TASK-CHORE-025): corrigir no .mentor local a marca (plano) e a checagem de caixa do verificar, com regra para levar ao pacote (#49)
diff --git a/docs-mentor/melhorias-do-pacote.test.ts b/docs-mentor/melhorias-do-pacote.test.ts
new file mode 100644
index 0000000..5b49360
--- /dev/null
+++ b/docs-mentor/melhorias-do-pacote.test.ts
@@ -0,0 +1,62 @@
+/**
+ * Testes das correcoes feitas no `.mentor/` deste projeto, registradas em
+ * `melhorias-do-pacote.md` (TASK-CHORE-025).
+ *
+ * Cada teste protege uma correcao local: se uma atualizacao do mentor-agent sobrescrever a
+ * correcao antes de ela chegar ao pacote oficial, o teste falha e avisa.
+ */
+import { spawnSync } from "node:child_process";
+import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
+import { tmpdir } from "node:os";
+import { basename, dirname, join, resolve, sep } from "node:path";
+import { afterAll, beforeAll, describe, expect, it } from "vitest";
+import { MARCA_PLANO_NO_TITULO } from "../.mentor/scripts/tipos.ts";
+
+const RAIZ = resolve(__dirname, "..");
+
+describe("marca (plano) no titulo do PR de planejamento", () => {
+  it("o exemplo de PR de planejamento do entrega.md passa na marca (plano)", () => {
+    const entrega = readFileSync(join(RAIZ, ".mentor", "processos", "entrega.md"), "utf8");
+    const exemplo = entrega.match(/PR de planejamento[^\n]*\(ex\.: `([^`]+)`\)/)?.[1];
+
+    expect(exemplo).toBeDefined();
+    expect(MARCA_PLANO_NO_TITULO.test(exemplo ?? "")).toBe(true);
+  });
+});
+
+/** Mesma pasta com as letras trocadas acima do projeto. So existe em sistema que ignora maiusculas. */
+const comOutraCaixaAcima = (pasta: string) => dirname(pasta).toUpperCase() + sep + basename(pasta);
+const IGNORA_MAIUSCULAS = tmpdir() !== tmpdir().toUpperCase() && existsSync(tmpdir().toUpperCase());
+
+describe.skipIf(!IGNORA_MAIUSCULAS)("verificar com o projeto aberto por outra caixa", () => {
+  let projeto = "";
+  let saida = "";
+
+  beforeAll(() => {
+    projeto = mkdtempSync(join(tmpdir(), "mentor-caixa-"));
+    const mentor = (raiz: string, comando: string) => {
+      const r = spawnSync(process.execPath, [join(RAIZ, "mentor.mjs"), comando], {
+        cwd: RAIZ,
+        encoding: "utf8",
+        env: { ...process.env, MENTOR_RAIZ: raiz },
+      });
+      return `${r.stdout ?? ""}${r.stderr ?? ""}`;
+    };
+    mentor(projeto, "init");
+    writeFileSync(join(projeto, "docs-mentor", "alvo.md"), "# Alvo\n");
+    writeFileSync(join(projeto, "docs-mentor", "nota.md"), "[certo](alvo.md) e [errado](ALVO.md)\n");
+    saida = mentor(comOutraCaixaAcima(projeto), "verificar");
+  }, 60_000);
+
+  afterAll(() => {
+    if (projeto) rmSync(projeto, { recursive: true, force: true });
+  });
+
+  it("caixa diferente acima da raiz do projeto nao reprova link certo", () => {
+    expect(saida).not.toContain('link "alvo.md"');
+  });
+
+  it("caixa errada dentro do projeto continua acusada", () => {
+    expect(saida).toContain('link "ALVO.md" so resolve porque este sistema de arquivos ignora maiusculas');
+  });
+});
# 52e25fb · chore(TASK-CHORE-025): corrigir no .mentor local a marca (plano) e a checagem de caixa do verificar, com regra para levar ao pacote (#49)
diff --git a/.mentor/processos/entrega.md b/.mentor/processos/entrega.md
index 67092af..d2d3ef5 100644
--- a/.mentor/processos/entrega.md
+++ b/.mentor/processos/entrega.md
@@ -60,7 +60,7 @@ Para permitir que requisitos, ideias, tarefas na reserva e anotações sejam reg
 1. **Destino do planejamento:**
    - O código, narrativa, achados e gates de uma tarefa pertencem exclusivamente ao ramo dela.
    - Planejamento independente vai para um ramo curto `plan/<data>-<tema>` criado a partir da `main` atualizada.
-   - O PR de planejamento usa a marca explícita `(plano)` no título (ex.: `docs: novo fluxo de checkout (plano)`).
+   - O PR de planejamento leva a marca `(plano)` na posição de escopo do título, como `(light)` (ex.: `docs(plano): novo fluxo de checkout`).
 
 2. **Worktrees do Git (uma pasta por sessão):**
    - Para rodar sessões paralelas ou registrar planejamento com a `main` protegida, use `git worktree add ../<pasta-da-sessao> <branch>`.
# 52e25fb · chore(TASK-CHORE-025): corrigir no .mentor local a marca (plano) e a checagem de caixa do verificar, com regra para levar ao pacote (#49)
diff --git a/.mentor/scripts/cmd-verificar.ts b/.mentor/scripts/cmd-verificar.ts
index dc06423..f2f9d0c 100644
--- a/.mentor/scripts/cmd-verificar.ts
+++ b/.mentor/scripts/cmd-verificar.ts
@@ -1,5 +1,5 @@
 import { readdirSync } from 'node:fs'
-import { basename, dirname, join, resolve } from 'node:path'
+import { basename, dirname, join, resolve, sep } from 'node:path'
 import { caminhos, existe, lerJson, lerTexto, listar, raizPacote, relativo } from './arquivos.ts'
 import { comparar } from './cmd-regras.ts'
 import { conferirManifesto } from './cmd-pacote.ts'
@@ -95,13 +95,19 @@ export function tetos(): Achado[] {
  * Existe **com a grafia exata**. O Windows tem sistema de arquivos insensivel a maiusculas, entao um
  * link para `32-adr.md` apontando para o arquivo `32-ADR.md` funciona na maquina do autor e quebra
  * no GitHub e no Linux. Aqui a comparacao e' byte a byte, segmento por segmento.
+ *
+ * Confere so' as pastas **abaixo da raiz do projeto**. A raiz e o que fica acima dela vem de como o
+ * terminal foi aberto (`cd e:\Repositorios\...`), nao do repositorio: subir ate' o disco acusava
+ * todo link como quebrado quando o caminho digitado tinha outra caixa. Correcao local da
+ * TASK-CHORE-025, registrada em `docs-mentor/melhorias-do-pacote.md`.
  */
-function existeComGrafiaExata(caminho: string): boolean {
+function existeComGrafiaExata(caminho: string, raiz: string): boolean {
   if (!existe(caminho)) return false
+  const topo = resolve(raiz)
   let atual = resolve(caminho)
   for (;;) {
     const pai = dirname(atual)
-    if (pai === atual) return true
+    if (pai === atual || atual === topo || topo.startsWith(atual + sep)) return true
     if (!readdirSync(pai).includes(basename(atual))) return false
     atual = pai
   }
@@ -128,7 +134,7 @@ function links(): Achado[] {
       const semAncora = bruto.split('#')[0]
       if (!semAncora) continue
       const alvo = join(dirname(arquivo), decodeURI(semAncora))
-      if (!existeComGrafiaExata(alvo)) {
+      if (!existeComGrafiaExata(alvo, c.raiz)) {
         const existeIgnorandoCaixa = existe(alvo)
         achados.push({
           familia: 'referencia',
@@ -198,7 +204,7 @@ function referencias(): Achado[] {
       continue
     }
     const alvo = join(c.raiz, ref.onde)
-    if (!existeComGrafiaExata(alvo)) {
+    if (!existeComGrafiaExata(alvo, c.raiz)) {
       achados.push({
         familia: 'referencia',
         onde: 'docs-mentor/referencias.json',
# 52e25fb · chore(TASK-CHORE-025): corrigir no .mentor local a marca (plano) e a checagem de caixa do verificar, com regra para levar ao pacote (#49)
diff --git a/AGENTS.md b/AGENTS.md
index e40872c..00a14ee 100644
--- a/AGENTS.md
+++ b/AGENTS.md
@@ -1 +1,3 @@
 Antes de qualquer outra coisa, leia `.mentor/nucleo.md`.
+
+Problema no proprio mentor-agent: corrija no `.mentor/` deste projeto e registre em `docs-mentor/melhorias-do-pacote.md`, seguindo a regra do topo desse arquivo.
# 52e25fb · chore(TASK-CHORE-025): corrigir no .mentor local a marca (plano) e a checagem de caixa do verificar, com regra para levar ao pacote (#49)
diff --git a/CLAUDE.md b/CLAUDE.md
index 76aaef6..a1dcfc9 100644
--- a/CLAUDE.md
+++ b/CLAUDE.md
@@ -1 +1,3 @@
-@.mentor/nucleo.md
\ No newline at end of file
+@.mentor/nucleo.md
+
+Problema no proprio mentor-agent: corrija no `.mentor/` deste projeto e registre em `docs-mentor/melhorias-do-pacote.md`, seguindo a regra do topo desse arquivo.
# 52e25fb · chore(TASK-CHORE-025): corrigir no .mentor local a marca (plano) e a checagem de caixa do verificar, com regra para levar ao pacote (#49)
diff --git a/GEMINI.md b/GEMINI.md
index e281f5c..ecbd69a 100644
--- a/GEMINI.md
+++ b/GEMINI.md
@@ -14,6 +14,8 @@ Tres coisas valem antes mesmo dessa leitura, porque as duas primeiras sao irreve
 
 Sem argumento, `node mentor.mjs` lista os comandos.
 
+Problema no proprio mentor-agent: corrija no `.mentor/` deste projeto e registre em `docs-mentor/melhorias-do-pacote.md`, seguindo a regra do topo desse arquivo.
+
 ---
 
 *Criado por `mentor instalar`. Se voce editar, ele nao sobrescreve: reinstalar preserva este arquivo.*
```

### TASK-CHORE-026 · Parar a regravacao automatica de atualizado_em e lembretes no contexto.json do .mentor local, que faz PRs paralelos conflitarem sem mudanca real

`CHORE` · cerimonia Standard · esforco P/M · origem: titulo-autossuficiente

**Criterios de aceite, e o teste que cada um nomeia:**

- Rodar gerar duas vezes seguidas sem mudanca real deixa o contexto.json identico
  → teste: `docs-mentor/melhorias-do-pacote.test.ts > gerar duas vezes sem mudanca real nao muda o contexto.json`
- Rodar doctor duas vezes seguidas deixa o contexto.json identico
  → teste: `docs-mentor/melhorias-do-pacote.test.ts > doctor duas vezes nao muda o contexto.json`
- O doctor mostra os lembretes na tela e nao os grava no contexto.json
  → teste: `docs-mentor/melhorias-do-pacote.test.ts > doctor mostra lembretes sem grava-los no contexto.json`
- melhorias-do-pacote.md registra a correcao 3 com texto completo
  → teste: `nao se aplica: conteudo de documento, conferido no diff e pelo humano`

**Pedido e alternativas (a solucao sugerida pelo humano e' hipotese):**

- pedido original: 15/09/26: "alteracao no contexto e feito automaticamente pra atualizar hora? Vai ficar fazendo isso sempre? Remover isso quebra o que do mentor? como contornar?". Aprovou com "sim" a proposta de corrigir aqui: parar de regravar atualizado_em, parar de gravar lembretes, manter as contagens, teste e registro como correcao 3.
- solucao sugerida: nenhuma: o humano descreveu o problema

**Declarou mudar:**

- .mentor/scripts/vistas.ts - atualizarContagens deixa de regravar _meta.atualizado_em a cada comando (nenhum codigo le o campo; a data sai do git log)
- .mentor/scripts/cmd-doctor.ts - o doctor deixa de gravar lembretes no contexto.json; eles continuam na saida do comando
- docs-mentor/contexto.json - _meta.atualizado_em passa a null, para nao ficar uma data congelada que parece atual
- docs-mentor/melhorias-do-pacote.test.ts - testes: gerar duas vezes e doctor duas vezes nao mudam o contexto.json; doctor nao grava lembretes
- docs-mentor/melhorias-do-pacote.md - correcao 3 registrada com problema, mudanca, arquivos, teste e o que fazer no pacote

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| testes | APROVADO | 15/09/26 04:57 | 0 | — |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| build | APROVADO | — | 0 | — |
| validacao_manual | APROVADO | — | — | Humano leu a correcao 3 em docs-mentor/melhorias-do-pacote.md (data e lembretes regravados no contexto.json) e confirmou que o texto basta para aplicar no pacote: 'texto ok suficiente' (15/09/26) |

**Riscos declarados:** O campo lembretes vazio segue contando como campo em aberto no contexto.md, como ja acontece depois de cada resolver-gerados · Se um qualidade.perfil do doctor mudar de verdade, o contexto.json muda, e isso e esperado · Os testes usam o mentor.mjs real com MENTOR_RAIZ numa pasta temporaria; nenhum roda manifesto

**O diff da tarefa:**

1 commit(s): `f39dc02` chore(TASK-CHORE-026): parar a regravacao automatica de atualizado_em e lembretes no contexto.json (#53)

| arquivo | linhas | fora da revisao |
| :-- | --: | :-- |
| `.mentor/scripts/cmd-doctor.ts` | 7 | — |
| `.mentor/scripts/vistas.ts` | 8 | — |
| `docs-mentor/contexto.json` | 4 | vista gerada |
| `docs-mentor/melhorias-do-pacote.md` | 17 | nota |
| `docs-mentor/melhorias-do-pacote.test.ts` | 60 | — |
| `docs-mentor/tarefas/concluidas/0-indice.md` | 1 | registro do mentor |
| `docs-mentor/tarefas/concluidas/2026-09-15--05h12--TASK-CHORE-026.json` | 165 | registro do mentor |
| `docs-mentor/tarefas/concluidas/2026-09-15--05h12--TASK-CHORE-026.md` | 19 | registro do mentor |

```diff
# f39dc02 · chore(TASK-CHORE-026): parar a regravacao automatica de atualizado_em e lembretes no contexto.json (#53)
diff --git a/docs-mentor/melhorias-do-pacote.test.ts b/docs-mentor/melhorias-do-pacote.test.ts
index 5b49360..9984146 100644
--- a/docs-mentor/melhorias-do-pacote.test.ts
+++ b/docs-mentor/melhorias-do-pacote.test.ts
@@ -1,6 +1,6 @@
 /**
  * Testes das correcoes feitas no `.mentor/` deste projeto, registradas em
- * `melhorias-do-pacote.md` (TASK-CHORE-025).
+ * `melhorias-do-pacote.md` (TASK-CHORE-025 e TASK-CHORE-026).
  *
  * Cada teste protege uma correcao local: se uma atualizacao do mentor-agent sobrescrever a
  * correcao antes de ela chegar ao pacote oficial, o teste falha e avisa.
@@ -14,6 +14,16 @@ import { MARCA_PLANO_NO_TITULO } from "../.mentor/scripts/tipos.ts";
 
 const RAIZ = resolve(__dirname, "..");
 
+/** Roda o mentor deste projeto sobre outra pasta de projeto, sem tocar no projeto real. */
+const mentor = (raiz: string, comando: string) => {
+  const r = spawnSync(process.execPath, [join(RAIZ, "mentor.mjs"), comando], {
+    cwd: RAIZ,
+    encoding: "utf8",
+    env: { ...process.env, MENTOR_RAIZ: raiz },
+  });
+  return `${r.stdout ?? ""}${r.stderr ?? ""}`;
+};
+
 describe("marca (plano) no titulo do PR de planejamento", () => {
   it("o exemplo de PR de planejamento do entrega.md passa na marca (plano)", () => {
     const entrega = readFileSync(join(RAIZ, ".mentor", "processos", "entrega.md"), "utf8");
@@ -34,14 +44,6 @@ describe.skipIf(!IGNORA_MAIUSCULAS)("verificar com o projeto aberto por outra ca
 
   beforeAll(() => {
     projeto = mkdtempSync(join(tmpdir(), "mentor-caixa-"));
-    const mentor = (raiz: string, comando: string) => {
-      const r = spawnSync(process.execPath, [join(RAIZ, "mentor.mjs"), comando], {
-        cwd: RAIZ,
-        encoding: "utf8",
-        env: { ...process.env, MENTOR_RAIZ: raiz },
-      });
-      return `${r.stdout ?? ""}${r.stderr ?? ""}`;
-    };
     mentor(projeto, "init");
     writeFileSync(join(projeto, "docs-mentor", "alvo.md"), "# Alvo\n");
     writeFileSync(join(projeto, "docs-mentor", "nota.md"), "[certo](alvo.md) e [errado](ALVO.md)\n");
@@ -60,3 +62,43 @@ describe.skipIf(!IGNORA_MAIUSCULAS)("verificar com o projeto aberto por outra ca
     expect(saida).toContain('link "ALVO.md" so resolve porque este sistema de arquivos ignora maiusculas');
   });
 });
+
+describe("contexto.json sem regravacao automatica", () => {
+  let projeto = "";
+  let depoisDoPrimeiroGerar = "";
+  let depoisDoSegundoGerar = "";
+  let saidaDoDoctor = "";
+  let depoisDoPrimeiroDoctor = "";
+  let depoisDoSegundoDoctor = "";
+
+  beforeAll(() => {
+    projeto = mkdtempSync(join(tmpdir(), "mentor-contexto-"));
+    const contexto = () => readFileSync(join(projeto, "docs-mentor", "contexto.json"), "utf8");
+    mentor(projeto, "init");
+    mentor(projeto, "gerar");
+    depoisDoPrimeiroGerar = contexto();
+    mentor(projeto, "gerar");
+    depoisDoSegundoGerar = contexto();
+    saidaDoDoctor = mentor(projeto, "doctor");
+    depoisDoPrimeiroDoctor = contexto();
+    mentor(projeto, "doctor");
+    depoisDoSegundoDoctor = contexto();
+  }, 90_000);
+
+  afterAll(() => {
+    if (projeto) rmSync(projeto, { recursive: true, force: true });
+  });
+
+  it("gerar duas vezes sem mudanca real nao muda o contexto.json", () => {
+    expect(depoisDoSegundoGerar).toBe(depoisDoPrimeiroGerar);
+  });
+
+  it("doctor duas vezes nao muda o contexto.json", () => {
+    expect(depoisDoSegundoDoctor).toBe(depoisDoPrimeiroDoctor);
+  });
+
+  it("doctor mostra lembretes sem grava-los no contexto.json", () => {
+    expect(saidaDoDoctor).toContain("⚠");
+    expect(JSON.parse(depoisDoPrimeiroDoctor).lembretes).toEqual([]);
+  });
+});
# f39dc02 · chore(TASK-CHORE-026): parar a regravacao automatica de atualizado_em e lembretes no contexto.json (#53)
diff --git a/.mentor/scripts/cmd-doctor.ts b/.mentor/scripts/cmd-doctor.ts
index 285e5e3..07ad770 100644
--- a/.mentor/scripts/cmd-doctor.ts
+++ b/.mentor/scripts/cmd-doctor.ts
@@ -535,8 +535,11 @@ export function doctor(): number {
     ? 'PRONTO PARA PUBLICO?  SIM — nenhum bloqueio'
     : `PRONTO PARA PUBLICO?  NAO — ${bloqueios} bloqueio(s)`)
 
-  // Os lembretes sao SAIDA: o doctor os calcula e sobrescreve. Campo livre acumularia prosa.
-  ctx.lembretes = secoes.flatMap(([, l]) => l).filter((l) => l.estado !== 'ok' && l.estado !== 'neutro').map((l) => l.texto)
+  // Os lembretes sao SAIDA do doctor e ficam so' na tela. Grava-los no contexto versionado mudava o
+  // arquivo a cada execucao (e o `resolver-gerados` os zera), gerando diff e conflito sem mudanca
+  // real. `[]` limpa lembrete antigo de quem vem de versao anterior. Correcao local da
+  // TASK-CHORE-026, registrada em `docs-mentor/melhorias-do-pacote.md`.
+  ctx.lembretes = []
   const q = ctx['qualidade'] as Record<string, unknown>
   q['perfil'] = { _gerado_por_doctor: true, de: 8, ...p.resumo }
   escreverJson(caminhos().contexto, ctx)
# f39dc02 · chore(TASK-CHORE-026): parar a regravacao automatica de atualizado_em e lembretes no contexto.json (#53)
diff --git a/.mentor/scripts/vistas.ts b/.mentor/scripts/vistas.ts
index 054ca3b..5514680 100644
--- a/.mentor/scripts/vistas.ts
+++ b/.mentor/scripts/vistas.ts
@@ -1,4 +1,4 @@
-import { agora, agoraIso, caminhos, escreverJson, escreverTexto, existe, lerData, lerJson, lerTexto, listar, relogioDoPacote } from './arquivos.ts'
+import { agora, caminhos, escreverJson, escreverTexto, existe, lerData, lerJson, lerTexto, listar, relogioDoPacote } from './arquivos.ts'
 import { join } from 'node:path'
 import type { Contexto, DividaTecnica, Invariante, Recusa, ReferenciaExterna, Requisito, RiscoAceito, Tarefa } from './tipos.ts'
 
@@ -485,7 +485,11 @@ export function atualizarContagens(): Contexto {
   if (existe(manifesto)) {
     ctx._meta['versao_do_pacote'] = lerJson<{ versao?: string }>(manifesto).versao ?? 'desconhecida'
   }
-  ctx._meta.atualizado_em = agoraIso()
+  // Sem carimbo de hora: regravar a data a cada comando fazia dois ramos sem mudanca real em comum
+  // conflitarem nessa linha. Nenhum codigo le o campo, e a data da ultima mudanca sai do `git log`.
+  // `null` tambem limpa a data congelada de quem vem de versao anterior. Correcao local da
+  // TASK-CHORE-026, registrada em `docs-mentor/melhorias-do-pacote.md`.
+  ctx._meta.atualizado_em = null
   escreverJson(c.contexto, ctx)
   return ctx
 }
```

## Requisitos citados pelo lote

### RF-57 (RF) · implementado

Alternar o tracado do roteiro no mapa entre rota inteira e trecho da parada selecionada, com passagens repetidas distinguiveis por acumulo de opacidade


### RF-59 (RF) · implementado

Exibir a distancia de deslocamento entre paradas consecutivas na lista completa do roteiro


## O que o script ja mediu

Fatos, nao vereditos. Quem da o nivel e voce.

- TASK-BG-023: o humano sugeriu a solucao ("Repetir a correcao da TASK-BG-022 (implicita em 'o mesmo problema da BG-022')") e o plano comparou 3 alternativa(s). Confira se a escolhida resolve o caso do pedido original, e nao so' a sugestao
- TASK-BG-023: 2 criterio(s) de aceite sem teste nomeado ("nao se aplica"). Criterio sem verificacao reproduzivel e' criterio NAO VERIFICADO
- TASK-RF-043: o humano sugeriu a solucao ("Acumulo de opacidade; alternar rota inteira/trecho selecionado numa opcao em Configuracoes; trecho em linha tracejada verde") e o plano comparou 5 alternativa(s). Confira se a escolhida resolve o caso do pedido original, e nao so' a sugestao
- TASK-RF-043: 1 criterio(s) de aceite sem teste nomeado ("nao se aplica"). Criterio sem verificacao reproduzivel e' criterio NAO VERIFICADO
- TASK-RF-043: tarefa sensivel (calculo, ui) com revisao humana declarada: "Humano validou no Samsung M35 (14/09/26) pelo dev server na rede local, roteiro L-30, com capturas no chat: tracado translucido com trechos repetidos mais escuros e nome de rua e setas de mao legiveis; parada selecionada destaca em verde a perna ate a proxima (P2 e P5), resto esmaecido. Calibrou a mao os knobs em RouteMap.tsx (tracado weight 6, opacidade 0,45, zinc-700; esmaecido 0,3; verde weight 7, opacidade 0,5; engrossa ate 2x no zoom 19) e declarou 'razoavel pra poder saber o trajeto' e 'validacao feita'." (Regra 4 atendida)
- TASK-RF-045: o humano sugeriu a solucao ("Aplicar o layout do Stitch (linha do tempo com trilho a esquerda) e mostrar a distancia do veiculo no trilho, como o LegConnector da lista de enderecos") e o plano comparou 4 alternativa(s). Confira se a escolhida resolve o caso do pedido original, e nao so' a sugestao
- TASK-RF-045: 1 criterio(s) de aceite sem teste nomeado ("nao se aplica"). Criterio sem verificacao reproduzivel e' criterio NAO VERIFICADO
- TASK-RF-045: tarefa sensivel (calculo, ui) com revisao humana declarada: "Humano validou no Samsung M35 (14/09/26) pelo dev server na rede local, roteiro L-30, com capturas no chat: Ver detalhes em linha do tempo com nos P2/P3/P4 na cor da parada, carro com distancia vertical no trilho entre as paradas (730 m, 805 m, 585 m), parada P3 aberta com os enderecos dentro do card e o trilho seguindo ate P4; no mapa, P2 selecionada destaca a perna P2->P3. Resposta: 'Perfeito'. Valores do layout sem ajuste." (Regra 4 atendida)
- TASK-CHORE-024: o humano sugeriu a solucao ("Seguir o roteiro colado: npm install da tag, node .mentor/scripts/instalar.mjs --forcar, resolver-gerados, verificar, doctor e finalizar") e o plano comparou 3 alternativa(s). Confira se a escolhida resolve o caso do pedido original, e nao so' a sugestao
- TASK-CHORE-024: 4 criterio(s) de aceite sem teste nomeado ("nao se aplica"). Criterio sem verificacao reproduzivel e' criterio NAO VERIFICADO
- TASK-CHORE-024: o gate "testes" teve o vermelho dispensado: "Atualizacao de ferramenta de processo (mentor-agent 0.10.0 -> 0.12.0) sem regra de negocio nem codigo de src/: nao ha comportamento novo do app para ver vermelho. Prova por mutacao nao se aplica; a suite roda inteira contra a arvore atualizada para mostrar que nada do app regrediu.". Auditor: verificar se ha prova por mutacao
- TASK-CHORE-025: o humano sugeriu a solucao ("Corrigir os problemas do pacote direto no .mentor/ deste projeto e, depois de um tempo, levar ao mentor-agent oficial o que permaneceu, com texto completo e sem resumo") e o plano comparou 3 alternativa(s). Confira se a escolhida resolve o caso do pedido original, e nao so' a sugestao
- TASK-CHORE-025: 2 criterio(s) de aceite sem teste nomeado ("nao se aplica"). Criterio sem verificacao reproduzivel e' criterio NAO VERIFICADO
- TASK-CHORE-026: 1 criterio(s) de aceite sem teste nomeado ("nao se aplica"). Criterio sem verificacao reproduzivel e' criterio NAO VERIFICADO

## Fora das tarefas do lote

So' fatos, sem conteudo: nao e' material desta auditoria. Um commit que toca codigo sem tarefa e' achado; o resto e' contexto.

Nada.

## Como entregar o veredito

Edite `docs-mentor/auditorias/AUD-004.json`:

- `veredito`: `APROVADO` | `APROVADO COM RESSALVAS` | `REPROVADO`
- `nao_verificado`: lista. **Nunca pode ficar vazia** — nenhuma auditoria verifica tudo, e dizer o contrario e o sinal mais claro de auditoria quebrada.
- `pendencias`: cada achado com `nivel` (`bloqueia` | `recomendacao` | `observacao`), `descricao` e `tarefas` (os IDs a que se refere).
  Deixe `destino`, `ref` e `resolvida_em` em `null`: **quem decide o destino e o humano, nao voce.**

Depois rode:

```
node mentor.mjs auditar registrar AUD-004
```

O comando recusa: marcador nao preenchido · `nao_verificado` vazio · achado `bloqueia` com veredito `APROVADO` · destino preenchido por voce.
