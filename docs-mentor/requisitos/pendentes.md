# Requisitos ainda nao implementados

<!-- Gerado por `node mentor.mjs gerar`. Nao edite a mao: a proxima geracao sobrescreve. -->

| ID | Tipo | Enunciado | Prioridade | Tarefa prevista |
|---|---|---|---|---|
| `RF-11` | RF | Diferenciar visualmente tipos de parada no mapa e na lista, reduzindo ambiguidades de apartamentos, casas, lojas e indefinidos. | importante | - |
| `RF-20` | RF | Permitir alternar entre a sequencia Original e Meu roteiro; quando o roteiro for importado sem romaneio, Original fica indisponivel. | essencial | - |
| `RF-33` | RF | Permitir salvar roteiro incompleto gratuitamente e liberar execucao somente quando todos os enderecos estiverem resolvidos. | essencial | - |
| `RF-34` | RF | Oferecer Auto-roteirizar, que monta o roteiro inteiro minimizando conversoes: escolhe paradas do veiculo em pontos livres das ruas adjacentes, cobre todos os enderecos resolvidos dentro do limite de caminhada, e entrega resultado editavel antes de salvar ou executar. | importante | - |
| `RF-36` | RF | Exportar e importar Roteiro em JSON para compartilhar ou continuar em outro dispositivo. | importante | - |
| `RF-37` | RF | Executar o roteiro entrega a entrega, com destino atual, progresso, conclusao, insucesso e integracao por deeplink/GPS externo. | essencial | - |
| `RF-40` | RF | Exibir legenda recolhivel do mapa usando o mesmo sistema visual de icones das paradas. | desejavel | - |
| `RF-41` | RF | Aplicar modelo freemium com anuncio recompensado por importacao, mantendo consentimento explicito antes de carregar SDK de anuncios. | importante | - |
| `RF-42` | RF | Oferecer assinatura premium via Play Billing para remover anuncios e liberar uso premium. | importante | - |
| `RF-44` | RF | A tela inicial deve listar romaneios salvos com cards tipados, roteiros vinculados e atalho para abrir o mapa em Meu roteiro. | importante | - |
| `RF-45` | RF | Resolver bairro por CEP quando a planilha nao informar bairro, ampliando cobertura alem do recorte RJ/Ilha documentado. | importante | - |
| `RF-47` | RF | Permitir pausar e retomar a execucao de um roteiro preservando progresso local. | essencial | - |
| `RF-48` | RF | Durante a execucao, permitir avancar, voltar e desfazer a ultima marcacao mantendo historico consistente. | essencial | - |
| `RF-49` | RF | Fornecer modo lista na execucao, com status por pacote/endereco e acao direta sobre cada item. | importante | - |
| `RN-14` | RN | Salvar roteiro e gratuito e pode ocorrer com pendencias; executar roteiro exige completude de enderecos resolvidos. | essencial | - |
| `RN-15` | RN | Pn/En representa a nova ordem do Meu roteiro; Shopee Stop/Sequence permanece como identidade historica da planilha original. | essencial | - |
| `RN-21` | RN | Cada rota pode ter no maximo um Roteiro vinculado; roteiro importado sem romaneio vira standalone. | essencial | - |
| `RN-22` | RN | Durante a execucao, o roteiro nao e editavel; pausar salva progresso e libera a edicao conforme o estado do roteiro. | essencial | - |
| `RNF-15` | RNF | A roteirizacao local deve manter desempenho aceitavel em bairros-alvo, com meta documentada de aproximadamente 150 ms para A* local. | importante | - |
| `RNF-16` | RNF | Preparar empacotamento TWA para distribuicao Android/Play Store mantendo origem web/PWA como base. | importante | - |
| `RNF-17` | RNF | Integrar Play Billing e entitlement premium com estrategia de validacao adequada ao MVP e ao risco de cobranca real. | importante | - |
| `RNF-20` | RNF | Cumprir LGPD e consentimento de anuncios: dados de terceiros ficam locais e UMP/consentimento ocorre antes de carregar SDK de ads. | essencial | - |
