import { describe, expect, it } from "vitest";
import { createSeedStore } from "@/data/seed";
import { scopeStoreToMatchmaker } from "@/data/scope";

const store = createSeedStore();

describe("matchmaker data scoping", () => {
  it("returns only the caller's customers plus the shared candidate pool", () => {
    const scoped = scopeStoreToMatchmaker(store, "mm-001");
    const clients = scoped.profiles.filter((profile) => profile.assignedMatchmakerId !== null);
    expect(clients).toHaveLength(6);
    expect(clients.every((profile) => profile.assignedMatchmakerId === "mm-001")).toBe(true);
    expect(scoped.profiles.filter((profile) => profile.assignedMatchmakerId === null)).toHaveLength(200);
  });

  it("drops the other matchmaker's notes, activity, interactions, and introductions", () => {
    const scoped = scopeStoreToMatchmaker(store, "mm-002");
    const ownIds = new Set(
      store.profiles.filter((profile) => profile.assignedMatchmakerId === "mm-002").map((profile) => profile.id),
    );
    expect(scoped.notes.every((note) => ownIds.has(note.profileId))).toBe(true);
    expect(scoped.activities.every((activity) => ownIds.has(activity.profileId))).toBe(true);
    expect(scoped.interactions.every((interaction) => ownIds.has(interaction.customerId))).toBe(true);
    expect(scoped.introductions.every((introduction) => ownIds.has(introduction.customerId))).toBe(true);
    expect(scoped.notes.some((note) => note.author === "Arjun Rao")).toBe(true);
    expect(scoped.notes.some((note) => note.author === "Maya Shah")).toBe(false);
  });

  it("does not expose other matchmaker credentials", () => {
    const scoped = scopeStoreToMatchmaker(store, "mm-001");
    expect(scoped.matchmakers).toHaveLength(1);
    expect(scoped.matchmakers[0].email).toBe("maya@thedatecrew.demo");
  });
});
