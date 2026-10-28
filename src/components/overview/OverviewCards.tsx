import { ArrowDownRight, ArrowRight, CalendarClock, CheckCircle2, MailCheck } from "lucide-react";

export function MetricCard({
  label,
  value,
  caption,
  icon,
  status,
}: {
  label: string;
  value: number;
  caption: string;
  icon: React.ReactNode;
  status: string;
}) {
  return (
    <article className="metric-card">
      <div className="metric-top"><span>{label}</span><span className="metric-icon">{icon}</span></div>
      <div className="metric-value">{value.toString().padStart(2, "0")}</div>
      <p className="metric-caption">{caption}</p>
      <div className="metric-trend"><span className="tiny-dot" /><span>{status}</span></div>
    </article>
  );
}

export function NextStepCard({ onOpenMatchFinder }: { onOpenMatchFinder: () => void }) {
  return (
    <section className="next-step-card">
      <div className="next-step-top"><span className="next-step-icon"><CalendarClock size={18} /></span><span className="eyebrow">YOUR NEXT STEP</span></div>
      <h2>Thoughtful matches<br />take a little context.</h2>
      <p>Open a customer profile to review their preferences, or find a mutual fit to start an introduction.</p>
      <button className="button button-dark" onClick={onOpenMatchFinder}>Open match finder <ArrowRight size={15} /></button>
      <div className="next-step-decoration"><span>THE DATE CREW</span><span>02 — 06</span></div>
    </section>
  );
}

export function ActivityIcon({ type }: { type: string }) {
  if (type === "introduction") return <MailCheck size={14} />;
  if (type === "stage") return <ArrowRight size={14} />;
  if (type === "draft") return <CalendarClock size={14} />;
  if (type === "dismiss") return <ArrowDownRight size={14} />;
  return <CheckCircle2 size={14} />;
}
