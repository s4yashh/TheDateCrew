import { neon } from "@neondatabase/serverless";
import { createSeedStore } from "@/data/seed";
import type { DemoStore } from "@/domain/types";
import type { StoreRepository } from "@/data/repository/types";

const ROW_ID = "default";

/**
 * Postgres adapter for the demo snapshot.
 *
 * The store lives in one `jsonb` row so the assessment keeps the exact
 * semantics of the original JSON file while making writes durable on Vercel.
 * A `version` column turns writes into compare-and-swap operations: a request
 * that read version N can only succeed while the row is still at version N.
 * `updateStore` retries the read-modify-write when the write loses the race,
 * so two serverless instances cannot silently overwrite each other.
 *
 * The schema is created lazily on first use so `next build` never touches the
 * database and a fresh Neon project works without a migration step. The
 * `ALTER` keeps an already-deployed table compatible with the version column.
 */
export function createPostgresRepository(connectionString: string): StoreRepository {
  const sql = neon(connectionString);
  let schemaReady: Promise<void> | null = null;

  function ensureSchema(): Promise<void> {
    if (!schemaReady) {
      schemaReady = (async () => {
        await sql`
          CREATE TABLE IF NOT EXISTS demo_store (
            id text PRIMARY KEY,
            data jsonb NOT NULL,
            version bigint NOT NULL DEFAULT 0,
            updated_at timestamptz NOT NULL DEFAULT now()
          )
        `;
        await sql`ALTER TABLE demo_store ADD COLUMN IF NOT EXISTS version bigint NOT NULL DEFAULT 0`;
      })().catch((error) => {
        // Do not cache a failed initialisation: the next request may succeed
        // after a transient cold-start or network error.
        schemaReady = null;
        throw error;
      });
    }
    return schemaReady;
  }

  return {
    async readVersioned() {
      await ensureSchema();
      const rows = await sql`SELECT data, version FROM demo_store WHERE id = ${ROW_ID}`;
      const row = rows[0];
      if (!row) return null;
      return {
        store: row.data as DemoStore,
        // Postgres returns bigint as a string; the demo version fits in a double.
        version: Number(row.version),
      };
    },
    async write(store: DemoStore, expectedVersion: number) {
      await ensureSchema();
      const updated = await sql`
        UPDATE demo_store
        SET data = ${JSON.stringify(store)}::jsonb,
            version = version + 1,
            updated_at = now()
        WHERE id = ${ROW_ID} AND version = ${expectedVersion}
        RETURNING version
      `;
      if (updated.length > 0) return true;

      // The row may not exist yet. Insert only if nobody else created it; a
      // conflict means another writer won, so report a conflict and let the
      // caller re-read and retry.
      const inserted = await sql`
        INSERT INTO demo_store (id, data, version, updated_at)
        VALUES (${ROW_ID}, ${JSON.stringify(store)}::jsonb, 0, now())
        ON CONFLICT (id) DO NOTHING
        RETURNING version
      `;
      return inserted.length > 0;
    },
    async reset() {
      await ensureSchema();
      const seeded = createSeedStore();
      await sql`
        INSERT INTO demo_store (id, data, version, updated_at)
        VALUES (${ROW_ID}, ${JSON.stringify(seeded)}::jsonb, 0, now())
        ON CONFLICT (id) DO UPDATE
        SET data = EXCLUDED.data,
            version = demo_store.version + 1,
            updated_at = now()
      `;
      return seeded;
    },
    describe() {
      return "Neon Postgres · single jsonb snapshot with compare-and-swap";
    },
  };
}
