import { randomUUID } from "node:crypto";
import { checkEligibility } from "@/matching/scoring";
import { profileName } from "@/domain/types";
import type { ActivityEvent, DemoStore, MatchInteraction } from "@/domain/types";
import type { ActionPayload } from "@/domain/validation";

function addActivity(store: DemoStore, event: Omit<ActivityEvent, "id" | "createdAt">): void {
  store.activities.unshift({ ...event, id: randomUUID(), createdAt: new Date().toISOString() });
}

function requireProfiles(store: DemoStore, customerId: string, candidateId?: string) {
  const customer = store.profiles.find((profile) => profile.id === customerId);
  if (!customer?.assigned) throw new Error("Customer not found in your assigned accounts.");
  if (!candidateId) return { customer };
  const candidate = store.profiles.find((profile) => profile.id === candidateId);
  if (!candidate || candidate.assigned) throw new Error("Candidate profile was not found.");
  return { customer, candidate };
}

export function applyAction(store: DemoStore, action: ActionPayload, author = "Maya Shah"): void {
  if (action.action === "stage") {
    const profile = store.profiles.find((item) => item.id === action.profileId && item.assigned);
    if (!profile) throw new Error("Assigned customer was not found.");
    const previousStage = profile.stage;
    if (previousStage === action.stage) return;
    profile.stage = action.stage;
    profile.lastActivityAt = new Date().toISOString();
    addActivity(store, { profileId: profile.id, type: "stage", description: `Journey stage changed from ${previousStage} to ${action.stage}.` });
    return;
  }
  if (action.action === "note") {
    const { customer } = requireProfiles(store, action.profileId);
    const note = { id: randomUUID(), profileId: customer.id, author, type: action.type, text: action.text, createdAt: new Date().toISOString() };
    store.notes.unshift(note);
    customer.lastActivityAt = note.createdAt;
    addActivity(store, { profileId: customer.id, type: "note", description: `${action.type} note added.` });
    return;
  }

  const { customer, candidate } = requireProfiles(store, action.customerId, action.candidateId);
  const existing = store.interactions.find((item) => item.customerId === customer.id && item.candidateId === candidate.id);
  if (action.action === "restore") {
    if (existing?.status === "sent") throw new Error("Sent introductions cannot be recalled from the demo outbox.");
    store.interactions = store.interactions.filter((item) => !(item.customerId === customer.id && item.candidateId === candidate.id));
    return;
  }

  const eligibility = checkEligibility(customer, candidate, { interactions: store.interactions, showPreviouslyContacted: true });
  if (!eligibility.eligible) throw new Error(eligibility.reasons[0] || "This pair is not eligible for a recommendation action.");

  if (action.action === "shortlist") {
    if (existing?.status === "sent") throw new Error("An introduction was already sent for this pair.");
    if (existing?.status === "dismissed") throw new Error("Restore this dismissed profile before shortlisting it.");
    if (existing?.status === "shortlisted") {
      store.interactions = store.interactions.filter((item) => item !== existing);
      addActivity(store, { profileId: customer.id, type: "shortlist", description: `Removed ${profileName(candidate)} from the shortlist.`, relatedProfileId: candidate.id });
    } else {
      const interaction: MatchInteraction = { customerId: customer.id, candidateId: candidate.id, status: "shortlisted", updatedAt: new Date().toISOString() };
      store.interactions.push(interaction);
      addActivity(store, { profileId: customer.id, type: "shortlist", description: `Shortlisted ${profileName(candidate)}.`, relatedProfileId: candidate.id });
    }
    customer.lastActivityAt = new Date().toISOString();
    return;
  }

  if (action.action === "dismiss") {
    if (existing?.status === "sent") throw new Error("A sent introduction cannot be dismissed.");
    if (existing) {
      existing.status = "dismissed";
      existing.updatedAt = new Date().toISOString();
    } else {
      store.interactions.push({ customerId: customer.id, candidateId: candidate.id, status: "dismissed", updatedAt: new Date().toISOString() });
    }
    addActivity(store, { profileId: customer.id, type: "dismiss", description: `Dismissed ${profileName(candidate)} from recommendations.`, relatedProfileId: candidate.id });
    customer.lastActivityAt = new Date().toISOString();
    return;
  }

  if (action.action === "send") {
    if (existing?.status === "sent" || store.introductions.some((item) => item.customerId === customer.id && item.candidateId === candidate.id)) {
      throw new Error("An introduction has already been sent for this pair.");
    }
    if (existing?.status === "dismissed") throw new Error("Restore this dismissed profile before sending an introduction.");
    const timestamp = new Date().toISOString();
    const introduction = {
      id: randomUUID(),
      customerId: customer.id,
      candidateId: candidate.id,
      recipient: customer.email || "matchmaker@thedatecrew.demo",
      introText: action.introText,
      status: "Sent (Demo)" as const,
      createdAt: timestamp,
    };
    store.introductions.unshift(introduction);
    if (existing) {
      existing.status = "sent";
      existing.updatedAt = timestamp;
    } else {
      store.interactions.push({ customerId: customer.id, candidateId: candidate.id, status: "sent", updatedAt: timestamp });
    }
    addActivity(store, { profileId: customer.id, type: "introduction", description: `Sent a demo introduction to ${profileName(candidate)}.`, relatedProfileId: candidate.id });
    if (customer.stage !== "Introduction Sent") {
      const previousStage = customer.stage;
      customer.stage = "Introduction Sent";
      addActivity(store, { profileId: customer.id, type: "stage", description: `Journey stage changed from ${previousStage} to Introduction Sent.` });
    }
    customer.lastActivityAt = timestamp;
  }
}
