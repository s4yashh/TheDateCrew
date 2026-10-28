# TheDateCrew — Matchmaker OS

A private, high-trust workspace for human matchmakers: customer biodata, journey
tracking, notes, explainable two-way match recommendations, shortlists, and a
simulated introductions outbox.

All people, profile details, email addresses, and phone numbers are fictional.
No email is delivered.

## Demo accounts

| Matchmaker | Email | Password |
|---|---|---|
| Maya Shah | `maya@thedatecrew.demo` | `DemoMatch123!` |
| Arjun Rao | `arjun@thedatecrew.demo` | `ArjunMatch123!` |

Each account owns six assigned customers. Notes are authored by the signed-in
matchmaker, and the API refuses access to the other account's customers.

## Stack

- Next.js 16 (App Router, Turbopack) + React 19 + TypeScript
- Zod for request and AI-response validation
- Deterministic matching engine in `src/matching/` (no LLM in the score)
- Google Gemini for optional introduction drafts and match explanations
- Neon Postgres (`jsonb` snapshot) in production, atomic JSON file locally
- Vitest + ESLint + TypeScript in CI order

## Run locally

Requirements: Node.js 20.9+ and npm.

```bash
npm install
cp .env.example .env.local
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The first request also
seeds automatically if no store exists.

`npm run seed` deterministically resets the workspace to 12 assigned customers
(6 per matchmaker), 200 candidates (100 women, 100 men), and the starter
notes/introductions. With `DATABASE_URL` set it resets Neon; otherwise it writes
`.data/demo-store.json`. `.data/` is ignored by Git.

## Environment

| Variable | Purpose |
|---|---|
| `SESSION_SECRET` | HMAC key for the signed session cookie. Required in production (32+ chars). |
| `GEMINI_API_KEY` | Enables Gemini drafts/explanations. Without it, reviewed templates are used. |
| `GEMINI_MODEL` | Optional override. Defaults to `gemini-3.1-flash-lite`. |
| `DATABASE_URL` | Neon Postgres connection string. Leave empty for the local file store. |
| `DATA_DIR` | Optional directory for the local file store. |

The Gemini key is read only by server routes. It is never included in a client
bundle, response, or log.

## Commands

```bash
npm run dev        # local development
npm run seed       # reset/reseed the active store
npm run ai:smoke   # exercise the real Gemini intro + explanation paths
npm test           # Vitest unit tests
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm run build      # production build
npm run start      # serve the production build
```

## Deploy to Vercel (free tier)

1. Create a free Neon project and copy the pooled connection string.
2. Import `s4yashh/TheDateCrew` in the Vercel dashboard (Hobby plan).
3. Add the environment variables:
   ```text
   DATABASE_URL=<Neon pooled connection string>
   SESSION_SECRET=<32+ random characters>
   GEMINI_API_KEY=<your Gemini key>
   GEMINI_MODEL=gemini-3.1-flash-lite   # optional
   ```
   The Neon integration in the Vercel Marketplace can inject `DATABASE_URL`
   automatically.
4. Deploy. The `demo_store` table is created on first request.
5. Run `npm run seed` locally with the same `DATABASE_URL` if you want to reset
   the deployed snapshot.

No paid plan is required. The store is a single `jsonb` row, so it is
last-write-wins across serverless instances; see `docs/architecture.md`.

## Matching in one paragraph

Eligibility runs first: identity, the assessment's opposite-gender pool rule,
previously dismissed/sent pairs, and only explicitly strict preferences from
both sides. Eligible pairs get a 0–100 weighted score across mutual preference
fit, values, family plans, career/lifestyle, location, languages/interests, and
profile confidence. The assessment's gender-specific signals are a visible 10%
component, enabled by default, suppressed by any explicit preference, and never
used for eligibility. Missing data is unknown, not a mismatch. Scores are
decision support for a human matchmaker, not predictions.

## Documentation

- `docs/algorithm.md` — weights, hard filters, tri-state rules, fairness
- `docs/architecture.md` — modules, persistence, auth, AI, deployment
- `docs/research.md` — product research and what was adopted
- `docs/demo-script.md` — 4-minute walkthrough
- `docs/matching-logic-submission.md` — assessment write-up
- `docs/submission-checklist.md` — submission checklist
- `handoff.md` — current state and verification results

## Known limits

- Demo authentication: two shared fictional accounts, no account management.
- One `jsonb` snapshot, not a normalised schema; no per-entity transactions.
- Gemini free-tier content may be used by Google to improve their products; all
  submitted data is synthetic.
- No real email transport. "Send" writes a `Sent (Demo)` record and activity
  event only.
- The in-process login throttle is per instance, not a distributed limiter.
