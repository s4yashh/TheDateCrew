"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HeartHandshake, LayoutDashboard, MailCheck, Menu, Heart, Settings as SettingsIcon, ShieldCheck, UsersRound, X } from "lucide-react";
import { CustomerDetail } from "@/components/CustomerDetail";
import { Customers } from "@/components/Customers";
import { Introductions } from "@/components/Introductions";
import { Matches, ScoringGuide } from "@/components/Matches";
import { Overview } from "@/components/Overview";
import { SendMatchDialog } from "@/components/SendMatchDialog";
import { Settings } from "@/components/Settings";
import type { DemoStore, Profile } from "@/domain/types";
import type { ActionPayload } from "@/domain/validation";
import type { MatchResult } from "@/matching/scoring";

type Page = "overview" | "customers" | "matchfinder" | "introductions" | "settings";
interface PendingIntroduction { customer: Profile; candidate: Profile; match: MatchResult }
interface ToastState { id: number; message: string; kind: "success" | "error" }

const NAV_ITEMS: Array<{ id: Page; label: string; icon: typeof LayoutDashboard }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "customers", label: "Customers", icon: UsersRound },
  { id: "matchfinder", label: "Match finder", icon: Heart },
  { id: "introductions", label: "Sent introductions", icon: MailCheck },
];

const PAGE_TITLES: Record<Page, string> = {
  overview: "Overview",
  customers: "Customer directory",
  matchfinder: "Match finder",
  introductions: "Sent introductions",
  settings: "Settings",
};

export function AppWorkspace({ email, aiConfigured }: { email: string; aiConfigured: boolean }) {
  const router = useRouter();
  const [store, setStore] = useState<DemoStore | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [page, setPage] = useState<Page>("overview");
  const [selectedCustomer, setSelectedCustomer] = useState<Profile | null>(null);
  const [pendingIntroduction, setPendingIntroduction] = useState<PendingIntroduction | null>(null);
  const [showScoringGuide, setShowScoringGuide] = useState(false);
  const [assessmentDemoMode, setAssessmentDemoMode] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const refreshStore = useCallback(async () => {
    setLoading(true); setLoadError("");
    try {
      const response = await fetch("/api/workspace", { cache: "no-store" });
      if (response.status === 401) { router.replace("/login"); return; }
      const payload = await response.json() as DemoStore & { error?: string };
      if (!response.ok) throw new Error(payload.error || "Your workspace could not be loaded.");
      setStore(payload);
    } catch (reason) {
      setLoadError(reason instanceof Error ? reason.message : "Your workspace could not be loaded.");
    } finally { setLoading(false); }
  }, [router]);

  useEffect(() => {
    const task = window.setTimeout(() => void refreshStore(), 0);
    return () => window.clearTimeout(task);
  }, [refreshStore]);
  useEffect(() => {
    const task = window.setTimeout(() => {
      const saved = window.localStorage.getItem("tdc-assessment-demo-mode");
      setAssessmentDemoMode(saved === "true");
    }, 0);
    return () => window.clearTimeout(task);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3600);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const showToast = useCallback((message: string, kind: ToastState["kind"] = "success") => {
    setToast({ id: Date.now(), message, kind });
  }, []);

  const performAction = useCallback(async (action: ActionPayload) => {
    const response = await fetch("/api/actions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(action),
    });
    const payload = await response.json() as (DemoStore & { error?: string });
    if (response.status === 401) { router.replace("/login"); throw new Error("Your session has expired."); }
    if (!response.ok) throw new Error(payload.error || "The action could not be saved.");
    setStore(payload);
    const messages: Record<ActionPayload["action"], string> = {
      stage: "Journey stage updated.",
      note: "Note saved to the customer timeline.",
      shortlist: "Shortlist updated.",
      dismiss: "Profile dismissed from recommendations.",
      restore: "Profile restored to recommendations.",
      send: "Introduction saved to the demo outbox. No email was sent.",
    };
    showToast(messages[action.action]);
  }, [router, showToast]);

  const navigate = useCallback((nextPage: Page) => {
    setPage(nextPage); setSidebarOpen(false); window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const toggleAssessmentMode = useCallback((enabled: boolean) => {
    setAssessmentDemoMode(enabled);
    window.localStorage.setItem("tdc-assessment-demo-mode", String(enabled));
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  }, [router]);

  const openCustomer = useCallback((profile: Profile) => setSelectedCustomer(profile), []);
  const closeCustomer = useCallback(() => setSelectedCustomer(null), []);
  const closeScoringGuide = useCallback(() => setShowScoringGuide(false), []);
  const closeIntroduction = useCallback(() => setPendingIntroduction(null), []);

  async function confirmIntroduction(introText: string) {
    if (!pendingIntroduction) return;
    await performAction({
      action: "send",
      customerId: pendingIntroduction.customer.id,
      candidateId: pendingIntroduction.candidate.id,
      introText,
    });
    setPendingIntroduction(null);
    navigate("introductions");
  }

  function navigateTo(nextPage: "customers" | "matchfinder" | "introductions") { navigate(nextPage); }

  return <div className={`app-shell ${sidebarOpen ? "sidebar-is-open" : ""}`}>
    {sidebarOpen && <button className="mobile-sidebar-scrim" aria-label="Close navigation" onClick={() => setSidebarOpen(false)} />}
    <aside className="sidebar">
      <div className="brand-lockup"><span className="brand-mark"><HeartHandshake size={19} strokeWidth={1.8} /></span><span>the date crew<small>MATCHMAKER OS</small></span><button className="mobile-close-sidebar" aria-label="Close navigation" onClick={() => setSidebarOpen(false)}><X size={17} /></button></div>
      <div className="sidebar-section-label">WORKSPACE</div>
      <nav className="sidebar-nav" aria-label="Main navigation">{NAV_ITEMS.map(({ id, label, icon: Icon }) => <button key={id} className={`nav-item ${page === id ? "active" : ""}`} aria-current={page === id ? "page" : undefined} onClick={() => navigate(id)}><Icon size={17} strokeWidth={1.8} /><span>{label}</span>{id === "introductions" && store && <small>{store.introductions.length.toString().padStart(2, "0")}</small>}</button>)}</nav>
      <div className="sidebar-divider" />
      <div className="sidebar-section-label">PREFERENCES</div>
      <nav className="sidebar-nav" aria-label="Preferences"><button className={`nav-item ${page === "settings" ? "active" : ""}`} aria-current={page === "settings" ? "page" : undefined} onClick={() => navigate("settings")}><SettingsIcon size={17} strokeWidth={1.8} /><span>Settings</span></button></nav>
      <div className="sidebar-spacer" />
      <div className="sidebar-demo-card"><span className="sidebar-demo-icon"><ShieldCheck size={16} /></span><div><strong>Demo environment</strong><small>Fictional sample data</small></div><span className="sidebar-demo-dot" /></div>
      <button className="sidebar-profile" onClick={() => navigate("settings")} aria-label={`Account settings for ${email}`}><span className="user-avatar">MS</span><span className="sidebar-profile-copy"><strong>Maya Shah</strong><small>{email}</small></span><SettingsIcon size={15} /></button>
    </aside>

    <div className="main-column">
      <header className="topbar"><div className="topbar-left"><button className="mobile-menu-button" aria-label="Open navigation" onClick={() => setSidebarOpen(true)}><Menu size={19} /></button><span className="breadcrumb-root">Workspace</span><span className="breadcrumb-slash">/</span><span className="breadcrumb-current">{PAGE_TITLES[page]}</span></div>
        <div className="topbar-right"><span className="topbar-demo-label"><span /> SAMPLE DATA</span><span className="topbar-divider" /><button className="topbar-user" onClick={() => navigate("settings")}><span className="user-avatar small">MS</span><span>Maya Shah</span></button></div>
      </header>
      <main className="main-content">
        {loading && !store ? <WorkspaceLoading /> : loadError && !store ? <WorkspaceError message={loadError} onRetry={() => void refreshStore()} /> : store ? <>
          {page === "overview" && <Overview store={store} onNavigate={navigateTo} onOpenCustomer={openCustomer} />}
          {page === "customers" && <Customers profiles={store.profiles} onOpen={openCustomer} />}
          {page === "matchfinder" && <Matches store={store} onAction={performAction} onSend={(candidate, match, customer) => setPendingIntroduction({ candidate, match, customer })} assessmentDemoMode={assessmentDemoMode} onShowHowItWorks={() => setShowScoringGuide(true)} />}
          {page === "introductions" && <Introductions store={store} />}
          {page === "settings" && <Settings email={email} aiConfigured={aiConfigured} assessmentDemoMode={assessmentDemoMode} onAssessmentModeChange={toggleAssessmentMode} onSignOut={signOut} />}
        </> : <WorkspaceLoading />}
      </main>
      <footer className="app-footer"><span>© 2026 The Date Crew</span><span><ShieldCheck size={13} /> Private matchmaker workspace · Sample data only</span><span>v1.0</span></footer>
    </div>

    {store && selectedCustomer && <CustomerDetail profile={store.profiles.find((profile) => profile.id === selectedCustomer.id) ?? selectedCustomer} store={store} onClose={closeCustomer} onAction={performAction} />}
    {pendingIntroduction && <SendMatchDialog customer={pendingIntroduction.customer} candidate={pendingIntroduction.candidate} match={pendingIntroduction.match} onClose={closeIntroduction} onConfirm={confirmIntroduction} />}
    {showScoringGuide && <ScoringGuide onClose={closeScoringGuide} assessmentDemoMode={assessmentDemoMode} onAssessmentModeChange={toggleAssessmentMode} />}
    {toast && <div className={`toast toast-${toast.kind}`} role={toast.kind === "error" ? "alert" : "status"} aria-live="polite"><span className="toast-check">{toast.kind === "success" ? "✓" : "!"}</span>{toast.message}<button onClick={() => setToast(null)} aria-label="Dismiss notification"><X size={14} /></button></div>}
  </div>;
}

function WorkspaceLoading() {
  return <div className="loading-state" aria-label="Loading workspace"><span className="loading-spinner" /><div><strong>Opening your workspace</strong><span>Gathering your customer notes and match recommendations…</span></div><div className="loading-skeleton-grid"><i /><i /><i /><i /></div><i className="loading-skeleton-wide" /></div>;
}

function WorkspaceError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <section className="workspace-error"><span className="error-mark">!</span><p className="eyebrow">WORKSPACE UNAVAILABLE</p><h1>Let’s try that again.</h1><p>{message}</p><button className="button button-primary" onClick={onRetry}>Retry loading workspace</button></section>;
}
