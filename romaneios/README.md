# Romaneios de exemplo

Planilhas prontas para testar o app sem precisar de um romaneio real. São as mesmas usadas nas
capturas do [README principal](../README.md).

> **As planilhas vivem em [`public/romaneios/`](../public/romaneios/)**, não nesta pasta. Elas
> precisam ser servidas pelo app: é de lá que o botão "Testar com romaneio de exemplo" as busca
> (TASK-RF-014), e é o que as torna baixáveis pela URL publicada. Aqui ficam só o gerador e este
> leia-me, que são ferramenta e não entram no build.

| Arquivo | Conteúdo | Serve para |
|---|---|---|
| [`exemplo-multi-rota.xlsx`](../public/romaneios/exemplo-multi-rota.xlsx) | 20 entregas em 2 rotas: **L-29** (Copacabana) e **L-30** (Ipanema) | Fluxo completo: escolher rota na tela "Rotas", alternar entre elas |
| [`exemplo-rota-unica.xlsx`](../public/romaneios/exemplo-rota-unica.xlsx) | 12 entregas, **sem** a coluna `Corridor Cage` | O caminho de rota única, em que o app pula a seleção e vai direto ao sumário |
| [`exemplo-rota-grande.xlsx`](../public/romaneios/exemplo-rota-grande.xlsx) | 120 entregas numa rota só, **L-31** (Copacabana) | **Medir algoritmo**, não usar o app: é o tamanho do caso real, 70 a 150 endereços |

> **A rota grande é diferente das outras duas.** Nenhuma tela a carrega, e ela fica **fora do
> precache do PWA** (`globIgnores` no [`vite.config.ts`](../vite.config.ts)) justamente para não
> pesar na primeira carga de quem usa o app. Serve à medição da **TASK-SPIKE-001** e continua
> baixável pela URL publicada.
>
> Os endereços dela não foram digitados: saíram de [`enderecos-l31.json`](./enderecos-l31.json),
> amostrado uma vez **sobre a malha real do OpenStreetMap** de Copacabana, para que todo ponto caia
> numa rua que existe — é o que torna a contagem de conversões honesta. O amostrador vive em
> `__utilidades-back-office__/spike-conversoes/` e é código de spike; este gerador continua offline,
> lendo só o JSON.

## Como usar

O caminho mais curto não usa arquivo nenhum: `npm run dev`, abra <http://localhost:5173> e toque
em **"Testar com romaneio de exemplo"**. Isso carrega o multi-rota direto.

Para enviar o arquivo à mão (ou testar o de rota única), use **Enviar romaneio** e escolha uma das
planilhas acima.

Para exercitar o modo **Meu roteiro**, use o multi-rota e abra a **L-29**: as quadras de Copacabana
são curtas e próximas, que é o caso para o qual a construção de rota a pé foi desenhada. A L-30 é
menor e serve para ver a troca de rota dentro do mesmo romaneio.

> A primeira entrada no modo Meu roteiro baixa a malha viária do OpenStreetMap e pode demorar
> alguns segundos, ou falhar e retentar sozinha, se a fila pública do Overpass estiver
> congestionada. Da segunda vez em diante o grafo vem do cache local.

## ⚠️ Os dados são fictícios

Nomes de logradouro e coordenadas são de **vias públicas reais** de Copacabana e Ipanema, o que é
necessário para que a malha do OpenStreetMap responda e o mapa faça sentido. Todo o resto (números
de porta, complementos, pacotes, códigos de rastreio, hub, datas) é **inventado**.

Nenhum dado de entrega real, de cliente ou de operação foi usado.

## Regenerar

```bash
node romaneios/gerar-romaneio-exemplo.mjs
```

Escreve as duas planilhas em `public/romaneios/`. O gerador é versionado junto para que elas não
sejam binários sem procedência: se as colunas esperadas mudarem (`COLUMN_NAMES` em
[`src/constants/index.ts`](../src/constants/index.ts)), ajuste o script e regenere.

> O `.gitignore` ignora `*.xlsx` de propósito, para impedir que um romaneio **real**, com dados de
> entrega de cliente, entre no repositório por descuido. Há uma exceção estreita para
> `public/romaneios/*.xlsx`. Não alargue essa exceção.

## Formato esperado

Obrigatórias: **`Latitude`** e **`Longitude`**. Todas as outras colunas são opcionais e apenas
enriquecem a exibição.

A coluna **`Corridor Cage`** é o que decide o modo: presente, agrupa as entregas em rotas; ausente,
o arquivo inteiro vira uma rota só. As coordenadas precisam cair dentro dos limites do Rio de
Janeiro (`MAP_CONFIG.RIO_BOUNDS`), porque fora disso são rejeitadas na validação.
