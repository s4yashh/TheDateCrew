import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createSeedStore } from "@/data/seed";
import type { DemoStore } from "@/domain/types";
import type { StoreRepository } from "@/data/repository/types";

const STORE_FILENAME = "demo-store.json";
const TEMP_FILENAME = "demo-store.tmp";

/**
 * Local development fallback used whenever DATABASE_URL is absent.
 *
 * The in-process promise queue in `store.ts` serialises writes. There is no
 * cross-process locking: this adapter is for one local dev server, not a
 * multi-instance deployment.
 */
export function createFileRepository(dataDirectory = process.env.DATA_DIR || join(process.cwd(), ".data")): StoreRepository {
  // The file adapter is a local-development fallback. Tell Turbopack not to
  // trace the whole project for this dynamic path.
  const directory = resolve(/* turbopackIgnore: true */ dataDirectory);
  const storePath = join(directory, STORE_FILENAME);
  const tempPath = join(directory, TEMP_FILENAME);

  async function write(store: DemoStore): Promise<void> {
    await mkdir(directory, { recursive: true });
    // Write to a temp file and rename so a crash cannot leave a half-written
    // snapshot. Mode 0600 keeps notes and contact details private on disk.
    await writeFile(tempPath, `${JSON.stringify(store, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
    await rename(tempPath, storePath);
  }

  return {
    async readVersioned() {
      try {
        return { store: JSON.parse(await readFile(storePath, "utf8")) as DemoStore, version: 0 };
      } catch (error) {
        if (error instanceof Error && "code" in error && error.code === "ENOENT") return null;
        throw error;
      }
    },
    async write(store: DemoStore) {
      await write(store);
      // The file adapter has no cross-process version to compare.
      return true;
    },
    async reset() {
      const seeded = createSeedStore();
      await write(seeded);
      return seeded;
    },
    describe() {
      return `Local JSON file · ${storePath.replace(`${process.cwd()}/`, "")}`;
    },
  };
}
