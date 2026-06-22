# 📚 Guia de Navegação do Código - Para Iniciantes

Este documento ajuda você a encontrar rapidamente onde está cada funcionalidade no código.

## 🗺️ Mapa Rápido do Projeto

### 🎯 **Onde está a funcionalidade que eu procuro?**

| Funcionalidade                 | Arquivo                             | Comentário                                      |
| ------------------------------ | ----------------------------------- | ----------------------------------------------- |
| **Upload de arquivo**          | `src/hooks/useRouteUploader.ts`     | Validação, leitura e processamento do Excel/CSV |
| **Processamento do Excel**     | `src/utils/excelProcessor.ts`       | Lógica pesada de parsing com XLSX               |
| **Busca por AT**               | `src/hooks/useRouteSearch.ts`       | Índice de busca e lógica de pesquisa            |
| **Cálculo de estatísticas**    | `src/hooks/useRouteSummary.ts`      | Pacotes, paradas, distância, etc.               |
| **Seletor de rotas**           | `src/components/RouteSelector.tsx`  | Dropdown com todas as rotas                     |
| **Mapa interativo**            | `src/components/RouteMap.tsx`       | Leaflet com marcadores                          |
| **Tabelas**                    | `src/components/RouteSimpleTable/`  | Tabela simplificada                             |
| **Resumo da rota**             | `src/components/RouteSummary.tsx`   | Card com estatísticas                           |
| **Classificação de endereços** | `src/utils/classifyLocationType.ts` | Residencial vs Comercial                        |
| **Formatação de dados**        | `src/utils/formatters.ts`           | Distância, tempo, bairros                       |
| **Validações**                 | `src/utils/validators.ts`           | Funções de validação reutilizáveis              |
| **Constantes**                 | `src/constants/index.ts`            | Mensagens, configurações                        |
| **Tipos TypeScript**           | `src/types/`                        | Definições de tipos                             |

---

## � **Cloudflare Worker - Proxy de Tiles do Mapa**

### 🎯 **O que é?**

Um Worker do Cloudflare que funciona como **proxy/cache** para os tiles do OpenStreetMap (OSM), melhorando performance e reduzindo requisições diretas ao OSM.

### 🛠️ **Como funciona:**

1. **Bloqueio de Zoom**: Economiza recursos bloqueando zoom < 14 (visibilidade do bairro)
2. **Cache Inteligente**: Armazena tiles por 7 dias no cache do Cloudflare
3. **CORS Habilitado**: Permite requisições do navegador
4. **User-Agent Customizado**: Identifica a aplicação para o OSM

### 📦 **Código do Worker:**

```javascript
// worker.js - Deploy no Cloudflare Workers

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.replace(/^\/+/g, "");
    const parts = path.split("/");

    // Valida formato: /tiles/{z}/{x}/{y}.png
    if (parts[0] !== "tiles" || parts.length < 4) {
      return new Response("Tile inválido", { status: 400 });
    }

    const z = parseInt(parts[1]);
    const x = parts[2];
    const y = parts[3];

    // 🔒 ECONOMIA: Bloqueia zoom muito distante (< 14)
    if (z < 14) {
      return new Response("Zoom bloqueado para economia", { status: 403 });
    }

    // 🗺️ URL do tile original no OSM
    const tileServer = `https://tile.openstreetmap.org/${z}/${x}/${y}`;
    const cacheUrl = new URL(request.url);
    const cache = await caches.open("tile-cache-v1");

    // ✅ Verifica se está em cache
    let cachedResponse = await cache.match(cacheUrl);
    if (cachedResponse) {
      return addCors(cachedResponse);
    }

    // 🌍 Busca no servidor OSM
    try {
      const tileResponse = await fetch(tileServer, {
        headers: {
          "User-Agent": "EntregasApp/1.0 (contato@seudominio.com)",
        },
      });

      if (!tileResponse.ok) {
        return new Response("Erro no OSM", { status: tileResponse.status });
      }

      // 📥 Armazena no cache (clone para evitar consumir stream)
      const responseToCache = tileResponse.clone();

      ctx.waitUntil(
        cache.put(
          cacheUrl,
          new Response(responseToCache.body, {
            status: responseToCache.status,
            statusText: responseToCache.statusText,
            headers: {
              ...Object.fromEntries(responseToCache.headers),
              "Cache-Control": "public, max-age=604800, immutable", // 7 dias
            },
          })
        )
      );

      return addCors(tileResponse);
    } catch (err) {
      return new Response("Erro interno no Worker", { status: 500 });
    }
  },
};

// Função auxiliar para adicionar CORS
function addCors(response) {
  const newHeaders = new Headers(response.headers);
  newHeaders.set("Access-Control-Allow-Origin", "*");
  newHeaders.set("Access-Control-Allow-Methods", "GET");
  newHeaders.set("Access-Control-Allow-Headers", "*");

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers: newHeaders,
  });
}
```

### 📍 **Configuração no Projeto:**

```typescript
// src/components/RouteMap.tsx
const TILE_URL = "https://seu-worker.workers.dev/tiles/{z}/{x}/{y}.png";
```

### ⚠️ **Importante:**

- **Zoom Mínimo**: 14 (visão de bairro) - Se usar 11, mostra cidade inteira mas consome mais
- **Cache**: 7 dias (604800 segundos)
- **User-Agent**: Identificar sua aplicação (boa prática OSM)
- **Deploy**: Via painel do Cloudflare Workers ou CLI Wrangler

### 💡 **Benefícios:**

✅ **Performance**: Tiles cacheados carregam instantâneo
✅ **Economia**: Menos requisições ao OSM
✅ **Confiabilidade**: Cache local do Cloudflare
✅ **Grátis**: 100k requisições/dia no plano free

---

## �📂 Estrutura Detalhada

### 🎬 **1. Ponto de Entrada (Como a aplicação inicia)**

```
src/main.tsx
  ↓
src/App.tsx
  ↓
src/pages/RouteViewer.tsx (Página Principal)
```

**O que cada um faz:**

- **main.tsx**: Conecta React ao HTML, carrega estilos globais
- **App.tsx**: Component raiz (no futuro pode ter rotas/navegação)
- **RouteViewer.tsx**: Orquestra toda a interface do usuário

---

### 🔌 **2. Hooks Customizados (A Lógica do Negócio)**

Os hooks ficam em `src/hooks/` e encapsulam lógica complexa:

#### **useRouteUploader.ts** - Gerenciamento de Upload

```typescript
// O QUE FAZ:
// 1. Valida arquivo (tipo, tamanho)
// 2. Chama processExcelFile()
// 3. Gerencia estados (loading, error, routes)

// RETORNA:
{
  (routes, // Dados organizados
    loading, // Está processando?
    error, // Mensagem de erro
    availableCols, // Colunas encontradas
    missingCols, // Colunas faltando
    handleFileUpload); // Função para chamar no onChange
}
```

#### **useRouteSearch.ts** - Busca por AT

```typescript
// O QUE FAZ:
// 1. Constrói índice: AT → Nome da Rota
// 2. Busca em tempo real enquanto usuário digita

// RETORNA:
{
  (searchAT, // Texto digitado
    searchResult, // Rota encontrada (ou "NONE")
    handleSearchChange, // Atualiza busca
    clearSearch); // Limpa tudo
}
```

#### **useRouteSummary.ts** - Estatísticas da Rota

```typescript
// O QUE FAZ:
// Calcula dados do resumo usando useMemo (otimização)

// RETORNA:
{
  (pacotes, lastStop, time, distance, city, at, commerceCount, bairros);
}
```

---

### 🎨 **3. Componentes de UI**

#### **Componentes Principais:**

```
FileUploader.tsx        → Input de arquivo + instruções
RouteSelector.tsx       → Dropdown com lista de rotas
RouteSummary.tsx        → Card com estatísticas da rota
RouteMap.tsx            → Mapa Leaflet em tela cheia
RouteSimpleTable.tsx    → Tabela simplificada (modal)
RouteTable.tsx          → Tabela completa (modal)
ExampleTable.tsx        → Tabela de exemplo (antes do upload)
```

**Padrão de Props:**
Todos os componentes recebem dados via props (não gerenciam estado complexo).

Exemplo:

```typescript
<RouteSummary
  rows={currentRows}           // Dados
  availableCols={availableCols}// Metadados
  onViewMap={() => ...}        // Callbacks
/>
```

---

### 🛠️ **4. Utilitários (Funções Puras)**

Ficam em `src/utils/` e são **funções puras** (mesma entrada = mesma saída, sem efeitos colaterais).

#### **excelProcessor.ts** - O Cérebro do Parsing

```typescript
processExcelFile(file: File): Promise<ProcessedResult>

// FAZ:
// 1. Lê Excel com XLSX library
// 2. Valida colunas obrigatórias
// 3. Agrupa linhas por "Corridor Cage"
// 4. Ordena rotas (A-1, A-2, B-1, etc.)
// 5. Retorna { routes, availableCols, missingCols, error }
```

#### **classifyLocationType.ts** - Residencial ou Comercial?

```typescript
classifyByAddress(address: string)
  → "RESIDENCIAL" | "COMERCIAL" | "INDEFINIDO"

// USA:
// - Lista de palavras-chave (apartamento, loja, etc.)
// - Regex patterns (apt 201, sala 4)
// - Normalização (remove acentos)
```

#### **formatters.ts** - Formatação de Dados

```typescript
formatDistance("20.909km")    → "20.9 km"
transformTime("1h30min")      → "1 hora 30 minutos"
getNeighborhoodDisplay(rows)  → "Copacabana: 5, Ipanema: 3"
```

#### **validators.ts** - Validações Reutilizáveis

```typescript
isValidValue(value)           → true/false
isValidNumber(value)          → true/false
hasValidFileExtension(...)    → true/false
```

#### **safeGetFirst.ts** - Pega Primeiro Valor Válido

```typescript
safeGetFirst(rows, "City", availableCols)
  → "Rio de Janeiro" (ou "Sem dados")

// ÚTIL PARA:
// Dados que se repetem (cidade, CEP base)
```

---

### 📦 **5. Constantes e Tipos**

#### **constants/index.ts** - Configurações Centralizadas

```typescript
// Ao invés de espalhar valores pelo código:
if (file.size > 10485760) // ❌ Magic number!

// Use:
if (file.size > FILE_CONFIG.MAX_FILE_SIZE) // ✅ Clear!

// Contém:
- MESSAGES (erros, sucesso, info)
- FILE_CONFIG (extensões, tamanho max)
- COLUMN_NAMES (nomes das colunas)
- MAP_CONFIG (configuração do mapa)
```

#### **types/index.ts** - Tipos Fundamentais

```typescript
interface RowData {
  [key: string]: unknown; // Linha genérica do Excel
}

type RoutesMap = Record<string, RowData[]>;
// { "A-1": [row1, row2], "B-3": [row3] }
```

#### **types/hooks.ts** - Contratos dos Hooks

```typescript
// Define o que cada hook retorna
interface RouteUploaderReturn { ... }
interface RouteSearchReturn { ... }
interface RouteSummaryData { ... }
```

---

## 🎓 Conceitos-Chave para Iniciantes

### 1️⃣ **Separação de Responsabilidades**

```
COMPONENTES (UI)      → O que renderizar
  ↓ usam
HOOKS (Lógica)        → Como obter/processar dados
  ↓ usam
UTILS (Funções)       → Transformações puras
  ↓ usam
CONSTANTS (Config)    → Valores fixos
```

### 2️⃣ **Fluxo de Dados (Data Flow)**

```
1. Usuário faz upload
   ↓
2. handleFileUpload (hook)
   ↓
3. processExcelFile (util)
   ↓
4. Atualiza estado (routes)
   ↓
5. Componentes re-renderizam com novos dados
```

### 3️⃣ **Estado vs Props**

```typescript
// ESTADO (useState):
// - Dados que MUDAM ao longo do tempo
// - Específico de um componente
const [loading, setLoading] = useState(false);

// PROPS:
// - Dados RECEBIDOS do componente pai
// - Somente leitura (read-only)
function RouteMap({ rows, onClose }) { ... }
```

### 4️⃣ **Renderização Condicional**

```typescript
// Padrão 1: Renderiza SE verdadeiro
{routes && <RouteSelector routes={routes} />}

// Padrão 2: Ou isso OU aquilo
{loading ? <Spinner /> : <Button />}

// Padrão 3: Múltiplas condições
{routes && selectedRoute && (
  <RouteSummary />
)}
```

---

## 🔍 Como Encontrar Algo Específico?

### "Onde está a validação de arquivo?"

→ `src/hooks/useRouteUploader.ts` (linhas 40-60)

### "Como funciona a busca por AT?"

→ `src/hooks/useRouteSearch.ts` (useEffect constrói índice)

### "Onde define se é residencial ou comercial?"

→ `src/utils/classifyLocationType.ts` (listas de keywords + regex)

### "Como o Excel é processado?"

→ `src/utils/excelProcessor.ts` (XLSX library + lógica de agrupamento)

### "Onde estão as mensagens de erro?"

→ `src/constants/index.ts` (objeto MESSAGES)

### "Como o mapa funciona?"

→ `src/components/RouteMap.tsx` (Leaflet + useRef + useEffect)

### "Como calcula a distância formatada?"

→ `src/utils/formatters.ts` (função formatDistance)

### "Onde define os tipos TypeScript?"

→ `src/types/index.ts` e `src/types/hooks.ts`

---

## 🚀 Próximos Passos Para Aprender

1. **Leia os comentários** em cada arquivo (estão em inglês e bem detalhados)
2. **Comece por**:
   - `src/main.tsx` (entenda o início)
   - `src/pages/RouteViewer.tsx` (veja a estrutura)
   - `src/hooks/useRouteUploader.ts` (entenda um hook)
3. **Experimente**:
   - Adicione um console.log() nos hooks para ver o fluxo de dados
   - Mude uma mensagem em MESSAGES e veja onde aparece
   - Adicione uma nova validação em validators.ts

---

## 📖 Recursos de Aprendizado

- **React Hooks**: https://react.dev/reference/react
- **TypeScript**: https://www.typescriptlang.org/docs/
- **Leaflet**: https://leafletjs.com/
- **XLSX Library**: https://docs.sheetjs.com/

---

## 💡 Dicas de Leitura de Código

1. **Comece pelo "contrato"**: Leia os tipos TypeScript primeiro (te dizem o que esperar)
2. **Ignore detalhes no início**: Foque no fluxo geral, não em cada linha
3. **Use a busca**: Ctrl+F para encontrar onde algo é usado
4. **Leia comentários**: Todos os arquivos principais têm blocos explicativos
5. **Desenhe o fluxo**: Diagrama mental ajuda a visualizar

---

Criado em: 30/11/2025
Versão do projeto: refatorado
