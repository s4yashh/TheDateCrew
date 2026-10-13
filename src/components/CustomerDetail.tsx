"use client";

import { useMemo, useState } from "react";
import { ArrowUpRight, CalendarDays, Clock3, FileText, MessageSquareText, Phone, ShieldCheck, Sparkles, UserRound, Users } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Avatar, Completeness, StagePill, VerificationPill } from "@/components/ui";
import { JOURNEY_STAGES, getAge, profileName } from "@/domain/types";
import type { DemoStore, NoteType, Profile } from "@/domain/types";
import type { ActionPayload } from "@/domain/validation";

const shown = (value: string | number | null | undefined) => value === null || value === undefined || value === "" ? "Not provided" : String(value);
const readable = (value: string) => value.replaceAll(/([A-Z])/g, " $1").replace(/^./, (character) => character.toUpperCase());

export function CustomerDetail({ profile, store, onClose, onAction }: {
  profile: Profile;
  store: DemoStore;
  onClose: () => void;
  onAction: (action: ActionPayload) => Promise<void>;
}) {
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState<NoteType>("General");
  const [noteError, setNoteError] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [stageError, setStageError] = useState("");
  const age = getAge(profile.dateOfBirth);
  const notes = useMemo(() => store.notes.filter((note) => note.profileId === profile.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [profile.id, store.notes]);
  const activity = useMemo(() => store.activities.filter((event) => event.profileId === profile.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8), [profile.id, store.activities]);

  async function addNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (noteText.trim().length < 3) { setNoteError("Please add at least three characters."); return; }
    setSavingNote(true); setNoteError("");
    try {
      await onAction({ action: "note", profileId: profile.id, text: noteText.trim(), type: noteType });
      setNoteText("");
    } catch (reason) {
      setNoteError(reason instanceof Error ? reason.message : "The note could not be saved.");
    } finally { setSavingNote(false); }
  }

  async function changeStage(stage: Profile["stage"]) {
    setStageError("");
    try { await onAction({ action: "stage", profileId: profile.id, stage }); }
    catch (reason) { setStageError(reason instanceof Error ? reason.message : "Stage could not be updated."); }
  }

  return <Modal title={profileName(profile)} eyebrow="CUSTOMER PROFILE · PRIVATE" onClose={onClose} size="lg">
    <div className="detail-scroll">
      <section className="profile-summary">
        <Avatar profile={profile} size="lg" />
        <div className="profile-summary-main"><div className="profile-summary-title"><h3>{profileName(profile)}</h3><VerificationPill state={profile.verification} /></div>
          <p>{age === null ? "Age not provided" : `${age} years old`} <span>·</span> {profile.city || "City not provided"}{profile.state ? `, ${profile.state}` : ""} <span>·</span> {profile.profession || "Profession not provided"}</p>
          <div className="profile-summary-tags"><StagePill stage={profile.stage} /><span className="mini-tag">{profile.gender === "woman" ? "Woman" : profile.gender === "man" ? "Man" : "Not provided"}</span><span className="mini-tag">{profile.maritalStatus || "Marital status not provided"}</span></div>
        </div>
        <div className="profile-score-small"><strong>{profile.profileCompleteness}%</strong><span>complete</span><Completeness value={profile.profileCompleteness} /></div>
      </section>

      <section className="journey-control"><div className="journey-control-label"><span className="journey-icon"><ArrowUpRight size={15} /></span><div><strong>Matchmaking journey</strong><small>Stage updates are added to the activity timeline.</small></div></div>
        <div className="journey-select-wrap"><select aria-label="Change matchmaking journey stage" value={profile.stage} onChange={(event) => void changeStage(event.target.value as Profile["stage"])}>{JOURNEY_STAGES.map((stage) => <option key={stage}>{stage}</option>)}</select>{stageError && <span className="form-error" role="alert">{stageError}</span>}</div>
      </section>

      <div className="detail-section-grid">
        <DetailSection title="Personal" icon={<UserRound size={15} />}>
          <DetailField label="Date of birth" value={profile.dateOfBirth ? new Date(`${profile.dateOfBirth}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : null} />
          <DetailField label="Age" value={age === null ? null : `${age} years`} />
          <DetailField label="Gender" value={readable(profile.gender)} />
          <DetailField label="Height" value={profile.heightCm ? `${profile.heightCm} cm` : null} />
          <DetailField label="Country" value={profile.country} />
          <DetailField label="State / region" value={profile.state} />
          <DetailField label="Languages" value={profile.languages.join(", ")} />
          <DetailField label="Email" value={profile.email} sensitive />
          <DetailField label="Phone" value={profile.phone} sensitive />
        </DetailSection>
        <DetailSection title="Education & career" icon={<FileText size={15} />}>
          <DetailField label="College" value={profile.college} />
          <DetailField label="Degree" value={profile.degree} />
          <DetailField label="Company" value={profile.company} />
          <DetailField label="Designation" value={profile.designation} />
          <DetailField label="Profession" value={profile.profession} />
          <DetailField label="Income band" value={profile.incomeBand} />
        </DetailSection>
        <DetailSection title="Family & background" icon={<Users size={15} />}>
          <DetailField label="Family structure" value={profile.familyStructure} />
          <DetailField label="Siblings" value={profile.siblings} />
          <DetailField label="Family values" value={profile.familyValues} />
          <DetailField label="Family location" value={profile.familyLocation} />
          <DetailField label="Religion" value={profile.religion} sensitive />
          <DetailField label="Community" value={profile.community} sensitive />
          <DetailField label="Mother tongue" value={profile.motherTongue} />
        </DetailSection>
        <DetailSection title="Lifestyle & future" icon={<CalendarDays size={15} />}>
          <DetailField label="Children preference" value={profile.childrenPreference} />
          <DetailField label="Relocation" value={profile.relocation} />
          <DetailField label="Pets" value={profile.petsPreference} />
          <DetailField label="Smoking" value={profile.smokingPreference} />
          <DetailField label="Drinking" value={profile.drinkingPreference} />
          <DetailField label="Timeline" value={profile.relationshipTimeline} />
          <DetailField label="Lifestyle" value={profile.lifestyle.join(", ")} />
          <DetailField label="Interests" value={profile.hobbies.join(", ")} />
          <DetailField label="Values" value={profile.values.join(", ")} />
          <DetailField label="Profile prompt" value={profile.prompt} />
        </DetailSection>
      </div>

      <section className="detail-block matchmaking-metadata"><div className="detail-block-heading"><span className="detail-section-icon"><ShieldCheck size={15} /></span><div><h3>Matchmaking record</h3><p>Internal stewardship and consent details.</p></div></div><div className="detail-fields">
        <DetailField label="Verification status" value={profile.verification} />
        <DetailField label="Verification method" value={profile.verificationMethod} />
        <DetailField label="Profile consent" value={profile.consent} />
        <DetailField label="Assigned matchmaker" value="Maya Shah" />
        <DetailField label="Last activity" value={new Date(profile.lastActivityAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })} />
      </div></section>

      <section className="detail-block preference-block"><div className="detail-block-heading"><span className="detail-section-icon"><Sparkles size={15} /></span><div><h3>Partner preferences</h3><p>Only preferences explicitly recorded on this fictional profile.</p></div></div>
        <div className="preference-grid">
          <DetailField label="Age range" value={profile.preferences.ageMin !== null || profile.preferences.ageMax !== null ? `${profile.preferences.ageMin ?? "Any"}–${profile.preferences.ageMax ?? "Any"}` : null} />
          <DetailField label="Height range" value={profile.preferences.heightMinCm || profile.preferences.heightMaxCm ? `${profile.preferences.heightMinCm ?? "Any"}–${profile.preferences.heightMaxCm ?? "Any"} cm` : null} />
          <DetailField label="Preferred cities" value={profile.preferences.cities.join(", ")} />
          <DetailField label="Marital status" value={profile.preferences.maritalStatuses.join(", ")} />
          <DetailField label="Career / education" value={[...profile.preferences.professions, ...profile.preferences.education].join(", ")} />
          <DetailField label="Languages" value={profile.preferences.languages.join(", ")} />
          <DetailField label="Children & relocation" value={[profile.preferences.childrenPreference, profile.preferences.relocation].filter(Boolean).join(" · ")} />
          <DetailField label="Values & interests" value={[...profile.preferences.values, ...profile.preferences.interests].join(", ")} />
        </div>
        <div className="strict-preference-note"><ShieldCheck size={14} /><span>Strict filters: {profile.preferences.strict.length ? profile.preferences.strict.map(readable).join(", ") : "None recorded"}</span></div>
        {profile.preferences.dealBreakers.length > 0 && <div className="deal-breaker-line"><strong>Deal-breakers:</strong> {profile.preferences.dealBreakers.join(", ")}</div>}
      </section>

      <section className="notes-area"><div className="detail-block-heading"><span className="detail-section-icon"><MessageSquareText size={15} /></span><div><h3>Matchmaker notes</h3><p>Private notes, newest first.</p></div></div>
        <form className="note-composer" onSubmit={addNote}>
          <div className="note-form-top"><select aria-label="Note type" value={noteType} onChange={(event) => setNoteType(event.target.value as NoteType)}>{["Call", "Meeting", "General", "Follow-up"].map((type) => <option key={type}>{type}</option>)}</select><span><Clock3 size={13} /> Dated when saved</span></div>
          <textarea aria-label="Note text" placeholder="What would be helpful to remember for next time?" value={noteText} onChange={(event) => { setNoteText(event.target.value); setNoteError(""); }} rows={3} maxLength={2000} />
          <div className="note-submit-row">{noteError ? <span className="form-error inline-error" role="alert">{noteError}</span> : <span className="character-count">{noteText.length}/2000</span>}<button type="submit" className="button button-primary button-small" disabled={savingNote}>{savingNote ? "Saving…" : "Add note"}</button></div>
        </form>
        <div className="note-list">{notes.length ? notes.map((note) => <article className="note-item" key={note.id}><span className="timeline-line" /><div className="note-item-top"><span className="note-type-icon"><MessageSquareText size={13} /></span><strong>{note.type}</strong><span className="note-author">{note.author}</span><time>{new Date(note.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</time></div><p>{note.text}</p></article>) : <p className="muted-small">No notes have been added.</p>}</div>
      </section>

      <section className="activity-timeline"><div className="detail-block-heading"><span className="detail-section-icon"><Clock3 size={15} /></span><div><h3>Recent activity</h3><p>Profile changes and actions.</p></div></div>
        {activity.length ? <div className="timeline-list">{activity.map((item) => <div className="timeline-event" key={item.id}><span className="timeline-bullet" /><span>{item.description}</span><time>{new Date(item.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</time></div>)}</div> : <p className="muted-small">No recent activity.</p>}
      </section>
      <p className="detail-privacy-note"><ShieldCheck size={13} /> Private workspace · sensitive details are never included in match cards.</p>
    </div>
  </Modal>;
}

function DetailSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="detail-block"><div className="detail-block-heading"><span className="detail-section-icon">{icon}</span><div><h3>{title}</h3></div></div><div className="detail-fields">{children}</div></section>;
}

function DetailField({ label, value, sensitive = false }: { label: string; value: string | number | null | undefined; sensitive?: boolean }) {
  return <div className="detail-field"><span>{label}{sensitive && <Phone size={10} aria-label="Sensitive" />}</span><strong className={value === null || value === undefined || value === "" ? "value-missing" : ""}>{shown(value)}</strong></div>;
}
