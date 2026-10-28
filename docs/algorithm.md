# Matching algorithm

Algorithm version: `mutual-fit-v1.0`. The score is a decision-support signal for a human matchmaker, not a prediction of relationship success. Scoring and eligibility live in `src/matching/scoring.ts` and are unit tested independently of React.

## Stage A — eligibility

- Reject the same profile ID or records that have the same name and date of birth.
- Assessment demo policy currently requires opposite-gender pairs. This rule is isolated in `checkEligibility` so a future product can replace it with customer-configured orientation and partner-gender preferences. This assessment demo does not implement that broader model.
- Exclude a per-customer dismissed or already-sent pair from new recommendations. The UI offers separate previous-sent and dismissed views; explicit “show previously contacted” scoring can be requested without permitting a duplicate send.
- Evaluate each customer’s and candidate’s strict preferences symmetrically: age, height, city, marital status, children preference, and relocation. Only a preference marked `strict` can reject a pair.
- Unknown/missing values do not fail a hard rule. They remain unknown, appear as a trade-off, and incur a bounded uncertainty deduction in score.

## Stage B — weighted score

Each component is normalized to 0–100. The score is the weighted component sum, less a capped uncertainty deduction, plus an optional capped assessment demo adjustment:

| Component | Weight |
| --- | ---: |
| Mutual partner-preference fit (forward + reverse) | 30% |
| Values and relationship intentions | 20% |
| Children and family plans | 15% |
| Career, education, and lifestyle | 10% |
| Location and relocation | 10% |
| Languages and interests | 10% |
| Profile completeness and verification confidence | 5% |

Forward fit checks the customer’s recorded partner preferences against the candidate. Reverse fit checks the candidate’s recorded preferences against the customer. Their mean is the preference component; `mutual` is true when both directional fits are at least 65. The component weights are centralized in `SCORE_WEIGHTS` and sum to 100.

Unknown subdimensions are not assigned a mismatch value. Where no dimensions are known, a neutral 50 is used for the component; each unknown dimension adds a 0.45-point deduction, capped at 10 points overall. Missing values are also surfaced in “Trade-offs & unknowns.” The confidence component averages profile completeness and modest verified-profile increments and can affect only 5% of the base score.

Fit labels are defined in one place: 82–100 Excellent Potential, 68–81 Strong Potential, 50–67 Consider, and under 50 Low Fit. The demo seed includes a deliberately low-fit example (`candidate-119`) so the system demonstrates a range of outcomes.

## Optional assessment demo mode and fairness

Off by default. It can be enabled from the scoring guide or Settings; that preference is saved locally in the browser. These are assessment-specific, transparent, non-universal assumptions, never eligibility rules:

- For a male customer, at most three small signals (younger age direction, shorter relative height, and lower income band) can add at most 6 points, and the age/height signals are skipped when explicit corresponding partner preferences exist.
- For a female customer, existing career, values, and relocation dimensions get a small capped emphasis only when the observed compatibility for that dimension is at least 70; the combined bonus is capped at 4 points.
- Children/family alignment is an explicit scored dimension for every gender. Customer-stated preferences remain more important than generic assessment defaults.

These defaults encode assessment instructions—not evidence-based claims about what men or women want. They can reinforce stereotypes, so they are opt-in, surfaced per match, separately labeled, bounded, and not used in the baseline. Religion, caste/community, and family identity are not scoring inputs. The synthetic seed may contain optional sensitive fields to demonstrate privacy handling, but they are never inferred and never used in the score.

## Example interpretation

A strong recommendation can have a high overall signal with both forward and reverse fits above 65 and several supported profile overlaps. A one-sided recommendation can still appear with an explanation when hard rules allow it, but it is not labeled mutual. A missing DOB does not fail an age strict rule; the pair remains eligible on that unknown and the explanation asks the matchmaker to confirm the information. A strict known age violation excludes the pair. Shortlist, dismiss, and send actions are not score inputs and are persisted separately.
