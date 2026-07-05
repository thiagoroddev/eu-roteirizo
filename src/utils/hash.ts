/**
 * utils/hash.ts - Content hashing (TASK-RF-022.1).
 *
 * Uses the Web Crypto API, which requires a secure context (HTTPS/localhost) —
 * always true for this PWA. In tests, jsdom lacks crypto.subtle, so
 * setupTests.ts installs Node's webcrypto as a guarded polyfill.
 */

/**
 * SHA-256 of a buffer as lowercase hex (64 chars).
 *
 * @param buffer - The raw bytes to hash.
 * @returns The digest as a lowercase hexadecimal string.
 */
export const sha256Hex = async (buffer: ArrayBuffer): Promise<string> => {
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};
