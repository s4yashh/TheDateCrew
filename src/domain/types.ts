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
export type ChildrenPreference = "Want children" | "Do not want children" | "Open to children" | "Has children";
export type NoteType = "Call" | "Meeting" | "General" | "Follow-up";
export type InteractionStatus = "shortlisted" | "dismissed" | "sent";

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
  childrenPreference: ChildrenPreference | null;
  relocation: "Open to relocate" | "Not open to relocate" | null;
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
  incomeBand: string | null;
  siblings: number | null;
  familyStructure: string | null;
  religion: string | null;
  community: string | null;
  motherTongue: string | null;
  familyLocation: string | null;
  familyValues: string | null;
  childrenPreference: ChildrenPreference | null;
  relocation: "Open to relocate" | "Not open to relocate" | null;
  petsPreference: string | null;
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
  assigned: boolean;
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

export interface DemoStore {
  profiles: Profile[];
  interactions: MatchInteraction[];
  notes: MatchNote[];
  activities: ActivityEvent[];
  introductions: Introduction[];
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
