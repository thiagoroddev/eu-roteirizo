# Melhorias do pacote, vistas daqui

> Anotado por `mentor anotar --sobre pacote`. **Nao vira tarefa deste projeto.**
> Entra no relatorio de campo, e o trabalho acontece no repositorio do `mentor-agent`.
>
> As secoes datadas abaixo nasceram em `.mentor/melhorias-do-pacote.md`, escritas a mao antes
> de o comando existir. Movidas para ca em 02/09/26: arquivo acrescentado dentro de `.mentor/`
> conta como divergencia do pacote no `verificar`.

## Regra: corrigir aqui, levar ao pacote depois

Desde 15/09/26 (TASK-CHORE-025), problema encontrado no mentor-agent pode ser corrigido direto neste projeto, sem esperar uma versão nova do pacote. Depois de um tempo, as correções que continuaram valendo são levadas ao repositório do `mentor-agent` e viram versão oficial.

1. **Corrigir aqui.** A correção é feita no `.mentor/` deste projeto, dentro de uma tarefa. Mudar arquivo do `.mentor/` conta como código: o commit precisa do ID da tarefa no título.
2. **Registrar aqui.** Cada correção ganha uma entrada em "Corrigidas aqui", com estado, problema, o que mudou, arquivos, teste e o que fazer no pacote. O problema vem com o caso real: o que aconteceu, onde e quando.
3. **O texto exato fica no git.** A mudança linha por linha é o commit da tarefa, e também sai de `git log -p -- <arquivo>`. Nada é resumido nem copiado para cá.
4. **Cada correção tem teste** em `docs-mentor/melhorias-do-pacote.test.ts`. Se uma atualização do pacote desfizer a correção, o teste falha.
5. **Antes de atualizar o mentor-agent neste projeto, levar ao pacote as entradas com estado "aplicada aqui".** O `instalar --forcar` sobrescreve os arquivos corrigidos. Se a atualização acontecer antes, o git ainda guarda a correção e ela pode ser reaplicada.
6. **O `verificar` mostra uma linha de divergência do pacote enquanto houver correção local**, com os arquivos alterados. É esperado. Arquivo que aparecer nessa linha sem entrada em "Corrigidas aqui" é mudança esquecida e precisa de registro.
7. **Quando uma versão do pacote trouxer a correção,** a tarefa que atualizar o mentor-agent remove a entrada daqui e o teste dela.

Problema visto e ainda não corrigido continua indo para "Anotadas", pelo `mentor anotar --sobre pacote`, que escreve no fim deste arquivo.

## Corrigidas aqui

### 1 · Exemplo da marca `(plano)` no `entrega.md`

- **Estado:** aplicada aqui em 15/09/26, na TASK-CHORE-025, sobre o pacote 0.12.0. Falta levar ao pacote.
- **Problema:** `.mentor/processos/entrega.md`, seção "Planejamento independente e sessões isoladas", item 1, ensinava o título do PR de planejamento com a marca no fim: `docs: novo fluxo de checkout (plano)`. O `pronto-para-merge` usa `MARCA_PLANO_NO_TITULO`, de `.mentor/scripts/tipos.ts` (`/^[a-z]+\(plano\)!?:\s*\S/i`), que só aceita a marca na posição de escopo: `docs(plano): ...`. Seguindo o exemplo do documento, a esteira recusou o PR #48 deste projeto com "o titulo nao cita tarefa (TASK-X-NNN), nem a marca (light), nem (plano)" (15/09/26, ramo `plan/2026-09-15-base-final-motor-e-app-mobile`). As duas formas nasceram no mesmo commit da 0.12.0 (`e9d3fcb`, 14/09/26). O plano da versão dizia só "marca explícita `(plano)`", sem a posição, e nenhum cenário do pacote roda um título com `(plano)`.
- **O que mudou:** a linha passou a dizer que o PR de planejamento "leva a marca `(plano)` na posição de escopo do título, como `(light)`", com o exemplo `docs(plano): novo fluxo de checkout`. A regex não mudou: `(light)` usa a mesma forma, e o núcleo define o commit como `<tipo>(<marca>): <descrição>`.
- **Arquivos:** `.mentor/processos/entrega.md`.
- **Teste:** "o exemplo de PR de planejamento do entrega.md passa na marca (plano)". O teste lê o exemplo do próprio documento e o passa pela regex que o `pronto-para-merge` usa.
- **No pacote:** trocar a mesma linha em `.mentor/processos/entrega.md`. Criar um cenário que rode `pronto-para-merge --titulo` com o título do exemplo documentado, num ramo que só muda planejamento, e espere "Pronto para merge: PR de planejamento (plano) validado."

### 2 · Checagem de maiúsculas do `verificar` subia até a raiz do disco

- **Estado:** aplicada aqui em 15/09/26, na TASK-CHORE-025, sobre o pacote 0.12.0. Falta levar ao pacote.
- **Problema:** `existeComGrafiaExata`, em `.mentor/scripts/cmd-verificar.ts`, confere se cada pasta do caminho de um link existe com a grafia exata, e subia até a raiz do disco. Quando o projeto é aberto por um caminho digitado com outras maiúsculas (por exemplo `cd e:\Repositorios\...`, com a pasta real `E:\repositorios\...`), as pastas acima do projeto não batem letra por letra, e o `verificar` acusa todos os links com "so resolve porque este sistema de arquivos ignora maiusculas". Medido em 14/09/26 num clone deste projeto na pasta temporária da sessão, em que o disco tinha `e--repositorios-...` e o caminho usado dizia `E--repositorios-...`: 79 falsos positivos, inclusive nos links do próprio `.mentor/guia`. Reproduzido em 15/09/26 com um projeto criado por `mentor init` na pasta temporária do Windows e aberto pelo mesmo caminho em maiúsculas. A função é igual desde a 0.2.0 (`1667c8e`, 31/08/26). A anotação anterior deste arquivo dizia, por engano, que o problema vinha da 0.12.0.
- **O que mudou:** a função recebe a raiz do projeto e para de subir ao chegar nela ou numa pasta acima dela. As pastas abaixo da raiz continuam conferidas letra por letra. A raiz e o que fica acima dela ficam como vieram do terminal, porque não fazem parte do repositório. As duas chamadas, a dos links em markdown e a das referências de `referencias.json`, passam `c.raiz`.
- **Arquivos:** `.mentor/scripts/cmd-verificar.ts` (a função `existeComGrafiaExata`, as duas chamadas e `sep` importado de `node:path`).
- **Testes:** "caixa diferente acima da raiz do projeto nao reprova link certo" e "caixa errada dentro do projeto continua acusada". Os dois criam um projeto com `mentor init` na pasta temporária, com um link certo e um link com maiúscula errada, e rodam o `verificar` pelo caminho com as letras acima do projeto trocadas. Só rodam em sistema que ignora maiúsculas, como o Windows; no Linux são pulados.
- **No pacote:** aplicar a mudança de `cmd-verificar.ts` e criar um cenário com o mesmo projeto e as mesmas duas verificações, rodando só em sistema que ignora maiúsculas.

### 3 · Data e lembretes regravados no `contexto.json` a cada comando

- **Estado:** aplicada aqui em 15/09/26, na TASK-CHORE-026, sobre o pacote 0.12.0. Falta levar ao pacote. Resolve em parte a anotação de 15/09/26 04:26, abaixo: as contagens continuam no arquivo.
- **Problema:** dois campos do `docs-mentor/contexto.json` versionado mudavam sem mudança real no projeto.
  - `_meta.atualizado_em`: `atualizarContagens`, em `.mentor/scripts/vistas.ts`, gravava a data e a hora atuais toda vez que rodava, mesmo sem nada ter mudado. Ela roda dentro de `regenerarTudo`, chamada por `task`, `req`, `ref`, `fila`, `riscos`, `auditar`, `init`, `gerar` e `resolver-gerados`.
  - `lembretes`: o `doctor`, em `.mentor/scripts/cmd-doctor.ts`, gravava no arquivo a lista de avisos a cada execução, e o `resolver-gerados` a zerava em todo merge. A lista ficava indo e voltando entre vazia e preenchida.
  - Com isso, qualquer ramo que rodasse um comando do mentor mudava o arquivo, e dois PRs abertos ao mesmo tempo conflitavam. Medido em 15/09/26: os PRs #49 e #50 deste projeto conflitaram só em `atualizado_em`, e no fechamento do #52 o `doctor` deixou o `contexto.json` alterado só com os lembretes.
  - Nenhum código do pacote lê `atualizado_em` nem `lembretes`. A data da última mudança sai do `git log`, e os lembretes aparecem na tela do `doctor`, que o núcleo manda rodar no início de toda sessão.
- **O que mudou:**
  - `atualizarContagens` grava `_meta.atualizado_em` como `null`, e não mais a data atual.
  - O `doctor` grava `lembretes` como lista vazia e continua mostrando os avisos na tela.
  - Os dois valores fixos também limpam a data congelada e os lembretes antigos de quem vem de versão anterior.
  - As contagens (`contagens.*`) continuam no arquivo: só mudam com mudança real, e o `resolver-gerados` resolve esses conflitos.
- **Arquivos:** `.mentor/scripts/vistas.ts` (fim de `atualizarContagens` e o import de `agoraIso`, que ficou sem uso) e `.mentor/scripts/cmd-doctor.ts` (fim da função `doctor`).
- **Testes:** "gerar duas vezes sem mudanca real nao muda o contexto.json", "doctor duas vezes nao muda o contexto.json" e "doctor mostra lembretes sem grava-los no contexto.json". Os três criam um projeto com `mentor init` na pasta temporária e comparam o `contexto.json` byte a byte entre as execuções.
- **No pacote:** aplicar as duas mudanças e criar um cenário que rode `gerar` duas vezes e `doctor` duas vezes e compare o `contexto.json`. Avaliar também a sugestão da anotação de 15/09/26 04:26, que tira as contagens do arquivo versionado. Com as contagens fora, `atualizado_em` e `lembretes` podem sair do esquema de vez.

## Anotadas

As versões 0.4.0 a 0.12.0 do mentor aplicaram as melhorias sugeridas por este arquivo. A 0.12.0 (TASK-CHORE-024) aplicou as sete notas de 12/09 a 14/09/26 (Frentes A a G). As duas notas de 15/09/26 viraram as correções 1 e 2 acima. Anotações novas entram abaixo desta linha.

- **15/09/26 04:26** · O docs-mentor/contexto.json versionado guarda campos que o proprio mentor reescreve em quase todo comando: _meta.atualizado_em (data e hora) e contagens como tarefas_concluidas. Dois ramos que rodam comandos do mentor mudam essas linhas, e o merge do segundo sempre conflita, mesmo sem mudanca real em comum. Medido em 15/09/26 no Eu Roteirizo: o PR #49 (TASK-CHORE-025, que mudou atualizado_em e tarefas_concluidas 37 para 38) e o PR #50 (uma frase em versionamento.estrategia_de_ramos, que tambem mudou atualizado_em) conflitaram so em atualizado_em. A resolucao exigiu git merge origin/main, mentor resolver-gerados, um commit de merge, outro push e outra rodada de 3 min da esteira. Sugestao: tirar do arquivo versionado o que se deriva. A data de atualizacao sai do git log; as contagens se calculam na leitura (doctor, gerar) ou vao para uma vista gerada fora do contexto.json, com merge=ours no .gitattributes, como ja acontece com contexto.md e backlog.md.
