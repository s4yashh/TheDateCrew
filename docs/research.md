# Product-pattern research

Research completed 13 October 2026 using official help, support, and privacy pages. This is product-pattern research only; it does not claim access to any competitor’s proprietary ranking system and does not copy competitor interface design.

## Shaadi.com

- [Searching and Matching Profiles FAQ](https://www.shaadi.com/info/customer-relations/faq/match-making) describes basic and advanced search filters, profile verification indicators, preferred matches, broader matches, reverse matches, and two-way matches. It also documents shortlisting and ignoring a profile.
- [Matches options FAQ](https://support.shaadi.com/support/solutions/articles/48000953813-how-does-matches-option-help-me-to-get-more-matches-with-different-options-) describes recommendations that are close to a partner preference, an option to see profiles slightly outside preference, and members who are looking for profiles like yours.
- [Profile Management FAQ](https://www.shaadi.com/info/customer-relations/faq/profile) supports the general pattern of profile editing, privacy controls, and optional interests/profile information.

## Bumble

- [Adding profile prompts](https://support.bumble.com/hc/en-us/articles/31602664871453-Adding-profile-prompts) describes short, editable prompts as a way to show personality and give another person a natural conversation opener.
- [Privacy policy](https://www.bumble.com/privacy-policy/en-us/print) explains that profile details can be optional and that some details (including religion and other sensitive information) deserve careful privacy choices. It also explains at a high level that recommendation systems can consider profile information, activity, and verification.
- [Community guidelines](https://www.bumble.com/en-us/guidelines) emphasizes respectful, authentic profiles, safety, and that people should be able to challenge automated or human decisions.

## Product decisions adopted

1. **Two-way fit:** Match Finder presents the customer’s forward preference fit and the candidate’s reverse fit, and labels a match as mutual only when both scores clear the same threshold.
2. **Preferred and broader thinking without false precision:** explicit strict preferences can exclude a pair; flexible preferences influence rank and explanations rather than silently filtering people out.
3. **Shortlist and dismiss:** matchmakers can save a profile to revisit or dismiss it; these actions are per customer-candidate pair and persist.
4. **Trust signals and completeness:** verification and completeness are visible as context, but together contribute only the dedicated 5% confidence component.
5. **Prompts as human context:** optional prompt, interests, and values add conversation context; missing information remains unknown.
6. **Privacy by audience:** contact details and optional sensitive biodata appear only in the authenticated internal customer detail view. Match cards show a compact professional summary and omit contact details.
7. **Human control:** every recommendation needs human review. “Send” creates a visible local demo outbox record; it does not email a person.

## What we deliberately avoided

- We do not reproduce competitor copy, visual patterns, or claim their algorithm.
- We do not scrape profiles or use real portraits, emails, or phone numbers.
- We do not infer caste, religion, community, interests, values, relationship intentions, or consent from a name, city, or other attribute.
- We do not treat an opaque AI response as a compatibility score or guarantee relationship outcomes.
