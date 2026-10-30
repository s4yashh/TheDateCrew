import { describe, expect, it } from "vitest";
import { createSeedStore } from "@/data/seed";
import { updateStore } from "@/data/store";
import type { StoreRepository } from "@/data/repository/types";
import type { DemoStore } from "@/domain/types";

/** In-memory adapter that can simulate another instance winning a write race. */
class FakeRepository implements StoreRepository {
  store: DemoStore | null = null;
  version = 0;
  conflicts = 0;
  writes = 0;

  async readVersioned() {
    return this.store ? { store: structuredClone(this.store), version: this.version } : null;
  }

  async write(store: DemoStore, expectedVersion: number) {
    this.writes += 1;
    if (this.conflicts > 0) {
      this.conflicts -= 1;
      if (this.store) {
        // Simulate a concurrent instance committing before our write lands.
        this.version += 1;
        this.store.notes.unshift({
          id: `concurrent-${this.version}`,
          profileId: this.store.profiles[0].id,
          author: "Another instance",
          type: "General",
          text: "Committed concurrently",
          createdAt: new Date().toISOString(),
        });
      }
      return false;
    }
    if (this.store && expectedVersion !== this.version) return false;
    this.store = structuredClone(store);
    this.version += 1;
    return true;
  }

  async reset() {
    this.store = createSeedStore();
    this.version = 0;
    return this.store;
  }

  describe() {
    return "fake repository";
  }
}

function note(id: string) {
  return { id, profileId: "client-001", author: "Maya Shah", type: "General" as const, text: "Test note", createdAt: new Date().toISOString() };
}

describe("updateStore optimistic concurrency", () => {
  it("replays the mutation when another instance commits first", async () => {
    const repository = new FakeRepository();
    await repository.reset();
    repository.conflicts = 1;

    const { result } = await updateStore((store) => {
      store.notes.unshift(note("mine"));
      return "saved";
    }, { repository });

    expect(result).toBe("saved");
    expect(repository.writes).toBe(2);
    expect(repository.store?.notes.some((item) => item.id === "mine")).toBe(true);
    expect(repository.store?.notes.some((item) => item.id.startsWith("concurrent-"))).toBe(true);
  });

  it("gives up with a user-safe error after the retry budget", async () => {
    const repository = new FakeRepository();
    await repository.reset();
    repository.conflicts = 5;

    await expect(updateStore((store) => store.notes.unshift(note("lost")), { repository, maxAttempts: 3 }))
      .rejects.toThrow(/updated elsewhere/);
    expect(repository.writes).toBe(3);
    expect(repository.store?.notes.some((item) => item.id === "lost")).toBe(false);
  });

  it("seeds an empty repository before applying the mutation", async () => {
    const repository = new FakeRepository();
    expect(await repository.readVersioned()).toBeNull();

    await updateStore((store) => store.notes.unshift(note("first")), { repository });

    expect(repository.store?.profiles).toHaveLength(212);
    expect(repository.store?.notes.some((item) => item.id === "first")).toBe(true);
  });
});
