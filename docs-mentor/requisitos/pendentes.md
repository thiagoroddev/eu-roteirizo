# Requisitos ainda nao implementados

<!-- Gerado por `node mentor.mjs gerar`. Nao edite a mao: a proxima geracao sobrescreve. -->

| ID | Tipo | Enunciado | Prioridade | Tarefa prevista |
|---|---|---|---|---|
| `RF-11` | RF | Diferenciar visualmente tipos de parada no mapa e na lista, reduzindo ambiguidades de apartamentos, casas, lojas e indefinidos. | importante | - |
| `RF-33` | RF | Permitir salvar roteiro incompleto gratuitamente e liberar execucao somente quando todos os enderecos estiverem resolvidos. | essencial | TASK-RF-025 |
| `RF-34` | RF | Oferecer o botao Auto-roteirizar sobre um motor local testavel sem UI. O padrao Menos conversoes combina distancia e penalidade D3 com peso de 400m. O motor escolhe paradas do veiculo em pontos livres das ruas, independentes dos enderecos, agrupa entregas dentro do raio geometrico da ancora e devolve roteiro editavel com caminhos de veiculo e circuitos a pe coerentes. | importante | TASK-RF-029, TASK-RF-030, TASK-RF-031, TASK-RF-032, TASK-RF-033, TASK-RF-034, TASK-SPIKE-001, TASK-TEST-004, TASK-SPIKE-002, TASK-RF-012 |
| `RF-37` | RF | Executar o roteiro entrega a entrega, com destino atual, progresso, conclusao, insucesso e integracao por deeplink/GPS externo. | essencial | TASK-RF-009, TASK-RF-024, TASK-RF-025, TASK-RF-026, TASK-RF-027, TASK-RF-028 |
| `RF-40` | RF | Exibir legenda recolhivel do mapa usando o mesmo sistema visual de icones das paradas. | desejavel | TASK-RF-027 |
| `RF-41` | RF | Aplicar modelo freemium com anuncio recompensado por importacao, mantendo consentimento explicito antes de carregar SDK de anuncios. | importante | - |
| `RF-42` | RF | Oferecer assinatura premium via Play Billing para remover anuncios e liberar uso premium. | importante | - |
| `RF-45` | RF | Resolver bairro por CEP quando a planilha nao informar bairro, ampliando cobertura alem do recorte RJ/Ilha documentado. | importante | - |
| `RF-47` | RF | Permitir pausar e retomar a execucao de um roteiro preservando progresso local. | essencial | TASK-RF-009, TASK-RF-024, TASK-RF-028 |
| `RF-48` | RF | Durante a execucao, permitir avancar, voltar e desfazer a ultima marcacao mantendo historico consistente. | essencial | TASK-RF-009, TASK-RF-026, TASK-RF-027, TASK-RF-028 |
| `RF-49` | RF | Fornecer modo lista na execucao, com status por pacote/endereco e acao direta sobre cada item. | importante | TASK-RF-009, TASK-RF-026, TASK-RF-028 |
| `RN-14` | RN | Salvar roteiro e gratuito e pode ocorrer com pendencias; executar roteiro exige completude de enderecos resolvidos. | essencial | TASK-RF-024, TASK-RF-025 |
| `RN-22` | RN | Durante a execucao, o roteiro nao e editavel; pausar salva progresso e libera a edicao conforme o estado do roteiro. | essencial | TASK-RF-009, TASK-RF-024, TASK-RF-025, TASK-RF-026 |
| `RNF-15` | RNF | A roteirizacao local deve manter desempenho aceitavel em bairros-alvo, com meta documentada de aproximadamente 150 ms para A* local. | importante | TASK-TEST-002 |
| `RNF-16` | RNF | Preparar empacotamento TWA para distribuicao Android/Play Store mantendo origem web/PWA como base. | importante | - |
| `RNF-17` | RNF | Integrar Play Billing e entitlement premium com estrategia de validacao adequada ao MVP e ao risco de cobranca real. | importante | - |
| `RNF-20` | RNF | Cumprir LGPD e consentimento de anuncios: dados de terceiros ficam locais e UMP/consentimento ocorre antes de carregar SDK de ads. | essencial | - |
| `RF-61` | RF | Guardar o resumo de cada roteiro salvo (paradas, km do veiculo, km a pe, tempo total e progresso de construcao) para exibir e comparar roteiros na lista de romaneios salvos | importante | TASK-RF-047, TASK-RF-048 |
| `RF-62` | RF | Exibir em cada rota da lista de romaneios salvos o nome do bairro com mais entregas, sem a contagem, reaproveitando o calculo de bairros do Sumario | desejavel | TASK-RF-048 |
