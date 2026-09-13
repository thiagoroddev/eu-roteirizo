# TASK-CHORE-019 · Atualizar mentor-agent para v0.7.0

## Decisoes tomadas

- **A tarefa nasceu antes do `npm i`**, a partir do `main` limpo (`commit_base` 1ee5e6b). É a correção do que a AUD-002-B02 apontou na TASK-CHORE-016: lá o `commit_base` já continha a atualização e a trava de escopo rodou sobre diff vazio.
- **Comandos executados, na ordem pedida pelo humano:** `npm i -D github:thiagoroddev/mentor-agent#v0.7.0`, `npx mentor instalar --forcar`, `node mentor.mjs resolver-gerados` e `node mentor.mjs verificar`.
- **O que a v0.7.0 mudou no projeto:** 12 arquivos do pacote (`.mentor/`), com mudança de norma só em `processos/tarefa.md`; o `nucleo.md` não mudou. A norma nova:
  - trava de tarefa retroativa no `finalizar` (flag explícita `--retroativa`);
  - dispensa de validação em cálculo, persistência, algoritmo e spike exige motivo com no mínimo 30 caracteres;
  - `task validar --aprovado` exige evidência e grava `codigo_saida: null`;
  - comandos novos: `task criterio`, para evidência executável de critério, e `task anexar`, para link de CI ou PR, inclusive em tarefa concluída.
- **A correção local do parser de `plano.muda` (AUD-002-R09) foi sobrescrita pelo `instalar --forcar`, como previsto.** A v0.7.0 traz a mesma correção no pacote, então a divergência local deixou de existir.
- **`resolver-gerados` sem conflito:** gravou só a versão 0.7.0 e as contagens. O bloco `auditoria` (AUD-002) ficou intacto, conferido contra o `main`.
- **O `verificar` reprovou com dois marcadores.** Um era o esqueleto desta própria narrativa, resolvido ao escrevê-la. O outro, um falso positivo em `melhorias-do-pacote.md`: a tabela da seção de 12/09 cita o token do marcador como tipo de recusa. A correção foi tirar os dois-pontos da célula, sem mudar o sentido. Esse reprovado já existia no `main` desde o PR #34 e ninguém viu, porque nem o hook de pre-push nem a esteira rodam o `verificar`.

## O que nao foi feito, e por que

- **Não corrigi o detector de marcadores no pacote.** Ficou anotado em `melhorias-do-pacote.md`: incluir o próprio arquivo de melhorias na lista de conteúdo, ignorar ocorrência dentro de crase e rodar o `verificar` no pre-push.
- **Não mexi nas tarefas abertas antes da atualização** (TASK-RF-044 no ciclo, TASK-SPIKE-003 pausada no ramo local). As regras novas valem para elas no fechamento.

## Testes de descoberta

Nenhum.

## Aprendizados

- **O aviso de alteração de normas da v0.7.0 (AUD-002-R08) não aparece pelo comando documentado.** O código foi para `cmd-pacote.ts`, mas `npx mentor instalar --forcar` passa por `instalar.mjs`. Quem atualiza o pacote precisa olhar `git diff -- .mentor/nucleo.md .mentor/processos` por conta própria até o pacote corrigir.
- **A ajuda do CLI diz `task criterio <ID> <n> [--cmd|--saida]`, mas o código lê `--comando`** e o índice começa em 0.
- **Rode o `verificar` antes de mergear PR que mexe em `docs-mentor/`.** Os gates verdes não cobrem marcadores, tetos nem ponteiros.
