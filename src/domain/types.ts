/**
 * Shared domain model for the matchmaker workspace.
 *
 * The brief asks for explicitly recorded facts and preferences. Anything the
 * matchmaker has not recorded stays `null` so the scorer can treat it as
 * unknown instead of inventing a negative answer.
 */

export const JOURNEY_STAGES = [
  "New Lead",
  "Onboarding",
  "Profile Incomplete",
  "Verified",
  "Matchmaking",
  "Introduction Sent",
  "Meeting Scheduled",
  "Follow-up",
  "Converted",
  "On Hold",
] as const;

export type JourneyStage = (typeof JOURNEY_STAGES)[number];
export type Gender = "woman" | "man" | "nonbinary";
export type MaritalStatus = "Never married" | "Divorced" | "Widowed";
export type VerificationState = "Verified" | "Pending" | "Unverified";
export type NoteType = "Call" | "Meeting" | "General" | "Follow-up";
export type InteractionStatus = "shortlisted" | "dismissed" | "sent";

/**
 * The three-state answer used for children, pets, and relocation.
 *
 * The assessment specifies Yes / No / Maybe rather than free text or
 * multi-value lists, which keeps the comparison honest: "Maybe" is a real
 * answer, not a missing value.
 */
export type TriState = "Yes" | "Maybe" | "No";

export const TRI_STATES: readonly TriState[] = ["Yes", "Maybe", "No"];

export interface PartnerPreferences {
  ageMin: number | null;
  ageMax: number | null;
  heightMinCm: number | null;
  heightMaxCm: number | null;
  cities: string[];
  maritalStatuses: MaritalStatus[];
  professions: string[];
  education: string[];
  languages: string[];
  childrenPreference: TriState | null;
  relocation: TriState | null;
  petsPreference: TriState | null;
  relationshipTimeline: string | null;
  values: string[];
  interests: string[];
  strict: Array<"age" | "height" | "city" | "maritalStatus" | "childrenPreference" | "relocation">;
  dealBreakers: string[];
}

export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  gender: Gender;
  dateOfBirth: string | null;
  country: string;
  state: string | null;
  city: string | null;
  heightCm: number | null;
  email: string | null;
  phone: string | null;
  maritalStatus: MaritalStatus | null;
  languages: string[];
  college: string | null;
  degree: string | null;
  company: string | null;
  designation: string | null;
  profession: string | null;
  /** Annual income in INR. Numeric so relative-income comparisons are exact. */
  annualIncomeInr: number | null;
  siblings: number | null;
  familyStructure: string | null;
  religion: string | null;
  /** Caste or community, only ever supplied explicitly by the fictional profile. */
  caste: string | null;
  motherTongue: string | null;
  familyLocation: string | null;
  familyValues: string | null;
  childrenPreference: TriState | null;
  relocation: TriState | null;
  petsPreference: TriState | null;
  smokingPreference: string | null;
  drinkingPreference: string | null;
  lifestyle: string[];
  hobbies: string[];
  values: string[];
  relationshipTimeline: string | null;
  verification: VerificationState;
  verificationMethod: string | null;
  consent: "Consented to demo" | "Pending";
  stage: JourneyStage;
  preferences: PartnerPreferences;
  /**
   * Owning matchmaker. `null` marks a candidate in the shared pool; a value
   * marks an assigned customer. Replaces the previous `assigned` boolean so
   * ownership is real data rather than a hardcoded name.
   */
  assignedMatchmakerId: string | null;
  profileCompleteness: number;
  lastActivityAt: string;
  prompt: string | null;
}

export interface MatchInteraction {
  customerId: string;
  candidateId: string;
  status: InteractionStatus;
  updatedAt: string;
}

export interface MatchNote {
  id: string;
  profileId: string;
  author: string;
  type: NoteType;
  text: string;
  createdAt: string;
}

export interface ActivityEvent {
  id: string;
  profileId: string;
  type: "stage" | "note" | "shortlist" | "dismiss" | "introduction" | "draft";
  description: string;
  createdAt: string;
  relatedProfileId?: string;
}

export interface Introduction {
  id: string;
  customerId: string;
  candidateId: string;
  recipient: string;
  introText: string;
  status: "Sent (Demo)";
  createdAt: string;
}

/**
 * A matchmaker account. Passwords are stored as scrypt hashes with a per-account
 * salt; the demo seed uses fixed salts so the dataset stays reproducible.
 */
export interface Matchmaker {
  id: string;
  name: string;
  initials: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
}

export interface DemoStore {
  matchmakers: Matchmaker[];
  profiles: Profile[];
  interactions: MatchInteraction[];
  notes: MatchNote[];
  activities: ActivityEvent[];
  introductions: Introduction[];
}

/** A customer is a profile owned by a matchmaker; candidates have no owner. */
export function isClient(profile: Pick<Profile, "assignedMatchmakerId">): boolean {
  return profile.assignedMatchmakerId !== null;
}

export function isCandidate(profile: Pick<Profile, "assignedMatchmakerId">): boolean {
  return profile.assignedMatchmakerId === null;
}

export function isAssignedTo(profile: Pick<Profile, "assignedMatchmakerId">, matchmakerId: string): boolean {
  return profile.assignedMatchmakerId === matchmakerId;
}

/** Format a numeric annual income as Indian lakhs per annum. */
export function formatIncome(annualIncomeInr: number | null): string | null {
  if (annualIncomeInr === null) return null;
  const lakhs = annualIncomeInr / 100_000;
  return `₹${Number.isInteger(lakhs) ? lakhs : lakhs.toFixed(1)} LPA`;
}

export function getAge(dateOfBirth: string | null, now = new Date()): number | null {
  if (!dateOfBirth) return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) return null;
  const date = new Date(`${dateOfBirth}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== dateOfBirth || date > now) return null;
  let age = now.getUTCFullYear() - date.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - date.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < date.getUTCDate())) age -= 1;
  return age >= 18 && age <= 110 ? age : null;
}

export function profileName(profile: Pick<Profile, "firstName" | "lastName">): string {
  return `${profile.firstName} ${profile.lastName}`;
}
