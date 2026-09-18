# TASK-RF-047 · Guardar o resumo do roteiro salvo (paradas, km, tempo, progresso) quando o app ja calcula os totais com malha

## Decisoes tomadas
- Modelo lazy/reativo de persistência: ao invés de forçar o cálculo síncrono da malha (A* viário e circuitos a pé) no momento de cada auto-save da rota (o que penalizaria a responsividade em dispositivos móveis e gastaria bateria/processamento excessivo), o resumo (`RoteiroSummary`) é calculado e persistido de forma assíncrona/reativa quando o usuário visita telas que já calculam esses totais sobre o grafo (`SummaryPage` ou `MapPage` ao abrir "Ver detalhes").
- Guarda de idempotência: `saveRoteiroSummary` compara os valores calculados (`stops`, `vehicleMeters`, `walkMeters`, `totalMinutes`, `progressRatio`) com o registro existente no IndexedDB e aborta a escrita se nada mudou, prevenindo I/O redundante e re-render loops.
- Invalidação segura em alterações de paradas: `saveRoteiro` preserva o `summary` se as paradas salvas forem estruturalmente equivalentes (`areStopsEquivalent`). Se o entregador alterou paradas (endereços, ordem ou coordenadas do veículo), um `summary` obsoleto é descartado até novo cálculo com malha.
- Contrato desacoplado: `RoteiroRecord.summary?` adiciona os campos sem quebrar o esquema legado existente.

## O que nao foi feito, e por que
- Não foi adicionado worker em background para calcular a malha imediatamente ao salvar: a especificação e o contrato da TASK-RF-047 deixam claro que a persistência ocorre quando o app já calcula os totais com malha (`viaStreets === true`), sendo o consumo na listagem de romaneios (TASK-RF-048) preparado para lidar com ausência do campo de forma graciosa.

## Testes de descoberta
- Verificação do formato dos `pointIds` gerados por `buildDeliveryPoints` (`pt_${lat.toFixed(5)},${lng.toFixed(5)}`) nos mocks de teste do `routeStorageState`, garantindo que o cálculo de `progressRatio` reflita a cobertura de pontos das paradas corretamente.

## Aprendizados
- Ao usar `useEffect` para persistir dados baseados em estados computados por hooks React (`overviewTotals`, `roteiroInfo`), a guarda de idempotência no serviço de persistência é crucial para evitar escritas desnecessárias decorrentes de re-renders da UI de mapa.
- Prettier/ESLint no projeto possui regras estritas de quebra de linha em listas de argumentos e expressões ternárias que devem ser validadas via `npm run lint -- --fix`.

## Desfecho e Validacao Real
- Comportamento nos testes:
  - Testes unitários do `routeStorage` cobrem 100% dos fluxos de gravação, recuperação, listagem e preservação/invalidação do resumo (`src/__tests__/services/routeStorage.test.ts`).
  - Testes de integração em `SummaryPage.test.tsx` e `MapPage.test.tsx` validam que a chamada a `saveRoteiroSummary` acontece quando o grafo viário está ativo e os totais estão computados.
- Gates técnicos:
  - `tipos`: TypeScript (`tsc -b`) aprovado com 0 erros.
  - `lint`: ESLint/Prettier aprovado sem violações.
  - `testes`: Vitest suíte completa aprovada (100% verde em todos os arquivos de teste).
  - `build`: Vite build de produção aprovado e concluído com sucesso.
- Roteiro de validação manual:
  1. Abrir o app e importar/selecionar um romaneio existente com rotas.
  2. Acessar o "Sumário", alternar para "Info Meu Roteiro" e aguardar o carregamento da malha de ruas.
  3. No DevTools (F12 > Application > Storage > IndexedDB > `eu-roteirizo-roteiros` > `roteiros`), inspecionar a chave da rota e confirmar a presença de `summary` com `{ stops, vehicleMeters, walkMeters, totalMinutes, progressRatio, computedAt }`.
  4. Navegar até o "Mapa" da mesma rota, clicar em "Ver detalhes" e verificar que os valores batem exatamente com as métricas persistidas.
- Evidência de validação observada:
  - Validado no navegador e inspecionado no DevTools do Chrome: registros no store `roteiros` do banco `eu-roteirizo-roteiros` gravados com sucesso contendo o `summary` completo (`computedAt`, `progressRatio`, `stops`, `totalMinutes`, `vehicleMeters`, `walkMeters`).
  - Armadilha de ambiente documentada: o Chrome DevTools marca `Data may be stale` e não faz live reload do IndexedDB por padrão, sendo necessário acionar o botão de recarga (`↻`) no DevTools para visualizar as alterações gravadas pela aplicação.

