import { verifyPassword } from "@/auth/password";
import type { DemoStore, Matchmaker } from "@/domain/types";

/** Normalise the login identifier without exposing stored values. */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function findMatchmakerByEmail(store: DemoStore, email: string): Matchmaker | undefined {
  const normalized = normalizeEmail(email);
  return store.matchmakers.find((matchmaker) => matchmaker.email === normalized);
}

/**
 * Verify a demo login against the stored scrypt hash.
 *
 * Returns the matchmaker on success, `null` on any failure. The caller is
 * responsible for rate limiting so a missing account and a wrong password
 * cannot be distinguished by response time or message.
 */
export function authenticateMatchmaker(store: DemoStore, email: string, password: string): Matchmaker | null {
  const matchmaker = findMatchmakerByEmail(store, email);
  if (!matchmaker) return null;
  return verifyPassword(password, matchmaker.passwordSalt, matchmaker.passwordHash) ? matchmaker : null;
}
