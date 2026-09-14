# Plano enxuto do motor de rotas

Status: rascunho do novo direcionamento. Regras de produto consolidadas da conversa; métodos abaixo são a proposta técnica. Não autoriza implementação.

## 1. Produto e regras

- **Início obrigatório:** agora = GPS, com confirmação/correção; depois = ponto marcado no mapa.
- **Fim obrigatório:** circular = voltar ao início; outro destino = ponto marcado. Incluir esses deslocamentos na distância total.
- **Três modos:** automático individual; automático com agrupamento; desenho assistido com agrupamento automático.
- **Parada padrão:** junto a cada endereço, na via. Não buscar vagas, permissões ou disponibilidade de estacionamento. Usuário pode editar.
- **Parada independente:** o agrupamento pode escolher outra coordenada, com endereço próprio, inclusive em outra rua. Preservar os pins e as referências fundamentais das entregas.
- **Circulação:** respeitar mão única, conexões e conversões do grafo. Ausência de caminho deve aparecer como pendência, não como rota em linha reta válida.
- **Configuração inicial dos testes:** `r60` para busca em torno dos fundamentos; `c120` para o circuito fechado entre parada e fundamentos. Informar separadamente a caminhada completa até as entregas.

Regra de estacionamento detalhada na [nota específica](./regra-parada-do-veiculo-sem-busca-de-vagas.md).

## 2. Tecnologias escolhidas para a proposta

| Parte | Tecnologia e uso |
| --- | --- |
| Aplicação e mapa | Manter React, TypeScript e Leaflet existentes |
| Desenho | Pointer Events para capturar o gesto; polylines do Leaflet para prévia e percurso ajustado |
| Caminhos | OSM, grafo dirigido e A*/Dijkstra locais; rede pedestre separada |
| Execução | Web Worker para a busca, com cancelamento e melhor solução válida preservada |
| Persistência | IndexedDB com `idb`; guardar configurações, paradas, percurso e versão da malha |
| Verificação | Vitest, testes de importação/exportação e avaliação manual no mapa/aparelho |

Reaproveitar a base atual e construir três módulos TypeScript compartilhados: **caminhos**, **paradas/agrupamento** e **planejamento/desenho**. Não criar três motores independentes.

Para captura e renderização, usar os recursos do [Leaflet](https://leafletjs.com/reference.html). Para executar cálculos fora da interface, usar [Web Workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers).

Sem API paga de rotas, plugin pago de desenho ou LLM decidindo caminhos. A distribuição final da malha permanece no trilho PMTiles/R2 da ADR-010; não construir infraestrutura nacional para validar estes dois roteiros.

## 3. Métodos do motor

### Base comum: caminhos e custos

Auditar projeção na via, mão única e conversões antes de sofisticar a otimização. Usar A* por trecho; Dijkstra por origem quando várias consultas puderem compartilhar o cálculo. Cachear por malha, perfil, objetivo e estados relevantes.

Separar **metros físicos**, **tempo estimado** e **custo usado na escolha do caminho**. Proposta inicial: minimizar distância veicular dentro dos limites acordados; desempatar por menor caminhada completa. Tempo modelado permanece métrica de comparação.

### Automático individual

Construir uma sequência entre início e fim por inserção de menor incremento de custo. Melhorar com realocação e troca de paradas, usando custos dirigidos. Cada entrega permanece uma parada individual.

Não repetir a execução para cada endereço como origem: a origem já está definida. Ainda é necessário escolher a primeira entrega e melhorar a sequência.

### Automático com agrupamento

Partir da solução individual, mas **não congelar seu percurso**:

1. Buscar entregas atendíveis a pé a partir das ruas/paradas do roteiro e de alternativas próximas.
2. Propor fusão, divisão e transferência de entregas, junto com mudanças da parada do veículo.
3. Avaliar chegada + circuito a pé + saída. Para grupos pequenos, usar enumeração/programação dinâmica para a ordem a pé; para maiores, inserção e melhoria local.
4. Remover visitas veiculares dispensadas pelo atendimento a pé e reotimizar a sequência.
5. Repetir sob orçamento limitado, mantendo a melhor solução válida.

Com grupos e ordem fixos, usar programação dinâmica em camadas para comparar combinações de âncoras candidatas, representando orientação quando necessária. A parada diante do endereço deve continuar candidata; não deslocá-la por mero desempate de ID.

### Desenho assistido

Capturar o gesto em trechos curtos e reduzi-lo a pontos de controle. Ajustar candidatos de segmentos à direção do gesto e conectá-los pelo grafo dirigido, preservando a sequência indicada. Mostrar prévia, permitir desfazer e pedir correção quando houver ambiguidade/contramão; não impor um desvio grande silenciosamente.

Ao longo do percurso ajustado, reutilizar o módulo de agrupamento: gerar candidatos de parada sobre as vias escolhidas, verificar circuitos a pé e mostrar paradas provisórias. Entrar no raio gera um candidato, não comprova atendimento. Entregas não cobertas continuam visíveis.

Guardar o percurso escolhido e sua ordem de passagem pelas vias, não apenas as paradas. O agrupamento não deve alterar silenciosamente o desenho do usuário.

## 4. Ordem de construção e processo com IA

1. **Contrato e referência:** fechar formato de início/fim, parada independente e ordem a pé; congelar dois romaneios e a malha usada na comparação.
2. **Base confiável:** validar caminhos/custos e entregar o automático individual como referência reproduzível.
3. **Agrupamento:** implementar os movimentos conjuntos e reproduzir os casos do vídeo em que caminhar dispensa entrar numa rua.
4. **Desenho:** conectar gesto → percurso dirigido → agrupamento, com prévia, desfazer e persistência fiel.
5. **Aplicativo:** conferir exportação/importação, cancelamento, funcionamento offline com malha carregada, tempo e memória no aparelho.

Em cada etapa: exemplo operacional explicado pelo usuário → regra e contraexemplo → implementação autorizada de uma mudança por vez → teste automatizado → comparação no mapa. IA auxilia código e investigação; vídeos fornecem exemplos, sem exigir treinamento de modelo.

Para falhas: registrar sintoma, evidência, causa confirmada ou hipótese, solução proposta e estado. Não ajustar pesos ou limites escondidos para fazer um exemplo passar.

Busca avançada como LNS/ALNS fica para depois, somente se os movimentos básicos corretos ainda deixarem uma diferença relevante para a referência humana.

## 5. Validação enxuta e saídas

- Somente **dois casos reais**, com início/fim fixos e configuração inicial `r60/c120`. Microtestes apenas para regras e falhas concretas.
- Comparar metros veiculares, caminhada completa, paradas, cobertura e tempo de cálculo com o roteiro humano, usando a mesma contabilidade.
- Exigir: nenhuma entrega descartada silenciosamente; nenhuma contramão aceita; nenhuma mudança de parada sem motivo registrado; mesma rota e ordem a pé após importar.
- Usar um log de tentativas por execução, com caso, modo, configuração, métricas e motivo das mudanças. Não salvar um JSON por tentativa.
- Salvar um JSON final por modo disponível e caso. Com os três modos implementados, são três arquivos por caso. O desenho é o resultado guiado pelo usuário, não uma terceira estratégia automática.

Exemplos para o roteiro 1:

```text
1-automatico-individual.json
1-r60-c120-automatico-agrupado.json
1-r60-c120-desenho-assistido.json
```

O primeiro número sempre corresponde à pasta original do romaneio, de 1 a 6. Não ampliar casos, tecnologias ou combinações de parâmetros antes de obter boa qualidade nos dois escolhidos.
