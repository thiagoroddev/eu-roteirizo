<!-- IA: PARE A LEITURA AGORA. Arquivo exclusivo para humanos (material de estudo/planejamento). Para contexto, histórico ou automação, use o JSON da tarefa ou execute "node mentor.mjs". -->

# TASK-RF-046 · Ordenar romaneios salvos pelo uso mais recente (RF-60)

Implementar o rastreamento de uso (`lastUsedAt`) dos romaneios salvos e ordenar a lista da aba Rotas pelo uso mais recente (importar, abrir rota no Sumário/Mapa, editar roteiro).

## Motivação e Arquitetura

Conforme especificado no RF-60 e no design aprovado, a lista de romaneios salvos deve priorizar os romaneios em trabalho ativo:
1. Importar um romaneio grava seu timestamp de uso e o coloca no topo.
2. Reimportar o mesmo arquivo conta como uso (atualiza o timestamp e reposiciona no topo).
3. Abrir qualquer rota dele (no Sumário ou no Mapa) atualiza o timestamp de uso.
4. Editar e salvar o roteiro de uma rota (no Mapa) atualiza o timestamp de uso.
5. A listagem ordena do uso mais recente para o mais antigo; romaneios legados ou sem uso registrado mantêm fallback pela data de importação (`importedAt`).

### Decisão Técnica: Store dedicada `manifestUsage`
Para não reescrever o `ArrayBuffer` bruto do arquivo (que pode ter vários megabytes) a cada leitura ou edição de parada, criamos uma store dedicada e leve no banco `eu-roteirizo-manifests` (bump para `DB_VERSION = 3`):
- Store: `manifestUsage`, com chave `{ id: string, lastUsedAt: string }`
- Operação `touchManifestUsage(manifestId, timestamp?)`: escrita \(O(1)\) atômica de um registro minúsculo, que nunca falha (fail-safe best-effort)
- `listManifests()` combina os metadados com o mapa de uso e ordena decrescente por `(b.lastUsedAt ?? b.importedAt).localeCompare(a.lastUsedAt ?? a.importedAt)`.

---

## User Review Required

> [!IMPORTANT]
> **Alteração de Esquema IndexedDB (`eu-roteirizo-manifests` v2 → v3):**
> A migração é aditiva e não destrutiva (`upgrade` cria `manifestUsage` se não existir). Romaneios já salvos no dispositivo continuam intactos e adotam a data de importação original (`importedAt`) como fallback até serem tocados.

---

## Proposed Changes

### Tipagem de Domínio

#### [MODIFY] [manifest.ts](../../../src/types/manifest.ts)
- Adicionar campo opcional `lastUsedAt?: string` na interface `ManifestMeta`.

---

### Camada de Persistência e Storage

#### [MODIFY] [manifestStorage.ts](../../../src/services/manifestStorage.ts)
- Subir `DB_VERSION` de 2 para 3.
- Criar a store `manifestUsage` no `upgrade(db)`.
- Adicionar `touchManifestUsage(manifestId: string, timestamp?: string): Promise<void>`.
- Adicionar função auxiliar `getManifestUsageMap(): Promise<Map<string, string>>`.
- Atualizar `saveManifest`: gravar timestamp de uso tanto em novos registros quanto em duplicatas detectadas (RF-60 critério 4).
- Atualizar `saveStandaloneManifest`: registrar uso do romaneio importado via JSON.
- Atualizar `deleteManifest`: remover chave correspondente em `manifestUsage`.
- Atualizar `clearManifests`: limpar a store `manifestUsage`.
- Atualizar `listManifests`: carregar metadados e mapa de uso, associar `lastUsedAt` e ordenar decrescente por `lastUsedAt ?? importedAt`.
- Atualizar `getManifest`: anexar `lastUsedAt` quando disponível.

#### [MODIFY] [routeStorage.ts](../../../src/services/routeStorage.ts)
- Importar `touchManifestUsage` de `./manifestStorage`.
- Em `saveRoteiro`, invocar `void touchManifestUsage(manifestId)` para registrar uso quando o roteiro for editado/salvo no mapa.

---

### Hooks e Páginas da Aplicação

#### [MODIFY] [useRouteUploader.ts](../../../src/hooks/useRouteUploader.ts)
- Em `loadManifest(id, routeName)`: após recuperar o registro com sucesso, chamar `void touchManifestUsage(id)` (cobre abertura tanto pelo Sumário quanto pelo Mapa via `useManifestFromUrl`).
- Em `processAndSave`: tratamento resiliente com `finally { setLoading(false); }` e logs de diagnóstico.

#### [MODIFY] [HomePage.tsx](../../../src/pages/HomePage.tsx)
- Em `handleImportRouteFile`: adição de logs detalhados de diagnóstico e encerramento garantido de loading via `finally`.

#### [MODIFY] [RoutesPage.tsx](../../../src/pages/RoutesPage.tsx)
- Em `useEffect`: logs de busca e tratamento de fallback para `[]` em caso de erro na obtenção de manifestos.

---

### Testes Automatizados

#### [MODIFY] [manifestStorage.test.ts](../../../src/__tests__/services/manifestStorage.test.ts)
- Testar que `saveManifest` grava `lastUsedAt`.
- Testar que reimportar duplicata atualiza `lastUsedAt` e move o romaneio para o topo da lista.
- Testar que `touchManifestUsage` atualiza o timestamp e a ordenação.
- Testar ordenação com fallback para `importedAt` quando `lastUsedAt` não existe (romaneios legados).
- Testar que `deleteManifest` e `clearManifests` removem os dados da store de uso.

#### [MODIFY] [useRouteUploader.test.ts](../../../src/__tests__/hooks/useRouteUploader.test.ts)
- Validar que `loadManifest` aciona a atualização de uso.

#### [MODIFY] [routeStorage.test.ts](../../../src/__tests__/services/routeStorage.test.ts)
- Validar que `saveRoteiro` aciona a atualização de uso do romaneio correspondente.

---

## Verification Plan

### Automated Tests
- Executar suíte de testes de persistência:
  ```powershell
  npx vitest run src/__tests__/services/manifestStorage.test.ts src/__tests__/services/routeStorage.test.ts src/__tests__/hooks/useRouteUploader.test.ts
  ```
- Rodar gates do Mentor:
  ```powershell
  node mentor.mjs task gates TASK-RF-046
  ```

### Manual Verification
1. Abrir a aplicação em modo `npm run dev`.
2. Importar dois romaneios distintos (ex: Romaneio A e Romaneio B). Romaneio B fica no topo.
3. Abrir uma rota do Romaneio A no Sumário e voltar para a aba Rotas: Romaneio A agora deve aparecer no topo.
4. Entrar no Mapa do Romaneio B, mover ou adicionar uma parada para acionar o auto-save, e voltar para a aba Rotas: Romaneio B agora deve voltar ao topo.
5. Reimportar o arquivo do Romaneio A: aviso de duplicata surge e o Romaneio A vai para o topo da lista.

---

## 5. Desfecho e Validação Real

- **Data de conclusão:** 17/09/2026 08:04
- **Validação Manual no Navegador:**
  - Aprovada pelo usuário com base em testes reais no navegador.
  - Comportamento confirmado: a lista de romaneios salvos reordena corretamente priorizando o uso mais recente (ao abrir qualquer rota pelo Sumário ou Mapa, ou ao reimportar duplicata mantendo a ordem dos anteriores).
- **Armadilhas Técnicas & Aprendizados Reais (Concorrência e Conexão de IndexedDB):**
  - Ao subir a versão do banco IndexedDB (`eu-roteirizo-manifests` v2 -> v3 para adicionar a store `manifestUsage`), abas concorrentes do app mantendo a conexão aberta com a v2 bloqueavam silenciosamente a nova abertura, deixando o app em carregamento infinito sem erro no console.
  - O diagnóstico exigiu instrumentação com logs passo a passo em `manifestStorage.ts` e `useRouteUploader.ts`.
  - Como solução definitiva e resiliente, implementou-se:
    1. Tratamento completo dos eventos de ciclo de vida do IndexedDB: `blocked`, `blocking` e `terminated`.
    2. Monitoramento de timeout de 4 segundos via `Promise.race` em `getDb()`, com emissão de alerta no console e rejeição caso o banco trave por lock externo.
    3. Proteção com bloco `try ... finally { setLoading(false); }` em `processAndSave`, garantindo que o spinner de carregamento da interface seja sempre desarmado.
- **Gates do Mentor:**
  - `tipos`: APROVADO (`tsc -b`)
  - `lint`: APROVADO (`eslint .`)
  - `testes`: APROVADO (`vitest run` — 1.033 testes passando em 81 arquivos)
  - `build`: APROVADO (`vite build`)
- **Status Final:** Tarefa concluída com sucesso, requisito `RF-60` vinculado e implementado no ciclo.

