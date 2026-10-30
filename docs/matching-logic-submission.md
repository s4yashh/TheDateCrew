# Matching logic submission

AI is used as an optional server-side writing assistant for two tasks: a
matchmaker-reviewed introduction draft and a readable explanation of an
already-computed match. Both use Google Gemini's free tier through a server-only
module. The model receives a minimal set of fictional, non-sensitive fields and
the deterministic matcher's grounded reasons and trade-offs; responses are
structured JSON validated with Zod. Drafts and explanations are clearly
labelled, editable where relevant, and never change the score. If
`GEMINI_API_KEY` is absent, rate-limited, rejected, timed out, or returns an
invalid payload, the app falls back to a deterministic template and shows why.
AI never calculates compatibility, overrides eligibility, or infers a shared
interest, religion, or caste.

The matcher is a deterministic two-stage decision-support system. Eligibility
first checks identity, the assessment's opposite-gender demo policy, previously
dismissed or sent pairs, and only explicitly strict preferences from both
sides. Eligible pairs receive a 0–100 score across mutual preference fit, values
and intentions, children and family plans, career/education/lifestyle, location
and relocation, languages and interests, and profile confidence. Weights live in
one module and renormalise over the dimensions that actually have data, so a
missing answer is never silently scored as a neutral value; for customers without
assessment signals the seven base dimensions restore the brief's
30/20/15/10/10/10/5 proportions. Children, pets, and relocation use Yes / Maybe /
No, where "Maybe" is compatible rather than a mismatch. Income is an exact annual
figure, so relative-income comparisons are numeric rather than band-based.
Forward and reverse preference fit are exposed separately, missing details incur
a bounded uncertainty deduction, and written explanations cite only known profile
facts.

The assessment's gender-specific requirement is a visible 10% component enabled
by default, not a hidden bonus. For male customers it considers age direction,
relative height, and relative income only when the customer has not stated an
explicit preference for that field; explicit preferences suppress the matching
signal and still run as hard filters when marked strict. Children alignment is
scored for every gender in the family dimension rather than double-counted.
Female-customer emphasis uses the ordinary career, values, and relocation
dimensions, which apply to all customers. These are assessment-specific
assumptions, not evidence-based claims, so they are capped, labelled, explained
per match, and can be switched off. Assumptions in this submission are the
fictional 12-customer / 200-candidate pool, the demo-only opposite-gender rule,
two shared demo accounts, and a single-row Neon `jsonb` snapshot with
compare-and-swap writes and a bounded retry budget; sustained contention can
surface a retry prompt rather than losing data. Demo credentials, data,
and mock email are not production security or delivery infrastructure. Religion,
caste, and family identity are optional, explicitly recorded, never inferred, and
excluded from the score.
