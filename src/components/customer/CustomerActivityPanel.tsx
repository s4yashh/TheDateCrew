import { Clock3 } from "lucide-react";
import type { ActivityEvent } from "@/domain/types";

export function CustomerActivityPanel({ activity }: { activity: ActivityEvent[] }) {
  return (
    <section className="activity-timeline">
      <div className="detail-block-heading">
        <span className="detail-section-icon"><Clock3 size={15} /></span>
        <div><h3>Recent activity</h3><p>Profile changes and actions.</p></div>
      </div>
      {activity.length ? (
        <div className="timeline-list">
          {activity.map((item) => (
            <div className="timeline-event" key={item.id}>
              <span className="timeline-bullet" />
              <span>{item.description}</span>
              <time>{new Date(item.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</time>
            </div>
          ))}
        </div>
      ) : <p className="muted-small">No recent activity.</p>}
    </section>
  );
}
