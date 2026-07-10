# 🚚 Sistema de Visualização de Rotas de Entrega

Aplicação React + TypeScript para visualização e análise de rotas de entrega com mapas interativos.

## 🚀 Tecnologias

- **React 18** + **TypeScript** + **Vite**
- **Leaflet** - Mapas interativos
- **Tailwind CSS** - Estilização
- **Vitest** - Testes
- **Cloudflare Workers** - Proxy de tiles do mapa

## 🗺️ Cloudflare Worker - Proxy de Tiles

### O que é?

Worker que funciona como proxy/cache para tiles do OpenStreetMap, melhorando performance e reduzindo requisições.

### Recursos:

- ✅ **Cache de 7 dias** nos servidores do Cloudflare
- ✅ **Bloqueio de zoom < 14** para economia
- ✅ **CORS habilitado** para requisições do navegador
- ✅ **100k requisições/dia grátis** (plano free)

### Deploy do Worker:

```bash
# 1. Instalar Wrangler CLI
npm install -g wrangler

# 2. Login no Cloudflare
wrangler login

# 3. Criar worker.js com o código (veja CODIGO_COMENTADO.md)

# 4. Deploy
wrangler deploy worker.js
```

### Configuração no projeto:

```typescript
// src/components/RouteMap.tsx
const TILE_URL = "https://seu-worker.workers.dev/tiles/{z}/{x}/{y}.png";
```

### Código completo do Worker:

Veja seção detalhada em **CODIGO_COMENTADO.md**

## 📚 Documentação

- **CODIGO_COMENTADO.md** - Guia completo do código para iniciantes
- **BOAS_PRATICAS.md** - Padrões e boas práticas do projeto
- **REFACTORING_REPORT.md** - Histórico de refatorações

## 🛠️ Instalação e Desenvolvimento

```bash
# Instalar dependências
npm install

# Desenvolvimento
npm run dev

# Build produção
npm run build

# Testes
npm test

# Preview da build
npm run preview

# Deploy de TESTES (Cloudflare Pages) — smoke no celular
npm run deploy:test
```

### Testar no celular (TASK-CHORE-005)

`npm run deploy:test` builda e publica em **https://pre-rota-teste.pages.dev** — URL fixa,
HTTPS (GPS/PWA funcionam), com `X-Robots-Tag: noindex` (`public/_headers`). É ambiente de
**testes**, não o lançamento: a URL não é divulgada. Após o deploy, recarregue a página
**2×** no celular (o service worker `autoUpdate` instala a versão nova na 1ª carga e a
ativa na 2ª). Requer `npx wrangler login` uma única vez por máquina.

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
