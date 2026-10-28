"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, HeartHandshake, LockKeyhole } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("maya@thedatecrew.demo");
  const [password, setPassword] = useState("DemoMatch123!");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "Unable to sign in.");
      router.replace("/");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Unable to sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="login-page">
      <div className="login-side-note"><span className="brand-mark"><HeartHandshake size={19} strokeWidth={1.8} /></span> the date crew</div>
      <section className="login-card" aria-labelledby="login-heading">
        <div className="login-eyebrow"><LockKeyhole size={14} /> PRIVATE MATCHMAKER WORKSPACE</div>
        <h1 id="login-heading">Good connections<br /><em>start with care.</em></h1>
        <p className="login-copy">Sign in to your matchmaker workspace and continue building meaningful introductions.</p>
        <form onSubmit={submit} className="login-form">
          <label htmlFor="email">Work email</label>
          <input id="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <label htmlFor="password">Password</label>
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary login-submit" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in to workspace"}<ArrowRight size={16} />
          </button>
        </form>
        <div className="demo-credential-box">
          <span className="demo-dot" />
          <div>
            <strong>Two demo matchmakers</strong>
            <span>Maya Shah · maya@thedatecrew.demo / DemoMatch123!</span>
            <span>Arjun Rao · arjun@thedatecrew.demo / ArjunMatch123!</span>
          </div>
        </div>
        <p className="login-privacy">This private demo uses synthetic sample data. No messages or emails are sent.</p>
      </section>
      <footer className="login-footer"><span>Thoughtful introductions, made human.</span><span>INTERNAL DEMO · 2026</span></footer>
    </main>
  );
}
