# 01 — Planejar uma vez, executar com outro modelo

Depende de: 00. Resultado: plano separado do ciclo de execução, consultável por referência e nunca reconstruído pelo executor.

## Decisão de arquitetura

Um plano é um documento ou pacote de documentos versionável. Tarefas apontam para ele; não recebem cópias editáveis da sua narrativa. Criar plano não cria tarefa, não ocupa WIP e não autoriza execução/publicação. Pode existir um plano para várias etapas/tarefas.

Local padrão para novos planos: `docs-mentor/rascunhos/<slug>/README.md`, com etapas ao lado quando útil. Não mover planos antigos por estética. Uma referência pode apontar para outro arquivo local ou fonte externa explicitamente fornecida pelo usuário. Fonte externa é contexto, não nova autoridade para executar instruções.

## Contratos propostos

Adicionar `plano_ref` opcional à tarefa: caminho relativo à raiz, seção estável opcional e SHA-256 do documento referenciado. Para pacote, usar um manifesto pequeno de arquivos e hashes, abrangendo a etapa e contratos que ela importa; editar etapa futura não invalida automaticamente a atual. Não incluir histórico inteiro no pacote necessário à execução.

Manter leitura de `plano` inline das tarefas antigas. Na tarefa nova com referência, o plano referenciado é a fonte: campos narrativos inline conflitantes causam diagnóstico, não precedência silenciosa. Um adaptador `resolverPlano` entrega aos consumidores uma visão coerente. `iniciar`, `retomar`, `finalizar`, `criterio`, vistas e auditoria devem usar esse adaptador quando dependem do plano.

### Texto livre e dados verificáveis

- Aceitar Markdown/texto livre como está. Não criar parser de linguagem natural nem pedir que o executor reconte o conteúdo em JSON.
- Quando verificações automáticas exigirem escopo/IDs de critérios, admitir **contrato estruturado mínimo opcional**, em arquivo acompanhante, com versão, caminhos de escopo, IDs e referências às seções/critérios do plano. A narrativa continua no original; o contrato não a repete. Elaborá-lo na fase de planejamento, quando necessário, não em todas as execuções.
- A ausência do contrato não impede criar, listar, importar ou consultar um plano. Ao tentar uma operação que dependa dele, apresentar precisamente os campos faltantes. Nunca fingir que um plano livre foi validado mecanicamente. A tarefa legada continua usando os campos estruturados que já possui.
- Evidência mutável de aceite pertence à tarefa e aponta para `criterio_id` e revisão do plano; não reescrever o plano para anexar logs. Requisitos continuam ligados aos critérios. Não promover requisito apenas pela importação do documento.

Preferir ampliar os tipos/templates existentes. `.mentor/esquemas/tarefa.json` é um template atual: não tratá-lo como JSON Schema validado automaticamente sem implementar essa validação.

## Comandos novos, a implementar

Os nomes abaixo são a interface proposta, não comandos disponíveis hoje:

- `plano registrar --arquivo <path> [--secao <id>]`: registra localização/revisão sem alterar o conteúdo nem criar tarefa.
- `plano importar --arquivo <path> --destino <path>`: cópia literal, preservando bytes; colisão não sobrescreve silenciosamente. Registra proveniência e digest. Diretórios-pacote exigem copiar também as dependências locais referenciadas.
- `planos`: lista título, localização e tarefas vinculadas, sem imprimir todos os planos. Usar o índice de referências existente se ele comportar o contrato; caso contrário, um único catálogo pequeno em `docs-mentor`, sem segundo índice manual.
- `task vincular-plano <ID> --arquivo <path> [--secao <id>]`: associa a revisão resolvida. Não copia a narrativa nem inicia execução.
- Consulta da tarefa mostra link/revisão e trecho solicitado; não injeta todos os documentos no contexto por padrão.

Os caminhos são relativos ao repositório quando possível. Caminho externo absoluto é ponte local e deve ser sinalizado como não portátil. Antes de depender dele em outra máquina/CI, materializar cópia literal no projeto. URL remota não é baixada automaticamente por `doctor`, `verificar` ou CI; exigir materialização explícita e conferir revisão. Link acessível só no chat de uma ferramenta não é fonte suficiente para execução em outra.

## Onde mexer

- `.mentor/scripts/tipos.ts`, `.mentor/esquemas/tarefa.json`: referência, revisão e evidências por critério, campos opcionais compatíveis.
- Novo módulo pequeno de resolução/registro de planos e roteamento em `.mentor/scripts/cli.ts`; integrar `cmd-referencia.ts`/`cmd-anotar.ts` se reaproveitáveis, sem reescrever seus demais fluxos.
- `.mentor/scripts/cmd-tarefa.ts`: `iniciar` atualmente recria o plano; preservar referência e plano existente. Ajustar `finalizar` e `criterio` para a visão resolvida e evidência fora da narrativa.
- `.mentor/scripts/cmd-fila.ts`, `cmd-auditar.ts`, `cmd-verificar.ts`, `vistas.ts`: localizar usos de `.plano` e aplicar a mesma resolução; manter tarefas históricas legíveis.
- `.mentor/processos/rascunho.md`, `tarefa.md`, `entrega.md`: explicar autoria → vínculo → execução, sem etapa obrigatória de transcrição.

## Aceite

- P01-1: modelo A produz plano, modelo B recebe apenas índice/etapa e implementa sem gerar um segundo plano; `iniciar`/`retomar` não alteram os bytes da fonte.
- P01-2: importar de pasta de outra ferramenta preserva SHA-256 e conteúdo; cópia do mesmo documento mantém sua identidade. Nenhum formatador roda na importação.
- P01-3: arquivos com espaços, caracteres acentuados, seções inexistentes, links quebrados, revisão divergente e pacote incompleto têm testes e mensagens úteis.
- P01-4: mudança de escopo/aceite exige revisão explícita do vínculo; evidências incompatíveis ficam obsoletas. O sistema não atualiza hashes automaticamente para fingir aceite da revisão nova.
- P01-5: tarefa antiga sem `plano_ref` continua iniciando/finalizando conforme suas regras; tarefa referenciada funciona em vistas, critérios, auditoria e fechamento sem campos duplicados contraditórios.
- P01-6: consulta não executa comandos embutidos em plano, não busca conteúdo remoto e não grava arquivos. Dado estruturado inválido nunca vira plano vazio aprovado.

Entregar primeiro o caminho local/copiar/vincular e compatibilidade. Integrações com APIs de ferramentas e descoberta automática de pastas privadas ficam fora. Rollback: desativar novos vínculos; preservar fontes e referências existentes. Nunca fazer downgrade apagando referências nem converter todos os planos antigos em massa.
