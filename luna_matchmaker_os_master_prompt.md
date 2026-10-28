# Luna Master Prompt — The Date Crew Matchmaker OS

You are acting as a senior full-stack engineer, product designer, applied AI engineer, and pragmatic technical lead. Build a complete, polished, demonstrable MVP for the assessment below. Do not stop at a plan, mockup, or code snippets: inspect the existing workspace, implement the application, run it, test it, fix issues, and document how to run and demo it.

## 0. First: inspect the workspace and prior handoff

Before changing files:
1. Inspect the repository, package manager, existing code, environment configuration, and available assets.
2. Read any provided assignment brief, supporting materials, and `handoff.md` completely. Treat those files as the source of truth when present.
3. Preserve useful existing work. Do not blindly overwrite or recreate the project.
4. If no project exists, scaffold one with the architecture below.
5. Create or update `handoff.md` with current state, decisions, commands, known issues, and the next concrete steps.
6. Research the relevant product patterns before finalizing UX. Use official product/help/privacy documentation where possible:
   - Shaadi.com matching/search FAQ: https://www.shaadi.com/info/customer-relations/faq/match-making
   - Shaadi.com matches FAQ: https://support.shaadi.com/support/solutions/articles/48000953813-how-does-matches-option-help-me-to-get-more-matches-with-different-options-
   - Bumble profile prompts: https://support.bumble.com/hc/en-us/articles/31602664871453-Adding-profile-prompts
   - Bumble matching/privacy explanation: https://www.safety.bumble.com/privacy-policy/en
   Summarize useful findings and product decisions in `docs/research.md`. Do not copy any competitor UI or claim access to their proprietary algorithm. Use research to inform general patterns: two-way preferences, preferred/broader matches, verification, profile completeness, prompts/interests, shortlist/ignore, and clear next actions.

## 1. Product vision

Build **The Date Crew Matchmaker OS**: a premium internal CRM for human matchmakers managing customers, tracking the matchmaking journey, reviewing detailed biodata, ranking suitable opposite-gender demo profiles, explaining why recommendations fit, recording notes, and sending mock introductions.

The product should feel like a credible, calm, high-trust internal tool for a relationship-focused company—not a generic admin template, not a dating swipe clone, and not a flashy AI demo.

### Core workflow
1. Matchmaker logs in using a demo account.
2. Sees a dashboard of assigned clients, pipeline stages, and useful activity metrics.
3. Searches and filters clients, opens a detailed client profile, and reviews biodata and notes.
4. Clicks “Find Matches” and sees ranked suggestions from a pool of at least 100 opposite-gender dummy profiles.
5. Opens a match explanation, sees score breakdown and any preference trade-offs, then shortlists, dismisses, or sends a match.
6. “Send Match” opens a confirmation modal with the proposed recipient and profile summary; confirming creates a mock sent-introduction record and visible success toast/activity event. No real email is sent unless an email provider is deliberately configured.
7. Matchmaker adds a dated call/meeting note and advances the client's journey stage.

## 2. Stack and implementation choices

Prefer the following unless the existing project already has a sound, working alternative:
- Next.js App Router + TypeScript
- Tailwind CSS + shadcn/ui (or similarly accessible component primitives)
- PostgreSQL + Prisma ORM
- Zod validation
- Auth.js or a straightforward secure server-side credentials session appropriate to the existing setup
- OpenAI API through a server-only service module, with structured outputs where supported
- Vitest/Jest for unit tests and Playwright if time permits for a core smoke flow
- Vercel-compatible deployment

Do not introduce complex infrastructure that adds no assessment value. Keep modules clear and explainable. If PostgreSQL credentials are not available, make the app runnable in a clearly documented demo mode with seeded data and a repository abstraction or local persistent store that is safe for a demo. Do not make the app fail to load because an optional service is unconfigured.

### Suggested modules
- `auth/`: login/session and route protection
- `customers/`: customer list, details, journey status, notes
- `profiles/`: dummy candidate pool and partner preferences
- `matching/`: eligibility, scoring, explanations, ranking
- `ai/`: server-side intro generation and optional explanation enhancement
- `notifications/`: mock email/outbox
- `db/`: Prisma schema, seed script, repository/data access
- `components/`: shared UI primitives
- `docs/`: research, algorithm explanation, architecture, demo instructions

Keep business logic out of React components. Make the scoring engine deterministic and independently unit-testable.

## 3. Design direction

Create a polished, responsive, white-first interface with an editorial premium feel:
- Warm off-white/white surfaces, dark ink text, muted slate secondary text, restrained indigo or plum accent, subtle borders, thoughtful whitespace.
- A fixed/collapsible left sidebar on desktop; usable mobile navigation.
- Consistent typography, spacing, iconography, table density, form controls, hover/focus states, skeleton/loading states, empty states, and error states.
- Use shadcn/ui or equivalent accessible components. Avoid random emoji as primary icons, excessive gradients, glassmorphism, giant hero sections, decorative charts with fake data, and generic “AI” sparkles everywhere.
- Use fictional initials/avatars or locally generated placeholder portraits. Do not scrape or use real people's personal profiles/photos.
- Use compact profile cards that foreground name, age, city, profession, verification, stage, and match score.
- All controls must work. Do not leave dead buttons, fake links, nonfunctional filters, or decorative search fields.
- Include responsive layouts and accessible labels, keyboard focus, modal behavior, and semantic HTML.

### Main navigation
- Overview
- Customers
- Match Finder
- Sent Introductions
- Activity (optional if activity is integrated into profile timelines)
- Settings / Demo Account

### Overview dashboard
Include:
- Greeting and “New Customer” action (if customer creation is implemented)
- KPI cards backed by real seeded data: assigned customers, profiles awaiting review, matches shortlisted, introductions sent
- Journey pipeline / stage distribution
- Recent activity feed
- “Needs attention” list with meaningful reasons
- Quick actions to open customers and the Match Finder

Use computed figures from the database/demo dataset, not hardcoded decorative numbers.

## 4. Required customer and profile features

### Customer list
Show at least:
- Name
- Age (computed from DOB; handle invalid/missing DOB safely)
- City
- Marital status
- Gender
- Verification state
- Matchmaking journey status
- Profile completeness
- Last activity

Support working search by name/city/profession and filters for stage, city, marital status, gender, and verification. Include pagination or sensible client-side pagination. Clicking a row/card opens its detailed profile. Add sort controls for name, age, last activity, and profile completeness.

### Customer detail view
Present biodata in well-organized sections rather than a giant form:
**Personal:** first name, last name, gender, DOB, computed age, country, state, city, height, email, phone, marital status, languages.
**Education and career:** undergraduate college, degree, current company, designation, industry/profession, income band or annual income.
**Family and background:** siblings, family structure, religion, caste/community, mother tongue, family location, family values if volunteered.
**Lifestyle and future:** children preference, open to relocate, pets preference, smoking/drinking preference if provided, hobbies/interests, values, preferred relationship/marriage timeline.
**Matchmaking:** profile verification state and method, consent/status, profile completeness, assigned matchmaker, current journey stage, partner preferences, notes, and recent activity.
**Partner preferences:** preferred age range, height range if specified, cities/regions, marital status, education/career, language, religion/community only when explicitly selected by the customer, children preference, relocation, pets, and deal-breakers versus flexible preferences.

Use optional fields where information may not be supplied. Do not invent profile facts. Mark missing fields as “Not provided,” not as negative answers. Keep sensitive data such as phone/email visible only within the internal detail view and do not expose it in public-style match cards. Use fictional data only.

### Indian matchmaking-specific fields to consider
Add a useful subset beyond the required list: mother tongue, state/region, family structure, family values, relationship/marriage timeline, partner age range, preferred cities, children preference, lifestyle preferences, hobbies/interests, career/education preferences, deal-breakers, and profile verification status. Make caste/religion/community fields optional and preference-controlled; never assume them from a name or location.

### Journey stages
Define a typed enum such as:
- New Lead
- Onboarding
- Profile Incomplete
- Verified
- Matchmaking
- Introduction Sent
- Meeting Scheduled
- Follow-up
- Converted
- On Hold

Allow stage changes with validation and record each change in activity history. Do not make stages decorative.

### Notes and activity
- Add dated notes with author, note type (call/meeting/general/follow-up), and text.
- Display newest-first timeline.
- Validate empty notes and give clear feedback.
- Record important events: stage changes, shortlist, dismissal, introduction sent, and notes added.
- Ensure data survives refresh in the configured persistence mode.

## 5. Seed data: at least 100 dummy candidates

Create a reproducible seed script that generates at least 100 fictional candidate profiles, with a balanced distribution of genders and diverse Indian cities, languages, occupations, education, marital statuses, income bands, family structures, interests, and preferences. Ensure each customer can have an opposite-gender pool to search, and make sure the pool contains enough records to demonstrate ranking and filters. Create 10–20 assigned sample customers and at least 100 additional candidate records if needed.

Requirements:
- Use clearly fictional names and synthetic contact details (e.g. `example.test` domains and reserved/test phone formats); never use real contact information.
- Use deterministic seeded generation so the same seed creates the same records.
- Generate realistic but varied combinations and avoid impossible or contradictory data.
- Include verified/unverified state and profile completeness.
- Include partner preference fields, deal-breakers, values, lifestyle preferences, and interests.
- Include missing optional fields to test robustness.
- Provide a `seed` command and document how to reset/reseed the demo.
- The UI must visibly label the environment as demo/sample data where appropriate.

## 6. Matching engine: build this carefully

The algorithm is a key evaluation criterion. Do not use an opaque LLM score as the main ranking system. Build a deterministic, testable, explainable two-stage matching engine.

### Stage A — eligibility and hard constraints
For a customer and candidate:
1. Exclude the same profile and same person.
2. Require the opposite gender for this assessment's demo pool, while isolating this policy behind a clear eligibility function so the product can later support configurable orientations/preferences.
3. Exclude blocked, dismissed/ignored, or already-sent pairs when appropriate; allow an explicit “show previously contacted” option if implemented.
4. Apply explicit hard deal-breakers/preferences only when the customer has marked them as strict. Examples: age range, marital status, location constraints, children preference, and relocation.
5. Treat missing data as unknown, not automatically as a mismatch. Show an uncertainty penalty or “insufficient information” explanation rather than inventing a value.
6. Respect the candidate's preferences about the customer too. Calculate forward fit and reverse fit, then prioritize mutual compatibility.

### Stage B — weighted compatibility score
Implement an understandable score from 0–100 with a breakdown. Suggested initial weights (document and tune using seeded scenarios):
- Mutual partner-preference fit: 30%
- Values and relationship intentions: 20%
- Children/family plans: 15%
- Career/education/lifestyle compatibility: 10%
- Location and relocation compatibility: 10%
- Languages and interests: 10%
- Profile completeness/verification confidence: 5%

Normalize each component to 0–100 and define behavior for unknown values. Do not allow profile completeness or verification to overwhelm actual compatibility. Avoid double-counting the same preference in multiple categories. Provide configurable weights in one central module.

### Gender-specific assessment requirement — implement transparently
The assignment brief explicitly suggests:
- For male customers: consider a younger partner, lower relative income, shorter height, and aligned children preferences.
- For female customers: give particular attention to profession/career compatibility, values, and relocation preferences.

Implement this requirement as **transparent, configurable demo heuristics**, not as universal truths or hidden assumptions:
- Store these as optional assessment-specific scoring rules with visible explanations and configuration.
- Give explicit customer-stated preferences and mutual fit higher priority than gender-based defaults.
- Do not reject a candidate only because they violate a stereotype. Do not use gender to assign a person's worth or suitability.
- For male-customer scoring, if these assessment heuristics are enabled, give small, capped contributions for age direction, height preference, and relative income only when relevant data exists; children preference alignment should be treated as an explicit preference/value dimension for all genders.
- For female-customer scoring, include profession/career alignment, values, and relocation compatibility as explicit weighted dimensions. Apply these dimensions to all customers where data exists, even if the assessment specifically highlights female customers.
- Expose the scoring rationale in the UI and document limitations and fairness concerns.
- If the profile has explicit partner preferences, those override generic assessment defaults.

A strong alternative is to make gender-specific defaults a selectable “Assessment demo mode” while the default mode uses mutual preferences for all customers. Explain this clearly in the UI and documentation if implemented.

### Score output and explanations
The matching service should return a typed structure, e.g.:
- candidate ID
- overall score
- fit label: Excellent Potential / Strong Potential / Consider / Low Fit
- forward preference fit
- reverse preference fit
- component breakdown
- positive reasons (only facts supported by data)
- potential trade-offs / unknowns
- hard-filter result and reasons
- algorithm version
- AI-enhanced explanation or intro, if available

Use labels based on score thresholds defined in one place. Avoid overclaiming that a score predicts relationship success. Describe it as a decision-support signal for a human matchmaker.

### Ranking and match finder UX
- Tabs or filters for Recommended, Mutual Fit, Shortlisted, and Previously Sent.
- Show overall score and a compact breakdown.
- Add “Why this match?” expandable section with grounded reasons and trade-offs.
- Make clear whether the match is mutual or one-sided.
- Filter/sort by score, city, profession, verification, and key preferences.
- Allow shortlisting and dismissing; persist these actions.
- Add a “Refresh recommendations” action that recomputes scores from current profile data.
- Include a small “How scoring works” drawer/modal with weights and fairness note.
- Include at least one sample low-fit candidate to prove the system is not giving everyone a high score.
- Write unit tests for hard filters, mutual preference fit, unknown fields, scoring boundaries, gender-specific demo rules, ranking order, and excluded/previously-sent pairs.

## 7. AI integration: useful, grounded, optional, safe

AI integration is mandatory, but the app must remain usable without an API key.

Use OpenAI only through a server-side service. Never expose `OPENAI_API_KEY` in client code, browser bundles, network responses, or logs. Read it from environment variables.

Preferred AI features:
1. Generate a short personalized introduction for a matchmaker to review before sending.
2. Optionally convert the deterministic score breakdown into a concise, human-readable “Why this match?” explanation.

The deterministic scoring engine is the source of truth. AI must not independently assign or modify the compatibility score, override hard filters, infer protected/sensitive attributes, or invent common interests/values. Pass only the minimum necessary fictional profile fields and computed score reasons. Ask for structured JSON output validated with Zod. Use a low-variance prompt, set a sensible token limit, and handle timeout/API errors.

AI output rules:
- Clearly label generated content “AI draft — review before sending.”
- Never claim the candidates met, liked each other, or share a value unless the supplied data supports it.
- Avoid manipulative language, guarantees, or statements such as “perfect soulmate.”
- If AI is not configured or fails, generate a deterministic template from known profile facts and continue.
- Provide an edit-before-send step.
- Log that a draft was generated, but avoid logging unnecessary sensitive personal data.

Create `.env.example` with placeholders only and document setup. Never commit a real secret.

## 8. Send Match action and mock email

Every eligible suggestion needs a working **Send Match** action:
1. Open a confirmation modal showing the proposed recipient, client, candidate summary, score, and intro text.
2. Let the matchmaker edit the intro.
3. Confirm action.
4. Create a mock outbox/introduction record with status `Sent (Demo)` and timestamp.
5. Show a toast and add a timeline/activity event.
6. Update the Sent Introductions page and prevent accidental duplicate sends.
7. Provide a way to inspect the mock message details.
8. Do not actually send email by default. Clearly label the action as simulated.
9. Ensure errors are handled and success is shown only after the record is persisted.

## 9. Authentication, privacy, and validation

This is an internal tool, so implement a credible demo login:
- Provide sample credentials in the README, e.g. `matchmaker@thedatecrew.demo` / `DemoMatch123!`, unless the existing project already defines another documented account.
- Hash passwords if stored in the database.
- Protect internal routes and server actions/API endpoints.
- Validate all input server-side with Zod.
- Use secure, HTTP-only session cookies where applicable.
- Never put secrets in client bundles.
- Do not rely only on hiding UI controls for authorization.
- Avoid leaking full biodata in logs or public routes.
- Add basic rate limiting for login if feasible in the available time.
- Document that demo credentials/data are not production security.
- Treat caste/religion and family information as sensitive, optional data. Only use explicitly supplied customer preferences; never infer these attributes.
- No real emails, real phone numbers, or scraped profiles.

## 10. Suggested data model

Adapt as necessary but keep relationships explicit:
- `User` / `Matchmaker`
- `CustomerProfile`
- `PartnerPreference`
- `MatchInteraction` (shortlisted/dismissed/sent, unique pair where appropriate)
- `MatchNote`
- `ActivityEvent`
- `Introduction` / mock outbox
- optional `ScoringConfiguration` or versioned scoring config

Use enums for stages, verification, interaction status, note type, and introduction status. Add indexes for fields used in common filters. Keep the schema understandable and explain important trade-offs.

## 11. Quality bar and acceptance criteria

Do not call the project complete until the following are satisfied or clearly reported as blocked:

### Product
- [ ] Login works with documented demo credentials.
- [ ] Internal pages are protected.
- [ ] Dashboard metrics derive from seeded records.
- [ ] Customer directory has at least 10 assigned clients and functional search/filter/sort.
- [ ] Customer detail shows all fields requested by the brief, plus relevant Indian matchmaking fields.
- [ ] Journey stages can be changed and recorded.
- [ ] Notes can be created and persist.
- [ ] At least 100 fictional candidate profiles exist.
- [ ] Match Finder filters, ranks, and explains candidates.
- [ ] Mutual preferences and hard constraints work.
- [ ] Score breakdown and “Why this match?” are grounded in profile data.
- [ ] Shortlist/dismiss actions persist.
- [ ] Send Match modal and mock outbox work.
- [ ] AI draft generation works with a key and deterministic fallback works without one.
- [ ] UI is responsive, coherent, accessible, and free of obvious dead controls.
- [ ] Loading, empty, error, and success states are implemented.

### Engineering
- [ ] TypeScript types are meaningful; avoid `any` unless justified.
- [ ] Matching engine is isolated from UI and has unit tests.
- [ ] Server-side validation is present.
- [ ] Seed/reset flow is documented.
- [ ] `.env.example` exists and contains no secrets.
- [ ] No sensitive data or API keys are exposed to the client.
- [ ] Lint, typecheck, tests, and production build run successfully, or failures are listed honestly.
- [ ] README includes install, environment setup, database setup, seed, dev, test, build, deployment, and demo credentials.
- [ ] `docs/algorithm.md` explains formulas, weights, hard filters, mutual fit, missing-data handling, gender-specific assessment defaults, fairness limitations, and sample examples.
- [ ] `docs/architecture.md` describes components, data flow, persistence, auth, AI fallback, and trade-offs.
- [ ] `docs/research.md` summarizes competitor research and what was adopted/avoided.
- [ ] `docs/demo-script.md` gives a 3–5 minute walkthrough.
- [ ] `handoff.md` records final status and anything unfinished.

## 12. Deliverable documentation

Create a ready-to-submit `docs/matching-logic-submission.md` with the assessment's requested 2–3 paragraph write-up covering:
- AI integration and deterministic fallback
- Algorithm design and mutual compatibility
- Assumptions, demo constraints, and fairness limitations

Also create a submission checklist containing:
- Live demo URL placeholder until actually deployed
- GitHub repository URL placeholder until actually pushed
- Demo login credentials
- Resume/portfolio reminder
- Email recipient `tech@thedatecrew.com`
- Subject: `Full Stack Developer Internship – [Your Name] – Assignment`

Never invent a deployed URL or claim a repository was pushed when it was not.

## 13. Execution plan — work autonomously and report truthfully

Work in this order, adapting to the actual repository:
1. Inspect workspace and assignment materials; write a short implementation plan in `handoff.md`.
2. Research product patterns and document findings.
3. Establish schema, seed data, auth, and reliable persistence.
4. Build the shared design system and app shell.
5. Build dashboard, customer list, customer detail, notes, and stage updates.
6. Implement/test deterministic matching engine before building match UI.
7. Build Match Finder, explanation breakdown, shortlist/dismiss, and mock sending.
8. Add server-side AI intro generation and fallback.
9. Run seed, lint, typecheck, tests, and production build. Fix all fixable failures.
10. Run the app and exercise the main end-to-end flow manually or with browser tests if available.
11. Finish documentation and update `handoff.md`.
12. If deployment credentials/tools are available, deploy. Otherwise provide exact deployment instructions and never claim deployment succeeded.

Do not ask me to approve every small decision. Make sensible assumptions, record them, and continue. Ask a question only if a genuinely blocking ambiguity cannot be safely resolved from the brief or workspace.

## 14. Final report required

At the end, report:
1. What was built and what works.
2. Exact commands to install, configure, seed, run, test, and build.
3. Demo credentials.
4. Database/persistence mode and whether AI is configured.
5. Tests/build results with actual pass/fail status.
6. Live URL and repository URL only if they truly exist.
7. Files created/updated.
8. Known limitations and any unfinished requirements.
9. A short, confident walkthrough I can use when the evaluator asks me to explain the architecture and matching algorithm.

Prioritize a complete, reliable, polished vertical slice over an enormous unfinished feature set. Do not fake test results, deployment, emails, AI responses, verification, or profile facts.
