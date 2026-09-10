# TASK-SPIKE-002 — experimento com pontos fundamentais

Estado: plano aprovado pelo “prossiga” do mantenedor; experimento ainda não iniciado.
Pedido: aplicar e testar a ideia isoladamente; só depois de evidência favorável propor a
adaptação do restante do épico. A aprovação permite executar este plano, não fechar/commitar
o spike, publicar ou migrar dados. A RF-030 foi concluída com autorização específica de
fechamento e commit, sem push. A tarefa experimental permanece aberta na reserva.

## Pergunta do experimento

Usar referências fundamentais de estacionamento, com circuito de agrupamento configurável
e âncoras/grupos revisáveis, elimina órfãos causados apenas por pinos afastados da rua e
produz roteiros completos com trocas vantajosas entre veículo, caminhada e tempo modelado?

É um SPIKE porque a utilidade da heurística está por demonstrar. Resultado negativo ou
inconclusivo é uma resposta válida. Os contratos verificáveis abaixo terão testes prévios;
o código exploratório não será promovido automaticamente a código de produto.

## Regras de negócio já esclarecidas

- Preservar pontos, IDs, pacotes, coordenadas e roteiros originais. Criar uma camada virtual
  de endereços/referências; não migrar `DeliveryPoint` nem alterar `buildDeliveryPoints`.
- Para cada endereço, calcular onde o veículo pararia por padrão. Esse ponto fundamental
  é referência estável da execução e independe de selecionar uma semente na interface.
  A âncora final pode mudar de posição/rua sem mover a referência ou o pino original.
- A distância fundamental–pino não restringe agrupamento nem impede uma parada individual.
  Com âncora no fundamental, um endereço sozinho tem circuito de agrupamento nulo.
  Sua caminhada completa pode ser longa; nenhuma entrega ativa some ou vira ignorada.
- Circuito limitado: âncora final → fundamentais na ordem calculada → mesma âncora.
  Padrão **120 m**, configurável. Inclui aproximação e retorno; recalcular após qualquer
  mudança de membros, âncora ou ordem. Não medir somente o maior trecho ou a ida.
- Caminhada completa: percurso até as entregas originais e de volta ao veículo. Informar
  separadamente o circuito limitado e os acessos aos pinos, sem dupla contagem. O total
  completo pode exceder 120 m sem violação; nunca rotular o teto como máximo total a pé.
- Os raios de procura/aproximação padrão do experimento ficam em 30/60 m, medidos a partir
  das referências fundamentais, não dos pinos. O limite da âncora ao primeiro fundamental
  é separado do teto de circuito. O raio manual de 30 m não muda. Um círculo de 30 m não
  garante, em qualquer disposição de endereços, circuito de até 120 m: são regras distintas.
- Pré-agrupamento é opcional. Pode orientar a rota inicial, mas não congelar a solução.
  Permitir unir/dividir grupos, transferir endereço, mover âncora e rever ambas as ordens.
- Início e fim veiculares livres nos testes; sem retorno obrigatório à origem. A aproximação
  de uma origem externa não entra só em uma variante. Relatar separadamente quando existir.

## Escopo e estratégia proposta

### Referências e identidade

Reutilizar a leitura/hashes/snapshots de `corpus.ts`. O motor recebe dados originais e malha,
nunca âncoras, grupos ou sequência dos roteiros humanos. As referências humanas são avaliadas
depois. Configuração experimental comum, sem herdar escolhas do manual para favorecer saída.

Normalizar rua/número com contexto geográfico e preservar complementos/pacotes. Consolidar
apenas identidades inequívocas com acesso viário compatível. Pinos/acessos divergentes ou um
DeliveryPoint legado que reúna endereços diferentes geram diagnóstico e referências preservadas;
não inventar uma posição média nem dividir silenciosamente IDs que o importador espera.

Calcular fundamentais pelo padrão `suggestVehicleStop`, registrando segmento, projeção e
origem da estimativa. Posição projetada não certifica portaria/estacionamento. Enumerar alternativas
multivia ao redor dos fundamentais, reutilizando as candidatas espaciais da RF-030 sobre uma
representação virtual imutável; não reutilizar seu agrupamento guloso como decisão final.
Preservar fundamentais e diversidade de ruas/direções em qualquer limitação de candidatas.

### Percursos e limites

Usar a malha veicular dirigida e a malha pedestre derivada do mesmo snapshot. As projeções
devem manter identidade de segmento: proximidade não une viaduto/rua ou pistas desconectadas.
Reutilizar A*/projeção existentes quando preservarem esse contrato, com cache por grafo,
tipo de deslocamento e pontos/segmentos. Não somar custos de caminhos diferentes dos desenhados.

O adaptador de caminhos deve distinguir trecho viário, conexão estimada ao pino e ausência de
caminho. `suggestionPath.viaStreets` sozinho não certifica os acessos retos às extremidades.
`routePath.ts` agrega distâncias sem guardar essa distinção: não é suficiente como validador.
Zero de uma parada individual co-localizada é legítimo; fallback reto para unir componentes
desconectados não é. Falta de malha conserva paradas lógicas/entregas, com resultado incompleto
e diagnóstico; não será aprovada como roteiro veicular completo.

Para a caminhada completa, usar o mesmo modelo de visita/retorno aos acessos nos cenários
comparados, incluindo os deslocamentos estimados fundamental–pino. Guardar também a medida
recalculada pelo modelo atual do app se diferir. Não chamar duas medidas diferentes pelo
mesmo nome, nem usar esse desvio para apresentar economia. Acesso conhecido inexistente
ou conexão desconhecida deve continuar distinguível de caminho validado.

### Variantes comparáveis

- **Individual:** uma parada por unidade de endereço, fundamental como âncora; otimizar a
  ordem veicular e os extremos. É a base para medir o efeito do agrupamento, não entrada bruta.
- **Grupos fixos:** construir uma partição inicial respeitando o circuito; otimizar âncoras
  e sequência sem transferir membros. Isola o efeito de congelar agrupamentos.
- **Revisável:** partir de soluções individuais e pré-agrupadas, permitindo operações de
  união/divisão/transferência, movimento de âncora e reordenação. Guardar o melhor viável.

Construção determinística com extremos livres e busca local limitada por operações, não
por tempo de relógio. Reavaliar o custo dirigido inteiro ao inverter uma subsequência;
a simetria do percurso pedestre não vale para o veículo. A primeira entrega mais próxima
serve como tentativa inicial; também avaliar ordens alternativas com retorno completo.
Usar enumeração exata apenas como oráculo em instâncias sintéticas pequenas, não como
promessa de ótimo global nos romaneios reais.

Comparar dois critérios experimentais explícitos: km veiculares e tempo modelado a partir
das velocidades/tempos do app, sempre sujeito aos limites a pé. Apresentar alternativas
não dominadas e suas trocas; não definir silenciosamente um peso de produto entre objetivos.
Conversões são métricas diagnósticas; não reaplicar `metros + 400*D3` como se fosse km real.
Sinais, esperas, restrições de conversão e disponibilidade de estacionamento não estão
completamente na malha atual: marcar desconhecidos/excluídos do modelo de tempo, não zero
observado. Não buscar uma nova fonte externa nem ampliar a malha automaticamente neste spike.

Fixar e registrar limites de candidatas, movimentos avaliados, passadas e cache antes da
bateria comparativa. Usar os mesmos limites por variante, registrar trabalho efetivo e
truncamento; encerrar por limite de busca não prova ótimo. Um limite técnico que impeça
terminar o corpus produz conclusão inconclusiva, não omissão de casos.

## Arquivos previstos — somente após aprovação

Base dos arquivos abaixo: `__utilidades-back-office__/auto-roteirizacao/`.

| Arquivo | Responsabilidade |
|---|---|
| `fundamentals.ts` (novo) | Referências fundamentais, identidade virtual conservadora e rastreabilidade para os pontos originais; tipos específicos do experimento. |
| `experimentPaths.ts` (novo) | Avaliação/cache de caminhos, circuito limitado, caminhada completa e diagnósticos de conectividade/acesso. |
| `fundamentalExperiment.ts` (novo) | Configuração padrão de 120 m, variantes, extremos livres, ordens e refinamento conjunto com trabalho limitado. |
| `fundamentalExperiment.test.ts` (novo) | TDD dos contratos, limites, topologia, conservação, exceção individual e oráculos pequenos. |
| `experimentArtifacts.ts` (novo) | Exportação v1 independente da validação antiga de raio ao pino; relatório e mapa HTML local das geometrias efetivamente avaliadas. |
| `experimentArtifacts.test.ts` (novo) | Parser/importação/storage/reducer reais em memória; identidades, ordem, preservação e consistência das medidas/geometrias. |
| `fundamental.arnes.ts` (novo) | Bateria privada, comparação de variantes/manuais, hashes, métricas e arquivos de inspeção; rede proibida. |
| `vitest.corpus.config.ts` (existente) | Modo explícito para o novo arnês; manter preparação e execução histórica separadas, evitando executar ambos por glob. |
| `README.md` (existente) | Comandos, parâmetros, significado dos dois percursos e limites da inspeção no app. |
| `package.json` (raiz, existente) | Comando próprio `test:auto-fundamentals`, sem pacotes novos e sem substituir a suíte histórica. |

Não alterar `src/`, algoritmo RF-030, importador, schema v1, reducer, configurações do modo
manual, worker ou botões. O código existente entra por importação de funções puras, não por
reescrita. Se o experimento exigir mudança nesses contratos, apresentar o impedimento antes
de ampliar o escopo. Configuração pelo arnês nesta etapa; controle de usuário no app só depois.

## Testes e sequência de execução

1. **Preparação local:** validar inventário, hashes e snapshots já congelados. Conferir o
   marco RF-030 descrito ao fim deste plano. Não baixar dados nem alterar os romaneios.
2. **Vermelho dos contratos:** antes do motor, escrever testes de entrega isolada com pino
   afastado, nenhum órfão por essa distância, invariância do fundamental ao mover âncora,
   circuito fechado no limite/acima dele, configuração diferente do padrão, grupo encadeado
   que excede o teto, pacote duplicado/ausente e entradas imutáveis/determinísticas.
3. **Caminhos:** mão única, vias paralelas, componentes desconectados e projeções coincidentes;
   custos/geometrias iguais à solução validada, retorno incluído, acessos externos ao limite
   mas presentes no total. Verificar ordem pequena contra oráculo independente da heurística.
4. **Regressão real dirigida:** começar pelos casos com pino distante (`case-008` e `case-013`)
   e pela referência `case-003`. Não ajustar suas coordenadas ou copiar suas âncoras humanas.
   Verificar que os antigos órfãos agora pertencem a uma parada e aparecem no JSON importável.
5. **Corpus integral:** todos os casos e referências do inventário. Matriz principal de
   aproximação 30/60 m com circuito de 120 m, variantes e objetivos declarados acima.
   Testar configuração de circuito de 60 m como sensibilidade separada, sem trocar o padrão.
   Passo espacial inicial de 10 m; outros refinamentos só após medir necessidade e custo.
   Humaitá permanece reservado à avaliação, sem calibrar pesos nesse caso.
6. **Reprodutibilidade/desempenho:** aquecimento e repetições declaradas, mediana/p95, ambiente,
   versões, hashes e operações. Relatar tempo do motor separadamente de leitura/renderização.
   Medida neste computador não certifica Android. Nenhuma dependência silenciosa de rede.
7. **Inspeção:** validar cada exportação por parser, importador, armazenamento de teste e
   hidratação reais, com referências/variantes isoladas. Em seguida, revisão visual humana
   das saídas e conclusão do experimento, sem adaptar automaticamente o épico.

Método: TDD para contratos conhecidos, como orienta `test-design`; a pergunta exploratória
do SPIKE não é substituída por um teste que exige encontrar ganhos. Asserções independentes
recalculam cobertura/custo e não usam dublê que devolve a resposta esperada.

Após iniciar legalmente a tarefa, usar os gates declarados com `node mentor.mjs task gate
TASK-SPIKE-002 testes --esperando-vermelho`, depois tipos/lint/testes/build pelo mesmo comando.
A suíte privada tem comando próprio e evidência complementar: o executor formal tem timeout
curto para uma bateria longa. Registrar saída/exit code/run real, sem inventar um gate novo.
Validação manual deve ter estado explícito; não marcar executada por testes de importação.
Neste planejamento nenhum desses gates do experimento foi executado.

## Artefatos para o mantenedor

Gerar nova pasta exclusiva sob `.mentor-saidas/auto-fundamentals/`, com ID/nomes/hashes
produzidos pelo programa. Nunca sobrescrever o histórico de `.mentor-saidas/auto-anchors/`.

- JSONs `eu-roteirizo/roteiro/v1`, mantendo todos os pontos/pacotes e a ordem calculada.
  Identidades opacas por caso/variante/configuração/execução, sem reutilizar as dos manuais.
- `report.json`, resumo e índice com configuração, fundamentos, âncoras finais, grupos,
  geometria, dois percursos, métricas, limites atingidos e incertezas. Dados privados locais.
- Mapa HTML local gerado pelo adaptador, com a malha e linhas avaliadas, sem API/tiles/JS
  remoto. Reutilizar Leaflet instalado; não criar framework de visualização. É necessário
  porque o app v1 recalcula percursos com a malha disponível e não salva o trajeto avaliado.
  Sua verificação deve conferir geometria/coordenadas, não apenas a existência do arquivo.

O v1 serve para inspecionar/editar paradas no app, não para persistir o novo contrato.
Não gravar 120 em `radiusMeters` ou em `autoRadiusMeters`: continuam parâmetros do manual.
Guardar o teto novo no relatório lateral e identificar o roteiro como experimental.
Fundamentais/configuração nova/geometria congelada não sobrevivem como tais no schema atual;
essa limitação deve constar no guia. Reimportar o mesmo arquivo atualiza sua própria cópia.

## Como decidir se deu certo

Separar três conclusões:

- **Validade técnica:** nenhuma perda/duplicação/exclusão indevida; órfãos por distância
  fundamental–pino eliminados; circuitos limitados respeitados; trajetos veiculares válidos
  no modelo; incertezas de acesso preservadas; exportação/importação coerente.
- **Qualidade medida:** tabela por romaneio e agregado com km veiculares, caminhada limitada,
  caminhada completa, pior circuito, tempo modelado, conversões, paradas e custo computacional.
  Comparar com a base individual otimizada, grupos fixos e manuais inalterados, na mesma malha
  e escopo de origem/fim. Informar compatibilidade dos manuais com os novos limites, sem
  corrigi-los. Mostrar ganhos e regressões, inclusive casos não comparáveis.
- **Decisão humana:** apresentar alternativas não dominadas e revisão visual. Sem percentual
  arbitrário de melhora ou obrigação de vencer cada manual. Testes verdes não bastam; se
  não houver benefício mensurável ou houver falhas de dados, resultado negativo/inconclusivo.

Só com resultado favorável e aprovação do mantenedor propor como adaptar RF-031/RF-032,
TEST-004, RF-034 e RF-033. Não mudar agora seus planos/dependências para presumir sucesso.
O fechamento do SPIKE deverá registrar resposta, o que foi descartado e o que destrava;
nenhuma dessas seções é preenchida como conclusão antecipada.

## Impacto, reversibilidade e proporcionalidade

Alcance: ferramentas locais e testes, sem contrato público novo. O validador atual de
`createInspectionPayload` exige raio até pinos: criar adaptador experimental separado,
não remover essa garantia histórica. Reversibilidade: módulos descartáveis, sem migração
e sem regravar originais. Nenhuma dependência, backend ou consulta externa nova prevista.

Riscos restantes: referências de acesso imprecisas, ausência de passagens/semafóricos/
restrições, explosão de candidatos, mínimos locais, excesso de ajuste ao pequeno corpus e
divergência da malha do app. Diagnosticar e quantificar, sem certificar estacionamento real.
Decisões de produto futuras: objetivo/pesos definitivos, campos persistidos, UI dos limites
e enriquecimento da malha. Não são resolvidas silenciosamente pelo experimento.

Proporcionalidade: pediram experimentar a regra antes de adaptar o épico. Proponho uma tarefa
exploratória local, reutilizando leitor, malhas, caminhos e importador; o pequeno mapa de
evidência evita modificar o app só para conferir a rota medida. Não construir motor de
produção/worker/interface completos. Esforço M/G; se o escopo ultrapassar uma fatia, dividir
antes de executar, sem ampliar informalmente esta tarefa.

## Retomada em outra janela

Abrir a mesma pasta local `E:\repositorios\projetos-pessoais\pilotos\teste-mentor-comagenteantigo`,
ramo de origem `codex/task-rf-030-ancoras-livres`. O fechamento salva a RF-030 e este plano;
mudanças alheias e arquivos privados ficam locais. Um worktree novo não os recebe. Não limpar/resetar,
não copiar dados privados para outra ferramenta e não restaurar a versão do Git sobre eles.

Ler `.mentor/nucleo.md`, este plano e
[o registro concluído da RF-030](concluidas/2026-09-10--16h33--TASK-RF-030.md).
A RF-030 mantém os gates no JSON homônimo, repetidos no fechamento; seu ensaio real é
o run `2026-09-10T07-02-24-403Z`, em
`.mentor-saidas/auto-anchors/`, com relatório/manifest/details e `importaveis/LEIA-ME.md`.
Os fontes e entradas desse run foram reconferidos por hash ao preparar este plano.
Os dados em `__utilidades-back-office__/romaneios/` e a `.cache/` do arnês são privados,
ignorados e necessários para repetir a bateria. Não precisam ser reinseridos no chat.

A TASK-SPIKE-002 está aberta na reserva, com plano aprovado e dependência RF-030 concluída.
Nenhum código do experimento foi implementado. Antes de iniciar, conferir que o commit
autorizado da RF-030 está salvo e criar ramo do spike a partir dele, preservando o WIP de uma
tarefa. Não executar a antiga matriz de 90/120 m; seguir os parâmetros deste plano.

Armadilha do processo: `task iniciar` substitui o campo `plano` no JSON por um esqueleto.
Após autorização e início, repor o plano a partir deste documento; não perder o planejamento
nem reiniciar a RF-030. Antes de implementar, reconferir a árvore local e preservar alterações
alheias em contexto, requisitos, melhorias-do-pacote e rascunhos. O commit autorizado é da
RF-030, não do spike; nenhum push autorizado. O helper `task finalizar` promove requisitos
inteiros ao concluir fatias RF: o fechamento da RF-030 preservou RF-34 pendente e a data
anterior de RF-52. Não confundir conclusão desta base espacial com conclusão do épico.
