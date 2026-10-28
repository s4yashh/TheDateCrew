"use client";

import { useState } from "react";
import { Clock3, MessageSquareText } from "lucide-react";
import type { MatchNote, NoteType, Profile } from "@/domain/types";
import type { ActionPayload } from "@/domain/validation";

const NOTE_TYPES: NoteType[] = ["Call", "Meeting", "General", "Follow-up"];

export function NotesPanel({
  profile,
  notes,
  onAction,
}: {
  profile: Profile;
  notes: MatchNote[];
  onAction: (action: ActionPayload) => Promise<void>;
}) {
  const [noteText, setNoteText] = useState("");
  const [noteType, setNoteType] = useState<NoteType>("General");
  const [noteError, setNoteError] = useState("");
  const [saving, setSaving] = useState(false);

  async function addNote(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (noteText.trim().length < 3) {
      setNoteError("Please add at least three characters.");
      return;
    }
    setSaving(true);
    setNoteError("");
    try {
      await onAction({ action: "note", profileId: profile.id, text: noteText.trim(), type: noteType });
      setNoteText("");
    } catch (reason) {
      setNoteError(reason instanceof Error ? reason.message : "The note could not be saved.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="notes-area">
      <div className="detail-block-heading">
        <span className="detail-section-icon"><MessageSquareText size={15} /></span>
        <div><h3>Matchmaker notes</h3><p>Private notes, newest first. Authored by the signed-in matchmaker.</p></div>
      </div>

      <form className="note-composer" onSubmit={addNote}>
        <div className="note-form-top">
          <select aria-label="Note type" value={noteType} onChange={(event) => setNoteType(event.target.value as NoteType)}>
            {NOTE_TYPES.map((type) => <option key={type}>{type}</option>)}
          </select>
          <span><Clock3 size={13} /> Dated when saved</span>
        </div>
        <textarea
          aria-label="Note text"
          placeholder="What would be helpful to remember for next time?"
          value={noteText}
          onChange={(event) => { setNoteText(event.target.value); setNoteError(""); }}
          rows={3}
          maxLength={2000}
        />
        <div className="note-submit-row">
          {noteError
            ? <span className="form-error inline-error" role="alert">{noteError}</span>
            : <span className="character-count">{noteText.length}/2000</span>}
          <button type="submit" className="button button-primary button-small" disabled={saving}>
            {saving ? "Saving…" : "Add note"}
          </button>
        </div>
      </form>

      <div className="note-list">
        {notes.length ? notes.map((note) => (
          <article className="note-item" key={note.id}>
            <span className="timeline-line" />
            <div className="note-item-top">
              <span className="note-type-icon"><MessageSquareText size={13} /></span>
              <strong>{note.type}</strong>
              <span className="note-author">{note.author}</span>
              <time>{new Date(note.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</time>
            </div>
            <p>{note.text}</p>
          </article>
        )) : <p className="muted-small">No notes have been added.</p>}
      </div>
    </section>
  );
}
