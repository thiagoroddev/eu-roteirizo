/\*\*

- README - Estrutura e Boas Práticas do Projeto
-
- Este documento explica a organização do código e as melhorias implementadas
  \*/

# 📁 Estrutura de Pastas

```
src/
├── components/          # Componentes React (apresentação)
├── hooks/              # Hooks customizados (lógica de negócio)
├── utils/              # Funções utilitárias puras
├── types/              # Definições de tipos TypeScript
├── constants/          # Constantes centralizadas
├── pages/              # Páginas da aplicação
├── data/               # Dados estáticos (JSON)
├── assets/             # Imagens e recursos
└── styles/             # Estilos globais
```

## 🎯 Boas Práticas Implementadas

### 1. Separação de Responsabilidades

- **Componentes**: Apenas UI e renderização
- **Hooks**: Lógica de estado e efeitos colaterais
- **Utils**: Funções puras e transformações de dados
- **Constants**: Valores fixos centralizados

### 2. Tipagem Forte com TypeScript

- Todos os hooks têm tipos de retorno explícitos
- Interfaces separadas em arquivos de tipos
- Uso de `const assertions` para arrays imutáveis

### 3. Constantes Centralizadas (`constants/`)

**Antes:**

```tsx
const INSTRUCTIONS = ["texto 1", "texto 2"]; // Espalhado nos componentes
```

**Depois:**

```tsx
import { UPLOAD_INSTRUCTIONS } from "../constants";
```

**Vantagens:**

- ✅ Único lugar para alterar mensagens
- ✅ Evita duplicação de código
- ✅ Facilita internacionalização futura
- ✅ Evita "magic strings"

### 4. Validadores Reutilizáveis (`utils/validators.ts`)

Funções puras que podem ser testadas independentemente:

```tsx
isValidValue(value); // Verifica valores não vazios
isValidNumber(value); // Valida números
normalizeString(text); // Remove acentos
```

### 5. Nomenclatura Descritiva

**Antes:**

```tsx
const [isFullScreen, setIsFullScreen] = useState(false);
```

**Depois:**

```tsx
const [isMapFullScreen, setIsMapFullScreen] = useState(false);
```

Variáveis específicas evitam confusão sobre qual elemento está em tela cheia.

### 6. Tipos de Retorno Explícitos

**Antes:**

```tsx
export function useRouteUploader() { ... }
```

**Depois:**

```tsx
export function useRouteUploader(): RouteUploaderReturn { ... }
```

Benefícios:

- ✅ Melhor autocomplete
- ✅ Erros detectados em tempo de compilação
- ✅ Documentação automática

### 7. Validação Robusta de Arquivos

Agora valida:

- ✅ Extensão do arquivo
- ✅ Tamanho máximo (10MB)
- ✅ Mensagens de erro padronizadas

### 8. SCSS Modules

Estilos encapsulados por componente:

```tsx
import styles from "./Component.module.scss";
<div className={styles.overlay} />;
```

Evita conflitos de nomes de classes CSS.

## 📊 Comparação: Antes vs Depois

| Aspecto      | Antes      | Depois                |
| ------------ | ---------- | --------------------- |
| Constantes   | Espalhadas | Centralizadas         |
| Validações   | Inline     | Funções reutilizáveis |
| Tipagem      | Parcial    | Completa              |
| Mensagens    | Hardcoded  | Constantes            |
| Nomenclatura | Genérica   | Específica            |

## 🔧 Como Manter as Boas Práticas

### Ao adicionar novo componente:

1. Crie arquivo SCSS module se tiver estilos específicos
2. Separe lógica complexa em hooks
3. Use constantes do `constants/` para textos fixos
4. Adicione tipos explícitos

### Ao adicionar nova funcionalidade:

1. Validações vão em `utils/validators.ts`
2. Transformações de dados vão em `utils/`
3. Estado compartilhado vira hook customizado
4. Tipos novos vão em `types/`

### Ao adicionar mensagens:

1. Adicione em `constants/index.ts`
2. Use categoria apropriada (ERRORS, SUCCESS, INFO)
3. Mensagens dinâmicas devem ser funções

## 🎓 Para Estudar Mais

- **React Hooks**: https://react.dev/reference/react
- **TypeScript**: https://www.typescriptlang.org/docs/
- **SCSS Modules**: https://github.com/css-modules/css-modules
- **Clean Code**: Livro de Robert C. Martin

## 🚀 Próximos Passos Sugeridos

1. **Testes Unitários**: Adicionar Jest/Vitest
2. **Documentação**: Adicionar JSDoc nos utils
3. **Performance**: Memoização de cálculos pesados
4. **Acessibilidade**: ARIA labels e navegação por teclado
5. **i18n**: Preparar para múltiplos idiomas
