/**
 * ============================================================================
 * ROUTEVIEWER.TSX - Main Page Component
 * ============================================================================
 *
 * This is the MAIN PAGE of the application where everything comes together.
 * It orchestrates the entire user flow:
 *
 * 1️⃣ USER UPLOADS FILE → useRouteUploader processes it
 * 2️⃣ ROUTES ARE DISPLAYED → RouteSelector shows available routes
 * 3️⃣ USER SELECTS ROUTE → Shows summary, map, and tables
 * 4️⃣ USER CAN SEARCH → useRouteSearch finds routes by AT code
 *
 * 📚 ARCHITECTURE PATTERN: Container Component
 * - This component DOESN'T do heavy logic itself
 * - It DELEGATES to hooks (useRouteUploader, useRouteSearch)
 * - It ORCHESTRATES UI components (FileUploader, RouteMap, etc.)
 * - It MANAGES visual state (what modals are open, which route is selected)
 *
 * 🎯 KEY CONCEPTS FOR BEGINNERS:
 * - Custom Hooks → Reusable logic (see hooks folder)
 * - Component Composition → Small pieces building a big UI
 * - State Management → React's useState for UI state
 * - Conditional Rendering → {condition && <Component />}
 */

import { useState } from "react";

/**
 * ============================================================================
 * IMPORTS: UI COMPONENTS
 * ============================================================================
 * These are "presentational" components -they receive data and render UI
 * They don't manage their own complex state
 */
import { FileUploader } from "../components/FileUploader";
import { RouteSelector } from "../components/RouteSelector";
import { RouteSummary } from "../components/RouteSummary";
import { RouteMap } from "../components/RouteMap";
import { RouteTable } from "../components/RouteTable";
import { RouteSimpleTable } from "../components/RouteSimpleTable";
import { RouteSearchByAT } from "../components/RouteSearchByAT";
import { ThemeToggle } from "../components/ThemeToggle";
import { UI_LABELS } from "../constants/uiLabels";

/**
 * ============================================================================
 * IMPORTS: CUSTOM HOOKS (Business Logic)
 * ============================================================================
 * These hooks encapsulate complex logic and state management
 * 💡 Think of hooks as "mini state machines" that this component can use
 */
import { useRouteSearch } from "../hooks/useRouteSearch";
import { useRouteUploader } from "../hooks/useRouteUploader";

/**
 * ============================================================================
 * IMPORTS: UTILITY FUNCTIONS
 * ============================================================================
 * Pure functions that transform data (no side effects)
 */
import { getVehicleType } from "../utils/formatters";

function RouteViewer() {
  /* ======================================================================
      🔌 SECTION 1: CUSTOM HOOKS (Data & Business Logic)
      ======================================================================

      WHY USE CUSTOM HOOKS?
      - Separates WHAT (data) from HOW (UI)
      - Makes logic reusable across components
      - Easier to test business logic independently
      - Keeps this component focused on UI orchestration

      📖 READING ORDER FOR BEGINNERS:
      1. Read this file first to understand the overall structure
      2. Then read hooks/useRouteUploader.ts to see file processing
      3. Then read hooks/useRouteSearch.ts to see search logic
  ====================================================================== */

  /**
   * HOOK 1: File Upload & Processing
   * This hook manages:
   * - File validation (size, type)
   * - Excel parsing (using XLSX library)
   * - Route extraction and organization
   * - Error handling
   */
  const { routes, loading, error, availableCols, missingCols, handleFileUpload } = useRouteUploader();

  /**
   * HOOK 2: Route Search by AT Code
   * This hook manages:
   * - Building a search index (Planned AT → Route Name)
   * - Real-time search as user types
   * - Search result display
   */
  const { searchAT, searchResult, handleSearchChange, clearSearch } = useRouteSearch(routes);

  /* ======================================================================
      🎛️ SECTION 2: LOCAL UI STATE (What the user sees right now)
      ======================================================================

      These useState calls manage VISUAL state only - not business data.
      They answer questions like:
      - "Is the map open?"
      - "Which route is selected?"
      - "Is the table visible?"

      💡 WHY HERE AND NOT IN HOOKS?
      These states are specific to THIS page's UI. They don't need to be
      shared or reused elsewhere.
  ====================================================================== */

  /** Which route is currently selected in the dropdown */
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);

  /** Is the map modal open? (fullscreen overlay) */
  const [isMapFullScreen, setIsMapFullScreen] = useState(false);

  /** Is the detailed table modal open? */
  const [showTable, setShowTable] = useState(false);

  /** Is the simplified table modal open? */
  const [showSimpleTable, setShowSimpleTable] = useState(false);

  /* ======================================================================
      🔄 SECTION 3: DERIVED VALUES (Computed from state)
      ======================================================================

      These are NOT state - they're calculated from existing state.

      💡 WHY NOT useState?
      Because they automatically update when their dependencies change.
      No need to manually sync them.
  ====================================================================== */

  /**
   * Get all rows (deliveries) for the currently selected route
   * If no route selected or no routes loaded → empty array
   */
  const currentRows = selectedRoute && routes ? routes[selectedRoute] : [];

  /**
   * Check if we have the necessary columns to show a map
   * The !! converts truthy/falsy to boolean true/false
   */
  const mapAvailable = !!(availableCols?.includes("Latitude") && availableCols?.includes("Longitude"));

  /**
   * Extract the vehicle type from the route data (e.g., "MOTO", "VAN")
   * This scans through currentRows to find a valid value
   */
  const vehicleType = getVehicleType(currentRows, availableCols);

  /* ======================================================================
      🖼️ SECTION 4: RENDER (The UI Structure)
      ======================================================================

      This is where we build the actual HTML/JSX that users see.

      📖 UNDERSTANDING THE STRUCTURE:
      1. Main container with heading
      2. FileUploader (always visible)
      3. If routes exist:
         - Missing columns warning (if any)
         - RouteSelector dropdown
         - Search box
         - Route details (if a route is selected)
      4. Modals (map, tables) rendered conditionally

      💡 CONDITIONAL RENDERING PATTERNS:
      - {routes && <Component />}        → Render if routes exist
      - {condition ? <A /> : <B />}      → Render A or B
      - {array.length > 0 && <Alert />}  → Render if array has items
  ====================================================================== */
  return (
    <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col items-center justify-center">
      {/* Toggle de tema (provisório — ganha lugar definitivo no app shell, RF-011) */}
      <div className="fixed right-3 top-3 z-50">
        <ThemeToggle />
      </div>
      {/* ===== HEADER ===== */}
      <h1 className="text-3xl font-bold text-center mb-4">{UI_LABELS.ROUTE_VIEWER.TITLE}</h1>

      {/* ===== STEP 1: FILE UPLOAD =====
          Always visible. Receives functions and state from useRouteUploader hook.
      */}
      <FileUploader onFileUpload={handleFileUpload} loading={loading} hasRoutes={!!routes} error={error} missingCols={missingCols} />

      {/* ===== STEP 2: SHOW ROUTES (if file was uploaded successfully) =====
          This entire section only renders if 'routes' is not null/undefined.
          The && operator does short-circuit evaluation:
          - If routes is falsy → nothing renders
          - If routes is truthy → the fragment renders
          */}
      {routes && (
        <>
          {/* Dropdown to select a route */}
          <RouteSelector routes={routes} selectedRoute={selectedRoute} onSelect={setSelectedRoute} onSearch={() => {}} availableCols={availableCols} />

          {/* ===== SEARCH BAR ===== */}
          <RouteSearchByAT
            searchAT={searchAT}
            searchResult={searchResult}
            onChange={handleSearchChange}
            onSelectResult={(route) => {
              setSelectedRoute(route);
            }}
            clearSearch={clearSearch}
          />
          {/* ===== STEP 3: SHOW SELECTED ROUTE DETAILS =====
              Only renders if a route is selected
          */}
          {selectedRoute && (
            <>
              {/* Summary card with key stats + action buttons and heading */}
              <RouteSummary
                rows={currentRows}
                availableCols={availableCols}
                selectedRoute={selectedRoute}
                vehicleType={vehicleType}
                /** Open map modal */
                onViewMap={() => setIsMapFullScreen(true)}
                /** Open detailed table modal */
                onShowTable={() => setShowTable(true)}
                /** Open simple table modal */
                onShowSimpleTable={() => setShowSimpleTable(true)}
                mapAvailable={mapAvailable}
              />

              {/* Modal: Detailed Original Table */}
              {showTable && <RouteTable selectedRoute={selectedRoute} rows={currentRows} onClose={() => setShowTable(false)} />}

              {/* Modal: Simplified Table */}
              {showSimpleTable && <RouteSimpleTable rows={currentRows} selectedRoute={selectedRoute} onClose={() => setShowSimpleTable(false)} />}
            </>
          )}
        </>
      )}

      {/* ===== MODAL: FULLSCREEN MAP =====
          Renders as overlay when user clicks "Ver no Mapa"
          Only shows if:
          1. isMapFullScreen is true AND
          2. A route is selected AND
          3. Map data is available
      */}
      {isMapFullScreen && selectedRoute && <RouteMap rows={currentRows} availableCols={availableCols} onClose={() => setIsMapFullScreen(false)} />}
    </div>
  );
}

export default RouteViewer;
