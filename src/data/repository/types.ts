import type { DemoStore } from "@/domain/types";

/**
 * Persistence contract used by the rest of the application.
 *
 * The demo started as an atomic JSON file. It now also has a Postgres adapter
 * that stores the same serialisable snapshot in a single `jsonb` row. Keeping
 * the contract this small is deliberate: swapping in normalised tables later
 * only requires a new adapter, not changes to routes or components.
 */
export interface StoreRepository {
  /** Current snapshot, or null when nothing has been written yet. */
  read(): Promise<DemoStore | null>;
  write(store: DemoStore): Promise<void>;
  /** Replace the snapshot with a freshly generated seed. */
  reset(): Promise<DemoStore>;
  /** Human-readable persistence mode for Settings and the README. */
  describe(): string;
}
