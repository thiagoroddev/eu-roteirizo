<!-- IA: PARE A LEITURA AGORA. Arquivo exclusivo para humanos (material de estudo/planejamento). Para contexto, histórico ou automação, use o JSON da tarefa ou execute "node mentor.mjs". -->

# TASK-CHORE-028 · Exigir e documentar seção de desfecho obrigatória nas narrativas de estudo humano

Esta tarefa estabelece a obrigatoriedade da seção de Desfecho no processo de conclusão de tarefas do Mentor, orientando proativamente a IA na documentação de processo e adicionando uma trava de garantia no CLI para evitar fechamento de narrativas sem aprendizados técnicos reais.

---

## 1. Motivação e Arquitetura

O padrão de narrativas de estudo humano (`--estudo-humano.md`) foi instituído para preservar os planos ricos e os aprendizados de cada tarefa concluída em benefício exclusivo de humanos, evitando o consumo de tokens pelas IAs nas sessões seguintes.

Contudo, na prática observada:
- A finalização da `TASK-RF-046` ocorreu sem a seção de Desfecho porque o script `finalizar()` em `cmd-tarefa.ts` apenas renomeava o arquivo, sem exigir nem orientar a inclusão do fechamento.
- Se a inserção fosse 100% automática a partir de dados secos da tarefa (data, status, lista de gates), a IA ficaria complacente e o documento perderia o seu maior valor: as armadilhas técnicas descobertas (ex: locks de IndexedDB entre abas) e os aprendizados reais de depuração.
- A solução correta segue o princípio **shift-left**:
  1. O **processo** orienta a IA de forma explícita e proativa a redigir o Desfecho antes de qualquer comando de finalização.
  2. A **ferramenta** (`cmd-tarefa.ts`) aplica uma trava de segurança que bloqueia o fechamento se a seção não existir, lembrando os itens essenciais a documentar.

---

## 2. Mudanças Propostas

1. **`.mentor/processos/tarefa.md`**:
   - No Portão 2 e na seção de Fechamento, formalizar a etapa prévia de redação da seção `## Desfecho e Validação Real` (ou `## Desfecho`), detalhando validação manual observada, armadilhas técnicas e status dos gates.
2. **`.mentor/nucleo.md`**:
   - No fluxo de Finalização do §4, explicitar a redação do Desfecho na narrativa antes de `node mentor.mjs task finalizar <ID>`.
3. **`AGENTS.md`**:
   - Orientar explicitamente que a IA deve preencher o Desfecho na narrativa antes de finalizar a tarefa.
4. **`.mentor/scripts/cmd-tarefa.ts`**:
   - Na função `finalizar()`, verificar se o arquivo da narrativa contém `## Desfecho`. Se ausente, emitir impedimento explicativo com checklist orientador.
5. **`docs-mentor/melhorias-do-pacote.test.ts`**:
   - Teste automatizado validando a recusa do `finalizar` sem desfecho e a aprovação com desfecho presente.
6. **`docs-mentor/melhorias-do-pacote.md`**:
   - Registro da melhoria do pacote no catálogo.

---

## 3. Plano de Verificação

### Testes Automatizados
```bash
npm run test:mentor
npm test
node mentor.mjs verificar
```

---

## 4. Desfecho e Validação Real

### Validação Executada e Comportamento Observado
- A suíte `test:mentor` foi expandida com o grupo F07 (`F07-1`, `F07-2` e `F07-3`) cobrindo:
  1. Recusa explícita do `task finalizar` quando a narrativa da tarefa não possui a seção `## Desfecho` (exibe mensagem orientadora com checklist de 3 itens).
  2. Recusa explícita quando a seção `## Desfecho` existe mas está vazia.
  3. Aceite e conclusão com sucesso quando `## Desfecho e Validação Real` está preenchida, gerando corretamente o arquivo final `${timestamp}--${ID}--estudo-humano.md` na pasta `docs-mentor/tarefas/concluidas/`.
- Todos os 41 testes de `docs-mentor/melhorias-do-pacote.test.ts` passaram com 100% de sucesso (0 falhas).
- Os 3 critérios de aceite da tarefa foram evidenciados com código de saída 0 via `node mentor.mjs task criterio TASK-CHORE-028 <indice>`.
- Todos os 4 gates do projeto (`tipos`, `lint`, `testes`, `build`) executaram e obtiveram `APROVADO` via `node mentor.mjs task gates TASK-CHORE-028`.
- `node mentor.mjs verificar` e `node mentor.mjs doctor` executaram com veredito `APROVADO` e zero bloqueios.

### Armadilhas Técnicas e Aprendizados da Sessão
1. **Escape de aspas no Windows PowerShell vs spawnSync:**
   Ao registrar comandos inline de verificação com `task criterio <ID> <indice> --comando "..."`, o escape de aspas duplas no shell do Windows pode causar desvios no comando passado ao `spawnSync`, resultando em código de saída 1. O padrão recomendado é apontar para comandos determinísticos sem aspas aninhadas (como `npx vitest run ... -t ...`) ou gravar o log com `--saida`.
2. **Isolamento e Hermetismo de Testes no Vitest:**
   Assumir IDs estáticos gerados sequencialmente (`TASK-CHORE-001`, `002`, `003`) em testes causa quebra de hermetismo quando um teste específico é executado isoladamente (`vitest -t ...`). A solução robusta adotada foi extrair o ID dinamicamente da saída do comando `task nova` (`match(/TASK-[A-Z]+-\d+/)`), tornando cada caso de teste completamente desacoplado e idempotente.
3. **Shift-Left de Governança:**
   A trava mecânica em `cmd-tarefa.ts:finalizar` cumpre seu papel de rede de segurança, mas a adição do esqueleto em `cmd-tarefa.ts:iniciar` e as instruções explícitas em `AGENTS.md`, `nucleo.md` e `tarefa.md` garantem que o agente lembre de redigir o desfecho proativamente antes de solicitar o Portão 2, evitando desperdício de rodadas.

### Conclusão dos Gates e Estado Final
- **Gates:** `tipos` (APROVADO), `lint` (APROVADO), `testes` (APROVADO), `build` (APROVADO).
- **Patches do Pacote:** 20 patches registrados e válidos em `docs-mentor/patches-do-pacote.json`.
- **Integridade:** `node mentor.mjs verificar` APROVADO.
- **Portão 2:** Pronto para consulta e autorização de fechamento pelo humano.
