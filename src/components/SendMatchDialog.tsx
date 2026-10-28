"use client";

import { useCallback, useEffect, useState } from "react";
import { LoaderCircle, Mail, RefreshCw, Send, ShieldCheck, Sparkles, TriangleAlert } from "lucide-react";
import { Modal } from "@/components/Modal";
import { Avatar } from "@/components/ui";
import { getAge, profileName } from "@/domain/types";
import type { Profile } from "@/domain/types";
import type { MatchResult } from "@/matching/scoring";

interface DraftResponse {
  introText: string;
  source: "gemini" | "template";
  label: string;
  fallbackReason?: string;
}

export function SendMatchDialog({ customer, candidate, match, onClose, onConfirm }: {
  customer: Profile;
  candidate: Profile;
  match: MatchResult;
  onClose: () => void;
  onConfirm: (introText: string) => Promise<void>;
}) {
  const [draft, setDraft] = useState<DraftResponse | null>(null);
  const [introText, setIntroText] = useState("");
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [draftError, setDraftError] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState("");

  const generateDraft = useCallback(async (signal?: AbortSignal) => {
    setLoadingDraft(true); setDraftError("");
    try {
      const response = await fetch("/api/ai/intro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customerId: customer.id, candidateId: candidate.id }),
        signal,
      });
      const payload = await response.json() as DraftResponse & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Could not prepare an introduction draft.");
      setDraft(payload); setIntroText(payload.introText);
    } catch (reason) {
      if (reason instanceof Error && reason.name === "AbortError") return;
      setDraftError(reason instanceof Error ? reason.message : "Could not prepare an introduction draft.");
    } finally { if (!signal?.aborted) setLoadingDraft(false); }
  }, [customer.id, candidate.id]);

  useEffect(() => {
    const controller = new AbortController();
    const task = window.setTimeout(() => void generateDraft(controller.signal), 0);
    return () => { window.clearTimeout(task); controller.abort(); };
  }, [generateDraft]);

  async function confirm() {
    setSending(true); setSendError("");
    try { await onConfirm(introText.trim()); }
    catch (reason) { setSendError(reason instanceof Error ? reason.message : "The introduction could not be saved."); }
    finally { setSending(false); }
  }

  const recipient = customer.email || "matchmaker@thedatecrew.demo";
  const age = getAge(candidate.dateOfBirth);
  return <Modal title="Review this introduction" eyebrow="HUMAN REVIEW BEFORE SEND" onClose={onClose} size="lg">
    <div className="send-dialog-body">
      <div className="send-dialog-alert"><Mail size={16} /><div><strong>Simulated introduction</strong><span>This creates a private outbox record only. No email will be sent.</span></div><span className="demo-pill">DEMO</span></div>
      <div className="send-summary-grid"><div className="send-recipient"><span className="form-eyebrow">PROPOSED RECIPIENT</span><strong>{recipient}</strong><small>Customer’s synthetic demo email</small></div>
        <div className="send-score-summary"><span className="form-eyebrow">MATCH SIGNAL</span><strong>{match.overallScore}<small>%</small></strong><span>{match.fitLabel} · {match.mutual ? "Mutual fit" : "One-sided fit"}</span></div></div>
      <div className="send-profile-summary"><div><Avatar profile={candidate} /><span><strong>{profileName(candidate)}</strong><small>{age === null ? "Age not provided" : `${age} years`} · {candidate.city || "City not provided"}</small><small>{candidate.profession || "Profession not provided"} {candidate.designation ? `· ${candidate.designation}` : ""}</small></span></div><span className="send-for-label">INTRODUCTION FOR<br /><strong>{profileName(customer)}</strong></span></div>

      <div className="draft-heading"><div><span className="form-eyebrow">INTRODUCTION NOTE</span><p>Review and edit the wording before saving.</p></div><button className="text-button" onClick={() => void generateDraft()} disabled={loadingDraft}><RefreshCw size={13} /> {loadingDraft ? "Preparing…" : "Regenerate"}</button></div>
      {loadingDraft && <div className="draft-loading"><LoaderCircle size={16} className="spin" /> Preparing a grounded introduction…</div>}
      {draftError && <div className="inline-alert" role="alert"><TriangleAlert size={15} />{draftError}<button className="text-button" onClick={() => void generateDraft()}>Try again</button></div>}
      {draft && <div className="draft-source-label"><Sparkles size={13} />{draft.label}{draft.fallbackReason ? <span> · {draft.fallbackReason}</span> : null}</div>}
      <textarea className="intro-textarea" aria-label="Editable introduction text" value={introText} onChange={(event) => setIntroText(event.target.value)} rows={7} maxLength={2000} disabled={loadingDraft} placeholder="Introduction draft will appear here…" />
      <div className="draft-footer"><span>{introText.length}/2000 characters</span><span>Names and facts are fictional sample data.</span></div>
      {sendError && <p className="form-error" role="alert">{sendError}</p>}
      <div className="send-review-note"><ShieldCheck size={15} /><span>Scores are decision-support signals. Please review both profiles and confirm the recipient before saving.</span></div>
      <div className="send-dialog-actions"><button className="button button-outline" onClick={onClose} disabled={sending}>Cancel</button><button className="button button-primary" onClick={() => void confirm()} disabled={sending || loadingDraft || introText.trim().length < 10}><Send size={14} />{sending ? "Saving introduction…" : "Confirm & record introduction"}</button></div>
    </div>
  </Modal>;
}
