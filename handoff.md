# Handoff — The Date Crew Matchmaker OS

## Current state

The workspace is a working Next.js 16 App Router application with:

- Two demo matchmakers (Maya Shah, Arjun Rao), each owning six customers.
  Passwords are stored as scrypt hashes; sessions are HMAC-signed HTTP-only
  cookies carrying the matchmaker ID.
- 12 assigned customers and 200 fictional candidates (100 women, 100 men), so
  every customer has at least 100 opposite-gender profiles.
- Customer directory with search, filters, sorting, and pagination; full
  biodata grouped into personal, career, family, lifestyle, matchmaking, and
  partner-preference sections.
- Journey stages, dated notes authored by the signed-in matchmaker, activity
  timelines, shortlist/dismiss/restore, and a simulated introductions outbox.
- Deterministic two-stage matching engine with mutual preference fit,
  component weights, unknown-data handling, fit labels, and grounded reasons.
- Assessment signals are a visible 10% component, enabled by default, and
  suppressed by explicit preferences.
- Two Gemini features: introduction drafts and "why this match" explanations,
  both with a labelled deterministic fallback.
- Persistence through one repository contract: Neon Postgres (`jsonb` snapshot)
  in production, atomic JSON file locally.
- Settings and error/empty/loading states; responsive shell.

## Key decisions

- **Deterministic score, AI as a writing assist.** Gemini never computes or
  changes a score; both AI routes recompute the pair server-side.
- **Assessment signals are real scoring, not a bonus.** They are 10% of the
  score, visible per match, capped, and skipped when an explicit preference
  exists. With them off, the remaining weights renormalise to the brief's
  30/20/15/10/10/10/5.
- **Yes / Maybe / No everywhere.** Children, pets, and relocation use the same
  three-state model. `Maybe` is compatible, not a missing value.
- **Numeric income.** Annual INR figures replaced band strings, so relative
  income comparisons are exact and the UI can format LPA consistently.
- **One `jsonb` row, not Prisma.** Fastest free path to durable storage on
  Vercel. The repository contract is deliberately small so normalised tables can
  replace it later.
- **Server-side ownership.** Every route scopes reads and writes by
  `assignedMatchmakerId`; the client never filters for security.

## Commands and credentials

```bash
npm install
cp .env.example .env.local
npm run seed
npm run dev
npm test
npm run lint
npm run typecheck
npm run build
npm run ai:smoke   # requires GEMINI_API_KEY
```

| Matchmaker | Email | Password |
|---|---|---|
| Maya Shah | `maya@thedatecrew.demo` | `DemoMatch123!` |
| Arjun Rao | `arjun@thedatecrew.demo` | `ArjunMatch123!` |

## Verification

- `npm test`: **125 tests passing across 13 files**.
- `npm run lint`: pass.
- `npm run typecheck`: pass.
- `npm run build`: pass on Next.js 16.4.3 (the 16.4.0 security advisory is
  resolved).
- Live smoke test on a production build:
  - both demo logins succeed and return the correct matchmaker;
  - Maya sees 6 customers + 200 candidates, Arjun sees 6 + 200;
  - Maya's note against Arjun's customer is rejected with HTTP 400;
  - a note is attributed to Maya Shah;
  - Gemini intro and explanation return `source: gemini`;
  - a send creates `Sent (Demo)` and a duplicate send is rejected;
  - notes and the outbox survive a full process restart;
  - `npm run seed` restores the clean demo.

## Not yet verified

- The Neon adapter has **not** been integration-tested against a live database
  because `DATABASE_URL` was not available in this session. It compiles, the
  file adapter is fully tested, and the SQL is limited to create/select/upsert.
  Run `npm run seed` with `DATABASE_URL` set and exercise a note + send before
  trusting the deployment.
- No Vercel deployment has been performed. The repository is ready to import;
  see the README for the exact environment variables.
- No browser walkthrough was performed in this session (the browser pane was
  unavailable); behaviour was verified through the production build and API.

## Next steps

1. Create the free Neon project and add `DATABASE_URL`, `SESSION_SECRET`, and
   `GEMINI_API_KEY` in Vercel.
2. Import the repository, deploy, and verify login → match → shortlist → send →
   reload → data still present.
3. Run `npm run seed` once against the deployed database if a clean demo is
   preferred.
4. Update `docs/submission-checklist.md` with the live URL.
