/**
 * ============================================================================
 * constants/index.ts - Centralized Configuration & Messages
 * ============================================================================
 *
 * This file stores all "magic values" in one place.
 *
 * 🎯 WHY CENTRALIZE CONSTANTS?
 * ❌ BAD: Hardcoding values everywhere
 *    if (file.size > 10485760) { ... }  // What is 10485760?!
 *
 * ✅ GOOD: Named constant
 *    if (file.size > FILE_CONFIG.MAX_FILE_SIZE) { ... }  // Clear!
 *
 * 📚 BENEFITS:
 * - Easy to find and change values
 * - No typos in repeated strings
 * - Self-documenting code
 * - Easier to translate (all messages in one place)
 *
 * 🔧 'as const' KEYWORD:
 * Makes the object immutable and narrows types to literal values.
 * Example: Without: string[]
 *          With: readonly [".xlsx", ".csv"]
 */

// ========================================
// UPLOAD INSTRUCTIONS
// ========================================

/**
 * Instructions shown to users before they upload a file.
 * Displayed in the FileUploader component.
 *
 * @type {readonly ["A planilha enviada deve obrigatoriamente estar em seu estado original, sem alteração (cabeçalho em inglês) e de preferência completa.", "Colunas obrigatórias para visualizar no mapa: \"Corridor Cage\", \"Latitude\", \"Longitude\".", "Outras colunas utilizadas: Sequence, Stop, Num of Order, Total Distance,...}
 */
export const UPLOAD_INSTRUCTIONS = [
  "A planilha a ser enviada deve estar em seu estado original, ou seja, sem alterações(manter cabeçalho em inglês) e de preferência completa.",
  'Colunas obrigatórias para visualizar marcadores no mapa: "Corridor Cage", "Latitude", "Longitude".',
  "Outras colunas utilizadas: Sequence, Stop, Num of Order, Total Distance, Zipcode, Date, Shift Time, City, Neighborhood, Delivery Time, Location Type, Planned AT, Destination Station, Planned Vehicle Type.",
  "Colunas com nomes diferentes das citadas acima serão ignoradas.",
  "Não compartilhe dados pertencentes à empresa com ninguém fora do grupo de escala.",
] as const;

/** Instructions for the single-route flow, shown as the 2nd block of the HOME spoiler (fluxo §15.2, TASK-RF-022.2). */
export const UPLOAD_INSTRUCTIONS_SINGLE_ROUTE = [
  "Exporte a sua rota no app oficial da empresa e importe o arquivo aqui.",
  'A rota única é detectada automaticamente (planilha sem a coluna "Corridor Cage").',
  'Colunas obrigatórias: apenas "Latitude" e "Longitude".',
] as const;

// ========================================
// FILE VALIDATION CONFIG
// ========================================

/**
 *  Configuration for file upload validation.
 * Used by useRouteUploader hook.
 *
 * @type {{ readonly ACCEPTED_EXTENSIONS: readonly [".xlsx", ".csv"]; readonly MAX_FILE_SIZE: number; readonly ENCODING: "UTF-8"; }}
 */
export const FILE_CONFIG = {
  /** Accepted file extensions */
  ACCEPTED_EXTENSIONS: [".xlsx", ".csv"],

  /** Maximum file size in bytes (10MB = 10 * 1024 * 1024) */
  MAX_FILE_SIZE: 10 * 1024 * 1024,

  /** Expected file encoding */
  ENCODING: "UTF-8",
} as const;

// ========================================
// UI TIMING
// ========================================

/**
 * Durations for UI elements in milliseconds.
 * Centralized for consistency across the app.
 *
 * @type {3000}
 */
export const NOTIFICATION_DURATION = 3000; // 3 seconds

// ========================================
// MAP CONFIGURATION
// ========================================

/**
 *  Configuration for the Leaflet map component.
 * Defines bounds, zoom levels, and rendering options.
 *
 * @type {{ readonly RIO_BOUNDS: { readonly SOUTH_WEST: { readonly lat: -23.02; readonly lng: -43.42; }; readonly NORTH_EAST: { readonly lat: -22.74; readonly lng: -43.08; }; }; readonly ZOOM: { readonly MIN: 14; readonly MAX: 19; readonly DEFAULT: 16; }; readonly TILE_SIZE: 256; readonly KEEP_BUFFER: 2; }}
 */
export const MAP_CONFIG = {
  /** Default Leaflet Icon Settings (Base to Scale) */
  DEFAULT_ICON: {
    SIZE: [25, 41],
    ANCHOR: [12, 41],
    POPUP_ANCHOR: [1, -34],
    TOOLTIP_ANCHOR: [16, -28],
  },

  /**Visual settings for the app's custom markers
   * Choose the desired width in pixels for the icons on the map and the system will calculate the size proportionally.
   * Remember to change the proportions of the icons before changing this value.
   */
  MARKER: {
    TARGET_WIDTH_PX: 40,
  },

  /** Geographic bounds for Rio de Janeiro */
  RIO_BOUNDS: {
    SOUTH_WEST: { lat: -23.02, lng: -43.42 },
    NORTH_EAST: { lat: -22.74, lng: -43.08 },
  },

  /** Zoom level constraints */
  ZOOM: {
    MIN: 14, // The lower it is, the wider the view of the area.
    MAX: 19, // The higher it is, the closer it gets (street level, like the official app)
    DEFAULT: 16,
  },

  /** Map tile rendering settings */
  TILE_SIZE: 256,
  KEEP_BUFFER: 2,
} as const;

// ========================================
// EXCEL COLUMN NAMES
// ========================================

/**
 * Standard column names from the Excel files.
 * Having these as constants prevents typos when accessing data.
 *
 * 💡 USAGE:
 * Instead of: row["Corridor Cage"]  // Could typo this!
 * Use: row[COLUMN_NAMES.CORRIDOR_CAGE]  // IDE autocomplete!
 *
 * @type {{ readonly CORRIDOR_CAGE: "Corridor Cage"; readonly LATITUDE: "Latitude"; readonly LONGITUDE: "Longitude"; readonly SEQUENCE: "Sequence"; readonly STOP: "Stop"; readonly NUM_OF_ORDER: "Num of Order"; ... 8 more ...; readonly PLANNED_VEHICLE_TYPE: "Planned Vehicle Type"; }}
 */
export const COLUMN_NAMES = {
  CORRIDOR_CAGE: "Corridor Cage",
  LATITUDE: "Latitude",
  LONGITUDE: "Longitude",
  SEQUENCE: "Sequence",
  STOP: "Stop",
  NUM_OF_ORDER: "Num of Order",
  TOTAL_DISTANCE: "Total Distance",
  ZIPCODE: "Zipcode",
  DATE: "Date",
  SHIFT_TIME: "Shift Time",
  DESTINATION_ADDRESS: "Destination Address",
  CITY: "City",
  NEIGHBORHOOD: "Neighborhood",
  DELIVERY_TIME: "Delivery Time",
  LOCATION_TYPE: "Location Type",
  PLANNED_AT: "Planned AT",
  PLANNED_VEHICLE_TYPE: "Planned Vehicle Type",
  HUB: "Destination Station",
  /** Shopee single-route export: per-package tracking number (one row = one package). */
  SPX_TN: "SPX TN",
} as const;

/**
 * Columns that MUST be present in the Excel file.
 * Without coordinates there is nothing to plot, so they are the only hard
 * requirement. "Corridor Cage" is intentionally NOT here: its presence/absence
 * switches the file between multi-route and single-route mode (see excelProcessor).
 *
 * @type {readonly ["Latitude", "Longitude"]}
 */
export const MANDATORY_COLUMNS = [COLUMN_NAMES.LATITUDE, COLUMN_NAMES.LONGITUDE] as const;

/**
 * Columns that are nice to have but not required.
 * The app will work without them, but with reduced functionality.
 */
export const OPTIONAL_COLUMNS = [
  COLUMN_NAMES.SEQUENCE,
  COLUMN_NAMES.STOP,
  COLUMN_NAMES.NUM_OF_ORDER,
  COLUMN_NAMES.TOTAL_DISTANCE,
  COLUMN_NAMES.ZIPCODE,
  COLUMN_NAMES.DATE,
  COLUMN_NAMES.SHIFT_TIME,
  COLUMN_NAMES.DESTINATION_ADDRESS,
  COLUMN_NAMES.CITY,
  COLUMN_NAMES.NEIGHBORHOOD,
  COLUMN_NAMES.DELIVERY_TIME,
  COLUMN_NAMES.LOCATION_TYPE,
  COLUMN_NAMES.PLANNED_AT,
  COLUMN_NAMES.PLANNED_VEHICLE_TYPE,
  COLUMN_NAMES.HUB,
] as const;

/**
 * Aliases de cabeçalho: variantes do arquivo real → nome canônico (COLUMN_NAMES).
 * A planilha de rota única usa alguns cabeçalhos não-canônicos (TASK-RF-003);
 * normalizamos logo após o parse para todos os consumidores verem o nome canônico.
 * Só variantes CONHECIDAS são renomeadas → seguro para o multi-rota (já canônico).
 * Extensível: novos formatos (lançamento nacional) entram aqui.
 */
export const COLUMN_ALIASES: Readonly<Record<string, string>> = {
  Bairro: COLUMN_NAMES.NEIGHBORHOOD,
  "Zipcode/Postal code": COLUMN_NAMES.ZIPCODE,
  "Postal code": COLUMN_NAMES.ZIPCODE,
  "AT ID": COLUMN_NAMES.PLANNED_AT,
};

// ========================================
// ICON KEYS
// ========================================

/**
 * Centralized keys for marker icons to avoid magic strings across the codebase.
 * Use these constants when selecting or registering icons.
 */
export const ICON_KEYS = {
  HOME: "HOME",
  OFFICE: "OFFICE",
  HOME_CORRECTED: "HOME_CORRECTED",
  OFFICE_CORRECTED: "OFFICE_CORRECTED",
  INDEFINITE: "INDEFINITE",
} as const;

// constants/index.ts

// LOCATION_TYPES kept minimal and aligned to ICON_KEYS to avoid duplicate
// definitions. Do NOT duplicate `NO_DATA` here — use `MESSAGES.INFO.NO_DATA`
// for the canonical "no data" sentinel used across the app.
export const LOCATION_TYPES = {
  HOME: ICON_KEYS.HOME,
  OFFICE: ICON_KEYS.OFFICE,
  INDEFINITE: ICON_KEYS.INDEFINITE,
} as const;

// (UI_LABELS moved below to include structured STATUS and compatibility shorthands)

// ========================================
// INTERNAL SENTINELS (Logic Only)
// ========================================

/**
 * Codes used ONLY in logic. Never shown directly to users.
 */
export const DATA_STATUS = {
  EMPTY: "EMPTY", // Valor presente mas vazio ("" ou "-")
  MISSING: "MISSING", // Coluna ausente ou undefined/null
  INVALID: "INVALID", // Valor incompatível com o tipo esperado
  UNKNOWN: "UNKNOWN", // Lógica não conseguiu determinar
} as const;

export type DataStatus = (typeof DATA_STATUS)[keyof typeof DATA_STATUS];

// ========================================
// USER-FACING LABELS / MESSAGES (Português)
// ========================================

// Import UI_LABELS from centralized uiLabels file for internationalization
import { UI_LABELS as _UI_LABELS } from "./uiLabels";
export { UI_LABELS } from "./uiLabels";

/**
 * Maps internal status codes to user-facing labels.
 *
 * @param {DataStatus} code - The internal status code to convert
 * @returns {string} The user-facing label in Portuguese
 */
export const presentStatus = (code: DataStatus): string => {
  if (code === DATA_STATUS.INVALID) return _UI_LABELS.INFO.INVALID_DATA;
  // EMPTY, MISSING, UNKNOWN convergem para "Sem dados"
  return _UI_LABELS.COMMON.NO_DATA;
};

export const EXCEL_EMPTY_VALUE = "-" as const;
