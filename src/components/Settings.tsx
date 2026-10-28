"use client";

import { useState } from "react";
import { Bot, Database, Fingerprint, LogOut, ShieldCheck, SlidersHorizontal, Sparkles } from "lucide-react";

export function Settings({
  email,
  matchmakerName,
  aiConfigured,
  persistence,
  assessmentDemoMode,
  onAssessmentModeChange,
  onSignOut,
}: {
  email: string;
  matchmakerName: string;
  aiConfigured: boolean;
  persistence: string;
  assessmentDemoMode: boolean;
  onAssessmentModeChange: (enabled: boolean) => void;
  onSignOut: () => Promise<void>;
}) {
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    await onSignOut();
  }

  return (
    <div className="page-stack settings-page">
      <section className="page-heading-row">
        <div>
          <p className="eyebrow">YOUR WORKSPACE <span className="eyebrow-divider">/</span> PRIVATE BY DESIGN</p>
          <h1>Settings<span className="title-period">.</span></h1>
          <p className="welcome-subtitle">Demo account, scoring preferences, and a few important details.</p>
        </div>
      </section>

      <div className="settings-grid">
        <section className="panel settings-panel">
          <div className="settings-panel-heading">
            <span className="settings-icon"><Fingerprint size={17} /></span>
            <div><h2>Demo account</h2><p>Internal access for this assessment workspace.</p></div>
          </div>
          <div className="settings-info-row"><span>Signed in as</span><strong>{matchmakerName}</strong></div>
          <div className="settings-info-row"><span>Email</span><strong>{email}</strong></div>
          <div className="settings-info-row"><span>Access level</span><strong>Matchmaker · demo</strong></div>
          <div className="settings-info-row"><span>Session</span><strong><i className="secure-dot" /> Secure, HTTP-only cookie</strong></div>
          <button className="button button-outline settings-action" onClick={() => void signOut()} disabled={signingOut}>
            <LogOut size={15} />{signingOut ? "Signing out…" : "Sign out"}
          </button>
        </section>

        <section className="panel settings-panel">
          <div className="settings-panel-heading">
            <span className="settings-icon"><SlidersHorizontal size={17} /></span>
            <div><h2>Assessment scoring</h2><p>A real 10% component. On by default.</p></div>
          </div>
          <label className="assessment-toggle settings-toggle">
            <span>
              <strong>Assessment demo signals</strong>
              <small>
                Enables the brief’s transparent gender-specific demonstration rules. They never change eligibility,
                are capped at 10% of the score, and are skipped whenever an explicit preference exists.
              </small>
            </span>
            <input type="checkbox" checked={assessmentDemoMode} onChange={(event) => onAssessmentModeChange(event.target.checked)} />
            <span className="toggle-visual" />
          </label>
          <div className="settings-callout">
            <Sparkles size={15} />
            <span>With signals off, the remaining seven dimensions renormalise to the brief’s 30 / 20 / 15 / 10 / 10 / 10 / 5 weights.</span>
          </div>
        </section>

        <section className="panel settings-panel">
          <div className="settings-panel-heading">
            <span className="settings-icon"><Bot size={17} /></span>
            <div><h2>Introduction drafts & explanations</h2><p>AI is an optional writing assist, not a scoring system.</p></div>
          </div>
          <div className="settings-info-row">
            <span>Google Gemini</span>
            <strong>
              <i className={aiConfigured ? "secure-dot" : "neutral-dot"} />
              {aiConfigured ? "Configured · server-side" : "Not configured · template fallback"}
            </strong>
          </div>
          <div className="settings-callout">
            <ShieldCheck size={15} />
            <span>Scores are always deterministic. Drafts and explanations are grounded in known profile facts, labelled, and must be reviewed before an introduction is saved.</span>
          </div>
        </section>

        <section className="panel settings-panel">
          <div className="settings-panel-heading">
            <span className="settings-icon"><Database size={17} /></span>
            <div><h2>Demo data & privacy</h2><p>Fictional people, documented persistence.</p></div>
          </div>
          <div className="settings-info-row"><span>Persistence</span><strong>{persistence}</strong></div>
          <div className="settings-info-row"><span>Sample pool</span><strong>12 assigned customers · 200 candidates</strong></div>
          <div className="settings-info-row"><span>Contact details</span><strong>Reserved synthetic values only</strong></div>
          <p className="settings-disclaimer">
            This is an assessment demo, not production security. Religion and caste are optional synthetic fields that
            are explicitly recorded and never used by the scorer. No real email is delivered.
          </p>
        </section>
      </div>

      <div className="settings-footer-note">
        <ShieldCheck size={14} /> Build 2.0 · Match signal v2.0 · No real email delivery
      </div>
    </div>
  );
}
