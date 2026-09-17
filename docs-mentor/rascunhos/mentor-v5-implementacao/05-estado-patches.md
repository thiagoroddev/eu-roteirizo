# 05 — Consultas sem escrita e patches locais reconhecidos

Depende de: 00. Resultado: consultar não suja o checkout; divergência conhecida do pacote é distinguida de alteração inesperada. Pode ser entregue em duas mudanças isoladas: consultas e registro de patches.

## Onde mexer

- `.mentor/scripts/cmd-doctor.ts`: retirar limpeza de lembretes e persistência de `qualidade.perfil` do diagnóstico.
- `.mentor/scripts/vistas.ts`: `atualizarContagens` e `regenerarTudo`; separar projeção em memória de geração explícita de vistas.
- `.mentor/scripts/cmd-verificar.ts`, `cmd-pacote.ts`, `instalar.mjs`: verificação do manifesto, reconhecimento de patch e proteção na atualização, incluindo o caminho via `npx`.
- `.mentor/scripts/cmd-resolver.ts`: conferir mesclagem de estado canônico/derivado e ausência de perda de dados.
- `docs-mentor/melhorias-do-pacote.md`: atualizar a regra de manutenção somente quando os mecanismos correspondentes existirem.

## Consultas e fonte de verdade

`doctor`, `verificar`, listagens, leitura de planos e relatórios devem ser funções somente leitura do ponto de vista do projeto. Calcular contagens, perfil e recomendações em memória. Nenhuma remoção de lembretes ou atualização de contexto como efeito colateral de diagnóstico.

Vistas Markdown/índices derivados podem continuar úteis, mas regeneração é operação explícita de escrita, determinística e idempotente. Operações que alterem dados canônicos podem atualizar suas vistas documentadas; consulta não pode. Não exigir um commit só porque alguém abriu uma sessão.

Campos derivados antigos continuam legíveis durante a transição. Não limpar registros históricos em massa. Criar migração explícita com modo de prévia, lista de arquivos afetados e segunda execução sem diff; nunca executar migração automaticamente em `doctor`. Conflitos de dados canônicos não podem ser resolvidos com “regerar tudo”.

## Registro estruturado de patches

Usar um registro versionado pequeno, por exemplo `docs-mentor/patches-do-pacote.json`, gerado por comando, com: versão/base do pacote, caminhos exatos, digest base, digest local aceito, referência da tarefa/correção e evidências/testes vinculados. Nomes de arquivos anotados em Markdown não são whitelist de qualquer alteração futura.

O comando de registro calcula hashes; não pede que a IA os digite. Registrar intenção ou teste pendente não equivale a patch validado. O Markdown de melhorias mantém caso real, decisão e ação de upstream; o diff continua no Git, sem cópia manual.

Classificar divergências:

- arquivo intacto da versão-base: normal;
- divergência exata registrada e válida: aviso de patch local conhecido, distinguível no resultado estruturado;
- arquivo mudou além do patch, registro inválido, base não resolvida ou teste exigido sem evidência: problema acionável, não aviso genérico ignorável;
- correção incorporada oficialmente: transição explícita de estado após verificar versão/conteúdo e regressão; preservar histórico necessário.

Atualização/instalação deve fazer prévia de conflitos e preservar patches. `--forcar` não pode apagar silenciosamente correções locais reconhecidas. Não aplicar patch automaticamente por semelhança de texto sem verificar resultado. Oferecer atualização compatível ou parar com caminhos e ação necessária; o usuário decide conflitos materiais. Não instalar upstream durante esta etapa apenas para exercitar o fluxo: usar fixtures.

Corrigir a regra atual que manda remover o teste junto da entrada incorporada: manter regressão onde ainda protege o comportamento; mover para o pacote oficial quando houver cobertura equivalente demonstrada, em vez de apagar a única proteção.

## Aceite

- S05-1: snapshots de arquivos antes/depois de duas execuções de consultas são idênticos; uma fixture evidencia que lembretes/perfil não foram escritos.
- S05-2: geração explícita e migração são idempotentes; consultas de registros antigos funcionam sem migração obrigatória.
- S05-3: patch exato conhecido é reconhecido; editar mais uma linha no mesmo arquivo torna a divergência desconhecida. Testar adição, remoção, registro adulterado e mudança da versão-base.
- S05-4: update normal e forçado em fixture não perdem patch nem alterações do usuário; conflito não resolvido não é reportado como instalação bem-sucedida.
- S05-5: incorporação upstream não apaga a única regressão nem reescreve o histórico das tarefas concluídas.

Não adicionar `verificar` como check obrigatório remoto enquanto sua semântica de patches/migração não estiver pronta e a política remota não for conferida. Rollback: desabilitar migração/reconhecimento novo e bloquear atualização conflitante; não remover patches para fazer o manifesto passar.
