# Reserva

<!-- Gerado por `node mentor.mjs gerar`. Nao edite a mao: a proxima geracao sobrescreve. -->

> Lembretes sem compromisso. Nao entram no contexto: puxe com `mentor task puxar <ID>`.
> Requisito pendente nao precisa de tarefa aqui: `requisitos/pendentes.md` ja e o lembrete dele.

| ID | Titulo | Fatia | Tipo | Valor | Esforco H/IA | Origem |
|---|---|---|---|---|---|---|
| `TASK-BG-019` | Respeitar as restricoes de conversao do OSM (no_* e only_*) no roteamento veicular | - | BG | importante | M/G | titulo-autossuficiente |
| `TASK-BG-020` | Sumario carregar a malha viaria com o ponto inicial, igual ao mapa | - | BG | importante | P/P | titulo-autossuficiente |
| `TASK-CHORE-008` | Remover service worker legado public/sw.js | - | CHORE | desejavel | P/P | titulo-autossuficiente |
| `TASK-CHORE-009` | Comprimir capturas de docs/imagens | - | CHORE | desejavel | P/P | titulo-autossuficiente |
| `TASK-CHORE-023` | Atualizar esbuild para corrigir GHSA-g7r4-m6w7-qqqr (leitura de arquivo pelo servidor de desenvolvimento no Windows) | - | CHORE | importante | P/P | titulo-autossuficiente |
| `TASK-DOC-005` | Decidir destino do status Carregando ruas do grafo OSM | - | DOC | desejavel | P/P | titulo-autossuficiente |
| `TASK-DOC-006` | Aplicar correcoes de custo e backend do plano de infraestrutura | - | DOC | importante | P/M | titulo-autossuficiente |
| `TASK-DOC-008` | Resolver divergencia entre UI_LABELS.SUMMARY.VIEW_MAP e texto renderizado | - | DOC | desejavel | P/P | titulo-autossuficiente |
| `TASK-REF-014` | Ajustar radius do tema para 0.5rem conforme neonflux | - | REF | desejavel | P/P | titulo-autossuficiente |
| `TASK-REF-020` | Redesenhar os enderecos da parada em cards aninhados (StopItemRow/StopItemDetail, usados em Ver detalhes, Ver parada e modo Original), no layout do Stitch aplicado na TASK-RF-045: card por endereco com ordinal, complemento em destaque, rotulo e codigo SPX, tipo e Abrir no Maps, com tokens do tema | - | REF | desejavel | M/G | titulo-autossuficiente |
| `TASK-RF-009` | Modo execucao do Meu roteiro | epico, 5 fatias | RF | critico | XG/XG | RF-37, RF-47, RF-48, RF-49, RN-22 |
| `TASK-RF-024` | [fatia de TASK-RF-009] Modelo e persistencia da execucao | 1/5 de TASK-RF-009 | RF | critico | M/G | RF-37, RN-22 |
| `TASK-RF-025` | [fatia de TASK-RF-009] Shell de execucao e roteiro somente leitura | 2/5 de TASK-RF-009 | RF | critico | M/M | RF-37, RF-33, RN-22 |
| `TASK-RF-026` | [fatia de TASK-RF-009] Marcacao de entrega, insucesso e desfazer | 3/5 de TASK-RF-009 | RF | critico | M/M | RF-37, RF-48, RN-22 |
| `TASK-RF-027` | [fatia de TASK-RF-009] Status visual da execucao no mapa | 4/5 de TASK-RF-009 | RF | critico | P/M | RF-37 |
| `TASK-RF-028` | [fatia de TASK-RF-009] Sumario, retomada e modo lista da execucao | 5/5 de TASK-RF-009 | RF | critico | M/M | RF-37, RF-47, RF-49 |
| `TASK-RF-029` | Auto-roteirizacao por menor numero de conversoes | epico, 5 fatias | RF | importante | XG/XG | RF-34 |
| `TASK-RF-031` | Calcular caminhos e ordenar paradas com custo de conversao | 2/6 de TASK-RF-029 | RF | importante | M/G | RF-34 |
| `TASK-RF-032` | Montar o roteiro automatico completo e tratar trechos inviaveis | 3/6 de TASK-RF-029 | RF | importante | M/G | RF-34 |
| `TASK-RF-033` | Adicionar botao Auto-roteirizar e validar a experiencia no celular | 4/6 de TASK-RF-029 | RF | importante | M/G | RF-34 |
| `TASK-RF-034` | Integrar o motor em worker e preservar o roteiro editavel | 5/6 de TASK-RF-029 | RF | importante | M/G | RF-34 |
| `TASK-RF-046` | Ordenar romaneios salvos pelo uso mais recente (importar, abrir rota no Sumario ou mapa, editar roteiro) | - | RF | importante | P/M | RF-60 |
| `TASK-RF-047` | Guardar o resumo do roteiro salvo (paradas, km, tempo, progresso) quando o app ja calcula os totais com malha | - | RF | importante | M/M | RF-61 |
| `TASK-RF-048` | Nova tela de romaneios salvos no layout do Stitch: card por tipo de arquivo, rotas em linhas com busca interna, estado e resumo do roteiro, bairro principal e ordem por uso | - | RF | importante | M/G | RF-62 |
| `TASK-TEST-002` | Testar zoom minimo do mapa para detalhe de rua a pe | - | TEST | importante | P/M | RNF-15 |
| `TASK-TEST-004` | Validar o motor com corpus sintetico e romaneios reais locais | 6/6 de TASK-RF-029 | TEST | importante | M/G | RF-34 |
| `TASK-TEST-005` | Cobrir na INV-001 todo exportador de roteiro importavel do laboratorio, a comecar pelo gerador de roteiro ficticio (gerar-roteiro-classificacao.ts), que nao tem teste de contrato nem entrada em laboratorio.artefatos_importaveis | - | TEST | importante | P/P | AUD-003-R04 |
| `TASK-TEST-006` | Prender em teste a folga de desempate de 10 m (ADDRESS_STREET_TIE_METERS) da parada padrao do veiculo, com casos logo abaixo e logo acima do limite | - | TEST | importante | P/P | AUD-003-R06 |
