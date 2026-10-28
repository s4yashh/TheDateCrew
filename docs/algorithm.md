# Matching algorithm

Algorithm version: `mutual-fit-v2.0`. The score is a decision-support signal for
a human matchmaker, not a prediction of relationship success. Eligibility and
scoring are isolated in `src/matching/` and unit-tested without React.

## Stage A — eligibility

- Reject the same profile ID, or records with the same name and date of birth.
- The assessment demo requires opposite-gender pairs. This policy is isolated
  in `checkEligibility` so it can later be replaced by customer-configured
  orientation preferences.
- Exclude a per-customer dismissed or already-sent pair from new
  recommendations. Separate views expose previously sent and dismissed
  profiles, and scoring can request previously contacted pairs without allowing
  a duplicate send.
- Evaluate strict preferences symmetrically in both directions: age, height,
  city, marital status, children preference, and relocation. Only a preference
  the customer marked `strict` can reject a pair.
- Missing values never fail a hard rule. They stay unknown, appear as a
  trade-off, and add to the uncertainty deduction.

### Three-state answers

Children, pets, and relocation are `Yes | Maybe | No`:

- **Strict children rule:** `Maybe` on either side is compatible. `Yes` vs `No`
  is the only hard conflict.
- **Strict relocation rule:** the preference means "my partner must be open to
  relocating". Only `Yes` against a candidate's `No` rejects the pair.
- **Scoring:** identical answers score 100, any `Maybe` scores 70, and
  `Yes` vs `No` scores 15 (preference fit) or 25 (profile-to-profile).

## Stage B — weighted score

Each component is normalised to 0–100. The score is the weighted sum, less a
capped uncertainty deduction:

| Component | Weight |
| --- | ---: |
| Mutual partner-preference fit (forward + reverse) | 27% |
| Values and relationship intentions | 18% |
| Children and family plans | 14% |
| Career, education, and lifestyle | 9% |
| Location and relocation | 9% |
| Languages and interests | 9% |
| Profile completeness and verification confidence | 4% |
| Assessment signals (gender-specific demo rules) | 10% |

The weights are centralised in `SCORE_WEIGHTS` and sum to 100.

**Renormalisation.** Components with no usable data are excluded and the score
is divided by the weight that actually applies. This prevents a missing
dimension from silently awarding a neutral 50. When the assessment signals do
not apply (for example a female customer in this demo), the remaining seven
dimensions renormalise to exactly the brief's **30 / 20 / 15 / 10 / 10 / 10 / 5**
proportions.

Forward fit checks the customer's recorded preferences against the candidate.
Reverse fit checks the candidate's preferences against the customer. Their mean
is the preference component; `mutual` is true when both directional fits are at
least 65.

Unknown subdimensions are not assigned a mismatch value. Each unknown adds a
0.45-point deduction, capped at 10 points overall, and appears in "Trade-offs &
unknowns". The confidence component averages profile completeness with modest
verified-profile increments.

Fit labels: 82–100 Excellent Potential, 68–81 Strong Potential, 50–67 Consider,
under 50 Low Fit. The seed includes a deliberately low-fit example
(`candidate-119`).

## Assessment signals and fairness

**Enabled by default.** The toggle in Settings and the scoring guide turns them
off; the preference is stored per browser. These are assessment-specific
assumptions, never evidence-based claims about what men or women want, and they
are never eligibility rules.

- **Male customers:** three directional signals — younger age, shorter height,
  and lower relative income. Age and height are skipped when the customer has
  stated an explicit range. Income uses exact annual figures, not bands.
- **Female customers:** career, values, and relocation are already first-class
  weighted dimensions applied to every customer, so no duplicate bonus is added.
- **Children:** alignment is scored for every gender in the family dimension and
  is never double-counted as an assessment signal.
- **Explicit preferences win:** a stated age or height range suppresses the
  matching signal. Strict preferences still run in Stage A.
- **Bounded:** the component is 10% of the score, and it cannot reject anyone.

These defaults can reinforce stereotypes, so they are visible per match,
separately labelled, capped, and removable. Religion and caste are optional,
explicitly recorded, excluded from scoring, and never inferred.

## Example interpretation

A strong recommendation can have a high overall signal with both directional
fits above 65 and several grounded overlaps. A one-sided recommendation can
still appear when hard rules allow it, but it is not labelled mutual. A missing
date of birth does not fail an age rule; the pair stays eligible on that unknown
and the explanation asks the matchmaker to confirm. A strict known age violation
excludes the pair. Shortlist, dismiss, and send actions are not score inputs and
are persisted separately.
