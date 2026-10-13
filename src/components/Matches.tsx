"use client";

import { useMemo, useState } from "react";
import { ArrowDownWideNarrow, ArrowRight, BadgeCheck, ChevronDown, CircleHelp, Heart, RefreshCw, Search, Send, ShieldCheck, Sparkles, X } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Avatar, EmptyState, VerificationPill } from "@/components/ui";
import { getAge, profileName } from "@/domain/types";
import type { DemoStore, Profile } from "@/domain/types";
import { rankMatches, SCORE_WEIGHTS } from "@/matching/scoring";
import type { MatchResult } from "@/matching/scoring";
import type { ActionPayload } from "@/domain/validation";

type MatchTab = "Recommended" | "Mutual fit" | "Shortlisted" | "Previously sent" | "Dismissed";

const TABS: MatchTab[] = ["Recommended", "Mutual fit", "Shortlisted", "Previously sent", "Dismissed"];

export function Matches({
  store,
  onAction,
  onSend,
  assessmentDemoMode,
  onShowHowItWorks,
}: {
  store: DemoStore;
  onAction: (action: ActionPayload) => Promise<void>;
  onSend: (candidate: Profile, match: MatchResult, customer: Profile) => void;
  assessmentDemoMode: boolean;
  onShowHowItWorks: () => void;
}) {
  const customers = store.profiles.filter((profile) => profile.assigned);
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [tab, setTab] = useState<MatchTab>("Recommended");
  const [search, setSearch] = useState("");
  const [city, setCity] = useState("All cities");
  const [profession, setProfession] = useState("All professions");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [minimumScore, setMinimumScore] = useState("Any score");
  const [sortOrder, setSortOrder] = useState("Highest score");
  const [refreshCount, setRefreshCount] = useState(0);
  const [explanationId, setExplanationId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [busyPair, setBusyPair] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const customer = customers.find((profile) => profile.id === customerId) ?? customers[0];
  const candidates = store.profiles.filter((profile) => !profile.assigned);
  const candidateCities = Array.from(new Set(candidates.map((profile) => profile.city).filter((value): value is string => Boolean(value)))).sort();
  const professions = Array.from(new Set(candidates.map((profile) => profile.profession).filter((value): value is string => Boolean(value)))).sort();

  const allMatches = useMemo(() => customer ? rankMatches(customer, candidates, {
    assessmentDemoMode,
    interactions: store.interactions,
    showPreviouslyContacted: true,
  }) : [], [assessmentDemoMode, candidates, customer, refreshCount, store.interactions]);
  const countFor = (nextTab: MatchTab) => allMatches.filter((match) => {
    const interaction = store.interactions.find((item) => item.customerId === customer?.id && item.candidateId === match.candidateId);
    if (nextTab === "Recommended") return !interaction;
    if (nextTab === "Mutual fit") return match.mutual && !interaction;
    if (nextTab === "Shortlisted") return interaction?.status === "shortlisted";
    if (nextTab === "Previously sent") return interaction?.status === "sent";
    return interaction?.status === "dismissed";
  }).length;
  const visibleMatches = allMatches.filter((match) => {
    const interaction = store.interactions.find((item) => item.customerId === customer?.id && item.candidateId === match.candidateId);
    if (tab === "Recommended" && interaction) return false;
    if (tab === "Mutual fit" && (!match.mutual || interaction)) return false;
    if (tab === "Shortlisted" && interaction?.status !== "shortlisted") return false;
    if (tab === "Previously sent" && interaction?.status !== "sent") return false;
    if (tab === "Dismissed" && interaction?.status !== "dismissed") return false;
    const profile = candidates.find((candidateItem) => candidateItem.id === match.candidateId)!;
    const query = search.trim().toLowerCase();
    if (query && ![profileName(profile), profile.city, profile.profession].filter(Boolean).join(" ").toLowerCase().includes(query)) return false;
    if (city !== "All cities" && profile.city !== city) return false;
    if (profession !== "All professions" && profile.profession !== profession) return false;
    if (verifiedOnly && profile.verification !== "Verified") return false;
    if (minimumScore !== "Any score" && match.overallScore < Number(minimumScore)) return false;
    return true;
  }).sort((left, right) => sortOrder === "Lowest score" ? left.overallScore - right.overallScore : right.overallScore - left.overallScore);

  async function doAction(action: ActionPayload, pair: string) {
    setBusyPair(pair); setActionError("");
    try { await onAction(action); }
    catch (reason) { setActionError(reason instanceof Error ? reason.message : "That action could not be saved."); }
    finally { setBusyPair(null); }
  }

  if (!customer) return <div className="page-stack"><EmptyState title="No assigned customers" detail="Add an assigned sample customer before exploring matches." /></div>;

  return <div className="page-stack matches-page">
    <section className="match-heading"><div><p className="eyebrow">A THOUGHTFUL PLACE TO START <span className="eyebrow-divider">/</span> 120 FICTIONAL PROFILES</p><h1>Match finder<span className="title-period">.</span></h1><p className="welcome-subtitle">A human-reviewed shortlist, guided by mutual preferences.</p></div>
      <button className="button button-outline" onClick={onShowHowItWorks}><CircleHelp size={16} /> How scoring works</button>
    </section>
    <section className="match-customer-bar"><div className="match-customer-person"><Avatar profile={customer} /><div><span className="eyebrow">FINDING MATCHES FOR</span><strong>{profileName(customer)}</strong><small>{customer.city || "City not provided"} · {customer.profession || "Profession not provided"}</small></div></div>
      <label className="match-customer-select"><span>Customer profile</span><select aria-label="Select a customer for matching" value={customer.id} onChange={(event) => { setCustomerId(event.target.value); setTab("Recommended"); }}>
        {customers.map((profile) => <option key={profile.id} value={profile.id}>{profile.firstName} {profile.lastName} · {profile.city || "Location not provided"}</option>)}
      </select></label>
      <div className="customer-preference-summary"><span><ShieldCheck size={14} /> {customer.preferences.strict.length} strict preference{customer.preferences.strict.length === 1 ? "" : "s"}</span><button className="text-button" onClick={onShowHowItWorks}>Review scoring rules <ArrowRight size={14} /></button></div>
    </section>

    <section className="match-results-panel">
      <div className="match-tabs" role="tablist" aria-label="Match categories">{TABS.map((item) => <button key={item} role="tab" aria-selected={tab === item} className={`match-tab ${tab === item ? "active" : ""}`} onClick={() => setTab(item)}>{item}<span>{countFor(item)}</span></button>)}
        <div className="match-tabs-actions"><button className="text-button scoring-link" onClick={onShowHowItWorks}><Sparkles size={14} /> Human-reviewed ranking</button></div>
      </div>
      <div className="match-filter-row">
        <label className="search-field match-search"><Search size={15} /><input aria-label="Search match candidates" placeholder="Search profiles…" value={search} onChange={(event) => setSearch(event.target.value)} />{search && <button className="search-clear" aria-label="Clear match search" onClick={() => setSearch("")}><X size={13} /></button>}</label>
        <button className={`filter-toggle ${showFilters ? "active" : ""}`} onClick={() => setShowFilters((value) => !value)}><ArrowDownWideNarrow size={15} /> Filters {showFilters ? <X size={13} /> : <ChevronDown size={13} />}</button>
        <label className="sort-match-label"><span>Sort by</span><select aria-label="Sort recommendations" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)}><option>Highest score</option><option>Lowest score</option></select></label>
        <button className="refresh-button" onClick={() => setRefreshCount((value) => value + 1)}><RefreshCw size={14} /> Refresh</button>
      </div>
      {showFilters && <div className="advanced-match-filters">
        <label>City<select value={city} onChange={(event) => setCity(event.target.value)}><option>All cities</option>{candidateCities.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Profession<select value={profession} onChange={(event) => setProfession(event.target.value)}><option>All professions</option>{professions.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>Minimum score<select value={minimumScore} onChange={(event) => setMinimumScore(event.target.value)}><option>Any score</option><option value="50">50+</option><option value="65">65+</option><option value="80">80+</option></select></label>
        <label className="verified-filter"><input type="checkbox" checked={verifiedOnly} onChange={(event) => setVerifiedOnly(event.target.checked)} /> Verified profiles only</label>
        <button className="text-button" onClick={() => { setCity("All cities"); setProfession("All professions"); setMinimumScore("Any score"); setVerifiedOnly(false); }}>Reset filters</button>
      </div>}
      {actionError && <div className="inline-alert" role="alert">{actionError}<button className="icon-button" onClick={() => setActionError("")} aria-label="Dismiss error"><X size={14} /></button></div>}
      <div className="match-list-summary"><span>{visibleMatches.length} {visibleMatches.length === 1 ? "profile" : "profiles"} <span className="muted-inline">·</span> ranked for {customer.firstName}</span><span>Last refreshed just now</span></div>
      <div className="match-card-list">{visibleMatches.map((match) => {
        const profile = candidates.find((candidateItem) => candidateItem.id === match.candidateId)!;
        const interaction = store.interactions.find((item) => item.customerId === customer.id && item.candidateId === profile.id);
        return <MatchCard key={profile.id} profile={profile} match={match} interactionStatus={interaction?.status} expanded={explanationId === profile.id} busy={busyPair === `${customer.id}:${profile.id}`} onToggleExplanation={() => setExplanationId((current) => current === profile.id ? null : profile.id)}
          onShortlist={() => void doAction({ action: "shortlist", customerId: customer.id, candidateId: profile.id }, `${customer.id}:${profile.id}`)}
          onDismiss={() => void doAction({ action: "dismiss", customerId: customer.id, candidateId: profile.id }, `${customer.id}:${profile.id}`)}
          onRestore={() => void doAction({ action: "restore", customerId: customer.id, candidateId: profile.id }, `${customer.id}:${profile.id}`)}
          onSend={() => onSend(profile, match, customer)} />;
      })}</div>
      {visibleMatches.length === 0 && <EmptyState title={tab === "Recommended" ? "No profiles in this view" : `No ${tab.toLowerCase()} profiles yet`} detail={tab === "Recommended" ? "Try another city, profession, or customer. Previously contacted profiles stay out of new recommendations." : "Recommendations and your saved actions will appear here."} />}
      <footer className="match-panel-footer"><span><span className="muted-inline">v1.0</span> deterministic scoring · all recommendations require human review</span><span>Showing {visibleMatches.length} of 120 demo profiles</span></footer>
    </section>
    {explanationId && <div className="sr-only" aria-live="polite">Why this match section expanded.</div>}
  </div>;
}

function MatchCard({ profile, match, interactionStatus, expanded, busy, onToggleExplanation, onShortlist, onDismiss, onRestore, onSend }: {
  profile: Profile;
  match: MatchResult;
  interactionStatus?: string;
  expanded: boolean;
  busy: boolean;
  onToggleExplanation: () => void;
  onShortlist: () => void;
  onDismiss: () => void;
  onRestore: () => void;
  onSend: () => void;
}) {
  const age = getAge(profile.dateOfBirth);
  const primaryComponents = match.components.filter((component) => component.weight >= 10).slice(0, 3);
  return <article className={`match-card ${expanded ? "match-card-expanded" : ""}`}>
    <div className="match-card-main">
      <div className="match-person"><Avatar profile={profile} size="lg" /><div className="match-person-copy"><div className="match-name-row"><h3>{profileName(profile)}</h3>{profile.verification === "Verified" && <BadgeCheck size={15} className="verified-icon" aria-label="Verified" />}</div>
        <p>{age === null ? "Age not provided" : `${age} years`} <span>·</span> {profile.city || "City not provided"}{profile.state ? `, ${profile.state}` : ""}</p>
        <p className="match-profession">{profile.profession || "Profession not provided"} {profile.designation ? `· ${profile.designation}` : ""}</p>
        <div className="match-person-tags"><VerificationPill state={profile.verification} />{profile.maritalStatus && <span className="mini-tag">{profile.maritalStatus}</span>}{match.mutual && <span className="mutual-pill"><Heart size={11} /> Mutual fit</span>}</div>
      </div></div>
      <div className="match-score-box"><span className="score-label">MATCH SIGNAL</span><div className={`score-number score-${match.overallScore >= 80 ? "high" : match.overallScore >= 60 ? "mid" : "low"}`}>{match.overallScore}<small>%</small></div><span className="fit-label">{match.fitLabel}</span></div>
      <div className="match-card-divider" />
      <div className="match-components">{primaryComponents.map((component) => <div className="mini-score" key={component.key}><span>{component.label}</span><span className="mini-score-track"><i style={{ width: `${component.score}%` }} /></span><strong>{component.score}</strong></div>)}</div>
    </div>
    <div className="match-card-footer">
      <button className={`why-match-button ${expanded ? "active" : ""}`} aria-expanded={expanded} onClick={onToggleExplanation}><CircleHelp size={14} /> Why this match? <ChevronDown size={13} /></button>
      <div className="match-actions">
        {interactionStatus === "dismissed" ? <button className="button button-quiet button-small" onClick={onRestore} disabled={busy}>Restore</button> : interactionStatus !== "sent" && <>
          <button className={`button button-quiet button-small ${interactionStatus === "shortlisted" ? "saved" : ""}`} onClick={onShortlist} disabled={busy}><Heart size={14} fill={interactionStatus === "shortlisted" ? "currentColor" : "none"} />{interactionStatus === "shortlisted" ? "Shortlisted" : "Shortlist"}</button>
          {interactionStatus !== "shortlisted" && <button className="button button-quiet button-small dismiss-button" onClick={onDismiss} disabled={busy}>Dismiss</button>}
          <button className="button button-primary button-small" onClick={onSend} disabled={busy}><Send size={13} /> Send match</button>
        </>}
        {interactionStatus === "sent" && <span className="sent-chip">Sent · Demo</span>}
      </div>
    </div>
    {expanded && <div className="match-explanation"><div className="explanation-column"><h4><Sparkles size={14} /> Supported reasons</h4>{match.positiveReasons.length ? <ul>{match.positiveReasons.map((reason) => <li key={reason}>{reason}</li>)}</ul> : <p>Not enough profile detail to identify a specific overlap yet. Treat this as a prompt for review.</p>}</div>
      <div className="explanation-column tradeoff-column"><h4><ShieldCheck size={14} /> Trade-offs & unknowns</h4>{match.tradeoffs.length ? <ul>{match.tradeoffs.map((reason) => <li key={reason}>{reason}</li>)}</ul> : <p>No notable trade-offs surfaced from the details provided.</p>}</div>
      <div className="explanation-meta"><span>Forward fit <strong>{match.forwardFit}</strong></span><span>Reverse fit <strong>{match.reverseFit}</strong></span>{match.assessmentBonus > 0 && <span>Assessment demo signal <strong>+{match.assessmentBonus}</strong></span>}<span>Human review required</span></div>
    </div>}
  </article>;
}

export function ScoringGuide({ onClose, assessmentDemoMode, onAssessmentModeChange }: { onClose: () => void; assessmentDemoMode: boolean; onAssessmentModeChange: (enabled: boolean) => void }) {
  return <Modal title="A transparent starting point" eyebrow="HOW MATCH SIGNALS WORK" onClose={onClose} size="lg">
    <div className="scoring-guide-body"><p className="scoring-guide-intro">The score is a decision-support signal for a matchmaker—not a prediction of relationship success. Explicit preferences, two-way fit, and human judgment matter more than any single number.</p>
      <div className="weight-list">{Object.entries(SCORE_WEIGHTS).map(([key, weight]) => <div className="weight-row" key={key}><span>{({ mutualPreferenceFit: "Mutual partner-preference fit", valuesAndIntentions: "Values & relationship intentions", familyPlans: "Children & family plans", careerEducationLifestyle: "Career, education & lifestyle", locationAndRelocation: "Location & relocation", languageAndInterests: "Languages & interests", confidence: "Profile completeness & verification" } as Record<string, string>)[key]}</span><span className="weight-bar"><i style={{ width: `${weight * 3}%` }} /></span><strong>{weight}%</strong></div>)}</div>
      <div className="scoring-method-grid"><div><strong>Two-way preference fit</strong><p>Forward fit checks what the customer is seeking. Reverse fit checks the candidate’s preferences too. Both are shown separately.</p></div><div><strong>Unknown stays unknown</strong><p>Missing profile details are not treated as rejection. They lower confidence and appear as a conversation prompt.</p></div><div><strong>Strict means strict</strong><p>Only explicitly marked strict preferences can exclude a recommendation. Flexible preferences affect ranking, not eligibility.</p></div><div><strong>Human decision, always</strong><p>Shortlist, dismiss, or send only after reviewing profile facts. There are no guarantees or automated outreach.</p></div></div>
      <label className="assessment-toggle"><span><strong>Assessment demo heuristics</strong><small>Optional, capped signals described in the assignment. They never reject anyone, and explicit customer preferences take priority.</small></span><input type="checkbox" checked={assessmentDemoMode} onChange={(event) => onAssessmentModeChange(event.target.checked)} /><span className="toggle-visual" /></label>
      {assessmentDemoMode && <p className="heuristic-note"><ShieldCheck size={14} /> Enabled for this view. For male clients, tiny capped signals can reflect age direction, relative height, and income when those details exist and no explicit preference overrides them. For female clients, existing career, values, and relocation dimensions receive a small capped emphasis. These are assessment-only assumptions—not universal preferences—and can be switched off.</p>}
      <p className="fairness-footnote">Sensitive identity attributes such as religion and community are optional and are not used by the matching score. Algorithm version: mutual-fit-v1.0.</p>
    </div>
  </Modal>;
}
