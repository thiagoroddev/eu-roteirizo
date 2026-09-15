# Melhorias do pacote, vistas daqui

> Anotado por `mentor anotar --sobre pacote`. **Nao vira tarefa deste projeto.**
> Entra no relatorio de campo, e o trabalho acontece no repositorio do `mentor-agent`.
>
> As secoes datadas abaixo nasceram em `.mentor/melhorias-do-pacote.md`, escritas a mao antes
> de o comando existir. Movidas para ca em 02/09/26: arquivo acrescentado dentro de `.mentor/`
> conta como divergencia do pacote no `verificar`.

## As versões 0.4.0 a 0.12.0 do mentor aplicaram as melhorias sugeridas por este arquivo. A 0.12.0 (TASK-CHORE-024) aplicou as sete notas de 12/09 a 14/09/26 (Frentes A a G). Ficou abaixo só o que ainda falta; anotar novas descobertas a partir de 15/09/26.

- **15/09/26 00:39** · O verificar da 0.12.0 confere a caixa de cada pasta do caminho de um link ate a raiz do disco (existeComGrafiaExata em cmd-verificar.ts), nao so dentro do projeto. No ensaio da atualizacao (14/09/26, clone do piloto no scratchpad), a pasta existia no disco como e--repositorios-... e o caminho usado dizia E--repositorios-...: o verificar reprovou com 79 falsos positivos de link que so resolve porque o sistema ignora maiusculas, inclusive links do proprio .mentor/guia. No caminho real do piloto passa. Qualquer sessao aberta com o caminho digitado em outra caixa (cd e:\Repositorios\...) reprova o projeto inteiro no Windows. Sugestao: parar a subida na raiz do projeto (caminhos().raiz) e comparar so os segmentos relativos a ela.
