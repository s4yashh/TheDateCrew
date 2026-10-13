import { ArrowDownRight, ArrowRight, CalendarClock, CheckCircle2, ChevronRight, Clock3, MailCheck, Plus, ShieldAlert, UsersRound } from "lucide-react";
import type { DemoStore, Profile } from "@/domain/types";
import { profileName } from "@/domain/types";
import { Avatar } from "@/components/ui";

const NEEDS_REVIEW = new Set(["New Lead", "Onboarding", "Profile Incomplete"]);

function relativeTime(value: string): string {
  const difference = Math.max(0, Date.now() - new Date(value).getTime());
  const hours = Math.floor(difference / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

function activityLabel(type: string): string {
  switch (type) {
    case "introduction": return "Introduction sent";
    case "stage": return "Journey updated";
    case "note": return "Matchmaker note";
    case "shortlist": return "Shortlist updated";
    case "draft": return "Draft prepared";
    default: return "Profile dismissed";
  }
}

export function Overview({
  store,
  onNavigate,
  onOpenCustomer,
}: {
  store: DemoStore;
  onNavigate: (page: "customers" | "matchfinder" | "introductions") => void;
  onOpenCustomer: (profile: Profile) => void;
}) {
  const clients = store.profiles.filter((profile) => profile.assigned);
  const awaitingReview = clients.filter((profile) => NEEDS_REVIEW.has(profile.stage));
  const shortlistedCount = store.interactions.filter((interaction) => interaction.status === "shortlisted").length;
  const maxStageCount = Math.max(1, ...Array.from(new Set(clients.map((profile) => profile.stage))).map((stage) => clients.filter((profile) => profile.stage === stage).length));
  const needsAttention = clients.filter((profile) => NEEDS_REVIEW.has(profile.stage)).slice(0, 4);
  const sortedActivities = [...store.activities].sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, 5);
  const ownerName = "Maya";
  const today = new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).toUpperCase();

  return (
    <div className="page-stack overview-page">
      <section className="welcome-row">
        <div><p className="eyebrow">{today} <span className="eyebrow-divider">/</span> YOUR PRACTICE AT A GLANCE</p>
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
        <section className="panel pipeline-panel">
          <div className="section-heading"><div><p className="eyebrow">THE JOURNEY</p><h2>Customer pipeline</h2></div>
            <button className="text-button" onClick={() => onNavigate("customers")}>View customers <ArrowRight size={14} /></button></div>
          <div className="pipeline-list">
            {[
              ["New Lead", "onboarding"], ["Onboarding", "onboarding"], ["Profile Incomplete", "incomplete"], ["Verified", "verified"],
              ["Matchmaking", "matchmaking"], ["Introduction Sent", "sent"], ["Meeting Scheduled", "meeting"],
              ["Follow-up", "meeting"], ["Converted", "verified"], ["On Hold", "incomplete"],
            ].map(([stage, style]) => {
              const count = clients.filter((profile) => profile.stage === stage).length;
              return <div className="pipeline-row" key={stage}>
                <span className="pipeline-stage">{stage}</span>
                <span className="pipeline-track"><span className={`pipeline-fill fill-${style}`} style={{ width: `${Math.max(count ? 7 : 0, count / maxStageCount * 100)}%` }} /></span>
                <strong>{count.toString().padStart(2, "0")}</strong>
              </div>;
            })}
          </div>
          <div className="pipeline-footnote"><span className="tiny-dot" /> Counts reflect assigned sample customers</div>
        </section>

        <section className="panel attention-panel">
          <div className="section-heading"><div><p className="eyebrow">A KIND NUDGE</p><h2>Needs attention</h2></div><span className="attention-count">{awaitingReview.length}</span></div>
          {needsAttention.length ? <div className="attention-list">{needsAttention.map((profile) => <button className="attention-row" key={profile.id} onClick={() => onOpenCustomer(profile)}>
            <Avatar profile={profile} size="sm" /><span className="attention-person"><strong>{profileName(profile)}</strong><small>{profile.city || "Location not provided"} · {profile.profession || "Profession not provided"}</small></span>
            <span className="attention-reason">{profile.stage === "Profile Incomplete" ? "Complete profile" : profile.stage === "New Lead" ? "Start onboarding" : "Review details"}</span><ChevronRight size={15} />
          </button>)}</div> : <div className="attention-clear"><CheckCircle2 size={17} /><span>Everyone is up to date.</span></div>}
          <button className="panel-link" onClick={() => onNavigate("customers")}>Open customer directory <ArrowRight size={14} /></button>
        </section>
      </div>

      <div className="overview-bottom-grid">
        <section className="panel activity-panel">
          <div className="section-heading"><div><p className="eyebrow">RECENTLY</p><h2>Practice activity</h2></div><span className="subtle-label">Latest updates</span></div>
          {sortedActivities.length ? <div className="activity-list">{sortedActivities.map((item) => {
            const person = store.profiles.find((profile) => profile.id === item.profileId);
            const related = item.relatedProfileId ? store.profiles.find((profile) => profile.id === item.relatedProfileId) : undefined;
            return <div className="activity-row" key={item.id}><span className={`activity-marker marker-${item.type}`}><ActivityIcon type={item.type} /></span>
              <div className="activity-description"><strong>{person ? profileName(person) : "Workspace"}</strong><span>{item.description}{related ? ` · ${profileName(related)}` : ""}</span></div>
              <div className="activity-meta"><small>{activityLabel(item.type)}</small><time>{relativeTime(item.createdAt)}</time></div>
            </div>;
          })}</div> : <div className="attention-clear">No recent activity yet.</div>}
        </section>
        <section className="next-step-card">
          <div className="next-step-top"><span className="next-step-icon"><CalendarClock size={18} /></span><span className="eyebrow">YOUR NEXT STEP</span></div>
          <h2>Thoughtful matches<br />take a little context.</h2>
          <p>Open a customer profile to review their preferences, or find a mutual fit to start an introduction.</p>
          <button className="button button-dark" onClick={() => onNavigate("matchfinder")}>Open match finder <ArrowRight size={15} /></button>
          <div className="next-step-decoration"><span>THE DATE CREW</span><span>01 — 05</span></div>
        </section>
      </div>
      <div className="demo-banner"><ShieldAlert size={15} /><span>Demo workspace</span><i />All profiles and contact details are fictional. Scores are decision-support signals, not predictions.</div>
    </div>
  );
}

function MetricCard({ label, value, caption, icon, status }: { label: string; value: number; caption: string; icon: React.ReactNode; status: string }) {
  return <article className="metric-card"><div className="metric-top"><span>{label}</span><span className="metric-icon">{icon}</span></div>
    <div className="metric-value">{value.toString().padStart(2, "0")}</div><p className="metric-caption">{caption}</p>
    <div className="metric-trend"><span className="tiny-dot" /><span>{status}</span></div>
  </article>;
}

function ActivityIcon({ type }: { type: string }) {
  if (type === "introduction") return <MailCheck size={14} />;
  if (type === "stage") return <ArrowRight size={14} />;
  if (type === "draft") return <CalendarClock size={14} />;
  if (type === "dismiss") return <ArrowDownRight size={14} />;
  return <CheckCircle2 size={14} />;
}
