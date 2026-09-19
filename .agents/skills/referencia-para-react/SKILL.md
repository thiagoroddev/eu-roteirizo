---
name: referencia-para-react
description: Transformar screenshots, HTML de protótipos e requisitos textuais em interfaces funcionais com React, TypeScript, Tailwind CSS e shadcn/ui. Usar para mapear telas, planejar componentes, definir estados e contratos, implementar interações e verificar fidelidade visual. Não usar para apenas gerar uma imagem ou implementar React Native.
---

# Referência para React

Converter referências em uma experiência utilizável, com componentes coesos, dados consistentes e interações verificáveis. Preservar a identidade visual e o vocabulário do produto. Entregar código quando o pedido incluir implementação; limitar-se ao planejamento quando essa for a solicitação explícita.

## 1. Interpretar as fontes e o projeto

- Ler os requisitos e o HTML completo, quando disponíveis, e inspecionar a imagem. Identificar arquivos duplicados, versões diferentes e estados de rolagem ou expansão que expliquem diferenças.
- Tratar HTML exportado como evidência de estrutura e estilo, não como arquitetura final. Distinguir scripts de configuração de funcionalidades realmente implementadas.
- Seguir os requisitos explícitos para comportamento e a referência escolhida para aparência. Usar o código existente como fonte de contratos e integrações. Registrar conflitos materiais, sem transformar valores ilustrativos em regras de negócio.
- Se faltar uma fonte, trabalhar com as demais e declarar a limitação. Não afirmar ter visto uma imagem ou executado uma aplicação sem fazê-lo.
- Inspecionar instruções locais, package.json, lockfile, componentes existentes, roteador, estilos, persistência e testes. Reutilizar convenções e dependências antes de introduzir outras.
- Em projeto novo sem preferência definida, adotar React + TypeScript + Vite, Tailwind e shadcn/ui. Confirmar as versões e a integração pelos arquivos ou documentação oficial antes de configurar. Não migrar um projeto existente apenas por preferência.
- Formular perguntas apenas quando a resposta mudar regras centrais, integração ou escopo. Registrar hipóteses reversíveis e avançar no restante.

## 2. Mapear a tela para comportamento

Produzir um mapa compacto antes da implementação. Atribuir identificadores como F01 para relacionar requisitos, componentes e critérios de aceite.

| ID | Região ou controle | Evidência e certeza | Dados | Ação e resultado observável | Estados | Critério de aceite |
| --- | --- | --- | --- | --- | --- | --- |
| F01 | Busca principal | Visível; campos exatos a confirmar | Coleção e consulta | Filtrar resultados ao digitar | Padrão, preenchido, sem resultado | Limpar recupera a coleção |

Marcar cada decisão como observada, requisito explícito, hipótese ou pendência. Mapear:

- Hierarquia: página, cabeçalho, navegação, ferramentas, coleções, cartões e detalhes.
- Controles: busca, ordenação, filtros, menus, expansão, seleção, abertura e formulários.
- Estados pertinentes: inicial, carregando, vazio, sem resultados, erro, sucesso, expandido e selecionado. Não criar carregamentos artificiais para operações síncronas.
- Alcance: distinguir busca global de busca interna; filtros temporários de aplicados; expansão visual de seleção de um item; progresso de execução de estado de carregamento.
- Efeitos: identificar o que só altera a interface, o que muda dados, o que persiste e o que navega.
- Dependências ausentes: registrar páginas, endpoints, formatos de arquivo e regras que o material não define.

Não inventar funcionalidades complexas a partir de um ícone. Um símbolo de mapa pode representar distância; um selo XLSX pode representar a origem dos dados. Nenhum dos dois comprova necessidade de mapas interativos ou importação de planilhas.

## 3. Definir dados, regras e estados

Definir tipos TypeScript orientados ao domínio antes de preencher JSX:

- Usar IDs estáveis para entidades e relações; não usar índices ou nomes truncados como identidade.
- Separar entidades de domínio, contratos de transporte e estado da interface quando suas responsabilidades diferirem.
- Preferir unions discriminadas quando variantes têm dados ou comportamentos diferentes; evitar booleanos que permitem combinações inválidas.
- Separar dados persistidos, estado local, dados remotos e valores derivados. Manter cada informação em uma única fonte de verdade.
- Calcular totais, progresso e métricas a partir dos dados definidos. Documentar unidade, denominador, arredondamento e tratamento de zero. Distinguir ausência de informação de valor zero.
- Não inferir fórmulas, duração estimada ou distância de uma imagem. Usar dados fornecidos ou fixtures identificadas, sem apresentar simulações como medições reais.
- Validar dados nas fronteiras: API, arquivo e armazenamento. Reutilizar Zod se já disponível ou necessário; não adicionar bibliotecas para validar valores triviais internos.

Manter fixtures fora dos componentes, com exemplos coerentes para estados relevantes. Quando não houver backend, usar um adaptador local ou mocks compatíveis com a arquitetura. Não criar um servidor apenas para tornar o protótipo interativo.

Se a interface afirmar que os dados estão salvos no dispositivo, implementar persistência real adequada ao volume. Para dados pequenos e serializáveis, considerar localStorage; para coleções maiores ou arquivos, avaliar IndexedDB. Tratar leitura inválida, versão do formato e falha de gravação. Evitar sobrescrever dados existentes com fixtures na inicialização.

## 4. Planejar componentes e implementação

Produzir uma tabela proporcional à tela:

| Componente | Responsabilidade | Props e eventos | Estado proprietário | Base visual | Reutilizar ou criar |
| --- | --- | --- | --- | --- | --- |
| ItemCard | Apresentar uma entidade e suas ações | item, onOpen, onAction | Apenas interação local necessária | Card + Button + Badge | Verificar projeto |

- Extrair componentes por responsabilidade, repetição, comportamento ou variação; não criar um componente para cada div.
- Separar página coordenadora, componentes de domínio e primitivas visuais. Manter regras de busca e cálculo em funções testáveis quando não forem triviais.
- Colocar estado no ancestral comum mais próximo. Adotar estado global apenas quando houver consumidores e ciclo de vida que o justifiquem.
- Reutilizar componentes existentes antes de criar nomes diferentes para a mesma função.
- Definir contratos de callbacks concretos e tipados. Evitar callbacks opcionais que escondem controles sem implementação.
- Adaptar pastas ao projeto; em projeto novo, considerar organização por funcionalidade, com componentes, tipos e acesso a dados próximos. Não impor camadas vazias.

Escolher primitivas pela semântica:

| Necessidade | Candidato shadcn/ui | Critério |
| --- | --- | --- |
| Ações, entrada e selo | Button, Input, Badge | Adicionar rótulos e variantes do produto |
| Ações contextuais | DropdownMenu | Não confundir com seleção persistente |
| Ordenação | Select ou itens de seleção em menu | Exibir valor selecionado |
| Filtros ou configurações | Sheet, Popover ou Dialog | Escolher pelo espaço e complexidade |
| Expandir conteúdo | Collapsible ou Accordion | Definir se vários itens podem ficar abertos |
| Confirmação destrutiva | AlertDialog | Usar quando a consequência exigir confirmação |
| Estado de espera | Skeleton | Apenas quando existe espera real |

Não forçar uma primitiva onde HTML semântico e Tailwind resolvem melhor. Estilizar shadcn/ui para reproduzir a referência; não substituir o desenho pelo tema padrão da biblioteca.

Planejar fatias verificáveis: estrutura e dados → componentes principais → interações → persistência e integração → responsividade e verificação. Para um pedido de implementação, seguir do plano ao código sem exigir aprovação de cada etapa.

## 5. Traduzir aparência para um sistema coerente

- Extrair tokens de superfície, texto, borda, marca, estado, tipografia, espaçamento, raio e sombra. Reutilizar os tokens do projeto quando existirem.
- Manter cores de marca separadas de cores semânticas: seleção, execução, aviso e conclusão não são necessariamente equivalentes.
- Adaptar a configuração à versão instalada do Tailwind. Não copiar tailwind.config de um CDN v3 para um projeto v4 sem traduzir a configuração.
- Substituir CDN de protótipo pela integração do projeto. Usar classes detectáveis pelo build, evitando montar nomes Tailwind por interpolação de fragmentos.
- Preservar proporções, densidade, alinhamentos, truncamento e hierarquia; corrigir inconsistências funcionais sem redesenhar a tela inteira.
- Evitar posicionamento absoluto para o layout comum, alturas rígidas que cortam conteúdo e largura fixa de telefone em todas as telas.
- Priorizar mobile quando a referência for mobile. Definir adaptação para telas maiores sem inventar seções novas.
- Em navegação fixa, reservar espaço para o conteúdo e safe area. Testar textos longos, teclado virtual e listas internas antes de manter rolagens aninhadas.
- Preservar zoom do navegador; não copiar user-scalable=no nem bloquear seleção de texto globalmente.
- Garantir rótulos acessíveis, foco visível, teclado, estados por texto/ícone além da cor e áreas de toque adequadas. Não aninhar botão de menu dentro de um botão que representa o cartão inteiro.
- Se houver troca de tema, implementar tokens completos e preferência persistida conforme o projeto. Não apenas trocar o ícone.

## 6. Implementar funcionalidade observável

- Renderizar coleções a partir de dados, com keys estáveis. Não converter blocos repetidos do HTML em JSX duplicado.
- Implementar busca nos campos acordados, com normalização de caixa e, quando adequado, acentos. Definir como busca global e interna interagem.
- Ordenar cópias ou resultados derivados, sem mutar silenciosamente a coleção de origem; comparar datas pelo valor temporal, não pelo texto formatado.
- Implementar filtros combinados, limpar filtros, contagem de resultados e feedback para ausência de correspondências quando aplicáveis.
- Controlar expansão por ID e separar seleção de navegação. Impedir que ações de menu disparem a abertura do cartão.
- Conectar navegação a destinos existentes. Se a tela de destino estiver fora do escopo, explicitar o limite e entregar o contrato de integração; não usar href="#", console.log ou toast de sucesso como substitutos da ação prometida.
- Implementar apenas ações com intenção definida. Para controles ambíguos, documentar a hipótese ou a dependência; não inventar exclusão, exportação ou compartilhamento sem evidência.
- Tratar falhas no próprio fluxo, mantendo dados e permitindo nova tentativa quando fizer sentido.
- Usar hooks e efeitos para sincronização real; não armazenar em estado aquilo que pode ser derivado durante a renderização.
- Adicionar memoização, debounce ou virtualização somente quando a operação, o volume ou uma medição justificar.

## 7. Verificar e entregar

Relacionar a verificação aos critérios de aceite, não à estrutura interna dos componentes:

1. Executar os comandos disponíveis de tipos, lint e build que forem relevantes; relatar falhas preexistentes separadamente.
2. Exercitar as interações principais: buscar, limpar, filtrar, ordenar, expandir, abrir e persistir quando fizerem parte do escopo.
3. Verificar combinações que possam falhar: lista vazia, nenhum resultado, título longo, denominador zero, muitos itens e dados persistidos inválidos.
4. Usar testes automatizados para regras e fluxos com risco real, aproveitando a infraestrutura existente. Não instalar uma suíte inteira para uma alteração visual simples.
5. Quando houver ambiente de execução visual, comparar a tela na largura da referência e em outras larguras relevantes. Verificar cortes, sobreposições, foco e navegação fixa. Não declarar fidelidade visual verificada apenas porque o build passou.
6. Revisar o mapa funcional: cada controle deve ter comportamento implementado ou dependência explicitamente informada. Distinguir dados reais, fixtures e integrações pendentes.

Entregar resumo do comportamento implementado, arquivos principais, como executar quando necessário, verificações realizadas e limitações concretas. Evitar afirmar que está pronto para produção com base apenas em uma tela ou em testes simulados.

## Exemplo de aplicação: romaneios do Eu Roteirizo

Usar este exemplo apenas quando o domínio corresponder. Não aplicar nomes ou regras de logística a outras telas.

### Leitura da referência

A referência contém cabeçalho, busca global, filtros, ordenação, indicação de armazenamento local, cartões de romaneio único e multi-rota, busca interna, lista de rotas com estados diferentes, menus e navegação inferior. Os HTMLs fornecidos são essencialmente a mesma tela estática e configuram Tailwind v3 por CDN; não comprovam comportamento de aplicação.

Não confundir “mapeamento da interface” com geolocalização. Não acrescentar GPS, otimização de rotas, importador XLSX, backend ou monorepo só pela presença de nomes e ícones na imagem.

### Componentes candidatos

| Componente | Responsabilidade | Dados ou estado |
| --- | --- | --- |
| SavedManifestsPage | Coordenar coleção e critérios globais | Romaneios, consulta, filtros, ordenação |
| ManifestToolbar | Buscar, ordenar e filtrar | Valores controlados e callbacks |
| ManifestCard | Cabeçalho e variante único/multi | Romaneio, ações, expansão |
| ManifestRoutes | Busca e lista de rotas do romaneio | Consulta interna por ID |
| RouteRow | Exibir estado e abrir uma rota | Rota e callback de abertura |
| RouteMetrics | Formatar duração, distância e paradas | Métricas tipadas |
| ManifestActions | Expor ações acordadas | ID e callbacks |
| AppBottomNav | Navegar entre destinos existentes | Rota atual |

Começar com entidades Romaneio e Rota. Distinguir formato de origem (XLSX/JSON) de cardinalidade (único/multi): não assumir que uma extensão determina quantas rotas existem. Diferenciar quantidade de pacotes, quantidade de paradas e quantidade de rotas. Não criar uma entidade Parada completa se a tela só receber métricas agregadas.

### Inconsistências a resolver

- A referência mostra 13/30 paradas junto de 45% e 4/34 junto de 3%. Se o progresso representar paradas concluídas, os valores arredondados seriam 43% e 12%. Se representar outra métrica, explicitar seu denominador. Não manter percentuais conflitantes silenciosamente.
- O cartão anuncia 153 rotas, mas o HTML lista apenas parte delas. Distinguir recorte de demonstração, paginação e total conhecido. Não inventar 153 registros nem usar o tamanho de uma página como total do romaneio.
- O screenshot exibe uma lista interna já deslocada: parte dos itens e do cabeçalho de uma rota pode estar fora da região visível. Não reproduzir o recorte como se fosse a estrutura completa.
- Dois cartões visualmente parecidos não comprovam entidades duplicadas; garantir IDs distintos e dados de exemplo coerentes quando for necessário demonstrar repetição.
- “Salvos neste dispositivo” exige armazenamento real para uma entrega funcional que mantenha essa promessa.
- A cor de borda de um cartão não comprova que ele esteja em execução; separar destaque visual, expansão e status operacional.

Exemplos de aceite: a busca global encontra um romaneio pelos campos definidos de suas rotas; a busca interna afeta apenas o romaneio correspondente; recolher um cartão não apaga dados; recarregar conserva dados salvos; abrir o menu não abre a rota; percentuais seguem uma fórmula explícita.
