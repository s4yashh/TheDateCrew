"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, ShieldCheck } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Avatar, Completeness, StagePill, VerificationPill } from "@/components/ui";
import { CustomerActivityPanel } from "@/components/customer/CustomerActivityPanel";
import { NotesPanel } from "@/components/customer/NotesPanel";
import { PreferencesSection, MatchmakingRecord } from "@/components/customer/PreferencesSection";
import { ProfileSummarySection } from "@/components/customer/ProfileSections";
import { JOURNEY_STAGES, getAge, profileName } from "@/domain/types";
import type { DemoStore, Profile } from "@/domain/types";
import type { ActionPayload } from "@/domain/validation";

/**
 * Full customer record.
 *
 * Biodata is grouped into readable sections instead of one long form. Contact
 * details appear only here, behind the authenticated workspace, and never on
 * match cards.
 */
export function CustomerDetail({
  profile,
  store,
  matchmakerName,
  onClose,
  onAction,
}: {
  profile: Profile;
  store: DemoStore;
  matchmakerName: string;
  onClose: () => void;
  onAction: (action: ActionPayload) => Promise<void>;
}) {
  const [stageError, setStageError] = useState("");
  const now = useMemo(() => new Date(), []);
  const age = getAge(profile.dateOfBirth, now);
  const notes = useMemo(
    () => store.notes.filter((note) => note.profileId === profile.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [profile.id, store.notes],
  );
  const activity = useMemo(
    () => store.activities
      .filter((event) => event.profileId === profile.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 8),
    [profile.id, store.activities],
  );

  async function changeStage(stage: Profile["stage"]) {
    setStageError("");
    try {
      await onAction({ action: "stage", profileId: profile.id, stage });
    } catch (reason) {
      setStageError(reason instanceof Error ? reason.message : "Stage could not be updated.");
    }
  }

  return (
    <Modal title={profileName(profile)} eyebrow="CUSTOMER PROFILE · PRIVATE" onClose={onClose} size="lg">
      <div className="detail-scroll">
        <section className="profile-summary">
          <Avatar profile={profile} size="lg" />
          <div className="profile-summary-main">
            <div className="profile-summary-title"><h3>{profileName(profile)}</h3><VerificationPill state={profile.verification} /></div>
            <p>
              {age === null ? "Age not provided" : `${age} years old`} <span>·</span>{" "}
              {profile.city || "City not provided"}{profile.state ? `, ${profile.state}` : ""} <span>·</span>{" "}
              {profile.profession || "Profession not provided"}
            </p>
            <div className="profile-summary-tags">
              <StagePill stage={profile.stage} />
              <span className="mini-tag">{profile.gender === "woman" ? "Woman" : profile.gender === "man" ? "Man" : "Not provided"}</span>
              <span className="mini-tag">{profile.maritalStatus || "Marital status not provided"}</span>
            </div>
          </div>
          <div className="profile-score-small">
            <strong>{profile.profileCompleteness}%</strong><span>complete</span><Completeness value={profile.profileCompleteness} />
          </div>
        </section>

        <section className="journey-control">
          <div className="journey-control-label">
            <span className="journey-icon"><ArrowUpRight size={15} /></span>
            <div><strong>Matchmaking journey</strong><small>Stage updates are added to the activity timeline.</small></div>
          </div>
          <div className="journey-select-wrap">
            <select
              aria-label="Change matchmaking journey stage"
              value={profile.stage}
              onChange={(event) => void changeStage(event.target.value as Profile["stage"])}
            >
              {JOURNEY_STAGES.map((stage) => <option key={stage}>{stage}</option>)}
            </select>
            {stageError && <span className="form-error" role="alert">{stageError}</span>}
          </div>
        </section>

        <div className="detail-section-grid">
          <ProfileSummarySection profile={profile} now={now} />
        </div>

        <MatchmakingRecord profile={profile} matchmakerName={matchmakerName} />
        <PreferencesSection profile={profile} />
        <NotesPanel profile={profile} notes={notes} onAction={onAction} />
        <CustomerActivityPanel activity={activity} />

        <p className="detail-privacy-note">
          <ShieldCheck size={13} /> Private workspace · sensitive details are never included in match cards.
        </p>
      </div>
    </Modal>
  );
}
