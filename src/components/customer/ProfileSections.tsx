import { CalendarDays, FileText, UserRound, Users } from "lucide-react";
import { DetailField, DetailSection, readable } from "@/components/customer/fields";
import { formatIncome, getAge } from "@/domain/types";
import type { Profile } from "@/domain/types";

export function ProfileSummarySection({ profile, now }: { profile: Profile; now: Date }) {
  const age = getAge(profile.dateOfBirth, now);
  return (
    <>
      <DetailSection title="Personal" icon={<UserRound size={15} />}>
        <DetailField label="Date of birth" value={profile.dateOfBirth ? new Date(`${profile.dateOfBirth}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : null} />
        <DetailField label="Age" value={age === null ? null : `${age} years`} />
        <DetailField label="Gender" value={readable(profile.gender)} />
        <DetailField label="Height" value={profile.heightCm ? `${profile.heightCm} cm` : null} />
        <DetailField label="Country" value={profile.country} />
        <DetailField label="State / region" value={profile.state} />
        <DetailField label="Languages" value={profile.languages.join(", ")} />
        <DetailField label="Email" value={profile.email} sensitive />
        <DetailField label="Phone" value={profile.phone} sensitive />
      </DetailSection>

      <DetailSection title="Education & career" icon={<FileText size={15} />}>
        <DetailField label="College" value={profile.college} />
        <DetailField label="Degree" value={profile.degree} />
        <DetailField label="Company" value={profile.company} />
        <DetailField label="Designation" value={profile.designation} />
        <DetailField label="Profession" value={profile.profession} />
        <DetailField label="Annual income" value={formatIncome(profile.annualIncomeInr)} />
      </DetailSection>

      <DetailSection title="Family & background" icon={<Users size={15} />}>
        <DetailField label="Family structure" value={profile.familyStructure} />
        <DetailField label="Siblings" value={profile.siblings} />
        <DetailField label="Family values" value={profile.familyValues} />
        <DetailField label="Family location" value={profile.familyLocation} />
        <DetailField label="Religion" value={profile.religion} sensitive />
        <DetailField label="Caste / community" value={profile.caste} sensitive />
        <DetailField label="Mother tongue" value={profile.motherTongue} />
      </DetailSection>

      <DetailSection title="Lifestyle & future" icon={<CalendarDays size={15} />}>
        <DetailField label="Children preference" value={profile.childrenPreference} />
        <DetailField label="Open to relocate" value={profile.relocation} />
        <DetailField label="Pets" value={profile.petsPreference} />
        <DetailField label="Smoking" value={profile.smokingPreference} />
        <DetailField label="Drinking" value={profile.drinkingPreference} />
        <DetailField label="Timeline" value={profile.relationshipTimeline} />
        <DetailField label="Lifestyle" value={profile.lifestyle.join(", ")} />
        <DetailField label="Interests" value={profile.hobbies.join(", ")} />
        <DetailField label="Values" value={profile.values.join(", ")} />
        <DetailField label="Profile prompt" value={profile.prompt} />
      </DetailSection>
    </>
  );
}
