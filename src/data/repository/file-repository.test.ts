import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createFileRepository } from "@/data/repository/file-repository";
import { getRepository, resetRepositoryCache } from "@/data/repository/index";

const createdDirectories: string[] = [];

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), "tdc-store-"));
  createdDirectories.push(directory);
  return directory;
}

afterEach(async () => {
  await Promise.all(createdDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
  resetRepositoryCache();
});

describe("file repository", () => {
  it("returns null before the first write", async () => {
    const repository = createFileRepository(await temporaryDirectory());
    expect(await repository.read()).toBeNull();
  });

  it("resets, reads, and rewrites the snapshot", async () => {
    const repository = createFileRepository(await temporaryDirectory());
    const seeded = await repository.reset();
    expect(seeded.profiles).toHaveLength(212);
    expect((await repository.read())?.profiles).toHaveLength(212);

    seeded.notes.push({ id: "test-note", profileId: seeded.profiles[0].id, author: "Test", type: "General", text: "Persisted", createdAt: new Date().toISOString() });
    await repository.write(seeded);
    expect((await repository.read())?.notes.some((note) => note.id === "test-note")).toBe(true);
  });

  it("includes the configured directory in its description", async () => {
    const directory = await temporaryDirectory();
    expect(createFileRepository(directory).describe()).toContain("demo-store.json");
  });
});

describe("repository selection", () => {
  it("uses the file adapter when DATABASE_URL is unset", () => {
    const previous = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;
    resetRepositoryCache();
    expect(getRepository().describe()).toContain("Local JSON file");
    process.env.DATABASE_URL = previous;
  });

  it("uses the Postgres adapter when DATABASE_URL is present", () => {
    const previous = process.env.DATABASE_URL;
    process.env.DATABASE_URL = "postgresql://user:pass@example.test/db";
    resetRepositoryCache();
    expect(getRepository().describe()).toContain("Neon Postgres");
    if (previous === undefined) delete process.env.DATABASE_URL;
    else process.env.DATABASE_URL = previous;
  });
});
