// src/constants/uiLabels.ts
// Centralized user-facing labels/messages for all components (Portuguese only)
// To add more languages, create uiLabels.en.ts, uiLabels.es.ts, etc.

export const UI_LABELS = {
  // ========================================
  // COMMON - Valores globais reutilizáveis
  // ========================================
  COMMON: {
    YES: "Sim",
    NO: "Não",
    INDISTINCT: "Indistinto",
    NO_DATA: "Sem dados",
    CLOSE: "Fechar",
  },

  FILE_UPLOADER: {
    PROCESSING: "Processando...",
    UPLOAD: "Enviar romaneio",
    FILE_SELECTED: (fileName: string) => `Arquivo selecionado: ${fileName}`,
    SELECT_FILE: "Selecione um arquivo em formato XLSX ou CSV (UTF-8)",
    INCOMPLETE_SHEET: "Planilha incompleta! Faltando as seguintes colunas opcionais:",
    INSTRUCTIONS: "Instruções:",
    LOADING: "Carregando...",
  },
  ROUTE_SEARCH: {
    PLACEHOLDER: "🔍 Busca por código AT (ex: AT2025...)",
    NOT_FOUND: "🚫 Rota não encontrada.",
  },
  ROUTE_TABLE: {
    TITLE: (route: string) => `Tabela Original : ${route}`,
  },
  ROUTE_SELECTOR: {
    WAITING_FILE: "-- Aguardando arquivo --",
    CHOOSE_ROUTE: (total: number) => `-- Escolha uma das ${total} rotas --`,
  },
  ROUTE_SUMMARY: {
    VEHICLE_TYPE: (type: string) => (type !== "Sem dados" ? ` (${type})` : ""),
    TITLE: (route: string) => `Sumário da rota: ${route}`,
    AT: "AT:",
    HUB: "Hub:",
    DATE_AT: "Data AT:",
    SHIFT: "Turno:",
    COMMERCIAL_TIME: "Horário comercial",
    COMMERCIAL_TIME_TOOLTIP: "Definido por dedução (análise do complemento do endereço), pode conter erros.",
    CORREIOS_NO_ENTRY: "ESEDC:",
    CORREIOS_NO_ENTRY_TOOLTIP: "Endereços sem entrega domiciliar dos Correios.",
    PACKAGES: "Pacotes:",
    STOPS: "Paradas:",
    ESTIMATED_TIME: "Tempo estimado:",
    ESTIMATED_DISTANCE: "Distância estimada:",
    NEIGHBORHOODS: "Bairros:",
    CITY: "Cidade:",
    VIEW_MAP: "Ver no Mapa",
    NO_COORDINATES: "Sem Coordenadas",
    SIMPLE_TABLE: "Tabela Simplificada",
    ORIGINAL_TABLE: "Tabela Original",
  },
  EXAMPLE_TABLE: {
    TITLE: "Exemplo de planilha ideal (dados fictícios)",
  },
  ROUTE_SIMPLE_TABLE: {
    SEQUENCE: "Pacote",
    STOP: "Parada",
    ADDRESS: "Endereço",
    NEIGHBORHOOD: "Bairro",
    ZIPCODE: "CEP",
    LOCATION_TYPE: "Horário Comercial?",
    CORREIOS_DELIVERY: "Correios Entrega?",
    TITLE: (route: string) => `Romaneio Simplificado: ${route}`,
    LOCATION_TYPE_TOOLTIP: "Detectado automaticamente. Pode conter erros.",
    CORREIOS_DELIVERY_TOOLTIP: "Possui entrega domiciliar dos Correios?",
  },
  ERRORS: {
    INVALID_FILE: "Arquivo inválido. Use XLSX ou CSV.",
    FILE_TOO_LARGE: "Arquivo muito grande. Tamanho máximo: 10MB.",
    EMPTY_FILE: "O arquivo parece estar vazio ou não pôde ser lido.",
    PROCESSING_FAILED: "Falha ao processar o arquivo.",
  },
  SUCCESS: {
    ROUTES_FOUND: (count: number) => `${count} rota${count !== 1 ? "s" : ""} identificada${count !== 1 ? "s" : ""}.`,
  },
  INFO: {
    INVALID_DATA: "Dado inválido",
    NO_COORDINATES: "Sem Coordenadas",
    NOT_FOUND: "Não encontrado",
  },
};
