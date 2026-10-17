/** Hashing utilities · canonical JSON + sha256 → bytes32 / 0x-prefixed hex. */

import { createHash } from "node:crypto";

export function sha256Hex(input: string | Buffer): string {
  return "0x" + createHash("sha256").update(input).digest("hex");
}

export function canonicalJson(obj: unknown): string {
  return JSON.stringify(obj, (_key, value) => {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      return Object.fromEntries(Object.keys(value).sort().map(key => [key, value[key]]));
    }
    return value;
  });
}

export function hashCanonical(obj: unknown): string {
  return sha256Hex(canonicalJson(obj));
}

export function hashText(text: string): string {
  return sha256Hex(text);
}

/** Convert 0x-prefixed hex to bytes32. Defaults to bytes32(0) for empty string. */
export function statusToBytes32(status: string): `0x${string}` {
  if (!status) return "0x" + "00".repeat(32) as `0x${string}`;
  return sha256Hex(status) as `0x${string}`;
}
