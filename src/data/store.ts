import { getRepository } from "@/data/repository";
import type { DemoStore } from "@/domain/types";

/**
 * Serialised access to the demo workspace.
 *
 * Every mutation runs through an in-process promise queue so two requests in
 * the same server instance cannot interleave a read-modify-write cycle.
 * Across serverless instances the snapshot is last-write-wins; that is an
 * accepted demo trade-off and is called out in docs/architecture.md.
 *
 * The whole public surface is `readStore`, `updateStore`, and `resetStore`;
 * routes and components never know which adapter is active.
 */
declare global {
  var demoStoreWriteQueue: Promise<unknown> | undefined;
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
    const existing = await repository.read();
    if (existing) return existing;
    // First run: seed and persist so refresh behaves like a real workspace.
    return repository.reset();
  });
}

export async function updateStore<T>(update: (store: DemoStore) => T): Promise<{ store: DemoStore; result: T }> {
  return enqueue(async () => {
    const repository = getRepository();
    const store = (await repository.read()) ?? (await repository.reset());
    const result = update(store);
    await repository.write(store);
    return { store, result };
  });
}

export async function resetStore(): Promise<DemoStore> {
  return enqueue(async () => {
    const repository = getRepository();
    return repository.reset();
  });
}

/** Active persistence mode, shown in Settings and the seed script. */
export function persistenceMode(): string {
  return getRepository().describe();
}
