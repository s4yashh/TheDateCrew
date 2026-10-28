import { BadgeCheck, ChevronDown, CircleHelp, Heart, Send } from "lucide-react";
import { Avatar, VerificationPill } from "@/components/ui";
import { ScoreBreakdown } from "@/components/matches/ScoreBreakdown";
import { getAge, profileName } from "@/domain/types";
import type { Profile } from "@/domain/types";
import type { MatchResult } from "@/matching/scoring";

export function MatchCard({
  profile,
  match,
  customerId,
  interactionStatus,
  expanded,
  busy,
  onToggleExplanation,
  onShortlist,
  onDismiss,
  onRestore,
  onSend,
}: {
  profile: Profile;
  match: MatchResult;
  customerId: string;
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
  const activeComponents = match.components.filter((component) => component.applicable);
  const primaryComponents = [...activeComponents].sort((left, right) => right.weight - left.weight).slice(0, 3);

  return (
    <article className={`match-card ${expanded ? "match-card-expanded" : ""}`}>
      <div className="match-card-main">
        <div className="match-person">
          <Avatar profile={profile} size="lg" />
          <div className="match-person-copy">
            <div className="match-name-row">
              <h3>{profileName(profile)}</h3>
              {profile.verification === "Verified" && <BadgeCheck size={15} className="verified-icon" aria-label="Verified" />}
            </div>
            <p>
              {age === null ? "Age not provided" : `${age} years`} <span>·</span>{" "}
              {profile.city || "City not provided"}{profile.state ? `, ${profile.state}` : ""}
            </p>
            <p className="match-profession">
              {profile.profession || "Profession not provided"} {profile.designation ? `· ${profile.designation}` : ""}
            </p>
            <div className="match-person-tags">
              <VerificationPill state={profile.verification} />
              {profile.maritalStatus && <span className="mini-tag">{profile.maritalStatus}</span>}
              {match.mutual && <span className="mutual-pill"><Heart size={11} /> Mutual fit</span>}
              {match.assessmentSignals !== null && <span className="mini-tag">Demo signals on</span>}
            </div>
          </div>
        </div>

        <div className="match-score-box">
          <span className="score-label">MATCH SIGNAL</span>
          <div className={`score-number score-${match.overallScore >= 80 ? "high" : match.overallScore >= 60 ? "mid" : "low"}`}>
            {match.overallScore}<small>%</small>
          </div>
          <span className="fit-label">{match.fitLabel}</span>
        </div>

        <div className="match-card-divider" />
        <div className="match-components">
          {primaryComponents.map((component) => (
            <div className="mini-score" key={component.key}>
              <span>{component.label}</span>
              <span className="mini-score-track"><i style={{ width: `${component.score}%` }} /></span>
              <strong>{component.score}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="match-card-footer">
        <button className={`why-match-button ${expanded ? "active" : ""}`} aria-expanded={expanded} onClick={onToggleExplanation}>
          <CircleHelp size={14} /> Why this match? <ChevronDown size={13} />
        </button>
        <div className="match-actions">
          {interactionStatus === "dismissed" ? (
            <button className="button button-quiet button-small" onClick={onRestore} disabled={busy}>Restore</button>
          ) : interactionStatus !== "sent" && (
            <>
              <button
                className={`button button-quiet button-small ${interactionStatus === "shortlisted" ? "saved" : ""}`}
                onClick={onShortlist}
                disabled={busy}
              >
                <Heart size={14} fill={interactionStatus === "shortlisted" ? "currentColor" : "none"} />
                {interactionStatus === "shortlisted" ? "Shortlisted" : "Shortlist"}
              </button>
              {interactionStatus !== "shortlisted" && (
                <button className="button button-quiet button-small dismiss-button" onClick={onDismiss} disabled={busy}>Dismiss</button>
              )}
              <button className="button button-primary button-small" onClick={onSend} disabled={busy}>
                <Send size={13} /> Send match
              </button>
            </>
          )}
          {interactionStatus === "sent" && <span className="sent-chip">Sent · Demo</span>}
        </div>
      </div>

      {expanded && <ScoreBreakdown match={match} customerId={customerId} candidateId={profile.id} />}
    </article>
  );
}
