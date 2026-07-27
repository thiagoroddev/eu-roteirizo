# Romaneios de exemplo

Planilhas prontas para testar o app sem precisar de um romaneio real. São as mesmas
usadas nas capturas do [README principal](../README.md).

| Arquivo | Conteúdo | Serve para |
|---|---|---|
| [`exemplo-multi-rota.xlsx`](./exemplo-multi-rota.xlsx) | 20 entregas em 2 rotas — **L-29** (Copacabana) e **L-30** (Ipanema) | Fluxo completo: escolher rota na tela "Rotas", alternar entre elas |
| [`exemplo-rota-unica.xlsx`](./exemplo-rota-unica.xlsx) | 12 entregas, **sem** a coluna `Corridor Cage` | O caminho de rota única, em que o app pula a seleção e vai direto ao sumário |

## Como usar

1. `npm run dev`
2. Abra <http://localhost:5173>
3. **Enviar romaneio** → escolha um dos arquivos acima

Para exercitar o modo **Meu roteiro**, use o multi-rota e abra a **L-29**: as quadras de
Copacabana são curtas e próximas, que é o caso para o qual a construção de rota a pé foi
desenhada. A L-30 é menor e serve para ver a troca de rota dentro do mesmo romaneio.

> A primeira entrada no modo Meu roteiro baixa a malha viária do OpenStreetMap e pode
> demorar alguns segundos — ou falhar e retentar sozinha, se a fila pública do Overpass
> estiver congestionada. Da segunda vez em diante o grafo vem do cache local.

## ⚠️ Os dados são fictícios

Nomes de logradouro e coordenadas são de **vias públicas reais** de Copacabana e Ipanema —
necessário para que a malha do OpenStreetMap responda e o mapa faça sentido. Todo o resto —
números de porta, complementos, pacotes, códigos de rastreio, hub, datas — é **inventado**.

Nenhum dado de entrega real, de cliente ou de operação foi usado.

## Regenerar

```bash
node romaneios/gerar-romaneio-exemplo.mjs
```

O gerador é versionado junto para que as planilhas não sejam binários sem procedência: se as
colunas esperadas mudarem (`COLUMN_NAMES` em [`src/constants/index.ts`](../src/constants/index.ts)),
ajuste o script e regenere.

## Formato esperado

Obrigatórias: **`Latitude`** e **`Longitude`**. Todas as outras colunas são opcionais e apenas
enriquecem a exibição.

A coluna **`Corridor Cage`** é o que decide o modo: presente, agrupa as entregas em rotas;
ausente, o arquivo inteiro vira uma rota só. As coordenadas precisam cair dentro dos limites do
Rio de Janeiro (`MAP_CONFIG.RIO_BOUNDS`) — fora disso são rejeitadas na validação.
