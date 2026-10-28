import { ShieldCheck, Sparkles } from "lucide-react";
import { DetailField, readable } from "@/components/customer/fields";
import type { Profile } from "@/domain/types";

export function MatchmakingRecord({ profile, matchmakerName }: { profile: Profile; matchmakerName: string }) {
  return (
    <section className="detail-block matchmaking-metadata">
      <div className="detail-block-heading">
        <span className="detail-section-icon"><ShieldCheck size={15} /></span>
        <div><h3>Matchmaking record</h3><p>Internal stewardship and consent details.</p></div>
      </div>
      <div className="detail-fields">
        <DetailField label="Verification status" value={profile.verification} />
        <DetailField label="Verification method" value={profile.verificationMethod} />
        <DetailField label="Profile consent" value={profile.consent} />
        <DetailField label="Assigned matchmaker" value={matchmakerName} />
        <DetailField label="Last activity" value={new Date(profile.lastActivityAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} />
      </div>
    </section>
  );
}

export function PreferencesSection({ profile }: { profile: Profile }) {
  const preferences = profile.preferences;
  return (
    <section className="detail-block preference-block">
      <div className="detail-block-heading">
        <span className="detail-section-icon"><Sparkles size={15} /></span>
        <div><h3>Partner preferences</h3><p>Only preferences explicitly recorded on this fictional profile.</p></div>
      </div>
      <div className="preference-grid">
        <DetailField
          label="Age range"
          value={preferences.ageMin !== null || preferences.ageMax !== null ? `${preferences.ageMin ?? "Any"}–${preferences.ageMax ?? "Any"}` : null}
        />
        <DetailField
          label="Height range"
          value={preferences.heightMinCm || preferences.heightMaxCm ? `${preferences.heightMinCm ?? "Any"}–${preferences.heightMaxCm ?? "Any"} cm` : null}
        />
        <DetailField label="Preferred cities" value={preferences.cities.join(", ")} />
        <DetailField label="Marital status" value={preferences.maritalStatuses.join(", ")} />
        <DetailField label="Career / education" value={[...preferences.professions, ...preferences.education].join(", ")} />
        <DetailField label="Languages" value={preferences.languages.join(", ")} />
        <DetailField label="Children preference" value={preferences.childrenPreference} />
        <DetailField label="Partner relocation" value={preferences.relocation} />
        <DetailField label="Pets" value={preferences.petsPreference} />
        <DetailField label="Values & interests" value={[...preferences.values, ...preferences.interests].join(", ")} />
      </div>
      <div className="strict-preference-note">
        <ShieldCheck size={14} />
        <span>Strict filters: {preferences.strict.length ? preferences.strict.map(readable).join(", ") : "None recorded"}</span>
      </div>
      {preferences.dealBreakers.length > 0 && (
        <div className="deal-breaker-line"><strong>Deal-breakers:</strong> {preferences.dealBreakers.join(", ")}</div>
      )}
    </section>
  );
}
