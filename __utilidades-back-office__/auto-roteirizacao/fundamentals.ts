import { COLUMN_NAMES } from "../../src/constants";
import type { DeliveryPoint, LatLng } from "../../src/types/routing";
import type { AnchorSegment } from "../../src/types/autoRouting";
import type { NodeId, RoadGraph } from "../../src/utils/routing/graph";
import { nearestEdge } from "../../src/utils/routing/match";
import { suggestVehicleStop } from "../../src/utils/routing/vehicleStop";

export interface FundamentalReference {
  pointId: string;
  virtualId: string;
  addressKey: string;
  originalPosition: LatLng;
  position: LatLng;
  segment: AnchorSegment | null;
  projectionT: number | null;
  source: "projection" | "fallback";
  diagnostics: string[];
}

export interface FundamentalReferenceSet {
  references: FundamentalReference[];
  virtualPoints: DeliveryPoint[];
  diagnostics: string[];
}

const nodeKey = (id: NodeId): string => `${typeof id}:${String(id)}`;
const compare = (a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0);

const normalizeText = (value: unknown): string =>
  String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

/**
 * Conservative identity key for an address. Coordinates remain part of the
 * key: textual equality alone must not fuse two buildings in different places.
 */
export const addressIdentityKey = (point: DeliveryPoint): string => {
  const first = point.packages[0]?.rawData ?? {};
  return [normalizeText(point.address), normalizeText(first[COLUMN_NAMES.CITY]), normalizeText(first[COLUMN_NAMES.ZIPCODE]), point.lat.toFixed(6), point.lng.toFixed(6)].join("|");
};

const packageAddressKeys = (point: DeliveryPoint): string[] =>
  [
    ...new Set(
      point.packages.map((pkg) =>
        [
          normalizeText(pkg.rawData[COLUMN_NAMES.DESTINATION_ADDRESS] ?? point.address),
          normalizeText(pkg.rawData[COLUMN_NAMES.CITY]),
          normalizeText(pkg.rawData[COLUMN_NAMES.ZIPCODE]),
          point.lat.toFixed(6),
          point.lng.toFixed(6),
        ].join("|")
      )
    ),
  ].sort(compare);

const segmentFor = (graph: RoadGraph, from: NodeId, to: NodeId): AnchorSegment | null => {
  const edge = (graph.adj.get(from) ?? []).find((candidate) => candidate.to === to);
  const fromCoordinate = graph.coords.get(from);
  const toCoordinate = graph.coords.get(to);
  if (!edge || !fromCoordinate || !toCoordinate) return null;
  const [first, last] = compare(nodeKey(from), nodeKey(to)) <= 0 ? [from, to] : [to, from];
  const id = JSON.stringify([nodeKey(first), nodeKey(last), edge.wayName, edge.highway ?? "", edge.isRoundabout ?? false]);
  const directions = [...graph.adj.entries()]
    .flatMap(([candidateFrom, edges]) =>
      edges
        .filter((candidate) => (candidateFrom === first && candidate.to === last) || (candidateFrom === last && candidate.to === first))
        .map((candidate) => ({ from: candidateFrom, to: candidate.to }))
    )
    .sort((a, b) => compare(nodeKey(a.from), nodeKey(b.from)) || compare(nodeKey(a.to), nodeKey(b.to)));
  return { id, from: first, to: last, wayName: edge.wayName, directions };
};

const virtualPoint = (point: DeliveryPoint, reference: FundamentalReference): DeliveryPoint => ({
  ...point,
  id: reference.virtualId,
  lat: reference.position.lat,
  lng: reference.position.lng,
  address: `${point.address} [fundamental]`,
  packages: point.packages.map((pkg) => ({ ...pkg, rawData: { ...pkg.rawData } })),
});

/**
 * Calculates one immutable fundamental reference for each product point.
 * `suggestVehicleStop` remains the sole default projection rule; human anchors
 * and grouping choices are deliberately absent from this function.
 */
export const buildFundamentalReferences = (points: readonly DeliveryPoint[], graph: RoadGraph | null): FundamentalReferenceSet => {
  const diagnostics: string[] = [];
  const references = [...points]
    .slice()
    .sort((a, b) => compare(a.id, b.id))
    .map((point): FundamentalReference => {
      const edge = graph ? nearestEdge(graph, point) : null;
      const position = suggestVehicleStop(graph, point);
      const pointDiagnostics: string[] = [];
      const addressKeys = packageAddressKeys(point);
      if (addressKeys.length > 1) pointDiagnostics.push("mixed-address-identities");
      if (!edge) pointDiagnostics.push(graph ? "no-road-segment" : "missing-graph");
      const reference: FundamentalReference = {
        pointId: point.id,
        virtualId: `fundamental:${point.id}`,
        addressKey: addressIdentityKey(point),
        originalPosition: { lat: point.lat, lng: point.lng },
        position: { lat: position.lat, lng: position.lng },
        segment: edge && graph ? segmentFor(graph, edge.from, edge.to) : null,
        projectionT:
          edge && graph
            ? (() => {
                const a = graph.coords.get(edge.from);
                const b = graph.coords.get(edge.to);
                if (!a || !b) return null;
                const dLat = b.lat - a.lat;
                const dLng = b.lng - a.lng;
                const denominator = dLat * dLat + dLng * dLng;
                return denominator === 0 ? 0 : ((position.lat - a.lat) * dLat + (position.lng - a.lng) * dLng) / denominator;
              })()
            : null,
        source: edge ? "projection" : "fallback",
        diagnostics: pointDiagnostics,
      };
      diagnostics.push(...pointDiagnostics.map((diagnostic) => `${point.id}:${diagnostic}`));
      return reference;
    });
  const byPointId = new Map(points.map((point) => [point.id, point]));
  const virtualPoints = references.map((reference) => virtualPoint(byPointId.get(reference.pointId)!, reference));
  return { references, virtualPoints, diagnostics: diagnostics.sort(compare) };
};

export const fundamentalByPointId = (set: FundamentalReferenceSet): Map<string, FundamentalReference> => new Map(set.references.map((reference) => [reference.pointId, reference]));
