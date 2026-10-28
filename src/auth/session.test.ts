import { describe, expect, it } from "vitest";
import { createSessionToken, recordLoginAttempt, resetLoginAttempts, verifySessionToken } from "@/auth/session";

describe("signed matchmaker demo sessions", () => {
  it("accepts a valid, unexpired signed cookie payload", () => {
    const issuedAt = Date.UTC(2026, 9, 13, 9);
    const token = createSessionToken("mm-001", "maya@thedatecrew.demo", issuedAt);
    const session = verifySessionToken(token, issuedAt + 60_000);
    expect(session?.matchmakerId).toBe("mm-001");
    expect(session?.email).toBe("maya@thedatecrew.demo");
  });

  it("rejects expired, tampered, and malformed tokens", () => {
    const issuedAt = Date.UTC(2026, 9, 13, 9);
    const token = createSessionToken("mm-001", "maya@thedatecrew.demo", issuedAt);
    expect(verifySessionToken(token, issuedAt + 9 * 60 * 60 * 1000)).toBeNull();
    expect(verifySessionToken(`${token}tampered`, issuedAt)).toBeNull();
    expect(verifySessionToken("not-a-session", issuedAt)).toBeNull();
    expect(verifySessionToken(undefined, issuedAt)).toBeNull();
  });

  it("never embeds a password in the token", () => {
    expect(createSessionToken("mm-001", "maya@thedatecrew.demo")).not.toContain("DemoMatch123!");
  });

  it("rate limits repeated login failures and resets after a successful login", () => {
    const key = "session-test-rate-limit";
    const now = Date.UTC(2026, 9, 13, 9);
    resetLoginAttempts(key);
    for (let attempt = 0; attempt < 8; attempt += 1) expect(recordLoginAttempt(key, now).allowed).toBe(true);
    const blocked = recordLoginAttempt(key, now);
    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(600);
    resetLoginAttempts(key);
    expect(recordLoginAttempt(key, now).allowed).toBe(true);
  });
});
