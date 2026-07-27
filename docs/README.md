# Guia técnico — Eu Roteirizo

> Documentação **operacional** para quem mexe no código. A apresentação do projeto
> (o que é, estado atual, telas) vive no [README da raiz](../README.md).

## Índice da documentação

| Documento | Para quê |
|---|---|
| [`contexto-projeto-ai.md`](./contexto-projeto-ai.md) | Retrato do projeto: stack real, estrutura de pastas, decisões inegociáveis. **Comece por aqui.** |
| [`arquitetura/ADR/`](./arquitetura/ADR/) | Decisões arquiteturais registradas (001–010) |
| [`requisitos/`](./requisitos/) | Requisitos funcionais, regras de negócio e não-funcionais |
| [`tarefas/`](./tarefas/) | Ciclo de tarefas: pendentes → em andamento → concluídas |
| [`dominios/divida-tecnica.md`](./dominios/divida-tecnica.md) | Dívidas assumidas, cada uma com gatilho de revisão |
| [`design/`](./design/) | Árvore de componentes do mapa, matriz modo × slot |
| [`CODIGO_COMENTADO.md`](./CODIGO_COMENTADO.md) | Passeio pelo código para quem está chegando |
| [`BOAS_PRATICAS.md`](./BOAS_PRATICAS.md) | Padrões adotados no projeto |
| [`plano-infraestrutura-e-custos.md`](./plano-infraestrutura-e-custos.md) | Base quantitativa de custos (preços datados) |

## Comandos

```bash
npm install
npm run dev          # servidor de desenvolvimento (http://localhost:5173)
npm run build        # build de produção
npm run test         # Vitest
npm run lint         # ESLint
npx tsc -b           # checagem de tipos — ver aviso abaixo
npm run preview      # serve a build local
npm run deploy:test  # publica o ambiente de TESTES (Cloudflare Pages)
```

Toda tarefa fecha com os quatro gates verdes: `tsc -b`, `eslint`, `vitest` e `build`.

> ⚠️ **`npx tsc --noEmit` NÃO checa nada neste projeto** (descoberto na TASK-BG-010, 27/07/26).
> O `tsconfig.json` da raiz é *solution-style* — `"files": []` + só `references` — e o `tsc` não
> segue project references sem `-b`. O comando sai com código 0 tendo lido **zero arquivos**, e por
> isso passou verde com um erro de sintaxe no código. O gate real é **`tsc -b`**, que é o que o
> `npm run build` já roda. Registros de tarefas anteriores a 27/07/26 rotularam `tsc --noEmit` como
> APROVADO — essa marcação não significava nada; quem sustentou a checagem foi o `build`.

## Testar no celular

`npm run deploy:test` builda e publica em **https://pre-rota-teste.pages.dev** — URL fixa, HTTPS
(GPS e instalação de PWA só funcionam sob HTTPS), com `X-Robots-Tag: noindex` via
[`public/_headers`](../public/_headers).

É **ambiente de testes, não lançamento**: a URL não é divulgada. Após o deploy, recarregue a página
**2×** no aparelho — o service worker `autoUpdate` instala a versão nova na primeira carga e a ativa
na segunda. Requer `npx wrangler login` uma vez por máquina.

> O projeto no Cloudflare ainda se chama `pre-rota-teste`, nome anterior ao renome para
> "Eu Roteirizo". Projeto do Pages não pode ser renomeado — mudar a URL significa criar projeto
> novo e aposentar o antigo.

## Cloudflare Worker — proxy de tiles

O mapa não consome os tiles do OpenStreetMap direto: passa por um Worker que faz proxy e cache,
versionado em [`infra/cloudflare-tile-worker/`](../infra/cloudflare-tile-worker/).

- Cache de 7 dias na borda do Cloudflare
- Bloqueio de zoom < 14 (economia de requisições)
- CORS habilitado
- 100 mil requisições/dia no plano gratuito

```bash
npx wrangler login
npx wrangler deploy infra/cloudflare-tile-worker/worker.js
```

A URL do Worker é consumida em `src/components/RouteMap.tsx`. Trocá-la sem republicar o app quebra
o mapa — a ordem segura é: criar o Worker novo → atualizar o código → publicar → aposentar o antigo.

> ⚠️ Os tiles hoje vêm dos servidores públicos do OSM, o que **não** atende à política de uso deles
> em cenário comercial. Está registrado como **DT-004** em [`dominios/divida-tecnica.md`](./dominios/divida-tecnica.md),
> com a migração desenhada na [ADR-007](./arquitetura/ADR/ADR-007.md).

## Convenções que pegam quem chega

- **Idioma:** código e identificadores em inglês; texto de usuário em português, sempre via `UI_LABELS` — nunca hardcoded ([ADR-001](./arquitetura/ADR/ADR-001.md))
- **`utils/` é lógica pura** (testável sem mock); **`services/` é IO/persistência** (IndexedDB, tema)
- **Sem `any`** sem justificativa escrita
- **`⚙️ MANUAL KNOB`** marca constantes de calibração visual/gesto — ajuste no ponto marcado, não espalhe números
- **Testes espelham `src/`** em `src/__tests__/`; serviços de IndexedDB usam `fake-indexeddb`
- **Smoke no aparelho é gate de interface:** suíte verde não prova conforto visual ou de gesto
