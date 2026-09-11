import type { DeliveryPoint, LatLng } from "./routing";
import type { NodeId, RoadGraph } from "../utils/routing/graph";

/** Spatial alternatives only. Vehicle paths and walking feasibility are not yet certified. */
export interface AnchorSearchInput {
  points: readonly DeliveryPoint[];
  graph: RoadGraph | null;
  radiusMeters: number;
  ignoredPointIds?: readonly string[];
  options?: Partial<AnchorSearchOptions>;
  /** Optional external instrumentation; clocks never affect the deterministic search result. */
  onPhase?: (phase: "index" | "coverage" | "grouping" | "complete") => void;
}

export interface AnchorSearchOptions {
  sampleStepMeters: number;
  maxCandidates: number;
  maxDistanceChecks: number;
  maxSegments: number;
  maxGridCells: number;
  maxGroupChecks: number;
}

export interface AnchorSegment {
  id: string;
  from: NodeId;
  to: NodeId;
  wayName: string;
  /** Keep both accesses of a two-way street, without inventing the reverse of a one-way. */
  directions: { from: NodeId; to: NodeId }[];
}

export type AnchorSource = "projection" | "endpoint" | "sample" | "coverage-boundary" | "coverage-midpoint";

export interface AnchorCandidate {
  id: string;
  position: LatLng;
  segment: AnchorSegment;
  t: number;
  sources: AnchorSource[];
  pointIds: string[];
  maxDistanceMeters: number;
}

export interface DefaultSeedAnchor {
  seedPointId: string;
  position: LatLng | null;
  withinRadius: boolean;
}

/** Provisional disjoint cover; later stages may select a different candidate or regroup. */
export interface AnchorGroup {
  candidateId: string;
  seedPointId: string;
  defaultVehicleStop: LatLng;
  vehicleStop: LatLng;
  vehicleStopIsDefault: boolean;
  pointIds: string[];
  packageCount: number;
}

export type AnchorPendingReason = "invalid-input" | "missing-graph" | "no-candidate-in-radius" | "search-limit";

export interface AnchorSearchResult {
  status: "complete" | "partial" | "invalid";
  radiusMeters: number;
  candidates: AnchorCandidate[];
  defaultAnchors: DefaultSeedAnchor[];
  groups: AnchorGroup[];
  pending: { pointId: string; reason: AnchorPendingReason }[];
  ignoredPointIds: string[];
  errors: string[];
  diagnostics: {
    segments: number;
    nearbySegments: number;
    gridEntries: number;
    distanceChecks: number;
    groupChecks: number;
    limitReached: boolean;
  };
}
