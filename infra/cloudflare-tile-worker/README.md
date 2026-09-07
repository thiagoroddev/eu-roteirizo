# Cloudflare Tile Worker

Proxy + cache dos *tiles* do OpenStreetMap usados pelo mapa Leaflet do app
([`src/components/RouteMap.tsx`](../../src/components/RouteMap.tsx)).

> ⚠️ **Não faz parte do bundle do Vite.** É um Cloudflare Worker deployado à
> parte. Este arquivo é mantido aqui só para **versionar e documentar** uma peça
> de infraestrutura que, antes, vivia apenas no deploy. Editar aqui **não** muda
> o que está no ar: é preciso fazer o deploy do Worker.

## O que ele faz

| Aspecto | Comportamento |
|---|---|
| **Rota** | `GET /tiles/{z}/{x}/{y}.png` (também aceita sem `.png`) |
| **Origem** | `https://tile.openstreetmap.org/{z}/{x}/{y}.png` |
| **Economia** | Bloqueia **zoom < 14** (HTTP 403): evita baixar tiles de visão muito ampla |
| **Cache** | Cache API (`tile-cache-v1`) + edge cache do Cloudflare (`cf.cacheTtl` = 7 dias); resposta com `Cache-Control: public, max-age=604800, immutable` |
| **CORS** | Liberado (`Access-Control-Allow-Origin: *`) para o app consumir |
| **Validação** | Recusa método ≠ GET, caminho fora de `/tiles/...`, zoom fora de 0 a 22, `x`/`y` não-inteiros |

## Relação com o app

- O `RouteMap` aponta o `tileLayer` do Leaflet para a URL deste Worker (e não direto para o OSM), por isso o **zoom mínimo do mapa** (`MAP_CONFIG.ZOOM.MIN = 14`, em `src/constants/index.ts`) **casa** com o bloqueio de `z < 14` daqui: abaixo disso o Worker recusa o tile de propósito.
- Documentado como **RNF-12** em [`docs/requisitos/nao-funcionais.md`](../../docs/requisitos/nao-funcionais.md).

## Deploy (referência)

É um Worker padrão (sintaxe de módulo ES `export default { fetch }`). Deploy via
`wrangler deploy` ou pelo painel do Cloudflare. Ajuste o domínio/rota do Worker
e o `User-Agent` (hoje um placeholder) conforme o seu projeto.

> **Worker ativo (TASK-CHORE-014):** `1-teste-prototipo`, publicado em
> `https://1-teste-prototipo.thiagorod-dev.workers.dev/tiles/{z}/{x}/{y}.png`.

