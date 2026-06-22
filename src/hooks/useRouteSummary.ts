import { useMemo } from "react";
import type { RowData } from "../types";
import type { RouteSummaryData } from "../types/hooks";

import { formatDistance, summarizeNeighborhoods, getUniquePlannedATs, formatDeliveryTime, countRestrictedZipcodes, getShiftTime, getHub, getDate, getCity } from "../utils/formatters";
import { countCommercialAddresses } from "../utils/inferLocationType";
import { getTotalPacks } from "../utils/formatters";
import { getNumberOfStops } from "../utils/formatters";

/**
 * =================================================================================================================
 * Custom Hook for Computing Route Statistics
 * =================================================================================================================
 *
 * 🎯 PURPOSE:
 * Calculates summary statistics for a selected route:
 * - Number of packages
 * - Last stop number
 * - Delivery time
 * - Total distance
 * - City name
 * - AT code
 * - Number of commercial addresses
 * - Neighborhoods list
 *
 * 📚 WHY A HOOK?
 * - These calculations depend on the route data
 * - They should recalculate when data changes
 * - useMemo optimizes performance by caching results
 *
 * @param {RowData[]} rows - All deliveries for the selected route
 * @param {string[] | null} availableCols - Available columns from Excel
 * @returns {RouteSummaryData} The computed route statistics
 * ==================================================================================================================
 */
export const useRouteSummary = (rows: RowData[], availableCols: string[] | null): RouteSummaryData => {
  /**
   * ============================================================================
   * MEMOIZED COMPUTATION
   * ============================================================================
   * This entire object is only recalculated when rows or availableCols change.
   * If the parent component re-renders but these values haven't changed,
   * React will return the cached result instead of recalculating.
   */
  return useMemo(() => {
    /** Get number of packages (Num of Order or fallback to Sequence) */
    const totalPacks = getTotalPacks(rows, availableCols);

    /** Get last stop number (last non-empty STOP) */
    const lastStop = getNumberOfStops(rows, availableCols);

    /** Get raw delivery time and transform it (e.g., "1h30min" → "1 hora e 30 minutos") */
    const time = formatDeliveryTime(rows, availableCols);

    /** Get distance and format it (e.g., "20.909km" → "20.9 km") */

    const distance = formatDistance(rows, availableCols);

    /** Get city name (usually same for all deliveries in a route) */
    const city = getCity(rows, availableCols);

    /** Get all unique AT codes for this route */
    const at = getUniquePlannedATs(rows, availableCols);

    /** Count how many commercial addresses (offices/shops) vs residential */
    const commerceCount = String(countCommercialAddresses(rows, availableCols));

    /**
     * Get list of neighborhoods with delivery counts
     * Example: "Copacabana: 5, Ipanema: 3"
     */
    const neighborhoods = summarizeNeighborhoods(rows, availableCols);

    /** Count addresses restricted by Correios (Status: "Não") */
    const correiosDeliveryCount = String(countRestrictedZipcodes(rows, availableCols));

    const shiftTime = getShiftTime(rows, availableCols);

    const dateRaw = getDate(rows, availableCols);

    const hub = getHub(rows, availableCols);

    /** Return all computed values as an object */
    return {
      totalPacks,
      lastStop,
      time,
      distance,
      city,
      at,
      commerceCount,
      neighborhoods,
      correiosDeliveryCount,
      shiftTime,
      dateRaw,
      hub,
    };
    /** 📌 Dependencies: recalculate when these change */
  }, [rows, availableCols]);
};
