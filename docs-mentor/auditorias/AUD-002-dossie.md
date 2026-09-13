# AUD-002 · dossie de auditoria

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

Base do diff: `8f4b23a971d419076a2571c82dce0ef37bfabe0f`
Ate: `00921b69123c37ae01c09f9f7728af26b10e747a`

### TASK-BG-017 · titulo-autossuficiente: Adicionar keywords ausentes na classificacao comercial/residencial a partir de romaneios reais (edificio, zelador, emporio, drogarias, sobreloja, grill, vitrine, teatro, tech)

`BG` · cerimonia Standard · esforco P/P · origem: titulo-autossuficiente

**Criterios de aceite, e o teste que cada um nomeia:**

- Endereco cujo complemento contem cada um dos 9 termos novos e classificado como HOME_CORRECTED ou OFFICE_CORRECTED, conforme a lista
  → teste: `inferLocationType.test.ts > "detects keywords added from real romaneio analysis (TASK-BG-017)"`
- "drogarias" (plural) e reconhecido como comercial, corrigindo a lacuna de correspondencia exata com "drogaria" (singular)
  → teste: `inferLocationType.test.ts > mesmo bloco acima, caso especifico de plural`

**Declarou mudar:**

- src/constants/keywords.ts - adicionar "edificio" e "zelador" a residentialRaw; adicionar "tech", "emporio", "sobreloja", "drogarias", "grill", "vitrine" e "teatro" a commercialRaw
- src/__tests__/utils/inferLocationType.test.ts - novos casos cobrindo os 9 termos novos, incluindo o gap de "drogarias" (plural) nao bater com "drogaria"

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| testes | APROVADO | 12/09/26 06:01 | 0 | — |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| build | APROVADO | — | 0 | — |

**Riscos declarados:** Termos ambiguos levantados na mesma varredura (andar, recepcao, administracao, studio, garagem, subsolo, vigilante) ficaram de fora por decisao do mantenedor humano, para nao arriscar falso positivo (ex.: "andar" na lista residencial capturaria enderecos comerciais tipo "andar 5, sala 302" antes da checagem de sala). Registrado como observacao, nao como pendencia bloqueante.

### TASK-CHORE-016 · titulo-autossuficiente: Atualizar mentor-agent para v0.5.0

`CHORE` · cerimonia Standard · esforco P/P · origem: titulo-autossuficiente

**Criterios de aceite, e o teste que cada um nomeia:**

- node mentor.mjs doctor roda sem bloqueio apos a atualizacao
  → teste: `nao se aplica: verificacao operacional via CLI, nao ha teste automatizado para o pacote mentor-agent em si`

**Declarou mudar:**

- package.json / package-lock.json - mentor-agent github:thiagoroddev/mentor-agent#v0.4.0 -> #v0.5.0
- docs-mentor/contexto.json - versao_do_pacote 0.5.0 e auditoria.cadencia_em_caracteres: 80000 (novo campo do pacote)
- .mentor/* - reinstalado via 'npx mentor instalar --forcar' (mesmo padrao da TASK-CHORE-015 para v0.4.0)
- .gitignore - adicionar .claude/ (config local da ferramenta Claude Code, achado durante o fechamento; nao pertence ao codigo do app)

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| testes | APROVADO | dispensado (12/09/26 06:20) | 0 | Nao ha regra de negocio ou codigo de aplicacao (src/) alterado nesta tarefa - e apenas bump de dependencia de processo (mentor-agent) e config de contexto. Sem producao para mutar, prova por mutacao nao se aplica; os 934 testes existentes passam inalterados porque nada que eles cobrem mudou. |
| build | APROVADO | — | 0 | — |
| validacao_manual | não se aplica | — | — | Atualizacao mecanica de ferramenta de processo (mentor-agent), sem alteracao em src/; nenhum modulo de aplicacao ou UI tocado. Mesma operacao ja validada na TASK-CHORE-015 (v0.4.0). |

**Riscos declarados:** nenhum identificado - mesma operacao mecanica ja validada na TASK-CHORE-015 (v0.4.0)

### TASK-BG-018 · Rota desenhava conversao proibida porque a malha baixada recortava o retorno legal

`BG` · cerimonia Standard · esforco P/M · origem: titulo-autossuficiente

**Criterios de aceite, e o teste que cada um nomeia:**

- A malha viaria pedida cobre ao menos 600m alem do envelope dos pontos, nas quatro direcoes.
  → teste: `src/__tests__/hooks/useRoadGraph.test.tsx > cobre ao menos 600 m em volta dos pontos, para alcancar retornos legais fora do envelope`
- No romaneio real (Av. Epitacio Pessoa 2224 -> 2556), o tracado entre as duas paradas segue Henrique Dodsworth -> Praca Eugenio Jardim -> volta, como no Google Maps, sem a conversao proibida em V.
  → teste: `nao se aplica como assercao automatizada: depende da malha OSM ao vivo. Simulacao registrada nos achados; conferencia na validacao manual.`

**Declarou mudar:**

- src/hooks/useRoadGraph.ts - margem da malha em volta dos pontos passa de 300m para 600m, para a malha alcancar o retorno legal mais proximo
- src/__tests__/hooks/useRoadGraph.test.tsx - novo teste: o bbox pedido cobre ao menos 600m em volta do envelope dos pontos

**Gates:**

| gate | rotulo | vermelho antes | saida | motivo/ressalva |
| :-- | :-- | :-- | --: | :-- |
| testes | APROVADO | 12/09/26 23:38 | 0 | — |
| tipos | APROVADO | — | 0 | — |
| lint | APROVADO | — | 0 | — |
| build | APROVADO | — | 0 | — |
| validacao_manual | APROVADO | — | 0 | Humano validou no app em 12/09/26 com o romaneio 2025-11-19-JQJE-LAGOA (1).json: o trecho P1 (Epitacio Pessoa 2224) -> P2 (2556) passou a seguir Av. Henrique Dodsworth ate o contorno da Praca Eugenio Jardim (Cantagalo) e voltar, sem o V proibido perto da Praca Senador Filinto Miller, igual a rota do Google Maps. Humano confirmou que nada regrediu em outros pontos. |

**Riscos declarados:** Area maior pesa mais no Overpass/proxy e no aparelho: 4,69 -> 7,74 km2 e 2.536 -> 4.418 nos no romaneio de teste. · Margem empirica: retorno legal alem de 600m continua recortado; a mitigacao estrutural e a TASK-BG-019. · Rotas ja montadas podem mudar de tracado e distancia ao reabrir, porque a malha maior encontra caminhos legais que antes ficavam de fora.

**Achados que a propria tarefa registrou:**

- (classe 4) O motor ignora as relacoes de restricao de conversao do OSM. A manobra em V deste bug e proibida pela relacao 4603685 (no_left_turn, from way 160970023 via node 2112929361 to way 329058529). Na malha de 600m do romaneio de teste ha 42 restricoes ignoradas. Simulado: com margem 300m, respeita-las deixa o trecho sem caminho; com margem 450m ou mais, o A* atual ja faz o contorno pela Praca Eugenio Jardim (1358m) e as restricoes nao mudam esta rota. → tarefa: TASK-BG-019
- (classe 4) SummaryPage.tsx chama useRoadGraph sem o ponto inicial e MapPage.tsx chama com ele. Quando o inicio fica fora do envelope das entregas, o Sumario e o mapa calculam sobre malhas diferentes e podem mostrar distancias diferentes, contrariando o que a TASK-BG-014 garantiu. Encontrado lendo o codigo durante esta tarefa; nao corrigido aqui. → tarefa: TASK-BG-020

## O que o script ja mediu

Fatos, nao vereditos. Quem da o nivel e voce.

- 18 arquivo(s) mudaram sem constar em nenhum `plano.muda` do lote: .mentor/esquemas/contexto.json, .mentor/manifesto.json, .mentor/nucleo.md, .mentor/processos/tarefa.md, .mentor/scripts/cli.ts, .mentor/scripts/cmd-auditar.ts, .mentor/scripts/cmd-doctor.ts, .mentor/scripts/cmd-tarefa.ts, .mentor/scripts/tipos.ts, docs-mentor/tarefas/abertas/TASK-BG-019.json, docs-mentor/tarefas/abertas/TASK-BG-020.json, docs-mentor/tarefas/concluidas/2026-09-12--06h08--TASK-BG-017.json, docs-mentor/tarefas/concluidas/2026-09-12--06h08--TASK-BG-017.md, docs-mentor/tarefas/concluidas/2026-09-12--06h20--TASK-CHORE-016.json, docs-mentor/tarefas/concluidas/2026-09-12--06h20--TASK-CHORE-016.md, docs-mentor/tarefas/concluidas/2026-09-12--23h55--TASK-BG-018.json, docs-mentor/tarefas/concluidas/2026-09-12--23h55--TASK-BG-018.md, package-lock.json
- TASK-BG-017: alterou persistencia/calculo ("titulo-autossuficiente: Adicionar keywords ausentes na classificacao comercial/residencial a partir de romaneios reais (edificio, zelador, emporio, drogarias, sobreloja, grill, vitrine, teatro, tech)") sem registro de revisao humana aprovada (atencao a Regra 4)
- TASK-CHORE-016: 1 criterio(s) de aceite sem teste nomeado ("nao se aplica"). Criterio sem verificacao reproduzivel e' criterio NAO VERIFICADO
- TASK-CHORE-016: o gate "testes" teve o vermelho dispensado: "Nao ha regra de negocio ou codigo de aplicacao (src/) alterado nesta tarefa - e apenas bump de dependencia de processo (mentor-agent) e config de contexto. Sem producao para mutar, prova por mutacao nao se aplica; os 934 testes existentes passam inalterados porque nada que eles cobrem mudou.". Auditor: verificar se ha prova por mutacao
- TASK-BG-018: 1 criterio(s) de aceite sem teste nomeado ("nao se aplica"). Criterio sem verificacao reproduzivel e' criterio NAO VERIFICADO
- TASK-BG-018: alterou persistencia/calculo e possui revisao humana aprovada: "Humano validou no app em 12/09/26 com o romaneio 2025-11-19-JQJE-LAGOA (1).json: o trecho P1 (Epitacio Pessoa 2224) -> P2 (2556) passou a seguir Av. Henrique Dodsworth ate o contorno da Praca Eugenio Jardim (Cantagalo) e voltar, sem o V proibido perto da Praca Senador Filinto Miller, igual a rota do Google Maps. Humano confirmou que nada regrediu em outros pontos." (Regra 4 atendida)
- TASK-BG-018: fechou com 2 achado(s) proprio(s) ja com destino

## O diff

```
.gitignore                                         |   3 +
 .mentor/esquemas/contexto.json                     |   3 +-
 .mentor/manifesto.json                             |  20 +--
 .mentor/nucleo.md                                  |   3 +-
 .mentor/processos/tarefa.md                        |  45 +++++++
 .mentor/scripts/cli.ts                             |   2 +-
 .mentor/scripts/cmd-auditar.ts                     |  52 +++++++-
 .mentor/scripts/cmd-doctor.ts                      |  28 +++-
 .mentor/scripts/cmd-tarefa.ts                      | 134 ++++++++++++++++---
 .mentor/scripts/tipos.ts                           |   1 +
 docs-mentor/tarefas/abertas/TASK-BG-019.json       |  44 +++++++
 docs-mentor/tarefas/abertas/TASK-BG-020.json       |  44 +++++++
 .../concluidas/2026-09-12--06h08--TASK-BG-017.json | 107 ++++++++++++++++
 .../concluidas/2026-09-12--06h08--TASK-BG-017.md   |  38 ++++++
 .../2026-09-12--06h20--TASK-CHORE-016.json         | 119 +++++++++++++++++
 .../2026-09-12--06h20--TASK-CHORE-016.md           |  28 ++++
 .../concluidas/2026-09-12--23h55--TASK-BG-018.json | 142 +++++++++++++++++++++
 .../concluidas/2026-09-12--23h55--TASK-BG-018.md   |  33 +++++
 package-lock.json                                  |   6 +-
 package.json                                       |   2 +-
 src/__tests__/hooks/useRoadGraph.test.tsx          |  15 +++
 src/__tests__/utils/inferLocationType.test.ts      |  24 ++++
 src/constants/keywords.ts                          |   9 ++
 src/hooks/useRoadGraph.ts                          |   8 +-
 24 files changed, 860 insertions(+), 50 deletions(-)
```


```diff
diff --git a/.gitignore b/.gitignore
index 767013f..70ad854 100644
--- a/.gitignore
+++ b/.gitignore
@@ -80,3 +80,6 @@ __utilidades-back-office__/spike-conversoes/.cache/
 # Private real manifests and reproducible routing snapshots (TASK-RF-030).
 __utilidades-back-office__/romaneios/
 __utilidades-back-office__/auto-roteirizacao/.cache/
+
+# Config local do Claude Code (preview de navegador etc.), nao pertence ao codigo do app.
+.claude/
diff --git a/.mentor/esquemas/contexto.json b/.mentor/esquemas/contexto.json
index 0a425bf..f6c96e7 100644
--- a/.mentor/esquemas/contexto.json
+++ b/.mentor/esquemas/contexto.json
@@ -426,7 +426,8 @@
   },
   "auditoria": {
     "cadencia_em_tarefas": 10,
-    "cadencia_nota": "A cada N tarefas concluidas, 'mentor auditar preparar' monta o dossie do lote. O auditor le so o diff do lote, os registros e os requisitos citados: nunca o repositorio.",
+    "cadencia_em_caracteres": 80000,
+    "cadencia_nota": "A cada N tarefas concluidas ou X caracteres de diff acumulados, 'mentor auditar preparar' monta o dossie do lote. O auditor le so o diff do lote, os registros e os requisitos citados: nunca o repositorio.",
     "ultima_em": null,
     "ultima_na_tarefa": null,
     "ultimo_commit": null,
diff --git a/.mentor/manifesto.json b/.mentor/manifesto.json
index eb77f7f..3f12728 100644
--- a/.mentor/manifesto.json
+++ b/.mentor/manifesto.json
@@ -1,8 +1,8 @@
 {
-  "versao": "0.4.0",
-  "gerado_em": "2026-09-12T01:29:17.861Z",
+  "versao": "0.5.0",
+  "gerado_em": "2026-09-12T07:46:52.718Z",
   "arquivos": {
-    "esquemas/contexto.json": "e31c3ad8ec59b016",
+    "esquemas/contexto.json": "4f7bcc0da3d94213",
     "esquemas/divida-tecnica.json": "0906f6786a8e63a1",
     "esquemas/invariante.json": "010b2f14614118a9",
     "esquemas/referencia.json": "0ba0b8b908141561",
@@ -27,7 +27,7 @@
     "modelos/fichas.md": "92cdc7020d33fcc1",
     "modelos/listas-por-fase.md": "57377dc4538acc80",
     "modelos/varredura.md": "f3016bd789b30a83",
-    "nucleo.md": "0f46525fbffebec0",
+    "nucleo.md": "153d5d8bc66d92b9",
     "package.json": "1c9a0949072c4ea1",
     "processos/analise-de-impacto.md": "60318cd6189f0f28",
     "processos/entrega.md": "467922347778a037",
@@ -35,15 +35,15 @@
     "processos/padroes-de-stack.md": "7d7df1b15ba7de44",
     "processos/rascunho.md": "13c19607b370fe9f",
     "processos/revisao.md": "4c1e2e6a1722b5ab",
-    "processos/tarefa.md": "cf3b97bbd18e5ad9",
+    "processos/tarefa.md": "6ba6187086225d64",
     "processos/teste.md": "e904b9a054de5187",
     "regras.json": "5f5ddff0c236ed68",
     "scripts/arquivos.ts": "ef2b9b6f17179ee6",
-    "scripts/cli.ts": "3e2f470cdaebcc5c",
+    "scripts/cli.ts": "2311a6c58d7c53e0",
     "scripts/cmd-anotar.ts": "140d6492fb55d524",
-    "scripts/cmd-auditar.ts": "8bef11909dde8ca5",
+    "scripts/cmd-auditar.ts": "e9bcb9fac02e879d",
     "scripts/cmd-campo.ts": "ab1eed484b32ace9",
-    "scripts/cmd-doctor.ts": "a32c0e2fd6891996",
+    "scripts/cmd-doctor.ts": "15747f691b02f5db",
     "scripts/cmd-fila.ts": "12b00455fc0284ec",
     "scripts/cmd-gates.ts": "dc5b327389ce58c6",
     "scripts/cmd-hooks.ts": "1b2f2361989e5124",
@@ -57,12 +57,12 @@
     "scripts/cmd-resolver.ts": "d40be7e36a3d7ae5",
     "scripts/cmd-riscos.ts": "54da3ca4e24f28eb",
     "scripts/cmd-stack.ts": "b2eebe54b9a2b7cd",
-    "scripts/cmd-tarefa.ts": "759a2833845dba3e",
+    "scripts/cmd-tarefa.ts": "862cb44b9750641a",
     "scripts/cmd-verificar.ts": "3ce01483c95d2112",
     "scripts/entrada.ts": "1a56522a3580b616",
     "scripts/ids.ts": "b64a05cfaa370e69",
     "scripts/instalar.mjs": "061e01d6b571b067",
-    "scripts/tipos.ts": "ac4b7d0736565099",
+    "scripts/tipos.ts": "9a8fbcb91b823bc9",
     "scripts/vistas.ts": "a708fee25949ba2a",
     "skills/contratos-de-api/SKILL.md": "99943749d9a1771e",
     "skills/data-modeling/SKILL.md": "346a6a6afd3be72d",
diff --git a/.mentor/nucleo.md b/.mentor/nucleo.md
index 7143d50..edd7978 100644
--- a/.mentor/nucleo.md
+++ b/.mentor/nucleo.md
@@ -35,6 +35,7 @@ explícita**. Nunca deduza intenção. **Termina, apresenta, aguarda.**
 - A tarefa termina aberta e espera ali. Escrever o registro de conclusão antes do portão 2
   transforma a pergunta em aviso: o humano recebe fato consumado com aparência de consulta.
 - **Autorização vale por ato, nunca por sessão.** Aprovar o plano não autoriza fechar.
+- **Validação manual ativa antes do fechamento:** Em tarefas que alteram UI/Telas, Persistência/Esquema, Cálculos/Algoritmos ou Spikes, a IA é **proibida de pedir fechamento (Portão 2) ou push (Portão 3) sem antes apresentar o roteiro de testes manuais e aguardar a confirmação explícita do humano**. Finalizar sem registrar evidência no gate `validacao_manual` quebra a auditoria (Regra 4 e Bloqueios AUD-001-B01/B02/B04).
 - O `push` é sempre pedido à parte: é o único ato que sai da máquina e alcança outras pessoas.
 - Depois do push, conferir o resultado da integração. Não é portão, e o poder dele é avisar.
 - Vale em qualquer modo de cerimônia, inclusive Light.
@@ -115,7 +116,7 @@ encontrado é resposta legítima, e se escreve. Risco que o humano já recusou p
 | Lint | nenhuma violação das regras de estilo do projeto |
 | Testes | a suíte passa inteira |
 | Build | o artefato de produção é gerado sem erro |
-| Validação manual | o que só humano confere, quando o projeto declara que existe |
+| Validação manual | o que só humano confere. Obrigatório em UI, persistência/esquema, cálculos e spikes, ou quando declarado ativo pelo projeto |
 
 O comando de cada um vive em `contexto.json → gates`. Gate que o projeto não declarou **não existe**
 para ele, e declará-lo é a primeira coisa a resolver, não um detalhe a contornar.
diff --git a/.mentor/processos/tarefa.md b/.mentor/processos/tarefa.md
index 3658df8..865f1c1 100644
--- a/.mentor/processos/tarefa.md
+++ b/.mentor/processos/tarefa.md
@@ -96,6 +96,51 @@ Corolário com dentes: gate cujo run **já existe** e não tem o link é tratado
 Gate declarado tem linha própria. Os `não se aplica` podem dividir uma linha só. **Omitir é
 proibido:** é ambíguo entre *"não temos"* e *"esquecemos de escrever"*.
 
+## Validação Manual Humana & Alerta Proativo da IA
+
+A validação manual é o portão humano que impede que alucinações ou suposições da IA cheguem a produção.
+
+### Quando precisa de validação manual? Em todas as tarefas?
+
+**NÃO em todas.** A exigência segue uma taxonomia fechada:
+
+| Caso | Validação Manual | Justificativa |
+|---|:---:|---|
+| **UI / Frontend / Telas** | **SIM (Obrigatória)** | Componentes visuais, CSS, formulários, responsividade e fluxos só o uso humano consegue atestar. |
+| **Persistência / Esquema (Regra 4)** | **SIM (Obrigatória)** | Alterações de schema, migrations, `DB_VERSION`, IndexedDB e persistência exigem revisão humana no dossiê de auditoria. |
+| **Cálculos / Algoritmos (Regra 4)** | **SIM (Obrigatória)** | Fórmulas, penalidades de rota, heurísticas de busca e totalizadores exigem conferência de resultado pelo usuário. |
+| **Spikes** | **SIM (Obrigatória)** | O spike responde a uma pergunta de arquitetura ou produto que orienta decisões humanas. |
+| **Refatoração Interna Pura (REF)** | **NÃO (Dispensada)** | Sem alteração de comportamento, coberta 100% por suíte automatizada verde. |
+| **Tipagem pura (`.d.ts`, `types.ts`)** | **NÃO (Dispensada)** | Verificada pelo gate de tipos (`tsc`). |
+| **Documentação pura (DOC)** | **NÃO (Dispensada)** | Sem impacto executável no produto. |
+| **Chores de Build/CI** | **NÃO (Dispensada)** | Sem impacto funcional direto no usuário. |
+
+### Postura Ativa da IA (Shift-Left)
+A IA é **proibida** de tentar fechar a tarefa ou pedir autorização para `push` sem antes apresentar o roteiro de testes:
+```markdown
+### 🧪 Roteiro de Validação Manual (Obrigatório)
+Esta tarefa altera [UI / Persistência / Algoritmo]. A validação humana é obrigatória antes da finalização.
+
+**Passos para validação:**
+1. Abra [...]
+2. Execute [...]
+3. Verifique se [...]
+
+Por favor, valide e confirme com o resultado para registro do gate.
+```
+A IA **nunca** finaliza nem faz push antes de receber essa confirmação escrita.
+
+### Travas no Fechamento
+O CLI recusa o `mentor task finalizar` se:
+1. A tarefa estiver com `validacao: "pendente"` sem validação aprovada ou dispensada.
+2. O gate `validacao_manual` estiver `NÃO EXECUTADO` sem motivo.
+3. Arquivos de código de produção tiverem sido modificados no Git sem constar no `plano.muda` (prevenção de arquivos fantasmas AUD-001-B05).
+
+**Como registrar:**
+- Humano aprovou: `mentor task validar <ID> --aprovado --evidencia "<resumo dos testes>"`
+- Atalho na finalização: `mentor task finalizar <ID> --validado-por-humano "<evidencia>"`
+- Dispensa justificada: `mentor task validar <ID> --dispensado --motivo "<justificativa>"`
+
 ## Fechamento
 
 A narrativa é o texto livre da tarefa, voltada para aprendizado humano, com teto expandido de 10.000
diff --git a/.mentor/scripts/cli.ts b/.mentor/scripts/cli.ts
index a176c84..8225063 100644
--- a/.mentor/scripts/cli.ts
+++ b/.mentor/scripts/cli.ts
@@ -189,7 +189,7 @@ function principal(argv: string[]): number {
         if (!liberar && (!Number.isInteger(posicao) || posicao < 1)) throw new Error('Use: mentor task fila <ID> <posicao> | mentor task fila <ID> --soltar')
         fila(id, posicao, liberar); return 0
       }
-      if (sub === 'finalizar') { finalizar(id); return process.exitCode === 1 ? 1 : 0 }
+      if (sub === 'finalizar') { finalizar(id, flags); return process.exitCode === 1 ? 1 : 0 }
       if (sub === 'gate') {
         const gate = posicionais[2]
         if (!gate) throw new Error('Falta o nome do gate.')
diff --git a/.mentor/scripts/cmd-auditar.ts b/.mentor/scripts/cmd-auditar.ts
index 298c378..0ac6e58 100644
--- a/.mentor/scripts/cmd-auditar.ts
+++ b/.mentor/scripts/cmd-auditar.ts
@@ -46,18 +46,42 @@ function git(args: string[]): { ok: boolean; saida: string } {
 }
 
 /** Ordem de conclusao: o nome do arquivo de concluida comeca pelo carimbo, entao a lista ja' vem em ordem. */
-function concluidasEmOrdem(): Tarefa[] {
+export function concluidasEmOrdem(): Tarefa[] {
   return listar(caminhos().concluidas, '.json').map((a) => lerJson<Tarefa>(a)).filter((t) => t.estado === 'concluida')
 }
 
+export function loteNaoAuditado(): Tarefa[] {
+  const auditorias = carregarAuditorias()
+  const jaAuditadas = new Set(auditorias.flatMap((a) => a.lote))
+  return concluidasEmOrdem().filter((t) => !jaAuditadas.has(t.id))
+}
+
+export function baseDoLote(ctx: ReturnType<typeof carregarContexto>, lote: Tarefa[]): string | null {
+  return ctx.auditoria.ultimo_commit ?? lote[0]?.commit_base ?? null
+}
+
+export function medirDiffAcumulado(base: string | null): number {
+  if (!base) return 0
+  const recorteDoProjeto = ['--relative', '--', '.', ...VISTAS_GERADAS]
+  const r = git(['diff', base, ...recorteDoProjeto])
+  let tamanho = r.ok ? r.saida.length : 0
+
+  const novos = git(['ls-files', '--others', '--exclude-standard']).saida.split('\n')
+    .filter(Boolean).filter((f) => !f.startsWith(`${NOME_DOS_DOCUMENTOS}/`) && !f.startsWith('docs/'))
+  for (const f of novos) {
+    const conteudo = git(['diff', '--no-index', '--', '/dev/null', f]).saida
+    tamanho += (conteudo || `+++ ${f}`).slice(0, LIMITE_ARQUIVO_NOVO).length
+  }
+  return tamanho
+}
+
 // ---------------------------------------------------------------- preparar
 
 export function preparar(): number {
   const c = caminhos()
   const ctx = carregarContexto()
   const auditorias = carregarAuditorias()
-  const jaAuditadas = new Set(auditorias.flatMap((a) => a.lote))
-  const lote = concluidasEmOrdem().filter((t) => !jaAuditadas.has(t.id))
+  const lote = loteNaoAuditado()
 
   const pendente = auditorias.find((a) => !a.registrada_em)
   if (pendente) {
@@ -96,8 +120,11 @@ export function preparar(): number {
 }
 
 /** Fatos, nunca julgamento: o script mede, o auditor decide o nivel. */
-function fatosMecanicos(lote: Tarefa[], arquivosDoDiff: string[]): string[] {
+function fatosMecanicos(lote: Tarefa[], arquivosDoDiff: string[], diffTotalChars: number = 0): string[] {
   const fatos: string[] = []
+  if (diffTotalChars > LIMITE_DIFF) {
+    fatos.push(`⚠️ DIFF TRUNCADO: o lote acumulou ${diffTotalChars} caracteres de diff, excedendo o teto de ${LIMITE_DIFF}. A cadencia por caracteres foi desrespeitada. Auditor: liste as partes nao verificadas em "nao_verificado".`)
+  }
   const declarados = new Set<string>()
   for (const t of lote) {
     for (const linha of t.plano.muda) {
@@ -131,6 +158,17 @@ function fatosMecanicos(lote: Tarefa[], arquivosDoDiff: string[]): string[] {
         }
       }
     }
+    const tocaSensivel = /schema|migration|persist|banco|db_|calcul|algoritmo|formula|romaneio|haversine/i.test(
+      `${t.titulo} ${t.plano.muda.join(' ')} ${t.plano.impacto ?? ''}`,
+    ) || t.tipo === 'RN' || t.tipo === 'RNF'
+    if (tocaSensivel) {
+      if (t.validacao === 'aprovado') {
+        const ev = t.gates['validacao_manual']?.saida ?? t.validacao_motivo ?? 'aprovado pelo humano'
+        fatos.push(`${t.id}: alterou persistencia/calculo e possui revisao humana aprovada: "${ev}" (Regra 4 atendida)`)
+      } else {
+        fatos.push(`${t.id}: alterou persistencia/calculo ("${t.titulo}") sem registro de revisao humana aprovada (atencao a Regra 4)`)
+      }
+    }
     if (t.achados.length) fatos.push(`${t.id}: fechou com ${t.achados.length} achado(s) proprio(s) ja com destino`)
   }
   return fatos.length ? fatos : ['nada a assinalar mecanicamente. Isso nao e um veredito: e a ausencia de sinal barato']
@@ -147,10 +185,12 @@ function dossie(id: string, lote: Tarefa[], base: string | null, final: string |
   // relativos a ela. Assim um projeto dentro de um repositorio maior audita **so' a si mesmo**, e
   // o dossie nao muda de forma entre Windows e Linux por causa de caminho absoluto.
   const recorteDoProjeto = ['--relative', '--', '.', ...VISTAS_GERADAS]
+  let diffTotal = 0
   if (base) {
     stat = git(['diff', '--stat', base, ...recorteDoProjeto]).saida
     arquivos = git(['diff', '--name-only', base, ...recorteDoProjeto]).saida.split('\n').map((x) => x.trim()).filter(Boolean)
     diff = git(['diff', base, ...recorteDoProjeto]).saida
+    diffTotal = diff.length
     if (diff.length > LIMITE_DIFF) {
       recorte = `\n\n⚠️ **O diff foi recortado em ${LIMITE_DIFF} de ${diff.length} caracteres.** O que nao coube nao foi auditado, e isso entra em "nao verificado" do relatorio.`
       diff = diff.slice(0, LIMITE_DIFF) + '\n[...recortado...]'
@@ -226,7 +266,7 @@ function dossie(id: string, lote: Tarefa[], base: string | null, final: string |
         motivo: (g as any).vermelho_motivo ?? g.motivo ?? '—',
       } : null)
       const vermelhoTexto = g.vermelho_em ?? (disp ? `dispensado (${disp.dispensado_em})` : '—')
-      const motivoTexto = g.motivo ?? g.ressalva ?? disp?.motivo ?? '—'
+      const motivoTexto = g.motivo ?? g.ressalva ?? disp?.motivo ?? (nome === 'validacao_manual' && g.saida ? g.saida : '—')
       l.push(`| ${nome} | ${g.rotulo} | ${vermelhoTexto} | ${g.codigo_saida ?? '—'} | ${motivoTexto} |`)
     }
     l.push('')
@@ -255,7 +295,7 @@ function dossie(id: string, lote: Tarefa[], base: string | null, final: string |
   l.push('')
   l.push('Fatos, nao vereditos. Quem da o nivel e voce.')
   l.push('')
-  for (const f of fatosMecanicos(lote, arquivos)) l.push(`- ${f}`)
+  for (const f of fatosMecanicos(lote, arquivos, diffTotal)) l.push(`- ${f}`)
   l.push('')
   l.push('## O diff')
   l.push('')
diff --git a/.mentor/scripts/cmd-doctor.ts b/.mentor/scripts/cmd-doctor.ts
index 9a94d8a..6276a8a 100644
--- a/.mentor/scripts/cmd-doctor.ts
+++ b/.mentor/scripts/cmd-doctor.ts
@@ -10,6 +10,7 @@ import {
 } from './vistas.ts'
 import { CARACTERISTICAS } from './tipos.ts'
 import type { Caracteristica, Contexto, EstadoDaCaracteristica, Fase, MetaDeQualidade, Tarefa } from './tipos.ts'
+import { baseDoLote, loteNaoAuditado, medirDiffAcumulado } from './cmd-auditar.ts'
 
 /**
  * Folha de saude do projeto. Tres propriedades a sustentam, e as tres foram medidas em campo:
@@ -327,17 +328,30 @@ function processo(ctx: Contexto, tarefas: Tarefa[]): Linha[] {
     }
   }
 
-  // Auditoria: o doctor mede a cadencia e conta os bloqueios que ela reportou. Nao julga nada
-  // do que ela achou — julgar e' da auditoria, e ela ja' julgou em contexto novo.
+  // Auditoria: o doctor mede a cadencia (tarefas e diff acumulado) e conta os bloqueios que ela reportou.
   const concluidasParaAuditoria = tarefas.filter((t) => t.estado === 'concluida').length
   const au = ctx.auditoria
   const semAuditar = concluidasParaAuditoria - (au.ultima_na_tarefa ?? 0)
-  if (semAuditar >= au.cadencia_em_tarefas * 2) {
-    linhas.push({ estado: 'bloqueio', texto: `${semAuditar} tarefas sem auditoria, e a cadencia e ${au.cadencia_em_tarefas}. Rode: mentor auditar preparar` })
-  } else if (semAuditar >= au.cadencia_em_tarefas) {
-    linhas.push({ estado: 'atencao', texto: `${semAuditar} tarefas sem auditoria (cadencia ${au.cadencia_em_tarefas}). Rode: mentor auditar preparar` })
+  const cadenciaChars = au.cadencia_em_caracteres ?? 80_000
+  const lote = loteNaoAuditado()
+  const base = baseDoLote(ctx, lote)
+  const diffChars = medirDiffAcumulado(base)
+
+  if (semAuditar >= au.cadencia_em_tarefas * 2 || (cadenciaChars > 0 && diffChars >= cadenciaChars * 1.5)) {
+    linhas.push({
+      estado: 'bloqueio',
+      texto: `${semAuditar} tarefa(s) / ${diffChars} caracteres de diff sem auditoria (cadencias: ${au.cadencia_em_tarefas} tarefas, ${cadenciaChars} chars). Risco critico de truncamento no dossie. Rode: mentor auditar preparar`,
+    })
+  } else if (semAuditar >= au.cadencia_em_tarefas || (cadenciaChars > 0 && diffChars >= cadenciaChars)) {
+    linhas.push({
+      estado: 'atencao',
+      texto: `${semAuditar} tarefa(s) / ${diffChars} caracteres de diff sem auditoria (cadencias: ${au.cadencia_em_tarefas} tarefas, ${cadenciaChars} chars). Rode: mentor auditar preparar`,
+    })
   } else if (au.ultima_em) {
-    linhas.push({ estado: 'ok', texto: `auditoria em dia: ultima em ${au.ultima_em}, ${semAuditar} tarefa(s) desde entao` })
+    linhas.push({
+      estado: 'ok',
+      texto: `auditoria em dia: ultima em ${au.ultima_em}, ${semAuditar} tarefa(s) e ${diffChars} chars de diff desde entao`,
+    })
   }
   const bloqueiosDeAuditoria = au.pendencias_reportadas
   if (bloqueiosDeAuditoria.length) {
diff --git a/.mentor/scripts/cmd-tarefa.ts b/.mentor/scripts/cmd-tarefa.ts
index 0d420cc..f9c98f2 100644
--- a/.mentor/scripts/cmd-tarefa.ts
+++ b/.mentor/scripts/cmd-tarefa.ts
@@ -1,6 +1,6 @@
 import { spawnSync } from 'node:child_process'
 import { renameSync, rmSync } from 'node:fs'
-import { agora, caminhos, escreverJson, escreverTexto, existe, lerJson, lerTexto, listar } from './arquivos.ts'
+import { agora, caminhos, escreverJson, escreverTexto, existe, lerJson, lerTexto, listar, NOME_DOS_DOCUMENTOS } from './arquivos.ts'
 import { proximoIdDeTarefa } from './ids.ts'
 import { carregarContexto, carregarRequisitos, carregarTarefas, fixar, regenerarTudo, registrarRecusa, soltar } from './vistas.ts'
 import {
@@ -10,6 +10,7 @@ import {
 import type {
   Cerimonia, Escala, MetodoDeTeste, Requisito, Rotulo, Tarefa, TipoTarefa, Urgencia, ValorTarefa,
 } from './tipos.ts'
+import { baseDoLote, loteNaoAuditado, medirDiffAcumulado } from './cmd-auditar.ts'
 
 type Flags = Record<string, string | undefined>
 
@@ -148,6 +149,10 @@ export function iniciar(id: string): void {
   // Marca o ponto de partida no historico. Sem ele a auditoria nao consegue recortar o diff da
   // tarefa e so' sobraria "o repositorio inteiro", que e' exatamente o escopo que gera o loop.
   tarefa.commit_base = cabecaDoGit()
+  const validacaoManual = carregarContexto().gates['validacao_manual'] as { existe?: boolean } | undefined
+  if (validacaoManual?.existe === true && tarefa.validacao === 'nao_requer') {
+    tarefa.validacao = 'pendente'
+  }
   const ehSpike = tarefa.tipo === 'SPIKE'
   tarefa.plano = {
     muda: [`${MARCADOR} caminho/arquivo.ext - o que muda nele, em uma linha`],
@@ -340,7 +345,7 @@ function marcadoresEm(valor: unknown, onde: string, achados: string[]): void {
   }
 }
 
-export function finalizar(id: string): void {
+export function finalizar(id: string, flags: Flags = {}): void {
   const c = caminhos()
   const { caminho, tarefa } = localizar(id)
   const ctx = carregarContexto()
@@ -352,6 +357,45 @@ export function finalizar(id: string): void {
   marcadoresEm(tarefa.plano, 'plano', marcadores)
   if (marcadores.length) impedimentos.push(`marcador ${MARCADOR} nao preenchido em ${marcadores.join(', ')}`)
 
+  // Validação manual: atalho direto na finalização
+  if (flags['validado-por-humano']) {
+    tarefa.validacao = 'aprovado'
+    tarefa.validado_em = agora().log
+    tarefa.validacao_motivo = flags['validado-por-humano']
+    tarefa.gates['validacao_manual'] = {
+      rotulo: 'APROVADO', comando: null, codigo_saida: 0,
+      saida: flags['validado-por-humano'], executado_em: tarefa.validado_em,
+      evidencia_url: null, motivo: null, ressalva: null, vermelho_em: null,
+    }
+  } else if (flags['validacao-dispensada']) {
+    tarefa.validacao = 'dispensado'
+    tarefa.validado_em = agora().log
+    tarefa.validacao_motivo = flags.motivo ?? 'dispensada na finalizacao'
+    tarefa.gates['validacao_manual'] = {
+      rotulo: 'não se aplica', comando: null, codigo_saida: null,
+      saida: null, executado_em: tarefa.validado_em,
+      evidencia_url: null, motivo: tarefa.validacao_motivo, ressalva: null, vermelho_em: null,
+    }
+  }
+
+  // Se o projeto declara validação manual ativa, tarefa que não requer vira pendente
+  const validacaoManual = ctx.gates['validacao_manual'] as { existe?: boolean } | undefined
+  if (validacaoManual?.existe === true && tarefa.validacao === 'nao_requer') {
+    tarefa.validacao = 'pendente'
+  }
+
+  // Trava de validação manual
+  if (tarefa.validacao === 'pendente') {
+    impedimentos.push(
+      `validacao manual pendente. A conclusao exige aprovacao humana. Execute o teste manual com o usuario e registre: mentor task validar ${id} --aprovado --evidencia "..." (ou use: mentor task finalizar ${id} --validado-por-humano "...")`,
+    )
+  }
+
+  const gManual = tarefa.gates['validacao_manual']
+  if (gManual && (gManual.rotulo === 'NÃO EXECUTADO' || gManual.rotulo === 'BLOQUEADO') && !gManual.motivo) {
+    impedimentos.push('gate "validacao_manual" pendente sem aprovacao humana ou motivo de dispensa')
+  }
+
   // Todo criterio de aceite nomeia um teste. Vale em qualquer metodo, ate' em `teste-depois`.
   if (tarefa.tipo !== 'SPIKE') {
     tarefa.plano.criterios_aceite.forEach((cr, i) => {
@@ -398,6 +442,41 @@ export function finalizar(id: string): void {
     if (ROTULOS_QUE_EXIGEM_MOTIVO.includes(reg.rotulo) && !reg.motivo) impedimentos.push(`gate "${nome}" esta ${reg.rotulo} sem motivo`)
   }
 
+  // Disciplina de escopo Git vs plano.muda (AUD-001-B05: previne arquivos fantasmas)
+  if (tarefa.commit_base) {
+    const rDiff = spawnSync('git', ['diff', '--name-only', tarefa.commit_base, '--relative'], {
+      cwd: caminhos().raiz,
+      encoding: 'utf8',
+    })
+    const rUntracked = spawnSync('git', ['ls-files', '--others', '--exclude-standard'], {
+      cwd: caminhos().raiz,
+      encoding: 'utf8',
+    })
+    const diffFiles = rDiff.status === 0 && rDiff.stdout ? rDiff.stdout.split('\n') : []
+    const untrackedFiles = rUntracked.status === 0 && rUntracked.stdout ? rUntracked.stdout.split('\n') : []
+    const arquivosModificados = [...diffFiles, ...untrackedFiles].map((s) => s.trim().replace(/\\/g, '/')).filter(Boolean)
+    const declarados = new Set<string>()
+    for (const linha of tarefa.plano.muda) {
+      const arq = linha.split(/[\s:—-]/)[0]?.trim().replace(/\\/g, '/')
+      if (arq && !arq.startsWith(MARCADOR)) declarados.add(arq)
+    }
+    const ignorados = [
+      `${NOME_DOS_DOCUMENTOS}/`,
+      'docs/',
+      'docs-mentor/',
+      'package-lock.json',
+    ]
+    const naoDeclarados = arquivosModificados.filter((arq) => {
+      if (ignorados.some((ig) => arq.startsWith(ig) || arq === ig)) return false
+      return ![...declarados].some((d) => arq === d || arq.endsWith(d) || d.endsWith(arq))
+    })
+    if (naoDeclarados.length > 0) {
+      impedimentos.push(
+        `${naoDeclarados.length} arquivo(s) de codigo modificado(s) no Git fora do plano.muda: ${naoDeclarados.slice(0, 5).join(', ')}. Declare-os no plano antes de fechar a tarefa para manter o escopo rastreado (AUD-001-B05).`,
+      )
+    }
+  }
+
   if (impedimentos.length) {
     registrarRecusa('task finalizar', id, impedimentos)
     console.error(`Nao da para fechar ${id}:`)
@@ -409,11 +488,6 @@ export function finalizar(id: string): void {
   tarefa.estado = 'concluida'
   tarefa.concluida_em = agora().log
 
-  // "Smoke pendente" deixa de ser frase solta: vira estado que o doctor conta e cobra.
-  const validacaoManual = ctx.gates['validacao_manual'] as { existe?: boolean } | undefined
-  if (validacaoManual?.existe === true && tarefa.validacao === 'nao_requer') {
-    tarefa.validacao = 'pendente'
-  }
   const base = `${agora().nome}--${tarefa.id}`
   tarefa.narrativa = `${base}.md`
   escreverJson(`${c.concluidas}/${base}.json`, tarefa)
@@ -436,15 +510,18 @@ export function finalizar(id: string): void {
 
   const ctxAtualizado = regenerarTudoEDevolverContexto()
   console.log(`${id} concluida.`)
-  if (tarefa.validacao === 'pendente') {
-    console.log('Validacao manual pendente. Quando conferir: mentor task validar ' + id + ' --aprovado')
-  }
-  // A cadencia da auditoria e' contada aqui porque e' aqui que o numero muda. Avisar so' no doctor
-  // faria o lembrete depender de alguem lembrar de rodar o doctor.
+
+  // A cadencia da auditoria e' contada aqui porque e' aqui que o numero muda.
   const feitas = Number(ctxAtualizado.contagens.tarefas_concluidas ?? 0)
   const desde = feitas - (ctxAtualizado.auditoria.ultima_na_tarefa ?? 0)
-  if (desde >= ctxAtualizado.auditoria.cadencia_em_tarefas) {
-    console.log(`\n>>> ${desde} tarefas concluidas sem auditoria. Rode: node mentor.mjs auditar preparar`)
+  const cadenciaTarefas = ctxAtualizado.auditoria.cadencia_em_tarefas ?? 10
+  const cadenciaChars = ctxAtualizado.auditoria.cadencia_em_caracteres ?? 80_000
+  const lote = loteNaoAuditado()
+  const baseLote = baseDoLote(ctxAtualizado, lote)
+  const diffChars = medirDiffAcumulado(baseLote)
+
+  if (desde >= cadenciaTarefas || (cadenciaChars > 0 && diffChars >= cadenciaChars)) {
+    console.log(`\n>>> Cadencia de auditoria atingida: ${desde} tarefas concluidas sem auditoria (${diffChars} caracteres de diff acumulados, limite ${cadenciaChars}). Rode: node mentor.mjs auditar preparar`)
     console.log('    O dossie vai para uma sessao NOVA de IA. Quem escreve nao aprova.')
   }
 }
@@ -476,15 +553,38 @@ export function validar(id: string, flags: Flags): void {
   const { caminho, tarefa } = localizar(id)
   if (flags.aprovado) {
     tarefa.validacao = 'aprovado'
-    tarefa.validacao_motivo = null
+    tarefa.validacao_motivo = flags.evidencia ?? flags.motivo ?? null
+    tarefa.validado_em = agora().log
+    tarefa.gates['validacao_manual'] = {
+      rotulo: 'APROVADO',
+      comando: null,
+      codigo_saida: 0,
+      saida: tarefa.validacao_motivo ?? 'Validado e aprovado pelo humano.',
+      executado_em: tarefa.validado_em,
+      evidencia_url: flags.url ?? null,
+      motivo: null,
+      ressalva: null,
+      vermelho_em: null,
+    }
   } else if (flags.dispensado) {
     if (!flags.motivo) throw new Error('Dispensar validacao exige --motivo.')
     tarefa.validacao = 'dispensado'
     tarefa.validacao_motivo = flags.motivo
+    tarefa.validado_em = agora().log
+    tarefa.gates['validacao_manual'] = {
+      rotulo: 'não se aplica',
+      comando: null,
+      codigo_saida: null,
+      saida: null,
+      executado_em: tarefa.validado_em,
+      evidencia_url: null,
+      motivo: flags.motivo,
+      ressalva: null,
+      vermelho_em: null,
+    }
   } else {
-    throw new Error('Use --aprovado ou --dispensado --motivo "...".')
+    throw new Error('Use --aprovado [--evidencia "..."] ou --dispensado --motivo "...".')
   }
-  tarefa.validado_em = agora().log
   escreverJson(caminho, tarefa)
   regenerarTudo()
   console.log(`${id} · validacao ${tarefa.validacao}.`)
diff --git a/.mentor/scripts/tipos.ts b/.mentor/scripts/tipos.ts
index 0fdf0a8..16f873a 100644
--- a/.mentor/scripts/tipos.ts
+++ b/.mentor/scripts/tipos.ts
@@ -281,6 +281,7 @@ export interface Contexto {
   lembretes: string[]
   auditoria: {
     cadencia_em_tarefas: number
+    cadencia_em_caracteres?: number
     ultima_em: string | null
     /** Quantas tarefas estavam concluidas quando a ultima auditoria foi registrada. */
     ultima_na_tarefa: number | null
diff --git a/docs-mentor/tarefas/abertas/TASK-BG-019.json b/docs-mentor/tarefas/abertas/TASK-BG-019.json
new file mode 100644
index 0000000..9df7a63
--- /dev/null
+++ b/docs-mentor/tarefas/abertas/TASK-BG-019.json
@@ -0,0 +1,44 @@
+{
+  "id": "TASK-BG-019",
+  "tipo": "BG",
+  "titulo": "Respeitar as restricoes de conversao do OSM (no_* e only_*) no roteamento veicular",
+  "fatia_de": null,
+  "estado": "aberta",
+  "cerimonia": "Standard",
+  "valor": "importante",
+  "urgencia": "normal",
+  "esforco": {
+    "humano": "M",
+    "ia": "G"
+  },
+  "depende_de": [],
+  "fila": "reserva",
+  "ordem": null,
+  "origem": "titulo-autossuficiente",
+  "requisitos": [],
+  "sem_requisito_motivo": null,
+  "criada_em": "12/09/26 23:36",
+  "iniciada_em": null,
+  "commit_base": null,
+  "concluida_em": null,
+  "plano": {
+    "muda": [],
+    "criterios_aceite": [],
+    "impacto": null,
+    "riscos": [],
+    "dependencias_novas": [],
+    "proporcionalidade": null
+  },
+  "gates": {},
+  "achados": [],
+  "validacao": "nao_requer",
+  "validado_em": null,
+  "validacao_motivo": null,
+  "tarefas_geradas": [],
+  "adrs": [],
+  "divida_tecnica": [],
+  "riscos_aceitos": [],
+  "absorvida_por": null,
+  "cancelamento_motivo": null,
+  "narrativa": null
+}
diff --git a/docs-mentor/tarefas/abertas/TASK-BG-020.json b/docs-mentor/tarefas/abertas/TASK-BG-020.json
new file mode 100644
index 0000000..bf9b079
--- /dev/null
+++ b/docs-mentor/tarefas/abertas/TASK-BG-020.json
@@ -0,0 +1,44 @@
+{
+  "id": "TASK-BG-020",
+  "tipo": "BG",
+  "titulo": "Sumario carregar a malha viaria com o ponto inicial, igual ao mapa",
+  "fatia_de": null,
+  "estado": "aberta",
+  "cerimonia": "Standard",
+  "valor": "importante",
+  "urgencia": "normal",
+  "esforco": {
+    "humano": "P",
+    "ia": "P"
+  },
+  "depende_de": [],
+  "fila": "reserva",
+  "ordem": null,
+  "origem": "titulo-autossuficiente",
+  "requisitos": [],
+  "sem_requisito_motivo": null,
+  "criada_em": "12/09/26 23:54",
+  "iniciada_em": null,
+  "commit_base": null,
+  "concluida_em": null,
+  "plano": {
+    "muda": [],
+    "criterios_aceite": [],
+    "impacto": null,
+    "riscos": [],
+    "dependencias_novas": [],
+    "proporcionalidade": null
+  },
+  "gates": {},
+  "achados": [],
+  "validacao": "nao_requer",
+  "validado_em": null,
+  "validacao_motivo": null,
+  "tarefas_geradas": [],
+  "adrs": [],
+  "divida_tecnica": [],
+  "riscos_aceitos": [],
+  "absorvida_por": null,
+  "cancelamento_motivo": null,
+  "narrativa": null
+}
diff --git a/docs-mentor/tarefas/concluidas/2026-09-12--06h08--TASK-BG-017.json b/docs-mentor/tarefas/concluidas/2026-09-12--06h08--TASK-BG-017.json
new file mode 100644
index 0000000..2f84889
--- /dev/null
+++ b/docs-mentor/tarefas/concluidas/2026-09-12--06h08--TASK-BG-017.json
@@ -0,0 +1,107 @@
+{
+  "id": "TASK-BG-017",
+  "tipo": "BG",
+  "titulo": "titulo-autossuficiente: Adicionar keywords ausentes na classificacao comercial/residencial a partir de romaneios reais (edificio, zelador, emporio, drogarias, sobreloja, grill, vitrine, teatro, tech)",
+  "fatia_de": null,
+  "estado": "concluida",
+  "cerimonia": "Standard",
+  "valor": "importante",
+  "urgencia": "normal",
+  "esforco": {
+    "humano": "P",
+    "ia": "P"
+  },
+  "depende_de": [],
+  "fila": "ciclo",
+  "ordem": null,
+  "origem": "titulo-autossuficiente",
+  "requisitos": [],
+  "sem_requisito_motivo": null,
+  "criada_em": "12/09/26 05:53",
+  "iniciada_em": "12/09/26 05:53",
+  "commit_base": "8f4b23a971d419076a2571c82dce0ef37bfabe0f",
+  "concluida_em": "12/09/26 06:08",
+  "plano": {
+    "muda": [
+      "src/constants/keywords.ts - adicionar \"edificio\" e \"zelador\" a residentialRaw; adicionar \"tech\", \"emporio\", \"sobreloja\", \"drogarias\", \"grill\", \"vitrine\" e \"teatro\" a commercialRaw",
+      "src/__tests__/utils/inferLocationType.test.ts - novos casos cobrindo os 9 termos novos, incluindo o gap de \"drogarias\" (plural) nao bater com \"drogaria\""
+    ],
+    "criterios_aceite": [
+      {
+        "texto": "Endereco cujo complemento contem cada um dos 9 termos novos e classificado como HOME_CORRECTED ou OFFICE_CORRECTED, conforme a lista",
+        "teste": "inferLocationType.test.ts > \"detects keywords added from real romaneio analysis (TASK-BG-017)\""
+      },
+      {
+        "texto": "\"drogarias\" (plural) e reconhecido como comercial, corrigindo a lacuna de correspondencia exata com \"drogaria\" (singular)",
+        "teste": "inferLocationType.test.ts > mesmo bloco acima, caso especifico de plural"
+      }
+    ],
+    "impacto": "src/utils/inferLocationType.ts (consumidor das listas via COMMERCIAL_KEYWORDS/RESIDENTIAL_KEYWORDS), Sumario (countCommercialAddresses) e coluna \"Horario Comercial?\" na UI",
+    "riscos": [
+      "Termos ambiguos levantados na mesma varredura (andar, recepcao, administracao, studio, garagem, subsolo, vigilante) ficaram de fora por decisao do mantenedor humano, para nao arriscar falso positivo (ex.: \"andar\" na lista residencial capturaria enderecos comerciais tipo \"andar 5, sala 302\" antes da checagem de sala). Registrado como observacao, nao como pendencia bloqueante."
+    ],
+    "dependencias_novas": [],
+    "proporcionalidade": "Pediram para commitar uma keyword esquecida (\"tech\"); ao revisar os romaneios reais para justifica-la, o mantenedor pediu para levantar outras palavras faltantes na mesma varredura de dados. O tamanho da mudanca - 9 palavras somadas a duas listas ja existentes, sem novo arquivo, modulo ou mecanismo - e proporcional ao pedido original."
+  },
+  "gates": {
+    "testes": {
+      "rotulo": "APROVADO",
+      "vermelho_em": "12/09/26 06:01",
+      "comando": "npm run test",
+      "codigo_saida": 0,
+      "saida": "> eu-roteirizo@0.1.0 test\n> vitest run\n\n\n RUN  v4.1.11 E:/repositorios/projetos-pessoais/pilotos/teste-mentor-comagenteantigo\n\n\n Test Files  80 passed (80)\n      Tests  937 passed (937)\n   Start at  06:04:25\n   Duration  35.79s (transform 10.83s, setup 29.11s, import 22.11s, tests 68.05s, environment 114.56s)\n\n(node:34312) Warning: `--localstorage-file` was provided without a valid path\n(Use `node --trace-warnings ...` to show where the warning was created)",
+      "executado_em": "12/09/26 06:05",
+      "evidencia_url": null,
+      "motivo": null,
+      "ressalva": null,
+      "vermelho_dispensado": null
+    },
+    "tipos": {
+      "rotulo": "APROVADO",
+      "vermelho_em": null,
+      "comando": "npm run typecheck",
+      "codigo_saida": 0,
+      "saida": "> eu-roteirizo@0.1.0 typecheck\n> tsc -b",
+      "executado_em": "12/09/26 06:05",
+      "evidencia_url": null,
+      "motivo": null,
+      "ressalva": null,
+      "vermelho_dispensado": null
+    },
+    "lint": {
+      "rotulo": "APROVADO",
+      "vermelho_em": null,
+      "comando": "npm run lint",
+      "codigo_saida": 0,
+      "saida": "> eu-roteirizo@0.1.0 lint\n> eslint .",
+      "executado_em": "12/09/26 06:05",
+      "evidencia_url": null,
+      "motivo": null,
+      "ressalva": null,
+      "vermelho_dispensado": null
+    },
+    "build": {
+      "rotulo": "APROVADO",
+      "vermelho_em": null,
+      "comando": "npm run build",
+      "codigo_saida": 0,
+      "saida": "> eu-roteirizo@0.1.0 build\n> tsc -b && vite build\n\n\u001b[36mvite v7.3.5 \u001b[32mbuilding client environment for production...\u001b[36m\u001b[39m\ntransforming...\n\u001b[32m✓\u001b[39m 1999 modules transformed.\nrendering chunks...\ncomputing gzip size...\n\u001b[2mdist/\u001b[22m\u001b[32mregisterSW.js               \u001b[39m\u001b[1m\u001b[2m  0.13 kB\u001b[22m\u001b[1m\u001b[22m\n\u001b[2mdist/\u001b[22m\u001b[32mmanifest.webmanifest        \u001b[39m\u001b[1m\u001b[2m  0.75 kB\u001b[22m\u001b[1m\u001b[22m\n\u001b[2mdist/\u001b[22m\u001b[32mindex.html                  \u001b[39m\u001b[1m\u001b[2m  2.79 kB\u001b[22m\u001b[1m\u001b[22m\u001b[2m │ gzip:   1.15 kB\u001b[22m\n\u001b[2mdist/\u001b[22m\u001b[35massets/vendor-Dgihpmma.css  \u001b[39m\u001b[1m\u001b[2m 15.04 kB\u001b[22m\u001b[1m\u001b[22m\u001b[2m │ gzip:   6.38 kB\u001b[22m\n\u001b[2mdist/\u001b[22m\u001b[35massets/index-CYMBXH50.css   \u001b[39m\u001b[1m\u001b[2m 28.24 kB\u001b[22m\u001b[1m\u001b[22m\u001b[2m │ gzip:   6.22 kB\u001b[22m\n\u001b[2mdist/\u001b[22m\u001b[36massets/index-BzC2nj7O.js    \u001b[39m\u001b[1m\u001b[33m539.65 kB\u001b[39m\u001b[22m\u001b[2m │ gzip: 103.76 kB\u001b[22m\n\u001b[2mdist/\u001b[22m\u001b[36massets/vendor-BH0bsWaq.js   \u001b[39m\u001b[1m\u001b[33m808.69 kB\u001b[39m\u001b[22m\u001b[2m │ gzip: 263.08 kB\u001b[22m\n\u001b[32m✓ built in 6.14s\u001b[39m\n\nPWA v1.2.0\nmode      generateSW\nprecache  19 entries (1798.40 KiB)\nfiles generated\n  dist/sw.js\n  dist/workbox-9c191d2f.js\n\u001b[33m\n(!) Some chunks are larger than 500 kB after minification. Consider:\n- Using dynamic import() to code-split the application\n- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks\n- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.\u001b[39m",
+      "executado_em": "12/09/26 06:05",
+      "evidencia_url": null,
+      "motivo": null,
+      "ressalva": null,
+      "vermelho_dispensado": null
+    }
+  },
+  "achados": [],
+  "validacao": "dispensado",
+  "validado_em": "12/09/26 06:08",
+  "validacao_motivo": "Funcao pura (inferLocationType), sem UI/layout, persistencia ou calculo de rota envolvidos; testes unitarios cobrem exatamente os textos reais levantados na varredura de romaneios que motivaram cada palavra nova.",
+  "tarefas_geradas": [],
+  "adrs": [],
+  "divida_tecnica": [],
+  "riscos_aceitos": [],
+  "absorvida_por": null,
+  "cancelamento_motivo": null,
+  "narrativa": "2026-09-12--06h08--TASK-BG-017.md"
+}
diff --git a/docs-mentor/tarefas/concluidas/2026-09-12--06h08--TASK-BG-017.md b/docs-mentor/tarefas/concluidas/2026-09-12--06h08--TASK-BG-017.md
new file mode 100644
index 0000000..2aeb7f6
--- /dev/null
+++ b/docs-mentor/tarefas/concluidas/2026-09-12--06h08--TASK-BG-017.md
@@ -0,0 +1,38 @@
+# TASK-BG-017 · titulo-autossuficiente: Adicionar keywords ausentes na classificacao comercial/residencial a partir de romaneios reais (edificio, zelador, emporio, drogarias, sobreloja, grill, vitrine, teatro, tech)
+
+## Decisoes tomadas
+A tarefa nasceu de um esquecimento: um commit anterior (`tech` em `commercialRaw`) tinha ficado sem
+subir. Em vez de so' commitar a palavra solta, rodei uma analise de frequencia de palavras sobre os
+20 romaneios REAIS em `__utilidades-back-office__/romaneios/` (1.515 linhas, 1.186 complementos),
+via script local descartavel (nunca commitado, nunca expos endereco/nome completo — so contagem por
+palavra). Cruzei o ranking com as duas listas atuais e separei em: claramente comercial, claramente
+residencial, e ambiguo. O humano decidiu deixar TODO o grupo ambiguo de fora (andar, recepcao,
+administracao, studio, garagem, subsolo, vigilante) — ficam registrados como observacao, nao como
+pendencia. Adicionadas 7 palavras a `commercialRaw` (tech, emporio, sobreloja, drogarias, grill,
+vitrine, teatro) e 2 a `residentialRaw` (edificio, zelador).
+
+Validacao manual dispensada (motivo registrado no gate): funcao pura, sem UI/layout, persistencia ou
+calculo de rota; os testes novos usam exatamente os textos que motivaram cada palavra.
+
+## O que nao foi feito, e por que
+As palavras ambiguas levantadas na mesma varredura (andar, recepcao, administracao, studio, garagem,
+subsolo, vigilante) nao entraram: cada uma aparece tanto em contexto residencial quanto comercial nos
+romaneios reais, e nao ha' dado suficiente para decidir sem risco de falso positivo. Ficam como
+observacao para uma tarefa futura, se mais dados aparecerem.
+
+## Testes de descoberta
+Ao escrever o teste de "emporio", o primeiro exemplo (`"Empório da Vila"`) dava falso residencial:
+a palavra `vila` ja' esta' em `residentialRaw`, e a checagem residencial roda ANTES da comercial em
+`inferLocationType`. Troquei o exemplo para `"Empório Central"`. Isso e' o mesmo mecanismo que fez o
+grupo ambiguo (ex.: `andar`) ser descartado: qualquer palavra nova pode colidir com uma keyword ja'
+existente da lista oposta, e so' aparece testando com uma frase realista, nao so' a palavra isolada.
+
+Tambem descobri, so' ao rodar a analise, que `drogarias` (plural) nunca batia com `drogaria`
+(singular) porque a checagem e' por palavra inteira, sem stemming — corrigido adicionando o plural
+como entrada propria.
+
+## Aprendizados
+Ao propor uma keyword nova, testar a FRASE completa que motivou o pedido (nao so' a palavra isolada)
+pega colisao com a lista oposta antes de virar bug em producao. E util rodar a mesma analise de
+frequencia periodicamente contra romaneios novos — o proximo lote de dados reais pode transformar
+parte do grupo "ambiguo" de hoje em "claramente X" amanha, com mais volume.
diff --git a/docs-mentor/tarefas/concluidas/2026-09-12--06h20--TASK-CHORE-016.json b/docs-mentor/tarefas/concluidas/2026-09-12--06h20--TASK-CHORE-016.json
new file mode 100644
index 0000000..0bd8599
--- /dev/null
+++ b/docs-mentor/tarefas/concluidas/2026-09-12--06h20--TASK-CHORE-016.json
@@ -0,0 +1,119 @@
+{
+  "id": "TASK-CHORE-016",
+  "tipo": "CHORE",
+  "titulo": "titulo-autossuficiente: Atualizar mentor-agent para v0.5.0",
+  "fatia_de": null,
+  "estado": "concluida",
+  "cerimonia": "Standard",
+  "valor": "desejavel",
+  "urgencia": "normal",
+  "esforco": {
+    "humano": "P",
+    "ia": "P"
+  },
+  "depende_de": [],
+  "fila": "ciclo",
+  "ordem": null,
+  "origem": "titulo-autossuficiente",
+  "requisitos": [],
+  "sem_requisito_motivo": null,
+  "criada_em": "12/09/26 06:15",
+  "iniciada_em": "12/09/26 06:15",
+  "commit_base": "d3a6cb2b3b75f7e01c302518adf0bf2a7a829b34",
+  "concluida_em": "12/09/26 06:20",
+  "plano": {
+    "muda": [
+      "package.json / package-lock.json - mentor-agent github:thiagoroddev/mentor-agent#v0.4.0 -> #v0.5.0",
+      "docs-mentor/contexto.json - versao_do_pacote 0.5.0 e auditoria.cadencia_em_caracteres: 80000 (novo campo do pacote)",
+      ".mentor/* - reinstalado via 'npx mentor instalar --forcar' (mesmo padrao da TASK-CHORE-015 para v0.4.0)",
+      ".gitignore - adicionar .claude/ (config local da ferramenta Claude Code, achado durante o fechamento; nao pertence ao codigo do app)"
+    ],
+    "criterios_aceite": [
+      {
+        "texto": "node mentor.mjs doctor roda sem bloqueio apos a atualizacao",
+        "teste": "nao se aplica: verificacao operacional via CLI, nao ha teste automatizado para o pacote mentor-agent em si"
+      }
+    ],
+    "impacto": "Nenhum modulo de src/ afetado; escopo restrito ao pacote de processo (.mentor/) e config de contexto (docs-mentor/contexto.json)",
+    "riscos": [
+      "nenhum identificado - mesma operacao mecanica ja validada na TASK-CHORE-015 (v0.4.0)"
+    ],
+    "dependencias_novas": [],
+    "proporcionalidade": "Pedido explicito do humano ('Atualize o mentor', com o comando npm exato). Dependencia de desenvolvimento e Light pela lista fechada do nucleo; esta tarefa existe so' para satisfazer o hook mecanico de pre-push, que exige ID de tarefa em qualquer commit tocando package.json/package-lock.json, mesmo em chore Light."
+  },
+  "gates": {
+    "tipos": {
+      "rotulo": "APROVADO",
+      "vermelho_em": null,
+      "comando": "npm run typecheck",
+      "codigo_saida": 0,
+      "saida": "> eu-roteirizo@0.1.0 typecheck\n> tsc -b",
+      "executado_em": "12/09/26 06:16",
+      "evidencia_url": null,
+      "motivo": null,
+      "ressalva": null,
+      "vermelho_dispensado": null
+    },
+    "lint": {
+      "rotulo": "APROVADO",
+      "vermelho_em": null,
+      "comando": "npm run lint",
+      "codigo_saida": 0,
+      "saida": "> eu-roteirizo@0.1.0 lint\n> eslint .",
+      "executado_em": "12/09/26 06:16",
+      "evidencia_url": null,
+      "motivo": null,
+      "ressalva": null,
+      "vermelho_dispensado": null
+    },
+    "testes": {
+      "rotulo": "APROVADO",
+      "vermelho_em": null,
+      "comando": "npm run test",
+      "codigo_saida": 0,
+      "saida": "> eu-roteirizo@0.1.0 test\n> vitest run\n\n\n RUN  v4.1.11 E:/repositorios/projetos-pessoais/pilotos/teste-mentor-comagenteantigo\n\n\n Test Files  80 passed (80)\n      Tests  934 passed (934)\n   Start at  06:19:51\n   Duration  36.88s (transform 14.53s, setup 30.72s, import 25.90s, tests 68.95s, environment 120.46s)\n\n(node:14552) Warning: `--localstorage-file` was provided without a valid path\n(Use `node --trace-warnings ...` to show where the warning was created)",
+      "executado_em": "12/09/26 06:20",
+      "evidencia_url": null,
+      "motivo": null,
+      "ressalva": null,
+      "vermelho_dispensado": {
+        "dispensado_em": "12/09/26 06:20",
+        "motivo": "Nao ha regra de negocio ou codigo de aplicacao (src/) alterado nesta tarefa - e apenas bump de dependencia de processo (mentor-agent) e config de contexto. Sem producao para mutar, prova por mutacao nao se aplica; os 934 testes existentes passam inalterados porque nada que eles cobrem mudou."
+      }
+    },
+    "build": {
+      "rotulo": "APROVADO",
+      "vermelho_em": null,
+      "comando": "npm run build",
+      "codigo_saida": 0,
+      "saida": "> eu-roteirizo@0.1.0 build\n> tsc -b && vite build\n\n\u001b[36mvite v7.3.5 \u001b[32mbuilding client environment for production...\u001b[36m\u001b[39m\ntransforming...\n\u001b[32m✓\u001b[39m 1999 modules transformed.\nrendering chunks...\ncomputing gzip size...\n\u001b[2mdist/\u001b[22m\u001b[32mregisterSW.js               \u001b[39m\u001b[1m\u001b[2m  0.13 kB\u001b[22m\u001b[1m\u001b[22m\n\u001b[2mdist/\u001b[22m\u001b[32mmanifest.webmanifest        \u001b[39m\u001b[1m\u001b[2m  0.75 kB\u001b[22m\u001b[1m\u001b[22m\n\u001b[2mdist/\u001b[22m\u001b[32mindex.html                  \u001b[39m\u001b[1m\u001b[2m  2.79 kB\u001b[22m\u001b[1m\u001b[22m\u001b[2m │ gzip:   1.15 kB\u001b[22m\n\u001b[2mdist/\u001b[22m\u001b[35massets/vendor-Dgihpmma.css  \u001b[39m\u001b[1m\u001b[2m 15.04 kB\u001b[22m\u001b[1m\u001b[22m\u001b[2m │ gzip:   6.38 kB\u001b[22m\n\u001b[2mdist/\u001b[22m\u001b[35massets/index-CYMBXH50.css   \u001b[39m\u001b[1m\u001b[2m 28.24 kB\u001b[22m\u001b[1m\u001b[22m\u001b[2m │ gzip:   6.22 kB\u001b[22m\n\u001b[2mdist/\u001b[22m\u001b[36massets/index-Cw_g709b.js    \u001b[39m\u001b[1m\u001b[33m539.56 kB\u001b[39m\u001b[22m\u001b[2m │ gzip: 103.73 kB\u001b[22m\n\u001b[2mdist/\u001b[22m\u001b[36massets/vendor-BH0bsWaq.js   \u001b[39m\u001b[1m\u001b[33m808.69 kB\u001b[39m\u001b[22m\u001b[2m │ gzip: 263.08 kB\u001b[22m\n\u001b[32m✓ built in 5.79s\u001b[39m\n\nPWA v1.2.0\nmode      generateSW\nprecache  19 entries (1798.31 KiB)\nfiles generated\n  dist/sw.js\n  dist/workbox-9c191d2f.js\n\u001b[33m\n(!) Some chunks are larger than 500 kB after minification. Consider:\n- Using dynamic import() to code-split the application\n- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks\n- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.\u001b[39m",
+      "executado_em": "12/09/26 06:17",
+      "evidencia_url": null,
+      "motivo": null,
+      "ressalva": null,
+      "vermelho_dispensado": null
+    },
+    "validacao_manual": {
+      "rotulo": "não se aplica",
+      "comando": null,
+      "codigo_saida": null,
+      "saida": null,
+      "executado_em": "12/09/26 06:17",
+      "evidencia_url": null,
+      "motivo": "Atualizacao mecanica de ferramenta de processo (mentor-agent), sem alteracao em src/; nenhum modulo de aplicacao ou UI tocado. Mesma operacao ja validada na TASK-CHORE-015 (v0.4.0).",
+      "ressalva": null,
+      "vermelho_em": null
+    }
+  },
+  "achados": [],
+  "validacao": "dispensado",
+  "validado_em": "12/09/26 06:17",
+  "validacao_motivo": "Atualizacao mecanica de ferramenta de processo (mentor-agent), sem alteracao em src/; nenhum modulo de aplicacao ou UI tocado. Mesma operacao ja validada na TASK-CHORE-015 (v0.4.0).",
+  "tarefas_geradas": [],
+  "adrs": [],
+  "divida_tecnica": [],
+  "riscos_aceitos": [],
+  "absorvida_por": null,
+  "cancelamento_motivo": null,
+  "narrativa": "2026-09-12--06h20--TASK-CHORE-016.md"
+}
diff --git a/docs-mentor/tarefas/concluidas/2026-09-12--06h20--TASK-CHORE-016.md b/docs-mentor/tarefas/concluidas/2026-09-12--06h20--TASK-CHORE-016.md
new file mode 100644
index 0000000..fbaf8ba
--- /dev/null
+++ b/docs-mentor/tarefas/concluidas/2026-09-12--06h20--TASK-CHORE-016.md
@@ -0,0 +1,28 @@
+# TASK-CHORE-016 · titulo-autossuficiente: Atualizar mentor-agent para v0.5.0
+
+## Decisoes tomadas
+Repete o padrao da TASK-CHORE-015 (v0.4.0): `npm i -D github:thiagoroddev/mentor-agent#v0.5.0`,
+depois `npx mentor instalar --forcar` para sincronizar `.mentor/` e `node mentor.mjs gerar`. O novo
+campo `auditoria.cadencia_em_caracteres` (padrao do pacote: 80000) foi adotado por decisao do
+mantenedor, em vez de ficar como campo nulo.
+
+Esta tarefa foi criada de forma RETROATIVA: a atualizacao ja tinha sido feita e aprovada pelo humano
+(portao 1 e 2 do nucleo, em turno anterior da conversa) antes de eu perceber que o hook de pre-push
+exige ID de tarefa em qualquer commit tocando `package.json`/`package-lock.json`, mesmo sendo uma
+dependencia de desenvolvimento (Light pela lista fechada do nucleo). A tarefa existe so' para dar
+rastreabilidade honesta ao commit, em vez de forjar um `chore(algo-generico):` que passaria pelo
+regex do hook sem apontar para nada real.
+
+## O que nao foi feito, e por que
+Nada ficou de fora: e' so' a atualizacao mecanica do pacote de processo.
+
+## Testes de descoberta
+O hook de pre-push aceita QUALQUER `tipo(parenteses): descricao` como se fosse ID de tarefa — o
+regex nao confere se o conteudo entre parenteses e' uma TASK-ID real. E' um gate que existe e checa
+menos do que parece (nucleo §6, item 5): reportado, nao explorado.
+
+## Aprendizados
+Dependencia Light ainda assim precisa de tarefa registrada quando toca `package.json`/
+`package-lock.json`, porque o hook mecanico nao distingue ceremonia — so' olha extensao/caminho do
+arquivo. Da' pra assumir de saida, na proxima atualizacao de pacote: criar a tarefa ANTES de commitar,
+nao depois do push falhar.
diff --git a/docs-mentor/tarefas/concluidas/2026-09-12--23h55--TASK-BG-018.json b/docs-mentor/tarefas/concluidas/2026-09-12--23h55--TASK-BG-018.json
new file mode 100644
index 0000000..4bd6576
--- /dev/null
+++ b/docs-mentor/tarefas/concluidas/2026-09-12--23h55--TASK-BG-018.json
@@ -0,0 +1,142 @@
+{
+  "id": "TASK-BG-018",
+  "tipo": "BG",
+  "titulo": "Rota desenhava conversao proibida porque a malha baixada recortava o retorno legal",
+  "fatia_de": null,
+  "estado": "concluida",
+  "cerimonia": "Standard",
+  "valor": "importante",
+  "urgencia": "imediata",
+  "esforco": {
+    "humano": "P",
+    "ia": "M"
+  },
+  "depende_de": [],
+  "fila": "ciclo",
+  "ordem": null,
+  "origem": "titulo-autossuficiente",
+  "requisitos": [],
+  "sem_requisito_motivo": null,
+  "criada_em": "12/09/26 22:45",
+  "iniciada_em": "12/09/26 23:35",
+  "commit_base": "2f5ad7887c38490a7622d9cd73302a2dcd02064f",
+  "concluida_em": "12/09/26 23:55",
+  "plano": {
+    "muda": [
+      "src/hooks/useRoadGraph.ts - margem da malha em volta dos pontos passa de 300m para 600m, para a malha alcancar o retorno legal mais proximo",
+      "src/__tests__/hooks/useRoadGraph.test.tsx - novo teste: o bbox pedido cobre ao menos 600m em volta do envelope dos pontos"
+    ],
+    "criterios_aceite": [
+      {
+        "texto": "A malha viaria pedida cobre ao menos 600m alem do envelope dos pontos, nas quatro direcoes.",
+        "teste": "src/__tests__/hooks/useRoadGraph.test.tsx > cobre ao menos 600 m em volta dos pontos, para alcancar retornos legais fora do envelope"
+      },
+      {
+        "texto": "No romaneio real (Av. Epitacio Pessoa 2224 -> 2556), o tracado entre as duas paradas segue Henrique Dodsworth -> Praca Eugenio Jardim -> volta, como no Google Maps, sem a conversao proibida em V.",
+        "teste": "nao se aplica como assercao automatizada: depende da malha OSM ao vivo. Simulacao registrada nos achados; conferencia na validacao manual."
+      }
+    ],
+    "problema_canonico": "Recorte da area de busca (subgrafo carregado) em roteamento veicular com restricoes de conversao: o caminho legal otimo sai do subgrafo e so sobram manobras proibidas. Roteadores de producao carregam a malha por regiao inteira (particoes/tiles) para nao recortar desvios legais.",
+    "discordancia": {
+      "o_que_faria_diferente": "Respeitar as relacoes de restricao de conversao do OSM e proibir retorno no meio da quadra. Isso barra o V sempre que o contorno legal estiver na malha, sem depender de acertar a margem. Registrado como TASK-BG-019 por mexer na consulta, no formato do cache e no A*.",
+      "o_que_preocupa": "600m e margem empirica: resolve este caso com folga (o limite medido ficou entre 300m e 450m), mas um retorno legal mais distante volta a ser recortado. Tambem aumenta a area baixada (~65%) e os nos do grafo (~74%) na primeira abertura de cada roteiro.",
+      "o_que_existe_pronto_80_porcento": "OSRM, GraphHopper e Valhalla carregam a malha por regiao e aplicam as restricoes do OSM; nenhum e adotavel sem trocar o motor local (ADR-002)."
+    },
+    "impacto": "Malha carregada pelo mapa (MapPage) e pelo Sumario (SummaryPage), ambos via useRoadGraph; todas as rotas veiculares e circuitos a pe calculados sobre ela. A chave do cache muda (bbox maior), entao cada roteiro baixa a malha de novo uma vez.",
+    "riscos": [
+      "Area maior pesa mais no Overpass/proxy e no aparelho: 4,69 -> 7,74 km2 e 2.536 -> 4.418 nos no romaneio de teste.",
+      "Margem empirica: retorno legal alem de 600m continua recortado; a mitigacao estrutural e a TASK-BG-019.",
+      "Rotas ja montadas podem mudar de tracado e distancia ao reabrir, porque a malha maior encontra caminhos legais que antes ficavam de fora."
+    ],
+    "dependencias_novas": [],
+    "proporcionalidade": "Pediram o tracado igual ao do Google entre duas paradas; proponho mudar uma constante e cobrir com um teste. E do tamanho do pedido porque a simulacao mostrou que, com a malha completa, o algoritmo atual ja escolhe a rota certa; o conserto estrutural (restricoes do OSM) virou tarefa propria, a TASK-BG-019."
+  },
+  "gates": {
+    "testes": {
+      "rotulo": "APROVADO",
+      "vermelho_em": "12/09/26 23:38",
+      "comando": "npm run test",
+      "codigo_saida": 0,
+      "saida": "> eu-roteirizo@0.1.0 test\n> vitest run\n\n\n RUN  v4.1.11 E:/repositorios/projetos-pessoais/pilotos/teste-mentor-comagenteantigo\n\n\n Test Files  80 passed (80)\n      Tests  946 passed (946)\n   Start at  23:38:32\n   Duration  38.87s (transform 17.23s, setup 42.27s, import 32.53s, tests 65.29s, environment 164.12s)\n\n(node:35072) Warning: `--localstorage-file` was provided without a valid path\n(Use `node --trace-warnings ...` to show where the warning was created)",
+      "executado_em": "12/09/26 23:39",
+      "evidencia_url": null,
+      "motivo": null,
+      "ressalva": null,
+      "vermelho_dispensado": null
+    },
+    "tipos": {
+      "rotulo": "APROVADO",
+      "vermelho_em": null,
+      "comando": "npm run typecheck",
+      "codigo_saida": 0,
+      "saida": "> eu-roteirizo@0.1.0 typecheck\n> tsc -b",
+      "executado_em": "12/09/26 23:39",
+      "evidencia_url": null,
+      "motivo": null,
+      "ressalva": null,
+      "vermelho_dispensado": null
+    },
+    "lint": {
+      "rotulo": "APROVADO",
+      "vermelho_em": null,
+      "comando": "npm run lint",
+      "codigo_saida": 0,
+      "saida": "> eu-roteirizo@0.1.0 lint\n> eslint .",
+      "executado_em": "12/09/26 23:39",
+      "evidencia_url": null,
+      "motivo": null,
+      "ressalva": null,
+      "vermelho_dispensado": null
+    },
+    "build": {
+      "rotulo": "APROVADO",
+      "vermelho_em": null,
+      "comando": "npm run build",
+      "codigo_saida": 0,
+      "saida": "> eu-roteirizo@0.1.0 build\n> tsc -b && vite build\n\n\u001b[36mvite v7.3.5 \u001b[32mbuilding client environment for production...\u001b[36m\u001b[39m\ntransforming...\n\u001b[32m✓\u001b[39m 1999 modules transformed.\nrendering chunks...\ncomputing gzip size...\n\u001b[2mdist/\u001b[22m\u001b[32mregisterSW.js               \u001b[39m\u001b[1m\u001b[2m  0.13 kB\u001b[22m\u001b[1m\u001b[22m\n\u001b[2mdist/\u001b[22m\u001b[32mmanifest.webmanifest        \u001b[39m\u001b[1m\u001b[2m  0.75 kB\u001b[22m\u001b[1m\u001b[22m\n\u001b[2mdist/\u001b[22m\u001b[32mindex.html                  \u001b[39m\u001b[1m\u001b[2m  2.79 kB\u001b[22m\u001b[1m\u001b[22m\u001b[2m │ gzip:   1.15 kB\u001b[22m\n\u001b[2mdist/\u001b[22m\u001b[35massets/vendor-Dgihpmma.css  \u001b[39m\u001b[1m\u001b[2m 15.04 kB\u001b[22m\u001b[1m\u001b[22m\u001b[2m │ gzip:   6.38 kB\u001b[22m\n\u001b[2mdist/\u001b[22m\u001b[35massets/index-CYMBXH50.css   \u001b[39m\u001b[1m\u001b[2m 28.24 kB\u001b[22m\u001b[1m\u001b[22m\u001b[2m │ gzip:   6.22 kB\u001b[22m\n\u001b[2mdist/\u001b[22m\u001b[36massets/index-w_2L8gbc.js    \u001b[39m\u001b[1m\u001b[33m539.65 kB\u001b[39m\u001b[22m\u001b[2m │ gzip: 103.76 kB\u001b[22m\n\u001b[2mdist/\u001b[22m\u001b[36massets/vendor-BH0bsWaq.js   \u001b[39m\u001b[1m\u001b[33m808.69 kB\u001b[39m\u001b[22m\u001b[2m │ gzip: 263.08 kB\u001b[22m\n\u001b[32m✓ built in 6.92s\u001b[39m\n\nPWA v1.2.0\nmode      generateSW\nprecache  19 entries (1798.40 KiB)\nfiles generated\n  dist/sw.js\n  dist/workbox-9c191d2f.js\n\u001b[33m\n(!) Some chunks are larger than 500 kB after minification. Consider:\n- Using dynamic import() to code-split the application\n- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks\n- Adjust chunk size limit for this warning via build.chunkSizeWarningLimit.\u001b[39m",
+      "executado_em": "12/09/26 23:40",
+      "evidencia_url": null,
+      "motivo": null,
+      "ressalva": null,
+      "vermelho_dispensado": null
+    },
+    "validacao_manual": {
+      "rotulo": "APROVADO",
+      "comando": null,
+      "codigo_saida": 0,
+      "saida": "Humano validou no app em 12/09/26 com o romaneio 2025-11-19-JQJE-LAGOA (1).json: o trecho P1 (Epitacio Pessoa 2224) -> P2 (2556) passou a seguir Av. Henrique Dodsworth ate o contorno da Praca Eugenio Jardim (Cantagalo) e voltar, sem o V proibido perto da Praca Senador Filinto Miller, igual a rota do Google Maps. Humano confirmou que nada regrediu em outros pontos.",
+      "executado_em": "12/09/26 23:51",
+      "evidencia_url": null,
+      "motivo": null,
+      "ressalva": null,
+      "vermelho_em": null
+    }
+  },
+  "achados": [
+    {
+      "classe": 4,
+      "descricao": "O motor ignora as relacoes de restricao de conversao do OSM. A manobra em V deste bug e proibida pela relacao 4603685 (no_left_turn, from way 160970023 via node 2112929361 to way 329058529). Na malha de 600m do romaneio de teste ha 42 restricoes ignoradas. Simulado: com margem 300m, respeita-las deixa o trecho sem caminho; com margem 450m ou mais, o A* atual ja faz o contorno pela Praca Eugenio Jardim (1358m) e as restricoes nao mudam esta rota.",
+      "destino": "tarefa",
+      "ref": "TASK-BG-019"
+    },
+    {
+      "classe": 4,
+      "descricao": "SummaryPage.tsx chama useRoadGraph sem o ponto inicial e MapPage.tsx chama com ele. Quando o inicio fica fora do envelope das entregas, o Sumario e o mapa calculam sobre malhas diferentes e podem mostrar distancias diferentes, contrariando o que a TASK-BG-014 garantiu. Encontrado lendo o codigo durante esta tarefa; nao corrigido aqui.",
+      "destino": "tarefa",
+      "ref": "TASK-BG-020"
+    }
+  ],
+  "validacao": "aprovado",
+  "validado_em": "12/09/26 23:51",
+  "validacao_motivo": "Humano validou no app em 12/09/26 com o romaneio 2025-11-19-JQJE-LAGOA (1).json: o trecho P1 (Epitacio Pessoa 2224) -> P2 (2556) passou a seguir Av. Henrique Dodsworth ate o contorno da Praca Eugenio Jardim (Cantagalo) e voltar, sem o V proibido perto da Praca Senador Filinto Miller, igual a rota do Google Maps. Humano confirmou que nada regrediu em outros pontos.",
+  "tarefas_geradas": [
+    "TASK-BG-019",
+    "TASK-BG-020"
+  ],
+  "adrs": [],
+  "divida_tecnica": [],
+  "riscos_aceitos": [],
+  "absorvida_por": null,
+  "cancelamento_motivo": null,
+  "narrativa": "2026-09-12--23h55--TASK-BG-018.md"
+}
diff --git a/docs-mentor/tarefas/concluidas/2026-09-12--23h55--TASK-BG-018.md b/docs-mentor/tarefas/concluidas/2026-09-12--23h55--TASK-BG-018.md
new file mode 100644
index 0000000..effd04c
--- /dev/null
+++ b/docs-mentor/tarefas/concluidas/2026-09-12--23h55--TASK-BG-018.md
@@ -0,0 +1,33 @@
+# TASK-BG-018 · Rota desenhava conversão proibida porque a malha baixada recortava o retorno legal
+
+## Decisoes tomadas
+
+- **Causa real.** `useRoadGraph` pedia ao Overpass só as ruas até 300 m do envelope dos endereços (mais o ponto inicial). No romaneio `2025-11-19-JQJE-LAGOA`, o trecho Av. Epitácio Pessoa 2224 → 2556 exige inverter o sentido, e o retorno legal (contorno da Praça Eugênio Jardim, no Cantagalo) fica além dessa borda. Sem ele na malha, o A* só tinha manobras proibidas e escolheu a mais barata: curva de 168° da alça `trunk_link` (way 160970023) para a Henrique Dodsworth (way 329058529) no nó 2112929361, 522 m + 1500 de penalidade. Era o V que aparecia no mapa.
+- **Medido com a malha do app, recortada por margem:** 300 m → V proibido (522 m); 450, 600, 800 e 1000 m → Henrique Dodsworth → Praça Eugênio Jardim → volta (1358 m). É a rota que o Google Maps dá para o mesmo par de endereços (1,3 km).
+- **Margem passou para 600 m**, com 150 m de folga sobre o limite medido. No romaneio de teste a área vai de 4,69 para 7,74 km² e os nós de 2.536 para 4.418. O formato do cache não muda; a chave muda com o bbox, então cada roteiro baixa a malha de novo uma vez.
+- **O teste trava o contrato, não a rota.** O critério automatizado é "a malha cobre ao menos 600 m em volta dos pontos". A rota depende da malha OSM ao vivo e foi conferida na simulação e na validação manual.
+- **Título corrigido.** O original ("quando a parada encaixa exatamente sobre a via") era uma hipótese descartada.
+- **Cancelamento desfeito.** No meio da investigação a tarefa foi cancelada com o motivo "não há bug", tirado de uma reprodução com malha diferente da do app. O cancelamento não chegou a ser commitado: foi guardado num stash e descartado com autorização do humano.
+
+## O que nao foi feito, e por que
+
+- **Respeitar as restrições de conversão do OSM → TASK-BG-019.** A manobra do V está mapeada como proibida (relação 4603685, `no_left_turn`), e só na malha de 600 m há 42 restrições que o motor ignora. Com a margem certa elas não mudam esta rota, mas barrariam o V sempre que o contorno legal estiver na malha e custar mais de 1500 m além do atalho. Ficou fora porque mexe na consulta ao Overpass, no formato do cache e no A*.
+- **Proibir retorno no meio da quadra.** Simulado junto com as restrições: com margem de 300 m, os dois juntos deixam o trecho sem caminho nenhum. Vai com a TASK-BG-019.
+- **Sumário sem o ponto inicial → TASK-BG-020.** `SummaryPage.tsx` chama `useRoadGraph` sem o ponto inicial e `MapPage.tsx` chama com ele. Com o início fora do envelope das entregas, as duas telas calculam sobre malhas diferentes.
+- **Penalidade de 1500 da TASK-BG-013 intocada.** A primeira proposta desta tarefa (recalibrar a penalidade) partia de uma leitura errada da rota e foi abandonada antes de tocar código.
+- **Fixture com malha real no teste automatizado.** Não entrou: custo alto (dados OSM grandes) para travar um comportamento que depende da malha ao vivo.
+
+## Testes de descoberta
+
+Nenhum. O único teste novo é o do critério de aceite.
+
+## Aprendizados
+
+1. **Reproduza com a malha exata do app.** Duas conclusões erradas vieram de reproduzir com outra malha. O bbox só dos 2 pontos com margem de 600 m (como faz o `prepareGraph.ts`) já incluía o contorno e dava a rota certa. O app usa todos os endereços do manifesto (51) com margem de 300 m, via `useRoadGraph(points, …, startPoint)`.
+2. **O rótulo P da tela é a posição na sequência do roteiro, não a coluna Stop do romaneio.** Confundir os dois custou uma rodada inteira investigando a parada errada (ordem 26, Stop 29, perto da Frederico Schmidt, a ~1,5 km do problema).
+3. **Ângulo sobre ponto duplicado não é manobra.** `suggestionPath` devolve `[from, ...streetPath, to]`. Quando o endereço cai exatamente sobre a via, o ponto casado e o endereço coincidem, e `turnAngle` sobre um segmento de comprimento ~0 devolve 137° ou 180° por ruído numérico. Varredura de curvas fechadas no traçado final precisa descartar segmentos nulos.
+4. **Nó revisitado não é desvio inútil.** Contornar uma praça para inverter o sentido passa perto dos mesmos nós na ida e na volta.
+5. **Distância parecida não prova rua igual.** Confira a sequência de `wayName` antes de concluir.
+6. **A referência externa decidiu o caso.** A rota do Google Maps para o mesmo par de endereços e a foto da linha amarela contínua valeram mais que qualquer hipótese sobre o grafo.
+7. **`distance` do `aStar` é a distância física recalculada, não o custo com penalidades.** Para entender por que o A* escolheu um caminho, é preciso instrumentar o custo.
+8. **O Overpass público devolve 504 em consultas de ~5 km².** Guarde a resposta em cache local para rodar variações sem repetir a consulta.
diff --git a/package-lock.json b/package-lock.json
index 282affd..445f893 100644
--- a/package-lock.json
+++ b/package-lock.json
@@ -48,7 +48,7 @@
         "fast-xml-parser": "^5.3.2",
         "globals": "^16.5.0",
         "jsdom": "^27.3.0",
-        "mentor-agent": "github:thiagoroddev/mentor-agent#v0.4.0",
+        "mentor-agent": "github:thiagoroddev/mentor-agent#v0.5.0",
         "postcss": "^8.4.47",
         "prettier": "^3.6.2",
         "puppeteer": "^25.9.0",
@@ -8786,8 +8786,8 @@
       "license": "MIT"
     },
     "node_modules/mentor-agent": {
-      "version": "0.4.0",
-      "resolved": "git+ssh://git@github.com/thiagoroddev/mentor-agent.git#fb98653e83e09da12ebf4186e832bf5d2ede94b2",
+      "version": "0.5.0",
+      "resolved": "git+ssh://git@github.com/thiagoroddev/mentor-agent.git#d1b817a84dcb2bb2a3cf3261e40287095bb34c6d",
       "dev": true,
       "bin": {
         "mentor": "mentor.mjs"
diff --git a/package.json b/package.json
index 30b880c..7232297 100644
--- a/package.json
+++ b/package.json
@@ -78,7 +78,7 @@
     "fast-xml-parser": "^5.3.2",
     "globals": "^16.5.0",
     "jsdom": "^27.3.0",
-    "mentor-agent": "github:thiagoroddev/mentor-agent#v0.4.0",
+    "mentor-agent": "github:thiagoroddev/mentor-agent#v0.5.0",
     "postcss": "^8.4.47",
     "prettier": "^3.6.2",
     "puppeteer": "^25.9.0",
diff --git a/src/__tests__/hooks/useRoadGraph.test.tsx b/src/__tests__/hooks/useRoadGraph.test.tsx
index 4a27d30..1569be9 100644
--- a/src/__tests__/hooks/useRoadGraph.test.tsx
+++ b/src/__tests__/hooks/useRoadGraph.test.tsx
@@ -52,6 +52,21 @@ describe("useRoadGraph (lazy, ADR-009 decision B)", () => {
     expect(bbox.east).toBeGreaterThan(-43.199);
   });
 
+  it("cobre ao menos 600 m em volta dos pontos, para alcancar retornos legais fora do envelope", async () => {
+    vi.mocked(loadRoadGraph).mockResolvedValue({ graph: GRAPH });
+    renderHook(() => useRoadGraph(POINTS, true));
+
+    await waitFor(() => expect(loadRoadGraph).toHaveBeenCalled());
+    const bbox = vi.mocked(loadRoadGraph).mock.calls[0][0];
+    const envelope = { south: -22.98, north: -22.979, west: -43.2, east: -43.199 };
+    const latDeg = 600 / 111_320;
+    const lngDeg = 600 / (111_320 * Math.cos((-22.9795 * Math.PI) / 180));
+    expect(envelope.south - bbox.south).toBeGreaterThanOrEqual(latDeg * 0.99);
+    expect(bbox.north - envelope.north).toBeGreaterThanOrEqual(latDeg * 0.99);
+    expect(envelope.west - bbox.west).toBeGreaterThanOrEqual(lngDeg * 0.99);
+    expect(bbox.east - envelope.east).toBeGreaterThanOrEqual(lngDeg * 0.99);
+  });
+
   it("expande o bbox da malha viaria para cobrir o startPoint quando fornecido", async () => {
     vi.mocked(loadRoadGraph).mockResolvedValue({ graph: GRAPH });
     const startPoint = { lat: -22.95, lng: -43.15 };
diff --git a/src/__tests__/utils/inferLocationType.test.ts b/src/__tests__/utils/inferLocationType.test.ts
index 9484bfd..51285db 100644
--- a/src/__tests__/utils/inferLocationType.test.ts
+++ b/src/__tests__/utils/inferLocationType.test.ts
@@ -96,6 +96,30 @@ describe("inferLocationType", () => {
       });
     });
 
+    // ========================================================================================
+    // 3.1 KEYWORDS LEVANTADAS EM ROMANEIOS REAIS (TASK-BG-017)
+    // ========================================================================================
+
+    describe("detects keywords added from real romaneio analysis (TASK-BG-017)", () => {
+      it("classifies new commercial keywords", () => {
+        expect(inferLocationType("Rua E, 50, Tech Solutions")).toBe(ICON_KEYS.OFFICE_CORRECTED);
+        expect(inferLocationType("Rua E, 50, Empório Central")).toBe(ICON_KEYS.OFFICE_CORRECTED);
+        expect(inferLocationType("Rua E, 50, Sobreloja")).toBe(ICON_KEYS.OFFICE_CORRECTED);
+        expect(inferLocationType("Rua E, 50, Grill do Zé")).toBe(ICON_KEYS.OFFICE_CORRECTED);
+        expect(inferLocationType("Rua E, 50, Vitrine da loja")).toBe(ICON_KEYS.OFFICE_CORRECTED);
+        expect(inferLocationType("Rua E, 50, Teatro Municipal")).toBe(ICON_KEYS.OFFICE_CORRECTED);
+      });
+
+      it('classifies "drogarias" (plural) as commercial, closing the gap with "drogaria" (singular)', () => {
+        expect(inferLocationType("Rua F, 60, Drogarias Rio")).toBe(ICON_KEYS.OFFICE_CORRECTED);
+      });
+
+      it("classifies new residential keywords", () => {
+        expect(inferLocationType("Rua G, 70, Edifício Cristal")).toBe(ICON_KEYS.HOME_CORRECTED);
+        expect(inferLocationType("Rua G, 70, Falar com o zelador")).toBe(ICON_KEYS.HOME_CORRECTED);
+      });
+    });
+
     // ========================================================================================
     // 4. PROTECTION SCENARIOS (FALSE POSITIVES)
     // ========================================================================================
diff --git a/src/constants/keywords.ts b/src/constants/keywords.ts
index 4b03a2d..6e875e0 100644
--- a/src/constants/keywords.ts
+++ b/src/constants/keywords.ts
@@ -59,6 +59,7 @@ const residentialRaw = [
   "cbt",
   "do lado",
   "depois",
+  "edificio",
   "em frente",
   "enfrente",
   "entrar",
@@ -86,6 +87,7 @@ const residentialRaw = [
   "travessa do",
   "vila",
   "vizinho",
+  "zelador",
 ];
 
 const commercialRaw = [
@@ -157,6 +159,8 @@ const commercialRaw = [
   "distribuidora",
   "domingo",
   "drogaria",
+  "drogarias",
+  "emporio",
   "empresa",
   "ensino",
   "estacao",
@@ -176,6 +180,7 @@ const commercialRaw = [
   "galpao",
   "gasolina",
   "grafica",
+  "grill",
   "hort",
   "hortfrut",
   "hortifruti",
@@ -244,6 +249,7 @@ const commercialRaw = [
   "setor",
   "shopping",
   "shop",
+  "sobreloja",
   "solucoes",
   "sorveteira",
   "sorveteria",
@@ -252,6 +258,8 @@ const commercialRaw = [
   "supermercado",
   "sushi",
   "tabacaria",
+  "teatro",
+  "tech",
   "tijolinhos",
   "trailer",
   "upa",
@@ -259,6 +267,7 @@ const commercialRaw = [
   "vidraceiro",
   "vidracaria",
   "vila olimpica",
+  "vitrine",
   "xerox",
   "zig zag",
 ];
diff --git a/src/hooks/useRoadGraph.ts b/src/hooks/useRoadGraph.ts
index b2b5a79..98c2032 100644
--- a/src/hooks/useRoadGraph.ts
+++ b/src/hooks/useRoadGraph.ts
@@ -17,9 +17,11 @@ import { bboxFromPoints } from "../utils/routing/osm";
 import { UI_LABELS } from "../constants/uiLabels";
 import { bboxKey, loadRoadGraph } from "../services/graphCache";
 
-/** Margin (meters) around the points' envelope: street context for map
- *  matching/A* at border points without inflating the bbox (DT-005). */
-const BBOX_MARGIN_METERS = 300;
+/** Margin (meters) around the points' envelope. Must reach the nearest LEGAL
+ *  turnaround: reversing on a divided or turn-restricted avenue may need a loop
+ *  outside the envelope, and a graph clipped before it leaves A* only prohibited
+ *  maneuvers. Weighed against Overpass load (DT-005). ⚙️ MANUAL KNOB. */
+const BBOX_MARGIN_METERS = 600;
 
 export type RoadGraphStatus = "idle" | "loading" | "ready" | "error";
```

### Arquivos criados e nunca commitados

Nenhum.

## Como entregar o veredito

Edite `docs-mentor/auditorias/AUD-002.json`:

- `veredito`: `APROVADO` | `APROVADO COM RESSALVAS` | `REPROVADO`
- `nao_verificado`: lista. **Nunca pode ficar vazia** — nenhuma auditoria verifica tudo, e dizer o contrario e o sinal mais claro de auditoria quebrada.
- `pendencias`: cada achado com `nivel` (`bloqueia` | `recomendacao` | `observacao`), `descricao` e `tarefas` (os IDs a que se refere).
  Deixe `destino`, `ref` e `resolvida_em` em `null`: **quem decide o destino e o humano, nao voce.**

Depois rode:

```
node mentor.mjs auditar registrar AUD-002
```

O comando recusa: marcador nao preenchido · `nao_verificado` vazio · achado `bloqueia` com veredito `APROVADO` · destino preenchido por voce.
