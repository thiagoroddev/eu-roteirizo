# Exportador do experimento força `vehicleStopIsDefault: false` em toda parada

Achado durante a TASK-BG-015 (registrado lá, reportado aqui para não se perder —
humano escolheu abrir tarefa depois, não agora).

## O que é

`__utilidades-back-office__/auto-roteirizacao/experimentArtifacts.ts:54`
(`createExperimentalRoutePayload`) grava `vehicleStopIsDefault: false` fixo em
**toda** parada do payload exportado para visualização no mapa, independente do
que a busca de âncoras (`fundamentalExperiment.ts`, estratégia "fixed-groups")
calculou de verdade. `validateExperimentalPayload` (linha ~80) chega a EXIGIR
isso como invariante do payload.

Efeito visível: qualquer roteiro exportado por esse caminho mostra "próximo ao
número X (Nm)" em toda parada no painel do mapa, mesmo quando a âncora está
exatamente onde a busca a colocou — porque a TASK-BG-015 fez `formatVehicleStopAddress`
passar a **confiar** em `vehicleStopIsDefault`, e aqui essa bandeira mente.

Foi assim que os 3 prints que motivaram a TASK-BG-015 foram gerados (cabeçalho
"EXPERIMENTO | case-00N | fixed-groups | vehicleDistance | PROCURA 60m").

## Por que não foi corrigido junto

A estratégia "fixed-groups" (`fundamentalExperiment.ts`) não calcula, para cada
endereço, uma posição "default" individual do jeito que a RF-030 (auto-roteirização
"free-groups", `autoRouteAnchors.ts`) calcula (`defaultAnchors`/`AnchorGroup.vehicleStopIsDefault`
via `samePosition`). Não é um ajuste de uma linha — exige decidir SE e COMO
"fixed-groups" deveria produzir esse sinal por endereço, ou se o `false` fixo é
proposital (ex.: sempre mostrar distância na revisão do experimento, já que ali
o interesse é justamente comparar onde cada estratégia colocou o carro).

## Quando vira tarefa

Se o comportamento incomodar de novo (relatório de experimento parecendo "tudo
editado"), decidir entre:

1. Calcular um `defaultVehicleStop` por grupo também no "fixed-groups" (mesmo
   princípio da RF-030) e comparar com `samePosition`.
2. Documentar que o `false` fixo é proposital do exportador de experimento e
   não mexer — é ferramenta de pesquisa interna, não o produto.

Ferramenta é back-office, não commitada (`__utilidades-back-office__/` some do
`git status` como `??`) — baixo risco de esperar.
