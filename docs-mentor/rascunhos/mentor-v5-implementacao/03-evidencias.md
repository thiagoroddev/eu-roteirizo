# 03 — Identidade dos insumos e cache local conservador

Depende de: 02. Resultado: reutilizar apenas o que continua comprovadamente válido. Começar com fingerprint amplo; otimização por subconjuntos vem depois de medição, não de adivinhação.

## Onde mexer

- `.mentor/scripts/cmd-tarefa.ts`: substituir a responsabilidade de `hashDaArvoreAtual`/`rastroDaExecucao` por módulo compartilhado; fechamento deve consultar a mesma validade do executor.
- Executor da etapa 02, `.mentor/scripts/tipos.ts` e configuração de gates: chave versionada, motivo de invalidação e política explícita.
- Testes em `docs-mentor/melhorias-do-pacote.test.ts`, especialmente conteúdo executável em documentação e árvore com arquivos não rastreados.

## Algoritmo e limites

1. Enumerar insumos sem alterar o índice Git real. Usar lista ordenada de caminhos relativos, conteúdo, tipo/modo de arquivo e ausências relevantes; incluir arquivos rastreados modificados, novos não ignorados e deleções. Symlinks incluem destino e regras de resolução: insumo externo não identificado desabilita cache. Tratar caixa e separadores de forma determinística sem fundir nomes distintos em sistemas sensíveis à caixa.
2. Por padrão incluir todos os insumos potencialmente executáveis/configuráveis do repositório. **Não excluir `docs-mentor/`, `.mentor/`, `.github/` ou hooks inteiros.** Testes, fixtures, corpus, scripts, lockfiles, configuração e regras que afetam execução/aceite participam.
3. Excluir apenas saídas declaradas do gate e metadados não semânticos conhecidos (logs, evidência, timestamps e vistas derivadas). Em `contexto.json`, projetar campos que influenciam o gate, não descartar o arquivo inteiro. O campo de evidência que o executor acabou de escrever não pode invalidar seu próprio teste.
4. A chave por gate inclui versão do algoritmo, digest de insumos, comando, política/configuração relevante, versão do executor, runtime/plataforma e identidade das dependências. Lockfile sozinho não prova `node_modules`: exigir instalação controlada/atestado compatível ou desabilitar reutilização. Não criar um scanner enorme de dependências como primeira solução.
5. Ambiente/corpus privado/arquivo ignorado consumido pelo comando precisa ser declarado e identificado, ou cache fica desligado para aquele gate. Não registrar segredo nem hash ingênuo de segredo de baixa entropia; preferir desabilitar cache quando o segredo influencia o resultado e não há identidade segura.
6. Calcular antes e depois da execução. Diferença torna o resultado não reutilizável; hash nulo/erro de acesso nunca é chave válida. Evitar escritores concorrentes durante o gate ou executar snapshot isolado. Duas medições não detectam arquivo alterado e restaurado no meio; documentar a limitação, não prometer prova absoluta.
7. Reutilizar somente resultado aprovado, íntegro, de versão suportada e chave idêntica. Emitir “reutilizado” com a execução de origem, não novo horário falso de execução. Com `--forcar`, executar novamente. Resultado falho/interrompido/inválido não vira hit.

Separar evidência de execução de evidência de aceitação: mudar critério do plano pode exigir nova aceitação/revisão sem obrigar build idêntico. Mudanças em política que afetem o próprio gate invalidam o gate. Cache de `npm audit`/consultas externas não é indefinido: executar fresco na publicação ou aplicar política temporal explícita; nunca usar só o hash do código.

Logs locais podem não acompanhar um clone. Se o registro depende de artefato ausente, não reutilizar. JSON de tarefa é registro auditável local, não atestação criptográfica contra autor malicioso. CI independente continua obrigatória.

## Casos de teste obrigatórios

- E03-1: executar bateria duas vezes sem mudanças reutiliza aprovações compatíveis; gravar sua evidência não causa invalidação circular.
- E03-2: mudar código, teste sob `docs-mentor`, fixture, lockfile, script do Mentor, comando, política ou runtime invalida os gates afetados segundo a política conservadora.
- E03-3: novo arquivo, deleção, rename, mudança de modo e staging parcial são identificados; índice real fica byte a byte intacto. Testar paths com espaços e acentos.
- E03-4: alterar prosa pura explicitamente excluída não repete gate; prosa usada como fixture/entrada declarada continua invalidando.
- E03-5: hash nulo, versão desconhecida, artefato ausente, corpus ignorado não declarado e dependências não identificadas impedem cache e explicam por quê.
- E03-6: editar insumo durante execução invalida reutilização; retomar bateria repete somente gates sem prova válida. Evidência antiga não é promovida por migração.

Habilitar por configuração explícita depois dos testes; na dúvida executar, não aprovar. Fechamento sem identidade confiável deve apontar a pendência ou usar uma política conservadora explicitamente definida de execução final isolada — não continuar só com aviso. Rollback: desligar cache e executar integralmente, preservando registros; não apagar histórico.
