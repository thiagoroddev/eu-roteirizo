# Melhorias do pacote, vistas daqui

> Anotado por `mentor anotar --sobre pacote`. **Nao vira tarefa deste projeto.**
> Entra no relatorio de campo, e o trabalho acontece no repositorio do `mentor-agent`.
>
> As secoes datadas abaixo nasceram em `.mentor/melhorias-do-pacote.md`, escritas a mao antes
> de o comando existir. Movidas para ca em 02/09/26: arquivo acrescentado dentro de `.mentor/`
> conta como divergencia do pacote no `verificar`.

## As versões 0.4.0 a 0.8.1 do mentor aplicaram as melhorias sugeridas por este arquivo. Ficou abaixo só o que ainda falta; anotar novas descobertas a partir de 13/09/26 17:49.

- **12/09/26** · Restricao fundadora sem mecanismo (M3 da analise "O mentor audita a forma e nunca o conteudo", de 12/09; M1, M2, M4 a M8 e o dever de contrariar entraram na v0.6.0). A v0.7.0 tem o campo opcional plano.restricoes_reavaliadas (restricao, onde foi escrita, o que elimina, reconfirmada), mas nenhum comando pede, confere ou conta esse campo, e nada transforma tres reconfirmacoes em ADR; processos/tarefa.md so descreve a regra em texto. Caso de origem: a frase "sem backend e sem API de roteirizacao paga" do package.json apagou matriz de custo e solver do cardapio de tres spikes seguidos.

- **12/09/26** · Erro de composicao de epico fatiado continua sem cerimonia (diagnostico 3 da mesma analise, que nunca virou proposta). Cada fatia e planejada e aprovada sozinha, e nada avalia se a soma das fatias ainda aponta para o lugar certo; a revisao de estrategia da v0.6.0 so dispara depois de dois spikes inconclusivos do mesmo tema. Caso de origem: os spikes 001 a 003 de auto-roteirizacao, cada um correto isoladamente, com o epico inteiro na direcao errada (TSP/VRP tem solver consolidado).

- **13/09/26 02:47** · Quando o teste automatizado nao basta para validar um criterio (depende de tela, de dado real, de servico ao vivo, ou cobre a palavra isolada e nao a combinacao), o agente deve propor e construir, dentro da propria tarefa, um meio de o humano testar todos os casos rapido: roteiro ou fixture ficticio gerado por script a partir da mesma tabela de casos dos testes, prototipo ou algoritmo de apoio, com o esperado visivel ao lado do resultado. O teste em codigo e o que da garantia; se o que existe nao e suficiente, crie o que seja. Dispensar a validacao manual, ou pedir 'valide no app' sem esse meio, transfere ao humano uma caca ao tesouro por endereco real. Caso de origem: TASK-BG-017 testou 9 palavras isoladas, dispensou a validacao e deixou passar 'Edificio Central, sala 302' saindo residencial (AUD-002-B01/R05); rodar o classificador sobre uma tabela de casos ficticios expos a regressao na hora, e a TASK-BG-021 transformou a tabela em testes e num roteiro importavel.

- **13/09/26 03:30** · Atualizar o proprio pacote nao tem roteiro na norma (resto da AUD-002-B02; a v0.7.0 trouxe o alerta de arvore suja no task iniciar, a trava de retroativa e o task criterio). Na TASK-CHORE-016 o npm i veio antes da tarefa e o commit_base ja continha a mudanca; na TASK-CHORE-019 a tarefa nasceu antes do npm i e fechou com diff real. Sugestao: processos/ dizer que a atualizacao do pacote comeca por task nova e task iniciar, e so depois npm i e instalar --forcar. A TASK-CHORE-020 (0.8.1) repetiu essa ordem, que continua so na memoria de quem ja fez.

- **13/09/26 03:49** · Evidencia de validacao manual aprovada passa com 10 caracteres (resto da AUD-002-R08; a v0.8.0 fez a dispensa reconhecer UI). task validar --aprovado e finalizar --validado-por-humano aceitam "ok, testei" como passos executados e resultado observado.
