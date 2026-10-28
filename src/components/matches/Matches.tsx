"use client";

import { useMemo, useState } from "react";
import { ArrowRight, CircleHelp, ShieldCheck, Sparkles, X } from "lucide-react";
import { Avatar, EmptyState } from "@/components/ui";
import { MatchCard } from "@/components/matches/MatchCard";
import { MatchFilters } from "@/components/matches/MatchFilters";
import type { MatchFilterState } from "@/components/matches/MatchFilters";
import { getAge, profileName } from "@/domain/types";
import type { DemoStore, Profile } from "@/domain/types";
import { rankMatches } from "@/matching/scoring";
import type { MatchResult } from "@/matching/scoring";
import type { ActionPayload } from "@/domain/validation";

type MatchTab = "Recommended" | "Mutual fit" | "Shortlisted" | "Previously sent" | "Dismissed";

const TABS: MatchTab[] = ["Recommended", "Mutual fit", "Shortlisted", "Previously sent", "Dismissed"];

const DEFAULT_FILTERS: MatchFilterState = {
  search: "",
  city: "All cities",
  profession: "All professions",
  verifiedOnly: false,
  minimumScore: "Any score",
  sortOrder: "Highest score",
};

/**
 * Match Finder.
 *
 * Ranking is deterministic and recomputed from the current snapshot. The same
 * `now` value is shared by every card so age boundaries cannot disagree within
 * one render.
 */
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
  const customers = useMemo(() => store.profiles.filter((profile) => profile.assignedMatchmakerId !== null), [store.profiles]);
  const candidates = useMemo(() => store.profiles.filter((profile) => profile.assignedMatchmakerId === null), [store.profiles]);
  const [customerId, setCustomerId] = useState(customers[0]?.id ?? "");
  const [tab, setTab] = useState<MatchTab>("Recommended");
  const [filters, setFilters] = useState<MatchFilterState>(DEFAULT_FILTERS);
  const [showFilters, setShowFilters] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [explanationId, setExplanationId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");
  const [busyPair, setBusyPair] = useState<string | null>(null);

  const customer = customers.find((profile) => profile.id === customerId) ?? customers[0];
  const candidateCities = useMemo(
    () => Array.from(new Set(candidates.map((profile) => profile.city).filter((value): value is string => Boolean(value)))).sort(),
    [candidates],
  );
  const professions = useMemo(
    () => Array.from(new Set(candidates.map((profile) => profile.profession).filter((value): value is string => Boolean(value)))).sort(),
    [candidates],
  );

  const allMatches = useMemo(
    () => customer
      ? rankMatches(customer, candidates, {
        assessmentDemoMode,
        interactions: store.interactions,
        showPreviouslyContacted: true,
        now,
      })
      : [],
    [customer, candidates, store.interactions, assessmentDemoMode, now],
  );

  function interactionFor(candidateId: string) {
    return store.interactions.find((item) => item.customerId === customer?.id && item.candidateId === candidateId);
  }

  function matchesTab(match: MatchResult, nextTab: MatchTab): boolean {
    const interaction = interactionFor(match.candidateId);
    if (nextTab === "Recommended") return !interaction;
    if (nextTab === "Mutual fit") return match.mutual && !interaction;
    if (nextTab === "Shortlisted") return interaction?.status === "shortlisted";
    if (nextTab === "Previously sent") return interaction?.status === "sent";
    return interaction?.status === "dismissed";
  }

  const visibleMatches = allMatches.filter((match) => {
    if (!matchesTab(match, tab)) return false;
    const profile = candidates.find((item) => item.id === match.candidateId);
    if (!profile) return false;
    const query = filters.search.trim().toLowerCase();
    if (query && ![profileName(profile), profile.city, profile.profession].filter(Boolean).join(" ").toLowerCase().includes(query)) return false;
    if (filters.city !== "All cities" && profile.city !== filters.city) return false;
    if (filters.profession !== "All professions" && profile.profession !== filters.profession) return false;
    if (filters.verifiedOnly && profile.verification !== "Verified") return false;
    if (filters.minimumScore !== "Any score" && match.overallScore < Number(filters.minimumScore)) return false;
    return true;
  }).sort((left, right) => filters.sortOrder === "Lowest score"
    ? left.overallScore - right.overallScore
    : right.overallScore - left.overallScore);

  function changeFilter<Key extends keyof MatchFilterState>(key: Key, value: MatchFilterState[Key]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  async function doAction(action: ActionPayload, pair: string) {
    setBusyPair(pair);
    setActionError("");
    try {
      await onAction(action);
    } catch (reason) {
      setActionError(reason instanceof Error ? reason.message : "That action could not be saved.");
    } finally {
      setBusyPair(null);
    }
  }

  if (!customer) {
    return <div className="page-stack"><EmptyState title="No assigned customers" detail="Add an assigned sample customer before exploring matches." /></div>;
  }

  const age = getAge(customer.dateOfBirth, now);

  return (
    <div className="page-stack matches-page">
      <section className="match-heading">
        <div>
          <p className="eyebrow">A THOUGHTFUL PLACE TO START <span className="eyebrow-divider">/</span> 200 FICTIONAL PROFILES</p>
          <h1>Match finder<span className="title-period">.</span></h1>
          <p className="welcome-subtitle">A human-reviewed shortlist, guided by mutual preferences.</p>
        </div>
        <button className="button button-outline" onClick={onShowHowItWorks}><CircleHelp size={16} /> How scoring works</button>
      </section>

      <section className="match-customer-bar">
        <div className="match-customer-person">
          <Avatar profile={customer} />
          <div>
            <span className="eyebrow">FINDING MATCHES FOR</span>
            <strong>{profileName(customer)}</strong>
            <small>
              {age === null ? "Age not provided" : `${age} years`} · {customer.city || "City not provided"} · {customer.profession || "Profession not provided"}
            </small>
          </div>
        </div>
        <label className="match-customer-select">
          <span>Customer profile</span>
          <select aria-label="Select a customer for matching" value={customer.id} onChange={(event) => { setCustomerId(event.target.value); setTab("Recommended"); }}>
            {customers.map((profile) => (
              <option key={profile.id} value={profile.id}>{profile.firstName} {profile.lastName} · {profile.city || "Location not provided"}</option>
            ))}
          </select>
        </label>
        <div className="customer-preference-summary">
          <span><ShieldCheck size={14} /> {customer.preferences.strict.length} strict preference{customer.preferences.strict.length === 1 ? "" : "s"}</span>
          <button className="text-button" onClick={onShowHowItWorks}>Review scoring rules <ArrowRight size={14} /></button>
        </div>
      </section>

      <section className="match-results-panel">
        <div className="match-tabs" role="tablist" aria-label="Match categories">
          {TABS.map((item) => (
            <button key={item} role="tab" aria-selected={tab === item} className={`match-tab ${tab === item ? "active" : ""}`} onClick={() => setTab(item)}>
              {item}<span>{allMatches.filter((match) => matchesTab(match, item)).length}</span>
            </button>
          ))}
          <div className="match-tabs-actions">
            <button className="text-button scoring-link" onClick={onShowHowItWorks}><Sparkles size={14} /> Human-reviewed ranking</button>
          </div>
        </div>

        <MatchFilters
          filters={filters}
          cities={candidateCities}
          professions={professions}
          showFilters={showFilters}
          onToggleFilters={() => setShowFilters((value) => !value)}
          onChange={changeFilter}
          onReset={() => setFilters(DEFAULT_FILTERS)}
          onRefresh={() => { setNow(new Date()); setLastRefreshed(new Date()); }}
        />

        {actionError && (
          <div className="inline-alert" role="alert">
            {actionError}
            <button className="icon-button" onClick={() => setActionError("")} aria-label="Dismiss error"><X size={14} /></button>
          </div>
        )}

        <div className="match-list-summary">
          <span>{visibleMatches.length} {visibleMatches.length === 1 ? "profile" : "profiles"} <span className="muted-inline">·</span> ranked for {customer.firstName}</span>
          <span>{lastRefreshed ? `Updated at ${lastRefreshed.toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}` : "Scores use current profile data"}</span>
        </div>

        <div className="match-card-list">
          {visibleMatches.map((match) => {
            const profile = candidates.find((item) => item.id === match.candidateId)!;
            const interaction = interactionFor(profile.id);
            const pair = `${customer.id}:${profile.id}`;
            return (
              <MatchCard
                key={profile.id}
                profile={profile}
                match={match}
                customerId={customer.id}
                interactionStatus={interaction?.status}
                expanded={explanationId === profile.id}
                busy={busyPair === pair}
                onToggleExplanation={() => setExplanationId((current) => current === profile.id ? null : profile.id)}
                onShortlist={() => void doAction({ action: "shortlist", customerId: customer.id, candidateId: profile.id }, pair)}
                onDismiss={() => void doAction({ action: "dismiss", customerId: customer.id, candidateId: profile.id }, pair)}
                onRestore={() => void doAction({ action: "restore", customerId: customer.id, candidateId: profile.id }, pair)}
                onSend={() => onSend(profile, match, customer)}
              />
            );
          })}
        </div>

        {visibleMatches.length === 0 && (
          <EmptyState
            title={tab === "Recommended" ? "No profiles in this view" : `No ${tab.toLowerCase()} profiles yet`}
            detail={tab === "Recommended"
              ? "Try another city, profession, or customer. Previously contacted profiles stay out of new recommendations."
              : "Recommendations and your saved actions will appear here."}
          />
        )}

        <footer className="match-panel-footer">
          <span><span className="muted-inline">v2.0</span> deterministic scoring · all recommendations require human review</span>
          <span>Showing {visibleMatches.length} of 200 demo profiles</span>
        </footer>
      </section>
      {explanationId && <div className="sr-only" aria-live="polite">Why this match section expanded.</div>}
    </div>
  );
}
