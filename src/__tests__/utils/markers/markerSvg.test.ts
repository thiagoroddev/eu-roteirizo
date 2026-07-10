/**
 * Tests for buildMarkerSvg — the pure SVG marker generator (RF-020.1, ADR-008).
 *
 * Pure function: no Leaflet, no DOM. We assert on the markup string via the
 * test hooks (`mk-number`, `mk-badge`) and structural fragments.
 */

import { describe, it, expect } from "vitest";
import { buildMarkerSvg, type MarkerColor } from "../../../utils/markers/markerSvg";

const COM: MarkerColor = { top: "#3DA0FF", bottom: "#1559C9", glow: "rgba(45,127,240,.55)" };
const IND: MarkerColor = { top: "#B6BCC6", bottom: "#8A909C", glow: "rgba(0,0,0,.18)", numberInk: "#2A2F38" };

describe("buildMarkerSvg", () => {
  it("renders a <rect> body for the square shape", () => {
    const svg = buildMarkerSvg({ shape: "square", color: COM, number: 7 });
    expect(svg).toContain("<rect");
    expect(svg).not.toContain("<circle");
  });

  it("renders a <circle> body for the circle shape", () => {
    const svg = buildMarkerSvg({ shape: "circle", color: COM, number: 8 });
    expect(svg).toContain("<circle");
    expect(svg).not.toContain("<rect");
  });

  it("includes the number when provided", () => {
    const svg = buildMarkerSvg({ shape: "circle", color: COM, number: 12 });
    expect(svg).toContain('class="mk-number"');
    expect(svg).toMatch(/<text class="mk-number"[^>]*>12<\/text>/);
  });

  it.each([null, undefined, ""])("omits the number element when number is %p", (n) => {
    const svg = buildMarkerSvg({ shape: "circle", color: COM, number: n });
    expect(svg).not.toContain("mk-number");
  });

  it("escapes the number (untrusted Stop cell) to prevent injection", () => {
    const svg = buildMarkerSvg({ shape: "circle", color: COM, number: "<img src=x onerror=alert(1)>" });
    expect(svg).not.toContain("<img");
    expect(svg).toContain("&lt;img");
  });

  it("renders the badge only when count > 1", () => {
    const one = buildMarkerSvg({ shape: "circle", color: COM, number: 3, badge: { kind: "packages", count: 1 } });
    expect(one).not.toContain("mk-badge");

    const many = buildMarkerSvg({ shape: "circle", color: COM, number: 3, badge: { kind: "packages", count: 5 } });
    expect(many).toContain('class="mk-badge"');
    expect(many).toMatch(/<text[^>]*>5<\/text>/);
  });

  it("places the badge fully inside the head, centered — RF-020.5", () => {
    const svg = buildMarkerSvg({ shape: "square", color: COM, number: 3, badge: { kind: "packages", count: 5 } });
    // width 34 → centered at cx=48 → x=31, y=40 (inside the head, below the number).
    expect(svg).toContain('class="mk-badge" transform="translate(31, 40)"');
    expect(svg).not.toContain("translate(56, 8)"); // the old top-right position
  });

  it("centers the number when there is no badge — RF-020.5", () => {
    const svg = buildMarkerSvg({ shape: "square", color: COM, number: 18 });
    expect(svg).toMatch(/<text class="mk-number" x="48" y="49"/);
  });

  it("raises the number above the badge when one is shown — RF-020.5", () => {
    const svg = buildMarkerSvg({ shape: "square", color: COM, number: 18, badge: { kind: "addresses", count: 4 } });
    expect(svg).toMatch(/<text class="mk-number" x="48" y="34"/);
  });

  it("shrinks the font for a composite stop-sequence label — RF-020.5", () => {
    const composite = buildMarkerSvg({ shape: "circle", color: COM, number: "18-49" });
    expect(composite).toMatch(/<text class="mk-number"[^>]*font-size="16"[^>]*>18-49<\/text>/);
    const short = buildMarkerSvg({ shape: "square", color: COM, number: 18 });
    expect(short).toMatch(/<text class="mk-number"[^>]*font-size="24"/);
  });

  it("uses the box glyph for packages and the pin glyph for addresses", () => {
    const packages = buildMarkerSvg({ shape: "circle", color: COM, number: 3, badge: { kind: "packages", count: 4 } });
    const addresses = buildMarkerSvg({ shape: "square", color: COM, number: 6, badge: { kind: "addresses", count: 3 } });
    // The box glyph translates to (6,5); the pin glyph translates to (9,4).
    expect(packages).toContain("translate(6,5)");
    expect(addresses).toContain("translate(9,4)");
  });

  it("applies a thick white stroke when selected (border is the group cue)", () => {
    const sel = buildMarkerSvg({ shape: "circle", color: COM, number: 1, selected: true });
    expect(sel).toContain('stroke="#ffffff" stroke-width="4"');
  });

  // REF-015b (decisão 10/07 — supersede o glow base da REF-012): o marcador
  // comum NÃO leva filtro nenhum — `drop-shadow` em todo marcador era o maior
  // custo por frame da pinça/pan no celular. Glow é exclusivo do `emphasis`.
  it("applies a thin stroke and NO filter when not selected/emphasized", () => {
    const base = buildMarkerSvg({ shape: "circle", color: COM, number: 1 });
    expect(base).toContain('stroke-width="1.5"');
    expect(base).not.toContain("drop-shadow");
    expect(base).not.toContain("filter:");
  });

  it("uses a bright type-colored neon glow when emphasized, keeping the white border — RF-020.3", () => {
    const com = buildMarkerSvg({ shape: "circle", color: COM, number: 18, selected: true, emphasis: true });
    expect(com).toContain('stroke="#ffffff" stroke-width="4"'); // border stays white
    expect(com).toContain("drop-shadow(0 0 12px #3DA0FF)"); // light-blue neon (commercial top)
    const res = buildMarkerSvg({ shape: "circle", color: { top: "#34D27A", bottom: "#0E8C49", glow: "rgba(34,184,102,.50)" }, number: 18, selected: true, emphasis: true });
    expect(res).toContain("drop-shadow(0 0 12px #34D27A)"); // light-green neon (residential top)
  });

  it("applies numberInk to the number fill (dark ink for the gray indefinite)", () => {
    const svg = buildMarkerSvg({ shape: "circle", color: IND, number: 10 });
    expect(svg).toMatch(/<text class="mk-number"[^>]*fill="#2A2F38"/);
  });

  it("defaults numberInk to white when not provided", () => {
    const svg = buildMarkerSvg({ shape: "circle", color: COM, number: 10 });
    expect(svg).toMatch(/<text class="mk-number"[^>]*fill="#ffffff"/);
  });

  it("uses the provided top/bottom colors as gradient stops", () => {
    const svg = buildMarkerSvg({ shape: "circle", color: COM, number: 1 });
    expect(svg).toContain('stop-color="#3DA0FF"');
    expect(svg).toContain('stop-color="#1559C9"');
  });

  it("is deterministic: same props produce identical markup and a stable gradient id", () => {
    const a = buildMarkerSvg({ shape: "square", color: COM, number: 7, badge: { kind: "addresses", count: 3 } });
    const b = buildMarkerSvg({ shape: "square", color: COM, number: 7, badge: { kind: "addresses", count: 3 } });
    expect(a).toBe(b);
    expect(a).toContain('id="grad-3DA0FF1559C9"');
  });

  it("scales the rendered size while keeping the viewBox intrinsic", () => {
    const svg = buildMarkerSvg({ shape: "circle", color: COM, number: 1, scale: 1 });
    expect(svg).toContain('width="96"');
    expect(svg).toContain('height="102"');
    expect(svg).toContain('viewBox="0 0 96 102"');
  });
});

describe("buildMarkerSvg — roteiro extensions (RF-006.4.2)", () => {
  it("renders a diamond body (route start) with the shared stroke/gradient", () => {
    const svg = buildMarkerSvg({ shape: "diamond", color: COM, selected: true });
    expect(svg).toContain("M48,12 L76,40 L48,68 L20,40 Z");
    expect(svg).not.toContain("<rect");
    expect(svg).not.toContain("<circle cx=");
  });

  it("omits the fine tip when tip=false (street-anchored vehicle)", () => {
    const withTip = buildMarkerSvg({ shape: "circle", color: COM });
    const tipless = buildMarkerSvg({ shape: "circle", color: COM, tip: false });
    expect(withTip).toContain("L48,98");
    expect(tipless).not.toContain("L48,98");
  });

  it("dashes the selected ring for radius candidates (ringStyle)", () => {
    const dashed = buildMarkerSvg({ shape: "circle", color: COM, selected: true, ringStyle: "dashed" });
    const solid = buildMarkerSvg({ shape: "circle", color: COM, selected: true });
    expect(dashed).toContain('stroke-dasharray="10 7"');
    expect(solid).not.toContain("stroke-dasharray");
  });

  it("the car glyph replaces the number (vehicle marker)", () => {
    const svg = buildMarkerSvg({ shape: "circle", color: IND, glyph: "car", number: 9, tip: false });
    expect(svg).not.toContain('class="mk-number"');
    expect(svg).toContain("M5 17h-2v-6l2 -5h9l4 5h1a2 2 0 0 1 2 2v4h-2m-4 0h-6m-6 -6h15m-6 0v-5");
    expect(svg).toContain('stroke="#2A2F38"'); // numberInk drives the glyph ink
  });
});
