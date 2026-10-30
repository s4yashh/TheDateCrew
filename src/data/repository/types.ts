import type { DemoStore } from "@/domain/types";

/**
 * A snapshot plus an opaque concurrency token.
 *
 * For Postgres the token is the row's `version` column; a write only succeeds
 * when the version still matches. The file adapter is single-process and
 * returns a constant token.
 */
export interface StoreSnapshot {
  store: DemoStore;
  version: number;
}

/**
 * Persistence contract used by the rest of the application.
 *
 * The demo started as an atomic JSON file. It now also has a Postgres adapter
 * that stores the same serialisable snapshot in a single `jsonb` row. Keeping
 * the contract this small is deliberate: swapping in normalised tables later
 * only requires a new adapter, not changes to routes or components.
 */
export interface StoreRepository {
  /** Current snapshot and version, or null when nothing has been written yet. */
  readVersioned(): Promise<StoreSnapshot | null>;
  /**
   * Persist the snapshot only if the stored version still equals
   * `expectedVersion`. Returns false on a conflict so the caller can retry.
   */
  write(store: DemoStore, expectedVersion: number): Promise<boolean>;
  /** Replace the snapshot with a freshly generated seed. */
  reset(): Promise<DemoStore>;
  /** Human-readable persistence mode for Settings and the README. */
  describe(): string;
}
