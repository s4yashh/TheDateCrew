# TheDateCrew

The Date Crew Matchmaker OS is a private, high-trust workspace demo for matchmakers. It brings together customer biodata, journey tracking, notes, explainable two-way match recommendations, shortlists, and a simulated introductions outbox.

## Demo account

- Email: `matchmaker@thedatecrew.demo`
- Password: `DemoMatch123!`

Credentials are prefilled on the login screen. All people, profile details, email addresses, and phone numbers are fictional. No email is delivered.

## Run locally

Requirements: Node.js 20.9+ and npm.

```bash
npm install
cp .env.example .env.local
npm run seed
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The first run also initializes the seed automatically if no store exists.

`npm run seed` deterministically resets `.data/demo-store.json` to 12 assigned sample customers, 120 candidates, and the starter notes/introductions. The local JSON repository keeps notes, stage changes, shortlists, dismissals, and mock introductions across refreshes. `.data/` is ignored by Git.

## Environment

`.env.example` contains placeholders and safe demo defaults. Set a random `SESSION_SECRET` of at least 32 characters before production. Demo credentials can be changed with `DEMO_LOGIN_EMAIL` and `DEMO_LOGIN_PASSWORD`. Set `OPENAI_API_KEY` to enable server-side introduction drafting; otherwise, a deterministic reviewed template is used. `OPENAI_MODEL` defaults to `gpt-4.1-mini`.

The OpenAI key is read only by the server route. It is never sent to client components. AI is a writing assist only: the deterministic matcher remains the score source of truth.

## Commands

```bash
npm run dev        # local development
npm run seed       # reset/reseed the demo store
npm test           # Vitest unit tests
npm run lint       # ESLint
npm run typecheck  # TypeScript
npm run build      # production build
npm run start      # serve production build
```

## Demo walkthrough

1. Sign in with the demo account and scan the data-backed pipeline on Overview.
2. Open Customers; try search, filters, sorting, then open a profile and change its stage or add a dated note.
3. Open Match Finder, choose a customer, review a mutual-fit recommendation and its grounded reasons/trade-offs.
4. Shortlist a profile or prepare a reviewed introduction. Confirming the action writes a `Sent (Demo)` record only.
5. Inspect Sent Introductions and Settings to review privacy, persistence, and optional assessment heuristics.

## Architecture & limits

See `docs/architecture.md`, `docs/algorithm.md`, `docs/research.md`, and `docs/demo-script.md` for implementation details. The demo repository is a serialized, atomic local JSON file—not PostgreSQL/Prisma. It is intentionally appropriate for one local demo process, not multi-instance production. Although the Next.js app builds cleanly, a durable database adapter is required before deployment to an ephemeral/serverless host such as Vercel. No live URL has been deployed.

Assessment notes and submission checklist: `docs/matching-logic-submission.md` and `docs/submission-checklist.md`.
