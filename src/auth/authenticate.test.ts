import { describe, expect, it } from "vitest";
import { authenticateMatchmaker, findMatchmakerByEmail } from "@/auth/authenticate";
import { hashPassword, verifyPassword } from "@/auth/password";
import { createSeedStore } from "@/data/seed";

const store = createSeedStore();

describe("demo matchmaker authentication", () => {
  it("finds both documented demo accounts case-insensitively", () => {
    expect(findMatchmakerByEmail(store, "MAYA@THEDATECREW.DEMO")?.name).toBe("Maya Shah");
    expect(findMatchmakerByEmail(store, "arjun@thedatecrew.demo")?.name).toBe("Arjun Rao");
  });

  it("accepts the correct password and rejects a wrong one", () => {
    expect(authenticateMatchmaker(store, "maya@thedatecrew.demo", "DemoMatch123!")?.id).toBe("mm-001");
    expect(authenticateMatchmaker(store, "arjun@thedatecrew.demo", "ArjunMatch123!")?.id).toBe("mm-002");
    expect(authenticateMatchmaker(store, "maya@thedatecrew.demo", "DemoMatch123!wrong")).toBeNull();
    expect(authenticateMatchmaker(store, "nobody@thedatecrew.demo", "DemoMatch123!")).toBeNull();
  });

  it("stores hashes rather than plaintext passwords", () => {
    for (const matchmaker of store.matchmakers) {
      expect(matchmaker.passwordHash).not.toContain("Match123");
      expect(matchmaker.passwordHash.length).toBeGreaterThan(40);
    }
  });

  it("verifies a manually hashed password with a unique salt", () => {
    const hash = hashPassword("correct horse battery staple", "salt-a");
    expect(verifyPassword("correct horse battery staple", "salt-a", hash)).toBe(true);
    expect(verifyPassword("correct horse battery staple", "salt-b", hash)).toBe(false);
  });
});
