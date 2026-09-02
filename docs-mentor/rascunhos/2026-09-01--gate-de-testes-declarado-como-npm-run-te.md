# Gate de testes declarado como npm run test roda vitest em watch e trava fora de CI

Rascunho aberto em 01/09/26 21:33.

> Rascunho nao e tarefa: sem gate, sem criterio de aceite, fora da fila.
> Sai daqui de quatro jeitos: requisito · ADR · tarefa · descartado com uma linha.

## O que se sabe

- `contexto.json → gates.testes.comando` declara `npm run test`.
- `package.json` define `"test": "vitest"`, **sem** o subcomando `run`.
- Vitest so' faz uma passada e sai quando detecta CI. O workflow `.github/workflows/quality.yml`
  roda em GitHub Actions, que exporta `CI=true`, entao a esteira passa e o verde dela e' legitimo.
- Na maquina do humano nao ha' `CI`: o mesmo comando abre **watch mode** e fica pendurado.
  `task gate <ID> testes` executa o comando declarado e espera ele terminar, entao o gate nao
  fecha e nenhuma evidencia e' gravada.
- Nao ha' script alternativo: nao existe `test:ci` nem `test:run` no `package.json`.

## O que falta decidir

- Trocar o comando do gate para `npx vitest run`, ou criar um script `test:ci` e apontar o gate
  para ele. O segundo mantem `npm run test` como o comando de desenvolvimento com watch, que e'
  util e ninguem quer perder.
- Se o workflow tambem passa a usar o comando novo, para esteira e gate local rodarem o mesmo
  comando. Hoje eles coincidem por texto e divergem por ambiente, que e' o pior dos dois mundos.
- Nada disso e' Light: mexe em `package.json`, no workflow e na declaracao de gate. Vira CHORE
  Standard quando o humano decidir.

## Destino

(ainda em aberto)
