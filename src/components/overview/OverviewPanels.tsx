import { ArrowRight, CheckCircle2, ChevronRight } from "lucide-react";
import { Avatar } from "@/components/ui";
import { ActivityIcon } from "@/components/overview/OverviewCards";
import { profileName } from "@/domain/types";
import type { ActivityEvent, Profile } from "@/domain/types";

const JOURNEY_ROWS: Array<[string, string]> = [
  ["New Lead", "onboarding"],
  ["Onboarding", "onboarding"],
  ["Profile Incomplete", "incomplete"],
  ["Verified", "verified"],
  ["Matchmaking", "matchmaking"],
  ["Introduction Sent", "sent"],
  ["Meeting Scheduled", "meeting"],
  ["Follow-up", "meeting"],
  ["Converted", "verified"],
  ["On Hold", "incomplete"],
];

export function PipelinePanel({ clients, onViewCustomers }: { clients: Profile[]; onViewCustomers: () => void }) {
  const maxStageCount = Math.max(
    1,
    ...JOURNEY_ROWS.map(([stage]) => clients.filter((profile) => profile.stage === stage).length),
  );

  return (
    <section className="panel pipeline-panel">
      <div className="section-heading">
        <div><p className="eyebrow">THE JOURNEY</p><h2>Customer pipeline</h2></div>
        <button className="text-button" onClick={onViewCustomers}>View customers <ArrowRight size={14} /></button>
      </div>
      <div className="pipeline-list">
        {JOURNEY_ROWS.map(([stage, style]) => {
          const count = clients.filter((profile) => profile.stage === stage).length;
          return (
            <div className="pipeline-row" key={stage}>
              <span className="pipeline-stage">{stage}</span>
              <span className="pipeline-track">
                <span className={`pipeline-fill fill-${style}`} style={{ width: `${Math.max(count ? 7 : 0, (count / maxStageCount) * 100)}%` }} />
              </span>
              <strong>{count.toString().padStart(2, "0")}</strong>
            </div>
          );
        })}
      </div>
      <div className="pipeline-footnote"><span className="tiny-dot" /> Counts reflect your assigned sample customers</div>
    </section>
  );
}

export function AttentionPanel({
  clients,
  onOpenCustomer,
  onViewCustomers,
}: {
  clients: Profile[];
  onOpenCustomer: (profile: Profile) => void;
  onViewCustomers: () => void;
}) {
  const needsAttention = clients.filter((profile) => ["New Lead", "Onboarding", "Profile Incomplete"].includes(profile.stage));

  return (
    <section className="panel attention-panel">
      <div className="section-heading">
        <div><p className="eyebrow">A KIND NUDGE</p><h2>Needs attention</h2></div>
        <span className="attention-count">{needsAttention.length}</span>
      </div>
      {needsAttention.length ? (
        <div className="attention-list">
          {needsAttention.slice(0, 4).map((profile) => (
            <button className="attention-row" key={profile.id} onClick={() => onOpenCustomer(profile)}>
              <Avatar profile={profile} size="sm" />
              <span className="attention-person">
                <strong>{profileName(profile)}</strong>
                <small>{profile.city || "Location not provided"} · {profile.profession || "Profession not provided"}</small>
              </span>
              <span className="attention-reason">
                {profile.stage === "Profile Incomplete" ? "Complete profile" : profile.stage === "New Lead" ? "Start onboarding" : "Review details"}
              </span>
              <ChevronRight size={15} />
            </button>
          ))}
        </div>
      ) : (
        <div className="attention-clear"><CheckCircle2 size={17} /><span>Everyone is up to date.</span></div>
      )}
      <button className="panel-link" onClick={onViewCustomers}>Open customer directory <ArrowRight size={14} /></button>
    </section>
  );
}

function relativeTime(value: string): string {
  const difference = Math.max(0, Date.now() - new Date(value).getTime());
  const hours = Math.floor(difference / 3_600_000);
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "Yesterday" : `${days} days ago`;
}

function activityLabel(type: ActivityEvent["type"]): string {
  switch (type) {
    case "introduction": return "Introduction sent";
    case "stage": return "Journey updated";
    case "note": return "Matchmaker note";
    case "shortlist": return "Shortlist updated";
    case "draft": return "Draft prepared";
    default: return "Profile dismissed";
  }
}

export function ActivityPanel({ activities, profiles }: { activities: ActivityEvent[]; profiles: Profile[] }) {
  const sorted = [...activities].sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, 5);

  return (
    <section className="panel activity-panel">
      <div className="section-heading">
        <div><p className="eyebrow">RECENTLY</p><h2>Practice activity</h2></div>
        <span className="subtle-label">Latest updates</span>
      </div>
      {sorted.length ? (
        <div className="activity-list">
          {sorted.map((item) => {
            const person = profiles.find((profile) => profile.id === item.profileId);
            const related = item.relatedProfileId ? profiles.find((profile) => profile.id === item.relatedProfileId) : undefined;
            return (
              <div className="activity-row" key={item.id}>
                <span className={`activity-marker marker-${item.type}`}><ActivityIcon type={item.type} /></span>
                <div className="activity-description">
                  <strong>{person ? profileName(person) : "Workspace"}</strong>
                  <span>{item.description}{related ? ` · ${profileName(related)}` : ""}</span>
                </div>
                <div className="activity-meta"><small>{activityLabel(item.type)}</small><time>{relativeTime(item.createdAt)}</time></div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="attention-clear">No recent activity yet.</div>
      )}
    </section>
  );
}
