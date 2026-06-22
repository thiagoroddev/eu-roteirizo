/**
 * Example data showing ideal Excel file structure
 *
 * Contains fictional delivery data to demonstrate:
 * - Required column names and format
 * - Expected data types for each field
 * - Complete route structure example
 *
 * Displayed in ExampleTable component before file upload
 */

/**
 * Interface defining the structure of example row data
 *
 * Represents a single delivery entry with all required fields
 * for the Excel file format expected by the application.
 */
export interface ExampleRowData {
  /** Sequential number of the delivery in the route */
  sequence: number;
  /** Stop number in the route */
  stop: number;
  /** Number of orders/packages at this stop */
  numOfOrder: number;
  /** Total distance accumulated to this point */
  totalDistance: string;
  /** ZIP code for delivery location */
  zipcode: string;
  /** Date of AT */
  date: string;
  /** Shift time */
  shiftTime: string;
  /** Full destination address */
  destinationAddress: string;
  /** City name */
  city: string;
  /** Neighborhood name */
  neighborhood: string;
  /** Latitude coordinate (formatted as string) */
  latitude: string;
  /** Longitude coordinate (formatted as string) */
  longitude: string;
  /** Estimated delivery time */
  deliveryTime: string;
  /** Location type (HOME, OFFICE, COMMERCIAL) */
  locationType: string;
  /** Planned AT code */
  plannedAt: string;
  /** Corridor cage identifier */
  corridorCage: string;
  /** Hub identifier */
  hub: string;
  /** Planned vehicle type */
  plannedVehicle: string;
}

/**
 * Array of example delivery data for demonstration
 *
 * Contains fictional but realistic delivery entries showing
 * the expected format and data types for Excel file uploads.
 */
export const EXAMPLE_TABLE_DATA: ExampleRowData[] = [
  {
    sequence: 1,
    stop: 1,
    numOfOrder: 10,
    totalDistance: "20.909km",
    zipcode: "21050-624",
    date: "2025-11-25",
    shiftTime: "04:00-09:00",
    destinationAddress: "Avenida Exemplo, 2343, Bloco 3 - Apto 10",
    city: "Rio de Janeiro",
    neighborhood: "Del Castilho",
    latitude: "-934.759.539",
    longitude: "-125677394",
    deliveryTime: "3h30min",
    locationType: "HOME",
    plannedAt: "AT202511104OKE",
    corridorCage: "L-29",
    hub: "LM Hub_RJ_Ilha do Governador",
    plannedVehicle: "MOTO",
  },
  {
    sequence: 2,
    stop: 2,
    numOfOrder: 5,
    totalDistance: "10.309km",
    zipcode: "22010-000",
    date: "2025-11-25",
    shiftTime: "04:00—09:00",
    destinationAddress: "Rua dos Entregadores, 123",
    city: "Rio de Janeiro",
    neighborhood: "Copacabana",
    latitude: "-738.454.511",
    longitude: "-156566870",
    deliveryTime: "1h10min",
    locationType: "-",
    plannedAt: "AT202518749DCFG",
    corridorCage: "L-10",
    hub: "LM Hub_RJ_Ilha do Governador",
    plannedVehicle: "PASSEIO",
  },
  {
    sequence: 3,
    stop: 3,
    numOfOrder: 2,
    totalDistance: "30.209km",
    zipcode: "20040-020",
    date: "2025-11-25",
    shiftTime: "04:00—09:00",
    destinationAddress: "Alameda Topzeira, 400",
    city: "Rio de Janeiro",
    neighborhood: "Ipanema",
    latitude: "-914.000.000",
    longitude: "-243405000",
    deliveryTime: "25min",
    locationType: "HOME",
    plannedAt: "AT202511180ZZZZ",
    corridorCage: "L-5",
    hub: "LM Hub_RJ_Ilha do Governador",
    plannedVehicle: "VAN",
  },
];

/**
 * Column definitions for the example table display
 *
 * Maps internal data keys to user-friendly column labels
 * for displaying the example data in a table format.
 */
export const EXAMPLE_TABLE_COLUMNS = [
  { key: "sequence", label: "Sequence" },
  { key: "stop", label: "Stop" },
  { key: "numOfOrder", label: "Num of Order" },
  { key: "totalDistance", label: "Total Distance" },
  { key: "zipcode", label: "Zipcode" },
  { key: "date", label: "Date" },
  { key: "shiftTime", label: "Shift Time" },
  { key: "destinationAddress", label: "Destination Address" },
  { key: "city", label: "City" },
  { key: "neighborhood", label: "Neighborhood" },
  { key: "latitude", label: "Latitude" },
  { key: "longitude", label: "Longitude" },
  { key: "deliveryTime", label: "Delivery Time" },
  { key: "locationType", label: "Location Type" },
  { key: "plannedAt", label: "Planned AT" },
  { key: "corridorCage", label: "Corridor Cage" },
  { key: "hub", label: "Destination Station" },
  { key: "plannedVehicle", label: "Planned Vehicle" },
] as const;
