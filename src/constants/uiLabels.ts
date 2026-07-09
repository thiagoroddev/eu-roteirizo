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
    /** Focus screens (Sumário/mapa) append the current route (rev. 07/07). */
    APP_TITLE_WITH_ROUTE: (route: string) => `Pré-Rota · ${route}`,
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
    // Card multi colapsável (TASK-REF-013): rotas escondidas até pedir/filtrar.
    ROUTE_COUNT_FILTERED: (shown: number, total: number) => `${shown} de ${total} rotas`,
    SHOW_ROUTES: (count: number) => `Mostrar rotas (${count})`,
    HIDE_ROUTES: "Esconder rotas",
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
  // Painel inferior persistente do mapa (design doc arvore-componentes-mapa — TASK-RF-023)
  MAP_PANEL: {
    ARIA: "Painel da parada",
    STOP_PREFIX: "Parada",
    NO_STOP: "Sem número de parada",
    MODE_VIEW: "Modo visualização",
    PREV_STOP: "Parada anterior",
    NEXT_STOP: "Próxima parada",
    // Duas visões do painel (rev. 07/07 — TASK-RF-023.7)
    SECTION_STOP: "Resumo da parada",
    SECTION_SELECTED: "Endereço selecionado",
    /** No Meu roteiro o "selecionado" da parada é a parada do veículo (RF-006.4.7). */
    SECTION_SELECTED_ANCHOR: "Endereço selecionado — parada do veículo (âncora)",
    /** 3ª seção do painel do roteiro (RF-006.4.3): preview da parada a criar. */
    SECTION_SUGGESTED: "Parada sugerida",
    VIEW_FULL_LIST: "Ver lista completa",
    HIDE_FULL_LIST: "Esconder lista",
    VIEW_ON_MAP: "Ver no mapa",
    METRIC_ADDRESSES: (count: number) => (count === 1 ? "1 endereço" : `${count} endereços`),
    METRIC_PACKAGES: (count: number) => (count === 1 ? "1 pacote" : `${count} pacotes`),
    /** Package count per inferred type — "Residencial: 2 pacotes" (rev. 07/07). */
    METRIC_TYPED_PACKAGES: (typeLabel: string, count: number) => `${typeLabel}: ${count === 1 ? "1 pacote" : `${count} pacotes`}`,
    // HUD do modo Meu roteiro (RF-32 parcial — TASK-RF-006.2/.4.1): estado do rascunho.
    MODE_ROTEIRO_DRAFT: "Roteiro incompleto — rascunho",
    ROTEIRO_REMAINING: (addresses: number, packages: number) => `Faltando: ${addresses === 1 ? "1 endereço" : `${addresses} endereços`} · ${packages === 1 ? "1 pacote" : `${packages} pacotes`}`,
    ROTEIRO_HINT_START: "A construção começa definindo o ponto inicial da rota.",
    // Linha de estado do rascunho: sempre diz O QUE FAZER agora (feedback 08/07).
    ROTEIRO_STATE_BUILDING: "Toque num endereço no mapa para criar uma parada.",
    ROTEIRO_STATE_COMPLETE: "Todos os endereços atribuídos.",
    // Aviso do endereço livre — vive na seção "Endereço selecionado" (rev. 08/07).
    ROTEIRO_NO_STOP_YET: "Este endereço ainda não pertence a nenhuma parada.",
    /** Ordinal da ordem de visita a pé ("1º", "2º") — só p/ membros de parada (rev. 08/07). */
    ORDINAL: (n: number) => `${n}º`,
    // Parada firmada selecionada (RF-006.4.2 — antecipação parcial da .6, fluxo §9).
    ROTEIRO_STOP: {
      EDIT: "Editar parada",
      DISSOLVE: "Desfazer parada",
    },
    // Seção "Definir ponto inicial" do painel do roteiro (RF-21/22 — TASK-RF-006.3).
    ROTEIRO_START: {
      SECTION: "Definir ponto inicial",
      USE_GPS: "Usar minha localização",
      ARM_MAP_TAP: "Tocar no mapa",
      ARMED_HINT: "Toque no mapa para definir o início.",
      CANCEL: "Cancelar",
      LOCATING: "Obtendo localização…",
      CONFIRM_POINT: (address: string) => `Partir deste endereço: ${address}`,
      CONFIRM: "Confirmar início aqui",
      DEFINED: "Início definido",
      REDEFINE: "Redefinir início",
      // Distância SEMPRE qualificada (a pé / de veículo — feedback 08/07).
      SUGGESTION: (address: string, distance: string) => `Sugestão: ${address} — ${distance} a pé`,
      SUGGESTION_STRAIGHT: "(linha reta)",
    },
    // Ponto livre selecionado (tela 8 — TASK-RF-006.4/.4.1, fluxo §9).
    ROTEIRO_POINT: {
      CREATE_STOP: "Criar parada",
      // O select de destino só aparece ao clicar no botão (rev. 08/07 3ª rodada).
      INCORPORATE_OTHER: "Incorporar em outra parada",
      CONFIRM: "Confirmar",
      CANCEL: "Cancelar",
      TARGET_STOP_ARIA: "Parada de destino",
      // Perna DE VEÍCULO até a âncora sugerida, na linha do rótulo da seção —
      // o ÍCONE de carro qualifica a distância (rev. 08/07 4ª rodada).
      DISTANCE_TO_HERE: (distance: string) => `Distância até aqui: ${distance}`,
      /** Qualificador acessível do ícone de carro (a regra "distância sempre qualificada" vale p/ leitores de tela). */
      VEHICLE_QUALIFIER: "de veículo",
      STOP_OPTION: (order: number, addresses: number) => `Parada ${order} — ${addresses === 1 ? "1 endereço" : `${addresses} endereços`}`,
      FAR_FROM_STOP: "Este endereço fica longe da âncora da parada escolhida. Pode incorporar mesmo assim — só confira a caminhada.",
    },
    // Edição de parada (tela 9 — TASK-RF-006.4/.4.1, fluxo §4/§8).
    MODE_DRAFT: "Edição de parada",
    ROTEIRO_DRAFT: {
      TITLE: (n: number) => `Parada ${n} (rascunho)`,
      // O toque no mapa NÃO adiciona/remove mais (RF-006.4.9): raio + lista ±.
      TAP_HINT: "Ajuste o raio ou use os botões +/− da lista para escolher os endereços.",
      ESTIMATE: (minutes: number, distance: string) => `~${minutes} min · ${distance} a pé`,
      /** Circuito irrisório (< 20 m): mostrar metros minaria a confiança. */
      ESTIMATE_TIME_ONLY: (minutes: number) => `~${minutes} min a pé`,
      BANNER_CANDIDATES: (n: number) => (n === 0 ? "Nenhum candidato no raio" : n === 1 ? "O raio engloba 1 candidato" : `O raio engloba ${n} candidatos`),
      RADIUS_LABEL: "Raio de agrupamento",
      RADIUS_VALUE: (m: number) => `${m} m`,
      RADIUS_DECREASE: "Diminuir raio",
      RADIUS_INCREASE: "Aumentar raio",
      SECTION_CHOSEN: "Endereços da parada",
      SECTION_CANDIDATES: "Candidatos no raio",
      ADD: "Adicionar",
      REMOVE: "Remover",
      ADD_POINT: (address: string) => `Adicionar ${address}`,
      REMOVE_POINT: (address: string) => `Remover ${address}`,
      FAR_WARNING: "Há endereço escolhido longe da âncora — a caminhada desta parada pode ser maior.",
      EMPTY_HINT: "Escolha ao menos um endereço para salvar a parada.",
      SAVE: "Salvar parada",
      CANCEL: "Cancelar",
    },
    // Lista de endereços da parada (StopItemList — TASK-RF-023.4, RF-27/28)
    ITEM: {
      LIST_ARIA: "Endereços da parada",
      NO_ITEMS: "Nenhum endereço com coordenada válida nesta parada.",
      // Espelha a etiqueta física do pacote: "Ordem xx | Parada xx" (rev. 07/07).
      PACKAGE_LABEL: (stop: string | null, seq: string) => (stop !== null ? `Ordem ${seq} | Parada ${stop}` : `Ordem ${seq}`),
    },
  },
  // Toggle de modos do mapa (fluxo §11 "Modos do mapa" — TASK-RF-022.5)
  MAP_MODE: {
    ARIA: "Modo do mapa",
    ORIGINAL: "Original",
    MY_ROTEIRO: "Meu roteiro",
    // Only shown while the side is disabled — since TASK-RF-006.2 that means "no plottable points".
    MY_ROTEIRO_SOON: "Indisponível — nenhum endereço com coordenada válida",
  },
  ROUTE_MAP: {
    FULLSCREEN_ARIA: "Mapa em tela cheia",
    TOOLTIP: {
      SEQUENCE: "Sequência:",
      STOP: "Parada:",
      ADDRESS: "Endereço:",
      NEIGHBORHOOD: "Bairro:",
      ZIPCODE: "CEP:",
      COMMERCIAL: "Horário comercial?",
      // Tooltip dos pontos livres do modo Meu roteiro (TASK-RF-006.2).
      PACKAGES: "Pacotes:",
    },
    // Textos do detalhe do endereço, hoje renderizado pelo painel do mapa
    // (StopItemDetail — RF-023.4; o componente AddressSheet foi aposentado na REF-011).
    ADDRESS_SHEET: {
      PACKAGES_HEADER: (count: number) => `Informações do pacote (${count})`,
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
    // Status discreto do grafo no painel do roteiro (TASK-RF-006.3).
    LOADING_STREETS: "Carregando ruas…",
    RETRY: "Tentar de novo",
    // Erros do GPS ao definir o ponto inicial (RF-21) — a saída é sempre o toque no mapa.
    GPS_DENIED: 'Permissão de localização negada. Use "Tocar no mapa".',
    GPS_TIMEOUT: 'Não foi possível obter sua localização a tempo. Use "Tocar no mapa".',
    GPS_UNAVAILABLE: 'Localização indisponível neste aparelho. Use "Tocar no mapa".',
    GPS_OUT_OF_BOUNDS: 'Sua localização está fora da área do mapa. Use "Tocar no mapa".',
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
    // Botão adaptativo (RF-43): "Criar Roteiro" abre o mapa em Meu roteiro (TASK-RF-006.2);
    // vira "Ver Meu Roteiro" quando a rota já tiver roteiro salvo (RF-008).
    CREATE_ROTEIRO: "Criar Roteiro",
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
