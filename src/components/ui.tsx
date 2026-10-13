import type { JourneyStage, Profile, VerificationState } from "@/domain/types";

export function initials(profile: Pick<Profile, "firstName" | "lastName">): string {
  return `${profile.firstName.slice(0, 1)}${profile.lastName.slice(0, 1)}`.toUpperCase();
}

export function Avatar({ profile, size = "md" }: { profile: Pick<Profile, "firstName" | "lastName">; size?: "sm" | "md" | "lg" }) {
  const seed = profile.firstName.charCodeAt(0) + profile.lastName.charCodeAt(0);
  return <span className={`avatar avatar-${size} avatar-tone-${seed % 6}`} aria-hidden="true">{initials(profile)}</span>;
}

export function StagePill({ stage }: { stage: JourneyStage }) {
  return <span className={`stage-pill stage-${stage.toLowerCase().replaceAll(" ", "-")}`}>{stage}</span>;
}

export function VerificationPill({ state }: { state: VerificationState }) {
  return <span className={`verification-pill verification-${state.toLowerCase()}`}><span />{state}</span>;
}

export function Completeness({ value }: { value: number }) {
  return <span className="completeness"><span className="completeness-track"><span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} /></span><span>{value}%</span></span>;
}

export function EmptyState({ title, detail }: { title: string; detail: string }) {
  return <div className="empty-state"><span className="empty-state-mark">—</span><h3>{title}</h3><p>{detail}</p></div>;
}
