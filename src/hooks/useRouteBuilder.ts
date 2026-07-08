/**
 * hooks/useRouteBuilder.ts - Thin React shell over the route-builder reducer.
 *
 * All construction logic lives in utils/routing/builder.ts (pure, tested there);
 * this hook only wires useReducer with a lazy init over the imported points.
 * Points changing after mount do NOT re-init (the caller remounts per route, or
 * hydrates a persisted PlannedRoute via the HYDRATE action — RF-008).
 */

import { useReducer, type Dispatch } from "react";
import type { DeliveryPoint, RoutingConfig } from "../types/routing";
import { createInitialBuilderState, routeBuilderReducer, type RouteBuilderAction, type RouteBuilderState } from "../utils/routing/builder";

export interface RouteBuilderReturn {
  state: RouteBuilderState;
  dispatch: Dispatch<RouteBuilderAction>;
}

export const useRouteBuilder = (points: DeliveryPoint[], config?: RoutingConfig): RouteBuilderReturn => {
  const [state, dispatch] = useReducer(routeBuilderReducer, points, (initialPoints) => createInitialBuilderState(initialPoints, config));
  return { state, dispatch };
};
