# AUD-003 · dossie de auditoria

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

Ficaram para a proxima auditoria, porque o dossie chegou ao teto: TASK-BG-023, TASK-RF-043, TASK-RF-045, TASK-CHORE-024, TASK-CHORE-025, TASK-CHORE-026.

### TASK-CHORE-017 · Atualizar mentor-agent para v0.6.0

`CHORE` · cerimonia Standard · esforco P/P · origem: titulo-autossuficiente

**Criterios de aceite, e o teste que cada um nomeia:**

- node mentor.mjs doctor roda sem bloqueio e os comandos novos (task pausar e task retomar) respondem
  → teste: `nao se aplica: verificacao operacional via CLI; o pacote tem cenarios de teste proprios (cenarios 23 e 24) e task pausar ja foi usado de verdade na TASK-SPIKE-003`

**Declarou mudar:**

- package.json / package-lock.json - mentor-agent github:thiagoroddev/mentor-agent#v0.5.0 -> #v0.6.0
- .mentor/esquemas/tarefa.json - reinstalado via mentor instalar --forcar (pacote v0.6.0)
- .mentor/manifesto.json - reinstalado via mentor instalar --forcar (pacote v0.6.0)
- .mentor/nucleo.md - reinstalado via mentor instalar --forcar (pacote v0.6.0)
- .mentor/processos/tarefa.md - reinstalado via mentor instalar --forcar (pacote v0.6.0)
- .mentor/scripts/cli.ts - reinstalado via mentor instalar --forcar (pacote v0.6.0)
- doctor.ts (arquivo .mentor/scripts/cmd-doctor.ts) reinstalado via mentor instalar --forcar (pacote v0.6.0); linha comeca pelo sufixo sem hifen porque o finalizar corta o caminho no hifen
- fila.ts (arquivo .mentor/scripts/cmd-fila.ts) reinstalado via mentor instalar --forcar (pacote v0.6.0); linha comeca pelo sufixo sem hifen porque o finalizar corta o caminho no hifen
- tarefa.ts (arquivo .mentor/scripts/cmd-tarefa.ts) reinstalado via mentor instalar --forcar (pacote v0.6.0); linha comeca pelo sufixo sem hifen porque o finalizar corta o caminho no hifen
- .mentor/scripts/instalar.mjs - reinstalado via mentor instalar --forcar (pacote v0.6.0)
- .mentor/scripts/tipos.ts - reinstalado via mentor instalar --forcar (pacote v0.6.0)
- .mentor/scripts/vistas.ts - reinstalado via mentor instalar --forcar (pacote v0.6.0)
- .mentor/tetos.json - reinstalado via mentor instalar --forcar (pacote v0.6.0)
- docs-mentor/contexto.json - versao_do_pacote 0.5.0 -> 0.6.0, gravada pela regeneracao das vistas

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| testes | APROVADO | dispensado (13/09/26 00:17) | 0 | Nao ha regra de negocio nem codigo de aplicacao (src/) alterado: e apenas atualizacao da dependencia de processo mentor-agent. Sem codigo de producao para mutar, prova por mutacao nao se aplica; os testes existentes passam inalterados porque nada que eles cobrem mudou. |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| build | APROVADO | — | 0 | — |
| validacao_manual | não se aplica | — | — | Atualizacao mecanica de ferramenta de processo (mentor-agent), sem alteracao em src/; nenhum modulo de aplicacao ou UI tocado. Mesma operacao ja validada nas TASK-CHORE-015 e 016. |

**Riscos declarados:** Planos de tarefas novas passam a exigir problema_canonico e discordancia; tarefas abertas antes da atualizacao recebem os campos no proximo task iniciar

**O diff da tarefa:**

1 commit(s): `fafe709` chore(TASK-CHORE-017): atualizar mentor-agent para v0.6.0 (#33)

| arquivo | linhas | fora da revisao |
| :-- | --: | :-- |
| `.mentor/esquemas/tarefa.json` | 16 | pacote intacto |
| `.mentor/manifesto.json` | 26 | pacote intacto |
| `.mentor/nucleo.md` | 7 | pacote intacto |
| `.mentor/processos/tarefa.md` | 49 | pacote intacto |
| `.mentor/scripts/cli.ts` | 10 | pacote intacto |
| `.mentor/scripts/cmd-doctor.ts` | 49 | — |
| `.mentor/scripts/cmd-fila.ts` | 28 | pacote intacto |
| `.mentor/scripts/cmd-tarefa.ts` | 305 | pacote intacto |
| `.mentor/scripts/instalar.mjs` | 8 | pacote intacto |
| `.mentor/scripts/tipos.ts` | 53 | pacote intacto |
| `.mentor/scripts/vistas.ts` | 11 | — |
| `.mentor/tetos.json` | 9 | pacote intacto |
| `docs-mentor/contexto.json` | 6 | vista gerada |
| `docs-mentor/tarefas/concluidas/0-indice.md` | 1 | registro do mentor |
| `docs-mentor/tarefas/concluidas/2026-09-13--00h20--TASK-CHORE-017.json` | 135 | registro do mentor |
| `docs-mentor/tarefas/concluidas/2026-09-13--00h20--TASK-CHORE-017.md` | 21 | registro do mentor |
| `docs-mentor/tarefas/recusas.jsonl` | 2 | registro do mentor |
| `package-lock.json` | 6 | — |
| `package.json` | 2 | — |

```diff
# fafe709 · chore(TASK-CHORE-017): atualizar mentor-agent para v0.6.0 (#33)
diff --git a/package.json b/package.json
index 7232297..df0ce46 100644
--- a/package.json
+++ b/package.json
@@ -78,7 +78,7 @@
     "fast-xml-parser": "^5.3.2",
     "globals": "^16.5.0",
     "jsdom": "^27.3.0",
-    "mentor-agent": "github:thiagoroddev/mentor-agent#v0.5.0",
+    "mentor-agent": "github:thiagoroddev/mentor-agent#v0.6.0",
     "postcss": "^8.4.47",
     "prettier": "^3.6.2",
     "puppeteer": "^25.9.0",
# fafe709 · chore(TASK-CHORE-017): atualizar mentor-agent para v0.6.0 (#33)
diff --git a/.mentor/scripts/cmd-doctor.ts b/.mentor/scripts/cmd-doctor.ts
index 6276a8a..3309d7f 100644
--- a/.mentor/scripts/cmd-doctor.ts
+++ b/.mentor/scripts/cmd-doctor.ts
@@ -1,5 +1,6 @@
 import { spawnSync } from 'node:child_process'
-import { agora, caminhos, diasDesde, escreverJson, listar } from './arquivos.ts'
+import { join } from 'node:path'
+import { agora, caminhos, diasDesde, escreverJson, existe, lerTexto, listar } from './arquivos.ts'
 import { tetos } from './cmd-verificar.ts'
 import { rascunhosParados } from './cmd-anotar.ts'
 import { PONTOS_DE_ENTRADA, pontosDeEntradaSemNucleo } from './entrada.ts'
@@ -134,6 +135,28 @@ function qualidade(ctx: Contexto, tarefas: Tarefa[]): Linha[] {
     ? { estado: 'bloqueio', texto: `${semTeste.length} tarefa(s) concluida(s) com criterio sem teste nomeado` }
     : { estado: 'ok', texto: `metodo de teste "${metodo ?? 'nao declarado'}", todo criterio com teste nomeado` })
 
+  // M6: Reincidência de spikes inconclusivos
+  const c = caminhos()
+  const spikesConcluidos = tarefas.filter((t) => t.tipo === 'SPIKE' && t.estado === 'concluida')
+  if (spikesConcluidos.length >= 2) {
+    const ultimos2 = spikesConcluidos.slice(-2)
+    const inconclusivos = ultimos2.filter((s) => {
+      const nar = s.narrativa ? join(c.concluidas, s.narrativa) : null
+      const txt = nar && existe(nar) ? lerTexto(nar).toLowerCase() : ''
+      return (
+        txt.includes('inconclusivo') ||
+        txt.includes('sem conclusao') ||
+        s.achados.some((a) => a.descricao?.toLowerCase().includes('inconclusivo'))
+      )
+    })
+    if (inconclusivos.length >= 2) {
+      linhas.push({
+        estado: 'atencao',
+        texto: 'reincidencia de spikes inconclusivos: os ultimos 2 spikes fecharam inconclusivos. Abra revisao de estrategia antes de planejar novo spike.',
+      })
+    }
+  }
+
   const estouros = tetos()
   linhas.push(estouros.length
     ? { estado: 'atencao', texto: `${estouros.length} arquivo(s) acima do teto de texto: ${estouros.map((a) => a.onde).join(', ')}` }
@@ -155,7 +178,7 @@ function qualidade(ctx: Contexto, tarefas: Tarefa[]): Linha[] {
 
 function processo(ctx: Contexto, tarefas: Tarefa[]): Linha[] {
   const linhas: Linha[] = []
-  const viva = (t: Tarefa) => t.estado === 'aberta' || t.estado === 'em-execucao'
+  const viva = (t: Tarefa) => t.estado === 'aberta' || t.estado === 'em-execucao' || t.estado === 'pausada'
   const emExecucao = tarefas.filter((t) => t.estado === 'em-execucao')
   const noCiclo = tarefas.filter((t) => viva(t) && t.fila === 'ciclo')
 
@@ -165,6 +188,28 @@ function processo(ctx: Contexto, tarefas: Tarefa[]): Linha[] {
   linhas.push({ estado: noCiclo.length > ctx.limites.ciclo_tarefas ? 'atencao' : 'neutro',
     texto: `${noCiclo.length} de ${ctx.limites.ciclo_tarefas} no ciclo, ${tarefas.filter((t) => viva(t) && t.fila === 'reserva').length} na reserva` })
 
+  const pausadas = tarefas.filter((t) => t.estado === 'pausada')
+  for (const p of pausadas) {
+    const bloqueadores = p.bloqueada_por ?? []
+    const todosResolvidos =
+      bloqueadores.length > 0 &&
+      bloqueadores.every((bid) => {
+        const b = tarefas.find((t) => t.id === bid)
+        return b && (b.estado === 'concluida' || b.estado === 'cancelada')
+      })
+    if (todosResolvidos) {
+      linhas.push({
+        estado: 'atencao',
+        texto: `${p.id} esta pausada, mas seus bloqueadores (${bloqueadores.join(', ')}) ja foram concluidos. Pronta para retomar: mentor task retomar ${p.id}`,
+      })
+    } else {
+      linhas.push({
+        estado: 'neutro',
+        texto: `${p.id} pausada: "${p.pausa_motivo ?? 'sem motivo'}"${bloqueadores.length ? ` (bloqueada por ${bloqueadores.join(', ')})` : ''}`,
+      })
+    }
+  }
+
   // Trabalho parado pela metade e' o desperdicio mais invisivel, porque parece progresso (ES-50).
   for (const t of noCiclo.filter((x) => x.valor === 'critico' && x.urgencia === 'imediata')) {
     const dias = diasDesde(t.criada_em)
# fafe709 · chore(TASK-CHORE-017): atualizar mentor-agent para v0.6.0 (#33)
diff --git a/.mentor/scripts/vistas.ts b/.mentor/scripts/vistas.ts
index ba819ec..6ee8541 100644
--- a/.mentor/scripts/vistas.ts
+++ b/.mentor/scripts/vistas.ts
@@ -115,7 +115,7 @@ export function carregarContexto(): Contexto {
 const PESO_VALOR = { critico: 0, importante: 1, desejavel: 2 } as const
 const PESO_ESFORCO = { P: 0, M: 1, G: 2, XG: 3 } as const
 
-const viva = (t: Tarefa) => t.estado === 'aberta' || t.estado === 'em-execucao'
+const viva = (t: Tarefa) => t.estado === 'aberta' || t.estado === 'em-execucao' || t.estado === 'pausada'
 
 /** Uma tarefa com fatias abertas nao se executa: ela e' o epico. Sai da fila e vira cabecalho. */
 function fatiasVivasDe(id: string, todas: Tarefa[]): Tarefa[] {
@@ -168,7 +168,7 @@ export function fixar(id: string, posicao: number): Tarefa[] {
   if (!alvo) throw new Error(`${id} nao encontrada.`)
   if (alvo.estado === 'concluida' || alvo.estado === 'cancelada') throw new Error(`${id} esta ${alvo.estado}.`)
   const fixadas = todas
-    .filter((t) => t.ordem !== null && t.id !== id && (t.estado === 'aberta' || t.estado === 'em-execucao'))
+    .filter((t) => t.ordem !== null && t.id !== id && (t.estado === 'aberta' || t.estado === 'em-execucao' || t.estado === 'pausada'))
     .sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0))
   const nova = [...fixadas.slice(0, posicao - 1), alvo, ...fixadas.slice(posicao - 1)]
   nova.forEach((t, i) => { t.ordem = i + 1 })
@@ -218,11 +218,12 @@ export function gerarBacklog(): void {
   fila.forEach((t, i) => {
     const presos = t.depende_de.filter((d) => !concluidas.has(d))
     const espera = t.validacao === 'pendente' ? ' 🔍' : ''
-    const trava = presos.length ? presos.join(', ') : '-'
+    const pausa = t.estado === 'pausada' ? ' ⏸️ [PAUSADA]' : ''
+    const trava = t.bloqueada_por?.length ? t.bloqueada_por.join(', ') : (presos.length ? presos.join(', ') : '-')
     const fixa = t.ordem === null ? '' : '📌'
     const aviso = t.esforco.ia === 'XG' ? ' ⚠️ dividir antes' : ''
     linhas.push(
-      `| ${i + 1}${fixa} | \`${t.id}\` | ${t.titulo}${aviso}${espera} | ${posicaoNaFatia(t, todas)} | ${t.valor} | ${t.urgencia} | ${t.esforco.humano}/${t.esforco.ia} | ${trava} | ${t.origem} |`,
+      `| ${i + 1}${fixa} | \`${t.id}\` | ${t.titulo}${aviso}${espera}${pausa} | ${posicaoNaFatia(t, todas)} | ${t.valor} | ${t.urgencia} | ${t.esforco.humano}/${t.esforco.ia} | ${trava} | ${t.origem} |`,
     )
   })
   if (fila.length === 0) linhas.push('| | | Nenhuma tarefa na fila | | | | | | |')
@@ -445,7 +446,7 @@ export function atualizarContagens(): Contexto {
 
   const dividas = carregarDividas()
   const riscos = carregarRiscos()
-  const vivas = tarefas.filter((t) => t.estado === 'aberta' || t.estado === 'em-execucao')
+  const vivas = tarefas.filter((t) => t.estado === 'aberta' || t.estado === 'em-execucao' || t.estado === 'pausada')
 
   ctx.contagens = {
     _gerado_por_script: true,
# fafe709 · chore(TASK-CHORE-017): atualizar mentor-agent para v0.6.0 (#33)
diff --git a/package-lock.json b/package-lock.json
index 445f893..839fe6c 100644
--- a/package-lock.json
+++ b/package-lock.json
@@ -48,7 +48,7 @@
         "fast-xml-parser": "^5.3.2",
         "globals": "^16.5.0",
         "jsdom": "^27.3.0",
-        "mentor-agent": "github:thiagoroddev/mentor-agent#v0.5.0",
+        "mentor-agent": "github:thiagoroddev/mentor-agent#v0.6.0",
         "postcss": "^8.4.47",
         "prettier": "^3.6.2",
         "puppeteer": "^25.9.0",
@@ -8786,8 +8786,8 @@
       "license": "MIT"
     },
     "node_modules/mentor-agent": {
-      "version": "0.5.0",
-      "resolved": "git+ssh://git@github.com/thiagoroddev/mentor-agent.git#d1b817a84dcb2bb2a3cf3261e40287095bb34c6d",
+      "version": "0.6.0",
+      "resolved": "git+ssh://git@github.com/thiagoroddev/mentor-agent.git#217494187d3a92c8620dece26b09ddeeb4aa727f",
       "dev": true,
       "bin": {
         "mentor": "mentor.mjs"
```

### TASK-BG-021 · Retirar edificio e zelador das palavras residenciais e gerar roteiro ficticio para validar a classificacao comercial/residencial (AUD-002-B01)

`BG` · cerimonia Standard · esforco P/M · origem: titulo-autossuficiente

**Criterios de aceite, e o teste que cada um nomeia:**

- Complemento com "edificio" ou "zelador" e sem outro sinal sai Indistinto; com sala ou loja numerada no mesmo complemento sai comercial; com apto numerado sai residencial.
  → teste: `src/__tests__/utils/inferLocationType.test.ts > address classification cases (TASK-BG-021) > case 10 a 17, 25 e 26 (vistos vermelhos antes da retirada das palavras)`
- Cada caso da tabela classifica no codigo com o rotulo que o app mostra na coluna Horario Comercial? (Sim, Nao, Indistinto).
  → teste: `src/__tests__/utils/inferLocationType.test.ts > address classification cases (TASK-BG-021) > case <id>: <complemento> is <esperado> (<motivo>), um it.each por linha da tabela`
- A contagem de comerciais do Sumario sobre as linhas do roteiro bate com o numero de casos esperados Sim.
  → teste: `src/__tests__/utils/inferLocationType.test.ts > address classification cases (TASK-BG-021) > counts exactly the cases expected as commercial`
- O roteiro gerado passa no validador de importacao do app e importa com uma parada por caso, com o numero do caso e o esperado no endereco.
  → teste: `nao se aplica como teste automatizado: arquivo de back-office que src/ nao importa. Verificado com parseAndValidateRouteJson sobre o JSON gerado (saida na narrativa) e na validacao manual de importacao.`

**Declarou mudar:**

- src/constants/keywords.ts - retirar "edificio" e "zelador" de residentialRaw (decisao do humano: nao sao palavra-chave)
- src/__tests__/utils/addressClassificationCases.ts - novo: tabela unica de casos (complemento, esperado, motivo), fonte dos testes e do roteiro ficticio
- src/__tests__/utils/inferLocationType.test.ts - trocar o teste que exigia edificio/zelador residenciais por it.each sobre a tabela, mais a contagem de comerciais
- __utilidades-back-office__/roteiros-ficticios/gerar-roteiro-classificacao.ts - novo: gera o roteiro ficticio a partir da tabela
- __utilidades-back-office__/roteiros-ficticios/roteiro-classificacao.json - novo, gerado: roteiro importavel (eu-roteirizo/roteiro/v1), uma parada por caso, esperado visivel no endereco
- .mentor/scripts/cmd-tarefa.ts - trava de escopo do finalizar le o caminho declarado ate o primeiro espaco, em vez de cortar no hifen (AUD-002-R09); divergencia local do pacote ate a correcao sair no mentor-agent
- .mentor/scripts/cmd-auditar.ts - mesmo parser no fato mecanico de arquivos fora do plano.muda da auditoria (AUD-002-R09)

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| testes | APROVADO | 13/09/26 02:41 | 0 | — |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| build | APROVADO | — | 0 | — |
| validacao_manual | APROVADO | — | 0 | Humano, 13/09/26: importou __utilidades-back-office__/roteiros-ficticios/roteiro-classificacao.json no app (26 paradas na Tijuca) e conferiu cada linha contra o 'Caso N esperado X' do endereco. Coluna Horario Comercial? igual ao esperado nas 26 (casos 12 a 17 Sim; 10, 11 e 25 Indistinto); Sumario contou 17 comerciais. Discordou do esperado dos casos 18 (Emporio da Vila e nome de empresa) e 19, que refletem o comportamento atual: registrado como DT-009, fora do escopo. Tooltip do mapa no modo roteiro mostra so Endereco e Pacotes, sem horario comercial (captura da parada P20 no chat): DT-010. |

**Riscos declarados:** Endereco residencial que so tinha "Edificio X" ou "zelador" como sinal passa a sair Indistinto. Aceito pelo humano: as duas palavras sao ambiguas. · Classificar por palavra-chave e ambiguo por natureza (observacao do humano); esta tarefa corrige a colisao achada, nao o metodo. · Correcao do parser (AUD-002-R09) feita dentro de .mentor/: o verificar do pacote acusa divergencia em cmd-tarefa.ts e cmd-auditar.ts ate o mentor-agent publicar a mesma correcao, e uma reinstalacao com --forcar a desfaz.

**Achados que a propria tarefa registrou:**

- (classe 4) Tooltip do marcador (buildStopTooltipHtml, src/utils/markers/markerModels.ts:97) chama getCommercialDisplayStatus(row) com a linha crua. Sem a coluna Location Type (rota unica, caso do roteiro ficticio e do romaneio real de teste), isRowData falha e o tooltip mostra 'Sem dados' em toda parada, enquanto a coluna Horario Comercial? mostra a inferencia. Contradiz a decisao da TASK-RF-016/RF-017 (a inferencia roda para todo romaneio). Medido nas 26 linhas do roteiro ficticio: 26 de 26 'Sem dados'. Encontrado ao verificar o roteiro gerado; nao corrigido aqui. → divida_tecnica: DT-010

**O diff da tarefa:**

1 commit(s): `e521df9` fix(TASK-BG-021): retirar edificio e zelador das palavras residenciais (#35)

| arquivo | linhas | fora da revisao |
| :-- | --: | :-- |
| `__utilidades-back-office__/roteiros-ficticios/gerar-roteiro-classificacao.ts` | 102 | — |
| `__utilidades-back-office__/roteiros-ficticios/roteiro-classificacao.json` | 1689 | gerado (.gitattributes) |
| `.mentor/scripts/cmd-auditar.ts` | 3 | pacote intacto |
| `.mentor/scripts/cmd-tarefa.ts` | 4 | pacote intacto |
| `docs-mentor/auditorias/AUD-002-dossie.md` | 1526 | vista gerada |
| `docs-mentor/auditorias/AUD-002.json` | 174 | vista gerada |
| `docs-mentor/contexto.json` | 12 | vista gerada |
| `docs-mentor/dividas/dividas.json` | 29 | — |
| `docs-mentor/melhorias-do-pacote.md` | 12 | nota |
| `docs-mentor/tarefas/concluidas/0-indice.md` | 1 | registro do mentor |
| `docs-mentor/tarefas/concluidas/2026-09-13--03h30--TASK-BG-021.json` | 143 | registro do mentor |
| `docs-mentor/tarefas/concluidas/2026-09-13--03h30--TASK-BG-021.md` | 33 | registro do mentor |
| `src/__tests__/utils/addressClassificationCases.ts` | 69 | — |
| `src/__tests__/utils/inferLocationType.test.ts` | 26 | — |
| `src/constants/keywords.ts` | 2 | — |

```diff
# e521df9 · fix(TASK-BG-021): retirar edificio e zelador das palavras residenciais (#35)
diff --git a/src/__tests__/utils/addressClassificationCases.ts b/src/__tests__/utils/addressClassificationCases.ts
new file mode 100644
index 0000000..b8529ea
--- /dev/null
+++ b/src/__tests__/utils/addressClassificationCases.ts
@@ -0,0 +1,69 @@
+/**
+ * Address classification cases (TASK-BG-021, AUD-002-B01).
+ *
+ * Single source for two consumers that must never disagree:
+ * - inferLocationType.test.ts asserts every case in code;
+ * - __utilidades-back-office__/roteiros-ficticios/gerar-roteiro-classificacao.ts turns the same
+ *   cases into a fake route the human imports to check the screen, without hunting real addresses.
+ *
+ * Dependency-free on purpose: the back-office script imports it with plain Node.
+ */
+
+export type ExpectedClassification = "commercial" | "residential" | "indistinct";
+
+export interface AddressClassificationCase {
+  /** Stable number, shown in the fake route's street name. */
+  id: number;
+  /** Everything after "street, number," — the only part the classifier reads. */
+  complement: string;
+  expected: ExpectedClassification;
+  /** Why the case exists. */
+  reason: string;
+}
+
+/** Key of UI_LABELS.COMMON that the "Horário Comercial?" column shows for each expectation. */
+export const EXPECTED_LABEL_KEY = {
+  commercial: "YES",
+  residential: "NO",
+  indistinct: "INDISTINCT",
+} as const satisfies Record<ExpectedClassification, string>;
+
+export const ADDRESS_CLASSIFICATION_CASES: readonly AddressClassificationCase[] = [
+  { id: 1, complement: "Tech Solutions", expected: "commercial", reason: "keyword tech (TASK-BG-017)" },
+  { id: 2, complement: "Empório Central", expected: "commercial", reason: "keyword emporio, accent stripped (TASK-BG-017)" },
+  { id: 3, complement: "Sobreloja", expected: "commercial", reason: "keyword sobreloja without number (TASK-BG-017)" },
+  { id: 4, complement: "Sobreloja 2", expected: "commercial", reason: "numbered sobreloja, commercial regex" },
+  { id: 5, complement: "Grill do Zé", expected: "commercial", reason: "keyword grill (TASK-BG-017)" },
+  { id: 6, complement: "Vitrine Modas", expected: "commercial", reason: "keyword vitrine (TASK-BG-017)" },
+  { id: 7, complement: "Teatro Municipal", expected: "commercial", reason: "keyword teatro (TASK-BG-017)" },
+  { id: 8, complement: "Drogarias Rio", expected: "commercial", reason: "plural listed on its own: whole-word match (TASK-BG-017)" },
+  { id: 9, complement: "Drogaria Rio", expected: "commercial", reason: "singular control for case 8" },
+  { id: 10, complement: "Edifício Cristal", expected: "indistinct", reason: "edificio is not a keyword: ambiguous (AUD-002-B01)" },
+  { id: 11, complement: "Falar com o zelador", expected: "indistinct", reason: "zelador is not a keyword: ambiguous (AUD-002-B01)" },
+  { id: 12, complement: "Edifício Central, sala 302", expected: "commercial", reason: "numbered room decides; was residential while edificio was a keyword" },
+  { id: 13, complement: "Sala 302, Edifício Central", expected: "commercial", reason: "case 12 in reverse order" },
+  { id: 14, complement: "Ed. Central, sala 302", expected: "commercial", reason: "abbreviation must agree with case 12" },
+  { id: 15, complement: "Edifício Empresarial, loja 5", expected: "commercial", reason: "numbered store inside a building" },
+  { id: 16, complement: "Zelador, sala 10", expected: "commercial", reason: "numbered room with a doorman mention" },
+  { id: 17, complement: "Edifício Tech Tower", expected: "commercial", reason: "commercial keyword inside a building name" },
+  // Cases 18 and 19 pin today's result, not the desired one: the human disagreed at validation and
+  // the fix belongs to a sturdier inference method (DT-009). Flip them when that debt is paid.
+  { id: 18, complement: "Empório da Vila", expected: "residential", reason: "known error DT-009: company name, vila is checked first" },
+  { id: 19, complement: "Ao lado do Teatro", expected: "residential", reason: "known limit DT-009: lado is residential, expected questioned" },
+  { id: 20, complement: "Andar 5, sala 302", expected: "commercial", reason: "andar left out on purpose (TASK-BG-017); the room decides" },
+  { id: 21, complement: "apto 101", expected: "residential", reason: "control: numbered apartment" },
+  { id: 22, complement: "sala 302", expected: "commercial", reason: "control: numbered room" },
+  { id: 23, complement: "Farmácias Popular", expected: "indistinct", reason: "known gap: plural not listed (AUD-002-O11)" },
+  { id: 24, complement: "", expected: "indistinct", reason: "control: no complement" },
+  { id: 25, complement: "Edifício 200", expected: "indistinct", reason: "edificio + number no longer matches the residential number rule" },
+  { id: 26, complement: "Edifício Cristal, apto 101", expected: "residential", reason: "numbered apartment stays residential inside a building" },
+];
+
+/**
+ * The address exactly as the fake route carries it. The street holds the case number and the
+ * expected label, which the classifier ignores: it reads only from the second comma on.
+ */
+export const caseAddress = (c: AddressClassificationCase, expectedLabel: string): string => {
+  const street = `Caso ${c.id} esperado ${expectedLabel}`;
+  return c.complement ? `${street}, 10, ${c.complement}` : `${street}, 10`;
+};
# e521df9 · fix(TASK-BG-021): retirar edificio e zelador das palavras residenciais (#35)
diff --git a/src/__tests__/utils/inferLocationType.test.ts b/src/__tests__/utils/inferLocationType.test.ts
index 51285db..f530808 100644
--- a/src/__tests__/utils/inferLocationType.test.ts
+++ b/src/__tests__/utils/inferLocationType.test.ts
@@ -1,7 +1,8 @@
 import { describe, it, expect } from "vitest";
-import { inferLocationType, resolveLocationType, countCommercialAddresses } from "../../utils/inferLocationType";
-import { ICON_KEYS, EXCEL_EMPTY_VALUE, COLUMN_NAMES } from "../../constants";
+import { inferLocationType, resolveLocationType, countCommercialAddresses, getCommercialDisplayStatus } from "../../utils/inferLocationType";
+import { ICON_KEYS, EXCEL_EMPTY_VALUE, COLUMN_NAMES, UI_LABELS } from "../../constants";
 import type { RowData } from "../../types";
+import { ADDRESS_CLASSIFICATION_CASES, EXPECTED_LABEL_KEY, caseAddress, type AddressClassificationCase } from "./addressClassificationCases";
 
 describe("inferLocationType", () => {
   // ==========================================================================
@@ -113,11 +114,6 @@ describe("inferLocationType", () => {
       it('classifies "drogarias" (plural) as commercial, closing the gap with "drogaria" (singular)', () => {
         expect(inferLocationType("Rua F, 60, Drogarias Rio")).toBe(ICON_KEYS.OFFICE_CORRECTED);
       });
-
-      it("classifies new residential keywords", () => {
-        expect(inferLocationType("Rua G, 70, Edifício Cristal")).toBe(ICON_KEYS.HOME_CORRECTED);
-        expect(inferLocationType("Rua G, 70, Falar com o zelador")).toBe(ICON_KEYS.HOME_CORRECTED);
-      });
     });
 
     // ========================================================================================
@@ -146,6 +142,22 @@ describe("inferLocationType", () => {
   });
 });
 
+// The same table generates the fake route the human imports (TASK-BG-021): code and screen are
+// checked against one list of cases, so they cannot drift apart.
+describe("address classification cases (TASK-BG-021)", () => {
+  const labelOf = (c: AddressClassificationCase) => UI_LABELS.COMMON[EXPECTED_LABEL_KEY[c.expected]];
+  const rowOf = (c: AddressClassificationCase): RowData => ({ [COLUMN_NAMES.DESTINATION_ADDRESS]: caseAddress(c, labelOf(c)) });
+
+  it.each(ADDRESS_CLASSIFICATION_CASES)("case $id: $complement is $expected ($reason)", (c) => {
+    expect(getCommercialDisplayStatus(resolveLocationType(rowOf(c)))).toBe(labelOf(c));
+  });
+
+  it("counts exactly the cases expected as commercial", () => {
+    const expected = ADDRESS_CLASSIFICATION_CASES.filter((c) => c.expected === "commercial").length;
+    expect(countCommercialAddresses(ADDRESS_CLASSIFICATION_CASES.map(rowOf))).toBe(String(expected));
+  });
+});
+
 describe("resolveLocationType (inferência manda — TASK-RF-016)", () => {
   const row = (over: Record<string, unknown>): RowData => ({ ...over });
# e521df9 · fix(TASK-BG-021): retirar edificio e zelador das palavras residenciais (#35)
diff --git a/src/constants/keywords.ts b/src/constants/keywords.ts
index 6e875e0..7c11b95 100644
--- a/src/constants/keywords.ts
+++ b/src/constants/keywords.ts
@@ -59,7 +59,6 @@ const residentialRaw = [
   "cbt",
   "do lado",
   "depois",
-  "edificio",
   "em frente",
   "enfrente",
   "entrar",
@@ -87,7 +86,6 @@ const residentialRaw = [
   "travessa do",
   "vila",
   "vizinho",
-  "zelador",
 ];
 
 const commercialRaw = [
# e521df9 · fix(TASK-BG-021): retirar edificio e zelador das palavras residenciais (#35)
diff --git a/__utilidades-back-office__/roteiros-ficticios/gerar-roteiro-classificacao.ts b/__utilidades-back-office__/roteiros-ficticios/gerar-roteiro-classificacao.ts
new file mode 100644
index 0000000..038d90c
--- /dev/null
+++ b/__utilidades-back-office__/roteiros-ficticios/gerar-roteiro-classificacao.ts
@@ -0,0 +1,102 @@
+/**
+ * Generates the fake route a human imports to check address classification in the app
+ * (TASK-BG-021). One stop per case of src/__tests__/utils/addressClassificationCases.ts, the same
+ * table the unit tests assert, so screen and code are checked against one list of cases.
+ *
+ * Run:    node __utilidades-back-office__/roteiros-ficticios/gerar-roteiro-classificacao.ts
+ * Import: the output like any exported route (schema eu-roteirizo/roteiro/v1).
+ *
+ * Everything is invented: no real address, recipient or tracking code.
+ */
+import { createHash } from "node:crypto";
+import { writeFileSync } from "node:fs";
+import { dirname, join } from "node:path";
+import { fileURLToPath } from "node:url";
+import { ADDRESS_CLASSIFICATION_CASES, EXPECTED_LABEL_KEY, caseAddress } from "../../src/__tests__/utils/addressClassificationCases.ts";
+import { UI_LABELS } from "../../src/constants/uiLabels.ts";
+
+const OUTPUT = join(dirname(fileURLToPath(import.meta.url)), "roteiro-classificacao.json");
+const ROUTE_NAME = "Minha rota";
+/** Compact grid on an inland street block (Tijuca), ~80 m apart: keeps the road-graph bbox small. */
+const GRID_ORIGIN = { lat: -22.923, lng: -43.235 };
+const GRID_STEP = { lat: -0.0007, lng: 0.0008 };
+const GRID_COLUMNS = 5;
+const COLUMNS = ["Sequence", "Stop", "SPX TN", "Destination Address", "City", "Latitude", "Longitude", "Neighborhood", "Zipcode", "Planned AT"];
+/** Same values as a route saved by the app today. */
+const ROUTING_CONFIG = { walkingSpeedKmh: 5, deliveryBaseSeconds: 120, deliveryPerPackageSeconds: 30, vehicleSpeedKmh: 25, autoRadiusMeters: 30 };
+
+const stamp = new Date().toISOString();
+const plannedAt = `AT${stamp.slice(0, 10).replace(/-/g, "")}0TEST`;
+const round5 = (n: number) => Number(n.toFixed(5));
+
+const stops = ADDRESS_CLASSIFICATION_CASES.map((c, index) => {
+  const label = UI_LABELS.COMMON[EXPECTED_LABEL_KEY[c.expected]];
+  const lat = round5(GRID_ORIGIN.lat + GRID_STEP.lat * Math.floor(index / GRID_COLUMNS));
+  const lng = round5(GRID_ORIGIN.lng + GRID_STEP.lng * (index % GRID_COLUMNS));
+  const tracking = `BR${String(c.id).padStart(13, "0")}`;
+  const row = {
+    Sequence: index + 1,
+    Stop: index + 1,
+    "SPX TN": tracking,
+    "Destination Address": caseAddress(c, label),
+    City: "Rio de Janeiro",
+    Latitude: lat,
+    Longitude: lng,
+    Neighborhood: "Tijuca",
+    Zipcode: "20520-000",
+    "Planned AT": plannedAt,
+  };
+  return { c, label, row, tracking, pointId: `pt_${lat.toFixed(5)},${lng.toFixed(5)}` };
+});
+
+const rows = stops.map((s) => s.row);
+// Hash of the addresses only: re-running without changing the cases keeps the same manifest, so a
+// re-import overwrites the fake route instead of piling up copies.
+const manifestId = createHash("sha256")
+  .update(rows.map((r) => r["Destination Address"]).join("\n"))
+  .digest("hex");
+
+const payload = {
+  schema: "eu-roteirizo/roteiro/v1",
+  version: 1,
+  exportedAt: stamp,
+  manifestId,
+  routeName: ROUTE_NAME,
+  route: {
+    id: `route_${manifestId.slice(0, 8)}`,
+    startPoint: { ...GRID_ORIGIN },
+    stops: stops.map((s, index) => ({
+      id: `stop_${s.pointId}`,
+      order: index + 1,
+      vehicleStop: { lat: s.row.Latitude, lng: s.row.Longitude },
+      pointIds: [s.pointId],
+      radiusMeters: ROUTING_CONFIG.autoRadiusMeters,
+      reversed: false,
+      vehicleStopIsDefault: true,
+    })),
+    config: ROUTING_CONFIG,
+    createdAt: stamp,
+  },
+  rows,
+  routes: { [ROUTE_NAME]: rows },
+  availableCols: COLUMNS,
+  missingCols: [],
+  isSingleRoute: true,
+  points: stops.map((s) => ({
+    id: s.pointId,
+    lat: s.row.Latitude,
+    lng: s.row.Longitude,
+    address: s.row["Destination Address"],
+    packageCount: 1,
+    packages: [{ id: s.tracking, rawData: s.row, tracking: s.tracking }],
+  })),
+  meta: { manifestFileName: "roteiro-classificacao.json", importedAt: stamp, at: plannedAt },
+};
+
+writeFileSync(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`);
+
+const commercial = stops.filter((s) => s.c.expected === "commercial").length;
+console.log(`${OUTPUT}\n${stops.length} paradas; o Sumario deve contar ${commercial} comerciais.\n`);
+for (const s of stops) {
+  console.log(`caso ${String(s.c.id).padStart(2)} · esperado ${s.label.padEnd(10)} · ${s.c.complement || "(sem complemento)"}`);
+}
# e521df9 · fix(TASK-BG-021): retirar edificio e zelador das palavras residenciais (#35)
diff --git a/docs-mentor/dividas/dividas.json b/docs-mentor/dividas/dividas.json
index fe51488..f95d6b1 100644
--- a/docs-mentor/dividas/dividas.json
+++ b/docs-mentor/dividas/dividas.json
@@ -1 +1,28 @@
-[]
+[
+  {
+    "id": "DT-009",
+    "tipo": "codigo",
+    "o_que": "A classificacao comercial/residencial (inferLocationType) decide por palavra-chave solta no complemento, e checa a lista residencial antes da comercial. Palavra ambigua nao tem resposta certa nesse metodo, e nome proprio que contem palavra de uma lista vence o sinal real: \"Emporio da Vila\", nome de empresa, sai residencial por causa de \"vila\" (caso 18 de src/__tests__/utils/addressClassificationCases.ts). Na validacao da TASK-BG-021 o humano tambem reconsiderou o esperado de \"Ao lado do Teatro\" (caso 19). Plural sem entrada propria nao casa (caso 23). Os casos 18 e 19 seguem na tabela travando o comportamento atual, marcados com esta divida.",
+    "motivo": "A TASK-BG-021 existia para validar o que a TASK-BG-017 mudou. Consertar o metodo de inferencia estenderia a tarefa para outro problema; o humano decidiu adiar ate haver uma abordagem mais robusta.",
+    "custo_futuro": "Toda palavra nova pode colidir com a lista oposta, como edificio e zelador colidiram na BG-017. A coluna Horario Comercial? e a contagem do Sumario erram em endereco com nome de empresa ou termo ambiguo, e cada ajuste pontual de lista aumenta o risco de regressao.",
+    "gatilho": "Antes de acrescentar ou retirar a proxima palavra-chave em src/constants/keywords.ts, ou quando classificacao errada de endereco comercial aparecer em uso real.",
+    "dono": "Thiago Rodrigues",
+    "criada_em": "13/09/26 03:12",
+    "tarefa_origem": "TASK-BG-021",
+    "paga_em": null,
+    "tarefa_pagamento": null
+  },
+  {
+    "id": "DT-010",
+    "tipo": "codigo",
+    "o_que": "O horario comercial inferido nao aparece no mapa em rota unica. No tooltip visto na validacao da TASK-BG-021 (modo roteiro) so aparecem Endereco e Pacotes. O tooltip dos quadrados de parada (buildStopTooltipHtml, src/utils/markers/markerModels.ts:97) tem a linha, mas chama getCommercialDisplayStatus com a linha crua: sem a coluna Location Type, isRowData falha e cai em \"Sem dados\" (26 de 26 no roteiro ficticio). A coluna da tabela mostra a inferencia correta, como decidido na TASK-RF-016/RF-017.",
+    "motivo": "Achado fora do escopo da TASK-BG-021, que validava a mudanca de palavras-chave. Decisao do humano: divida tecnica.",
+    "custo_futuro": "Quem planeja pelo mapa nao ve quais paradas sao comerciais, embora o dado ja exista na tabela; e o caminho de buildStopTooltipHtml, se exibido, mostra \"Sem dados\" onde ha inferencia.",
+    "gatilho": "Ao mexer nos tooltips ou marcadores do mapa (src/utils/markers/markerModels.ts), ou ao levar a informacao de horario comercial para o mapa.",
+    "dono": "Thiago Rodrigues",
+    "criada_em": "13/09/26 03:12",
+    "tarefa_origem": "TASK-BG-021",
+    "paga_em": null,
+    "tarefa_pagamento": null
+  }
+]
```

### TASK-CHORE-019 · Atualizar mentor-agent para v0.7.0

`CHORE` · cerimonia Standard · esforco P/P · origem: titulo-autossuficiente

**Criterios de aceite, e o teste que cada um nomeia:**

- node mentor.mjs verificar roda sem achado bloqueante depois da atualizacao, e a divergencia local do parser de plano.muda (AUD-002-R09) deixa de existir porque o pacote traz a correcao
  → teste: `nao se aplica: verificacao operacional via CLI; a saida do verificar fica registrada na narrativa`

**Declarou mudar:**

- package.json - devDependency mentor-agent github:thiagoroddev/mentor-agent#v0.6.0 -> #v0.7.0
- package-lock.json - lock atualizado para mentor-agent 0.7.0
- .mentor/** - pacote reinstalado via npx mentor instalar --forcar
- docs-mentor/contexto.json - versao_do_pacote 0.7.0 e campos novos do pacote, consolidados por resolver-gerados
- docs-mentor/melhorias-do-pacote.md - tirar os dois-pontos do token do marcador numa celula da tabela (falso positivo do verificar) e anotar duas melhorias do pacote achadas nesta atualizacao

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| testes | APROVADO | dispensado (13/09/26 05:49) | 0 | Nao ha regra de negocio nem codigo de aplicacao (src/) alterado: e apenas atualizacao da dependencia de processo mentor-agent. Sem codigo de producao para mutar, prova por mutacao nao se aplica; os testes existentes passam inalterados porque nada que eles cobrem mudou. |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| build | APROVADO | — | 0 | — |
| validacao_manual | não se aplica | — | — | Atualizacao mecanica de ferramenta de processo (mentor-agent), sem alteracao em src/; nenhum modulo de aplicacao ou UI tocado. Mesma operacao ja feita nas TASK-CHORE-015, 016 e 017. |

**Riscos declarados:** instalar --forcar sobrescreve a correcao local do parser em .mentor/scripts (AUD-002-R09); se a v0.7.0 nao trouxer a mesma correcao, o bug do hifen volta, e o verificar e o finalizar desta tarefa acusam · resolver-gerados pode reescrever o bloco auditoria do contexto.json (ja aconteceu num merge); conferir o diff contra o main antes de commitar

**O diff da tarefa:**

1 commit(s): `c857738` chore(TASK-CHORE-019): atualizar mentor-agent para v0.7.0 (#36)

| arquivo | linhas | fora da revisao |
| :-- | --: | :-- |
| `.mentor/esquemas/contexto.json` | 4 | pacote intacto |
| `.mentor/esquemas/tarefa.json` | 5 | pacote intacto |
| `.mentor/manifesto.json` | 26 | pacote intacto |
| `.mentor/processos/tarefa.md` | 19 | pacote intacto |
| `.mentor/scripts/arquivos.ts` | 65 | pacote intacto |
| `.mentor/scripts/cli.ts` | 10 | pacote intacto |
| `.mentor/scripts/cmd-auditar.ts` | 235 | pacote intacto |
| `.mentor/scripts/cmd-doctor.ts` | 8 | — |
| `.mentor/scripts/cmd-pacote.ts` | 23 | pacote intacto |
| `.mentor/scripts/cmd-resolver.ts` | 140 | pacote intacto |
| `.mentor/scripts/cmd-tarefa.ts` | 219 | pacote intacto |
| `.mentor/scripts/tipos.ts` | 22 | pacote intacto |
| `docs-mentor/contexto.json` | 6 | vista gerada |
| `docs-mentor/melhorias-do-pacote.md` | 211 | nota |
| `docs-mentor/tarefas/concluidas/0-indice.md` | 1 | registro do mentor |
| `docs-mentor/tarefas/concluidas/2026-09-13--05h54--TASK-CHORE-019.json` | 143 | registro do mentor |
| `docs-mentor/tarefas/concluidas/2026-09-13--05h54--TASK-CHORE-019.md` | 29 | registro do mentor |
| `docs-mentor/tarefas/recusas.jsonl` | 1 | registro do mentor |
| `package-lock.json` | 6 | — |
| `package.json` | 2 | — |

```diff
# c857738 · chore(TASK-CHORE-019): atualizar mentor-agent para v0.7.0 (#36)
diff --git a/package.json b/package.json
index df0ce46..e367150 100644
--- a/package.json
+++ b/package.json
@@ -78,7 +78,7 @@
     "fast-xml-parser": "^5.3.2",
     "globals": "^16.5.0",
     "jsdom": "^27.3.0",
-    "mentor-agent": "github:thiagoroddev/mentor-agent#v0.6.0",
+    "mentor-agent": "github:thiagoroddev/mentor-agent#v0.7.0",
     "postcss": "^8.4.47",
     "prettier": "^3.6.2",
     "puppeteer": "^25.9.0",
# c857738 · chore(TASK-CHORE-019): atualizar mentor-agent para v0.7.0 (#36)
diff --git a/.mentor/scripts/cmd-doctor.ts b/.mentor/scripts/cmd-doctor.ts
index 3309d7f..466bbb7 100644
--- a/.mentor/scripts/cmd-doctor.ts
+++ b/.mentor/scripts/cmd-doctor.ts
@@ -11,7 +11,7 @@ import {
 } from './vistas.ts'
 import { CARACTERISTICAS } from './tipos.ts'
 import type { Caracteristica, Contexto, EstadoDaCaracteristica, Fase, MetaDeQualidade, Tarefa } from './tipos.ts'
-import { baseDoLote, loteNaoAuditado, medirDiffAcumulado } from './cmd-auditar.ts'
+import { baseDoLote, calcularQuebraDiff, loteNaoAuditado, medirDiffAcumulado } from './cmd-auditar.ts'
 
 /**
  * Folha de saude do projeto. Tres propriedades a sustentam, e as tres foram medidas em campo:
@@ -383,14 +383,16 @@ function processo(ctx: Contexto, tarefas: Tarefa[]): Linha[] {
   const diffChars = medirDiffAcumulado(base)
 
   if (semAuditar >= au.cadencia_em_tarefas * 2 || (cadenciaChars > 0 && diffChars >= cadenciaChars * 1.5)) {
+    const q = calcularQuebraDiff(base)
     linhas.push({
       estado: 'bloqueio',
-      texto: `${semAuditar} tarefa(s) / ${diffChars} caracteres de diff sem auditoria (cadencias: ${au.cadencia_em_tarefas} tarefas, ${cadenciaChars} chars). Risco critico de truncamento no dossie. Rode: mentor auditar preparar`,
+      texto: `${semAuditar} tarefa(s) / ${diffChars} caracteres de diff sem auditoria (cadencias: ${au.cadencia_em_tarefas} tarefas, ${cadenciaChars} chars | codigo/testes: ${q.codigo_e_testes}, config: ${q.configuracoes}, docs: ${q.documentacao}). Risco critico de truncamento no dossie. Rode: mentor auditar preparar`,
     })
   } else if (semAuditar >= au.cadencia_em_tarefas || (cadenciaChars > 0 && diffChars >= cadenciaChars)) {
+    const q = calcularQuebraDiff(base)
     linhas.push({
       estado: 'atencao',
-      texto: `${semAuditar} tarefa(s) / ${diffChars} caracteres de diff sem auditoria (cadencias: ${au.cadencia_em_tarefas} tarefas, ${cadenciaChars} chars). Rode: mentor auditar preparar`,
+      texto: `${semAuditar} tarefa(s) / ${diffChars} caracteres de diff sem auditoria (cadencias: ${au.cadencia_em_tarefas} tarefas, ${cadenciaChars} chars | codigo/testes: ${q.codigo_e_testes}, config: ${q.configuracoes}, docs: ${q.documentacao}). Rode: mentor auditar preparar`,
     })
   } else if (au.ultima_em) {
     linhas.push({
# c857738 · chore(TASK-CHORE-019): atualizar mentor-agent para v0.7.0 (#36)
diff --git a/package-lock.json b/package-lock.json
index 839fe6c..94e2ab6 100644
--- a/package-lock.json
+++ b/package-lock.json
@@ -48,7 +48,7 @@
         "fast-xml-parser": "^5.3.2",
         "globals": "^16.5.0",
         "jsdom": "^27.3.0",
-        "mentor-agent": "github:thiagoroddev/mentor-agent#v0.6.0",
+        "mentor-agent": "github:thiagoroddev/mentor-agent#v0.7.0",
         "postcss": "^8.4.47",
         "prettier": "^3.6.2",
         "puppeteer": "^25.9.0",
@@ -8786,8 +8786,8 @@
       "license": "MIT"
     },
     "node_modules/mentor-agent": {
-      "version": "0.6.0",
-      "resolved": "git+ssh://git@github.com/thiagoroddev/mentor-agent.git#217494187d3a92c8620dece26b09ddeeb4aa727f",
+      "version": "0.7.0",
+      "resolved": "git+ssh://git@github.com/thiagoroddev/mentor-agent.git#f048e691d4648153613d45ec2e2b58405146f4ba",
       "dev": true,
       "bin": {
         "mentor": "mentor.mjs"
```

### TASK-CHORE-020 · Atualizar mentor-agent para v0.8.1

`CHORE` · cerimonia Standard · esforco P/P · origem: titulo-autossuficiente

**Criterios de aceite, e o teste que cada um nomeia:**

- node mentor.mjs verificar aprova depois da atualizacao
  → teste: `nao se aplica: verificacao operacional via CLI; a saida fica registrada com task criterio`
- node mentor.mjs doctor mostra a auditoria em dia contada por tarefas, sem a linha de caracteres de diff
  → teste: `nao se aplica: verificacao operacional via CLI; a saida fica registrada com task criterio`
- a fixture roteiro-classificacao.json sai marcada como gerada para o git
  → teste: `nao se aplica: atributo do git; a saida de git check-attr fica registrada com task criterio`

**Declarou mudar:**

- package.json - devDependency mentor-agent github:thiagoroddev/mentor-agent#v0.7.0 -> #v0.8.1
- package-lock.json - lock atualizado para mentor-agent 0.8.1
- .mentor/** - pacote reinstalado via npx mentor instalar --forcar
- mentor.mjs - atalho reinstalado junto do pacote
- docs-mentor/contexto.json - versao_do_pacote 0.8.1 via resolver-gerados; sai auditoria.cadencia_em_caracteres, que a 0.8.0 deixou de usar
- .gitattributes - __utilidades-back-office__/roteiros-ficticios/*.json como linguist-generated: a fixture gerada por script sai do diff da auditoria
- docs-mentor/melhorias-do-pacote.md - tirar o que a 0.8.0 e a 0.8.1 implementaram

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| testes | APROVADO | dispensado (13/09/26 17:51) | 0 | Nao ha regra de negocio nem codigo de aplicacao (src/) alterado: e so a atualizacao da dependencia de processo mentor-agent. Sem codigo de producao para mutar, prova por mutacao nao se aplica; os testes existentes passam inalterados porque nada que eles cobrem mudou. |
| build | APROVADO | — | 0 | — |
| validacao_manual | não se aplica | — | — | Atualizacao mecanica de ferramenta de processo (mentor-agent), sem alteracao em src/; nenhum modulo de aplicacao ou UI tocado. Mesma operacao ja feita nas TASK-CHORE-015, 016, 017 e 019. |

**Riscos declarados:** resolver-gerados pode reescrever o bloco auditoria do contexto.json (ja aconteceu num merge); conferir o diff contra o main antes de commitar · instalar --forcar troca leis: nucleo.md (marca light no commit) e processos entrega, revisao e tarefa; ler o aviso de normas e o git diff dessas pastas antes de fechar

**O diff da tarefa:**

1 commit(s): `811cc45` chore(TASK-CHORE-020): atualizar mentor-agent para v0.8.1 (#37)

| arquivo | linhas | fora da revisao |
| :-- | --: | :-- |
| `.gitattributes` | 4 | — |
| `.mentor/esquemas/contexto.json` | 5 | pacote intacto |
| `.mentor/manifesto.json` | 35 | pacote intacto |
| `.mentor/nucleo.md` | 3 | pacote intacto |
| `.mentor/processos/entrega.md` | 7 | — |
| `.mentor/processos/revisao.md` | 22 | pacote intacto |
| `.mentor/processos/tarefa.md` | 9 | pacote intacto |
| `.mentor/scripts/cli.ts` | 6 | pacote intacto |
| `.mentor/scripts/cmd-auditar.ts` | 768 | pacote intacto |
| `.mentor/scripts/cmd-doctor.ts` | 43 | — |
| `.mentor/scripts/cmd-hooks.ts` | 43 | pacote intacto |
| `.mentor/scripts/cmd-pacote.ts` | 58 | pacote intacto |
| `.mentor/scripts/cmd-tarefa.ts` | 178 | pacote intacto |
| `.mentor/scripts/cmd-verificar.ts` | 20 | — |
| `.mentor/scripts/instalar.mjs` | 61 | pacote intacto |
| `.mentor/scripts/sensivel.ts` | 37 | pacote intacto |
| `.mentor/scripts/tipos.ts` | 41 | pacote intacto |
| `.mentor/scripts/vistas.ts` | 5 | — |
| `docs-mentor/contexto.json` | 11 | vista gerada |
| `docs-mentor/melhorias-do-pacote.md` | 14 | nota |
| `docs-mentor/tarefas/concluidas/0-indice.md` | 1 | registro do mentor |
| `docs-mentor/tarefas/concluidas/2026-09-13--17h56--TASK-CHORE-020.json` | 170 | registro do mentor |
| `docs-mentor/tarefas/concluidas/2026-09-13--17h56--TASK-CHORE-020.md` | 34 | registro do mentor |
| `mentor.mjs` | 5 | — |
| `package-lock.json` | 6 | — |
| `package.json` | 2 | — |

```diff
# 811cc45 · chore(TASK-CHORE-020): atualizar mentor-agent para v0.8.1 (#37)
diff --git a/package.json b/package.json
index e367150..1ba0f79 100644
--- a/package.json
+++ b/package.json
@@ -78,7 +78,7 @@
     "fast-xml-parser": "^5.3.2",
     "globals": "^16.5.0",
     "jsdom": "^27.3.0",
-    "mentor-agent": "github:thiagoroddev/mentor-agent#v0.7.0",
+    "mentor-agent": "github:thiagoroddev/mentor-agent#v0.8.1",
     "postcss": "^8.4.47",
     "prettier": "^3.6.2",
     "puppeteer": "^25.9.0",
# 811cc45 · chore(TASK-CHORE-020): atualizar mentor-agent para v0.8.1 (#37)
diff --git a/.gitattributes b/.gitattributes
index d098de9..97af70f 100644
--- a/.gitattributes
+++ b/.gitattributes
@@ -5,3 +5,7 @@ docs-mentor/tarefas/reserva.md merge=ours
 docs-mentor/tarefas/concluidas/0-indice.md merge=ours
 # recusas.jsonl usa union: duplicatas de append entre branches sao toleradas no log
 docs-mentor/tarefas/recusas.jsonl merge=union
+
+# Fixtures geradas por script: saem do diff da auditoria do mentor e ficam recolhidas no PR do GitHub.
+# roteiro-classificacao.json sai de gerar-roteiro-classificacao.ts (TASK-BG-021); regenere, nao edite.
+__utilidades-back-office__/roteiros-ficticios/*.json linguist-generated=true
# 811cc45 · chore(TASK-CHORE-020): atualizar mentor-agent para v0.8.1 (#37)
diff --git a/.mentor/processos/entrega.md b/.mentor/processos/entrega.md
index 853b4dd..e9d7a01 100644
--- a/.mentor/processos/entrega.md
+++ b/.mentor/processos/entrega.md
@@ -27,6 +27,13 @@ foram entregues juntas.
 
 **Protegida:** não aceita envio direto. Toda mudança entra por revisão com a esteira verde. Quando `contexto.json` declara `revisao_antes_do_merge`, o hook de pre-push barra envios diretos para a `main`. A `main` local é espelho estrito de `origin/main` e não recebe trabalho em andamento.
 
+**O que o hook de pre-push faz:** roda os gates do projeto (uma vez); barra envio direto na linha
+principal protegida e commit que toque código sem `(TASK-X-NNN)` nem `(light)` no título (arquivo de
+`.mentor/` igual ao manifesto não é código; patch local é); e **mostra** os achados do `verificar`, sem barrar.
+A marca `light` não tem registro, mas não some: o dossiê da auditoria lista cada commit Light com as
+linhas que tocou, para conferir se cabia na lista fechada. Tarefa em
+execução tem marcador legítimo, e travar o envio por ele vira laço: quem barra o `verificar` é a esteira.
+
 **Prova por Árvore em Squash Merge:**
 Quando o projeto adota merge por *squash* (gerando um commit único com novo SHA na linha principal), o Git local perde o vínculo de ancestrais e comandos como `git branch --merged` não reconhecem o ramo como entregue, fazendo o `git branch -d` recusar a exclusão.
 A evidência determinística de que o trabalho está entregue é a **prova por árvore vazia**:
# 811cc45 · chore(TASK-CHORE-020): atualizar mentor-agent para v0.8.1 (#37)
diff --git a/.mentor/scripts/cmd-doctor.ts b/.mentor/scripts/cmd-doctor.ts
index 466bbb7..37c98e1 100644
--- a/.mentor/scripts/cmd-doctor.ts
+++ b/.mentor/scripts/cmd-doctor.ts
@@ -11,7 +11,7 @@ import {
 } from './vistas.ts'
 import { CARACTERISTICAS } from './tipos.ts'
 import type { Caracteristica, Contexto, EstadoDaCaracteristica, Fase, MetaDeQualidade, Tarefa } from './tipos.ts'
-import { baseDoLote, calcularQuebraDiff, loteNaoAuditado, medirDiffAcumulado } from './cmd-auditar.ts'
+import { estadoDaCadencia, maioresArquivos } from './cmd-auditar.ts'
 
 /**
  * Folha de saude do projeto. Tres propriedades a sustentam, e as tres foram medidas em campo:
@@ -373,31 +373,30 @@ function processo(ctx: Contexto, tarefas: Tarefa[]): Linha[] {
     }
   }
 
-  // Auditoria: o doctor mede a cadencia (tarefas e diff acumulado) e conta os bloqueios que ela reportou.
-  const concluidasParaAuditoria = tarefas.filter((t) => t.estado === 'concluida').length
+  // Auditoria: o doctor mede a cadencia (tarefas com diff auditavel) e conta os bloqueios que ela reportou.
   const au = ctx.auditoria
-  const semAuditar = concluidasParaAuditoria - (au.ultima_na_tarefa ?? 0)
-  const cadenciaChars = au.cadencia_em_caracteres ?? 80_000
-  const lote = loteNaoAuditado()
-  const base = baseDoLote(ctx, lote)
-  const diffChars = medirDiffAcumulado(base)
-
-  if (semAuditar >= au.cadencia_em_tarefas * 2 || (cadenciaChars > 0 && diffChars >= cadenciaChars * 1.5)) {
-    const q = calcularQuebraDiff(base)
-    linhas.push({
-      estado: 'bloqueio',
-      texto: `${semAuditar} tarefa(s) / ${diffChars} caracteres de diff sem auditoria (cadencias: ${au.cadencia_em_tarefas} tarefas, ${cadenciaChars} chars | codigo/testes: ${q.codigo_e_testes}, config: ${q.configuracoes}, docs: ${q.documentacao}). Risco critico de truncamento no dossie. Rode: mentor auditar preparar`,
-    })
-  } else if (semAuditar >= au.cadencia_em_tarefas || (cadenciaChars > 0 && diffChars >= cadenciaChars)) {
-    const q = calcularQuebraDiff(base)
-    linhas.push({
-      estado: 'atencao',
-      texto: `${semAuditar} tarefa(s) / ${diffChars} caracteres de diff sem auditoria (cadencias: ${au.cadencia_em_tarefas} tarefas, ${cadenciaChars} chars | codigo/testes: ${q.codigo_e_testes}, config: ${q.configuracoes}, docs: ${q.documentacao}). Rode: mentor auditar preparar`,
-    })
+  const cad = estadoDaCadencia(ctx)
+  const naoContam = cad.pendentes.length - cad.contam.length
+  const resumo = `${cad.contam.length} tarefa(s) com codigo sem auditoria (cadencia ${cad.cadencia}` +
+    `${naoContam ? `; ${naoContam} sem diff auditavel nao conta(m)` : ''})`
+  const maiores = maioresArquivos(cad.contam)
+  const deOndeVem = maiores.length
+    ? ` Maiores arquivos: ${maiores.map((m) => `${m.caminho} (${m.linhas} linhas)`).join(', ')}.`
+    : ''
+  if (cad.estado === 'atrasada') {
+    linhas.push({ estado: 'bloqueio', texto: `${resumo}: o dobro da cadencia.${deOndeVem} Rode: mentor auditar preparar` })
+  } else if (cad.estado === 'vencida') {
+    linhas.push({ estado: 'atencao', texto: `${resumo}.${deOndeVem} Rode: mentor auditar preparar` })
   } else if (au.ultima_em) {
     linhas.push({
       estado: 'ok',
-      texto: `auditoria em dia: ultima em ${au.ultima_em}, ${semAuditar} tarefa(s) e ${diffChars} chars de diff desde entao`,
+      texto: `auditoria em dia: ultima em ${au.ultima_em}, ${cad.contam.length} de ${cad.cadencia} tarefa(s) com codigo desde entao`,
+    })
+  }
+  if (cad.campo_obsoleto) {
+    linhas.push({
+      estado: 'neutro',
+      texto: 'auditoria.cadencia_em_caracteres nao e mais usado desde a 0.8.0: a cadencia conta tarefas, e o tamanho so decide como o dossie se divide. Pode apagar o campo',
     })
   }
   const bloqueiosDeAuditoria = au.pendencias_reportadas
# 811cc45 · chore(TASK-CHORE-020): atualizar mentor-agent para v0.8.1 (#37)
diff --git a/.mentor/scripts/cmd-verificar.ts b/.mentor/scripts/cmd-verificar.ts
index 39e72f6..f20d129 100644
--- a/.mentor/scripts/cmd-verificar.ts
+++ b/.mentor/scripts/cmd-verificar.ts
@@ -22,17 +22,23 @@ function casa(padrao: string, caminho: string): boolean {
  *   parte B sao para quem escreve o relatorio, e nao devem barrar o trabalho do projeto.
  * - `atrito-de-campo.md` e' a fonte escrita da mesma parte B. As tres categorias sao opcionais;
  *   seus marcadores orientam a medicao, mas nao significam trabalho incompleto do projeto.
+ * - `melhorias-do-pacote.md` fala **do pacote**, e por natureza cita os tokens dele. Medido em campo:
+ *   uma tabela que listava os tipos de recusa deixou o `verificar` reprovado no main por dias.
  */
-const MARCADOR_E_CONTEUDO = ['recusas.json', 'recusas.jsonl', 'relatorio-de-campo.md', 'atrito-de-campo.md']
+const MARCADOR_E_CONTEUDO = ['recusas.json', 'recusas.jsonl', 'relatorio-de-campo.md', 'atrito-de-campo.md', 'melhorias-do-pacote.md']
 
-/** Familia 1: nenhum marcador sobrevivente. O script escreve o esqueleto; ninguem entrega o esqueleto. */
+/**
+ * Familia 1: nenhum marcador sobrevivente. O script escreve o esqueleto; ninguem entrega o esqueleto.
+ * Em markdown, marcador entre crases e' citacao, nao esqueleto: o script nunca escreve crase em volta.
+ */
 function marcadores(): Achado[] {
   const c = caminhos()
   const achados: Achado[] = []
   const alvos = [...listar(c.docs, '.md'), ...listar(c.docs, '.json'), ...listar(c.docs, '.jsonl')]
     .filter((a) => !MARCADOR_E_CONTEUDO.some((nome) => a.endsWith(nome)))
   for (const a of alvos) {
-    if (lerTexto(a).includes(MARCADOR)) {
+    const texto = a.endsWith('.md') ? lerTexto(a).replace(CERCA, '') : lerTexto(a)
+    if (texto.includes(MARCADOR)) {
       achados.push({ familia: 'marcador', onde: relativo(a), problema: `contem ${MARCADOR} nao preenchido` })
     }
   }
@@ -236,11 +242,15 @@ function referencias(): Achado[] {
   return achados
 }
 
-export function verificar(): number {
-  const achados = [
+export function coletarAchados(): Achado[] {
+  return [
     ...marcadores(), ...tetos(), ...referencias(),
     ...links(), ...inventarioDeRegras(), ...divergenciaDoPacote(),
   ]
+}
+
+export function verificar(): number {
+  const achados = coletarAchados()
   if (achados.length === 0) {
     console.log('APROVADO. Tres familias: marcadores, tetos de texto, integridade referencial (ponteiros, links e inventario de regras).')
     return 0
# 811cc45 · chore(TASK-CHORE-020): atualizar mentor-agent para v0.8.1 (#37)
diff --git a/.mentor/scripts/vistas.ts b/.mentor/scripts/vistas.ts
index 6ee8541..a5f302f 100644
--- a/.mentor/scripts/vistas.ts
+++ b/.mentor/scripts/vistas.ts
@@ -468,8 +468,9 @@ export function atualizarContagens(): Contexto {
     // Preenchidos pelo doctor (fase 4), que e' quem classifica achado por severidade.
     divida_tecnica_com_gatilho_vencido: ctx.contagens['divida_tecnica_com_gatilho_vencido'] ?? null,
   }
-  ctx.auditoria.proxima_em_tarefa =
-    Math.floor(concluidas / ctx.auditoria.cadencia_em_tarefas + 1) * ctx.auditoria.cadencia_em_tarefas
+  // Conta a partir da ultima auditoria, nao do proximo multiplo: com a ultima na tarefa 25 e cadencia
+  // 10, a proxima e' a 35. Era 30. E' estimativa: tarefa sem diff auditavel nao conta e empurra a proxima.
+  ctx.auditoria.proxima_em_tarefa = (ctx.auditoria.ultima_na_tarefa ?? 0) + ctx.auditoria.cadencia_em_tarefas
   // A versao vem do manifesto do pacote INSTALADO, a cada geracao. Era gravada so' pelo `init`, e o
   // `init` recusa rodar em projeto que ja' existe: atualizar o pacote nunca atualizava o numero.
   // Achado em campo com a 0.1.3 instalada e o contexto ainda dizendo 0.1.2, o que faz o relatorio
# 811cc45 · chore(TASK-CHORE-020): atualizar mentor-agent para v0.8.1 (#37)
diff --git a/mentor.mjs b/mentor.mjs
index a8be271..ad2b59d 100644
--- a/mentor.mjs
+++ b/mentor.mjs
@@ -12,7 +12,7 @@ const aqui = dirname(fileURLToPath(import.meta.url))
 // coisa que precisa fazer ali (copiar-se para dentro do projeto) e todos os outros comandos passam
 // a rodar da raiz, onde a remocao de tipos funciona. Medido: sem isto, `npx mentor instalar` morre.
 if (aqui.split(/[\\/]/).includes('node_modules')) {
-  const { copiarPacote, criarPontosDeEntrada, analisadoresSemIgnorar } = await import('./.mentor/scripts/instalar.mjs')
+  const { avisoDeNormas, copiarPacote, criarPontosDeEntrada, analisadoresSemIgnorar, normasQueMudam } = await import('./.mentor/scripts/instalar.mjs')
   const args = process.argv.slice(2)
   if (args[0] !== 'instalar') {
     console.error('Instalado como dependencia, so `instalar` roda daqui.')
@@ -22,6 +22,8 @@ if (aqui.split(/[\\/]/).includes('node_modules')) {
   } else {
     const i = args.indexOf('--destino')
     const destino = i >= 0 && args[i + 1] ? args[i + 1] : process.cwd()
+    // Medido antes de copiar: depois, o projeto ja' tem as leis novas e nao sobra com o que comparar.
+    const normas = args.includes('--forcar') ? normasQueMudam(aqui, destino) : []
     const r = copiarPacote(aqui, destino, args.includes('--forcar'), args.includes('--migrar-docs'))
     if (!r.ok) {
       console.error(r.erro)
@@ -29,6 +31,7 @@ if (aqui.split(/[\\/]/).includes('node_modules')) {
       process.exitCode = 1
     } else {
       console.log(`mentor-agent instalado em ${destino}.`)
+      for (const linha of avisoDeNormas(normas)) console.log(linha)
       if (r.migrouDocs) console.log('Migracao concluida: docs/ foi renomeada para docs-mentor/.')
       const e = criarPontosDeEntrada(destino)
       if (e.criados.length) console.log(`Ponto de entrada criado: ${e.criados.join(', ')}.`)
# 811cc45 · chore(TASK-CHORE-020): atualizar mentor-agent para v0.8.1 (#37)
diff --git a/package-lock.json b/package-lock.json
index 94e2ab6..d6417a8 100644
--- a/package-lock.json
+++ b/package-lock.json
@@ -48,7 +48,7 @@
         "fast-xml-parser": "^5.3.2",
         "globals": "^16.5.0",
         "jsdom": "^27.3.0",
-        "mentor-agent": "github:thiagoroddev/mentor-agent#v0.7.0",
+        "mentor-agent": "github:thiagoroddev/mentor-agent#v0.8.1",
         "postcss": "^8.4.47",
         "prettier": "^3.6.2",
         "puppeteer": "^25.9.0",
@@ -8786,8 +8786,8 @@
       "license": "MIT"
     },
     "node_modules/mentor-agent": {
-      "version": "0.7.0",
-      "resolved": "git+ssh://git@github.com/thiagoroddev/mentor-agent.git#f048e691d4648153613d45ec2e2b58405146f4ba",
+      "version": "0.8.1",
+      "resolved": "git+ssh://git@github.com/thiagoroddev/mentor-agent.git#9db11d67a5089b816cadcb50a468d962da918d29",
       "dev": true,
       "bin": {
         "mentor": "mentor.mjs"
```

### TASK-CHORE-021 · Atualizar mentor-agent para v0.9.0

`CHORE` · cerimonia Standard · esforco P/P · origem: titulo-autossuficiente

**Criterios de aceite, e o teste que cada um nomeia:**

- node mentor.mjs verificar aprova depois da atualizacao
  → teste: `nao se aplica: verificacao operacional via CLI; a saida fica registrada com task criterio`
- o hook regravado nao roda mais os gates no shell e chama o hooks --pre-push
  → teste: `nao se aplica: conferencia do arquivo gerado; a saida fica registrada com task criterio`
- pronto-para-merge recusa esta tarefa enquanto aberta; o job da esteira fica verde no PR depois do finalizar
  → teste: `nao se aplica: verificacao operacional via CLI e esteira; a recusa fica registrada com task criterio, e o job, no PR`

**Declarou mudar:**

- package.json - devDependency mentor-agent github:thiagoroddev/mentor-agent#v0.8.1 -> #v0.9.0
- package-lock.json - lock atualizado para mentor-agent 0.9.0
- .mentor/** - pacote reinstalado via npx mentor instalar --forcar
- mentor.mjs - atalho reinstalado junto do pacote
- .githooks/pre-push - regravado pelo instalar no modelo 0.9.0: uma linha, os gates passam para o hooks --pre-push, que os pula no envio para wip/
- .github/workflows/quality.yml - job pronto-para-merge no PR: verde so com a tarefa do titulo concluida no ramo; fora dos PRs do Dependabot; titulo por variavel de ambiente
- docs-mentor/contexto.json - versao_do_pacote 0.9.0 via resolver-gerados

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| testes | APROVADO | dispensado (13/09/26 18:50) | 0 | Nao ha regra de negocio nem codigo de aplicacao (src/) alterado: e so a atualizacao da dependencia de processo mentor-agent e um job novo da esteira. Sem codigo de producao para mutar, prova por mutacao nao se aplica; os testes existentes passam inalterados porque nada que eles cobrem mudou. |
| build | APROVADO | — | 0 | — |
| validacao_manual | não se aplica | — | — | Atualizacao mecanica de ferramenta de processo (mentor-agent) e um job novo da esteira, sem alteracao em src/; nenhum modulo de aplicacao ou UI tocado. Mesma operacao das TASK-CHORE-019 e 020. |

**Riscos declarados:** o job novo rodar em PR sem tarefa (Dependabot) e ficar vermelho; mitigado pela condicao do job, conferida no proximo PR do Dependabot · resolver-gerados pode reescrever o bloco auditoria do contexto.json; conferir o diff contra o main antes de commitar

**O diff da tarefa:**

1 commit(s): `940ccaf` chore(TASK-CHORE-021): atualizar mentor-agent para v0.9.0 (#38)

| arquivo | linhas | fora da revisao |
| :-- | --: | :-- |
| `.githooks/pre-push` | 2 | — |
| `.github/workflows/quality.yml` | 23 | — |
| `.mentor/manifesto.json` | 23 | pacote intacto |
| `.mentor/processos/entrega.md` | 21 | — |
| `.mentor/processos/tarefa.md` | 3 | pacote intacto |
| `.mentor/scripts/cli.ts` | 10 | pacote intacto |
| `.mentor/scripts/cmd-doctor.ts` | 11 | — |
| `.mentor/scripts/cmd-hooks.ts` | 146 | pacote intacto |
| `.mentor/scripts/cmd-merge.ts` | 47 | pacote intacto |
| `.mentor/scripts/cmd-pacote.ts` | 3 | pacote intacto |
| `.mentor/scripts/cmd-tarefa.ts` | 31 | pacote intacto |
| `.mentor/scripts/instalar.mjs` | 32 | pacote intacto |
| `.mentor/skills/github-ci/SKILL.md` | 18 | pacote intacto |
| `docs-mentor/contexto.json` | 6 | vista gerada |
| `docs-mentor/tarefas/concluidas/0-indice.md` | 1 | registro do mentor |
| `docs-mentor/tarefas/concluidas/2026-09-13--18h51--TASK-CHORE-021.json` | 170 | registro do mentor |
| `docs-mentor/tarefas/concluidas/2026-09-13--18h51--TASK-CHORE-021.md` | 26 | registro do mentor |
| `mentor.mjs` | 3 | — |
| `package-lock.json` | 6 | — |
| `package.json` | 2 | — |

```diff
# 940ccaf · chore(TASK-CHORE-021): atualizar mentor-agent para v0.9.0 (#38)
diff --git a/package.json b/package.json
index 1ba0f79..5dd0fc9 100644
--- a/package.json
+++ b/package.json
@@ -78,7 +78,7 @@
     "fast-xml-parser": "^5.3.2",
     "globals": "^16.5.0",
     "jsdom": "^27.3.0",
-    "mentor-agent": "github:thiagoroddev/mentor-agent#v0.8.1",
+    "mentor-agent": "github:thiagoroddev/mentor-agent#v0.9.0",
     "postcss": "^8.4.47",
     "prettier": "^3.6.2",
     "puppeteer": "^25.9.0",
# 940ccaf · chore(TASK-CHORE-021): atualizar mentor-agent para v0.9.0 (#38)
diff --git a/.githooks/pre-push b/.githooks/pre-push
index 72185d4..ade533e 100644
--- a/.githooks/pre-push
+++ b/.githooks/pre-push
@@ -1,5 +1,5 @@
 #!/bin/sh
 # Gerado por `mentor hooks --instalar`. Roda os gates e verificacoes de pre-push do mentor.
 # Em pre-push, nao em pre-commit: commit barato evita que alguem aprenda `--no-verify`.
-node mentor.mjs gates || exit 1
+# O git passa na entrada padrao os ramos enviados; envio so para wip/ pula os gates.
 node mentor.mjs hooks --pre-push "$@" || exit 1
# 940ccaf · chore(TASK-CHORE-021): atualizar mentor-agent para v0.9.0 (#38)
diff --git a/.github/workflows/quality.yml b/.github/workflows/quality.yml
index a4d8bbe..f212d99 100644
--- a/.github/workflows/quality.yml
+++ b/.github/workflows/quality.yml
@@ -43,3 +43,26 @@ jobs:
 
       - name: Audit dependencies
         run: npm audit --audit-level=high
+
+  pronto-para-merge:
+    name: Tarefa concluida no ramo
+    # Ramo wip/ pode subir com trabalho pausado; o que nao pode e entrar no main (.mentor/processos/entrega.md).
+    # So no PR, e fora dos PRs do Dependabot, que nao tem tarefa.
+    if: github.event_name == 'pull_request' && github.event.pull_request.user.login != 'dependabot[bot]'
+    runs-on: ubuntu-latest
+    timeout-minutes: 5
+
+    steps:
+      - name: Checkout
+        uses: actions/checkout@v7
+
+      - name: Setup Node
+        uses: actions/setup-node@v7
+        with:
+          node-version: 25
+
+      # O titulo e texto de quem abriu o PR: entra por variavel de ambiente, nunca interpolado no run.
+      - name: Tarefa do titulo concluida
+        env:
+          TITULO: ${{ github.event.pull_request.title }}
+        run: node mentor.mjs pronto-para-merge --titulo "$TITULO"
# 940ccaf · chore(TASK-CHORE-021): atualizar mentor-agent para v0.9.0 (#38)
diff --git a/.mentor/processos/entrega.md b/.mentor/processos/entrega.md
index e9d7a01..21c7170 100644
--- a/.mentor/processos/entrega.md
+++ b/.mentor/processos/entrega.md
@@ -27,12 +27,10 @@ foram entregues juntas.
 
 **Protegida:** não aceita envio direto. Toda mudança entra por revisão com a esteira verde. Quando `contexto.json` declara `revisao_antes_do_merge`, o hook de pre-push barra envios diretos para a `main`. A `main` local é espelho estrito de `origin/main` e não recebe trabalho em andamento.
 
-**O que o hook de pre-push faz:** roda os gates do projeto (uma vez); barra envio direto na linha
-principal protegida e commit que toque código sem `(TASK-X-NNN)` nem `(light)` no título (arquivo de
-`.mentor/` igual ao manifesto não é código; patch local é); e **mostra** os achados do `verificar`, sem barrar.
-A marca `light` não tem registro, mas não some: o dossiê da auditoria lista cada commit Light com as
-linhas que tocou, para conferir se cabia na lista fechada. Tarefa em
-execução tem marcador legítimo, e travar o envio por ele vira laço: quem barra o `verificar` é a esteira.
+**O que o hook de pre-push faz,** olhando os ramos enviados e não o ramo atual: roda os gates; barra
+envio à linha principal protegida e commit que toque código sem `(TASK-X-NNN)` nem `(light)` no
+título (`.mentor/` igual ao manifesto não é código); e **mostra** o `verificar`, sem barrar. Envio
+só para `wip/` passa direto. O dossiê da auditoria lista cada commit Light com as linhas tocadas.
 
 **Prova por Árvore em Squash Merge:**
 Quando o projeto adota merge por *squash* (gerando um commit único com novo SHA na linha principal), o Git local perde o vínculo de ancestrais e comandos como `git branch --merged` não reconhecem o ramo como entregue, fazendo o `git branch -d` recusar a exclusão.
@@ -55,6 +53,17 @@ Ele faz a fusão semântica de `contexto.json` preservando decisões de ambos os
 **Integrar cedo e com frequência** (OPS-15). Ramo aberto há semanas é a forma mais invisível de
 desperdício, porque parece progresso.
 
+## Trabalho pausado (WIP)
+
+Pausa só no disco se perde com o disco. `task pausar --commit` e `git push -u origin HEAD:wip/<id>`:
+o envio para `wip/` não passa por gates nem checagem de ID. **O proibido é o merge**, e para voltar:
+
+1. `git merge origin/main` no ramo WIP, **antes** do `task retomar` (ele recusa na ordem errada). Merge, nunca rebase: o rebase troca o `commit_pausa` gravado.
+2. `task retomar`, trabalho, gates, `task finalizar`, PR com o ID no título.
+3. A esteira roda `node mentor.mjs pronto-para-merge --titulo "$TITULO"`: verde só com a tarefa concluída no ramo. Squash merge; os `wip(...)` somem com o ramo.
+
+Ramo privado em repositório público não existe: todo ramo e todo o histórico ficam legíveis. Dado sensível vai para outro repositório privado ou para fora do git, nunca para um ramo.
+
 ## O que a esteira barra
 
 Construção quebrada · teste falhando · análise estática reprovada · vulnerabilidade crítica ·
# 940ccaf · chore(TASK-CHORE-021): atualizar mentor-agent para v0.9.0 (#38)
diff --git a/.mentor/scripts/cmd-doctor.ts b/.mentor/scripts/cmd-doctor.ts
index 37c98e1..652cfa4 100644
--- a/.mentor/scripts/cmd-doctor.ts
+++ b/.mentor/scripts/cmd-doctor.ts
@@ -309,6 +309,17 @@ function processo(ctx: Contexto, tarefas: Tarefa[]): Linha[] {
     } catch {
       // continua
     }
+
+    // Ramos WIP no remoto: trabalho pausado guardado fora do disco. Listar e' o que impede virar ramo esquecido.
+    const rWip = spawnSync('git', ['for-each-ref', '--format=%(refname:short)', 'refs/remotes'], { cwd: raiz, encoding: 'utf8', timeout: 5_000 })
+    const wips = (rWip.stdout ?? '').split('\n').map((s) => s.trim()).filter((s) => /^[^/]+\/wip\//.test(s))
+    // Nao sugere apagar: a pausa costuma existir so' no proprio ramo WIP, e o ramo atual nao a enxerga.
+    if (wips.length) {
+      linhas.push({
+        estado: 'neutro',
+        texto: `${wips.length} ramo(s) WIP no remoto: ${wips.join(', ')}. Entram no ramo principal so por PR, com a tarefa concluida`,
+      })
+    }
   }
 
   // Versionamento se responde em CONSTRUCAO, nao em pre-lancamento: quando ha o que publicar,
# 940ccaf · chore(TASK-CHORE-021): atualizar mentor-agent para v0.9.0 (#38)
diff --git a/mentor.mjs b/mentor.mjs
index ad2b59d..70eb9ab 100644
--- a/mentor.mjs
+++ b/mentor.mjs
@@ -12,7 +12,7 @@ const aqui = dirname(fileURLToPath(import.meta.url))
 // coisa que precisa fazer ali (copiar-se para dentro do projeto) e todos os outros comandos passam
 // a rodar da raiz, onde a remocao de tipos funciona. Medido: sem isto, `npx mentor instalar` morre.
 if (aqui.split(/[\\/]/).includes('node_modules')) {
-  const { avisoDeNormas, copiarPacote, criarPontosDeEntrada, analisadoresSemIgnorar, normasQueMudam } = await import('./.mentor/scripts/instalar.mjs')
+  const { atualizarHookDoMentor, avisoDeNormas, copiarPacote, criarPontosDeEntrada, analisadoresSemIgnorar, normasQueMudam } = await import('./.mentor/scripts/instalar.mjs')
   const args = process.argv.slice(2)
   if (args[0] !== 'instalar') {
     console.error('Instalado como dependencia, so `instalar` roda daqui.')
@@ -32,6 +32,7 @@ if (aqui.split(/[\\/]/).includes('node_modules')) {
     } else {
       console.log(`mentor-agent instalado em ${destino}.`)
       for (const linha of avisoDeNormas(normas)) console.log(linha)
+      if (atualizarHookDoMentor(destino)) console.log('Hook .githooks/pre-push regravado no modelo novo: envio para wip/ pula os gates.')
       if (r.migrouDocs) console.log('Migracao concluida: docs/ foi renomeada para docs-mentor/.')
       const e = criarPontosDeEntrada(destino)
       if (e.criados.length) console.log(`Ponto de entrada criado: ${e.criados.join(', ')}.`)
# 940ccaf · chore(TASK-CHORE-021): atualizar mentor-agent para v0.9.0 (#38)
diff --git a/package-lock.json b/package-lock.json
index d6417a8..e3265c9 100644
--- a/package-lock.json
+++ b/package-lock.json
@@ -48,7 +48,7 @@
         "fast-xml-parser": "^5.3.2",
         "globals": "^16.5.0",
         "jsdom": "^27.3.0",
-        "mentor-agent": "github:thiagoroddev/mentor-agent#v0.8.1",
+        "mentor-agent": "github:thiagoroddev/mentor-agent#v0.9.0",
         "postcss": "^8.4.47",
         "prettier": "^3.6.2",
         "puppeteer": "^25.9.0",
@@ -8786,8 +8786,8 @@
       "license": "MIT"
     },
     "node_modules/mentor-agent": {
-      "version": "0.8.1",
-      "resolved": "git+ssh://git@github.com/thiagoroddev/mentor-agent.git#9db11d67a5089b816cadcb50a468d962da918d29",
+      "version": "0.9.0",
+      "resolved": "git+ssh://git@github.com/thiagoroddev/mentor-agent.git#95ede8e169f72661e23f09da56330df3ced8df2b",
       "dev": true,
       "bin": {
         "mentor": "mentor.mjs"
```

### TASK-RF-044 · Avancar e retroceder entre paradas do Meu roteiro em ciclo

`RF` · cerimonia Standard · esforco P/M · origem: RF-58

**Criterios de aceite, e o teste que cada um nomeia:**

- adjacentStopId cicla nas duas pontas: da ultima parada avanca para a P1, e da P1 retrocede para a ultima
  → teste: `src/__tests__/utils/routing/selectors.test.ts > adjacentStopId > cicla nas duas pontas`
- lista vazia devolve null; id nulo ou desconhecido devolve a primeira parada pela ordem; a vizinha segue o campo order, nao a posicao no array
  → teste: `src/__tests__/utils/routing/selectors.test.ts > adjacentStopId > bordas e ordem por order`
- o header do roteiro mostra os botoes Parada anterior/Proxima parada quando recebe os handlers, e nao mostra sem eles; com stepDisabled as duas setas ficam desativadas
  → teste: `src/__tests__/components/map/panel/RoteiroPanelHeader.test.tsx > mostra o stepper so com os dois handlers; src/__tests__/components/map/panel/PanelModeBar.test.tsx > desativa as setas com stepDisabled`
- no Meu roteiro (visualizacao) com duas ou mais paradas firmadas, Proxima parada seleciona a vizinha e o mapa enquadra os enderecos dela; da ultima volta para a P1 e da P1 retrocede para a ultima
  → teste: `src/__tests__/pages/MapPage.test.tsx > Meu roteiro: parada anterior/proxima percorre as paradas firmadas em ciclo`
- com uma parada firmada as setas aparecem desativadas e desbotadas; sem parada firmada nao aparecem
  → teste: `src/__tests__/pages/MapPage.test.tsx > Meu roteiro: com uma parada so as setas ficam desativadas`
- no cabecalho do Meu roteiro, Recomecar, Ver detalhes e as setas ficam numa linha abaixo da barra de progresso, e o rotulo do modo deixa de truncar por causa deles (decisao do humano na validacao, 13/09/26)
  → teste: `src/__tests__/components/map/panel/PanelModeBar.test.tsx > com progresso, os botoes ficam numa linha abaixo da barra`

**Declarou mudar:**

- src/utils/routing/selectors.ts - adjacentStopId(stops, currentId, direction): id da parada firmada anterior/proxima pela ordem (order), em ciclo; espelho de adjacentStopKey do modo Original
- src/__tests__/utils/routing/selectors.test.ts - casos de adjacentStopId
- src/components/map/panel/PanelModeBar.tsx - prop opcional stepDisabled: as duas setas ficam desativadas e desbotadas (estilo disabled do Button); com progresso (Meu roteiro), os botoes vao para uma linha abaixo da barra, e o rotulo do modo fica com a primeira linha inteira
- src/__tests__/components/map/panel/PanelModeBar.test.tsx - setas desativadas com stepDisabled; botoes abaixo da barra de progresso
- src/components/map/panel/RoteiroPanelHeader.tsx - props opcionais onPrevStop/onNextStop/stepDisabled repassadas ao PanelModeBar, que ja desenha o StopStepper quando recebe as duas
- src/__tests__/components/map/panel/RoteiroPanelHeader.test.tsx - stepper aparece com os handlers e continua ausente sem eles
- src/pages/MapPage.tsx - handleStepRoteiroStop(direction): adjacentStopId sobre builderState.stops a partir de selectedStopId, e reusa handleShowRoteiroStopOnMap (seleciona a parada, o mapa enquadra, painel recolhido); handlers nos ramos do header do roteiro fora do rascunho, com parada firmada; setas desativadas com uma so
- src/__tests__/pages/MapPage.test.tsx - navegacao pelo header do roteiro com roteiro salvo hidratado

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| testes | APROVADO | 13/09/26 19:48 | 0 | — |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| build | APROVADO | — | 0 | — |
| validacao_manual | APROVADO | — | — | Humano validou no Samsung M35 pelo preview rf-044-navegar-paradas-rotei.teste-prototipo.pages.dev (13/09/26), com prints: no Meu roteiro as setas do cabecalho navegam entre as paradas firmadas e selecionam a parada no mapa; depois do ajuste, Recomecar, Ver detalhes e as setas ficaram numa linha abaixo da barra de progresso. Declarou: o botao funciona, tarefa finalizada. |

**Riscos declarados:** cabecalho apertado no celular, truncando o rotulo do modo · a ordem das paradas vir do array e nao do campo order depois de uma reordenacao (RF-006.17); coberto pelo criterio 2

**Achados que a propria tarefa registrou:**

- (classe 4) Na validacao no celular, paradas de um roteiro importado do experimento de auto-roteirizacao mostravam o veiculo longe da frente do pino, a caminho da parada seguinte. A regra padrao (defaultVehicleStop, via do proprio endereco) e contradita pelo dado: experimentArtifacts.ts exporta toda parada com vehicleStopIsDefault false, e o app trata a ancora otimizada como escolha do usuario e nunca reaplica o padrao. → tarefa: TASK-BG-022

**O diff da tarefa:**

1 commit(s): `5f09d19` feat(TASK-RF-044): navegar entre as paradas do Meu roteiro com setas no cabecalho (#39)

| arquivo | linhas | fora da revisao |
| :-- | --: | :-- |
| `docs-mentor/contexto.json` | 12 | vista gerada |
| `docs-mentor/melhorias-do-pacote.md` | 2 | nota |
| `docs-mentor/requisitos/implementados.md` | 1 | vista gerada |
| `docs-mentor/requisitos/pendentes.md` | 1 | vista gerada |
| `docs-mentor/requisitos/requisitos.json` | 8 | — |
| `docs-mentor/tarefas/abertas/TASK-BG-022.json` | 44 | registro do mentor |
| `docs-mentor/tarefas/abertas/TASK-RF-044.json` | 46 | registro do mentor |
| `docs-mentor/tarefas/backlog.md` | 2 | registro do mentor |
| `docs-mentor/tarefas/concluidas/0-indice.md` | 1 | registro do mentor |
| `docs-mentor/tarefas/concluidas/2026-09-13--21h53--TASK-RF-044.json` | 171 | registro do mentor |
| `docs-mentor/tarefas/concluidas/2026-09-13--21h53--TASK-RF-044.md` | 26 | registro do mentor |
| `docs-mentor/tarefas/reserva.md` | 1 | registro do mentor |
| `src/__tests__/components/map/panel/PanelModeBar.test.tsx` | 24 | — |
| `src/__tests__/components/map/panel/RoteiroPanelHeader.test.tsx` | 20 | — |
| `src/__tests__/pages/MapPage.test.tsx` | 47 | — |
| `src/__tests__/utils/routing/selectors.test.ts` | 22 | — |
| `src/components/map/panel/PanelModeBar.tsx` | 66 | — |
| `src/components/map/panel/RoteiroPanelHeader.tsx` | 22 | — |
| `src/pages/MapPage.tsx` | 16 | — |
| `src/utils/routing/selectors.ts` | 15 | — |

```diff
# 5f09d19 · feat(TASK-RF-044): navegar entre as paradas do Meu roteiro com setas no cabecalho (#39)
diff --git a/src/__tests__/components/map/panel/PanelModeBar.test.tsx b/src/__tests__/components/map/panel/PanelModeBar.test.tsx
index ee74ca3..49d80b8 100644
--- a/src/__tests__/components/map/panel/PanelModeBar.test.tsx
+++ b/src/__tests__/components/map/panel/PanelModeBar.test.tsx
@@ -40,6 +40,30 @@ describe("PanelModeBar", () => {
     expect(screen.queryByRole("button", { name: UI_LABELS.MAP_PANEL.NEXT_STOP })).not.toBeInTheDocument();
   });
 
+  it("desativa as setas com stepDisabled (uma parada so: nao ha para onde ir — TASK-RF-044)", () => {
+    const onPrevStop = vi.fn();
+    const onNextStop = vi.fn();
+    render(<PanelModeBar modeLabel={UI_LABELS.MAP_MODE.MY_ROTEIRO} onPrevStop={onPrevStop} onNextStop={onNextStop} stepDisabled />);
+
+    const prev = screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.PREV_STOP });
+    const next = screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.NEXT_STOP });
+    expect(prev).toBeDisabled();
+    expect(next).toBeDisabled();
+    fireEvent.click(next);
+    expect(onNextStop).not.toHaveBeenCalled();
+  });
+
+  it("com progresso, os botoes ficam numa linha abaixo da barra (o rotulo do modo nao trunca por causa deles — TASK-RF-044)", () => {
+    render(<PanelModeBar modeLabel={UI_LABELS.MAP_MODE.MY_ROTEIRO} progress={0.08} actions={<button type="button">Ver detalhes</button>} onPrevStop={vi.fn()} onNextStop={vi.fn()} />);
+
+    const bar = screen.getByRole("progressbar");
+    const label = screen.getByText(UI_LABELS.MAP_MODE.MY_ROTEIRO);
+    const depoisDaBarra = (el: HTMLElement) => Boolean(bar.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
+    expect(Boolean(label.compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING)).toBe(true);
+    expect(depoisDaBarra(screen.getByRole("button", { name: "Ver detalhes" }))).toBe(true);
+    expect(depoisDaBarra(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.NEXT_STOP }))).toBe(true);
+  });
+
   it("renderiza a porcentagem diretamente ao lado do nome do modo", () => {
     render(<PanelModeBar modeLabel="Meu Roteiro" progress={1.0} />);
# 5f09d19 · feat(TASK-RF-044): navegar entre as paradas do Meu roteiro com setas no cabecalho (#39)
diff --git a/src/__tests__/components/map/panel/RoteiroPanelHeader.test.tsx b/src/__tests__/components/map/panel/RoteiroPanelHeader.test.tsx
index 516f9a5..4762ebe 100644
--- a/src/__tests__/components/map/panel/RoteiroPanelHeader.test.tsx
+++ b/src/__tests__/components/map/panel/RoteiroPanelHeader.test.tsx
@@ -51,13 +51,31 @@ describe("RoteiroPanelHeader (TASK-RF-006.2/.3/.4.1; concise since RF-006.8)", (
     expect(onRetry).toHaveBeenCalledTimes(1);
   });
 
-  it("has no stop steppers (stepping over built stops arrives with .6)", () => {
+  it("has no stop steppers without the handlers (nothing firmed to step over)", () => {
     renderHeader();
 
     expect(screen.queryByRole("button", { name: UI_LABELS.MAP_PANEL.PREV_STOP })).not.toBeInTheDocument();
     expect(screen.queryByRole("button", { name: UI_LABELS.MAP_PANEL.NEXT_STOP })).not.toBeInTheDocument();
   });
 
+  it("mostra o stepper so com os dois handlers (TASK-RF-044, RF-58)", () => {
+    const onPrevStop = vi.fn();
+    const onNextStop = vi.fn();
+    renderHeader({ onPrevStop, onNextStop });
+
+    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.PREV_STOP }));
+    fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.NEXT_STOP }));
+    expect(onPrevStop).toHaveBeenCalledTimes(1);
+    expect(onNextStop).toHaveBeenCalledTimes(1);
+  });
+
+  it("repassa stepDisabled: as duas setas desativadas", () => {
+    renderHeader({ onPrevStop: vi.fn(), onNextStop: vi.fn(), stepDisabled: true });
+
+    expect(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.PREV_STOP })).toBeDisabled();
+    expect(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.NEXT_STOP })).toBeDisabled();
+  });
+
   it("exibe botao Recomecar quando ha paradas e confirma limpeza", () => {
     const onResetRoute = vi.fn();
     const { rerender } = render(
# 5f09d19 · feat(TASK-RF-044): navegar entre as paradas do Meu roteiro com setas no cabecalho (#39)
diff --git a/src/__tests__/pages/MapPage.test.tsx b/src/__tests__/pages/MapPage.test.tsx
index 077afb4..3937850 100644
--- a/src/__tests__/pages/MapPage.test.tsx
+++ b/src/__tests__/pages/MapPage.test.tsx
@@ -863,6 +863,53 @@ describe("MapPage (focus screen)", () => {
     expect(screen.queryByText(START_LABELS.SECTION)).not.toBeInTheDocument();
   });
 
+  // ------- Navegação ‹ › entre paradas firmadas (TASK-RF-044, RF-58) -------
+
+  const savedRoute = (stops: PlannedRoute["stops"]): PlannedRoute => ({
+    id: "route_saved",
+    startPoint: { lat: -22.9, lng: -43.2 },
+    stops,
+    config: DEFAULT_ROUTING_CONFIG,
+    createdAt: "2026-07-10T10:00:00.000Z",
+  });
+  const P1 = { id: "stop_1", order: 1, vehicleStop: { lat: -22.9, lng: -43.2 }, pointIds: ["pt_-22.90000,-43.20000", "pt_-22.90015,-43.20000"], radiusMeters: 30 };
+  const P2 = { id: "stop_2", order: 2, vehicleStop: { lat: -22.905, lng: -43.2 }, pointIds: ["pt_-22.90500,-43.20000"], radiusMeters: 30 };
+
+  it("Meu roteiro: parada anterior/proxima percorre as paradas firmadas em ciclo", async () => {
+    uploaderState.routes = { "A-1": rowsThreePoints };
+    routeStorageState.saved = savedRoute([P1, P2]);
+    renderPage("/mapa?romaneio=hash-1&rota=A-1&modo=roteiro");
+    await waitFor(() => expect(screen.getByTestId("route-map-stub").getAttribute("data-models-summary")).toContain("stop"));
+
+    const stub = screen.getByTestId("route-map-stub");
+    const next = () => fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.NEXT_STOP }));
+    const prev = () => fireEvent.click(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.PREV_STOP }));
+
+    // Nothing selected yet: › goes to the FIRST stop, and the map frames its two addresses.
+    next();
+    expect(stub).toHaveAttribute("data-focus-bounds", "2");
+    next(); // P2: one address
+    expect(stub).toHaveAttribute("data-focus-bounds", "1");
+    next(); // last → P1 (visualização cicla)
+    expect(stub).toHaveAttribute("data-focus-bounds", "2");
+    prev(); // P1 → last
+    expect(stub).toHaveAttribute("data-focus-bounds", "1");
+  });
+
+  it("Meu roteiro: com uma parada so as setas ficam desativadas", async () => {
+    uploaderState.routes = { "A-1": rowsThreePoints };
+    // No firmed stop: no arrows at all.
+    const semParada = renderPage("/mapa?romaneio=hash-1&rota=A-1&modo=roteiro");
+    expect(screen.queryByRole("button", { name: UI_LABELS.MAP_PANEL.NEXT_STOP })).not.toBeInTheDocument();
+    semParada.unmount();
+
+    routeStorageState.saved = savedRoute([P1]);
+    renderPage("/mapa?romaneio=hash-1&rota=A-1&modo=roteiro");
+    await waitFor(() => expect(screen.getByTestId("route-map-stub").getAttribute("data-models-summary")).toContain("stop"));
+    expect(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.PREV_STOP })).toBeDisabled();
+    expect(screen.getByRole("button", { name: UI_LABELS.MAP_PANEL.NEXT_STOP })).toBeDisabled();
+  });
+
   it("auto-save: firma da parada persiste (debounce); a EDIÇÃO aberta pausa o save (o snapshot pré-edição fica)", async () => {
     startRoteiroFlow();
     fireEvent.click(screen.getByRole("button", { name: "stub-first-point-tap" }));
# 5f09d19 · feat(TASK-RF-044): navegar entre as paradas do Meu roteiro com setas no cabecalho (#39)
diff --git a/src/__tests__/utils/routing/selectors.test.ts b/src/__tests__/utils/routing/selectors.test.ts
index f40088b..915f606 100644
--- a/src/__tests__/utils/routing/selectors.test.ts
+++ b/src/__tests__/utils/routing/selectors.test.ts
@@ -10,6 +10,7 @@ import {
   stopCentroid,
   pointsWithinRadius,
   nearestStopTo,
+  adjacentStopId,
 } from "../../../utils/routing/selectors";
 import type { DeliveryPoint, RouteStop } from "../../../types/routing";
 
@@ -67,3 +68,24 @@ describe("routing selectors", () => {
     expect(c!.lng).toBeCloseTo(-43.195);
   });
 });
+
+describe("adjacentStopId (TASK-RF-044, RF-58)", () => {
+  const firmed = (id: string, order: number): RouteStop => ({ id, order, vehicleStop: { lat: -22.95, lng: -43.19 }, pointIds: [], radiusMeters: 30 });
+  // Stored out of order on purpose: a reorder (RF-006.17) renumbers `order` without sorting the array.
+  const stops = [firmed("s3", 3), firmed("s1", 1), firmed("s2", 2)];
+
+  it("cicla nas duas pontas", () => {
+    expect(adjacentStopId(stops, "s3", 1)).toBe("s1");
+    expect(adjacentStopId(stops, "s1", -1)).toBe("s3");
+  });
+
+  it("bordas e ordem por order", () => {
+    expect(adjacentStopId([], "s1", 1)).toBeNull();
+    expect(adjacentStopId(stops, null, 1)).toBe("s1");
+    expect(adjacentStopId(stops, "desconhecida", -1)).toBe("s1");
+    // The neighbour follows `order`, not the array position.
+    expect(adjacentStopId(stops, "s1", 1)).toBe("s2");
+    expect(adjacentStopId(stops, "s2", 1)).toBe("s3");
+    expect(adjacentStopId(stops, "s2", -1)).toBe("s1");
+  });
+});
# 5f09d19 · feat(TASK-RF-044): navegar entre as paradas do Meu roteiro com setas no cabecalho (#39)
diff --git a/src/components/map/panel/PanelModeBar.tsx b/src/components/map/panel/PanelModeBar.tsx
index 3d43aa3..084cac8 100644
--- a/src/components/map/panel/PanelModeBar.tsx
+++ b/src/components/map/panel/PanelModeBar.tsx
@@ -20,40 +20,64 @@ interface Props {
   /** StopStepper ‹ › — circular over the Stop order (design doc §5). Hidden unless both handlers exist. */
   onPrevStop?: () => void;
   onNextStop?: () => void;
+  /** Arrows shown but disabled (faded): a single stop has nowhere to go (TASK-RF-044). */
+  stepDisabled?: boolean;
 }
 
 /**
  * StopStepper - prev/next stop arrows. `data-vaul-no-drag`: the header is the
  * drawer's drag area, so taps on the buttons must not start a drag.
  */
-const StopStepper = ({ onPrevStop, onNextStop }: { onPrevStop: () => void; onNextStop: () => void }) => (
+const StopStepper = ({ onPrevStop, onNextStop, disabled = false }: { onPrevStop: () => void; onNextStop: () => void; disabled?: boolean }) => (
   <div className="flex items-center gap-1">
-    <Button type="button" variant="ghost" size="icon" data-vaul-no-drag aria-label={UI_LABELS.MAP_PANEL.PREV_STOP} onClick={onPrevStop}>
+    <Button type="button" variant="ghost" size="icon" data-vaul-no-drag aria-label={UI_LABELS.MAP_PANEL.PREV_STOP} onClick={onPrevStop} disabled={disabled}>
       <ChevronLeft aria-hidden />
     </Button>
-    <Button type="button" variant="ghost" size="icon" data-vaul-no-drag aria-label={UI_LABELS.MAP_PANEL.NEXT_STOP} onClick={onNextStop}>
+    <Button type="button" variant="ghost" size="icon" data-vaul-no-drag aria-label={UI_LABELS.MAP_PANEL.NEXT_STOP} onClick={onNextStop} disabled={disabled}>
       <ChevronRight aria-hidden />
     </Button>
   </div>
 );
 
-export const PanelModeBar = ({ modeLabel, progress, actions, onPrevStop, onNextStop }: Props) => (
-  <div>
-    <div className="flex min-h-10 items-center justify-between gap-2 px-4">
-      <div className="flex min-w-0 items-center gap-1.5 truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
-        <span className="truncate">{modeLabel}</span>
-        {progress !== undefined && (
-          <>
-            <span aria-hidden>-</span>
-            <span className="shrink-0 font-semibold tabular-nums text-foreground">{UI_LABELS.MAP_PANEL.ROTEIRO_OVERVIEW.PERCENT(progress)}</span>
-          </>
-        )}
-      </div>
-      <div className="flex shrink-0 items-center gap-2">
-        {actions}
-        {onPrevStop && onNextStop && <StopStepper onPrevStop={onPrevStop} onNextStop={onNextStop} />}
+export const PanelModeBar = ({ modeLabel, progress, actions, onPrevStop, onNextStop, stepDisabled = false }: Props) => {
+  const stepper = onPrevStop && onNextStop ? <StopStepper onPrevStop={onPrevStop} onNextStop={onNextStop} disabled={stepDisabled} /> : null;
+  const label = (
+    <div className="flex min-w-0 items-center gap-1.5 truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
+      <span className="truncate">{modeLabel}</span>
+      {progress !== undefined && (
+        <>
+          <span aria-hidden>-</span>
+          <span className="shrink-0 font-semibold tabular-nums text-foreground">{UI_LABELS.MAP_PANEL.ROTEIRO_OVERVIEW.PERCENT(progress)}</span>
+        </>
+      )}
+    </div>
+  );
+
+  // Original (no progress): one row, label + stepper, as before.
+  if (progress === undefined) {
+    return (
+      <div className="flex min-h-10 items-center justify-between gap-2 px-4">
+        {label}
+        <div className="flex shrink-0 items-center gap-2">
+          {actions}
+          {stepper}
+        </div>
       </div>
+    );
+  }
+
+  // Meu roteiro: label + percent get the whole first row; the buttons go to a row UNDER
+  // the progress bar (TASK-RF-044 — on a 412 px phone they truncated the mode label to "ROTEIRO I…").
+  return (
+    <div>
+      <div className="flex min-h-8 items-center px-4">{label}</div>
+      <Progress value={progress} label={UI_LABELS.MAP_PANEL.ROTEIRO_OVERVIEW.PROGRESS_ARIA} className="mx-4 mb-1 h-1" />
+      {(actions || stepper) && (
+        <div className="flex items-center justify-between gap-2 px-4 pt-1">
+          <div className="flex min-w-0 items-center gap-2">{actions}</div>
+          {stepper}
+        </div>
+      )}
     </div>
-    {progress !== undefined && <Progress value={progress} label={UI_LABELS.MAP_PANEL.ROTEIRO_OVERVIEW.PROGRESS_ARIA} className="mx-4 mb-1 h-1" />}
-  </div>
-);
+  );
+};
# 5f09d19 · feat(TASK-RF-044): navegar entre as paradas do Meu roteiro com setas no cabecalho (#39)
diff --git a/src/components/map/panel/RoteiroPanelHeader.tsx b/src/components/map/panel/RoteiroPanelHeader.tsx
index d77c1da..42d5a98 100644
--- a/src/components/map/panel/RoteiroPanelHeader.tsx
+++ b/src/components/map/panel/RoteiroPanelHeader.tsx
@@ -29,9 +29,26 @@ interface Props {
   onToggleDetails: () => void;
   stopsCount?: number;
   onResetRoute?: () => void;
+  /** StopStepper ‹ › over the firmed stops (TASK-RF-044, RF-58); hidden unless both exist. */
+  onPrevStop?: () => void;
+  onNextStop?: () => void;
+  /** Arrows shown but disabled: a single firmed stop has nowhere to go. */
+  stepDisabled?: boolean;
 }
 
-export const RoteiroPanelHeader = ({ progress, modeLabel, statusHint = null, graphStatus = null, detailsOpen, onToggleDetails, stopsCount = 0, onResetRoute }: Props) => {
+export const RoteiroPanelHeader = ({
+  progress,
+  modeLabel,
+  statusHint = null,
+  graphStatus = null,
+  detailsOpen,
+  onToggleDetails,
+  stopsCount = 0,
+  onResetRoute,
+  onPrevStop,
+  onNextStop,
+  stepDisabled,
+}: Props) => {
   const [resetDialogOpen, setResetDialogOpen] = useState(false);
   const showReset = stopsCount > 0 && onResetRoute !== undefined;
 
@@ -41,6 +58,9 @@ export const RoteiroPanelHeader = ({ progress, modeLabel, statusHint = null, gra
       <PanelModeBar
         modeLabel={modeLabel}
         progress={progress}
+        onPrevStop={onPrevStop}
+        onNextStop={onNextStop}
+        stepDisabled={stepDisabled}
         actions={
           <>
             {showReset && (
# 5f09d19 · feat(TASK-RF-044): navegar entre as paradas do Meu roteiro com setas no cabecalho (#39)
diff --git a/src/pages/MapPage.tsx b/src/pages/MapPage.tsx
index f5b38a0..47a7174 100644
--- a/src/pages/MapPage.tsx
+++ b/src/pages/MapPage.tsx
@@ -53,7 +53,7 @@ import { getRoteiro, saveRoteiro, deleteRoteiro } from "../services/routeStorage
 import { createRouteExportPayload, downloadRouteJson } from "../services/routeExport";
 import { routeProgress, nextStopSuggestion, suggestedNextSeed } from "../utils/routing/overview";
 import { stopWalkEstimate, plannedRouteTotals, stopLegs } from "../utils/routing/estimates";
-import { assignedPointIds, pointsWithinRadius } from "../utils/routing/selectors";
+import { adjacentStopId, assignedPointIds, pointsWithinRadius } from "../utils/routing/selectors";
 import { indexPointsById, nearestStopTo } from "../utils/routing/selectors";
 import { suggestVehicleStop, defaultVehicleStop } from "../utils/routing/vehicleStop";
 import { streetNameOf } from "../utils/routing/streets";
@@ -509,6 +509,15 @@ function MapScreen({ rows, manifestId, routeName, manifestMeta }: { rows: RowDat
     setPanelSnap("collapsed");
   };
 
+  /** Header StopStepper ‹ › (TASK-RF-044, RF-58): the neighbouring firmed stop,
+      circular (the roteiro is viewed, not executed — execution won't wrap), shown
+      exactly as "Ver no mapa" shows it. One stop → arrows disabled; none → hidden. */
+  const handleStepRoteiroStop = (direction: 1 | -1) => {
+    const nextId = adjacentStopId(builderState.stops, selectedStopId, direction);
+    if (nextId !== null) handleShowRoteiroStopOnMap(nextId);
+  };
+  const roteiroStepper = builderState.stops.length > 0 ? { onPrevStop: () => handleStepRoteiroStop(-1), onNextStop: () => handleStepRoteiroStop(1), stepDisabled: builderState.stops.length < 2 } : {};
+
   /** Suggestion card's map icon (RF-006.11): selects the SEED on the map — the
       tela 8 preview (radius, incorporation) opens exactly as a manual tap would. */
   const handleShowSuggestedOnMap = () => {
@@ -1484,6 +1493,7 @@ function MapScreen({ rows, manifestId, routeName, manifestMeta }: { rows: RowDat
                   onToggleDetails={handleHideOverview}
                   stopsCount={builderState.stops.length}
                   onResetRoute={handleResetRoute}
+                  {...roteiroStepper}
                 />
               </div>
             ) : startSelected && overviewStart ? (
@@ -1497,6 +1507,7 @@ function MapScreen({ rows, manifestId, routeName, manifestMeta }: { rows: RowDat
                   onToggleDetails={handleShowOverview}
                   stopsCount={builderState.stops.length}
                   onResetRoute={handleResetRoute}
+                  {...roteiroStepper}
                 />
                 <PanelSection label={UI_LABELS.MAP_PANEL.ROTEIRO_OVERVIEW.SECTION_START}>
                   <StartRow start={overviewStart} onDelete={handleDeleteStart} onReposition={handleRepositionStart} />
@@ -1514,6 +1525,7 @@ function MapScreen({ rows, manifestId, routeName, manifestMeta }: { rows: RowDat
                   onToggleDetails={handleShowOverview}
                   stopsCount={builderState.stops.length}
                   onResetRoute={handleResetRoute}
+                  {...roteiroStepper}
                 />
                 <RoteiroStopSection
                   stopOrder={selectedStop.order}
@@ -1546,6 +1558,7 @@ function MapScreen({ rows, manifestId, routeName, manifestMeta }: { rows: RowDat
                   onToggleDetails={handleShowOverview}
                   stopsCount={builderState.stops.length}
                   onResetRoute={handleResetRoute}
+                  {...roteiroStepper}
                 />
                 <RoteiroPointSection
                   key={selectedPointItem.addressKey} // key-reset: the select re-anchors per point
@@ -1581,6 +1594,7 @@ function MapScreen({ rows, manifestId, routeName, manifestMeta }: { rows: RowDat
                   onToggleDetails={handleShowOverview}
                   stopsCount={builderState.stops.length}
                   onResetRoute={handleResetRoute}
+                  {...roteiroStepper}
                 />
                 {/* The definition FLOW only (RF-006.11): the settled "Início
                     definido | Redefinir" row left the idle header — the start
# 5f09d19 · feat(TASK-RF-044): navegar entre as paradas do Meu roteiro com setas no cabecalho (#39)
diff --git a/src/utils/routing/selectors.ts b/src/utils/routing/selectors.ts
index 091a138..28b97da 100644
--- a/src/utils/routing/selectors.ts
+++ b/src/utils/routing/selectors.ts
@@ -66,6 +66,21 @@ export const nearestStopTo = (point: LatLng, stops: RouteStop[]): RouteStop | nu
   return best;
 };
 
+/**
+ * Id of the previous/next FIRMED stop from `currentId`, CIRCULAR over `order`
+ * (the Meu roteiro StopStepper ‹ › — TASK-RF-044, RF-58). Mirrors the Original's
+ * `adjacentStopKey`. Sorts by `order`, never by array position: a reorder
+ * (RF-006.17) renumbers `order` without sorting the array. Null/unknown
+ * `currentId` → the first stop; empty list → null.
+ */
+export const adjacentStopId = (stops: RouteStop[], currentId: string | null, direction: 1 | -1): string | null => {
+  const order = [...stops].sort((a, b) => a.order - b.order).map((s) => s.id);
+  if (order.length === 0) return null;
+  const position = currentId !== null ? order.indexOf(currentId) : -1;
+  if (position < 0) return order[0];
+  return order[(position + direction + order.length) % order.length];
+};
+
 /**
  * Geographic centroid (mean) of a stop's points. Useful as a fallback position
  * for the stop marker (the vehicle stop is a separate, own marker).
# 5f09d19 · feat(TASK-RF-044): navegar entre as paradas do Meu roteiro com setas no cabecalho (#39)
diff --git a/docs-mentor/requisitos/requisitos.json b/docs-mentor/requisitos/requisitos.json
index 88fc82f..c2a2cda 100644
--- a/docs-mentor/requisitos/requisitos.json
+++ b/docs-mentor/requisitos/requisitos.json
@@ -715,12 +715,14 @@
     "enunciado": "Navegar entre paradas firmadas do Meu roteiro com avancar/retroceder ciclico no cabecalho do painel",
     "historia": null,
     "prioridade": "importante",
-    "status": "pendente",
+    "status": "implementado",
     "criterios_aceite": [],
-    "tarefas": [],
+    "tarefas": [
+      "TASK-RF-044"
+    ],
     "adr": null,
     "criado_em": "12/09/26 21:20",
-    "implementado_em": null,
+    "implementado_em": "13/09/26 21:53",
     "pendente_de_validacao": false
   },
   {
```

### TASK-BG-022 · Veiculo estacionava longe do pino: exportacao do experimento marcava ancoras otimizadas como escolha do usuario e a regra padrao preferia a rua do endereco a ate 250 m

`BG` · cerimonia Standard · esforco P/P · origem: titulo-autossuficiente

**Criterios de aceite, e o teste que cada um nomeia:**

- exportacao sem opcao: toda parada com vehicleStopIsDefault true, veiculo no primeiro pino da parada e nome do roteiro sem o aviso de ancoras do experimento
  → teste: `__utilidades-back-office__/auto-roteirizacao/experimentArtifacts.test.ts > exporta com as ancoras padrao do app sem a chave`
- exportacao com anchorPolicy experiment: ancoras otimizadas, vehicleStopIsDefault false e ANCORAS DO EXPERIMENTO no nome
  → teste: `__utilidades-back-office__/auto-roteirizacao/experimentArtifacts.test.ts > so a chave explicita exporta as ancoras do experimento`
- o validador recusa roteiro que mistura paradas padrao e paradas com ancora do experimento
  → teste: `__utilidades-back-office__/auto-roteirizacao/experimentArtifacts.test.ts > recusa politica de ancoras misturada`
- a parada padrao fica na via nomeada mais proxima do pino quando a rua do endereco esta longe (caso P3 da L-30: ~200 m contra ~33 m)
  → teste: `src/__tests__/utils/routing/vehicleStop.test.ts > rua do endereço longe do pino perde para a via nomeada em frente ao pino`
- a rua do endereco perde quando passa da folga de desempate (caso P4 da L-30: ~47 m contra ~15 m)
  → teste: `src/__tests__/utils/routing/vehicleStop.test.ts > rua do endereço além da folga de desempate perde para a nomeada mais próxima`
- na esquina, a rua do endereco dentro da folga de desempate vence a transversal um pouco mais perto
  → teste: `src/__tests__/utils/routing/vehicleStop.test.ts > na esquina, a rua do endereço dentro da folga vence a transversal`
- no app (preview), o roteiro L-30 DEMO e o JSON regerado do experimento mostram o veiculo na via em frente ao pino de cada parada padrao, inclusive depois que a malha carrega e ao editar a parada
  → teste: `nao se aplica: depende da malha OSM ao vivo e da tela; validacao manual do humano no preview, com o JSON regerado da ultima rodada`

**Declarou mudar:**

- __utilidades-back-office__/auto-roteirizacao/experimentArtifacts.ts - anchorPolicy na exportacao: app-default (padrao) sai com vehicleStopIsDefault true e o veiculo no primeiro pino da parada, e o app o poe em frente ao pino quando a malha carrega; experiment so por opcao explicita, com as ancoras otimizadas e o nome do roteiro avisando; o validador aceita as duas politicas, nunca mistura
- __utilidades-back-office__/auto-roteirizacao/experimentArtifacts.test.ts - teste de caracterizacao da exportacao padrao e da opcao do experimento
- __utilidades-back-office__/auto-roteirizacao/fundamental.arnes.ts - a chave FUNDAMENTAL_ANCORAS_DO_EXPERIMENTO=1 liga a politica experiment; sem ela, app-default
- __utilidades-back-office__/auto-roteirizacao/README.md - a chave e o que ela muda
- docs-mentor/invariantes.json - INV-001: artefato de laboratorio que chega ao app sai com o comportamento padrao; o do teste so com chave explicita, desligada por padrao e marcada no nome
- src/utils/routing/vehicleStop.ts - defaultVehicleStop passa a usar a via nomeada mais proxima do pino; a rua do endereco so vence se estiver ate ADDRESS_STREET_TIE_METERS (10 m, MANUAL KNOB) mais longe que ela; via sem nome so quando nao ha nomeada; sem grafo, o proprio ponto. Sai o teto de 250 m da BG-016
- src/__tests__/utils/routing/vehicleStop.test.ts - ajusta a descricao da BG-016 e prende a regra nova: rua do endereco a ~200 m perde para a nomeada a ~33 m (P3 da L-30), a ~47 m perde para a de ~15 m (P4), e na esquina a rua do endereco dentro da folga vence
- src/utils/routing/match.ts - so o comentario de nearestEdgeByTiers, que descrevia a regra antiga
- src/pages/MapPage.tsx - so o comentario da reancoragem ao carregar a malha, que descrevia a regra antiga
- src/utils/routing/builder.ts - so o comentario de REPROJECT_DEFAULT_ANCHORS, que descrevia a regra antiga

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| testes | APROVADO | 13/09/26 23:00 | 0 | — |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| build | APROVADO | — | 0 | — |
| validacao_manual | APROVADO | — | — | Humano validou no Samsung M35 pelo preview bg-022-ancoras-do-experiment.teste-prototipo.pages.dev (13/09/26 23:10), com print do roteiro L-30 DEMO no Meu roteiro depois de a malha carregar: P8 com o veiculo na Rua Redentor em frente ao pino (antes na Anibal de Mendonca, 86 m), P4 na Rua Barao da Torre (antes na Garcia d'Avila, 47 m), P3 na Rua Prudente de Morais (antes na Barao da Torre, 204 m); as demais paradas na via em frente ao pino. Declarou: consertado. |

**Riscos declarados:** conflito com a versao do laboratorio no ramo wip/spike-003 · JSON antigos em .mentor-saidas continuam com as ancoras do experimento; so os regerados saem no padrao · paradas padrao de roteiros ja salvos mudam de rua quando o pino esta mais perto de outra via; manual continua intocada · pino geocodificado errado passa a puxar o veiculo para a rua errada em vez da rua do endereco; o usuario arrasta a ancora

**O diff da tarefa:**

1 commit(s): `192b034` fix(TASK-BG-022): veiculo para na via nomeada em frente ao pino e o experimento exporta ancoras padrao (#40)

| arquivo | linhas | fora da revisao |
| :-- | --: | :-- |
| `__utilidades-back-office__/auto-roteirizacao/experimentArtifacts.test.ts` | 56 | — |
| `__utilidades-back-office__/auto-roteirizacao/experimentArtifacts.ts` | 41 | — |
| `__utilidades-back-office__/auto-roteirizacao/fundamental.arnes.ts` | 8 | — |
| `__utilidades-back-office__/auto-roteirizacao/README.md` | 12 | — |
| `docs-mentor/contexto.json` | 12 | vista gerada |
| `docs-mentor/invariantes.json` | 11 | — |
| `docs-mentor/rascunhos/2026-09-13--plano-enxuto-motor-de-rotas.md` | 98 | nota |
| `docs-mentor/rascunhos/regra-parada-do-veiculo-sem-busca-de-vagas.md` | 33 | nota |
| `docs-mentor/requisitos/implementados.md` | 1 | vista gerada |
| `docs-mentor/requisitos/requisitos.json` | 30 | — |
| `docs-mentor/tarefas/abertas/TASK-BG-022.json` | 44 | registro do mentor |
| `docs-mentor/tarefas/concluidas/0-indice.md` | 1 | registro do mentor |
| `docs-mentor/tarefas/concluidas/2026-09-13--23h20--TASK-BG-022.json` | 176 | registro do mentor |
| `docs-mentor/tarefas/concluidas/2026-09-13--23h20--TASK-BG-022.md` | 25 | registro do mentor |
| `docs-mentor/tarefas/recusas.jsonl` | 2 | registro do mentor |
| `docs-mentor/tarefas/reserva.md` | 1 | registro do mentor |
| `src/__tests__/utils/routing/vehicleStop.test.ts` | 60 | — |
| `src/pages/MapPage.tsx` | 3 | — |
| `src/utils/routing/builder.ts` | 4 | — |
| `src/utils/routing/match.ts` | 4 | — |
| `src/utils/routing/vehicleStop.ts` | 49 | — |

```diff
# 192b034 · fix(TASK-BG-022): veiculo para na via nomeada em frente ao pino e o experimento exporta ancoras padrao (#40)
diff --git a/__utilidades-back-office__/auto-roteirizacao/experimentArtifacts.test.ts b/__utilidades-back-office__/auto-roteirizacao/experimentArtifacts.test.ts
index bb1ff15..2d04b16 100644
--- a/__utilidades-back-office__/auto-roteirizacao/experimentArtifacts.test.ts
+++ b/__utilidades-back-office__/auto-roteirizacao/experimentArtifacts.test.ts
@@ -101,4 +101,60 @@ describe("fundamental experiment artifacts", () => {
     missingStop.route.stops = [];
     expect(validateExperimentalPayload(missingStop, sourcePoints)).toBe(false);
   });
+
+  // ------- Politica de ancoras (TASK-BG-022, INV-001) -------
+  // The optimizer's anchor must never reach the app as the user's choice unless the lab asks for it.
+
+  /** A solution whose anchors sit visibly away from the pins, like the midway parking seen in the app. */
+  const solutionWithMovedAnchors = () => {
+    const sourcePoints = points();
+    const solution = structuredClone(runFundamentalExperiment({ points: sourcePoints, graph }).variants[0].bestByObjective.vehicleDistance);
+    for (const group of solution.groups) group.anchor.position = { lat: group.anchor.position.lat + 0.0005, lng: group.anchor.position.lng };
+    return { sourcePoints, solution };
+  };
+  const baseInput = { runId: "run-policy", caseId: "case-policy", variant: "individual" as const, objective: "vehicleDistance" as const, sourceRows: rows };
+
+  it("exporta com as ancoras padrao do app sem a chave", () => {
+    const { sourcePoints, solution } = solutionWithMovedAnchors();
+    const payload = createExperimentalRoutePayload({ ...baseInput, sourcePoints, solution });
+
+    const byId = new Map(sourcePoints.map((p) => [p.id, p]));
+    for (const stop of payload.route.stops) {
+      const firstPin = byId.get(stop.pointIds[0])!;
+      expect(stop.vehicleStopIsDefault).toBe(true);
+      expect(stop.vehicleStop).toEqual({ lat: firstPin.lat, lng: firstPin.lng });
+    }
+    expect(payload.routeName).not.toContain("ANCORAS DO EXPERIMENTO");
+    expect(validateExperimentalPayload(payload, sourcePoints)).toBe(true);
+  });
+
+  it("so a chave explicita exporta as ancoras do experimento", () => {
+    const { sourcePoints, solution } = solutionWithMovedAnchors();
+    const payload = createExperimentalRoutePayload({ ...baseInput, sourcePoints, solution, anchorPolicy: "experiment" });
+
+    payload.route.stops.forEach((stop, index) => {
+      expect(stop.vehicleStopIsDefault).toBe(false);
+      expect(stop.vehicleStop).toEqual(solution.groups[index].anchor.position);
+    });
+    expect(payload.routeName).toContain("ANCORAS DO EXPERIMENTO");
+    expect(payload.manifestId).not.toBe(createExperimentalRoutePayload({ ...baseInput, sourcePoints, solution }).manifestId);
+    expect(validateExperimentalPayload(payload, sourcePoints)).toBe(true);
+  });
+
+  it("recusa politica de ancoras misturada", () => {
+    const { sourcePoints, solution } = solutionWithMovedAnchors();
+    const padrao = createExperimentalRoutePayload({ ...baseInput, sourcePoints, solution });
+    const experimento = createExperimentalRoutePayload({ ...baseInput, sourcePoints, solution, anchorPolicy: "experiment" });
+    expect(padrao.route.stops.length).toBeGreaterThanOrEqual(2); // individual: one stop per address
+
+    // One stop carrying the optimizer's anchor inside a default route.
+    const misturado = structuredClone(padrao);
+    misturado.route.stops[0].vehicleStopIsDefault = false;
+    expect(validateExperimentalPayload(misturado, sourcePoints)).toBe(false);
+
+    // Experiment anchors without the name telling the human so.
+    const semAviso = structuredClone(experimento);
+    semAviso.routeName = padrao.routeName;
+    expect(validateExperimentalPayload(semAviso, sourcePoints)).toBe(false);
+  });
 });
# 192b034 · fix(TASK-BG-022): veiculo para na via nomeada em frente ao pino e o experimento exporta ancoras padrao (#40)
diff --git a/src/__tests__/utils/routing/vehicleStop.test.ts b/src/__tests__/utils/routing/vehicleStop.test.ts
index 0865a95..7bdd6a1 100644
--- a/src/__tests__/utils/routing/vehicleStop.test.ts
+++ b/src/__tests__/utils/routing/vehicleStop.test.ts
@@ -67,19 +67,14 @@ describe("suggestVehicleStop", () => {
   });
 });
 
-describe("defaultVehicleStop (TASK-BG-016 — a parada PADRÃO fica na rua do endereço)", () => {
-  it("prefere a via cujo nome casa com o logradouro, ignorando a service mais próxima", () => {
+describe("defaultVehicleStop (TASK-BG-016, TASK-BG-022 — a parada PADRÃO fica na via nomeada em frente ao pino)", () => {
+  it("ignora a via de serviço mais próxima e fica na avenida nomeada", () => {
     const anchor = defaultVehicleStop(condoGraph, BUILDING, "Avenida Epitácio Pessoa");
     expect(anchor.lat).toBeCloseTo(AVENUE_LAT, 6); // a avenida, não a interna do condomínio
     expect(anchor.lng).toBeCloseTo(BUILDING.lng, 5);
   });
 
-  it("casa o logradouro por nome normalizado (abreviação do romaneio)", () => {
-    expect(defaultVehicleStop(condoGraph, BUILDING, "Av. Epitacio Pessoa").lat).toBeCloseTo(AVENUE_LAT, 6);
-  });
-
   it("sem casar o nome, evita a via de serviço e usa a via nomeada mais próxima", () => {
-    // Logradouro que não existe na malha: cai no nível (b) — nomeada não-service.
     expect(defaultVehicleStop(condoGraph, BUILDING, "Rua Que Não Existe Na Malha").lat).toBeCloseTo(AVENUE_LAT, 6);
   });
 
@@ -92,26 +87,49 @@ describe("defaultVehicleStop (TASK-BG-016 — a parada PADRÃO fica na rua do en
     expect(defaultVehicleStop(onlyService, BUILDING, "Avenida Epitácio Pessoa").lat).toBeCloseTo(SERVICE_LAT, 6);
   });
 
-  it("rua de mesmo nome longe demais não puxa a âncora (geocódigo ruim) — usa a nomeada perto", () => {
-    /** A "Epitácio Pessoa" a ~330 m; uma rua nomeada qualquer a ~44 m. */
-    const farAvenue = way(
-      [5, 6],
+  /** Rua horizontal na latitude dada, cobrindo a longitude do pino. */
+  const street = (id: number, lat: number, name: string): OsmElement =>
+    way(
+      [id, id + 1],
       [
-        { lat: -22.983, lon: -43.201 },
-        { lat: -22.983, lon: -43.199 },
+        { lat, lon: -43.201 },
+        { lat, lon: -43.199 },
       ],
-      { highway: "primary", name: "Avenida Epitácio Pessoa" }
+      { highway: "residential", name }
     );
-    const nearStreet = way(
-      [7, 8],
+
+  // TASK-BG-022, parada P3 do roteiro L-30: o pino fica a ~33 m de uma rua e a
+  // ~200 m da rua do endereço. O carro parava lá longe, a meio caminho da próxima.
+  it("rua do endereço longe do pino perde para a via nomeada em frente ao pino", () => {
+    const FRONT_LAT = -22.9801; // ~33 m ao norte do pino
+    const graph = buildGraph([street(10, FRONT_LAT, "Rua Prudente de Morais"), street(20, -22.9822, "Rua Barão da Torre"), CONDO_SERVICE]);
+    expect(defaultVehicleStop(graph, BUILDING, "Rua Barão da Torre").lat).toBeCloseTo(FRONT_LAT, 6);
+  });
+
+  // TASK-BG-022, parada P4 do roteiro L-30: ~47 m contra ~15 m passa da folga.
+  it("rua do endereço além da folga de desempate perde para a nomeada mais próxima", () => {
+    const FRONT_LAT = -22.98026; // ~15 m ao norte do pino
+    const graph = buildGraph([street(10, FRONT_LAT, "Rua Barão da Torre"), street(20, -22.98082, "Rua Garcia d'Ávila")]);
+    expect(defaultVehicleStop(graph, BUILDING, "Rua Garcia d'Ávila").lat).toBeCloseTo(FRONT_LAT, 6);
+  });
+
+  it("na esquina, a rua do endereço dentro da folga vence a transversal", () => {
+    const ADDRESS_LAT = -22.98055; // ~17 m ao sul do pino
+    /** Transversal a ~10 m a oeste: mais perto, mas por menos que a folga. */
+    const crossStreet = way(
+      [30, 31],
       [
-        { lat: AVENUE_LAT, lon: -43.201 },
-        { lat: AVENUE_LAT, lon: -43.199 },
+        { lat: -22.981, lon: -43.2001 },
+        { lat: -22.98, lon: -43.2001 },
       ],
-      { highway: "residential", name: "Rua Perto" }
+      { highway: "residential", name: "Rua Farme de Amoedo" }
     );
-    const graph = buildGraph([farAvenue, nearStreet, CONDO_SERVICE]);
-    expect(defaultVehicleStop(graph, BUILDING, "Avenida Epitácio Pessoa").lat).toBeCloseTo(AVENUE_LAT, 6);
+    const graph = buildGraph([street(10, ADDRESS_LAT, "Rua Visconde de Pirajá"), crossStreet]);
+    expect(defaultVehicleStop(graph, BUILDING, "Rua Visconde de Pirajá").lat).toBeCloseTo(ADDRESS_LAT, 6);
+    // o nome casa normalizado (abreviação do romaneio)
+    expect(defaultVehicleStop(graph, BUILDING, "R. Visconde de Piraja").lat).toBeCloseTo(ADDRESS_LAT, 6);
+    // sem a rua do endereço na malha, fica a transversal mais próxima
+    expect(defaultVehicleStop(graph, BUILDING, "Rua Qualquer").lng).toBeCloseTo(-43.2001, 6);
   });
 
   it("sem grafo devolve o próprio ponto, como hoje (app offline não trava)", () => {
# 192b034 · fix(TASK-BG-022): veiculo para na via nomeada em frente ao pino e o experimento exporta ancoras padrao (#40)
diff --git a/src/pages/MapPage.tsx b/src/pages/MapPage.tsx
index 47a7174..3f097f4 100644
--- a/src/pages/MapPage.tsx
+++ b/src/pages/MapPage.tsx
@@ -745,7 +745,8 @@ function MapScreen({ rows, manifestId, routeName, manifestMeta }: { rows: RowDat
 
   /**
    * O mesmo, para as paradas JÁ FIRMADAS (TASK-BG-016): quando o grafo chega,
-   * toda parada ainda no padrão é reancorada na rua do endereço. Sem isto, um
+   * toda parada ainda no padrão é reancorada pela regra atual (TASK-BG-022: via
+   * nomeada em frente ao pino). Sem isto, um
    * roteiro salvo (ou importado de um export antigo) ficaria para sempre com a
    * âncora na via interna do condomínio, porque a regra do padrão mudou depois
    * de ele ter sido criado. Decisão do humano em 11/09: corrigir da raiz, já que
# 192b034 · fix(TASK-BG-022): veiculo para na via nomeada em frente ao pino e o experimento exporta ancoras padrao (#40)
diff --git a/src/utils/routing/builder.ts b/src/utils/routing/builder.ts
index 54fd214..5de9afc 100644
--- a/src/utils/routing/builder.ts
+++ b/src/utils/routing/builder.ts
@@ -267,8 +267,8 @@ export const routeBuilderReducer = (state: RouteBuilderState, action: RouteBuild
     /**
      * Reancora as paradas ainda no PADRÃO nas posições recalculadas (TASK-BG-016).
      *
-     * Nasceu porque a regra do padrão mudou (a parada vai para a rua do endereço,
-     * não para a via interna do condomínio) e roteiro já salvo — inclusive
+     * Nasceu porque a regra do padrão mudou (a parada vai para a via nomeada em
+     * frente ao pino, não para a via interna do condomínio) e roteiro já salvo — inclusive
      * importado de um export antigo — ficaria com a âncora velha para sempre.
      * O reducer segue puro: quem tem o grafo calcula as posições e passa prontas,
      * como em RESET_VEHICLE_STOP.
# 192b034 · fix(TASK-BG-022): veiculo para na via nomeada em frente ao pino e o experimento exporta ancoras padrao (#40)
diff --git a/src/utils/routing/match.ts b/src/utils/routing/match.ts
index 3dabb9a..1a0dd01 100644
--- a/src/utils/routing/match.ts
+++ b/src/utils/routing/match.ts
@@ -88,8 +88,8 @@ export type EdgeTier = (edge: Edge, distance: number) => boolean;
 /**
  * Melhor projeção por NÍVEL de preferência, em UMA varredura do grafo
  * (TASK-BG-016). Existe porque escolher a parada padrão do veículo é uma
- * pergunta em camadas — "a rua do endereço, senão uma rua nomeada, senão
- * qualquer asfalto" — e responder cada camada com sua própria varredura
+ * pergunta em camadas — "a rua nomeada mais próxima, a do endereço se empatar,
+ * senão qualquer asfalto" — e responder cada camada com sua própria varredura
  * multiplicaria um laço que já é O(arestas) e roda por parada.
  *
  * @param graph - O grafo de ruas.
# 192b034 · fix(TASK-BG-022): veiculo para na via nomeada em frente ao pino e o experimento exporta ancoras padrao (#40)
diff --git a/src/utils/routing/vehicleStop.ts b/src/utils/routing/vehicleStop.ts
index b59a0a6..bbd7060 100644
--- a/src/utils/routing/vehicleStop.ts
+++ b/src/utils/routing/vehicleStop.ts
@@ -31,29 +31,33 @@ export const suggestVehicleStop = (graph: RoadGraph | null, point: LatLng): LatL
 };
 
 /**
- * ⚙️ MANUAL KNOB — até onde a rua do próprio endereço ainda vale como âncora.
- * Além disso, um logradouro de mesmo nome é outro trecho da cidade (ou o
- * geocódigo do romaneio está errado), e projetar lá seria pior que usar a rua
- * nomeada mais próxima. Generoso de propósito: condomínio fechado com recuo
- * grande ainda cabe.
+ * ⚙️ MANUAL KNOB — quanto a rua do próprio endereço pode estar MAIS LONGE do
+ * pino que a via nomeada mais próxima e ainda ficar com a âncora. Existe para a
+ * esquina: o pino cai entre a rua do endereço e a transversal, e a diferença é
+ * de poucos metros. Acima disso o pino manda — o carro para em frente a ele
+ * (TASK-BG-022: com um teto de 250 m, o carro ia para a rua do endereço a meio
+ * caminho da parada seguinte).
  */
-const STREET_NAME_MATCH_MAX_METERS = 250;
+const ADDRESS_STREET_TIE_METERS = 10;
 
 /**
- * A parada PADRÃO do veículo para um endereço (TASK-BG-016).
+ * A parada PADRÃO do veículo para um endereço (TASK-BG-016, TASK-BG-022).
  *
  * Diferente de `suggestVehicleStop`, que projeta no asfalto mais próximo e
  * serve ao ARRASTO manual (ali a posição é escolha do usuário), esta responde
- * "onde o carro para para entregar NESTE endereço" — e a resposta é a rua do
- * endereço. O asfalto mais próximo não serve: para um prédio recuado, ele é a
- * via interna do condomínio (`highway=service`, quase sempre sem `name` no
- * OSM), que não é endereço de ninguém e fazia o carro parar dentro do lote.
+ * "onde o carro para para entregar NESTE endereço" — e a resposta é a via
+ * nomeada em frente ao pino. O asfalto mais próximo não serve: para um prédio
+ * recuado, ele é a via interna do condomínio (`highway=service`, quase sempre
+ * sem `name` no OSM), que não é endereço de ninguém e fazia o carro parar
+ * dentro do lote. É o critério dos "routable points" dos provedores de
+ * geocodificação: o segmento viário mais próximo, filtrado por classe de via.
  *
- * Três níveis, resolvidos em UMA varredura (`nearestEdgeByTiers`):
- * 1. a via cujo nome casa com o logradouro, dentro de `STREET_NAME_MATCH_MAX_METERS`;
- * 2. senão, a via NOMEADA mais próxima (nome de verdade ⇒ não é acesso interno);
- * 3. senão, a aresta mais próxima — o comportamento antigo, para o caso em que
- *    só existe via de serviço por perto (galpão, condomínio industrial).
+ * Resolvida em UMA varredura (`nearestEdgeByTiers`):
+ * 1. a via NOMEADA mais próxima (nome de verdade ⇒ não é acesso interno);
+ * 2. a rua do logradouro fica com a âncora só se estiver até
+ *    `ADDRESS_STREET_TIE_METERS` mais longe que ela (desempate de esquina);
+ * 3. sem via nomeada, a aresta mais próxima — o comportamento antigo, para o
+ *    caso em que só existe via de serviço por perto (galpão, condomínio industrial).
  *
  * @param graph - O grafo de ruas, ou `null` enquanto indisponível (carregando/offline).
  * @param point - A coordenada do endereço.
@@ -65,15 +69,12 @@ export const defaultVehicleStop = (graph: RoadGraph | null, point: LatLng, addre
 
   // `isSameStreetName` responde `true` quando um dos lados é vazio (é o certo
   // para ROTULAR, não para DECIDIR): sem esta guarda, endereço sem logradouro
-  // casaria com a primeira via de serviço e o nível 1 viraria o bug de novo.
+  // casaria com qualquer via e ganharia o desempate sem ter nome para isso.
   const street = normalizeStreetName(addressStreet) ? addressStreet : "";
-  const tiers: EdgeTier[] = [
-    (edge, distance) => street !== "" && distance <= STREET_NAME_MATCH_MAX_METERS && hasRealStreetName(edge) && isSameStreetName(street, edge.wayName),
-    (edge) => hasRealStreetName(edge),
-    () => true,
-  ];
-  const [byName, namedStreet, anyEdge] = nearestEdgeByTiers(graph, point, tiers);
-  const match = byName ?? namedStreet ?? anyEdge;
+  const tiers: EdgeTier[] = [(edge) => street !== "" && hasRealStreetName(edge) && isSameStreetName(street, edge.wayName), (edge) => hasRealStreetName(edge), () => true];
+  const [addressStreetMatch, namedStreet, anyEdge] = nearestEdgeByTiers(graph, point, tiers);
+  const tieWon = addressStreetMatch && namedStreet && addressStreetMatch.distance <= namedStreet.distance + ADDRESS_STREET_TIE_METERS;
+  const match = (tieWon ? addressStreetMatch : namedStreet) ?? anyEdge;
   return match ? match.point : { lat: point.lat, lng: point.lng };
 };
# 192b034 · fix(TASK-BG-022): veiculo para na via nomeada em frente ao pino e o experimento exporta ancoras padrao (#40)
diff --git a/__utilidades-back-office__/auto-roteirizacao/experimentArtifacts.ts b/__utilidades-back-office__/auto-roteirizacao/experimentArtifacts.ts
index f12f417..bc883bb 100644
--- a/__utilidades-back-office__/auto-roteirizacao/experimentArtifacts.ts
+++ b/__utilidades-back-office__/auto-roteirizacao/experimentArtifacts.ts
@@ -18,8 +18,26 @@ export interface ExperimentalArtifactInput {
   sourceRows: readonly RowData[];
   solution: FundamentalSolution;
   config?: Partial<FundamentalExperimentConfig>;
+  /** Where each stop's vehicle goes in the exported route. Defaults to "app-default" (INV-001). */
+  anchorPolicy?: AnchorPolicy;
 }
 
+/**
+ * Where the exported stops park the vehicle (TASK-BG-022, INV-001).
+ *
+ * - `app-default` (the default): each stop is flagged as the app's default anchor and starts on its
+ *   first pin; the app moves it onto the street in front of that pin once the road graph loads.
+ * - `experiment`: the optimizer's anchors, flagged as a manual choice so the app keeps them. Only on
+ *   explicit request (harness key `FUNDAMENTAL_ANCORAS_DO_EXPERIMENTO=1`), and the route name says so.
+ *
+ * ⚠️ Until BG-022 every export used the experiment's anchors flagged as the user's choice: imported
+ * into the app, they parked the vehicle halfway to the next stop and survived even stop edits.
+ */
+export type AnchorPolicy = "app-default" | "experiment";
+
+/** Route-name marker of experiment anchors: whoever imports the file sees it before trusting a stop. */
+export const EXPERIMENT_ANCHORS_MARKER = "ANCORAS DO EXPERIMENTO";
+
 const compare = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
 const safeJson = (value: unknown): string => (JSON.stringify(value) ?? "null").replaceAll("<", "\\u003c");
 const pointPackageKeys = (points: readonly DeliveryPoint[]): string[] => points.flatMap((point) => point.packages.map((pkg) => JSON.stringify([point.id, pkg.id, point.lat, point.lng]))).sort(compare);
@@ -29,9 +47,19 @@ export const createExperimentalRoutePayload = (input: ExperimentalArtifactInput)
   const config = { ...DEFAULT_ROUTING_CONFIG, ...(input.config ?? {}) };
   const searchRadiusMeters = input.config?.searchRadiusMeters ?? DEFAULT_ROUTING_CONFIG.autoRadiusMeters;
   const circuitLimitMeters = input.config?.circuitLimitMeters ?? 120;
-  const identity = hash(JSON.stringify(["auto-fundamentals", input.runId, input.caseId, input.variant, input.objective, searchRadiusMeters, circuitLimitMeters, config, input.solution.signature]));
+  const anchorPolicy: AnchorPolicy = input.anchorPolicy ?? "app-default";
+  const identity = hash(
+    JSON.stringify(["auto-fundamentals", input.runId, input.caseId, input.variant, input.objective, searchRadiusMeters, circuitLimitMeters, config, input.solution.signature, anchorPolicy])
+  );
   const manifestId = `auto-fundamentals-${identity}`;
-  const routeName = `EXPERIMENTO | ${input.caseId} | ${input.variant} | ${input.objective} | PROCURA ${searchRadiusMeters}m | CIRCUITO ${circuitLimitMeters}m | ${input.solution.status}`;
+  const policyLabel = anchorPolicy === "experiment" ? ` | ${EXPERIMENT_ANCHORS_MARKER}` : "";
+  const routeName = `EXPERIMENTO${policyLabel} | ${input.caseId} | ${input.variant} | ${input.objective} | PROCURA ${searchRadiusMeters}m | CIRCUITO ${circuitLimitMeters}m | ${input.solution.status}`;
+  const pointsById = new Map(input.sourcePoints.map((point) => [point.id, point]));
+  /** app-default: the first pin, which the app reprojects onto its street; experiment: the optimizer's spot. */
+  const vehicleStopOf = (group: FundamentalSolution["groups"][number]) => {
+    const firstPin = pointsById.get(group.orderedPointIds[0] ?? "");
+    return anchorPolicy === "app-default" && firstPin ? { lat: firstPin.lat, lng: firstPin.lng } : { ...group.anchor.position };
+  };
   const route: PlannedRoute = {
     id: `${manifestId}-route`,
     startPoint: null,
@@ -47,11 +75,11 @@ export const createExperimentalRoutePayload = (input: ExperimentalArtifactInput)
     stops: input.solution.groups.map((group, index) => ({
       id: `${manifestId}-stop-${index + 1}`,
       order: index + 1,
-      vehicleStop: { ...group.anchor.position },
+      vehicleStop: vehicleStopOf(group),
       pointIds: group.orderedPointIds.slice(),
       radiusMeters: DEFAULT_ROUTING_CONFIG.autoRadiusMeters,
       reversed: false,
-      vehicleStopIsDefault: false,
+      vehicleStopIsDefault: anchorPolicy === "app-default",
     })),
   };
   return createRouteExportPayload(
@@ -77,7 +105,10 @@ export const validateExperimentalPayload = (payload: ReturnType<typeof createExp
   const known = new Set(sourcePoints.map((point) => point.id));
   const members = payload.route.stops.flatMap((stop) => stop.pointIds);
   if (new Set(members).size !== members.length || members.length !== known.size || members.some((id) => !known.has(id))) return false;
-  if (payload.route.stops.some((stop, index) => stop.order !== index + 1 || stop.radiusMeters === 120 || stop.vehicleStopIsDefault !== false)) return false;
+  if (payload.route.stops.some((stop, index) => stop.order !== index + 1 || stop.radiusMeters === 120)) return false;
+  // One anchor policy per route, and experiment anchors only with the name saying so (INV-001).
+  const experimentAnchors = payload.routeName.includes(EXPERIMENT_ANCHORS_MARKER);
+  if (payload.route.stops.some((stop) => stop.vehicleStopIsDefault !== !experimentAnchors)) return false;
   return true;
 };
# 192b034 · fix(TASK-BG-022): veiculo para na via nomeada em frente ao pino e o experimento exporta ancoras padrao (#40)
diff --git a/__utilidades-back-office__/auto-roteirizacao/fundamental.arnes.ts b/__utilidades-back-office__/auto-roteirizacao/fundamental.arnes.ts
index 705c952..4075e07 100644
--- a/__utilidades-back-office__/auto-roteirizacao/fundamental.arnes.ts
+++ b/__utilidades-back-office__/auto-roteirizacao/fundamental.arnes.ts
@@ -6,7 +6,7 @@ import "fake-indexeddb/auto";
 import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
 import type { FundamentalObjective, FundamentalSolution, FundamentalVariant } from "./fundamentalExperiment";
 import { DEFAULT_FUNDAMENTAL_EXPERIMENT_CONFIG, clearFundamentalExperimentCaches, runFundamentalExperiment } from "./fundamentalExperiment";
-import { createExperimentalRoutePayload, renderExperimentMapHtml, validateExperimentalPayload } from "./experimentArtifacts";
+import { createExperimentalRoutePayload, renderExperimentMapHtml, validateExperimentalPayload, type AnchorPolicy } from "./experimentArtifacts";
 import { evaluateCompleteWalking, evaluateLimitedFundamentalCircuit, evaluateVehicleOrder, MAX_CACHED_STREET_PATHS, type PathCollection } from "./experimentPaths";
 import { buildFundamentalReferences } from "./fundamentals";
 import { hash, loadCorpus, loadSnapshots, type CorpusCase } from "./corpus";
@@ -32,6 +32,8 @@ const snapshots = loadSnapshots(corpus);
 const runId = new Date().toISOString().replaceAll(/[:.]/g, "-");
 const outputDir = resolve(".mentor-saidas/auto-fundamentals", runId);
 const importableDir = join(outputDir, "importaveis");
+/** INV-001 / TASK-BG-022: the app never receives the optimizer anchors unless this key is on. */
+const ANCHOR_POLICY: AnchorPolicy = process.env.FUNDAMENTAL_ANCORAS_DO_EXPERIMENTO === "1" ? "experiment" : "app-default";
 const mapDir = join(outputDir, "mapas");
 const metrics: Record<string, unknown>[] = [];
 const details: Record<string, unknown>[] = [];
@@ -379,7 +381,7 @@ const verifyArtifact = async (
   objective: FundamentalObjective
 ): Promise<void> => {
   const config = { ...DEFAULT_FUNDAMENTAL_EXPERIMENT_CONFIG, searchRadiusMeters, circuitLimitMeters };
-  const payload = createExperimentalRoutePayload({ runId, caseId: entry.id, variant, objective, sourcePoints: entry.points, sourceRows: entry.rows, solution, config });
+  const payload = createExperimentalRoutePayload({ runId, caseId: entry.id, variant, objective, sourcePoints: entry.points, sourceRows: entry.rows, solution, config, anchorPolicy: ANCHOR_POLICY });
   check(validateExperimentalPayload(payload, entry.points), `${entry.id}: artifact conservation`);
   const serialized = JSON.stringify(payload);
   const parsed = parseAndValidateRouteJson(serialized);
@@ -395,7 +397,7 @@ const verifyArtifact = async (
   const state = routeBuilderReducer(createInitialBuilderState(buildDeliveryPoints(savedRows)), { type: "HYDRATE", route: saved });
   check(hash(JSON.stringify(state.stops)) === hash(JSON.stringify(payload.route.stops)), `${entry.id}: artifact hydration changed stops`);
   check(!importableFiles.some((file) => file.manifestId === payload.manifestId), `${entry.id}: unique artifact identity`);
-  const file = `${entry.id}-r${searchRadiusMeters}m-c${circuitLimitMeters}m-${variant}-${objective}.json`;
+  const file = `${entry.id}-r${searchRadiusMeters}m-c${circuitLimitMeters}m-${variant}-${objective}${ANCHOR_POLICY === "experiment" ? "-ancoras-do-experimento" : ""}.json`;
   writeFileSync(join(importableDir, file), serialized, { flag: "wx" });
   importableFiles.push({ caseId: entry.id, file, sha256: hash(serialized), searchRadiusMeters, circuitLimitMeters, variant, objective, manifestId: payload.manifestId, status: solution.status });
 };
# 192b034 · fix(TASK-BG-022): veiculo para na via nomeada em frente ao pino e o experimento exporta ancoras padrao (#40)
diff --git a/__utilidades-back-office__/auto-roteirizacao/README.md b/__utilidades-back-office__/auto-roteirizacao/README.md
index e7a68e7..8e72ff8 100644
--- a/__utilidades-back-office__/auto-roteirizacao/README.md
+++ b/__utilidades-back-office__/auto-roteirizacao/README.md
@@ -129,6 +129,18 @@ O spike usa o mesmo corpus e snapshots, mas roda separado da matriz histórica:
 npm run test:auto-fundamentals
 ```
 
+**Âncoras nos JSONs importáveis (INV-001, TASK-BG-022).** Por padrão, cada parada exportada sai
+com a âncora padrão do app: o veículo começa no primeiro pino, e o app o põe na via em frente ao
+pino quando a malha carrega. As âncoras escolhidas pelo experimento só saem com a chave explícita,
+e o arquivo e o nome do roteiro avisam (`-ancoras-do-experimento`, `ANCORAS DO EXPERIMENTO`):
+
+```powershell
+$env:FUNDAMENTAL_ANCORAS_DO_EXPERIMENTO = "1"; npm run test:auto-fundamentals
+```
+
+Importe esses arquivos no **preview** do app, nunca no app que guarda roteiros reais: o
+armazenamento do preview é separado.
+
 Cada execução cruza procura fundamental de 30/60 m com circuito limitado de 120 m e uma
 sensibilidade de 60 m. As variantes são `individual`, `fixed-groups` e `revisable`; cada uma
 é avaliada pelos objetivos independentes `vehicleDistance` e `modeledTime`, sem peso oculto.
# 192b034 · fix(TASK-BG-022): veiculo para na via nomeada em frente ao pino e o experimento exporta ancoras padrao (#40)
diff --git a/docs-mentor/invariantes.json b/docs-mentor/invariantes.json
index fe51488..2019f98 100644
--- a/docs-mentor/invariantes.json
+++ b/docs-mentor/invariantes.json
@@ -1 +1,10 @@
-[]
+[
+  {
+    "id": "INV-001",
+    "enunciado": "Artefato de laboratorio que chega ao app sai com o comportamento padrao do app; o comportamento do teste so com chave explicita, desligada por padrao e marcada no nome do artefato",
+    "porque": "Na validacao da TASK-RF-044, o JSON do experimento de auto-roteirizacao entrou no app com as ancoras otimizadas marcadas como escolha do usuario: o veiculo parava no meio do caminho ate a proxima parada e o padrao (em frente ao pino) nunca era reaplicado (TASK-BG-022)",
+    "mecanismo": "__utilidades-back-office__/auto-roteirizacao/experimentArtifacts.test.ts > exporta com as ancoras padrao do app sem a chave; > so a chave explicita exporta as ancoras do experimento; > recusa politica de ancoras misturada",
+    "declarada_em": "13/09/26",
+    "conferida_em": "13/09/26"
+  }
+]
# 192b034 · fix(TASK-BG-022): veiculo para na via nomeada em frente ao pino e o experimento exporta ancoras padrao (#40)
diff --git a/docs-mentor/requisitos/requisitos.json b/docs-mentor/requisitos/requisitos.json
index c2a2cda..59f502f 100644
--- a/docs-mentor/requisitos/requisitos.json
+++ b/docs-mentor/requisitos/requisitos.json
@@ -89,7 +89,8 @@
       "Dado o botao Auto-roteirizar, quando calcular, entao informa progresso e permite cancelar sem perder trabalho; resultado confirmado e editavel e persistente, inclusive a ancora livre do veiculo."
     ],
     "regras_aplicaveis": [
-      "RN-14"
+      "RN-14",
+      "RN-23"
     ],
     "requisitos_relacionados": [
       "RF-37"
@@ -738,5 +739,32 @@
     "criado_em": "12/09/26 21:20",
     "implementado_em": null,
     "pendente_de_validacao": false
+  },
+  {
+    "id": "RN-23",
+    "tipo": "RN",
+    "enunciado": "A parada padrao do veiculo fica na via em frente ao pino de cada endereco, por projecao geometrica; o planejamento considera possivel parar junto a qualquer endereco e nao procura vaga, permissao nem disponibilidade de estacionamento.",
+    "historia": "Como entregador, quero planejar paradas mesmo em regioes com muita restricao de estacionamento e ajusta-las a mao, sem o roteiro ser bloqueado por esse criterio.",
+    "prioridade": "essencial",
+    "status": "implementado",
+    "criterios_aceite": [
+      "A parada padrao de cada endereco e a projecao do pino na via nomeada mais proxima; na esquina, a rua do endereco desempata; a coordenada original da entrega nao muda.",
+      "Sinalizacao, proibicao de parada, vagas e areas de carga e descarga nao sao filtro, penalidade nem condicao para criar parada, inclusive as geradas pelo Auto-roteirizar e ao longo do percurso desenhado.",
+      "Gerar rotas nao consulta servico nem dado de estacionamento.",
+      "O usuario pode mover a parada do veiculo, e a posicao movida a mao nao e recalculada.",
+      "Mao unica, conversoes e continuidade do percurso continuam valendo: a regra trata de parar, nao de circular."
+    ],
+    "tarefas": [
+      "TASK-BG-016",
+      "TASK-BG-022"
+    ],
+    "adr": null,
+    "criado_em": "13/09/26 23:26",
+    "implementado_em": "13/09/26 23:26",
+    "pendente_de_validacao": false,
+    "requisitos_relacionados": [
+      "RF-34",
+      "RF-52"
+    ]
   }
 ]
```

### TASK-CHORE-022 · Atualizar mentor-agent para v0.10.0

`CHORE` · cerimonia Standard · esforco P/P · origem: titulo-autossuficiente

**Criterios de aceite, e o teste que cada um nomeia:**

- node mentor.mjs verificar aprova depois da atualizacao, inclusive o inventario do laboratorio (chave desligada e testes que resolvem)
  → teste: `nao se aplica: verificacao operacional via CLI; a saida fica registrada com task criterio`
- o doctor mostra o laboratorio declarado e nao acusa saida do laboratorio exposta ao git
  → teste: `nao se aplica: verificacao operacional via CLI; a saida fica registrada com task criterio`

**Pedido e alternativas (a solucao sugerida pelo humano e' hipotese):**

- pedido original: Humano, 14/09/26, respondendo a "Quer que eu comece essa tarefa de atualizacao do piloto?" (atualizar o pacote, declarar o laboratorio do piloto, limpar melhorias-do-pacote.md, fechar): "sim"
- solucao sugerida: nenhuma: o humano descreveu o problema

**Declarou mudar:**

- package.json - devDependency mentor-agent github:thiagoroddev/mentor-agent#v0.9.0 -> #v0.10.0
- package-lock.json - lock atualizado para mentor-agent 0.10.0
- .mentor/** - pacote reinstalado via npx mentor instalar --forcar (laboratorio.ts, processos/laboratorio.md, sugestao como hipotese)
- docs-mentor/contexto.json - versao_do_pacote 0.10.0 via resolver-gerados, e o bloco laboratorio: caminhos __utilidades-back-office__/**, saidas .mentor-saidas/**, a chave FUNDAMENTAL_ANCORAS_DO_EXPERIMENTO e o JSON importavel do experimento, os dois presos ao teste de contrato da TASK-BG-022
- docs-mentor/melhorias-do-pacote.md - sai a nota de 13/09/26 21:48, aplicada na 0.10.0

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| build | APROVADO | — | 0 | — |
| testes | APROVADO | dispensado (14/09/26 02:16) | 0 | Nao ha regra de negocio nem codigo de aplicacao (src/) alterado: e so a atualizacao da dependencia de processo mentor-agent e a declaracao do laboratorio no contexto. Sem codigo de producao para mutar, prova por mutacao nao se aplica; os testes existentes passam inalterados porque nada que eles cobrem mudou. |
| validacao_manual | não se aplica | — | — | Atualizacao mecanica de ferramenta de processo (mentor-agent) e declaracao do laboratorio no contexto, sem alteracao em src/; nenhum modulo de aplicacao ou UI tocado. Mesma operacao das TASK-CHORE-019 a 021. |

**Riscos declarados:** resolver-gerados pode reescrever blocos do contexto.json; conferir o diff contra o main antes de commitar · retomar a TASK-SPIKE-003 com o laboratorio declarado pode recusar o fechamento dela

**Achados que a propria tarefa registrou:**

- (classe 1) npm audit: esbuild 0.27.3 a 0.28.0 com vulnerabilidade baixa GHSA-g7r4-m6w7-qqqr (leitura arbitraria de arquivo pelo servidor de desenvolvimento no Windows); e o alerta Dependabot #1 do repositorio. Correcao disponivel via npm audit fix → tarefa: TASK-CHORE-023
- (classe 4) __utilidades-back-office__/auto-roteirizacao/corpus.ts (variantes de inspecao da RF-030, .mentor-saidas/auto-anchors/importaveis/) exporta vehicleStopIsDefault false para toda ancora que o gerador moveu, sem chave: o app trata como escolha do usuario e nunca reaplica o padrao. Contradiz a INV-001 (artefato de laboratorio sai com o comportamento padrao; o do teste so com chave explicita). O teste corpus.test.ts prende esse comportamento, por isso o artefato nao entrou em artefatos_importaveis → tarefa: TASK-BG-023

**O diff da tarefa:**

1 commit(s): `ff8d544` chore(TASK-CHORE-022): atualizar mentor-agent para v0.10.0 (#41)

| arquivo | linhas | fora da revisao |
| :-- | --: | :-- |
| `.mentor/esquemas/contexto.json` | 10 | pacote intacto |
| `.mentor/esquemas/tarefa.json` | 6 | pacote intacto |
| `.mentor/manifesto.json` | 30 | pacote intacto |
| `.mentor/nucleo.md` | 3 | pacote intacto |
| `.mentor/processos/laboratorio.md` | 51 | pacote intacto |
| `.mentor/processos/rascunho.md` | 4 | pacote intacto |
| `.mentor/processos/tarefa.md` | 15 | pacote intacto |
| `.mentor/scripts/cli.ts` | 1 | pacote intacto |
| `.mentor/scripts/cmd-auditar.ts` | 26 | pacote intacto |
| `.mentor/scripts/cmd-doctor.ts` | 18 | — |
| `.mentor/scripts/cmd-tarefa.ts` | 61 | pacote intacto |
| `.mentor/scripts/cmd-verificar.ts` | 4 | — |
| `.mentor/scripts/laboratorio.ts` | 128 | pacote intacto |
| `.mentor/scripts/tipos.ts` | 64 | pacote intacto |
| `.mentor/tetos.json` | 8 | pacote intacto |
| `docs-mentor/contexto.json` | 40 | vista gerada |
| `docs-mentor/contexto.md` | 7 | vista gerada |
| `docs-mentor/melhorias-do-pacote.md` | 4 | nota |
| `docs-mentor/tarefas/abertas/TASK-BG-023.json` | 44 | registro do mentor |
| `docs-mentor/tarefas/abertas/TASK-CHORE-023.json` | 44 | registro do mentor |
| `docs-mentor/tarefas/concluidas/0-indice.md` | 1 | registro do mentor |
| `docs-mentor/tarefas/concluidas/2026-09-14--02h42--TASK-CHORE-022.json` | 177 | registro do mentor |
| `docs-mentor/tarefas/concluidas/2026-09-14--02h42--TASK-CHORE-022.md` | 30 | registro do mentor |
| `docs-mentor/tarefas/reserva.md` | 2 | registro do mentor |
| `package-lock.json` | 6 | — |
| `package.json` | 2 | — |

```diff
# ff8d544 · chore(TASK-CHORE-022): atualizar mentor-agent para v0.10.0 (#41)
diff --git a/package.json b/package.json
index 5dd0fc9..4cb81d7 100644
--- a/package.json
+++ b/package.json
@@ -78,7 +78,7 @@
     "fast-xml-parser": "^5.3.2",
     "globals": "^16.5.0",
     "jsdom": "^27.3.0",
-    "mentor-agent": "github:thiagoroddev/mentor-agent#v0.9.0",
+    "mentor-agent": "github:thiagoroddev/mentor-agent#v0.10.0",
     "postcss": "^8.4.47",
     "prettier": "^3.6.2",
     "puppeteer": "^25.9.0",
# ff8d544 · chore(TASK-CHORE-022): atualizar mentor-agent para v0.10.0 (#41)
diff --git a/.mentor/scripts/cmd-doctor.ts b/.mentor/scripts/cmd-doctor.ts
index 652cfa4..48162b2 100644
--- a/.mentor/scripts/cmd-doctor.ts
+++ b/.mentor/scripts/cmd-doctor.ts
@@ -10,6 +10,7 @@ import {
   estadoDoPrazo, riscoVencido,
 } from './vistas.ts'
 import { CARACTERISTICAS } from './tipos.ts'
+import { chavesVencidas, laboratorioDe, saidasVersionadas } from './laboratorio.ts'
 import type { Caracteristica, Contexto, EstadoDaCaracteristica, Fase, MetaDeQualidade, Tarefa } from './tipos.ts'
 import { estadoDaCadencia, maioresArquivos } from './cmd-auditar.ts'
 
@@ -354,6 +355,23 @@ function processo(ctx: Contexto, tarefas: Tarefa[]): Linha[] {
       : { estado: 'ok', texto: `${rascunhos} rascunho(s) na fase "${fase}"` })
   }
 
+  // Laboratorio (0.10.0). A declaracao so' e' cobrada com spike viva: projeto sem experimento nao recebe ruido.
+  const lab = laboratorioDe(ctx)
+  const spikesVivas = tarefas.filter((t) => t.tipo === 'SPIKE' && viva(t))
+  if (lab.caminhos === null && spikesVivas.length) {
+    linhas.push({ estado: 'atencao', texto: `${spikesVivas.map((t) => t.id).join(', ')} viva(s) e contexto.laboratorio.caminhos nao declarado: o finalizar nao sabe o que do spike e produto (processos/laboratorio.md)` })
+  } else if (lab.caminhos?.length) {
+    linhas.push({ estado: 'neutro', texto: `laboratorio em ${lab.caminhos.join(', ')}: ${lab.chaves.length} chave(s), ${lab.artefatos_importaveis.length} artefato(s) importavel(is)` })
+  }
+  const vencidas = chavesVencidas(ctx)
+  if (vencidas.length) {
+    linhas.push({ estado: 'atencao', texto: `${vencidas.length} chave(s) de experimento vencida(s): ${vencidas.join(', ')}. Remova a chave, ou renove a data dizendo por que` })
+  }
+  const versionadas = saidasVersionadas(ctx, raiz)
+  if (versionadas.length) {
+    linhas.push({ estado: 'atencao', texto: `saida do laboratorio exposta ao git: ${versionadas.join('; ')}. Saida de experimento costuma levar dado real` })
+  }
+
   const semPadrao = ctx.ferramentas.filter((f) => !f.padrao && !f.dispensa_motivo)
   if (semPadrao.length) {
     linhas.push({ estado: 'atencao', texto: `${semPadrao.length} ferramenta(s) sem convencao escrita: ${semPadrao.map((f) => f.nome).join(', ')}` })
# ff8d544 · chore(TASK-CHORE-022): atualizar mentor-agent para v0.10.0 (#41)
diff --git a/.mentor/scripts/cmd-verificar.ts b/.mentor/scripts/cmd-verificar.ts
index f20d129..dc06423 100644
--- a/.mentor/scripts/cmd-verificar.ts
+++ b/.mentor/scripts/cmd-verificar.ts
@@ -5,6 +5,7 @@ import { comparar } from './cmd-regras.ts'
 import { conferirManifesto } from './cmd-pacote.ts'
 import { carregarContexto, carregarInvariantes, carregarReferencias, carregarRequisitos, carregarTarefas } from './vistas.ts'
 import { MARCADOR } from './tipos.ts'
+import { problemasDoInventario } from './laboratorio.ts'
 import type { Tetos } from './tipos.ts'
 
 export interface Achado { familia: string; onde: string; problema: string }
@@ -239,6 +240,9 @@ function referencias(): Achado[] {
       achados.push({ familia: 'referencia', onde: r.id, problema: 'marcado implementado sem nenhuma tarefa vinculada' })
     }
   }
+
+  // 0.10.0: chave de experimento nasce desligada, e toda chave e artefato importavel aponta para teste que existe.
+  for (const p of problemasDoInventario(ctx, c.raiz)) achados.push({ familia: 'referencia', onde: p.onde, problema: p.problema })
   return achados
 }
# ff8d544 · chore(TASK-CHORE-022): atualizar mentor-agent para v0.10.0 (#41)
diff --git a/package-lock.json b/package-lock.json
index e3265c9..67c7397 100644
--- a/package-lock.json
+++ b/package-lock.json
@@ -48,7 +48,7 @@
         "fast-xml-parser": "^5.3.2",
         "globals": "^16.5.0",
         "jsdom": "^27.3.0",
-        "mentor-agent": "github:thiagoroddev/mentor-agent#v0.9.0",
+        "mentor-agent": "github:thiagoroddev/mentor-agent#v0.10.0",
         "postcss": "^8.4.47",
         "prettier": "^3.6.2",
         "puppeteer": "^25.9.0",
@@ -8786,8 +8786,8 @@
       "license": "MIT"
     },
     "node_modules/mentor-agent": {
-      "version": "0.9.0",
-      "resolved": "git+ssh://git@github.com/thiagoroddev/mentor-agent.git#95ede8e169f72661e23f09da56330df3ced8df2b",
+      "version": "0.10.0",
+      "resolved": "git+ssh://git@github.com/thiagoroddev/mentor-agent.git#dd27e8b8fb7b6e6079a23d66032bdff6f3f9bf2d",
       "dev": true,
       "bin": {
         "mentor": "mentor.mjs"
```

## Requisitos citados pelo lote

### RF-58 (RF) · implementado

Navegar entre paradas firmadas do Meu roteiro com avancar/retroceder ciclico no cabecalho do painel


## O que o script ja mediu

Fatos, nao vereditos. Quem da o nivel e voce.

- TASK-CHORE-017: 1 arquivo(s) nos commits da tarefa sem constar no plano.muda: .mentor/scripts/cmd-doctor.ts
- TASK-CHORE-017: 1 criterio(s) de aceite sem teste nomeado ("nao se aplica"). Criterio sem verificacao reproduzivel e' criterio NAO VERIFICADO
- TASK-CHORE-017: o gate "testes" teve o vermelho dispensado: "Nao ha regra de negocio nem codigo de aplicacao (src/) alterado: e apenas atualizacao da dependencia de processo mentor-agent. Sem codigo de producao para mutar, prova por mutacao nao se aplica; os testes existentes passam inalterados porque nada que eles cobrem mudou.". Auditor: verificar se ha prova por mutacao
- TASK-BG-021: 1 criterio(s) de aceite sem teste nomeado ("nao se aplica"). Criterio sem verificacao reproduzivel e' criterio NAO VERIFICADO
- TASK-BG-021: fechou com 1 achado(s) proprio(s) ja com destino
- TASK-CHORE-019: 1 criterio(s) de aceite sem teste nomeado ("nao se aplica"). Criterio sem verificacao reproduzivel e' criterio NAO VERIFICADO
- TASK-CHORE-019: o gate "testes" teve o vermelho dispensado: "Nao ha regra de negocio nem codigo de aplicacao (src/) alterado: e apenas atualizacao da dependencia de processo mentor-agent. Sem codigo de producao para mutar, prova por mutacao nao se aplica; os testes existentes passam inalterados porque nada que eles cobrem mudou.". Auditor: verificar se ha prova por mutacao
- TASK-CHORE-020: 3 criterio(s) de aceite sem teste nomeado ("nao se aplica"). Criterio sem verificacao reproduzivel e' criterio NAO VERIFICADO
- TASK-CHORE-020: o gate "testes" teve o vermelho dispensado: "Nao ha regra de negocio nem codigo de aplicacao (src/) alterado: e so a atualizacao da dependencia de processo mentor-agent. Sem codigo de producao para mutar, prova por mutacao nao se aplica; os testes existentes passam inalterados porque nada que eles cobrem mudou.". Auditor: verificar se ha prova por mutacao
- TASK-CHORE-021: 3 criterio(s) de aceite sem teste nomeado ("nao se aplica"). Criterio sem verificacao reproduzivel e' criterio NAO VERIFICADO
- TASK-CHORE-021: o gate "testes" teve o vermelho dispensado: "Nao ha regra de negocio nem codigo de aplicacao (src/) alterado: e so a atualizacao da dependencia de processo mentor-agent e um job novo da esteira. Sem codigo de producao para mutar, prova por mutacao nao se aplica; os testes existentes passam inalterados porque nada que eles cobrem mudou.". Auditor: verificar se ha prova por mutacao
- TASK-RF-044: tarefa sensivel (persistencia, calculo, ui) com revisao humana declarada: "Humano validou no Samsung M35 pelo preview rf-044-navegar-paradas-rotei.teste-prototipo.pages.dev (13/09/26), com prints: no Meu roteiro as setas do cabecalho navegam entre as paradas firmadas e selecionam a parada no mapa; depois do ajuste, Recomecar, Ver detalhes e as setas ficaram numa linha abaixo da barra de progresso. Declarou: o botao funciona, tarefa finalizada." (Regra 4 atendida)
- TASK-RF-044: fechou com 1 achado(s) proprio(s) ja com destino
- TASK-BG-022: 1 criterio(s) de aceite sem teste nomeado ("nao se aplica"). Criterio sem verificacao reproduzivel e' criterio NAO VERIFICADO
- TASK-BG-022: tarefa sensivel (ui) com revisao humana declarada: "Humano validou no Samsung M35 pelo preview bg-022-ancoras-do-experiment.teste-prototipo.pages.dev (13/09/26 23:10), com print do roteiro L-30 DEMO no Meu roteiro depois de a malha carregar: P8 com o veiculo na Rua Redentor em frente ao pino (antes na Anibal de Mendonca, 86 m), P4 na Rua Barao da Torre (antes na Garcia d'Avila, 47 m), P3 na Rua Prudente de Morais (antes na Barao da Torre, 204 m); as demais paradas na via em frente ao pino. Declarou: consertado." (validacao manual atendida)
- TASK-CHORE-022: 2 criterio(s) de aceite sem teste nomeado ("nao se aplica"). Criterio sem verificacao reproduzivel e' criterio NAO VERIFICADO
- TASK-CHORE-022: o gate "testes" teve o vermelho dispensado: "Nao ha regra de negocio nem codigo de aplicacao (src/) alterado: e so a atualizacao da dependencia de processo mentor-agent e a declaracao do laboratorio no contexto. Sem codigo de producao para mutar, prova por mutacao nao se aplica; os testes existentes passam inalterados porque nada que eles cobrem mudou.". Auditor: verificar se ha prova por mutacao
- TASK-CHORE-022: fechou com 2 achado(s) proprio(s) ja com destino

## Fora das tarefas do lote

So' fatos, sem conteudo: nao e' material desta auditoria. Um commit que toca codigo sem tarefa e' achado; o resto e' contexto.

**Commits marcados Light desde a ultima auditoria (1).** Light e' lista fechada (nucleo §5: typo, formatacao, renomear arquivo, dependencia de desenvolvimento). O que nao cabe nela e' codigo sem tarefa, e isso e' achado:

- `8fd2adb` docs(light): permissao do hook e lembrete de maquina nova e pastas locais fora do git (#52) — 30 linha(s) em .githooks/pre-push, README.md


## Como entregar o veredito

Edite `docs-mentor/auditorias/AUD-003.json`:

- `veredito`: `APROVADO` | `APROVADO COM RESSALVAS` | `REPROVADO`
- `nao_verificado`: lista. **Nunca pode ficar vazia** — nenhuma auditoria verifica tudo, e dizer o contrario e o sinal mais claro de auditoria quebrada.
- `pendencias`: cada achado com `nivel` (`bloqueia` | `recomendacao` | `observacao`), `descricao` e `tarefas` (os IDs a que se refere).
  Deixe `destino`, `ref` e `resolvida_em` em `null`: **quem decide o destino e o humano, nao voce.**

Depois rode:

```
node mentor.mjs auditar registrar AUD-003
```

O comando recusa: marcador nao preenchido · `nao_verificado` vazio · achado `bloqueia` com veredito `APROVADO` · destino preenchido por voce.
