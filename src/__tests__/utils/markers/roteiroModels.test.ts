import { describe, it, expect } from "vitest";
import { computeRoteiroMarkerModels, buildPointTooltipHtml, NO_STOP_INDEX } from "../../../utils/markers/roteiroModels";
import { ROTEIRO_MARKER_COLORS } from "../../../utils/markers/markerColors";
import type { DeliveryPoint, RouteStop } from "../../../types/routing";

const pt = (id: string, lat: number, lng: number, packageCount = 1, address = `Rua ${id}, 10`): DeliveryPoint => ({ id, lat, lng, address, packageCount, packages: [] });

const stop = (id: string, pointIds: string[]): RouteStop => ({ id, order: 1, vehicleStop: { lat: -22.98, lng: -43.2 }, pointIds, radiusMeters: 30 });

describe("computeRoteiroMarkerModels", () => {
  const a = pt("pt_a", -22.98, -43.2);
  const b = pt("pt_b", -22.979, -43.2, 3);

  it("renders each free point as a faded gray circle without a number", () => {
    const models = computeRoteiroMarkerModels([a, b], []);
    expect(models).toHaveLength(2);
    expect(models[0]).toMatchObject({
      key: "pt_a",
      kind: "address",
      lat: a.lat,
      lng: a.lng,
      stopIndex: NO_STOP_INDEX,
      iconProps: { shape: "circle", color: ROTEIRO_MARKER_COLORS.unassigned, number: null },
    });
  });

  it("adds a package badge only for multi-package locations", () => {
    const models = computeRoteiroMarkerModels([a, b], []);
    expect(models[0].iconProps.badge).toBeNull();
    expect(models[1].iconProps.badge).toEqual({ kind: "packages", count: 3 });
  });

  it("omits points already assigned to a committed stop", () => {
    const models = computeRoteiroMarkerModels([a, b], [stop("stop_a", ["pt_a"])]);
    expect(models.map((m) => m.key)).toEqual(["pt_b"]);
  });

  it("returns [] with no points (or all assigned)", () => {
    expect(computeRoteiroMarkerModels([], [])).toEqual([]);
    expect(computeRoteiroMarkerModels([a], [stop("stop_a", ["pt_a"])])).toEqual([]);
  });

  it("tooltip shows address and package count", () => {
    const html = buildPointTooltipHtml(b);
    expect(html).toContain("Rua pt_b, 10");
    expect(html).toContain("3");
  });

  it("tooltip escapes spreadsheet HTML (XSS)", () => {
    const evil = pt("pt_x", -22.98, -43.2, 1, `<img src=x onerror=alert(1)>`);
    const html = buildPointTooltipHtml(evil);
    expect(html).not.toContain("<img");
    expect(html).toContain("&lt;img");
  });
});
