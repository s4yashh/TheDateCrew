import { neon } from "@neondatabase/serverless";
import { createSeedStore } from "@/data/seed";
import type { DemoStore } from "@/domain/types";
import type { StoreRepository } from "@/data/repository/types";

const ROW_ID = "default";

/**
 * Postgres adapter for the demo snapshot.
 *
 * The whole store lives in one `jsonb` row. That is intentional for the
 * assessment: it preserves the exact semantics of the JSON file while making
 * writes durable on Vercel. The trade-off is documented in
 * docs/architecture.md — a production system would normalise the entities and
 * use per-row transactions.
 *
 * The schema is created lazily on first use so `next build` never touches the
 * database and a fresh Neon project works without a migration step.
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
            updated_at timestamptz NOT NULL DEFAULT now()
          )
        `;
      })().catch((error) => {
        // Do not cache a failed initialisation: the next request may succeed
        // after a transient cold-start or network error.
        schemaReady = null;
        throw error;
      });
    }
    return schemaReady;
  }

  async function write(store: DemoStore): Promise<void> {
    await ensureSchema();
    await sql`
      INSERT INTO demo_store (id, data, updated_at)
      VALUES (${ROW_ID}, ${JSON.stringify(store)}::jsonb, now())
      ON CONFLICT (id) DO UPDATE
      SET data = EXCLUDED.data, updated_at = now()
    `;
  }

  return {
    async read() {
      await ensureSchema();
      const rows = await sql`SELECT data FROM demo_store WHERE id = ${ROW_ID}`;
      const snapshot = rows[0]?.data as DemoStore | undefined;
      return snapshot ?? null;
    },
    write,
    async reset() {
      const seeded = createSeedStore();
      await write(seeded);
      return seeded;
    },
    describe() {
      return "Neon Postgres · single jsonb snapshot";
    },
  };
}
