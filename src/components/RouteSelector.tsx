import React, { useState, useRef, useEffect } from "react";
import type { RoutesMap } from "../types";
import { getVehicleType } from "../utils/formatters";
import { UI_LABELS } from "../constants";

interface Props {
  /** All routes extracted from Excel file */
  routes: RoutesMap;
  /** Currently selected route name */
  selectedRoute: string | null;
  /** Called when user selects a route */
  onSelect: (route: string) => void;
  /** Reserved for future use */
  onSearch: (at: string) => void;
  /** Available columns from Excel file */
  availableCols?: string[] | null;
}

/**
 * RouteSelector - Custom dropdown to select a route from loaded data
 *
 * Custom dropdown with full styling control, no browser-native hover effects.
 * Shows route name and vehicle type (if available).
 * Routes are already sorted by excelProcessor (A-1, A-2, B-1, etc.)
 *
 * @param {RoutesMap} routes - All routes extracted from Excel file
 * @param {string | null} selectedRoute - Currently selected route name
 * @param {(route: string) => void} onSelect - Called when user selects a route
 * @param {(at: string) => void} onSearch - Reserved for future use
 * @param {string[] | null} availableCols - Available columns from Excel file
 * @returns {JSX.Element} The rendered RouteSelector component
 */
export const RouteSelector: React.FC<Props> = ({ routes, selectedRoute, onSelect, availableCols }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /**
   * Routes are already sorted by excelProcessor.ts
   * Format: "A-1", "A-12", "B-3", "P-41NS"
   */
  const sortedRoutes = Object.keys(routes);

  const totalRoutes = sortedRoutes.length;
  const hasRoutes = totalRoutes > 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false); // Close the dropdown if clicked outside
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []); // Empty dependency array ensures this effect runs only once on mount and cleanup on unmount

  // Handle route selection
  const handleSelect = (route: string) => {
    onSelect(route);
    setIsOpen(false);
  };

  // Get display text for the dropdown button
  const getDisplayText = () => {
    if (!hasRoutes) return UI_LABELS.ROUTE_SELECTOR.WAITING_FILE;
    if (!selectedRoute) return UI_LABELS.ROUTE_SELECTOR.CHOOSE_ROUTE(totalRoutes);
    const vehicle = getVehicleType(routes[selectedRoute], availableCols);
    return `${selectedRoute}${vehicle && vehicle !== UI_LABELS.COMMON.NO_DATA ? ` (${vehicle})` : ""}`; // Display route name and vehicle type
  };

  return (
    <div className="flex justify-center">
      <div className="w-full max-w-lg flex justify-center">
        <div className="relative" ref={dropdownRef}>
          {/* Custom dropdown button */}
          <button
            className={`w-80 border border-primary text-primary rounded px-4 py-2 flex items-center justify-between transition focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-50 ${
              isOpen ? "bg-primary/10" : "bg-white"
            }`}
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            disabled={!hasRoutes}
          >
            <span className="flex-1 text-sm md:text-base text-center">{getDisplayText()}</span>
            <span className={`ml-2 text-xs transition-transform ${!isOpen ? "rotate-90" : ""}`}>▼</span>
          </button>

          {/* Custom dropdown menu */}
          {isOpen && hasRoutes && (
            <div className="absolute z-50 w-full bg-white border border-primary rounded-b-lg shadow-lg shadow-primary/40 max-h-52 overflow-y-auto">
              {sortedRoutes.map((route) => {
                const vehicle = getVehicleType(routes[route], availableCols);
                const isSelected = route === selectedRoute;

                return (
                  <button
                    key={route}
                    className={`w-full text-center px-3 py-2 text-sm md:text-base transition ${isSelected ? "bg-primary text-white" : "hover:bg-primary/10 text-gray-800"}`}
                    type="button"
                    onClick={() => handleSelect(route)}
                  >
                    {route}
                    {vehicle && vehicle !== UI_LABELS.COMMON.NO_DATA ? ` (${vehicle})` : ""}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
