import { useState } from "react";
import { Bot, Database, Fingerprint, LogOut, ShieldCheck, SlidersHorizontal, Sparkles } from "lucide-react";

export function Settings({
  email,
  aiConfigured,
  assessmentDemoMode,
  onAssessmentModeChange,
  onSignOut,
}: {
  email: string;
  aiConfigured: boolean;
  assessmentDemoMode: boolean;
  onAssessmentModeChange: (enabled: boolean) => void;
  onSignOut: () => Promise<void>;
}) {
  const [signingOut, setSigningOut] = useState(false);
  async function signOut() {
    setSigningOut(true);
    await onSignOut();
  }

  return <div className="page-stack settings-page">
    <section className="page-heading-row"><div><p className="eyebrow">YOUR WORKSPACE <span className="eyebrow-divider">/</span> PRIVATE BY DESIGN</p><h1>Settings<span className="title-period">.</span></h1><p className="welcome-subtitle">Demo account, scoring preferences, and a few important details.</p></div></section>
    <div className="settings-grid">
      <section className="panel settings-panel"><div className="settings-panel-heading"><span className="settings-icon"><Fingerprint size={17} /></span><div><h2>Demo account</h2><p>Internal access for this assessment workspace.</p></div></div>
        <div className="settings-info-row"><span>Signed in as</span><strong>{email}</strong></div><div className="settings-info-row"><span>Access level</span><strong>Matchmaker · demo</strong></div><div className="settings-info-row"><span>Session</span><strong><i className="secure-dot" /> Secure, HTTP-only cookie</strong></div>
        <button className="button button-outline settings-action" onClick={() => void signOut()} disabled={signingOut}><LogOut size={15} />{signingOut ? "Signing out…" : "Sign out"}</button>
      </section>
      <section className="panel settings-panel"><div className="settings-panel-heading"><span className="settings-icon"><SlidersHorizontal size={17} /></span><div><h2>Assessment scoring</h2><p>Optional coursework heuristics. Off by default.</p></div></div>
        <label className="assessment-toggle settings-toggle"><span><strong>Demo heuristic mode</strong><small>Enable the brief’s optional, transparent gender-specific demonstration rules. This does not change eligibility and never overrides explicit preferences.</small></span><input type="checkbox" checked={assessmentDemoMode} onChange={(event) => onAssessmentModeChange(event.target.checked)} /><span className="toggle-visual" /></label>
        <div className="settings-callout"><Sparkles size={15} /><span>Baseline recommendations use the same preference-first weights for every customer. Any optional demo adjustment is capped and appears in the match explanation.</span></div>
      </section>
      <section className="panel settings-panel"><div className="settings-panel-heading"><span className="settings-icon"><Bot size={17} /></span><div><h2>Introduction drafts</h2><p>AI is an optional writing assist, not a scoring system.</p></div></div>
        <div className="settings-info-row"><span>OpenAI API</span><strong><i className={aiConfigured ? "secure-dot" : "neutral-dot"} />{aiConfigured ? "Configured · server-side" : "Not configured · template fallback"}</strong></div>
        <div className="settings-callout"><ShieldCheck size={15} /><span>Scores are always deterministic. Drafts are grounded in known profile facts and must be reviewed and edited before an introduction is saved.</span></div>
      </section>
      <section className="panel settings-panel"><div className="settings-panel-heading"><span className="settings-icon"><Database size={17} /></span><div><h2>Demo data & privacy</h2><p>Fictional people, local persistence.</p></div></div>
        <div className="settings-info-row"><span>Persistence</span><strong>Local JSON file · .data/demo-store.json</strong></div><div className="settings-info-row"><span>Sample pool</span><strong>12 assigned customers · 120 candidates</strong></div><div className="settings-info-row"><span>Contact details</span><strong>Reserved synthetic values only</strong></div>
        <p className="settings-disclaimer">This is an assessment demo, not production security. The local JSON store is not suitable for multi-instance production deployment. Religion, community, and family details are optional synthetic fields; the scorer does not use religion or community.</p>
      </section>
    </div>
    <div className="settings-footer-note"><ShieldCheck size={14} /> Build 1.0 · Match signal v1.0 · No real email delivery</div>
  </div>;
}
