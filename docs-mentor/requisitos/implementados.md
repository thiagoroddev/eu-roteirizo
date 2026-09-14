# Requisitos implementados

<!-- Gerado por `node mentor.mjs gerar`. Nao edite a mao: a proxima geracao sobrescreve. -->

| ID | Tipo | Enunciado | Prioridade | Tarefas |
|---|---|---|---|---|
| `RF-20` | RF | Permitir alternar entre a sequencia Original e Meu roteiro; quando o roteiro for importado sem romaneio, Original fica indisponivel. | essencial | TASK-RF-013 |
| `RF-36` | RF | Exportar e importar Roteiro em JSON para compartilhar ou continuar em outro dispositivo. | importante | TASK-RF-013 |
| `RF-44` | RF | A tela inicial deve listar romaneios salvos com cards tipados, roteiros vinculados e atalho para abrir o mapa em Meu roteiro. | importante | TASK-RF-013, TASK-RF-028 |
| `RN-15` | RN | Pn/En representa a nova ordem do Meu roteiro; Shopee Stop/Sequence permanece como identidade historica da planilha original. | essencial | TASK-RF-013, TASK-RF-024 |
| `RN-21` | RN | Cada rota pode ter no maximo um Roteiro vinculado; roteiro importado sem romaneio vira standalone. | essencial | TASK-RF-013 |
| `RF-50` | RF | Permitir inserir nova parada em posicao arbitraria e reordenar paradas existentes no rascunho do roteiro | importante | TASK-RF-035 |
| `RF-51` | RF | Permitir recomecar rascunho no cabecalho e focar ultima parada ao deletar com rotulo Deletar parada | importante | TASK-RF-036 |
| `RF-52` | RF | Garantir que o ponto semente escolhido pelo usuario seja a ancora e primeiro ponto da parada | importante | TASK-RF-037, TASK-RF-030, TASK-SPIKE-002 |
| `RF-53` | RF | Resumo da parada agrupada com endereco completo do veiculo no titulo e selecao automatica da primeira entrega ao desagrupar | importante | TASK-RF-038 |
| `RF-54` | RF | Nome unico para exportacao de roteiros em JSON composto por data do romaneio, 4 ultimos caracteres do AT e bairro predominante | importante | TASK-RF-039 |
| `RF-55` | RF | Permitir ignorar enderecos perigosos ou fora de rota excluindo-os da conclusao do roteiro e agrupando-os no painel | importante | TASK-RF-040, TASK-RF-042 |
| `RF-56` | RF | Inclusao do ponto inicial na malha viaria do mapa para roteirizacao completa ate a primeira parada | importante | TASK-RF-041 |
| `RF-57` | RF | Alternar o tracado do roteiro no mapa entre rota inteira e trecho da parada selecionada, com passagens repetidas distinguiveis por acumulo de opacidade | importante | TASK-RF-043 |
| `RF-58` | RF | Navegar entre paradas firmadas do Meu roteiro com avancar/retroceder ciclico no cabecalho do painel | importante | TASK-RF-044 |
| `RN-23` | RN | A parada padrao do veiculo fica na via em frente ao pino de cada endereco, por projecao geometrica; o planejamento considera possivel parar junto a qualquer endereco e nao procura vaga, permissao nem disponibilidade de estacionamento. | essencial | TASK-BG-016, TASK-BG-022 |
