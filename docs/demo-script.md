# 4-minute demo script

## 0:00–0:30 — Sign in and overview

Use `matchmaker@thedatecrew.demo` / `DemoMatch123!`. Point out that the customer count, pipeline, shortlist count, and outbox count are computed from the sample store. Mention that this is an internal fictional-data demo.

## 0:30–1:20 — Customer context

Open Customers. Search by city or profession, filter by journey stage and verification, then sort by completeness. Open a profile and show personal, career, family, lifestyle, optional sensitive fields, partner preferences, verification/consent, and profile completeness. Explain that missing facts say “Not provided,” not “no.” Change the journey stage and add a dated call note; both should appear in the timeline after saving.

## 1:20–2:50 — Explainable matching

Open Match Finder and select a customer. Start with Recommended, then show Mutual Fit and the shortlisted/sent views. Open “Why this match?” and compare forward and reverse preference fit, weighted components, supported reasons, and trade-offs. Mention that a strict stated preference can filter a pair while unknown data is not a rejection. Open “How scoring works” for weights and the fairness note. Keep optional gender-specific demo heuristics off for the default preference-first example.

## 2:50–3:40 — Human-reviewed send

Shortlist a profile, then click Send Match. Show the synthetic recipient, profile summary, deterministic fit signal, and editable introduction. Explain that AI is optional; without a key the visible fallback is a grounded deterministic template. Confirm once, then show the `Sent (Demo)` item in the outbox. No real email has been sent.

## 3:40–4:00 — Engineering close

Show Settings for the local JSON persistence, optional AI configuration, and demo security disclaimer. The matcher is an isolated deterministic module with unit tests; a production rollout would replace the demo repository with a durable database and production authentication.
