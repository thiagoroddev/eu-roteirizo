// worker.js
//
// Cloudflare Worker que faz:
//   1) Proxy + cache dos tiles do OpenStreetMap (components/RouteMap.tsx)
//   2) Proxy da API do Overpass para download da malha viária (utils/routing/osm.ts)
//
// NÃO faz parte do bundle do Vite — é deployado separadamente no Cloudflare
// Workers (projeto: 1-teste-prototipo). Preservado aqui para versionamento e
// documentação (ver docs/requisitos/nao-funcionais.md RNF-12).
//
// Rotas:
//   - GET /tiles/{z}/{x}/{y}.png (ou sem .png): proxy de tiles com economia (z >= 14) e cache de 7 dias
//   - POST/GET /overpass: proxy para o Overpass API com fallback entre espelhos e liberação de CORS
//   - OPTIONS: resposta preflight para navegadores

export default {
  async fetch(request, env, ctx) {
    try {
      // 0) Trata preflight CORS (OPTIONS)
      if (request.method === "OPTIONS") {
        return withCors(new Response(null, { status: 204 }));
      }

      const url = new URL(request.url);
      const path = url.pathname.replace(/^\/+/g, "");

      // 1) Rota de Overpass: /overpass
      if (path === "overpass" || path.startsWith("overpass/")) {
        return await handleOverpass(request, env, ctx);
      }

      // 2) Rota de Tiles: /tiles/{z}/{x}/{y}.png
      const parts = path.split("/");
      if (parts[0] === "tiles") {
        return await handleTiles(request, env, ctx, parts);
      }

      return withCors(new Response("Rota não encontrada", { status: 404 }));
    } catch (err) {
      return withCors(new Response("Erro interno no Worker", { status: 500 }));
    }
  },
};

// =========================================================
// Rota de Overpass (Malha Viária)
// =========================================================

async function handleOverpass(request, env, ctx) {
  if (request.method !== "POST" && request.method !== "GET") {
    return withCors(new Response("Método não permitido", { status: 405 }));
  }

  let bodyData = "";
  if (request.method === "POST") {
    bodyData = await request.text();
  } else {
    const url = new URL(request.url);
    const dataParam = url.searchParams.get("data");
    if (dataParam) {
      bodyData = "data=" + encodeURIComponent(dataParam);
    }
  }

  if (!bodyData) {
    return withCors(new Response("Parâmetro 'data' ausente", { status: 400 }));
  }

  const requestBody = bodyData.startsWith("data=") ? bodyData : ("data=" + encodeURIComponent(bodyData));

  // Servidores Overpass globais em ordem de preferência
  const upstreams = [
    "https://overpass-api.de/api/interpreter",
    "https://lz4.overpass-api.de/api/interpreter",
    "https://z.overpass-api.de/api/interpreter",
    "https://overpass.kumi.systems/api/interpreter",
  ];

  let lastResponse = null;
  let lastError = null;

  for (const upstream of upstreams) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000);

      const upstreamRes = await fetch(upstream, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": "EuRoteirizo/1.0 (https://teste-prototipo.pages.dev)",
        },
        body: requestBody,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (upstreamRes.ok) {
        const resHeaders = new Headers(upstreamRes.headers);
        resHeaders.set("Content-Type", "application/json; charset=utf-8");
        return withCors(
          new Response(upstreamRes.body, {
            status: upstreamRes.status,
            statusText: upstreamRes.statusText,
            headers: resHeaders,
          })
        );
      }

      lastResponse = upstreamRes;
    } catch (err) {
      lastError = err;
    }
  }

  if (lastResponse) {
    return withCors(
      new Response(lastResponse.body, {
        status: lastResponse.status,
        statusText: lastResponse.statusText,
        headers: lastResponse.headers,
      })
    );
  }

  return withCors(
    new Response(
      JSON.stringify({ error: "Servidores Overpass indisponíveis", details: String(lastError) }),
      { status: 504, headers: { "Content-Type": "application/json" } }
    )
  );
}

// =========================================================
// Rota de Tiles (Mapa)
// =========================================================

async function handleTiles(request, env, ctx, parts) {
  if (request.method !== "GET") {
    return withCors(new Response("Método não permitido", { status: 405 }));
  }

  if (parts.length < 4) {
    return withCors(new Response("Tile inválido", { status: 400 }));
  }

  const z = Number(parts[1]);
  const x = parts[2];
  const yRaw = parts[3];
  const y = yRaw.endsWith(".png") ? yRaw.slice(0, -4) : yRaw;

  // Economia: Bloqueia zoom distante
  if (z < 14) {
    return withCors(new Response("Zoom bloqueado para economia", { status: 403 }));
  }

  // Validação dos parâmetros
  if (!Number.isInteger(z) || z < 0 || z > 22) {
    return withCors(new Response("Zoom inválido", { status: 400 }));
  }

  if (!isNonNegativeIntString(x) || !isNonNegativeIntString(y)) {
    return withCors(new Response("Coordenadas inválidas", { status: 400 }));
  }

  const tileServer = `https://tile.openstreetmap.org/${z}/${x}/${y}.png`;
  const cacheKey = new URL(request.url);
  cacheKey.search = "";

  const cache = await caches.open("tile-cache-v1");
  const cached = await cache.match(cacheKey);
  if (cached) {
    return withCors(cached);
  }

  const tileResponse = await fetch(tileServer, {
    headers: {
      "User-Agent": "EuRoteirizo/1.0 (https://teste-prototipo.pages.dev)",
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

  const headers = new Headers(tileResponse.headers);
  headers.set("Cache-Control", "public, max-age=604800, immutable");
  headers.set("Content-Type", "image/png");
  headers.set("X-Tile-Cache", "MISS");

  const responseToReturn = new Response(tileResponse.body, {
    status: tileResponse.status,
    statusText: tileResponse.statusText,
    headers,
  });

  ctx.waitUntil(cache.put(cacheKey, responseToReturn.clone()));

  return withCors(responseToReturn);
}

// =========================================================
// Helpers
// =========================================================

function withCors(response) {
  const headers = new Headers(response.headers);
  headers.set("Access-Control-Allow-Origin", "*");
  headers.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "*");
  headers.set("Access-Control-Max-Age", "86400");

  if (!headers.has("X-Tile-Cache")) headers.set("X-Tile-Cache", "UNKNOWN");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function isNonNegativeIntString(value) {
  return typeof value === "string" && /^[0-9]+$/.test(value);
}
