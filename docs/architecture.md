# Architecture and trade-offs

## Application map

- `src/app/`: App Router pages, global styles, and route handlers.
- `src/auth/`: scrypt password hashing, matchmaker lookup, HMAC-signed sessions,
  HTTP-only cookie helpers, and the in-memory login throttle.
- `src/data/seed.ts`: deterministic fixtures for 12 assigned customers, 200
  candidates (100 women, 100 men), and two matchmakers.
- `src/data/repository/`: the persistence contract plus file and Postgres
  adapters.
- `src/data/store.ts`: the only persistence surface used by routes
  (`readStore`, `updateStore`, `resetStore`) with an in-process write queue.
- `src/data/scope.ts`: reduces a snapshot to one matchmaker's customers.
- `src/domain/`: shared types, Zod validation, and the action service.
- `src/matching/`: weights, eligibility, tri-state rules, compatibility
  components, assessment signals, and the scorer.
- `src/ai/`: server-only Gemini client, introduction drafts, and match
  explanations.
- `src/components/`: shell, dashboard, directory, customer detail, match finder,
  outbox, and settings. Large views are split by concern.

## Request and persistence flow

1. `/` verifies the signed session, resolves the matchmaker from the store, and
   redirects unauthenticated visitors to `/login`.
2. Login validates with Zod, checks the scrypt hash, rate-limits failures in
   memory, and issues an HTTP-only, SameSite Strict cookie carrying the
   matchmaker ID.
3. `/api/workspace` reads the snapshot and scopes it to the signed-in
   matchmaker before responding. Candidates are a shared pool; customers, notes,
   activity, interactions, and introductions are owner-only.
4. `/api/actions` validates again on the server, resolves the actor from the
   session, and runs the domain action service inside a store transaction.
5. Match ranking is deterministic and recomputed from current data. AI is only
   called from `/api/ai/intro` and `/api/ai/explain`; both recompute the pair and
   score server-side.
6. Confirming an introduction writes the outbox record and activity event in one
   serialised update. There is no mail transport.

## Persistence

The repository contract is deliberately small:

```ts
readVersioned(): Promise<{ store: DemoStore; version: number } | null>
write(store: DemoStore, expectedVersion: number): Promise<boolean>
reset(): Promise<DemoStore>
```

- **Neon Postgres (production):** the whole snapshot lives in one `jsonb` row in
  `demo_store`. Reads select the row and its `version`; writes are
  compare-and-swap (`UPDATE ... WHERE version = expected RETURNING version`).
  A losing writer gets `false`, and `updateStore` re-reads and replays the
  mutation, up to three attempts. Two serverless instances therefore cannot
  silently overwrite each other. The table is created lazily on first use, so
  `next build` never touches the database and a fresh project needs no migration
  step; an `ALTER TABLE ... ADD COLUMN IF NOT EXISTS version` keeps an
  already-deployed table compatible.
- **Local file (development):** an atomic temp-write + rename, mode `0600`, in
  `.data/` by default or `DATA_DIR` when set.
- **Selection:** `DATABASE_URL` present selects Postgres; otherwise the file
  adapter runs. `npm run seed` loads `.env.local` and resets whichever adapter is
  active.

### Why a snapshot instead of tables

No database credentials were supplied for most of the assessment, and the brief
allows a clearly documented demo mode with a repository abstraction. A single
`jsonb` row preserves the exact semantics of the file store while making writes
durable on Vercel's ephemeral filesystem, with one new dependency and no
migration pipeline.

A `version` column makes writes compare-and-swap. If two instances read the same
version, only one `UPDATE ... WHERE version = expected` succeeds; the loser
re-reads and replays the mutation (up to three attempts). This closes the
last-write-wins hole that a naive upsert would leave on Vercel.

The trade-offs are explicit:

- Sustained contention can exhaust the three-attempt budget; the user sees a
  "workspace was updated elsewhere, please retry" message rather than silent
  data loss.
- There are no per-entity indexes, foreign keys, or row-level transactions.
- A production system would normalise `Profile`, `PartnerPreferences`,
  `MatchInteraction`, `MatchNote`, `ActivityEvent`, `Introduction`, and
  `Matchmaker`, then use per-row transactions and indexes.

## Authentication, privacy, and AI

Two fictional matchmakers are seeded with scrypt hashes and fixed demo salts.
Sessions are stateless and HMAC-signed for eight hours. The production build
refuses to start without a `SESSION_SECRET` of at least 32 characters. The login
throttle is per instance, not a distributed limiter.

Sensitive contact, religion, caste, and family details appear only in the
authenticated detail view. Candidate cards omit contact information. The API
scopes every read and write by `assignedMatchmakerId`, so hiding a button is
never the authorisation boundary.

AI uses Google Gemini's free tier through a server-only client with a 12-second
timeout, JSON output, and Zod validation. Two features use it:

1. **Introduction drafts**, grounded in first names plus minimal non-sensitive
   profile context and the deterministic reasons.
2. **Match explanations**, using the already computed score, component scores,
   grounded reasons, and trade-offs.

The key is read from `GEMINI_API_KEY`, never returned to the client, and never
logged. A missing key, rate limit, rejected key, retired model, timeout, or
invalid payload produces a labelled template plus a user-safe reason. The
deterministic engine remains the sole source of the score.

## Deployment

Vercel Hobby plus a free Neon project. `DATABASE_URL`, `SESSION_SECRET`, and
`GEMINI_API_KEY` are set in the Vercel dashboard; the Neon Marketplace
integration can inject `DATABASE_URL`. AI routes allow up to 30 seconds. No paid
volume or server is required.

## Known limits

- Demo credentials are public by design and are not production security.
- One JSON snapshot has no cross-instance concurrency control.
- Gemini free-tier requests may be used by Google to improve their products;
  all submitted data is fictional and minimal.
- No real email delivery or account management.
