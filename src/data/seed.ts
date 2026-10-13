import type { ActivityEvent, DemoStore, Gender, JourneyStage, MaritalStatus, PartnerPreferences, Profile } from "@/domain/types";

const FIRST_NAMES = [
  "Aarav", "Aditi", "Aditya", "Ananya", "Arjun", "Avni", "Dev", "Diya", "Ishaan", "Ira",
  "Kabir", "Kiara", "Krish", "Meera", "Neel", "Nisha", "Rohan", "Riya", "Samar", "Tara",
  "Ved", "Zoya", "Ayaan", "Myra", "Reyansh", "Siya", "Vihaan", "Anika", "Vivaan", "Ishita",
  "Aarohi", "Kian", "Navya", "Rehan", "Sana", "Yash", "Naina", "Om", "Ishaan", "Prisha",
];
const LAST_NAMES = [
  "Mehta", "Rao", "Kapoor", "Iyer", "Shah", "Menon", "Khanna", "Nair", "Bose", "Kulkarni",
  "Reddy", "Sethi", "Desai", "Mukherjee", "Pillai", "Malhotra", "Joshi", "Chatterjee", "Bhat", "Sen",
];
const LOCATIONS = [
  ["Mumbai", "Maharashtra"], ["Bengaluru", "Karnataka"], ["Delhi", "Delhi"], ["Pune", "Maharashtra"],
  ["Hyderabad", "Telangana"], ["Chennai", "Tamil Nadu"], ["Kolkata", "West Bengal"], ["Ahmedabad", "Gujarat"],
  ["Jaipur", "Rajasthan"], ["Kochi", "Kerala"], ["Indore", "Madhya Pradesh"], ["Chandigarh", "Chandigarh"],
  ["Lucknow", "Uttar Pradesh"], ["Coimbatore", "Tamil Nadu"], ["Nagpur", "Maharashtra"], ["Guwahati", "Assam"],
];
const LANGUAGES = ["Hindi", "English", "Bengali", "Tamil", "Telugu", "Marathi", "Gujarati", "Kannada", "Malayalam", "Punjabi"];
const PROFESSIONS = ["Product designer", "Software engineer", "Architect", "Doctor", "Teacher", "Founder", "Data analyst", "Consultant", "Finance manager", "Researcher", "Marketing lead", "Civil engineer"];
const DEGREES = ["B.Tech", "MBA", "B.Des", "MBBS", "M.Sc", "B.Arch", "M.Com", "M.A."];
const COMPANIES = ["Northstar Labs", "Cedar & Co.", "Monsoon Health", "Paperplane Studio", "Harbor Analytics", "Juniper Works", "Aster Learning", "Fieldnote Systems"];
const INTERESTS = ["Weekend hikes", "Cooking for friends", "Live music", "Independent films", "Badminton", "Reading", "Pottery", "Travel planning", "Classical music", "Street food", "Photography", "Gardening"];
const VALUES = ["Kindness", "Curiosity", "Family", "Open communication", "Growth", "Community", "Humour", "Balance"];
const STAGES: JourneyStage[] = ["Matchmaking", "Verified", "Onboarding", "Follow-up", "Meeting Scheduled", "Profile Incomplete", "Introduction Sent", "On Hold", "New Lead", "Converted"];
const MARITAL: MaritalStatus[] = ["Never married", "Never married", "Never married", "Divorced", "Widowed"];
const CHILDREN = ["Want children", "Open to children", "Do not want children", "Has children"] as const;
const TIMELINES = ["Within 1–2 years", "Within 2–3 years", "Open to the right person", "No fixed timeline"];
const STRUCTURES = ["Nuclear family", "Joint family", "Close-knit extended family"];
const LIFESTYLES = ["Vegetarian", "Mostly home-cooked", "Fitness routine", "Social weekends", "Early riser", "Non-smoker"];

function pick<T>(items: readonly T[], seed: number): T {
  return items[Math.abs(seed) % items.length];
}

function list<T>(items: readonly T[], seed: number, count: number): T[] {
  const result: T[] = [];
  for (let offset = 0; offset < count; offset += 1) {
    const value = pick(items, seed + offset * 7);
    if (!result.includes(value)) result.push(value);
  }
  return result;
}

function preferences(age: number, city: string, seed: number): PartnerPreferences {
  const min = Math.max(24, age - 5 - (seed % 3));
  const max = Math.min(45, age + 5 + (seed % 4));
  const strict: PartnerPreferences["strict"] = [];
  if (seed % 3 !== 0) strict.push("age");
  if (seed % 5 === 0) strict.push("maritalStatus");
  if (seed % 7 === 0) strict.push("city");
  if (seed % 11 === 0) strict.push("relocation");
  return {
    ageMin: seed % 13 === 0 ? null : min,
    ageMax: seed % 13 === 0 ? null : max,
    heightMinCm: seed % 4 === 0 ? 150 + (seed % 5) : null,
    heightMaxCm: seed % 4 === 0 ? 178 + (seed % 7) : null,
    cities: seed % 4 === 0 ? list(LOCATIONS.map(([name]) => name), seed, 3) : [city],
    maritalStatuses: seed % 5 === 0 ? ["Never married"] : ["Never married", "Divorced"],
    professions: seed % 3 === 0 ? list(PROFESSIONS, seed, 3) : [],
    education: seed % 4 === 0 ? list(DEGREES, seed, 2) : [],
    languages: seed % 3 === 0 ? list(LANGUAGES, seed, 2) : [],
    childrenPreference: seed % 4 === 0 ? pick(CHILDREN, seed) : null,
    relocation: seed % 5 === 0 ? "Not open to relocate" : seed % 3 === 0 ? "Open to relocate" : null,
    relationshipTimeline: pick(TIMELINES, seed),
    values: list(VALUES, seed, 3),
    interests: list(INTERESTS, seed, 3),
    strict,
    dealBreakers: strict.length ? [strict.includes("age") ? "Age range" : "Stated preference"] : [],
  };
}

function buildProfile(index: number, assigned: boolean, gender: Gender): Profile {
  const seed = assigned ? index + 5 : index + 101;
  const [city, state] = pick(LOCATIONS, seed * 3);
  const age = 25 + ((seed * 7) % 18);
  const birthYear = 2026 - age;
  const dateOfBirth = seed % 19 === 0 ? null : `${birthYear}-${String((seed % 12) + 1).padStart(2, "0")}-${String((seed % 25) + 1).padStart(2, "0")}`;
  const firstName = pick(FIRST_NAMES, seed * 11 + (gender === "woman" ? 1 : 0));
  const lastName = pick(LAST_NAMES, seed * 13);
  const status = pick(MARITAL, seed * 17);
  const values = list(VALUES, seed * 5, 2 + (seed % 2));
  const hobbies = list(INTERESTS, seed * 9, 3 + (seed % 2));
  const isMissing = (modulo: number) => seed % modulo === 0;
  const stage = assigned ? STAGES[index % STAGES.length] : "Matchmaking";
  const email = `profile-${assigned ? "client" : "candidate"}-${String(index + 1).padStart(3, "0")}@example.test`;
  const phone = `+91-00000-${String(index + 1).padStart(5, "0")}`;
  const completeness = Math.round(([
    firstName, lastName, dateOfBirth, city, state, status, hobbies.length, values.length,
    isMissing(8) ? null : pick(PROFESSIONS, seed * 19), isMissing(9) ? null : pick(DEGREES, seed * 23),
    isMissing(10) ? null : pick(LANGUAGES, seed * 29), isMissing(6) ? null : 155 + (seed % 30),
  ].filter(Boolean).length / 12) * 100);
  return {
    id: `${assigned ? "client" : "candidate"}-${String(index + 1).padStart(3, "0")}`,
    firstName,
    lastName,
    gender,
    dateOfBirth,
    country: "India",
    state: isMissing(17) ? null : state,
    city: isMissing(23) ? null : city,
    heightCm: isMissing(6) ? null : 150 + ((seed * 3) % 32),
    email: assigned ? email : isMissing(31) ? null : email,
    phone: assigned ? phone : isMissing(29) ? null : phone,
    maritalStatus: isMissing(27) ? null : status,
    languages: list(LANGUAGES, seed * 29, 1 + (seed % 3)),
    college: isMissing(8) ? null : `${pick(["IIT", "NID", "University of", "St. Xavier’s", "National Institute of"], seed)} ${pick(["Mumbai", "Delhi", "Pune", "Madras", "Bengaluru", "Calcutta"], seed * 2)}`,
    degree: isMissing(9) ? null : pick(DEGREES, seed * 23),
    company: isMissing(10) ? null : pick(COMPANIES, seed * 31),
    designation: isMissing(11) ? null : pick(["Senior", "Lead", "Associate", "Principal", "Product", "Staff"], seed * 7),
    profession: isMissing(10) ? null : pick(PROFESSIONS, seed * 19),
    incomeBand: isMissing(7) ? null : pick(["₹10–15 LPA", "₹15–25 LPA", "₹25–40 LPA", "₹40–60 LPA", "Prefer not to say"], seed * 37),
    siblings: isMissing(13) ? null : seed % 4,
    familyStructure: isMissing(9) ? null : pick(STRUCTURES, seed * 3),
    religion: seed % 4 === 0 ? pick(["Hindu", "Muslim", "Christian", "Sikh", "Jain"], seed * 41) : null,
    community: seed % 10 === 0 ? pick(["Not specified", "Community A", "Community B"], seed) : null,
    motherTongue: isMissing(15) ? null : pick(LANGUAGES, seed * 43),
    familyLocation: isMissing(14) ? null : pick(LOCATIONS.map(([name]) => name), seed * 47),
    familyValues: isMissing(12) ? null : pick(["Progressive", "Balanced", "Traditional", "Prefer to discuss"], seed * 53),
    childrenPreference: isMissing(12) ? null : pick(CHILDREN, seed * 59),
    relocation: isMissing(8) ? null : seed % 2 === 0 ? "Open to relocate" : "Not open to relocate",
    petsPreference: isMissing(10) ? null : pick(["Loves pets", "Open to pets", "No pets"], seed * 61),
    smokingPreference: isMissing(5) ? null : pick(["Does not smoke", "Prefer to discuss", "Occasionally"], seed * 83),
    drinkingPreference: isMissing(6) ? null : pick(["Does not drink", "Socially", "Prefer to discuss"], seed * 89),
    lifestyle: list(LIFESTYLES, seed * 67, 2 + (seed % 3)),
    hobbies,
    values,
    relationshipTimeline: isMissing(13) ? null : pick(TIMELINES, seed * 71),
    verification: pick(["Verified", "Pending", "Unverified"] as const, seed * 73),
    verificationMethod: seed % 3 === 0 ? "Phone and photo review" : seed % 3 === 1 ? "Phone" : null,
    consent: "Consented to demo",
    stage,
    preferences: preferences(age, city, seed),
    assigned,
    profileCompleteness: completeness,
    lastActivityAt: new Date(Date.UTC(2026, 8, 29 - (seed % 27), 9 + (seed % 9))).toISOString(),
    prompt: seed % 3 === 0 ? `A small thing that makes my week: ${pick(INTERESTS, seed * 79).toLowerCase()}.` : null,
  };
}

function event(id: string, profileId: string, type: ActivityEvent["type"], description: string, daysAgo: number, relatedProfileId?: string): ActivityEvent {
  return {
    id,
    profileId,
    type,
    description,
    createdAt: new Date(Date.UTC(2026, 9, 13 - daysAgo, 10, 30)).toISOString(),
    ...(relatedProfileId ? { relatedProfileId } : {}),
  };
}

export function createSeedStore(): DemoStore {
  const clients = Array.from({ length: 12 }, (_, index) => buildProfile(index, true, index % 2 === 0 ? "man" : "woman"));
  const candidates = Array.from({ length: 120 }, (_, index) => buildProfile(index, false, index % 2 === 0 ? "woman" : "man"));
  const profiles = [...clients, ...candidates];
  const interactions = [
    { customerId: clients[0].id, candidateId: candidates[0].id, status: "shortlisted" as const, updatedAt: "2026-10-12T12:00:00.000Z" },
    { customerId: clients[0].id, candidateId: candidates[4].id, status: "shortlisted" as const, updatedAt: "2026-10-11T12:00:00.000Z" },
    { customerId: clients[2].id, candidateId: candidates[8].id, status: "shortlisted" as const, updatedAt: "2026-10-10T12:00:00.000Z" },
    { customerId: clients[1].id, candidateId: candidates[3].id, status: "dismissed" as const, updatedAt: "2026-10-09T12:00:00.000Z" },
    { customerId: clients[0].id, candidateId: candidates[2].id, status: "sent" as const, updatedAt: "2026-10-08T12:00:00.000Z" },
    { customerId: clients[3].id, candidateId: candidates[5].id, status: "sent" as const, updatedAt: "2026-10-07T12:00:00.000Z" },
    { customerId: clients[4].id, candidateId: candidates[6].id, status: "sent" as const, updatedAt: "2026-10-06T12:00:00.000Z" },
    { customerId: clients[5].id, candidateId: candidates[7].id, status: "sent" as const, updatedAt: "2026-10-05T12:00:00.000Z" },
  ];
  const introductions = interactions.filter((interaction) => interaction.status === "sent").map((interaction, index) => {
    const client = clients.find((profile) => profile.id === interaction.customerId)!;
    const candidate = candidates.find((profile) => profile.id === interaction.candidateId)!;
    return {
      id: `seed-introduction-${index + 1}`,
      customerId: client.id,
      candidateId: candidate.id,
      recipient: `matchmaker@thedatecrew.demo`,
      introText: `I’d love to introduce ${client.firstName} and ${candidate.firstName}. You both value thoughtful conversation and are exploring a long-term partnership.`,
      status: "Sent (Demo)" as const,
      createdAt: interaction.updatedAt,
    };
  });
  const notes = [
    { id: "seed-note-1", profileId: clients[0].id, author: "Maya Shah", type: "Call" as const, text: "Enjoyed our conversation. Looking for someone curious, kind, and open to building a life in Bengaluru.", createdAt: "2026-10-12T10:00:00.000Z" },
    { id: "seed-note-2", profileId: clients[2].id, author: "Maya Shah", type: "Meeting" as const, text: "Reviewed profile together. They would like introductions to feel intentional and low-pressure.", createdAt: "2026-10-10T11:30:00.000Z" },
    { id: "seed-note-3", profileId: clients[4].id, author: "Maya Shah", type: "Follow-up" as const, text: "Asked us to prioritize shared values and communication style over a narrow city preference.", createdAt: "2026-10-09T09:15:00.000Z" },
  ];
  const activities: ActivityEvent[] = [
    event("seed-event-1", clients[0].id, "stage", "Profile moved to Matchmaking", 0),
    event("seed-event-2", clients[2].id, "note", "Meeting note added", 1),
    event("seed-event-3", clients[1].id, "introduction", "A demo introduction was sent", 2, candidates[3].id),
    event("seed-event-4", clients[0].id, "shortlist", "Added a profile to shortlist", 3, candidates[0].id),
    event("seed-event-5", clients[4].id, "note", "Follow-up note added", 4),
    event("seed-event-6", clients[3].id, "stage", "Profile moved to Meeting Scheduled", 5),
    event("seed-event-7", clients[5].id, "introduction", "A demo introduction was sent", 6, candidates[7].id),
  ];
  return { profiles, interactions, notes, activities, introductions };
}
