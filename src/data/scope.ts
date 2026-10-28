import type { DemoStore } from "@/domain/types";

/**
 * Reduce the shared snapshot to what one matchmaker is allowed to see.
 *
 * Candidates are a shared pool, but customers, notes, interactions, activity,
 * and introductions belong to the customer's owner. This is the server-side
 * authorisation boundary; the client never filters for security.
 */
export function scopeStoreToMatchmaker(store: DemoStore, matchmakerId: string): DemoStore {
  const clientIds = new Set(
    store.profiles
      .filter((profile) => profile.assignedMatchmakerId === matchmakerId)
      .map((profile) => profile.id),
  );
  return {
    matchmakers: store.matchmakers.filter((matchmaker) => matchmaker.id === matchmakerId),
    profiles: store.profiles.filter(
      (profile) => profile.assignedMatchmakerId === matchmakerId || profile.assignedMatchmakerId === null,
    ),
    interactions: store.interactions.filter((interaction) => clientIds.has(interaction.customerId)),
    notes: store.notes.filter((note) => clientIds.has(note.profileId)),
    activities: store.activities.filter((activity) => clientIds.has(activity.profileId)),
    introductions: store.introductions.filter((introduction) => clientIds.has(introduction.customerId)),
  };
}
