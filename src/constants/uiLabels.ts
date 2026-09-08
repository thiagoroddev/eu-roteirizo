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
    // Romaneio de exemplo embutido (TASK-RF-014): quem chega pelo link não tem planilha.
    TRY_EXAMPLE: "Testar com romaneio de exemplo",
    TRY_EXAMPLE_HINT: "20 entregas fictícias em Copacabana e Ipanema — não precisa de arquivo",
    IMPORT_JSON: "Importar roteiro (.json)",
    IMPORT_JSON_SOON: "Em breve — importar um roteiro pronto (JSON)",
    EXPORT_JSON: "Exportar roteiro (.json)",
    EXPORT_JSON_SUCCESS: "Roteiro exportado com sucesso.",
    IMPORT_JSON_SUCCESS: "Roteiro importado com sucesso.",
    IMPORT_JSON_ERROR: "Falha ao importar o arquivo de roteiro.",
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
    TITLE: "Eu Roteirizo",
  },
  // App shell (header + bottom nav) — ADR-003 / fluxo §11 (rev. 26/06)
  SHELL: {
    APP_TITLE: "Eu Roteirizo",
    /** Focus screens (Sumário/mapa) append the current route (rev. 07/07). */
    APP_TITLE_WITH_ROUTE: (route: string) => `Eu Roteirizo · ${route}`,
    NAV_ARIA: "Navegação principal",
    NAV_HOME: "Início",
    NAV_ROUTES: "Rotas",
    SETTINGS_ARIA: "Configurações de entrega",
    BACK_ARIA: "Voltar",
  },
  // Config global de tempo de entrega (RF-007.2) — editada no ⚙️, vale p/ todas as rotas.
  DELIVERY_SETTINGS: {
    TITLE: "Configurações de entrega",
    DESCRIPTION: "Tempo estimado por entrega. Vale para todas as rotas.",
    BASE_LABEL: "Tempo de entrega (1 pacote)",
    PER_PACKAGE_LABEL: "Adicional por pacote extra",
    MINUTES: "minutos",
    SECONDS: "segundos",
    SAVE: "Salvar",
    CANCEL: "Cancelar",
  },
  // Diagnóstico da malha viária (TASK-CHORE-006, ADR-010): números das últimas
  // cargas de ruas, legíveis no aparelho (o smoke roda em build de produção).
  GRAPH_DIAGNOSTICS: {
    TITLE: "Diagnóstico da malha (últimas cargas)",
    EMPTY: "Nenhuma carga de ruas registrada ainda neste aparelho.",
    HINT: "A duração sozinha não identifica a causa. Consulte o erro e as tentativas; dados ausentes não foram medidos.",
    CAUSE_UNKNOWN: "Causa não registrada (histórico antigo).",
    ATTEMPT: "Tentativa",
    CACHE_STATE: "Leitura do cache",
    CACHE_WRITE: "Gravação do cache",
    HEADERS: "Até resposta",
    BODY: "Leitura",
    TOTAL: "Total",
    BYTES: "Bytes recebidos",
    NOT_MEASURED: "não medido",
    CATEGORIES: {
      ok: "sucesso",
      http: "erro HTTP",
      timeout: "tempo excedido",
      network: "falha de rede (causa não informada pelo navegador)",
      "invalid-response": "resposta inválida",
      overpass: "erro informado pelo serviço",
      cancelled: "cancelado",
    },
    CACHE_STATES: { hit: "encontrado", miss: "ausente", expired: "expirado", "read-error": "falha de leitura", stored: "salvo", "write-error": "falha ao salvar", "not-needed": "não necessária" },
    CLEAR: "Limpar histórico",
    /** Apaga o cache de ruas para que a próxima abertura de mapa force uma carga de REDE. */
    CLEAR_CACHE: "Limpar cache de ruas (forçar nova carga)",
    CACHE_CLEARED: "Cache apagado. Abra um mapa: a próxima carga virá da rede.",
    /**
     * Uma linha de amostra, com detalhe proporcional ao que existe:
     * - rede:  "rede · 4,2 km² · 3,4 s (rede 3,1 s) · 820 KB · 4.512 nós"
     * - cache: "cache · 4,2 km² · 0,1 s · 4.512 nós"
     * - erro:  "erro · 4,2 km² · 30 s"
     */
    SAMPLE: (s: { source: string; bboxKm2: number; totalMs: number; networkMs: number | null; responseKb: number | null; nodes: number }) => {
      const seconds = (ms: number) => `${(ms / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} s`;
      const head = `${s.source} · ${s.bboxKm2.toLocaleString("pt-BR")} km²`;
      if (s.source === "erro") return `${head} · ${seconds(s.totalMs)}`;
      const nodes = `${s.nodes.toLocaleString("pt-BR")} nós`;
      if (s.source === "cache") return `${head} · ${seconds(s.totalMs)} · ${nodes}`;
      return `${head} · ${seconds(s.totalMs)} (rede ${s.networkMs === null ? "não medido" : seconds(s.networkMs)}) · ${s.responseKb === null ? "não medido" : s.responseKb.toLocaleString("pt-BR")} KB · ${nodes}`;
    },
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
    IGNORE_ADDRESS: "Ignorar endereço",
    UNIGNORE_ADDRESS: "Restaurar endereço",
    IGNORED_BADGE: "Ignorado",
    SECTION_IGNORED: (count: number) => `Endereços ignorados (${count})`,
    /** Badge da "parada do veículo" (RF-006.15): no lugar do complemento na row.
        A âncora que COINCIDE com um endereço de entrega mostra o ordinal + este
        badge (tocável, pacotes); a distinta mostra o glifo do carro + o badge.
        A informação "é parada do veículo" vive no endereço, não no rótulo da
        seção (que voltou a ser só "Endereço selecionado"). */
    VEHICLE_STOP_BADGE: "Parada do veículo",
    /** Rótulo da row do veículo quando não há nome de via (grafo não carregado
        ou rua sem nome no OSM) — RF-006.9. O link "Como chegar" ainda funciona. */
    VEHICLE_STOP_STREET_FALLBACK: "Ponto na rua",
    /** Rótulo da perna a pé entre endereços no gutter (RF-006.10): "110 metros"
        (por extenso; o ícone de caminhada acompanha, decisão smoke 18/07). */
    LEG_METERS: (meters: number) => `${meters} metros`,
    /** aria-label do conector de perna (leitor de tela). */
    LEG_ARIA: "Distância a pé até o próximo endereço",
    /** Aviso flutuante (RF-006.17): mover o veículo no mapa recalcula a ordem a
        pé (1º = mais próximo) — o toast avisa que os endereços foram reordenados. */
    REORDERED_NOTICE: "Endereços reordenados",
    /** 3ª seção do painel do roteiro (RF-006.4.3): preview da parada a criar. */
    // "Prévia", não "sugerida" (feedback 10/07): a seção mostra a parada COMO
    // FICARIA a partir do endereço que o usuário tocou — qualquer endereço
    // tocado vira a prévia; "sugerida" prometia uma escolha do app.
    SECTION_SUGGESTED: "Prévia de parada",
    VIEW_FULL_LIST: "Ver parada", // rev. 15/07 (era "Ver lista completa")
    HIDE_FULL_LIST: "Esconder lista",
    VIEW_ON_MAP: "Ver no mapa",
    METRIC_ADDRESSES: (count: number) => (count === 1 ? "1 endereço" : `${count} endereços`),
    METRIC_PACKAGES: (count: number) => (count === 1 ? "1 pacote" : `${count} pacotes`),
    /** Package count per inferred type — "Residencial: 2 pacotes" (rev. 07/07). */
    METRIC_TYPED_PACKAGES: (typeLabel: string, count: number) => `${typeLabel}: ${count === 1 ? "1 pacote" : `${count} pacotes`}`,
    // HUD do modo Meu roteiro (RF-32 parcial — TASK-RF-006.2/.4.1): estado do rascunho.
    MODE_ROTEIRO_DRAFT: "Roteiro incompleto — rascunho",
    ROTEIRO_HINT_START: "A construção começa definindo o ponto inicial da rota.",
    // Visão geral do roteiro (painel ocioso + "Ver detalhes" — TASK-RF-006.8).
    // O antigo HUD "Faltando: X · Y" migrou para os stat-cards (como feito/total).
    ROTEIRO_OVERVIEW: {
      SECTION_PROGRESS: "Roteiro em construção",
      /** "N paradas confirmadas" (RF-006.20 — contagem no próprio label). */
      SECTION_CONFIRMED: (count: number) => `${count} ${count === 1 ? "parada confirmada" : "paradas confirmadas"}`,
      // "Próxima parada sugerida" (renomeada 15/07): a sugestão é do ALGORITMO
      // (não escolha do usuário) e o card a distingue de parada confirmada.
      SECTION_NEXT: "Próxima parada sugerida",
      VIEW_DETAILS: "Ver detalhes",
      HIDE_DETAILS: "Esconder detalhes",
      EXPORT_ROUTE: "Exportar roteiro (.json)",
      EXPORT_ROUTE_ARIA: "Exportar roteiro em arquivo JSON",
      STAT_ADDRESSES: "Endereços",
      STAT_PACKAGES: "Pacotes",
      STAT_STOPS: "Paradas",
      /** "29/76" — atribuídos/total. */
      STAT_COUNT: (done: number, total: number) => `${done}/${total}`,
      /** A barra escolhe UMA base: endereços (decisão 09/07). */
      PERCENT: (ratio: number) => `${Math.round(ratio * 100)}%`,
      PROGRESS_ARIA: "Progresso do roteiro (endereços atribuídos)",
      NO_STOPS: "Nenhuma parada confirmada ainda.",
      STOP_ARIA: (order: number) => `Parada ${order} — ver endereços`,
      MOVE_UP: "Mover para cima",
      MOVE_DOWN: "Mover para baixo",
      MOVE_UP_ARIA: (order: number) => `Mover Parada ${order} para cima`,
      MOVE_DOWN_ARIA: (order: number) => `Mover Parada ${order} para baixo`,
      // Cards de somatória (RF-006.20): Duração e Distância abrem um popup de
      // decomposição ("Detalhes"); Comercial é só contagem, sem popup.
      CARD_DURATION: "Duração total",
      CARD_DISTANCE: "Distância total",
      CARD_COMMERCIAL: "Comercial",
      DETAILS_BUTTON: "Detalhes",
      /** Popup da Duração — decomposição dos três tempos (RF-007.1). */
      DURATION_DIALOG_TITLE: "Duração total",
      DURATION_VEHICLE: "Viagem no veículo",
      DURATION_WALK: "Caminhadas",
      DURATION_DELIVERY: "Entregas",
      /** Popup da Distância — veículo vs a pé. */
      DISTANCE_DIALOG_TITLE: "Distância total",
      DISTANCE_VEHICLE: "Distância no veículo",
      DISTANCE_WALK: "Distância a pé",
      /** Qualificação honesta: sem grafo (raro, durante o carregamento) as pernas
          de veículo são em linha reta; RF-007 torna as velocidades configuráveis. */
      TOTALS_NOTE: "Estimativas — veículo em linha reta.",
      /** Com o grafo carregado (RF-006.7): distâncias medidas pelas ruas. */
      TOTALS_NOTE_STREETS: "Estimativas — distâncias pelas ruas.",
      // Início como "parada 0" (RF-006.11): só nos detalhes + seleção no mapa.
      SECTION_START: "Ponto inicial da rota",
      /** Ícone que marca o endereço que É o início (fluxo "Partir deste endereço"). */
      START_BADGE_ARIA: "Ponto inicial da rota",
      RESET_ROUTE: "Recomeçar",
      RESET_ROUTE_ARIA: "Recomeçar construção do roteiro e apagar todas as paradas",
      RESET_ROUTE_DIALOG_TITLE: "Recomeçar roteiro?",
      RESET_ROUTE_DIALOG_DESC: "Todas as paradas criadas serão apagadas do rascunho. O ponto de partida será mantido.",
      RESET_ROUTE_CONFIRM: "Sim, recomeçar",
      RESET_ROUTE_CANCEL: "Cancelar",
    },
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
      /** Atalho na row da parada do veículo (RF-006.18): reabre a parada como
          rascunho (mesmo destino do "Editar parada"), já pronto p/ mover o carro. */
      EDIT_VEHICLE: "Editar local do veículo",
      /** Link da row do veículo (RF-006.9): abre direções até a COORDENADA da
          âncora — "como chegar lá" mesmo sem endereço; funciona sem grafo. */
      NAVIGATE: "Como chegar",
      DISSOLVE: "Deletar parada",
      // Gestos da âncora — SÓ no modo edição (TASK-RF-006.15 reverteu a .5:
      // a parada firmada é read-only; editar âncora = reabrir como rascunho).
      MOVE_ANCHOR_HINT: "Arraste o carro no mapa para mover a parada do veículo.",
      /** Só aparece com a âncora FORA do padrão (RF-006.6) — resetar o que já
          está no lugar não faz sentido. */
      RESET_ANCHOR: "Resetar local do veículo",
      MAKE_ANCHOR: "Tornar âncora",
      /** Sentido do circuito a pé (RF-006.6): a ordem nunca é manual — sai da
          âncora (início/fim) e deste sentido. */
      REVERSE_ORDER: "Inverter ordem",
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
      // Redefinir virou DOIS gestos (TASK-RF-006.14 — o antigo "Redefinir" só
      // rearmava e mantinha o carro, confundindo com "apagar").
      DELETE_START: "Apagar início",
      REPOSITION_START: "Mudar posição do início",
      // Distância SEMPRE qualificada (a pé / de veículo — feedback 08/07).
      SUGGESTION: (address: string, distance: string) => `Sugestão: ${address} — ${distance} a pé`,
      SUGGESTION_STRAIGHT: "(linha reta)",
    },
    // Ponto livre selecionado (tela 8 — TASK-RF-006.4/.4.1, fluxo §9).
    ROTEIRO_POINT: {
      CREATE_STOP: "Criar parada",
      INSERT_POSITION_LABEL: "Posição da parada",
      INSERT_POSITION_OPTION: (order: number, isLast: boolean) => (order === 1 ? "1 — No início" : isLast ? `${order} — Ao final` : `${order} — Após Parada ${order - 1}`),
      // O destino é escolhido num POPUP aberto pelo botão (rev. 15/07 — era select inline).
      INCORPORATE_OTHER: "Incorporar em outra parada",
      INCORPORATE_HINT: "Escolha a parada que receberá este endereço.",
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
      // Tocar um endereço livre durante a edição SELECIONA; este CTA é o que edita (RF-006.4.23).
      ADD_TO_STOP: "Adicionar a esta parada",
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
    ORIGINAL_DISABLED_STANDALONE: "Modo Original indisponível em roteiro importado sem romaneio",
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
    TIME_DELIVERY: "Tempo (entregas):",
    TIME_TOTAL: "Tempo total:",
    // Redesenho (TASK-REF-017): rótulos de CARD (sem dois-pontos) + barra de fluxo.
    // Os 4 cards (REF-017, smoke 19/07): mesmo vocabulário do painel do mapa
    // (Endereços/Pacotes/Paradas) + Comercial. Totais de tempo/distância NÃO são
    // cards — as barras de fluxo já dão total e composição.
    CARD_ADDRESSES: "Endereços",
    CARD_PACKAGES: "Pacotes",
    CARD_STOPS: "Paradas",
    /** Pacotes com horário comercial dentro do roteiro (mesma métrica do painel). */
    CARD_COMMERCIAL: "Comercial",
    /** Barras de fluxo: "de que é feito este total". Tempo tem 3 segmentos
        (RF-007.1); distância tem 2 (não há distância "de entrega"). */
    FLOW_TITLE: "Fluxo de tempo estimado",
    FLOW_DISTANCE_TITLE: "Fluxo de distância",
    FLOW_TOTAL: (total: string) => `Total: ${total}`,
    FLOW_VEHICLE: "Veículo",
    FLOW_WALK: "A pé",
    FLOW_DELIVERY: "Entregas",
    /** Valor ausente/zero num card de distância ou tempo (evita "0 km" que parece bug). */
    EMPTY_VALUE: "—",
    /** Estado sem roteiro (o toggle fica desabilitado; a seção não é alcançável). */
    NO_ROTEIRO: "Nenhum roteiro criado para esta rota ainda.",
    // Estado do roteiro no topo do Sumário (REF-017, textos do humano 19/07).
    // ⚠️ O percentual de EXECUÇÃO depende da RF-009 (nada registra entrega
    // concluída ainda), então hoje um roteiro completo lê "0% concluído".
    STATUS_BUILDING: "Roteiro em construção (rascunho incompleto)",
    STATUS_EXECUTING: (percent: number) => `Roteiro em execução — ${percent}% concluído`,
    STATUS_FINISHED: "Roteiro finalizado — 100%",
    /** Cobertura do rascunho: "7 de 78 endereços". */
    STATUS_COVERAGE: (done: number, total: number) => `${done} de ${total} endereços`,
    STATUS_NONE: "Sem roteiro",
  },
  ROUTING: {
    OVERPASS_HTTP_ERROR: (status: number) =>
      status === 429
        ? "O serviço de ruas atingiu o limite de consultas (429). Aguarde pelo menos 30 segundos antes de tentar novamente."
        : `O servidor de mapas respondeu com erro (${status}). Tente novamente em instantes.`,
    NETWORK_ERROR: "Não foi possível baixar as ruas do mapa. Verifique sua conexão e tente novamente.",
    NO_STREETS: "Nenhuma rua disponível para calcular percursos nesta área.",
    INVALID_RESPONSE: "O serviço de ruas retornou uma resposta inválida. Tente novamente.",
    OVERPASS_ERROR: "O serviço não conseguiu preparar as ruas desta área. Tente novamente em instantes.",
    CANCELLED: "Carregamento das ruas cancelado.",
    APPROXIMATE_PATH: "Ruas indisponíveis: as linhas são aproximações e não representam caminhos pelas ruas.",
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
    /** Tipo de veículo planejado — virou linha das "Informações gerais" (REF-017). */
    VEHICLE: "Veículo:",
    // "Ver Original" abre o mapa no modo Original (RF-43, rev. 26/06 — antes "Ver no Mapa")
    VIEW_MAP: "Ver Original",
    NO_COORDINATES: "Sem Coordenadas",
    // Botão adaptativo (RF-43): "Criar Roteiro" abre o mapa em Meu roteiro (TASK-RF-006.2);
    // vira "Ver Meu Roteiro" quando a rota já tiver roteiro salvo (RF-008).
    CREATE_ROTEIRO: "Criar Roteiro",
    // RF-008: com roteiro salvo, o mesmo botão passa a REABRIR em vez de criar.
    VIEW_ROTEIRO: "Ver Meu Roteiro",
    SIMPLE_TABLE: "Tabela Simplificada",
    ROTEIRO_TABLE: "Tabela Meu Roteiro",
    ORIGINAL_TABLE: "Tabela Original",
    // Redesenho do Sumário (TASK-REF-017): as duas seções viram um toggle e o
    // botão do mapa passa a SEGUIR o toggle (um só, contextual).
    SECTION_ORIGINAL: "Info Original",
    SECTION_ROTEIRO: "Info Meu Roteiro",
    TOGGLE_ARIA: "Seção do sumário",
    /** Hint do segmento desabilitado: a rota ainda não tem roteiro. */
    NO_ROTEIRO_YET: "Esta rota ainda não tem roteiro. Use “Criar Roteiro”.",
    VIEW_ON_MAP: "Ver no Mapa",
    /** Cabeçalho do bloco de dados textuais do Original (AT, Data, Bairros…). */
    GENERAL_INFO: "Informações gerais",
    // Rótulos de CARD (sem dois-pontos — os antigos acima seguem para o bloco de linhas).
    CARD_PACKAGES: "Pacotes",
    CARD_STOPS: "Paradas",
    CARD_COMMERCIAL: "Comercial",
    CARD_ESTIMATED_TIME: "Tempo estimado",
    CARD_ESTIMATED_DISTANCE: "Distância estimada",
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
    /** Example manifest could not be fetched — offline on a first visit, or missing from the build (RF-014). */
    EXAMPLE_UNAVAILABLE: "Não foi possível carregar o romaneio de exemplo. Verifique sua conexão e tente de novo.",
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
