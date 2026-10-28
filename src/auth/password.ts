import { scryptSync, timingSafeEqual } from "node:crypto";

/**
 * Demo credential hashing.
 *
 * The assessment only needs fictional accounts, but storing plaintext demo
 * passwords would model the wrong thing. scrypt keeps the stored shape honest
 * without adding a dependency. The seed supplies fixed per-account salts so the
 * dataset remains reproducible.
 */
const KEY_LENGTH = 64;

export function hashPassword(password: string, salt: string): string {
  return scryptSync(password, salt, KEY_LENGTH).toString("base64url");
}

export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const candidate = Buffer.from(hashPassword(password, salt));
  const expected = Buffer.from(expectedHash);
  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}
