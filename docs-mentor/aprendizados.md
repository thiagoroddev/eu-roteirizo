# Aprendizados do Projeto

> Registro consolidado de aprendizados técnicos, armadilhas de ambiente e decisões de domínio acumuladas no desenvolvimento do eu-roteirizo.

## Ambiente e Execução Local

- **Processos Órfãos do Dev Server (Vite)**:
  - *Problema*: Ao reiniciar servidores em segundo plano, processos residuais do Node podem continuar segurando a porta padrão (5173). O Vite então sobe na porta seguinte (5174). Se o navegador permanecer na 5173, o usuário testa uma versão antiga congelada em cache ("nada mudou").
  - *Diretriz*: Antes de homologar testes de interface, conferir se a porta em escuta corresponde exatamente à URL aberta e terminar processos órfãos com Stop-Process.

## Persistência e Armazenamento Local (IndexedDB)

- **Idempotência em Importações (Upsert Incondicional)**:
  - *Problema*: Guardas de existência ingênuas (if (!existing) save()) impedem que a reimportação do mesmo arquivo atualize tabelas locais no IndexedDB.
  - *Diretriz*: Operações de importação de arquivos pelo usuário devem sempre sobrescrever de forma limpa colunas, linhas e metadados.
- **Auto-Recuperação no Carregamento (loadManifest)**:
  - *Diretriz*: O hook de leitura deve ser resiliente: se encontrar registros legados com colunas vazias, deve auto-derivar colunas a partir das linhas salvas ou dos bytes brutos do arquivo.

## Modelagem e Arquitetura de Domínio

- **Paridade do Roteiro Exportado com Romaneios**:
  - *Problema*: Tratar o roteiro exportado como uma entidade segregada ("modo avulso") forçava a criação de componentes e travas duplicadas na UI.
  - *Diretriz*: O payload JSON versionado deve carregar o romaneio completo (ows, outes, vailableCols, meta.at) junto ao plano de paradas (oute). Isso garante 100% de paridade com planilhas .xlsx/.csv sem inventar componentes novos.

## Interface e Contexto

- **Contexto das Tabelas no Sumário**:
  - "Tabela Original" só faz sentido no modo Original (reflete a planilha enviada).
  - "Tabela Simplificada" no modo Meu Roteiro deve refletir a **nova sequência ordenada das paradas planejadas** (1..N).
