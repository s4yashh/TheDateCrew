import { getRepository } from "@/data/repository";
import type { StoreRepository } from "@/data/repository/types";
import type { DemoStore } from "@/domain/types";

/**
 * Serialised, retry-safe access to the demo workspace.
 *
 * Every mutation runs through an in-process promise queue so two requests in
 * the same server instance cannot interleave a read-modify-write cycle. The
 * repository adds a version check for the multi-instance case: if another
 * instance committed first, `write` returns false and the whole mutation is
 * replayed against the fresh snapshot. Without that retry, Vercel's concurrent
 * serverless instances would silently lose notes or introduction records.
 *
 * The whole public surface is `readStore`, `updateStore`, and `resetStore`;
 * routes and components never know which adapter is active.
 */
declare global {
  var demoStoreWriteQueue: Promise<unknown> | undefined;
}

const DEFAULT_MAX_ATTEMPTS = 3;

export interface UpdateStoreOptions {
  /** Test hook; production always uses the configured adapter. */
  repository?: StoreRepository;
  maxAttempts?: number;
}

function enqueue<T>(work: () => Promise<T>): Promise<T> {
  const previous = globalThis.demoStoreWriteQueue ?? Promise.resolve();
  const operation = previous.then(work, work);
  globalThis.demoStoreWriteQueue = operation.then(() => undefined, () => undefined);
  return operation;
}

export async function readStore(): Promise<DemoStore> {
  return enqueue(async () => {
    const repository = getRepository();
    const snapshot = await repository.readVersioned();
    // First run: seed and persist so refresh behaves like a real workspace.
    return snapshot?.store ?? (await repository.reset());
  });
}

export async function updateStore<T>(
  update: (store: DemoStore) => T,
  options: UpdateStoreOptions = {},
): Promise<{ store: DemoStore; result: T }> {
  return enqueue(async () => {
    const repository = options.repository ?? getRepository();
    const maxAttempts = Math.max(1, options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS);

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const snapshot = (await repository.readVersioned()) ?? { store: await repository.reset(), version: 0 };
      const result = update(snapshot.store);
      if (await repository.write(snapshot.store, snapshot.version)) {
        return { store: snapshot.store, result };
      }
      // Another instance committed between our read and write. Re-read and
      // replay the mutation so no update is silently dropped.
    }

    throw new Error("The workspace was updated elsewhere. Please retry that action.");
  });
}

export async function resetStore(): Promise<DemoStore> {
  return enqueue(async () => getRepository().reset());
}

/** Active persistence mode, shown in Settings and the seed script. */
export function persistenceMode(): string {
  return getRepository().describe();
}
