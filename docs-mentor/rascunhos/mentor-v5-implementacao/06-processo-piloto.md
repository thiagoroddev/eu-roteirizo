# 06 — Processo compacto, migração e piloto

Depende de: 01 a 05. Resultado: instruções e mecanismos concordam; o executor lê pouco, trabalha com plano existente e não negocia repetidamente o mesmo escopo. Não transformar esta etapa em reescrita de todos os guias.

## Onde mexer

- `.mentor/nucleo.md`: núcleo curto com invariantes verificáveis e roteamento; preservar condições de segurança e evidência.
- `.mentor/processos/tarefa.md`, `rascunho.md`, `teste.md`, `revisao.md`, `entrega.md`, `analise-de-impacto.md` e `laboratorio.md`: só trechos afetados pelos novos contratos.
- `.mentor/scripts/cmd-tarefa.ts`, `cmd-doctor.ts`, `cmd-auditar.ts`, `sensivel.ts`, `tipos.ts` e templates: retirar exigências automáticas incoerentes com o perfil compacto e auditoria por risco.
- `.mentor/guia/`: localizar referências contraditórias por busca direcionada. Não carregar ou reescrever tudo por padrão.

## Regras a consolidar

### Planejamento e execução são trabalhos diferentes

Planejamento produz decisões, escopo, critérios e referências suficientes; não executa testes completos, não abre tarefas/WIP automaticamente e não exige plano do plano. Pode ser feito por um modelo e executado por outro. Não fixar nomes de fornecedores/modelos nas regras: escolher capacidade conforme risco; reservar análise mais cara para incerteza real.

Quando o humano pede implementação de plano identificado, isso autoriza o escopo indicado sem repetir uma confirmação de início. Planejamento sozinho não autoriza implementação. Commit, push, PR, merge, deploy e ações destrutivas precisam de autoridade correspondente; o humano pode autorizá-los em conjunto de forma explícita. Registrar a declaração de autorização quando necessário, sem criar assinatura fictícia nem ritual de três perguntas se a resposta já foi dada.

O executor consulta o índice, a etapa, os contratos necessários e os símbolos afetados. Não reescreve plano em arquivo da sua ferramenta, não resume novamente para aprovação e não relê toda a história. Se a ferramenta exige plano interno, usar link e estado curto. Mudança material de objetivo, risco, interface ou escopo exige revisão; escolha local de implementação compatível não exige outra rodada de planejamento.

### Cerimônia proporcional

Manter Light/Standard/Strict. Standard compacto conserva estados, critérios, evidências e rastreabilidade, mas dispensa campos de ensaio sem valor para a decisão. Risco prevalece sobre tamanho: alteração pequena em autenticação, persistência, autorização, execução de comandos ou gates merece proteção e regressão.

Não exigir duas alternativas de biblioteca, discordância teatral ou ADR para correção localizada com causa/solução demonstradas. Exigir alternativas e impacto quando há decisão arquitetural real. Preservar premissas, contratos entre fatias e réguas de experimento de spikes quando pertinentes. Não apagar campos históricos só porque deixaram de ser obrigatórios.

Não tratar código como autoridade sobre intenção: ele descreve o que acontece; requisito descreve o que deveria acontecer. Divergência é achado, não licença para reescrever requisito.

### Revisão e auditoria

Revisão local de diff e critérios em toda mudança executável. Revisão independente conforme risco, especialmente mudanças nas próprias salvaguardas; sem agente extra automático para toda tarefa. Se a etapa exige revisão independente e ela não está disponível, declarar pendência; não simular independência revisando a si mesmo com outro título.

Pacote de revisão inclui objetivo, critérios, diff, evidências e apenas contexto adjacente necessário. Limitar o orçamento **total** do pacote, não só cada arquivo; listar omissões e permitir expansão sob demanda. Guardar achados por severidade/evidência, não preferência estilística. Não carregar narrativas e logs integrais de todas as tarefas.

Retirar bloqueio obrigatório de auditoria pós-merge por contagem fixa de tarefas, em `doctor` e no fechamento. Preservar comandos, histórico, achados pendentes e auditoria acionada por risco/incidente. Revisão antes da integração não resolve automaticamente auditorias antigas nem libera achados de segurança existentes.

Validação manual usa roteiro concreto ligado ao comportamento/escopo e resposta real do humano. “OK” pode bastar se responde a roteiro inequívoco; registrar referência e resposta sem solicitar transcrição burocrática. Mudança material invalida os casos afetados. Não dispensar automaticamente UI, persistência ou cálculos só por escolher perfil compacto.

### Trabalho e saída compactos

Busca por arquivo/símbolo → leitura focal → teste focal → implementação/testes → revisão/formatação → bateria final. Rodar novamente só o que perdeu validade quando a etapa 03 estiver ativa. Novo achado legítimo pode exigir teste adicional; eficiência não significa encerrar diante de bug conhecido.

Saída padrão de comandos com resumo e referência, detalhes sob demanda. Não reconsultar arquivo inalterado conhecido, não imprimir logs grandes no contexto e não realizar chamadas redundantes de status. Ao concluir, parar; não abrir auditoria geral ou gerar tarefa irmã sem necessidade.

## Mapa mínimo de migração normativa

| Regra anterior | Regra substituta e proteção que permanece |
| --- | --- |
| Reformular e aguardar sempre, mesmo com pedido claro | Pedido explícito autoriza escopo; ampliação material exige decisão |
| Plano refeito em cada tarefa/ferramenta | Fonte canônica por referência/revisão; evidência fica na tarefa |
| Campos de mérito obrigatórios em qualquer mudança | Campos por risco; requisitos, critérios e justificativa suficiente permanecem |
| Nova bateria em todo push | Executor e identidade validada; sem identidade, caminho conservador |
| Marca Light/Plano basta ou apenas pasta é conferida | Marca + diff + campos permitidos + base verificável |
| `doctor` persiste estado derivado | Diagnóstico somente leitura; migração/geração explícitas |
| Divergência local é ruído inevitável | Patch exato registrado; alteração adicional continua bloqueante |
| Auditoria periódica bloqueia todo ciclo | Revisão por risco e auditoria por evento; achados antigos preservados |

Testar coerência entre núcleo, processos, CLI e mensagens. Não prometer em docs uma capacidade que ficou pendente. Nenhuma regra deixa de existir só porque foi removida do núcleo: remover ou ajustar também as verificações/links correspondentes.

## Piloto e critérios finais

Executar cenários em fixtures e, com autorização de implementação específica, usar a próxima mudança real apropriada como piloto. Não inventar trabalho de produto para medir o Mentor.

- F06-1: planejamento isolado, criado numa ferramenta e entregue a outra, é encontrado pelo índice e usado sem reescrita, tarefa automática ou gate desnecessário.
- F06-2: correção localizada percorre Standard compacto, preserva teste de regressão e fecha somente com evidência compatível; não exige ensaio de alternativas sem decisão real.
- F06-3: mudança pequena de alto risco não recebe dispensa indevida; revisão independente/validação pertinente continuam exigidas.
- F06-4: tarefa antiga e nova coexistem; nenhuma migração massiva nem alteração de passado para “ficar verde”.
- F06-5: transição permite desligar cache e manter execução completa; falha de fingerprint/diff e alteração inesperada continuam bloqueando aprovação indevida.
- F06-6: nenhum check remoto foi removido/rebaixado incidentalmente; validação de publicação, se não autorizada ou não acessível, fica explicitamente pendente.

Medir no mesmo conjunto pequeno de cenários, antes/depois quando houver baseline: comandos/gates executados, hits e motivos de miss, chamadas de ferramenta, bytes de saída/contexto observáveis, intervenções humanas, tempo de máquina, falsos bloqueios e falsos verdes. Tokens/custo apenas quando houver telemetria real; consumo global da conta não é medida isolada da tarefa. Não executar benchmark completo a cada tarefa nem inventar meta percentual de economia.

Critério de sucesso: reduzir repetição nos cenários cobertos e passar todos os testes de segurança/regressão, com zero falso verde nos casos testados. Limitações e números não medidos ficam declarados. Entrega final: roteiro curto para planejar, localizar plano, executar etapa, validar e publicar quando autorizado. Nada de manual duplicado por modelo.

Fora de escopo: cache remoto, roteador automático de modelos, telemetria comercial, dashboard, novo framework de agentes, serviço de aprovação e port automático ao upstream. Rollback de normas deve preservar os documentos/referências e retornar ao caminho conservador, não ressuscitar bugs de aprovação ou apagar registros.
