# Melhorias de UI e ergonomia do painel e mapa de roteiro

Rascunho aberto em 08/09/26 07:04.

> Rascunho nao e tarefa: sem gate, sem criterio de aceite, fora da fila.
> Sai daqui de quatro jeitos: requisito · ADR · tarefa · descartado com uma linha.

---

## 1. Contexto e Origem

Durante testes manuais de criação de roteiro no aparelho/navegador, foram identificadas oportunidades de melhoria no fluxo de interação, visualização e ergonomia do painel e do mapa no modo "Meu Roteiro".

Essas melhorias não interferem na matemática ou nos algoritmos de cálculo de rotas do motor de auto-roteirização (`TASK-RF-029`), devendo ser implementadas como melhorias de usabilidade em tarefas dedicadas de interface.

---

## 2. Catálogo de Pendências de UI

### Item 1: Entrar no modo 'Edição de parada' automaticamente ao criar parada
* **Situação atual**: Ao criar uma parada, ela é confirmada e o painel exibe o resumo com a parada fechada. Para conferir ou ajustar o ponto de parada do veículo (âncora viária), o usuário precisa clicar no botão "Editar".
* **Comportamento desejado**: Ao criar a parada, entrar diretamente no modo de edição (`isEditing: true`). O usuário visualiza imediatamente a âncora do veículo no mapa e pode arrastá-la ou ajustá-la com rapidez.
* **Componentes envolvidos**: `src/pages/MapPage.tsx`, `src/hooks/useRouteBuilder.ts`.

### Item 2: Distância até a próxima parada no resumo
* **Situação atual**: O card da parada selecionada exibe o resumo de pacotes, tipo de locais e endereços, mas não explicita a distância viária até a parada seguinte.
* **Comportamento desejado**: Quando a parada selecionada $i$ possuir uma sucessora $i+1$, exibir ao lado de "Resumo da parada" a indicação:
  `Distância até próxima parada: 900m [ícone veículo]`.
  O valor métrico já é calculado nas pernas viárias (`routeLegs` / `suggestionPath`).
* **Componentes envolvidos**: `src/components/map/panel/RoteiroStopDetailsSection.tsx` (ou equivalente no painel de resumo da parada).

### Item 3: Comportamento de zoom automático (apenas aproximar, nunca distanciar)
* **Situação atual**: Ao selecionar um ponto ou parada, chamadas de foco de câmera (`fitBounds` ou `setView`) podem reduzir o nível de zoom (zoom out) para acomodar margens de padding, mesmo quando o usuário já estava num zoom alto examinando detalhes da rua.
* **Comportamento desejado**: O zoom automático só deve agir para aproximar a câmera (`zoom in`), se o nível atual for menor que o zoom alvo. Se o mapa já estiver num zoom igual ou maior (mais próximo), a câmera deve apenas transladar o centro (`panTo`), sem afastar a visualização.
* **Componentes envolvidos**: `src/pages/MapPage.tsx` (helpers de foco de câmera / Leaflet).

### Item 4: Seleção automática da nova última parada pós-deleção
* **Situação atual**: Ao deletar/desfazer a última parada criada, o estado de seleção da parada fica vazio ou descontextualizado.
* **Comportamento desejado**: Ao deletar uma parada, a nova última parada remanescente (ou $N-1$) deve ser selecionada automaticamente, mantendo o foco e o fluxo contínuo de trabalho no painel.
* **Componentes envolvidos**: `src/pages/MapPage.tsx`, `src/hooks/useRouteBuilder.ts`.

### Item 5: Ícone de lixeira e nome 'Deletar parada'
* **Situação atual**: O botão de exclusão de parada utiliza o ícone `RotateCcw` e o texto "Desfazer parada" (`UI_LABELS.ROTEIRO.ACTIONS.DISSOLVE`).
* **Comportamento desejado**: Trocar o ícone para uma lixeira (`Trash2` do lucide-react) e alterar o rótulo da ação para `"Deletar parada"`, refletindo com precisão a intenção do usuário.
* **Componentes envolvidos**: `src/constants/uiLabels.ts`, `src/components/map/panel/RoteiroStopSection.tsx`.

### Item 6: Botão 'Recomeçar' no cabeçalho do painel
* **Situação atual**: Para reiniciar um planejamento, o usuário precisa deletar as paradas uma a uma manualmente.
* **Comportamento desejado**: Adicionar um botão "Recomeçar" no cabeçalho do painel com diálogo de confirmação (`AlertDialog`), alertando expressamente que todas as paradas do rascunho serão apagadas. Ao confirmar, executa uma ação `CLEAR_ALL_STOPS`, limpando a lista de paradas e preservando o ponto de início (se definido).
* **Componentes envolvidos**: `src/components/map/panel/PanelHeader.tsx`, `src/hooks/useRouteBuilder.ts`.

---

## 3. Destino

* [ ] Converter em tarefa(s) de interface (`TASK-UI-...`) após a estabilização da malha viária e do motor automático (`TASK-RF-029`).
