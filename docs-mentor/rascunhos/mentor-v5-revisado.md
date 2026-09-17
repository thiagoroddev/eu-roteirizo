# Mentor-Agent V5 — evidência confiável, execução proporcional

Status: proposta revisada para avaliação. Este documento substitui o V4 como recomendação de planejamento; não altera as regras vigentes nem autoriza implementação, commit ou publicação. O V4 original permanece preservado.

Implementação: [índice e etapas executáveis](mentor-v5-implementacao/README.md). Esse pacote detalha a entrega para outra IA e acrescenta o requisito de planejamento portátil, separado da execução e reutilizado por referência, sem reescrita.

## 1. Parecer

O V4 identifica problemas reais: documentação repetida, auditoria tardia, ausência de reaproveitamento de gates e cerimônia desproporcional. Entretanto, sua implementação proposta cria dispensas amplas, preserva partes importantes da burocracia e enfraquece algumas verificações. Não aplicar seus textos normativos por substituição integral.

A direção recomendada é conservar o ciclo e os aprendizados existentes, simplificar o que o agente precisa decidir e escrever, e transformar evidências em resultados reutilizáveis ligados aos insumos efetivamente verificados. Cada verificação deve ter escopo, validade e motivo de repetição explícitos.

Economia de tokens, tempo de máquina e esforço humano são métricas diferentes. Executar testes demora, mas o consumo do modelo decorre das interações, do contexto e do raciocínio associados; não é proporcional aos segundos do subprocesso. Não temos medição por tarefa que atribua os 92% relatados exclusivamente ao Mentor ou quantifique a economia futura. A estimativa anterior de economizar “mais da metade” não foi medida.

## 2. Evidências que mudam o V4

Inspeção do código deste projeto e do histórico da TASK-CHORE-027:

| Constatação | Consequência para a reestruturação |
| --- | --- |
| `task gate` executa o comando do gate escolhido; `tipos` e `lint` não disparam a suíte de testes. `mentor gates` já executa todos, mas não registra evidência na tarefa. | Reutilizar um executor comum; não atribuir o custo principal a iniciar Node quatro vezes. |
| A execução da CHORE-027 repetiu gates após ajustes tardios de testes e formatação. | Consolidar teste, código, revisão e formatação antes da bateria final. Também corrigir a conduta de execução, não apenas o pacote. |
| Todos os `arvore_hash` gravados na CHORE-027 são `null`. A sessão encontrou restrições de escrita no Git. | O registro comprova comandos, mas não a identidade da árvore. Falha de fingerprint precisa ser explícita e nunca permitir cache. |
| `hashDaArvoreAtual` exclui toda a pasta de documentos. Nela existe `melhorias-do-pacote.test.ts`, executado pela suíte. | Pasta não define se algo é documentação; o teste precisa participar da chave. |
| `eslint.config.js` ignora `.mentor`; o projeto TypeScript inclui `src`, utilidades e a configuração do Vite. | Tipos/lint do app não atestam os scripts do Mentor. Criar cobertura específica antes de anunciar esses gates como proteção do pacote. |
| `pronto-para-merge` já prioriza `(light)`/`(plano)` e aceita auditorias/dívidas. | Consolidar a CHORE-027, sem implementá-la novamente. |
| `(light)` é aceito sem conferir conteúdo; `(plano)` valida caminhos e estado, mas não todos os campos prometidos. Se todos os diffs falham, a lista pode ficar vazia e ser aceita. | A marca classifica o pedido; o diff precisa confirmar sua elegibilidade. Falta de base verificável não significa diff vazio. |
| `doctor` ainda grava `qualidade.perfil` e limpa lembretes; `vistas` ainda grava contagens. | Tornar consultas somente leitura exige mais que fixar timestamp em `null`. |
| O workflow atual não executa `mentor verificar`. | O V4 não pode assumir que essa barreira já existe na CI. |

## 3. O que preservar, com seus limites

- Reserva separada do ciclo, limites de WIP e pausa/retomada com dependências. Os valores atuais continuam configuráveis por projeto; limite de tarefas e teto de texto são restrições distintas. Resumir uma vista não pode esconder tarefas ou bloqueios.
- Identificadores, datas, referências e vistas gerados pelo CLI. Dados canônicos ficam versionados; contagens e resumos derivados são calculados.
- Planejamento independente, worktrees quando necessários, proteção da linha principal e mudanças isoláveis. Não impor novo padrão de nome de ramo onde o projeto já tem um compatível.
- Vínculo entre requisito, critério, tarefa e evidência. Preservar exceções técnicas explícitas existentes, sem promover requisito a implementado por mera declaração.
- Escopo verificável, detecção de trabalho retroativo, trilha de decisões e proteção contra fechamento com evidência inválida.
- Validação humana quando a aceitação depende dela; orçamento limitado e contexto próprio para revisão independente quando o risco justificar.
- Registros históricos de auditoria, regressões das correções locais, ADRs e conhecimento dos guias. Preservar o conhecimento não significa congelar regras contraditórias nem carregar tudo a cada tarefa.
- Reavaliar premissas quando a evidência mudar; conservar as três réguas dos spikes de medição, o contrato entre fatias e a saída explícita do laboratório.

O código informa o comportamento implementado; requisito e decisão humana informam o comportamento pretendido. Divergência pede reconciliação: nunca reescrever silenciosamente o requisito só para legitimar um bug.

## 4. Cerimônia definida pelo risco

Manter Light, Standard e Strict. Implementar Fast-Track como perfil compacto de Standard, com os mesmos estados e comandos, evitando uma quarta máquina de estados.

| Perfil | Aplicação | Registro humano mínimo |
| --- | --- | --- |
| Light | Conteúdo sem mudança de comportamento, contrato, política ou dependência executável. | Intenção e diff; tarefa própria dispensável. |
| Standard compacto | Defeito delimitado, causa conhecida, aceite verificável, impacto local e reversão simples. | Problema, escopo, aceite, verificação e risco relevante; uma nota final só quando houver aprendizado. |
| Standard completo | Funcionalidade, comportamento ambíguo ou impacto entre componentes. | Plano e critérios com decisões técnicas pertinentes. |
| Strict | Contratos duráveis, migrações importantes, segurança, nova infraestrutura ou decisão cara de reverter. | Standard, análise de impacto e ADR quando houver decisão arquitetural. |

Eliminar o limite de 15 linhas. Uma linha pode remover autorização; dezenas podem apenas atualizar dados estáticos. Número de arquivos e linhas é sinal de triagem, nunca passe automático. Hotfix descreve urgência, não baixo risco.

Mudança em gate, hook, política de merge, autorização ou evidência do próprio Mentor exige critérios e teste de regressão pertinente. A CHORE-027 comporta registro compacto, mas não uma dispensa de validação por morar em `.mentor/`.

O CLI registra perfil e justificativa curta; a análise do diff pode apontar incompatibilidades. Não abrir nova tarefa ao ampliar legitimamente a mesma correção: atualizar escopo, preservar ID e discutir com o humano apenas mudanças materiais de objetivo, risco ou autoridade.

### Mérito técnico sem formulário ritual

- Conhecer o problema continua obrigatório; preencher nome canônico só ajuda quando orienta a solução.
- Comparar alternativas quando existe decisão real de projeto, dependência, algoritmo, escala ou custo. Não exigir duas bibliotecas para uma condição booleana.
- Discordância é uma observação substantiva quando necessária, não três campos obrigatórios preenchidos com “nada a objetar”.
- Estado da arte fica obrigatório para motores próprios ou apostas relevantes; esforço grande exige decomposição, não apenas mais prosa.
- Uma restrição refutada exige decisão antes da próxima aposta. Reconfirmações ficam registradas; ADR deve resolver a decisão recorrente, não surgir só porque um contador chegou a três.

## 5. Autorizações sem perguntas repetidas

Proposta de política futura, a ser adotada explicitamente pelo mantenedor:

1. Pedido explícito de implementar autoriza diagnóstico, plano sucinto e execução local reversível dentro do objetivo. Não exigir um segundo “sim” para repetir o mesmo pedido.
2. Compromissos materiais, decisões de produto não resolvidas e ampliação de escopo continuam exigindo direção humana.
3. Fechamento, commit e publicação continuam respeitando a autoridade concedida. Uma autorização pode nomear mais de uma dessas ações; o agente não pergunta novamente por uma ação já concedida e ainda aplicável.
4. Push, abertura de PR, merge e deploy são ações distintas. Não inferir todas a partir de uma só.
5. O CLI pode registrar a origem e o alcance declarados da autorização, mas não consegue provar sozinho que um humano a concedeu. Distinguir controle de processo de garantia técnica.

Até essa política ser adotada, permanecem os portões atuais. A revisão deste plano não equivale à sua adoção.

## 6. Execução com orçamento de contexto

O maior ganho imediato é evitar ciclos desnecessários, antes de construir cache sofisticado.

### Leitura

- Núcleo curto contendo invariantes e roteador. Regras operacionais vivem em um único processo; exemplos e história ficam em referências separadas.
- Carregar contexto da tarefa, estado do Git e módulo relevante. Não executar diagnóstico global em saudação ou resposta simples sem necessidade do pedido.
- Pesquisar caminhos e símbolos antes de ler arquivos grandes. Um documento de instruções selecionado deve ser lido integralmente; para reduzir esse custo, dividir documentos longos em unidades autossuficientes durante a reestruturação.
- Não reler fonte inalterada já disponível na conversa. Ler novamente quando mudou, foi perdida na retomada ou é necessária para resolver dúvida concreta.
- Relatórios extensos saem resumidos, com totais, omissões declaradas e referências recuperáveis. Nunca devolver dezenas de milhares de tokens por padrão.

### Implementação

1. Definir os casos relevantes antes de editar: reprodução, sucesso e preservação da barreira afetada.
2. Para bug, executar reprodução/teste focal que falhe pelo motivo esperado. Erro de configuração, timeout ou falha de outra suíte não serve como vermelho do bug.
3. Aplicar o patch, ajustar testes e formatar apenas os arquivos pertinentes, respeitando o estilo local.
4. Revisar o diff e rodar testes focais até resolver as dúvidas concretas.
5. Rodar os gates de aceitação uma vez sobre a versão estabilizada. Repetir somente os invalidados por nova mudança ou resultado inconclusivo.
6. Parar ao cumprir o aceite e verificações aplicáveis; não iniciar uma nova revisão estética depois dos gates sem um problema identificável.

Não exigir teste novo que apenas reproduza a implementação ou teste de mutação cerimonial para cada alteração. Regressões de comportamento devem ter teste que distinga o defeito; conteúdo não executável recebe a validação pertinente. O método TDD do projeto permanece configurável.

Atualizações ao usuário devem comunicar descobertas, decisões ou bloqueios; polling de processo é trabalho de ferramenta e não precisa desencadear nova análise ampla. Encadear operações dependentes somente com verificação de sucesso: falha ao trocar de ramo impede criar/iniciar tarefa naquele encadeamento.

Um resumo de retomada contém objetivo, tarefa, ramo/base, arquivos modificados, decisões, evidências válidas, pendências e autorizações remanescentes. Não copia logs nem reconstrói a narrativa inteira.

## 7. Gates: um executor, evidência por resultado

Introduzir `mentor task gates <ID>` usando o executor compartilhado de `task gate` e `mentor gates`. Não hardcodar `tsc`, `eslint` ou `vitest`: os comandos e sua aplicabilidade vêm do contexto do projeto.

“Atômico” significa consistência na gravação, não um único subprocesso shell. Um comando coordena execuções independentes e registra cada resultado concluído por escrita segura. Deve sobreviver a falha do terceiro gate sem perder os dois primeiros.

- Padrão sequencial. Permitir paralelismo somente entre gates declarados independentes, sem disputar outputs ou recursos. Um coordenador grava os registros.
- Na primeira falha, parar por padrão, conservar resultados válidos e marcar os restantes como não executados. Retomar não reroda os aprovados cuja chave continua válida.
- Processo interrompido, timeout ou impossibilidade de comprovar inputs produz resultado explícito; nunca “aprovado” sintético.
- Resumo padrão: nome, resultado, duração, reutilização e motivo; log detalhado é armazenado uma vez, com referência. Redigir dados sensíveis antes de persistir ou publicar logs.
- Gate obrigatório não declarado impede anunciar “todos aprovados”. Suíte com zero testes não vale como prova; cada runner define como demonstra execução. Saída vazia de um verificador legitimamente silencioso também não implica falha por si só.
- Separar reprodução focal de gate completo. Ambas registram o que realmente executaram. Uma fixture rápida não substitui silenciosamente o gate obrigatório.

### Validade da evidência

Usar fingerprint dos insumos por gate, com fallback conservador para todos os insumos executáveis quando o escopo não estiver declarado. Evitar inicialmente inventar um grafo completo de dependências.

Chave mínima: conteúdo e modos dos arquivos de entrada, comando e configuração efetivos, política de seleção, versão do executor, runtime/plataforma relevantes, dependências instaladas verificáveis e parâmetros ambientais declarados. Não armazenar segredos crus ou seus hashes reversíveis por enumeração.

Incluir produção, testes, fixtures, lockfiles, configurações de build/lint/CI/hooks e scripts consumidos. Incluir conteúdo executável ou dados de teste dentro de `docs-mentor/`. Incluir as partes de `contexto.json` que definem comandos e políticas; excluir somente campos gerados comprovadamente alheios ao gate, evitando que registrar evidência invalide a própria evidência.

Arquivos novos e removidos também entram no cálculo. Entradas ignoradas pelo Git mas necessárias ao gate, como corpus privado ou ambiente, exigem declaração e verificação; ausência de identificação impede reutilização. Nunca alterar o índice real para calcular hashes.

Calcular a chave antes e depois da execução. Se mudou, não atribuir o resultado à versão final. Essa comparação não detecta uma edição temporária revertida durante o teste: impedir mutações coordenadas naquela execução e usar checkout/snapshot isolado quando houver escritores concorrentes. Não anunciar isolamento absoluto só por ter dois hashes iguais.

`null` nunca é uma chave válida. Resultado executado sem fingerprint continua registrado como tal, mas é inelegível para cache e não sustenta declaração de “mesma árvore comprovada”.

Começar com cache local por projeto/ambiente. Registro em JSON é evidência operacional, não assinatura contra adulteração. A CI produz sua própria evidência e não confia automaticamente no JSON trazido pelo PR. Checks dependentes de serviço externo, vulnerabilidades ou prazo usam política de validade temporal ou não têm cache.

## 8. Pre-push e merge com escopo correto

### Pre-push

1. Usar as referências e SHAs recebidos pelo protocolo do hook. Não comparar sempre `origin/main..HEAD`: pode estar sendo enviada outra branch, mais de uma referência ou uma referência nova.
2. Conferir primeiro destino, proteção e requisitos baratos. Recusar envio indevido antes de gastar uma suíte inteira.
3. Separar WIP das referências de entrega. Um push misto não herda a dispensa só porque contém um ramo `wip/`.
4. Associar evidência ao conteúdo do SHA enviado. Resultado da árvore de trabalho com edições não commitadas não atesta automaticamente o commit enviado. Outra referência exige evidência compatível ou validação em checkout apropriado.
5. Reutilizar gates compatíveis e executar apenas os necessários. Não usar “tarefa ativa” como chave: no push a tarefa pode estar concluída.
6. Em mudança puramente editorial, executar validadores leves aplicáveis e dispensar somente os gates pesados comprovadamente não afetados. A proteção do destino nunca é dispensada.

Excluir os dois bypasses amplos do V4: “qualquer arquivo em docs-mentor/” e “qualquer atualização em .mentor/”. Markdown também pode ser regra do agente ou entrada de geração. Classificar por função e consumidores, com desconhecido tratado conservadoramente.

### Merge

Manter a correção da CHORE-027 e adicionar validação de conteúdo das marcas. `(light)` e `(plano)` não dispensam por si só as políticas do projeto. Em planejamento, permitir registros novos e triagem sem permitir fabricar gates, promover requisitos ou concluir tarefa manualmente dentro de caminhos liberados.

Usar base e head explícitos do PR; base indisponível deve impedir comprovação, nunca produzir “diff vazio”. IDs incidentais em títulos não substituem metadados de entrega e estado dos registros.

A CI faz pelo menos uma validação independente sobre a revisão/integração pertinente. Cache local reduz a duplicação entre desenvolvimento e push, sem eliminar essa verificação. No workflow, mudanças apenas no título precisam atualizar o check que depende dele, sem obrigar fechar/reabrir PR nem executar toda a suíte de produto. A implementação definirá o tratamento de eventos e o checkout seguro, sem executar código de PR com privilégios adicionais.

## 9. Revisão antecipada e evidência humana

Retirar a cadência obrigatória de grandes lotes pós-merge. Preservar o comando de auditoria como ferramenta sob demanda, o histórico e os achados ainda acionáveis. Código entregue pode ter falha nova: “entregue está encerrado” não pode impedir investigação de incidente.

Revisão local curta do diff para toda mudança executável. Revisão independente antes do merge quando houver risco elevado, regra do projeto ou mudança nas salvaguardas do próprio Mentor. Ela recebe objetivo, critérios, diff, testes e dependências estritamente necessárias; não a conversa inteira. Auto-revisão não equivale a independência.

O pacote de revisão limita o tamanho total, incluindo instruções, critérios e evidências. Explicitar o que ficou fora. O revisor pode solicitar implementação adjacente necessária: restringi-lo literalmente às linhas alteradas impede detectar contratos quebrados.

Bloqueio deve indicar cenário reproduzível ou argumento verificável, impacto e localização. Preservar segurança e privacidade, integridade de dados, corretude/contratos, desempenho com evidência e validade das verificações. Não reduzir integridade a perda irreversível nem classificar toda migração sem rollback como defeito automático. Preferência estética só é bloqueante quando viola um requisito aprovado ou uma verificação aplicável.

Separar “achado a comunicar” de “impedimento à entrega”. Os cinco temas do núcleo servem à atenção técnica; não justificam varredura global a cada alteração pequena. Examinar o escopo e dependências relevantes, comunicar descoberta concreta, sem criar trabalho novo automaticamente.

Para validação humana, registrar roteiro apresentado, sua revisão e resposta original do usuário. “Está tudo ok” pode aprovar o roteiro inteiro se essa associação estiver clara. Não obrigar o humano a repetir os itens nem inventar etapas que ele não confirmou. Alteração material no comportamento invalida somente os casos afetados. Dispensa precisa de justificativa substantiva; quantidade de caracteres não prova validade.

## 10. Patches locais e estado derivado

### Patches

Manter a narrativa em `melhorias-do-pacote.md`, mas não usar extração de Markdown por caminho como autorização permanente. Um arquivo já listado poderia receber qualquer alteração posterior sem ser acusado.

Introduzir registro estruturado mínimo de patches, gerado por comando: versão/base do pacote, tarefa, operações e caminhos, hash base e hash aceito, regressão vinculada e estado de incorporação. Uma única fonte para dados mecânicos; a narrativa contém o motivo e aponta para o registro. O comando não aprova silenciosamente o estado encontrado.

Arquivo divergente exatamente igual ao patch registrado gera aviso não reprovador. Nova mudança, arquivo extra, exclusão não registrada ou base incompatível exige reconciliação. Não sobrescrever o manifesto do distribuidor para mascarar divergência.

Atualização do pacote apresenta patches aplicáveis e conflitos antes de substituir arquivos. Se a versão oficial incorporou a correção, retirar registro local após comprovação; remover apenas teste redundante, preservando cobertura útil. Não apagar regressões automaticamente por número de versão.

### Consultas

`doctor`, `verificar` e consultas de contexto devem ser somente leitura. Contagens, lembretes e perfis calculados saem em memória ou vista derivada. Comandos de mutação e migração explícita cuidam dos dados canônicos.

A mudança anterior para timestamp `null` e lembretes vazios foi uma mitigação útil; consolidá-la e migrar uma vez os campos derivados. Não regravar valores vazios a cada consulta. Atualizar consumidores antes de remover campos. Não migrar todo o histórico apenas para encaixar no novo esquema.

## 11. Sequência de implementação e critérios de saída

Executar no repositório do pacote quando disponível. Usar o hospedeiro como piloto; correção emergencial local segue a regra de patches. Não transformar automaticamente cada item desta proposta em tarefa do produto.

| Etapa | Mudança | Evidência de saída |
| --- | --- | --- |
| A — baseline e cobertura | Consolidar correções existentes e mapear que comandos cobrem Mentor/app. | Fixture reproduz CHORE-027; tipos/lint específicos atingem o pacote ou limitação fica explícita. |
| B — executor único | Refatorar registro/executor, adicionar `task gates`, saída compacta e retomada. | Falha no terceiro gate conserva os anteriores; interrupção não deixa sucesso total nem JSON corrompido. |
| C — fingerprints e cache | Implementar seleção conservadora de insumos e reutilização local por gate. | Teste em docs, lockfile, configuração e alteração concorrente invalidam; nota editorial não afeta gates alheios. |
| D — hooks e CI | Aplicar cache às referências enviadas, validar marcas e eventos do PR. | Push da mesma árvore reutiliza; outro SHA, WIP misto ou base ausente não recebe aprovação indevida. |
| E — estado e patches | Tornar consultas puras e separar patches aceitos de divergências novas. | Duas consultas não alteram arquivos; mudar novamente arquivo de patch volta a acusar divergência. |
| F — cerimônia e revisão | Ativar perfil compacto, contexto sob demanda e revisão por risco. | Caso pequeno percorre fluxo reduzido; caso sensível mantém proteções e aprovação humana aplicáveis. |

Em cada etapa: teste pertinente, implementação, documentação da capacidade real e validação da etapa. Não publicar normas que prometem comandos inexistentes. Evitar reconstrução completa antes do primeiro ganho útil; B já deve reduzir interações, C/D reduzem execução repetida.

Arquivos prováveis: `cmd-tarefa.ts`, `cmd-gates.ts`, `cmd-hooks.ts`, `cmd-merge.ts`, `cmd-verificar.ts`, `cmd-doctor.ts`, `cmd-auditar.ts`, `arquivos.ts`, `vistas.ts`, `cli.ts`, tipos/esquemas, instalador/modelo de hook, testes e workflows. Núcleo, processos e skills mudam junto da capacidade correspondente. O V4 omitia parte desses consumidores.

Comandos existentes continuam aceitos. Leitores toleram registros antigos; evidências sem chave válida continuam consultáveis, mas não são promovidas a cache. Migração idempotente, com prévia e recuperação, preserva IDs, tarefas abertas, pausadas e histórico. Reverter otimizações deve voltar à execução conservadora, sem perder as evidências já produzidas.

## 12. Avaliar economia e qualidade

Usar os mesmos casos antes/depois: nota editorial, hotfix do Mentor, mudança em teste dentro de docs, UI com validação humana, migração, planejamento e tarefa pausada. Não rodar benchmark pesado a cada tarefa.

Medir separadamente:

- Tokens e uso por tarefa, somente quando houver telemetria; se indisponíveis, registrar “não disponível”. Tamanho de contexto e quantidade de chamadas são aproximações, não cobrança exata.
- Tempo de execução, número de chamadas ao modelo, leituras repetidas, rodadas completas, cache hits e causas de invalidação.
- Intervenções humanas necessárias, autorizações pedidas novamente, tamanho do plano/relatório e retrabalho após validação final.
- Falsos bloqueios e falsos verdes dos cenários de regressão. Economia não compensa falha nessas salvaguardas.

Metas iniciais de aceitação, a calibrar no piloto: nenhuma reexecução local de gate com chave válida sem justificativa; nenhuma pergunta repetida por ato já autorizado; nenhuma mutação por comando de consulta; nenhuma aprovação em ausência de base ou fingerprint necessário; bateria completa apenas após estabilizar a mudança, salvo falha ou invalidação demonstrada.

## 13. Contrato resumido para a futura redação do núcleo

O núcleo final deve expressar apenas estes compromissos e apontar para detalhes:

1. Entender objetivo, preservar o trabalho existente e agir dentro da autorização concedida.
2. Aplicar cerimônia proporcional ao risco; registrar decisões e evidências uma vez.
3. Verificar comportamento com comandos que realmente cubram a alteração.
4. Reutilizar evidência somente para inputs, política e ambiente compatíveis; declarar incerteza.
5. Pedir avaliação humana para aceites que dependem dela e decisões ainda não resolvidas.
6. Manter rastreabilidade, isolamento do trabalho e proteção do destino de publicação.
7. Carregar contexto por necessidade; investigar achados concretos, com critério de parada.
8. Parar a execução técnica quando o aceite estiver comprovado e encaminhar o próximo ato autorizado.

Esse contrato é uma proposta de redação, não uma substituição já vigente. A implementação deverá manter a tabela de carregamento e mapear cada salvaguarda atual para seu destino antes de retirar qualquer regra.
