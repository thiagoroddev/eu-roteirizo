// Este arquivo não é mais usado, mas foi mantido como referência.

// Importações e comentários explicativos adicionados para facilitar
// a leitura do código por iniciantes (versão comentada).
import { useState, useCallback, useRef, useEffect } from "react";
import * as dfd from "danfojs";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
// Import Bootstrap (instale com `npm install bootstrap` se necessário)
import "bootstrap/dist/css/bootstrap.min.css";

// O Leaflet tenta descobrir automaticamente onde os ícones estão
// localizados, mas em bundlers modernos (Vite, webpack) isso frequentemente
// quebra. Aqui forçamos a remoção da função interna e configuramos
// explicitamente as URLs dos ícones para apontar para `public/images`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  // Estes arquivos devem existir em `public/images`.
  iconRetinaUrl: "/images/marker-icon.png",
  iconUrl: "/images/marker-icon.png",
  shadowUrl: "/images/marker-shadow.png",
});

interface RowData {
  [key: string]: unknown;
}

type RoutesMap = Record<string, RowData[]>;

function DanfoTest() {
  // `routes` armazena o resultado do agrupamento por "Corridor Cage".
  // Ex.: { "A-1": [row1, row2], "B-2": [row3, ...] }
  const [routes, setRoutes] = useState<RoutesMap | null>(null);

  // `loading` indica que estamos processando o arquivo enviado.
  // Útil para mostrar um spinner ou mensagem de progresso.
  const [loading, setLoading] = useState(false);

  // `error` armazena mensagens amigáveis para exibir ao usuário.
  // Ex.: coluna ausente, arquivo inválido, falha no parse.
  const [error, setError] = useState<string | null>(null);

  // `selectedRoute` contém a rota atualmente selecionada no select.
  // Usamos isso para renderizar a tabela de detalhes e o mapa.
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  // `isFullScreen` controla se o mapa em tela cheia está ativo.
  // Quando true, mostramos um overlay com o mapa e inicializamos o Leaflet.
  const [isFullScreen, setIsFullScreen] = useState(false);

  // `mapRef` aponta para o <div> vazio no JSX que será usado pelo Leaflet
  // para renderizar o mapa (estrutura imperativa do Leaflet).
  const mapRef = useRef<HTMLDivElement>(null);
  // Mensagem temporária exibida quando o processamento da planilha termina
  // (aparece durante 3 segundos mostrando quantas rotas foram detectadas).
  const [notification, setNotification] = useState<string | null>(null);
  // Estado para pesquisa por AT (coluna "Planned AT")
  const [searchAT, setSearchAT] = useState<string>("");
  // Resultado da pesquisa: null = nada a mostrar, string = rota encontrada, 'NONE' = sem resultado
  const [searchResult, setSearchResult] = useState<string | null>(null);
  // Mapa interno de Planned AT -> rota (string)
  const plannedAtToRoute = useRef<Record<string, string>>({});
  // Colunas detectadas na planilha enviada. Usado para avisar colunas ausentes
  const [availableCols, setAvailableCols] = useState<string[] | null>(null);
  const [missingCols, setMissingCols] = useState<string[]>([]);

  // handleFileUpload: lida com o upload local de um arquivo .xlsx
  // - valida extensão básica
  // - usa Danfo.js para ler a planilha no browser
  // - transforma DataFrame em array de objetos
  // - agrupa por "Corridor Cage" e salva no estado
  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo/ extensão básica
    if (!/\.(xlsx|csv)$/i.test(file.name)) {
      setError("Arquivo inválido. Envie um .xlsx ou .csv");
      return;
    }

    // Resetamos estados relevantes antes de processar o novo arquivo.
    // Isso evita que restos do upload anterior interfiram na nova visualização.
    setError(null);
    setLoading(true);
    setRoutes(null);
    setSelectedRoute(null);
    setIsFullScreen(false);

    try {
      // 1) Ler a planilha usando Danfo.js (retorna um DataFrame).
      const df = (await dfd.readExcel(file)) as dfd.DataFrame;

      // 2) Obter nomes das colunas a partir do DataFrame. Usaremos esses
      // nomes para reconstruir objetos (chave: valor) a partir de df.values.
      const colNames: string[] = df.columns as string[];

      // registra as colunas disponíveis e calcula colunas ausentes em relação
      // ao conjunto de colunas de exemplo que usamos na tela inicial.
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
      setAvailableCols(colNames);
      setMissingCols(exampleCols.filter((c) => !colNames.includes(c)));

      // 3) Verificamos se a planilha possui a coluna 'Corridor Cage'
      // que é a que usamos para agrupar em rotas/gaiolas.
      const corridorKey = "Corridor Cage";
      const hasCorridor = colNames.includes(corridorKey);
      if (!hasCorridor) {
        // Se a coluna esperada não existir, avisamos o usuário e abortamos.
        setError(`Coluna '${corridorKey}' não encontrada na planilha.`);
        setRoutes(null);
        return;
      }

      // 4) Converter DataFrame (df.values) em array de objetos,
      // onde cada objeto tem keys baseadas em `colNames`.
      const values = df.values as unknown[][];
      const jsonData = values.map((row) => {
        const obj: RowData = {};
        colNames.forEach((col, i) => (obj[col] = row[i]));
        return obj;
      });

      // 5) Agrupar as linhas por valor da coluna 'Corridor Cage'.
      // Se a célula estiver vazia, agrupamos em 'SEM ROTA'.
      const grouped = jsonData.reduce<RoutesMap>((acc, row) => {
        const raw = row[corridorKey];
        const route = (typeof raw === "string" && raw.trim()) || "SEM ROTA";
        if (!acc[route]) acc[route] = [];
        acc[route].push(row);
        return acc;
      }, {});

      // 6) Atualizamos o estado com o agrupamento pronto. A UI reagirá
      // automaticamente exibindo o select com as rotas disponíveis.
      setRoutes(grouped);
    } catch (err: unknown) {
      console.error("Erro ao ler planilha:", err);
      setError("Falha ao processar o arquivo. Verifique se o formato está correto.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isFullScreen && mapRef.current && selectedRoute && routes && routes[selectedRoute]) {
      // Prepara os dados para o mapa: filtramos apenas linhas que possuem
      // valores para Latitude e Longitude — sem esses valores não colocamos marcador.
      const validRows = routes[selectedRoute].filter((row) => row["Latitude"] && row["Longitude"]);
      if (validRows.length === 0) return;

      // Inicializa o mapa Leaflet no container apontado por `mapRef`.
      // Passamos uma view inicial neutra; depois iremos usar fitBounds
      // para ajustar centro/zoom aos marcadores reais.
      const map = L.map(mapRef.current).setView([0, 0], 2);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Array auxiliar com todos os pontos (L.LatLng) para calcular bounds.
      const latlngs: L.LatLng[] = [];

      // Percorre cada linha válida, faz parsing/normalização das coordenadas
      // e adiciona um marcador no mapa. Observações:
      // - Alguns sistemas exportam coordenadas com pontos de milhar
      //   (ex.: '-229.026.394') — por isso removemos os pontos.
      // - Também dividimos por 10_000_000 porque os dados aqui são
      //   apresentados em micrograus (padrão observado no dataset).
      validRows.forEach((row) => {
        const cleanLat = String(row["Latitude"]).replace(/\./g, "");
        const cleanLng = String(row["Longitude"]).replace(/\./g, "");
        const lat = parseFloat(cleanLat) / 10000000;
        const lng = parseFloat(cleanLng) / 10000000;

        // Somente adiciona marcador se lat/lng forem números válidos.
        if (!isNaN(lat) && !isNaN(lng)) {
          const latlng = L.latLng(lat, lng);
          latlngs.push(latlng);

          // Adiciona marcador ao mapa (com popup que mostra os dados da linha).
          const marker = L.marker(latlng).addTo(map);
          // Construir popup contendo apenas as colunas solicitadas,
          // com rótulos em português. Se a coluna não existir, mostra "Não enviado".
          const getField = (key: string) => (availableCols && availableCols.includes(key) ? String(row[key] ?? "") || "-" : "Não enviado");

          const endereco = getField("Destination Address");
          const bairro = getField("Neighborhood");
          const cidade = getField("City");
          const cep = getField("Zipcode");
          const locTypeRaw = availableCols && availableCols.includes("Location Type") ? String(row["Location Type"] ?? "") : null;
          const gaiola = getField("Corridor Cage");

          // Mapear Location Type para Comércio: Sim | Não | Indefinido | Não enviado
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
          // bindTooltip mostra o conteúdo ao passar o mouse; bindPopup seria ao clicar.
          marker.bindTooltip(popupContent);
        }
      });

      if (latlngs.length > 0) {
        map.fitBounds(L.latLngBounds(latlngs));
      }

      return () => {
        map.remove();
      };
    }
  }, [isFullScreen, selectedRoute, routes, availableCols]);

  // Atualiza o mapa PlannedAT -> rota sempre que `routes` muda.
  useEffect(() => {
    plannedAtToRoute.current = {};
    if (!routes) return;
    Object.entries(routes).forEach(([routeKey, rows]) => {
      for (const r of rows) {
        const v = r["Planned AT"];
        if (v !== undefined && v !== null && String(v).trim() !== "") {
          const key = String(v).trim();
          // guarda o primeiro match para esta rota (se múltiplas, mantemos a primeira encontrada)
          if (!plannedAtToRoute.current[key]) plannedAtToRoute.current[key] = routeKey;
          break;
        }
      }
    });
  }, [routes]);

  // Handler para pesquisa por AT — exige match exato (case-sensitive conforme dados).
  const handleSearchATChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setSearchAT(v);
    if (!v || v.trim() === "") {
      setSearchResult(null);
      return;
    }
    const route = plannedAtToRoute.current[v.trim()];
    if (route) setSearchResult(route);
    else setSearchResult("NONE");
  };

  const handleSelectFoundRoute = () => {
    if (searchResult && searchResult !== "NONE") {
      setSelectedRoute(searchResult);
      setSearchResult(null);
      setSearchAT("");
    }
  };

  // Permite sair do modo fullscreen com a tecla Escape — útil se o botão
  // estiver inacessível por qualquer motivo (ex.: sobreposição de controles).
  useEffect(() => {
    if (!isFullScreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsFullScreen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullScreen]);

  // Ao terminar o processamento (routes definido e não vazio) mostramos
  // uma notificação por 3 segundos informando quantas rotas foram
  // identificadas. Não mostramos enquanto `loading` for true.
  useEffect(() => {
    if (!loading && routes && Object.keys(routes).length > 0) {
      const count = Object.keys(routes).length;
      setNotification(`Foram identificadas ${count} rota${count > 1 ? "s" : ""}`);
      const t = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [routes, loading]);

  // Dados derivados da rota selecionada (usados para o card resumo)
  // `routeRows` fica vazio quando não há seleção.
  const routeRows = selectedRoute && routes ? routes[selectedRoute] : [];

  // AT: tentamos obter os valores presentes na coluna "Planned AT".
  // Se a coluna 'Planned AT' não existir na planilha, avisamos explicitamente.
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

  // Pacotes: o valor esperado é o valor da coluna "Num of Order" presente
  // nas linhas da rota (todos iguais). Portanto pegamos o primeiro valor
  // não vazio encontrado nessa coluna — não é para somar.
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

  // Paradas: valor da última linha (visualmente a última parada da rota)
  // procurando a última célula não vazia na coluna "Stop".
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

  // Tempo estimado: pega o primeiro valor não vazio da coluna "Delivery Time"
  // exibido como string (mantemos o formato original fornecido na planilha).
  let estimatedTime = "-";
  if (!availableCols || !availableCols.includes("Delivery Time")) {
    estimatedTime = "Não enviado";
  } else if (routeRows.length > 0) {
    const ft = routeRows.find((r) => r["Delivery Time"] !== undefined && r["Delivery Time"] !== null && String(r["Delivery Time"]).trim() !== "");
    if (ft) estimatedTime = String(ft["Delivery Time"]);
  }

  // Distância estimada: pega o primeiro valor não vazio da coluna "Total Distance".
  // Tentamos converter para número quando for possível; caso contrário mostramos a string.
  let estimatedDistance: string | number = "-";
  if (!availableCols || !availableCols.includes("Total Distance")) {
    estimatedDistance = "Não enviado";
  } else if (routeRows.length > 0) {
    const fd = routeRows.find((r) => r["Total Distance"] !== undefined && r["Total Distance"] !== null && String(r["Total Distance"]).trim() !== "");
    if (fd) {
      const val = fd["Total Distance"] as unknown;
      const n = Number(val);
      estimatedDistance = Number.isFinite(n) ? n : String(val);
    }
  }

  // Formata a distância para exibição: se for número e >=1000 assume metros
  // e converte para km com uma casa decimal (ex.: 12345 -> "12.3 km").
  // Se for <1000, mostramos em metros (ex.: "850 m"). Caso seja string, exibimos tal como está.
  const estimatedDistanceDisplay = (() => {
    if (typeof estimatedDistance === "number") {
      // interpretamos o valor como metros (padrão). Convertendo para km
      const km = estimatedDistance / 1000;
      if (km >= 10) {
        // para distâncias grandes mostramos sem casa decimal: "35 km"
        return `${Math.round(km)} km`;
      }
      if (km >= 1) {
        // entre 1 km e 10 km mostramos com uma casa decimal: "9.8 km"
        return `${km.toFixed(1)} km`;
      }
      // abaixo de 1 km mostramos metros inteiros
      return `${Math.round(estimatedDistance)} m`;
    }
    if (estimatedDistance === "-" || estimatedDistance === null || estimatedDistance === undefined) return "-";
    return String(estimatedDistance);
  })();

  // Comércio: conta quantas vezes aparece "OFFICE" na coluna "Location Type"
  // (caso-insensitivo).
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

  // Bairros: contamos quantas vezes cada bairro aparece na coluna
  // "Neighborhood". A contagem é case-insensitive e também IGNORA
  // acentos/diacríticos — ou seja, "Humaitá" e "Humaita" serão
  // considerados o mesmo bairro. Para isso normalizamos a string
  // removendo diacríticos (forma NFD) antes de fazer a chave.
  const neighborhoodCounts: Record<string, number> = {};
  if (availableCols && availableCols.includes("Neighborhood")) {
    routeRows.forEach((r) => {
      const raw = r["Neighborhood"];
      if (raw !== undefined && raw !== null) {
        const s = String(raw).trim();
        if (s !== "") {
          const normalized = s
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();
          neighborhoodCounts[normalized] = (neighborhoodCounts[normalized] || 0) + 1;
        }
      }
    });
  }

  // Função utilitária para transformar em Title Case para exibição.
  const titleCase = (text: string) =>
    text
      .split(/\s+/)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(" ");

  // Montamos uma string legível para mostrar no card, ex.:
  // "Copacabana: 3, Botafogo: 1". Se não houver bairros, mostra "-".
  const neighborhoodDisplay =
    Object.keys(neighborhoodCounts).length === 0
      ? availableCols && availableCols.includes("Neighborhood")
        ? "-"
        : "Não enviado"
      : Object.entries(neighborhoodCounts)
          .map(([k, v]) => `${titleCase(k)}: ${v}`)
          .join(", ");

  return (
    <div className="container py-3">
      {/* Notificação temporária no topo da tela quando o processamento termina */}
      {notification && (
        <div className="position-fixed top-0 w-100 d-flex justify-content-center p-3">
          <div className="alert alert-dark text-white mb-0" role="alert">
            {notification}
          </div>
        </div>
      )}
      <h1 className="h3 text-center mb-4">Prévia de Rota</h1>

      {/* Input para upload do arquivo .xlsx ou csv usando Bootstrap */}
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
        {/* Instruções de formatação da planilha*/}

        <div className="container mt-3 p-3 border rounded-3 bg-light">
          <h5>Instruções:</h5>
          <p>1 - A planilha do romaneio deve estar em seu estado original, sem manipulação ou tradução.</p>
          <p>2- As colunas "Corridor Cage", "Latitude" e "Longitude" são obrigatórias para a visualização dos pontos no mapa.</p>
          <p>3- Colunas esperadas (mas funciona sem): Sequence, Stop, Num of Order, Total Distance, Zipcode, Destination Address, City, Neighbohood, Delivery Time, Planned AT. </p>
          <p>4- Colunas desnecessárias (a ausência não afeta em nada) : SPX TN, Rota, Driver, 3LP</p>
          <p>5- Peça aos analistas o romaneio completo em formato excel ou csv(utf-8).</p>
        </div>
        {/* Planilha de exemplo (aparece apenas quando ainda NÃO houve upload) */}
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
            <div className="form-text">Esta tabela é um exemplo fictício e desaparecerá após o envio de um arquivo real.</div>
          </div>
        )}
      </div>

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

      {error && !loading && <div className="alert alert-danger">{error}</div>}

      {/*
        Se já processamos o arquivo e temos `routes`, mostramos o seletor
        (select) com todas as rotas disponíveis ordenadas de forma simples.
        Comentários:
        - A ordenação separa por letra e número (ex.: "A-1", "A-10").
        - Ao selecionar uma rota, mostramos o botão "Ver no Mapa" acima
          da tabela e a tabela com as colunas solicitadas.
      */}
      {!loading && routes && (
        <>
          {missingCols && missingCols.length > 0 && (
            <div className="alert alert-warning">
              <strong>Atenção:</strong> A planilha enviada não contém as seguintes colunas de exemplo: {missingCols.join(", ")}. Campos ausentes serão exibidos como <em>"Não enviado"</em> onde
              aplicável.
            </div>
          )}
          <h2 className="h5">Selecione uma rota:</h2>

          {/* Select com todas as rotas encontradas. */}
          <select className="form-select mb-3" value={selectedRoute || ""} onChange={(e) => setSelectedRoute(e.target.value || null)}>
            <option value="">Selecione uma rota</option>
            {Object.keys(routes)
              .sort((a, b) => {
                // Ordenação básica: por parte textual (A,B,C...) e depois numérica.
                const [aLetter, aNum] = a.split("-");
                const [bLetter, bNum] = b.split("-");
                if (aLetter < bLetter) return -1;
                if (aLetter > bLetter) return 1;
                return parseInt(aNum || "0") - parseInt(bNum || "0");
              })
              .map((route) => (
                // Cada option mostra o nome da rota. O value será usado para
                // indexar em `routes` quando o usuário selecionar.
                <option key={route} value={route}>
                  {route}
                </option>
              ))}
          </select>
          {/* Pesquisa por AT (Planned AT) - somente match exato */}
          <div className="mb-3">
            <label htmlFor="search-at" className="form-label">
              Pesquisar por AT
            </label>
            <div className="d-flex gap-2">
              <input id="search-at" type="text" className="form-control" placeholder="Código AT (ex: AT20251115...)" value={searchAT} onChange={handleSearchATChange} />
              <button className="btn btn-secondary" type="button" onClick={handleSelectFoundRoute} disabled={!searchResult || searchResult === "NONE"}>
                Ir
              </button>
            </div>
            <div className="mt-2">
              {searchResult === "NONE" && <div className="form-text text-danger">Nenhuma rota encontrada</div>}

              {searchResult && searchResult !== "NONE" && (
                <div className="">
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

          {/* Se o usuário já escolheu uma rota, mostramos o botão e a tabela */}
          {selectedRoute && routes[selectedRoute] && (
            <>
              {/* Botão que ativa o overlay em tela cheia com o mapa. */}

              {/* Cabeçalho da tabela com as colunas filtradas conforme pedido. */}
              <h2 className="h5 mt-5">Dados da rota {selectedRoute} :</h2>

              {/* Card resumo com informações derivadas da rota selecionada. */}
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
                      </ul>
                    </div>
                  </div>
                </div>
                <button onClick={() => setIsFullScreen(true)} className="btn btn-outline-primary mb-2">
                  Ver no Mapa
                </button>
              </div>

              <div className="table-responsive">
                <table className="table table-bordered table-striped">
                  <thead>
                    <tr>
                      {/* Cabeçalho com os nomes das colunas em português*/}
                      {["Endereço de Destino", "Bairro", "Cidade", "CEP", "Tipo de Local", "Sequência", "Parada"].map((col) => (
                        <th key={col}>{col}</th>
                      ))}
                    </tr>
                  </thead>

                  {/* Corpo da tabela: percorre cada linha (row) da rota selecionada
                    e exibe somente as colunas listadas acima. */}
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

      {/* Overlay de mapa em tela cheia. */}
      {isFullScreen && selectedRoute && routes && routes[selectedRoute] && (
        <div className="position-fixed top-0 start-0 w-100 vh-100 bg-white">
          {/*
            Div vazia que funciona como "âncora" para o mapa do Leaflet.
            Usamos `mapRef` para referenciar esse elemento no efeito que
            inicializa o mapa (useEffect acima).
          */}
          <div ref={mapRef} className="w-100 h-100" />

          {/*
            Botão para fechar o modo full-screen. Colocado com position
            absolute sobre o mapa para ficar sempre visível.
          */}
          <button onClick={() => setIsFullScreen(false)} className="btn btn-danger position-fixed top-0 end-0 m-3" style={{ zIndex: 3000 }}>
            Sair da Tela Cheia
          </button>
        </div>
      )}
    </div>
  );
}

export default DanfoTest;
