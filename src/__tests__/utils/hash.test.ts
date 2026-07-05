import { describe, it, expect } from "vitest";
import { sha256Hex } from "../../utils/hash";

const bytesOf = (text: string): ArrayBuffer => new TextEncoder().encode(text).buffer as ArrayBuffer;

describe("sha256Hex", () => {
  it("matches the known SHA-256 vector for 'abc'", async () => {
    expect(await sha256Hex(bytesOf("abc"))).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("matches the known SHA-256 vector for the empty input", async () => {
    expect(await sha256Hex(new ArrayBuffer(0))).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });

  it("is deterministic and distinguishes different inputs", async () => {
    const first = await sha256Hex(bytesOf("romaneio"));
    const again = await sha256Hex(bytesOf("romaneio"));
    const other = await sha256Hex(bytesOf("romaneio!"));
    expect(first).toBe(again);
    expect(first).not.toBe(other);
  });

  it("returns 64 lowercase hex chars", async () => {
    expect(await sha256Hex(bytesOf("qualquer coisa"))).toMatch(/^[0-9a-f]{64}$/);
  });
});
