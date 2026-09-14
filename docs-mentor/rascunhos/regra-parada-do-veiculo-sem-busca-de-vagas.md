# Regra de negócio: parada do veículo sem busca de vagas

Status: decisão expressa pelo usuário, registrada para o plano do motor. Apenas documentação; nenhuma implementação realizada nesta anotação.

## Regra

Para fins de planejamento, o motor considera possível parar junto a qualquer endereço. Não procura vagas nem verifica onde é permitido estacionar ou parar.

- Cada endereço tem sua parada padrão no local correspondente na via, junto ao endereço. Não deslocar essa parada para procurar uma vaga considerada permitida.
- A coordenada original da entrega permanece preservada. Quando necessária, a projeção na via é uma operação geométrica, não uma busca por estacionamento.
- Sinalização de estacionamento, proibição de parada, disponibilidade de vagas e existência de áreas de carga/descarga não são filtros, penalidades nem condições para criar uma parada.
- Não é necessário consultar serviços ou dados de estacionamento para gerar as rotas.
- O usuário pode editar a posição da parada do veículo.

## Relação com a otimização

A parada padrão de cada endereço é a referência inicial. O agrupamento continua podendo escolher uma parada de veículo independente para atender uma ou mais entregas a pé, inclusive em outra rua, conforme as regras de percurso, caminhada e custo adotadas.

Essa liberdade também se aplica às paradas geradas ao longo do percurso desenhado pelo usuário. Não procurar uma vaga formal para validar a criação delas.

## O que permanece separado

Esta regra trata da possibilidade de **parar**, não da possibilidade de **circular**. Mão única, continuidade do percurso, conversões e acessos de circulação continuam pertencendo ao cálculo do caminho. A caminhada continua precisando respeitar o modelo de acesso e os limites acordados.

O motor não passa a certificar que estacionar é permitido: essa verificação simplesmente não faz parte de seu escopo.

## Ajuste das propostas anteriores

As sugestões anteriores de buscar vagas, validar permissão de estacionamento ou prever disponibilidade de estacionamento deixam de fazer parte do plano. Não devem reaparecer como dependência para implementar agrupamento ou desenho assistido.

Motivo informado pelo usuário: a operação real ocorre também em regiões com muitas restrições de estacionamento; o produto deve permitir planejar as paradas e ajustá-las manualmente, sem bloquear o roteiro por esse critério.

Esta nota deve ser incorporada ao plano definitivo. Não altera código, requisitos formais ou ADRs por si só.
