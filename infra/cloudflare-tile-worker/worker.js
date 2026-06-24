// worker.js
//
// Cloudflare Worker que faz proxy + cache dos tiles do OpenStreetMap consumidos
// pelo mapa Leaflet do app (components/RouteMap.tsx).
//
// NÃO faz parte do bundle do Vite — é deployado separadamente no Cloudflare
// Workers. Preservado aqui para versionamento/documentação (ver
// docs/requisitos/nao-funcionais.md RNF-12 e o README desta pasta).
//
// Comportamento:
//   - Rota: GET /tiles/{z}/{x}/{y}.png (ou sem .png)
//   - Economia: bloqueia zoom < 14 (403)
//   - Cache: Cache API ("tile-cache-v1") + edge cache do Cloudflare (cacheTtl 7 dias)
//   - CORS liberado para o app

export default {
  async fetch(request, env, ctx) {
    try {
      // =========================================================
      // 0) Segurança básica
      // =========================================================
      if (request.method !== "GET") {
        return withCors(
          new Response("Método não permitido", { status: 405 })
        );
      }

      const url = new URL(request.url);

      // Caminho esperado: /tiles/{z}/{x}/{y}.png
      const path = url.pathname.replace(/^\/+/g, "");
      const parts = path.split("/");

      if (parts.length < 4 || parts[0] !== "tiles") {
        return withCors(new Response("Tile inválido", { status: 400 }));
      }

      const z = Number(parts[1]);
      const x = parts[2];
      const yRaw = parts[3];

      // Aceita /tiles/z/x/y.png ou /tiles/z/x/y
      const y = yRaw.endsWith(".png") ? yRaw.slice(0, -4) : yRaw;

      // =========================================================
      // 1) ECONOMIA: Bloqueia Zoom Distante (MANTIDO COMO VOCÊ PEDIU)
      // =========================================================
      if (z < 14) {
        return withCors(new Response("Zoom bloqueado para economia", { status: 403 }));
      }

      // =========================================================
      // 2) Validação dos parâmetros (evita requests inúteis)
      // =========================================================
      if (!Number.isInteger(z) || z < 0 || z > 22) {
        return withCors(new Response("Zoom inválido", { status: 400 }));
      }

      // x e y devem ser inteiros >= 0
      // (algumas libs podem mandar negativo em edge cases)
      if (!isNonNegativeIntString(x) || !isNonNegativeIntString(y)) {
        return withCors(new Response("Coordenadas inválidas", { status: 400 }));
      }

      // =========================================================
      // 3) Origem (OSM) - corrigido: faltava .png
      // =========================================================
      const tileServer = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;

      // =========================================================
      // 4) Cache
      // =========================================================
      // Cache key consistente (não depende de querystring)
      // Se quiser permitir variações por query, remova as duas linhas abaixo.
      const cacheKey = new URL(request.url);
      cacheKey.search = "";

      const cache = await caches.open("tile-cache-v1");

      // 4.1) Tenta cache primeiro
      const cached = await cache.match(cacheKey);
      if (cached) {
        return withCors(cached);
      }

      // 4.2) Busca na origem com cache do Cloudflare (Edge cache)
      // Isso ajuda muito a reduzir hits repetidos na origem.
      const tileResponse = await fetch(tileServer, {
        headers: {
          // OSM não precisa disso, mas não faz mal manter um identificador
          "User-Agent": "EntregasApp/1.0 (contato@seudominio.com)",
          "Accept": "image/avif,image/webp,image/png,image/*,*/*;q=0.8",
        },
        cf: {
          cacheEverything: true,
          cacheTtl: 604800, // 7 dias
        },
      });

      if (!tileResponse.ok) {
        return withCors(
          new Response("Erro no OSM", { status: tileResponse.status })
        );
      }

      // =========================================================
      // 5) Normaliza headers + salva no Cache API
      // =========================================================
      const headers = new Headers(tileResponse.headers);

      // Garante cache agressivo no cliente e no edge
      headers.set("Cache-Control", "public, max-age=604800, immutable"); // 7 dias
      headers.set("Content-Type", "image/png");

      // (Opcional) Ajuda debug:
      headers.set("X-Tile-Cache", "MISS");

      const responseToReturn = new Response(tileResponse.body, {
        status: tileResponse.status,
        statusText: tileResponse.statusText,
        headers,
      });

      // Salva no Cache API em background
      ctx.waitUntil(cache.put(cacheKey, responseToReturn.clone()));

      return withCors(responseToReturn);

    } catch (err) {
      return withCors(new Response("Erro interno no Worker", { status: 500 }));
    }
  },
};

// =========================================================
// Helpers
// =========================================================

function withCors(response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "*");

  // (Opcional) Debug
  if (!headers.has("X-Tile-Cache")) headers.set("X-Tile-Cache", "UNKNOWN");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function isNonNegativeIntString(value) {
  // evita parseInt("10abc") virar 10
  return typeof value === "string" && /^[0-9]+$/.test(value);
}
