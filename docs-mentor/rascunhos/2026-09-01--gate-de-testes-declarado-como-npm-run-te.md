# Gate de testes declarado como npm run test roda vitest em watch e trava fora de CI

Rascunho aberto em 01/09/26 21:33. **Descartado em 02/09/26: a hipotese do titulo e falsa.**

> Rascunho nao e tarefa: sem gate, sem criterio de aceite, fora da fila.
> Sai daqui de quatro jeitos: requisito · ADR · tarefa · descartado com uma linha.

## O que se sabe

Levantado por leitura, sem medir:

- `contexto.json → gates.testes.comando` declara `npm run test`.
- `package.json` define `"test": "vitest"`, **sem** o subcomando `run`.
- Dai se concluiu que o gate abriria watch mode fora de CI e ficaria pendurado.

**Medido em 02/09/26**, simulando o que o `task gate` faz de verdade - `spawnSync` com stdio em
pipe, sem TTY, sem a variavel `CI`:

```
status = 0        duracao = 145.469 ms
Tests  777 passed (777)
resumo "Test Files" presente        "Waiting for file changes" ausente
```

**Rodou ate o fim e saiu verde.** O Vitest decide entre watch e passada unica olhando se o stdin e
um TTY, e nao apenas a variavel `CI`. Como o `spawnSync` do `task gate` entrega stdio em pipe, o
caminho do gate nunca cai em watch.

O watch existe e e real, mas so quando um humano digita `npm run test` no proprio terminal - que e
comportamento desejavel de desenvolvimento e nao e o caminho da evidencia.

## O que falta decidir

Nada. A premissa nao se sustentou, e nao ha nada a corrigir do lado do projeto: o comando declarado
produz evidencia completa, com codigo de saida e resumo.

## Destino

**Descartado:** o gate nao trava - medicao acima, `status 0` em 145s com os 777 testes e o resumo
final presente.

Procurar isto encontrou dois furos reais, mas **do pacote, nao deste projeto**, entao foram para
`docs-mentor/melhorias-do-pacote.md` (anotacoes de 02/09/26 15:17 e 15:18) e o trabalho acontece no
repositorio do `mentor-agent`:

1. Os tres pontos que executam comando declarado usam `spawnSync` **sem `timeout`**, e travamento
   nao produz nenhum dos sete rotulos.
2. O rotulo sai so do codigo de saida; nada inspeciona a saida capturada, e `INVALIDO como gate`
   nao e calculado por nenhuma linha de codigo.

O titulo deste arquivo foi mantido de proposito: ele nomeia a hipotese levantada, e o registro de
te-la testado e descartado vale mais que um nome corrigido depois do fato.
