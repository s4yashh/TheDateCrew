import { CheckCircle2, Clock3, MailCheck, Plus, ShieldAlert, UsersRound } from "lucide-react";
import type { DemoStore, Profile } from "@/domain/types";
import { ActivityPanel, AttentionPanel, PipelinePanel } from "@/components/overview/OverviewPanels";
import { MetricCard, NextStepCard } from "@/components/overview/OverviewCards";

const NEEDS_REVIEW = new Set(["New Lead", "Onboarding", "Profile Incomplete"]);

export function Overview({
  store,
  matchmakerName,
  onNavigate,
  onOpenCustomer,
}: {
  store: DemoStore;
  matchmakerName: string;
  onNavigate: (page: "customers" | "matchfinder" | "introductions") => void;
  onOpenCustomer: (profile: Profile) => void;
}) {
  const clients = store.profiles.filter((profile) => profile.assignedMatchmakerId !== null);
  const awaitingReview = clients.filter((profile) => NEEDS_REVIEW.has(profile.stage));
  const shortlistedCount = store.interactions.filter((interaction) => interaction.status === "shortlisted").length;
  const ownerName = matchmakerName.split(" ")[0];
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).toUpperCase();

  return (
    <div className="page-stack overview-page">
      <section className="welcome-row">
        <div>
          <p className="eyebrow">{today} <span className="eyebrow-divider">/</span> YOUR PRACTICE AT A GLANCE</p>
          <h1>Good morning, {ownerName}<span className="title-period">.</span></h1>
          <p className="welcome-subtitle">A little progress, one thoughtful introduction at a time.</p>
        </div>
        <button className="button button-primary" onClick={() => onNavigate("customers")}><Plus size={16} /> View customer directory</button>
      </section>

      <section className="metric-grid" aria-label="Workspace metrics">
        <MetricCard label="Assigned customers" value={clients.length} caption="Across your active pipeline" icon={<UsersRound size={17} />} status="Seeded sample records" />
        <MetricCard label="Profiles to review" value={awaitingReview.length} caption="Onboarding or incomplete" icon={<Clock3 size={17} />} status={`${awaitingReview.length} need a next step`} />
        <MetricCard label="Shortlisted matches" value={shortlistedCount} caption="Saved for a closer look" icon={<CheckCircle2 size={17} />} status="Across customer pairs" />
        <MetricCard label="Introductions sent" value={store.introductions.length} caption="Mock introductions · demo" icon={<MailCheck size={17} />} status="No email was sent" />
      </section>

      <div className="overview-main-grid">
        <PipelinePanel clients={clients} onViewCustomers={() => onNavigate("customers")} />
        <AttentionPanel clients={clients} onOpenCustomer={onOpenCustomer} onViewCustomers={() => onNavigate("customers")} />
      </div>

      <div className="overview-bottom-grid">
        <ActivityPanel activities={store.activities} profiles={store.profiles} />
        <NextStepCard onOpenMatchFinder={() => onNavigate("matchfinder")} />
      </div>

      <div className="demo-banner">
        <ShieldAlert size={15} />
        <span>Demo workspace</span>
        <i />
        All profiles and contact details are fictional. Scores are decision-support signals, not predictions.
      </div>
    </div>
  );
}
