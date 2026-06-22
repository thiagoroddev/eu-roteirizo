import { describe, it, expect } from "vitest";
import { escapeHtml } from "../../utils/escapeHtml";

describe("escapeHtml", () => {
  it("escapes the five HTML-significant characters", () => {
    expect(escapeHtml(`& < > " '`)).toBe("&amp; &lt; &gt; &quot; &#39;");
  });

  it("escapes the ampersand first (no double-escaping)", () => {
    // "<" -> "&lt;"; the produced "&" must NOT be re-escaped into "&amp;lt;"
    expect(escapeHtml("<")).toBe("&lt;");
    expect(escapeHtml("&lt;")).toBe("&amp;lt;");
  });

  it("neutralizes a script/HTML injection payload", () => {
    const payload = `<img src=x onerror="alert('xss')">`;
    const result = escapeHtml(payload);

    expect(result).toBe(`&lt;img src=x onerror=&quot;alert(&#39;xss&#39;)&quot;&gt;`);
    // No raw angle brackets survive -> browser cannot parse it as an element
    expect(result).not.toContain("<");
    expect(result).not.toContain(">");
  });

  it("converts numbers to their string form", () => {
    expect(escapeHtml(123)).toBe("123");
    expect(escapeHtml(0)).toBe("0");
  });

  it("returns an empty string for null and undefined", () => {
    expect(escapeHtml(null)).toBe("");
    expect(escapeHtml(undefined)).toBe("");
  });

  it("leaves plain text unchanged", () => {
    expect(escapeHtml("Rua das Flores, 123")).toBe("Rua das Flores, 123");
  });
});
