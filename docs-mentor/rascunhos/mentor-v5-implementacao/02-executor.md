# 02 — Um executor, resultados confiáveis

Depende de: 00. Resultado: comandos de gate compartilhados, registro por execução e saída compacta. **Ainda sem cache habilitado**: a etapa 03 fornece identidade confiável.

## Onde mexer

- `.mentor/scripts/cmd-gates.ts`: hoje roda todos os gates sem registrar na tarefa.
- `.mentor/scripts/cmd-tarefa.ts`: `registrarGate`, `rastroDaExecucao`, `finalizar`, `anexar` e `validar`.
- `.mentor/scripts/cli.ts`: hoje `task gate` retorna 0 após chamar `registrarGate`, independentemente do resultado. Propagar falhas até o processo chamador.
- `.mentor/scripts/tipos.ts`, `.mentor/esquemas/tarefa.json`: resultado versionado e leitor compatível; módulo novo de executor compartilhado.
- `.mentor/processos/teste.md` e `tarefa.md`: documentação dos comandos efetivamente entregues.

## Contrato

Expor `task gates <ID>` para todos os gates automáticos declarados. `task gate <ID> <nome>` permanece e usa o mesmo executor. `mentor gates` usa o executor sem exigir tarefa; não anuncia evidência associada a tarefa quando não houver associação. Gate manual não é subprocesso e mantém estado próprio.

Resultado mínimo: versão, identificador da execução, gate, comando efetivo, cwd relativo, início/fim, código de saída ou sinal, estado, referência do log, resumo e identidade dos insumos quando disponível. Estados distinguem aprovado, falhou, não executado, interrompido e inválido. Preservar leitura dos rótulos antigos com mapeamento explícito, sem promovê-los a evidência nova.

Executar sequencialmente e parar na primeira falha por padrão. Exibir os demais como não executados **nesta bateria**, preservando o histórico anterior sem apresentá-lo como resultado desta execução. Timeout, erro ao iniciar, interrupção e falha ao persistir evidência retornam erro. Não executar comandos vazios; configuração sem gates informa ausência, nunca “todos verdes”. Fechamento consulta a política de gates exigidos, não a simples ausência de entradas.

Persistir cada resultado terminado, com escrita atômica no mesmo volume. Evitar perda de campos de tarefa numa escrita concorrente: bloqueio por tarefa ou comparação de revisão com falha explícita. Não segurar estado antigo e sobrescrever a tarefa inteira depois do subprocesso. Na retomada, as aprovações só poderão ser reutilizadas após validação da etapa 03; até lá, executar novamente.

## Evidência e saída

- Guardar log uma vez em diretório local de evidências, fora dos insumos que invalidam o próprio gate. JSON da tarefa contém resumo e referência, não saída inteira repetida.
- Padrão de saída do CLI: uma linha por gate, motivo de falha/invalidação e caminho do log; flag explícita de detalhe para investigação. Limitar também o log persistido ou usar rotação com truncamento declarado. Não expor segredos em stdout, arquivos versionados ou parâmetros registrados.
- Comando silencioso pode ser válido. Comando de testes que não coletou teste algum não é sucesso: usar sinal estruturado do runner configurado ou opção que reprove zero testes. Não detectar isso com exigência genérica de texto não vazio nem com regex universal para todos os runners.
- Teste focal é evidência focal; não substitui a suíte inteira declarada. TDD vermelho deve falhar pela asserção/cenário pretendido, não por import quebrado ou comando inexistente. Registrar verificação do motivo e preservar a dispensa justificada existente quando aplicável.
- Importar arquivo/log/URL não o torna prova de execução local nem aprova automaticamente gate. Marcar origem e capacidade de verificação; autorização humana não pode ser fabricada por CLI.
- Finalização verifica todos os gates automáticos exigidos, não apenas testes/build. Não modificar aceites manuais com base no código de saída de subprocesso.

## Aceite

- G02-1: CLI retorna não zero para gate falho, timeout, interrupção, configuração inválida e falha de escrita; silencioso válido retorna zero.
- G02-2: bateria executa cada comando uma vez; primeiro erro impede os seguintes; resultado anterior persistido sobrevive a interrupção.
- G02-3: zero testes coletados não aprova o gate de testes; focal verde não satisfaz gate completo.
- G02-4: duas escritas concorrentes não apagam critérios/achados nem misturam evidências; histórico antigo permanece legível.
- G02-5: gate não declarado, obrigatório sem comando e lista vazia produzem diagnóstico específico e não liberam fechamento indevido.
- G02-6: saída padrão e JSON são pequenos; log detalhado pode ser consultado sob demanda; evidência importada não se passa por execução atestada.

Não paralelizar subprocessos nem criar scheduler nesta etapa. Rollback: manter interface antiga apontando para executor corrigido; não voltar ao exit code sempre zero. Handoff: interface, versão do registro, comandos focais e limitações de runner reconhecidas.
