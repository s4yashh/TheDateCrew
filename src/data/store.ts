import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createSeedStore } from "@/data/seed";
import type { DemoStore } from "@/domain/types";

const STORE_DIRECTORY = join(process.cwd(), ".data");
const STORE_PATH = join(STORE_DIRECTORY, "demo-store.json");
const TEMP_PATH = join(STORE_DIRECTORY, "demo-store.tmp");

declare global {
  // eslint-disable-next-line no-var
  var demoStoreWriteQueue: Promise<unknown> | undefined;
}

function enqueue<T>(work: () => Promise<T>): Promise<T> {
  const previous = globalThis.demoStoreWriteQueue ?? Promise.resolve();
  const operation = previous.then(work, work);
  globalThis.demoStoreWriteQueue = operation.then(() => undefined, () => undefined);
  return operation;
}

async function readFromDisk(): Promise<DemoStore | null> {
  try {
    return JSON.parse(await readFile(STORE_PATH, "utf8")) as DemoStore;
  } catch (error) {
    if (error instanceof Error && "code" in error && error.code === "ENOENT") return null;
    throw error;
  }
}

async function persist(store: DemoStore): Promise<void> {
  await mkdir(STORE_DIRECTORY, { recursive: true });
  await writeFile(TEMP_PATH, `${JSON.stringify(store, null, 2)}\n`, { encoding: "utf8", mode: 0o600 });
  await rename(TEMP_PATH, STORE_PATH);
}

export async function readStore(): Promise<DemoStore> {
  return enqueue(async () => {
    const store = await readFromDisk();
    if (store) return store;
    const seeded = createSeedStore();
    await persist(seeded);
    return seeded;
  });
}

export async function updateStore<T>(update: (store: DemoStore) => T): Promise<{ store: DemoStore; result: T }> {
  return enqueue(async () => {
    const store = (await readFromDisk()) ?? createSeedStore();
    const result = update(store);
    await persist(store);
    return { store, result };
  });
}

export async function resetStore(): Promise<DemoStore> {
  return enqueue(async () => {
    const seeded = createSeedStore();
    await persist(seeded);
    return seeded;
  });
}
