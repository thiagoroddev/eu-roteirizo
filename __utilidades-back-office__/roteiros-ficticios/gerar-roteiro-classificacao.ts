/**
 * Generates the fake route a human imports to check address classification in the app
 * (TASK-BG-021). One stop per case of src/__tests__/utils/addressClassificationCases.ts, the same
 * table the unit tests assert, so screen and code are checked against one list of cases.
 *
 * Run:    node __utilidades-back-office__/roteiros-ficticios/gerar-roteiro-classificacao.ts
 * Import: the output like any exported route (schema eu-roteirizo/roteiro/v1).
 *
 * Everything is invented: no real address, recipient or tracking code.
 */
import { createHash } from "node:crypto";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ADDRESS_CLASSIFICATION_CASES, EXPECTED_LABEL_KEY, caseAddress } from "../../src/__tests__/utils/addressClassificationCases.ts";
import { UI_LABELS } from "../../src/constants/uiLabels.ts";

const OUTPUT = join(dirname(fileURLToPath(import.meta.url)), "roteiro-classificacao.json");
const ROUTE_NAME = "Minha rota";
/** Compact grid on an inland street block (Tijuca), ~80 m apart: keeps the road-graph bbox small. */
const GRID_ORIGIN = { lat: -22.923, lng: -43.235 };
const GRID_STEP = { lat: -0.0007, lng: 0.0008 };
const GRID_COLUMNS = 5;
const COLUMNS = ["Sequence", "Stop", "SPX TN", "Destination Address", "City", "Latitude", "Longitude", "Neighborhood", "Zipcode", "Planned AT"];
/** Same values as a route saved by the app today. */
const ROUTING_CONFIG = { walkingSpeedKmh: 5, deliveryBaseSeconds: 120, deliveryPerPackageSeconds: 30, vehicleSpeedKmh: 25, autoRadiusMeters: 30 };

const stamp = new Date().toISOString();
const plannedAt = `AT${stamp.slice(0, 10).replace(/-/g, "")}0TEST`;
const round5 = (n: number) => Number(n.toFixed(5));

const stops = ADDRESS_CLASSIFICATION_CASES.map((c, index) => {
  const label = UI_LABELS.COMMON[EXPECTED_LABEL_KEY[c.expected]];
  const lat = round5(GRID_ORIGIN.lat + GRID_STEP.lat * Math.floor(index / GRID_COLUMNS));
  const lng = round5(GRID_ORIGIN.lng + GRID_STEP.lng * (index % GRID_COLUMNS));
  const tracking = `BR${String(c.id).padStart(13, "0")}`;
  const row = {
    Sequence: index + 1,
    Stop: index + 1,
    "SPX TN": tracking,
    "Destination Address": caseAddress(c, label),
    City: "Rio de Janeiro",
    Latitude: lat,
    Longitude: lng,
    Neighborhood: "Tijuca",
    Zipcode: "20520-000",
    "Planned AT": plannedAt,
  };
  return { c, label, row, tracking, pointId: `pt_${lat.toFixed(5)},${lng.toFixed(5)}` };
});

const rows = stops.map((s) => s.row);
// Hash of the addresses only: re-running without changing the cases keeps the same manifest, so a
// re-import overwrites the fake route instead of piling up copies.
const manifestId = createHash("sha256")
  .update(rows.map((r) => r["Destination Address"]).join("\n"))
  .digest("hex");

const payload = {
  schema: "eu-roteirizo/roteiro/v1",
  version: 1,
  exportedAt: stamp,
  manifestId,
  routeName: ROUTE_NAME,
  route: {
    id: `route_${manifestId.slice(0, 8)}`,
    startPoint: { ...GRID_ORIGIN },
    stops: stops.map((s, index) => ({
      id: `stop_${s.pointId}`,
      order: index + 1,
      vehicleStop: { lat: s.row.Latitude, lng: s.row.Longitude },
      pointIds: [s.pointId],
      radiusMeters: ROUTING_CONFIG.autoRadiusMeters,
      reversed: false,
      vehicleStopIsDefault: true,
    })),
    config: ROUTING_CONFIG,
    createdAt: stamp,
  },
  rows,
  routes: { [ROUTE_NAME]: rows },
  availableCols: COLUMNS,
  missingCols: [],
  isSingleRoute: true,
  points: stops.map((s) => ({
    id: s.pointId,
    lat: s.row.Latitude,
    lng: s.row.Longitude,
    address: s.row["Destination Address"],
    packageCount: 1,
    packages: [{ id: s.tracking, rawData: s.row, tracking: s.tracking }],
  })),
  meta: { manifestFileName: "roteiro-classificacao.json", importedAt: stamp, at: plannedAt },
};

writeFileSync(OUTPUT, `${JSON.stringify(payload, null, 2)}\n`);

const commercial = stops.filter((s) => s.c.expected === "commercial").length;
console.log(`${OUTPUT}\n${stops.length} paradas; o Sumario deve contar ${commercial} comerciais.\n`);
for (const s of stops) {
  console.log(`caso ${String(s.c.id).padStart(2)} · esperado ${s.label.padEnd(10)} · ${s.c.complement || "(sem complemento)"}`);
}
