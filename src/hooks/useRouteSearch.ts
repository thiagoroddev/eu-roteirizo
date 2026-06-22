import { useState, useRef, useEffect } from "react";
import type { RoutesMap } from "../types";
import type { RouteSearchReturn } from "../types/hooks";
import { COLUMN_NAMES } from "../constants";

/**
 * =======================================================================================================================
 * useRouteSearch.ts - Custom Hook for Searching Routes by AT Code
 * ======================================================================================================================
 *
 * 🎯 PURPOSE:
 * Allows users to quickly find which route a delivery belongs to by typing
 * the "Planned AT" code (like a tracking number).
 *
 * 📚 HOW IT WORKS:
 * 1. Builds an index (Map) when routes are loaded: AT code → Route name
 * 2. User types in search box → searches the index instantly
 * 3. Returns the route name if found, or "NONE" if not found
 *
 * 🔧 TECHNICAL CONCEPTS:
 * - useRef: Stores data that doesn't trigger re-renders (performance optimization)
 * - useEffect: Rebuilds search index when routes change
 * - useState: Manages search input and results
 *
 * 💡 WHY USE useRef FOR THE INDEX?
 * Because the index is used for lookups only. We don't need to re-render
 * the component when the index changes - we only care about the search result.
 *
 * 📖 EXAMPLE:
 * User types "AT202511208" → Hook finds "Route A-15" → Component can navigate to it
 *
 * Used in: RouteViewer.tsx
 *
 * @param {RoutesMap | null} routes - The loaded routes data
 * @returns {RouteSearchReturn} The search state and handlers
 * =====================================================================================================================
 */
export function useRouteSearch(routes: RoutesMap | null): RouteSearchReturn {
  // ============================================================================
  // STATE: User Input & Results
  // ============================================================================

  /** The text user is currently typing in the search box */
  const [searchAT, setSearchAT] = useState("");

  /**
   * The search result:
   * - null: No search performed yet
   * - string: The route name that was found (e.g., "A-15")
   * - "NONE": Search was performed but nothing matched
   */
  const [searchResult, setSearchResult] = useState<string | null>(null);

  /**
   * ============================================================================
   * REF: Search Index (Performance Optimization)
   * ============================================================================
   * This is an object that maps AT codes to route names for fast lookup.
   * Example: { "AT202511208": "A-15", "AT202511209": "B-3" }
   *
   * 🔑 WHY useRef?
   * - useRef persists data between renders without causing re-renders
   * - Perfect for caches, timers, DOM references
   * - .current contains the actual value
   */
  const plannedAtToRoute = useRef<Record<string, string>>({});

  /**
   * ============================================================================
   * EFFECT: Build Search Index When Routes Change
   * ============================================================================
   * This runs automatically whenever 'routes' changes (file uploaded/cleared)
   */
  useEffect(() => {
    /** Reset the index before rebuilding */
    plannedAtToRoute.current = {};

    /** If no routes, nothing to index */
    if (!routes) return;

    /** Iterate through all routes and their deliveries */
    Object.entries(routes).forEach(([routeName, rows]) => {
      rows.forEach((row) => {
        /** Get the AT code from this delivery */
        const at = row[COLUMN_NAMES.PLANNED_AT];

        /** If it exists, add to index */
        if (at) {
          plannedAtToRoute.current[String(at).trim()] = routeName;
        }
      });
    });

    // 📖 DEPENDENCY ARRAY [routes]:
    // "Re-run this effect whenever 'routes' changes"
  }, [routes]);

  /**
   * ============================================================================
   * FUNCTION: Handle Search Input Changes
   * ============================================================================
   * Called every time user types/deletes in the search box
   */
  const handleSearchChange = (val: string): void => {
    /** Update the input value */
    setSearchAT(val);

    /** If user cleared the search box, reset results */
    if (!val) {
      setSearchResult(null);
      return;
    }

    /** Look up the AT code in our pre-built index */
    const found = plannedAtToRoute.current[val.trim()];

    /** Set result: either the route name, or "NONE" */
    setSearchResult(found || "NONE");
  };

  /**
   * ============================================================================
   * FUNCTION: Clear Everything
   * ============================================================================
   * Resets search state (useful after navigating to a route)
   */
  const clearSearch = (): void => {
    setSearchAT("");
    setSearchResult(null);
  };

  /**
   * ============================================================================
   * RETURN THE HOOK API
   * ============================================================================
   */
  return {
    /** Current search input value */
    searchAT,
    /** The route that was found (or "NONE" or null) */
    searchResult,
    /** Function to call on input change */
    handleSearchChange,
    /** Function to reset everything */
    clearSearch,
  };
}
