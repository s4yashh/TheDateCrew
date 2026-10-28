# Architecture and trade-offs

## Application map

- `src/app/`: Next.js App Router pages, global styles, and route handlers.
- `src/auth/session.ts`: HMAC-signed eight-hour session token, HTTP-only cookie helpers, credential comparison, and in-memory demo login throttling.
- `src/data/seed.ts`: deterministic fixture generator for 12 assigned customers and 120 fictional candidates.
- `src/data/store.ts`: local JSON repository; serializes in-process writes and commits with a temporary file plus atomic rename.
- `src/domain/`: shared types, Zod request validation, and action service for stages, notes, interactions, and mock introductions.
- `src/matching/scoring.ts`: isolated eligibility, mutual fit, component scoring, explanations, and ranking.
- `src/ai/introduction.ts`: server-only optional OpenAI structured-output draft with deterministic template fallback.
- `src/components/`: responsive app shell, dashboard, directory, profile details, match finder, scoring guide, introduction modal/outbox, and settings.

## Request and persistence flow

1. `/` checks the signed session on the server and redirects unauthenticated visitors to `/login`.
2. Login is validated with Zod, compared against environment-configured demo credentials, rate-limited in memory, and issued an HTTP-only, SameSite Strict cookie. Protected API routes verify its signature and expiry independently; hiding a button is not the authorization boundary.
3. `/api/workspace` reads the local repository for the authenticated internal client. `/api/actions` validates all changes again on the server and calls a domain action service before writing state.
4. Match ranking runs deterministically from current profile data. AI is called only from `/api/ai/intro`; it receives a minimal set of synthetic names, limited public profile context, the deterministic score, and grounded reasons. Drafts are Zod-validated; any provider error falls back to a local template.
5. Confirming an introduction writes the local outbox and activity timeline in one serialized store update. There is no mail transport configured.

## Persistence and deployment

PostgreSQL credentials were not supplied, so the brief’s safe demo-mode fallback is implemented as `.data/demo-store.json`. The file survives local refresh/restart, is created on first request or with `npm run seed`, and is excluded from Git. An in-process promise queue plus atomic rename prevents concurrent local writes from partially replacing the file.

This store is **not** a production database: it has no multi-process lock, cross-instance consistency, backup, encryption-at-rest policy, or serverless durability. Before a public/multi-user deployment, replace the repository adapter with PostgreSQL/Prisma (or another durable store), add production account management and security controls, and migrate sensitive fields/retention to the organization’s policy. The app compiles as a Next.js production build, but Vercel’s ephemeral filesystem must not be treated as durable storage.

## Authentication, privacy, and AI

The demo uses a signed stateless cookie and environment-held credentials; it does not store a password hash or issue real user accounts. The fixed local-only development signing secret is rejected in production unless `SESSION_SECRET` is configured with at least 32 characters. Demo data and credentials are not production security. The login throttle is in-memory and is not a distributed rate limiter.

Sensitive contact, religion, community, and family details are shown only in the authenticated profile detail view. Public-style candidate cards omit contact information. AI receives no contact details, religion, or community; no API key is included in a client bundle. The AI text is a draft with a visible source label, editable before confirming, and never changes deterministic scores.
