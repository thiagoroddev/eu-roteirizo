# 🚚 Eu Roteirizo

**PWA que transforma o romaneio de entregas em paradas de veículo com circuitos de entrega a pé,
traçados sobre o grafo de ruas do OpenStreetMap. Sem backend, sem conta e sem API de roteirização paga.**

**[▶️ Abrir o protótipo](https://teste-prototipo.pages.dev/)** ·
[Avaliando em 5 minutos](#-avaliando-em-5-minutos) ·
[Estado atual](#-estado-atual) ·
[Documentação](#-documentação) ·
[Sobre o uso de IA](#-sobre-o-uso-de-ia)

> ### ⚠️ Protótipo em desenvolvimento
>
> Este é um **projeto pessoal de aprendizado, em construção ativa**. Não é um produto lançado: não tem
> versão estável, não está em loja de aplicativos, e o ambiente publicado no link acima é um
> **protótipo**, mantido para demonstração e para os testes no aparelho.
> O modo de visualização está maduro; o construtor de roteiro é recente; a execução da rota
> **ainda não existe**. O estado real, funcionalidade por funcionalidade, está em
> [Estado atual](#-estado-atual).
>
> **Desenvolvido com auxílio intensivo de IA** (Claude). O que isso significou na prática está em
> [Sobre o uso de IA](#-sobre-o-uso-de-ia).

---

## O problema

Entregador de última milha recebe uma planilha com dezenas de endereços já ordenados para o **veículo**.
Só que boa parte da entrega urbana é feita **a pé**: estaciona-se uma vez e caminha-se um quarteirão
inteiro. A ordem da planilha não ajuda nessa hora, e as ferramentas de roteirização que existem ou
cobram por requisição, ou assumem que cada parada é uma movimentação com veículo.

**Eu Roteirizo** lê esse romaneio e oferece duas leituras dele:

| Modo | O que faz |
|---|---|
| **Original** | Mostra a planilha como ela é: mapa com marcador por endereço, painel com detalhe da parada, tabelas e sumário. |
| **Meu roteiro** | Deixa você **construir a rota manualmente parada por parada**: define onde o veículo para (por padrão no mesmo endereço de entrega, permitindo alteração), agrupa endereços por raio de caminhada e calcula o percurso real pelas ruas mostrando tempo e distância. O local onde o veículo estaciona em cada parada é ponto de partida para a próxima, e o app sugere a próxima parada com base na posição que é independente dos endereços de entrega. |

---

## 📱 Telas

Capturas do app **em execução**, processando um romaneio fictício de Copacabana.
Nenhuma é mockup. São o que o código faz hoje.

<table>
  <tr>
    <td align="center"><img src="docs/imagens/01-home.png" width="185"><br><sub><b>Upload</b><br>XLSX ou CSV, lido no navegador</sub></td>
    <td align="center"><img src="docs/imagens/02-rotas.png" width="185"><br><sub><b>Romaneios salvos</b><br>persistidos em IndexedDB</sub></td>
    <td align="center"><img src="docs/imagens/03-sumario.png" width="185"><br><sub><b>Sumário</b><br>números derivados da rota</sub></td>
  </tr>
  <tr>
    <td align="center"><img src="docs/imagens/04-mapa-original.png" width="185"><br><sub><b>Modo Original</b><br>marcadores SVG por tipo de local</sub></td>
    <td align="center"><img src="docs/imagens/05-mapa-meu-roteiro.png" width="185"><br><sub><b>Meu roteiro</b><br>construção começa pelo início</sub></td>
    <td align="center"><img src="docs/imagens/07-roteiro-montado.png" width="185"><br><sub><b>Parada do veículo</b><br>com próxima parada sugerida</sub></td>
  </tr>
</table>

---

## ⏱️ Avaliando em 5 minutos

Se você chegou aqui para julgar o trabalho e tem pouco tempo, este é o caminho curto.

**No app** ([protótipo ao vivo](https://teste-prototipo.pages.dev/), ou `npm run dev`):

1. Toque em **"Testar com romaneio de exemplo"**. Não precisa de arquivo nenhum: um romaneio
   fictício de Copacabana entra pelo mesmo caminho de um upload real.
2. Abra a rota **L-29** e veja o **modo Original**: marcadores por tipo de local, painel da parada,
   sumário.
3. Troque para **Meu roteiro**, marque um ponto de início no mapa e adicione uma parada. O app
   baixa a malha de ruas, agrupa os endereços por raio de caminhada e traça o percurso real.
   A primeira parada demora alguns segundos, porque é quando o grafo é baixado. A partir dali é
   instantâneo, porque fica em cache.

**No código**, se quiser ir direto à parte difícil sem caçar arquivo:

| Onde | O que tem |
|---|---|
| [`src/utils/routing/aStar.ts`](src/utils/routing/aStar.ts) + [`graph.ts`](src/utils/routing/graph.ts) | O A\* e o grafo dirigido sobre dados do OpenStreetMap, escritos aqui. É o núcleo técnico do projeto |
| [`src/utils/routing/builder.ts`](src/utils/routing/builder.ts) | O reducer que constrói o roteiro. Domínio inteiro isolado da UI, testável sem renderizar nada |
| [`src/utils/excelProcessor.ts`](src/utils/excelProcessor.ts) | Leitura da planilha, o ponto de entrada de todo dado do app |
| [`docs/arquitetura/ADR/ADR-002.md`](docs/arquitetura/ADR/ADR-002.md) | Por que roteirização própria em vez de API paga, com as alternativas que foram descartadas |
| [`docs/tarefas/concluidas/2026-07-18--18h07--TASK-BG-006.md`](docs/tarefas/concluidas/2026-07-18--18h07--TASK-BG-006.md) | Um registro de caça a bug do começo ao fim: sintoma, hipóteses erradas, causa raiz e correção |

---

## 🧭 O que tem de interessante aqui

O que me fez escolher este projeto como estudo não foi a tela, foi o que está atrás dela.

**Roteirização própria, sem API paga.** O app baixa a malha viária do OpenStreetMap (via Overpass),
monta um **grafo dirigido** em memória (mão única vira aresta ausente, não penalidade) e roda um
**A\* próprio** sobre ele. Nenhuma chamada ao Google Directions ou similar. Isso não foi capricho
técnico: a proposta só fecha se o custo por usuário for perto de zero. A decisão está registrada na
[ADR-002](docs/arquitetura/ADR/ADR-002.md).

**100% client-side, de verdade.** Sem servidor de aplicação, sem banco remoto, sem login. Romaneios,
roteiros e o cache do grafo vivem em **IndexedDB no aparelho**. O único componente de infraestrutura
é um Cloudflare Worker que faz proxy e cache dos tiles do mapa.

**Grafo com cache offline.** Baixar a malha de ruas é a operação mais cara do fluxo; ela é cacheada
por região, então a segunda entrada no modo roteiro é instantânea. O Overpass é um serviço público
com fila. Quando ele devolve `429`/`504`, o app **retenta sozinho com backoff exponencial** em vez
de mostrar erro. (As capturas acima foram feitas com o Overpass retornando `504` três vezes seguidas;
o retry recuperou sem intervenção.)

**Domínio complexo isolado da UI.** A construção do roteiro é um `useReducer` puro
(`routeBuilderReducer`), testável sem renderizar nada. Não há biblioteca de estado global.

**Mobile-first porque o uso é na rua.** O alvo é alguém segurando o celular com uma mão, no sol,
entre uma entrega e outra. Toda calibração de gesto e espaçamento é constante nomeada e comentada
com o marcador `⚙️ MANUAL KNOB`, para ajustar num lugar só.

---

## 🛠️ Stack

| Camada | Escolhas |
|---|---|
| **Base** | React 18, TypeScript (strict), Vite 7 |
| **PWA** | `vite-plugin-pwa` (service worker, instalável) |
| **UI** | Tailwind CSS + shadcn/ui (Radix), tema próprio em tokens CSS |
| **Mapa** | Leaflet, tiles via Cloudflare Worker (proxy + cache) |
| **Dados** | SheetJS (XLSX/CSV), IndexedDB via `idb` |
| **Roteirização** | Overpass API (OSM) + grafo e A\* escritos no projeto |
| **Testes** | Vitest, Testing Library, `fake-indexeddb` |

---

## 📊 Estado atual

Números de **28/07/2026**, conferidos no repositório.

**Funciona hoje**
- ✅ Leitura de romaneio XLSX/CSV, multi-rota (agrupado por corredor) ou rota única
- ✅ Persistência local dos romaneios, com deduplicação por hash SHA-256
- ✅ Navegação multi-tela com deep link (a URL carrega o modo, então F5 e link compartilhado preservam o estado)
- ✅ Modo Original completo: mapa, marcadores por tipo de local, painel de parada, tabelas e sumário
- ✅ Modo Meu roteiro: ponto inicial por GPS/toque, paradas por raio de caminhada, âncora do veículo, ordem derivada, traçado real pelas ruas e estimativas de tempo
- ✅ PWA instalável, com o grafo de ruas cacheado para uso offline

**Ainda não existe**
- ❌ **Execução da rota**: marcar entrega como concluída, acompanhar progresso em campo (é a próxima fronteira)
- ❌ **Auto-roteirizar**: hoje o agrupamento de paradas é manual
- ❌ **Exportar/importar roteiro** em JSON (o botão na tela inicial é stub declarado)
- ❌ Backend, contas, sincronização entre aparelhos, todos fora do escopo por decisão de projeto

**Qualidade**

| | |
|---|---|
| Testes | **774** automatizados em 72 arquivos |
| Código | ~13.500 linhas em `src/` + ~10.600 de teste |
| Gates por tarefa | `tsc -b` · `eslint` · `vitest` · `build` |
| Decisões registradas | 10 ADRs |
| Requisitos rastreados | 44 de 49 funcionais entregues |

> A suíte inteira está verde. Até 27/07 um teste era **instável**: ele exercitava o retry do
> Overpass esperando em relógio de parede, e o backoff somava ~4,5 s contra um timeout de 5 s,
> então passava ou falhava conforme a carga da máquina. Corrigido na `TASK-BG-009` injetando o
> relógio, e verificado em 10 execuções seguidas em vez de uma, porque teste instável passa
> sozinho com frequência.

---

## ▶️ Rodando localmente

```bash
npm install
npm run dev          # http://localhost:5173
```

**Não precisa de romaneio próprio para testar.** A tela inicial tem o botão **"Testar com romaneio
de exemplo"**, que carrega um romaneio fictício direto, sem baixar nem enviar arquivo. Ele passa
pelo mesmo caminho de um upload real: validação, leitura da planilha, hash, deduplicação e
persistência local.

Se preferir enviar o arquivo à mão, as duas planilhas estão em [`public/romaneios/`](public/romaneios/):

| Arquivo | Conteúdo |
|---|---|
| [`exemplo-multi-rota.xlsx`](public/romaneios/exemplo-multi-rota.xlsx) | 20 entregas em 2 rotas (Copacabana e Ipanema). É o caminho completo, e o que o botão carrega |
| [`exemplo-rota-unica.xlsx`](public/romaneios/exemplo-rota-unica.xlsx) | 12 entregas sem a coluna de agrupamento. É o caminho de rota única |

São os mesmos dados das capturas acima, e são **fictícios**: as vias são reais (o mapa precisa
disso), o resto é inventado. Para ver o modo Meu roteiro no seu melhor caso, use o multi-rota e
abra a **L-29**: quadras curtas, muitos endereços perto uns dos outros.

Se quiser usar um arquivo seu: o mínimo são as colunas `Latitude` e `Longitude`; a coluna
`Corridor Cage`, se existir, agrupa as entregas em rotas. Detalhes em
[`romaneios/README.md`](romaneios/README.md).

```bash
npm run test         # suíte
npm run lint         # eslint
npm run typecheck    # tipos, roda `tsc -b` (o tsconfig da raiz usa project references)
npm run build        # build de produção
```

### Numa máquina nova

O `git clone` traz o código, mas não traz a configuração local do git nem os arquivos que ficam
fora do repositório de propósito.

```bash
npm ci                              # dependências
node mentor.mjs hooks --instalar    # liga o pre-push, que roda os gates antes de cada push
git config core.longpaths true      # só no Windows: aceita caminhos acima de 260 caracteres
```

O `mentor.mjs` precisa de Node 22.18 ou mais novo. A ligação do hook e o `core.longpaths` ficam no
`.git/config` da máquina e não vão para o GitHub. Sem o `core.longpaths`, ferramentas de IA que
criam referências de nome longo no git fazem o `git fetch` falhar no Windows.

**Pastas locais fora do git:**

| Pasta | O que guarda | Pode ir para o git? | Se faltar |
|---|---|---|---|
| `node_modules/` | dependências | não | `npm ci` |
| `dist/` | build de produção | não | `npm run build` |
| `__utilidades-back-office__/romaneios/` | romaneios **reais** (XLSX) que os arneses de auto-roteirização leem | **nunca**: são dados de entrega de clientes | copiar dos originais guardados fora do git. Sem eles os arneses não rodam; o app funciona normalmente |
| `.mentor-saidas/` | saídas do mentor e dos arneses: relatórios, mapas HTML, GeoJSON e JSONs importáveis gerados dos romaneios reais | **nunca**: derivam dos romaneios reais | rodar o arnês de novo (`npm run test:auto-anchors`, `npm run test:auto-fundamentals`). O que valer guardar, copiar à mão |
| `__utilidades-back-office__/auto-roteirizacao/.cache/` | malha do OpenStreetMap e grafos já montados para os arneses | não: é cache | nada. A próxima execução baixa de novo |
| `__utilidades-back-office__/spike-conversoes/.cache/` | malha do OpenStreetMap da medição da SPIKE-001 | não: é cache | nada. A próxima execução baixa de novo |
| `.claude/` | configuração local do Claude Code (preview no navegador) | não | a ferramenta recria |

O app não lê `.env`. As únicas variáveis de ambiente são as chaves dos arneses de laboratório,
listadas em `docs-mentor/contexto.json`, no bloco `laboratorio.chaves`.

---

## 📚 Documentação

O repositório carrega mais documentação do que o normal para um projeto deste tamanho. Foi
deliberado, e é metade do experimento:

- **[`docs/contexto-projeto-ai.md`](docs/contexto-projeto-ai.md)**: o retrato do projeto, com stack real, estrutura e decisões inegociáveis
- **[`docs/arquitetura/ADR/`](docs/arquitetura/ADR/)**: 10 decisões arquiteturais com contexto e alternativas descartadas
- **[`docs/requisitos/`](docs/requisitos/)**: requisitos funcionais, regras de negócio e não-funcionais, rastreados até a tarefa que os implementou
- **[`docs/tarefas/`](docs/tarefas/)**: o histórico completo, com cada tarefa registrada com plano aprovado, log de execução, decisões, gates e aprendizados
- **[`docs/dominios/divida-tecnica.md`](docs/dominios/divida-tecnica.md)**: dívidas assumidas, cada uma com o gatilho que manda revisitá-la

---

## 🤖 Sobre o uso de IA

Este projeto foi construído com **auxílio intensivo de IA** (Claude), e acho mais interessante ser
explícito sobre isso do que fingir o contrário.

A IA escreveu a maior parte do código. O que eu trouxe foi o **problema** (conheço a dor de quem
entrega), as **decisões** de produto e arquitetura, e o **critério de aceite**: nenhuma tarefa fecha
sem `tsc`, `eslint`, `vitest` e `build` verdes, e funcionalidade de interface só é considerada pronta
depois de teste no aparelho real, porque suíte verde não prova conforto de uso na rua.

Para que isso não virasse geração de código sem rumo, o repositório inclui um **manual de operação do
agente** em [`.github/agents/`](.github/agents/): princípios, ciclo de tarefa, padrões de código,
checklists de revisão e modos de cerimônia proporcionais ao risco da mudança. Os registros em
`docs/tarefas/concluidas/` são a saída desse processo.

Se quiser conferir em vez de acreditar, três pontos de entrada:

- **As regras que o agente segue**: [`01-nucleo.md`](.github/agents/geral-robusto/01-nucleo.md),
  o arquivo carregado em toda interação, com os princípios e o que exige aprovação explícita minha.
- **Uma tarefa em que o plano mudou no meio**:
  [`TASK-DOC-010`](docs/tarefas/concluidas/2026-07-27--22h05--TASK-DOC-010.md) trocou de método duas
  vezes durante a execução, e registra por quê, o que ficou de fora e o que a revisão ressalvou.
- **Um gate que passou verde sem checar nada**:
  [`TASK-BG-010`](docs/tarefas/concluidas/2026-07-27--18h30--TASK-BG-010.md). O `tsc --noEmit` saía
  com código 0 sem ler arquivo nenhum, então dezenas de registros anteriores tinham rotulado como
  APROVADO uma checagem que nunca rodou. Está documentado justamente porque é o tipo de coisa que
  um processo assim precisa admitir para valer alguma coisa.

Boa parte do que aprendi aqui foi menos sobre React e mais sobre **como conduzir e revisar** trabalho
que não foi minha mão que digitou.

---

## 📄 Licença

Sem licença de código aberto. O código está público para **avaliação e portfólio**; todos os direitos
reservados. Termos completos em [`LICENSE`](LICENSE). Se quiser usá-lo para algo, é só me chamar.

Os dados de malha viária vêm do [OpenStreetMap](https://www.openstreetmap.org/copyright), sob ODbL.

---

<sub>Projeto pessoal de <b>Thiago Silva</b> · em desenvolvimento desde junho de 2026 · dados das capturas são fictícios</sub>
