// Este arquivo não é mais usado, mas foi mantido como referência.

// ============================================================================
// Importações
// ============================================================================
// React hooks:
// - useState: Para guardar "memória" (estado) que atualiza a tela quando muda.
// - useCallback: Para memorizar funções e evitar recriá-las sem necessidade.
// - useRef: Para guardar valores que não atualizam a tela ou acessar elementos HTML diretamente.
// - useEffect: Para "efeitos colaterais" (coisas que acontecem após a tela desenhar),
//   como carregar um mapa ou monitorar mudanças de variáveis.
import { useState, useCallback, useRef, useEffect } from "react";

// Danfo.js: Uma biblioteca poderosa (tipo Pandas do Python) para ler e manipular
// planilhas (Excel/CSV) direto no navegador.
import * as dfd from "danfojs";

// Leaflet: Biblioteca para criar mapas interativos.
import L from "leaflet";
import "leaflet/dist/leaflet.css"; // Importa o CSS padrão do mapa para ele renderizar corretamente.

// Bootstrap: Framework CSS para deixar os botões, tabelas e inputs bonitos sem muito esforço.
import "bootstrap/dist/css/bootstrap.min.css";

// ============================================================================
// Configuração Global do Leaflet
// ============================================================================
// O Leaflet tem um problema conhecido com ferramentas modernas de build (como Vite/Webpack):
// ele não consegue achar as imagens dos marcadores (pinos) sozinho.
// As linhas abaixo "consertam" isso manualmente, apontando para a pasta 'public/images'.
// O comando 'delete' remove a tentativa automática falha do Leaflet.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  // Certifique-se de ter estes arquivos dentro da pasta 'public/images' do seu projeto.
  iconRetinaUrl: "/images/marker-icon.png",
  iconUrl: "/images/marker-icon.png",
  shadowUrl: "/images/marker-shadow.png",
});

// Interface genérica para dizer ao TypeScript que um objeto pode ter qualquer chave (string)
// e qualquer valor. Útil quando não sabemos exatamente todas as colunas do Excel.
interface RowData {
  [key: string]: unknown;
}

// Tipo para o nosso "Banco de Dados" local:
// Um objeto onde a Chave é o nome da rota (ex: "A-1") e o Valor é uma lista de linhas (RowData).
type RoutesMap = Record<string, RowData[]>;

function DanfoTest() {
  // ============================================================================
  // Estados (Memória do Componente)
  // ============================================================================

  // `routes`: Aqui guardamos os dados processados.
  // Estrutura: { "Rota A": [dado1, dado2], "Rota B": [dado3] }
  const [routes, setRoutes] = useState<RoutesMap | null>(null);

  // `loading`: Controle visual. Se for true, mostramos um spinner de "Carregando...".
  const [loading, setLoading] = useState(false);

  // `error`: Se algo der errado (arquivo inválido, etc), guardamos a mensagem aqui.
  const [error, setError] = useState<string | null>(null);

  // `selectedRoute`: Guarda qual rota o usuário escolheu no <select> (dropdown).
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  // `isFullScreen`: Estado booleano (true/false) para alternar entre ver a tabela
  // ou ver o mapa cobrindo a tela toda.
  const [isFullScreen, setIsFullScreen] = useState(false);

  // `mapRef`: Referência direta (ponteiro) para a <div> do mapa.
  // O Leaflet não é React "puro", ele precisa mexer no DOM real, por isso usamos ref.
  const mapRef = useRef<HTMLDivElement>(null);

  // `notification`: Mensagem flutuante (toast) que aparece brevemente no topo.
  const [notification, setNotification] = useState<string | null>(null);

  // Estados para o campo de busca (Pesquisar por AT):
  const [searchAT, setSearchAT] = useState<string>(""); // O que o usuário digitou.
  const [searchResult, setSearchResult] = useState<string | null>(null); // O resultado da busca.

  // `plannedAtToRoute`: Um índice para busca rápida.
  // Em vez de varrer todas as rotas toda vez que buscamos, criamos um "mapa" de:
  // "Código AT" -> "Nome da Rota". Usamos useRef pois não precisamos renderizar nada se isso mudar.
  const plannedAtToRoute = useRef<Record<string, string>>({});

  // Controles de colunas: Para saber quais colunas vieram no Excel e quais faltaram.
  const [availableCols, setAvailableCols] = useState<string[] | null>(null);
  const [missingCols, setMissingCols] = useState<string[]>([]);

  // ============================================================================
  // Função de Upload (Processamento do Arquivo)
  // ============================================================================
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    // Pega o primeiro arquivo selecionado pelo usuário
    const file = e.target.files?.[0];
    if (!file) return;

    // Validação simples usando Regex: verifica se termina em .xlsx ou .csv (ignorando maiúsculas/minúsculas)
    if (!/\.(xlsx|csv)$/i.test(file.name)) {
      setError("Arquivo inválido. Envie um .xlsx ou .csv");
      return;
    }

    // Limpeza inicial: reseta erros e dados antigos antes de começar o novo trabalho.
    setError(null);
    setLoading(true);
    setRoutes(null);
    setSelectedRoute(null);
    setIsFullScreen(false);

    try {
      // 1. Leitura: Danfo.js lê o arquivo binário e transforma em um DataFrame (tabela na memória).
      // O 'await' pausa o código aqui até o arquivo terminar de ser lido.
      const df = (await dfd.readExcel(file)) as dfd.DataFrame;

      // 2. Identificação de Colunas: Pega os cabeçalhos da primeira linha.
      const colNames: string[] = df.columns as string[];

      // Lista de colunas que "gostaríamos" de ter para o sistema funcionar 100%.
      const exampleCols = [
        "Sequence",
        "Stop",
        "Num of Order",
        "Total Distance",
        "Zipcode",
        "Destination Address",
        "City",
        "Neighborhood",
        "Latitude",
        "Longitude",
        "Delivery Time",
        "Location Type",
        "Planned AT",
        "Corridor Cage",
      ];

      // Calcula quais colunas existem e quais estão faltando.
      setAvailableCols(colNames);
      setMissingCols(exampleCols.filter((c) => !colNames.includes(c)));

      // 3. Verificação Crítica: A coluna 'Corridor Cage' é essencial para agrupar as rotas.
      const corridorKey = "Corridor Cage";
      const hasCorridor = colNames.includes(corridorKey);
      if (!hasCorridor) {
        setError(`Coluna '${corridorKey}' não encontrada na planilha.`);
        setRoutes(null);
        return; // Para tudo se não tiver essa coluna.
      }

      // 4. Conversão: Transforma o DataFrame (formato do Danfo) em JSON (array de objetos JavaScript).
      // df.values é uma matriz (array de arrays). Mapeamos isso para objetos { coluna: valor }.
      const values = df.values as unknown[][];
      const jsonData = values.map((row) => {
        const obj: RowData = {};
        colNames.forEach((col, i) => (obj[col] = row[i]));
        return obj;
      });

      // 5. Agrupamento (A Mágica): Transforma a lista plana em grupos.
      // Usamos .reduce para acumular os itens em um objeto baseados na chave 'Corridor Cage'.
      const grouped = jsonData.reduce<RoutesMap>((acc, row) => {
        const raw = row[corridorKey];
        // Se a célula estiver vazia, jogamos numa categoria "SEM ROTA".
        const route = (typeof raw === "string" && raw.trim()) || "SEM ROTA";

        // Se a chave ainda não existe no acumulador, cria um array vazio.
        if (!acc[route]) acc[route] = [];

        // Adiciona a linha atual ao grupo correto.
        acc[route].push(row);
        return acc;
      }, {});

      // 6. Finalização: Salva o resultado no estado. O React vai perceber a mudança e atualizar a tela.
      setRoutes(grouped);
    } catch (err: unknown) {
      console.error("Erro ao ler planilha:", err);
      setError("Falha ao processar o arquivo. Verifique se o formato está correto.");
    } finally {
      // O 'finally' roda sempre, dando sucesso ou erro. Aqui desligamos o spinner.
      setLoading(false);
    }
  }, []);

  // ============================================================================
  // Efeito: Renderização do Mapa
  // ============================================================================
  // Este useEffect roda toda vez que o usuário abre o fullscreen ou muda a rota selecionada.
  useEffect(() => {
    // Só tenta desenhar o mapa se estivermos em fullscreen, tivermos o elemento HTML (ref) e dados válidos.
    if (isFullScreen && mapRef.current && selectedRoute && routes && routes[selectedRoute]) {
      // Filtro de Segurança: Só queremos pontos que tenham Latitude E Longitude.
      const validRows = routes[selectedRoute].filter((row) => row["Latitude"] && row["Longitude"]);
      if (validRows.length === 0) return;

      // Inicialização do Leaflet: Cria o mapa dentro da div referenciada por mapRef.
      const map = L.map(mapRef.current).setView([0, 0], 2);

      // Adiciona os "tiles" (as imagens do mapa, ruas, etc) do OpenStreetMap.
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      const latlngs: L.LatLng[] = [];

      // Loop para criar os marcadores (pinos) no mapa.
      validRows.forEach((row) => {
        // Limpeza de Dados:
        // 1. Remove pontos de milhar (ex: "1.234" vira "1234").
        // 2. O dataset parece usar coordenadas inteiras (micrograus), então dividimos por 10 milhões
        //    para voltar ao formato decimal padrão de GPS (ex: -229026394 -> -22.9026394).
        const cleanLat = String(row["Latitude"]).replace(/\./g, "");
        const cleanLng = String(row["Longitude"]).replace(/\./g, "");
        const lat = parseFloat(cleanLat) / 10000000;
        const lng = parseFloat(cleanLng) / 10000000;

        // Se converteu para número válido, adiciona ao mapa.
        if (!isNaN(lat) && !isNaN(lng)) {
          const latlng = L.latLng(lat, lng);
          latlngs.push(latlng);

          // Criação do Marcador e do Popup (balão de info).
          const marker = L.marker(latlng).addTo(map);

          // Função auxiliar para pegar valor ou mostrar '-' se não existir.
          const getField = (key: string) => (availableCols && availableCols.includes(key) ? String(row[key] ?? "") || "-" : "Não enviado");

          // Extração segura dos dados para o popup HTML.
          const endereco = getField("Destination Address");
          const bairro = getField("Neighborhood");
          const cidade = getField("City");
          const cep = getField("Zipcode");
          const locTypeRaw = availableCols && availableCols.includes("Location Type") ? String(row["Location Type"] ?? "") : null;
          const gaiola = getField("Corridor Cage");

          // Lógica para deixar o tipo de local mais legível (Office vira 'Sim' para comércio).
          let comercioDisplay = "Não enviado";
          if (locTypeRaw === null) comercioDisplay = "Não enviado";
          else {
            const lt = String(locTypeRaw).toLowerCase();
            comercioDisplay = "Indefinido";
            if (lt === "office") comercioDisplay = "Sim";
            else if (lt === "home") comercioDisplay = "Não";
          }

          const seq = availableCols && availableCols.includes("Sequence") ? String(row["Sequence"] ?? "") : "Não enviado";
          const stopV = availableCols && availableCols.includes("Stop") ? String(row["Stop"] ?? "") : "Não enviado";

          // Montagem do HTML interno do popup.
          const popupContent = [
            `<div><strong>Endereço:</strong> ${endereco}</div>`,
            `<div><strong>Bairro:</strong> ${bairro}</div>`,
            `<div><strong>Cidade:</strong> ${cidade}</div>`,
            `<div><strong>CEP:</strong> ${cep}</div>`,
            `<div><strong>Sequência:</strong> ${seq}</div>`,
            `<div><strong>Parada:</strong> ${stopV}</div>`,
            `<div><strong>Comércio:</strong> ${comercioDisplay}</div>`,
            `<div><strong>Gaiola:</strong> ${gaiola}</div>`,
          ].join("");

          // bindTooltip faz aparecer ao passar o mouse (hover). Use bindPopup para clique.
          marker.bindTooltip(popupContent);
        }
      });

      // Ajuste de Zoom: Faz o mapa dar zoom automático para enquadrar todos os pontos encontrados.
      if (latlngs.length > 0) {
        map.fitBounds(L.latLngBounds(latlngs));
      }

      // Função de Limpeza (Cleanup):
      // Quando o componente desmontar ou atualizar, removemos o mapa antigo para não criar
      // mapas duplicados ou vazamento de memória.
      return () => {
        map.remove();
      };
    }
  }, [isFullScreen, selectedRoute, routes, availableCols]);

  // ============================================================================
  // Efeito: Indexação para Busca (Planned AT)
  // ============================================================================
  // Sempre que o arquivo muda (routes), criamos um índice rápido para a pesquisa.
  useEffect(() => {
    plannedAtToRoute.current = {};
    if (!routes) return;

    // Itera sobre cada rota e suas linhas.
    Object.entries(routes).forEach(([routeKey, rows]) => {
      for (const r of rows) {
        const v = r["Planned AT"];
        // Se achou um valor válido de AT, mapeia ele para o nome da rota atual.
        if (v !== undefined && v !== null && String(v).trim() !== "") {
          const key = String(v).trim();
          // Só grava o primeiro que encontrar (caso existam duplicatas).
          if (!plannedAtToRoute.current[key]) plannedAtToRoute.current[key] = routeKey;
          break; // Achou um AT nessa rota? Pode pular para a próxima rota.
        }
      }
    });
  }, [routes]);

  // Lógica do Input de Pesquisa
  const handleSearchATChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setSearchAT(v);

    if (!v || v.trim() === "") {
      setSearchResult(null);
      return;
    }
    // Busca direta no objeto (muito rápido, O(1)).
    const route = plannedAtToRoute.current[v.trim()];
    if (route) setSearchResult(route);
    else setSearchResult("NONE");
  };

  // Listener de Teclado: Fechar Fullscreen com ESC
  useEffect(() => {
    if (!isFullScreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullScreen(false);
    };
    window.addEventListener("keydown", onKey);
    // Importante: remover o listener ao desmontar para não ouvir teclas duplicadas.
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullScreen]);

  // Notificação de Sucesso (Toast)
  useEffect(() => {
    if (!loading && routes && Object.keys(routes).length > 0) {
      const count = Object.keys(routes).length;
      setNotification(`Foram identificadas ${count} rota${count > 1 ? "s" : ""}`);
      // Remove a notificação automaticamente após 3 segundos.
      const t = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [routes, loading]);

  // ============================================================================
  // Cálculos de Resumo (Dados Derivados)
  // ============================================================================
  // Estes dados são calculados "on the fly" a cada renderização, baseados na rota selecionada.

  const routeRows = selectedRoute && routes ? routes[selectedRoute] : [];

  // 1. Planned AT (Identificador da Rota)
  // Usa um 'Set' para garantir valores únicos. Se tiver mais de um diferente na mesma rota, mostra todos separados por vírgula.
  let plannedAtDisplay = "-";
  if (!availableCols || !availableCols.includes("Planned AT")) {
    plannedAtDisplay = "Não enviado";
  } else {
    const plannedAtSet = new Set<string>();
    routeRows.forEach((r) => {
      const v = r["Planned AT"];
      if (v !== undefined && v !== null) plannedAtSet.add(String(v));
    });
    plannedAtDisplay = plannedAtSet.size === 0 ? "-" : plannedAtSet.size === 1 ? Array.from(plannedAtSet)[0] : Array.from(plannedAtSet).join(", ");
  }

  // Data do romaneio (extraída do código Planned AT)
  // Padrão esperado: 'AT' + YYYYMMDD + '8' + 4 caracteres (ex: AT202511158FQU6)
  // Aqui pegamos o primeiro Planned AT válido da rota e extraímos a data YYYYMMDD,
  // formatando para 'DD/MM/YYYY' para exibir ao usuário.
  let romaneioDateDisplay = "-";
  if (!availableCols || !availableCols.includes("Planned AT")) {
    romaneioDateDisplay = "Não enviado";
  } else if (routeRows.length > 0) {
    const foundAt = routeRows.find((r) => r["Planned AT"] !== undefined && r["Planned AT"] !== null && String(r["Planned AT"]).trim() !== "");
    if (foundAt) {
      const code = String(foundAt["Planned AT"]).trim();
      const m = code.match(/^AT(\d{8})/);
      if (m) {
        const y = m[1].slice(0, 4);
        const mo = m[1].slice(4, 6);
        const d = m[1].slice(6, 8);
        romaneioDateDisplay = `${d}/${mo}/${y}`;
      } else {
        // Se o formato do AT não bater com o esperado, mostramos 'Inválido'
        romaneioDateDisplay = "Inválido";
      }
    } else {
      romaneioDateDisplay = "-";
    }
  }

  // 2. Quantidade de Pacotes (Num of Order)
  // Pega o primeiro valor numérico válido encontrado. Assumimos que é o mesmo para a rota toda.
  let pacotes: string | number = 0;
  if (routeRows.length > 0) {
    if (!availableCols || !availableCols.includes("Num of Order")) {
      pacotes = "Não enviado";
    } else {
      const found = routeRows.find((r) => r["Num of Order"] !== undefined && r["Num of Order"] !== null && String(r["Num of Order"]).trim() !== "");
      if (found) {
        const val = found["Num of Order"] as unknown;
        const n = Number(val);
        pacotes = Number.isFinite(n) ? n : String(val);
      } else {
        pacotes = 0;
      }
    }
  }

  // 3. Última Parada (Stop)
  // Varre de trás para frente (índice reverso) para achar o último valor preenchido.
  let lastStop = "-";
  if (!availableCols || !availableCols.includes("Stop")) {
    lastStop = "Não enviado";
  } else {
    for (let i = routeRows.length - 1; i >= 0; i--) {
      const v = routeRows[i]["Stop"];
      if (v !== undefined && v !== null && String(v).trim() !== "") {
        lastStop = String(v);
        break;
      }
    }
  }

  // 4. Tempo Estimado
  // Apenas exibe a string encontrada na coluna "Delivery Time".
  let estimatedTime = "-";
  if (!availableCols || !availableCols.includes("Delivery Time")) {
    estimatedTime = "Não enviado";
  } else if (routeRows.length > 0) {
    const ft = routeRows.find((r) => r["Delivery Time"] !== undefined && r["Delivery Time"] !== null && String(r["Delivery Time"]).trim() !== "");
    if (ft) estimatedTime = String(ft["Delivery Time"]);
  }

  // 5. Distância Total
  let estimatedDistance: string | number = "-";

  if (!availableCols || !availableCols.includes("Total Distance")) {
    estimatedDistance = "Não enviado";
  } else if (routeRows.length > 0) {
    const fd = routeRows.find((r) => r["Total Distance"] !== undefined && r["Total Distance"] !== null && String(r["Total Distance"]).trim() !== "");

    if (fd) {
      const valRaw = String(fd["Total Distance"]).trim(); // Ex: "20.808km"

      // 1. Remove tudo que não for dígito, ponto ou vírgula e troca vírgula por ponto (para compatibilidade BR/US)
      const cleanNum = valRaw.replace(/[^\d.,]/g, "").replace(",", ".");
      let n = parseFloat(cleanNum);

      // 2. Verifica se a string original indicava quilômetros (tem 'k' ou 'K')
      // Se sim, multiplicamos por 1000 para converter para METROS,
      // pois sua lógica de exibição abaixo divide por 1000.
      const isKm = /k/i.test(valRaw);

      if (Number.isFinite(n)) {
        if (isKm) {
          n = n * 1000;
        }
        estimatedDistance = n;
      } else {
        estimatedDistance = valRaw;
      }
    }
  }

  // Lógica de exibição da distância
  const estimatedDistanceDisplay = (() => {
    if (typeof estimatedDistance === "number") {
      const km = estimatedDistance / 1000; // Converte metros para km

      if (km >= 1) {
        // Math.round para arredondar (20.8 -> 21k)
        // Use Math.floor se quiser truncar (20.8 -> 20k)
        return `${Math.round(km)}k`;
      }
      return `${Math.round(estimatedDistance)} m`;
    }
    if (estimatedDistance === "-" || estimatedDistance === null || estimatedDistance === undefined) return "-";
    return String(estimatedDistance);
  })();

  // 6. Contagem de Comércio
  // Conta quantas vezes aparece "OFFICE" na coluna. O reduce percorre a lista e soma +1 quando acha.
  let commerceCount: string | number = 0;
  if (!availableCols || !availableCols.includes("Location Type")) {
    commerceCount = "Não enviado";
  } else {
    commerceCount = routeRows.reduce((c, r) => {
      const v = r["Location Type"];
      if (v && String(v).toLowerCase() === "office") return c + 1;
      return c;
    }, 0);
  }

  // 7. Contagem de Bairros
  // Conta frequência de cada bairro. Normaliza strings para evitar duplicatas (ex: "Meier" = "Méier").
  const neighborhoodCounts: Record<string, number> = {};
  if (availableCols && availableCols.includes("Neighborhood")) {
    routeRows.forEach((r) => {
      const raw = r["Neighborhood"];
      if (raw !== undefined && raw !== null) {
        const s = String(raw).trim();
        if (s !== "") {
          // 'normalize' + regex remove acentos (NFD separa o acento da letra, regex remove o acento).
          const normalized = s
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
          neighborhoodCounts[normalized] = (neighborhoodCounts[normalized] || 0) + 1;
        }
      }
    });
  }

  // Formatação de texto para "Title Case" (Primeira Letra Maiúscula).
  const titleCase = (text: string) =>
    text
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

  // Gera string final dos bairros (ex: "Copacabana: 3, Leme: 1").
  const neighborhoodDisplay =
    Object.keys(neighborhoodCounts).length === 0
      ? availableCols && availableCols.includes("Neighborhood")
        ? "-"
        : "Não enviado"
      : Object.entries(neighborhoodCounts)
          .map(([k, v]) => `${titleCase(k)}: ${v}`)
          .join(", ");

  // Verifica se temos colunas de coordenadas para habilitar o botão do mapa
  const mapAvailable = !!(availableCols && availableCols.includes("Latitude") && availableCols.includes("Longitude"));

  // ============================================================================
  // Renderização (JSX / HTML)
  // ============================================================================
  return (
    <div className="container py-3">
      {/* Renderização Condicional: O alerta só aparece se 'notification' não for nulo */}
      {notification && (
        <div className="position-fixed top-0 w-100 d-flex justify-content-center p-3">
          <div className="alert alert-dark text-white mb-0" role="alert">
            {notification}
          </div>
        </div>
      )}
      <h1 className="h3 text-center mb-4">Prévia de Rota</h1>

      {/* Input de Arquivo escondido, acionado pelo label estilizado como botão */}
      <div className="mb-3 text-center">
        <input
          id="file-input"
          type="file"
          accept=".xlsx, .csv"
          className="d-none"
          onChange={(e) => {
            handleFileUpload(e);
          }}
        />
        <label htmlFor="file-input" className="btn btn-primary">
          Enviar romaneio
        </label>
        <div className="form-text mt-2">Selecione o arquivo em formato XLSX ou CSV (UTF-8)</div>

        {/* Instruções Visuais */}
        <div className="container mt-3 p-3 border rounded-3 bg-light p-5">
          <h5>Instruções:</h5>
          <ol className="ps-2 gap-3 d-flex flex-column text-start">
            <li>A planilha do romaneio deve estar em seu estado original, com cabeçalho em inglês, sem manipulação ou tradução dos títulos do cabeçalho.</li>
            <li>As colunas "Corridor Cage", "Latitude" e "Longitude" são obrigatórias para a visualização dos pontos no mapa.</li>
            <li>Colunas esperadas (mas funciona sem): Sequence, Stop, Num of Order, Total Distance, Zipcode, Destination Address, City, Neighborhood, Delivery Time, Planned AT.</li>
            <li>Colunas desnecessárias (a ausência não afeta em nada): SPX TN, Rota, Driver, 3LP</li>
            <li>Peça aos analistas o romaneio completo (ou pelo menos com as colunas do exemplo abaixo) em formato Excel ou CSV (UTF-8)</li>
            <li>
              Esta aplicação roda localmente (em seu dispositivo) offline e não armazena qualquer tipo de dados em nuvem. Não compartilhe os dados que pertencem à empresa fora do seu grupo de escala.
            </li>
          </ol>
        </div>

        {/* Tabela de Exemplo: Só mostra se NÃO estiver carregando e NÃO tiver rotas carregadas */}
        {!loading && !routes && (
          <div className="mt-3">
            <h6>Exemplo de planilha ideal (dados fictícios)</h6>
            <div className="table-responsive">
              <table className="table table-sm table-bordered">
                <thead className="table-light">
                  <tr>
                    <th>Sequence</th>
                    <th>Stop</th>
                    <th>Num of Order</th>
                    <th>Total Distance</th>
                    <th>Zipcode</th>
                    <th>Destination Address</th>
                    <th>City</th>
                    <th>Neighborhood</th>
                    <th>Latitude</th>
                    <th>Longitude</th>
                    <th>Delivery Time</th>
                    <th>Location Type</th>
                    <th>Planned AT</th>
                    <th>Corridor Cage</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>1</td>
                    <td>1</td>
                    <td>10</td>
                    <td>20.909km</td>
                    <td>21050-624</td>
                    <td>Avenida Exemplo, 2343, Bloco 3 - Apto 10</td>
                    <td>Rio de Janeiro</td>
                    <td>Del Castilho</td>
                    <td>-934.759.539</td>
                    <td>-125677394</td>
                    <td>3h30min</td>
                    <td>HOME</td>
                    <td>AT202511104OKE</td>
                    <td>L-29</td>
                  </tr>
                  <tr>
                    <td>2</td>
                    <td>2</td>
                    <td>5</td>
                    <td>10.309km</td>
                    <td>22010-000</td>
                    <td>Rua dos Entregadores, 123</td>
                    <td>Rio de Janeiro</td>
                    <td>Copacabana</td>
                    <td>-738.454.511</td>
                    <td>-156566870</td>
                    <td>1h10min</td>
                    <td>-</td>
                    <td>AT202518749DCFG</td>
                    <td>L-10</td>
                  </tr>
                  <tr>
                    <td>3</td>
                    <td>3</td>
                    <td>2</td>
                    <td>30.209km</td>
                    <td>20040-020</td>
                    <td>Alameda Topzeira, 400</td>
                    <td>Rio de Janeiro</td>
                    <td>Ipanema</td>
                    <td>-914.000.000</td>
                    <td>-243405000</td>
                    <td>25min</td>
                    <td>HOME</td>
                    <td>AT202511180ZZZZ</td>
                    <td>L-5</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div className="form-text">Por favor envie a planilha com as colunas ilustradas acima</div>
          </div>
        )}
      </div>

      {/* Spinner de Carregamento */}
      {loading && (
        <div className="mb-3">
          <div className="d-flex align-items-center gap-2">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <div>Processando...</div>
          </div>
        </div>
      )}

      {/* Mensagem de Erro */}
      {error && !loading && <div className="alert alert-danger">{error}</div>}

      {/*
        Área Principal: Só renderiza se já processamos o arquivo (routes existe).
      */}
      {!loading && routes && (
        <>
          {/* Aviso se faltar colunas importantes */}
          {missingCols && missingCols.length > 0 && (
            <div className="alert alert-warning">
              <strong>Atenção:</strong> A planilha enviada não contém as seguintes colunas: {missingCols.join(", ")}. Campos ausentes serão exibidos como <em>"Não enviado"</em>.
            </div>
          )}
          <h2 className="h5 mt-5 mb-2">
            <b>Selecione uma rota:</b>
          </h2>

          {/* Select de Rotas: centralizado e limitado em largura usando grid do Bootstrap */}
          <div className="row justify-content-center mb-3">
            <div className="col-12 col-sm-6 col-md-4 col-lg-3">
              <select className="form-select" value={selectedRoute || ""} onChange={(e) => setSelectedRoute(e.target.value || null)}>
                <option value="">Selecione uma rota</option>
                {Object.keys(routes)
                  .sort((a, b) => {
                    // Separa letras de números (ex: A-10 vira "A" e "10") para ordenar corretamente.
                    const [aLetter, aNum] = a.split("-");
                    const [bLetter, bNum] = b.split("-");
                    if (aLetter < bLetter) return -1;
                    if (aLetter > bLetter) return 1;
                    return parseInt(aNum || "0") - parseInt(bNum || "0");
                  })
                  .map((route) => (
                    <option key={route} value={route}>
                      {route}
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Componente de Pesquisa (Input + Resultado) */}
          <div className="mb-3">
            <label htmlFor="search-at" className="form-label mt-3">
              <b>Pesquisar por AT</b>
            </label>
            <div className="row justify-content-center">
              <div className="col-12 col-sm-8 col-md-6 col-lg-4">
                <input id="search-at" type="text" className="form-control" placeholder="Código AT (ex: AT20251115...)" value={searchAT} onChange={handleSearchATChange} />
              </div>
            </div>

            {/* Resultado da pesquisa (aparece abaixo do input) */}
            <div className="mt-2">
              {searchResult === "NONE" && <div className="form-text text-danger">Nenhuma rota encontrada</div>}

              {searchResult && searchResult !== "NONE" && (
                <div className="mt-2">
                  <div
                    role="button"
                    onClick={() => {
                      setSelectedRoute(searchResult);
                      setSearchResult(null);
                      setSearchAT("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        setSelectedRoute(searchResult);
                        setSearchResult(null);
                        setSearchAT("");
                      }
                    }}
                    tabIndex={0}
                    aria-label={`Selecionar rota ${searchResult}`}
                    style={{ cursor: "pointer", display: "inline-block" }}
                  >
                    <div className="card p-2">
                      <div className="fw-bold">{searchResult}</div>
                      <div className="small text-muted">Clique para selecionar a rota</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Detalhes da Rota Selecionada */}
          {selectedRoute && routes[selectedRoute] && (
            <>
              <h2 className="h5 mt-5">
                <b>Dados da rota {selectedRoute} :</b>
              </h2>

              {/* Card de Resumo (Stats da Rota) */}
              <div className="card mb-5">
                <div className="card-body">
                  <div className="row">
                    <div className="col-12 col-md-6">
                      <ul className="list-unstyled mb-0">
                        <li className="mb-2">
                          <div className="text-muted small text-nowrap fw-bold">AT:</div>
                          <div className="fw-bold">{plannedAtDisplay}</div>
                        </li>
                        <li className="mb-2">
                          <div className="text-muted small fw-bold">Pacotes:</div>
                          <div className="fw-bold">{pacotes}</div>
                        </li>
                        <li className="mb-2">
                          <div className="text-muted small fw-bold">Paradas:</div>
                          <div className="fw-bold">{lastStop}</div>
                        </li>
                        <li className="mb-2">
                          <div className="text-muted small fw-bold">Comércio:</div>
                          <div className="fw-bold">{commerceCount}</div>
                        </li>
                      </ul>
                    </div>

                    <div className="col-12 col-md-6">
                      <ul className="list-unstyled mb-0">
                        <li className="mb-2">
                          <div className="text-muted small fw-bold">Tempo estimado:</div>
                          <div className="fw-bold">{estimatedTime}</div>
                        </li>
                        <li className="mb-2">
                          <div className="text-muted small fw-bold">Distância estimada: </div>
                          <div className="fw-bold">{estimatedDistanceDisplay}</div>
                        </li>
                        <li className="mb-2">
                          <div className="text-muted small fw-bold">Bairros:</div>
                          <div className="small text-break fw-bold">{neighborhoodDisplay}</div>
                        </li>
                        <li className="mb-2">
                          <div className="text-muted small fw-bold">Data do romaneio:</div>
                          <div className="fw-bold">{romaneioDateDisplay}</div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                {/* Botão para abrir o mapa em tela cheia */}
                {mapAvailable ? (
                  <button onClick={() => setIsFullScreen(true)} className="btn btn-outline-primary mb-2">
                    Ver no Mapa
                  </button>
                ) : (
                  // Quando o botão está desabilitado, elementos com `disabled` não disparam
                  // eventos de hover em todos os navegadores, então colocamos o botão dentro
                  // de um <span> com o atributo `title`. O título do <span> será mostrado
                  // ao passar o mouse, explicando por que a ação está indisponível.
                  <span className="d-inline-block" title={"Colunas 'Latitude' e 'Longitude' ausentes na planilha"}>
                    <button
                      onClick={() => {}}
                      className="btn btn-secondary mb-2"
                      disabled
                      aria-disabled
                      // pointerEvents none evita que o botão capture o hover do wrapper
                      style={{ pointerEvents: "none" }}
                    >
                      Ver no Mapa
                    </button>
                  </span>
                )}
              </div>

              {/* Tabela de Dados Detalhados */}
              <div className="table-responsive">
                <table className="table table-bordered table-striped">
                  <thead>
                    <tr>
                      {["Endereço de Destino", "Bairro", "Cidade", "CEP", "Tipo de Local", "Sequência", "Parada"].map((col) => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>

                  {/* Corpo da tabela: mapeia as linhas da rota selecionada */}
                  <tbody>
                    {routes[selectedRoute].map((row, i) => (
                      <tr key={i}>
                        {["Destination Address", "Neighborhood", "City", "Zipcode", "Location Type", "Sequence", "Stop"].map((col) => (
                          <td key={col}>{String(row[col] || "")}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </>
      )}

      {/* Overlay: Mapa em Tela Cheia */}
      {isFullScreen && selectedRoute && routes && routes[selectedRoute] && (
        <div className="position-fixed top-0 start-0 w-100 vh-100 bg-white">
          {/* A div 'âncora' onde o Leaflet vai injetar o mapa via mapRef */}
          <div ref={mapRef} className="w-100 h-100" />

          {/* Botão Flutuante para Sair (z-index alto para ficar sobre o mapa) */}
          <button onClick={() => setIsFullScreen(false)} className="btn btn-danger position-fixed top-0 end-0 m-3" style={{ zIndex: 3000 }}>
            Sair da Tela Cheia
          </button>
        </div>
      )}
    </div>
  );
}

export default DanfoTest;
