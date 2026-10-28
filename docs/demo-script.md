# 4-minute demo script

## 0:00–0:30 — Sign in and overview

Sign in as `maya@thedatecrew.demo` / `DemoMatch123!` (the login screen also lists
`arjun@thedatecrew.demo` / `ArjunMatch123!`). Point out that customer counts,
pipeline, shortlist counts, and outbox counts are computed from the sample store.
Mention that all data is fictional. If you sign in as Arjun, only his six
customers appear — ownership is enforced by the API, not the UI.

## 0:30–1:20 — Customer context

Open Customers. Search by city or profession, filter by journey stage and
verification, then sort by completeness. Open a profile and show personal,
career (numeric annual income), family (optional religion and caste), lifestyle
(children / pets / relocation as Yes–Maybe–No), partner preferences,
verification/consent, and profile completeness. Explain that missing facts say
"Not provided", not "no". Change the journey stage and add a dated call note;
both appear in the timeline, authored by the signed-in matchmaker.

## 1:20–2:50 — Explainable matching

Open Match Finder and pick a customer. The pool is 200 profiles, 100 of each
gender, so every customer has at least 100 opposite-gender candidates. Start
with Recommended, then show Mutual Fit and the shortlisted/sent views. Open
"Why this match?" and compare forward and reverse fit, the full weighted
breakdown, supported reasons, and trade-offs. Point out the assessment-signal
component: it is enabled by default, capped at 10%, and suppressed by an explicit
age or height preference. Open "How scoring works" to show the weights, the
renormalisation rule (the remaining seven dimensions return to the brief's
30/20/15/10/10/10/5), and the fairness note.

## 2:50–3:40 — Human-reviewed send

Shortlist a profile, then click Send Match. Show the synthetic recipient, profile
summary, deterministic score, and editable introduction. Explain that Gemini
writes a draft when configured and the visible template fallback runs when it is
not. Optionally click "Explain with AI" in the expanded match to show the second
grounded AI feature. Confirm once, then show the `Sent (Demo)` record in the
outbox. No real email has been sent.

## 3:40–4:00 — Engineering close

Open Settings to show the signed-in matchmaker, the active persistence adapter
(Neon Postgres on the deployed site, local JSON in development), the Gemini
configuration state, and the demo security disclaimer. The matcher is an
isolated deterministic module with unit tests; the repository abstraction keeps
the persistence adapter swappable.
