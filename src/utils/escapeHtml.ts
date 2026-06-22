/**
 * escapeHtml - Escapes a value for safe interpolation into an HTML string.
 *
 * Prevents HTML/script injection when untrusted data (e.g. spreadsheet cells)
 * is embedded in a template string that will be rendered as HTML (such as a
 * Leaflet tooltip/popup). The ampersand must be replaced first so the entities
 * produced by the other replacements are not double-escaped.
 *
 * @param value - Any value; converted to string (null/undefined become "").
 * @returns The HTML-escaped string.
 */
export const escapeHtml = (value: unknown): string =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
