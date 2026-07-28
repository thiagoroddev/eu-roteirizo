# Utilidades de back-office

**Nada aqui faz parte do aplicativo.** São scripts e experimentos avulsos, rodados à mão via
`ts-node` quando preciso de apoio pontual: levantar CEPs de uma região, extrair complementos de
endereço, testar a leitura de planilha com `danfojs`. Nenhum deles é importado por `src/`, e
portanto nenhum entra no bundle.

Ficam versionados porque documentam de onde vieram alguns dados do projeto (por exemplo, a lista de
CEPs usada no mapeamento CEP para bairro em [`src/data/`](../src/data/)). Não espere aqui a mesma
cobertura de testes nem os padrões de código do `src/`.

O produto está em [`src/`](../src/), e a apresentação dele no [README da raiz](../README.md).
