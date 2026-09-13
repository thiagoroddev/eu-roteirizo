import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { RoadGraph } from "../../src/utils/routing/graph";
import type { RowData } from "../../src/types";
import type { DeliveryPoint, LatLng, PlannedRoute } from "../../src/types/routing";
import { DEFAULT_ROUTING_CONFIG } from "../../src/types/routing";
import { createRouteExportPayload } from "../../src/services/routeExport";
import { hash } from "./corpus";
import type { FundamentalExperimentConfig, FundamentalObjective, FundamentalSolution, FundamentalVariant, MultiStartStrategy } from "./fundamentalExperiment";
import type { FundamentalReference } from "./fundamentals";

export interface ExperimentalArtifactInput {
  runId: string;
  caseId: string;
  routeNumber?: string;
  strategy?: MultiStartStrategy;
  startPointId?: string;
  startPoint?: LatLng;
  variant: FundamentalVariant;
  objective: FundamentalObjective;
  sourcePoints: readonly DeliveryPoint[];
  sourceRows: readonly RowData[];
  solution: FundamentalSolution;
  config?: Partial<FundamentalExperimentConfig>;
}

const compare = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
const safeJson = (value: unknown): string => (JSON.stringify(value) ?? "null").replaceAll("<", "\\u003c");
const pointPackageKeys = (points: readonly DeliveryPoint[]): string[] => points.flatMap((point) => point.packages.map((pkg) => JSON.stringify([point.id, pkg.id, point.lat, point.lng]))).sort(compare);
const strategySlug: Record<MultiStartStrategy, string> = {
  "seeded-revisable": "com-agrupamento-inicial",
  "unseeded-revisable": "sem-agrupamento-inicial",
  individual: "sem-agrupamento",
};
const strategyLabel: Record<MultiStartStrategy, string> = {
  "seeded-revisable": "COM AGRUPAMENTO INICIAL",
  "unseeded-revisable": "SEM AGRUPAMENTO INICIAL",
  individual: "SEM AGRUPAMENTO",
};

export const experimentalWinnerFileName = (input: { routeNumber: string; strategy: MultiStartStrategy; searchRadiusMeters: number; circuitLimitMeters: number }): string => {
  if (!/^[1-6]$/.test(input.routeNumber)) throw new Error("invalid-route-number");
  if (![input.searchRadiusMeters, input.circuitLimitMeters].every((value) => Number.isFinite(value) && value > 0)) throw new Error("invalid-experiment-config");
  return `${input.routeNumber}-r${input.searchRadiusMeters}-c${input.circuitLimitMeters}-${strategySlug[input.strategy]}.json`;
};

/** Converts one solution to the current v1 import format without persisting experiment semantics. */
export const createExperimentalRoutePayload = (input: ExperimentalArtifactInput) => {
  if ((input.startPointId === undefined) !== (input.startPoint === undefined)) throw new Error("incomplete-winning-start");
  if (input.startPointId && !input.solution.groups[0]?.pointIds.includes(input.startPointId)) throw new Error("winning-start-not-first");
  const config = { ...DEFAULT_ROUTING_CONFIG, ...(input.config ?? {}) };
  const searchRadiusMeters = input.config?.searchRadiusMeters ?? DEFAULT_ROUTING_CONFIG.autoRadiusMeters;
  const circuitLimitMeters = input.config?.circuitLimitMeters ?? 120;
  const identity = hash(
    JSON.stringify([
      "auto-fundamentals",
      input.runId,
      input.caseId,
      input.routeNumber,
      input.strategy,
      input.startPointId,
      input.startPoint,
      input.variant,
      input.objective,
      searchRadiusMeters,
      circuitLimitMeters,
      config,
      input.solution.signature,
    ])
  );
  const manifestId = `auto-fundamentals-${identity}`;
  const routeIdentity = input.routeNumber ? `ROTEIRO ${input.routeNumber}` : input.caseId;
  const experimentKind = input.strategy ? strategyLabel[input.strategy] : input.variant;
  const routeName = `EXPERIMENTO | ${routeIdentity} | ${experimentKind} | ${input.objective} | PROCURA ${searchRadiusMeters}m | CIRCUITO ${circuitLimitMeters}m | ${input.solution.status}`;
  const route: PlannedRoute = {
    id: `${manifestId}-route`,
    startPoint: input.startPoint ? { ...input.startPoint } : null,
    config: {
      walkingSpeedKmh: config.walkingSpeedKmh,
      deliveryBaseSeconds: config.deliveryBaseSeconds,
      deliveryPerPackageSeconds: config.deliveryPerPackageSeconds,
      vehicleSpeedKmh: config.vehicleSpeedKmh,
      autoRadiusMeters: DEFAULT_ROUTING_CONFIG.autoRadiusMeters,
    },
    createdAt: new Date().toISOString(),
    ignoredPointIds: [],
    stops: input.solution.groups.map((group, index) => ({
      id: `${manifestId}-stop-${index + 1}`,
      order: index + 1,
      vehicleStop: { ...group.anchor.position },
      pointIds: group.orderedPointIds.slice(),
      radiusMeters: DEFAULT_ROUTING_CONFIG.autoRadiusMeters,
      reversed: false,
      vehicleStopIsDefault: group.anchor.source === "fundamental" && group.anchor.fundamentalPointIds[0] === group.orderedPointIds[0],
    })),
  };
  return createRouteExportPayload(
    manifestId,
    routeName,
    route,
    input.sourcePoints.map((point) => structuredClone(point)),
    input.sourceRows.map((row) => structuredClone(row)),
    undefined,
    {
      manifestFileName: input.routeNumber ? `${input.routeNumber}-experimental.json` : `experimental-${input.caseId}.json`,
      addressCount: input.sourcePoints.length,
      packageCount: input.sourcePoints.reduce((total, point) => total + point.packageCount, 0),
      stopCount: route.stops.length,
    }
  );
};

/** Checks conservation before a payload is handed to the real app importer. */
export const validateExperimentalPayload = (payload: ReturnType<typeof createExperimentalRoutePayload>, sourcePoints: readonly DeliveryPoint[]): boolean => {
  if (payload.schema !== "eu-roteirizo/roteiro/v1" || payload.version !== 1) return false;
  if (JSON.stringify(pointPackageKeys(payload.points)) !== JSON.stringify(pointPackageKeys(sourcePoints))) return false;
  const known = new Set(sourcePoints.map((point) => point.id));
  const members = payload.route.stops.flatMap((stop) => stop.pointIds);
  if (new Set(members).size !== members.length || members.length !== known.size || members.some((id) => !known.has(id))) return false;
  if (payload.route.stops.some((stop, index) => stop.order !== index + 1 || stop.radiusMeters === 120 || typeof stop.vehicleStopIsDefault !== "boolean")) return false;
  return true;
};

const graphEdges = (graph: RoadGraph): { from: string; to: string; wayName: string; path: [number, number][] }[] => {
  const edges: { from: string; to: string; wayName: string; path: [number, number][] }[] = [];
  for (const [from, outgoing] of graph.adj) {
    const source = graph.coords.get(from);
    if (!source) continue;
    for (const edge of outgoing) {
      const target = graph.coords.get(edge.to);
      if (!target) continue;
      edges.push({
        from: String(from),
        to: String(edge.to),
        wayName: edge.wayName,
        path: [
          [source.lat, source.lng],
          [target.lat, target.lng],
        ],
      });
    }
  }
  return edges;
};

/** Static local map: Leaflet is embedded from node_modules and no tile/API URL is used. */
export const renderExperimentMapHtml = (input: {
  caseId: string;
  graph: RoadGraph;
  solutions: readonly FundamentalSolution[];
  fundamentals?: readonly FundamentalReference[];
  solutionLabels?: readonly string[];
}): string => {
  const data = {
    caseId: input.caseId,
    edges: graphEdges(input.graph),
    fundamentals: input.fundamentals ?? [],
    solutions: input.solutions.map((solution, index) => ({
      label: input.solutionLabels?.[index] ?? `${solution.variant}/${solution.objective}`,
      status: solution.status,
      vehicle: solution.vehicle.legs,
      metrics: { vehicleMeters: solution.vehicleDistanceMeters, walkingMeters: solution.fullWalkingMeters, modeledSeconds: solution.modeledTimeSeconds },
      groups: solution.groups.map((group) => ({
        anchor: group.anchor.position,
        pointCount: group.pointIds.length,
        limited: group.limitedCircuit.legs,
        complete: group.completeWalking.legs,
      })),
    })),
  };
  const leafletJs = readFileSync(resolve("node_modules/leaflet/dist/leaflet.js"), "utf8");
  const leafletCss = readFileSync(resolve("node_modules/leaflet/dist/leaflet.css"), "utf8");
  const title = input.caseId.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; base-uri 'none'">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Experimento de fundamentais — ${title}</title>
  <style>${leafletCss}
    html,body,#map{height:100%;margin:0} body{font-family:system-ui,sans-serif;background:#10131a;color:#f3f4f6}
    #legend{position:absolute;z-index:1000;top:12px;right:12px;max-width:320px;padding:14px;border-radius:8px;background:#10131aee;box-shadow:0 2px 8px #0008;font-size:13px;line-height:1.6}
    select{display:block;width:100%;padding:8px;margin:8px 0;background:#fff;color:#10131a} label{display:block} #map{background:#f8fafc}
  </style>
</head>
<body>
  <div id="map"></div><div id="legend"><strong>Experimento fundamental — ${title}</strong><select id="solution" aria-label="Variante e objetivo"></select><div id="metrics"></div><label><input type="checkbox" id="vehicle" checked> Veículo — violeta</label><label><input type="checkbox" id="limited" checked> Circuito limitado — verde</label><label><input type="checkbox" id="complete" checked> Caminhada e acesso estimado — laranja tracejado</label><p>Pontos: pino original (laranja), fundamental (azul), âncora final numerada (violeta). Trechos ausentes não são unidos.</p><small>Dados privados locais · © colaboradores do OpenStreetMap, ODbL. Inspeção humana pendente.</small></div>
  <script>${leafletJs}</script>
  <script id="experiment-data" type="application/json">${safeJson(data)}</script>
  <script>
    const data = JSON.parse(document.getElementById('experiment-data').textContent);
    const map = L.map('map', { zoomControl: true, preferCanvas: true, attributionControl: false });
    const xy = (p) => [p.lat, p.lng];
    const textNode = (value) => { const node = document.createElement('span'); node.textContent = value; return node; };
    data.edges.forEach((edge) => L.polyline(edge.path, { color: '#94a3b8', weight: 1, opacity: .5 }).addTo(map));
    const layer = L.layerGroup().addTo(map);
    const select = document.getElementById('solution');
    data.solutions.forEach((solution, index) => { const option = document.createElement('option'); option.value = index; option.textContent = solution.label; select.appendChild(option); });
    const draw = () => {
      layer.clearLayers();
      const solution = data.solutions[Number(select.value)];
      if (!solution) return;
      const number = (n) => n === null ? 'indisponível' : n.toFixed(1);
      document.getElementById('metrics').textContent = solution.status + ' · veículo ' + number(solution.metrics.vehicleMeters) + ' m · caminhada ' + number(solution.metrics.walkingMeters) + ' m';
      const legs = (values, color, weight) => values.forEach((leg) => { if (leg.kind !== 'missing' && leg.path.length > 1) L.polyline(leg.path.map(xy), {color, weight, dashArray: leg.kind === 'estimated-access' ? '5 5' : undefined}).addTo(layer); });
      const marker = (position, color, label) => L.circleMarker(xy(position), {radius: 4, color, fillOpacity: .9}).bindTooltip(textNode(label)).addTo(layer);
      if (document.getElementById('vehicle').checked) legs(solution.vehicle, '#7c3aed', 4);
      solution.groups.forEach((group, index) => {
        if (document.getElementById('complete').checked) legs(group.complete, '#ea580c', 3);
        if (document.getElementById('limited').checked) legs(group.limited, '#16a34a', 2);
        marker(group.anchor, '#7c3aed', 'Parada ' + (index + 1) + ' · ' + group.pointCount + ' endereço(s)');
      });
      data.fundamentals.forEach((reference, index) => { marker(reference.originalPosition, '#ea580c', 'Pino ' + (index + 1)); marker(reference.position, '#0284c7', 'Fundamental ' + (index + 1)); });
    };
    select.addEventListener('change', draw);
    ['vehicle','limited','complete'].forEach((id) => document.getElementById(id).addEventListener('change', draw));
    const bounds = data.fundamentals.length ? data.fundamentals.flatMap((r) => [xy(r.position), xy(r.originalPosition)]) : data.edges.flatMap((edge) => edge.path);
    if (bounds.length) map.fitBounds(bounds, {padding:[30,30]}); else map.setView([0,0], 2);
    draw();
  </script>
</body>
</html>
`;
};
