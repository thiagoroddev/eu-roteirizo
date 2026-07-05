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
    // HOME (TASK-RF-022.2): spoiler de instruções + import de roteiro + avisos de persistência
    INSTRUCTIONS_SUMMARY: "Instruções e exemplo de planilha",
    INSTRUCTIONS_MULTI_TITLE: "Romaneio completo (multi-rota)",
    INSTRUCTIONS_SINGLE_TITLE: "Rota única (exportada do app oficial)",
    IMPORT_JSON: "Importar roteiro (.json)",
    IMPORT_JSON_SOON: "Em breve — importar um roteiro pronto (JSON)",
    MANIFEST_SAVED: "Romaneio salvo neste aparelho.",
    MANIFEST_DUPLICATE: (fileName: string) => `Este arquivo já foi importado como "${fileName}".`,
    MANIFEST_SAVE_ERROR: "Não foi possível salvar o romaneio neste aparelho — será preciso reenviar na próxima vez.",
    MANIFEST_NOT_FOUND: "Romaneio salvo não encontrado neste aparelho — envie o arquivo de novo.",
  },
  ROUTE_SEARCH: {
    PLACEHOLDER: "🔍 Busca por código AT (ex: AT2025...)",
    NOT_FOUND: "🚫 Rota não encontrada.",
  },
  ROUTE_VIEWER: {
    TITLE: "Pré-Rota",
  },
  // App shell (header + bottom nav) — ADR-003 / fluxo §11 (rev. 26/06)
  SHELL: {
    APP_TITLE: "Pré-Rota",
    NAV_ARIA: "Navegação principal",
    NAV_HOME: "Início",
    NAV_ROUTES: "Rotas",
    SETTINGS_ARIA: "Configurações de rota (em breve)",
    BACK_ARIA: "Voltar",
  },
  // Aba Rotas (TASK-RF-022.3): lista de romaneios salvos
  ROUTES_PAGE: {
    TITLE: "Romaneios salvos",
    SEARCH_PLACEHOLDER: "🔍 Filtrar por rota ou código AT",
    EMPTY: "Nenhum romaneio salvo ainda. Envie um na aba Início — ele fica guardado aqui para reabrir sem reenviar.",
    NO_SEARCH_RESULTS: "Nenhum romaneio corresponde ao filtro.",
    KIND_SINGLE: "Romaneio Único",
    KIND_MULTI: "Romaneio Multi",
    IMPORTED_AT: (date: string) => `Importado em ${date}`,
    ROUTE_COUNT: (count: number) => (count === 1 ? "1 rota" : `${count} rotas`),
    CHIP_ARIA: (routeName: string) => `Abrir a rota ${routeName}`,
    CHIP_NO_ROTEIRO_ARIA: "Sem roteiro",
    DELETE_ARIA: (fileName: string) => `Apagar o romaneio ${fileName}`,
    DELETE_TITLE: "Apagar romaneio?",
    DELETE_DESCRIPTION: (fileName: string) => `"${fileName}" será removido deste aparelho. Você pode importá-lo de novo quando quiser.`,
    DELETE_CONFIRM: "Apagar",
    DELETE_CANCEL: "Cancelar",
  },
  ROUTE: {
    // Nome dado à rota quando a planilha não tem a coluna "Corridor Cage"
    // (modo rota única: o próprio entregador envia uma rota só).
    SINGLE_ROUTE_NAME: "Minha rota",
  },
  ROUTE_MAP: {
    CLOSE: "Fechar Mapa",
    FULLSCREEN_ARIA: "Mapa em tela cheia",
    TOOLTIP: {
      SEQUENCE: "Sequência:",
      STOP: "Parada:",
      ADDRESS: "Endereço:",
      NEIGHBORHOOD: "Bairro:",
      ZIPCODE: "CEP:",
      COMMERCIAL: "Horário comercial?",
    },
    // Popup do endereço (modo Original, ADR-008 §10 / fluxo §6 — TASK-RF-020.3).
    POPUP: {
      PACKAGES_HEADER: (count: number) => `Pacotes (${count})`,
      SEQUENCE: "seq",
      ADDRESS: "Endereço:",
      NEIGHBORHOOD: "Bairro:",
      ZIPCODE: "CEP:",
      COMPLEMENT: "Complemento:",
      NO_COMPLEMENT: "—",
      TYPE: "Tipo:",
      GOOGLE_MAPS: "Abrir no Google Maps",
      TYPE_LABELS: {
        COMMERCIAL: "Comercial",
        RESIDENTIAL: "Residencial",
        INDEFINITE: "Indefinido",
      },
    },
  },
  // Mensagens da camada de roteamento local (OSM → grafo). TASK-RF-005.2.
  // Seção "Info Meu Roteiro" do Sumário (RF-43, fluxo §15.1) — totais do Roteiro,
  // separados de propósito dos números do romaneio; preenchida pela RF-007/008.
  ROTEIRO_INFO: {
    TITLE: "Info Meu Roteiro",
    VEHICLE_STOPS: "Paradas de veículo:",
    WALK_POINTS: "Pontos a pé:",
    DISTANCE_VEHICLE: "Distância (veículo):",
    DISTANCE_WALK: "Distância (a pé):",
    DISTANCE_TOTAL: "Distância total:",
    TIME_VEHICLE: "Tempo (veículo):",
    TIME_WALK: "Tempo (a pé):",
    TIME_TOTAL: "Tempo total:",
  },
  ROUTING: {
    OVERPASS_HTTP_ERROR: (status: number) => `O servidor de mapas respondeu com erro (${status}). Tente novamente em instantes.`,
    NETWORK_ERROR: "Não foi possível baixar as ruas do mapa. Verifique sua conexão e tente novamente.",
    TIMEOUT: "O download das ruas demorou demais e foi cancelado. Tente novamente.",
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
    PACKAGES: "Pacotes:",
    STOPS: "Paradas:",
    ESTIMATED_TIME: "Tempo estimado:",
    ESTIMATED_DISTANCE: "Distância estimada:",
    NEIGHBORHOODS: "Bairros:",
    CITY: "Cidade:",
    // "Ver Original" abre o mapa no modo Original (RF-43, rev. 26/06 — antes "Ver no Mapa")
    VIEW_MAP: "Ver Original",
    NO_COORDINATES: "Sem Coordenadas",
    // Botão adaptativo (RF-43): "Criar Roteiro" quando não há; vira "Ver Meu Roteiro" com a RF-006/008
    CREATE_ROTEIRO: "Criar Roteiro",
    CREATE_ROTEIRO_SOON: "Em breve — montar o roteiro manual (Meu roteiro)",
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
    TITLE: (route: string) => `Romaneio Simplificado: ${route}`,
    LOCATION_TYPE_TOOLTIP: "Detectado automaticamente. Pode conter erros.",
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
