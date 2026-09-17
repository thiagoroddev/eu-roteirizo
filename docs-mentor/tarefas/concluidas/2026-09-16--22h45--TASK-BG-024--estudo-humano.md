<!-- IA: PARE A LEITURA AGORA. Arquivo exclusivo para humanos (material de estudo/planejamento). Para contexto, histórico ou automação, use o JSON da tarefa ou execute "node mentor.mjs". -->

# Plano de Implementação: TASK-BG-024 — Agrupar automaticamente endereços no raio ao editar parada e salvar

Este plano aborda a resolução do bug relatado, no qual a expansão do raio de uma parada existente não agrega os endereços englobados, além de documentar a causa pela qual a regressão não foi capturada pelos testes automáticos.

---

## 1. Diagnóstico e Causa Raiz

### O que acontece no código atual:
1. **No fluxo de criação (`CREATE_STOP` / `handleCreateStop`)**:
   - A regra `RF-006.4.6` determinou que todos os endereços candidatos dentro do raio do preview entram **automaticamente** como membros da parada no momento da criação.
2. **No fluxo de edição (`REOPEN_STOP` / `SET_DRAFT_RADIUS` / `COMMIT_STOP`)**:
   - Ao clicar em "Editar parada", a parada reabre como rascunho (`StopDraft`), mantendo `draft.pointIds` com os membros originais.
   - Quando o usuário clica no `+` do stepper de raio para expandir o círculo (ex: de 30m para 50m), o reducer processa a ação `SET_DRAFT_RADIUS` em `src/utils/routing/builder.ts`:
     ```ts
     case "SET_DRAFT_RADIUS": {
       if (!state.draft) return state;
       return { ...state, draft: { ...state.draft, radiusMeters: Math.max(0, action.radiusMeters) } };
     }
     ```
   - **O ponto de falha:** `SET_DRAFT_RADIUS` atualiza apenas o valor numérico `radiusMeters`. Ele **nunca adiciona** os endereços recém-englobados a `draft.pointIds`!
   - Como resultado:
     - No mapa, os pontos dentro do novo raio ganham anel pontilhado de "candidatos" (`isCandidate = true`), mas a parada mantém a contagem antiga (badge "2", como visto na captura enviada).
     - Ao clicar em "Salvar", `COMMIT_STOP` persiste apenas `draft.pointIds`. Os novos endereços dentro do raio são solenemente descartados e a parada parece "imutável".

---

## 2. Por que isso não foi detectado em testes automáticos?

Identificamos com precisão a fragilidade na suíte de testes:

1. **Teste legado que blindava o comportamento incorreto:**
   - Em `src/__tests__/utils/routing/builder.test.ts` (linha 261), existia o seguinte teste do fluxo antigo (especificação preliminar §8):
     ```ts
     it("the radius only derives candidates (they never join by themselves)", () => {
       const state = openDraftOnA(initial());
       expect(draftCandidateIds(state)).toEqual(["b", "e"]);
       expect(state.draft?.pointIds).toEqual(["a"]);
       const wider = run(state, { type: "SET_DRAFT_RADIUS", radiusMeters: 60 });
       expect(draftCandidateIds(wider)).toEqual(["b", "c", "e"]);
     });
     ```
   - Este teste afirmava ativamente que alterar o raio devia apenas calcular candidatos e **nunca incluí-los**.
2. **Cobertura incompleta da regra `RF-006.4.6`:**
   - Quando a regra de agregação automática no raio foi implementada (`RF-006.4.6: "os candidatos do raio entram AUTOMATICAMENTE na parada ao criar (reverte §8)"`), foram criados testes automáticos **apenas para o ato de criar** (`handleCreateStop` / `CREATE_STOP`).
   - Ninguém atualizou o fluxo de **edição** (`REOPEN_STOP` + `SET_DRAFT_RADIUS` + `COMMIT_STOP`), e nenhum teste cobria a jornada completa: *criar parada -> editar parada -> aumentar o raio no stepper -> salvar -> verificar que os novos endereços foram persistidos*.
3. **Ponto cego do teste de MapPage:**
   - O teste existente em `MapPage.test.tsx` (linha 1616) apenas verificava se o atributo SVG `data-radius-circle` mudava no mapa ao clicar no stepper de raio, mas não verificava o salvamento nem a lista de membros persistidos.

---

## 3. Mudanças Propostas

### A. Redutor do Construtor de Rotas (`src/utils/routing/builder.ts`)
Atualizar o tratador de `SET_DRAFT_RADIUS`:
- Calcular a distância dos endereços em relação à semente da parada (`seedPointId`).
- **Ao expandir o raio (`newRadius > oldRadius`)**:
  - Identificar endereços livres (não atribuídos a outras paradas e não ignorados) dentro de `newRadius`.
  - Adicioná-los a `draft.pointIds` e reordenar a sequência a pé (`resweepDraft`) preservando a âncora e o sentido da caminhada.
- **Ao reduzir o raio (`newRadius < oldRadius`)**:
  - Remover de `draft.pointIds` os endereços que estavam no raio anterior mas ficaram além do `newRadius` (preservando o ponto semente e endereços que foram adicionados manualmente além do raio).
  - Reordenar a caminhada (`resweepDraft`).

### B. Testes Unitários (`src/__tests__/utils/routing/builder.test.ts`)
- Substituir o teste legado do §8 por novos testes que garantam:
  - Ao executar `SET_DRAFT_RADIUS` com raio maior, pontos livres dentro do novo raio são adicionados automaticamente a `draft.pointIds`.
  - Ao executar `SET_DRAFT_RADIUS` com raio menor, pontos que saíram do raio são removidos de `draft.pointIds`.
  - A ordem de caminhada é recalculada respeitando a âncora.

### C. Teste de Integração no Mapa (`src/__tests__/pages/MapPage.test.tsx`)
- Adicionar teste de ponta a ponta reproduzindo fielmente o cenário das capturas de tela:
  1. Cria Parada P1 com raio 30m englobando pontos próximos.
  2. Clica em "Editar parada" (abre rascunho).
  3. Clica no botão `+` do stepper de raio (aumenta para 40m/50m), cobrindo novos endereços.
  4. Verifica que o badge e a contagem de endereços atualizam imediatamente na interface.
  5. Clica em "Salvar".
  6. Valida que a parada resultante contém todos os novos endereços englobados.

---

## 4. Plano de Verificação

### Testes Automatizados:
```bash
# Rodar testes específicos do builder
npx vitest run src/__tests__/utils/routing/builder.test.ts

# Rodar testes de integração da página do mapa
npx vitest run src/__tests__/pages/MapPage.test.tsx

# Rodar bateria completa de gates do Mentor
node mentor.mjs gates
```

### Verificação Manual Guiada:
1. Abrir a aplicação com uma rota de teste (`/mapa?romaneio=...&rota=...`).
2. Tocar em um endereço e criar uma parada P1 (ex: raio 30m com 2 endereços).
3. Clicar em "Editar".
4. Tocar no botão `+` do stepper de raio para englobar um vizinho próximo (ex: raio 40m).
5. Observar se o pino do vizinho é incorporado visualmente e o total de endereços sobe para 3.
6. Clicar em "Salvar" e confirmar que a parada consolidada no mapa e no painel exibe 3 endereços.

---

## 5. Desfecho e Validação Real

- **Data de conclusão:** 16/09/2026 22:45
- **Commit do fechamento:** `6d96385 fix(TASK-BG-024): englobar automaticamente enderecos no raio ao editar parada e salvar`
- **Validação Manual no Navegador:** 
  - Aprovada pelo usuário com base em testes reais no mapa.
  - Comportamento confirmado: ao editar a parada e expandir o raio no stepper (ex: 50 m), 4 novos endereços livres foram incluídos imediatamente e persistidos ao salvar; ao reduzir o raio (ex: 30 m), os endereços excedentes foram removidos com sucesso.
- **Gates do Mentor:**
  - `tipos`: APROVADO (`npx tsc --noEmit`)
  - `lint`: APROVADO (`npm run lint`)
  - `testes`: APROVADO (`npx vitest run`)
  - `build`: APROVADO (`npm run build`)
- **Status Final:** Tarefa concluída e integrada à `main`.
