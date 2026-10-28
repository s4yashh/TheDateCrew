import { createFileRepository } from "@/data/repository/file-repository";
import { createPostgresRepository } from "@/data/repository/postgres-repository";
import type { StoreRepository } from "@/data/repository/types";

export type { StoreRepository } from "@/data/repository/types";
export { createFileRepository } from "@/data/repository/file-repository";
export { createPostgresRepository } from "@/data/repository/postgres-repository";

let cached: StoreRepository | null = null;

/**
 * Pick the persistence adapter.
 *
 * DATABASE_URL wins when present (Neon on Vercel). Without it the app falls
 * back to the atomic local JSON file so `npm run dev` needs no setup.
 */
export function getRepository(): StoreRepository {
  if (cached) return cached;
  const connectionString = process.env.DATABASE_URL;
  cached = connectionString ? createPostgresRepository(connectionString) : createFileRepository();
  return cached;
}

/** Test helper: drop the memoised adapter so env changes are observed. */
export function resetRepositoryCache(): void {
  cached = null;
}
