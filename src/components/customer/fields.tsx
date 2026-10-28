import { Phone } from "lucide-react";

export const shown = (value: string | number | null | undefined) =>
  value === null || value === undefined || value === "" ? "Not provided" : String(value);

export const readable = (value: string) =>
  value.replaceAll(/([A-Z])/g, " $1").replace(/^./, (character) => character.toUpperCase());

export function DetailSection({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="detail-block">
      <div className="detail-block-heading">
        <span className="detail-section-icon">{icon}</span>
        <div><h3>{title}</h3></div>
      </div>
      <div className="detail-fields">{children}</div>
    </section>
  );
}

export function DetailField({ label, value, sensitive = false }: { label: string; value: string | number | null | undefined; sensitive?: boolean }) {
  return (
    <div className="detail-field">
      <span>{label}{sensitive && <Phone size={10} aria-label="Sensitive" />}</span>
      <strong className={value === null || value === undefined || value === "" ? "value-missing" : ""}>{shown(value)}</strong>
    </div>
  );
}
