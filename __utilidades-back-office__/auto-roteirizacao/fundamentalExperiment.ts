import type { AnchorCandidate, AnchorSearchResult } from "../../src/types/autoRouting";
import type { DeliveryPoint, LatLng } from "../../src/types/routing";
import { DEFAULT_ROUTING_CONFIG } from "../../src/types/routing";
import { pointDeliverySeconds } from "../../src/utils/routing/estimates";
import { generateAnchorAlternatives } from "../../src/utils/routing/autoRouteAnchors";
import { haversine } from "../../src/utils/routing/geo";
import type { RoadGraph } from "../../src/utils/routing/graph";
import { evaluateCompleteWalking, evaluateLimitedFundamentalCircuit, evaluateVehicleOrder, clearExperimentPathCache, type PathCollection } from "./experimentPaths";
import { buildFundamentalReferences, type FundamentalReference, type FundamentalReferenceSet } from "./fundamentals";
import { pedestrianGraph as derivePedestrianGraph } from "../../src/utils/routing/pedestrian";

export type FundamentalVariant = "individual" | "fixed-groups" | "revisable";
export type FundamentalObjective = "vehicleDistance" | "modeledTime";

export interface FundamentalExperimentConfig {
  circuitLimitMeters: number;
  searchRadiusMeters: number;
  sampleStepMeters: number;
  maxCandidatesPerGroup: number;
  maxOrderEvaluations: number;
  maxRefinementPasses: number;
  maxGroupOperations: number;
  maxRevisableAlternatives: number;
  walkingSpeedKmh: number;
  vehicleSpeedKmh: number;
  deliveryBaseSeconds: number;
  deliveryPerPackageSeconds: number;
  maxCandidates: number;
  maxDistanceChecks: number;
  maxSegments: number;
  maxGridCells: number;
  maxGroupChecks: number;
}

export const DEFAULT_FUNDAMENTAL_EXPERIMENT_CONFIG: FundamentalExperimentConfig = {
  circuitLimitMeters: 120,
  searchRadiusMeters: 60,
  sampleStepMeters: 10,
  maxCandidatesPerGroup: 12,
  maxOrderEvaluations: 24,
  maxRefinementPasses: 3,
  maxGroupOperations: 48,
  maxRevisableAlternatives: 24,
  walkingSpeedKmh: DEFAULT_ROUTING_CONFIG.walkingSpeedKmh,
  vehicleSpeedKmh: DEFAULT_ROUTING_CONFIG.vehicleSpeedKmh,
  deliveryBaseSeconds: DEFAULT_ROUTING_CONFIG.deliveryBaseSeconds,
  deliveryPerPackageSeconds: DEFAULT_ROUTING_CONFIG.deliveryPerPackageSeconds,
  maxCandidates: 8_000,
  maxDistanceChecks: 800_000,
  maxSegments: 30_000,
  maxGridCells: 100_000,
  maxGroupChecks: 200_000,
};

interface ExperimentAnchor {
  id: string;
  position: LatLng;
  segment: FundamentalReference["segment"];
  source: "fundamental" | "candidate";
  fundamentalPointIds: string[];
}

interface GroupDefinition {
  pointIds: string[];
  seedAnchor?: ExperimentAnchor;
}

interface SelectedGroup {
  definition: GroupDefinition;
  anchor: ExperimentAnchor;
}

export interface FundamentalGroupResult {
  id: string;
  pointIds: string[];
  orderedPointIds: string[];
  orderedFundamentalIds: string[];
  anchor: ExperimentAnchor;
  limitedCircuit: PathCollection & { anchor: LatLng; exceedsLimit: boolean };
  completeWalking: PathCollection;
  limitedCircuitMeters: number;
  fullWalkingMeters: number;
  accessMeters: number;
  diagnostics: string[];
}

export interface FundamentalSolution {
  variant: FundamentalVariant;
  objective: FundamentalObjective;
  status: "complete" | "partial";
  groups: FundamentalGroupResult[];
  vehicle: PathCollection;
  vehicleDistanceMeters: number;
  limitedCircuitMeters: number;
  fullWalkingMeters: number;
  accessMeters: number;
  modeledTimeSeconds: number;
  pendingPointIds: string[];
  diagnostics: string[];
  operationsEvaluated: number;
  workLimitReached: boolean;
  signature: string;
}

export interface FundamentalVariantResult {
  kind: FundamentalVariant;
  bestByObjective: Record<FundamentalObjective, FundamentalSolution>;
  definitionsEvaluated: number;
  definitionLimitReached: boolean;
}

export interface FundamentalExperimentInput {
  points: readonly DeliveryPoint[];
  graph: RoadGraph | null;
  pedestrianGraph?: RoadGraph | null;
  startPoint?: LatLng | null;
  config?: Partial<FundamentalExperimentConfig>;
  /** Optional local-harness observation; it does not influence candidate selection. */
  onPhase?: (phase: string) => void;
}

export interface FundamentalExperimentResult {
  status: "complete" | "partial" | "invalid";
  config: FundamentalExperimentConfig;
  fundamentals: FundamentalReference[];
  variants: FundamentalVariantResult[];
  nonDominated: FundamentalSolution[];
  diagnostics: string[];
  search: AnchorSearchResult | null;
}

const compare = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);
const finite = (value: number): number => (Number.isFinite(value) ? value : Infinity);
const sum = (values: number[]): number => (values.some((value) => !Number.isFinite(value)) ? Infinity : values.reduce((total, value) => total + value, 0));
const normalizeConfig = (raw: Partial<FundamentalExperimentConfig> | undefined): FundamentalExperimentConfig => ({ ...DEFAULT_FUNDAMENTAL_EXPERIMENT_CONFIG, ...(raw ?? {}) });

/** Corpus inputs and snapshots are immutable; reuse their expensive spatial derivations by identity. */
let referenceSetsByGraph = new WeakMap<RoadGraph, WeakMap<readonly DeliveryPoint[], FundamentalReferenceSet>>();
let referenceSetsWithoutGraph = new WeakMap<readonly DeliveryPoint[], FundamentalReferenceSet>();
let anchorSearches = new WeakMap<FundamentalReferenceSet, Map<string, AnchorSearchResult>>();

const referenceSetFor = (points: readonly DeliveryPoint[], graph: RoadGraph | null): FundamentalReferenceSet => {
  if (!graph) {
    const cached = referenceSetsWithoutGraph.get(points);
    if (cached) return cached;
    const created = buildFundamentalReferences(points, graph);
    referenceSetsWithoutGraph.set(points, created);
    return created;
  }
  const byPoints = referenceSetsByGraph.get(graph) ?? new WeakMap<readonly DeliveryPoint[], FundamentalReferenceSet>();
  referenceSetsByGraph.set(graph, byPoints);
  const cached = byPoints.get(points);
  if (cached) return cached;
  const created = buildFundamentalReferences(points, graph);
  byPoints.set(points, created);
  return created;
};

const anchorSearchFor = (referenceSet: FundamentalReferenceSet, graph: RoadGraph | null, config: FundamentalExperimentConfig, onPhase?: (phase: string) => void): AnchorSearchResult => {
  const key = [config.searchRadiusMeters, config.sampleStepMeters, config.maxCandidates, config.maxDistanceChecks, config.maxSegments, config.maxGridCells, config.maxGroupChecks].join("|");
  const byConfig = anchorSearches.get(referenceSet) ?? new Map<string, AnchorSearchResult>();
  anchorSearches.set(referenceSet, byConfig);
  const cached = byConfig.get(key);
  if (cached) {
    onPhase?.("anchor:cache-hit");
    return cached;
  }
  const created = generateAnchorAlternatives({
    points: referenceSet.virtualPoints,
    graph,
    radiusMeters: config.searchRadiusMeters,
    options: {
      sampleStepMeters: config.sampleStepMeters,
      maxCandidates: config.maxCandidates,
      maxDistanceChecks: config.maxDistanceChecks,
      maxSegments: config.maxSegments,
      maxGridCells: config.maxGridCells,
      maxGroupChecks: config.maxGroupChecks,
    },
    onPhase,
  });
  byConfig.set(key, created);
  return created;
};

const pointValidation = (points: readonly DeliveryPoint[], graph: RoadGraph | null): string[] => {
  const diagnostics: string[] = [];
  const ids = new Set<string>();
  const packageIds = new Set<string>();
  for (const point of points) {
    if (!point.id || ids.has(point.id)) diagnostics.push("duplicate-point-id");
    ids.add(point.id);
    if (point.packageCount !== point.packages.length) diagnostics.push("package-count-mismatch");
    if (point.packageCount < 1 || !Number.isFinite(point.lat) || !Number.isFinite(point.lng)) diagnostics.push("invalid-point");
    for (const pkg of point.packages) {
      if (!pkg.id) diagnostics.push("missing-package-id");
      if (packageIds.has(pkg.id)) diagnostics.push("duplicate-package-id");
      packageIds.add(pkg.id);
    }
  }
  if (graph?.isPedestrian) diagnostics.push("pedestrian-only-vehicle-graph");
  return [...new Set(diagnostics)].sort(compare);
};

const anchorFromReference = (reference: FundamentalReference): ExperimentAnchor => ({
  id: `fundamental:${reference.pointId}`,
  position: { ...reference.position },
  segment: reference.segment,
  source: "fundamental",
  fundamentalPointIds: [reference.pointId],
});
const anchorFromCandidate = (candidate: AnchorCandidate, refsByVirtualId: Map<string, FundamentalReference>): ExperimentAnchor => ({
  id: `candidate:${candidate.id}`,
  position: { ...candidate.position },
  segment: candidate.segment,
  source: "candidate",
  fundamentalPointIds: candidate.pointIds
    .map((id) => refsByVirtualId.get(id)?.pointId)
    .filter((id): id is string => !!id)
    .sort(compare),
});

const fundamentalOrder = (anchor: ExperimentAnchor, pointIds: readonly string[], refs: Map<string, FundamentalReference>, graph: RoadGraph | null = null): FundamentalReference[] => {
  const initial = pointIds
    .map((id) => refs.get(id))
    .filter((reference): reference is FundamentalReference => !!reference)
    .sort((a, b) => haversine(anchor.position, a.position) - haversine(anchor.position, b.position) || compare(a.pointId, b.pointId));
  if (!graph || initial.length < 2) return initial;
  const orders =
    initial.length <= 4
      ? permutations(
          initial.map((reference) => reference.pointId),
          24
        ).map((ids) => ids.map((id) => refs.get(id)!))
      : [initial, initial.slice().reverse()];
  return orders.reduce((best, order) => {
    const cost = (members: FundamentalReference[]) => evaluateLimitedFundamentalCircuit(graph, anchor, members, Infinity).distanceMeters;
    return cost(order) < cost(best) ? order : best;
  }, initial);
};

const groupResult = (
  selected: SelectedGroup,
  refs: Map<string, FundamentalReference>,
  graph: RoadGraph | null,
  pedestrianGraph: RoadGraph | null,
  config: FundamentalExperimentConfig,
  id: string
): FundamentalGroupResult => {
  const ordered = fundamentalOrder(selected.anchor, selected.definition.pointIds, refs, pedestrianGraph);
  const limitedCircuit = evaluateLimitedFundamentalCircuit(pedestrianGraph, selected.anchor, ordered, config.circuitLimitMeters);
  const completeWalking = evaluateCompleteWalking(pedestrianGraph, selected.anchor, ordered);
  const diagnostics = [
    ...(!graph || graph.adj.size === 0 ? ["missing-vehicle-graph"] : []),
    ...(!limitedCircuit.valid ? ["limited-circuit-missing-path"] : []),
    ...(limitedCircuit.exceedsLimit ? ["limited-circuit-exceeds-limit"] : []),
    ...(!completeWalking.valid ? ["complete-walk-missing-path"] : []),
  ];
  return {
    id,
    pointIds: selected.definition.pointIds.slice().sort(compare),
    orderedPointIds: ordered.map((reference) => reference.pointId),
    orderedFundamentalIds: ordered.map((reference) => reference.virtualId),
    anchor: selected.anchor,
    limitedCircuit,
    completeWalking,
    limitedCircuitMeters: limitedCircuit.distanceMeters,
    fullWalkingMeters: completeWalking.distanceMeters,
    accessMeters: completeWalking.estimatedAccessMeters,
    diagnostics,
  };
};

interface EvaluationCache {
  groups: Map<string, Omit<FundamentalGroupResult, "id">>;
  vehicles: Map<string, PathCollection>;
  deliverySeconds: number;
}

let evaluationCachesByGraph = new WeakMap<RoadGraph, WeakMap<RoadGraph, WeakMap<readonly DeliveryPoint[], Map<string, EvaluationCache>>>>();

/** The harness clears between cases; measured repetitions explicitly use warm caches. */
export const clearFundamentalExperimentCaches = (): void => {
  referenceSetsByGraph = new WeakMap();
  referenceSetsWithoutGraph = new WeakMap();
  anchorSearches = new WeakMap();
  evaluationCachesByGraph = new WeakMap();
  clearExperimentPathCache();
};

const endpointKey = (position: LatLng, segment: FundamentalReference["segment"] | undefined | null = null): string => `${position.lat},${position.lng},${segment?.id ?? ""}`;

const groupKey = (selected: SelectedGroup, refs: Map<string, FundamentalReference>): string =>
  `${endpointKey(selected.anchor.position, selected.anchor.segment)}|${selected.definition.pointIds
    .slice()
    .sort(compare)
    .map((id) => {
      const reference = refs.get(id);
      return reference ? `${id}@${endpointKey(reference.position, reference.segment)}@${endpointKey(reference.originalPosition)}` : id;
    })
    .join("|")}`;

const newEvaluationCache = (points: Map<string, DeliveryPoint>, config: FundamentalExperimentConfig): EvaluationCache => ({
  groups: new Map<string, Omit<FundamentalGroupResult, "id">>(),
  vehicles: new Map<string, PathCollection>(),
  deliverySeconds: [...points.values()].reduce(
    (total, point) =>
      total +
      pointDeliverySeconds(point, {
        walkingSpeedKmh: config.walkingSpeedKmh,
        deliveryBaseSeconds: config.deliveryBaseSeconds,
        deliveryPerPackageSeconds: config.deliveryPerPackageSeconds,
        vehicleSpeedKmh: config.vehicleSpeedKmh,
        autoRadiusMeters: config.searchRadiusMeters,
      }),
    0
  ),
});

/** Reuses pure path/group calculations for repeated runs of the same frozen scenario. */
const evaluationCacheFor = (
  sourcePoints: readonly DeliveryPoint[],
  points: Map<string, DeliveryPoint>,
  graph: RoadGraph | null,
  pedestrianGraph: RoadGraph | null,
  variant: FundamentalVariant,
  objective: FundamentalObjective,
  startPoint: LatLng | null,
  config: FundamentalExperimentConfig
): EvaluationCache => {
  if (!graph || !pedestrianGraph) return newEvaluationCache(points, config);
  const byPedestrianGraph = evaluationCachesByGraph.get(graph) ?? new WeakMap<RoadGraph, WeakMap<readonly DeliveryPoint[], Map<string, EvaluationCache>>>();
  evaluationCachesByGraph.set(graph, byPedestrianGraph);
  const byPoints = byPedestrianGraph.get(pedestrianGraph) ?? new WeakMap<readonly DeliveryPoint[], Map<string, EvaluationCache>>();
  byPedestrianGraph.set(pedestrianGraph, byPoints);
  const byContext = byPoints.get(sourcePoints) ?? new Map<string, EvaluationCache>();
  byPoints.set(sourcePoints, byContext);
  const key = `${variant}|${objective}|${startPoint ? endpointKey(startPoint) : "free"}|${JSON.stringify(config)}`;
  const cached = byContext.get(key);
  if (cached) return cached;
  const created = newEvaluationCache(points, config);
  byContext.set(key, created);
  return created;
};

const cachedGroupResult = (
  selected: SelectedGroup,
  refs: Map<string, FundamentalReference>,
  graph: RoadGraph | null,
  pedestrianGraph: RoadGraph | null,
  config: FundamentalExperimentConfig,
  cache: EvaluationCache
): Omit<FundamentalGroupResult, "id"> => {
  const key = groupKey(selected, refs);
  const cached = cache.groups.get(key);
  if (cached) return cached;
  const created = groupResult(selected, refs, graph, pedestrianGraph, config, "cached-group");
  cache.groups.set(key, created);
  return created;
};

const cachedVehicleOrder = (graph: RoadGraph | null, startPoint: LatLng | null, groups: readonly FundamentalGroupResult[], cache: EvaluationCache): PathCollection => {
  const key = `${startPoint ? endpointKey(startPoint) : "free"}>${groups.map((group) => endpointKey(group.anchor.position, group.anchor.segment)).join(">")}`;
  const cached = cache.vehicles.get(key);
  if (cached) return cached;
  const created = evaluateVehicleOrder(
    graph,
    startPoint,
    groups.map((group) => ({ position: group.anchor.position, segment: group.anchor.segment }))
  );
  if (cache.vehicles.size >= 2_000) cache.vehicles.delete(cache.vehicles.keys().next().value!);
  cache.vehicles.set(key, created);
  return created;
};

const permutations = (ids: string[], maximum: number): string[][] => {
  const result: string[][] = [];
  const used = new Set<string>();
  const current: string[] = [];
  const visit = (): void => {
    if (result.length >= maximum) return;
    if (current.length === ids.length) {
      result.push(current.slice());
      return;
    }
    for (const id of ids) {
      if (used.has(id)) continue;
      used.add(id);
      current.push(id);
      visit();
      current.pop();
      used.delete(id);
      if (result.length >= maximum) return;
    }
  };
  visit();
  return result;
};

const orderCandidates = (groups: SelectedGroup[], startPoint: LatLng | null, config: FundamentalExperimentConfig): string[][] => {
  const byId = new Map(groups.map((group) => [group.definition.pointIds.slice().sort(compare).join(","), group]));
  const ids = [...byId.keys()].sort(compare);
  const factorial = ids.reduce((total, _, index) => total * (index + 1), 1);
  if (factorial <= config.maxOrderEvaluations) return permutations(ids, config.maxOrderEvaluations);
  const natural = ids.slice();
  const reverse = ids.slice().reverse();
  const greedy = (origin: LatLng | null): string[] => {
    const remaining = new Set(ids);
    const output: string[] = [];
    let cursor = origin;
    while (remaining.size) {
      let next = "",
        bestDistance = Infinity;
      for (const id of remaining) {
        const distance = cursor ? haversine(cursor, byId.get(id)!.anchor.position) : 0;
        if (!next || distance < bestDistance || (distance === bestDistance && compare(id, next) < 0)) {
          next = id;
          bestDistance = distance;
        }
      }
      output.push(next);
      remaining.delete(next);
      cursor = byId.get(next)!.anchor.position;
    }
    return output;
  };
  const initial = [...new Map([natural, reverse, greedy(startPoint), greedy(null)].map((order) => [order.join("|"), order])).values()];
  const base = initial.at(-1) ?? natural;
  for (let from = 0; from < base.length - 1 && initial.length < config.maxOrderEvaluations; from++) {
    for (let to = from + 1; to < base.length && initial.length < config.maxOrderEvaluations; to++) initial.push([...base.slice(0, from), ...base.slice(from, to + 1).reverse(), ...base.slice(to + 1)]);
  }
  return initial.slice(0, config.maxOrderEvaluations);
};

const evaluateSelection = (
  variant: FundamentalVariant,
  objective: FundamentalObjective,
  selected: SelectedGroup[],
  refs: Map<string, FundamentalReference>,
  points: Map<string, DeliveryPoint>,
  graph: RoadGraph | null,
  pedestrianGraph: RoadGraph | null,
  startPoint: LatLng | null,
  config: FundamentalExperimentConfig,
  operationsEvaluated: number,
  cache: EvaluationCache
): FundamentalSolution => {
  const bySignature = new Map(selected.map((group) => [group.definition.pointIds.slice().sort(compare).join(","), group]));
  const orders = orderCandidates(selected, startPoint, config);
  const evaluatedGroups = new Map([...bySignature].map(([key, group]) => [key, cachedGroupResult(group, refs, graph, pedestrianGraph, config, cache)]));
  const allGroups = [...evaluatedGroups.values()];
  const assigned = new Set(allGroups.flatMap((group) => group.pointIds));
  const pendingPointIds = [...points.keys()].filter((id) => !assigned.has(id)).sort(compare);
  const groupValid = allGroups.every((group) => group.limitedCircuit.valid && !group.limitedCircuit.exceedsLimit && group.completeWalking.valid);
  const limitedCircuitMeters = sum(allGroups.map((group) => group.limitedCircuitMeters));
  const fullWalkingMeters = sum(allGroups.map((group) => group.fullWalkingMeters));
  const accessMeters = sum(allGroups.map((group) => group.accessMeters));
  let best: FundamentalSolution | null = null;
  for (const order of orders) {
    const groups = order.map((key, index) => ({ ...evaluatedGroups.get(key)!, id: `${variant}-group-${index + 1}` }));
    const vehicle = cachedVehicleOrder(graph, startPoint, groups, cache);
    const valid = !!graph?.adj.size && vehicle.valid && groupValid && pendingPointIds.length === 0;
    const vehicleDistanceMeters = vehicle.distanceMeters;
    const modeledTimeSeconds = (finite(vehicleDistanceMeters) / 1000 / config.vehicleSpeedKmh) * 3600 + (finite(fullWalkingMeters) / 1000 / config.walkingSpeedKmh) * 3600 + cache.deliverySeconds;
    const solution: FundamentalSolution = {
      variant,
      objective,
      status: valid ? "complete" : "partial",
      groups,
      vehicle,
      vehicleDistanceMeters,
      limitedCircuitMeters,
      fullWalkingMeters,
      accessMeters,
      modeledTimeSeconds,
      pendingPointIds,
      diagnostics: [...new Set([...groups.flatMap((group) => group.diagnostics), ...(!vehicle.valid ? ["vehicle-path-incomplete"] : []), ...pendingPointIds.map((id) => `${id}:unassigned`)])].sort(
        compare
      ),
      operationsEvaluated,
      workLimitReached: false,
      signature: groups.map((group) => `${group.pointIds.join(",")}@${group.anchor.id}`).join("|") + `|${groups.map((group) => group.id).join(",")}`,
    };
    const score = (candidate: FundamentalSolution): [number, number, number, string] => [
      candidate.status === "complete" ? 0 : 1,
      objective === "vehicleDistance" ? candidate.vehicleDistanceMeters : candidate.modeledTimeSeconds,
      objective === "vehicleDistance" ? candidate.modeledTimeSeconds : candidate.vehicleDistanceMeters,
      candidate.signature,
    ];
    const compareScore = (a: FundamentalSolution, b: FundamentalSolution): number => {
      const left = score(a);
      const right = score(b);
      for (let index = 0; index < left.length; index++) {
        if (left[index] < right[index]) return -1;
        if (left[index] > right[index]) return 1;
      }
      return 0;
    };
    if (!best || compareScore(solution, best) < 0) best = solution;
  }
  return best ?? evaluateSelection(variant, objective, selected, refs, points, graph, pedestrianGraph, startPoint, { ...config, maxOrderEvaluations: 1 }, operationsEvaluated, cache);
};

const deduplicateDefinitions = (definitions: GroupDefinition[]): GroupDefinition[] => {
  const result = new Map<string, GroupDefinition>();
  for (const definition of definitions) {
    const normalized = definition.pointIds.slice().sort(compare);
    const key = normalized.join(",");
    if (!normalized.length || result.has(key)) continue;
    result.set(key, { ...definition, pointIds: normalized });
  }
  return [...result.values()];
};

const fixedDefinitions = (
  search: AnchorSearchResult,
  refsByVirtualId: Map<string, FundamentalReference>,
  graph: RoadGraph | null,
  pedestrianGraph: RoadGraph | null,
  config: FundamentalExperimentConfig
): GroupDefinition[] => {
  const candidates = search.candidates
    .map((candidate) => ({
      candidate,
      pointIds: candidate.pointIds
        .map((id) => refsByVirtualId.get(id)?.pointId)
        .filter((id): id is string => !!id)
        .sort(compare),
    }))
    .filter((entry) => entry.pointIds.length > 1)
    .sort((a, b) => b.pointIds.length - a.pointIds.length || compare(a.candidate.id, b.candidate.id));
  const used = new Set<string>();
  const definitions: GroupDefinition[] = [];
  for (const entry of candidates) {
    if (entry.pointIds.some((id) => used.has(id))) continue;
    const anchor = anchorFromCandidate(entry.candidate, refsByVirtualId);
    const ordered = fundamentalOrder(anchor, entry.pointIds, new Map([...refsByVirtualId.values()].map((reference) => [reference.pointId, reference])), pedestrianGraph);
    const circuit = evaluateLimitedFundamentalCircuit(pedestrianGraph, anchor, ordered, config.circuitLimitMeters);
    if (!circuit.valid || circuit.exceedsLimit) continue;
    definitions.push({ pointIds: entry.pointIds, seedAnchor: anchor });
    entry.pointIds.forEach((id) => used.add(id));
  }
  for (const reference of [...refsByVirtualId.values()].sort((a, b) => compare(a.pointId, b.pointId))) if (!used.has(reference.pointId)) definitions.push({ pointIds: [reference.pointId] });
  void graph;
  return definitions;
};

const revisableDefinitions = (individual: GroupDefinition[], fixed: GroupDefinition[], maximum: number): GroupDefinition[][] => {
  const definitions: GroupDefinition[][] = [individual, fixed];
  const base = fixed.length ? fixed : individual;
  function* merges() {
    for (let left = 0; left < base.length; left++)
      for (let right = left + 1; right < base.length; right++) yield [...base.filter((_, index) => index !== left && index !== right), { pointIds: [...base[left].pointIds, ...base[right].pointIds] }];
  }
  function* splits() {
    for (let left = 0; left < base.length; left++)
      if (base[left].pointIds.length > 1) yield [...base.filter((_, index) => index !== left), ...base[left].pointIds.map((pointId) => ({ pointIds: [pointId] }))];
  }
  function* transfers() {
    for (let from = 0; from < base.length; from++)
      for (let to = 0; to < base.length; to++)
        if (from !== to && base[from].pointIds.length > 1)
          for (const pointId of base[from].pointIds)
            yield base.map((group, index) => (index === from ? { pointIds: group.pointIds.filter((id) => id !== pointId) } : index === to ? { pointIds: [...group.pointIds, pointId] } : group));
  }
  const iterators = [merges(), splits(), transfers()];
  while (definitions.length < maximum) {
    let added = false;
    for (const iterator of iterators) {
      const next = iterator.next();
      if (!next.done) {
        definitions.push(deduplicateDefinitions(next.value));
        added = true;
      }
      if (definitions.length >= maximum) break;
    }
    if (!added) break;
  }
  return definitions.slice(0, maximum);
};

const anchorsForGroup = (
  variant: FundamentalVariant,
  definition: GroupDefinition,
  refs: Map<string, FundamentalReference>,
  candidates: ExperimentAnchor[],
  config: FundamentalExperimentConfig
): ExperimentAnchor[] => {
  const options = variant === "individual" ? [] : candidates.filter((candidate) => definition.pointIds.every((id) => candidate.fundamentalPointIds.includes(id)));
  const defaults = definition.pointIds
    .map((id) => anchorFromReference(refs.get(id)!))
    .filter((anchor) => definition.pointIds.every((id) => haversine(anchor.position, refs.get(id)!.position) <= config.searchRadiusMeters + 1e-6));
  const unique = new Map<string, ExperimentAnchor>();
  const bySegment = new Map<string, ExperimentAnchor[]>();
  for (const option of options.sort((a, b) => compare(a.id, b.id))) {
    const key = option.segment?.id ?? option.id;
    const entries = bySegment.get(key) ?? [];
    entries.push(option);
    bySegment.set(key, entries);
  }
  const diversified: ExperimentAnchor[] = [];
  while (diversified.length < config.maxCandidatesPerGroup && bySegment.size)
    for (const [key, entries] of bySegment) {
      const anchor = entries.shift();
      if (anchor) diversified.push(anchor);
      if (!entries.length) bySegment.delete(key);
      if (diversified.length >= config.maxCandidatesPerGroup) break;
    }
  for (const anchor of [...(definition.seedAnchor ? [definition.seedAnchor] : []), ...defaults, ...diversified]) if (!unique.has(anchor.id)) unique.set(anchor.id, anchor);
  return [...unique.values()].slice(0, config.maxCandidatesPerGroup);
};

interface OptimizationWork {
  evaluated: number;
  limitReached: boolean;
}

const optimizeDefinitions = (
  variant: FundamentalVariant,
  definitions: GroupDefinition[],
  refs: Map<string, FundamentalReference>,
  points: Map<string, DeliveryPoint>,
  candidates: ExperimentAnchor[],
  graph: RoadGraph | null,
  pedestrianGraph: RoadGraph | null,
  startPoint: LatLng | null,
  config: FundamentalExperimentConfig,
  objective: FundamentalObjective,
  work: OptimizationWork,
  cache: EvaluationCache
): FundamentalSolution => {
  let selected = definitions
    .map((definition) => {
      const options = anchorsForGroup(variant, definition, refs, candidates, config);
      const anchor =
        options.find((option) => {
          const evaluated = cachedGroupResult({ definition, anchor: option }, refs, graph, pedestrianGraph, config, cache);
          return evaluated.limitedCircuit.valid && !evaluated.limitedCircuit.exceedsLimit && evaluated.completeWalking.valid;
        }) ?? options[0];
      return { definition, anchor };
    })
    .filter((group): group is SelectedGroup => !!group.anchor);
  if (selected.length !== definitions.length) {
    selected = definitions.map((definition) => ({ definition, anchor: anchorFromReference(refs.get(definition.pointIds[0])!) }));
  }
  let best = evaluateSelection(variant, objective, selected, refs, points, graph, pedestrianGraph, startPoint, config, work.evaluated, cache);
  let exhausted = false;
  for (let pass = 0; pass < config.maxRefinementPasses; pass++) {
    let changed = false;
    for (let index = 0; index < selected.length; index++) {
      const options = anchorsForGroup(variant, selected[index].definition, refs, candidates, config);
      for (const anchor of options) {
        if (anchor.id === selected[index].anchor.id) continue;
        if (work.evaluated >= config.maxGroupOperations) {
          work.limitReached = true;
          exhausted = true;
          break;
        }
        work.evaluated++;
        const moved = cachedGroupResult({ ...selected[index], anchor }, refs, graph, pedestrianGraph, config, cache);
        if (!moved.limitedCircuit.valid || moved.limitedCircuit.exceedsLimit || !moved.completeWalking.valid) continue;
        const proposal = selected.map((group, groupIndex) => (groupIndex === index ? { ...group, anchor } : group));
        const candidate = evaluateSelection(variant, objective, proposal, refs, points, graph, pedestrianGraph, startPoint, config, work.evaluated, cache);
        const candidateScore = candidate.status === "complete" ? (objective === "vehicleDistance" ? candidate.vehicleDistanceMeters : candidate.modeledTimeSeconds) : Infinity;
        const bestScore = best.status === "complete" ? (objective === "vehicleDistance" ? best.vehicleDistanceMeters : best.modeledTimeSeconds) : Infinity;
        if (candidateScore < bestScore || (candidateScore === bestScore && candidate.signature < best.signature)) {
          selected = proposal;
          best = candidate;
          changed = true;
        }
      }
      if (exhausted) break;
    }
    if (exhausted || !changed) break;
  }
  return { ...best, operationsEvaluated: work.evaluated, workLimitReached: work.limitReached };
};

const solutionForVariant = (
  variant: FundamentalVariant,
  definitions: GroupDefinition[] | GroupDefinition[][],
  sourcePoints: readonly DeliveryPoint[],
  refs: Map<string, FundamentalReference>,
  points: Map<string, DeliveryPoint>,
  candidates: ExperimentAnchor[],
  graph: RoadGraph | null,
  pedestrianGraph: RoadGraph | null,
  startPoint: LatLng | null,
  config: FundamentalExperimentConfig,
  objective: FundamentalObjective
): { solution: FundamentalSolution; definitionsEvaluated: number } => {
  const alternatives = Array.isArray(definitions[0]) ? (definitions as GroupDefinition[][]) : [definitions as GroupDefinition[]];
  const work: OptimizationWork = { evaluated: 0, limitReached: false };
  const cache = evaluationCacheFor(sourcePoints, points, graph, pedestrianGraph, variant, objective, startPoint, config);
  let best: FundamentalSolution | null = null;
  for (const [index, candidateDefinitions] of alternatives.entries()) {
    const allowance = Math.ceil((config.maxGroupOperations - work.evaluated) / (alternatives.length - index));
    const solution = optimizeDefinitions(
      variant,
      candidateDefinitions,
      refs,
      points,
      candidates,
      graph,
      pedestrianGraph,
      startPoint,
      { ...config, maxGroupOperations: work.evaluated + allowance },
      objective,
      work,
      cache
    );
    if (
      !best ||
      (solution.status === "complete" &&
        (best.status !== "complete" || (objective === "vehicleDistance" ? solution.vehicleDistanceMeters < best.vehicleDistanceMeters : solution.modeledTimeSeconds < best.modeledTimeSeconds)))
    )
      best = solution;
  }
  const solution = best ?? optimizeDefinitions(variant, alternatives[0], refs, points, candidates, graph, pedestrianGraph, startPoint, config, objective, work, cache);
  return {
    solution: {
      ...solution,
      operationsEvaluated: work.evaluated,
      workLimitReached: work.limitReached,
      diagnostics: [...new Set([...solution.diagnostics, ...(work.limitReached ? ["group-operation-limit"] : [])])].sort(compare),
    },
    definitionsEvaluated: alternatives.length,
  };
};

const dominated = (left: FundamentalSolution, right: FundamentalSolution): boolean =>
  left.vehicleDistanceMeters >= right.vehicleDistanceMeters &&
  left.modeledTimeSeconds >= right.modeledTimeSeconds &&
  (left.vehicleDistanceMeters > right.vehicleDistanceMeters || left.modeledTimeSeconds > right.modeledTimeSeconds);

export const runFundamentalExperiment = (input: FundamentalExperimentInput): FundamentalExperimentResult => {
  const config = normalizeConfig(input.config);
  const inputDiagnostics = pointValidation(input.points, input.graph);
  if (
    Object.entries(config).some(
      ([key, value]) =>
        !Number.isFinite(value) ||
        value < 0 ||
        (key.startsWith("max") && (!Number.isSafeInteger(value) || value < 1)) ||
        (["sampleStepMeters", "walkingSpeedKmh", "vehicleSpeedKmh"].includes(key) && value <= 0)
    )
  )
    inputDiagnostics.push("invalid-config");
  if (inputDiagnostics.length) return { status: "invalid", config, fundamentals: [], variants: [], nonDominated: [], diagnostics: inputDiagnostics, search: null };
  input.onPhase?.("fundamentals");
  const referenceSet = referenceSetFor(input.points, input.graph);
  const refs = new Map(referenceSet.references.map((reference) => [reference.pointId, reference]));
  const points = new Map(input.points.map((point) => [point.id, point]));
  input.onPhase?.("anchor-search");
  const search = anchorSearchFor(referenceSet, input.graph, config, (phase) => input.onPhase?.(phase));
  const byVirtualId = new Map(referenceSet.references.map((reference) => [reference.virtualId, reference]));
  const candidateAnchors = search.candidates.map((candidate) => anchorFromCandidate(candidate, byVirtualId));
  const pedestrian = input.pedestrianGraph ?? (input.graph ? derivePedestrianGraph(input.graph) : null);
  const individual = referenceSet.references.map((reference) => ({ pointIds: [reference.pointId] }));
  const fixed = fixedDefinitions(search, byVirtualId, input.graph, pedestrian, config);
  const revisableWithOverflow = revisableDefinitions(individual, fixed, config.maxRevisableAlternatives + 1);
  const revisableDefinitionLimitReached = revisableWithOverflow.length > config.maxRevisableAlternatives;
  const definitionsByVariant: Record<FundamentalVariant, GroupDefinition[] | GroupDefinition[][]> = {
    individual,
    "fixed-groups": fixed,
    revisable: revisableWithOverflow.slice(0, config.maxRevisableAlternatives),
  };
  const variants = (Object.keys(definitionsByVariant) as FundamentalVariant[]).map((kind) => {
    input.onPhase?.(`optimize:${kind}:vehicleDistance`);
    const vehicle = solutionForVariant(kind, definitionsByVariant[kind], input.points, refs, points, candidateAnchors, input.graph, pedestrian, input.startPoint ?? null, config, "vehicleDistance");
    input.onPhase?.(`optimize:${kind}:modeledTime`);
    const time = solutionForVariant(kind, definitionsByVariant[kind], input.points, refs, points, candidateAnchors, input.graph, pedestrian, input.startPoint ?? null, config, "modeledTime");
    return {
      kind,
      bestByObjective: { vehicleDistance: vehicle.solution, modeledTime: time.solution },
      definitionsEvaluated: Math.max(vehicle.definitionsEvaluated, time.definitionsEvaluated),
      definitionLimitReached: kind === "revisable" && revisableDefinitionLimitReached,
    };
  });
  const allSolutions = variants.flatMap((variant) => Object.values(variant.bestByObjective));
  const feasible = allSolutions.filter((solution) => solution.status === "complete");
  const nonDominated = feasible.filter((solution) => !feasible.some((other) => other.signature !== solution.signature && dominated(solution, other)));
  const diagnostics = [
    ...referenceSet.diagnostics,
    ...(search.diagnostics.limitReached ? ["anchor-search-limit"] : []),
    ...variants.flatMap((variant) => Object.values(variant.bestByObjective).flatMap((solution) => solution.diagnostics)),
  ];
  input.onPhase?.("complete");
  return {
    status: search.status === "complete" && variants.every((variant) => Object.values(variant.bestByObjective).every((solution) => solution.status === "complete")) ? "complete" : "partial",
    config,
    fundamentals: referenceSet.references,
    variants,
    nonDominated,
    diagnostics: [...new Set(diagnostics)].sort(compare),
    search,
  };
};
